
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "callbacks.h"
#include "ohos_api_generated.h"
#include <string>


template <>
inline OH_XML_RuntimeType runtimeType(const OH_Int32& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Int32* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const XML_Callback_EventType_ParseInfo_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const XML_Callback_EventType_ParseInfo_Boolean* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_XML_Callback_EventType_ParseInfo_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_XML_Callback_EventType_ParseInfo_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const XML_Callback_String_String_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const XML_Callback_String_String_Boolean* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_XML_Callback_String_String_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_XML_Callback_String_String_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const OH_Boolean& value)
{
    return INTEROP_RUNTIME_BOOLEAN;
}
template <>
inline void WriteToString(std::string* result, const Opt_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const OH_XML_ParseOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_XML_ParseOptions* value) {
    result->append("{");
    // OH_Boolean supportDoctype
    result->append(".supportDoctype=");
    WriteToString(result, &value->supportDoctype);
    // OH_Boolean ignoreNameSpace
    result->append(", ");
    result->append(".ignoreNameSpace=");
    WriteToString(result, &value->ignoreNameSpace);
    // XML_Callback_String_String_Boolean tagValueCallbackFunction
    result->append(", ");
    result->append(".tagValueCallbackFunction=");
    WriteToString(result, &value->tagValueCallbackFunction);
    // XML_Callback_String_String_Boolean attributeValueCallbackFunction
    result->append(", ");
    result->append(".attributeValueCallbackFunction=");
    WriteToString(result, &value->attributeValueCallbackFunction);
    // XML_Callback_EventType_ParseInfo_Boolean tokenValueCallbackFunction
    result->append(", ");
    result->append(".tokenValueCallbackFunction=");
    WriteToString(result, &value->tokenValueCallbackFunction);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_ParseOptions* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_ParseOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const XML_Callback_Boolean_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const XML_Callback_Boolean_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_XML_Callback_Boolean_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_XML_Callback_Boolean_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline void WriteToString(std::string* result, const Opt_ParseInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_ParseInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const OH_XML_xml_EventType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_XML_xml_EventType value) {
    result->append("OH_XML_xml_EventType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_xml_EventType* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_xml_EventType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const OH_Buffer& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Buffer* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_XML_RuntimeType runtimeType(const OH_String& value)
{
    return INTEROP_RUNTIME_STRING;
}
template <>
inline void WriteToString(std::string* result, const Opt_String* value) {
    result->append("{.tag=");
    result->append(tagNameExact((OH_Tag)(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_XML_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}


// Serializers

class Serializer : public SerializerBase {
    public:
    Serializer(uint8_t* data, OH_UInt32 dataLength = 0, CallbackResourceHolder* resourceHolder = nullptr) : SerializerBase(data, dataLength, resourceHolder) {
    }
    void writeParseOptions(OH_XML_ParseOptions value)
    {
        Serializer& valueSerializer = *this;
        const auto value_supportDoctype = value.supportDoctype;
        OH_Int32 value_supportDoctype_type = INTEROP_RUNTIME_UNDEFINED;
        value_supportDoctype_type = runtimeType(value_supportDoctype);
        valueSerializer.writeInt8(value_supportDoctype_type);
        if ((INTEROP_RUNTIME_UNDEFINED) != (value_supportDoctype_type)) {
            const auto value_supportDoctype_value = value_supportDoctype.value;
            valueSerializer.writeBoolean(value_supportDoctype_value);
        }
        const auto value_ignoreNameSpace = value.ignoreNameSpace;
        OH_Int32 value_ignoreNameSpace_type = INTEROP_RUNTIME_UNDEFINED;
        value_ignoreNameSpace_type = runtimeType(value_ignoreNameSpace);
        valueSerializer.writeInt8(value_ignoreNameSpace_type);
        if ((INTEROP_RUNTIME_UNDEFINED) != (value_ignoreNameSpace_type)) {
            const auto value_ignoreNameSpace_value = value_ignoreNameSpace.value;
            valueSerializer.writeBoolean(value_ignoreNameSpace_value);
        }
        const auto value_tagValueCallbackFunction = value.tagValueCallbackFunction;
        OH_Int32 value_tagValueCallbackFunction_type = INTEROP_RUNTIME_UNDEFINED;
        value_tagValueCallbackFunction_type = runtimeType(value_tagValueCallbackFunction);
        valueSerializer.writeInt8(value_tagValueCallbackFunction_type);
        if ((INTEROP_RUNTIME_UNDEFINED) != (value_tagValueCallbackFunction_type)) {
            const auto value_tagValueCallbackFunction_value = value_tagValueCallbackFunction.value;
            valueSerializer.writeCallbackResource(value_tagValueCallbackFunction_value.resource);
            valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(value_tagValueCallbackFunction_value.call));
            valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(value_tagValueCallbackFunction_value.callSync));
        }
        const auto value_attributeValueCallbackFunction = value.attributeValueCallbackFunction;
        OH_Int32 value_attributeValueCallbackFunction_type = INTEROP_RUNTIME_UNDEFINED;
        value_attributeValueCallbackFunction_type = runtimeType(value_attributeValueCallbackFunction);
        valueSerializer.writeInt8(value_attributeValueCallbackFunction_type);
        if ((INTEROP_RUNTIME_UNDEFINED) != (value_attributeValueCallbackFunction_type)) {
            const auto value_attributeValueCallbackFunction_value = value_attributeValueCallbackFunction.value;
            valueSerializer.writeCallbackResource(value_attributeValueCallbackFunction_value.resource);
            valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(value_attributeValueCallbackFunction_value.call));
            valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(value_attributeValueCallbackFunction_value.callSync));
        }
        const auto value_tokenValueCallbackFunction = value.tokenValueCallbackFunction;
        OH_Int32 value_tokenValueCallbackFunction_type = INTEROP_RUNTIME_UNDEFINED;
        value_tokenValueCallbackFunction_type = runtimeType(value_tokenValueCallbackFunction);
        valueSerializer.writeInt8(value_tokenValueCallbackFunction_type);
        if ((INTEROP_RUNTIME_UNDEFINED) != (value_tokenValueCallbackFunction_type)) {
            const auto value_tokenValueCallbackFunction_value = value_tokenValueCallbackFunction.value;
            valueSerializer.writeCallbackResource(value_tokenValueCallbackFunction_value.resource);
            valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(value_tokenValueCallbackFunction_value.call));
            valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(value_tokenValueCallbackFunction_value.callSync));
        }
    }
    void writeParseInfo(OH_XML_ParseInfo value)
    {
        Serializer& valueSerializer = *this;
        valueSerializer.writePointer(value.ptr);
    }
};

