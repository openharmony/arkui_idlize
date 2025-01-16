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

#include "xml.h"

#define KOALA_INTEROP_MODULE XMLNativeModule
#include "common-interop.h"
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include <deque>
#include <unordered_map>

CustomDeserializer * DeserializerBase::customDeserializers = nullptr;

typedef enum CallbackKind {
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_EventType_ParseInfo_Boolean = 240036623,
    Kind_Callback_String_String_Boolean = 923368928,
} CallbackKind;

struct CallbackBuffer {
    CallbackKind kind;
    uint8_t buffer[60 * 4];
    CallbackResourceHolder resourceHolder;
};
void enqueueArkoalaCallback(const CallbackBuffer* event);

OH_NativePointer getManagedCallbackCaller(CallbackKind kind);
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind);

struct Counter {
    int count;
    void* data;
};

static int bufferResourceId = 0;
static std::unordered_map<int, Counter> refCounterMap;

int allocate_buffer(int len, void** mem) {
    char* data = new char[len];
    (*mem) = data;
    int id = ++bufferResourceId;
    refCounterMap[id] = Counter { 1, (void*)data };
    return id;
}

void releaseBuffer(int resourceId) {
    if (refCounterMap.find(resourceId) != refCounterMap.end()) {
        Counter& record = refCounterMap[resourceId];
        --record.count;
        if (record.count <= 0) {
            delete[] (char*)record.data;
        }
    }
}

void holdBuffer(int resourceId) {
    if (refCounterMap.find(resourceId) != refCounterMap.end()) {
        Counter& record = refCounterMap[resourceId];
        ++record.count;
    }
}

