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
import { IndentedPrinter } from "../IndentedPrinter"
import { identName, typeName } from "../util"
import { PeerGeneratorVisitor, RuntimeType } from "./PeerGeneratorVisitor"
import * as ts from "typescript"

export interface ArgConvertor {
    tsTypeName: string
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    estimateSize(): number
    scopeStart?(param: string): string
    scopeEnd?(param: string): string
    convertorTSArg(param: string): string
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void
    convertorCArg(param: string): string
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void
    interopType(ts: boolean): string
    nativeType(): string
    param: string
}

export abstract class BaseArgConvertor implements ArgConvertor {
    constructor(
        public tsTypeName: string,
        public runtimeTypes: RuntimeType[],
        public isScoped: boolean,
        public useArray: boolean,
        public param: string
    ) {}

    estimateSize(): number {
        return 0
    }
    nativeType(): string {
        return "Empty"
    }
    interopType(ts: boolean): string {
        return ts ? "object" : "void*"
    }

    scopeStart?(param: string): string
    scopeEnd?(param: string): string
    abstract convertorTSArg(param: string): string
    abstract convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void
    abstract convertorCArg(param: string): string
    abstract convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void
}


export class StringConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("string", [RuntimeType.STRING], false, false, param)
    }

    convertorTSArg(param: string): string {
        return param
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeString(${value})`)
    }
    convertorCArg(param: string): string {
        return `String(${param})`
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readString();`)
    }

    nativeType(): string {
        return "String"
    }
    interopType(ts: boolean): string {
        return "KStringPtr"
    }
    estimateSize() {
        return 32
    }
}

export class BooleanConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("boolean", [RuntimeType.BOOLEAN, RuntimeType.NUMBER], false, false, param)
        // TODO: shall NUMBER be here?
    }

    convertorTSArg(param: string): string {
        return `+${param}`
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeBoolean(${value})`)
    }
    convertorCArg(param: string): string {
        return param
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readBoolean();`)
    }

    nativeType(): string {
        return "KBoolean"
    }
    interopType(ts: boolean): string {
        return "KBoolean"
    }
    estimateSize() {
        return 1
    }
}

export class AnyConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("any", [], false, false, param)
    }

    convertorTSArg(param: string): string {
        return param
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeAny(${value})`)
    }
    convertorCArg(param: string): string {
        return param
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readAny();`)
    }

    nativeType(): string {
        return "Any"
    }
    interopType(ts: boolean): string {
        return ts ? "object" : "KNativePointer"
    }
    estimateSize() {
        return 1
    }
}

export class UndefinedConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("unknown", [RuntimeType.UNDEFINED], false, false, param)
    }

    convertorTSArg(param: string): string {
        return "nullptr"
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeUndefined()`)
    }
    convertorCArg(param: string): string {
        return param
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readUndefined();`)
    }

    nativeType(): string {
        return "Undefined"
    }
    interopType(ts: boolean): string {
        return "KNativePointer"
    }

    estimateSize() {
        return 1
    }
}

export class EnumConvertor extends BaseArgConvertor {
    constructor(param: string, type: ts.TypeReferenceNode | ts.ImportTypeNode, visitor: PeerGeneratorVisitor) {
        // Enums are integers in runtime.
        super("number", [RuntimeType.NUMBER], false, false, param)
        const typeNameString = typeName(type)
        if (typeNameString) visitor.requestType(typeNameString, type)
    }

