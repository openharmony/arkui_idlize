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
    static Void = new Type('void')
    static This = new Type('this')
}

export enum MethodModifier {
    PUBLIC,
    STATIC
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

    writeMemberCall(receiver: string, method: string, params: string[], nullable = false): void {
        this.printer.print(`${receiver}${nullable ? "?" : ""}.${method}(${params.join(", ")})`)
    }

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

    writePrintLog(message: string): void {
        this.print(`console.log("${message}")`)
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

    writeMemberCall(receiver: string, method: string, params: string[], nullable = false): void {
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

export function createLanguageWriter(printer: IndentedPrinter, language: Language): LanguageWriter {
    switch (language) {
        case Language.TS: return new TSLanguageWriter(printer)
        case Language.ARKTS: return new ETSLanguageWriter(printer)
        case Language.JAVA: return new JavaLanguageWriter(printer)
        default: throw new Error(`Language ${Language[language]} is not supported`)
    }
}