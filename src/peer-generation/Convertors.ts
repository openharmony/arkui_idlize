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
import { Language, identName, importTypeName, mapType, typeName } from "../util"
import { DeclarationTable, PrimitiveType } from "./DeclarationTable"
import { RuntimeType } from "./PeerGeneratorVisitor"
import * as ts from "typescript"
import { LanguageWriter } from "./LanguageWriters"

let uniqueCounter = 0

export interface ArgConvertor {
    tsTypeName: string
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    estimateSize(): number
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    convertorArg(param: string, language: Language): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): void
    interopType(language: Language): string
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
    ) { }

    estimateSize(): number {
        return 0
    }
    nativeType(impl: boolean): string {
        throw new Error("Define")
    }
    isPointerType(): boolean {
        throw new Error("Define")
    }
    interopType(language: Language): string {
        throw new Error("Define")
    }

    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    abstract convertorArg(param: string, language: Language): string
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    abstract convertorDeserialize(param: string, value: string, writer: LanguageWriter): void
}


export class StringConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("string", [RuntimeType.STRING], false, false, param)
    }

    convertorArg(param: string, language: Language): string {
        return language == Language.CPP ? this.convertorCArg(param) : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMemberCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorCArg(param: string): string {
        return `(const ${PrimitiveType.String.getText()}*)&${param}`
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): void {
        writer.print(`${value} = ${param}Deserializer.readString();`)
    }

    nativeType(impl: boolean): string {
        return PrimitiveType.String.getText()
    }
    interopType(language: Language): string {
        return "KStringPtr"
    }
    estimateSize() {
        return 32
    }
    isPointerType(): boolean {
        return true
    }
}