    convertorTSArg(param: string): string {
        // as unknown for non-int enums, so it wouldn't clutter compiler diagnostic
        return `${param} as unknown as int32`
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        // as unknown for non-int enums, so it wouldn't clutter compiler diagnostic
        printer.print(`${param}Serializer.writeInt32(${value} as unknown as int32)`)
    }
    convertorCArg(param: string): string {
        return param
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readInt32();`)
    }

    nativeType(): string {
        return "KInt"
    }
    interopType(): string {
        return "KInt"
    }

    estimateSize() {
        return 4
    }
}

export class LengthConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("Length", [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, true, param)
    }

    scopeStart(param: string): string {
        return `withLengthArray(${param}, (${param}Ptr) => {`
    }
    scopeEnd(param: string): string {
        return '})'
    }

    convertorTSArg(param: string): string {
        // return `${param}Ptr`
        throw new Error("Not used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeLength(${value})`)
    }
    convertorCArg(param: string): string {
        return `Length::fromArray(${param})`
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readLength();`)
    }
    nativeType(): string {
        return "Length"
    }
    interopType(ts: boolean): string {
        return ts ? "Int32ArrayPtr" : "int32_t*"
    }
    estimateSize() {
        return 12
    }
}

export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]

    constructor(param: string, visitor: PeerGeneratorVisitor, private type: ts.UnionTypeNode) {
        super(`any`, [], false, true, param)
        this.memberConvertors = type
            .types
            .map(member => visitor.typeConvertor(param, member))
        this.checkUniques(param, this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
    }
    convertorTSArg(param: string): string {
        throw new Error("Do not use for union")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`let ${value}Type = runtimeType(${value})`)
        // Save actual type being passed.
        printer.print(`${param}Serializer.writeInt8(${value}Type)`)
        this.memberConvertors.forEach((it, index) => {
                if (it.runtimeTypes.length == 0) {
                    console.log(`WARNING: branch for ${it.nativeType()} was consumed`)
                    return
                }
                let maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                printer.print(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}RuntimeType.${RuntimeType[it]} == ${value}Type${maybeComma2}`).join(" || ")}) {`)
                printer.pushIndent()
                // TODO: `as unknown` is temporary to workaround for string enums.
                printer.print(`let ${value}_${index}: ${it.tsTypeName} = ${value} as unknown as ${it.tsTypeName}`)
                it.convertorToTSSerial(param, `${value}_${index}`, printer)
                printer.popIndent()
                printer.print(`}`)
            })
    }
    convertorCArg(param: string): string {
        throw new Error("Do not use for union")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        // Save actual type being passed.
        printer.print(`int32_t ${value}_type = ${param}Deserializer.readInt8();`)
        this.memberConvertors.forEach((it, index) => {
                if (it.runtimeTypes.length == 0) {
                    return
                }
                let maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                printer.print(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}RUNTIME_${RuntimeType[it]} == ${value}_type${maybeComma2}`).join(" || ")}) {`)
                printer.pushIndent()
                let variantValue = `${value}_${index}`
                printer.print(`${it.nativeType()} ${variantValue};`)
                it.convertorToCDeserial(param, variantValue, printer)
                printer.print(`${value}.value${index} = ${variantValue};`)
                printer.print(`${value}.selector = ${index};`)
                printer.popIndent()
                printer.print(`}`)
            })
    }
    nativeType(): string {
        return `Union<${this.memberConvertors.map(it => it.nativeType()).join(", ")}>`
    }
    interopType(ts: boolean): string {
        throw new Error("Union")
    }
    estimateSize() {
        return 12
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
}

export class OptionConvertor extends BaseArgConvertor {
    private typeConvertor: ArgConvertor

    constructor(param: string, visitor: PeerGeneratorVisitor, type: ts.TypeNode) {
        let typeConvertor = visitor.typeConvertor(param, type)
        let runtimeTypes = typeConvertor.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(`(${typeConvertor.tsTypeName})?`, runtimeTypes, typeConvertor.isScoped, true, param)
        this.typeConvertor = typeConvertor
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        // It is assumed that all types (primitive and object)
        // check for undefined value during the serialization
        this.typeConvertor.convertorToTSSerial(param, value, printer)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}.tag = (Tags)${param}Deserializer.readInt8();`)
        printer.print(`if (${value}.tag != TAG_UNDEFINED) {`)
        printer.pushIndent()
        let valueName = `${value}_tagged_value`
        printer.print(`${this.typeConvertor.nativeType()} ${valueName};`)
        this.typeConvertor.convertorToCDeserial(param, `${valueName}`, printer)
        printer.print(`${value}.value = ${valueName};`)
        printer.popIndent()
        printer.print(`}`)
    }
    nativeType(): string {
        return `Tagged<${this.typeConvertor.nativeType()}>`
    }
    interopType(ts: boolean): string {
        return "KPointer"
    }
    estimateSize() {
        return this.typeConvertor.estimateSize()
    }
}

