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

#ifndef OH_OHOS_ARKUI_DRAGCONTROLLER_H
#define OH_OHOS_ARKUI_DRAGCONTROLLER_H

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


#define OHOS_ARKUI_DRAGCONTROLLER_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext;
typedef InteropAsyncWorker OH_OHOS_ARKUI_DRAGCONTROLLER_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_ARKUI_DRAGCONTROLLER_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_ARKUI_DRAGCONTROLLER_APIKind {
    OH_OHOS_ARKUI_DRAGCONTROLLER_API_KIND = 10
} OH_OHOS_ARKUI_DRAGCONTROLLER_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Number Opt_Number;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionPeer OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionPeer;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionPeer* OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction;
typedef struct Opt_dragController_DragAction Opt_dragController_DragAction;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewPeer OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewPeer;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewPeer* OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview;
typedef struct Opt_dragController_DragPreview Opt_dragController_DragPreview;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedDataPeer OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedDataPeer;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedDataPeer* OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData;
typedef struct Opt_unifiedDataChannel_UnifiedData Opt_unifiedDataChannel_UnifiedData;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve;
typedef struct Opt_Union_Curve_ICurve Opt_Union_Curve_ICurve;
typedef struct Opt_String Opt_String;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void Opt_OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void;
typedef struct Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void;
typedef struct Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions;
typedef struct Opt_dragController_AnimationOptions Opt_dragController_AnimationOptions;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo;
typedef struct Opt_dragController_DragAndDropInfo Opt_dragController_DragAndDropInfo;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam;
typedef struct Opt_dragController_DragEventParam Opt_dragController_DragEventParam;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo;
typedef struct Opt_dragController_DragInfo Opt_dragController_DragInfo;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_ARKUI_DRAGCONTROLLER_Object;
typedef enum OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStartRequestStatus {
    OH_OHOS_ARKUI_DRAGCONTROLLER_DRAG_CONTROLLER_DRAG_START_REQUEST_STATUS_WAITING = 0,
    OH_OHOS_ARKUI_DRAGCONTROLLER_DRAG_CONTROLLER_DRAG_START_REQUEST_STATUS_READY = 1,
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStartRequestStatus;
typedef struct Opt_dragController_DragStartRequestStatus {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStartRequestStatus value;
} Opt_dragController_DragStartRequestStatus;
typedef enum OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus {
    OH_OHOS_ARKUI_DRAGCONTROLLER_DRAG_CONTROLLER_DRAG_STATUS_STARTED = 0,
    OH_OHOS_ARKUI_DRAGCONTROLLER_DRAG_CONTROLLER_DRAG_STATUS_ENDED = 1,
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus;
typedef struct Opt_dragController_DragStatus {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus value;
} Opt_dragController_DragStatus;
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
typedef struct Opt_CustomObject {
    OH_Tag tag;
    OH_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_dragController_DragAction {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction value;
} Opt_dragController_DragAction;
typedef struct Opt_dragController_DragPreview {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview value;
} Opt_dragController_DragPreview;
typedef struct Opt_unifiedDataChannel_UnifiedData {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData value;
} Opt_unifiedDataChannel_UnifiedData;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_CustomObject value0;
        OH_CustomObject value1;
    };
} OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve;
typedef struct Opt_Union_Curve_ICurve {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve value;
} Opt_Union_Curve_ICurve;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error);
} OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void value;
} Opt_OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void {
    /* kind: Callback */
    OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0);
    void (*callSync)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0);
} OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void;
typedef struct Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void {
    OH_Tag tag;
    OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void value;
} Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void;
typedef struct OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void {
    /* kind: Callback */
    OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void;
typedef struct Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void {
    OH_Tag tag;
    OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void value;
} Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions {
    /* kind: Interface */
    Opt_Number duration;
    Opt_Union_Curve_ICurve curve;
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions;
typedef struct Opt_dragController_AnimationOptions {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions value;
} Opt_dragController_AnimationOptions;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo {
    /* kind: Interface */
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus status;
    OH_CustomObject event;
    Opt_String extraParams;
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo;
typedef struct Opt_dragController_DragAndDropInfo {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value;
} Opt_dragController_DragAndDropInfo;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam {
    /* kind: Interface */
    OH_CustomObject event;
    OH_String extraParams;
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam;
typedef struct Opt_dragController_DragEventParam {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam value;
} Opt_dragController_DragEventParam;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo {
    /* kind: Interface */
    OH_Number pointerId;
    Opt_unifiedDataChannel_UnifiedData data;
    Opt_String extraParams;
    Opt_CustomObject touchPoint;
    Opt_CustomObject previewOptions;
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo;
typedef struct Opt_dragController_DragInfo {
    OH_Tag tag;
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo value;
} Opt_dragController_DragInfo;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandleOpaque;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandleOpaque* OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandle;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionModifier {
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandle (*construct)();
    void (*destruct)(OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandle thisPtr);
    void (*startDrag)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, OH_OHOS_ARKUI_DRAGCONTROLLER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*onStatusChange)(OH_NativePointer thisPtr, const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void* callback_);
    void (*offStatusChange)(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void* callback_);
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionModifier;
struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandleOpaque;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandleOpaque* OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandle;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewModifier {
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandle (*construct)();
    void (*destruct)(OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandle thisPtr);
    void (*setForegroundColor)(OH_NativePointer thisPtr, const OH_CustomObject* color);
    void (*animate)(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions* options, const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void* handler);
} OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewModifier;
typedef struct OH_OHOS_ARKUI_DRAGCONTROLLER_API {
    OH_Int32 version;
    const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionModifier* (*DragController_DragAction)();
    const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewModifier* (*DragController_DragPreview)();
} OH_OHOS_ARKUI_DRAGCONTROLLER_API;
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

#endif // OH_OHOS_ARKUI_DRAGCONTROLLER_H
/* clang-format on */