export class ToStringConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("string", [RuntimeType.OBJECT], false, false, param)
    }

    convertorArg(param: string, language: Language): string {
        return language == Language.CPP ? this.convertorCArg(param) : `(${param}).toString()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMemberCall(`${param}Serializer`, `writeString`, [`${value}.toString()`])
    }
    convertorCArg(param: string): string {
        return `(const ${PrimitiveType.String.getText()}*)&${param}`
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): void {
        writer.print(`${value} = ${param}Deserializer.readString();`)
    }

    nativeType(impl: boolean): string {
        return PrimitiveType.String.getText()
    }
    interopType(language: Language): string {
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
        super("boolean", [RuntimeType.BOOLEAN], false, false, param)
    }

    convertorArg(param: string, language: Language): string {
        return language == Language.CPP ? param : `+${param}`
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeBoolean(${value})`)
    }
    convertorCArg(param: string): string {
        return param
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readBoolean();`)
    }

    nativeType(impl: boolean): string {
        return PrimitiveType.Boolean.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Boolean.getText() : "KInt"
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

    convertorArg(param: string, language: Language): string {
        return language == Language.CPP ? "nullptr" : "undefined"
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeUndefined()`)
    }
    convertorCArg(param: string): string {
        return param
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readUndefined();`)
    }

    nativeType(impl: boolean): string {
        return "Undefined"
    }
    interopType(language: Language): string {
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
    convertorArg(param: string, language: Language): string {
        return language == Language.CPP ? param : `unsafeCast<int32>(${param})`
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeInt32(${this.convertorArg(value, printer.language)})`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readInt32();`)
    }

    nativeType(impl: boolean): string {
        return PrimitiveType.Int32.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
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
    convertorArg(param: string, language: Language): string {
        throw new Error("Not used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeLength(${value})`)
    }
    convertorCArg(param: string): string {
        return `Length_from_array(${param})`
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readLength();`)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Length.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? `${PrimitiveType.Int32.getText()}*` : "Int32ArrayPtr"
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
        // TODO: simplify convertors.
        if (false && this.memberConvertors.every(it => it.constructor == this.memberConvertors[0].constructor)) {
            this.memberConvertors = [this.memberConvertors[0]]
        }
        this.checkUniques(param, this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        table.requestType(undefined, type)
    }
    convertorArg(param: string, language: Language): string {
        throw new Error("Do not use for union")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
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
                printer.print(`const ${value}_${index} = unsafeCast<${it.tsTypeName}>(${value})`)
                it.convertorSerialize(param, `${value}_${index}`, printer)
            }
            printer.popIndent()
            printer.print(`}`)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
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
            it.convertorDeserialize(param, `${value}.value${index}`, printer)
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
            : this.table.getTypeName(this.type)
    }
    interopType(language: Language): string {
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
                        let current = this.table.getCurrentContext()
                        if (!current) throw new Error("Used in undefined context, do setCurrentContext()")
                        if (!UnionConvertor.reportedConflicts.has(current)) {
                            if (current) UnionConvertor.reportedConflicts.add(current)
                            console.log(`WARNING: runtime type conflict in "${current ?? "<unknown>"} ${param}": could be ${RuntimeType[value]} in both ${convertors[i].constructor.name} and ${convertors[j].constructor.name}`)
                        }
                        second.splice(index, 1)
                    }
                })
            }
        }
    }
    isPointerType(): boolean {
        return true
    }

    private static reportedConflicts = new Set<string>()
}

export class ImportTypeConvertor extends BaseArgConvertor {
    private importedName: string
    constructor(param: string, private table: DeclarationTable, type: ts.ImportTypeNode) {
        super("Object", [RuntimeType.OBJECT], false, true, param)
        this.importedName = importTypeName(type)
        table.requestType(this.importedName, type)
    }

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeCustomObject("${this.importedName}", ${value})`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readCustomObject("${this.importedName}");`)
    }
    nativeType(impl: boolean): string {
        // return this.importedName
        // treat ImportType as CustomObject
        return PrimitiveType.CustomObject.getText()
    }
    interopType(language: Language): string {
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

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeCustomObject("${this.customName}", ${value})`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readCustomObject("${this.customName}");`)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.CustomObject.getText()
    }
    interopType(language: Language): string {
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

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`const ${value}_type = runtimeType(${value})`)
        printer.print(`${param}Serializer.writeInt8(${value}_type)`)
        printer.print(`if (${value}_type != RuntimeType.UNDEFINED) {`)
        printer.pushIndent()
        printer.print(`const ${value}_value = ${value}!`)
        this.typeConvertor.convertorSerialize(param, `${value}_value`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value}.tag = ${param}Deserializer.readInt8() == ARK_RUNTIME_UNDEFINED ? ARK_TAG_UNDEFINED : ARK_TAG_OBJECT;`)
        printer.print(`if (${value}.tag != ARK_TAG_UNDEFINED) {`)
        printer.pushIndent()
        this.typeConvertor.convertorDeserialize(param, `${value}.value`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${PrimitiveType.Tag.getText()} tag; ${this.table.getTypeName(this.type, false)} value; }`
            : this.table.getTypeName(this.type, true)
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.NativePointer.getText() : "KNativePointer"
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

    convertorArg(param: string, language: Language): string {
        throw new Error("Do not use for aggregates")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index]
            printer.print(`const ${value}_${memberName} = ${value}?.${memberName}`)
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        let struct = this.table.targetStruct(this.table.toTarget(this.type))
        this.memberConvertors.forEach((it, index) => {
            it.convertorDeserialize(param, `${value}.${struct.getFields()[index].name}`, printer)
        })
    }

    nativeType(impl: boolean): string {
        return impl
            ? `struct { ` +
            `${this.memberConvertors.map((it, index) => `${it.nativeType(true)} value${index};`).join(" ")}` +
            '} '
            : this.table.getTypeName(this.type)
    }
    interopType(language: Language): string {
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
        super(name, [RuntimeType.OBJECT], false, true, param)
        table.requestType(name, type)
    }

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.${this.table.serializerName(this.tsTypeName, this.type)}(${value})`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.${this.table.deserializerName(this.tsTypeName, this.type)}();`)
    }
    nativeType(impl: boolean): string {
        return this.tsTypeName
    }
    interopType(language: Language): string {
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

export class FunctionConvertor extends BaseArgConvertor {
    constructor(
        param: string,
        protected table: DeclarationTable
    ) {
        // TODO: pass functions as integers to native side.
        super("Function", [RuntimeType.FUNCTION], false, true, param)
    }

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeFunction(${value})`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readFunction();`)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Function.getText()
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
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

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }

    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeInt8(runtimeType(${value}))`)
        printer.print(`if (${value} !== undefined) {`)
        printer.pushIndent()
        this.memberConvertors.forEach((it, index) => {
            printer.print(`const ${value}_${index} = ${value}[${index}]`)
            it.convertorSerialize(param, `${value}_${index}`, printer)
        })
        printer.popIndent()
        printer.print(`}`)
    }

    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`if (${param}Deserializer.readInt8() != ${PrimitiveType.UndefinedRuntime}) {`) // TODO: `else value = nullptr` ?
        printer.pushIndent()
        this.memberConvertors.forEach((it, index) => {
            it.convertorDeserialize(param, `${value}.value${index}`, printer)
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
    interopType(language: Language): string {
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

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        printer.print(`${param}Serializer.writeInt8(runtimeType(${value}))`)
        printer.print(`if (${value} !== undefined) {`)
        printer.pushIndent()
        printer.print(`${param}Serializer.writeInt32(${value}.length)`)
        printer.print(`for (let i = 0; i < ${value}.length; i++) {`)
        printer.pushIndent()
        printer.print(`const ${value}_element = ${value}[i]`)
        this.elementConvertor.convertorSerialize(param, `${value}_element`, printer)
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        let runtimeType = `runtimeType${uniqueCounter++}`;
        let arrayLength = `arrayLength${uniqueCounter++}`;
        let elementTypeName = this.table.computeTargetName(this.table.toTarget(this.elementType), false)
        printer.print(`auto ${runtimeType} = ${param}Deserializer.readInt8();`)
        printer.print(`if (${runtimeType} != ${PrimitiveType.UndefinedRuntime}) {`) // TODO: `else value = nullptr` ?
        printer.pushIndent()
        printer.print(`auto ${arrayLength} = ${param}Deserializer.readInt32();`)
        printer.print(`${param}Deserializer.resizeArray<Array_${elementTypeName}, ${elementTypeName}>(&${value}, ${arrayLength});`);
        printer.print(`for (int i = 0; i < ${arrayLength}; i++) {`)
        printer.pushIndent()
        this.elementConvertor.convertorDeserialize(param, `${value}.array[i]`, printer)
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`}`)

    }
    nativeType(impl: boolean): string {
        return `Array_${this.table.computeTypeName(undefined, this.elementType, false)}`
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 32
    }
    isPointerType(): boolean {
        return true
    }
}
export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // TODO: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super("number", [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, language: Language): string {
        return language == Language.CPP ? this.convertorCArg(param) : param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeNumber(${value})`)
    }
    convertorCArg(param: string): string {
        return `(const ${PrimitiveType.Number.getText()}*)&${param}`
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readNumber();`)
    }
    nativeType(): string {
        return PrimitiveType.Number.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ?  "KInteropNumber" : "number"
    }
    estimateSize() {
        return 5
    }
    isPointerType(): boolean {
        return true
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        param: string,
        protected table: DeclarationTable,
        type: ts.TypeReferenceNode
    ) {
        super(name, [RuntimeType.MATERIALIZED], false, true, param)
    }

    convertorArg(param: string, language: Language): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeMaterialized(${value})`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.readMaterialized();`)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Materialized.getText()
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
    }
}

