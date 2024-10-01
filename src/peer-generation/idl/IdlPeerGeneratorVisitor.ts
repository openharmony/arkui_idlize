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

import * as idl from "../../idl"
import { posix as path } from "path"
import { serializerBaseMethods, isDefined, Language, renameDtsToInterfaces, renameClassToBuilderClass, renameClassToMaterialized, capitalize, throwException } from "../../util"
import { GenericVisitor } from "../../options"
import { ArgConvertor, RetConvertor } from "./IdlArgConvertors"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { IdlPeerClass } from "./IdlPeerClass"
import { IdlPeerMethod } from "./IdlPeerMethod"
import { IdlPeerFile } from "./IdlPeerFile"
import { IdlPeerLibrary, ArkResource, ArkFunction } from "./IdlPeerLibrary"
import { MaterializedClass, MaterializedField, MaterializedMethod, SuperElement } from "../Materialized"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature, Type } from "../LanguageWriters";
import { convertDeclaration, convertType } from "./IdlTypeConvertor";
import { DeclarationDependenciesCollector, TypeDependenciesCollector } from "./IdlDependenciesCollector";
import { addSyntheticDeclarationDependency, isSyntheticDeclaration, makeSyntheticTypeAliasDeclaration, syntheticDeclarationFilename } from "./IdlSyntheticDeclarations";
import { initCustomBuilderClasses, BuilderClass, isCustomBuilderClass, BuilderMethod, BuilderField } from "../BuilderClass";
import { isRoot } from "../inheritance";
import { ImportFeature } from "../ImportsCollector";
import { DeclarationNameConvertor } from "./IdlNameConvertor";
import { PrimitiveType } from "../DeclarationTable"
import { collapseIdlEventsOverloads } from "../printers/EventsPrinter"
import { convert } from "./common"
import { collectJavaImportsForDeclaration } from "../printers/lang/JavaIdlUtils"
import { ARK_CUSTOM_OBJECT, javaCustomTypeMapping } from "../printers/lang/Java"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8,
    MATERIALIZED = 9,
}

/**
 * Theory of operations.
 *
 * We use type definition as "grammar", and perform recursive descent to terminal nodes of such grammar
 * generating serialization code. We use TS typechecker to analyze compound and union types and generate
 * universal finite automata to serialize any value of the given type.
 */

type IdlPeerGeneratorVisitorOptions = {
    sourceFile: string
    peerFile: IdlPeerFile
    peerLibrary: IdlPeerLibrary
}

export class IdlComponentDeclaration {
    constructor(
        public readonly name: string,
        public readonly interfaceDeclaration: idl.IDLInterface | undefined,
        public readonly attributesDeclarations: idl.IDLInterface,
    ) {}
}

export class IdlPeerGeneratorVisitor implements GenericVisitor<void> {
    private readonly sourceFile: string

    static readonly serializerBaseMethods = serializerBaseMethods()

    readonly peerLibrary: IdlPeerLibrary
    readonly peerFile: IdlPeerFile

    constructor(options: IdlPeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.peerLibrary = options.peerLibrary
        this.peerFile = options.peerFile
    }

    visitWholeFile(): void {
        this.peerFile.entries
            .filter(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Component))
            .forEach(it => this.visitComponent(it as idl.IDLInterface))
    }

    visitComponent(component: idl.IDLInterface) {
        const componentName = component.name.replace("Attribute", "")
        if (PeerGeneratorConfig.ignoreComponents.includes(componentName))
            return
        const compInterface = this.peerLibrary.resolveTypeReference(
            idl.createReferenceType(`${componentName}Interface`),
            this.peerFile.entries)
        if (compInterface && idl.isInterface(compInterface)) {
            this.peerLibrary.componentsDeclarations.push(
                new IdlComponentDeclaration(componentName, compInterface, component))
        }
    }
}

function generateArgConvertor(library: IdlPeerLibrary, param: idl.IDLParameter, maybeCallback: boolean): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional, maybeCallback)
}

function generateRetConvertor(type?: idl.IDLType): RetConvertor {
    let nativeType = type ? mapCInteropRetType(type) : "void"
    let isVoid = nativeType == "void"
    return {
        isVoid: isVoid,
        nativeType: () => nativeType,
        macroSuffixPart: () => isVoid ? "V" : ""
    }
}

