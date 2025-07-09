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

import * as idl from '@idlizer/core/idl'
import { capitalize, stringOrNone, Language, generifiedTypeName, sanitizeGenerics, ArgumentModifier, generatorConfiguration, getSuper, ReferenceResolver, MaterializedMethod, DelegationType, LanguageExpression, DelegationCall, qualifiedName, PeerMethodSignature, removePoints, maybeRestoreGenerics } from '@idlizer/core'
import { writePeerMethod } from "./PeersPrinter"
import {
    FieldModifier,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from "../LanguageWriters";
import {
    LanguageWriter, getInternalClassName,
    MaterializedClass, MaterializedField, PeerLibrary, LayoutNodeRole
} from "@idlizer/core"
import { collapseSameNamedMethods, groupOverloads, OverloadsPrinter } from "./OverloadsPrinter";
import { ImportsCollector } from "../ImportsCollector"
import { TargetFile } from "./TargetFile"
import {
    ARK_MATERIALIZEDBASE,
    ARK_MATERIALIZEDBASE_EMPTY_PARAMETER,
    ARK_OBJECTBASE,
} from "./lang/Java";
import { printJavaImports } from "./lang/JavaPrinters";
import { createReferenceType, forceAsNamedNode, IDLPointerType, IDLType, IDLVoidType, maybeOptional } from '@idlizer/core/idl'
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { NativeModule } from '../NativeModule';
import { PrinterClass, PrinterResult } from '../LayoutManager';
import { injectPatch } from '../common';

interface MaterializedFileVisitor {
    visit(): PrinterResult
}

const FinalizableType = idl.maybeOptional(createReferenceType("Finalizable"), true)

abstract class MaterializedFileVisitorBase implements MaterializedFileVisitor {

    protected readonly collector = new ImportsCollector()
    protected readonly printer = this.library.createLanguageWriter()
    protected readonly internalPrinter = this.library.createLanguageWriter(this.library.language)
    protected overloadsPrinter = new OverloadsPrinter(this.library, this.printer, this.library.language, false, this.library.useMemoM3)

    private extraAssignCallbacks: { callback: string, method: string }[] = []
    private maxCtorParams: number = 0

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly clazz: MaterializedClass,
        protected readonly dumpSerialized: boolean
    ) {
        this.maxCtorParams = (clazz.ctors.length == 0) ? 0 : Math.max(...clazz.ctors.map(ctor => ctor.method.signature.args.length))
    }

    abstract visit(): PrinterResult
    abstract printImports(): void

    convertToPropertyType(field: MaterializedField): IDLType {
        return idl.maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    private collectExtraCallbacks(clazz: MaterializedClass) {
        clazz.fields.forEach(field => {
            if (field.extraMethodName) {
                this.extraAssignCallbacks.push({
                    callback: field.field.name,
                    method: field.extraMethodName
                })
            }
        })
    }

    getImplementationName(clazz: MaterializedClass): string {
        return clazz.isInterface ? clazz.getImplementationName() : this.mangle(clazz.getImplementationName())
    }

    assignFinalizable(className: string, peerPtr: string, writer: LanguageWriter) {
        writer.writeStatement(
            writer.makeAssign(
                "this.peer",
                FinalizableType,
                writer.makeNewObject(
                    'Finalizable',
                    [writer.makeString(peerPtr), writer.makeString(`${className}.getFinalizer()`)]),
                false
            )
        )
    }

    // print non-static readonly fields initialization
    printReadonlyFieldsInitialization(clazz: MaterializedClass) {
        const writer = this.printer
        const receiver = writer.makeThis()
        for (const mField of clazz.fields) {
            const f = mField.field
            const isReadonly = f.modifiers.includes(FieldModifier.READONLY)
            const isStatic = f.modifiers.includes(FieldModifier.STATIC)
            if (isReadonly && !isStatic) {
                const initializer = this.printer.makeMethodCall(receiver.asString(), `get${capitalize(f.name)}`, [])
                writer.writeStatement(
                    writer.makeAssign(f.name, f.type, initializer, false, false, { receiver: receiver.asString() })
                )
            }
        }
    }

    printBaseCtor(clazz: MaterializedClass, collapseCtors: boolean, superClassName?: string) {
        const hasSuperClass = (superClassName != undefined)
        if (clazz.isStaticMaterialized) return
        const className = this.getImplementationName(clazz)
        if (collapseCtors) {
            this.printCollapsedCtors(clazz, superClassName)
            return
        }
        const peerPtr = "peerPtr"
        const peerPtrExpr = this.printer.makeString(peerPtr)
        const params = [...Array(this.maxCtorParams).fill(0).map((_, i) => `_${i}`), peerPtr]
        const types = [...Array(this.maxCtorParams).fill(idl.IDLBooleanType), idl.IDLPointerType]
        const sig = new NamedMethodSignature(idl.IDLVoidType, types, params)
        this.printer.writeConstructorImplementation(className, sig, writer => {
            if (!hasSuperClass) {
                this.assignFinalizable(className, peerPtr, writer)
            }
            this.printReadonlyFieldsInitialization(clazz)
        }, this.getSuperDelegationCall(this.printer, clazz, peerPtrExpr, collapseCtors, superClassName))
    }

    printCollapsedCtors(clazz: MaterializedClass, superClassName?: string) {
        const ctorPostfix = `_${clazz.className.toLowerCase()}`
        const ctors = clazz.ctors.map(ctor => ctor.withReturnType(idl.IDLPointerType))
        const collapsedCtor = collapseSameNamedMethods(ctors.map(it => it.method), undefined, undefined)
        this.printCollapsedCtor(clazz, collapsedCtor, ctorPostfix, superClassName)
        this.overloadsPrinter.setPostfix(ctorPostfix)
        this.overloadsPrinter.printGroupedComponentOverloads(clazz.getImplementationName(), ctors)
        this.overloadsPrinter.setPostfix()
        for (const ctor of clazz.ctors) {
            this.printMethod(ctor, `${ctorPostfix}_serialize`, idl.IDLPointerType)
        }
    }

    getSuperDelegationCall(
        writer: LanguageWriter,
        clazz: MaterializedClass,
        peerPtrExpr: LanguageExpression,
        collapseCtors: boolean,
        superClassName?: string): DelegationCall | undefined {

        if (superClassName == undefined) return undefined

        const superDecl = this.library.resolveTypeReference(clazz.superClass!)
        if (!superDecl || !idl.isInterface(superDecl))
            throw new Error(`Super declaration is not found for materialized class: ${clazz.className}`)

        const dimensions = [...superDecl.constructors.map(it => it.parameters.length)]
        const argsCount = dimensions.length == 0 ? 0 : Math.max(...dimensions)
        const args = [
            ...Array(argsCount)
                .fill(collapseCtors ? "undefined" : "false")
                .map(it => writer.makeString(it)),
            peerPtrExpr
        ]
        return { delegationArgs: args, delegationName: superClassName }
    }

    printCollapsedCtor(clazz: MaterializedClass, ctor: Method, ctorPostfix: string, superClassName?: string) {
        const hasSuperClass = (superClassName != undefined)
        const peerPtr = "peerPtr"
        const ctorSig = ctor.signature as NamedMethodSignature
        const sigWithPointer = new NamedMethodSignature(
            ctorSig.returnType,
            [...ctorSig.args, idl.IDLPointerType],
            [...ctorSig.argsNames, peerPtr],
            ctorSig.defaults,
            [...Array(ctorSig.args.length + 1)].map(_ => ArgumentModifier.OPTIONAL))

        const writer = this.printer
        const ctorArgs = ctorSig.args
            .map((_, i) => writer.makeString(ctorSig.argName(i)))
            .map((expr, i) => idl.isOptionalType(ctorSig.args[i]) ? expr : writer.makeUnwrapOptional(expr))

        const implementationClassName = clazz.getImplementationName()
        // Used in typescript only
        // add makeIsDefined(...) method to LanguageWriter
        const peerPtrExpr = writer.makeTernary(
            writer.makeString(`${peerPtr} != undefined`),
            writer.makeString(peerPtr),
            writer.makeMethodCall(implementationClassName, `${ctor.name}${ctorPostfix}`, ctorArgs)
        )
        const delegationCall = this.getSuperDelegationCall(writer, clazz, peerPtrExpr, true, superClassName)

        this.printer.writeConstructorImplementation(this.namespacePrefix.concat(implementationClassName), sigWithPointer, writer => {

            if (hasSuperClass) return

            writer.writeStatement(
                writer.makeAssign(peerPtr, idl.IDLPointerType, peerPtrExpr, false))
            this.assignFinalizable(this.mangle(implementationClassName), peerPtr, writer)
        }, delegationCall)
    }

    printCtor(clazz: MaterializedClass, ctor: MaterializedMethod) {

        const config = peerGeneratorConfiguration()

        const implementationClassName = this.getImplementationName(clazz)

        const ctorSig = ctor.method.signature as NamedMethodSignature
        const nsPath = idl.getNamespacesPathFor(clazz.decl)

        const writer = this.printer

        const ctorCall = writer.makeMethodCall(implementationClassName, ctor.sig.name,
            ctorSig.args.map((_, index) => writer.makeString(ctorSig.argsNames[index]))
        )

        const ctorArgs = [...Array(this.maxCtorParams).fill(writer.makeString("false")), ctorCall]
        this.printer.writeConstructorImplementation(implementationClassName, ctorSig, writer => {
            const key = nsPath.map(it => it.name).concat([implementationClassName, 'constructor']).join('.')
            injectPatch(writer, key, config.patchMaterialized)
            this.collectExtraCallbacks(clazz)
            if (this.extraAssignCallbacks.length > 0) {
                this.extraAssignCallbacks.map((item) => {
                    writer.writeStatement(
                        writer.makeAssign(`this.${item.callback}`, undefined, writer.makeString(`this.${item.method}`), false)
                    )
                })
            }
        }, { delegationType: DelegationType.THIS, delegationName: implementationClassName, delegationArgs: ctorArgs })
    }

    printOverloads(clazz: MaterializedClass) {
        for (const grouped of groupOverloads(clazz.methods, this.library.language)) {
            this.overloadsPrinter.printGroupedComponentOverloads(clazz.getImplementationName(), grouped)
        }
    }

    printTaggedMethods(clazz: MaterializedClass) {
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
                this.printer.writeMethodImplementation(new Method(getTaggedName(method)!, signature), writer => {
                    writer.writeStatement(
                        writer.makeThrowError("TBD")
                    )
                })
            })
    }

    writeFromPtrMethod(clazz: MaterializedClass, writer: LanguageWriter, collapseCtors: boolean, maxCtorParams: number, classTypeParameters?: string[]) {
        // write "fromPtr(ptr: number): MaterializedClass" method
        const classNamespace = (writer.language == Language.CJ || writer.language == Language.KOTLIN) ? idl.getNamespaceName(clazz.decl) : ""
        const clazzRefType = clazz.isInterface
            ? idl.createReferenceType(getInternalClassName(clazz.className), clazz.generics?.map(it => idl.createTypeParameterReference(sanitizeGenerics(it))))
            : idl.createReferenceType(clazz.decl, clazz.generics?.map(it => idl.createTypeParameterReference(it)))
        console.log(clazzRefType)
        const fromPtrSig = new NamedMethodSignature(clazzRefType, [idl.IDLPointerType], ["ptr"])
        writer.writeMethodImplementation(new Method("fromPtr", fromPtrSig, [MethodModifier.PUBLIC, MethodModifier.STATIC], classTypeParameters), writer => {
            const defaultArg = collapseCtors ? "undefined" : "false"
            const args = [...Array(maxCtorParams).fill(defaultArg), "ptr"]
            writer.writeStatement(writer.makeReturn(writer.makeNewObject(writer.getNodeName(clazzRefType), args.map(arg => writer.makeString(arg)))))
        })
    }
    

    printMethods(clazz: MaterializedClass) {
        clazz.methods.filter(m => !m.method.modifiers?.includes(MethodModifier.STATIC)).forEach(method => {
            this.printMethod(method, "_serialize")
        })
    }

    printStaticMethods(clazz: MaterializedClass) {
        clazz.methods.filter(m => m.method.modifiers?.includes(MethodModifier.STATIC)).forEach(method => {
            this.printMethod(method, "_serialize")
        })
    }
    printMethod(method: MaterializedMethod, postfix: string = "", returnType?: idl.IDLType) {
        const privateMethod = method.getPrivateMethod()
        returnType = returnType ?? privateMethod.tsReturnType()
        this.library.setCurrentContext(`${privateMethod.originalParentName}.${privateMethod.sig.name}`)
        writePeerMethod(this.library, this.printer, privateMethod, true, this.dumpSerialized, `${postfix}`,
            this.printer.language == Language.CJ ?
                "if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception(\"\")}" :
                this.printer.language == Language.JAVA ?
                    "this.peer.ptr" :
                this.printer.language == Language.KOTLIN ?
                    "this.peer!!.ptr" :
                    "this.peer!.ptr", returnType)
        this.library.setCurrentContext(undefined)
    }

    printFields(clazz: MaterializedClass) {
        const implementationClassName = clazz.getImplementationName()
        clazz.fields.forEach(field => {
            if (field.extraMethodName) {
                const name = field.extraMethodName
                const type = field.field.type
                if (idl.isReferenceType(type)) {
                    const decl = this.library.resolveTypeReference(type)
                    if (decl && idl.isCallback(decl)) {
                        const types: idl.IDLType[] = []
                        const names: string[] = []
                        decl.parameters.forEach((parameter) => {
                            types.push(parameter.type)
                            names.push(parameter.name)
                        })
                        this.printer.writeMethodImplementation(
                            new Method(name,new NamedMethodSignature(idl.IDLVoidType, types, names)),
                            () => {}
                        )
                    }
                }
            }
            const mField = field.field
            // TBD: use deserializer to get complex type from native
            const isStatic = mField.modifiers.includes(FieldModifier.STATIC)
            const isReaonly = mField.modifiers.includes(FieldModifier.READONLY)
            const receiver = isStatic ? implementationClassName : 'this'
            const type = this.convertToPropertyType(field)
            if (isReaonly && this.printer.language != Language.TS) {
                const initializer = this.printer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, [])
                this.printer.writeProperty(mField.name, type, mField.modifiers, undefined, undefined, isStatic ? initializer : undefined)
            } else {
                this.printer.writeProperty(mField.name, type, (clazz.isInterface ? [FieldModifier.OVERRIDE] : []).concat(mField.modifiers),
                    {
                        method: new Method('get', new MethodSignature(type, [])), op: () => {
                            this.printer.writeStatement(
                                this.printer.makeReturn(this.printer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, []))
                            )
                        }
                    },
                    {
                        method: new Method('set', new NamedMethodSignature(idl.IDLVoidType, [mField.type], [mField.name])), op: () => {
                            let castedNonNullArg
                            if (field.isNullableOriginalTypeField) {
                                castedNonNullArg = `${mField.name}_NonNull`
                                this.printer.writeStatement(this.printer.makeAssign(castedNonNullArg,
                                    undefined,
                                    this.printer.makeCast(this.printer.makeString(mField.name), mField.type),
                                    true))
                            } else {
                                castedNonNullArg = mField.name
                            }
                            this.printer.writeMethodCall(receiver, `set${capitalize(mField.name)}`, [castedNonNullArg])
                        }
                    }
                )
            }
        })
    }

    writeInterface(clazz: MaterializedClass, writer: LanguageWriter) {
        const decl: idl.IDLInterface = clazz.decl
        const superInterface = writer.language == Language.JAVA ? ["Ark_Object"] : undefined
        writer.writeInterface(this.mangle(decl.name), () => {
            writer.makeStaticBlock(() => {
                for (const p of decl.properties.filter(p => p.isStatic)) {
                    const modifiers: FieldModifier[] = []
                    if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                    modifiers.push(FieldModifier.STATIC)
                    writer.writeProperty(p.name, writer.language == Language.JAVA ? p.type : maybeOptional(p.type, p.isOptional), modifiers)
                }
            })
            for (const p of decl.properties.filter(p => !p.isStatic)) {
                const modifiers: FieldModifier[] = []
                if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                writer.writeProperty(p.name, writer.language == Language.JAVA ? p.type : maybeOptional(p.type, p.isOptional), modifiers)
            }
            for (const m of decl.methods) {
                writer.writeMethodDeclaration(m.name,
                    new NamedMethodSignature(
                        m.returnType,
                        m.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
                        m.parameters.map(it => it.name)));
            }
        }, superInterface, clazz.generics?.map(sanitizeGenerics))
    }

    protected get namespacePrefix(): string {
        return ""
    }
    protected mangle(className: string): string {
        return className
    }

    protected printMaterializedClass(clazz: MaterializedClass) {
        const printer = this.printer

        this.printImports()

        let superClassName = generifiedTypeName(clazz.superClass, getSuperName(clazz, this.library))
        if (!superClassName && printer.language == Language.JAVA) {
            superClassName = clazz.isStaticMaterialized ? ARK_OBJECTBASE : ARK_MATERIALIZEDBASE
        }
        const interfaces: string[] = clazz.isStaticMaterialized ? [] : ["MaterializedBase"]
        if (clazz.interfaces) {
            interfaces.push(
                ...clazz.interfaces.map(it => {
                    it = maybeRestoreGenerics(it, this.library) ?? it
                    const decl = this.library.resolveTypeReference(it)
                    if (!decl) {
                        throw new Error(`Not found declaration "${it.name}"`)
                    }
                    const typeArgs = it.typeArguments?.length ? `<${it.typeArguments.map(arg => printer.getNodeName(arg))}>` : ""
                    const nsName = printer.language === Language.CJ ? decl.name : idl.getQualifiedName(decl, 'namespace.name')
                    return `${this.namespacePrefix}${nsName}${printer.language == Language.CJ ? 'Interface' : ''}${typeArgs}`
                }))
        }

        const classTypeParameters = clazz.generics?.map(sanitizeGenerics)

        if (clazz.isInterface) {
            const genericsClause = clazz.generics?.length ? `<${clazz.generics.map(sanitizeGenerics).join(", ")}>` : ''
            const nsName = this.mangle(clazz.className)
            interfaces.push(`${nsName}${genericsClause}`)
        }

        // collapse constructors for TS
        // do not collapse constructors for ArkTS, CJ, Java, ...
        const collapseConstructors = this.library.language == Language.TS

        if (clazz.isInterface) {
            this.writeInterface(clazz, printer)
        } else if (!clazz.isStaticMaterialized) {
            // Write internal Materialized class with fromPtr(ptr) method
            printer.writeClass(
                getInternalClassName(clazz.className),
                (writer) => {
                    writer.makeStaticBlock(() => {
                        this.writeFromPtrMethod(clazz, writer, collapseConstructors, this.maxCtorParams, classTypeParameters)
                    })
                },
                undefined,
                undefined,
                undefined,
                undefined,
                false
            )
        }

        const implementationClassName = this.getImplementationName(clazz)

        printer.writeClass(implementationClassName, writer => {
            if (!superClassName && !clazz.isStaticMaterialized) {
                writer.writeFieldDeclaration("peer", FinalizableType, undefined, true, writer.makeNull())
                // write getPeer() method
                const getPeerSig = new MethodSignature(idl.createOptionalType(idl.createReferenceType("Finalizable")), [])
                writer.writeMethodImplementation(new Method("getPeer", getPeerSig, [MethodModifier.PUBLIC, MethodModifier.OVERRIDE]), writer => {
                    writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
                })
            }

            this.printFields(clazz)

            this.printBaseCtor(clazz, collapseConstructors, superClassName)
            if (!collapseConstructors) {
                for (const ctor of clazz.ctors) {
                    this.printCtor(clazz, ctor)
                }
            }
            writer.makeStaticBlock(() => {
                if (!collapseConstructors) {
                    for (const ctor of clazz.ctors) {
                        const pointerType = IDLPointerType
                        this.library.setCurrentContext(`${clazz.className}.constructor`)
                        writePeerMethod(this.library, this.printer, ctor, true, this.dumpSerialized, "", "", pointerType)
                        this.library.setCurrentContext(undefined)
                    }
                }
                if (clazz.finalizer) printPeerFinalizer(clazz, writer)
                if (clazz.isInterface) {
                    this.writeFromPtrMethod(clazz, writer, collapseConstructors, this.maxCtorParams, classTypeParameters)
                }
                this.printStaticMethods(clazz)
            })
            this.printOverloads(clazz)
            this.printTaggedMethods(clazz)
            this.printMethods(clazz)
            }, superClassName, interfaces.length === 0 ? undefined : interfaces, classTypeParameters)
    }
}

