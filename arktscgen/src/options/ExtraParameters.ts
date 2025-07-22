/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import assert from "node:assert"
import * as fs from "node:fs"

type IParameter = {
    name: string,
    setter?: string,
    getter?: string
    optional?: boolean,
}

export class ExtraParameter implements IParameter {
    constructor(private param: IParameter) {
    }

    get name() { return this.param.name }
    get getter() { return this.param.getter }
    get setter() { return this.param.setter }
    get optional() { return this.param.optional ?? true}
}

export class ExtraParameters {
    constructor(filePath?: string) {
        if (filePath === undefined) {
            return
        }

        const parameters = JSON5.parse(fs.readFileSync(filePath).toString())
            ?.parameters ?? []
        for (const param of parameters) {
            if ('parameters' in param) {
                this.parameters.set(param.interface,
                    param.parameters.map((p: IParameter) => new ExtraParameter(p)))
            }
        }
    }

    hasParameters(iface: string): boolean {
        return this.parameters.has(iface)
    }

    getParameters(iface: string): ExtraParameter[] {
        return this.parameters.get(iface) ?? []
    }

    private readonly parameters = new Map<string, ExtraParameter[]>()
}
