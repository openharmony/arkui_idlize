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
    toIDL,
    generate,
    defaultCompilerOptions,
    idlToDtsString,
    Language,
    findVersion,
    GeneratorConfiguration,
    setDefaultConfiguration,
    initRNG,
    PeerFile
} from "@idlizer/core"
import {
    forEachChild,
    IDLEntry,
    isEnum,
    isInterface,
    isSyntheticEntry,
    toIDLString,
    transformMethodsAsync2ReturnPromise,
    verifyIDLString,
    linearizeNamespaceMembers
} from "@idlizer/core/idl"
import { IDLVisitor } from "./IDLVisitor"
import { TestGeneratorVisitor } from "./TestGeneratorVisitor"
import { loadConfiguration, PeerGeneratorConfig, setFileGeneratorConfiguration } from "./peer-generation/PeerGeneratorConfig"
import { generateTracker } from "./peer-generation/Tracker"
import {
    IDLInteropPredefinesVisitor,
    IdlPeerProcessor,
    IDLPredefinesVisitor,
} from "./peer-generation/idl/IdlPeerGeneratorVisitor"
import {
    generateOhos as generateOhosOld,
    OhosConfiguration,
    suggestLibraryName
} from "./peer-generation/OhosGenerator"
import { generateArkoalaFromIdl, generateLibaceFromIdl } from "./peer-generation/arkoala"
import { loadPlugin } from "./peer-generation/plugin-api"
import { SkoalaDeserializerPrinter } from "./peer-generation/printers/SkoalaDeserializerPrinter"

import { IdlSkoalaLibrary, IldSkoalaFile } from "./skoala-generation/idl/idlSkoalaLibrary"
import { generateIdlSkoala } from "./skoala-generation/SkoalaGeneration"
import { IdlWrapperProcessor } from "./skoala-generation/idl/idlSkoalaLibrary"
import { fillSyntheticDeclarations } from "./peer-generation/idl/SyntheticDeclarationsFiller"
import { PeerLibrary } from "./peer-generation/PeerLibrary"
import { generateOhos } from "./peer-generation/ohos"
import { ArkoalaPeerLibrary } from "./arkoala/ArkoalaPeerLibrary"

const options = program
    .option('--dts2idl', 'Convert .d.ts to IDL definitions')
    .option('--dts2test', 'Generate tests from .d.ts to .h')
    .option('--dts2peer', 'Convert .d.ts to peer drafts')
    .option('--ets2ts', 'Convert .ets to .ts')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <name>', 'Name of file to convert, all files in input-dir if none')
    .option('--idl2dts', 'Convert IDL to .d.ts definitions')
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
    .option('--need-interfaces', 'Generate interfaces to resolve all .d.ts dependencies', false)
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
    .option('--options-file <path>', 'Path to file which determines what to generate')
    .option('--use-new-ohos', 'Use new ohos generator')
    .option('--options-file <path>', 'Path to file which determines what to generate')
    .parse()
    .opts()

let apiVersion = options.apiVersion ?? 9999

if (options.optionsFile) {
    setFileGeneratorConfiguration(loadConfiguration(options.optionsFile as string))
}

if (process.env.npm_package_version) {
    console.log(`IDLize version ${findVersion()}`)
}

let didJob = false

class DefaultConfig implements GeneratorConfiguration {
    protected params: Record<string, any> = {
        TypePrefix: "Ark_",
        LibraryPrefix: "",
        OptionalPrefix: "Opt_",
        GenerateUnused: false,
    }

    param<T>(name: string): T {
        if (name in this.params) {
            return this.params[name] as T;
        }
        throw new Error(`${name} is unknown`)
    }
    paramArray<T>(name: string): T[] {
        return []
    }
}

class ArkoalaConfiguration extends DefaultConfig {
    override paramArray<T>(name: string): T[] {
        switch (name) {
            case 'rootComponents': return PeerGeneratorConfig.rootComponents as T[]
            case 'standaloneComponents': return PeerGeneratorConfig.standaloneComponents as T[]
            case 'knownParameterized': return PeerGeneratorConfig.knownParameterized as T[]
            case 'boundProperties': return Array.from(PeerGeneratorConfig.boundProperties) as T[]
            case 'builderClasses': return PeerGeneratorConfig.builderClasses as T[]
        }
        return super.paramArray(name)
    }
}

