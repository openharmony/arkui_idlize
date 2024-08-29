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

import { Language, renameClassToMaterialized, capitalize, removeExt } from "../../util";
import { PeerLibrary } from "../PeerLibrary";
import { writePeerMethod } from "./PeersPrinter"
import {
    LanguageWriter,
    MethodModifier,
    NamedMethodSignature,
    Method,
    Type,
    createLanguageWriter,
    FieldModifier,
    MethodSignature,
    copyMethod,
    BlockStatement, LanguageStatement
} from "../LanguageWriters";
import { copyMaterializedMethod, MaterializedClass } from "../Materialized"
import { makeMaterializedPrologue, tsCopyrightAndWarning } from "../FileGenerators";
import { OverloadsPrinter, groupOverloads, collapseSameNamedMethods } from "./OverloadsPrinter";

import { printPeerFinalizer } from "./PeersPrinter"
import { ImportsCollector } from "../ImportsCollector";
import { PrinterContext } from "./PrinterContext";
import { TargetFile } from "./TargetFile";
import { ARK_MATERIALIZEDBASE, ARK_MATERIALIZEDBASE_EMPTY_PARAMETER, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { createInterfaceDeclName } from "../PeerGeneratorVisitor";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";

interface MaterializedFileVisitor {
    visit(): void
    getTargetFile(): TargetFile
    getOutput(): string[]
}

abstract class MaterializedFileVisitorBase implements MaterializedFileVisitor {
    protected readonly printer: LanguageWriter = createLanguageWriter(this.printerContext.language)

    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
        protected readonly printerContext: PrinterContext,
        protected readonly clazz: MaterializedClass,
    ) {}

    abstract visit(): void
    abstract getTargetFile(): TargetFile

    getOutput(): string[] {
        return this.printer.getOutput()
    }
}

class TSMaterializedFileVisitor extends MaterializedFileVisitorBase {

