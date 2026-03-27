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

import * as idl from "../idl/index.js";
import { Language } from "../Language.js";
import {
    BlockStatement,
    BranchStatement,
    ExpressionAssigner,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    PrintHint,
    StringExpression,
    NamedMethodSignature,
    ProxyStatement,
    ExpressionStatement,
    MethodSignature
} from "./LanguageWriter.js";
import { NativeModuleType, RuntimeType } from "./common.js";
import { generatorConfiguration, generatorTypePrefix } from "../config.js"
import { getTransformer, LibraryInterface } from "../LibraryInterface.js";
import { capitalize, hashCodeFromString, isDefined, throwException, warn } from "../util.js";
import { CppConvertor, CppNameConvertor } from "./convertors/CppConvertors.js";
import { PrimitiveTypesInstance } from "../peer-generation/PrimitiveType.js";
import { PeerLibrary } from "../peer-generation/PeerLibrary.js";
import { LayoutNodeRole } from "../peer-generation/LayoutManager.js";
import { isInExternalModule } from "../peer-generation/modules.js";
import { getExtractor } from "../peer-generation/Extractors.js";
import { maybeRestoreGenerics, maybeRestoreThrows, maybeTransformManagedCallback } from "../transformers/transformUtils.js";
import { convertType, TypeConvertor, withInsideInstanceof } from "./nameConvertor.js";
import { ReferenceResolver } from "../peer-generation/ReferenceResolver.js";
import { collapseTypes } from "../peer-generation/idl/common.js";
import { ETSLanguageWriter } from "./writers/ETSLanguageWriter.js";
import { buffer } from "stream/consumers";

export function getSerializerName(_library: LibraryInterface, _language: Language, declaration: idl.IDLEntry) {
    return idl.entryToFunctionName(_language, declaration, "", "SerializerImpl")
}

export function getEnumToOrdinalName(_language: Language, declaration: idl.IDLEnum) {
    return idl.entryToFunctionName(_language, declaration, "", "ToOrdinal")
}

export function makeETSDiscriminatorFromFields(self: LanguageWriter, convertor: { targetType: (writer: LanguageWriter) => string }, value: string, accessors: string[], duplicates: Set<string>): LanguageExpression {
    if (convertor instanceof AggregateConvertor
        || convertor instanceof InterfaceConvertor
        || convertor instanceof MaterializedClassConvertor
        || convertor instanceof CustomTypeConvertor) {
        return self.instanceOf(value, convertor.idlType)
    }
    return self.makeString(`${value} instanceof ${withInsideInstanceof(true, () => convertor.targetType(self))}`)
}

export interface ArgConvertor {
    param: string
    idlType: idl.IDLType
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    isOut?: true
    convertorArg(param: string, writer: LanguageWriter): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement
    holdResource(resourceName: string, holder: string, writer: LanguageWriter): void
    interopType(): idl.IDLType
    nativeType(): idl.IDLType
    targetType(writer: LanguageWriter): string
    isPointerType(): boolean
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined
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

    holdResource(_resourceName: string, _holder: string, _writer: LanguageWriter): void { }
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
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    abstract convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
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
        optionalAccessor: (field: T) => boolean) {
        if (!uniqueFields || uniqueFields.length === 0) return undefined
        const firstNonOptional = uniqueFields.find(it => !optionalAccessor(it))
        const accessors = firstNonOptional ? [nameAccessor(firstNonOptional)] : uniqueFields.map(it => nameAccessor(it))
        return writer.makeNaryOp("||", accessors.map(it => writer.makeHasOwnProperty(value + "!", it)))
    }
}

export class BooleanConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(type, [RuntimeType.BOOLEAN], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.castToBoolean(param)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeStatement(
            printer.makeMethodCall(`${param}Serializer`, "writeBoolean",
                [printer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readBoolean()`))
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class UndefinedConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(type, [RuntimeType.UNDEFINED], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeUndefined().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeStatement(printer.makeString(""))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeUndefined())
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class VoidConvertor extends UndefinedConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(param, type)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeVoid().asString()
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeVoid())
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
}

export class StringConvertor extends BaseArgConvertor {
    private literalValue?: string
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(type, [RuntimeType.STRING], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP
            ? writer.makeUnsafeCast_(writer.makeString(`&${param}`), this.idlType, PrintHint.AsConstPointer)
            : writer.escapeKeyword(param)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, "writeString",
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readString()`),
            this.idlType, { optional: false }
        ))
    }
    nativeType(): idl.IDLType {
        return idl.createPrimitiveType('String')
    }
    interopType(): idl.IDLType {
        return idl.createPrimitiveType('String')
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
            return writer.getNodeName(idl.createPrimitiveType('String'))
        }
        return super.targetType(writer);
    }
}

export class EnumConvertor extends BaseArgConvertor {
    private readonly interopNameConvertor = new CppNameConvertor(this.library)
    constructor(param: string, public enumEntry: idl.IDLEnum, protected library: LibraryInterface) {
        super(idl.createReferenceType(enumEntry),
            [idl.isStringEnum(enumEntry) ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.i32FromEnum(writer.makeString(writer.escapeKeyword(param)), this.enumEntry).asString()
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, `write${this.enumSerializeInteropType()}`,
                [this.toEnumSerializeType(writer.i32FromEnum(writer.makeString(value), this.enumEntry), writer)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const readExpr = writer.makeMethodCall(`${deserializerName}`, `read${this.enumSerializeInteropType()}`, [])
        const enumExpr = writer.enumFromI32(readExpr, this.enumEntry)
        return assigneer(enumExpr)
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return idl.enumBinaryRepresentation(this.enumEntry)
    }
    isPointerType(): boolean {
        return false
    }
    targetType(writer: LanguageWriter): string {
        return writer.getNodeName(this.idlType)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeMethodCall(
            writer.makeMethodCall('Object', 'values', [writer.makeString(writer.getNodeName(this.enumEntry))]).asString(),
            'includes', [writer.makeString(value)])
    }
    enumSerializeInteropType(): string {
        // Note that the serializes do not have methods for unsigned types
        const interopName = this.interopNameConvertor.convert(idl.enumBinaryRepresentation(this.enumEntry))
        return interopName.startsWith("U") ? interopName.substring(1) : interopName
    }
    toEnumSerializeType(expr: LanguageExpression, writer: LanguageWriter): LanguageExpression {
        if (writer.language != Language.KOTLIN) return expr
        const typeName = writer.getNodeName(idl.enumBinaryRepresentation(this.enumEntry))
        if (!typeName.startsWith("U")) return expr
        return writer.makeMethodCall(`(${expr.asString()})`, `to${typeName.substring(1)}`, [])
    }
}

export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        // Improve: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super(type, [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP
            ? writer.makeUnsafeCast_(writer.makeString(`&${param}`), this.idlType, PrintHint.AsConstPointer)
            : writer.escapeKeyword(param)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, "writeNumber",
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readNumber()`),
            this.idlType, { optional: false })
        )
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return true
    }
}

export class NumericConvertor extends BaseArgConvertor {
    private readonly interopNameConvertor = new CppNameConvertor(this.library)
    constructor(protected library: LibraryInterface, param: string, type: idl.IDLPrimitiveType) {
        // check numericPrimitiveTypes.include(type)
        super(type, [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, `write${this.interopNameConvertor.convert(this.idlType)}`,
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(
            writer.makeString(`${deserializerName}.read${this.interopNameConvertor.convert(this.idlType)}()`)
        )
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class BigIntToU64Convertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(type, [RuntimeType.BIGINT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.escapeKeyword(param)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, `writeInt64`,
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readInt64()`),
            this.idlType, { optional: false })
        )
    }
    nativeType(): idl.IDLType {
        return idl.createPrimitiveType('i64')
    }
    interopType(): idl.IDLType {
        return idl.createPrimitiveType('i64')
    }
    isPointerType(): boolean {
        return false
    }
}