// TODO convert to convertor ;)
function mapCInteropRetType(type: idl.IDLType): string {
    if (idl.isPrimitiveType(type)) {
        switch (type) {
            case idl.IDLBooleanType: return PrimitiveType.Boolean.getText()
            case idl.IDLNumberType: return PrimitiveType.Int32.getText()
            case idl.IDLStringType:
                /* HACK, fix */
                // return `KStringPtr`
                return "void"
            case idl.IDLVoidType:
            case idl.IDLAnyType:
            case idl.IDLUndefinedType:
                return "void"
        }
    }
    if (idl.isReferenceType(type)) {
        /* HACK, fix */
        if (type.name.endsWith("Attribute"))
            return "void"
        return PrimitiveType.NativePointer.getText()
    }
    if (idl.isTypeParameterType(type))
        /* ANOTHER HACK, fix */
        return "void"
    if (idl.isEnumType(type) || idl.isUnionType(type))
        return PrimitiveType.NativePointer.getText()
    if (idl.isContainerType(type)) {
        if (type.name === "sequence") {
            /* HACK, fix */
            // return array by some way
            return "void"
        } else
            return PrimitiveType.NativePointer.getText()
    }
    throw `mapCInteropType failed for ${idl.IDLKind[type.kind]} ${type.name}`
}


class ImportsAggregateCollector extends TypeDependenciesCollector {
    constructor(
        protected readonly peerLibrary: IdlPeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(peerLibrary)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const generatedName = this.peerLibrary.mapType(type)
        if (!this.peerLibrary.importTypesStubToSource.has(generatedName)) {
            this.peerLibrary.importTypesStubToSource.set(generatedName, type.name)
        }
        let syntheticDeclaration: idl.IDLEntry

        if (type.name === 'Resource') {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations', generatedName, idl.createReferenceType("ArkResource"))
            addSyntheticDeclarationDependency(syntheticDeclaration, {feature: "ArkResource", module: "./shared/ArkResource"})
        } else {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations', generatedName, idl.IDLAnyType)
        }
        return [
            ...super.convertImport(type, importClause),
            syntheticDeclaration
        ]
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const declarations = super.convertTypeReference(type)
        const result = [...declarations]
        for (const decl of declarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && idl.isTypedef(decl))
                result.push(...this.convert(decl.type))
        }
        return result
    }
}

class FilteredDeclarationCollector extends DeclarationDependenciesCollector {
    constructor(
        private readonly library: IdlPeerLibrary,
        typeDepsCollector: TypeDependenciesCollector,
    ) {
        super(typeDepsCollector)
    }

    protected override convertSupertype(type: idl.IDLType): idl.IDLEntry[] {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            return decl && idl.isClass(decl) && this.library.isComponentDeclaration(decl)
                ? []
                : super.convertSupertype(type)
        }
        throw new Error(`Expected reference type, got ${type.kind} ${type.name}`)
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Java
///////////////////////////////////////////////////////////////////////////////////////////////////

class JavaTypeDependenciesCollector extends TypeDependenciesCollector {
    constructor(
        protected readonly library: IdlPeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(library)
    }

    private ignoredTypes: Set<idl.IDLType> = new Set()

    private onNewSyntheticTypeAlias(alias: string, type: idl.IDLType): void {
        makeSyntheticTypeAliasDeclaration(alias, alias, type)
    }

    private onNewSyntheticInterface(alias: string, superclassName: string): void {
        const superClass: idl.IDLInterface = {
            name: superclassName ?? '',
            kind: idl.IDLKind.Interface,
            inheritance: [idl.IDLTopType],
            constructors: [],
            constants: [],
            properties: [],
            methods: [],
            callables: [],
        }
        const clazz: idl.IDLInterface = {
            name: alias,
            kind: idl.IDLKind.Interface,
            inheritance: [superclassName ? superClass : idl.IDLTopType],
            constructors: [],
            constants: [],
            properties: [],
            methods: [],
            callables: [],
        }
        this.onNewSyntheticTypeAlias(alias, clazz)
    }

    private addIgnoredType(type: idl.IDLType): void {
        this.ignoredTypes.add(type)
    }

    private ignoredType(type: idl.IDLType): boolean {
        return this.ignoredTypes.has(type)
    }

    override convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        if (!this.ignoredType(type)) {
            const typeName = this.library.mapType(type)
            this.onNewSyntheticTypeAlias(typeName, type)
        }

        return super.convertUnion(type)
    }

    override convertContainer(type: idl.IDLContainerType): idl.IDLEntry[] {
        return super.convertContainer(type)
    }