void impl_AllocateNativeBuffer(KInt len, KByte* ret, KByte* init) {
    void* mem;
    int resourceId = allocate_buffer(len, &mem);
    memcpy((KByte*)mem, init, len);
    SerializerBase ser { ret };
    ser.writeInt32(resourceId);
    ser.writePointer((void*)&holdBuffer);
    ser.writePointer((void*)&releaseBuffer);
    ser.writePointer(mem);
    ser.writeInt64(len);

}
KOALA_INTEROP_V3(AllocateNativeBuffer, KInt, KByte*, KByte*);
template <>
inline OH_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const Callback_EventType_ParseInfo_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Callback_EventType_ParseInfo_Boolean* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Callback_EventType_ParseInfo_Boolean* value) {
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
inline OH_RuntimeType runtimeType(const Opt_Callback_EventType_ParseInfo_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const Callback_String_String_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Callback_String_String_Boolean* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Callback_String_String_Boolean* value) {
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
inline OH_RuntimeType runtimeType(const Opt_Callback_String_String_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const OH_ParseOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_ParseOptions* value) {
    result->append("{");
    // OH_Boolean supportDoctype
    result->append(".supportDoctype=");
    WriteToString(result, &value->supportDoctype);
    // OH_Boolean ignoreNameSpace
    result->append(", ");
    result->append(".ignoreNameSpace=");
    WriteToString(result, &value->ignoreNameSpace);
    // Callback_String_String_Boolean tagValueCallbackFunction
    result->append(", ");
    result->append(".tagValueCallbackFunction=");
    WriteToString(result, &value->tagValueCallbackFunction);
    // Callback_String_String_Boolean attributeValueCallbackFunction
    result->append(", ");
    result->append(".attributeValueCallbackFunction=");
    WriteToString(result, &value->attributeValueCallbackFunction);
    // Callback_EventType_ParseInfo_Boolean tokenValueCallbackFunction
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
inline OH_RuntimeType runtimeType(const Opt_ParseOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const Callback_Boolean_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Callback_Boolean_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Callback_Boolean_Void* value) {
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
inline OH_RuntimeType runtimeType(const Opt_Callback_Boolean_Void& value)
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
inline OH_RuntimeType runtimeType(const Opt_ParseInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const OH_xml_EventType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_xml_EventType value) {
    result->append("OH_xml_EventType(");
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
inline OH_RuntimeType runtimeType(const Opt_xml_EventType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const OH_Buffer& value)
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
inline OH_RuntimeType runtimeType(const Opt_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_RuntimeType runtimeType(const OH_String& value)
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
inline OH_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class Serializer : public SerializerBase {
    public:
    Serializer(uint8_t* data, CallbackResourceHolder* resourceHolder = nullptr) : SerializerBase(data, resourceHolder) {
    }
    void writeParseOptions(OH_ParseOptions value)
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
    void writeParseInfo(OH_ParseInfo value)
    {
        Serializer& valueSerializer = *this;
        valueSerializer.writePointer(value.ptr);
    }
};

class Deserializer : public DeserializerBase {
    public:
    Deserializer(uint8_t* data, OH_Int32 length) : DeserializerBase(data, length) {
    }
    OH_ParseOptions readParseOptions()
    {
        OH_ParseOptions value = {};
        Deserializer& valueDeserializer = *this;
        const auto supportDoctype_buf_runtimeType = static_cast<OH_RuntimeType>(valueDeserializer.readInt8());
        Opt_Boolean supportDoctype_buf = {};
        supportDoctype_buf.tag = supportDoctype_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (supportDoctype_buf_runtimeType))
        {
            supportDoctype_buf.value = valueDeserializer.readBoolean();
        }
        value.supportDoctype = supportDoctype_buf;
        const auto ignoreNameSpace_buf_runtimeType = static_cast<OH_RuntimeType>(valueDeserializer.readInt8());
        Opt_Boolean ignoreNameSpace_buf = {};
        ignoreNameSpace_buf.tag = ignoreNameSpace_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (ignoreNameSpace_buf_runtimeType))
        {
            ignoreNameSpace_buf.value = valueDeserializer.readBoolean();
        }
        value.ignoreNameSpace = ignoreNameSpace_buf;
        const auto tagValueCallbackFunction_buf_runtimeType = static_cast<OH_RuntimeType>(valueDeserializer.readInt8());
        Opt_Callback_String_String_Boolean tagValueCallbackFunction_buf = {};
        tagValueCallbackFunction_buf.tag = tagValueCallbackFunction_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (tagValueCallbackFunction_buf_runtimeType))
        {
            tagValueCallbackFunction_buf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_String_String_Boolean)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_String_String_Boolean))))};
        }
        value.tagValueCallbackFunction = tagValueCallbackFunction_buf;
        const auto attributeValueCallbackFunction_buf_runtimeType = static_cast<OH_RuntimeType>(valueDeserializer.readInt8());
        Opt_Callback_String_String_Boolean attributeValueCallbackFunction_buf = {};
        attributeValueCallbackFunction_buf.tag = attributeValueCallbackFunction_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (attributeValueCallbackFunction_buf_runtimeType))
        {
            attributeValueCallbackFunction_buf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_String_String_Boolean)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_String_String_Boolean))))};
        }
        value.attributeValueCallbackFunction = attributeValueCallbackFunction_buf;
        const auto tokenValueCallbackFunction_buf_runtimeType = static_cast<OH_RuntimeType>(valueDeserializer.readInt8());
        Opt_Callback_EventType_ParseInfo_Boolean tokenValueCallbackFunction_buf = {};
        tokenValueCallbackFunction_buf.tag = tokenValueCallbackFunction_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (tokenValueCallbackFunction_buf_runtimeType))
        {
            tokenValueCallbackFunction_buf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_xml_EventType eventType, const OH_ParseInfo value, const Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_EventType_ParseInfo_Boolean)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, OH_xml_EventType eventType, const OH_ParseInfo value, const Callback_Boolean_Void continuation)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_EventType_ParseInfo_Boolean))))};
        }
        value.tokenValueCallbackFunction = tokenValueCallbackFunction_buf;
        return value;
    }
    OH_ParseInfo readParseInfo()
    {
        Deserializer& valueDeserializer = *this;
        OH_NativePointer ptr = valueDeserializer.readPointer();
        return { ptr };
    }
};
OH_XML_XmlSerializerHandle XmlSerializer_constructImpl(const OH_Buffer* buffer, const Opt_String* encoding);
void XmlSerializer_destructImpl(OH_XML_XmlSerializerHandle thiz);
void XmlSerializer_setAttributesImpl(OH_NativePointer thisPtr, const OH_String* name, const OH_String* value);
void XmlSerializer_addEmptyElementImpl(OH_NativePointer thisPtr, const OH_String* name);
void XmlSerializer_setDeclarationImpl(OH_NativePointer thisPtr);
void XmlSerializer_startElementImpl(OH_NativePointer thisPtr, const OH_String* name);
void XmlSerializer_endElementImpl(OH_NativePointer thisPtr);
void XmlSerializer_setNamespaceImpl(OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_);
void XmlSerializer_setCommentImpl(OH_NativePointer thisPtr, const OH_String* text);
void XmlSerializer_setCDATAImpl(OH_NativePointer thisPtr, const OH_String* text);
void XmlSerializer_setTextImpl(OH_NativePointer thisPtr, const OH_String* text);
void XmlSerializer_setDocTypeImpl(OH_NativePointer thisPtr, const OH_String* text);
OH_XML_ParseInfoHandle ParseInfo_constructImpl();
void ParseInfo_destructImpl(OH_XML_ParseInfoHandle thiz);
OH_Number ParseInfo_getColumnNumberImpl(OH_NativePointer thisPtr);
OH_Number ParseInfo_getDepthImpl(OH_NativePointer thisPtr);
OH_Number ParseInfo_getLineNumberImpl(OH_NativePointer thisPtr);
OH_String ParseInfo_getNameImpl(OH_NativePointer thisPtr);
OH_String ParseInfo_getNamespaceImpl(OH_NativePointer thisPtr);
OH_String ParseInfo_getPrefixImpl(OH_NativePointer thisPtr);
OH_String ParseInfo_getTextImpl(OH_NativePointer thisPtr);
OH_Boolean ParseInfo_isEmptyElementTagImpl(OH_NativePointer thisPtr);
OH_Boolean ParseInfo_isWhitespaceImpl(OH_NativePointer thisPtr);
OH_Number ParseInfo_getAttributeCountImpl(OH_NativePointer thisPtr);
OH_XML_XmlPullParserHandle XmlPullParser_constructImpl(const OH_Buffer* buffer, const Opt_String* encoding);
void XmlPullParser_destructImpl(OH_XML_XmlPullParserHandle thiz);
void XmlPullParser_parseImpl(OH_NativePointer thisPtr, const OH_ParseOptions* option);
void XmlPullParser_parseXmlImpl(OH_NativePointer thisPtr, const OH_ParseOptions* option);
const OH_XML_XmlSerializerModifier* OH_XML_XmlSerializerModifierImpl() {
    const static OH_XML_XmlSerializerModifier instance = {
        &XmlSerializer_constructImpl,
        &XmlSerializer_destructImpl,
        &XmlSerializer_setAttributesImpl,
        &XmlSerializer_addEmptyElementImpl,
        &XmlSerializer_setDeclarationImpl,
        &XmlSerializer_startElementImpl,
        &XmlSerializer_endElementImpl,
        &XmlSerializer_setNamespaceImpl,
        &XmlSerializer_setCommentImpl,
        &XmlSerializer_setCDATAImpl,
        &XmlSerializer_setTextImpl,
        &XmlSerializer_setDocTypeImpl,
    };
    return &instance;
}
const OH_XML_ParseInfoModifier* OH_XML_ParseInfoModifierImpl() {
    const static OH_XML_ParseInfoModifier instance = {
        &ParseInfo_constructImpl,
        &ParseInfo_destructImpl,
        &ParseInfo_getColumnNumberImpl,
        &ParseInfo_getDepthImpl,
        &ParseInfo_getLineNumberImpl,
        &ParseInfo_getNameImpl,
        &ParseInfo_getNamespaceImpl,
        &ParseInfo_getPrefixImpl,
        &ParseInfo_getTextImpl,
        &ParseInfo_isEmptyElementTagImpl,
        &ParseInfo_isWhitespaceImpl,
        &ParseInfo_getAttributeCountImpl,
    };
    return &instance;
}
const OH_XML_XmlPullParserModifier* OH_XML_XmlPullParserModifierImpl() {
    const static OH_XML_XmlPullParserModifier instance = {
        &XmlPullParser_constructImpl,
        &XmlPullParser_destructImpl,
        &XmlPullParser_parseImpl,
        &XmlPullParser_parseXmlImpl,
    };
    return &instance;
}
const OH_XML_API* GetXMLAPIImpl(int version) {
    const static OH_XML_API api = {
        1, // version
        &OH_XML_XmlSerializerModifierImpl,
        &OH_XML_ParseInfoModifierImpl,
        &OH_XML_XmlPullParserModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}

// Accessors

OH_NativePointer impl_XmlSerializer_ctor(uint8_t* thisArray, int32_t thisLength) {
        Deserializer thisDeserializer(thisArray, thisLength);
        OH_Buffer buffer_value = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        const auto encoding_value_buf_runtimeType = static_cast<OH_RuntimeType>(thisDeserializer.readInt8());
        Opt_String encoding_value_buf = {};
        encoding_value_buf.tag = encoding_value_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (encoding_value_buf_runtimeType))
        {
            encoding_value_buf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String encoding_value = encoding_value_buf;;
        return GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->construct((const OH_Buffer*)&buffer_value, (const Opt_String*)&encoding_value);
}
KOALA_INTEROP_2(XmlSerializer_ctor, OH_NativePointer, uint8_t*, int32_t)
 
OH_NativePointer impl_XmlSerializer_getFinalizer() {
        return (OH_NativePointer) GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->destruct;
}
KOALA_INTEROP_0(XmlSerializer_getFinalizer, OH_NativePointer)
 
void impl_XmlSerializer_setAttributes(OH_NativePointer thisPtr, const KStringPtr& name, const KStringPtr& value) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setAttributes(thisPtr, (const OH_String*)&name, (const OH_String*)&value);
}
KOALA_INTEROP_V3(XmlSerializer_setAttributes, OH_NativePointer, KStringPtr, KStringPtr)
 