export class ObjectConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLType) {
        super(
            type,
            [
                RuntimeType.BIGINT,
                RuntimeType.BOOLEAN,
                RuntimeType.FUNCTION,
                RuntimeType.MATERIALIZED,
                RuntimeType.NUMBER,
                RuntimeType.OBJECT,
                RuntimeType.STRING,
                RuntimeType.SYMBOL,
            ],
            false,
            true,
            param
        )
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.escapeKeyword(param)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, writer.language === Language.CPP ? `writeObject` : "holdAndWriteObject",
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeMethodCall(deserializerName, 'readObject', []),
            this.idlType, { optional: false })
        )
    }
    holdResource(name: string, holder: string, writer: LanguageWriter): void {
        writer.writeStatement(
            writer.makeAssign(name, idl.createReferenceType(`idlize.stdlib.CallbackResource`),
                writer.makeString(`{${this.param}.resource.resourceId, holdManagedCallbackResource, releaseManagedCallbackResource}`), true))
        writer.writeExpressionStatement(
            writer.makeMethodCall(holder, 'holdCallbackResource', [
                writer.makeString('&' + name)])
        )
    }
    nativeType(): idl.IDLType {
        return idl.createPrimitiveType('any')
    }
    interopType(): idl.IDLType {
        return idl.createPrimitiveType('any')
    }
    isPointerType(): boolean {
        return true
    }
}

