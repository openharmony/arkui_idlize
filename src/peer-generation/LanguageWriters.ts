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

import { IndentedPrinter } from "../IndentedPrinter";
import { Language, stringOrNone } from "../util";
import { ArrayConvertor, BaseArgConvertor, MapConvertor, OptionConvertor, TupleConvertor, UnionConvertor } from "./Convertors";
import { FieldRecord, PrimitiveType } from "./DeclarationTable";
import { RuntimeType } from "./PeerGeneratorVisitor";
import { mapType, TSTypeNodeNameConvertor } from "./TypeNodeNameConvertor";

import * as ts from "typescript"
import * as fs from "fs"
import { PeerFile } from "./PeerFile";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";

export class Type {
    constructor(public name: string, public nullable = false) {}
    static Int32 = new Type('int32')
    static Boolean = new Type('boolean')
    static Number = new Type('number')
    static Pointer = new Type('KPointer')
    static This = new Type('this')
    static Void = new Type('void')
}

export enum FieldModifier {
    READONLY,
}

export enum MethodModifier {
    PUBLIC,
    PRIVATE,
    STATIC,
    NATIVE,
    INLINE,
    GETTER,
    SETTER,
}

export interface LanguageStatement {
    write(writer: LanguageWriter): void
}

export interface LanguageExpression {
    asString(): string
}

export class AssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: Type | undefined,
                public expression: LanguageExpression | undefined,
                public isDeclared: boolean = true,
                protected isConst: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeSpec = this.type ? `: ${writer.mapType(this.type)}${this.type.nullable ? "|undefined" : ""}` : ""
            const initValue = this.expression ? `= ${this.expression.asString()}` : ""
            const constSpec = this.isConst ? "const" : "let"
            writer.print(`${constSpec} ${this.variableName}${typeSpec} ${initValue}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression?.asString()}`)
        }
    }
}

export class DeclareStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: Type,
                public expression: LanguageExpression | undefined = undefined) { }
    write(writer: LanguageWriter): void {
        const type = this.type ? `: ${this.type.name}` : ""
        if (this.expression) {
            writer.print(`const ${this.variableName}${type} = ${this.expression.asString()}`)
        } else {
            writer.print(`let ${this.variableName}${type}`)
        }
    }
}

export class JavaAssignStatement extends AssignStatement {
    constructor(public variableName: string,
                public type: Type | undefined,
                public expression: LanguageExpression,
                public isDeclared: boolean = true,
                protected isConst: boolean = true) {
        super(variableName, type, expression, isDeclared, isConst)
     }
     write(writer: LanguageWriter): void{
        if (this.isDeclared) {
            const typeSpec = this.type ? writer.mapType(this.type) : "var"
            writer.print(`${typeSpec} ${this.variableName} = ${this.expression.asString()};`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()};`)
        }
    }
}

export class EtsAssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: Type | undefined,
                public expression: LanguageExpression,
                public isDeclared: boolean = true,
                protected isConst: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeSpec = ""
            writer.print(`const ${this.variableName}${typeSpec} = ${this.expression.asString()}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()}`)
        }
    }
}

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

export class CDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != ARK_TAG_UNDEFINED`
    }
}

export class CheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != "undefined"`
    }
}

export class JavaCheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != null`
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

export class ExpressionStatement implements LanguageStatement {
    constructor(public expression: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        const text = this.expression.asString()
        if (text.length > 0) {
            writer.print(`${this.expression.asString()}`)
        }
    }
}

export class CLikeExpressionStatement extends ExpressionStatement {
    constructor(public expression: LanguageExpression) { super(expression) }
    write(writer: LanguageWriter): void {
        const text = this.expression.asString()
        if (text.length > 0) {
            writer.print(`${this.expression.asString()};`)
        }
    }
}

export class ReturnStatement implements LanguageStatement {
    constructor(public expression?: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        writer.print(this.expression ? `return ${this.expression.asString()}` : "return")
    }
}

export class TSReturnStatement extends ReturnStatement {
    constructor(public expression: LanguageExpression) { super(expression) }
}

