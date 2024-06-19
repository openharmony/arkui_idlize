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

import * as ts from "typescript"
import {
    asString,
    capitalize,
    identName,
    nameOrNull,
    serializerBaseMethods,
    className,
    isDefined,
    isStatic,
    throwException,
    getComment,
    isReadonly,
    getDeclarationsByNode,
} from "../util"
import { GenericVisitor } from "../options"
import {
    ArgConvertor, RetConvertor,
} from "./Convertors"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { DeclarationTable, PrimitiveType } from "./DeclarationTable"
import {
    singleParentDeclaration,
} from "./inheritance"
import { PeerClass } from "./PeerClass"
import { PeerMethod } from "./PeerMethod"
import { PeerFile, EnumEntity } from "./PeerFile"
import { PeerLibrary } from "./PeerLibrary"
import { MaterializedClass, MaterializedField, MaterializedMethod, isMaterialized } from "./Materialized"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature, Type } from "./LanguageWriters";
import { mapType } from "./TypeNodeNameConvertor";
import { convertDeclaration, convertTypeNode } from "./TypeNodeConvertor";
import { DeclarationDependenciesCollector, TypeDependenciesCollector } from "./dependencies_collector";
import { convertDeclToFeature } from "./ImportsCollector";
import { isFakeDeclaration, makeFakeTypeAliasDeclaration } from "./fake_declaration";

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


export interface TypeAndName {
    type: ts.TypeNode
    name: string
    optional: boolean
}

export type PeerGeneratorVisitorOptions = {
    sourceFile: ts.SourceFile
    typeChecker: ts.TypeChecker
    declarationTable: DeclarationTable,
    peerLibrary: PeerLibrary
}

export class ComponentDeclaration {
    constructor(
        public readonly name: string,
        public readonly interfaceDeclaration: ts.InterfaceDeclaration | undefined,
        public readonly attributesDeclarations: ts.ClassDeclaration,
    ) {}
}

function isSubclass(typeChecker: ts.TypeChecker, node: ts.ClassDeclaration, maybeParent: ts.ClassDeclaration): boolean {
    const heritageParentType = node.heritageClauses?.[0].types[0].expression
    const heritageDeclarations = heritageParentType ? getDeclarationsByNode(typeChecker, heritageParentType) : []
    return heritageDeclarations.some(it => {
        if (it === maybeParent)
            return true
        if (ts.isClassDeclaration(it))
            return isSubclass(typeChecker, it, maybeParent)
        return false
    })
}

function isSubclassComponent(typeChecker: ts.TypeChecker, a: ComponentDeclaration, b: ComponentDeclaration) {
    return isSubclass(typeChecker, a.attributesDeclarations, b.attributesDeclarations)
}

export class PeerGeneratorVisitor implements GenericVisitor<void> {
    private readonly sourceFile: ts.SourceFile
    declarationTable: DeclarationTable

    static readonly serializerBaseMethods = serializerBaseMethods()
    readonly typeChecker: ts.TypeChecker

    readonly peerLibrary: PeerLibrary
    readonly peerFile: PeerFile

    constructor(options: PeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.typeChecker = options.typeChecker
        this.declarationTable = options.declarationTable
        this.peerFile = new PeerFile(this.sourceFile.fileName, this.declarationTable)
        this.peerLibrary = options.peerLibrary
        this.peerLibrary.files.push(this.peerFile)
    }

    requestType(name: string | undefined, type: ts.TypeNode) {
        this.declarationTable.requestType(name, type)
    }

    visitWholeFile(): void {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
    }

    visit(node: ts.Node) {
        if (ts.isVariableStatement(node)) {
            this.processVariableStatement(node)
        } else if (ts.isModuleDeclaration(node)) {
            if (node.body && ts.isModuleBlock(node.body)) {
                node.body.statements.forEach(it => this.visit(it))
            }
        } else if (ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isVariableStatement(node) ||
            ts.isExportDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            ts.isEmptyStatement(node) ||
            ts.isImportDeclaration(node) ||
            node.kind == ts.SyntaxKind.EndOfFileToken) {
            // Do nothing.
        } else {
            throw new Error(`Unknown node: ${node.kind}`)
        }
    }

