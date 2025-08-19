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

#ifndef OH_OHOS_APP_ABILITY_ABILITY_H
#define OH_OHOS_APP_ABILITY_ABILITY_H

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


#define OHOS_APP_ABILITY_ABILITY_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_APP_ABILITY_ABILITY_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_APP_ABILITY_ABILITY_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_APP_ABILITY_ABILITY_VMContext;
typedef InteropAsyncWorker OH_OHOS_APP_ABILITY_ABILITY_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_APP_ABILITY_ABILITY_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_APP_ABILITY_ABILITY_APIKind {
    OH_OHOS_APP_ABILITY_ABILITY_API_KIND = 10
} OH_OHOS_APP_ABILITY_ABILITY_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Map_String_Int32 Map_String_Int32;
typedef struct Opt_Map_String_Int32 Opt_Map_String_Int32;
typedef struct Map_String_Object Map_String_Object;
typedef struct Opt_Map_String_Object Opt_Map_String_Object;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_Int64 Opt_Int64;
typedef struct Opt_Object Opt_Object;
typedef struct OHOS_APP_ABILITY_ABILITY_AbilityPeer OHOS_APP_ABILITY_ABILITY_AbilityPeer;
typedef struct OHOS_APP_ABILITY_ABILITY_AbilityPeer* OH_OHOS_APP_ABILITY_ABILITY_Ability;
typedef struct Opt_Ability Opt_Ability;
typedef struct OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackPeer OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackPeer;
typedef struct OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackPeer* OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallback;
typedef struct Opt_AbilityLifecycleCallback Opt_AbilityLifecycleCallback;
typedef struct OHOS_APP_ABILITY_ABILITY_CalleePeer OHOS_APP_ABILITY_ABILITY_CalleePeer;
typedef struct OHOS_APP_ABILITY_ABILITY_CalleePeer* OH_OHOS_APP_ABILITY_ABILITY_Callee;
typedef struct Opt_Callee Opt_Callee;
typedef struct OHOS_APP_ABILITY_ABILITY_window_WindowStagePeer OHOS_APP_ABILITY_ABILITY_window_WindowStagePeer;
typedef struct OHOS_APP_ABILITY_ABILITY_window_WindowStagePeer* OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage;
typedef struct Opt_window_WindowStage Opt_window_WindowStage;
typedef struct Opt_String Opt_String;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitDetailInfo OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitDetailInfo;
typedef struct Opt_AbilityConstant_LastExitDetailInfo Opt_AbilityConstant_LastExitDetailInfo;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_Configuration OH_OHOS_APP_ABILITY_ABILITY_Configuration;
typedef struct Opt_Configuration Opt_Configuration;
typedef struct OHOS_APP_ABILITY_ABILITY_WantPeer OHOS_APP_ABILITY_ABILITY_WantPeer;
typedef struct OHOS_APP_ABILITY_ABILITY_WantPeer* OH_OHOS_APP_ABILITY_ABILITY_Want;
typedef struct Opt_Want Opt_Want;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchParam OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchParam;
typedef struct Opt_AbilityConstant_LaunchParam Opt_AbilityConstant_LaunchParam;
typedef struct OHOS_APP_ABILITY_ABILITY_UIAbilityPeer OHOS_APP_ABILITY_ABILITY_UIAbilityPeer;
typedef struct OHOS_APP_ABILITY_ABILITY_UIAbilityPeer* OH_OHOS_APP_ABILITY_ABILITY_UIAbility;
typedef struct Opt_UIAbility Opt_UIAbility;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitReason {
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_UNKNOWN = 0,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_NORMAL = 2,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_CPP_CRASH = 3,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_JS_ERROR = 4,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_APP_FREEZE = 5,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_PERFORMANCE_CONTROL = 6,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_RESOURCE_CONTROL = 7,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_UPGRADE = 8,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_USER_REQUEST = 9,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAST_EXIT_REASON_SIGNAL = 10,
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitReason;
typedef struct Opt_AbilityConstant_LastExitReason {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitReason value;
} Opt_AbilityConstant_LastExitReason;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchReason {
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_UNKNOWN = 0,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_START_ABILITY = 1,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_CALL = 2,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_CONTINUATION = 3,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_APP_RECOVERY = 4,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_SHARE = 5,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_AUTO_STARTUP = 8,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_INSIGHT_INTENT = 9,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_PREPARE_CONTINUATION = 10,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_LAUNCH_REASON_PRELOAD = 11,
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchReason;
typedef struct Opt_AbilityConstant_LaunchReason {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchReason value;
} Opt_AbilityConstant_LaunchReason;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_MemoryLevel {
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_MEMORY_LEVEL_MEMORY_LEVEL_MODERATE = 0,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_MEMORY_LEVEL_MEMORY_LEVEL_LOW = 1,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_MEMORY_LEVEL_MEMORY_LEVEL_CRITICAL = 2,
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_MemoryLevel;
typedef struct Opt_AbilityConstant_MemoryLevel {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_MemoryLevel value;
} Opt_AbilityConstant_MemoryLevel;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_OnSaveResult {
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_ON_SAVE_RESULT_ALL_AGREE = 0,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_ON_SAVE_RESULT_CONTINUATION_REJECT = 1,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_ON_SAVE_RESULT_CONTINUATION_MISMATCH = 2,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_ON_SAVE_RESULT_RECOVERY_AGREE = 3,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_ON_SAVE_RESULT_RECOVERY_REJECT = 4,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_ON_SAVE_RESULT_ALL_REJECT = 5,
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_OnSaveResult;
typedef struct Opt_AbilityConstant_OnSaveResult {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_OnSaveResult value;
} Opt_AbilityConstant_OnSaveResult;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_StateType {
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_STATE_TYPE_CONTINUATION = 0,
    OH_OHOS_APP_ABILITY_ABILITY_ABILITY_CONSTANT_STATE_TYPE_APP_RECOVERY = 1,
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_StateType;
typedef struct Opt_AbilityConstant_StateType {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_StateType value;
} Opt_AbilityConstant_StateType;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_ColorMode {
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_NOT_SET = -1,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_DARK = 0,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_LIGHT = 1,
} OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_ColorMode;
typedef struct Opt_ConfigurationConstant_ColorMode {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_ColorMode value;
} Opt_ConfigurationConstant_ColorMode;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_Direction {
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_DIRECTION_DIRECTION_NOT_SET = -1,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_DIRECTION_DIRECTION_VERTICAL = 0,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_DIRECTION_DIRECTION_HORIZONTAL = 1,
} OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_Direction;
typedef struct Opt_ConfigurationConstant_Direction {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_Direction value;
} Opt_ConfigurationConstant_Direction;
typedef enum OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_ScreenDensity {
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_NOT_SET = 0,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_SDPI = 120,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_MDPI = 160,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_LDPI = 240,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_XLDPI = 320,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_XXLDPI = 480,
    OH_OHOS_APP_ABILITY_ABILITY_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_XXXLDPI = 640,
} OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_ScreenDensity;
typedef struct Opt_ConfigurationConstant_ScreenDensity {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_ConfigurationConstant_ScreenDensity value;
} Opt_ConfigurationConstant_ScreenDensity;
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
typedef struct Opt_CustomObject {
    OH_Tag tag;
    OH_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_Float64 {
    OH_Tag tag;
    OH_Float64 value;
} Opt_Float64;
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
typedef struct Opt_Ability {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_Ability value;
} Opt_Ability;
typedef struct Opt_AbilityLifecycleCallback {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallback value;
} Opt_AbilityLifecycleCallback;
typedef struct Opt_Callee {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_Callee value;
} Opt_Callee;
typedef struct Opt_window_WindowStage {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage value;
} Opt_window_WindowStage;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitDetailInfo {
    /* kind: Interface */
    OH_Int32 pid;
    OH_String processName;
    OH_Int32 uid;
    OH_Int32 exitSubReason;
    OH_String exitMsg;
    OH_Int32 rss;
    OH_Int32 pss;
    OH_Int64 timestamp;
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitDetailInfo;
typedef struct Opt_AbilityConstant_LastExitDetailInfo {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitDetailInfo value;
} Opt_AbilityConstant_LastExitDetailInfo;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_Configuration {
    /* kind: Interface */
    Opt_String language;
    Opt_ConfigurationConstant_ColorMode colorMode;
    Opt_ConfigurationConstant_Direction direction;
    Opt_ConfigurationConstant_ScreenDensity screenDensity;
    Opt_Int64 displayId;
    Opt_Boolean hasPointerDevice;
    Opt_Float64 fontSizeScale;
    Opt_Float64 fontWeightScale;
    Opt_String mcc;
    Opt_String mnc;
} OH_OHOS_APP_ABILITY_ABILITY_Configuration;
typedef struct Opt_Configuration {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_Configuration value;
} Opt_Configuration;
typedef struct Opt_Want {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_Want value;
} Opt_Want;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchParam {
    /* kind: Interface */
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchReason launchReason;
    Opt_String launchReasonMessage;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LastExitReason lastExitReason;
    OH_String lastExitMessage;
    Opt_AbilityConstant_LastExitDetailInfo lastExitDetailInfo;
} OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchParam;
typedef struct Opt_AbilityConstant_LaunchParam {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_LaunchParam value;
} Opt_AbilityConstant_LaunchParam;
typedef struct Opt_UIAbility {
    OH_Tag tag;
    OH_OHOS_APP_ABILITY_ABILITY_UIAbility value;
} Opt_UIAbility;
struct OH_OHOS_APP_ABILITY_ABILITY_AbilityHandleOpaque;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityHandleOpaque* OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityModifier {
    OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle (*construct)();
    void (*destruct)(OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle thisPtr);
    void (*onConfigurationUpdate)(OH_NativePointer thisPtr, const OH_OHOS_APP_ABILITY_ABILITY_Configuration* newConfig);
    void (*onMemoryLevel)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_MemoryLevel level);
} OH_OHOS_APP_ABILITY_ABILITY_AbilityModifier;
struct OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandleOpaque;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandleOpaque* OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifier {
    OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle (*construct)();
    void (*destruct)(OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle thisPtr);
    void (*onAbilityCreate)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
    void (*onWindowStageCreate)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability, OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage windowStage);
    void (*onWindowStageDestroy)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability, OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage windowStage);
    void (*onAbilityDestroy)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
    void (*onAbilityForeground)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
    void (*onAbilityBackground)(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
} OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifier;
typedef struct OH_OHOS_APP_ABILITY_ABILITY_API {
    OH_Int32 version;
    const OH_OHOS_APP_ABILITY_ABILITY_AbilityModifier* (*Ability)();
    const OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifier* (*AbilityLifecycleCallback)();
} OH_OHOS_APP_ABILITY_ABILITY_API;
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

#endif // OH_OHOS_APP_ABILITY_ABILITY_H
/* clang-format on */