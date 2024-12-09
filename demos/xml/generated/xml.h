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
#ifndef OH_XML_H
#define OH_XML_H

#define XML_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

enum OH_Tag
{
  OH_TAG_UNDEFINED = 101,
  OH_TAG_INT32 = 102,
  OH_TAG_FLOAT32 = 103,
  OH_TAG_STRING = 104,
  OH_TAG_LENGTH = 105,
  OH_TAG_RESOURCE = 106,
  OH_TAG_OBJECT = 107,
};

enum OH_RuntimeType
{
  OH_RUNTIME_UNEXPECTED = -1,
  OH_RUNTIME_NUMBER = 1,
  OH_RUNTIME_STRING = 2,
  OH_RUNTIME_OBJECT = 3,
  OH_RUNTIME_BOOLEAN = 4,
  OH_RUNTIME_UNDEFINED = 5,
  OH_RUNTIME_BIGINT = 6,
  OH_RUNTIME_FUNCTION = 7,
  OH_RUNTIME_SYMBOL = 8,
  OH_RUNTIME_MATERIALIZED = 9,
};

typedef float OH_Float32;
typedef double OH_Float64;
typedef int32_t OH_Int32;
typedef unsigned int OH_UInt32;
typedef int64_t OH_Int64;
typedef int8_t OH_Int8;
typedef int8_t OH_Boolean;
typedef const char* OH_CharPtr;
typedef void* OH_NativePointer;
typedef const char* OH_String;
typedef struct OH_CallbackResource {
  OH_Int32 resourceId;
  void (*hold)(OH_Int32 resourceId);
  void (*release)(OH_Int32 resourceId);
} OH_CallbackResource;
typedef struct OH_Number {
  OH_Int8 tag;
  union {
    OH_Float32 f32;
    OH_Int32 i32;
  };
} OH_Number;
typedef struct OH_Buffer
{
  void* data;
  int64_t length;
} OH_Buffer;
typedef struct OH_Materialized {
  OH_NativePointer ptr;
} OH_Materialized;
typedef struct OH_CustomObject {
  char kind[20];
  OH_Int32 id;
  // Data of custom object.
  union {
    OH_Int32 ints[4];
    OH_Float32 floats[4];
    void* pointers[4];
    OH_String string;
  };
} OH_CustomObject;
typedef struct OH_Undefined {
  OH_Int32 dummy; // Empty structs are forbidden in C.
} OH_Undefined;

// TODO: wrong, provide real definitions.
typedef void* OH_DataView;

typedef struct OH_AnyAPI {
    OH_Int32 version;
} OH_AnyAPI;

