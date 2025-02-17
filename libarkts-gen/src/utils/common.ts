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

import { Config } from "../Config"
import { throwException } from "@idlizer/core"

export function pascalToCamel(value: string) {
    return value.charAt(0).toLowerCase() + value.slice(1);
}

export function splitCreateOrUpdate(fullName: string): { createOrUpdate: string, rest: string } {
    let createOrUpdate: string
    let index: string
    if (fullName.startsWith(Config.createPrefix)) {
        createOrUpdate = Config.createPrefix
        index = fullName.slice(Config.createPrefix.length)
        return { createOrUpdate, rest: index }
    }
    if (fullName.startsWith(Config.updatePrefix)) {
        createOrUpdate = Config.updatePrefix
        index = fullName.slice(Config.updatePrefix.length)
        return { createOrUpdate, rest: index }
    }
    throwException(`method name doesn't start neither with ${Config.createPrefix} nor with ${Config.updatePrefix}`)
}