export class PointerConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        // check numericPrimitiveTypes.include(type)
        super(type, [RuntimeType.NUMBER, RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, "writePointer",
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(
            writer.makeString(`${deserializerName}.readPointer()`)
        )
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class BufferConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(type, [RuntimeType.OBJECT], false, true, param)
    }
    convertorArg(param: string, _: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeStatement(
            writer.makeMethodCall(`${param}Serializer`, "writeBuffer",
                [writer.makeString(value)]
            ))
    }
    convertorDeserialize(_: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readBuffer()`),
            this.idlType, { optional: false })
        )
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.instanceOf(value, this.idlType);
    }
}

export class AggregateConvertor extends BaseArgConvertor {
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
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const stmts: LanguageStatement[] = this.memberConvertors.flatMap((it, index) => {
            const memberName = this.members[index][0]
            const memberAccess = `${value}.${printer.escapeKeyword(memberName)}`
            const memberMangledName = `${value}${capitalize(memberName)}`
            return [
                printer.makeAssign(memberMangledName, undefined, printer.makeString(memberAccess), true),
                it.convertorSerialize(param, memberMangledName, printer)
            ]
        })
        return printer.makeBlock(stmts, false)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        if (writer.language === Language.CPP) {
            statements.push(writer.makeAssign(bufferName, this.idlType, undefined, true, false))
        }
        // Improve: Needs to be reworked DeserializerBase.readFunction properly
        if (writer.language === Language.ARKTS
            && this.memberConvertors.find(it => it instanceof FunctionConvertor)) {
            return new BlockStatement([writer.makeThrowError("Not implemented yet")], false)
        }
        for (let i = 0; i < this.decl.properties.length; i++) {
            const prop = this.decl.properties[i]
            const propConvertor = this.memberConvertors[i]
            const propName = `${bufferName}${capitalize(prop.name)}`
            statements.push(propConvertor.convertorDeserialize(`${propName}TempBuf`, deserializerName, (expr) => {
                if (writer.language === Language.CPP) {
                    // prefix initialization for CPP, just easier. Waiting for easy work with nullables
                    return writer.makeAssign(`${bufferName}.${writer.escapeKeyword(prop.name)}`, undefined, expr, false)
                }
                /**
                 * todo: check UnionType name creation for union of unnamed nodes (isNamedNode() == false)
                 */
                const memberType = idl.maybeOptional(prop.type, prop.isOptional)
                return writer.makeAssign(propName, memberType, expr, true, true)
            }, writer))
        }
        if (writer.language === Language.CPP) {
            statements.push(assigneer(writer.makeString(bufferName)))
        } else if (writer.language == Language.CJ) {
            const resultExpression = writer.makeString(`${writer.getNodeName(this.idlType)}(${this.decl.properties.map(prop => `${bufferName}${capitalize(prop.name)}`).join(", ")})`)
            statements.push(assigneer(resultExpression))
        } else if (writer.language == Language.KOTLIN) {
            const resultExpression = this.decl.subkind === idl.IDLInterfaceSubkind.Tuple ?
                writer.makeString(`${writer.getNodeName(this.idlType)}(${this.decl.properties.map(prop => `${bufferName}${capitalize(prop.name)}`).join(', ')})`) :
                writer.makeString(`object: ${writer.getNodeName(this.idlType)} { ${this.decl.properties.map(prop => `override var ${prop.name} = ${bufferName}_${prop.name}`).join("; ")} }`)
            statements.push(assigneer(resultExpression))
        } else {
            const resultExpression = this.makeAssigneeExpression(this.decl.properties.map(prop => {
                return [prop.name, writer.makeString(`${bufferName}${capitalize(prop.name)}`)]
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
        return idl.createReferenceType(this.decl)
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
            it => it[1])
    }
}

export class TupleConvertor extends AggregateConvertor {
    constructor(library: LibraryInterface, param: string, type: idl.IDLType, decl: idl.IDLInterface) {
        super(library, param, type, decl)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const stmts: LanguageStatement[] = this.memberConvertors.flatMap((it, index) => {
            return [
                printer.makeAssign(`${value}N${index}`, undefined, printer.makeTupleAccess(value, index), true),
                it.convertorSerialize(param, `${value}N${index}`, printer)
            ]
        })
        return printer.makeBlock(stmts, false)
    }
    protected override makeAssigneeExpression(fields: [string, LanguageExpression][], writer: LanguageWriter): LanguageExpression {
        return writer.makeCast(writer.makeString(`[${fields.map(it => it[1].asString()).join(', ')}]`), this.idlType)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl)
    }
    interopType(): idl.IDLType {
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

export class InterfaceConvertor extends BaseArgConvertor {
    constructor(private library: LibraryInterface, name: string /* change to IDLReferenceType */, param: string, public declaration: idl.IDLInterface) {
        super(idl.createReferenceType(declaration), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const accessor = getSerializerName(this.library, writer.language, this.declaration)
        writer.addFeature(accessor, this.library.layout.resolve({ node: this.declaration, role: LayoutNodeRole.SERIALIZER }))
        return writer.makeStatement(
            writer.makeStaticMethodCall(accessor, 'write', [writer.makeString(`${param}Serializer`), writer.makeString(writer.escapeKeyword(value))])
        )
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const accessor = getSerializerName(this.library, writer.language, this.declaration)
        writer.addFeature(accessor, this.library.layout.resolve({ node: this.declaration, role: LayoutNodeRole.SERIALIZER }))
        return assigneer(writer.makeStaticMethodCall(accessor, 'read', [writer.makeString(deserializerName)]))
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        // Actually shouldn't be used!
        // throw new Error("Must never be used")
        return idl.createPrimitiveType('SerializerBuffer')
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
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional)
    }
}

export class ClassConvertor extends InterfaceConvertor {
    constructor(library: LibraryInterface, name: string, param: string, declaration: idl.IDLInterface) {
        super(library, name, param, declaration)
    }
    override unionDiscriminator(value: string,
        index: number,
        writer: LanguageWriter,
        duplicateMembers: Set<string>): LanguageExpression | undefined {
        return writer.instanceOf(value, this.idlType)
    }
}

export class ArrayConvertor extends BaseArgConvertor { //
    elementConvertor: ArgConvertor
    constructor(private library: LibraryInterface, param: string, private type: idl.IDLContainerType, protected elementType: idl.IDLType) {
        super(idl.createContainerType('sequence', [elementType]), [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = library.typeConvertor(param, elementType)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        // Array length.
        const valueLength = printer.makeArrayLength(value).asString()
        statements.push(printer.makeStatement(
            printer.makeMethodCall(`${param}Serializer`, "writeInt32",
                [printer.makeString(printer.castToInt(valueLength, 32))]
            ))
        )

        const loopCounter = `${value}CounterI`
        const elementName = `${value}TmpElement`
        statements.push(printer.makeLoop(loopCounter, valueLength, printer.makeBlock([
            printer.makeAssign(elementName,
                this.elementType,
                printer.makeArrayAccess(value, loopCounter), true),
            this.elementConvertor.convertorSerialize(param, elementName, printer)
        ], false)))

        return printer.makeBlock(statements, false)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const lengthBuffer = `${bufferName}Length`
        const counterBuffer = `${bufferName}BufCounterI`
        const statements: LanguageStatement[] = []
        const arrayType = this.idlType
        statements.push(writer.makeAssign(lengthBuffer, idl.createPrimitiveType('i32'), writer.makeString(`${deserializerName}.readInt32()`), true))
        if (writer instanceof ETSLanguageWriter) {
            // in ETS we must explicitly set initializer value per each element OR pass initializer function
            statements.push(writer.makeAssign(bufferName, arrayType, writer.makeArrayInit(this.type, lengthBuffer, {
                initializerFunction: writer.makeLambda(new MethodSignature(this.elementType, [idl.createPrimitiveType('i32')]), [
                    this.elementConvertor.convertorDeserialize(`${bufferName}TempBuf`, deserializerName, (expr) => {
                        return writer.makeLambdaReturn(expr)
                    }, writer)
                ])
            })))
        } else {
            statements.push(writer.makeAssign(bufferName, arrayType, writer.makeArrayInit(this.type, lengthBuffer), true, false))
            statements.push(writer.makeArrayResize(bufferName, writer.getNodeName(arrayType), lengthBuffer, deserializerName))
            statements.push(writer.makeLoop(counterBuffer, lengthBuffer,
                this.elementConvertor.convertorDeserialize(`${bufferName}TempBuf`, deserializerName, (expr) => {
                    return writer.makeAssign(writer.makeArrayAccess(bufferName, counterBuffer).asString(), undefined, expr, false)
                }, writer)))
        }
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
        return writer.instanceOf(value, this.idlType)
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        const array = language === Language.CPP ? ".array" : ""
        return args?.index ? `${value}${array}${args.index}` : value
    }
}

export class SetConvertor extends ArrayConvertor {
    constructor(library: PeerLibrary, param: string, declaration: idl.IDLTypedef) {
        const elementType = maybeRestoreGenerics(declaration, library)!.typeArguments![0]
        super(library, param, idl.createContainerType('sequence', [elementType]), elementType)
    }

    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        if (printer.language === Language.CPP) {
            return super.convertorSerialize(param, value, printer)
        }
        
        const elementBuffer = `${value}Element`
    
        return printer.makeBlock([
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, "writeInt32",
                    [printer.makeString(printer.castToInt(printer.makeSetSize(value).asString(), 32))]
                )),
            printer.makeSetForEach(value, elementBuffer, [
                this.elementConvertor.convertorSerialize(param, elementBuffer, printer)
            ])
        ], false)
    }

    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        if (writer.language === Language.CPP) {
            return super.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
        }

        const lengthBuffer = `${bufferName}Length`
        const counterBuffer = `${bufferName}BufCounterI`
        const statements: LanguageStatement[] = []
        statements.push(writer.makeAssign(lengthBuffer, idl.createPrimitiveType('i32'), writer.makeString(`${deserializerName}.readInt32()`), true))
        statements.push(writer.makeAssign(bufferName, undefined, writer.makeSetInit(this.elementType), true, false))
        statements.push(writer.makeLoop(counterBuffer, lengthBuffer,
            this.elementConvertor.convertorDeserialize(`${bufferName}TempBuf`, deserializerName, (expr) => {
                return writer.makeSetAdd(bufferName, expr)
            }, writer)))
        if (writer.language === Language.KOTLIN) {
            statements.push(assigneer(writer.makeMethodCall(bufferName, "toSet", [])))
        } else {
            statements.push(assigneer(writer.makeString(bufferName)))
        }
        return new BlockStatement(statements, false)
    }
}

export class MapConvertor extends BaseArgConvertor {
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(private library: LibraryInterface, param: string, type: idl.IDLType, public keyType: idl.IDLType, public valueType: idl.IDLType) {
        super(
            idl.createContainerType('record', [keyType, valueType], { extendedAttributes: type.extendedAttributes }),
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
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        // Map size.
        const mapSize = printer.makeMapSize(value)
        return printer.makeBlock([
            printer.makeStatement(printer.makeMethodCall(`${param}Serializer`, "writeInt32", [printer.makeString(printer.castToInt(mapSize.asString(), 32))])),
            printer.makeMapForEach(value, `${value}KeyVar`, `${value}ValueVar`, [
                this.keyConvertor.convertorSerialize(param, `${value}KeyVar`, printer),
                this.valueConvertor.convertorSerialize(param, `${value}ValueVar`, printer)
            ])
        ], false)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const mapTypeName = writer.getNodeName(this.idlType)
        const keyType = this.keyType
        const valueType = this.valueType
        const sizeBuffer = `${bufferName}SizeVar`
        const keyBuffer = `${bufferName}KeyVar`
        const valueBuffer = `${bufferName}ValueVar`
        const counterBuffer = `${bufferName}IVar`
        const keyAccessor = this.getObjectAccessor(writer.language, bufferName, { index: counterBuffer, field: "keys" })
        const valueAccessor = this.getObjectAccessor(writer.language, bufferName, { index: counterBuffer, field: "values" })
        return new BlockStatement([
            writer.makeAssign(sizeBuffer, idl.createPrimitiveType('i32'),
                writer.makeString(`${deserializerName}.readInt32()`), true, true),
            writer.makeAssign(bufferName, this.idlType, writer.makeMapInit(this.idlType), true, false),
            writer.makeMapResize(mapTypeName, keyType, valueType, bufferName, sizeBuffer, deserializerName),
            writer.makeLoop(counterBuffer, sizeBuffer, new BlockStatement([
                this.keyConvertor.convertorDeserialize(`${keyBuffer}TempBuf`, deserializerName, (expr) => {
                    return writer.makeAssign(keyBuffer, keyType, expr, true, true)
                }, writer),
                this.valueConvertor.convertorDeserialize(`${valueBuffer}TempBuf`, deserializerName, (expr) => {
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
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeString(`${value} instanceof Map`)
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index && args?.field
            ? `${value}.${args.field}[${args.index}]`
            : value
    }
}

export class DateConvertor extends BaseArgConvertor {
    constructor(param: string, type: idl.IDLPrimitiveType) {
        super(type, [RuntimeType.NUMBER], false, false, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        if (writer.language === Language.CPP) {
            return param
        }
        if (writer.language === Language.KOTLIN) {
            return `${param}.toEpochMilliseconds()`
        }
        return `${param}.getTime()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        if (writer.language === Language.CPP) {
            return writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writeInt64", [writer.makeString(value)]))
        } else if (writer.language === Language.CJ) {
            return writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writeInt64", [
                writer.makeCast(writer.makeString(`${value}`), idl.createPrimitiveType('i64'))
            ]))
        } else if (writer.language === Language.KOTLIN) {
            return writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writeInt64", [
                writer.makeString(`${value}.toEpochMilliseconds()`)
            ]))
        } else {
            return writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writeInt64", [
                writer.makeCast(writer.makeString(`${value}.getTime()`), idl.createPrimitiveType('i64'))
            ]))
        }
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const deserializeTime = writer.makeMethodCall(`${deserializerName}`, "readInt64", [])
        if (writer.language === Language.CPP) {
            return assigneer(deserializeTime)
        }
        if (writer.language === Language.CJ) {
            return assigneer(writer.makeString(`DateTime.now()`))
        }
        if (writer.language === Language.KOTLIN) {
            return assigneer(writer.makeString(`Instant.fromEpochMilliseconds(${deserializeTime.asString()})`))
        }
        return assigneer(writer.makeString(`new Date(${deserializeTime.asString()})`))
    }
    nativeType(): idl.IDLType {
        return idl.createPrimitiveType('date')
    }
    interopType(): idl.IDLType {
        return idl.createPrimitiveType('date')
    }
    isPointerType(): boolean {
        return false
    }
}