class SkoalaConfiguration extends DefaultConfig {
    protected params: Record<string, any> = {
        TypePrefix: "",
        LibraryPrefix: "",
        OptionalPrefix: "Opt_"
    }
}

setDefaultConfiguration(new ArkoalaConfiguration())

if (options.dts2idl) {
    generate(
        options.inputDir.split(','),
        options.inputFile,
        options.outputDir ?? "./idl",
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, options),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: IDLEntry[], outputDir, sourceFile) => {
                console.log('producing', path.basename(sourceFile.fileName))
                const outFile = path.join(outputDir,
                    path.basename(sourceFile.fileName).replace(".d.ts", ".idl"))
                console.log("saved", outFile)
                if (options.skipDocs) {
                    entries.forEach(it => forEachChild(
                        it, (it) => it.documentation = undefined))
                }
                let generated = toIDLString(entries, {
                    disableEnumInitializers: options.disableEnumInitializers ?? false
                })
                if (options.verbose) console.log(generated)
                if (!fs.existsSync(path.dirname(outFile))){
                    fs.mkdirSync(path.dirname(outFile), { recursive: true });
                }
                fs.writeFileSync(outFile, generated)
                if (options.verifyIdl)
                    verifyIDLString(generated)
            }
        }
    )
    didJob = true
}

