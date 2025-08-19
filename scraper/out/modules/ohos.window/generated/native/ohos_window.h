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

#ifndef OH_OHOS_WINDOW_H
#define OH_OHOS_WINDOW_H

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


#define OHOS_WINDOW_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_WINDOW_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_WINDOW_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_WINDOW_VMContext;
typedef InteropAsyncWorker OH_OHOS_WINDOW_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_WINDOW_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_WINDOW_APIKind {
    OH_OHOS_WINDOW_API_KIND = 10
} OH_OHOS_WINDOW_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_Int64 Opt_Int64;
typedef struct Opt_Number Opt_Number;
typedef struct OHOS_WINDOW_image_PixelMapPeer OHOS_WINDOW_image_PixelMapPeer;
typedef struct OHOS_WINDOW_image_PixelMapPeer* OH_OHOS_WINDOW_image_PixelMap;
typedef struct Opt_image_PixelMap Opt_image_PixelMap;
typedef struct OHOS_WINDOW_UIContextPeer OHOS_WINDOW_UIContextPeer;
typedef struct OHOS_WINDOW_UIContextPeer* OH_OHOS_WINDOW_UIContext;
typedef struct Opt_UIContext Opt_UIContext;
typedef struct OH_OHOS_WINDOW_window_Rect OH_OHOS_WINDOW_window_Rect;
typedef struct Opt_window_Rect Opt_window_Rect;
typedef struct OH_OHOS_WINDOW_window_Size OH_OHOS_WINDOW_window_Size;
typedef struct Opt_window_Size Opt_window_Size;
typedef struct OH_OHOS_WINDOW_window_TitleButtonRect OH_OHOS_WINDOW_window_TitleButtonRect;
typedef struct Opt_window_TitleButtonRect Opt_window_TitleButtonRect;
typedef struct OHOS_WINDOW_window_WindowPeer OHOS_WINDOW_window_WindowPeer;
typedef struct OHOS_WINDOW_window_WindowPeer* OH_OHOS_WINDOW_window_Window;
typedef struct Opt_window_Window Opt_window_Window;
typedef struct OHOS_WINDOW_window_WindowStagePeer OHOS_WINDOW_window_WindowStagePeer;
typedef struct OHOS_WINDOW_window_WindowStagePeer* OH_OHOS_WINDOW_window_WindowStage;
typedef struct Opt_window_WindowStage Opt_window_WindowStage;
typedef struct Opt_String Opt_String;
typedef struct OHOS_WINDOW_AsyncCallback OHOS_WINDOW_AsyncCallback;
typedef struct Opt_OHOS_WINDOW_AsyncCallback Opt_OHOS_WINDOW_AsyncCallback;
typedef struct OHOS_WINDOW_Callback_Opt_Array_String_Void OHOS_WINDOW_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Array_String_Void Opt_OHOS_WINDOW_Callback_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void Opt_OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void Opt_OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void Opt_OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void;
typedef struct OHOS_WINDOW_window_Callback_Boolean_Void OHOS_WINDOW_window_Callback_Boolean_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_Boolean_Void Opt_OHOS_WINDOW_window_Callback_Boolean_Void;
typedef struct OHOS_WINDOW_window_Callback_F64_Void OHOS_WINDOW_window_Callback_F64_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_F64_Void Opt_OHOS_WINDOW_window_Callback_F64_Void;
typedef struct OHOS_WINDOW_window_Callback_I32_Void OHOS_WINDOW_window_Callback_I32_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_I32_Void Opt_OHOS_WINDOW_window_Callback_I32_Void;
typedef struct OHOS_WINDOW_window_Callback_I64_Void OHOS_WINDOW_window_Callback_I64_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_I64_Void Opt_OHOS_WINDOW_window_Callback_I64_Void;
typedef struct OHOS_WINDOW_window_Callback_KeyboardInfo_Void OHOS_WINDOW_window_Callback_KeyboardInfo_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void;
typedef struct OHOS_WINDOW_window_Callback_Promise_Boolean OHOS_WINDOW_window_Callback_Promise_Boolean;
typedef struct Opt_OHOS_WINDOW_window_Callback_Promise_Boolean Opt_OHOS_WINDOW_window_Callback_Promise_Boolean;
typedef struct OHOS_WINDOW_window_Callback_RectChangeOptions_Void OHOS_WINDOW_window_Callback_RectChangeOptions_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void;
typedef struct OHOS_WINDOW_window_Callback_Size_Void OHOS_WINDOW_window_Callback_Size_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_Size_Void Opt_OHOS_WINDOW_window_Callback_Size_Void;
typedef struct OHOS_WINDOW_window_Callback_TitleButtonRect_Void OHOS_WINDOW_window_Callback_TitleButtonRect_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void;
typedef struct OHOS_WINDOW_window_Callback_Void OHOS_WINDOW_window_Callback_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_Void Opt_OHOS_WINDOW_window_Callback_Void;
typedef struct OHOS_WINDOW_window_Callback_WindowEventType_Void OHOS_WINDOW_window_Callback_WindowEventType_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void;
typedef struct OHOS_WINDOW_window_Callback_WindowStageEventType_Void OHOS_WINDOW_window_Callback_WindowStageEventType_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void;
typedef struct OHOS_WINDOW_window_Callback_WindowStatusType_Void OHOS_WINDOW_window_Callback_WindowStatusType_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void;
typedef struct OHOS_WINDOW_BusinessErrorPeer OHOS_WINDOW_BusinessErrorPeer;
typedef struct OHOS_WINDOW_BusinessErrorPeer* OH_OHOS_WINDOW_BusinessError;
typedef struct Opt_BusinessError Opt_BusinessError;
typedef struct OH_OHOS_WINDOW_Union_String_ColorMetrics OH_OHOS_WINDOW_Union_String_ColorMetrics;
typedef struct Opt_Union_String_ColorMetrics Opt_Union_String_ColorMetrics;
typedef struct OH_OHOS_WINDOW_window_AvoidArea OH_OHOS_WINDOW_window_AvoidArea;
typedef struct Opt_window_AvoidArea Opt_window_AvoidArea;
typedef struct OH_OHOS_WINDOW_window_AvoidAreaOptions OH_OHOS_WINDOW_window_AvoidAreaOptions;
typedef struct Opt_window_AvoidAreaOptions Opt_window_AvoidAreaOptions;
typedef struct OH_OHOS_WINDOW_window_DecorButtonStyle OH_OHOS_WINDOW_window_DecorButtonStyle;
typedef struct Opt_window_DecorButtonStyle Opt_window_DecorButtonStyle;
typedef struct OH_OHOS_WINDOW_window_KeyboardInfo OH_OHOS_WINDOW_window_KeyboardInfo;
typedef struct Opt_window_KeyboardInfo Opt_window_KeyboardInfo;
typedef struct OH_OHOS_WINDOW_window_RectChangeOptions OH_OHOS_WINDOW_window_RectChangeOptions;
typedef struct Opt_window_RectChangeOptions Opt_window_RectChangeOptions;
typedef struct OH_OHOS_WINDOW_window_RotateOptions OH_OHOS_WINDOW_window_RotateOptions;
typedef struct Opt_window_RotateOptions Opt_window_RotateOptions;
typedef struct OH_OHOS_WINDOW_window_ScaleOptions OH_OHOS_WINDOW_window_ScaleOptions;
typedef struct Opt_window_ScaleOptions Opt_window_ScaleOptions;
typedef struct OH_OHOS_WINDOW_window_SystemBarProperties OH_OHOS_WINDOW_window_SystemBarProperties;
typedef struct Opt_window_SystemBarProperties Opt_window_SystemBarProperties;
typedef struct OH_OHOS_WINDOW_window_SystemBarStyle OH_OHOS_WINDOW_window_SystemBarStyle;
typedef struct Opt_window_SystemBarStyle Opt_window_SystemBarStyle;
typedef struct OH_OHOS_WINDOW_window_TranslateOptions OH_OHOS_WINDOW_window_TranslateOptions;
typedef struct Opt_window_TranslateOptions Opt_window_TranslateOptions;
typedef struct OH_OHOS_WINDOW_window_WindowProperties OH_OHOS_WINDOW_window_WindowProperties;
typedef struct Opt_window_WindowProperties Opt_window_WindowProperties;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_WINDOW_Object;
typedef enum OH_OHOS_WINDOW_ConfigurationConstant_ColorMode {
    OH_OHOS_WINDOW_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_NOT_SET = -1,
    OH_OHOS_WINDOW_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_DARK = 0,
    OH_OHOS_WINDOW_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_LIGHT = 1,
} OH_OHOS_WINDOW_ConfigurationConstant_ColorMode;
typedef struct Opt_ConfigurationConstant_ColorMode {
    OH_Tag tag;
    OH_OHOS_WINDOW_ConfigurationConstant_ColorMode value;
} Opt_ConfigurationConstant_ColorMode;
typedef enum OH_OHOS_WINDOW_window_AvoidAreaType {
    OH_OHOS_WINDOW_WINDOW_AVOID_AREA_TYPE_TYPE_SYSTEM = 0,
    OH_OHOS_WINDOW_WINDOW_AVOID_AREA_TYPE_TYPE_CUTOUT = 1,
    OH_OHOS_WINDOW_WINDOW_AVOID_AREA_TYPE_TYPE_SYSTEM_GESTURE = 2,
    OH_OHOS_WINDOW_WINDOW_AVOID_AREA_TYPE_TYPE_KEYBOARD = 3,
    OH_OHOS_WINDOW_WINDOW_AVOID_AREA_TYPE_TYPE_NAVIGATION_INDICATOR = 4,
} OH_OHOS_WINDOW_window_AvoidAreaType;
typedef struct Opt_window_AvoidAreaType {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_AvoidAreaType value;
} Opt_window_AvoidAreaType;
typedef enum OH_OHOS_WINDOW_window_ColorSpace {
    OH_OHOS_WINDOW_WINDOW_COLOR_SPACE_DEFAULT = 0,
    OH_OHOS_WINDOW_WINDOW_COLOR_SPACE_WIDE_GAMUT = 1,
} OH_OHOS_WINDOW_window_ColorSpace;
typedef struct Opt_window_ColorSpace {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_ColorSpace value;
} Opt_window_ColorSpace;
typedef enum OH_OHOS_WINDOW_window_MaximizePresentation {
    OH_OHOS_WINDOW_WINDOW_MAXIMIZE_PRESENTATION_FOLLOW_APP_IMMERSIVE_SETTING = 0,
    OH_OHOS_WINDOW_WINDOW_MAXIMIZE_PRESENTATION_EXIT_IMMERSIVE = 1,
    OH_OHOS_WINDOW_WINDOW_MAXIMIZE_PRESENTATION_ENTER_IMMERSIVE = 2,
} OH_OHOS_WINDOW_window_MaximizePresentation;
typedef struct Opt_window_MaximizePresentation {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_MaximizePresentation value;
} Opt_window_MaximizePresentation;
typedef enum OH_OHOS_WINDOW_window_Orientation {
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_UNSPECIFIED = 0,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_PORTRAIT = 1,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_LANDSCAPE = 2,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_PORTRAIT_INVERTED = 3,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_LANDSCAPE_INVERTED = 4,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION = 5,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION_PORTRAIT = 6,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION_LANDSCAPE = 7,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION_RESTRICTED = 8,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION_PORTRAIT_RESTRICTED = 9,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION_LANDSCAPE_RESTRICTED = 10,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_LOCKED = 11,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_AUTO_ROTATION_UNSPECIFIED = 12,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_USER_ROTATION_PORTRAIT = 13,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_USER_ROTATION_LANDSCAPE = 14,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_USER_ROTATION_PORTRAIT_INVERTED = 15,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_USER_ROTATION_LANDSCAPE_INVERTED = 16,
    OH_OHOS_WINDOW_WINDOW_ORIENTATION_FOLLOW_DESKTOP = 17,
} OH_OHOS_WINDOW_window_Orientation;
typedef struct Opt_window_Orientation {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_Orientation value;
} Opt_window_Orientation;
typedef enum OH_OHOS_WINDOW_window_RectChangeReason {
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_UNDEFINED = 0,
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_MAXIMIZE = 1,
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_RECOVER = 2,
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_MOVE = 3,
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_DRAG = 4,
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_DRAG_START = 5,
    OH_OHOS_WINDOW_WINDOW_RECT_CHANGE_REASON_DRAG_END = 6,
} OH_OHOS_WINDOW_window_RectChangeReason;
typedef struct Opt_window_RectChangeReason {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_RectChangeReason value;
} Opt_window_RectChangeReason;
typedef enum OH_OHOS_WINDOW_window_WindowEventType {
    OH_OHOS_WINDOW_WINDOW_WINDOW_EVENT_TYPE_WINDOW_SHOWN = 1,
    OH_OHOS_WINDOW_WINDOW_WINDOW_EVENT_TYPE_WINDOW_ACTIVE = 2,
    OH_OHOS_WINDOW_WINDOW_WINDOW_EVENT_TYPE_WINDOW_INACTIVE = 3,
    OH_OHOS_WINDOW_WINDOW_WINDOW_EVENT_TYPE_WINDOW_HIDDEN = 4,
    OH_OHOS_WINDOW_WINDOW_WINDOW_EVENT_TYPE_WINDOW_DESTROYED = 7,
} OH_OHOS_WINDOW_window_WindowEventType;
typedef struct Opt_window_WindowEventType {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_WindowEventType value;
} Opt_window_WindowEventType;
typedef enum OH_OHOS_WINDOW_window_WindowStageEventType {
    OH_OHOS_WINDOW_WINDOW_WINDOW_STAGE_EVENT_TYPE_SHOWN = 1,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STAGE_EVENT_TYPE_ACTIVE = 2,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STAGE_EVENT_TYPE_INACTIVE = 3,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STAGE_EVENT_TYPE_HIDDEN = 4,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STAGE_EVENT_TYPE_RESUMED = 5,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STAGE_EVENT_TYPE_PAUSED = 6,
} OH_OHOS_WINDOW_window_WindowStageEventType;
typedef struct Opt_window_WindowStageEventType {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_WindowStageEventType value;
} Opt_window_WindowStageEventType;
typedef enum OH_OHOS_WINDOW_window_WindowStatusType {
    OH_OHOS_WINDOW_WINDOW_WINDOW_STATUS_TYPE_UNDEFINED = 0,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STATUS_TYPE_FULL_SCREEN = 1,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STATUS_TYPE_MAXIMIZE = 2,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STATUS_TYPE_MINIMIZE = 3,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STATUS_TYPE_FLOATING = 4,
    OH_OHOS_WINDOW_WINDOW_WINDOW_STATUS_TYPE_SPLIT_SCREEN = 5,
} OH_OHOS_WINDOW_window_WindowStatusType;
typedef struct Opt_window_WindowStatusType {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_WindowStatusType value;
} Opt_window_WindowStatusType;
typedef enum OH_OHOS_WINDOW_window_WindowType {
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_APP = 0,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_STATUS_BAR = 3,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_PANEL = 4,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_KEYGUARD = 5,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_VOLUME_OVERLAY = 6,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_NAVIGATION_BAR = 7,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_FLOAT = 8,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_WALLPAPER = 9,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_DESKTOP = 10,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_LAUNCHER_RECENT = 11,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_LAUNCHER_DOCK = 12,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_VOICE_INTERACTION = 13,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_POINTER = 14,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_FLOAT_CAMERA = 15,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_DIALOG = 16,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_SCREENSHOT = 17,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_SYSTEM_TOAST = 18,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_DIVIDER = 19,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_GLOBAL_SEARCH = 20,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_HANDWRITE = 21,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_WALLET_SWIPE_CARD = 22,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_SCREEN_CONTROL = 23,
    OH_OHOS_WINDOW_WINDOW_WINDOW_TYPE_TYPE_FLOAT_NAVIGATION = 24,
} OH_OHOS_WINDOW_window_WindowType;
typedef struct Opt_window_WindowType {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_WindowType value;
} Opt_window_WindowType;
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
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_image_PixelMap {
    OH_Tag tag;
    OH_OHOS_WINDOW_image_PixelMap value;
} Opt_image_PixelMap;
typedef struct Opt_UIContext {
    OH_Tag tag;
    OH_OHOS_WINDOW_UIContext value;
} Opt_UIContext;
typedef struct OH_OHOS_WINDOW_window_Rect {
    /* kind: Interface */
    OH_Int32 left;
    OH_Int32 top;
    OH_Int32 width;
    OH_Int32 height;
} OH_OHOS_WINDOW_window_Rect;
typedef struct Opt_window_Rect {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_Rect value;
} Opt_window_Rect;
typedef struct OH_OHOS_WINDOW_window_Size {
    /* kind: Interface */
    OH_Int32 width;
    OH_Int32 height;
} OH_OHOS_WINDOW_window_Size;
typedef struct Opt_window_Size {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_Size value;
} Opt_window_Size;
typedef struct OH_OHOS_WINDOW_window_TitleButtonRect {
    /* kind: Interface */
    OH_Number width;
} OH_OHOS_WINDOW_window_TitleButtonRect;
typedef struct Opt_window_TitleButtonRect {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_TitleButtonRect value;
} Opt_window_TitleButtonRect;
typedef struct Opt_window_Window {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_Window value;
} Opt_window_Window;
typedef struct Opt_window_WindowStage {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_WindowStage value;
} Opt_window_WindowStage;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_WINDOW_AsyncCallback {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
} OHOS_WINDOW_AsyncCallback;
typedef struct Opt_OHOS_WINDOW_AsyncCallback {
    OH_Tag tag;
    OHOS_WINDOW_AsyncCallback value;
} Opt_OHOS_WINDOW_AsyncCallback;
typedef struct OHOS_WINDOW_Callback_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error);
} OHOS_WINDOW_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WINDOW_Callback_Opt_Array_String_Void value;
} Opt_OHOS_WINDOW_Callback_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error);
} OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void value;
} Opt_OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error);
} OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void value;
} Opt_OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void;
typedef struct Opt_OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void value;
} Opt_OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void;
typedef struct OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0);
} OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void value;
} Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void;
typedef struct OHOS_WINDOW_window_Callback_Boolean_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Boolean value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value0);
} OHOS_WINDOW_window_Callback_Boolean_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_Boolean_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_Boolean_Void value;
} Opt_OHOS_WINDOW_window_Callback_Boolean_Void;
typedef struct OHOS_WINDOW_window_Callback_F64_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Float64 value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Float64 value0);
} OHOS_WINDOW_window_Callback_F64_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_F64_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_F64_Void value;
} Opt_OHOS_WINDOW_window_Callback_F64_Void;
typedef struct OHOS_WINDOW_window_Callback_I32_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Int32 value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 value0);
} OHOS_WINDOW_window_Callback_I32_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_I32_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_I32_Void value;
} Opt_OHOS_WINDOW_window_Callback_I32_Void;
typedef struct OHOS_WINDOW_window_Callback_I64_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Int64 value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int64 value0);
} OHOS_WINDOW_window_Callback_I64_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_I64_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_I64_Void value;
} Opt_OHOS_WINDOW_window_Callback_I64_Void;
typedef struct OHOS_WINDOW_window_Callback_KeyboardInfo_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0);
} OHOS_WINDOW_window_Callback_KeyboardInfo_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_KeyboardInfo_Void value;
} Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void;
typedef struct OHOS_WINDOW_window_Callback_Promise_Boolean {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation);
} OHOS_WINDOW_window_Callback_Promise_Boolean;
typedef struct Opt_OHOS_WINDOW_window_Callback_Promise_Boolean {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_Promise_Boolean value;
} Opt_OHOS_WINDOW_window_Callback_Promise_Boolean;
typedef struct OHOS_WINDOW_window_Callback_RectChangeOptions_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0);
} OHOS_WINDOW_window_Callback_RectChangeOptions_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_RectChangeOptions_Void value;
} Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void;
typedef struct OHOS_WINDOW_window_Callback_Size_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0);
} OHOS_WINDOW_window_Callback_Size_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_Size_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_Size_Void value;
} Opt_OHOS_WINDOW_window_Callback_Size_Void;
typedef struct OHOS_WINDOW_window_Callback_TitleButtonRect_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0);
} OHOS_WINDOW_window_Callback_TitleButtonRect_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_TitleButtonRect_Void value;
} Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void;
typedef struct OHOS_WINDOW_window_Callback_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_WINDOW_window_Callback_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_Void value;
} Opt_OHOS_WINDOW_window_Callback_Void;
typedef struct OHOS_WINDOW_window_Callback_WindowEventType_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0);
} OHOS_WINDOW_window_Callback_WindowEventType_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_WindowEventType_Void value;
} Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void;
typedef struct OHOS_WINDOW_window_Callback_WindowStageEventType_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0);
} OHOS_WINDOW_window_Callback_WindowStageEventType_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_WindowStageEventType_Void value;
} Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void;
typedef struct OHOS_WINDOW_window_Callback_WindowStatusType_Void {
    /* kind: Callback */
    OH_OHOS_WINDOW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0);
    void (*callSync)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0);
} OHOS_WINDOW_window_Callback_WindowStatusType_Void;
typedef struct Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void {
    OH_Tag tag;
    OHOS_WINDOW_window_Callback_WindowStatusType_Void value;
} Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void;
typedef struct Opt_BusinessError {
    OH_Tag tag;
    OH_OHOS_WINDOW_BusinessError value;
} Opt_BusinessError;
typedef struct OH_OHOS_WINDOW_Union_String_ColorMetrics {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_CustomObject value1;
    };
} OH_OHOS_WINDOW_Union_String_ColorMetrics;
typedef struct Opt_Union_String_ColorMetrics {
    OH_Tag tag;
    OH_OHOS_WINDOW_Union_String_ColorMetrics value;
} Opt_Union_String_ColorMetrics;
typedef struct OH_OHOS_WINDOW_window_AvoidArea {
    /* kind: Interface */
    OH_Boolean visible;
    OH_OHOS_WINDOW_window_Rect leftRect;
    OH_OHOS_WINDOW_window_Rect topRect;
    OH_OHOS_WINDOW_window_Rect rightRect;
    OH_OHOS_WINDOW_window_Rect bottomRect;
} OH_OHOS_WINDOW_window_AvoidArea;
typedef struct Opt_window_AvoidArea {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_AvoidArea value;
} Opt_window_AvoidArea;
typedef struct OH_OHOS_WINDOW_window_AvoidAreaOptions {
    /* kind: Interface */
    OH_OHOS_WINDOW_window_AvoidAreaType type;
    OH_OHOS_WINDOW_window_AvoidArea area;
} OH_OHOS_WINDOW_window_AvoidAreaOptions;
typedef struct Opt_window_AvoidAreaOptions {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_AvoidAreaOptions value;
} Opt_window_AvoidAreaOptions;
typedef struct OH_OHOS_WINDOW_window_DecorButtonStyle {
    /* kind: Interface */
    Opt_ConfigurationConstant_ColorMode colorMode;
    Opt_Number buttonBackgroundSize;
    Opt_Number spacingBetweenButtons;
    Opt_Number closeButtonRightMargin;
} OH_OHOS_WINDOW_window_DecorButtonStyle;
typedef struct Opt_window_DecorButtonStyle {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_DecorButtonStyle value;
} Opt_window_DecorButtonStyle;
typedef struct OH_OHOS_WINDOW_window_KeyboardInfo {
    /* kind: Interface */
    OH_OHOS_WINDOW_window_Rect beginRect;
    OH_OHOS_WINDOW_window_Rect endRect;
} OH_OHOS_WINDOW_window_KeyboardInfo;
typedef struct Opt_window_KeyboardInfo {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_KeyboardInfo value;
} Opt_window_KeyboardInfo;
typedef struct OH_OHOS_WINDOW_window_RectChangeOptions {
    /* kind: Interface */
    OH_OHOS_WINDOW_window_Rect rect;
    OH_OHOS_WINDOW_window_RectChangeReason reason;
} OH_OHOS_WINDOW_window_RectChangeOptions;
typedef struct Opt_window_RectChangeOptions {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_RectChangeOptions value;
} Opt_window_RectChangeOptions;
typedef struct OH_OHOS_WINDOW_window_RotateOptions {
    /* kind: Interface */
    Opt_Float64 x;
    Opt_Float64 y;
    Opt_Float64 z;
    Opt_Float64 pivotX;
    Opt_Float64 pivotY;
} OH_OHOS_WINDOW_window_RotateOptions;
typedef struct Opt_window_RotateOptions {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_RotateOptions value;
} Opt_window_RotateOptions;
typedef struct OH_OHOS_WINDOW_window_ScaleOptions {
    /* kind: Interface */
    Opt_Float64 x;
    Opt_Float64 y;
    Opt_Float64 pivotX;
    Opt_Float64 pivotY;
} OH_OHOS_WINDOW_window_ScaleOptions;
typedef struct Opt_window_ScaleOptions {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_ScaleOptions value;
} Opt_window_ScaleOptions;
typedef struct OH_OHOS_WINDOW_window_SystemBarProperties {
    /* kind: Interface */
    Opt_String statusBarColor;
    Opt_Boolean isStatusBarLightIcon;
    Opt_String statusBarContentColor;
    Opt_String navigationBarColor;
    Opt_Boolean isNavigationBarLightIcon;
    Opt_String navigationBarContentColor;
    Opt_Boolean enableStatusBarAnimation;
    Opt_Boolean enableNavigationBarAnimation;
} OH_OHOS_WINDOW_window_SystemBarProperties;
typedef struct Opt_window_SystemBarProperties {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_SystemBarProperties value;
} Opt_window_SystemBarProperties;
typedef struct OH_OHOS_WINDOW_window_SystemBarStyle {
    /* kind: Interface */
    Opt_String statusBarContentColor;
} OH_OHOS_WINDOW_window_SystemBarStyle;
typedef struct Opt_window_SystemBarStyle {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_SystemBarStyle value;
} Opt_window_SystemBarStyle;
typedef struct OH_OHOS_WINDOW_window_TranslateOptions {
    /* kind: Interface */
    Opt_Float64 x;
    Opt_Float64 y;
    Opt_Float64 z;
} OH_OHOS_WINDOW_window_TranslateOptions;
typedef struct Opt_window_TranslateOptions {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_TranslateOptions value;
} Opt_window_TranslateOptions;
typedef struct OH_OHOS_WINDOW_window_WindowProperties {
    /* kind: Interface */
    OH_OHOS_WINDOW_window_Rect windowRect;
    OH_OHOS_WINDOW_window_Rect drawableRect;
    OH_OHOS_WINDOW_window_WindowType type;
    OH_Boolean isFullScreen;
    OH_Boolean isLayoutFullScreen;
    OH_Boolean focusable;
    OH_Boolean touchable;
    OH_Float64 brightness;
    OH_Boolean isKeepScreenOn;
    OH_Boolean isPrivacyMode;
    OH_Boolean isTransparent;
    OH_Int32 id;
    Opt_Int64 displayId;
    Opt_String name;
} OH_OHOS_WINDOW_window_WindowProperties;
typedef struct Opt_window_WindowProperties {
    OH_Tag tag;
    OH_OHOS_WINDOW_window_WindowProperties value;
} Opt_window_WindowProperties;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_WINDOW_window_WindowHandleOpaque;
typedef struct OH_OHOS_WINDOW_window_WindowHandleOpaque* OH_OHOS_WINDOW_window_WindowHandle;
typedef struct OH_OHOS_WINDOW_window_WindowModifier {
    OH_OHOS_WINDOW_window_WindowHandle (*construct)();
    void (*destruct)(OH_OHOS_WINDOW_window_WindowHandle thisPtr);
    void (*hideWithAnimation0)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*hideWithAnimation1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*showWindow0)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*showWindow1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*showWithAnimation0)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*showWithAnimation1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*destroyWindow0)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*destroyWindow1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*moveWindowTo0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 x, OH_Int32 y, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*moveWindowTo1)(OH_NativePointer thisPtr, OH_Int32 x, OH_Int32 y, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*resize0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 width, OH_Int32 height, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*resize1)(OH_NativePointer thisPtr, OH_Int32 width, OH_Int32 height, const OHOS_WINDOW_AsyncCallback* callback_);
    OH_OHOS_WINDOW_window_Rect (*getGlobalRect)(OH_NativePointer thisPtr);
    OH_OHOS_WINDOW_window_WindowProperties (*getWindowProperties)(OH_NativePointer thisPtr);
    OH_OHOS_WINDOW_window_AvoidArea (*getWindowAvoidArea)(OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_AvoidAreaType type);
    void (*setWindowLayoutFullScreen)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isLayoutFullScreen, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowSystemBarEnable)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const Array_String* names, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setSpecificSystemBarEnabled)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* name, OH_Boolean enable, const Opt_Boolean* enableAnimation, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowSystemBarProperties)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_SystemBarProperties* systemBarProperties, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setPreferredOrientation0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_Orientation orientation, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setPreferredOrientation1)(OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_Orientation orientation, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContent0)(OH_NativePointer thisPtr, const OH_String* path, const OH_CustomObject* storage, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContent1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OH_CustomObject* storage, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_OHOS_WINDOW_UIContext (*getUIContext)(OH_NativePointer thisPtr);
    void (*setUIContent0)(OH_NativePointer thisPtr, const OH_String* path, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setUIContent1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_Boolean (*isWindowShowing)(OH_NativePointer thisPtr);
    void (*onWindowSizeChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Size_Void* callback_);
    void (*offWindowSizeChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Size_Void* callback_);
    void (*onAvoidAreaChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void* callback_);
    void (*offAvoidAreaChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void* callback_);
    void (*onKeyboardHeightChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_I32_Void* callback_);
    void (*offKeyboardHeightChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_I32_Void* callback_);
    void (*onKeyboardDidShow)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
    void (*offKeyboardDidShow)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
    void (*onKeyboardDidHide)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
    void (*offKeyboardDidHide)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
    void (*onTouchOutside)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
    void (*offTouchOutside)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
    void (*onDisplayIdChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_I64_Void* callback_);
    void (*offDisplayIdChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_I64_Void* callback_);
    void (*onWindowVisibilityChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
    void (*offWindowVisibilityChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
    void (*onSystemDensityChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_F64_Void* callback_);
    void (*offSystemDensityChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_F64_Void* callback_);
    void (*onNoInteractionDetected)(OH_NativePointer thisPtr, OH_Int64 timeout, const OHOS_WINDOW_window_Callback_Void* callback_);
    void (*offNoInteractionDetected)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
    void (*onScreenshot)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
    void (*offScreenshot)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
    void (*onDialogTargetTouch)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
    void (*offDialogTargetTouch)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
    void (*onWindowEvent)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_WindowEventType_Void* callback_);
    void (*offWindowEvent)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void* callback_);
    void (*onWindowStatusChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_WindowStatusType_Void* callback_);
    void (*offWindowStatusChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void* callback_);
    void (*onSubWindowClose)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
    void (*offSubWindowClose)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
    void (*onWindowWillClose)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Promise_Boolean* callback_);
    void (*offWindowWillClose)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Promise_Boolean* callback_);
    void (*onWindowHighlightChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
    void (*offWindowHighlightChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
    void (*isWindowSupportWideGamut0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*isWindowSupportWideGamut1)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setWindowColorSpace0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_ColorSpace colorSpace, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowColorSpace1)(OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_ColorSpace colorSpace, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setWindowBackgroundColor)(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_Union_String_ColorMetrics* color);
    void (*setWindowFocusable0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isFocusable, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowFocusable1)(OH_NativePointer thisPtr, OH_Boolean isFocusable, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setWindowKeepScreenOn0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isKeepScreenOn, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowKeepScreenOn1)(OH_NativePointer thisPtr, OH_Boolean isKeepScreenOn, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setWindowPrivacyMode0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isPrivacyMode, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowPrivacyMode1)(OH_NativePointer thisPtr, OH_Boolean isPrivacyMode, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setWindowTouchable0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isTouchable, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowTouchable1)(OH_NativePointer thisPtr, OH_Boolean isTouchable, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*snapshot0)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*snapshot1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*opacity)(OH_NativePointer thisPtr, OH_Float64 opacity);
    void (*scale)(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_ScaleOptions* scaleOptions);
    void (*rotate)(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_RotateOptions* rotateOptions);
    void (*translate)(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_TranslateOptions* translateOptions);
    void (*setShadow)(OH_NativePointer thisPtr, OH_Float64 radius, const Opt_String* color, const Opt_Float64* offsetX, const Opt_Float64* offsetY);
    void (*setWaterMarkFlag0)(OH_NativePointer thisPtr, OH_Boolean enable, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*setWaterMarkFlag1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean enable, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*minimize0)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*minimize1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*maximize)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const Opt_window_MaximizePresentation* presentation, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*hideNonSystemFloatingWindows0)(OH_NativePointer thisPtr, OH_Boolean shouldHide, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*hideNonSystemFloatingWindows1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean shouldHide, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*keepKeyboardOnFocus)(OH_NativePointer thisPtr, OH_Boolean keepKeyboardFlag);
    void (*recover)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setWindowDecorVisible)(OH_NativePointer thisPtr, OH_Boolean isVisible);
    void (*setWindowDecorHeight)(OH_NativePointer thisPtr, OH_Int32 height);
    OH_Int32 (*getWindowDecorHeight)(OH_NativePointer thisPtr);
    void (*setDecorButtonStyle)(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_DecorButtonStyle* dectorStyle);
    void (*setWindowTitleButtonVisible)(OH_NativePointer thisPtr, OH_Boolean isMaximizeButtonVisible, OH_Boolean isMinimizeButtonVisible, const Opt_Boolean* isCloseButtonVisible);
    void (*startMoving0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*startMoving1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 offsetX, OH_Int32 offsetY, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*onWindowTitleButtonRectChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_TitleButtonRect_Void* callback_);
    void (*offWindowTitleButtonRectChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void* callback_);
    void (*onWindowRectChange)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_RectChangeOptions_Void* callback_);
    void (*offWindowRectChange)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void* callback_);
    void (*setImmersiveModeEnabledState)(OH_NativePointer thisPtr, OH_Boolean enabled);
    OH_OHOS_WINDOW_window_WindowStatusType (*getWindowStatus)(OH_NativePointer thisPtr);
} OH_OHOS_WINDOW_window_WindowModifier;
struct OH_OHOS_WINDOW_window_WindowStageHandleOpaque;
typedef struct OH_OHOS_WINDOW_window_WindowStageHandleOpaque* OH_OHOS_WINDOW_window_WindowStageHandle;
typedef struct OH_OHOS_WINDOW_window_WindowStageModifier {
    OH_OHOS_WINDOW_window_WindowStageHandle (*construct)();
    void (*destruct)(OH_OHOS_WINDOW_window_WindowStageHandle thisPtr);
    void (*getMainWindow0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMainWindow1)(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
    OH_OHOS_WINDOW_window_Window (*getMainWindowSync)(OH_NativePointer thisPtr);
    void (*createSubWindow0)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* name, const OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*createSubWindow1)(OH_NativePointer thisPtr, const OH_String* name, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContent0)(OH_NativePointer thisPtr, const OH_String* path, const OH_CustomObject* storage, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContent1)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const Opt_CustomObject* storage, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*loadContent2)(OH_NativePointer thisPtr, const OH_String* path, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContentByName0)(OH_NativePointer thisPtr, const OH_String* name, const OH_CustomObject* storage, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContentByName1)(OH_NativePointer thisPtr, const OH_String* name, const OHOS_WINDOW_AsyncCallback* callback_);
    void (*loadContentByName2)(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* name, const Opt_CustomObject* storage, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*onWindowStageEvent)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_WindowStageEventType_Void* callback_);
    void (*offWindowStageEvent)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void* callback_);
    void (*onWindowStageClose)(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
    void (*offWindowStageClose)(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
    void (*disableWindowDecor)(OH_NativePointer thisPtr);
    void (*setShowOnLockScreen)(OH_NativePointer thisPtr, OH_Boolean showOnLockScreen);
} OH_OHOS_WINDOW_window_WindowStageModifier;
typedef struct OH_OHOS_WINDOW_API {
    OH_Int32 version;
    const OH_OHOS_WINDOW_window_WindowModifier* (*Window_Window)();
    const OH_OHOS_WINDOW_window_WindowStageModifier* (*Window_WindowStage)();
} OH_OHOS_WINDOW_API;
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

#endif // OH_OHOS_WINDOW_H
/* clang-format on */