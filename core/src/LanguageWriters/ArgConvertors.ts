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

import * as idl from "../idl";
import { Language } from "../Language";
import {
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    ExpressionAssigner,
    PrintHint,
    BlockStatement,
    BranchStatement
} from "./LanguageWriter";
import { RuntimeType } from "./common";
import { LibraryInterface } from "../LibraryInterface";
import { warn } from "../util";
import { UnionRuntimeTypeChecker } from "../peer-generation/unions";

export interface ArgConvertor {
    param: string
    idlType: idl.IDLType
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    isOut?: true
    convertorArg(param: string, writer: LanguageWriter): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement
    interopType(): idl.IDLType
    nativeType(): idl.IDLType
    targetType(writer: LanguageWriter): string
    isPointerType(): boolean
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined
    getMembers(): string[]
    getObjectAccessor(languge: Language, value: string, args?: Record<string, string>, writer?: LanguageWriter): string
}

export abstract class BaseArgConvertor implements ArgConvertor {
    protected constructor(
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
    interopType(): idl.IDLType {
        throw new Error("Define")
    }
    targetType(writer: LanguageWriter): string {
        return writer.getNodeName(this.idlType)
    }
    abstract convertorArg(param: string, writer: LanguageWriter): string
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    abstract convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readBoolean()`))
    }
    nativeType(): idl.IDLType {
        return idl.IDLBooleanType
    }
    interopType(): idl.IDLType {
        return idl.IDLBooleanType
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeUndefined())
    }
    nativeType(): idl.IDLType {
        return idl.IDLUndefinedType
    }
    interopType(): idl.IDLType {
        return idl.IDLUndefinedType
    }
    isPointerType(): boolean {
        return false
    }
}

export class VoidConvertor extends UndefinedConvertor {
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeVoid().asString()
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeVoid())
    }
    nativeType(): idl.IDLType {
        return idl.IDLVoidType
    }
}

export class StringConvertor extends BaseArgConvertor {
    private literalValue?: string
    constructor(param: string) {
        super(idl.IDLStringType, [RuntimeType.STRING], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP
            ? writer.makeUnsafeCast_(writer.makeString(`&${param}`), this.idlType, PrintHint.AsConstPointer)
            : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readString()`),
            this.idlType, { optional: false }
        ))
    }
    nativeType(): idl.IDLType {
        return idl.IDLStringType
    }
    interopType(): idl.IDLType {
        return idl.IDLStringType
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

export class EnumConvertor extends BaseArgConvertor {
    constructor(param: string, public enumEntry: idl.IDLEnum) {
        super(idl.createReferenceType(enumEntry.name, undefined, enumEntry),
            [idl.isStringEnum(enumEntry) ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeEnumCast(param, false, this)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        value =
            idl.isStringEnum(this.enumEntry)
                ? writer.ordinalFromEnum(writer.makeString(value), idl.createReferenceType(this.enumEntry.name, undefined, this.enumEntry)).asString()
                : writer.makeEnumCast(value, false, this)
        writer.writeMethodCall(`${param}Serializer`, "writeInt32", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const readExpr = writer.makeMethodCall(`${deserializerName}`, "readInt32", [])
        const enumExpr = idl.isStringEnum(this.enumEntry)
            ? writer.enumFromOrdinal(readExpr, idl.createReferenceType(this.enumEntry.name, undefined, this.enumEntry))
            : writer.makeCast(readExpr, idl.createReferenceType(this.enumEntry.name, undefined, this.enumEntry))
        return assigneer(enumExpr)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.enumEntry.name, undefined, this.enumEntry)
    }
    interopType(): idl.IDLType {
        return idl.IDLI32Type
    }
    isPointerType(): boolean {
        return false
    }
    targetType(writer: LanguageWriter): string {
        return writer.getNodeName(this.idlType) // this.enumTypeName(writer.language)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeDiscriminatorConvertor(this, value, index)
    }
}

export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // TODO: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super(idl.IDLNumberType, [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP
            ? writer.makeUnsafeCast_(writer.makeString(`&${param}`), this.idlType, PrintHint.AsConstPointer)
            : param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeNumber", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readNumber()`),
            this.idlType, { optional: false })
        )
    }
    nativeType(): idl.IDLType {
        return idl.IDLNumberType
    }
    interopType(): idl.IDLType {
        return idl.IDLNumberType
    }
    isPointerType(): boolean {
        return true
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
            printer.writeStatement(
                printer.makeAssign(`${value}_${memberName}`, undefined,
                    printer.makeString(memberAccess), true))
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        if (writer.language === Language.CPP) {
            statements.push(writer.makeAssign(bufferName, this.idlType, undefined, true, false))
        }
        // TODO: Needs to be reworked DeserializerBase.readFunction properly
        if (writer.language === Language.ARKTS
            && this.memberConvertors.find(it => it instanceof FunctionConvertor)) {
            return new BlockStatement([writer.makeThrowError("Not implemented yet")], false)
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
        } else if (writer.language == Language.CJ) {
            const resultExpression = writer.makeString(`${writer.getNodeName(this.idlType)}(${this.decl.properties.map(prop => `${bufferName}_${prop.name}`).join(", ")})`)
            statements.push(assigneer(resultExpression))
        } else {
            const resultExpression = this.makeAssigneeExpression(this.decl.properties.map(prop => {
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
        return idl.createReferenceType(this.decl.name, undefined, this.decl)
    }
    interopType(): idl.IDLType {
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

export class InterfaceConvertorCore extends BaseArgConvertor {
    constructor(private library: LibraryInterface, name: string /* change to IDLReferenceType */, param: string, public declaration: idl.IDLInterface) {
        super(idl.createReferenceType(name, undefined, declaration), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.library.getInteropName(this.idlType)}`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeMethodCall(`${deserializerName}`, `read${this.library.getInteropName(this.idlType)}`, []))
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.declaration?.properties.map(it => it.name) ?? []
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // Try to figure out interface by examining field sets
        const uniqueFields = this.declaration?.properties.filter(it => !duplicates.has(it.name))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional, duplicates)
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
            printer.makeAssign(`${value}_element`,
                this.elementType,
                printer.makeArrayAccess(value, loopCounter), true))
        this.elementConvertor.convertorSerialize(param, this.elementConvertor.getObjectAccessor(printer.language, `${value}_element`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const lengthBuffer = `${bufferName}_length`
        const counterBuffer = `${bufferName}_i`
        const statements: LanguageStatement[] = []
        const arrayType = this.idlType
        statements.push(writer.makeAssign(lengthBuffer, idl.IDLI32Type, writer.makeString(`${deserializerName}.readInt32()`), true))
        statements.push(writer.makeAssign(bufferName, arrayType, writer.makeArrayInit(this.type), true, false))
        statements.push(writer.makeArrayResize(bufferName, writer.getNodeName(arrayType), lengthBuffer, deserializerName))
        statements.push(writer.makeLoop(counterBuffer, lengthBuffer,
            this.elementConvertor.convertorDeserialize(`${bufferName}_buf`, deserializerName, (expr) => {
                return writer.makeAssign(writer.makeArrayAccess(bufferName, counterBuffer).asString(), undefined, expr, false)
            }, writer)))
        statements.push(assigneer(writer.makeString(bufferName)))
        return new BlockStatement(statements, false)
    }
    nativeType(): idl.IDLType {
        return idl.createContainerType('sequence', [this.elementType])
    }
    interopType(): idl.IDLType {
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

export class CustomTypeConvertor extends BaseArgConvertor {
    constructor(param: string,
                public readonly customTypeName: string,
                private readonly isGenericType: boolean = false,
                tsType?: string) {
        super(idl.createReferenceType(tsType ?? "Object"), [RuntimeType.OBJECT], false, true, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
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
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
}

export class OptionConvertor extends BaseArgConvertor { //
    private readonly typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(private library: LibraryInterface, param: string, public type: idl.IDLType) {
        let conv = library.typeConvertor(param, type)
        let runtimeTypes = conv.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(idl.createOptionalType(conv.idlType), runtimeTypes, conv.isScoped, true, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const runtimeBufferName = `${bufferName}_runtimeType`
        const statements: LanguageStatement[] = []
        statements.push(writer.makeAssign(runtimeBufferName, undefined,
            writer.makeCast(writer.makeString(`${deserializerName}.readInt8()`), writer.getRuntimeType()), true))
        const bufferType = this.nativeType()
        if (writer.language == Language.CJ) {
            statements.push(writer.makeAssign(bufferName, bufferType, idl.isOptionalType(bufferType) ? writer.makeString('Option.None') : undefined, true, false))
        } else {
            statements.push(writer.makeAssign(bufferName, bufferType, undefined, true, false))
        }

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
    interopType(): idl.IDLType {
        return idl.createOptionalType(this.type)
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP ? `${value}.value` : value
    }
}

export class UnionConvertor extends BaseArgConvertor { //
    private readonly memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(private library: LibraryInterface, param: string, private type: idl.IDLUnionType) {
        super(idl.IDLObjectType, [], false, true, param)
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        let selectorBuffer = `${bufferName}_selector`
        const maybeOptionalUnion = writer.language === Language.CPP || writer.language == Language.CJ
            ? this.type
            : idl.createOptionalType(this.type)
        statements.push(writer.makeAssign(selectorBuffer, idl.IDLI8Type,
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
                    if (writer.language == Language.CJ) {
                        return writer.makeAssign(receiver, undefined, writer.makeFunctionCall(writer.getNodeName(this.type), [expr]), false)
                    } else {
                        return writer.makeAssign(receiver, undefined, expr, false)
                    }
                }, writer),
            ], false)
            return { expr, stmt }
        })
        statements.push(writer.makeMultiBranchCondition(branches, writer.makeThrowError(`One of the branches for ${bufferName} has to be chosen through deserialisation.`)))
        statements.push(assigneer(writer.makeCast(writer.makeString(bufferName), this.type)))
        return new BlockStatement(statements, false)
    }
    nativeType(): idl.IDLType {
        return this.type
    }
    interopType(): idl.IDLType {
        throw new Error("Union")
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index ? `${value}.value${args.index}` : value
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const checker = new UnionRuntimeTypeChecker(this.memberConvertors)
        return writer.makeNaryOp("||",
            this.memberConvertors.map((_, n) => checker.makeDiscriminator(value, n, writer)))
    }
}

export class FunctionConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, param: string, protected type: idl.IDLReferenceType) {
        // TODO: pass functions as integers to native side.
        super(idl.IDLFunctionType, [RuntimeType.FUNCTION], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `makeArkFunctionFromId(${param})` : `registerCallback(${param})`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, "writeFunction", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readFunction()`),
            this.type, { optional: true }
        ))
    }
    nativeType(): idl.IDLType {
        return idl.IDLFunctionType
    }
    interopType(): idl.IDLType {
        return idl.IDLFunctionType
    }
    isPointerType(): boolean {
        return false
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor {
    constructor(param: string, public declaration: idl.IDLInterface) {
        super(idl.createReferenceType(declaration.name, undefined, declaration), [RuntimeType.OBJECT], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, `write${this.declaration.name}`, [
                    printer.makeString(value)
                ])))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const readStatement = writer.makeCast(
            writer.makeMethodCall(`${deserializerName}`, `read${this.declaration.name}`, []),
            idl.createReferenceType(this.declaration.name, undefined, this.declaration)
        )
        return assigneer(readStatement)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.declaration.name, undefined, this.declaration)
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        if (idl.isInterface(this.declaration)) {
            if (this.declaration.subkind === idl.IDLInterfaceSubkind.Class) {
                return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
                    [writer.instanceOf(this, value, duplicates)])
            }
            if (this.declaration.subkind === idl.IDLInterfaceSubkind.Interface) {
                const uniqueFields = this.declaration.properties.filter(it => !duplicates.has(it.name))
                return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional, duplicates)
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// UTILS

const customObjects = new Set<string>()
function warnCustomObject(type: string, msg?: string) {
    if (!customObjects.has(type)) {
        warn(`Use CustomObject for ${msg ? `${msg} ` : ``}type ${type}`)
        customObjects.add(type)
    }
}
