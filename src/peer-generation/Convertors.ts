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
import { Language, identName, identNameWithNamespace, importTypeName } from "../util"
import { DeclarationTable, FieldRecord, PrimitiveType } from "./DeclarationTable"
import { RuntimeType } from "./PeerGeneratorVisitor"
import * as ts from "typescript"
import { BlockStatement, BranchStatement, LanguageExpression, LanguageStatement, LanguageWriter, NamedMethodSignature, Type } from "./LanguageWriters"
import { mapType, TypeNodeNameConvertor } from "./TypeNodeNameConvertor"

function castToInt8(value: string, lang: Language): string {
    switch (lang) {
        case Language.ARKTS: return `${value} as int32` // FIXME: is there int8 in ARKTS?
        case Language.CJ: return `Int8(${value})`
        default: return value
    }
}

function castToInt32(value: string, lang: Language): string {
    switch (lang) {
        case Language.ARKTS: return `${value} as int32`
        case Language.CJ: return `Int32(${value})`
        default: return value
    }
}

export interface ArgConvertor {
    param: string
    tsTypeName: string
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    convertorArg(param: string, writer: LanguageWriter): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    interopType(language: Language): string
    nativeType(impl: boolean): string
    targetType(writer: LanguageWriter): Type
    isPointerType(): boolean
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined
    getMembers(): string[]
}

export abstract class BaseArgConvertor implements ArgConvertor {
    constructor(
        public tsTypeName: string,
        public runtimeTypes: RuntimeType[],
        public isScoped: boolean,
        public useArray: boolean,
        public param: string
    ) { }

    nativeType(impl: boolean): string {
        throw new Error("Define")
    }
    isPointerType(): boolean {
        throw new Error("Define")
    }
    interopType(language: Language): string {
        throw new Error("Define")
    }
    targetType(writer: LanguageWriter): Type {
        return new Type(writer.mapType(new Type(this.tsTypeName), this))
    }
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    abstract convertorArg(param: string, writer: LanguageWriter): string
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    abstract convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined {
        return undefined
    }
    getMembers(): string[] { return [] }
    protected discriminatorFromExpressions(value: string, runtimeType: RuntimeType, writer: LanguageWriter, exprs: LanguageExpression[]) {
        return writer.makeNaryOp("&&", [
            writer.makeNaryOp("==", [writer.makeRuntimeType(runtimeType), writer.makeString(`${value}_type`)]),
            ...exprs
        ])
    }
    protected discriminatorFromFields<T>(value: string, writer: LanguageWriter,
        uniqueFields: T[] | undefined, nameAccessor: (field: T) => string, optionalAccessor: (field: T) => boolean)
    {
        if (!uniqueFields || uniqueFields.length === 0) return undefined
        const firstNonOptional = uniqueFields.find(it => !optionalAccessor(it))
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer, [
            writer.makeDiscriminatorFromFields(this, value,
                firstNonOptional ? [nameAccessor(firstNonOptional)] : uniqueFields.map(it => nameAccessor(it)))
        ])
    }
}

