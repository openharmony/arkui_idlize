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
import { Language } from "../../util"
import { RuntimeType } from "./IdlPeerGeneratorVisitor"
import { BlockStatement, BranchStatement, LanguageExpression, LanguageStatement, LanguageWriter, NamedMethodSignature, Type } from "../LanguageWriters"
import { cleanPrefix, IdlPeerLibrary } from "./IdlPeerLibrary"
import { PrimitiveType } from "../DeclarationTable"
import { qualifiedName } from "./common"
import { ArgConvertor, BaseArgConvertor, UndefinedConvertor } from "../ArgConvertors"


export class StringConvertor extends BaseArgConvertor {
    private literalValue?: string
    constructor(param: string) {
        super("string", [RuntimeType.STRING], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const receiver = this.getObjectAccessor(writer.language, value)
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

export class EnumConvertor extends BaseArgConvertor {
    constructor(param: string,
                private enumType: idl.IDLEnum,
                public readonly isStringEnum: boolean) {
        super(isStringEnum ?  "string" : "number",
            [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    private enumTypeName(language: Language): string {
        const prefix = language === Language.CPP ? PrimitiveType.Prefix : ""
        return prefix + qualifiedName(this.enumType, language)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.castToEnum(param, this.enumTypeName(writer.language))
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        if (this.isStringEnum) {
            value = printer.ordinalFromEnum(printer.makeString(value), this.enumType.name).asString()
        }
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const name = this.enumTypeName(printer.language)
        const readExpr = printer.makeMethodCall(`${param}Deserializer`, "readInt32", [])
        const enumExpr = this.isStringEnum && printer.language !== Language.CPP
            ? printer.enumFromOrdinal(readExpr, name)
            : printer.makeCast(readExpr, new Type(name))
        return printer.makeAssign(this.getObjectAccessor(printer.language, value), undefined, enumExpr, false)
    }
    nativeType(impl: boolean): string {
        return this.enumTypeName(Language.CPP)
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
            ? writer.ordinalFromEnum(writer.makeString(this.getObjectAccessor(writer.language, value)), this.enumType.name)
            : writer.makeUnionVariantCast(this.getObjectAccessor(writer.language, value), Type.Number, this, index)
        return writer.discriminatorFromExpressions(value, this.runtimeTypes[0], writer, [
            writer.makeNaryOp(">=", [ordinal, writer.makeString(low!.toString())]),
            writer.makeNaryOp("<=",  [ordinal, writer.makeString(high!.toString())])
        ])
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
            writer.makeNaryOp("==", [writer.makeUnionVariantCondition(convertor, value, `${value}_type`, RuntimeType[it], index)])))
    }
    reportConflicts(context: string | undefined) {
        if (this.discriminators.filter(([discriminator, _, __]) => discriminator === undefined).length > 1) {
            console.log(`FATAL: runtime type conflict in ${context ?? "<unknown context>"}`)
            this.discriminators.forEach(([discr, conv, n]) =>
                console.log(`   ${n} : ${conv.constructor.name} : ${discr ? discr.asString() : "<undefined>"}`))
            throw new Error()
        }
    }
}

export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(private library: IdlPeerLibrary, param: string, private type: idl.IDLUnionType) {
        super(`object`, [], false, true, param)
        this.memberConvertors = type.types.map(member => library.typeConvertor(param, member))
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
            printer.writeMethodCall(`${param}Serializer`, "writeInt8", [printer.castToInt(index.toString(), 8)])
            if (!(it instanceof UndefinedConvertor)) {
                printer.writeStatement(
                        printer.makeAssign(`${value}_${index}`, undefined,
                            printer.makeUnionVariantCast(it.getObjectAccessor(printer.language, value), it.targetType(printer), it, index), true))
                it.convertorSerialize(param, `${value}_${index}`, printer)
            }
            printer.popIndent()
            printer.print(`}`)
        })
        this.unionChecker.reportConflicts(this.library.getCurrentContext())
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        let selector = `selector`
        const selectorAssign = printer.makeAssign(selector, Type.Int32,
            printer.makeString(`${param}Deserializer.readInt8()`), true)
        const branches: BranchStatement[] = this.memberConvertors.map((it, index) => {
            const receiver = this.getObjectAccessor(printer.language, value, {index: `${index}`})
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
            : this.library.getTypeName(this.type)
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
        const accessor = this.getObjectAccessor(printer.language, value)
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
            ? writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
                [writer.makeString(`${handler[0]}(${handler.slice(1).concat(value).join(", ")})`)])
            : undefined
    }
}

export class OptionConvertor extends BaseArgConvertor {
    private typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(private library: IdlPeerLibrary, param: string, public type: idl.IDLType) {
        let conv = library.typeConvertor(param, type)
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
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [printer.castToInt(valueType, 8)])
        printer.print(`if (${printer.makeRuntimeTypeCondition(valueType, false, RuntimeType.UNDEFINED).asString()}) {`)
        printer.pushIndent()
        printer.writeStatement(printer.makeAssign(`${value}_value`, undefined, printer.makeValueFromOption(value, this.typeConvertor), true))
        this.typeConvertor.convertorSerialize(param, this.typeConvertor.getObjectAccessor(printer.language, `${value}_value`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const runtimeType = `runtimeType`
        const accessor = this.getObjectAccessor(printer.language, value)
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
            ? `struct { ${PrimitiveType.Tag.getText()} tag; ${this.library.getTypeName(this.type, false)} value; }`
            : this.library.getTypeName(this.type, true)
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

export class AggregateConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private members: [string, boolean][] = []
    public readonly aliasName: string | undefined

    constructor(private library: IdlPeerLibrary, param: string, type: idl.IDLType, private decl: idl.IDLInterface) {
        super(library.mapType(type), [RuntimeType.OBJECT], false, true, param)
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
            printer.writeStatement(
                printer.makeAssign(`${value}_${memberName}`, undefined,
                    printer.makeString(`${value}.${memberName}`), true))
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = this.getObjectAccessor(printer.language, value)
        // Typed structs may refer each other, so use indent level to discriminate.
        // Somewhat ugly, but works.
        const typedStruct = `typedStruct${printer.indentDepth()}`
        const typedStructType = new Type(printer.makeRef(printer.makeType(this.tsTypeName, false, accessor).name))
        printer.pushIndent()
        const statements = [
            printer.makeAssign(typedStruct, typedStructType, printer.makeString(accessor),true, false),
            ...this.memberConvertors.map((it, index) =>
                // TODO: maybe use accessor?
                it.convertorDeserialize(param, `${typedStruct}.${cppEscape(this.members[index][0])}`, printer))]
        if (printer.language !== Language.CPP) { /// refac into LW.getObjectAccessor()
            const accessorInitExpr = this.members.length > 0
                ? printer.makeCast(printer.makeString("{}"), typedStructType)
                : printer.makeString(`{}`)
            statements.unshift(printer.makeAssign(accessor, undefined, accessorInitExpr, false))
        }
        printer.popIndent()
        return new BlockStatement(statements, true)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${this.memberConvertors.map((it, index) => `${it.nativeType(true)} value${index};`).join(" ")} } `
            : this.library.computeTargetName(this.decl, false)
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
    constructor(name: string, param: string, private declaration?: idl.IDLInterface) {
        super(name, [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.tsTypeName}`, [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = this.getObjectAccessor(printer.language, value)
        return printer.makeAssign(accessor, undefined,
                printer.makeMethodCall(`${param}Deserializer`, `read${this.tsTypeName}`, []), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Prefix + this.tsTypeName
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
        if (this.tsTypeName.endsWith("GestureInterface")) {
            const gestureType = this.tsTypeName.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), new Type("GestureComponent<Object>"))
            return writer.makeNaryOp("===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        if (this.tsTypeName === "CancelButtonSymbolOptions") {
            return writer.makeNaryOp("&&", [
                writer.makeString(`${value}.hasOwnProperty("icon")`),
                writer.makeString(`isInstanceOf("SymbolGlyphModifier", ${value}.icon)`)])
        }
        // Try to figure out interface by examining field sets
        const uniqueFields = this.declaration?.properties.filter(it => !duplicates.has(it.name))
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
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.tsTypeName}`)])
    }
}

export class FunctionConvertor extends BaseArgConvertor {
    constructor(private library: IdlPeerLibrary, param: string, protected type: idl.IDLReferenceType) {
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
        const accessor = this.getObjectAccessor(writer.language, value)
        return writer.makeAssign(accessor, undefined,
            writer.makeCast(
                writer.makeString(`${param}Deserializer.readFunction()`),
                writer.makeType(this.library.mapType(this.type), true, accessor)),
            false)
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
        type: idl.IDLReferenceType,
        protected args: ArgConvertor[] = [],
        protected ret?: ArgConvertor) {
        super(library, param, type)
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
    constructor(library: IdlPeerLibrary, param: string, type: idl.IDLReferenceType) {
        const decl = library.resolveTypeReference(type)
        if (!(decl && idl.isCallback(decl)))
            throw `Expected callback reference, got ${type.name}`
        super(library, param, type,
            decl.parameters.map(it => library.typeConvertor(it.name, it.type!)),
            library.typeConvertor("", decl.returnType!))
        this.tsTypeName = `(${this.args.map((it, i) => `arg_${i}: ${it.tsTypeName}`).join(", ")}) => ${this.ret!.tsTypeName}`
    }
}

export class TupleConvertor extends BaseArgConvertor {
    constructor(private library: IdlPeerLibrary, param: string, private decl: idl.IDLInterface) {
        super(`[${decl.properties.map(it => library.mapType(it.type)).join(",")}]`, [RuntimeType.OBJECT], false, true, param)
        this.memberConvertors = decl.properties.map(it => library.typeConvertor(param, it.type, it.isOptional))
    }
    private memberConvertors: ArgConvertor[]
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            printer.castToInt(printer.makeRuntimeTypeGetterCall(value).asString(), 8)
        ])
        this.memberConvertors.forEach((it, index) => {
            printer.writeStatement(
                printer.makeAssign(`${value}_${index}`, undefined, printer.makeTupleAccess(value, index), true))
            it.convertorSerialize(param, `${value}_${index}`, printer)
        })
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const runtimeType = `runtimeType`
        const receiver = this.getObjectAccessor(printer.language, value)
        const statements: LanguageStatement[] = []
        const tmpTupleIds: string[] = []
        this.memberConvertors.forEach((it, index) => {
            const tmpTupleId = `tmpTupleItem${index}`
            tmpTupleIds.push(tmpTupleId)
            const receiver = this.getObjectAccessor(printer.language, value, {index: `${index}`})
            // need to remove the mark '?' from Optional type
            const tsTypeName = this.library.mapType(this.decl.properties[index].type).replace("?", "")
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
            : this.library.computeTargetName(this.decl, false)
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

export class ArrayConvertor extends BaseArgConvertor {
    elementConvertor: ArgConvertor
    constructor(private library: IdlPeerLibrary, param: string, private type: idl.IDLType, private elementType: idl.IDLType) {
        super(`Array<${library.mapType(elementType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = library.typeConvertor(param, elementType)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            printer.castToInt(printer.makeRuntimeTypeGetterCall(value).asString(), 8)])
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
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        // Array length.
        const runtimeType = `runtimeType`
        const arrayLength = `arrayLength`
        const forCounterName = `i`
        const arrayAccessor = this.getObjectAccessor(printer.language, value)
        const accessor = this.getObjectAccessor(printer.language, arrayAccessor, {index: `[${forCounterName}]`})
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
        const typeName = cleanPrefix(this.library.getTypeName(this.elementType, false), PrimitiveType.Prefix)
        return `Array_${typeName}`
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.targetType(writer).name}`)])
    }
    elementTypeName(): string {
        return this.library.mapType(this.elementType)
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        const array = language === Language.CPP ? ".array" : ""
        return args?.index ? `${value}${array}${args.index}` : value
    }
}

export class MapConvertor extends BaseArgConvertor {
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(private library: IdlPeerLibrary, param: string, type: idl.IDLType, public keyType: idl.IDLType, public valueType: idl.IDLType) {
        super(`Map<${library.mapType(keyType)}, ${library.mapType(valueType)}>`, [RuntimeType.OBJECT], false, true, param)
        this.keyConvertor = library.typeConvertor(param, keyType)
        this.valueConvertor = library.typeConvertor(param, valueType)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Map size.
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [
            printer.castToInt(printer.makeRuntimeTypeGetterCall(value).asString(), 8)])
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
        const keyTypeName = this.makeTypeName(this.keyType, printer.language)
        const valueTypeName = this.makeTypeName(this.valueType, printer.language)
        const counterVar = `i`
        const keyAccessor = this.getObjectAccessor(printer.language, value, {index: counterVar, field: "keys"})
        const valueAccessor = this.getObjectAccessor(printer.language, value, {index: counterVar, field: "values"})
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
        const keyTypeName = cleanPrefix(this.library.getTypeName(this.keyType, false), PrimitiveType.Prefix)
        const valueTypeName = cleanPrefix(this.library.getTypeName(this.valueType, false), PrimitiveType.Prefix)
        return `Map_${keyTypeName}_${valueTypeName}`
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof Map`)])
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index && args?.field
            ? `${value}.${args.field}[${args.index}]`
            : value
    }
    private makeTypeName(type: idl.IDLType, language: Language): string {///refac into LW
        switch (language) {
            case Language.TS: return this.library.mapType(this.keyType)
            case Language.CPP: return this.library.getTypeName(this.keyType)
            default: throw `Unsupported language ${language}`
        }
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
        const accessor = this.getObjectAccessor(printer.language, value)
        const prefix = printer.language === Language.CPP ? PrimitiveType.Prefix : ""
        const readStatement = printer.makeCast(
            printer.makeMethodCall(`${param}Deserializer`, `readMaterialized`, []),
            new Type(`${prefix}${this.type.name}`),
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
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer,
            [writer.makeString(`${value} instanceof ${this.tsTypeName}`)])
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
        super(library.typeConvertor(param, typedef.type), typedef.name)
    }
}

export function cppEscape(name: string) {
    return name === "template" ? "template_" : name
}
