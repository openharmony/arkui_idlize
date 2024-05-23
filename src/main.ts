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
import {
    copyPeerLib,
    completeImplementations,
    dummyImplementations,
    makeArkuiModule,
    makeTSSerializer,
    completeEventsImplementations,
} from "./peer-generation/FileGenerators"
import {
    PeerGeneratorVisitor,
} from "./peer-generation/PeerGeneratorVisitor"
import { defaultCompilerOptions, isDefined, toSet, langSuffix, Language } from "./util"
import { TypeChecker } from "./typecheck"
import { initRNG } from "./rand_utils"
import { DeclarationTable } from "./peer-generation/DeclarationTable"
import { printRealAndDummyAccessors } from "./peer-generation/AccessorPrinter"
import { printRealAndDummyModifiers } from "./peer-generation/ModifierPrinter"
import { PeerLibrary } from "./peer-generation/PeerLibrary"
import { printComponents } from "./peer-generation/ComponentsPrinter"
import { printPeers } from "./peer-generation/PeersPrinter"
import { printMaterialized } from "./peer-generation/MaterializedPrinter"
import { printApiAndDeserializer } from "./peer-generation/HeaderPrinter"
import { printNodeTypes } from "./peer-generation/NodeTypesPrinter"
import { printStructCommon } from "./peer-generation/StructCommonPrinter"
import { printNativeModule, printNativeModuleEmpty } from "./peer-generation/NativeModulePrinter"
import { printBridgeCc } from "./peer-generation/BridgeCcPrinter"
import { printImportsStubs } from "./peer-generation/ImportsStubsPrinter"
import { printDelegatesHeaders, printDelegatesImplementation } from "./peer-generation/DelegatePrinter"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig";
import { printEvents, printEventsCImpl } from "./peer-generation/EventsPrinter"
import { collectDtsImports } from "./peer-generation/DtsImportsGenerator"

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
    .option('--language [ts|sts|java]', 'Output language')
    .option('--api-prefix <string>', 'Cpp prefix to be compatible with manual arkoala implementation')
    .option('--version')
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
    const outFile = path.join(options.outputDir ?? "./headers", "arkoala_api.h")
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
    const outFile = path.join(outputDir, "arkoala_api.h")
    console.log("producing", outFile)
    fs.writeFileSync(outFile, generatedHeader)
    didJob = true
}

if (options.dts2peer) {
    if (options.apiPrefix !== undefined) {
        PeerGeneratorConfig.cppPrefix = options.apiPrefix
    }
    const declarationTable = new DeclarationTable(options.language ?? "ts")
    const peerLibrary = new PeerLibrary(declarationTable)
    const arkuiComponentsFiles: string[] = []

    generate(
        options.inputDir,
        undefined,
        options.outputDir ?? "./generated/peers",
        (sourceFile, typeChecker) => new PeerGeneratorVisitor({
            sourceFile: sourceFile,
            typeChecker: typeChecker,
            interfacesToGenerate: toSet(options.generateInterface),
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

                const peers = printPeers(peerLibrary, options.dumpSerialized ?? false)
                for (const [targetBasename, peer] of peers) {
                    const outPeerFile = path.join(outDir,targetBasename)
                    console.log("producing", outPeerFile)
                    fs.writeFileSync(outPeerFile, peer)
                }

                const components = printComponents(peerLibrary)
                for (const [targetBasename, component] of components) {
                    const outComponentFile = path.join(outDir, targetBasename)
                    console.log("producing", outComponentFile)
                    if (options.verbose) console.log(component)
                    fs.writeFileSync(outComponentFile, component)
                    arkuiComponentsFiles.push(outComponentFile)
                }

                const materialized = printMaterialized(peerLibrary, options.dumpSerialized ?? false)
                for (const [targetBasename, materializedClass] of materialized) {
                    const outMaterilizedFile = path.join(outDir,targetBasename)
                    fs.writeFileSync(outMaterilizedFile, materializedClass)
                }

                fs.writeFileSync(
                    path.join(outDir, 'NativeModule' + langSuffix(lang)),
                    printNativeModule(peerLibrary, options.nativeBridgeDir ?? "../../../../native/NativeBridgeNapi")
                )
                if (lang == Language.TS) {
                    fs.writeFileSync(
                        path.join(outDir, 'ImportsStubs' + langSuffix(lang)),
                        printImportsStubs(peerLibrary),
                    )
                    fs.writeFileSync(
                        path.join(outDir, 'NativeModuleEmpty' + langSuffix(lang)),
                        printNativeModuleEmpty(peerLibrary)
                    )
                    fs.writeFileSync(
                        path.join(outDir, 'ArkUINodeType' + langSuffix(lang)),
                        printNodeTypes(peerLibrary),
                    )
                    fs.writeFileSync(
                        path.join(outDir, 'index.ts'),
                        makeArkuiModule(arkuiComponentsFiles),
                    )
                    fs.writeFileSync(
                        path.join(outDir, 'ArkCommon' + langSuffix(lang)),
                        printStructCommon(peerLibrary),
                    )
                    fs.writeFileSync(path.join(outDir, 'Serializer' + langSuffix(lang)),
                        makeTSSerializer(declarationTable)
                    )
                    fs.writeFileSync(
                        path.join(outDir, "peer_events" + langSuffix(lang)),
                        printEvents(peerLibrary)
                    )
                }
                if(lang == Language.ARKTS) {
                    fs.writeFileSync(
                        path.join(outDir, 'ArkUINodeType' + langSuffix(lang)),
                        printNodeTypes(peerLibrary),
                    )
                    fs.writeFileSync(path.join(outDir, 'Serializer' + langSuffix(lang)),
                        makeTSSerializer(declarationTable)
                    )
                    fs.writeFileSync(
                        path.join(outDir, 'ArkCommon' + langSuffix(lang)),
                        collectDtsImports() + printStructCommon(peerLibrary),
                    )
                }
                fs.writeFileSync(path.join(outDir, 'bridge.cc'), printBridgeCc(peerLibrary, options.callLog ?? false))

                const {api, deserializer} = printApiAndDeserializer(options.apiVersion, peerLibrary)
                fs.writeFileSync(path.join(outDir, 'Deserializer.h'), deserializer)
                fs.writeFileSync(path.join(outDir, 'arkoala_api.h'), api)
                fs.writeFileSync(path.join(outDir, 'delegates.h'), printDelegatesHeaders(peerLibrary))
                fs.writeFileSync(path.join(outDir, 'delegates.cc'), printDelegatesImplementation(peerLibrary))

                const modifiers = printRealAndDummyModifiers(peerLibrary)
                const accessors = printRealAndDummyAccessors(peerLibrary)
                fs.writeFileSync(path.join(outDir, 'dummy_impl.cc'), dummyImplementations(modifiers.dummy + accessors.dummy))
                fs.writeFileSync(path.join(outDir, 'all_modifiers.cc'), completeImplementations(modifiers.real + accessors.real))
                fs.writeFileSync(path.join(outDir, 'all_events.cc'), completeEventsImplementations(printEventsCImpl(peerLibrary)))

                copyPeerLib(path.join(__dirname, '..', 'peer_lib'), outDir)
            }
        }
    )
    didJob = true
}

if (!didJob) {
    program.help()
}
