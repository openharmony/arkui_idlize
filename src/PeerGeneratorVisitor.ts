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
    indentedBy,
    typeOrUndefined,
    capitalize
} from "./util"
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
    private seenAttributes = new Set<string>()

    constructor(
        private sourceFile: ts.SourceFile,
        private typeChecker: ts.TypeChecker,
        private interfacesToGenerate: Set<string>,
        private nativeModuleMethods: string[]
    ) {}

    private output: stringOrNone[] = []

    visitWholeFile(): stringOrNone[] {
        let isCommon = this.sourceFile.fileName.endsWith("common.d.ts") ?? false;
        [
            `import { runtimeType, Serializer, functionToInt32, withLength, withLengthArray } from "../../utils/Serialize"`,
                isCommon ? undefined : `import { ArkComponentPeer, ArkComponentAttributes } from "./common"`,
                `import { int32 } from "../../utils/types"`,
                `import { nativeModule } from "./NativeModule"`,
                `import { PeerNode } from "../../utils/Interop"`,
        ].forEach(it => this.print(it))
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.output
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

        node.members.forEach(it => {
            if (ts.isMethodDeclaration(it)) {
                this.collectMethod(it, node)
            }
        })
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
        this.popIndent()
        if (false) {
            this.createComponentAttributesDeclaration(node)
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
        return params?.map(param => `${nameOrNull(param.name)}${param.questionToken ? "?" : ""}: ${this.mapType(param.type)}`).join(", ")
    }

    generateValues(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => `${nameOrNull(param.name)}`).join(", ")
    }

    print(value: stringOrNone) {
        if (value) this.output.push(this.indented(value))
    }

    seenMethods = new Set<string>()

    processMethod(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, method: ts.MethodDeclaration | ts.MethodSignature) {
        let isComponent = false
        let methodName = method.name.getText(this.sourceFile)
        console.log("processing", methodName)
        if (this.seenMethods.has(methodName)) {
            console.log(`WARNING: ignore duplicate method ${methodName}`)
            return
        }
        this.seenMethods.add(methodName)
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
                this.generateNativeCall(clazz, method)
            }
        }
        this.print(`}`)
    }

    generateNativeCall(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, method: ts.MethodDeclaration | ts.MethodSignature) {
        this.pushIndent()
        let argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        let name = `${ts.idText(method.name as ts.Identifier)}Impl`
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
                this.print(`let ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToArray(it.param, it.value)
            }
        })
        let clazzName = ts.idText(clazz.name as ts.Identifier)
        this.print(`nativeModule()._${clazzName}_${name}(`)
        this.pushIndent()
        argConvertors.forEach((it, index) => {
            let maybeComma = index == argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.print(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
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
        return indentedBy(input, this.indent)
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
            nativeType: () => { throw new Error("Called empty convertor") },
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
            isScoped: false,
            useArray: false,
            //scopeStart: (param) => `withString(${param}, (${param}Ptr: KStringPtr) => {`,
            //scopeEnd: () => '})',
            convertor: (param) => {
                this.print(`${param}`)
            },
            nativeType: () => "string",
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Serializer.writeString(${value})`)
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
            nativeType: () => "int32",
            convertor: (param, value) => this.print(`+${value}`),
            convertorToArray: (param, value) => {
                this.print(`${param}Serializer.writeBoolean(${value})`)
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
            nativeType: () => { throw new Error("any arg convertor") },
            convertor: (param) => { throw new Error("Not for any") },
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Serializer.writeAny(${value})`)
            },
            estimateSize: () => 32
        }
    }

    undefinedConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [ RuntimeType.UNDEFINED ],
            isScoped: false,
            useArray: false,
            nativeType: () => { throw new Error("undefined arg convertor") },
            convertor: (param) => this.print("nullptr"),
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Serializer.writeUndefined()`)
            },
            estimateSize: () => 8
        }
    }

    enumMemberConvertor(param: string, value: string): ArgConvertor {
        // TODO: now we need to ensure that enum is always representable as int!
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.NUMBER], // Enums are integers in runtime.
            useArray: false,
            isScoped: false,
            nativeType: () => "int32",
            convertor: (param, value) => this.print(`${value} as unknown as int32`),
            convertorToArray: (param, value) => {
                this.print(`${param}Serializer.writeInt32(${value} as unknown as int32)`)
            },
            estimateSize: () => 4
        }
    }

    lengthConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT, RuntimeType.UNDEFINED],
            useArray: false,
            isScoped: true,
            scopeStart: (param) => `withLengthArray(${param}, (${param}Ptr) => {`,
            scopeEnd: () => '})',
            nativeType: () => "Uint32Array",
            convertor: (param, value) => this.print(`${value}Ptr`),
            convertorToArray: (param, value) => {
                this.print(`${param}Serializer.writeLength(${value})`)
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
            nativeType: () => { throw new Error("undefined union convertor") },
            isScoped: false,
            useArray: true,
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                this.print(`let ${value}Type = runtimeType(${value})`)
                // Save actual type being passed.
                this.print(`${param}Serializer.writeInt8(${value}Type)`)
                this.checkUniques(param, memberConvertors)
                memberConvertors.forEach((it, index) => {
                    let typeIt = type.types[index]
                    let typeName = typeIt.getSourceFile() ? typeIt.getText(typeIt.getSourceFile()) : "any"
                    if (it.runtimeTypes.length == 0) {
                        console.log(`WARNING: branch for ${typeName} was consumed`)
                        return
                    }
                    let maybeElse = (index > 0 && memberConvertors[index - 1].runtimeTypes.length > 0 ) ? "else " : ""
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
            nativeType: () => { throw new Error("aggregate arg convertor") },
            convertorToArray: (param: string, value: string) => {
                let members = type
                    .members
                    .filter(ts.isPropertySignature)
                memberConvertors.forEach((it, index) => {
                    let memberName = ts.idText(members[index].name as ts.Identifier)
                    this.print(`let ${it.value} = ${value}${members[index].questionToken ? "?" : ""}.${memberName}`)
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

    interfaceConvertor(param: string, value: string, declaration: ts.InterfaceDeclaration | ts.ClassDeclaration): ArgConvertor {
        let ifaceName = ts.idText(declaration.name as ts.Identifier)
        return {
                param: param,
                value: value,
                runtimeTypes: [RuntimeType.OBJECT],
                estimateSize: () => 32,
                nativeType: () => { throw new Error("interface arg convertor") },
                useArray: true,
                isScoped: false,
                convertor: (param, value) => { throw new Error("Must never be used") },
                convertorToArray: (param, value) => {
                    this.print(`${param}Serializer.write${ifaceName}(${value})`)
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
            nativeType: () => { throw new Error("tuple arg convertor") },
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                memberConvertors.forEach(it => {
                    it.convertorToArray(param, value)
                })
            }
        }
    }

    functionConvertor(param: string, value: string, type: ts.FunctionTypeNode): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.OBJECT, RuntimeType.UNDEFINED],
            isScoped: false,
            useArray: false,
            estimateSize: () => { return 8 },
            nativeType: () => "int32",
            convertor: (param: string) => { this.print(`functionToInt32(${param})`) },
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Serializer.writeFunction(${value})`)
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
            nativeType: () => { throw new Error("array arg convertor") },
            estimateSize: () => convertor.estimateSize() * 4,
            convertor: (param: string) => { throw new Error("Do not use") },
            convertorToArray: (param: string, value: string) => {
                // Array length.
                this.print(`${param}Serializer.writeInt32(${value}.length)`)
                this.print(`for (let i = 0; i < ${value}.length; i++) {`)
                this.pushIndent()
                this.print(`let element = ${value}[i]`)
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
            nativeType: () => "int32",
            convertor: (param: string) => {
                this.print(param)
            },
            convertorToArray: (param: string, value: string) => {
                this.print(`${param}Serializer.writeNumber(${value})`)
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
                // throw new Error(`Declaration not found: ${asString(type.typeName)}`)
                console.log(`WARNING: declaration not found: ${asString(type.typeName)}`)
                return this.anyConvertor(param, value)
            }
            if (asString(type.typeName) == "Length") {
                // Important common case.
                return this.lengthConvertor(param, value)
            }
            if (ts.isEnumDeclaration(declaration) || ts.isEnumMember(declaration)) {
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
                    else {
                        console.log("Empty convertor")
                        return this.emptyConvertor(param, value)
                    }
                }
                return this.interfaceConvertor(param, value, declaration)
            }
            if (ts.isClassDeclaration(declaration)) {
                return this.interfaceConvertor(param, value, declaration)
            }
            if (ts.isTypeParameterDeclaration(declaration)) {
                console.log(declaration)
                return this.anyConvertor(param, value)
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
            return this.functionConvertor(param, value, type)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.typeConvertor(param, value, type.type)
        }
        if (ts.isImportTypeNode(type)) {
            return {
                param: param,
                value: value,
                nativeType: () => { throw new Error("import arg convertor") },
                estimateSize: () => 32,
                runtimeTypes: [RuntimeType.OBJECT], // Assume imported are objects, not really always the case..
                isScoped: false,
                useArray: true,
                convertor: (param: string, value: string) => {
                    throw new Error("Do not use")
                },
                convertorToArray: (param: string, value: string) => {
                    this.print(`${param}Serializer.writeAny(${value})`)
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
        return this.typeConvertor(paramName, paramName, param.questionToken ? typeOrUndefined(param.type) : param.type)
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
        this.print(`export class Ark${component}Peer extends ${isComponent ? "PeerNode" : "ArkComponentPeer"} {`)
        this.pushIndent()
        this.print(`attributes?: Ark${component}Attributes`)
    }

    epilogue() {
        this.popIndent()
        this.print(`}`)
    }

    processApplyMethod(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        let clazzName = nameOrNull(node.name)!
        let isCommon = clazzName == "CommonMethodAttribute"
        let component = clazzName.replace("Attribute", "")
        if (component == "CommonMethod") {
            component = "Component"
        }
        const interfaceName = `Ark${component}Attributes`
        this.print(`applyAttributes${isCommon ? `<T extends ${interfaceName}>` : ``}(attributes: ${isCommon ? `T` : interfaceName}): void {`)
        this.pushIndent()
        this.print(isCommon ? undefined : `super.applyAttributes(attributes)`)
        this.popIndent()
        this.print(`}`)
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const className = nameOrNull(node.name)!
        let component = className.replace("Attribute", "")
        let extendsClause = "extends ArkComponentAttributes"
        if (component == "CommonMethod") {
            component = "Component"
            extendsClause = ""
        }
        this.print(`export interface Ark${component}Attributes ${extendsClause} {`)
        this.pushIndent()
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(child)
            }
        })
        this.popIndent()
        this.print("}")
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
        this.print(`${methodName}?: ${type}`)
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
            this.print(value)
        })
    }

    private collectMethod(node: ts.MethodDeclaration, parent: ts.ClassDeclaration): void {
        if (parent.name === undefined) throw new Error(`Encountered nameless method ${node}`)
        const component = ts.idText(parent.name)
        const method = node.name.getText()
        const parameters = node.parameters
            .map(it => this.argConvertor(it))
            .map(it => {
                if (it.useArray) {
                    const array = `${it.param}Serializer`
                    return `${array}: Uint8Array, ${array}Length: int32`
                } else {
                    return `${it.param}: ${it.nativeType!()}`
                }
            })
            .join(", ")
        this.nativeModuleMethods.push(`_${component}_${method}Impl(${parameters}): void`)
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
    nativeType: () => string
    param: string
    value: string
}

export function nativeModuleDeclaration(methods: string[]): string {
    methods = methods.map(it => `\n  ${it}`)
    return `
import { int32 } from "../../utils/types"

let theModule: NativeModule | undefined = undefined

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    theModule = require("nativeModule") as NativeModule
    return theModule
}

export interface NativeModule {${methods}
}
`.trim()
}
