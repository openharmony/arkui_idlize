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

import * as idl from "../idl"
import { Language } from "../Language"
import { LibraryInterface } from "../LibraryInterface"
import { PrimitiveType } from "./ArkPrimitiveType"
import { BlockStatement, BranchStatement, createTypeNameConvertor, generateTypeCheckerName, LanguageExpression, LanguageStatement, LanguageWriter, StringExpression } from "./LanguageWriters"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8,
    MATERIALIZED = 9,
}

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    interopType?: () => string
    macroSuffixPart: () => string
}

export type ExpressionAssigneer = (expression: LanguageExpression) => LanguageStatement

export interface ArgConvertor { // todo:
    param: string
    idlType: idl.IDLType
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    convertorArg(param: string, writer: LanguageWriter): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement
    interopType(language: Language): string
    nativeType(): idl.IDLType
    targetType(writer: LanguageWriter): string
    isPointerType(): boolean
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined
    getMembers(): string[]
    getObjectAccessor(languge: Language, value: string, args?: Record<string, string>, writer?: LanguageWriter): string
}

export abstract class BaseArgConvertor implements ArgConvertor {
    constructor(
        public idlType: idl.IDLType,
        public runtimeTypes: RuntimeType[],
        public isScoped: boolean,
        public useArray: boolean,
        public param: string
    ) { }

    nativeType(): idl.IDLType {
        throw new Error("Define")
    }
    isPointerType(): boolean {
        throw new Error("Define")
    }
    interopType(language: Language): string {
        throw new Error("Define")
    }
    targetType(writer: LanguageWriter): string {
        return writer.getNodeName(this.idlType)
    }
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    abstract convertorArg(param: string, writer: LanguageWriter): string
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    abstract convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined {
        return undefined
    }
    getMembers(): string[] { return [] }
    getObjectAccessor(language: Language, value: string, args?: Record<string, string>, writer?: LanguageWriter): string {
        if (writer) return writer.getObjectAccessor(this, value, args)
        return this.useArray && args?.index ? `${value}[${args.index}]` : value
    }
    protected discriminatorFromFields<T>(value: string,
                                         writer: LanguageWriter,
                                         uniqueFields: T[] | undefined,
                                         nameAccessor: (field: T) => string,
                                         optionalAccessor: (field: T) => boolean,
                                         duplicates: Set<string>){
        if (!uniqueFields || uniqueFields.length === 0) return undefined
        const firstNonOptional = uniqueFields.find(it => !optionalAccessor(it))
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, [
            writer.makeDiscriminatorFromFields(this,
                value,
                firstNonOptional ? [nameAccessor(firstNonOptional)] : uniqueFields.map(it => nameAccessor(it)),
                duplicates)
        ])
    }
}

export class ProxyConvertor extends BaseArgConvertor {
    constructor(public convertor: ArgConvertor, suggestedName?: string) {
        super(suggestedName ? idl.toIDLType(suggestedName) : convertor.idlType, convertor.runtimeTypes, convertor.isScoped, convertor.useArray, convertor.param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return this.convertor.convertorArg(param, writer)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return this.convertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.convertor.convertorSerialize(param, value, printer)
    }
    nativeType(): idl.IDLType {
        return this.convertor.nativeType()
    }
    interopType(language: Language): string {
        return this.convertor.interopType(language)
    }
    isPointerType(): boolean {
        return this.convertor.isPointerType()
    }
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.convertor.unionDiscriminator(value, index, writer, duplicates)
    }
    getMembers(): string[] {
        return this.convertor.getMembers()
    }
}

export class UnionRuntimeTypeChecker {
    private conflictingConvertors: Set<ArgConvertor> = new Set()
    private duplicateMembers: Set<string> = new Set()
    private discriminators: [LanguageExpression | undefined, ArgConvertor, number][] = []

