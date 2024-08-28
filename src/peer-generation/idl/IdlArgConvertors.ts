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
import * as idl from "../../idl"
import { isDefined, Language, throwException, typeName } from "../../util"
import { RuntimeType, isBuilderClass, isConflictedDeclaration } from "./IdlPeerGeneratorVisitor"
import { BlockStatement, BranchStatement, ExpressionStatement, LanguageExpression, LanguageStatement, LanguageWriter, NamedMethodSignature, Type } from "../LanguageWriters"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig"
import { IdlPeerLibrary } from "./IdlPeerLibrary"
import { PrimitiveType } from "../DeclarationTable"

function castToInt8(value: string, lang: Language): string {///mv to LW
    switch (lang) {
        case Language.ARKTS: return `${value} as int32` // FIXME: is there int8 in ARKTS?
        default: return value
    }
}

function castToInt32(value: string, lang: Language): string {
    switch (lang) {
        case Language.ARKTS: return `${value} as int32`
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
    private literalValue?: string
    constructor(param: string) {
        super("string", [RuntimeType.STRING], false, false, param)
        // if (ts.isLiteralTypeNode(receiverType) && ts.isStringLiteral(receiverType.literal)) {
        //     this.literalValue = receiverType.literal.text
        // }
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : param
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
        return this.literalValue
            ? writer.makeString(`${value} === "${this.literalValue}"`)
            : undefined
    }
    targetType(writer: LanguageWriter): Type {
        if (this.literalValue) {
            return new Type("string")
        }
        return super.targetType(writer);
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
            case Language.CJ: return `if (${param} { 1 } else { 0 })`
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
                private enumType: idl.IDLEnum,
                public readonly isStringEnum: boolean) {
        super(isStringEnum ?  "string" : "number",
            [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    enumTypeName(): string {
        return this.enumType.name
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.JAVA ? `${param}.getIntValue()` : writer.makeUnsafeCast(this, param)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        if (this.isStringEnum) {
            value = printer.ordinalFromEnum(printer.makeString(value), this.enumType.name).asString()
        }
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        let readExpr = printer.makeMethodCall(`${param}Deserializer`, "readInt32", [])
        if (this.isStringEnum) {
            readExpr = printer.enumFromOrdinal(readExpr, this.enumType.name)
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
        let low: number|undefined = undefined
        let high: number|undefined = undefined
        // TODO: proper enum value computation for cases where enum members have computed initializers.
        this.enumType.elements.forEach((member, index) => {
            let value = index
            if (member.initializer) {
                let tsValue = member.initializer
                // if (ts.isLiteralExpression(tsValue) && !this.isStringEnum) {
                //     value = parseInt(tsValue.text)
                // }
            }
            if (low === undefined || low > value) low = value
            if (high === undefined || high < value) high = value
        })
        const ordinal = this.isStringEnum
            ? writer.ordinalFromEnum(writer.makeString(writer.getObjectAccessor(this, value)), this.enumType.name)
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
            writer.makeNaryOp("==", [writer.makeUnionVariantCondition(`${value}_type`, RuntimeType[it], index)])))
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

    constructor(library: IdlPeerLibrary, param: string, private type: idl.IDLUnionType) {
        super(`object`, [], false, true, param)
        this.memberConvertors = type
            .types
            .map(member => typeConvertor(library, param, member))
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
        this.unionChecker.reportConflicts(/*this.table.getCurrentContext() ??*/ "<unknown context>")
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
            : this.type.name
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
        ["PixelMap", ["isPixelMap"]],
        ["Resource", ["isResource"]]])
    private importedName: string
    constructor(param: string, type: idl.IDLReferenceType) {
        super("Object", [RuntimeType.OBJECT], false, true, param)
        this.importedName = type.name
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
        const receiver = printer.getObjectAccessor(this, value)
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
    isPointerType(): boolean {
        return true
    }
    override getMembers(): string[] {
        return CustomTypeConvertor.knownTypes.get(this.customName)?.map(it => it[0]) ?? super.getMembers()
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const uniqueFields = CustomTypeConvertor.knownTypes.get(this.customName)?.filter(it => !duplicates.has(it[0]))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it[0], it => it[1])
    }
}

export class OptionConvertor extends BaseArgConvertor {
    private typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(library: IdlPeerLibrary, param: string, public type: idl.IDLType) {
        let conv = typeConvertor(library, param, type)
        let runtimeTypes = conv.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(`${conv.tsTypeName}|undefined`, runtimeTypes, conv.isScoped, true, param)
        this.typeConvertor = conv
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
        printer.print(`if (${printer.makeRuntimeTypeCondition(valueType, false, RuntimeType.UNDEFINED).asString()}) {`)
        printer.pushIndent()
        printer.writeStatement(printer.makeAssign(`${value}_value`, undefined, printer.makeValueFromOption(value, this.typeConvertor), true))
        this.typeConvertor.convertorSerialize(param, printer.getObjectAccessor(this.typeConvertor, `${value}_value`), printer)
        printer.popIndent()
        printer.print(`}`)
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
            ? `struct { ${PrimitiveType.Tag.getText()} tag; ${this.type.name} value; }`
            : `Opt_${this.type.name}`
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

    constructor(library: IdlPeerLibrary, param: string, type: idl.IDLType, private decl: idl.IDLInterface) {
        super(library.mapType(type), [RuntimeType.OBJECT], false, true, param)
        // this.aliasName = ts.isTypeAliasDeclaration(this.type.parent) ? identName(this.type.parent.name) : undefined
        this.memberConvertors = decl
            .properties
            // .filter(ts.isPropertySignature)
            .map((member, index) => {
                this.members[index] = [member.name, member.isOptional]
                return typeConvertor(library, param, member.type!, member.isOptional)
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
        // const structAccessor = printer.getObjectAccessor(this, value)
        // let struct = this.table.targetStruct(this.table.toTarget(this.type))
        // // Typed structs may refer each other, so use indent level to discriminate.
        // // Somewhat ugly, but works.
        // const typedStruct = `typedStruct${printer.indentDepth()}`
        // printer.pushIndent()
        // const statements = [
        //     printer.makeObjectAlloc(structAccessor, struct.getFields()),
        //     printer.makeAssign(typedStruct, new Type(printer.makeRef(printer.makeType(this.tsTypeName, false, structAccessor).name)),
        //         printer.makeString(structAccessor),true, false
        //     )
        // ]
        // this.memberConvertors.forEach((it, index) => {
        //     // TODO: maybe use accessor?
        //     statements.push(
        //         it.convertorDeserialize(param, `${typedStruct}.${struct.getFields()[index].name}`, printer)
        //     )
        // })
        // printer.popIndent()
        // return new BlockStatement(statements, true)
        return new ExpressionStatement(printer.makeString("///agg::convertorDeserialize"))
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${this.memberConvertors.map((it, index) => `${it.nativeType(true)} value${index};`).join(" ")} } `
            : this.decl.name
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
    constructor(name: string, param: string, private declaration: idl.IDLInterface) {
        super(name, [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.tsTypeName}`, [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = printer.getObjectAccessor(this, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeMethodCall(`${param}Deserializer`, `read${this.tsTypeName}`, []), false)
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
        return this.declaration.properties.map(it => it.name)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        if (this.tsTypeName.endsWith("GestureInterface")) {
            const gestureType = this.tsTypeName.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), new Type("GestureComponent<Object>"))
            return writer.makeNaryOp("===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        const uniqueFields = this.declaration.properties.filter(it => !duplicates.has(it.name))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional)
    }
}

export class ClassConvertor extends InterfaceConvertor {
    constructor(name: string, param: string, declaration: idl.IDLInterface) {
        super(name, param, declaration)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // SubTabBarStyle causes inscrutable "SubTabBarStyle is not defined" error
        if (this.tsTypeName === "SubTabBarStyle") return undefined
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.tsTypeName}`)])
    }
}

export class FunctionConvertor extends BaseArgConvertor {
    constructor(private library: IdlPeerLibrary, param: string, protected type: idl.IDLType) {
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
                writer.makeType(this.library.mapType(this.type), true, accessor))
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
        library: IdlPeerLibrary,
        param: string,
        type: idl.IDLFunction,
        protected args: ArgConvertor[] = [],
        protected ret?: ArgConvertor) {
        super(library, param, type.returnType!)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        if (writer.language == Language.CPP)
            return super.convertorArg(param, writer)
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
                writer.makeLambda(
                    new NamedMethodSignature(Type.Void, [new Type("Uint8Array"), new Type("int32")], ["args", "length"]),
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
    constructor(library: IdlPeerLibrary, param: string, type: idl.IDLFunction) {
        super(library, param, type,
            type.parameters.map(it => typeConvertor(library, it.name, it.type!)),
            typeConvertor(library, "", type.returnType!))
        this.tsTypeName = `(${this.args.map((it, i) => `arg_${i}: ${it.tsTypeName}`).join(", ")}) => ${this.ret!.tsTypeName}`
    }
}

// export class CallbackTypeReferenceConvertor extends CallbackConvertor {
//     // interface Callback<T, V = void> { (data: T): V; }
//     constructor(library: IdlPeerLibrary, param: string, type: IDLReferenceType) {
//         super(library, param, type,
//             [typeConvertor(library, "data", type.typeArguments![0])],
//             type.typeArguments!.length > 1 ? typeConvertor(library, "", type.typeArguments![1]) : undefined
//         )
//     }
// }
       
export class TupleConvertor extends BaseArgConvertor {
    constructor(private library: IdlPeerLibrary, param: string, private decl: idl.IDLInterface) {
        super(`[${decl.properties.map(it => library.mapType(it.type)).join(",")}]`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = decl.properties.map(it => typeConvertor(library, param, it.type, it.isOptional))
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
            const tsTypeName = this.library.mapType(this.decl.properties[index]).replace("?", "")
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
            ? `struct { ${this.memberConvertors.map((it, index) => `${it.nativeType(false)} value${index};`).join(" ")} } `
            : this.decl.name
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
    constructor(private library: IdlPeerLibrary, param: string, private type: idl.IDLType, private elementType: idl.IDLType) {
        super(`Array<${library.mapType(elementType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = typeConvertor(library, param, elementType)
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
            printer.makeArrayResize(arrayAccessor, this.library.mapType(this.type), arrayLength, `${param}Deserializer`),
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
        // return `Array_${this.table.computeTypeName(undefined, this.elementType, false, "")}`
        return `Array_${this.library.mapType(this.elementType)}`
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
        return this.library.mapType(this.elementType)
    }
}

export class MapConvertor extends BaseArgConvertor {
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(private library: IdlPeerLibrary, param: string, type: idl.IDLType, public keyType: idl.IDLType, public valueType: idl.IDLType) {
        super(`Map<${library.mapType(keyType)}, ${library.mapType(valueType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.keyConvertor = typeConvertor(library, param, keyType)
        this.valueConvertor = typeConvertor(library, param, valueType)
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
        const keyTypeName = this.keyType.name ///printer.makeMapKeyTypeName(this)
        const valueTypeName = this.valueType.name ///printer.makeMapValueTypeName(this)
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
        const keyTypeName = this.keyType.name ///table.computeTypeName(undefined, this.keyType, false, "")
        const valueTypeName = this.valueType.name ///table.computeTypeName(undefined, this.valueType, false, "")
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
    constructor(private library: IdlPeerLibrary, name: string, param: string, private type: idl.IDLInterface) {
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
            new Type(`${prefix}${this.library.mapType(this.type)}`),
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
    constructor(library: IdlPeerLibrary, param: string, typedef: idl.IDLTypedef) {///, private typeArguments?: ts.NodeArray<ts.TypeNode>) {
        super(typeConvertor(library, param, typedef.type), typedef.name)
    }
}

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}

const PredefinedTypes = new Set([
    "ArrayBuffer", "Object"
])

export function typeConvertor(library: IdlPeerLibrary, param: string, type: idl.IDLType, isOptionalParam = false, maybeCallback: boolean = false): ArgConvertor {
    if (isOptionalParam) {
        return new OptionConvertor(library, param, type)
    }
    if (idl.isPrimitiveType(type)) {
        switch (type.name) {
            case "any": return new CustomTypeConvertor(param, "Any")
            case "null_":
            case "undefined":
            case "void_": return new UndefinedConvertor(param)
            case "number": return new NumberConvertor(param)
            case "DOMString": return new StringConvertor(param)
            case "boolean": return new BooleanConvertor(param)
        }
    }
    if (idl.isReferenceType(type)) {
        if (idl.hasExtAttribute(type, idl.IDLExtendedAttributes.Import)) {
            switch (type.name) {
                case "Callback": return new FunctionConvertor(library, param, type)
                case "Resource": return new InterfaceConvertor("Resource", param, ResourceDeclaration)
            }
            return new ImportTypeConvertor(param, type)
        }
        switch (type.name) {
            case "unknown": return new CustomTypeConvertor(param, "Any")///should unknown be primitive type?
            case "object": return new CustomTypeConvertor(param, "Object")
        }
    }
    if (idl.isReferenceType(type) || idl.isEnumType(type)) {
        if (PredefinedTypes.has(type.name)) {
            return new CustomTypeConvertor(param, type.name, type.name)///predef conv?
        }
        const decl = library.resolveTypeReference(type)
        return declarationConvertor(library, param, type, decl, maybeCallback)
    }
    if (idl.isUnionType(type)) {
        return new UnionConvertor(library, param, type)
    }
    if (idl.isContainerType(type)) {
        if (type.name === "sequence")
            return new ArrayConvertor(library, param, type, type.elementType[0])
        if (type.name === "record")
            return new MapConvertor(library, param, type, type.elementType[0], type.elementType[1])
    }
    if (idl.isTypeParameterType(type)) {
        // TODO: unlikely correct.
        return new CustomTypeConvertor(param, type.name)
    }
    console.log(type)
    throw new Error(`Cannot convert: ${type.name} ${type.kind}`)
}

function declarationConvertor(library: IdlPeerLibrary, param: string, type: idl.IDLType, declaration: idl.IDLEntry | undefined, maybeCallback: boolean): ArgConvertor {
    // const entityName = typeEntityName(type)
    if (!declaration) {
        /*return this.customConvertor(entityName, param, type) ??*/ throwException(`Declaration not found for: ${type.name}`)
    }
    const declarationName = declaration.name!
    if (isConflictedDeclaration(declaration))
        return new CustomTypeConvertor(param, declarationName)
    let customConv = customConvertor(library, type.name, param, type)
    if (customConv) {
        return customConv
    }
    if (isImportDeclaration(declaration)) {
        switch (type.name) {
            case "Callback": return new FunctionConvertor(library, param, type)
            case "Resource": return new InterfaceConvertor("Resource", param, ResourceDeclaration)
        }
        return new ImportTypeConvertor(param, type as idl.IDLReferenceType)
    }
    if (idl.isEnum(declaration)) {
        return new EnumConvertor(param, declaration, isStringEnum(declaration))
    }
    if (idl.isEnumMember(declaration)) {
        return new EnumConvertor(param, declaration.parent, isStringEnum(declaration.parent))
    }
    if (idl.isCallback(declaration)) {
        return maybeCallback
            ? new CallbackFunctionConvertor(library, param, declaration)
            : new FunctionConvertor(library, param, declaration.returnType)
    }
    if (idl.isTypedef(declaration)) {
        return new TypeAliasConvertor(library, param, declaration)///, type.typeArguments)
    }
    if (idl.isInterface(declaration)) {
        if (isMaterialized(declaration)) {
            return new MaterializedClassConvertor(library, declarationName, param, declaration)
        }
        return new InterfaceConvertor(declarationName, param, declaration)
    }
    if (idl.isClass(declaration)) {
        if (isMaterialized(declaration)) {
            return new MaterializedClassConvertor(library, declarationName, param, declaration)
        }
        return new ClassConvertor(declarationName, param, declaration)
    }
    if (declaration.kind === idl.IDLKind.AnonymousInterface) {
        return new AggregateConvertor(library, param, type, declaration as idl.IDLInterface)
    }
    if (declaration.kind === idl.IDLKind.TupleInterface) {
        return new TupleConvertor(library, param, declaration as idl.IDLInterface)
    }
    // if (ts.isTypeParameterDeclaration(declaration)) {
    //     // TODO: incorrect, we must use actual, not formal type parameter.
    //     return new CustomTypeConvertor(param, identName(declaration.name)!)
    // }
    throw new Error(`Unknown decl ${declarationName} of kind ${declaration.kind}`)
}

function customConvertor(library: IdlPeerLibrary, typeName: string, param: string, type: idl.IDLType): ArgConvertor | undefined {
    switch (typeName) {
        case `Dimension`:
        case `Length`:
            return new LengthConvertor(typeName, param)
        case `Date`:
            return new CustomTypeConvertor(param, typeName, typeName)
        case `AttributeModifier`:
            return new PredefinedConvertor(param, "AttributeModifier<any>", "AttributeModifier", "CustomObject")
        case `AnimationRange`:
            return new CustomTypeConvertor(param, "AnimationRange", "AnimationRange<number>")
        case `ContentModifier`:
            return new CustomTypeConvertor(param, "ContentModifier", "ContentModifier<any>")
        case `Record`:
            return new CustomTypeConvertor(param, "Record", "Record<string, string>")
        // case `Array`:
        //     return new ArrayConvertor(param, this, type, type.typeArguments![0])
        // case `Map`:
        //     return new MapConvertor(param, this, type, type.typeArguments![0], type.typeArguments![1])
        case `Callback`:
            return new FunctionConvertor(library, param, type)
        case `Optional`:
            const wrappedType = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!
            return new OptionConvertor(library, param, idl.toIDLType(wrappedType))
    }
    return undefined
}

function isImportDeclaration(decl: idl.IDLEntry): boolean {
    return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)
}

function isStringEnum(decl: idl.IDLEnum): boolean {
    return decl.elements.some(e => e.type.name === "DOMString")
}

export const ResourceDeclaration: idl.IDLInterface = {
    name: "Resource",
    kind: idl.IDLKind.Interface,
    inheritance: [],
    constructors: [],
    constants: [],
    properties: [
        {
            name: "id",
            kind: idl.IDLKind.Property,
            type: idl.createNumberType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "type",
            kind: idl.IDLKind.Property,
            type: idl.createNumberType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "moduleName",
            kind: idl.IDLKind.Property,
            type: idl.createStringType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "bundleName",
            kind: idl.IDLKind.Property,
            type: idl.createStringType(),
            isReadonly: true,
            isStatic: false,
            isOptional: false,
        },
        {
            name: "params",
            kind: idl.IDLKind.Property,
            type: idl.createContainerType("sequence", [idl.createStringType()]),
            isReadonly: true,
            isStatic: false,
            isOptional: true,
        },
    ],
    methods: [],
    callables: [],
}

export function isMaterialized(declaration: idl.IDLInterface): boolean {
    if (PeerGeneratorConfig.isMaterializedIgnored(declaration.name))
        return false;
    if (isBuilderClass(declaration))
        return false

    // TODO: parse Builder classes separatly

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    return declaration.methods.length > 0
}

export function checkTSDeclarationMaterialized(decl: idl.IDLEntry): boolean {
    return (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl))
            && isMaterialized(decl)
}
