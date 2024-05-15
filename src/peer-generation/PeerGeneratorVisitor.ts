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
import { DeclarationTable, DeclarationTarget, MethodRecord, PrimitiveType } from "./DeclarationTable"
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
import { Materialized, MaterializedClass, MaterializedMethod, isMaterialized } from "./Materialized"
import { Method, MethodModifier, NamedMethodSignature, Type } from "./LanguageWriters";

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
        const collapsedMethods = this.collapseOverloads(node)

        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        // We don't know what comes first ButtonAttribute or ButtonInterface.
        // Both will contribute to the peer class.
        const peer = this.peerFile.getOrPutPeer(componentName)

        this.populatePeer(node, peer)
        const peerMethods = collapsedMethods
            .map(it => this.processMethodOrCallable(it, peer))
            .filter(isDefined)
        peer.methods.push(...peerMethods)
        collapsedMethods.forEach(it => {
            // peer.usedImportTypesStubs.push(...it.collapsed.generatedImportTypes)
            // this.peerLibrary.importTypesStubs.push(...it.collapsed.generatedImportTypes)
        })

        this.createComponentAttributesDeclaration(node, peer)
    }

    private processCustomComponent(node: ts.ClassDeclaration) {
        const methods = node.members
            .filter(it => ts.isMethodDeclaration(it) || ts.isMethodSignature(it))
            .map(it => it.getText().replace(/;\s*$/g, ''))
            .map(it => `${it} { throw new Error("not implemented"); }`)
        this.peerLibrary.customComponentMethods.push(...methods)
    }

    private processCommonComponent(node: ts.ClassDeclaration) {
        const collapsedMethods = this.collapseOverloads(node)

        const methods = collapsedMethods
            .filter(it => !ts.isCallSignatureDeclaration(it.member))
            .map(it => {
                // TODO: restore collapse logic
                //if (it.collapsed) return `${identName(it.member.name)}(${it.collapsed.paramsDecl}) : this`
                return it.member.getText().replace(/:[^S:]*$/g, ': this')
            })
            .map(it => it.replace('<T>', '<this>'))
            .map(it => `${it} { throw new Error("not implemented"); }`)
        this.peerLibrary.commonMethods.push(...methods)
    }

    processInterface(node: ts.InterfaceDeclaration) {
        if (!this.isFriendInterface(node)) return

        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        // We don't know what comes first ButtonAttribute or ButtonInterface.
        // Both will contribute to the peer class.
        const peer = this.peerFile.getOrPutPeer(componentName)
        peer.originalInterfaceName = this.classNameIfInterface(node)
        const collapsedMethods = this.collapseOverloads(node)
        const peerMethods = collapsedMethods
            .filter(it => ts.isCallSignatureDeclaration(it.member))
            .map(it => this.processMethodOrCallable(it, peer, identName(node)!))
            .filter(isDefined)
        peer.methods.push(...peerMethods)
        collapsedMethods.forEach(it => {
            //peer.usedImportTypesStubs.push(...it.collapsed.generatedImportTypes)
            //this.peerLibrary.importTypesStubs.push(...it.collapsed.generatedImportTypes)
        })
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

    generateSignature(method: ts.MethodDeclaration | ts.MethodSignature | ts.CallSignatureDeclaration): NamedMethodSignature {
        return new NamedMethodSignature(Type.This,
            method.parameters
                .map(it => new Type(mapTypeOrVoid(this.typeChecker, it.type), it.questionToken != undefined)),
            method.parameters
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

    processMethodOrCallable(
        { member: method, collapsed: collapsed }: MaybeCollapsedMethod,
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

        method.parameters.forEach((param, index) => {
            if (param.type) {
                this.requestType(`Type_${originalParentName}_${methodName}_Arg${index}`, param.type)
                this.collectMaterializedClasses(param.type)
            }
        })
        const argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        const declarationTargets = method.parameters
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
        }
    }

    processMaterializedClass(target: ts.ClassDeclaration) {
        if (!isMaterialized(target)) {
            return
        }
        let structDescriptor = this.declarationTable.targetStruct(target)
        let constructor = structDescriptor.getConstructor()
        let className = nameOrNull(target.name)!
        if (Materialized.Instance.materializedClasses.has(className)) {
            return
        }

        let mConstructor = this.makeMaterializedMethod(className, constructor!, true)
        let mDestructor = this.makeMaterializedMethod(className, new MethodRecord("destructor", false, undefined, []))
        let mMethods = structDescriptor.getMethods()
            .map(method => this.makeMaterializedMethod(className, method))
        Materialized.Instance.materializedClasses.set(className,
            new MaterializedClass(className, mConstructor, mDestructor, mMethods))
    }

    private makeMaterializedMethod(parentName: string, method: MethodRecord, isConstructor = false): MaterializedMethod {
        const declarationTargets = method.params.map(it => it.declaration)
        const argConvertors = method.params
            .map((param) => this.declarationTable.typeConvertor(param.name, param.type, false))
        const retConvertor = isConstructor
            ? { isVoid: false, isStruct: false, nativeType: () => parentName + "Peer*", macroSuffixPart: () => "" }
            : this.retConvertor(method.returnType)
        const tsRetType = method.returnType == undefined ? undefined : mapType(this.typeChecker, method.returnType)
        return new MaterializedMethod(parentName, declarationTargets, argConvertors, retConvertor, tsRetType, false, method.toMethod(this.typeChecker))
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
            isStruct: typeNode !== undefined && ts.isTypeReferenceNode(typeNode),
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
        if (method.parameters.length != 1) {
            // We only convert one argument methods to attributes.
            return
        }
        this.seenAttributes.add(methodName)
        const type = this.argumentType(methodName, method.parameters, peer)
        peer.attributesFields.push(`${methodName}?: ${type}`)
    }

    private argumentType(methodName: string, parameters: ts.NodeArray<ts.ParameterDeclaration>, peer: PeerClass): string {
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

    private nameOrEmpty(member: ts.MethodDeclaration | ts.CallSignatureDeclaration): string {
        if (ts.isMethodDeclaration(member)) return member.name.getText()
        if (ts.isCallSignatureDeclaration(member)) return ""
        throw new Error("Unsupported: " + asString(member))
    }
    private collapseOverloads(node: ts.ClassDeclaration | ts.InterfaceDeclaration): MaybeCollapsedMethod[] {
        const methods = (node.members as ts.NodeArray<ts.Node>).filter(
            it => (ts.isMethodDeclaration(it) || ts.isCallSignatureDeclaration(it))
        ) as (ts.MethodDeclaration | ts.CallSignatureDeclaration)[]

        // TODO: collapsing logic doesn't belong here, for some languages name overload is OK.
        if (true) {
            return methods.map(it => ({ member: it }))
        } else {
            const groupedByName = new Map<string, (ts.MethodDeclaration | ts.CallSignatureDeclaration)[]>(
                methods.map(it => [this.nameOrEmpty(it), []])
            )
            methods.forEach(it => {
                groupedByName.get(this.nameOrEmpty(it))?.push(it)
            })
            return [...groupedByName.keys()].map(name => {
                let implementations = groupedByName.get(name)!
                // No need to collapse!
                if (implementations.length == 1) return { member: groupedByName.get(name)![0] }
                throw new Error(`Collapse ${implementations.map(it => it.getText()).join(', ')}`)
            })
        }
        /*
                return [...groupedByName.keys()].map(name => {
                    const overloads = groupedByName.get(name)!

                    const maxParamsLength = Math.max(...overloads.map(it => it.parameters.length))

                    const paramsCollapsed: { types: ts.TypeNode[], name: string, optional?: ts.QuestionToken }[] =
                        Array.from({ length: maxParamsLength }, (_, i) => {
                            const typesToUnion = overloads.map(overload =>
                                overload.parameters[i]?.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
                            )
                            const isParameterOptional = (parameter?: ts.ParameterDeclaration): boolean => {
                                if (parameter == undefined) return true
                                return parameter.questionToken !== undefined
                            }
                            return {
                                types: typesToUnion,
                                name: `arg${i}`,
                                optional: overloads.some(overload => isParameterOptional(overload.parameters[i]))
                                    ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                                    : undefined
                            }
                        })

                    const params = paramsCollapsed
                        .map(({ types, name, optional }) =>
                            ts.factory.createParameterDeclaration(
                                undefined,
                                undefined,
                                name,
                                optional,
                                types.length === 1 ? types[0] : ts.factory.createUnionTypeNode(types)
                            )
                        )

                    const paramsTypesList: string[] = []
                    const paramsDeclList: string[] = []
                    const generatedImportTypes: string[] = []
                    const mapParamType = (type: ts.TypeNode): string => {
                        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
                            return "undefined"
                        }
                        if (ts.isFunctionTypeNode(type)) {
                            return `(${type.getText()})`
                        }
                        if (ts.isImportTypeNode(type)) {
                            const importType = type.getText().match(/[a-zA-Z]+/g)!.join('_')
                            generatedImportTypes.push(importType)
                            return importType
                        }
                        if (ts.isTypeLiteralNode(type)) {
                            const members = type.members
                                .filter(ts.isPropertySignature)
                                .map(it => {
                                    const type = mapParamType(it.type!)
                                    return `${asString(it.name)}: ${type}`
                                })
                            return `{ ${members.join(', ')} }`
                        }
                        return mapType(this.typeChecker, type)
                    }

                    paramsCollapsed.forEach(param => {
                        const questionToken = param.optional ? "?" : ""
                        const collapsedType = param.types.map(mapParamType).join(" | ")

                        paramsTypesList.push(collapsedType)
                        paramsDeclList.push(`${param.name}${questionToken}: ${collapsedType}`)
                    })

                    const paramsUsage = paramsCollapsed
                        .map(it =>
                            it.name
                        )
                        .join(", ")

                    return {
                        member: (name == "") ?
                            ts.factory.createCallSignature(
                                undefined,
                                params,
                                undefined,
                            ) : ts.factory.createMethodDeclaration(
                                undefined,
                                undefined,
                                name,
                                undefined,
                                undefined,
                                params,
                                undefined,
                                undefined
                            ),
                        collapsed: {
                            paramsDecl: paramsDeclList.join(", "),
                            paramsTypes: paramsTypesList,
                            paramsUsage: paramsUsage,
                            generatedImportTypes: generatedImportTypes,
                        }
                    }
                }) */
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
        }
        console.log(`WARNING: unhandled return type ${type.getText()}`)
        return name
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