    constructor(private convertors: ArgConvertor[]) {
        this.checkConflicts()
    }
    private checkConflicts() {
        const runtimeTypeConflicts: Map<RuntimeType, ArgConvertor[]> = new Map()
        this.convertors.forEach(conv => {
            conv.runtimeTypes.forEach(rtType => {
                const convertors = runtimeTypeConflicts.get(rtType)
                if (convertors) convertors.push(conv)
                else runtimeTypeConflicts.set(rtType, [conv])
            })
        })
        runtimeTypeConflicts.forEach((convertors, rtType) => {
            if (convertors.length > 1) {
                const allMembers: Set<string> = new Set()
                if (rtType === RuntimeType.OBJECT) {
                    convertors.forEach(convertor => {
                        convertor.getMembers().forEach(member => {
                            if (allMembers.has(member)) this.duplicateMembers.add(member)
                            allMembers.add(member)
                        })
                    })
                }
                convertors.forEach(convertor => {
                    this.conflictingConvertors.add(convertor)
                })
            }
        })
    }
    makeDiscriminator(value: string, index: number, writer: LanguageWriter): LanguageExpression {
        const convertor = this.convertors[index]
        if (this.conflictingConvertors.has(convertor) && writer.language.needsUnionDiscrimination) {
            const discriminator = convertor.unionDiscriminator(value, index, writer, this.duplicateMembers)
            this.discriminators.push([discriminator, convertor, index])
            if (discriminator) return discriminator
        }
        return writer.makeNaryOp("||", convertor.runtimeTypes.map(it =>
            writer.makeNaryOp("==", [
                writer.makeUnionVariantCondition(
                    convertor,
                    value,
                    `${value}_type`,
                    RuntimeType[it],
                    index)])))
    }
    reportConflicts(context: string | undefined) {
        if (this.discriminators.filter(([discriminator, _, __]) => discriminator === undefined).length > 1) {
            console.log(`WARNING: runtime type conflict in "${context}`)
            this.discriminators.forEach(([discr, conv, n]) =>
                console.log(`   ${n} : ${conv.constructor.name} : ${discr ? discr.asString() : "<undefined>"}`))
        }
    }
}
export class BooleanConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLBooleanType, [RuntimeType.BOOLEAN], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.castToBoolean(param)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeBoolean", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readBoolean()`))
    }
    nativeType(): idl.IDLType {
        return idl.IDLBooleanType
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Boolean.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
}

export class UndefinedConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLUndefinedType, [RuntimeType.UNDEFINED], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeUndefined().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {}
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeUndefined())
    }
    nativeType(): idl.IDLType {
        return idl.IDLUndefinedType
    }
    interopType(language: Language): string {
        return PrimitiveType.NativePointer.getText()
    }
    isPointerType(): boolean {
        return false
    }
}

export class VoidConvertor extends UndefinedConvertor {
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeVoid().asString()
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeVoid())
    }
    nativeType(): idl.IDLType {
        return idl.IDLVoidType
    }
}

export class NullConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLNullType, [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeNull().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {}
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeUndefined())
    }
    nativeType(): idl.IDLType {
        return idl.IDLNullType
    }
    interopType(language: Language): string {
        return PrimitiveType.NativePointer.getText()
    }
    isPointerType(): boolean {
        return false
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeString(`${value} === null`)
    }
}

export class LengthConvertorScoped extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLLengthType, [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, false, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readLength()`))
    }
    nativeType(): idl.IDLType {
        return idl.IDLLengthType
    }
    interopType(language: Language): string {
        switch (language) {
            case Language.CPP: return PrimitiveType.ObjectHandle.getText()
            case Language.TS: case Language.ARKTS: return 'object'
            case Language.JAVA: return 'Object'
            case Language.CJ: return 'Object'
            default: throw new Error("Unsupported language")
        }
    }
    isPointerType(): boolean {
        return true
    }
}

export class LengthConvertor extends BaseArgConvertor {
    constructor(name: string, param: string, language: Language) {
        // length convertor is only optimized for NAPI interop
        super(idl.toIDLType(name), [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false,
            (language !== Language.TS && language !== Language.ARKTS), param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        switch (writer.language) {
            case Language.CPP: return `(const ${PrimitiveType.Length.getText()}*)&${param}`
            case Language.JAVA: return `${param}.value`
            case Language.CJ: return `${param}.value`
            default: return param
        }
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, 'writeLength', [printer.makeString(value)])
            )
        )
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const readExpr = writer.makeString(`${deserializerName}.readLength()`)
        if (writer.language === Language.CPP)
            return assigneer(readExpr)
        return assigneer(writer.makeCast(readExpr, this.idlType, { optional: false, unsafe: false }))
    }
    nativeType(): idl.IDLType {
        return idl.IDLLengthType
    }
    interopType(language: Language): string {
        switch (language) {
            case Language.CPP: return 'KLength'
            case Language.TS: case Language.ARKTS: return 'Length'
            case Language.JAVA: return 'String'
            case Language.CJ: return 'String'
            default: throw new Error("Unsupported language")
        }
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeNaryOp("||", [
            writer.makeNaryOp("==", [writer.makeRuntimeType(RuntimeType.NUMBER), writer.makeString(`${value}_type`)]),
            writer.makeNaryOp("==", [writer.makeRuntimeType(RuntimeType.STRING), writer.makeString(`${value}_type`)]),
            writer.makeNaryOp("&&", [
                writer.makeNaryOp("==", [writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeString(`${value}_type`)]),
                writer.makeCallIsResource(value)
            ])])
    }
}

export class CustomTypeConvertor extends BaseArgConvertor {
    // TODO: remove
    private static knownTypes: Map<string, [string, boolean][]> = new Map([
        ["LinearGradient", [["angle", true], ["direction", true], ["colors", false], ["repeating", true]]]
    ])
    constructor(param: string,
                public readonly customTypeName: string,
                private readonly isGenericType: boolean = false,
                tsType?: string) {
        super(idl.toIDLType(tsType ?? "Object"), [RuntimeType.OBJECT], false, true, param)
        warnCustomObject(`${tsType}`)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    /** todo: check */
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(
            `${param}Serializer`,
            `writeCustomObject`,
            [`"${this.customTypeName}"`, printer.makeCastCustomObject(value, this.isGenericType).asString()]
        )
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const type = writer.language === Language.CPP
            ? this.nativeType()
            : this.idlType
        return assigneer(writer.makeCast(
            writer.makeMethodCall(`${deserializerName}`,
                "readCustomObject",
                [writer.makeString(`"${this.customTypeName}"`)]),
            type, { optional: false }))
    }
    nativeType(): idl.IDLType {
        return idl.IDLCustomObjectType
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override getMembers(): string[] {
        return CustomTypeConvertor.knownTypes.get(this.customTypeName)?.map(it => it[0]) ?? super.getMembers()
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const uniqueFields = CustomTypeConvertor.knownTypes.get(this.customTypeName)?.filter(it => !duplicates.has(it[0]))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it[0], it => it[1], duplicates)
    }
}

export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // TODO: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super(idl.IDLNumberType, [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ?  `(const ${PrimitiveType.Number.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeNumber", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readNumber()`),
            this.idlType, { optional: false })
        )
    }
    nativeType(): idl.IDLType {
        return idl.IDLNumberType
    }
    interopType(language: Language): string {
        return language == Language.CPP ?  "KInteropNumber" : "number"
    }
    isPointerType(): boolean {
        return true
    }
}