    private processVariableStatement(node: ts.VariableStatement) {
        node.declarationList.declarations.forEach(variable => {
            const interfaceDecl = this.maybeTypeReferenceToDeclaration(variable.type)
            if (!interfaceDecl || !ts.isInterfaceDeclaration(interfaceDecl))
                return
            const attributesDecl = this.interfaceToComponentAttributes(interfaceDecl)
            if (attributesDecl) {
                if (this.peerLibrary.isComponentDeclaration(interfaceDecl) ||
                    this.peerLibrary.isComponentDeclaration(attributesDecl))
                    throw new Error("Component is already defined")
                const componentName = identName(variable.name)!
                if (PeerGeneratorConfig.ignoreComponents.includes(componentName))
                    return
                this.peerLibrary.componentsDeclarations.push(new ComponentDeclaration(
                    componentName,
                    interfaceDecl,
                    attributesDecl,
                ))
            }
        })
    }

    private maybeTypeReferenceToDeclaration(node: ts.TypeNode | undefined): ts.Declaration | undefined {
        if (!node || !ts.isTypeReferenceNode(node))
            return undefined
        return getDeclarationsByNode(this.typeChecker, node.typeName)?.[0]
    }

    private interfaceToComponentAttributes(node: ts.InterfaceDeclaration | undefined): ts.ClassDeclaration | undefined {
        if (!node) 
            return undefined
        const members = node.members.filter(it => !ts.isConstructSignatureDeclaration(it))
        if (!members.length || !members.every(it => ts.isCallSignatureDeclaration(it)))
            return undefined
        const callable = members[0] as ts.CallSignatureDeclaration
        const retDecl = this.maybeTypeReferenceToDeclaration(callable.type)
        const isSameReturnType = (node: ts.TypeElement): boolean => {
            if (!ts.isCallSignatureDeclaration(node)) 
                throw "Expected to be a call signature"
            const otherRetDecl = this.maybeTypeReferenceToDeclaration(node.type)
            return otherRetDecl === retDecl
        }

        if (!retDecl || !ts.isClassDeclaration(retDecl) || !members.every(isSameReturnType))
            return undefined

        return retDecl
    }

    private processCustomComponent(node: ts.ClassDeclaration) {
        const methods = node.members
            .filter(it => ts.isMethodDeclaration(it) || ts.isMethodSignature(it))
            .map(it => it.getText().replace(/;\s*$/g, ''))
            .map(it => `${it} { throw new Error("not implemented"); }`)
        this.peerLibrary.customComponentMethods.push(...methods)
    }
}

function tempExtractParameters(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration): ts.ParameterDeclaration[] {
    if (!ts.isCallSignatureDeclaration(method) && identName(method.name) === "onWillScroll") {
        /**
         * ScrollableCommonMethod has a method `onWillScroll(handler: Optional<OnWillScrollCallback>): T;`
         * ScrollAttribute extends ScrollableCommonMethod and overrides this method as
         * `onWillScroll(handler: ScrollOnWillScrollCallback): ScrollAttribute;`. So that override is not
         * valid and cannot be correctly processed and we want to stub this for now.
         */
        return [{
            ...ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                "stub_for_onWillScroll",
                undefined,
                {
                    ...ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    getText: () => "any"
                },
            ),
            getText: () => "stub_for_onWillScroll: any",
        }]
    }
    return Array.from(method.parameters)
}

function generateSignature(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration): NamedMethodSignature {
    const parameters = tempExtractParameters(method)
    const returnName = identName(method.type)!
    const returnType = returnName === "void" ? Type.Void
        : isStatic(method.modifiers) ? new Type(returnName) : Type.This
    return new NamedMethodSignature(returnType,
        parameters
            .map(it => new Type(mapType(it.type), it.questionToken != undefined)),
        parameters
            .map(it => identName(it.name)!),
    )
}

function generateArgConvertor(table: DeclarationTable, param: ts.ParameterDeclaration): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    let paramName = asString(param.name)
    let optional = param.questionToken !== undefined
    table.requestType(undefined, param.type)
    return table.typeConvertor(paramName, param.type, optional)
}