export class ProxyConvertor extends BaseArgConvertor {
    constructor(public convertor: ArgConvertor, suggestedReference?: idl.IDLReferenceType) {
        super(suggestedReference ? suggestedReference : convertor.idlType, convertor.runtimeTypes, convertor.isScoped, convertor.useArray, convertor.param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return this.convertor.convertorArg(param, writer)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return this.convertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return this.convertor.convertorSerialize(param, value, printer)
    }
    nativeType(): idl.IDLType {
        return this.convertor.nativeType()
    }
    interopType(): idl.IDLType {
        return this.convertor.interopType()
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
    constructor(library: LibraryInterface, param: string, typedef: idl.IDLTypedef) {
        super(library.typeConvertor(param, typedef.type), idl.createReferenceType(typedef))
    }
}

export class CustomTypeConvertor extends BaseArgConvertor {
    constructor(param: string,
        public readonly customTypeName: string,
        private readonly isGenericType: boolean,
        tsType: string) {
        super(idl.createReferenceType(tsType ?? "Object"), [RuntimeType.OBJECT], false, true, param)
        warnCustomObject(`${customTypeName}: ${tsType}`)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    /** todo: check */
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeStatement(printer.makeMethodCall(
            `${param}Serializer`,
            `writeCustomObject`,
            [printer.makeString(`"${this.customTypeName}"`), printer.makeCastCustomObject(value, this.isGenericType)]
        ))
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
        return idl.createPrimitiveType('CustomObject')
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
}

export class OptionConvertor extends BaseArgConvertor {
    private readonly typeConvertor: ArgConvertor
    // Improve: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(library: LibraryInterface, param: string, public type: idl.IDLOptionalType) {
        let conv = library.typeConvertor(param, type.type)
        let currentConv: ArgConvertor = conv
        while (currentConv instanceof ProxyConvertor) {
            currentConv = currentConv.convertor
        }
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
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const valueValue = `${value}TmpValue`.replaceAll('.', '_')
        return printer.makeCondition(
            printer.makeDefinedCheck(value, this.type),
            new BlockStatement([
                printer.makeStatement(printer.makeMethodCall(`${param}Serializer`, "writeInt8", [printer.makeRuntimeType(RuntimeType.OBJECT)])),
                printer.makeAssign(valueValue, undefined, printer.makeValueFromOption(value, this.typeConvertor), true),
                this.typeConvertor.convertorSerialize(param, this.typeConvertor.getObjectAccessor(printer.language, valueValue), printer)
            ], true, false),
            new BlockStatement([printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, "writeInt8", [printer.makeRuntimeType(RuntimeType.UNDEFINED)])
            )], true, false)
        )
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const runtimeBufferName = `${bufferName}RuntimeType`
        const statements: LanguageStatement[] = []
        statements.push(writer.makeAssign(runtimeBufferName, undefined,
            writer.makeCast(writer.makeString(`${deserializerName}.readInt8()`), writer.getRuntimeType()), true))
        const bufferType = this.nativeType()
        statements.push(writer.makeAssign(bufferName, bufferType, writer.language === Language.CPP ? undefined : writer.makeNull(this.type), true, false)) // maybe change to generic None

        const thenStatement = new BlockStatement([
            this.typeConvertor.convertorDeserialize(`${bufferName}Opt`, deserializerName, (expr) => {
                const receiver = writer.language === Language.CPP
                    ? `${bufferName}.value` : bufferName
                return writer.makeAssign(receiver, undefined, expr, false)
            }, writer)
        ], true, false)
        statements.push(writer.makeSetOptionTag(bufferName, writer.makeCast(writer.makeString(runtimeBufferName), writer.getTagType())))
        statements.push(writer.makeCondition(writer.makeRuntimeTypeDefinedCheck(runtimeBufferName), thenStatement))
        statements.push(assigneer(writer.makeString(bufferName)))
        return writer.makeBlock(statements, false)
    }
    nativeType(): idl.IDLType {
        return this.type
    }
    interopType(): idl.IDLType {
        return this.type
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP ? `${value}.value` : value
    }
}

class ConvertorItem {
    constructor(
        public convertor: ArgConvertor,
        public index: number,
        public type: idl.IDLType
    ) {
    }
}