    override convertEnum(type: idl.IDLEnumType): idl.IDLEntry[] {
        // TODO: remove prefix after full migration to IDL
        const enumName = `Ark_${type.name}`
        this.onNewSyntheticTypeAlias(enumName, type)

        return super.convertEnum(type)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const generatedName = this.library.mapType(type)
        if (generatedName != 'Resource') {
            this.onNewSyntheticInterface(generatedName, ARK_CUSTOM_OBJECT)
        }

        return super.convertImport(type, importClause)
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        if (javaCustomTypeMapping.has(type.name)) {
            return []
        }

        const decl = this.library.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            /*if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }*/
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(type, decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }

        const declarations = super.convertTypeReference(type)
        const result = [...declarations]
        for (const decl of declarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && idl.isTypedef(decl)) {
                this.addIgnoredType(decl.type)
                result.push(...this.convert(decl.type))
            }
        }
        return result
    }

    // Tuple + ??? AnonymousClass 
    private productType(type: idl.IDLReferenceType, decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): idl.IDLEntry[] {
        // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        
        if (!this.ignoredType(decl)) {
            const typeName = this.library.mapType(type)
            this.onNewSyntheticTypeAlias(typeName, decl)
        }

        return decl.properties.flatMap(it => this.convert(it.type))
    }
}

class JavaDeclarationCollector extends DeclarationDependenciesCollector {
    constructor(
        private readonly library: IdlPeerLibrary,
        typeDepsCollector: TypeDependenciesCollector,
    ) {
        super(typeDepsCollector)
    }

    convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
        return super.convertInterface(decl)
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLEntry[] {
        if (javaCustomTypeMapping.has(decl.name)) {
            throw new Error(`convertTypedef for custom mapped type: ${decl.name}`)
        }
        return super.convertTypedef(decl)
    }

    protected override convertSupertype(type: idl.IDLType): idl.IDLEntry[] {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            return decl && idl.isClass(decl) && this.library.isComponentDeclaration(decl)
                ? []
                : super.convertSupertype(type)
        }
        throw new Error(`Expected reference type, got ${type.kind} ${type.name}`)
    }
}


class ComponentsCompleter {
    constructor(
        private readonly library: IdlPeerLibrary,
    ) {}

    public process(): void {
        for (let i = 0; i < this.library.componentsDeclarations.length; i++) {
            const attributes = this.library.componentsDeclarations[i].attributesDeclarations
            const parent = idl.getSuperType(attributes)
            if (!parent)
                continue
            if (!idl.isReferenceType(parent))
                throw new Error("Expected component parent type to be a reference type")
            const parentDecl = this.library.resolveTypeReference(parent)
            if (!parentDecl || !idl.isClass(parentDecl))
                throw new Error("Expected parent to be a class")
            if (!this.library.isComponentDeclaration(parentDecl)) {
                this.library.componentsDeclarations.push(
                    new IdlComponentDeclaration(parentDecl.name, undefined, parentDecl))
            }
        }
        // topological sort
        const components = this.library.componentsDeclarations
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                if (this.isSubclassComponent(components[i], components[j])) {
                    components.splice(i, 0, ...components.splice(j, 1))
                    i--
                    break
                }
            }
        }
    }

    private isSubclassComponent(a: IdlComponentDeclaration, b: IdlComponentDeclaration) {
        return this.isSubclass(a.attributesDeclarations, b.attributesDeclarations)
    }

    private isSubclass(component: idl.IDLInterface, maybeParent: idl.IDLInterface): boolean {
        const parentDecl = idl.getSuperType(component)
        return isDefined(parentDecl) && (
            parentDecl.name === maybeParent.name ||
            idl.isClass(parentDecl) && this.isSubclass(parentDecl, maybeParent))
    }
}

class PeersGenerator {
    constructor(
        private readonly library: IdlPeerLibrary,
    ) {}