export class StringConvertor extends BaseArgConvertor {
    private readonly literalValue?: string
    constructor(param: string, receiverType: ts.TypeNode, typeNodeNameConvertor: TypeNodeNameConvertor | undefined) {
        super(typeNodeNameConvertor?.convert(receiverType) ?? mapType(receiverType), [RuntimeType.STRING], false, false, param)
        if (ts.isLiteralTypeNode(receiverType) && ts.isStringLiteral(receiverType.literal)) {
            this.literalValue = receiverType.literal.text
        }
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` :
            this.isLiteral() ? `${param}.toString()` : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const receiver = writer.getObjectAccessor(this, value)
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
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.isLiteral()
            ? writer.compareLiteral(writer.makeString(value), this.literalValue!)
            : undefined
    }
    targetType(writer: LanguageWriter): Type {
        if (this.isLiteral()) {
            return new Type("string")
        }
        return super.targetType(writer);
    }
    isLiteral(): boolean {
        return this.literalValue !== undefined
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
            writer.language == Language.CPP ? value : `${value}.toString()`])
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
    isPointerType(): boolean {
        return true
    }
}

export class BooleanConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("boolean", [RuntimeType.BOOLEAN], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        switch (writer.language) {
            case Language.CPP: return param
            case Language.TS: return `+${param}`
            case Language.ARKTS: return `${param} ? 1 : 0`
            case Language.JAVA: return `${param} ? 1 : 0`
            case Language.CJ: return `if (${param}) { 1 } else { 0 }`
            default: throw new Error("Unsupported language")
        }
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeBoolean", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
        return printer.makeAssign(accessor, undefined, printer.makeString(`${param}Deserializer.readBoolean()`), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Boolean.getText()
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
        super("undefined", [RuntimeType.UNDEFINED], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeUndefined().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {}
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeUndefined(), false)
    }
    nativeType(impl: boolean): string {
        return "Undefined"
    }
    interopType(language: Language): string {
        return PrimitiveType.NativePointer.getText()
    }
    isPointerType(): boolean {
        return false
    }
}

export class NullConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("null", [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeNull().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {}
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
        return printer.makeAssign(accessor, undefined, printer.makeUndefined(), false)
    }
    nativeType(impl: boolean): string {
        return "nullptr"
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

export class EnumConvertor extends BaseArgConvertor {
    constructor(param: string,
                private enumType: ts.EnumDeclaration,
                public readonly isStringEnum: boolean) {
        super(isStringEnum ?  "string" : "number",
            [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    enumTypeName(language: Language): string {
        const prefix = language === Language.CPP ? PrimitiveType.ArkPrefix : ""
        return `${prefix}${identNameWithNamespace(this.enumType, language)}`
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeCastEnumToInt(this, param)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        if (this.isStringEnum) {
            value = printer.ordinalFromEnum(printer.makeString(value),
                identName(this.enumType.name)!).asString()
        }
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [printer.makeCastEnumToInt(this, value)])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const isCpp = printer.language === Language.CPP
        const name = this.enumTypeName(printer.language)
        let readExpr = printer.makeMethodCall(`${param}Deserializer`, "readInt32", [])
        if (this.isStringEnum && !isCpp) {
            readExpr = printer.enumFromOrdinal(readExpr, name)
        } else {
            readExpr = printer.makeCast(readExpr, new Type(name))
        }
        return printer.makeAssign(printer.getObjectAccessor(this, value), undefined, readExpr, false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Int32.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
    // TODO: bit clumsy.
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        //TODO: move to LanguageWrites
        if (writer.language == Language.ARKTS) {
            return writer.makeString(`${value} instanceof ${this.enumTypeName(writer.language)}`)
        }
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
            ? writer.ordinalFromEnum(writer.makeString(writer.getObjectAccessor(this, value)), identName(this.enumType.name)!)
            : writer.makeUnionVariantCast(writer.getObjectAccessor(this, value), Type.Number, this, index)
        return this.discriminatorFromExpressions(value, this.runtimeTypes[0], writer, [
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
            case Language.CJ: return 'Object'
            default: throw new Error("Unsupported language")
        }
    }
    isPointerType(): boolean {
        return true
    }
}

export class LengthConvertor extends BaseArgConvertor {
    constructor(name: string, param: string) {
        super(name, [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, false, param)
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
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const receiver = printer.getObjectAccessor(this, value)
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
    reportConflicts(context: string) {
        if (this.discriminators.filter(([discriminator, _, __]) => discriminator === undefined).length > 1) {
            console.log(`WARNING: runtime type conflict in "${context}`)
            this.discriminators.forEach(([discr, conv, n]) =>
                console.log(`   ${n} : ${conv.constructor.name} : ${discr ? discr.asString() : "<undefined>"}`))
        }
    }
}
export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(param: string, private table: DeclarationTable, private type: ts.UnionTypeNode, typeNodeNameConvertor?: TypeNodeNameConvertor) {
        super(`object`, [], false, true, param)
        this.memberConvertors = type
            .types
            .map(member => table.typeConvertor(param, member, false, typeNodeNameConvertor))
        this.unionChecker = new UnionRuntimeTypeChecker(this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        this.tsTypeName = this.memberConvertors.map(it => it.tsTypeName).join(" | ")
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for union")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(printer.makeAssign(`${value}_type`, Type.Int32, printer.makeUnionTypeDefaultInitializer(), true, false))
        printer.writeStatement(printer.makeUnionSelector(value, `${value}_type`))
        this.memberConvertors.forEach((it, index) => {
            const maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
            const conditions = this.unionChecker.makeDiscriminator(value, index, printer)
            printer.print(`${maybeElse}if (${conditions.asString()}) {`)
            printer.pushIndent()
            printer.writeMethodCall(`${param}Serializer`, "writeInt8", [castToInt8(index.toString(), printer.language)])
            if (!(it instanceof UndefinedConvertor)) {
                printer.writeStatement(
                        printer.makeAssign(`${value}_${index}`, undefined,
                            printer.makeUnionVariantCast(printer.getObjectAccessor(it, value), it.targetType(printer), it, index), true))
                it.convertorSerialize(param, `${value}_${index}`, printer)
            }
            printer.popIndent()
            printer.print(`}`)
        })
        this.unionChecker.reportConflicts(this.table.getCurrentContext() ?? "<unknown context>")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        let selector = `selector`
        const selectorAssign = printer.makeAssign(selector, Type.Int32,
            printer.makeString(`${param}Deserializer.readInt8()`), true)
        const branches: BranchStatement[] = this.memberConvertors.map((it, index) => {
            const receiver = printer.getObjectAccessor(this, value, {index: `${index}`})
            const expr = printer.makeString(`${selector} == ${index}`)
            const stmt = new BlockStatement([
                it.convertorDeserialize(param, receiver, printer),
                printer.makeSetUnionSelector(value, `${index}`)
            ], false)
            return { expr, stmt }
        })
        return new BlockStatement([selectorAssign, printer.makeMultiBranchCondition(branches)], true)
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
    isPointerType(): boolean {
        return true
    }
}

export class ImportTypeConvertor extends BaseArgConvertor {
    private static knownTypes: Map<string, string[]> = new Map([
        ["CircleShape", ["isInstanceOf", "\"CircleShape\""]],
        ["EllipseShape", ["isInstanceOf", "\"EllipseShape\""]],
        ["PathShape", ["isInstanceOf", "\"PathShape\""]],
        ["RectShape", ["isInstanceOf", "\"RectShape\""]],
        ["ComponentContent", ["isInstanceOf", "\"ComponentContent\""]],
        ["DrawableDescriptor", ["isInstanceOf", "\"DrawableDescriptor\""]],
        ["SymbolGlyphModifier", ["isInstanceOf", "\"SymbolGlyphModifier\""]],
        ["Scene", ["isInstanceOf", "\"Scene\""]],
        ["PixelMap", ["isPixelMap"]],
        ["Resource", ["isResource"]]])
    private importedName: string
    constructor(param: string, private table: DeclarationTable, type: ts.ImportTypeNode) {
        super("Object", [RuntimeType.OBJECT], false, true, param)
        this.importedName = importTypeName(type)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeCustomObject", [`"${this.importedName}"`, value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
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
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const handler = ImportTypeConvertor.knownTypes.get(this.importedName)
        return handler
            ? this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
                [writer.makeString(`${handler[0]}(${handler.slice(1).concat(value).join(", ")})`)])
            : undefined
    }
}

