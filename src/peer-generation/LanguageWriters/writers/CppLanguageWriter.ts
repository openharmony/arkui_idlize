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

import { IDLType, isContainerType, isUnionType } from "../../../idl"
import { IndentedPrinter } from "../../../IndentedPrinter"
import { cppKeywords } from "../../../languageSpecificKeywords"
import { Language } from "../../../Language"
import { ArgConvertor, BaseArgConvertor, RuntimeType } from "../../ArgConvertors"
import { PrimitiveType } from "../../ArkPrimitiveType"
import { ArrayConvertor, EnumConvertor as EnumConvertorDTS, MapConvertor, OptionConvertor, TupleConvertor, UnionConvertor } from "../../Convertors"
import { AssignStatement, BlockStatement, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, ObjectArgs, StringExpression, Type } from "../LanguageWriter"
import { CDefinedExpression, CLikeExpressionStatement, CLikeLanguageWriter, CLikeLoopStatement, CLikeReturnStatement } from "./CLikeLanguageWriter"
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { EnumEntity } from "../../PeerFile"
import { throwException } from "../../../util";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class CppCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: Type, private unsafe = false) {}
    asString(): string {
        if (this.type.name === PrimitiveType.Tag.getText()) {
            return `${this.value.asString()} == ARK_RUNTIME_UNDEFINED ? ARK_TAG_UNDEFINED : ARK_TAG_OBJECT`
        }
        return this.unsafe
            ? `reinterpret_cast<${this.type.name}>(${this.value.asString()})`
            : `static_cast<${this.type.name}>(${this.value.asString()})`
    }
}


////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class CppAssignStatement extends AssignStatement {
    constructor(public variableName: string,
                public type: Type | undefined,
                public expression: LanguageExpression | undefined,
                public isDeclared: boolean = true,
                public isConst: boolean = true) {
        super(variableName, type, expression, isDeclared, isConst)
     }
     write(writer: LanguageWriter): void{
        if (this.isDeclared) {
            const typeSpec = this.type ? writer.mapType(this.type) : "auto"
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
    constructor(private mapTypeName: string, private keyType: string, private valueType: string, private map: string, private size: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeMap<${this.mapTypeName}, ${this.keyType}, ${this.valueType}>(&${this.map}, ${this.size});`)
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
    constructor(printer: IndentedPrinter) {
        super(printer, Language.CPP)
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
    writeFieldDeclaration(name: string, type: Type, modifiers: FieldModifier[] | undefined, optional: boolean, initExpr?: LanguageExpression): void {
        let filter = function(modifier_name : FieldModifier) {
            return modifier_name !== FieldModifier.STATIC
        }
        let prefix = this.makeFieldModifiersList(modifiers, filter)
        this.printer.print(`${prefix}:`)
        this.printer.pushIndent()
        this.printer.print(`${type.name} ${name};`)
        this.printer.popIndent()
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        const superInvocation = superCall
            ? ` : ${superCall.name}(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`
            : ""
        const argList = signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ");
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
        return "ARK_TAG_" + tag
    }
    override makeRef(varName: string): string {
        return `${varName}&`
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
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
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
    override makeUnionVariantCast(value: string, type: Type, convertor: ArgConvertor, index: number) {
        return this.makeString(`${value}.value${index}`)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CLikeLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new CppMapForEachStatement(map, key, value, op)
    }
    makeArrayResize(array: string, typeName: string, length: string, deserializer: string): LanguageStatement {
        return new CppArrayResizeStatement(array, length, deserializer)
    }
    makeMapResize(mapTypeName: string, keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        return new CppMapResizeStatement(mapTypeName, keyType, valueType, map, size, deserializer)
    }
    makeCast(expr: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new CppCastExpression(expr, type, unsafe)
    }
    writePrintLog(message: string): void {
        this.print(`printf("${message}\n")`)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CDefinedExpression(value);
    }
    // TODO: remove this!
    mapType(type: Type): string {
        switch (type.name) {
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
        if (type.name.startsWith("Array<")) {
            const typeSpec = type.name.match(/<(.*)>/)!
            const elementType = this.mapType(new Type(typeSpec[1]))
            return `Array_${elementType}`
        }
        if (!type.name.includes("std::decay<") && type.name.includes("<")) {
            return type.name.replace(/<(.*)>/, "")
        }
        return super.mapType(type)
    }
    mapIDLType(type: IDLType): string {
        if (isUnionType(type)) {
            return `Union_${type.types.map(it => this.mapIDLType(it)).join("_")}`
        }
        /*
        if (isContainerType(type) && type.name == "Promise") {
            return `Promise_${this.mapIDLType(type.elementType[0])}`
        }
        if (isContainerType(type) && type.name == "sequence") {
            return `Array_${this.mapIDLType(type.elementType[0])}`
        } */
        return super.mapIDLType(type)
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
        return this.makeString(`ARK_RUNTIME_${RuntimeType[rt]}`)
    }
    makeMapKeyTypeName(c: MapConvertor): string {
        return c.table.computeTargetName(c.table.toTarget(c.keyType), false)
    }
    makeMapValueTypeName(c: MapConvertor): string {
        return c.table.computeTargetName(c.table.toTarget(c.valueType), false)
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // TODO: maybe use std::move?
        return new BlockStatement([
            this.makeAssign(keyAccessor, undefined, this.makeString(key), false),
            this.makeAssign(valueAccessor, undefined, this.makeString(value), false)
        ], false)
    }
    getTagType(): Type {
        return new Type(PrimitiveType.Tag.getText())
    }
    getRuntimeType(): Type {
        return new Type(PrimitiveType.RuntimeType.getText())
    }
    makeType(typeName: string, nullable: boolean, receiver?: string): Type {
        // make deducing type from receiver
        if (receiver != undefined) {
            return new Type(`std::decay<decltype(${receiver})>::type`)
        }
        return new Type(typeName)
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
