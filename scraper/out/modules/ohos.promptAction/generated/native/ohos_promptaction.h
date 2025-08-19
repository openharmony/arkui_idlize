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

#ifndef OH_OHOS_PROMPTACTION_H
#define OH_OHOS_PROMPTACTION_H

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


#define OHOS_PROMPTACTION_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_PROMPTACTION_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_PROMPTACTION_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_PROMPTACTION_VMContext;
typedef InteropAsyncWorker OH_OHOS_PROMPTACTION_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_PROMPTACTION_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_PROMPTACTION_APIKind {
    OH_OHOS_PROMPTACTION_API_KIND = 10
} OH_OHOS_PROMPTACTION_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_promptAction_Button Array_promptAction_Button;
typedef struct Opt_Array_promptAction_Button Opt_Array_promptAction_Button;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Number Opt_Number;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsBorderColor OH_OHOS_PROMPTACTION_DialogOptionsBorderColor;
typedef struct Opt_DialogOptionsBorderColor Opt_DialogOptionsBorderColor;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle;
typedef struct Opt_DialogOptionsBorderStyle Opt_DialogOptionsBorderStyle;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth;
typedef struct Opt_DialogOptionsBorderWidth Opt_DialogOptionsBorderWidth;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius;
typedef struct Opt_DialogOptionsCornerRadius Opt_DialogOptionsCornerRadius;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsShadow OH_OHOS_PROMPTACTION_DialogOptionsShadow;
typedef struct Opt_DialogOptionsShadow Opt_DialogOptionsShadow;
typedef struct OHOS_PROMPTACTION_LevelOrderPeer OHOS_PROMPTACTION_LevelOrderPeer;
typedef struct OHOS_PROMPTACTION_LevelOrderPeer* OH_OHOS_PROMPTACTION_LevelOrder;
typedef struct Opt_LevelOrder Opt_LevelOrder;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse;
typedef struct Opt_promptAction_ActionMenuSuccessResponse Opt_promptAction_ActionMenuSuccessResponse;
typedef struct OHOS_PROMPTACTION_promptAction_CommonControllerPeer OHOS_PROMPTACTION_promptAction_CommonControllerPeer;
typedef struct OHOS_PROMPTACTION_promptAction_CommonControllerPeer* OH_OHOS_PROMPTACTION_promptAction_CommonController;
typedef struct Opt_promptAction_CommonController Opt_promptAction_CommonController;
typedef struct OHOS_PROMPTACTION_promptAction_DialogControllerPeer OHOS_PROMPTACTION_promptAction_DialogControllerPeer;
typedef struct OHOS_PROMPTACTION_promptAction_DialogControllerPeer* OH_OHOS_PROMPTACTION_promptAction_DialogController;
typedef struct Opt_promptAction_DialogController Opt_promptAction_DialogController;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse;
typedef struct Opt_promptAction_ShowDialogSuccessResponse Opt_promptAction_ShowDialogSuccessResponse;
typedef struct OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles;
typedef struct Opt_Union_BorderStyle_EdgeStyles Opt_Union_BorderStyle_EdgeStyles;
typedef struct OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses;
typedef struct Opt_Union_Dimension_BorderRadiuses Opt_Union_Dimension_BorderRadiuses;
typedef struct OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths;
typedef struct Opt_Union_Dimension_EdgeWidths Opt_Union_Dimension_EdgeWidths;
typedef struct OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors;
typedef struct Opt_Union_ResourceColor_EdgeColors Opt_Union_ResourceColor_EdgeColors;
typedef struct OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle;
typedef struct Opt_Union_ShadowOptions_ShadowStyle Opt_Union_ShadowOptions_ShadowStyle;
typedef struct Opt_String Opt_String;
typedef struct OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void;
typedef struct Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void;
typedef struct OHOS_PROMPTACTION_promptAction_Callback_Void OHOS_PROMPTACTION_promptAction_Callback_Void;
typedef struct Opt_OHOS_PROMPTACTION_promptAction_Callback_Void Opt_OHOS_PROMPTACTION_promptAction_Callback_Void;
typedef struct OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions;
typedef struct Opt_promptAction_BaseDialogOptions Opt_promptAction_BaseDialogOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions;
typedef struct Opt_promptAction_CustomDialogOptions Opt_promptAction_CustomDialogOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_DialogOptions OH_OHOS_PROMPTACTION_promptAction_DialogOptions;
typedef struct Opt_promptAction_DialogOptions Opt_promptAction_DialogOptions;
typedef struct OH_OHOS_PROMPTACTION_Union_String_Number OH_OHOS_PROMPTACTION_Union_String_Number;
typedef struct Opt_Union_String_Number Opt_Union_String_Number;
typedef struct OH_OHOS_PROMPTACTION_Union_String_Resource OH_OHOS_PROMPTACTION_Union_String_Resource;
typedef struct Opt_Union_String_Resource Opt_Union_String_Resource;
typedef struct OH_OHOS_PROMPTACTION_promptAction_Button OH_OHOS_PROMPTACTION_promptAction_Button;
typedef struct Opt_promptAction_Button Opt_promptAction_Button;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton;
typedef struct Opt_promptAction_PromptActionSingleButton Opt_promptAction_PromptActionSingleButton;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions;
typedef struct Opt_promptAction_ShowDialogOptions Opt_promptAction_ShowDialogOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions;
typedef struct Opt_promptAction_ShowToastOptions Opt_promptAction_ShowToastOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons;
typedef struct Opt_promptAction_PromptActionDoubleButtons Opt_promptAction_PromptActionDoubleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons;
typedef struct Opt_promptAction_PromptActionQuadrupleButtons Opt_promptAction_PromptActionQuadrupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons;
typedef struct Opt_promptAction_PromptActionQuintupleButtons Opt_promptAction_PromptActionQuintupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons;
typedef struct Opt_promptAction_PromptActionSextupleButtons Opt_promptAction_PromptActionSextupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons;
typedef struct Opt_promptAction_PromptActionTripleButtons Opt_promptAction_PromptActionTripleButtons;
typedef struct OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons;
typedef struct Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions;
typedef struct Opt_promptAction_ActionMenuOptions Opt_promptAction_ActionMenuOptions;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_PROMPTACTION_Object;
typedef enum OH_OHOS_PROMPTACTION_ImmersiveMode {
    OH_OHOS_PROMPTACTION_IMMERSIVE_MODE_DEFAULT = 0,
    OH_OHOS_PROMPTACTION_IMMERSIVE_MODE_EXTEND = 1,
} OH_OHOS_PROMPTACTION_ImmersiveMode;
typedef struct Opt_ImmersiveMode {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_ImmersiveMode value;
} Opt_ImmersiveMode;
typedef enum OH_OHOS_PROMPTACTION_KeyboardAvoidMode {
    OH_OHOS_PROMPTACTION_KEYBOARD_AVOID_MODE_OFFSET = 0,
    OH_OHOS_PROMPTACTION_KEYBOARD_AVOID_MODE_RESIZE = 1,
    OH_OHOS_PROMPTACTION_KEYBOARD_AVOID_MODE_OFFSET_WITH_CARET = 2,
    OH_OHOS_PROMPTACTION_KEYBOARD_AVOID_MODE_RESIZE_WITH_CARET = 3,
    OH_OHOS_PROMPTACTION_KEYBOARD_AVOID_MODE_NONE = 4,
} OH_OHOS_PROMPTACTION_KeyboardAvoidMode;
typedef struct Opt_KeyboardAvoidMode {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_KeyboardAvoidMode value;
} Opt_KeyboardAvoidMode;
typedef enum OH_OHOS_PROMPTACTION_LevelMode {
    OH_OHOS_PROMPTACTION_LEVEL_MODE_OVERLAY = 0,
    OH_OHOS_PROMPTACTION_LEVEL_MODE_EMBEDDED = 1,
} OH_OHOS_PROMPTACTION_LevelMode;
typedef struct Opt_LevelMode {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_LevelMode value;
} Opt_LevelMode;
typedef enum OH_OHOS_PROMPTACTION_promptAction_ToastShowMode {
    OH_OHOS_PROMPTACTION_PROMPT_ACTION_TOAST_SHOW_MODE_DEFAULT = 0,
    OH_OHOS_PROMPTACTION_PROMPT_ACTION_TOAST_SHOW_MODE_TOP_MOST = 1,
    OH_OHOS_PROMPTACTION_PROMPT_ACTION_TOAST_SHOW_MODE_SYSTEM_TOP_MOST = 2,
} OH_OHOS_PROMPTACTION_promptAction_ToastShowMode;
typedef struct Opt_promptAction_ToastShowMode {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_ToastShowMode value;
} Opt_promptAction_ToastShowMode;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_promptAction_Button {
    /* kind: ContainerType */
    OH_OHOS_PROMPTACTION_promptAction_Button* array;
    OH_Int32 length;
} Array_promptAction_Button;
typedef struct Opt_Array_promptAction_Button {
    OH_Tag tag;
    Array_promptAction_Button value;
} Opt_Array_promptAction_Button;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
typedef struct Opt_CustomObject {
    OH_Tag tag;
    OH_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsBorderColor {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_DialogOptionsBorderColor;
typedef struct Opt_DialogOptionsBorderColor {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_DialogOptionsBorderColor value;
} Opt_DialogOptionsBorderColor;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle;
typedef struct Opt_DialogOptionsBorderStyle {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle value;
} Opt_DialogOptionsBorderStyle;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth;
typedef struct Opt_DialogOptionsBorderWidth {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth value;
} Opt_DialogOptionsBorderWidth;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius;
typedef struct Opt_DialogOptionsCornerRadius {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius value;
} Opt_DialogOptionsCornerRadius;
typedef struct OH_OHOS_PROMPTACTION_DialogOptionsShadow {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_DialogOptionsShadow;
typedef struct Opt_DialogOptionsShadow {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_DialogOptionsShadow value;
} Opt_DialogOptionsShadow;
typedef struct Opt_LevelOrder {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_LevelOrder value;
} Opt_LevelOrder;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse {
    /* kind: Interface */
    OH_Number index;
} OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse;
typedef struct Opt_promptAction_ActionMenuSuccessResponse {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse value;
} Opt_promptAction_ActionMenuSuccessResponse;
typedef struct Opt_promptAction_CommonController {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_CommonController value;
} Opt_promptAction_CommonController;
typedef struct Opt_promptAction_DialogController {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_DialogController value;
} Opt_promptAction_DialogController;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse {
    /* kind: Interface */
    OH_Number index;
} OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse;
typedef struct Opt_promptAction_ShowDialogSuccessResponse {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse value;
} Opt_promptAction_ShowDialogSuccessResponse;
typedef struct OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles;
typedef struct Opt_Union_BorderStyle_EdgeStyles {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles value;
} Opt_Union_BorderStyle_EdgeStyles;
typedef struct OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses;
typedef struct Opt_Union_Dimension_BorderRadiuses {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses value;
} Opt_Union_Dimension_BorderRadiuses;
typedef struct OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths;
typedef struct Opt_Union_Dimension_EdgeWidths {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths value;
} Opt_Union_Dimension_EdgeWidths;
typedef struct OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors;
typedef struct Opt_Union_ResourceColor_EdgeColors {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors value;
} Opt_Union_ResourceColor_EdgeColors;
typedef struct OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle;
typedef struct Opt_Union_ShadowOptions_ShadowStyle {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle value;
} Opt_Union_ShadowOptions_ShadowStyle;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void {
    /* kind: Callback */
    OH_OHOS_PROMPTACTION_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_CustomObject value0);
    void (*callSync)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0);
} OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void;
typedef struct Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void {
    OH_Tag tag;
    OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void value;
} Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void;
typedef struct OHOS_PROMPTACTION_promptAction_Callback_Void {
    /* kind: Callback */
    OH_OHOS_PROMPTACTION_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_PROMPTACTION_promptAction_Callback_Void;
typedef struct Opt_OHOS_PROMPTACTION_promptAction_Callback_Void {
    OH_Tag tag;
    OHOS_PROMPTACTION_promptAction_Callback_Void value;
} Opt_OHOS_PROMPTACTION_promptAction_Callback_Void;
typedef struct OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions {
    /* kind: Interface */
    Opt_CustomObject maskRect;
    Opt_CustomObject alignment;
    Opt_CustomObject offset;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_Boolean autoCancel;
    Opt_CustomObject transition;
    Opt_CustomObject dialogTransition;
    Opt_CustomObject maskTransition;
    Opt_CustomObject maskColor;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismiss;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear;
    Opt_KeyboardAvoidMode keyboardAvoidMode;
    Opt_Boolean enableHoverMode;
    Opt_CustomObject hoverModeArea;
    Opt_CustomObject backgroundBlurStyleOptions;
    Opt_CustomObject backgroundEffect;
    Opt_CustomObject keyboardAvoidDistance;
    Opt_LevelMode levelMode;
    Opt_Number levelUniqueId;
    Opt_ImmersiveMode immersiveMode;
    Opt_LevelOrder levelOrder;
    Opt_Boolean focusable;
} OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions;
typedef struct Opt_promptAction_BaseDialogOptions {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions value;
} Opt_promptAction_BaseDialogOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions {
    /* kind: Interface */
    Opt_CustomObject maskRect;
    Opt_CustomObject alignment;
    Opt_CustomObject offset;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_Boolean autoCancel;
    Opt_CustomObject transition;
    Opt_CustomObject dialogTransition;
    Opt_CustomObject maskTransition;
    Opt_CustomObject maskColor;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismiss;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear;
    Opt_KeyboardAvoidMode keyboardAvoidMode;
    Opt_Boolean enableHoverMode;
    Opt_CustomObject hoverModeArea;
    Opt_CustomObject backgroundBlurStyleOptions;
    Opt_CustomObject backgroundEffect;
    Opt_CustomObject keyboardAvoidDistance;
    Opt_LevelMode levelMode;
    Opt_Number levelUniqueId;
    Opt_ImmersiveMode immersiveMode;
    Opt_LevelOrder levelOrder;
    Opt_Boolean focusable;
    OH_CustomObject builder;
    Opt_CustomObject backgroundColor;
    Opt_Union_Dimension_BorderRadiuses cornerRadius;
    Opt_CustomObject width;
    Opt_CustomObject height;
    Opt_Union_Dimension_EdgeWidths borderWidth;
    Opt_Union_ResourceColor_EdgeColors borderColor;
    Opt_Union_BorderStyle_EdgeStyles borderStyle;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_CustomObject backgroundBlurStyle;
} OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions;
typedef struct Opt_promptAction_CustomDialogOptions {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions value;
} Opt_promptAction_CustomDialogOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_DialogOptions {
    /* kind: Interface */
    Opt_CustomObject maskRect;
    Opt_CustomObject alignment;
    Opt_CustomObject offset;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_Boolean autoCancel;
    Opt_CustomObject transition;
    Opt_CustomObject dialogTransition;
    Opt_CustomObject maskTransition;
    Opt_CustomObject maskColor;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismiss;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear;
    Opt_KeyboardAvoidMode keyboardAvoidMode;
    Opt_Boolean enableHoverMode;
    Opt_CustomObject hoverModeArea;
    Opt_CustomObject backgroundBlurStyleOptions;
    Opt_CustomObject backgroundEffect;
    Opt_CustomObject keyboardAvoidDistance;
    Opt_LevelMode levelMode;
    Opt_Number levelUniqueId;
    Opt_ImmersiveMode immersiveMode;
    Opt_LevelOrder levelOrder;
    Opt_Boolean focusable;
    Opt_CustomObject backgroundColor;
    Opt_DialogOptionsCornerRadius cornerRadius;
    Opt_CustomObject width;
    Opt_CustomObject height;
    Opt_DialogOptionsBorderWidth borderWidth;
    Opt_DialogOptionsBorderColor borderColor;
    Opt_DialogOptionsBorderStyle borderStyle;
    Opt_DialogOptionsShadow shadow;
    Opt_CustomObject backgroundBlurStyle;
} OH_OHOS_PROMPTACTION_promptAction_DialogOptions;
typedef struct Opt_promptAction_DialogOptions {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_DialogOptions value;
} Opt_promptAction_DialogOptions;
typedef struct OH_OHOS_PROMPTACTION_Union_String_Number {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_Number value1;
    };
} OH_OHOS_PROMPTACTION_Union_String_Number;
typedef struct Opt_Union_String_Number {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_String_Number value;
} Opt_Union_String_Number;
typedef struct OH_OHOS_PROMPTACTION_Union_String_Resource {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_CustomObject value1;
    };
} OH_OHOS_PROMPTACTION_Union_String_Resource;
typedef struct Opt_Union_String_Resource {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_String_Resource value;
} Opt_Union_String_Resource;
typedef struct OH_OHOS_PROMPTACTION_promptAction_Button {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_Union_String_Resource text;
    OH_OHOS_PROMPTACTION_Union_String_Resource color;
    Opt_Boolean primary;
} OH_OHOS_PROMPTACTION_promptAction_Button;
typedef struct Opt_promptAction_Button {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_Button value;
} Opt_promptAction_Button;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_promptAction_Button value0;
} OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton;
typedef struct Opt_promptAction_PromptActionSingleButton {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton value;
} Opt_promptAction_PromptActionSingleButton;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions {
    /* kind: Interface */
    Opt_Union_String_Resource title;
    Opt_Union_String_Resource message;
    Opt_Array_promptAction_Button buttons;
    Opt_CustomObject maskRect;
    Opt_CustomObject alignment;
    Opt_CustomObject offset;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_CustomObject backgroundColor;
    Opt_CustomObject backgroundBlurStyle;
    Opt_CustomObject backgroundBlurStyleOptions;
    Opt_CustomObject backgroundEffect;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_Boolean enableHoverMode;
    Opt_CustomObject hoverModeArea;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear;
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear;
    Opt_LevelMode levelMode;
    Opt_Number levelUniqueId;
    Opt_ImmersiveMode immersiveMode;
    Opt_LevelOrder levelOrder;
} OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions;
typedef struct Opt_promptAction_ShowDialogOptions {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions value;
} Opt_promptAction_ShowDialogOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_Union_String_Resource message;
    Opt_Number duration;
    Opt_Union_String_Number bottom;
    Opt_promptAction_ToastShowMode showMode;
    Opt_CustomObject alignment;
    Opt_CustomObject offset;
    Opt_CustomObject backgroundColor;
    Opt_CustomObject textColor;
    Opt_CustomObject backgroundBlurStyle;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_Boolean enableHoverMode;
    Opt_CustomObject hoverModeArea;
} OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions;
typedef struct Opt_promptAction_ShowToastOptions {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions value;
} Opt_promptAction_ShowToastOptions;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_promptAction_Button value0;
    Opt_promptAction_Button value1;
} OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons;
typedef struct Opt_promptAction_PromptActionDoubleButtons {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons value;
} Opt_promptAction_PromptActionDoubleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_promptAction_Button value0;
    Opt_promptAction_Button value1;
    Opt_promptAction_Button value2;
    Opt_promptAction_Button value3;
} OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons;
typedef struct Opt_promptAction_PromptActionQuadrupleButtons {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons value;
} Opt_promptAction_PromptActionQuadrupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_promptAction_Button value0;
    Opt_promptAction_Button value1;
    Opt_promptAction_Button value2;
    Opt_promptAction_Button value3;
    Opt_promptAction_Button value4;
} OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons;
typedef struct Opt_promptAction_PromptActionQuintupleButtons {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons value;
} Opt_promptAction_PromptActionQuintupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_promptAction_Button value0;
    Opt_promptAction_Button value1;
    Opt_promptAction_Button value2;
    Opt_promptAction_Button value3;
    Opt_promptAction_Button value4;
    Opt_promptAction_Button value5;
} OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons;
typedef struct Opt_promptAction_PromptActionSextupleButtons {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons value;
} Opt_promptAction_PromptActionSextupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons {
    /* kind: Interface */
    OH_OHOS_PROMPTACTION_promptAction_Button value0;
    Opt_promptAction_Button value1;
    Opt_promptAction_Button value2;
} OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons;
typedef struct Opt_promptAction_PromptActionTripleButtons {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons value;
} Opt_promptAction_PromptActionTripleButtons;
typedef struct OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton value0;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons value1;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons value2;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons value3;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons value4;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons value5;
    };
} OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons;
typedef struct Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons value;
} Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons;
typedef struct OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions {
    /* kind: Interface */
    Opt_Union_String_Resource title;
    OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons buttons;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_LevelMode levelMode;
    Opt_Number levelUniqueId;
    Opt_ImmersiveMode immersiveMode;
} OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions;
typedef struct Opt_promptAction_ActionMenuOptions {
    OH_Tag tag;
    OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions value;
} Opt_promptAction_ActionMenuOptions;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_PROMPTACTION_LevelOrderHandleOpaque;
typedef struct OH_OHOS_PROMPTACTION_LevelOrderHandleOpaque* OH_OHOS_PROMPTACTION_LevelOrderHandle;
typedef struct OH_OHOS_PROMPTACTION_LevelOrderModifier {
    OH_OHOS_PROMPTACTION_LevelOrderHandle (*construct)();
    void (*destruct)(OH_OHOS_PROMPTACTION_LevelOrderHandle thisPtr);
    OH_OHOS_PROMPTACTION_LevelOrder (*clamp)(const OH_Number* order);
    OH_Number (*getOrder)(OH_NativePointer thisPtr);
} OH_OHOS_PROMPTACTION_LevelOrderModifier;
struct OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandleOpaque;
typedef struct OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandleOpaque* OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandle;
typedef struct OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifier {
    OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandle (*construct)();
    void (*destruct)(OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandle thisPtr);
    void (*close)(OH_NativePointer thisPtr);
} OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifier;
struct OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandleOpaque;
typedef struct OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandleOpaque* OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandle;
typedef struct OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifier {
    OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandle (*construct)();
    void (*destruct)(OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandle thisPtr);
} OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifier;
typedef struct OH_OHOS_PROMPTACTION_API {
    OH_Int32 version;
    const OH_OHOS_PROMPTACTION_LevelOrderModifier* (*LevelOrder)();
    const OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifier* (*PromptAction_CommonController)();
    const OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifier* (*PromptAction_DialogController)();
} OH_OHOS_PROMPTACTION_API;
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

#endif // OH_OHOS_PROMPTACTION_H
/* clang-format on */