void impl_XmlSerializer_addEmptyElement(OH_NativePointer thisPtr, const KStringPtr& name) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->addEmptyElement(thisPtr, (const OH_String*)&name);
}
KOALA_INTEROP_V2(XmlSerializer_addEmptyElement, OH_NativePointer, KStringPtr)
 
void impl_XmlSerializer_setDeclaration(OH_NativePointer thisPtr) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setDeclaration(thisPtr);
}
KOALA_INTEROP_V1(XmlSerializer_setDeclaration, OH_NativePointer)
 
void impl_XmlSerializer_startElement(OH_NativePointer thisPtr, const KStringPtr& name) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->startElement(thisPtr, (const OH_String*)&name);
}
KOALA_INTEROP_V2(XmlSerializer_startElement, OH_NativePointer, KStringPtr)
 
void impl_XmlSerializer_endElement(OH_NativePointer thisPtr) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->endElement(thisPtr);
}
KOALA_INTEROP_V1(XmlSerializer_endElement, OH_NativePointer)
 
void impl_XmlSerializer_setNamespace(OH_NativePointer thisPtr, const KStringPtr& prefix, const KStringPtr& namespace_) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setNamespace(thisPtr, (const OH_String*)&prefix, (const OH_String*)&namespace_);
}
KOALA_INTEROP_V3(XmlSerializer_setNamespace, OH_NativePointer, KStringPtr, KStringPtr)
 
