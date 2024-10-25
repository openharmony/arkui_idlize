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
    getDeclarationsByNode
} from "../util"
import { GenericVisitor } from "../options"
import { ArgConvertor, RetConvertor } from "./ArgConvertors"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { DeclarationTable } from "./DeclarationTable"
import { PrimitiveType } from "./ArkPrimitiveType"
import {
    singleParentDeclaration,
} from "./inheritance"
import { PeerClass } from "./PeerClass"
import { PeerMethod } from "./PeerMethod"
import { PeerFile, EnumEntity } from "./PeerFile"
import { PeerLibrary } from "./PeerLibrary"
import { MaterializedClass, MaterializedField, MaterializedMethod, extractSuperElement, checkTSDeclarationMaterialized, isMaterialized } from "./Materialized"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "./LanguageWriters";
import {
    ArkTSTypeNodeNameConvertor,
    CJTypeNodeNameConvertor,
    createInterfaceDeclName,
    JavaTypeNodeNameConvertor,
    mapType,
    searchTypeParameters,
    TSTypeNodeNameConvertor,
    TypeNodeNameConvertor
} from "./TypeNodeNameConvertor";
import { convertDeclaration, convertTypeNode } from "./TypeNodeConvertor";
import { DeclarationDependenciesCollector, TypeDependenciesCollector } from "./dependencies_collector";
import { convertDeclToFeature, ImportFeature } from "./ImportsCollector";
import {
    addSyntheticDeclarationDependency,
    ArkTSTypeNodeNameConvertorWithDepsCollector,
    isSyntheticDeclaration,
    makeSyntheticDeclaration,
    makeSyntheticInterfaceDeclaration,
    makeSyntheticTypeAliasDeclaration
} from "./synthetic_declaration";
import {
    CUSTOM_BUILDER_CLASSES,
    initCustomBuilderClasses,
    isBuilderClass,
    isCustomBuilderClass,
    toBuilderClass
} from "./BuilderClass";
import { Lazy, lazy } from "./lazy";
import { Language } from "../Language";
import { getIDLTypeName, IDLPointerType, IDLThisType, IDLVoidType, maybeOptional, toIDLType } from "../idl";

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
        this.peerLibrary = options.peerLibrary
        this.peerFile = new PeerFile(this.sourceFile.fileName, this.declarationTable, this.peerLibrary.componentsToGenerate)
        this.peerLibrary.files.push(this.peerFile)
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
            ts.isExportAssignment(node) ||
            node.kind == ts.SyntaxKind.EndOfFileToken) {
            // Do nothing.
        } else {
            throw new Error(`Unknown node: ${node.kind} ${node.getText()}`)
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

export function generateSignature(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration,
                                  typeNodeConvertor: TypeNodeNameConvertor,
                                  isComponent = true,
                                  genericsSubstitution: Map<string, string> | undefined = undefined): NamedMethodSignature {
    const parameters = tempExtractParameters(method)
    let returnName = method.type ? typeNodeConvertor.convert(method.type) : ""
    const substitutedReturnName = genericsSubstitution?.get(returnName)
    returnName = substitutedReturnName ? substitutedReturnName : returnName

    const parent = method.parent
    const parentName = ts.isClassDeclaration(parent) || ts.isInterfaceDeclaration(parent) ? identName(parent.name) : ""
    const returnType = returnName === "void" || returnName === "" ? IDLVoidType
        : isComponent || (returnName === parentName && !isStatic(method.modifiers)) ? IDLThisType : toIDLType(returnName)
    return new NamedMethodSignature(returnType,
        parameters
            .map(it => maybeOptional(toIDLType(typeNodeConvertor.convert(it.type!)), it.questionToken != undefined)),
        parameters
            .map(it => identName(it.name)!),
    )
}

function generateArgConvertor(table: DeclarationTable,
                              param: ts.ParameterDeclaration,
                              typeNodeNameConvertor: TypeNodeNameConvertor): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    let paramName = asString(param.name)
    let optional = param.questionToken !== undefined
    return table.typeConvertor(paramName, param.type, optional, undefined, typeNodeNameConvertor)
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
        // TODO: return just type of the first elem
        // for the materialized class getter with union type
        return mapCInteropRetType(type.types[0])
    }
    if (ts.isArrayTypeNode(type)) {
        /* HACK, fix */
        // return array by some way
        return "void"
    }
    if (ts.isParenthesizedTypeNode(type)) {
        return mapCInteropRetType(type.type)
    }
    if (ts.isTypeLiteralNode(type)) {
        return "void"
    }
    throw new Error(type.getText())
}


