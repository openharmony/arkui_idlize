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

#ifndef OH_OHOS_DATA_UNIFIEDDATACHANNEL_H
#define OH_OHOS_DATA_UNIFIEDDATACHANNEL_H

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

#ifdef __cplusplus
  #include <cstdint>
#else
  #include <stdint.h>
#endif

#ifdef __cplusplus
extern "C" [[noreturn]]
#endif
void InteropLogFatal(const char* format, ...);
#define INTEROP_FATAL(msg, ...) do { InteropLogFatal(msg, ##__VA_ARGS__); } while (0)

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
typedef unsigned int InteropUInt32; // Improve: update unsigned int
typedef int64_t InteropInt64;
typedef uint64_t InteropUInt64;
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

typedef struct InteropAsyncWork {
  InteropNativePointer workId;
  void (*queue)(InteropNativePointer workId);
  void (*cancel)(InteropNativePointer workId);
} InteropAsyncWork;

typedef struct InteropAsyncWorker {
  InteropAsyncWork (*createWork)(
    InteropVMContext context,
    InteropNativePointer handle,
    void (*execute)(InteropNativePointer handle),
    void (*complete)(InteropNativePointer handle)
  );
} InteropAsyncWorker;
typedef const InteropAsyncWorker* InteropAsyncWorkerPtr;

typedef struct InteropObject {
  InteropCallbackResource resource;
} InteropObject;

#endif // _INTEROP_TYPES_H_


#define OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType;

