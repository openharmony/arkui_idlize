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
    verifyIDLLinter,
    scanInputDirs,
    toIDLFile,
    setDefaultConfiguration,
    patchDefaultConfiguration,
    D,
} from "@idlizer/core"
import {
    IDLEntry,
    IDLFile,
    isEnum,
    isInterface,
    isSyntheticEntry,
    linkParentBack,
    transformMethodsAsync2ReturnPromise,
    linearizeNamespaceMembers
} from "@idlizer/core/idl"
import { IDLVisitor, loadPeerConfiguration,
    generateTracker, IdlPeerProcessor, loadPlugin,
    SkoalaDeserializerPrinter, IdlSkoalaLibrary, IldSkoalaOutFile, generateIdlSkoala,
    IdlWrapperProcessor, fillSyntheticDeclarations,
    formatInputPaths,
    validatePaths,
    libohosPredefinedFiles,
    PeerGeneratorConfigurationType,
    PeerGeneratorConfigurationSchema,
    peerGeneratorConfiguration,
} from "@idlizer/libohos"
import { generateArkoalaFromIdl, generateLibaceFromIdl } from "./arkoala"
import { ArkoalaPeerLibrary } from "./ArkoalaPeerLibrary"
import { makeInteropBridges } from "./InteropBridges"
import { loadKnownReferences } from "./knownReferences"

const options = program
    .option('--show-config-schema', 'Prints JSON schema for config')
    .option('--dts2test', 'Generate tests from .d.ts to .h')
    .option('--dts2peer', 'Convert .d.ts to peer drafts')
    .option('--ets2ts', 'Convert .ets to .ts')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--aux-input-dir <path>', 'Path to aux input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--aux-input-files <files...>', 'Comma-separated list of specific aux files to process')
    .option('--library-packages <packages>', 'Comma separated list of packages included into library')
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
    .option('--options-file <path>', 'Path to generator configuration options file (appends to defaults). Use --ignore-default-config to override default options.')
    .option('--ignore-default-config', 'Use with --options-file to override default generator configuration options.', false)
    .option('--arkts-extension <string> [.ts|.ets]', "Generated ArkTS language files extension.", ".ts")
    .option('--interop-bridges <string>', "Generate interop bridges macros")
    .option('--use-memo-m3', "Generate code with m3 @memo annotations and functions with @ComponentBuilder", false)
    .option('--use-component-optional', 'Make all component\'s properties nullable')
    .option('--reference-names <string>', 'Provides reference mapping', path.resolve(__dirname, '..', 'generation-config', 'references', 'default'))
    .option('--no-type-checker', "Use TypeChecker or generate ArkTS specific syntax")

    .parse()
    .opts()


let didJob = false

if (options.showConfigSchema) {
    console.log(D.printJSONSchema(PeerGeneratorConfigurationSchema))
    didJob = true
}

if (options.interopBridges) {
    console.log(makeInteropBridges(options.interopBridges))
    didJob = true
}

let apiVersion = options.apiVersion ?? 9999
Language.ARKTS.extension = options.arktsExtension as string

setDefaultConfiguration(loadPeerConfiguration(options.optionsFile, options.ignoreDefaultConfig as boolean))
loadKnownReferences(path.resolve(options.referenceNames))

if (process.env.npm_package_version && !options.showConfigSchema) {
    console.log(`IDLize version ${findVersion()}`)
}

