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
import { IndentedPrinter } from "../../IndentedPrinter"
import { stringOrNone } from "../../util"
import { EnumConvertor as EnumConvertorDTS, MapConvertor } from "../Convertors"
import { ArgConvertor, RuntimeType } from "../ArgConvertors"
import { FieldRecord } from "../DeclarationTable"
import { EnumEntity } from "../PeerFile"
import * as fs from "fs"
import { Language } from "../../Language"
import { EnumConvertor } from "../idl/IdlArgConvertors"
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary"
import { PeerLibrary } from "../PeerLibrary"
import { ReferenceResolver } from "../ReferenceResolver"
import { convertType, IdlTypeNameConvertor } from "./typeConvertor"

// static Int32 = new Type('int32')
// static Boolean = new Type('boolean')
// static Number = new Type('number')
// static Pointer = new Type('KPointer')
// static This = new Type('this')
// static Void = new Type('void')
// static String = new Type('string')

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export interface LanguageExpression {
    asString(): string
}

export class TernaryExpression implements LanguageExpression {
    constructor(public condition: LanguageExpression,
        public trueExpression: LanguageExpression,
        public falseExpression: LanguageExpression) {}
    asString(): string {
        return `(${this.condition.asString()}) ? (${this.trueExpression.asString()}) : (${this.falseExpression.asString()})`
    }
}

export class NaryOpExpression implements LanguageExpression {
    constructor(public op: string, public args: LanguageExpression[]) { }
    asString(): string {
        return `${this.args.map(arg => `(${arg.asString()})`).join(` ${this.op} `)}`
    }
}

export class StringExpression implements LanguageExpression {
    constructor(public value: string) { }
    asString(): string {
        return this.value
    }
}

export class NewObjectExpression implements LanguageExpression {
    constructor(
        private objectName: string,
        private params: LanguageExpression[]) { }
    asString(): string {
        return `new ${this.objectName}(${this.params.map(it => it.asString()).join(", ")})`
    }
}

export class FunctionCallExpression implements LanguageExpression {
    constructor(
        private name: string,
        private params: LanguageExpression[]) { }
    asString(): string {
        return `${this.name}(${this.params.map(it => it.asString()).join(", ")})`
    }
}

export class MethodCallExpression extends FunctionCallExpression {
    constructor(
        public receiver: string,
        method: string,
        params: LanguageExpression[],
        public nullable = false)
    {
        super(method, params)
    }
    asString(): string {
        return `${this.receiver}${this.nullable ? "?" : ""}.${super.asString()}`
    }
}

