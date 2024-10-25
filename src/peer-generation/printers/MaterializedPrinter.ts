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

import { capitalize, removeExt, renameClassToMaterialized } from "../../util";
import { PeerLibrary } from "../PeerLibrary";
import { printPeerFinalizer, writePeerMethod } from "./PeersPrinter"
import {
    BlockStatement,
    createLanguageWriter,
    FieldModifier,
    LanguageStatement,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from "../LanguageWriters";
import { copyMaterializedMethod, MaterializedClass, MaterializedField, MaterializedMethod } from "../Materialized"
import { makeMaterializedPrologue, tsCopyrightAndWarning } from "../FileGenerators";
import { groupOverloads, OverloadsPrinter } from "./OverloadsPrinter";
import { ImportsCollector } from "../ImportsCollector";
import { PrinterContext } from "./PrinterContext";
import { TargetFile } from "./TargetFile";
import {
    ARK_MATERIALIZEDBASE,
    ARK_MATERIALIZEDBASE_EMPTY_PARAMETER,
    ARKOALA_PACKAGE,
    ARKOALA_PACKAGE_PATH
} from "./lang/Java";
import { createInterfaceDeclName } from "../TypeNodeNameConvertor";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { printJavaImports } from "./lang/JavaPrinters";
import { Language } from "../../Language";
import { copyMethod } from "../LanguageWriters/LanguageWriter";
import { createReferenceType, getIDLTypeName, IDLPointerType, IDLThisType, IDLType, IDLVoidType, maybeOptional, toIDLType } from "../../idl";
import { getReferenceResolver } from "../ReferenceResolver";

interface MaterializedFileVisitor {
    visit(): void
    getTargetFile(): TargetFile
    getOutput(): string[]
}

abstract class MaterializedFileVisitorBase implements MaterializedFileVisitor {
    protected readonly printer: LanguageWriter = createLanguageWriter(this.printerContext.language, getReferenceResolver(this.library))

    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
        protected readonly printerContext: PrinterContext,
        protected readonly clazz: MaterializedClass,
    ) {}

    abstract visit(): void
    abstract getTargetFile(): TargetFile
    convertToPropertyType(field: MaterializedField): IDLType {
        return field.field.type
    }
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

    protected collectImports(imports: ImportsCollector) {
        this.clazz.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
    }

    private printImports() {
        const imports = new ImportsCollector()
        this.collectImports(imports)
        const currentModule = removeExt(renameClassToMaterialized(this.clazz.className, this.library.language))
        imports.print(this.printer, currentModule)
    }

    private printMaterializedClass(clazz: MaterializedClass) {
        this.printImports()
        const printer = this.printer
        printer.print(makeMaterializedPrologue(this.printerContext.language))

        let superClassName = clazz.superClass?.getSyperType()
        let selfInterface = clazz.isInterface ? `${clazz.className}${clazz.generics ? `<${clazz.generics.join(", ")}>` : ``}` : undefined

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

        // TODO: workarond for ContentModifier<T> which returns WrappedBuilder<[T]>
        //       and the WrappedBuilder is defined as "class WrappedBuilder<Args extends Object[]>""
        let generics = clazz.generics
        if (clazz.className === "ContentModifier") {
            generics = ["T extends Object"]
        }

        printer.writeClass(clazz.className, writer => {

            const finalizableType = toIDLType("Finalizable")
            writer.writeFieldDeclaration("peer", finalizableType, undefined, true)

            // getters and setters for fields
            clazz.fields.forEach(field => {

                const mField = field.field

                // TBD: use deserializer to get complex type from native
                const isSimpleType = !field.argConvertor.useArray // type needs to be deserialized from the native
                writer.writeGetterImplementation(new Method(mField.name,
                    new MethodSignature(this.convertToPropertyType(field), [])), writer => {
                    writer.writeStatement(
                        isSimpleType
                            ? writer.makeReturn(writer.makeMethodCall("this", `get${capitalize(mField.name)}`, []))
                            : writer.makeStatement(writer.makeString("throw new Error(\"Not implemented\")"))
                    )
                });

                const isReadOnly = mField.modifiers.includes(FieldModifier.READONLY)
                if (!isReadOnly) {
                    const setSignature = new NamedMethodSignature(IDLVoidType,
                        [this.convertToPropertyType(field)], [mField.name])
                    writer.writeSetterImplementation(new Method(mField.name, setSignature), writer => {
                        let castedNonNullArg
                        if (field.isNullableOriginalTypeField) {
                            castedNonNullArg = `${mField.name}_NonNull`
                            this.printer.writeStatement(writer.makeAssign(castedNonNullArg,
                                undefined,
                                writer.makeCast(writer.makeString(mField.name), mField.type),
                                true))
                        } else {
                            castedNonNullArg = mField.name
                        }
                        writer.writeMethodCall("this", `set${capitalize(mField.name)}`, [castedNonNullArg])
                    });
                }
            })

            const pointerType = IDLPointerType
            // makePrivate(clazz.ctor.method)
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, this.library instanceof IdlPeerLibrary, this.printerContext, this.dumpSerialized, "", "", pointerType)
            this.library.setCurrentContext(undefined)

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const sigWithPointer = new NamedMethodSignature(
                ctorSig.returnType,
                ctorSig.args.map(it => maybeOptional(it, true)),
                ctorSig.argsNames,
                ctorSig.defaults)

            writer.writeConstructorImplementation(clazz.className, sigWithPointer, writer => {

                if (superClassName) {
                    writer.writeSuperCall([]);
                }

                const allOptional = ctorSig.args.every(it => it.optional)
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
                    writer.makeAssign("ctorPtr", IDLPointerType,
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
                writePeerMethod(writer, privateMethod, this.library instanceof IdlPeerLibrary, this.printerContext, this.dumpSerialized, "_serialize", "this.peer!.ptr", returnType)
                this.library.setCurrentContext(undefined)
            })
        }, superClassName, interfaces.length === 0 ? undefined : interfaces, generics)
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

        const imports = [{feature: 'org.koalaui.interop.Finalizable', module: ''}]
        imports.push(...clazz.importFeatures)
        printJavaImports(this.printer, imports)

        const emptyParameterType = toIDLType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const finalizableType = toIDLType('Finalizable')
        const superClassName = clazz.superClass?.getSyperType() ?? ARK_MATERIALIZEDBASE

        this.printer.writeClass(clazz.className, writer => {
            // TODO: getters and setters for fields
            /*clazz.fields.forEach(f => {

                const field = f.field

                // TBD: use deserializer to get complex type from native
                const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
                const getSignature = new MethodSignature(field.type, [])
                writer.writeGetterImplementation(new Method(field.name, getSignature), writer => {
                    if (isSimpleType) {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeMethodCall('this', `get${capitalize(field.name)}`, [])))
                    }
                    else {
                        writer.writeStatement(
                            writer.makeStatement(writer.makeString('throw new Error("Not implemented")'))
                        )
                    }
                });

                const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
                if (!isReadOnly) {
                    const setSignature = new NamedMethodSignature(Type.Void, [field.type], [field.name])
                    writer.writeSetterImplementation(new Method(field.name, setSignature), writer => {
                        writer.writeMethodCall('this', `set${capitalize(field.name)}`, [field.name])
                    });
                }
            })*/

            const pointerType = IDLPointerType
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, true, this.printerContext, this.dumpSerialized, '', '', pointerType)
            this.library.setCurrentContext(undefined)

            // constructor with a special parameter to use in static methods
            const emptySignature = new MethodSignature(IDLVoidType, [emptyParameterType])
            writer.writeConstructorImplementation(clazz.className, emptySignature, writer => {
                writer.writeSuperCall([emptySignature.argName(0)]);
            })

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature

            // generate a constructor with zero parameters for static methods
            // in case there is no alredy defined one
            if (ctorSig.args.length > 0) {
                writer.writeConstructorImplementation(clazz.className, new MethodSignature(IDLVoidType, []), writer => {
                    writer.writeSuperCall([`(${ARK_MATERIALIZEDBASE_EMPTY_PARAMETER})null`]);
                })
            }

            writer.writeConstructorImplementation(clazz.className, ctorSig, writer => {
                writer.writeSuperCall([`(${getIDLTypeName(emptyParameterType)})null`]);

                const args = ctorSig.argsNames.map(it => writer.makeString(it))
                writer.writeStatement(
                    writer.makeAssign('ctorPtr', IDLPointerType,
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
                /// Fix 'this' return type. Refac to LW?
                let returnType = method.method.signature.returnType
                if (returnType === IDLThisType)
                    returnType = toIDLType(method.originalParentName)
                this.library.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
                writePeerMethod(writer, method, true, this.printerContext, this.dumpSerialized, '', 'this.peer.ptr', returnType)
                this.library.setCurrentContext(undefined)
            })
        }, superClassName, undefined, clazz.generics)
    }

    // TODO: remove after migrating to IDL
    private printMaterializedClassTS(clazz: MaterializedClass) {
        this.printPackage()

        const emptyParameterType = toIDLType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const finalizableType = toIDLType('Finalizable')
        this.printerContext.imports!.printImportsForTypes([finalizableType], this.printer)

        const superClassName = clazz.superClass?.getSyperType() ?? ARK_MATERIALIZEDBASE

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
                    const setSignature = new NamedMethodSignature(IDLVoidType, [field.type], [field.name])
                    writer.writeSetterImplementation(new Method(field.name, setSignature), writer => {
                        writer.writeMethodCall('this', `set${capitalize(field.name)}`, [field.name])
                    });
                }
            })

            const pointerType = IDLPointerType
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, false, this.printerContext, this.dumpSerialized, '', '', pointerType)
            this.library.setCurrentContext(undefined)

            // constructor with a special parameter to use in static methods
            const emptySignature = new MethodSignature(IDLVoidType, [emptyParameterType])
            writer.writeConstructorImplementation(clazz.className, emptySignature, writer => {
                writer.writeSuperCall([emptySignature.argName(0)]);
            })

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const signatureWithJavaTypes = new NamedMethodSignature(
                ctorSig.returnType,
                clazz.ctor.declarationTargets.map((declarationTarget, index) => {
                    return this.printerContext.synthesizedTypes!.getTargetType(declarationTarget, !!ctorSig.args[index].optional)
                }),
                ctorSig.argsNames,
                ctorSig.defaults)

            // generate a constructor with zero parameters for static methods
            // in case there is no alredy defined one
            if (signatureWithJavaTypes.args.length > 0) {
                writer.writeConstructorImplementation(clazz.className, new MethodSignature(IDLVoidType, []), writer => {
                    writer.writeSuperCall([`(${ARK_MATERIALIZEDBASE_EMPTY_PARAMETER})null`]);
                })
            }

            writer.writeConstructorImplementation(clazz.className, signatureWithJavaTypes, writer => {
                writer.writeSuperCall([`(${getIDLTypeName(emptyParameterType)})null`]);

                const args = ctorSig.argsNames.map(it => writer.makeString(it))
                writer.writeStatement(
                    writer.makeAssign('ctorPtr', IDLPointerType,
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
                writePeerMethod(writer, method, false, this.printerContext, this.dumpSerialized, '', 'this.peer.ptr', method.method.signature.returnType)
                this.library.setCurrentContext(undefined)
            })
        }, superClassName, undefined, clazz.generics)
    }

    visit(): void {
        if (this.library instanceof PeerLibrary) {
            // TODO: remove after migrating to IDL
            this.printMaterializedClassTS(this.clazz)
            return
        }
        this.printMaterializedClass(this.clazz)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(this.clazz.className + this.printerContext.language.extension, ARKOALA_PACKAGE_PATH)
    }
}

