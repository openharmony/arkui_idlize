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
import * as ts from "typescript"
import * as path from "path"
import { fromIDL, scanIDL } from "./from-idl/common";
import { idlToString } from "./from-idl/DtsPrinter";
import { generate } from "./idlize"
import { IDLEntry, forEachChild, toIDLString } from "./idl"
import { printHeader, toHeaderString, wrapWithPrologueAndEpilogue } from "./idl2h"
import { LinterMessage, LinterVisitor, toLinterString } from "./linter"
import { CompileContext, IDLVisitor } from "./IDLVisitor"
import { TestGeneratorVisitor } from "./TestGeneratorVisitor"
import { nativeModuleDeclaration, PeerGeneratorVisitor } from "./PeerGeneratorVisitor";
import { isDefined, stringOrNone, toSet } from "./util";
import { TypeChecker  } from "./typecheck";

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
    .option('--linter-suppress-locations <suppress>', 'Error locations to suppress, comma separated, no space')
    .option('--verbose', 'Verbose processing')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--skip-docs', 'Emit no docs to idl')
    .option('--common-to-attributes', 'Transform common attributes as IDL attributes')
    .option('--test-interface <name>', 'Interfaces to test (comma separated)')
    .option('--test-method <name>', 'Methods to test (comma separated)')
    .option('--test-property <name>', 'Properties to test (comma separated)')
    .option('--generate-interface <name>', 'Interfaces to generate (comma separated)')
    .option('--disable-enum-initializers', "Don't include enum member initializers in the interface")
    .option('--version')
    .parse()
    .opts()

let defaultCompilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    noLib: true,
    types: []
}

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
        (sourceFile, typeChecker) => new IDLVisitor(sourceFile, typeChecker, tsCompileContext, options.commonToAttributes ?? true),
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
                let [generated, exitCode] = toLinterString(allEntries, options.linterSuppressErrors, options.linterSuppressLocations)
                if (!outFile || options.verbose) console.log(generated)
                if (outFile) fs.writeFileSync(outFile, generated)
                process.exit(exitCode)
            }
        }
    )
    didJob = true
}

if (options.dts2test) {
    generate(
        options.inputDir,
        options.inputFile,
        options.outputDir ?? "./tests",
        (sourceFile, typeChecker) => new TestGeneratorVisitor(sourceFile, typeChecker, options.testInterface, options.testMethod, options.testProperties),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: string[], outputDir, sourceFile) => {
                const outFile = path.join(outputDir,
                    path.basename(sourceFile.fileName).replace(".d.ts", "_test.ets"))
                if (entries.length > 0) {
                    console.log("producing", outFile)
                    let generated = entries.join("\n")
                    if (options.verbose) console.log(generated)
                    fs.writeFileSync(outFile, generated)
                }
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
    generate(
        options.inputDir,
        undefined,
        options.outputDir ?? "./peers",
        (sourceFile, typeChecker) => new PeerGeneratorVisitor(
            sourceFile,
            typeChecker,
            toSet(options.generateInterface),
            nativeMethods
        ),
        {
            compilerOptions: defaultCompilerOptions,
            onSingleFile: (entries: stringOrNone[], outputDir, sourceFile) => {
                const outFile = path.join(outputDir,
                    path.basename(sourceFile.fileName).replace(".d.ts", ".ts"))
                if (entries.length > 0) {
                    console.log("producing", outFile)
                    let generated = entries
                        .filter(element => (element?.length ?? 0) > 0)
                        .join("\n")
                    if (options.verbose) console.log(generated)
                    fs.writeFileSync(outFile, generated)
                }
            },
            onEnd(outDir: string) {
                const nativeModule = nativeModuleDeclaration(nativeMethods)
                fs.writeFileSync(path.join(outDir, 'NativeModule.d.ts'), nativeModule)
            }
        }
    )
    didJob = true
}

if (!didJob) {
    program.help()
}