    private processProperty(prop: idl.IDLProperty,
        peer: IdlPeerClass, maybeCallback: boolean, parentName?: string): IdlPeerMethod | undefined
    {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(prop.name))
            return
        if (prop.name === "onWillScroll") {
            /**
             * ScrollableCommonMethod has a method `onWillScroll(handler: Optional<OnWillScrollCallback>): T;`
             * ScrollAttribute extends ScrollableCommonMethod and overrides this method as
             * `onWillScroll(handler: ScrollOnWillScrollCallback): ScrollAttribute;`. So that override is not
             * valid and cannot be correctly processed and we want to stub this for now.
             */
            prop.type = idl.IDLAnyType
        }
        const decl = this.toDeclaration(prop.type)
        this.library.requestType(decl, this.library.shouldGenerateComponent(peer.componentName))
        const originalParentName = parentName ?? peer.originalClassName!
        const argConvertor = this.library.typeConvertor("value", prop.type, prop.isOptional, maybeCallback)
        const argType = new Type(this.library.mapType(prop.type), prop.isOptional)
        const signature = new NamedMethodSignature(Type.This, [argType], ["value"])
        return new IdlPeerMethod(
            originalParentName,
            [decl],
            [argConvertor],
            generateRetConvertor(idl.IDLVoidType),
            false,
            new Method(prop.name, signature, []))
    }

    private processMethodOrCallable(method: idl.IDLMethod | idl.IDLCallable,
        peer: IdlPeerClass, maybeCallback: boolean, parentName?: string): IdlPeerMethod | undefined
    {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(method.name!))
            return
        const isCallSignature = !idl.isMethod(method)
        // Some method have other parents as part of their names
        // Such as the ones coming from the friend interfaces
        // E.g. ButtonInterface instead of ButtonAttribute
        const originalParentName = parentName ?? peer.originalClassName!
        const methodName = isCallSignature ? `set${peer.componentName}Options` : method.name
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param, maybeCallback))
        const declarationTargets = method.parameters.map(param => {
            const decl = this.toDeclaration(param.type ?? throwException(`Expected a type for ${param.name} in ${method.name}`))
            this.library.requestType(decl, this.library.shouldGenerateComponent(peer.componentName))
            return decl
        })
        const signature = generateSignature(this.library, method)
        return new IdlPeerMethod(
            originalParentName,
            declarationTargets,
            argConvertors,
            generateRetConvertor(method.returnType),
            isCallSignature,
            new Method(methodName, signature, method.isStatic ? [MethodModifier.STATIC] : []))
    }

    private toDeclaration(type: idl.IDLType): idl.IDLType {
        if (idl.isReferenceType(type)) {
            if (idl.hasExtAttribute(type, idl.IDLExtendedAttributes.Import)) {
                switch (type.name) {
                    case "Resource": return ArkResource
                    case "Callback": return ArkFunction
                }
            }
            const decl = this.library.resolveTypeReference(type)
            // Currently we're only interested in callbacks for EventsPrinter. In the future, who knows
            if (decl && idl.isCallback(decl))
                return decl
        }
        return type
    }

    private createComponentAttributesDeclaration(clazz: idl.IDLInterface, peer: IdlPeerClass) {
        if (PeerGeneratorConfig.invalidAttributes.includes(peer.componentName)) {
            return
        }
        const seenAttributes = new Set<string>()
        clazz.properties.forEach(prop => {
            this.processOptionAttribute(seenAttributes, prop, peer)
        })
    }

    private processOptionAttribute(seenAttributes: Set<string>, property: idl.IDLProperty, peer: IdlPeerClass) {
        const propName = property.name
        if (seenAttributes.has(propName)) {
            console.log(`WARNING: ignore seen property: ${propName}`)
            return
        }
        seenAttributes.add(propName)
        const type = this.fixTypeLiteral(propName, property.type, peer)
        peer.attributesFields.push(`${propName}?: ${type}`)
    }

    /**
     * Arkts needs a named type as its argument method, not an anonymous type
     * at which producing 'SyntaxError: Invalid Type' error
     */
    private fixTypeLiteral(name: string, type: idl.IDLType, peer: IdlPeerClass): string {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            if (decl && idl.isAnonymousInterface(decl)) {
                const fixedTypeName = capitalize(name) + "ValuesType"
                const attributeDeclarations = decl.properties
                    .map(it => `  ${it.name}${it.isOptional ? "?" : ""}: ${this.library.mapType(it.type)}`)
                    .join('\n')
                peer.attributesTypes.push({
                    typeName: fixedTypeName,
                    content: `export interface ${fixedTypeName} {\n${attributeDeclarations}\n}`})
                const peerMethod = peer.methods.find((method) => method.overloadedName == name)
                if (peerMethod !== undefined) {
                    peerMethod.method.signature.args = [new Type(fixedTypeName)]
                }
                return fixedTypeName
            }
        }
        return this.library.mapType(type)
    }

    private fillInterface(peer: IdlPeerClass, iface: idl.IDLInterface) {
        peer.originalInterfaceName = iface.name
        const peerMethods = iface.callables
            .map(it => this.processMethodOrCallable(it, peer, false, iface?.name))
            .filter(isDefined)
        IdlPeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)
    }

    private fillClass(peer: IdlPeerClass, clazz: idl.IDLInterface) {
        peer.originalClassName = clazz.name
        const parent = idl.getSuperType(clazz)
        if (parent) {
            const parentComponent = this.library.findComponentByType(parent)!
            const parentDecl = this.library.resolveTypeReference(parent as idl.IDLReferenceType)
            peer.originalParentName = parent.name
            peer.originalParentFilename = parentDecl?.fileName
            peer.parentComponentName = parentComponent.name
        }
        const maybeCallback = isCommonMethodOrSubclass(this.library, clazz)
        const peerMethods = [
            ...clazz.properties.map(it => this.processProperty(it, peer, maybeCallback)),
            ...clazz.methods.map(it => this.processMethodOrCallable(it, peer, maybeCallback)),
            ].filter(isDefined)
        IdlPeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)

        this.createComponentAttributesDeclaration(clazz, peer)
    }

    public generatePeer(component: IdlComponentDeclaration): void {
        const sourceFile = component.attributesDeclarations.fileName
        if (!sourceFile)
            throw new Error("Expected parent of attributes to be a SourceFile")
        const file = this.library.findFileByOriginalFilename(sourceFile)
        if (!file)
            throw new Error("Not found a file corresponding to attributes class")
        const peer = new IdlPeerClass(file, component.name, sourceFile)
        if (component.interfaceDeclaration)
            this.fillInterface(peer, component.interfaceDeclaration)
        this.fillClass(peer, component.attributesDeclarations)
        collapseIdlEventsOverloads(this.library, peer)
        file.peers.set(component.name, peer)
    }
}

