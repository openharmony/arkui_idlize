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
import { fromIDL } from "./from-idl/common"
import { idlToString } from "./from-idl/DtsPrinter"
import { generate } from "./idlize"
import { IDLEntry, forEachChild, toIDLString, isInterface, hasExtAttribute, IDLExtendedAttributes, isPackage } from "./idl"
import { LinterMessage, LinterVisitor, toLinterString } from "./linter"
import { CompileContext, IDLVisitor } from "./IDLVisitor"
import { TestGeneratorVisitor } from "./TestGeneratorVisitor"
import { ArkoalaInstall, LibaceInstall } from "./Install"
import {
    copyToArkoala,
    dummyImplementations,
    makeArkuiModule,
    makeTSSerializer,
    makeTSDeserializer,
    gniFile,
    mesonBuildFile,
    copyToLibace,
    libraryCcDeclaration,
    makeCJSerializer,
    makeTypeChecker
} from "./peer-generation/FileGenerators"
import { makeJavaArkComponents, makeJavaNodeTypes, makeJavaSerializer } from "./peer-generation/printers/lang/JavaPrinters"
import {
    PeerGeneratorVisitor,
    PeerProcessor,
} from "./peer-generation/PeerGeneratorVisitor"
import { defaultCompilerOptions, isDefined, toSet, Language } from "./util"
import { initRNG } from "./rand_utils"
import { DeclarationTable } from "./peer-generation/DeclarationTable"
import { printRealAndDummyAccessors, printRealModifiersAsMultipleFiles } from "./peer-generation/printers/ModifierPrinter"
import { printRealAndDummyModifiers } from "./peer-generation/printers/ModifierPrinter"
import { PeerLibrary } from "./peer-generation/PeerLibrary"
import { printComponents } from "./peer-generation/printers/ComponentsPrinter"
import { printPeers } from "./peer-generation/printers/PeersPrinter"
import { printMaterialized } from "./peer-generation/printers/MaterializedPrinter"
import { printSerializers, printUserConverter } from "./peer-generation/printers/HeaderPrinter"
import { printNodeTypes } from "./peer-generation/printers/NodeTypesPrinter"
import { printNativeModule, printNativeModuleEmpty } from "./peer-generation/printers/NativeModulePrinter"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig";
import { printEvents, printEventsCArkoalaImpl, printEventsCLibaceImpl } from "./peer-generation/printers/EventsPrinter"
import { printGniSources } from "./peer-generation/printers/GniPrinter"
import { printMesonBuild } from "./peer-generation/printers/MesonPrinter"
import { printInterfaces } from "./peer-generation/printers/InterfacePrinter"
import {
    printInterfaces as printIdlInterfaces,
    printFakeDeclarations as printIdlFakeDeclarations
} from "./peer-generation/idl/InterfacePrinter"
import { printConflictedDeclarations } from "./peer-generation/printers/ConflictedDeclarationsPrinter"
import { printFakeDeclarations } from "./peer-generation/printers/FakeDeclarationsPrinter"
import { printBuilderClasses } from "./peer-generation/printers/BuilderClassPrinter"
import { ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH } from "./peer-generation/printers/lang/Java"
import { TargetFile } from "./peer-generation/printers/TargetFile"
import { printBridgeCcCustom, printBridgeCcGenerated } from "./peer-generation/printers/BridgeCcPrinter"
import { createPrinterContext } from "./peer-generation/printers/PrinterContext/PrinterContextImpl"
import { generateTracker } from "./peer-generation/Tracker"
import { IdlPeerLibrary } from "./peer-generation/idl/IdlPeerLibrary"
import { IdlPeerFile } from "./peer-generation/idl/IdlPeerFile"
import { IdlPeerGeneratorVisitor, IdlPeerProcessor, IdlPredefinedGeneratorVisitor } from "./peer-generation/idl/IdlPeerGeneratorVisitor"
import { SkoalaCCodeGenerator } from "./peer-generation/printers/SkoalaPrinter"
import { generateOhos } from "./peer-generation/OhosGenerator"
import * as webidl2 from "webidl2"
import { toIDLNode } from "./from-idl/deserialize"