export class PredefinedConvertor extends BaseArgConvertor {
    constructor(param: string, tsType: string, private convertorName: string, private cType: idl.IDLType) {
        super(idl.toIDLType(tsType), [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("unused")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.convertorName}`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.read${this.convertorName}()`))
    }
    nativeType(): idl.IDLType {
        return this.cType
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() + "*" :  "Int32ArrayPtr"
    }
    isPointerType(): boolean {
        return true
    }
}

export class StringConvertor extends BaseArgConvertor {
    private literalValue?: string
    constructor(param: string) {
        super(idl.IDLStringType, [RuntimeType.STRING], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readString()`),
            this.idlType, { optional: false }
        ))
    }
    nativeType(): idl.IDLType {
        return idl.IDLStringType
    }
    interopType(language: Language): string {
        return "KStringPtr"
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.literalValue
            ? writer.makeString(`${value} === "${this.literalValue}"`)
            : undefined
    }
    targetType(writer: LanguageWriter): string {
        if (this.literalValue) {
            return writer.getNodeName(idl.IDLStringType)
        }
        return super.targetType(writer);
    }
}

export class ToStringConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLStringType, [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : `(${param}).toString()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [
            writer.language == Language.CPP ? value : `${value}.toString()`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readString()`))
    }
    nativeType(): idl.IDLType {
        return idl.IDLStringType
    }
    interopType(language: Language): string {
        return "KStringPtr"
    }
    isPointerType(): boolean {
        return true
    }
}

export class EnumConvertor extends BaseArgConvertor { //
    constructor(param: string,
                public enumEntry: idl.IDLEnum,
                public readonly isStringEnum: boolean) {
        super(idl.createReferenceType(enumEntry.name),
            [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeEnumCast(param, false, this)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        value = printer.ordinalFromEnum(printer.makeString(value), idl.createReferenceType(this.enumEntry.name)).asString()
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const readExpr = writer.makeMethodCall(`${deserializerName}`, "readInt32", [])
        const enumExpr = writer.language === Language.ARKTS || this.isStringEnum && writer.language !== Language.CPP
            ? writer.enumFromOrdinal(readExpr, this.enumEntry)
            : writer.makeCast(readExpr, idl.createReferenceType(this.enumEntry.name))
        return assigneer(enumExpr)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.enumEntry.name)
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
    targetType(writer: LanguageWriter): string {
        return writer.getNodeName(this.idlType) // this.enumTypeName(writer.language)
    }
    extremumOfOrdinals(): {low: number, high: number} {
        let low: number = Number.MAX_VALUE
        let high: number = Number.MIN_VALUE
        this.enumEntry.elements.forEach((member, index) => {
            let value = index
            if ((typeof member.initializer === 'number') && !this.isStringEnum) {
                value = member.initializer
            }
            if (low > value) low = value
            if (high < value) high = value
        })
        return {low, high}
    }
}

export class UnionConvertor extends BaseArgConvertor { //
    private memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(private library: LibraryInterface, param: string, private type: idl.IDLUnionType) {
        super(idl.toIDLType(`object`), [], false, true, param)
        this.memberConvertors = type.types.map(member => library.typeConvertor(param, member))
        this.unionChecker = new UnionRuntimeTypeChecker(this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        this.idlType = type
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for union")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(printer.makeAssign(`${value}_type`, idl.IDLI32Type, printer.makeUnionTypeDefaultInitializer(), true, false))
        printer.writeStatement(printer.makeUnionSelector(value, `${value}_type`))
        this.memberConvertors.forEach((it, index) => {
            const maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
            const conditions = this.unionChecker.makeDiscriminator(value, index, printer)
            printer.print(`${maybeElse}if (${conditions.asString()}) {`)
            printer.pushIndent()
            printer.writeMethodCall(`${param}Serializer`, "writeInt8", [printer.castToInt(index.toString(), 8)])
            if (!(it instanceof UndefinedConvertor)) {
                printer.writeStatement(
                        printer.makeAssign(`${value}_${index}`, undefined,
                            printer.makeUnionVariantCast(it.getObjectAccessor(printer.language, value), printer.getNodeName(it.idlType), it, index), true))
                it.convertorSerialize(param, `${value}_${index}`, printer)
            }
            printer.popIndent()
            printer.print(`}`)
        })
        this.unionChecker.reportConflicts(this.library.getCurrentContext() ?? "<unknown context>")
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        let selectorBuffer = `${bufferName}_selector`
        const maybeOptionalUnion = writer.language === Language.CPP
            ? this.type
            : idl.createOptionalType(this.type)
        statements.push(writer.makeAssign(selectorBuffer, idl.IDLI32Type,
            writer.makeString(`${deserializerName}.readInt8()`), true))
        statements.push(writer.makeAssign(bufferName, maybeOptionalUnion, undefined, true, false))
        if (writer.language === Language.CPP)
            statements.push(writer.makeAssign(`${bufferName}.selector`, undefined, writer.makeString(selectorBuffer), false))
        const branches: BranchStatement[] = this.memberConvertors.map((it, index) => {
            const receiver = this.getObjectAccessor(writer.language, bufferName, {index: `${index}`})
            const expr = writer.makeString(`${selectorBuffer} == ${index}`)
            const stmt = new BlockStatement([
                writer.makeSetUnionSelector(bufferName, `${index}`),
                it.convertorDeserialize(`${bufferName}_u`, deserializerName, (expr) => {
                    return writer.makeAssign(receiver, undefined, expr, false)
                }, writer),
            ], false)
            return { expr, stmt }
        })
        statements.push(writer.makeMultiBranchCondition(branches))
        statements.push(assigneer(writer.makeCast(writer.makeString(bufferName), this.type)))
        return new BlockStatement(statements, false)
    }
    nativeType(): idl.IDLType {
        return this.type
    }
    interopType(language: Language): string {
        throw new Error("Union")
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index ? `${value}.value${args.index}` : value
    }
}

export class ImportTypeConvertor extends BaseArgConvertor { //
    private static knownTypes: Map<string, string[]> = new Map([
        ["CircleShape", ["isInstanceOf", "\"CircleShape\""]],
        ["EllipseShape", ["isInstanceOf", "\"EllipseShape\""]],
        ["PathShape", ["isInstanceOf", "\"PathShape\""]],
        ["RectShape", ["isInstanceOf", "\"RectShape\""]],
        ["ComponentContent", ["isInstanceOf", "\"ComponentContent\""]],
        ["DrawableDescriptor", ["isInstanceOf", "\"DrawableDescriptor\""]],
        ["SymbolGlyphModifier", ["isInstanceOf", "\"SymbolGlyphModifier\""]],
        ["Scene", ["isInstanceOf", "\"Scene\""]]])
    private importedName: string
    constructor(param: string, importedName: string) {
        super(idl.toIDLType("Object"), [RuntimeType.OBJECT], false, true, param)
        this.importedName = importedName
        warnCustomObject(importedName, `imported`)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeCustomObject", [`"${this.importedName}"`, value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readCustomObject("${this.importedName}")`))
    }
    nativeType(): idl.IDLType {
        // return this.importedName
        // treat ImportType as CustomObject
        return idl.IDLCustomObjectType
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const handler = ImportTypeConvertor.knownTypes.get(this.importedName)
        return handler
            ? writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
                [writer.makeString(`${handler[0]}(${handler.slice(1).concat(value).join(", ")})`)])
            : undefined
    }
}

