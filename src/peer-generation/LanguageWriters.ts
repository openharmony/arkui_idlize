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
    constructor(public name: string) {}
}

export class MethodSignature {
    constructor(public returnType: Type, public args: Type[]) {}

    argName(index: number): string {
        return `arg${index}`
    }
}

export class NamedMethodSignature extends MethodSignature {
    constructor(returnType: Type, args: Type[], public argsNames: string[]) {
        super(returnType, args)
    }

    static make(returnType: string, args: {name: string, type: string}[]): NamedMethodSignature {
        return new NamedMethodSignature(new Type(returnType), args.map(it => new Type(it.type)), args.map(it => it.name) )
    }

    argName(index: number): string {
        return this.argsNames[index]
    }
}

export abstract class LanguageWriter {
    constructor(protected printer: IndentedPrinter, public language: Language) {}

    abstract writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string): void

    abstract writeMethodImplementation(name: string, signature: MethodSignature, op: (writer: LanguageWriter) => void): void

    abstract printLog(message: string): void

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

    writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string): void {
        this.printer.print(`${prefix ?? ""}${name}(${signature.args.map((it, index) => `${signature.argName(index)}: ${this.mapType(it)}`).join(", ")}): ${this.mapType(signature.returnType)}`)
    }

    writeMethodImplementation(name: string, signature: MethodSignature, op: (writer: LanguageWriter) => void) {
        this.printer.print(`${name}(${signature.args.map((it, index) => `${signature.argName(index)}: ${this.mapType(it)}`).join(", ")}): ${this.mapType(signature.returnType)} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }

    printLog(message: string): void {
        this.print(`console.log("${message}")`)
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
        }
        return super.mapType(type)
    }
}

export class JavaLanguageWriter extends LanguageWriter {
    constructor(printer: IndentedPrinter, language: Language = Language.TS) {
        super(printer, language)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, prefix?: string): void {
        this.printer.print(`${prefix ?? ""}${this.mapType(signature.returnType)} ${name}(${signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ")});`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, "static native ")
    }

    writeMethodImplementation(name: string, signature: MethodSignature, op: (writer: LanguageWriter) => void) {
        this.printer.print(`${this.mapType(signature.returnType)} ${name}(${signature.args.map((it, index) => `${this.mapType(it)} ${signature.argName(index)}`).join(", ")});`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }

    printLog(message: string): void {
        this.print(`System.out.println("${message}")`)
    }

    mapType(type: Type): string {
        switch (type.name) {
            case 'KPointer': return 'long'
            case 'Uint8Array': return 'byte[]'
            case 'int32': case 'KInt': return 'int'
            case 'KStringPtr': return 'String'
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