function generateRetConvertor(typeNode?: ts.TypeNode): RetConvertor {
    let nativeType = typeNode ? mapCInteropRetType(typeNode) : "void"
    let isVoid = nativeType == "void"
    return {
        isVoid: isVoid,
        nativeType: () => nativeType,
        macroSuffixPart: () => isVoid ? "V" : ""
    }
}

function mapCInteropRetType(type: ts.TypeNode): string {
    if (type.kind == ts.SyntaxKind.VoidKeyword) {
        return `void`
    }
    if (type.kind == ts.SyntaxKind.NumberKeyword) {
        return PrimitiveType.Int32.getText()
    }
    if (type.kind == ts.SyntaxKind.BooleanKeyword) {
        return PrimitiveType.Boolean.getText()
    }
    if (ts.isTypeReferenceNode(type)) {
        let name = identName(type.typeName)!
        /* HACK, fix */
        if (name.endsWith("Attribute")) return "void"
        switch (name) {
            /* ANOTHER HACK, fix */
            case "T": return "void"
            case "UIContext": return PrimitiveType.NativePointer.getText()
            default: return PrimitiveType.NativePointer.getText()
        }
    }
    if (type.kind == ts.SyntaxKind.StringKeyword) {
        /* HACK, fix */
        // return `KStringPtr`
        return "void"
    }
    if (ts.isUnionTypeNode(type)) {
        console.log(`WARNING: unhandled union type: ${type.getText()}`)
        // TODO: not really properly supported.
        if (type.types[0].kind == ts.SyntaxKind.VoidKeyword) return "void"
        if (type.types.length == 2) {
            if (type.types[1].kind == ts.SyntaxKind.UndefinedKeyword) return `void`
            if (ts.isLiteralTypeNode(type.types[1]) && type.types[1].literal.kind == ts.SyntaxKind.NullKeyword) {
                // NavPathStack | null
                return mapCInteropRetType(type.types[0])
            }
        }
    }
    if (ts.isArrayTypeNode(type)) {
        /* HACK, fix */
        // return array by some way
        return "void"
    }
    throw new Error(type.getText())
}


class ImportsAggregateCollector extends TypeDependenciesCollector {
    constructor(
        private readonly peerLibrary: PeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(peerLibrary.declarationTable.typeChecker!)
    }

    override convertImport(node: ts.ImportTypeNode): ts.Declaration[] {
        const generatedName = mapType(node)
        if (!this.peerLibrary.importTypesStubToSource.has(generatedName)) {
            this.peerLibrary.importTypesStubToSource.set(generatedName, node.getText())
        }
        return [
            ...super.convertImport(node),
            makeFakeTypeAliasDeclaration(
                'FakeDeclarations', 
                generatedName, 
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            ),
        ]
    }

    override convertTypeReference(node: ts.TypeReferenceNode): ts.Declaration[] {
        const declarations = super.convertTypeReference(node)
        const result = [...declarations]
        for (const decl of declarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && ts.isTypeAliasDeclaration(decl)) {
                result.push(...this.convert(decl.type))
            }
        }
        return result
    }
}

class FilteredDeclarationCollector extends DeclarationDependenciesCollector {
    constructor(
        private readonly library: PeerLibrary,
        typeDepsCollector: TypeDependenciesCollector,
    ) {
        super(library.declarationTable.typeChecker!, typeDepsCollector)
    }

    protected override convertHeritageClause(clause: ts.HeritageClause): ts.Declaration[] {
        const parent = clause.parent
        if (ts.isClassDeclaration(parent) && this.library.isComponentDeclaration(parent)) {
            return []
        }
        return super.convertHeritageClause(clause)
    }    
}

class ComponentsCompleter {
    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private componentNameByClass(node: ts.ClassDeclaration): string {
        return node.name!.text
    }

