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

import * as idl from '@idlize/core/idl'
import { capitalize, removeExt, renameClassToMaterialized, stringOrNone, Language, generifiedTypeName } from '@idlize/core'
import { printPeerFinalizer, writePeerMethod } from "./PeersPrinter"
import {
    createLanguageWriter,
    FieldModifier,
    LanguageStatement,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from "../LanguageWriters";
import { copyMaterializedMethod, getInternalClassName, MaterializedClass, MaterializedField, MaterializedMethod } from "../Materialized"
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
import { PeerLibrary } from "../PeerLibrary";
import { printJavaImports } from "./lang/JavaPrinters";
import { copyMethod } from "../LanguageWriters/LanguageWriter";
import { createReferenceType, forceAsNamedNode, IDLPointerType, IDLThisType, IDLType, IDLVoidType, isOptionalType, maybeOptional } from '@idlize/core/idl'
import { getReferenceResolver } from "../ReferenceResolver";
import { collectDeclItself, collectDeclDependencies, SyntheticModule } from "../ImportsCollectorUtils";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { isMaterialized } from "../idl/IdlPeerGeneratorVisitor";

interface MaterializedFileVisitor {
    visit(): void
    getTargetFile(): TargetFile
    getOutput(): string[]
}

const FinalizableType = idl.maybeOptional(createReferenceType("Finalizable"), true)

abstract class MaterializedFileVisitorBase implements MaterializedFileVisitor {
    protected readonly printer: LanguageWriter = createLanguageWriter(this.printerContext.language, getReferenceResolver(this.library))

    constructor(
        protected readonly library: PeerLibrary,
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

    private overloadsPrinter = new OverloadsPrinter(getReferenceResolver(this.library), this.printer, this.library.language, false)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly printerContext: PrinterContext,
        protected readonly clazz: MaterializedClass,
        protected readonly dumpSerialized: boolean,
    ) {
        super(library, printerContext, clazz)
    }

    protected collectImports(imports: ImportsCollector) {
        const decl = this.library.resolveTypeReference(idl.createReferenceType(this.clazz.className))!
        if (PeerGeneratorConfig.needInterfaces) {
            collectDeclDependencies(this.library, decl, imports, {
                expandTypedefs: true,
                includeTransformedCallbacks: true,
                includeMaterializedInternals: true,
            })
            imports.addFeature(
                createInterfaceDeclName(this.clazz.className),
                SyntheticModule,
            )
        } else {
            collectDeclDependencies(this.library, decl, (it) => {
                if (idl.isInterface(it) && isMaterialized(it, this.library))
                    collectDeclItself(this.library, it, imports)
            })
            if (this.clazz.superClass) {
                let name = this.clazz.superClass.name
                if (this.clazz.isInterface) {
                    name = getInternalClassName(name)
                }
                collectDeclItself(this.library, idl.createReferenceType(name), imports)
            }
        }
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

        if (clazz.isInterface) {
            // generate interface declarations for ArkTS only
            if (Language.ARKTS == this.printerContext.language) {
                writeInterface(clazz.decl, printer);
            }
        }

        let superClassName = generifiedTypeName(clazz.superClass, getSuperName(clazz))

        const interfaces: string[] = ["MaterializedBase"]
        if (clazz.isInterface) {
            interfaces.push(this.clazz.className)
        }

        // TODO: workarond for ContentModifier<T> which returns WrappedBuilder<[T]>
        //       and the WrappedBuilder is defined as "class WrappedBuilder<Args extends Object[]>""
        let classTypeParameters = clazz.generics
        const hasMethodWithTypeParams = clazz.methods.find(it =>
            it.method.signature.args.find(it => idl.isTypeParameterType(it)) !== undefined
        )
        // Need to restrict generic type to the Object type
        if (hasMethodWithTypeParams) {
            classTypeParameters = ["T extends Object"]
        }

        const implementationClassName = clazz.getImplementationName()

        printer.writeClass(implementationClassName, writer => {
            writer.writeFieldDeclaration("peer", FinalizableType, undefined, true)

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

            // write getPeer() method
            const getPeerSig = new MethodSignature(idl.createOptionalType(idl.createReferenceType("Finalizable")),[])
            writer.writeMethodImplementation(new Method("getPeer", getPeerSig), writer => {
                writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
            })

            const pointerType = IDLPointerType
            // makePrivate(clazz.ctor.method)
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, true, this.printerContext, this.dumpSerialized, "", "", pointerType)
            this.library.setCurrentContext(undefined)

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const sigWithPointer = new NamedMethodSignature(
                ctorSig.returnType,
                ctorSig.args.map(it => idl.createOptionalType(it)),
                ctorSig.argsNames,
                ctorSig.defaults)

            writer.writeConstructorImplementation(implementationClassName, sigWithPointer, writer => {

                if (superClassName) {
                    let params:string[] = []
                    // workaround for MutableStyledString which does not have a constructor
                    // the same as in the parent StyledString class
                    if (superClassName === "StyledString") params = [`""`]
                    writer.writeSuperCall(params);
                }

                const allOptional = ctorSig.args.every(it => isOptionalType(it))
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
                let ctorStatements: LanguageStatement = writer.makeBlock([
                    writer.makeAssign("ctorPtr", IDLPointerType,
                        writer.makeMethodCall(implementationClassName, "ctor",
                            ctorSig.args.map((it, index) => writer.makeString(`${ctorSig.argsNames[index]}`))),
                        true),
                    writer.makeAssign(
                        "this.peer",
                        FinalizableType,
                        writer.makeNewObject('Finalizable', [writer.makeString('ctorPtr'), writer.makeString(`${implementationClassName}.getFinalizer()`)]),
                        false
                    )
                ])
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

            // TBD: Refactor tagged methods staff
            const seenTaggedMethods = new Set<string>()
            clazz.taggedMethods
                .map(it => methodFromTagged(it))
                .filter(it => {
                    if (seenTaggedMethods.has(it.name)) return false
                    seenTaggedMethods.add(it.name)
                    return true
                })
                .forEach(method => {
                    // const method = methodFromTagged(taggedMethod)
                    const signature = new NamedMethodSignature(
                        method.returnType,
                        method.parameters.map(it => it.type!),
                        method.parameters.map(it => it.name)
                    )
                    // TBD: Add tagged methods implementation
                    writer.writeMethodImplementation(new Method(getTaggedName(method)!, signature), writer => {
                        writer.writeStatement(
                            writer.makeThrowError("TBD")
                        )
                    })
                })

            clazz.methods.forEach(method => {
                let privateMethod = method
                if (!privateMethod.method.modifiers?.includes(MethodModifier.PRIVATE))
                    privateMethod = copyMaterializedMethod(method, {
                        method: copyMethod(method.method, {
                            modifiers: (method.method.modifiers ?? [])
                                .filter(it => it !== MethodModifier.PUBLIC)
                                .concat([MethodModifier.PRIVATE])
                        })
                    })
                const returnType = privateMethod.tsReturnType()
                this.library.setCurrentContext(`${privateMethod.originalParentName}.${privateMethod.overloadedName}`)
                writePeerMethod(writer, privateMethod, true, this.printerContext, this.dumpSerialized, "_serialize", "this.peer!.ptr", returnType)
                this.library.setCurrentContext(undefined)
            })

            if (clazz.isInterface) {
                writeFromPtrMethod(clazz, writer, classTypeParameters)
            }

        }, superClassName, interfaces.length === 0 ? undefined : interfaces, classTypeParameters)

        if (!clazz.isInterface) {
            // Write internal Materialized class with fromPtr(ptr) method
            printer.writeClass(getInternalClassName(clazz.className), writer => writeFromPtrMethod(clazz, writer, classTypeParameters))
        }
    }

    visit(): void {
        this.printMaterializedClass(this.clazz)
    }

    getTargetFile(): TargetFile {
        return new TargetFile(renameClassToMaterialized(this.clazz.className, this.printerContext.language))
    }
}

function writeFromPtrMethod(clazz: MaterializedClass, writer: LanguageWriter, classTypeParameters?: string[]) {
    // write "fromPtr(ptr: number): MaterializedClass" method
    const className = clazz.getImplementationName()
    const clazzRefType = idl.createReferenceType(className,
        clazz.generics?.map(idl.createTypeParameterReference))
    const fromPtrSig = new NamedMethodSignature(clazzRefType, [idl.IDLPointerType], ["ptr"])
    writer.writeMethodImplementation(new Method("fromPtr", fromPtrSig, [MethodModifier.PUBLIC, MethodModifier.STATIC], classTypeParameters), writer => {
        const objVar = `obj`
        writer.writeStatement(writer.makeAssign(objVar,
            clazzRefType,
            //TODO: Need to pass IDLType instead of string to makeNewObject
            writer.makeNewObject(writer.getNodeName(clazzRefType)),
            true)
        )
        writer.writeStatement(
            writer.makeAssign(`${objVar}.peer`, idl.createReferenceType("Finalizable"),
                writer.makeNewObject('Finalizable', [writer.makeString('ptr'), writer.makeString(`${className}.getFinalizer()`)]), false),
        )
        writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
    })
}

class JavaMaterializedFileVisitor extends MaterializedFileVisitorBase {
    constructor(
        protected readonly library: PeerLibrary,
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
        printJavaImports(this.printer, imports)

        const emptyParameterType = createReferenceType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const finalizableType = FinalizableType
        const superClassName = generifiedTypeName(clazz.superClass) ?? ARK_MATERIALIZEDBASE

        const interfaces:string[] = ["MaterializedBase"]

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

            // write getPeer() method
            const getPeerSig = new MethodSignature(idl.maybeOptional(idl.createReferenceType("Finalizable"), true),[])
            writer.writeMethodImplementation(new Method("getPeer", getPeerSig, [MethodModifier.PUBLIC]), writer => {
                writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
            })

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
                writer.writeSuperCall([`(${forceAsNamedNode(emptyParameterType).name})null`]);

                const args = ctorSig.argsNames.map(it => writer.makeString(it))
                writer.writeStatement(
                    writer.makeAssign('ctorPtr', IDLPointerType,
                        writer.makeMethodCall(clazz.className, 'ctor', args),
                        true))

                writer.writeStatement(writer.makeAssign(
                    'this.peer',
                    finalizableType,
                    writer.makeNewObject('Finalizable', [writer.makeString('ctorPtr'), writer.makeString(`${clazz.className}.getFinalizer()`)]),
                    false
                ))
            })

            printPeerFinalizer(clazz, writer)

            clazz.methods.forEach(method => {
                /// Fix 'this' return type. Refac to LW?
                let returnType = method.method.signature.returnType
                if (returnType === IDLThisType)
                    returnType = createReferenceType(method.originalParentName)
                this.library.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
                writePeerMethod(writer, method, true, this.printerContext, this.dumpSerialized, '', 'this.peer.ptr', returnType)
                this.library.setCurrentContext(undefined)
            })
        }, superClassName, interfaces, clazz.generics)
    }

    visit(): void {
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
    private overloadsPrinter = new OverloadsPrinter(getReferenceResolver(this.library), this.printer, this.library.language, false)

    constructor(
        protected readonly library: PeerLibrary,
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
        const printer = this.printer
        printer.print("import std.collection.*\n")
        
        const interfaces: string[] = []
        if (clazz.isInterface) {
            interfaces.push(this.clazz.className)
        } else {
            interfaces.push('MaterializedBase')
        }

        let superClassName = generifiedTypeName(clazz.superClass)

        // TODO: workarond for ContentModifier<T> which returns WrappedBuilder<[T]>
        //       and the WrappedBuilder is defined as "class WrappedBuilder<Args extends Object[]>""
        let classTypeParameters = clazz.generics
        const hasMethodWithTypeParams = clazz.methods.find(it =>
            it.method.signature.args.find(it => idl.isTypeParameterType(it)) !== undefined
        )

        const implementationClassName = clazz.getImplementationName()

        printer.writeClass(implementationClassName, writer => {
            // getters and setters for fields
            clazz.fields.forEach(field => {

                const mField = field.field

                // TBD: use deserializer to get complex type from native
                const isSimpleType = !field.argConvertor.useArray // type needs to be deserialized from the native
                writer.writeGetterImplementation(new Method(mField.name,
                    new MethodSignature(this.convertToPropertyType(field), [])), writer => {
                    writer.writeStatement(
                        isSimpleType
                            ? writer.makeReturn(writer.makeString(`this.get${capitalize(mField.name)}()`))
                            : writer.makeStatement(writer.makeString("throw Exception(\"Not implemented\")"))
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
                        writer.makeString(`this.set${capitalize(mField.name)}(${castedNonNullArg})`)
                    });
                }
            })

            // remove later?
            const clazzRefType = idl.createReferenceType(clazz.className,
                clazz.generics?.map(idl.createTypeParameterReference))
            const constructSig = new NamedMethodSignature(clazzRefType, [idl.IDLPointerType], ["ptr"])
            writer.writeMethodImplementation(new Method("construct", constructSig, [MethodModifier.STATIC], classTypeParameters), writer => {
                const objVar = `obj${clazz.className}`
                writer.writeStatement(writer.makeAssign(objVar,
                    clazzRefType,
                    writer.makeString(writer.getNodeName(clazzRefType).concat('()')),
                    true)
                )
                // writer.writeStatement(
                //     writer.makeAssign(`${objVar}.peer`, FinalizableType,
                //         writer.makeString(`Finalizable(ptr, ${clazz.className}.getFinalizer())`), false),
                // )
                writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
            })
        
            const pointerType = IDLPointerType
            // makePrivate(clazz.ctor.method)
            this.library.setCurrentContext(`${clazz.className}.constructor`)
            writePeerMethod(writer, clazz.ctor, true, this.printerContext, this.dumpSerialized, "", "", pointerType)
            this.library.setCurrentContext(undefined)

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const sigWithPointer = new NamedMethodSignature(
                ctorSig.returnType,
                ctorSig.args.map(it => idl.createOptionalType(it)),
                ctorSig.argsNames,
                ctorSig.defaults)

            // need to print constructor

            printPeerFinalizer(clazz, writer)

            for (const grouped of groupOverloads(clazz.methods)) {
                this.overloadsPrinter.printGroupedComponentOverloads(clazz, grouped)
            }

            // TBD: Refactor tagged methods staff
            const seenTaggedMethods = new Set<string>()
            clazz.taggedMethods
                .map(it => methodFromTagged(it))
                .filter(it => {
                    if (seenTaggedMethods.has(it.name)) return false
                    seenTaggedMethods.add(it.name)
                    return true
                })
                .forEach(method => {
                    // const method = methodFromTagged(taggedMethod)
                    const signature = new NamedMethodSignature(
                        method.returnType,
                        method.parameters.map(it => it.type!),
                        method.parameters.map(it => it.name)
                    )
                    // TBD: Add tagged methods implementation
                    writer.writeMethodImplementation(new Method(getTaggedName(method)!, signature), writer => {
                        writer.writeStatement(
                            writer.makeThrowError("TBD")
                        )
                    })
                })

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
                writePeerMethod(writer, privateMethod, true, this.printerContext, this.dumpSerialized, "_serialize", "if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception(\"\")}", returnType)
                this.library.setCurrentContext(undefined)
            })

            if (clazz.isInterface) {
                writeFromPtrMethod(clazz, writer, classTypeParameters)
            }

        }, superClassName, interfaces.length === 0 ? undefined : interfaces, classTypeParameters)

    
        if (!clazz.isInterface) {
            // Write internal Materialized class with fromPtr(ptr) method
            printer.writeClass(getInternalClassName(clazz.className), writer => writeFromPtrMethod(clazz, writer, classTypeParameters))
        } else {
            // fill interface fields
            printer.writeClass(clazz.className, writer => {}, 'MaterializedBase')
        }
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
        private readonly library: PeerLibrary,
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
        }
    }
}

