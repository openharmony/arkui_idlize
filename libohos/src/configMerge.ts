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

function isObject(i: any): i is object {
    if (typeof i !== 'object')
        return false
    if (Array.isArray(i))
        return false
    return true
}

export function deepMergeConfig<T extends object>(defaults: T, custom: Partial<T>): T {
    if (custom === undefined)
        return defaults
    const result = Object.assign({}, defaults)
    for (const key in custom) {
        if (Object.prototype.hasOwnProperty.call(custom, key)) {
            const defaultValue = result[key]
            const customValue = custom[key]
            if (isObject(defaultValue) && isObject(customValue)) {
                Object.assign(result, { [key]: deepMergeConfig(defaultValue, customValue) })
            } else {
                if (isObject(defaultValue))
                    throw new Error("Replacing default object value with custom non-object")
                Object.assign(result, { [key]: customValue })
            }
        }
    }
    return result
}