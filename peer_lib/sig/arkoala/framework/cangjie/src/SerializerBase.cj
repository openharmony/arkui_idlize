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

/* Serialization extension point */
public abstract class CustomSerializer {
    public var supported: Array<String>
    init(supported: Array<String>) {
        this.supported = supported
    }
    public func supports(kind: String): Bool { return this.supported.contains(kind) }
    public func serialize(serializer: SerializerBase, value: Object, kind: String): Unit
    var next: ?CustomSerializer = Option.None
}

class SerializersCache {
    var cache: ArrayList<?SerializerBase>
    init(maxCount: Int64) {
        this.cache = ArrayList<?SerializerBase>()
        for(i in 0..maxCount) {
            this.cache.append(None<SerializerBase>)
        }
    }
    func getCached<T>(factory: () -> T, index: Int32): T where T <: SerializerBase {
        while(this.cache.size < Int64(index)) {
            cache.append(None<SerializerBase>)
        }
        var result = this.cache[Int64(index)]
        match(result) {
            case Some(result) =>
                result.resetCurrentPosition()
                return match(result) {
                    case res: T => res
                    case _ => throw Exception("Factory lambda inside getCached function has returned no value")
                }
            case None => 
                result = factory()
                this.cache[Int64(index)] = result
                return match(result) {
                    case Some(res: T) => res
                    case _ => throw Exception("Factory lambda inside getCached function has returned no value")
                }
        }
    }
}

public open class SerializerBase {
    private static var cache = SerializersCache(22)

    private var position: Int32 = 0
    private var buffer: ArrayList<Int8> = ArrayList<Int8>()

    private static var customSerializers: ?CustomSerializer = Option.None
    static func registerCustomSerializer(serializer: CustomSerializer) {
        //TODO
    }
    func resetCurrentPosition(): Unit { this.position = 0 }

    init() {
        for(i in 0..96) {
            this.buffer.append(0)
        }
    }
    static func get<T>(factory: () -> T, index: Int32): T where T <: SerializerBase {
        return SerializerBase.cache.getCached(factory, index)
    }
    func asArray(): ArrayList<Int8> {
        return this.buffer
    }
    func length(): Int32 {
        return this.position
    }
    func currentPosition(): Int32 { return this.position }
    private func checkCapacity(value: Int32) {
        if (value < 1) {
            throw Exception("${value} is less than 1")
        }
        var buffSize = this.buffer.size
        if (this.position > Int32(buffSize) - value) {
            let minSize = this.position + value
            let resizedSize = max(minSize, Int32(round(3.0 * Float64(buffSize) / 2.0)))
            var resizedBuffer =  ArrayList<Int8>(Int64(resizedSize))
            for (i in 0..this.buffer.size) {
                resizedBuffer[i] = this.buffer[i]
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
    func writeFunction(value: Object): Unit {
        // TODO
    }
    func writeTag(tag: Int32): Unit {
        this.buffer[Int64(this.position)] = Int8(tag)
        this.position++
    }
    func writeNumber(value: Float32): Unit {
        this.checkCapacity(5)
        // TODO
    }
    func writeNumber(value: Float64): Unit {
        this.checkCapacity(5)
        // TODO
    }
    func writeNumber(value: Int64): Unit {
        this.checkCapacity(5)
        // TODO
    }
    func writeNumber(value: Opt_Number): Unit {
        this.writeNumber(value.value);
    }
    func writeInt8(value: Int8): Unit {
        this.checkCapacity(1)
        this.buffer[Int64(this.position)] = value
        this.position += 1
    }
    func writeInt8(value: Int32): Unit {
        this.checkCapacity(1)
        this.buffer[Int64(this.position)] = Int8(value)
        this.position += 1
    }
    private func setInt32(position: Int32, value: Int32): Unit {
        this.buffer[Int64(position + 0)] = Int8(((value      ) & 0xff))
        this.buffer[Int64(position + 1)] = Int8(((value >>  8) & 0xff))
        this.buffer[Int64(position + 2)] = Int8(((value >> 16) & 0xff))
        this.buffer[Int64(position + 3)] = Int8(((value >> 24) & 0xff))
    }
    func writeInt32(value: Int32): Unit {
        this.checkCapacity(4)
        this.setInt32(this.position, value)
        this.position += 4
    }
    func writeFloat32(value: Float32): Unit {
        // TODO: this is wrong!
        this.checkCapacity(4)
        this.position += 4
    }
    func writePointer(value: Int64): Unit {
        this.checkCapacity(8)
        this.buffer[Int64(this.position + 0)] = Int8(((value       ) & 0xff))
        this.buffer[Int64(this.position + 1)] = Int8(((value >>   8) & 0xff))
        this.buffer[Int64(this.position + 2)] = Int8(((value >>  16) & 0xff))
        this.buffer[Int64(this.position + 3)] = Int8(((value >>  24) & 0xff))
        this.buffer[Int64(this.position + 4)] = Int8(((value >>  32) & 0xff))
        this.buffer[Int64(this.position + 5)] = Int8(((value >>  40) & 0xff))
        this.buffer[Int64(this.position + 6)] = Int8(((value >>  48) & 0xff))
        this.buffer[Int64(this.position + 7)] = Int8(((value >>  56) & 0xff))
        this.position += 8
    }
    func writeBoolean(value: ?Bool): Unit {
        this.checkCapacity(1)
        if(let Some(value) <- value) {
            if (value) {
                this.buffer[Int64(this.position)] = Int8(1)
            }
            else {
                this.buffer[Int64(this.position)] = Int8(0)
            }
        }
        else {
            // this.buffer[Int64(this.position)] = RuntimeType.UNDEFINED.ordinal
        }
        this.position++
    }
    func writeMaterialized(value: Object): Unit {
        // TODO
    }
    func writeString(value: String): Unit {
        this.checkCapacity(Int32((4 + value.size * 4 + 1))) // length, data
        let encodedLength = Int32(42) // for now
        // let encodedLength = NativeModule._ManagedStringWrite(value, this.buffer, this.position + 4)
        this.setInt32(this.position, encodedLength)
        this.position += encodedLength + 4
    }
    // Length is an important common case.
    // TODO
    func writeLength(value: Ark_Length): Unit {
        this.buffer[Int64(this.position)] = Int8(RuntimeType.STRING.ordinal)
        this.position++
        this.writeString(value.value);
    }
}
