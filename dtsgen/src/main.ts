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
    isDefined,
    verifyIDLLinter,
    PeerLibrary,
    scanInputDirs,
    PeerFile,
    toIDLFile,
    generatorConfiguration,
    IDLLinterError,
} from "@idlizer/core"
import {
    IDLFile,
    isInterface,
    linearizeNamespaceMembers,
    toIDLString,
    verifyIDLString
} from "@idlizer/core/idl"
import { formatInputPaths, validatePaths, loadPeerConfiguration, IDLVisitor, peerGeneratorConfiguration, fillSyntheticDeclarations } from "@idlizer/libohos"
import { runPreprocessor } from "./preprocessor"

const options = program
    .option('--dts2idl', 'Convert .d.ts to IDL definitions')
    .option('--idl2dts', 'Convert IDL to .d.ts definitions')
    .option('--lint', 'Verifies input and exits')
    .option('--run-preprocessor', 'Runs preprocessor')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--aux-input-dir <path>', 'Path to aux input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--aux-input-files <files...>', 'Comma-separated list of specific aux files to process')
    .option('--verbose', 'Verbose processing')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--language [ts|sts|java|cangjie]', 'Output language')
    .option('--version')
    .option('--plugin <file>', 'File with generator\'s plugin')
    .option('--default-idl-package <name>', 'Name of the default package for generated IDL')
    .option('--enable-log', 'Enable logging')
    .option('--options-file <path>', 'Path to generator configuration options file (appends to defaults). Use --ignore-default-config to override default options.')
    .option('--ignore-default-config', 'Use with --options-file to override default generator configuration options.', false)
    .option('--arkts-extension <string> [.ts|.ets]', "Generated ArkTS language files extension.", ".ts")
    .parse()
    .opts()


function main() {
    if (options.runPreprocessor) {
        const resolved = path.resolve(options.inputDir)
        runPreprocessor([resolved], options.outputDir)
        return
    }

    Language.ARKTS.extension = options.arktsExtension as string

    setDefaultConfiguration(loadPeerConfiguration(options.optionsFile, options.ignoreDefaultConfig as boolean))

    if (process.env.npm_package_version) {
        console.log(`IDLize version ${findVersion()}`)
    }

    const { baseDirs, inputDirs, auxInputDirs, inputFiles, auxInputFiles } = formatInputPaths(options)
    validatePaths(baseDirs, "dir")
    validatePaths(inputDirs, "dir")
    validatePaths(auxInputDirs, "dir")
    validatePaths(inputFiles, "file")
    validatePaths(auxInputFiles, "file")

    const dtsInputFiles = scanInputDirs(inputDirs).concat(inputFiles)
    const dtsAuxInputFiles = auxInputFiles

    if (options.lint) {
        const resolver = new PeerLibrary(Language.TS)
        const files = dtsInputFiles.map((filePath) => {
            const result = toIDLFile(filePath)
            resolver.files.push(new PeerFile(result[0]))
            return result
        })
        fillSyntheticDeclarations(resolver)
        let totalErrors = 0
        const errorRecords: [string, number][] = []
        files.forEach(([file, info]) => {
            try {
                verifyIDLLinter(file, resolver, {
                    checkEnumsConsistency: true,
                    checkReferencesResolved: true,
                    validEntryAttributes: peerGeneratorConfiguration().linter.validEntryAttributes
                }, info)
            } catch (error) {
                if (error instanceof IDLLinterError) {
                    totalErrors += error.size
                    errorRecords.push([file.fileName ?? '', error.size])
                    console.error(error.message)
                    return
                }
                throw error
            }
        })
        if (totalErrors > 0) {
            process.exitCode = -1
            console.error()
            errorRecords.forEach(([fileName, errorNumber]) => {
                console.error(`${errorNumber.toString().padStart(5, ' ')} ${fileName}`)
            })

            console.error('      ----------------------------')
            console.error(`      Total errors: ${totalErrors}`)
        }
        return
    }

    if (options.dts2idl) {
        const { inputDirs, inputFiles } = formatInputPaths(options)
        validatePaths(inputDirs, 'dir')
        validatePaths(inputFiles, 'file')
        const idlLibrary = new PeerLibrary(Language.TS)
        generate(
            baseDirs,
            [...inputDirs, ...auxInputDirs],
            dtsInputFiles,
            dtsAuxInputFiles,
            options.outputDir ?? "./idl",
            path.resolve(__dirname, "..", "stdlib.d.ts"),
            (sourceFile, program, compilerHost) => new IDLVisitor(baseDirs, sourceFile, program, compilerHost, options),
            {
                compilerOptions: defaultCompilerOptions,
                onSingleFile: (file: IDLFile, outputDir, sourceFile, isAux) => {
                    const basename = path.basename(sourceFile.fileName)
                    if (basename === "stdlib.d.ts")
                        return

                    console.log('producing', basename)
                    const outFile = path.join(
                        outputDir,
                        basename.replace(".d.ts", ".idl")
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

                    const peerFile = new PeerFile(file)
                    if (isAux)
                        idlLibrary.auxFiles.push(peerFile)
                    else
                        idlLibrary.files.push(peerFile)
                },
                onEnd(outDir: string) {
                    if (options.verifyIdl) {
                        idlLibrary.files.forEach(file => {
                            verifyIDLLinter(file.file, idlLibrary, peerGeneratorConfiguration().linter)
                        })
                    }
                },
            }
        )
        return
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
        return
    }

    program.help()
}
main()