if (options.dts2skoala) {
    setDefaultConfiguration(new SkoalaConfiguration())

    const outputDir: string = options.outputDir ?? "./out/skoala"

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const generatedIDLMap = new Map<string, IDLEntry[]>()
    const skoalaLibrary = new IdlSkoalaLibrary()

    generate(
        options.inputDir.split(','),
        options.inputFile,
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

if (options.dts2test) {
    initRNG()
    let testInterfaces = options.testInterface
    if (testInterfaces === undefined) {
        function fileNameToClass(name: string): string {
            return name
                .split('_')
                .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                .join(``)
        }

        (options.inputDir as string).split(",").forEach(inputDir => {
            let inDir = path.resolve(inputDir)
            testInterfaces = testInterfaces.concat(
                fs.readdirSync(inDir)
                .filter(file => file.endsWith("d.ts"))
                .map(file => file.substring(0, file.length - 5))
                .map(fileNameToClass)
                .join(','))
            })
    }

    let lines: string[] = []
    generate(
        options.inputDir.split(','),
        options.inputFile,
        options.outputDir ?? "./generated/tests",
        (sourceFile, typeChecker) => new TestGeneratorVisitor(sourceFile, typeChecker, testInterfaces, options.testMethod, options.testProperties),
        {
            compilerOptions: defaultCompilerOptions,
            onBegin: (outDir: string) => {
                lines.push(`import {checkResult, checkTestFailures} from "@arkoala/arkui/test_utils"`)
                lines.push(``)
            },
            onSingleFile: (entries: string[], outputDir, sourceFile) => {
                lines = lines.concat(entries)
            },
            onEnd: (outDir: string) => {
                lines.push(``)
                lines.push(`checkTestFailures()`)

                let generated = lines.join("\n")
                const outFile = path.join(outDir, "index.ts")
                if (options.verbose) {
                    console.log(generated)
                }
                console.log(`Write fuzzing peers to file ${outFile}`)
                fs.writeFileSync(outFile, lines.join("\n"))
            }
        }
    )
    didJob = true
}

if (options.idl2dts) {
    fromIDL(
        options.inputDir,
        options.inputFile,
        options.outputDir ?? "./generated/dts/",
        ".d.ts",
        options.verbose ?? false,
        idlToDtsString,
    )
    didJob = true
}

if (options.idl2peer) {
    const outDir = options.outputDir ?? "./out"
    const language = Language.fromString(options.language ?? "ts")

    const idlLibrary = createPeerLibrary(language)
    idlLibrary.files.push(...scanNotPredefinedDirectory(options.inputDir))
    new IdlPeerProcessor(idlLibrary).process()

    generateTarget(idlLibrary, outDir, language)

    didJob = true
}

if (options.dts2peer) {
    PeerGeneratorConfig.needInterfaces = options.needInterfaces
    const generatedPeersDir = options.outputDir ?? "./out/ts-peers/generated"
    const lang = Language.fromString(options.language ?? "ts")

    const PREDEFINED_PATH = path.join(__dirname, "..", "predefined")

    options.docs = "all"
    const idlLibrary = createPeerLibrary(lang)
    // collect predefined files
    scanPredefinedDirectory(PREDEFINED_PATH, "sys").forEach(file => {
        new IDLInteropPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })
    scanPredefinedDirectory(PREDEFINED_PATH, "src").forEach(file => {
        new IDLPredefinesVisitor({
            sourceFile: file.originalFilename,
            peerLibrary: idlLibrary,
            peerFile: file,
        }).visitWholeFile()
    })
    if (["arkoala", "libace", "all", "tracker"].includes(options.generatorTarget)) {
        scanPredefinedDirectory(PREDEFINED_PATH, "arkoala").forEach(file => {
            new IDLPredefinesVisitor({
                sourceFile: file.originalFilename,
                peerLibrary: idlLibrary,
                peerFile: file,
            }).visitWholeFile()
        })
    }

    // First convert DTS to IDL
    generate(
        options.inputDir.split(','),
        options.inputFile,
        generatedPeersDir,
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, options, idlLibrary),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile(entries: IDLEntry[], outputDir, sourceFile) {
                // Search for duplicate declarations
                entries = entries.filter(newEntry =>
                    !idlLibrary.files.find(peerFile => linearizeNamespaceMembers(peerFile.entries).find(entry => {
                        if (([newEntry, entry].every(isInterface)
                            || [newEntry, entry].every(isEnum)
                            || [newEntry, entry].every(isSyntheticEntry))) {
                            if (newEntry.name === entry.name) {
                                console.warn(`WARNING: Skip entry:'${newEntry.name}'(${sourceFile.fileName}) already exists in ${peerFile.originalFilename}`)
                                return true
                            }
                        }
                    }))
                )
                entries.forEach(it => {
                    transformMethodsAsync2ReturnPromise(it)
                })
                const file = new PeerFile(sourceFile.fileName, entries)
                idlLibrary.files.push(file)
            },
            onEnd(outDir) {
                if (options.generatorTarget == "ohos") {
                    // This setup code placed here because wrong prefix may be cached during library creation
                    // TODO find better place for setup?
                    setDefaultConfiguration(new OhosConfiguration())
                }
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
    if (options.generatorTarget == "ohos") {
        if (options.useNewOhos) {
            generateOhos(outDir, idlLibrary, new OhosConfiguration(suggestLibraryName(idlLibrary),
                {
                    ApiVersion: apiVersion
                }
            ))
        } else {
            generateOhosOld(outDir, idlLibrary, options.defaultIdlPackage as string)
        }
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

function scanNotPredefinedDirectory(dir: string, ...subdirs: string[]): PeerFile[] {
    return scanDirectory(false, dir, ...subdirs)
}

function scanPredefinedDirectory(dir: string, ...subdirs: string[]): PeerFile[] {
    return scanDirectory(true, dir, ...subdirs)
}

function scanDirectory(isPredefined: boolean, dir: string, ...subdirs: string[]): PeerFile[] {
    dir = path.join(dir, ...subdirs)
    return fs.readdirSync(dir)
        .filter(it => it.endsWith(".idl"))
        .map(it => {
            const idlFile = path.resolve(path.join(dir, it))
            const nodes = toIDL(idlFile)
            return new PeerFile(idlFile, nodes, isPredefined)
        })
}

function createPeerLibrary(lang: Language) {
    if (["arkoala", "libace", "all"].includes(options.generatorTarget))
        return new ArkoalaPeerLibrary(lang)
    return new PeerLibrary(lang)
}
