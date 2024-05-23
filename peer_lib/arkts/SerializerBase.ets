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
import { float32, int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Length, Resource } from "./dts-exports"

/**
 * Value representing possible JS runtime object type.
 * Must be synced with "enum RuntimeType" in C++.
 */
export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8,
    MATERIALIZED = 9,
}

/**
 * Value representing object type in serialized data.
 * Must be synced with "enum Tags" in C++.
 */
export enum Tags {
    UNDEFINED = 101,
    INT32 = 102,
    FLOAT32 = 103,
    STRING = 104,
    LENGTH = 105,
    RESOURCE = 106,
    OBJECT = 107,
}

export function runtimeType<T>(value: T): RuntimeType {
    let type = typeof value
    if (type == "number") return RuntimeType.NUMBER
    if (type == "string") return RuntimeType.STRING
    if (type == "undefined") return RuntimeType.UNDEFINED
    if (type == "object") return RuntimeType.OBJECT
    if (type == "boolean") return RuntimeType.BOOLEAN
    if (type == "bigint") return RuntimeType.BIGINT
    if (type == "function") return RuntimeType.FUNCTION
    if (type == "symbol") return RuntimeType.SYMBOL

    throw new Error(`bug: ${value} is ${type}`)
}

export type Function = object

function registerCallback(value: object|undefined): number {
    // TODO: fix me!
    return 42
}

function registerMaterialized(value: object|undefined): number {
    // TODO: fix me!
    return 42
}
/*
let textEncoder = new TextEncoder()

class ArrayBufferCache {
    currentUsed = 0
    cache: Array<ArrayBuffer|undefined> = []
    constructor(public maxCapacity: number) {}

    get(size: number): ArrayBuffer {
        for (let i = 0; i < this.cache.length; i++) {
            let buffer = this.cache[i]
            if (buffer && buffer.byteLength >= size) {
                this.cache[i] = undefined
                this.currentUsed += buffer.byteLength
                return buffer
            }
        }
        this.currentUsed += size
        return new ArrayBuffer(size)
    }
    release(buffer: ArrayBuffer) {
        this.currentUsed -= buffer.byteLength
        for (let i = 0; i < this.cache.length; i++) {
            if (!this.cache[i]) {
                this.cache[i] = buffer
                return
            }
        }
        this.cache.push(buffer)
    }
}
*/

/* Serialization extension point */
export abstract class CustomSerializer {
    protected supported: Array<string>
    constructor(supported: Array<string>) {
        this.supported = supported
    }
    supports(kind: string): boolean { return this.supported.includes(kind) }
    abstract serialize(serializer: SerializerBase, value: object, kind: string): void
    next: CustomSerializer | undefined = undefined
}

export class SerializerBase {
    // private static bufferCache = new ArrayBufferCache(4096)

    private position = 0
    private buffer: ArrayBuffer
    private view: DataView

    private static customSerializers: CustomSerializer | undefined = undefined
    static registerCustomSerializer(serializer: CustomSerializer) {
        if (SerializerBase.customSerializers == undefined) {
            SerializerBase.customSerializers = serializer
        } else {
            /*
            let current = SerializerBase.customSerializers
            while (current.next != undefined) { current = current.next }
            current.next = serializer
            */
        }
    }
    constructor(expectedSize: int32) {
        // this.buffer = SerializerBase.bufferCache.get(expectedSize)
        this.view = new DataView(this.buffer)
    }
    close() {
        // SerializerBase.bufferCache.release(this.buffer)
    }
    asArray(): Uint8Array {
        return new Uint8Array(this.buffer)
    }
    length(): int32 {
        return this.position
    }
    currentPosition(): int32 { return this.position }
    private checkCapacity(value: int32) {
        if (value < 1) {
            throw new Error(`${value} is less than 1`)
        }
        let buffSize = this.buffer.byteLength
        if (this.position > buffSize - value) {
            const minSize = this.position + value
            const resizedSize = Math.max(minSize, Math.round(3 * buffSize / 2))
            /*
            let resizedBuffer = SerializerBase.bufferCache.get(resizedSize)
            // TODO: can we grow without new?
            new Uint8Array(resizedBuffer).set(new Uint8Array(this.buffer))
            SerializerBase.bufferCache.release(this.buffer)
            this.buffer = resizedBuffer
            this.view = new DataView(resizedBuffer)
            */
        }
    }
    writeCustomObject(kind: string, value: object) {
        let current = SerializerBase.customSerializers
        /*
        while (current) {
            if (current.supports(kind)) {
                current.serialize(this, value, kind)
                return
            }
        }
        */
        console.log(`Unsupported custom serialization for ${kind}, write undefined`)
        this.writeInt8(Tags.UNDEFINED as int32)
    }
    writeNumber(value: number|undefined) {
        this.checkCapacity(5)
        if (value == undefined) {
            // this.view.setInt8(this.position, Tags.UNDEFINED)
            this.position++
            return
        }
        if (value == Math.round(value)) {
            // this.view.setInt8(this.position, Tags.INT32)
            this.view.setInt32(this.position + 1, value, true)
            this.position += 5
            return
        }
        // this.view.setInt8(this.position, Tags.FLOAT32)
        this.view.setFloat32(this.position + 1, value, true)
        this.position += 5
    }
    writeInt8(value: int32) {
        this.checkCapacity(1)
        this.view.setInt8(this.position, value)
        this.position += 1
    }
    writeInt32(value: int32) {
        this.checkCapacity(4)
        this.view.setInt32(this.position, value, true)
        this.position += 4
    }
    writePointer(value: pointer) {
        this.checkCapacity(8)
        // this.view.setBigInt64(this.position, BigInt(value), true)
        this.position += 8
    }
    writeFloat32(value: float32) {
        this.checkCapacity(4)
        this.view.setFloat32(this.position, value, true)
        this.position += 4
    }
    writeBoolean(value: boolean|undefined) {
        this.checkCapacity(1)
        // this.view.setInt8(this.position, value == undefined ? RuntimeType.UNDEFINED : +value)
        this.position++
    }
    /*
    writeFunction(value: object | undefined) {
        this.writeInt32(registerCallback(value))
    }
    writeMaterialized(value: object | undefined) {
        this.writePointer(registerMaterialized(value))
    }
    writeString(value: string) {
        this.checkCapacity(4 + value.length * 4) // length, data
        let encodedLength =
            nativeModule()._ManagedStringWrite(value, new Uint8Array(this.view.buffer, 0), this.position + 4)
        this.view.setInt32(this.position, encodedLength, true)
        this.position += encodedLength + 4
    }
    // Length is an important common case.
    writeLength(value: Length|undefined) {
        this.checkCapacity(1)
        let valueType = runtimeType(value)
        this.writeInt8(valueType)
        if (valueType == RuntimeType.NUMBER) {
            this.writeFloat32(value as number)
        } else if (valueType == RuntimeType.STRING) {
            this.writeString(value as string)
        } else if (valueType == RuntimeType.OBJECT) {
            this.writeInt32((value as Resource).id)
        }
    }
    */
}
