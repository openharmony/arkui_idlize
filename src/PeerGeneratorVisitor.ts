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
    nameOrNull,
    getDeclarationsByNode,
    stringOrNone,
    typeOrUndefined,
    capitalize
} from "./util"
import { GenericVisitor } from "./options"
import { IndentedPrinter } from "./IndentedPrinter"
import {
    AggregateConvertor,
    AnyConvertor, ArgConvertor, ArrayConvertor, BooleanConvertor, EmptyConvertor, EnumConvertor, FunctionConvertor, InterfaceConvertor, LengthConvertor, TypedConvertor, NumberConvertor,
    StringConvertor, UndefinedConvertor, UnionConvertor
} from "./Convertors"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER,
    STRING,
    OBJECT,
    BOOLEAN,
    UNDEFINED
}

/**
 * Theory of operations.
 *
 * We use type definition as "grammar", and perform recursive descent to terminal nodes of such grammar
 * generating serialization code. We use TS typechecker to analyze compound and union types and generate
 * universal finite automata to serialize any value of the given type.
 */

let serializerSeen = new Set<string>()

interface TypeAndName {
    type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined
    name: string
}

export class PeerGeneratorVisitor implements GenericVisitor<stringOrNone[]> {
    private typesToGenerate: string[] = []
    private seenAttributes = new Set<string>()
    private printerNativeModule: IndentedPrinter
    private printerSerializerC: IndentedPrinter
    private printerSerializerTS: IndentedPrinter
    private serializerRequests: TypeAndName[] = []

    constructor(
        private sourceFile: ts.SourceFile,
        private typeChecker: ts.TypeChecker,
        private interfacesToGenerate: Set<string>,
        nativeModuleMethods: string[],
        outputC: string[],
        outputSerializersTS: string[],
        outputSerializersC: string[]
    ) {
        this.printerC = new IndentedPrinter(outputC)
        this.printerNativeModule = new IndentedPrinter(nativeModuleMethods)
        this.printerSerializerC = new IndentedPrinter(outputSerializersC)
        this.printerSerializerTS = new IndentedPrinter(outputSerializersTS)
    }

    serializerName(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined): string {
        if (!serializerSeen.has(name)) {
            this.serializerRequests.push({ type, name })
            serializerSeen.add(name)
        }
        return `write${name}`
    }

    deserializerName(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined): string {
        if (!serializerSeen.has(name)) {
            this.serializerRequests.push({ type, name })
            serializerSeen.add(name)
        }
        return `read${name}`
    }

