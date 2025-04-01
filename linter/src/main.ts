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
import { patchDefaultConfiguration, findVersion, generate, scanInputDirs } from "@idlizer/core"

const options = program
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--aux-input-dir <path>', 'Path to aux input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('-r,--recursive', 'Scan input directory recursively', false)
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

function processInputOption(option: string | undefined): string[] {
    if (!option) return []
    if (typeof option === 'string') {
        return option.split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    return []
}

export type InputPaths = {
    baseDirs: string[]
    inputDirs: string[]
    auxInputDirs: string[]
    inputFiles: string[]
    auxInputFiles: string[]
    libraryPackages: string[]
}
function formatInputPaths(options: any): InputPaths {
    if (options.inputFiles && typeof options.inputFiles === 'string') {
        options.inputFiles = processInputOption(options.inputFiles)
    }

    if (options.auxInputFiles && typeof options.auxInputFiles === 'string') {
        options.auxInputFiles = processInputOption(options.auxInputFiles)
    }

    if (options.inputDir && typeof options.inputDir === 'string') {
        options.inputDir = processInputOption(options.inputDir)
    }

    if (options.auxInputDir && typeof options.auxInputDir === 'string') {
        options.auxInputDir = processInputOption(options.auxInputDir)
    }

    if (options.libraryPackages && typeof options.libraryPackages === 'string') {
        options.libraryPackages = processInputOption(options.libraryPackages)
    }

    const inputDirs: string[] = options.inputDir || []
    const auxInputDirs: string[] = options.auxInputDir || []
    const inputFiles: string[] = options.inputFiles || []
    const auxInputFiles: string[] = options.auxInputFiles || []
    const libraryPackages: string[] = options.libraryPackages || []

    let baseDirs = options.baseDir ? processInputOption(options.baseDir) : inputDirs
    if (!baseDirs.length && inputFiles.length) {
        baseDirs = [...(new Set<string>(options.inputFiles.map((it:string) => path.dirname(it))).values())]
    }
    if (!baseDirs.length)
        throw new Error("Check your --base-dir parameter, value is missing")

    return {
        baseDirs,
        inputDirs,
        auxInputDirs,
        inputFiles,
        auxInputFiles,
        libraryPackages
    }
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

    patchDefaultConfiguration({
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
    })

    const { baseDirs, inputDirs, auxInputDirs, inputFiles, auxInputFiles } = formatInputPaths(options)
    validatePaths(baseDirs, "dir")
    validatePaths(inputDirs, "dir")
    validatePaths(auxInputDirs, "dir")
    validatePaths(inputFiles, "file")
    validatePaths(auxInputFiles, "file")
    const dtsInputFiles = scanInputDirs(inputDirs).concat(inputFiles).filter(it => it.endsWith('.d.ts'))

    const allEntries = new Array<LinterMessage[]>()
    generate(
        baseDirs,
        [...inputDirs, ...auxInputDirs],
        dtsInputFiles,
        [],
        options.outputDir,
        path.resolve(__dirname, "..", "stdlib.d.ts"),
        (sourceFile, program, compilerHost) => new LinterVisitor(sourceFile, program, compilerHost),
        {
            compilerOptions: defaultCompilerOptions,
            recursive: options.recursive,
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