export class IdlPeerProcessor {
    private readonly typeDependenciesCollector: TypeDependenciesCollector
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    private readonly serializeDepsCollector: DeclarationDependenciesCollector

    constructor(
        private readonly library: IdlPeerLibrary,
    ) {
        this.typeDependenciesCollector = createTypeDependenciesCollector(this.library)
        this.declDependenciesCollector = createDeclDependenciesCollector(this.library, this.typeDependenciesCollector)
        this.serializeDepsCollector = createSerializeDeclDependenciesCollector(this.library)
    }

    private processBuilder(target: idl.IDLInterface, isActualDeclaration: boolean) {
        let name = target.name!
        if (this.library.builderClasses.has(name)) {
            return
        }

        if (isCustomBuilderClass(name)) {
            return
        }

        const builderClass = this.toBuilderClass(name, target, isActualDeclaration)
        this.library.builderClasses.set(name, builderClass)
    }

    private toBuilderClass(name: string, target: idl.IDLInterface, needBeGenerated: boolean) {
        const isIface = idl.isInterface(target)
        const fields = target.properties.map(it => this.toBuilderField(it))
        const constructors = target.constructors.map(method => this.toBuilderMethod(method))
        const methods = this.getBuilderMethods(target)
        return new BuilderClass(name, undefined, isIface, undefined, fields, constructors, methods, [], needBeGenerated)
    }

    private toBuilderField(prop: idl.IDLProperty): BuilderField {
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new BuilderField(
            new Field(prop.name, new Type(this.library.mapType(prop.type), prop.isOptional), modifiers),
            PrimitiveType.Boolean) // sorry, don't really need this param but still have to provide something
    }

    private getBuilderMethods(target: idl.IDLInterface): BuilderMethod[] {
        return [
            ...target.inheritance
                .filter(idl.isReferenceType)
                .map(it => this.library.resolveTypeReference(it)!)
                .filter(it => idl.isInterface(it) || idl.isClass(it))
                .flatMap(it => this.getBuilderMethods(it as idl.IDLInterface)),
            ...target.methods.map(it => this.toBuilderMethod(it))]
    }

    private toBuilderMethod(method: idl.IDLConstructor | idl.IDLMethod | undefined): BuilderMethod {
        if (!method)
            return new BuilderMethod(new Method("constructor", new NamedMethodSignature(Type.Void)), [])
        const methodName = idl.isConstructor(method) ? "constructor" : method.name
        // const generics = method.typeParameters?.map(it => it.getText())
        const signature = generateSignature(this.library, method)
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new BuilderMethod(new Method(methodName, signature, modifiers/*, generics*/), [])
    }

