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
#ifndef _INTEROP_TYPES_H_
#define _INTEROP_TYPES_H_

#include <stdint.h>

typedef enum InteropTag
{
  INTEROP_TAG_UNDEFINED = 101,
  INTEROP_TAG_INT32 = 102,
  INTEROP_TAG_FLOAT32 = 103,
  INTEROP_TAG_STRING = 104,
  INTEROP_TAG_LENGTH = 105,
  INTEROP_TAG_RESOURCE = 106,
  INTEROP_TAG_OBJECT = 107,
} InteropTag;

typedef enum InteropRuntimeType
{
  INTEROP_RUNTIME_UNEXPECTED = -1,
  INTEROP_RUNTIME_NUMBER = 1,
  INTEROP_RUNTIME_STRING = 2,
  INTEROP_RUNTIME_OBJECT = 3,
  INTEROP_RUNTIME_BOOLEAN = 4,
  INTEROP_RUNTIME_UNDEFINED = 5,
  INTEROP_RUNTIME_BIGINT = 6,
  INTEROP_RUNTIME_FUNCTION = 7,
  INTEROP_RUNTIME_SYMBOL = 8,
  INTEROP_RUNTIME_MATERIALIZED = 9,
} InteropRuntimeType;

typedef float InteropFloat32;
typedef double InteropFloat64;
typedef int32_t InteropInt32;
typedef unsigned int InteropUInt32; // TODO: update unsigned int
typedef int64_t InteropInt64;
typedef int8_t InteropInt8;
typedef uint8_t InteropUInt8;
typedef int64_t InteropDate;
typedef int8_t InteropBoolean;
typedef const char* InteropCharPtr;
typedef void* InteropNativePointer;

struct _InteropVMContext;
typedef struct _InteropVMContext* InteropVMContext;
struct _InteropPipelineContext;
typedef struct _InteropPipelineContext* InteropPipelineContext;
struct _InteropVMObject;
typedef struct _InteropVMObject* InteropVMObject;
struct _InteropNode;
typedef struct _InteropNode* InteropNodeHandle;
typedef struct InteropDeferred {
    void* handler;
    void* context;
    void (*resolve)(struct InteropDeferred* thiz, uint8_t* data, int32_t length);
    void (*reject)(struct InteropDeferred* thiz, const char* message);
} InteropDeferred;

struct InteropObjectHandleOpaque;
typedef struct InteropObjectHandleOpaque* InteropObjectHandle;

// Binary layout of InteropString must match that of KStringPtrImpl.
typedef struct InteropString {
  const char* chars;
  InteropInt32 length;
} InteropString;

typedef struct InteropEmpty {
  InteropInt32 dummy; // Empty structs are forbidden in C.
} InteropEmpty;

typedef struct InteropNumber {
  InteropInt8 tag;
  union {
    InteropFloat32 f32;
    InteropInt32 i32;
  };
} InteropNumber;

// Binary layout of InteropLength must match that of KLength.
typedef struct InteropLength
{
  InteropInt8 type;
  InteropFloat32 value;
  InteropInt32 unit;
  InteropInt32 resource;
} InteropLength;

typedef struct InteropCustomObject {
  char kind[20];
  InteropInt32 id;
  // Data of custom object.
  union {
    InteropInt32 ints[4];
    InteropFloat32 floats[4];
    void* pointers[4];
    InteropString string;
  };
} InteropCustomObject;

typedef struct InteropUndefined {
  InteropInt32 dummy; // Empty structs are forbidden in C.
} InteropUndefined;

typedef struct InteropVoid {
  InteropInt32 dummy; // Empty structs are forbidden in C.
} InteropVoid;

typedef struct InteropFunction {
  InteropInt32 id;
} InteropFunction;
typedef InteropFunction InteropCallback;
typedef InteropFunction InteropErrorCallback;

typedef struct InteropMaterialized {
  InteropNativePointer ptr;
} InteropMaterialized;

