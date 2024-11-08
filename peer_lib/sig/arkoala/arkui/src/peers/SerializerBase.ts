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
import { float32, int32, int64 } from "@koalaui/common"
import { pointer, wrapCallback, ResourceId, ResourceManager } from "@koalaui/interop"
import { CallbackKind } from "./CallbackKind"
import { nativeModule } from "@koalaui/arkoala"
import { FinalizableBase } from "../Finalizable"

// imports required intarfaces (now generation is disabled)
// import { Resource, Length, PixelMap } from "@arkoala/arkui"
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

export function isResource(value: Object): value is Resource {
    return value.hasOwnProperty("bundleName") && value.hasOwnProperty("moduleName")
}

// Poor man's instanceof, fails on subclasses
export function isInstanceOf(className: string, value: Object): boolean {
    return value.constructor.name === className
}

export function withLength(valueLength: Length|undefined, body: (type: int32, value: float32, unit: int32, resource: int32) => void) {
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
    body(type, value, unit, resource)
}

export function withLengthArray(valueLength: Length|undefined, body: (valuePtr: Int32Array) => void) {
    withLength(valueLength, (type: int32, value, unit, resource) => {
        let array = new Int32Array(4)
        array[0] = type
        array[1] = value
        array[2] = unit
        array[3] = resource
        body(array)
    })
}

export function registerCallback(value: object|undefined): int32 {
    return wrapCallback((args: Uint8Array, length: int32) => {
        // TBD: deserialize the callback arguments and call the callback
        return 42
    })
}

export function registerMaterialized(value: object|undefined): number {
    // TODO: fix me!
    return 42
}

export interface CallbackResource {
    resourceId: int32
    hold: pointer
    release: pointer
}

/* Serialization extension point */
export abstract class CustomSerializer {
    constructor(protected supported: Array<string>) {}
    supports(kind: string): boolean { return this.supported.includes(kind) }
    abstract serialize(serializer: SerializerBase, value: any, kind: string): void
    next: CustomSerializer | undefined = undefined
}

export class SerializerBase {
    protected isHolding: boolean = false
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
    constructor() {
        this.buffer = new ArrayBuffer(96)
        this.view = new DataView(this.buffer)
    }

    public release() {
        this.isHolding = false
        this.releaseResources()
        this.position = 0
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
            let resizedBuffer = new ArrayBuffer(resizedSize)
            // TODO: can we grow without new?
            new Uint8Array(resizedBuffer).set(new Uint8Array(this.buffer))
            this.buffer = resizedBuffer
            this.view = new DataView(resizedBuffer)
        }
    }
    private heldResources: ResourceId[] = []
    holdAndWriteCallback(callback: object, kind: CallbackKind) {
        const resourceId = ResourceManager.registerAndHold(callback)
        this.heldResources.push(resourceId)
        this.writeInt32(resourceId)
        this.writePointer(0)
        this.writePointer(0)
        this.writePointer(0)
    }
    writeCallbackResource(resource: CallbackResource) {
        this.writeInt32(resource.resourceId)
        this.writePointer(resource.hold)
        this.writePointer(resource.release)
    }
    private releaseResources() {
        for (const resourceId of this.heldResources)
            ResourceManager.release(resourceId)
        // todo think about effective array clearing/pushing
        this.heldResources = []
    }
    writeCustomObject(kind: string, value: any) {
        let current = SerializerBase.customSerializers
        while (current) {
            if (current.supports(kind)) {
                current.serialize(this, value, kind)
                return
            }
            current = current.next
        }
        console.log(`Unsupported custom serialization for ${kind}, write undefined`)
        this.writeInt8(Tags.UNDEFINED)
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
    writeInt64(value: int64) {
        this.checkCapacity(8)
        this.view.setBigInt64(this.position, BigInt(value), true)
        this.position += 8
    }
    writePointer(value: pointer) {
        this.checkCapacity(8)
        this.view.setBigInt64(this.position, BigInt(value ?? 0), true)
        this.position += 8
    }
    writeFloat32(value: float32) {
        this.checkCapacity(4)
        this.view.setFloat32(this.position, value, true)
        this.position += 4
    }
    writeBoolean(value: boolean|undefined) {
        this.checkCapacity(1)
        this.view.setInt8(this.position, value == undefined ? RuntimeType.UNDEFINED : +value)
        this.position++
    }
    writeFunction(value: object | undefined) {
        this.writeInt32(registerCallback(value))
    }
    writeMaterialized(value: object | undefined) {
        this.writePointer(value ? (value as FinalizableBase).ptr : 0)
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
}
