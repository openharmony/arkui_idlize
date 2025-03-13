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

export function withInserted<T>(array: T[], index: number, value: T): T[] {
    return [
        ...array.slice(0, index),
        value,
        ...array.slice(index)
    ]
}

export function remove<T>(array: T[], value: T): void {
    array.splice(array.findIndex(it => it === value), 1)
}

export function reversed<T>(array: T[]): T[] {
    return array.reduce(
        (a, b) => [b].concat(a),
        [] as T[]
    )
}
