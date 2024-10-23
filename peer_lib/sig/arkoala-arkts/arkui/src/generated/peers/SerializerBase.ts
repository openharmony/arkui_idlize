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
import { float32, float64, int32, int8 } from "@koalaui/common"
import { pointer, KUint8ArrayPtr, KBuffer, ResourceId, ResourceManager } from "@koalaui/interop"
import { Length, Resource } from "../ArkUnitsInterfaces"
import { NativeModule } from "#components"

/**
 * Value representing possible JS runtime object type.
 * Must be synced with "enum RuntimeType" in C++.
 */
export class RuntimeType {
    static UNEXPECTED = -1
    static NUMBER = 1
    static STRING = 2
    static OBJECT = 3
    static BOOLEAN = 4
    static UNDEFINED = 5
    static BIGINT = 6
    static FUNCTION = 7
    static SYMBOL = 8
    static MATERIALIZED = 9
}

/**
 * Value representing object type in serialized data.
 * Must be synced with "enum Tags" in C++.
 */
export class Tags {
    static UNDEFINED = 101
    static INT32 = 102
    static FLOAT32 = 103
    static STRING = 104
    static LENGTH = 105
    static RESOURCE = 106
    static OBJECT = 107
}

export function runtimeType(value: Object|String|number|undefined|null): int32 {
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

export class SerializerBase {
    private static cache: SerializerBase | undefined = undefined

    private isHolding: boolean = false
    private position = 0
    private buffer: KBuffer

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
        this.buffer = new KBuffer(96)
    }
    static hold<T extends SerializerBase>(factory: () => T): T {
        if (SerializerBase.cache === undefined)
            SerializerBase.cache = factory()
        const serializer = SerializerBase.cache!
        if (serializer.isHolding)
            throw new Error("Serializer is already being held. Check if you had released is before")
        serializer.isHolding = true
        return serializer as T
    }
    public release() {
        this.isHolding = false
        this.releaseResources()
        this.position = 0
    }
    asArray(): KUint8ArrayPtr {
        return this.buffer.buffer
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
            let resizedBuffer = new KBuffer(resizedSize as int32)
            for (let i = 0; i < this.buffer.length; i++) {
                resizedBuffer.set(i, this.buffer.get(i))
            }
            this.buffer = resizedBuffer
        }
    }
    private heldResources: Array<ResourceId> = new Array<ResourceId>()
    writeResource(resource: object) {
        const resourceId = ResourceManager.registerAndHold(resource)
        this.heldResources.push(resourceId)
        this.writeInt32(resourceId)
    }
    writeCallbackResource(resource: object) {
        const resourceId = ResourceManager.registerAndHold(resource)
        this.heldResources.push(resourceId)
        this.writeInt32(resourceId)
        this.writePointer(NativeModule._GetManagedResourceHolder())
        this.writePointer(NativeModule._GetManagedResourceReleaser())
    }
    private releaseResources() {
        for (const resourceId of this.heldResources)
            ResourceManager.release(resourceId)
        // todo think about effective array clearing/pushing
        this.heldResources = new Array<ResourceId>()
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
        // console.log(`Unsupported custom serialization for ${kind}, write undefined`)
        this.writeInt8(Tags.UNDEFINED as int32)
    }
    writeFunction(value: Object) {
        this.writeInt32(registerCallback(value))
    }
    writeTag(tag: int32): void {
        this.buffer.set(this.position, tag as int8)
        this.position++
    }
    writeNumber(value: number|undefined) {
        this.checkCapacity(5)
        if (value == undefined) {
            this.writeTag(Tags.UNDEFINED)
            this.position++
            return
        }
        if ((value as float64) == Math.round(value)) {
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
        this.buffer.set(this.position, value as int8)
        this.position += 1
    }
    private setInt32(position: int32, value: int32): void {
        this.buffer.set(position + 0, ((value      ) & 0xff) as int8)
        this.buffer.set(position + 1, ((value >>  8) & 0xff) as int8)
        this.buffer.set(position + 2, ((value >> 16) & 0xff) as int8)
        this.buffer.set(position + 3, ((value >> 24) & 0xff) as int8)
    }
    writeInt32(value: int32) {
        this.checkCapacity(4)
        this.setInt32(this.position, value)
        this.position += 4
    }
    writeFloat32(value: float32) {
        // TODO: this is wrong!
        this.checkCapacity(4)
        this.buffer.set(this.position + 0, ((value      ) & 0xff) as int8)
        this.buffer.set(this.position + 1, ((value >>  8) & 0xff) as int8)
        this.buffer.set(this.position + 2, ((value >> 16) & 0xff) as int8)
        this.buffer.set(this.position + 3, ((value >> 24) & 0xff) as int8)
        this.position += 4
    }
    writePointer(value: pointer) {
        if (typeof value === "bigint")
            // todo where it is possible to be called from?
            throw new Error("Not implemented")
        this.checkCapacity(8)
        this.buffer.set(this.position + 0, ((value      ) & 0xff) as int8)
        this.buffer.set(this.position + 1, ((value >>  8) & 0xff) as int8)
        this.buffer.set(this.position + 2, ((value >> 16) & 0xff) as int8)
        this.buffer.set(this.position + 3, ((value >> 24) & 0xff) as int8)
        this.buffer.set(this.position + 4, ((value >> 32) & 0xff) as int8)
        this.buffer.set(this.position + 5, ((value >> 40) & 0xff) as int8)
        this.buffer.set(this.position + 6, ((value >> 48) & 0xff) as int8)
        this.buffer.set(this.position + 7, ((value >> 56) & 0xff) as int8)
        this.position += 8
    }
    writeBoolean(value: boolean|undefined) {
        this.checkCapacity(1)
        if (value == undefined) {
            this.buffer.set(this.position, RuntimeType.UNDEFINED as int32 as int8)
        } else {
            this.buffer.set(this.position, (value ? 1 : 0) as int8)
        }
        this.position++
    }
    writeMaterialized(value: Object) {
        this.writePointer(registerMaterialized(value))
    }
    writeString(value: string) {
        this.checkCapacity((4 + value.length * 4 + 1) as int32) // length, data
        let encodedLength = NativeModule._ManagedStringWrite(value, this.asArray(), this.position + 4)
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