    visitWholeFile(): stringOrNone[] {
        let isCommon = this.sourceFile.fileName.endsWith("common.d.ts") ?? false;
        [
            `import { runtimeType, functionToInt32, withLength, withLengthArray } from "../../utils/ts/SerializerBase"`,
            `import { Serializer } from "./Serializer"`,
            isCommon ? undefined : `import { ArkComponentPeer, ArkComponentAttributes } from "./common"`,
            `import { int32 } from "../../utils/ts/types"`,
            `import { nativeModule } from "./NativeModule"`,
            `import { PeerNode, KPointer, nullptr } from "../../utils/ts/Interop"`,
        ].forEach(it => this.printTS(it))
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))

        this.serializerRequests.forEach(it => {
            this.generateSerializer(it.name, it.type)
            this.generateDeserializer(it.name, it.type)
        })

        return this.printerTS.output
    }

    resultC(): string[] {
        return this.printerC.output
    }

    needsPeer(type: ts.Identifier | undefined): boolean {
        let name = type?.text
        if (!name) return false
        if (this.interfacesToGenerate.size > 0) {
            return this.interfacesToGenerate.has(name)
        }
        if (name?.endsWith("Attribute") && name != "ComputedBarAttribute") return true
        if (name === "CommonMethod") return true
        return false
    }

    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node) && this.needsPeer(node.name)) {
            this.processClass(node)
        } else if (ts.isInterfaceDeclaration(node) && this.needsPeer(node.name)) {
            this.processInterface(node)
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, (node) => this.visit(node));
        }
    }

    processClass(node: ts.ClassDeclaration) {
        if (!this.needsPeer(node.name)) return
        this.prologue(node)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.processConstructor(child)
            } else if (ts.isMethodDeclaration(child)) {
                this.processMethod(node, child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.processApplyMethod(node)
        this.epilogue()

        this.createComponentAttributesDeclaration(node)
        this.generateAttributesValuesInterfaces()

        this.printerNativeModule.pushIndent()
        node.members.forEach(it => {
            if (ts.isMethodDeclaration(it)) {
                this.collectMethod(it, node)
            }
        })
        this.printerNativeModule.popIndent()
    }

    processInterface(node: ts.InterfaceDeclaration) {
        if (!this.needsPeer(node.name)) return
        this.prologue(node)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.processConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.processMethod(node, child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.processApplyMethod(node)
        this.popIndentTS()
        if (false) {
            this.createComponentAttributesDeclaration(node)
            this.pushIndentTS()
            node.members.forEach(child => {
                if (ts.isMethodSignature(child)) {
                    this.processOptionAttribute(child)
                }
            })
        }
        this.epilogue()
        this.generateAttributesValuesInterfaces()
    }

    processConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
    }

    mapType(type: ts.TypeNode | undefined): string {
        if (type && ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
            if (declaration.length == 0 || ts.isTypeParameterDeclaration(declaration[0])) return "any"
        }
        if (type && ts.isImportTypeNode(type)) {
            return `/* imported */ ${asString(type.qualifier)}`
        }
        return type?.getText(this.sourceFile) ?? "any"
    }

    generateParams(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param =>
            `${nameOrNull(param.name)}${param.questionToken ? "?" : ""}: ${this.mapType(param.type)}`
        ).join(", ")
    }

    generateValues(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => `${nameOrNull(param.name)}`).join(", ")
    }

    printTS(value: stringOrNone) {
        this.printerTS.print(value)
    }

    printC(value: stringOrNone) {
        this.printerC.print(value)
    }

    seenMethods = new Set<string>()

    processMethod(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, method: ts.MethodDeclaration | ts.MethodSignature) {
        let isComponent = false
        let methodName = method.name.getText(this.sourceFile)
        const componentName = ts.idText(clazz.name as ts.Identifier)
        const argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        const retConvertor = this.retConvertor(method.type)
        const suffix = this.generateCMacroSuffix(argConvertors, retConvertor)
        const maybeCRetType = this.maybeCRetType(retConvertor)
        const cParameterTypes = this.generateCParameterTypes(argConvertors)

        console.log(`processing ${componentName}.${methodName}`)
        if (this.seenMethods.has(methodName)) {
            console.log(`WARNING: ignore duplicate method ${methodName}`)
            return
        }
        this.seenMethods.add(methodName)
        this.printTS(`${methodName}${isComponent ? "Attribute" : ""}(${this.generateParams(method.parameters)}) {`)
        let cName = `_${componentName}_${methodName}Impl`
        this.printC(`${this.generateCReturnType(retConvertor)} ${cName}(${this.generateCParameters(argConvertors)}) {`)
        this.pushIndentBoth()
        if (isComponent) {
            this.printTS(`if (this.checkPriority("${methodName}")) {`)
            this.pushIndentTS()
            this.printTS(`this.peer?.${methodName}Attribute(${this.generateValues(method.parameters)})`)
            this.popIndentTS()
            this.printTS(`}`)
        } else {
            let isStub = false
            if (isStub) {
                this.printTS(`throw new Error("${methodName}Attribute() is not implemented")`)
            } else {
                let name = `${methodName}Impl`
                this.generateNativeBody(componentName, name, argConvertors)
            }
        }
        this.popIndentBoth()
        this.printC(`}`)
        this.printC(`KOALA_INTEROP_${suffix}(${cName}, ${maybeCRetType}${cParameterTypes})`)
        this.printC(` `)

        this.printTS(`}`)
    }

    generateCParameters(argConvertors: ArgConvertor[]): string {
        return argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t* ${it.param}Array, int32_t ${it.param}Length`
            } else {
                return `${it.interopType()} ${it.param}`
            }
        }).join(", ")
    }

    generateCParameterTypes(argConvertors: ArgConvertor[]): string {
        return argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t, int32_t`
            } else {
                return it.nativeType()
            }
        }).join(", ")
    }

    generateCReturnType(retConvertor: RetConvertor): string {
        return retConvertor.nativeType()
    }

    maybeCRetType(retConvertor: RetConvertor): string {
        if (retConvertor.isVoid) return ""
        return `${retConvertor.nativeType()}, `
    }

    generateCMacroSuffix(argConvertors: ArgConvertor[], retConvertor: RetConvertor) {
        let counter = 0
        argConvertors.forEach(it => {
            if (it.useArray) {
                counter += 2
            } else {
                counter += 1
            }
        })
        return `${retConvertor.macroSuffixPart()}${counter}`
    }

    generateNativeBody(clazzName: string, name: string, argConvertors: ArgConvertor[] /*clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, method: ts.MethodDeclaration | ts.MethodSignature*/) {
        this.pushIndentBoth()
        let scopes = new Array<ArgConvertor>()
        argConvertors
            .filter(it => it.isScoped)
            .map(it => scopes.push(it))
        scopes.forEach(it => {
            this.pushIndentTS()
            this.printTS(it.scopeStart?.(it.param))
        })
        argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                this.printTS(`let ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToTSSerial(it.param, it.param, this.printerTS)
                this.printC(`ArgDeserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                this.printC(`${it.nativeType()} ${it.param}Value;`)
                it.convertorToCDeserial(it.param, `${it.param}Value`, this.printerC)
            }
        })
        this.printTS(`nativeModule()._${clazzName}_${name}(`)
        this.pushIndentTS()
        argConvertors.forEach((it, index) => {
            let maybeComma = index == argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.printTS(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
                it.convertorTSArg(it.param, it.param, this.printerTS)
            this.printTS(maybeComma)

        })
        this.popIndentTS()
        this.printTS(`)`)
        scopes.reverse().forEach(it => {
            this.popIndentTS()
            this.printTS(it.scopeEnd!(it.param))
        })
        this.popIndentBoth()
    }

    private printerTS = new IndentedPrinter()
    private printerC = new IndentedPrinter()

    pushIndentBoth() {
        this.printerTS.pushIndent()
        this.printerC.pushIndent()
    }
    popIndentBoth() {
        this.printerTS.popIndent()
        this.printerC.popIndent()
    }

    pushIndentTS() {
        this.printerTS.pushIndent()
    }
    popIndentTS() {
        this.printerTS.popIndent()
    }
    pushIndentC() {
        this.printerC.pushIndent()
    }
    popIndentC() {
        this.printerC.popIndent()
    }

    typeConvertor(param: string, type: ts.TypeNode): ArgConvertor {
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return new AnyConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.UndefinedKeyword || type.kind == ts.SyntaxKind.VoidKeyword) {
            return new UndefinedConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            throw new Error("Unsupported null")
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return new NumberConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return new StringConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return new BooleanConvertor(param)
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)[0]
            if (!declaration) {
                // throw new Error(`Declaration not found: ${asString(type.typeName)}`)
                console.log(`WARNING: declaration not found: ${asString(type.typeName)}`)
                return new AnyConvertor(param)
            }
            if (asString(type.typeName) == "Length") {
                // Important common case.
                return new LengthConvertor(param)
            }
            if (ts.isEnumDeclaration(declaration) || ts.isEnumMember(declaration)) {
                return new EnumConvertor(param)
            }
            if (ts.isTypeAliasDeclaration(declaration)) {
                return this.typeConvertor(param, declaration.type)
            }
            if (ts.isInterfaceDeclaration(declaration)) {
                let ifaceName = ts.idText(declaration.name)
                if (ifaceName == "Array") {
                    if (ts.isTypeReferenceNode(type))
                        return new ArrayConvertor(param, this, type.typeArguments![0])
                    else {
                        return new EmptyConvertor(param)
                    }
                }
                return new InterfaceConvertor(param, this, type)
            }
            if (ts.isClassDeclaration(declaration)) {
                return new InterfaceConvertor(param, this, type)
            }
            if (ts.isTypeParameterDeclaration(declaration)) {
                console.log(declaration)
                return new AnyConvertor(param)
            }
            throw new Error(`Unknown kind: ${declaration.kind}`)
        }
        if (ts.isUnionTypeNode(type)) {
            return new UnionConvertor(param, this, type)
        }
        if (ts.isTypeLiteralNode(type)) {
            return new AggregateConvertor(param, this, type)
        }
        if (ts.isArrayTypeNode(type)) {
            return new ArrayConvertor(param, this, type.elementType)
        }
        if (ts.isLiteralTypeNode(type)) {
            if (type.literal.kind == ts.SyntaxKind.NullKeyword) {
                return new EmptyConvertor(param)
            }
            if (type.literal.kind == ts.SyntaxKind.StringLiteral) {
                return new StringConvertor(param)
            }
            throw new Error(`Unsupported literal type: ${type.literal.kind}` + type.getText(this.sourceFile))
        }
        if (ts.isTupleTypeNode(type)) {
            return new EmptyConvertor(param)
        }
        if (ts.isFunctionTypeNode(type)) {
            return new FunctionConvertor(param, this)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.typeConvertor(param, type.type)
        }
        if (ts.isImportTypeNode(type)) {
            return new TypedConvertor(asString(type.qualifier), type, param, this)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return new StringConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return new AnyConvertor(param)
        }
        console.log(type)
        throw new Error(`Cannot convert: ${asString(type)} ${type.getText(this.sourceFile)}`)
    }

    argConvertor(param: ts.ParameterDeclaration): ArgConvertor {
        if (!param.type) throw new Error("Type is needed")
        let paramName = asString(param.name)
        return this.typeConvertor(paramName, param.questionToken ? typeOrUndefined(param.type) : param.type)
    }

    retConvertor(typeNode?: ts.TypeNode): RetConvertor {
        const isVoid = (typeNode === undefined) ||
            (typeNode.kind == ts.SyntaxKind.VoidKeyword)

        return {
            isVoid: isVoid,
            nativeType: () => isVoid ? "void" : mapCInteropType(typeNode),
            macroSuffixPart: () => isVoid ? "V" : ""
        }
    }

    processProperty(property: ts.PropertyDeclaration | ts.PropertySignature) {
        throw new Error(`unexpected property ${property.name.getText(this.sourceFile)}`)
    }

    prologue(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        let clazzName = nameOrNull(node.name)!
        let component = clazzName.replace("Attribute", "")
        let isComponent = false
        if (component == "CommonMethod") {
            component = "Component"
            isComponent = true
        }
        this.printTS(`export class Ark${component}Peer extends ${isComponent ? "PeerNode" : "ArkComponentPeer"} {`)
        this.pushIndentTS()
        this.printTS(`attributes?: Ark${component}Attributes`)
    }

    epilogue() {
        this.popIndentTS()
        this.printTS(`}`)
    }

    processApplyMethod(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        let clazzName = nameOrNull(node.name)!
        let isCommon = clazzName == "CommonMethodAttribute"
        let component = clazzName.replace("Attribute", "")
        if (component == "CommonMethod") {
            component = "Component"
        }
        const interfaceName = `Ark${component}Attributes`
        this.printTS(`applyAttributes${isCommon ? `<T extends ${interfaceName}>` : ``}(attributes: ${isCommon ? `T` : interfaceName}): void {`)
        this.pushIndentTS()
        this.printTS(isCommon ? undefined : `super.applyAttributes(attributes)`)
        this.popIndentTS()
        this.printTS(`}`)
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const className = nameOrNull(node.name)!
        let component = className.replace("Attribute", "")
        let extendsClause = "extends ArkComponentAttributes"
        if (component == "CommonMethod") {
            component = "Component"
            extendsClause = ""
        }
        this.printTS(`export interface Ark${component}Attributes ${extendsClause} {`)
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
                    if (!ts.isPropertySignature(it)) {
                        throw new Error(`Expected type literal property to be ts.PropertySignature: ${it}`)
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

        return parameters.map(it => this.mapType(it.type)).join(', ')
    }

    private createParameterType(
        name: string,
        attributes: { name: string, type: ts.TypeNode, questionToken: boolean }[]
    ): string {
        const attributeDeclarations = attributes
            .map(it => `\n  ${it.name}${it.questionToken ? "?" : ""}: ${it.type.getText()}`)
            .join('')
        return `export interface ${name} {${attributeDeclarations}\n}`
    }

    private generateAttributesValuesInterfaces() {
        this.typesToGenerate.forEach((value: string) => {
            this.printTS(value)
        })
    }

    private collectMethod(node: ts.MethodDeclaration, parent: ts.ClassDeclaration): void {
        // TODO: use alternative in-time emitter, like printC.
        if (parent.name === undefined) throw new Error(`Encountered nameless method ${node}`)
        const component = ts.idText(parent.name)
        const method = node.name.getText()
        const parameters = node.parameters
            .map(it => this.argConvertor(it))
            .map(it => {
                if (it.useArray) {
                    const array = `${it.param}Serializer`
                    return `${it.param}Array: Uint8Array, ${array}Length: int32`
                } else {
                    return `${it.param}: ${it.nativeType!()}`
                }
            })
            .join(", ")
        this.printerNativeModule.print(`_${component}_${method}Impl(${parameters}): void`)
    }

    private generateSerializer(name: string, type:  ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        this.printerSerializerTS.print(`write${name}(value: ${name}) {`)
        this.printerSerializerTS.pushIndent()
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        if (declarations.length > 0) {
            let declaration = declarations[0]
            this.printerSerializerTS.print(`const valueSerializer = this`)
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => {
                        let typeConvertor = this.typeConvertor("value", it.type!)
                        let fieldName = asString(it.name)
                        this.printerSerializerTS.print(`let value_${fieldName} = value.${fieldName}`)
                        typeConvertor.convertorToTSSerial(`value`, `value_${fieldName}`, this.printerSerializerTS)
                    })
            }
        } else {
            this.printerSerializerTS.print(`throw new Error("Implement ${name} manually")`)
        }
        this.printerSerializerTS.popIndent()
        this.printerSerializerTS.print(`}`)
    }
    private generateDeserializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        this.printerSerializerC.print(`${name} read${name}() {`)
        this.printerSerializerC.pushIndent()
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        if (declarations.length > 0) {
            this.printerSerializerC.print(`${name} value;`)
            this.printerSerializerC.print(`const Deserializer& valueDeserializer = &this;`)
            let declaration = declarations[0]
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => {
                        let typeConvertor = this.typeConvertor("value", it.type!)
                        typeConvertor.convertorToCDeserial(`value`, `value.${asString(it.name)}`, this.printerSerializerC)
                    })
            }
            this.printerSerializerC.print(`return value;`)
        } else {
            this.printerSerializerC.print(`throw new Error("Implement ${name} manually");`)
        }
        this.printerSerializerC.popIndent()
        this.printerSerializerC.print(`}`)
    }
}

function mapCInteropType(type: ts.TypeNode): string {
    if (ts.isTypeReferenceNode(type)) {
        let name = ts.idText(type.typeName as ts.Identifier)
        switch (name) {
            case "number": return "KInt"
        }
        return "KPointer"
    }
    return "Any"
}

interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}

export function nativeModuleDeclaration(methods: string[]): string {
    return `
import { int32 } from "../../utils/types"

let theModule: NativeModule | undefined = undefined

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    theModule = require("nativeModule") as NativeModule
    return theModule
}

export interface NativeModule {
${methods.join("\n")}
}
`
}


export function bridgeCcDeclaration(bridgeCc: string[]): string {
    return `
#include "Serializer.h"
#include "Interop.h"

using std;

${bridgeCc.join("\n")}
`
}

export function makeTSSerializer(lines: string[]): string {
    return `
import { SerializerBase, runtimeTypes } from "../../utils/ts/SerializerBase"

export class Serializer extends SerializerBase {
${lines.join("\n")}
}
`
}

export function makeCDeserializer(lines: string[]): string {
    return `
#include "Serializer.h"

class Deserializer : BaseDeserializer {
${lines.join("\n")}
}
`
}