export class OptionConvertor extends BaseArgConvertor { //
    private typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(private library: LibraryInterface, param: string, public type: idl.IDLType) {
        let conv = library.typeConvertor(param, type)
        let runtimeTypes = conv.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(idl.maybeOptional(conv.idlType, true), runtimeTypes, conv.isScoped, true, param)
        this.typeConvertor = conv
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        const valueType = `${value}_type`
        const serializedType = (printer.language == Language.JAVA ? undefined : idl.IDLI32Type)
        printer.writeStatement(printer.makeAssign(valueType, serializedType, printer.makeRuntimeType(RuntimeType.UNDEFINED), true, false))
        printer.runtimeType(this, valueType, value)
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [printer.castToInt(valueType, 8)])
        printer.print(`if (${printer.makeRuntimeTypeCondition(valueType, false, RuntimeType.UNDEFINED, value).asString()}) {`)
        printer.pushIndent()
        printer.writeStatement(printer.makeAssign(`${value}_value`, undefined, printer.makeValueFromOption(value, this.typeConvertor), true))
        this.typeConvertor.convertorSerialize(param, this.typeConvertor.getObjectAccessor(printer.language, `${value}_value`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const runtimeBufferName = `${bufferName}_runtimeType`
        const statements: LanguageStatement[] = []
        statements.push(writer.makeAssign(runtimeBufferName, undefined,
            writer.makeCast(writer.makeString(`${deserializerName}.readInt8()`), writer.getRuntimeType()), true))
        const bufferType = this.nativeType()
        statements.push(writer.makeAssign(bufferName, bufferType, undefined, true, false))

        const thenStatement = new BlockStatement([
            this.typeConvertor.convertorDeserialize(`${bufferName}_`, deserializerName, (expr) => {
                const receiver = writer.language === Language.CPP
                    ? `${bufferName}.value` : bufferName
                return writer.makeAssign(receiver, undefined, expr, false)
            }, writer)
        ])
        statements.push(writer.makeSetOptionTag(bufferName, writer.makeCast(writer.makeString(runtimeBufferName), writer.getTagType())))
        statements.push(writer.makeCondition(writer.makeRuntimeTypeDefinedCheck(runtimeBufferName), thenStatement))
        statements.push(assigneer(writer.makeString(bufferName)))
        return writer.makeBlock(statements, false)
    }
    nativeType(): idl.IDLType {
        return idl.createOptionalType(this.type)
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.NativePointer.getText() : "KNativePointer"
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP ? `${value}.value` : value
    }
}

export class AggregateConvertor extends BaseArgConvertor { //
    protected memberConvertors: ArgConvertor[]
    public members: [string, boolean][] = []
    public readonly aliasName: string | undefined