// Deserializers


class Deserializer : public DeserializerBase {
    public:
    Deserializer(uint8_t* data, OH_Int32 length) : DeserializerBase(data, length) {
    }
    OH_XML_ParseOptions readParseOptions()
    {
        OH_XML_ParseOptions value = {};
        Deserializer& valueDeserializer = *this;
        const auto supportDoctype_buf_runtimeType = static_cast<OH_XML_RuntimeType>(valueDeserializer.readInt8());
        Opt_Boolean supportDoctype_buf = {};
        supportDoctype_buf.tag = supportDoctype_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (supportDoctype_buf_runtimeType))
        {
            supportDoctype_buf.value = valueDeserializer.readBoolean();
        }
        value.supportDoctype = supportDoctype_buf;
        const auto ignoreNameSpace_buf_runtimeType = static_cast<OH_XML_RuntimeType>(valueDeserializer.readInt8());
        Opt_Boolean ignoreNameSpace_buf = {};
        ignoreNameSpace_buf.tag = ignoreNameSpace_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (ignoreNameSpace_buf_runtimeType))
        {
            ignoreNameSpace_buf.value = valueDeserializer.readBoolean();
        }
        value.ignoreNameSpace = ignoreNameSpace_buf;
        const auto tagValueCallbackFunction_buf_runtimeType = static_cast<OH_XML_RuntimeType>(valueDeserializer.readInt8());
        Opt_XML_Callback_String_String_Boolean tagValueCallbackFunction_buf = {};
        tagValueCallbackFunction_buf.tag = tagValueCallbackFunction_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (tagValueCallbackFunction_buf_runtimeType))
        {
            tagValueCallbackFunction_buf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const XML_Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_String_String_Boolean)))), reinterpret_cast<void(*)(OH_XML_VMContext vmContext, const OH_Int32 resourceId, const OH_String name, const OH_String value, const XML_Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_String_String_Boolean))))};
        }
        value.tagValueCallbackFunction = tagValueCallbackFunction_buf;
        const auto attributeValueCallbackFunction_buf_runtimeType = static_cast<OH_XML_RuntimeType>(valueDeserializer.readInt8());
        Opt_XML_Callback_String_String_Boolean attributeValueCallbackFunction_buf = {};
        attributeValueCallbackFunction_buf.tag = attributeValueCallbackFunction_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (attributeValueCallbackFunction_buf_runtimeType))
        {
            attributeValueCallbackFunction_buf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const XML_Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_String_String_Boolean)))), reinterpret_cast<void(*)(OH_XML_VMContext vmContext, const OH_Int32 resourceId, const OH_String name, const OH_String value, const XML_Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_String_String_Boolean))))};
        }
        value.attributeValueCallbackFunction = attributeValueCallbackFunction_buf;
        const auto tokenValueCallbackFunction_buf_runtimeType = static_cast<OH_XML_RuntimeType>(valueDeserializer.readInt8());
        Opt_XML_Callback_EventType_ParseInfo_Boolean tokenValueCallbackFunction_buf = {};
        tokenValueCallbackFunction_buf.tag = tokenValueCallbackFunction_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (tokenValueCallbackFunction_buf_runtimeType))
        {
            tokenValueCallbackFunction_buf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_XML_xml_EventType eventType, const OH_XML_ParseInfo value, const XML_Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_EventType_ParseInfo_Boolean)))), reinterpret_cast<void(*)(OH_XML_VMContext vmContext, const OH_Int32 resourceId, OH_XML_xml_EventType eventType, const OH_XML_ParseInfo value, const XML_Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_EventType_ParseInfo_Boolean))))};
        }
        value.tokenValueCallbackFunction = tokenValueCallbackFunction_buf;
        return value;
    }
    OH_XML_ParseInfo readParseInfo()
    {
        Deserializer& valueDeserializer = *this;
        OH_NativePointer ptr = valueDeserializer.readPointer();
        return { ptr };
    }
};