typedef InteropFloat32 OH_Float32;
typedef InteropFloat64 OH_Float64;
typedef InteropInt32 OH_Int32;
typedef InteropUInt32 OH_UInt32;
typedef InteropInt64 OH_Int64;
typedef InteropUInt64 OH_UInt64;
typedef InteropInt8 OH_Int8;
typedef InteropUInt8 OH_UInt8;
typedef InteropBoolean OH_Boolean;
typedef InteropCharPtr OH_CharPtr;
typedef InteropNativePointer OH_NativePointer;
typedef InteropString OH_String;
typedef InteropCallbackResource OH_OHOS_DATA_UNIFIEDDATACHANNEL_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_DATA_UNIFIEDDATACHANNEL_VMContext;
typedef InteropAsyncWorker OH_OHOS_DATA_UNIFIEDDATACHANNEL_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_DATA_UNIFIEDDATACHANNEL_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_DATA_UNIFIEDDATACHANNEL_APIKind {
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_API_KIND = 10
} OH_OHOS_DATA_UNIFIEDDATACHANNEL_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Array_unifiedDataChannel_UnifiedRecord Array_unifiedDataChannel_UnifiedRecord;
typedef struct Opt_Array_unifiedDataChannel_UnifiedRecord Opt_Array_unifiedDataChannel_UnifiedRecord;
typedef struct Map_String_Int32 Map_String_Int32;
typedef struct Opt_Map_String_Int32 Opt_Map_String_Int32;
typedef struct Map_String_Number Map_String_Number;
typedef struct Opt_Map_String_Number Opt_Map_String_Number;
typedef struct Map_String_Object Map_String_Object;
typedef struct Opt_Map_String_Object Opt_Map_String_Object;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_Number Opt_Number;
typedef struct Opt_Object Opt_Object;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMapPeer OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMapPeer;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMapPeer* OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap;
typedef struct Opt_image_PixelMap Opt_image_PixelMap;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryPeer OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryPeer;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryPeer* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary;
typedef struct Opt_unifiedDataChannel_Summary Opt_unifiedDataChannel_Summary;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataPeer OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataPeer;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataPeer* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData;
typedef struct Opt_unifiedDataChannel_UnifiedData Opt_unifiedDataChannel_UnifiedData;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordPeer OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordPeer;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordPeer* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord;
typedef struct Opt_unifiedDataChannel_UnifiedRecord Opt_unifiedDataChannel_UnifiedRecord;
typedef struct Opt_String Opt_String;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_WantPeer OHOS_DATA_UNIFIEDDATACHANNEL_WantPeer;
typedef struct OHOS_DATA_UNIFIEDDATACHANNEL_WantPeer* OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want;
typedef struct Opt_Want Opt_Want;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object;
typedef struct Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_String {
    /* kind: ContainerType */
    OH_String* array;
    OH_Int32 length;
} Array_String;
typedef struct Opt_Array_String {
    OH_Tag tag;
    Array_String value;
} Opt_Array_String;
typedef struct Array_unifiedDataChannel_UnifiedRecord {
    /* kind: ContainerType */
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord* array;
    OH_Int32 length;
} Array_unifiedDataChannel_UnifiedRecord;
typedef struct Opt_Array_unifiedDataChannel_UnifiedRecord {
    OH_Tag tag;
    Array_unifiedDataChannel_UnifiedRecord value;
} Opt_Array_unifiedDataChannel_UnifiedRecord;
typedef struct Map_String_Int32 {
    /* kind: ContainerType */
    OH_Int32 size;
    OH_String* keys;
    OH_Int32* values;
} Map_String_Int32;
typedef struct Opt_Map_String_Int32 {
    OH_Tag tag;
    Map_String_Int32 value;
} Opt_Map_String_Int32;
typedef struct Map_String_Number {
    /* kind: ContainerType */
    OH_Int32 size;
    OH_String* keys;
    OH_Number* values;
} Map_String_Number;
typedef struct Opt_Map_String_Number {
    OH_Tag tag;
    Map_String_Number value;
} Opt_Map_String_Number;
typedef struct Map_String_Object {
    /* kind: ContainerType */
    OH_Int32 size;
    OH_String* keys;
    OH_Object* values;
} Map_String_Object;
typedef struct Opt_Map_String_Object {
    OH_Tag tag;
    Map_String_Object value;
} Opt_Map_String_Object;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
typedef struct Opt_Buffer {
    OH_Tag tag;
    OH_Buffer value;
} Opt_Buffer;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
typedef struct Opt_image_PixelMap {
    OH_Tag tag;
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap value;
} Opt_image_PixelMap;
typedef struct Opt_unifiedDataChannel_Summary {
    OH_Tag tag;
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary value;
} Opt_unifiedDataChannel_Summary;
typedef struct Opt_unifiedDataChannel_UnifiedData {
    OH_Tag tag;
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData value;
} Opt_unifiedDataChannel_UnifiedData;
typedef struct Opt_unifiedDataChannel_UnifiedRecord {
    OH_Tag tag;
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord value;
} Opt_unifiedDataChannel_UnifiedRecord;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct Opt_Want {
    OH_Tag tag;
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want value;
} Opt_Want;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_Number value0;
        OH_String value1;
        OH_Boolean value2;
        OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap value3;
        OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want value4;
        OH_Buffer value5;
        OH_Object value6;
    };
} OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object;
typedef struct Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object {
    OH_Tag tag;
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object value;
} Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object;
struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandleOpaque;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandleOpaque* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandle;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifier {
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandle (*construct)();
    void (*destruct)(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandle thisPtr);
    Map_String_Number (*getSummary)(OH_NativePointer thisPtr);
    void (*setSummary)(OH_NativePointer thisPtr, const Map_String_Number* value);
    OH_Number (*getTotalSize)(OH_NativePointer thisPtr);
    void (*setTotalSize)(OH_NativePointer thisPtr, const OH_Number* value);
} OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifier;
struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandleOpaque;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandleOpaque* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifier {
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle (*construct0)(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord record_);
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle (*construct1)();
    void (*destruct)(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle thisPtr);
    void (*addRecord)(OH_NativePointer thisPtr, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord record_);
    Array_unifiedDataChannel_UnifiedRecord (*getRecords)(OH_NativePointer thisPtr);
} OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifier;
struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandleOpaque;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandleOpaque* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifier {
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle (*construct0)();
    OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle (*construct1)(const OH_String* type, const Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object* value);
    void (*destruct)(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle thisPtr);
    OH_String (*getType)(OH_NativePointer thisPtr);
    Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object (*getValue)(OH_NativePointer thisPtr);
} OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifier;
typedef struct OH_OHOS_DATA_UNIFIEDDATACHANNEL_API {
    OH_Int32 version;
    const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifier* (*UnifiedDataChannel_Summary)();
    const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifier* (*UnifiedDataChannel_UnifiedData)();
    const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifier* (*UnifiedDataChannel_UnifiedRecord)();
} OH_OHOS_DATA_UNIFIEDDATACHANNEL_API;
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#include <stdint.h>
// Improve: remove after migration to OH_AnyAPI to be consistant between arkoala and ohos apis
struct Ark_AnyAPI {
    int32_t version;
};
struct OH_AnyAPI {
    int32_t version;
};
#endif
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#include <stdint.h>
#define GENERIC_SERVICE_API_VERSION 1
enum GENERIC_SERVICE_APIKind {
    GENERIC_SERVICE_API_KIND = 14,
};

typedef struct ServiceLogger {
    void (*startGroupedLog)(int kind);
    void (*stopGroupedLog)(int kind);
    void (*appendGroupedLog)(int kind, const char* str);
    const char* (*getGroupedLog)(int kind);
    int (*needGroupedLog)(int kind);
} ServiceLogger;

typedef struct GenericServiceAPI {
    int32_t version;
    void (*setLogger)(const ServiceLogger* logger);
} GenericServiceAPI;
#endif

#ifdef __cplusplus
}  // extern "C"
#endif

#endif // OH_OHOS_DATA_UNIFIEDDATACHANNEL_H
/* clang-format on */