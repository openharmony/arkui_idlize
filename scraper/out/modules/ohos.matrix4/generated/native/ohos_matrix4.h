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

#ifndef OH_OHOS_MATRIX4_H
#define OH_OHOS_MATRIX4_H

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


#define OHOS_MATRIX4_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_MATRIX4_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_MATRIX4_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_MATRIX4_VMContext;
typedef InteropAsyncWorker OH_OHOS_MATRIX4_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_MATRIX4_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_MATRIX4_APIKind {
    OH_OHOS_MATRIX4_API_KIND = 10
} OH_OHOS_MATRIX4_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_matrix4_Point Array_matrix4_Point;
typedef struct Opt_Array_matrix4_Point Opt_Array_matrix4_Point;
typedef struct Opt_Number Opt_Number;
typedef struct OHOS_MATRIX4_matrix4_Matrix4TransitPeer OHOS_MATRIX4_matrix4_Matrix4TransitPeer;
typedef struct OHOS_MATRIX4_matrix4_Matrix4TransitPeer* OH_OHOS_MATRIX4_matrix4_Matrix4Transit;
typedef struct Opt_matrix4_Matrix4Transit Opt_matrix4_Matrix4Transit;
typedef struct OH_OHOS_MATRIX4_matrix4_Point OH_OHOS_MATRIX4_matrix4_Point;
typedef struct Opt_matrix4_Point Opt_matrix4_Point;
typedef struct OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number;
typedef struct Opt_matrix4_Tuple_Number_Number Opt_matrix4_Tuple_Number_Number;
typedef struct OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions;
typedef struct Opt_matrix4_PolyToPolyOptions Opt_matrix4_PolyToPolyOptions;
typedef struct OH_OHOS_MATRIX4_matrix4_RotateOption OH_OHOS_MATRIX4_matrix4_RotateOption;
typedef struct Opt_matrix4_RotateOption Opt_matrix4_RotateOption;
typedef struct OH_OHOS_MATRIX4_matrix4_ScaleOption OH_OHOS_MATRIX4_matrix4_ScaleOption;
typedef struct Opt_matrix4_ScaleOption Opt_matrix4_ScaleOption;
typedef struct OH_OHOS_MATRIX4_matrix4_TranslateOption OH_OHOS_MATRIX4_matrix4_TranslateOption;
typedef struct Opt_matrix4_TranslateOption Opt_matrix4_TranslateOption;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_MATRIX4_Object;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_matrix4_Point {
    /* kind: ContainerType */
    OH_OHOS_MATRIX4_matrix4_Point* array;
    OH_Int32 length;
} Array_matrix4_Point;
typedef struct Opt_Array_matrix4_Point {
    OH_Tag tag;
    Array_matrix4_Point value;
} Opt_Array_matrix4_Point;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_matrix4_Matrix4Transit {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit value;
} Opt_matrix4_Matrix4Transit;
typedef struct OH_OHOS_MATRIX4_matrix4_Point {
    /* kind: Interface */
    OH_Number x;
    OH_Number y;
} OH_OHOS_MATRIX4_matrix4_Point;
typedef struct Opt_matrix4_Point {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_Point value;
} Opt_matrix4_Point;
typedef struct OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number {
    /* kind: Interface */
    OH_Number value0;
    OH_Number value1;
} OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number;
typedef struct Opt_matrix4_Tuple_Number_Number {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number value;
} Opt_matrix4_Tuple_Number_Number;
typedef struct OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions {
    /* kind: Interface */
    Array_matrix4_Point src;
    Opt_Number srcIndex;
    Array_matrix4_Point dst;
    Opt_Number dstIndex;
    Opt_Number pointCount;
} OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions;
typedef struct Opt_matrix4_PolyToPolyOptions {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions value;
} Opt_matrix4_PolyToPolyOptions;
typedef struct OH_OHOS_MATRIX4_matrix4_RotateOption {
    /* kind: Interface */
    Opt_Number x;
    Opt_Number y;
    Opt_Number z;
    Opt_Number centerX;
    Opt_Number centerY;
    Opt_Number angle;
} OH_OHOS_MATRIX4_matrix4_RotateOption;
typedef struct Opt_matrix4_RotateOption {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_RotateOption value;
} Opt_matrix4_RotateOption;
typedef struct OH_OHOS_MATRIX4_matrix4_ScaleOption {
    /* kind: Interface */
    Opt_Number x;
    Opt_Number y;
    Opt_Number z;
    Opt_Number centerX;
    Opt_Number centerY;
} OH_OHOS_MATRIX4_matrix4_ScaleOption;
typedef struct Opt_matrix4_ScaleOption {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_ScaleOption value;
} Opt_matrix4_ScaleOption;
typedef struct OH_OHOS_MATRIX4_matrix4_TranslateOption {
    /* kind: Interface */
    Opt_Number x;
    Opt_Number y;
    Opt_Number z;
} OH_OHOS_MATRIX4_matrix4_TranslateOption;
typedef struct Opt_matrix4_TranslateOption {
    OH_Tag tag;
    OH_OHOS_MATRIX4_matrix4_TranslateOption value;
} Opt_matrix4_TranslateOption;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandleOpaque;
typedef struct OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandleOpaque* OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandle;
typedef struct OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifier {
    OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandle (*construct)();
    void (*destruct)(OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandle thisPtr);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*copy)(OH_NativePointer thisPtr);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*invert)(OH_NativePointer thisPtr);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*combine)(OH_NativePointer thisPtr, OH_OHOS_MATRIX4_matrix4_Matrix4Transit options);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*translate)(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_TranslateOption* options);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*scale)(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_ScaleOption* options);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*skew)(OH_NativePointer thisPtr, const OH_Number* x, const OH_Number* y);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*rotate)(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_RotateOption* options);
    OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number (*transformPoint)(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number* options);
    OH_OHOS_MATRIX4_matrix4_Matrix4Transit (*setPolyToPoly)(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions* options);
} OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifier;
typedef struct OH_OHOS_MATRIX4_API {
    OH_Int32 version;
    const OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifier* (*Matrix4_Matrix4Transit)();
} OH_OHOS_MATRIX4_API;
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

#endif // OH_OHOS_MATRIX4_H
/* clang-format on */