    public process(): void {
        for (let i = 0; i < this.library.componentsDeclarations.length; i++) {
            const attributes = this.library.componentsDeclarations[i].attributesDeclarations
            if ((attributes.heritageClauses?.length ?? 0) > 1)
                throw new Error("Expected component attributes to have single heritage clause at most")
            const heritage = attributes.heritageClauses?.[0] 
            if (!heritage)
                continue
            const parentDecls = getDeclarationsByNode(this.library.declarationTable.typeChecker!, heritage.types[0].expression)
                // to resolve a problem with duplicate CommonMethod interface in koala fakes
                .filter(it => ts.isClassDeclaration(it))
            if (parentDecls.length !== 1)
                throw new Error("Expected parent to have single declaration")
            const parentDecl = parentDecls[0]
            if (!ts.isClassDeclaration(parentDecl))
                throw new Error("Expected parent to be a class")
            if (!this.library.isComponentDeclaration(parentDecl)) {
                this.library.componentsDeclarations.push(new ComponentDeclaration(
                    this.componentNameByClass(parentDecl),
                    undefined,
                    parentDecl,
                ))
            }
        }
        // topological sort
        const components = this.library.componentsDeclarations
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                if (isSubclassComponent(this.library.declarationTable.typeChecker!, components[i], components[j])) {
                    components.splice(i, 0, ...components.splice(j, 1))
                    i--
                    break
                }
            }
        }
    }
}

class PeersGenerator {
    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private get declarationTable(): DeclarationTable {
        return this.library.declarationTable
    }

    private extractMethods(node: ts.ClassDeclaration | ts.InterfaceDeclaration): (ts.MethodDeclaration | ts.CallSignatureDeclaration)[] {
        return (node.members as ts.NodeArray<ts.Node>).filter(
            it => (ts.isMethodDeclaration(it) || ts.isCallSignatureDeclaration(it))
        ) as (ts.MethodDeclaration | ts.CallSignatureDeclaration)[]
    }

