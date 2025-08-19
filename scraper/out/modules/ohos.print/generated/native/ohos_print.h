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

#ifndef OH_OHOS_PRINT_H
#define OH_OHOS_PRINT_H

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


#define OHOS_PRINT_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_PRINT_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_PRINT_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_PRINT_VMContext;
typedef InteropAsyncWorker OH_OHOS_PRINT_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_PRINT_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_PRINT_APIKind {
    OH_OHOS_PRINT_API_KIND = 10
} OH_OHOS_PRINT_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_Number Array_Number;
typedef struct Opt_Array_Number Opt_Array_Number;
typedef struct Opt_Number Opt_Number;
typedef struct OHOS_PRINT_print_PrintDocumentAdapterPeer OHOS_PRINT_print_PrintDocumentAdapterPeer;
typedef struct OHOS_PRINT_print_PrintDocumentAdapterPeer* OH_OHOS_PRINT_print_PrintDocumentAdapter;
typedef struct Opt_print_PrintDocumentAdapter Opt_print_PrintDocumentAdapter;
typedef struct Opt_String Opt_String;
typedef struct OHOS_PRINT_Callback_Void OHOS_PRINT_Callback_Void;
typedef struct Opt_OHOS_PRINT_Callback_Void Opt_OHOS_PRINT_Callback_Void;
typedef struct OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void;
typedef struct Opt_OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void Opt_OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void;
typedef struct OH_OHOS_PRINT_print_PrintPageRange OH_OHOS_PRINT_print_PrintPageRange;
typedef struct Opt_print_PrintPageRange Opt_print_PrintPageRange;
typedef struct OH_OHOS_PRINT_print_PrintPageSize OH_OHOS_PRINT_print_PrintPageSize;
typedef struct Opt_print_PrintPageSize Opt_print_PrintPageSize;
typedef struct OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType;
typedef struct Opt_Union_PrintPageSize_PrintPageType Opt_Union_PrintPageSize_PrintPageType;
typedef struct OH_OHOS_PRINT_print_PrintAttributes OH_OHOS_PRINT_print_PrintAttributes;
typedef struct Opt_print_PrintAttributes Opt_print_PrintAttributes;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_PRINT_Object;
typedef enum OH_OHOS_PRINT_print_PrintColorMode {
    OH_OHOS_PRINT_PRINT_PRINT_COLOR_MODE_COLOR_MODE_MONOCHROME = 0,
    OH_OHOS_PRINT_PRINT_PRINT_COLOR_MODE_COLOR_MODE_COLOR = 1,
} OH_OHOS_PRINT_print_PrintColorMode;
typedef struct Opt_print_PrintColorMode {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintColorMode value;
} Opt_print_PrintColorMode;
typedef enum OH_OHOS_PRINT_print_PrintDirectionMode {
    OH_OHOS_PRINT_PRINT_PRINT_DIRECTION_MODE_DIRECTION_MODE_AUTO = 0,
    OH_OHOS_PRINT_PRINT_PRINT_DIRECTION_MODE_DIRECTION_MODE_PORTRAIT = 1,
    OH_OHOS_PRINT_PRINT_PRINT_DIRECTION_MODE_DIRECTION_MODE_LANDSCAPE = 2,
} OH_OHOS_PRINT_print_PrintDirectionMode;
typedef struct Opt_print_PrintDirectionMode {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintDirectionMode value;
} Opt_print_PrintDirectionMode;
typedef enum OH_OHOS_PRINT_print_PrintDocumentAdapterState {
    OH_OHOS_PRINT_PRINT_PRINT_DOCUMENT_ADAPTER_STATE_PREVIEW_DESTROY = 0,
    OH_OHOS_PRINT_PRINT_PRINT_DOCUMENT_ADAPTER_STATE_PRINT_TASK_SUCCEED = 1,
    OH_OHOS_PRINT_PRINT_PRINT_DOCUMENT_ADAPTER_STATE_PRINT_TASK_FAIL = 2,
    OH_OHOS_PRINT_PRINT_PRINT_DOCUMENT_ADAPTER_STATE_PRINT_TASK_CANCEL = 3,
    OH_OHOS_PRINT_PRINT_PRINT_DOCUMENT_ADAPTER_STATE_PRINT_TASK_BLOCK = 4,
} OH_OHOS_PRINT_print_PrintDocumentAdapterState;
typedef struct Opt_print_PrintDocumentAdapterState {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintDocumentAdapterState value;
} Opt_print_PrintDocumentAdapterState;
typedef enum OH_OHOS_PRINT_print_PrintDuplexMode {
    OH_OHOS_PRINT_PRINT_PRINT_DUPLEX_MODE_DUPLEX_MODE_NONE = 0,
    OH_OHOS_PRINT_PRINT_PRINT_DUPLEX_MODE_DUPLEX_MODE_LONG_EDGE = 1,
    OH_OHOS_PRINT_PRINT_PRINT_DUPLEX_MODE_DUPLEX_MODE_SHORT_EDGE = 2,
} OH_OHOS_PRINT_print_PrintDuplexMode;
typedef struct Opt_print_PrintDuplexMode {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintDuplexMode value;
} Opt_print_PrintDuplexMode;
typedef enum OH_OHOS_PRINT_print_PrintFileCreationState {
    OH_OHOS_PRINT_PRINT_PRINT_FILE_CREATION_STATE_PRINT_FILE_CREATED = 0,
    OH_OHOS_PRINT_PRINT_PRINT_FILE_CREATION_STATE_PRINT_FILE_CREATION_FAILED = 1,
    OH_OHOS_PRINT_PRINT_PRINT_FILE_CREATION_STATE_PRINT_FILE_CREATED_UNRENDERED = 2,
} OH_OHOS_PRINT_print_PrintFileCreationState;
typedef struct Opt_print_PrintFileCreationState {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintFileCreationState value;
} Opt_print_PrintFileCreationState;
typedef enum OH_OHOS_PRINT_print_PrintPageType {
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_ISO_A3 = 0,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_ISO_A4 = 1,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_ISO_A5 = 2,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_JIS_B5 = 3,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_ISO_C5 = 4,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_ISO_DL = 5,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_LETTER = 6,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_LEGAL = 7,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_PHOTO_4X6 = 8,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_PHOTO_5X7 = 9,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_INT_DL_ENVELOPE = 10,
    OH_OHOS_PRINT_PRINT_PRINT_PAGE_TYPE_PAGE_B_TABLOID = 11,
} OH_OHOS_PRINT_print_PrintPageType;
typedef struct Opt_print_PrintPageType {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintPageType value;
} Opt_print_PrintPageType;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_Number {
    /* kind: ContainerType */
    OH_Number* array;
    OH_Int32 length;
} Array_Number;
typedef struct Opt_Array_Number {
    OH_Tag tag;
    Array_Number value;
} Opt_Array_Number;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_print_PrintDocumentAdapter {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintDocumentAdapter value;
} Opt_print_PrintDocumentAdapter;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_PRINT_Callback_Void {
    /* kind: Callback */
    OH_OHOS_PRINT_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_PRINT_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_PRINT_Callback_Void;
typedef struct Opt_OHOS_PRINT_Callback_Void {
    OH_Tag tag;
    OHOS_PRINT_Callback_Void value;
} Opt_OHOS_PRINT_Callback_Void;
typedef struct OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void {
    /* kind: Callback */
    OH_OHOS_PRINT_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult);
    void (*callSync)(OH_OHOS_PRINT_VMContext vmContext, const OH_Int32 resourceId, const OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult);
} OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void;
typedef struct Opt_OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void {
    OH_Tag tag;
    OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void value;
} Opt_OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void;
typedef struct OH_OHOS_PRINT_print_PrintPageRange {
    /* kind: Interface */
    Opt_Number startPage;
    Opt_Number endPage;
    Opt_Array_Number pages;
} OH_OHOS_PRINT_print_PrintPageRange;
typedef struct Opt_print_PrintPageRange {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintPageRange value;
} Opt_print_PrintPageRange;
typedef struct OH_OHOS_PRINT_print_PrintPageSize {
    /* kind: Interface */
    OH_String id;
    OH_String name;
    OH_Number width;
    OH_Number height;
} OH_OHOS_PRINT_print_PrintPageSize;
typedef struct Opt_print_PrintPageSize {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintPageSize value;
} Opt_print_PrintPageSize;
typedef struct OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_OHOS_PRINT_print_PrintPageSize value0;
        OH_OHOS_PRINT_print_PrintPageType value1;
    };
} OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType;
typedef struct Opt_Union_PrintPageSize_PrintPageType {
    OH_Tag tag;
    OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType value;
} Opt_Union_PrintPageSize_PrintPageType;
typedef struct OH_OHOS_PRINT_print_PrintAttributes {
    /* kind: Interface */
    Opt_Number copyNumber;
    Opt_print_PrintPageRange pageRange;
    Opt_Union_PrintPageSize_PrintPageType pageSize;
    Opt_print_PrintDirectionMode directionMode;
    Opt_print_PrintColorMode colorMode;
    Opt_print_PrintDuplexMode duplexMode;
} OH_OHOS_PRINT_print_PrintAttributes;
typedef struct Opt_print_PrintAttributes {
    OH_Tag tag;
    OH_OHOS_PRINT_print_PrintAttributes value;
} Opt_print_PrintAttributes;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_PRINT_print_PrintDocumentAdapterHandleOpaque;
typedef struct OH_OHOS_PRINT_print_PrintDocumentAdapterHandleOpaque* OH_OHOS_PRINT_print_PrintDocumentAdapterHandle;
typedef struct OH_OHOS_PRINT_print_PrintDocumentAdapterModifier {
    OH_OHOS_PRINT_print_PrintDocumentAdapterHandle (*construct)();
    void (*destruct)(OH_OHOS_PRINT_print_PrintDocumentAdapterHandle thisPtr);
    void (*onStartLayoutWrite)(OH_NativePointer thisPtr, const OH_String* jobId, const OH_OHOS_PRINT_print_PrintAttributes* oldAttrs, const OH_OHOS_PRINT_print_PrintAttributes* newAttrs, const OH_Number* fd, const OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void* writeResultCallback);
    void (*onJobStateChanged)(OH_NativePointer thisPtr, const OH_String* jobId, OH_OHOS_PRINT_print_PrintDocumentAdapterState state);
} OH_OHOS_PRINT_print_PrintDocumentAdapterModifier;
typedef struct OH_OHOS_PRINT_API {
    OH_Int32 version;
    const OH_OHOS_PRINT_print_PrintDocumentAdapterModifier* (*Print_PrintDocumentAdapter)();
} OH_OHOS_PRINT_API;
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

#endif // OH_OHOS_PRINT_H
/* clang-format on */