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
        private nativeModuleMethods: string[],
        private outputC: string[]
    ) { }

    private outputTS: string[] = []

    visitWholeFile(): stringOrNone[] {
        let isCommon = this.sourceFile.fileName.endsWith("common.d.ts") ?? false;
        [
            `import { runtimeType, Serializer, functionToInt32, withLength, withLengthArray } from "../../utils/ts/Serialize"`,
            isCommon ? undefined : `import { ArkComponentPeer, ArkComponentAttributes } from "./common"`,
            `import { int32 } from "../../utils/ts/types"`,
            `import { nativeModule } from "./NativeModule"`,
            `import { PeerNode } from "../../utils/ts/Interop"`,
        ].forEach(it => this.printTS(it))
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.outputTS
    }

    resultC(): stringOrNone[] {
        return this.outputC
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
        if (value) this.outputTS.push(this.indentedTS(value))
    }

    printC(value: stringOrNone) {
        if (value) this.outputC.push(this.indentedC(value))
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

        this.printC(`}`)
        this.printC(`KOALA_INTEROP_${suffix}(${cName}, ${maybeCRetType}${cParameterTypes})`)
        this.printC(` `)

        this.printTS(`}`)
    }

    generateCParameters(argConvertors: ArgConvertor[]): string {
        return argConvertors.map(it => {
            if (it.useArray) {
                return `${it.param}Array: UInt8Array, ${it.param}Length: int32`
            } else {
                return `${it.param}: ${it.nativeType()}`
            }
        }).join(", ")
    }

    generateCParameterTypes(argConvertors: ArgConvertor[]): string {
        return argConvertors.map(it => {
            if (it.useArray) {
                return `UInt8Array, int32`
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
                it.convertorToTSSerial(it.param, it.value)
                this.printC(`Deserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                this.printC(`${it.nativeType()} ${it.param}Value;`)
                it.convertorToCDeserial(it.param, `${it.param}Value`)
            }
        })
        this.printTS(`nativeModule()._${clazzName}_${name}(`)
        this.pushIndentTS()
        argConvertors.forEach((it, index) => {
            let maybeComma = index == argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.printTS(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
                it.convertorTSArg(it.param, it.value)
            this.printTS(maybeComma)

        })
        this.popIndentTS()
        this.outputTS.push(this.indentedTS(`)`))
        scopes.reverse().forEach(it => {
            this.popIndentTS()
            this.printTS(it.scopeEnd!(it.param))
        })
        this.popIndentBoth()
    }

    private indentTS = 0
    indentedTS(input: string): string {
        return indentedBy(input, this.indentTS)
    }
    pushIndentTS() {
        this.indentTS++
    }
    popIndentTS() {
        this.indentTS--
    }

    private indentC = 0
    indentedC(input: string): string {
        return indentedBy(input, this.indentC)
    }
    pushIndentC() {
        this.indentC++
    }
    popIndentC() {
        this.indentC--
    }

    pushIndentBoth() {
        this.pushIndentC()
        this.pushIndentTS()
    }
    popIndentBoth() {
        this.popIndentC()
        this.popIndentTS()
    }

    emptyConvertor(param: string, value: string): ArgConvertor {
        console.log("WARNING: empty convertor")
        return {
            param: param,
            value: value,
            runtimeTypes: [],
            estimateSize: () => 0,
            nativeType: () => "Empty",
            isScoped: false,
            useArray: false,
            convertorTSArg: () => { },
            convertorToTSSerial: () => { },
            convertorCArg: () => { },
            convertorToCDeserial: () => { }
        }
    }

    stringConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.STRING],
            isScoped: false,
            useArray: false,
            convertorTSArg: (param, value) => {
                this.printTS(`${value}`)
            },
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`${param}Serializer.writeString(${value})`)
            },
            convertorCArg: (param, value) => {
                this.printTS(`${value}`)
            },
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`${value} = ${param}Deserializer.readString();`)
            },
            nativeType: () => "string",
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
            convertorTSArg: (param, value) => this.printTS(`+${value}`),
            convertorToTSSerial: (param, value) => {
                this.printTS(`${param}Serializer.writeBoolean(${value})`)
            },
            convertorCArg: (param, value) => this.printTS(value),
            convertorToCDeserial: (param, value) => {
                this.printC(`${param}Deserializer.readBoolean(${value})`)
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
            nativeType: () => "Any",
            convertorTSArg: (param) => { throw new Error("Not for any") },
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`${param}Serializer.writeAny(${value})`)
            },
            convertorCArg: (param) => { throw new Error("Not for any") },
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`${param}Deserializer.readAny(${value})`)
            },
            estimateSize: () => 32
        }
    }

    undefinedConvertor(param: string, value: string): ArgConvertor {
        return {
            param: param,
            value: value,
            runtimeTypes: [RuntimeType.UNDEFINED],
            isScoped: false,
            useArray: false,
            nativeType: () => "Undefined",
            convertorTSArg: (param) => this.printTS("nullptr"),
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`${param}Serializer.writeUndefined()`)
            },
            convertorCArg: (param) => this.printC("nullptr"),
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`${value} = ${param}Deserializer.readUndefined()`)
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
            convertorTSArg: (param, value) => this.printTS(`${value} as unknown as int32`),
            convertorToTSSerial: (param, value) => {
                this.printTS(`${param}Serializer.writeInt32(${value} as unknown as int32)`)
            },
            convertorCArg: (param, value) => this.printTS(`${value} = ${param};`),
            convertorToCDeserial: (param, value) => {
                this.printC(`${value} = ${param}Deserializer.readInt32();`)
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
            nativeType: () => "Length",
            convertorTSArg: (param, value) => this.printTS(`${value}Ptr`),
            convertorToTSSerial: (param, value) => {
                this.printTS(`${param}Serializer.writeLength(${value})`)
            },
            convertorCArg: (param, value) => this.printC(`${value} = Length::fromArray(${param});`),
            convertorToCDeserial: (param, value) => {
                this.printC(`${value} = ${param}Deserializer.readLength();`)
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
            nativeType: () => `Union<${memberConvertors.map(it => it.nativeType()).join(", ")}>`,
            isScoped: false,
            useArray: true,
            convertorTSArg: (param: string) => { throw new Error("Do not use") },
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`let ${value}Type = runtimeType(${value})`)
                // Save actual type being passed.
                this.printTS(`${param}Serializer.writeInt8(${value}Type)`)
                this.checkUniques(param, memberConvertors)
                memberConvertors.forEach((it, index) => {
                    let typeIt = type.types[index]
                    let typeName = typeIt.getSourceFile() ? typeIt.getText(typeIt.getSourceFile()) : "any"
                    if (it.runtimeTypes.length == 0) {
                        console.log(`WARNING: branch for ${typeName} was consumed`)
                        return
                    }
                    let maybeElse = (index > 0 && memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                    let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                    let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                    this.printTS(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}${it} == ${value}Type${maybeComma2}`).join(" || ")}) {`)
                    this.pushIndentTS()
                    this.printTS(`let ${value}_${index}: ${typeName} = ${value} as ${typeName}`)
                    it.convertorToTSSerial(param, `${value}_${index}`)
                    this.popIndentTS()
                    this.printTS(`}`)
                })
            },
            convertorCArg: (param: string) => { throw new Error("Do not use union") },
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`RuntimeType ${value}_type = ${param}Deserializer.readInt8();`)
                memberConvertors.forEach((it, index) => {
                    if (it.runtimeTypes.length == 0) {
                        return
                    }
                    let typeName = it.nativeType()
                    let maybeElse = (index > 0 && memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                    let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                    let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                    this.printC(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}${it} == ${value}_type${maybeComma2}`).join(" || ")}) {`)
                    this.pushIndentC()
                    this.printC(`${typeName} ${value}_${index};`)
                    it.convertorToCDeserial(param, `${value}_${index}`)
                    this.printC(`${value}.value${index} = ${value}_${index};`)
                    this.popIndentC()
                    this.printC(`}`)
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
            nativeType: () => `Compound<${memberConvertors.map(it => it.nativeType()).join(", ")}>`,
            convertorTSArg: (param: string) => { throw new Error("Do not use") },
            convertorToTSSerial: (param: string, value: string) => {
                let members = type
                    .members
                    .filter(ts.isPropertySignature)
                memberConvertors.forEach((it, index) => {
                    let memberName = ts.idText(members[index].name as ts.Identifier)
                    this.printTS(`let ${it.value} = ${value}${members[index].questionToken ? "?" : ""}.${memberName}`)
                    it.convertorToTSSerial(it.param, it.value)
                })
            },
            convertorCArg: (param: string) => { throw new Error("Do not use") },
            convertorToCDeserial: (param: string, value: string) => {
                let members = type
                    .members
                    .filter(ts.isPropertySignature)
                memberConvertors.forEach((it, index) => {
                    let memberName = ts.idText(members[index].name as ts.Identifier)
                    let memberType = this.mapCType(members[index].type!)
                    this.printC(`${memberType} ${it.value};`)
                    it.convertorToCDeserial(it.param, it.value)
                    this.printC(`${value}.${memberName} = ${it.value};`)
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
            nativeType: () => ifaceName,
            useArray: true,
            isScoped: false,
            convertorTSArg: (param, value) => { throw new Error("Must never be used") },
            convertorToTSSerial: (param, value) => {
                this.printTS(`${param}Serializer.write${ifaceName}(${value})`)
            },
            convertorCArg: (param, value) => { throw new Error("Must never be used: interface") },
            convertorToCDeserial: (param, value) => {
                this.printC(`${value} = ${param}Deserializer.read${ifaceName}();`)
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
            nativeType: () => "Tuple",
            convertorTSArg: (param: string) => { throw new Error("Do not use") },
            convertorToTSSerial: (param: string, value: string) => {
                memberConvertors.forEach(it => {
                    it.convertorToTSSerial(param, value)
                })
            },
            convertorCArg: (param: string) => { throw new Error("Do not use") },
            convertorToCDeserial: (param: string, value: string) => {
                console.log("TODO: tuple convertor")
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
            convertorTSArg: (param: string) => { this.printTS(`functionToInt32(${param})`) },
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`${param}Serializer.writeFunction(${value})`)
            },
            convertorCArg: (param: string) => { throw new Error("Do not use") },
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`${value} = ${param}Deserializer.readFunction();`)
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
            nativeType: () => `Array`,
            estimateSize: () => convertor.estimateSize() * 4,
            convertorTSArg: (param: string) => { throw new Error("Do not use") },
            convertorToTSSerial: (param: string, value: string) => {
                // Array length.
                this.printTS(`${param}Serializer.writeInt32(${value}.length)`)
                this.printTS(`for (let i = 0; i < ${value}.length; i++) {`)
                this.pushIndentTS()
                this.printTS(`let element = ${value}[i]`)
                convertor.convertorToTSSerial(param, "element")
                this.popIndentTS()
                this.printTS(`}`)
            },
            convertorCArg: (param: string) => { throw new Error("Do not use") },
            convertorToCDeserial: (param: string, value: string) => {
                // Array length.
                this.printC(`auto ${value}_length = ${param}Serializer.readInt32();`)
                this.printC(`${this.mapCType(elementType)} ${value}[${value}_length];`)
                this.printC(`for (int i = 0; i < ${value}_length; i++) {`)
                this.pushIndentC()
                convertor.convertorToCDeserial(param, `${value}[i]`);
                this.popIndentC()
                this.printC(`}`)
            }
        }
    }

    mapCType(type: ts.TypeNode): string {
        if (ts.isTypeReferenceNode(type)) {
            return ts.idText(type.typeName as ts.Identifier)
        }
        return "Any"
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
            convertorTSArg: (param, value) => {
                this.printTS(param)
            },
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`${param}Serializer.writeNumber(${value})`)
            },
            convertorCArg: (param, value) => {
                this.printC(`${value} = ${param};`)
            },
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`${value} = ${param}Deserializer.readNumber();`)
            }
        }
    }

    importTypeConvertor(param: string, value: string, name: string): ArgConvertor {
        return {
            param: param,
            value: value,
            nativeType: () => name,
            estimateSize: () => 32,
            runtimeTypes: [RuntimeType.OBJECT], // Assume imported are objects, not really always the case..
            isScoped: false,
            useArray: true,
            convertorTSArg: (param: string, value: string) => {
                throw new Error("Do not use")
            },
            convertorToTSSerial: (param: string, value: string) => {
                this.printTS(`${param}Serializer.write${name}(${value})`)
            },
            convertorCArg: (param: string, value: string) => {
                throw new Error("Do not use")
            },
            convertorToCDeserial: (param: string, value: string) => {
                this.printC(`${value} = ${param}Deserializer.read${name}();`)
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
            return this.importTypeConvertor(param, value, asString(type.qualifier))
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

    retConvertor(typeNode?: ts.TypeNode): RetConvertor {
        const isVoid = (typeNode === undefined) ||
            (typeNode.kind == ts.SyntaxKind.VoidKeyword)

        return {
            isVoid: isVoid,
            nativeType: () => isVoid ? "void" : this.mapCType(typeNode),
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
    estimateSize: () => number
    scopeStart?: (param: string) => string
    scopeEnd?: (param: string) => string
    convertorTSArg: (param: string, value: string) => void
    convertorToTSSerial: (param: string, value: string) => void
    convertorCArg: (param: string, value: string) => void
    convertorToCDeserial: (param: string, value: string) => void
    nativeType: () => string
    param: string
    value: string
}

interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
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


export function bridgeCcDeclaration(bridgeCc: string[]): string {
    return `
#include "Serializer.h"
#include "Interop.h"

using std;

${bridgeCc.join("\n")}
`
}
