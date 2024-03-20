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
import { IndentedPrinter } from "./IndentedPrinter"
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
    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void
    interopType(): string
    nativeType(): string
    param: string
    value: string
}


export abstract class BaseArgConvertor implements ArgConvertor {
    constructor(
        public tsTypeName: string,
        public runtimeTypes: RuntimeType[],
        public isScoped: boolean,
        public useArray: boolean,
        public param: string,
        public value: string
    ) {}

    estimateSize(): number {
        return 0
    }
    nativeType(): string {
        return "Empty"
    }
    interopType(): string {
        return "void*"
    }

    scopeStart?(param: string): string
    scopeEnd?(param: string): string
    abstract convertorTSArg(param: string, value: string, printer: IndentedPrinter): void
    abstract convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void
    abstract convertorCArg(param: string, value: string, printer: IndentedPrinter): void
    abstract convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void

}

export class EmptyConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        super("any", [], false, false, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {}
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {}
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {}
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {}
}

export class StringConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        super("string", [RuntimeType.STRING], false, false, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeString(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readString();`)
    }

    nativeType(): string {
        return "    string"
    }
    interopType(): string {
        return "KStringPtr"
    }
    estimateSize() {
        return 32
    }
}

export class BooleanConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        super("boolean", [RuntimeType.BOOLEAN, RuntimeType.NUMBER], false, false, param, value)
        // TODO: shall NUMBER be here?
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeBoolean(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readBoolean();`)
    }

    nativeType(): string {
        return "KBoolean"
    }
    interopType(): string {
        return "KBoolean"
    }
    estimateSize() {
        return 1
    }
}

export class AnyConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        super("any", [], false, false, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeAny(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readAny();`)
    }

    nativeType(): string {
        return "Any"
    }
    interopType(): string {
        return "KPointer"
    }
    estimateSize() {
        return 1
    }
}

export class UndefinedConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        super("unknown", [RuntimeType.UNDEFINED], false, false, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`nullptr`)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeUndefined()`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readUndefined();`)
    }

    nativeType(): string {
        return "Undefined"
    }
    interopType(): string {
        return "KPointer"
    }

    estimateSize() {
        return 1
    }
}

export class EnumConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        // Enums are integers in runtime.
        super("number", [RuntimeType.NUMBER], false, false, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`nullptr`)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeInt32(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
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
    constructor(param: string, value: string) {
        super("Length", [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT, RuntimeType.UNDEFINED], true, false, param, value)
    }

    scopeStart(param: string): string {
        return `withLengthArray(${param}, (${param}Ptr) => {`
    }
    scopeEnd(param: string): string {
        return '})'
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}Ptr`)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeLength(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = Length::fromArray(${param});`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readLength();`)
    }
    nativeType(): string {
        return "Length"
    }
    interopType(): string {
        // TODO: is it correct?
        return "KPointer"
    }
    estimateSize() {
        return 12
    }
}

export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]

    constructor(param: string, value: string, visitor: PeerGeneratorVisitor, type: ts.UnionTypeNode) {
        super(`any`, [], false, true, param, value)
        this.memberConvertors = type
            .types
            .map(member => visitor.typeConvertor(param, value, member))
        this.checkUniques(param, this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
    }
    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Do not use for union")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`let ${value}Type = runtimeType(${value})`)
        // Save actual type being passed.
        printer.print(`${param}Serializer.writeInt8(${value}Type)`)
        this.memberConvertors.forEach((it, index) => {
                if (it.runtimeTypes.length == 0) {
                    console.log(`WARNING: branch for ${it.nativeType} was consumed`)
                    return
                }
                let maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
                let maybeComma1 = (it.runtimeTypes.length > 1) ? "(" : ""
                let maybeComma2 = (it.runtimeTypes.length > 1) ? ")" : ""

                printer.print(`${maybeElse}if (${it.runtimeTypes.map(it => `${maybeComma1}${it} == ${value}Type${maybeComma2}`).join(" || ")}) {`)
                printer.pushIndent()
                printer.print(`let ${value}_${index}: ${it.tsTypeName} = ${value} as ${this.tsTypeName}`)
                it.convertorToTSSerial(param, `${value}_${index}`, printer)
                printer.popIndent()
                printer.print(`}`)
            })
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = Length::fromArray(${param});`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.readLength();`)
    }
    nativeType(): string {
        return "Length"
    }
    interopType(): string {
        // TODO: is it correct?
        return "KPointer"
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

export class AggregateConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private members: string[][] = []

    constructor(param: string, value: string, visitor: PeerGeneratorVisitor, type: ts.TypeLiteralNode) {
        // Enums are integers in runtime.
        super(`${type.getText(type.getSourceFile())}`, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param, value)
        this.memberConvertors = type
            .members
            .filter(ts.isPropertySignature)
            .map((member, index) => {
            let memberName = ts.idText(member.name as ts.Identifier)
            let memberType = mapCType(member.type!)
            this.members[index] = [memberName, memberType]
            // ${member.questionToken ? "?" : ""}
            let name = `${param}_${memberName}`
            return visitor.typeConvertor(param, name, member.type!)
        })
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Do not use for aggregates")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index][0]
            //printer.print(`let ${it.value} = ${value}.${memberName}`)
            //it.convertorToTSSerial(it.param, it.value, printer)
            printer.print(`let ${value}_${memberName} = ${value}.${memberName}`)
            it.convertorToTSSerial(param, `${value}_${memberName}`, printer)
        })
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Do not use")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index][0]
            let memberType = this.members[index][1]
            let memberLocal = `${value}_${memberName}`
            printer.print(`${memberType} ${memberLocal};`)
            //it.convertorToCDeserial(it.param, it.value, printer)
            //printer.print(`${value}.${memberName} = ${it.value};`)
            it.convertorToCDeserial(param, memberLocal, printer)
            printer.print(`${value}.${memberName} = ${memberLocal};`)
        })
    }

    nativeType(): string {
        return `Compound<${this.memberConvertors.map(it => it.nativeType()).join(", ")}>`
    }
    interopType(): string {
        return "KPointer"
    }
    estimateSize() {
        return 4
    }
}