const options = program
    .option('--dts2idl', 'Convert .d.ts to IDL definitions')
    .option('--dts2test', 'Generate tests from .d.ts to .h')
    .option('--dts2peer', 'Convert .d.ts to peer drafts')
    .option('--ets2ts', 'Convert .ets to .ts')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <name>', 'Name of file to convert, all files in input-dir if none')
    .option('--idl2dts', 'Convert IDL to .d.ts definitions')
    .option('--dts2skoala', 'Convert DTS to skoala definitions')
    .option('--linter', 'Run linter')
    .option('--linter-suppress-errors <suppress>', 'Error codes to suppress, comma separated, no space')
    .option('--linter-whitelist <whitelist.json>', 'Whitelist for linter')
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
    .option('--idl', 'Generate peers from IDL (use with --dts2peer)', true)
    .option('--no-idl', 'Generate peers directly from .d.ts files (use with --dts2peer)', false)
    .option('--arkoala-destination <path>', 'Location of arkoala repository')
    .option('--libace-destination <path>', 'Location of libace repository')
    .option('--copy-peers-components <name...>', 'List of components to copy (omit to copy all)')
    .option('--tracker-status <file>', 'Tracker status file)')
    .parse()
    .opts()

let apiVersion = options.apiVersion ?? 9999

function findVersion() {
    if (process.env.npm_package_version) return process.env.npm_package_version
    let packageJson = path.join(__dirname, '..', 'package.json')
    try {
        let json = fs.readFileSync(packageJson).toString()
        return json ? JSON.parse(json).version : undefined
    } catch (e) {
        return undefined
    }
}

if (process.env.npm_package_version) {
    console.log(`IDLize version ${findVersion()}`)
}

let didJob = false

if (options.dts2idl) {
    const tsCompileContext = new CompileContext()
    generate(
        options.inputDir.split(','),
        options.inputFile,
        options.outputDir ?? "./idl",
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, tsCompileContext, options),
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
                    verifyIdl: options.verifyIdl ?? false,
                    disableEnumInitializers: options.disableEnumInitializers ?? false
                })
                if (options.verbose) console.log(generated)
                if (!fs.existsSync(path.dirname(outFile))){
                    fs.mkdirSync(path.dirname(outFile), { recursive: true });
                }
                fs.writeFileSync(outFile, generated)
            }
        }
    )
    didJob = true
}

if (options.dts2skoala) {
    const tsCompileContext = new CompileContext()
    const generatedIDLMap = new Map<string, IDLEntry[]>()
    const outputDir: string = options.outputDir ?? "./generated/skoala"

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    generate(
        options.inputDir.split(','),
        options.inputFile,
        outputDir,
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, tsCompileContext, options),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: IDLEntry[], outputDirectory, sourceFile) => {
                const fileName = path.basename(sourceFile.fileName, ".d.ts")

                if (!generatedIDLMap.has(fileName)) {
                    generatedIDLMap.set(fileName, [])
                }

                generatedIDLMap.get(fileName)?.push(...entries)
            },
            onEnd: () => {
                generatedIDLMap.forEach((entries, fileName) => {
                    const printer = new SkoalaCCodeGenerator(entries, outputDir, fileName)

                    try {
                        printer.generate()
                        console.log(`Code generation completed for ${fileName}.h`)
                    } catch (error) {
                        if (error instanceof Error) {
                            console.error(`Error during code generation for ${fileName}.h: ${error.message}`)
                        } else {
                            console.error(`Unknown error during code generation for ${fileName}.h:`, error)
                        }
                    }
                })

                console.log("All files processed.")
            }
        }
    )
    didJob = true
}

if (options.linter) {
    const allEntries = new Array<LinterMessage[]>()
    generate(
        options.inputDir.split(','),
        options.inputFile,
        options.outputDir,
        (sourceFile, typeChecker) => new LinterVisitor(sourceFile, typeChecker),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: LinterMessage[]) => allEntries.push(entries),
            onBegin: () => { },
            onEnd: (outputDir) => {
                const outFile = options.outputDir ? path.join(outputDir, "linter.txt") : undefined
                const histogramFile = options.outputDir ? path.join(outputDir, "histogram.txt") : undefined
                let [generated, exitCode, histogram] = toLinterString(allEntries, options.linterSuppressErrors, options.linterWhitelist)
                console.log(histogram)
                if (!outFile || options.verbose) console.log(generated)
                if (outFile) fs.writeFileSync(outFile, generated)
                if (histogramFile) fs.writeFileSync(histogramFile, histogram)
                process.exit(exitCode)
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
                lines.push(`import { ArkUINodeType } from "@arkoala/arkui/peers/ArkUINodeType"`)
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
        idlToString,
    )
    didJob = true
}