class ImportsAggregateCollector extends TypeDependenciesCollector {
    constructor(
        protected readonly peerLibrary: PeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(peerLibrary.declarationTable.typeChecker!, peerLibrary.declarationTable.language)
    }

    override convertImport(node: ts.ImportTypeNode): ts.Declaration[] {
        const generatedName = mapType(node)
        if (!this.peerLibrary.importTypesStubToSource.has(generatedName)) {
            this.peerLibrary.importTypesStubToSource.set(generatedName, node.getText())
        }
        let syntheticDeclaration: ts.Declaration

        if (node.qualifier?.getText() === 'Resource') {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations',
                generatedName,
                ts.factory.createTypeReferenceNode("ArkResource"),
            )
            addSyntheticDeclarationDependency(syntheticDeclaration, {feature: "ArkResource", module: "./shared/ArkResource"})
        } else {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations',
                generatedName,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            )
        }
        return [
            ...super.convertImport(node),
            syntheticDeclaration
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

export class ArkTSTypeDepsCollector extends ImportsAggregateCollector {
    private readonly typeToStringConvertor = new ArkTSTypeNodeNameConvertor(this.peerLibrary)
    public static readonly SYNTH_TYPE_FILE_NAME = 'SyntheticDeclarations'
    private readonly ALIAS_DECL_LIST = new Set([
        "TextModifier"
    ])
    constructor(
        peerLibrary: PeerLibrary,
        expandAliases: boolean,
        private readonly declDependenciesCollector: Lazy<DeclarationDependenciesCollector>
    ) {
        super(peerLibrary, expandAliases);
    }

    override convertArray(node: ts.ArrayTypeNode): ts.Declaration[] {
        this.peerLibrary.arrayTypeCheckeres.push(this.typeToStringConvertor.convert(node))
        return super.convertArray(node)
    }

    override convertLiteralType(node: ts.LiteralTypeNode): ts.Declaration[] {
        if ((ts.isUnionTypeNode(node.parent)
                || ts.isTypeReferenceNode(node.parent)
                || ts.isTypeAliasDeclaration(node.parent)
                || ts.isParameter(node.parent))
            && ts.isStringLiteral(node.literal)) {
            return [makeSyntheticDeclaration(ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
                this.typeToStringConvertor.convertLiteralType(node), () => {
                    return ts.factory.createClassDeclaration([],
                        this.typeToStringConvertor.convertLiteralType(node),
                        undefined,
                        undefined,
                        [])
                })]
        }
        return super.convertLiteralType(node)
    }

    convertUnion(node: ts.UnionTypeNode): ts.Declaration[] {
        if (node?.parent?.parent != undefined && ts.isTupleTypeNode(node.parent) && ts.isTypeReferenceNode(node.parent.parent)) {
            //TODO: Fix 'Comma is mandatory between elements in a tuple type declaration' error
            const typeAliasDecl = makeSyntheticTypeAliasDeclaration(
                ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
                this.typeToStringConvertor.convertUnion(node),
                ts.factory.createUnionTypeNode(node.types),
            )
            this.declDependenciesCollector.value.convert(typeAliasDecl).forEach(it => {
                if (isSourceDecl(it) && (PeerGeneratorConfig.needInterfaces || isSyntheticDeclaration(it))) {
                    addSyntheticDeclarationDependency(typeAliasDecl, convertDeclToFeature(this.peerLibrary, it))
                }
            })
            return [typeAliasDecl]
        }
        return super.convertUnion(node);
    }

    override convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): ts.Declaration[] {
        return [makeSyntheticTypeAliasDeclaration(
            ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
            this.typeToStringConvertor.convertTemplateLiteral(node),
            ts.factory.createTypeReferenceNode("string"),
        )]
    }

    override convertTypeLiteral(node: ts.TypeLiteralNode): ts.Declaration[] {
        const membersDecls: ts.Declaration[] = []
        for (const member of node.members) {
            if (ts.isPropertySignature(member)) {
                membersDecls.push(...this.convert(member.type))
            }
        }
        return [...membersDecls, makeSyntheticInterfaceDeclaration(ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
            this.typeToStringConvertor.convertTypeLiteral(node),
            undefined,
            node.members,
            this.declDependenciesCollector.value,
            this.peerLibrary)]
    }

    //TODO: needs to be rework
    override convertImport(node: ts.ImportTypeNode): ts.Declaration[] {
        const generatedName = this.typeToStringConvertor.convert(node)
        if (!this.peerLibrary.importTypesStubToSource.has(generatedName)) {
            this.peerLibrary.importTypesStubToSource.set(generatedName, node.getText())
        }
        let syntheticDeclaration: ts.Declaration
        const qualifierName = node.qualifier !== undefined && ts.isIdentifier(node.qualifier)
            ? node.qualifier.text
            : undefined
        if (qualifierName !== undefined && this.ALIAS_DECL_LIST.has(qualifierName)) {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
                qualifierName,
                ts.factory.createTypeReferenceNode(generatedName),
            )
        } else if (qualifierName === "Resource") {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
                generatedName,
                ts.factory.createTypeReferenceNode("ArkResource"),
            )
            addSyntheticDeclarationDependency(syntheticDeclaration, {feature: "ArkResource", module: "./shared/ArkResource"})
        } else {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
                generatedName,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            )
        }

        return [
            ...node.typeArguments?.flatMap(it => this.convert(it)) || [],
            syntheticDeclaration
        ]
    }
}