function printPeerFinalizer(clazz: MaterializedClass, writer: LanguageWriter): void {
    const finalizer = new Method(
        "getFinalizer",
        new MethodSignature(IDLPointerType, []),
        // TODO: private static getFinalizer() method conflicts with its implementation in the parent class
        [MethodModifier.STATIC])
    writer.writeMethodImplementation(finalizer, writer => {
        writer.writeStatement(
            writer.makeReturn(
                writer.makeNativeCall(NativeModule.Generated, `_${qualifiedName(clazz.decl, "_", "namespace.name")}_getFinalizer`, [])))
    })
}

class TSMaterializedFileVisitor extends MaterializedFileVisitorBase {
    protected collectImports(imports: ImportsCollector) {
        const decl = this.clazz.decl
        collectDeclDependencies(this.library, decl, imports, {
            expandTypedefs: true,
            includeTransformedCallbacks: true,
            includeMaterializedInternals: true,
        })
        this.clazz.fields.forEach(field => {
            if (idl.isReferenceType(field.field.type)) {
                collectDeclItself(this.library, field.field.type, imports, {
                    includeMaterializedInternals: true,
                    includeTransformedCallbacks: true
                })
            }
        })
    }

    override printImports() {
        // collect imports
        this.collectImports(this.collector)

        // common runtime dependencies
        this.collector.addFeatures([
            'Finalizable',
            'runtimeType',
            'RuntimeType',
            'SerializerBase',
            'registerCallback',
            'wrapCallback',
            'toPeerPtr',
            'KPointer',
        ], '@koalaui/interop')
        this.collector.addFeatures(['MaterializedBase'], '@koalaui/interop')
        this.collector.addFeatures(['unsafeCast'], '@koalaui/common')
        collectDeclItself(this.library, idl.createReferenceType("CallbackKind"), this.collector)
        this.collector.addFeatures(['int32', 'int64', 'float32'], '@koalaui/common')
        this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        if (this.library.language === Language.ARKTS) {
            this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        }
        if (this.library.language === Language.TS) {
            this.collector.addFeature('isInstanceOf', '@koalaui/interop')
        }

        const hookMethods = generatorConfiguration().hooks.get(this.clazz.className)
        const handwrittenPackage = this.library.layout.handwrittenPackage()
        if (hookMethods) {
            for (const [methodName, hook] of hookMethods.entries()) {
                const hookName = hook ? hook.hookName : `hook${this.clazz.className}${capitalize(methodName)}`
                this.collector.addFeature(hookName, handwrittenPackage)
            }
        }
        if (generatorConfiguration().externalTypes.size > 0
            || generatorConfiguration().externalPackages.length > 0) {
            this.collector.addFeature("extractors", handwrittenPackage)
        }
        // specific runtime dependencies
        collectDeclItself(this.library, idl.createReferenceType(NativeModule.Generated.name), this.collector)
        if (this.library.name === 'arkoala') {
            this.collector.addFeatures(['CallbackTransformer'], './CallbackTransformer')
            if (this.library.language === Language.TS) {
                this.collector.addFeatures(['GestureName', 'GestureComponent'], './generated/shared/generated-utils')
            }
        }
    }

