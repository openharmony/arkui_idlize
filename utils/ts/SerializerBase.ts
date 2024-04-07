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
import { float32, int32 } from "./types"

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
    SYMBOL = 8
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

export function runtimeType(value: any): int32 {
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

export function withLength(valueLength: Length|undefined, body: (value: float32, unit: int32, resource: int32) => void) {
    let type = runtimeType(valueLength)
    let value = 0
    let unit = 1 // vp
    let resource = 0
    switch (type) {
        case RuntimeType.UNDEFINED:
            value = 0
            unit = 0
            break
        case RuntimeType.NUMBER:
            value = valueLength as float32
            break
        case RuntimeType.STRING:
            let valueStr = valueLength as string
            // TODO: faster parse.
            if (valueStr.endsWith("vp")) {
                unit = 1 // vp
                value = Number(valueStr.substring(0, valueStr.length - 2))
            } else if (valueStr.endsWith("%")) {
                unit = 3 // percent
                value = Number(valueStr.substring(0, valueStr.length - 1))
            } else if (valueStr.endsWith("lpx")) {
                unit = 4 // lpx
                value = Number(valueStr.substring(0, valueStr.length - 3))
            } else if (valueStr.endsWith("px")) {
                unit = 0 // px
                value = Number(valueStr.substring(0, valueStr.length - 2))
            }
            break
        case RuntimeType.OBJECT:
            resource = (valueLength as Resource).id
            break
    }
    body(value, unit, resource)
}


export function withLengthArray(valueLength: Length|undefined, body: (valuePtr: Int32Array) => void) {
    withLength(valueLength, (value, unit, resource) => {
        let array = new Int32Array(3)
        array[0] = value
        array[1] = unit
        array[2] = resource
        body(array)
    })
}

let textEncoder = new TextEncoder()

/* Serialization extension point */
export abstract class CustomSerializer {
    constructor(protected supported: Array<string>) {}
    supports(kind: string): boolean { return this.supported.includes(kind) }
    abstract serialize(serializer: SerializerBase, value: any, kind: string): void
    next: CustomSerializer | undefined = undefined
}

export class SerializerBase {
    private position = 0
    private buffer: ArrayBuffer
    private view: DataView

    private static customSerializers: CustomSerializer | undefined = undefined
    static registerCustomSerializer(serializer: CustomSerializer) {
        if (SerializerBase.customSerializers == undefined) {
            SerializerBase.customSerializers = serializer
        } else {
            let current = SerializerBase.customSerializers
            while (current.next != undefined) { current = current.next }
            current.next = serializer
        }
    }
    constructor(expectedSize: int32) {
        this.buffer = new ArrayBuffer(expectedSize)
        this.view = new DataView(this.buffer)
    }
    asArray(): Uint8Array {
        return new Uint8Array(this.buffer)
    }
    length(): int32 {
        return this.position
    }
    private checkCapacity(value: int32) {
        if (value < 1) {
            throw new Error(`${value} is less than 1`)
        }
        let buffSize = this.buffer.byteLength
        if (this.position > buffSize - value) {
            const minSize = this.position + value
            const resizedSize = Math.max(minSize, Math.round(3 * buffSize / 2))
            let resizedBuffer = new ArrayBuffer(resizedSize)
            new Uint8Array(resizedBuffer).set(new Uint8Array(this.buffer));
            this.buffer = resizedBuffer
            this.view = new DataView(resizedBuffer)
        }
    }
    writeCustom(kind: string, value: any) {
        let current = SerializerBase.customSerializers
        while (current) {
            if (current.supports(kind)) {
                current.serialize(this, value, kind)
                return
            }
        }
        console.log(`Unsupported custom serialization for ${kind}`)
    }
    writeNumber(value: number|undefined) {
        this.checkCapacity(5)
        if (value == undefined) {
            this.view.setInt8(this.position, Tags.UNDEFINED)
            this.position++
            return
        }
        if (value == Math.round(value)) {
            this.view.setInt8(this.position, Tags.INT32)
            this.view.setInt32(this.position + 1, value, true)
            this.position += 5
            return
        }
        this.view.setInt8(this.position, Tags.FLOAT32)
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
    writeFloat32(value: float32) {
        this.checkCapacity(4)
        this.view.setFloat32(this.position, value, true)
        this.position += 4
    }
    writeBoolean(value: boolean|undefined) {
        this.checkCapacity(1)
        this.view.setInt8(this.position, value == undefined ? 2 : +value)
        this.position++
    }
    writeFunction(value: object | undefined) {
        this.writeCustom("Function", value)
    }
    writeString(value: string|undefined) {
        if (value == undefined) {
            this.writeInt8(Tags.UNDEFINED)
            return
        }
        let encoded = textEncoder.encode(value)
        this.checkCapacity(5 + encoded.length)
        this.view.setInt8(this.position, Tags.STRING)
        this.view.setInt32(this.position + 1, encoded.length, true)
        new Uint8Array(this.view.buffer, this.position + 5).set(encoded)
        this.position += 5 + encoded.length
    }
    writeAny(value: any) {
        throw new Error("How to write any?")
    }
    // Length is an important common case.
    writeLength(value: Length|undefined) {
        this.checkCapacity(1)
        let valueType = runtimeType(value)
        this.writeInt8(valueType == RuntimeType.UNDEFINED ? Tags.UNDEFINED : Tags.LENGTH)
        if (valueType != RuntimeType.UNDEFINED) {
            withLength(value, (value, unit, resource) => {
                this.writeFloat32(value)
                this.writeInt32(unit)
                this.writeInt32(resource)
            })
        }
    }
    writeAnimationRange(value: AnimationRange<number>|undefined) {
       if (!value) {
           this.writeInt8(Tags.UNDEFINED)
           return
        }
        this.writeInt8(Tags.OBJECT)
        this.writeNumber(value[0])
        this.writeNumber(value[1])
    }

    writeCallback(value: Callback<any>|undefined) {
        this.writeCustom("Callback", value)
    }
}