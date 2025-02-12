package idlize

import std.collection.*
import Interop.*


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
        return {eventType: EventType, value: ParseInfo => 
    let _argsSerializer: Serializer = Serializer.hold();
    _argsSerializer.writeInt32(_resource.resourceId);
    _argsSerializer.writePointer(_call);
    _argsSerializer.writePointer(_callSync);
    _argsSerializer.writeInt32(eventType.value);
    _argsSerializer.writeParseInfo(value);
    let _continuationValue = BoolHolder(None<Bool>);
    let _continuationCallback: ((value: Bool) -> Unit) = {value: Bool =>     _continuationValue.value = value; }
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
        return {name: String, value: String => 
    let _argsSerializer: Serializer = Serializer.hold();
    _argsSerializer.writeInt32(_resource.resourceId);
    _argsSerializer.writePointer(_call);
    _argsSerializer.writePointer(_callSync);
    _argsSerializer.writeString(name);
    _argsSerializer.writeString(value);
    let _continuationValue = BoolHolder(None<Bool>);
    let _continuationCallback: ((value: Bool) -> Unit) = {value: Bool =>     _continuationValue.value = value; }
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
        return {value: Bool => 
    let _argsSerializer: Serializer = Serializer.hold();
    _argsSerializer.writeInt32(_resource.resourceId);
    _argsSerializer.writePointer(_call);
    _argsSerializer.writePointer(_callSync);
    _argsSerializer.writeBoolean(value);
    if (isSync) { InteropNativeModule._CallCallbackSync(313269291, _argsSerializer.asArray(), _argsSerializer.length()) } else { InteropNativeModule._CallCallback(313269291, _argsSerializer.asArray(), _argsSerializer.length()) };
    _argsSerializer.release();
    return; }
    }
    func readXmlPullParser(): XmlPullParser {
        var valueDeserializer: Deserializer = this
        var ptr: UInt64 = valueDeserializer.readPointer()
        return XmlPullParserInternal.fromPtr(ptr)
    }
    func readParseInfo(): ParseInfo {
        var valueDeserializer: Deserializer = this
        var ptr: UInt64 = valueDeserializer.readPointer()
        return ParseInfoInternal.fromPtr(ptr)
    }
    func readXmlSerializer(): XmlSerializer {
        var valueDeserializer: Deserializer = this
        var ptr: UInt64 = valueDeserializer.readPointer()
        return XmlSerializerInternal.fromPtr(ptr)
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