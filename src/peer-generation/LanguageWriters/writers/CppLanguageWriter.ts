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

import { createReferenceType, DebugUtils, getIDLTypeName, IDLAnyType, IDLBooleanType, IDLCallback, IDLContainerType, IDLContainerUtils, IDLEnumType, IDLI16Type, IDLI32Type, IDLI64Type, IDLI8Type, IDLNumberType, IDLOptionalType, IDLPointerType, IDLPrimitiveType, IDLReferenceType, IDLStringType, IDLType, IDLU16Type, IDLU32Type, IDLU64Type, IDLU8Type, IDLUnionType, IDLVoidType, isCallback, isContainerType, isEnumType, isIDLTypeName, isOptionalType, isPrimitiveType, isReferenceType, isType, isUnionType, toIDLType } from "../../../idl"
import { IndentedPrinter } from "../../../IndentedPrinter"
import { cppKeywords } from "../../../languageSpecificKeywords"
import { Language } from "../../../Language"
import { ArgConvertor, BaseArgConvertor, RuntimeType } from "../../ArgConvertors"
import { PrimitiveType } from "../../ArkPrimitiveType"
import { ArrayConvertor, EnumConvertor as EnumConvertorDTS, MapConvertor, OptionConvertor, TupleConvertor, UnionConvertor } from "../../Convertors"
import { AssignStatement, BlockStatement, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, ObjectArgs, StringExpression } from "../LanguageWriter"
import { CDefinedExpression, CLikeExpressionStatement, CLikeLanguageWriter, CLikeLoopStatement, CLikeReturnStatement } from "./CLikeLanguageWriter"
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { ReferenceResolver } from "../../ReferenceResolver"
import { IdlTypeNameConvertor } from "../../idl/IdlTypeConvertor"
import { EnumEntity } from "../../PeerFile"
import { throwException } from "../../../util";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class CppCastExpression implements LanguageExpression {
    constructor(public convertor:IdlTypeNameConvertor, public value: LanguageExpression, public type: IDLType, private unsafe = false) {}
    asString(): string {
        if (isIDLTypeName(this.type, PrimitiveType.Tag.getText())) {
            return `${this.value.asString()} == ${PrimitiveType.UndefinedRuntime} ? ${PrimitiveType.UndefinedTag} : ${PrimitiveType.ObjectTag}`
        }
        return this.unsafe
            ? `reinterpret_cast<${this.convertor.convert(this.type)}>(${this.value.asString()})`
            : `static_cast<${this.convertor.convert(this.type)}>(${this.value.asString()})`
    }
}


////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class CppAssignStatement extends AssignStatement {
    constructor(public variableName: string,
                public type: IDLType | undefined,
                public expression: LanguageExpression | undefined,
                public isDeclared: boolean = true,
                public isConst: boolean = true) {
        super(variableName, type, expression, isDeclared, isConst)
     }
     write(writer: LanguageWriter): void{
        if (this.isDeclared) {
            const typeSpec = this.type ? writer.mapIDLType(this.type) : "auto"
            const initValue = this.expression ? this.expression.asString() : "{}"
            const constSpec = this.isConst ? "const " : ""
            writer.print(`${constSpec}${typeSpec} ${this.variableName} = ${initValue};`)
        } else {
            writer.print(`${this.variableName} = ${this.expression!.asString()};`)
        }
    }
}

class CppArrayResizeStatement implements LanguageStatement {
    constructor(private array: string, private length: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeArray<std::decay<decltype(${this.array})>::type,
        std::decay<decltype(*${this.array}.array)>::type>(&${this.array}, ${this.length});`)
    }
}

class CppMapResizeStatement implements LanguageStatement {
    constructor(private mapTypeName: string, private keyType: IDLType, private valueType: IDLType, private map: string, private size: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeMap<${this.mapTypeName}, ${writer.convert(this.keyType)}, ${writer.convert(this.valueType)}>(&${this.map}, ${this.size});`)
    }
}

class CppMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (int32_t i = 0; i < ${this.map}.size; i++) {`)
        writer.pushIndent()
        writer.print(`auto ${this.key} = ${this.map}.keys[i];`)
        writer.print(`auto ${this.value} = ${this.map}.values[i];`)
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

class CppEnumEntityStatement implements LanguageStatement {
    constructor(private _enum: EnumEntity) {}
    write(writer: LanguageWriter): void {
        writer.print(`typedef enum ${this._enum.name} {`)
        writer.pushIndent()
        for (let i = 0; i < this._enum.members.length; i++) {
            const member = this._enum.members[i]
            writer.print(`${member.name} = ${member.initializerText ?? i},`)
        }
        writer.popIndent()
        writer.print(`} ${this._enum.name};`)
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class CppLanguageWriter extends CLikeLanguageWriter {
    constructor(printer: IndentedPrinter, resolver:ReferenceResolver) {
        super(printer, resolver, Language.CPP)
    }
    fork(): LanguageWriter {
        return new CppLanguageWriter(new IndentedPrinter(), this.resolver)
    }
    convert(type: IDLType | IDLCallback): string {
        if (isType(type) && isOptionalType(type)) {
            return this.mapIDLOptionalType(type)
        }
        if (isCallback(type)) {
            throw new Error("Unimplemented!")
        }
        if (isPrimitiveType(type)) {
            return this.mapIDLPrimitiveType(type)
        }
        if (isContainerType(type)) {
            return this.mapIDLContainerType(type)
        }
        if (isUnionType(type)) {
            return this.mapIDLUnionType(type)
        }
        if (isEnumType(type)) {
            return this.mapIDLEnumType(type)
        }
        if (isReferenceType(type)) {
            return this.mapIDLReferenceType(type)
        }
        throw new Error(`Unmapped type ${DebugUtils.debugPrintType(type)}`)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[]): void {
        const superClasses = (superClass ? [superClass] : []).concat(interfaces ?? [])
        const extendsClause = superClasses.length > 0 ? ` : ${superClasses.map(c => `public ${c}`).join(", ")}` : ''
        this.printer.print(`class ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`};`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void {
        throw new Error("Method not implemented.")
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        if (nullable) {
            this.printer.print(`if (${receiver}) ${receiver}.${method}(${params.join(", ")});`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }
    writeFieldDeclaration(name: string, type: IDLType, modifiers: FieldModifier[] | undefined, optional: boolean, initExpr?: LanguageExpression): void {
        let filter = function(modifier_name : FieldModifier) {
            return modifier_name !== FieldModifier.STATIC
        }
        let prefix = this.makeFieldModifiersList(modifiers, filter)
        this.printer.print(`${prefix}:`)
        this.printer.pushIndent()
        this.printer.print(`${getIDLTypeName(type)} ${name};`)
        this.printer.popIndent()
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        const superInvocation = superCall
            ? ` : ${superCall.name}(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`
            : ""
        const argList = signature.args.map((it, index) => `${this.mapIDLType(it)} ${signature.argName(index)}`).join(", ");
        this.print("public:")
        this.print(`${className}(${argList})${superInvocation} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.print(`}`)
    }

    /**
     * Writes multiline comments decorated with stars
     */
    writeMultilineCommentBlock(lines: string) {
        this.print('/*')
        lines.split("\n").forEach(it => this.print(' * ' + it))
        this.print(' */')
    }

    /**
     * Writes `#include "path"`
     * @param path File path to be included
     */
    writeInclude(path: string) {
        this.print(`#include "${path}"`)
    }

    /**
     * Writes `#include <path>`
     * @param path File path to be included
     */
    writeGlobalInclude(path: string) {
        this.print(`#include <${path}>`)
    }

    /**
     * Writes `namespace <namespace> {` and adds extra indent
     * @param namespace Namespace to begin
     */
    pushNamespace(namespace: string, ident: boolean = true) {
        this.print(`namespace ${namespace} {`)
        if (ident) this.pushIndent()
    }

    /**
     * Writes closing brace of namespace block and removes one level of indent
     */
    popNamespace(ident: boolean = true) {
        if (ident) this.popIndent()
        this.print(`}`)
    }

    override makeTag(tag: string): string {
        return PrimitiveType.Prefix.toLocaleUpperCase() + "TAG_" + tag
    }
    override makeRef(type: IDLType | string): IDLType {
        if (typeof type === 'string') {
            return createReferenceType(`${type}&`)
        }
        return createReferenceType(`${this.convert(type)}&`)
    }
    override makeThis(): LanguageExpression {
        return new StringExpression("*this")
    }
    override makeNull(): LanguageExpression {
        return new StringExpression("nullptr")
    }
    override makeValueFromOption(value: string): LanguageExpression {
        return this.makeString(`${value}.value`)
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new CppAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        throw new Error(`TBD`)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new CLikeReturnStatement(expr)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new CLikeExpressionStatement(expr)
    }
    override makeArrayAccess(value: string, indexVar: string) {
        return this.makeString(`${value}.array[${indexVar}]`)
    }
    override makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    override makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeString(`${value}.selector`), false)
    }
    override makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string, index: number) {
        return this.makeString(`${valueType} == ${index}`)
    }
    override makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index: number) {
        return this.makeString(`${value}.value${index}`)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CLikeLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new CppMapForEachStatement(map, key, value, op)
    }
    makeArrayResize(array: string, typeName: IDLType, length: string, deserializer: string): LanguageStatement {
        return new CppArrayResizeStatement(array, length, deserializer)
    }
    makeMapResize(mapTypeName: string, keyType: IDLType, valueType: IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return new CppMapResizeStatement(mapTypeName, keyType, valueType, map, size, deserializer)
    }
    makeCast(expr: LanguageExpression, type: IDLType, unsafe = false): LanguageExpression {
        return new CppCastExpression(this, expr, type, unsafe)
    }
    writePrintLog(message: string): void {
        this.print(`printf("${message}\n")`)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CDefinedExpression(value);
    }
    mapIDLEnumType(type: IDLEnumType): string {
        return getIDLTypeName(type)
    }
    mapIDLUnionType(type: IDLUnionType): string {
        return `Union_${type.types.map(it => this.mapIDLType(it)).join("_")}`
    }
    mapIDLContainerType(type: IDLContainerType): string {
        if (IDLContainerUtils.isPromise(type)) {
            return `Promise_${this.mapIDLType(type.elementType[0])}`
        }
        if (IDLContainerUtils.isSequence(type)) {
            return `Array_${this.mapIDLType(type.elementType[0])}`
        }
        throw new Error(`Unmapped container type ${DebugUtils.debugPrintType(type)}`)
    }
    mapIDLReferenceType(type: IDLReferenceType): string {
        /***************************************************************/
        // legacy type mapping.
        // If no code relies on this mapping 
        // we should remove it
        const name = getIDLTypeName(type)
        switch (name) {
            case 'KPointer': return 'void*'
            case 'Uint8Array': return 'byte[]'
            case 'int32':
            case 'KInt': return `${PrimitiveType.Prefix}Int32`
            case 'string':
            case 'KStringPtr': return `${PrimitiveType.Prefix}String`
            case 'number': return `${PrimitiveType.Prefix}Number`
            case 'boolean': return `${PrimitiveType.Prefix}Boolean`
            case 'Function': return `${PrimitiveType.Prefix}Function`
            case 'Length': return `${PrimitiveType.Prefix}Length`
            // TODO: oh no
            case 'Array<string[]>' : return `Array_Array_${PrimitiveType.String.getText()}`
        }
        if (name.startsWith("Array<")) {
            const typeSpec = name.match(/<(.*)>/)!
            const elementType = this.mapIDLType(toIDLType(typeSpec[1]))
            return `Array_${elementType}`
        }
        if (!name.includes("std::decay<") && name.includes("<")) {
            return name.replace(/<(.*)>/, "")
        }
        return name
        /***************************************************************/
        // return super.mapIDLReferenceType(type)   
    }
    mapIDLOptionalType(type:IDLOptionalType): string {
        return `Opt_${this.convert(type)}`
    }
    mapIDLPrimitiveType(type: IDLPrimitiveType): string {

        function arkType(text:TemplateStringsArray): string {
            return `${PrimitiveType.Prefix}${text.join('')}`
        }

        switch (type) {
            case IDLVoidType: return 'void'
            // mb we should map another way
            case IDLI8Type: return arkType`Int8`  // char / int8_t
            case IDLU8Type: return arkType`UInt8`  // unsigned char / uint8_t
            case IDLI16Type: return arkType`Int16` // short / int16_t
            case IDLU16Type: return arkType`UInt16` // unsigned short / uint16_t
            case IDLI32Type: return arkType`Int32` // int / int32_t
            case IDLU32Type: return arkType`UInt32` // unsigned int / uint32_t
            case IDLI64Type: return arkType`Int64` // long long / int64_t
            case IDLU64Type: return arkType`UInt64` // unsigned long long / uint64_t

            case IDLNumberType: return arkType`Number`
            case IDLStringType: return arkType`String`

            case IDLBooleanType: return arkType`Boolean`
            case IDLPointerType: return 'void*'

            case IDLAnyType: return arkType`CustomObject`
        }
        throw new Error(`Unmapped primitive type ${DebugUtils.debugPrintType(type)}`)
    }
    makeSetUnionSelector(value: string, index: string): LanguageStatement {
        return this.makeAssign(`${value}.selector`, undefined, this.makeString(index), false)
    }
    makeSetOptionTag(value: string, tag: LanguageExpression): LanguageStatement {
        return this.makeAssign(`${value}.tag`, undefined, tag, false)
    }
    getObjectAccessor(convertor: BaseArgConvertor, value: string, args?: ObjectArgs): string {
        if (convertor instanceof OptionConvertor) {
            return `${value}.value`
        }
        if (convertor instanceof ArrayConvertor && args?.index) {
            return `${value}.array${args.index}`
        }
        if ((convertor instanceof UnionConvertor || convertor instanceof TupleConvertor) && args?.index) {
            return `${value}.value${args.index}`
        }
        if (convertor instanceof MapConvertor && args?.index && args?.field) {
            return `${value}.${args.field}[${args.index}]`
        }
        return value
    }
    makeUndefined(): LanguageExpression {
        return this.makeString(`${PrimitiveType.Undefined.getText()}()`)
    }
    makeVoid(): LanguageExpression {
        return this.makeString(`${PrimitiveType.Void.getText()}()`)
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`${PrimitiveType.Prefix.toUpperCase()}RUNTIME_${RuntimeType[rt]}`)
    }
    makeMapKeyTypeName(c: MapConvertor): IDLType {
        return toIDLType(c.table.computeTargetName(c.table.toTarget(c.keyType), false))
    }
    makeMapValueTypeName(c: MapConvertor): IDLType {
        return toIDLType(c.table.computeTargetName(c.table.toTarget(c.valueType), false))
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // TODO: maybe use std::move?
        return new BlockStatement([
            this.makeAssign(keyAccessor, undefined, this.makeString(key), false),
            this.makeAssign(valueAccessor, undefined, this.makeString(value), false)
        ], false)
    }
    getTagType(): IDLType {
        return toIDLType(PrimitiveType.Tag.getText())
    }
    getRuntimeType(): IDLType {
        return toIDLType(PrimitiveType.RuntimeType.getText())
    }
    makeType(type: IDLType, nullable: boolean, receiver?: string): IDLType {
        // make deducing type from receiver
        if (receiver !== undefined) {
            return toIDLType(`std::decay<decltype(${receiver})>::type`)
        }
        return type
    }
    makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement {
        const statements =
            tupleFields.map((field, index) => {
                //TODO: maybe use std::move?
                return this.makeAssign(`${receiver}.value${index}`, undefined, this.makeString(field), false)
            })
        return new BlockStatement(statements, false)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.INLINE, MethodModifier.STATIC]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return []
    }
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        return value;
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        return value;
    }
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        return param
    }
    override makeCastEnumToInt(convertor: EnumConvertorDTS, value: string, _unsafe?: boolean): string {
        // TODO: remove after switching to IDL
        return `static_cast<${convertor.enumTypeName(this.language)}>(${value})`
    }
    override makeEnumCast(value: string, _unsafe: boolean, convertor: EnumConvertor | undefined): string {
        if (convertor == undefined) {
            throwException("Need pass EnumConvertor")
        }
        return `static_cast<${convertor!.enumTypeName(this.language)}>(${value})`
    }
    override escapeKeyword(name: string): string {
        return cppKeywords.has(name) ? name + "_" : name
    }
    makeEnumEntity(enumEntity: EnumEntity, isExport: boolean): LanguageStatement {
        return new CppEnumEntityStatement(enumEntity)
    }
}
