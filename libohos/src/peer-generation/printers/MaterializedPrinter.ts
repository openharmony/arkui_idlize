/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import { capitalize, stringOrNone, Language, generifiedTypeName, sanitizeGenerics, ArgumentModifier,
    getSuper, ReferenceResolver, MaterializedMethod, DelegationType, LanguageExpression,
    DelegationCall, getInternalClassName, LanguageWriter, LayoutNodeRole, MaterializedClass, MaterializedField,
    qualifiedName, PeerMethodSignature, maybeRestoreGenerics,
    PACKAGE_IDLIZE_INTERNAL, isMaterialized, PeerLibrary, 
    copyMethod,
    isMaterializedMethodOverridden,
} from '@idlizer/core'
import { writePeerMethod } from "./PeersPrinter"
import {
    FieldModifier,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from "../LanguageWriters";
import { allowNamedOverloads, allowsOverloads, collapseSameNamedMethods, groupOverloads, OverloadsPrinter } from "./OverloadsPrinter";
import { ImportsCollector } from "../ImportsCollector"
import { TargetFile } from "./TargetFile"
import { IDLPointerType, IDLType, maybeOptional } from '@idlizer/core/idl'
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils";
import { getHookMethod, peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { NativeModule } from '../NativeModule';
import { PrinterClass, PrinterResult } from '../LayoutManager';
import { injectPatch } from '../common';
import { FinalizableType, RefCountedType } from '../idl/IdlPeerGeneratorVisitor';

const MATERIALIZED_TAG = "MaterializedBaseTag.NOP"

interface MaterializedFileVisitor {
    visit(): PrinterResult
}

type MethodFilter = (method: MaterializedMethod | idl.IDLMethod) => boolean

function getDeserializer(classFQName: string): { receiver: string, method: string } {
    return {
        receiver: "extractors",
        method: `deserialize_${classFQName.replaceAll('.', '_')}`
    }
}

abstract class MaterializedFileVisitorBase implements MaterializedFileVisitor {

    protected readonly collector = new ImportsCollector()
    protected readonly printer = this.library.createLanguageWriter()
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

    assignFinalizable(className: string, peerPtr: string, isRefCounted: boolean, /*peerType: idl.IDLReferenceType, createFinalizer: boolean,*/ writer: LanguageWriter) {
        const nameConvertor = this.library.createTypeNameConvertor(this.library.language)
        const params = isRefCounted ?
            [writer.makeString(peerPtr)] :
            [writer.makeString(peerPtr), writer.makeString(`${className}.getFinalizer()`)]
        const peerType = isRefCounted ? RefCountedType : FinalizableType
        writer.writeStatement(
            writer.makeAssign(
                "this.peer",
                idl.maybeOptional(peerType, true),
                writer.makeNewObject(
                    nameConvertor.convert(peerType),
                    params
                ), false
            )
        )
        writer.writeExpressionStatement(
            writer.makeMethodCall('this', PeerMethodSignature.CALL_HOLDER, [])
        )
    }

    // print non-static readonly fields initialization
    printFieldsInitialization(clazz: MaterializedClass) {
        const writer = this.printer
        const receiver = writer.makeThis()
        for (const mField of clazz.fields) {
            const f = mField.field
            const isStatic = f.modifiers.includes(FieldModifier.STATIC)
            if (!mField.state.isAccessor && !isStatic) {
                const initializer = this.printer.makeMethodCall(receiver.asString(), `get${capitalize(f.name)}`, [])
                writer.writeStatement(
                    writer.makeAssign(f.name, f.type, initializer, false, false, { receiver: receiver.asString() })
                )
            }
        }
    }

    printBaseCtor(clazz: MaterializedClass, superClassName?: string) {
        const hasSuperClass = (superClassName != undefined)
        if (clazz.isStaticMaterialized) return
        const className = this.getImplementationName(clazz)
        if (!allowsOverloads(this.library.language)) {
            this.printCollapsedCtors(clazz, superClassName)
            return
        }
        const peerPtr = "peerPtr"
        const peerPtrExpr = this.printer.makeString(peerPtr)
        const params = ["tag", peerPtr]
        const types = [idl.createReferenceType("idlize.stdlib.MaterializedBaseTag"), idl.IDLPointerType]
        const sig = new NamedMethodSignature(idl.IDLVoidType, types, params)
        this.printer.writeConstructorImplementation(className, sig, writer => {
            if (!hasSuperClass || !isSuperClassMaterialized(this.library, clazz.superClass)) {
                this.assignFinalizable(className, peerPtr, clazz.isRefCounted, writer)
            }
            this.printFieldsInitialization(clazz)
        }, this.getSuperDelegationCall(this.printer, clazz, peerPtrExpr, superClassName))
    }

    printCollapsedCtors(clazz: MaterializedClass, superClassName?: string) {
        const ctorPostfix = `_${clazz.className.toLowerCase()}`
        const ctors = clazz.ctors.map(ctor => ctor.withReturnType(idl.IDLPointerType))
        const collapsedCtor = collapseSameNamedMethods(ctors.map(it => it.method), undefined, undefined)
        this.printCollapsedCtor(clazz, collapsedCtor, ctorPostfix, superClassName)
        this.overloadsPrinter.setPostfix(ctorPostfix)
        this.overloadsPrinter.printGroupedComponentOverloads(this.mangle(clazz.getImplementationName()), ctors)
        this.overloadsPrinter.setPostfix()
        for (const ctor of clazz.ctors) {
            this.printMethod(ctor, `${ctorPostfix}_serialize`, idl.IDLPointerType)
        }
    }

    getSuperDelegationCall(
        writer: LanguageWriter,
        clazz: MaterializedClass,
        peerPtrExpr: LanguageExpression,
        superClassName?: string): DelegationCall | undefined {

        if (superClassName == undefined) return undefined

        const superDecl = this.library.resolveTypeReference(clazz.superClass!)
        if (!superDecl || !idl.isInterface(superDecl))
            throw new Error(`Super declaration is not found for materialized class: ${clazz.className}`)

        const dimensions = [...superDecl.constructors.map(it => it.parameters.length)]
        const argsCount = dimensions.length == 0 ? 0 : Math.max(...dimensions)
        const tagArgs: LanguageExpression[] = allowsOverloads(this.library.language)
            ? [writer.makeString("tag")]
            : Array(argsCount).fill(writer.makeUndefined())
        const args = isSuperClassMaterialized(this.library, clazz.superClass) ? [...tagArgs, peerPtrExpr] : []
        return { delegationArgs: args, delegationName: superClassName }
    }

    printCollapsedCtor(clazz: MaterializedClass, ctor: Method, ctorPostfix: string, superClassName?: string) {
        let hasMaterializedSuperClass = isSuperClassMaterialized(this.library, clazz.superClass)
        const peerPtr = "peerPtr"
        const unwrapPeerPtr = "unwrapPeerPtr"
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
            writer.makeDefinedCheck(peerPtr, undefined),
            writer.makeString(peerPtr),
            writer.makeMethodCall(this.mangle(implementationClassName), `${ctor.name}${ctorPostfix}`, ctorArgs)
        )
        const delegationCall = this.getSuperDelegationCall(writer, clazz, peerPtrExpr, superClassName)

        this.printer.writeConstructorImplementation(this.namespacePrefix.concat(implementationClassName), sigWithPointer, writer => {

            if (hasMaterializedSuperClass) return

            writer.writeStatement(
                writer.makeAssign(unwrapPeerPtr, idl.IDLPointerType, peerPtrExpr, true))
            this.assignFinalizable(this.mangle(implementationClassName), unwrapPeerPtr, clazz.isRefCounted, writer)
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

        const ctorArgs = [writer.makeString(MATERIALIZED_TAG), ctorCall]
        writer.writeConstructorImplementation(implementationClassName, ctorSig, writer => {
            const key = nsPath.map(it => it.name).concat([implementationClassName, 'constructor']).join('.')
            injectPatch(writer, key, config.patchMaterialized)
            this.collectExtraCallbacks(clazz)
            if (this.extraAssignCallbacks.length > 0) {
                this.extraAssignCallbacks.map((item) => {
                    writer.writeStatement(
                        writer.makeAssign(`this.${item.callback}`, undefined, writer.makeMethodReference("this", item.method), false)
                    )
                })
            }
            this.printFieldsInitialization(clazz)
        }, { delegationType: DelegationType.THIS, delegationName: implementationClassName, delegationArgs: ctorArgs })
    }

    printOverloads(clazz: MaterializedClass, filter: MethodFilter) {
        for (const grouped of groupOverloads(clazz.methods.filter(filter), this.library.language)) {
            this.overloadsPrinter.printGroupedComponentOverloads(clazz.getImplementationName(), grouped)
        }
        if (!clazz.isInterface && allowNamedOverloads(this.library.language)) {
            this.writeNamedOverloadsGroups(clazz.decl.methods.filter(filter), this.printer)
        }
    }

    printTaggedMethods(clazz: MaterializedClass, filter: MethodFilter) {
        // TBD: Refactor tagged methods staff
        const seenTaggedMethods = new Set<string>()
        clazz.taggedMethods
            .filter(filter)
            .map(it => [it, methodFromTagged(it)])
            .filter(([tagged, it]) => {
                if (seenTaggedMethods.has(it.name)) return false
                seenTaggedMethods.add(it.name)
                return true
            })
            .forEach(([tagged, method]) => {
                // const method = methodFromTagged(taggedMethod)
                const signature = new NamedMethodSignature(
                    method.returnType,
                    method.parameters.map(it => it.type!),
                    method.parameters.map(it => it.name)
                )
                // TBD: Add tagged methods implementation
                this.printer.writeMethodImplementation(new Method(method.name!, signature), writer => {
                    const hook = getHookMethod(clazz.className, method.name!)
                    if (hook) {
                        const hookCall = writer.makeFunctionCall(hook.hookName, [writer.makeThis(), ...tagged.parameters.map(it => writer.makeString(it.name))])
                        writer.addFeature(hook.hookName, this.library.layout.handwrittenPackage())
                        if (hook.replaceImplementation) {
                            writer.writeStatement(writer.makeReturn(hookCall))
                            return
                        } else {
                            writer.writeExpressionStatement(hookCall)
                        }
                    }
                    const taggedCall = writer.makeMethodCall('this', tagged.name, tagged.parameters.map(it => writer.makeString(it.name)))
                    const conditions = idl.fetchSignatureTags(tagged).map(it => writer.makeNaryOp("==", [writer.makeString(it.name), writer.makeString(it.value)]))
                    const condition = writer.makeNaryOp("||", conditions)
                    const block = writer.makeBlock([
                        writer.makeReturn(taggedCall)
                    ])
                    writer.writeStatement(writer.makeCondition(condition, block))
                    writer.writeStatement(
                        writer.makeThrowError("Unrecognized tagged method")
                    )
                })
            })
    }

    writeFromPtrMethod(clazz: MaterializedClass, writer: LanguageWriter, maxCtorParams: number, classTypeParameters?: string[]) {
        // write "fromPtr(ptr: number): MaterializedClass" method
        const clazzRefType = clazz.isInterface
            ? idl.createReferenceType(getInternalClassName(clazz.className), clazz.generics?.map(it => idl.createTypeParameterReference(sanitizeGenerics(it))))
            : idl.createReferenceType(clazz.decl, clazz.generics?.map(it => idl.createTypeParameterReference(it)))
        const fromPtrSig = new NamedMethodSignature(clazzRefType, [idl.IDLPointerType], ["ptr"])
        writer.writeMethodImplementation(new Method("fromPtr", fromPtrSig, [MethodModifier.PUBLIC, MethodModifier.STATIC], classTypeParameters), writer => {
            var returnedExpr: LanguageExpression | undefined = undefined
            const classFQName = idl.getFQName(clazz.decl)
            if (peerGeneratorConfiguration().handwrittenDeserializers.find(
                name => name == classFQName)) {
                const deserializerInfo = getDeserializer(classFQName)
                const args = [ writer.makeString("ptr") ]
                returnedExpr = writer.makeMethodCall(deserializerInfo.receiver, deserializerInfo.method, args)
            } else {
                const defaultArgs = allowsOverloads(this.library.language)
                    ? [writer.makeString(MATERIALIZED_TAG)]
                    : Array(maxCtorParams).fill(writer.makeUndefined())
                const args = [...defaultArgs, writer.makeString("ptr")]
                returnedExpr = writer.makeNewObject(writer.getNodeName(clazzRefType), args)
            }
            writer.writeStatement(writer.makeReturn(returnedExpr))
        })
    }

    printMethods(clazz: MaterializedClass, filter: MethodFilter) {
        clazz.methods.filter(filter).forEach(method => {
            this.printMethod(method, "_serialize")
        })
    }

    printMethod(method: MaterializedMethod, postfix: string = "", returnType?: idl.IDLType) {
        const useProtected = this.printer.supportedModifiers.includes(MethodModifier.PROTECTED)
        const privateMethod = method.getPrivateMethod(useProtected)
        const isOverridden = isMaterializedMethodOverridden(this.clazz.decl, method.method, this.library, true)
        this.library.setCurrentContext(`${privateMethod.originalParentName}.${privateMethod.sig.name}`)
        returnType = returnType ?? method.sig.returnType
        returnType = idl.isTypeParameterType(method.sig.returnType) ? idl.IDLVoidType : returnType
        writePeerMethod(this.library, this.printer, privateMethod, this.dumpSerialized, `${postfix}`,
            this.printer.language == Language.CJ ?
                "if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception(\"\")}" :
                this.printer.language == Language.KOTLIN ?
                    "this.peer!!.ptr" :
                    "this.peer!.ptr", returnType, isOverridden)
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
                            new Method(name,new NamedMethodSignature(decl.returnType, types, names)),
                            w => {
                                w.writeStatement(w.makeThrowError("Not implemented!"))
                            }
                        )
                    }
                }
            }
            const mField = field.field
            // TBD: use deserializer to get complex type from native
            const isStatic = mField.modifiers.includes(FieldModifier.STATIC)
            const receiver = isStatic ? implementationClassName : 'this'
            const type = this.convertToPropertyType(field)
            if (!field.state.isAccessor && (this.printer.language === Language.ARKTS)) {
                // arkts can not have property and getter at the same time
                const initializer = this.printer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, [])
                this.printer.writeProperty(mField.name, type, mField.modifiers, undefined, undefined, isStatic ? initializer : undefined)
            } else {
                const hasGetter = !field.state.isAccessor || field.state.hasGetter
                const hasSetter = !field.state.isAccessor && !field.state.isReadonly
                    || field.state.isAccessor && field.state.hasSetter
                this.printer.writeProperty(mField.name, type, (clazz.isInterface ? [FieldModifier.OVERRIDE] : []).concat(mField.modifiers),
                    hasGetter ? {
                        method: new Method('get', new MethodSignature(type, [])), op: () => {
                            this.printer.writeStatement(
                                this.printer.makeReturn(this.printer.makeMethodCall(receiver, `get${capitalize(mField.name)}`, []))
                            )
                        }
                    } : undefined,
                    hasSetter ? {
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
                    } : undefined
                )
            }
        })
    }

    writeInterface(clazz: MaterializedClass, writer: LanguageWriter) {
        const decl: idl.IDLInterface = clazz.decl
        const superClass = clazz.superClass
        var superInterfaces: string[] | undefined = undefined
        if (superClass) {
            const nameConvertor = this.library.createTypeNameConvertor(writer.language)
            const superClassName = nameConvertor.convert(superClass)
            superInterfaces = [superClassName]
        }
        writer.writeInterface(this.mangle(decl.name), () => {
            writer.writeStaticEntitiesBlock(() => {
                for (const p of decl.properties.filter(p => p.isStatic)) {
                    const modifiers: FieldModifier[] = []
                    if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                    modifiers.push(FieldModifier.STATIC)
                    writer.writeProperty(p.name, maybeOptional(p.type, p.isOptional), modifiers)
                }
            })
            for (const field of clazz.fields.filter(f => !f.field.modifiers.includes(FieldModifier.STATIC))) {
                const f = field.field
                writer.writeProperty(f.name, maybeOptional(f.type, field.isNullableOriginalTypeField), f.modifiers)
            }
            for (const m of decl.methods) {
                const overloadInfo = PeerMethodSignature.mangleOverloadedName(m)
                const overloadedName = allowNamedOverloads(this.library.language)
                    ? overloadInfo?.alias ?? m.name
                    : m.name
                writer.writeMethodDeclaration(overloadedName,
                    new NamedMethodSignature(
                        m.returnType,
                        m.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
                        m.parameters.map(it => it.name)));
            }
            if (allowNamedOverloads(this.library.language)) {
                this.writeNamedOverloadsGroups(decl.methods, writer)
            }
        }, superInterfaces, clazz.generics?.map(sanitizeGenerics))
        this.printDefaultExport(decl, writer)
    }

    protected writeNamedOverloadsGroups(methods: idl.IDLMethod[], writer: LanguageWriter): void {
        const overloadsMap = new Map<string, string[]>()
        for (const method of methods) {
            const info = PeerMethodSignature.mangleOverloadedName(method)
            if (!info.alias)
                continue
            if (!overloadsMap.has(method.name))
                overloadsMap.set(method.name, [])
            overloadsMap.get(method.name)!.push(info.alias ?? (method.name + info.postfix))
        }
        for (const [overloadName, mangledNames] of overloadsMap.entries()) {
            writer.print(`overload ${overloadName} { ${mangledNames.join(", ")} }`)
        }
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

        var superClassName: string | undefined = undefined
        if (clazz.superClass) {
            const nameConvertor = this.library.createTypeNameConvertor(this.library.language)
            superClassName = generifiedTypeName(clazz.superClass, nameConvertor, getSuperName(clazz, this.library))
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
                    return `${this.namespacePrefix}${nsName}${printer.language == Language.CJ ? 'Interfaces' : ''}${typeArgs}`
                }))
        }

        const classTypeParameters = clazz.generics?.map(sanitizeGenerics)

        if (clazz.isInterface) {
            const genericsClause = clazz.generics?.length ? `<${clazz.generics.map(sanitizeGenerics).join(", ")}>` : ''
            const nsName = this.mangle(clazz.className)
            interfaces.push(`${nsName}${genericsClause}`)
        }

        // collapse constructors for TS
        // do not collapse constructors for ArkTS, CJ, ...

        if (clazz.isInterface) {
            this.writeInterface(clazz, printer)
        } else if (!clazz.isStaticMaterialized) {
            // Write internal Materialized class with fromPtr(ptr) method
            printer.writeClass(
                getInternalClassName(clazz.className),
                (writer) => {
                    writer.writeStaticEntitiesBlock(() => {
                        this.writeFromPtrMethod(clazz, writer, this.maxCtorParams, classTypeParameters)
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
            if (!isSuperClassMaterialized(this.library, this.clazz.superClass) && !clazz.isStaticMaterialized) {
                const peerType = clazz.isRefCounted ? RefCountedType : FinalizableType
                writer.writeFieldDeclaration("peer", idl.maybeOptional(peerType, true), undefined, true, writer.makeNull())
                // write getPeer() method
                const getPeerSig = new MethodSignature(idl.maybeOptional(peerType, true), [])
                writer.writeMethodImplementation(new Method("getPeer", getPeerSig, [MethodModifier.PUBLIC, MethodModifier.OVERRIDE]), writer => {
                    writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
                })
            }

            this.printFields(clazz)

            this.printBaseCtor(clazz, superClassName)
            if (allowsOverloads(this.library.language)) {
                for (const ctor of clazz.ctors) {
                    this.printCtor(clazz, ctor)
                }
            }
            const staticMethodsFilter: MethodFilter = method => {
                if (method instanceof MaterializedMethod) {
                    return !!method.method.modifiers && method.method.modifiers.includes(MethodModifier.STATIC)
                }
                return method.isStatic
            }
            const nonStaticMethodsFilter: MethodFilter = method => !staticMethodsFilter(method)
            writer.writeStaticEntitiesBlock(() => {
                if (allowsOverloads(this.library.language)) {
                    for (const ctor of clazz.ctors) {
                        const pointerType = IDLPointerType
                        this.library.setCurrentContext(`${clazz.className}.constructor`)
                        writePeerMethod(this.library, printer, ctor, this.dumpSerialized, "", "", pointerType)
                        this.library.setCurrentContext(undefined)
                    }
                }
                if (clazz.finalizer) printPeerFinalizer(clazz, writer)
                if (clazz.isInterface) {
                    this.writeFromPtrMethod(clazz, writer, this.maxCtorParams, classTypeParameters)
                }
                this.printOverloads(clazz, staticMethodsFilter)
                this.printTaggedMethods(clazz, staticMethodsFilter)
                this.printMethods(clazz, staticMethodsFilter)
            })
            this.printOverloads(clazz, nonStaticMethodsFilter)
            this.printTaggedMethods(clazz, nonStaticMethodsFilter)
            this.printMethods(clazz, nonStaticMethodsFilter)
        }, superClassName, interfaces.length === 0 ? undefined : interfaces, classTypeParameters)

        if (idl.isClassSubkind(clazz.decl)) {
            this.printDefaultExport(clazz.decl, printer)
        }
    }
    protected printDefaultExport(decl: idl.IDLInterface, writer: LanguageWriter): void {}
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
        if (peerGeneratorConfiguration().handwrittenDeserializers.find(
            name => name == idl.getFQName(decl))) {
            this.collector.addFeature("extractors", this.library.layout.handwrittenPackage())
        }
    }

    override printImports() {
        // collect imports
        this.collectImports(this.collector)

        // common runtime dependencies
        this.collector.addFeatures([
            'Finalizable',
            'RuntimeType',
            'SerializerBase',
            'DeserializerBase',
            'toPeerPtr',
            'KPointer',
        ], '@koalaui/interop')
        this.collector.addFeatures(['MaterializedBase'], '@koalaui/interop')
        if (allowsOverloads(this.library.language)) {
            this.collector.addFeatures(['MaterializedBaseTag'], '@koalaui/interop')
        }
        this.collector.addFeatures(['unsafeCast'], '@koalaui/common')
        this.collector.addFeatures(['int32', 'int64', 'float32'], '@koalaui/common')
        this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        if (this.library.language === Language.ARKTS) {
            this.collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        }
        if (this.library.language === Language.TS) {
            this.collector.addFeatures(['isInstanceOf', 'runtimeType'], '@koalaui/interop')
        }

        const hookMethods = peerGeneratorConfiguration().hooks.get(this.clazz.className)
        const handwrittenPackage = this.library.layout.handwrittenPackage()
        if (hookMethods) {
            for (const [methodName, hook] of hookMethods.entries()) {
                const hookName = hook ? hook.hookName : `hook${this.clazz.className}${capitalize(methodName)}`
                this.collector.addFeature(hookName, handwrittenPackage)
            }
        }
        // specific runtime dependencies
        collectDeclItself(this.library, idl.createReferenceType(`${PACKAGE_IDLIZE_INTERNAL}.${NativeModule.Generated.name}`), this.collector)
        if (this.library.name === 'arkoala') {
            this.collector.addFeatures(['CallbackTransformer'], './CallbackTransformer')
            if (this.library.language === Language.TS) {
                this.collector.addFeatures(['GestureName', 'GestureComponent'], './framework/shared/generated-utils')
            }
        }
    }

    protected override printDefaultExport(decl: idl.IDLInterface, writer: LanguageWriter): void {
        if (idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.DefaultExport)) {
            writer.writeLines([
                `export default ${decl.name}`
            ])
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
        return {
            generate: () => {
                this.printMaterializedClass(this.clazz)
                return { content: this.printer, imports: this.collector }
            },
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE,
            },
            weight: this.calcClassWeight()
        }
    }
}

