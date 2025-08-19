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

#ifndef OH_OHOS_MULTIMEDIA_IMAGE_H
#define OH_OHOS_MULTIMEDIA_IMAGE_H

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


#define OHOS_MULTIMEDIA_IMAGE_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_MULTIMEDIA_IMAGE_VMContext;
typedef InteropAsyncWorker OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_MULTIMEDIA_IMAGE_APIKind {
    OH_OHOS_MULTIMEDIA_IMAGE_API_KIND = 10
} OH_OHOS_MULTIMEDIA_IMAGE_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Float64 Opt_Float64;
typedef struct OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManagerPeer OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManagerPeer;
typedef struct OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManagerPeer* OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager;
typedef struct Opt_colorSpaceManager_ColorSpaceManager Opt_colorSpaceManager_ColorSpaceManager;
typedef struct OHOS_MULTIMEDIA_IMAGE_image_PixelMapPeer OHOS_MULTIMEDIA_IMAGE_image_PixelMapPeer;
typedef struct OHOS_MULTIMEDIA_IMAGE_image_PixelMapPeer* OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap;
typedef struct Opt_image_PixelMap Opt_image_PixelMap;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_Size OH_OHOS_MULTIMEDIA_IMAGE_image_Size;
typedef struct Opt_image_Size Opt_image_Size;
typedef struct OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequencePeer OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequencePeer;
typedef struct OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequencePeer* OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence;
typedef struct Opt_rpc_MessageSequence Opt_rpc_MessageSequence;
typedef struct Opt_String Opt_String;
typedef struct OHOS_MULTIMEDIA_IMAGE_AsyncCallback OHOS_MULTIMEDIA_IMAGE_AsyncCallback;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_AsyncCallback Opt_OHOS_MULTIMEDIA_IMAGE_AsyncCallback;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Void OHOS_MULTIMEDIA_IMAGE_Callback_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Void Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_BusinessErrorPeer OHOS_MULTIMEDIA_IMAGE_BusinessErrorPeer;
typedef struct OHOS_MULTIMEDIA_IMAGE_BusinessErrorPeer* OH_OHOS_MULTIMEDIA_IMAGE_BusinessError;
typedef struct Opt_BusinessError Opt_BusinessError;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo;
typedef struct Opt_image_ImageInfo Opt_image_ImageInfo;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_Region OH_OHOS_MULTIMEDIA_IMAGE_image_Region;
typedef struct Opt_image_Region Opt_image_Region;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea;
typedef struct Opt_image_PositionArea Opt_image_PositionArea;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_MULTIMEDIA_IMAGE_Object;
typedef enum OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType {
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ALPHA_TYPE_UNKNOWN = 0,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ALPHA_TYPE_OPAQUE = 1,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ALPHA_TYPE_PREMUL = 2,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ALPHA_TYPE_UNPREMUL = 3,
} OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType;
typedef struct Opt_image_AlphaType {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType value;
} Opt_image_AlphaType;
typedef enum OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel {
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ANTI_ALIASING_LEVEL_NONE = 0,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ANTI_ALIASING_LEVEL_LOW = 1,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ANTI_ALIASING_LEVEL_MEDIUM = 2,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_ANTI_ALIASING_LEVEL_HIGH = 3,
} OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel;
typedef struct Opt_image_AntiAliasingLevel {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel value;
} Opt_image_AntiAliasingLevel;
typedef enum OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat {
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_UNKNOWN = 0,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_ARGB_8888 = 1,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_RGB_565 = 2,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_RGBA_8888 = 3,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_BGRA_8888 = 4,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_RGB_888 = 5,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_ALPHA_8 = 6,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_RGBA_F16 = 7,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_NV21 = 8,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_NV12 = 9,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_RGBA_1010102 = 10,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_YCBCR_P010 = 11,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_YCRCB_P010 = 12,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_PIXEL_MAP_FORMAT_ASTC_4X_4 = 102,
} OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat;
typedef struct Opt_image_PixelMapFormat {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat value;
} Opt_image_PixelMapFormat;
typedef enum OH_OHOS_MULTIMEDIA_IMAGE_image_ResolutionQuality {
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_RESOLUTION_QUALITY_LOW = 1,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_RESOLUTION_QUALITY_MEDIUM = 2,
    OH_OHOS_MULTIMEDIA_IMAGE_IMAGE_RESOLUTION_QUALITY_HIGH = 3,
} OH_OHOS_MULTIMEDIA_IMAGE_image_ResolutionQuality;
typedef struct Opt_image_ResolutionQuality {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_ResolutionQuality value;
} Opt_image_ResolutionQuality;
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
typedef struct Opt_Buffer {
    OH_Tag tag;
    OH_Buffer value;
} Opt_Buffer;
typedef struct Opt_CustomObject {
    OH_Tag tag;
    OH_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_Float64 {
    OH_Tag tag;
    OH_Float64 value;
} Opt_Float64;
typedef struct Opt_colorSpaceManager_ColorSpaceManager {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager value;
} Opt_colorSpaceManager_ColorSpaceManager;
typedef struct Opt_image_PixelMap {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap value;
} Opt_image_PixelMap;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_Size {
    /* kind: Interface */
    OH_Int32 height;
    OH_Int32 width;
} OH_OHOS_MULTIMEDIA_IMAGE_image_Size;
typedef struct Opt_image_Size {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_Size value;
} Opt_image_Size;
typedef struct Opt_rpc_MessageSequence {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence value;
} Opt_rpc_MessageSequence;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_MULTIMEDIA_IMAGE_AsyncCallback {
    /* kind: Callback */
    OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
    void (*callSync)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
} OHOS_MULTIMEDIA_IMAGE_AsyncCallback;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_AsyncCallback {
    OH_Tag tag;
    OHOS_MULTIMEDIA_IMAGE_AsyncCallback value;
} Opt_OHOS_MULTIMEDIA_IMAGE_AsyncCallback;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error);
} OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void value;
} Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void value;
} Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void value;
} Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void;
typedef struct OHOS_MULTIMEDIA_IMAGE_Callback_Void {
    /* kind: Callback */
    OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_MULTIMEDIA_IMAGE_Callback_Void;
typedef struct Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Void {
    OH_Tag tag;
    OHOS_MULTIMEDIA_IMAGE_Callback_Void value;
} Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Void;
typedef struct Opt_BusinessError {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_BusinessError value;
} Opt_BusinessError;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo {
    /* kind: Interface */
    OH_OHOS_MULTIMEDIA_IMAGE_image_Size size;
    OH_Int32 density;
    OH_Int32 stride;
    OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat pixelFormat;
    OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType alphaType;
    OH_String mimeType;
    OH_Boolean isHdr;
} OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo;
typedef struct Opt_image_ImageInfo {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo value;
} Opt_image_ImageInfo;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_Region {
    /* kind: Interface */
    OH_OHOS_MULTIMEDIA_IMAGE_image_Size size;
    OH_Int32 x;
    OH_Int32 y;
} OH_OHOS_MULTIMEDIA_IMAGE_image_Region;
typedef struct Opt_image_Region {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_Region value;
} Opt_image_Region;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea {
    /* kind: Interface */
    OH_Buffer pixels;
    OH_Int32 offset;
    OH_Int32 stride;
    OH_OHOS_MULTIMEDIA_IMAGE_image_Region region;
} OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea;
typedef struct Opt_image_PositionArea {
    OH_Tag tag;
    OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea value;
} Opt_image_PositionArea;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandleOpaque;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandleOpaque* OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandle;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifier {
    OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandle (*construct)();
    void (*destruct)(OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandle thisPtr);
    void (*readPixelsToBuffer0)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Buffer* dst, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*readPixelsToBuffer1)(OH_NativePointer thisPtr, const OH_Buffer* dst, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*readPixelsToBufferSync)(OH_NativePointer thisPtr, const OH_Buffer* dst);
    void (*readPixels0)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*readPixels1)(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*readPixelsSync)(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area);
    void (*writePixels0)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*writePixels1)(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*writePixelsSync)(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area);
    void (*writeBufferToPixels0)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Buffer* src, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*writeBufferToPixels1)(OH_NativePointer thisPtr, const OH_Buffer* src, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*writeBufferToPixelsSync)(OH_NativePointer thisPtr, const OH_Buffer* src);
    void (*toSdr)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getImageInfo0)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getImageInfo1)(OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo (*getImageInfoSync)(OH_NativePointer thisPtr);
    OH_Int32 (*getBytesNumberPerRow)(OH_NativePointer thisPtr);
    OH_Int32 (*getPixelBytesNumber)(OH_NativePointer thisPtr);
    OH_Int32 (*getDensity)(OH_NativePointer thisPtr);
    void (*opacity0)(OH_NativePointer thisPtr, OH_Float64 rate, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*opacity1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 rate, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*opacitySync)(OH_NativePointer thisPtr, OH_Float64 rate);
    void (*createAlphaPixelmap0)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*createAlphaPixelmap1)(OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap (*createAlphaPixelmapSync)(OH_NativePointer thisPtr);
    void (*scale0)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*scale1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*scaleSync0)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y);
    void (*scale2)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel level, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*scaleSync1)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel level);
    void (*createScaledPixelMap)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const Opt_image_AntiAliasingLevel* level, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap (*createScaledPixelMapSync)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const Opt_image_AntiAliasingLevel* level);
    void (*translate0)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*translate1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*translateSync)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y);
    void (*rotate0)(OH_NativePointer thisPtr, OH_Float64 angle, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*rotate1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 angle, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*rotateSync)(OH_NativePointer thisPtr, OH_Float64 angle);
    void (*flip0)(OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*flip1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*flipSync)(OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical);
    void (*crop0)(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* region, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*crop1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* region, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*cropSync)(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* region);
    OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager (*getColorSpace)(OH_NativePointer thisPtr);
    void (*marshalling)(OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence sequence_);
    void (*unmarshalling)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence sequence_, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setColorSpace)(OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager colorSpace);
    void (*applyColorSpace0)(OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager targetColorSpace, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*applyColorSpace1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager targetColorSpace, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*convertPixelFormat)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat targetPixelFormat, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*release0)(OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
    void (*release1)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setMemoryNameSync)(OH_NativePointer thisPtr, const OH_String* name);
    OH_Boolean (*getIsEditable)(OH_NativePointer thisPtr);
    OH_Boolean (*getIsStrideAlignment)(OH_NativePointer thisPtr);
} OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifier;
typedef struct OH_OHOS_MULTIMEDIA_IMAGE_API {
    OH_Int32 version;
    const OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifier* (*Image_PixelMap)();
} OH_OHOS_MULTIMEDIA_IMAGE_API;
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

#endif // OH_OHOS_MULTIMEDIA_IMAGE_H
/* clang-format on */