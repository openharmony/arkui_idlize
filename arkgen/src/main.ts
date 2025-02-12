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
    isEnum,
    isInterface,
    isSyntheticEntry,
    transformMethodsAsync2ReturnPromise,
} from "@idlizer/core/idl"
import { IDLVisitor, loadPeerConfiguration,
    generateTracker, IDLInteropPredefinesVisitor, IdlPeerProcessor, IDLPredefinesVisitor, loadPlugin,
    SkoalaDeserializerPrinter, IdlSkoalaLibrary, IldSkoalaFile, generateIdlSkoala,
    IdlWrapperProcessor, fillSyntheticDeclarations, DefaultConfiguration,
    scanPredefinedDirectory, scanNotPredefinedDirectory,
} from "@idlizer/libohos"
import { generateArkoalaFromIdl, generateLibaceFromIdl } from "./arkoala"
import { ArkoalaPeerLibrary } from "./ArkoalaPeerLibrary"

const options = program
    .option('--dts2test', 'Generate tests from .d.ts to .h')
    .option('--dts2peer', 'Convert .d.ts to peer drafts')
    .option('--ets2ts', 'Convert .ets to .ts')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--idl2peer', 'Convert IDL to peer drafts')
    .option('--dts2skoala', 'Convert DTS to skoala definitions')
    .option('--verbose', 'Verbose processing')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--common-to-attributes', 'Transform common attributes as IDL attributes')
    .option('--test-interface <name>', 'Interfaces to test (comma separated)')
    .option('--test-method <name>', 'Methods to test (comma separated)')
    .option('--test-property <name>', 'Properties to test (comma separated)')
    .option('--generate-interface <name>', 'Interfaces to generate (comma separated)')
    .option('--disable-enum-initializers', "Don't include enum member initializers in the interface")
    .option('--native-bridge-path <name>', "Path to native bridge")
    .option('--api-version <version>', "API version for generated peers")
    .option('--dump-serialized', "Dump serialized data")
    .option('--call-log', "Call log")
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--language [ts|ts|java|cangjie]', 'Output language')
    .option('--api-prefix <string>', 'Cpp prefix to be compatible with manual arkoala implementation')
    .option('--only-integrated', 'Generate only thoose files that can be integrated to target', false)
    .option('--version')
    .option('--generator-target <all|arkoala|libace|none>', 'Copy peers to arkoala or libace (use with --dts2peer)', "all")
    .option('--arkoala-destination <path>', 'Location of arkoala repository')
    .option('--libace-destination <path>', 'Location of libace repository')
    .option('--copy-peers-components <name...>', 'List of components to copy (omit to copy all)')
    .option('--tracker-status <file>', 'Tracker status file)')
    .option('--plugin <file>', 'File with generator\'s plugin')
    .option('--default-idl-package <name>', 'Name of the default package for generated IDL')
    .option('--no-commented-code', 'Do not generate commented code in modifiers')
    .option('--enable-log', 'Enable logging')
    .option('--options-file <path>', 'Path to generator configuration options file (appends to defaults)')
    .option('--override-options-file <path>', 'Path to generator configuration options file (replaces defaults)')

    .parse()
    .opts()

let apiVersion = options.apiVersion ?? 9999

setDefaultConfiguration(loadPeerConfiguration(options.optionsFile, options.overrideOptionsFile))

if (process.env.npm_package_version) {
    console.log(`IDLize version ${findVersion()}`)
}

let didJob = false

if (options.dts2skoala) {
    setDefaultConfiguration(new DefaultConfiguration({ ApiVersion: apiVersion, TypePrefix: "", LibraryPrefix: "", OptionalPrefix: "Opt_" }))

    console.log(`Processing all .d.ts from directory: ${options.inputDir ?? "undefined"}`)

    const outputDir: string = options.outputDir ?? "./out/skoala"

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const generatedIDLMap = new Map<string, IDLEntry[]>()
    const skoalaLibrary = new IdlSkoalaLibrary()

    const inputDirs = options.inputDir ? options.inputDir.split(',') : []
    const inputFiles = options.inputFile ? (Array.isArray(options.inputFile) ? options.inputFile : [options.inputFile]) : []

    if (inputDirs.length === 0 && inputFiles.length === 0) {
        console.error("Error: No input directory or files provided.")
        process.exit(1)
    }

    generate(
        inputDirs,
        inputFiles,
        outputDir,
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, options, skoalaLibrary),
        {
            compilerOptions: {
                ...defaultCompilerOptions,
                paths: {
                    "@koalaui/common": ["../external/incremental/common/src"],
                    "@koalaui/compat": ["../external/incremental/compat/src/typescript"],
                    "@koalaui/interop": ["../external/interop/src/interop"],
                    "@koalaui/arkoala": ["../external/arkoala/framework/src"],
                },
            },
            onSingleFile: (entries: IDLEntry[], outputDirectory, sourceFile) => {
                const fileName = path.basename(sourceFile.fileName, ".d.ts")

                if (!generatedIDLMap.has(fileName)) {
                    generatedIDLMap.set(fileName, [])
                }

                generatedIDLMap.get(fileName)?.push(...entries)
                skoalaLibrary.files.push(new IldSkoalaFile(sourceFile.fileName, entries))
            },
            onEnd: (outDir) => {
                const wrapperProcessor = new IdlWrapperProcessor(skoalaLibrary)
                wrapperProcessor.process()
                generateIdlSkoala(outDir, skoalaLibrary, options)

                try {
                    SkoalaDeserializerPrinter.generateDeserializer(outputDir, generatedIDLMap)
                } catch (error) {
                    console.error("Error during deserializer generation:", error)
                }

                console.log("All files processed.")
            }
        }
    )
    didJob = true
}

