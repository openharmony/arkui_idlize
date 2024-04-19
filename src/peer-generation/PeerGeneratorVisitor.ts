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
    className
} from "../util"
import { GenericVisitor } from "../options"
import { IndentedPrinter } from "../IndentedPrinter"
import {
    ArgConvertor, RetConvertor,
} from "./Convertors"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { DeclarationTable } from "./DeclarationTable"
import {
    isRoot,
    isStandalone,
    singleParentDeclaration,
} from "./inheritance"
import { Printers } from "./Printers"
import { PeerClass } from "./PeerClass"
import { PeerMethod } from "./PeerMethod"
import { PeerFile } from "./PeerFile"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8
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
        paramsDecl: string,
        paramsUsage: string
    }
}

export type PeerGeneratorVisitorOptions = {
    sourceFile: ts.SourceFile
    typeChecker: ts.TypeChecker
    interfacesToGenerate: Set<string>
    nativeModuleMethods: string[]
    nativeModuleEmptyMethods: string[]
    outputC: string[]
    nodeTypes: string[]
    apiHeaders: string[]
    apiHeadersList: string[]
    dummyImpl: string[]
    dummyImplModifiers: string[]
    dummyImplModifierList: string[]
    dumpSerialized: boolean
    declarationTable: DeclarationTable
}

export class PeerGeneratorVisitor implements GenericVisitor<stringOrNone[]> {
    private typesToGenerate: string[] = []
    private seenAttributes = new Set<string>()
    private readonly sourceFile: ts.SourceFile
    private interfacesToGenerate: Set<string>
    private printers: Printers
    private dumpSerialized: boolean
    declarationTable: DeclarationTable

    static readonly serializerBaseMethods = serializerBaseMethods()
    readonly typeChecker: ts.TypeChecker

    readonly peerFile: PeerFile

    constructor(options: PeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.typeChecker = options.typeChecker
        this.interfacesToGenerate = options.interfacesToGenerate
        this.printers = new Printers(
            new IndentedPrinter(),
            new IndentedPrinter(options.outputC),
            new IndentedPrinter(options.nativeModuleMethods),
            new IndentedPrinter(options.nativeModuleEmptyMethods),
            new IndentedPrinter(options.nodeTypes),
            new IndentedPrinter(options.apiHeaders),
            new IndentedPrinter(options.apiHeadersList),
            new IndentedPrinter(options.dummyImpl),
            new IndentedPrinter(options.dummyImplModifiers),
            new IndentedPrinter(options.dummyImplModifierList)
        )
        this.dumpSerialized = options.dumpSerialized
        this.declarationTable = options.declarationTable
        this.peerFile = new PeerFile(this.sourceFile.fileName, this.printers)
    }

    assignName(type: ts.TypeNode, name: string, optional: boolean) {
        let current = this.namedTypes.get(type)
        if (!current) {
            current = [optional ? "" : name, optional ? name : `Optional_${name}`]
        } else {
            current[optional ? 1 : 0] = name
        }
        this.namedTypes.set(type, current)
    }

    requestType(name: string|undefined, type: ts.TypeNode) {
        this.declarationTable.requestType(name, type)
    }

    defaultImports() {
        return [
            `import { runtimeType, withLength, withLengthArray, RuntimeType } from "./SerializerBase"`,
            `import { Serializer } from "./Serializer"`,
            `import { int32 } from "@koalaui/common"`,
            `import { KPointer } from "./types"`,
            `import { nativeModule } from "./NativeModule"`,
            `import { PeerNode, Finalizable, nullptr } from "./Interop"`,
            `import { ArkUINodeType } from "./ArkUINodeType"`,
            `import { ArkComponent } from "@arkoala/arkui/ArkComponent"`
        ]
    }

