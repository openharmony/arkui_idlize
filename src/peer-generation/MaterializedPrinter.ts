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

import { IndentedPrinter } from "../IndentedPrinter";
import { Language, renameClassToMaterialized, capitalize } from "../util";
import { PeerLibrary } from "./PeerLibrary";
import { writePeerMethod } from "./PeersPrinter"
import { LanguageWriter, MethodModifier, NamedMethodSignature, Method, Type, createLanguageWriter, FieldModifier, MethodSignature } from "./LanguageWriters";
import { MaterializedClass, MaterializedMethod } from "./Materialized"
import { makeMaterializedPrologue } from "./FileGenerators";
import { OverloadsPrinter, collapseSameNamedMethods, groupOverloads } from "./OverloadsPrinter";

import { printPeerFinalizer } from "./PeersPrinter"
import { ImportsCollector } from "./ImportsCollector";

class MaterializedFileVisitor {

    readonly printer: LanguageWriter = createLanguageWriter(this.language)
    private overloadsPrinter = new OverloadsPrinter(this.printer, this.library, false)

    constructor(
        private readonly language: Language,
        private readonly library: PeerLibrary,
        private readonly clazz: MaterializedClass,
        private readonly dumpSerialized: boolean,
    ) {}

    private printImports() {
        const imports = new ImportsCollector()
        imports.addFilterByBasename(renameClassToMaterialized(this.clazz.className, this.library.declarationTable.language))
        this.clazz.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(this.printer)
    }

    private printMaterializedClass(clazz: MaterializedClass) {
        this.printImports()
        const printer = this.printer
        printer.print(makeMaterializedPrologue(this.language))

        printer.writeClass(clazz.className, writer => {

            const finalizableType = new Type("Finalizable")
            writer.writeFieldDeclaration("peer", finalizableType, undefined, true)

            let fieldAccessors: MaterializedMethod[] = []

            // getters and setters for fields
            clazz.fields.forEach(f => {
                const field = f.field
                const isReadOnly = field.mofidifiers.includes(FieldModifier.READONLY)
                const getSignature = new MethodSignature(field.type, [])
                const setSignature = new NamedMethodSignature(Type.Void, [field.type], [field.name])
                writer.writeGetterImplementation(new Method(field.name, getSignature), writer => {
                    writer.writeStatement(
                        writer.makeReturn(
                            writer.makeMethodCall("this", `get${capitalize(field.name)}`,[])))
                });

                const getAccessor = new MaterializedMethod(clazz.className, [], [], f.retConvertor, false,
                    new Method(`get${capitalize(field.name)}`, new NamedMethodSignature(field.type, [], []))
                )

                fieldAccessors = fieldAccessors.concat(getAccessor)

                if (!isReadOnly) {
                    writer.writeSetterImplementation(new Method(field.name, setSignature), writer => {
                        writer.writeMethodCall("this", `set${capitalize(field.name)}`, [field.name])
                    });

                    const retConvertor = { isVoid: true, nativeType: () => Type.Void.name, macroSuffixPart: () => "V" }
                    const setAccessor = new MaterializedMethod(clazz.className, [f.declarationTarget], [f.argConvertor], retConvertor, false,
                        new Method(`set${capitalize(field.name)}`, setSignature)
                    )
                    fieldAccessors = fieldAccessors.concat(setAccessor)
                }
            })

            clazz.methods = fieldAccessors.concat(clazz.methods)

            const pointerType = Type.Pointer
            makePrivate(clazz.ctor.method)
            writePeerMethod(writer, clazz.ctor, this.dumpSerialized, "", "", pointerType)

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const sigWithPointer = new NamedMethodSignature(
                ctorSig.returnType,
                ctorSig.args.map(it => new Type(it.name, true)),
                ctorSig.argsNames,
                ctorSig.defaults)

            writer.writeConstructorImplementation(clazz.className, sigWithPointer, writer => {

                const allOptional = ctorSig.args.every(it => it.nullable)
                const hasStaticMethods = clazz.methods.some(it => it.method.modifiers?.includes(MethodModifier.STATIC))
                const allUndefined = ctorSig.argsNames.map(it => `${it} === undefined`).join(` && `)

                if (hasStaticMethods) {
                    if (allOptional) {
                        if (ctorSig.args.length == 0) {
                            writer.print(`// Constructor does not have parameters.`)
                        } else {
                            writer.print(`// All constructor parameters are optional.`)
                        }
                        writer.print(`// It means that the static method call invokes ctor method as well`)
                        writer.print(`// when all arguments are undefined.`)
                    } else {
                        writer.writeStatement(
                            writer.makeCondition(
                                writer.makeString(ctorSig.args.length === 0 ? "true" : allUndefined),
                                writer.makeReturn()
                            )
                        )
                    }
                }

                const args = ctorSig.args.map((it, index) => writer.makeString(`${ctorSig.argsNames[index]}${it.nullable ? "" : "!"}`))
                writer.writeStatement(
                    writer.makeAssign("ctorPtr", Type.Pointer,
                        writer.makeMethodCall(clazz.className, "ctor", args),
                        true))

                writer.writeStatement(writer.makeAssign(
                    "this.peer",
                    finalizableType,
                    writer.makeString(`new Finalizable(ctorPtr, ${clazz.className}.getFinalizer())`),
                    false
                ))
            })

            printPeerFinalizer(clazz, writer)

            for (const grouped of groupOverloads(clazz.methods)) {
                this.overloadsPrinter.printGroupedComponentOverloads(clazz, grouped)
            }

            clazz.methods.forEach(method => {
                makePrivate(method.method)
                const returnType = method.tsReturnType()
                writePeerMethod(writer, method, this.dumpSerialized, "_serialize", "this.peer!.ptr", returnType)
            })
        })
    }

    printFile(): void {
        this.printMaterializedClass(this.clazz)
    }

    private getReturnValue(className: string, retType: string| undefined): string| undefined {
        if (retType === undefined || retType === "void") {
            return ""
        } else if(retType === className) {
            return (`this`)
        } else if (retType === "boolean") {
            return `true`
        } else {
            return undefined
        }
    }
}

class MaterializedVisitor {
    readonly materialized: Map<string, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) {}

    printMaterialized(): void {
        for (const clazz of this.library.materializedClasses.values()) {
            const visitor = new MaterializedFileVisitor(
                this.library.declarationTable.language, this.library, clazz, this.dumpSerialized)
            visitor.printFile()
            const fileName = renameClassToMaterialized(clazz.className, this.library.declarationTable.language)
            this.materialized.set(fileName, visitor.printer.getOutput())
        }
    }
}

export function printMaterialized(peerLibrary: PeerLibrary, dumpSerialized: boolean): Map<string, string> {

    // TODO: support other output languages
    if (peerLibrary.declarationTable.language != Language.TS)
        return new Map()

    const visitor = new MaterializedVisitor(peerLibrary, dumpSerialized)
    visitor.printMaterialized()
    const result = new Map<string, string>()
    for (const [key, content] of visitor.materialized) {
        if (content.length === 0) continue
        result.set(key, content.join('\n'))
    }
    return result
}

function makePrivate(method: Method) {
    method.modifiers?.unshift(MethodModifier.PRIVATE)
}