export class PredefinedConvertor extends BaseArgConvertor {
    constructor(param: string, tsType: string, private convertorName: string, private cType: string) {
        super(tsType, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
    }
    convertorArg(param: string, language: Language): string {
        throw new Error("unused")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        //printer.print(`${param}Serializer.writeAnimationRange(${value});`)
        printer.print(`${param}Serializer.write${this.convertorName}(${value})`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${value} = ${param}Deserializer.read${this.convertorName}();`)
    }
    nativeType(impl: boolean): string {
        return this.cType
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() + "*" :  "Int32ArrayPtr"
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
    convertorArg(param: string, language: Language): string {
        return this.convertor.convertorArg(param, language)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): void {
        this.convertor.convertorDeserialize(param, value, printer)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.convertor.convertorSerialize(param, value, printer)
    }
    nativeType(impl: boolean): string {
        return this.convertor.nativeType(impl)
    }
    interopType(language: Language): string {
        return this.convertor.interopType(language)
    }
    isPointerType(): boolean {
        return this.convertor.isPointerType()
    }
}

export class TypeAliasConvertor extends ProxyConvertor {
    constructor(
        param: string,
        private table: DeclarationTable,
        declaration: ts.TypeAliasDeclaration,
        private typeArguments?: ts.NodeArray<ts.TypeNode>
    ) {
        super(table.typeConvertor(param, declaration.type))
    }
}

export interface RetConvertor {
    isVoid: boolean
    isStruct: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}