    private calcClassWeight() {
        // correct order to fix rollup
        if (!this.clazz.superClass) {
            return 0
        }
        let superClass = this.library.resolveTypeReference(this.clazz.superClass)
        let weight = 0
        while (superClass) {
            weight++
            superClass = idl.isInterface(superClass) ? getSuper(superClass, this.library) : undefined
        }
        return weight
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE,
            },
            weight: this.calcClassWeight()
        }
    }
}

class JavaMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void {
        const imports = [{ feature: 'org.koalaui.interop.Finalizable', module: '' }]
        printJavaImports(this.printer, imports)
    }

    override printCtor(clazz: MaterializedClass, ctor: MaterializedMethod): void {
        const emptyParameterType = createReferenceType(ARK_MATERIALIZEDBASE_EMPTY_PARAMETER)
        const ctorPostfix = `_${clazz.className.toLowerCase()}`
        const implementationClassName = clazz.getImplementationName()
        const pointerType = IDLPointerType
        this.library.setCurrentContext(`${clazz.className}.constructor`)
        writePeerMethod(this.library, this.printer, ctor, true, this.dumpSerialized, ctorPostfix, "", pointerType)
        this.library.setCurrentContext(undefined)

        const ctorSig = ctor.method.signature as NamedMethodSignature
        // constructor with a special parameter to use in static methods
        const emptySignature = new MethodSignature(IDLVoidType, [emptyParameterType])
        this.printer.writeConstructorImplementation(implementationClassName, emptySignature, writer => {
            writer.writeSuperCall([emptySignature.argName(0)]);
        })

        // generate a constructor with zero parameters for static methods
        // in case there is no alredy defined one
        if (ctorSig.args.length > 0) {
            this.printer.writeConstructorImplementation(implementationClassName, new MethodSignature(IDLVoidType, []), writer => {
                writer.writeSuperCall([`(${ARK_MATERIALIZEDBASE_EMPTY_PARAMETER})null`]);
            })
        }

        this.printer.writeConstructorImplementation(implementationClassName, ctorSig, writer => {
            writer.writeSuperCall([`(${forceAsNamedNode(emptyParameterType).name})null`]);

            const args = ctorSig.argsNames.map(it => writer.makeString(it))
            writer.writeStatement(
                writer.makeAssign('ctorPtr', IDLPointerType,
                    writer.makeMethodCall(implementationClassName, `${PeerMethodSignature.CTOR}${ctorPostfix}`, args),
                    true))

            writer.writeStatement(writer.makeAssign(
                'this.peer',
                FinalizableType,
                writer.makeNewObject('Finalizable', [writer.makeString('ctorPtr'), writer.makeString(`${implementationClassName}.getFinalizer()`)]),
                false
            ))
        })
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}

