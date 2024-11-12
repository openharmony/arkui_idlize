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

import { createContainerType, createReferenceType, DebugUtils, forceAsNamedNode, IDLAnyType, IDLBooleanType, IDLCallback, IDLContainerType, IDLContainerUtils, IDLEnum, IDLI16Type, IDLI32Type, IDLI64Type, IDLI8Type, IDLNumberType, IDLOptionalType, IDLPointerType, IDLPrimitiveType, IDLReferenceType, IDLStringType, IDLType, IDLTypeParameterType, IDLU16Type, IDLU32Type, IDLU64Type, IDLU8Type, IDLUnionType, IDLVoidType, isCallback, isContainerType, isOptionalType, isPrimitiveType, isReferenceType, isType, isUnionType, toIDLType } from "../../../idl"
import { IndentedPrinter } from "../../../IndentedPrinter"
import { cppKeywords } from "../../../languageSpecificKeywords"
import { Language } from "../../../Language"
import { ArgConvertor, BaseArgConvertor, EnumConvertor, RuntimeType } from "../../ArgConvertors"
import { PrimitiveType } from "../../ArkPrimitiveType"
import {
    AssignStatement,
    BlockStatement,
    FieldModifier,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeAssignOptions,
    MakeCastOptions,
    MakeRefOptions,
    Method,
    MethodArgPrintHint,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    ObjectArgs,
    StringExpression
} from "../LanguageWriter"
import {
    CDefinedExpression,
    CLikeExpressionStatement,
    CLikeLanguageWriter,
    CLikeLoopStatement,
    CLikeReturnStatement
} from "./CLikeLanguageWriter"
import { ReferenceResolver } from "../../ReferenceResolver"
import { IdlNameConvertor, TypeConvertor } from "../nameConvertor"
import { EnumEntity } from "../../PeerFile"
import { throwException } from "../../../util";
import { CppIDLNodeToStringConvertor } from "../convertors/CppConvertors"

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class CppCastExpression implements LanguageExpression {
    constructor(public convertor:IdlNameConvertor, public value: LanguageExpression, public type: IDLType, private options?:MakeCastOptions) {}
    asString(): string {
        if (forceAsNamedNode(this.type).name === "Tag") {
            return `${this.value.asString()} == ${PrimitiveType.UndefinedRuntime} ? ${PrimitiveType.UndefinedTag} : ${PrimitiveType.ObjectTag}`
        }
        let resultName = ''
        if (this.options?.overrideTypeName) {
            resultName = this.options.overrideTypeName
        } else {
            const pureName = this.mapTypeWithReceiver(this.type, this.options?.receiver)
            const qualifiedName = this.options?.toRef ? `${pureName}&` : pureName
            resultName = qualifiedName
        }
        return this.options?.unsafe
            ? `reinterpret_cast<${resultName}>(${this.value.asString()})`
            : `static_cast<${resultName}>(${this.value.asString()})`
    }
    private mapTypeWithReceiver(type: IDLType, receiver?: string): string {
        // make deducing type from receiver
        if (receiver !== undefined) {
            return `std::decay<decltype(${receiver})>::type`
        }
        return this.convertor.convertType(type)
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
                public isConst: boolean = true,
                protected options?:MakeAssignOptions
            ) {
        super(variableName, type, expression, isDeclared, isConst, options)
     }
     write(writer: CppLanguageWriter): void{
        if (this.isDeclared) {
            const typeName = this.type ? writer.stringifyTypeWithReceiver(this.type, this.options?.receiver) : "auto"
            const typeSpec = this.options?.assignRef ? `${typeName}&` : typeName
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
        writer.print(`${this.deserializer}.resizeMap<${this.mapTypeName}, ${writer.stringifyType(this.keyType)}, ${writer.stringifyType(this.valueType)}>(&${this.map}, ${this.size});`)
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
    protected typeConvertor: IdlNameConvertor
    constructor(printer: IndentedPrinter, resolver:ReferenceResolver) {
        super(printer, resolver, Language.CPP)
        this.typeConvertor = new CppIDLNodeToStringConvertor(this.resolver)
    }
    stringifyType(type: IDLType): string {
        return this.typeConvertor.convertType(type)
    }
    fork(): LanguageWriter {
        return new CppLanguageWriter(new IndentedPrinter(), this.resolver)
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
        this.printer.print(`${forceAsNamedNode(type).name} ${name};`)
        this.printer.popIndent()
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        const superInvocation = superCall
            ? ` : ${superCall.name}(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`
            : ""
        const argList = signature.args.map((it, index) => {
            const maybeDefault = signature.defaults?.[index] ? ` = ${signature.defaults![index]}` : ""
            return `${this.stringifyMethodArgType(it, signature.argHint(index))} ${signature.argName(index)}${maybeDefault}`
        }).join(", ");
        this.print("public:")
        this.print(`${className}(${argList})${superInvocation} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.print(`}`)
    }
    writeProperty(propName: string, propType: IDLType, mutable: boolean = true) {
        throw new Error("writeProperty for c++ is not implemented yet.")
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
    override makeRef(type: IDLType | string, options?:MakeRefOptions): IDLType {
        if (typeof type === 'string') {
            return createReferenceType(`${type}&`)
        }
        return createReferenceType(`${this.stringifyTypeWithReceiver(type, options?.receiver)}&`)
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
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true, options?:MakeAssignOptions): LanguageStatement {
        return new CppAssignStatement(variableName, type, expr, isDeclared, isConst, options)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        throw new Error(`TBD`)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new CLikeReturnStatement(expr)
    }
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        throw new Error(`TBD`)
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
    makeArrayInit(type: IDLContainerType): LanguageExpression {
        return this.makeString(`{}`)
    }
    makeClassInit(type: IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        return this.makeString(`${this.stringifyType(type)}(${paramenters.map(it => it.asString()).join(", ")})`)
    }
    makeMapInit(type: IDLType): LanguageExpression {
        return this.makeString(`{}`)        
    }
    makeArrayResize(array: string, length: string, deserializer: string): LanguageStatement {
        return new CppArrayResizeStatement(array, length, deserializer)
    }
    makeMapResize(mapTypeName: string, keyType: IDLType, valueType: IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return new CppMapResizeStatement(mapTypeName, keyType, valueType, map, size, deserializer)
    }
    makeCast(expr: LanguageExpression, type: IDLType, options?:MakeCastOptions): LanguageExpression {
        return new CppCastExpression(this.typeConvertor, expr, type, options)
    }
    writePrintLog(message: string): void {
        this.print(`printf("${message}\n")`)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CDefinedExpression(value);
    }
    makeSetUnionSelector(value: string, index: string): LanguageStatement {
        return this.makeAssign(`${value}.selector`, undefined, this.makeString(index), false)
    }
    makeSetOptionTag(value: string, tag: LanguageExpression): LanguageStatement {
        return this.makeAssign(`${value}.tag`, undefined, tag, false)
    }
    getObjectAccessor(convertor: BaseArgConvertor, value: string, args?: ObjectArgs): string {
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
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // TODO: maybe use std::move?
        return new BlockStatement([
            this.makeAssign(keyAccessor, undefined, this.makeString(key), false),
            this.makeAssign(valueAccessor, undefined, this.makeString(value), false)
        ], false)
    }
    getTagType(): IDLType {
        return createReferenceType('Tag')
    }
    getRuntimeType(): IDLType {
        return createReferenceType(`RuntimeType`)
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
    enumFromOrdinal(value: LanguageExpression, _: IDLEnum): LanguageExpression {
        return value;
    }
    ordinalFromEnum(value: LanguageExpression, _: IDLEnum): LanguageExpression {
        return value;
    }
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        return param
    }
    override makeEnumCast(value: string, _unsafe: boolean, convertor: EnumConvertor | undefined): string {
        if (convertor === undefined) {
            throwException("Need pass EnumConvertor")
        }
        return `static_cast<${this.typeConvertor.convertEntry(convertor.enumEntry)}>(${value})`
    }
    override escapeKeyword(name: string): string {
        return cppKeywords.has(name) ? name + "_" : name
    }
    makeEnumEntity(enumEntity: EnumEntity, isExport: boolean): LanguageStatement {
        return new CppEnumEntityStatement(enumEntity)
    }
    private decayTypeName(typeName: string) {
        if (typeName.endsWith('*') || typeName.endsWith('&')) {
            typeName = typeName.substring(0, typeName.length - 1)
        }
        if (typeName.startsWith('const ')) {
            typeName = typeName.substring(6)
        }

        return typeName
    }
    override stringifyMethodReturnType(type:IDLType, hint?: MethodArgPrintHint): string {
        const name = this.stringifyType(type)
        let postfix = ''
        if (hint === MethodArgPrintHint.AsPointer || hint === MethodArgPrintHint.AsConstPointer) {
            postfix = '*'
        }
        let constModifier = ''
        if (hint === MethodArgPrintHint.AsConstPointer) {
            constModifier = 'const '
        }
        return `${constModifier}${name}${postfix}`
    }
    override stringifyMethodArgType(type:IDLType, hint?: MethodArgPrintHint): string {
        // we should decide pass by value or by reference here
        const name = this.stringifyType(type)
        let constModifier = ''
        let postfix = ''
        switch (hint) {
            case undefined:
            case MethodArgPrintHint.AsValue:
                break;
            case MethodArgPrintHint.AsPointer:
                postfix = '*'
                break;
            case MethodArgPrintHint.AsConstPointer:
                constModifier = 'const ';
                postfix = '*'
                break;
            case MethodArgPrintHint.AsConstReference:
                constModifier = 'const '
                postfix = '&'
                break;
            default:
                throw new Error(`Unknown hint ${hint}`)
        }
        return `${constModifier}${name}${postfix}`
    }
    stringifyTypeWithReceiver(type: IDLType, receiver?: string): string {
        // make deducing type from receiver
        if (receiver !== undefined) {
            return `std::decay<decltype(${receiver})>::type`
        }
        return this.stringifyType(type)
    }
    override makeSerializerConstructorSignature(): NamedMethodSignature | undefined {
        return new NamedMethodSignature(
            IDLVoidType, [
                createContainerType('sequence', [IDLU8Type]) /*idl.createReferenceType("uint8_t*")*/ ,
                createReferenceType("CallbackResourceHolder" /* ast */)
            ],
            ["data", "resourceHolder"],
            [undefined, `nullptr`],
            [undefined, undefined, MethodArgPrintHint.AsPointer]
        )
    }
}
