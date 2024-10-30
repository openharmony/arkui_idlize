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

import { IndentedPrinter } from "../../../IndentedPrinter"
import { Language } from "../../../Language"
import { ReferenceResolver } from "../../ReferenceResolver"
import { ExpressionStatement, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, ReturnStatement } from "../LanguageWriter"

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class CLikeReturnStatement extends ReturnStatement {
    constructor(public expression: LanguageExpression) { super(expression) }
    write(writer: LanguageWriter): void {
        writer.print(this.expression ? `return ${this.expression.asString()};` : "return;")
    }
}

export class CDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != ARK_TAG_UNDEFINED`
    }
}

export class CLikeLoopStatement implements LanguageStatement {
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

export class CLikeExpressionStatement extends ExpressionStatement {
    constructor(public expression: LanguageExpression) { super(expression) }
    write(writer: LanguageWriter): void {
        const text = this.expression.asString()
        if (text.length > 0) {
            writer.print(`${this.expression.asString()};`)
        }
    }
}

class CLikeThrowErrorStatement implements LanguageStatement {
    constructor(public message: string) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw new Error("${this.message}");`)
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export abstract class CLikeLanguageWriter extends LanguageWriter {
    protected constructor(printer: IndentedPrinter, resolver: ReferenceResolver, language: Language) {
        super(printer, resolver, language)
    }
    makeThrowError(message: string): LanguageStatement {
        return new CLikeThrowErrorStatement(message)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        this.printer.print(`${receiver}.${method}(${params.join(", ")});`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, modifiers, ";")
    }
    writeEnum(name: string, members: { name: string, stringId: string | undefined, numberId: number }[], op: (writer: LanguageWriter) => void): void {
        throw new Error("WriteEnum for C-family languages is not implemented")
    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, method.modifiers)
        this.printer.print(`{`)
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
        this.print(`${prefix}${this.convert(signature.returnType)} ${name}(${signature.args.map((it, index) => `${this.convert(it)} ${signature.argName(index)}`).join(", ")})${postfix ?? ""}`)
    }
}