export class CLikeReturnStatement extends ReturnStatement {
    constructor(public expression: LanguageExpression) { super(expression) }
    write(writer: LanguageWriter): void {
        writer.print(this.expression ? `return ${this.expression.asString()};` : "return;")
    }
}

export class TSCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: Type, private unsafe = false) {}
    asString(): string {
        return this.unsafe
            ? `unsafeCast<${this.type.name}>(${this.value.asString()})`
            : `(${this.value.asString()} as ${this.type.name})`
    }
}

export class JavaCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: Type, private unsafe = false) {}
    asString(): string {
        return `(${this.type.name})(${this.value.asString()})`
    }
}

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

class TSLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (let ${this.counter} = 0; ${this.counter} < ${this.limit}; ${this.counter}++) {`)
        if (this.statement) {
            writer.pushIndent()
            this.statement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}

class CLikeLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (int ${this.counter} = 0; ${this.counter} < ${this.limit}; ${this.counter}++) {`)
        if (this.statement) {
            writer.pushIndent()
            this.statement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}

class TSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (const [${this.key}, ${this.value}] of ${this.map}) {`)
        writer.pushIndent()
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

class ArkTSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`// TODO: map serialization not implemented`)
    }
}


class JavaMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        const entryVar = `${this.map}Entry`
        writer.print(`for (Map.Entry<?, ?> ${entryVar}: ${this.map}.entrySet()) {`)
        writer.pushIndent()
        writer.print(`var ${this.key} = ${entryVar}.getKey();`)
        writer.print(`var ${this.value} = ${entryVar}.getValue();`)
        this.op()
        writer.popIndent()
        writer.print(`}`)
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

class CppArrayResizeStatement implements LanguageStatement {
    constructor(private array: string, private length: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeArray<std::decay<decltype(${this.array})>::type,
        std::decay<decltype(*${this.array}.array)>::type>(&${this.array}, ${this.length});`)
    }
}

class CppMapResizeStatement implements LanguageStatement {
    constructor(private keyType: string, private valueType: string, private map: string, private size: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeMap<Map_${this.keyType}_${this.valueType}, ${this.keyType}, ${this.valueType}>(&${this.map}, ${this.size});`)
    }
}

class TsTupleAllocStatement implements LanguageStatement {
    constructor(private tuple: string) {}
    write(writer: LanguageWriter): void {
        writer.writeStatement(writer.makeAssign(this.tuple, undefined, writer.makeString("[]"), false, false))
    }
}

class TsObjectAssignStatement implements LanguageStatement {
    constructor(private object: string, private type: Type | undefined, private isDeclare: boolean) {}
    write(writer: LanguageWriter): void {
        writer.writeStatement(writer.makeAssign(this.object,
            this.type,
            writer.makeString(`{}`),
            this.isDeclare,
            false))
    }
}

class TsObjectDeclareStatement implements LanguageStatement {
    constructor(private object: string, private type: Type | undefined, private fields: readonly FieldRecord[]) {}
    write(writer: LanguageWriter): void {
        const nameConvertor = new TsObjectDeclareNodeNameConvertor()
        // Constructing a new type with all optional fields
        const objectType = new Type(`{${this.fields.map(it => {
            return `${it.name}?: ${nameConvertor.convert(it.type)}`
        }).join(",")}}`)
        new TsObjectAssignStatement(this.object, objectType, true).write(writer)
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
        public elseStatement: LanguageStatement | undefined) { }
    write(writer: LanguageWriter): void {
        writer.print(`if (${this.condition.asString()}) {`)
        writer.pushIndent()
        this.thenStatement.write(writer)
        writer.popIndent()
        if (this.elseStatement !== undefined) {
            writer.print("} else {")
            writer.pushIndent()
            this.elseStatement.write(writer)
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
        return `${this.args.map(arg => arg.asString()).join(` ${this.op} `)}`
    }
}

export class StringExpression implements LanguageExpression {
    constructor(public value: string) { }
    asString(): string {
        return this.value
    }
}

export class MethodSignature {
    constructor(public returnType: Type, public args: Type[], public defaults: stringOrNone[]|undefined = undefined) {}

