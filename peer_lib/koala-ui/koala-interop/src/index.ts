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

import { int32, float32 } from "@koalaui/common"

export type NodePointer = pointer // todo: move to NativeModule

export type KStringPtr = int32 | string | null
export type KStringPtrArray = int32 | Uint8Array | null
export type KUint8ArrayPtr = int32 | Uint8Array | null
export type KInt32ArrayPtr = int32 | Int32Array | null
export type KFloat32ArrayPtr = int32 | Float32Array | null
export type KInt = int32
export type KUInt = int32
export type KBoolean = int32
export type KFloat = float32
export type KPointer = number | bigint
export type pointer = KPointer
export type KNativePointer = KPointer

export type TypedArray = // todo: move to interop-smth
    Uint8Array
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array

export function decodeToString(array: Uint8Array): string {
    return decoder.decode(array)
}

export function isNullPtr(value: KPointer): boolean {
    return value === nullptr
}

export function className(object?: Object): string {
    return object?.constructor.name ?? "<null>"
}

export function ptrToString(ptr: KPointer) {
    return `0x${ptr!.toString(16).padStart(8, "0")}`
}

interface WithStreamOption {
    stream?: boolean | undefined;
}

interface SystemTextDecoder {
    decode(
        input?: ArrayBuffer,
        options?: WithStreamOption
    ): string;
}
export class CustomTextDecoder {
    static cpArrayMaxSize = 128
    constructor(decoder?: SystemTextDecoder) {
        this.decoder = decoder ?? new TextDecoder()
    }

    private readonly decoder: SystemTextDecoder

    decode(input: Uint8Array): string {
        if (this.decoder !== undefined) {
            return this.decoder!.decode(input)
        }
        const cpSize = Math.min(CustomTextDecoder.cpArrayMaxSize, input.length)
        let codePoints = new Int32Array(cpSize)
        let cpIndex = 0;
        let index = 0
        let result = ""
        while (index < input.length) {
            let elem = input[index]
            let lead = elem & 0xff
            let count = 0
            let value = 0
            if (lead < 0x80) {
                count = 1
                value = elem
            } else if ((lead >> 5) == 0x6) {
                value = ((elem << 6) & 0x7ff) + (input[index + 1] & 0x3f)
                count = 2
            } else if ((lead >> 4) == 0xe) {
                value = ((elem << 12) & 0xffff) + ((input[index + 1] << 6) & 0xfff) +
                    (input[index + 2] & 0x3f)
                count = 3
            } else if ((lead >> 3) == 0x1e) {
                value = ((elem << 18) & 0x1fffff) + ((input[index + 1] << 12) & 0x3ffff) +
                    ((input[index + 2] << 6) & 0xfff) + (input[index + 3] & 0x3f)
                count = 4
            }
            codePoints[cpIndex++] = value
            if (cpIndex == cpSize) {
                cpIndex = 0
                result += String.fromCodePoint(...codePoints)
            }
            index += count
        }
        if (cpIndex > 0) {
            result += String.fromCodePoint(...codePoints.slice(0, cpIndex))
        }
        return result
    }
}

const decoder = new CustomTextDecoder()

export class Wrapper {
    protected ptr: KPointer
    constructor(ptr: KPointer) {
        if (ptr == null)
            throw new Error(`Init <${className(this)}> with null native peer`)
        this.ptr = ptr
    }
    toString(): string {
        return `[native object <${className(this)}> at ${ptrToString(this.ptr)}]`
    }
}

export abstract class NativeStringBase extends Wrapper {
    constructor(ptr: KPointer) {
        super(ptr)
    }

    protected abstract bytesLength(): int32
    protected abstract getData(data: Uint8Array): void

    toString(): string {
        let length = this.bytesLength()
        let data = new Uint8Array(length)
        this.getData(data)
        return decodeToString(data)
    }

    abstract close(): void
}

export const nullptr: pointer = BigInt(0)

export interface PlatformDefinedData {
    nativeString(ptr: KPointer): NativeStringBase
    nativeStringArrayDecoder(ptr: KPointer): ArrayDecoder<NativeStringBase>
    callbackRegistry(): CallbackRegistry | undefined
}

let platformData: PlatformDefinedData | undefined = undefined

export function providePlatformDefinedData(platformDataParam: PlatformDefinedData) {
    platformData = platformDataParam
}

export function withStringResult(ptr: KPointer): string|undefined {
    if (isNullPtr(ptr)) return undefined
    let managedString = platformData!.nativeString(ptr)
    let result = managedString?.toString()
    managedString?.close()
    return result
}

export enum Access {
    READ = 1 << 0,
    WRITE = 1 << 1,
    READWRITE = READ | WRITE
}

export type ExecWithLength<P, R> = (pointer: P, length: int32) => R

function withArray<C extends TypedArray, R>(
    data: C | undefined,
    exec: ExecWithLength<C | null, R>
): R {
    return exec(data ?? null, data?.length ?? 0)
}

export function withUint8Array<T>(data: Uint8Array | undefined, access: Access, exec: ExecWithLength<Uint8Array | null, T>) {
    return withArray(data, exec)
}

export const withByteArray = withUint8Array

export abstract class ArrayDecoder<T> {
    abstract getArraySize(blob: KPointer): int32
    abstract disposeArray(blob: KPointer): void
    abstract getArrayElement(blob: KPointer, index: int32): T

    decode(blob: KPointer): Array<T> {
        throw new Error(`TODO`)
    }
}

export interface CallbackRegistry {
    registerCallback(callback: any, obj: any): KPointer
}

export * from "./callback_registry"