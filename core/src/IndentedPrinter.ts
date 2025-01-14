
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

import * as fs from "fs"
import { indentedBy, stringOrNone } from "./util"

export class IndentedPrinter {
    constructor (private output: string[] = []) {}
    private indent = 0

    print(value: stringOrNone): void {
        if (value != undefined) this.output.push(this.indented(value))
    }

    pushIndent(level: number = 1): void {
        this.indent += level
    }
    popIndent(level: number = 1): void {
        this.indent -= level
    }
    indentDepth(): number {
        return this.indent
    }

    append(printer: IndentedPrinter): void {
        this.output = [...this.output, ...printer.output]
    }

    private indented(input: string): string {
        return indentedBy(input, this.indent)
    }

    getOutput(): string[] {
        return this.output
    }

    printTo(file: string): void {
        fs.writeFileSync(file, this.getOutput().join("\n"))
    }

    withIndent(prints: (printer: IndentedPrinter) => void): void {
        this.pushIndent()
        prints(this)
        this.popIndent()
    }
}

export class IndentedPrinterWithHeader extends IndentedPrinter {
    header = new IndentedPrinter()
    body = new IndentedPrinter()

    constructor() {
        super()
    }

    print(value: stringOrNone) {
        this.body.print(value)
    }

    printHeader(value: stringOrNone) {
        this.header.print(value)
    }

    pushIndent() {
        this.body.pushIndent()
    }
    popIndent() {
        this.body.popIndent()
    }

    pushIndentHeader() {
        this.header.pushIndent()
    }
    popIndentHeader() {
        this.header.popIndent()
    }

    getOutput(): string[] {
        return this.header.getOutput().concat(this.body.getOutput())
    }
}