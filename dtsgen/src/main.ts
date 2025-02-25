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
import {
    fromIDL,
    generate,
    defaultCompilerOptions,
    idlToDtsString,
    findVersion,
    setDefaultConfiguration,
    Language,
} from "@idlizer/core"
import {
    forEachChild,
    IDLFile,
    toIDLString,
    verifyIDLString
} from "@idlizer/core/idl"
import { formatInputPaths, validatePaths, loadPeerConfiguration, IDLVisitor } from "@idlizer/libohos"

const options = program
    .option('--dts2idl', 'Convert .d.ts to IDL definitions')
    .option('--idl2dts', 'Convert IDL to .d.ts definitions')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--verbose', 'Verbose processing')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--common-to-attributes', 'Transform common attributes as IDL attributes')
    .option('--api-version <version>', "API version for generated peers")
    .option('--dump-serialized', "Dump serialized data")
    .option('--call-log', "Call log")
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--language [ts|ts|java|cangjie]', 'Output language')
    .option('--version')
    .option('--plugin <file>', 'File with generator\'s plugin')
    .option('--default-idl-package <name>', 'Name of the default package for generated IDL')
    .option('--enable-log', 'Enable logging')
    .option('--options-file <path>', 'Path to generator configuration options file (appends to defaults)')
    .option('--override-options-file <path>', 'Path to generator configuration options file (replaces defaults)')
    .option('--arkts-extension <string> [.ts|.ets]', "Generated ArkTS language files extension.", ".ts")
    .parse()
    .opts()

Language.ARKTS.extension = options.arktsExtension as string
setDefaultConfiguration(loadPeerConfiguration(options.optionsFile, options.overrideOptionsFile))

if (process.env.npm_package_version) {
    console.log(`IDLize version ${findVersion()}`)
}

let didJob = false

if (options.dts2idl) {
    const { inputDirs, inputFiles } = formatInputPaths(options)
    validatePaths(inputDirs, 'dir')
    validatePaths(inputFiles, 'file')
    generate(
        inputDirs,
        inputFiles,
        options.outputDir ?? "./idl",
        (sourceFile, program, compilerHost) => new IDLVisitor(sourceFile, program, compilerHost, options),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (file: IDLFile, outputDir, sourceFile) => {
                console.log('producing', path.basename(sourceFile.fileName))
                const outFile = path.join(
                    outputDir,
                    path.basename(sourceFile.fileName).replace(".d.ts", ".idl")
                )

                console.log("saved", outFile)

                const generated = toIDLString(file, {
                    disableEnumInitializers: options.disableEnumInitializers ?? false
                })

                if (options.verbose) {
                    console.log(generated)
                }

                if (!fs.existsSync(path.dirname(outFile))) {
                    fs.mkdirSync(path.dirname(outFile), { recursive: true })
                }
                fs.writeFileSync(outFile, generated)

                if (options.verifyIdl) {
                    verifyIDLString(generated)
                }
            }
        }
    )
    didJob = true
}

if (options.idl2dts) {
    const generatedDtsDir = options.outputDir ?? "./generated/dts/"

    if (options.inputFiles && typeof options.inputFiles === 'string') {
        options.inputFiles = options.inputFiles
            .split(',')
            .map(file => file.trim())
            .filter(Boolean)
    }

    const inputDirs = options.inputDir

    if (typeof options.inputDir === 'string') {
        options.inputDir = options.inputDir.split(',')
            .map(dir => dir.trim())
            .filter(Boolean)
    }

    const inputFiles: string[] = options.inputFiles || []
    inputFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.error(`Input file does not exist: ${file}`)
            process.exit(1)
        } else {
            console.log(`Input file exists: ${file}`)
        }
    })

    fromIDL(
        inputDirs,
        inputFiles,
        generatedDtsDir,
        ".d.ts",
        options.verbose ?? false,
        idlToDtsString
    )
    didJob = true
}

if (!didJob) {
    program.help()
}
