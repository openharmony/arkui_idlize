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
import { IDLEntry, IDLReferenceType, IDLType, maybeOptional } from "../../idl"
import { posix as path } from "path"
import {
    capitalize,
    isDefined,
    renameClassToBuilderClass,
    renameClassToMaterialized,
    renameDtsToInterfaces,
    serializerBaseMethods,
    throwException
} from "../../util"
import { GenericVisitor } from "../../options"
import { ArgConvertor, RetConvertor } from "../ArgConvertors"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { IdlPeerClass } from "./IdlPeerClass"
import { IdlPeerMethod } from "./IdlPeerMethod"
import { IdlPeerFile } from "./IdlPeerFile"
import { IdlPeerLibrary } from "./IdlPeerLibrary"
import { MaterializedClass, MaterializedField, MaterializedMethod, SuperElement } from "../Materialized"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { convertDeclaration } from "../LanguageWriters/typeConvertor";
import { DeclarationDependenciesCollector, TypeDependenciesCollector } from "./IdlDependenciesCollector";
import {
    isSyntheticDeclaration,
    makeSyntheticDeclCompletely,
    makeSyntheticTypeAliasDeclaration,
    syntheticDeclarationFilename
} from "./IdlSyntheticDeclarations";
import {
    BuilderClass,
    BuilderField,
    BuilderMethod,
    initCustomBuilderClasses,
    isCustomBuilderClass
} from "../BuilderClass";
import { isRoot } from "../inheritance";
import { ImportFeature } from "../ImportsCollector";
import { DeclarationNameConvertor } from "./IdlNameConvertor";
import { PrimitiveType } from "../ArkPrimitiveType"
import { collapseIdlEventsOverloads } from "../printers/EventsPrinter"
import { convert } from "./common"
import { collectJavaImportsForDeclaration } from "../printers/lang/JavaIdlUtils"
import { collectCJImportsForDeclaration } from "../printers/lang/CJIdlUtils"
import { ARK_CUSTOM_OBJECT, javaCustomTypeMapping } from "../printers/lang/Java"
import { Language } from "../../Language"
import { createInterfaceDeclName } from "../TypeNodeNameConvertor";
import { cjCustomTypeMapping } from "../printers/lang/Cangjie"

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
        public readonly attributeDeclaration: idl.IDLInterface,
    ) {}
}

const PREDEFINED_PACKAGE = 'org.openharmony.idlize.predefined'

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

export class IdlPredefinedGeneratorVisitor implements GenericVisitor<void> {
    readonly peerLibrary: IdlPeerLibrary
    readonly peerFile: IdlPeerFile

    constructor(options: IdlPeerGeneratorVisitorOptions) {
        this.peerLibrary = options.peerLibrary
        this.peerFile = options.peerFile
    }

    static create(options: IdlPeerGeneratorVisitorOptions) {
        return new IdlPredefinedGeneratorVisitor(options)
    }

    visitWholeFile(): void {
        if (this.isPredefinedPackage(this.peerFile)) {
            this.peerFile.entries
                .filter(it => idl.isInterface(it))
                .forEach(it => this.visitPredefinedDeclaration(it as idl.IDLInterface))
        }
    }

    visitPredefinedDeclaration(declaration: idl.IDLInterface) {
        this.peerLibrary.predefinedDeclarations.push(declaration)
    }

    isPredefinedPackage(file:IdlPeerFile): boolean {
        const packageDeclarations = file.entries.filter(entry => idl.isPackage(entry))
        if (packageDeclarations.length !== 1) {
            return false
        }
        const [ pkg ] = packageDeclarations
        let pkgName = pkg.name ?? ''
        if (pkgName.startsWith('"')) {
            pkgName = pkgName.substring(1, pkgName.length - 1)
        }
        return pkgName === PREDEFINED_PACKAGE
    }

}

function generateArgConvertor(library: IdlPeerLibrary, param: idl.IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
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
            case idl.IDLAnyType:
                /* HACK, fix */
                // return `KStringPtr`
                return "void"
            case idl.IDLVoidType:
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
    if (idl.isUnionType(type))
        return PrimitiveType.NativePointer.getText()
    if (idl.isContainerType(type)) {
        if (idl.IDLContainerUtils.isSequence(type)) {
            /* HACK, fix */
            // return array by some way
            return "void"
        } else
            return PrimitiveType.NativePointer.getText()
    }
    throw `mapCInteropType failed for ${idl.IDLKind[type.kind]}`
}