typedef struct InteropCallbackResource {
  InteropInt32 resourceId;
  void (*hold)(InteropInt32 resourceId);
  void (*release)(InteropInt32 resourceId);
} InteropCallbackResource;

typedef struct InteropBuffer {
  InteropCallbackResource resource;
  InteropNativePointer data;
  InteropInt64 length;
} InteropBuffer;

typedef struct InteropAnyAPI {
    InteropInt32 version;
} InteropAPI;


#endif // _INTEROP_TYPES_H_


#ifndef OH_XML_H
#define OH_XML_H

#define XML_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_RuntimeType;

typedef InteropFloat32 OH_Float32;
typedef InteropFloat64 OH_Float64;
typedef InteropInt32 OH_Int32;
typedef InteropUInt32 OH_UInt32;
typedef InteropInt64 OH_Int64;
typedef InteropInt8 OH_Int8;
typedef InteropBoolean OH_Boolean;
typedef InteropCharPtr OH_CharPtr;
typedef InteropNativePointer OH_NativePointer;
typedef InteropString OH_String;
typedef InteropCallbackResource OH_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
typedef InteropAnyAPI OH_AnyAPI;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_VMContext;
typedef InteropBuffer OH_Buffer;
typedef InteropLength OH_Length;

typedef enum OH_APIKind {
    OH_XML_API_KIND = 100
} OH_APIKind;

typedef struct Callback_EventType_ParseInfo_Boolean Callback_EventType_ParseInfo_Boolean;
typedef struct Opt_Callback_EventType_ParseInfo_Boolean Opt_Callback_EventType_ParseInfo_Boolean;
typedef struct Callback_String_String_Boolean Callback_String_String_Boolean;
typedef struct Opt_Callback_String_String_Boolean Opt_Callback_String_String_Boolean;
typedef struct OH_ParseOptions OH_ParseOptions;
typedef struct Opt_ParseOptions Opt_ParseOptions;
typedef struct Callback_Boolean_Void Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void Opt_Callback_Boolean_Void;
typedef OH_Materialized OH_ParseInfo;
typedef struct Opt_ParseInfo Opt_ParseInfo;
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
    void (*callSync)(OH_VMContext context, const OH_Int32 resourceId, OH_xml_EventType eventType, const OH_ParseInfo value, const Callback_Boolean_Void continuation);
} Callback_EventType_ParseInfo_Boolean;
typedef struct Opt_Callback_EventType_ParseInfo_Boolean {
    OH_Tag tag;
    Callback_EventType_ParseInfo_Boolean value;
} Opt_Callback_EventType_ParseInfo_Boolean;
typedef struct Callback_String_String_Boolean {
    OH_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation);
    void (*callSync)(OH_VMContext context, const OH_Int32 resourceId, const OH_String name, const OH_String value, const Callback_Boolean_Void continuation);
} Callback_String_String_Boolean;
typedef struct Opt_Callback_String_String_Boolean {
    OH_Tag tag;
    Callback_String_String_Boolean value;
} Opt_Callback_String_String_Boolean;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
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
typedef struct Callback_Boolean_Void {
    OH_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Boolean value);
    void (*callSync)(OH_VMContext context, const OH_Int32 resourceId, const OH_Boolean value);
} Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void {
    OH_Tag tag;
    Callback_Boolean_Void value;
} Opt_Callback_Boolean_Void;
typedef struct Opt_ParseInfo {
    OH_Tag tag;
    OH_ParseInfo value;
} Opt_ParseInfo;
typedef struct Opt_Buffer {
    OH_Tag tag;
    OH_Buffer value;
} Opt_Buffer;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
struct OH_XML_XmlSerializerHandleOpaque;
typedef struct OH_XML_XmlSerializerHandleOpaque* OH_XML_XmlSerializerHandle;
typedef struct OH_XML_XmlSerializerModifier {
    OH_XML_XmlSerializerHandle (*construct)(const OH_Buffer* buffer, const Opt_String* encoding);
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
    OH_XML_XmlPullParserHandle (*construct)(const OH_Buffer* buffer, const Opt_String* encoding);
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