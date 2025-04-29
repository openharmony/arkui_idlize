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
import {
    findVersion,
    setDefaultConfiguration,
    scanInputDirs
} from "@idlizer/core"
import { formatInputPaths, validatePaths, loadPeerConfiguration } from "@idlizer/libohos"
import { generateFromSts } from "./generate"

const options = program
    .option('--ets2idl', 'Convert .d.ts to IDL definitions')
    .option('--idl2ets', 'Convert IDL to .d.sts definitions')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--version')
    .option('--options-file <path>', 'Path to generator configuration options file (appends to defaults). Use --ignore-default-config to override default options.')
    .option('--ignore-default-config', 'Use with --options-file to override default generator configuration options.', false)
    .parse()
    .opts()

if (process.env.npm_package_version) {
    console.log(`IDLize version ${findVersion()}`)
}

let didJob = false

const { baseDirs, inputDirs, auxInputDirs, inputFiles, auxInputFiles } = formatInputPaths(options)
validatePaths(baseDirs, "dir")
validatePaths(inputDirs, "dir")
validatePaths(auxInputDirs, "dir")
validatePaths(inputFiles, "file")
validatePaths(auxInputFiles, "file")

const detsInputFiles = scanInputDirs(inputDirs, (it) => it.endsWith("d.ets"), true).concat(inputFiles)

if (options.ets2idl) {
    const { inputDirs, inputFiles } = formatInputPaths(options)
    validatePaths(inputDirs, 'dir')
    validatePaths(inputFiles, 'file')
    generateFromSts(detsInputFiles, options.baseDir, options.outputDir)
    didJob = true
}

if (options.idl2sts) {
    throw new Error("Not yet implemented")
}

if (!didJob) {
    program.help()
}
