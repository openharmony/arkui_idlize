/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { outputDiagnosticResultsFormatted, parseIDLFile, setFormatterLogger } from "@idlizer/core"
import { getIO, forkWith, continueWith, CURRENT_LOG_LEVEL, logger, TerminateError } from "@idlizer/kit"
import { buildSelectors, GeneratorSeed, roll } from "./generator"
import { createLibrary } from "./library"
import { install } from "./install"
import { readConfig } from "./config"
import { join } from "node:path"
import { doInputDiagnostics } from "./diagnostics"

const io = getIO()

///

async function read(paths: string[]) {
    const files: string[] = []
    for (const path of paths) {
        files.push(... await io.scan(path))
    }
    return files.map(file => parseIDLFile(file))
}

async function main() {

    const config = await readConfig(process.cwd())
    const files = await read(config.declarations.source)
    const library = createLibrary(files, config)
    logger.info("Configured")
    const diagnosticResult = doInputDiagnostics(library)
    if (diagnosticResult.entries.length) {
        setFormatterLogger((...msg) => logger.error(...msg))
        outputDiagnosticResultsFormatted(diagnosticResult)
        if (diagnosticResult.hasErrors) {
            process.exitCode = -1
            return
        }
    }

    logger.info("Generating")
    const { declarations } = continueWith({
        library: { library, selector: buildSelectors() },
        createEffect: () => undefined,
        seedType: GeneratorSeed,
        roots: { seeds: library.rootDeclarations().map(ref => GeneratorSeed.create({ typeToGenerate: ref })) },
    }, roll)

    logger.info("Installing")
    await install(config.generated.output, declarations, library.allPackages(['framework']))

    if (config.generated.outputReport) {
        const report = library.prepareReport()
        await io.mkdir(config.generated.outputReport, { recursive: true })
        await io.writeFile(join(config.generated.outputReport, 'GENERATED_STATE.md'), report)
    }

    logger.info("Done")
}

const TERMINATE_USER_MESSAGE = `
Oh no!
Looks like the generator was terminated unexpectedly.
`

function reportError(error: unknown) {
    // order is important!
    if (error instanceof TerminateError) {
        logger.error(error.message)
        return
    }
    // fallback, must be last option
    if (error instanceof Error) {
        logger.error(error.message)
        return
    }
}

function handleError(error: unknown) {
    logger.error(TERMINATE_USER_MESSAGE)
    process.exitCode = -1
    reportError(error)
    if (CURRENT_LOG_LEVEL === 'debug') {
        throw error
    }
}

forkWith(() => main().catch(handleError))
