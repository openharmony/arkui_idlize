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
import { createCommand } from "commander"
import {
    findVersion,
    formatInputPaths,
    scanInputDirs,
    validatePaths,
    expandResponseFile
} from "@idlizer/core"
import { generateFromSts } from "./generate"
import { join, resolve } from "node:path"
import { cpSync } from "node:fs"
import { ETSGEN_ROOT, loadEtsgenConfiguration } from "./config"
import { resolveSymlinks } from "./utils"

export function etsgen(argv:string[]) {
    const program = createCommand()
        .option('--ets2idl', 'Convert .d.ts to IDL definitions')
        .option('--input-dir <path>', 'Path to input dir(s), comma separated')
        .option('--exclude <patterns>', 'Paths to exclude from input-dir scan')
        .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
        .option('--output-dir <path>', 'Path to output dir')
        .option('--input-files <files...>', 'Comma-separated list of specific files to process')
        .option('--verify-idl', 'Verify produced IDL')
        .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
        .option('--version')
        .option('--options-file <path...>', 'Path to generator configuration options file (appends to defaults). Use --ignore-default-config to override default options.')
        .option('--ignore-default-config', 'Use with --options-file to override default generator configuration options.', false)
        .option('--ets-config <path>', 'Path to ets config file', join(ETSGEN_ROOT, "config.json"))
        .option('--trace-status <filename>', 'Add trace information to generated IDL and save status in specified file')
    const options = program
        .parse(argv, { from: 'user' })
        .opts()

    if (process.env.npm_package_version) {
        console.log(`IDLize version ${findVersion()}`)
    }

    const { baseDirs, inputDirs, auxInputDirs, inputFiles, auxInputFiles } = formatInputPaths(options)

    // Expand response file if present (for large file lists)
    const expandedInputFiles = inputFiles.length === 1 && inputFiles[0].startsWith('@')
        ? expandResponseFile(inputFiles[0].slice(1))
        : inputFiles
    const expandedAuxInputFiles = auxInputFiles.length === 1 && auxInputFiles[0].startsWith('@')
        ? expandResponseFile(auxInputFiles[0].slice(1))
        : auxInputFiles

    validatePaths(baseDirs, "dir")
    validatePaths(inputDirs, "dir")
    validatePaths(auxInputDirs, "dir")
    validatePaths(expandedInputFiles, "file")
    validatePaths(expandedAuxInputFiles, "file")

    const detsInputFiles = scanInputDirs(inputDirs, (it) => it.endsWith("d.ets"), true).concat(expandedInputFiles)

    if (options.ets2idl) {
        const { inputDirs, inputFiles } = formatInputPaths(options)
        const expandedInputFiles = inputFiles.length === 1 && inputFiles[0].startsWith('@')
            ? expandResponseFile(inputFiles[0].slice(1))
            : inputFiles
        validatePaths(inputDirs, 'dir')
        validatePaths(expandedInputFiles, 'file')
        generateFromSts({
            inputFiles: detsInputFiles.map(it => resolveSymlinks(resolve(it))),
            baseDir: resolveSymlinks(resolve(options.baseDir)),
            outDir: resolve(options.outputDir),
            etsConfigPath: resolveSymlinks(resolve(options.etsConfig)),
            traceStatus: options.traceStatus,
            config: loadEtsgenConfiguration([
                ...(options.optionsFile ?? [])
            ])
        })
       return
    }

    if (options.idl2sts) {
        throw new Error("Not yet implemented")
    }

    program.help()
}
