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
import {
    getExtAttribute,
    IDLExtendedAttributes,
    IDLType,
    maybeOptional
} from '@idlize/core/idl'
import {
    capitalize,
    isDefined,
    warn,
    GenericVisitor,
    Language,
    isRoot
} from '@idlize/core'
import { ArgConvertor } from "../ArgConvertors"
import { createOutArgConvertor } from "../PromiseConvertors"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { PeerClass } from "../PeerClass"
import { PeerMethod } from "../PeerMethod"
import { PeerFile } from "../PeerFile"
import { PeerLibrary } from "../PeerLibrary"
import { getInternalClassName, MaterializedClass, MaterializedField, MaterializedMethod } from "../Materialized"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { BuilderClass, initCustomBuilderClasses, isCustomBuilderClass } from "../BuilderClass";
import { ImportFeature } from "../ImportsCollector";
import { collapseIdlEventsOverloads } from "../printers/EventsPrinter"
import { convertDeclToFeature } from "../ImportsCollectorUtils"
import { collectComponents, findComponentByType, IdlComponentDeclaration, isComponentDeclaration } from "../ComponentsCollector"
import { ReferenceResolver } from '../ReferenceResolver'

/**
 * Theory of operations.
 *
 * We use type definition as "grammar", and perform recursive descent to terminal nodes of such grammar
 * generating serialization code. We use TS typechecker to analyze compound and union types and generate
 * universal finite automata to serialize any value of the given type.
 */

interface IdlPeerGeneratorVisitorOptions {
    sourceFile: string
    peerFile: PeerFile
    peerLibrary: PeerLibrary
}

const PREDEFINED_PACKAGE = 'org.openharmony.idlize.predefined'
const PREDEFINED_PACKAGE_TYPES = `${PREDEFINED_PACKAGE}.types`

export class IDLInteropPredefinesVisitor implements GenericVisitor<void> {
    readonly peerLibrary: PeerLibrary
    readonly peerFile: PeerFile

    constructor(options: IdlPeerGeneratorVisitorOptions) {
        this.peerLibrary = options.peerLibrary
        this.peerFile = options.peerFile
    }

    visitWholeFile(): void {
        this.peerFile.entries
            .filter(idl.isInterface)
            .forEach(it => this.peerLibrary.predefinedDeclarations.push(it))
    }
}

export class IDLPredefinesVisitor implements GenericVisitor<void> {
    readonly peerLibrary: PeerLibrary
    readonly peerFile: PeerFile

    private packageName?: string

    constructor(options: IdlPeerGeneratorVisitorOptions) {
        this.peerLibrary = options.peerLibrary
        this.peerFile = options.peerFile
        const packageDeclarations = this.peerFile.entries.filter(entry => idl.isPackage(entry))
        if (packageDeclarations.length === 1) {
            const [ pkg ] = packageDeclarations
            let pkgName = pkg.name ?? ''
            if (pkgName.startsWith('"')) {
                pkgName = pkgName.substring(1, pkgName.length - 1)
            }
            this.packageName = pkgName
        }
    }

    visitWholeFile(): void {
        if (this.isPredefinedTypesPackage()) {
            this.peerFile.entries.forEach(predefinedEntry => {
                if (!predefinedEntry.extendedAttributes) {
                    predefinedEntry.extendedAttributes = []
                }
                predefinedEntry.extendedAttributes!.push({
                    name: idl.IDLExtendedAttributes.Namespace,
                    value: 'predefined'
                })
                this.peerLibrary.files.forEach(peerLibraryFile => {
                    peerLibraryFile.entries.filter(libraryEntry => {
                        if (libraryEntry.name !== predefinedEntry.name)
                            return true
                        if (!idl.isTypedef(libraryEntry))
                            throw "Only typedefs can be replaced!"
                        return false
                    })
                })
            })
        }
        this.peerLibrary.files.push(this.peerFile)
    }

    private isPredefinedTypesPackage(): boolean {
        return this.packageName === PREDEFINED_PACKAGE_TYPES
    }
}

export function isPredefined(entry: idl.IDLEntry) {
    const maybeNamespace = idl.getExtAttribute(entry, idl.IDLExtendedAttributes.Namespace)
    return maybeNamespace === 'predefined'
}