export function printMaterialized(peerLibrary: PeerLibrary, printerContext: PrinterContext, dumpSerialized: boolean): Map<TargetFile, string> {
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

function getSuperName(clazz: MaterializedClass): string | undefined {
    const superClass = clazz.superClass
    if (!superClass) return undefined
    return clazz.isInterface ? getInternalClassName(superClass.name) : superClass.name
}

function writeInterface(decl: idl.IDLInterface, writer: LanguageWriter) {
    writer.writeInterface(decl.name, writer => {
        for (const m of decl.methods) {
            writer.writeMethodDeclaration(m.name,
                new NamedMethodSignature(
                    m.returnType,
                    m.parameters.map(it => it.type!),
                    m.parameters.map(it => it.name)));
        }
    })
}

// TBD: Refactor tagged method staff
function getTaggedName(node: idl.IDLEntry): stringOrNone {
    return idl.getExtAttribute(node, idl.IDLExtendedAttributes.DtsName) ?? node.name
}

function paramFromTagged(paramOrTag: idl.IDLParameter | idl.SignatureTag): idl.IDLParameter {
    const param = paramOrTag as idl.IDLParameter
    if (param.kind === idl.IDLKind.Parameter) return param
    const tag = paramOrTag as idl.SignatureTag
    return idl.createParameter(tag.name, idl.IDLStringType)
}

function paramsFromTagged(node: idl.IDLSignature): idl.IDLParameter[] {
    let mix: (idl.IDLParameter | idl.SignatureTag)[] = node.parameters.slice(0)
    for (const tag of idl.fetchSignatureTags(node))
        mix.splice(tag.index, 0, tag)

    return mix.map(it => paramFromTagged(it))
}

function methodFromTagged(method: idl.IDLMethod): idl.IDLMethod {
    return idl.createMethod(
        getTaggedName(method)!,
        paramsFromTagged(method),
        method.returnType,
        {
            isStatic: false,
            isOptional: false,
            isAsync: false,
        }, {}
    )
}