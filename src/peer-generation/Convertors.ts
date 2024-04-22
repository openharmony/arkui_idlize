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
import { identName, importTypeName, mapType, typeName } from "../util"
import {DeclarationTable, PrimitiveType} from "./DeclarationTable"
import { RuntimeType } from "./PeerGeneratorVisitor"
import * as ts from "typescript"

let uniqueCounter = 0

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
    nativeType(impl: boolean): string
    isPointerType(): boolean
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
    nativeType(impl: boolean): string {
        throw new Error("Define")
    }
    isPointerType(): boolean {
       throw new Error("Define")
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
        return `(${PrimitiveType.String.getText()}*)&${param}`
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readString();`)
    }

    nativeType(impl: boolean): string {
        return PrimitiveType.String.getText()
    }
    interopType(ts: boolean): string {
        return "KStringPtr"
    }
    estimateSize() {
        return 32
    }
    isPointerType(): boolean {
        return true
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

    nativeType(impl: boolean): string {
        return PrimitiveType.Boolean.getText()
    }
    interopType(ts: boolean): string {
        return ts ? "KInt" : PrimitiveType.Boolean.getText()
    }
    estimateSize() {
        return 1
    }
    isPointerType(): boolean {
        return false
    }
}

export class UndefinedConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("undefined", [RuntimeType.UNDEFINED], false, false, param)
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

    nativeType(impl: boolean): string {
        return "Undefined"
    }
    interopType(ts: boolean): string {
        return PrimitiveType.NativePointer.getText()
    }

    estimateSize() {
        return 1
    }
    isPointerType(): boolean {
        return false
    }
}

export class EnumConvertor extends BaseArgConvertor {
    constructor(param: string, table: DeclarationTable) {
        // Enums are integers in runtime.
        super("number", [RuntimeType.NUMBER], false, false, param)
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

    nativeType(impl: boolean): string {
        return PrimitiveType.Int32.getText()
    }
    interopType(ts: boolean): string {
        return ts ? "KInt" : PrimitiveType.Int32.getText()
    }

    estimateSize() {
        return 4
    }
    isPointerType(): boolean {
        return false
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
        return `Length_from_array(${param})`
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readLength();`)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Length.getText()
    }
    interopType(ts: boolean): string {
        return ts ? "Int32ArrayPtr" : `${PrimitiveType.Int32.getText()}*`
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
    }
}

