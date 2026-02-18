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
import {Serializer} from "@arkoala/arkui/peers/Serializer"

export function toInt32(value: number, littleEndian: boolean = true): number[] {
    const b0 = (value >> 0 & 0xFF)
    const b1 = (value >> 8 & 0xFF)
    const b2 = (value >> 16 & 0xFF)
    const b3 = (value >> 24 & 0xFF)
    return (littleEndian) ? [b0, b1, b2, b3] : [b3, b2, b1, b0]
}

export function toStr(value: string): number[] {
    let chars = [...value].map(it => it.charCodeAt(0))
    return [...toInt32(value.length + 1), ...chars, 0] // zero terminated string
}

export function toArray(s: Serializer): Array<number> {
    return Array.from(s.asArray().slice(0, s.length()))
}
