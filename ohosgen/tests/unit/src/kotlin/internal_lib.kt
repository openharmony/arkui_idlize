/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

package internal.lib

import koalaui.interop.SerializerBase
import koalaui.interop.DeserializerBase

interface InternalModuleDataInterface {
    var count: Double
}
class InternalLibInternalModuleDataInterfaceSerializerImpl {
    companion object {
        public fun write(buffer: SerializerBase, value: InternalModuleDataInterface): Unit {
            val valueSerializer: SerializerBase = buffer
            val value_count = value.count
            valueSerializer.writeNumber(value_count)
        }
        public fun read(buffer: DeserializerBase): InternalModuleDataInterface {
            val valueDeserializer: DeserializerBase = buffer
            val count_result: Double = valueDeserializer.readNumber() as Double
            val value = object: InternalModuleDataInterface { override var count = count_result }
            return value
        }
    }
}