void impl_XmlSerializer_setComment(OH_NativePointer thisPtr, const KStringPtr& text) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setComment(thisPtr, (const OH_String*)&text);
}
KOALA_INTEROP_V2(XmlSerializer_setComment, OH_NativePointer, KStringPtr)
 
void impl_XmlSerializer_setCDATA(OH_NativePointer thisPtr, const KStringPtr& text) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setCDATA(thisPtr, (const OH_String*)&text);
}
KOALA_INTEROP_V2(XmlSerializer_setCDATA, OH_NativePointer, KStringPtr)
 
void impl_XmlSerializer_setText(OH_NativePointer thisPtr, const KStringPtr& text) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setText(thisPtr, (const OH_String*)&text);
}
KOALA_INTEROP_V2(XmlSerializer_setText, OH_NativePointer, KStringPtr)
 
void impl_XmlSerializer_setDocType(OH_NativePointer thisPtr, const KStringPtr& text) {
        GetXMLAPIImpl(XML_API_VERSION)->XmlSerializer()->setDocType(thisPtr, (const OH_String*)&text);
}
KOALA_INTEROP_V2(XmlSerializer_setDocType, OH_NativePointer, KStringPtr)
 
OH_NativePointer impl_ParseInfo_ctor() {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->construct();
}
KOALA_INTEROP_0(ParseInfo_ctor, OH_NativePointer)
 