export class AggregateConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private members: string[] = []

    constructor(param: string, visitor: PeerGeneratorVisitor, type: ts.TypeLiteralNode) {
        // Enums are integers in runtime.
        super(`any`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = type
            .members
            .filter(ts.isPropertySignature)
            .map((member, index) => {
            this.members[index] = ts.idText(member.name as ts.Identifier)
            // ${member.questionToken ? "?" : ""}
            return visitor.typeConvertor(param, member.type!)
        })
    }

    convertorTSArg(param: string): string {
        throw new Error("Do not use for aggregates")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index]
            printer.print(`let ${value}_${memberName} = ${value}?.${memberName}`)
            it.convertorToTSSerial(param, `${value}_${memberName}`, printer)
        })
    }
    convertorCArg(param: string): string {
        throw new Error("Do not use")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index]
            let memberLocal = `${value}_${memberName}`
            printer.print(`${it.nativeType()} ${memberLocal};`)
            it.convertorToCDeserial(param, memberLocal, printer)
            printer.print(`${value}.value${index} = ${memberLocal};`)
        })
    }

    nativeType(): string {
        return `Compound<${this.memberConvertors.map(it => it.nativeType()).join(", ")}>`
    }
    interopType(): string {
        return "KNativePointer"
    }
    estimateSize() {
        return 4
    }
}

export class TypedConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        private type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined,
        param: string, protected visitor: PeerGeneratorVisitor) {
        super(name, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
        visitor.requestType(name, type)
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.${this.visitor.serializerName(this.tsTypeName, this.type)}(${value})`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.${this.visitor.deserializerName(this.tsTypeName, this.type)}();`)
    }
    nativeType(): string {
        return this.tsTypeName
    }
    interopType(): string {
        return "KNativePointer"
    }
    estimateSize() {
        return 12
    }
}

export class InterfaceConvertor extends TypedConvertor {
    constructor(name: string, param: string, visitor: PeerGeneratorVisitor, type: ts.TypeReferenceNode | ts.ImportTypeNode) {
        super(name, type, param, visitor)
    }
}

export class FunctionConvertor extends TypedConvertor {
    constructor(param: string, visitor: PeerGeneratorVisitor) {
        super("Function", undefined, param, visitor)
    }
}

export class TupleConvertor extends BaseArgConvertor {
    memberConvertors: ArgConvertor[]