class ArkTSMaterializedFileVisitor extends TSMaterializedFileVisitor {
    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }
}

class CJMaterializedFileVisitor extends MaterializedFileVisitorBase {
    override printImports(): void { }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    override printOverloads(clazz: MaterializedClass, filter: MethodFilter) {
        for (let method of clazz.methods.filter(filter)) {
            let methodCopy = copyMethod(method.method, {})
            if (!methodCopy.modifiers?.includes(MethodModifier.PRIVATE) &&
                !methodCopy.modifiers?.includes(MethodModifier.PUBLIC)) {
                methodCopy.modifiers!.push(MethodModifier.PUBLIC)
            }
            this.printer.writeMethodImplementation(methodCopy, (writer) => {
                this.overloadsPrinter.printPeerCallAndReturn(clazz.getImplementationName(), methodCopy, method)
            })
        }
    }

    override mangle(className: string): string {
        return this.namespacePrefix.concat(className)
    }
    override get namespacePrefix(): string {
        return idl.getNamespaceName(this.clazz.decl)
    }
    // we cant use open methods inside class constructor
    override printFieldsInitialization(clazz: MaterializedClass) { }

    visit(): PrinterResult {
        return {
            generate: () => {
                this.printMaterializedClass(this.clazz)
                return { content: this.printer, imports: this.collector }
            },
            over: {
                node: this.clazz.decl,
                role: LayoutNodeRole.INTERFACE
            }
        }
    }
}