    constructor(protected library: LibraryInterface, param: string, type: idl.IDLType, protected decl: idl.IDLInterface) {
        super(type, [RuntimeType.OBJECT], false, true, param)
        // this.aliasName = ts.isTypeAliasDeclaration(this.type.parent) ? identName(this.type.parent.name) : undefined
        this.memberConvertors = decl
            .properties
            // .filter(ts.isPropertySignature)
            .map((member, index) => {
                this.members[index] = [member.name, member.isOptional]
                return library.typeConvertor(param, member.type!, member.isOptional)
            })
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for aggregates")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index][0]
            let memberAccess = `${value}.${memberName}`
            if (printer.language === Language.ARKTS && stubIsTypeCallback(this.library, this.decl.properties[index].type)) {
                memberAccess = `${memberAccess}!`
            }
            printer.writeStatement(
                printer.makeAssign(`${value}_${memberName}`, undefined,
                    printer.makeString(memberAccess), true))
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        if (writer.language === Language.CPP) {
            statements.push(writer.makeAssign(bufferName, this.idlType, undefined, true, false))
        }
        for (let i = 0; i < this.decl.properties.length; i++) {
            const prop = this.decl.properties[i]
            const propConvertor = this.memberConvertors[i]
            statements.push(propConvertor.convertorDeserialize(`${bufferName}_${prop.name}_buf`, deserializerName, (expr) => {
                if (writer.language === Language.CPP) {
                    // prefix initialization for CPP, just easier. Waiting for easy work with nullables
                    return writer.makeAssign(`${bufferName}.${writer.escapeKeyword(prop.name)}`, undefined, expr, false)
                }
                /**
                 * todo: check UnionType name creation for union of unnamed nodes (isNamedNode() == false)
                 */
                const memberType = prop.isOptional
                    ? idl.createUnionType([idl.IDLUndefinedType, prop.type!], "$NOT TO BE PRINTED%")
                    : prop.type
                return writer.makeAssign(`${bufferName}_${prop.name}`, memberType, expr, true, true)
            }, writer))
        }
        if (writer.language === Language.CPP) {
            statements.push(assigneer(writer.makeString(bufferName)))
        } else {
            const resultExpression = this.makeAssigneeExpression(this.decl.properties.map(prop => {
                if (writer.language === Language.ARKTS) {
                    if (stubIsTypeCallback(this.library, prop.type)) {
                        return [prop.name, writer.makeString('undefined')]
                    }
                }
                return [prop.name, writer.makeString(`${bufferName}_${prop.name}`)]
            }), writer)
            statements.push(assigneer(resultExpression))
        }
        return new BlockStatement(statements, false)
    }
    protected makeAssigneeExpression(fields: [string, LanguageExpression][], writer: LanguageWriter): LanguageExpression {
        const content = fields.map(it => `${it[0]}: ${it[1].asString()}`).join(', ')
        return writer.makeCast(writer.makeString(`{${content}}`), this.idlType)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl.name)
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.members.map(it => it[0])
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const uniqueFields = this.members.filter(it => !duplicates.has(it[0]))
        return this.discriminatorFromFields(value,
            writer,
            uniqueFields,
                it => it[0],
                it => it[1],
            duplicates)
    }
}

