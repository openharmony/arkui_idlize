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

type Partial = { interface: string, methods: string[], properties: string[] }

export class IgnoreOptions {
    constructor(filePath?: string) {
        if (filePath === undefined) {
            return
        }
        const ignore = JSON5.parse(fs.readFileSync(filePath).toString()).ignore
        this.full = ignore?.full ?? []
        this.partial = ignore?.partial ?? []
    }

    private readonly full: string[] = []
    private readonly partial: Partial[] = []

    isIgnoredMethod(iface: string, method: string): boolean {
        return this.partial?.some(it => it.interface === iface && it.methods?.includes(method))
    }

    isIgnoredProperty(iface: string, name: string): boolean {
        return this.partial?.some(it => it.interface === iface && it.properties?.includes(name))
    }

    isIgnoredInterface(name: string): boolean {
        return this.full.includes(name)
    }
}

// TODO: remove when interfaces fixed!
export class IrHackOptions {
    private readonly irHack: string[] = []
    constructor(filePath?: string) {
        if (filePath === undefined) {
            return
        }
        const json = JSON5.parse(fs.readFileSync(filePath).toString())
        this.irHack = json?.irHack ?? []
    }
    isIrHackInterface(name: string): boolean {
        return this.irHack.includes(name)
    }
}