export class CustomTypeConvertor extends BaseArgConvertor {
    private static knownTypes: Map<string, [string, boolean][]> = new Map([
        ["LinearGradient", [["angle", true], ["direction", true], ["colors", false], ["repeating", true]]]
    ])
    constructor(param: string,
                public readonly customTypeName: string,
                private readonly isGenericType: boolean,
                tsType?: string) {
        super(tsType ?? "Object", [RuntimeType.OBJECT], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(
            `${param}Serializer`,
            `writeCustomObject`,
            [`"${this.customTypeName}"`, printer.makeCastCustomObject(value, this.isGenericType).asString()]
        )
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const receiver = printer.getObjectAccessor(this, value)
        return printer.makeAssign(receiver, undefined,
                printer.makeCast(printer.makeMethodCall(`${param}Deserializer`,
                        "readCustomObject",
                        [printer.makeString(`"${this.customTypeName}"`)]),
                    printer.makeType(this.tsTypeName, false, receiver)), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.CustomObject.getText()
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
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it[0], it => it[1])
    }
}

export class OptionConvertor extends BaseArgConvertor {
    private typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(param: string, private table: DeclarationTable, public type: ts.TypeNode, typeNodeNameConvertor?: TypeNodeNameConvertor) {
        let typeConvertor = table.typeConvertor(param, type, false, typeNodeNameConvertor)
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
        const serializedType = (printer.language == Language.JAVA ? undefined : Type.Int32)
        printer.writeStatement(printer.makeAssign(valueType, serializedType, printer.makeRuntimeType(RuntimeType.UNDEFINED), true, false))
        printer.runtimeType(this, valueType, value)
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [castToInt8(valueType, printer.language)])
        printer.makeCondition(
            printer.makeRuntimeTypeCondition(valueType, false, RuntimeType.UNDEFINED, value),
            printer.makeAssign(`${value}_value`, undefined, printer.makeValueFromOption(value, this.typeConvertor), true),
            undefined,
            () => { this.typeConvertor.convertorSerialize(param, printer.getObjectAccessor(this.typeConvertor, `${value}_value`), printer) }
        ).write(printer)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const runtimeType = `runtimeType`
        const accessor = printer.getObjectAccessor(this, value)
        const thenStatement = new BlockStatement([
            this.typeConvertor.convertorDeserialize(param, accessor, printer)
        ])
        return new BlockStatement([
            printer.makeAssign(runtimeType, undefined,
                printer.makeCast(printer.makeString(`${param}Deserializer.readInt8()`), printer.getRuntimeType()), true),
            printer.makeSetOptionTag(value, printer.makeCast(printer.makeString(runtimeType), printer.getTagType())),
            printer.makeCondition(printer.makeRuntimeTypeDefinedCheck(runtimeType), thenStatement)
        ], true)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${PrimitiveType.Tag.getText()} tag; ${this.table.getTypeName(this.type, false)} value; }`
            : this.table.getTypeName(this.type, true)
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.NativePointer.getText() : "KNativePointer"
    }
    isPointerType(): boolean {
        return true
    }
}

export class AggregateConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private members: [string, boolean][] = []
    public readonly aliasName: string | undefined

    constructor(param: string,
                private table: DeclarationTable,
                private type: ts.TypeLiteralNode,
                typeNodeNameConvertor?: TypeNodeNameConvertor) {
        super(typeNodeNameConvertor?.convert(type) ?? mapType(type), [RuntimeType.OBJECT], false, true, param)
        this.aliasName = ts.isTypeAliasDeclaration(this.type.parent) ? identName(this.type.parent.name) : undefined
        this.memberConvertors = type
            .members
            .filter(ts.isPropertySignature)
            .map((member, index) => {
                let memberName = identName(member.name)!
                if (table.language === Language.ARKTS ) {
                    // 'template' is a keyword for C++
                    memberName = memberName.replace("template", "template_")
                }
                this.members[index] = [memberName, member.questionToken != undefined]
                return table.typeConvertor(param, member.type!, member.questionToken != undefined, typeNodeNameConvertor)
            })
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for aggregates")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index][0]
            printer.writeStatement(
                printer.makeAssign(`${value}_${memberName}`, undefined,
                    printer.makeString(`${value}.${memberName}`), true))
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const structAccessor = printer.getObjectAccessor(this, value)
        let struct = this.table.targetStruct(this.table.toTarget(this.type))
        // Typed structs may refer each other, so use indent level to discriminate.
        // Somewhat ugly, but works.
        const typedStruct = `typedStruct${printer.indentDepth()}`
        printer.pushIndent()
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
        printer.popIndent()
        return new BlockStatement(statements, true)
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
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.members.map(it => it[0])
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const uniqueFields = this.members.filter(it => !duplicates.has(it[0]))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it[0], it => it[1])
    }
}

export class InterfaceConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        param: string,
        private declaration: ts.InterfaceDeclaration | ts.ClassDeclaration,
        protected table: DeclarationTable) {
        super(name, [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, this.table.serializerName(this.tsTypeName), [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeMethodCall(`${param}Deserializer`, this.table.deserializerName(this.tsTypeName), []), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.ArkPrefix + this.tsTypeName
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.table.targetStruct(this.declaration).getFields().map(it => it.name)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // First, tricky special cases
        if (this.tsTypeName.endsWith("GestureInterface")) {
            const gestureType = this.tsTypeName.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), new Type("GestureComponent<Object>"))
            return writer.makeNaryOp(writer.language == Language.ARKTS ? "==" : "===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        if (this.tsTypeName === "CancelButtonSymbolOptions") {
            return writer.makeNaryOp("&&", [
                writer.makeString(`${value}.hasOwnProperty("icon")`),
                writer.makeString(`isInstanceOf("SymbolGlyphModifier", ${value}.icon)`)])
        }
        // Try to figure out interface by examining field sets
        const uniqueFields = this.table
            .targetStruct(this.declaration)
            .getFields()
            .filter(it => !duplicates.has(it.name))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.optional)
    }
}

export class ClassConvertor extends InterfaceConvertor {
    constructor(name: string, param: string, declaration: ts.ClassDeclaration, table: DeclarationTable) {
        super(name, param, declaration, table)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // SubTabBarStyle causes inscrutable "SubTabBarStyle is not defined" error
        if (this.tsTypeName === "SubTabBarStyle") return undefined
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.tsTypeName}`)])
    }
}