OH_NativePointer impl_ParseInfo_getFinalizer() {
        return (OH_NativePointer) GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->destruct;
}
KOALA_INTEROP_0(ParseInfo_getFinalizer, OH_NativePointer)
 
OH_Int32 impl_ParseInfo_getColumnNumber(OH_NativePointer thisPtr) {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getColumnNumber(thisPtr).i32;
}
KOALA_INTEROP_1(ParseInfo_getColumnNumber, OH_Int32, OH_NativePointer)
 
OH_Int32 impl_ParseInfo_getDepth(OH_NativePointer thisPtr) {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getDepth(thisPtr).i32;
}
KOALA_INTEROP_1(ParseInfo_getDepth, OH_Int32, OH_NativePointer)
 
OH_Int32 impl_ParseInfo_getLineNumber(OH_NativePointer thisPtr) {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getLineNumber(thisPtr).i32;
}
KOALA_INTEROP_1(ParseInfo_getLineNumber, OH_Int32, OH_NativePointer)
 
void impl_ParseInfo_getName(OH_NativePointer thisPtr) {
        GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getName(thisPtr);
}
KOALA_INTEROP_V1(ParseInfo_getName, OH_NativePointer)
 
void impl_ParseInfo_getNamespace(OH_NativePointer thisPtr) {
        GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getNamespace(thisPtr);
}
KOALA_INTEROP_V1(ParseInfo_getNamespace, OH_NativePointer)
 
void impl_ParseInfo_getPrefix(OH_NativePointer thisPtr) {
        GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getPrefix(thisPtr);
}
KOALA_INTEROP_V1(ParseInfo_getPrefix, OH_NativePointer)
 
void impl_ParseInfo_getText(OH_NativePointer thisPtr) {
        GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getText(thisPtr);
}
KOALA_INTEROP_V1(ParseInfo_getText, OH_NativePointer)
 
OH_Boolean impl_ParseInfo_isEmptyElementTag(OH_NativePointer thisPtr) {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->isEmptyElementTag(thisPtr);
}
KOALA_INTEROP_1(ParseInfo_isEmptyElementTag, OH_Boolean, OH_NativePointer)
 
OH_Boolean impl_ParseInfo_isWhitespace(OH_NativePointer thisPtr) {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->isWhitespace(thisPtr);
}
KOALA_INTEROP_1(ParseInfo_isWhitespace, OH_Boolean, OH_NativePointer)
 
OH_Int32 impl_ParseInfo_getAttributeCount(OH_NativePointer thisPtr) {
        return GetXMLAPIImpl(XML_API_VERSION)->ParseInfo()->getAttributeCount(thisPtr).i32;
}
KOALA_INTEROP_1(ParseInfo_getAttributeCount, OH_Int32, OH_NativePointer)
 
