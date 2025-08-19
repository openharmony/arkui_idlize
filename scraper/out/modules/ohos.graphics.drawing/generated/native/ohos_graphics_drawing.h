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

#ifndef OH_OHOS_GRAPHICS_DRAWING_H
#define OH_OHOS_GRAPHICS_DRAWING_H

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


#define OHOS_GRAPHICS_DRAWING_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_GRAPHICS_DRAWING_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_GRAPHICS_DRAWING_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_GRAPHICS_DRAWING_VMContext;
typedef InteropAsyncWorker OH_OHOS_GRAPHICS_DRAWING_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_GRAPHICS_DRAWING_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_GRAPHICS_DRAWING_APIKind {
    OH_OHOS_GRAPHICS_DRAWING_API_KIND = 10
} OH_OHOS_GRAPHICS_DRAWING_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_common2D_Color Array_common2D_Color;
typedef struct Opt_Array_common2D_Color Opt_Array_common2D_Color;
typedef struct Array_drawing_RectType Array_drawing_RectType;
typedef struct Opt_Array_drawing_RectType Opt_Array_drawing_RectType;
typedef struct Array_Float64 Array_Float64;
typedef struct Opt_Array_Float64 Opt_Array_Float64;
typedef struct Array_Int32 Array_Int32;
typedef struct Opt_Array_Int32 Opt_Array_Int32;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_Int64 Opt_Int64;
typedef struct OH_OHOS_GRAPHICS_DRAWING_common2D_Color OH_OHOS_GRAPHICS_DRAWING_common2D_Color;
typedef struct Opt_common2D_Color Opt_common2D_Color;
typedef struct OH_OHOS_GRAPHICS_DRAWING_common2D_Rect OH_OHOS_GRAPHICS_DRAWING_common2D_Rect;
typedef struct Opt_common2D_Rect Opt_common2D_Rect;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_BrushPeer OHOS_GRAPHICS_DRAWING_drawing_BrushPeer;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_BrushPeer* OH_OHOS_GRAPHICS_DRAWING_drawing_Brush;
typedef struct Opt_drawing_Brush Opt_drawing_Brush;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_CanvasPeer OHOS_GRAPHICS_DRAWING_drawing_CanvasPeer;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_CanvasPeer* OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas;
typedef struct Opt_drawing_Canvas Opt_drawing_Canvas;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_ColorFilterPeer OHOS_GRAPHICS_DRAWING_drawing_ColorFilterPeer;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_ColorFilterPeer* OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter;
typedef struct Opt_drawing_ColorFilter Opt_drawing_ColorFilter;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_LatticePeer OHOS_GRAPHICS_DRAWING_drawing_LatticePeer;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_LatticePeer* OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice;
typedef struct Opt_drawing_Lattice Opt_drawing_Lattice;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsPeer OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsPeer;
typedef struct OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsPeer* OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions;
typedef struct Opt_drawing_SamplingOptions Opt_drawing_SamplingOptions;
typedef struct OHOS_GRAPHICS_DRAWING_image_PixelMapPeer OHOS_GRAPHICS_DRAWING_image_PixelMapPeer;
typedef struct OHOS_GRAPHICS_DRAWING_image_PixelMapPeer* OH_OHOS_GRAPHICS_DRAWING_image_PixelMap;
typedef struct Opt_image_PixelMap Opt_image_PixelMap;
typedef struct OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32 OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32;
typedef struct Opt_Union_Common2D_Color_I32 Opt_Union_Common2D_Color_I32;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_GRAPHICS_DRAWING_Object;
typedef enum OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode {
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_CLEAR = 0,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SRC = 1,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DST = 2,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SRC_OVER = 3,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DST_OVER = 4,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SRC_IN = 5,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DST_IN = 6,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SRC_OUT = 7,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DST_OUT = 8,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SRC_ATOP = 9,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DST_ATOP = 10,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_XOR = 11,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_PLUS = 12,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_MODULATE = 13,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SCREEN = 14,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_OVERLAY = 15,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DARKEN = 16,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_LIGHTEN = 17,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_COLOR_DODGE = 18,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_COLOR_BURN = 19,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_HARD_LIGHT = 20,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SOFT_LIGHT = 21,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_DIFFERENCE = 22,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_EXCLUSION = 23,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_MULTIPLY = 24,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_HUE = 25,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_SATURATION = 26,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_COLOR = 27,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_BLEND_MODE_LUMINOSITY = 28,
} OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode;
typedef struct Opt_drawing_BlendMode {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode value;
} Opt_drawing_BlendMode;
typedef enum OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode {
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_FILTER_MODE_FILTER_MODE_NEAREST = 0,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_FILTER_MODE_FILTER_MODE_LINEAR = 1,
} OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode;
typedef struct Opt_drawing_FilterMode {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode value;
} Opt_drawing_FilterMode;
typedef enum OH_OHOS_GRAPHICS_DRAWING_drawing_RectType {
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_RECT_TYPE_DEFAULT = 0,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_RECT_TYPE_TRANSPARENT = 1,
    OH_OHOS_GRAPHICS_DRAWING_DRAWING_RECT_TYPE_FIXEDCOLOR = 2,
} OH_OHOS_GRAPHICS_DRAWING_drawing_RectType;
typedef struct Opt_drawing_RectType {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_RectType value;
} Opt_drawing_RectType;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_common2D_Color {
    /* kind: ContainerType */
    OH_OHOS_GRAPHICS_DRAWING_common2D_Color* array;
    OH_Int32 length;
} Array_common2D_Color;
typedef struct Opt_Array_common2D_Color {
    OH_Tag tag;
    Array_common2D_Color value;
} Opt_Array_common2D_Color;
typedef struct Array_drawing_RectType {
    /* kind: ContainerType */
    OH_OHOS_GRAPHICS_DRAWING_drawing_RectType* array;
    OH_Int32 length;
} Array_drawing_RectType;
typedef struct Opt_Array_drawing_RectType {
    OH_Tag tag;
    Array_drawing_RectType value;
} Opt_Array_drawing_RectType;
typedef struct Array_Float64 {
    /* kind: ContainerType */
    OH_Float64* array;
    OH_Int32 length;
} Array_Float64;
typedef struct Opt_Array_Float64 {
    OH_Tag tag;
    Array_Float64 value;
} Opt_Array_Float64;
typedef struct Array_Int32 {
    /* kind: ContainerType */
    OH_Int32* array;
    OH_Int32 length;
} Array_Int32;
typedef struct Opt_Array_Int32 {
    OH_Tag tag;
    Array_Int32 value;
} Opt_Array_Int32;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
typedef struct Opt_Float64 {
    OH_Tag tag;
    OH_Float64 value;
} Opt_Float64;
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct OH_OHOS_GRAPHICS_DRAWING_common2D_Color {
    /* kind: Interface */
    OH_Int32 alpha;
    OH_Int32 red;
    OH_Int32 green;
    OH_Int32 blue;
} OH_OHOS_GRAPHICS_DRAWING_common2D_Color;
typedef struct Opt_common2D_Color {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_common2D_Color value;
} Opt_common2D_Color;
typedef struct OH_OHOS_GRAPHICS_DRAWING_common2D_Rect {
    /* kind: Interface */
    OH_Float64 left;
    OH_Float64 top;
    OH_Float64 right;
    OH_Float64 bottom;
} OH_OHOS_GRAPHICS_DRAWING_common2D_Rect;
typedef struct Opt_common2D_Rect {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_common2D_Rect value;
} Opt_common2D_Rect;
typedef struct Opt_drawing_Brush {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_Brush value;
} Opt_drawing_Brush;
typedef struct Opt_drawing_Canvas {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas value;
} Opt_drawing_Canvas;
typedef struct Opt_drawing_ColorFilter {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter value;
} Opt_drawing_ColorFilter;
typedef struct Opt_drawing_Lattice {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice value;
} Opt_drawing_Lattice;
typedef struct Opt_drawing_SamplingOptions {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions value;
} Opt_drawing_SamplingOptions;
typedef struct Opt_image_PixelMap {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_image_PixelMap value;
} Opt_image_PixelMap;
typedef struct OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32 {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_OHOS_GRAPHICS_DRAWING_common2D_Color value0;
        OH_Int32 value1;
    };
} OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32;
typedef struct Opt_Union_Common2D_Color_I32 {
    OH_Tag tag;
    OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32 value;
} Opt_Union_Common2D_Color_I32;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandleOpaque;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandleOpaque* OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifier {
    OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle (*construct0)();
    OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle (*construct1)(OH_OHOS_GRAPHICS_DRAWING_drawing_Brush brush);
    void (*destruct)(OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle thisPtr);
    void (*setBlendMode)(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode mode);
    void (*reset)(OH_NativePointer thisPtr);
} OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifier;
struct OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandleOpaque;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandleOpaque* OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifier {
    OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle (*construct)(OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap);
    void (*destruct)(OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle thisPtr);
    void (*drawRect0)(OH_NativePointer thisPtr, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* rect);
    void (*drawRect1)(OH_NativePointer thisPtr, OH_Float64 left, OH_Float64 top, OH_Float64 right, OH_Float64 bottom);
    void (*drawImageRect)(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* dstRect, const Opt_drawing_SamplingOptions* samplingOptions);
    void (*drawPixelMapMesh)(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap, OH_Int32 meshWidth, OH_Int32 meshHeight, const Array_Float64* vertices, OH_Int32 vertOffset, const Array_Int32* colors, OH_Int32 colorOffset);
    void (*attachBrush)(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_drawing_Brush brush);
    void (*detachBrush)(OH_NativePointer thisPtr);
    OH_Int64 (*saveLayer)(OH_NativePointer thisPtr, const Opt_common2D_Rect* rect, const Opt_drawing_Brush* brush);
    void (*restore)(OH_NativePointer thisPtr);
    void (*rotate)(OH_NativePointer thisPtr, OH_Float64 degrees, OH_Float64 sx, OH_Float64 sy);
} OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifier;
struct OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandleOpaque;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandleOpaque* OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifier {
    OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle (*construct)();
    void (*destruct)(OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle thisPtr);
    OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter (*createBlendModeColorFilter)(const OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32* color, OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode mode);
} OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifier;
struct OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandleOpaque;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandleOpaque* OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifier {
    OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle (*construct)();
    void (*destruct)(OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle thisPtr);
    OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice (*createImageLattice)(const Array_Int32* xDivs, const Array_Int32* yDivs, OH_Int32 fXCount, OH_Int32 fYCount, const Opt_common2D_Rect* fBounds, const Opt_Array_drawing_RectType* fRectTypes, const Opt_Array_common2D_Color* fColors);
} OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifier;
struct OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandleOpaque;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandleOpaque* OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle;
typedef struct OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifier {
    OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle (*construct0)();
    OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle (*construct1)(OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode filterMode);
    void (*destruct)(OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle thisPtr);
} OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifier;
typedef struct OH_OHOS_GRAPHICS_DRAWING_API {
    OH_Int32 version;
    const OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifier* (*Drawing_Brush)();
    const OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifier* (*Drawing_Canvas)();
    const OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifier* (*Drawing_ColorFilter)();
    const OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifier* (*Drawing_Lattice)();
    const OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifier* (*Drawing_SamplingOptions)();
} OH_OHOS_GRAPHICS_DRAWING_API;
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

#endif // OH_OHOS_GRAPHICS_DRAWING_H
/* clang-format on */