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
import { fromIDL, scanIDL } from "./from-idl/common"
import { idlToString } from "./from-idl/DtsPrinter"
import { generate } from "./idlize"
import { IDLEntry, forEachChild, toIDLString } from "./idl"
import { printHeader, toHeaderString, wrapWithPrologueAndEpilogue } from "./idl2h"
import { LinterMessage, LinterVisitor, toLinterString } from "./linter"
import { CompileContext, IDLVisitor } from "./IDLVisitor"
import { TestGeneratorVisitor } from "./TestGeneratorVisitor"
import { ArkoalaInstall, LibaceInstall } from "./Install"
import {
    copyToArkoala,
    dummyImplementations,
    makeArkuiModule,
    makeTSSerializer,
    makeJavaSerializerWriter,
    makeTSDeserializer,
    gniFile,
    mesonBuildFile,
    copyToLibace,
    libraryCcDeclaration,
} from "./peer-generation/FileGenerators"
import {
    PeerGeneratorVisitor,
    PeerProcessor,
} from "./peer-generation/PeerGeneratorVisitor"
import { defaultCompilerOptions, isDefined, toSet, Language } from "./util"
import { TypeChecker } from "./typecheck"
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
import { printConflictedDeclarations } from "./peer-generation/printers/ConflictedDeclarationsPrinter"
import { printFakeDeclarations } from "./peer-generation/printers/FakeDeclarationsPrinter"
import { printBuilderClasses } from "./peer-generation/printers/BuilderClassPrinter"
import { ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH } from "./peer-generation/printers/lang/Java"
import { TargetFile } from "./peer-generation/printers/TargetFile"
import { printBridgeCcCustom, printBridgeCcGenerated } from "./peer-generation/printers/BridgeCcPrinter"
import { createPrinterContext } from "./peer-generation/printers/PrinterContext/PrinterContextImpl"

const options = program
    .option('--dts2idl', 'Convert .d.ts to IDL definitions')
    .option('--dts2h', 'Convert .d.ts to .h definitions')
    .option('--dts2test', 'Generate tests from .d.ts to .h')
    .option('--dts2peer', 'Convert .d.ts to peer drafts')
    .option('--ets2ts', 'Convert .ets to .ts')
    .option('--input-dir <path>', 'Path to input dir')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <name>', 'Name of file to convert, all files in input-dir if none')
    .option('--idl2dts', 'Convert IDL to .d.ts definitions')
    .option('--idl2h', 'Convert IDL to .h definitions')
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
    .option('--language [ts|sts|java|cangjie]', 'Output language')
    .option('--api-prefix <string>', 'Cpp prefix to be compatible with manual arkoala implementation')
    .option('--need-interfaces', 'Generate interfaces to resolve all .d.ts dependencies', false)
    .option('--only-integrated', 'Generate only thoose files that can be integrated to target', false)
    .option('--version')
    .option('--generator-target <all|arkoala|libace|none>', 'Copy peers to arkoala or libace (use with --dts2peer)', "all")
    .option('--arkoala-destination <path>', 'Location of arkoala repository')
    .option('--libace-destination <path>', 'Location of libace repository')
    .option('--copy-peers-components <name...>', 'List of components to copy (omit to copy all)')
    .parse()
    .opts()

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
        options.inputDir,
        options.inputFile,
        options.outputDir ?? "./idl",
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, tsCompileContext, options),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: IDLEntry[], outputDir, sourceFile) => {
                const outFile = path.join(outputDir,
                    path.basename(sourceFile.fileName).replace(".d.ts", ".idl"))
                console.log("producing", outFile)
                if (options.skipDocs) {
                    entries.forEach(it => forEachChild(
                        it, (it) => it.documentation = undefined))
                }
                let generated = toIDLString(entries, {
                    verifyIdl: options.verifyIdl ?? false,
                    disableEnumInitializers: options.disableEnumInitializers ?? false
                })
                if (options.verbose) console.log(generated)
                fs.writeFileSync(outFile, generated)
            }
        }
    )
    didJob = true
}