if (options.dts2peer) {
    PeerGeneratorConfig.needInterfaces = options.needInterfaces
    const generatedPeersDir = options.outputDir ?? "./out/ts-peers/generated"
    const lang = Language.fromString(options.language ?? "ts")


    function addToLibrary(library: { files: IdlPeerFile[], componentsToGenerate: Set<string> }, dir: string) {
        fs.readdirSync(dir).forEach(it => {
            const idlFile = path.resolve(path.join(dir, it))
            const content = fs.readFileSync(path.resolve(path.join(dir, it))).toString()
            const nodes = webidl2.parse(content).map(it => toIDLNode(idlFile, it))
            library.files.push(
                new IdlPeerFile(idlFile, nodes, library.componentsToGenerate)
            )
        })
    }

    const PREDEFINED_PATH = path.join(__dirname, "..", "predefined")

    if (options.idl) {
        options.docs = "all"
        const idlLibrary = new IdlPeerLibrary(lang, toSet(options.generateInterface))
        // collect predefined files
        addToLibrary({
            get files() {
                return idlLibrary.predefinedFiles
            },
            componentsToGenerate: new Set()
        }, PREDEFINED_PATH)
        // process predefined files
        idlLibrary.predefinedFiles.forEach(file => {
            IdlPredefinedGeneratorVisitor.create({ 
                sourceFile: file.originalFilename,  
                peerLibrary: idlLibrary,
                peerFile: file
            }).visitWholeFile()
        })
        // First convert DTS to IDL
        generate(
            options.inputDir.split(','),
            options.inputFile,
            generatedPeersDir,
            (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, new CompileContext(), options),
            {
                compilerOptions: defaultCompilerOptions,
                onSingleFile(entries: IDLEntry[], outputDir, sourceFile) {
                    const file = new IdlPeerFile(sourceFile.fileName, entries, idlLibrary.componentsToGenerate)
                    idlLibrary.files.push(file)
                },
                onEnd(outDir) {
                    // Visit IDL peer files
                    idlLibrary.files.forEach(file => {
                        const visitor = new IdlPeerGeneratorVisitor({
                            sourceFile: file.originalFilename,
                            peerLibrary: idlLibrary,
                            peerFile: file,
                        })
                        visitor.visitWholeFile()
                    })
                    const peerProcessor = new IdlPeerProcessor(idlLibrary)
                    peerProcessor.process()
                    idlLibrary.analyze()

                    if (options.generatorTarget == "arkoala" ||
                        options.generatorTarget == "all") {
                        generateArkoalaFromIdl(outDir, idlLibrary, lang)
                    }
                    if (options.generatorTarget == "libace" ||
                        options.generatorTarget == "all") {
                        generateLibaceFromIdl(outDir, idlLibrary)
                    }
                    if (options.generatorTarget == "tracker") {
                        generateTracker(outDir, idlLibrary, options.trackerStatus)
                    }
                    if (options.generatorTarget == "ohos") {
                        generateOhos(outDir, idlLibrary)
                    }
                }
            }
        )
    } else {
        // Generate stuff the old way, directly from DTS files
        if (options.apiPrefix !== undefined) {
            PeerGeneratorConfig.cppPrefix = options.apiPrefix
        }
        const declarationTable = new DeclarationTable(options.language ?? "ts")
        const peerLibrary = new PeerLibrary(declarationTable, toSet(options.generateInterface))

        /* ---------- stub while we migrating to idl --------- */
        const kindOfLibrary = {
            files: [] as IdlPeerFile[],
            componentsToGenerate: new Set<string>()
        }
        addToLibrary(kindOfLibrary, PREDEFINED_PATH)
        for (const file of kindOfLibrary.files) {
            const pkgs = file.entries.filter(isPackage)
            if (pkgs.length !== 1 || pkgs[0]?.name !== `"org.openharmony.idlize.predefined"`) {
                continue
            }
            for (const entry of file.entries) {
                if (isInterface(entry)) {
                    peerLibrary.predefinedDeclarations.push(entry)
                }
            }
        }
        /* --------------------------------------------------- */

        generate(
            options.inputDir.split(','),
            undefined,
            generatedPeersDir,
            (sourceFile, typeChecker) => new PeerGeneratorVisitor({
                sourceFile: sourceFile,
                typeChecker: typeChecker,
                declarationTable,
                peerLibrary
            }),
            {
                compilerOptions: defaultCompilerOptions,
                onBegin(outDir, typeChecker) {
                    declarationTable.typeChecker = typeChecker
                },
                onEnd(outDir: string) {
                    let lang = declarationTable.language
                    const peerProcessor = new PeerProcessor(peerLibrary)
                    peerProcessor.process()
                    declarationTable.analyze(peerLibrary)

                    if (options.generatorTarget == "arkoala" ||
                        options.generatorTarget == "all") {
                        generateArkoala(outDir, peerLibrary, lang)
                    }

                    if (options.generatorTarget == "libace" ||
                        options.generatorTarget == "all") {
                        generateLibace(outDir, peerLibrary)
                    }

                    if (options.generatorTarget == "tracker") {
                        generateTracker(outDir, peerLibrary, options.trackerStatus)
                    }
                }
            }
        )
    }
    didJob = true
}

