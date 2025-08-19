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

#ifndef OH_OHOS_ANIMATOR_H
#define OH_OHOS_ANIMATOR_H

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


#define OHOS_ANIMATOR_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_ANIMATOR_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_ANIMATOR_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_ANIMATOR_VMContext;
typedef InteropAsyncWorker OH_OHOS_ANIMATOR_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_ANIMATOR_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_ANIMATOR_APIKind {
    OH_OHOS_ANIMATOR_API_KIND = 10
} OH_OHOS_ANIMATOR_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Number Opt_Number;
typedef struct OHOS_ANIMATOR_SimpleAnimatorOptionsPeer OHOS_ANIMATOR_SimpleAnimatorOptionsPeer;
typedef struct OHOS_ANIMATOR_SimpleAnimatorOptionsPeer* OH_OHOS_ANIMATOR_SimpleAnimatorOptions;
typedef struct Opt_SimpleAnimatorOptions Opt_SimpleAnimatorOptions;
typedef struct Opt_String Opt_String;
typedef struct OHOS_ANIMATOR_Callback_Number_Void OHOS_ANIMATOR_Callback_Number_Void;
typedef struct Opt_OHOS_ANIMATOR_Callback_Number_Void Opt_OHOS_ANIMATOR_Callback_Number_Void;
typedef struct OHOS_ANIMATOR_Callback_Void OHOS_ANIMATOR_Callback_Void;
typedef struct Opt_OHOS_ANIMATOR_Callback_Void Opt_OHOS_ANIMATOR_Callback_Void;
typedef struct OH_OHOS_ANIMATOR_AnimatorOptions OH_OHOS_ANIMATOR_AnimatorOptions;
typedef struct Opt_AnimatorOptions Opt_AnimatorOptions;
typedef struct OHOS_ANIMATOR_AnimatorResultPeer OHOS_ANIMATOR_AnimatorResultPeer;
typedef struct OHOS_ANIMATOR_AnimatorResultPeer* OH_OHOS_ANIMATOR_AnimatorResult;
typedef struct Opt_AnimatorResult Opt_AnimatorResult;
typedef struct OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions;
typedef struct Opt_Union_AnimatorOptions_SimpleAnimatorOptions Opt_Union_AnimatorOptions_SimpleAnimatorOptions;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_ANIMATOR_Object;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Opt_CustomObject {
    OH_Tag tag;
    OH_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_SimpleAnimatorOptions {
    OH_Tag tag;
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions value;
} Opt_SimpleAnimatorOptions;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_ANIMATOR_Callback_Number_Void {
    /* kind: Callback */
    OH_OHOS_ANIMATOR_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Number progress);
    void (*callSync)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId, const OH_Number progress);
} OHOS_ANIMATOR_Callback_Number_Void;
typedef struct Opt_OHOS_ANIMATOR_Callback_Number_Void {
    OH_Tag tag;
    OHOS_ANIMATOR_Callback_Number_Void value;
} Opt_OHOS_ANIMATOR_Callback_Number_Void;
typedef struct OHOS_ANIMATOR_Callback_Void {
    /* kind: Callback */
    OH_OHOS_ANIMATOR_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_ANIMATOR_Callback_Void;
typedef struct Opt_OHOS_ANIMATOR_Callback_Void {
    OH_Tag tag;
    OHOS_ANIMATOR_Callback_Void value;
} Opt_OHOS_ANIMATOR_Callback_Void;
typedef struct OH_OHOS_ANIMATOR_AnimatorOptions {
    /* kind: Interface */
    OH_Number duration;
    OH_String easing;
    OH_Number delay;
    OH_String fill;
    OH_String direction;
    OH_Number iterations;
    OH_Number begin;
    OH_Number end;
} OH_OHOS_ANIMATOR_AnimatorOptions;
typedef struct Opt_AnimatorOptions {
    OH_Tag tag;
    OH_OHOS_ANIMATOR_AnimatorOptions value;
} Opt_AnimatorOptions;
typedef struct Opt_AnimatorResult {
    OH_Tag tag;
    OH_OHOS_ANIMATOR_AnimatorResult value;
} Opt_AnimatorResult;
typedef struct OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_OHOS_ANIMATOR_AnimatorOptions value0;
        OH_OHOS_ANIMATOR_SimpleAnimatorOptions value1;
    };
} OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions;
typedef struct Opt_Union_AnimatorOptions_SimpleAnimatorOptions {
    OH_Tag tag;
    OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions value;
} Opt_Union_AnimatorOptions_SimpleAnimatorOptions;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_ANIMATOR_AnimatorResultHandleOpaque;
typedef struct OH_OHOS_ANIMATOR_AnimatorResultHandleOpaque* OH_OHOS_ANIMATOR_AnimatorResultHandle;
typedef struct OH_OHOS_ANIMATOR_AnimatorResultModifier {
    OH_OHOS_ANIMATOR_AnimatorResultHandle (*construct)();
    void (*destruct)(OH_OHOS_ANIMATOR_AnimatorResultHandle thisPtr);
    void (*reset)(OH_NativePointer thisPtr, const OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions* options);
    void (*play)(OH_NativePointer thisPtr);
    void (*finish)(OH_NativePointer thisPtr);
    void (*pause)(OH_NativePointer thisPtr);
    void (*cancel)(OH_NativePointer thisPtr);
    void (*reverse)(OH_NativePointer thisPtr);
    void (*setExpectedFrameRateRange)(OH_NativePointer thisPtr, const OH_CustomObject* rateRange);
    OHOS_ANIMATOR_Callback_Number_Void (*getOnFrame)(OH_NativePointer thisPtr);
    void (*setOnFrame)(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Number_Void* value);
    OHOS_ANIMATOR_Callback_Void (*getOnFinish)(OH_NativePointer thisPtr);
    void (*setOnFinish)(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value);
    OHOS_ANIMATOR_Callback_Void (*getOnCancel)(OH_NativePointer thisPtr);
    void (*setOnCancel)(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value);
    OHOS_ANIMATOR_Callback_Void (*getOnRepeat)(OH_NativePointer thisPtr);
    void (*setOnRepeat)(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value);
} OH_OHOS_ANIMATOR_AnimatorResultModifier;
struct OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandleOpaque;
typedef struct OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandleOpaque* OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle;
typedef struct OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifier {
    OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle (*construct)(const OH_Number* begin, const OH_Number* end);
    void (*destruct)(OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle thisPtr);
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions (*duration)(OH_NativePointer thisPtr, const OH_Number* duration);
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions (*easing)(OH_NativePointer thisPtr, const OH_String* curve);
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions (*delay)(OH_NativePointer thisPtr, const OH_Number* delay);
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions (*fill)(OH_NativePointer thisPtr, const OH_CustomObject* fillMode);
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions (*direction)(OH_NativePointer thisPtr, const OH_CustomObject* direction);
    OH_OHOS_ANIMATOR_SimpleAnimatorOptions (*iterations)(OH_NativePointer thisPtr, const OH_Number* iterations);
} OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifier;
typedef struct OH_OHOS_ANIMATOR_API {
    OH_Int32 version;
    const OH_OHOS_ANIMATOR_AnimatorResultModifier* (*AnimatorResult)();
    const OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifier* (*SimpleAnimatorOptions)();
} OH_OHOS_ANIMATOR_API;
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

#endif // OH_OHOS_ANIMATOR_H
/* clang-format on */