export class UnionConvertor extends BaseArgConvertor {
    private readonly memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(private library: LibraryInterface, param: string, private type: idl.IDLUnionType) {
        super(idl.createPrimitiveType('Object'), [], false, true, param)
        this.memberConvertors = type.types.map(member => library.typeConvertor(param, member))
        this.unionChecker = new UnionRuntimeTypeChecker(this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        this.idlType = type
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for union")
    }
    isSequence(type: idl.IDLType): boolean {
        return idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type)
    }
    isIndexedDiscriminator(writer: LanguageWriter) {
        // Indexed discriminator is only used in CPP
        // All other languages check the first array element type for arrays discrimination
        if ([Language.CPP, Language.KOTLIN].includes(writer.language)) return true
        return false
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        let convertorItems = this.memberConvertors.map((it, index) => new ConvertorItem(it, index, getSourceType(it)))
        convertorItems = UnionConvertor.sortInterfacesInheritance(this.library, convertorItems)
        if (this.isIndexedDiscriminator(printer))
            return printer.makeMultiBranchCondition(convertorItems.map(it => this.makeBranch(param, value, value, printer, it)));
        // Make arrays type descrimination
        return this.convertorSerializeMultiBranch(param, value, value, printer, convertorItems)
    }
    makeStoreSelector(param: string, index: number, printer: LanguageWriter): LanguageStatement {
        return printer.makeStatement(
            printer.makeMethodCall(
                `${param}Serializer`, "writeInt8",
                [printer.makeString(printer.castToInt(index.toString(), 8))]
            )
        )
    }
    makeBranch(param: string, value: string, array: string, printer: LanguageWriter, convertorItem: ConvertorItem): BranchStatement {
        const convertor = convertorItem.convertor
        const index = convertorItem.index
        const type = convertorItem.type
        const discriminator = this.unionChecker.makeDiscriminator(value, index, printer, this.library, type)
        const statements: LanguageStatement[] = []
        statements.push(this.makeStoreSelector(param, index, printer))
        if (!(convertor instanceof UndefinedConvertor)) {
            const varName = `${array}ForIdx${index}`
            statements.push(
                printer.makeAssign(varName, undefined,
                    printer.makeUnionVariantCast(convertor.getObjectAccessor(printer.language, array), printer.getNodeName(getSourceType(convertor)), convertor, index), true)
            )
            statements.push(convertor.convertorSerialize(param, varName, printer))
        }

        const genericDiscriminator = withGenericDiscriminator(this.library, this.memberConvertors, array, discriminator, type, printer)
        const stmt = new BlockStatement(statements, false)
        return { expr: genericDiscriminator, stmt }
    }
    makeArrayBranch(param: string, value: string, array: string, printer: LanguageWriter, arrayConvertorItems: ConvertorItem[]): BranchStatement[] {
        if (arrayConvertorItems.length == 0) return []

        const arrayConvertorItem = arrayConvertorItems[0]
        const elemName = `${value}Elem`
        const elemAccess = printer.makeString(`${value}[0]`)
        const checkZeroArray = printer.makeCondition(
            printer.makeString(`${value}.length == 0`),
            new BlockStatement([
                this.makeStoreSelector(param, arrayConvertorItem.index, printer),
                printer.makeStatement(
                    printer.makeMethodCall(`${param}Serializer`, "writeInt32", [printer.makeString("0")]))
            ], true, false),
            new BlockStatement([
                printer.makeAssign(elemName, undefined, elemAccess, true, true),
                this.convertorSerializeMultiBranch(param, elemName, array, printer, arrayConvertorItems.map(it =>
                    new ConvertorItem(it.convertor, it.index, (it.type as idl.IDLContainerType).elementType[0])))
            ], true, false)
        )
        const arrayMultiBranch: BranchStatement = {
            expr: this.unionChecker.makeDiscriminator(value, arrayConvertorItem.index, printer, this.library, arrayConvertorItem.type),
            stmt: checkZeroArray
        }
        return [arrayMultiBranch]
    }
    convertorSerializeMultiBranch(param: string, value: string, array: string, printer: LanguageWriter, convertors: ConvertorItem[]): LanguageStatement {
        return printer.makeMultiBranchCondition([
            ...convertors
                .filter(it => !this.isSequence(it.type))
                .map(it => this.makeBranch(param, value, array, printer, it)),
            ...this.makeArrayBranch(param, value, array, printer, convertors.filter(it => this.isSequence(it.type)))
        ])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        let selectorBuffer = `${bufferName}UnionSelector`
        const maybeOptionalUnion = writer.language === Language.CPP || writer.language == Language.CJ
            ? this.type
            : idl.createOptionalType(this.type)
        statements.push(writer.makeAssign(selectorBuffer, idl.createPrimitiveType('i8'),
            writer.makeString(`${deserializerName}.readInt8()`), true))
        statements.push(writer.makeAssign(bufferName, maybeOptionalUnion, undefined, true, false))
        if (writer.language === Language.CPP)
            statements.push(writer.makeAssign(`${bufferName}.selector`, undefined, writer.makeString(selectorBuffer), false))
        const branches: BranchStatement[] = this.memberConvertors.map((it, index) => {
            const receiver = this.getObjectAccessor(writer.language, bufferName, { index: `${index}` })
            const expr = writer.makeString(`${selectorBuffer} == ${writer.castToInt(index.toString(), 8)}`)
            const stmt = new BlockStatement([
                writer.makeSetUnionSelector(bufferName, `${index}`),
                it.convertorDeserialize(`${bufferName}BufU`, deserializerName, (expr) => {
                    if (writer.language == Language.CJ) {
                        return writer.makeAssign(receiver, undefined, writer.makeFunctionCall(writer.getNodeName(this.type), [expr]), false)
                    } if (writer.language == Language.KOTLIN) {
                        return writer.makeAssign(receiver, undefined, writer.makeMethodCall(writer.getNodeName(this.type), `create${index}`, [expr]), false)
                    } else {
                        return writer.makeAssign(receiver, undefined, expr, false)
                    }
                }, writer),
            ], false)
            return { expr, stmt }
        })
        statements.push(writer.makeMultiBranchCondition(branches, writer.makeThrowError(`One of the branches for ${bufferName} has to be chosen through deserialisation.`)))
        statements.push(assigneer(writer.makeCast(writer.makeString(bufferName), this.nativeType())))
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
        return writer.makeNaryOp("||",
            this.memberConvertors.map((_, n) => this.unionChecker.makeDiscriminator(value, n, writer, this.library)))
    }
    private static sortInterfacesInheritance(resolver: ReferenceResolver, items: ConvertorItem[]): ConvertorItem[] {
        // if interface Child extends interface Parent
        // first check is `if (value instanceof Child)`
        // second check is `if (value instanceof Parent)`
        // If we would generate instanceof Parent firstly, child would never be happen.
        let resolveInterface = (type: idl.IDLType): idl.IDLInterface | undefined => {
            if (!idl.isReferenceType(type)) {
                return undefined
            }
            const decl = resolver.resolveTypeReference(type)
            return decl && idl.isInterface(decl) ? decl : undefined
        }
        let resolveParents = (decl: idl.IDLInterface): idl.IDLInterface[] => {
            return [...decl.inheritance
                .map(resolveInterface)
                .filter(isDefined)
                .flatMap(it => [it, ...resolveParents(it)])]
        }
        const queue = items.map<{
            convertorItem: ConvertorItem,
            needs?: ConvertorItem[],
        }>(it => {
            return { convertorItem: it }
        })
        queue.forEach((it, _, sortItems) => {
            const decl = resolveInterface(it.convertorItem.type)
            const parents = decl ? resolveParents(decl) : undefined
            if (parents) {
                for (const other of sortItems) {
                    const otherDecl = resolveInterface(other.convertorItem.type)
                    if (otherDecl && parents.includes(otherDecl)) {
                        other.needs ??= []
                        other.needs.push(it.convertorItem)
                    }
                }
            }
        })
        const sorted: ConvertorItem[] = []
        while (queue.length) {
            for (let i = 0; i < queue.length;) {
                const item = queue[i]
                if (!item.needs || item.needs?.every(it => sorted.includes(it))) {
                    queue.splice(i, 1)
                    sorted.push(item.convertorItem)
                } else {
                    i++
                }
            }
        }
        return sorted
    }
}

export class ThrowsConvertor extends BaseArgConvertor {
    private convertor: ArgConvertor | undefined

    constructor(private library: LibraryInterface, param: string, private decl: idl.IDLInterface) {
        super(idl.createReferenceType(decl), [RuntimeType.OBJECT], false, true, param)
        const restoredThrow = maybeRestoreThrows(decl, library)!
        this.convertor = !idl.isVoidType(restoredThrow) && !(idl.isPrimitiveType(restoredThrow) && restoredThrow.name === 'this') ? library.typeConvertor(param, restoredThrow) : undefined
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Method not implemented.");
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        return writer.makeBlock([
            writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, 'writeBoolean', [writer.makeString(`${value}.hasException`)])),
            writer.makeCondition(
                writer.makeString(`${value}.hasException`),
                writer.makeBlock([writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, 'writeException', [
                    writer.makeUnwrapOptional(writer.makeString(`${value}.exception`))
                ]))], true, false),
                !this.convertor ? undefined : writer.makeBlock([
                    writer.makeAssign(`${value}Value`, undefined, writer.makeUnwrapOptional(writer.makeString(`${value}.value`)), true),
                    this.convertor?.convertorSerialize(param, `${value}Value`, writer),
                ], true, false),
            )
        ], false)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = [
            writer.makeAssign(`${bufferName}HasException`, idl.createPrimitiveType('boolean'), writer.makeMethodCall(deserializerName, 'readBoolean', []), true)
        ]
        if (writer.language === Language.TS || writer.language === Language.ARKTS) {
            writer.addFeature(`ThrowsWrapper`, `@koalaui/interop`)
            statements.push(writer.makeAssign(bufferName, idl.createReferenceType(this.decl), writer.makeString(`{ hasException: ${bufferName}HasException }`), true))
        } else if (writer.language === Language.CPP) {
            statements.push(writer.makeAssign(bufferName, idl.createReferenceType(this.decl), writer.makeString(`{ .hasException=${bufferName}HasException }`), true, false))
        } else if (writer.language === Language.KOTLIN) {
            const nameConvertor = this.library.createTypeNameConvertor(Language.KOTLIN)
            let unwrappedType = maybeRestoreThrows(this.decl, this.library)!
            if (idl.isPrimitiveType(unwrappedType) && unwrappedType.name === 'this')
                unwrappedType = idl.createPrimitiveType('void')
            writer.addFeature(`ThrowsWrapper`, writer.interopModule)
            // HACK until generics in Kotlin are supported
            statements.push(new ExpressionStatement(writer.makeString(`val ${bufferName} = ThrowsWrapper<${nameConvertor.convert(unwrappedType)}>(${bufferName}HasException)`)))
        } else {
            throw new Error(`Not implemented for ${writer.language.name}`)
        }
        statements.push(writer.makeCondition(
            writer.makeString(`${bufferName}.hasException`),
            writer.makeBlock([
                writer.makeAssign(`${bufferName}.exception`, undefined, writer.makeMethodCall(deserializerName, 'readException', []), false),
            ]),
            !this.convertor ? undefined : writer.makeBlock([
                this.convertor?.convertorDeserialize(`${bufferName}Value`, deserializerName, (expression) => {
                    return writer.makeAssign(`${bufferName}.value`, undefined, expression, false)
                }, writer),
            ]),
        ))
        statements.push(assigneer(writer.makeString(bufferName)))
        return writer.makeBlock(statements, false)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl)
    }
    interopType(): idl.IDLType {
        throw new Error("ThrowsConvertor")
    }
    isPointerType(): boolean {
        return true
    }
}