    constructor(param: string, protected visitor: PeerGeneratorVisitor, private elementType: ts.TupleTypeNode) {
        super(`[${elementType.elements.map(mapTsType).join(",")}]`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = elementType
            .elements
            .map(element => visitor.typeConvertor(param, element))
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }

    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeInt8(runtimeType(${value}))`)
        printer.print(`if (${value} !== undefined) {`)
        printer.pushIndent()
        this.memberConvertors.forEach((it, index) => {
            printer.print(`let ${value}_${index} = ${value}[${index}]`)
            it.convertorToTSSerial(param, `${value}_${index}`, printer)
        })
        printer.popIndent()
        printer.print(`}`)
    }

    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }

    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`auto ${value}_tag = ${param}Deserializer.readInt8();`)
        printer.print(`if (${value}_tag != RUNTIME_UNDEFINED) {`) // TODO: `else value = nullptr` ?
        printer.pushIndent()
        this.memberConvertors.forEach((it, index) => {
            let valueName = `${value}_${index}`
            printer.print(`${it.nativeType()} ${valueName};`)
            it.convertorToCDeserial(param, valueName, printer)
            printer.print(`${value}.value${index} = ${valueName};`)
        })
        printer.popIndent()
        printer.print(`}`)
    }
    nativeType(): string {
        return mapCType(this.elementType)
    }
    interopType(ts: boolean): string {
        return "KNativePointer"
    }

    estimateSize() {
        return this.memberConvertors
            .map(it => it.estimateSize())
            .reduce((sum, current) => sum + current, 0)
    }
}

export class ArrayConvertor extends BaseArgConvertor {
    elementConvertor: ArgConvertor
    constructor(param: string, protected visitor: PeerGeneratorVisitor, private elementType: ts.TypeNode) {
        super(`Array<${mapTsType(elementType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = visitor.typeConvertor(param, elementType)
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        // Array length.
        printer.print(`${param}Serializer.writeInt8(runtimeType(${value}))`)
        printer.print(`if (${value} !== undefined) {`)
        printer.pushIndent()
        printer.print(`${param}Serializer.writeInt32(${value}.length)`)
        printer.print(`for (let i = 0; i < ${value}.length; i++) {`)
        printer.pushIndent()
        printer.print(`let ${value}_element = ${value}[i]`)
        this.elementConvertor.convertorToTSSerial(param, `${value}_element`, printer)
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        // Array length.
        printer.print(`auto ${value}_tag = ${param}Deserializer.readInt8();`)
        printer.print(`if (${value}_tag != RUNTIME_UNDEFINED) {`) // TODO: `else value = nullptr` ?
        printer.pushIndent()
        printer.print(`auto ${value}_length = ${param}Deserializer.readInt32();`)
        printer.print(`${mapCType(this.elementType)} ${value}[${value}_length];`)
        printer.print(`for (int i = 0; i < ${value}_length; i++) {`)
        printer.pushIndent()
        printer.print(`${mapCType(this.elementType)} ${value}_element;`)
        this.elementConvertor.convertorToCDeserial(param, `${value}_element`, printer)
        printer.print(`${value}[i] = ${value}_element;`);
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`}`)

    }
    nativeType(): string {
        return `Array<${mapCType(this.elementType)}>`
    }
    interopType(ts: boolean): string {
        return "KNativePointer"
    }
    estimateSize() {
        return 12
    }
}
export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // Enums are integers in runtime.
        super("number", [RuntimeType.NUMBER], false, false, param)
    }

    convertorTSArg(param: string): string {
        return param
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeNumber(${value})`)
    }
    convertorCArg(param: string): string {
        return `Number(${param})`
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`int8_t ${value}_runtimeType = ${param}Deserializer.readInt8();`)
        printer.print(`if (${value}_runtimeType != RuntimeType::RUNTIME_NUMBER) throw new Error("Expected a Number");`)
        printer.print(`${value} = ${param}Deserializer.readNumber();`)
    }

    nativeType(): string {
        return "Number"
    }

    interopType(): string {
        return "KInt"
    }
    estimateSize() {
        return 4
    }
}

export class AnimationRangeConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("AnimationRange<number>", [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
    }

    convertorTSArg(param: string): string {
        throw new Error("unused")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeAnimationRange(${value});`)
    }
    convertorCArg(param: string): string {
        throw new Error("unused")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readAnimationRange();`)
    }
    nativeType(): string {
        return "Compound<Number, Number>" // TODO: figure out how to pass real type args
    }
    interopType(ts: boolean): string {
        return ts ? "Int32ArrayPtr" : "int32_t*"
    }
    estimateSize() {
        return 8
    }
}

function mapCType(type: ts.TypeNode): string {
    if (ts.isTypeReferenceNode(type)) {
        return ts.idText(type.typeName as ts.Identifier)
    }
    if (ts.isUnionTypeNode(type)) {
        return `Union<${type.types.map(it => mapCType(it)).join(", ")}>`
    }
    if (ts.isTypeLiteralNode(type)) {
        return `Compound<${type
            .members
            .filter(ts.isPropertySignature)
            .map(it => mapCType(it.type!))
            .join(", ")}>`
    }
    if (ts.isTupleTypeNode(type)) {
        return `Compound<${type
            .elements
            .map(it => mapCType(it))
            .join(", ")}>`
    }
    if (ts.isOptionalTypeNode(type)) {
        return `Tagged<${mapCType(type.type)}>`
    }
    if (ts.isFunctionTypeNode(type)) {
        return "Function"
    }
    if (ts.isParenthesizedTypeNode(type)) {
        // TBD: Map ParenthesizedType to CType
        return `${mapCType(type.type)}`
    }
    if (ts.isNamedTupleMember(type)) {
        return `${mapCType(type.type)}`
    }
    if (type.kind == ts.SyntaxKind.NumberKeyword) {
        return "Number"
    }
    if (type.kind == ts.SyntaxKind.StringKeyword) {
        return "String"
    }
    if (type.kind == ts.SyntaxKind.ObjectKeyword) {
        return "Object"
    }
    if (type.kind == ts.SyntaxKind.BooleanKeyword) {
        return "KBoolean"
    }
    if (type.kind == ts.SyntaxKind.AnyKeyword) {
        return "Any"
    }
    throw new Error(`Cannot map ${type.getText()}: ${type.kind}`)
}

function mapTsType(type: ts.TypeNode): string {
    if (ts.isTypeReferenceNode(type)) {
        let name = identName(type.typeName)!
        return name
    }
    return "any"
}
