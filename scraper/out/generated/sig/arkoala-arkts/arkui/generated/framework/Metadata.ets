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

import { Metadata } from "@bundleManager.Metadata"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
export class Metadata_serializer {
    public static write(buffer: SerializerBase, value: Metadata): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForValue  = value.value
        valueSerializer.writeString(valueHolderForValue)
        const valueHolderForResource  = value.resource
        valueSerializer.writeString(valueHolderForResource)
        const valueHolderForValueId  = value.valueId
        if (valueHolderForValueId !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForValueIdTmpValue  = valueHolderForValueId!
            valueSerializer.writeInt64(valueHolderForValueIdTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): Metadata {
        let valueDeserializer : DeserializerBase = buffer
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const valueTmpResult : string = (valueDeserializer.readString() as string)
        const resourceTmpResult : string = (valueDeserializer.readString() as string)
        const valueIdTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let valueIdTmpBuf : int64 | undefined
        if ((valueIdTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            valueIdTmpBuf = valueDeserializer.readInt64()
        }
        const valueIdTmpResult : int64 | undefined = valueIdTmpBuf
        let value : Metadata = ({name: nameTmpResult, value: valueTmpResult, resource: resourceTmpResult, valueId: valueIdTmpResult} as Metadata)
        return value
    }
}
