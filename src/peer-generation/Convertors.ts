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
import { Language, identName, importTypeName } from "../util"
import { DeclarationTable, PrimitiveType } from "./DeclarationTable"
import { RuntimeType } from "./PeerGeneratorVisitor"
import * as ts from "typescript"
import { BlockStatement, BranchStatement, LanguageExpression, LanguageStatement, LanguageWriter, Type } from "./LanguageWriters"
import { mapType } from "./TypeNodeNameConvertor"

let uniqueCounter = 0

function castToInt(lang: Language) {
    return lang == Language.ARKTS ? " as int32" : ""
}

export interface ArgConvertor {
    param: string
    tsTypeName: string
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    hasUnionDiscriminator: boolean
    estimateSize(): number
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    convertorArg(param: string, writer: LanguageWriter): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    interopType(language: Language): string
    nativeType(impl: boolean): string
    isPointerType(): boolean
    unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression|undefined
}

export abstract class BaseArgConvertor implements ArgConvertor {
    constructor(
        public tsTypeName: string,
        public runtimeTypes: RuntimeType[],
        public isScoped: boolean,
        public useArray: boolean,
        public param: string,
        public hasUnionDiscriminator: boolean = false
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
    abstract convertorArg(param: string, writer: LanguageWriter): string
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    abstract convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression|undefined {
        return undefined
    }
}

export class StringConvertor extends BaseArgConvertor {
    constructor(param: string, receiverType: ts.TypeNode) {
        super(mapType(receiverType), [RuntimeType.STRING], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const receiver = writer.getObjectAccessor(this, param, value)
        return writer.makeAssign(receiver, undefined,
            writer.makeCast(writer.makeString(`${param}Deserializer.readString()`),
                writer.makeType(this.tsTypeName, false, receiver)),
            false)
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
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : `(${param}).toString()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [
            writer.language == Language.CPP ? value : `${value}.toString()`])///
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeAssign(value, undefined, printer.makeString(`${param}Deserializer.readString()`), false)
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
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? param : `+${param}`
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeBoolean", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(accessor, undefined, printer.makeString(`${param}Deserializer.readBoolean()`), false)
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
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? "nullptr" : "undefined"
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.print(`${param}Serializer.writeUndefined()`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeUndefined(), false)
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
    constructor(param: string,
                private enumType: ts.EnumDeclaration,
                private readonly isStringEnum: boolean) {
        super(isStringEnum ?  "string" : "number",
            [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param, true)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? param : `unsafeCast<int32>(${param})`
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        if (this.isStringEnum) {
            value = printer.ordinalFromEnum(printer.makeString(value),
                identName(this.enumType.name)!).asString()
        }
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [this.convertorArg(value, printer)])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        let readExpr = printer.makeMethodCall(`${param}Deserializer`, "readInt32", [])
        if (this.isStringEnum) {
            readExpr = printer.enumFromOrdinal(readExpr, identName(this.enumType.name)!)
        }
        const receiver = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(receiver, undefined, readExpr, false)
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
    // TODO: bit clumsy.
    unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        let low: number|undefined = undefined
        let high: number|undefined = undefined
        // TODO: proper enum value computation for cases where enum members have computed initializers.
        this.enumType.members.forEach((member, index) => {
            let value = index
            if (member.initializer) {
                let tsValue = member.initializer
                if (ts.isLiteralExpression(tsValue) && !this.isStringEnum) {
                    value = parseInt(tsValue.text)
                }
            }
            if (low === undefined || low > value) low = value
            if (high === undefined || high < value) high = value
        })
        const ordinal = this.isStringEnum
            ? writer.ordinalFromEnum(writer.makeString(value), identName(this.enumType.name)!)
            : writer.makeUnionVariantCast(value, Type.Number.name, index)
        return writer.makeNaryOp("&&", [
            writer.makeNaryOp(">=", [ordinal, writer.makeString(low!.toString())]),
            writer.makeNaryOp("<=",  [ordinal, writer.makeString(high!.toString())])
        ])
    }
}

export class LengthConvertorScoped extends BaseArgConvertor {
    constructor(param: string) {
        super("Length", [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, false, param)
    }
    scopeStart(param: string): string {
        return `withLengthArray(${param}, (${param}Ptr) => {`
    }
    scopeEnd(param: string): string {
        return '})'
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, 'writeLength', [printer.makeString(value)])
            )
        )
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeAssign(value, undefined,
            printer.makeString(`${param}Deserializer.readLength()`), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Length.getText()
    }
    interopType(language: Language): string {
        switch (language) {
            case Language.CPP: return PrimitiveType.ObjectHandle.getText()
            case Language.TS: case Language.ARKTS: return 'object'
            case Language.JAVA: return 'Object'
            default: throw new Error("Unsupported language")
        }
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
    }
}

export class LengthConvertor extends BaseArgConvertor {
    constructor(name: string, param: string) {
        super(name, [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, false, param, true)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.Length.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, 'writeLength', [printer.makeString(value)])
            )
        )
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const receiver = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(receiver, undefined,
            printer.makeCast(
                printer.makeString(`${param}Deserializer.readLength()`),
                printer.makeType(this.tsTypeName, false, receiver), false), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Length.getText()
    }
    interopType(language: Language): string {
        switch (language) {
            case Language.CPP: return 'KLength'
            case Language.TS: case Language.ARKTS: return 'string|number|object'
            case Language.JAVA: return 'Object'
            default: throw new Error("Unsupported language")
        }
    }
    estimateSize() {
        return 12
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        return writer.makeString(`isResource(${value})`)
    }
}

export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]

    constructor(param: string, private table: DeclarationTable, private type: ts.UnionTypeNode) {
        super(`object`, [], false, true, param)
        this.memberConvertors = type
            .types
            .map(member => table.typeConvertor(param, member))
        this.hasUnionDiscriminator = this.memberConvertors
            .filter(it => it.runtimeTypes.includes(RuntimeType.OBJECT))
            .every(it => it.hasUnionDiscriminator)
        this.checkUniques(param, this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for union")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeAssign(`${value}_type`, undefined,
                printer.makeUnionSelector(value), true))
        this.memberConvertors.forEach((it, index) => {
            if (it.runtimeTypes.length == 0) {
                console.log(`WARNING: branch for ${it.nativeType(false)} was consumed`)
                return
            }
            let maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
            let conditions = makeUnionVariantCondition(value, it, index, printer)
            printer.print(`${maybeElse}if (${conditions}) {`)
            printer.pushIndent()
            printer.writeMethodCall(`${param}Serializer`, "writeInt8", [index.toString() + castToInt(printer.language)])
            if (!(it instanceof UndefinedConvertor)) {
                const valueType = new Type(it.tsTypeName)
                printer.writeStatement(
                    printer.makeAssign(`${value}_${index}`, undefined,
                        printer.makeUnionVariantCast(value, valueType.name, index), true))
                it.convertorSerialize(param, `${value}_${index}`, printer)
            }
            printer.popIndent()
            printer.print(`}`)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        let selector = `selector${uniqueCounter++}`
        const selectorAssign = printer.makeAssign(selector, Type.Int32,
            printer.makeString(`${param}Deserializer.readInt8()`), true)
        const branches: BranchStatement[] = this.memberConvertors.map((it, index) => {
            const receiver = printer.getObjectAccessor(this, param, value, {index: `${index}`})
            const expr = printer.makeString(`${selector} == ${index}`)
            const stmt = new BlockStatement([
                it.convertorDeserialize(param, receiver, printer),
                printer.makeSetUnionSelector(value, `${index}`)
            ], false)
            return { expr, stmt }
        })
        return new BlockStatement([selectorAssign, printer.makeMultiBranchCondition(branches)], false)
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
                    if (index != -1 && !convertors[i].hasUnionDiscriminator && !convertors[j].hasUnionDiscriminator) {
                        let current = this.table.getCurrentContext()
                        if (!current) throw new Error("Used in undefined context, do setCurrentContext()")
                        if (!UnionConvertor.reportedConflicts.has(current)) {
                            if (current) UnionConvertor.reportedConflicts.add(current)
                            console.log(`WARNING: runtime type conflict in "${current ?? "<unknown>"} ${param}": could be ${RuntimeType[value]} in both ${convertors[i].constructor.name} and ${convertors[j].constructor.name}`)
                        }
                        //second.splice(index, 1)
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

export function makeUnionVariantCondition(value: string, convertor: ArgConvertor, index: number, printer: LanguageWriter): string {
    const runtimeTypes = convertor?.runtimeTypes ?? [RuntimeType.UNDEFINED]
    let conditions = printer.makeNaryOp("||", runtimeTypes.map(it =>
        printer.makeNaryOp("==", [ printer.makeUnionVariantCondition(`${value}_type`, RuntimeType[it], index)])))
    const unionDiscriminator = printer.language.needsUnionDiscrimination ? convertor?.unionDiscriminator(value, index, printer) : undefined
    if (unionDiscriminator) {
        conditions = printer.makeNaryOp("&&", [conditions, unionDiscriminator])
    }
    return `(${conditions.asString()})`
}

export class ImportTypeConvertor extends BaseArgConvertor {
    private static knownTypes = [ "PixelMap", "Resource" ]
    private importedName: string
    constructor(param: string, private table: DeclarationTable, type: ts.ImportTypeNode) {
        super("Object", [RuntimeType.OBJECT], false, true, param)
        this.importedName = importTypeName(type)
        this.hasUnionDiscriminator = ImportTypeConvertor.knownTypes.includes(this.importedName)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeCustomObject", [`"${this.importedName}"`, value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeString(`${param}Deserializer.readCustomObject("${this.importedName}")`), false)
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
    unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        return this.hasUnionDiscriminator
            ? writer.makeString(`is${this.importedName}(${value})`)
            : undefined
    }
}

export class CustomTypeConvertor extends BaseArgConvertor {
    private customName: string
    constructor(param: string, customName: string, tsType?: string) {
        super(tsType ?? "Object", [RuntimeType.OBJECT], false, true, param)
        this.customName = customName
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `writeCustomObject`, [`"${this.customName}"`, value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const receiver = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(receiver, undefined,
                printer.makeCast(printer.makeMethodCall(`${param}Deserializer`,
                        "readCustomObject",
                        [printer.makeString(`"${this.customName}"`)]),
                    printer.makeType(this.tsTypeName, false, receiver)), false)
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
    constructor(param: string, private table: DeclarationTable, public type: ts.TypeNode) {
        let typeConvertor = table.typeConvertor(param, type)
        let runtimeTypes = typeConvertor.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(`${typeConvertor.tsTypeName}|undefined`, runtimeTypes, typeConvertor.isScoped, true, param)
        this.typeConvertor = typeConvertor
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        const valueType = `${value}_type`
        printer.writeStatement(printer.makeAssign(valueType, Type.Int32,
            printer.makeFunctionCall("runtimeType", [printer.makeString(value)]), true))
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [valueType  + castToInt(printer.language)])
        printer.print(`if (${printer.makeRuntimeTypeCondition(valueType, false, RuntimeType.UNDEFINED).asString()}) {`)
        printer.pushIndent()
        printer.writeStatement(printer.makeAssign(`${value}_value`, undefined, printer.makeValueFromOption(value), true))
        this.typeConvertor.convertorSerialize(param, `${value}_value`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const runtimeType = `runtimeType${uniqueCounter++}`
        const accessor = printer.getObjectAccessor(this, param, value)
        const thenStatement = new BlockStatement([
            this.typeConvertor.convertorDeserialize(param, accessor, printer)
        ])
        return new BlockStatement([
            printer.makeAssign(runtimeType, undefined,
                printer.makeCast(printer.makeString(`${param}Deserializer.readInt8()`), printer.getRuntimeType()), true),
            printer.makeSetOptionTag(value, printer.makeCast(printer.makeString(runtimeType), printer.getTagType())),
            printer.makeCondition(printer.makeRuntimeTypeDefinedCheck(runtimeType), thenStatement)
        ], false)
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
        return this.typeConvertor.estimateSize() + 1
    }
    isPointerType(): boolean {
        return true
    }
}

export class AggregateConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private members: string[] = []

    constructor(param: string, private table: DeclarationTable, private type: ts.TypeLiteralNode) {
        super(mapType(type), [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = type
            .members
            .filter(ts.isPropertySignature)
            .map((member, index) => {
                this.members[index] = identName(member.name)!
                return table.typeConvertor(param, member.type!, member.questionToken != undefined)
            })
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for aggregates")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index]
            printer.writeStatement(
                printer.makeAssign(`${value}_${memberName}`, undefined,
                    printer.makeString(`${value}.${memberName}`), true))
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const structAccessor = printer.getObjectAccessor(this, param, value)
        let struct = this.table.targetStruct(this.table.toTarget(this.type))
        const typedStruct = `typedStruct${uniqueCounter++}`
        const statements = [
            printer.makeObjectAlloc(structAccessor, struct.getFields()),
            printer.makeAssign(typedStruct, new Type(printer.makeRef(printer.makeType(this.tsTypeName, false, structAccessor).name)),
                printer.makeString(structAccessor),true, false
            )
        ]
        this.memberConvertors.forEach((it, index) => {
            // TODO: maybe use accessor?
            statements.push(
                it.convertorDeserialize(param, `${typedStruct}.${struct.getFields()[index].name}`, printer)
            )
        })
        return new BlockStatement(statements, false)
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

export class InterfaceConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        param: string,
        protected table: DeclarationTable,
        private type: ts.TypeReferenceNode,
        hasUnionDiscriminator: boolean = false) {
        super(name, [RuntimeType.OBJECT], false, true, param, hasUnionDiscriminator)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, this.table.serializerName(this.tsTypeName, this.type), [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeMethodCall(`${param}Deserializer`, this.table.deserializerName(this.tsTypeName, this.type), []), false)
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

export class ClassConvertor extends InterfaceConvertor {
    constructor(name: string, param: string, table: DeclarationTable, type: ts.TypeReferenceNode) {
        super(name, param, table, type, true)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        return writer.makeString(`${value} instanceof ${this.tsTypeName}`)
    }
}

export class FunctionConvertor extends BaseArgConvertor {
    constructor(
        param: string,
        protected table: DeclarationTable,
        private type: ts.TypeNode) {
        // TODO: pass functions as integers to native side.
        super("Function", [RuntimeType.FUNCTION], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeFunction", [value])
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, param, value)
        return printer.makeAssign(accessor, undefined,
            printer.makeCast(printer.makeString(`${param}Deserializer.readFunction()`),
                printer.makeType(mapType(this.type), true, accessor))
            , false)
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
    constructor(param: string, protected table: DeclarationTable, private type: ts.TupleTypeNode) {
        super(`[${type.elements.map(it => mapType(it)).join(",")}]`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = type
            .elements
            .map(element => table.typeConvertor(param, element))
    }
    private memberConvertors: ArgConvertor[]
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            printer.makeFunctionCall("runtimeType", [ printer.makeString(value) ]).asString() + castToInt(printer.language) ])
        this.memberConvertors.forEach((it, index) => {
            printer.writeStatement(
                printer.makeAssign(`${value}_${index}`, undefined, printer.makeTupleAccess(value, index), true))
            it.convertorSerialize(param, `${value}_${index}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const runtimeType = `runtimeType${uniqueCounter++}`
        const receiver = printer.getObjectAccessor(this, param, value)
        const statements: LanguageStatement[] = []
        const tmpTupleIds: string[] = []
        this.memberConvertors.forEach((it, index) => {
            const tmpTupleId = `tmpTupleItem${index}`
            tmpTupleIds.push(tmpTupleId)
            const receiver = printer.getObjectAccessor(this, param, value, {index: `${index}`})
            // need to remove the mark '?' from Optional type
            const tsTypeName = mapType(this.type.elements[index]).replace("?", "")
            statements.push(
                printer.makeAssign(tmpTupleId,
                    // makeType - creating the correct type for TS(using tsTypeName) or C++(use decltype(receiver))
                    printer.makeType(tsTypeName, true, receiver),undefined, true, false),
                it.convertorDeserialize(param, tmpTupleId, printer)
            )
        })
        statements.push(printer.makeTupleAssign(receiver, tmpTupleIds))
        const thenStatement = new BlockStatement(statements)
        return new BlockStatement([
            printer.makeAssign(runtimeType, undefined,
                printer.makeCast(printer.makeString(`${param}Deserializer.readInt8()`), printer.getRuntimeType()), true),
            printer.makeCondition(
                printer.makeRuntimeTypeDefinedCheck(runtimeType),
                thenStatement)
        ], false)
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
    constructor(param: string, public table: DeclarationTable, private type: ts.TypeNode, public elementType: ts.TypeNode) {
        super(`Array<${mapType(elementType)}>`, [RuntimeType.OBJECT], false, true, param, true)
        this.elementConvertor = table.typeConvertor(param, elementType)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            printer.makeFunctionCall("runtimeType", [ printer.makeString(value) ]).asString() + castToInt(printer.language)])
        const valueLength = printer.makeArrayLength(value).asString()
        const loopCounter = "i"
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [valueLength + castToInt(printer.language)])
        printer.writeStatement(printer.makeLoop(loopCounter, valueLength))
        printer.pushIndent()
        printer.writeStatement(
            printer.makeAssign(`${value}_element`, undefined, printer.makeArrayAccess(value, loopCounter), true))
        this.elementConvertor.convertorSerialize(param, `${value}_element`, printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        // Array length.
        const runtimeType = `runtimeType${uniqueCounter++}`;
        const arrayLength = `arrayLength${uniqueCounter++}`;
        const forCounterName = `i${uniqueCounter++}`
        const arrayAccessor = printer.getObjectAccessor(this, param, value)
        const accessor = printer.getObjectAccessor(this, param, arrayAccessor, {index: `[${forCounterName}]`})
        const thenStatement = new BlockStatement([
            // read length
            printer.makeAssign(arrayLength, undefined, printer.makeString(`${param}Deserializer.readInt32()`), true),
            // prepare object
            printer.makeArrayResize(arrayAccessor, mapType(this.type), arrayLength, `${param}Deserializer`),
            // store
            printer.makeLoop(forCounterName, arrayLength,
                this.elementConvertor.convertorDeserialize(param, accessor, printer)),
        ])
        const statements = [
            printer.makeAssign(runtimeType,
                undefined,
                printer.makeCast(printer.makeString(`${param}Deserializer.readInt8()`), printer.getRuntimeType()), true),
            printer.makeCondition(printer.makeRuntimeTypeDefinedCheck(runtimeType), thenStatement)
        ]
        return new BlockStatement(statements, false)
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
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        return writer.makeString(`${value} instanceof Array`)
    }
}

export class MapConvertor extends BaseArgConvertor {
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(param: string, public table: DeclarationTable, type: ts.TypeNode, public keyType: ts.TypeNode, public valueType: ts.TypeNode) {
        super(`Map<${mapType(keyType)}, ${mapType(valueType)}>`, [RuntimeType.OBJECT], false, true, param, true)
        this.keyConvertor = table.typeConvertor(param, keyType)
        this.valueConvertor = table.typeConvertor(param, valueType)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Map size.
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            printer.makeFunctionCall("runtimeType", [ printer.makeString(value)]).asString() + castToInt(printer.language)])
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [`${value}.size` + castToInt(printer.language)])
        printer.writeStatement(printer.makeMapForEach(value, `${value}_key`, `${value}_value`, () => {
            this.keyConvertor.convertorSerialize(param, `${value}_key`, printer)
            this.valueConvertor.convertorSerialize(param, `${value}_value`, printer)
        }))
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        // Map size.
        const runtimeType = `runtimeType${uniqueCounter++}`;
        const mapSize = `mapSize${uniqueCounter++}`;
        const keyTypeName = printer.makeMapKeyTypeName(this)
        const valueTypeName = printer.makeMapValueTypeName(this)
        const counterVar = `i${uniqueCounter++}`
        const keyAccessor = printer.getObjectAccessor(this, param, value, {index: counterVar, field: "keys"})
        const valueAccessor = printer.getObjectAccessor(this, param, value, {index: counterVar, field: "values"})
        const tmpKey = `tmpKey${uniqueCounter++}`
        const tmpValue = `tmpValue${uniqueCounter++}`
        const statements = [
            printer.makeAssign(runtimeType, undefined,
                printer.makeCast(printer.makeString(`${param}Deserializer.readInt8()`), printer.getRuntimeType()), true),
            printer.makeCondition(printer.makeRuntimeTypeDefinedCheck(runtimeType), new BlockStatement([
                printer.makeAssign(mapSize, undefined, printer.makeString(`${param}Deserializer.readInt32()`), true),
                printer.makeMapResize(keyTypeName, valueTypeName, value, mapSize, `${param}Deserializer`),
                printer.makeLoop(counterVar, mapSize, new BlockStatement([
                    printer.makeAssign(tmpKey, new Type(keyTypeName), undefined, true, false),
                    this.keyConvertor.convertorDeserialize(param, tmpKey, printer),
                    printer.makeAssign(tmpValue, new Type(keyTypeName), undefined, true, false),
                    this.valueConvertor.convertorDeserialize(param, tmpValue, printer),
                    printer.makeMapInsert(keyAccessor, tmpKey, valueAccessor, tmpValue),
                ], false)),
            ])),
        ]
        return new BlockStatement(statements, false)
    }

