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

function mergeJSON(a: unknown, b: unknown): unknown {
    if (a === undefined && b !== undefined) {
        return b
    }
    if (b === undefined && a !== undefined) {
        return a
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.concat(b)
    }
    if (typeof a === 'object' && typeof b === 'object') {
        if (a !== null && b !== null) {
            const aObj = a as any
            const bObj = b as any
            const result: any = {}
            for (const key in a) {
                if (key in b) {
                    result[key] = mergeJSON(aObj[key], bObj[key])
                } else {
                    result[key] = aObj[key]
                }
            }
            for (const key in b) {
                if (key in a) {
                    result[key] = mergeJSON(aObj[key], bObj[key])
                } else {
                    result[key] = bObj[key]
                }
            }
            return result
        }
    }
    return b
}

export function mergeJSONs(objects: unknown[]): unknown {
    let result = undefined
    for (const obj of objects) {
        result = mergeJSON(result, obj)
    }
    return result
}