if (options.idl2peer) {
    const PREDEFINED_PATH = path.join(__dirname, "..", "predefined")

    const outDir = options.outputDir ?? "./out"
    const language = Language.fromString(options.language ?? "ts")

    const idlLibrary = new ArkoalaPeerLibrary(language)
    idlLibrary.files.push(...scanNotPredefinedDirectory(options.inputDir))
    scanPredefinedDirectory(PREDEFINED_PATH, "src").forEach(file => {
        new IDLPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })
    new IdlPeerProcessor(idlLibrary).process()

    generateTarget(idlLibrary, outDir, language)

    didJob = true
}

if (options.dts2peer) {
    const generatedPeersDir = options.outputDir ?? "./out/ts-peers/generated"
    const lang = Language.fromString(options.language ?? "ts")

    if (options.inputFiles && typeof options.inputFiles === 'string') {
        options.inputFiles = options.inputFiles
            .split(',')
            .map(file => file.trim())
            .filter(Boolean)
    }

    if (options.inputDir && typeof options.inputDir === 'string') {
        options.inputDir = options.inputDir.split(',')
            .map(dir => dir.trim())
            .filter(Boolean)
    }

    const inputDirs: string[] = options.inputDir || []
    inputDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.error(`Input directory does not exist: ${dir}`)
            process.exit(1)
        } else {
            console.log(`Input directory exists: ${dir}`)
        }
    })

    const inputFiles: string[] = options.inputFiles || []
    inputFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.error(`Input file does not exist: ${file}`)
            process.exit(1)
        } else {
            console.log(`Input file exists: ${file}`)
        }
    })

    options.docs = "all"
    const idlLibrary = new ArkoalaPeerLibrary(lang)
    // collect predefined files
    scanPredefinedDirectory(__dirname, "../../predefined/interop").forEach(file => {
        new IDLInteropPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })

    scanPredefinedDirectory(__dirname, "../../predefined").forEach(file => {
        new IDLPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })

    scanPredefinedDirectory(__dirname, "../predefined").forEach(file => {
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
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, options, idlLibrary),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile(entries: IDLEntry[], outputDir, sourceFile) {
                entries = entries.filter(newEntry =>
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
                entries.forEach(it => {
                    transformMethodsAsync2ReturnPromise(it)
                })

                const baseFileName = path.resolve(sourceFile.fileName)
                const peerFile = new PeerFile(baseFileName, entries)

                idlLibrary.files.push(peerFile)
            },
            onEnd(outDir) {
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

function generateTarget(idlLibrary: PeerLibrary, outDir: string, lang: Language) {
    if (options.generatorTarget == "arkoala" || options.generatorTarget == "all") {
        generateArkoalaFromIdl({
            outDir: outDir,
            arkoalaDestination: options.arkoalaDestination,
            nativeBridgeFile: options.nativeBridgePath,
            apiVersion: apiVersion,
            verbose: options.verbose ?? false,
            onlyIntegrated: options.onlyIntegrated ?? false,
            dumpSerialized: options.dumpSerialized ?? false,
            callLog: options.callLog ?? false,
            lang: lang
        }, idlLibrary)
    }
    if (options.generatorTarget == "libace" ||
        options.generatorTarget == "all") {
        generateLibaceFromIdl({
            outDir: outDir,
            libaceDestination: options.libaceDestination,
            apiVersion: apiVersion,
            commentedCode: options.commentedCode,
        }, idlLibrary)
    }
    if (options.generatorTarget == "tracker") {
        generateTracker(outDir, idlLibrary, options.trackerStatus, options.verbose)
    }
    if (options.plugin) {
        loadPlugin(options.plugin)
            .then(plugin => plugin.process({outDir: outDir}, idlLibrary))
            .then(result => {
                console.log(`Plugin ${options.plugin} process returned ${result}`)
            })
            .catch(error => console.error(`Plugin ${options.plugin} not found: ${error}`))
    }
}