export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]

    constructor(param: string, private table: DeclarationTable, private type: ts.UnionTypeNode) {
        super(`any`, [], false, true, param)
        this.memberConvertors = type
            .types
            .map(member => table.typeConvertor(param, member))
        this.checkUniques(param, this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        table.requestType(undefined, type)
    }
    convertorTSArg(param: string): string {
        throw new Error("Do not use for union")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`const ${value}_type = runtimeType(${value})`)
        // Save actual type being passed.
        printer.print(`${param}Serializer.writeInt8(${value}_type)`)
        this.memberConvertors.forEach((it, index) => {
                if (it.runtimeTypes.length == 0) {
                    console.log(`WARNING: branch for ${it.nativeType(false)} was consumed`)
                    return
                }
                let maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                printer.print(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}RuntimeType.${RuntimeType[it]} == ${value}_type${maybeComma2}`).join(" || ")}) {`)
                printer.pushIndent()
                if (!(it instanceof UndefinedConvertor)) {
                    // TODO: `as unknown` is temporary to workaround for string enums.
                    let maybeAsUnknown = (it instanceof EnumConvertor) ? "as unknown " : ""
                    printer.print(`const ${value}_${index}: ${it.tsTypeName} = ${value} ${maybeAsUnknown}as ${it.tsTypeName}`)
                    it.convertorToTSSerial(param, `${value}_${index}`, printer)
                }
                printer.popIndent()
                printer.print(`}`)
            })
    }
    convertorCArg(param: string): string {
        throw new Error("Do not use for union")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        // Save actual type being passed.
        let runtimeType = `runtimeType${uniqueCounter++}`;
        printer.print(`int32_t ${runtimeType} = ${param}Deserializer.readInt8();`)
        this.memberConvertors.forEach((it, index) => {
                if (it.runtimeTypes.length == 0) {
                    return
                }
                let maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                printer.print(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}ARK_RUNTIME_${RuntimeType[it]} == ${runtimeType}${maybeComma2}`).join(" || ")}) {`)
                printer.pushIndent()
                it.convertorToCDeserial(param, `${value}.value${index}`, printer)
                printer.print(`${value}.selector = ${index};`)
                printer.popIndent()
                printer.print(`}`)
            })
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${PrimitiveType.Int32.getText()} selector; union { ` +
            `${this.memberConvertors.map((it, index) => `${it.nativeType(false)} value${index};`).join(" ")}` +
              `}; }`
            :  this.table.getTypeName(this.type)
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
    isPointerType(): boolean {
        return true
    }
}

export class ImportTypeConvertor extends BaseArgConvertor {
    private importedName: string
    constructor(param: string, private table: DeclarationTable, type: ts.ImportTypeNode) {
        super("Object", [RuntimeType.OBJECT], false, true, param)
        this.importedName = importTypeName(type)
        table.requestType(this.importedName, type)
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeCustomObject("${this.importedName}", ${value})`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readCustomObject("${this.importedName}");`)
    }
    nativeType(impl: boolean): string {
        // return this.importedName
        // treat ImportType as CustomObject
        return PrimitiveType.CustomObject.getText()
    }
    interopType(ts: boolean): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 32
    }
    isPointerType(): boolean {
        return true
    }
}

export class CustomTypeConvertor extends BaseArgConvertor {
    private customName: string
    constructor(param: string, customName: string, tsType?: string) {
        super(tsType ?? "Object", [RuntimeType.OBJECT], false, true, param)
        this.customName = customName
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeCustomObject("${this.customName}", ${value})`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readCustomObject("${this.customName}");`)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.CustomObject.getText()
    }
    interopType(ts: boolean): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 32
    }
    isPointerType(): boolean {
        return true
    }
}

export class OptionConvertor extends BaseArgConvertor {
    private typeConvertor: ArgConvertor

    constructor(param: string, private table: DeclarationTable, private type: ts.TypeNode) {
        let typeConvertor = table.typeConvertor(param, type)
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
        printer.print(`const ${value}_type = runtimeType(${value})`)
        printer.print(`${param}Serializer.writeInt8(${value}_type)`)
        printer.print(`if (${value}_type != RuntimeType.UNDEFINED) {`)
        printer.pushIndent()
        printer.print(`const ${value}_value = ${value}!`)
        this.typeConvertor.convertorToTSSerial(param, `${value}_value`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}.tag = ${param}Deserializer.readInt8() == ARK_RUNTIME_UNDEFINED ? ARK_TAG_UNDEFINED : ARK_TAG_OBJECT;`)
        printer.print(`if (${value}.tag != ARK_TAG_UNDEFINED) {`)
        printer.pushIndent()
        this.typeConvertor.convertorToCDeserial(param, `${value}.value`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { Ark_Tag tag; ${this.table.getTypeName(this.type, false)} value; }`
            : this.table.getTypeName(this.type, true)
    }
    interopType(ts: boolean): string {
        return ts ? "KNativePointer" : PrimitiveType.NativePointer.getText()
    }
    estimateSize() {
        return this.typeConvertor.estimateSize()
    }
    isPointerType(): boolean {
        return true
    }
}

export class AggregateConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private members: string[] = []

    constructor(param: string, private table: DeclarationTable, private type: ts.TypeLiteralNode) {
        super(`any`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = type
            .members
            .filter(ts.isPropertySignature)
            .map((member, index) => {
            this.members[index] = identName(member.name)!
            return table.typeConvertor(param, member.type!, member.questionToken != undefined)
        })
        table.requestType(undefined, type)
    }

    convertorTSArg(param: string): string {
        throw new Error("Do not use for aggregates")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index]
            printer.print(`const ${value}_${memberName} = ${value}?.${memberName}`)
            it.convertorToTSSerial(param, `${value}_${memberName}`, printer)
        })
    }
    convertorCArg(param: string): string {
        throw new Error("Do not use")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        let struct = this.table.targetStruct(this.table.toTarget(this.type))
        this.memberConvertors.forEach((it, index) => {
            it.convertorToCDeserial(param, `${value}.${struct.getFields()[index].name}`, printer)
        })
    }

    nativeType(impl: boolean): string {
        return impl
            ? `struct { ` +
              `${this.memberConvertors.map((it, index) => `${it.nativeType(true)} value${index};`).join(" ")}` +
              '} '
            : this.table.getTypeName(this.type)
    }
    interopType(ts: boolean): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 4
    }
    isPointerType(): boolean {
        return true
    }
}

export class TypedConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        private type: ts.TypeReferenceNode,
        param: string, protected table: DeclarationTable) {
        super(name, [RuntimeType.OBJECT, RuntimeType.FUNCTION, RuntimeType.UNDEFINED], false, true, param)
        table.requestType(name, type)
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.${this.table.serializerName(this.tsTypeName, this.type)}(${value})`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.${this.table.deserializerName(this.tsTypeName, this.type)}();`)
    }
    nativeType(impl: boolean): string {
        return this.tsTypeName
    }
    interopType(): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
    }
}

export class InterfaceConvertor extends TypedConvertor {
    constructor(name: string, param: string, table: DeclarationTable, type: ts.TypeReferenceNode) {
        super(name, type, param, table)
    }
}

export class FunctionConvertor extends CustomTypeConvertor {
    constructor(param: string, table: DeclarationTable) {
        super(param, "Function")
    }
}

export class TupleConvertor extends BaseArgConvertor {
    memberConvertors: ArgConvertor[]

    constructor(param: string, protected table: DeclarationTable, private type: ts.TupleTypeNode) {
        super(`[${type.elements.map(it => mapType(table.typeChecker!, it)).join(",")}]`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = type
            .elements
            .map(element => table.typeConvertor(param, element))
        table.requestType(undefined, type)
    }

    convertorTSArg(param: string): string {
        throw new Error("Must never be used")
    }

    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeInt8(runtimeType(${value}))`)
        printer.print(`if (${value} !== undefined) {`)
        printer.pushIndent()
        this.memberConvertors.forEach((it, index) => {
            printer.print(`const ${value}_${index} = ${value}[${index}]`)
            it.convertorToTSSerial(param, `${value}_${index}`, printer)
        })
        printer.popIndent()
        printer.print(`}`)
    }

    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }

    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`if (${param}Deserializer.readInt8() != ${PrimitiveType.UndefinedRuntime}) {`) // TODO: `else value = nullptr` ?
        printer.pushIndent()
        this.memberConvertors.forEach((it, index) => {
            it.convertorToCDeserial(param, `${value}.value${index}`, printer)
        })
        printer.popIndent()
        printer.print(`}`)
    }
    nativeType(impl: boolean): string {
        return impl
        ? `struct { ` +
          `${this.memberConvertors.map((it, index) => `${it.nativeType(false)} value${index};`).join(" ")}` +
          '} '
        : this.table.getTypeName(this.type)
    }
    interopType(ts: boolean): string {
        throw new Error("Must never be used")
    }

    estimateSize() {
        return this.memberConvertors
            .map(it => it.estimateSize())
            .reduce((sum, current) => sum + current, 0)
    }
    isPointerType(): boolean {
        return true
    }
}