    visitWholeFile(): stringOrNone[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))

        this.defaultImports().forEach(it => this.printTS(it))
        this.peerFile.print()

        return this.printers.TS.getOutput()
    }

    resultC(): string[] {
        return this.printers.C.getOutput()
    }

    private isRootMethodInheritor(decl: ts.ClassDeclaration | ts.InterfaceDeclaration): boolean {
        if (ts.isClassDeclaration(decl)) {
            return isCommonMethodOrSubclass(this.typeChecker, decl)
        }
        return false

    }

    private isCallableSignatureInterface(name: string|undefined): boolean {
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
        } else if (ts.isVariableStatement(node) ||
            ts.isExportDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            node.kind == ts.SyntaxKind.EndOfFileToken) {
            // Do nothing.
        } else {
            throw new Error(`Unknown node: ${node.kind}`)
        }
    }

    private processClass(node: ts.ClassDeclaration): void {
        if (!this.needsPeer(node)) return
        const collapsedMethods = this.collapseOverloads(node)

        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        // We don't know what comes first ButtonAtrtribute or ButtonInterface.
        // Both will contribute to the peer class.
        const peer = this.peerFile.getOrPutPeer(componentName)

        this.populatePeer(node, peer)
        const peerMethods = collapsedMethods
            .map(it => this.processMethodOrCallable(it, peer))
            .filter(it => it != undefined) as PeerMethod[]
        peer.methods.push(...peerMethods)

        this.createComponentAttributesDeclaration(node, peer)
        this.generateAttributesValuesInterfaces()
        this.nativeModulePrint(node, collapsedMethods)

        this.printNodeType(node)
    }

    processInterface(node: ts.InterfaceDeclaration) {
        if (!this.isFriendInterface(node)) return

        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        // We don't know what comes first ButtonAtrtribute or ButtonInterface.
        // Both will contribute to the peer class.
        const peer = this.peerFile.getOrPutPeer(componentName)

        const collapsedMethods = this.collapseOverloads(node)
        const peerMethods = collapsedMethods
            .filter(it => ts.isCallSignatureDeclaration(it.member))
            .map(it => this.processMethodOrCallable(it, peer, identName(node)!))
            .filter(it => it != undefined) as PeerMethod[]
        peer.methods.push(...peerMethods)
        this.nativeModulePrint(node, collapsedMethods)
    }

    processConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
    }

    generateParams(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => {
            let mappedType = mapType(this.typeChecker, param.type)
            return `${nameOrNull(param.name)}${param.questionToken ? "?" : ""}: ${mappedType}`
        }).join(", ")
    }

    generateValues(argConvertors: ArgConvertor[]): stringOrNone {
        return argConvertors?.map(it => `${it.param}`).join(", ")
    }

    printTS(value: stringOrNone) {
        this.printers.TS.print(value)
    }

    printC(value: stringOrNone) {
        this.printers.C.print(value)
    }

    printAPI(value: stringOrNone) {
        this.printers.api.print(value)
    }

    printDummy(value: stringOrNone) {
        this.printers.dummyImpl.print(value)
    }

    printDummyModifier(value: stringOrNone) {
        this.printers.dummyImplModifiers.print(value)
    }

    printDummyModifierList(value: stringOrNone) {
        this.printers.dummyImplModifierList.print(value)
    }

    processMethodOrCallable(
        { member: method, collapsed: collapsed }: MaybeCollapsedMethod,
        peer: PeerClass,
        parentName?: string
    ): PeerMethod|undefined {
        const isCallSignature = ts.isCallSignatureDeclaration(method)
        // Some method have other parents as part of their names
        // Such as the ones coming from thr friend interfaces
        // E.g. ButtonInterface instead of ButtonAttribute
        const originalParentName = parentName ?? peer.originalClassName!
        const methodName = isCallSignature ? `_set${peer.componentName}Options` : identName(method.name)!

        if (PeerGeneratorConfig.ignorePeerMethod.includes(methodName)) return

        method.parameters.map((param, index) => {
            if (param.type)
                this.requestType(`Type_${originalParentName}_${methodName}_Arg${index}`, param.type)
        })
        const hasReceiver = true // TODO: make it false for non-method calls.
        const argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        const retConvertor = this.retConvertor(method.type)

        const peerMethod = new PeerMethod(
            peer,
            originalParentName,
            methodName,
            argConvertors,
            retConvertor,
            hasReceiver,
            isCallSignature,
            collapsed?.paramsDecl ?? this.generateParams(method.parameters),
            collapsed?.paramsUsage ?? this.generateValues(argConvertors),
            this.dumpSerialized
        )
        console.log(`processing ${peerMethod.originalParentName}.${peerMethod.fullMethodName}`)

        // this.processPeerMethod(peer, peerMethod)

        return peerMethod
    }

    pushIndentBoth() {
        this.printers.TS.pushIndent()
        this.printers.C.pushIndent()
    }
    popIndentBoth() {
        this.printers.TS.popIndent()
        this.printers.C.popIndent()
    }
    pushIndentTS() {
        this.printers.TS.pushIndent()
    }
    popIndentTS() {
        this.printers.TS.popIndent()
    }
    pushIndentC() {
        this.printers.C.pushIndent()
    }
    popIndentC() {
        this.printers.C.popIndent()
    }
    pushIndentAPI() {
        this.printers.api.pushIndent()
    }
    popIndentAPI() {
        this.printers.api.popIndent()
    }
    pushIndentAPIList() {
        this.printers.apiList.pushIndent()
    }
    popIndentAPIList() {
        this.printers.apiList.popIndent()
    }
    pushIndentDummyImpl() {
        this.printers.dummyImpl.pushIndent()
    }
    popIndentDummyImpl() {
        this.printers.dummyImpl.popIndent()
    }
    pushIndentDummyModifiers() {
        this.printers.dummyImplModifiers.pushIndent()
    }
    popIndentDummyModifiers() {
        this.printers.dummyImplModifiers.popIndent()
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
        }
    }

    private renameToComponent(name: string): string {
        return name
            .replace("Attribute", "")
            .replace("Method", "")
            .replace("Interface", "")
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration, peer: PeerClass): void {
        const koalaComponent = peer.koalaComponentName
        if (PeerGeneratorConfig.invalidAttributes.includes(koalaComponent)) {
            this.printTS(`export interface ${koalaComponent}Attributes {}`)
            return
        }
        this.printTS(peer.attributeInterfaceHeader())
        this.pushIndentTS()
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(child)
            }
        })
        this.popIndentTS()
        this.printTS("}")
    }

    private processOptionAttribute(method: ts.MethodDeclaration | ts.MethodSignature): void {
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
        const type = this.argumentType(methodName, method.parameters)
        this.printTS(`${methodName}?: ${type}`)
    }

    private argumentType(methodName: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
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

            this.typesToGenerate.push(
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
            this.typesToGenerate.push(
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

    private generateAttributesValuesInterfaces() {
        this.typesToGenerate.forEach((value: string) => {
            this.printTS(value)
        })
    }

    private nameOrEmpty(member: ts.MethodDeclaration | ts.CallSignatureDeclaration): string {
        if (ts.isMethodDeclaration(member)) return member.name.getText()
        if (ts.isCallSignatureDeclaration(member)) return ""
        throw new Error("Unsupported: " + asString(member))
    }
    private collapseOverloads(node: ts.ClassDeclaration|ts.InterfaceDeclaration): MaybeCollapsedMethod[] {
        const methods = (node.members as ts.NodeArray<ts.Node>).filter(
            it => (ts.isMethodDeclaration(it) || ts.isCallSignatureDeclaration(it))
        ) as (ts.MethodDeclaration | ts.CallSignatureDeclaration)[]

        const groupedByName = new Map<string, (ts.MethodDeclaration|ts.CallSignatureDeclaration)[]>(
            methods.map(it => [this.nameOrEmpty(it), []])
        )
        methods.forEach(it => {
            groupedByName.get(this.nameOrEmpty(it))?.push(it)
        })

        return [...groupedByName.keys()].map(name => {
            const overloads = groupedByName.get(name)!
            if (overloads.length == 1) {
                return {
                    member: overloads[0]
                }
            }

            const maxParamsLength = Math.max(...overloads.map(it => it.parameters.length))

            const paramsCollapsed: { types: ts.TypeNode[], name: string, optional?: ts.QuestionToken }[] =
                Array.from({ length: maxParamsLength }, (_, i) => {
                    const typesToUnion = overloads.map(overload =>
                        overload.parameters[i]?.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
                    )
                    return {
                        types: typesToUnion,
                        name: `arg${i}`,
                        optional: overloads.some(overload => overload.parameters[i]?.questionToken)
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
                        ts.factory.createUnionTypeNode(types)
                    )
                )

            const paramsDecl = paramsCollapsed
                .map(it => {
                    const questionToken = it.optional ? "?" : ""
                    const collapsedType = it.types.map(it => {
                        if (it.kind == ts.SyntaxKind.UndefinedKeyword) {
                            return "undefined"
                        }
                        if (ts.isFunctionTypeNode(it)) {
                            return `(${it.getText()})`
                        }
                        return it.getText()
                    }).join(" | ")

                    return `${it.name}${questionToken}: ${collapsedType}`
                })
                .join(", ")

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
                    paramsDecl: paramsDecl,
                    paramsUsage: paramsUsage
                }
            }
        })
    }

    namedTypes = new Map<ts.TypeNode, [string, string]>()
    getTypeName(type: ts.TypeNode, optional: boolean = false): string {
        let result = this.namedTypes.get(type)
        let index = optional ? 1 : 0
        if (!result || result[index] == "") {
            let name = this.computeTypeName(type, optional)
            this.requestType(name, type)
            return name
        }
        return result[index]
    }

    computeTypeName(type: ts.TypeNode, optional: boolean = false): string {
        return this.declarationTable.getTypeName(type, optional)
    }

    classNameIfInterface(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        if (clazz.name === undefined) {
            throw new Error(`Encountered nameless ${asString(clazz)} in ${asString(clazz.parent)}`)
        }
        let name = clazz.name
        if (ts.isClassDeclaration(clazz)) return ts.idText(name)
        if (ts.isInterfaceDeclaration(clazz) &&
            ts.idText(name).endsWith("Interface")) {
            // Do we want to convert ButtonInterface to ButtonAttribute here?
            // Most probably yes. Will do it here.
            // For now we just leave ButtonInterface.
            return ts.idText(name)
        }
        throw new Error(`Expected a class or a friend interface: ${asString(clazz)}`)
    }

    private nativeModulePrint(parent: ts.ClassDeclaration|ts.InterfaceDeclaration, methods: MaybeCollapsedMethod[]): void {
        const component = this.classNameIfInterface(parent)

        methods.forEach(maybeCollapsedMethod => {
            const basicParameters = maybeCollapsedMethod.member.parameters
                .map(it => this.argConvertor(it))
                .map(it => {
                    if (it.useArray) {
                        const array = `${it.param}Serializer`
                        return `${it.param}Array: Uint8Array, ${array}Length: int32`
                    } else {
                        return `${it.param}: ${it.interopType(true)}`
                    }
                })
            const parameters = ["ptr: NodePointer"]
                .concat(basicParameters)
                .join(", ")

            const originalName = ts.isCallSignatureDeclaration(maybeCollapsedMethod.member) ?
                `_set${this.renameToComponent(component)}Options` :
                ts.idText(maybeCollapsedMethod.member.name as ts.Identifier)
            const implDecl = `_${component}_${originalName}(${parameters}): void`

            this.printers.nativeModule.print(implDecl)
            this.printers.nativeModuleEmpty.print(`${implDecl} { console.log("${originalName}") }`)
        })
    }

    private printNodeType(node: ts.ClassDeclaration): void {
        this.printers.nodeTypes.print(
            this.renameToComponent(nameOrNull(node.name)!)
        )
    }
}

function mapCInteropRetType(type: ts.TypeNode): string {
    if (type.kind == ts.SyntaxKind.VoidKeyword) {
        return `void`
    }
    if (type.kind == ts.SyntaxKind.NumberKeyword) {
        return `KInt`
    }
    if (ts.isTypeReferenceNode(type)) {
        let name = identName(type.typeName)!
        /* HACK, fix */
        if (name.endsWith("Attribute")) return "void"
        switch (name) {
            /* ANOTHER HACK, fix */
            case "T": return "void"
            case "UIContext": return "KNativePointer"
        }
        console.log(`WARNING: unhandled return type ${type.getText()}`)
        return `void`
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
        if (type.types.length == 2 && type.types[1].kind == ts.SyntaxKind.UndefinedKeyword) return `void`
    }
    throw new Error(type.getText())
}