function generateArgConvertor(library: PeerLibrary, param: idl.IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

export interface DependencyFilter {
    shouldAdd(node: idl.IDLNode): boolean
}

class EmptyDependencyFilter implements DependencyFilter {
    shouldAdd(node: idl.IDLEntry): boolean {
        return true
    }
}

class SyntheticDependencyConfigurableFilter implements DependencyFilter {
    constructor(
        protected readonly library: PeerLibrary,
        private readonly config: {
            skipAnonymousInterfaces?: boolean,
            skipCallbacks?: boolean,
            skipTuples?: boolean,
        },
    ) {}
    shouldAdd(node: idl.IDLEntry): boolean {
        if (!idl.isSyntheticEntry(node)) return true
        if (idl.isInterface(node)) {
            if (node.subkind === idl.IDLInterfaceSubkind.AnonymousInterface && this.config.skipAnonymousInterfaces)
                return false
            if (node.subkind === idl.IDLInterfaceSubkind.Tuple && this.config.skipTuples)
                return false
        }
        if (this.config.skipCallbacks && node.kind == idl.IDLKind.Callback) return false
        return true
    }
}

export class ArkTSBuiltTypesDependencyFilter implements DependencyFilter {
    readonly IGNORE_TYPES = [
        "ArrayBuffer",
        "Uint8Array",
        "Uint8ClampedArray"]
    shouldAdd(node: idl.IDLEntry): boolean {
        return !(node.name !== undefined && this.IGNORE_TYPES.includes(node.name));
    }
}

class ArkTSSyntheticDependencyConfigurableFilter extends SyntheticDependencyConfigurableFilter {
    readonly arkTSBuiltTypesFilter = new ArkTSBuiltTypesDependencyFilter()
    shouldAdd(node: idl.IDLEntry): boolean {
        if (!this.arkTSBuiltTypesFilter.shouldAdd(node)) {
            return false
        }
        return super.shouldAdd(node)
    }
}

class PeersGenerator {
    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private processProperty(prop: idl.IDLProperty, peer: PeerClass, parentName?: string): PeerMethod | undefined {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(prop.name))
            return
        const originalParentName = parentName ?? peer.originalClassName!
        const argConvertor = this.library.typeConvertor("value", prop.type, prop.isOptional)
        const signature = new NamedMethodSignature(idl.IDLThisType, [maybeOptional(prop.type, prop.isOptional)], ["value"])
        return new PeerMethod(
            originalParentName,
            [argConvertor],
            idl.IDLVoidType,
            false,
            new Method(prop.name, signature, []))
    }

    private processMethodOrCallable(method: idl.IDLMethod | idl.IDLCallable, peer: PeerClass, parentName?: string): PeerMethod | undefined {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(method.name!))
            return
        // Some method have other parents as part of their names
        // Such as the ones coming from the friend interfaces
        // E.g. ButtonInterface instead of ButtonAttribute
        const isCallSignature = idl.isCallable(method)
        const methodName = isCallSignature ? `set${peer.componentName}Options` : method.name
        const retType = method.returnType!
        const isThisRet = isCallSignature || idl.isNamedNode(retType) && (retType.name === peer.originalClassName || retType.name === "T")
        const originalParentName = parentName ?? peer.originalClassName!
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
        const signature = generateSignature(method, isThisRet ? idl.IDLThisType : retType)
        return new PeerMethod(
            originalParentName,
            argConvertors,
            isThisRet ? idl.IDLVoidType : retType,
            isCallSignature,
            new Method(methodName!, signature, method.isStatic ? [MethodModifier.STATIC] : []),
            createOutArgConvertor(this.library, isThisRet ? idl.IDLVoidType : retType, argConvertors.map(it => it.param)))
    }

    private createComponentAttributesDeclaration(clazz: idl.IDLInterface, peer: PeerClass) {
        if (PeerGeneratorConfig.invalidAttributes.includes(peer.componentName)) {
            return
        }
        const seenAttributes = new Set<string>()
        clazz.properties.forEach(prop => {
            this.processOptionAttribute(seenAttributes, prop, peer)
        })
    }

    private processOptionAttribute(seenAttributes: Set<string>, property: idl.IDLProperty, peer: PeerClass) {
        const propName = property.name
        if (seenAttributes.has(propName)) {
            warn(`ignore seen property: ${propName}`)
            return
        }
        seenAttributes.add(propName)
        // const type = this.fixTypeLiteral(propName, property.type, peer)
        peer.attributesFields.push(property)
    }

    private fillInterface(peer: PeerClass, iface: idl.IDLInterface) {
        peer.originalInterfaceName = iface.name
        const peerMethods = iface.callables
            .map(it => this.processMethodOrCallable(it, peer, iface?.name))
            .filter(isDefined)
        const overloadedMethods = PeerMethod.markAndGroupOverloads(peerMethods)
        peer.methods.push(...overloadedMethods)
    }

    private fillClass(peer: PeerClass, clazz: idl.IDLInterface) {
        peer.originalClassName = clazz.name
        const parent = idl.getSuperType(clazz)
        if (parent) {
            const parentComponent = findComponentByType(this.library, parent)!
            const parentDecl = this.library.resolveTypeReference(parent as idl.IDLReferenceType)
            peer.originalParentName = idl.forceAsNamedNode(parent).name
            peer.originalParentFilename = parentDecl?.fileName
            peer.parentComponentName = parentComponent.name
        }
        const peerMethods = [
            ...clazz.properties.map(it => this.processProperty(it, peer)),
            ...clazz.methods.map(it => this.processMethodOrCallable(it, peer)),
            ].filter(isDefined)
        const overloadedMethods = PeerMethod.markAndGroupOverloads(peerMethods)
        peer.methods.push(...overloadedMethods)

        this.createComponentAttributesDeclaration(clazz, peer)
    }

    public generatePeer(component: IdlComponentDeclaration): void {
        const sourceFile = component.attributeDeclaration.fileName
        if (!sourceFile)
            throw new Error("Expected parent of attributes to be a SourceFile")
        const file = this.library.findFileByOriginalFilename(sourceFile)
        if (!file)
            throw new Error("Not found a file corresponding to attributes class")
        const peer = new PeerClass(file, component.name, sourceFile)
        if (component.interfaceDeclaration)
            this.fillInterface(peer, component.interfaceDeclaration)
        this.fillClass(peer, component.attributeDeclaration)
        collapseIdlEventsOverloads(this.library, peer)
        file.peers.set(component.name, peer)
    }
}

