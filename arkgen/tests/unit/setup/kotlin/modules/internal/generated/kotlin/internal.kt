/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

package internal

import koalaui.interop.SerializerBase
import koalaui.interop.DeserializerBase
import koalaui.interop.CallbackResource
import koalaui.interop.InteropNativeModule
import koalaui.interop.MaterializedBase
import koalaui.interop.Tag
import koalaui.interop.RuntimeType
import koalaui.interop.toPeerPtr
import koalaui.interop.nullptr
import koalaui.interop.KPointer
import koalaui.interop.KNativePointer
import koalaui.interop.NativeBuffer
import koalaui.interop.KUint8ArrayPtr
public interface InternalInterface {
    public var name: String
}
public open class internal_InternalInterface_serializer {
    companion object {
        public fun write(buffer: SerializerBase, value: InternalInterface): Unit {
            var valueSerializer: SerializerBase = buffer
            val valueHolderForName = value.name
            valueSerializer.writeString(valueHolderForName)
        }
        public fun read(buffer: DeserializerBase): InternalInterface {
            var valueDeserializer: DeserializerBase = buffer
            val nameTmpResult: String = valueDeserializer.readString() as String
            var value: InternalInterface = object: InternalInterface { override var name = nameTmpResult}
            return value
        }
    }
}
class InternalEnumString private constructor(public val ordinal: Int, public val value: String) {
    companion object {
        val E1: InternalEnumString = InternalEnumString(0, "e1")
        val E2: InternalEnumString = InternalEnumString(1, "e2")
        val values: Map<Int, InternalEnumString> = mapOf(0 to E1, 1 to E2)
    }
}
