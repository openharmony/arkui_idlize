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

export class Type {
    constructor(public name: string, public nullable = false) {}
    static Int32 = new Type('int32')
    static Number = new Type('number')
    static Pointer = new Type('KPointer')
    static This = new Type('this')
    static Void = new Type('void')
}

export enum MethodModifier {
    PUBLIC,
    STATIC
}

export interface LanguageStatement {
    write(writer: LanguageWriter): void
}

export interface LanguageExpression {
    asString(): string
}

export class AssignStatement implements LanguageStatement {
    constructor(public variableName: string, public type: Type | undefined, public expression: LanguageExpression, public isDeclared: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeSpec = this.type ? `: ${writer.mapType(this.type)}` : ""
            writer.print(`const ${this.variableName}${typeSpec} = ${this.expression.asString()}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()}`)
        }
    }
}

export class JavaAssignStatement extends AssignStatement {
    constructor(public variableName: string, public type: Type | undefined, public expression: LanguageExpression, public isDeclared: boolean = true) {
        super(variableName, type, expression)
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
    constructor(public variableName: string, public type: Type | undefined, public expression: LanguageExpression, public isDeclared: boolean = true) { }
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
    constructor(public variableName: string, public type: Type | undefined, public expression: LanguageExpression, public isDeclared: boolean = true) {
        super(variableName, type, expression)
     }
     write(writer: LanguageWriter): void{
        if (this.isDeclared) {
            const typeSpec = this.type ? writer.mapType(this.type) : "auto"
            writer.print(`${typeSpec} ${this.variableName} = ${this.expression.asString()};`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()};`)
        }
    }
}

export class CheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return this.value
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
        writer.print(`${this.expression.asString()};`)
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

export class JavaReturnStatement extends ReturnStatement {
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
        return this.unsafe
            ? `reinterpret_cast<${this.type.name}>(${this.value.asString()})`
            : `(${this.type.name})(${this.value.asString()})`
    }
}

/*
export class ConditionStatement implements LanguageExpression {
    constructor(public condition: LanguageStatement,
        public trueStatement: LanguageStatement,
        public falseStatement: LanguageStatement | undefined,
        public ternary = false) { }
    asString(): string {
        if (this.ternary) {
            return `(${this.condition.asString()}) ? ${this.trueStatement.asString()} : ${this.falseStatement?.asString()}`
        }
        const elseStatement = this.falseStatement === undefined ? "" : ` else { ${this.falseStatement.asString()} }`
        return `if (${this.condition.asString()}) ${this.trueStatement.asString()}${elseStatement}`
    }
}
*/

class TSLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (let ${this.counter} = 0; ${this.counter} < ${this.limit}; ${this.counter}++) {`)
    }
}

class CLikeLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (int ${this.counter} = 0; ${this.counter} < ${this.limit}; ${this.counter}++) {`)
    }
}

class TSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (const [${this.key}, ${this.value}] of ${this.map}) {`)
    }
}

class JavaMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string) {}
    write(writer: LanguageWriter): void {
        const entryVar = `${this.map}Entry`
        writer.print(`for (Map.Entry<?, ?> ${entryVar}: ${this.map}.entrySet()) {`)
        writer.pushIndent()
        writer.print(`var ${this.key} = ${entryVar}.getKey();`)
        writer.print(`var ${this.value} = ${entryVar}.getValue();`)
        writer.popIndent()
    }
}

class CppMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (auto const& [${this.key}, ${this.value}] : ${this.map}) {`)
    }
}

class CppArrayResizeStatement implements LanguageStatement {
    constructor(private elementType: string, private array: string, private length: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeArray<Array_${this.elementType}, ${this.elementType}>(&${this.array}, ${this.length});`)
    }
}

