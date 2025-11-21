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

package global.resource

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
import synthetic_types.Union_String_I32_I64_F64_Global_Resource_Resource

public interface Resource {
    public var bundleName: String
    public var moduleName: String
    public var id: Long
    public var params: ArrayList<Union_String_I32_I64_F64_Global_Resource_Resource>?
    public var type: Int?
}
public open class GlobalResourceResourceSerializerImpl {
    companion object {
        public fun write(buffer: SerializerBase, value: Resource): Unit {
            var valueSerializer: SerializerBase = buffer
            val valueHolderForBundleName = value.bundleName
            valueSerializer.writeString(valueHolderForBundleName)
            val valueHolderForModuleName = value.moduleName
            valueSerializer.writeString(valueHolderForModuleName)
            val valueHolderForId = value.id
            valueSerializer.writeInt64(valueHolderForId)
            val valueHolderForParams = value.params
            if (valueHolderForParams != null) {
                valueSerializer.writeInt8(RuntimeType.OBJECT.value)
                val valueHolderForParamsTmpValue = valueHolderForParams!!
                valueSerializer.writeInt32(valueHolderForParamsTmpValue.size.toInt())
                for (valueHolderForParamsTmpValueCounterI in 0..valueHolderForParamsTmpValue.size) {
                    val valueHolderForParamsTmpValueTmpElement: Union_String_I32_I64_F64_Global_Resource_Resource = valueHolderForParamsTmpValue[valueHolderForParamsTmpValueCounterI]
                    if (valueHolderForParamsTmpValueTmpElement.getSelector() == 0) {
                        valueSerializer.writeInt8(0.toByte())
                        val valueHolderForParamsTmpValueTmpElementForIdx0 = valueHolderForParamsTmpValueTmpElement.getValue0()
                        valueSerializer.writeString(valueHolderForParamsTmpValueTmpElementForIdx0)
                    } else if (valueHolderForParamsTmpValueTmpElement.getSelector() == 1) {
                        valueSerializer.writeInt8(1.toByte())
                        val valueHolderForParamsTmpValueTmpElementForIdx1 = valueHolderForParamsTmpValueTmpElement.getValue1()
                        valueSerializer.writeInt32(valueHolderForParamsTmpValueTmpElementForIdx1)
                    } else if (valueHolderForParamsTmpValueTmpElement.getSelector() == 2) {
                        valueSerializer.writeInt8(2.toByte())
                        val valueHolderForParamsTmpValueTmpElementForIdx2 = valueHolderForParamsTmpValueTmpElement.getValue2()
                        valueSerializer.writeInt64(valueHolderForParamsTmpValueTmpElementForIdx2)
                    } else if (valueHolderForParamsTmpValueTmpElement.getSelector() == 3) {
                        valueSerializer.writeInt8(3.toByte())
                        val valueHolderForParamsTmpValueTmpElementForIdx3 = valueHolderForParamsTmpValueTmpElement.getValue3()
                        valueSerializer.writeFloat64(valueHolderForParamsTmpValueTmpElementForIdx3)
                    } else if (valueHolderForParamsTmpValueTmpElement.getSelector() == 4) {
                        valueSerializer.writeInt8(4.toByte())
                        val valueHolderForParamsTmpValueTmpElementForIdx4 = valueHolderForParamsTmpValueTmpElement.getValue4()
                        GlobalResourceResourceSerializerImpl.write(valueSerializer, valueHolderForParamsTmpValueTmpElementForIdx4)
                    }
                }
            } else {
                valueSerializer.writeInt8(RuntimeType.UNDEFINED.value)
            }
            val valueHolderForType = value.type
            if (valueHolderForType != null) {
                valueSerializer.writeInt8(RuntimeType.OBJECT.value)
                val valueHolderForTypeTmpValue = valueHolderForType!!
                valueSerializer.writeInt32(valueHolderForTypeTmpValue)
            } else {
                valueSerializer.writeInt8(RuntimeType.UNDEFINED.value)
            }
        }
        public fun read(buffer: DeserializerBase): Resource {
            var valueDeserializer: DeserializerBase = buffer
            val bundleNameTmpResult: String = valueDeserializer.readString() as String
            val moduleNameTmpResult: String = valueDeserializer.readString() as String
            val idTmpResult: Long = valueDeserializer.readInt64()
            val paramsTmpBufRuntimeType = valueDeserializer.readInt8() as Byte
            var paramsTmpBuf: ArrayList<Union_String_I32_I64_F64_Global_Resource_Resource>? = null
            if ((RuntimeType.UNDEFINED.value) != (paramsTmpBufRuntimeType)) {
                val paramsTmpBufOptLength: Int = valueDeserializer.readInt32()
                var paramsTmpBufOpt: ArrayList<Union_String_I32_I64_F64_Global_Resource_Resource> = ArrayList<Union_String_I32_I64_F64_Global_Resource_Resource>(paramsTmpBufOptLength)
                paramsTmpBufOpt = ArrayList<Union_String_I32_I64_F64_Global_Resource_Resource>(paramsTmpBufOptLength)
                for (paramsTmpBufOptBufCounterI in 0..paramsTmpBufOptLength) {
                    val paramsTmpBufOptTempBufUnionSelector: Byte = valueDeserializer.readInt8()
                    var paramsTmpBufOptTempBuf: Union_String_I32_I64_F64_Global_Resource_Resource? 
                    if (paramsTmpBufOptTempBufUnionSelector == 0.toByte()) {
                        paramsTmpBufOptTempBuf = Union_String_I32_I64_F64_Global_Resource_Resource(valueDeserializer.readString() as String)
                    } else if (paramsTmpBufOptTempBufUnionSelector == 1.toByte()) {
                        paramsTmpBufOptTempBuf = Union_String_I32_I64_F64_Global_Resource_Resource(valueDeserializer.readInt32())
                    } else if (paramsTmpBufOptTempBufUnionSelector == 2.toByte()) {
                        paramsTmpBufOptTempBuf = Union_String_I32_I64_F64_Global_Resource_Resource(valueDeserializer.readInt64())
                    } else if (paramsTmpBufOptTempBufUnionSelector == 3.toByte()) {
                        paramsTmpBufOptTempBuf = Union_String_I32_I64_F64_Global_Resource_Resource(valueDeserializer.readFloat64())
                    } else if (paramsTmpBufOptTempBufUnionSelector == 4.toByte()) {
                        paramsTmpBufOptTempBuf = Union_String_I32_I64_F64_Global_Resource_Resource(GlobalResourceResourceSerializerImpl.read(valueDeserializer))
                    } else {
                        throw Error("One of the branches for paramsTmpBufOptTempBuf has to be chosen through deserialisation.")
                    }
                    paramsTmpBufOpt[paramsTmpBufOptBufCounterI] = paramsTmpBufOptTempBuf as Union_String_I32_I64_F64_Global_Resource_Resource
                }
                paramsTmpBuf = paramsTmpBufOpt
            }
            val paramsTmpResult: ArrayList<Union_String_I32_I64_F64_Global_Resource_Resource>? = paramsTmpBuf
            val typeTmpBufRuntimeType = valueDeserializer.readInt8() as Byte
            var typeTmpBuf: Int? = null
            if ((RuntimeType.UNDEFINED.value) != (typeTmpBufRuntimeType)) {
                typeTmpBuf = valueDeserializer.readInt32()
            }
            val typeTmpResult: Int? = typeTmpBuf
            var value: Resource = object: Resource { override var bundleName = bundleNameTmpResult; override var moduleName = moduleNameTmpResult; override var id = idTmpResult; override var params = paramsTmpResult; override var type = typeTmpResult}
            return value
        }
    }
}