    private processMethodOrCallable(
        method: ts.MethodDeclaration | ts.CallSignatureDeclaration,
        peer: PeerClass,
        parentName?: string
    ): PeerMethod | undefined {
        const isCallSignature = ts.isCallSignatureDeclaration(method)
        // Some method have other parents as part of their names
        // Such as the ones coming from thr friend interfaces
        // E.g. ButtonInterface instead of ButtonAttribute
        const originalParentName = parentName ?? peer.originalClassName!
        const methodName = isCallSignature ? `_set${peer.componentName}Options` : identName(method.name)!

        if (PeerGeneratorConfig.ignorePeerMethod.includes(methodName)) return

        this.declarationTable.setCurrentContext(`${originalParentName}.${methodName}()`)

        // TODO: fix this ugly code to prevent method args aliases name collisions.
        let methodIndex = 0, index = 0
        let clazz = method.parent
        if (ts.isClassDeclaration(clazz) || ts.isInterfaceDeclaration(clazz)) {
            clazz.members.forEach(it => {
                if (((ts.isMethodDeclaration(it) && identName(it.name) == methodName) || ts.isCallSignatureDeclaration(it))) {
                    if (method == it) methodIndex = index
                    index++
                }
            })
        }

        const parameters = tempExtractParameters(method)
        parameters.forEach((param, index) => {
            if (param.type) {
                this.declarationTable.requestType(
                    `Type_${originalParentName}_${methodName}${methodIndex == 0 ? "" : methodIndex.toString()}_Arg${index}`, 
                    param.type
                )
            }
        })
        const argConvertors = parameters
            .map((param) => generateArgConvertor(this.declarationTable, param))
        const declarationTargets = parameters
            .map((param) => this.declarationTable.toTarget(param.type ??
                throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
        const retConvertor = generateRetConvertor(method.type)

        // TODO: restore collapsing logic!
        const signature = /* collapsed?.signature ?? */ generateSignature(method)

        const peerMethod = new PeerMethod(
            originalParentName,
            declarationTargets,
            argConvertors,
            retConvertor,
            isCallSignature,
            false,
            new Method(methodName, signature, isStatic(method.modifiers) ? [MethodModifier.STATIC] : []),
        )
        this.declarationTable.setCurrentContext(undefined)
        return peerMethod
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration, peer: PeerClass): void {
        if (PeerGeneratorConfig.invalidAttributes.includes(peer.componentName)) {
            return
        }
        const seenAttributes = new Set<string>()
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(seenAttributes, child, peer)
            }
        })
    }

    private processOptionAttribute(seenAttributes: Set<string>, method: ts.MethodDeclaration | ts.MethodSignature, peer: PeerClass): void {
        const methodName = method.name.getText()
        if (seenAttributes.has(methodName)) {
            console.log(`WARNING: ignore seen method: ${methodName}`)
            return
        }
        const parameters = tempExtractParameters(method)
        if (parameters.length != 1) {
            // We only convert one argument methods to attributes.
            return
        }
        seenAttributes.add(methodName)
        const type = this.argumentType(methodName, parameters, peer)
        peer.attributesFields.push(`${methodName}?: ${type}`)
    }

    private argumentType(methodName: string, parameters: ts.ParameterDeclaration[], peer: PeerClass): string {
        const argumentTypeName = capitalize(methodName) + "ValuesType"
        if (parameters.length === 1 && ts.isTypeLiteralNode(parameters[0].type!)) {
            const typeLiteralStatements = parameters[0].type!.members
                .map(it => {
                    // TODO: properly support IndexSignature
                    if (ts.isIndexSignatureDeclaration(it)) {
                        return {
                            name: "indexed",
                            type: it.type,
                            questionToken: !!it.questionToken
                        }
                    }
                    if (!ts.isPropertySignature(it)) {
                        throw new Error(`Expected type literal property to be ts.PropertySignature, not ${asString(it)} got "${it.getText()}"`)
                    }
                    return {
                        name: asString(it.name),
                        type: it.type!,
                        questionToken: !!it.questionToken
                    }
                })

            peer.attributesTypes.push(
                this.createParameterType(argumentTypeName, typeLiteralStatements)
            )
            return argumentTypeName
        }
        if (parameters.length > 2) {
            const attributeInterfaceStatements = parameters.map(it => ({
                name: asString(it.name),
                type: it.type!,
                questionToken: !!it.questionToken
            }))
            peer.attributesTypes.push(
                this.createParameterType(argumentTypeName, attributeInterfaceStatements)
            )
            return argumentTypeName
        }

        return parameters.map(it => mapType(it.type)).join(', ')
    }

    private createParameterType(
        name: string,
        attributes: { name: string, type: ts.TypeNode, questionToken: boolean }[]
    ): string {
        const attributeDeclarations = attributes
            .map(it => `\n  ${it.name}${it.questionToken ? "?" : ""}: ${mapType(it.type)}`)
            .join('')
        return `export interface ${name} {${attributeDeclarations}\n}`
    }

    private fillInterface(peer: PeerClass, node: ts.InterfaceDeclaration) {
        peer.originalInterfaceName = identName(node.name)!
        const tsMethods = this.extractMethods(node)
        const peerMethods = tsMethods
            .filter(it => ts.isCallSignatureDeclaration(it))
            .map(it => this.processMethodOrCallable(it, peer, identName(node)!))
            .filter(isDefined)
        PeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)
    }

    private fillClass(peer: PeerClass, node: ts.ClassDeclaration) {
        peer.originalClassName = className(node)
        peer.hasGenericType = (node.typeParameters?.length ?? 0) > 0
        const parent = singleParentDeclaration(this.declarationTable.typeChecker!, node) as ts.ClassDeclaration
        if (parent) {
            const parentComponent = this.library.findComponentByDeclaration(parent)!
            peer.originalParentName = className(parent)
            peer.originalParentFilename = parent.getSourceFile().fileName
            peer.parentComponentName = parentComponent.name
        }

        const peerMethods = this.extractMethods(node)
            .map(it => this.processMethodOrCallable(it, peer))
            .filter(isDefined)
        PeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)

        this.createComponentAttributesDeclaration(node, peer)
    }

    public generatePeer(component: ComponentDeclaration): void {
        const sourceFile = component.attributesDeclarations.parent
        if (!ts.isSourceFile(sourceFile))
            throw new Error("Expected parent of attributes to be a SourceFile")
        const file = this.library.findFileByOriginalFilename(sourceFile.fileName)
        if (!file)
            throw new Error("Not found a file corresponding to attributes class")
        const peer = new PeerClass(file, component.name, sourceFile.fileName, this.declarationTable)
        if (component.interfaceDeclaration)
            this.fillInterface(peer, component.interfaceDeclaration)
        this.fillClass(peer, component.attributesDeclarations)
        file.peers.set(component.name, peer)
    }
}

