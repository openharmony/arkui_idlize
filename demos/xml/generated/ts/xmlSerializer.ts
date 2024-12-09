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

import { xml, ParseInfo, ParseInfoInternal, ParseOptions } from "./xml"
import { SerializerBase, RuntimeType, runtimeType, CallbackResource, unsafeCast } from "./SerializerBase"
import { DeserializerBase } from "./DeserializerBase"
import { int32 } from "@koalaui/common"
import { KPointer, KInt, KStringPtr, KUint8ArrayPtr, nullptr, ResourceHolder } from "@koalaui/interop"
import { getXMLNativeModule, CallbackKind } from "./xmlNative"
import { Finalizable, MaterializedBase } from "./xmlFinalizable"

export class Serializer extends SerializerBase {
    private static cache?: Serializer | undefined = undefined
    static hold(): Serializer {
        if (!(Serializer.cache != undefined))
            {
                Serializer.cache = new Serializer()
            }
        let serializer = (Serializer.cache)!
        if (serializer.isHolding)
            {
                throw new Error("Serializer is already being held. Check if you had released is before")
            }
        serializer.isHolding = true
        return serializer
    }
    writeParseInfo(value: ParseInfo): void {
        let valueSerializer: Serializer = this
        const base: MaterializedBase = unsafeCast<MaterializedBase>(value)
        const peer = base.getPeer()
        let ptr: KPointer = nullptr
        if (peer != undefined)
            ptr = peer.ptr
        valueSerializer.writePointer(ptr)
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
            valueSerializer.holdAndWriteCallback(value_tagValueCallbackFunction_value)
        }
        const value_attributeValueCallbackFunction = value.attributeValueCallbackFunction
        let value_attributeValueCallbackFunction_type: int32 = RuntimeType.UNDEFINED
        value_attributeValueCallbackFunction_type = runtimeType(value_attributeValueCallbackFunction)
        valueSerializer.writeInt8(value_attributeValueCallbackFunction_type)
        if ((RuntimeType.UNDEFINED) != (value_attributeValueCallbackFunction_type)) {
            const value_attributeValueCallbackFunction_value = value_attributeValueCallbackFunction!
            valueSerializer.holdAndWriteCallback(value_attributeValueCallbackFunction_value)
        }
        const value_tokenValueCallbackFunction = value.tokenValueCallbackFunction
        let value_tokenValueCallbackFunction_type: int32 = RuntimeType.UNDEFINED
        value_tokenValueCallbackFunction_type = runtimeType(value_tokenValueCallbackFunction)
        valueSerializer.writeInt8(value_tokenValueCallbackFunction_type)
        if ((RuntimeType.UNDEFINED) != (value_tokenValueCallbackFunction_type)) {
            const value_tokenValueCallbackFunction_value = value_tokenValueCallbackFunction!
            valueSerializer.holdAndWriteCallback(value_tokenValueCallbackFunction_value)
        }
    }
}