if (options.dts2h) {
    const allEntries = new Array<IDLEntry[]>()
    const tsCompileContext = new CompileContext()
    generate(
        options.inputDir,
        options.inputFile,
        options.outputDir ?? "./headers",
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, tsCompileContext, options.commonToAttributes ?? false),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: IDLEntry[]) => allEntries.push(entries),
        }
    )
    const outFile = path.join(options.outputDir ?? "./headers", "arkoala_api_generated.h")
    console.log("producing", outFile)

    const generated = toHeaderString(new TypeChecker(allEntries.flat()), allEntries, options.generateInterface)
    if (options.verbose) console.log(generated)
    fs.writeFileSync(outFile, generated)
    didJob = true
}

if (options.linter) {
    const allEntries = new Array<LinterMessage[]>()
    generate(
        options.inputDir,
        options.inputFile,
        options.outputDir,
        (sourceFile, typeChecker) => new LinterVisitor(sourceFile, typeChecker),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: LinterMessage[]) => allEntries.push(entries),
            onBegin: () => { },
            onEnd: (outputDir) => {
                const outFile = options.outputDir ? path.join(outputDir, "linter.txt") : undefined
                let [generated, exitCode, histogram] = toLinterString(allEntries, options.linterSuppressErrors, options.linterWhitelist)
                console.log(histogram)
                if (!outFile || options.verbose) console.log(generated)
                if (outFile) fs.writeFileSync(outFile, generated)
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

        let inDir = path.resolve(options.inputDir)
        testInterfaces = fs.readdirSync(inDir)
            .filter(file => file.endsWith("d.ts"))
            .map(file => file.substring(0, file.length - 5))
            .map(fileNameToClass)
            .join(',')
    }

    let lines: string[] = []
    generate(
        options.inputDir,
        options.inputFile,
        options.outputDir ?? "./generated/tests",
        (sourceFile, typeChecker) => new TestGeneratorVisitor(sourceFile, typeChecker, testInterfaces, options.testMethod, options.testProperties),
        {
            compilerOptions: defaultCompilerOptions,
            onBegin: (outDir: string) => {
                lines.push(`import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"`)
                lines.push(`import {checkResult, checkTestFailures} from "../subset/test_utils"`)
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

if (options.idl2h) {
    const idlFiles = scanIDL(
        options.inputDir,
        options.inputFile
    )
    const typeChecker = new TypeChecker(idlFiles.flat())
    const body = idlFiles
        .flatMap(it => printHeader(typeChecker, it, toSet(options.generateInterface)))
        .filter(isDefined)
        .filter(it => it.length > 0)
        .join("\n")
    const generatedHeader = wrapWithPrologueAndEpilogue(body)
    if (options.verbose) {
        console.log(body)
    }
    const outputDir = options.outputDir ?? "./generated/headers"
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }
    const outFile = path.join(outputDir, "arkoala_api_generated.h")
    console.log("producing", outFile)
    fs.writeFileSync(outFile, generatedHeader)
    didJob = true
}

if (options.dts2peer) {
    if (options.apiPrefix !== undefined) {
        PeerGeneratorConfig.cppPrefix = options.apiPrefix
    }
    PeerGeneratorConfig.needInterfaces = options.needInterfaces
    const declarationTable = new DeclarationTable(options.language ?? "ts")
    const peerLibrary = new PeerLibrary(declarationTable, toSet(options.generateInterface))
    const generatedPeersDir = options.outputDir ?? "./generated/peers"

    generate(
        options.inputDir,
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
            }
        }
    )
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
        fullVersion: options.apiVersion,
        extendedVersion: 6,
    })

    const converterNamespace = "OHOS::Ace::NG::Converter"
    const { api, converterHeader } = printUserConverter(libace.userConverterHeader, converterNamespace, options.apiVersion, peerLibrary)
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

function writeFile(filename: string, content: string, integrated: boolean = false) {
    if (integrated || !options.onlyIntegrated)
        fs.writeFileSync(filename, content)
}