export class CheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != "undefined"`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export interface LanguageStatement {
    write(writer: LanguageWriter): void
}

export class ProxyStatement implements LanguageStatement {
    constructor(private cb: (writer: LanguageWriter) => void) {}

    write(writer: LanguageWriter): void {
        this.cb(writer)
    }
}

export class AssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: idl.IDLType | undefined,
                public expression: LanguageExpression | undefined,
                public isDeclared: boolean = true,
                protected isConst: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeSpec = this.type ? `: ${writer.convert(this.type)}${/*SHOULD BE REMOVED*/idl.isOptionalType(this.type) ? "|undefined" : ""}` : ""
            const initValue = this.expression ? `= ${this.expression.asString()}` : ""
            const constSpec = this.isConst ? "const" : "let"
            writer.print(`${constSpec} ${this.variableName}${typeSpec} ${initValue}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression?.asString()}`)
        }
    }
}

export class ExpressionStatement implements LanguageStatement {
    constructor(public expression: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        const text = this.expression.asString()
        if (text.length > 0) {
            writer.print(`${this.expression.asString()};`)
        }
    }
}

export class BlockStatement implements LanguageStatement {
    constructor(public statements: LanguageStatement[], private inScope: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.inScope) {
            writer.print("{")
            writer.pushIndent()
        }
        this.statements.forEach(s => s.write(writer))
        if (this.inScope) {
            writer.popIndent()
            writer.print("}")
        }
    }
}

export class IfStatement implements LanguageStatement {
    constructor(public condition: LanguageExpression,
        public thenStatement: LanguageStatement,
        public elseStatement: LanguageStatement | undefined,
        public insideIfOp: (() => void) | undefined,
        public insideElseOp: (() => void) | undefined
    ) { }
    write(writer: LanguageWriter): void {
        writer.print(`if (${this.condition.asString()}) {`)
        writer.pushIndent()
        this.thenStatement.write(writer)
        if (this.insideIfOp) { this.insideIfOp!() }
        writer.popIndent()
        if (this.elseStatement !== undefined) {
            writer.print("} else {")
            writer.pushIndent()
            this.elseStatement.write(writer)
            if (this.insideElseOp) { this.insideElseOp!() }
            writer.popIndent()
            writer.print("}")
        } else {
            writer.print("}")
        }

    }
}

export type BranchStatement = {expr: LanguageExpression, stmt: LanguageStatement}

export class MultiBranchIfStatement implements LanguageStatement {
    constructor(private readonly statements: BranchStatement[],
                private readonly elseStatement: LanguageStatement | undefined) { }
    write(writer: LanguageWriter): void {
        this.statements.forEach((value, index) => {
            const {expr, stmt}= value
            if (index == 0) {
                writer.print(`if (${expr.asString()}) {`)
            } else {
                writer.print(`else if (${expr.asString()}) {`)
            }
            writer.pushIndent()
            stmt.write(writer)
            writer.popIndent()
            writer.print("}")
        })

        if (this.elseStatement !== undefined) {
            writer.print(" else {")
            writer.pushIndent()
            this.elseStatement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}

// maybe rename or move of fix
export class TsEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: EnumEntity, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        writer.print(this.enumEntity.comment.length > 0 ? this.enumEntity.comment : undefined)
        writer.print(`${this.isExport ? "export " : ""}enum ${this.enumEntity.name} {`)
        writer.pushIndent()
        this.enumEntity.members.forEach((member, index) => {
            writer.print(member.comment.length > 0 ? member.comment : undefined)
            const commaOp = index < this.enumEntity.members.length - 1 ? ',' : ''
            const initValue = member.initializerText ? ` = ${member.initializerText}` : ``
            writer.print(`${member.name}${initValue}${commaOp}`)
        })
        writer.popIndent()
        writer.print(`}`)
    }
}

export class ReturnStatement implements LanguageStatement {
    constructor(public expression?: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        writer.print(this.expression ? `return ${this.expression.asString()}` : "return")
    }
}

export abstract class LambdaExpression implements LanguageExpression {
    constructor(
        private originalWriter: LanguageWriter,
        protected signature: MethodSignature,
        private resolver: ReferenceResolver,
        private body?: LanguageStatement[]) { }

    protected abstract get statementHasSemicolon(): boolean
    abstract asString(): string

    bodyAsString(): string {
        const writer = this.originalWriter.fork()
        if (this.body) {
            for (const stmt of this.body) {
                stmt.write(writer)
            }
        }

        return writer.printer.getOutput()
            .map(line => line.trim())
            .filter(line => line !== "")
            .map(line => line === "{" || line === "}" || this.statementHasSemicolon ? line : `${line};`)
            .join(" ")
    }
}


////////////////////////////////////////////////////////////////
//                         SIGNATURES                         //
////////////////////////////////////////////////////////////////

export enum FieldModifier {
    READONLY,
    PRIVATE,
    PUBLIC,
    STATIC,
    PROTECTED,
    FINAL,
    VOLATILE,
    INTERNAL,
}

export enum MethodModifier {
    PUBLIC,
    PRIVATE,
    STATIC,
    NATIVE,
    INLINE,
    GETTER,
    SETTER,
    PROTECTED
}

export class Field {
    constructor(
        public name: string,
        public type: idl.IDLType,
        public modifiers: FieldModifier[] = []
    ) {}
}

export class Method {
    constructor(
        public name: string,
        public signature: MethodSignature,
        public modifiers: MethodModifier[]|undefined = undefined,
        public generics?: string[],
    ) {}
}

export class MethodSignature {
    constructor(public returnType: idl.IDLType, public args: idl.IDLType[], public defaults: stringOrNone[]|undefined = undefined) {}

    argName(index: number): string {
        return `arg${index}`
    }
    argDefault(index: number): string|undefined {
        return this.defaults?.[index]
    }

    toString(): string {
        return `${this.args.map(it => idl.forceAsNamedNode(it).name)} => ${this.returnType}`
    }
}

export class NamedMethodSignature extends MethodSignature {
    constructor(returnType: idl.IDLType, args: idl.IDLType[] = [], public argsNames: string[] = [], defaults: stringOrNone[]|undefined = undefined) {
        super(returnType, args, defaults)
    }

    static make(returnType: idl.IDLType, args: {name: string, type: idl.IDLType}[]): NamedMethodSignature {
        return new NamedMethodSignature(returnType, args.map(it => it.type), args.map(it => it.name))
    }

    argName(index: number): string {
        return this.argsNames[index]
    }
}

export interface ObjectArgs {
    [name: string]: string
}

export interface PrinterLike {
    getOutput(): string[]
}

////////////////////////////////////////////////////////////////
//                    LANGUAGE WRITER                         //
////////////////////////////////////////////////////////////////

export abstract class LanguageWriter implements IdlTypeNameConvertor {
    constructor(
        public printer: IndentedPrinter, 
        protected resolver: ReferenceResolver,
        public language: Language,
    ) {}

    nativeModuleAccessor = 'nativeModule'

    indentDepth(): number {
        return this.printer.indentDepth()
    }

    abstract writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[], isDeclared?: boolean): void
    abstract writeEnum(name: string, members: { name: string, stringId: string | undefined, numberId: number }[], op: (writer: LanguageWriter) => void): void
    abstract writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[], isDeclared?: boolean): void
    abstract writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void
    abstract writeFunctionDeclaration(name: string, signature: MethodSignature): void
    abstract writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: LanguageWriter) => void): void
    abstract writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void
    abstract writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]): void
    abstract writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void): void
    abstract writeProperty(propName: string, propType: idl.IDLType, mutable?: boolean, getterLambda?: (writer: LanguageWriter) => void, setterLambda?: (writer: LanguageWriter) => void): void
    abstract makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean, isConst?: boolean): LanguageStatement;
    abstract makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression;
    abstract makeThrowError(message: string): LanguageStatement;
    abstract makeReturn(expr?: LanguageExpression): LanguageStatement;
    abstract makeRuntimeType(rt: RuntimeType): LanguageExpression
    abstract getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string
    abstract makeCast(value: LanguageExpression, type: idl.IDLType): LanguageExpression
    abstract makeCast(value: LanguageExpression, type: idl.IDLType, unsafe: boolean): LanguageExpression
    abstract writePrintLog(message: string): void
    abstract makeUndefined(): LanguageExpression
    abstract makeMapKeyTypeName(c: MapConvertor): idl.IDLType
    abstract makeMapValueTypeName(c: MapConvertor): idl.IDLType
    abstract makeArrayInit(type: idl.IDLContainerType): LanguageExpression
    abstract makeMapInit(type: idl.IDLType): LanguageExpression
    abstract makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement
    abstract makeLoop(counter: string, limit: string): LanguageStatement
    abstract makeLoop(counter: string, limit: string, statement: LanguageStatement): LanguageStatement
    abstract makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement
    // No need for these two.
    abstract getTagType(): idl.IDLType
    abstract getRuntimeType(): idl.IDLType
    abstract makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement
    abstract get supportedModifiers(): MethodModifier[]
    abstract get supportedFieldModifiers(): FieldModifier[]
    abstract enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression
    abstract ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression
    abstract makeCastEnumToInt(convertor: EnumConvertorDTS, enumName: string, unsafe?: boolean): string // TODO: remove after switching to IDL
    abstract makeEnumCast(enumName: string, unsafe: boolean, convertor: EnumConvertor | undefined): string
    abstract convert(type: idl.IDLType | idl.IDLCallback): string
    abstract fork(): LanguageWriter

    makeType(type: idl.IDLType, nullable: boolean, receiver?: string): idl.IDLType {
        return idl.maybeOptional(type, nullable)
    }

    concat(other: PrinterLike): this {
        other.getOutput().forEach(it => this.print(it))
        return this
    }
    printTo(file: string): void {
        fs.writeFileSync(file, this.getOutput().join("\n"))
    }
    writeLines(lines: string): void {
        lines.split("\n").forEach(it => this.print(it))
    }
    writeGetterImplementation(method: Method, op: (writer: LanguageWriter) => void): void {
        this.writeMethodImplementation(new Method(method.name, method.signature, [MethodModifier.GETTER].concat(method.modifiers ?? [])), op)
    }
    writeSetterImplementation(method: Method, op: (writer: LanguageWriter) => void): void {
        this.writeMethodImplementation(new Method(method.name, method.signature, [MethodModifier.SETTER].concat(method.modifiers ?? [])), op)
    }
    writeSuperCall(params: string[]): void {
        this.printer.print(`super(${params.join(", ")});`)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        this.printer.print(`${receiver}${nullable ? "?" : ""}.${method}(${params.join(", ")})`)
    }
    writeStatement(stmt: LanguageStatement) {
        //this.printer.print(stmt.asString())
        stmt.write(this)
    }
    writeExpressionStatement(smth: LanguageExpression) {
        this.writeStatement(new ExpressionStatement(smth))
    }
    makeTag(tag: string): string {
        return "Tag." + tag
    }
    makeRef(type: idl.IDLType | string): idl.IDLType {
        if (typeof type === 'string') {
            return idl.createReferenceType(type)
        }
        return type
    }
    makeThis(): LanguageExpression {
        return new StringExpression("this")
    }
    makeNull(): LanguageExpression {
        return new StringExpression("null")
    }
    makeVoid(): LanguageExpression {
        return this.makeUndefined()
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType, varName?: string): LanguageExpression {
        const op = equals ? "==" : "!="
        return this.makeNaryOp(op, [this.makeRuntimeType(type), this.makeString(typeVarName)])
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        return this.makeString(`${value}!`)
    }
    makeNewObject(objectName: string, params: LanguageExpression[] = []): LanguageExpression {
        return new NewObjectExpression(objectName, params)
    }
    makeFunctionCall(name: string, params: LanguageExpression[]): LanguageExpression {
        return new FunctionCallExpression(name, params)
    }
    makeMethodCall(receiver: string, method: string, params: LanguageExpression[], nullable?: boolean): LanguageExpression {
        return new MethodCallExpression(receiver, method, params, nullable)
    }
    makeNativeCall(method: string, params: LanguageExpression[], nullable?: boolean): LanguageExpression {
        return new MethodCallExpression(this.nativeReceiver(), method, params, nullable)
    }
    makeBlock(statements: LanguageStatement[], inScope: boolean = true) {
        return new BlockStatement(statements, inScope)
    }
    nativeReceiver(): string {
        return this.nativeModuleAccessor + "()"
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CheckDefinedExpression(value)
    }
    makeRuntimeTypeDefinedCheck(runtimeType: string): LanguageExpression {
        return this.makeRuntimeTypeCondition(runtimeType, false, RuntimeType.UNDEFINED)
    }
    makeCondition(condition: LanguageExpression, thenStatement: LanguageStatement, elseStatement?: LanguageStatement, insideIfOp?: () => void, insideElseOp?: () => void): LanguageStatement {
        return new IfStatement(condition, thenStatement, elseStatement, insideIfOp, insideElseOp)
    }
    makeMultiBranchCondition(conditions: BranchStatement[], elseStatement?: LanguageStatement): LanguageStatement {
        return new MultiBranchIfStatement(conditions, elseStatement)
    }
    makeTernary(condition: LanguageExpression, trueExpression: LanguageExpression, falseExpression: LanguageExpression): LanguageExpression {
        return new TernaryExpression(condition, trueExpression, falseExpression)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.length`)
    }
    makeArrayAccess(value: string, indexVar: string) {
        return this.makeString(`${value}[${indexVar}]`)
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}[${index}]`)
    }
    makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeString(`runtimeType(${value})`), false)
    }
    makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string, index?: number): LanguageExpression {
        return this.makeString(`RuntimeType.${type.toUpperCase()} == ${valueType}`)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index?: number): LanguageExpression {
        return this.makeString(`unsafeCast<${type}>(${value})`)
    }
    makeUnionTypeDefaultInitializer() {
        return this.makeRuntimeType(RuntimeType.UNDEFINED)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        return this.makeFunctionCall("runtimeType", [ this.makeString(value) ])
    }
    makeArrayResize(array: string, length: string, deserializer: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression(""))
    }
    makeMapResize(mapTypeName: string, keyType: idl.IDLType, valueType: idl.IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression("// TODO: TS map resize"))
    }
    makeMapSize(map: string): LanguageExpression {
        return this.makeString(`${map}.size`)
    }
    makeTupleAlloc(option: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression(""))
    }
    makeObjectAlloc(object: string, fields: readonly FieldRecord[]): LanguageStatement {
        return new ExpressionStatement(new StringExpression(""))
    }
    makeSetUnionSelector(value: string, index: string): LanguageStatement {
        // empty expression
        return new ExpressionStatement(new StringExpression(""))
    }
    makeSetOptionTag(value: string, tag: LanguageExpression): LanguageStatement {
        // empty expression
        return new ExpressionStatement(new StringExpression(""))
    }
    makeString(value: string): LanguageExpression {
        return new StringExpression(value)
    }
    makeNaryOp(op: string, args: LanguageExpression[]): LanguageExpression {
        return new NaryOpExpression(op, args)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature, isNative?: boolean): void {
        this.writeMethodDeclaration(name, signature)
    }
    writeUnsafeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        return
    }
    pushIndent() {
        this.printer.pushIndent()
    }
    popIndent() {
        this.printer.popIndent()
    }
    print(string: stringOrNone) {
        this.printer.print(string)
    }
    getOutput(): string[] {
        return this.printer.getOutput()
    }
    makeSignature(returnType: idl.IDLType, parameters: idl.IDLParameter[]): MethodSignature {
        return new MethodSignature(returnType,
            parameters.map(it => it.type!))
    }
    makeNamedSignature(returnType: idl.IDLType, parameters: idl.IDLParameter[]): NamedMethodSignature {
        return NamedMethodSignature.make(
            returnType,
            parameters.map(it => ({ name: it.name, type: it.type! }))
        )
    }
    makeNativeMethodNamedSignature(returnType: idl.IDLType, parameters: idl.IDLParameter[]): NamedMethodSignature {
        return this.makeNamedSignature(returnType, parameters)
    }
    mapFieldModifier(modifier: FieldModifier): string {
        return `${FieldModifier[modifier].toLowerCase()}`
    }
    mapMethodModifier(modifier: MethodModifier): string {
        return `${MethodModifier[modifier].toLowerCase()}`
    }
    makeObjectDeclare(name: string, type: idl.IDLType | undefined, fields: readonly FieldRecord[]): LanguageStatement {
        return this.makeAssign(name, type, this.makeString("{}"), true, false)
    }
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        return `unsafeCast<int32>(${param})`
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, idl.IDLI32Type,
            this.makeFunctionCall("runtimeType", [this.makeString(value)]), false))
    }
    makeDiscriminatorFromFields(convertor: {targetType: (writer: LanguageWriter) => string}, value: string, accessors: string[]): LanguageExpression {
        return this.makeString(`(${this.makeNaryOp("||",
            accessors.map(it => this.makeString(`${value}!.hasOwnProperty("${it}")`))).asString()})`)
    }
    makeSerializerCreator() {
        return this.makeString('createSerializer');
    }
    makeCallIsResource(value: string): LanguageExpression {
        return this.makeString(`isResource(${value})`)
    }
    makeEnumEntity(enumEntity: EnumEntity, isExport: boolean): LanguageStatement {
        return new TsEnumEntityStatement(enumEntity, isExport)
    }
    makeFieldModifiersList(modifiers: FieldModifier[] | undefined, customFieldFilter?: (field :FieldModifier) => boolean) : string {
        let allowedModifiers = this.supportedFieldModifiers
        let modifierFilter = customFieldFilter ? customFieldFilter : function(field: FieldModifier) {
            return allowedModifiers.includes(field)
        }
        let prefix = modifiers
            ?.filter(modifierFilter)
            .map(it => this.mapFieldModifier(it)).join(" ")
        return prefix ? prefix : ""
    }
    escapeKeyword(keyword: string): string {
        return keyword
    }
    compareLiteral(expr: LanguageExpression, literal: string): LanguageExpression {
        return this.makeEquals([expr, this.makeString(`"${literal}"`)])
    }
    makeCastCustomObject(customName: string, _isGenericType: boolean): LanguageExpression {
        return this.makeString(customName)
    }
    makeHasOwnProperty(value: string,
                       _valueTypeName: string,
                       property: string,
                       propertyTypeName?: string): LanguageExpression {
        const expressions = [this.makeString(`${value}.hasOwnProperty("${property}")`)]
        if (propertyTypeName) {
            expressions.push(this.makeString(`isInstanceOf("${propertyTypeName}", ${value}.${property})`))
        }
        return this.makeNaryOp("&&", expressions)
    }
    discriminatorFromExpressions(value: string,
                                 runtimeType: RuntimeType,
                                 exprs: LanguageExpression[]): LanguageExpression {
        return this.makeNaryOp("&&", [
            this.makeNaryOp("==", [this.makeRuntimeType(runtimeType), this.makeString(`${value}_type`)]),
            ...exprs
        ])
    }
    arrayDiscriminatorFromTypeOrExpressions(value: string,
                                 checkedType: string,
                                 runtimeType: RuntimeType,
                                 exprs: LanguageExpression[]): LanguageExpression {
        return this.discriminatorFromExpressions(value, runtimeType, exprs)
    }
    makeDiscriminatorConvertor(convertor: EnumConvertorDTS | EnumConvertor, value: string, index: number): LanguageExpression {
        const ordinal = convertor.isStringEnum
            ? this.ordinalFromEnum(
                this.makeString(this.getObjectAccessor(convertor, value)),
                convertor.enumTypeName(this.language)
            )
            : this.makeUnionVariantCast(this.getObjectAccessor(convertor, value), this.convert(idl.IDLI32Type), convertor, index)
        const {low, high} = convertor.extremumOfOrdinals()
        return this.discriminatorFromExpressions(value, convertor.runtimeTypes[0], [
            this.makeNaryOp(">=", [ordinal, this.makeString(low!.toString())]),
            this.makeNaryOp("<=",  [ordinal, this.makeString(high!.toString())])
        ])
    }
    makeNot(expr: LanguageExpression): LanguageExpression {
        return this.makeString(`!${expr.asString()}`)
    }
    makeEquals(args: LanguageExpression[]): LanguageExpression {
        return this.makeNaryOp("===", args)
    }
    castToInt(value: string, bitness: 8|32): string{ return value }
    castToBoolean(value: string): string { return value }
    makeCallIsObject(value: string): LanguageExpression {
        return this.makeString(`typeof ${value} === "object"`)
    }
    makeCallIsArrayBuffer(value: string): LanguageExpression {
        return this.makeString(`${value} instanceof ArrayBuffer`)
    }
}

export function mangleMethodName(method: Method, id?: number): string {
    return `${method.name}${id ?? ""}`
}

export function printMethodDeclaration(printer: IndentedPrinter, retType: string, methodName: string, apiParameters: string[], postfix: string = "") {
    if (apiParameters.length > 1) {
        const methodTypeName = `${retType} ${methodName}`
        const indent = ` `.repeat(methodTypeName.length + 1)
        printer.print(`${methodTypeName}(${apiParameters[0]},`)
        for (let i = 1; i < apiParameters.length; i++) {
            printer.print(indent + apiParameters[i] + ((i === apiParameters.length - 1) ? `)${postfix}` : ","))
        }
    } else {
        const signature = `${retType} ${methodName}(${apiParameters.join(", ")})${postfix}`
        printer.print(signature)
    }
}

export function copyMethod(method: Method, overrides: {
    name?: string,
    signature?: MethodSignature,
    modifiers?: MethodModifier[],
    generics?: string[],
 }) {
    return new Method(
        overrides.name ?? method.name,
        overrides.signature ?? method.signature,
        overrides.modifiers ?? method.modifiers,
        overrides.generics ?? method.generics,
    )
}