export class IdlPeerProcessor {
    private readonly dependencyFilter: DependencyFilter

    constructor(
        private readonly library: PeerLibrary,
    ) {
        this.dependencyFilter = createDependencyFilter(this.library)
    }

    private processBuilder(target: idl.IDLInterface) {
        let name = target.name!
        if (this.library.builderClasses.has(name)) {
            return
        }

        if (isCustomBuilderClass(name)) {
            return
        }

        const builderClass = this.toBuilderClass(name, target)
        this.library.builderClasses.set(name, builderClass)
    }

    private toBuilderClass(name: string, target: idl.IDLInterface) {
        const isIface = idl.isInterface(target)
        const fields = target.properties.map(it => this.toBuilderField(it))
        const constructors = target.constructors.map(method => this.toBuilderMethod(method, name))
        const methods = this.getBuilderMethods(target)
        return new BuilderClass(target, name, undefined, isIface, undefined, fields, constructors, methods)
    }

    private toBuilderField(prop: idl.IDLProperty): Field {
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new Field(prop.name, idl.maybeOptional(prop.type, prop.isOptional), modifiers)
    }

    private getBuilderMethods(target: idl.IDLInterface, className?: string): Method[] {
        return [
            ...target.inheritance
                .filter(it => it !== idl.IDLTopType)
                .filter(it => {
                    if (!this.library.resolveTypeReference(it))
                        console.log(`Cannot resolve ${it.name}`)
                    return true
                })
                .map(it => this.library.resolveTypeReference(it)!)
                .filter(it => idl.isInterface(it))
                .flatMap(it => this.getBuilderMethods(it as idl.IDLInterface, target.name)),
            ...target.methods.map(it => this.toBuilderMethod(it, className))]
    }

    private toBuilderMethod(method: idl.IDLConstructor | idl.IDLMethod | undefined, className?: string): Method {
        if (!method)
            return new Method("constructor", new NamedMethodSignature(idl.IDLVoidType))
        const methodName = idl.isConstructor(method) ? "constructor" : method.name
        const isStatic = idl.isConstructor(method) || (idl.isMethod(method) && method.isStatic)
        // const generics = method.typeParameters?.map(it => it.getText())
        const signature = new NamedMethodSignature(
            isStatic ? method.returnType! : idl.IDLThisType,
            method.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
            method.parameters.map(it => it.name)
        )
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new Method(methodName, signature, modifiers/*, generics*/)
    }