class ImportsAggregateCollector extends TypeDependenciesCollector {
    // TODO: dirty hack, need to rework
    private readonly declarationCollector: FilteredDeclarationCollector

    constructor(
        protected readonly peerLibrary: IdlPeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(peerLibrary)
        this.declarationCollector = new FilteredDeclarationCollector(peerLibrary, this)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const generatedName = this.peerLibrary.mapType(type)
        if (!this.peerLibrary.importTypesStubToSource.has(generatedName)) {
            this.peerLibrary.importTypesStubToSource.set(generatedName, type.name)
        }
        let syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations', generatedName, idl.IDLAnyType)
        return [
            ...super.convertImport(type, importClause),
            syntheticDeclaration
        ]
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        const declarations = super.convertTypeReference(type)
        const syntheticDeclarations = declarations.filter(it => idl.isSyntheticEntry(it))
        const realDeclarations = declarations.filter(it => !idl.isSyntheticEntry(it))

        const result = [...realDeclarations]

        // such declarations are not processed by FilteredDeclarationCollector
        result.push(
            ...syntheticDeclarations.filter(it => idl.isAnonymousInterface(it)),
            ...syntheticDeclarations.flatMap(decl => convert(decl, this, this.declarationCollector))
        )

        for (const decl of realDeclarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && idl.isTypedef(decl))
                result.push(...this.convert(decl.type))
        }
        return result
    }
}

export class FilteredDeclarationCollector extends DeclarationDependenciesCollector {
    constructor(
        private readonly library: IdlPeerLibrary,
        typeDepsCollector: TypeDependenciesCollector,
    ) {
        super(typeDepsCollector)
    }

    protected override convertSupertype(type: idl.IDLType): idl.IDLNode[] {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            return decl && idl.isClass(decl) && this.library.isComponentDeclaration(decl)
                ? []
                : super.convertSupertype(type)
        }
        throw new Error(`Expected reference type, got ${type.kind}`)
    }
}

class ArkTSImportsAggregateCollector extends ImportsAggregateCollector {
    override convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        if (idl.IDLContainerUtils.isSequence(type)) {
        // todo: check this.peerLibrary instanceof IdlPeerLibrary)
            this.peerLibrary.seenArrayTypes.set(this.peerLibrary.getTypeName(type), type)
        }
        return super.convertContainer(type)
    }

    override convertTypeReference(type: IDLReferenceType): idl.IDLNode[] {
        // TODO: Needs to be implemented properly
        // Handling type with the namespace prefix
        const types = type.name.split(".")
        if (types.length > 1) {
            return super.convertTypeReference(idl.createReferenceType(types.slice(-1).join()))
        }
        return super.convertTypeReference(type);
    }
}

class ArkTSDeclarationCollector extends DeclarationDependenciesCollector {
}

////////////////////////////////////////////////////////////////
//                         JAVA                               //
////////////////////////////////////////////////////////////////

class JavaTypeDependenciesCollector extends TypeDependenciesCollector {
    constructor(
        protected readonly library: IdlPeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(library)
    }

    private ignoredTypes: Set<idl.IDLType> = new Set()

    private onNewSyntheticTypeAlias(alias: string, type: idl.IDLType | idl.IDLInterface): void {
        makeSyntheticTypeAliasDeclaration(alias, alias, type)
    }

    private onNewSyntheticInterface(alias: string, superclassName: string): void {
        const superClass = idl.createInterface(
            superclassName ?? '',
            idl.IDLKind.Interface,
            [idl.IDLTopType],
        )
        const superClassType = this.library.addSyntheticInterface(superClass)
        const clazz = idl.createInterface(
            alias,
            idl.IDLKind.Interface,
            [superclassName ? superClassType : idl.IDLTopType],
        )
        const clazzType = this.library.addSyntheticInterface(clazz)
        this.onNewSyntheticTypeAlias(alias, clazzType)
    }

    private addIgnoredType(type: idl.IDLType): void {
        this.ignoredTypes.add(type)
    }

    private ignoredType(type: idl.IDLType): boolean {
        return this.ignoredTypes.has(type)
    }

    override convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        if (!this.ignoredType(type)) {
            const typeName = this.library.mapType(type)
            this.onNewSyntheticTypeAlias(typeName, type)
        }

