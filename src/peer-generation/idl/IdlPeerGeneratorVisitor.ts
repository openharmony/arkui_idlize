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
import {
    getExtAttribute,
    IDLExtendedAttributes,
    IDLReferenceType,
    IDLType,
    maybeOptional
} from "../../idl"
import { posix as path } from "path"
import {
    capitalize,
    isDefined,
    renameClassToBuilderClass,
    renameClassToMaterialized,
    renameDtsToInterfaces,
    serializerBaseMethods,
    throwException,
    warn,
} from "../../util"
import { GenericVisitor } from "../../options"
import { ArgConvertor } from "../ArgConvertors"
import { createOutArgConvertor } from "../PromiseConvertors"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { PeerClass } from "../PeerClass"
import { PeerMethod } from "../PeerMethod"
import { PeerFile } from "../PeerFile"
import { PeerLibrary } from "../PeerLibrary"
import { MaterializedClass, MaterializedField, MaterializedMethod } from "../Materialized"
import { createTypeNameConvertor, Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { convertDeclaration, IdlNameConvertor } from "../LanguageWriters/nameConvertor";
import {
    isSyntheticDeclaration,
    makeSyntheticDeclCompletely,
    makeSyntheticTypeAliasDeclaration,
    syntheticDeclarationFilename
} from "./IdlSyntheticDeclarations";
import { BuilderClass, initCustomBuilderClasses, isCustomBuilderClass } from "../BuilderClass";
import { isRoot } from "../inheritance";
import { ImportFeature } from "../ImportsCollector";
import { createFeatureNameConvertor, DeclarationNameConvertor } from "./IdlNameConvertor";
import { PrimitiveType } from "../ArkPrimitiveType"
import { collapseIdlEventsOverloads } from "../printers/EventsPrinter"
import { collectCJImportsForDeclaration } from "../printers/lang/CJIdlUtils"
import { ARK_CUSTOM_OBJECT, javaCustomTypeMapping } from "../printers/lang/Java"
import { Language } from "../../Language"
import { createInterfaceDeclName } from "../TypeNodeNameConvertor";
import { cjCustomTypeMapping } from "../printers/lang/Cangjie"
import { DependenciesCollector } from "./IdlDependenciesCollector"

/**
 * Theory of operations.
 *
 * We use type definition as "grammar", and perform recursive descent to terminal nodes of such grammar
 * generating serialization code. We use TS typechecker to analyze compound and union types and generate
 * universal finite automata to serialize any value of the given type.
 */

type IdlPeerGeneratorVisitorOptions = {
    sourceFile: string
    peerFile: PeerFile
    peerLibrary: PeerLibrary
}

export class IdlComponentDeclaration {
    constructor(
        public readonly name: string,
        public readonly interfaceDeclaration: idl.IDLInterface | undefined,
        public readonly attributeDeclaration: idl.IDLInterface,
    ) {}
}

const PREDEFINED_PACKAGE = 'org.openharmony.idlize.predefined'
const PREDEFINED_PACKAGE_TYPES = `${PREDEFINED_PACKAGE}.types`

export class IdlPeerGeneratorVisitor implements GenericVisitor<void> {
    private readonly sourceFile: string

    static readonly serializerBaseMethods = serializerBaseMethods()

    readonly peerLibrary: PeerLibrary
    readonly peerFile: PeerFile

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
        if (idl.hasExtAttribute(component, IDLExtendedAttributes.HandWrittenImplementation)) {
                this.peerLibrary.handwritten.push(component)
                return
        }
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
    readonly peerLibrary: PeerLibrary
    readonly peerFile: PeerFile

    private packageName?: string

    private constructor(options: IdlPeerGeneratorVisitorOptions, private mode: 'sys' | 'src') {
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

    static create(options: IdlPeerGeneratorVisitorOptions, mode: 'sys' | 'src') {
        return new IdlPredefinedGeneratorVisitor(options, mode)
    }

    visitWholeFile(): void {
        if (this.mode === 'sys') {
            if (this.isPredefinedPackage(this.peerFile)) {
                this.peerFile.entries
                    .filter(it => idl.isInterface(it))
                    .forEach(it => this.visitPredefinedDeclaration(it as idl.IDLInterface))
            }
        }
        if (this.mode === 'src') {
            if (this.isPredefinedTypesPackage(this.peerFile)) {
                this.peerFile.entries.forEach(it => {
                    if (!it.extendedAttributes) {
                        it.extendedAttributes = []
                    }
                    it.extendedAttributes!.push({
                        name: idl.IDLExtendedAttributes.Namespace,
                        value: 'predefined'
                    })
                })
            }
            this.peerLibrary.files.push(this.peerFile)
        }
    }

    private visitPredefinedDeclaration(declaration: idl.IDLInterface) {
        this.peerLibrary.predefinedDeclarations.push(declaration)
    }

    private isPredefinedPackage(file:PeerFile): boolean {
        return this.packageName === PREDEFINED_PACKAGE
    }

    private isPredefinedTypesPackage(file:PeerFile): boolean {
        return this.packageName === PREDEFINED_PACKAGE_TYPES
    }

}

function generateArgConvertor(library: PeerLibrary, param: idl.IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

class ImportsAggregateCollector extends DependenciesCollector {
    constructor(
        protected readonly peerLibrary: PeerLibrary,
        protected readonly expandAliases: boolean,
    ) {
        super(peerLibrary)
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
            ...syntheticDeclarations.flatMap(decl => this.convert(decl))
        )

        for (const decl of realDeclarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && idl.isTypedef(decl))
                result.push(...this.convert(decl.type))
        }
        return result
    }
}

class TSDependenciesCollector extends ImportsAggregateCollector {
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
    constructor(peerLibrary: PeerLibrary) {
        super(peerLibrary, true)
    }

    override convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        if (idl.IDLContainerUtils.isSequence(type)) {
        // todo: check this.peerLibrary instanceof IdlPeerLibrary)
            this.peerLibrary.seenArrayTypes.set(this.peerLibrary.getInteropName(type), type)
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

////////////////////////////////////////////////////////////////
//                         JAVA                               //
////////////////////////////////////////////////////////////////

class JavaDependenciesCollector extends DependenciesCollector {
    private nameConverter: IdlNameConvertor
    constructor(
        library: PeerLibrary,
        private expandAliases: boolean,
    ) {
        super(library)
        this.nameConverter = createTypeNameConvertor(Language.JAVA, library)
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
        const [superClassType] = this.library.factory.registerInterface(superClass)
        const clazz = idl.createInterface(
            alias,
            idl.IDLKind.Interface,
            [superclassName ? superClassType : idl.IDLTopType],
        )
        const [clazzType] = this.library.factory.registerInterface(clazz)
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
            const typeName = this.nameConverter.convert(type)
            this.onNewSyntheticTypeAlias(typeName, type)
        }

        return super.convertUnion(type)
    }

    override convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return super.convertContainer(type)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const generatedName = this.nameConverter.convert(type)
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
            const typeName = this.nameConverter.convert(type)
            this.onNewSyntheticTypeAlias(typeName, type)
        }

        return decl.properties.flatMap(it => this.convert(it.type))
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

class CJDependenciesCollector extends DependenciesCollector {
    private nameConverter: IdlNameConvertor
    constructor(
        library: PeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(library)
        this.nameConverter = createTypeNameConvertor(Language.CJ, this.library)
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
        const [superClassType] = this.library.factory.registerInterface(superClass)
        const clazz = idl.createInterface(
            alias,
            idl.IDLKind.Interface,
            [superclassName ? superClassType : idl.IDLTopType],
        )
        const [clazzType] = this.library.factory.registerInterface(clazz)
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
            const typeName = this.nameConverter.convert(type)
            this.onNewSyntheticTypeAlias(typeName, type)
        }

        return super.convertUnion(type)
    }

    override convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return super.convertContainer(type)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const generatedName = this.nameConverter.convert(type)
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
            const typeName = this.nameConverter.convert(type)
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
        protected readonly library: PeerLibrary,
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
        private readonly library: PeerLibrary,
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
        private readonly library: PeerLibrary,
    ) {}

    private processProperty(prop: idl.IDLProperty, peer: PeerClass, parentName?: string): PeerMethod | undefined {
        if (PeerGeneratorConfig.ignorePeerMethod.includes(prop.name))
            return
        this.library.requestType(prop.type, this.library.shouldGenerateComponent(peer.componentName))
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
        method.parameters.forEach(param => {
            this.library.requestType(param.type!, this.library.shouldGenerateComponent(peer.componentName))
        })
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

    /**
     * Arkts needs a named type as its argument method, not an anonymous type
     * at which producing 'SyntaxError: Invalid Type' error
     */
    private fixTypeLiteral(name: string, type: idl.IDLType, peer: PeerClass): string {
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
                    peerMethod.method.signature.args = [idl.createReferenceType(fixedTypeName)]
                }
                return fixedTypeName
            }
        }
        return this.library.mapType(type)
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
    private readonly dependenciesCollector: DependenciesCollector
    private readonly serializeDepsCollector: DependenciesCollector
    private readonly dependencyFilter: DependencyFilter

    constructor(
        private readonly library: PeerLibrary,
    ) {
        this.dependenciesCollector = createDependenciesCollector(this.library)
        this.serializeDepsCollector = createDependenciesCollector(library, true)
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
                ...methods.flatMap(it => [...it.signature.args, it.signature.returnType])
                    .map(it => convertTypeToFeature(this.library, it))
                    .filter((it) : it is ImportFeature => it !== undefined)
            )
        }
        return new BuilderClass(name, undefined, isIface, undefined, fields, constructors, methods, importFeatures)
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
                .filter(it => idl.isInterface(it) || idl.isClass(it))
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
    private collectDeclDependencies(decl: idl.IDLEntry): ImportFeature[] {
        let importFeatures: ImportFeature[]
        if (this.library.language === Language.CJ) {
            importFeatures = collectCJImportsForDeclaration(decl)
        } else {
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
                importFeatures.push(this.registerSelfInterface(decl))
            }
        }
        return importFeatures
    }

    private registerSelfInterface(decl: idl.IDLInterface): ImportFeature {
        const inheritance: idl.IDLType[] = []
        const superType = idl.getSuperType(decl)
        if (superType) {
            const resolved = this.library.resolveTypeReference(superType as idl.IDLReferenceType) ?? throwException(`${superType} cannot be resolved`)
            inheritance.push(idl.createReferenceType(createInterfaceDeclName(idl.forceAsNamedNode(resolved).name)))
        }

        const newInterface: idl.IDLInterface = {
            ...decl,
            name: createInterfaceDeclName(decl.name),
            inheritance: inheritance,
            methods: decl.methods.map(method => {
                return {
                    ...method,
                    returnType: method.returnType!,
                } as idl.IDLMethod
            }),
        } as idl.IDLInterface
        this.library.factory.registerInterface(newInterface, newInterface.name)

        return convertDeclToFeature(this.library,
            makeSyntheticDeclCompletely(decl, newInterface, this.library, this.dependenciesCollector, 'SyntheticDeclarations'))
    }

    private processMaterialized(decl: idl.IDLInterface) {
        const name = decl.name
        if (this.library.materializedClasses.has(name)) {
            return
        }

        const importFeatures = this.collectDeclDependencies(decl)
        const isDeclInterface = idl.isInterface(decl)

        const constructor = idl.isClass(decl) ? decl.constructors[0] : undefined
        const mConstructor = this.makeMaterializedMethod(decl, constructor)
        const mFinalizer = new MaterializedMethod(name, [], idl.IDLPointerType, false,
            new Method("getFinalizer", new NamedMethodSignature(idl.IDLPointerType, [], [], []), [MethodModifier.STATIC]))
        const mFields = decl.properties
            // TODO what to do with setter accessors? Do we need FieldModifier.WRITEONLY? For now, just skip them
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeMaterializedField(it))
        const mMethods = decl.methods
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeMaterializedMethod(decl, method))
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
                    name, [], field.type, false,
                    new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE]),
                    f.outArgConvertor)
                mMethods.push(getAccessor)
            }
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [idlType], [field.name])
                const setAccessor = new MaterializedMethod(
                    name, [f.argConvertor], idl.IDLVoidType, false,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]))
                mMethods.push(setAccessor)
            }
        })
        this.library.materializedClasses.set(name,
            new MaterializedClass(name, isDeclInterface, idl.getSuperType(decl), decl.typeParameters,
                mFields, mConstructor, mFinalizer, importFeatures, mMethods, true, taggedMethods))
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

    private makeMaterializedMethod(decl: idl.IDLInterface, method: idl.IDLConstructor | idl.IDLMethod | undefined) {
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
            return new MaterializedMethod(decl.name, [], returnType, false, ctor, outArgConvertor)
        }

        const methodTypeParams = getExtAttribute(method, IDLExtendedAttributes.TypeParameters)
        method.parameters.forEach(it => this.library.requestType(it.type!, true))
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
        const signature = generateSignature(method)
        const modifiers = idl.isConstructor(method) || method.isStatic ? [MethodModifier.STATIC] : []
        return new MaterializedMethod(decl.name, argConvertors, returnType, false,
            new Method(methodName,
                signature,
                modifiers,
                methodTypeParams !== undefined ? [methodTypeParams] : undefined),
            outArgConvertor
        )
    }

    private collectDepsRecursive(decl: idl.IDLNode, deps: Set<idl.IDLNode>): void {
        const currentDeps = this.dependenciesCollector.convert(decl)
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
            idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.TSType) ||
            idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.CPPType) ||
            (language === Language.JAVA && idl.isInterface(decl) && isMaterialized(decl)) ||
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

            if (idl.isEnum(dep)) {
                continue
            }

            this.dependenciesCollector.convert(dep).forEach(it => {
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

export function convertDeclToFeature(library: PeerLibrary, node: idl.IDLNode): ImportFeature {
    const featureNameConvertor = createFeatureNameConvertor(library.language)
    if (!idl.isEntry(node))
        throw "Expected to have an entry"
    if (isSyntheticDeclaration(node))
        return {
            feature: convertDeclaration(featureNameConvertor, node),
            module: `./${syntheticDeclarationFilename(node)}`
        }
    if (isConflictingDeclaration(node)) {
        // const parent = node.parent
        let feature = /*ts.isModuleBlock(parent)
            ? parent.parent.name.text
            : */convertDeclaration(featureNameConvertor, node)
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
        feature: convertDeclaration(featureNameConvertor, node),
        module: `./${basenameNoExt}`,
    }
}

export function createDependenciesCollector(library: PeerLibrary, forceExpandAliaces: boolean = false): DependenciesCollector {
    switch (library.language) {
        case Language.TS: return new TSDependenciesCollector(library, forceExpandAliaces || false)
        case Language.ARKTS: return new ArkTSImportsAggregateCollector(library)
        case Language.JAVA: return new JavaDependenciesCollector(library, true)
        case Language.CJ: return new CJDependenciesCollector(library, true)
    }
    // TODO: support other languages
    return new ImportsAggregateCollector(library, forceExpandAliaces || false)
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


export function isConflictingDeclaration(decl: idl.IDLEntry): boolean {/// stolen from PGConfig
    if (!PeerGeneratorConfig.needInterfaces) return false
    // has same named class and interface
    if ((idl.isInterface(decl) || idl.isClass(decl)) && decl.name === 'LinearGradient') return true
    // just has ugly dependency WrappedBuilder - there is conflict in generic types
    if (idl.isInterface(decl) && decl.name === 'ContentModifier') return true
    // complicated type arguments
    // if (idl.isClass(decl) && decl.name === 'TransitionEffect') return true
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

export function convertTypeToFeature(library: PeerLibrary, type: IDLType): ImportFeature | undefined {
    const typeReference = idl.isReferenceType(type)
        ? library.resolveTypeReference(type)
        : undefined
    if (typeReference !== undefined) {
        return convertDeclToFeature(library, typeReference)
    }
    return undefined
}