if (!didJob) {
    program.help()
}

function generateLibace(outDir: string, peerLibrary: PeerLibrary) {
    const libace = options.libaceDestination ?
        new LibaceInstall(options.libaceDestination, false) :
        new LibaceInstall(outDir, true)

    const gniSources = printGniSources(peerLibrary)
    fs.writeFileSync(libace.gniComponents, gniFile(gniSources))

    // printDelegatesAsMultipleFiles(peerLibrary, libace, { namespace: "OHOS::Ace::NG::GeneratedModifier" })
    printRealModifiersAsMultipleFiles(peerLibrary, libace, {
        namespaces: {
            base: "OHOS::Ace::NG",
            generated: "OHOS::Ace::NG::GeneratedModifier"
        },
        basicVersion: 1,
        fullVersion: apiVersion,
        extendedVersion: 6,
    })

    const converterNamespace = "OHOS::Ace::NG::Converter"
    const { api, converterHeader } = printUserConverter(libace.userConverterHeader, converterNamespace, apiVersion, peerLibrary)
    fs.writeFileSync(libace.generatedArkoalaApi, api)
    fs.writeFileSync(libace.userConverterHeader, converterHeader)
    const events = printEventsCLibaceImpl(peerLibrary, {namespace: "OHOS::Ace::NG::GeneratedEvents"})
    fs.writeFileSync(libace.allEvents, events)

    if (!options.libaceDestination) {
        const mesonBuild = printMesonBuild(peerLibrary)
        fs.writeFileSync(libace.mesonBuild, mesonBuildFile(mesonBuild))
    }

    copyToLibace(path.join(__dirname, '..', 'peer_lib'), libace)
}

function generateLibaceFromIdl(outDir: string, peerLibrary: IdlPeerLibrary) {
    const libace = options.libaceDestination ?
        new LibaceInstall(options.libaceDestination, false) :
        new LibaceInstall(outDir, true)

    const gniSources = printGniSources(peerLibrary)
    fs.writeFileSync(libace.gniComponents, gniFile(gniSources))

    // printDelegatesAsMultipleFiles(peerLibrary, libace, { namespace: "OHOS::Ace::NG::GeneratedModifier" })
    printRealModifiersAsMultipleFiles(peerLibrary, libace, {
        namespaces: {
            base: "OHOS::Ace::NG",
            generated: "OHOS::Ace::NG::GeneratedModifier"
        },
        basicVersion: 1,
        fullVersion: apiVersion,
        extendedVersion: 6,
    })

    const converterNamespace = "OHOS::Ace::NG::Converter"
    const { api, converterHeader } = printUserConverter(libace.userConverterHeader, converterNamespace, apiVersion, peerLibrary)
    fs.writeFileSync(libace.generatedArkoalaApi, api)
    fs.writeFileSync(libace.userConverterHeader, converterHeader)
    const events = printEventsCLibaceImpl(peerLibrary, {namespace: "OHOS::Ace::NG::GeneratedEvents"})
    fs.writeFileSync(libace.allEvents, events)

    if (!options.libaceDestination) {
        const mesonBuild = printMesonBuild(peerLibrary)
        fs.writeFileSync(libace.mesonBuild, mesonBuildFile(mesonBuild))
    }

    copyToLibace(path.join(__dirname, '..', 'peer_lib'), libace)
}