    private processMaterialized(decl: idl.IDLInterface, isGlobalScope = false) {
        const name = decl.name
        if (this.library.materializedClasses.has(name)) {
            return
        }

        const isDeclInterface = idl.isInterfaceSubkind(decl) && !isGlobalScope
        const implemenationParentName = isDeclInterface ? getInternalClassName(name) : name

        const constructor = decl.subkind === idl.IDLInterfaceSubkind.Class ? decl.constructors[0] : undefined
        const mConstructor = this.makeMaterializedMethod(decl, constructor, implemenationParentName)
        const mFinalizer = new MaterializedMethod(name, implemenationParentName,[], idl.IDLPointerType, false,
            new Method("getFinalizer", new NamedMethodSignature(idl.IDLPointerType, [], [], []), [MethodModifier.STATIC]))
        const mFields = decl.properties
            // TODO what to do with setter accessors? Do we need FieldModifier.WRITEONLY? For now, just skip them
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeMaterializedField(it))
        const mMethods = decl.methods
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeMaterializedMethod(decl, method, implemenationParentName))
            .filter(it => !idl.isNamedNode(it.method.signature.returnType) || !PeerGeneratorConfig.ignoreReturnTypes.has(it.method.signature.returnType.name))

        const taggedMethods = decl.methods.filter(m => m.extendedAttributes?.find(it => it.name === IDLExtendedAttributes.DtsTag))

        mFields.forEach(f => {
            const field = f.field
            const idlType = field.type
            // TBD: use deserializer to get complex type from native
            const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
            if (isSimpleType) {
                const getSignature = new NamedMethodSignature(idlType, [], [])
                const getAccessor = new MaterializedMethod(
                    name, implemenationParentName, [], field.type, false,
                    new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE]),
                    f.outArgConvertor)
                mMethods.push(getAccessor)
            }
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [idlType], [field.name])
                const setAccessor = new MaterializedMethod(
                    name, implemenationParentName, [f.argConvertor], idl.IDLVoidType, false,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]))
                mMethods.push(setAccessor)
            }
        })
        this.library.materializedClasses.set(name,
            new MaterializedClass(decl, name, isDeclInterface, idl.getSuperType(decl), decl.typeParameters,
                mFields, mConstructor, mFinalizer, mMethods, true, taggedMethods))
    }

    private makeMaterializedField(prop: idl.IDLProperty): MaterializedField {
        const argConvertor = this.library.typeConvertor(prop.name, prop.type!)
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new MaterializedField(
            new Field(prop.name, prop.type, modifiers),
            argConvertor,
            createOutArgConvertor(this.library, prop.type, [prop.name]),
            prop.isOptional)
    }

    private makeMaterializedMethod(decl: idl.IDLInterface, method: idl.IDLConstructor | idl.IDLMethod | undefined, implemenationParentName: string) {
        let methodName = "ctor"
        let returnType: IDLType = idl.IDLPointerType
        let outArgConvertor = undefined
        if (method && !idl.isConstructor(method)) {
            methodName = method.name
            returnType = method.returnType
            outArgConvertor = createOutArgConvertor(this.library, method.returnType, method.parameters.map(it => it.name))
        }
        if (method === undefined) {
            // interface or class without constructors
            const ctor = new Method("ctor", new NamedMethodSignature(idl.createReferenceType(decl.name), [], []), [MethodModifier.STATIC])
            return new MaterializedMethod(decl.name, implemenationParentName, [], returnType, false, ctor, outArgConvertor)
        }

        const methodTypeParams = getExtAttribute(method, IDLExtendedAttributes.TypeParameters)
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
        const signature = generateSignature(method)
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new MaterializedMethod(decl.name, implemenationParentName, argConvertors, returnType, false,
            new Method(methodName,
                signature,
                modifiers,
                methodTypeParams !== undefined ? [methodTypeParams] : undefined),
            outArgConvertor
        )
    }

    private processGlobal(decl: idl.IDLInterface) {
        this.processMaterialized(decl, true)
    }

    private ignoreDeclaration(decl: idl.IDLEntry, language: Language): boolean {
        return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.TSType) ||
            idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.CPPType) ||
            PeerGeneratorConfig.ignoreEntry(decl.name!, language)
    }

    process(): void {
        initCustomBuilderClasses(this.library)
        const peerGenerator = new PeersGenerator(this.library)
        for (const component of collectComponents(this.library))
            peerGenerator.generatePeer(component)
        const allDeclarations = this.library.files.flatMap(file => file.entries)
        for (const dep of allDeclarations) {
            if (PeerGeneratorConfig.ignoreEntry(dep.name, this.library.language) || this.ignoreDeclaration(dep, this.library.language) || idl.isHandwritten(dep))
                continue
            if (idl.isInterface(dep) && idl.hasExtAttribute(dep, idl.IDLExtendedAttributes.GlobalScope)) {
                this.library.globalScopeInterfaces.push(dep)
            }
            const isPeerDecl = idl.isInterface(dep) && isComponentDeclaration(this.library, dep)
            if (!isPeerDecl && idl.isInterface(dep) && [idl.IDLInterfaceSubkind.Class, idl.IDLInterfaceSubkind.Interface].includes(dep.subkind)) {
                if (isGlobalScope(dep)) {
                    this.processGlobal(dep)
                    continue
                } else if (isBuilderClass(dep)) {
                    this.processBuilder(dep)
                    continue
                } else if (isMaterialized(dep, this.library)) {
                    this.processMaterialized(dep)
                    continue
                }
            }
        }
    }
}