function generateArkoala(outDir: string, peerLibrary: PeerLibrary, lang: Language) {
    const arkoala = options.arkoalaDestination ?
        new ArkoalaInstall(options.arkoalaDestination, lang, false) :
        new ArkoalaInstall(outDir, lang, true)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))

    const arkuiComponentsFiles: string[] = []
    const context = createPrinterContext(peerLibrary.declarationTable)

    const peers = printPeers(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, peer] of peers) {
        const outPeerFile = arkoala.peer(targetFile)
        console.log("producing", outPeerFile)
        writeFile(outPeerFile, peer, true)
    }

    const components = printComponents(peerLibrary)
    for (const [targetBasename, component] of components) {
        const outComponentFile = arkoala.component(new TargetFile(targetBasename))
        console.log("producing", outComponentFile)
        if (options.verbose) console.log(component)
        writeFile(outComponentFile, component, true)
        arkuiComponentsFiles.push(outComponentFile)
    }

    const builderClasses = printBuilderClasses(peerLibrary, options.dumpSerialized ?? false)
    for (const [targetBasename, builderClass] of builderClasses) {
        const outBuilderFile = arkoala.builderClass(new TargetFile(targetBasename))
        fs.writeFileSync(outBuilderFile, builderClass)
    }

    const materialized = printMaterialized(peerLibrary, context, options.dumpSerialized ?? false)
    for (const [targetFile, materializedClass] of materialized) {
        const outMaterializedFile = arkoala.materialized(targetFile)
        writeFile(outMaterializedFile, materializedClass)
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
    } else {
        writeFile(
            arkoala.langLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../../../../native/NativeBridgeNapi")
        )
    }

    if (lang == Language.TS) {
        // todo I think we want to generate them for ARKTS too
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetFile)
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            writeFile(outComponentFile, data)
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
            writeFile(outComponentFile, data)
        }
        const fakeDeclarations = printFakeDeclarations(peerLibrary)
        for (const [filename, data] of fakeDeclarations) {
            const outComponentFile = arkoala.interface(new TargetFile(filename))
            console.log("producing", outComponentFile)
            if (options.verbose) console.log(data)
            writeFile(outComponentFile, data, true)
        }
        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary)
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

        const writer = makeJavaSerializerWriter(peerLibrary)
        writer.printTo(arkoala.javaLib(new TargetFile('Serializer', ARKOALA_PACKAGE_PATH)))
    }
    writeFile(arkoala.native(new TargetFile('bridge_generated.cc')), printBridgeCcGenerated(peerLibrary, options.callLog ?? false), true)
    writeFile(arkoala.native(new TargetFile('bridge_custom.cc')), printBridgeCcCustom(peerLibrary, options.callLog ?? false))

    const { api, serializers } = printSerializers(options.apiVersion, peerLibrary)
    writeFile(arkoala.native(new TargetFile('Serializers.h')), serializers, true)
    writeFile(arkoala.native(new TargetFile('arkoala_api_generated.h')), api, true)

    const modifiers = printRealAndDummyModifiers(peerLibrary)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, options.apiVersion, 6).getOutput().join('\n'),
    )
    writeFile(
        arkoala.native(new TargetFile('real_impl.cc')),
        dummyImplementations(modifiers.real, accessors.real, 1, options.apiVersion, 6).getOutput().join('\n'),
        true,
    )
    writeFile(arkoala.native(new TargetFile('all_events.cc'),), printEventsCArkoalaImpl(peerLibrary), true)
    writeFile(arkoala.native(new TargetFile('library.cc')), libraryCcDeclaration())

    copyToArkoala(path.join(__dirname, '..', 'peer_lib'), arkoala, !options.onlyIntegrated ? undefined : [
        'koala-ui/arkoala/native/src/generated/SerializerBase.h',
        'koala-ui/arkoala/native/src/generated/DeserializerBase.h',
        'koala-ui/arkoala/native/src/generated/Interop.h',
        'koala-ui/arkoala/native/src/generated/arkoala-macros.h',
        'koala-ui/arkoala-arkui/src/peers/SerializerBase.ts',
        'koala-ui/arkoala-arkui/src/peers/DeserializerBase.ts',
    ])
}