export class PeerProcessor {
    private readonly typeDependenciesCollector: TypeDependenciesCollector
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    private readonly serializeDepsCollector: DeclarationDependenciesCollector

    constructor(
        private readonly library: PeerLibrary,
        private readonly componentsToGenerate?: Set<string>,
    ) { 
        this.typeDependenciesCollector = new ImportsAggregateCollector(this.library, false)
        this.declDependenciesCollector = new FilteredDeclarationCollector(this.library, this.typeDependenciesCollector)
        this.serializeDepsCollector = new FilteredDeclarationCollector(
            this.library, new ImportsAggregateCollector(this.library, true))
    }
    private get declarationTable(): DeclarationTable {
        return this.library.declarationTable
    }

    private processMaterializedClass(target: ts.ClassDeclaration) {
        let className = nameOrNull(target.name)!
        if (this.library.materializedClasses.has(className)) {
            return
        }

        const importFeatures = this.serializeDepsCollector.convert(target)
            .filter(it => this.isSourceDecl(it))
            .filter(it => PeerGeneratorConfig.needInterfaces || isFakeDeclaration(it))
            .map(it => convertDeclToFeature(this.library, it))
        let constructor = target.members.find(ts.isConstructorDeclaration)!
        let mConstructor = this.makeMaterializedMethod(className, constructor)
        const finalizerReturnType = {isVoid: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => ""}
        let mFinalizer = new MaterializedMethod(className, [], [], finalizerReturnType, false,
            new Method("getFinalizer", new NamedMethodSignature(Type.Pointer, [], [], []), [MethodModifier.STATIC]))
        let mFields = target.members
            .filter(ts.isPropertyDeclaration)
            .map(it => this.makeMaterializedField(it))
        let mMethods = target.members
            .filter(ts.isMethodDeclaration)
            .map(method => this.makeMaterializedMethod(className, method))
        this.library.materializedClasses.set(className,
            new MaterializedClass(className, mFields, mConstructor, mFinalizer, importFeatures, mMethods))
    }

    private makeMaterializedField(property: ts.PropertyDeclaration): MaterializedField {
        const name = identName(property.name)!
        const declarationTarget = this.declarationTable.toTarget(property.type!)
        const argConvertor = this.declarationTable.typeConvertor(name, property.type!)
        const retConvertor = generateRetConvertor(property.type!)
        const modifiers = isReadonly(property.modifiers) ? [FieldModifier.READONLY] : []
        return new MaterializedField(declarationTarget, argConvertor, retConvertor,
            new Field(name, new Type(identName(property.type)!), modifiers))
    }

    private makeMaterializedMethod(parentName: string, method: ts.ConstructorDeclaration | ts.MethodDeclaration) {
        this.declarationTable.setCurrentContext(`materialized_${identName(method.name)}`)
        const declarationTargets = method.parameters.map(param =>
            this.declarationTable.toTarget(param.type ??
                throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.declarationTable, param))
        const retConvertor = ts.isConstructorDeclaration(method)
            ? { isVoid: false, isStruct: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => "" }
            : generateRetConvertor(method.type)
        const signature = generateSignature(method)
        const methodName = ts.isConstructorDeclaration(method) ? "ctor" : identName(method.name)!
        const modifiers = ts.isConstructorDeclaration(method) || isStatic(method.modifiers) ? [MethodModifier.STATIC] : []
        this.declarationTable.setCurrentContext(undefined)
        return new MaterializedMethod(parentName, declarationTargets, argConvertors, retConvertor, false,
            new Method(methodName, signature, modifiers))
    }

    private collectDepsRecursive(node: ts.Declaration | ts.TypeNode, deps: Set<ts.Declaration>): void {
        const currentDeps = ts.isTypeNode(node)
            ? convertTypeNode(this.typeDependenciesCollector, node)
            : convertDeclaration(this.declDependenciesCollector, node)
        for (const dep of currentDeps) {
            if (deps.has(dep)) continue
            if (!this.isSourceDecl(dep)) continue
            deps.add(dep)
            this.collectDepsRecursive(dep, deps)
        }
    }

