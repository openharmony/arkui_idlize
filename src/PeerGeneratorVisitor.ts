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
import { asString, nameOrNull as nameOrUndefined, getDeclarationsByNode, stringOrNone } from "./util"
import { GenericVisitor } from "./options"

enum RuntimeType {
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

export class PeerGeneratorVisitor implements GenericVisitor<stringOrNone[]> {
    private typesToGenerate: string[] = []

    constructor(private sourceFile: ts.SourceFile, private typeChecker: ts.TypeChecker,
        private interfacesToGenerate: Set<string>) {
    }

    private output: stringOrNone[] = []

    visitWholeFile(): stringOrNone[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.output
    }

    needsPeer(type: ts.Identifier | undefined): boolean {
        let name = type?.text
        if (!name) return false
        if (this.interfacesToGenerate.size > 0) {
            return this.interfacesToGenerate.has(name)
        }
        if (name?.endsWith("Attribute")) return true
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
                this.processMethod(child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.processApplyMethod(node)
        this.popIndent()
        this.print('}')
        this.prepareInterfaceAttributes(node)
        this.pushIndent()
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(child)
            }
        })
        this.epilogue()
        this.generateAttributesValuesInterfaces()
    }

    processInterface(node: ts.InterfaceDeclaration) {
        if (!this.needsPeer(node.name)) return
        this.prologue(node)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.processConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.processMethod(child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.processApplyMethod(node)
        this.popIndent()
        this.print('}')
        if (false) {
            this.prepareInterfaceAttributes(node)
            this.pushIndent()
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

    generateParams(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => `${nameOrUndefined(param.name)}${param.questionToken ? "?" : ""}: ${param.type?.getText(this.sourceFile)}`).join(", ")
    }

    generateValues(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => `${nameOrUndefined(param.name)}`).join(", ")
    }

    print(value: stringOrNone) {
        if (value) this.output.push(this.indented(value))
    }

    processMethod(method: ts.MethodDeclaration | ts.MethodSignature) {
        let isComponent = false
        let methodName = method.name.getText(this.sourceFile)
        console.log("processsing", methodName)
        this.pushIndent()
        this.print(`${methodName}${isComponent ? "Attribute" : ""}(${this.generateParams(method.parameters)}) {`)
        if (isComponent) {
            this.print(`if (this.checkPriority("${methodName}")) {`)
            this.pushIndent()
            this.print(`this.peer?.${methodName}Attribute(${this.generateValues(method.parameters)})`)
            this.popIndent()
            this.print(`}`)
        } else {
            let isStub = false
            if (isStub) {
                this.print(`throw new Error("${methodName}Attribute() is not implemented")`)
            } else {
                if (!methodName.startsWith("on"))
                    this.generateNativeCall(method)
            }
        }
        this.print(`}`)
        this.popIndent()
    }

    generateNativeCall(method: ts.MethodDeclaration | ts.MethodSignature) {
        this.pushIndent()
        let argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        let name = `_${asString(method.name)}Impl`
        let scopes = new Array<ArgConvertor>()
        argConvertors
            .filter(it => it.isScoped)
            .map(it => scopes.push(it))
        scopes.forEach(it => {
            this.pushIndent()
            this.print(it.scopeStart?.(it.param))
        })
        argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                this.print(`let ${it.param}Array = new Uint8Array(${size})`)
                this.print(`let ${it.param}Index = 0`)
                it.convertorToArray(it.param, it.value)
            }
        })
        this.print(`nativeModule().${name}(`)
        this.pushIndent()
        argConvertors.forEach((it, index) => {
            let maybeComma = index == argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.print(`${it.param}Array, ${it.param}Index`)
            else
                it.convertor(it.param, it.value)
            this.print(maybeComma)

        })
        this.popIndent()
        this.output.push(this.indented(`)`))
        scopes.reverse().forEach(it => {
            this.popIndent()
            this.print(it.scopeEnd!(it.param))
        })
        this.popIndent()
    }

    private indent = 0
    indented(input: string): string {
        let space = ""
        for (let i = 0; i < this.indent; i++) space += "  "
        return `${space}${input}`
    }
    pushIndent() {
        this.indent++
    }
    popIndent() {
        this.indent--
    }

    emptyConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [],
            estimateSize: () => 0,
            isScoped: false,
            useArray: false,
            convertor: () => { },
            convertorToArray: () => { }
        }
    }

    stringConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.STRING],
            isScoped: true,
            useArray: false,
            scopeStart: (param) => `withString(${param}, (${param}Ptr: KStringPtr) => {`,
            scopeEnd: () => '})',
            convertor: (param) => {
                this.print(`${param}Ptr`)
            },
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Index += serializeString(${param}Array, ${param}Index, ${value})`)
            },
            estimateSize: () => 32
        }
    }

    booleanConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.BOOLEAN],
            useArray: false,
            isScoped: false,
            convertor: (param, value) => this.print(`+${value}`),
            convertorToArray: (param, value) => {
                this.print(`${param}Index += serializeBoolean(${param}Array, ${param}Index, ${value})`)
            },
            estimateSize: () => 1
        }
    }

    anyConvertor(param: string, value: string): ArgConvertor {
        console.log("WARNING: any type convertor")
        return {
            param: param,
            value: value,
            runtimeTypes: [],
            isScoped: false,
            useArray: true,
            convertor: (param) => { throw new Error("Not for any") },
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Index += serializeAny(${param}Array, ${param}Index, ${value})`)
            },
            estimateSize: () => 32
        }
    }

    undefinedConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [],
            isScoped: false,
            useArray: false,
            convertor: (param) => this.print("nullptr"),
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Index += serializeNull(${param}Array, ${param}Index)`)
            },
            estimateSize: () => 8
        }
    }

    enumMemberConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.NUMBER], // Enums are integers in runtime.
            useArray: false,
            isScoped: false,
            convertor: (param, value) => this.print(`enumToInt32(${value})`),
            convertorToArray: (param) => {
                this.print(`${param}Index += serializeInt32(${param}Array, ${param}Index, enumToInt32(${value}))`)
            },
            estimateSize: () => 4
        }
    }

    unionConverter(param: string, value: string, type: ts.UnionTypeNode): ArgConvertor {
        let memberConvertors = type.types.map(member => this.typeConvertor(param, value, member))
        // Unique by serialization form.
        memberConvertors = [...new Map(memberConvertors.map(item => [item.runtimeTypes, item])).values()]
        return {
            param: param,
            value: value,
            runtimeTypes: memberConvertors.flatMap(it => it.runtimeTypes),
            isScoped: false,
            useArray: true,
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                this.print(`let ${value}Type = runtimeType(${value})`)
                // Save actual type being passed.
                this.print(`${param}Index += serializeInt32(${param}Array, ${param}Index, ${value}Type)`)
                this.checkUniques(param, memberConvertors)
                memberConvertors.forEach((it, index) => {
                    let typeName = type.types[index].getText(type.types[index].getSourceFile())
                    if (it.runtimeTypes.length == 0) {
                        console.log(`WARNING: branch for ${typeName} was consumed`)
                        return
                    }
                    let maybeElse = (index > 0) ? "else " : ""
                    let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                    let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                    this.print(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}${it} == ${value}Type${maybeComma2}`).join(" || ")}) {`)
                    this.pushIndent()
                    this.print(`let ${value}_${index}: ${typeName} = ${value} as ${typeName}`)
                    it.convertorToArray(param, `${value}_${index}`)
                    this.popIndent()
                    this.print(`}`)
                })
            },
            estimateSize: () => {
                let result = 0
                memberConvertors.forEach(it => {
                    let estimate = it.estimateSize()
                    if (result < estimate) result = estimate
                })
                return result + 4 /* 4 for type tag */
            }
        }
    }

    aggregateConvertor(param: string, value: string, type: ts.TypeLiteralNode): ArgConvertor {
        let memberConvertors = type
            .members
            .filter(ts.isPropertySignature)
            .map(member => {
                let memberName = ts.idText(member.name as ts.Identifier)
                let name = `${param}_${memberName}`
                return this.typeConvertor(param, name, member.type!)
            })
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.OBJECT, RuntimeType.UNDEFINED],
            isScoped: false,
            useArray: true,
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                let members = type
                    .members
                    .filter(ts.isPropertySignature)
                    .map(member => member.name)
                memberConvertors.forEach((it, index) => {
                    let memberName = ts.idText(members[index] as ts.Identifier)
                    this.print(`let ${it.value} = ${value}.${memberName}`)
                    it.convertorToArray(it.param, it.value) 
                })
            },
            estimateSize: () => {
                let result = 0
                memberConvertors.forEach(it => {
                    result += it.estimateSize()
                })
                return result
            }
        }
    }

    tupleConvertor(param: string, value: string, type: ts.TupleTypeNode): ArgConvertor {
        let memberConvertors = type
            .elements
            .filter(ts.isPropertySignature)
            .map(element => this.typeConvertor(param, value, element))
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.OBJECT, RuntimeType.UNDEFINED],
            isScoped: false,
            useArray: true,
            estimateSize: () => {
                let result = 0
                memberConvertors.forEach(it => result += it.estimateSize())
                return result 
            },
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                memberConvertors.forEach(it => {
                    it.convertorToArray(param, value)
                })
            }
        }
    }

    arrayConvertor(param: string, value: string, elementType: ts.TypeNode): ArgConvertor {
        let convertor = this.typeConvertor(param, "element", elementType)
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.OBJECT],
            isScoped: false,
            useArray: true,
            estimateSize: () => convertor.estimateSize() * 4,
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                // Array length.
                this.print(`${param}Index += this.serializeInt32(${param}Array, ${param}Index, ${param}.length)`)
                this.print(`for (let i = 0; i < ${param}.length; i++) {`)
                this.pushIndent()
                this.print(`let element = ${param}[i]`)
                convertor.convertorToArray(param, "element")
                this.popIndent()
                this.print(`}`)
            }
        }
    }

    numberConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.NUMBER],
            isScoped: false,
            useArray: false,
            estimateSize: () => 8,
            convertor: (param: string) => {
                this.print(param)
            },
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Index += serializeNumber(${param}Array, ${param}Index, ${value})`)
            }
        }
    }

    typeConvertor(param: string, value: string, type: ts.TypeNode): ArgConvertor {
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return this.anyConvertor(param, value)
        }
        if (type.kind == ts.SyntaxKind.UndefinedKeyword || type.kind == ts.SyntaxKind.VoidKeyword) {
            return this.undefinedConvertor(param, value)
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            throw new Error("Unsupported null")
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return this.numberConvertor(param, value)
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return this.stringConvertor(param, value)
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return this.booleanConvertor(param, value)
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)[0]
            if (!declaration) {
                throw new Error(`Declaration not found: ${asString(type.typeName)}`)
            }
            if (ts.isEnumDeclaration(declaration)) {
                return this.enumMemberConvertor(param, value)
            }
            if (ts.isTypeAliasDeclaration(declaration)) {
                return this.typeConvertor(param, value, declaration.type)
            }
            if (ts.isInterfaceDeclaration(declaration)) {
                let ifaceName = ts.idText(declaration.name)
                if (ifaceName == "Array") {
                    if (ts.isTypeReferenceNode(type))
                        return this.arrayConvertor(param, value, type.typeArguments![0])
                    else
                        return this.emptyConvertor(param, value)
                }
                return {
                    param: param,
                    value: value,
                    runtimeTypes: [RuntimeType.OBJECT],
                    estimateSize: () => 32,
                    useArray: true,
                    isScoped: false,
                    convertor: (param, value) => this.print(`${value}.peer`),
                    convertorToArray: (param, value) => {
                        this.print(`${param}Index += serialize${ifaceName}(${param}Array, ${param}Index, ${value})`)
                    }
                }
            }
            if (ts.isClassDeclaration(declaration)) {
                // TODO: fix
                return {
                    param: param,
                    value: value,
                    runtimeTypes: [RuntimeType.OBJECT],
                    estimateSize: () => 32,
                    useArray: true,
                    isScoped: false,
                    convertor: (param, value) => this.print(`${value}.peer`),
                    convertorToArray: (param, value) => {
                        this.print(`${param}Index += serializeClass${asString(declaration.name)}(${param}Array, ${param}Index, ${value})`)
                    }
                }
            }
            if (ts.isTypeParameterDeclaration(declaration)) {
                return this.anyConvertor(param, value)
            }
            if (ts.isEnumMember(declaration)) {
                return this.enumMemberConvertor(param, value)
            }
            throw new Error(`Unknown kind: ${declaration.kind}`)
        }
        if (ts.isUnionTypeNode(type)) {
            return this.unionConverter(param, value, type)
        }
        if (ts.isTypeLiteralNode(type)) {
            return this.aggregateConvertor(param, value, type)
        }
        if (ts.isArrayTypeNode(type)) {
            return this.arrayConvertor(param, value, type.elementType)
        }
        if (ts.isLiteralTypeNode(type)) {
            if (type.literal.kind == ts.SyntaxKind.NullKeyword) {
                return this.emptyConvertor(param, value)
            }
            if (type.literal.kind == ts.SyntaxKind.StringLiteral) {
                return this.stringConvertor(param, value)
            }
            throw new Error(`Unsupported literal type: ${type.literal.kind}` + type.getText(this.sourceFile))
        }
        if (ts.isTupleTypeNode(type)) {
            return this.tupleConvertor(param, value, type)
        }
        if (ts.isFunctionTypeNode(type)) {
            console.log("WARNING: functions are ignored")
            return this.emptyConvertor(param, value)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return {
                param: param,
                value: value,
                estimateSize: () => 32,
                runtimeTypes: [RuntimeType.OBJECT, RuntimeType.UNDEFINED],
                isScoped: false,
                useArray: false,
                convertor: (param: string, value: string) => {
                    this.print(param)
                },
                convertorToArray: (param: string, value: string) => {
                    this.print(`throw new Error()`)
                }
            }
        }
        if (ts.isImportTypeNode(type)) {
            let typeName = asString(type.qualifier)
            return {
                param: param,
                value: value,
                estimateSize: () => 32,
                runtimeTypes: [RuntimeType.OBJECT], // Assume imported are objects, not really always the case..
                isScoped: false,
                useArray: false,
                convertor: (param: string, value: string) => {
                    this.print(value)
                },
                convertorToArray: (param: string, value: string) => {
                    this.print(`${param}Index += this.serialize${typeName}(${param}Array, ${param}Index, ${value})`)
                }
            }
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return this.stringConvertor(param, value)
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return this.anyConvertor(param, value)
        }
        console.log(type)
        throw new Error(`Cannot convert: ${asString(type)} ${type.getText(this.sourceFile)}`)
    }

    checkUniques(param: string, convertors: ArgConvertor[]): void {
        for (let i = 0; i < convertors.length; i++) {
            for (let j = i + 1; j < convertors.length; j++) {
                let first = convertors[i].runtimeTypes
                let second = convertors[j].runtimeTypes
                first.forEach(value => {
                    let index = second.findIndex(it => it == value)
                    if (index != -1) {
                        console.log(`WARNING: Runtime type conflict in ${param}: could be ${RuntimeType[value]}`)
                        second.splice(index, 1)
                    }
                })
            }
        }
    }

    argConvertor(param: ts.ParameterDeclaration): ArgConvertor {
        if (!param.type) throw new Error("Type is needed")
        let paramName = asString(param.name)
        return this.typeConvertor(paramName, paramName, param.type)
    }

    processProperty(property: ts.PropertyDeclaration | ts.PropertySignature) {
        throw new Error(`unexpected property ${property.name.getText(this.sourceFile)}`)
    }

    prologue(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        let clazzName = nameOrUndefined(node.name)!
        let component = clazzName.replace("Attribute", "")
        let isComponent = false
        if (component == "CommonMethod") {
            component = "Component"
            isComponent = true
        }
        [
            `import { KStringPtr, withString } from "@koalaui/interop"`,
            isComponent ? undefined : `import { Ark${component}Component } from "./Ark${component}"`,
            isComponent ? undefined : `import { ArkComponentPeer } from "./ArkComponentPeer"`,
            `import { nativeModule } from "@koalaui/arkoala"`,
            `function runtimeType(value: any): number {`,
            `  let type = typeof value`,
            `  if (type == "number") return ${RuntimeType.NUMBER}`,
            `  if (type == "string") return ${RuntimeType.STRING}`,
            `  if (type == "undefined") return ${RuntimeType.UNDEFINED}`,
            `  if (type == "object") return ${RuntimeType.OBJECT}`,
            `  if (type == "boolean") return ${RuntimeType.BOOLEAN}`,
            `  throw new Error("bug: " + value)`,
            `}`,
            `export class Ark${component}Peer extends ${isComponent ? "PeerNode" : "ArkComponentPeer"} {`
        ].map(it => this.print(it))
        this.pushIndent()
        this.print(`attributes?: Ark${component}Attributes`)
        this.popIndent()
    }

    processApplyMethod(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        let clazzName = nameOrUndefined(node.name)!
        let isCommon = clazzName == "CommonMethodAttribute"
        let component = clazzName.replace("Attribute", "")
        if (component == "CommonMethod") {
            component = "Component"
        }
        const interfaceName = `Ark${component}Attributes`
        this.pushIndent()
        if (isCommon) {

        }
        this.print(`applyAttributes${isCommon ? `<T extends ${interfaceName}>` : ``}(attributes: ${isCommon ? `T` : interfaceName}): void {`)
        this.pushIndent()
        this.print(isCommon ? undefined : `super.applyAttributes(attributes)`)
        this.popIndent()
        this.print(`}`)
    }

    prepareInterfaceAttributes(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        let clazzName = nameOrUndefined(node.name)!
        let component = clazzName.replace("Attribute", "")
        if (component == "CommonMethod") {
            component = "Component"
        }
        this.print(`export interface Ark${component}Attributes ${component == "Component" ? "" : "extends ArkComponentAttributes"} {`)
    }

    processOptionAttribute(method: ts.MethodDeclaration | ts.MethodSignature) {
        let methodName = method.name.getText(this.sourceFile)
        let parameters = this.generateParams(method.parameters)
        if (parameters) {
            if (parameters.includes('=>')) {
                parameters = parameters.substring(parameters.indexOf(':') + 1, parameters.length)
            } else if (parameters.includes('{')) {
                const name = methodName.charAt(0).toUpperCase() + methodName.slice(1) + "ValuesType"
                this.typesToGenerate.push(`export interface ${name} { ${parameters.substring(parameters.indexOf(':') + 1, parameters.length).replace(/{|}/g, '')} }`)
                parameters = name
            } else if (parameters.split(':').length > 2) {
                const name = methodName.charAt(0).toUpperCase() + methodName.slice(1) + "ValuesType"
                this.typesToGenerate.push(`export interface ${name} { ${parameters} }`)
                parameters = name
            } else {
                parameters = parameters.substring(parameters.indexOf(':') + 1, parameters.length)
            }
        }
        if (parameters) {
            this.print(`${methodName}?:${parameters},`)
        }
    }

    generateAttributesValuesInterfaces() {
        this.typesToGenerate.forEach((value: string) => {
            this.print(value)
        })
    }

    epilogue() {
        this.popIndent()
        this.print(`}`)
    }
}

interface ArgConvertor {
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    estimateSize: () => number,
    scopeStart?: (param: string) => string
    scopeEnd?: (param: string) => string
    convertor: (param: string, value: string) => void
    convertorToArray: (param: string, value: string) => void
    param: string
    value: string
}