export class Deserializer extends DeserializerBase {
    readCallback_EventType_ParseInfo_Boolean(): ((eventType: xml.EventType, value: ParseInfo) => boolean) {
        const _resource: CallbackResource = this.readCallbackResource()
        const _call: KPointer = this.readPointer()
        return (eventType: xml.EventType, value: ParseInfo): boolean => { const _argsSerializer: Serializer = Serializer.hold(); _argsSerializer.writeInt32(_resource.resourceId); _argsSerializer.writePointer(_call); _argsSerializer.writeInt32(eventType); _argsSerializer.writeParseInfo(value); let _continuationValue: boolean | undefined|undefined; const _continuationCallback: ((value: boolean) => void) = (value: boolean): void => { _continuationValue = value; }; _argsSerializer.holdAndWriteCallback(_continuationCallback); getXMLNativeModule()._CallCallback(240036623, _argsSerializer.asArray(), _argsSerializer.length()); _argsSerializer.release(); return (_continuationValue as boolean); }
    }
    readCallback_String_String_Boolean(): ((name: string, value: string) => boolean) {
        const _resource: CallbackResource = this.readCallbackResource()
        const _call: KPointer = this.readPointer()
        return (name: string, value: string): boolean => { const _argsSerializer: Serializer = Serializer.hold(); _argsSerializer.writeInt32(_resource.resourceId); _argsSerializer.writePointer(_call); _argsSerializer.writeString(name); _argsSerializer.writeString(value); let _continuationValue: boolean | undefined|undefined; const _continuationCallback: ((value: boolean) => void) = (value: boolean): void => { _continuationValue = value; }; _argsSerializer.holdAndWriteCallback(_continuationCallback); getXMLNativeModule()._CallCallback(923368928, _argsSerializer.asArray(), _argsSerializer.length()); _argsSerializer.release(); return (_continuationValue as boolean); }
    }
    readCallback_Boolean_Void(): ((value: boolean) => void) {
        const _resource: CallbackResource = this.readCallbackResource()
        const _call: KPointer = this.readPointer()
        return (value: boolean): void => { const _argsSerializer: Serializer = Serializer.hold(); _argsSerializer.writeInt32(_resource.resourceId); _argsSerializer.writePointer(_call); _argsSerializer.writeBoolean(value); getXMLNativeModule()._CallCallback(313269291, _argsSerializer.asArray(), _argsSerializer.length()); _argsSerializer.release(); return; }
    }
    readParseInfo(): ParseInfo {
        let valueDeserializer: Deserializer = this
        let ptr: KPointer = valueDeserializer.readPointer()
        return ParseInfoInternal.fromPtr(ptr)
    }
    readParseOptions(): ParseOptions {
        let valueDeserializer: Deserializer = this
        const supportDoctype_buf_runtimeType = (valueDeserializer.readInt8() as int32)
        let supportDoctype_buf: boolean | undefined|undefined 
        if ((RuntimeType.UNDEFINED) != (supportDoctype_buf_runtimeType))
            {
                supportDoctype_buf = valueDeserializer.readBoolean()
            }
        const supportDoctype_result: boolean | undefined|undefined = supportDoctype_buf
        const ignoreNameSpace_buf_runtimeType = (valueDeserializer.readInt8() as int32)
        let ignoreNameSpace_buf: boolean | undefined|undefined 
        if ((RuntimeType.UNDEFINED) != (ignoreNameSpace_buf_runtimeType))
            {
                ignoreNameSpace_buf = valueDeserializer.readBoolean()
            }
        const ignoreNameSpace_result: boolean | undefined|undefined = ignoreNameSpace_buf
        const tagValueCallbackFunction_buf_runtimeType = (valueDeserializer.readInt8() as int32)
        let tagValueCallbackFunction_buf: ((name: string, value: string) => boolean) | undefined|undefined 
        if ((RuntimeType.UNDEFINED) != (tagValueCallbackFunction_buf_runtimeType))
            {
                tagValueCallbackFunction_buf = valueDeserializer.readCallback_String_String_Boolean()
            }
        const tagValueCallbackFunction_result: ((name: string, value: string) => boolean) | undefined|undefined = tagValueCallbackFunction_buf
        const attributeValueCallbackFunction_buf_runtimeType = (valueDeserializer.readInt8() as int32)
        let attributeValueCallbackFunction_buf: ((name: string, value: string) => boolean) | undefined|undefined 
        if ((RuntimeType.UNDEFINED) != (attributeValueCallbackFunction_buf_runtimeType))
            {
                attributeValueCallbackFunction_buf = valueDeserializer.readCallback_String_String_Boolean()
            }
        const attributeValueCallbackFunction_result: ((name: string, value: string) => boolean) | undefined|undefined = attributeValueCallbackFunction_buf
        const tokenValueCallbackFunction_buf_runtimeType = (valueDeserializer.readInt8() as int32)
        let tokenValueCallbackFunction_buf: ((eventType: xml.EventType, value: ParseInfo) => boolean) | undefined|undefined 
        if ((RuntimeType.UNDEFINED) != (tokenValueCallbackFunction_buf_runtimeType))
            {
                tokenValueCallbackFunction_buf = valueDeserializer.readCallback_EventType_ParseInfo_Boolean()
            }
        const tokenValueCallbackFunction_result: ((eventType: xml.EventType, value: ParseInfo) => boolean) | undefined|undefined = tokenValueCallbackFunction_buf
        let value: ParseOptions = ({supportDoctype: supportDoctype_result,ignoreNameSpace: ignoreNameSpace_result,tagValueCallbackFunction: tagValueCallbackFunction_result,attributeValueCallbackFunction: attributeValueCallbackFunction_result,tokenValueCallbackFunction: tokenValueCallbackFunction_result} as ParseOptions)
        return value
    }
}
export function deserializeAndCallCallback_Boolean_Void(thisDeserializer: Deserializer) {
    const _resourceId: int32 = thisDeserializer.readInt32()
    const _call = (ResourceHolder.instance().get(_resourceId) as ((value: boolean) => void))
    let value: boolean = thisDeserializer.readBoolean()
    _call(value)
}
export function deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisDeserializer: Deserializer) {
    const _resourceId: int32 = thisDeserializer.readInt32()
    const _call = (ResourceHolder.instance().get(_resourceId) as ((eventType: xml.EventType, value: ParseInfo) => boolean))
    let eventType: xml.EventType = (thisDeserializer.readInt32() as xml.EventType)
    let value: ParseInfo = (thisDeserializer.readParseInfo() as ParseInfo)
    let _continuation: ((value: boolean) => void) = thisDeserializer.readCallback_Boolean_Void()
    _continuation(_call(eventType, value))
}
export function deserializeAndCallCallback_String_String_Boolean(thisDeserializer: Deserializer) {
    const _resourceId: int32 = thisDeserializer.readInt32()
    const _call = (ResourceHolder.instance().get(_resourceId) as ((name: string, value: string) => boolean))
    let name: string = (thisDeserializer.readString() as string)
    let value: string = (thisDeserializer.readString() as string)
    let _continuation: ((value: boolean) => void) = thisDeserializer.readCallback_Boolean_Void()
    _continuation(_call(name, value))
}
export function deserializeAndCallCallback(thisDeserializer: Deserializer) {
    const kind: int32 = thisDeserializer.readInt32()
    switch (kind) {
        case 313269291/*CallbackKind.Kind_Callback_Boolean_Void*/: return deserializeAndCallCallback_Boolean_Void(thisDeserializer);
        case 240036623/*CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean*/: return deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisDeserializer);
        case 923368928/*CallbackKind.Kind_Callback_String_String_Boolean*/: return deserializeAndCallCallback_String_String_Boolean(thisDeserializer);
    }
    throw new Error("Unknown callback kind")
}