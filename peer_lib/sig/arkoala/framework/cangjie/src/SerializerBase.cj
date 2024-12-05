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

package idlize

import std.binary.*
import std.math.*
import std.reflect.*
import std.collection.*

public enum RuntimeType {
    |UNEXPECTED
    |NUMBER
    |STRING
    |OBJECT
    |BOOLEAN
    |UNDEFINED
    |BIGINT
    |FUNCTION
    |SYMBOL
    |MATERIALIZED
    prop ordinal: Int32 {
        get() {
            match (this) {
                case UNEXPECTED => -1
                case NUMBER => 1
                case STRING => 2
                case OBJECT => 3
                case BOOLEAN => 4
                case UNDEFINED => 5
                case BIGINT => 6
                case FUNCTION => 7
                case SYMBOL => 8
                case MATERIALIZED => 9
            }
        }
    }
}

public interface CallbackResource {
    prop resourceId: Int32
    prop hold: KPointer
    prop release: KPointer
}

/* Serialization extension point */
public abstract class CustomSerializer {
    public var supported: Array<String>
    init(supported: Array<String>) {
        this.supported = supported
    }
    public func supports(kind: String): Bool { return this.supported.contains(kind) }
    public func serialize(serializer: SerializerBase, value: Object, kind: String): Unit {}
    var next: ?CustomSerializer = Option.None
}

public open class SerializerBase {
    protected var isHolding: Bool = false
    private var position: Int64 = 0
    private var buffer: ArrayList<UInt8> = ArrayList<UInt8>()

    private static var customSerializers: ?CustomSerializer = Option.None
    static func registerCustomSerializer(serializer: CustomSerializer) {
        //TODO
    }

    init() {
        this.buffer = ArrayList<UInt8>(Array<UInt8>(96, repeat: UInt8(0)))
    }
    public func release() {
        this.isHolding = false
        // todo handle release resources
        this.position = 0
    }
    func asArray(): ArrayList<UInt8> {
        return this.buffer
    }
    func length(): Int32 {
        return Int32(this.position)
    }
    func currentPosition(): Int64 { return this.position }
    private func checkCapacity(value: Int64) {
        if (value < 1) {
            throw Exception("${value} is less than 1")
        }
        var buffSize = this.buffer.size
        if (this.position > buffSize - value) {
            let minSize = this.position + value
            let resizedSize = max(minSize, Int64(round(3.0 * Float64(buffSize) / 2.0)))
            var resizedBuffer =  ArrayList<UInt8>(resizedSize)
            for (i in 0..this.buffer.size) {
                resizedBuffer.append(this.buffer[i])
            }
            this.buffer = resizedBuffer
        }
    }
    func writeCustomObject(kind: String, value: Object): Unit {
        var current = SerializerBase.customSerializers
        // TODO
        println("Unsupported custom serialization for ${kind}, write undefined")
        this.writeInt8(Tag.UNDEFINED.ordinal)
    }
    private var heldResources: ArrayList<ResourceId> = ArrayList<ResourceId>()
    func holdAndWriteCallback(callback: Object, hold: KPointer, release: KPointer, call: KPointer): ResourceId {
        let resourceId = ResourceHolder.instance().registerAndHold(callback)
        this.heldResources.append(resourceId)
        this.writeInt32(resourceId)
        this.writePointer(hold)
        this.writePointer(release)
        this.writePointer(call)
        return resourceId
    }
    func writeFunction(value: Object): Unit {
        // TODO
    }
    private func setBytes<V, T>(position: Int64, value: T): Unit where T <: LittleEndianOrder<V>{
        var arr = Array<Byte>(100, repeat: 0)
        let n = value.writeLittleEndian(arr)
        this.checkCapacity(n)
        for (i in 0..n) {
            this.buffer[this.position + i] = arr[i]
        }
        this.position += n
    }
    func writeTag(tag: Int32): Unit {
        this.setBytes(this.position, tag)
    }
    func writeNumber(value: ?Float32): Unit {
        if (let Some(value) <- value) {
            if(value == Float32(Int32(value))) {
                this.writeNumber(Int32(value))
            } else {
                this.setBytes(this.position, Tag.FLOAT32.ordinal)
                this.setBytes(this.position, value)
            }
        }
        else {
            this.buffer[Int64(this.position)] = UInt8(RuntimeType.UNDEFINED.ordinal)
            this.position++
        }
    }
    func writeNumber(value: ?Float64): Unit {
        if (let Some(value) <- value) {
            if(value == Float64(Int32(value))) {
                this.writeNumber(Int32(value))
            } else {
                this.setBytes(this.position, Tag.FLOAT32.ordinal)
                this.setBytes(this.position, Float32(value))
            }
        }
        else {
            this.buffer[Int64(this.position)] = UInt8(RuntimeType.UNDEFINED.ordinal)
            this.position++
        }
    }
    func writeNumber(value: ?Int32): Unit {
        if (let Some(value) <- value) {
            this.setBytes(this.position, Tag.INT32.ordinal)
            this.setBytes(this.position, value)
            }
        else {
            this.buffer[Int64(this.position)] = UInt8(RuntimeType.UNDEFINED.ordinal)
            this.position++
        }
    }
    func writeNumber(value: ?Int64): Unit {
        if (let Some(value) <- value) {
            this.setBytes(this.position, Tag.INT32.ordinal)
            this.setBytes(this.position, Int32(value))
        }
        else {
            this.buffer[Int64(this.position)] = UInt8(RuntimeType.UNDEFINED.ordinal)
            this.position++
        }
    }
    func writeInt8(value: Int8): Unit {
        this.setBytes(this.position, value)
    }
    func writeInt8(value: Int32): Unit {
        this.setBytes(this.position, Int8(value))
    }
    func writeInt32(value: Int32): Unit {
        this.setBytes(this.position, Int32(value))
    }
    func writeInt64(value: Int64): Unit {
        this.setBytes(this.position, Int64(value))
    }
    func writeFloat32(value: Float32): Unit {
        this.setBytes(this.position, value)
    }
    func writePointer(ptr: Int64): Unit {
        this.setBytes(this.position, ptr)
    }
    func writeBoolean(value: ?Bool): Unit {
        this.checkCapacity(1)
        if(let Some(value) <- value) {
            this.setBytes(this.position, value)
        }
        else {
            this.buffer[Int64(this.position)] = UInt8(RuntimeType.UNDEFINED.ordinal)
            this.position++
        }
    }
    func writeMaterialized(value: Object): Unit {
        // TODO
    }
    func writeString(value: String): Unit {
        this.checkCapacity(4 + value.size * 4 + 1) // length, data
        this.writeInt32(Int32(value.size + 1))
        for (i in 0..value.size) {
            this.setBytes(this.position, value[i])
        }
        this.writeInt8(Int8(0))
    }
    func writeBuffer(value: ArrayList<UInt8>) {
        // TODO
        // this.writePointer(42)
        // this.writeInt64(value.size)
    }
}
