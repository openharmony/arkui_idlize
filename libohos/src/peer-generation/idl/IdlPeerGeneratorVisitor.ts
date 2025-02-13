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
import {
    capitalize,
    isDefined,
    warn,
    GenericVisitor,
    Language,
    isRoot,
    MethodSignature,
    generatorConfiguration
} from '@idlizer/core'
import { ArgConvertor, PeerLibrary, PeerFile, PeerClass, PeerMethod } from "@idlizer/core"
import { createOutArgConvertor } from "../PromiseConvertors"
import { peerGeneratorConfiguration} from "../PeerGeneratorConfig";
import { getInternalClassName, isBuilderClass, MaterializedClass, MaterializedField, MaterializedMethod } from "@idlizer/core"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { BuilderClass, CUSTOM_BUILDER_CLASSES, isCustomBuilderClass, isMaterialized } from "@idlizer/core";
import { ImportFeature } from "../ImportsCollector"
import { collapseIdlEventsOverloads } from "../printers/EventsPrinter"
import { convertDeclToFeature } from "../ImportsCollectorUtils"
import { collectComponents, findComponentByType, IdlComponentDeclaration, isComponentDeclaration } from "../ComponentsCollector"
import { ReferenceResolver } from "@idlizer/core"
import * as path from "path"

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
        idl.linearizeNamespaceMembers(this.peerFile.entries)
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
        const packageDeclarations = idl.linearizeNamespaceMembers(this.peerFile.entries).filter(entry => idl.isPackage(entry))
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
            idl.linearizeNamespaceMembers(this.peerFile.entries).forEach(predefinedEntry => {
                if (!predefinedEntry.extendedAttributes) {
                    predefinedEntry.extendedAttributes = []
                }
                predefinedEntry.extendedAttributes!.push({ name: idl.IDLExtendedAttributes.Predefined })
                this.peerLibrary.files.forEach(peerLibraryFile => {
                    idl.linearizeNamespaceMembers(peerLibraryFile.entries).filter(libraryEntry => {
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
    return idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Predefined)
}

export function isSystemEntry(entry: idl.IDLEntry) {
    return idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.CPPType)
        || idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.TSType)
        || idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ArkTSType)
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
        if (peerGeneratorConfiguration().ignorePeerMethod.includes(prop.name))
            return
        const originalParentName = parentName ?? peer.originalClassName!
        const argConvertor = this.library.typeConvertor("value", prop.type, prop.isOptional)
        const signature = new NamedMethodSignature(idl.IDLThisType, [idl.maybeOptional(prop.type, prop.isOptional)], ["value"])
        return new PeerMethod(
            originalParentName,
            [argConvertor],
            idl.IDLVoidType,
            false,
            new Method(prop.name, signature, []))
    }

    private processMethodOrCallable(method: idl.IDLMethod | idl.IDLCallable, peer: PeerClass, parentName?: string): PeerMethod | undefined {
        if (peerGeneratorConfiguration().ignorePeerMethod.includes(method.name!))
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
        if (peerGeneratorConfiguration().invalidAttributes.includes(peer.componentName)) {
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

        if (!component.attributeDeclaration.fileName) {
            throw new Error("Expected parent of attributes to be a SourceFile, but fileName is undefined")
        }

        const originalFileName = component.attributeDeclaration.fileName
        const baseName = path.basename(originalFileName)
        const resolvedPath = path.resolve(originalFileName)

        const file = this.library.findFileByOriginalFilename(baseName) ||
                     this.library.findFileByOriginalFilename(resolvedPath)

        if (!file) {
            console.error("Available files in library:", this.library.files.map(f => f.originalFilename))
            throw new Error(`Not found a file corresponding to attributes class: ${baseName} (${resolvedPath})`)
        }

        const peer = new PeerClass(file, component.name, baseName)

        if (component.interfaceDeclaration) {
            this.fillInterface(peer, component.interfaceDeclaration)
        }

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
            method.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional)),
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
        let superType = idl.getSuperType(decl)
        const interfaces: idl.IDLReferenceType[] = []
        const propertiesFromInterface: idl.IDLProperty[] = []
        if (superType) {
            const resolvedType = this.library.resolveTypeReference(superType) as (idl.IDLInterface | undefined)
            if (!resolvedType || !isMaterialized(resolvedType, this.library)) {
                propertiesFromInterface.push(...getUniquePropertiesFromSuperTypes(decl, this.library))
                interfaces.push(superType)
                superType = undefined
            }
        }

        const constructor = decl.subkind === idl.IDLInterfaceSubkind.Class ? decl.constructors[0] : undefined
        const mConstructor = isGlobalScope ? undefined : this.makeMaterializedMethod(decl, constructor, implemenationParentName)
        const mFinalizer = isGlobalScope ? undefined : new MaterializedMethod(name, implemenationParentName,[], idl.IDLPointerType, false,
            new Method("getFinalizer", new NamedMethodSignature(idl.IDLPointerType, [], [], []), [MethodModifier.STATIC]))
        const mFields = propertiesFromInterface.concat(decl.properties)
            // TODO what to do with setter accessors? Do we need FieldModifier.WRITEONLY? For now, just skip them
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeMaterializedField(it))
        const mMethods = decl.methods
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeMaterializedMethod(decl, method, implemenationParentName))
            .filter(it => !idl.isNamedNode(it.method.signature.returnType) || !peerGeneratorConfiguration().ignoreReturnTypes.includes(it.method.signature.returnType.name))

        const taggedMethods = decl.methods.filter(m => m.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.DtsTag))

        mFields.forEach(f => {
            const field = f.field
            const idlType = field.type
            // TBD: use deserializer to get complex type from native
            const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
            const isCallback = idl.isCallback(this.library.toDeclaration(f.argConvertor.idlType))
            if (isSimpleType || isCallback) {
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
            new MaterializedClass(decl, name, isDeclInterface, superType, interfaces, decl.typeParameters,
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
        let returnType: idl.IDLType = idl.createReferenceType(decl)
        let outArgConvertor = undefined
        if (method && !idl.isConstructor(method)) {
            methodName = method.name
            returnType = method.returnType
            outArgConvertor = createOutArgConvertor(this.library, method.returnType, method.parameters.map(it => it.name))
        }
        if (method === undefined) {
            // interface or class without constructors
            const ctor = new Method("ctor", new NamedMethodSignature(idl.createReferenceType(decl.name, undefined, decl), [], []), [MethodModifier.STATIC])
            return new MaterializedMethod(decl.name, implemenationParentName, [], returnType, false, ctor, outArgConvertor)
        }

        const methodTypeParams = idl.getExtAttribute(method, idl.IDLExtendedAttributes.TypeParameters)
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
            peerGeneratorConfiguration().ignoreEntry(decl.name!, language)
    }

    process(): void {
        initCustomBuilderClasses()
        const peerGenerator = new PeersGenerator(this.library)
        for (const component of collectComponents(this.library))
            peerGenerator.generatePeer(component)
        const allDeclarations = this.library.files.flatMap(file => idl.linearizeNamespaceMembers(file.entries))
        const curConfig = generatorConfiguration()
        const curPeerConfig = peerGeneratorConfiguration()
        console.log(curConfig.LibraryPrefix, curPeerConfig.LibraryPrefix)
        
        for (const dep of allDeclarations) {
            if (peerGeneratorConfiguration().ignoreEntry(dep.name, this.library.language) || this.ignoreDeclaration(dep, this.library.language) || idl.isHandwritten(dep))
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
    // if (isNamespace(node.parent))
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
        method.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional)),
        method.parameters.map(it => it.name)
    )
}

export function forEachSuperType(declaration: idl.IDLInterface, resolver: ReferenceResolver, callback: (superType: idl.IDLInterface) => void) {
    if (!idl.hasSuperType(declaration)) return
    const resolvedType = resolver.resolveTypeReference(idl.getSuperType(declaration)!) as (idl.IDLInterface | undefined)
    if (!resolvedType) return

    callback(resolvedType as idl.IDLInterface)
    forEachSuperType(resolvedType as idl.IDLInterface, resolver, callback)
}

export function getUniquePropertiesFromSuperTypes(declaration: idl.IDLInterface, resolver: ReferenceResolver): idl.IDLProperty[] {
    const result: idl.IDLProperty[] = []
    const seenProperties = new Set<string>()
    forEachSuperType(declaration, resolver, (superInterface) => {
        const props = superInterface.properties
        if (props) {
            props.forEach((property) => {
                if (seenProperties.has(property.name)) return
                result.push(property)
                seenProperties.add(property.name)

            })
        }
    })
    return result
}

export function convertTypeToFeature(library: PeerLibrary, type: idl.IDLType): ImportFeature | undefined {
    const typeReference = idl.isReferenceType(type)
        ? library.resolveTypeReference(type)
        : undefined
    if (typeReference !== undefined) {
        return convertDeclToFeature(library, typeReference)
    }
    return undefined
}

function initCustomBuilderClasses() {
    function builderMethod(name: string, type: idl.IDLType): Method {
        return new Method(name, new NamedMethodSignature(idl.IDLThisType, [type], ["value"]))
    }
    const decl = idl.createInterface(
        "Indicator",
        idl.IDLInterfaceSubkind.Class,
        [],
        [idl.createConstructor([], undefined)],
        undefined,
        undefined,
        [
            ...["left", "top", "right", "bottom"].map(it => idl.createMethod(it,
                [idl.createParameter("value", idl.createReferenceType("Length"))],
                idl.IDLThisType,
            )),
            ...["start", "end"].map(it => idl.createMethod(it,
                [idl.createParameter(`value`, idl.createReferenceType("LengthMetrics"))],
                idl.IDLThisType,
            )),
            idl.createMethod(`dot`, [], idl.createReferenceType(`DotIndicator`)),
            idl.createMethod(`digit`, [], idl.createReferenceType(`DigitIndicator`)),
        ]
    )
    CUSTOM_BUILDER_CLASSES.push(
        new BuilderClass(decl, "Indicator", ["T"], false, undefined,
            [], // fields
            [new Method("constructor", new MethodSignature(idl.IDLVoidType, []))],
            [
                ...["left", "top", "right", "bottom"].map(it => builderMethod(it, idl.createReferenceType("Length"))),
                ...["start", "end"].map(it => builderMethod(it, idl.createReferenceType("LengthMetrics"))),
                new Method("dot", new MethodSignature(idl.createReferenceType("DotIndicator"), []), [MethodModifier.STATIC]),
                new Method("digit", new MethodSignature(idl.createReferenceType("DigitIndicator"), []), [MethodModifier.STATIC]),
            ]
        )
    )
}
