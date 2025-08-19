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

#ifndef OH_OHOS_APP_ABILITY_STARTOPTIONS_H
#define OH_OHOS_APP_ABILITY_STARTOPTIONS_H

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


#define OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_APP_ABILITY_STARTOPTIONS_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_APP_ABILITY_STARTOPTIONS_VMContext;
typedef InteropAsyncWorker OH_OHOS_APP_ABILITY_STARTOPTIONS_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_APP_ABILITY_STARTOPTIONS_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_APP_ABILITY_STARTOPTIONS_APIKind {
    OH_OHOS_APP_ABILITY_STARTOPTIONS_API_KIND = 10
} OH_OHOS_APP_ABILITY_STARTOPTIONS_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_bundleManager_SupportWindowMode Array_bundleManager_SupportWindowMode;
typedef struct Opt_Array_bundleManager_SupportWindowMode Opt_Array_bundleManager_SupportWindowMode;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Int64 Opt_Int64;
typedef struct OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMapPeer OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMapPeer;
typedef struct OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMapPeer* OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap;
typedef struct Opt_image_PixelMap Opt_image_PixelMap;
typedef struct Opt_String Opt_String;
typedef struct OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsPeer OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsPeer;
typedef struct OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsPeer* OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions;
typedef struct Opt_StartOptions Opt_StartOptions;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_APP_ABILITY_STARTOPTIONS_Object;
typedef enum OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode {
    OH_OHOS_APP_ABILITY_STARTOPTIONS_BUNDLE_MANAGER_SUPPORT_WINDOW_MODE_FULL_SCREEN = 0,
    OH_OHOS_APP_ABILITY_STARTOPTIONS_BUNDLE_MANAGER_SUPPORT_WINDOW_MODE_SPLIT = 1,
    OH_OHOS_APP_ABILITY_STARTOPTIONS_BUNDLE_MANAGER_SUPPORT_WINDOW_MODE_FLOATING = 2,
} OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode;
typedef struct Opt_bundleManager_SupportWindowMode {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode value;
} Opt_bundleManager_SupportWindowMode;
typedef enum OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode {
    OH_OHOS_APP_ABILITY_STARTOPTIONS_CONTEXT_CONSTANT_PROCESS_MODE_NEW_PROCESS_ATTACH_TO_PARENT = 1,
    OH_OHOS_APP_ABILITY_STARTOPTIONS_CONTEXT_CONSTANT_PROCESS_MODE_NEW_PROCESS_ATTACH_TO_STATUS_BAR_ITEM = 2,
    OH_OHOS_APP_ABILITY_STARTOPTIONS_CONTEXT_CONSTANT_PROCESS_MODE_ATTACH_TO_STATUS_BAR_ITEM = 3,
} OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode;
typedef struct Opt_contextConstant_ProcessMode {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode value;
} Opt_contextConstant_ProcessMode;
typedef enum OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility {
    OH_OHOS_APP_ABILITY_STARTOPTIONS_CONTEXT_CONSTANT_STARTUP_VISIBILITY_STARTUP_HIDE = 0,
    OH_OHOS_APP_ABILITY_STARTOPTIONS_CONTEXT_CONSTANT_STARTUP_VISIBILITY_STARTUP_SHOW = 1,
} OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility;
typedef struct Opt_contextConstant_StartupVisibility {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility value;
} Opt_contextConstant_StartupVisibility;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_bundleManager_SupportWindowMode {
    /* kind: ContainerType */
    OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode* array;
    OH_Int32 length;
} Array_bundleManager_SupportWindowMode;
typedef struct Opt_Array_bundleManager_SupportWindowMode {
    OH_Tag tag;
    Array_bundleManager_SupportWindowMode value;
} Opt_Array_bundleManager_SupportWindowMode;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct Opt_image_PixelMap {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap value;
} Opt_image_PixelMap;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct Opt_StartOptions {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions value;
} Opt_StartOptions;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandleOpaque;
typedef struct OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandleOpaque* OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandle;
typedef struct OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifier {
    OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandle (*construct)();
    void (*destruct)(OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandle thisPtr);
    Opt_Int32 (*getWindowMode)(OH_NativePointer thisPtr);
    void (*setWindowMode)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int64 (*getDisplayId)(OH_NativePointer thisPtr);
    void (*setDisplayId)(OH_NativePointer thisPtr, const Opt_Int64* value);
    Opt_Boolean (*getWithAnimation)(OH_NativePointer thisPtr);
    void (*setWithAnimation)(OH_NativePointer thisPtr, const Opt_Boolean* value);
    Opt_Int32 (*getWindowLeft)(OH_NativePointer thisPtr);
    void (*setWindowLeft)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int32 (*getWindowTop)(OH_NativePointer thisPtr);
    void (*setWindowTop)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int32 (*getWindowWidth)(OH_NativePointer thisPtr);
    void (*setWindowWidth)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int32 (*getWindowHeight)(OH_NativePointer thisPtr);
    void (*setWindowHeight)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Boolean (*getWindowFocused)(OH_NativePointer thisPtr);
    void (*setWindowFocused)(OH_NativePointer thisPtr, const Opt_Boolean* value);
    Opt_contextConstant_ProcessMode (*getProcessMode)(OH_NativePointer thisPtr);
    void (*setProcessMode)(OH_NativePointer thisPtr, const Opt_contextConstant_ProcessMode* value);
    Opt_contextConstant_StartupVisibility (*getStartupVisibility)(OH_NativePointer thisPtr);
    void (*setStartupVisibility)(OH_NativePointer thisPtr, const Opt_contextConstant_StartupVisibility* value);
    Opt_image_PixelMap (*getStartWindowIcon)(OH_NativePointer thisPtr);
    void (*setStartWindowIcon)(OH_NativePointer thisPtr, const Opt_image_PixelMap* value);
    Opt_String (*getStartWindowBackgroundColor)(OH_NativePointer thisPtr);
    void (*setStartWindowBackgroundColor)(OH_NativePointer thisPtr, const Opt_String* value);
    Opt_Array_bundleManager_SupportWindowMode (*getSupportWindowModes)(OH_NativePointer thisPtr);
    void (*setSupportWindowModes)(OH_NativePointer thisPtr, const Opt_Array_bundleManager_SupportWindowMode* value);
    Opt_Int32 (*getMinWindowWidth)(OH_NativePointer thisPtr);
    void (*setMinWindowWidth)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int32 (*getMinWindowHeight)(OH_NativePointer thisPtr);
    void (*setMinWindowHeight)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int32 (*getMaxWindowWidth)(OH_NativePointer thisPtr);
    void (*setMaxWindowWidth)(OH_NativePointer thisPtr, const Opt_Int32* value);
    Opt_Int32 (*getMaxWindowHeight)(OH_NativePointer thisPtr);
    void (*setMaxWindowHeight)(OH_NativePointer thisPtr, const Opt_Int32* value);
} OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifier;
typedef struct OH_OHOS_APP_ABILITY_STARTOPTIONS_API {
    OH_Int32 version;
    const OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifier* (*StartOptions)();
} OH_OHOS_APP_ABILITY_STARTOPTIONS_API;
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

#endif // OH_OHOS_APP_ABILITY_STARTOPTIONS_H
/* clang-format on */