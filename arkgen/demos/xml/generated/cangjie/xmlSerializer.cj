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

package idlize

import std.collection.*
import Interop.*

public open class Serializer <: SerializerBase {
    static private var nullptr: UInt64 = 0
    private static var pool: Option<ArrayList<Serializer>> = None<ArrayList<Serializer>>
    private static var poolTop: Int32 = -1
    static func hold(): Serializer {
        if (!(Serializer.pool.isSome()))
        {
            Serializer.pool = ArrayList<Serializer>(8, {idx => Serializer()});
        }
        let pool: ArrayList<Serializer> = match (Serializer.pool) {
case Some(serializer) => serializer 
case _ => throw Exception("Unmatched pattern Serializer.pool")
}
        if (Serializer.poolTop >= Int32(pool.size) - 1)
        {
            throw Exception("Serializer pool is full. Check if you had released serializers before")
        }
        Serializer.poolTop = Serializer.poolTop + 1
        var serializer = pool[Int64(Serializer.poolTop)]
        return serializer
    }
    public func release(): Unit {
        if (Serializer.poolTop == -1)
        {
            throw Exception("Serializer pool is empty. Check if you had hold serializers before")
        }
        let pool: ArrayList<Serializer> = match (Serializer.pool) {
case Some(serializer) => serializer 
case _ => throw Exception("Unmatched pattern Serializer.pool")
}
        if (refEq(this, pool[Int64(Serializer.poolTop)]))
        {
            Serializer.poolTop = Serializer.poolTop - 1
            super.release();
            return
        }
        throw Exception("Only last serializer should be released")
    }
    func writeParseOptions(value: ParseOptions): Unit {
        var valueSerializer: Serializer = this
        let value_supportDoctype = value.supportDoctype
        var value_supportDoctype_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_supportDoctype) <- value_supportDoctype) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_supportDoctype_value = value_supportDoctype
            valueSerializer.writeBoolean(value_supportDoctype_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_ignoreNameSpace = value.ignoreNameSpace
        var value_ignoreNameSpace_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_ignoreNameSpace) <- value_ignoreNameSpace) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_ignoreNameSpace_value = value_ignoreNameSpace
            valueSerializer.writeBoolean(value_ignoreNameSpace_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_tagValueCallbackFunction = value.tagValueCallbackFunction
        var value_tagValueCallbackFunction_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_tagValueCallbackFunction) <- value_tagValueCallbackFunction) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_tagValueCallbackFunction_value = value_tagValueCallbackFunction
            valueSerializer.holdAndWriteCallback(value_tagValueCallbackFunction_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_attributeValueCallbackFunction = value.attributeValueCallbackFunction
        var value_attributeValueCallbackFunction_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_attributeValueCallbackFunction) <- value_attributeValueCallbackFunction) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_attributeValueCallbackFunction_value = value_attributeValueCallbackFunction
            valueSerializer.holdAndWriteCallback(value_attributeValueCallbackFunction_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let value_tokenValueCallbackFunction = value.tokenValueCallbackFunction
        var value_tokenValueCallbackFunction_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(value_tokenValueCallbackFunction) <- value_tokenValueCallbackFunction) {
            valueSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let value_tokenValueCallbackFunction_value = value_tokenValueCallbackFunction
            valueSerializer.holdAndWriteCallback(value_tokenValueCallbackFunction_value)
        }
        else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
    }
    func writeParseInfo(value: ParseInfo): Unit {
        var valueSerializer: Serializer = this
        if (value is MaterializedBase)
        {
            let base: MaterializedBase = match (value as MaterializedBase) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
            let peer = base.getPeer()
            var ptr: UInt64 = nullptr
            if (let Some(peer) <- peer) {
                ptr = peer.ptr
            }
            valueSerializer.writePointer(ptr);
            return
        }
        else
        {
            throw Exception("Value is not a MaterializedBase instance!")
        }
    }
}