export class NamedConvertor extends BaseArgConvertor {
    constructor(name: string, param: string, value: string, protected visitor: PeerGeneratorVisitor) {
        super(name, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.${this.visitor.serializerName(this.tsTypeName)}(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value} = ${param}Deserializer.${this.visitor.deserializerName(this.tsTypeName)}();`)
    }
    nativeType(): string {
        return this.tsTypeName
    }
    interopType(): string {
        return "KPointer"
    }
    estimateSize() {
        return 12
    }
}

export class InterfaceConvertor extends NamedConvertor {
    constructor(param: string, value: string,  visitor: PeerGeneratorVisitor, declaration: ts.InterfaceDeclaration | ts.ClassDeclaration) {
        super(ts.idText(declaration.name as ts.Identifier), param, value, visitor)
    }
}

export class FunctionConvertor extends NamedConvertor {
    constructor(param: string, value: string, visitor: PeerGeneratorVisitor) {
        super("Function", param, value, visitor)
    }
}
/*
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
        interopType: () => "KPointer",
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
*/

export class ArrayConvertor extends BaseArgConvertor {
    elementConvertor: ArgConvertor
    constructor(param: string, value: string, protected visitor: PeerGeneratorVisitor, private elementType: ts.TypeNode) {
        super(`Array<${mapCType(elementType)}>`, [RuntimeType.OBJECT], false, true, param, value)
        this.elementConvertor = visitor.typeConvertor(param, "element", elementType)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Must never be used")
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        // Array length.
        printer.print(`${param}Serializer.writeInt32(${value}.length)`)
        printer.print(`for (let i = 0; i < ${value}.length; i++) {`)
        printer.pushIndent()
        printer.print(`let ${value}_element = ${value}[i]`)
        this.elementConvertor.convertorToTSSerial(param, `${value}_element`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        throw new Error("Must never be used")
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
        // Array length.
        printer.print(`auto ${value}_length = ${param}Serializer.readInt32();`)
        printer.print(`${mapCType(this.elementType)} ${value}[${value}_length];`)
        printer.print(`for (int i = 0; i < ${value}_length; i++) {`)
        printer.pushIndent()
        this.elementConvertor.convertorToCDeserial(param, `${value}[i]`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    nativeType(): string {
        return this.tsTypeName
    }
    interopType(): string {
        return "KPointer"
    }
    estimateSize() {
        return 12
    }
}
export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string, value: string) {
        // Enums are integers in runtime.
        super("number", [RuntimeType.NUMBER], false, false, param, value)
    }

    convertorTSArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(param)
    }
    convertorToTSSerial(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${param}Serializer.writeNumber(${value})`)
    }
    convertorCArg(param: string, value: string, printer: IndentedPrinter): void {
        printer.print(`${value}`)
    }
    convertorToCDeserial(param: string, value: string, printer: IndentedPrinter): void {
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

function mapCType(type: ts.TypeNode): string {
    if (ts.isTypeReferenceNode(type)) {
        return ts.idText(type.typeName as ts.Identifier)
    }
    return "Any"
}