class ArkTSMaterializedFileVisitor extends TSMaterializedFileVisitor {
    protected collectImports(imports: ImportsCollector): void {
        super.collectImports(imports)
        imports.addFeature("TypeChecker", "#components")
    }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }
}

class CJMaterializedFileVisitor extends MaterializedFileVisitorBase {
    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
        protected readonly printerContext: PrinterContext,
        protected readonly clazz: MaterializedClass,
        protected readonly dumpSerialized: boolean,
    ) {
        super(library, printerContext, clazz)
    }

    private printPackage(): void {
        this.printer.print(`package idlize\n`)
    }

    private printMaterializedClass(clazz: MaterializedClass) {
        this.printPackage()

        const emptyParameterType = createReferenceType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const finalizableType = createReferenceType('Finalizable')
        const superClassName = clazz.superClass?.getSyperType() ?? ARK_MATERIALIZEDBASE

        this.printer.writeClass(clazz.className, writer => {
            const pointerType = IDLPointerType
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, true, this.printerContext, this.dumpSerialized, '', '', pointerType)
            this.library.setCurrentContext(undefined)

            // // constructor with a special parameter to use in static methods
            // const emptySignature = new MethodSignature(Type.Void, [emptyParameterType])
            // writer.writeConstructorImplementation(clazz.className, emptySignature, writer => {
            //     writer.writeSuperCall([emptySignature.argName(0)]);
            // })

            // const ctorSig = clazz.ctor.method.signature as NamedMethodSignature

            // // generate a constructor with zero parameters for static methods
            // // in case there is no alredy defined one
            // if (ctorSig.args.length > 0) {
            //     writer.writeConstructorImplementation(clazz.className, new MethodSignature(Type.Void, []), writer => {
            //         writer.writeSuperCall([`(${ARK_MATERIALIZEDBASE_EMPTY_PARAMETER})null`]);
            //     })
            // }

            // writer.writeConstructorImplementation(clazz.className, ctorSig, writer => {
            //     writer.writeSuperCall([`(${emptyParameterType.name})null`]);

            //     const args = ctorSig.argsNames.map(it => writer.makeString(it))
            //     writer.writeStatement(
            //         writer.makeAssign('ctorPtr', Type.Pointer,
            //             writer.makeMethodCall(clazz.className, 'ctor', args),
            //             true))

            //     writer.writeStatement(writer.makeAssign(
            //         'this.peer',
            //         finalizableType,
            //         writer.makeString(`new Finalizable(ctorPtr, ${clazz.className}.getFinalizer())`),
            //         false
            //     ))
            // })

            printPeerFinalizer(clazz, writer)

            // clazz.methods.forEach(method => {
            //     /// Fix 'this' return type. Refac to LW?
            //     let returnType = method.method.signature.returnType
            //     if (returnType === Type.This)
            //         returnType = new Type(method.originalParentName)
            //     this.library.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
            //     writePeerMethod(writer, method, true, this.printerContext, this.dumpSerialized, '', 'this.peer.ptr', returnType)
            //     this.library.setCurrentContext(undefined)
            // })
        }, superClassName, undefined, clazz.generics)
    }

    visit(): void {
        this.printMaterializedClass(this.clazz)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(this.clazz.className + this.printerContext.language.extension, '')
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
            if (Language.TS == this.printerContext.language) {
                visitor = new TSMaterializedFileVisitor(
                    this.library, this.printerContext, clazz, this.dumpSerialized)
            } else if (Language.ARKTS == this.printerContext.language) {
                visitor = new ArkTSMaterializedFileVisitor(
                    this.library, this.printerContext, clazz, this.dumpSerialized)
            } else if (this.printerContext.language == Language.JAVA) {
                visitor = new JavaMaterializedFileVisitor(
                    this.library, this.printerContext, clazz, this.dumpSerialized)
            } else if (this.printerContext.language == Language.CJ) {
                visitor = new CJMaterializedFileVisitor(
                    this.library, this.printerContext, clazz, this.dumpSerialized)
            } else {
                throw new Error(`Unsupported language ${this.printerContext.language} in MaterializedPrinter.ts`)
            }

            visitor.visit()
            this.materialized.set(visitor.getTargetFile(), visitor.getOutput())
            for (let i in this.library.materializedClasses) {
                console.log("hello")
            }
        }
    }
}

export function printMaterialized(peerLibrary: PeerLibrary | IdlPeerLibrary, printerContext: PrinterContext, dumpSerialized: boolean): Map<TargetFile, string> {
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