    nativeType(impl: boolean): string {
        const keyTypeName = this.table.computeTypeName(undefined, this.keyType, false)
        const valueTypeName = this.table.computeTypeName(undefined, this.valueType, false)
        return `Map_${keyTypeName}_${valueTypeName}`
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    estimateSize() {
        return 64
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        return writer.makeString(`${value} instanceof Map`)
    }
}

export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // TODO: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super("number", [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ?  `(const ${PrimitiveType.Number.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeNumber", [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const receiver = writer.getObjectAccessor(this, param, value)
        return writer.makeAssign(receiver, undefined,
            writer.makeCast(
                writer.makeString(`${param}Deserializer.readNumber()`),
                writer.makeType(this.tsTypeName, false, receiver)), false)
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
        private type: ts.ClassDeclaration,
    ) {
        super(name, [RuntimeType.OBJECT], false, true, param, true)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeMaterialized", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, param, value)
        const readStatement = printer.makeCast(
            printer.makeMethodCall(`${param}Deserializer`, `readMaterialized`, []),
            new Type(this.table.computeTargetName(this.type, false)!),
        )
        return printer.makeAssign(accessor, undefined, readStatement, false)
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
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        // SubTabBarStyle causes inscrutable "SubTabBarStyle is not defined" error
        if (this.tsTypeName === "SubTabBarStyle") return undefined
        return writer.makeString(`${value} instanceof ${this.tsTypeName}`)
    }
}

export class PredefinedConvertor extends BaseArgConvertor {
    constructor(param: string, tsType: string, private convertorName: string, private cType: string) {
        super(tsType, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("unused")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.convertorName}`, [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const accessor = writer.getObjectAccessor(this, param, value)
        return writer.makeAssign(accessor, undefined, writer.makeString(`${param}Deserializer.read${this.convertorName}()`), false)
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
        super(convertor.tsTypeName, convertor.runtimeTypes, convertor.isScoped, convertor.useArray, convertor.param, convertor.hasUnionDiscriminator)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return this.convertor.convertorArg(param, writer)
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return this.convertor.convertorDeserialize(param, value, writer)
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
    unionDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression | undefined {
        return this.convertor.unionDiscriminator(value, index, writer)
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
    nativeType: () => string
    macroSuffixPart: () => string
}