OH_NativePointer impl_XmlPullParser_ctor(uint8_t* thisArray, int32_t thisLength) {
        Deserializer thisDeserializer(thisArray, thisLength);
        OH_Buffer buffer_value = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        const auto encoding_value_buf_runtimeType = static_cast<OH_RuntimeType>(thisDeserializer.readInt8());
        Opt_String encoding_value_buf = {};
        encoding_value_buf.tag = encoding_value_buf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((INTEROP_RUNTIME_UNDEFINED) != (encoding_value_buf_runtimeType))
        {
            encoding_value_buf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String encoding_value = encoding_value_buf;;
        return GetXMLAPIImpl(XML_API_VERSION)->XmlPullParser()->construct((const OH_Buffer*)&buffer_value, (const Opt_String*)&encoding_value);
}
KOALA_INTEROP_2(XmlPullParser_ctor, OH_NativePointer, uint8_t*, int32_t)
 
OH_NativePointer impl_XmlPullParser_getFinalizer() {
        return (OH_NativePointer) GetXMLAPIImpl(XML_API_VERSION)->XmlPullParser()->destruct;
}
KOALA_INTEROP_0(XmlPullParser_getFinalizer, OH_NativePointer)
 
void impl_XmlPullParser_parse(OH_NativePointer thisPtr, uint8_t* thisArray, int32_t thisLength) {
        Deserializer thisDeserializer(thisArray, thisLength);
        OH_ParseOptions option_value = thisDeserializer.readParseOptions();;
        GetXMLAPIImpl(XML_API_VERSION)->XmlPullParser()->parse(thisPtr, (const OH_ParseOptions*)&option_value);
}
KOALA_INTEROP_V3(XmlPullParser_parse, OH_NativePointer, uint8_t*, int32_t)
 
void impl_XmlPullParser_parseXml(OH_NativePointer thisPtr, uint8_t* thisArray, int32_t thisLength) {
        Deserializer thisDeserializer(thisArray, thisLength);
        OH_ParseOptions option_value = thisDeserializer.readParseOptions();;
        GetXMLAPIImpl(XML_API_VERSION)->XmlPullParser()->parseXml(thisPtr, (const OH_ParseOptions*)&option_value);
}
KOALA_INTEROP_V3(XmlPullParser_parseXml, OH_NativePointer, uint8_t*, int32_t)
 
void deserializeAndCallCallback_Boolean_Void(uint8_t* thisArray, OH_Int32 thisLength)
{
    Deserializer thisDeserializer = Deserializer(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointer());
    thisDeserializer.readPointer();
    OH_Boolean value = thisDeserializer.readBoolean();
    _call(_resourceId, value);
}
void deserializeAndCallSyncCallback_Boolean_Void(OH_VMContext vmContext, uint8_t* thisArray, OH_Int32 thisLength)
{
    Deserializer thisDeserializer = Deserializer(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto _callSync = reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointer());
    OH_Boolean value = thisDeserializer.readBoolean();
    _callSync(vmContext, _resourceId, value);
}
void deserializeAndCallCallback_EventType_ParseInfo_Boolean(uint8_t* thisArray, OH_Int32 thisLength)
{
    Deserializer thisDeserializer = Deserializer(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_xml_EventType eventType, const OH_ParseInfo value, const Callback_Boolean_Void continuation)>(thisDeserializer.readPointer());
    thisDeserializer.readPointer();
    OH_xml_EventType eventType = static_cast<OH_xml_EventType>(thisDeserializer.readInt32());
    OH_ParseInfo value = static_cast<OH_ParseInfo>(thisDeserializer.readParseInfo());
    Callback_Boolean_Void _continuation = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
    _call(_resourceId, eventType, value, _continuation);
}
void deserializeAndCallSyncCallback_EventType_ParseInfo_Boolean(OH_VMContext vmContext, uint8_t* thisArray, OH_Int32 thisLength)
{
    Deserializer thisDeserializer = Deserializer(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto _callSync = reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, OH_xml_EventType eventType, const OH_ParseInfo value, const Callback_Boolean_Void continuation)>(thisDeserializer.readPointer());
    OH_xml_EventType eventType = static_cast<OH_xml_EventType>(thisDeserializer.readInt32());
    OH_ParseInfo value = static_cast<OH_ParseInfo>(thisDeserializer.readParseInfo());
    Callback_Boolean_Void _continuation = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
    _callSync(vmContext, _resourceId, eventType, value, _continuation);
}
void deserializeAndCallCallback_String_String_Boolean(uint8_t* thisArray, OH_Int32 thisLength)
{
    Deserializer thisDeserializer = Deserializer(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation)>(thisDeserializer.readPointer());
    thisDeserializer.readPointer();
    OH_String name = static_cast<OH_String>(thisDeserializer.readString());
    OH_String value = static_cast<OH_String>(thisDeserializer.readString());
    Callback_Boolean_Void _continuation = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
    _call(_resourceId, name, value, _continuation);
}
void deserializeAndCallSyncCallback_String_String_Boolean(OH_VMContext vmContext, uint8_t* thisArray, OH_Int32 thisLength)
{
    Deserializer thisDeserializer = Deserializer(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto _callSync = reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation)>(thisDeserializer.readPointer());
    OH_String name = static_cast<OH_String>(thisDeserializer.readString());
    OH_String value = static_cast<OH_String>(thisDeserializer.readString());
    Callback_Boolean_Void _continuation = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
    _callSync(vmContext, _resourceId, name, value, _continuation);
}
void deserializeAndCallCallback(OH_Int32 kind, uint8_t* thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case 313269291/*Kind_Callback_Boolean_Void*/: return deserializeAndCallCallback_Boolean_Void(thisArray, thisLength);
        case 240036623/*Kind_Callback_EventType_ParseInfo_Boolean*/: return deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisArray, thisLength);
        case 923368928/*Kind_Callback_String_String_Boolean*/: return deserializeAndCallCallback_String_String_Boolean(thisArray, thisLength);
    }
    throw "Unknown callback kind";
}
void deserializeAndCallCallbackSync(OH_VMContext vmContext, OH_Int32 kind, uint8_t* thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case 313269291/*Kind_Callback_Boolean_Void*/: return deserializeAndCallSyncCallback_Boolean_Void(vmContext, thisArray, thisLength);
        case 240036623/*Kind_Callback_EventType_ParseInfo_Boolean*/: return deserializeAndCallSyncCallback_EventType_ParseInfo_Boolean(vmContext, thisArray, thisLength);
        case 923368928/*Kind_Callback_String_String_Boolean*/: return deserializeAndCallSyncCallback_String_String_Boolean(vmContext, thisArray, thisLength);
    }
    throw "Unknown callback kind";
}
void callManagedCallback_Boolean_Void(OH_Int32 resourceId, OH_Boolean value)
{
    CallbackBuffer __buffer = {{}, {}};
    const OH_CallbackResource __callbackResource = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    __buffer.resourceHolder.holdCallbackResource(&__callbackResource);
    Serializer argsSerializer = Serializer(__buffer.buffer, &(__buffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Boolean_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeBoolean(value);
    enqueueArkoalaCallback(&__buffer);
}
void callManagedCallback_Boolean_VoidSync(OH_VMContext vmContext, OH_Int32 resourceId, OH_Boolean value)
{
    uint8_t __buffer[60 * 4];
    Serializer argsSerializer = Serializer(__buffer, nullptr);
    argsSerializer.writeInt32(Kind_Callback_Boolean_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeBoolean(value);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(__buffer), __buffer);
}
void callManagedCallback_EventType_ParseInfo_Boolean(OH_Int32 resourceId, OH_xml_EventType eventType, OH_ParseInfo value, Callback_Boolean_Void continuation)
{
    CallbackBuffer __buffer = {{}, {}};
    const OH_CallbackResource __callbackResource = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    __buffer.resourceHolder.holdCallbackResource(&__callbackResource);
    Serializer argsSerializer = Serializer(__buffer.buffer, &(__buffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_EventType_ParseInfo_Boolean);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_xml_EventType>(eventType));
    argsSerializer.writeParseInfo(value);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    enqueueArkoalaCallback(&__buffer);
}
void callManagedCallback_EventType_ParseInfo_BooleanSync(OH_VMContext vmContext, OH_Int32 resourceId, OH_xml_EventType eventType, OH_ParseInfo value, Callback_Boolean_Void continuation)
{
    uint8_t __buffer[60 * 4];
    Serializer argsSerializer = Serializer(__buffer, nullptr);
    argsSerializer.writeInt32(Kind_Callback_EventType_ParseInfo_Boolean);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_xml_EventType>(eventType));
    argsSerializer.writeParseInfo(value);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(__buffer), __buffer);
}
void callManagedCallback_String_String_Boolean(OH_Int32 resourceId, OH_String name, OH_String value, Callback_Boolean_Void continuation)
{
    CallbackBuffer __buffer = {{}, {}};
    const OH_CallbackResource __callbackResource = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    __buffer.resourceHolder.holdCallbackResource(&__callbackResource);
    Serializer argsSerializer = Serializer(__buffer.buffer, &(__buffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_String_String_Boolean);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeString(name);
    argsSerializer.writeString(value);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    enqueueArkoalaCallback(&__buffer);
}
void callManagedCallback_String_String_BooleanSync(OH_VMContext vmContext, OH_Int32 resourceId, OH_String name, OH_String value, Callback_Boolean_Void continuation)
{
    uint8_t __buffer[60 * 4];
    Serializer argsSerializer = Serializer(__buffer, nullptr);
    argsSerializer.writeInt32(Kind_Callback_String_String_Boolean);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeString(name);
    argsSerializer.writeString(value);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(__buffer), __buffer);
}
OH_NativePointer getManagedCallbackCaller(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Boolean_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Boolean_Void);
        case Kind_Callback_EventType_ParseInfo_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_EventType_ParseInfo_Boolean);
        case Kind_Callback_String_String_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_String_String_Boolean);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Boolean_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Boolean_VoidSync);
        case Kind_Callback_EventType_ParseInfo_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_EventType_ParseInfo_BooleanSync);
        case Kind_Callback_String_String_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_String_String_BooleanSync);
    }
    return nullptr;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_XML_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetXMLAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GetAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}