export class FunctionConvertor extends BaseArgConvertor {
    constructor(
        param: string,
        protected table: DeclarationTable,
        protected type: ts.TypeNode) {
        // TODO: pass functions as integers to native side.
        super("Function", [RuntimeType.FUNCTION], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `makeArkFunctionFromId(${param})` : `registerCallback(${param})`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, "writeFunction", [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const accessor = writer.getObjectAccessor(this, value)
        return writer.makeAssign(accessor, undefined,
            writer.makeCast(writer.makeString(`${param}Deserializer.readFunction()`),
                writer.makeType(mapType(this.type), true, accessor))
            , false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Function.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
}

abstract class CallbackConvertor extends FunctionConvertor {

    constructor(
        param: string,
        table: DeclarationTable,
        type: ts.TypeNode,
        protected args: ArgConvertor[] = [],
        protected ret?: ArgConvertor) {
        super(param, table, type)
    }
    convertorArg(param: string, writer: LanguageWriter): string {

        if (writer.language == Language.CPP) return super.convertorArg(param, writer)

        this.wrapCallback(param, param, writer)
        return `${param}_callbackId`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {

        if (writer.language == Language.CPP) {
            super.convertorSerialize(param, value, writer)
            return
        }

        this.wrapCallback(param, value, writer)
        writer.writeMethodCall(`${param}Serializer`, "writeInt32", [`${value}_callbackId`])
    }
    wrapCallback(param: string, value: string, writer: LanguageWriter): void {

        const callbackName = `${value}_callback`
        const argList: string[] = []

        writer.writeStatement(
            writer.makeAssign(`${callbackName}`, undefined,
                writer.makeLambda(new NamedMethodSignature(Type.Void,
                        [new Type(writer.mapType(new Type("Uint8Array"))), new Type(writer.mapType(new Type("int32")))],
                        ["args", "length"]),
                    [
                        this.args.length > 0
                            ? writer.makeAssign("callbackDeserializer", new Type("Deserializer"),
                                writer.makeMethodCall("Deserializer", "get",
                                    [writer.makeString("createDeserializer"), writer.makeString("args"), writer.makeString("length")]),
                                true, true)
                            : [],
                        // deserialize arguments
                        ...this.args.map(it => {
                            const argName = `${it.param}Arg`
                            const isUndefined = it.runtimeTypes.includes(RuntimeType.UNDEFINED)
                            argList.push(`${argName}${isUndefined ? "" : "!"}`)
                            return [
                                writer.makeAssign(argName, new Type(it.tsTypeName), undefined, true, false),
                                it.convertorDeserialize("callback", argName, writer)
                            ]

                        }),
                        // call lambda with deserialized arguments
                        writer.makeStatement(
                            writer.makeFunctionCall(value, argList.map(it => writer.makeString(it)))),
                        // TBD: return value from the callback
                        writer.makeReturn(
                            writer.makeString("0"))

                    ].flat()

                ),
                true, true
            )
        )
        writer.writeStatement(
            writer.makeAssign(`${callbackName}Id`, Type.Int32,
                writer.makeFunctionCall("wrapCallback", [writer.makeString(`${callbackName}`)]),
                true, true
            )
        )
    }
}

export class CallbackFunctionConvertor extends CallbackConvertor {

    constructor(
        param: string,
        table: DeclarationTable,
        type: ts.FunctionTypeNode) {
        super(
            param,
            table,
            type,
            type.parameters.map(it => table.typeConvertor(identName(it.name)!, it.type!)),
            table.typeConvertor("", type.type))
        this.tsTypeName = `(${this.args.map((it, i) => `arg_${i}: ${it.tsTypeName}`).join(", ")}) => ${this.ret!.tsTypeName}`
    }
}

export class CallbackTypeReferenceConvertor extends CallbackConvertor {

    // interface Callback<T, V = void> { (data: T): V; }
    constructor(
        param: string,
        table: DeclarationTable,
        type: ts.TypeReferenceNode) {
        super(
            param,
            table,
            type,
            [table.typeConvertor("data", type.typeArguments![0])],
            type.typeArguments!.length > 1 ? table.typeConvertor("", type.typeArguments![1]) : undefined
        )
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
            castToInt8(printer.makeRuntimeTypeGetterCall(value).asString(), printer.language)
        ])
        this.memberConvertors.forEach((it, index) => {
            printer.writeStatement(
                printer.makeAssign(`${value}_${index}`, undefined, printer.makeTupleAccess(value, index), true))
            it.convertorSerialize(param, `${value}_${index}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const runtimeType = `runtimeType`
        const receiver = printer.getObjectAccessor(this, value)
        const statements: LanguageStatement[] = []
        const tmpTupleIds: string[] = []
        this.memberConvertors.forEach((it, index) => {
            const tmpTupleId = `tmpTupleItem${index}`
            tmpTupleIds.push(tmpTupleId)
            const receiver = printer.getObjectAccessor(this, value, {index: `${index}`})
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
        ], true)
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
    isPointerType(): boolean {
        return true
    }
}

export class ArrayConvertor extends BaseArgConvertor {
    elementConvertor: ArgConvertor
    readonly isArrayType = ts.isArrayTypeNode(this.type) // Array type - Type[], otherwise - Array<Type>
    constructor(param: string,
                public table: DeclarationTable,
                private type: ts.TypeNode,
                private elementType: ts.TypeNode,
                private typeNodeNameConvertor: TypeNodeNameConvertor | undefined) {
        super(`Array<${typeNodeNameConvertor?.convert(elementType) ?? mapType(elementType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = table.typeConvertor(param, elementType)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            castToInt8(printer.makeRuntimeTypeGetterCall(value).asString(), printer.language)])
        const valueLength = printer.makeArrayLength(value).asString()
        const loopCounter = "i"
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [castToInt32(valueLength, printer.language)])
        printer.writeStatement(printer.makeLoop(loopCounter, valueLength))
        printer.pushIndent()
        printer.writeStatement(
            printer.makeAssign(`${value}_element`, undefined, printer.makeArrayAccess(value, loopCounter), true))
        this.elementConvertor.convertorSerialize(param, printer.getObjectAccessor(this.elementConvertor, `${value}_element`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        // Array length.
        const runtimeType = `runtimeType`
        const arrayLength = `arrayLength`
        const forCounterName = `i`
        const arrayAccessor = printer.getObjectAccessor(this, value)
        const accessor = printer.getObjectAccessor(this, arrayAccessor, {index: `[${forCounterName}]`})
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
        return new BlockStatement(statements, true)
    }
    nativeType(impl: boolean): string {
        return `Array_${this.table.computeTypeName(undefined, this.elementType, false, "")}`
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.targetType(writer).name}`)])
    }
    elementTypeName(): string {
        return this.typeNodeNameConvertor?.convert(this.elementType) ?? mapType(this.elementType)
    }
}

export class MapConvertor extends BaseArgConvertor {
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(param: string, public table: DeclarationTable, type: ts.TypeNode, public keyType: ts.TypeNode, public valueType: ts.TypeNode) {
        super(`Map<${mapType(keyType)}, ${mapType(valueType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.keyConvertor = table.typeConvertor(param, keyType)
        this.valueConvertor = table.typeConvertor(param, valueType)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Map size.
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            castToInt8(printer.makeRuntimeTypeGetterCall(value).asString(), printer.language)])
        const mapSize = printer.makeMapSize(value)
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [mapSize.asString()])
        printer.writeStatement(printer.makeMapForEach(value, `${value}_key`, `${value}_value`, () => {
            this.keyConvertor.convertorSerialize(param, `${value}_key`, printer)
            this.valueConvertor.convertorSerialize(param, `${value}_value`, printer)
        }))
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        // Map size.
        const runtimeType = `runtimeType`
        const mapSize = `mapSize`
        const keyTypeName = printer.makeMapKeyTypeName(this)
        const valueTypeName = printer.makeMapValueTypeName(this)
        const counterVar = `i`
        const keyAccessor = printer.getObjectAccessor(this, value, {index: counterVar, field: "keys"})
        const valueAccessor = printer.getObjectAccessor(this, value, {index: counterVar, field: "values"})
        const tmpKey = `tmpKey`
        const tmpValue = `tmpValue`
        const statements = [
            printer.makeAssign(runtimeType, undefined,
                printer.makeCast(printer.makeString(`${param}Deserializer.readInt8()`), printer.getRuntimeType()), true),
            printer.makeCondition(printer.makeRuntimeTypeDefinedCheck(runtimeType), new BlockStatement([
                printer.makeAssign(mapSize, undefined, printer.makeString(`${param}Deserializer.readInt32()`), true),
                printer.makeMapResize(keyTypeName, valueTypeName, value, mapSize, `${param}Deserializer`),
                printer.makeLoop(counterVar, mapSize, new BlockStatement([
                    printer.makeAssign(tmpKey, new Type(keyTypeName), undefined, true, false),
                    this.keyConvertor.convertorDeserialize(param, tmpKey, printer),
                    printer.makeAssign(tmpValue, new Type(valueTypeName), undefined, true, false),
                    this.valueConvertor.convertorDeserialize(param, tmpValue, printer),
                    printer.makeMapInsert(keyAccessor, tmpKey, valueAccessor, tmpValue),
                ], false)),
            ])),
        ]
        return new BlockStatement(statements, true)
    }

    nativeType(impl: boolean): string {
        const keyTypeName = this.table.computeTypeName(undefined, this.keyType, false, "")
        const valueTypeName = this.table.computeTypeName(undefined, this.valueType, false, "")
        return `Map_${keyTypeName}_${valueTypeName}`
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof Map`)])
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
        const receiver = writer.getObjectAccessor(this, value)
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
    isPointerType(): boolean {
        return true
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        param: string,
        protected table: DeclarationTable,
        private type: ts.InterfaceDeclaration | ts.ClassDeclaration,
    ) {
        super(name, [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeMaterialized", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
        const prefix = printer.language === Language.CPP ? PrimitiveType.ArkPrefix : ""
        const readStatement = printer.makeCast(
            printer.makeMethodCall(`${param}Deserializer`, `readMaterialized`, []),
            new Type(this.table.computeTargetName(this.type, false, prefix)!),
        )
        return printer.makeAssign(accessor, undefined, readStatement, false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Materialized.getText()
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.tsTypeName}`)])
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
        const accessor = writer.getObjectAccessor(this, value)
        return writer.makeAssign(accessor, undefined, writer.makeString(`${param}Deserializer.read${this.convertorName}()`), false)
    }
    nativeType(impl: boolean): string {
        return this.cType
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() + "*" :  "Int32ArrayPtr"
    }
    isPointerType(): boolean {
        return true
    }
}

class ProxyConvertor extends BaseArgConvertor {
    constructor(protected convertor: ArgConvertor, suggestedName?: string) {
        super(suggestedName ?? convertor.tsTypeName, convertor.runtimeTypes, convertor.isScoped, convertor.useArray, convertor.param)
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
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.convertor.unionDiscriminator(value, index, writer, duplicates)
    }
    getMembers(): string[] {
        return this.convertor.getMembers()
    }
}

export class TypeAliasConvertor extends ProxyConvertor {
    constructor(
        param: string,
        private table: DeclarationTable,
        declaration: ts.TypeAliasDeclaration,
        typeNodeNameConvertor: TypeNodeNameConvertor | undefined
    ) {
        super(table.typeConvertor(param, declaration.type, false, typeNodeNameConvertor), identName(declaration.name))
    }
}

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}
