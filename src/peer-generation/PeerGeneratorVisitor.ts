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
    isCommonMethodOrSubclass,
    mapType,
    nameOrNull,
    serializerBaseMethods,
    stringOrNone,
    className,
    isDefined,
    isStatic,
    throwException,
    isCustomComponentClass,
    getComment,
    mapTypeOrVoid,
} from "../util"
import { GenericVisitor } from "../options"
import {
    ArgConvertor, RetConvertor,
} from "./Convertors"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { DeclarationTable, PrimitiveType } from "./DeclarationTable"
import {
    hasTransitiveHeritageGenericType,
    isCommonMethod,
    isRoot,
    isStandalone,
    singleParentDeclaration,
} from "./inheritance"
import { PeerClass } from "./PeerClass"
import { PeerMethod } from "./PeerMethod"
import { PeerFile, EnumEntity } from "./PeerFile"
import { PeerLibrary } from "./PeerLibrary"
import { MaterializedClass, MaterializedMethod, isMaterialized } from "./Materialized"
import { Method, MethodModifier, NamedMethodSignature, Type } from "./LanguageWriters";
import { collapseSameNamedMethods } from "./OverloadsPrinter";

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

type MaybeCollapsedMethod = {
    member: ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration
    collapsed?: {
        method: Method,
        generatedImportTypes: string[],
    }
}

export type PeerGeneratorVisitorOptions = {
    sourceFile: ts.SourceFile
    typeChecker: ts.TypeChecker
    interfacesToGenerate: Set<string>
    declarationTable: DeclarationTable,
    peerLibrary: PeerLibrary
}

export class PeerGeneratorVisitor implements GenericVisitor<void> {
    private seenAttributes = new Set<string>()
    private readonly sourceFile: ts.SourceFile
    private interfacesToGenerate: Set<string>
    declarationTable: DeclarationTable

    static readonly serializerBaseMethods = serializerBaseMethods()
    readonly typeChecker: ts.TypeChecker

    readonly peerLibrary: PeerLibrary
    readonly peerFile: PeerFile