export function createDependencyFilter(library: PeerLibrary): DependencyFilter {
    switch (library.language) {
        case Language.TS:
            return new SyntheticDependencyConfigurableFilter(library,
                {
                    skipAnonymousInterfaces: true,
                    skipCallbacks: false,
                    skipTuples: false
                })
        case Language.ARKTS:
            return new ArkTSSyntheticDependencyConfigurableFilter(library,
                {
                    skipAnonymousInterfaces: false,
                    skipCallbacks: true,
                    skipTuples: false
                })
        case Language.JAVA: return new EmptyDependencyFilter()
        case Language.CJ: return new EmptyDependencyFilter()
    }
    // TODO: support other languages
    return new EmptyDependencyFilter()
}

export function isGlobalScope(declaration: idl.IDLEntry): boolean {
    return idl.isInterface(declaration) && idl.hasExtAttribute(declaration, idl.IDLExtendedAttributes.GlobalScope)
}

export function isBuilderClass(declaration: idl.IDLInterface): boolean {/// stolen from BUilderClass

    // Builder classes are classes with methods which have only one parameter and return only itself

    const className = declaration.name!

    if (PeerGeneratorConfig.builderClasses.includes(className)) {
        return true
    }

    if (isCustomBuilderClass(className)) {
        return true
    }

    // TBD: update builder class check condition.
    // Only SubTabBarStyle, BottomTabBarStyle, DotIndicator, and DigitIndicator classes
    // are used for now.

    return false

    /*
    if (PeerGeneratorConfig.isStandardNameIgnored(className)) {
        return false
    }

    const methods: (ts.MethodSignature | ts.MethodDeclaration)[] = [
        ...ts.isClassDeclaration(declaration) ? declaration.members.filter(ts.isMethodDeclaration) : [],
    ]

    if (methods.length === 0) {
        return false
    }

    return methods.every(it => it.type && className == it.type.getText() && it.parameters.length === 1)
    */
}

export function isCommonMethodOrSubclass(library: PeerLibrary, decl?: idl.IDLEntry): boolean {
    if (!decl || !idl.isInterface(decl))
        return false
    let isSubclass = isRoot(decl.name)
    const superType = idl.getSuperType(decl)
    if (superType && idl.isReferenceType(superType)) {
        const superDecl = library.resolveTypeReference(superType)
        isSubclass ||= isCommonMethodOrSubclass(library, superDecl)
    }
    return isSubclass
}

export function isSourceDecl(node: idl.IDLEntry): boolean {
    // if (isModuleType(node.parent))
    //     return this.isSourceDecl(node.parent.parent)
    // if (isTypeParameterType(node))
    //     return false
    // if (!ts.isSourceFile(node.parent))
    //     throw 'Expected declaration to be at file root'
    return !node.fileName?.endsWith('stdlib.d.ts')
}

function generateSignature(
    method: idl.IDLCallable | idl.IDLMethod | idl.IDLConstructor,
    returnType?: idl.IDLType
): NamedMethodSignature {
    return new NamedMethodSignature(
        returnType ?? method.returnType!,
        method.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
        method.parameters.map(it => it.name)
    )
}

export function isMaterialized(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    if (PeerGeneratorConfig.isMaterializedIgnored(declaration.name) || idl.isHandwritten(declaration))
        return false
    if (isBuilderClass(declaration))
        return false
    if (declaration.subkind === idl.IDLInterfaceSubkind.AnonymousInterface ||
        declaration.subkind === idl.IDLInterfaceSubkind.Tuple)
        return false

    // TODO: parse Builder classes separatly

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    if (declaration.methods.length > 0) return true

    // Or a class or an interface derived from materialized class
    if (idl.hasSuperType(declaration)) {
        const superType = resolver.resolveTypeReference(idl.getSuperType(declaration)!) as idl.IDLInterface
        if (!superType) {
            console.log(`Unable to resolve ${idl.getSuperType(declaration)!.name} type, consider ${declaration.name} to be not materialized`)
            return false
        }
        return isMaterialized(superType, resolver)
    }
    return false
}

export function convertTypeToFeature(library: PeerLibrary, type: IDLType): ImportFeature | undefined {
    const typeReference = idl.isReferenceType(type)
        ? library.resolveTypeReference(type)
        : undefined
    if (typeReference !== undefined) {
        return convertDeclToFeature(library, typeReference)
    }
    return undefined
}