    private processMaterialized(decl: idl.IDLInterface, isActualDeclaration: boolean) {
        const name = decl.name
        if (this.library.materializedClasses.has(name)) {
            return
        }

        const superClassType = idl.getSuperType(decl)
        const superClass = superClassType ?
            new SuperElement(
                superClassType.name,
                idl.getExtAttribute(superClassType, idl.IDLExtendedAttributes.TypeArguments)?.split(","))
            : undefined

        // TODO: collect imports for Java via serializeDepsCollector
        const importFeatures = this.library.language == Language.JAVA ? collectJavaImportsForDeclaration(decl)
            : this.serializeDepsCollector.convert(decl)
            .filter(it => isSourceDecl(it))
            .filter(it => PeerGeneratorConfig.needInterfaces || checkTSDeclarationMaterialized(it) || isSyntheticDeclaration(it))
            .map(it => convertDeclToFeature(this.library, it))
        const generics = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.TypeParameters)?.split(",")

        const constructor = idl.isClass(decl) ? decl.constructors[0] : undefined
        const mConstructor = this.makeMaterializedMethod(decl, constructor, isActualDeclaration)
        const finalizerReturnType = {isVoid: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => ""}
        const mFinalizer = new MaterializedMethod(name, [], [], finalizerReturnType, false,
            new Method("getFinalizer", new NamedMethodSignature(Type.Pointer, [], [], []), [MethodModifier.STATIC]), 0)
        const mFields = decl.properties
            // TODO what to do with setter accessors? Do we need FieldModifier.WRITEONLY? For now, just skip them
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeMaterializedField(it))
        const mMethods = decl.methods
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeMaterializedMethod(decl, method, isActualDeclaration))
            .filter(it => !PeerGeneratorConfig.ignoreReturnTypes.has(it.method.signature.returnType.name))

        mFields.forEach(f => {
            const field = f.field
            // TBD: use deserializer to get complex type from native
            const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
            if (isSimpleType) {
                const getSignature = new NamedMethodSignature(field.type, [], [])
                const getAccessor = new MaterializedMethod(
                    name, [], [], f.retConvertor, false,
                    new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE]), 0)
                mMethods.push(getAccessor)
            }
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(Type.Void, [field.type], [field.name])
                const retConvertor = { isVoid: true, nativeType: () => Type.Void.name, macroSuffixPart: () => "V" }
                const setAccessor = new MaterializedMethod(
                    name, [], [f.argConvertor], retConvertor, false,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]), 0)
                mMethods.push(setAccessor)
            }
        })
        this.library.materializedClasses.set(name,
            new MaterializedClass(name, idl.isInterface(decl), superClass, generics,
                mFields, mConstructor, mFinalizer, importFeatures, mMethods, isActualDeclaration))
    }

    private makeMaterializedField(prop: idl.IDLProperty): MaterializedField {
        const argConvertor = this.library.typeConvertor(prop.name, prop.type!)
        const retConvertor = generateRetConvertor(prop.type!)
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new MaterializedField(
            new Field(prop.name, new Type(this.library.mapType(prop.type)), modifiers),
            argConvertor, retConvertor)
    }

    private makeMaterializedMethod(decl: idl.IDLInterface, method: idl.IDLConstructor | idl.IDLMethod | undefined, isActualDeclaration: boolean) {
        const methodName = method === undefined || idl.isConstructor(method) ? "ctor" : method.name
        const retConvertor = method === undefined || idl.isConstructor(method)
            ? { isVoid: false, isStruct: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => "" }
            : generateRetConvertor(method.returnType)

        if (method === undefined) {
            // interface or class without constructors
            const ctor = new Method("ctor", new NamedMethodSignature(Type.Void, [], []), [MethodModifier.STATIC])
            return new MaterializedMethod(decl.name, [], [], retConvertor, false, ctor, 0)
        }

        const generics = undefined // method.typeParameters?.map(it => it.getText())
        method.parameters.forEach(it => this.library.requestType(it.type!, isActualDeclaration))
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param, false))
        const signature = generateSignature(this.library, method)
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new MaterializedMethod(decl.name, /*declarationTargets*/ [], argConvertors, retConvertor, false,
            new Method(methodName, signature, modifiers, generics), getMethodIndex(decl, method))
    }

    private collectDepsRecursive(decl: idl.IDLEntry, deps: Set<idl.IDLEntry>): void {
        const currentDeps = convert(decl, this.typeDependenciesCollector, this.declDependenciesCollector)
        for (const dep of currentDeps) {
            if (deps.has(dep)) continue
            if (!isSourceDecl(dep)) continue
            deps.add(dep)
            this.collectDepsRecursive(dep, deps)
        }
    }

    private generateActualComponents(): IdlComponentDeclaration[] {
        const components = this.library.componentsDeclarations
        if (!this.library.componentsToGenerate.size)
            return components
        const entryComponents = components.filter(it => this.library.shouldGenerateComponent(it.name))
        return components.filter(component => entryComponents.includes(component))
    }

    private generateDeclarations(components: IdlComponentDeclaration[]): Set<idl.IDLEntry> {
        const deps: Set<idl.IDLEntry> = new Set(
            components.flatMap(it => {
                const decls = [it.attributesDeclarations]
                if (it.interfaceDeclaration)
                    decls.push(it.interfaceDeclaration)
                return decls
            }))
        const depsCopy = Array.from(deps)
        for (const dep of depsCopy) {
            this.collectDepsRecursive(dep, deps)
        }
        for (const dep of Array.from(deps)) {
            if (idl.isEnumMember(dep)) {
                deps.add(dep.parent)
                deps.delete(dep)
            }
        }
        for (const dep of Array.from(deps)) {
            if (isConflictingDeclaration(dep)) {
                deps.delete(dep)
                this.library.conflictedDeclarations.add(dep)
            }
        }
        return deps
    }

    process(): void {
        initCustomBuilderClasses()
        new ComponentsCompleter(this.library).process()
        const peerGenerator = new PeersGenerator(this.library)
        for (const component of this.library.componentsDeclarations)
            peerGenerator.generatePeer(component)
        const allDeclarations = this.generateDeclarations(this.library.componentsDeclarations)
        const actualDeclarations = this.generateDeclarations(this.generateActualComponents())

        for (const dep of allDeclarations) {
            if (isSyntheticDeclaration(dep))
                continue
            const file = this.library.findFileByOriginalFilename(dep.fileName!)!
            const isPeerDecl = idl.isInterface(dep) && this.library.isComponentDeclaration(dep)
            const isActualDeclaration = actualDeclarations.has(dep)

            if (!isPeerDecl && (idl.isClass(dep) || idl.isInterface(dep))) {
                if (isBuilderClass(dep)) {
                    this.processBuilder(dep, isActualDeclaration)
                    continue
                } else if (isMaterialized(dep)) {
                    this.processMaterialized(dep, isActualDeclaration)
                    continue
                }
            }

            if (!isActualDeclaration || idl.isEnum(dep))
                continue

            this.declDependenciesCollector.convert(dep).forEach(it => {
                if (isSourceDecl(it) &&
                    (PeerGeneratorConfig.needInterfaces || isSyntheticDeclaration(it)) &&
                    needImportFeature(this.library.language, it))
                {
                    file.importFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            this.serializeDepsCollector.convert(dep).forEach(it => {
                if (isSourceDecl(it) &&
                    PeerGeneratorConfig.needInterfaces &&
                    needImportFeature(this.library.language, it))
                {
                    file.serializeImportFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            if (PeerGeneratorConfig.needInterfaces && needImportFeature(this.library.language, dep)) {
                file.declarations.add(dep)
                file.importFeatures.push(convertDeclToFeature(this.library, dep))
            }
        }
    }
}

function needImportFeature(language: Language, decl: idl.IDLEntry): boolean {
    if (language === Language.ARKTS) {
        if (idl.isInterface(decl) && isMaterialized(decl))
            return false
        return idl.isEnum(decl) || idl.isInterface(decl) || idl.isTypedef(decl)
    }
    return true;
}

function convertDeclToFeature(library: IdlPeerLibrary, node: idl.IDLEntry): ImportFeature {
    if (isSyntheticDeclaration(node))
        return {
            feature: convertDeclaration(DeclarationNameConvertor.I, node),
            module: `./${syntheticDeclarationFilename(node)}`
        }
    if (isConflictingDeclaration(node)) {
        // const parent = node.parent
        let feature = /*ts.isModuleBlock(parent)
            ? parent.parent.name.text
            : */convertDeclaration(DeclarationNameConvertor.I, node)
        return {
            feature: feature,
            module: './ConflictedDeclarations'
        }
    }

    const originalBasename = path.basename(node.fileName!)
    let fileName = renameDtsToInterfaces(originalBasename, library.language)
    if ((idl.isInterface(node) || idl.isClass(node)) && !library.isComponentDeclaration(node)) {
        if (isBuilderClass(node)) {
            fileName = renameClassToBuilderClass(node.name, library.language)
        } else if (isMaterialized(node)) {
            fileName = renameClassToMaterialized(node.name, library.language)
        }
    }

    const basename = path.basename(fileName)
    const basenameNoExt = basename.replaceAll(path.extname(basename), '')
    return {
        feature: convertDeclaration(DeclarationNameConvertor.I, node),
        module: `./${basenameNoExt}`,
    }
}

function createTypeDependenciesCollector(library: IdlPeerLibrary): TypeDependenciesCollector {
    if (library.language === Language.TS) {
        return new ImportsAggregateCollector(library, false)
    }
    if (library.language === Language.JAVA) {
        return new JavaTypeDependenciesCollector(library, true)
    }
    // TODO: support other languages
    return new ImportsAggregateCollector(library, false)
}

function createDeclDependenciesCollector(library: IdlPeerLibrary, typeDependenciesCollector: TypeDependenciesCollector): DeclarationDependenciesCollector {
    if (library.language === Language.TS) {
        return new FilteredDeclarationCollector(library, typeDependenciesCollector)
    }
    if (library.language == Language.JAVA) {
        return new JavaDeclarationCollector(library, typeDependenciesCollector)
    }
    // TODO: support other languages
    return new FilteredDeclarationCollector(library, typeDependenciesCollector)
}

function createSerializeDeclDependenciesCollector(library: IdlPeerLibrary): DeclarationDependenciesCollector {
    const expandAliases = true
    if (library.language === Language.TS) {
        return new FilteredDeclarationCollector(library, new ImportsAggregateCollector(library, expandAliases))
    }
    if (library.language == Language.JAVA) {
        return new JavaDeclarationCollector(library, new JavaTypeDependenciesCollector(library, expandAliases))
    }
    // TODO: support other languages
    return new FilteredDeclarationCollector(library, new ImportsAggregateCollector(library, expandAliases))
}


export function isConflictingDeclaration(decl: idl.IDLEntry): boolean {/// stolen from PGConfig
    if (!PeerGeneratorConfig.needInterfaces) return false
    // duplicate type declarations with different signatures
    if (idl.isTypedef(decl) && decl.name === 'OnWillScrollCallback') return true
    // has same named class and interface
    if ((idl.isInterface(decl)) && decl.name === 'LinearGradient') return true
    // just has ugly dependency WrappedBuilder - there is conflict in generic types
    if (idl.isInterface(decl) && decl.name === 'ContentModifier') return true
    // complicated type arguments
    if (idl.isClass(decl) && decl.name === 'TransitionEffect') return true
    // inside namespace
    if (idl.isEnum(decl) && decl.name === 'GestureType') return true
    // no return type in some methods
    if (idl.isInterface(decl) && decl.name === 'LayoutChild') return true
    return false
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

export function isCommonMethodOrSubclass(library: IdlPeerLibrary, decl?: idl.IDLEntry): boolean {
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
    if (isSyntheticDeclaration(node))
        return true
    // if (isModuleType(node.parent))
    //     return this.isSourceDecl(node.parent.parent)
    // if (isTypeParameterType(node))
    //     return false
    // if (!ts.isSourceFile(node.parent))
    //     throw 'Expected declaration to be at file root'
    return !node.fileName?.endsWith('stdlib.d.ts')
}

function generateSignature(library: IdlPeerLibrary, method: idl.IDLCallable | idl.IDLMethod | idl.IDLConstructor): NamedMethodSignature {
    const returnName = method.returnType!.name
    const returnType = idl.isVoidType(method.returnType!) ? Type.Void
        : idl.isConstructor(method) || !method.isStatic ? Type.This : new Type(returnName)
    return new NamedMethodSignature(returnType,
        method.parameters.map(it => new Type(library.mapType(it.type!), it.isOptional)),
        method.parameters.map(it => it.name))
}

function getMethodIndex(clazz: idl.IDLInterface, method: idl.IDLSignature | undefined): number {
    if (!method || !method.name) {
        return 0
    }
    if (idl.isCallable(method))
        return clazz.callables.findIndex(it => it === method)
    else
        return clazz.methods
            .filter(it => it.name === method.name)
            .findIndex(it => method === it)
}

export function isMaterialized(declaration: idl.IDLInterface): boolean {
    if (PeerGeneratorConfig.isMaterializedIgnored(declaration.name))
        return false;
    if (isBuilderClass(declaration))
        return false

    // TODO: parse Builder classes separatly

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    return declaration.methods.length > 0
}

export function checkTSDeclarationMaterialized(decl: idl.IDLEntry): boolean {
    return (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl))
            && isMaterialized(decl)
}
