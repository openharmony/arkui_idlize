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

import { EOL } from "node:os"

export class TokenPrinter {
    private readonly tokens: string[][] = [[]]

    put(...chunks:string[]): this {
        this.tokens.at(-1)?.push(...chunks)
        return this
    }
    newline(): this {
        this.tokens.push([])
        return this
    }

    render(): string {
        return this.tokens.map(line => line.join('')).join(EOL)
    }
}

export class IndentPrinter extends TokenPrinter {

    constructor(
        private readonly tabLength = 2
    ) { super() }

    private tabSize = 0

    inc(): this {
        this.tabSize++
        return this
    }
    dec(): this {
        this.tabSize--
        return this
    }

    override newline(): this {
        super.newline()
        this.put(' '.repeat(this.tabSize * this.tabLength))
        return this
    }
}
