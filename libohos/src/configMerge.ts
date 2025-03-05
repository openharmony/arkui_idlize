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

import { warn } from "@idlizer/core"

export function deepMergeConfig<T extends object>(defaults: T, custom: Partial<T>, parentKeys?: string[]): T {
    if (custom === undefined)
        return defaults
    const result = Object.assign({}, defaults)
    for (const key in custom) {
        if (Object.prototype.hasOwnProperty.call(custom, key)) {
            const defaultValue = result[key]
            const customValue = custom[key]
            const keys = parentKeys?.concat(key) ?? [key]
            if (Array.isArray(defaultValue)) {
                if (!Array.isArray(customValue))
                    throw new Error(`Merge ${keys.join(".")}. Expected Array, actual ${customValue}`)
                Object.assign(result, { [key]: customValue })
            } else if (defaultValue instanceof Map) {
                if (typeof customValue === 'object') {
                    Object.assign(result, { [key]: new Map(Object.entries(customValue as Object)) })
                } else if (customValue instanceof Map) {
                    Object.assign(result, { [key]: customValue })
                } else {
                    throw new Error(`Merge ${keys.join(".")}. Expected Map or Object, actual ${customValue}`)
                }
            } else if (typeof defaultValue === 'string') {
                if (typeof customValue === 'string') {
                    Object.assign(result, { [key]: customValue })
                } else if (typeof customValue === 'number') {
                    Object.assign(result, { [key]: customValue.toString() })
                } else {
                    throw new Error(`Merge ${keys.join(".")}. Expected string, actual ${customValue}`)
                }
            } else if (typeof defaultValue === 'number') {
                if (typeof customValue === 'number') {
                    Object.assign(result, { [key]: customValue })
                } else {
                    throw new Error(`Merge ${keys.join(".")}. Expected number, actual ${customValue}`)
                }
            } else if (typeof defaultValue === 'object') {
                if (typeof customValue === 'object') {
                    Object.assign(result, { [key]: deepMergeConfig(defaultValue as object, customValue as object, keys) })
                } else {
                    throw new Error(`Merge ${keys.join(".")}. Expected Object, actual ${customValue}`)
                }
            } else if (typeof defaultValue === 'boolean') {
                if (typeof customValue === 'boolean') {
                    Object.assign(result, { [key]: customValue })
                } else {
                    throw new Error(`Merge ${keys.join(".")}. Expected Boolean, actual ${customValue}`)
                }
            } else {
                if (typeof defaultValue === 'undefined') {
                    warn(`Merge ${keys.join(".")}. Key ${key} is not found in template. Skip ${key}.`)
                } else {
                    throw new Error(`Merge ${keys.join(".")}. Unknown default value type, can not merge`)
                }
            }
        }
    }
    return result
}