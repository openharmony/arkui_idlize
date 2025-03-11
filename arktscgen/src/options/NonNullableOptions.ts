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

type Interface = { name: string, methods: Method[] }
type Method = { name: string, types: string[] }

export class NonNullableOptions {
    constructor(filePath?: string) {
        if (filePath === undefined) {
            return
        }
        this.interfaces = JSON5.parse(fs.readFileSync(filePath).toString())?.nonNullable ?? []
    }

    private readonly interfaces: Interface[] = []

    isNonNullableParameter(iface: string, method: string, parameter: string): boolean {
        return this.isNonNullable(iface, method, parameter)
    }

    isNonNullableReturnType(iface: string, method: string): boolean {
        return this.isNonNullable(iface, method, `returnType`)
    }

    private isNonNullable(iface: string, method: string, type: string): boolean {
        return this.interfaces
            .find(it => it.name === iface)
            ?.methods
            ?.find(it => it.name === method)
            ?.types
            ?.find(it => it === type)
            !== undefined
    }
}
