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
    bridgeCcDeclaration,
    completeImplementations,
    copyPeerLib,
    dummyImplementations,
    modifierStructList,
    modifierStructs,
    makeAPI,
    makeCDeserializer,
    makeNodeTypes,
    makeTSSerializer,
    nativeModuleDeclaration,
    nativeModuleEmptyDeclaration,

} from "./peer-generation/FileGenerators"
import {
    PeerGeneratorVisitor,
    PeerGeneratorVisitorOutput
} from "./peer-generation/PeerGeneratorVisitor"
import { defaultCompilerOptions, isDefined, renameDtsToPeer, renameDtsToComponent as renameDtsToComponent, stringOrNone, toSet } from "./util"
import { TypeChecker  } from "./typecheck"
import { initRNG } from "./rand_utils"
import { DeclarationTable } from "./peer-generation/DeclarationTable"
import {IndentedPrinter} from "./IndentedPrinter";

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
    .option('--dump-serialized', "Dump serialized data")
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--version')
    .parse()
    .opts()

function findVersion() {
    if (process.env.npm_package_version) return process.env.npm_package_version
    let packageJson = path.join(__dirname, '..', 'package.json')
    try {
        let json = fs.readFileSync(packageJson).toString()
        return json ? JSON.parse(json).version : undefined
    } catch(e) {
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
            onBegin: () => {},
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
        options.outputDir ?? "./tests",
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
        options.outputDir ?? "./dts/",
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
    const outputDir = options.outputDir ?? "./headers"
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }
    const outFile = path.join(outputDir, "arkoala_api.h")
    console.log("producing", outFile)
    fs.writeFileSync(outFile, generatedHeader)
    didJob = true
}

if (options.dts2peer) {
    const nativeMethods: string[] = []
    const nativeEmptyMethods: string[] = []
    const nodeTypes: string[] = []
    const bridgeCcArray: string[] = []
    const apiHeaders: string[] = []
    const apiHeadersList: string[] = []
    const dummyImpl: string[] = []
    const modifiers: string[] = []
    const modifierList: string[] = []
    const completeImpl: string[] = []
    const declarationTable = new DeclarationTable()

    generate(
        options.inputDir,
        undefined,
        options.outputDir ?? "./peers",
        (sourceFile, typeChecker) => new PeerGeneratorVisitor({
            sourceFile: sourceFile,
            typeChecker: typeChecker,
            interfacesToGenerate: toSet(options.generateInterface),
            nativeModuleMethods: nativeMethods,
            nativeModuleEmptyMethods: nativeEmptyMethods,
            nodeTypes: nodeTypes,
            outputC: bridgeCcArray,
            apiHeaders: apiHeaders,
            apiHeadersList: apiHeadersList,
            dummyImpl: dummyImpl,
            modifiers: modifiers,
            modifierList: modifierList,
            modifierImpl: completeImpl,
            dumpSerialized: options.dumpSerialized ?? false,
            declarationTable,
        }),
        {
            compilerOptions: defaultCompilerOptions,
            onBegin(outDir, typeChecker) {
                declarationTable.typeChecker = typeChecker
            },
            onSingleFile: (output: PeerGeneratorVisitorOutput, outputDir, sourceFile) => {
                const skipComponentGenerationDueToCompileProblems = true

                if (output.peer.length > 0) {
                    const outPeerFile = path.join(
                        outputDir,
                        renameDtsToPeer(path.basename(sourceFile.fileName))
                    )
                    console.log("producing", outPeerFile)
                    let generated = output.peer
                        .filter(element => (element?.length ?? 0) > 0)
                        .join("\n")
                    if (options.verbose) console.log(generated)
                    fs.writeFileSync(outPeerFile, generated)
                }

                if (!skipComponentGenerationDueToCompileProblems && output.component.length > 0) {
                    const outComponentFile = path.join(
                        outputDir,
                        renameDtsToComponent(path.basename(sourceFile.fileName))
                    )
                    console.log("producing", outComponentFile)
                    let generated = output.component
                        .filter(element => (element?.length ?? 0) > 0)
                        .join("\n")
                    if (options.verbose) console.log(generated)
                    fs.writeFileSync(outComponentFile, generated)
                }
            },
            onEnd(outDir: string) {
                fs.writeFileSync(
                    path.join(outDir, 'NativeModule.ts'),
                    nativeModuleDeclaration(nativeMethods.sort(), options.nativeBridgeDir ?? "../../../../native/NativeBridge", false)
                )
                fs.writeFileSync(
                    path.join(outDir, 'NativeModuleEmpty.ts'),
                    nativeModuleEmptyDeclaration(nativeEmptyMethods.sort())
                )
                fs.writeFileSync(
                    path.join(outDir, 'ArkUINodeType.ts'),
                    makeNodeTypes(nodeTypes)
                )
                const bridgeCc = bridgeCcDeclaration(bridgeCcArray)
                fs.writeFileSync(path.join(outDir, 'bridge.cc'), bridgeCc)
                fs.writeFileSync(path.join(outDir, 'Serializer.ts'), makeTSSerializer(declarationTable))

                const structs = new IndentedPrinter()
                const typedefs = new IndentedPrinter()

                fs.writeFileSync(path.join(outDir, 'Deserializer.h'), makeCDeserializer(declarationTable, structs, typedefs))
                fs.writeFileSync(path.join(outDir, 'arkoala_api.h'), makeAPI(apiHeaders, apiHeadersList, structs, typedefs))

                const dummyImplCc =
                    dummyImplementations(dummyImpl) +
                    modifierStructs(modifiers) +
                    modifierStructList(modifierList)
                fs.writeFileSync(path.join(outDir, 'dummy_impl.cc'), dummyImplCc)

                const completeImplCc =
                    completeImplementations(completeImpl) +
                    modifierStructs(modifiers) +
                    modifierStructList(modifierList)
                fs.writeFileSync(path.join(outDir, 'all_modifiers.cc'), completeImplCc)

                copyPeerLib(path.join(__dirname, '..', 'peer_lib'), outDir)
            }
        }
    )
    didJob = true
}

if (!didJob) {
    program.help()
}