    private overloadsPrinter = new OverloadsPrinter(this.printer, this.library.language, false)

    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
        protected readonly printerContext: PrinterContext,
        protected readonly clazz: MaterializedClass,
        protected readonly dumpSerialized: boolean,
    ) {
        super(library, printerContext, clazz)
    }

    private printImports() {
        const imports = new ImportsCollector()
        this.clazz.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        const currentModule = removeExt(renameClassToMaterialized(this.clazz.className, this.library.language))
        imports.print(this.printer, currentModule)
    }

    private printMaterializedClass(clazz: MaterializedClass) {
        this.printImports()
        const printer = this.printer
        printer.print(makeMaterializedPrologue(this.printerContext.language))

        const superClass = clazz.superClass
        let superClassName = superClass ? `${superClass.name}${superClass.generics ? `<${superClass.generics.join(", ")}>` : ""}` : undefined
        let selfInterface = clazz.isInterface ? `${clazz.className}${clazz.generics ? `<${clazz.generics.join(", ")}>` : `` }` : undefined

        const interfaces: string[] = []
        if (clazz.isInterface) {
            // self-interface is not supported ArkTS
            if (this.library.language == Language.ARKTS) {
                selfInterface = createInterfaceDeclName(selfInterface!)
            }
            if (selfInterface) interfaces.push(selfInterface)
            if (superClassName && !this.library.materializedClasses.has(superClassName)) {
                interfaces.push(superClassName)
                superClassName = undefined
            }
        }

        printer.writeClass(clazz.className, writer => {

            const finalizableType = new Type("Finalizable")
            writer.writeFieldDeclaration("peer", finalizableType, undefined, true)

            // getters and setters for fields
            clazz.fields.forEach(f => {

                const field = f.field

                // TBD: use deserializer to get complex type from native
                const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
                if (isSimpleType) {
                    const getSignature = new MethodSignature(field.type, [])
                    writer.writeGetterImplementation(new Method(field.name, getSignature), writer => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeMethodCall("this", `get${capitalize(field.name)}`, [])))
                    });
                }

                const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
                if (!isReadOnly) {
                    const setSignature = new NamedMethodSignature(Type.Void, [field.type], [field.name])
                    writer.writeSetterImplementation(new Method(field.name, setSignature), writer => {
                        writer.writeMethodCall("this", `set${capitalize(field.name)}`, [field.name])
                    });
                }
            })

            const pointerType = Type.Pointer
            // makePrivate(clazz.ctor.method)
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, this.printerContext, this.dumpSerialized, "", "", pointerType)
            this.library.setCurrentContext(undefined)

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const sigWithPointer = new NamedMethodSignature(
                ctorSig.returnType,
                ctorSig.args.map(it => new Type(it.name, true)),
                ctorSig.argsNames,
                ctorSig.defaults)

            writer.writeConstructorImplementation(clazz.className, sigWithPointer, writer => {

                if (superClassName) {
                    writer.writeSuperCall([]);
                }

                const allOptional = ctorSig.args.every(it => it.nullable)
                const hasStaticMethods = clazz.methods.some(it => it.method.modifiers?.includes(MethodModifier.STATIC))
                if (hasStaticMethods && allOptional) {
                    if (ctorSig.args.length == 0) {
                        writer.print(`// Constructor does not have parameters.`)
                    } else {
                        writer.print(`// All constructor parameters are optional.`)
                    }
                    writer.print(`// It means that the static method call invokes ctor method as well`)
                    writer.print(`// when all arguments are undefined.`)
                }
                let ctorStatements: LanguageStatement = new BlockStatement([
                    writer.makeAssign("ctorPtr", Type.Pointer,
                        writer.makeMethodCall(clazz.className, "ctor",
                            ctorSig.args.map((it, index) => writer.makeString(`${ctorSig.argsNames[index]}`))),
                        true),
                    writer.makeAssign(
                        "this.peer",
                        finalizableType,
                        writer.makeString(`new Finalizable(ctorPtr, ${clazz.className}.getFinalizer())`),
                        false
                    )
                ], false)
                if (!allOptional) {
                    ctorStatements =
                        writer.makeCondition(
                            ctorSig.args.length === 0 ? writer.makeString("true") :
                                writer.makeNaryOp('&&', ctorSig.argsNames.map(it =>
                                    writer.makeNaryOp('!==', [writer.makeString(it), writer.makeUndefined()]))
                                ),
                            ctorStatements
                        )
                }
                writer.writeStatement(ctorStatements)
            })

            printPeerFinalizer(clazz, writer)

            for (const grouped of groupOverloads(clazz.methods)) {
                this.overloadsPrinter.printGroupedComponentOverloads(clazz, grouped)
            }

            clazz.methods.forEach(method => {
                let privateMethod = method
                if (!privateMethod.method.modifiers?.includes(MethodModifier.PRIVATE))
                    privateMethod = copyMaterializedMethod(method, {
                        method: copyMethod(method.method, {
                            modifiers: (method.method.modifiers ?? []).concat([MethodModifier.PRIVATE])
                        })
                    })
                const returnType = privateMethod.tsReturnType()
                this.library.setCurrentContext(`${privateMethod.originalParentName}.${privateMethod.overloadedName}`)
                writePeerMethod(writer, privateMethod, this.printerContext, this.dumpSerialized, "_serialize", "this.peer!.ptr", returnType)
                this.library.setCurrentContext(undefined)
            })
        }, superClassName, interfaces.length === 0 ? undefined : interfaces, clazz.generics)
    }

    visit(): void {
        this.printMaterializedClass(this.clazz)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(renameClassToMaterialized(this.clazz.className, this.printerContext.language))
    }
}