        return super.convertUnion(type)
    }

    override convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return super.convertContainer(type)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const generatedName = this.library.mapType(type)
        this.onNewSyntheticInterface(generatedName, ARK_CUSTOM_OBJECT)
        return super.convertImport(type, importClause)
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
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
    private productType(type: idl.IDLReferenceType, decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): idl.IDLNode[] {
        // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')

        if (!this.ignoredType(type)) {
            const typeName = this.library.mapType(type)
            this.onNewSyntheticTypeAlias(typeName, type)
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

    convertInterface(decl: idl.IDLInterface): idl.IDLNode[] {
        return super.convertInterface(decl)
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLNode[] {
        if (javaCustomTypeMapping.has(decl.name))
            return []
        return super.convertTypedef(decl)
    }
    convertEnum(decl: idl.IDLEnum): idl.IDLNode[] {
        const enumName = decl.name
        makeSyntheticTypeAliasDeclaration(enumName, enumName, decl)
        return super.convertEnum(decl)
    }

    protected override convertSupertype(type: idl.IDLType): idl.IDLNode[] {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            return decl && idl.isClass(decl) && this.library.isComponentDeclaration(decl)
                ? []
                : super.convertSupertype(type)
        }
        throw new Error(`Expected reference type, got ${type.kind}`)
    }
}


////////////////////////////////////////////////////////////////
//                         CANGJIE                            //
////////////////////////////////////////////////////////////////

class CJDeclarationCollector extends DeclarationDependenciesCollector {
    constructor(
        private readonly library: IdlPeerLibrary,
        typeDepsCollector: TypeDependenciesCollector,
    ) {
        super(typeDepsCollector)
    }

    convertInterface(decl: idl.IDLInterface): idl.IDLNode[] {
        return super.convertInterface(decl)
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLNode[] {
        if (cjCustomTypeMapping.has(decl.name)) {
            return []
        }
        return super.convertTypedef(decl)
    }
    convertEnum(decl: idl.IDLEnum): idl.IDLNode[] {
        const enumName = decl.name
        makeSyntheticTypeAliasDeclaration(enumName, enumName, decl)
        return super.convertEnum(decl)
    }

    protected override convertSupertype(type: idl.IDLType): idl.IDLNode[] {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            return decl && idl.isClass(decl) && this.library.isComponentDeclaration(decl)
                ? []
                : super.convertSupertype(type)
        }
        throw new Error(`Expected reference type, got ${type.kind} ${idl.DebugUtils.debugPrintType(type)}`)
    }
}

class CJTypeDependenciesCollector extends TypeDependenciesCollector {
    constructor(
        protected readonly library: IdlPeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(library)
    }

    private ignoredTypes: Set<idl.IDLType | idl.IDLInterface> = new Set()

    private onNewSyntheticTypeAlias(alias: string, type: idl.IDLType): void {
        makeSyntheticTypeAliasDeclaration(alias, alias, type)
    }

    private onNewSyntheticInterface(alias: string, superclassName: string): void {
        const superClass = idl.createInterface(
            superclassName ?? '',
            idl.IDLKind.Interface,
            [idl.IDLTopType],
        )
        const superClassType = this.library.addSyntheticInterface(superClass)
        const clazz = idl.createInterface(
            alias,
            idl.IDLKind.Interface,
            [superclassName ? superClassType : idl.IDLTopType],
        )
        const clazzType = this.library.addSyntheticInterface(clazz)
        this.onNewSyntheticTypeAlias(alias, clazzType)
    }

    private addIgnoredType(type: idl.IDLType): void {
        this.ignoredTypes.add(type)
    }

    private ignoredType(type: idl.IDLType | idl.IDLInterface): boolean {
        return this.ignoredTypes.has(type)
    }

    override convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        if (!this.ignoredType(type)) {
            const typeName = this.library.mapType(type)
            this.onNewSyntheticTypeAlias(typeName, type)
        }

        return super.convertUnion(type)
    }

    override convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return super.convertContainer(type)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const generatedName = this.library.mapType(type)
        this.onNewSyntheticInterface(generatedName, ARK_CUSTOM_OBJECT)
        return super.convertImport(type, importClause)
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        if (cjCustomTypeMapping.has(type.name)) {
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
    private productType(type: idl.IDLReferenceType, decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): idl.IDLNode[] {
        // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')

        if (!this.ignoredType(decl)) {
            const typeName = this.library.mapType(type)
            const ref = idl.createReferenceType(decl.name)
            this.onNewSyntheticTypeAlias(typeName, ref)
        }

        return decl.properties.flatMap(it => this.convert(it.type))
    }
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
        protected readonly library: IdlPeerLibrary,
        private readonly config: {
            skipAnonymousInterfaces?: boolean,
            skipCallbacks?: boolean,
            skipTuples?: boolean,
        },
    ) {}
    shouldAdd(node: idl.IDLEntry): boolean {
        if (!idl.isSyntheticEntry(node)) return true
        if (this.config.skipAnonymousInterfaces && node.kind == idl.IDLKind.AnonymousInterface) return false
        if (this.config.skipCallbacks && node.kind == idl.IDLKind.Callback) return false
        if (this.config.skipTuples && node.kind == idl.IDLKind.TupleInterface) return false
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

class ComponentsCompleter {
    constructor(
        private readonly library: IdlPeerLibrary,
    ) {}

    public process(): void {
        for (let i = 0; i < this.library.componentsDeclarations.length; i++) {
            const attributes = this.library.componentsDeclarations[i].attributeDeclaration
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
        return this.isSubclass(a.attributeDeclaration, b.attributeDeclaration)
    }

    private isSubclass(component: idl.IDLInterface, maybeParent: idl.IDLInterface): boolean {
        const parentDecl = idl.getSuperType(component)
        return isDefined(parentDecl) && (
            idl.forceAsNamedNode(parentDecl).name === maybeParent.name ||
            idl.isClass(parentDecl) && this.isSubclass(parentDecl, maybeParent))
    }
}

class PeersGenerator {
    constructor(
        private readonly library: IdlPeerLibrary,
    ) {}

    private processProperty(prop: idl.IDLProperty, peer: IdlPeerClass, parentName?: string): IdlPeerMethod | undefined {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(prop.name))
            return
        if (prop.name === "onWillScroll" || prop.name === "onDidScroll") {
            /**
             * ScrollableCommonMethod has a method `onWillScroll(handler: Optional<OnWillScrollCallback>): T;`
             * ScrollAttribute extends ScrollableCommonMethod and overrides this method as
             * `onWillScroll(handler: ScrollOnWillScrollCallback): ScrollAttribute;`. So that override is not
             * valid and cannot be correctly processed and we want to stub this for now.
             */
            prop.type = idl.IDLAnyType
        }
        const decl = this.toDeclaration(prop.type)
        this.library.requestType(prop.type, this.library.shouldGenerateComponent(peer.componentName))
        const originalParentName = parentName ?? peer.originalClassName!
        const argConvertor = this.library.typeConvertor("value", prop.type, prop.isOptional)
        const signature = new NamedMethodSignature(idl.IDLThisType, [maybeOptional(prop.type, prop.isOptional)], ["value"])
        return new IdlPeerMethod(
            originalParentName,
            [decl],
            [argConvertor],
            generateRetConvertor(idl.IDLVoidType),
            false,
            new Method(prop.name, signature, []))
    }

    private processMethodOrCallable(method: idl.IDLMethod | idl.IDLCallable, peer: IdlPeerClass, parentName?: string): IdlPeerMethod | undefined {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(method.name!))
            return
        const isCallSignature = !idl.isMethod(method)
        // Some method have other parents as part of their names
        // Such as the ones coming from the friend interfaces
        // E.g. ButtonInterface instead of ButtonAttribute
        const originalParentName = parentName ?? peer.originalClassName!
        const methodName = isCallSignature ? `set${peer.componentName}Options` : method.name
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
        const declarationTargets = method.parameters.map(param => {
            const decl = this.toDeclaration(param.type ?? throwException(`Expected a type for ${param.name} in ${method.name}`))
            this.library.requestType(param.type!, this.library.shouldGenerateComponent(peer.componentName))
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

    private toDeclaration(type: idl.IDLType): idl.IDLNode {
        if (idl.isReferenceType(type)) {
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
        // const type = this.fixTypeLiteral(propName, property.type, peer)
        peer.attributesFields.push({
            name: propName,
            type: property.type
        })
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
                    peerMethod.method.signature.args = [idl.toIDLType(fixedTypeName)]
                }
                return fixedTypeName
            }
        }
        return this.library.mapType(type)
    }

    private fillInterface(peer: IdlPeerClass, iface: idl.IDLInterface) {
        peer.originalInterfaceName = iface.name
        const peerMethods = iface.callables
            .map(it => this.processMethodOrCallable(it, peer, iface?.name))
            .filter(isDefined)
        const overloadedMethods = IdlPeerMethod.markAndGroupOverloads(peerMethods)
        peer.methods.push(...overloadedMethods)
    }

    private fillClass(peer: IdlPeerClass, clazz: idl.IDLInterface) {
        peer.originalClassName = clazz.name
        const parent = idl.getSuperType(clazz)
        if (parent) {
            const parentComponent = this.library.findComponentByType(parent)!
            const parentDecl = this.library.resolveTypeReference(parent as idl.IDLReferenceType)
            peer.originalParentName = idl.forceAsNamedNode(parent).name
            peer.originalParentFilename = parentDecl?.fileName
            peer.parentComponentName = parentComponent.name
        }
        const peerMethods = [
            ...clazz.properties.map(it => this.processProperty(it, peer)),
            ...clazz.methods.map(it => this.processMethodOrCallable(it, peer)),
            ].filter(isDefined)
        const overloadedMethods = IdlPeerMethod.markAndGroupOverloads(peerMethods)
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
        const peer = new IdlPeerClass(file, component.name, sourceFile)
        if (component.interfaceDeclaration)
            this.fillInterface(peer, component.interfaceDeclaration)
        this.fillClass(peer, component.attributeDeclaration)
        collapseIdlEventsOverloads(this.library, peer)
        file.peers.set(component.name, peer)
    }
}

export class IdlPeerProcessor {
    private readonly typeDependenciesCollector: TypeDependenciesCollector
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    private readonly serializeDepsCollector: DeclarationDependenciesCollector
    private readonly dependencyFilter: DependencyFilter

    constructor(
        private readonly library: IdlPeerLibrary,
    ) {
        this.typeDependenciesCollector = createTypeDependenciesCollector(this.library)
        this.declDependenciesCollector = createDeclDependenciesCollector(this.library, this.typeDependenciesCollector)
        this.serializeDepsCollector = createSerializeDeclDependenciesCollector(this.library)
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
        const importFeatures = this.collectDeclDependencies(target)
        const fields = target.properties.map(it => this.toBuilderField(it))
        const constructors = target.constructors.map(method => this.toBuilderMethod(method, name))
        const methods = this.getBuilderMethods(target)
        if (this.library.language === Language.ARKTS) {
            // this is necessary because getBuilderMethods embeds supertype types
            importFeatures.push(
                ...methods.flatMap(it => [...it.method.signature.args, it.method.signature.returnType])
                    .map(it => convertTypeToFeature(this.library, it))
                    .filter((it) : it is ImportFeature => it !== undefined)
            )
        }
        return new BuilderClass(name, undefined, isIface, undefined, fields, constructors, methods, importFeatures)
    }

    private toBuilderField(prop: idl.IDLProperty): BuilderField {
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new BuilderField(
            new Field(prop.name, idl.maybeOptional(prop.type, prop.isOptional), modifiers),
        )
    }

    private getBuilderMethods(target: idl.IDLInterface, className?: string): BuilderMethod[] {
        return [
            ...target.inheritance
                .filter(idl.isReferenceType)
                .filter(it => {
                    if (!this.library.resolveTypeReference(it))
                        console.log("AAA")
                    return true
                })
                .map(it => this.library.resolveTypeReference(it)!)
                .filter(it => idl.isInterface(it) || idl.isClass(it))
                .flatMap(it => this.getBuilderMethods(it as idl.IDLInterface, target.name)),
            ...target.methods.map(it => this.toBuilderMethod(it, className))]
    }

    private toBuilderMethod(method: idl.IDLConstructor | idl.IDLMethod | undefined,
                            className?: string): BuilderMethod {
        if (!method)
            return new BuilderMethod(new Method("constructor", new NamedMethodSignature(idl.IDLVoidType)))
        const methodName = idl.isConstructor(method) ? "constructor" : method.name
        // const generics = method.typeParameters?.map(it => it.getText())
        const signature = generateSignature(this.library, method, className)
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new BuilderMethod(new Method(methodName, signature, modifiers/*, generics*/))
    }
    private collectDeclDependencies(decl: idl.IDLEntry): ImportFeature[] {
        let importFeatures: ImportFeature[]
        if (this.library.language == Language.JAVA) {
            // TODO: collect imports for Java via serializeDepsCollector
            importFeatures = collectJavaImportsForDeclaration(decl)
        } else if (this.library.language == Language.CJ) {
            importFeatures = collectCJImportsForDeclaration(decl)
        } else if (this.library.language == Language.TS || this.library.language == Language.ARKTS) {
            importFeatures = this.serializeDepsCollector.convert(decl)
                .filter(it => !idl.isEntry(it) || isSourceDecl(it))
                .filter(it => {
                    return PeerGeneratorConfig.needInterfaces
                        || checkTSDeclarationMaterialized(it)
                        || idl.isEntry(it) && isSyntheticDeclaration(it)
                })
                .filter(it => this.dependencyFilter.shouldAdd(it))
                .map(it => convertDeclToFeature(this.library, it))
            // self-interface is not supported ArkTS
            if (idl.isInterface(decl) && this.library.language == Language.ARKTS) {
                importFeatures.push(convertDeclToFeature(this.library,
                    makeSyntheticDeclCompletely(
                        decl,
                        {
                            ...decl,
                            name: createInterfaceDeclName(decl.name),
                            methods: decl.methods.map(method => {
                                return {
                                    ...method,
                                    returnType: getMethodReturnType(this.library.language, method, decl.name),
                                } as idl.IDLMethod
                            }),
                        } as idl.IDLInterface,
                        this.library,
                        this.declDependenciesCollector,
                        'SyntheticDeclarations'
                    )))
            }
        } else {
            throwException(`Unsupported language: ${this.library.language}`)
        }
        return importFeatures
    }

    private processMaterialized(decl: idl.IDLInterface) {
        const name = decl.name
        if (this.library.materializedClasses.has(name)) {
            return
        }

        const superClassType = idl.getSuperType(decl)
        const superClass = superClassType ?
            new SuperElement(
                idl.forceAsNamedNode(superClassType).name,
                idl.getExtAttribute(superClassType, idl.IDLExtendedAttributes.TypeArguments)?.split(","))
            : undefined

        const importFeatures = this.collectDeclDependencies(decl)
        const isDeclInterface = idl.isInterface(decl)
        const generics = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.TypeParameters)?.split(",")

        const constructor = idl.isClass(decl) ? decl.constructors[0] : undefined
        const mConstructor = this.makeMaterializedMethod(decl, constructor)
        const finalizerReturnType = {
            isVoid: false,
            nativeType: () => PrimitiveType.NativePointer.getText(),
            interopType: () => PrimitiveType.NativePointer.getText(),
            macroSuffixPart: () => ""
        }
        const mFinalizer = new MaterializedMethod(name, [], [], finalizerReturnType, false,
            new Method("getFinalizer", new NamedMethodSignature(idl.IDLPointerType, [], [], []), [MethodModifier.STATIC]))
        const mFields = decl.properties
            // TODO what to do with setter accessors? Do we need FieldModifier.WRITEONLY? For now, just skip them
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeMaterializedField(it))
        const mMethods = decl.methods
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeMaterializedMethod(decl, method))
            .filter(it => !idl.isNamedNode(it.method.signature.returnType) || !PeerGeneratorConfig.ignoreReturnTypes.has(it.method.signature.returnType.name))

        mFields.forEach(f => {
            const field = f.field
            const idlType = field.type
            // TBD: use deserializer to get complex type from native
            const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
            if (isSimpleType) {
                const getSignature = new NamedMethodSignature(idlType, [], [])
                const getAccessor = new MaterializedMethod(
                    name, [], [], f.retConvertor, false,
                    new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE]))
                mMethods.push(getAccessor)
            }
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [idlType], [field.name])
                const retConvertor = { isVoid: true, nativeType: () => idl.IDLVoidType.name, macroSuffixPart: () => "V" }
                const setAccessor = new MaterializedMethod(
                    name, [], [f.argConvertor], retConvertor, false,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]))
                mMethods.push(setAccessor)
            }
        })
        this.library.materializedClasses.set(name,
            new MaterializedClass(name, isDeclInterface, superClass, generics,
                mFields, mConstructor, mFinalizer, importFeatures, mMethods))
    }

    private makeMaterializedField(prop: idl.IDLProperty): MaterializedField {
        const argConvertor = this.library.typeConvertor(prop.name, prop.type!)
        const retConvertor = generateRetConvertor(prop.type!)
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new MaterializedField(
            new Field(prop.name, prop.type, modifiers),
            argConvertor, retConvertor, prop.isOptional)
    }

    private makeMaterializedMethod(decl: idl.IDLInterface, method: idl.IDLConstructor | idl.IDLMethod | undefined) {
        const methodName = method === undefined || idl.isConstructor(method) ? "ctor" : method.name
        const retConvertor = method === undefined || idl.isConstructor(method)
            ? {
                isVoid: false,
                isStruct: false,
                nativeType: () => `${decl.name}Peer*`,
                interopType: () => PrimitiveType.NativePointer.getText(),
                macroSuffixPart: () => ""
            }
            : generateRetConvertor(method.returnType)

        if (method === undefined) {
            // interface or class without constructors
            const ctor = new Method("ctor", new NamedMethodSignature(idl.IDLVoidType, [], []), [MethodModifier.STATIC])
            return new MaterializedMethod(decl.name, [], [], retConvertor, false, ctor)
        }

        const generics = undefined // method.typeParameters?.map(it => it.getText())
        method.parameters.forEach(it => this.library.requestType(it.type!, true))
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
        const signature = generateSignature(this.library, method, decl.name)
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new MaterializedMethod(decl.name, [], argConvertors, retConvertor, false,
            new Method(methodName, signature, modifiers, generics)
        )
    }

    private collectDepsRecursive(decl: idl.IDLNode, deps: Set<idl.IDLNode>): void {
        const currentDeps = convert(decl, this.typeDependenciesCollector, this.declDependenciesCollector)
        for (const dep of currentDeps) {
            if (deps.has(dep)) continue
            if (idl.isEntry(dep) && !isSourceDecl(dep)) continue
            deps.add(dep)
            this.collectDepsRecursive(dep, deps)
        }
    }

    private collectDeclarations(): Set<idl.IDLEntry> {
        const ignoredDeclarations = new Set<string>()
        PeerGeneratorConfig.ignoreComponents.forEach(it => {
            ignoredDeclarations.add(it + "Attribute")
            ignoredDeclarations.add(it + "Interface")
        })
        const deps: Set<idl.IDLEntry> = new Set(
            this.library.files
                .flatMap(it => it.entries)
                .filter(it => !idl.isPackage(it) && !idl.isImport(it) && !idl.isModuleType(it))
                .filter(it => !ignoredDeclarations.has(it.name!))
                .filter(it => !this.ignoreDeclaration(it, this.library.language)))
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

        const componentDeclarations = new Set(
            this.library.componentsDeclarations
                .filter(it => it.interfaceDeclaration)
                .filter(it => it.attributeDeclaration.inheritance.length > 0 && !idl.forceAsNamedNode(it.attributeDeclaration.inheritance[0]).name, "CommonShapeMethod")
                .flatMap(it => [it.attributeDeclaration.name, it.interfaceDeclaration!.name]))
        Array.from(deps)
            .filter(it => !componentDeclarations.has(it.name!))
            .forEach(it => this.library.declarations.push(it))
        return deps
    }

    private ignoreDeclaration(decl: idl.IDLEntry, language: Language): boolean {
        return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.GlobalScope) ||
            language === Language.JAVA && idl.isInterface(decl) && isMaterialized(decl) ||
            PeerGeneratorConfig.ignoreEntry(decl.name!, language)
    }

    process(): void {
        initCustomBuilderClasses(this.library)
        new ComponentsCompleter(this.library).process()
        const peerGenerator = new PeersGenerator(this.library)
        for (const component of this.library.componentsDeclarations)
            peerGenerator.generatePeer(component)
        const allDeclarations = this.collectDeclarations()
        for (const dep of allDeclarations) {
            if (isSyntheticDeclaration(dep))
                continue
            const file = this.library.findFileByOriginalFilename(dep.fileName!)
            if (!file) throw new Error(`Cannot find file ${dep.fileName}`)
            const isPeerDecl = idl.isInterface(dep) && this.library.isComponentDeclaration(dep)

            if (!isPeerDecl && (idl.isClass(dep) || idl.isInterface(dep))) {
                if (isBuilderClass(dep)) {
                    this.processBuilder(dep)
                    continue
                } else if (isMaterialized(dep)) {
                    this.processMaterialized(dep)
                    continue
                }
            }

            if (idl.isEnum(dep))
                continue

            this.declDependenciesCollector.convert(dep).forEach(it => {
                // Add a type that is not in the file declaration list
                if (Array.from(file.declarations.values()).find(decl => decl.name === idl.forceAsNamedNode(it).name) === undefined
                    && idl.isEntry(it)
                    && isSourceDecl(it)
                    && (PeerGeneratorConfig.needInterfaces || isSyntheticDeclaration(it))
                    && this.dependencyFilter.shouldAdd(it)) {
                    file.importFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            this.serializeDepsCollector.convert(dep).forEach(it => {
                if (idl.isEntry(it) && isSourceDecl(it)
                    && PeerGeneratorConfig.needInterfaces
                    && this.dependencyFilter.shouldAdd(it)) {
                    file.serializeImportFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            if (PeerGeneratorConfig.needInterfaces && this.dependencyFilter.shouldAdd(dep)) {
                file.declarations.add(dep)
                file.importFeatures.push(convertDeclToFeature(this.library, dep))
            }
        }
    }
}

export function convertDeclToFeature(library: IdlPeerLibrary, node: idl.IDLNode): ImportFeature {
    if (!idl.isEntry(node))
        throw "Expected to have an entry"
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

export function createTypeDependenciesCollector(library: IdlPeerLibrary): TypeDependenciesCollector {
    switch (library.language) {
        case Language.TS: return new ImportsAggregateCollector(library, false)
        case Language.ARKTS: return new ArkTSImportsAggregateCollector(library, true)
        case Language.JAVA: return new JavaTypeDependenciesCollector(library, true)
        case Language.CJ: return new CJTypeDependenciesCollector(library, true)
    }
    // TODO: support other languages
    return new ImportsAggregateCollector(library, false)
}

export function createDeclDependenciesCollector(library: IdlPeerLibrary,
                                                typeDependenciesCollector: TypeDependenciesCollector
): DeclarationDependenciesCollector {
    switch (library.language) {
        case Language.TS: return new FilteredDeclarationCollector(library, typeDependenciesCollector)
        case Language.ARKTS: return new ArkTSDeclarationCollector(typeDependenciesCollector)
        case Language.JAVA: return new JavaDeclarationCollector(library, typeDependenciesCollector)
        case Language.CJ: return new CJDeclarationCollector(library, typeDependenciesCollector)
    }
    // TODO: support other languages
    return new FilteredDeclarationCollector(library, typeDependenciesCollector)
}

function createSerializeDeclDependenciesCollector(library: IdlPeerLibrary): DeclarationDependenciesCollector {
    const expandAliases = true
    switch (library.language) {
        case Language.TS: return new FilteredDeclarationCollector(library, new ImportsAggregateCollector(library, expandAliases))
        case Language.ARKTS: return new ArkTSDeclarationCollector(new ArkTSImportsAggregateCollector(library, expandAliases))
        case Language.JAVA: return new JavaDeclarationCollector(library, new JavaTypeDependenciesCollector(library, expandAliases))
        case Language.CJ: return new CJDeclarationCollector(library, new CJTypeDependenciesCollector(library, expandAliases))
    }
    // TODO: support other languages
    return new FilteredDeclarationCollector(library, new ImportsAggregateCollector(library, expandAliases))
}

export function createDependencyFilter(library: IdlPeerLibrary): DependencyFilter {
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
    // if (idl.isEnum(decl) && decl.name === 'GestureType') return true
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

function getMethodReturnType(language: Language,
                             method: idl.IDLCallable | idl.IDLMethod | idl.IDLConstructor,
                             className?: string): idl.IDLType {
    let returnType: idl.IDLType
    // TODO: Needs to be implemented properly
    // Correct printing of return type name
    if (language === Language.ARKTS) {
        const isRetTypeParam = idl.isTypeParameterType(method.returnType!)
        const isSelfRetType = className !== undefined && idl.isNamedNode(method.returnType!) ? className == method.returnType.name : true
        returnType = idl.isVoidType(method.returnType!) // check
            ? idl.IDLVoidType
            : idl.isConstructor(method) || (!method.isStatic && isSelfRetType || isRetTypeParam) ? idl.IDLThisType : method.returnType!
    } else {
        returnType = (method.returnType && idl.isVoidType(method.returnType)) ? idl.IDLVoidType
            : idl.isConstructor(method) || !method.isStatic ? idl.IDLThisType : method.returnType!
    }
    return returnType
}

function generateSignature(library: IdlPeerLibrary,
                           method: idl.IDLCallable | idl.IDLMethod | idl.IDLConstructor,
                           className?: string): NamedMethodSignature {
    const returnType = getMethodReturnType(library.language, method, className)
    return new NamedMethodSignature(returnType,
        method.parameters.map(it => maybeOptional(it.type!, it.isOptional)),
        method.parameters.map(it => it.name)
    )
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

export function checkTSDeclarationMaterialized(decl: idl.IDLNode): boolean {
    return (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl))
            && isMaterialized(decl)
}

export function convertTypeToFeature(library: IdlPeerLibrary, type: IDLType): ImportFeature | undefined {
    const typeReference = idl.isReferenceType(type)
        ? library.resolveTypeReference(type)
        : undefined
    if (typeReference !== undefined) {
        return convertDeclToFeature(library, typeReference)
    }
    return undefined
}
