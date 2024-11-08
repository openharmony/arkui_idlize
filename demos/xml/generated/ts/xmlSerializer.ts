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

import { SerializerBase, Tags, RuntimeType, runtimeType, isInstanceOf } from "./SerializerBase"
import { int32 } from "./types"
import { getXMLNativeModule, CallbackKind } from "./xmlNative"
import { ParseInfo, ParseOptions } from "./xml"

export class Serializer extends SerializerBase {
    private static cache: Serializer | undefined = undefined
    static hold(): Serializer {
        let serializer = Serializer.cache
        if ((serializer) == (undefined))
            {
                serializer = new Serializer()
                Serializer.cache = serializer
            }
        if (serializer.isHolding)
            throw new Error("Serializer is already being held. Check if you had released is before")
        serializer.isHolding = true
        return serializer
    }
    writeArrayBuffer(value: ArrayBuffer): void {
        let valueSerializer: Serializer = this
        const value_byteLength = value.byteLength
        valueSerializer.writeNumber(value_byteLength)
    }
    writeParseInfo(value: ParseInfo): void {
        let valueSerializer: Serializer = this
        const peer = value.getPeer()
        if (peer != undefined) {
            valueSerializer.writePointer(peer.ptr);
        }
    }
    writeParseOptions(value: ParseOptions): void {
        let valueSerializer: Serializer = this
        const value_supportDoctype = value.supportDoctype
        let value_supportDoctype_type: int32 = RuntimeType.UNDEFINED
        value_supportDoctype_type = runtimeType(value_supportDoctype)
        valueSerializer.writeInt8(value_supportDoctype_type)
        if ((RuntimeType.UNDEFINED) != (value_supportDoctype_type)) {
            const value_supportDoctype_value = value_supportDoctype!
            valueSerializer.writeBoolean(value_supportDoctype_value)
        }
        const value_ignoreNameSpace = value.ignoreNameSpace
        let value_ignoreNameSpace_type: int32 = RuntimeType.UNDEFINED
        value_ignoreNameSpace_type = runtimeType(value_ignoreNameSpace)
        valueSerializer.writeInt8(value_ignoreNameSpace_type)
        if ((RuntimeType.UNDEFINED) != (value_ignoreNameSpace_type)) {
            const value_ignoreNameSpace_value = value_ignoreNameSpace!
            valueSerializer.writeBoolean(value_ignoreNameSpace_value)
        }
        const value_tagValueCallbackFunction = value.tagValueCallbackFunction
        let value_tagValueCallbackFunction_type: int32 = RuntimeType.UNDEFINED
        value_tagValueCallbackFunction_type = runtimeType(value_tagValueCallbackFunction)
        valueSerializer.writeInt8(value_tagValueCallbackFunction_type)
        if ((RuntimeType.UNDEFINED) != (value_tagValueCallbackFunction_type)) {
            const value_tagValueCallbackFunction_value = value_tagValueCallbackFunction!
            valueSerializer.holdAndWriteCallback(value_tagValueCallbackFunction_value, CallbackKind.Kind_Callback_String_String_Boolean)
        }
        const value_attributeValueCallbackFunction = value.attributeValueCallbackFunction
        let value_attributeValueCallbackFunction_type: int32 = RuntimeType.UNDEFINED
        value_attributeValueCallbackFunction_type = runtimeType(value_attributeValueCallbackFunction)
        valueSerializer.writeInt8(value_attributeValueCallbackFunction_type)
        if ((RuntimeType.UNDEFINED) != (value_attributeValueCallbackFunction_type)) {
            const value_attributeValueCallbackFunction_value = value_attributeValueCallbackFunction!
            valueSerializer.holdAndWriteCallback(value_attributeValueCallbackFunction_value, CallbackKind.Kind_Callback_String_String_Boolean)
        }
        const value_tokenValueCallbackFunction = value.tokenValueCallbackFunction
        let value_tokenValueCallbackFunction_type: int32 = RuntimeType.UNDEFINED
        value_tokenValueCallbackFunction_type = runtimeType(value_tokenValueCallbackFunction)
        valueSerializer.writeInt8(value_tokenValueCallbackFunction_type)
        if ((RuntimeType.UNDEFINED) != (value_tokenValueCallbackFunction_type)) {
            const value_tokenValueCallbackFunction_value = value_tokenValueCallbackFunction!
            valueSerializer.holdAndWriteCallback(value_tokenValueCallbackFunction_value, CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean)
        }
    }
}