export class ArrayConvertor extends BaseArgConvertor {
    elementConvertor: ArgConvertor
    constructor(param: string, protected table: DeclarationTable, type: ts.TypeNode, private elementType: ts.TypeNode) {
        super(`Array<${mapType(table.typeChecker!, elementType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = table.typeConvertor(param, elementType)
        table.requestType(undefined, type)
        table.requestType(undefined, elementType)
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
        printer.print(`const ${value}_element = ${value}[i]`)
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
        let runtimeType = `runtimeType${uniqueCounter++}`;
        let arrayLength = `arrayLength${uniqueCounter++}`;
        let elementTypeName = this.table.computeTargetName(this.table.toTarget(this.elementType), false)
        printer.print(`auto ${runtimeType} = ${param}Deserializer.readInt8();`)
        printer.print(`if (${runtimeType} != ${PrimitiveType.UndefinedRuntime}) {`) // TODO: `else value = nullptr` ?
        printer.pushIndent()
        printer.print(`auto ${arrayLength} = ${param}Deserializer.readInt32();`)
        printer.print(`${param}Deserializer.resizeArray<Array_${elementTypeName}, ${elementTypeName}>(${value}, ${arrayLength});`);
        printer.print(`for (int i = 0; i < ${arrayLength}; i++) {`)
        printer.pushIndent()
        this.elementConvertor.convertorToCDeserial(param, `${value}.array[i]`, printer)
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`}`)

    }
    nativeType(impl: boolean): string {
        return `Array_${this.table.computeTypeName(undefined, this.elementType, false)}`
    }
    interopType(ts: boolean): string {
        return "KNativePointer"
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
    }
}
export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // TODO: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super("number", [RuntimeType.NUMBER], false, true, param)
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
        printer.print(`${value} = ${param}Deserializer.readNumber();`)
    }

    nativeType(): string {
        return PrimitiveType.Number.getText()
    }

    interopType(ts: boolean): string {
        return ts ? "KInt" : PrimitiveType.Number.getText()
    }
    estimateSize() {
        return 4
    }
    isPointerType(): boolean {
        return false
    }
}

export class PredefinedConvertor extends BaseArgConvertor {
    constructor(param: string, tsType: string, private convertorName: string, private cType: string) {
        super(tsType, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
    }

    convertorTSArg(param: string): string {
        throw new Error("unused")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        //printer.print(`${param}Serializer.writeAnimationRange(${value});`)
        printer.print(`${param}Serializer.write${this.convertorName}(${value})`)
    }
    convertorCArg(param: string): string {
        throw new Error("unused")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.read${this.convertorName}();`)
    }
    nativeType(impl: boolean): string {
        return this.cType
    }
    interopType(ts: boolean): string {
        return ts ? "Int32ArrayPtr" : PrimitiveType.Int32.getText() + "*"
    }
    estimateSize() {
        return 8
    }
    isPointerType(): boolean {
        return true
    }
}


class ProxyConvertor extends BaseArgConvertor {

