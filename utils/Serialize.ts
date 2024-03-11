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
import { int32 } from "./Interop"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER,
    STRING,
    OBJECT,
    BOOLEAN,
    UNDEFINED
}

export function runtimeType(value: any): int32 {
    let type = typeof value
    if (type == "number") return RuntimeType.NUMBER
    if (type == "string") return RuntimeType.STRING
    if (type == "undefined") return RuntimeType.UNDEFINED
    if (type == "object") return RuntimeType.OBJECT
    if (type == "boolean") return RuntimeType.BOOLEAN
    throw new Error("bug: " + value)
}

export function serializeNumber(array: Uint8Array, index: number, value: number): number {
    //(array.buffer as Buffer).writeUint32LE(value, index)
    console.log("write number", value)
    return index + 4
}

export function serializeInt32(array: Uint8Array, index: number, value: number): number {
    //(array.buffer as Buffer).writeUint32LE(value, index)
    console.log("write int32", value)
    return index + 4
}

export function serializeString(array: Uint8Array, index: number, value: string): number {
    console.log("write string", value)
    return index + 4 + value.length
}

export function serializeResource(array: Uint8Array, index: number, value: Resource): number {
    console.log("write resource", value)
    return index + 4
}

export function serializeLabelStyle(array: Uint8Array, index: number, value: LabelStyle): number {
    console.log("write label style", value)
    return index + 4
}

export function enumToInt32<T>(value: T): number {
    return value as number
}