export class InterfaceConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, name: string /* change to IDLReferenceType */, param: string, public declaration: idl.IDLInterface) {
        super(idl.createReferenceType(name), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.library.getInteropName(this.idlType)}`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeMethodCall(`${deserializerName}`, `read${this.library.getInteropName(this.idlType)}`, []))
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.declaration?.properties.map(it => it.name) ?? []
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // First, tricky special cases
        if (this.declaration.name.endsWith("GestureInterface")) {
            const gestureType = this.declaration.name.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), idl.toIDLType("GestureComponent<Object>"), { unsafe: true })
            return writer.makeNaryOp("===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        if (this.declaration.name === "CancelButtonSymbolOptions") {
            return writer.makeNaryOp("&&", [
                writer.makeString(`${value}.hasOwnProperty("icon")`),
                writer.makeString(`isInstanceOf("SymbolGlyphModifier", ${value}.icon)`)])
        }
        // Try to figure out interface by examining field sets
        const uniqueFields = this.declaration?.properties.filter(it => !duplicates.has(it.name))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional, duplicates)
    }
}

export class ClassConvertor extends InterfaceConvertor { //
    constructor(library: LibraryInterface, name: string, param: string, declaration: idl.IDLInterface) {
        super(library, name, param, declaration)
    }
    override unionDiscriminator(value: string,
                                index: number,
                                writer: LanguageWriter,
                                duplicateMembers: Set<string>): LanguageExpression | undefined {
        // SubTabBarStyle causes inscrutable "SubTabBarStyle is not defined" error
        if (this.declaration.name === "SubTabBarStyle") return undefined
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.instanceOf(this, value, duplicateMembers)])
    }
}

export class FunctionConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, param: string, protected type: idl.IDLReferenceType) {
        // TODO: pass functions as integers to native side.
        super(idl.toIDLType("Function"), [RuntimeType.FUNCTION], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `makeArkFunctionFromId(${param})` : `registerCallback(${param})`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, "writeFunction", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readFunction()`),
            this.type, { optional: true }
        ))
    }
    nativeType(): idl.IDLType {
        return idl.IDLFunctionType
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
}

export class CallbackConvertor extends BaseArgConvertor {
    constructor(
        private readonly library: LibraryInterface,
        param: string,
        private readonly decl: idl.IDLCallback,
    ) {
        super(idl.createReferenceType(decl.name), [RuntimeType.FUNCTION], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        if (writer.language == Language.CPP) {
            writer.writeMethodCall(`${param}Serializer`, "writeCallbackResource", [`${value}.resource`])
            writer.writeMethodCall(`${param}Serializer`, "writePointer", [writer.makeCast(
                new StringExpression(`${value}.call`), idl.IDLPointerType, { unsafe: true }).asString()])
            return
        }
        writer.writeMethodCall(`${param}Serializer`, `holdAndWriteCallback`, [`${value}`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        if (writer.language == Language.CPP) {
            const callerInvocation = writer.makeString(`getManagedCallbackCaller(${generateCallbackKindAccess(this.decl, writer.language)})`)
            const resourceReadExpr = writer.makeMethodCall(`${deserializerName}`, `readCallbackResource`, [])
            const callReadExpr = writer.makeCast(
                writer.makeMethodCall(`${deserializerName}`, `readPointerOrDefault`,
                    [writer.makeCast(callerInvocation, idl.IDLPointerType, { unsafe: true })]),
                    idl.IDLUndefinedType /* not used */,
                    {
                        unsafe: true,
                        overrideTypeName: `void(*)(${generateCallbackAPIArguments(this.library, this.decl).join(", ")})`
                    }
            )
            return assigneer(writer.makeString(`{${resourceReadExpr.asString()}, ${callReadExpr.asString()}}`))
        }
        return assigneer(writer.makeString(
            `${deserializerName}.read${this.library.getInteropName(this.decl)}()`))
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl.name)
    }
    isPointerType(): boolean {
        return true
    }
}

export class TupleConvertor extends AggregateConvertor { //
    constructor(library: LibraryInterface, param: string, type: idl.IDLType, decl: idl.IDLInterface) {
        super(library, param, type, decl)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            printer.writeStatement(
                printer.makeAssign(`${value}_${index}`, undefined, printer.makeTupleAccess(value, index), true))
            it.convertorSerialize(param, `${value}_${index}`, printer)
        })
    }
    protected override makeAssigneeExpression(fields: [string, LanguageExpression][], writer: LanguageWriter): LanguageExpression {
        return writer.makeCast(writer.makeString(`[${fields.map(it => it[1].asString()).join(', ')}]`), this.idlType)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl.name)
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return args?.index
            ? language === Language.CPP
                ? `${value}.value${args.index}`
                : `${value}[${args.index}]`
            : value
    }
}