// ArkUINativeModule::Callbacks

#undef KOALA_INTEROP_MODULE
#define KOALA_INTEROP_MODULE ArkUINativeModule
enum CallbackEventKind {
    Event_CallCallback = 0,
    Event_HoldManagedResource = 1,
    Event_ReleaseManagedResource = 2,
};

static bool needReleaseFront = false;
static std::deque<CallbackEventKind> callbackEventsQueue;
static std::deque<CallbackBuffer> callbackCallSubqueue;
static std::deque<OH_Int32> callbackResourceSubqueue;
KInt impl_CheckArkoalaCallbackEvent(KByte* result, KInt size) {
    if (needReleaseFront)
    {
        switch (callbackEventsQueue.front())
        {
            case Event_CallCallback:
                callbackCallSubqueue.front().resourceHolder.release();
                callbackCallSubqueue.pop_front();
                break;
            case Event_HoldManagedResource:
            case Event_ReleaseManagedResource:
                callbackResourceSubqueue.pop_front();
                break;
            default:
                throw "Unknown event kind";
        }
        callbackEventsQueue.pop_front();
        needReleaseFront = false;
    }
    if (callbackEventsQueue.empty()) {
        return 0;
    }
    const CallbackEventKind frontEventKind = callbackEventsQueue.front();
    Serializer serializer(result);
    serializer.writeInt32(frontEventKind);
    switch (frontEventKind)
    {
        case Event_CallCallback:
            memcpy(result + serializer.length(), callbackCallSubqueue.front().buffer, sizeof(CallbackBuffer::buffer));
            break;
        case Event_HoldManagedResource:
        case Event_ReleaseManagedResource:
            serializer.writeInt32(callbackResourceSubqueue.front());
            break;
        default:
            throw "Unknown event kind";
    }
    needReleaseFront = true;
    return 1;
}
KOALA_INTEROP_2(CheckArkoalaCallbackEvent, KInt, KByte*, KInt)

void impl_ReleaseArkoalaResource(OH_Int32 resourceId) {
    releaseManagedCallbackResource(resourceId);
}
KOALA_INTEROP_V1(ReleaseArkoalaResource, KInt)

void impl_HoldArkoalaResource(OH_Int32 resourceId) {
    holdManagedCallbackResource(resourceId);
}
KOALA_INTEROP_V1(HoldArkoalaResource, KInt)

void enqueueArkoalaCallback(const CallbackBuffer* event) {
    callbackEventsQueue.push_back(Event_CallCallback);
    callbackCallSubqueue.push_back(*event);
}

void holdManagedCallbackResource(OH_Int32 resourceId) {
    callbackEventsQueue.push_back(Event_HoldManagedResource);
    callbackResourceSubqueue.push_back(resourceId);
}

void releaseManagedCallbackResource(OH_Int32 resourceId) {
    callbackEventsQueue.push_back(Event_ReleaseManagedResource);
    callbackResourceSubqueue.push_back(resourceId);
}
