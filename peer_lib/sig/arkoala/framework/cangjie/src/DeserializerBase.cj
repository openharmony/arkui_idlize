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

import std.collection.*

public open class DeserializerBase {
    private var position = 0
    private var length = 96
    private var buffer: ArrayList<UInt8> = ArrayList<UInt8>()

    // static registerCustomDeserializer(deserializer: CustomDeserializer) {
    //     let current = DeserializerBase.customDeserializers
    //     if (current == undefined) {
    //         DeserializerBase.customDeserializers = deserializer
    //     } else {
    //         while (current.next != undefined) {
    //             current = current.next
    //         }
    //         current.next = deserializer
    //     }
    // }

    init(buffer: ArrayList<UInt8>, length: Int64) {
        this.buffer = buffer
        this.length = length
    }

    static func get<T>(
        factory: (args: ArrayList<UInt8>, length: Int32) -> T,
                  args: ArrayList<UInt8>, length: Int32): T where T <: DeserializerBase {

        // TBD: Use cache
        return factory(args, length)
    }

    func asArray(position: Int64, length: Int64): ArrayList<UInt8> {
        return ArrayList<UInt8>()
    }

    func currentPosition(): Int64 {
        return this.position
    }

    func resetCurrentPosition(): Unit {
        this.position = 0
    }

    private func checkCapacity(value: Int64) {
        if (value > this.length) {
            throw Exception("${value} is less than remaining buffer length")
        }
    }

    func readInt8(): Int8 {
        this.checkCapacity(1)
        // let value = this.view.getInt8(this.position)
        this.position += 1
        return 0
    }

    func readInt32(): Int32 {
        this.checkCapacity(4)
        // const value = this.view.getInt32(this.position, true)
        this.position += 4
        return 0
    }

    func readInt64(): Int64 {
        this.checkCapacity(8)
        // const value = this.view.getBigInt64(this.position, true)
        this.position += 8
        return 0
    }

    func readPointer(): KPointer {
        this.checkCapacity(8)
        // const value = this.view.getBigInt64(this.position, true)
        this.position += 8
        return 0
    }

    func readFloat32(): Float32 {
        this.checkCapacity(4)
        // const value = this.view.getFloat32(this.position, true)
        this.position += 4
        return 0.0
    }

    func readBoolean(): Bool {
        this.checkCapacity(1)
        // const value = this.view.getInt8(this.position)
        this.position += 1
        return true
    }

    // readFunction(): any {
    //     // TODO: not exactly correct.
    //     const id = this.readInt32()
    //     return id
    // }

    // readMaterialized(): object {
    //     const ptr = this.readPointer()
    //     return { ptr: ptr }
    // }

    func readString(): String {
        // TODO
        return "value"
    }

    func readCustomObject<T>(kind: String): Option<T> where T <: Ark_CustomObject{
        throw Exception("readCustomObject")
    }

    func readNumber(): Float64 {
        let tag = this.readInt8()
        match (tag) {
            // case Tags.UNDEFINED.ordinal =>
            //     return Option.None
            // case Tag.INT32.ordinal =>
            //     return Float64(this.readInt32())
            // case Tag.FLOAT32.ordinal =>
            //     return Float64(this.readFloat32())
            case _ =>
                throw Exception("Unknown number tag: ${tag}")
        }
    }

    func readLength(): ?Ark_Length {
        this.checkCapacity(1)
        let valueType = this.readInt8()
        // match (valueType) {
        //     case RuntimeType.OBJECT =>
        //         return Ark_Length("")
        //     case RuntimeType.STRING =>
        //         return this.readString()
        //     case RuntimeType.NUMBER =>
        //         return this.readFloat32()
        //     case _ => 
                return Option.None
        // }
    }

    // readCallbackResource(): CallbackResource {
    //     return {
    //         resourceId: this.readInt32(),
    //         hold: this.readPointer(),
    //         release: this.readPointer(),
    //     }
    // }

    // static lengthUnitFromInt(unit: int32): string {
    //     let suffix: string
    //     switch (unit) {
    //         case 0:
    //             suffix = "px"
    //             break
    //         case 1:
    //             suffix = "vp"
    //             break
    //         case 3:
    //             suffix = "%"
    //             break
    //         case 4:
    //             suffix = "lpx"
    //             break
    //         default:
    //             suffix = "<unknown>"
    //     }
    //     return suffix
    // }
}