if (options.dts2skoala) {
    patchDefaultConfiguration<PeerGeneratorConfigurationType>({
        ApiVersion: apiVersion,
        TypePrefix: "",
        LibraryPrefix: "",
        OptionalPrefix: "Opt_",
    })

    console.log(`Processing all .d.ts from directory: ${options.inputDir ?? "undefined"}`)

    const outputDir: string = options.outputDir ?? "./out/skoala"

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const generatedIDLMap = new Map<string, IDLEntry[]>()
    const skoalaLibrary = new IdlSkoalaLibrary()

    const { baseDirs, inputDirs, auxInputDirs, inputFiles, auxInputFiles } = formatInputPaths(options)
    validatePaths(baseDirs, "dir")
    validatePaths(inputDirs, "dir")
    validatePaths(auxInputDirs, "dir")
    validatePaths(inputFiles, "file")
    validatePaths(auxInputFiles, "file")

    const dtsInputFiles = scanInputDirs(inputDirs, '.d.ts').concat(inputFiles)
    const dtsAuxInputFiles = auxInputFiles

    if (dtsInputFiles.length === 0) {
        console.error("Error: No input directory or files provided.")
        process.exit(1)
    }

    generate(
        baseDirs,
        [...inputDirs, ...auxInputDirs],
        dtsInputFiles,
        dtsAuxInputFiles,
        outputDir,
        path.resolve(__dirname, "..", "stdlib.d.ts"),
        (sourceFile, program, compilerHost) => new IDLVisitor(baseDirs, sourceFile, program, compilerHost, options, skoalaLibrary),
        {
            compilerOptions: {
                ...defaultCompilerOptions,
                paths: {
                    "@koalaui/common": ["../external/incremental/common/src"],
                    "@koalaui/compat": ["../external/incremental/compat/src/typescript"],
                    "@koalaui/interop": ["../external/interop/src/interop"],
                    "@koalaui/arkoala": ["../external/arkoala-arkts/framework/src"],
                },
            },
            onSingleFile: (file: IDLFile, outputDirectory, sourceFile) => {
                const fileName = path.basename(sourceFile.fileName, ".d.ts")

                if (!generatedIDLMap.has(fileName)) {
                    generatedIDLMap.set(fileName, [])
                }

                generatedIDLMap.get(fileName)?.push(...file.entries)
                skoalaLibrary.files.push(file)
                skoalaLibrary.outFiles.push(new IldSkoalaOutFile(file))
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

function arkgenPredefinedFiles(): string[] {
    return scanInputDirs([path.join(__dirname, "../predefined")])
}

if (options.idl2peer) {
    const outDir = options.outputDir ?? "./out"
    const language = Language.fromString(options.language ?? "ts")
    const { inputFiles, inputDirs } = formatInputPaths(options)

    const idlLibrary = new ArkoalaPeerLibrary(language, options.useMemoM3)
    const allInputFiles = scanInputDirs(inputDirs)
        .concat(inputFiles)
        .concat(libohosPredefinedFiles())
        .concat(arkgenPredefinedFiles())
    const idlInputFiles = allInputFiles.filter(it => it.endsWith('.idl'))
    idlInputFiles.forEach(idlFilename => {
        idlFilename = path.resolve(idlFilename)
        const [file] = toIDLFile(idlFilename)
        idlLibrary.files.push(file)
    })
    if (options.verifyIdl) {
        idlLibrary.files.forEach(file => {
            verifyIDLLinter(file, idlLibrary, peerGeneratorConfiguration().linter)
        })
    }
    idlLibrary.enableCache()
    fillSyntheticDeclarations(idlLibrary)
    new IdlPeerProcessor(idlLibrary).process()

    generateTarget(idlLibrary, outDir, language)

    didJob = true
}

if (options.dts2peer) {
    const generatedPeersDir = options.outputDir ?? "./out/ts-peers/generated"
    const lang = Language.fromString(options.language ?? "ts")

    const { baseDirs, inputDirs, auxInputDirs, inputFiles, auxInputFiles } = formatInputPaths(options)
    validatePaths(baseDirs, "dir")
    validatePaths(inputDirs, "dir")
    validatePaths(auxInputDirs, "dir")
    validatePaths(inputFiles, "file")
    validatePaths(auxInputFiles, "file")

    const allInputFiles = scanInputDirs(inputDirs)
        .concat(inputFiles)
        .concat(libohosPredefinedFiles())
        .concat(arkgenPredefinedFiles())
    const allAuxInputFiles = auxInputFiles
    const dtsInputFiles = allInputFiles.filter(it => it.endsWith('.d.ts'))
    const dtsAuxInputFiles = allAuxInputFiles.filter(it => it.endsWith('.d.ts'))
    const idlInputFiles = allInputFiles.filter(it => it.endsWith('.idl'))
    const idlAuxInputFiles = allAuxInputFiles.filter(it => it.endsWith('.idl'))

    const idlLibrary = new ArkoalaPeerLibrary(lang, options.useMemoM3)

    {
        const pushOne = (idlFilename: string, resultFilesArray: IDLFile[]) => {
            idlFilename = path.resolve(idlFilename)
            const [file] = toIDLFile(idlFilename)
            resultFilesArray.push(file)
        }
        idlInputFiles.forEach(idlFilename => pushOne(idlFilename, idlLibrary.files))
        idlAuxInputFiles.forEach(auxIdlFilename => pushOne(auxIdlFilename, idlLibrary.auxFiles))
    }

    generate(
        baseDirs,
        [...inputDirs, ...auxInputDirs],
        dtsInputFiles,
        dtsAuxInputFiles,
        generatedPeersDir,
        path.resolve(__dirname, "..", "stdlib.d.ts"),
        (sourceFile, program, compilerHost) => new IDLVisitor(baseDirs, sourceFile, program, compilerHost, options, idlLibrary),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile(file: IDLFile, outputDir, sourceFile, isAux) {
                // TODO: this hack must be removed
                file.entries = file.entries.filter(newEntry =>
                    !idlLibrary.files.find(peerFile => peerFile.entries.find(entry => {
                        if (([newEntry, entry].every(isInterface)
                            || [newEntry, entry].every(isEnum)
                            || [newEntry, entry].every(isSyntheticEntry))) {
                            if (newEntry.name === entry.name) {
                                console.error("Removed duplicate", newEntry.name, 'from', file.fileName, ', another declaration found at', peerFile.fileName)
                                return true
                            }
                        }
                        return false
                    }))
                )

                linearizeNamespaceMembers(file.entries).forEach(it => {
                    transformMethodsAsync2ReturnPromise(it)
                })
                linkParentBack(file)

                if (isAux)
                    idlLibrary.auxFiles.push(file)
                else
                    idlLibrary.files.push(file)
            },
            onEnd(outDir) {
                if (options.verifyIdl) {
                    idlLibrary.files.forEach(file => {
                        verifyIDLLinter(file, idlLibrary, peerGeneratorConfiguration().linter)
                    })
                }
                fillSyntheticDeclarations(idlLibrary)
                idlLibrary.enableCache()
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

function generateTarget(idlLibrary: ArkoalaPeerLibrary, outDir: string, lang: Language) {
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
            lang: lang,
            useTypeChecker: options.typeChecker ?? true,
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