export class ArrayConvertor extends BaseArgConvertor { //
    elementConvertor: ArgConvertor
    constructor(private library: LibraryInterface, param: string, private type: idl.IDLContainerType, private elementType: idl.IDLType) {
        super(idl.createContainerType('sequence', [elementType]), [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = library.typeConvertor(param, elementType)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        const valueLength = printer.makeArrayLength(value).asString()
        const loopCounter = "i"
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [printer.castToInt(valueLength, 32)])
        printer.writeStatement(printer.makeLoop(loopCounter, valueLength))
        printer.pushIndent()
        printer.writeStatement(
            printer.makeAssign(`${value}_element`, undefined, printer.makeArrayAccess(value, loopCounter), true))
        this.elementConvertor.convertorSerialize(param, this.elementConvertor.getObjectAccessor(printer.language, `${value}_element`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const lengthBuffer = `${bufferName}_length`
        const counterBuffer = `${bufferName}_i`
        const statements: LanguageStatement[] = []
        const arrayType = this.idlType
        statements.push(writer.makeAssign(lengthBuffer, idl.IDLI32Type, writer.makeString(`${deserializerName}.readInt32()`), true))
        statements.push(writer.makeAssign(bufferName, arrayType, writer.makeArrayInit(this.type), true, false))
        statements.push(writer.makeArrayResize(bufferName, lengthBuffer, deserializerName))
        statements.push(writer.makeLoop(counterBuffer, lengthBuffer, writer.makeBlock([
            this.elementConvertor.convertorDeserialize(`${bufferName}_buf`, deserializerName, (expr) => {
                return writer.makeAssign(writer.makeArrayAccess(bufferName, counterBuffer).asString(), undefined, expr, false)
            }, writer)
        ])))
        statements.push(assigneer(writer.makeString(bufferName)))
        return new BlockStatement(statements, false)
    }
    nativeType(): idl.IDLType {
        return idl.createContainerType('sequence', [this.elementType])
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.instanceOf(this, value, duplicates)])
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        const array = language === Language.CPP ? ".array" : ""
        return args?.index ? `${value}${array}${args.index}` : value
    }
}

export class MapConvertor extends BaseArgConvertor { //
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(private library: LibraryInterface, param: string, type: idl.IDLType, public keyType: idl.IDLType, public valueType: idl.IDLType) {
        super(
            idl.createContainerType(
                'record', [keyType, valueType]
            ),
            [RuntimeType.OBJECT],
            false,
            true,
            param
        )
        this.keyConvertor = library.typeConvertor(param, keyType)
        this.valueConvertor = library.typeConvertor(param, valueType)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Map size.
        const mapSize = printer.makeMapSize(value)
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [mapSize.asString()])
        printer.writeStatement(printer.makeMapForEach(value, `${value}_key`, `${value}_value`, () => {
            this.keyConvertor.convertorSerialize(param, `${value}_key`, printer)
            this.valueConvertor.convertorSerialize(param, `${value}_value`, printer)
        }))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const mapTypeName = writer.getNodeName(this.idlType)
        const keyType = this.keyType
        const valueType = this.valueType
        const sizeBuffer = `${bufferName}_size`
        const keyBuffer = `${bufferName}_key`
        const valueBuffer = `${bufferName}_value`
        const counterBuffer = `${bufferName}_i`
        const keyAccessor = this.getObjectAccessor(writer.language, bufferName, {index: counterBuffer, field: "keys"})
        const valueAccessor = this.getObjectAccessor(writer.language, bufferName, {index: counterBuffer, field: "values"})
        return new BlockStatement([
            writer.makeAssign(sizeBuffer, idl.IDLI32Type,
                writer.makeString(`${deserializerName}.readInt32()`), true, true),
            writer.makeAssign(bufferName, this.idlType, writer.makeMapInit(this.idlType), true, false),
            writer.makeMapResize(mapTypeName, keyType, valueType, bufferName, sizeBuffer, deserializerName),
            writer.makeLoop(counterBuffer, sizeBuffer, new BlockStatement([
                this.keyConvertor.convertorDeserialize(`${keyBuffer}_buf`, deserializerName, (expr) => {
                    return writer.makeAssign(keyBuffer, keyType, expr, true, true)
                }, writer),
                this.valueConvertor.convertorDeserialize(`${valueBuffer}_buf`, deserializerName, (expr) => {
                    return writer.makeAssign(valueBuffer, valueType, expr, true, true)
                }, writer),
                writer.makeMapInsert(keyAccessor, keyBuffer, valueAccessor, valueBuffer),
            ], false)),
            assigneer(writer.makeString(bufferName))
        ], false)
    }