export class FilteredDeclarationCollector extends DeclarationDependenciesCollector {
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
        private readonly typeNodeConvertor: TypeNodeNameConvertor,
        private readonly declDependenciesCollector: DeclarationDependenciesCollector) {}

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
        parentName?: string): PeerMethod | undefined {
        const isCallSignature = ts.isCallSignatureDeclaration(method)
        // Some method have other parents as part of their names
        // Such as the ones coming from thr friend interfaces
        // E.g. ButtonInterface instead of ButtonAttribute
        const originalParentName = parentName ?? peer.originalClassName!
        const methodName = isCallSignature ? `set${peer.componentName}Options` : identName(method.name)!

        if (PeerGeneratorConfig.ignorePeerMethod.includes(methodName)) return

        this.declarationTable.setCurrentContext(`${originalParentName}.${methodName}()`)

        // TODO: fix this ugly code to prevent method args aliases name collisions.
        const methodIndex = getMethodIndex(methodName, method)
        const parameters = tempExtractParameters(method)
        parameters.forEach((param, index) => {
            if (param.type) {
                this.declarationTable.requestType(
                    param.type,
                    this.library.shouldGenerateComponent(peer.componentName),
                    `Type_${originalParentName}_${methodName}${methodIndex == 0 ? "" : methodIndex.toString()}_Arg${index}`,
                )
            }
        })
        const argConvertors = parameters
            .map((param) => generateArgConvertor(this.declarationTable, param, this.typeNodeConvertor))
        const declarationTargets = parameters
            .map((param) => this.declarationTable.toTarget(param.type ??
                throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
        const retConvertor = generateRetConvertor(method.type)

        // TODO: restore collapsing logic!
        const signature = /* collapsed?.signature ?? */ generateSignature(method, this.typeNodeConvertor)

        const peerMethod = new PeerMethod(
            originalParentName,
            declarationTargets,
            argConvertors,
            retConvertor,
            isCallSignature,
            false,
            new Method(methodName, signature, isStatic(method.modifiers) ? [MethodModifier.STATIC] : []),
            methodIndex,
        )
        this.declarationTable.setCurrentContext(undefined)
        return peerMethod
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration,
                                                 peer: PeerClass): void {
        if (PeerGeneratorConfig.invalidAttributes.includes(peer.componentName)) {
            return
        }
        const seenAttributes = new Set<string>()
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(seenAttributes, this.processMethodDeclaration(child, peer), peer)
            }
        })
    }

    private processOptionAttribute(seenAttributes: Set<string>,
                                   method: ts.MethodDeclaration | ts.MethodSignature,
                                   peer: PeerClass): void {
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

    private argumentType(methodName: string,
                         parameters: ts.ParameterDeclaration[],
                         peer: PeerClass): string {
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

            peer.attributesTypes.push({
                typeName: argumentTypeName,
                content: this.createParameterType(argumentTypeName, typeLiteralStatements)}
            )
            // Arkts needs a named type as its argument method, not an anonymous type
            // at which producing 'SyntaxError: Invalid Type' error
            const peerMethod = peer.methods.find((method) => method.overloadedName == methodName)
            if (peerMethod !== undefined) {
                peerMethod.method.signature.args = [toIDLType(argumentTypeName)]
            }
            return argumentTypeName
        }
        if (parameters.length > 2) {
            const attributeInterfaceStatements = parameters.map(it => ({
                name: asString(it.name),
                type: it.type!,
                questionToken: !!it.questionToken
            }))
            peer.attributesTypes.push({
                typeName: argumentTypeName,
                content: this.createParameterType(argumentTypeName, attributeInterfaceStatements)}
            )
            return argumentTypeName
        }

        return parameters.map(it => this.typeNodeConvertor.convert(it.type!)).join(', ')
    }

    private createParameterType(
        name: string,
        attributes: { name: string, type: ts.TypeNode, questionToken: boolean }[]): string {
        const attributeDeclarations = attributes
            .map(it => `\n  ${it.name}${it.questionToken ? "?" : ""}: ${this.typeNodeConvertor.convert(it.type)}`)
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

    private fillClass(peer: PeerClass,
                      node: ts.ClassDeclaration) {
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

    private processMethodDeclaration(method: ts.MethodDeclaration, peer: PeerClass): ts.MethodDeclaration {
        if (ts.isClassDeclaration(method.parent) && this.library.language === Language.ARKTS) {
            const baseMethods = getMembersFromClassDeclarations(
                getHeritageClassDeclarations(
                    method.parent.heritageClauses,
                    this.library.declarationTable.typeChecker!))
                .filter(it => {
                    if (ts.isIdentifier(method.name) && ts.isIdentifier(it.name) && it.name.text == method.name.text) {
                        return it
                    }
                })
            if (baseMethods.length == 1) {
                method = baseMethods[0] as ts.MethodDeclaration
                //TODO: needs to be moved to PeerProcessor.generateDeclarations(components: ComponentDeclaration[])
                peer.file.importFeatures.push(...collectDeclarationDeps(method.parent,
                    this.declDependenciesCollector,
                    this.library))
                console.log(`the parameter type of base method is taken: '${method.parameters[0].type?.getText()}'`)
            }
        }
        return method
    }
}

export class PeerProcessor {
    private readonly typeDependenciesCollector: TypeDependenciesCollector
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    private readonly serializeDepsCollector: DeclarationDependenciesCollector

    constructor(
        private readonly library: PeerLibrary,
    ) {
        this.typeDependenciesCollector = createTypeDependenciesCollector(this.library, {
            declDependenciesCollector: lazy(() => this.declDependenciesCollector)
        })
        this.declDependenciesCollector = new FilteredDeclarationCollector(this.library, this.typeDependenciesCollector)
        this.serializeDepsCollector = new FilteredDeclarationCollector(
            this.library, new ImportsAggregateCollector(this.library, true))
    }
    private get declarationTable(): DeclarationTable {
        return this.library.declarationTable
    }

    private processBuilder(target: ts.InterfaceDeclaration | ts.ClassDeclaration,
                           isActualDeclaration: boolean,
                           typeNodeConvertor: TypeNodeNameConvertor) {
        let name = nameOrNull(target.name)!
        if (this.library.builderClasses.has(name)) {
            return
        }

        if (isCustomBuilderClass(name)) {
            // HACK: for custom builder classes also need to collect dependencies
            const customBuilderClass = CUSTOM_BUILDER_CLASSES.find(it => it.name === name)
            if (customBuilderClass) {
                collectDeclarationDeps(target, this.declDependenciesCollector, this.library)
                    .forEach(it => customBuilderClass.importFeatures.push(it))
            }
            return
        }
        const builderClass = toBuilderClass(this.declarationTable,
            name,
            target,
            this.library,
            this.declDependenciesCollector,
            isActualDeclaration,
            typeNodeConvertor)
        this.library.builderClasses.set(name, builderClass)
    }

    private processMaterialized(target: ts.InterfaceDeclaration | ts.ClassDeclaration,
                                isActualDeclaration: boolean,
                                typeNodeConvertor: TypeNodeNameConvertor) {
        let name = nameOrNull(target.name)!
        if (this.library.materializedClasses.has(name)) {
            return
        }

        const isClass = ts.isClassDeclaration(target)
        const isInterface = ts.isInterfaceDeclaration(target)

        const superClass = extractSuperElement(target)

        const importFeatures = this.serializeDepsCollector.convert(target)
            .filter(it => isSourceDecl(it))
            .filter(it => PeerGeneratorConfig.needInterfaces || checkTSDeclarationMaterialized(it) || isSyntheticDeclaration(it))
            .map(it => convertDeclToFeature(this.library, it))
        const generics = target.typeParameters?.map(it => it.getText())

        let constructor = isClass ? target.members.find(ts.isConstructorDeclaration) : undefined
        typeNodeConvertor = createTypeNodeConvertor(this.library, typeNodeConvertor, this.declDependenciesCollector, importFeatures)
        let mConstructor = this.makeMaterializedMethod(name, constructor, isActualDeclaration, typeNodeConvertor)
        const finalizerReturnType = {isVoid: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => ""}
        let mFinalizer = new MaterializedMethod(name, [], [], finalizerReturnType, false,
            new Method("getFinalizer", new NamedMethodSignature(IDLPointerType, [], [], []), [MethodModifier.STATIC]), 0)
        let mFields = isClass
            ? target.members
                .filter(ts.isPropertyDeclaration)
                .map(it => this.makeMaterializedField(name, it, typeNodeConvertor))
            : isInterface
                ? target.members
                    .filter(ts.isPropertySignature)
                    .map(it => this.makeMaterializedField(name, it, typeNodeConvertor))
                : []

        let mMethods = isClass
            ? target.members
                .filter(ts.isMethodDeclaration)
                .map(method => this.makeMaterializedMethod(name, method, isActualDeclaration, typeNodeConvertor))
            : isInterface
                ? target.members
                .filter(ts.isMethodSignature)
                .map(method => this.makeMaterializedMethod(name, method, isActualDeclaration, typeNodeConvertor))
                : []

        mFields.forEach(f => {
            const field = f.field
            // TBD: use deserializer to get complex type from native
            const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
            if (isSimpleType) {
                const getAccessor = new MaterializedMethod(name, [], [], f.retConvertor, false,
                    new Method(`get${capitalize(field.name)}`, new NamedMethodSignature(field.type, [], []), [MethodModifier.PRIVATE]), 0
                )
                mMethods.push(getAccessor)
            }

            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(IDLVoidType, [field.type], [field.name])
                const retConvertor = { isVoid: true, nativeType: () => getIDLTypeName(IDLVoidType), macroSuffixPart: () => "V" }
                const setAccessor = new MaterializedMethod(name, [f.declarationTarget!], [f.argConvertor], retConvertor, false,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]), 0
                )
                mMethods.push(setAccessor)
            }
        })

        // In ArkTS we need generate a real interface in SyntheticDeclarations
        if (this.library.declarationTable.language == Language.ARKTS && ts.isInterfaceDeclaration(target)) {
            const declName = createInterfaceDeclName(`${identName(target)!}`)
            importFeatures.push(convertDeclToFeature(this.library,
                makeSyntheticInterfaceDeclaration(ArkTSTypeDepsCollector.SYNTH_TYPE_FILE_NAME,
                    declName,
                    target.typeParameters,
                    target.members,
                    this.declDependenciesCollector!,
                    this.library)))
        }

        this.library.materializedClasses.set(name,
            new MaterializedClass(name, isInterface, superClass, generics, mFields, mConstructor, mFinalizer, importFeatures, mMethods, isActualDeclaration))
    }

    private makeMaterializedField(className: string,
                                  property: ts.PropertyDeclaration | ts.PropertySignature,
                                  typeNodeNameConvertor: TypeNodeNameConvertor): MaterializedField {
        const name = identName(property.name)!
        this.declarationTable.setCurrentContext(`Materialized_${className}_${name}`)
        const declarationTarget = this.declarationTable.toTarget(property.type!)
        const argConvertor = this.declarationTable.typeConvertor(name, property.type!, false, undefined, typeNodeNameConvertor)
        const retConvertor = generateRetConvertor(property.type!)
        const modifiers = isReadonly(property.modifiers) ? [FieldModifier.READONLY] : []
        this.declarationTable.setCurrentContext(undefined)
        return new MaterializedField(
            new Field(name, toIDLType(mapType(property.type)), modifiers),
            argConvertor, retConvertor, declarationTarget, property.questionToken !== undefined)
    }

    private makeMaterializedMethod(parentName: string,
                                   method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | undefined,
                                   isActualDeclaration: boolean,
                                   typeNodeConverter: TypeNodeNameConvertor) {
        const methodName = method === undefined || ts.isConstructorDeclaration(method) ? "ctor" : identName(method.name)!
        this.declarationTable.setCurrentContext(`Materialized_${parentName}_${methodName}`)

        const retConvertor = method === undefined || ts.isConstructorDeclaration(method)
            ? { isVoid: false, isStruct: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => "" }
            : generateRetConvertor(method.type)

        if (method === undefined) {
            // interface or class without constructors
            const ctor = new Method("ctor", new NamedMethodSignature(IDLVoidType, [], []), [MethodModifier.STATIC])
            this.declarationTable.setCurrentContext(undefined)
            return new MaterializedMethod(parentName, [], [], retConvertor, false, ctor, 0)
        }

        const generics = method.typeParameters?.map(it => it.getText())
        const declarationTargets = method.parameters.map(param =>
            this.declarationTable.toTarget(param.type ??
                throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
        method.parameters.forEach(it => this.declarationTable.requestType(it.type!, isActualDeclaration, undefined))
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.declarationTable, param, typeNodeConverter))
        const signature = generateSignature(method, typeNodeConverter, false)
        const modifiers = generateMethodModifiers(method)
        this.declarationTable.setCurrentContext(undefined)
        return new MaterializedMethod(parentName, declarationTargets, argConvertors, retConvertor, false,
            new Method(methodName, signature, modifiers, generics), getMethodIndex(methodName, method))
    }

    private collectDepsRecursive(node: ts.Declaration | ts.TypeNode, deps: Set<ts.Declaration>): void {
        const currentDeps = ts.isTypeNode(node)
            ? convertTypeNode(this.typeDependenciesCollector, node)
            : convertDeclaration(this.declDependenciesCollector, node)
        for (const dep of currentDeps) {
            if (deps.has(dep)) continue
            if (!isSourceDecl(dep)) continue
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

    private getDeclSourceFile(node: ts.Declaration): ts.SourceFile {
        if (ts.isModuleBlock(node.parent))
            return this.getDeclSourceFile(node.parent.parent)
        if (!ts.isSourceFile(node.parent))
            throw 'Expected declaration to be at file root'
        return node.parent
    }

    private generateActualComponents(): ComponentDeclaration[] {
        const components = this.library.componentsDeclarations
        if (!this.library.componentsToGenerate.size)
            return components
        const entryComponents = components.filter(it => this.library.shouldGenerateComponent(it.name))
        return components.filter(component => {
            return entryComponents.includes(component)
                // entryComponents.some(entryComponent => isSubclassComponent(this.declarationTable.typeChecker!, entryComponent, component))
        })
    }

    private generateDeclarations(components: ComponentDeclaration[]): Set<ts.Declaration> {
        const deps = new Set(components.flatMap(it => {
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
        initCustomBuilderClasses(this.library)
        new ComponentsCompleter(this.library).process()
        const typeNodeConvertor = createTypeNodeConvertor(this.library)
        const peerGenerator = new PeersGenerator(this.library, typeNodeConvertor, this.declDependenciesCollector)
        for (const component of this.library.componentsDeclarations)
            peerGenerator.generatePeer(component)
        const allDeclarations = this.generateDeclarations(this.library.componentsDeclarations)
        const actualDeclarations = this.generateDeclarations(this.generateActualComponents())

        for (const dep of allDeclarations) {
            if (isSyntheticDeclaration(dep)) {
                continue
            }
            const file = this.library.findFileByOriginalFilename(this.getDeclSourceFile(dep).fileName)!
            const isPeerDecl = this.library.isComponentDeclaration(dep)
            const isActualDeclaration = actualDeclarations.has(dep)

            if (!isPeerDecl && (ts.isClassDeclaration(dep) || ts.isInterfaceDeclaration(dep))) {
                if (isBuilderClass(dep)) {
                    this.processBuilder(dep, isActualDeclaration, typeNodeConvertor)
                    continue
                } else if (isMaterialized(dep)) {
                    this.processMaterialized(dep, isActualDeclaration, typeNodeConvertor)
                    continue
                }
            }

            if (!isActualDeclaration)
                continue

            if (ts.isEnumDeclaration(dep)) {
                this.processEnum(dep)
                continue
            }

            collectDeclarationDeps(dep, this.declDependenciesCollector, this.library)
                .forEach(it => file.importFeatures.push(it))
            this.serializeDepsCollector.convert(dep).forEach(it => {
                if (isSourceDecl(it) && PeerGeneratorConfig.needInterfaces) {
                    file.serializeImportFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            if (PeerGeneratorConfig.needInterfaces) {
                file.declarations.add(dep)
                file.importFeatures.push(convertDeclToFeature(this.library, dep))
            }
        }
    }
}

export function createTypeDependenciesCollector(
    library: PeerLibrary,
    arkts: {
        declDependenciesCollector: Lazy<DeclarationDependenciesCollector>
    }
): TypeDependenciesCollector {
    return library.declarationTable.language == Language.TS
        ? new ImportsAggregateCollector(library, false)
        : new ArkTSTypeDepsCollector(library, true, arkts.declDependenciesCollector)
}

export function generateMethodModifiers(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature) {
    return ts.isConstructorDeclaration(method) || isStatic(method.modifiers) ? [MethodModifier.STATIC] : []
}

export function isSourceDecl(node: ts.Declaration): boolean {
    if (isSyntheticDeclaration(node))
        return true
    if (ts.isModuleBlock(node.parent))
        return isSourceDecl(node.parent.parent)
    if (ts.isTypeParameterDeclaration(node))
        return false
    if (!ts.isSourceFile(node.parent))
        throw 'Expected declaration to be at file root'
    return !node.parent.fileName.endsWith('stdlib.d.ts')
}

export function createTypeNodeConvertor(library: PeerLibrary,
                                        typeNodeConvertor?: TypeNodeNameConvertor,
                                        declarationDependenciesCollector?: DeclarationDependenciesCollector,
                                        importFeatures?: ImportFeature[]): TypeNodeNameConvertor {
    switch (library.declarationTable.language) {
        case Language.ARKTS: {
            if (typeNodeConvertor != undefined && declarationDependenciesCollector != undefined && importFeatures != undefined) {
                return new ArkTSTypeNodeNameConvertorWithDepsCollector(typeNodeConvertor,
                    library, declarationDependenciesCollector, importFeatures)
            }
            return new ArkTSTypeNodeNameConvertor(library)
        }
        case Language.TS: {
            return new TSTypeNodeNameConvertor()
        }
        case Language.CJ: {
            return new CJTypeNodeNameConvertor()
        }
        case Language.JAVA: {
            return new JavaTypeNodeNameConvertor()
        }
        default:
            throw `Unsupported language: ${library.declarationTable.language}`
    }
}

function getMethodIndex(methodName: string, method: ts.MethodDeclaration | ts.MethodSignature | ts.ConstructorDeclaration | ts.CallSignatureDeclaration | undefined): number {
    if (!method) {
        return 0
    }
    let clazz = method.parent
    if (ts.isInterfaceDeclaration(clazz)) {
        if (ts.isCallSignatureDeclaration(method)) {
            return clazz.members
                .filter(ts.isCallSignatureDeclaration)
                .findIndex(it => method === it)
        }
        return clazz.members
            .filter(it => ts.isMethodSignature(it) && identName(it.name) === methodName)
            .findIndex(it => method === it)

    }
    if (ts.isClassDeclaration(clazz)) {
        return clazz.members
            .filter(it => ts.isMethodDeclaration(it) && identName(it.name) === methodName)
            .findIndex(it => method === it)
    }
    return 0
}

export function collectDeclarationDeps(target: ts.Declaration,
                                declDependenciesCollector: DeclarationDependenciesCollector,
                                peerLibrary: PeerLibrary): ImportFeature[] {
    return declDependenciesCollector.convert(target)
        .filter(it => isSourceDecl(it))
        .filter(it => PeerGeneratorConfig.needInterfaces || isSyntheticDeclaration(it))
        .map(it => convertDeclToFeature(peerLibrary, it))
}

function getHeritageClassDeclarations(heritageClauses: ts.NodeArray<ts.HeritageClause> | undefined,
                                      typeChecker: ts.TypeChecker): ts.ClassDeclaration[] {
    return heritageClauses
        ?.flatMap(it => it.types)
        .flatMap(it => getDeclarationsByNode(typeChecker, it.expression))
        .filter(it => it != undefined) as ts.ClassDeclaration[] ?? []
}

function getMembersFromClassDeclarations(classes: ts.ClassDeclaration[]): ts.MethodDeclaration[] {
    return classes
        .flatMap(it => it.members)
        .filter(it => ts.isMethodDeclaration(it)) as ts.MethodDeclaration[]
}