class ArkTSMaterializedFileVisitor extends TSMaterializedFileVisitor {
    protected collectImports(imports: ImportsCollector): void {
        super.collectImports(imports)
        collectDeclItself(this.library, idl.createReferenceType("TypeChecker"), this.collector)
    }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }
}

class CJMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void { }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    override printOverloads(clazz: MaterializedClass) {
        for (let method of clazz.methods) {
            if (!method.method.modifiers?.includes(MethodModifier.PRIVATE))
                method.method.modifiers!.push(MethodModifier.PUBLIC)
            this.printer.writeMethodImplementation(method.method, (writer) => {
                this.overloadsPrinter.printPeerCallAndReturn(clazz.getImplementationName(), method.method, method)
            })
        }
    }

    override mangle(className: string): string {
        return this.namespacePrefix.concat(className)
    }
    override get namespacePrefix(): string {
        return idl.getNamespaceName(this.clazz.decl)
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}

class KotlinMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void { }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    override mangle(className: string): string {
        return removePoints(this.namespacePrefix.concat('_').concat(className))
    }

    override get namespacePrefix(): string {
        return idl.getNamespaceName(this.clazz.decl)
    }

    override printOverloads(clazz: MaterializedClass) {
        for (let method of clazz.methods) {
            if (!method.method.modifiers?.includes(MethodModifier.PRIVATE)) {
                method.method.modifiers!.push(MethodModifier.PUBLIC)
                if (clazz.isInterface) method.method.modifiers!.push(MethodModifier.OVERRIDE)
            }
            this.printer.writeMethodImplementation(method.method, (writer) => {
                this.overloadsPrinter.printPeerCallAndReturn(clazz.getImplementationName(), method.method, method)
            })
        }
    }

    visit(): PrinterResult {
        this.printMaterializedClass(this.clazz)
        return {
            collector: this.collector,
            content: this.printer,
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}

class MaterializedVisitor implements PrinterClass {
    readonly materialized: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) { }

    private printContent(clazz: MaterializedClass): PrinterResult {
        let visitor: MaterializedFileVisitor
        if (Language.TS == this.library.language) {
            visitor = new TSMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (Language.ARKTS == this.library.language) {
            visitor = new ArkTSMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (this.library.language == Language.JAVA) {
            visitor = new JavaMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (this.library.language == Language.CJ) {
            visitor = new CJMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else if (this.library.language == Language.KOTLIN) {
            visitor = new KotlinMaterializedFileVisitor(
                this.library, clazz, this.dumpSerialized)
        } else {
            throw new Error(`Unsupported language ${this.library.language} in MaterializedPrinter.ts`)
        }

        return visitor.visit()
    }

    print(): PrinterResult[] {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        const materializedClasses = this.library.orderedMaterialized
        const isParent = (maybeParent: MaterializedClass, maybeDescendant: MaterializedClass): boolean => {
            if (!maybeDescendant.superClass) return false
            const nearestParent = this.library.resolveTypeReference(maybeDescendant.superClass)
            if (!nearestParent) return false
            const nearestParentFQN = idl.getFQName(nearestParent)
            const nearestMaterializedParent = materializedClasses.find(it => idl.getFQName(it.decl) === nearestParentFQN)
            if (nearestMaterializedParent === maybeParent)
                return true
            return nearestMaterializedParent
                ? isParent(maybeParent, nearestMaterializedParent)
                : false
        }
        const sortedMaterializedClasses = Array.from(materializedClasses).sort((a, b) => {
            if (isParent(a, b)) return -1
            if (isParent(b, a)) return 1
            return 0
        })
        return sortedMaterializedClasses.flatMap(it => {
            return this.printContent(it)
        })
    }
}

export function createMaterializedPrinter(dumpSerialized: boolean) {
    return (peerLibrary: PeerLibrary) => LanguageWriter.relativeReferences(true, () =>
        new MaterializedVisitor(peerLibrary, dumpSerialized).print())
}

function getSuperName(clazz: MaterializedClass, resolver:ReferenceResolver): string | undefined {
    const superClass = clazz.superClass
    if (!superClass) return undefined
    const decl = resolver.resolveTypeReference(superClass)
    if (!decl) return undefined
    const nsName = idl.getQualifiedName(decl, 'namespace.name')
    return clazz.isInterface ? getInternalClassName(nsName) : nsName
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
            isStatic: method.isStatic,
            isOptional: method.isOptional,
            isAsync: method.isAsync,
            isFree: method.isFree,
        },
        {
            extendedAttributes: method.extendedAttributes,
            fileName: method.fileName,
            documentation: method.documentation,
        },
        method.typeParameters
    )
}