function writeFile(filename: string, content: string, integrated: boolean = false, message?: string): boolean {
    if (integrated || !options.onlyIntegrated) {
        if (message)
            console.log(message, filename)
        fs.mkdirSync(path.dirname(filename), { recursive: true })
        fs.writeFileSync(filename, content)
        return true
    }
    return false
}

function generateArkoala(outDir: string, peerLibrary: PeerLibrary, lang: Language) {
    const arkoala = options.arkoalaDestination ?
        new ArkoalaInstall(options.arkoalaDestination, lang, false) :
        new ArkoalaInstall(outDir, lang, true)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))
    arkoala.createDirs(['', ''].map(dir => path.join(arkoala.cjDir, dir)))

    const arkuiComponentsFiles: string[] = []
    const context = createPrinterContext(peerLibrary.declarationTable)

    const peers = printPeers(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, peer] of peers) {
        const outPeerFile = arkoala.peer(targetFile)
        writeFile(outPeerFile, peer, true, "producing")
    }

    const components = printComponents(peerLibrary, context)
    for (const [targetFile, component] of components) {
        const outComponentFile = arkoala.component(targetFile)
        writeFile(outComponentFile, component, true, "producing")
        if (options.verbose) console.log(component)
        arkuiComponentsFiles.push(outComponentFile)
    }

    const builderClasses = printBuilderClasses(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, builderClass] of builderClasses) {
        const outBuilderFile = arkoala.builderClass(targetFile)
        fs.writeFileSync(outBuilderFile, builderClass)
        arkuiComponentsFiles.push(outBuilderFile)
    }

    const materialized = printMaterialized(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, materializedClass] of materialized) {
        const outMaterializedFile = arkoala.materialized(targetFile)
        if (writeFile(outMaterializedFile, materializedClass, peerLibrary.declarationTable.language === Language.ARKTS)) {
            arkuiComponentsFiles.push(outMaterializedFile)
        }
    }

    // NativeModule
    if (lang === Language.TS) {
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModuleEmpty')),
            printNativeModuleEmpty(peerLibrary),
            true
        )
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi"),
            true
        )
    }
    else if (lang === Language.JAVA) {
        writeFile(
            arkoala.javaLib(new TargetFile('NativeModule', ARKOALA_PACKAGE_PATH)),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi")
        )
    } else if (lang === Language.CJ) {
        writeFile(
            arkoala.cjLib(new TargetFile('NativeModule', '')),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi")
        )
    }
    else if (lang === Language.ARKTS) {
        writeFile(
            arkoala.arktsLib(new TargetFile('NativeModule', 'arkts')),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi"),
            true,
        )
    } else {
        writeFile(
            arkoala.langLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi"),
            true,
        )
    }

    if (lang == Language.TS) {
        // todo I think we want to generate them for ARKTS too
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetFile)
            writeFile(outComponentFile, data, false, "producing")
            arkuiComponentsFiles.push(outComponentFile)
        }

        const fakeDeclarations = printFakeDeclarations(peerLibrary)
        for (const [filename, data] of fakeDeclarations) {
            const outComponentFile = arkoala.interface(new TargetFile(filename))
            writeFile(outComponentFile, data, true, "producing")
            if (options.verbose) console.log(data)
            arkuiComponentsFiles.push(outComponentFile)
        }

        writeFile(
            arkoala.tsLib(new TargetFile('ConflictedDeclarations')),
            printConflictedDeclarations(peerLibrary),
        )
        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
        )
        writeFile(
            arkoala.tsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles),
        )
        writeFile(
            arkoala.tsLib(new TargetFile("peer_events")),
            printEvents(peerLibrary),
            true
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary),
            true,
        )
        writeFile(arkoala.peer(new TargetFile('Deserializer')),
            makeTSDeserializer(peerLibrary),
            true,
        )
    }
    if (lang == Language.ARKTS) {
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetBasename, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetBasename)
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            writeFile(outComponentFile, data, true)
            arkuiComponentsFiles.push(outComponentFile)
        }
        const fakeDeclarations = printFakeDeclarations(peerLibrary)
        for (const [filename, data] of fakeDeclarations) {
            const outComponentFile = arkoala.interface(new TargetFile(filename))
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            writeFile(outComponentFile, data, true)
            arkuiComponentsFiles.push(outComponentFile)
        }
        writeFile(
            arkoala.arktsLib(new TargetFile('ConflictedDeclarations')),
            printConflictedDeclarations(peerLibrary),
            true,
        )
        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
            true,
        )
        writeFile(
            arkoala.arktsLib(new TargetFile("peer_events")),
            printEvents(peerLibrary),
            true
        )
        writeFile(
            arkoala.arktsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles),
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary),
            true,
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'arkts')),
            makeTypeChecker(peerLibrary).arkts,
            true,
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'ts')),
            makeTypeChecker(peerLibrary).ts,
            true,
        )
    }
    if (lang == Language.JAVA) {
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.javaLib(targetFile)
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const synthesizedTypes = context.synthesizedTypes!.getDefinitions()
        for (const [targetFile, data] of synthesizedTypes) {
            const outComponentFile = arkoala.javaLib(targetFile)
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const serializer = makeJavaSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.javaLib(serializer.targetFile))

        const nodeTypes = makeJavaNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.javaLib(nodeTypes.targetFile))

        const arkComponents = makeJavaArkComponents(peerLibrary, context)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))
    }
    if (lang == Language.CJ) {
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.cjLib(targetFile)
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const synthesizedTypes = context.synthesizedTypes!.getDefinitions()
        for (const [targetFile, data] of synthesizedTypes) {
            const outComponentFile = arkoala.cjLib(targetFile)
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const writer = makeCJSerializer(peerLibrary)
        writer.printTo(arkoala.cjLib(new TargetFile('Serializer', '')))


        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
            true,
        )

    }

    writeFile(arkoala.native(new TargetFile('bridge_generated.cc')), printBridgeCcGenerated(peerLibrary, options.callLog ?? false), true)
    writeFile(arkoala.native(new TargetFile('bridge_custom.cc')), printBridgeCcCustom(peerLibrary, options.callLog ?? false))

    const { api, serializers } = printSerializers(apiVersion, peerLibrary)
    writeFile(arkoala.native(new TargetFile('Serializers.h')), serializers, true)
    writeFile(arkoala.native(new TargetFile('arkoala_api_generated.h')), api, true)

    const modifiers = printRealAndDummyModifiers(peerLibrary)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, apiVersion, 6).getOutput().join('\n'),
    )
    writeFile(
        arkoala.native(new TargetFile('real_impl.cc')),
        dummyImplementations(modifiers.real, accessors.real, 1, apiVersion, 6).getOutput().join('\n'),
        true,
    )
    writeFile(arkoala.native(new TargetFile('all_events.cc'),), printEventsCArkoalaImpl(peerLibrary), true)
    writeFile(arkoala.native(new TargetFile('library.cc')), libraryCcDeclaration())

    copyArkoalaFiles(arkoala)
}

