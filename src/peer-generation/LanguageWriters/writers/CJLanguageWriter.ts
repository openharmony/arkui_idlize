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

import { IDLBooleanType, IDLContainerType, IDLF32Type, IDLF64Type, IDLI16Type, IDLI32Type, IDLI64Type, IDLI8Type, IDLNumberType, IDLParameter, IDLPointerType, IDLPrimitiveType, IDLStringType, IDLType, IDLU16Type, IDLU32Type, IDLU64Type, IDLU8Type, IDLVoidType, isContainerType, isPrimitiveType } from "../../../idl"
import { IndentedPrinter } from "../../../IndentedPrinter"
import { Language } from "../../../Language"
import { CJKeywords } from "../../../languageSpecificKeywords"
import { isDefined } from "../../../util"
import { ArgConvertor, BaseArgConvertor, RuntimeType } from "../../ArgConvertors"
import { EnumConvertor as EnumConvertorDTS, MapConvertor } from "../../Convertors"
import { FieldRecord } from "../../DeclarationTable"
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { EnumEntity } from "../../PeerFile"
import { mapType } from "../../TypeNodeNameConvertor"
import { AssignStatement, ExpressionStatement, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, ObjectArgs, ReturnStatement, Type } from "../LanguageWriter"
import { LambdaExpression, TSCastExpression, TsObjectAssignStatement, TsObjectDeclareStatement, TsTupleAllocStatement } from "./TsLanguageWriter"

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

class CJLambdaExpression extends LambdaExpression {
    constructor(
        signature: MethodSignature,
        body?: LanguageStatement[]) {
        super(signature, body)
    }
    protected get statementHasSemicolon(): boolean {
        return true
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => `${it.name} ${this.signature.argName(i)}`)
        return `(${params.join(", ")}) -> { ${this.bodyAsString()} }`
    }
}

export class CJCheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value}.isNotNone()}`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class CJAssignStatement extends AssignStatement {
    constructor(public variableName: string,
        public type: Type | undefined,
        public expression: LanguageExpression,
        public isDeclared: boolean = true,
        public isConst: boolean = true) {
            super(variableName, type, expression, isDeclared, isConst)
        }

        write(writer: LanguageWriter): void {
            if (this.isDeclared) {
                const typeSpec = this.type ? ': ' + writer.mapType(this.type) : ''
                writer.print(`${this.isConst ? "let" : "var"} ${this.variableName}${typeSpec} = ${this.expression.asString()}`)
            } else {
                writer.print(`${this.variableName} = ${this.expression.asString()}`)
            }
        }
}

class CJLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (${this.counter} in 0..${this.limit}) {`)
        if (this.statement) {
            writer.pushIndent()
            this.statement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}

class CJMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for ((key, value) in ${this.map}) {`)
        writer.pushIndent()
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

export class CJEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: EnumEntity, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        writer.print(this.enumEntity.comment.length > 0 ? this.enumEntity.comment : undefined)
        writer.print(`${this.isExport ? "public " : ""}enum ${this.enumEntity.name} {`)
        writer.pushIndent()
        this.enumEntity.members.forEach((member, index) => {
            writer.print(member.comment.length > 0 ? member.comment : undefined)
            const varticalBar = index < this.enumEntity.members.length - 1 ? '|' : ''
            const initValue = member.initializerText ? ` = ${member.initializerText}` : ``
            writer.print(`${member.name}${initValue}${varticalBar}`)
        })
        writer.popIndent()
        writer.print(`}`)
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class CJLanguageWriter extends LanguageWriter {
    constructor(printer: IndentedPrinter, language: Language = Language.CJ) {
        super(printer, language)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[]): void {
        let extendsClause = superClass ? `${superClass}` : undefined
        let implementsClause = interfaces ? `${interfaces.join(' & ')}` : undefined
        let inheritancePart = [extendsClause, implementsClause]
            .filter(isDefined)
            .join(' & ')
        inheritancePart = inheritancePart.length != 0 ? ' <: '.concat(inheritancePart) : ''
        this.printer.print(`public open class ${name}${inheritancePart} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeEnum(name: string, members: { name: string, stringId: string | undefined, numberId: number }[], op: (writer: LanguageWriter) => void): void {
        this.printer.print(`public enum ${name}{`)
        this.pushIndent()
        for (const member of members) {
            this.print('|'.concat(member.name))
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void {
        let extendsClause = superInterfaces ? ` <: ${superInterfaces.join(" & ")}` : ''
        this.printer.print(`interface ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        receiver = this.escapeKeyword(receiver)
        params = params.map(argName => this.escapeKeyword(argName))
        if (nullable) {
            this.printer.print(`if (let Some(${receiver}) <- ${receiver}) { ${receiver}.${method}(${params.join(", ")}) }`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }
    writeFieldDeclaration(name: string, type: Type, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        name = this.escapeKeyword(name)
        let prefix = this.makeFieldModifiersList(modifiers)
        this.printer.print(`${prefix} var ${name}: ${optional ? '?' : ''}${this.mapType(type)}${init}`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.printer.print(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') + ' ' : ''}${className}(${signature.args.map((it, index) => `${signature.argName(index)}: ${it.nullable ? '?' : ''}${this.mapType(it)}`).join(", ")}) {`)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")});`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, method.modifiers, " {")
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    private writeDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[], postfix?: string): void {
        let prefix = modifiers
            ?.filter(it => this.supportedModifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        prefix = prefix ? prefix + " " : ""
        this.print(`${prefix}func ${name}(${signature.args.map((it, index) => `${signature.argName(index)}: ${it.nullable ? '?' : ''}${this.mapType(it)}`).join(", ")}): ${this.mapType(signature.returnType)}${postfix ?? ""}`)
    }
    nativeReceiver(): string { return 'NativeModule' }
    makeNativeMethodNamedSignature(returnType: IDLType, parameters: IDLParameter[]): NamedMethodSignature {
        return NamedMethodSignature.make(
            this.mapCIDLType(returnType),
            parameters.map(it => ({ name: it.name, type: this.mapCIDLType(it.type!) }))
        )
    }
    writeNativeFunctionCall(printer: LanguageWriter, name: string, signature: MethodSignature) {
        printer.print(`return unsafe { ${name}(${signature.args.map((it, index) => `${signature.argName(index)}`).join(", ")}) }`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.print(`func ${name}(${signature.args.map((it, index) => `${this.escapeKeyword(signature.argName(index))}: ${it.nullable ? '?' : ''}${this.mapCType(it)}`).join(", ")}): ${this.mapCType(signature.returnType)}`)
    }
    override makeCastEnumToInt(convertor: EnumConvertorDTS, enumName: string, _unsafe?: boolean): string {
        return `${enumName}.getIntValue()`
    }
    override makeEnumCast(enumName: string, _unsafe: boolean, _convertor: EnumConvertor | undefined): string {
        // TODO: remove after switching to IDL
        return `${enumName}.getIntValue()`
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new CJAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.size`)
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType, varName: string): LanguageExpression {
        varName = this.escapeKeyword(varName)
        return this.makeString(`let Some(${varName}) <- ${varName}`)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new CJLambdaExpression(signature, body)
    }
    makeThrowError(message: string): LanguageStatement {
        throw new Error(`TBD`)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new ReturnStatement(expr)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CJLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new CJMapForEachStatement(map, key, value, op)
    }
    writePrintLog(message: string): void {
        this.print(`println("${message}")`)
    }
    makeCast(value: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new TSCastExpression(value, type, unsafe)
    }
    getObjectAccessor(convertor: BaseArgConvertor, value: string, args?: ObjectArgs): string {
        return `${value}`
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("Option.None")
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        return this.makeString(`${value}`)
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}.ordinal`)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        let methodCall = this.makeMethodCall("Ark_Object", "getRuntimeType", [this.makeString(value)])
        return this.makeString(methodCall.asString() + '.ordinal')
    }
    makeTupleAlloc(option: string): LanguageStatement {
        return new TsTupleAllocStatement(option)
    }
    makeObjectAlloc(object: string, fields: readonly FieldRecord[]): LanguageStatement {
        if (fields.length > 0) {
            return this.makeAssign(object, undefined,
                this.makeCast(this.makeString("{}"),
                    new Type(`{${fields.map(it=>`${it.name}: ${mapType(it.type)}`).join(",")}}`)),
                false)
        }
        return new TsObjectAssignStatement(object, undefined, false)
    }
    makeMapResize(keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        return this.makeAssign(map, undefined, this.makeString(`new Map<${keyType}, ${valueType}>()`), false)
    }
    makeMapKeyTypeName(c: MapConvertor): string {
        return c.keyConvertor.tsTypeName;
    }
    makeMapValueTypeName(c: MapConvertor): string {
        return c.valueConvertor.tsTypeName;
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // keyAccessor and valueAccessor are equal in TS
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeObjectDeclare(name: string, type: Type, fields: readonly FieldRecord[]): LanguageStatement {
        return new TsObjectDeclareStatement(name, type, fields)
    }
    getTagType(): Type {
        return new Type("Tags");
    }
    getRuntimeType(): Type {
        return new Type("number");
    }
    makeTupleAssign(receiver: string, fields: string[]): LanguageStatement {
        return this.makeAssign(receiver, undefined,
            this.makeString(`[${fields.map(it=> `${it}!`).join(",")}]`), false)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.STATIC]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.READONLY, FieldModifier.STATIC]
    }
    makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeMethodCall(value, "getSelector", []), false)
    }
    makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string, index?: number): LanguageExpression {
        return this.makeString(`${valueType} == ${index}`)
    }
    makeUnionVariantCast(value: string, type: Type, convertor: ArgConvertor, index: number) {
        return this.makeMethodCall(value, `getValue${index}`, [])
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error('Not yet implemented')
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error('Not yet implemented')
    }
    makeEnumEntity(enumEntity: EnumEntity, isExport: boolean): LanguageStatement {
        return new CJEnumEntityStatement(enumEntity, isExport)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, undefined,
            this.makeRuntimeTypeGetterCall(value), false))
    }
    makeSerializerCreator() {
        return this.makeString('createSerializer');
    }
    mapIDLContainerType(type: IDLContainerType, args: string[]): string {
        switch (type.name) {
            case 'sequence': return `ArrayList<${args[0]}>`
        }
        return super.mapIDLContainerType(type, args)
    }
    mapCIDLType(type:IDLType): string {
        if (isPrimitiveType(type)) {
            switch (type) {
                case IDLStringType: return 'CString'
            }
        }
        if (isContainerType(type)) {
            switch (type.name) {
                case 'sequence': return `CPointer<${this.mapCIDLType(type.elementType[0])}>`
            }
        }
        return this.mapIDLType(type)
    }
    mapIDLPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLPointerType: return 'Int64'
            case IDLVoidType: return 'Unit'
            case IDLBooleanType:  return 'Bool'
            case IDLI8Type: return 'Int8'
            case IDLU8Type: return 'UInt8'
            case IDLI16Type: return 'Int16'
            case IDLU16Type: return 'UInt16'
            case IDLI32Type: return 'Int32'
            case IDLU32Type: return 'UInt32'
            case IDLI64Type: return 'Int64'
            case IDLU64Type: return 'UInt64'
            case IDLF32Type: return 'Float32'
            case IDLF64Type: case IDLNumberType: return 'Float64'
            case IDLStringType: return 'String'
        }
        return super.mapIDLPrimitiveType(type)
    }
    mapType(type: Type): string {
        switch (type.name) {
            // Pointer
            case 'KPointer': return 'Int64'

            // Integral
            case 'boolean': case 'KBoolean': return 'Bool'
            case 'KUInt': return 'Int32' // ??
            case 'int32': case 'KInt': return 'Int32'
            case 'KLong': return 'Int64'

            // Number
            case 'number': return 'Float64'
            case 'double': return 'Float64'
            case 'KFloat': return 'Float32'

            // Array like
            case 'Uint8Array': return 'ArrayList<UInt8>'
            case 'KUint8ArrayPtr': return 'ArrayList<UInt8>'
            case 'KInt32ArrayPtr': return 'ArrayList<Int32>'
            case 'KFloat32ArrayPtr': return 'ArrayList<Float32>'

            // String like
            case 'KStringPtr': case 'String': case 'string': return 'String'

            // void
            case 'void': return 'Unit'
            case 'Void': return 'Unit'

            //  Other
            case 'Length': return 'String'
        }
        return super.mapType(type)
    }
    mapCType(type: Type): string {
        switch (type.name) {
            // Pointer
            case 'KPointer': return 'Int64'

            // Integral
            case 'boolean': return 'Bool'
            case 'KBoolean': return 'Bool'
            case 'KUInt': return 'Int32' // ??
            case 'int32': case 'KInt': return 'Int32'
            case 'KLong': return 'Int64'

            // Number
            case 'number': return 'Float64'
            case 'double': return 'Float64'
            case 'KFloat': return 'Float32'

            // Array like
            case 'Uint8Array': return 'CPointer<UInt8>'
            case 'KUint8ArrayPtr': return 'CPointer<UInt8>'
            case 'KInt32ArrayPtr': return 'CPointer<Int32>'
            case 'KFloat32ArrayPtr': return 'CPointer<Float32>'

            // String like
            case 'KStringPtr': return 'CString'
            case 'string': return 'CString'
            case 'String': return 'CString'

            // void
            case 'void': return 'Unit'

            //  Other
            case 'Length': return 'CString'
        }
        return super.mapType(type)
    }
    escapeKeyword(word: string): string {
        return CJKeywords.has(word) ? word + "_" : word
    }
    override castToInt(value: string, bitness: 8|32): string {
        return `Int${bitness}(${value})`
    }
    override castToBoolean(value: string): string {
        return `if (${value}) { Int32(1) } else { Int32(0) }`
    }
}