    constructor(options: PeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.typeChecker = options.typeChecker
        this.interfacesToGenerate = options.interfacesToGenerate
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

    private isRootMethodInheritor(decl: ts.ClassDeclaration | ts.InterfaceDeclaration): boolean {
        if (ts.isClassDeclaration(decl)) {
            return isCommonMethodOrSubclass(this.typeChecker, decl)
        }
        return false

    }

    private isCallableSignatureInterface(name: string | undefined): boolean {
        return !!(name?.endsWith("Interface"))
    }

    needsPeer(decl: ts.ClassDeclaration | ts.InterfaceDeclaration): boolean {
        let name = decl.name?.text
        if (!name) return false
        if (PeerGeneratorConfig.skipPeerGeneration.includes(name)) return false

        if (this.interfacesToGenerate.size > 0) {
            return this.interfacesToGenerate.has(name)
        }

        if (isStandalone(name)) return true
        if (isRoot(name)) return true
        if (this.isRootMethodInheritor(decl)) return true

        return false
    }

    isFriendInterface(decl: ts.InterfaceDeclaration): boolean {
        let name = decl.name?.text
        if (!name) return false
        // We don't want constructor signature to be inherited
        if (PeerGeneratorConfig.uselessConstructorInterfaces.includes(name)) return false
        if (this.isCallableSignatureInterface(name)) return true

        return false
    }

    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node)) {
            this.processClass(node)
        } else if (ts.isInterfaceDeclaration(node)) {
            this.processInterface(node)
        } else if (ts.isModuleDeclaration(node)) {
            if (node.body && ts.isModuleBlock(node.body)) {
                node.body.statements.forEach(it => this.visit(it))
            }
        } else if (ts.isEnumDeclaration(node)) {
            this.processEnum(node)
        } else if (ts.isVariableStatement(node) ||
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

    private processClass(node: ts.ClassDeclaration): void {
        if (!this.needsPeer(node)) return
        if (isCustomComponentClass(node))
            return this.processCustomComponent(node)
        if (isCommonMethod(nameOrNull(node.name)!)) {
            this.processCommonComponent(node)
        }
        const tsMethods = this.extractMethods(node)

        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        // We don't know what comes first ButtonAttribute or ButtonInterface.
        // Both will contribute to the peer class.
        const peer = this.peerFile.getOrPutPeer(componentName)

        this.populatePeer(node, peer)
        const peerMethods = tsMethods
            .map(it => this.processMethodOrCallable(it, peer))
            .filter(isDefined)
        PeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)

        this.createComponentAttributesDeclaration(node, peer)
    }

    private processCustomComponent(node: ts.ClassDeclaration) {
        const methods = node.members
            .filter(it => ts.isMethodDeclaration(it) || ts.isMethodSignature(it))
            .map(it => it.getText().replace(/;\s*$/g, ''))
            .map(it => `${it} { throw new Error("not implemented"); }`)
        this.peerLibrary.customComponentMethods.push(...methods)
    }

    private groupOverloads(methods: Method[]): Method[][] {
        const seenNames = new Set<string>()
        const groups: Method[][] = []
        for (const method of methods) {
            if (seenNames.has(method.name))
                continue
            seenNames.add(method.name)
            groups.push(methods.filter(it => it.name === method.name))
        }
        return groups
    }

    private processCommonComponent(node: ts.ClassDeclaration) {
        const tsMethods = this.extractMethods(node)

        const methods = tsMethods
            .filter(it => !ts.isCallSignatureDeclaration(it))
            .map(method => {
                return new Method(
                    identName(method.name)!,
                    this.generateSignature(method)
                )
            })
        const collapsedMethods = this.groupOverloads(methods)
            .map(it => collapseSameNamedMethods(it))
        collapsedMethods.forEach(it => {
            const args = it.signature.args.map((type, index) => {
                const maybeOptional = type.nullable ? "?" : ""
                return `${it.signature.argName(index)}${maybeOptional}: ${type.name}`.replace('<T>', '<this>')
            })
            const declaration = `${it.name}(${args.join(',')}): this { throw new Error("not implemented"); }`
            this.peerLibrary.commonMethods.push(declaration)
        })
    }

    processInterface(node: ts.InterfaceDeclaration) {
        if (!this.isFriendInterface(node)) return

        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        // We don't know what comes first ButtonAttribute or ButtonInterface.
        // Both will contribute to the peer class.
        const peer = this.peerFile.getOrPutPeer(componentName)
        peer.originalInterfaceName = this.classNameIfInterface(node)
        const tsMethods = this.extractMethods(node)
        const peerMethods = tsMethods
            .filter(it => ts.isCallSignatureDeclaration(it))
            .map(it => this.processMethodOrCallable(it, peer, identName(node)!))
            .filter(isDefined)
        PeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)
    }

    processEnum(node: ts.EnumDeclaration) {
        let name = node.name.getText()
        let comment = getComment(this.sourceFile, node)
        let enumEntity = new EnumEntity(name, comment)
        node.forEachChild(child => {
            if (ts.isEnumMember(child)) {
                let name = child.name.getText()
                let comment = getComment(this.sourceFile, child)
                enumEntity.pushMember(name, comment, child.initializer?.getText())
            }
        })
        this.peerFile.pushEnum(enumEntity)
    }

    private mapType(type: ts.TypeNode | undefined): string {
        if (!type)
            return mapTypeOrVoid(this.typeChecker, type)
        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return "undefined"
        }
        if (ts.isFunctionTypeNode(type)) {
            return `(${type.getText()})`
        }
        if (ts.isImportTypeNode(type)) {
            const importType = type.getText().match(/[a-zA-Z]+/g)!.join('_')
            this.peerLibrary.importTypesStubs.push(importType)
            return importType
        }
        if (ts.isTypeLiteralNode(type)) {
            const members = type.members
                .filter(ts.isPropertySignature)
                .map(it => {
                    const type = this.mapType(it.type!)
                    return `${asString(it.name)}: ${type}`
                })
            return `{ ${members.join(', ')} }`
        }
        return mapTypeOrVoid(this.typeChecker, type)
    }

    generateSignature(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration): NamedMethodSignature {
        const parameters = this.tempExtractParameters(method)
        const returnType = isStatic(method.modifiers) ? new Type(identName(method.type)!) : Type.This
        return new NamedMethodSignature(returnType,
            parameters
                .map(it => new Type(this.mapType(it.type), it.questionToken != undefined)),
            parameters
                .map(it => identName(it.name)!),
        )
    }

    generateParams(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => {
            let mappedType = mapType(this.typeChecker, param.type)
            return `${nameOrNull(param.name)}${param.questionToken ? "?" : ""}: ${mappedType}`
        }).join(", ")
    }

    generateParamsTypes(params: ts.NodeArray<ts.ParameterDeclaration>): string[] {
        return params?.map(param => mapType(this.typeChecker, param.type))
    }

    generateValues(argConvertors: ArgConvertor[]): stringOrNone {
        return argConvertors?.map(it => `${it.param}`).join(", ")
    }

    private tempExtractParameters(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration): ts.ParameterDeclaration[] {
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

    processMethodOrCallable(
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

        this.declarationTable.setCurrentContext(`${methodName}()`)

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

        const parameters = this.tempExtractParameters(method)
        parameters.forEach((param, index) => {
            if (param.type) {
                this.requestType(`Type_${originalParentName}_${methodName}${methodIndex == 0 ? "" : methodIndex.toString()}_Arg${index}`, param.type)
                this.collectMaterializedClasses(param.type)
            }
        })
        const argConvertors = parameters
            .map((param) => this.argConvertor(param))
        const declarationTargets = parameters
            .map((param) => this.declarationTable.toTarget(param.type ??
                throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
        const retConvertor = this.retConvertor(method.type)

        // TODO: restore collapsing logic!
        const signature = /* collapsed?.signature ?? */ this.generateSignature(method)

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

    private collectMaterializedClasses(type: ts.TypeNode) {
        if (ts.isTypeReferenceNode(type)) {
            let target = this.declarationTable.toTarget(type)
            if (!(target instanceof PrimitiveType) && ts.isClassDeclaration(target)) {
                this.processMaterializedClass(target)
            }
        } else if (ts.isOptionalTypeNode(type) || ts.isParenthesizedTypeNode(type)) {
            this.collectMaterializedClasses(type.type)
        } else if (ts.isUnionTypeNode(type)) {
            type.types.forEach(it => this.collectMaterializedClasses(it))
        } else if (ts.isFunctionTypeNode(type)) {
            type.parameters.forEach(param => {
                this.collectMaterializedClasses(param.type!)
            })
        }
    }

    processMaterializedClass(target: ts.ClassDeclaration) {
        if (!isMaterialized(target)) {
            return
        }
        let className = nameOrNull(target.name)!
        if (this.peerLibrary.materializedClasses.has(className)) {
            return
        }

        let constructor = target.members.find(ts.isConstructorDeclaration)!
        let mConstructor = this.makeMaterializedMethod(className, constructor)
        let mFinalizer = new MaterializedMethod(className, [], [], this.retConvertor(undefined), false,
            new Method("getFinalizer", new NamedMethodSignature(Type.Pointer, [], [], []), [MethodModifier.STATIC]))
        let mMethods = target.members
            .filter(ts.isMethodDeclaration)
            .map(method => this.makeMaterializedMethod(className, method))
        this.peerLibrary.materializedClasses.set(className,
            new MaterializedClass(className, mConstructor, mFinalizer, mMethods))
    }

    private makeMaterializedMethod(parentName: string, method: ts.ConstructorDeclaration | ts.MethodDeclaration) {
        const declarationTargets = method.parameters.map(param =>
            this.declarationTable.toTarget(param.type ??
                throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
        const argConvertors = method.parameters.map(param => this.argConvertor(param))
        const retConvertor = ts.isConstructorDeclaration(method)
            ? { isVoid: false, isStruct: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => "" }
            : this.retConvertor(method.type)
        const signature = this.generateSignature(method)
        const methodName = ts.isConstructorDeclaration(method) ? "ctor" : identName(method.name)!
        const modifiers = ts.isConstructorDeclaration(method) || isStatic(method.modifiers) ? [MethodModifier.STATIC] : []
        return new MaterializedMethod(parentName, declarationTargets, argConvertors, retConvertor, false,
            new Method(methodName, signature, modifiers))
    }

    argConvertor(param: ts.ParameterDeclaration): ArgConvertor {
        if (!param.type) throw new Error("Type is needed")
        let paramName = asString(param.name)
        let optional = param.questionToken !== undefined
        //if (optional) this.generateTypedef(param.type, undefined, true)
        return this.declarationTable.typeConvertor(paramName, param.type, optional)
    }

    retConvertor(typeNode?: ts.TypeNode): RetConvertor {
        let nativeType = typeNode ? mapCInteropRetType(typeNode) : "void"
        let isVoid = nativeType == "void"
        return {
            isVoid: isVoid,
            nativeType: () => nativeType,
            macroSuffixPart: () => isVoid ? "V" : ""
        }
    }

    processProperty(property: ts.PropertyDeclaration | ts.PropertySignature) {
        throw new Error(`unexpected property ${property.name.getText(this.sourceFile)}`)
    }

    populatePeer(node: ts.ClassDeclaration, peer: PeerClass) {
        peer.originalClassName = className(node)
        const parent = singleParentDeclaration(this.typeChecker, node) as ts.ClassDeclaration
        if (parent) {
            peer.originalParentName = className(parent)
            peer.originalParentFilename = parent.getSourceFile().fileName
            peer.parentComponentName = this.renameToComponent(peer.originalParentName!)
            peer.hasTransitiveGenericType = hasTransitiveHeritageGenericType(node)
        }
    }

    private renameToComponent(name: string): string {
        return name
            .replace("Attribute", "")
            .replace("Method", "")
            .replace("Interface", "")
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration, peer: PeerClass): void {
        if (PeerGeneratorConfig.invalidAttributes.includes(peer.componentName)) {
            return
        }
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(child, peer)
            }
        })
    }

    private processOptionAttribute(method: ts.MethodDeclaration | ts.MethodSignature, peer: PeerClass): void {
        const methodName = method.name.getText(this.sourceFile)
        if (this.seenAttributes.has(methodName)) {
            console.log(`WARNING: ignore seen method: ${methodName}`)
            return
        }
        const parameters = this.tempExtractParameters(method)
        if (parameters.length != 1) {
            // We only convert one argument methods to attributes.
            return
        }
        this.seenAttributes.add(methodName)
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

        return parameters.map(it => mapType(this.typeChecker, it.type)).join(', ')
    }

    private createParameterType(
        name: string,
        attributes: { name: string, type: ts.TypeNode, questionToken: boolean }[]
    ): string {
        const attributeDeclarations = attributes
            .map(it => `\n  ${it.name}${it.questionToken ? "?" : ""}: ${mapType(this.typeChecker, it.type)}`)
            .join('')
        return `export interface ${name} {${attributeDeclarations}\n}`
    }

    private extractMethods(node: ts.ClassDeclaration | ts.InterfaceDeclaration): (ts.MethodDeclaration | ts.CallSignatureDeclaration)[] {
        return (node.members as ts.NodeArray<ts.Node>).filter(
            it => (ts.isMethodDeclaration(it) || ts.isCallSignatureDeclaration(it))
        ) as (ts.MethodDeclaration | ts.CallSignatureDeclaration)[]
    }

    classNameIfInterface(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        if (clazz.name === undefined) {
            throw new Error(`Encountered nameless ${asString(clazz)} in ${asString(clazz.parent)}`)
        }
        let name = identName(clazz.name)!
        if (ts.isClassDeclaration(clazz)) return name
        if (ts.isInterfaceDeclaration(clazz) && name.endsWith("Interface")) {
            // Do we want to convert ButtonInterface to ButtonAttribute here?
            // Most probably yes. Will do it here.
            // For now we just leave ButtonInterface.
            return name
        }
        throw new Error(`Expected a class or a friend interface: ${asString(clazz)}`)
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
    throw new Error(type.getText())
}