    argName(index: number): string {
        return `arg${index}`
    }
    argDefault(index: number): string|undefined {
        return this.defaults?.[index]
    }
}

export class NamedMethodSignature extends MethodSignature {
    constructor(returnType: Type, args: Type[] = [], public argsNames: string[] = [], defaults: stringOrNone[]|undefined = undefined) {
        super(returnType, args, defaults)
    }

    static make(returnType: string, args: {name: string, type: string}[]): NamedMethodSignature {
        return new NamedMethodSignature(new Type(returnType), args.map(it => new Type(it.type)), args.map(it => it.name))
    }

    argName(index: number): string {
        return this.argsNames[index]
    }
}

export class Field {
    constructor(
        public name: string,
        public type: Type,
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

export function mangleMethodName(method: Method): string {
    const argsPostfix = method.signature.args.map(it => {
        return Array.from(it.name).filter(it => it.match(/[a-zA-Z]/)).join("")
    }).join("_")
    return `${method.name}_${argsPostfix}`
}

export interface ObjectArgs {
    [name: string]: string
}

export interface PrinterLike {
    getOutput(): string[]
}

export abstract class LanguageWriter {
    constructor(public printer: IndentedPrinter, public language: Language) {}

    indentDepth(): number {
        return this.printer.indentDepth()
    }

    abstract writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[]): void
    abstract writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void
    abstract writeFieldDeclaration(name: string, type: Type, modifiers: string[]|undefined, optional: boolean): void
    abstract writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void
    abstract writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method): void
    abstract writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void): void
    abstract makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression | undefined, isDeclared: boolean, isConst?: boolean): LanguageStatement;
    abstract makeReturn(expr?: LanguageExpression): LanguageStatement;
    abstract makeRuntimeType(rt: RuntimeType): LanguageExpression
    abstract getObjectAccessor(p: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): string
    abstract makeCast(value: LanguageExpression, type: Type): LanguageExpression
    abstract makeCast(value: LanguageExpression, type: Type, unsafe: boolean): LanguageExpression
    abstract writePrintLog(message: string): void
    abstract makeUndefined(): LanguageExpression
    abstract makeMapKeyTypeName(c: MapConvertor): string
    abstract makeMapValueTypeName(c: MapConvertor): string
    abstract makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement
    abstract makeLoop(counter: string, limit: string): LanguageStatement
    abstract makeLoop(counter: string, limit: string, statement: LanguageStatement): LanguageStatement
    abstract makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement
    abstract getTagType(): Type
    abstract getRuntimeType(): Type
    abstract makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement
    abstract get supportedModifiers(): MethodModifier[]
    abstract enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression
    abstract ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression

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
    makeTag(tag: string): string {
        return "Tag." + tag
    }
    makeRef(varName: string): string {
        return varName
    }
    makeThis(): LanguageExpression {
        return new StringExpression("this")
    }
    makeNull(): LanguageExpression {
        return new StringExpression("null")
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType): LanguageExpression {
        const op = equals ? "==" : "!="
        return this.makeNaryOp(op, [this.makeRuntimeType(type), this.makeString(typeVarName)])
    }
    makeValueFromOption(value: string): LanguageExpression {
        return this.makeString(`${value}!`)
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
    nativeReceiver(): string { return 'nativeModule()' }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CheckDefinedExpression(value)
    }
    makeRuntimeTypeDefinedCheck(runtimeType: string): LanguageExpression {
        return this.makeRuntimeTypeCondition(runtimeType, false, RuntimeType.UNDEFINED)
    }
    makeCondition(condition: LanguageExpression, thenStatement: LanguageStatement, elseStatement?: LanguageStatement): LanguageStatement {
        return new IfStatement(condition, thenStatement, elseStatement)
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
    makeUnionSelector(value: string): LanguageExpression {
        return this.makeString(`runtimeType(${value})`)
    }
    makeUnionVariantCondition(value: string, type: string, index?: number): LanguageExpression {
        return this.makeString(`RuntimeType.${type.toUpperCase()} == ${value}`)
    }
    makeUnionVariantCast(value: string, type: Type, index?: number): LanguageExpression {
        return this.makeString(`unsafeCast<${type.name}>(${value})`)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        return this.makeFunctionCall("runtimeType", [ this.makeString(value) ])
    }
    makeArrayResize(array: string, typeName: string, length: string, deserializer: string): LanguageStatement {
        return new ExpressionStatement(this.makeString(`${array} = [] as ${typeName}`))
    }
    makeMapResize(keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression("// TODO: TS map resize"))
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
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature)
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
    mapType(type: Type): string {
        return type.name
    }
    mapMethodModifier(modifier: MethodModifier): string {
        return `${MethodModifier[modifier].toLowerCase()}`
    }
    makeObjectDeclare(name: string, type: Type | undefined, fields: readonly FieldRecord[]): LanguageStatement {
        return this.makeAssign(name, type, this.makeString("{}"), true, false)
    }
    makeType(typeName: string, nullable: boolean, receiver?: string): Type {
        return new Type(typeName, nullable)
    }
}