typedef enum OH_APIKind {
    OH_XML_API_KIND = 1
} OH_APIKind;
typedef struct Callback_EventType_ParseInfo_Boolean Callback_EventType_ParseInfo_Boolean;
typedef struct Opt_Callback_EventType_ParseInfo_Boolean Opt_Callback_EventType_ParseInfo_Boolean;
typedef struct Callback_String_String_Boolean Callback_String_String_Boolean;
typedef struct Opt_Callback_String_String_Boolean Opt_Callback_String_String_Boolean;
typedef struct Callback_Boolean_Void Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void Opt_Callback_Boolean_Void;
typedef OH_Materialized OH_ParseInfo;
typedef struct Opt_ParseInfo Opt_ParseInfo;
typedef struct OH_ParseOptions OH_ParseOptions;
typedef struct Opt_ParseOptions Opt_ParseOptions;
typedef enum OH_xml_EventType {
    OH_XML_EVENT_TYPE_START_DOCUMENT = 0,
    OH_XML_EVENT_TYPE_END_DOCUMENT = 1,
    OH_XML_EVENT_TYPE_START_TAG = 2,
    OH_XML_EVENT_TYPE_END_TAG = 3,
    OH_XML_EVENT_TYPE_TEXT = 4,
    OH_XML_EVENT_TYPE_CDSECT = 5,
    OH_XML_EVENT_TYPE_COMMENT = 6,
    OH_XML_EVENT_TYPE_DOCDECL = 7,
    OH_XML_EVENT_TYPE_INSTRUCTION = 8,
    OH_XML_EVENT_TYPE_ENTITY_REFERENCE = 9,
    OH_XML_EVENT_TYPE_WHITESPACE = 10,
} OH_xml_EventType;
typedef struct Opt_xml_EventType {
    OH_Tag tag;
    OH_xml_EventType value;
} Opt_xml_EventType;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Callback_EventType_ParseInfo_Boolean {
    OH_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, OH_xml_EventType eventType, const OH_ParseInfo value, const Callback_Boolean_Void continuation);
} Callback_EventType_ParseInfo_Boolean;
typedef struct Opt_Callback_EventType_ParseInfo_Boolean {
    OH_Tag tag;
    Callback_EventType_ParseInfo_Boolean value;
} Opt_Callback_EventType_ParseInfo_Boolean;
typedef struct Callback_String_String_Boolean {
    OH_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation);
} Callback_String_String_Boolean;
typedef struct Opt_Callback_String_String_Boolean {
    OH_Tag tag;
    Callback_String_String_Boolean value;
} Opt_Callback_String_String_Boolean;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
typedef struct Callback_Boolean_Void {
    OH_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Boolean value);
} Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void {
    OH_Tag tag;
    Callback_Boolean_Void value;
} Opt_Callback_Boolean_Void;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_ParseInfo {
    OH_Tag tag;
    OH_ParseInfo value;
} Opt_ParseInfo;
typedef struct OH_ParseOptions {
    Opt_Boolean supportDoctype;
    Opt_Boolean ignoreNameSpace;
    Opt_Callback_String_String_Boolean tagValueCallbackFunction;
    Opt_Callback_String_String_Boolean attributeValueCallbackFunction;
    Opt_Callback_EventType_ParseInfo_Boolean tokenValueCallbackFunction;
} OH_ParseOptions;
typedef struct Opt_ParseOptions {
    OH_Tag tag;
    OH_ParseOptions value;
} Opt_ParseOptions;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
struct OH_XML_XmlSerializerHandleOpaque;
typedef struct OH_XML_XmlSerializerHandleOpaque* OH_XML_XmlSerializerHandle;
typedef struct OH_XML_XmlSerializerModifier {
    OH_XML_XmlSerializerHandle (*construct)(const OH_String* buffer, const Opt_String* encoding);
    void (*destruct)(OH_XML_XmlSerializerHandle thiz);
    void (*setAttributes)(OH_NativePointer thisPtr, const OH_String* name, const OH_String* value);
    void (*addEmptyElement)(OH_NativePointer thisPtr, const OH_String* name);
    void (*setDeclaration)(OH_NativePointer thisPtr);
    void (*startElement)(OH_NativePointer thisPtr, const OH_String* name);
    void (*endElement)(OH_NativePointer thisPtr);
    void (*setNamespace)(OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_);
    void (*setComment)(OH_NativePointer thisPtr, const OH_String* text);
    void (*setCDATA)(OH_NativePointer thisPtr, const OH_String* text);
    void (*setText)(OH_NativePointer thisPtr, const OH_String* text);
    void (*setDocType)(OH_NativePointer thisPtr, const OH_String* text);
} OH_XML_XmlSerializerModifier;
struct OH_XML_ParseInfoHandleOpaque;
typedef struct OH_XML_ParseInfoHandleOpaque* OH_XML_ParseInfoHandle;
typedef struct OH_XML_ParseInfoModifier {
    OH_XML_ParseInfoHandle (*construct)();
    void (*destruct)(OH_XML_ParseInfoHandle thiz);
    OH_Number (*getColumnNumber)(OH_NativePointer thisPtr);
    OH_Number (*getDepth)(OH_NativePointer thisPtr);
    OH_Number (*getLineNumber)(OH_NativePointer thisPtr);
    OH_String (*getName)(OH_NativePointer thisPtr);
    OH_String (*getNamespace)(OH_NativePointer thisPtr);
    OH_String (*getPrefix)(OH_NativePointer thisPtr);
    OH_String (*getText)(OH_NativePointer thisPtr);
    OH_Boolean (*isEmptyElementTag)(OH_NativePointer thisPtr);
    OH_Boolean (*isWhitespace)(OH_NativePointer thisPtr);
    OH_Number (*getAttributeCount)(OH_NativePointer thisPtr);
} OH_XML_ParseInfoModifier;
struct OH_XML_XmlPullParserHandleOpaque;
typedef struct OH_XML_XmlPullParserHandleOpaque* OH_XML_XmlPullParserHandle;
typedef struct OH_XML_XmlPullParserModifier {
    OH_XML_XmlPullParserHandle (*construct)(const OH_String* buffer, const Opt_String* encoding);
    void (*destruct)(OH_XML_XmlPullParserHandle thiz);
    void (*parse)(OH_NativePointer thisPtr, const OH_ParseOptions* option);
    void (*parseXml)(OH_NativePointer thisPtr, const OH_ParseOptions* option);
} OH_XML_XmlPullParserModifier;
typedef struct OH_XML_API {
    OH_Int32 version;
    const OH_XML_XmlSerializerModifier* (*XmlSerializer)();
    const OH_XML_ParseInfoModifier* (*ParseInfo)();
    const OH_XML_XmlPullParserModifier* (*XmlPullParser)();
} OH_XML_API;

#ifdef __cplusplus
}  // extern "C"
#endif

#endif // OH_XML_H
/* clang-format on */