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
import { NativeModule } from "@arkoala/arkui/NativeModule"

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

export function runtimeType(value: Object|String|number|undefined|null|void): RuntimeType {
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

export function registerCallback(value: object): int32 {
    // TODO: fix me!
    return 42
}

function registerMaterialized(value: Object): int32 {
    // TODO: fix me!
    return 42
}

export function isPixelMap(value: Object|undefined): boolean {
    // TODO: fix me!
    return false
}

export function isResource(value: Object|undefined): boolean {
    // TODO: fix me!
    return false
}

export function isInstanceOf(className: string, value: Object): boolean {
    // TODO: fix me!
    return false
}

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

class SerializersCache {
    cache: Array<SerializerBase|undefined>
    constructor(maxCount: number) {
        this.cache = new Array<SerializerBase|undefined>(maxCount)
    }
    get<T extends SerializerBase>(factory: () => T, index: int32): T {
        let result = this.cache[index]
        if (result) {
            result.resetCurrentPosition()
            return result as T
        }
        result = factory()
        this.cache[index] = result
        return result as T
    }
}

export class SerializerBase {
    private static cache = new SerializersCache(22)

    private position = 0
    private buffer: byte[]

    private static customSerializers: CustomSerializer | undefined = undefined
    static registerCustomSerializer(serializer: CustomSerializer) {
        if (SerializerBase.customSerializers == undefined) {
            SerializerBase.customSerializers = serializer
        } else {
            let current = SerializerBase.customSerializers
            while (current!.next != undefined) { 
                current = current!.next 
            }
            current!.next = serializer
        }
    }
    resetCurrentPosition(): void { this.position = 0 }

    constructor() {
        this.buffer = new byte[96]
    }
    static get<T extends SerializerBase>(factory: () => T, index: int32): T {
        return SerializerBase.cache.get<T>(factory, index)
    }
    asArray(): byte[] {
        return this.buffer
    }
    length(): int32 {
        return this.position
    }
    currentPosition(): int32 { return this.position }
    private checkCapacity(value: int32) {
        if (value < 1) {
            throw new Error(`${value} is less than 1`)
        }
        let buffSize = this.buffer.length
        if (this.position > buffSize - value) {
            const minSize = this.position + value
            const resizedSize = Math.max(minSize, Math.round(3 * buffSize / 2))
            let resizedBuffer = new byte[resizedSize]
            for (let i = 0; i < this.buffer.length; i++) {
                resizedBuffer[i] = this.buffer[i]
            }
            this.buffer = resizedBuffer
        }
    }
    writeCustomObject(kind: string, value: object) {
        let current = SerializerBase.customSerializers
        while (current) {
            if (current!.supports(kind)) {
                current!.serialize(this, value, kind)
                return
            }
            current = current!.next
        }
        console.log(`Unsupported custom serialization for ${kind}, write undefined`)
        this.writeInt8(Tags.UNDEFINED as int32)
    }
    writeFunction(value: Object) {
        this.writeInt32(registerCallback(value))
    }
    writeTag(tag: Tags): void {
        this.buffer[this.position] = tag as int32 as byte
        this.position++
    }
    writeNumber(value: number|undefined) {
        this.checkCapacity(5)
        if (value == undefined) {
            this.writeTag(Tags.UNDEFINED)
            this.position++
            return
        }
        if ((value as double) == Math.round(value)) {
            this.writeTag(Tags.INT32)
            this.writeInt32(value as int32)
            return
        } else {
            this.writeTag(Tags.FLOAT32)
            this.writeFloat32(value as float32)
        }
    }
    writeInt8(value: int32) {
        this.checkCapacity(1)
        this.buffer[this.position] = value as byte
        this.position += 1
    }
    private setInt32(position: int32, value: int32): void {
        this.buffer[position + 0] = ((value      ) & 0xff) as byte
        this.buffer[position + 1] = ((value >>  8) & 0xff) as byte
        this.buffer[position + 2] = ((value >> 16) & 0xff) as byte
        this.buffer[position + 3] = ((value >> 24) & 0xff) as byte
    }
    writeInt32(value: int32) {
        this.checkCapacity(4)
        this.setInt32(this.position, value)
        this.position += 4
    }
    writeFloat32(value: float32) {
        // TODO: this is wrong!
        this.checkCapacity(4)
        this.buffer[this.position + 0] = ((value      ) & 0xff) as byte
        this.buffer[this.position + 1] = ((value >>  8) & 0xff) as byte
        this.buffer[this.position + 2] = ((value >> 16) & 0xff) as byte
        this.buffer[this.position + 3] = ((value >> 24) & 0xff) as byte
        this.position += 4
    }
    writePointer(value: pointer) {
        this.checkCapacity(8)
        this.buffer[this.position + 0] = ((value      ) & 0xff) as byte
        this.buffer[this.position + 1] = ((value >>  8) & 0xff) as byte
        this.buffer[this.position + 2] = ((value >> 16) & 0xff) as byte
        this.buffer[this.position + 3] = ((value >> 24) & 0xff) as byte
        this.buffer[this.position + 4] = ((value >> 32) & 0xff) as byte
        this.buffer[this.position + 5] = ((value >> 40) & 0xff) as byte
        this.buffer[this.position + 6] = ((value >> 48) & 0xff) as byte
        this.buffer[this.position + 7] = ((value >> 56) & 0xff) as byte
        this.position += 8
    }
    writeBoolean(value: boolean|undefined) {
        this.checkCapacity(1)
        if (value == undefined) {
            this.buffer[this.position] = RuntimeType.UNDEFINED as int32 as byte
        } else {
            this.buffer[this.position] = (value ? 1 : 0) as byte
        }
        this.position++
    }
    writeMaterialized(value: Object) {
        this.writePointer(registerMaterialized(value))
    }
    writeString(value: string) {
        this.checkCapacity((4 + value.length * 4 + 1) as int32) // length, data
        let encodedLength = NativeModule._ManagedStringWrite(value, this.buffer, this.position + 4)
        this.setInt32(this.position, encodedLength)
        this.position += encodedLength + 4
    }
    // Length is an important common case.
    writeLength(value: Length|undefined) {
        this.checkCapacity(1)
        let valueType = runtimeType(value)
        this.writeInt8(valueType as int32)
        if (valueType == RuntimeType.NUMBER) {
            this.writeFloat32(value as float32)
        } else if (valueType == RuntimeType.STRING) {
            this.writeString(value as string)
        } else if (valueType == RuntimeType.OBJECT) {
            this.writeInt32((value as Resource).id as int32)
        }
    }
}