export class TSLanguageWriter extends LanguageWriter {
    constructor(printer: IndentedPrinter, language: Language = Language.TS) {
        super(printer, language)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[]): void {
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        const genericsClause = generics ? `<${generics.join(", ")}>` : ''
        this.printer.print(`export class ${name}${genericsClause}${extendsClause}${implementsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void {
        let extendsClause = superInterfaces ? ` extends ${superInterfaces.join(",")}` : ''
        this.printer.print(`export interface ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeFieldDeclaration(name: string, type: Type, modifiers: string[]|undefined, optional: boolean): void {
        this.printer.print(`${modifiers?.join(' ') ?? ""} ${name}${optional ? "?"  : ""}: ${type.name}`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, true, false, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method) {
        this.writeDeclaration('constructor', signature, false, true)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)

    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, true, true, method.modifiers, method.generics)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    private writeDeclaration(name: string, signature: MethodSignature, needReturn: boolean, needBracket: boolean, modifiers?: MethodModifier[], generics?: string[]) {
        let prefix = modifiers
            ?.filter(it => this.supportedModifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        if (modifiers?.includes(MethodModifier.GETTER)) {
            prefix = `get ${prefix}`
        } else if (modifiers?.includes(MethodModifier.SETTER)) {
            prefix = `set ${prefix}`
            needReturn = false
        }
        prefix = prefix ? prefix + " " : ""
        const typeParams = generics ? `<${generics.join(", ")}>` : ""
        this.printer.print(`${prefix}${name}${typeParams}(${signature.args.map((it, index) => `${signature.argName(index)}${it.nullable ? "?" : ""}: ${this.mapType(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.mapType(signature.returnType) : ""} ${needBracket ? "{" : ""}`)
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new AssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new TSReturnStatement(expr)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new TSLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new TSMapForEachStatement(map, key, value, op)
    }
    writePrintLog(message: string): void {
        this.print(`console.log("${message}")`)
    }
    makeCast(value: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new TSCastExpression(value, type, unsafe)
    }
    mapType(type: Type): string {
        return `${type.name}`
    }
    getObjectAccessor(convertor: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): string {
        if (convertor instanceof OptionConvertor || convertor instanceof UnionConvertor) {
            return value
        }
        if (convertor instanceof ArrayConvertor && args?.index != undefined) {
            return `${value}${args.index}`
        }
        if (convertor instanceof ArrayConvertor) {
            return `${value}`
        }
        if (convertor instanceof TupleConvertor && args?.index != undefined) {
            return `${value}[${args.index}]`
        }
        if (convertor instanceof MapConvertor) {
            return `${value}`
        }
        if (convertor.useArray && args?.index != undefined) {
            return `${value}[${args.index}]`
        }
        return `${value}`
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("undefined")
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}`)
    }
    makeTupleAlloc(option: string): LanguageStatement {
        return new TsTupleAllocStatement(option)
    }
    makeObjectAlloc(object: string, fields: readonly FieldRecord[]): LanguageStatement {
        if (fields.length > 0) {
            return this.makeAssign(object, undefined,
                this.makeCast(this.makeString("{}"),
                    new Type(`{${fields.map(it=>`${it.name}: ${mapType(it.type, Language.TS)}`).join(",")}}`)),
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
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        return this.makeString(`Object.values(${enumType})[${value.asString()}]`);
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        return this.makeString(`Object.keys(${enumType}).indexOf(${this.makeCast(value, new Type('string')).asString()})`);
    }
}

export class ETSLanguageWriter extends TSLanguageWriter {
    constructor(printer: IndentedPrinter) {
        super(printer, Language.ARKTS)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new EtsAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new ArkTSMapForEachStatement(map, key, value, op)
    }
    mapType(type: Type): string {
        switch (type.name) {
            case 'KPointer': return 'long'
            case 'Uint8Array': return 'byte[]'
            case 'int32': case 'KInt': return 'int'
            case 'KStringPtr': return 'String'
            case 'KLength': return 'Object'
            case 'number': return 'double'
        }
        return super.mapType(type)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.NATIVE, MethodModifier.STATIC]
    }
    nativeReceiver(): string { return 'NativeModule' }
}

abstract class CLikeLanguageWriter extends LanguageWriter {
    protected constructor(printer: IndentedPrinter, language: Language) {
        super(printer, language)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        this.printer.print(`${receiver}.${method}(${params.join(", ")});`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, modifiers, ";")
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
        this.print(`${prefix}${this.mapType(signature.returnType)} ${name}(${signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ")})${postfix ?? ""}`)
    }
}

export class JavaLanguageWriter extends CLikeLanguageWriter {
    constructor(printer: IndentedPrinter) {
        super(printer, Language.JAVA)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[]): void {
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        this.printer.print(`class ${name}${extendsClause}${implementsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void {
        let extendsClause = superInterfaces ? ` extends ${superInterfaces.join(",")}` : ''
        this.printer.print(`interface ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        if (nullable) {
            this.printer.print(`if (${receiver} != null) ${receiver}.${method}(${params.join(", ")});`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }
    writeFieldDeclaration(name: string, type: Type, modifiers: string[]|undefined, optional: boolean): void {
        this.printer.print(`${modifiers?.join(' ') ?? ""}  ${type.name} ${name}${optional ? " = null"  : ""};`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method) {
        this.printer.print(`${className}(${signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ")}) {`)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")});`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    makeAssign(variableName: string, type: Type, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new JavaAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new CLikeReturnStatement(expr)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new JavaCheckDefinedExpression(value)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CLikeLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new JavaMapForEachStatement(map, key, value, op)
    }
    makeCast(value: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new JavaCastExpression(value, type, unsafe)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new CLikeExpressionStatement(expr)
    }
    makeUnionSelector(value: string): LanguageExpression {
        return this.makeMethodCall(value, "getSelector", [])
    }
    makeUnionVariantCondition(value: string, type: string, index: number): LanguageExpression {
        return this.makeString(`${value} == ${index}`)
    }
    makeUnionVariantCast(value: string, type: Type, index: number) {
        return this.makeMethodCall(value, `getValue${index}`, [])
    }
    writePrintLog(message: string): void {
        this.print(`System.out.println("${message}")`)
    }
    mapType(type: Type): string {
        switch (type.name) {
            case 'KPointer': return 'long'
            case 'Uint8Array': return 'byte[]'
            case 'int32': case 'KInt': return 'int'
            case 'KStringPtr': return 'String'
            case 'string': return 'String'
            case 'number': return 'double'
        }
        return super.mapType(type)
    }
    applyToObject(p: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    getObjectAccessor(convertor: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): string {
        throw new Error("Method not implemented.")
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("undefined")
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}`)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        const call = this.makeMethodCall(value, "getRuntimeType", []).asString()
        return this.makeString(`${call}.value`)
    }
    makeMapKeyTypeName(c: MapConvertor): string {
        throw new Error("Method not implemented.")
    }
    makeMapValueTypeName(c: MapConvertor): string {
        throw new Error("Method not implemented.")
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    getTagType(): Type {
        throw new Error("Method not implemented.")
    }
    getRuntimeType(): Type {
        throw new Error("Method not implemented.")
    }
    makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.STATIC, MethodModifier.NATIVE]
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    makeValueFromOption(value: string): LanguageExpression {
        return this.makeString(`${value}`)
    }
}

export class CppLanguageWriter extends CLikeLanguageWriter {
    constructor(printer: IndentedPrinter) {
        super(printer, Language.CPP)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[]): void {
        const superClasses = (superClass ? [superClass] : []).concat(interfaces ?? [])
        const extendsClause = superClasses ? ` : ${superClasses.map(c => `public ${c}`).join(", ")}` : ''
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
    writeFieldDeclaration(name: string, type: Type, modifiers: string[] | undefined, optional: boolean): void {
        const modifier = modifiers?.find(mod => mod !== "static")
        if (modifier) {
            this.printer.print(`${modifier}:`)
        }
        this.printer.pushIndent()
        this.printer.print(`${type.name} ${name};`)
        this.printer.popIndent()
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method) {
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
     * Writes `namespace <namespace> {` and adds extra indent
     * @param namespace Namespace to begin
     */
    pushNamespace(namespace: string) {
        this.print(`namespace ${namespace} {`)
        this.pushIndent()
    }

    /**
     * Writes closing brace of namespace block and removes one level of indent
     */
    popNamespace() {
        this.popIndent()
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
    override makeUnionSelector(value: string): LanguageExpression {
        return this.makeString(`${value}.selector`)
    }
    override makeUnionVariantCondition(value: string, type: string, index: number) {
        return this.makeString(`${value} == ${index}`)
    }
    override makeUnionVariantCast(value: string, type: Type, index: number) {
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
    makeMapResize(keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        return new CppMapResizeStatement(keyType, valueType, map, size, deserializer)
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
    mapType(type: Type): string {
        switch (type.name) {
            case 'KPointer': return 'void*'
            case 'Uint8Array': return 'byte[]'
            case 'int32':
            case 'KInt': return 'int32_t'
            case 'string':
            case 'KStringPtr': return 'Ark_String'
            case 'number': return 'Ark_Number'
            case 'boolean': return 'Ark_Boolean'
            case 'Function': return `Ark_Function`
            case 'Length': return 'Ark_Length'
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
    makeSetUnionSelector(value: string, index: string): LanguageStatement {
        return this.makeAssign(`${value}.selector`, undefined, this.makeString(index), false)
    }
    makeSetOptionTag(value: string, tag: LanguageExpression): LanguageStatement {
        return this.makeAssign(`${value}.tag`, undefined, tag, false)
    }
    getObjectAccessor(convertor: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): string {
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
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        return value;
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        return value;
    }
}

export function createLanguageWriter(language: Language): LanguageWriter {
    switch (language) {
        case Language.TS: return new TSLanguageWriter(new IndentedPrinter())
        case Language.ARKTS: return new ETSLanguageWriter(new IndentedPrinter())
        case Language.JAVA: return new JavaLanguageWriter(new IndentedPrinter())
        case Language.CPP: return new CppLanguageWriter(new IndentedPrinter())
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}

class TsObjectDeclareNodeNameConvertor extends TSTypeNodeNameConvertor {
    private useOptionalTypes = true

    override convertTuple(node: ts.TupleTypeNode): string {
        this.useOptionalTypes = false
        const name = super.convertTuple(node);
        this.useOptionalTypes = true
        return name
    }
    override convertOptional(node: ts.OptionalTypeNode): string {
        let name = super.convertOptional(node);
        if (!this.useOptionalTypes) {
            name = name.replace("?", "")
        }
        return name
    }
    override convertImport(_node: ts.ImportTypeNode): string {
        //TODO: to preventing an error IMPORT_* types were  not found
        return "object"
    }
    override convert(node: ts.Node | undefined): string {
        if (node) {
            return super.convert(node)
        }
        return "undefined";
    }
}