class JavaMaterializedFileVisitor extends MaterializedFileVisitorBase {
    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
        protected readonly printerContext: PrinterContext,
        protected readonly clazz: MaterializedClass,
        protected readonly dumpSerialized: boolean,
    ) {
        super(library, printerContext, clazz)
    }

    private printPackage(): void {
        this.printer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    private printMaterializedClass(clazz: MaterializedClass) {
        this.printPackage()

        const emptyParameterType = new Type(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const finalizableType = new Type('Finalizable')
        this.printerContext.imports!.printImportsForTypes([finalizableType], this.printer)

        const superClass = clazz.superClass
        const superClassName = superClass ? `${superClass.name}${superClass.generics ? `<${superClass.generics.join(', ')}>` : ''}` : ARK_MATERIALIZEDBASE

        this.printer.writeClass(clazz.className, writer => {
            // getters and setters for fields
            clazz.fields.forEach(f => {

                const field = f.field

                // TBD: use deserializer to get complex type from native
                const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
                if (isSimpleType) {
                    const getSignature = new MethodSignature(field.type, [])
                    writer.writeGetterImplementation(new Method(field.name, getSignature), writer => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeMethodCall('this', `get${capitalize(field.name)}`, [])))
                    });
                }

                const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
                if (!isReadOnly) {
                    const setSignature = new NamedMethodSignature(Type.Void, [field.type], [field.name])
                    writer.writeSetterImplementation(new Method(field.name, setSignature), writer => {
                        writer.writeMethodCall('this', `set${capitalize(field.name)}`, [field.name])
                    });
                }
            })

            const pointerType = Type.Pointer
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, this.printerContext, this.dumpSerialized, '', '', pointerType)
            this.library.setCurrentContext(undefined)

            // constructor with a special parameter to use in static methods
            const emptySignature = new MethodSignature(Type.Void, [emptyParameterType])
            writer.writeConstructorImplementation(clazz.className, emptySignature, writer => {
                writer.writeSuperCall([emptySignature.argName(0)]);
            })

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const signatureWithJavaTypes = new NamedMethodSignature(
                ctorSig.returnType,
                clazz.ctor.declarationTargets.map((declarationTarget, index) => {
                    return this.printerContext.synthesizedTypes!.getTargetType(declarationTarget, ctorSig.args[index].nullable)
                }),
                ctorSig.argsNames,
                ctorSig.defaults)
            writer.writeConstructorImplementation(clazz.className, signatureWithJavaTypes, writer => {
                writer.writeSuperCall([`(${emptyParameterType.name})null`]);

                const args = ctorSig.argsNames.map(it => writer.makeString(it))
                writer.writeStatement(
                    writer.makeAssign('ctorPtr', Type.Pointer,
                        writer.makeMethodCall(clazz.className, 'ctor', args),
                        true))

                writer.writeStatement(writer.makeAssign(
                    'this.peer',
                    finalizableType,
                    writer.makeString(`new Finalizable(ctorPtr, ${clazz.className}.getFinalizer())`),
                    false
                ))
            })

            printPeerFinalizer(clazz, writer)

            clazz.methods.forEach(method => {
                this.library.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
                writePeerMethod(writer, method, this.printerContext, this.dumpSerialized, '', 'this.peer.ptr', method.method.signature.returnType)
                this.library.setCurrentContext(undefined)
            })
        }, superClassName, undefined, clazz.generics)
    }

    visit(): void {
        this.printMaterializedClass(this.clazz)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(this.clazz.className + this.printerContext.language.extension, ARKOALA_PACKAGE_PATH)
    }
}

class MaterializedVisitor {
    readonly materialized: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary | IdlPeerLibrary,
        private readonly printerContext: PrinterContext,
        private readonly dumpSerialized: boolean,
    ) {}

    printMaterialized(): void {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        for (const clazz of this.library.materializedToGenerate) {
            let visitor: MaterializedFileVisitor
            if ([Language.ARKTS, Language.TS].includes(this.printerContext.language)) {
                visitor = new TSMaterializedFileVisitor(
                    this.library, this.printerContext, clazz, this.dumpSerialized)
            }
            else if (this.printerContext.language == Language.JAVA) {
                visitor = new JavaMaterializedFileVisitor(
                    this.library, this.printerContext, clazz, this.dumpSerialized)
            }
            else {
                throw new Error(`Unsupported language ${this.printerContext.language} in MaterializedPrinter.ts`)
            }

            visitor.visit()
            this.materialized.set(visitor.getTargetFile(), visitor.getOutput())
        }
    }
}

export function printMaterialized(peerLibrary: PeerLibrary | IdlPeerLibrary, printerContext: PrinterContext, dumpSerialized: boolean): Map<TargetFile, string> {

    // TODO: support other output languages
    if (![Language.ARKTS, Language.TS, Language.JAVA].includes(printerContext.language))
        return new Map()

    const visitor = new MaterializedVisitor(peerLibrary, printerContext, dumpSerialized)
    visitor.printMaterialized()
    const result = new Map<TargetFile, string>()
    for (const [file, content] of visitor.materialized) {
        if (content.length === 0) continue
        const text = tsCopyrightAndWarning(content.join('\n'))
        result.set(file, text)
    }
    return result
}