function copyArkoalaFiles(arkoala: ArkoalaInstall) {
    copyToArkoala(path.join(__dirname, '..', 'peer_lib'), arkoala, !options.onlyIntegrated ? undefined : [
        'sig/arkoala/framework/native/src/generated/SerializerBase.h',
        'sig/arkoala/framework/native/src/generated/DeserializerBase.h',
        'sig/arkoala/framework/native/src/generated/Interop.h',
        'sig/arkoala/framework/native/src/generated/arkoala-macros.h',
        'sig/arkoala/arkui/src/peers/SerializerBase.ts',
        'sig/arkoala/arkui/src/peers/DeserializerBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/use_properties.ts',
        'sig/arkoala-arkts/arkui/src/generated/Finalizable.ts',
        'sig/arkoala-arkts/arkui/src/generated/CallbackRegistry.ts',
        'sig/arkoala-arkts/arkui/src/generated/ComponentBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/PeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/NativePeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/arkts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/NativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/SerializerBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/ArkResource.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/dts-exports.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/generated-utils.ts',
    ])
}

function generateArkoalaFromIdl(outDir: string, peerLibrary: IdlPeerLibrary, lang: Language) {
    const arkoala = options.arkoalaDestination ?
        new ArkoalaInstall(options.arkoalaDestination, lang, false) :
        new ArkoalaInstall(outDir, lang, true)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))

    const context = {
        language: lang,
        synthesizedTypes: undefined,
        imports: undefined
    }
    const arkuiComponentsFiles: string[] = []

    const peers = printPeers(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, peer] of peers) {
        const outPeerFile = arkoala.peer(targetFile)
        writeFile(outPeerFile, peer, true, "producing [idl]")
    }
    const components = printComponents(peerLibrary, context)
    for (const [targetFile, component] of components) {
        const outComponentFile = arkoala.component(targetFile)
        if (options.verbose) console.log(component)
        writeFile(outComponentFile, component, true, "producing [idl]")
        arkuiComponentsFiles.push(outComponentFile)
    }
    const builderClasses = printBuilderClasses(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, builderClass] of builderClasses) {
        const outBuilderFile = arkoala.builderClass(targetFile)
        writeFile(outBuilderFile, builderClass, false, "producing [idl]")
    }
    const materialized = printMaterialized(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, materializedClass] of materialized) {
        const outMaterializedFile = arkoala.materialized(targetFile)
        writeFile(outMaterializedFile, materializedClass, peerLibrary.language === Language.ARKTS, "producing [idl]")
    }
    if (PeerGeneratorConfig.needInterfaces) {
        const interfaces = printIdlInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetFile)
            writeFile(outComponentFile, data, false, "producing [idl]")
            arkuiComponentsFiles.push(outComponentFile)
        }
    }
    const fakeDeclarations = printIdlFakeDeclarations(peerLibrary)
    for (const [targetFile, data] of fakeDeclarations) {
        const outComponentFile = arkoala.interface(targetFile)
        writeFile(outComponentFile, data, true, "producing [idl, fake]")
        if (options.verbose) console.log(data)
        arkuiComponentsFiles.push(outComponentFile)
    }

    if (peerLibrary.language == Language.TS) {
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModuleEmpty')),
            printNativeModuleEmpty(peerLibrary),
            true, "producing [idl]"
        )
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi"),
            true, "producing [idl]"
        )
        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary)
        )
        writeFile(
            arkoala.tsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles),
        )
        writeFile(
            arkoala.tsLib(new TargetFile("peer_events")),
            printEvents(peerLibrary),
            true
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary),
            true,
        )
        writeFile(arkoala.peer(new TargetFile('Deserializer')),
            makeTSDeserializer(peerLibrary),
            true,
        )
    }

    if (peerLibrary.language == Language.JAVA) {
        writeFile(
            arkoala.javaLib(new TargetFile('NativeModule', ARKOALA_PACKAGE_PATH)),
            printNativeModule(peerLibrary, options.nativeBridgeDir),
            true, "producing [idl]"
        )

        const nodeTypes = makeJavaNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.javaLib(nodeTypes.targetFile))

        const arkComponents = makeJavaArkComponents(peerLibrary, context)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        const serializer = makeJavaSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.javaLib(serializer.targetFile))
    }

    // native code
    writeFile(arkoala.native(new TargetFile('bridge_generated.cc')), printBridgeCcGenerated(peerLibrary, options.callLog ?? false), true)
    writeFile(arkoala.native(new TargetFile('bridge_custom.cc')), printBridgeCcCustom(peerLibrary, options.callLog ?? false))

    const { api, serializers } = printSerializers(apiVersion, peerLibrary)
    writeFile(arkoala.native(new TargetFile('Serializers.h')), serializers, true)
    writeFile(arkoala.native(new TargetFile('arkoala_api_generated.h')), api, true)

    const modifiers = printRealAndDummyModifiers(peerLibrary)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, apiVersion , 6).getOutput().join('\n'),
    )
    writeFile(
        arkoala.native(new TargetFile('real_impl.cc')),
        dummyImplementations(modifiers.real, accessors.real, 1, apiVersion, 6).getOutput().join('\n'),
        true,
    )
    writeFile(arkoala.native(new TargetFile('all_events.cc'),), printEventsCArkoalaImpl(peerLibrary), true)
    writeFile(arkoala.native(new TargetFile('library.cc')), libraryCcDeclaration())

    copyArkoalaFiles(arkoala)
}
