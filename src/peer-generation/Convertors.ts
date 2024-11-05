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
import { identName, identNameWithNamespace, importTypeName } from "../util"
import { DeclarationTable } from "./DeclarationTable"
import { PrimitiveType } from "./ArkPrimitiveType"
import * as ts from "typescript"
import { BlockStatement, BranchStatement, generateTypeCheckerName, LanguageExpression, LanguageStatement, LanguageWriter, makeArrayTypeCheckCall, NamedMethodSignature } from "./LanguageWriters"
import { mapType, TypeNodeNameConvertor } from "./TypeNodeNameConvertor"
import { RuntimeType, ArgConvertor, BaseArgConvertor, ProxyConvertor, UndefinedConvertor, UnionRuntimeTypeChecker, ExpressionAssigneer } from "./ArgConvertors"
import { Language } from "../Language"
import { createContainerType, createReferenceType, createUnionType, DebugUtils, getIDLTypeName, IDLI32Type, IDLKind, IDLStringType, IDLType, IDLVoidType, maybeOptional, toIDLType } from "../idl"


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

export class StringConvertor extends BaseArgConvertor {
    private readonly literalValue?: string
    constructor(param: string, receiverType: ts.TypeNode, typeNodeNameConvertor: TypeNodeNameConvertor | undefined) {
        super(toIDLType(typeNodeNameConvertor?.convert(receiverType) ?? mapType(receiverType)), [RuntimeType.STRING], false, false, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
    targetType(writer: LanguageWriter): string {
        if (this.isLiteral()) {
            return writer.convert(IDLStringType)
        }
        return super.targetType(writer);
    }
    isLiteral(): boolean {
        return this.literalValue !== undefined
    }
}

export class ToStringConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(IDLStringType, [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : `(${param}).toString()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [
            writer.language == Language.CPP ? value : `${value}.toString()`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
                public readonly enumType: ts.EnumDeclaration,
                public readonly isStringEnum: boolean,
                language: Language) {
        super(
            // TODO generate enums as classes in TS too
            toIDLType(
                language === Language.ARKTS
                    ? identName(enumType.name)!
                    : isStringEnum ?  "string" : "number"
            ),
            language === Language.ARKTS
                ? [RuntimeType.OBJECT]
                : [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param
        )
    }
    enumTypeName(language: Language): string {
        const prefix = language === Language.CPP ? PrimitiveType.Prefix : ""
        return `${prefix}${identNameWithNamespace(this.enumType, language)}`
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        if (writer.language === Language.CPP) {
            return writer.makeCast(
                writer.makeString(param),
                toIDLType(this.enumTypeName(Language.CPP))
            ).asString()
        }
        return writer.makeCastEnumToInt(this, param)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        if (this.isStringEnum) {
            value = printer.ordinalFromEnum(printer.makeString(value),
                identName(this.enumType.name)!).asString()
        }
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [printer.makeCastEnumToInt(this, value)])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
    }
    nativeType(impl: boolean): string {
        return `enum ${this.enumTypeName(Language.CPP)}`
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
    // TODO: bit clumsy.
    override unionDiscriminator(value: string,
                                index: number,
                                writer: LanguageWriter,
                                duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeDiscriminatorConvertor(this, value, index)
    }
    public extremumOfOrdinals(): {low: number, high: number} {
        let low: number = Number.MAX_VALUE
        let high: number = Number.MIN_VALUE
        this.enumType.members.forEach((member, index) => {
            let value = index
            if (member.initializer) {
                let tsValue = member.initializer
                if (ts.isLiteralExpression(tsValue) && !this.isStringEnum) {
                    value = parseInt(tsValue.text)
                }
            }
            if (low > value) low = value
            if (high < value) high = value
        })
        return {low, high}
    }
}

export class LengthConvertorScoped extends BaseArgConvertor {
    constructor(name: string, param: string, language: Language) {
        super(toIDLType(name),
            [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT],
            false,
            language == Language.ARKTS,
            param)
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
        throw "Not implemented"
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
    constructor(name: string, param: string, language: Language) {
        super(toIDLType(name),
            [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT],
            false,
            language == Language.ARKTS,
            param)
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
        throw "Not implemented"
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

export class UnionConvertor extends BaseArgConvertor {
    private memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(param: string, private table: DeclarationTable, private type: ts.UnionTypeNode, typeNodeNameConvertor?: TypeNodeNameConvertor) {
        super(toIDLType(`object`), [], false, true, param)
        this.memberConvertors = type
            .types
            .map(member => table.typeConvertor(param, member, false, undefined, typeNodeNameConvertor))
        this.unionChecker = new UnionRuntimeTypeChecker(this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        this.idlType = createUnionType(
            this.memberConvertors.map(it => it.idlType)
        )
        // this.tsTypeName = this.memberConvertors.map(it => it.tsTypeName).join(" | ")
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for union")
    }
    private convertorWeight(a: ArgConvertor): number {
        // TODO we have some Union<OtherUnion,OtherType,...> types, and that type emit discriminators like
        // ```
        // if (value_type === RuntimeType.Object) { ... } // discriminating sub-union
        // else if (value_type === RuntimeType.Object && value instanceof OtherType) {} // discriminating other type
        // else ...
        // ```
        // In that case TS type checker reports an error "We already checked `value_type === RuntimeType.Object` condition,
        // it can not be true in the second `if` branch" - and he is true. So that sorting reordering types from
        // `Union|SomeType1|SomeType2` to `SomeType1|SomeType2|Union`, so issue is being solved at least at subset
        // tests. But that still be a hack, should be reworked
        if (a instanceof UnionConvertor)
            return 1
        if (a instanceof ProxyConvertor)
            return this.convertorWeight(a.convertor)
        return 0
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(printer.makeAssign(`${value}_type`, IDLI32Type, printer.makeUnionTypeDefaultInitializer(), true, false))
        printer.writeStatement(printer.makeUnionSelector(value, `${value}_type`))
        const orderedConvertors = Array.from(this.memberConvertors)
            .sort((a, b) => this.convertorWeight(a) - this.convertorWeight(b))
        orderedConvertors.forEach((it, orderedIndex) => {
            const index = this.memberConvertors.indexOf(it)
            const maybeElse = (orderedIndex > 0 && orderedConvertors[orderedIndex - 1].runtimeTypes.length > 0) ? "else " : ""
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        ["Scene", ["isInstanceOf", "\"Scene\""]]])
    private importedName: string
    constructor(param: string, private table: DeclarationTable, type: ts.ImportTypeNode) {
        super(toIDLType("Object"), [RuntimeType.OBJECT], false, true, param)
        this.importedName = importTypeName(type)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeCustomObject", [`"${this.importedName}"`, value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
            ? writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
                [writer.makeString(`${handler[0]}(${handler.slice(1).concat(value).join(", ")})`)])
            : undefined
    }
}

export class OptionConvertor extends BaseArgConvertor {
    private typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(param: string, private table: DeclarationTable, public type: ts.TypeNode, typeNodeNameConvertor?: TypeNodeNameConvertor) {
        let typeConvertor = table.typeConvertor(param, type, false, undefined, typeNodeNameConvertor)
        let runtimeTypes = typeConvertor.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(maybeOptional(typeConvertor.idlType, true), runtimeTypes, typeConvertor.isScoped, true, param)
        this.typeConvertor = typeConvertor
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        const valueType = `${value}_type`
        const serializedType = (printer.language == Language.JAVA ? undefined : IDLI32Type)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        super(toIDLType(typeNodeNameConvertor?.convert(type) ?? mapType(type)), [RuntimeType.OBJECT], false, true, param)
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
                return table.typeConvertor(param, member.type!, member.questionToken != undefined, undefined, typeNodeNameConvertor)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        if (writer.language === Language.ARKTS) {
            return makeInterfaceTypeCheckerCall(value,
                this.aliasName !== undefined ? this.aliasName : writer.convert(this.idlType),
                this.members.map(it => it[0]), duplicates, writer)
        }
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
        super(toIDLType(name), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, this.table.serializerName(printer.convert(this.idlType)), [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Prefix + getIDLTypeName(this.idlType)
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
        if (writer.language === Language.ARKTS)
            return makeInterfaceTypeCheckerCall(value, writer.convert(this.idlType), this.table.targetStruct(this.declaration).getFields().map(it => it.name), duplicates, writer)
        // First, tricky special cases
        if (getIDLTypeName(this.idlType).endsWith("GestureInterface")) {
            const gestureType = getIDLTypeName(this.idlType).slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), toIDLType("GestureComponent<Object>"))
            return writer.makeEquals([
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        if (getIDLTypeName(this.idlType) === "CancelButtonSymbolOptions") {
            return writer.makeHasOwnProperty(value, "CancelButtonSymbolOptions", "icon", "SymbolGlyphModifier")
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
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${writer.convert(this.idlType)}`)])
    }
}

export class FunctionConvertor extends BaseArgConvertor {
    constructor(
        param: string,
        protected table: DeclarationTable,
        protected type: ts.TypeNode) {
        // TODO: pass functions as integers to native side.
        super(toIDLType("Function"), [RuntimeType.FUNCTION], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `makeArkFunctionFromId(${param})` : `registerCallback(${param})`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, "writeFunction", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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

        // this.wrapCallback(param, param, writer)
        return `${param}_callbackId`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {

        if (writer.language == Language.CPP) {
            super.convertorSerialize(param, value, writer)
            return
        }

        // this.wrapCallback(param, value, writer)
        writer.writeMethodCall(`${param}Serializer`, "writeInt32", [`${value}_callbackId`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        
        this.idlType = createReferenceType(
            `(${this.args.map((it, i) => `arg_${i}: ${getIDLTypeName(it.idlType)}`).join(", ")}) => ${getIDLTypeName(this.ret!.idlType)}`
        )
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
        super(toIDLType(`[${type.elements.map(it => mapType(it)).join(",")}]`), [RuntimeType.OBJECT], false, true, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        super(
            table.language === Language.ARKTS
                ? toIDLType(typeNodeNameConvertor?.convert(type) ?? mapType(type))
                : createContainerType(
                    'sequence',
                    [toIDLType(typeNodeNameConvertor?.convert(elementType) ?? mapType(elementType))]
                ),
            [RuntimeType.OBJECT], false, true, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        if (writer.language === Language.ARKTS && this.isArrayType)
            return makeArrayTypeCheckCall(value, this.idlType, writer)
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${this.targetType(writer)}`)])
    }
    elementTypeName(): string {
        return this.typeNodeNameConvertor?.convert(this.elementType) ?? mapType(this.elementType)
    }
}

export class MapConvertor extends BaseArgConvertor {
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(param: string, public table: DeclarationTable, type: ts.TypeNode, public keyType: ts.TypeNode, public valueType: ts.TypeNode) {
        super(
            createContainerType(
                'record',
                [toIDLType(mapType(keyType)), toIDLType(mapType(valueType))]
            ), [RuntimeType.OBJECT], false, true, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof Map`)])
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor {
    constructor(
        name: string,
        param: string,
        protected table: DeclarationTable,
        private type: ts.InterfaceDeclaration | ts.ClassDeclaration,
    ) {
        super(toIDLType(name), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeMaterialized", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        throw "Not implemented"
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
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${writer.convert(this.idlType)}`)])
    }
}

export class TypeAliasConvertor extends ProxyConvertor {
    constructor(
        param: string,
        private table: DeclarationTable,
        declaration: ts.TypeAliasDeclaration,
        typeNodeNameConvertor: TypeNodeNameConvertor | undefined
    ) {
        super(table.typeConvertor(param, declaration.type, false, undefined, typeNodeNameConvertor), identName(declaration.name))
    }
}