public open class Deserializer <: DeserializerBase {
    Deserializer(data: Array<UInt8>, length: Int64) {
        super(data, length)
    }
    func readXML_Callback_EventType_ParseInfo_Boolean(): ((eventType: EventType, value: ParseInfo) -> Bool) {
        this.readXML_Callback_EventType_ParseInfo_Boolean(false)
    }
    func readXML_Callback_EventType_ParseInfo_Boolean(isSync: Bool): ((eventType: EventType, value: ParseInfo) -> Bool) {
        let _resource: CallbackResource = this.readCallbackResource()
        let _call: UInt64 = this.readPointer()
        let _callSync: UInt64 = this.readPointer()
        return {eventType: EventType, value: ParseInfo => let _argsSerializer: Serializer = Serializer.hold();
_argsSerializer.writeInt32(_resource.resourceId);
_argsSerializer.writePointer(_call);
_argsSerializer.writePointer(_callSync);
_argsSerializer.writeInt32(eventType.value);
_argsSerializer.writeParseInfo(value);
let _continuationValue = BoolHolder(None<Bool>);
let _continuationCallback: ((value: Bool) -> Unit) = {value: Bool => _continuationValue.value = value; }
_argsSerializer.holdAndWriteCallback(_continuationCallback);
if (isSync) { InteropNativeModule._CallCallbackSync(240036623, _argsSerializer.asArray(), _argsSerializer.length()) } else { InteropNativeModule._CallCallback(240036623, _argsSerializer.asArray(), _argsSerializer.length()) };
_argsSerializer.release();
return match (_continuationValue.value as Bool) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")} }
    }
    func readXML_Callback_String_String_Boolean(): ((name: String, value: String) -> Bool) {
        this.readXML_Callback_String_String_Boolean(false)
    }
    func readXML_Callback_String_String_Boolean(isSync: Bool): ((name: String, value: String) -> Bool) {
        let _resource: CallbackResource = this.readCallbackResource()
        let _call: UInt64 = this.readPointer()
        let _callSync: UInt64 = this.readPointer()
        return {name: String, value: String => let _argsSerializer: Serializer = Serializer.hold();
_argsSerializer.writeInt32(_resource.resourceId);
_argsSerializer.writePointer(_call);
_argsSerializer.writePointer(_callSync);
_argsSerializer.writeString(name);
_argsSerializer.writeString(value);
let _continuationValue = BoolHolder(None<Bool>);
let _continuationCallback: ((value: Bool) -> Unit) = {value: Bool => _continuationValue.value = value; }
_argsSerializer.holdAndWriteCallback(_continuationCallback);
if (isSync) { InteropNativeModule._CallCallbackSync(923368928, _argsSerializer.asArray(), _argsSerializer.length()) } else { InteropNativeModule._CallCallback(923368928, _argsSerializer.asArray(), _argsSerializer.length()) };
_argsSerializer.release();
return match (_continuationValue.value as Bool) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")} }
    }
    func readParseOptions(): ParseOptions {
        var valueDeserializer: Deserializer = this
        let supportDoctype_buf_runtimeType = match (valueDeserializer.readInt8() as Float64) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
        var supportDoctype_buf: Option<Bool> = Option.None
        if ((RuntimeType.UNDEFINED.ordinal) != (Int32(supportDoctype_buf_runtimeType)))
        {
            supportDoctype_buf = valueDeserializer.readBoolean()
        }
        let supportDoctype_result: Option<Bool> = supportDoctype_buf
        let ignoreNameSpace_buf_runtimeType = match (valueDeserializer.readInt8() as Float64) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
        var ignoreNameSpace_buf: Option<Bool> = Option.None
        if ((RuntimeType.UNDEFINED.ordinal) != (Int32(ignoreNameSpace_buf_runtimeType)))
        {
            ignoreNameSpace_buf = valueDeserializer.readBoolean()
        }
        let ignoreNameSpace_result: Option<Bool> = ignoreNameSpace_buf
        let tagValueCallbackFunction_buf_runtimeType = match (valueDeserializer.readInt8() as Float64) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
        var tagValueCallbackFunction_buf: Option<((name: String, value: String) -> Bool)> = Option.None
        if ((RuntimeType.UNDEFINED.ordinal) != (Int32(tagValueCallbackFunction_buf_runtimeType)))
        {
            tagValueCallbackFunction_buf = valueDeserializer.readXML_Callback_String_String_Boolean()
        }
        let tagValueCallbackFunction_result: Option<((name: String, value: String) -> Bool)> = tagValueCallbackFunction_buf
        let attributeValueCallbackFunction_buf_runtimeType = match (valueDeserializer.readInt8() as Float64) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
        var attributeValueCallbackFunction_buf: Option<((name: String, value: String) -> Bool)> = Option.None
        if ((RuntimeType.UNDEFINED.ordinal) != (Int32(attributeValueCallbackFunction_buf_runtimeType)))
        {
            attributeValueCallbackFunction_buf = valueDeserializer.readXML_Callback_String_String_Boolean()
        }
        let attributeValueCallbackFunction_result: Option<((name: String, value: String) -> Bool)> = attributeValueCallbackFunction_buf
        let tokenValueCallbackFunction_buf_runtimeType = match (valueDeserializer.readInt8() as Float64) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
        var tokenValueCallbackFunction_buf: Option<((eventType: EventType, value: ParseInfo) -> Bool)> = Option.None
        if ((RuntimeType.UNDEFINED.ordinal) != (Int32(tokenValueCallbackFunction_buf_runtimeType)))
        {
            tokenValueCallbackFunction_buf = valueDeserializer.readXML_Callback_EventType_ParseInfo_Boolean()
        }
        let tokenValueCallbackFunction_result: Option<((eventType: EventType, value: ParseInfo) -> Bool)> = tokenValueCallbackFunction_buf
        var value: ParseOptions = ParseOptions(supportDoctype_result, ignoreNameSpace_result, tagValueCallbackFunction_result, attributeValueCallbackFunction_result, tokenValueCallbackFunction_result)
        return value
    }
    func readXML_Callback_Boolean_Void(): ((value: Bool) -> Unit) {
        this.readXML_Callback_Boolean_Void(false)
    }
    func readXML_Callback_Boolean_Void(isSync: Bool): ((value: Bool) -> Unit) {
        let _resource: CallbackResource = this.readCallbackResource()
        let _call: UInt64 = this.readPointer()
        let _callSync: UInt64 = this.readPointer()
        return {value: Bool => let _argsSerializer: Serializer = Serializer.hold();
_argsSerializer.writeInt32(_resource.resourceId);
_argsSerializer.writePointer(_call);
_argsSerializer.writePointer(_callSync);
_argsSerializer.writeBoolean(value);
if (isSync) { InteropNativeModule._CallCallbackSync(313269291, _argsSerializer.asArray(), _argsSerializer.length()) } else { InteropNativeModule._CallCallback(313269291, _argsSerializer.asArray(), _argsSerializer.length()) };
_argsSerializer.release();
return; }
    }
    func readParseInfo(): ParseInfo {
        var valueDeserializer: Deserializer = this
        var ptr: UInt64 = valueDeserializer.readPointer()
        return ParseInfoInternal.fromPtr(ptr)
    }
}
public open class BoolHolder {
    var value: Option<Bool> 
    BoolHolder(arg0: Option<Bool>) {
        this.value = arg0
    }
}
public open class UnitHolder {
    var value: Option<Unit> 
    UnitHolder(arg0: Option<Unit>) {
        this.value = arg0
    }
}
public func deserializeAndCallCallback_Boolean_Void(thisDeserializer: Deserializer): Unit {
    let _resourceId: Int32 = thisDeserializer.readInt32()
    let _call = match (ResourceHolder.instance().get(_resourceId) as ((value: Bool) -> Unit)) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var value: Bool = thisDeserializer.readBoolean()
    _call(value);
}
public type Callback_Boolean_Void = (value: Bool) -> Unit
public func deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisDeserializer: Deserializer): Unit {
    let _resourceId: Int32 = thisDeserializer.readInt32()
    let _call = match (ResourceHolder.instance().get(_resourceId) as ((eventType: EventType, value: ParseInfo) -> Bool)) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var eventType: EventType = match (thisDeserializer.readInt32() as EventType) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var value: ParseInfo = match (thisDeserializer.readParseInfo() as ParseInfo) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var _continuation: ((value: Bool) -> Unit) = thisDeserializer.readXML_Callback_Boolean_Void(true)
    let _callResult = _call(eventType, value)
    _continuation(_callResult);
}
public type Callback_EventType_ParseInfo_Boolean = (eventType: EventType, value: ParseInfo) -> Bool
public func deserializeAndCallCallback_String_String_Boolean(thisDeserializer: Deserializer): Unit {
    let _resourceId: Int32 = thisDeserializer.readInt32()
    let _call = match (ResourceHolder.instance().get(_resourceId) as ((name: String, value: String) -> Bool)) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var name: String = match (thisDeserializer.readString() as String) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var value: String = match (thisDeserializer.readString() as String) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var _continuation: ((value: Bool) -> Unit) = thisDeserializer.readXML_Callback_Boolean_Void(true)
    let _callResult = _call(name, value)
    _continuation(_callResult);
}
public type Callback_String_String_Boolean = (name: String, value: String) -> Bool
public func deserializeAndCallCallback(thisDeserializer: Deserializer): Unit {
    let kind: Int32 = thisDeserializer.readInt32()
    match (kind) {
        case 313269291/*CallbackKind.Kind_Callback_Boolean_Void*/ => return deserializeAndCallCallback_Boolean_Void(thisDeserializer);
        case 240036623/*CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean*/ => return deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisDeserializer);
        case 923368928/*CallbackKind.Kind_Callback_String_String_Boolean*/ => return deserializeAndCallCallback_String_String_Boolean(thisDeserializer);
        case _ => throw Exception()
    }
    throw Exception("Unknown callback kind")
}