    private processEnum(node: ts.EnumDeclaration) {
        const file = this.getDeclSourceFile(node)
        let name = node.name.getText()
        let comment = getComment(file, node)
        let enumEntity = new EnumEntity(name, comment)
        node.forEachChild(child => {
            if (ts.isEnumMember(child)) {
                let name = child.name.getText()
                let comment = getComment(file, child)
                enumEntity.pushMember(name, comment, child.initializer?.getText())
            }
        })
        this.library.findFileByOriginalFilename(file.fileName)!.pushEnum(enumEntity)
    }

    private isSourceDecl(node: ts.Declaration): boolean {
        if (isFakeDeclaration(node))
            return true
        if (ts.isModuleBlock(node.parent))
            return this.isSourceDecl(node.parent.parent)
        if (ts.isTypeParameterDeclaration(node))
            return false
        if (!ts.isSourceFile(node.parent))
            throw 'Expected declaration to be at file root'
        return !node.parent.fileName.endsWith('stdlib.d.ts')
    }

    private getDeclSourceFile(node: ts.Declaration): ts.SourceFile {
        if (ts.isModuleBlock(node.parent))
            return this.getDeclSourceFile(node.parent.parent)
        if (!ts.isSourceFile(node.parent))
            throw 'Expected declaration to be at file root'
        return node.parent
    }

    private generateActualComponents(): ComponentDeclaration[] {
        const components = this.library.componentsDeclarations
        if (!this.componentsToGenerate?.size)
            return components
        const entryComponents = components.filter(it => this.componentsToGenerate!.has(it.name))
        return components.filter(component => {
            return entryComponents.includes(component) 
                // entryComponents.some(entryComponent => isSubclassComponent(this.declarationTable.typeChecker!, entryComponent, component))
        })
    }

    private generateDeclarations(): Set<ts.Declaration> {
        const deps = new Set(this.generateActualComponents().flatMap(it => {
            const decls: ts.Declaration[] = [it.attributesDeclarations]
            if (it.interfaceDeclaration)
                decls.push(it.interfaceDeclaration)
            return decls
        }))
        const depsCopy = Array.from(deps)
        for (const dep of depsCopy) {
            this.collectDepsRecursive(dep, deps)
        }
        for (const dep of Array.from(deps)) {
            if (ts.isEnumMember(dep)) {
                deps.add(dep.parent)
                deps.delete(dep)
            }
        }
        for (const dep of Array.from(deps)) {
            if (PeerGeneratorConfig.isConflictedDeclaration(dep)) {
                deps.delete(dep)
                this.library.conflictedDeclarations.add(dep)
            }
        }
        return deps
    }

    process(): void {
        new ComponentsCompleter(this.library).process()
        const peerGenerator = new PeersGenerator(this.library)
        for (const actualComponent of this.generateActualComponents())
            peerGenerator.generatePeer(actualComponent)
        for (const dep of this.generateDeclarations()) {
            if (isFakeDeclaration(dep))
                continue
            const file = this.library.findFileByOriginalFilename(this.getDeclSourceFile(dep).fileName)!
            const isPeerDecl = this.library.isComponentDeclaration(dep)

            if (!isPeerDecl && ts.isClassDeclaration(dep) && isMaterialized(dep)) {
                this.processMaterializedClass(dep)
                continue
            }

            if (ts.isEnumDeclaration(dep)) {
                this.processEnum(dep)
                continue
            }

            this.declDependenciesCollector.convert(dep).forEach(it => {
                if (this.isSourceDecl(it) && (PeerGeneratorConfig.needInterfaces || isFakeDeclaration(it)))
                    file.importFeatures.push(convertDeclToFeature(this.library, it))
            })
            this.serializeDepsCollector.convert(dep).forEach(it => {
                if (this.isSourceDecl(it) && PeerGeneratorConfig.needInterfaces)
                    file.serializeImportFeatures.push(convertDeclToFeature(this.library, it))
            })
            if (PeerGeneratorConfig.needInterfaces) {
                file.declarations.add(dep)
                file.importFeatures.push(convertDeclToFeature(this.library, dep))
            }
        }
    }
}
