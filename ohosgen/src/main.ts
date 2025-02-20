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
    generate,
    defaultCompilerOptions,
    Language,
    findVersion,
    setDefaultConfiguration,
    PeerFile,
    PeerLibrary,
} from "@idlizer/core"
import {
    IDLEntry,
    IDLFile,
    isEnum,
    isInterface,
    isSyntheticEntry,
    linkParentBack,
    transformMethodsAsync2ReturnPromise,
} from "@idlizer/core/idl"
import { IDLVisitor, loadPeerConfiguration,
    IDLInteropPredefinesVisitor, IdlPeerProcessor, IDLPredefinesVisitor,
    loadPlugin, fillSyntheticDeclarations, peerGeneratorConfiguration,
    scanPredefinedDirectory, scanNotPredefinedDirectory,
    scanCommonPredefined,
    formatInputPaths,
    validatePaths,
} from "@idlizer/libohos"
import { generateOhos } from "./ohos"
import { suggestLibraryName } from "./OhosNativeVisitor"

const options = program
    .option('--dts2peer', 'Convert .d.ts to peer drafts')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--file-to-package <fileToPackage>', 'Comma-separated list of pairs, what package name should be used for file in format <fileName:packageName>')
    .option('--library-packages <packages>', 'Comma separated list of packages included into library')
    .option('--idl2peer', 'Convert IDL to peer drafts')
    .option('--verbose', 'Verbose processing')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--api-version <version>', "API version for generated peers")
    .option('--dump-serialized', "Dump serialized data")
    .option('--call-log', "Call log")
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--language [ts|ts|java|cangjie]', 'Output language')
    .option('--api-prefix <string>', 'Cpp prefix to be compatible with manual arkoala implementation')
    .option('--version')
    .option('--plugin <file>', 'File with generator\'s plugin')
    .option('--default-idl-package <name>', 'Name of the default package for generated IDL')
    .option('--no-commented-code', 'Do not generate commented code in modifiers')
    .option('--use-new-ohos', 'Use new ohos generator')
    .option('--enable-log', 'Enable logging')
    .option('--split-files', 'Experimental feature to store declarations in different files for ohos generator')
    .option('--options-file <path>', 'Path to generator configuration options file (appends to defaults)')
    .option('--override-options-file <path>', 'Path to generator configuration options file (replaces defaults)')
    .option('--arkts-extension <string> [.ts|.ets]', "Generated ArkTS language files extension.", ".ts")
    .parse()
    .opts()

let didJob = false
let apiVersion = options.apiVersion ?? 9999

options.inputFiles = processInputFiles(options.inputFiles)

setDefaultConfiguration(loadPeerConfiguration(options.optionsFile, options.overrideOptionsFile))

if (process.env.npm_package_version) {
    console.log(`IDLize version ${findVersion()}`)
}

if (options.idl2peer) {
    const outDir = options.outputDir ?? "./out"
    const language = Language.fromString(options.language ?? "ts")

    const { inputFiles, inputDirs, libraryPackages } = formatInputPaths(options)
    validatePaths(inputDirs, "dir")
    validatePaths(inputFiles, "file")

    const idlLibrary = new PeerLibrary(language, libraryPackages)
    idlLibrary.files.push(...scanNotPredefinedDirectory(inputDirs[0]))
    new IdlPeerProcessor(idlLibrary).process()

    generateTarget(idlLibrary, outDir, language)

    didJob = true
}

if (options.dts2peer) {
    const generatedPeersDir = options.outputDir ?? "./out/ts-peers/generated"
    const lang = Language.fromString(options.language ?? "ts")

    const { inputFiles, inputDirs, libraryPackages } = formatInputPaths(options)
    validatePaths(inputDirs, "dir")
    validatePaths(inputFiles, "file")

    options.docs = "all"
    const idlLibrary = new PeerLibrary(lang, libraryPackages)
    const { interop, root } = scanCommonPredefined()
    interop.forEach(file => {
        new IDLInteropPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })

    root.forEach(file => {
        new IDLPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })

    generate(
        inputDirs,
        inputFiles,
        generatedPeersDir,
        (sourceFile, program, compilerHost) => new IDLVisitor(sourceFile, program, compilerHost, options, idlLibrary),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile(file, outputDir, sourceFile) {
                file.entries = file.entries.filter(newEntry =>
                    !idlLibrary.files.find(peerFile => peerFile.entries.find(entry => {
                        if (([newEntry, entry].every(isInterface)
                            || [newEntry, entry].every(isEnum)
                            || [newEntry, entry].every(isSyntheticEntry))) {
                            if (newEntry.name === entry.name) {
                                return true
                            }
                        }
                        return false
                    }))
                )
                file.entries.forEach(it => {
                    transformMethodsAsync2ReturnPromise(it)
                })
                linkParentBack(file)

                const peerFile = new PeerFile(file)

                idlLibrary.files.push(peerFile)
            },
            onEnd(outDir: string) {
                fillSyntheticDeclarations(idlLibrary)
                const peerProcessor = new IdlPeerProcessor(idlLibrary)
                peerProcessor.process()

                generateTarget(idlLibrary, outDir, lang)
            }
        }
    )
    didJob = true
}

if (!didJob) {
    program.help()
}

function processInputFiles(files: string[] | string | undefined): string[] {
    if (!files) return []

    const processPath = (path: string) => {
        const trimmedPath = path.trim()
        if (!fs.existsSync(trimmedPath)) {
            console.error(`Input file does not exist: ${trimmedPath}`)
            return false
        }
        return true
    }

    if (Array.isArray(files) && files.length === 1 && files[0].includes(',')) {
        const filesList = files[0].split(',').map(f => f.trim()).filter(Boolean)
        return filesList.filter(processPath)
    }

    if (Array.isArray(files)) {
        return files.map(f => f.trim()).filter(Boolean).filter(processPath)
    }

    const filesList = files.split(',').map(f => f.trim()).filter(Boolean)
    return filesList.filter(processPath)
}

function generateTarget(idlLibrary: PeerLibrary, outDir: string, lang: Language) {
    idlLibrary.name = options.defaultIdlPackage?.toUpperCase() ?? ""
    if (!idlLibrary.name.length) {
        idlLibrary.name = suggestLibraryName(idlLibrary)
    }
    if (!idlLibrary.name.length) {
        throw new Error("No name can be assigned to generated package. please provide name via --default-idl-package ")
    }
    generateOhos(outDir, idlLibrary, {
        ...peerGeneratorConfiguration(),
        LibraryPrefix: `${idlLibrary.name.toUpperCase()}_`,
        GenerateUnused: true,
        ApiVersion: apiVersion,
    })

    if (options.plugin) {
        loadPlugin(options.plugin)
            .then(plugin => plugin.process({ outDir: outDir }, idlLibrary))
            .then(result => {
                console.log(`Plugin ${options.plugin} process returned ${result}`)
            })
            .catch(error => console.error(`Plugin ${options.plugin} not found: ${error}`))
    }
}
