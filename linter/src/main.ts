/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
import { program } from "commander"
import * as fs from "fs"
import * as path from "path"
import * as ts from "typescript"

import { LinterVisitor, toLinterString } from "./linter"
import { LinterMessage } from "./LinterMessage"
import { CoreConfiguration, defaultCoreConfuguration, findVersion, generate, setDefaultConfiguration } from "@idlizer/core"

const options = program
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <name>', 'Name of file to convert, all files in input-dir if none')
    .option('--suppress-errors <suppress>', 'Error codes to suppress, comma separated, no space')
    .option('--whitelist <whitelist.json>', 'Whitelist for linter')
    .parse()
    .opts()

const defaultCompilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    noLib: true,
    types: []
}

const defaultLinterConfiguration: CoreConfiguration = {
    ...defaultCoreConfuguration,
    rootComponents: [
        "Root",
        "ComponentRoot",
        "CommonMethod",
        "SecurityComponentMethod",
        "CommonTransition",
        "CalendarAttribute",
        "ContainerSpanAttribute",
    ],
    standaloneComponents: [
        "TextPickerDialog",
        "TimePickerDialog",
        "AlertDialog",
        "CanvasPattern"
    ]
}

function processInputOption(option: string | undefined): string[] {
    if (!option) return []
    if (typeof option === 'string') {
        return option.split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    return []
}

function formatInputPaths(options: any): { inputDirs: string[]; inputFiles: string[] } {
    if (options.inputFiles && typeof options.inputFiles === 'string') {
        options.inputFiles = processInputOption(options.inputFiles)
    }

    if (options.inputDir && typeof options.inputDir === 'string') {
        options.inputDir = processInputOption(options.inputDir)
    }

    const inputDirs: string[] = options.inputDir || []
    const inputFiles: string[] = options.inputFiles || []

    return { inputDirs, inputFiles }
}

function validatePaths(paths: string[], type: 'file' | 'dir'): void {
    paths.forEach(pathItem => {
        if (!fs.existsSync(pathItem)) {
            console.error(`Input ${type} does not exist: ${pathItem}`)
            process.exit(1)
        } else {
            console.log(`Input ${type} exists: ${pathItem}`)
        }
    })
}

function main() {
    console.log(`IDLize Linter version ${findVersion()}`)

    setDefaultConfiguration(defaultLinterConfiguration)

    const { inputDirs, inputFiles } = formatInputPaths(options)
    validatePaths(inputDirs, 'dir')
    validatePaths(inputFiles, 'file')

    const allEntries = new Array<LinterMessage[]>()
    generate(
        inputDirs,
        inputFiles,
        options.outputDir,
        (sourceFile, typeChecker) => new LinterVisitor(sourceFile, typeChecker),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: LinterMessage[]) => allEntries.push(entries),
            onBegin: () => { },
            onEnd: (outputDir) => {
                const outFile = options.outputDir ? path.join(outputDir, "linter.txt") : undefined
                const histogramFile = options.outputDir ? path.join(outputDir, "histogram.txt") : undefined
                let [generated, exitCode, histogram] = toLinterString(allEntries, options.suppressErrors, options.whitelist)
                console.log(histogram)
                if (!outFile || options.verbose) console.log(generated)
                if (outFile) fs.writeFileSync(outFile, generated)
                if (histogramFile) fs.writeFileSync(histogramFile, histogram)
                process.exit(exitCode)
            }
        }
    )
}

main()