    constructor(protected convertor: ArgConvertor) {
        super(convertor.tsTypeName, convertor.runtimeTypes, convertor.isScoped, convertor.useArray, convertor.param)
    }

    convertorCArg(param: string): string {
        return this.convertor.convertorCArg(param);
    }

    convertorTSArg(param: string): string {
        return this.convertor.convertorTSArg(param);
    }

    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        this.convertor.convertorToCDeserial(param, value, printer)
    }

    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        this.convertor.convertorToTSSerial(param, value, printer)
    }

    nativeType(impl: boolean): string {
        return this.convertor.nativeType(impl)
    }

    isPointerType(): boolean {
        return  this.convertor.isPointerType()
    }
}

export class TypeAliasConvertor extends ProxyConvertor {
    constructor(param: string, private table: DeclarationTable, private declaration: ts.TypeAliasDeclaration,
        private typeArguments?: ts.NodeArray<ts.TypeNode>) {
        super(table.typeConvertor(param, declaration.type))
    }

    nativeType(impl: boolean): string {
        // propagate CustomObject type
        if (this.convertor.nativeType(impl) === PrimitiveType.CustomObject.getText()) {
            return PrimitiveType.CustomObject.getText()
        }
        return ts.idText(this.declaration.name)
    }

    isPointerType(): boolean {
        return this.convertor.isPointerType()
    }
}

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}
