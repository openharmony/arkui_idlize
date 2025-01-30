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

import JSON5 from "json5"
import * as fs from "node:fs"
import { throwException } from "@idlizer/core"

export class Options {
    constructor(filePath?: string) {
        if (filePath === undefined) {
            this.generateByDefault = true
            this.interfaces = []
            return
        }

        const json = JSON5.parse(fs.readFileSync(filePath).toString())
        if (json?.ignore !== undefined) {
            this.generateByDefault = true
        } else if (json?.generate !== undefined) {
            this.generateByDefault = false
        } else {
            throwException(`missing options.json section generate or ignore`)
        }
        const interfaces = json.ignore?.interfaces ?? json.generate?.interfaces ?? throwException(
            `missing options.json section generate.interfaces or ignore.interfaces`
        )

        this.interfaces = [
            ...Object.entries(interfaces).map(([name, methods]: [any, any]) => {
                if (Interface.isWhole(methods)) {
                    return this.generateByDefault
                        ? new Ignored(name)
                        : new Full(name)
                }
                return new Partial(
                    name,
                    new Map(
                        Object.values(methods)
                            .map((name: any) => [name, !this.generateByDefault])
                    )
                )
            })
        ]
    }

    private interfaces: Interface[]

    private readonly generateByDefault: boolean

    shouldEmitMethod(iface: string, method: string): boolean {
        const known = this.interfaces.find(it => it.name === iface)
        if (known === undefined) {
            return this.generateByDefault
        }
        if (known instanceof Ignored) {
            return false
        }
        if (known instanceof Full) {
            return true
        }
        if (known instanceof Partial) {
            return known.methods.get(method) ?? this.generateByDefault
        }

        throwException(`Unexpected kind of interface: ${known}`)
    }

    shouldEmitInterface(name: string): boolean {
        const known = this.interfaces.find(it => it.name === name)
        if (known === undefined) {
            return false
        }
        return !(known instanceof Ignored)
    }
}

abstract class Interface {
    constructor(
        public name: string
    ) {}

    static isWhole(methods: string[]): boolean {
        return methods.includes("*")
    }
}

class Ignored extends Interface {}

class Full extends Interface {}

class Partial extends Interface {
    constructor(
        public name: string,
        public methods: Map<string, boolean>,
    ) {
        super(name)
    }
}