    nativeType(): idl.IDLType {
        return idl.createContainerType('record', [this.keyType, this.valueType])
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof Map`)])
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index && args?.field
            ? `${value}.${args.field}[${args.index}]`
            : value
    }
}

export class DateConvertor extends BaseArgConvertor { //
    constructor(param: string) {
        super(idl.IDLBigintType, [RuntimeType.NUMBER], false, false, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        if (writer.language === Language.CPP) {
            return param
        }
        return `${param}.getTime()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        if (writer.language === Language.CPP) {
            writer.writeMethodCall(`${param}Serializer`, "writeInt64", [value])
            return
        }
        writer.writeMethodCall(`${param}Serializer`, "writeInt64", [`${value}.getTime()`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const deserializeTime = writer.makeMethodCall(`${deserializerName}`, "readInt64", [])
        if (writer.language === Language.CPP) {
            return assigneer(deserializeTime)
        }
        return assigneer(writer.makeString(`new Date(${deserializeTime.asString()})`))
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType('Date')
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int64.getText() : "KLong"
    }
    isPointerType(): boolean {
        return false
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, name: string, param: string, private type: idl.IDLInterface) {
        super(idl.toIDLType(name), [RuntimeType.OBJECT], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, `write${this.type.name}`, [
                    printer.makeString(value)
                ])))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const readStatement = writer.makeCast(
            writer.makeMethodCall(`${deserializerName}`, `read${this.type.name}`, []),
            idl.createReferenceType(this.type.name)
        )
        return assigneer(readStatement)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.type.name) 
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.instanceOf(this, value, duplicates)])
    }
}

export class TypeAliasConvertor extends ProxyConvertor { //
    constructor(library: LibraryInterface, param: string, typedef: idl.IDLTypedef) {///, private typeArguments?: ts.NodeArray<ts.TypeNode>) {
        super(library.typeConvertor(param, typedef.type), typedef.name)
    }
}

export function cppEscape(name: string) {
    return name === "template" ? "template_" : name
}

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}

////////////////////////////////////////////////////////////////////////////////
// UTILS


export const CallbackKind = "CallbackKind"

export function generateCallbackKindName(callback: idl.IDLCallback) {
    return `Kind_${callback.name}`
}

export function generateCallbackKindAccess(callback: idl.IDLCallback, language: Language) {
    const name = generateCallbackKindName(callback)
    if (language == Language.CPP)
        return name
    return `${CallbackKind}.${name}`
}

export function generateCallbackAPIArguments(library: LibraryInterface, callback: idl.IDLCallback): string[] {
    const nameConvertor = createTypeNameConvertor(Language.CPP, library)
    const args: string[] = [`const ${PrimitiveType.Int32.getText()} resourceId`]
    args.push(...callback.parameters.map(it => {
        const target = library.toDeclaration(it.type!)
        const type = library.typeConvertor(it.name, it.type!, it.isOptional)
        const constPrefix = !idl.isEnum(target) ? "const " : ""
        return `${constPrefix}${nameConvertor.convert(type.nativeType())} ${type.param}`
    }))
    if (!idl.isVoidType(callback.returnType)) {
        const type = library.typeConvertor(`continuation`,
            library.createContinuationCallbackReference(callback.returnType)!, false)
        args.push(`const ${nameConvertor.convert(type.nativeType())} ${type.param}`)
    }
    return args
}


////////////////////////////////////////////////////////////////////////////////
// UTILS

const builtInInterfaceTypes = new Map<string,
    (writer: LanguageWriter, value: string) => LanguageExpression>([
        ["Resource",
            (writer: LanguageWriter, value: string) => writer.makeCallIsResource(value)],
        ["Object",
            (writer: LanguageWriter, value: string) => writer.makeCallIsObject(value)],
        ["ArrayBuffer",
            (writer: LanguageWriter, value: string) => writer.makeCallIsArrayBuffer(value)]
    ],
)

export function makeInterfaceTypeCheckerCall(
    valueAccessor: string,
    interfaceName: string,
    allFields: string[],
    duplicates: Set<string>,
    writer: LanguageWriter,
): LanguageExpression {
    if (builtInInterfaceTypes.has(interfaceName)) {
        return builtInInterfaceTypes.get(interfaceName)!(writer, valueAccessor)
    }
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(interfaceName), [writer.makeString(valueAccessor),
        ...allFields.map(it => {
            return writer.makeString(duplicates.has(it) ? "true" : "false")
        })
    ])
}

const customObjects = new Set<string>()
function warnCustomObject(type: string, msg?: string) {
    if (!customObjects.has(type)) {
        console.log(`WARNING: Use CustomObject for ${msg ? `${msg} ` : ``}type ${type}`)
        customObjects.add(type)
    }
}

export function stubIsTypeCallback(resolver: LibraryInterface, type: idl.IDLType): boolean {
    // TODO dirty stub, because we can not initialize functional type fields
    if (idl.hasExtAttribute(type, idl.IDLExtendedAttributes.Import))
        return false
    const refType = idl.isReferenceType(type) ? type : undefined
    const decl = refType ? resolver.resolveTypeReference(refType) : undefined
    if (decl && idl.isCallback(decl)) {
        return true
    }
    if (decl && idl.isTypedef(decl)) {
        return stubIsTypeCallback(resolver, decl.type)
    }
    return false
}