class KotlinMaterializedFileVisitor extends MaterializedFileVisitorBase {
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
        if (peerGeneratorConfiguration().handwrittenDeserializers.find(
            name => name == idl.getFQName(decl))) {
            this.collector.addFeature("extractors", this.library.layout.handwrittenPackage())
        }
        // specific runtime dependencies
        collectDeclItself(this.library, idl.createReferenceType(`${PACKAGE_IDLIZE_INTERNAL}.${NativeModule.Generated.name}`), this.collector)
    }

    override printImports() {
        // collect imports
        this.collectImports(this.collector)

        // common runtime dependencies
        this.collector.addFeatures([
            "Finalizable",
            "RuntimeType",
            "SerializerBase",
            "DeserializerBase",
            "toPeerPtr",
            "KPointer",
            "KNativePointer",
            "MaterializedBase",
            "MaterializedBaseTag",
            "NativeBuffer",
            "Promise",
        ], "koalaui.interop")
        this.collector.addFeature("Instant", "kotlin.time")

        const hookMethods = peerGeneratorConfiguration().hooks.get(this.clazz.className)
        const handwrittenPackage = this.library.layout.handwrittenPackage()
        if (hookMethods) {
            for (const [methodName, hook] of hookMethods.entries()) {
                const hookName = hook ? hook.hookName : `hook${this.clazz.className}${capitalize(methodName)}`
                this.collector.addFeature(hookName, handwrittenPackage)
            }
        }
    }

    convertToPropertyType(field: MaterializedField): IDLType {
        return maybeOptional(field.field.type, field.isNullableOriginalTypeField)
    }

    override mangle(className: string): string {
        return className
    }

    override get namespacePrefix(): string {
        return idl.getNamespaceName(this.clazz.decl)
    }

    printOverloads(clazz: MaterializedClass, filter: MethodFilter) {
        for (const grouped of groupOverloads(clazz.methods.filter(filter), this.library.language)) {
            this.overloadsPrinter.printGroupedComponentOverloads(clazz.getImplementationName(), grouped, clazz.decl)
        }
    }

    override printFieldsInitialization(clazz: MaterializedClass) {
        // initialization not needed, because getters are defined
    }

    visit(): PrinterResult {
        return {
            generate: () => {
                this.printMaterializedClass(this.clazz)
                return { content: this.printer, imports: this.collector }
            },
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

function isSuperClassMaterialized(library: PeerLibrary, superClass?: idl.IDLReferenceType): boolean {
    if (!superClass) return false
    const superClassDecl = library.resolveTypeReference(superClass)
    return superClassDecl ? idl.isInterface(superClassDecl) && isMaterialized(superClassDecl, library) : false
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