class CppMapResizeStatement implements LanguageStatement {
    constructor(private keyType: string, private valueType: string, private map: string, private size: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeMap<Map_${this.keyType}_${this.valueType}, ${this.keyType}, ${this.valueType}>(&${this.map}, ${this.size});`)
    }
}

export class BlockStatement implements LanguageStatement {
    constructor(public statements: LanguageStatement[]) { }
    write(writer: LanguageWriter): void {
        writer.print("{")
        writer.pushIndent()
        this.statements.forEach(s => s.write(writer))
        writer.popIndent()
        writer.print("}")
    }
}

export class IfStatement implements LanguageStatement {
    constructor(public condition: LanguageExpression,
        public thenStatement: LanguageStatement,
        public elseStatement: LanguageStatement | undefined) { }
    write(writer: LanguageWriter): void {
        writer.print(`if (${this.condition.asString()})`)
        this.thenStatement.write(writer)
        if (this.elseStatement!== undefined) {
            writer.print(" else ")
            this.elseStatement.write(writer)
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
    constructor(returnType: Type, args: Type[], public argsNames: string[], defaults: stringOrNone[]|undefined = undefined) {
        super(returnType, args, defaults)
    }

    static make(returnType: string, args: {name: string, type: string}[]): NamedMethodSignature {
        return new NamedMethodSignature(new Type(returnType), args.map(it => new Type(it.type)), args.map(it => it.name))
    }

    argName(index: number): string {
        return this.argsNames[index]
    }
}

export class Method {
    constructor(public name: string, public signature: MethodSignature, public modifiers: MethodModifier[]|undefined = undefined) {}
}

export function mangleMethodName(method: Method): string {
    const argsPostfix = method.signature.args.map(it => {
        return Array.from(it.name).filter(it => it.match(/[a-zA-Z]/)).join("")
    }).join("_")
    return `${method.name}_${argsPostfix}`
}

export abstract class LanguageWriter {
    constructor(public printer: IndentedPrinter, public language: Language) {}

    abstract writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[]): void
    abstract writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void

    abstract writeFieldDeclaration(name: string, type: Type, modifiers: string[]|undefined, optional: boolean): void

    abstract writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string): void

    abstract writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void): void
    abstract writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void): void

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

    makeFunctionCall(name: string, params: LanguageExpression[]): LanguageExpression {
        return new FunctionCallExpression(name, params)
    }
    makeMethodCall(receiver: string, method: string, params: LanguageExpression[], nullable?: boolean): LanguageExpression {
        return new MethodCallExpression(receiver, method, params, nullable)
    }
    abstract makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression, isDeclared: boolean): LanguageStatement;
    abstract makeReturn(expr?: LanguageExpression): LanguageStatement;
    makeDefinedCheck(value: string): LanguageExpression {
        return new CheckDefinedExpression(value)
    }
    makeCondition(condition: LanguageExpression, thenStatement: LanguageStatement, elseStatement?: LanguageStatement): LanguageStatement {
        return new IfStatement(condition, thenStatement, elseStatement)
    }
    makeTernary(condition: LanguageExpression, trueExpression: LanguageExpression, falseExpression: LanguageExpression): LanguageExpression {
        return new TernaryExpression(condition, trueExpression, falseExpression)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return new StringExpression(`${array}.length`)
    }
    abstract makeLoop(counter: string, limit: string): LanguageStatement
    abstract makeMapForEach(map: string, key: string, value: string): LanguageStatement
    makeArrayResize(elementType: string, array: string, length: string, deserializer: string): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    makeMapResize(keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        throw new Error("Method not implemented.")
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
    abstract makeCast(value: LanguageExpression, type: Type): LanguageExpression
    abstract makeCast(value: LanguageExpression, type: Type, unsafe: boolean): LanguageExpression
    abstract writePrintLog(message: string): void
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
}

export class TSLanguageWriter extends LanguageWriter {
    constructor(printer: IndentedPrinter, language: Language = Language.TS) {
        super(printer, language)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[]): void {
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        this.printer.print(`export class ${name}${extendsClause}${implementsClause} {`)
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
    writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string): void {
        this.writeDeclaration(name, signature, true, false, prefix)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration('constructor', signature, false, true)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)

    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, true, true, method.modifiers?.includes(MethodModifier.STATIC) ? "static " : "")
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    private writeDeclaration(name: string, signature: MethodSignature, needReturn: boolean, needBracket: boolean, prefix?: string) {
        this.printer.print(`${prefix ?? ""}${name}(${signature.args.map((it, index) => `${signature.argName(index)}${it.nullable ? "?" : ""}: ${this.mapType(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.mapType(signature.returnType) : ""} ${needBracket ? "{" : ""}`)
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression, isDeclared: boolean = true): LanguageStatement {
        return new AssignStatement(variableName, type, expr, isDeclared)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new TSReturnStatement(expr)
    }
    makeLoop(counter: string, limit: string): LanguageStatement {
        return new TSLoopStatement(counter, limit)
    }
    makeMapForEach(map: string, key: string, value: string): LanguageStatement {
        return new TSMapForEachStatement(map, key, value)
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
}

export class ETSLanguageWriter extends TSLanguageWriter {
    constructor(printer: IndentedPrinter) {
        super(printer, Language.ARKTS)
    }

    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, "static native ")
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression, isDeclared: boolean = true): LanguageStatement {
        return new EtsAssignStatement(variableName, type, expr, isDeclared)
    }

    mapType(type: Type): string {
        switch (type.name) {
            case 'KPointer': return 'long'
            case 'Uint8Array': return 'byte[]'
            case 'int32': case 'KInt': return 'int'
            case 'KStringPtr': return 'String'
            case 'number': return 'double'
        }
        return super.mapType(type)
    }
}

export class JavaLanguageWriter extends LanguageWriter {
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
            this.printer.print(`${receiver}.${method}(${params.join(", ")});`)
        }
    }
    writeFieldDeclaration(name: string, type: Type, modifiers: string[]|undefined, optional: boolean): void {
        this.printer.print(`${modifiers?.join(' ') ?? ""}  ${type.name} ${name}${optional ? " = null"  : ""};`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string): void {
        this.printer.print(`${prefix ?? ""}${this.mapType(signature.returnType)} ${name}(${signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ")});`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, "static native ")
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void) {
        this.printer.print(`${className}(${signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ")}) {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.printer.print(`${this.mapType(method.signature.returnType)} ${method.name}(${method.signature.args.map((it, index) => `${this.mapType(it)} ${method.signature.argName(index)}`).join(", ")}) {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    makeAssign(variableName: string, type: Type, expr: LanguageExpression, isDeclared: boolean = true): LanguageStatement {
        return new JavaAssignStatement(variableName, type, expr, isDeclared)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new JavaReturnStatement(expr)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new JavaCheckDefinedExpression(value)
    }
    makeLoop(counter: string, limit: string): LanguageStatement {
        return new CLikeLoopStatement(counter, limit)
    }
    makeMapForEach(map: string, key: string, value: string): LanguageStatement {
        return new JavaMapForEachStatement(map, key, value)
    }
    makeCast(value: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new JavaCastExpression(value, type, unsafe)
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
}

export class CppLanguageWriter extends LanguageWriter {
    constructor(printer: IndentedPrinter) {
        super(printer, Language.CPP)
    }
    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string | undefined, interfaces?: string[] | undefined): void {
        throw new Error("Method not implemented.")
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[] | undefined): void {
        throw new Error("Method not implemented.")
    }
    writeFieldDeclaration(name: string, type: Type, modifiers: string[] | undefined, optional: boolean): void {
        throw new Error("Method not implemented.")
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string | undefined): void {
        throw new Error("Method not implemented.")
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void): void {
        throw new Error("Method not implemented.")
    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void): void {
        throw new Error("Method not implemented.")
    }
    makeAssign(variableName: string, type: Type, expr: LanguageExpression, isDeclared: boolean = true): LanguageStatement {
        return new CppAssignStatement(variableName, type, expr, isDeclared)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    makeArrayLength(array: string, length: string): LanguageExpression {
        return new StringExpression(length)
    }
    makeLoop(counter: string, limit: string): LanguageStatement {
        return new CLikeLoopStatement(counter, limit)
    }
    makeMapForEach(map: string, key: string, value: string): LanguageStatement {
        return new CppMapForEachStatement(map, key, value)
    }
    makeArrayResize(elementType: string, array: string, length: string, deserializer: string): LanguageStatement {
        return new CppArrayResizeStatement(elementType, array, length, deserializer)
    }
    makeMapResize(keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        return new CppMapResizeStatement(keyType, valueType, map, size, deserializer)
    }
    makeCast(expr: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new CppCastExpression(expr, type, unsafe)
    }
    writePrintLog(message: string): void {
        throw new Error("Method not implemented.")
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
        }
        return super.mapType(type)
    }
}

export function createLanguageWriter(printer: IndentedPrinter, language: Language): LanguageWriter {
    switch (language) {
        case Language.TS: return new TSLanguageWriter(printer)
        case Language.ARKTS: return new ETSLanguageWriter(printer)
        case Language.JAVA: return new JavaLanguageWriter(printer)
        case Language.CPP: return new CppLanguageWriter(printer)
        default: throw new Error(`Language ${Language[language]} is not supported`)
    }
}