export class FunctionConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, param: string, type: idl.IDLPrimitiveType) {
        // Improve: pass functions as integers to native side.
        super(type, [RuntimeType.FUNCTION], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error('Shall not be used')
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        throw new Error('Shall not be used')
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        throw new Error('Shall not be used')
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor {
    constructor(private library: LibraryInterface, param: string, public declaration: idl.IDLInterface) {
        super(idl.createReferenceType(declaration), [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        const nameConvertor = this.library.createTypeNameConvertor(Language.CPP)
        switch (writer.language) {
            case Language.CPP:
                return `static_cast<${nameConvertor.convert(this.declaration)}>(${param})`
            case Language.CJ:
                return `MaterializedBase.toPeerPtr(${writer.escapeKeyword(param)})`
            default:
                if (isInExternalModule(this.declaration)) {
                    const extractor = getExtractor(this.declaration, writer.language, true)
                    return `${extractor.receiver}.${extractor.method}(${param})`
                }
                return `toPeerPtr(${param})`
        }
    }

    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessorRoot = getSerializerName(this.library, printer.language, this.declaration)
        printer.addFeature(accessorRoot, this.library.layout.resolve({ node: this.declaration, role: LayoutNodeRole.SERIALIZER }))
        return printer.makeStatement(
            printer.makeStaticMethodCall(
                accessorRoot, 'write',
                [printer.makeString(`${param}Serializer`), printer.makeString(value)]
            )
        )
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const accessorRoot = getSerializerName(this.library, writer.language, this.declaration)
        writer.addFeature(accessorRoot, this.library.layout.resolve({ node: this.declaration, role: LayoutNodeRole.SERIALIZER }))
        const readStatement = writer.makeCast(
            writer.makeStaticMethodCall(accessorRoot, "read", [writer.makeString(deserializerName)]),
            this.declaration)
        return assigneer(readStatement)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.declaration)
    }
    interopType(): idl.IDLType {
        return idl.createPrimitiveType('pointer')
    }
    isPointerType(): boolean {
        return false
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        if (idl.isInterface(this.declaration)) {
            if (this.declaration.subkind === idl.IDLInterfaceSubkind.Class) {
                return writer.instanceOf(value, this.idlType)
            }
            if (this.declaration.subkind === idl.IDLInterfaceSubkind.Interface) {
                const uniqueFields = this.declaration.properties.filter(it => !duplicates.has(it.name))
                return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional)
            }
        }
    }
}

export class ImportTypeConvertor extends BaseArgConvertor {
    protected importedName: string
    constructor(param: string, importedName: string) {
        super(idl.createPrimitiveType('Object'), [RuntimeType.OBJECT], false, true, param)
        this.importedName = importedName
        warnCustomObject(importedName, `imported`)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeStatement(printer.makeMethodCall(`${param}Serializer`, "writeCustomObject", [printer.makeString(`"${this.importedName}"`), printer.makeString(value)]))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readCustomObject("${this.importedName}")`))
    }
    nativeType(): idl.IDLType {
        // treat ImportType as CustomObject
        return idl.createPrimitiveType('CustomObject')
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
}

export class CallbackConvertor extends BaseArgConvertor {
    constructor(
        private readonly library: LibraryInterface,
        param: string,
        private readonly decl: idl.IDLCallback,
        private readonly interopModuleName: NativeModuleType
    ) {
        super(idl.createReferenceType(decl), [RuntimeType.FUNCTION], false, true, param)
    }

    private get isTransformed(): boolean {
        return this.decl !== this.transformedDecl
    }

    private get transformedDecl(): idl.IDLCallback {
        return maybeTransformManagedCallback(this.decl, this.library) ?? this.decl
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        if (writer.language == Language.CPP) {
            return writer.makeBlock([
                writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writeCallbackResource", [writer.makeString(`${value}.resource`)])),
                writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writePointer", [writer.makeCast(
                    new StringExpression(`${value}.call`), idl.createPrimitiveType('pointer'), { unsafe: true })])),
                writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, "writePointer", [writer.makeCast(
                    new StringExpression(`${value}.callSync`), idl.createPrimitiveType('pointer'), { unsafe: true })]))
            ], false)
        }
        if (this.isTransformed) {
            const convertor = this.library.createTypeNameConvertor(Language.CPP)
            value = `CallbackTransformer.transformFrom${convertor.convert(this.decl)}(${value})`
        }
        return writer.makeStatement(writer.makeMethodCall(`${param}Serializer`, `holdAndWriteCallback`, [writer.makeString(`${value}`)]))
    }
    private checkForMeaninglessParameters(decl: idl.IDLCallback): [string[], idl.IDLType[]] {
        const originalReference = maybeRestoreGenerics(decl, this.library)
        if (originalReference) {
            const original = this.library.resolveTypeReference(originalReference) as idl.IDLCallback
            if (original.parameters.length !== decl.parameters.length) {
                const newNames = original.parameters.map(it => it.name)
                const newTypes: idl.IDLType[] = []
                const names = decl.parameters.map(it => it.name)
                original.parameters.forEach(it => {
                    if (names.includes(it.name)) {
                        newTypes.push(idl.maybeOptional(it.type!, it.isOptional))
                    }
                    else {
                        newTypes.push(idl.createPrimitiveType('void'))
                    }
                })
                return [newNames, newTypes]
            }
        }
        return [[], []]
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter, useSyncVersion: boolean = true): LanguageStatement {
        if (writer.language == Language.CPP) {
            const callerInvocation = writer.makeString(`getManagedCallbackCaller(${generateCallbackKindAccess(this.transformedDecl, writer.language)})`)
            const callerSyncInvocation = writer.makeString(`getManagedCallbackCallerSync(${generateCallbackKindAccess(this.transformedDecl, writer.language)})`)
            const resourceReadExpr = writer.makeMethodCall(`${deserializerName}`, `readCallbackResource`, [])
            const callReadExpr = writer.makeCast(
                writer.makeMethodCall(`${deserializerName}`, `readPointerOrDefault`,
                    [writer.makeCast(callerInvocation, idl.createPrimitiveType('pointer'), { unsafe: true })]),
                idl.createPrimitiveType('undefined') /* not used */,
                {
                    unsafe: true,
                    overrideTypeName: `void(*)(${generateCallbackAPIArguments(this.library, this.transformedDecl).join(", ")})`
                }
            )
            const callSyncReadExpr = writer.makeCast(
                writer.makeMethodCall(`${deserializerName}`, `readPointerOrDefault`,
                    [writer.makeCast(callerSyncInvocation, idl.createPrimitiveType('pointer'), { unsafe: true })]),
                idl.createPrimitiveType('undefined') /* not used */,
                {
                    unsafe: true,
                    overrideTypeName: `void(*)(${[`${generatorTypePrefix()}VMContext vmContext`].concat(generateCallbackAPIArguments(this.library, this.transformedDecl)).join(", ")})`
                }
            )
            return assigneer(writer.makeString(`{${resourceReadExpr.asString()}, ${callReadExpr.asString()}, ${callSyncReadExpr.asString()}}`))
        }

        const resourceName = bufferName + "BufResource"
        const callName = bufferName + "BufCall"
        const callSyncName = bufferName + 'BufCallSync'
        const argsSerializer = bufferName + "BufArgs"
        const continuationValueName = bufferName + "BufContinuationValue"
        const continuationCallbackName = bufferName + "BufContinuationCallback"
        const statements: LanguageStatement[] = []
        statements.push(writer.makeAssign(
            resourceName,
            idl.createReferenceType("idlize.stdlib.CallbackResource"),
            writer.makeMethodCall(deserializerName, 'readCallbackResource', []),
            true,
        ))
        statements.push(writer.makeAssign(
            callName,
            idl.createPrimitiveType('pointer'),
            writer.makeMethodCall(deserializerName, `readPointer`, []),
            true,
        ))
        statements.push(writer.makeAssign(
            callSyncName,
            idl.createPrimitiveType('pointer'),
            writer.makeMethodCall(deserializerName, 'readPointer', []),
            true,
        ))
        let names = this.decl.parameters.map(it => it.name)
        let types = this.decl.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional))
        if (writer.language === Language.KOTLIN) {
            const [newNames, newTypes] = this.checkForMeaninglessParameters(this.decl)
            if (newNames.length > 0 && newTypes.length > 0) {
                names = newNames
                types = newTypes
            }
        }
        const callbackSignature = new NamedMethodSignature(
            maybeRestoreThrows(this.decl.returnType, this.library) ?? this.decl.returnType, types, names)
        const hasContinuation = !idl.isVoidType(this.decl.returnType)
        let continuation: LanguageStatement[] = []
        if (hasContinuation) {
            const continuationReference = this.library.createContinuationCallbackReference(this.decl.returnType)
            const continuationConvertor = this.library.typeConvertor(continuationCallbackName, continuationReference)
            const returnType = this.decl.returnType
            const optionalReturnType = idl.createOptionalType(this.decl.returnType)
            continuation = [
                writer.language == Language.CJ ?
                    writer.makeAssign(continuationValueName, undefined, writer.makeString(`${writer.getNodeName(this.decl.returnType).replace(/[\<\>]/g, '')}Holder(None<${writer.getNodeName(this.decl.returnType)}>)`), true, true) :
                    writer.makeAssign(continuationValueName, optionalReturnType, writer.language == Language.KOTLIN ? writer.makeNull() : undefined, true, false),
                writer.makeAssign(
                    continuationCallbackName,
                    continuationReference,
                    writer.makeLambda(new NamedMethodSignature(idl.createPrimitiveType('void'), [returnType], [`value`]), [
                        writer.language == Language.CJ ?
                            writer.makeAssign(`${continuationValueName}.value`, undefined, writer.makeString(`value`), false) :
                            writer.makeAssign(continuationValueName, undefined, writer.makeString(`value`), false)
                    ]),
                    true,
                ),
                new ProxyStatement(writer => {
                    writer.writeStatement(continuationConvertor.convertorSerialize(argsSerializer, continuationCallbackName, writer))
                }),
            ]
        }
        const returnStatements: LanguageStatement[] = []
        if (hasContinuation) {
            const continuationValueAccess = writer.language == Language.CJ ?
                writer.makeString(`${continuationValueName}.value`) :
                writer.makeUnwrapOptional(writer.makeString(continuationValueName))
            let restoredThrow: idl.IDLType | undefined
            if (restoredThrow = maybeRestoreThrows(this.decl.returnType, this.library)) {
                returnStatements.push(writer.makeCondition(
                    writer.makeString(`${continuationValueAccess.asString()}.hasException`),
                    writer.makeBlock([
                        writer.makeThrowError(writer.makeUnwrapOptional(writer.makeString(`${continuationValueAccess.asString()}.exception`)))
                    ], true, false),
                    writer.makeBlock([
                        writer.makeLambdaReturn(idl.isVoidType(restoredThrow)
                            ? undefined
                            : writer.makeUnwrapOptional(writer.makeString(`${continuationValueAccess.asString()}.value`)))
                    ], true, false),
                ))
            } else {
                returnStatements.push(writer.makeLambdaReturn(writer.makeCast(continuationValueAccess, this.decl.returnType)))
            }
        } else {
            returnStatements.push(writer.makeLambdaReturn())
        }
        const closure = writer.makeLambda(callbackSignature, [
            writer.makeAssign(`${argsSerializer}Serializer`, idl.createReferenceType('idlize.internal.SerializerBase'), writer.makeMethodCall('SerializerBase', 'hold', []), true),
            new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writeInt32`,
                [writer.makeString(`${resourceName}.resourceId`)])),
            new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writePointer`,
                [writer.makeString(callName)])),
            new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writePointer`,
                [writer.makeString(callSyncName)])),
            ...this.decl.parameters.map(it => {
                const convertor = this.library.typeConvertor(it.name, it.type!, it.isOptional)
                return new ProxyStatement((writer: LanguageWriter) => {
                    writer.writeStatement(convertor.convertorSerialize(argsSerializer, writer.escapeKeyword(it.name), writer))
                })
            }),
            ...continuation,
            new ExpressionStatement(
                useSyncVersion
                    ? writer.makeNativeCall(this.interopModuleName, `_CallCallbackSync`, [
                        writer.makeString(generatorConfiguration().ApiKind.toString()),
                        writer.makeString(generateCallbackKindValue(this.decl).toString()),
                        writer.makeSerializedBufferGetter(`${argsSerializer}Serializer`),
                        writer.makeString(`${argsSerializer}Serializer.length()`),
                    ])
                    : writer.makeNativeCall(this.interopModuleName, `_CallCallback`, [
                        writer.makeString(generatorConfiguration().ApiKind.toString()),
                        writer.makeString(generateCallbackKindValue(this.decl).toString()),
                        writer.makeSerializedBufferGetter(`${argsSerializer}Serializer`),
                        writer.makeString(`${argsSerializer}Serializer.length()`),
                    ])
            ),
            new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `release`, [])),
            ...returnStatements,
        ])
        writer.addFeature(idl.createReferenceType('idlize.internal.resourceFinalizerRegister'))
        statements.push(
            writer.makeAssign(`${bufferName}Closure`, undefined, closure, true),
            writer.makeStatement(writer.makeFunctionCall(`resourceFinalizerRegister`, [
                writer.makeString(`${bufferName}Closure`),
                writer.makeString(resourceName)
            ])),
        )
        return writer.makeBlock([
            ...statements,
            assigneer(writer.makeString(`${bufferName}Closure`))
        ], false)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl)
    }
    isPointerType(): boolean {
        return true
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

export const CallbackKind = "CallbackKind"

export function generateCallbackKindName(callback: idl.IDLCallback) {
    return `KIND_${callback.name.toUpperCase()}`
}

export function generateCallbackKindAccess(callback: idl.IDLCallback, language: Language) {
    const name = generateCallbackKindName(callback)
    if (language == Language.CPP)
        return name
    if (language == Language.KOTLIN)
        return `${CallbackKind}.${name}.value`
    return `${CallbackKind}.${name}`
}

export function generateCallbackKindValue(callback: idl.IDLCallback): number {
    const name = generateCallbackKindName(callback)
    return hashCodeFromString(name)
}

export function generateCallbackAPIArguments(library: LibraryInterface, callback: idl.IDLCallback): string[] {
    const nameConvertor = new CppConvertor(library)
    const args: string[] = [`const ${PrimitiveTypesInstance.Int32.getText()} resourceId`]
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

class PromiseOutArgConvertor extends BaseArgConvertor {
    callbackConvertor: CallbackConvertor
    callback: idl.IDLCallback
    isOut: true = true
    constructor(
        private readonly library: PeerLibrary,
        param: string,
        readonly promise: idl.IDLContainerType) {
        super(library.createContinuationCallbackReference(promise), [RuntimeType.FUNCTION], false, true, param)
        const type = this.idlType as idl.IDLReferenceType
        const callbackEntry = library.resolveTypeReference(type)
        if (!callbackEntry)
            throw new Error(`Internal error: no callback for ${type.name} resolved`)
        this.callback = callbackEntry as idl.IDLCallback
        this.callbackConvertor = new CallbackConvertor(library, param, this.callback, this.library.interopNativeModule)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return this.callbackConvertor.convertorArg(param, writer)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        if (writer.language == Language.CPP) {
            return this.callbackConvertor.convertorSerialize(param, value, writer)
        }
        let serializeCallback: LanguageExpression
        if (idl.isVoidType(this.promise.elementType[0])) {
            serializeCallback = writer.makeMethodCall(`${param}Serializer`, `holdAndWriteCallbackForPromiseVoid`, [])
        } else {
            serializeCallback = writer.makeMethodCall(`${param}Serializer`, `holdAndWriteCallbackForPromise<${writer.getNodeName(this.promise.elementType[0])}>`, [])
        }
        return writer.makeAssign(value, undefined, writer.language == Language.CJ
            ? writer.makeString(serializeCallback.asString().concat('.promise'))
            : writer.makeTupleAccess(serializeCallback.asString(), 0), true)
    }

    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return this.callbackConvertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return true
    }
}

export class TransformOnSerializeConvertor extends BaseArgConvertor {
    private targetConvertor: ArgConvertor
    constructor(param: string, protected library: PeerLibrary, protected managedDeclaration: idl.IDLEntry, protected source: idl.IDLType, protected target: idl.IDLType) {
        const targetConvertor = library.typeConvertor(param, target)
        super(target, targetConvertor.runtimeTypes, false, targetConvertor.useArray, param)
        this.targetConvertor = targetConvertor
    }
    getSourceType(): idl.IDLType {
        return this.source
    }
    getTargetType(): idl.IDLType {
        return this.target
    }
    isPointerType(): boolean {
        return this.targetConvertor.isPointerType()
    }
    nativeType(): idl.IDLType {
        return this.targetConvertor.nativeType()
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Method not implemented.");
    }
    addImport(transformerInfo: { module: string, ns?: string, method: string }, writer: LanguageWriter) {
        transformerInfo.ns
            ? writer.addFeature(transformerInfo.ns, transformerInfo.module)
            : writer.addFeature(transformerInfo.method, transformerInfo.module)
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        if (writer.language === Language.CPP) {
            return this.targetConvertor.convertorSerialize(param, value, writer)
        }
        if (idl.isReferenceType(this.target)) {
            writer.addFeature(this.target)
        }
        const transformerInfo = getTransformer(this.library, this.managedDeclaration, this.target)
        this.addImport(transformerInfo, writer)
        const transformCallExpression = transformerInfo.ns
            ? writer.makeMethodCall(transformerInfo.ns, transformerInfo.method, [writer.makeString(value)])
            : writer.makeFunctionCall(transformerInfo.method, [writer.makeString(value)])
        const statements = [
            writer.makeAssign(`${value}Transformed`, this.target, transformCallExpression, true),
            this.targetConvertor.convertorSerialize(param, `${value}Transformed`, writer)
        ]
        return writer.makeBlock(statements, false)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        if (writer.language === Language.CPP) {
            return this.targetConvertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
        }
        if (idl.isReferenceType(this.target)) {
            writer.addFeature(this.target)
        }
        const targetDeserialize = this.targetConvertor.convertorDeserialize(
            `${bufferName}D`,
            deserializerName,
            (expr) => writer.makeAssign(`${bufferName}Deserialized`, this.target, expr, true),
            writer,
        )
        const transformerInfo = getTransformer(this.library, this.target, this.managedDeclaration)
        this.addImport(transformerInfo, writer)
        const transformCallExpression = transformerInfo.ns
            ? writer.makeMethodCall(transformerInfo.ns, transformerInfo.method, [writer.makeString(`${bufferName}Deserialized`)])
            : writer.makeFunctionCall(transformerInfo.method, [writer.makeString(`${bufferName}Deserialized`)])
        return writer.makeBlock([
            targetDeserialize,
            assigneer(transformCallExpression)
        ], false)
    }
}

export function createOutArgConvertor(library: PeerLibrary, type: idl.IDLType | undefined, otherParams: string[]): ArgConvertor | undefined {
    if (type && idl.isContainerType(type) && idl.IDLContainerUtils.isPromise(type)) {
        const param = (entropy: number) => `outputArgumentForReturningPromise${entropy || ''}`
        let paramEntropy = 0
        while (otherParams?.includes(param(paramEntropy)))
            ++paramEntropy;
        return new PromiseOutArgConvertor(library, param(paramEntropy), type)
    }
    return undefined
}

function withGenericDiscriminator(
    library: LibraryInterface,
    convertors: ArgConvertor[],
    value: string,
    discriminator: LanguageExpression,
    type: idl.IDLType,
    writer: LanguageWriter,
): LanguageExpression {

    if ([Language.CPP, Language.KOTLIN].includes(writer.language)) return discriminator
    if (!idl.isReferenceType(type)) return discriminator

    const mayBeGeneric = maybeRestoreGenerics(type, writer.resolver)
    if (mayBeGeneric == undefined) return discriminator
    const count = convertors
        .map(it => it.idlType)
        .filter(it => idl.isReferenceType(it))
        .map(it => idl.isReferenceType(it) ? maybeRestoreGenerics(it, writer.resolver) : undefined)
        .filter(it => it && idl.isReferenceType(it) && it.name == mayBeGeneric.name)
        .length
    if (count < 2) return discriminator
    writer.addFeature("typechecks", library.layout.handwrittenPackage())
    const decl = writer.resolver.resolveTypeReference(type)!
    const checkGenericFunc = idl.entryToFunctionName(writer.language, decl, "isGeneric_", "")
    return writer.makeAnd(
        discriminator,
        writer.makeFunctionCall(`typechecks.${checkGenericFunc}`, [writer.makeString(value)])
    )
}

export class UnionFlattener implements TypeConvertor<idl.IDLType[]> {
    constructor(private resolver: ReferenceResolver) {}

    convertImport(type: idl.IDLImport): idl.IDLType[] {
        console.warn("Imports are not implemented yet")
        return []
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLType[] {
        return type.types.flatMap(it => convertType(this, it))
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLType[] {
        const decl = this.resolver.toDeclaration(type)
        return idl.isType(decl) && !(idl.isPrimitiveType(decl) && decl.name === 'CustomObject') ? convertType(this, decl) : [type]
    }
    convertOptional(type: idl.IDLOptionalType): idl.IDLType[] {
        return [type.type, idl.createPrimitiveType('undefined')]
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLType[] {
        return [type]
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLType[] {
        return [type]
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLType[] {
        return [type]
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLType[] {
        return [type]
    }
}

export class UnionRuntimeTypeChecker {
    private conflictingConvertors: Set<ArgConvertor> = new Set()
    private duplicateMembers: Set<string> = new Set()

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
    makeDiscriminator(value: string, convertorIndex: number, writer: LanguageWriter, library: LibraryInterface, type?: idl.IDLType): LanguageExpression {
        let convertor = this.convertors[convertorIndex]
        if (writer.language === Language.TS) {
            const isArray = idl.IDLContainerUtils.isSequence(convertor.idlType)
            if (isArray || this.conflictingConvertors.has(convertor)) {
                // Check elements inside array
                if (type && convertor.idlType != type) {
                    convertor = library.typeConvertor("", type)
                }
                const discriminator = convertor.unionDiscriminator(value, convertorIndex, writer, this.duplicateMembers)
                if (discriminator) return discriminator
            }
        }
        return writer.makeString(
            writer.discriminate(value, convertorIndex, type ?? convertor.idlType, convertor.runtimeTypes)
        )
    }
}

export function flattenUnionType(library: LibraryInterface, type: idl.IDLType): idl.IDLType {
    if (idl.isUnionType(type)) {
        const unionFlattener = new UnionFlattener(library)
        const allTypes = type.types.flatMap(it => convertType(unionFlattener, it))
        const collapsed = collapseTypes(allTypes)
        if (!idl.isUnionType(collapsed) || collapsed.types.length !== allTypes.length)
            return collapsed
    }
    return type
}

function getSourceType(convertor: ArgConvertor): idl.IDLType {
    if (convertor instanceof TransformOnSerializeConvertor) {
        return convertor.getSourceType()
    }
    return convertor.idlType
}
