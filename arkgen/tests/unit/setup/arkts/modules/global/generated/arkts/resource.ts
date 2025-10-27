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

import { int32, int64 } from '@koalaui/common'
import { SerializerBase, DeserializerBase, RuntimeType } from '@koalaui/interop'
export interface Resource {
    bundleName: string;
    moduleName: string;
    id: int64;
    params?: Array<string | int32 | int64 | double | Resource>;
    type?: int32;
}
export class GlobalResourceResourceSerializerImpl {
    public static write(buffer: SerializerBase, value: Resource): void {
        let valueSerializer: SerializerBase = buffer
        const valueHolderForBundleName = value.bundleName
        valueSerializer.writeString(valueHolderForBundleName)
        const valueHolderForModuleName = value.moduleName
        valueSerializer.writeString(valueHolderForModuleName)
        const valueHolderForId = value.id
        valueSerializer.writeInt64(valueHolderForId)
        const valueHolderForParams = value.params
        if (valueHolderForParams !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForParamsTmpValue = valueHolderForParams!
            valueSerializer.writeInt32((valueHolderForParamsTmpValue.length).toInt())
            for (let valueHolderForParamsTmpValueCounterI = 0; valueHolderForParamsTmpValueCounterI < valueHolderForParamsTmpValue.length; valueHolderForParamsTmpValueCounterI++) {
                const valueHolderForParamsTmpValueTmpElement: string | int32 | int64 | double | Resource = valueHolderForParamsTmpValue[valueHolderForParamsTmpValueCounterI]
                if (valueHolderForParamsTmpValueTmpElement instanceof string) {
                    valueSerializer.writeInt8((0).toChar())
                    const valueHolderForParamsTmpValueTmpElementForIdx0 = valueHolderForParamsTmpValueTmpElement as string
                    valueSerializer.writeString(valueHolderForParamsTmpValueTmpElementForIdx0)
                } else if (valueHolderForParamsTmpValueTmpElement instanceof int32) {
                    valueSerializer.writeInt8((1).toChar())
                    const valueHolderForParamsTmpValueTmpElementForIdx1 = valueHolderForParamsTmpValueTmpElement as int32
                    valueSerializer.writeInt32(valueHolderForParamsTmpValueTmpElementForIdx1)
                } else if (valueHolderForParamsTmpValueTmpElement instanceof int64) {
                    valueSerializer.writeInt8((2).toChar())
                    const valueHolderForParamsTmpValueTmpElementForIdx2 = valueHolderForParamsTmpValueTmpElement as int64
                    valueSerializer.writeInt64(valueHolderForParamsTmpValueTmpElementForIdx2)
                } else if (valueHolderForParamsTmpValueTmpElement instanceof double) {
                    valueSerializer.writeInt8((3).toChar())
                    const valueHolderForParamsTmpValueTmpElementForIdx3 = valueHolderForParamsTmpValueTmpElement as double
                    valueSerializer.writeFloat64(valueHolderForParamsTmpValueTmpElementForIdx3)
                } else if (valueHolderForParamsTmpValueTmpElement instanceof Resource) {
                    valueSerializer.writeInt8((4).toChar())
                    const valueHolderForParamsTmpValueTmpElementForIdx4 = valueHolderForParamsTmpValueTmpElement as Resource
                    GlobalResourceResourceSerializerImpl.write(valueSerializer, valueHolderForParamsTmpValueTmpElementForIdx4)
                }
            }
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForType = value.type
        if (valueHolderForType !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForTypeTmpValue = valueHolderForType!
            valueSerializer.writeInt32(valueHolderForTypeTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): Resource {
        let valueDeserializer: DeserializerBase = buffer
        const bundleNameTmpResult: string = (valueDeserializer.readString() as string)
        const moduleNameTmpResult: string = (valueDeserializer.readString() as string)
        const idTmpResult: int64 = valueDeserializer.readInt64()
        const paramsTmpBufRuntimeType = valueDeserializer.readInt8()!.toInt()
        let paramsTmpBuf: Array<string | int32 | int64 | double | Resource> | undefined = undefined
        if ((paramsTmpBufRuntimeType) != (RuntimeType.UNDEFINED)) {
            const paramsTmpBufOptLength: int32 = valueDeserializer.readInt32()
            let paramsTmpBufOpt: Array<string | int32 | int64 | double | Resource> = new Array<string | int32 | int64 | double | Resource>(paramsTmpBufOptLength)
            for (let paramsTmpBufOptBufCounterI = 0; paramsTmpBufOptBufCounterI < paramsTmpBufOptLength; paramsTmpBufOptBufCounterI++) {
                const paramsTmpBufOptTempBufUnionSelector: int32 = valueDeserializer.readInt8()
                let paramsTmpBufOptTempBuf: string | int32 | int64 | double | Resource | undefined
                if (paramsTmpBufOptTempBufUnionSelector == (0).toChar()) {
                    paramsTmpBufOptTempBuf = (valueDeserializer.readString() as string)
                } else if (paramsTmpBufOptTempBufUnionSelector == (1).toChar()) {
                    paramsTmpBufOptTempBuf = valueDeserializer.readInt32()
                } else if (paramsTmpBufOptTempBufUnionSelector == (2).toChar()) {
                    paramsTmpBufOptTempBuf = valueDeserializer.readInt64()
                } else if (paramsTmpBufOptTempBufUnionSelector == (3).toChar()) {
                    paramsTmpBufOptTempBuf = valueDeserializer.readFloat64()
                } else if (paramsTmpBufOptTempBufUnionSelector == (4).toChar()) {
                    paramsTmpBufOptTempBuf = GlobalResourceResourceSerializerImpl.read(valueDeserializer)
                } else {
                    throw new Error('One of the branches for paramsTmpBufOptTempBuf has to be chosen through deserialisation.')
                }
                paramsTmpBufOpt[paramsTmpBufOptBufCounterI] = (paramsTmpBufOptTempBuf as string | int32 | int64 | double | Resource)
            }
            paramsTmpBuf = paramsTmpBufOpt
        }
        const paramsTmpResult: Array<string | int32 | int64 | double | Resource> | undefined = paramsTmpBuf
        const typeTmpBufRuntimeType = valueDeserializer.readInt8()!.toInt()
        let typeTmpBuf: int32 | undefined = undefined
        if ((typeTmpBufRuntimeType) != (RuntimeType.UNDEFINED)) {
            typeTmpBuf = valueDeserializer.readInt32()
        }
        const typeTmpResult: int32 | undefined = typeTmpBuf
        let value: Resource = ({bundleName: bundleNameTmpResult, moduleName: moduleNameTmpResult, id: idTmpResult, params: paramsTmpResult, type: typeTmpResult} as Resource)
        return value
    }
}
