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

import { int32, int64, float32, unsafeCast } from '@koalaui/common'
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr, SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, toPeerPtr, nullptr, KSerializerBuffer, KUint8ArrayPtr } from '@koalaui/interop'
export interface InternalInterface {
    name: string;
}
export class internal_InternalInterface_serializer {
    public static write(buffer: SerializerBase, value: InternalInterface): void {
        let valueSerializer: SerializerBase = buffer
        const valueHolderForName = value.name
        valueSerializer.writeString(valueHolderForName)
    }
    public static read(buffer: DeserializerBase): InternalInterface {
        let valueDeserializer: DeserializerBase = buffer
        const nameTmpResult: string = (valueDeserializer.readString() as string)
        let value: InternalInterface = ({name: nameTmpResult} as InternalInterface)
        return value
    }
}
export enum InternalEnumString {
    E1 = "e1",
    E2 = "e2"
}
export function InternalInternalEnumStringToOrdinal(value: InternalEnumString): int32 {
    switch (value) {
        case InternalEnumString.E1: return 0
        case InternalEnumString.E2: return 1
    }
    throw new Error(`Unexpected value ${value} for enum InternalEnumString`)
}
