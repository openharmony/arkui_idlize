
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

#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H

/**
 * THIS FILE IS GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!
 */

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

#include <stdint.h>
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
typedef unsigned int InteropUInt32; // TODO: update unsigned int
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

// Binary layout of InteropLength must match that of KLength.
typedef struct InteropLength
{
  InteropInt8 type;
  InteropFloat32 value;
  InteropInt32 unit;
  InteropInt32 resource;
} InteropLength;

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


// The only include allowed in this file! Do not add anything else ever.
#include <stdint.h>

#define GENERATED_ARKUI_FULL_API_VERSION 99
#define GENERATED_ARKUI_NODE_API_VERSION GENERATED_ARKUI_FULL_API_VERSION

#define GENERATED_ARKUI_BASIC_NODE_API_VERSION 1
#define GENERATED_ARKUI_EXTENDED_NODE_API_VERSION 8
#define GENERATED_ARKUI_NODE_GRAPHICS_API_VERSION 5
#define GENERATED_ARKUI_NODE_MODIFIERS_API_VERSION 6

#define GENERATED_ARKUI_AUTO_GENERATE_NODE_ID (-2)

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag Ark_Tag;
typedef InteropRuntimeType Ark_RuntimeType;

typedef InteropFloat32 Ark_Float32;
typedef InteropFloat64 Ark_Float64;
typedef InteropInt32 Ark_Int32;
typedef InteropUInt32 Ark_UInt32;
typedef InteropInt64 Ark_Int64;
typedef InteropInt8 Ark_Int8;
typedef InteropBoolean Ark_Boolean;
typedef InteropCharPtr Ark_CharPtr;
typedef InteropNativePointer Ark_NativePointer;
typedef InteropString Ark_String;
typedef InteropCallbackResource Ark_CallbackResource;
typedef InteropNumber Ark_Number;
typedef InteropMaterialized Ark_Materialized;
typedef InteropCustomObject Ark_CustomObject;
typedef InteropUndefined Ark_Undefined;
typedef InteropVMContext Ark_VMContext;
typedef InteropBuffer Ark_Buffer;
typedef InteropNodeHandle Ark_NodeHandle;
typedef InteropPipelineContext Ark_PipelineContext;
typedef InteropCustomObject Ark_CustomObject;
typedef InteropDate Ark_Date;
typedef InteropFunction Ark_Function;
typedef InteropAsyncWork Ark_AsyncWork;
typedef InteropAsyncWorker Ark_AsyncWorker;
typedef InteropAsyncWorkerPtr Ark_AsyncWorkerPtr;
typedef InteropObject Ark_Object;

// TODO: generate!
typedef struct Opt_Ark_Callback {
  Ark_Tag tag;
  Ark_CustomObject value;
} Opt_Ark_Callback;

enum GENERATED_Ark_APIVariantKind {
    GENERATED_BASIC = 10,
    GENERATED_FULL = 11,
    GENERATED_GRAPHICS = 12,
    GENERATED_EXTENDED = 13,
    GENERATED_COUNT = GENERATED_EXTENDED + 1
};

enum Ark_APINodeFlags {
    GENERATED_CUSTOM_NONE = 0,
    GENERATED_CUSTOM_MEASURE = 1 << 0,
    GENERATED_CUSTOM_LAYOUT = 1 << 1,
    GENERATED_CUSTOM_DRAW = 1 << 2,
    GENERATED_CUSTOM_FOREGROUND_DRAW = 1 << 3,
    GENERATED_CUSTOM_OVERLAY_DRAW = 1 << 4,
};
enum Ark_APICustomOp {
    GENERATED_MEASURE = 1,
    GENERATED_LAYOUT = 2,
    GENERATED_DRAW = 3
};

struct _Ark_Canvas;
typedef struct _Ark_Canvas* Ark_CanvasHandle;



typedef struct Opt_Int32 Opt_Int32;
typedef struct AccessibilityCallback AccessibilityCallback;
typedef struct Opt_AccessibilityCallback Opt_AccessibilityCallback;
typedef struct BaseShapePeer BaseShapePeer;
typedef struct BaseShapePeer* Ark_BaseShape;
typedef struct Opt_BaseShape Opt_BaseShape;
typedef struct Ark_BlankAttribute Ark_BlankAttribute;
typedef struct Opt_BlankAttribute Opt_BlankAttribute;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Ark_BooleanInterfaceDTS Ark_BooleanInterfaceDTS;
typedef struct Opt_BooleanInterfaceDTS Opt_BooleanInterfaceDTS;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Ark_ButtonAttribute Ark_ButtonAttribute;
typedef struct Opt_ButtonAttribute Opt_ButtonAttribute;
typedef struct Ark_CalendarPickerAttribute Ark_CalendarPickerAttribute;
typedef struct Opt_CalendarPickerAttribute Opt_CalendarPickerAttribute;
typedef struct Ark_CanvasAttribute Ark_CanvasAttribute;
typedef struct Opt_CanvasAttribute Opt_CanvasAttribute;
typedef struct CanvasGradientPeer CanvasGradientPeer;
typedef struct CanvasGradientPeer* Ark_CanvasGradient;
typedef struct Opt_CanvasGradient Opt_CanvasGradient;
typedef struct CanvasPathPeer CanvasPathPeer;
typedef struct CanvasPathPeer* Ark_CanvasPath;
typedef struct Opt_CanvasPath Opt_CanvasPath;
typedef struct CanvasPatternPeer CanvasPatternPeer;
typedef struct CanvasPatternPeer* Ark_CanvasPattern;
typedef struct Opt_CanvasPattern Opt_CanvasPattern;
typedef struct Ark_ClassDTS Ark_ClassDTS;
typedef struct Opt_ClassDTS Opt_ClassDTS;
typedef struct ClassWithConstructorAndAllOptionalParamsDTSPeer ClassWithConstructorAndAllOptionalParamsDTSPeer;
typedef struct ClassWithConstructorAndAllOptionalParamsDTSPeer* Ark_ClassWithConstructorAndAllOptionalParamsDTS;
typedef struct Opt_ClassWithConstructorAndAllOptionalParamsDTS Opt_ClassWithConstructorAndAllOptionalParamsDTS;
typedef struct ClassWithConstructorAndMethodsDTSPeer ClassWithConstructorAndMethodsDTSPeer;
typedef struct ClassWithConstructorAndMethodsDTSPeer* Ark_ClassWithConstructorAndMethodsDTS;
typedef struct Opt_ClassWithConstructorAndMethodsDTS Opt_ClassWithConstructorAndMethodsDTS;
typedef struct ClassWithConstructorAndNonOptionalParamsDTSPeer ClassWithConstructorAndNonOptionalParamsDTSPeer;
typedef struct ClassWithConstructorAndNonOptionalParamsDTSPeer* Ark_ClassWithConstructorAndNonOptionalParamsDTS;
typedef struct Opt_ClassWithConstructorAndNonOptionalParamsDTS Opt_ClassWithConstructorAndNonOptionalParamsDTS;
typedef struct ClassWithConstructorAndSomeOptionalParamsDTSPeer ClassWithConstructorAndSomeOptionalParamsDTSPeer;
typedef struct ClassWithConstructorAndSomeOptionalParamsDTSPeer* Ark_ClassWithConstructorAndSomeOptionalParamsDTS;
typedef struct Opt_ClassWithConstructorAndSomeOptionalParamsDTS Opt_ClassWithConstructorAndSomeOptionalParamsDTS;
typedef struct ClassWithConstructorAndStaticMethodsDTSPeer ClassWithConstructorAndStaticMethodsDTSPeer;
typedef struct ClassWithConstructorAndStaticMethodsDTSPeer* Ark_ClassWithConstructorAndStaticMethodsDTS;
typedef struct Opt_ClassWithConstructorAndStaticMethodsDTS Opt_ClassWithConstructorAndStaticMethodsDTS;
typedef struct ClassWithConstructorAndWithoutParamsDTSPeer ClassWithConstructorAndWithoutParamsDTSPeer;
typedef struct ClassWithConstructorAndWithoutParamsDTSPeer* Ark_ClassWithConstructorAndWithoutParamsDTS;
typedef struct Opt_ClassWithConstructorAndWithoutParamsDTS Opt_ClassWithConstructorAndWithoutParamsDTS;
typedef struct ClassWithConstructorDTSPeer ClassWithConstructorDTSPeer;
typedef struct ClassWithConstructorDTSPeer* Ark_ClassWithConstructorDTS;
typedef struct Opt_ClassWithConstructorDTS Opt_ClassWithConstructorDTS;
typedef struct Ark_ColorContent Ark_ColorContent;
typedef struct Opt_ColorContent Opt_ColorContent;
typedef struct ColorFilterPeer ColorFilterPeer;
typedef struct ColorFilterPeer* Ark_ColorFilter;
typedef struct Opt_ColorFilter Opt_ColorFilter;
typedef struct Ark_ColumnAttribute Ark_ColumnAttribute;
typedef struct Opt_ColumnAttribute Opt_ColumnAttribute;
typedef struct CommonShapePeer CommonShapePeer;
typedef struct CommonShapePeer* Ark_CommonShape;
typedef struct Opt_CommonShape Opt_CommonShape;
typedef struct Ark_CounterAttribute Ark_CounterAttribute;
typedef struct Opt_CounterAttribute Opt_CounterAttribute;
typedef struct CustomDialogControllerPeer CustomDialogControllerPeer;
typedef struct CustomDialogControllerPeer* Ark_CustomDialogController;
typedef struct Opt_CustomDialogController Opt_CustomDialogController;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Ark_DividerAttribute Ark_DividerAttribute;
typedef struct Opt_DividerAttribute Opt_DividerAttribute;
typedef struct DragEventPeer DragEventPeer;
typedef struct DragEventPeer* Ark_DragEvent;
typedef struct Opt_DragEvent Opt_DragEvent;
typedef struct Ark_DrawingCanvas Ark_DrawingCanvas;
typedef struct Opt_DrawingCanvas Opt_DrawingCanvas;
typedef struct DrawingColorFilterPeer DrawingColorFilterPeer;
typedef struct DrawingColorFilterPeer* Ark_DrawingColorFilter;
typedef struct Opt_DrawingColorFilter Opt_DrawingColorFilter;
typedef struct DrawingLatticePeer DrawingLatticePeer;
typedef struct DrawingLatticePeer* Ark_DrawingLattice;
typedef struct Opt_DrawingLattice Opt_DrawingLattice;
typedef struct Ark_EdgeEffectOptions Ark_EdgeEffectOptions;
typedef struct Opt_EdgeEffectOptions Opt_EdgeEffectOptions;
typedef struct Ark_EmbeddedComponentAttribute Ark_EmbeddedComponentAttribute;
typedef struct Opt_EmbeddedComponentAttribute Opt_EmbeddedComponentAttribute;
typedef struct EventTargetInfoPeer EventTargetInfoPeer;
typedef struct EventTargetInfoPeer* Ark_EventTargetInfo;
typedef struct Opt_EventTargetInfo Opt_EventTargetInfo;
typedef struct Ark_FlexAttribute Ark_FlexAttribute;
typedef struct Opt_FlexAttribute Opt_FlexAttribute;
typedef struct Opt_Float32 Opt_Float32;
typedef struct Ark_FormComponentAttribute Ark_FormComponentAttribute;
typedef struct Opt_FormComponentAttribute Opt_FormComponentAttribute;
typedef struct GestureGroupInterfacePeer GestureGroupInterfacePeer;
typedef struct GestureGroupInterfacePeer* Ark_GestureGroupInterface;
typedef struct Opt_GestureGroupInterface Opt_GestureGroupInterface;
typedef struct GestureModifierPeer GestureModifierPeer;
typedef struct GestureModifierPeer* Ark_GestureModifier;
typedef struct Opt_GestureModifier Opt_GestureModifier;
typedef struct GestureRecognizerPeer GestureRecognizerPeer;
typedef struct GestureRecognizerPeer* Ark_GestureRecognizer;
typedef struct Opt_GestureRecognizer Opt_GestureRecognizer;
typedef struct GestureStylePeer GestureStylePeer;
typedef struct GestureStylePeer* Ark_GestureStyle;
typedef struct Opt_GestureStyle Opt_GestureStyle;
typedef struct Ark_GridAttribute Ark_GridAttribute;
typedef struct Opt_GridAttribute Opt_GridAttribute;
typedef struct Ark_GridItemAttribute Ark_GridItemAttribute;
typedef struct Opt_GridItemAttribute Opt_GridItemAttribute;
typedef struct ICurvePeer ICurvePeer;
typedef struct ICurvePeer* Ark_ICurve;
typedef struct Opt_ICurve Opt_ICurve;
typedef struct ImageAnalyzerControllerPeer ImageAnalyzerControllerPeer;
typedef struct ImageAnalyzerControllerPeer* Ark_ImageAnalyzerController;
typedef struct Opt_ImageAnalyzerController Opt_ImageAnalyzerController;
typedef struct Ark_ImageAttribute Ark_ImageAttribute;
typedef struct Opt_ImageAttribute Opt_ImageAttribute;
typedef struct ImageBitmapPeer ImageBitmapPeer;
typedef struct ImageBitmapPeer* Ark_ImageBitmap;
typedef struct Opt_ImageBitmap Opt_ImageBitmap;
typedef struct Ark_IndicatorComponentAttribute Ark_IndicatorComponentAttribute;
typedef struct Opt_IndicatorComponentAttribute Opt_IndicatorComponentAttribute;
typedef struct IndicatorComponentControllerPeer IndicatorComponentControllerPeer;
typedef struct IndicatorComponentControllerPeer* Ark_IndicatorComponentController;
typedef struct Opt_IndicatorComponentController Opt_IndicatorComponentController;
typedef struct Opt_Int64 Opt_Int64;
typedef struct LayoutManagerPeer LayoutManagerPeer;
typedef struct LayoutManagerPeer* Ark_LayoutManager;
typedef struct Opt_LayoutManager Opt_LayoutManager;
typedef struct Ark_LayoutPolicy Ark_LayoutPolicy;
typedef struct Opt_LayoutPolicy Opt_LayoutPolicy;
typedef struct LinearGradientPeer LinearGradientPeer;
typedef struct LinearGradientPeer* Ark_LinearGradient;
typedef struct Opt_LinearGradient Opt_LinearGradient;
typedef struct Ark_ListAttribute Ark_ListAttribute;
typedef struct Opt_ListAttribute Opt_ListAttribute;
typedef struct Ark_ListItemAttribute Ark_ListItemAttribute;
typedef struct Opt_ListItemAttribute Opt_ListItemAttribute;
typedef struct ListScrollerPeer ListScrollerPeer;
typedef struct ListScrollerPeer* Ark_ListScroller;
typedef struct Opt_ListScroller Opt_ListScroller;
typedef struct Ark_Literal_Boolean_isVisible Ark_Literal_Boolean_isVisible;
typedef struct Opt_Literal_Boolean_isVisible Opt_Literal_Boolean_isVisible;
typedef struct LongPressGestureInterfacePeer LongPressGestureInterfacePeer;
typedef struct LongPressGestureInterfacePeer* Ark_LongPressGestureInterface;
typedef struct Opt_LongPressGestureInterface Opt_LongPressGestureInterface;
typedef struct MeasurablePeer MeasurablePeer;
typedef struct MeasurablePeer* Ark_Measurable;
typedef struct Opt_Measurable Opt_Measurable;
typedef struct Opt_NativePointer Opt_NativePointer;
typedef struct Ark_NavDestinationAttribute Ark_NavDestinationAttribute;
typedef struct Opt_NavDestinationAttribute Opt_NavDestinationAttribute;
typedef struct Ark_NavigationAttribute Ark_NavigationAttribute;
typedef struct Opt_NavigationAttribute Opt_NavigationAttribute;
typedef struct NavPathStackPeer NavPathStackPeer;
typedef struct NavPathStackPeer* Ark_NavPathStack;
typedef struct Opt_NavPathStack Opt_NavPathStack;
typedef struct Ark_NestedScrollOptions Ark_NestedScrollOptions;
typedef struct Opt_NestedScrollOptions Opt_NestedScrollOptions;
typedef struct Opt_Number Opt_Number;
typedef struct Ark_NumberInterfaceDTS Ark_NumberInterfaceDTS;
typedef struct Opt_NumberInterfaceDTS Opt_NumberInterfaceDTS;
typedef struct Opt_Object Opt_Object;
typedef struct Ark_Offset_componentutils Ark_Offset_componentutils;
typedef struct Opt_Offset_componentutils Opt_Offset_componentutils;
typedef struct Ark_OffsetResult Ark_OffsetResult;
typedef struct Opt_OffsetResult Opt_OffsetResult;
typedef struct Ark_OnScrollFrameBeginHandlerResult Ark_OnScrollFrameBeginHandlerResult;
typedef struct Opt_OnScrollFrameBeginHandlerResult Opt_OnScrollFrameBeginHandlerResult;
typedef struct PanGestureInterfacePeer PanGestureInterfacePeer;
typedef struct PanGestureInterfacePeer* Ark_PanGestureInterface;
typedef struct Opt_PanGestureInterface Opt_PanGestureInterface;
typedef struct PanGestureOptionsPeer PanGestureOptionsPeer;
typedef struct PanGestureOptionsPeer* Ark_PanGestureOptions;
typedef struct Opt_PanGestureOptions Opt_PanGestureOptions;
typedef struct PanRecognizerPeer PanRecognizerPeer;
typedef struct PanRecognizerPeer* Ark_PanRecognizer;
typedef struct Opt_PanRecognizer Opt_PanRecognizer;
typedef struct Ark_PathAttribute Ark_PathAttribute;
typedef struct Opt_PathAttribute Opt_PathAttribute;
typedef struct PinchGestureInterfacePeer PinchGestureInterfacePeer;
typedef struct PinchGestureInterfacePeer* Ark_PinchGestureInterface;
typedef struct Opt_PinchGestureInterface Opt_PinchGestureInterface;
typedef struct PixelMapPeer PixelMapPeer;
typedef struct PixelMapPeer* Ark_PixelMap;
typedef struct Opt_PixelMap Opt_PixelMap;
typedef struct PixelMapMockPeer PixelMapMockPeer;
typedef struct PixelMapMockPeer* Ark_PixelMapMock;
typedef struct Opt_PixelMapMock Opt_PixelMapMock;
typedef struct Ark_PositionWithAffinity Ark_PositionWithAffinity;
typedef struct Opt_PositionWithAffinity Opt_PositionWithAffinity;
typedef struct ProgressMaskPeer ProgressMaskPeer;
typedef struct ProgressMaskPeer* Ark_ProgressMask;
typedef struct Opt_ProgressMask Opt_ProgressMask;
typedef struct Ark_RectAttribute Ark_RectAttribute;
typedef struct Opt_RectAttribute Opt_RectAttribute;
typedef struct Ark_RectResult Ark_RectResult;
typedef struct Opt_RectResult Opt_RectResult;
typedef struct Ark_RichEditorAttribute Ark_RichEditorAttribute;
typedef struct Opt_RichEditorAttribute Opt_RichEditorAttribute;
typedef struct RichEditorBaseControllerPeer RichEditorBaseControllerPeer;
typedef struct RichEditorBaseControllerPeer* Ark_RichEditorBaseController;
typedef struct Opt_RichEditorBaseController Opt_RichEditorBaseController;
typedef struct RichEditorControllerPeer RichEditorControllerPeer;
typedef struct RichEditorControllerPeer* Ark_RichEditorController;
typedef struct Opt_RichEditorController Opt_RichEditorController;
typedef struct Ark_RichEditorOptions Ark_RichEditorOptions;
typedef struct Opt_RichEditorOptions Opt_RichEditorOptions;
typedef struct RichEditorStyledStringControllerPeer RichEditorStyledStringControllerPeer;
typedef struct RichEditorStyledStringControllerPeer* Ark_RichEditorStyledStringController;
typedef struct Opt_RichEditorStyledStringController Opt_RichEditorStyledStringController;
typedef struct Ark_RichEditorStyledStringOptions Ark_RichEditorStyledStringOptions;
typedef struct Opt_RichEditorStyledStringOptions Opt_RichEditorStyledStringOptions;
typedef struct Ark_RotateResult Ark_RotateResult;
typedef struct Opt_RotateResult Opt_RotateResult;
typedef struct RotationGestureInterfacePeer RotationGestureInterfacePeer;
typedef struct RotationGestureInterfacePeer* Ark_RotationGestureInterface;
typedef struct Opt_RotationGestureInterface Opt_RotationGestureInterface;
typedef struct Ark_RowAttribute Ark_RowAttribute;
typedef struct Opt_RowAttribute Opt_RowAttribute;
typedef struct Ark_ScaleResult Ark_ScaleResult;
typedef struct Opt_ScaleResult Opt_ScaleResult;
typedef struct ScenePeer ScenePeer;
typedef struct ScenePeer* Ark_Scene;
typedef struct Opt_Scene Opt_Scene;
typedef struct ScrollableTargetInfoPeer ScrollableTargetInfoPeer;
typedef struct ScrollableTargetInfoPeer* Ark_ScrollableTargetInfo;
typedef struct Opt_ScrollableTargetInfo Opt_ScrollableTargetInfo;
typedef struct Ark_ScrollAttribute Ark_ScrollAttribute;
typedef struct Opt_ScrollAttribute Opt_ScrollAttribute;
typedef struct ScrollerPeer ScrollerPeer;
typedef struct ScrollerPeer* Ark_Scroller;
typedef struct Opt_Scroller Opt_Scroller;
typedef struct Ark_SearchAttribute Ark_SearchAttribute;
typedef struct Opt_SearchAttribute Opt_SearchAttribute;
typedef struct SearchControllerPeer SearchControllerPeer;
typedef struct SearchControllerPeer* Ark_SearchController;
typedef struct Opt_SearchController Opt_SearchController;
typedef struct Ark_SelectAttribute Ark_SelectAttribute;
typedef struct Opt_SelectAttribute Opt_SelectAttribute;
typedef struct Ark_SideBarContainerAttribute Ark_SideBarContainerAttribute;
typedef struct Opt_SideBarContainerAttribute Opt_SideBarContainerAttribute;
typedef struct Ark_Size Ark_Size;
typedef struct Opt_Size Opt_Size;
typedef struct Ark_SizeResult Ark_SizeResult;
typedef struct Opt_SizeResult Opt_SizeResult;
typedef struct Ark_SliderAttribute Ark_SliderAttribute;
typedef struct Opt_SliderAttribute Opt_SliderAttribute;
typedef struct Ark_SpanAttribute Ark_SpanAttribute;
typedef struct Opt_SpanAttribute Opt_SpanAttribute;
typedef struct Ark_StackAttribute Ark_StackAttribute;
typedef struct Opt_StackAttribute Opt_StackAttribute;
typedef struct Opt_String Opt_String;
typedef struct Ark_StringInterfaceDTS Ark_StringInterfaceDTS;
typedef struct Opt_StringInterfaceDTS Opt_StringInterfaceDTS;
typedef struct StyledStringPeer StyledStringPeer;
typedef struct StyledStringPeer* Ark_StyledString;
typedef struct Opt_StyledString Opt_StyledString;
typedef struct StyledStringControllerPeer StyledStringControllerPeer;
typedef struct StyledStringControllerPeer* Ark_StyledStringController;
typedef struct Opt_StyledStringController Opt_StyledStringController;
typedef struct SubmitEventPeer SubmitEventPeer;
typedef struct SubmitEventPeer* Ark_SubmitEvent;
typedef struct Opt_SubmitEvent Opt_SubmitEvent;
typedef struct SwipeGestureInterfacePeer SwipeGestureInterfacePeer;
typedef struct SwipeGestureInterfacePeer* Ark_SwipeGestureInterface;
typedef struct Opt_SwipeGestureInterface Opt_SwipeGestureInterface;
typedef struct Ark_SwiperAnimationEvent Ark_SwiperAnimationEvent;
typedef struct Opt_SwiperAnimationEvent Opt_SwiperAnimationEvent;
typedef struct Ark_SwiperAttribute Ark_SwiperAttribute;
typedef struct Opt_SwiperAttribute Opt_SwiperAttribute;
typedef struct SwiperContentTransitionProxyPeer SwiperContentTransitionProxyPeer;
typedef struct SwiperContentTransitionProxyPeer* Ark_SwiperContentTransitionProxy;
typedef struct Opt_SwiperContentTransitionProxy Opt_SwiperContentTransitionProxy;
typedef struct SwiperControllerPeer SwiperControllerPeer;
typedef struct SwiperControllerPeer* Ark_SwiperController;
typedef struct Opt_SwiperController Opt_SwiperController;
typedef struct Ark_SymbolEffect Ark_SymbolEffect;
typedef struct Opt_SymbolEffect Opt_SymbolEffect;
typedef struct Ark_SymbolGlyphAttribute Ark_SymbolGlyphAttribute;
typedef struct Opt_SymbolGlyphAttribute Opt_SymbolGlyphAttribute;
typedef struct Ark_TabContentAttribute Ark_TabContentAttribute;
typedef struct Opt_TabContentAttribute Opt_TabContentAttribute;
typedef struct Ark_TabsAttribute Ark_TabsAttribute;
typedef struct Opt_TabsAttribute Opt_TabsAttribute;
typedef struct TabsControllerPeer TabsControllerPeer;
typedef struct TabsControllerPeer* Ark_TabsController;
typedef struct Opt_TabsController Opt_TabsController;
typedef struct TapGestureInterfacePeer TapGestureInterfacePeer;
typedef struct TapGestureInterfacePeer* Ark_TapGestureInterface;
typedef struct Opt_TapGestureInterface Opt_TapGestureInterface;
typedef struct Ark_Test1Attribute Ark_Test1Attribute;
typedef struct Opt_Test1Attribute Opt_Test1Attribute;
typedef struct Ark_TextAttribute Ark_TextAttribute;
typedef struct Opt_TextAttribute Opt_TextAttribute;
typedef struct TextBaseControllerPeer TextBaseControllerPeer;
typedef struct TextBaseControllerPeer* Ark_TextBaseController;
typedef struct Opt_TextBaseController Opt_TextBaseController;
typedef struct TextContentControllerBasePeer TextContentControllerBasePeer;
typedef struct TextContentControllerBasePeer* Ark_TextContentControllerBase;
typedef struct Opt_TextContentControllerBase Opt_TextContentControllerBase;
typedef struct TextControllerPeer TextControllerPeer;
typedef struct TextControllerPeer* Ark_TextController;
typedef struct Opt_TextController Opt_TextController;
typedef struct TextEditControllerExPeer TextEditControllerExPeer;
typedef struct TextEditControllerExPeer* Ark_TextEditControllerEx;
typedef struct Opt_TextEditControllerEx Opt_TextEditControllerEx;
typedef struct Ark_TextInputAttribute Ark_TextInputAttribute;
typedef struct Opt_TextInputAttribute Opt_TextInputAttribute;
typedef struct TextInputControllerPeer TextInputControllerPeer;
typedef struct TextInputControllerPeer* Ark_TextInputController;
typedef struct Opt_TextInputController Opt_TextInputController;
typedef struct TextMenuItemIdPeer TextMenuItemIdPeer;
typedef struct TextMenuItemIdPeer* Ark_TextMenuItemId;
typedef struct Opt_TextMenuItemId Opt_TextMenuItemId;
typedef struct Ark_TextOptions Ark_TextOptions;
typedef struct Opt_TextOptions Opt_TextOptions;
typedef struct Ark_TextOverflowOptions Ark_TextOverflowOptions;
typedef struct Opt_TextOverflowOptions Opt_TextOverflowOptions;
typedef struct Ark_TextPickerAttribute Ark_TextPickerAttribute;
typedef struct Opt_TextPickerAttribute Opt_TextPickerAttribute;
typedef struct Ark_TouchTestInfo Ark_TouchTestInfo;
typedef struct Opt_TouchTestInfo Opt_TouchTestInfo;
typedef struct TransitionEffectPeer TransitionEffectPeer;
typedef struct TransitionEffectPeer* Ark_TransitionEffect;
typedef struct Opt_TransitionEffect Opt_TransitionEffect;
typedef struct Ark_TranslateResult Ark_TranslateResult;
typedef struct Opt_TranslateResult Opt_TranslateResult;
typedef struct Ark_Tuple_Number_Boolean Ark_Tuple_Number_Boolean;
typedef struct Opt_Tuple_Number_Boolean Opt_Tuple_Number_Boolean;
typedef struct Ark_Tuple_Number_Number Ark_Tuple_Number_Number;
typedef struct Opt_Tuple_Number_Number Opt_Tuple_Number_Number;
typedef struct Ark_Tuple_Number_String_Boolean_EnumDTS Ark_Tuple_Number_String_Boolean_EnumDTS;
typedef struct Opt_Tuple_Number_String_Boolean_EnumDTS Opt_Tuple_Number_String_Boolean_EnumDTS;
typedef struct Ark_Tuple_Number_String_EnumDTS Ark_Tuple_Number_String_EnumDTS;
typedef struct Opt_Tuple_Number_String_EnumDTS Opt_Tuple_Number_String_EnumDTS;
typedef struct Ark_TupleInterfaceDTS Ark_TupleInterfaceDTS;
typedef struct Opt_TupleInterfaceDTS Opt_TupleInterfaceDTS;
typedef struct Ark_Type_ImageAttribute_onComplete_callback_event Ark_Type_ImageAttribute_onComplete_callback_event;
typedef struct Opt_Type_ImageAttribute_onComplete_callback_event Opt_Type_ImageAttribute_onComplete_callback_event;
typedef struct UICommonEventPeer UICommonEventPeer;
typedef struct UICommonEventPeer* Ark_UICommonEvent;
typedef struct Opt_UICommonEvent Opt_UICommonEvent;
typedef struct UIExtensionProxyPeer UIExtensionProxyPeer;
typedef struct UIExtensionProxyPeer* Ark_UIExtensionProxy;
typedef struct Opt_UIExtensionProxy Opt_UIExtensionProxy;
typedef struct Ark_UIGestureEvent Ark_UIGestureEvent;
typedef struct Opt_UIGestureEvent Opt_UIGestureEvent;
typedef struct Opt_Undefined Opt_Undefined;
typedef struct Ark_Union_BlendMode_Blender Ark_Union_BlendMode_Blender;
typedef struct Opt_Union_BlendMode_Blender Opt_Union_BlendMode_Blender;
typedef struct Ark_Union_Boolean_EditMode Ark_Union_Boolean_EditMode;
typedef struct Opt_Union_Boolean_EditMode Opt_Union_Boolean_EditMode;
typedef struct Ark_Union_Boolean_EnumDTS Ark_Union_Boolean_EnumDTS;
typedef struct Opt_Union_Boolean_EnumDTS Opt_Union_Boolean_EnumDTS;
typedef struct Ark_Union_Boolean_Number Ark_Union_Boolean_Number;
typedef struct Opt_Union_Boolean_Number Opt_Union_Boolean_Number;
typedef struct Ark_Union_Boolean_Resource Ark_Union_Boolean_Resource;
typedef struct Opt_Union_Boolean_Resource Opt_Union_Boolean_Resource;
typedef struct Ark_Union_Boolean_String Ark_Union_Boolean_String;
typedef struct Opt_Union_Boolean_String Opt_Union_Boolean_String;
typedef struct Ark_Union_Boolean_String_Number Ark_Union_Boolean_String_Number;
typedef struct Opt_Union_Boolean_String_Number Opt_Union_Boolean_String_Number;
typedef struct Ark_Union_CircleShape_EllipseShape_PathShape_RectShape Ark_Union_CircleShape_EllipseShape_PathShape_RectShape;
typedef struct Opt_Union_CircleShape_EllipseShape_PathShape_RectShape Opt_Union_CircleShape_EllipseShape_PathShape_RectShape;
typedef struct Ark_Union_Color_Number Ark_Union_Color_Number;
typedef struct Opt_Union_Color_Number Opt_Union_Color_Number;
typedef struct Ark_Union_Color_Number_String Ark_Union_Color_Number_String;
typedef struct Opt_Union_Color_Number_String Opt_Union_Color_Number_String;
typedef struct Ark_Union_Color_String_Resource Ark_Union_Color_String_Resource;
typedef struct Opt_Union_Color_String_Resource Opt_Union_Color_String_Resource;
typedef struct Ark_Union_Color_String_Resource_ColoringStrategy Ark_Union_Color_String_Resource_ColoringStrategy;
typedef struct Opt_Union_Color_String_Resource_ColoringStrategy Opt_Union_Color_String_Resource_ColoringStrategy;
typedef struct Ark_Union_Color_String_Resource_Number Ark_Union_Color_String_Resource_Number;
typedef struct Opt_Union_Color_String_Resource_Number Opt_Union_Color_String_Resource_Number;
typedef struct Ark_Union_ColorFilter_DrawingColorFilter Ark_Union_ColorFilter_DrawingColorFilter;
typedef struct Opt_Union_ColorFilter_DrawingColorFilter Opt_Union_ColorFilter_DrawingColorFilter;
typedef struct Ark_Union_ContentClipMode_RectShape Ark_Union_ContentClipMode_RectShape;
typedef struct Opt_Union_ContentClipMode_RectShape Opt_Union_ContentClipMode_RectShape;
typedef struct Ark_Union_Curve_ICurve Ark_Union_Curve_ICurve;
typedef struct Opt_Union_Curve_ICurve Opt_Union_Curve_ICurve;
typedef struct Ark_Union_Curve_String_ICurve Ark_Union_Curve_String_ICurve;
typedef struct Opt_Union_Curve_String_ICurve Opt_Union_Curve_String_ICurve;
typedef struct Ark_Union_FontWeight_Number_String Ark_Union_FontWeight_Number_String;
typedef struct Opt_Union_FontWeight_Number_String Opt_Union_FontWeight_Number_String;
typedef struct Ark_Union_Number_Boolean Ark_Union_Number_Boolean;
typedef struct Opt_Union_Number_Boolean Opt_Union_Number_Boolean;
typedef struct Ark_Union_Number_EnumDTS Ark_Union_Number_EnumDTS;
typedef struct Opt_Union_Number_EnumDTS Opt_Union_Number_EnumDTS;
typedef struct Ark_Union_Number_FontStyle Ark_Union_Number_FontStyle;
typedef struct Opt_Union_Number_FontStyle Opt_Union_Number_FontStyle;
typedef struct Ark_Union_Number_FontWeight_String Ark_Union_Number_FontWeight_String;
typedef struct Opt_Union_Number_FontWeight_String Opt_Union_Number_FontWeight_String;
typedef struct Ark_Union_Number_Resource Ark_Union_Number_Resource;
typedef struct Opt_Union_Number_Resource Opt_Union_Number_Resource;
typedef struct Ark_Union_Number_String Ark_Union_Number_String;
typedef struct Opt_Union_Number_String Opt_Union_Number_String;
typedef struct Ark_Union_Number_String_FontWeight Ark_Union_Number_String_FontWeight;
typedef struct Opt_Union_Number_String_FontWeight Opt_Union_Number_String_FontWeight;
typedef struct Ark_Union_Number_String_Resource Ark_Union_Number_String_Resource;
typedef struct Opt_Union_Number_String_Resource Opt_Union_Number_String_Resource;
typedef struct Ark_Union_Number_TextCase Ark_Union_Number_TextCase;
typedef struct Opt_Union_Number_TextCase Opt_Union_Number_TextCase;
typedef struct Ark_Union_Number_TextOverflow Ark_Union_Number_TextOverflow;
typedef struct Opt_Union_Number_TextOverflow Opt_Union_Number_TextOverflow;
typedef struct Ark_Union_Resource_String Ark_Union_Resource_String;
typedef struct Opt_Union_Resource_String Opt_Union_Resource_String;
typedef struct Ark_Union_ResponseType_RichEditorResponseType Ark_Union_ResponseType_RichEditorResponseType;
typedef struct Opt_Union_ResponseType_RichEditorResponseType Opt_Union_ResponseType_RichEditorResponseType;
typedef struct Ark_Union_String_EnumDTS_Boolean Ark_Union_String_EnumDTS_Boolean;
typedef struct Opt_Union_String_EnumDTS_Boolean Opt_Union_String_EnumDTS_Boolean;
typedef struct Ark_Union_String_FunctionKey Ark_Union_String_FunctionKey;
typedef struct Opt_Union_String_FunctionKey Opt_Union_String_FunctionKey;
typedef struct Ark_Union_String_Number Ark_Union_String_Number;
typedef struct Opt_Union_String_Number Opt_Union_String_Number;
typedef struct Ark_Union_String_Number_CanvasGradient_CanvasPattern Ark_Union_String_Number_CanvasGradient_CanvasPattern;
typedef struct Opt_Union_String_Number_CanvasGradient_CanvasPattern Opt_Union_String_Number_CanvasGradient_CanvasPattern;
typedef struct Ark_Union_String_Number_Resource Ark_Union_String_Number_Resource;
typedef struct Opt_Union_String_Number_Resource Opt_Union_String_Number_Resource;
typedef struct Ark_Union_String_Number_Resource_Buffer Ark_Union_String_Number_Resource_Buffer;
typedef struct Opt_Union_String_Number_Resource_Buffer Opt_Union_String_Number_Resource_Buffer;
typedef struct Ark_Union_String_PixelMap_Resource_SymbolGlyphModifier Ark_Union_String_PixelMap_Resource_SymbolGlyphModifier;
typedef struct Opt_Union_String_PixelMap_Resource_SymbolGlyphModifier Opt_Union_String_PixelMap_Resource_SymbolGlyphModifier;
typedef struct Ark_Union_String_Resource Ark_Union_String_Resource;
typedef struct Opt_Union_String_Resource Opt_Union_String_Resource;
typedef struct Ark_Union_String_Resource_ComponentContent Ark_Union_String_Resource_ComponentContent;
typedef struct Opt_Union_String_Resource_ComponentContent Opt_Union_String_Resource_ComponentContent;
typedef struct Ark_Union_String_Resource_PixelMap Ark_Union_String_Resource_PixelMap;
typedef struct Opt_Union_String_Resource_PixelMap Opt_Union_String_Resource_PixelMap;
typedef struct Ark_Union_TextInputStyle_TextContentStyle Ark_Union_TextInputStyle_TextContentStyle;
typedef struct Opt_Union_TextInputStyle_TextContentStyle Opt_Union_TextInputStyle_TextContentStyle;
typedef struct Ark_UnionInterfaceDTS Ark_UnionInterfaceDTS;
typedef struct Opt_UnionInterfaceDTS Opt_UnionInterfaceDTS;
typedef struct UrlStylePeer UrlStylePeer;
typedef struct UrlStylePeer* Ark_UrlStyle;
typedef struct Opt_UrlStyle Opt_UrlStyle;
typedef struct Ark_UserDataSpan Ark_UserDataSpan;
typedef struct Opt_UserDataSpan Opt_UserDataSpan;
typedef struct Ark_Vector1 Ark_Vector1;
typedef struct Opt_Vector1 Opt_Vector1;
typedef struct Ark_Vector2 Ark_Vector2;
typedef struct Opt_Vector2 Opt_Vector2;
typedef struct Ark_VectorAttribute Ark_VectorAttribute;
typedef struct Opt_VectorAttribute Opt_VectorAttribute;
typedef struct ViewPeer ViewPeer;
typedef struct ViewPeer* Ark_View;
typedef struct Opt_View Opt_View;
typedef struct Ark_VP Ark_VP;
typedef struct Opt_VP Opt_VP;
typedef struct Ark_WebAttribute Ark_WebAttribute;
typedef struct Opt_WebAttribute Opt_WebAttribute;
typedef struct WebResourceResponsePeer WebResourceResponsePeer;
typedef struct WebResourceResponsePeer* Ark_WebResourceResponse;
typedef struct Opt_WebResourceResponse Opt_WebResourceResponse;
typedef struct Ark_WorkerEventListener Ark_WorkerEventListener;
typedef struct Opt_WorkerEventListener Opt_WorkerEventListener;
typedef struct Array_AlertDialogButtonOptions Array_AlertDialogButtonOptions;
typedef struct Opt_Array_AlertDialogButtonOptions Opt_Array_AlertDialogButtonOptions;
typedef struct Array_Array_String Array_Array_String;
typedef struct Opt_Array_Array_String Opt_Array_Array_String;
typedef struct Array_Boolean Array_Boolean;
typedef struct Opt_Array_Boolean Opt_Array_Boolean;
typedef struct Array_BooleanInterfaceDTS Array_BooleanInterfaceDTS;
typedef struct Opt_Array_BooleanInterfaceDTS Opt_Array_BooleanInterfaceDTS;
typedef struct Array_Buffer Array_Buffer;
typedef struct Opt_Array_Buffer Opt_Array_Buffer;
typedef struct Array_ColorStop Array_ColorStop;
typedef struct Opt_Array_ColorStop Opt_Array_ColorStop;
typedef struct Array_CustomObject Array_CustomObject;
typedef struct Opt_Array_CustomObject Opt_Array_CustomObject;
typedef struct Array_Dimension Array_Dimension;
typedef struct Opt_Array_Dimension Opt_Array_Dimension;
typedef struct Array_DragPreviewMode Array_DragPreviewMode;
typedef struct Opt_Array_DragPreviewMode Opt_Array_DragPreviewMode;
typedef struct Array_EnumDTS Array_EnumDTS;
typedef struct Opt_Array_EnumDTS Opt_Array_EnumDTS;
typedef struct Array_FingerInfo Array_FingerInfo;
typedef struct Opt_Array_FingerInfo Opt_Array_FingerInfo;
typedef struct Array_FractionStop Array_FractionStop;
typedef struct Opt_Array_FractionStop Opt_Array_FractionStop;
typedef struct Array_GestureRecognizer Array_GestureRecognizer;
typedef struct Opt_Array_GestureRecognizer Opt_Array_GestureRecognizer;
typedef struct Array_GestureType Array_GestureType;
typedef struct Opt_Array_GestureType Opt_Array_GestureType;
typedef struct Array_HistoricalPoint Array_HistoricalPoint;
typedef struct Opt_Array_HistoricalPoint Opt_Array_HistoricalPoint;
typedef struct Array_ImageAnalyzerType Array_ImageAnalyzerType;
typedef struct Opt_Array_ImageAnalyzerType Opt_Array_ImageAnalyzerType;
typedef struct Array_Layoutable Array_Layoutable;
typedef struct Opt_Array_Layoutable Opt_Array_Layoutable;
typedef struct Array_LayoutSafeAreaEdge Array_LayoutSafeAreaEdge;
typedef struct Opt_Array_LayoutSafeAreaEdge Opt_Array_LayoutSafeAreaEdge;
typedef struct Array_LayoutSafeAreaType Array_LayoutSafeAreaType;
typedef struct Opt_Array_LayoutSafeAreaType Opt_Array_LayoutSafeAreaType;
typedef struct Array_Length Array_Length;
typedef struct Opt_Array_Length Opt_Array_Length;
typedef struct Array_Measurable Array_Measurable;
typedef struct Opt_Array_Measurable Opt_Array_Measurable;
typedef struct Array_MenuElement Array_MenuElement;
typedef struct Opt_Array_MenuElement Opt_Array_MenuElement;
typedef struct Array_ModifierKey Array_ModifierKey;
typedef struct Opt_Array_ModifierKey Opt_Array_ModifierKey;
typedef struct Array_NavigationMenuItem Array_NavigationMenuItem;
typedef struct Opt_Array_NavigationMenuItem Opt_Array_NavigationMenuItem;
typedef struct Array_Number Array_Number;
typedef struct Opt_Array_Number Opt_Array_Number;
typedef struct Array_Object Array_Object;
typedef struct Opt_Array_Object Opt_Array_Object;
typedef struct Array_ObscuredReasons Array_ObscuredReasons;
typedef struct Opt_Array_ObscuredReasons Opt_Array_ObscuredReasons;
typedef struct Array_Rectangle Array_Rectangle;
typedef struct Opt_Array_Rectangle Opt_Array_Rectangle;
typedef struct Array_ResourceColor Array_ResourceColor;
typedef struct Opt_Array_ResourceColor Opt_Array_ResourceColor;
typedef struct Array_RichEditorImageSpanResult Array_RichEditorImageSpanResult;
typedef struct Opt_Array_RichEditorImageSpanResult Opt_Array_RichEditorImageSpanResult;
typedef struct Array_RichEditorParagraphResult Array_RichEditorParagraphResult;
typedef struct Opt_Array_RichEditorParagraphResult Opt_Array_RichEditorParagraphResult;
typedef struct Array_RichEditorTextSpanResult Array_RichEditorTextSpanResult;
typedef struct Opt_Array_RichEditorTextSpanResult Opt_Array_RichEditorTextSpanResult;
typedef struct Array_SafeAreaEdge Array_SafeAreaEdge;
typedef struct Opt_Array_SafeAreaEdge Opt_Array_SafeAreaEdge;
typedef struct Array_SafeAreaType Array_SafeAreaType;
typedef struct Opt_Array_SafeAreaType Opt_Array_SafeAreaType;
typedef struct Array_SelectOption Array_SelectOption;
typedef struct Opt_Array_SelectOption Opt_Array_SelectOption;
typedef struct Array_ShadowOptions Array_ShadowOptions;
typedef struct Opt_Array_ShadowOptions Opt_Array_ShadowOptions;
typedef struct Array_SpanStyle Array_SpanStyle;
typedef struct Opt_Array_SpanStyle Opt_Array_SpanStyle;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Array_StyleOptions Array_StyleOptions;
typedef struct Opt_Array_StyleOptions Opt_Array_StyleOptions;
typedef struct Array_TextCascadePickerRangeContent Array_TextCascadePickerRangeContent;
typedef struct Opt_Array_TextCascadePickerRangeContent Opt_Array_TextCascadePickerRangeContent;
typedef struct Array_TextDataDetectorType Array_TextDataDetectorType;
typedef struct Opt_Array_TextDataDetectorType Opt_Array_TextDataDetectorType;
typedef struct Array_TextMenuItem Array_TextMenuItem;
typedef struct Opt_Array_TextMenuItem Opt_Array_TextMenuItem;
typedef struct Array_TextPickerRangeContent Array_TextPickerRangeContent;
typedef struct Opt_Array_TextPickerRangeContent Opt_Array_TextPickerRangeContent;
typedef struct Array_ToolbarItem Array_ToolbarItem;
typedef struct Opt_Array_ToolbarItem Opt_Array_ToolbarItem;
typedef struct Array_TouchObject Array_TouchObject;
typedef struct Opt_Array_TouchObject Opt_Array_TouchObject;
typedef struct Array_TouchTestInfo Array_TouchTestInfo;
typedef struct Opt_Array_TouchTestInfo Opt_Array_TouchTestInfo;
typedef struct Array_Tuple_ResourceColor_Number Array_Tuple_ResourceColor_Number;
typedef struct Opt_Array_Tuple_ResourceColor_Number Opt_Array_Tuple_ResourceColor_Number;
typedef struct Array_Union_Color_Number Array_Union_Color_Number;
typedef struct Opt_Array_Union_Color_Number Opt_Array_Union_Color_Number;
typedef struct Array_Union_Number_String Array_Union_Number_String;
typedef struct Opt_Array_Union_Number_String Opt_Array_Union_Number_String;
typedef struct Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Opt_Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult Opt_Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef struct Opt_Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult Opt_Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef struct AsyncCallback_Array_TextMenuItem_Array_TextMenuItem AsyncCallback_Array_TextMenuItem_Array_TextMenuItem;
typedef struct Opt_AsyncCallback_Array_TextMenuItem_Array_TextMenuItem Opt_AsyncCallback_Array_TextMenuItem_Array_TextMenuItem;
typedef struct AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics;
typedef struct Opt_AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics Opt_AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics;
typedef struct AsyncCallback_image_PixelMap_Void AsyncCallback_image_PixelMap_Void;
typedef struct Opt_AsyncCallback_image_PixelMap_Void Opt_AsyncCallback_image_PixelMap_Void;
typedef struct AsyncCallback_TextMenuItem_TextRange_Boolean AsyncCallback_TextMenuItem_TextRange_Boolean;
typedef struct Opt_AsyncCallback_TextMenuItem_TextRange_Boolean Opt_AsyncCallback_TextMenuItem_TextRange_Boolean;
typedef struct ButtonTriggerClickCallback ButtonTriggerClickCallback;
typedef struct Opt_ButtonTriggerClickCallback Opt_ButtonTriggerClickCallback;
typedef struct Callback_Area_Area_Void Callback_Area_Area_Void;
typedef struct Opt_Callback_Area_Area_Void Opt_Callback_Area_Area_Void;
typedef struct Callback_Array_TextMenuItem_Void Callback_Array_TextMenuItem_Void;
typedef struct Opt_Callback_Array_TextMenuItem_Void Opt_Callback_Array_TextMenuItem_Void;
typedef struct Callback_Array_TouchTestInfo_TouchResult Callback_Array_TouchTestInfo_TouchResult;
typedef struct Opt_Callback_Array_TouchTestInfo_TouchResult Opt_Callback_Array_TouchTestInfo_TouchResult;
typedef struct Callback_Boolean Callback_Boolean;
typedef struct Opt_Callback_Boolean Opt_Callback_Boolean;
typedef struct Callback_Boolean_HoverEvent_Void Callback_Boolean_HoverEvent_Void;
typedef struct Opt_Callback_Boolean_HoverEvent_Void Opt_Callback_Boolean_HoverEvent_Void;
typedef struct Callback_Boolean_Void Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void Opt_Callback_Boolean_Void;
typedef struct Callback_ClickEvent_Void Callback_ClickEvent_Void;
typedef struct Opt_Callback_ClickEvent_Void Opt_Callback_ClickEvent_Void;
typedef struct Callback_CopyEvent_Void Callback_CopyEvent_Void;
typedef struct Opt_Callback_CopyEvent_Void Opt_Callback_CopyEvent_Void;
typedef struct Callback_CreateItem Callback_CreateItem;
typedef struct Opt_Callback_CreateItem Opt_Callback_CreateItem;
typedef struct Callback_CustomBuilder_Void Callback_CustomBuilder_Void;
typedef struct Opt_Callback_CustomBuilder_Void Opt_Callback_CustomBuilder_Void;
typedef struct Callback_CustomSpanMetrics_Void Callback_CustomSpanMetrics_Void;
typedef struct Opt_Callback_CustomSpanMetrics_Void Opt_Callback_CustomSpanMetrics_Void;
typedef struct Callback_CutEvent_Void Callback_CutEvent_Void;
typedef struct Opt_Callback_CutEvent_Void Opt_Callback_CutEvent_Void;
typedef struct Callback_DeleteValue_Boolean Callback_DeleteValue_Boolean;
typedef struct Opt_Callback_DeleteValue_Boolean Opt_Callback_DeleteValue_Boolean;
typedef struct Callback_DeleteValue_Void Callback_DeleteValue_Void;
typedef struct Opt_Callback_DeleteValue_Void Opt_Callback_DeleteValue_Void;
typedef struct Callback_DismissContentCoverAction_Void Callback_DismissContentCoverAction_Void;
typedef struct Opt_Callback_DismissContentCoverAction_Void Opt_Callback_DismissContentCoverAction_Void;
typedef struct Callback_DismissDialogAction_Void Callback_DismissDialogAction_Void;
typedef struct Opt_Callback_DismissDialogAction_Void Opt_Callback_DismissDialogAction_Void;
typedef struct Callback_DismissPopupAction_Void Callback_DismissPopupAction_Void;
typedef struct Opt_Callback_DismissPopupAction_Void Opt_Callback_DismissPopupAction_Void;
typedef struct Callback_DismissSheetAction_Void Callback_DismissSheetAction_Void;
typedef struct Opt_Callback_DismissSheetAction_Void Opt_Callback_DismissSheetAction_Void;
typedef struct Callback_DragEvent_Opt_String_Void Callback_DragEvent_Opt_String_Void;
typedef struct Opt_Callback_DragEvent_Opt_String_Void Opt_Callback_DragEvent_Opt_String_Void;
typedef struct Callback_DrawContext_CustomSpanDrawInfo_Void Callback_DrawContext_CustomSpanDrawInfo_Void;
typedef struct Opt_Callback_DrawContext_CustomSpanDrawInfo_Void Opt_Callback_DrawContext_CustomSpanDrawInfo_Void;
typedef struct Callback_DrawContext_Void Callback_DrawContext_Void;
typedef struct Opt_Callback_DrawContext_Void Opt_Callback_DrawContext_Void;
typedef struct Callback_Extender_OnFinish Callback_Extender_OnFinish;
typedef struct Opt_Callback_Extender_OnFinish Opt_Callback_Extender_OnFinish;
typedef struct Callback_Extender_OnProgress Callback_Extender_OnProgress;
typedef struct Opt_Callback_Extender_OnProgress Opt_Callback_Extender_OnProgress;
typedef struct Callback_FormCallbackInfo_Void Callback_FormCallbackInfo_Void;
typedef struct Opt_Callback_FormCallbackInfo_Void Opt_Callback_FormCallbackInfo_Void;
typedef struct Callback_GestureEvent_Void Callback_GestureEvent_Void;
typedef struct Opt_Callback_GestureEvent_Void Opt_Callback_GestureEvent_Void;
typedef struct Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult;
typedef struct Opt_Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult Opt_Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult;
typedef struct Callback_GestureJudgeResult_Void Callback_GestureJudgeResult_Void;
typedef struct Opt_Callback_GestureJudgeResult_Void Opt_Callback_GestureJudgeResult_Void;
typedef struct Callback_GestureRecognizer_Void Callback_GestureRecognizer_Void;
typedef struct Opt_Callback_GestureRecognizer_Void Opt_Callback_GestureRecognizer_Void;
typedef struct Callback_HitTestMode_Void Callback_HitTestMode_Void;
typedef struct Opt_Callback_HitTestMode_Void Opt_Callback_HitTestMode_Void;
typedef struct Callback_InsertValue_Boolean Callback_InsertValue_Boolean;
typedef struct Opt_Callback_InsertValue_Boolean Opt_Callback_InsertValue_Boolean;
typedef struct Callback_InsertValue_Void Callback_InsertValue_Void;
typedef struct Opt_Callback_InsertValue_Void Opt_Callback_InsertValue_Void;
typedef struct Callback_ItemDragInfo_Number_Number_Boolean_Void Callback_ItemDragInfo_Number_Number_Boolean_Void;
typedef struct Opt_Callback_ItemDragInfo_Number_Number_Boolean_Void Opt_Callback_ItemDragInfo_Number_Number_Boolean_Void;
typedef struct Callback_ItemDragInfo_Number_Number_Void Callback_ItemDragInfo_Number_Number_Void;
typedef struct Opt_Callback_ItemDragInfo_Number_Number_Void Opt_Callback_ItemDragInfo_Number_Number_Void;
typedef struct Callback_ItemDragInfo_Number_Void Callback_ItemDragInfo_Number_Void;
typedef struct Opt_Callback_ItemDragInfo_Number_Void Opt_Callback_ItemDragInfo_Number_Void;
typedef struct Callback_ItemDragInfo_Void Callback_ItemDragInfo_Void;
typedef struct Opt_Callback_ItemDragInfo_Void Opt_Callback_ItemDragInfo_Void;
typedef struct Callback_KeyEvent_Boolean Callback_KeyEvent_Boolean;
typedef struct Opt_Callback_KeyEvent_Boolean Opt_Callback_KeyEvent_Boolean;
typedef struct Callback_KeyEvent_Void Callback_KeyEvent_Void;
typedef struct Opt_Callback_KeyEvent_Void Opt_Callback_KeyEvent_Void;
typedef struct Callback_Literal_Boolean_isVisible_Void Callback_Literal_Boolean_isVisible_Void;
typedef struct Opt_Callback_Literal_Boolean_isVisible_Void Opt_Callback_Literal_Boolean_isVisible_Void;
typedef struct Callback_Literal_Number_offsetRemain_Void Callback_Literal_Number_offsetRemain_Void;
typedef struct Opt_Callback_Literal_Number_offsetRemain_Void Opt_Callback_Literal_Number_offsetRemain_Void;
typedef struct Callback_MouseEvent_Void Callback_MouseEvent_Void;
typedef struct Opt_Callback_MouseEvent_Void Opt_Callback_MouseEvent_Void;
typedef struct Callback_NativeEmbedDataInfo_Void Callback_NativeEmbedDataInfo_Void;
typedef struct Opt_Callback_NativeEmbedDataInfo_Void Opt_Callback_NativeEmbedDataInfo_Void;
typedef struct Callback_NavDestinationContext_Void Callback_NavDestinationContext_Void;
typedef struct Opt_Callback_NavDestinationContext_Void Opt_Callback_NavDestinationContext_Void;
typedef struct Callback_NavigationMode_Void Callback_NavigationMode_Void;
typedef struct Opt_Callback_NavigationMode_Void Opt_Callback_NavigationMode_Void;
typedef struct Callback_NavigationTitleMode_Void Callback_NavigationTitleMode_Void;
typedef struct Opt_Callback_NavigationTitleMode_Void Opt_Callback_NavigationTitleMode_Void;
typedef struct Callback_NavigationTransitionProxy_Void Callback_NavigationTransitionProxy_Void;
typedef struct Opt_Callback_NavigationTransitionProxy_Void Opt_Callback_NavigationTransitionProxy_Void;
typedef struct Callback_Number_Boolean Callback_Number_Boolean;
typedef struct Opt_Callback_Number_Boolean Opt_Callback_Number_Boolean;
typedef struct Callback_Number_Number_Boolean Callback_Number_Number_Boolean;
typedef struct Opt_Callback_Number_Number_Boolean Opt_Callback_Number_Number_Boolean;
typedef struct Callback_Number_Number_Number_Void Callback_Number_Number_Number_Void;
typedef struct Opt_Callback_Number_Number_Number_Void Opt_Callback_Number_Number_Number_Void;
typedef struct Callback_Number_Number_Void Callback_Number_Number_Void;
typedef struct Opt_Callback_Number_Number_Void Opt_Callback_Number_Number_Void;
typedef struct Callback_Number_Opt_Boolean Callback_Number_Opt_Boolean;
typedef struct Opt_Callback_Number_Opt_Boolean Opt_Callback_Number_Opt_Boolean;
typedef struct Callback_Number_ScrollState_Literal_Number_offsetRemain Callback_Number_ScrollState_Literal_Number_offsetRemain;
typedef struct Opt_Callback_Number_ScrollState_Literal_Number_offsetRemain Opt_Callback_Number_ScrollState_Literal_Number_offsetRemain;
typedef struct Callback_Number_Void Callback_Number_Void;
typedef struct Opt_Callback_Number_Void Opt_Callback_Number_Void;
typedef struct Callback_OffsetResult_Void Callback_OffsetResult_Void;
typedef struct Opt_Callback_OffsetResult_Void Opt_Callback_OffsetResult_Void;
typedef struct Callback_OnHttpErrorReceiveEvent_Void Callback_OnHttpErrorReceiveEvent_Void;
typedef struct Opt_Callback_OnHttpErrorReceiveEvent_Void Opt_Callback_OnHttpErrorReceiveEvent_Void;
typedef struct Callback_onMeasureSize_SizeResult Callback_onMeasureSize_SizeResult;
typedef struct Opt_Callback_onMeasureSize_SizeResult Opt_Callback_onMeasureSize_SizeResult;
typedef struct Callback_onPlaceChildren_Void Callback_onPlaceChildren_Void;
typedef struct Opt_Callback_onPlaceChildren_Void Opt_Callback_onPlaceChildren_Void;
typedef struct Callback_OnRenderExitedEvent_Void Callback_OnRenderExitedEvent_Void;
typedef struct Opt_Callback_OnRenderExitedEvent_Void Opt_Callback_OnRenderExitedEvent_Void;
typedef struct Callback_OnScrollFrameBeginHandlerResult_Void Callback_OnScrollFrameBeginHandlerResult_Void;
typedef struct Opt_Callback_OnScrollFrameBeginHandlerResult_Void Opt_Callback_OnScrollFrameBeginHandlerResult_Void;
typedef struct Callback_Opt_Array_String_Void Callback_Opt_Array_String_Void;
typedef struct Opt_Callback_Opt_Array_String_Void Opt_Callback_Opt_Array_String_Void;
typedef struct Callback_Opt_Boolean_Void Callback_Opt_Boolean_Void;
typedef struct Opt_Callback_Opt_Boolean_Void Opt_Callback_Opt_Boolean_Void;
typedef struct Callback_Opt_Literal_Object_detail_Boolean Callback_Opt_Literal_Object_detail_Boolean;
typedef struct Opt_Callback_Opt_Literal_Object_detail_Boolean Opt_Callback_Opt_Literal_Object_detail_Boolean;
typedef struct Callback_Opt_NavigationAnimatedTransition_Void Callback_Opt_NavigationAnimatedTransition_Void;
typedef struct Opt_Callback_Opt_NavigationAnimatedTransition_Void Opt_Callback_Opt_NavigationAnimatedTransition_Void;
typedef struct Callback_Opt_String_Opt_Array_String_Void Callback_Opt_String_Opt_Array_String_Void;
typedef struct Opt_Callback_Opt_String_Opt_Array_String_Void Opt_Callback_Opt_String_Opt_Array_String_Void;
typedef struct Callback_Opt_StyledString_Opt_Array_String_Void Callback_Opt_StyledString_Opt_Array_String_Void;
typedef struct Opt_Callback_Opt_StyledString_Opt_Array_String_Void Opt_Callback_Opt_StyledString_Opt_Array_String_Void;
typedef struct Callback_Pointer_Void Callback_Pointer_Void;
typedef struct Opt_Callback_Pointer_Void Opt_Callback_Pointer_Void;
typedef struct Callback_PopInfo_Void Callback_PopInfo_Void;
typedef struct Opt_Callback_PopInfo_Void Opt_Callback_PopInfo_Void;
typedef struct Callback_PreDragStatus_Void Callback_PreDragStatus_Void;
typedef struct Opt_Callback_PreDragStatus_Void Opt_Callback_PreDragStatus_Void;
typedef struct Callback_RangeUpdate Callback_RangeUpdate;
typedef struct Opt_Callback_RangeUpdate Opt_Callback_RangeUpdate;
typedef struct Callback_ResourceStr_Void Callback_ResourceStr_Void;
typedef struct Opt_Callback_ResourceStr_Void Opt_Callback_ResourceStr_Void;
typedef struct Callback_RichEditorChangeValue_Boolean Callback_RichEditorChangeValue_Boolean;
typedef struct Opt_Callback_RichEditorChangeValue_Boolean Opt_Callback_RichEditorChangeValue_Boolean;
typedef struct Callback_RichEditorDeleteValue_Boolean Callback_RichEditorDeleteValue_Boolean;
typedef struct Opt_Callback_RichEditorDeleteValue_Boolean Opt_Callback_RichEditorDeleteValue_Boolean;
typedef struct Callback_RichEditorInsertValue_Boolean Callback_RichEditorInsertValue_Boolean;
typedef struct Opt_Callback_RichEditorInsertValue_Boolean Opt_Callback_RichEditorInsertValue_Boolean;
typedef struct Callback_RichEditorRange_Void Callback_RichEditorRange_Void;
typedef struct Opt_Callback_RichEditorRange_Void Opt_Callback_RichEditorRange_Void;
typedef struct Callback_RichEditorSelection_Void Callback_RichEditorSelection_Void;
typedef struct Opt_Callback_RichEditorSelection_Void Opt_Callback_RichEditorSelection_Void;
typedef struct Callback_RichEditorTextSpanResult_Void Callback_RichEditorTextSpanResult_Void;
typedef struct Opt_Callback_RichEditorTextSpanResult_Void Opt_Callback_RichEditorTextSpanResult_Void;
typedef struct Callback_SheetDismiss_Void Callback_SheetDismiss_Void;
typedef struct Opt_Callback_SheetDismiss_Void Opt_Callback_SheetDismiss_Void;
typedef struct Callback_SheetType_Void Callback_SheetType_Void;
typedef struct Opt_Callback_SheetType_Void Opt_Callback_SheetType_Void;
typedef struct Callback_SizeResult_Void Callback_SizeResult_Void;
typedef struct Opt_Callback_SizeResult_Void Opt_Callback_SizeResult_Void;
typedef struct Callback_SpringBackAction_Void Callback_SpringBackAction_Void;
typedef struct Opt_Callback_SpringBackAction_Void Opt_Callback_SpringBackAction_Void;
typedef struct Callback_StateStylesChange Callback_StateStylesChange;
typedef struct Opt_Callback_StateStylesChange Opt_Callback_StateStylesChange;
typedef struct Callback_String_Number_Void Callback_String_Number_Void;
typedef struct Opt_Callback_String_Number_Void Opt_Callback_String_Number_Void;
typedef struct Callback_String_Unknown_Void Callback_String_Unknown_Void;
typedef struct Opt_Callback_String_Unknown_Void Opt_Callback_String_Unknown_Void;
typedef struct Callback_String_Void Callback_String_Void;
typedef struct Opt_Callback_String_Void Opt_Callback_String_Void;
typedef struct Callback_StyledStringChangeValue_Boolean Callback_StyledStringChangeValue_Boolean;
typedef struct Opt_Callback_StyledStringChangeValue_Boolean Opt_Callback_StyledStringChangeValue_Boolean;
typedef struct Callback_SwipeActionState_Void Callback_SwipeActionState_Void;
typedef struct Opt_Callback_SwipeActionState_Void Opt_Callback_SwipeActionState_Void;
typedef struct Callback_SwiperContentTransitionProxy_Void Callback_SwiperContentTransitionProxy_Void;
typedef struct Opt_Callback_SwiperContentTransitionProxy_Void Opt_Callback_SwiperContentTransitionProxy_Void;
typedef struct Callback_TerminationInfo_Void Callback_TerminationInfo_Void;
typedef struct Opt_Callback_TerminationInfo_Void Opt_Callback_TerminationInfo_Void;
typedef struct Callback_TextPickerResult_Void Callback_TextPickerResult_Void;
typedef struct Opt_Callback_TextPickerResult_Void Opt_Callback_TextPickerResult_Void;
typedef struct Callback_TextRange_Void Callback_TextRange_Void;
typedef struct Opt_Callback_TextRange_Void Opt_Callback_TextRange_Void;
typedef struct Callback_TouchEvent_HitTestMode Callback_TouchEvent_HitTestMode;
typedef struct Opt_Callback_TouchEvent_HitTestMode Opt_Callback_TouchEvent_HitTestMode;
typedef struct Callback_TouchEvent_Void Callback_TouchEvent_Void;
typedef struct Opt_Callback_TouchEvent_Void Opt_Callback_TouchEvent_Void;
typedef struct Callback_TouchResult_Void Callback_TouchResult_Void;
typedef struct Opt_Callback_TouchResult_Void Opt_Callback_TouchResult_Void;
typedef struct Callback_UIExtensionProxy_Void Callback_UIExtensionProxy_Void;
typedef struct Opt_Callback_UIExtensionProxy_Void Opt_Callback_UIExtensionProxy_Void;
typedef struct Callback_Union_CustomBuilder_DragItemInfo_Void Callback_Union_CustomBuilder_DragItemInfo_Void;
typedef struct Opt_Callback_Union_CustomBuilder_DragItemInfo_Void Opt_Callback_Union_CustomBuilder_DragItemInfo_Void;
typedef struct Callback_Union_Number_Array_Number_Void Callback_Union_Number_Array_Number_Void;
typedef struct Opt_Callback_Union_Number_Array_Number_Void Opt_Callback_Union_Number_Array_Number_Void;
typedef struct Callback_Union_String_Array_String_Void Callback_Union_String_Array_String_Void;
typedef struct Opt_Callback_Union_String_Array_String_Void Opt_Callback_Union_String_Array_String_Void;
typedef struct Callback_Void Callback_Void;
typedef struct Opt_Callback_Void Opt_Callback_Void;
typedef struct ContentDidScrollCallback ContentDidScrollCallback;
typedef struct Opt_ContentDidScrollCallback Opt_ContentDidScrollCallback;
typedef struct CustomNodeBuilder CustomNodeBuilder;
typedef struct Opt_CustomNodeBuilder Opt_CustomNodeBuilder;
typedef struct EditableTextOnChangeCallback EditableTextOnChangeCallback;
typedef struct Opt_EditableTextOnChangeCallback Opt_EditableTextOnChangeCallback;
typedef struct GestureRecognizerJudgeBeginCallback GestureRecognizerJudgeBeginCallback;
typedef struct Opt_GestureRecognizerJudgeBeginCallback Opt_GestureRecognizerJudgeBeginCallback;
typedef struct HoverCallback HoverCallback;
typedef struct Opt_HoverCallback Opt_HoverCallback;
typedef struct ImageErrorCallback ImageErrorCallback;
typedef struct Opt_ImageErrorCallback Opt_ImageErrorCallback;
typedef struct InterceptionModeCallback InterceptionModeCallback;
typedef struct Opt_InterceptionModeCallback Opt_InterceptionModeCallback;
typedef struct InterceptionShowCallback InterceptionShowCallback;
typedef struct Opt_InterceptionShowCallback Opt_InterceptionShowCallback;
typedef struct ListAttribute_onItemDragStart_event_type ListAttribute_onItemDragStart_event_type;
typedef struct Opt_ListAttribute_onItemDragStart_event_type Opt_ListAttribute_onItemDragStart_event_type;
typedef struct Map_String_Object Map_String_Object;
typedef struct Opt_Map_String_Object Opt_Map_String_Object;
typedef struct Map_String_String Map_String_String;
typedef struct Opt_Map_String_String Opt_Map_String_String;
typedef struct MenuOnAppearCallback MenuOnAppearCallback;
typedef struct Opt_MenuOnAppearCallback Opt_MenuOnAppearCallback;
typedef struct NavExtender_OnUpdateStack NavExtender_OnUpdateStack;
typedef struct Opt_NavExtender_OnUpdateStack Opt_NavExtender_OnUpdateStack;
typedef struct OnContentScrollCallback OnContentScrollCallback;
typedef struct Opt_OnContentScrollCallback Opt_OnContentScrollCallback;
typedef struct OnDidChangeCallback OnDidChangeCallback;
typedef struct Opt_OnDidChangeCallback Opt_OnDidChangeCallback;
typedef struct OnMoveHandler OnMoveHandler;
typedef struct Opt_OnMoveHandler Opt_OnMoveHandler;
typedef struct OnPasteCallback OnPasteCallback;
typedef struct Opt_OnPasteCallback Opt_OnPasteCallback;
typedef struct OnScrollCallback OnScrollCallback;
typedef struct Opt_OnScrollCallback Opt_OnScrollCallback;
typedef struct OnScrollEdgeCallback OnScrollEdgeCallback;
typedef struct Opt_OnScrollEdgeCallback Opt_OnScrollEdgeCallback;
typedef struct OnScrollFrameBeginCallback OnScrollFrameBeginCallback;
typedef struct Opt_OnScrollFrameBeginCallback Opt_OnScrollFrameBeginCallback;
typedef struct OnScrollVisibleContentChangeCallback OnScrollVisibleContentChangeCallback;
typedef struct Opt_OnScrollVisibleContentChangeCallback Opt_OnScrollVisibleContentChangeCallback;
typedef struct OnSubmitCallback OnSubmitCallback;
typedef struct Opt_OnSubmitCallback Opt_OnSubmitCallback;
typedef struct OnSwiperAnimationEndCallback OnSwiperAnimationEndCallback;
typedef struct Opt_OnSwiperAnimationEndCallback Opt_OnSwiperAnimationEndCallback;
typedef struct OnSwiperAnimationStartCallback OnSwiperAnimationStartCallback;
typedef struct Opt_OnSwiperAnimationStartCallback Opt_OnSwiperAnimationStartCallback;
typedef struct OnSwiperGestureSwipeCallback OnSwiperGestureSwipeCallback;
typedef struct Opt_OnSwiperGestureSwipeCallback Opt_OnSwiperGestureSwipeCallback;
typedef struct OnTextSelectionChangeCallback OnTextSelectionChangeCallback;
typedef struct Opt_OnTextSelectionChangeCallback Opt_OnTextSelectionChangeCallback;
typedef struct PasteEventCallback PasteEventCallback;
typedef struct Opt_PasteEventCallback Opt_PasteEventCallback;
typedef struct RestrictedWorker_onerror_Callback RestrictedWorker_onerror_Callback;
typedef struct Opt_RestrictedWorker_onerror_Callback Opt_RestrictedWorker_onerror_Callback;
typedef struct RestrictedWorker_onexit_Callback RestrictedWorker_onexit_Callback;
typedef struct Opt_RestrictedWorker_onexit_Callback Opt_RestrictedWorker_onexit_Callback;
typedef struct RestrictedWorker_onmessage_Callback RestrictedWorker_onmessage_Callback;
typedef struct Opt_RestrictedWorker_onmessage_Callback Opt_RestrictedWorker_onmessage_Callback;
typedef struct ScrollOnScrollCallback ScrollOnScrollCallback;
typedef struct Opt_ScrollOnScrollCallback Opt_ScrollOnScrollCallback;
typedef struct ScrollOnWillScrollCallback ScrollOnWillScrollCallback;
typedef struct Opt_ScrollOnWillScrollCallback Opt_ScrollOnWillScrollCallback;
typedef struct SearchSubmitCallback SearchSubmitCallback;
typedef struct Opt_SearchSubmitCallback Opt_SearchSubmitCallback;
typedef struct SearchValueCallback SearchValueCallback;
typedef struct Opt_SearchValueCallback Opt_SearchValueCallback;
typedef struct ShouldBuiltInRecognizerParallelWithCallback ShouldBuiltInRecognizerParallelWithCallback;
typedef struct Opt_ShouldBuiltInRecognizerParallelWithCallback Opt_ShouldBuiltInRecognizerParallelWithCallback;
typedef struct SizeChangeCallback SizeChangeCallback;
typedef struct Opt_SizeChangeCallback Opt_SizeChangeCallback;
typedef struct SubmitCallback SubmitCallback;
typedef struct Opt_SubmitCallback Opt_SubmitCallback;
typedef struct TextFieldValueCallback TextFieldValueCallback;
typedef struct Opt_TextFieldValueCallback Opt_TextFieldValueCallback;
typedef struct TextPickerScrollStopCallback TextPickerScrollStopCallback;
typedef struct Opt_TextPickerScrollStopCallback Opt_TextPickerScrollStopCallback;
typedef struct TransitionFinishCallback TransitionFinishCallback;
typedef struct Opt_TransitionFinishCallback Opt_TransitionFinishCallback;
typedef struct Type_CommonMethod_onDragStart_event Type_CommonMethod_onDragStart_event;
typedef struct Opt_Type_CommonMethod_onDragStart_event Opt_Type_CommonMethod_onDragStart_event;
typedef struct Type_ImageAttribute_onComplete_callback Type_ImageAttribute_onComplete_callback;
typedef struct Opt_Type_ImageAttribute_onComplete_callback Opt_Type_ImageAttribute_onComplete_callback;
typedef struct Type_NavigationAttribute_customNavContentTransition_delegate Type_NavigationAttribute_customNavContentTransition_delegate;
typedef struct Opt_Type_NavigationAttribute_customNavContentTransition_delegate Opt_Type_NavigationAttribute_customNavContentTransition_delegate;
typedef struct Type_TextPickerAttribute_onChange_callback Type_TextPickerAttribute_onChange_callback;
typedef struct Opt_Type_TextPickerAttribute_onChange_callback Opt_Type_TextPickerAttribute_onChange_callback;
typedef struct VisibleAreaChangeCallback VisibleAreaChangeCallback;
typedef struct Opt_VisibleAreaChangeCallback Opt_VisibleAreaChangeCallback;
typedef struct VoidCallback VoidCallback;
typedef struct Opt_VoidCallback Opt_VoidCallback;
typedef struct Ark_AccessibilityOptions Ark_AccessibilityOptions;
typedef struct Opt_AccessibilityOptions Opt_AccessibilityOptions;
typedef struct Ark_AnimationRange_Number Ark_AnimationRange_Number;
typedef struct Opt_AnimationRange_Number Opt_AnimationRange_Number;
typedef struct AppearSymbolEffectPeer AppearSymbolEffectPeer;
typedef struct AppearSymbolEffectPeer* Ark_AppearSymbolEffect;
typedef struct Opt_AppearSymbolEffect Opt_AppearSymbolEffect;
typedef struct Ark_ArrayRefNumberInterfaceDTS Ark_ArrayRefNumberInterfaceDTS;
typedef struct Opt_ArrayRefNumberInterfaceDTS Opt_ArrayRefNumberInterfaceDTS;
typedef struct Ark_BackgroundBrightnessOptions Ark_BackgroundBrightnessOptions;
typedef struct Opt_BackgroundBrightnessOptions Opt_BackgroundBrightnessOptions;
typedef struct BaseContextPeer BaseContextPeer;
typedef struct BaseContextPeer* Ark_BaseContext;
typedef struct Opt_BaseContext Opt_BaseContext;
typedef struct BaselineOffsetStylePeer BaselineOffsetStylePeer;
typedef struct BaselineOffsetStylePeer* Ark_BaselineOffsetStyle;
typedef struct Opt_BaselineOffsetStyle Opt_BaselineOffsetStyle;
typedef struct Ark_Bias Ark_Bias;
typedef struct Opt_Bias Opt_Bias;
typedef struct Ark_BlurOptions Ark_BlurOptions;
typedef struct Opt_BlurOptions Opt_BlurOptions;
typedef struct BounceSymbolEffectPeer BounceSymbolEffectPeer;
typedef struct BounceSymbolEffectPeer* Ark_BounceSymbolEffect;
typedef struct Opt_BounceSymbolEffect Opt_BounceSymbolEffect;
typedef struct Ark_ButtonOptions Ark_ButtonOptions;
typedef struct Opt_ButtonOptions Opt_ButtonOptions;
typedef struct Ark_CancelButtonSymbolOptions Ark_CancelButtonSymbolOptions;
typedef struct Opt_CancelButtonSymbolOptions Opt_CancelButtonSymbolOptions;
typedef struct CanvasRendererPeer CanvasRendererPeer;
typedef struct CanvasRendererPeer* Ark_CanvasRenderer;
typedef struct Opt_CanvasRenderer Opt_CanvasRenderer;
typedef struct CanvasRenderingContext2DPeer CanvasRenderingContext2DPeer;
typedef struct CanvasRenderingContext2DPeer* Ark_CanvasRenderingContext2D;
typedef struct Opt_CanvasRenderingContext2D Opt_CanvasRenderingContext2D;
typedef struct Ark_CaretOffset Ark_CaretOffset;
typedef struct Opt_CaretOffset Opt_CaretOffset;
typedef struct Ark_ChainWeightOptions Ark_ChainWeightOptions;
typedef struct Opt_ChainWeightOptions Opt_ChainWeightOptions;
typedef struct ChildrenMainSizePeer ChildrenMainSizePeer;
typedef struct ChildrenMainSizePeer* Ark_ChildrenMainSize;
typedef struct Opt_ChildrenMainSize Opt_ChildrenMainSize;
typedef struct Ark_CircleOptions Ark_CircleOptions;
typedef struct Opt_CircleOptions Opt_CircleOptions;
typedef struct ClassWithConstructorAndFieldsAndMethodsDTSPeer ClassWithConstructorAndFieldsAndMethodsDTSPeer;
typedef struct ClassWithConstructorAndFieldsAndMethodsDTSPeer* Ark_ClassWithConstructorAndFieldsAndMethodsDTS;
typedef struct Opt_ClassWithConstructorAndFieldsAndMethodsDTS Opt_ClassWithConstructorAndFieldsAndMethodsDTS;
typedef struct ClassWithConstructorAndFieldsDTSPeer ClassWithConstructorAndFieldsDTSPeer;
typedef struct ClassWithConstructorAndFieldsDTSPeer* Ark_ClassWithConstructorAndFieldsDTS;
typedef struct Opt_ClassWithConstructorAndFieldsDTS Opt_ClassWithConstructorAndFieldsDTS;
typedef struct Ark_ClickEffect Ark_ClickEffect;
typedef struct Opt_ClickEffect Opt_ClickEffect;
typedef struct Ark_CloseSwipeActionOptions Ark_CloseSwipeActionOptions;
typedef struct Opt_CloseSwipeActionOptions Opt_CloseSwipeActionOptions;
typedef struct Ark_ColumnOptions Ark_ColumnOptions;
typedef struct Opt_ColumnOptions Opt_ColumnOptions;
typedef struct ContextPeer ContextPeer;
typedef struct ContextPeer* Ark_Context;
typedef struct Opt_Context Opt_Context;
typedef struct Ark_CopyEvent Ark_CopyEvent;
typedef struct Opt_CopyEvent Opt_CopyEvent;
typedef struct Ark_CustomDialogBuildOptions Ark_CustomDialogBuildOptions;
typedef struct Opt_CustomDialogBuildOptions Opt_CustomDialogBuildOptions;
typedef struct Ark_CustomDialogControllerBuilder Ark_CustomDialogControllerBuilder;
typedef struct Opt_CustomDialogControllerBuilder Opt_CustomDialogControllerBuilder;
typedef struct Ark_CustomDialogControllerOptions Ark_CustomDialogControllerOptions;
typedef struct Opt_CustomDialogControllerOptions Opt_CustomDialogControllerOptions;
typedef struct CustomSpanPeer CustomSpanPeer;
typedef struct CustomSpanPeer* Ark_CustomSpan;
typedef struct Opt_CustomSpan Opt_CustomSpan;
typedef struct Ark_CustomSpanDrawInfo Ark_CustomSpanDrawInfo;
typedef struct Opt_CustomSpanDrawInfo Opt_CustomSpanDrawInfo;
typedef struct Ark_CustomSpanMeasureInfo Ark_CustomSpanMeasureInfo;
typedef struct Opt_CustomSpanMeasureInfo Opt_CustomSpanMeasureInfo;
typedef struct Ark_CustomSpanMetrics Ark_CustomSpanMetrics;
typedef struct Opt_CustomSpanMetrics Opt_CustomSpanMetrics;
typedef struct Ark_CutEvent Ark_CutEvent;
typedef struct Opt_CutEvent Opt_CutEvent;
typedef struct Ark_DeleteValue Ark_DeleteValue;
typedef struct Opt_DeleteValue Opt_DeleteValue;
typedef struct Ark_Dimension Ark_Dimension;
typedef struct Opt_Dimension Opt_Dimension;
typedef struct Ark_DirectionalEdgesT Ark_DirectionalEdgesT;
typedef struct Opt_DirectionalEdgesT Opt_DirectionalEdgesT;
typedef struct DisappearSymbolEffectPeer DisappearSymbolEffectPeer;
typedef struct DisappearSymbolEffectPeer* Ark_DisappearSymbolEffect;
typedef struct Opt_DisappearSymbolEffect Opt_DisappearSymbolEffect;
typedef struct Ark_DismissContentCoverAction Ark_DismissContentCoverAction;
typedef struct Opt_DismissContentCoverAction Opt_DismissContentCoverAction;
typedef struct Ark_DismissDialogAction Ark_DismissDialogAction;
typedef struct Opt_DismissDialogAction Opt_DismissDialogAction;
typedef struct Ark_DismissPopupAction Ark_DismissPopupAction;
typedef struct Opt_DismissPopupAction Opt_DismissPopupAction;
typedef struct Ark_DismissSheetAction Ark_DismissSheetAction;
typedef struct Opt_DismissSheetAction Opt_DismissSheetAction;
typedef struct Ark_DoubleAnimationParam Ark_DoubleAnimationParam;
typedef struct Opt_DoubleAnimationParam Opt_DoubleAnimationParam;
typedef struct Ark_DragInteractionOptions Ark_DragInteractionOptions;
typedef struct Opt_DragInteractionOptions Opt_DragInteractionOptions;
typedef struct Ark_DragItemInfo Ark_DragItemInfo;
typedef struct Opt_DragItemInfo Opt_DragItemInfo;
typedef struct DrawingRenderingContextPeer DrawingRenderingContextPeer;
typedef struct DrawingRenderingContextPeer* Ark_DrawingRenderingContext;
typedef struct Opt_DrawingRenderingContext Opt_DrawingRenderingContext;
typedef struct DrawModifierPeer DrawModifierPeer;
typedef struct DrawModifierPeer* Ark_DrawModifier;
typedef struct Opt_DrawModifier Opt_DrawModifier;
typedef struct Ark_EdgeOutlineStyles Ark_EdgeOutlineStyles;
typedef struct Opt_EdgeOutlineStyles Opt_EdgeOutlineStyles;
typedef struct Ark_EdgeStyles Ark_EdgeStyles;
typedef struct Opt_EdgeStyles Opt_EdgeStyles;
typedef struct Ark_EditMenuOptions Ark_EditMenuOptions;
typedef struct Opt_EditMenuOptions Opt_EditMenuOptions;
typedef struct Ark_EllipseOptions Ark_EllipseOptions;
typedef struct Opt_EllipseOptions Opt_EllipseOptions;
typedef struct Ark_ErrorEvent Ark_ErrorEvent;
typedef struct Opt_ErrorEvent Opt_ErrorEvent;
typedef struct Ark_Event Ark_Event;
typedef struct Opt_Event Opt_Event;
typedef struct Ark_ExpectedFrameRateRange Ark_ExpectedFrameRateRange;
typedef struct Opt_ExpectedFrameRateRange Opt_ExpectedFrameRateRange;
typedef struct Ark_FadingEdgeOptions Ark_FadingEdgeOptions;
typedef struct Opt_FadingEdgeOptions Opt_FadingEdgeOptions;
typedef struct Ark_FingerInfo Ark_FingerInfo;
typedef struct Opt_FingerInfo Opt_FingerInfo;
typedef struct Ark_FlexSpaceOptions Ark_FlexSpaceOptions;
typedef struct Opt_FlexSpaceOptions Opt_FlexSpaceOptions;
typedef struct Ark_FocusBoxStyle Ark_FocusBoxStyle;
typedef struct Opt_FocusBoxStyle Opt_FocusBoxStyle;
typedef struct Ark_FontInfo Ark_FontInfo;
typedef struct Opt_FontInfo Opt_FontInfo;
typedef struct Ark_FontOptions Ark_FontOptions;
typedef struct Opt_FontOptions Opt_FontOptions;
typedef struct Ark_ForegroundEffectOptions Ark_ForegroundEffectOptions;
typedef struct Opt_ForegroundEffectOptions Opt_ForegroundEffectOptions;
typedef struct Ark_FormCallbackInfo Ark_FormCallbackInfo;
typedef struct Opt_FormCallbackInfo Opt_FormCallbackInfo;
typedef struct Ark_FractionStop Ark_FractionStop;
typedef struct Opt_FractionStop Opt_FractionStop;
typedef struct Ark_GeometryTransitionOptions Ark_GeometryTransitionOptions;
typedef struct Opt_GeometryTransitionOptions Opt_GeometryTransitionOptions;
typedef struct Ark_GestureInfo Ark_GestureInfo;
typedef struct Opt_GestureInfo Opt_GestureInfo;
typedef struct Ark_GestureStyleInterface Ark_GestureStyleInterface;
typedef struct Opt_GestureStyleInterface Opt_GestureStyleInterface;
typedef struct Ark_GestureType Ark_GestureType;
typedef struct Opt_GestureType Opt_GestureType;
typedef struct Ark_GridContainerOptions Ark_GridContainerOptions;
typedef struct Opt_GridContainerOptions Opt_GridContainerOptions;
typedef struct HierarchicalSymbolEffectPeer HierarchicalSymbolEffectPeer;
typedef struct HierarchicalSymbolEffectPeer* Ark_HierarchicalSymbolEffect;
typedef struct Opt_HierarchicalSymbolEffect Opt_HierarchicalSymbolEffect;
typedef struct Ark_ImageAIOptions Ark_ImageAIOptions;
typedef struct Opt_ImageAIOptions Opt_ImageAIOptions;
typedef struct Ark_ImageAnalyzerConfig Ark_ImageAnalyzerConfig;
typedef struct Opt_ImageAnalyzerConfig Opt_ImageAnalyzerConfig;
typedef struct ImageDataPeer ImageDataPeer;
typedef struct ImageDataPeer* Ark_ImageData;
typedef struct Opt_ImageData Opt_ImageData;
typedef struct Ark_ImageError Ark_ImageError;
typedef struct Opt_ImageError Opt_ImageError;
typedef struct Ark_ImageSourceSize Ark_ImageSourceSize;
typedef struct Opt_ImageSourceSize Opt_ImageSourceSize;
typedef struct Ark_InputCounterOptions Ark_InputCounterOptions;
typedef struct Opt_InputCounterOptions Opt_InputCounterOptions;
typedef struct Ark_InsertValue Ark_InsertValue;
typedef struct Opt_InsertValue Opt_InsertValue;
typedef struct Ark_InvertOptions Ark_InvertOptions;
typedef struct Opt_InvertOptions Opt_InvertOptions;
typedef struct Ark_ItemDragInfo Ark_ItemDragInfo;
typedef struct Opt_ItemDragInfo Opt_ItemDragInfo;
typedef struct Ark_KeyboardOptions Ark_KeyboardOptions;
typedef struct Opt_KeyboardOptions Opt_KeyboardOptions;
typedef struct KeyEventPeer KeyEventPeer;
typedef struct KeyEventPeer* Ark_KeyEvent;
typedef struct Opt_KeyEvent Opt_KeyEvent;
typedef struct Ark_Length Ark_Length;
typedef struct Opt_Length Opt_Length;
typedef struct Ark_LengthConstrain Ark_LengthConstrain;
typedef struct Opt_LengthConstrain Opt_LengthConstrain;
typedef struct LetterSpacingStylePeer LetterSpacingStylePeer;
typedef struct LetterSpacingStylePeer* Ark_LetterSpacingStyle;
typedef struct Opt_LetterSpacingStyle Opt_LetterSpacingStyle;
typedef struct Ark_LinearGradient_common Ark_LinearGradient_common;
typedef struct Opt_LinearGradient_common Opt_LinearGradient_common;
typedef struct Ark_LinearGradientBlurOptions Ark_LinearGradientBlurOptions;
typedef struct Opt_LinearGradientBlurOptions Opt_LinearGradientBlurOptions;
typedef struct LineHeightStylePeer LineHeightStylePeer;
typedef struct LineHeightStylePeer* Ark_LineHeightStyle;
typedef struct Opt_LineHeightStyle Opt_LineHeightStyle;
typedef struct Ark_ListItemOptions Ark_ListItemOptions;
typedef struct Opt_ListItemOptions Opt_ListItemOptions;
typedef struct Ark_ListOptions Ark_ListOptions;
typedef struct Opt_ListOptions Opt_ListOptions;
typedef struct Ark_Literal_Alignment_align Ark_Literal_Alignment_align;
typedef struct Opt_Literal_Alignment_align Opt_Literal_Alignment_align;
typedef struct Ark_Literal_Boolean_next_Axis_direction Ark_Literal_Boolean_next_Axis_direction;
typedef struct Opt_Literal_Boolean_next_Axis_direction Opt_Literal_Boolean_next_Axis_direction;
typedef struct Ark_Literal_Number_angle_fingers Ark_Literal_Number_angle_fingers;
typedef struct Opt_Literal_Number_angle_fingers Opt_Literal_Number_angle_fingers;
typedef struct Ark_Literal_Number_distance_fingers Ark_Literal_Number_distance_fingers;
typedef struct Opt_Literal_Number_distance_fingers Opt_Literal_Number_distance_fingers;
typedef struct Ark_Literal_Number_distance_fingers_PanDirection_direction Ark_Literal_Number_distance_fingers_PanDirection_direction;
typedef struct Opt_Literal_Number_distance_fingers_PanDirection_direction Opt_Literal_Number_distance_fingers_PanDirection_direction;
typedef struct Ark_Literal_Number_duration_fingers_Boolean_repeat Ark_Literal_Number_duration_fingers_Boolean_repeat;
typedef struct Opt_Literal_Number_duration_fingers_Boolean_repeat Opt_Literal_Number_duration_fingers_Boolean_repeat;
typedef struct Ark_Literal_Number_fingers_speed_SwipeDirection_direction Ark_Literal_Number_fingers_speed_SwipeDirection_direction;
typedef struct Opt_Literal_Number_fingers_speed_SwipeDirection_direction Opt_Literal_Number_fingers_speed_SwipeDirection_direction;
typedef struct Ark_Literal_Number_height_width Ark_Literal_Number_height_width;
typedef struct Opt_Literal_Number_height_width Opt_Literal_Number_height_width;
typedef struct Ark_Literal_Number_offset_span Ark_Literal_Number_offset_span;
typedef struct Opt_Literal_Number_offset_span Opt_Literal_Number_offset_span;
typedef struct Ark_Literal_Number_offsetRemain Ark_Literal_Number_offsetRemain;
typedef struct Opt_Literal_Number_offsetRemain Opt_Literal_Number_offsetRemain;
typedef struct Ark_Literal_Object_detail Ark_Literal_Object_detail;
typedef struct Opt_Literal_Object_detail Opt_Literal_Object_detail;
typedef struct Ark_Literal_String_anchor_HorizontalAlign_align Ark_Literal_String_anchor_HorizontalAlign_align;
typedef struct Opt_Literal_String_anchor_HorizontalAlign_align Opt_Literal_String_anchor_HorizontalAlign_align;
typedef struct Ark_Literal_String_anchor_VerticalAlign_align Ark_Literal_String_anchor_VerticalAlign_align;
typedef struct Opt_Literal_String_anchor_VerticalAlign_align Opt_Literal_String_anchor_VerticalAlign_align;
typedef struct Ark_Literal_String_target_NavigationType_type Ark_Literal_String_target_NavigationType_type;
typedef struct Opt_Literal_String_target_NavigationType_type Opt_Literal_String_target_NavigationType_type;
typedef struct Ark_Literal_String_value_Callback_Void_action Ark_Literal_String_value_Callback_Void_action;
typedef struct Opt_Literal_String_value_Callback_Void_action Opt_Literal_String_value_Callback_Void_action;
typedef struct Ark_Literal_TransitionEffect_appear_disappear Ark_Literal_TransitionEffect_appear_disappear;
typedef struct Opt_Literal_TransitionEffect_appear_disappear Opt_Literal_TransitionEffect_appear_disappear;
typedef struct Ark_Literal_Union_String_Resource_icon_text Ark_Literal_Union_String_Resource_icon_text;
typedef struct Opt_Literal_Union_String_Resource_icon_text Opt_Literal_Union_String_Resource_icon_text;
typedef struct Ark_LocalizedBorderRadiuses Ark_LocalizedBorderRadiuses;
typedef struct Opt_LocalizedBorderRadiuses Opt_LocalizedBorderRadiuses;
typedef struct Ark_LocalizedEdges Ark_LocalizedEdges;
typedef struct Opt_LocalizedEdges Opt_LocalizedEdges;
typedef struct Ark_LocalizedEdgeWidths Ark_LocalizedEdgeWidths;
typedef struct Opt_LocalizedEdgeWidths Opt_LocalizedEdgeWidths;
typedef struct Ark_LocalizedHorizontalAlignParam Ark_LocalizedHorizontalAlignParam;
typedef struct Opt_LocalizedHorizontalAlignParam Opt_LocalizedHorizontalAlignParam;
typedef struct Ark_LocalizedPadding Ark_LocalizedPadding;
typedef struct Opt_LocalizedPadding Opt_LocalizedPadding;
typedef struct Ark_LocalizedPosition Ark_LocalizedPosition;
typedef struct Opt_LocalizedPosition Opt_LocalizedPosition;
typedef struct Ark_LocalizedVerticalAlignParam Ark_LocalizedVerticalAlignParam;
typedef struct Opt_LocalizedVerticalAlignParam Opt_LocalizedVerticalAlignParam;
typedef struct Matrix2DPeer Matrix2DPeer;
typedef struct Matrix2DPeer* Ark_Matrix2D;
typedef struct Opt_Matrix2D Opt_Matrix2D;
typedef struct Ark_Matrix4Result Ark_Matrix4Result;
typedef struct Opt_Matrix4Result Opt_Matrix4Result;
typedef struct Ark_MeasureOptions Ark_MeasureOptions;
typedef struct Opt_MeasureOptions Opt_MeasureOptions;
typedef struct Ark_MeasureResult Ark_MeasureResult;
typedef struct Opt_MeasureResult Opt_MeasureResult;
typedef struct Ark_MessageEvents Ark_MessageEvents;
typedef struct Opt_MessageEvents Opt_MessageEvents;
typedef struct Ark_MotionBlurAnchor Ark_MotionBlurAnchor;
typedef struct Opt_MotionBlurAnchor Opt_MotionBlurAnchor;
typedef struct Ark_MotionBlurOptions Ark_MotionBlurOptions;
typedef struct Opt_MotionBlurOptions Opt_MotionBlurOptions;
typedef struct Ark_MotionPathOptions Ark_MotionPathOptions;
typedef struct Opt_MotionPathOptions Opt_MotionPathOptions;
typedef struct MutableStyledStringPeer MutableStyledStringPeer;
typedef struct MutableStyledStringPeer* Ark_MutableStyledString;
typedef struct Opt_MutableStyledString Opt_MutableStyledString;
typedef struct Ark_NativeEmbedInfo Ark_NativeEmbedInfo;
typedef struct Opt_NativeEmbedInfo Opt_NativeEmbedInfo;
typedef struct Ark_NavContentInfo Ark_NavContentInfo;
typedef struct Opt_NavContentInfo Opt_NavContentInfo;
typedef struct Ark_NavDestinationCommonTitle Ark_NavDestinationCommonTitle;
typedef struct Opt_NavDestinationCommonTitle Opt_NavDestinationCommonTitle;
typedef struct Ark_NavigationAnimatedTransition Ark_NavigationAnimatedTransition;
typedef struct Opt_NavigationAnimatedTransition Opt_NavigationAnimatedTransition;
typedef struct Ark_NavigationCommonTitle Ark_NavigationCommonTitle;
typedef struct Opt_NavigationCommonTitle Opt_NavigationCommonTitle;
typedef struct Ark_NavigationInterception Ark_NavigationInterception;
typedef struct Opt_NavigationInterception Opt_NavigationInterception;
typedef struct Ark_NavigationMenuItem Ark_NavigationMenuItem;
typedef struct Opt_NavigationMenuItem Opt_NavigationMenuItem;
typedef struct Ark_NavigationOptions Ark_NavigationOptions;
typedef struct Opt_NavigationOptions Opt_NavigationOptions;
typedef struct NavigationTransitionProxyPeer NavigationTransitionProxyPeer;
typedef struct NavigationTransitionProxyPeer* Ark_NavigationTransitionProxy;
typedef struct Opt_NavigationTransitionProxy Opt_NavigationTransitionProxy;
typedef struct NavPathInfoPeer NavPathInfoPeer;
typedef struct NavPathInfoPeer* Ark_NavPathInfo;
typedef struct Opt_NavPathInfo Opt_NavPathInfo;
typedef struct Ark_Offset Ark_Offset;
typedef struct Opt_Offset Opt_Offset;
typedef struct Ark_OnHttpErrorReceiveEvent Ark_OnHttpErrorReceiveEvent;
typedef struct Opt_OnHttpErrorReceiveEvent Opt_OnHttpErrorReceiveEvent;
typedef struct Ark_OnRenderExitedEvent Ark_OnRenderExitedEvent;
typedef struct Opt_OnRenderExitedEvent Opt_OnRenderExitedEvent;
typedef struct Ark_OverlayOffset Ark_OverlayOffset;
typedef struct Opt_OverlayOffset Opt_OverlayOffset;
typedef struct Ark_PasswordIcon Ark_PasswordIcon;
typedef struct Opt_PasswordIcon Opt_PasswordIcon;
typedef struct Ark_PasteEvent Ark_PasteEvent;
typedef struct Opt_PasteEvent Opt_PasteEvent;
typedef struct Ark_PathOptions Ark_PathOptions;
typedef struct Opt_PathOptions Opt_PathOptions;
typedef struct Ark_PixelRoundPolicy Ark_PixelRoundPolicy;
typedef struct Opt_PixelRoundPolicy Opt_PixelRoundPolicy;
typedef struct Ark_PopInfo Ark_PopInfo;
typedef struct Opt_PopInfo Opt_PopInfo;
typedef struct Ark_PostMessageOptions Ark_PostMessageOptions;
typedef struct Opt_PostMessageOptions Opt_PostMessageOptions;
typedef struct Ark_PreviewText Ark_PreviewText;
typedef struct Opt_PreviewText Opt_PreviewText;
typedef struct RenderingContextSettingsPeer RenderingContextSettingsPeer;
typedef struct RenderingContextSettingsPeer* Ark_RenderingContextSettings;
typedef struct Opt_RenderingContextSettings Opt_RenderingContextSettings;
typedef struct ReplaceSymbolEffectPeer ReplaceSymbolEffectPeer;
typedef struct ReplaceSymbolEffectPeer* Ark_ReplaceSymbolEffect;
typedef struct Opt_ReplaceSymbolEffect Opt_ReplaceSymbolEffect;
typedef struct Ark_ResourceColor Ark_ResourceColor;
typedef struct Opt_ResourceColor Opt_ResourceColor;
typedef struct Ark_ResourceStr Ark_ResourceStr;
typedef struct Opt_ResourceStr Opt_ResourceStr;
typedef struct Ark_RichEditorBuilderSpanOptions Ark_RichEditorBuilderSpanOptions;
typedef struct Opt_RichEditorBuilderSpanOptions Opt_RichEditorBuilderSpanOptions;
typedef struct Ark_RichEditorDeleteValue Ark_RichEditorDeleteValue;
typedef struct Opt_RichEditorDeleteValue Opt_RichEditorDeleteValue;
typedef struct Ark_RichEditorGesture Ark_RichEditorGesture;
typedef struct Opt_RichEditorGesture Opt_RichEditorGesture;
typedef struct Ark_RichEditorInsertValue Ark_RichEditorInsertValue;
typedef struct Opt_RichEditorInsertValue Opt_RichEditorInsertValue;
typedef struct Ark_RichEditorRange Ark_RichEditorRange;
typedef struct Opt_RichEditorRange Opt_RichEditorRange;
typedef struct Ark_RichEditorSelection Ark_RichEditorSelection;
typedef struct Opt_RichEditorSelection Opt_RichEditorSelection;
typedef struct Ark_RichEditorSpanPosition Ark_RichEditorSpanPosition;
typedef struct Opt_RichEditorSpanPosition Opt_RichEditorSpanPosition;
typedef struct Ark_RichEditorSymbolSpanStyle Ark_RichEditorSymbolSpanStyle;
typedef struct Opt_RichEditorSymbolSpanStyle Opt_RichEditorSymbolSpanStyle;
typedef struct Ark_RichEditorUpdateSymbolSpanStyleOptions Ark_RichEditorUpdateSymbolSpanStyleOptions;
typedef struct Opt_RichEditorUpdateSymbolSpanStyleOptions Opt_RichEditorUpdateSymbolSpanStyleOptions;
typedef struct Ark_RotateOptions Ark_RotateOptions;
typedef struct Opt_RotateOptions Opt_RotateOptions;
typedef struct Ark_RoundedRectOptions Ark_RoundedRectOptions;
typedef struct Opt_RoundedRectOptions Opt_RoundedRectOptions;
typedef struct Ark_RouteMapConfig Ark_RouteMapConfig;
typedef struct Opt_RouteMapConfig Opt_RouteMapConfig;
typedef struct Ark_RowOptions Ark_RowOptions;
typedef struct Opt_RowOptions Opt_RowOptions;
typedef struct Ark_ScaleOptions Ark_ScaleOptions;
typedef struct Opt_ScaleOptions Opt_ScaleOptions;
typedef struct ScaleSymbolEffectPeer ScaleSymbolEffectPeer;
typedef struct ScaleSymbolEffectPeer* Ark_ScaleSymbolEffect;
typedef struct Opt_ScaleSymbolEffect Opt_ScaleSymbolEffect;
typedef struct Ark_ScrollAnimationOptions Ark_ScrollAnimationOptions;
typedef struct Opt_ScrollAnimationOptions Opt_ScrollAnimationOptions;
typedef struct Ark_ScrollEdgeOptions Ark_ScrollEdgeOptions;
typedef struct Opt_ScrollEdgeOptions Opt_ScrollEdgeOptions;
typedef struct Ark_ScrollPageOptions Ark_ScrollPageOptions;
typedef struct Opt_ScrollPageOptions Opt_ScrollPageOptions;
typedef struct Ark_ScrollToIndexOptions Ark_ScrollToIndexOptions;
typedef struct Opt_ScrollToIndexOptions Opt_ScrollToIndexOptions;
typedef struct Ark_SelectionMenuOptions Ark_SelectionMenuOptions;
typedef struct Opt_SelectionMenuOptions Opt_SelectionMenuOptions;
typedef struct Ark_SelectionOptions Ark_SelectionOptions;
typedef struct Opt_SelectionOptions Opt_SelectionOptions;
typedef struct Ark_ShadowOptions Ark_ShadowOptions;
typedef struct Opt_ShadowOptions Opt_ShadowOptions;
typedef struct Ark_SheetDismiss Ark_SheetDismiss;
typedef struct Opt_SheetDismiss Opt_SheetDismiss;
typedef struct Ark_SnapshotOptions Ark_SnapshotOptions;
typedef struct Opt_SnapshotOptions Opt_SnapshotOptions;
typedef struct Ark_SpringBackAction Ark_SpringBackAction;
typedef struct Opt_SpringBackAction Opt_SpringBackAction;
typedef struct Ark_StackOptions Ark_StackOptions;
typedef struct Opt_StackOptions Opt_StackOptions;
typedef struct Ark_StateStyles Ark_StateStyles;
typedef struct Opt_StateStyles Opt_StateStyles;
typedef struct Ark_StyledStringChangedListener Ark_StyledStringChangedListener;
typedef struct Opt_StyledStringChangedListener Opt_StyledStringChangedListener;
typedef struct Ark_SwiperAutoFill Ark_SwiperAutoFill;
typedef struct Opt_SwiperAutoFill Opt_SwiperAutoFill;
typedef struct Ark_SwiperContentAnimatedTransition Ark_SwiperContentAnimatedTransition;
typedef struct Opt_SwiperContentAnimatedTransition Opt_SwiperContentAnimatedTransition;
typedef struct Ark_TabBarSymbol Ark_TabBarSymbol;
typedef struct Opt_TabBarSymbol Opt_TabBarSymbol;
typedef struct Ark_TabsOptions Ark_TabsOptions;
typedef struct Opt_TabsOptions Opt_TabsOptions;
typedef struct Ark_TapGestureParameters Ark_TapGestureParameters;
typedef struct Opt_TapGestureParameters Opt_TapGestureParameters;
typedef struct Ark_TerminationInfo Ark_TerminationInfo;
typedef struct Opt_TerminationInfo Opt_TerminationInfo;
typedef struct Ark_TextCascadePickerRangeContent Ark_TextCascadePickerRangeContent;
typedef struct Opt_TextCascadePickerRangeContent Opt_TextCascadePickerRangeContent;
typedef struct Ark_TextPickerRangeContent Ark_TextPickerRangeContent;
typedef struct Opt_TextPickerRangeContent Opt_TextPickerRangeContent;
typedef struct Ark_TextRange Ark_TextRange;
typedef struct Opt_TextRange Opt_TextRange;
typedef struct TextShadowStylePeer TextShadowStylePeer;
typedef struct TextShadowStylePeer* Ark_TextShadowStyle;
typedef struct Opt_TextShadowStyle Opt_TextShadowStyle;
typedef struct Ark_TextStyle_alert_dialog Ark_TextStyle_alert_dialog;
typedef struct Opt_TextStyle_alert_dialog Opt_TextStyle_alert_dialog;
typedef struct Ark_ToggleOptions Ark_ToggleOptions;
typedef struct Opt_ToggleOptions Opt_ToggleOptions;
typedef struct Ark_TouchObject Ark_TouchObject;
typedef struct Opt_TouchObject Opt_TouchObject;
typedef struct Ark_TouchResult Ark_TouchResult;
typedef struct Opt_TouchResult Opt_TouchResult;
typedef struct Ark_TransformationMatrix Ark_TransformationMatrix;
typedef struct Opt_TransformationMatrix Opt_TransformationMatrix;
typedef struct Ark_TranslateOptions Ark_TranslateOptions;
typedef struct Opt_TranslateOptions Opt_TranslateOptions;
typedef struct Ark_Tuple_Boolean_Number Ark_Tuple_Boolean_Number;
typedef struct Opt_Tuple_Boolean_Number Opt_Tuple_Boolean_Number;
typedef struct Ark_Tuple_Dimension_Dimension Ark_Tuple_Dimension_Dimension;
typedef struct Opt_Tuple_Dimension_Dimension Opt_Tuple_Dimension_Dimension;
typedef struct Ark_Tuple_Length_Length Ark_Tuple_Length_Length;
typedef struct Opt_Tuple_Length_Length Opt_Tuple_Length_Length;
typedef struct Ark_Tuple_ResourceColor_Number Ark_Tuple_ResourceColor_Number;
typedef struct Opt_Tuple_ResourceColor_Number Opt_Tuple_ResourceColor_Number;
typedef struct Ark_Type_CommonMethod_linearGradient_value Ark_Type_CommonMethod_linearGradient_value;
typedef struct Opt_Type_CommonMethod_linearGradient_value Opt_Type_CommonMethod_linearGradient_value;
typedef struct Ark_Type_CommonMethod_radialGradient_value Ark_Type_CommonMethod_radialGradient_value;
typedef struct Opt_Type_CommonMethod_radialGradient_value Opt_Type_CommonMethod_radialGradient_value;
typedef struct Ark_Type_CommonMethod_sweepGradient_value Ark_Type_CommonMethod_sweepGradient_value;
typedef struct Opt_Type_CommonMethod_sweepGradient_value Opt_Type_CommonMethod_sweepGradient_value;
typedef struct Ark_Type_PanGestureInterface_callable0_value Ark_Type_PanGestureInterface_callable0_value;
typedef struct Opt_Type_PanGestureInterface_callable0_value Opt_Type_PanGestureInterface_callable0_value;
typedef struct Ark_Type_TabContentAttribute_tabBar_value Ark_Type_TabContentAttribute_tabBar_value;
typedef struct Opt_Type_TabContentAttribute_tabBar_value Opt_Type_TabContentAttribute_tabBar_value;
typedef struct Ark_Type_Test1Attribute_testTupleUnion_value Ark_Type_Test1Attribute_testTupleUnion_value;
typedef struct Opt_Type_Test1Attribute_testTupleUnion_value Opt_Type_Test1Attribute_testTupleUnion_value;
typedef struct Ark_Type_TextPickerOptions_range Ark_Type_TextPickerOptions_range;
typedef struct Opt_Type_TextPickerOptions_range Opt_Type_TextPickerOptions_range;
typedef struct Ark_Union_Array_MenuElement_CustomBuilder Ark_Union_Array_MenuElement_CustomBuilder;
typedef struct Opt_Union_Array_MenuElement_CustomBuilder Opt_Union_Array_MenuElement_CustomBuilder;
typedef struct Ark_Union_Array_NavigationMenuItem_CustomBuilder Ark_Union_Array_NavigationMenuItem_CustomBuilder;
typedef struct Opt_Union_Array_NavigationMenuItem_CustomBuilder Opt_Union_Array_NavigationMenuItem_CustomBuilder;
typedef struct Ark_Union_Array_ToolbarItem_CustomBuilder Ark_Union_Array_ToolbarItem_CustomBuilder;
typedef struct Opt_Union_Array_ToolbarItem_CustomBuilder Opt_Union_Array_ToolbarItem_CustomBuilder;
typedef struct Ark_Union_Boolean_Callback_DismissPopupAction_Void Ark_Union_Boolean_Callback_DismissPopupAction_Void;
typedef struct Opt_Union_Boolean_Callback_DismissPopupAction_Void Opt_Union_Boolean_Callback_DismissPopupAction_Void;
typedef struct Ark_Union_BorderStyle_EdgeStyles Ark_Union_BorderStyle_EdgeStyles;
typedef struct Opt_Union_BorderStyle_EdgeStyles Opt_Union_BorderStyle_EdgeStyles;
typedef struct Ark_Union_CanvasRenderingContext2D_DrawingRenderingContext Ark_Union_CanvasRenderingContext2D_DrawingRenderingContext;
typedef struct Opt_Union_CanvasRenderingContext2D_DrawingRenderingContext Opt_Union_CanvasRenderingContext2D_DrawingRenderingContext;
typedef struct Ark_Union_CustomBuilder_DragItemInfo Ark_Union_CustomBuilder_DragItemInfo;
typedef struct Opt_Union_CustomBuilder_DragItemInfo Opt_Union_CustomBuilder_DragItemInfo;
typedef struct Ark_Union_CustomBuilder_DragItemInfo_String Ark_Union_CustomBuilder_DragItemInfo_String;
typedef struct Opt_Union_CustomBuilder_DragItemInfo_String Opt_Union_CustomBuilder_DragItemInfo_String;
typedef struct Ark_Union_Dimension_Array_Dimension Ark_Union_Dimension_Array_Dimension;
typedef struct Opt_Union_Dimension_Array_Dimension Opt_Union_Dimension_Array_Dimension;
typedef struct Ark_Union_DragPreviewMode_Array_DragPreviewMode Ark_Union_DragPreviewMode_Array_DragPreviewMode;
typedef struct Opt_Union_DragPreviewMode_Array_DragPreviewMode Opt_Union_DragPreviewMode_Array_DragPreviewMode;
typedef struct Ark_Union_EdgeOutlineStyles_OutlineStyle Ark_Union_EdgeOutlineStyles_OutlineStyle;
typedef struct Opt_Union_EdgeOutlineStyles_OutlineStyle Opt_Union_EdgeOutlineStyles_OutlineStyle;
typedef struct Ark_Union_EdgeStyles_BorderStyle Ark_Union_EdgeStyles_BorderStyle;
typedef struct Opt_Union_EdgeStyles_BorderStyle Opt_Union_EdgeStyles_BorderStyle;
typedef struct Ark_Union_Length_LayoutPolicy Ark_Union_Length_LayoutPolicy;
typedef struct Opt_Union_Length_LayoutPolicy Opt_Union_Length_LayoutPolicy;
typedef struct Ark_Union_Length_Number Ark_Union_Length_Number;
typedef struct Opt_Union_Length_Number Opt_Union_Length_Number;
typedef struct Ark_Union_MenuPreviewMode_CustomBuilder Ark_Union_MenuPreviewMode_CustomBuilder;
typedef struct Opt_Union_MenuPreviewMode_CustomBuilder Opt_Union_MenuPreviewMode_CustomBuilder;
typedef struct Ark_Union_Number_Array_Number Ark_Union_Number_Array_Number;
typedef struct Opt_Union_Number_Array_Number Opt_Union_Number_Array_Number;
typedef struct Ark_Union_Number_Array_String Ark_Union_Number_Array_String;
typedef struct Opt_Union_Number_Array_String Opt_Union_Number_Array_String;
typedef struct Ark_Union_Number_InvertOptions Ark_Union_Number_InvertOptions;
typedef struct Opt_Union_Number_InvertOptions Opt_Union_Number_InvertOptions;
typedef struct Ark_Union_Number_LengthConstrain Ark_Union_Number_LengthConstrain;
typedef struct Opt_Union_Number_LengthConstrain Opt_Union_Number_LengthConstrain;
typedef struct Ark_Union_Number_Literal_Number_offset_span Ark_Union_Number_Literal_Number_offset_span;
typedef struct Opt_Union_Number_Literal_Number_offset_span Opt_Union_Number_Literal_Number_offset_span;
typedef struct Ark_Union_Number_ResourceStr Ark_Union_Number_ResourceStr;
typedef struct Opt_Union_Number_ResourceStr Opt_Union_Number_ResourceStr;
typedef struct Ark_Union_Number_String_Array_Union_Number_String Ark_Union_Number_String_Array_Union_Number_String;
typedef struct Opt_Union_Number_String_Array_Union_Number_String Opt_Union_Number_String_Array_Union_Number_String;
typedef struct Ark_Union_Number_String_SwiperAutoFill Ark_Union_Number_String_SwiperAutoFill;
typedef struct Opt_Union_Number_String_SwiperAutoFill Opt_Union_Number_String_SwiperAutoFill;
typedef struct Ark_Union_OutlineStyle_EdgeOutlineStyles Ark_Union_OutlineStyle_EdgeOutlineStyles;
typedef struct Opt_Union_OutlineStyle_EdgeOutlineStyles Opt_Union_OutlineStyle_EdgeOutlineStyles;
typedef struct Ark_Union_PixelMap_ResourceStr Ark_Union_PixelMap_ResourceStr;
typedef struct Opt_Union_PixelMap_ResourceStr Opt_Union_PixelMap_ResourceStr;
typedef struct Ark_Union_PixelMap_ResourceStr_DrawableDescriptor Ark_Union_PixelMap_ResourceStr_DrawableDescriptor;
typedef struct Opt_Union_PixelMap_ResourceStr_DrawableDescriptor Opt_Union_PixelMap_ResourceStr_DrawableDescriptor;
typedef struct Ark_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent Ark_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent;
typedef struct Opt_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent Opt_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent;
typedef struct Ark_Union_ResourceColor_ColorContent Ark_Union_ResourceColor_ColorContent;
typedef struct Opt_Union_ResourceColor_ColorContent Opt_Union_ResourceColor_ColorContent;
typedef struct Ark_Union_ResourceColor_ColoringStrategy Ark_Union_ResourceColor_ColoringStrategy;
typedef struct Opt_Union_ResourceColor_ColoringStrategy Opt_Union_ResourceColor_ColoringStrategy;
typedef struct Ark_Union_ResourceColor_LinearGradient Ark_Union_ResourceColor_LinearGradient;
typedef struct Opt_Union_ResourceColor_LinearGradient Opt_Union_ResourceColor_LinearGradient;
typedef struct Ark_Union_ResourceStr_ComponentContent Ark_Union_ResourceStr_ComponentContent;
typedef struct Opt_Union_ResourceStr_ComponentContent Opt_Union_ResourceStr_ComponentContent;
typedef struct Ark_Union_ResourceStr_PixelMap Ark_Union_ResourceStr_PixelMap;
typedef struct Opt_Union_ResourceStr_PixelMap Opt_Union_ResourceStr_PixelMap;
typedef struct Ark_Union_ResourceStr_PixelMap_SymbolGlyphModifier Ark_Union_ResourceStr_PixelMap_SymbolGlyphModifier;
typedef struct Opt_Union_ResourceStr_PixelMap_SymbolGlyphModifier Opt_Union_ResourceStr_PixelMap_SymbolGlyphModifier;
typedef struct Ark_Union_ResourceStr_TabBarSymbol Ark_Union_ResourceStr_TabBarSymbol;
typedef struct Opt_Union_ResourceStr_TabBarSymbol Opt_Union_ResourceStr_TabBarSymbol;
typedef struct Ark_Union_ResourceStr_Union_ResourceStr_ComponentContent Ark_Union_ResourceStr_Union_ResourceStr_ComponentContent;
typedef struct Opt_Union_ResourceStr_Union_ResourceStr_ComponentContent Opt_Union_ResourceStr_Union_ResourceStr_ComponentContent;
typedef struct Ark_Union_ScrollAnimationOptions_Boolean Ark_Union_ScrollAnimationOptions_Boolean;
typedef struct Opt_Union_ScrollAnimationOptions_Boolean Opt_Union_ScrollAnimationOptions_Boolean;
typedef struct Ark_Union_ShadowOptions_Array_ShadowOptions Ark_Union_ShadowOptions_Array_ShadowOptions;
typedef struct Opt_Union_ShadowOptions_Array_ShadowOptions Opt_Union_ShadowOptions_Array_ShadowOptions;
typedef struct Ark_Union_ShadowOptions_ShadowStyle Ark_Union_ShadowOptions_ShadowStyle;
typedef struct Opt_Union_ShadowOptions_ShadowStyle Opt_Union_ShadowOptions_ShadowStyle;
typedef struct Ark_Union_SheetSize_Length Ark_Union_SheetSize_Length;
typedef struct Opt_Union_SheetSize_Length Opt_Union_SheetSize_Length;
typedef struct Ark_Union_String_Array_String Ark_Union_String_Array_String;
typedef struct Opt_Union_String_Array_String Opt_Union_String_Array_String;
typedef struct Ark_Union_String_CustomBuilder_ComponentContent Ark_Union_String_CustomBuilder_ComponentContent;
typedef struct Opt_Union_String_CustomBuilder_ComponentContent Opt_Union_String_CustomBuilder_ComponentContent;
typedef struct Ark_Union_String_Resource_LinearGradient_common Ark_Union_String_Resource_LinearGradient_common;
typedef struct Opt_Union_String_Resource_LinearGradient_common Opt_Union_String_Resource_LinearGradient_common;
typedef struct Ark_Union_TitleHeight_Length Ark_Union_TitleHeight_Length;
typedef struct Opt_Union_TitleHeight_Length Opt_Union_TitleHeight_Length;
typedef struct Ark_Union_Vector1_Number Ark_Union_Vector1_Number;
typedef struct Opt_Union_Vector1_Number Opt_Union_Vector1_Number;
typedef struct Ark_Union_Vector2_Number Ark_Union_Vector2_Number;
typedef struct Opt_Union_Vector2_Number Opt_Union_Vector2_Number;
typedef struct Ark_UnionOptionalInterfaceDTS Ark_UnionOptionalInterfaceDTS;
typedef struct Opt_UnionOptionalInterfaceDTS Opt_UnionOptionalInterfaceDTS;
typedef struct Ark_VisibleAreaEventOptions Ark_VisibleAreaEventOptions;
typedef struct Opt_VisibleAreaEventOptions Opt_VisibleAreaEventOptions;
typedef struct Ark_VisibleListContentInfo Ark_VisibleListContentInfo;
typedef struct Opt_VisibleListContentInfo Opt_VisibleListContentInfo;
typedef struct Ark_WorkerOptions Ark_WorkerOptions;
typedef struct Opt_WorkerOptions Opt_WorkerOptions;
typedef struct Ark_AlertDialogButtonBaseOptions Ark_AlertDialogButtonBaseOptions;
typedef struct Opt_AlertDialogButtonBaseOptions Opt_AlertDialogButtonBaseOptions;
typedef struct Ark_AlertDialogButtonOptions Ark_AlertDialogButtonOptions;
typedef struct Opt_AlertDialogButtonOptions Opt_AlertDialogButtonOptions;
typedef struct Ark_AlignRuleOption Ark_AlignRuleOption;
typedef struct Opt_AlignRuleOption Opt_AlignRuleOption;
typedef struct Ark_AnimateParam Ark_AnimateParam;
typedef struct Opt_AnimateParam Opt_AnimateParam;
typedef struct Ark_ArrowStyle Ark_ArrowStyle;
typedef struct Opt_ArrowStyle Opt_ArrowStyle;
typedef struct Ark_BackgroundBlurStyleOptions Ark_BackgroundBlurStyleOptions;
typedef struct Opt_BackgroundBlurStyleOptions Opt_BackgroundBlurStyleOptions;
typedef struct Ark_BackgroundEffectOptions Ark_BackgroundEffectOptions;
typedef struct Opt_BackgroundEffectOptions Opt_BackgroundEffectOptions;
typedef struct Ark_BoardStyle Ark_BoardStyle;
typedef struct Opt_BoardStyle Opt_BoardStyle;
typedef struct Ark_BorderRadiuses Ark_BorderRadiuses;
typedef struct Opt_BorderRadiuses Opt_BorderRadiuses;
typedef struct Ark_CaretStyle Ark_CaretStyle;
typedef struct Opt_CaretStyle Opt_CaretStyle;
typedef struct Ark_ChainAnimationOptions Ark_ChainAnimationOptions;
typedef struct Opt_ChainAnimationOptions Opt_ChainAnimationOptions;
typedef struct Ark_ColorStop Ark_ColorStop;
typedef struct Opt_ColorStop Opt_ColorStop;
typedef struct Ark_ComponentInfo Ark_ComponentInfo;
typedef struct Opt_ComponentInfo Opt_ComponentInfo;
typedef struct Ark_ConstraintSizeOptions Ark_ConstraintSizeOptions;
typedef struct Opt_ConstraintSizeOptions Opt_ConstraintSizeOptions;
typedef struct Ark_ContentCoverOptions Ark_ContentCoverOptions;
typedef struct Opt_ContentCoverOptions Opt_ContentCoverOptions;
typedef struct Ark_ContextMenuAnimationOptions Ark_ContextMenuAnimationOptions;
typedef struct Opt_ContextMenuAnimationOptions Opt_ContextMenuAnimationOptions;
typedef struct DecorationStylePeer DecorationStylePeer;
typedef struct DecorationStylePeer* Ark_DecorationStyle;
typedef struct Opt_DecorationStyle Opt_DecorationStyle;
typedef struct Ark_DecorationStyleInterface Ark_DecorationStyleInterface;
typedef struct Opt_DecorationStyleInterface Opt_DecorationStyleInterface;
typedef struct Ark_DecorationStyleResult Ark_DecorationStyleResult;
typedef struct Opt_DecorationStyleResult Opt_DecorationStyleResult;
typedef struct Ark_DividerOptions Ark_DividerOptions;
typedef struct Opt_DividerOptions Opt_DividerOptions;
typedef struct Ark_DotIndicator Ark_DotIndicator;
typedef struct Opt_DotIndicator Opt_DotIndicator;
typedef struct Ark_DragPreviewOptions Ark_DragPreviewOptions;
typedef struct Opt_DragPreviewOptions Opt_DragPreviewOptions;
typedef struct Ark_EdgeColors Ark_EdgeColors;
typedef struct Opt_EdgeColors Opt_EdgeColors;
typedef struct Ark_EdgeOutlineWidths Ark_EdgeOutlineWidths;
typedef struct Opt_EdgeOutlineWidths Opt_EdgeOutlineWidths;
typedef struct Ark_Edges Ark_Edges;
typedef struct Opt_Edges Opt_Edges;
typedef struct Ark_EdgeWidths Ark_EdgeWidths;
typedef struct Opt_EdgeWidths Opt_EdgeWidths;
typedef struct Ark_FlexOptions Ark_FlexOptions;
typedef struct Opt_FlexOptions Opt_FlexOptions;
typedef struct Ark_Font Ark_Font;
typedef struct Opt_Font Opt_Font;
typedef struct Ark_ForegroundBlurStyleOptions Ark_ForegroundBlurStyleOptions;
typedef struct Opt_ForegroundBlurStyleOptions Opt_ForegroundBlurStyleOptions;
typedef struct Ark_HistoricalPoint Ark_HistoricalPoint;
typedef struct Opt_HistoricalPoint Opt_HistoricalPoint;
typedef struct Ark_IconOptions Ark_IconOptions;
typedef struct Opt_IconOptions Opt_IconOptions;
typedef struct Ark_IndicatorStyle Ark_IndicatorStyle;
typedef struct Opt_IndicatorStyle Opt_IndicatorStyle;
typedef struct LayoutablePeer LayoutablePeer;
typedef struct LayoutablePeer* Ark_Layoutable;
typedef struct Opt_Layoutable Opt_Layoutable;
typedef struct Ark_LeadingMarginPlaceholder Ark_LeadingMarginPlaceholder;
typedef struct Opt_LeadingMarginPlaceholder Opt_LeadingMarginPlaceholder;
typedef struct Ark_LightSource Ark_LightSource;
typedef struct Opt_LightSource Opt_LightSource;
typedef struct Ark_ListDividerOptions Ark_ListDividerOptions;
typedef struct Opt_ListDividerOptions Opt_ListDividerOptions;
typedef struct Ark_Literal_ResourceColor_color Ark_Literal_ResourceColor_color;
typedef struct Opt_Literal_ResourceColor_color Opt_Literal_ResourceColor_color;
typedef struct Ark_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs Ark_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs;
typedef struct Opt_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs Opt_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs;
typedef struct Ark_LocalizedAlignRuleOptions Ark_LocalizedAlignRuleOptions;
typedef struct Opt_LocalizedAlignRuleOptions Opt_LocalizedAlignRuleOptions;
typedef struct Ark_LocalizedEdgeColors Ark_LocalizedEdgeColors;
typedef struct Opt_LocalizedEdgeColors Opt_LocalizedEdgeColors;
typedef struct Ark_MenuElement Ark_MenuElement;
typedef struct Opt_MenuElement Opt_MenuElement;
typedef struct Ark_NativeEmbedDataInfo Ark_NativeEmbedDataInfo;
typedef struct Opt_NativeEmbedDataInfo Opt_NativeEmbedDataInfo;
typedef struct NavDestinationContextPeer NavDestinationContextPeer;
typedef struct NavDestinationContextPeer* Ark_NavDestinationContext;
typedef struct Opt_NavDestinationContext Opt_NavDestinationContext;
typedef struct Ark_NavDestinationCustomTitle Ark_NavDestinationCustomTitle;
typedef struct Opt_NavDestinationCustomTitle Opt_NavDestinationCustomTitle;
typedef struct Ark_NavigationCustomTitle Ark_NavigationCustomTitle;
typedef struct Opt_NavigationCustomTitle Opt_NavigationCustomTitle;
typedef struct Ark_NavigationTitleOptions Ark_NavigationTitleOptions;
typedef struct Opt_NavigationTitleOptions Opt_NavigationTitleOptions;
typedef struct Ark_NavigationToolbarOptions Ark_NavigationToolbarOptions;
typedef struct Opt_NavigationToolbarOptions Opt_NavigationToolbarOptions;
typedef struct Ark_OffsetOptions Ark_OffsetOptions;
typedef struct Opt_OffsetOptions Opt_OffsetOptions;
typedef struct Ark_OptionInterfaceDTS Ark_OptionInterfaceDTS;
typedef struct Opt_OptionInterfaceDTS Opt_OptionInterfaceDTS;
typedef struct Ark_OutlineRadiuses Ark_OutlineRadiuses;
typedef struct Opt_OutlineRadiuses Opt_OutlineRadiuses;
typedef struct Ark_OverlayOptions Ark_OverlayOptions;
typedef struct Opt_OverlayOptions Opt_OverlayOptions;
typedef struct Ark_Padding Ark_Padding;
typedef struct Opt_Padding Opt_Padding;
typedef struct Ark_PixelStretchEffectOptions Ark_PixelStretchEffectOptions;
typedef struct Opt_PixelStretchEffectOptions Opt_PixelStretchEffectOptions;
typedef struct Ark_Position Ark_Position;
typedef struct Opt_Position Opt_Position;
typedef struct Ark_Rectangle Ark_Rectangle;
typedef struct Opt_Rectangle Opt_Rectangle;
typedef struct Ark_RectOptions Ark_RectOptions;
typedef struct Opt_RectOptions Opt_RectOptions;
typedef struct RestrictedWorkerPeer RestrictedWorkerPeer;
typedef struct RestrictedWorkerPeer* Ark_RestrictedWorker;
typedef struct Opt_RestrictedWorker Opt_RestrictedWorker;
typedef struct Ark_RichEditorChangeValue Ark_RichEditorChangeValue;
typedef struct Opt_RichEditorChangeValue Opt_RichEditorChangeValue;
typedef struct Ark_RichEditorSymbolSpanOptions Ark_RichEditorSymbolSpanOptions;
typedef struct Opt_RichEditorSymbolSpanOptions Opt_RichEditorSymbolSpanOptions;
typedef struct Ark_RichEditorTextStyleResult Ark_RichEditorTextStyleResult;
typedef struct Opt_RichEditorTextStyleResult Opt_RichEditorTextStyleResult;
typedef struct Ark_ScrollOptions Ark_ScrollOptions;
typedef struct Opt_ScrollOptions Opt_ScrollOptions;
typedef struct Ark_ScrollSnapOptions Ark_ScrollSnapOptions;
typedef struct Opt_ScrollSnapOptions Opt_ScrollSnapOptions;
typedef struct Ark_SearchButtonOptions Ark_SearchButtonOptions;
typedef struct Opt_SearchButtonOptions Opt_SearchButtonOptions;
typedef struct Ark_SearchOptions Ark_SearchOptions;
typedef struct Opt_SearchOptions Opt_SearchOptions;
typedef struct Ark_SelectOption Ark_SelectOption;
typedef struct Opt_SelectOption Opt_SelectOption;
typedef struct Ark_sharedTransitionOptions Ark_sharedTransitionOptions;
typedef struct Opt_sharedTransitionOptions Opt_sharedTransitionOptions;
typedef struct Ark_SheetTitleOptions Ark_SheetTitleOptions;
typedef struct Opt_SheetTitleOptions Opt_SheetTitleOptions;
typedef struct Ark_SizeOptions Ark_SizeOptions;
typedef struct Opt_SizeOptions Opt_SizeOptions;
typedef struct Ark_StyledStringChangeValue Ark_StyledStringChangeValue;
typedef struct Opt_StyledStringChangeValue Opt_StyledStringChangeValue;
typedef struct Ark_SwipeActionItem Ark_SwipeActionItem;
typedef struct Opt_SwipeActionItem Opt_SwipeActionItem;
typedef struct Ark_TabBarIconStyle Ark_TabBarIconStyle;
typedef struct Opt_TabBarIconStyle Opt_TabBarIconStyle;
typedef struct Ark_TextDecorationOptions Ark_TextDecorationOptions;
typedef struct Opt_TextDecorationOptions Opt_TextDecorationOptions;
typedef struct Ark_TextInputOptions Ark_TextInputOptions;
typedef struct Opt_TextInputOptions Opt_TextInputOptions;
typedef struct Ark_TextMenuItem Ark_TextMenuItem;
typedef struct Opt_TextMenuItem Opt_TextMenuItem;
typedef struct Ark_TextPickerOptions Ark_TextPickerOptions;
typedef struct Opt_TextPickerOptions Opt_TextPickerOptions;
typedef struct Ark_TextPickerResult Ark_TextPickerResult;
typedef struct Opt_TextPickerResult Opt_TextPickerResult;
typedef struct TextStyle_styled_stringPeer TextStyle_styled_stringPeer;
typedef struct TextStyle_styled_stringPeer* Ark_TextStyle_styled_string;
typedef struct Opt_TextStyle_styled_string Opt_TextStyle_styled_string;
typedef struct Ark_TextStyleInterface Ark_TextStyleInterface;
typedef struct Opt_TextStyleInterface Opt_TextStyleInterface;
typedef struct Ark_ToolbarItem Ark_ToolbarItem;
typedef struct Opt_ToolbarItem Opt_ToolbarItem;
typedef struct Ark_TransitionEffects Ark_TransitionEffects;
typedef struct Opt_TransitionEffects Opt_TransitionEffects;
typedef struct Ark_TransitionOptions Ark_TransitionOptions;
typedef struct Opt_TransitionOptions Opt_TransitionOptions;
typedef struct Ark_Type_NavDestinationAttribute_title_value Ark_Type_NavDestinationAttribute_title_value;
typedef struct Opt_Type_NavDestinationAttribute_title_value Opt_Type_NavDestinationAttribute_title_value;
typedef struct Ark_Type_NavigationAttribute_title_value Ark_Type_NavigationAttribute_title_value;
typedef struct Opt_Type_NavigationAttribute_title_value Opt_Type_NavigationAttribute_title_value;
typedef struct Ark_Type_SheetOptions_detents Ark_Type_SheetOptions_detents;
typedef struct Opt_Type_SheetOptions_detents Opt_Type_SheetOptions_detents;
typedef struct Ark_UnderlineColor Ark_UnderlineColor;
typedef struct Opt_UnderlineColor Opt_UnderlineColor;
typedef struct Ark_Union_Array_Rectangle_Rectangle Ark_Union_Array_Rectangle_Rectangle;
typedef struct Opt_Union_Array_Rectangle_Rectangle Opt_Union_Array_Rectangle_Rectangle;
typedef struct Ark_Union_ArrowStyle_Boolean Ark_Union_ArrowStyle_Boolean;
typedef struct Opt_Union_ArrowStyle_Boolean Opt_Union_ArrowStyle_Boolean;
typedef struct Ark_Union_Boolean_Literal_ResourceColor_color Ark_Union_Boolean_Literal_ResourceColor_color;
typedef struct Opt_Union_Boolean_Literal_ResourceColor_color Opt_Union_Boolean_Literal_ResourceColor_color;
typedef struct Ark_Union_BorderRadiuses_Length_LocalizedBorderRadiuses Ark_Union_BorderRadiuses_Length_LocalizedBorderRadiuses;
typedef struct Opt_Union_BorderRadiuses_Length_LocalizedBorderRadiuses Opt_Union_BorderRadiuses_Length_LocalizedBorderRadiuses;
typedef struct Ark_Union_CustomBuilder_SwipeActionItem Ark_Union_CustomBuilder_SwipeActionItem;
typedef struct Opt_Union_CustomBuilder_SwipeActionItem Opt_Union_CustomBuilder_SwipeActionItem;
typedef struct Ark_Union_Dimension_BorderRadiuses Ark_Union_Dimension_BorderRadiuses;
typedef struct Opt_Union_Dimension_BorderRadiuses Opt_Union_Dimension_BorderRadiuses;
typedef struct Ark_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses Ark_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Ark_Union_Dimension_EdgeOutlineWidths Ark_Union_Dimension_EdgeOutlineWidths;
typedef struct Opt_Union_Dimension_EdgeOutlineWidths Opt_Union_Dimension_EdgeOutlineWidths;
typedef struct Ark_Union_Dimension_EdgeWidths_LocalizedEdgeWidths Ark_Union_Dimension_EdgeWidths_LocalizedEdgeWidths;
typedef struct Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths;
typedef struct Ark_Union_Dimension_LeadingMarginPlaceholder Ark_Union_Dimension_LeadingMarginPlaceholder;
typedef struct Opt_Union_Dimension_LeadingMarginPlaceholder Opt_Union_Dimension_LeadingMarginPlaceholder;
typedef struct Ark_Union_Dimension_Margin Ark_Union_Dimension_Margin;
typedef struct Opt_Union_Dimension_Margin Opt_Union_Dimension_Margin;
typedef struct Ark_Union_Dimension_OutlineRadiuses Ark_Union_Dimension_OutlineRadiuses;
typedef struct Opt_Union_Dimension_OutlineRadiuses Opt_Union_Dimension_OutlineRadiuses;
typedef struct Ark_Union_EdgeColors_ResourceColor_LocalizedEdgeColors Ark_Union_EdgeColors_ResourceColor_LocalizedEdgeColors;
typedef struct Opt_Union_EdgeColors_ResourceColor_LocalizedEdgeColors Opt_Union_EdgeColors_ResourceColor_LocalizedEdgeColors;
typedef struct Ark_Union_EdgeOutlineWidths_Dimension Ark_Union_EdgeOutlineWidths_Dimension;
typedef struct Opt_Union_EdgeOutlineWidths_Dimension Opt_Union_EdgeOutlineWidths_Dimension;
typedef struct Ark_Union_EdgeWidths_Length_LocalizedEdgeWidths Ark_Union_EdgeWidths_Length_LocalizedEdgeWidths;
typedef struct Opt_Union_EdgeWidths_Length_LocalizedEdgeWidths Opt_Union_EdgeWidths_Length_LocalizedEdgeWidths;
typedef struct Ark_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths Ark_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths;
typedef struct Opt_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths Opt_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths;
typedef struct Ark_Union_IconOptions_SymbolGlyphModifier Ark_Union_IconOptions_SymbolGlyphModifier;
typedef struct Opt_Union_IconOptions_SymbolGlyphModifier Opt_Union_IconOptions_SymbolGlyphModifier;
typedef struct Ark_Union_Length_BorderRadiuses Ark_Union_Length_BorderRadiuses;
typedef struct Opt_Union_Length_BorderRadiuses Opt_Union_Length_BorderRadiuses;
typedef struct Ark_Union_Length_BorderRadiuses_LocalizedBorderRadiuses Ark_Union_Length_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Ark_Union_Length_EdgeWidths_LocalizedEdgeWidths Ark_Union_Length_EdgeWidths_LocalizedEdgeWidths;
typedef struct Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths;
typedef struct Ark_Union_LengthMetrics_BorderRadiuses Ark_Union_LengthMetrics_BorderRadiuses;
typedef struct Opt_Union_LengthMetrics_BorderRadiuses Opt_Union_LengthMetrics_BorderRadiuses;
typedef struct Ark_Union_LengthMetrics_LeadingMarginPlaceholder Ark_Union_LengthMetrics_LeadingMarginPlaceholder;
typedef struct Opt_Union_LengthMetrics_LeadingMarginPlaceholder Opt_Union_LengthMetrics_LeadingMarginPlaceholder;
typedef struct Ark_Union_LengthMetrics_Margin Ark_Union_LengthMetrics_Margin;
typedef struct Opt_Union_LengthMetrics_Margin Opt_Union_LengthMetrics_Margin;
typedef struct Ark_Union_LengthMetrics_Padding Ark_Union_LengthMetrics_Padding;
typedef struct Opt_Union_LengthMetrics_Padding Opt_Union_LengthMetrics_Padding;
typedef struct Ark_Union_Margin_Length_LocalizedMargin Ark_Union_Margin_Length_LocalizedMargin;
typedef struct Opt_Union_Margin_Length_LocalizedMargin Opt_Union_Margin_Length_LocalizedMargin;
typedef struct Ark_Union_NavDestinationContext_NavBar Ark_Union_NavDestinationContext_NavBar;
typedef struct Opt_Union_NavDestinationContext_NavBar Opt_Union_NavDestinationContext_NavBar;
typedef struct Ark_Union_Number_LeadingMarginPlaceholder Ark_Union_Number_LeadingMarginPlaceholder;
typedef struct Opt_Union_Number_LeadingMarginPlaceholder Opt_Union_Number_LeadingMarginPlaceholder;
typedef struct Ark_Union_OutlineRadiuses_Dimension Ark_Union_OutlineRadiuses_Dimension;
typedef struct Opt_Union_OutlineRadiuses_Dimension Opt_Union_OutlineRadiuses_Dimension;
typedef struct Ark_Union_Padding_Dimension Ark_Union_Padding_Dimension;
typedef struct Opt_Union_Padding_Dimension Opt_Union_Padding_Dimension;
typedef struct Ark_Union_Padding_Dimension_LocalizedPadding Ark_Union_Padding_Dimension_LocalizedPadding;
typedef struct Opt_Union_Padding_Dimension_LocalizedPadding Opt_Union_Padding_Dimension_LocalizedPadding;
typedef struct Ark_Union_Padding_Length_LocalizedPadding Ark_Union_Padding_Length_LocalizedPadding;
typedef struct Opt_Union_Padding_Length_LocalizedPadding Opt_Union_Padding_Length_LocalizedPadding;
typedef struct Ark_Union_Padding_LengthMetrics_LocalizedPadding Ark_Union_Padding_LengthMetrics_LocalizedPadding;
typedef struct Opt_Union_Padding_LengthMetrics_LocalizedPadding Opt_Union_Padding_LengthMetrics_LocalizedPadding;
typedef struct Ark_Union_Position_Alignment Ark_Union_Position_Alignment;
typedef struct Opt_Union_Position_Alignment Opt_Union_Position_Alignment;
typedef struct Ark_Union_Position_Edges_LocalizedEdges Ark_Union_Position_Edges_LocalizedEdges;
typedef struct Opt_Union_Position_Edges_LocalizedEdges Opt_Union_Position_Edges_LocalizedEdges;
typedef struct Ark_Union_Position_LocalizedPosition Ark_Union_Position_LocalizedPosition;
typedef struct Opt_Union_Position_LocalizedPosition Opt_Union_Position_LocalizedPosition;
typedef struct Ark_Union_RectOptions_RoundedRectOptions Ark_Union_RectOptions_RoundedRectOptions;
typedef struct Opt_Union_RectOptions_RoundedRectOptions Opt_Union_RectOptions_RoundedRectOptions;
typedef struct Ark_Union_ResourceColor_EdgeColors_LocalizedEdgeColors Ark_Union_ResourceColor_EdgeColors_LocalizedEdgeColors;
typedef struct Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors;
typedef struct Ark_Union_ResourceColor_UnderlineColor Ark_Union_ResourceColor_UnderlineColor;
typedef struct Opt_Union_ResourceColor_UnderlineColor Opt_Union_ResourceColor_UnderlineColor;
typedef struct Ark_Union_SheetTitleOptions_CustomBuilder Ark_Union_SheetTitleOptions_CustomBuilder;
typedef struct Opt_Union_SheetTitleOptions_CustomBuilder Opt_Union_SheetTitleOptions_CustomBuilder;
typedef struct Ark_Union_SizeOptions_ImageSize Ark_Union_SizeOptions_ImageSize;
typedef struct Opt_Union_SizeOptions_ImageSize Opt_Union_SizeOptions_ImageSize;
typedef struct Ark_Union_TransitionOptions_TransitionEffect Ark_Union_TransitionOptions_TransitionEffect;
typedef struct Opt_Union_TransitionOptions_TransitionEffect Opt_Union_TransitionOptions_TransitionEffect;
typedef struct Ark_Union_Union_Padding_Dimension_LocalizedPadding Ark_Union_Union_Padding_Dimension_LocalizedPadding;
typedef struct Opt_Union_Union_Padding_Dimension_LocalizedPadding Opt_Union_Union_Padding_Dimension_LocalizedPadding;
typedef struct Ark_AlertDialogParamWithButtons Ark_AlertDialogParamWithButtons;
typedef struct Opt_AlertDialogParamWithButtons Opt_AlertDialogParamWithButtons;
typedef struct Ark_AlertDialogParamWithConfirm Ark_AlertDialogParamWithConfirm;
typedef struct Opt_AlertDialogParamWithConfirm Opt_AlertDialogParamWithConfirm;
typedef struct Ark_AlertDialogParamWithOptions Ark_AlertDialogParamWithOptions;
typedef struct Opt_AlertDialogParamWithOptions Opt_AlertDialogParamWithOptions;
typedef struct Ark_Area Ark_Area;
typedef struct Opt_Area Opt_Area;
typedef struct Ark_BorderImageOption Ark_BorderImageOption;
typedef struct Opt_BorderImageOption Opt_BorderImageOption;
typedef struct Ark_BorderOptions Ark_BorderOptions;
typedef struct Opt_BorderOptions Opt_BorderOptions;
typedef struct Ark_ButtonLabelStyle Ark_ButtonLabelStyle;
typedef struct Opt_ButtonLabelStyle Opt_ButtonLabelStyle;
typedef struct Ark_CancelButtonOptions Ark_CancelButtonOptions;
typedef struct Opt_CancelButtonOptions Opt_CancelButtonOptions;
typedef struct Ark_ContextMenuOptions Ark_ContextMenuOptions;
typedef struct Opt_ContextMenuOptions Opt_ContextMenuOptions;
typedef struct Ark_CustomPopupOptions Ark_CustomPopupOptions;
typedef struct Opt_CustomPopupOptions Opt_CustomPopupOptions;
typedef struct Ark_DigitIndicator Ark_DigitIndicator;
typedef struct Opt_DigitIndicator Opt_DigitIndicator;
typedef struct Ark_EventTarget Ark_EventTarget;
typedef struct Opt_EventTarget Opt_EventTarget;
typedef struct Ark_GeometryInfo Ark_GeometryInfo;
typedef struct Opt_GeometryInfo Opt_GeometryInfo;
typedef struct GestureEventPeer GestureEventPeer;
typedef struct GestureEventPeer* Ark_GestureEvent;
typedef struct Opt_GestureEvent Opt_GestureEvent;
typedef struct HoverEventPeer HoverEventPeer;
typedef struct HoverEventPeer* Ark_HoverEvent;
typedef struct Opt_HoverEvent Opt_HoverEvent;
typedef struct Ark_ImageAttachmentLayoutStyle Ark_ImageAttachmentLayoutStyle;
typedef struct Opt_ImageAttachmentLayoutStyle Opt_ImageAttachmentLayoutStyle;
typedef struct LongPressGestureEventPeer LongPressGestureEventPeer;
typedef struct LongPressGestureEventPeer* Ark_LongPressGestureEvent;
typedef struct Opt_LongPressGestureEvent Opt_LongPressGestureEvent;
typedef struct Ark_MenuOptions Ark_MenuOptions;
typedef struct Opt_MenuOptions Opt_MenuOptions;
typedef struct MouseEventPeer MouseEventPeer;
typedef struct MouseEventPeer* Ark_MouseEvent;
typedef struct Opt_MouseEvent Opt_MouseEvent;
typedef struct Ark_OutlineOptions Ark_OutlineOptions;
typedef struct Opt_OutlineOptions Opt_OutlineOptions;
typedef struct PanGestureEventPeer PanGestureEventPeer;
typedef struct PanGestureEventPeer* Ark_PanGestureEvent;
typedef struct Opt_PanGestureEvent Opt_PanGestureEvent;
typedef struct ParagraphStylePeer ParagraphStylePeer;
typedef struct ParagraphStylePeer* Ark_ParagraphStyle;
typedef struct Opt_ParagraphStyle Opt_ParagraphStyle;
typedef struct Ark_ParagraphStyleInterface Ark_ParagraphStyleInterface;
typedef struct Opt_ParagraphStyleInterface Opt_ParagraphStyleInterface;
typedef struct Ark_PickerDialogButtonStyle Ark_PickerDialogButtonStyle;
typedef struct Opt_PickerDialogButtonStyle Opt_PickerDialogButtonStyle;
typedef struct Ark_PickerTextStyle Ark_PickerTextStyle;
typedef struct Opt_PickerTextStyle Opt_PickerTextStyle;
typedef struct PinchGestureEventPeer PinchGestureEventPeer;
typedef struct PinchGestureEventPeer* Ark_PinchGestureEvent;
typedef struct Opt_PinchGestureEvent Opt_PinchGestureEvent;
typedef struct Ark_PlaceholderStyle Ark_PlaceholderStyle;
typedef struct Opt_PlaceholderStyle Opt_PlaceholderStyle;
typedef struct Ark_PointLightStyle Ark_PointLightStyle;
typedef struct Opt_PointLightStyle Opt_PointLightStyle;
typedef struct Ark_PopupMessageOptions Ark_PopupMessageOptions;
typedef struct Opt_PopupMessageOptions Opt_PopupMessageOptions;
typedef struct Ark_ResizableOptions Ark_ResizableOptions;
typedef struct Opt_ResizableOptions Opt_ResizableOptions;
typedef struct Ark_RichEditorLayoutStyle Ark_RichEditorLayoutStyle;
typedef struct Opt_RichEditorLayoutStyle Opt_RichEditorLayoutStyle;
typedef struct Ark_RichEditorParagraphStyle Ark_RichEditorParagraphStyle;
typedef struct Opt_RichEditorParagraphStyle Opt_RichEditorParagraphStyle;
typedef struct Ark_RichEditorParagraphStyleOptions Ark_RichEditorParagraphStyleOptions;
typedef struct Opt_RichEditorParagraphStyleOptions Opt_RichEditorParagraphStyleOptions;
typedef struct Ark_RichEditorTextStyle Ark_RichEditorTextStyle;
typedef struct Opt_RichEditorTextStyle Opt_RichEditorTextStyle;
typedef struct Ark_RichEditorUpdateTextSpanStyleOptions Ark_RichEditorUpdateTextSpanStyleOptions;
typedef struct Opt_RichEditorUpdateTextSpanStyleOptions Opt_RichEditorUpdateTextSpanStyleOptions;
typedef struct RotationGestureEventPeer RotationGestureEventPeer;
typedef struct RotationGestureEventPeer* Ark_RotationGestureEvent;
typedef struct Opt_RotationGestureEvent Opt_RotationGestureEvent;
typedef struct Ark_SheetOptions Ark_SheetOptions;
typedef struct Opt_SheetOptions Opt_SheetOptions;
typedef struct Ark_SwipeActionOptions Ark_SwipeActionOptions;
typedef struct Opt_SwipeActionOptions Opt_SwipeActionOptions;
typedef struct SwipeGestureEventPeer SwipeGestureEventPeer;
typedef struct SwipeGestureEventPeer* Ark_SwipeGestureEvent;
typedef struct Opt_SwipeGestureEvent Opt_SwipeGestureEvent;
typedef struct TapGestureEventPeer TapGestureEventPeer;
typedef struct TapGestureEventPeer* Ark_TapGestureEvent;
typedef struct Opt_TapGestureEvent Opt_TapGestureEvent;
typedef struct Ark_TextBackgroundStyle Ark_TextBackgroundStyle;
typedef struct Opt_TextBackgroundStyle Opt_TextBackgroundStyle;
typedef struct Ark_TextDataDetectorConfig Ark_TextDataDetectorConfig;
typedef struct Opt_TextDataDetectorConfig Opt_TextDataDetectorConfig;
typedef struct TouchEventPeer TouchEventPeer;
typedef struct TouchEventPeer* Ark_TouchEvent;
typedef struct Opt_TouchEvent Opt_TouchEvent;
typedef struct Ark_Type_AlertDialog_show_value Ark_Type_AlertDialog_show_value;
typedef struct Opt_Type_AlertDialog_show_value Opt_Type_AlertDialog_show_value;
typedef struct Ark_Union_CancelButtonOptions_CancelButtonSymbolOptions Ark_Union_CancelButtonOptions_CancelButtonSymbolOptions;
typedef struct Opt_Union_CancelButtonOptions_CancelButtonSymbolOptions Opt_Union_CancelButtonOptions_CancelButtonSymbolOptions;
typedef struct Ark_Union_DotIndicator_DigitIndicator Ark_Union_DotIndicator_DigitIndicator;
typedef struct Opt_Union_DotIndicator_DigitIndicator Opt_Union_DotIndicator_DigitIndicator;
typedef struct Ark_Union_DotIndicator_DigitIndicator_Boolean Ark_Union_DotIndicator_DigitIndicator_Boolean;
typedef struct Opt_Union_DotIndicator_DigitIndicator_Boolean Opt_Union_DotIndicator_DigitIndicator_Boolean;
typedef struct AccessibilityHoverEventPeer AccessibilityHoverEventPeer;
typedef struct AccessibilityHoverEventPeer* Ark_AccessibilityHoverEvent;
typedef struct Opt_AccessibilityHoverEvent Opt_AccessibilityHoverEvent;
typedef struct BackgroundColorStylePeer BackgroundColorStylePeer;
typedef struct BackgroundColorStylePeer* Ark_BackgroundColorStyle;
typedef struct Opt_BackgroundColorStyle Opt_BackgroundColorStyle;
typedef struct BaseEventPeer BaseEventPeer;
typedef struct BaseEventPeer* Ark_BaseEvent;
typedef struct Opt_BaseEvent Opt_BaseEvent;
typedef struct BaseGestureEventPeer BaseGestureEventPeer;
typedef struct BaseGestureEventPeer* Ark_BaseGestureEvent;
typedef struct Opt_BaseGestureEvent Opt_BaseGestureEvent;
typedef struct Ark_BottomTabBarStyle Ark_BottomTabBarStyle;
typedef struct Opt_BottomTabBarStyle Opt_BottomTabBarStyle;
typedef struct ClickEventPeer ClickEventPeer;
typedef struct ClickEventPeer* Ark_ClickEvent;
typedef struct Opt_ClickEvent Opt_ClickEvent;
typedef struct ImageAttachmentPeer ImageAttachmentPeer;
typedef struct ImageAttachmentPeer* Ark_ImageAttachment;
typedef struct Opt_ImageAttachment Opt_ImageAttachment;
typedef struct Ark_ImageAttachmentInterface Ark_ImageAttachmentInterface;
typedef struct Opt_ImageAttachmentInterface Opt_ImageAttachmentInterface;
typedef struct Ark_PopupOptions Ark_PopupOptions;
typedef struct Opt_PopupOptions Opt_PopupOptions;
typedef struct Ark_RichEditorImageSpanStyle Ark_RichEditorImageSpanStyle;
typedef struct Opt_RichEditorImageSpanStyle Opt_RichEditorImageSpanStyle;
typedef struct Ark_RichEditorImageSpanStyleResult Ark_RichEditorImageSpanStyleResult;
typedef struct Opt_RichEditorImageSpanStyleResult Opt_RichEditorImageSpanStyleResult;
typedef struct Ark_RichEditorParagraphResult Ark_RichEditorParagraphResult;
typedef struct Opt_RichEditorParagraphResult Opt_RichEditorParagraphResult;
typedef struct Ark_RichEditorTextSpanOptions Ark_RichEditorTextSpanOptions;
typedef struct Opt_RichEditorTextSpanOptions Opt_RichEditorTextSpanOptions;
typedef struct Ark_RichEditorTextSpanResult Ark_RichEditorTextSpanResult;
typedef struct Opt_RichEditorTextSpanResult Opt_RichEditorTextSpanResult;
typedef struct Ark_RichEditorUpdateImageSpanStyleOptions Ark_RichEditorUpdateImageSpanStyleOptions;
typedef struct Opt_RichEditorUpdateImageSpanStyleOptions Opt_RichEditorUpdateImageSpanStyleOptions;
typedef struct Ark_StyledStringValue Ark_StyledStringValue;
typedef struct Opt_StyledStringValue Opt_StyledStringValue;
typedef struct Ark_StyleOptions Ark_StyleOptions;
typedef struct Opt_StyleOptions Opt_StyleOptions;
typedef struct Ark_SubTabBarStyle Ark_SubTabBarStyle;
typedef struct Opt_SubTabBarStyle Opt_SubTabBarStyle;
typedef struct Ark_TextPickerDialogOptions Ark_TextPickerDialogOptions;
typedef struct Opt_TextPickerDialogOptions Opt_TextPickerDialogOptions;
typedef struct Ark_Type_RichEditorController_updateSpanStyle_value Ark_Type_RichEditorController_updateSpanStyle_value;
typedef struct Opt_Type_RichEditorController_updateSpanStyle_value Opt_Type_RichEditorController_updateSpanStyle_value;
typedef struct Ark_Union_PopupOptions_CustomPopupOptions Ark_Union_PopupOptions_CustomPopupOptions;
typedef struct Opt_Union_PopupOptions_CustomPopupOptions Opt_Union_PopupOptions_CustomPopupOptions;
typedef struct Ark_Union_String_ImageAttachment_CustomSpan Ark_Union_String_ImageAttachment_CustomSpan;
typedef struct Opt_Union_String_ImageAttachment_CustomSpan Opt_Union_String_ImageAttachment_CustomSpan;
typedef struct Ark_Union_SubTabBarStyle_BottomTabBarStyle Ark_Union_SubTabBarStyle_BottomTabBarStyle;
typedef struct Opt_Union_SubTabBarStyle_BottomTabBarStyle Opt_Union_SubTabBarStyle_BottomTabBarStyle;
typedef struct Ark_RichEditorImageSpanOptions Ark_RichEditorImageSpanOptions;
typedef struct Opt_RichEditorImageSpanOptions Opt_RichEditorImageSpanOptions;
typedef struct Ark_RichEditorImageSpanResult Ark_RichEditorImageSpanResult;
typedef struct Opt_RichEditorImageSpanResult Opt_RichEditorImageSpanResult;
typedef struct Ark_SpanStyle Ark_SpanStyle;
typedef struct Opt_SpanStyle Opt_SpanStyle;
typedef struct Ark_Union_RichEditorImageSpanResult_RichEditorTextSpanResult Ark_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Opt_Union_RichEditorImageSpanResult_RichEditorTextSpanResult Opt_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Ark_Union_RichEditorTextSpanResult_RichEditorImageSpanResult Ark_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef struct Opt_Union_RichEditorTextSpanResult_RichEditorImageSpanResult Opt_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef Ark_Object Ark_ContentModifier;
typedef Opt_Object Opt_ContentModifier;
typedef enum Ark_AccessibilityHoverType {
    ARK_ACCESSIBILITY_HOVER_TYPE_HOVER_ENTER = 0,
    ARK_ACCESSIBILITY_HOVER_TYPE_HOVER_MOVE = 1,
    ARK_ACCESSIBILITY_HOVER_TYPE_HOVER_EXIT = 2,
    ARK_ACCESSIBILITY_HOVER_TYPE_HOVER_CANCEL = 3,
} Ark_AccessibilityHoverType;
typedef struct Opt_AccessibilityHoverType {
    Ark_Tag tag;
    Ark_AccessibilityHoverType value;
} Opt_AccessibilityHoverType;
typedef enum Ark_AdaptiveColor {
    ARK_ADAPTIVE_COLOR_DEFAULT = 0,
    ARK_ADAPTIVE_COLOR_AVERAGE = 1,
} Ark_AdaptiveColor;
typedef struct Opt_AdaptiveColor {
    Ark_Tag tag;
    Ark_AdaptiveColor value;
} Opt_AdaptiveColor;
typedef enum Ark_Alignment {
    ARK_ALIGNMENT_TOP_START = 0,
    ARK_ALIGNMENT_TOP = 1,
    ARK_ALIGNMENT_TOP_END = 2,
    ARK_ALIGNMENT_START = 3,
    ARK_ALIGNMENT_CENTER = 4,
    ARK_ALIGNMENT_END = 5,
    ARK_ALIGNMENT_BOTTOM_START = 6,
    ARK_ALIGNMENT_BOTTOM = 7,
    ARK_ALIGNMENT_BOTTOM_END = 8,
} Ark_Alignment;
typedef struct Opt_Alignment {
    Ark_Tag tag;
    Ark_Alignment value;
} Opt_Alignment;
typedef enum Ark_AnimationStatus {
    ARK_ANIMATION_STATUS_INITIAL = 0,
    ARK_ANIMATION_STATUS_RUNNING = 1,
    ARK_ANIMATION_STATUS_PAUSED = 2,
    ARK_ANIMATION_STATUS_STOPPED = 3,
} Ark_AnimationStatus;
typedef struct Opt_AnimationStatus {
    Ark_Tag tag;
    Ark_AnimationStatus value;
} Opt_AnimationStatus;
typedef enum Ark_AppRotation {
    ARK_APP_ROTATION_ROTATION_0 = 0,
    ARK_APP_ROTATION_ROTATION_90 = 1,
    ARK_APP_ROTATION_ROTATION_180 = 2,
    ARK_APP_ROTATION_ROTATION_270 = 3,
} Ark_AppRotation;
typedef struct Opt_AppRotation {
    Ark_Tag tag;
    Ark_AppRotation value;
} Opt_AppRotation;
typedef enum Ark_ArrowPointPosition {
    ARK_ARROW_POINT_POSITION_START,
    ARK_ARROW_POINT_POSITION_CENTER,
    ARK_ARROW_POINT_POSITION_END,
} Ark_ArrowPointPosition;
typedef struct Opt_ArrowPointPosition {
    Ark_Tag tag;
    Ark_ArrowPointPosition value;
} Opt_ArrowPointPosition;
typedef enum Ark_Axis {
    ARK_AXIS_VERTICAL = 0,
    ARK_AXIS_HORIZONTAL = 1,
} Ark_Axis;
typedef struct Opt_Axis {
    Ark_Tag tag;
    Ark_Axis value;
} Opt_Axis;
typedef enum Ark_BarMode {
    ARK_BAR_MODE_SCROLLABLE = 0,
    ARK_BAR_MODE_FIXED = 1,
} Ark_BarMode;
typedef struct Opt_BarMode {
    Ark_Tag tag;
    Ark_BarMode value;
} Opt_BarMode;
typedef enum Ark_BarPosition {
    ARK_BAR_POSITION_START = 0,
    ARK_BAR_POSITION_END = 1,
} Ark_BarPosition;
typedef struct Opt_BarPosition {
    Ark_Tag tag;
    Ark_BarPosition value;
} Opt_BarPosition;
typedef enum Ark_BarState {
    ARK_BAR_STATE_OFF = 0,
    ARK_BAR_STATE_AUTO = 1,
    ARK_BAR_STATE_ON = 2,
} Ark_BarState;
typedef struct Opt_BarState {
    Ark_Tag tag;
    Ark_BarState value;
} Opt_BarState;
typedef enum Ark_BarStyle {
    ARK_BAR_STYLE_STANDARD = 0,
    ARK_BAR_STYLE_STACK = 1,
} Ark_BarStyle;
typedef struct Opt_BarStyle {
    Ark_Tag tag;
    Ark_BarStyle value;
} Opt_BarStyle;
typedef enum Ark_BlendApplyType {
    ARK_BLEND_APPLY_TYPE_FAST = 0,
    ARK_BLEND_APPLY_TYPE_OFFSCREEN = 1,
} Ark_BlendApplyType;
typedef struct Opt_BlendApplyType {
    Ark_Tag tag;
    Ark_BlendApplyType value;
} Opt_BlendApplyType;
typedef enum Ark_BlendMode {
    ARK_BLEND_MODE_NONE = 0,
    ARK_BLEND_MODE_CLEAR = 1,
    ARK_BLEND_MODE_SRC = 2,
    ARK_BLEND_MODE_DST = 3,
    ARK_BLEND_MODE_SRC_OVER = 4,
    ARK_BLEND_MODE_DST_OVER = 5,
    ARK_BLEND_MODE_SRC_IN = 6,
    ARK_BLEND_MODE_DST_IN = 7,
    ARK_BLEND_MODE_SRC_OUT = 8,
    ARK_BLEND_MODE_DST_OUT = 9,
    ARK_BLEND_MODE_SRC_ATOP = 10,
    ARK_BLEND_MODE_DST_ATOP = 11,
    ARK_BLEND_MODE_XOR = 12,
    ARK_BLEND_MODE_PLUS = 13,
    ARK_BLEND_MODE_MODULATE = 14,
    ARK_BLEND_MODE_SCREEN = 15,
    ARK_BLEND_MODE_OVERLAY = 16,
    ARK_BLEND_MODE_DARKEN = 17,
    ARK_BLEND_MODE_LIGHTEN = 18,
    ARK_BLEND_MODE_COLOR_DODGE = 19,
    ARK_BLEND_MODE_COLOR_BURN = 20,
    ARK_BLEND_MODE_HARD_LIGHT = 21,
    ARK_BLEND_MODE_SOFT_LIGHT = 22,
    ARK_BLEND_MODE_DIFFERENCE = 23,
    ARK_BLEND_MODE_EXCLUSION = 24,
    ARK_BLEND_MODE_MULTIPLY = 25,
    ARK_BLEND_MODE_HUE = 26,
    ARK_BLEND_MODE_SATURATION = 27,
    ARK_BLEND_MODE_COLOR = 28,
    ARK_BLEND_MODE_LUMINOSITY = 29,
} Ark_BlendMode;
typedef struct Opt_BlendMode {
    Ark_Tag tag;
    Ark_BlendMode value;
} Opt_BlendMode;
typedef enum Ark_BlurStyle {
    ARK_BLUR_STYLE_THIN = 0,
    ARK_BLUR_STYLE_REGULAR = 1,
    ARK_BLUR_STYLE_THICK = 2,
    ARK_BLUR_STYLE_BACKGROUND_THIN = 3,
    ARK_BLUR_STYLE_BACKGROUND_REGULAR = 4,
    ARK_BLUR_STYLE_BACKGROUND_THICK = 5,
    ARK_BLUR_STYLE_BACKGROUND_ULTRA_THICK = 6,
    ARK_BLUR_STYLE_NONE = 7,
    ARK_BLUR_STYLE_COMPONENT_ULTRA_THIN = 8,
    ARK_BLUR_STYLE_COMPONENT_THIN = 9,
    ARK_BLUR_STYLE_COMPONENT_REGULAR = 10,
    ARK_BLUR_STYLE_COMPONENT_THICK = 11,
    ARK_BLUR_STYLE_COMPONENT_ULTRA_THICK = 12,
} Ark_BlurStyle;
typedef struct Opt_BlurStyle {
    Ark_Tag tag;
    Ark_BlurStyle value;
} Opt_BlurStyle;
typedef enum Ark_BlurStyleActivePolicy {
    ARK_BLUR_STYLE_ACTIVE_POLICY_FOLLOWS_WINDOW_ACTIVE_STATE = 0,
    ARK_BLUR_STYLE_ACTIVE_POLICY_ALWAYS_ACTIVE = 1,
    ARK_BLUR_STYLE_ACTIVE_POLICY_ALWAYS_INACTIVE = 2,
} Ark_BlurStyleActivePolicy;
typedef struct Opt_BlurStyleActivePolicy {
    Ark_Tag tag;
    Ark_BlurStyleActivePolicy value;
} Opt_BlurStyleActivePolicy;
typedef enum Ark_BorderStyle {
    ARK_BORDER_STYLE_DOTTED = 0,
    ARK_BORDER_STYLE_DASHED = 1,
    ARK_BORDER_STYLE_SOLID = 2,
} Ark_BorderStyle;
typedef struct Opt_BorderStyle {
    Ark_Tag tag;
    Ark_BorderStyle value;
} Opt_BorderStyle;
typedef enum Ark_ButtonRole {
    ARK_BUTTON_ROLE_NORMAL = 0,
    ARK_BUTTON_ROLE_ERROR = 1,
} Ark_ButtonRole;
typedef struct Opt_ButtonRole {
    Ark_Tag tag;
    Ark_ButtonRole value;
} Opt_ButtonRole;
typedef enum Ark_ButtonStyleMode {
    ARK_BUTTON_STYLE_MODE_NORMAL = 0,
    ARK_BUTTON_STYLE_MODE_EMPHASIZED = 1,
    ARK_BUTTON_STYLE_MODE_TEXTUAL = 2,
} Ark_ButtonStyleMode;
typedef struct Opt_ButtonStyleMode {
    Ark_Tag tag;
    Ark_ButtonStyleMode value;
} Opt_ButtonStyleMode;
typedef enum Ark_ButtonType {
    ARK_BUTTON_TYPE_CAPSULE = 0,
    ARK_BUTTON_TYPE_CIRCLE = 1,
    ARK_BUTTON_TYPE_NORMAL = 2,
    ARK_BUTTON_TYPE_ROUNDED_RECTANGLE = 3,
} Ark_ButtonType;
typedef struct Opt_ButtonType {
    Ark_Tag tag;
    Ark_ButtonType value;
} Opt_ButtonType;
typedef enum Ark_CalendarAlign {
    ARK_CALENDAR_ALIGN_START = 0,
    ARK_CALENDAR_ALIGN_CENTER = 1,
    ARK_CALENDAR_ALIGN_END = 2,
} Ark_CalendarAlign;
typedef struct Opt_CalendarAlign {
    Ark_Tag tag;
    Ark_CalendarAlign value;
} Opt_CalendarAlign;
typedef enum Ark_CancelButtonStyle {
    ARK_CANCEL_BUTTON_STYLE_CONSTANT = 0,
    ARK_CANCEL_BUTTON_STYLE_INVISIBLE = 1,
    ARK_CANCEL_BUTTON_STYLE_INPUT = 2,
} Ark_CancelButtonStyle;
typedef struct Opt_CancelButtonStyle {
    Ark_Tag tag;
    Ark_CancelButtonStyle value;
} Opt_CancelButtonStyle;
typedef enum Ark_ChainEdgeEffect {
    ARK_CHAIN_EDGE_EFFECT_DEFAULT = 0,
    ARK_CHAIN_EDGE_EFFECT_STRETCH = 1,
} Ark_ChainEdgeEffect;
typedef struct Opt_ChainEdgeEffect {
    Ark_Tag tag;
    Ark_ChainEdgeEffect value;
} Opt_ChainEdgeEffect;
typedef enum Ark_ChainStyle {
    ARK_CHAIN_STYLE_SPREAD = 0,
    ARK_CHAIN_STYLE_SPREAD_INSIDE = 1,
    ARK_CHAIN_STYLE_PACKED = 2,
} Ark_ChainStyle;
typedef struct Opt_ChainStyle {
    Ark_Tag tag;
    Ark_ChainStyle value;
} Opt_ChainStyle;
typedef enum Ark_CheckBoxShape {
    ARK_CHECK_BOX_SHAPE_CIRCLE = 0,
    ARK_CHECK_BOX_SHAPE_ROUNDED_SQUARE = 1,
} Ark_CheckBoxShape;
typedef struct Opt_CheckBoxShape {
    Ark_Tag tag;
    Ark_CheckBoxShape value;
} Opt_CheckBoxShape;
typedef enum Ark_ClickEffectLevel {
    ARK_CLICK_EFFECT_LEVEL_LIGHT = 0,
    ARK_CLICK_EFFECT_LEVEL_MIDDLE = 1,
    ARK_CLICK_EFFECT_LEVEL_HEAVY = 2,
} Ark_ClickEffectLevel;
typedef struct Opt_ClickEffectLevel {
    Ark_Tag tag;
    Ark_ClickEffectLevel value;
} Opt_ClickEffectLevel;
typedef enum Ark_Color {
    ARK_COLOR_WHITE = 0,
    ARK_COLOR_BLACK = 1,
    ARK_COLOR_BLUE = 2,
    ARK_COLOR_BROWN = 3,
    ARK_COLOR_GRAY = 4,
    ARK_COLOR_GREEN = 5,
    ARK_COLOR_GREY = 6,
    ARK_COLOR_ORANGE = 7,
    ARK_COLOR_PINK = 8,
    ARK_COLOR_RED = 9,
    ARK_COLOR_YELLOW = 10,
    ARK_COLOR_TRANSPARENT = 11,
} Ark_Color;
typedef struct Opt_Color {
    Ark_Tag tag;
    Ark_Color value;
} Opt_Color;
typedef enum Ark_ColoringStrategy {
    ARK_COLORING_STRATEGY_INVERT,
    ARK_COLORING_STRATEGY_AVERAGE,
    ARK_COLORING_STRATEGY_PRIMARY,
} Ark_ColoringStrategy;
typedef struct Opt_ColoringStrategy {
    Ark_Tag tag;
    Ark_ColoringStrategy value;
} Opt_ColoringStrategy;
typedef enum Ark_ContentClipMode {
    ARK_CONTENT_CLIP_MODE_CONTENT_ONLY = 0,
    ARK_CONTENT_CLIP_MODE_BOUNDARY = 1,
    ARK_CONTENT_CLIP_MODE_SAFE_AREA = 2,
} Ark_ContentClipMode;
typedef struct Opt_ContentClipMode {
    Ark_Tag tag;
    Ark_ContentClipMode value;
} Opt_ContentClipMode;
typedef enum Ark_ContentType {
    ARK_CONTENT_TYPE_USER_NAME = 0,
    ARK_CONTENT_TYPE_PASSWORD = 1,
    ARK_CONTENT_TYPE_NEW_PASSWORD = 2,
    ARK_CONTENT_TYPE_FULL_STREET_ADDRESS = 3,
    ARK_CONTENT_TYPE_HOUSE_NUMBER = 4,
    ARK_CONTENT_TYPE_DISTRICT_ADDRESS = 5,
    ARK_CONTENT_TYPE_CITY_ADDRESS = 6,
    ARK_CONTENT_TYPE_PROVINCE_ADDRESS = 7,
    ARK_CONTENT_TYPE_COUNTRY_ADDRESS = 8,
    ARK_CONTENT_TYPE_PERSON_FULL_NAME = 9,
    ARK_CONTENT_TYPE_PERSON_LAST_NAME = 10,
    ARK_CONTENT_TYPE_PERSON_FIRST_NAME = 11,
    ARK_CONTENT_TYPE_PHONE_NUMBER = 12,
    ARK_CONTENT_TYPE_PHONE_COUNTRY_CODE = 13,
    ARK_CONTENT_TYPE_FULL_PHONE_NUMBER = 14,
    ARK_CONTENT_TYPE_EMAIL_ADDRESS = 15,
    ARK_CONTENT_TYPE_BANK_CARD_NUMBER = 16,
    ARK_CONTENT_TYPE_ID_CARD_NUMBER = 17,
    ARK_CONTENT_TYPE_NICKNAME = 23,
    ARK_CONTENT_TYPE_DETAIL_INFO_WITHOUT_STREET = 24,
    ARK_CONTENT_TYPE_FORMAT_ADDRESS = 25,
} Ark_ContentType;
typedef struct Opt_ContentType {
    Ark_Tag tag;
    Ark_ContentType value;
} Opt_ContentType;
typedef enum Ark_ControlSize {
    ARK_CONTROL_SIZE_SMALL,
    ARK_CONTROL_SIZE_NORMAL,
} Ark_ControlSize;
typedef struct Opt_ControlSize {
    Ark_Tag tag;
    Ark_ControlSize value;
} Opt_ControlSize;
typedef enum Ark_CopyOptions {
    ARK_COPY_OPTIONS_NONE = 0,
    ARK_COPY_OPTIONS_IN_APP = 1,
    ARK_COPY_OPTIONS_LOCAL_DEVICE = 2,
    ARK_COPY_OPTIONS_CROSS_DEVICE = 3,
} Ark_CopyOptions;
typedef struct Opt_CopyOptions {
    Ark_Tag tag;
    Ark_CopyOptions value;
} Opt_CopyOptions;
typedef enum Ark_Curve {
    ARK_CURVE_LINEAR = 0,
    ARK_CURVE_EASE = 1,
    ARK_CURVE_EASE_IN = 2,
    ARK_CURVE_EASE_OUT = 3,
    ARK_CURVE_EASE_IN_OUT = 4,
    ARK_CURVE_FAST_OUT_SLOW_IN = 5,
    ARK_CURVE_LINEAR_OUT_SLOW_IN = 6,
    ARK_CURVE_FAST_OUT_LINEAR_IN = 7,
    ARK_CURVE_EXTREME_DECELERATION = 8,
    ARK_CURVE_SHARP = 9,
    ARK_CURVE_RHYTHM = 10,
    ARK_CURVE_SMOOTH = 11,
    ARK_CURVE_FRICTION = 12,
} Ark_Curve;
typedef struct Opt_Curve {
    Ark_Tag tag;
    Ark_Curve value;
} Opt_Curve;
typedef enum Ark_DialogAlignment {
    ARK_DIALOG_ALIGNMENT_TOP = 0,
    ARK_DIALOG_ALIGNMENT_CENTER = 1,
    ARK_DIALOG_ALIGNMENT_BOTTOM = 2,
    ARK_DIALOG_ALIGNMENT_DEFAULT = 3,
    ARK_DIALOG_ALIGNMENT_TOP_START = 4,
    ARK_DIALOG_ALIGNMENT_TOP_END = 5,
    ARK_DIALOG_ALIGNMENT_CENTER_START = 6,
    ARK_DIALOG_ALIGNMENT_CENTER_END = 7,
    ARK_DIALOG_ALIGNMENT_BOTTOM_START = 8,
    ARK_DIALOG_ALIGNMENT_BOTTOM_END = 9,
} Ark_DialogAlignment;
typedef struct Opt_DialogAlignment {
    Ark_Tag tag;
    Ark_DialogAlignment value;
} Opt_DialogAlignment;
typedef enum Ark_DialogButtonDirection {
    ARK_DIALOG_BUTTON_DIRECTION_AUTO = 0,
    ARK_DIALOG_BUTTON_DIRECTION_HORIZONTAL = 1,
    ARK_DIALOG_BUTTON_DIRECTION_VERTICAL = 2,
} Ark_DialogButtonDirection;
typedef struct Opt_DialogButtonDirection {
    Ark_Tag tag;
    Ark_DialogButtonDirection value;
} Opt_DialogButtonDirection;
typedef enum Ark_DialogButtonStyle {
    ARK_DIALOG_BUTTON_STYLE_DEFAULT = 0,
    ARK_DIALOG_BUTTON_STYLE_HIGHLIGHT = 1,
} Ark_DialogButtonStyle;
typedef struct Opt_DialogButtonStyle {
    Ark_Tag tag;
    Ark_DialogButtonStyle value;
} Opt_DialogButtonStyle;
typedef enum Ark_Direction {
    ARK_DIRECTION_LTR = 0,
    ARK_DIRECTION_RTL = 1,
    ARK_DIRECTION_AUTO = 2,
} Ark_Direction;
typedef struct Opt_Direction {
    Ark_Tag tag;
    Ark_Direction value;
} Opt_Direction;
typedef enum Ark_DismissReason {
    ARK_DISMISS_REASON_PRESS_BACK = 0,
    ARK_DISMISS_REASON_TOUCH_OUTSIDE = 1,
    ARK_DISMISS_REASON_CLOSE_BUTTON = 2,
    ARK_DISMISS_REASON_SLIDE_DOWN = 3,
} Ark_DismissReason;
typedef struct Opt_DismissReason {
    Ark_Tag tag;
    Ark_DismissReason value;
} Opt_DismissReason;
typedef enum Ark_DpiFollowStrategy {
    ARK_DPI_FOLLOW_STRATEGY_FOLLOW_HOST_DPI = 0,
    ARK_DPI_FOLLOW_STRATEGY_FOLLOW_UI_EXTENSION_ABILITY_DPI = 1,
} Ark_DpiFollowStrategy;
typedef struct Opt_DpiFollowStrategy {
    Ark_Tag tag;
    Ark_DpiFollowStrategy value;
} Opt_DpiFollowStrategy;
typedef enum Ark_DragBehavior {
    ARK_DRAG_BEHAVIOR_COPY = 0,
    ARK_DRAG_BEHAVIOR_MOVE = 1,
} Ark_DragBehavior;
typedef struct Opt_DragBehavior {
    Ark_Tag tag;
    Ark_DragBehavior value;
} Opt_DragBehavior;
typedef enum Ark_DragPreviewMode {
    ARK_DRAG_PREVIEW_MODE_AUTO = 1,
    ARK_DRAG_PREVIEW_MODE_DISABLE_SCALE = 2,
    ARK_DRAG_PREVIEW_MODE_ENABLE_DEFAULT_SHADOW = 3,
    ARK_DRAG_PREVIEW_MODE_ENABLE_DEFAULT_RADIUS = 4,
} Ark_DragPreviewMode;
typedef struct Opt_DragPreviewMode {
    Ark_Tag tag;
    Ark_DragPreviewMode value;
} Opt_DragPreviewMode;
typedef enum Ark_DragResult {
    ARK_DRAG_RESULT_DRAG_SUCCESSFUL = 0,
    ARK_DRAG_RESULT_DRAG_FAILED = 1,
    ARK_DRAG_RESULT_DRAG_CANCELED = 2,
    ARK_DRAG_RESULT_DROP_ENABLED = 3,
    ARK_DRAG_RESULT_DROP_DISABLED = 4,
} Ark_DragResult;
typedef struct Opt_DragResult {
    Ark_Tag tag;
    Ark_DragResult value;
} Opt_DragResult;
typedef enum Ark_DynamicRangeMode {
    ARK_DYNAMIC_RANGE_MODE_HIGH = 0,
    ARK_DYNAMIC_RANGE_MODE_CONSTRAINT = 1,
    ARK_DYNAMIC_RANGE_MODE_STANDARD = 2,
} Ark_DynamicRangeMode;
typedef struct Opt_DynamicRangeMode {
    Ark_Tag tag;
    Ark_DynamicRangeMode value;
} Opt_DynamicRangeMode;
typedef enum Ark_Edge {
    ARK_EDGE_TOP = 0,
    ARK_EDGE_CENTER = 1,
    ARK_EDGE_BOTTOM = 2,
    ARK_EDGE_BASELINE = 3,
    ARK_EDGE_START = 4,
    ARK_EDGE_MIDDLE = 5,
    ARK_EDGE_END = 6,
} Ark_Edge;
typedef struct Opt_Edge {
    Ark_Tag tag;
    Ark_Edge value;
} Opt_Edge;
typedef enum Ark_EdgeEffect {
    ARK_EDGE_EFFECT_SPRING = 0,
    ARK_EDGE_EFFECT_FADE = 1,
    ARK_EDGE_EFFECT_NONE = 2,
} Ark_EdgeEffect;
typedef struct Opt_EdgeEffect {
    Ark_Tag tag;
    Ark_EdgeEffect value;
} Opt_EdgeEffect;
typedef enum Ark_EditMode {
    ARK_EDIT_MODE_NONE = 0,
    ARK_EDIT_MODE_DELETABLE = 1,
    ARK_EDIT_MODE_MOVABLE = 2,
} Ark_EditMode;
typedef struct Opt_EditMode {
    Ark_Tag tag;
    Ark_EditMode value;
} Opt_EditMode;
typedef enum Ark_EffectDirection {
    ARK_EFFECT_DIRECTION_DOWN = 0,
    ARK_EFFECT_DIRECTION_UP = 1,
} Ark_EffectDirection;
typedef struct Opt_EffectDirection {
    Ark_Tag tag;
    Ark_EffectDirection value;
} Opt_EffectDirection;
typedef enum Ark_EffectFillStyle {
    ARK_EFFECT_FILL_STYLE_CUMULATIVE = 0,
    ARK_EFFECT_FILL_STYLE_ITERATIVE = 1,
} Ark_EffectFillStyle;
typedef struct Opt_EffectFillStyle {
    Ark_Tag tag;
    Ark_EffectFillStyle value;
} Opt_EffectFillStyle;
typedef enum Ark_EffectScope {
    ARK_EFFECT_SCOPE_LAYER = 0,
    ARK_EFFECT_SCOPE_WHOLE = 1,
} Ark_EffectScope;
typedef struct Opt_EffectScope {
    Ark_Tag tag;
    Ark_EffectScope value;
} Opt_EffectScope;
typedef enum Ark_EffectType {
    ARK_EFFECT_TYPE_DEFAULT = 0,
    ARK_EFFECT_TYPE_WINDOW_EFFECT = 1,
} Ark_EffectType;
typedef struct Opt_EffectType {
    Ark_Tag tag;
    Ark_EffectType value;
} Opt_EffectType;
typedef enum Ark_EllipsisMode {
    ARK_ELLIPSIS_MODE_START = 0,
    ARK_ELLIPSIS_MODE_CENTER = 1,
    ARK_ELLIPSIS_MODE_END = 2,
} Ark_EllipsisMode;
typedef struct Opt_EllipsisMode {
    Ark_Tag tag;
    Ark_EllipsisMode value;
} Opt_EllipsisMode;
typedef enum Ark_EmbeddedType {
    ARK_EMBEDDED_TYPE_EMBEDDED_UI_EXTENSION = 0,
} Ark_EmbeddedType;
typedef struct Opt_EmbeddedType {
    Ark_Tag tag;
    Ark_EmbeddedType value;
} Opt_EmbeddedType;
typedef enum Ark_EnterKeyType {
    ARK_ENTER_KEY_TYPE_GO = 2,
    ARK_ENTER_KEY_TYPE_SEARCH = 3,
    ARK_ENTER_KEY_TYPE_SEND = 4,
    ARK_ENTER_KEY_TYPE_NEXT = 5,
    ARK_ENTER_KEY_TYPE_DONE = 6,
    ARK_ENTER_KEY_TYPE_PREVIOUS = 7,
    ARK_ENTER_KEY_TYPE_NEW_LINE = 8,
} Ark_EnterKeyType;
typedef struct Opt_EnterKeyType {
    Ark_Tag tag;
    Ark_EnterKeyType value;
} Opt_EnterKeyType;
typedef enum Ark_EnumDTS {
    ARK_ENUM_DTS_ELEM_0 = 0,
    ARK_ENUM_DTS_ELEM_1 = 1,
    ARK_ENUM_DTS_ELEM_2 = 2,
} Ark_EnumDTS;
typedef struct Opt_EnumDTS {
    Ark_Tag tag;
    Ark_EnumDTS value;
} Opt_EnumDTS;
typedef enum Ark_FillMode {
    ARK_FILL_MODE_NONE = 0,
    ARK_FILL_MODE_FORWARDS = 1,
    ARK_FILL_MODE_BACKWARDS = 2,
    ARK_FILL_MODE_BOTH = 3,
} Ark_FillMode;
typedef struct Opt_FillMode {
    Ark_Tag tag;
    Ark_FillMode value;
} Opt_FillMode;
typedef enum Ark_FinishCallbackType {
    ARK_FINISH_CALLBACK_TYPE_REMOVED = 0,
    ARK_FINISH_CALLBACK_TYPE_LOGICALLY = 1,
} Ark_FinishCallbackType;
typedef struct Opt_FinishCallbackType {
    Ark_Tag tag;
    Ark_FinishCallbackType value;
} Opt_FinishCallbackType;
typedef enum Ark_FlexAlign {
    ARK_FLEX_ALIGN_START = 0,
    ARK_FLEX_ALIGN_CENTER = 1,
    ARK_FLEX_ALIGN_END = 2,
    ARK_FLEX_ALIGN_SPACE_BETWEEN = 3,
    ARK_FLEX_ALIGN_SPACE_AROUND = 4,
    ARK_FLEX_ALIGN_SPACE_EVENLY = 5,
} Ark_FlexAlign;
typedef struct Opt_FlexAlign {
    Ark_Tag tag;
    Ark_FlexAlign value;
} Opt_FlexAlign;
typedef enum Ark_FlexDirection {
    ARK_FLEX_DIRECTION_ROW = 0,
    ARK_FLEX_DIRECTION_COLUMN = 1,
    ARK_FLEX_DIRECTION_ROW_REVERSE = 2,
    ARK_FLEX_DIRECTION_COLUMN_REVERSE = 3,
} Ark_FlexDirection;
typedef struct Opt_FlexDirection {
    Ark_Tag tag;
    Ark_FlexDirection value;
} Opt_FlexDirection;
typedef enum Ark_FlexWrap {
    ARK_FLEX_WRAP_NO_WRAP = 0,
    ARK_FLEX_WRAP_WRAP = 1,
    ARK_FLEX_WRAP_WRAP_REVERSE = 2,
} Ark_FlexWrap;
typedef struct Opt_FlexWrap {
    Ark_Tag tag;
    Ark_FlexWrap value;
} Opt_FlexWrap;
typedef enum Ark_FocusPriority {
    ARK_FOCUS_PRIORITY_AUTO = 0,
    ARK_FOCUS_PRIORITY_PRIOR = 2000,
    ARK_FOCUS_PRIORITY_PREVIOUS = 3000,
} Ark_FocusPriority;
typedef struct Opt_FocusPriority {
    Ark_Tag tag;
    Ark_FocusPriority value;
} Opt_FocusPriority;
typedef enum Ark_FoldStatus {
    ARK_FOLD_STATUS_FOLD_STATUS_UNKNOWN = 0,
    ARK_FOLD_STATUS_FOLD_STATUS_EXPANDED = 1,
    ARK_FOLD_STATUS_FOLD_STATUS_FOLDED = 2,
    ARK_FOLD_STATUS_FOLD_STATUS_HALF_FOLDED = 3,
} Ark_FoldStatus;
typedef struct Opt_FoldStatus {
    Ark_Tag tag;
    Ark_FoldStatus value;
} Opt_FoldStatus;
typedef enum Ark_FontStyle {
    ARK_FONT_STYLE_NORMAL = 0,
    ARK_FONT_STYLE_ITALIC = 1,
} Ark_FontStyle;
typedef struct Opt_FontStyle {
    Ark_Tag tag;
    Ark_FontStyle value;
} Opt_FontStyle;
typedef enum Ark_FontWeight {
    ARK_FONT_WEIGHT_LIGHTER = 0,
    ARK_FONT_WEIGHT_NORMAL = 1,
    ARK_FONT_WEIGHT_REGULAR = 2,
    ARK_FONT_WEIGHT_MEDIUM = 3,
    ARK_FONT_WEIGHT_BOLD = 4,
    ARK_FONT_WEIGHT_BOLDER = 5,
} Ark_FontWeight;
typedef struct Opt_FontWeight {
    Ark_Tag tag;
    Ark_FontWeight value;
} Opt_FontWeight;
typedef enum Ark_FunctionKey {
    ARK_FUNCTION_KEY_ESC = 0,
    ARK_FUNCTION_KEY_F1 = 1,
    ARK_FUNCTION_KEY_F2 = 2,
    ARK_FUNCTION_KEY_F3 = 3,
    ARK_FUNCTION_KEY_F4 = 4,
    ARK_FUNCTION_KEY_F5 = 5,
    ARK_FUNCTION_KEY_F6 = 6,
    ARK_FUNCTION_KEY_F7 = 7,
    ARK_FUNCTION_KEY_F8 = 8,
    ARK_FUNCTION_KEY_F9 = 9,
    ARK_FUNCTION_KEY_F10 = 10,
    ARK_FUNCTION_KEY_F11 = 11,
    ARK_FUNCTION_KEY_F12 = 12,
    ARK_FUNCTION_KEY_TAB = 13,
    ARK_FUNCTION_KEY_DPAD_UP = 14,
    ARK_FUNCTION_KEY_DPAD_DOWN = 15,
    ARK_FUNCTION_KEY_DPAD_LEFT = 16,
    ARK_FUNCTION_KEY_DPAD_RIGHT = 17,
} Ark_FunctionKey;
typedef struct Opt_FunctionKey {
    Ark_Tag tag;
    Ark_FunctionKey value;
} Opt_FunctionKey;
typedef enum Ark_GestureControl_GestureType {
    ARK_GESTURE_CONTROL_GESTURE_TYPE_TAP_GESTURE = 0,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_LONG_PRESS_GESTURE = 1,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_PAN_GESTURE = 2,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_PINCH_GESTURE = 3,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_SWIPE_GESTURE = 4,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_ROTATION_GESTURE = 5,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_DRAG = 6,
    ARK_GESTURE_CONTROL_GESTURE_TYPE_CLICK = 7,
} Ark_GestureControl_GestureType;
typedef struct Opt_GestureControl_GestureType {
    Ark_Tag tag;
    Ark_GestureControl_GestureType value;
} Opt_GestureControl_GestureType;
typedef enum Ark_GestureJudgeResult {
    ARK_GESTURE_JUDGE_RESULT_CONTINUE = 0,
    ARK_GESTURE_JUDGE_RESULT_REJECT = 1,
} Ark_GestureJudgeResult;
typedef struct Opt_GestureJudgeResult {
    Ark_Tag tag;
    Ark_GestureJudgeResult value;
} Opt_GestureJudgeResult;
typedef enum Ark_GestureMask {
    ARK_GESTURE_MASK_NORMAL = 0,
    ARK_GESTURE_MASK_IGNORE_INTERNAL = 1,
} Ark_GestureMask;
typedef struct Opt_GestureMask {
    Ark_Tag tag;
    Ark_GestureMask value;
} Opt_GestureMask;
typedef enum Ark_GestureMode {
    ARK_GESTURE_MODE_SEQUENCE = 0,
    ARK_GESTURE_MODE_PARALLEL = 1,
    ARK_GESTURE_MODE_EXCLUSIVE = 2,
} Ark_GestureMode;
typedef struct Opt_GestureMode {
    Ark_Tag tag;
    Ark_GestureMode value;
} Opt_GestureMode;
typedef enum Ark_GesturePriority {
    ARK_GESTURE_PRIORITY_NORMAL = 0,
    ARK_GESTURE_PRIORITY_PRIORITY = 1,
} Ark_GesturePriority;
typedef struct Opt_GesturePriority {
    Ark_Tag tag;
    Ark_GesturePriority value;
} Opt_GesturePriority;
typedef enum Ark_GestureRecognizerState {
    ARK_GESTURE_RECOGNIZER_STATE_READY = 0,
    ARK_GESTURE_RECOGNIZER_STATE_DETECTING = 1,
    ARK_GESTURE_RECOGNIZER_STATE_PENDING = 2,
    ARK_GESTURE_RECOGNIZER_STATE_BLOCKED = 3,
    ARK_GESTURE_RECOGNIZER_STATE_SUCCESSFUL = 4,
    ARK_GESTURE_RECOGNIZER_STATE_FAILED = 5,
} Ark_GestureRecognizerState;
typedef struct Opt_GestureRecognizerState {
    Ark_Tag tag;
    Ark_GestureRecognizerState value;
} Opt_GestureRecognizerState;
typedef enum Ark_GradientDirection {
    ARK_GRADIENT_DIRECTION_LEFT = 0,
    ARK_GRADIENT_DIRECTION_TOP = 1,
    ARK_GRADIENT_DIRECTION_RIGHT = 2,
    ARK_GRADIENT_DIRECTION_BOTTOM = 3,
    ARK_GRADIENT_DIRECTION_LEFT_TOP = 4,
    ARK_GRADIENT_DIRECTION_LEFT_BOTTOM = 5,
    ARK_GRADIENT_DIRECTION_RIGHT_TOP = 6,
    ARK_GRADIENT_DIRECTION_RIGHT_BOTTOM = 7,
    ARK_GRADIENT_DIRECTION_NONE = 8,
} Ark_GradientDirection;
typedef struct Opt_GradientDirection {
    Ark_Tag tag;
    Ark_GradientDirection value;
} Opt_GradientDirection;
typedef enum Ark_HeightBreakpoint {
    ARK_HEIGHT_BREAKPOINT_HEIGHT_SM = 0,
    ARK_HEIGHT_BREAKPOINT_HEIGHT_MD = 1,
    ARK_HEIGHT_BREAKPOINT_HEIGHT_LG = 2,
} Ark_HeightBreakpoint;
typedef struct Opt_HeightBreakpoint {
    Ark_Tag tag;
    Ark_HeightBreakpoint value;
} Opt_HeightBreakpoint;
typedef enum Ark_HitTestMode {
    ARK_HIT_TEST_MODE_DEFAULT = 0,
    ARK_HIT_TEST_MODE_BLOCK = 1,
    ARK_HIT_TEST_MODE_TRANSPARENT = 2,
    ARK_HIT_TEST_MODE_NONE = 3,
} Ark_HitTestMode;
typedef struct Opt_HitTestMode {
    Ark_Tag tag;
    Ark_HitTestMode value;
} Opt_HitTestMode;
typedef enum Ark_HorizontalAlign {
    ARK_HORIZONTAL_ALIGN_START = 0,
    ARK_HORIZONTAL_ALIGN_CENTER = 1,
    ARK_HORIZONTAL_ALIGN_END = 2,
} Ark_HorizontalAlign;
typedef struct Opt_HorizontalAlign {
    Ark_Tag tag;
    Ark_HorizontalAlign value;
} Opt_HorizontalAlign;
typedef enum Ark_HoverEffect {
    ARK_HOVER_EFFECT_AUTO = 0,
    ARK_HOVER_EFFECT_SCALE = 1,
    ARK_HOVER_EFFECT_HIGHLIGHT = 2,
    ARK_HOVER_EFFECT_NONE = 3,
} Ark_HoverEffect;
typedef struct Opt_HoverEffect {
    Ark_Tag tag;
    Ark_HoverEffect value;
} Opt_HoverEffect;
typedef enum Ark_HoverModeAreaType {
    ARK_HOVER_MODE_AREA_TYPE_TOP_SCREEN = 0,
    ARK_HOVER_MODE_AREA_TYPE_BOTTOM_SCREEN = 1,
} Ark_HoverModeAreaType;
typedef struct Opt_HoverModeAreaType {
    Ark_Tag tag;
    Ark_HoverModeAreaType value;
} Opt_HoverModeAreaType;
typedef enum Ark_IlluminatedType {
    ARK_ILLUMINATED_TYPE_NONE = 0,
    ARK_ILLUMINATED_TYPE_BORDER = 1,
    ARK_ILLUMINATED_TYPE_CONTENT = 2,
    ARK_ILLUMINATED_TYPE_BORDER_CONTENT = 3,
    ARK_ILLUMINATED_TYPE_BLOOM_BORDER = 4,
    ARK_ILLUMINATED_TYPE_BLOOM_BORDER_CONTENT = 5,
} Ark_IlluminatedType;
typedef struct Opt_IlluminatedType {
    Ark_Tag tag;
    Ark_IlluminatedType value;
} Opt_IlluminatedType;
typedef enum Ark_ImageAnalyzerType {
    ARK_IMAGE_ANALYZER_TYPE_SUBJECT = 0,
    ARK_IMAGE_ANALYZER_TYPE_TEXT = 1,
    ARK_IMAGE_ANALYZER_TYPE_OBJECT_LOOKUP = 2,
} Ark_ImageAnalyzerType;
typedef struct Opt_ImageAnalyzerType {
    Ark_Tag tag;
    Ark_ImageAnalyzerType value;
} Opt_ImageAnalyzerType;
typedef enum Ark_ImageContent {
    ARK_IMAGE_CONTENT_EMPTY = 0,
} Ark_ImageContent;
typedef struct Opt_ImageContent {
    Ark_Tag tag;
    Ark_ImageContent value;
} Opt_ImageContent;
typedef enum Ark_ImageFit {
    ARK_IMAGE_FIT_CONTAIN = 0,
    ARK_IMAGE_FIT_COVER = 1,
    ARK_IMAGE_FIT_AUTO = 2,
    ARK_IMAGE_FIT_FILL = 3,
    ARK_IMAGE_FIT_SCALE_DOWN = 4,
    ARK_IMAGE_FIT_NONE = 5,
    ARK_IMAGE_FIT_TOP_START = 7,
    ARK_IMAGE_FIT_TOP = 8,
    ARK_IMAGE_FIT_TOP_END = 9,
    ARK_IMAGE_FIT_START = 10,
    ARK_IMAGE_FIT_CENTER = 11,
    ARK_IMAGE_FIT_END = 12,
    ARK_IMAGE_FIT_BOTTOM_START = 13,
    ARK_IMAGE_FIT_BOTTOM = 14,
    ARK_IMAGE_FIT_BOTTOM_END = 15,
} Ark_ImageFit;
typedef struct Opt_ImageFit {
    Ark_Tag tag;
    Ark_ImageFit value;
} Opt_ImageFit;
typedef enum Ark_ImageInterpolation {
    ARK_IMAGE_INTERPOLATION_NONE = 0,
    ARK_IMAGE_INTERPOLATION_LOW = 1,
    ARK_IMAGE_INTERPOLATION_MEDIUM = 2,
    ARK_IMAGE_INTERPOLATION_HIGH = 3,
} Ark_ImageInterpolation;
typedef struct Opt_ImageInterpolation {
    Ark_Tag tag;
    Ark_ImageInterpolation value;
} Opt_ImageInterpolation;
typedef enum Ark_ImageRenderMode {
    ARK_IMAGE_RENDER_MODE_ORIGINAL = 0,
    ARK_IMAGE_RENDER_MODE_TEMPLATE = 1,
} Ark_ImageRenderMode;
typedef struct Opt_ImageRenderMode {
    Ark_Tag tag;
    Ark_ImageRenderMode value;
} Opt_ImageRenderMode;
typedef enum Ark_ImageRepeat {
    ARK_IMAGE_REPEAT_NO_REPEAT = 0,
    ARK_IMAGE_REPEAT_X = 1,
    ARK_IMAGE_REPEAT_Y = 2,
    ARK_IMAGE_REPEAT_XY = 3,
} Ark_ImageRepeat;
typedef struct Opt_ImageRepeat {
    Ark_Tag tag;
    Ark_ImageRepeat value;
} Opt_ImageRepeat;
typedef enum Ark_ImageRotateOrientation {
    ARK_IMAGE_ROTATE_ORIENTATION_AUTO = 0,
    ARK_IMAGE_ROTATE_ORIENTATION_UP = 1,
    ARK_IMAGE_ROTATE_ORIENTATION_RIGHT = 2,
    ARK_IMAGE_ROTATE_ORIENTATION_DOWN = 3,
    ARK_IMAGE_ROTATE_ORIENTATION_LEFT = 4,
} Ark_ImageRotateOrientation;
typedef struct Opt_ImageRotateOrientation {
    Ark_Tag tag;
    Ark_ImageRotateOrientation value;
} Opt_ImageRotateOrientation;
typedef enum Ark_ImageSize {
    ARK_IMAGE_SIZE_AUTO = 0,
    ARK_IMAGE_SIZE_COVER = 1,
    ARK_IMAGE_SIZE_CONTAIN = 2,
    ARK_IMAGE_SIZE_FILL = 3,
} Ark_ImageSize;
typedef struct Opt_ImageSize {
    Ark_Tag tag;
    Ark_ImageSize value;
} Opt_ImageSize;
typedef enum Ark_ImageSpanAlignment {
    ARK_IMAGE_SPAN_ALIGNMENT_BASELINE = 0,
    ARK_IMAGE_SPAN_ALIGNMENT_BOTTOM = 1,
    ARK_IMAGE_SPAN_ALIGNMENT_CENTER = 2,
    ARK_IMAGE_SPAN_ALIGNMENT_TOP = 3,
} Ark_ImageSpanAlignment;
typedef struct Opt_ImageSpanAlignment {
    Ark_Tag tag;
    Ark_ImageSpanAlignment value;
} Opt_ImageSpanAlignment;
typedef enum Ark_InputType {
    ARK_INPUT_TYPE_NORMAL = 0,
    ARK_INPUT_TYPE_NUMBER = 1,
    ARK_INPUT_TYPE_PHONE_NUMBER = 2,
    ARK_INPUT_TYPE_EMAIL = 3,
    ARK_INPUT_TYPE_PASSWORD = 4,
    ARK_INPUT_TYPE_NUMBER_PASSWORD = 8,
    ARK_INPUT_TYPE_SCREEN_LOCK_PASSWORD = 9,
    ARK_INPUT_TYPE_USER_NAME = 10,
    ARK_INPUT_TYPE_NEW_PASSWORD = 11,
    ARK_INPUT_TYPE_NUMBER_DECIMAL = 12,
    ARK_INPUT_TYPE_URL = 13,
} Ark_InputType;
typedef struct Opt_InputType {
    Ark_Tag tag;
    Ark_InputType value;
} Opt_InputType;
typedef enum Ark_ItemAlign {
    ARK_ITEM_ALIGN_AUTO = 0,
    ARK_ITEM_ALIGN_START = 1,
    ARK_ITEM_ALIGN_CENTER = 2,
    ARK_ITEM_ALIGN_END = 3,
    ARK_ITEM_ALIGN_BASELINE = 4,
    ARK_ITEM_ALIGN_STRETCH = 5,
} Ark_ItemAlign;
typedef struct Opt_ItemAlign {
    Ark_Tag tag;
    Ark_ItemAlign value;
} Opt_ItemAlign;
typedef enum Ark_KeyboardAvoidMode {
    ARK_KEYBOARD_AVOID_MODE_DEFAULT = 0,
    ARK_KEYBOARD_AVOID_MODE_NONE = 1,
} Ark_KeyboardAvoidMode;
typedef struct Opt_KeyboardAvoidMode {
    Ark_Tag tag;
    Ark_KeyboardAvoidMode value;
} Opt_KeyboardAvoidMode;
typedef enum Ark_KeySource {
    ARK_KEY_SOURCE_UNKNOWN = 0,
    ARK_KEY_SOURCE_KEYBOARD = 1,
} Ark_KeySource;
typedef struct Opt_KeySource {
    Ark_Tag tag;
    Ark_KeySource value;
} Opt_KeySource;
typedef enum Ark_KeyType {
    ARK_KEY_TYPE_DOWN = 0,
    ARK_KEY_TYPE_UP = 1,
} Ark_KeyType;
typedef struct Opt_KeyType {
    Ark_Tag tag;
    Ark_KeyType value;
} Opt_KeyType;
typedef enum Ark_LaunchMode {
    ARK_LAUNCH_MODE_STANDARD = 0,
    ARK_LAUNCH_MODE_MOVE_TO_TOP_SINGLETON = 1,
    ARK_LAUNCH_MODE_POP_TO_SINGLETON = 2,
    ARK_LAUNCH_MODE_NEW_INSTANCE = 3,
} Ark_LaunchMode;
typedef struct Opt_LaunchMode {
    Ark_Tag tag;
    Ark_LaunchMode value;
} Opt_LaunchMode;
typedef enum Ark_LayoutMode {
    ARK_LAYOUT_MODE_AUTO = 0,
    ARK_LAYOUT_MODE_VERTICAL = 1,
    ARK_LAYOUT_MODE_HORIZONTAL = 2,
} Ark_LayoutMode;
typedef struct Opt_LayoutMode {
    Ark_Tag tag;
    Ark_LayoutMode value;
} Opt_LayoutMode;
typedef enum Ark_LayoutSafeAreaEdge {
    ARK_LAYOUT_SAFE_AREA_EDGE_TOP = 0,
    ARK_LAYOUT_SAFE_AREA_EDGE_BOTTOM = 1,
} Ark_LayoutSafeAreaEdge;
typedef struct Opt_LayoutSafeAreaEdge {
    Ark_Tag tag;
    Ark_LayoutSafeAreaEdge value;
} Opt_LayoutSafeAreaEdge;
typedef enum Ark_LayoutSafeAreaType {
    ARK_LAYOUT_SAFE_AREA_TYPE_SYSTEM = 0,
} Ark_LayoutSafeAreaType;
typedef struct Opt_LayoutSafeAreaType {
    Ark_Tag tag;
    Ark_LayoutSafeAreaType value;
} Opt_LayoutSafeAreaType;
typedef enum Ark_LineBreakStrategy {
    ARK_LINE_BREAK_STRATEGY_GREEDY = 0,
    ARK_LINE_BREAK_STRATEGY_HIGH_QUALITY = 1,
    ARK_LINE_BREAK_STRATEGY_BALANCED = 2,
} Ark_LineBreakStrategy;
typedef struct Opt_LineBreakStrategy {
    Ark_Tag tag;
    Ark_LineBreakStrategy value;
} Opt_LineBreakStrategy;
typedef enum Ark_LineCapStyle {
    ARK_LINE_CAP_STYLE_BUTT = 0,
    ARK_LINE_CAP_STYLE_ROUND = 1,
    ARK_LINE_CAP_STYLE_SQUARE = 2,
} Ark_LineCapStyle;
typedef struct Opt_LineCapStyle {
    Ark_Tag tag;
    Ark_LineCapStyle value;
} Opt_LineCapStyle;
typedef enum Ark_LineJoinStyle {
    ARK_LINE_JOIN_STYLE_MITER = 0,
    ARK_LINE_JOIN_STYLE_ROUND = 1,
    ARK_LINE_JOIN_STYLE_BEVEL = 2,
} Ark_LineJoinStyle;
typedef struct Opt_LineJoinStyle {
    Ark_Tag tag;
    Ark_LineJoinStyle value;
} Opt_LineJoinStyle;
typedef enum Ark_ListItemAlign {
    ARK_LIST_ITEM_ALIGN_START = 0,
    ARK_LIST_ITEM_ALIGN_CENTER = 1,
    ARK_LIST_ITEM_ALIGN_END = 2,
} Ark_ListItemAlign;
typedef struct Opt_ListItemAlign {
    Ark_Tag tag;
    Ark_ListItemAlign value;
} Opt_ListItemAlign;
typedef enum Ark_ListItemGroupArea {
    ARK_LIST_ITEM_GROUP_AREA_NONE = 0,
    ARK_LIST_ITEM_GROUP_AREA_IN_LIST_ITEM_AREA = 1,
    ARK_LIST_ITEM_GROUP_AREA_IN_HEADER_AREA = 2,
    ARK_LIST_ITEM_GROUP_AREA_IN_FOOTER_AREA = 3,
} Ark_ListItemGroupArea;
typedef struct Opt_ListItemGroupArea {
    Ark_Tag tag;
    Ark_ListItemGroupArea value;
} Opt_ListItemGroupArea;
typedef enum Ark_ListItemStyle {
    ARK_LIST_ITEM_STYLE_NONE = 0,
    ARK_LIST_ITEM_STYLE_CARD = 1,
} Ark_ListItemStyle;
typedef struct Opt_ListItemStyle {
    Ark_Tag tag;
    Ark_ListItemStyle value;
} Opt_ListItemStyle;
typedef enum Ark_MarqueeUpdateStrategy {
    ARK_MARQUEE_UPDATE_STRATEGY_DEFAULT = 0,
    ARK_MARQUEE_UPDATE_STRATEGY_PRESERVE_POSITION = 1,
} Ark_MarqueeUpdateStrategy;
typedef struct Opt_MarqueeUpdateStrategy {
    Ark_Tag tag;
    Ark_MarqueeUpdateStrategy value;
} Opt_MarqueeUpdateStrategy;
typedef enum Ark_MenuPolicy {
    ARK_MENU_POLICY_DEFAULT = 0,
    ARK_MENU_POLICY_HIDE = 1,
    ARK_MENU_POLICY_SHOW = 2,
} Ark_MenuPolicy;
typedef struct Opt_MenuPolicy {
    Ark_Tag tag;
    Ark_MenuPolicy value;
} Opt_MenuPolicy;
typedef enum Ark_MenuPreviewMode {
    ARK_MENU_PREVIEW_MODE_NONE = 0,
    ARK_MENU_PREVIEW_MODE_IMAGE = 1,
} Ark_MenuPreviewMode;
typedef struct Opt_MenuPreviewMode {
    Ark_Tag tag;
    Ark_MenuPreviewMode value;
} Opt_MenuPreviewMode;
typedef enum Ark_MenuType {
    ARK_MENU_TYPE_SELECTION_MENU = 0,
    ARK_MENU_TYPE_PREVIEW_MENU = 1,
} Ark_MenuType;
typedef struct Opt_MenuType {
    Ark_Tag tag;
    Ark_MenuType value;
} Opt_MenuType;
typedef enum Ark_ModalTransition {
    ARK_MODAL_TRANSITION_DEFAULT = 0,
    ARK_MODAL_TRANSITION_NONE = 1,
    ARK_MODAL_TRANSITION_ALPHA = 2,
} Ark_ModalTransition;
typedef struct Opt_ModalTransition {
    Ark_Tag tag;
    Ark_ModalTransition value;
} Opt_ModalTransition;
typedef enum Ark_ModifierKey {
    ARK_MODIFIER_KEY_CTRL = 0,
    ARK_MODIFIER_KEY_SHIFT = 1,
    ARK_MODIFIER_KEY_ALT = 2,
} Ark_ModifierKey;
typedef struct Opt_ModifierKey {
    Ark_Tag tag;
    Ark_ModifierKey value;
} Opt_ModifierKey;
typedef enum Ark_MouseAction {
    ARK_MOUSE_ACTION_PRESS = 0,
    ARK_MOUSE_ACTION_RELEASE = 1,
    ARK_MOUSE_ACTION_MOVE = 2,
    ARK_MOUSE_ACTION_HOVER = 3,
} Ark_MouseAction;
typedef struct Opt_MouseAction {
    Ark_Tag tag;
    Ark_MouseAction value;
} Opt_MouseAction;
typedef enum Ark_MouseButton {
    ARK_MOUSE_BUTTON_LEFT = 0,
    ARK_MOUSE_BUTTON_RIGHT = 1,
    ARK_MOUSE_BUTTON_MIDDLE = 2,
    ARK_MOUSE_BUTTON_BACK = 3,
    ARK_MOUSE_BUTTON_FORWARD = 4,
    ARK_MOUSE_BUTTON_NONE = 5,
} Ark_MouseButton;
typedef struct Opt_MouseButton {
    Ark_Tag tag;
    Ark_MouseButton value;
} Opt_MouseButton;
typedef enum Ark_NavBarPosition {
    ARK_NAV_BAR_POSITION_START = 0,
    ARK_NAV_BAR_POSITION_END = 1,
} Ark_NavBarPosition;
typedef struct Opt_NavBarPosition {
    Ark_Tag tag;
    Ark_NavBarPosition value;
} Opt_NavBarPosition;
typedef enum Ark_NavDestinationMode {
    ARK_NAV_DESTINATION_MODE_STANDARD = 0,
    ARK_NAV_DESTINATION_MODE_DIALOG = 1,
} Ark_NavDestinationMode;
typedef struct Opt_NavDestinationMode {
    Ark_Tag tag;
    Ark_NavDestinationMode value;
} Opt_NavDestinationMode;
typedef enum Ark_NavigationMode {
    ARK_NAVIGATION_MODE_STACK = 0,
    ARK_NAVIGATION_MODE_SPLIT = 1,
    ARK_NAVIGATION_MODE_AUTO = 2,
} Ark_NavigationMode;
typedef struct Opt_NavigationMode {
    Ark_Tag tag;
    Ark_NavigationMode value;
} Opt_NavigationMode;
typedef enum Ark_NavigationOperation {
    ARK_NAVIGATION_OPERATION_PUSH = 1,
    ARK_NAVIGATION_OPERATION_POP = 2,
    ARK_NAVIGATION_OPERATION_REPLACE = 3,
} Ark_NavigationOperation;
typedef struct Opt_NavigationOperation {
    Ark_Tag tag;
    Ark_NavigationOperation value;
} Opt_NavigationOperation;
typedef enum Ark_NavigationTitleMode {
    ARK_NAVIGATION_TITLE_MODE_FREE = 0,
    ARK_NAVIGATION_TITLE_MODE_FULL = 1,
    ARK_NAVIGATION_TITLE_MODE_MINI = 2,
} Ark_NavigationTitleMode;
typedef struct Opt_NavigationTitleMode {
    Ark_Tag tag;
    Ark_NavigationTitleMode value;
} Opt_NavigationTitleMode;
typedef enum Ark_NavigationType {
    ARK_NAVIGATION_TYPE_PUSH = 0,
    ARK_NAVIGATION_TYPE_BACK = 1,
    ARK_NAVIGATION_TYPE_REPLACE = 2,
} Ark_NavigationType;
typedef struct Opt_NavigationType {
    Ark_Tag tag;
    Ark_NavigationType value;
} Opt_NavigationType;
typedef enum Ark_NestedScrollMode {
    ARK_NESTED_SCROLL_MODE_SELF_ONLY = 0,
    ARK_NESTED_SCROLL_MODE_SELF_FIRST = 1,
    ARK_NESTED_SCROLL_MODE_PARENT_FIRST = 2,
    ARK_NESTED_SCROLL_MODE_PARALLEL = 3,
} Ark_NestedScrollMode;
typedef struct Opt_NestedScrollMode {
    Ark_Tag tag;
    Ark_NestedScrollMode value;
} Opt_NestedScrollMode;
typedef enum Ark_ObscuredReasons {
    ARK_OBSCURED_REASONS_PLACEHOLDER = 0,
} Ark_ObscuredReasons;
typedef struct Opt_ObscuredReasons {
    Ark_Tag tag;
    Ark_ObscuredReasons value;
} Opt_ObscuredReasons;
typedef enum Ark_OptionWidthMode {
    ARK_OPTION_WIDTH_MODE_FIT_CONTENT,
    ARK_OPTION_WIDTH_MODE_FIT_TRIGGER,
} Ark_OptionWidthMode;
typedef struct Opt_OptionWidthMode {
    Ark_Tag tag;
    Ark_OptionWidthMode value;
} Opt_OptionWidthMode;
typedef enum Ark_OutlineStyle {
    ARK_OUTLINE_STYLE_SOLID = 0,
    ARK_OUTLINE_STYLE_DASHED = 1,
    ARK_OUTLINE_STYLE_DOTTED = 2,
} Ark_OutlineStyle;
typedef struct Opt_OutlineStyle {
    Ark_Tag tag;
    Ark_OutlineStyle value;
} Opt_OutlineStyle;
typedef enum Ark_PanDirection {
    ARK_PAN_DIRECTION_NONE = 0,
    ARK_PAN_DIRECTION_HORIZONTAL = 1,
    ARK_PAN_DIRECTION_LEFT = 2,
    ARK_PAN_DIRECTION_RIGHT = 3,
    ARK_PAN_DIRECTION_VERTICAL = 4,
    ARK_PAN_DIRECTION_UP = 5,
    ARK_PAN_DIRECTION_DOWN = 6,
    ARK_PAN_DIRECTION_ALL = 7,
} Ark_PanDirection;
typedef struct Opt_PanDirection {
    Ark_Tag tag;
    Ark_PanDirection value;
} Opt_PanDirection;
typedef enum Ark_PerfMonitorActionType {
    ARK_PERF_MONITOR_ACTION_TYPE_LAST_DOWN = 0,
    ARK_PERF_MONITOR_ACTION_TYPE_LAST_UP = 1,
    ARK_PERF_MONITOR_ACTION_TYPE_FIRST_MOVE = 2,
} Ark_PerfMonitorActionType;
typedef struct Opt_PerfMonitorActionType {
    Ark_Tag tag;
    Ark_PerfMonitorActionType value;
} Opt_PerfMonitorActionType;
typedef enum Ark_PerfMonitorSourceType {
    ARK_PERF_MONITOR_SOURCE_TYPE_PERF_TOUCH_EVENT = 0,
    ARK_PERF_MONITOR_SOURCE_TYPE_PERF_MOUSE_EVENT = 1,
    ARK_PERF_MONITOR_SOURCE_TYPE_PERF_TOUCHPAD_EVENT = 2,
    ARK_PERF_MONITOR_SOURCE_TYPE_PERF_JOYSTICK_EVENT = 3,
    ARK_PERF_MONITOR_SOURCE_TYPE_PERF_KEY_EVENT = 4,
} Ark_PerfMonitorSourceType;
typedef struct Opt_PerfMonitorSourceType {
    Ark_Tag tag;
    Ark_PerfMonitorSourceType value;
} Opt_PerfMonitorSourceType;
typedef enum Ark_PixelRoundCalcPolicy {
    ARK_PIXEL_ROUND_CALC_POLICY_NO_FORCE_ROUND = 0,
    ARK_PIXEL_ROUND_CALC_POLICY_FORCE_CEIL = 1,
    ARK_PIXEL_ROUND_CALC_POLICY_FORCE_FLOOR = 2,
} Ark_PixelRoundCalcPolicy;
typedef struct Opt_PixelRoundCalcPolicy {
    Ark_Tag tag;
    Ark_PixelRoundCalcPolicy value;
} Opt_PixelRoundCalcPolicy;
typedef enum Ark_Placement {
    ARK_PLACEMENT_LEFT = 0,
    ARK_PLACEMENT_RIGHT = 1,
    ARK_PLACEMENT_TOP = 2,
    ARK_PLACEMENT_BOTTOM = 3,
    ARK_PLACEMENT_TOP_LEFT = 4,
    ARK_PLACEMENT_TOP_RIGHT = 5,
    ARK_PLACEMENT_BOTTOM_LEFT = 6,
    ARK_PLACEMENT_BOTTOM_RIGHT = 7,
    ARK_PLACEMENT_LEFT_TOP = 8,
    ARK_PLACEMENT_LEFT_BOTTOM = 9,
    ARK_PLACEMENT_RIGHT_TOP = 10,
    ARK_PLACEMENT_RIGHT_BOTTOM = 11,
} Ark_Placement;
typedef struct Opt_Placement {
    Ark_Tag tag;
    Ark_Placement value;
} Opt_Placement;
typedef enum Ark_PlayMode {
    ARK_PLAY_MODE_NORMAL = 0,
    ARK_PLAY_MODE_REVERSE = 1,
    ARK_PLAY_MODE_ALTERNATE = 2,
    ARK_PLAY_MODE_ALTERNATE_REVERSE = 3,
} Ark_PlayMode;
typedef struct Opt_PlayMode {
    Ark_Tag tag;
    Ark_PlayMode value;
} Opt_PlayMode;
typedef enum Ark_PreDragStatus {
    ARK_PRE_DRAG_STATUS_ACTION_DETECTING_STATUS = 0,
    ARK_PRE_DRAG_STATUS_READY_TO_TRIGGER_DRAG_ACTION = 1,
    ARK_PRE_DRAG_STATUS_PREVIEW_LIFT_STARTED = 2,
    ARK_PRE_DRAG_STATUS_PREVIEW_LIFT_FINISHED = 3,
    ARK_PRE_DRAG_STATUS_PREVIEW_LANDING_STARTED = 4,
    ARK_PRE_DRAG_STATUS_PREVIEW_LANDING_FINISHED = 5,
    ARK_PRE_DRAG_STATUS_ACTION_CANCELED_BEFORE_DRAG = 6,
} Ark_PreDragStatus;
typedef struct Opt_PreDragStatus {
    Ark_Tag tag;
    Ark_PreDragStatus value;
} Opt_PreDragStatus;
typedef enum Ark_RelateType {
    ARK_RELATE_TYPE_FILL = 0,
    ARK_RELATE_TYPE_FIT = 1,
} Ark_RelateType;
typedef struct Opt_RelateType {
    Ark_Tag tag;
    Ark_RelateType value;
} Opt_RelateType;
typedef enum Ark_RenderExitReason {
    ARK_RENDER_EXIT_REASON_PROCESS_ABNORMAL_TERMINATION = 0,
    ARK_RENDER_EXIT_REASON_PROCESS_WAS_KILLED = 1,
    ARK_RENDER_EXIT_REASON_PROCESS_CRASHED = 2,
    ARK_RENDER_EXIT_REASON_PROCESS_OOM = 3,
    ARK_RENDER_EXIT_REASON_PROCESS_EXIT_UNKNOWN = 4,
} Ark_RenderExitReason;
typedef struct Opt_RenderExitReason {
    Ark_Tag tag;
    Ark_RenderExitReason value;
} Opt_RenderExitReason;
typedef enum Ark_RenderFit {
    ARK_RENDER_FIT_CENTER = 0,
    ARK_RENDER_FIT_TOP = 1,
    ARK_RENDER_FIT_BOTTOM = 2,
    ARK_RENDER_FIT_LEFT = 3,
    ARK_RENDER_FIT_RIGHT = 4,
    ARK_RENDER_FIT_TOP_LEFT = 5,
    ARK_RENDER_FIT_TOP_RIGHT = 6,
    ARK_RENDER_FIT_BOTTOM_LEFT = 7,
    ARK_RENDER_FIT_BOTTOM_RIGHT = 8,
    ARK_RENDER_FIT_RESIZE_FILL = 9,
    ARK_RENDER_FIT_RESIZE_CONTAIN = 10,
    ARK_RENDER_FIT_RESIZE_CONTAIN_TOP_LEFT = 11,
    ARK_RENDER_FIT_RESIZE_CONTAIN_BOTTOM_RIGHT = 12,
    ARK_RENDER_FIT_RESIZE_COVER = 13,
    ARK_RENDER_FIT_RESIZE_COVER_TOP_LEFT = 14,
    ARK_RENDER_FIT_RESIZE_COVER_BOTTOM_RIGHT = 15,
} Ark_RenderFit;
typedef struct Opt_RenderFit {
    Ark_Tag tag;
    Ark_RenderFit value;
} Opt_RenderFit;
typedef enum Ark_RepeatMode {
    ARK_REPEAT_MODE_REPEAT = 0,
    ARK_REPEAT_MODE_STRETCH = 1,
    ARK_REPEAT_MODE_ROUND = 2,
    ARK_REPEAT_MODE_SPACE = 3,
} Ark_RepeatMode;
typedef struct Opt_RepeatMode {
    Ark_Tag tag;
    Ark_RepeatMode value;
} Opt_RepeatMode;
typedef enum Ark_ResponseType {
    ARK_RESPONSE_TYPE_RIGHT_CLICK = 0,
    ARK_RESPONSE_TYPE_LONG_PRESS = 1,
} Ark_ResponseType;
typedef struct Opt_ResponseType {
    Ark_Tag tag;
    Ark_ResponseType value;
} Opt_ResponseType;
typedef enum Ark_RichEditorDeleteDirection {
    ARK_RICH_EDITOR_DELETE_DIRECTION_BACKWARD = 0,
    ARK_RICH_EDITOR_DELETE_DIRECTION_FORWARD = 1,
} Ark_RichEditorDeleteDirection;
typedef struct Opt_RichEditorDeleteDirection {
    Ark_Tag tag;
    Ark_RichEditorDeleteDirection value;
} Opt_RichEditorDeleteDirection;
typedef enum Ark_RichEditorResponseType {
    ARK_RICH_EDITOR_RESPONSE_TYPE_RIGHT_CLICK = 0,
    ARK_RICH_EDITOR_RESPONSE_TYPE_LONG_PRESS = 1,
    ARK_RICH_EDITOR_RESPONSE_TYPE_SELECT = 2,
} Ark_RichEditorResponseType;
typedef struct Opt_RichEditorResponseType {
    Ark_Tag tag;
    Ark_RichEditorResponseType value;
} Opt_RichEditorResponseType;
typedef enum Ark_RichEditorSpanType {
    ARK_RICH_EDITOR_SPAN_TYPE_TEXT = 0,
    ARK_RICH_EDITOR_SPAN_TYPE_IMAGE = 1,
    ARK_RICH_EDITOR_SPAN_TYPE_MIXED = 2,
    ARK_RICH_EDITOR_SPAN_TYPE_BUILDER = 3,
} Ark_RichEditorSpanType;
typedef struct Opt_RichEditorSpanType {
    Ark_Tag tag;
    Ark_RichEditorSpanType value;
} Opt_RichEditorSpanType;
typedef enum Ark_SafeAreaEdge {
    ARK_SAFE_AREA_EDGE_TOP = 0,
    ARK_SAFE_AREA_EDGE_BOTTOM = 1,
    ARK_SAFE_AREA_EDGE_START = 2,
    ARK_SAFE_AREA_EDGE_END = 3,
} Ark_SafeAreaEdge;
typedef struct Opt_SafeAreaEdge {
    Ark_Tag tag;
    Ark_SafeAreaEdge value;
} Opt_SafeAreaEdge;
typedef enum Ark_SafeAreaType {
    ARK_SAFE_AREA_TYPE_SYSTEM = 0,
    ARK_SAFE_AREA_TYPE_CUTOUT = 1,
    ARK_SAFE_AREA_TYPE_KEYBOARD = 2,
} Ark_SafeAreaType;
typedef struct Opt_SafeAreaType {
    Ark_Tag tag;
    Ark_SafeAreaType value;
} Opt_SafeAreaType;
typedef enum Ark_ScrollAlign {
    ARK_SCROLL_ALIGN_START = 0,
    ARK_SCROLL_ALIGN_CENTER = 1,
    ARK_SCROLL_ALIGN_END = 2,
    ARK_SCROLL_ALIGN_AUTO = 3,
} Ark_ScrollAlign;
typedef struct Opt_ScrollAlign {
    Ark_Tag tag;
    Ark_ScrollAlign value;
} Opt_ScrollAlign;
typedef enum Ark_ScrollDirection {
    ARK_SCROLL_DIRECTION_VERTICAL = 0,
    ARK_SCROLL_DIRECTION_HORIZONTAL = 1,
    ARK_SCROLL_DIRECTION_FREE = 2,
    ARK_SCROLL_DIRECTION_NONE = 3,
} Ark_ScrollDirection;
typedef struct Opt_ScrollDirection {
    Ark_Tag tag;
    Ark_ScrollDirection value;
} Opt_ScrollDirection;
typedef enum Ark_ScrollSizeMode {
    ARK_SCROLL_SIZE_MODE_FOLLOW_DETENT = 0,
    ARK_SCROLL_SIZE_MODE_CONTINUOUS = 1,
} Ark_ScrollSizeMode;
typedef struct Opt_ScrollSizeMode {
    Ark_Tag tag;
    Ark_ScrollSizeMode value;
} Opt_ScrollSizeMode;
typedef enum Ark_ScrollSnapAlign {
    ARK_SCROLL_SNAP_ALIGN_NONE = 0,
    ARK_SCROLL_SNAP_ALIGN_START = 1,
    ARK_SCROLL_SNAP_ALIGN_CENTER = 2,
    ARK_SCROLL_SNAP_ALIGN_END = 3,
} Ark_ScrollSnapAlign;
typedef struct Opt_ScrollSnapAlign {
    Ark_Tag tag;
    Ark_ScrollSnapAlign value;
} Opt_ScrollSnapAlign;
typedef enum Ark_ScrollSource {
    ARK_SCROLL_SOURCE_DRAG = 0,
    ARK_SCROLL_SOURCE_FLING = 1,
    ARK_SCROLL_SOURCE_EDGE_EFFECT = 2,
    ARK_SCROLL_SOURCE_OTHER_USER_INPUT = 3,
    ARK_SCROLL_SOURCE_SCROLL_BAR = 4,
    ARK_SCROLL_SOURCE_SCROLL_BAR_FLING = 5,
    ARK_SCROLL_SOURCE_SCROLLER = 6,
    ARK_SCROLL_SOURCE_SCROLLER_ANIMATION = 7,
} Ark_ScrollSource;
typedef struct Opt_ScrollSource {
    Ark_Tag tag;
    Ark_ScrollSource value;
} Opt_ScrollSource;
typedef enum Ark_ScrollState {
    ARK_SCROLL_STATE_IDLE = 0,
    ARK_SCROLL_STATE_SCROLL = 1,
    ARK_SCROLL_STATE_FLING = 2,
} Ark_ScrollState;
typedef struct Opt_ScrollState {
    Ark_Tag tag;
    Ark_ScrollState value;
} Opt_ScrollState;
typedef enum Ark_SearchType {
    ARK_SEARCH_TYPE_NORMAL = 0,
    ARK_SEARCH_TYPE_NUMBER = 2,
    ARK_SEARCH_TYPE_PHONE_NUMBER = 3,
    ARK_SEARCH_TYPE_EMAIL = 5,
    ARK_SEARCH_TYPE_NUMBER_DECIMAL = 12,
    ARK_SEARCH_TYPE_URL = 13,
} Ark_SearchType;
typedef struct Opt_SearchType {
    Ark_Tag tag;
    Ark_SearchType value;
} Opt_SearchType;
typedef enum Ark_SelectedMode {
    ARK_SELECTED_MODE_INDICATOR = 0,
    ARK_SELECTED_MODE_BOARD = 1,
} Ark_SelectedMode;
typedef struct Opt_SelectedMode {
    Ark_Tag tag;
    Ark_SelectedMode value;
} Opt_SelectedMode;
typedef enum Ark_ShadowStyle {
    ARK_SHADOW_STYLE_OUTER_DEFAULT_XS = 0,
    ARK_SHADOW_STYLE_OUTER_DEFAULT_SM = 1,
    ARK_SHADOW_STYLE_OUTER_DEFAULT_MD = 2,
    ARK_SHADOW_STYLE_OUTER_DEFAULT_LG = 3,
    ARK_SHADOW_STYLE_OUTER_FLOATING_SM = 4,
    ARK_SHADOW_STYLE_OUTER_FLOATING_MD = 5,
} Ark_ShadowStyle;
typedef struct Opt_ShadowStyle {
    Ark_Tag tag;
    Ark_ShadowStyle value;
} Opt_ShadowStyle;
typedef enum Ark_ShadowType {
    ARK_SHADOW_TYPE_COLOR = 0,
    ARK_SHADOW_TYPE_BLUR = 1,
} Ark_ShadowType;
typedef struct Opt_ShadowType {
    Ark_Tag tag;
    Ark_ShadowType value;
} Opt_ShadowType;
typedef enum Ark_SharedTransitionEffectType {
    ARK_SHARED_TRANSITION_EFFECT_TYPE_STATIC = 0,
    ARK_SHARED_TRANSITION_EFFECT_TYPE_EXCHANGE = 1,
} Ark_SharedTransitionEffectType;
typedef struct Opt_SharedTransitionEffectType {
    Ark_Tag tag;
    Ark_SharedTransitionEffectType value;
} Opt_SharedTransitionEffectType;
typedef enum Ark_SheetKeyboardAvoidMode {
    ARK_SHEET_KEYBOARD_AVOID_MODE_NONE = 0,
    ARK_SHEET_KEYBOARD_AVOID_MODE_TRANSLATE_AND_RESIZE = 1,
    ARK_SHEET_KEYBOARD_AVOID_MODE_RESIZE_ONLY = 2,
    ARK_SHEET_KEYBOARD_AVOID_MODE_TRANSLATE_AND_SCROLL = 3,
} Ark_SheetKeyboardAvoidMode;
typedef struct Opt_SheetKeyboardAvoidMode {
    Ark_Tag tag;
    Ark_SheetKeyboardAvoidMode value;
} Opt_SheetKeyboardAvoidMode;
typedef enum Ark_SheetMode {
    ARK_SHEET_MODE_OVERLAY = 0,
    ARK_SHEET_MODE_EMBEDDED = 1,
} Ark_SheetMode;
typedef struct Opt_SheetMode {
    Ark_Tag tag;
    Ark_SheetMode value;
} Opt_SheetMode;
typedef enum Ark_SheetSize {
    ARK_SHEET_SIZE_MEDIUM = 0,
    ARK_SHEET_SIZE_LARGE = 1,
    ARK_SHEET_SIZE_FIT_CONTENT = 2,
} Ark_SheetSize;
typedef struct Opt_SheetSize {
    Ark_Tag tag;
    Ark_SheetSize value;
} Opt_SheetSize;
typedef enum Ark_SheetType {
    ARK_SHEET_TYPE_BOTTOM = 0,
    ARK_SHEET_TYPE_CENTER = 1,
    ARK_SHEET_TYPE_POPUP = 2,
} Ark_SheetType;
typedef struct Opt_SheetType {
    Ark_Tag tag;
    Ark_SheetType value;
} Opt_SheetType;
typedef enum Ark_SizeType {
    ARK_SIZE_TYPE_AUTO = 0,
    ARK_SIZE_TYPE_XS = 1,
    ARK_SIZE_TYPE_SM = 2,
    ARK_SIZE_TYPE_MD = 3,
    ARK_SIZE_TYPE_LG = 4,
} Ark_SizeType;
typedef struct Opt_SizeType {
    Ark_Tag tag;
    Ark_SizeType value;
} Opt_SizeType;
typedef enum Ark_SourceTool {
    ARK_SOURCE_TOOL_UNKNOWN = 0,
    ARK_SOURCE_TOOL_FINGER = 1,
    ARK_SOURCE_TOOL_PEN = 2,
    ARK_SOURCE_TOOL_MOUSE = 3,
    ARK_SOURCE_TOOL_TOUCHPAD = 4,
    ARK_SOURCE_TOOL_JOYSTICK = 5,
} Ark_SourceTool;
typedef struct Opt_SourceTool {
    Ark_Tag tag;
    Ark_SourceTool value;
} Opt_SourceTool;
typedef enum Ark_SourceType {
    ARK_SOURCE_TYPE_UNKNOWN = 0,
    ARK_SOURCE_TYPE_MOUSE = 1,
    ARK_SOURCE_TYPE_TOUCH_SCREEN = 2,
} Ark_SourceType;
typedef struct Opt_SourceType {
    Ark_Tag tag;
    Ark_SourceType value;
} Opt_SourceType;
typedef enum Ark_Sticky {
    ARK_STICKY_NONE = 0,
    ARK_STICKY_NORMAL = 1,
    ARK_STICKY_OPACITY = 2,
} Ark_Sticky;
typedef struct Opt_Sticky {
    Ark_Tag tag;
    Ark_Sticky value;
} Opt_Sticky;
typedef enum Ark_StickyStyle {
    ARK_STICKY_STYLE_NONE = 0,
    ARK_STICKY_STYLE_HEADER = 1,
    ARK_STICKY_STYLE_FOOTER = 2,
} Ark_StickyStyle;
typedef struct Opt_StickyStyle {
    Ark_Tag tag;
    Ark_StickyStyle value;
} Opt_StickyStyle;
typedef enum Ark_StyledStringKey {
    ARK_STYLED_STRING_KEY_FONT = 0,
    ARK_STYLED_STRING_KEY_DECORATION = 1,
    ARK_STYLED_STRING_KEY_BASELINE_OFFSET = 2,
    ARK_STYLED_STRING_KEY_LETTER_SPACING = 3,
    ARK_STYLED_STRING_KEY_TEXT_SHADOW = 4,
    ARK_STYLED_STRING_KEY_LINE_HEIGHT = 5,
    ARK_STYLED_STRING_KEY_BACKGROUND_COLOR = 6,
    ARK_STYLED_STRING_KEY_URL = 7,
    ARK_STYLED_STRING_KEY_GESTURE = 100,
    ARK_STYLED_STRING_KEY_PARAGRAPH_STYLE = 200,
    ARK_STYLED_STRING_KEY_IMAGE = 300,
    ARK_STYLED_STRING_KEY_CUSTOM_SPAN = 400,
    ARK_STYLED_STRING_KEY_USER_DATA = 500,
} Ark_StyledStringKey;
typedef struct Opt_StyledStringKey {
    Ark_Tag tag;
    Ark_StyledStringKey value;
} Opt_StyledStringKey;
typedef enum Ark_SwipeActionState {
    ARK_SWIPE_ACTION_STATE_COLLAPSED = 0,
    ARK_SWIPE_ACTION_STATE_EXPANDED = 1,
    ARK_SWIPE_ACTION_STATE_ACTIONING = 2,
} Ark_SwipeActionState;
typedef struct Opt_SwipeActionState {
    Ark_Tag tag;
    Ark_SwipeActionState value;
} Opt_SwipeActionState;
typedef enum Ark_SwipeDirection {
    ARK_SWIPE_DIRECTION_NONE = 0,
    ARK_SWIPE_DIRECTION_HORIZONTAL = 1,
    ARK_SWIPE_DIRECTION_VERTICAL = 2,
    ARK_SWIPE_DIRECTION_ALL = 3,
} Ark_SwipeDirection;
typedef struct Opt_SwipeDirection {
    Ark_Tag tag;
    Ark_SwipeDirection value;
} Opt_SwipeDirection;
typedef enum Ark_SwipeEdgeEffect {
    ARK_SWIPE_EDGE_EFFECT_SPRING = 0,
    ARK_SWIPE_EDGE_EFFECT_NONE = 1,
} Ark_SwipeEdgeEffect;
typedef struct Opt_SwipeEdgeEffect {
    Ark_Tag tag;
    Ark_SwipeEdgeEffect value;
} Opt_SwipeEdgeEffect;
typedef enum Ark_SwiperDisplayMode {
    ARK_SWIPER_DISPLAY_MODE_LEGACY_STRETCH = 0,
    ARK_SWIPER_DISPLAY_MODE_LEGACY_AUTO_LINEAR = 1,
    ARK_SWIPER_DISPLAY_MODE_STRETCH = 2,
    ARK_SWIPER_DISPLAY_MODE_AUTO_LINEAR = 3,
} Ark_SwiperDisplayMode;
typedef struct Opt_SwiperDisplayMode {
    Ark_Tag tag;
    Ark_SwiperDisplayMode value;
} Opt_SwiperDisplayMode;
typedef enum Ark_SwiperNestedScrollMode {
    ARK_SWIPER_NESTED_SCROLL_MODE_SELF_ONLY = 0,
    ARK_SWIPER_NESTED_SCROLL_MODE_SELF_FIRST = 1,
} Ark_SwiperNestedScrollMode;
typedef struct Opt_SwiperNestedScrollMode {
    Ark_Tag tag;
    Ark_SwiperNestedScrollMode value;
} Opt_SwiperNestedScrollMode;
typedef enum Ark_SymbolEffectStrategy {
    ARK_SYMBOL_EFFECT_STRATEGY_NONE = 0,
    ARK_SYMBOL_EFFECT_STRATEGY_SCALE = 1,
    ARK_SYMBOL_EFFECT_STRATEGY_HIERARCHICAL = 2,
} Ark_SymbolEffectStrategy;
typedef struct Opt_SymbolEffectStrategy {
    Ark_Tag tag;
    Ark_SymbolEffectStrategy value;
} Opt_SymbolEffectStrategy;
typedef enum Ark_SymbolRenderingStrategy {
    ARK_SYMBOL_RENDERING_STRATEGY_SINGLE = 0,
    ARK_SYMBOL_RENDERING_STRATEGY_MULTIPLE_COLOR = 1,
    ARK_SYMBOL_RENDERING_STRATEGY_MULTIPLE_OPACITY = 2,
} Ark_SymbolRenderingStrategy;
typedef struct Opt_SymbolRenderingStrategy {
    Ark_Tag tag;
    Ark_SymbolRenderingStrategy value;
} Opt_SymbolRenderingStrategy;
typedef enum Ark_TextAlign {
    ARK_TEXT_ALIGN_CENTER = 0,
    ARK_TEXT_ALIGN_START = 1,
    ARK_TEXT_ALIGN_END = 2,
    ARK_TEXT_ALIGN_JUSTIFY = 3,
} Ark_TextAlign;
typedef struct Opt_TextAlign {
    Ark_Tag tag;
    Ark_TextAlign value;
} Opt_TextAlign;
typedef enum Ark_TextCase {
    ARK_TEXT_CASE_NORMAL = 0,
    ARK_TEXT_CASE_LOWER_CASE = 1,
    ARK_TEXT_CASE_UPPER_CASE = 2,
} Ark_TextCase;
typedef struct Opt_TextCase {
    Ark_Tag tag;
    Ark_TextCase value;
} Opt_TextCase;
typedef enum Ark_TextContentStyle {
    ARK_TEXT_CONTENT_STYLE_DEFAULT = 0,
    ARK_TEXT_CONTENT_STYLE_INLINE = 1,
} Ark_TextContentStyle;
typedef struct Opt_TextContentStyle {
    Ark_Tag tag;
    Ark_TextContentStyle value;
} Opt_TextContentStyle;
typedef enum Ark_TextDataDetectorType {
    ARK_TEXT_DATA_DETECTOR_TYPE_PHONE_NUMBER = 0,
    ARK_TEXT_DATA_DETECTOR_TYPE_URL = 1,
    ARK_TEXT_DATA_DETECTOR_TYPE_EMAIL = 2,
    ARK_TEXT_DATA_DETECTOR_TYPE_ADDRESS = 3,
    ARK_TEXT_DATA_DETECTOR_TYPE_DATE_TIME = 4,
} Ark_TextDataDetectorType;
typedef struct Opt_TextDataDetectorType {
    Ark_Tag tag;
    Ark_TextDataDetectorType value;
} Opt_TextDataDetectorType;
typedef enum Ark_TextDecorationStyle {
    ARK_TEXT_DECORATION_STYLE_SOLID = 0,
    ARK_TEXT_DECORATION_STYLE_DOUBLE = 1,
    ARK_TEXT_DECORATION_STYLE_DOTTED = 2,
    ARK_TEXT_DECORATION_STYLE_DASHED = 3,
    ARK_TEXT_DECORATION_STYLE_WAVY = 4,
} Ark_TextDecorationStyle;
typedef struct Opt_TextDecorationStyle {
    Ark_Tag tag;
    Ark_TextDecorationStyle value;
} Opt_TextDecorationStyle;
typedef enum Ark_TextDecorationType {
    ARK_TEXT_DECORATION_TYPE_NONE = 0,
    ARK_TEXT_DECORATION_TYPE_UNDERLINE = 1,
    ARK_TEXT_DECORATION_TYPE_OVERLINE = 2,
    ARK_TEXT_DECORATION_TYPE_LINE_THROUGH = 3,
} Ark_TextDecorationType;
typedef struct Opt_TextDecorationType {
    Ark_Tag tag;
    Ark_TextDecorationType value;
} Opt_TextDecorationType;
typedef enum Ark_TextDeleteDirection {
    ARK_TEXT_DELETE_DIRECTION_BACKWARD = 0,
    ARK_TEXT_DELETE_DIRECTION_FORWARD = 1,
} Ark_TextDeleteDirection;
typedef struct Opt_TextDeleteDirection {
    Ark_Tag tag;
    Ark_TextDeleteDirection value;
} Opt_TextDeleteDirection;
typedef enum Ark_TextHeightAdaptivePolicy {
    ARK_TEXT_HEIGHT_ADAPTIVE_POLICY_MAX_LINES_FIRST = 0,
    ARK_TEXT_HEIGHT_ADAPTIVE_POLICY_MIN_FONT_SIZE_FIRST = 1,
    ARK_TEXT_HEIGHT_ADAPTIVE_POLICY_LAYOUT_CONSTRAINT_FIRST = 2,
} Ark_TextHeightAdaptivePolicy;
typedef struct Opt_TextHeightAdaptivePolicy {
    Ark_Tag tag;
    Ark_TextHeightAdaptivePolicy value;
} Opt_TextHeightAdaptivePolicy;
typedef enum Ark_TextInputStyle {
    ARK_TEXT_INPUT_STYLE_DEFAULT = 0,
    ARK_TEXT_INPUT_STYLE_INLINE = 1,
} Ark_TextInputStyle;
typedef struct Opt_TextInputStyle {
    Ark_Tag tag;
    Ark_TextInputStyle value;
} Opt_TextInputStyle;
typedef enum Ark_TextOverflow {
    ARK_TEXT_OVERFLOW_NONE = 0,
    ARK_TEXT_OVERFLOW_CLIP = 1,
    ARK_TEXT_OVERFLOW_ELLIPSIS = 2,
    ARK_TEXT_OVERFLOW_MARQUEE = 3,
} Ark_TextOverflow;
typedef struct Opt_TextOverflow {
    Ark_Tag tag;
    Ark_TextOverflow value;
} Opt_TextOverflow;
typedef enum Ark_TextSelectableMode {
    ARK_TEXT_SELECTABLE_MODE_SELECTABLE_UNFOCUSABLE = 0,
    ARK_TEXT_SELECTABLE_MODE_SELECTABLE_FOCUSABLE = 1,
    ARK_TEXT_SELECTABLE_MODE_UNSELECTABLE = 2,
} Ark_TextSelectableMode;
typedef struct Opt_TextSelectableMode {
    Ark_Tag tag;
    Ark_TextSelectableMode value;
} Opt_TextSelectableMode;
typedef enum Ark_ThemeColorMode {
    ARK_THEME_COLOR_MODE_SYSTEM = 0,
    ARK_THEME_COLOR_MODE_LIGHT = 1,
    ARK_THEME_COLOR_MODE_DARK = 2,
} Ark_ThemeColorMode;
typedef struct Opt_ThemeColorMode {
    Ark_Tag tag;
    Ark_ThemeColorMode value;
} Opt_ThemeColorMode;
typedef enum Ark_TitleHeight {
    ARK_TITLE_HEIGHT_MAIN_ONLY = 0,
    ARK_TITLE_HEIGHT_MAIN_WITH_SUB = 1,
} Ark_TitleHeight;
typedef struct Opt_TitleHeight {
    Ark_Tag tag;
    Ark_TitleHeight value;
} Opt_TitleHeight;
typedef enum Ark_ToggleType {
    ARK_TOGGLE_TYPE_CHECKBOX = 0,
    ARK_TOGGLE_TYPE_SWITCH = 1,
    ARK_TOGGLE_TYPE_BUTTON = 2,
} Ark_ToggleType;
typedef struct Opt_ToggleType {
    Ark_Tag tag;
    Ark_ToggleType value;
} Opt_ToggleType;
typedef enum Ark_ToolbarItemStatus {
    ARK_TOOLBAR_ITEM_STATUS_NORMAL = 0,
    ARK_TOOLBAR_ITEM_STATUS_DISABLED = 1,
    ARK_TOOLBAR_ITEM_STATUS_ACTIVE = 2,
} Ark_ToolbarItemStatus;
typedef struct Opt_ToolbarItemStatus {
    Ark_Tag tag;
    Ark_ToolbarItemStatus value;
} Opt_ToolbarItemStatus;
typedef enum Ark_TouchTestStrategy {
    ARK_TOUCH_TEST_STRATEGY_DEFAULT = 0,
    ARK_TOUCH_TEST_STRATEGY_FORWARD_COMPETITION = 1,
    ARK_TOUCH_TEST_STRATEGY_FORWARD = 2,
} Ark_TouchTestStrategy;
typedef struct Opt_TouchTestStrategy {
    Ark_Tag tag;
    Ark_TouchTestStrategy value;
} Opt_TouchTestStrategy;
typedef enum Ark_TouchType {
    ARK_TOUCH_TYPE_DOWN = 0,
    ARK_TOUCH_TYPE_UP = 1,
    ARK_TOUCH_TYPE_MOVE = 2,
    ARK_TOUCH_TYPE_CANCEL = 3,
} Ark_TouchType;
typedef struct Opt_TouchType {
    Ark_Tag tag;
    Ark_TouchType value;
} Opt_TouchType;
typedef enum Ark_TransitionEdge {
    ARK_TRANSITION_EDGE_TOP = 0,
    ARK_TRANSITION_EDGE_BOTTOM = 1,
    ARK_TRANSITION_EDGE_START = 2,
    ARK_TRANSITION_EDGE_END = 3,
} Ark_TransitionEdge;
typedef struct Opt_TransitionEdge {
    Ark_Tag tag;
    Ark_TransitionEdge value;
} Opt_TransitionEdge;
typedef enum Ark_TransitionHierarchyStrategy {
    ARK_TRANSITION_HIERARCHY_STRATEGY_NONE = 0,
    ARK_TRANSITION_HIERARCHY_STRATEGY_ADAPTIVE = 1,
} Ark_TransitionHierarchyStrategy;
typedef struct Opt_TransitionHierarchyStrategy {
    Ark_Tag tag;
    Ark_TransitionHierarchyStrategy value;
} Opt_TransitionHierarchyStrategy;
typedef enum Ark_TransitionType {
    ARK_TRANSITION_TYPE_ALL = 0,
    ARK_TRANSITION_TYPE_INSERT = 1,
    ARK_TRANSITION_TYPE_DELETE = 2,
} Ark_TransitionType;
typedef struct Opt_TransitionType {
    Ark_Tag tag;
    Ark_TransitionType value;
} Opt_TransitionType;
typedef enum Ark_VerticalAlign {
    ARK_VERTICAL_ALIGN_TOP = 0,
    ARK_VERTICAL_ALIGN_CENTER = 1,
    ARK_VERTICAL_ALIGN_BOTTOM = 2,
} Ark_VerticalAlign;
typedef struct Opt_VerticalAlign {
    Ark_Tag tag;
    Ark_VerticalAlign value;
} Opt_VerticalAlign;
typedef enum Ark_Visibility {
    ARK_VISIBILITY_VISIBLE = 0,
    ARK_VISIBILITY_HIDDEN = 1,
    ARK_VISIBILITY_NONE = 2,
} Ark_Visibility;
typedef struct Opt_Visibility {
    Ark_Tag tag;
    Ark_Visibility value;
} Opt_Visibility;
typedef enum Ark_Week {
    ARK_WEEK_MON = 0,
    ARK_WEEK_TUE = 1,
    ARK_WEEK_WED = 2,
    ARK_WEEK_THUR = 3,
    ARK_WEEK_FRI = 4,
    ARK_WEEK_SAT = 5,
    ARK_WEEK_SUN = 6,
} Ark_Week;
typedef struct Opt_Week {
    Ark_Tag tag;
    Ark_Week value;
} Opt_Week;
typedef enum Ark_WidthBreakpoint {
    ARK_WIDTH_BREAKPOINT_WIDTH_XS = 0,
    ARK_WIDTH_BREAKPOINT_WIDTH_SM = 1,
    ARK_WIDTH_BREAKPOINT_WIDTH_MD = 2,
    ARK_WIDTH_BREAKPOINT_WIDTH_LG = 3,
    ARK_WIDTH_BREAKPOINT_WIDTH_XL = 4,
} Ark_WidthBreakpoint;
typedef struct Opt_WidthBreakpoint {
    Ark_Tag tag;
    Ark_WidthBreakpoint value;
} Opt_WidthBreakpoint;
typedef enum Ark_WordBreak {
    ARK_WORD_BREAK_NORMAL = 0,
    ARK_WORD_BREAK_BREAK_ALL = 1,
    ARK_WORD_BREAK_BREAK_WORD = 2,
} Ark_WordBreak;
typedef struct Opt_WordBreak {
    Ark_Tag tag;
    Ark_WordBreak value;
} Opt_WordBreak;
typedef enum Ark_XComponentType {
    ARK_XCOMPONENT_TYPE_SURFACE = 0,
    ARK_XCOMPONENT_TYPE_COMPONENT = 1,
    ARK_XCOMPONENT_TYPE_TEXTURE = 2,
    ARK_XCOMPONENT_TYPE_NODE = 3,
} Ark_XComponentType;
typedef struct Opt_XComponentType {
    Ark_Tag tag;
    Ark_XComponentType value;
} Opt_XComponentType;
typedef struct Opt_Int32 {
    Ark_Tag tag;
    Ark_Int32 value;
} Opt_Int32;
typedef struct AccessibilityCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean isHover, const Ark_AccessibilityHoverEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean isHover, const Ark_AccessibilityHoverEvent event);
} AccessibilityCallback;
typedef struct Opt_AccessibilityCallback {
    Ark_Tag tag;
    AccessibilityCallback value;
} Opt_AccessibilityCallback;
typedef struct Opt_BaseShape {
    Ark_Tag tag;
    Ark_BaseShape value;
} Opt_BaseShape;
typedef struct Ark_BlankAttribute {
    /* kind: Interface */
    void *handle;
} Ark_BlankAttribute;
typedef struct Opt_BlankAttribute {
    Ark_Tag tag;
    Ark_BlankAttribute value;
} Opt_BlankAttribute;
typedef struct Opt_Boolean {
    Ark_Tag tag;
    Ark_Boolean value;
} Opt_Boolean;
typedef struct Ark_BooleanInterfaceDTS {
    /* kind: Interface */
    Ark_Boolean valBool;
} Ark_BooleanInterfaceDTS;
typedef struct Opt_BooleanInterfaceDTS {
    Ark_Tag tag;
    Ark_BooleanInterfaceDTS value;
} Opt_BooleanInterfaceDTS;
typedef struct Opt_Buffer {
    Ark_Tag tag;
    Ark_Buffer value;
} Opt_Buffer;
typedef struct Ark_ButtonAttribute {
    /* kind: Interface */
    void *handle;
} Ark_ButtonAttribute;
typedef struct Opt_ButtonAttribute {
    Ark_Tag tag;
    Ark_ButtonAttribute value;
} Opt_ButtonAttribute;
typedef struct Ark_CalendarPickerAttribute {
    /* kind: Interface */
    void *handle;
} Ark_CalendarPickerAttribute;
typedef struct Opt_CalendarPickerAttribute {
    Ark_Tag tag;
    Ark_CalendarPickerAttribute value;
} Opt_CalendarPickerAttribute;
typedef struct Ark_CanvasAttribute {
    /* kind: Interface */
    void *handle;
} Ark_CanvasAttribute;
typedef struct Opt_CanvasAttribute {
    Ark_Tag tag;
    Ark_CanvasAttribute value;
} Opt_CanvasAttribute;
typedef struct Opt_CanvasGradient {
    Ark_Tag tag;
    Ark_CanvasGradient value;
} Opt_CanvasGradient;
typedef struct Opt_CanvasPath {
    Ark_Tag tag;
    Ark_CanvasPath value;
} Opt_CanvasPath;
typedef struct Opt_CanvasPattern {
    Ark_Tag tag;
    Ark_CanvasPattern value;
} Opt_CanvasPattern;
typedef struct Ark_ClassDTS {
    /* kind: Interface */
    Ark_Boolean valBoolean;
} Ark_ClassDTS;
typedef struct Opt_ClassDTS {
    Ark_Tag tag;
    Ark_ClassDTS value;
} Opt_ClassDTS;
typedef struct Opt_ClassWithConstructorAndAllOptionalParamsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndAllOptionalParamsDTS value;
} Opt_ClassWithConstructorAndAllOptionalParamsDTS;
typedef struct Opt_ClassWithConstructorAndMethodsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndMethodsDTS value;
} Opt_ClassWithConstructorAndMethodsDTS;
typedef struct Opt_ClassWithConstructorAndNonOptionalParamsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndNonOptionalParamsDTS value;
} Opt_ClassWithConstructorAndNonOptionalParamsDTS;
typedef struct Opt_ClassWithConstructorAndSomeOptionalParamsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndSomeOptionalParamsDTS value;
} Opt_ClassWithConstructorAndSomeOptionalParamsDTS;
typedef struct Opt_ClassWithConstructorAndStaticMethodsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndStaticMethodsDTS value;
} Opt_ClassWithConstructorAndStaticMethodsDTS;
typedef struct Opt_ClassWithConstructorAndWithoutParamsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndWithoutParamsDTS value;
} Opt_ClassWithConstructorAndWithoutParamsDTS;
typedef struct Opt_ClassWithConstructorDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorDTS value;
} Opt_ClassWithConstructorDTS;
typedef struct Ark_ColorContent {
    /* kind: Interface */
    void *handle;
} Ark_ColorContent;
typedef struct Opt_ColorContent {
    Ark_Tag tag;
    Ark_ColorContent value;
} Opt_ColorContent;
typedef struct Opt_ColorFilter {
    Ark_Tag tag;
    Ark_ColorFilter value;
} Opt_ColorFilter;
typedef struct Ark_ColumnAttribute {
    /* kind: Interface */
    void *handle;
} Ark_ColumnAttribute;
typedef struct Opt_ColumnAttribute {
    Ark_Tag tag;
    Ark_ColumnAttribute value;
} Opt_ColumnAttribute;
typedef struct Opt_CommonShape {
    Ark_Tag tag;
    Ark_CommonShape value;
} Opt_CommonShape;
typedef struct Ark_CounterAttribute {
    /* kind: Interface */
    void *handle;
} Ark_CounterAttribute;
typedef struct Opt_CounterAttribute {
    Ark_Tag tag;
    Ark_CounterAttribute value;
} Opt_CounterAttribute;
typedef struct Opt_CustomDialogController {
    Ark_Tag tag;
    Ark_CustomDialogController value;
} Opt_CustomDialogController;
typedef struct Opt_CustomObject {
    Ark_Tag tag;
    Ark_CustomObject value;
} Opt_CustomObject;
typedef struct Ark_DividerAttribute {
    /* kind: Interface */
    void *handle;
} Ark_DividerAttribute;
typedef struct Opt_DividerAttribute {
    Ark_Tag tag;
    Ark_DividerAttribute value;
} Opt_DividerAttribute;
typedef struct Opt_DragEvent {
    Ark_Tag tag;
    Ark_DragEvent value;
} Opt_DragEvent;
typedef struct Ark_DrawingCanvas {
    /* kind: Interface */
    void *handle;
} Ark_DrawingCanvas;
typedef struct Opt_DrawingCanvas {
    Ark_Tag tag;
    Ark_DrawingCanvas value;
} Opt_DrawingCanvas;
typedef struct Opt_DrawingColorFilter {
    Ark_Tag tag;
    Ark_DrawingColorFilter value;
} Opt_DrawingColorFilter;
typedef struct Opt_DrawingLattice {
    Ark_Tag tag;
    Ark_DrawingLattice value;
} Opt_DrawingLattice;
typedef struct Ark_EdgeEffectOptions {
    /* kind: Interface */
    Ark_Boolean alwaysEnabled;
} Ark_EdgeEffectOptions;
typedef struct Opt_EdgeEffectOptions {
    Ark_Tag tag;
    Ark_EdgeEffectOptions value;
} Opt_EdgeEffectOptions;
typedef struct Ark_EmbeddedComponentAttribute {
    /* kind: Interface */
    void *handle;
} Ark_EmbeddedComponentAttribute;
typedef struct Opt_EmbeddedComponentAttribute {
    Ark_Tag tag;
    Ark_EmbeddedComponentAttribute value;
} Opt_EmbeddedComponentAttribute;
typedef struct Opt_EventTargetInfo {
    Ark_Tag tag;
    Ark_EventTargetInfo value;
} Opt_EventTargetInfo;
typedef struct Ark_FlexAttribute {
    /* kind: Interface */
    void *handle;
} Ark_FlexAttribute;
typedef struct Opt_FlexAttribute {
    Ark_Tag tag;
    Ark_FlexAttribute value;
} Opt_FlexAttribute;
typedef struct Opt_Float32 {
    Ark_Tag tag;
    Ark_Float32 value;
} Opt_Float32;
typedef struct Ark_FormComponentAttribute {
    /* kind: Interface */
    void *handle;
} Ark_FormComponentAttribute;
typedef struct Opt_FormComponentAttribute {
    Ark_Tag tag;
    Ark_FormComponentAttribute value;
} Opt_FormComponentAttribute;
typedef struct Opt_GestureGroupInterface {
    Ark_Tag tag;
    Ark_GestureGroupInterface value;
} Opt_GestureGroupInterface;
typedef struct Opt_GestureModifier {
    Ark_Tag tag;
    Ark_GestureModifier value;
} Opt_GestureModifier;
typedef struct Opt_GestureRecognizer {
    Ark_Tag tag;
    Ark_GestureRecognizer value;
} Opt_GestureRecognizer;
typedef struct Opt_GestureStyle {
    Ark_Tag tag;
    Ark_GestureStyle value;
} Opt_GestureStyle;
typedef struct Ark_GridAttribute {
    /* kind: Interface */
    void *handle;
} Ark_GridAttribute;
typedef struct Opt_GridAttribute {
    Ark_Tag tag;
    Ark_GridAttribute value;
} Opt_GridAttribute;
typedef struct Ark_GridItemAttribute {
    /* kind: Interface */
    void *handle;
} Ark_GridItemAttribute;
typedef struct Opt_GridItemAttribute {
    Ark_Tag tag;
    Ark_GridItemAttribute value;
} Opt_GridItemAttribute;
typedef struct Opt_ICurve {
    Ark_Tag tag;
    Ark_ICurve value;
} Opt_ICurve;
typedef struct Opt_ImageAnalyzerController {
    Ark_Tag tag;
    Ark_ImageAnalyzerController value;
} Opt_ImageAnalyzerController;
typedef struct Ark_ImageAttribute {
    /* kind: Interface */
    void *handle;
} Ark_ImageAttribute;
typedef struct Opt_ImageAttribute {
    Ark_Tag tag;
    Ark_ImageAttribute value;
} Opt_ImageAttribute;
typedef struct Opt_ImageBitmap {
    Ark_Tag tag;
    Ark_ImageBitmap value;
} Opt_ImageBitmap;
typedef struct Ark_IndicatorComponentAttribute {
    /* kind: Interface */
    void *handle;
} Ark_IndicatorComponentAttribute;
typedef struct Opt_IndicatorComponentAttribute {
    Ark_Tag tag;
    Ark_IndicatorComponentAttribute value;
} Opt_IndicatorComponentAttribute;
typedef struct Opt_IndicatorComponentController {
    Ark_Tag tag;
    Ark_IndicatorComponentController value;
} Opt_IndicatorComponentController;
typedef struct Opt_Int64 {
    Ark_Tag tag;
    Ark_Int64 value;
} Opt_Int64;
typedef struct Opt_LayoutManager {
    Ark_Tag tag;
    Ark_LayoutManager value;
} Opt_LayoutManager;
typedef struct Ark_LayoutPolicy {
    /* kind: Interface */
    void *handle;
} Ark_LayoutPolicy;
typedef struct Opt_LayoutPolicy {
    Ark_Tag tag;
    Ark_LayoutPolicy value;
} Opt_LayoutPolicy;
typedef struct Opt_LinearGradient {
    Ark_Tag tag;
    Ark_LinearGradient value;
} Opt_LinearGradient;
typedef struct Ark_ListAttribute {
    /* kind: Interface */
    void *handle;
} Ark_ListAttribute;
typedef struct Opt_ListAttribute {
    Ark_Tag tag;
    Ark_ListAttribute value;
} Opt_ListAttribute;
typedef struct Ark_ListItemAttribute {
    /* kind: Interface */
    void *handle;
} Ark_ListItemAttribute;
typedef struct Opt_ListItemAttribute {
    Ark_Tag tag;
    Ark_ListItemAttribute value;
} Opt_ListItemAttribute;
typedef struct Opt_ListScroller {
    Ark_Tag tag;
    Ark_ListScroller value;
} Opt_ListScroller;
typedef struct Ark_Literal_Boolean_isVisible {
    /* kind: Interface */
    Ark_Boolean isVisible;
} Ark_Literal_Boolean_isVisible;
typedef struct Opt_Literal_Boolean_isVisible {
    Ark_Tag tag;
    Ark_Literal_Boolean_isVisible value;
} Opt_Literal_Boolean_isVisible;
typedef struct Opt_LongPressGestureInterface {
    Ark_Tag tag;
    Ark_LongPressGestureInterface value;
} Opt_LongPressGestureInterface;
typedef struct Opt_Measurable {
    Ark_Tag tag;
    Ark_Measurable value;
} Opt_Measurable;
typedef struct Opt_NativePointer {
    Ark_Tag tag;
    Ark_NativePointer value;
} Opt_NativePointer;
typedef struct Ark_NavDestinationAttribute {
    /* kind: Interface */
    void *handle;
} Ark_NavDestinationAttribute;
typedef struct Opt_NavDestinationAttribute {
    Ark_Tag tag;
    Ark_NavDestinationAttribute value;
} Opt_NavDestinationAttribute;
typedef struct Ark_NavigationAttribute {
    /* kind: Interface */
    void *handle;
} Ark_NavigationAttribute;
typedef struct Opt_NavigationAttribute {
    Ark_Tag tag;
    Ark_NavigationAttribute value;
} Opt_NavigationAttribute;
typedef struct Opt_NavPathStack {
    Ark_Tag tag;
    Ark_NavPathStack value;
} Opt_NavPathStack;
typedef struct Ark_NestedScrollOptions {
    /* kind: Interface */
    Ark_NestedScrollMode scrollForward;
    Ark_NestedScrollMode scrollBackward;
} Ark_NestedScrollOptions;
typedef struct Opt_NestedScrollOptions {
    Ark_Tag tag;
    Ark_NestedScrollOptions value;
} Opt_NestedScrollOptions;
typedef struct Opt_Number {
    Ark_Tag tag;
    Ark_Number value;
} Opt_Number;
typedef struct Ark_NumberInterfaceDTS {
    /* kind: Interface */
    Ark_Number valNumber;
} Ark_NumberInterfaceDTS;
typedef struct Opt_NumberInterfaceDTS {
    Ark_Tag tag;
    Ark_NumberInterfaceDTS value;
} Opt_NumberInterfaceDTS;
typedef struct Opt_Object {
    Ark_Tag tag;
    Ark_Object value;
} Opt_Object;
typedef struct Ark_Offset_componentutils {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
} Ark_Offset_componentutils;
typedef struct Opt_Offset_componentutils {
    Ark_Tag tag;
    Ark_Offset_componentutils value;
} Opt_Offset_componentutils;
typedef struct Ark_OffsetResult {
    /* kind: Interface */
    Ark_Number xOffset;
    Ark_Number yOffset;
} Ark_OffsetResult;
typedef struct Opt_OffsetResult {
    Ark_Tag tag;
    Ark_OffsetResult value;
} Opt_OffsetResult;
typedef struct Ark_OnScrollFrameBeginHandlerResult {
    /* kind: Interface */
    Ark_Number offsetRemain;
} Ark_OnScrollFrameBeginHandlerResult;
typedef struct Opt_OnScrollFrameBeginHandlerResult {
    Ark_Tag tag;
    Ark_OnScrollFrameBeginHandlerResult value;
} Opt_OnScrollFrameBeginHandlerResult;
typedef struct Opt_PanGestureInterface {
    Ark_Tag tag;
    Ark_PanGestureInterface value;
} Opt_PanGestureInterface;
typedef struct Opt_PanGestureOptions {
    Ark_Tag tag;
    Ark_PanGestureOptions value;
} Opt_PanGestureOptions;
typedef struct Opt_PanRecognizer {
    Ark_Tag tag;
    Ark_PanRecognizer value;
} Opt_PanRecognizer;
typedef struct Ark_PathAttribute {
    /* kind: Interface */
    void *handle;
} Ark_PathAttribute;
typedef struct Opt_PathAttribute {
    Ark_Tag tag;
    Ark_PathAttribute value;
} Opt_PathAttribute;
typedef struct Opt_PinchGestureInterface {
    Ark_Tag tag;
    Ark_PinchGestureInterface value;
} Opt_PinchGestureInterface;
typedef struct Opt_PixelMap {
    Ark_Tag tag;
    Ark_PixelMap value;
} Opt_PixelMap;
typedef struct Opt_PixelMapMock {
    Ark_Tag tag;
    Ark_PixelMapMock value;
} Opt_PixelMapMock;
typedef struct Ark_PositionWithAffinity {
    /* kind: Interface */
    Ark_Number position;
    Ark_CustomObject affinity;
} Ark_PositionWithAffinity;
typedef struct Opt_PositionWithAffinity {
    Ark_Tag tag;
    Ark_PositionWithAffinity value;
} Opt_PositionWithAffinity;
typedef struct Opt_ProgressMask {
    Ark_Tag tag;
    Ark_ProgressMask value;
} Opt_ProgressMask;
typedef struct Ark_RectAttribute {
    /* kind: Interface */
    void *handle;
} Ark_RectAttribute;
typedef struct Opt_RectAttribute {
    Ark_Tag tag;
    Ark_RectAttribute value;
} Opt_RectAttribute;
typedef struct Ark_RectResult {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
    Ark_Number width;
    Ark_Number height;
} Ark_RectResult;
typedef struct Opt_RectResult {
    Ark_Tag tag;
    Ark_RectResult value;
} Opt_RectResult;
typedef struct Ark_RichEditorAttribute {
    /* kind: Interface */
    void *handle;
} Ark_RichEditorAttribute;
typedef struct Opt_RichEditorAttribute {
    Ark_Tag tag;
    Ark_RichEditorAttribute value;
} Opt_RichEditorAttribute;
typedef struct Opt_RichEditorBaseController {
    Ark_Tag tag;
    Ark_RichEditorBaseController value;
} Opt_RichEditorBaseController;
typedef struct Opt_RichEditorController {
    Ark_Tag tag;
    Ark_RichEditorController value;
} Opt_RichEditorController;
typedef struct Ark_RichEditorOptions {
    /* kind: Interface */
    Ark_RichEditorController controller;
} Ark_RichEditorOptions;
typedef struct Opt_RichEditorOptions {
    Ark_Tag tag;
    Ark_RichEditorOptions value;
} Opt_RichEditorOptions;
typedef struct Opt_RichEditorStyledStringController {
    Ark_Tag tag;
    Ark_RichEditorStyledStringController value;
} Opt_RichEditorStyledStringController;
typedef struct Ark_RichEditorStyledStringOptions {
    /* kind: Interface */
    Ark_RichEditorStyledStringController controller;
} Ark_RichEditorStyledStringOptions;
typedef struct Opt_RichEditorStyledStringOptions {
    Ark_Tag tag;
    Ark_RichEditorStyledStringOptions value;
} Opt_RichEditorStyledStringOptions;
typedef struct Ark_RotateResult {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
    Ark_Number z;
    Ark_Number centerX;
    Ark_Number centerY;
    Ark_Number angle;
} Ark_RotateResult;
typedef struct Opt_RotateResult {
    Ark_Tag tag;
    Ark_RotateResult value;
} Opt_RotateResult;
typedef struct Opt_RotationGestureInterface {
    Ark_Tag tag;
    Ark_RotationGestureInterface value;
} Opt_RotationGestureInterface;
typedef struct Ark_RowAttribute {
    /* kind: Interface */
    void *handle;
} Ark_RowAttribute;
typedef struct Opt_RowAttribute {
    Ark_Tag tag;
    Ark_RowAttribute value;
} Opt_RowAttribute;
typedef struct Ark_ScaleResult {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
    Ark_Number z;
    Ark_Number centerX;
    Ark_Number centerY;
} Ark_ScaleResult;
typedef struct Opt_ScaleResult {
    Ark_Tag tag;
    Ark_ScaleResult value;
} Opt_ScaleResult;
typedef struct Opt_Scene {
    Ark_Tag tag;
    Ark_Scene value;
} Opt_Scene;
typedef struct Opt_ScrollableTargetInfo {
    Ark_Tag tag;
    Ark_ScrollableTargetInfo value;
} Opt_ScrollableTargetInfo;
typedef struct Ark_ScrollAttribute {
    /* kind: Interface */
    void *handle;
} Ark_ScrollAttribute;
typedef struct Opt_ScrollAttribute {
    Ark_Tag tag;
    Ark_ScrollAttribute value;
} Opt_ScrollAttribute;
typedef struct Opt_Scroller {
    Ark_Tag tag;
    Ark_Scroller value;
} Opt_Scroller;
typedef struct Ark_SearchAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SearchAttribute;
typedef struct Opt_SearchAttribute {
    Ark_Tag tag;
    Ark_SearchAttribute value;
} Opt_SearchAttribute;
typedef struct Opt_SearchController {
    Ark_Tag tag;
    Ark_SearchController value;
} Opt_SearchController;
typedef struct Ark_SelectAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SelectAttribute;
typedef struct Opt_SelectAttribute {
    Ark_Tag tag;
    Ark_SelectAttribute value;
} Opt_SelectAttribute;
typedef struct Ark_SideBarContainerAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SideBarContainerAttribute;
typedef struct Opt_SideBarContainerAttribute {
    Ark_Tag tag;
    Ark_SideBarContainerAttribute value;
} Opt_SideBarContainerAttribute;
typedef struct Ark_Size {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
} Ark_Size;
typedef struct Opt_Size {
    Ark_Tag tag;
    Ark_Size value;
} Opt_Size;
typedef struct Ark_SizeResult {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
} Ark_SizeResult;
typedef struct Opt_SizeResult {
    Ark_Tag tag;
    Ark_SizeResult value;
} Opt_SizeResult;
typedef struct Ark_SliderAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SliderAttribute;
typedef struct Opt_SliderAttribute {
    Ark_Tag tag;
    Ark_SliderAttribute value;
} Opt_SliderAttribute;
typedef struct Ark_SpanAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SpanAttribute;
typedef struct Opt_SpanAttribute {
    Ark_Tag tag;
    Ark_SpanAttribute value;
} Opt_SpanAttribute;
typedef struct Ark_StackAttribute {
    /* kind: Interface */
    void *handle;
} Ark_StackAttribute;
typedef struct Opt_StackAttribute {
    Ark_Tag tag;
    Ark_StackAttribute value;
} Opt_StackAttribute;
typedef struct Opt_String {
    Ark_Tag tag;
    Ark_String value;
} Opt_String;
typedef struct Ark_StringInterfaceDTS {
    /* kind: Interface */
    Ark_String valString;
} Ark_StringInterfaceDTS;
typedef struct Opt_StringInterfaceDTS {
    Ark_Tag tag;
    Ark_StringInterfaceDTS value;
} Opt_StringInterfaceDTS;
typedef struct Opt_StyledString {
    Ark_Tag tag;
    Ark_StyledString value;
} Opt_StyledString;
typedef struct Opt_StyledStringController {
    Ark_Tag tag;
    Ark_StyledStringController value;
} Opt_StyledStringController;
typedef struct Opt_SubmitEvent {
    Ark_Tag tag;
    Ark_SubmitEvent value;
} Opt_SubmitEvent;
typedef struct Opt_SwipeGestureInterface {
    Ark_Tag tag;
    Ark_SwipeGestureInterface value;
} Opt_SwipeGestureInterface;
typedef struct Ark_SwiperAnimationEvent {
    /* kind: Interface */
    Ark_Number currentOffset;
    Ark_Number targetOffset;
    Ark_Number velocity;
} Ark_SwiperAnimationEvent;
typedef struct Opt_SwiperAnimationEvent {
    Ark_Tag tag;
    Ark_SwiperAnimationEvent value;
} Opt_SwiperAnimationEvent;
typedef struct Ark_SwiperAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SwiperAttribute;
typedef struct Opt_SwiperAttribute {
    Ark_Tag tag;
    Ark_SwiperAttribute value;
} Opt_SwiperAttribute;
typedef struct Opt_SwiperContentTransitionProxy {
    Ark_Tag tag;
    Ark_SwiperContentTransitionProxy value;
} Opt_SwiperContentTransitionProxy;
typedef struct Opt_SwiperController {
    Ark_Tag tag;
    Ark_SwiperController value;
} Opt_SwiperController;
typedef struct Ark_SymbolEffect {
    /* kind: Interface */
    void *handle;
} Ark_SymbolEffect;
typedef struct Opt_SymbolEffect {
    Ark_Tag tag;
    Ark_SymbolEffect value;
} Opt_SymbolEffect;
typedef struct Ark_SymbolGlyphAttribute {
    /* kind: Interface */
    void *handle;
} Ark_SymbolGlyphAttribute;
typedef struct Opt_SymbolGlyphAttribute {
    Ark_Tag tag;
    Ark_SymbolGlyphAttribute value;
} Opt_SymbolGlyphAttribute;
typedef struct Ark_TabContentAttribute {
    /* kind: Interface */
    void *handle;
} Ark_TabContentAttribute;
typedef struct Opt_TabContentAttribute {
    Ark_Tag tag;
    Ark_TabContentAttribute value;
} Opt_TabContentAttribute;
typedef struct Ark_TabsAttribute {
    /* kind: Interface */
    void *handle;
} Ark_TabsAttribute;
typedef struct Opt_TabsAttribute {
    Ark_Tag tag;
    Ark_TabsAttribute value;
} Opt_TabsAttribute;
typedef struct Opt_TabsController {
    Ark_Tag tag;
    Ark_TabsController value;
} Opt_TabsController;
typedef struct Opt_TapGestureInterface {
    Ark_Tag tag;
    Ark_TapGestureInterface value;
} Opt_TapGestureInterface;
typedef struct Ark_Test1Attribute {
    /* kind: Interface */
    void *handle;
} Ark_Test1Attribute;
typedef struct Opt_Test1Attribute {
    Ark_Tag tag;
    Ark_Test1Attribute value;
} Opt_Test1Attribute;
typedef struct Ark_TextAttribute {
    /* kind: Interface */
    void *handle;
} Ark_TextAttribute;
typedef struct Opt_TextAttribute {
    Ark_Tag tag;
    Ark_TextAttribute value;
} Opt_TextAttribute;
typedef struct Opt_TextBaseController {
    Ark_Tag tag;
    Ark_TextBaseController value;
} Opt_TextBaseController;
typedef struct Opt_TextContentControllerBase {
    Ark_Tag tag;
    Ark_TextContentControllerBase value;
} Opt_TextContentControllerBase;
typedef struct Opt_TextController {
    Ark_Tag tag;
    Ark_TextController value;
} Opt_TextController;
typedef struct Opt_TextEditControllerEx {
    Ark_Tag tag;
    Ark_TextEditControllerEx value;
} Opt_TextEditControllerEx;
typedef struct Ark_TextInputAttribute {
    /* kind: Interface */
    void *handle;
} Ark_TextInputAttribute;
typedef struct Opt_TextInputAttribute {
    Ark_Tag tag;
    Ark_TextInputAttribute value;
} Opt_TextInputAttribute;
typedef struct Opt_TextInputController {
    Ark_Tag tag;
    Ark_TextInputController value;
} Opt_TextInputController;
typedef struct Opt_TextMenuItemId {
    Ark_Tag tag;
    Ark_TextMenuItemId value;
} Opt_TextMenuItemId;
typedef struct Ark_TextOptions {
    /* kind: Interface */
    Ark_TextController controller;
} Ark_TextOptions;
typedef struct Opt_TextOptions {
    Ark_Tag tag;
    Ark_TextOptions value;
} Opt_TextOptions;
typedef struct Ark_TextOverflowOptions {
    /* kind: Interface */
    Ark_TextOverflow overflow;
} Ark_TextOverflowOptions;
typedef struct Opt_TextOverflowOptions {
    Ark_Tag tag;
    Ark_TextOverflowOptions value;
} Opt_TextOverflowOptions;
typedef struct Ark_TextPickerAttribute {
    /* kind: Interface */
    void *handle;
} Ark_TextPickerAttribute;
typedef struct Opt_TextPickerAttribute {
    Ark_Tag tag;
    Ark_TextPickerAttribute value;
} Opt_TextPickerAttribute;
typedef struct Ark_TouchTestInfo {
    /* kind: Interface */
    Ark_Number windowX;
    Ark_Number windowY;
    Ark_Number parentX;
    Ark_Number parentY;
    Ark_Number x;
    Ark_Number y;
    Ark_RectResult rect;
    Ark_String id;
} Ark_TouchTestInfo;
typedef struct Opt_TouchTestInfo {
    Ark_Tag tag;
    Ark_TouchTestInfo value;
} Opt_TouchTestInfo;
typedef struct Opt_TransitionEffect {
    Ark_Tag tag;
    Ark_TransitionEffect value;
} Opt_TransitionEffect;
typedef struct Ark_TranslateResult {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
    Ark_Number z;
} Ark_TranslateResult;
typedef struct Opt_TranslateResult {
    Ark_Tag tag;
    Ark_TranslateResult value;
} Opt_TranslateResult;
typedef struct Ark_Tuple_Number_Boolean {
    /* kind: Interface */
    Ark_Number value0;
    Ark_Boolean value1;
} Ark_Tuple_Number_Boolean;
typedef struct Opt_Tuple_Number_Boolean {
    Ark_Tag tag;
    Ark_Tuple_Number_Boolean value;
} Opt_Tuple_Number_Boolean;
typedef struct Ark_Tuple_Number_Number {
    /* kind: Interface */
    Ark_Number value0;
    Ark_Number value1;
} Ark_Tuple_Number_Number;
typedef struct Opt_Tuple_Number_Number {
    Ark_Tag tag;
    Ark_Tuple_Number_Number value;
} Opt_Tuple_Number_Number;
typedef struct Ark_Tuple_Number_String_Boolean_EnumDTS {
    /* kind: Interface */
    Ark_Number value0;
    Ark_String value1;
    Ark_Boolean value2;
    Ark_EnumDTS value3;
} Ark_Tuple_Number_String_Boolean_EnumDTS;
typedef struct Opt_Tuple_Number_String_Boolean_EnumDTS {
    Ark_Tag tag;
    Ark_Tuple_Number_String_Boolean_EnumDTS value;
} Opt_Tuple_Number_String_Boolean_EnumDTS;
typedef struct Ark_Tuple_Number_String_EnumDTS {
    /* kind: Interface */
    Ark_Number value0;
    Ark_String value1;
    Ark_EnumDTS value2;
} Ark_Tuple_Number_String_EnumDTS;
typedef struct Opt_Tuple_Number_String_EnumDTS {
    Ark_Tag tag;
    Ark_Tuple_Number_String_EnumDTS value;
} Opt_Tuple_Number_String_EnumDTS;
typedef struct Ark_TupleInterfaceDTS {
    /* kind: Interface */
    Ark_Tuple_Number_Boolean tuple;
} Ark_TupleInterfaceDTS;
typedef struct Opt_TupleInterfaceDTS {
    Ark_Tag tag;
    Ark_TupleInterfaceDTS value;
} Opt_TupleInterfaceDTS;
typedef struct Ark_Type_ImageAttribute_onComplete_callback_event {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
    Ark_Number componentWidth;
    Ark_Number componentHeight;
    Ark_Number loadingStatus;
    Ark_Number contentWidth;
    Ark_Number contentHeight;
    Ark_Number contentOffsetX;
    Ark_Number contentOffsetY;
} Ark_Type_ImageAttribute_onComplete_callback_event;
typedef struct Opt_Type_ImageAttribute_onComplete_callback_event {
    Ark_Tag tag;
    Ark_Type_ImageAttribute_onComplete_callback_event value;
} Opt_Type_ImageAttribute_onComplete_callback_event;
typedef struct Opt_UICommonEvent {
    Ark_Tag tag;
    Ark_UICommonEvent value;
} Opt_UICommonEvent;
typedef struct Opt_UIExtensionProxy {
    Ark_Tag tag;
    Ark_UIExtensionProxy value;
} Opt_UIExtensionProxy;
typedef struct Ark_UIGestureEvent {
    /* kind: Interface */
    void *handle;
} Ark_UIGestureEvent;
typedef struct Opt_UIGestureEvent {
    Ark_Tag tag;
    Ark_UIGestureEvent value;
} Opt_UIGestureEvent;
typedef struct Opt_Undefined {
    Ark_Tag tag;
    Ark_Undefined value;
} Opt_Undefined;
typedef struct Ark_Union_BlendMode_Blender {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_BlendMode value0;
        Ark_CustomObject value1;
    };
} Ark_Union_BlendMode_Blender;
typedef struct Opt_Union_BlendMode_Blender {
    Ark_Tag tag;
    Ark_Union_BlendMode_Blender value;
} Opt_Union_BlendMode_Blender;
typedef struct Ark_Union_Boolean_EditMode {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_EditMode value1;
    };
} Ark_Union_Boolean_EditMode;
typedef struct Opt_Union_Boolean_EditMode {
    Ark_Tag tag;
    Ark_Union_Boolean_EditMode value;
} Opt_Union_Boolean_EditMode;
typedef struct Ark_Union_Boolean_EnumDTS {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_EnumDTS value1;
    };
} Ark_Union_Boolean_EnumDTS;
typedef struct Opt_Union_Boolean_EnumDTS {
    Ark_Tag tag;
    Ark_Union_Boolean_EnumDTS value;
} Opt_Union_Boolean_EnumDTS;
typedef struct Ark_Union_Boolean_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_Number value1;
    };
} Ark_Union_Boolean_Number;
typedef struct Opt_Union_Boolean_Number {
    Ark_Tag tag;
    Ark_Union_Boolean_Number value;
} Opt_Union_Boolean_Number;
typedef struct Ark_Union_Boolean_Resource {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_CustomObject value1;
    };
} Ark_Union_Boolean_Resource;
typedef struct Opt_Union_Boolean_Resource {
    Ark_Tag tag;
    Ark_Union_Boolean_Resource value;
} Opt_Union_Boolean_Resource;
typedef struct Ark_Union_Boolean_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_String value1;
    };
} Ark_Union_Boolean_String;
typedef struct Opt_Union_Boolean_String {
    Ark_Tag tag;
    Ark_Union_Boolean_String value;
} Opt_Union_Boolean_String;
typedef struct Ark_Union_Boolean_String_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_String value1;
        Ark_Number value2;
    };
} Ark_Union_Boolean_String_Number;
typedef struct Opt_Union_Boolean_String_Number {
    Ark_Tag tag;
    Ark_Union_Boolean_String_Number value;
} Opt_Union_Boolean_String_Number;
typedef struct Ark_Union_CircleShape_EllipseShape_PathShape_RectShape {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CustomObject value0;
        Ark_CustomObject value1;
        Ark_CustomObject value2;
        Ark_CustomObject value3;
    };
} Ark_Union_CircleShape_EllipseShape_PathShape_RectShape;
typedef struct Opt_Union_CircleShape_EllipseShape_PathShape_RectShape {
    Ark_Tag tag;
    Ark_Union_CircleShape_EllipseShape_PathShape_RectShape value;
} Opt_Union_CircleShape_EllipseShape_PathShape_RectShape;
typedef struct Ark_Union_Color_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Color value0;
        Ark_Number value1;
    };
} Ark_Union_Color_Number;
typedef struct Opt_Union_Color_Number {
    Ark_Tag tag;
    Ark_Union_Color_Number value;
} Opt_Union_Color_Number;
typedef struct Ark_Union_Color_Number_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Color value0;
        Ark_Number value1;
        Ark_String value2;
    };
} Ark_Union_Color_Number_String;
typedef struct Opt_Union_Color_Number_String {
    Ark_Tag tag;
    Ark_Union_Color_Number_String value;
} Opt_Union_Color_Number_String;
typedef struct Ark_Union_Color_String_Resource {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Color value0;
        Ark_String value1;
        Ark_CustomObject value2;
    };
} Ark_Union_Color_String_Resource;
typedef struct Opt_Union_Color_String_Resource {
    Ark_Tag tag;
    Ark_Union_Color_String_Resource value;
} Opt_Union_Color_String_Resource;
typedef struct Ark_Union_Color_String_Resource_ColoringStrategy {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Color value0;
        Ark_String value1;
        Ark_CustomObject value2;
        Ark_ColoringStrategy value3;
    };
} Ark_Union_Color_String_Resource_ColoringStrategy;
typedef struct Opt_Union_Color_String_Resource_ColoringStrategy {
    Ark_Tag tag;
    Ark_Union_Color_String_Resource_ColoringStrategy value;
} Opt_Union_Color_String_Resource_ColoringStrategy;
typedef struct Ark_Union_Color_String_Resource_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Color value0;
        Ark_String value1;
        Ark_CustomObject value2;
        Ark_Number value3;
    };
} Ark_Union_Color_String_Resource_Number;
typedef struct Opt_Union_Color_String_Resource_Number {
    Ark_Tag tag;
    Ark_Union_Color_String_Resource_Number value;
} Opt_Union_Color_String_Resource_Number;
typedef struct Ark_Union_ColorFilter_DrawingColorFilter {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ColorFilter value0;
        Ark_DrawingColorFilter value1;
    };
} Ark_Union_ColorFilter_DrawingColorFilter;
typedef struct Opt_Union_ColorFilter_DrawingColorFilter {
    Ark_Tag tag;
    Ark_Union_ColorFilter_DrawingColorFilter value;
} Opt_Union_ColorFilter_DrawingColorFilter;
typedef struct Ark_Union_ContentClipMode_RectShape {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ContentClipMode value0;
        Ark_CustomObject value1;
    };
} Ark_Union_ContentClipMode_RectShape;
typedef struct Opt_Union_ContentClipMode_RectShape {
    Ark_Tag tag;
    Ark_Union_ContentClipMode_RectShape value;
} Opt_Union_ContentClipMode_RectShape;
typedef struct Ark_Union_Curve_ICurve {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Curve value0;
        Ark_ICurve value1;
    };
} Ark_Union_Curve_ICurve;
typedef struct Opt_Union_Curve_ICurve {
    Ark_Tag tag;
    Ark_Union_Curve_ICurve value;
} Opt_Union_Curve_ICurve;
typedef struct Ark_Union_Curve_String_ICurve {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Curve value0;
        Ark_String value1;
        Ark_ICurve value2;
    };
} Ark_Union_Curve_String_ICurve;
typedef struct Opt_Union_Curve_String_ICurve {
    Ark_Tag tag;
    Ark_Union_Curve_String_ICurve value;
} Opt_Union_Curve_String_ICurve;
typedef struct Ark_Union_FontWeight_Number_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_FontWeight value0;
        Ark_Number value1;
        Ark_String value2;
    };
} Ark_Union_FontWeight_Number_String;
typedef struct Opt_Union_FontWeight_Number_String {
    Ark_Tag tag;
    Ark_Union_FontWeight_Number_String value;
} Opt_Union_FontWeight_Number_String;
typedef struct Ark_Union_Number_Boolean {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_Boolean value1;
    };
} Ark_Union_Number_Boolean;
typedef struct Opt_Union_Number_Boolean {
    Ark_Tag tag;
    Ark_Union_Number_Boolean value;
} Opt_Union_Number_Boolean;
typedef struct Ark_Union_Number_EnumDTS {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_EnumDTS value1;
    };
} Ark_Union_Number_EnumDTS;
typedef struct Opt_Union_Number_EnumDTS {
    Ark_Tag tag;
    Ark_Union_Number_EnumDTS value;
} Opt_Union_Number_EnumDTS;
typedef struct Ark_Union_Number_FontStyle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_FontStyle value1;
    };
} Ark_Union_Number_FontStyle;
typedef struct Opt_Union_Number_FontStyle {
    Ark_Tag tag;
    Ark_Union_Number_FontStyle value;
} Opt_Union_Number_FontStyle;
typedef struct Ark_Union_Number_FontWeight_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_FontWeight value1;
        Ark_String value2;
    };
} Ark_Union_Number_FontWeight_String;
typedef struct Opt_Union_Number_FontWeight_String {
    Ark_Tag tag;
    Ark_Union_Number_FontWeight_String value;
} Opt_Union_Number_FontWeight_String;
typedef struct Ark_Union_Number_Resource {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_CustomObject value1;
    };
} Ark_Union_Number_Resource;
typedef struct Opt_Union_Number_Resource {
    Ark_Tag tag;
    Ark_Union_Number_Resource value;
} Opt_Union_Number_Resource;
typedef struct Ark_Union_Number_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_String value1;
    };
} Ark_Union_Number_String;
typedef struct Opt_Union_Number_String {
    Ark_Tag tag;
    Ark_Union_Number_String value;
} Opt_Union_Number_String;
typedef struct Ark_Union_Number_String_FontWeight {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_String value1;
        Ark_FontWeight value2;
    };
} Ark_Union_Number_String_FontWeight;
typedef struct Opt_Union_Number_String_FontWeight {
    Ark_Tag tag;
    Ark_Union_Number_String_FontWeight value;
} Opt_Union_Number_String_FontWeight;
typedef struct Ark_Union_Number_String_Resource {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_String value1;
        Ark_CustomObject value2;
    };
} Ark_Union_Number_String_Resource;
typedef struct Opt_Union_Number_String_Resource {
    Ark_Tag tag;
    Ark_Union_Number_String_Resource value;
} Opt_Union_Number_String_Resource;
typedef struct Ark_Union_Number_TextCase {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_TextCase value1;
    };
} Ark_Union_Number_TextCase;
typedef struct Opt_Union_Number_TextCase {
    Ark_Tag tag;
    Ark_Union_Number_TextCase value;
} Opt_Union_Number_TextCase;
typedef struct Ark_Union_Number_TextOverflow {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_TextOverflow value1;
    };
} Ark_Union_Number_TextOverflow;
typedef struct Opt_Union_Number_TextOverflow {
    Ark_Tag tag;
    Ark_Union_Number_TextOverflow value;
} Opt_Union_Number_TextOverflow;
typedef struct Ark_Union_Resource_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CustomObject value0;
        Ark_String value1;
    };
} Ark_Union_Resource_String;
typedef struct Opt_Union_Resource_String {
    Ark_Tag tag;
    Ark_Union_Resource_String value;
} Opt_Union_Resource_String;
typedef struct Ark_Union_ResponseType_RichEditorResponseType {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResponseType value0;
        Ark_RichEditorResponseType value1;
    };
} Ark_Union_ResponseType_RichEditorResponseType;
typedef struct Opt_Union_ResponseType_RichEditorResponseType {
    Ark_Tag tag;
    Ark_Union_ResponseType_RichEditorResponseType value;
} Opt_Union_ResponseType_RichEditorResponseType;
typedef struct Ark_Union_String_EnumDTS_Boolean {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_EnumDTS value1;
        Ark_Boolean value2;
    };
} Ark_Union_String_EnumDTS_Boolean;
typedef struct Opt_Union_String_EnumDTS_Boolean {
    Ark_Tag tag;
    Ark_Union_String_EnumDTS_Boolean value;
} Opt_Union_String_EnumDTS_Boolean;
typedef struct Ark_Union_String_FunctionKey {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_FunctionKey value1;
    };
} Ark_Union_String_FunctionKey;
typedef struct Opt_Union_String_FunctionKey {
    Ark_Tag tag;
    Ark_Union_String_FunctionKey value;
} Opt_Union_String_FunctionKey;
typedef struct Ark_Union_String_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
    };
} Ark_Union_String_Number;
typedef struct Opt_Union_String_Number {
    Ark_Tag tag;
    Ark_Union_String_Number value;
} Opt_Union_String_Number;
typedef struct Ark_Union_String_Number_CanvasGradient_CanvasPattern {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
        Ark_CanvasGradient value2;
        Ark_CanvasPattern value3;
    };
} Ark_Union_String_Number_CanvasGradient_CanvasPattern;
typedef struct Opt_Union_String_Number_CanvasGradient_CanvasPattern {
    Ark_Tag tag;
    Ark_Union_String_Number_CanvasGradient_CanvasPattern value;
} Opt_Union_String_Number_CanvasGradient_CanvasPattern;
typedef struct Ark_Union_String_Number_Resource {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
        Ark_CustomObject value2;
    };
} Ark_Union_String_Number_Resource;
typedef struct Opt_Union_String_Number_Resource {
    Ark_Tag tag;
    Ark_Union_String_Number_Resource value;
} Opt_Union_String_Number_Resource;
typedef struct Ark_Union_String_Number_Resource_Buffer {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
        Ark_CustomObject value2;
        Ark_Buffer value3;
    };
} Ark_Union_String_Number_Resource_Buffer;
typedef struct Opt_Union_String_Number_Resource_Buffer {
    Ark_Tag tag;
    Ark_Union_String_Number_Resource_Buffer value;
} Opt_Union_String_Number_Resource_Buffer;
typedef struct Ark_Union_String_PixelMap_Resource_SymbolGlyphModifier {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_PixelMap value1;
        Ark_CustomObject value2;
        Ark_CustomObject value3;
    };
} Ark_Union_String_PixelMap_Resource_SymbolGlyphModifier;
typedef struct Opt_Union_String_PixelMap_Resource_SymbolGlyphModifier {
    Ark_Tag tag;
    Ark_Union_String_PixelMap_Resource_SymbolGlyphModifier value;
} Opt_Union_String_PixelMap_Resource_SymbolGlyphModifier;
typedef struct Ark_Union_String_Resource {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_CustomObject value1;
    };
} Ark_Union_String_Resource;
typedef struct Opt_Union_String_Resource {
    Ark_Tag tag;
    Ark_Union_String_Resource value;
} Opt_Union_String_Resource;
typedef struct Ark_Union_String_Resource_ComponentContent {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_CustomObject value1;
        Ark_CustomObject value2;
    };
} Ark_Union_String_Resource_ComponentContent;
typedef struct Opt_Union_String_Resource_ComponentContent {
    Ark_Tag tag;
    Ark_Union_String_Resource_ComponentContent value;
} Opt_Union_String_Resource_ComponentContent;
typedef struct Ark_Union_String_Resource_PixelMap {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_CustomObject value1;
        Ark_PixelMap value2;
    };
} Ark_Union_String_Resource_PixelMap;
typedef struct Opt_Union_String_Resource_PixelMap {
    Ark_Tag tag;
    Ark_Union_String_Resource_PixelMap value;
} Opt_Union_String_Resource_PixelMap;
typedef struct Ark_Union_TextInputStyle_TextContentStyle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_TextInputStyle value0;
        Ark_TextContentStyle value1;
    };
} Ark_Union_TextInputStyle_TextContentStyle;
typedef struct Opt_Union_TextInputStyle_TextContentStyle {
    Ark_Tag tag;
    Ark_Union_TextInputStyle_TextContentStyle value;
} Opt_Union_TextInputStyle_TextContentStyle;
typedef struct Ark_UnionInterfaceDTS {
    /* kind: Interface */
    Ark_Union_Number_Boolean unionProp;
} Ark_UnionInterfaceDTS;
typedef struct Opt_UnionInterfaceDTS {
    Ark_Tag tag;
    Ark_UnionInterfaceDTS value;
} Opt_UnionInterfaceDTS;
typedef struct Opt_UrlStyle {
    Ark_Tag tag;
    Ark_UrlStyle value;
} Opt_UrlStyle;
typedef struct Ark_UserDataSpan {
    /* kind: Interface */
    void *handle;
} Ark_UserDataSpan;
typedef struct Opt_UserDataSpan {
    Ark_Tag tag;
    Ark_UserDataSpan value;
} Opt_UserDataSpan;
typedef struct Ark_Vector1 {
    /* kind: Interface */
    Ark_Number x0;
    Ark_Number x1;
    Ark_Number x2;
    Ark_Number x3;
} Ark_Vector1;
typedef struct Opt_Vector1 {
    Ark_Tag tag;
    Ark_Vector1 value;
} Opt_Vector1;
typedef struct Ark_Vector2 {
    /* kind: Interface */
    Ark_Number t;
    Ark_Number x;
    Ark_Number y;
    Ark_Number z;
} Ark_Vector2;
typedef struct Opt_Vector2 {
    Ark_Tag tag;
    Ark_Vector2 value;
} Opt_Vector2;
typedef struct Ark_VectorAttribute {
    /* kind: Interface */
    void *handle;
} Ark_VectorAttribute;
typedef struct Opt_VectorAttribute {
    Ark_Tag tag;
    Ark_VectorAttribute value;
} Opt_VectorAttribute;
typedef struct Opt_View {
    Ark_Tag tag;
    Ark_View value;
} Opt_View;
typedef struct Ark_VP {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
    };
} Ark_VP;
typedef struct Opt_VP {
    Ark_Tag tag;
    Ark_VP value;
} Opt_VP;
typedef struct Ark_WebAttribute {
    /* kind: Interface */
    void *handle;
} Ark_WebAttribute;
typedef struct Opt_WebAttribute {
    Ark_Tag tag;
    Ark_WebAttribute value;
} Opt_WebAttribute;
typedef struct Opt_WebResourceResponse {
    Ark_Tag tag;
    Ark_WebResourceResponse value;
} Opt_WebResourceResponse;
typedef struct Ark_WorkerEventListener {
    /* kind: Interface */
    void *handle;
} Ark_WorkerEventListener;
typedef struct Opt_WorkerEventListener {
    Ark_Tag tag;
    Ark_WorkerEventListener value;
} Opt_WorkerEventListener;
typedef struct Array_AlertDialogButtonOptions {
    /* kind: ContainerType */
    Ark_AlertDialogButtonOptions* array;
    Ark_Int32 length;
} Array_AlertDialogButtonOptions;
typedef struct Opt_Array_AlertDialogButtonOptions {
    Ark_Tag tag;
    Array_AlertDialogButtonOptions value;
} Opt_Array_AlertDialogButtonOptions;
typedef struct Array_Array_String {
    /* kind: ContainerType */
    Array_String* array;
    Ark_Int32 length;
} Array_Array_String;
typedef struct Opt_Array_Array_String {
    Ark_Tag tag;
    Array_Array_String value;
} Opt_Array_Array_String;
typedef struct Array_Boolean {
    /* kind: ContainerType */
    Ark_Boolean* array;
    Ark_Int32 length;
} Array_Boolean;
typedef struct Opt_Array_Boolean {
    Ark_Tag tag;
    Array_Boolean value;
} Opt_Array_Boolean;
typedef struct Array_BooleanInterfaceDTS {
    /* kind: ContainerType */
    Ark_BooleanInterfaceDTS* array;
    Ark_Int32 length;
} Array_BooleanInterfaceDTS;
typedef struct Opt_Array_BooleanInterfaceDTS {
    Ark_Tag tag;
    Array_BooleanInterfaceDTS value;
} Opt_Array_BooleanInterfaceDTS;
typedef struct Array_Buffer {
    /* kind: ContainerType */
    Ark_Buffer* array;
    Ark_Int32 length;
} Array_Buffer;
typedef struct Opt_Array_Buffer {
    Ark_Tag tag;
    Array_Buffer value;
} Opt_Array_Buffer;
typedef struct Array_ColorStop {
    /* kind: ContainerType */
    Ark_ColorStop* array;
    Ark_Int32 length;
} Array_ColorStop;
typedef struct Opt_Array_ColorStop {
    Ark_Tag tag;
    Array_ColorStop value;
} Opt_Array_ColorStop;
typedef struct Array_CustomObject {
    /* kind: ContainerType */
    Ark_CustomObject* array;
    Ark_Int32 length;
} Array_CustomObject;
typedef struct Opt_Array_CustomObject {
    Ark_Tag tag;
    Array_CustomObject value;
} Opt_Array_CustomObject;
typedef struct Array_Dimension {
    /* kind: ContainerType */
    Ark_Dimension* array;
    Ark_Int32 length;
} Array_Dimension;
typedef struct Opt_Array_Dimension {
    Ark_Tag tag;
    Array_Dimension value;
} Opt_Array_Dimension;
typedef struct Array_DragPreviewMode {
    /* kind: ContainerType */
    Ark_DragPreviewMode* array;
    Ark_Int32 length;
} Array_DragPreviewMode;
typedef struct Opt_Array_DragPreviewMode {
    Ark_Tag tag;
    Array_DragPreviewMode value;
} Opt_Array_DragPreviewMode;
typedef struct Array_EnumDTS {
    /* kind: ContainerType */
    Ark_EnumDTS* array;
    Ark_Int32 length;
} Array_EnumDTS;
typedef struct Opt_Array_EnumDTS {
    Ark_Tag tag;
    Array_EnumDTS value;
} Opt_Array_EnumDTS;
typedef struct Array_FingerInfo {
    /* kind: ContainerType */
    Ark_FingerInfo* array;
    Ark_Int32 length;
} Array_FingerInfo;
typedef struct Opt_Array_FingerInfo {
    Ark_Tag tag;
    Array_FingerInfo value;
} Opt_Array_FingerInfo;
typedef struct Array_FractionStop {
    /* kind: ContainerType */
    Ark_FractionStop* array;
    Ark_Int32 length;
} Array_FractionStop;
typedef struct Opt_Array_FractionStop {
    Ark_Tag tag;
    Array_FractionStop value;
} Opt_Array_FractionStop;
typedef struct Array_GestureRecognizer {
    /* kind: ContainerType */
    Ark_GestureRecognizer* array;
    Ark_Int32 length;
} Array_GestureRecognizer;
typedef struct Opt_Array_GestureRecognizer {
    Ark_Tag tag;
    Array_GestureRecognizer value;
} Opt_Array_GestureRecognizer;
typedef struct Array_GestureType {
    /* kind: ContainerType */
    Ark_GestureType* array;
    Ark_Int32 length;
} Array_GestureType;
typedef struct Opt_Array_GestureType {
    Ark_Tag tag;
    Array_GestureType value;
} Opt_Array_GestureType;
typedef struct Array_HistoricalPoint {
    /* kind: ContainerType */
    Ark_HistoricalPoint* array;
    Ark_Int32 length;
} Array_HistoricalPoint;
typedef struct Opt_Array_HistoricalPoint {
    Ark_Tag tag;
    Array_HistoricalPoint value;
} Opt_Array_HistoricalPoint;
typedef struct Array_ImageAnalyzerType {
    /* kind: ContainerType */
    Ark_ImageAnalyzerType* array;
    Ark_Int32 length;
} Array_ImageAnalyzerType;
typedef struct Opt_Array_ImageAnalyzerType {
    Ark_Tag tag;
    Array_ImageAnalyzerType value;
} Opt_Array_ImageAnalyzerType;
typedef struct Array_Layoutable {
    /* kind: ContainerType */
    Ark_Layoutable* array;
    Ark_Int32 length;
} Array_Layoutable;
typedef struct Opt_Array_Layoutable {
    Ark_Tag tag;
    Array_Layoutable value;
} Opt_Array_Layoutable;
typedef struct Array_LayoutSafeAreaEdge {
    /* kind: ContainerType */
    Ark_LayoutSafeAreaEdge* array;
    Ark_Int32 length;
} Array_LayoutSafeAreaEdge;
typedef struct Opt_Array_LayoutSafeAreaEdge {
    Ark_Tag tag;
    Array_LayoutSafeAreaEdge value;
} Opt_Array_LayoutSafeAreaEdge;
typedef struct Array_LayoutSafeAreaType {
    /* kind: ContainerType */
    Ark_LayoutSafeAreaType* array;
    Ark_Int32 length;
} Array_LayoutSafeAreaType;
typedef struct Opt_Array_LayoutSafeAreaType {
    Ark_Tag tag;
    Array_LayoutSafeAreaType value;
} Opt_Array_LayoutSafeAreaType;
typedef struct Array_Length {
    /* kind: ContainerType */
    Ark_Length* array;
    Ark_Int32 length;
} Array_Length;
typedef struct Opt_Array_Length {
    Ark_Tag tag;
    Array_Length value;
} Opt_Array_Length;
typedef struct Array_Measurable {
    /* kind: ContainerType */
    Ark_Measurable* array;
    Ark_Int32 length;
} Array_Measurable;
typedef struct Opt_Array_Measurable {
    Ark_Tag tag;
    Array_Measurable value;
} Opt_Array_Measurable;
typedef struct Array_MenuElement {
    /* kind: ContainerType */
    Ark_MenuElement* array;
    Ark_Int32 length;
} Array_MenuElement;
typedef struct Opt_Array_MenuElement {
    Ark_Tag tag;
    Array_MenuElement value;
} Opt_Array_MenuElement;
typedef struct Array_ModifierKey {
    /* kind: ContainerType */
    Ark_ModifierKey* array;
    Ark_Int32 length;
} Array_ModifierKey;
typedef struct Opt_Array_ModifierKey {
    Ark_Tag tag;
    Array_ModifierKey value;
} Opt_Array_ModifierKey;
typedef struct Array_NavigationMenuItem {
    /* kind: ContainerType */
    Ark_NavigationMenuItem* array;
    Ark_Int32 length;
} Array_NavigationMenuItem;
typedef struct Opt_Array_NavigationMenuItem {
    Ark_Tag tag;
    Array_NavigationMenuItem value;
} Opt_Array_NavigationMenuItem;
typedef struct Array_Number {
    /* kind: ContainerType */
    Ark_Number* array;
    Ark_Int32 length;
} Array_Number;
typedef struct Opt_Array_Number {
    Ark_Tag tag;
    Array_Number value;
} Opt_Array_Number;
typedef struct Array_Object {
    /* kind: ContainerType */
    Ark_Object* array;
    Ark_Int32 length;
} Array_Object;
typedef struct Opt_Array_Object {
    Ark_Tag tag;
    Array_Object value;
} Opt_Array_Object;
typedef struct Array_ObscuredReasons {
    /* kind: ContainerType */
    Ark_ObscuredReasons* array;
    Ark_Int32 length;
} Array_ObscuredReasons;
typedef struct Opt_Array_ObscuredReasons {
    Ark_Tag tag;
    Array_ObscuredReasons value;
} Opt_Array_ObscuredReasons;
typedef struct Array_Rectangle {
    /* kind: ContainerType */
    Ark_Rectangle* array;
    Ark_Int32 length;
} Array_Rectangle;
typedef struct Opt_Array_Rectangle {
    Ark_Tag tag;
    Array_Rectangle value;
} Opt_Array_Rectangle;
typedef struct Array_ResourceColor {
    /* kind: ContainerType */
    Ark_ResourceColor* array;
    Ark_Int32 length;
} Array_ResourceColor;
typedef struct Opt_Array_ResourceColor {
    Ark_Tag tag;
    Array_ResourceColor value;
} Opt_Array_ResourceColor;
typedef struct Array_RichEditorImageSpanResult {
    /* kind: ContainerType */
    Ark_RichEditorImageSpanResult* array;
    Ark_Int32 length;
} Array_RichEditorImageSpanResult;
typedef struct Opt_Array_RichEditorImageSpanResult {
    Ark_Tag tag;
    Array_RichEditorImageSpanResult value;
} Opt_Array_RichEditorImageSpanResult;
typedef struct Array_RichEditorParagraphResult {
    /* kind: ContainerType */
    Ark_RichEditorParagraphResult* array;
    Ark_Int32 length;
} Array_RichEditorParagraphResult;
typedef struct Opt_Array_RichEditorParagraphResult {
    Ark_Tag tag;
    Array_RichEditorParagraphResult value;
} Opt_Array_RichEditorParagraphResult;
typedef struct Array_RichEditorTextSpanResult {
    /* kind: ContainerType */
    Ark_RichEditorTextSpanResult* array;
    Ark_Int32 length;
} Array_RichEditorTextSpanResult;
typedef struct Opt_Array_RichEditorTextSpanResult {
    Ark_Tag tag;
    Array_RichEditorTextSpanResult value;
} Opt_Array_RichEditorTextSpanResult;
typedef struct Array_SafeAreaEdge {
    /* kind: ContainerType */
    Ark_SafeAreaEdge* array;
    Ark_Int32 length;
} Array_SafeAreaEdge;
typedef struct Opt_Array_SafeAreaEdge {
    Ark_Tag tag;
    Array_SafeAreaEdge value;
} Opt_Array_SafeAreaEdge;
typedef struct Array_SafeAreaType {
    /* kind: ContainerType */
    Ark_SafeAreaType* array;
    Ark_Int32 length;
} Array_SafeAreaType;
typedef struct Opt_Array_SafeAreaType {
    Ark_Tag tag;
    Array_SafeAreaType value;
} Opt_Array_SafeAreaType;
typedef struct Array_SelectOption {
    /* kind: ContainerType */
    Ark_SelectOption* array;
    Ark_Int32 length;
} Array_SelectOption;
typedef struct Opt_Array_SelectOption {
    Ark_Tag tag;
    Array_SelectOption value;
} Opt_Array_SelectOption;
typedef struct Array_ShadowOptions {
    /* kind: ContainerType */
    Ark_ShadowOptions* array;
    Ark_Int32 length;
} Array_ShadowOptions;
typedef struct Opt_Array_ShadowOptions {
    Ark_Tag tag;
    Array_ShadowOptions value;
} Opt_Array_ShadowOptions;
typedef struct Array_SpanStyle {
    /* kind: ContainerType */
    Ark_SpanStyle* array;
    Ark_Int32 length;
} Array_SpanStyle;
typedef struct Opt_Array_SpanStyle {
    Ark_Tag tag;
    Array_SpanStyle value;
} Opt_Array_SpanStyle;
typedef struct Array_String {
    /* kind: ContainerType */
    Ark_String* array;
    Ark_Int32 length;
} Array_String;
typedef struct Opt_Array_String {
    Ark_Tag tag;
    Array_String value;
} Opt_Array_String;
typedef struct Array_StyleOptions {
    /* kind: ContainerType */
    Ark_StyleOptions* array;
    Ark_Int32 length;
} Array_StyleOptions;
typedef struct Opt_Array_StyleOptions {
    Ark_Tag tag;
    Array_StyleOptions value;
} Opt_Array_StyleOptions;
typedef struct Array_TextCascadePickerRangeContent {
    /* kind: ContainerType */
    Ark_TextCascadePickerRangeContent* array;
    Ark_Int32 length;
} Array_TextCascadePickerRangeContent;
typedef struct Opt_Array_TextCascadePickerRangeContent {
    Ark_Tag tag;
    Array_TextCascadePickerRangeContent value;
} Opt_Array_TextCascadePickerRangeContent;
typedef struct Array_TextDataDetectorType {
    /* kind: ContainerType */
    Ark_TextDataDetectorType* array;
    Ark_Int32 length;
} Array_TextDataDetectorType;
typedef struct Opt_Array_TextDataDetectorType {
    Ark_Tag tag;
    Array_TextDataDetectorType value;
} Opt_Array_TextDataDetectorType;
typedef struct Array_TextMenuItem {
    /* kind: ContainerType */
    Ark_TextMenuItem* array;
    Ark_Int32 length;
} Array_TextMenuItem;
typedef struct Opt_Array_TextMenuItem {
    Ark_Tag tag;
    Array_TextMenuItem value;
} Opt_Array_TextMenuItem;
typedef struct Array_TextPickerRangeContent {
    /* kind: ContainerType */
    Ark_TextPickerRangeContent* array;
    Ark_Int32 length;
} Array_TextPickerRangeContent;
typedef struct Opt_Array_TextPickerRangeContent {
    Ark_Tag tag;
    Array_TextPickerRangeContent value;
} Opt_Array_TextPickerRangeContent;
typedef struct Array_ToolbarItem {
    /* kind: ContainerType */
    Ark_ToolbarItem* array;
    Ark_Int32 length;
} Array_ToolbarItem;
typedef struct Opt_Array_ToolbarItem {
    Ark_Tag tag;
    Array_ToolbarItem value;
} Opt_Array_ToolbarItem;
typedef struct Array_TouchObject {
    /* kind: ContainerType */
    Ark_TouchObject* array;
    Ark_Int32 length;
} Array_TouchObject;
typedef struct Opt_Array_TouchObject {
    Ark_Tag tag;
    Array_TouchObject value;
} Opt_Array_TouchObject;
typedef struct Array_TouchTestInfo {
    /* kind: ContainerType */
    Ark_TouchTestInfo* array;
    Ark_Int32 length;
} Array_TouchTestInfo;
typedef struct Opt_Array_TouchTestInfo {
    Ark_Tag tag;
    Array_TouchTestInfo value;
} Opt_Array_TouchTestInfo;
typedef struct Array_Tuple_ResourceColor_Number {
    /* kind: ContainerType */
    Ark_Tuple_ResourceColor_Number* array;
    Ark_Int32 length;
} Array_Tuple_ResourceColor_Number;
typedef struct Opt_Array_Tuple_ResourceColor_Number {
    Ark_Tag tag;
    Array_Tuple_ResourceColor_Number value;
} Opt_Array_Tuple_ResourceColor_Number;
typedef struct Array_Union_Color_Number {
    /* kind: ContainerType */
    Ark_Union_Color_Number* array;
    Ark_Int32 length;
} Array_Union_Color_Number;
typedef struct Opt_Array_Union_Color_Number {
    Ark_Tag tag;
    Array_Union_Color_Number value;
} Opt_Array_Union_Color_Number;
typedef struct Array_Union_Number_String {
    /* kind: ContainerType */
    Ark_Union_Number_String* array;
    Ark_Int32 length;
} Array_Union_Number_String;
typedef struct Opt_Array_Union_Number_String {
    Ark_Tag tag;
    Array_Union_Number_String value;
} Opt_Array_Union_Number_String;
typedef struct Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult {
    /* kind: ContainerType */
    Ark_Union_RichEditorImageSpanResult_RichEditorTextSpanResult* array;
    Ark_Int32 length;
} Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Opt_Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult {
    Ark_Tag tag;
    Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult value;
} Opt_Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult {
    /* kind: ContainerType */
    Ark_Union_RichEditorTextSpanResult_RichEditorImageSpanResult* array;
    Ark_Int32 length;
} Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef struct Opt_Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult {
    Ark_Tag tag;
    Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult value;
} Opt_Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef struct AsyncCallback_Array_TextMenuItem_Array_TextMenuItem {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Array_TextMenuItem menuItems, const Callback_Array_TextMenuItem_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Array_TextMenuItem menuItems, const Callback_Array_TextMenuItem_Void continuation);
} AsyncCallback_Array_TextMenuItem_Array_TextMenuItem;
typedef struct Opt_AsyncCallback_Array_TextMenuItem_Array_TextMenuItem {
    Ark_Tag tag;
    AsyncCallback_Array_TextMenuItem_Array_TextMenuItem value;
} Opt_AsyncCallback_Array_TextMenuItem_Array_TextMenuItem;
typedef struct AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_CustomSpanMeasureInfo measureInfo, const Callback_CustomSpanMetrics_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_CustomSpanMeasureInfo measureInfo, const Callback_CustomSpanMetrics_Void continuation);
} AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics;
typedef struct Opt_AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics {
    Ark_Tag tag;
    AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics value;
} Opt_AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics;
typedef struct AsyncCallback_image_PixelMap_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_PixelMap result);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_PixelMap result);
} AsyncCallback_image_PixelMap_Void;
typedef struct Opt_AsyncCallback_image_PixelMap_Void {
    Ark_Tag tag;
    AsyncCallback_image_PixelMap_Void value;
} Opt_AsyncCallback_image_PixelMap_Void;
typedef struct AsyncCallback_TextMenuItem_TextRange_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TextMenuItem menuItem, const Ark_TextRange range, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TextMenuItem menuItem, const Ark_TextRange range, const Callback_Boolean_Void continuation);
} AsyncCallback_TextMenuItem_TextRange_Boolean;
typedef struct Opt_AsyncCallback_TextMenuItem_TextRange_Boolean {
    Ark_Tag tag;
    AsyncCallback_TextMenuItem_TextRange_Boolean value;
} Opt_AsyncCallback_TextMenuItem_TextRange_Boolean;
typedef struct ButtonTriggerClickCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number xPos, const Ark_Number yPos);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number xPos, const Ark_Number yPos);
} ButtonTriggerClickCallback;
typedef struct Opt_ButtonTriggerClickCallback {
    Ark_Tag tag;
    ButtonTriggerClickCallback value;
} Opt_ButtonTriggerClickCallback;
typedef struct Callback_Area_Area_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Area oldValue, const Ark_Area newValue);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Area oldValue, const Ark_Area newValue);
} Callback_Area_Area_Void;
typedef struct Opt_Callback_Area_Area_Void {
    Ark_Tag tag;
    Callback_Area_Area_Void value;
} Opt_Callback_Area_Area_Void;
typedef struct Callback_Array_TextMenuItem_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Array_TextMenuItem value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Array_TextMenuItem value);
} Callback_Array_TextMenuItem_Void;
typedef struct Opt_Callback_Array_TextMenuItem_Void {
    Ark_Tag tag;
    Callback_Array_TextMenuItem_Void value;
} Opt_Callback_Array_TextMenuItem_Void;
typedef struct Callback_Array_TouchTestInfo_TouchResult {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Array_TouchTestInfo value, const Callback_TouchResult_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Array_TouchTestInfo value, const Callback_TouchResult_Void continuation);
} Callback_Array_TouchTestInfo_TouchResult;
typedef struct Opt_Callback_Array_TouchTestInfo_TouchResult {
    Ark_Tag tag;
    Callback_Array_TouchTestInfo_TouchResult value;
} Opt_Callback_Array_TouchTestInfo_TouchResult;
typedef struct Callback_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Callback_Boolean_Void continuation);
} Callback_Boolean;
typedef struct Opt_Callback_Boolean {
    Ark_Tag tag;
    Callback_Boolean value;
} Opt_Callback_Boolean;
typedef struct Callback_Boolean_HoverEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean isHover, const Ark_HoverEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean isHover, const Ark_HoverEvent event);
} Callback_Boolean_HoverEvent_Void;
typedef struct Opt_Callback_Boolean_HoverEvent_Void {
    Ark_Tag tag;
    Callback_Boolean_HoverEvent_Void value;
} Opt_Callback_Boolean_HoverEvent_Void;
typedef struct Callback_Boolean_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean isSelected);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean isSelected);
} Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void {
    Ark_Tag tag;
    Callback_Boolean_Void value;
} Opt_Callback_Boolean_Void;
typedef struct Callback_ClickEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ClickEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ClickEvent event);
} Callback_ClickEvent_Void;
typedef struct Opt_Callback_ClickEvent_Void {
    Ark_Tag tag;
    Callback_ClickEvent_Void value;
} Opt_Callback_ClickEvent_Void;
typedef struct Callback_CopyEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_CopyEvent parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_CopyEvent parameter);
} Callback_CopyEvent_Void;
typedef struct Opt_Callback_CopyEvent_Void {
    Ark_Tag tag;
    Callback_CopyEvent_Void value;
} Opt_Callback_CopyEvent_Void;
typedef struct Callback_CreateItem {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Int32 index, const Callback_Pointer_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Int32 index, const Callback_Pointer_Void continuation);
} Callback_CreateItem;
typedef struct Opt_Callback_CreateItem {
    Ark_Tag tag;
    Callback_CreateItem value;
} Opt_Callback_CreateItem;
typedef struct Callback_CustomBuilder_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const CustomNodeBuilder value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const CustomNodeBuilder value);
} Callback_CustomBuilder_Void;
typedef struct Opt_Callback_CustomBuilder_Void {
    Ark_Tag tag;
    Callback_CustomBuilder_Void value;
} Opt_Callback_CustomBuilder_Void;
typedef struct Callback_CustomSpanMetrics_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_CustomSpanMetrics value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_CustomSpanMetrics value);
} Callback_CustomSpanMetrics_Void;
typedef struct Opt_Callback_CustomSpanMetrics_Void {
    Ark_Tag tag;
    Callback_CustomSpanMetrics_Void value;
} Opt_Callback_CustomSpanMetrics_Void;
typedef struct Callback_CutEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_CutEvent parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_CutEvent parameter);
} Callback_CutEvent_Void;
typedef struct Opt_Callback_CutEvent_Void {
    Ark_Tag tag;
    Callback_CutEvent_Void value;
} Opt_Callback_CutEvent_Void;
typedef struct Callback_DeleteValue_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DeleteValue parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DeleteValue parameter, const Callback_Boolean_Void continuation);
} Callback_DeleteValue_Boolean;
typedef struct Opt_Callback_DeleteValue_Boolean {
    Ark_Tag tag;
    Callback_DeleteValue_Boolean value;
} Opt_Callback_DeleteValue_Boolean;
typedef struct Callback_DeleteValue_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DeleteValue parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DeleteValue parameter);
} Callback_DeleteValue_Void;
typedef struct Opt_Callback_DeleteValue_Void {
    Ark_Tag tag;
    Callback_DeleteValue_Void value;
} Opt_Callback_DeleteValue_Void;
typedef struct Callback_DismissContentCoverAction_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DismissContentCoverAction parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DismissContentCoverAction parameter);
} Callback_DismissContentCoverAction_Void;
typedef struct Opt_Callback_DismissContentCoverAction_Void {
    Ark_Tag tag;
    Callback_DismissContentCoverAction_Void value;
} Opt_Callback_DismissContentCoverAction_Void;
typedef struct Callback_DismissDialogAction_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DismissDialogAction parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DismissDialogAction parameter);
} Callback_DismissDialogAction_Void;
typedef struct Opt_Callback_DismissDialogAction_Void {
    Ark_Tag tag;
    Callback_DismissDialogAction_Void value;
} Opt_Callback_DismissDialogAction_Void;
typedef struct Callback_DismissPopupAction_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DismissPopupAction parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DismissPopupAction parameter);
} Callback_DismissPopupAction_Void;
typedef struct Opt_Callback_DismissPopupAction_Void {
    Ark_Tag tag;
    Callback_DismissPopupAction_Void value;
} Opt_Callback_DismissPopupAction_Void;
typedef struct Callback_DismissSheetAction_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DismissSheetAction parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DismissSheetAction parameter);
} Callback_DismissSheetAction_Void;
typedef struct Opt_Callback_DismissSheetAction_Void {
    Ark_Tag tag;
    Callback_DismissSheetAction_Void value;
} Opt_Callback_DismissSheetAction_Void;
typedef struct Callback_DragEvent_Opt_String_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DragEvent event, const Opt_String extraParams);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DragEvent event, const Opt_String extraParams);
} Callback_DragEvent_Opt_String_Void;
typedef struct Opt_Callback_DragEvent_Opt_String_Void {
    Ark_Tag tag;
    Callback_DragEvent_Opt_String_Void value;
} Opt_Callback_DragEvent_Opt_String_Void;
typedef struct Callback_DrawContext_CustomSpanDrawInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_CustomObject context, const Ark_CustomSpanDrawInfo drawInfo);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_CustomObject context, const Ark_CustomSpanDrawInfo drawInfo);
} Callback_DrawContext_CustomSpanDrawInfo_Void;
typedef struct Opt_Callback_DrawContext_CustomSpanDrawInfo_Void {
    Ark_Tag tag;
    Callback_DrawContext_CustomSpanDrawInfo_Void value;
} Opt_Callback_DrawContext_CustomSpanDrawInfo_Void;
typedef struct Callback_DrawContext_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_CustomObject drawContext);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_CustomObject drawContext);
} Callback_DrawContext_Void;
typedef struct Opt_Callback_DrawContext_Void {
    Ark_Tag tag;
    Callback_DrawContext_Void value;
} Opt_Callback_DrawContext_Void;
typedef struct Callback_Extender_OnFinish {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId);
} Callback_Extender_OnFinish;
typedef struct Opt_Callback_Extender_OnFinish {
    Ark_Tag tag;
    Callback_Extender_OnFinish value;
} Opt_Callback_Extender_OnFinish;
typedef struct Callback_Extender_OnProgress {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Float32 value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Float32 value);
} Callback_Extender_OnProgress;
typedef struct Opt_Callback_Extender_OnProgress {
    Ark_Tag tag;
    Callback_Extender_OnProgress value;
} Opt_Callback_Extender_OnProgress;
typedef struct Callback_FormCallbackInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_FormCallbackInfo parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_FormCallbackInfo parameter);
} Callback_FormCallbackInfo_Void;
typedef struct Opt_Callback_FormCallbackInfo_Void {
    Ark_Tag tag;
    Callback_FormCallbackInfo_Void value;
} Opt_Callback_FormCallbackInfo_Void;
typedef struct Callback_GestureEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_GestureEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_GestureEvent event);
} Callback_GestureEvent_Void;
typedef struct Opt_Callback_GestureEvent_Void {
    Ark_Tag tag;
    Callback_GestureEvent_Void value;
} Opt_Callback_GestureEvent_Void;
typedef struct Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_GestureInfo gestureInfo, const Ark_BaseGestureEvent event, const Callback_GestureJudgeResult_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_GestureInfo gestureInfo, const Ark_BaseGestureEvent event, const Callback_GestureJudgeResult_Void continuation);
} Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult;
typedef struct Opt_Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult {
    Ark_Tag tag;
    Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult value;
} Opt_Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult;
typedef struct Callback_GestureJudgeResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_GestureJudgeResult value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_GestureJudgeResult value);
} Callback_GestureJudgeResult_Void;
typedef struct Opt_Callback_GestureJudgeResult_Void {
    Ark_Tag tag;
    Callback_GestureJudgeResult_Void value;
} Opt_Callback_GestureJudgeResult_Void;
typedef struct Callback_GestureRecognizer_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_GestureRecognizer value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_GestureRecognizer value);
} Callback_GestureRecognizer_Void;
typedef struct Opt_Callback_GestureRecognizer_Void {
    Ark_Tag tag;
    Callback_GestureRecognizer_Void value;
} Opt_Callback_GestureRecognizer_Void;
typedef struct Callback_HitTestMode_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_HitTestMode value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_HitTestMode value);
} Callback_HitTestMode_Void;
typedef struct Opt_Callback_HitTestMode_Void {
    Ark_Tag tag;
    Callback_HitTestMode_Void value;
} Opt_Callback_HitTestMode_Void;
typedef struct Callback_InsertValue_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_InsertValue parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_InsertValue parameter, const Callback_Boolean_Void continuation);
} Callback_InsertValue_Boolean;
typedef struct Opt_Callback_InsertValue_Boolean {
    Ark_Tag tag;
    Callback_InsertValue_Boolean value;
} Opt_Callback_InsertValue_Boolean;
typedef struct Callback_InsertValue_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_InsertValue parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_InsertValue parameter);
} Callback_InsertValue_Void;
typedef struct Opt_Callback_InsertValue_Void {
    Ark_Tag tag;
    Callback_InsertValue_Void value;
} Opt_Callback_InsertValue_Void;
typedef struct Callback_ItemDragInfo_Number_Number_Boolean_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex, const Ark_Number insertIndex, const Ark_Boolean isSuccess);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex, const Ark_Number insertIndex, const Ark_Boolean isSuccess);
} Callback_ItemDragInfo_Number_Number_Boolean_Void;
typedef struct Opt_Callback_ItemDragInfo_Number_Number_Boolean_Void {
    Ark_Tag tag;
    Callback_ItemDragInfo_Number_Number_Boolean_Void value;
} Opt_Callback_ItemDragInfo_Number_Number_Boolean_Void;
typedef struct Callback_ItemDragInfo_Number_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex, const Ark_Number insertIndex);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex, const Ark_Number insertIndex);
} Callback_ItemDragInfo_Number_Number_Void;
typedef struct Opt_Callback_ItemDragInfo_Number_Number_Void {
    Ark_Tag tag;
    Callback_ItemDragInfo_Number_Number_Void value;
} Opt_Callback_ItemDragInfo_Number_Number_Void;
typedef struct Callback_ItemDragInfo_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex);
} Callback_ItemDragInfo_Number_Void;
typedef struct Opt_Callback_ItemDragInfo_Number_Void {
    Ark_Tag tag;
    Callback_ItemDragInfo_Number_Void value;
} Opt_Callback_ItemDragInfo_Number_Void;
typedef struct Callback_ItemDragInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ItemDragInfo event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ItemDragInfo event);
} Callback_ItemDragInfo_Void;
typedef struct Opt_Callback_ItemDragInfo_Void {
    Ark_Tag tag;
    Callback_ItemDragInfo_Void value;
} Opt_Callback_ItemDragInfo_Void;
typedef struct Callback_KeyEvent_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_KeyEvent parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_KeyEvent parameter, const Callback_Boolean_Void continuation);
} Callback_KeyEvent_Boolean;
typedef struct Opt_Callback_KeyEvent_Boolean {
    Ark_Tag tag;
    Callback_KeyEvent_Boolean value;
} Opt_Callback_KeyEvent_Boolean;
typedef struct Callback_KeyEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_KeyEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_KeyEvent event);
} Callback_KeyEvent_Void;
typedef struct Opt_Callback_KeyEvent_Void {
    Ark_Tag tag;
    Callback_KeyEvent_Void value;
} Opt_Callback_KeyEvent_Void;
typedef struct Callback_Literal_Boolean_isVisible_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Literal_Boolean_isVisible event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Literal_Boolean_isVisible event);
} Callback_Literal_Boolean_isVisible_Void;
typedef struct Opt_Callback_Literal_Boolean_isVisible_Void {
    Ark_Tag tag;
    Callback_Literal_Boolean_isVisible_Void value;
} Opt_Callback_Literal_Boolean_isVisible_Void;
typedef struct Callback_Literal_Number_offsetRemain_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Literal_Number_offsetRemain value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Literal_Number_offsetRemain value);
} Callback_Literal_Number_offsetRemain_Void;
typedef struct Opt_Callback_Literal_Number_offsetRemain_Void {
    Ark_Tag tag;
    Callback_Literal_Number_offsetRemain_Void value;
} Opt_Callback_Literal_Number_offsetRemain_Void;
typedef struct Callback_MouseEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_MouseEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_MouseEvent event);
} Callback_MouseEvent_Void;
typedef struct Opt_Callback_MouseEvent_Void {
    Ark_Tag tag;
    Callback_MouseEvent_Void value;
} Opt_Callback_MouseEvent_Void;
typedef struct Callback_NativeEmbedDataInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_NativeEmbedDataInfo event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_NativeEmbedDataInfo event);
} Callback_NativeEmbedDataInfo_Void;
typedef struct Opt_Callback_NativeEmbedDataInfo_Void {
    Ark_Tag tag;
    Callback_NativeEmbedDataInfo_Void value;
} Opt_Callback_NativeEmbedDataInfo_Void;
typedef struct Callback_NavDestinationContext_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_NavDestinationContext parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_NavDestinationContext parameter);
} Callback_NavDestinationContext_Void;
typedef struct Opt_Callback_NavDestinationContext_Void {
    Ark_Tag tag;
    Callback_NavDestinationContext_Void value;
} Opt_Callback_NavDestinationContext_Void;
typedef struct Callback_NavigationMode_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_NavigationMode mode);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_NavigationMode mode);
} Callback_NavigationMode_Void;
typedef struct Opt_Callback_NavigationMode_Void {
    Ark_Tag tag;
    Callback_NavigationMode_Void value;
} Opt_Callback_NavigationMode_Void;
typedef struct Callback_NavigationTitleMode_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_NavigationTitleMode titleMode);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_NavigationTitleMode titleMode);
} Callback_NavigationTitleMode_Void;
typedef struct Opt_Callback_NavigationTitleMode_Void {
    Ark_Tag tag;
    Callback_NavigationTitleMode_Void value;
} Opt_Callback_NavigationTitleMode_Void;
typedef struct Callback_NavigationTransitionProxy_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_NavigationTransitionProxy transitionProxy);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_NavigationTransitionProxy transitionProxy);
} Callback_NavigationTransitionProxy_Void;
typedef struct Opt_Callback_NavigationTransitionProxy_Void {
    Ark_Tag tag;
    Callback_NavigationTransitionProxy_Void value;
} Opt_Callback_NavigationTransitionProxy_Void;
typedef struct Callback_Number_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number index, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number index, const Callback_Boolean_Void continuation);
} Callback_Number_Boolean;
typedef struct Opt_Callback_Number_Boolean {
    Ark_Tag tag;
    Callback_Number_Boolean value;
} Opt_Callback_Number_Boolean;
typedef struct Callback_Number_Number_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number from, const Ark_Number to, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number from, const Ark_Number to, const Callback_Boolean_Void continuation);
} Callback_Number_Number_Boolean;
typedef struct Opt_Callback_Number_Number_Boolean {
    Ark_Tag tag;
    Callback_Number_Number_Boolean value;
} Opt_Callback_Number_Number_Boolean;
typedef struct Callback_Number_Number_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number start, const Ark_Number end, const Ark_Number center);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number start, const Ark_Number end, const Ark_Number center);
} Callback_Number_Number_Number_Void;
typedef struct Opt_Callback_Number_Number_Number_Void {
    Ark_Tag tag;
    Callback_Number_Number_Number_Void value;
} Opt_Callback_Number_Number_Number_Void;
typedef struct Callback_Number_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number first, const Ark_Number last);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number first, const Ark_Number last);
} Callback_Number_Number_Void;
typedef struct Opt_Callback_Number_Number_Void {
    Ark_Tag tag;
    Callback_Number_Number_Void value;
} Opt_Callback_Number_Number_Void;
typedef struct Callback_Number_Opt_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number a, const Callback_Opt_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number a, const Callback_Opt_Boolean_Void continuation);
} Callback_Number_Opt_Boolean;
typedef struct Opt_Callback_Number_Opt_Boolean {
    Ark_Tag tag;
    Callback_Number_Opt_Boolean value;
} Opt_Callback_Number_Opt_Boolean;
typedef struct Callback_Number_ScrollState_Literal_Number_offsetRemain {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number offset, Ark_ScrollState state, const Callback_Literal_Number_offsetRemain_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number offset, Ark_ScrollState state, const Callback_Literal_Number_offsetRemain_Void continuation);
} Callback_Number_ScrollState_Literal_Number_offsetRemain;
typedef struct Opt_Callback_Number_ScrollState_Literal_Number_offsetRemain {
    Ark_Tag tag;
    Callback_Number_ScrollState_Literal_Number_offsetRemain value;
} Opt_Callback_Number_ScrollState_Literal_Number_offsetRemain;
typedef struct Callback_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number parameter);
} Callback_Number_Void;
typedef struct Opt_Callback_Number_Void {
    Ark_Tag tag;
    Callback_Number_Void value;
} Opt_Callback_Number_Void;
typedef struct Callback_OffsetResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_OffsetResult value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_OffsetResult value);
} Callback_OffsetResult_Void;
typedef struct Opt_Callback_OffsetResult_Void {
    Ark_Tag tag;
    Callback_OffsetResult_Void value;
} Opt_Callback_OffsetResult_Void;
typedef struct Callback_OnHttpErrorReceiveEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_OnHttpErrorReceiveEvent parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_OnHttpErrorReceiveEvent parameter);
} Callback_OnHttpErrorReceiveEvent_Void;
typedef struct Opt_Callback_OnHttpErrorReceiveEvent_Void {
    Ark_Tag tag;
    Callback_OnHttpErrorReceiveEvent_Void value;
} Opt_Callback_OnHttpErrorReceiveEvent_Void;
typedef struct Callback_onMeasureSize_SizeResult {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_GeometryInfo selfLayoutInfo, const Array_Measurable children, const Ark_ConstraintSizeOptions constraint, const Callback_SizeResult_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_GeometryInfo selfLayoutInfo, const Array_Measurable children, const Ark_ConstraintSizeOptions constraint, const Callback_SizeResult_Void continuation);
} Callback_onMeasureSize_SizeResult;
typedef struct Opt_Callback_onMeasureSize_SizeResult {
    Ark_Tag tag;
    Callback_onMeasureSize_SizeResult value;
} Opt_Callback_onMeasureSize_SizeResult;
typedef struct Callback_onPlaceChildren_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_GeometryInfo selfLayoutInfo, const Array_Layoutable children, const Ark_ConstraintSizeOptions constraint);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_GeometryInfo selfLayoutInfo, const Array_Layoutable children, const Ark_ConstraintSizeOptions constraint);
} Callback_onPlaceChildren_Void;
typedef struct Opt_Callback_onPlaceChildren_Void {
    Ark_Tag tag;
    Callback_onPlaceChildren_Void value;
} Opt_Callback_onPlaceChildren_Void;
typedef struct Callback_OnRenderExitedEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_OnRenderExitedEvent parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_OnRenderExitedEvent parameter);
} Callback_OnRenderExitedEvent_Void;
typedef struct Opt_Callback_OnRenderExitedEvent_Void {
    Ark_Tag tag;
    Callback_OnRenderExitedEvent_Void value;
} Opt_Callback_OnRenderExitedEvent_Void;
typedef struct Callback_OnScrollFrameBeginHandlerResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_OnScrollFrameBeginHandlerResult value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_OnScrollFrameBeginHandlerResult value);
} Callback_OnScrollFrameBeginHandlerResult_Void;
typedef struct Opt_Callback_OnScrollFrameBeginHandlerResult_Void {
    Ark_Tag tag;
    Callback_OnScrollFrameBeginHandlerResult_Void value;
} Opt_Callback_OnScrollFrameBeginHandlerResult_Void;
typedef struct Callback_Opt_Array_String_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_Array_String error);
} Callback_Opt_Array_String_Void;
typedef struct Opt_Callback_Opt_Array_String_Void {
    Ark_Tag tag;
    Callback_Opt_Array_String_Void value;
} Opt_Callback_Opt_Array_String_Void;
typedef struct Callback_Opt_Boolean_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_Boolean value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_Boolean value);
} Callback_Opt_Boolean_Void;
typedef struct Opt_Callback_Opt_Boolean_Void {
    Ark_Tag tag;
    Callback_Opt_Boolean_Void value;
} Opt_Callback_Opt_Boolean_Void;
typedef struct Callback_Opt_Literal_Object_detail_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_Literal_Object_detail event, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_Literal_Object_detail event, const Callback_Boolean_Void continuation);
} Callback_Opt_Literal_Object_detail_Boolean;
typedef struct Opt_Callback_Opt_Literal_Object_detail_Boolean {
    Ark_Tag tag;
    Callback_Opt_Literal_Object_detail_Boolean value;
} Opt_Callback_Opt_Literal_Object_detail_Boolean;
typedef struct Callback_Opt_NavigationAnimatedTransition_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_NavigationAnimatedTransition value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_NavigationAnimatedTransition value);
} Callback_Opt_NavigationAnimatedTransition_Void;
typedef struct Opt_Callback_Opt_NavigationAnimatedTransition_Void {
    Ark_Tag tag;
    Callback_Opt_NavigationAnimatedTransition_Void value;
} Opt_Callback_Opt_NavigationAnimatedTransition_Void;
typedef struct Callback_Opt_String_Opt_Array_String_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_String value, const Opt_Array_String error);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_String value, const Opt_Array_String error);
} Callback_Opt_String_Opt_Array_String_Void;
typedef struct Opt_Callback_Opt_String_Opt_Array_String_Void {
    Ark_Tag tag;
    Callback_Opt_String_Opt_Array_String_Void value;
} Opt_Callback_Opt_String_Opt_Array_String_Void;
typedef struct Callback_Opt_StyledString_Opt_Array_String_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_StyledString value, const Opt_Array_String error);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_StyledString value, const Opt_Array_String error);
} Callback_Opt_StyledString_Opt_Array_String_Void;
typedef struct Opt_Callback_Opt_StyledString_Opt_Array_String_Void {
    Ark_Tag tag;
    Callback_Opt_StyledString_Opt_Array_String_Void value;
} Opt_Callback_Opt_StyledString_Opt_Array_String_Void;
typedef struct Callback_Pointer_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_NativePointer value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_NativePointer value);
} Callback_Pointer_Void;
typedef struct Opt_Callback_Pointer_Void {
    Ark_Tag tag;
    Callback_Pointer_Void value;
} Opt_Callback_Pointer_Void;
typedef struct Callback_PopInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_PopInfo parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_PopInfo parameter);
} Callback_PopInfo_Void;
typedef struct Opt_Callback_PopInfo_Void {
    Ark_Tag tag;
    Callback_PopInfo_Void value;
} Opt_Callback_PopInfo_Void;
typedef struct Callback_PreDragStatus_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_PreDragStatus parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_PreDragStatus parameter);
} Callback_PreDragStatus_Void;
typedef struct Opt_Callback_PreDragStatus_Void {
    Ark_Tag tag;
    Callback_PreDragStatus_Void value;
} Opt_Callback_PreDragStatus_Void;
typedef struct Callback_RangeUpdate {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Int32 start, const Ark_Int32 end);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Int32 start, const Ark_Int32 end);
} Callback_RangeUpdate;
typedef struct Opt_Callback_RangeUpdate {
    Ark_Tag tag;
    Callback_RangeUpdate value;
} Opt_Callback_RangeUpdate;
typedef struct Callback_ResourceStr_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ResourceStr text);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ResourceStr text);
} Callback_ResourceStr_Void;
typedef struct Opt_Callback_ResourceStr_Void {
    Ark_Tag tag;
    Callback_ResourceStr_Void value;
} Opt_Callback_ResourceStr_Void;
typedef struct Callback_RichEditorChangeValue_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_RichEditorChangeValue parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_RichEditorChangeValue parameter, const Callback_Boolean_Void continuation);
} Callback_RichEditorChangeValue_Boolean;
typedef struct Opt_Callback_RichEditorChangeValue_Boolean {
    Ark_Tag tag;
    Callback_RichEditorChangeValue_Boolean value;
} Opt_Callback_RichEditorChangeValue_Boolean;
typedef struct Callback_RichEditorDeleteValue_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_RichEditorDeleteValue parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_RichEditorDeleteValue parameter, const Callback_Boolean_Void continuation);
} Callback_RichEditorDeleteValue_Boolean;
typedef struct Opt_Callback_RichEditorDeleteValue_Boolean {
    Ark_Tag tag;
    Callback_RichEditorDeleteValue_Boolean value;
} Opt_Callback_RichEditorDeleteValue_Boolean;
typedef struct Callback_RichEditorInsertValue_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_RichEditorInsertValue parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_RichEditorInsertValue parameter, const Callback_Boolean_Void continuation);
} Callback_RichEditorInsertValue_Boolean;
typedef struct Opt_Callback_RichEditorInsertValue_Boolean {
    Ark_Tag tag;
    Callback_RichEditorInsertValue_Boolean value;
} Opt_Callback_RichEditorInsertValue_Boolean;
typedef struct Callback_RichEditorRange_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_RichEditorRange parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_RichEditorRange parameter);
} Callback_RichEditorRange_Void;
typedef struct Opt_Callback_RichEditorRange_Void {
    Ark_Tag tag;
    Callback_RichEditorRange_Void value;
} Opt_Callback_RichEditorRange_Void;
typedef struct Callback_RichEditorSelection_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_RichEditorSelection parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_RichEditorSelection parameter);
} Callback_RichEditorSelection_Void;
typedef struct Opt_Callback_RichEditorSelection_Void {
    Ark_Tag tag;
    Callback_RichEditorSelection_Void value;
} Opt_Callback_RichEditorSelection_Void;
typedef struct Callback_RichEditorTextSpanResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_RichEditorTextSpanResult parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_RichEditorTextSpanResult parameter);
} Callback_RichEditorTextSpanResult_Void;
typedef struct Opt_Callback_RichEditorTextSpanResult_Void {
    Ark_Tag tag;
    Callback_RichEditorTextSpanResult_Void value;
} Opt_Callback_RichEditorTextSpanResult_Void;
typedef struct Callback_SheetDismiss_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_SheetDismiss sheetDismiss);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_SheetDismiss sheetDismiss);
} Callback_SheetDismiss_Void;
typedef struct Opt_Callback_SheetDismiss_Void {
    Ark_Tag tag;
    Callback_SheetDismiss_Void value;
} Opt_Callback_SheetDismiss_Void;
typedef struct Callback_SheetType_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_SheetType parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_SheetType parameter);
} Callback_SheetType_Void;
typedef struct Opt_Callback_SheetType_Void {
    Ark_Tag tag;
    Callback_SheetType_Void value;
} Opt_Callback_SheetType_Void;
typedef struct Callback_SizeResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_SizeResult value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_SizeResult value);
} Callback_SizeResult_Void;
typedef struct Opt_Callback_SizeResult_Void {
    Ark_Tag tag;
    Callback_SizeResult_Void value;
} Opt_Callback_SizeResult_Void;
typedef struct Callback_SpringBackAction_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_SpringBackAction parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_SpringBackAction parameter);
} Callback_SpringBackAction_Void;
typedef struct Opt_Callback_SpringBackAction_Void {
    Ark_Tag tag;
    Callback_SpringBackAction_Void value;
} Opt_Callback_SpringBackAction_Void;
typedef struct Callback_StateStylesChange {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Int32 currentState);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Int32 currentState);
} Callback_StateStylesChange;
typedef struct Opt_Callback_StateStylesChange {
    Ark_Tag tag;
    Callback_StateStylesChange value;
} Opt_Callback_StateStylesChange;
typedef struct Callback_String_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String value, const Ark_Number index);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String value, const Ark_Number index);
} Callback_String_Number_Void;
typedef struct Opt_Callback_String_Number_Void {
    Ark_Tag tag;
    Callback_String_Number_Void value;
} Opt_Callback_String_Number_Void;
typedef struct Callback_String_Unknown_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String name, const Ark_Object param);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String name, const Ark_Object param);
} Callback_String_Unknown_Void;
typedef struct Opt_Callback_String_Unknown_Void {
    Ark_Tag tag;
    Callback_String_Unknown_Void value;
} Opt_Callback_String_Unknown_Void;
typedef struct Callback_String_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String parameter);
} Callback_String_Void;
typedef struct Opt_Callback_String_Void {
    Ark_Tag tag;
    Callback_String_Void value;
} Opt_Callback_String_Void;
typedef struct Callback_StyledStringChangeValue_Boolean {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_StyledStringChangeValue parameter, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_StyledStringChangeValue parameter, const Callback_Boolean_Void continuation);
} Callback_StyledStringChangeValue_Boolean;
typedef struct Opt_Callback_StyledStringChangeValue_Boolean {
    Ark_Tag tag;
    Callback_StyledStringChangeValue_Boolean value;
} Opt_Callback_StyledStringChangeValue_Boolean;
typedef struct Callback_SwipeActionState_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_SwipeActionState state);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_SwipeActionState state);
} Callback_SwipeActionState_Void;
typedef struct Opt_Callback_SwipeActionState_Void {
    Ark_Tag tag;
    Callback_SwipeActionState_Void value;
} Opt_Callback_SwipeActionState_Void;
typedef struct Callback_SwiperContentTransitionProxy_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_SwiperContentTransitionProxy parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_SwiperContentTransitionProxy parameter);
} Callback_SwiperContentTransitionProxy_Void;
typedef struct Opt_Callback_SwiperContentTransitionProxy_Void {
    Ark_Tag tag;
    Callback_SwiperContentTransitionProxy_Void value;
} Opt_Callback_SwiperContentTransitionProxy_Void;
typedef struct Callback_TerminationInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TerminationInfo parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TerminationInfo parameter);
} Callback_TerminationInfo_Void;
typedef struct Opt_Callback_TerminationInfo_Void {
    Ark_Tag tag;
    Callback_TerminationInfo_Void value;
} Opt_Callback_TerminationInfo_Void;
typedef struct Callback_TextPickerResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TextPickerResult value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TextPickerResult value);
} Callback_TextPickerResult_Void;
typedef struct Opt_Callback_TextPickerResult_Void {
    Ark_Tag tag;
    Callback_TextPickerResult_Void value;
} Opt_Callback_TextPickerResult_Void;
typedef struct Callback_TextRange_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TextRange parameter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TextRange parameter);
} Callback_TextRange_Void;
typedef struct Opt_Callback_TextRange_Void {
    Ark_Tag tag;
    Callback_TextRange_Void value;
} Opt_Callback_TextRange_Void;
typedef struct Callback_TouchEvent_HitTestMode {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TouchEvent parameter, const Callback_HitTestMode_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TouchEvent parameter, const Callback_HitTestMode_Void continuation);
} Callback_TouchEvent_HitTestMode;
typedef struct Opt_Callback_TouchEvent_HitTestMode {
    Ark_Tag tag;
    Callback_TouchEvent_HitTestMode value;
} Opt_Callback_TouchEvent_HitTestMode;
typedef struct Callback_TouchEvent_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TouchEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TouchEvent event);
} Callback_TouchEvent_Void;
typedef struct Opt_Callback_TouchEvent_Void {
    Ark_Tag tag;
    Callback_TouchEvent_Void value;
} Opt_Callback_TouchEvent_Void;
typedef struct Callback_TouchResult_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TouchResult value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TouchResult value);
} Callback_TouchResult_Void;
typedef struct Opt_Callback_TouchResult_Void {
    Ark_Tag tag;
    Callback_TouchResult_Void value;
} Opt_Callback_TouchResult_Void;
typedef struct Callback_UIExtensionProxy_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_UIExtensionProxy proxy);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_UIExtensionProxy proxy);
} Callback_UIExtensionProxy_Void;
typedef struct Opt_Callback_UIExtensionProxy_Void {
    Ark_Tag tag;
    Callback_UIExtensionProxy_Void value;
} Opt_Callback_UIExtensionProxy_Void;
typedef struct Callback_Union_CustomBuilder_DragItemInfo_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Union_CustomBuilder_DragItemInfo value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Union_CustomBuilder_DragItemInfo value);
} Callback_Union_CustomBuilder_DragItemInfo_Void;
typedef struct Opt_Callback_Union_CustomBuilder_DragItemInfo_Void {
    Ark_Tag tag;
    Callback_Union_CustomBuilder_DragItemInfo_Void value;
} Opt_Callback_Union_CustomBuilder_DragItemInfo_Void;
typedef struct Callback_Union_Number_Array_Number_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Union_Number_Array_Number selected);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Union_Number_Array_Number selected);
} Callback_Union_Number_Array_Number_Void;
typedef struct Opt_Callback_Union_Number_Array_Number_Void {
    Ark_Tag tag;
    Callback_Union_Number_Array_Number_Void value;
} Opt_Callback_Union_Number_Array_Number_Void;
typedef struct Callback_Union_String_Array_String_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Union_String_Array_String value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Union_String_Array_String value);
} Callback_Union_String_Array_String_Void;
typedef struct Opt_Callback_Union_String_Array_String_Void {
    Ark_Tag tag;
    Callback_Union_String_Array_String_Void value;
} Opt_Callback_Union_String_Array_String_Void;
typedef struct Callback_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId);
} Callback_Void;
typedef struct Opt_Callback_Void {
    Ark_Tag tag;
    Callback_Void value;
} Opt_Callback_Void;
typedef struct ContentDidScrollCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number selectedIndex, const Ark_Number index, const Ark_Number position, const Ark_Number mainAxisLength);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number selectedIndex, const Ark_Number index, const Ark_Number position, const Ark_Number mainAxisLength);
} ContentDidScrollCallback;
typedef struct Opt_ContentDidScrollCallback {
    Ark_Tag tag;
    ContentDidScrollCallback value;
} Opt_ContentDidScrollCallback;
typedef struct CustomNodeBuilder {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_NativePointer parentNode, const Callback_Pointer_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_NativePointer parentNode, const Callback_Pointer_Void continuation);
} CustomNodeBuilder;
typedef struct Opt_CustomNodeBuilder {
    Ark_Tag tag;
    CustomNodeBuilder value;
} Opt_CustomNodeBuilder;
typedef struct EditableTextOnChangeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String value, const Opt_PreviewText previewText);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String value, const Opt_PreviewText previewText);
} EditableTextOnChangeCallback;
typedef struct Opt_EditableTextOnChangeCallback {
    Ark_Tag tag;
    EditableTextOnChangeCallback value;
} Opt_EditableTextOnChangeCallback;
typedef struct GestureRecognizerJudgeBeginCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_BaseGestureEvent event, const Ark_GestureRecognizer current, const Array_GestureRecognizer recognizers, const Callback_GestureJudgeResult_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_BaseGestureEvent event, const Ark_GestureRecognizer current, const Array_GestureRecognizer recognizers, const Callback_GestureJudgeResult_Void continuation);
} GestureRecognizerJudgeBeginCallback;
typedef struct Opt_GestureRecognizerJudgeBeginCallback {
    Ark_Tag tag;
    GestureRecognizerJudgeBeginCallback value;
} Opt_GestureRecognizerJudgeBeginCallback;
typedef struct HoverCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean isHover, const Ark_HoverEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean isHover, const Ark_HoverEvent event);
} HoverCallback;
typedef struct Opt_HoverCallback {
    Ark_Tag tag;
    HoverCallback value;
} Opt_HoverCallback;
typedef struct ImageErrorCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ImageError error);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ImageError error);
} ImageErrorCallback;
typedef struct Opt_ImageErrorCallback {
    Ark_Tag tag;
    ImageErrorCallback value;
} Opt_ImageErrorCallback;
typedef struct InterceptionModeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_NavigationMode mode);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_NavigationMode mode);
} InterceptionModeCallback;
typedef struct Opt_InterceptionModeCallback {
    Ark_Tag tag;
    InterceptionModeCallback value;
} Opt_InterceptionModeCallback;
typedef struct InterceptionShowCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Union_NavDestinationContext_NavBar from, const Ark_Union_NavDestinationContext_NavBar to, Ark_NavigationOperation operation, const Ark_Boolean isAnimated);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Union_NavDestinationContext_NavBar from, const Ark_Union_NavDestinationContext_NavBar to, Ark_NavigationOperation operation, const Ark_Boolean isAnimated);
} InterceptionShowCallback;
typedef struct Opt_InterceptionShowCallback {
    Ark_Tag tag;
    InterceptionShowCallback value;
} Opt_InterceptionShowCallback;
typedef struct ListAttribute_onItemDragStart_event_type {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex, const Callback_CustomBuilder_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ItemDragInfo event, const Ark_Number itemIndex, const Callback_CustomBuilder_Void continuation);
} ListAttribute_onItemDragStart_event_type;
typedef struct Opt_ListAttribute_onItemDragStart_event_type {
    Ark_Tag tag;
    ListAttribute_onItemDragStart_event_type value;
} Opt_ListAttribute_onItemDragStart_event_type;
typedef struct Map_String_Object {
    /* kind: ContainerType */
    Ark_Int32 size;
    Ark_String* keys;
    Ark_Object* values;
} Map_String_Object;
typedef struct Opt_Map_String_Object {
    Ark_Tag tag;
    Map_String_Object value;
} Opt_Map_String_Object;
typedef struct Map_String_String {
    /* kind: ContainerType */
    Ark_Int32 size;
    Ark_String* keys;
    Ark_String* values;
} Map_String_String;
typedef struct Opt_Map_String_String {
    Ark_Tag tag;
    Map_String_String value;
} Opt_Map_String_String;
typedef struct MenuOnAppearCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number start, const Ark_Number end);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number start, const Ark_Number end);
} MenuOnAppearCallback;
typedef struct Opt_MenuOnAppearCallback {
    Ark_Tag tag;
    MenuOnAppearCallback value;
} Opt_MenuOnAppearCallback;
typedef struct NavExtender_OnUpdateStack {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId);
} NavExtender_OnUpdateStack;
typedef struct Opt_NavExtender_OnUpdateStack {
    Ark_Tag tag;
    NavExtender_OnUpdateStack value;
} Opt_NavExtender_OnUpdateStack;
typedef struct OnContentScrollCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number totalOffsetX, const Ark_Number totalOffsetY);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number totalOffsetX, const Ark_Number totalOffsetY);
} OnContentScrollCallback;
typedef struct Opt_OnContentScrollCallback {
    Ark_Tag tag;
    OnContentScrollCallback value;
} Opt_OnContentScrollCallback;
typedef struct OnDidChangeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_TextRange rangeBefore, const Ark_TextRange rangeAfter);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_TextRange rangeBefore, const Ark_TextRange rangeAfter);
} OnDidChangeCallback;
typedef struct Opt_OnDidChangeCallback {
    Ark_Tag tag;
    OnDidChangeCallback value;
} Opt_OnDidChangeCallback;
typedef struct OnMoveHandler {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number from, const Ark_Number to);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number from, const Ark_Number to);
} OnMoveHandler;
typedef struct Opt_OnMoveHandler {
    Ark_Tag tag;
    OnMoveHandler value;
} Opt_OnMoveHandler;
typedef struct OnPasteCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String content, const Ark_PasteEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String content, const Ark_PasteEvent event);
} OnPasteCallback;
typedef struct Opt_OnPasteCallback {
    Ark_Tag tag;
    OnPasteCallback value;
} Opt_OnPasteCallback;
typedef struct OnScrollCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number scrollOffset, Ark_ScrollState scrollState);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number scrollOffset, Ark_ScrollState scrollState);
} OnScrollCallback;
typedef struct Opt_OnScrollCallback {
    Ark_Tag tag;
    OnScrollCallback value;
} Opt_OnScrollCallback;
typedef struct OnScrollEdgeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_Edge side);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_Edge side);
} OnScrollEdgeCallback;
typedef struct Opt_OnScrollEdgeCallback {
    Ark_Tag tag;
    OnScrollEdgeCallback value;
} Opt_OnScrollEdgeCallback;
typedef struct OnScrollFrameBeginCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number offset, Ark_ScrollState state, const Callback_OnScrollFrameBeginHandlerResult_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number offset, Ark_ScrollState state, const Callback_OnScrollFrameBeginHandlerResult_Void continuation);
} OnScrollFrameBeginCallback;
typedef struct Opt_OnScrollFrameBeginCallback {
    Ark_Tag tag;
    OnScrollFrameBeginCallback value;
} Opt_OnScrollFrameBeginCallback;
typedef struct OnScrollVisibleContentChangeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_VisibleListContentInfo start, const Ark_VisibleListContentInfo end);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_VisibleListContentInfo start, const Ark_VisibleListContentInfo end);
} OnScrollVisibleContentChangeCallback;
typedef struct Opt_OnScrollVisibleContentChangeCallback {
    Ark_Tag tag;
    OnScrollVisibleContentChangeCallback value;
} Opt_OnScrollVisibleContentChangeCallback;
typedef struct OnSubmitCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_EnterKeyType enterKey, const Ark_SubmitEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_EnterKeyType enterKey, const Ark_SubmitEvent event);
} OnSubmitCallback;
typedef struct Opt_OnSubmitCallback {
    Ark_Tag tag;
    OnSubmitCallback value;
} Opt_OnSubmitCallback;
typedef struct OnSwiperAnimationEndCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number index, const Ark_SwiperAnimationEvent extraInfo);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number index, const Ark_SwiperAnimationEvent extraInfo);
} OnSwiperAnimationEndCallback;
typedef struct Opt_OnSwiperAnimationEndCallback {
    Ark_Tag tag;
    OnSwiperAnimationEndCallback value;
} Opt_OnSwiperAnimationEndCallback;
typedef struct OnSwiperAnimationStartCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number index, const Ark_Number targetIndex, const Ark_SwiperAnimationEvent extraInfo);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number index, const Ark_Number targetIndex, const Ark_SwiperAnimationEvent extraInfo);
} OnSwiperAnimationStartCallback;
typedef struct Opt_OnSwiperAnimationStartCallback {
    Ark_Tag tag;
    OnSwiperAnimationStartCallback value;
} Opt_OnSwiperAnimationStartCallback;
typedef struct OnSwiperGestureSwipeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number index, const Ark_SwiperAnimationEvent extraInfo);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number index, const Ark_SwiperAnimationEvent extraInfo);
} OnSwiperGestureSwipeCallback;
typedef struct Opt_OnSwiperGestureSwipeCallback {
    Ark_Tag tag;
    OnSwiperGestureSwipeCallback value;
} Opt_OnSwiperGestureSwipeCallback;
typedef struct OnTextSelectionChangeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number selectionStart, const Ark_Number selectionEnd);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number selectionStart, const Ark_Number selectionEnd);
} OnTextSelectionChangeCallback;
typedef struct Opt_OnTextSelectionChangeCallback {
    Ark_Tag tag;
    OnTextSelectionChangeCallback value;
} Opt_OnTextSelectionChangeCallback;
typedef struct PasteEventCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_PasteEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_PasteEvent event);
} PasteEventCallback;
typedef struct Opt_PasteEventCallback {
    Ark_Tag tag;
    PasteEventCallback value;
} Opt_PasteEventCallback;
typedef struct RestrictedWorker_onerror_Callback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ErrorEvent ev);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ErrorEvent ev);
} RestrictedWorker_onerror_Callback;
typedef struct Opt_RestrictedWorker_onerror_Callback {
    Ark_Tag tag;
    RestrictedWorker_onerror_Callback value;
} Opt_RestrictedWorker_onerror_Callback;
typedef struct RestrictedWorker_onexit_Callback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number code);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number code);
} RestrictedWorker_onexit_Callback;
typedef struct Opt_RestrictedWorker_onexit_Callback {
    Ark_Tag tag;
    RestrictedWorker_onexit_Callback value;
} Opt_RestrictedWorker_onexit_Callback;
typedef struct RestrictedWorker_onmessage_Callback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_MessageEvents event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_MessageEvents event);
} RestrictedWorker_onmessage_Callback;
typedef struct Opt_RestrictedWorker_onmessage_Callback {
    Ark_Tag tag;
    RestrictedWorker_onmessage_Callback value;
} Opt_RestrictedWorker_onmessage_Callback;
typedef struct ScrollOnScrollCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number xOffset, const Ark_Number yOffset, Ark_ScrollState scrollState);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number xOffset, const Ark_Number yOffset, Ark_ScrollState scrollState);
} ScrollOnScrollCallback;
typedef struct Opt_ScrollOnScrollCallback {
    Ark_Tag tag;
    ScrollOnScrollCallback value;
} Opt_ScrollOnScrollCallback;
typedef struct ScrollOnWillScrollCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Number xOffset, const Ark_Number yOffset, Ark_ScrollState scrollState, Ark_ScrollSource scrollSource, const Callback_OffsetResult_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Number xOffset, const Ark_Number yOffset, Ark_ScrollState scrollState, Ark_ScrollSource scrollSource, const Callback_OffsetResult_Void continuation);
} ScrollOnWillScrollCallback;
typedef struct Opt_ScrollOnWillScrollCallback {
    Ark_Tag tag;
    ScrollOnWillScrollCallback value;
} Opt_ScrollOnWillScrollCallback;
typedef struct SearchSubmitCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String searchContent, const Opt_SubmitEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String searchContent, const Opt_SubmitEvent event);
} SearchSubmitCallback;
typedef struct Opt_SearchSubmitCallback {
    Ark_Tag tag;
    SearchSubmitCallback value;
} Opt_SearchSubmitCallback;
typedef struct SearchValueCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_String value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_String value);
} SearchValueCallback;
typedef struct Opt_SearchValueCallback {
    Ark_Tag tag;
    SearchValueCallback value;
} Opt_SearchValueCallback;
typedef struct ShouldBuiltInRecognizerParallelWithCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_GestureRecognizer current, const Array_GestureRecognizer others, const Callback_GestureRecognizer_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_GestureRecognizer current, const Array_GestureRecognizer others, const Callback_GestureRecognizer_Void continuation);
} ShouldBuiltInRecognizerParallelWithCallback;
typedef struct Opt_ShouldBuiltInRecognizerParallelWithCallback {
    Ark_Tag tag;
    ShouldBuiltInRecognizerParallelWithCallback value;
} Opt_ShouldBuiltInRecognizerParallelWithCallback;
typedef struct SizeChangeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_SizeOptions oldValue, const Ark_SizeOptions newValue);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_SizeOptions oldValue, const Ark_SizeOptions newValue);
} SizeChangeCallback;
typedef struct Opt_SizeChangeCallback {
    Ark_Tag tag;
    SizeChangeCallback value;
} Opt_SizeChangeCallback;
typedef struct SubmitCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_EnterKeyType enterKey, const Ark_SubmitEvent event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_EnterKeyType enterKey, const Ark_SubmitEvent event);
} SubmitCallback;
typedef struct Opt_SubmitCallback {
    Ark_Tag tag;
    SubmitCallback value;
} Opt_SubmitCallback;
typedef struct TextFieldValueCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_ResourceStr value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_ResourceStr value);
} TextFieldValueCallback;
typedef struct Opt_TextFieldValueCallback {
    Ark_Tag tag;
    TextFieldValueCallback value;
} Opt_TextFieldValueCallback;
typedef struct TextPickerScrollStopCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Union_String_Array_String value, const Ark_Union_Number_Array_Number index);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Union_String_Array_String value, const Ark_Union_Number_Array_Number index);
} TextPickerScrollStopCallback;
typedef struct Opt_TextPickerScrollStopCallback {
    Ark_Tag tag;
    TextPickerScrollStopCallback value;
} Opt_TextPickerScrollStopCallback;
typedef struct TransitionFinishCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean transitionIn);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean transitionIn);
} TransitionFinishCallback;
typedef struct Opt_TransitionFinishCallback {
    Ark_Tag tag;
    TransitionFinishCallback value;
} Opt_TransitionFinishCallback;
typedef struct Type_CommonMethod_onDragStart_event {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DragEvent event, const Opt_String extraParams, const Callback_Union_CustomBuilder_DragItemInfo_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DragEvent event, const Opt_String extraParams, const Callback_Union_CustomBuilder_DragItemInfo_Void continuation);
} Type_CommonMethod_onDragStart_event;
typedef struct Opt_Type_CommonMethod_onDragStart_event {
    Ark_Tag tag;
    Type_CommonMethod_onDragStart_event value;
} Opt_Type_CommonMethod_onDragStart_event;
typedef struct Type_ImageAttribute_onComplete_callback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Opt_Type_ImageAttribute_onComplete_callback_event event);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Opt_Type_ImageAttribute_onComplete_callback_event event);
} Type_ImageAttribute_onComplete_callback;
typedef struct Opt_Type_ImageAttribute_onComplete_callback {
    Ark_Tag tag;
    Type_ImageAttribute_onComplete_callback value;
} Opt_Type_ImageAttribute_onComplete_callback;
typedef struct Type_NavigationAttribute_customNavContentTransition_delegate {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_NavContentInfo from, const Ark_NavContentInfo to, Ark_NavigationOperation operation, const Callback_Opt_NavigationAnimatedTransition_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_NavContentInfo from, const Ark_NavContentInfo to, Ark_NavigationOperation operation, const Callback_Opt_NavigationAnimatedTransition_Void continuation);
} Type_NavigationAttribute_customNavContentTransition_delegate;
typedef struct Opt_Type_NavigationAttribute_customNavContentTransition_delegate {
    Ark_Tag tag;
    Type_NavigationAttribute_customNavContentTransition_delegate value;
} Opt_Type_NavigationAttribute_customNavContentTransition_delegate;
typedef struct Type_TextPickerAttribute_onChange_callback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Union_String_Array_String value, const Ark_Union_Number_Array_Number index);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Union_String_Array_String value, const Ark_Union_Number_Array_Number index);
} Type_TextPickerAttribute_onChange_callback;
typedef struct Opt_Type_TextPickerAttribute_onChange_callback {
    Ark_Tag tag;
    Type_TextPickerAttribute_onChange_callback value;
} Opt_Type_TextPickerAttribute_onChange_callback;
typedef struct VisibleAreaChangeCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean isExpanding, const Ark_Number currentRatio);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean isExpanding, const Ark_Number currentRatio);
} VisibleAreaChangeCallback;
typedef struct Opt_VisibleAreaChangeCallback {
    Ark_Tag tag;
    VisibleAreaChangeCallback value;
} Opt_VisibleAreaChangeCallback;
typedef struct VoidCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId);
} VoidCallback;
typedef struct Opt_VoidCallback {
    Ark_Tag tag;
    VoidCallback value;
} Opt_VoidCallback;
typedef struct Ark_AccessibilityOptions {
    /* kind: Interface */
    Opt_Boolean accessibilityPreferred;
} Ark_AccessibilityOptions;
typedef struct Opt_AccessibilityOptions {
    Ark_Tag tag;
    Ark_AccessibilityOptions value;
} Opt_AccessibilityOptions;
typedef struct Ark_AnimationRange_Number {
    /* kind: Interface */
    Ark_Number value0;
    Ark_Number value1;
} Ark_AnimationRange_Number;
typedef struct Opt_AnimationRange_Number {
    Ark_Tag tag;
    Ark_AnimationRange_Number value;
} Opt_AnimationRange_Number;
typedef struct Opt_AppearSymbolEffect {
    Ark_Tag tag;
    Ark_AppearSymbolEffect value;
} Opt_AppearSymbolEffect;
typedef struct Ark_ArrayRefNumberInterfaceDTS {
    /* kind: Interface */
    Array_Number tuple;
} Ark_ArrayRefNumberInterfaceDTS;
typedef struct Opt_ArrayRefNumberInterfaceDTS {
    Ark_Tag tag;
    Ark_ArrayRefNumberInterfaceDTS value;
} Opt_ArrayRefNumberInterfaceDTS;
typedef struct Ark_BackgroundBrightnessOptions {
    /* kind: Interface */
    Ark_Number rate;
    Ark_Number lightUpDegree;
} Ark_BackgroundBrightnessOptions;
typedef struct Opt_BackgroundBrightnessOptions {
    Ark_Tag tag;
    Ark_BackgroundBrightnessOptions value;
} Opt_BackgroundBrightnessOptions;
typedef struct Opt_BaseContext {
    Ark_Tag tag;
    Ark_BaseContext value;
} Opt_BaseContext;
typedef struct Opt_BaselineOffsetStyle {
    Ark_Tag tag;
    Ark_BaselineOffsetStyle value;
} Opt_BaselineOffsetStyle;
typedef struct Ark_Bias {
    /* kind: Interface */
    Opt_Number horizontal;
    Opt_Number vertical;
} Ark_Bias;
typedef struct Opt_Bias {
    Ark_Tag tag;
    Ark_Bias value;
} Opt_Bias;
typedef struct Ark_BlurOptions {
    /* kind: Interface */
    Ark_Tuple_Number_Number grayscale;
} Ark_BlurOptions;
typedef struct Opt_BlurOptions {
    Ark_Tag tag;
    Ark_BlurOptions value;
} Opt_BlurOptions;
typedef struct Opt_BounceSymbolEffect {
    Ark_Tag tag;
    Ark_BounceSymbolEffect value;
} Opt_BounceSymbolEffect;
typedef struct Ark_ButtonOptions {
    /* kind: Interface */
    Opt_ButtonType type;
    Opt_Boolean stateEffect;
    Opt_ButtonStyleMode buttonStyle;
    Opt_ControlSize controlSize;
    Opt_ButtonRole role;
} Ark_ButtonOptions;
typedef struct Opt_ButtonOptions {
    Ark_Tag tag;
    Ark_ButtonOptions value;
} Opt_ButtonOptions;
typedef struct Ark_CancelButtonSymbolOptions {
    /* kind: Interface */
    Opt_CancelButtonStyle style;
    Opt_CustomObject icon;
} Ark_CancelButtonSymbolOptions;
typedef struct Opt_CancelButtonSymbolOptions {
    Ark_Tag tag;
    Ark_CancelButtonSymbolOptions value;
} Opt_CancelButtonSymbolOptions;
typedef struct Opt_CanvasRenderer {
    Ark_Tag tag;
    Ark_CanvasRenderer value;
} Opt_CanvasRenderer;
typedef struct Opt_CanvasRenderingContext2D {
    Ark_Tag tag;
    Ark_CanvasRenderingContext2D value;
} Opt_CanvasRenderingContext2D;
typedef struct Ark_CaretOffset {
    /* kind: Interface */
    Ark_Number index;
    Ark_Number x;
    Ark_Number y;
} Ark_CaretOffset;
typedef struct Opt_CaretOffset {
    Ark_Tag tag;
    Ark_CaretOffset value;
} Opt_CaretOffset;
typedef struct Ark_ChainWeightOptions {
    /* kind: Interface */
    Opt_Number horizontal;
    Opt_Number vertical;
} Ark_ChainWeightOptions;
typedef struct Opt_ChainWeightOptions {
    Ark_Tag tag;
    Ark_ChainWeightOptions value;
} Opt_ChainWeightOptions;
typedef struct Opt_ChildrenMainSize {
    Ark_Tag tag;
    Ark_ChildrenMainSize value;
} Opt_ChildrenMainSize;
typedef struct Ark_CircleOptions {
    /* kind: Interface */
    Opt_Union_String_Number width;
    Opt_Union_String_Number height;
} Ark_CircleOptions;
typedef struct Opt_CircleOptions {
    Ark_Tag tag;
    Ark_CircleOptions value;
} Opt_CircleOptions;
typedef struct Opt_ClassWithConstructorAndFieldsAndMethodsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndFieldsAndMethodsDTS value;
} Opt_ClassWithConstructorAndFieldsAndMethodsDTS;
typedef struct Opt_ClassWithConstructorAndFieldsDTS {
    Ark_Tag tag;
    Ark_ClassWithConstructorAndFieldsDTS value;
} Opt_ClassWithConstructorAndFieldsDTS;
typedef struct Ark_ClickEffect {
    /* kind: Interface */
    Ark_ClickEffectLevel level;
    Opt_Number scale;
} Ark_ClickEffect;
typedef struct Opt_ClickEffect {
    Ark_Tag tag;
    Ark_ClickEffect value;
} Opt_ClickEffect;
typedef struct Ark_CloseSwipeActionOptions {
    /* kind: Interface */
    Opt_Callback_Void onFinish;
} Ark_CloseSwipeActionOptions;
typedef struct Opt_CloseSwipeActionOptions {
    Ark_Tag tag;
    Ark_CloseSwipeActionOptions value;
} Opt_CloseSwipeActionOptions;
typedef struct Ark_ColumnOptions {
    /* kind: Interface */
    Opt_Union_String_Number space;
} Ark_ColumnOptions;
typedef struct Opt_ColumnOptions {
    Ark_Tag tag;
    Ark_ColumnOptions value;
} Opt_ColumnOptions;
typedef struct Opt_Context {
    Ark_Tag tag;
    Ark_Context value;
} Opt_Context;
typedef struct Ark_CopyEvent {
    /* kind: Interface */
    Opt_Callback_Void preventDefault;
} Ark_CopyEvent;
typedef struct Opt_CopyEvent {
    Ark_Tag tag;
    Ark_CopyEvent value;
} Opt_CopyEvent;
typedef struct Ark_CustomDialogBuildOptions {
    /* kind: Interface */
    Opt_CustomDialogController controller;
} Ark_CustomDialogBuildOptions;
typedef struct Opt_CustomDialogBuildOptions {
    Ark_Tag tag;
    Ark_CustomDialogBuildOptions value;
} Opt_CustomDialogBuildOptions;
typedef struct Ark_CustomDialogControllerBuilder {
    /* kind: Interface */
    Ark_CustomDialogBuildOptions buildOptions;
    CustomNodeBuilder build;
} Ark_CustomDialogControllerBuilder;
typedef struct Opt_CustomDialogControllerBuilder {
    Ark_Tag tag;
    Ark_CustomDialogControllerBuilder value;
} Opt_CustomDialogControllerBuilder;
typedef struct Ark_CustomDialogControllerOptions {
    /* kind: Interface */
    Ark_CustomDialogControllerBuilder builder;
} Ark_CustomDialogControllerOptions;
typedef struct Opt_CustomDialogControllerOptions {
    Ark_Tag tag;
    Ark_CustomDialogControllerOptions value;
} Opt_CustomDialogControllerOptions;
typedef struct Opt_CustomSpan {
    Ark_Tag tag;
    Ark_CustomSpan value;
} Opt_CustomSpan;
typedef struct Ark_CustomSpanDrawInfo {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number lineTop;
    Ark_Number lineBottom;
    Ark_Number baseline;
} Ark_CustomSpanDrawInfo;
typedef struct Opt_CustomSpanDrawInfo {
    Ark_Tag tag;
    Ark_CustomSpanDrawInfo value;
} Opt_CustomSpanDrawInfo;
typedef struct Ark_CustomSpanMeasureInfo {
    /* kind: Interface */
    Ark_Number fontSize;
} Ark_CustomSpanMeasureInfo;
typedef struct Opt_CustomSpanMeasureInfo {
    Ark_Tag tag;
    Ark_CustomSpanMeasureInfo value;
} Opt_CustomSpanMeasureInfo;
typedef struct Ark_CustomSpanMetrics {
    /* kind: Interface */
    Ark_Number width;
    Opt_Number height;
} Ark_CustomSpanMetrics;
typedef struct Opt_CustomSpanMetrics {
    Ark_Tag tag;
    Ark_CustomSpanMetrics value;
} Opt_CustomSpanMetrics;
typedef struct Ark_CutEvent {
    /* kind: Interface */
    Opt_Callback_Void preventDefault;
} Ark_CutEvent;
typedef struct Opt_CutEvent {
    Ark_Tag tag;
    Ark_CutEvent value;
} Opt_CutEvent;
typedef struct Ark_DeleteValue {
    /* kind: Interface */
    Ark_Number deleteOffset;
    Ark_TextDeleteDirection direction;
    Ark_String deleteValue;
} Ark_DeleteValue;
typedef struct Opt_DeleteValue {
    Ark_Tag tag;
    Ark_DeleteValue value;
} Opt_DeleteValue;
typedef struct Ark_Dimension {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
        Ark_CustomObject value2;
    };
} Ark_Dimension;
typedef struct Opt_Dimension {
    Ark_Tag tag;
    Ark_Dimension value;
} Opt_Dimension;
typedef struct Ark_DirectionalEdgesT {
    /* kind: Interface */
    Ark_Number start;
    Ark_Number end;
    Ark_Number top;
    Ark_Number bottom;
} Ark_DirectionalEdgesT;
typedef struct Opt_DirectionalEdgesT {
    Ark_Tag tag;
    Ark_DirectionalEdgesT value;
} Opt_DirectionalEdgesT;
typedef struct Opt_DisappearSymbolEffect {
    Ark_Tag tag;
    Ark_DisappearSymbolEffect value;
} Opt_DisappearSymbolEffect;
typedef struct Ark_DismissContentCoverAction {
    /* kind: Interface */
    Callback_Void dismiss;
    Ark_DismissReason reason;
} Ark_DismissContentCoverAction;
typedef struct Opt_DismissContentCoverAction {
    Ark_Tag tag;
    Ark_DismissContentCoverAction value;
} Opt_DismissContentCoverAction;
typedef struct Ark_DismissDialogAction {
    /* kind: Interface */
    Callback_Void dismiss;
    Ark_DismissReason reason;
} Ark_DismissDialogAction;
typedef struct Opt_DismissDialogAction {
    Ark_Tag tag;
    Ark_DismissDialogAction value;
} Opt_DismissDialogAction;
typedef struct Ark_DismissPopupAction {
    /* kind: Interface */
    Callback_Void dismiss;
    Ark_DismissReason reason;
} Ark_DismissPopupAction;
typedef struct Opt_DismissPopupAction {
    Ark_Tag tag;
    Ark_DismissPopupAction value;
} Opt_DismissPopupAction;
typedef struct Ark_DismissSheetAction {
    /* kind: Interface */
    Callback_Void dismiss;
    Ark_DismissReason reason;
} Ark_DismissSheetAction;
typedef struct Opt_DismissSheetAction {
    Ark_Tag tag;
    Ark_DismissSheetAction value;
} Opt_DismissSheetAction;
typedef struct Ark_DoubleAnimationParam {
    /* kind: Interface */
    Ark_String propertyName;
    Ark_Float32 startValue;
    Ark_Float32 endValue;
    Ark_Int32 duration;
    Ark_Int32 delay;
    Ark_Union_Curve_String_ICurve curve;
    Opt_Callback_Extender_OnProgress onProgress;
    Opt_Callback_Extender_OnFinish onFinish;
} Ark_DoubleAnimationParam;
typedef struct Opt_DoubleAnimationParam {
    Ark_Tag tag;
    Ark_DoubleAnimationParam value;
} Opt_DoubleAnimationParam;
typedef struct Ark_DragInteractionOptions {
    /* kind: Interface */
    Opt_Boolean isMultiSelectionEnabled;
    Opt_Boolean defaultAnimationBeforeLifting;
} Ark_DragInteractionOptions;
typedef struct Opt_DragInteractionOptions {
    Ark_Tag tag;
    Ark_DragInteractionOptions value;
} Opt_DragInteractionOptions;
typedef struct Ark_DragItemInfo {
    /* kind: Interface */
    Opt_PixelMap pixelMap;
    Opt_CustomNodeBuilder builder;
    Opt_String extraInfo;
} Ark_DragItemInfo;
typedef struct Opt_DragItemInfo {
    Ark_Tag tag;
    Ark_DragItemInfo value;
} Opt_DragItemInfo;
typedef struct Opt_DrawingRenderingContext {
    Ark_Tag tag;
    Ark_DrawingRenderingContext value;
} Opt_DrawingRenderingContext;
typedef struct Opt_DrawModifier {
    Ark_Tag tag;
    Ark_DrawModifier value;
} Opt_DrawModifier;
typedef struct Ark_EdgeOutlineStyles {
    /* kind: Interface */
    Opt_OutlineStyle top;
    Opt_OutlineStyle right;
    Opt_OutlineStyle bottom;
    Opt_OutlineStyle left;
} Ark_EdgeOutlineStyles;
typedef struct Opt_EdgeOutlineStyles {
    Ark_Tag tag;
    Ark_EdgeOutlineStyles value;
} Opt_EdgeOutlineStyles;
typedef struct Ark_EdgeStyles {
    /* kind: Interface */
    Opt_BorderStyle top;
    Opt_BorderStyle right;
    Opt_BorderStyle bottom;
    Opt_BorderStyle left;
} Ark_EdgeStyles;
typedef struct Opt_EdgeStyles {
    Ark_Tag tag;
    Ark_EdgeStyles value;
} Opt_EdgeStyles;
typedef struct Ark_EditMenuOptions {
    /* kind: Interface */
    AsyncCallback_Array_TextMenuItem_Array_TextMenuItem onCreateMenu;
    AsyncCallback_TextMenuItem_TextRange_Boolean onMenuItemClick;
} Ark_EditMenuOptions;
typedef struct Opt_EditMenuOptions {
    Ark_Tag tag;
    Ark_EditMenuOptions value;
} Opt_EditMenuOptions;
typedef struct Ark_EllipseOptions {
    /* kind: Interface */
    Opt_Union_String_Number width;
    Opt_Union_String_Number height;
} Ark_EllipseOptions;
typedef struct Opt_EllipseOptions {
    Ark_Tag tag;
    Ark_EllipseOptions value;
} Opt_EllipseOptions;
typedef struct Ark_ErrorEvent {
    /* kind: Interface */
    Ark_String type;
    Ark_Int64 timeStamp;
    Ark_String message;
    Ark_String filename;
    Ark_Number lineno;
    Ark_Number colno;
    Ark_Object error;
} Ark_ErrorEvent;
typedef struct Opt_ErrorEvent {
    Ark_Tag tag;
    Ark_ErrorEvent value;
} Opt_ErrorEvent;
typedef struct Ark_Event {
    /* kind: Interface */
    Ark_String type;
    Ark_Int64 timeStamp;
} Ark_Event;
typedef struct Opt_Event {
    Ark_Tag tag;
    Ark_Event value;
} Opt_Event;
typedef struct Ark_ExpectedFrameRateRange {
    /* kind: Interface */
    Ark_Number min;
    Ark_Number max;
    Ark_Number expected;
} Ark_ExpectedFrameRateRange;
typedef struct Opt_ExpectedFrameRateRange {
    Ark_Tag tag;
    Ark_ExpectedFrameRateRange value;
} Opt_ExpectedFrameRateRange;
typedef struct Ark_FadingEdgeOptions {
    /* kind: Interface */
    Opt_CustomObject fadingEdgeLength;
} Ark_FadingEdgeOptions;
typedef struct Opt_FadingEdgeOptions {
    Ark_Tag tag;
    Ark_FadingEdgeOptions value;
} Opt_FadingEdgeOptions;
typedef struct Ark_FingerInfo {
    /* kind: Interface */
    Ark_Number id;
    Ark_Number globalX;
    Ark_Number globalY;
    Ark_Number localX;
    Ark_Number localY;
    Ark_Number displayX;
    Ark_Number displayY;
} Ark_FingerInfo;
typedef struct Opt_FingerInfo {
    Ark_Tag tag;
    Ark_FingerInfo value;
} Opt_FingerInfo;
typedef struct Ark_FlexSpaceOptions {
    /* kind: Interface */
    Opt_CustomObject main;
    Opt_CustomObject cross;
} Ark_FlexSpaceOptions;
typedef struct Opt_FlexSpaceOptions {
    Ark_Tag tag;
    Ark_FlexSpaceOptions value;
} Opt_FlexSpaceOptions;
typedef struct Ark_FocusBoxStyle {
    /* kind: Interface */
    Opt_CustomObject margin;
    Opt_CustomObject strokeColor;
    Opt_CustomObject strokeWidth;
} Ark_FocusBoxStyle;
typedef struct Opt_FocusBoxStyle {
    Ark_Tag tag;
    Ark_FocusBoxStyle value;
} Opt_FocusBoxStyle;
typedef struct Ark_FontInfo {
    /* kind: Interface */
    Ark_String path;
    Ark_String postScriptName;
    Ark_String fullName;
    Ark_String family;
    Ark_String subfamily;
    Ark_Number weight;
    Ark_Number width;
    Ark_Boolean italic;
    Ark_Boolean monoSpace;
    Ark_Boolean symbolic;
} Ark_FontInfo;
typedef struct Opt_FontInfo {
    Ark_Tag tag;
    Ark_FontInfo value;
} Opt_FontInfo;
typedef struct Ark_FontOptions {
    /* kind: Interface */
    Ark_Union_String_Resource familyName;
    Ark_Union_String_Resource familySrc;
} Ark_FontOptions;
typedef struct Opt_FontOptions {
    Ark_Tag tag;
    Ark_FontOptions value;
} Opt_FontOptions;
typedef struct Ark_ForegroundEffectOptions {
    /* kind: Interface */
    Ark_Number radius;
} Ark_ForegroundEffectOptions;
typedef struct Opt_ForegroundEffectOptions {
    Ark_Tag tag;
    Ark_ForegroundEffectOptions value;
} Opt_ForegroundEffectOptions;
typedef struct Ark_FormCallbackInfo {
    /* kind: Interface */
    Ark_Int64 id;
    Ark_String idString;
} Ark_FormCallbackInfo;
typedef struct Opt_FormCallbackInfo {
    Ark_Tag tag;
    Ark_FormCallbackInfo value;
} Opt_FormCallbackInfo;
typedef struct Ark_FractionStop {
    /* kind: Interface */
    Ark_Number value0;
    Ark_Number value1;
} Ark_FractionStop;
typedef struct Opt_FractionStop {
    Ark_Tag tag;
    Ark_FractionStop value;
} Opt_FractionStop;
typedef struct Ark_GeometryTransitionOptions {
    /* kind: Interface */
    Opt_Boolean follow;
    Opt_TransitionHierarchyStrategy hierarchyStrategy;
} Ark_GeometryTransitionOptions;
typedef struct Opt_GeometryTransitionOptions {
    Ark_Tag tag;
    Ark_GeometryTransitionOptions value;
} Opt_GeometryTransitionOptions;
typedef struct Ark_GestureInfo {
    /* kind: Interface */
    Opt_String tag;
    Ark_GestureControl_GestureType type;
    Ark_Boolean isSystemGesture;
} Ark_GestureInfo;
typedef struct Opt_GestureInfo {
    Ark_Tag tag;
    Ark_GestureInfo value;
} Opt_GestureInfo;
typedef struct Ark_GestureStyleInterface {
    /* kind: Interface */
    Opt_Callback_ClickEvent_Void onClick;
    Opt_Callback_GestureEvent_Void onLongPress;
} Ark_GestureStyleInterface;
typedef struct Opt_GestureStyleInterface {
    Ark_Tag tag;
    Ark_GestureStyleInterface value;
} Opt_GestureStyleInterface;
typedef struct Ark_GestureType {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_TapGestureInterface value0;
        Ark_LongPressGestureInterface value1;
        Ark_PanGestureInterface value2;
        Ark_PinchGestureInterface value3;
        Ark_SwipeGestureInterface value4;
        Ark_RotationGestureInterface value5;
        Ark_GestureGroupInterface value6;
    };
} Ark_GestureType;
typedef struct Opt_GestureType {
    Ark_Tag tag;
    Ark_GestureType value;
} Opt_GestureType;
typedef struct Ark_GridContainerOptions {
    /* kind: Interface */
    Opt_Union_Number_String columns;
    Opt_SizeType sizeType;
    Opt_Union_Number_String gutter;
    Opt_Union_Number_String margin;
} Ark_GridContainerOptions;
typedef struct Opt_GridContainerOptions {
    Ark_Tag tag;
    Ark_GridContainerOptions value;
} Opt_GridContainerOptions;
typedef struct Opt_HierarchicalSymbolEffect {
    Ark_Tag tag;
    Ark_HierarchicalSymbolEffect value;
} Opt_HierarchicalSymbolEffect;
typedef struct Ark_ImageAIOptions {
    /* kind: Interface */
    Opt_Array_ImageAnalyzerType types;
    Opt_ImageAnalyzerController aiController;
} Ark_ImageAIOptions;
typedef struct Opt_ImageAIOptions {
    Ark_Tag tag;
    Ark_ImageAIOptions value;
} Opt_ImageAIOptions;
typedef struct Ark_ImageAnalyzerConfig {
    /* kind: Interface */
    Array_ImageAnalyzerType types;
} Ark_ImageAnalyzerConfig;
typedef struct Opt_ImageAnalyzerConfig {
    Ark_Tag tag;
    Ark_ImageAnalyzerConfig value;
} Opt_ImageAnalyzerConfig;
typedef struct Opt_ImageData {
    Ark_Tag tag;
    Ark_ImageData value;
} Opt_ImageData;
typedef struct Ark_ImageError {
    /* kind: Interface */
    Ark_Number componentWidth;
    Ark_Number componentHeight;
    Ark_String message;
} Ark_ImageError;
typedef struct Opt_ImageError {
    Ark_Tag tag;
    Ark_ImageError value;
} Opt_ImageError;
typedef struct Ark_ImageSourceSize {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
} Ark_ImageSourceSize;
typedef struct Opt_ImageSourceSize {
    Ark_Tag tag;
    Ark_ImageSourceSize value;
} Opt_ImageSourceSize;
typedef struct Ark_InputCounterOptions {
    /* kind: Interface */
    Opt_Number thresholdPercentage;
    Opt_Boolean highlightBorder;
} Ark_InputCounterOptions;
typedef struct Opt_InputCounterOptions {
    Ark_Tag tag;
    Ark_InputCounterOptions value;
} Opt_InputCounterOptions;
typedef struct Ark_InsertValue {
    /* kind: Interface */
    Ark_Number insertOffset;
    Ark_String insertValue;
} Ark_InsertValue;
typedef struct Opt_InsertValue {
    Ark_Tag tag;
    Ark_InsertValue value;
} Opt_InsertValue;
typedef struct Ark_InvertOptions {
    /* kind: Interface */
    Ark_Number low;
    Ark_Number high;
    Ark_Number threshold;
    Ark_Number thresholdRange;
} Ark_InvertOptions;
typedef struct Opt_InvertOptions {
    Ark_Tag tag;
    Ark_InvertOptions value;
} Opt_InvertOptions;
typedef struct Ark_ItemDragInfo {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
} Ark_ItemDragInfo;
typedef struct Opt_ItemDragInfo {
    Ark_Tag tag;
    Ark_ItemDragInfo value;
} Opt_ItemDragInfo;
typedef struct Ark_KeyboardOptions {
    /* kind: Interface */
    Opt_Boolean supportAvoidance;
} Ark_KeyboardOptions;
typedef struct Opt_KeyboardOptions {
    Ark_Tag tag;
    Ark_KeyboardOptions value;
} Opt_KeyboardOptions;
typedef struct Opt_KeyEvent {
    Ark_Tag tag;
    Ark_KeyEvent value;
} Opt_KeyEvent;
typedef struct Ark_Length {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_Number value1;
        Ark_CustomObject value2;
    };
} Ark_Length;
typedef struct Opt_Length {
    Ark_Tag tag;
    Ark_Length value;
} Opt_Length;
typedef struct Ark_LengthConstrain {
    /* kind: Interface */
    Ark_Length minLength;
    Ark_Length maxLength;
} Ark_LengthConstrain;
typedef struct Opt_LengthConstrain {
    Ark_Tag tag;
    Ark_LengthConstrain value;
} Opt_LengthConstrain;
typedef struct Opt_LetterSpacingStyle {
    Ark_Tag tag;
    Ark_LetterSpacingStyle value;
} Opt_LetterSpacingStyle;
typedef struct Ark_LinearGradient_common {
    /* kind: Interface */
    Opt_Union_Number_String angle;
    Opt_GradientDirection direction;
    Array_Tuple_ResourceColor_Number colors;
    Opt_Boolean repeating;
} Ark_LinearGradient_common;
typedef struct Opt_LinearGradient_common {
    Ark_Tag tag;
    Ark_LinearGradient_common value;
} Opt_LinearGradient_common;
typedef struct Ark_LinearGradientBlurOptions {
    /* kind: Interface */
    Array_FractionStop fractionStops;
    Ark_GradientDirection direction;
} Ark_LinearGradientBlurOptions;
typedef struct Opt_LinearGradientBlurOptions {
    Ark_Tag tag;
    Ark_LinearGradientBlurOptions value;
} Opt_LinearGradientBlurOptions;
typedef struct Opt_LineHeightStyle {
    Ark_Tag tag;
    Ark_LineHeightStyle value;
} Opt_LineHeightStyle;
typedef struct Ark_ListItemOptions {
    /* kind: Interface */
    Opt_ListItemStyle style;
} Ark_ListItemOptions;
typedef struct Opt_ListItemOptions {
    Ark_Tag tag;
    Ark_ListItemOptions value;
} Opt_ListItemOptions;
typedef struct Ark_ListOptions {
    /* kind: Interface */
    Opt_Number initialIndex;
    Opt_Union_Number_String space;
    Opt_Scroller scroller;
} Ark_ListOptions;
typedef struct Opt_ListOptions {
    Ark_Tag tag;
    Ark_ListOptions value;
} Opt_ListOptions;
typedef struct Ark_Literal_Alignment_align {
    /* kind: Interface */
    Opt_Alignment align;
} Ark_Literal_Alignment_align;
typedef struct Opt_Literal_Alignment_align {
    Ark_Tag tag;
    Ark_Literal_Alignment_align value;
} Opt_Literal_Alignment_align;
typedef struct Ark_Literal_Boolean_next_Axis_direction {
    /* kind: Interface */
    Ark_Boolean next;
    Opt_Axis direction;
} Ark_Literal_Boolean_next_Axis_direction;
typedef struct Opt_Literal_Boolean_next_Axis_direction {
    Ark_Tag tag;
    Ark_Literal_Boolean_next_Axis_direction value;
} Opt_Literal_Boolean_next_Axis_direction;
typedef struct Ark_Literal_Number_angle_fingers {
    /* kind: Interface */
    Opt_Number fingers;
    Opt_Number angle;
} Ark_Literal_Number_angle_fingers;
typedef struct Opt_Literal_Number_angle_fingers {
    Ark_Tag tag;
    Ark_Literal_Number_angle_fingers value;
} Opt_Literal_Number_angle_fingers;
typedef struct Ark_Literal_Number_distance_fingers {
    /* kind: Interface */
    Opt_Number fingers;
    Opt_Number distance;
} Ark_Literal_Number_distance_fingers;
typedef struct Opt_Literal_Number_distance_fingers {
    Ark_Tag tag;
    Ark_Literal_Number_distance_fingers value;
} Opt_Literal_Number_distance_fingers;
typedef struct Ark_Literal_Number_distance_fingers_PanDirection_direction {
    /* kind: Interface */
    Opt_Number fingers;
    Opt_PanDirection direction;
    Opt_Number distance;
} Ark_Literal_Number_distance_fingers_PanDirection_direction;
typedef struct Opt_Literal_Number_distance_fingers_PanDirection_direction {
    Ark_Tag tag;
    Ark_Literal_Number_distance_fingers_PanDirection_direction value;
} Opt_Literal_Number_distance_fingers_PanDirection_direction;
typedef struct Ark_Literal_Number_duration_fingers_Boolean_repeat {
    /* kind: Interface */
    Opt_Number fingers;
    Opt_Boolean repeat;
    Opt_Number duration;
} Ark_Literal_Number_duration_fingers_Boolean_repeat;
typedef struct Opt_Literal_Number_duration_fingers_Boolean_repeat {
    Ark_Tag tag;
    Ark_Literal_Number_duration_fingers_Boolean_repeat value;
} Opt_Literal_Number_duration_fingers_Boolean_repeat;
typedef struct Ark_Literal_Number_fingers_speed_SwipeDirection_direction {
    /* kind: Interface */
    Opt_Number fingers;
    Opt_SwipeDirection direction;
    Opt_Number speed;
} Ark_Literal_Number_fingers_speed_SwipeDirection_direction;
typedef struct Opt_Literal_Number_fingers_speed_SwipeDirection_direction {
    Ark_Tag tag;
    Ark_Literal_Number_fingers_speed_SwipeDirection_direction value;
} Opt_Literal_Number_fingers_speed_SwipeDirection_direction;
typedef struct Ark_Literal_Number_height_width {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
} Ark_Literal_Number_height_width;
typedef struct Opt_Literal_Number_height_width {
    Ark_Tag tag;
    Ark_Literal_Number_height_width value;
} Opt_Literal_Number_height_width;
typedef struct Ark_Literal_Number_offset_span {
    /* kind: Interface */
    Ark_Number span;
    Ark_Number offset;
} Ark_Literal_Number_offset_span;
typedef struct Opt_Literal_Number_offset_span {
    Ark_Tag tag;
    Ark_Literal_Number_offset_span value;
} Opt_Literal_Number_offset_span;
typedef struct Ark_Literal_Number_offsetRemain {
    /* kind: Interface */
    Ark_Number offsetRemain;
} Ark_Literal_Number_offsetRemain;
typedef struct Opt_Literal_Number_offsetRemain {
    Ark_Tag tag;
    Ark_Literal_Number_offsetRemain value;
} Opt_Literal_Number_offsetRemain;
typedef struct Ark_Literal_Object_detail {
    /* kind: Interface */
    Ark_Object detail;
} Ark_Literal_Object_detail;
typedef struct Opt_Literal_Object_detail {
    Ark_Tag tag;
    Ark_Literal_Object_detail value;
} Opt_Literal_Object_detail;
typedef struct Ark_Literal_String_anchor_HorizontalAlign_align {
    /* kind: Interface */
    Ark_String anchor;
    Ark_HorizontalAlign align;
} Ark_Literal_String_anchor_HorizontalAlign_align;
typedef struct Opt_Literal_String_anchor_HorizontalAlign_align {
    Ark_Tag tag;
    Ark_Literal_String_anchor_HorizontalAlign_align value;
} Opt_Literal_String_anchor_HorizontalAlign_align;
typedef struct Ark_Literal_String_anchor_VerticalAlign_align {
    /* kind: Interface */
    Ark_String anchor;
    Ark_VerticalAlign align;
} Ark_Literal_String_anchor_VerticalAlign_align;
typedef struct Opt_Literal_String_anchor_VerticalAlign_align {
    Ark_Tag tag;
    Ark_Literal_String_anchor_VerticalAlign_align value;
} Opt_Literal_String_anchor_VerticalAlign_align;
typedef struct Ark_Literal_String_target_NavigationType_type {
    /* kind: Interface */
    Ark_String target;
    Opt_NavigationType type;
} Ark_Literal_String_target_NavigationType_type;
typedef struct Opt_Literal_String_target_NavigationType_type {
    Ark_Tag tag;
    Ark_Literal_String_target_NavigationType_type value;
} Opt_Literal_String_target_NavigationType_type;
typedef struct Ark_Literal_String_value_Callback_Void_action {
    /* kind: Interface */
    Ark_String value;
    Callback_Void action;
} Ark_Literal_String_value_Callback_Void_action;
typedef struct Opt_Literal_String_value_Callback_Void_action {
    Ark_Tag tag;
    Ark_Literal_String_value_Callback_Void_action value;
} Opt_Literal_String_value_Callback_Void_action;
typedef struct Ark_Literal_TransitionEffect_appear_disappear {
    /* kind: Interface */
    Ark_TransitionEffect appear;
    Ark_TransitionEffect disappear;
} Ark_Literal_TransitionEffect_appear_disappear;
typedef struct Opt_Literal_TransitionEffect_appear_disappear {
    Ark_Tag tag;
    Ark_Literal_TransitionEffect_appear_disappear value;
} Opt_Literal_TransitionEffect_appear_disappear;
typedef struct Ark_Literal_Union_String_Resource_icon_text {
    /* kind: Interface */
    Opt_Union_String_Resource icon;
    Opt_Union_String_Resource text;
} Ark_Literal_Union_String_Resource_icon_text;
typedef struct Opt_Literal_Union_String_Resource_icon_text {
    Ark_Tag tag;
    Ark_Literal_Union_String_Resource_icon_text value;
} Opt_Literal_Union_String_Resource_icon_text;
typedef struct Ark_LocalizedBorderRadiuses {
    /* kind: Interface */
    Opt_CustomObject topStart;
    Opt_CustomObject topEnd;
    Opt_CustomObject bottomStart;
    Opt_CustomObject bottomEnd;
} Ark_LocalizedBorderRadiuses;
typedef struct Opt_LocalizedBorderRadiuses {
    Ark_Tag tag;
    Ark_LocalizedBorderRadiuses value;
} Opt_LocalizedBorderRadiuses;
typedef struct Ark_LocalizedEdges {
    /* kind: Interface */
    Opt_CustomObject top;
    Opt_CustomObject start;
    Opt_CustomObject bottom;
    Opt_CustomObject end;
} Ark_LocalizedEdges;
typedef struct Opt_LocalizedEdges {
    Ark_Tag tag;
    Ark_LocalizedEdges value;
} Opt_LocalizedEdges;
typedef struct Ark_LocalizedEdgeWidths {
    /* kind: Interface */
    Opt_CustomObject top;
    Opt_CustomObject end;
    Opt_CustomObject bottom;
    Opt_CustomObject start;
} Ark_LocalizedEdgeWidths;
typedef struct Opt_LocalizedEdgeWidths {
    Ark_Tag tag;
    Ark_LocalizedEdgeWidths value;
} Opt_LocalizedEdgeWidths;
typedef struct Ark_LocalizedHorizontalAlignParam {
    /* kind: Interface */
    Ark_String anchor;
    Ark_HorizontalAlign align;
} Ark_LocalizedHorizontalAlignParam;
typedef struct Opt_LocalizedHorizontalAlignParam {
    Ark_Tag tag;
    Ark_LocalizedHorizontalAlignParam value;
} Opt_LocalizedHorizontalAlignParam;
typedef struct Ark_LocalizedPadding {
    /* kind: Interface */
    Opt_CustomObject top;
    Opt_CustomObject end;
    Opt_CustomObject bottom;
    Opt_CustomObject start;
} Ark_LocalizedPadding;
typedef struct Opt_LocalizedPadding {
    Ark_Tag tag;
    Ark_LocalizedPadding value;
} Opt_LocalizedPadding;
typedef struct Ark_LocalizedPosition {
    /* kind: Interface */
    Opt_CustomObject start;
    Opt_CustomObject top;
} Ark_LocalizedPosition;
typedef struct Opt_LocalizedPosition {
    Ark_Tag tag;
    Ark_LocalizedPosition value;
} Opt_LocalizedPosition;
typedef struct Ark_LocalizedVerticalAlignParam {
    /* kind: Interface */
    Ark_String anchor;
    Ark_VerticalAlign align;
} Ark_LocalizedVerticalAlignParam;
typedef struct Opt_LocalizedVerticalAlignParam {
    Ark_Tag tag;
    Ark_LocalizedVerticalAlignParam value;
} Opt_LocalizedVerticalAlignParam;
typedef struct Opt_Matrix2D {
    Ark_Tag tag;
    Ark_Matrix2D value;
} Opt_Matrix2D;
typedef struct Ark_Matrix4Result {
    /* kind: Interface */
    Ark_Number value0;
    Ark_Number value1;
    Ark_Number value2;
    Ark_Number value3;
    Ark_Number value4;
    Ark_Number value5;
    Ark_Number value6;
    Ark_Number value7;
    Ark_Number value8;
    Ark_Number value9;
    Ark_Number value10;
    Ark_Number value11;
    Ark_Number value12;
    Ark_Number value13;
    Ark_Number value14;
    Ark_Number value15;
} Ark_Matrix4Result;
typedef struct Opt_Matrix4Result {
    Ark_Tag tag;
    Ark_Matrix4Result value;
} Opt_Matrix4Result;
typedef struct Ark_MeasureOptions {
    /* kind: Interface */
    Ark_Union_String_Resource textContent;
    Opt_Union_Number_String_Resource constraintWidth;
    Opt_Union_Number_String_Resource fontSize;
    Opt_Union_Number_FontStyle fontStyle;
    Opt_Union_Number_String_FontWeight fontWeight;
    Opt_Union_String_Resource fontFamily;
    Opt_Union_Number_String letterSpacing;
    Opt_TextAlign textAlign;
    Opt_Union_Number_TextOverflow overflow;
    Opt_Number maxLines;
    Opt_Union_Number_String_Resource lineHeight;
    Opt_Union_Number_String baselineOffset;
    Opt_Union_Number_TextCase textCase;
    Opt_Union_Number_String textIndent;
    Opt_WordBreak wordBreak;
} Ark_MeasureOptions;
typedef struct Opt_MeasureOptions {
    Ark_Tag tag;
    Ark_MeasureOptions value;
} Opt_MeasureOptions;
typedef struct Ark_MeasureResult {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
} Ark_MeasureResult;
typedef struct Opt_MeasureResult {
    Ark_Tag tag;
    Ark_MeasureResult value;
} Opt_MeasureResult;
typedef struct Ark_MessageEvents {
    /* kind: Interface */
    Ark_String type;
    Ark_Int64 timeStamp;
    Ark_Object data;
} Ark_MessageEvents;
typedef struct Opt_MessageEvents {
    Ark_Tag tag;
    Ark_MessageEvents value;
} Opt_MessageEvents;
typedef struct Ark_MotionBlurAnchor {
    /* kind: Interface */
    Ark_Number x;
    Ark_Number y;
} Ark_MotionBlurAnchor;
typedef struct Opt_MotionBlurAnchor {
    Ark_Tag tag;
    Ark_MotionBlurAnchor value;
} Opt_MotionBlurAnchor;
typedef struct Ark_MotionBlurOptions {
    /* kind: Interface */
    Ark_Number radius;
    Ark_MotionBlurAnchor anchor;
} Ark_MotionBlurOptions;
typedef struct Opt_MotionBlurOptions {
    Ark_Tag tag;
    Ark_MotionBlurOptions value;
} Opt_MotionBlurOptions;
typedef struct Ark_MotionPathOptions {
    /* kind: Interface */
    Ark_String path;
    Opt_Number from;
    Opt_Number to;
    Opt_Boolean rotatable;
} Ark_MotionPathOptions;
typedef struct Opt_MotionPathOptions {
    Ark_Tag tag;
    Ark_MotionPathOptions value;
} Opt_MotionPathOptions;
typedef struct Opt_MutableStyledString {
    Ark_Tag tag;
    Ark_MutableStyledString value;
} Opt_MutableStyledString;
typedef struct Ark_NativeEmbedInfo {
    /* kind: Interface */
    Opt_Map_String_String params;
} Ark_NativeEmbedInfo;
typedef struct Opt_NativeEmbedInfo {
    Ark_Tag tag;
    Ark_NativeEmbedInfo value;
} Opt_NativeEmbedInfo;
typedef struct Ark_NavContentInfo {
    /* kind: Interface */
    Opt_String name;
    Ark_Number index;
    Opt_NavDestinationMode mode;
    Opt_Object param;
    Opt_String navDestinationId;
} Ark_NavContentInfo;
typedef struct Opt_NavContentInfo {
    Ark_Tag tag;
    Ark_NavContentInfo value;
} Opt_NavContentInfo;
typedef struct Ark_NavDestinationCommonTitle {
    /* kind: Interface */
    Ark_String main;
    Ark_String sub;
} Ark_NavDestinationCommonTitle;
typedef struct Opt_NavDestinationCommonTitle {
    Ark_Tag tag;
    Ark_NavDestinationCommonTitle value;
} Opt_NavDestinationCommonTitle;
typedef struct Ark_NavigationAnimatedTransition {
    /* kind: Interface */
    Opt_Callback_Boolean_Void onTransitionEnd;
    Opt_Number timeout;
    Opt_Boolean isInteractive;
    Callback_NavigationTransitionProxy_Void transition;
} Ark_NavigationAnimatedTransition;
typedef struct Opt_NavigationAnimatedTransition {
    Ark_Tag tag;
    Ark_NavigationAnimatedTransition value;
} Opt_NavigationAnimatedTransition;
typedef struct Ark_NavigationCommonTitle {
    /* kind: Interface */
    Ark_String main;
    Ark_String sub;
} Ark_NavigationCommonTitle;
typedef struct Opt_NavigationCommonTitle {
    Ark_Tag tag;
    Ark_NavigationCommonTitle value;
} Opt_NavigationCommonTitle;
typedef struct Ark_NavigationInterception {
    /* kind: Interface */
    Opt_InterceptionShowCallback willShow;
    Opt_InterceptionShowCallback didShow;
    Opt_InterceptionModeCallback modeChange;
} Ark_NavigationInterception;
typedef struct Opt_NavigationInterception {
    Ark_Tag tag;
    Ark_NavigationInterception value;
} Opt_NavigationInterception;
typedef struct Ark_NavigationMenuItem {
    /* kind: Interface */
    Ark_String value;
    Opt_String icon;
    Opt_CustomObject symbolIcon;
    Opt_Boolean isEnabled;
    Opt_Callback_Void action;
} Ark_NavigationMenuItem;
typedef struct Opt_NavigationMenuItem {
    Ark_Tag tag;
    Ark_NavigationMenuItem value;
} Opt_NavigationMenuItem;
typedef struct Ark_NavigationOptions {
    /* kind: Interface */
    Opt_LaunchMode launchMode;
    Opt_Boolean animated;
} Ark_NavigationOptions;
typedef struct Opt_NavigationOptions {
    Ark_Tag tag;
    Ark_NavigationOptions value;
} Opt_NavigationOptions;
typedef struct Opt_NavigationTransitionProxy {
    Ark_Tag tag;
    Ark_NavigationTransitionProxy value;
} Opt_NavigationTransitionProxy;
typedef struct Opt_NavPathInfo {
    Ark_Tag tag;
    Ark_NavPathInfo value;
} Opt_NavPathInfo;
typedef struct Ark_Offset {
    /* kind: Interface */
    Ark_Length dx;
    Ark_Length dy;
} Ark_Offset;
typedef struct Opt_Offset {
    Ark_Tag tag;
    Ark_Offset value;
} Opt_Offset;
typedef struct Ark_OnHttpErrorReceiveEvent {
    /* kind: Interface */
    Ark_WebResourceResponse response;
} Ark_OnHttpErrorReceiveEvent;
typedef struct Opt_OnHttpErrorReceiveEvent {
    Ark_Tag tag;
    Ark_OnHttpErrorReceiveEvent value;
} Opt_OnHttpErrorReceiveEvent;
typedef struct Ark_OnRenderExitedEvent {
    /* kind: Interface */
    Ark_RenderExitReason renderExitReason;
} Ark_OnRenderExitedEvent;
typedef struct Opt_OnRenderExitedEvent {
    Ark_Tag tag;
    Ark_OnRenderExitedEvent value;
} Opt_OnRenderExitedEvent;
typedef struct Ark_OverlayOffset {
    /* kind: Interface */
    Opt_Number x;
    Opt_Number y;
} Ark_OverlayOffset;
typedef struct Opt_OverlayOffset {
    Ark_Tag tag;
    Ark_OverlayOffset value;
} Opt_OverlayOffset;
typedef struct Ark_PasswordIcon {
    /* kind: Interface */
    Opt_Union_String_Resource onIconSrc;
    Opt_Union_String_Resource offIconSrc;
} Ark_PasswordIcon;
typedef struct Opt_PasswordIcon {
    Ark_Tag tag;
    Ark_PasswordIcon value;
} Opt_PasswordIcon;
typedef struct Ark_PasteEvent {
    /* kind: Interface */
    Opt_Callback_Void preventDefault;
} Ark_PasteEvent;
typedef struct Opt_PasteEvent {
    Ark_Tag tag;
    Ark_PasteEvent value;
} Opt_PasteEvent;
typedef struct Ark_PathOptions {
    /* kind: Interface */
    Opt_Union_Number_String width;
    Opt_Union_Number_String height;
    Opt_String commands;
} Ark_PathOptions;
typedef struct Opt_PathOptions {
    Ark_Tag tag;
    Ark_PathOptions value;
} Opt_PathOptions;
typedef struct Ark_PixelRoundPolicy {
    /* kind: Interface */
    Opt_PixelRoundCalcPolicy start;
    Opt_PixelRoundCalcPolicy top;
    Opt_PixelRoundCalcPolicy end;
    Opt_PixelRoundCalcPolicy bottom;
} Ark_PixelRoundPolicy;
typedef struct Opt_PixelRoundPolicy {
    Ark_Tag tag;
    Ark_PixelRoundPolicy value;
} Opt_PixelRoundPolicy;
typedef struct Ark_PopInfo {
    /* kind: Interface */
    Ark_NavPathInfo info;
    Ark_Object result;
} Ark_PopInfo;
typedef struct Opt_PopInfo {
    Ark_Tag tag;
    Ark_PopInfo value;
} Opt_PopInfo;
typedef struct Ark_PostMessageOptions {
    /* kind: Interface */
    Opt_Array_Object transfer;
} Ark_PostMessageOptions;
typedef struct Opt_PostMessageOptions {
    Ark_Tag tag;
    Ark_PostMessageOptions value;
} Opt_PostMessageOptions;
typedef struct Ark_PreviewText {
    /* kind: Interface */
    Ark_Number offset;
    Ark_String value;
} Ark_PreviewText;
typedef struct Opt_PreviewText {
    Ark_Tag tag;
    Ark_PreviewText value;
} Opt_PreviewText;
typedef struct Opt_RenderingContextSettings {
    Ark_Tag tag;
    Ark_RenderingContextSettings value;
} Opt_RenderingContextSettings;
typedef struct Opt_ReplaceSymbolEffect {
    Ark_Tag tag;
    Ark_ReplaceSymbolEffect value;
} Opt_ReplaceSymbolEffect;
typedef struct Ark_ResourceColor {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Color value0;
        Ark_Number value1;
        Ark_String value2;
        Ark_CustomObject value3;
    };
} Ark_ResourceColor;
typedef struct Opt_ResourceColor {
    Ark_Tag tag;
    Ark_ResourceColor value;
} Opt_ResourceColor;
typedef struct Ark_ResourceStr {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_CustomObject value1;
    };
} Ark_ResourceStr;
typedef struct Opt_ResourceStr {
    Ark_Tag tag;
    Ark_ResourceStr value;
} Opt_ResourceStr;
typedef struct Ark_RichEditorBuilderSpanOptions {
    /* kind: Interface */
    Opt_Number offset;
} Ark_RichEditorBuilderSpanOptions;
typedef struct Opt_RichEditorBuilderSpanOptions {
    Ark_Tag tag;
    Ark_RichEditorBuilderSpanOptions value;
} Opt_RichEditorBuilderSpanOptions;
typedef struct Ark_RichEditorDeleteValue {
    /* kind: Interface */
    Ark_Number offset;
    Ark_RichEditorDeleteDirection direction;
    Ark_Number length;
    Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult richEditorDeleteSpans;
} Ark_RichEditorDeleteValue;
typedef struct Opt_RichEditorDeleteValue {
    Ark_Tag tag;
    Ark_RichEditorDeleteValue value;
} Opt_RichEditorDeleteValue;
typedef struct Ark_RichEditorGesture {
    /* kind: Interface */
    Opt_Callback_ClickEvent_Void onClick;
    Opt_Callback_GestureEvent_Void onLongPress;
} Ark_RichEditorGesture;
typedef struct Opt_RichEditorGesture {
    Ark_Tag tag;
    Ark_RichEditorGesture value;
} Opt_RichEditorGesture;
typedef struct Ark_RichEditorInsertValue {
    /* kind: Interface */
    Ark_Number insertOffset;
    Ark_String insertValue;
    Opt_String previewText;
} Ark_RichEditorInsertValue;
typedef struct Opt_RichEditorInsertValue {
    Ark_Tag tag;
    Ark_RichEditorInsertValue value;
} Opt_RichEditorInsertValue;
typedef struct Ark_RichEditorRange {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number end;
} Ark_RichEditorRange;
typedef struct Opt_RichEditorRange {
    Ark_Tag tag;
    Ark_RichEditorRange value;
} Opt_RichEditorRange;
typedef struct Ark_RichEditorSelection {
    /* kind: Interface */
    Ark_Tuple_Number_Number selection;
    Array_Union_RichEditorTextSpanResult_RichEditorImageSpanResult spans;
} Ark_RichEditorSelection;
typedef struct Opt_RichEditorSelection {
    Ark_Tag tag;
    Ark_RichEditorSelection value;
} Opt_RichEditorSelection;
typedef struct Ark_RichEditorSpanPosition {
    /* kind: Interface */
    Ark_Number spanIndex;
    Ark_Tuple_Number_Number spanRange;
} Ark_RichEditorSpanPosition;
typedef struct Opt_RichEditorSpanPosition {
    Ark_Tag tag;
    Ark_RichEditorSpanPosition value;
} Opt_RichEditorSpanPosition;
typedef struct Ark_RichEditorSymbolSpanStyle {
    /* kind: Interface */
    Opt_Union_Number_String_Resource fontSize;
    Opt_Array_ResourceColor fontColor;
    Opt_Union_Number_FontWeight_String fontWeight;
    Opt_SymbolEffectStrategy effectStrategy;
    Opt_SymbolRenderingStrategy renderingStrategy;
} Ark_RichEditorSymbolSpanStyle;
typedef struct Opt_RichEditorSymbolSpanStyle {
    Ark_Tag tag;
    Ark_RichEditorSymbolSpanStyle value;
} Opt_RichEditorSymbolSpanStyle;
typedef struct Ark_RichEditorUpdateSymbolSpanStyleOptions {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number end;
    Ark_RichEditorSymbolSpanStyle symbolStyle;
} Ark_RichEditorUpdateSymbolSpanStyleOptions;
typedef struct Opt_RichEditorUpdateSymbolSpanStyleOptions {
    Ark_Tag tag;
    Ark_RichEditorUpdateSymbolSpanStyleOptions value;
} Opt_RichEditorUpdateSymbolSpanStyleOptions;
typedef struct Ark_RotateOptions {
    /* kind: Interface */
    Opt_Number x;
    Opt_Number y;
    Opt_Number z;
    Opt_Union_Number_String centerX;
    Opt_Union_Number_String centerY;
    Opt_Number centerZ;
    Opt_Number perspective;
    Ark_Union_Number_String angle;
} Ark_RotateOptions;
typedef struct Opt_RotateOptions {
    Ark_Tag tag;
    Ark_RotateOptions value;
} Opt_RotateOptions;
typedef struct Ark_RoundedRectOptions {
    /* kind: Interface */
    Opt_Union_Number_String width;
    Opt_Union_Number_String height;
    Opt_Union_Number_String radiusWidth;
    Opt_Union_Number_String radiusHeight;
} Ark_RoundedRectOptions;
typedef struct Opt_RoundedRectOptions {
    Ark_Tag tag;
    Ark_RoundedRectOptions value;
} Opt_RoundedRectOptions;
typedef struct Ark_RouteMapConfig {
    /* kind: Interface */
    Ark_String name;
    Ark_String pageSourceFile;
    Ark_Object data;
} Ark_RouteMapConfig;
typedef struct Opt_RouteMapConfig {
    Ark_Tag tag;
    Ark_RouteMapConfig value;
} Opt_RouteMapConfig;
typedef struct Ark_RowOptions {
    /* kind: Interface */
    Opt_Union_String_Number space;
} Ark_RowOptions;
typedef struct Opt_RowOptions {
    Ark_Tag tag;
    Ark_RowOptions value;
} Opt_RowOptions;
typedef struct Ark_ScaleOptions {
    /* kind: Interface */
    Opt_Number x;
    Opt_Number y;
    Opt_Number z;
    Opt_Union_Number_String centerX;
    Opt_Union_Number_String centerY;
} Ark_ScaleOptions;
typedef struct Opt_ScaleOptions {
    Ark_Tag tag;
    Ark_ScaleOptions value;
} Opt_ScaleOptions;
typedef struct Opt_ScaleSymbolEffect {
    Ark_Tag tag;
    Ark_ScaleSymbolEffect value;
} Opt_ScaleSymbolEffect;
typedef struct Ark_ScrollAnimationOptions {
    /* kind: Interface */
    Opt_Number duration;
    Opt_Union_Curve_ICurve curve;
    Opt_Boolean canOverScroll;
} Ark_ScrollAnimationOptions;
typedef struct Opt_ScrollAnimationOptions {
    Ark_Tag tag;
    Ark_ScrollAnimationOptions value;
} Opt_ScrollAnimationOptions;
typedef struct Ark_ScrollEdgeOptions {
    /* kind: Interface */
    Opt_Number velocity;
} Ark_ScrollEdgeOptions;
typedef struct Opt_ScrollEdgeOptions {
    Ark_Tag tag;
    Ark_ScrollEdgeOptions value;
} Opt_ScrollEdgeOptions;
typedef struct Ark_ScrollPageOptions {
    /* kind: Interface */
    Ark_Boolean next;
    Opt_Boolean animation;
} Ark_ScrollPageOptions;
typedef struct Opt_ScrollPageOptions {
    Ark_Tag tag;
    Ark_ScrollPageOptions value;
} Opt_ScrollPageOptions;
typedef struct Ark_ScrollToIndexOptions {
    /* kind: Interface */
    Opt_CustomObject extraOffset;
} Ark_ScrollToIndexOptions;
typedef struct Opt_ScrollToIndexOptions {
    Ark_Tag tag;
    Ark_ScrollToIndexOptions value;
} Opt_ScrollToIndexOptions;
typedef struct Ark_SelectionMenuOptions {
    /* kind: Interface */
    Opt_MenuOnAppearCallback onAppear;
    Opt_Callback_Void onDisappear;
    Opt_MenuType menuType;
} Ark_SelectionMenuOptions;
typedef struct Opt_SelectionMenuOptions {
    Ark_Tag tag;
    Ark_SelectionMenuOptions value;
} Opt_SelectionMenuOptions;
typedef struct Ark_SelectionOptions {
    /* kind: Interface */
    Opt_MenuPolicy menuPolicy;
} Ark_SelectionOptions;
typedef struct Opt_SelectionOptions {
    Ark_Tag tag;
    Ark_SelectionOptions value;
} Opt_SelectionOptions;
typedef struct Ark_ShadowOptions {
    /* kind: Interface */
    Ark_Union_Number_Resource radius;
    Opt_ShadowType type;
    Opt_Union_Color_String_Resource_ColoringStrategy color;
    Opt_Union_Number_Resource offsetX;
    Opt_Union_Number_Resource offsetY;
    Opt_Boolean fill;
} Ark_ShadowOptions;
typedef struct Opt_ShadowOptions {
    Ark_Tag tag;
    Ark_ShadowOptions value;
} Opt_ShadowOptions;
typedef struct Ark_SheetDismiss {
    /* kind: Interface */
    Callback_Void dismiss;
} Ark_SheetDismiss;
typedef struct Opt_SheetDismiss {
    Ark_Tag tag;
    Ark_SheetDismiss value;
} Opt_SheetDismiss;
typedef struct Ark_SnapshotOptions {
    /* kind: Interface */
    Opt_Number scale;
    Opt_Boolean waitUntilRenderFinished;
} Ark_SnapshotOptions;
typedef struct Opt_SnapshotOptions {
    Ark_Tag tag;
    Ark_SnapshotOptions value;
} Opt_SnapshotOptions;
typedef struct Ark_SpringBackAction {
    /* kind: Interface */
    Callback_Void springBack;
} Ark_SpringBackAction;
typedef struct Opt_SpringBackAction {
    Ark_Tag tag;
    Ark_SpringBackAction value;
} Opt_SpringBackAction;
typedef struct Ark_StackOptions {
    /* kind: Interface */
    Opt_Alignment alignContent;
} Ark_StackOptions;
typedef struct Opt_StackOptions {
    Ark_Tag tag;
    Ark_StackOptions value;
} Opt_StackOptions;
typedef struct Ark_StateStyles {
    /* kind: Interface */
    Opt_Object normal;
    Opt_Object pressed;
    Opt_Object disabled;
    Opt_Object focused;
    Opt_Object clicked;
    Opt_Object selected;
} Ark_StateStyles;
typedef struct Opt_StateStyles {
    Ark_Tag tag;
    Ark_StateStyles value;
} Opt_StateStyles;
typedef struct Ark_StyledStringChangedListener {
    /* kind: Interface */
    Opt_Callback_StyledStringChangeValue_Boolean onWillChange;
    Opt_OnDidChangeCallback onDidChange;
} Ark_StyledStringChangedListener;
typedef struct Opt_StyledStringChangedListener {
    Ark_Tag tag;
    Ark_StyledStringChangedListener value;
} Opt_StyledStringChangedListener;
typedef struct Ark_SwiperAutoFill {
    /* kind: Interface */
    Ark_VP minSize;
} Ark_SwiperAutoFill;
typedef struct Opt_SwiperAutoFill {
    Ark_Tag tag;
    Ark_SwiperAutoFill value;
} Opt_SwiperAutoFill;
typedef struct Ark_SwiperContentAnimatedTransition {
    /* kind: Interface */
    Opt_Number timeout;
    Callback_SwiperContentTransitionProxy_Void transition;
} Ark_SwiperContentAnimatedTransition;
typedef struct Opt_SwiperContentAnimatedTransition {
    Ark_Tag tag;
    Ark_SwiperContentAnimatedTransition value;
} Opt_SwiperContentAnimatedTransition;
typedef struct Ark_TabBarSymbol {
    /* kind: Interface */
    Ark_CustomObject normal;
    Opt_CustomObject selected;
} Ark_TabBarSymbol;
typedef struct Opt_TabBarSymbol {
    Ark_Tag tag;
    Ark_TabBarSymbol value;
} Opt_TabBarSymbol;
typedef struct Ark_TabsOptions {
    /* kind: Interface */
    Opt_BarPosition barPosition;
    Opt_Number index;
    Opt_TabsController controller;
} Ark_TabsOptions;
typedef struct Opt_TabsOptions {
    Ark_Tag tag;
    Ark_TabsOptions value;
} Opt_TabsOptions;
typedef struct Ark_TapGestureParameters {
    /* kind: Interface */
    Opt_Number count;
    Opt_Number fingers;
    Opt_Number distanceThreshold;
} Ark_TapGestureParameters;
typedef struct Opt_TapGestureParameters {
    Ark_Tag tag;
    Ark_TapGestureParameters value;
} Opt_TapGestureParameters;
typedef struct Ark_TerminationInfo {
    /* kind: Interface */
    Ark_Number code;
    Opt_CustomObject want;
} Ark_TerminationInfo;
typedef struct Opt_TerminationInfo {
    Ark_Tag tag;
    Ark_TerminationInfo value;
} Opt_TerminationInfo;
typedef struct Ark_TextCascadePickerRangeContent {
    /* kind: Interface */
    Ark_Union_String_Resource text;
    Opt_Array_TextCascadePickerRangeContent children;
} Ark_TextCascadePickerRangeContent;
typedef struct Opt_TextCascadePickerRangeContent {
    Ark_Tag tag;
    Ark_TextCascadePickerRangeContent value;
} Opt_TextCascadePickerRangeContent;
typedef struct Ark_TextPickerRangeContent {
    /* kind: Interface */
    Ark_Union_String_Resource icon;
    Opt_Union_String_Resource text;
} Ark_TextPickerRangeContent;
typedef struct Opt_TextPickerRangeContent {
    Ark_Tag tag;
    Ark_TextPickerRangeContent value;
} Opt_TextPickerRangeContent;
typedef struct Ark_TextRange {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number end;
} Ark_TextRange;
typedef struct Opt_TextRange {
    Ark_Tag tag;
    Ark_TextRange value;
} Opt_TextRange;
typedef struct Opt_TextShadowStyle {
    Ark_Tag tag;
    Ark_TextShadowStyle value;
} Opt_TextShadowStyle;
typedef struct Ark_TextStyle_alert_dialog {
    /* kind: Interface */
    Opt_WordBreak wordBreak;
} Ark_TextStyle_alert_dialog;
typedef struct Opt_TextStyle_alert_dialog {
    Ark_Tag tag;
    Ark_TextStyle_alert_dialog value;
} Opt_TextStyle_alert_dialog;
typedef struct Ark_ToggleOptions {
    /* kind: Interface */
    Ark_ToggleType type;
    Opt_Boolean isOn;
} Ark_ToggleOptions;
typedef struct Opt_ToggleOptions {
    Ark_Tag tag;
    Ark_ToggleOptions value;
} Opt_ToggleOptions;
typedef struct Ark_TouchObject {
    /* kind: Interface */
    Ark_TouchType type;
    Ark_Number id;
    Ark_Number displayX;
    Ark_Number displayY;
    Ark_Number windowX;
    Ark_Number windowY;
    Ark_Number screenX;
    Ark_Number screenY;
    Ark_Number x;
    Ark_Number y;
} Ark_TouchObject;
typedef struct Opt_TouchObject {
    Ark_Tag tag;
    Ark_TouchObject value;
} Opt_TouchObject;
typedef struct Ark_TouchResult {
    /* kind: Interface */
    Ark_TouchTestStrategy strategy;
    Opt_String id;
} Ark_TouchResult;
typedef struct Opt_TouchResult {
    Ark_Tag tag;
    Ark_TouchResult value;
} Opt_TouchResult;
typedef struct Ark_TransformationMatrix {
    /* kind: Interface */
    Array_Number matrix4x4;
} Ark_TransformationMatrix;
typedef struct Opt_TransformationMatrix {
    Ark_Tag tag;
    Ark_TransformationMatrix value;
} Opt_TransformationMatrix;
typedef struct Ark_TranslateOptions {
    /* kind: Interface */
    Opt_Union_Number_String x;
    Opt_Union_Number_String y;
    Opt_Union_Number_String z;
} Ark_TranslateOptions;
typedef struct Opt_TranslateOptions {
    Ark_Tag tag;
    Ark_TranslateOptions value;
} Opt_TranslateOptions;
typedef struct Ark_Tuple_Boolean_Number {
    /* kind: Interface */
    Opt_Boolean value0;
    Opt_Number value1;
} Ark_Tuple_Boolean_Number;
typedef struct Opt_Tuple_Boolean_Number {
    Ark_Tag tag;
    Ark_Tuple_Boolean_Number value;
} Opt_Tuple_Boolean_Number;
typedef struct Ark_Tuple_Dimension_Dimension {
    /* kind: Interface */
    Ark_Dimension value0;
    Ark_Dimension value1;
} Ark_Tuple_Dimension_Dimension;
typedef struct Opt_Tuple_Dimension_Dimension {
    Ark_Tag tag;
    Ark_Tuple_Dimension_Dimension value;
} Opt_Tuple_Dimension_Dimension;
typedef struct Ark_Tuple_Length_Length {
    /* kind: Interface */
    Ark_Length value0;
    Ark_Length value1;
} Ark_Tuple_Length_Length;
typedef struct Opt_Tuple_Length_Length {
    Ark_Tag tag;
    Ark_Tuple_Length_Length value;
} Opt_Tuple_Length_Length;
typedef struct Ark_Tuple_ResourceColor_Number {
    /* kind: Interface */
    Ark_ResourceColor value0;
    Ark_Number value1;
} Ark_Tuple_ResourceColor_Number;
typedef struct Opt_Tuple_ResourceColor_Number {
    Ark_Tag tag;
    Ark_Tuple_ResourceColor_Number value;
} Opt_Tuple_ResourceColor_Number;
typedef struct Ark_Type_CommonMethod_linearGradient_value {
    /* kind: Interface */
    Opt_Union_Number_String angle;
    Opt_GradientDirection direction;
    Array_Tuple_ResourceColor_Number colors;
    Opt_Boolean repeating;
} Ark_Type_CommonMethod_linearGradient_value;
typedef struct Opt_Type_CommonMethod_linearGradient_value {
    Ark_Tag tag;
    Ark_Type_CommonMethod_linearGradient_value value;
} Opt_Type_CommonMethod_linearGradient_value;
typedef struct Ark_Type_CommonMethod_radialGradient_value {
    /* kind: Interface */
    Ark_Tuple_Length_Length center;
    Ark_Union_Number_String radius;
    Array_Tuple_ResourceColor_Number colors;
    Opt_Boolean repeating;
} Ark_Type_CommonMethod_radialGradient_value;
typedef struct Opt_Type_CommonMethod_radialGradient_value {
    Ark_Tag tag;
    Ark_Type_CommonMethod_radialGradient_value value;
} Opt_Type_CommonMethod_radialGradient_value;
typedef struct Ark_Type_CommonMethod_sweepGradient_value {
    /* kind: Interface */
    Ark_Tuple_Length_Length center;
    Opt_Union_Number_String start;
    Opt_Union_Number_String end;
    Opt_Union_Number_String rotation;
    Array_Tuple_ResourceColor_Number colors;
    Opt_Boolean repeating;
} Ark_Type_CommonMethod_sweepGradient_value;
typedef struct Opt_Type_CommonMethod_sweepGradient_value {
    Ark_Tag tag;
    Ark_Type_CommonMethod_sweepGradient_value value;
} Opt_Type_CommonMethod_sweepGradient_value;
typedef struct Ark_Type_PanGestureInterface_callable0_value {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Literal_Number_distance_fingers_PanDirection_direction value0;
        Ark_PanGestureOptions value1;
    };
} Ark_Type_PanGestureInterface_callable0_value;
typedef struct Opt_Type_PanGestureInterface_callable0_value {
    Ark_Tag tag;
    Ark_Type_PanGestureInterface_callable0_value value;
} Opt_Type_PanGestureInterface_callable0_value;
typedef struct Ark_Type_TabContentAttribute_tabBar_value {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_CustomObject value1;
        CustomNodeBuilder value2;
        Ark_Literal_Union_String_Resource_icon_text value3;
    };
} Ark_Type_TabContentAttribute_tabBar_value;
typedef struct Opt_Type_TabContentAttribute_tabBar_value {
    Ark_Tag tag;
    Ark_Type_TabContentAttribute_tabBar_value value;
} Opt_Type_TabContentAttribute_tabBar_value;
typedef struct Ark_Type_Test1Attribute_testTupleUnion_value {
    /* kind: Interface */
    Ark_Union_Number_String value0;
    Ark_Union_Boolean_EnumDTS value1;
    Ark_Union_String_EnumDTS_Boolean value2;
} Ark_Type_Test1Attribute_testTupleUnion_value;
typedef struct Opt_Type_Test1Attribute_testTupleUnion_value {
    Ark_Tag tag;
    Ark_Type_Test1Attribute_testTupleUnion_value value;
} Opt_Type_Test1Attribute_testTupleUnion_value;
typedef struct Ark_Type_TextPickerOptions_range {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Array_String value0;
        Array_Array_String value1;
        Ark_CustomObject value2;
        Array_TextPickerRangeContent value3;
        Array_TextCascadePickerRangeContent value4;
    };
} Ark_Type_TextPickerOptions_range;
typedef struct Opt_Type_TextPickerOptions_range {
    Ark_Tag tag;
    Ark_Type_TextPickerOptions_range value;
} Opt_Type_TextPickerOptions_range;
typedef struct Ark_Union_Array_MenuElement_CustomBuilder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Array_MenuElement value0;
        CustomNodeBuilder value1;
    };
} Ark_Union_Array_MenuElement_CustomBuilder;
typedef struct Opt_Union_Array_MenuElement_CustomBuilder {
    Ark_Tag tag;
    Ark_Union_Array_MenuElement_CustomBuilder value;
} Opt_Union_Array_MenuElement_CustomBuilder;
typedef struct Ark_Union_Array_NavigationMenuItem_CustomBuilder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Array_NavigationMenuItem value0;
        CustomNodeBuilder value1;
    };
} Ark_Union_Array_NavigationMenuItem_CustomBuilder;
typedef struct Opt_Union_Array_NavigationMenuItem_CustomBuilder {
    Ark_Tag tag;
    Ark_Union_Array_NavigationMenuItem_CustomBuilder value;
} Opt_Union_Array_NavigationMenuItem_CustomBuilder;
typedef struct Ark_Union_Array_ToolbarItem_CustomBuilder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Array_ToolbarItem value0;
        CustomNodeBuilder value1;
    };
} Ark_Union_Array_ToolbarItem_CustomBuilder;
typedef struct Opt_Union_Array_ToolbarItem_CustomBuilder {
    Ark_Tag tag;
    Ark_Union_Array_ToolbarItem_CustomBuilder value;
} Opt_Union_Array_ToolbarItem_CustomBuilder;
typedef struct Ark_Union_Boolean_Callback_DismissPopupAction_Void {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Callback_DismissPopupAction_Void value1;
    };
} Ark_Union_Boolean_Callback_DismissPopupAction_Void;
typedef struct Opt_Union_Boolean_Callback_DismissPopupAction_Void {
    Ark_Tag tag;
    Ark_Union_Boolean_Callback_DismissPopupAction_Void value;
} Opt_Union_Boolean_Callback_DismissPopupAction_Void;
typedef struct Ark_Union_BorderStyle_EdgeStyles {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_BorderStyle value0;
        Ark_EdgeStyles value1;
    };
} Ark_Union_BorderStyle_EdgeStyles;
typedef struct Opt_Union_BorderStyle_EdgeStyles {
    Ark_Tag tag;
    Ark_Union_BorderStyle_EdgeStyles value;
} Opt_Union_BorderStyle_EdgeStyles;
typedef struct Ark_Union_CanvasRenderingContext2D_DrawingRenderingContext {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CanvasRenderingContext2D value0;
        Ark_DrawingRenderingContext value1;
    };
} Ark_Union_CanvasRenderingContext2D_DrawingRenderingContext;
typedef struct Opt_Union_CanvasRenderingContext2D_DrawingRenderingContext {
    Ark_Tag tag;
    Ark_Union_CanvasRenderingContext2D_DrawingRenderingContext value;
} Opt_Union_CanvasRenderingContext2D_DrawingRenderingContext;
typedef struct Ark_Union_CustomBuilder_DragItemInfo {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        CustomNodeBuilder value0;
        Ark_DragItemInfo value1;
    };
} Ark_Union_CustomBuilder_DragItemInfo;
typedef struct Opt_Union_CustomBuilder_DragItemInfo {
    Ark_Tag tag;
    Ark_Union_CustomBuilder_DragItemInfo value;
} Opt_Union_CustomBuilder_DragItemInfo;
typedef struct Ark_Union_CustomBuilder_DragItemInfo_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        CustomNodeBuilder value0;
        Ark_DragItemInfo value1;
        Ark_String value2;
    };
} Ark_Union_CustomBuilder_DragItemInfo_String;
typedef struct Opt_Union_CustomBuilder_DragItemInfo_String {
    Ark_Tag tag;
    Ark_Union_CustomBuilder_DragItemInfo_String value;
} Opt_Union_CustomBuilder_DragItemInfo_String;
typedef struct Ark_Union_Dimension_Array_Dimension {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Array_Dimension value1;
    };
} Ark_Union_Dimension_Array_Dimension;
typedef struct Opt_Union_Dimension_Array_Dimension {
    Ark_Tag tag;
    Ark_Union_Dimension_Array_Dimension value;
} Opt_Union_Dimension_Array_Dimension;
typedef struct Ark_Union_DragPreviewMode_Array_DragPreviewMode {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_DragPreviewMode value0;
        Array_DragPreviewMode value1;
    };
} Ark_Union_DragPreviewMode_Array_DragPreviewMode;
typedef struct Opt_Union_DragPreviewMode_Array_DragPreviewMode {
    Ark_Tag tag;
    Ark_Union_DragPreviewMode_Array_DragPreviewMode value;
} Opt_Union_DragPreviewMode_Array_DragPreviewMode;
typedef struct Ark_Union_EdgeOutlineStyles_OutlineStyle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_EdgeOutlineStyles value0;
        Ark_OutlineStyle value1;
    };
} Ark_Union_EdgeOutlineStyles_OutlineStyle;
typedef struct Opt_Union_EdgeOutlineStyles_OutlineStyle {
    Ark_Tag tag;
    Ark_Union_EdgeOutlineStyles_OutlineStyle value;
} Opt_Union_EdgeOutlineStyles_OutlineStyle;
typedef struct Ark_Union_EdgeStyles_BorderStyle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_EdgeStyles value0;
        Ark_BorderStyle value1;
    };
} Ark_Union_EdgeStyles_BorderStyle;
typedef struct Opt_Union_EdgeStyles_BorderStyle {
    Ark_Tag tag;
    Ark_Union_EdgeStyles_BorderStyle value;
} Opt_Union_EdgeStyles_BorderStyle;
typedef struct Ark_Union_Length_LayoutPolicy {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Length value0;
        Ark_LayoutPolicy value1;
    };
} Ark_Union_Length_LayoutPolicy;
typedef struct Opt_Union_Length_LayoutPolicy {
    Ark_Tag tag;
    Ark_Union_Length_LayoutPolicy value;
} Opt_Union_Length_LayoutPolicy;
typedef struct Ark_Union_Length_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Length value0;
        Ark_Number value1;
    };
} Ark_Union_Length_Number;
typedef struct Opt_Union_Length_Number {
    Ark_Tag tag;
    Ark_Union_Length_Number value;
} Opt_Union_Length_Number;
typedef struct Ark_Union_MenuPreviewMode_CustomBuilder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_MenuPreviewMode value0;
        CustomNodeBuilder value1;
    };
} Ark_Union_MenuPreviewMode_CustomBuilder;
typedef struct Opt_Union_MenuPreviewMode_CustomBuilder {
    Ark_Tag tag;
    Ark_Union_MenuPreviewMode_CustomBuilder value;
} Opt_Union_MenuPreviewMode_CustomBuilder;
typedef struct Ark_Union_Number_Array_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Array_Number value1;
    };
} Ark_Union_Number_Array_Number;
typedef struct Opt_Union_Number_Array_Number {
    Ark_Tag tag;
    Ark_Union_Number_Array_Number value;
} Opt_Union_Number_Array_Number;
typedef struct Ark_Union_Number_Array_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Array_String value1;
    };
} Ark_Union_Number_Array_String;
typedef struct Opt_Union_Number_Array_String {
    Ark_Tag tag;
    Ark_Union_Number_Array_String value;
} Opt_Union_Number_Array_String;
typedef struct Ark_Union_Number_InvertOptions {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_InvertOptions value1;
    };
} Ark_Union_Number_InvertOptions;
typedef struct Opt_Union_Number_InvertOptions {
    Ark_Tag tag;
    Ark_Union_Number_InvertOptions value;
} Opt_Union_Number_InvertOptions;
typedef struct Ark_Union_Number_LengthConstrain {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_LengthConstrain value1;
    };
} Ark_Union_Number_LengthConstrain;
typedef struct Opt_Union_Number_LengthConstrain {
    Ark_Tag tag;
    Ark_Union_Number_LengthConstrain value;
} Opt_Union_Number_LengthConstrain;
typedef struct Ark_Union_Number_Literal_Number_offset_span {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_Literal_Number_offset_span value1;
    };
} Ark_Union_Number_Literal_Number_offset_span;
typedef struct Opt_Union_Number_Literal_Number_offset_span {
    Ark_Tag tag;
    Ark_Union_Number_Literal_Number_offset_span value;
} Opt_Union_Number_Literal_Number_offset_span;
typedef struct Ark_Union_Number_ResourceStr {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_ResourceStr value1;
    };
} Ark_Union_Number_ResourceStr;
typedef struct Opt_Union_Number_ResourceStr {
    Ark_Tag tag;
    Ark_Union_Number_ResourceStr value;
} Opt_Union_Number_ResourceStr;
typedef struct Ark_Union_Number_String_Array_Union_Number_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_String value1;
        Array_Union_Number_String value2;
    };
} Ark_Union_Number_String_Array_Union_Number_String;
typedef struct Opt_Union_Number_String_Array_Union_Number_String {
    Ark_Tag tag;
    Ark_Union_Number_String_Array_Union_Number_String value;
} Opt_Union_Number_String_Array_Union_Number_String;
typedef struct Ark_Union_Number_String_SwiperAutoFill {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_String value1;
        Ark_SwiperAutoFill value2;
    };
} Ark_Union_Number_String_SwiperAutoFill;
typedef struct Opt_Union_Number_String_SwiperAutoFill {
    Ark_Tag tag;
    Ark_Union_Number_String_SwiperAutoFill value;
} Opt_Union_Number_String_SwiperAutoFill;
typedef struct Ark_Union_OutlineStyle_EdgeOutlineStyles {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_OutlineStyle value0;
        Ark_EdgeOutlineStyles value1;
    };
} Ark_Union_OutlineStyle_EdgeOutlineStyles;
typedef struct Opt_Union_OutlineStyle_EdgeOutlineStyles {
    Ark_Tag tag;
    Ark_Union_OutlineStyle_EdgeOutlineStyles value;
} Opt_Union_OutlineStyle_EdgeOutlineStyles;
typedef struct Ark_Union_PixelMap_ResourceStr {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_PixelMap value0;
        Ark_ResourceStr value1;
    };
} Ark_Union_PixelMap_ResourceStr;
typedef struct Opt_Union_PixelMap_ResourceStr {
    Ark_Tag tag;
    Ark_Union_PixelMap_ResourceStr value;
} Opt_Union_PixelMap_ResourceStr;
typedef struct Ark_Union_PixelMap_ResourceStr_DrawableDescriptor {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_PixelMap value0;
        Ark_ResourceStr value1;
        Ark_CustomObject value2;
    };
} Ark_Union_PixelMap_ResourceStr_DrawableDescriptor;
typedef struct Opt_Union_PixelMap_ResourceStr_DrawableDescriptor {
    Ark_Tag tag;
    Ark_Union_PixelMap_ResourceStr_DrawableDescriptor value;
} Opt_Union_PixelMap_ResourceStr_DrawableDescriptor;
typedef struct Ark_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_PixelMap value0;
        Ark_ResourceStr value1;
        Ark_CustomObject value2;
        Ark_ImageContent value3;
    };
} Ark_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent;
typedef struct Opt_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent {
    Ark_Tag tag;
    Ark_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent value;
} Opt_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent;
typedef struct Ark_Union_ResourceColor_ColorContent {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceColor value0;
        Ark_ColorContent value1;
    };
} Ark_Union_ResourceColor_ColorContent;
typedef struct Opt_Union_ResourceColor_ColorContent {
    Ark_Tag tag;
    Ark_Union_ResourceColor_ColorContent value;
} Opt_Union_ResourceColor_ColorContent;
typedef struct Ark_Union_ResourceColor_ColoringStrategy {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceColor value0;
        Ark_ColoringStrategy value1;
    };
} Ark_Union_ResourceColor_ColoringStrategy;
typedef struct Opt_Union_ResourceColor_ColoringStrategy {
    Ark_Tag tag;
    Ark_Union_ResourceColor_ColoringStrategy value;
} Opt_Union_ResourceColor_ColoringStrategy;
typedef struct Ark_Union_ResourceColor_LinearGradient {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceColor value0;
        Ark_LinearGradient value1;
    };
} Ark_Union_ResourceColor_LinearGradient;
typedef struct Opt_Union_ResourceColor_LinearGradient {
    Ark_Tag tag;
    Ark_Union_ResourceColor_LinearGradient value;
} Opt_Union_ResourceColor_LinearGradient;
typedef struct Ark_Union_ResourceStr_ComponentContent {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceStr value0;
        Ark_CustomObject value1;
    };
} Ark_Union_ResourceStr_ComponentContent;
typedef struct Opt_Union_ResourceStr_ComponentContent {
    Ark_Tag tag;
    Ark_Union_ResourceStr_ComponentContent value;
} Opt_Union_ResourceStr_ComponentContent;
typedef struct Ark_Union_ResourceStr_PixelMap {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceStr value0;
        Ark_PixelMap value1;
    };
} Ark_Union_ResourceStr_PixelMap;
typedef struct Opt_Union_ResourceStr_PixelMap {
    Ark_Tag tag;
    Ark_Union_ResourceStr_PixelMap value;
} Opt_Union_ResourceStr_PixelMap;
typedef struct Ark_Union_ResourceStr_PixelMap_SymbolGlyphModifier {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceStr value0;
        Ark_PixelMap value1;
        Ark_CustomObject value2;
    };
} Ark_Union_ResourceStr_PixelMap_SymbolGlyphModifier;
typedef struct Opt_Union_ResourceStr_PixelMap_SymbolGlyphModifier {
    Ark_Tag tag;
    Ark_Union_ResourceStr_PixelMap_SymbolGlyphModifier value;
} Opt_Union_ResourceStr_PixelMap_SymbolGlyphModifier;
typedef struct Ark_Union_ResourceStr_TabBarSymbol {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceStr value0;
        Ark_TabBarSymbol value1;
    };
} Ark_Union_ResourceStr_TabBarSymbol;
typedef struct Opt_Union_ResourceStr_TabBarSymbol {
    Ark_Tag tag;
    Ark_Union_ResourceStr_TabBarSymbol value;
} Opt_Union_ResourceStr_TabBarSymbol;
typedef struct Ark_Union_ResourceStr_Union_ResourceStr_ComponentContent {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceStr value0;
        Ark_Union_ResourceStr_ComponentContent value1;
    };
} Ark_Union_ResourceStr_Union_ResourceStr_ComponentContent;
typedef struct Opt_Union_ResourceStr_Union_ResourceStr_ComponentContent {
    Ark_Tag tag;
    Ark_Union_ResourceStr_Union_ResourceStr_ComponentContent value;
} Opt_Union_ResourceStr_Union_ResourceStr_ComponentContent;
typedef struct Ark_Union_ScrollAnimationOptions_Boolean {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ScrollAnimationOptions value0;
        Ark_Boolean value1;
    };
} Ark_Union_ScrollAnimationOptions_Boolean;
typedef struct Opt_Union_ScrollAnimationOptions_Boolean {
    Ark_Tag tag;
    Ark_Union_ScrollAnimationOptions_Boolean value;
} Opt_Union_ScrollAnimationOptions_Boolean;
typedef struct Ark_Union_ShadowOptions_Array_ShadowOptions {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ShadowOptions value0;
        Array_ShadowOptions value1;
    };
} Ark_Union_ShadowOptions_Array_ShadowOptions;
typedef struct Opt_Union_ShadowOptions_Array_ShadowOptions {
    Ark_Tag tag;
    Ark_Union_ShadowOptions_Array_ShadowOptions value;
} Opt_Union_ShadowOptions_Array_ShadowOptions;
typedef struct Ark_Union_ShadowOptions_ShadowStyle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ShadowOptions value0;
        Ark_ShadowStyle value1;
    };
} Ark_Union_ShadowOptions_ShadowStyle;
typedef struct Opt_Union_ShadowOptions_ShadowStyle {
    Ark_Tag tag;
    Ark_Union_ShadowOptions_ShadowStyle value;
} Opt_Union_ShadowOptions_ShadowStyle;
typedef struct Ark_Union_SheetSize_Length {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_SheetSize value0;
        Ark_Length value1;
    };
} Ark_Union_SheetSize_Length;
typedef struct Opt_Union_SheetSize_Length {
    Ark_Tag tag;
    Ark_Union_SheetSize_Length value;
} Opt_Union_SheetSize_Length;
typedef struct Ark_Union_String_Array_String {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Array_String value1;
    };
} Ark_Union_String_Array_String;
typedef struct Opt_Union_String_Array_String {
    Ark_Tag tag;
    Ark_Union_String_Array_String value;
} Opt_Union_String_Array_String;
typedef struct Ark_Union_String_CustomBuilder_ComponentContent {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        CustomNodeBuilder value1;
        Ark_CustomObject value2;
    };
} Ark_Union_String_CustomBuilder_ComponentContent;
typedef struct Opt_Union_String_CustomBuilder_ComponentContent {
    Ark_Tag tag;
    Ark_Union_String_CustomBuilder_ComponentContent value;
} Opt_Union_String_CustomBuilder_ComponentContent;
typedef struct Ark_Union_String_Resource_LinearGradient_common {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_CustomObject value1;
        Ark_LinearGradient_common value2;
    };
} Ark_Union_String_Resource_LinearGradient_common;
typedef struct Opt_Union_String_Resource_LinearGradient_common {
    Ark_Tag tag;
    Ark_Union_String_Resource_LinearGradient_common value;
} Opt_Union_String_Resource_LinearGradient_common;
typedef struct Ark_Union_TitleHeight_Length {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_TitleHeight value0;
        Ark_Length value1;
    };
} Ark_Union_TitleHeight_Length;
typedef struct Opt_Union_TitleHeight_Length {
    Ark_Tag tag;
    Ark_Union_TitleHeight_Length value;
} Opt_Union_TitleHeight_Length;
typedef struct Ark_Union_Vector1_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Vector1 value0;
        Ark_Number value1;
    };
} Ark_Union_Vector1_Number;
typedef struct Opt_Union_Vector1_Number {
    Ark_Tag tag;
    Ark_Union_Vector1_Number value;
} Opt_Union_Vector1_Number;
typedef struct Ark_Union_Vector2_Number {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Vector2 value0;
        Ark_Number value1;
    };
} Ark_Union_Vector2_Number;
typedef struct Opt_Union_Vector2_Number {
    Ark_Tag tag;
    Ark_Union_Vector2_Number value;
} Opt_Union_Vector2_Number;
typedef struct Ark_UnionOptionalInterfaceDTS {
    /* kind: Interface */
    Opt_String unionProp;
} Ark_UnionOptionalInterfaceDTS;
typedef struct Opt_UnionOptionalInterfaceDTS {
    Ark_Tag tag;
    Ark_UnionOptionalInterfaceDTS value;
} Opt_UnionOptionalInterfaceDTS;
typedef struct Ark_VisibleAreaEventOptions {
    /* kind: Interface */
    Array_Number ratios;
    Opt_Number expectedUpdateInterval;
} Ark_VisibleAreaEventOptions;
typedef struct Opt_VisibleAreaEventOptions {
    Ark_Tag tag;
    Ark_VisibleAreaEventOptions value;
} Opt_VisibleAreaEventOptions;
typedef struct Ark_VisibleListContentInfo {
    /* kind: Interface */
    Ark_Number index;
    Opt_ListItemGroupArea itemGroupArea;
    Opt_Number itemIndexInGroup;
} Ark_VisibleListContentInfo;
typedef struct Opt_VisibleListContentInfo {
    Ark_Tag tag;
    Ark_VisibleListContentInfo value;
} Opt_VisibleListContentInfo;
typedef struct Ark_WorkerOptions {
    /* kind: Interface */
    Opt_String type;
    Opt_String name;
    Opt_Boolean shared;
} Ark_WorkerOptions;
typedef struct Opt_WorkerOptions {
    Ark_Tag tag;
    Ark_WorkerOptions value;
} Opt_WorkerOptions;
typedef struct Ark_AlertDialogButtonBaseOptions {
    /* kind: Interface */
    Opt_Boolean enabled;
    Opt_Boolean defaultFocus;
    Opt_DialogButtonStyle style;
    Ark_ResourceStr value;
    Opt_ResourceColor fontColor;
    Opt_ResourceColor backgroundColor;
    VoidCallback action;
} Ark_AlertDialogButtonBaseOptions;
typedef struct Opt_AlertDialogButtonBaseOptions {
    Ark_Tag tag;
    Ark_AlertDialogButtonBaseOptions value;
} Opt_AlertDialogButtonBaseOptions;
typedef struct Ark_AlertDialogButtonOptions {
    /* kind: Interface */
    Opt_Boolean enabled;
    Opt_Boolean defaultFocus;
    Opt_DialogButtonStyle style;
    Ark_ResourceStr value;
    Opt_ResourceColor fontColor;
    Opt_ResourceColor backgroundColor;
    VoidCallback action;
    Opt_Boolean primary;
} Ark_AlertDialogButtonOptions;
typedef struct Opt_AlertDialogButtonOptions {
    Ark_Tag tag;
    Ark_AlertDialogButtonOptions value;
} Opt_AlertDialogButtonOptions;
typedef struct Ark_AlignRuleOption {
    /* kind: Interface */
    Opt_Literal_String_anchor_HorizontalAlign_align left;
    Opt_Literal_String_anchor_HorizontalAlign_align right;
    Opt_Literal_String_anchor_HorizontalAlign_align middle;
    Opt_Literal_String_anchor_VerticalAlign_align top;
    Opt_Literal_String_anchor_VerticalAlign_align bottom;
    Opt_Literal_String_anchor_VerticalAlign_align center;
    Opt_Bias bias;
} Ark_AlignRuleOption;
typedef struct Opt_AlignRuleOption {
    Ark_Tag tag;
    Ark_AlignRuleOption value;
} Opt_AlignRuleOption;
typedef struct Ark_AnimateParam {
    /* kind: Interface */
    Opt_Number duration;
    Opt_Number tempo;
    Opt_Union_Curve_String_ICurve curve;
    Opt_Number delay;
    Opt_Number iterations;
    Opt_PlayMode playMode;
    Opt_Callback_Void onFinish;
    Opt_FinishCallbackType finishCallbackType;
    Opt_ExpectedFrameRateRange expectedFrameRateRange;
} Ark_AnimateParam;
typedef struct Opt_AnimateParam {
    Ark_Tag tag;
    Ark_AnimateParam value;
} Opt_AnimateParam;
typedef struct Ark_ArrowStyle {
    /* kind: Interface */
    Opt_Boolean showBackground;
    Opt_Boolean isSidebarMiddle;
    Opt_Length backgroundSize;
    Opt_ResourceColor backgroundColor;
    Opt_Length arrowSize;
    Opt_ResourceColor arrowColor;
} Ark_ArrowStyle;
typedef struct Opt_ArrowStyle {
    Ark_Tag tag;
    Ark_ArrowStyle value;
} Opt_ArrowStyle;
typedef struct Ark_BackgroundBlurStyleOptions {
    /* kind: Interface */
    Opt_ThemeColorMode colorMode;
    Opt_AdaptiveColor adaptiveColor;
    Opt_Number scale;
    Opt_BlurOptions blurOptions;
    Opt_BlurStyleActivePolicy policy;
    Opt_ResourceColor inactiveColor;
} Ark_BackgroundBlurStyleOptions;
typedef struct Opt_BackgroundBlurStyleOptions {
    Ark_Tag tag;
    Ark_BackgroundBlurStyleOptions value;
} Opt_BackgroundBlurStyleOptions;
typedef struct Ark_BackgroundEffectOptions {
    /* kind: Interface */
    Ark_Number radius;
    Opt_Number saturation;
    Opt_Number brightness;
    Opt_ResourceColor color;
    Opt_AdaptiveColor adaptiveColor;
    Opt_BlurOptions blurOptions;
    Opt_BlurStyleActivePolicy policy;
    Opt_ResourceColor inactiveColor;
} Ark_BackgroundEffectOptions;
typedef struct Opt_BackgroundEffectOptions {
    Ark_Tag tag;
    Ark_BackgroundEffectOptions value;
} Opt_BackgroundEffectOptions;
typedef struct Ark_BoardStyle {
    /* kind: Interface */
    Opt_Length borderRadius;
} Ark_BoardStyle;
typedef struct Opt_BoardStyle {
    Ark_Tag tag;
    Ark_BoardStyle value;
} Opt_BoardStyle;
typedef struct Ark_BorderRadiuses {
    /* kind: Interface */
    Opt_Length topLeft;
    Opt_Length topRight;
    Opt_Length bottomLeft;
    Opt_Length bottomRight;
} Ark_BorderRadiuses;
typedef struct Opt_BorderRadiuses {
    Ark_Tag tag;
    Ark_BorderRadiuses value;
} Opt_BorderRadiuses;
typedef struct Ark_CaretStyle {
    /* kind: Interface */
    Opt_Length width;
    Opt_ResourceColor color;
} Ark_CaretStyle;
typedef struct Opt_CaretStyle {
    Ark_Tag tag;
    Ark_CaretStyle value;
} Opt_CaretStyle;
typedef struct Ark_ChainAnimationOptions {
    /* kind: Interface */
    Ark_Length minSpace;
    Ark_Length maxSpace;
    Opt_Number conductivity;
    Opt_Number intensity;
    Opt_ChainEdgeEffect edgeEffect;
    Opt_Number stiffness;
    Opt_Number damping;
} Ark_ChainAnimationOptions;
typedef struct Opt_ChainAnimationOptions {
    Ark_Tag tag;
    Ark_ChainAnimationOptions value;
} Opt_ChainAnimationOptions;
typedef struct Ark_ColorStop {
    /* kind: Interface */
    Ark_ResourceColor color;
    Ark_Length offset;
} Ark_ColorStop;
typedef struct Opt_ColorStop {
    Ark_Tag tag;
    Ark_ColorStop value;
} Opt_ColorStop;
typedef struct Ark_ComponentInfo {
    /* kind: Interface */
    Ark_Size size;
    Ark_Offset_componentutils localOffset;
    Ark_Offset_componentutils windowOffset;
    Ark_Offset_componentutils screenOffset;
    Ark_TranslateResult translate;
    Ark_ScaleResult scale;
    Ark_RotateResult rotate;
    Ark_Matrix4Result transform;
} Ark_ComponentInfo;
typedef struct Opt_ComponentInfo {
    Ark_Tag tag;
    Ark_ComponentInfo value;
} Opt_ComponentInfo;
typedef struct Ark_ConstraintSizeOptions {
    /* kind: Interface */
    Opt_Length minWidth;
    Opt_Length maxWidth;
    Opt_Length minHeight;
    Opt_Length maxHeight;
} Ark_ConstraintSizeOptions;
typedef struct Opt_ConstraintSizeOptions {
    Ark_Tag tag;
    Ark_ConstraintSizeOptions value;
} Opt_ConstraintSizeOptions;
typedef struct Ark_ContentCoverOptions {
    /* kind: Interface */
    Opt_ResourceColor backgroundColor;
    Opt_Callback_Void onAppear;
    Opt_Callback_Void onDisappear;
    Opt_Callback_Void onWillAppear;
    Opt_Callback_Void onWillDisappear;
    Opt_ModalTransition modalTransition;
    Opt_Callback_DismissContentCoverAction_Void onWillDismiss;
    Opt_TransitionEffect transition;
} Ark_ContentCoverOptions;
typedef struct Opt_ContentCoverOptions {
    Ark_Tag tag;
    Ark_ContentCoverOptions value;
} Opt_ContentCoverOptions;
typedef struct Ark_ContextMenuAnimationOptions {
    /* kind: Interface */
    Opt_AnimationRange_Number scale;
    Opt_TransitionEffect transition;
    Opt_AnimationRange_Number hoverScale;
} Ark_ContextMenuAnimationOptions;
typedef struct Opt_ContextMenuAnimationOptions {
    Ark_Tag tag;
    Ark_ContextMenuAnimationOptions value;
} Opt_ContextMenuAnimationOptions;
typedef struct Opt_DecorationStyle {
    Ark_Tag tag;
    Ark_DecorationStyle value;
} Opt_DecorationStyle;
typedef struct Ark_DecorationStyleInterface {
    /* kind: Interface */
    Ark_TextDecorationType type;
    Opt_ResourceColor color;
    Opt_TextDecorationStyle style;
} Ark_DecorationStyleInterface;
typedef struct Opt_DecorationStyleInterface {
    Ark_Tag tag;
    Ark_DecorationStyleInterface value;
} Opt_DecorationStyleInterface;
typedef struct Ark_DecorationStyleResult {
    /* kind: Interface */
    Ark_TextDecorationType type;
    Ark_ResourceColor color;
    Opt_TextDecorationStyle style;
} Ark_DecorationStyleResult;
typedef struct Opt_DecorationStyleResult {
    Ark_Tag tag;
    Ark_DecorationStyleResult value;
} Opt_DecorationStyleResult;
typedef struct Ark_DividerOptions {
    /* kind: Interface */
    Opt_Dimension strokeWidth;
    Opt_ResourceColor color;
    Opt_Dimension startMargin;
    Opt_Dimension endMargin;
} Ark_DividerOptions;
typedef struct Opt_DividerOptions {
    Ark_Tag tag;
    Ark_DividerOptions value;
} Opt_DividerOptions;
typedef struct Ark_DotIndicator {
    /* kind: Interface */
    Opt_Length _left;
    Opt_Length _top;
    Opt_Length _right;
    Opt_Length _bottom;
    Opt_CustomObject _start;
    Opt_CustomObject _end;
    Opt_Length _itemWidth;
    Opt_Length _itemHeight;
    Opt_Length _selectedItemWidth;
    Opt_Length _selectedItemHeight;
    Opt_Boolean _mask;
    Opt_ResourceColor _color;
    Opt_ResourceColor _selectedColor;
    Opt_Number _maxDisplayCount;
} Ark_DotIndicator;
typedef struct Opt_DotIndicator {
    Ark_Tag tag;
    Ark_DotIndicator value;
} Opt_DotIndicator;
typedef struct Ark_DragPreviewOptions {
    /* kind: Interface */
    Opt_Union_DragPreviewMode_Array_DragPreviewMode mode;
    Opt_CustomObject modifier;
    Opt_Union_Boolean_Number numberBadge;
} Ark_DragPreviewOptions;
typedef struct Opt_DragPreviewOptions {
    Ark_Tag tag;
    Ark_DragPreviewOptions value;
} Opt_DragPreviewOptions;
typedef struct Ark_EdgeColors {
    /* kind: Interface */
    Opt_ResourceColor top;
    Opt_ResourceColor right;
    Opt_ResourceColor bottom;
    Opt_ResourceColor left;
} Ark_EdgeColors;
typedef struct Opt_EdgeColors {
    Ark_Tag tag;
    Ark_EdgeColors value;
} Opt_EdgeColors;
typedef struct Ark_EdgeOutlineWidths {
    /* kind: Interface */
    Opt_Dimension top;
    Opt_Dimension right;
    Opt_Dimension bottom;
    Opt_Dimension left;
} Ark_EdgeOutlineWidths;
typedef struct Opt_EdgeOutlineWidths {
    Ark_Tag tag;
    Ark_EdgeOutlineWidths value;
} Opt_EdgeOutlineWidths;
typedef struct Ark_Edges {
    /* kind: Interface */
    Opt_Dimension top;
    Opt_Dimension left;
    Opt_Dimension bottom;
    Opt_Dimension right;
} Ark_Edges;
typedef struct Opt_Edges {
    Ark_Tag tag;
    Ark_Edges value;
} Opt_Edges;
typedef struct Ark_EdgeWidths {
    /* kind: Interface */
    Opt_Length top;
    Opt_Length right;
    Opt_Length bottom;
    Opt_Length left;
} Ark_EdgeWidths;
typedef struct Opt_EdgeWidths {
    Ark_Tag tag;
    Ark_EdgeWidths value;
} Opt_EdgeWidths;
typedef struct Ark_FlexOptions {
    /* kind: Interface */
    Opt_FlexDirection direction;
    Opt_FlexWrap wrap;
    Opt_FlexAlign justifyContent;
    Opt_ItemAlign alignItems;
    Opt_FlexAlign alignContent;
    Opt_FlexSpaceOptions space;
} Ark_FlexOptions;
typedef struct Opt_FlexOptions {
    Ark_Tag tag;
    Ark_FlexOptions value;
} Opt_FlexOptions;
typedef struct Ark_Font {
    /* kind: Interface */
    Opt_Length size;
    Opt_Union_FontWeight_Number_String weight;
    Opt_Union_String_Resource family;
    Opt_FontStyle style;
} Ark_Font;
typedef struct Opt_Font {
    Ark_Tag tag;
    Ark_Font value;
} Opt_Font;
typedef struct Ark_ForegroundBlurStyleOptions {
    /* kind: Interface */
    Opt_ThemeColorMode colorMode;
    Opt_AdaptiveColor adaptiveColor;
    Opt_Number scale;
    Opt_BlurOptions blurOptions;
} Ark_ForegroundBlurStyleOptions;
typedef struct Opt_ForegroundBlurStyleOptions {
    Ark_Tag tag;
    Ark_ForegroundBlurStyleOptions value;
} Opt_ForegroundBlurStyleOptions;
typedef struct Ark_HistoricalPoint {
    /* kind: Interface */
    Ark_TouchObject touchObject;
    Ark_Number size;
    Ark_Number force;
    Ark_Int64 timestamp;
} Ark_HistoricalPoint;
typedef struct Opt_HistoricalPoint {
    Ark_Tag tag;
    Ark_HistoricalPoint value;
} Opt_HistoricalPoint;
typedef struct Ark_IconOptions {
    /* kind: Interface */
    Opt_Length size;
    Opt_ResourceColor color;
    Opt_ResourceStr src;
} Ark_IconOptions;
typedef struct Opt_IconOptions {
    Ark_Tag tag;
    Ark_IconOptions value;
} Opt_IconOptions;
typedef struct Ark_IndicatorStyle {
    /* kind: Interface */
    Opt_Length height;
    Opt_Length width;
    Opt_Length borderRadius;
    Opt_Length marginTop;
    Opt_ResourceColor color;
    Opt_ResourceColor selectedColor;
    Opt_Length left;
    Opt_Length top;
    Opt_Length right;
    Opt_Length bottom;
    Opt_Length size;
    Opt_Boolean mask;
} Ark_IndicatorStyle;
typedef struct Opt_IndicatorStyle {
    Ark_Tag tag;
    Ark_IndicatorStyle value;
} Opt_IndicatorStyle;
typedef struct Opt_Layoutable {
    Ark_Tag tag;
    Ark_Layoutable value;
} Opt_Layoutable;
typedef struct Ark_LeadingMarginPlaceholder {
    /* kind: Interface */
    Ark_PixelMap pixelMap;
    Ark_Tuple_Dimension_Dimension size;
} Ark_LeadingMarginPlaceholder;
typedef struct Opt_LeadingMarginPlaceholder {
    Ark_Tag tag;
    Ark_LeadingMarginPlaceholder value;
} Opt_LeadingMarginPlaceholder;
typedef struct Ark_LightSource {
    /* kind: Interface */
    Ark_Dimension positionX;
    Ark_Dimension positionY;
    Ark_Dimension positionZ;
    Ark_Number intensity;
    Opt_ResourceColor color;
} Ark_LightSource;
typedef struct Opt_LightSource {
    Ark_Tag tag;
    Ark_LightSource value;
} Opt_LightSource;
typedef struct Ark_ListDividerOptions {
    /* kind: Interface */
    Ark_Length strokeWidth;
    Opt_ResourceColor color;
    Opt_Length startMargin;
    Opt_Length endMargin;
} Ark_ListDividerOptions;
typedef struct Opt_ListDividerOptions {
    Ark_Tag tag;
    Ark_ListDividerOptions value;
} Opt_ListDividerOptions;
typedef struct Ark_Literal_ResourceColor_color {
    /* kind: Interface */
    Ark_ResourceColor color;
} Ark_Literal_ResourceColor_color;
typedef struct Opt_Literal_ResourceColor_color {
    Ark_Tag tag;
    Ark_Literal_ResourceColor_color value;
} Opt_Literal_ResourceColor_color;
typedef struct Ark_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs {
    /* kind: Interface */
    Opt_Union_Number_Literal_Number_offset_span xs;
    Opt_Union_Number_Literal_Number_offset_span sm;
    Opt_Union_Number_Literal_Number_offset_span md;
    Opt_Union_Number_Literal_Number_offset_span lg;
} Ark_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs;
typedef struct Opt_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs {
    Ark_Tag tag;
    Ark_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs value;
} Opt_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs;
typedef struct Ark_LocalizedAlignRuleOptions {
    /* kind: Interface */
    Opt_LocalizedHorizontalAlignParam start;
    Opt_LocalizedHorizontalAlignParam end;
    Opt_LocalizedHorizontalAlignParam middle;
    Opt_LocalizedVerticalAlignParam top;
    Opt_LocalizedVerticalAlignParam bottom;
    Opt_LocalizedVerticalAlignParam center;
    Opt_Bias bias;
} Ark_LocalizedAlignRuleOptions;
typedef struct Opt_LocalizedAlignRuleOptions {
    Ark_Tag tag;
    Ark_LocalizedAlignRuleOptions value;
} Opt_LocalizedAlignRuleOptions;
typedef struct Ark_LocalizedEdgeColors {
    /* kind: Interface */
    Opt_ResourceColor top;
    Opt_ResourceColor end;
    Opt_ResourceColor bottom;
    Opt_ResourceColor start;
} Ark_LocalizedEdgeColors;
typedef struct Opt_LocalizedEdgeColors {
    Ark_Tag tag;
    Ark_LocalizedEdgeColors value;
} Opt_LocalizedEdgeColors;
typedef struct Ark_MenuElement {
    /* kind: Interface */
    Ark_ResourceStr value;
    Opt_ResourceStr icon;
    Opt_CustomObject symbolIcon;
    Opt_Boolean enabled;
    Callback_Void action;
} Ark_MenuElement;
typedef struct Opt_MenuElement {
    Ark_Tag tag;
    Ark_MenuElement value;
} Opt_MenuElement;
typedef struct Ark_NativeEmbedDataInfo {
    /* kind: Interface */
    Opt_NativeEmbedInfo info;
} Ark_NativeEmbedDataInfo;
typedef struct Opt_NativeEmbedDataInfo {
    Ark_Tag tag;
    Ark_NativeEmbedDataInfo value;
} Opt_NativeEmbedDataInfo;
typedef struct Opt_NavDestinationContext {
    Ark_Tag tag;
    Ark_NavDestinationContext value;
} Opt_NavDestinationContext;
typedef struct Ark_NavDestinationCustomTitle {
    /* kind: Interface */
    CustomNodeBuilder builder;
    Ark_Union_TitleHeight_Length height;
} Ark_NavDestinationCustomTitle;
typedef struct Opt_NavDestinationCustomTitle {
    Ark_Tag tag;
    Ark_NavDestinationCustomTitle value;
} Opt_NavDestinationCustomTitle;
typedef struct Ark_NavigationCustomTitle {
    /* kind: Interface */
    CustomNodeBuilder builder;
    Ark_Union_TitleHeight_Length height;
} Ark_NavigationCustomTitle;
typedef struct Opt_NavigationCustomTitle {
    Ark_Tag tag;
    Ark_NavigationCustomTitle value;
} Opt_NavigationCustomTitle;
typedef struct Ark_NavigationTitleOptions {
    /* kind: Interface */
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_BarStyle barStyle;
    Opt_CustomObject paddingStart;
    Opt_CustomObject paddingEnd;
} Ark_NavigationTitleOptions;
typedef struct Opt_NavigationTitleOptions {
    Ark_Tag tag;
    Ark_NavigationTitleOptions value;
} Opt_NavigationTitleOptions;
typedef struct Ark_NavigationToolbarOptions {
    /* kind: Interface */
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
} Ark_NavigationToolbarOptions;
typedef struct Opt_NavigationToolbarOptions {
    Ark_Tag tag;
    Ark_NavigationToolbarOptions value;
} Opt_NavigationToolbarOptions;
typedef struct Ark_OffsetOptions {
    /* kind: Interface */
    Opt_Dimension xOffset;
    Opt_Dimension yOffset;
} Ark_OffsetOptions;
typedef struct Opt_OffsetOptions {
    Ark_Tag tag;
    Ark_OffsetOptions value;
} Opt_OffsetOptions;
typedef struct Ark_OptionInterfaceDTS {
    /* kind: Interface */
    Ark_Tuple_Boolean_Number tuple;
} Ark_OptionInterfaceDTS;
typedef struct Opt_OptionInterfaceDTS {
    Ark_Tag tag;
    Ark_OptionInterfaceDTS value;
} Opt_OptionInterfaceDTS;
typedef struct Ark_OutlineRadiuses {
    /* kind: Interface */
    Opt_Dimension topLeft;
    Opt_Dimension topRight;
    Opt_Dimension bottomLeft;
    Opt_Dimension bottomRight;
} Ark_OutlineRadiuses;
typedef struct Opt_OutlineRadiuses {
    Ark_Tag tag;
    Ark_OutlineRadiuses value;
} Opt_OutlineRadiuses;
typedef struct Ark_OverlayOptions {
    /* kind: Interface */
    Opt_Alignment align;
    Opt_OverlayOffset offset;
} Ark_OverlayOptions;
typedef struct Opt_OverlayOptions {
    Ark_Tag tag;
    Ark_OverlayOptions value;
} Opt_OverlayOptions;
typedef struct Ark_Padding {
    /* kind: Interface */
    Opt_Length top;
    Opt_Length right;
    Opt_Length bottom;
    Opt_Length left;
} Ark_Padding;
typedef struct Opt_Padding {
    Ark_Tag tag;
    Ark_Padding value;
} Opt_Padding;
typedef struct Ark_PixelStretchEffectOptions {
    /* kind: Interface */
    Opt_Length top;
    Opt_Length bottom;
    Opt_Length left;
    Opt_Length right;
} Ark_PixelStretchEffectOptions;
typedef struct Opt_PixelStretchEffectOptions {
    Ark_Tag tag;
    Ark_PixelStretchEffectOptions value;
} Opt_PixelStretchEffectOptions;
typedef struct Ark_Position {
    /* kind: Interface */
    Opt_Length x;
    Opt_Length y;
} Ark_Position;
typedef struct Opt_Position {
    Ark_Tag tag;
    Ark_Position value;
} Opt_Position;
typedef struct Ark_Rectangle {
    /* kind: Interface */
    Opt_Length x;
    Opt_Length y;
    Opt_Length width;
    Opt_Length height;
} Ark_Rectangle;
typedef struct Opt_Rectangle {
    Ark_Tag tag;
    Ark_Rectangle value;
} Opt_Rectangle;
typedef struct Ark_RectOptions {
    /* kind: Interface */
    Opt_Union_Number_String width;
    Opt_Union_Number_String height;
    Opt_Union_Number_String_Array_Union_Number_String radius;
} Ark_RectOptions;
typedef struct Opt_RectOptions {
    Ark_Tag tag;
    Ark_RectOptions value;
} Opt_RectOptions;
typedef struct Opt_RestrictedWorker {
    Ark_Tag tag;
    Ark_RestrictedWorker value;
} Opt_RestrictedWorker;
typedef struct Ark_RichEditorChangeValue {
    /* kind: Interface */
    Ark_TextRange rangeBefore;
    Array_RichEditorTextSpanResult replacedSpans;
    Array_RichEditorImageSpanResult replacedImageSpans;
    Array_RichEditorTextSpanResult replacedSymbolSpans;
} Ark_RichEditorChangeValue;
typedef struct Opt_RichEditorChangeValue {
    Ark_Tag tag;
    Ark_RichEditorChangeValue value;
} Opt_RichEditorChangeValue;
typedef struct Ark_RichEditorSymbolSpanOptions {
    /* kind: Interface */
    Opt_Number offset;
    Opt_RichEditorSymbolSpanStyle style;
} Ark_RichEditorSymbolSpanOptions;
typedef struct Opt_RichEditorSymbolSpanOptions {
    Ark_Tag tag;
    Ark_RichEditorSymbolSpanOptions value;
} Opt_RichEditorSymbolSpanOptions;
typedef struct Ark_RichEditorTextStyleResult {
    /* kind: Interface */
    Ark_ResourceColor fontColor;
    Ark_Number fontSize;
    Ark_FontStyle fontStyle;
    Ark_Number fontWeight;
    Ark_String fontFamily;
    Ark_DecorationStyleResult decoration;
    Opt_Array_ShadowOptions textShadow;
    Opt_Number letterSpacing;
    Opt_Number lineHeight;
    Opt_String fontFeature;
} Ark_RichEditorTextStyleResult;
typedef struct Opt_RichEditorTextStyleResult {
    Ark_Tag tag;
    Ark_RichEditorTextStyleResult value;
} Opt_RichEditorTextStyleResult;
typedef struct Ark_ScrollOptions {
    /* kind: Interface */
    Ark_Union_Number_String xOffset;
    Ark_Union_Number_String yOffset;
    Opt_Union_ScrollAnimationOptions_Boolean animation;
} Ark_ScrollOptions;
typedef struct Opt_ScrollOptions {
    Ark_Tag tag;
    Ark_ScrollOptions value;
} Opt_ScrollOptions;
typedef struct Ark_ScrollSnapOptions {
    /* kind: Interface */
    Ark_ScrollSnapAlign snapAlign;
    Opt_Union_Dimension_Array_Dimension snapPagination;
    Opt_Boolean enableSnapToStart;
    Opt_Boolean enableSnapToEnd;
} Ark_ScrollSnapOptions;
typedef struct Opt_ScrollSnapOptions {
    Ark_Tag tag;
    Ark_ScrollSnapOptions value;
} Opt_ScrollSnapOptions;
typedef struct Ark_SearchButtonOptions {
    /* kind: Interface */
    Opt_Length fontSize;
    Opt_ResourceColor fontColor;
    Opt_Boolean autoDisable;
} Ark_SearchButtonOptions;
typedef struct Opt_SearchButtonOptions {
    Ark_Tag tag;
    Ark_SearchButtonOptions value;
} Opt_SearchButtonOptions;
typedef struct Ark_SearchOptions {
    /* kind: Interface */
    Opt_String value;
    Opt_ResourceStr placeholder;
    Opt_String icon;
    Opt_SearchController controller;
} Ark_SearchOptions;
typedef struct Opt_SearchOptions {
    Ark_Tag tag;
    Ark_SearchOptions value;
} Opt_SearchOptions;
typedef struct Ark_SelectOption {
    /* kind: Interface */
    Ark_ResourceStr value;
    Opt_ResourceStr icon;
    Opt_CustomObject symbolIcon;
} Ark_SelectOption;
typedef struct Opt_SelectOption {
    Ark_Tag tag;
    Ark_SelectOption value;
} Opt_SelectOption;
typedef struct Ark_sharedTransitionOptions {
    /* kind: Interface */
    Opt_Number duration;
    Opt_Union_Curve_String_ICurve curve;
    Opt_Number delay;
    Opt_MotionPathOptions motionPath;
    Opt_Number zIndex;
    Opt_SharedTransitionEffectType type;
} Ark_sharedTransitionOptions;
typedef struct Opt_sharedTransitionOptions {
    Ark_Tag tag;
    Ark_sharedTransitionOptions value;
} Opt_sharedTransitionOptions;
typedef struct Ark_SheetTitleOptions {
    /* kind: Interface */
    Ark_ResourceStr title;
    Opt_ResourceStr subtitle;
} Ark_SheetTitleOptions;
typedef struct Opt_SheetTitleOptions {
    Ark_Tag tag;
    Ark_SheetTitleOptions value;
} Opt_SheetTitleOptions;
typedef struct Ark_SizeOptions {
    /* kind: Interface */
    Opt_Length width;
    Opt_Length height;
} Ark_SizeOptions;
typedef struct Opt_SizeOptions {
    Ark_Tag tag;
    Ark_SizeOptions value;
} Opt_SizeOptions;
typedef struct Ark_StyledStringChangeValue {
    /* kind: Interface */
    Ark_TextRange range;
    Ark_StyledString replacementString;
    Opt_StyledString previewText;
} Ark_StyledStringChangeValue;
typedef struct Opt_StyledStringChangeValue {
    Ark_Tag tag;
    Ark_StyledStringChangeValue value;
} Opt_StyledStringChangeValue;
typedef struct Ark_SwipeActionItem {
    /* kind: Interface */
    Opt_CustomNodeBuilder builder;
    Opt_Length actionAreaDistance;
    Opt_Callback_Void onAction;
    Opt_Callback_Void onEnterActionArea;
    Opt_Callback_Void onExitActionArea;
    Opt_Callback_SwipeActionState_Void onStateChange;
} Ark_SwipeActionItem;
typedef struct Opt_SwipeActionItem {
    Ark_Tag tag;
    Ark_SwipeActionItem value;
} Opt_SwipeActionItem;
typedef struct Ark_TabBarIconStyle {
    /* kind: Interface */
    Opt_ResourceColor selectedColor;
    Opt_ResourceColor unselectedColor;
} Ark_TabBarIconStyle;
typedef struct Opt_TabBarIconStyle {
    Ark_Tag tag;
    Ark_TabBarIconStyle value;
} Opt_TabBarIconStyle;
typedef struct Ark_TextDecorationOptions {
    /* kind: Interface */
    Ark_TextDecorationType type;
    Opt_ResourceColor color;
    Opt_TextDecorationStyle style;
} Ark_TextDecorationOptions;
typedef struct Opt_TextDecorationOptions {
    Ark_Tag tag;
    Ark_TextDecorationOptions value;
} Opt_TextDecorationOptions;
typedef struct Ark_TextInputOptions {
    /* kind: Interface */
    Opt_ResourceStr placeholder;
    Opt_ResourceStr text;
    Opt_TextInputController controller;
} Ark_TextInputOptions;
typedef struct Opt_TextInputOptions {
    Ark_Tag tag;
    Ark_TextInputOptions value;
} Opt_TextInputOptions;
typedef struct Ark_TextMenuItem {
    /* kind: Interface */
    Ark_ResourceStr content;
    Opt_ResourceStr icon;
    Ark_TextMenuItemId id;
} Ark_TextMenuItem;
typedef struct Opt_TextMenuItem {
    Ark_Tag tag;
    Ark_TextMenuItem value;
} Opt_TextMenuItem;
typedef struct Ark_TextPickerOptions {
    /* kind: Interface */
    Ark_Type_TextPickerOptions_range range;
    Opt_Union_String_Array_String value;
    Opt_Union_Number_Array_Number selected;
} Ark_TextPickerOptions;
typedef struct Opt_TextPickerOptions {
    Ark_Tag tag;
    Ark_TextPickerOptions value;
} Opt_TextPickerOptions;
typedef struct Ark_TextPickerResult {
    /* kind: Interface */
    Ark_Union_String_Array_String value;
    Ark_Union_Number_Array_Number index;
} Ark_TextPickerResult;
typedef struct Opt_TextPickerResult {
    Ark_Tag tag;
    Ark_TextPickerResult value;
} Opt_TextPickerResult;
typedef struct Opt_TextStyle_styled_string {
    Ark_Tag tag;
    Ark_TextStyle_styled_string value;
} Opt_TextStyle_styled_string;
typedef struct Ark_TextStyleInterface {
    /* kind: Interface */
    Opt_ResourceColor fontColor;
    Opt_ResourceStr fontFamily;
    Opt_CustomObject fontSize;
    Opt_Union_Number_FontWeight_String fontWeight;
    Opt_FontStyle fontStyle;
} Ark_TextStyleInterface;
typedef struct Opt_TextStyleInterface {
    Ark_Tag tag;
    Ark_TextStyleInterface value;
} Opt_TextStyleInterface;
typedef struct Ark_ToolbarItem {
    /* kind: Interface */
    Ark_ResourceStr value;
    Opt_ResourceStr icon;
    Opt_CustomObject symbolIcon;
    Opt_Callback_Void action;
    Opt_ToolbarItemStatus status;
    Opt_ResourceStr activeIcon;
    Opt_CustomObject activeSymbolIcon;
} Ark_ToolbarItem;
typedef struct Opt_ToolbarItem {
    Ark_Tag tag;
    Ark_ToolbarItem value;
} Opt_ToolbarItem;
typedef struct Ark_TransitionEffects {
    /* kind: Interface */
    Ark_Undefined identity;
    Ark_Number opacity;
    Ark_Undefined slideSwitch;
    Ark_TransitionEdge move;
    Ark_TranslateOptions translate;
    Ark_RotateOptions rotate;
    Ark_ScaleOptions scale;
    Ark_Literal_TransitionEffect_appear_disappear asymmetric;
} Ark_TransitionEffects;
typedef struct Opt_TransitionEffects {
    Ark_Tag tag;
    Ark_TransitionEffects value;
} Opt_TransitionEffects;
typedef struct Ark_TransitionOptions {
    /* kind: Interface */
    Opt_TransitionType type;
    Opt_Number opacity;
    Opt_TranslateOptions translate;
    Opt_ScaleOptions scale;
    Opt_RotateOptions rotate;
} Ark_TransitionOptions;
typedef struct Opt_TransitionOptions {
    Ark_Tag tag;
    Ark_TransitionOptions value;
} Opt_TransitionOptions;
typedef struct Ark_Type_NavDestinationAttribute_title_value {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        CustomNodeBuilder value1;
        Ark_NavDestinationCommonTitle value2;
        Ark_NavDestinationCustomTitle value3;
    };
} Ark_Type_NavDestinationAttribute_title_value;
typedef struct Opt_Type_NavDestinationAttribute_title_value {
    Ark_Tag tag;
    Ark_Type_NavDestinationAttribute_title_value value;
} Opt_Type_NavDestinationAttribute_title_value;
typedef struct Ark_Type_NavigationAttribute_title_value {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceStr value0;
        CustomNodeBuilder value1;
        Ark_NavigationCommonTitle value2;
        Ark_NavigationCustomTitle value3;
    };
} Ark_Type_NavigationAttribute_title_value;
typedef struct Opt_Type_NavigationAttribute_title_value {
    Ark_Tag tag;
    Ark_Type_NavigationAttribute_title_value value;
} Opt_Type_NavigationAttribute_title_value;
typedef struct Ark_Type_SheetOptions_detents {
    /* kind: Interface */
    Ark_Union_SheetSize_Length value0;
    Opt_Union_SheetSize_Length value1;
    Opt_Union_SheetSize_Length value2;
} Ark_Type_SheetOptions_detents;
typedef struct Opt_Type_SheetOptions_detents {
    Ark_Tag tag;
    Ark_Type_SheetOptions_detents value;
} Opt_Type_SheetOptions_detents;
typedef struct Ark_UnderlineColor {
    /* kind: Interface */
    Opt_ResourceColor typing;
    Opt_ResourceColor normal;
    Opt_ResourceColor error;
    Opt_ResourceColor disable;
} Ark_UnderlineColor;
typedef struct Opt_UnderlineColor {
    Ark_Tag tag;
    Ark_UnderlineColor value;
} Opt_UnderlineColor;
typedef struct Ark_Union_Array_Rectangle_Rectangle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Array_Rectangle value0;
        Ark_Rectangle value1;
    };
} Ark_Union_Array_Rectangle_Rectangle;
typedef struct Opt_Union_Array_Rectangle_Rectangle {
    Ark_Tag tag;
    Ark_Union_Array_Rectangle_Rectangle value;
} Opt_Union_Array_Rectangle_Rectangle;
typedef struct Ark_Union_ArrowStyle_Boolean {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ArrowStyle value0;
        Ark_Boolean value1;
    };
} Ark_Union_ArrowStyle_Boolean;
typedef struct Opt_Union_ArrowStyle_Boolean {
    Ark_Tag tag;
    Ark_Union_ArrowStyle_Boolean value;
} Opt_Union_ArrowStyle_Boolean;
typedef struct Ark_Union_Boolean_Literal_ResourceColor_color {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Boolean value0;
        Ark_Literal_ResourceColor_color value1;
    };
} Ark_Union_Boolean_Literal_ResourceColor_color;
typedef struct Opt_Union_Boolean_Literal_ResourceColor_color {
    Ark_Tag tag;
    Ark_Union_Boolean_Literal_ResourceColor_color value;
} Opt_Union_Boolean_Literal_ResourceColor_color;
typedef struct Ark_Union_BorderRadiuses_Length_LocalizedBorderRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_BorderRadiuses value0;
        Ark_Length value1;
        Ark_LocalizedBorderRadiuses value2;
    };
} Ark_Union_BorderRadiuses_Length_LocalizedBorderRadiuses;
typedef struct Opt_Union_BorderRadiuses_Length_LocalizedBorderRadiuses {
    Ark_Tag tag;
    Ark_Union_BorderRadiuses_Length_LocalizedBorderRadiuses value;
} Opt_Union_BorderRadiuses_Length_LocalizedBorderRadiuses;
typedef struct Ark_Union_CustomBuilder_SwipeActionItem {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        CustomNodeBuilder value0;
        Ark_SwipeActionItem value1;
    };
} Ark_Union_CustomBuilder_SwipeActionItem;
typedef struct Opt_Union_CustomBuilder_SwipeActionItem {
    Ark_Tag tag;
    Ark_Union_CustomBuilder_SwipeActionItem value;
} Opt_Union_CustomBuilder_SwipeActionItem;
typedef struct Ark_Union_Dimension_BorderRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_BorderRadiuses value1;
    };
} Ark_Union_Dimension_BorderRadiuses;
typedef struct Opt_Union_Dimension_BorderRadiuses {
    Ark_Tag tag;
    Ark_Union_Dimension_BorderRadiuses value;
} Opt_Union_Dimension_BorderRadiuses;
typedef struct Ark_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_BorderRadiuses value1;
        Ark_LocalizedBorderRadiuses value2;
    };
} Ark_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses {
    Ark_Tag tag;
    Ark_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses value;
} Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Ark_Union_Dimension_EdgeOutlineWidths {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_EdgeOutlineWidths value1;
    };
} Ark_Union_Dimension_EdgeOutlineWidths;
typedef struct Opt_Union_Dimension_EdgeOutlineWidths {
    Ark_Tag tag;
    Ark_Union_Dimension_EdgeOutlineWidths value;
} Opt_Union_Dimension_EdgeOutlineWidths;
typedef struct Ark_Union_Dimension_EdgeWidths_LocalizedEdgeWidths {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_EdgeWidths value1;
        Ark_LocalizedEdgeWidths value2;
    };
} Ark_Union_Dimension_EdgeWidths_LocalizedEdgeWidths;
typedef struct Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths {
    Ark_Tag tag;
    Ark_Union_Dimension_EdgeWidths_LocalizedEdgeWidths value;
} Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths;
typedef struct Ark_Union_Dimension_LeadingMarginPlaceholder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_LeadingMarginPlaceholder value1;
    };
} Ark_Union_Dimension_LeadingMarginPlaceholder;
typedef struct Opt_Union_Dimension_LeadingMarginPlaceholder {
    Ark_Tag tag;
    Ark_Union_Dimension_LeadingMarginPlaceholder value;
} Opt_Union_Dimension_LeadingMarginPlaceholder;
typedef struct Ark_Union_Dimension_Margin {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_Padding value1;
    };
} Ark_Union_Dimension_Margin;
typedef struct Opt_Union_Dimension_Margin {
    Ark_Tag tag;
    Ark_Union_Dimension_Margin value;
} Opt_Union_Dimension_Margin;
typedef struct Ark_Union_Dimension_OutlineRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Dimension value0;
        Ark_OutlineRadiuses value1;
    };
} Ark_Union_Dimension_OutlineRadiuses;
typedef struct Opt_Union_Dimension_OutlineRadiuses {
    Ark_Tag tag;
    Ark_Union_Dimension_OutlineRadiuses value;
} Opt_Union_Dimension_OutlineRadiuses;
typedef struct Ark_Union_EdgeColors_ResourceColor_LocalizedEdgeColors {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_EdgeColors value0;
        Ark_ResourceColor value1;
        Ark_LocalizedEdgeColors value2;
    };
} Ark_Union_EdgeColors_ResourceColor_LocalizedEdgeColors;
typedef struct Opt_Union_EdgeColors_ResourceColor_LocalizedEdgeColors {
    Ark_Tag tag;
    Ark_Union_EdgeColors_ResourceColor_LocalizedEdgeColors value;
} Opt_Union_EdgeColors_ResourceColor_LocalizedEdgeColors;
typedef struct Ark_Union_EdgeOutlineWidths_Dimension {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_EdgeOutlineWidths value0;
        Ark_Dimension value1;
    };
} Ark_Union_EdgeOutlineWidths_Dimension;
typedef struct Opt_Union_EdgeOutlineWidths_Dimension {
    Ark_Tag tag;
    Ark_Union_EdgeOutlineWidths_Dimension value;
} Opt_Union_EdgeOutlineWidths_Dimension;
typedef struct Ark_Union_EdgeWidths_Length_LocalizedEdgeWidths {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_EdgeWidths value0;
        Ark_Length value1;
        Ark_LocalizedEdgeWidths value2;
    };
} Ark_Union_EdgeWidths_Length_LocalizedEdgeWidths;
typedef struct Opt_Union_EdgeWidths_Length_LocalizedEdgeWidths {
    Ark_Tag tag;
    Ark_Union_EdgeWidths_Length_LocalizedEdgeWidths value;
} Opt_Union_EdgeWidths_Length_LocalizedEdgeWidths;
typedef struct Ark_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_EdgeWidths value0;
        Ark_CustomObject value1;
        Ark_LocalizedEdgeWidths value2;
    };
} Ark_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths;
typedef struct Opt_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths {
    Ark_Tag tag;
    Ark_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths value;
} Opt_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths;
typedef struct Ark_Union_IconOptions_SymbolGlyphModifier {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_IconOptions value0;
        Ark_CustomObject value1;
    };
} Ark_Union_IconOptions_SymbolGlyphModifier;
typedef struct Opt_Union_IconOptions_SymbolGlyphModifier {
    Ark_Tag tag;
    Ark_Union_IconOptions_SymbolGlyphModifier value;
} Opt_Union_IconOptions_SymbolGlyphModifier;
typedef struct Ark_Union_Length_BorderRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Length value0;
        Ark_BorderRadiuses value1;
    };
} Ark_Union_Length_BorderRadiuses;
typedef struct Opt_Union_Length_BorderRadiuses {
    Ark_Tag tag;
    Ark_Union_Length_BorderRadiuses value;
} Opt_Union_Length_BorderRadiuses;
typedef struct Ark_Union_Length_BorderRadiuses_LocalizedBorderRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Length value0;
        Ark_BorderRadiuses value1;
        Ark_LocalizedBorderRadiuses value2;
    };
} Ark_Union_Length_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses {
    Ark_Tag tag;
    Ark_Union_Length_BorderRadiuses_LocalizedBorderRadiuses value;
} Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses;
typedef struct Ark_Union_Length_EdgeWidths_LocalizedEdgeWidths {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Length value0;
        Ark_EdgeWidths value1;
        Ark_LocalizedEdgeWidths value2;
    };
} Ark_Union_Length_EdgeWidths_LocalizedEdgeWidths;
typedef struct Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths {
    Ark_Tag tag;
    Ark_Union_Length_EdgeWidths_LocalizedEdgeWidths value;
} Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths;
typedef struct Ark_Union_LengthMetrics_BorderRadiuses {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CustomObject value0;
        Ark_BorderRadiuses value1;
    };
} Ark_Union_LengthMetrics_BorderRadiuses;
typedef struct Opt_Union_LengthMetrics_BorderRadiuses {
    Ark_Tag tag;
    Ark_Union_LengthMetrics_BorderRadiuses value;
} Opt_Union_LengthMetrics_BorderRadiuses;
typedef struct Ark_Union_LengthMetrics_LeadingMarginPlaceholder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CustomObject value0;
        Ark_LeadingMarginPlaceholder value1;
    };
} Ark_Union_LengthMetrics_LeadingMarginPlaceholder;
typedef struct Opt_Union_LengthMetrics_LeadingMarginPlaceholder {
    Ark_Tag tag;
    Ark_Union_LengthMetrics_LeadingMarginPlaceholder value;
} Opt_Union_LengthMetrics_LeadingMarginPlaceholder;
typedef struct Ark_Union_LengthMetrics_Margin {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CustomObject value0;
        Ark_Padding value1;
    };
} Ark_Union_LengthMetrics_Margin;
typedef struct Opt_Union_LengthMetrics_Margin {
    Ark_Tag tag;
    Ark_Union_LengthMetrics_Margin value;
} Opt_Union_LengthMetrics_Margin;
typedef struct Ark_Union_LengthMetrics_Padding {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CustomObject value0;
        Ark_Padding value1;
    };
} Ark_Union_LengthMetrics_Padding;
typedef struct Opt_Union_LengthMetrics_Padding {
    Ark_Tag tag;
    Ark_Union_LengthMetrics_Padding value;
} Opt_Union_LengthMetrics_Padding;
typedef struct Ark_Union_Margin_Length_LocalizedMargin {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Padding value0;
        Ark_Length value1;
        Ark_LocalizedPadding value2;
    };
} Ark_Union_Margin_Length_LocalizedMargin;
typedef struct Opt_Union_Margin_Length_LocalizedMargin {
    Ark_Tag tag;
    Ark_Union_Margin_Length_LocalizedMargin value;
} Opt_Union_Margin_Length_LocalizedMargin;
typedef struct Ark_Union_NavDestinationContext_NavBar {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_NavDestinationContext value0;
        Ark_String value1;
    };
} Ark_Union_NavDestinationContext_NavBar;
typedef struct Opt_Union_NavDestinationContext_NavBar {
    Ark_Tag tag;
    Ark_Union_NavDestinationContext_NavBar value;
} Opt_Union_NavDestinationContext_NavBar;
typedef struct Ark_Union_Number_LeadingMarginPlaceholder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Number value0;
        Ark_LeadingMarginPlaceholder value1;
    };
} Ark_Union_Number_LeadingMarginPlaceholder;
typedef struct Opt_Union_Number_LeadingMarginPlaceholder {
    Ark_Tag tag;
    Ark_Union_Number_LeadingMarginPlaceholder value;
} Opt_Union_Number_LeadingMarginPlaceholder;
typedef struct Ark_Union_OutlineRadiuses_Dimension {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_OutlineRadiuses value0;
        Ark_Dimension value1;
    };
} Ark_Union_OutlineRadiuses_Dimension;
typedef struct Opt_Union_OutlineRadiuses_Dimension {
    Ark_Tag tag;
    Ark_Union_OutlineRadiuses_Dimension value;
} Opt_Union_OutlineRadiuses_Dimension;
typedef struct Ark_Union_Padding_Dimension {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Padding value0;
        Ark_Dimension value1;
    };
} Ark_Union_Padding_Dimension;
typedef struct Opt_Union_Padding_Dimension {
    Ark_Tag tag;
    Ark_Union_Padding_Dimension value;
} Opt_Union_Padding_Dimension;
typedef struct Ark_Union_Padding_Dimension_LocalizedPadding {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Padding value0;
        Ark_Dimension value1;
        Ark_LocalizedPadding value2;
    };
} Ark_Union_Padding_Dimension_LocalizedPadding;
typedef struct Opt_Union_Padding_Dimension_LocalizedPadding {
    Ark_Tag tag;
    Ark_Union_Padding_Dimension_LocalizedPadding value;
} Opt_Union_Padding_Dimension_LocalizedPadding;
typedef struct Ark_Union_Padding_Length_LocalizedPadding {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Padding value0;
        Ark_Length value1;
        Ark_LocalizedPadding value2;
    };
} Ark_Union_Padding_Length_LocalizedPadding;
typedef struct Opt_Union_Padding_Length_LocalizedPadding {
    Ark_Tag tag;
    Ark_Union_Padding_Length_LocalizedPadding value;
} Opt_Union_Padding_Length_LocalizedPadding;
typedef struct Ark_Union_Padding_LengthMetrics_LocalizedPadding {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Padding value0;
        Ark_CustomObject value1;
        Ark_LocalizedPadding value2;
    };
} Ark_Union_Padding_LengthMetrics_LocalizedPadding;
typedef struct Opt_Union_Padding_LengthMetrics_LocalizedPadding {
    Ark_Tag tag;
    Ark_Union_Padding_LengthMetrics_LocalizedPadding value;
} Opt_Union_Padding_LengthMetrics_LocalizedPadding;
typedef struct Ark_Union_Position_Alignment {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Position value0;
        Ark_Alignment value1;
    };
} Ark_Union_Position_Alignment;
typedef struct Opt_Union_Position_Alignment {
    Ark_Tag tag;
    Ark_Union_Position_Alignment value;
} Opt_Union_Position_Alignment;
typedef struct Ark_Union_Position_Edges_LocalizedEdges {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Position value0;
        Ark_Edges value1;
        Ark_LocalizedEdges value2;
    };
} Ark_Union_Position_Edges_LocalizedEdges;
typedef struct Opt_Union_Position_Edges_LocalizedEdges {
    Ark_Tag tag;
    Ark_Union_Position_Edges_LocalizedEdges value;
} Opt_Union_Position_Edges_LocalizedEdges;
typedef struct Ark_Union_Position_LocalizedPosition {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Position value0;
        Ark_LocalizedPosition value1;
    };
} Ark_Union_Position_LocalizedPosition;
typedef struct Opt_Union_Position_LocalizedPosition {
    Ark_Tag tag;
    Ark_Union_Position_LocalizedPosition value;
} Opt_Union_Position_LocalizedPosition;
typedef struct Ark_Union_RectOptions_RoundedRectOptions {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_RectOptions value0;
        Ark_RoundedRectOptions value1;
    };
} Ark_Union_RectOptions_RoundedRectOptions;
typedef struct Opt_Union_RectOptions_RoundedRectOptions {
    Ark_Tag tag;
    Ark_Union_RectOptions_RoundedRectOptions value;
} Opt_Union_RectOptions_RoundedRectOptions;
typedef struct Ark_Union_ResourceColor_EdgeColors_LocalizedEdgeColors {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceColor value0;
        Ark_EdgeColors value1;
        Ark_LocalizedEdgeColors value2;
    };
} Ark_Union_ResourceColor_EdgeColors_LocalizedEdgeColors;
typedef struct Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors {
    Ark_Tag tag;
    Ark_Union_ResourceColor_EdgeColors_LocalizedEdgeColors value;
} Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors;
typedef struct Ark_Union_ResourceColor_UnderlineColor {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_ResourceColor value0;
        Ark_UnderlineColor value1;
    };
} Ark_Union_ResourceColor_UnderlineColor;
typedef struct Opt_Union_ResourceColor_UnderlineColor {
    Ark_Tag tag;
    Ark_Union_ResourceColor_UnderlineColor value;
} Opt_Union_ResourceColor_UnderlineColor;
typedef struct Ark_Union_SheetTitleOptions_CustomBuilder {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_SheetTitleOptions value0;
        CustomNodeBuilder value1;
    };
} Ark_Union_SheetTitleOptions_CustomBuilder;
typedef struct Opt_Union_SheetTitleOptions_CustomBuilder {
    Ark_Tag tag;
    Ark_Union_SheetTitleOptions_CustomBuilder value;
} Opt_Union_SheetTitleOptions_CustomBuilder;
typedef struct Ark_Union_SizeOptions_ImageSize {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_SizeOptions value0;
        Ark_ImageSize value1;
    };
} Ark_Union_SizeOptions_ImageSize;
typedef struct Opt_Union_SizeOptions_ImageSize {
    Ark_Tag tag;
    Ark_Union_SizeOptions_ImageSize value;
} Opt_Union_SizeOptions_ImageSize;
typedef struct Ark_Union_TransitionOptions_TransitionEffect {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_TransitionOptions value0;
        Ark_TransitionEffect value1;
    };
} Ark_Union_TransitionOptions_TransitionEffect;
typedef struct Opt_Union_TransitionOptions_TransitionEffect {
    Ark_Tag tag;
    Ark_Union_TransitionOptions_TransitionEffect value;
} Opt_Union_TransitionOptions_TransitionEffect;
typedef struct Ark_Union_Union_Padding_Dimension_LocalizedPadding {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_Union_Padding_Dimension value0;
        Ark_LocalizedPadding value1;
    };
} Ark_Union_Union_Padding_Dimension_LocalizedPadding;
typedef struct Opt_Union_Union_Padding_Dimension_LocalizedPadding {
    Ark_Tag tag;
    Ark_Union_Union_Padding_Dimension_LocalizedPadding value;
} Opt_Union_Union_Padding_Dimension_LocalizedPadding;
typedef struct Ark_AlertDialogParamWithButtons {
    /* kind: Interface */
    Opt_ResourceStr title;
    Opt_ResourceStr subtitle;
    Ark_ResourceStr message;
    Opt_Boolean autoCancel;
    Opt_VoidCallback cancel;
    Opt_DialogAlignment alignment;
    Opt_Offset offset;
    Opt_Number gridCount;
    Opt_Rectangle maskRect;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_Callback_DismissDialogAction_Void onWillDismiss;
    Opt_TransitionEffect transition;
    Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses cornerRadius;
    Opt_Dimension width;
    Opt_Dimension height;
    Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths borderWidth;
    Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors borderColor;
    Opt_Union_BorderStyle_EdgeStyles borderStyle;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_TextStyle_alert_dialog textStyle;
    Opt_Boolean enableHoverMode;
    Opt_HoverModeAreaType hoverModeArea;
    Ark_AlertDialogButtonBaseOptions primaryButton;
    Ark_AlertDialogButtonBaseOptions secondaryButton;
} Ark_AlertDialogParamWithButtons;
typedef struct Opt_AlertDialogParamWithButtons {
    Ark_Tag tag;
    Ark_AlertDialogParamWithButtons value;
} Opt_AlertDialogParamWithButtons;
typedef struct Ark_AlertDialogParamWithConfirm {
    /* kind: Interface */
    Opt_ResourceStr title;
    Opt_ResourceStr subtitle;
    Ark_ResourceStr message;
    Opt_Boolean autoCancel;
    Opt_VoidCallback cancel;
    Opt_DialogAlignment alignment;
    Opt_Offset offset;
    Opt_Number gridCount;
    Opt_Rectangle maskRect;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_Callback_DismissDialogAction_Void onWillDismiss;
    Opt_TransitionEffect transition;
    Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses cornerRadius;
    Opt_Dimension width;
    Opt_Dimension height;
    Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths borderWidth;
    Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors borderColor;
    Opt_Union_BorderStyle_EdgeStyles borderStyle;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_TextStyle_alert_dialog textStyle;
    Opt_Boolean enableHoverMode;
    Opt_HoverModeAreaType hoverModeArea;
    Opt_AlertDialogButtonBaseOptions confirm;
} Ark_AlertDialogParamWithConfirm;
typedef struct Opt_AlertDialogParamWithConfirm {
    Ark_Tag tag;
    Ark_AlertDialogParamWithConfirm value;
} Opt_AlertDialogParamWithConfirm;
typedef struct Ark_AlertDialogParamWithOptions {
    /* kind: Interface */
    Opt_ResourceStr title;
    Opt_ResourceStr subtitle;
    Ark_ResourceStr message;
    Opt_Boolean autoCancel;
    Opt_VoidCallback cancel;
    Opt_DialogAlignment alignment;
    Opt_Offset offset;
    Opt_Number gridCount;
    Opt_Rectangle maskRect;
    Opt_Boolean showInSubWindow;
    Opt_Boolean isModal;
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_Callback_DismissDialogAction_Void onWillDismiss;
    Opt_TransitionEffect transition;
    Opt_Union_Dimension_BorderRadiuses_LocalizedBorderRadiuses cornerRadius;
    Opt_Dimension width;
    Opt_Dimension height;
    Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths borderWidth;
    Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors borderColor;
    Opt_Union_BorderStyle_EdgeStyles borderStyle;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_TextStyle_alert_dialog textStyle;
    Opt_Boolean enableHoverMode;
    Opt_HoverModeAreaType hoverModeArea;
    Array_AlertDialogButtonOptions buttons;
    Opt_DialogButtonDirection buttonDirection;
} Ark_AlertDialogParamWithOptions;
typedef struct Opt_AlertDialogParamWithOptions {
    Ark_Tag tag;
    Ark_AlertDialogParamWithOptions value;
} Opt_AlertDialogParamWithOptions;
typedef struct Ark_Area {
    /* kind: Interface */
    Ark_Length width;
    Ark_Length height;
    Ark_Position position;
    Ark_Position globalPosition;
} Ark_Area;
typedef struct Opt_Area {
    Ark_Tag tag;
    Ark_Area value;
} Opt_Area;
typedef struct Ark_BorderImageOption {
    /* kind: Interface */
    Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths slice;
    Opt_RepeatMode repeat;
    Opt_Union_String_Resource_LinearGradient_common source;
    Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths width;
    Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths outset;
    Opt_Boolean fill;
} Ark_BorderImageOption;
typedef struct Opt_BorderImageOption {
    Ark_Tag tag;
    Ark_BorderImageOption value;
} Opt_BorderImageOption;
typedef struct Ark_BorderOptions {
    /* kind: Interface */
    Opt_Union_EdgeWidths_Length_LocalizedEdgeWidths width;
    Opt_Union_EdgeColors_ResourceColor_LocalizedEdgeColors color;
    Opt_Union_BorderRadiuses_Length_LocalizedBorderRadiuses radius;
    Opt_Union_EdgeStyles_BorderStyle style;
    Opt_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths dashGap;
    Opt_Union_EdgeWidths_LengthMetrics_LocalizedEdgeWidths dashWidth;
} Ark_BorderOptions;
typedef struct Opt_BorderOptions {
    Ark_Tag tag;
    Ark_BorderOptions value;
} Opt_BorderOptions;
typedef struct Ark_ButtonLabelStyle {
    /* kind: Interface */
    Opt_TextOverflow overflow;
    Opt_Number maxLines;
    Opt_Union_Number_ResourceStr minFontSize;
    Opt_Union_Number_ResourceStr maxFontSize;
    Opt_TextHeightAdaptivePolicy heightAdaptivePolicy;
    Opt_Font font;
} Ark_ButtonLabelStyle;
typedef struct Opt_ButtonLabelStyle {
    Ark_Tag tag;
    Ark_ButtonLabelStyle value;
} Opt_ButtonLabelStyle;
typedef struct Ark_CancelButtonOptions {
    /* kind: Interface */
    Opt_CancelButtonStyle style;
    Opt_IconOptions icon;
} Ark_CancelButtonOptions;
typedef struct Opt_CancelButtonOptions {
    Ark_Tag tag;
    Ark_CancelButtonOptions value;
} Opt_CancelButtonOptions;
typedef struct Ark_ContextMenuOptions {
    /* kind: Interface */
    Opt_Position offset;
    Opt_Placement placement;
    Opt_Boolean enableArrow;
    Opt_Length arrowOffset;
    Opt_Union_MenuPreviewMode_CustomBuilder preview;
    Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses borderRadius;
    Opt_Callback_Void onAppear;
    Opt_Callback_Void onDisappear;
    Opt_Callback_Void aboutToAppear;
    Opt_Callback_Void aboutToDisappear;
    Opt_Padding layoutRegionMargin;
    Opt_ContextMenuAnimationOptions previewAnimationOptions;
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_TransitionEffect transition;
    Opt_Boolean enableHoverMode;
} Ark_ContextMenuOptions;
typedef struct Opt_ContextMenuOptions {
    Ark_Tag tag;
    Ark_ContextMenuOptions value;
} Opt_ContextMenuOptions;
typedef struct Ark_CustomPopupOptions {
    /* kind: Interface */
    CustomNodeBuilder builder;
    Opt_Placement placement;
    Opt_Union_Color_String_Resource_Number maskColor;
    Opt_Union_Color_String_Resource_Number popupColor;
    Opt_Boolean enableArrow;
    Opt_Boolean autoCancel;
    Opt_Callback_Literal_Boolean_isVisible_Void onStateChange;
    Opt_Length arrowOffset;
    Opt_Boolean showInSubWindow;
    Opt_Union_Boolean_Literal_ResourceColor_color mask;
    Opt_Length targetSpace;
    Opt_Position offset;
    Opt_Dimension width;
    Opt_ArrowPointPosition arrowPointPosition;
    Opt_Dimension arrowWidth;
    Opt_Dimension arrowHeight;
    Opt_Dimension radius;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_Boolean focusable;
    Opt_TransitionEffect transition;
    Opt_Union_Boolean_Callback_DismissPopupAction_Void onWillDismiss;
    Opt_Boolean enableHoverMode;
    Opt_Boolean followTransformOfTarget;
} Ark_CustomPopupOptions;
typedef struct Opt_CustomPopupOptions {
    Ark_Tag tag;
    Ark_CustomPopupOptions value;
} Opt_CustomPopupOptions;
typedef struct Ark_DigitIndicator {
    /* kind: Interface */
    Opt_Length _left;
    Opt_Length _top;
    Opt_Length _right;
    Opt_Length _bottom;
    Opt_CustomObject _start;
    Opt_CustomObject _end;
    Opt_ResourceColor _fontColor;
    Opt_ResourceColor _selectedFontColor;
    Opt_Font _digitFont;
    Opt_Font _selectedDigitFont;
} Ark_DigitIndicator;
typedef struct Opt_DigitIndicator {
    Ark_Tag tag;
    Ark_DigitIndicator value;
} Opt_DigitIndicator;
typedef struct Ark_EventTarget {
    /* kind: Interface */
    Ark_Area area;
} Ark_EventTarget;
typedef struct Opt_EventTarget {
    Ark_Tag tag;
    Ark_EventTarget value;
} Opt_EventTarget;
typedef struct Ark_GeometryInfo {
    /* kind: Interface */
    Ark_Number width;
    Ark_Number height;
    Ark_EdgeWidths borderWidth;
    Ark_Padding margin;
    Ark_Padding padding;
} Ark_GeometryInfo;
typedef struct Opt_GeometryInfo {
    Ark_Tag tag;
    Ark_GeometryInfo value;
} Opt_GeometryInfo;
typedef struct Opt_GestureEvent {
    Ark_Tag tag;
    Ark_GestureEvent value;
} Opt_GestureEvent;
typedef struct Opt_HoverEvent {
    Ark_Tag tag;
    Ark_HoverEvent value;
} Opt_HoverEvent;
typedef struct Ark_ImageAttachmentLayoutStyle {
    /* kind: Interface */
    Opt_Union_LengthMetrics_Margin margin;
    Opt_Union_LengthMetrics_Padding padding;
    Opt_Union_LengthMetrics_BorderRadiuses borderRadius;
} Ark_ImageAttachmentLayoutStyle;
typedef struct Opt_ImageAttachmentLayoutStyle {
    Ark_Tag tag;
    Ark_ImageAttachmentLayoutStyle value;
} Opt_ImageAttachmentLayoutStyle;
typedef struct Opt_LongPressGestureEvent {
    Ark_Tag tag;
    Ark_LongPressGestureEvent value;
} Opt_LongPressGestureEvent;
typedef struct Ark_MenuOptions {
    /* kind: Interface */
    Opt_Position offset;
    Opt_Placement placement;
    Opt_Boolean enableArrow;
    Opt_Length arrowOffset;
    Opt_Union_MenuPreviewMode_CustomBuilder preview;
    Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses borderRadius;
    Opt_Callback_Void onAppear;
    Opt_Callback_Void onDisappear;
    Opt_Callback_Void aboutToAppear;
    Opt_Callback_Void aboutToDisappear;
    Opt_Padding layoutRegionMargin;
    Opt_ContextMenuAnimationOptions previewAnimationOptions;
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_TransitionEffect transition;
    Opt_Boolean enableHoverMode;
    Opt_ResourceStr title;
    Opt_Boolean showInSubWindow;
} Ark_MenuOptions;
typedef struct Opt_MenuOptions {
    Ark_Tag tag;
    Ark_MenuOptions value;
} Opt_MenuOptions;
typedef struct Opt_MouseEvent {
    Ark_Tag tag;
    Ark_MouseEvent value;
} Opt_MouseEvent;
typedef struct Ark_OutlineOptions {
    /* kind: Interface */
    Opt_Union_EdgeOutlineWidths_Dimension width;
    Opt_Union_EdgeColors_ResourceColor_LocalizedEdgeColors color;
    Opt_Union_OutlineRadiuses_Dimension radius;
    Opt_Union_EdgeOutlineStyles_OutlineStyle style;
} Ark_OutlineOptions;
typedef struct Opt_OutlineOptions {
    Ark_Tag tag;
    Ark_OutlineOptions value;
} Opt_OutlineOptions;
typedef struct Opt_PanGestureEvent {
    Ark_Tag tag;
    Ark_PanGestureEvent value;
} Opt_PanGestureEvent;
typedef struct Opt_ParagraphStyle {
    Ark_Tag tag;
    Ark_ParagraphStyle value;
} Opt_ParagraphStyle;
typedef struct Ark_ParagraphStyleInterface {
    /* kind: Interface */
    Opt_TextAlign textAlign;
    Opt_CustomObject textIndent;
    Opt_Number maxLines;
    Opt_TextOverflow overflow;
    Opt_WordBreak wordBreak;
    Opt_Union_LengthMetrics_LeadingMarginPlaceholder leadingMargin;
} Ark_ParagraphStyleInterface;
typedef struct Opt_ParagraphStyleInterface {
    Ark_Tag tag;
    Ark_ParagraphStyleInterface value;
} Opt_ParagraphStyleInterface;
typedef struct Ark_PickerDialogButtonStyle {
    /* kind: Interface */
    Opt_ButtonType type;
    Opt_ButtonStyleMode style;
    Opt_ButtonRole role;
    Opt_Length fontSize;
    Opt_ResourceColor fontColor;
    Opt_Union_FontWeight_Number_String fontWeight;
    Opt_FontStyle fontStyle;
    Opt_Union_Resource_String fontFamily;
    Opt_ResourceColor backgroundColor;
    Opt_Union_Length_BorderRadiuses borderRadius;
    Opt_Boolean primary;
} Ark_PickerDialogButtonStyle;
typedef struct Opt_PickerDialogButtonStyle {
    Ark_Tag tag;
    Ark_PickerDialogButtonStyle value;
} Opt_PickerDialogButtonStyle;
typedef struct Ark_PickerTextStyle {
    /* kind: Interface */
    Opt_ResourceColor color;
    Opt_Font font;
} Ark_PickerTextStyle;
typedef struct Opt_PickerTextStyle {
    Ark_Tag tag;
    Ark_PickerTextStyle value;
} Opt_PickerTextStyle;
typedef struct Opt_PinchGestureEvent {
    Ark_Tag tag;
    Ark_PinchGestureEvent value;
} Opt_PinchGestureEvent;
typedef struct Ark_PlaceholderStyle {
    /* kind: Interface */
    Opt_Font font;
    Opt_ResourceColor fontColor;
} Ark_PlaceholderStyle;
typedef struct Opt_PlaceholderStyle {
    Ark_Tag tag;
    Ark_PlaceholderStyle value;
} Opt_PlaceholderStyle;
typedef struct Ark_PointLightStyle {
    /* kind: Interface */
    Opt_LightSource lightSource;
    Opt_IlluminatedType illuminated;
    Opt_Number bloom;
} Ark_PointLightStyle;
typedef struct Opt_PointLightStyle {
    Ark_Tag tag;
    Ark_PointLightStyle value;
} Opt_PointLightStyle;
typedef struct Ark_PopupMessageOptions {
    /* kind: Interface */
    Opt_ResourceColor textColor;
    Opt_Font font;
} Ark_PopupMessageOptions;
typedef struct Opt_PopupMessageOptions {
    Ark_Tag tag;
    Ark_PopupMessageOptions value;
} Opt_PopupMessageOptions;
typedef struct Ark_ResizableOptions {
    /* kind: Interface */
    Opt_EdgeWidths slice;
    Opt_DrawingLattice lattice;
} Ark_ResizableOptions;
typedef struct Opt_ResizableOptions {
    Ark_Tag tag;
    Ark_ResizableOptions value;
} Opt_ResizableOptions;
typedef struct Ark_RichEditorLayoutStyle {
    /* kind: Interface */
    Opt_Union_Dimension_Margin margin;
    Opt_Union_Dimension_BorderRadiuses borderRadius;
} Ark_RichEditorLayoutStyle;
typedef struct Opt_RichEditorLayoutStyle {
    Ark_Tag tag;
    Ark_RichEditorLayoutStyle value;
} Opt_RichEditorLayoutStyle;
typedef struct Ark_RichEditorParagraphStyle {
    /* kind: Interface */
    Opt_TextAlign textAlign;
    Opt_Union_Dimension_LeadingMarginPlaceholder leadingMargin;
    Opt_WordBreak wordBreak;
    Opt_LineBreakStrategy lineBreakStrategy;
} Ark_RichEditorParagraphStyle;
typedef struct Opt_RichEditorParagraphStyle {
    Ark_Tag tag;
    Ark_RichEditorParagraphStyle value;
} Opt_RichEditorParagraphStyle;
typedef struct Ark_RichEditorParagraphStyleOptions {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number end;
    Ark_RichEditorParagraphStyle style;
} Ark_RichEditorParagraphStyleOptions;
typedef struct Opt_RichEditorParagraphStyleOptions {
    Ark_Tag tag;
    Ark_RichEditorParagraphStyleOptions value;
} Opt_RichEditorParagraphStyleOptions;
typedef struct Ark_RichEditorTextStyle {
    /* kind: Interface */
    Opt_ResourceColor fontColor;
    Opt_Union_String_Number_Resource fontSize;
    Opt_FontStyle fontStyle;
    Opt_Union_Number_FontWeight_String fontWeight;
    Opt_ResourceStr fontFamily;
    Opt_DecorationStyleInterface decoration;
    Opt_Union_ShadowOptions_Array_ShadowOptions textShadow;
    Opt_Union_Number_String letterSpacing;
    Opt_Union_Number_String_Resource lineHeight;
    Opt_String fontFeature;
} Ark_RichEditorTextStyle;
typedef struct Opt_RichEditorTextStyle {
    Ark_Tag tag;
    Ark_RichEditorTextStyle value;
} Opt_RichEditorTextStyle;
typedef struct Ark_RichEditorUpdateTextSpanStyleOptions {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number end;
    Ark_RichEditorTextStyle textStyle;
} Ark_RichEditorUpdateTextSpanStyleOptions;
typedef struct Opt_RichEditorUpdateTextSpanStyleOptions {
    Ark_Tag tag;
    Ark_RichEditorUpdateTextSpanStyleOptions value;
} Opt_RichEditorUpdateTextSpanStyleOptions;
typedef struct Opt_RotationGestureEvent {
    Ark_Tag tag;
    Ark_RotationGestureEvent value;
} Opt_RotationGestureEvent;
typedef struct Ark_SheetOptions {
    /* kind: Interface */
    Opt_ResourceColor backgroundColor;
    Opt_Callback_Void onAppear;
    Opt_Callback_Void onDisappear;
    Opt_Callback_Void onWillAppear;
    Opt_Callback_Void onWillDisappear;
    Opt_Union_SheetSize_Length height;
    Opt_Boolean dragBar;
    Opt_ResourceColor maskColor;
    Opt_Type_SheetOptions_detents detents;
    Opt_BlurStyle blurStyle;
    Opt_Union_Boolean_Resource showClose;
    Opt_SheetType preferType;
    Opt_Union_SheetTitleOptions_CustomBuilder title;
    Opt_Callback_SheetDismiss_Void shouldDismiss;
    Opt_Callback_DismissSheetAction_Void onWillDismiss;
    Opt_Callback_SpringBackAction_Void onWillSpringBackWhenDismiss;
    Opt_Boolean enableOutsideInteractive;
    Opt_Dimension width;
    Opt_Union_Dimension_EdgeWidths_LocalizedEdgeWidths borderWidth;
    Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors borderColor;
    Opt_Union_BorderStyle_EdgeStyles borderStyle;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_Callback_Number_Void onHeightDidChange;
    Opt_SheetMode mode;
    Opt_ScrollSizeMode scrollSizeMode;
    Opt_Callback_Number_Void onDetentsDidChange;
    Opt_Callback_Number_Void onWidthDidChange;
    Opt_Callback_SheetType_Void onTypeDidChange;
    Opt_CustomObject uiContext;
    Opt_SheetKeyboardAvoidMode keyboardAvoidMode;
    Opt_Boolean enableHoverMode;
    Opt_HoverModeAreaType hoverModeArea;
    Opt_Position offset;
} Ark_SheetOptions;
typedef struct Opt_SheetOptions {
    Ark_Tag tag;
    Ark_SheetOptions value;
} Opt_SheetOptions;
typedef struct Ark_SwipeActionOptions {
    /* kind: Interface */
    Opt_Union_CustomBuilder_SwipeActionItem start;
    Opt_Union_CustomBuilder_SwipeActionItem end;
    Opt_SwipeEdgeEffect edgeEffect;
    Opt_Callback_Number_Void onOffsetChange;
} Ark_SwipeActionOptions;
typedef struct Opt_SwipeActionOptions {
    Ark_Tag tag;
    Ark_SwipeActionOptions value;
} Opt_SwipeActionOptions;
typedef struct Opt_SwipeGestureEvent {
    Ark_Tag tag;
    Ark_SwipeGestureEvent value;
} Opt_SwipeGestureEvent;
typedef struct Opt_TapGestureEvent {
    Ark_Tag tag;
    Ark_TapGestureEvent value;
} Opt_TapGestureEvent;
typedef struct Ark_TextBackgroundStyle {
    /* kind: Interface */
    Opt_ResourceColor color;
    Opt_Union_Dimension_BorderRadiuses radius;
} Ark_TextBackgroundStyle;
typedef struct Opt_TextBackgroundStyle {
    Ark_Tag tag;
    Ark_TextBackgroundStyle value;
} Opt_TextBackgroundStyle;
typedef struct Ark_TextDataDetectorConfig {
    /* kind: Interface */
    Array_TextDataDetectorType types;
    Opt_Callback_String_Void onDetectResultUpdate;
    Opt_ResourceColor color;
    Opt_DecorationStyleInterface decoration;
} Ark_TextDataDetectorConfig;
typedef struct Opt_TextDataDetectorConfig {
    Ark_Tag tag;
    Ark_TextDataDetectorConfig value;
} Opt_TextDataDetectorConfig;
typedef struct Opt_TouchEvent {
    Ark_Tag tag;
    Ark_TouchEvent value;
} Opt_TouchEvent;
typedef struct Ark_Type_AlertDialog_show_value {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_AlertDialogParamWithConfirm value0;
        Ark_AlertDialogParamWithButtons value1;
        Ark_AlertDialogParamWithOptions value2;
    };
} Ark_Type_AlertDialog_show_value;
typedef struct Opt_Type_AlertDialog_show_value {
    Ark_Tag tag;
    Ark_Type_AlertDialog_show_value value;
} Opt_Type_AlertDialog_show_value;
typedef struct Ark_Union_CancelButtonOptions_CancelButtonSymbolOptions {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_CancelButtonOptions value0;
        Ark_CancelButtonSymbolOptions value1;
    };
} Ark_Union_CancelButtonOptions_CancelButtonSymbolOptions;
typedef struct Opt_Union_CancelButtonOptions_CancelButtonSymbolOptions {
    Ark_Tag tag;
    Ark_Union_CancelButtonOptions_CancelButtonSymbolOptions value;
} Opt_Union_CancelButtonOptions_CancelButtonSymbolOptions;
typedef struct Ark_Union_DotIndicator_DigitIndicator {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_DotIndicator value0;
        Ark_DigitIndicator value1;
    };
} Ark_Union_DotIndicator_DigitIndicator;
typedef struct Opt_Union_DotIndicator_DigitIndicator {
    Ark_Tag tag;
    Ark_Union_DotIndicator_DigitIndicator value;
} Opt_Union_DotIndicator_DigitIndicator;
typedef struct Ark_Union_DotIndicator_DigitIndicator_Boolean {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_DotIndicator value0;
        Ark_DigitIndicator value1;
        Ark_Boolean value2;
    };
} Ark_Union_DotIndicator_DigitIndicator_Boolean;
typedef struct Opt_Union_DotIndicator_DigitIndicator_Boolean {
    Ark_Tag tag;
    Ark_Union_DotIndicator_DigitIndicator_Boolean value;
} Opt_Union_DotIndicator_DigitIndicator_Boolean;
typedef struct Opt_AccessibilityHoverEvent {
    Ark_Tag tag;
    Ark_AccessibilityHoverEvent value;
} Opt_AccessibilityHoverEvent;
typedef struct Opt_BackgroundColorStyle {
    Ark_Tag tag;
    Ark_BackgroundColorStyle value;
} Opt_BackgroundColorStyle;
typedef struct Opt_BaseEvent {
    Ark_Tag tag;
    Ark_BaseEvent value;
} Opt_BaseEvent;
typedef struct Opt_BaseGestureEvent {
    Ark_Tag tag;
    Ark_BaseGestureEvent value;
} Opt_BaseGestureEvent;
typedef struct Ark_BottomTabBarStyle {
    /* kind: Interface */
    Opt_Union_ResourceStr_TabBarSymbol _icon;
    Opt_ResourceStr _text;
    Opt_ButtonLabelStyle _labelStyle;
    Opt_Union_Padding_Dimension_LocalizedPadding _padding;
    Opt_LayoutMode _layoutMode;
    Opt_VerticalAlign _verticalAlign;
    Opt_Boolean _symmetricExtensible;
    Opt_String _id;
    Opt_TabBarIconStyle _iconStyle;
} Ark_BottomTabBarStyle;
typedef struct Opt_BottomTabBarStyle {
    Ark_Tag tag;
    Ark_BottomTabBarStyle value;
} Opt_BottomTabBarStyle;
typedef struct Opt_ClickEvent {
    Ark_Tag tag;
    Ark_ClickEvent value;
} Opt_ClickEvent;
typedef struct Opt_ImageAttachment {
    Ark_Tag tag;
    Ark_ImageAttachment value;
} Opt_ImageAttachment;
typedef struct Ark_ImageAttachmentInterface {
    /* kind: Interface */
    Ark_PixelMap value;
    Opt_SizeOptions size;
    Opt_ImageSpanAlignment verticalAlign;
    Opt_ImageFit objectFit;
    Opt_ImageAttachmentLayoutStyle layoutStyle;
} Ark_ImageAttachmentInterface;
typedef struct Opt_ImageAttachmentInterface {
    Ark_Tag tag;
    Ark_ImageAttachmentInterface value;
} Opt_ImageAttachmentInterface;
typedef struct Ark_PopupOptions {
    /* kind: Interface */
    Ark_String message;
    Opt_Boolean placementOnTop;
    Opt_Placement placement;
    Opt_Literal_String_value_Callback_Void_action primaryButton;
    Opt_Literal_String_value_Callback_Void_action secondaryButton;
    Opt_Callback_Literal_Boolean_isVisible_Void onStateChange;
    Opt_Length arrowOffset;
    Opt_Boolean showInSubWindow;
    Opt_Union_Boolean_Literal_ResourceColor_color mask;
    Opt_PopupMessageOptions messageOptions;
    Opt_Length targetSpace;
    Opt_Boolean enableArrow;
    Opt_Position offset;
    Opt_Union_Color_String_Resource_Number popupColor;
    Opt_Boolean autoCancel;
    Opt_Dimension width;
    Opt_ArrowPointPosition arrowPointPosition;
    Opt_Dimension arrowWidth;
    Opt_Dimension arrowHeight;
    Opt_Dimension radius;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_TransitionEffect transition;
    Opt_Union_Boolean_Callback_DismissPopupAction_Void onWillDismiss;
    Opt_Boolean enableHoverMode;
    Opt_Boolean followTransformOfTarget;
} Ark_PopupOptions;
typedef struct Opt_PopupOptions {
    Ark_Tag tag;
    Ark_PopupOptions value;
} Opt_PopupOptions;
typedef struct Ark_RichEditorImageSpanStyle {
    /* kind: Interface */
    Opt_Tuple_Dimension_Dimension size;
    Opt_ImageSpanAlignment verticalAlign;
    Opt_ImageFit objectFit;
    Opt_RichEditorLayoutStyle layoutStyle;
} Ark_RichEditorImageSpanStyle;
typedef struct Opt_RichEditorImageSpanStyle {
    Ark_Tag tag;
    Ark_RichEditorImageSpanStyle value;
} Opt_RichEditorImageSpanStyle;
typedef struct Ark_RichEditorImageSpanStyleResult {
    /* kind: Interface */
    Ark_Tuple_Number_Number size;
    Ark_ImageSpanAlignment verticalAlign;
    Ark_ImageFit objectFit;
    Opt_RichEditorLayoutStyle layoutStyle;
} Ark_RichEditorImageSpanStyleResult;
typedef struct Opt_RichEditorImageSpanStyleResult {
    Ark_Tag tag;
    Ark_RichEditorImageSpanStyleResult value;
} Opt_RichEditorImageSpanStyleResult;
typedef struct Ark_RichEditorParagraphResult {
    /* kind: Interface */
    Ark_RichEditorParagraphStyle style;
    Ark_Tuple_Number_Number range;
} Ark_RichEditorParagraphResult;
typedef struct Opt_RichEditorParagraphResult {
    Ark_Tag tag;
    Ark_RichEditorParagraphResult value;
} Opt_RichEditorParagraphResult;
typedef struct Ark_RichEditorTextSpanOptions {
    /* kind: Interface */
    Opt_Number offset;
    Opt_RichEditorTextStyle style;
    Opt_RichEditorParagraphStyle paragraphStyle;
    Opt_RichEditorGesture gesture;
} Ark_RichEditorTextSpanOptions;
typedef struct Opt_RichEditorTextSpanOptions {
    Ark_Tag tag;
    Ark_RichEditorTextSpanOptions value;
} Opt_RichEditorTextSpanOptions;
typedef struct Ark_RichEditorTextSpanResult {
    /* kind: Interface */
    Ark_RichEditorSpanPosition spanPosition;
    Ark_String value;
    Ark_RichEditorTextStyleResult textStyle;
    Ark_Tuple_Number_Number offsetInSpan;
    Opt_RichEditorSymbolSpanStyle symbolSpanStyle;
    Opt_CustomObject valueResource;
    Opt_RichEditorParagraphStyle paragraphStyle;
    Opt_String previewText;
} Ark_RichEditorTextSpanResult;
typedef struct Opt_RichEditorTextSpanResult {
    Ark_Tag tag;
    Ark_RichEditorTextSpanResult value;
} Opt_RichEditorTextSpanResult;
typedef struct Ark_RichEditorUpdateImageSpanStyleOptions {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number end;
    Ark_RichEditorImageSpanStyle imageStyle;
} Ark_RichEditorUpdateImageSpanStyleOptions;
typedef struct Opt_RichEditorUpdateImageSpanStyleOptions {
    Ark_Tag tag;
    Ark_RichEditorUpdateImageSpanStyleOptions value;
} Opt_RichEditorUpdateImageSpanStyleOptions;
typedef struct Ark_StyledStringValue {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_TextStyle_styled_string value0;
        Ark_DecorationStyle value1;
        Ark_BaselineOffsetStyle value2;
        Ark_LetterSpacingStyle value3;
        Ark_TextShadowStyle value4;
        Ark_GestureStyle value5;
        Ark_ImageAttachment value6;
        Ark_ParagraphStyle value7;
        Ark_LineHeightStyle value8;
        Ark_UrlStyle value9;
        Ark_CustomSpan value10;
        Ark_UserDataSpan value11;
        Ark_BackgroundColorStyle value12;
    };
} Ark_StyledStringValue;
typedef struct Opt_StyledStringValue {
    Ark_Tag tag;
    Ark_StyledStringValue value;
} Opt_StyledStringValue;
typedef struct Ark_StyleOptions {
    /* kind: Interface */
    Opt_Number start;
    Opt_Number length;
    Ark_StyledStringKey styledKey;
    Ark_StyledStringValue styledValue;
} Ark_StyleOptions;
typedef struct Opt_StyleOptions {
    Ark_Tag tag;
    Ark_StyleOptions value;
} Opt_StyleOptions;
typedef struct Ark_SubTabBarStyle {
    /* kind: Interface */
    Opt_Union_String_Resource_ComponentContent _content;
    Opt_IndicatorStyle _indicator;
    Opt_SelectedMode _selectedMode;
    Opt_BoardStyle _board;
    Opt_ButtonLabelStyle _labelStyle;
    Opt_Union_Union_Padding_Dimension_LocalizedPadding _padding;
    Opt_String _id;
} Ark_SubTabBarStyle;
typedef struct Opt_SubTabBarStyle {
    Ark_Tag tag;
    Ark_SubTabBarStyle value;
} Opt_SubTabBarStyle;
typedef struct Ark_TextPickerDialogOptions {
    /* kind: Interface */
    Ark_Type_TextPickerOptions_range range;
    Opt_Union_String_Array_String value;
    Opt_Union_Number_Array_Number selected;
    Opt_Union_Number_String defaultPickerItemHeight;
    Opt_Boolean canLoop;
    Opt_PickerTextStyle disappearTextStyle;
    Opt_PickerTextStyle textStyle;
    Opt_PickerDialogButtonStyle acceptButtonStyle;
    Opt_PickerDialogButtonStyle cancelButtonStyle;
    Opt_PickerTextStyle selectedTextStyle;
    Opt_Callback_TextPickerResult_Void onAccept;
    Opt_Callback_Void onCancel;
    Opt_Callback_TextPickerResult_Void onChange;
    Opt_Callback_TextPickerResult_Void onScrollStop;
    Opt_Rectangle maskRect;
    Opt_DialogAlignment alignment;
    Opt_Offset offset;
    Opt_ResourceColor backgroundColor;
    Opt_BlurStyle backgroundBlurStyle;
    Opt_Callback_Void onDidAppear;
    Opt_Callback_Void onDidDisappear;
    Opt_Callback_Void onWillAppear;
    Opt_Callback_Void onWillDisappear;
    Opt_Union_ShadowOptions_ShadowStyle shadow;
    Opt_Boolean enableHoverMode;
    Opt_HoverModeAreaType hoverModeArea;
} Ark_TextPickerDialogOptions;
typedef struct Opt_TextPickerDialogOptions {
    Ark_Tag tag;
    Ark_TextPickerDialogOptions value;
} Opt_TextPickerDialogOptions;
typedef struct Ark_Type_RichEditorController_updateSpanStyle_value {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_RichEditorUpdateTextSpanStyleOptions value0;
        Ark_RichEditorUpdateImageSpanStyleOptions value1;
        Ark_RichEditorUpdateSymbolSpanStyleOptions value2;
    };
} Ark_Type_RichEditorController_updateSpanStyle_value;
typedef struct Opt_Type_RichEditorController_updateSpanStyle_value {
    Ark_Tag tag;
    Ark_Type_RichEditorController_updateSpanStyle_value value;
} Opt_Type_RichEditorController_updateSpanStyle_value;
typedef struct Ark_Union_PopupOptions_CustomPopupOptions {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_PopupOptions value0;
        Ark_CustomPopupOptions value1;
    };
} Ark_Union_PopupOptions_CustomPopupOptions;
typedef struct Opt_Union_PopupOptions_CustomPopupOptions {
    Ark_Tag tag;
    Ark_Union_PopupOptions_CustomPopupOptions value;
} Opt_Union_PopupOptions_CustomPopupOptions;
typedef struct Ark_Union_String_ImageAttachment_CustomSpan {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_String value0;
        Ark_ImageAttachment value1;
        Ark_CustomSpan value2;
    };
} Ark_Union_String_ImageAttachment_CustomSpan;
typedef struct Opt_Union_String_ImageAttachment_CustomSpan {
    Ark_Tag tag;
    Ark_Union_String_ImageAttachment_CustomSpan value;
} Opt_Union_String_ImageAttachment_CustomSpan;
typedef struct Ark_Union_SubTabBarStyle_BottomTabBarStyle {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_SubTabBarStyle value0;
        Ark_BottomTabBarStyle value1;
    };
} Ark_Union_SubTabBarStyle_BottomTabBarStyle;
typedef struct Opt_Union_SubTabBarStyle_BottomTabBarStyle {
    Ark_Tag tag;
    Ark_Union_SubTabBarStyle_BottomTabBarStyle value;
} Opt_Union_SubTabBarStyle_BottomTabBarStyle;
typedef struct Ark_RichEditorImageSpanOptions {
    /* kind: Interface */
    Opt_Number offset;
    Opt_RichEditorImageSpanStyle imageStyle;
    Opt_RichEditorGesture gesture;
} Ark_RichEditorImageSpanOptions;
typedef struct Opt_RichEditorImageSpanOptions {
    Ark_Tag tag;
    Ark_RichEditorImageSpanOptions value;
} Opt_RichEditorImageSpanOptions;
typedef struct Ark_RichEditorImageSpanResult {
    /* kind: Interface */
    Ark_RichEditorSpanPosition spanPosition;
    Opt_PixelMap valuePixelMap;
    Opt_ResourceStr valueResourceStr;
    Ark_RichEditorImageSpanStyleResult imageStyle;
    Ark_Tuple_Number_Number offsetInSpan;
} Ark_RichEditorImageSpanResult;
typedef struct Opt_RichEditorImageSpanResult {
    Ark_Tag tag;
    Ark_RichEditorImageSpanResult value;
} Opt_RichEditorImageSpanResult;
typedef struct Ark_SpanStyle {
    /* kind: Interface */
    Ark_Number start;
    Ark_Number length;
    Ark_StyledStringKey styledKey;
    Ark_StyledStringValue styledValue;
} Ark_SpanStyle;
typedef struct Opt_SpanStyle {
    Ark_Tag tag;
    Ark_SpanStyle value;
} Opt_SpanStyle;
typedef struct Ark_Union_RichEditorImageSpanResult_RichEditorTextSpanResult {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_RichEditorImageSpanResult value0;
        Ark_RichEditorTextSpanResult value1;
    };
} Ark_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Opt_Union_RichEditorImageSpanResult_RichEditorTextSpanResult {
    Ark_Tag tag;
    Ark_Union_RichEditorImageSpanResult_RichEditorTextSpanResult value;
} Opt_Union_RichEditorImageSpanResult_RichEditorTextSpanResult;
typedef struct Ark_Union_RichEditorTextSpanResult_RichEditorImageSpanResult {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_RichEditorTextSpanResult value0;
        Ark_RichEditorImageSpanResult value1;
    };
} Ark_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;
typedef struct Opt_Union_RichEditorTextSpanResult_RichEditorImageSpanResult {
    Ark_Tag tag;
    Ark_Union_RichEditorTextSpanResult_RichEditorImageSpanResult value;
} Opt_Union_RichEditorTextSpanResult_RichEditorImageSpanResult;



typedef struct GENERATED_ArkUIBaseSpanModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTextBackgroundStyle)(Ark_NativePointer node,
                                   const Opt_TextBackgroundStyle* style);
    void (*setBaselineOffset)(Ark_NativePointer node,
                              const Opt_CustomObject* value);
} GENERATED_ArkUIBaseSpanModifier;

typedef struct GENERATED_ArkUIBlankModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setBlankOptions)(Ark_NativePointer node,
                            const Opt_Union_Number_String* min);
    void (*setColor)(Ark_NativePointer node,
                     const Opt_ResourceColor* value);
} GENERATED_ArkUIBlankModifier;

typedef struct GENERATED_ArkUIButtonModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setButtonOptions0)(Ark_NativePointer node);
    void (*setButtonOptions1)(Ark_NativePointer node,
                              const Ark_ButtonOptions* options);
    void (*setButtonOptions2)(Ark_NativePointer node,
                              const Ark_ResourceStr* label,
                              const Opt_ButtonOptions* options);
    void (*setType)(Ark_NativePointer node,
                    const Opt_ButtonType* value);
    void (*setStateEffect)(Ark_NativePointer node,
                           const Opt_Boolean* value);
    void (*setButtonStyle)(Ark_NativePointer node,
                           const Opt_ButtonStyleMode* value);
    void (*setControlSize)(Ark_NativePointer node,
                           const Opt_ControlSize* value);
    void (*setRole)(Ark_NativePointer node,
                    const Opt_ButtonRole* value);
    void (*setFontColor)(Ark_NativePointer node,
                         const Opt_ResourceColor* value);
    void (*setFontSize)(Ark_NativePointer node,
                        const Opt_Length* value);
    void (*setFontWeight)(Ark_NativePointer node,
                          const Opt_Union_Number_FontWeight_String* value);
    void (*setFontStyle)(Ark_NativePointer node,
                         const Opt_FontStyle* value);
    void (*setFontFamily)(Ark_NativePointer node,
                          const Opt_Union_String_Resource* value);
    void (*setContentModifier)(Ark_NativePointer node,
                               const Opt_ContentModifier* modifier);
    void (*setLabelStyle)(Ark_NativePointer node,
                          const Opt_ButtonLabelStyle* value);
} GENERATED_ArkUIButtonModifier;

typedef struct GENERATED_ArkUICalendarPickerModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCalendarPickerOptions)(Ark_NativePointer node);
    void (*setEdgeAlign)(Ark_NativePointer node,
                         const Opt_CalendarAlign* alignType,
                         const Opt_Offset* offset);
} GENERATED_ArkUICalendarPickerModifier;

typedef struct GENERATED_ArkUICanvasModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCanvasOptions)(Ark_NativePointer node,
                             const Opt_Union_CanvasRenderingContext2D_DrawingRenderingContext* context);
    void (*setOnReady)(Ark_NativePointer node,
                       const Opt_Callback_Void* event);
    void (*setEnableAnalyzer)(Ark_NativePointer node,
                              const Opt_Boolean* enable);
} GENERATED_ArkUICanvasModifier;

typedef struct GENERATED_ArkUICircleModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCircleOptions)(Ark_NativePointer node,
                             const Opt_CircleOptions* value);
} GENERATED_ArkUICircleModifier;

typedef struct GENERATED_ArkUIColumnModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setColumnOptions)(Ark_NativePointer node,
                             const Opt_ColumnOptions* options);
    void (*setAlignItems)(Ark_NativePointer node,
                          const Opt_HorizontalAlign* value);
    void (*setJustifyContent)(Ark_NativePointer node,
                              const Opt_FlexAlign* value);
    void (*setPointLight)(Ark_NativePointer node,
                          const Opt_PointLightStyle* value);
    void (*setReverse)(Ark_NativePointer node,
                       const Opt_Boolean* isReversed);
} GENERATED_ArkUIColumnModifier;

typedef struct GENERATED_ArkUICommonModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCommonOptions)(Ark_NativePointer node);
} GENERATED_ArkUICommonModifier;

typedef struct GENERATED_ArkUICommonMethodModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setWidth)(Ark_NativePointer node,
                     const Opt_Union_Length_LayoutPolicy* value);
    void (*setHeight)(Ark_NativePointer node,
                      const Opt_Union_Length_LayoutPolicy* value);
    void (*setDrawModifier)(Ark_NativePointer node,
                            const Opt_DrawModifier* modifier);
    void (*setCustomProperty)(Ark_NativePointer node,
                              const Opt_String* name,
                              const Opt_Object* value);
    void (*setExpandSafeArea)(Ark_NativePointer node,
                              const Opt_Array_SafeAreaType* types,
                              const Opt_Array_SafeAreaEdge* edges);
    void (*setResponseRegion)(Ark_NativePointer node,
                              const Opt_Union_Array_Rectangle_Rectangle* value);
    void (*setMouseResponseRegion)(Ark_NativePointer node,
                                   const Opt_Union_Array_Rectangle_Rectangle* value);
    void (*setSize)(Ark_NativePointer node,
                    const Opt_SizeOptions* value);
    void (*setConstraintSize)(Ark_NativePointer node,
                              const Opt_ConstraintSizeOptions* value);
    void (*setTouchable)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setHitTestBehavior)(Ark_NativePointer node,
                               const Opt_HitTestMode* value);
    void (*setOnChildTouchTest)(Ark_NativePointer node,
                                const Opt_Callback_Array_TouchTestInfo_TouchResult* event);
    void (*setLayoutWeight)(Ark_NativePointer node,
                            const Opt_Union_Number_String* value);
    void (*setChainWeight)(Ark_NativePointer node,
                           const Opt_ChainWeightOptions* chainWeight);
    void (*setPadding)(Ark_NativePointer node,
                       const Opt_Union_Padding_Length_LocalizedPadding* value);
    void (*setSafeAreaPadding)(Ark_NativePointer node,
                               const Opt_Union_Padding_LengthMetrics_LocalizedPadding* paddingValue);
    void (*setMargin)(Ark_NativePointer node,
                      const Opt_Union_Margin_Length_LocalizedMargin* value);
    void (*setBackground)(Ark_NativePointer node,
                          const Opt_CustomNodeBuilder* builder,
                          const Opt_Literal_Alignment_align* options);
    void (*setBackgroundColor)(Ark_NativePointer node,
                               const Opt_ResourceColor* value);
    void (*setPixelRound)(Ark_NativePointer node,
                          const Opt_PixelRoundPolicy* value);
    void (*setBackgroundImage)(Ark_NativePointer node,
                               const Opt_Union_ResourceStr_PixelMap* src,
                               const Opt_ImageRepeat* repeat);
    void (*setBackgroundImageSize)(Ark_NativePointer node,
                                   const Opt_Union_SizeOptions_ImageSize* value);
    void (*setBackgroundImagePosition)(Ark_NativePointer node,
                                       const Opt_Union_Position_Alignment* value);
    void (*setBackgroundBlurStyle)(Ark_NativePointer node,
                                   const Opt_BlurStyle* value,
                                   const Opt_BackgroundBlurStyleOptions* options);
    void (*setBackgroundEffect)(Ark_NativePointer node,
                                const Opt_BackgroundEffectOptions* options);
    void (*setBackgroundImageResizable)(Ark_NativePointer node,
                                        const Opt_ResizableOptions* value);
    void (*setForegroundEffect)(Ark_NativePointer node,
                                const Opt_ForegroundEffectOptions* options);
    void (*setVisualEffect)(Ark_NativePointer node,
                            const Opt_CustomObject* effect);
    void (*setBackgroundFilter)(Ark_NativePointer node,
                                const Opt_CustomObject* filter);
    void (*setForegroundFilter)(Ark_NativePointer node,
                                const Opt_CustomObject* filter);
    void (*setCompositingFilter)(Ark_NativePointer node,
                                 const Opt_CustomObject* filter);
    void (*setForegroundBlurStyle)(Ark_NativePointer node,
                                   const Opt_BlurStyle* value,
                                   const Opt_ForegroundBlurStyleOptions* options);
    void (*setOpacity)(Ark_NativePointer node,
                       const Opt_Union_Number_Resource* value);
    void (*setBorder)(Ark_NativePointer node,
                      const Opt_BorderOptions* value);
    void (*setBorderStyle)(Ark_NativePointer node,
                           const Opt_Union_BorderStyle_EdgeStyles* value);
    void (*setBorderWidth)(Ark_NativePointer node,
                           const Opt_Union_Length_EdgeWidths_LocalizedEdgeWidths* value);
    void (*setBorderColor)(Ark_NativePointer node,
                           const Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors* value);
    void (*setBorderRadius)(Ark_NativePointer node,
                            const Opt_Union_Length_BorderRadiuses_LocalizedBorderRadiuses* value);
    void (*setBorderImage)(Ark_NativePointer node,
                           const Opt_BorderImageOption* value);
    void (*setOutline)(Ark_NativePointer node,
                       const Opt_OutlineOptions* value);
    void (*setOutlineStyle)(Ark_NativePointer node,
                            const Opt_Union_OutlineStyle_EdgeOutlineStyles* value);
    void (*setOutlineWidth)(Ark_NativePointer node,
                            const Opt_Union_Dimension_EdgeOutlineWidths* value);
    void (*setOutlineColor)(Ark_NativePointer node,
                            const Opt_Union_ResourceColor_EdgeColors_LocalizedEdgeColors* value);
    void (*setOutlineRadius)(Ark_NativePointer node,
                             const Opt_Union_Dimension_OutlineRadiuses* value);
    void (*setForegroundColor)(Ark_NativePointer node,
                               const Opt_Union_ResourceColor_ColoringStrategy* value);
    void (*setOnClick0)(Ark_NativePointer node,
                        const Opt_Callback_ClickEvent_Void* event);
    void (*setOnClick1)(Ark_NativePointer node,
                        const Opt_Callback_ClickEvent_Void* event,
                        const Opt_Number* distanceThreshold);
    void (*setOnHover)(Ark_NativePointer node,
                       const Opt_Callback_Boolean_HoverEvent_Void* event);
    void (*setOnAccessibilityHover)(Ark_NativePointer node,
                                    const Opt_AccessibilityCallback* callback_);
    void (*setHoverEffect)(Ark_NativePointer node,
                           const Opt_HoverEffect* value);
    void (*setOnMouse)(Ark_NativePointer node,
                       const Opt_Callback_MouseEvent_Void* event);
    void (*setOnTouch)(Ark_NativePointer node,
                       const Opt_Callback_TouchEvent_Void* event);
    void (*setOnKeyEvent)(Ark_NativePointer node,
                          const Opt_Callback_KeyEvent_Void* event);
    void (*setOnKeyPreIme)(Ark_NativePointer node,
                           const Opt_Callback_KeyEvent_Boolean* event);
    void (*setFocusable)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setTabStop)(Ark_NativePointer node,
                       const Opt_Boolean* isTabStop);
    void (*setOnFocus)(Ark_NativePointer node,
                       const Opt_Callback_Void* event);
    void (*setOnBlur)(Ark_NativePointer node,
                      const Opt_Callback_Void* event);
    void (*setTabIndex)(Ark_NativePointer node,
                        const Opt_Number* index);
    void (*setDefaultFocus)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setGroupDefaultFocus)(Ark_NativePointer node,
                                 const Opt_Boolean* value);
    void (*setFocusOnTouch)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setFocusBox)(Ark_NativePointer node,
                        const Opt_FocusBoxStyle* style);
    void (*setFocusScopeId)(Ark_NativePointer node,
                            const Opt_String* id,
                            const Opt_Boolean* isGroup,
                            const Opt_Boolean* arrowStepOut);
    void (*setFocusScopePriority)(Ark_NativePointer node,
                                  const Opt_String* scopeId,
                                  const Opt_FocusPriority* priority);
    void (*setAnimation)(Ark_NativePointer node,
                         const Opt_AnimateParam* value);
    void (*setTransition0)(Ark_NativePointer node,
                           const Opt_Union_TransitionOptions_TransitionEffect* value);
    void (*setTransition1)(Ark_NativePointer node,
                           const Opt_TransitionEffect* effect,
                           const Opt_TransitionFinishCallback* onFinish);
    void (*setGesture)(Ark_NativePointer node,
                       const Opt_GestureType* gesture,
                       const Opt_GestureMask* mask);
    void (*setPriorityGesture)(Ark_NativePointer node,
                               const Opt_GestureType* gesture,
                               const Opt_GestureMask* mask);
    void (*setParallelGesture)(Ark_NativePointer node,
                               const Opt_GestureType* gesture,
                               const Opt_GestureMask* mask);
    void (*setBlur)(Ark_NativePointer node,
                    const Opt_Number* value,
                    const Opt_BlurOptions* options);
    void (*setLinearGradientBlur)(Ark_NativePointer node,
                                  const Opt_Number* value,
                                  const Opt_LinearGradientBlurOptions* options);
    void (*setMotionBlur)(Ark_NativePointer node,
                          const Opt_MotionBlurOptions* value);
    void (*setBrightness)(Ark_NativePointer node,
                          const Opt_Number* value);
    void (*setContrast)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setGrayscale)(Ark_NativePointer node,
                         const Opt_Number* value);
    void (*setColorBlend)(Ark_NativePointer node,
                          const Opt_Union_Color_String_Resource* value);
    void (*setSaturate)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setSepia)(Ark_NativePointer node,
                     const Opt_Number* value);
    void (*setInvert)(Ark_NativePointer node,
                      const Opt_Union_Number_InvertOptions* value);
    void (*setSystemBarEffect)(Ark_NativePointer node);
    void (*setHueRotate)(Ark_NativePointer node,
                         const Opt_Union_Number_String* value);
    void (*setUseShadowBatching)(Ark_NativePointer node,
                                 const Opt_Boolean* value);
    void (*setUseEffect0)(Ark_NativePointer node,
                          const Opt_Boolean* useEffect,
                          const Opt_EffectType* effectType);
    void (*setUseEffect1)(Ark_NativePointer node,
                          const Opt_Boolean* value);
    void (*setBackdropBlur)(Ark_NativePointer node,
                            const Opt_Number* value,
                            const Opt_BlurOptions* options);
    void (*setRenderGroup)(Ark_NativePointer node,
                           const Opt_Boolean* value);
    void (*setFreeze)(Ark_NativePointer node,
                      const Opt_Boolean* value);
    void (*setTranslate)(Ark_NativePointer node,
                         const Opt_TranslateOptions* value);
    void (*setScale)(Ark_NativePointer node,
                     const Opt_ScaleOptions* value);
    void (*setGridSpan)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setGridOffset)(Ark_NativePointer node,
                          const Opt_Number* value);
    void (*setRotate)(Ark_NativePointer node,
                      const Opt_RotateOptions* value);
    void (*setTransform)(Ark_NativePointer node,
                         const Ark_TransformationMatrix* value);
    void (*setOnAppear)(Ark_NativePointer node,
                        const Opt_Callback_Void* event);
    void (*setOnDisAppear)(Ark_NativePointer node,
                           const Opt_Callback_Void* event);
    void (*setOnAttach)(Ark_NativePointer node,
                        const Opt_Callback_Void* callback_);
    void (*setOnDetach)(Ark_NativePointer node,
                        const Opt_Callback_Void* callback_);
    void (*setOnAreaChange)(Ark_NativePointer node,
                            const Opt_Callback_Area_Area_Void* event);
    void (*setVisibility)(Ark_NativePointer node,
                          const Opt_Visibility* value);
    void (*setFlexGrow)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setFlexShrink)(Ark_NativePointer node,
                          const Opt_Number* value);
    void (*setFlexBasis)(Ark_NativePointer node,
                         const Opt_Union_Number_String* value);
    void (*setAlignSelf)(Ark_NativePointer node,
                         const Opt_ItemAlign* value);
    void (*setDisplayPriority)(Ark_NativePointer node,
                               const Opt_Number* value);
    void (*setZIndex)(Ark_NativePointer node,
                      const Opt_Number* value);
    void (*setSharedTransition)(Ark_NativePointer node,
                                const Opt_String* id,
                                const Opt_sharedTransitionOptions* options);
    void (*setDirection)(Ark_NativePointer node,
                         const Opt_Direction* value);
    void (*setAlign)(Ark_NativePointer node,
                     const Opt_Alignment* value);
    void (*setPosition)(Ark_NativePointer node,
                        const Opt_Union_Position_Edges_LocalizedEdges* value);
    void (*setMarkAnchor)(Ark_NativePointer node,
                          const Opt_Union_Position_LocalizedPosition* value);
    void (*setOffset)(Ark_NativePointer node,
                      const Opt_Union_Position_Edges_LocalizedEdges* value);
    void (*setEnabled)(Ark_NativePointer node,
                       const Opt_Boolean* value);
    void (*setUseSizeType)(Ark_NativePointer node,
                           const Opt_Literal_Union_Number_Literal_Number_offset_span_lg_md_sm_xs* value);
    void (*setAlignRules0)(Ark_NativePointer node,
                           const Opt_AlignRuleOption* value);
    void (*setAlignRules1)(Ark_NativePointer node,
                           const Opt_LocalizedAlignRuleOptions* alignRule);
    void (*setChainMode)(Ark_NativePointer node,
                         const Opt_Axis* direction,
                         const Opt_ChainStyle* style);
    void (*setAspectRatio)(Ark_NativePointer node,
                           const Opt_Number* value);
    void (*setClickEffect)(Ark_NativePointer node,
                           const Opt_ClickEffect* value);
    void (*setOnDragStart)(Ark_NativePointer node,
                           const Opt_Type_CommonMethod_onDragStart_event* event);
    void (*setOnDragEnter)(Ark_NativePointer node,
                           const Opt_Callback_DragEvent_Opt_String_Void* event);
    void (*setOnDragMove)(Ark_NativePointer node,
                          const Opt_Callback_DragEvent_Opt_String_Void* event);
    void (*setOnDragLeave)(Ark_NativePointer node,
                           const Opt_Callback_DragEvent_Opt_String_Void* event);
    void (*setOnDrop)(Ark_NativePointer node,
                      const Opt_Callback_DragEvent_Opt_String_Void* event);
    void (*setOnDragEnd)(Ark_NativePointer node,
                         const Opt_Callback_DragEvent_Opt_String_Void* event);
    void (*setAllowDrop)(Ark_NativePointer node,
                         const Opt_Array_CustomObject* value);
    void (*setDraggable)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setDragPreview)(Ark_NativePointer node,
                           const Opt_Union_CustomBuilder_DragItemInfo_String* value);
    void (*setDragPreviewOptions)(Ark_NativePointer node,
                                  const Opt_DragPreviewOptions* value,
                                  const Opt_DragInteractionOptions* options);
    void (*setOnPreDrag)(Ark_NativePointer node,
                         const Opt_Callback_PreDragStatus_Void* callback_);
    void (*setOverlay)(Ark_NativePointer node,
                       const Opt_Union_String_CustomBuilder_ComponentContent* value,
                       const Opt_OverlayOptions* options);
    void (*setLinearGradient)(Ark_NativePointer node,
                              const Opt_Type_CommonMethod_linearGradient_value* value);
    void (*setSweepGradient)(Ark_NativePointer node,
                             const Opt_Type_CommonMethod_sweepGradient_value* value);
    void (*setRadialGradient)(Ark_NativePointer node,
                              const Opt_Type_CommonMethod_radialGradient_value* value);
    void (*setMotionPath)(Ark_NativePointer node,
                          const Opt_MotionPathOptions* value);
    void (*setShadow)(Ark_NativePointer node,
                      const Opt_Union_ShadowOptions_ShadowStyle* value);
    void (*setBlendMode)(Ark_NativePointer node,
                         const Opt_BlendMode* value,
                         const Opt_BlendApplyType* type);
    void (*setAdvancedBlendMode)(Ark_NativePointer node,
                                 const Opt_Union_BlendMode_Blender* effect,
                                 const Opt_BlendApplyType* type);
    void (*setClip)(Ark_NativePointer node,
                    const Opt_Boolean* clip);
    void (*setClipShape)(Ark_NativePointer node,
                         const Opt_Union_CircleShape_EllipseShape_PathShape_RectShape* value);
    void (*setMask)(Ark_NativePointer node,
                    const Opt_ProgressMask* mask);
    void (*setMaskShape)(Ark_NativePointer node,
                         const Opt_Union_CircleShape_EllipseShape_PathShape_RectShape* value);
    void (*setKey)(Ark_NativePointer node,
                   const Opt_String* value);
    void (*setId)(Ark_NativePointer node,
                  const Opt_String* value);
    void (*setGeometryTransition)(Ark_NativePointer node,
                                  const Opt_String* id,
                                  const Opt_GeometryTransitionOptions* options);
    void (*setBindPopup)(Ark_NativePointer node,
                         const Opt_Boolean* show,
                         const Opt_Union_PopupOptions_CustomPopupOptions* popup);
    void (*setBindMenu0)(Ark_NativePointer node,
                         const Opt_Union_Array_MenuElement_CustomBuilder* content,
                         const Opt_MenuOptions* options);
    void (*setBindMenu1)(Ark_NativePointer node,
                         const Opt_Boolean* isShow,
                         const Opt_Union_Array_MenuElement_CustomBuilder* content,
                         const Opt_MenuOptions* options);
    void (*setBindContextMenu0)(Ark_NativePointer node,
                                const Opt_CustomNodeBuilder* content,
                                const Opt_ResponseType* responseType,
                                const Opt_ContextMenuOptions* options);
    void (*setBindContextMenu1)(Ark_NativePointer node,
                                const Opt_Boolean* isShown,
                                const Opt_CustomNodeBuilder* content,
                                const Opt_ContextMenuOptions* options);
    void (*setBindContentCover0)(Ark_NativePointer node,
                                 const Opt_Boolean* isShow,
                                 const Opt_CustomNodeBuilder* builder,
                                 const Opt_ModalTransition* type);
    void (*setBindContentCover1)(Ark_NativePointer node,
                                 const Opt_Boolean* isShow,
                                 const Opt_CustomNodeBuilder* builder,
                                 const Opt_ContentCoverOptions* options);
    void (*setBindSheet)(Ark_NativePointer node,
                         const Opt_Boolean* isShow,
                         const Opt_CustomNodeBuilder* builder,
                         const Opt_SheetOptions* options);
    void (*setStateStyles)(Ark_NativePointer node,
                           const Opt_StateStyles* value);
    void (*setRestoreId)(Ark_NativePointer node,
                         const Opt_Number* value);
    void (*setOnVisibleAreaChange)(Ark_NativePointer node,
                                   const Opt_Array_Number* ratios,
                                   const Opt_VisibleAreaChangeCallback* event);
    void (*setSphericalEffect)(Ark_NativePointer node,
                               const Opt_Number* value);
    void (*setLightUpEffect)(Ark_NativePointer node,
                             const Opt_Number* value);
    void (*setPixelStretchEffect)(Ark_NativePointer node,
                                  const Opt_PixelStretchEffectOptions* options);
    void (*setKeyboardShortcut)(Ark_NativePointer node,
                                const Opt_Union_String_FunctionKey* value,
                                const Opt_Array_ModifierKey* keys,
                                const Opt_Callback_Void* action);
    void (*setAccessibilityGroup0)(Ark_NativePointer node,
                                   const Opt_Boolean* value);
    void (*setAccessibilityGroup1)(Ark_NativePointer node,
                                   const Opt_Boolean* isGroup,
                                   const Opt_AccessibilityOptions* accessibilityOptions);
    void (*setAccessibilityText0)(Ark_NativePointer node,
                                  const Opt_String* value);
    void (*setAccessibilityText1)(Ark_NativePointer node,
                                  const Opt_CustomObject* text);
    void (*setAccessibilityTextHint)(Ark_NativePointer node,
                                     const Opt_String* value);
    void (*setAccessibilityDescription0)(Ark_NativePointer node,
                                         const Opt_String* value);
    void (*setAccessibilityDescription1)(Ark_NativePointer node,
                                         const Opt_CustomObject* description);
    void (*setAccessibilityLevel)(Ark_NativePointer node,
                                  const Opt_String* value);
    void (*setAccessibilityVirtualNode)(Ark_NativePointer node,
                                        const Opt_CustomNodeBuilder* builder);
    void (*setAccessibilityChecked)(Ark_NativePointer node,
                                    const Opt_Boolean* isCheck);
    void (*setAccessibilitySelected)(Ark_NativePointer node,
                                     const Opt_Boolean* isSelect);
    void (*setObscured)(Ark_NativePointer node,
                        const Opt_Array_ObscuredReasons* reasons);
    void (*setReuseId)(Ark_NativePointer node,
                       const Opt_String* id);
    void (*setRenderFit)(Ark_NativePointer node,
                         const Opt_RenderFit* fitMode);
    void (*setGestureModifier)(Ark_NativePointer node,
                               const Opt_GestureModifier* modifier);
    void (*setBackgroundBrightness)(Ark_NativePointer node,
                                    const Opt_BackgroundBrightnessOptions* params);
    void (*setOnGestureJudgeBegin)(Ark_NativePointer node,
                                   const Opt_Callback_GestureInfo_BaseGestureEvent_GestureJudgeResult* callback_);
    void (*setOnGestureRecognizerJudgeBegin0)(Ark_NativePointer node,
                                              const Opt_GestureRecognizerJudgeBeginCallback* callback_);
    void (*setOnGestureRecognizerJudgeBegin1)(Ark_NativePointer node,
                                              const Opt_GestureRecognizerJudgeBeginCallback* callback_,
                                              const Opt_Boolean* exposeInnerGesture);
    void (*setShouldBuiltInRecognizerParallelWith)(Ark_NativePointer node,
                                                   const Opt_ShouldBuiltInRecognizerParallelWithCallback* callback_);
    void (*setMonopolizeEvents)(Ark_NativePointer node,
                                const Opt_Boolean* monopolize);
    void (*setOnTouchIntercept)(Ark_NativePointer node,
                                const Opt_Callback_TouchEvent_HitTestMode* callback_);
    void (*setOnSizeChange)(Ark_NativePointer node,
                            const Opt_SizeChangeCallback* event);
} GENERATED_ArkUICommonMethodModifier;

typedef struct GENERATED_ArkUICommonShapeMethodModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setStroke)(Ark_NativePointer node,
                      const Opt_ResourceColor* value);
    void (*setFill)(Ark_NativePointer node,
                    const Opt_ResourceColor* value);
    void (*setStrokeDashOffset)(Ark_NativePointer node,
                                const Opt_Union_Number_String* value);
    void (*setStrokeLineCap)(Ark_NativePointer node,
                             const Opt_LineCapStyle* value);
    void (*setStrokeLineJoin)(Ark_NativePointer node,
                              const Opt_LineJoinStyle* value);
    void (*setStrokeMiterLimit)(Ark_NativePointer node,
                                const Opt_Union_Number_String* value);
    void (*setStrokeOpacity)(Ark_NativePointer node,
                             const Opt_Union_Number_String_Resource* value);
    void (*setFillOpacity)(Ark_NativePointer node,
                           const Opt_Union_Number_String_Resource* value);
    void (*setStrokeWidth)(Ark_NativePointer node,
                           const Opt_Length* value);
    void (*setAntiAlias)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setStrokeDashArray)(Ark_NativePointer node,
                               const Array_Length* value);
} GENERATED_ArkUICommonShapeMethodModifier;

typedef struct GENERATED_ArkUIComponentRootModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
} GENERATED_ArkUIComponentRootModifier;

typedef struct GENERATED_ArkUICounterModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCounterOptions)(Ark_NativePointer node);
    void (*setOnInc)(Ark_NativePointer node,
                     const Opt_VoidCallback* event);
    void (*setOnDec)(Ark_NativePointer node,
                     const Opt_VoidCallback* event);
    void (*setEnableDec)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setEnableInc)(Ark_NativePointer node,
                         const Opt_Boolean* value);
} GENERATED_ArkUICounterModifier;

typedef struct GENERATED_ArkUICustomLayoutRootModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSubscribeOnMeasureSize)(Ark_NativePointer node,
                                      const Callback_onMeasureSize_SizeResult* value);
    void (*setSubscribeOnPlaceChildren)(Ark_NativePointer node,
                                        const Callback_onPlaceChildren_Void* value);
} GENERATED_ArkUICustomLayoutRootModifier;

typedef struct GENERATED_ArkUIDividerModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setDividerOptions)(Ark_NativePointer node);
    void (*setVertical)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setColor)(Ark_NativePointer node,
                     const Opt_ResourceColor* value);
    void (*setStrokeWidth)(Ark_NativePointer node,
                           const Opt_Union_Number_String* value);
    void (*setLineCap)(Ark_NativePointer node,
                       const Opt_LineCapStyle* value);
} GENERATED_ArkUIDividerModifier;

typedef struct GENERATED_ArkUIEllipseModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setEllipseOptions)(Ark_NativePointer node,
                              const Opt_EllipseOptions* options);
} GENERATED_ArkUIEllipseModifier;

typedef struct GENERATED_ArkUIEmbeddedComponentModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setEmbeddedComponentOptions)(Ark_NativePointer node,
                                        const Ark_CustomObject* loader,
                                        Ark_EmbeddedType type);
    void (*setOnTerminated)(Ark_NativePointer node,
                            const Opt_Callback_TerminationInfo_Void* callback_);
    void (*setOnError)(Ark_NativePointer node,
                       const Opt_CustomObject* callback_);
} GENERATED_ArkUIEmbeddedComponentModifier;

typedef struct GENERATED_ArkUIFlexModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setFlexOptions)(Ark_NativePointer node,
                           const Opt_FlexOptions* value);
    void (*setPointLight)(Ark_NativePointer node,
                          const Opt_PointLightStyle* value);
} GENERATED_ArkUIFlexModifier;

typedef struct GENERATED_ArkUIFormComponentModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setFormComponentOptions)(Ark_NativePointer node);
    void (*setSize)(Ark_NativePointer node,
                    const Opt_Literal_Number_height_width* value);
    void (*setOnAcquired)(Ark_NativePointer node,
                          const Opt_Callback_FormCallbackInfo_Void* callback_);
} GENERATED_ArkUIFormComponentModifier;

typedef struct GENERATED_ArkUIGridModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setGridOptions)(Ark_NativePointer node);
    void (*setColumnsTemplate)(Ark_NativePointer node,
                               const Opt_String* value);
    void (*setRowsTemplate)(Ark_NativePointer node,
                            const Opt_String* value);
    void (*setOnScrollIndex)(Ark_NativePointer node,
                             const Opt_Callback_Number_Number_Void* event);
} GENERATED_ArkUIGridModifier;

typedef struct GENERATED_ArkUIGridContainerModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setGridContainerOptions)(Ark_NativePointer node,
                                    const Opt_GridContainerOptions* value);
} GENERATED_ArkUIGridContainerModifier;

typedef struct GENERATED_ArkUIGridItemModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setGridItemOptions)(Ark_NativePointer node);
    void (*setRowStart)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setRowEnd)(Ark_NativePointer node,
                      const Opt_Number* value);
    void (*setColumnStart)(Ark_NativePointer node,
                           const Opt_Number* value);
    void (*setColumnEnd)(Ark_NativePointer node,
                         const Opt_Number* value);
    void (*setForceRebuild)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setSelectable)(Ark_NativePointer node,
                          const Opt_Boolean* value);
    void (*setSelected)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setOnSelect)(Ark_NativePointer node,
                        const Opt_Callback_Boolean_Void* event);
    void (*set_onChangeEvent_selected)(Ark_NativePointer node,
                                       const Callback_Number_Void* callback);
} GENERATED_ArkUIGridItemModifier;

typedef struct GENERATED_ArkUIImageModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setImageOptions0)(Ark_NativePointer node,
                             const Ark_Union_PixelMap_ResourceStr_DrawableDescriptor* src);
    void (*setImageOptions1)(Ark_NativePointer node,
                             const Ark_Union_PixelMap_ResourceStr_DrawableDescriptor_ImageContent* src);
    void (*setImageOptions2)(Ark_NativePointer node,
                             const Ark_Union_PixelMap_ResourceStr_DrawableDescriptor* src,
                             const Ark_ImageAIOptions* imageAIOptions);
    void (*setAlt)(Ark_NativePointer node,
                   const Opt_Union_String_Resource_PixelMap* value);
    void (*setMatchTextDirection)(Ark_NativePointer node,
                                  const Opt_Boolean* value);
    void (*setFitOriginalSize)(Ark_NativePointer node,
                               const Opt_Boolean* value);
    void (*setFillColor)(Ark_NativePointer node,
                         const Opt_Union_ResourceColor_ColorContent* color);
    void (*setObjectFit)(Ark_NativePointer node,
                         const Opt_ImageFit* value);
    void (*setImageMatrix)(Ark_NativePointer node,
                           const Opt_CustomObject* matrix);
    void (*setObjectRepeat)(Ark_NativePointer node,
                            const Opt_ImageRepeat* value);
    void (*setAutoResize)(Ark_NativePointer node,
                          const Opt_Boolean* value);
    void (*setRenderMode)(Ark_NativePointer node,
                          const Opt_ImageRenderMode* value);
    void (*setDynamicRangeMode)(Ark_NativePointer node,
                                const Opt_DynamicRangeMode* value);
    void (*setInterpolation)(Ark_NativePointer node,
                             const Opt_ImageInterpolation* value);
    void (*setSourceSize)(Ark_NativePointer node,
                          const Opt_ImageSourceSize* value);
    void (*setSyncLoad)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setColorFilter)(Ark_NativePointer node,
                           const Opt_Union_ColorFilter_DrawingColorFilter* value);
    void (*setCopyOption)(Ark_NativePointer node,
                          const Opt_CopyOptions* value);
    void (*setDraggable)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setPointLight)(Ark_NativePointer node,
                          const Opt_PointLightStyle* value);
    void (*setEdgeAntialiasing)(Ark_NativePointer node,
                                const Opt_Number* value);
    void (*setOnComplete)(Ark_NativePointer node,
                          const Opt_Type_ImageAttribute_onComplete_callback* callback_);
    void (*setOnError)(Ark_NativePointer node,
                       const Opt_ImageErrorCallback* callback_);
    void (*setOnFinish)(Ark_NativePointer node,
                        const Opt_Callback_Void* event);
    void (*setEnableAnalyzer)(Ark_NativePointer node,
                              const Opt_Boolean* enable);
    void (*setAnalyzerConfig)(Ark_NativePointer node,
                              const Opt_ImageAnalyzerConfig* config);
    void (*setResizable)(Ark_NativePointer node,
                         const Opt_ResizableOptions* value);
    void (*setPrivacySensitive)(Ark_NativePointer node,
                                const Opt_Boolean* supported);
    void (*setEnhancedImageQuality)(Ark_NativePointer node,
                                    const Opt_CustomObject* imageQuality);
    void (*setOrientation)(Ark_NativePointer node,
                           const Opt_ImageRotateOrientation* orientation);
} GENERATED_ArkUIImageModifier;

typedef struct GENERATED_ArkUIIndicatorComponentModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setIndicatorComponentOptions)(Ark_NativePointer node,
                                         const Opt_IndicatorComponentController* controller);
    void (*setInitialIndex)(Ark_NativePointer node,
                            const Opt_Number* index);
    void (*setCount)(Ark_NativePointer node,
                     const Opt_Number* totalCount);
    void (*setStyle)(Ark_NativePointer node,
                     const Opt_Union_DotIndicator_DigitIndicator* indicatorStyle);
    void (*setLoop)(Ark_NativePointer node,
                    const Opt_Boolean* isLoop);
    void (*setVertical)(Ark_NativePointer node,
                        const Opt_Boolean* isVertical);
    void (*setOnChange)(Ark_NativePointer node,
                        const Opt_Callback_Number_Void* event);
} GENERATED_ArkUIIndicatorComponentModifier;

typedef struct GENERATED_ArkUIListModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setListOptions)(Ark_NativePointer node,
                           const Opt_ListOptions* options);
    void (*setLanes)(Ark_NativePointer node,
                     const Opt_Union_Number_LengthConstrain* value,
                     const Opt_Dimension* gutter);
    void (*setAlignListItem)(Ark_NativePointer node,
                             const Opt_ListItemAlign* value);
    void (*setListDirection)(Ark_NativePointer node,
                             const Opt_Axis* value);
    void (*setScrollBar)(Ark_NativePointer node,
                         const Opt_BarState* value);
    void (*setEdgeEffect)(Ark_NativePointer node,
                          const Opt_EdgeEffect* value,
                          const Opt_EdgeEffectOptions* options);
    void (*setContentStartOffset)(Ark_NativePointer node,
                                  const Opt_Number* value);
    void (*setContentEndOffset)(Ark_NativePointer node,
                                const Opt_Number* value);
    void (*setDivider)(Ark_NativePointer node,
                       const Opt_ListDividerOptions* value);
    void (*setEditMode)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setMultiSelectable)(Ark_NativePointer node,
                               const Opt_Boolean* value);
    void (*setCachedCount0)(Ark_NativePointer node,
                            const Opt_Number* value);
    void (*setCachedCount1)(Ark_NativePointer node,
                            const Opt_Number* count,
                            const Opt_Boolean* show);
    void (*setChainAnimation)(Ark_NativePointer node,
                              const Opt_Boolean* value);
    void (*setChainAnimationOptions)(Ark_NativePointer node,
                                     const Opt_ChainAnimationOptions* value);
    void (*setSticky)(Ark_NativePointer node,
                      const Opt_StickyStyle* value);
    void (*setScrollSnapAlign)(Ark_NativePointer node,
                               const Opt_ScrollSnapAlign* value);
    void (*setNestedScroll)(Ark_NativePointer node,
                            const Opt_NestedScrollOptions* value);
    void (*setEnableScrollInteraction)(Ark_NativePointer node,
                                       const Opt_Boolean* value);
    void (*setFriction)(Ark_NativePointer node,
                        const Opt_Union_Number_Resource* value);
    void (*setChildrenMainSize)(Ark_NativePointer node,
                                const Opt_ChildrenMainSize* value);
    void (*setMaintainVisibleContentPosition)(Ark_NativePointer node,
                                              const Opt_Boolean* enabled);
    void (*setOnScroll)(Ark_NativePointer node,
                        const Callback_Number_Number_Void* event);
    void (*setOnScrollIndex)(Ark_NativePointer node,
                             const Opt_Callback_Number_Number_Number_Void* event);
    void (*setOnScrollVisibleContentChange)(Ark_NativePointer node,
                                            const Opt_OnScrollVisibleContentChangeCallback* handler);
    void (*setOnReachStart)(Ark_NativePointer node,
                            const Opt_Callback_Void* event);
    void (*setOnReachEnd)(Ark_NativePointer node,
                          const Opt_Callback_Void* event);
    void (*setOnScrollStart)(Ark_NativePointer node,
                             const Opt_Callback_Void* event);
    void (*setOnScrollStop)(Ark_NativePointer node,
                            const Opt_Callback_Void* event);
    void (*setOnItemDelete)(Ark_NativePointer node,
                            const Opt_Callback_Number_Boolean* event);
    void (*setOnItemMove)(Ark_NativePointer node,
                          const Opt_Callback_Number_Number_Boolean* event);
    void (*setOnItemDragStart)(Ark_NativePointer node,
                               const ListAttribute_onItemDragStart_event_type* event);
    void (*setOnItemDragEnter)(Ark_NativePointer node,
                               const Opt_Callback_ItemDragInfo_Void* event);
    void (*setOnItemDragMove)(Ark_NativePointer node,
                              const Opt_Callback_ItemDragInfo_Number_Number_Void* event);
    void (*setOnItemDragLeave)(Ark_NativePointer node,
                               const Opt_Callback_ItemDragInfo_Number_Void* event);
    void (*setOnItemDrop)(Ark_NativePointer node,
                          const Opt_Callback_ItemDragInfo_Number_Number_Boolean_Void* event);
    void (*setOnScrollFrameBegin)(Ark_NativePointer node,
                                  const Opt_Callback_Number_ScrollState_Literal_Number_offsetRemain* event);
} GENERATED_ArkUIListModifier;

typedef struct GENERATED_ArkUIListItemModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setListItemOptions0)(Ark_NativePointer node,
                                const Opt_ListItemOptions* value);
    void (*setListItemOptions1)(Ark_NativePointer node,
                                const Opt_String* value);
    void (*setSticky)(Ark_NativePointer node,
                      const Opt_Sticky* value);
    void (*setEditable)(Ark_NativePointer node,
                        const Opt_Union_Boolean_EditMode* value);
    void (*setSelectable)(Ark_NativePointer node,
                          const Opt_Boolean* value);
    void (*setSelected)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setSwipeAction)(Ark_NativePointer node,
                           const Opt_SwipeActionOptions* value);
    void (*setOnSelect)(Ark_NativePointer node,
                        const Opt_Callback_Boolean_Void* event);
    void (*set_onChangeEvent_selected)(Ark_NativePointer node,
                                       const Callback_Number_Void* callback);
} GENERATED_ArkUIListItemModifier;

typedef struct GENERATED_ArkUINavDestinationModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setNavDestinationOptions)(Ark_NativePointer node);
    void (*setTitle)(Ark_NativePointer node,
                     const Opt_Type_NavDestinationAttribute_title_value* value,
                     const Opt_NavigationTitleOptions* options);
    void (*setHideTitleBar)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setOnShown)(Ark_NativePointer node,
                       const Opt_Callback_Void* callback_);
    void (*setOnHidden)(Ark_NativePointer node,
                        const Opt_Callback_Void* callback_);
    void (*setOnBackPressed)(Ark_NativePointer node,
                             const Opt_Callback_Boolean* callback_);
    void (*setMode)(Ark_NativePointer node,
                    const Opt_NavDestinationMode* value);
    void (*setBackButtonIcon)(Ark_NativePointer node,
                              const Opt_Union_ResourceStr_PixelMap_SymbolGlyphModifier* value);
    void (*setMenus)(Ark_NativePointer node,
                     const Opt_Union_Array_NavigationMenuItem_CustomBuilder* value);
    void (*setOnReady)(Ark_NativePointer node,
                       const Opt_Callback_NavDestinationContext_Void* callback_);
    void (*setOnWillAppear)(Ark_NativePointer node,
                            const Opt_Callback_Void* callback_);
    void (*setOnWillDisappear)(Ark_NativePointer node,
                               const Opt_Callback_Void* callback_);
    void (*setOnWillShow)(Ark_NativePointer node,
                          const Opt_Callback_Void* callback_);
    void (*setOnWillHide)(Ark_NativePointer node,
                          const Opt_Callback_Void* callback_);
    void (*setIgnoreLayoutSafeArea)(Ark_NativePointer node,
                                    const Opt_Array_LayoutSafeAreaType* types,
                                    const Opt_Array_LayoutSafeAreaEdge* edges);
    void (*setSystemBarStyle)(Ark_NativePointer node,
                              const Opt_CustomObject* style);
} GENERATED_ArkUINavDestinationModifier;

typedef struct GENERATED_ArkUINavigationModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setNavigationOptions0)(Ark_NativePointer node);
    void (*setNavigationOptions1)(Ark_NativePointer node,
                                  Ark_NavPathStack pathInfos);
    void (*setNavBarWidth)(Ark_NativePointer node,
                           const Opt_Length* value);
    void (*setNavBarPosition)(Ark_NativePointer node,
                              const Opt_NavBarPosition* value);
    void (*setNavBarWidthRange)(Ark_NativePointer node,
                                const Opt_Tuple_Dimension_Dimension* value);
    void (*setMinContentWidth)(Ark_NativePointer node,
                               const Opt_Dimension* value);
    void (*setMode)(Ark_NativePointer node,
                    const Opt_NavigationMode* value);
    void (*setBackButtonIcon)(Ark_NativePointer node,
                              const Opt_Union_String_PixelMap_Resource_SymbolGlyphModifier* value);
    void (*setHideNavBar)(Ark_NativePointer node,
                          const Opt_Boolean* value);
    void (*setTitle)(Ark_NativePointer node,
                     const Opt_Type_NavigationAttribute_title_value* value,
                     const Opt_NavigationTitleOptions* options);
    void (*setSubTitle)(Ark_NativePointer node,
                        const Opt_String* value);
    void (*setHideTitleBar)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setHideBackButton)(Ark_NativePointer node,
                              const Opt_Boolean* value);
    void (*setTitleMode)(Ark_NativePointer node,
                         const Opt_NavigationTitleMode* value);
    void (*setMenus)(Ark_NativePointer node,
                     const Opt_Union_Array_NavigationMenuItem_CustomBuilder* value);
    void (*setToolBar)(Ark_NativePointer node,
                       const CustomNodeBuilder* value);
    void (*setToolbarConfiguration)(Ark_NativePointer node,
                                    const Opt_Union_Array_ToolbarItem_CustomBuilder* value,
                                    const Opt_NavigationToolbarOptions* options);
    void (*setHideToolBar)(Ark_NativePointer node,
                           const Opt_Boolean* value);
    void (*setOnTitleModeChange)(Ark_NativePointer node,
                                 const Opt_Callback_NavigationTitleMode_Void* callback_);
    void (*setOnNavBarStateChange)(Ark_NativePointer node,
                                   const Opt_Callback_Boolean_Void* callback_);
    void (*setOnNavigationModeChange)(Ark_NativePointer node,
                                      const Opt_Callback_NavigationMode_Void* callback_);
    void (*setNavDestination)(Ark_NativePointer node,
                              const Opt_Callback_String_Unknown_Void* builder);
    void (*setCustomNavContentTransition)(Ark_NativePointer node,
                                          const Opt_Type_NavigationAttribute_customNavContentTransition_delegate* delegate);
    void (*setIgnoreLayoutSafeArea)(Ark_NativePointer node,
                                    const Opt_Array_LayoutSafeAreaType* types,
                                    const Opt_Array_LayoutSafeAreaEdge* edges);
    void (*setSystemBarStyle)(Ark_NativePointer node,
                              const Opt_CustomObject* style);
} GENERATED_ArkUINavigationModifier;

typedef struct GENERATED_ArkUINavigatorModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setNavigatorOptions)(Ark_NativePointer node,
                                const Opt_Literal_String_target_NavigationType_type* value);
} GENERATED_ArkUINavigatorModifier;

typedef struct GENERATED_ArkUIPathModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setPathOptions)(Ark_NativePointer node,
                           const Opt_PathOptions* options);
    void (*setCommands)(Ark_NativePointer node,
                        const Opt_String* value);
} GENERATED_ArkUIPathModifier;

typedef struct GENERATED_ArkUIRectModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setRectOptions)(Ark_NativePointer node,
                           const Opt_Union_RectOptions_RoundedRectOptions* options);
    void (*setRadiusWidth)(Ark_NativePointer node,
                           const Opt_Union_Number_String* value);
    void (*setRadiusHeight)(Ark_NativePointer node,
                            const Opt_Union_Number_String* value);
    void (*setRadius)(Ark_NativePointer node,
                      const Ark_Union_Number_String_Array_Union_Number_String* value);
} GENERATED_ArkUIRectModifier;

typedef struct GENERATED_ArkUIRichEditorModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setRichEditorOptions0)(Ark_NativePointer node,
                                  const Ark_RichEditorOptions* value);
    void (*setRichEditorOptions1)(Ark_NativePointer node,
                                  const Ark_RichEditorStyledStringOptions* options);
    void (*setOnReady)(Ark_NativePointer node,
                       const Opt_Callback_Void* callback_);
    void (*setOnSelect)(Ark_NativePointer node,
                        const Opt_Callback_RichEditorSelection_Void* callback_);
    void (*setOnSelectionChange)(Ark_NativePointer node,
                                 const Opt_Callback_RichEditorRange_Void* callback_);
    void (*setAboutToIMEInput)(Ark_NativePointer node,
                               const Opt_Callback_RichEditorInsertValue_Boolean* callback_);
    void (*setOnIMEInputComplete)(Ark_NativePointer node,
                                  const Opt_Callback_RichEditorTextSpanResult_Void* callback_);
    void (*setOnDidIMEInput)(Ark_NativePointer node,
                             const Opt_Callback_TextRange_Void* callback_);
    void (*setAboutToDelete)(Ark_NativePointer node,
                             const Opt_Callback_RichEditorDeleteValue_Boolean* callback_);
    void (*setOnDeleteComplete)(Ark_NativePointer node,
                                const Opt_Callback_Void* callback_);
    void (*setCopyOptions)(Ark_NativePointer node,
                           const Opt_CopyOptions* value);
    void (*setBindSelectionMenu)(Ark_NativePointer node,
                                 const Opt_RichEditorSpanType* spanType,
                                 const Opt_CustomNodeBuilder* content,
                                 const Opt_Union_ResponseType_RichEditorResponseType* responseType,
                                 const Opt_SelectionMenuOptions* options);
    void (*setCustomKeyboard)(Ark_NativePointer node,
                              const Opt_CustomNodeBuilder* value,
                              const Opt_KeyboardOptions* options);
    void (*setOnPaste)(Ark_NativePointer node,
                       const Opt_PasteEventCallback* callback_);
    void (*setEnableDataDetector)(Ark_NativePointer node,
                                  const Opt_Boolean* enable);
    void (*setEnablePreviewText)(Ark_NativePointer node,
                                 const Opt_Boolean* enable);
    void (*setDataDetectorConfig)(Ark_NativePointer node,
                                  const Opt_TextDataDetectorConfig* config);
    void (*setPlaceholder)(Ark_NativePointer node,
                           const Opt_ResourceStr* value,
                           const Opt_PlaceholderStyle* style);
    void (*setCaretColor)(Ark_NativePointer node,
                          const Opt_ResourceColor* value);
    void (*setSelectedBackgroundColor)(Ark_NativePointer node,
                                       const Opt_ResourceColor* value);
    void (*setOnEditingChange)(Ark_NativePointer node,
                               const Opt_Callback_Boolean_Void* callback_);
    void (*setEnterKeyType)(Ark_NativePointer node,
                            const Opt_EnterKeyType* value);
    void (*setOnSubmit)(Ark_NativePointer node,
                        const Opt_SubmitCallback* callback_);
    void (*setOnWillChange)(Ark_NativePointer node,
                            const Opt_Callback_RichEditorChangeValue_Boolean* callback_);
    void (*setOnDidChange)(Ark_NativePointer node,
                           const Opt_OnDidChangeCallback* callback_);
    void (*setOnCut)(Ark_NativePointer node,
                     const Opt_Callback_CutEvent_Void* callback_);
    void (*setOnCopy)(Ark_NativePointer node,
                      const Opt_Callback_CopyEvent_Void* callback_);
    void (*setEditMenuOptions)(Ark_NativePointer node,
                               const Opt_EditMenuOptions* editMenu);
    void (*setEnableKeyboardOnFocus)(Ark_NativePointer node,
                                     const Opt_Boolean* isEnabled);
    void (*setEnableHapticFeedback)(Ark_NativePointer node,
                                    const Opt_Boolean* isEnabled);
    void (*setBarState)(Ark_NativePointer node,
                        const Opt_BarState* state);
} GENERATED_ArkUIRichEditorModifier;

typedef struct GENERATED_ArkUIRootModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
} GENERATED_ArkUIRootModifier;

typedef struct GENERATED_ArkUIRowModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setRowOptions)(Ark_NativePointer node,
                          const Opt_RowOptions* options);
    void (*setAlignItems)(Ark_NativePointer node,
                          const Opt_VerticalAlign* value);
    void (*setJustifyContent)(Ark_NativePointer node,
                              const Opt_FlexAlign* value);
    void (*setPointLight)(Ark_NativePointer node,
                          const Opt_PointLightStyle* value);
    void (*setReverse)(Ark_NativePointer node,
                       const Opt_Boolean* isReversed);
} GENERATED_ArkUIRowModifier;

typedef struct GENERATED_ArkUIScrollModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setScrollOptions)(Ark_NativePointer node,
                             const Opt_Scroller* scroller);
    void (*setScrollable)(Ark_NativePointer node,
                          const Opt_ScrollDirection* value);
    void (*setOnScroll)(Ark_NativePointer node,
                        const Opt_Callback_Number_Number_Void* event);
    void (*setOnWillScroll)(Ark_NativePointer node,
                            const Opt_ScrollOnWillScrollCallback* handler);
    void (*setOnDidScroll)(Ark_NativePointer node,
                           const ScrollOnScrollCallback* handler);
    void (*setOnScrollEdge)(Ark_NativePointer node,
                            const Opt_OnScrollEdgeCallback* event);
    void (*setOnScrollStart)(Ark_NativePointer node,
                             const Opt_VoidCallback* event);
    void (*setOnScrollEnd)(Ark_NativePointer node,
                           const Opt_Callback_Void* event);
    void (*setOnScrollStop)(Ark_NativePointer node,
                            const Opt_VoidCallback* event);
    void (*setScrollBar)(Ark_NativePointer node,
                         const Opt_BarState* barState);
    void (*setScrollBarColor)(Ark_NativePointer node,
                              const Opt_Union_Color_Number_String* color);
    void (*setScrollBarWidth)(Ark_NativePointer node,
                              const Opt_Union_Number_String* value);
    void (*setEdgeEffect)(Ark_NativePointer node,
                          const Opt_EdgeEffect* edgeEffect,
                          const Opt_EdgeEffectOptions* options);
    void (*setOnScrollFrameBegin)(Ark_NativePointer node,
                                  const Opt_OnScrollFrameBeginCallback* event);
    void (*setNestedScroll)(Ark_NativePointer node,
                            const Opt_NestedScrollOptions* value);
    void (*setEnableScrollInteraction)(Ark_NativePointer node,
                                       const Opt_Boolean* value);
    void (*setFriction)(Ark_NativePointer node,
                        const Opt_Union_Number_Resource* value);
    void (*setScrollSnap)(Ark_NativePointer node,
                          const Opt_ScrollSnapOptions* value);
    void (*setEnablePaging)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setInitialOffset)(Ark_NativePointer node,
                             const Opt_OffsetOptions* value);
} GENERATED_ArkUIScrollModifier;

typedef struct GENERATED_ArkUIScrollableCommonMethodModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setScrollBar)(Ark_NativePointer node,
                         const Opt_BarState* barState);
    void (*setScrollBarColor)(Ark_NativePointer node,
                              const Opt_Union_Color_Number_String* color);
    void (*setScrollBarWidth)(Ark_NativePointer node,
                              const Opt_Union_Number_String* value);
    void (*setEdgeEffect)(Ark_NativePointer node,
                          const Opt_EdgeEffect* edgeEffect,
                          const Opt_EdgeEffectOptions* options);
    void (*setFadingEdge)(Ark_NativePointer node,
                          const Opt_Boolean* enabled,
                          const Opt_FadingEdgeOptions* options);
    void (*setNestedScroll)(Ark_NativePointer node,
                            const Opt_NestedScrollOptions* value);
    void (*setEnableScrollInteraction)(Ark_NativePointer node,
                                       const Opt_Boolean* value);
    void (*setFriction)(Ark_NativePointer node,
                        const Opt_Union_Number_Resource* value);
    void (*setOnScroll)(Ark_NativePointer node,
                        const Callback_Number_Number_Void* event);
    void (*setOnReachStart)(Ark_NativePointer node,
                            const Opt_Callback_Void* event);
    void (*setOnReachEnd)(Ark_NativePointer node,
                          const Opt_Callback_Void* event);
    void (*setOnScrollStart)(Ark_NativePointer node,
                             const Opt_Callback_Void* event);
    void (*setOnScrollStop)(Ark_NativePointer node,
                            const Opt_Callback_Void* event);
    void (*setFlingSpeedLimit)(Ark_NativePointer node,
                               const Opt_Number* speedLimit);
    void (*setClipContent)(Ark_NativePointer node,
                           const Opt_Union_ContentClipMode_RectShape* clip);
} GENERATED_ArkUIScrollableCommonMethodModifier;

typedef struct GENERATED_ArkUISearchModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSearchOptions)(Ark_NativePointer node,
                             const Opt_SearchOptions* options);
    void (*setSearchButton)(Ark_NativePointer node,
                            const Opt_String* value,
                            const Opt_SearchButtonOptions* option);
    void (*setFontColor)(Ark_NativePointer node,
                         const Opt_ResourceColor* value);
    void (*setSearchIcon)(Ark_NativePointer node,
                          const Opt_Union_IconOptions_SymbolGlyphModifier* value);
    void (*setCancelButton)(Ark_NativePointer node,
                            const Opt_Union_CancelButtonOptions_CancelButtonSymbolOptions* value);
    void (*setTextIndent)(Ark_NativePointer node,
                          const Opt_Dimension* value);
    void (*setInputFilter)(Ark_NativePointer node,
                           const Opt_ResourceStr* value,
                           const Opt_Callback_String_Void* error);
    void (*setOnEditChange)(Ark_NativePointer node,
                            const Opt_Callback_Boolean_Void* callback_);
    void (*setSelectedBackgroundColor)(Ark_NativePointer node,
                                       const Opt_ResourceColor* value);
    void (*setCaretStyle)(Ark_NativePointer node,
                          const Opt_CaretStyle* value);
    void (*setPlaceholderColor)(Ark_NativePointer node,
                                const Opt_ResourceColor* value);
    void (*setPlaceholderFont)(Ark_NativePointer node,
                               const Opt_Font* value);
    void (*setTextFont)(Ark_NativePointer node,
                        const Opt_Font* value);
    void (*setEnterKeyType)(Ark_NativePointer node,
                            const Opt_EnterKeyType* value);
    void (*setOnSubmit0)(Ark_NativePointer node,
                         const Opt_Callback_String_Void* callback_);
    void (*setOnSubmit1)(Ark_NativePointer node,
                         const Opt_SearchSubmitCallback* callback_);
    void (*setOnChange)(Ark_NativePointer node,
                        const Opt_EditableTextOnChangeCallback* callback_);
    void (*setOnTextSelectionChange)(Ark_NativePointer node,
                                     const Opt_OnTextSelectionChangeCallback* callback_);
    void (*setOnContentScroll)(Ark_NativePointer node,
                               const Opt_OnContentScrollCallback* callback_);
    void (*setOnCopy)(Ark_NativePointer node,
                      const Opt_Callback_String_Void* callback_);
    void (*setOnCut)(Ark_NativePointer node,
                     const Opt_Callback_String_Void* callback_);
    void (*setOnPaste)(Ark_NativePointer node,
                       const Opt_OnPasteCallback* callback_);
    void (*setCopyOption)(Ark_NativePointer node,
                          const Opt_CopyOptions* value);
    void (*setMaxLength)(Ark_NativePointer node,
                         const Opt_Number* value);
    void (*setTextAlign)(Ark_NativePointer node,
                         const Opt_TextAlign* value);
    void (*setEnableKeyboardOnFocus)(Ark_NativePointer node,
                                     const Opt_Boolean* value);
    void (*setSelectionMenuHidden)(Ark_NativePointer node,
                                   const Opt_Boolean* value);
    void (*setMinFontSize)(Ark_NativePointer node,
                           const Opt_Union_Number_String_Resource* value);
    void (*setMaxFontSize)(Ark_NativePointer node,
                           const Opt_Union_Number_String_Resource* value);
    void (*setCustomKeyboard)(Ark_NativePointer node,
                              const Opt_CustomNodeBuilder* value,
                              const Opt_KeyboardOptions* options);
    void (*setDecoration)(Ark_NativePointer node,
                          const Opt_TextDecorationOptions* value);
    void (*setLetterSpacing)(Ark_NativePointer node,
                             const Opt_Union_Number_String_Resource* value);
    void (*setLineHeight)(Ark_NativePointer node,
                          const Opt_Union_Number_String_Resource* value);
    void (*setType)(Ark_NativePointer node,
                    const Opt_SearchType* value);
    void (*setFontFeature)(Ark_NativePointer node,
                           const Opt_String* value);
    void (*setOnWillInsert)(Ark_NativePointer node,
                            const Opt_Callback_InsertValue_Boolean* callback_);
    void (*setOnDidInsert)(Ark_NativePointer node,
                           const Opt_Callback_InsertValue_Void* callback_);
    void (*setOnWillDelete)(Ark_NativePointer node,
                            const Opt_Callback_DeleteValue_Boolean* callback_);
    void (*setOnDidDelete)(Ark_NativePointer node,
                           const Opt_Callback_DeleteValue_Void* callback_);
    void (*setEditMenuOptions)(Ark_NativePointer node,
                               const Opt_EditMenuOptions* editMenu);
    void (*setEnablePreviewText)(Ark_NativePointer node,
                                 const Opt_Boolean* enable);
    void (*setEnableHapticFeedback)(Ark_NativePointer node,
                                    const Opt_Boolean* isEnabled);
    void (*set_onChangeEvent_value)(Ark_NativePointer node,
                                    const Callback_String_Void* callback);
} GENERATED_ArkUISearchModifier;

typedef struct GENERATED_ArkUISecurityComponentMethodModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setIconSize)(Ark_NativePointer node,
                        const Opt_Dimension* value);
} GENERATED_ArkUISecurityComponentMethodModifier;

typedef struct GENERATED_ArkUISelectModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSelectOptions)(Ark_NativePointer node,
                             const Array_SelectOption* options);
    void (*setMenuItemContentModifier)(Ark_NativePointer node,
                                       const Opt_ContentModifier* modifier);
    void (*set_onChangeEvent_selected)(Ark_NativePointer node,
                                       const Callback_Number_Void* callback);
    void (*set_onChangeEvent_value)(Ark_NativePointer node,
                                    const Callback_Number_Void* callback);
} GENERATED_ArkUISelectModifier;

typedef struct GENERATED_ArkUIShapeModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setShapeOptions)(Ark_NativePointer node);
} GENERATED_ArkUIShapeModifier;

typedef struct GENERATED_ArkUISideBarContainerModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSideBarContainerOptions)(Ark_NativePointer node);
    void (*setMinSideBarWidth0)(Ark_NativePointer node,
                                const Opt_Number* value);
    void (*setMinSideBarWidth1)(Ark_NativePointer node,
                                const Opt_Length* value);
    void (*set_onChangeEvent_showSideBar)(Ark_NativePointer node,
                                          const Callback_Number_Void* callback);
} GENERATED_ArkUISideBarContainerModifier;

typedef struct GENERATED_ArkUISliderModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setBlockColor)(Ark_NativePointer node,
                          const Opt_ResourceColor* value);
    void (*setTrackColor)(Ark_NativePointer node,
                          const Opt_Union_ResourceColor_LinearGradient* value);
    void (*setSelectedColor)(Ark_NativePointer node,
                             const Opt_ResourceColor* value);
    void (*setMinLabel)(Ark_NativePointer node,
                        const Opt_String* value);
    void (*setMaxLabel)(Ark_NativePointer node,
                        const Opt_String* value);
    void (*setShowSteps)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setShowTips)(Ark_NativePointer node,
                        const Opt_Boolean* value,
                        const Opt_ResourceStr* content);
    void (*set_onChangeEvent_value)(Ark_NativePointer node,
                                    const Callback_Number_Void* callback);
} GENERATED_ArkUISliderModifier;

typedef struct GENERATED_ArkUISpanModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSpanOptions)(Ark_NativePointer node,
                           const Ark_Union_String_Resource* value);
    void (*setFont)(Ark_NativePointer node,
                    const Opt_Font* value);
    void (*setFontColor)(Ark_NativePointer node,
                         const Opt_ResourceColor* value);
    void (*setFontSize)(Ark_NativePointer node,
                        const Opt_Union_Number_String_Resource* value);
    void (*setFontStyle)(Ark_NativePointer node,
                         const Opt_FontStyle* value);
    void (*setFontWeight)(Ark_NativePointer node,
                          const Opt_Union_Number_FontWeight_String* value);
    void (*setFontFamily)(Ark_NativePointer node,
                          const Opt_Union_String_Resource* value);
    void (*setDecoration)(Ark_NativePointer node,
                          const Opt_DecorationStyleInterface* value);
    void (*setLetterSpacing)(Ark_NativePointer node,
                             const Opt_Union_Number_String* value);
    void (*setTextCase)(Ark_NativePointer node,
                        const Opt_TextCase* value);
    void (*setLineHeight)(Ark_NativePointer node,
                          const Opt_Length* value);
    void (*setTextShadow)(Ark_NativePointer node,
                          const Opt_Union_ShadowOptions_Array_ShadowOptions* value);
} GENERATED_ArkUISpanModifier;

typedef struct GENERATED_ArkUIStackModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setStackOptions)(Ark_NativePointer node,
                            const Opt_StackOptions* options);
    void (*setAlignContent)(Ark_NativePointer node,
                            const Opt_Alignment* value);
    void (*setPointLight)(Ark_NativePointer node,
                          const Opt_PointLightStyle* value);
} GENERATED_ArkUIStackModifier;

typedef struct GENERATED_ArkUISwiperModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSwiperOptions)(Ark_NativePointer node,
                             const Opt_SwiperController* controller);
    void (*setIndex)(Ark_NativePointer node,
                     const Opt_Number* value);
    void (*setAutoPlay)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setInterval)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setIndicator0)(Ark_NativePointer node,
                          const Opt_Union_DotIndicator_DigitIndicator_Boolean* value);
    void (*setIndicator1)(Ark_NativePointer node,
                          const Opt_IndicatorComponentController* controller);
    void (*setDisplayArrow)(Ark_NativePointer node,
                            const Opt_Union_ArrowStyle_Boolean* value,
                            const Opt_Boolean* isHoverShow);
    void (*setLoop)(Ark_NativePointer node,
                    const Opt_Boolean* value);
    void (*setDuration)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setVertical)(Ark_NativePointer node,
                        const Opt_Boolean* value);
    void (*setItemSpace)(Ark_NativePointer node,
                         const Opt_Union_Number_String* value);
    void (*setDisplayMode)(Ark_NativePointer node,
                           const Opt_SwiperDisplayMode* value);
    void (*setCachedCount)(Ark_NativePointer node,
                           const Opt_Number* value);
    void (*setDisplayCount)(Ark_NativePointer node,
                            const Opt_Union_Number_String_SwiperAutoFill* value,
                            const Opt_Boolean* swipeByGroup);
    void (*setEffectMode)(Ark_NativePointer node,
                          const Opt_EdgeEffect* value);
    void (*setDisableSwipe)(Ark_NativePointer node,
                            const Opt_Boolean* value);
    void (*setCurve)(Ark_NativePointer node,
                     const Opt_Union_Curve_String_ICurve* value);
    void (*setOnChange)(Ark_NativePointer node,
                        const Opt_Callback_Number_Void* event);
    void (*setIndicatorStyle)(Ark_NativePointer node,
                              const Opt_IndicatorStyle* value);
    void (*setPrevMargin)(Ark_NativePointer node,
                          const Opt_Length* value,
                          const Opt_Boolean* ignoreBlank);
    void (*setNextMargin)(Ark_NativePointer node,
                          const Opt_Length* value,
                          const Opt_Boolean* ignoreBlank);
    void (*setOnAnimationStart)(Ark_NativePointer node,
                                const Opt_OnSwiperAnimationStartCallback* event);
    void (*setOnAnimationEnd)(Ark_NativePointer node,
                              const Opt_OnSwiperAnimationEndCallback* event);
    void (*setOnGestureSwipe)(Ark_NativePointer node,
                              const Opt_OnSwiperGestureSwipeCallback* event);
    void (*setNestedScroll)(Ark_NativePointer node,
                            const Opt_SwiperNestedScrollMode* value);
    void (*setCustomContentTransition)(Ark_NativePointer node,
                                       const Opt_SwiperContentAnimatedTransition* transition);
    void (*setOnContentDidScroll)(Ark_NativePointer node,
                                  const Opt_ContentDidScrollCallback* handler);
    void (*setIndicatorInteractive)(Ark_NativePointer node,
                                    const Opt_Boolean* value);
    void (*set_onChangeEvent_index)(Ark_NativePointer node,
                                    const Callback_Number_Void* callback);
} GENERATED_ArkUISwiperModifier;

typedef struct GENERATED_ArkUISymbolGlyphModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSymbolGlyphOptions)(Ark_NativePointer node,
                                  const Opt_CustomObject* value);
    void (*setFontSize)(Ark_NativePointer node,
                        const Opt_Union_Number_String_Resource* value);
    void (*setFontColor)(Ark_NativePointer node,
                         const Opt_Array_ResourceColor* value);
    void (*setFontWeight)(Ark_NativePointer node,
                          const Opt_Union_Number_FontWeight_String* value);
    void (*setEffectStrategy)(Ark_NativePointer node,
                              const Opt_SymbolEffectStrategy* value);
    void (*setRenderingStrategy)(Ark_NativePointer node,
                                 const Opt_SymbolRenderingStrategy* value);
    void (*setSymbolEffect0)(Ark_NativePointer node,
                             const Opt_SymbolEffect* symbolEffect,
                             const Opt_Boolean* isActive);
    void (*setSymbolEffect1)(Ark_NativePointer node,
                             const Opt_SymbolEffect* symbolEffect,
                             const Opt_Number* triggerValue);
} GENERATED_ArkUISymbolGlyphModifier;

typedef struct GENERATED_ArkUITabContentModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTabContentOptions)(Ark_NativePointer node);
    void (*setTabBar0)(Ark_NativePointer node,
                       const Opt_Type_TabContentAttribute_tabBar_value* value);
    void (*setTabBar1)(Ark_NativePointer node,
                       const Opt_Union_SubTabBarStyle_BottomTabBarStyle* value);
} GENERATED_ArkUITabContentModifier;

typedef struct GENERATED_ArkUITabsModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTabsOptions)(Ark_NativePointer node,
                           const Opt_TabsOptions* options);
    void (*setBarMode)(Ark_NativePointer node,
                       const Opt_BarMode* value);
    void (*setBarWidth)(Ark_NativePointer node,
                        const Opt_Length* value);
    void (*setBarHeight)(Ark_NativePointer node,
                         const Opt_Length* value);
    void (*setBarPosition)(Ark_NativePointer node,
                           const Opt_BarPosition* value);
    void (*setAnimationDuration)(Ark_NativePointer node,
                                 const Opt_Number* value);
    void (*setScrollable)(Ark_NativePointer node,
                          const Opt_Boolean* value);
    void (*set_onChangeEvent_index)(Ark_NativePointer node,
                                    const Callback_Number_Void* callback);
} GENERATED_ArkUITabsModifier;

typedef struct GENERATED_ArkUITest1Modifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTest1Options)(Ark_NativePointer node);
    void (*setTestBoolean)(Ark_NativePointer node,
                           const Opt_Boolean* value);
    void (*setTestNumber)(Ark_NativePointer node,
                          const Opt_Number* value);
    void (*setTestString)(Ark_NativePointer node,
                          const Opt_String* value);
    void (*setTestEnum)(Ark_NativePointer node,
                        const Opt_EnumDTS* value);
    void (*setTestFunction)(Ark_NativePointer node,
                            const Opt_Callback_Number_Boolean* value);
    void (*setTestBasicMix)(Ark_NativePointer node,
                            const Opt_Number* v1,
                            const Opt_String* v2,
                            const Opt_Number* v3);
    void (*setTestBooleanUndefined)(Ark_NativePointer node,
                                    const Opt_Boolean* value);
    void (*setTestNumberUndefined)(Ark_NativePointer node,
                                   const Opt_Number* value);
    void (*setTestStringUndefined)(Ark_NativePointer node,
                                   const Opt_String* value);
    void (*setTestEnumUndefined)(Ark_NativePointer node,
                                 const Opt_EnumDTS* value);
    void (*setTestFunctionUndefined)(Ark_NativePointer node,
                                     const Opt_Callback_Number_Opt_Boolean* value);
    void (*setTestUnionNumberEnum)(Ark_NativePointer node,
                                   const Opt_Union_Number_EnumDTS* val);
    void (*setTestUnionBooleanString)(Ark_NativePointer node,
                                      const Opt_Union_Boolean_String* val);
    void (*setTestUnionStringNumber)(Ark_NativePointer node,
                                     const Opt_Union_String_Number* val);
    void (*setTestUnionBooleanStringNumberUndefined)(Ark_NativePointer node,
                                                     const Opt_Union_Boolean_String_Number* val);
    void (*setTestUnionWithGenericArray)(Ark_NativePointer node,
                                         const Opt_Union_Number_Array_String* value);
    void (*setTestUnionWithArrayType)(Ark_NativePointer node,
                                      const Opt_Union_Number_Array_String* value);
    void (*setTestBooleanArray)(Ark_NativePointer node,
                                const Opt_Array_Boolean* value);
    void (*setTestNumberArray)(Ark_NativePointer node,
                               const Opt_Array_Number* value);
    void (*setTestStringArray)(Ark_NativePointer node,
                               const Opt_Array_String* value);
    void (*setTestEnumArray)(Ark_NativePointer node,
                             const Opt_Array_EnumDTS* value);
    void (*setTestArrayMix)(Ark_NativePointer node,
                            const Opt_Array_Number* v1,
                            const Opt_Array_String* v2,
                            const Opt_Array_EnumDTS* v3);
    void (*setTestTupleBooleanNumber)(Ark_NativePointer node,
                                      const Opt_Tuple_Boolean_Number* value);
    void (*setTestTupleNumberStringEnum)(Ark_NativePointer node,
                                         const Opt_Tuple_Number_String_EnumDTS* value);
    void (*setTestTupleOptional)(Ark_NativePointer node,
                                 const Opt_Tuple_Number_String_Boolean_EnumDTS* value);
    void (*setTestTupleUnion)(Ark_NativePointer node,
                              const Opt_Type_Test1Attribute_testTupleUnion_value* value);
    void (*setTestArrayRefBoolean)(Ark_NativePointer node,
                                   const Opt_Array_Boolean* value);
    void (*setTestArrayRefNumber)(Ark_NativePointer node,
                                  const Opt_Array_Number* value);
    void (*setTestBooleanInterface)(Ark_NativePointer node,
                                    const Opt_BooleanInterfaceDTS* value);
    void (*setTestNumberInterface)(Ark_NativePointer node,
                                   const Opt_NumberInterfaceDTS* value);
    void (*setTestStringInterface)(Ark_NativePointer node,
                                   const Opt_StringInterfaceDTS* value);
    void (*setTestUnionInterface)(Ark_NativePointer node,
                                  const Opt_UnionInterfaceDTS* value);
    void (*setTestUnionOptional)(Ark_NativePointer node,
                                 const Opt_UnionOptionalInterfaceDTS* value);
    void (*setTestTupleInterface)(Ark_NativePointer node,
                                  const Opt_TupleInterfaceDTS* value);
    void (*setTestOptionInterface)(Ark_NativePointer node,
                                   const Opt_OptionInterfaceDTS* value);
    void (*setTestArrayRefNumberInterface)(Ark_NativePointer node,
                                           const Opt_ArrayRefNumberInterfaceDTS* value);
    void (*setTestBooleanInterfaceOption)(Ark_NativePointer node,
                                          const Opt_BooleanInterfaceDTS* value);
    void (*setTestBooleanInterfaceArray)(Ark_NativePointer node,
                                         const Opt_Array_BooleanInterfaceDTS* value);
    void (*setTestBooleanInterfaceArrayRef)(Ark_NativePointer node,
                                            const Opt_Array_BooleanInterfaceDTS* value);
    void (*setTestInterfaceMixed)(Ark_NativePointer node,
                                  const Opt_UnionInterfaceDTS* v1,
                                  const Opt_Number* v2,
                                  const Opt_TupleInterfaceDTS* v3);
    void (*setTestClass)(Ark_NativePointer node,
                         const Opt_ClassDTS* value);
    void (*setTestClassWithConstructor)(Ark_NativePointer node,
                                        const Opt_ClassWithConstructorDTS* value);
    void (*setTestClassWithConstructorAndFields)(Ark_NativePointer node,
                                                 const Opt_ClassWithConstructorAndFieldsDTS* value);
    void (*setTestClassWithConstructorAndMethods)(Ark_NativePointer node,
                                                  const Opt_ClassWithConstructorAndMethodsDTS* value);
    void (*setTestClassWithConstructorAndStaticMethods)(Ark_NativePointer node,
                                                        const Opt_ClassWithConstructorAndStaticMethodsDTS* value);
    void (*setTestClassWithConstructorAndFieldsAndMethods)(Ark_NativePointer node,
                                                           const Opt_ClassWithConstructorAndFieldsAndMethodsDTS* value);
    void (*setTestClassWithConstructorAndNonOptionalParams)(Ark_NativePointer node,
                                                            const Opt_ClassWithConstructorAndNonOptionalParamsDTS* value);
    void (*setTestClassWithConstructorAndSomeOptionalParams)(Ark_NativePointer node,
                                                             const Opt_ClassWithConstructorAndSomeOptionalParamsDTS* value);
    void (*setTestClassWithConstructorAndAllOptionalParams)(Ark_NativePointer node,
                                                            const Opt_ClassWithConstructorAndAllOptionalParamsDTS* value);
    void (*setTestClassWithConstructorAndWithoutParams)(Ark_NativePointer node,
                                                        const Opt_ClassWithConstructorAndWithoutParamsDTS* value);
} GENERATED_ArkUITest1Modifier;

typedef struct GENERATED_ArkUITextModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTextOptions)(Ark_NativePointer node,
                           const Opt_Union_String_Resource* content,
                           const Opt_TextOptions* value);
    void (*setFont)(Ark_NativePointer node,
                    const Opt_Font* value);
    void (*setFontColor)(Ark_NativePointer node,
                         const Opt_ResourceColor* value);
    void (*setMaxLines)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setFontSize)(Ark_NativePointer node,
                        const Opt_Union_Number_String_Resource* value);
    void (*setFontWeight)(Ark_NativePointer node,
                          const Opt_Union_Number_FontWeight_String* value);
    void (*setTextOverflow)(Ark_NativePointer node,
                            const Opt_TextOverflowOptions* options);
    void (*setTextAlign)(Ark_NativePointer node,
                         const Opt_TextAlign* value);
    void (*setLineHeight)(Ark_NativePointer node,
                          const Opt_Union_Number_String_Resource* value);
} GENERATED_ArkUITextModifier;

typedef struct GENERATED_ArkUITextInputModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTextInputOptions)(Ark_NativePointer node,
                                const Opt_TextInputOptions* value);
    void (*setType)(Ark_NativePointer node,
                    const Opt_InputType* value);
    void (*setContentType)(Ark_NativePointer node,
                           const Opt_ContentType* value);
    void (*setPlaceholderColor)(Ark_NativePointer node,
                                const Opt_ResourceColor* value);
    void (*setTextOverflow)(Ark_NativePointer node,
                            const Opt_TextOverflow* value);
    void (*setTextIndent)(Ark_NativePointer node,
                          const Opt_Dimension* value);
    void (*setPlaceholderFont)(Ark_NativePointer node,
                               const Opt_Font* value);
    void (*setEnterKeyType)(Ark_NativePointer node,
                            const Opt_EnterKeyType* value);
    void (*setCaretColor)(Ark_NativePointer node,
                          const Opt_ResourceColor* value);
    void (*setOnEditChanged)(Ark_NativePointer node,
                             const Opt_Callback_Boolean_Void* callback_);
    void (*setOnEditChange)(Ark_NativePointer node,
                            const Opt_Callback_Boolean_Void* callback_);
    void (*setOnSubmit)(Ark_NativePointer node,
                        const Opt_OnSubmitCallback* callback_);
    void (*setOnChange)(Ark_NativePointer node,
                        const Opt_EditableTextOnChangeCallback* callback_);
    void (*setOnTextSelectionChange)(Ark_NativePointer node,
                                     const Opt_OnTextSelectionChangeCallback* callback_);
    void (*setOnContentScroll)(Ark_NativePointer node,
                               const Opt_OnContentScrollCallback* callback_);
    void (*setMaxLength)(Ark_NativePointer node,
                         const Opt_Number* value);
    void (*setFontColor)(Ark_NativePointer node,
                         const Opt_ResourceColor* value);
    void (*setFontSize)(Ark_NativePointer node,
                        const Opt_Length* value);
    void (*setFontStyle)(Ark_NativePointer node,
                         const Opt_FontStyle* value);
    void (*setFontWeight)(Ark_NativePointer node,
                          const Opt_Union_Number_FontWeight_String* value);
    void (*setFontFamily)(Ark_NativePointer node,
                          const Opt_ResourceStr* value);
    void (*setInputFilter)(Ark_NativePointer node,
                           const Opt_ResourceStr* value,
                           const Opt_Callback_String_Void* error);
    void (*setOnCopy)(Ark_NativePointer node,
                      const Opt_Callback_String_Void* callback_);
    void (*setOnCut)(Ark_NativePointer node,
                     const Opt_Callback_String_Void* callback_);
    void (*setOnPaste)(Ark_NativePointer node,
                       const Opt_OnPasteCallback* callback_);
    void (*setCopyOption)(Ark_NativePointer node,
                          const Opt_CopyOptions* value);
    void (*setShowPasswordIcon)(Ark_NativePointer node,
                                const Opt_Boolean* value);
    void (*setTextAlign)(Ark_NativePointer node,
                         const Opt_TextAlign* value);
    void (*setStyle)(Ark_NativePointer node,
                     const Opt_Union_TextInputStyle_TextContentStyle* value);
    void (*setCaretStyle)(Ark_NativePointer node,
                          const Opt_CaretStyle* value);
    void (*setSelectedBackgroundColor)(Ark_NativePointer node,
                                       const Opt_ResourceColor* value);
    void (*setCaretPosition)(Ark_NativePointer node,
                             const Opt_Number* value);
    void (*setEnableKeyboardOnFocus)(Ark_NativePointer node,
                                     const Opt_Boolean* value);
    void (*setPasswordIcon)(Ark_NativePointer node,
                            const Opt_PasswordIcon* value);
    void (*setShowError)(Ark_NativePointer node,
                         const Opt_ResourceStr* value);
    void (*setShowUnit)(Ark_NativePointer node,
                        const Opt_CustomNodeBuilder* value);
    void (*setShowUnderline)(Ark_NativePointer node,
                             const Opt_Boolean* value);
    void (*setUnderlineColor)(Ark_NativePointer node,
                              const Opt_Union_ResourceColor_UnderlineColor* value);
    void (*setSelectionMenuHidden)(Ark_NativePointer node,
                                   const Opt_Boolean* value);
    void (*setBarState)(Ark_NativePointer node,
                        const Opt_BarState* value);
    void (*setMaxLines)(Ark_NativePointer node,
                        const Opt_Number* value);
    void (*setWordBreak)(Ark_NativePointer node,
                         const Opt_WordBreak* value);
    void (*setLineBreakStrategy)(Ark_NativePointer node,
                                 const Opt_LineBreakStrategy* strategy);
    void (*setCustomKeyboard)(Ark_NativePointer node,
                              const Opt_CustomNodeBuilder* value,
                              const Opt_KeyboardOptions* options);
    void (*setShowCounter)(Ark_NativePointer node,
                           const Opt_Boolean* value,
                           const Opt_InputCounterOptions* options);
    void (*setCancelButton0)(Ark_NativePointer node,
                             const Opt_CancelButtonOptions* options);
    void (*setCancelButton1)(Ark_NativePointer node,
                             const Opt_CancelButtonSymbolOptions* symbolOptions);
    void (*setSelectAll)(Ark_NativePointer node,
                         const Opt_Boolean* value);
    void (*setMinFontSize)(Ark_NativePointer node,
                           const Opt_Union_Number_String_Resource* value);
    void (*setMaxFontSize)(Ark_NativePointer node,
                           const Opt_Union_Number_String_Resource* value);
    void (*setHeightAdaptivePolicy)(Ark_NativePointer node,
                                    const Opt_TextHeightAdaptivePolicy* value);
    void (*setEnableAutoFill)(Ark_NativePointer node,
                              const Opt_Boolean* value);
    void (*setDecoration)(Ark_NativePointer node,
                          const Opt_TextDecorationOptions* value);
    void (*setLetterSpacing)(Ark_NativePointer node,
                             const Opt_Union_Number_String_Resource* value);
    void (*setLineHeight)(Ark_NativePointer node,
                          const Opt_Union_Number_String_Resource* value);
    void (*setPasswordRules)(Ark_NativePointer node,
                             const Opt_String* value);
    void (*setFontFeature)(Ark_NativePointer node,
                           const Opt_String* value);
    void (*setShowPassword)(Ark_NativePointer node,
                            const Opt_Boolean* visible);
    void (*setOnSecurityStateChange)(Ark_NativePointer node,
                                     const Opt_Callback_Boolean_Void* callback_);
    void (*setOnWillInsert)(Ark_NativePointer node,
                            const Opt_Callback_InsertValue_Boolean* callback_);
    void (*setOnDidInsert)(Ark_NativePointer node,
                           const Opt_Callback_InsertValue_Void* callback_);
    void (*setOnWillDelete)(Ark_NativePointer node,
                            const Opt_Callback_DeleteValue_Boolean* callback_);
    void (*setOnDidDelete)(Ark_NativePointer node,
                           const Opt_Callback_DeleteValue_Void* callback_);
    void (*setEditMenuOptions)(Ark_NativePointer node,
                               const Opt_EditMenuOptions* editMenu);
    void (*setEnablePreviewText)(Ark_NativePointer node,
                                 const Opt_Boolean* enable);
    void (*setEnableHapticFeedback)(Ark_NativePointer node,
                                    const Opt_Boolean* isEnabled);
    void (*set_onChangeEvent_text)(Ark_NativePointer node,
                                   const Callback_ResourceStr_Void* callback);
} GENERATED_ArkUITextInputModifier;

typedef struct GENERATED_ArkUITextPickerModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setTextPickerOptions)(Ark_NativePointer node,
                                 const Opt_TextPickerOptions* options);
    void (*setDefaultPickerItemHeight)(Ark_NativePointer node,
                                       const Opt_Union_Number_String* value);
    void (*setCanLoop)(Ark_NativePointer node,
                       const Opt_Boolean* value);
    void (*setDisappearTextStyle)(Ark_NativePointer node,
                                  const Opt_PickerTextStyle* value);
    void (*setTextStyle)(Ark_NativePointer node,
                         const Opt_PickerTextStyle* value);
    void (*setSelectedTextStyle)(Ark_NativePointer node,
                                 const Opt_PickerTextStyle* value);
    void (*setOnAccept)(Ark_NativePointer node,
                        const Opt_Callback_String_Number_Void* callback_);
    void (*setOnCancel)(Ark_NativePointer node,
                        const Opt_Callback_Void* callback_);
    void (*setOnChange)(Ark_NativePointer node,
                        const Opt_Type_TextPickerAttribute_onChange_callback* callback_);
    void (*setOnScrollStop)(Ark_NativePointer node,
                            const Opt_TextPickerScrollStopCallback* callback_);
    void (*setSelectedIndex)(Ark_NativePointer node,
                             const Opt_Union_Number_Array_Number* value);
    void (*setDivider)(Ark_NativePointer node,
                       const Opt_DividerOptions* value);
    void (*setGradientHeight)(Ark_NativePointer node,
                              const Opt_Dimension* value);
    void (*set_onChangeEvent_selected)(Ark_NativePointer node,
                                       const Callback_Union_Number_Array_Number_Void* callback);
    void (*set_onChangeEvent_value)(Ark_NativePointer node,
                                    const Callback_Union_String_Array_String_Void* callback);
} GENERATED_ArkUITextPickerModifier;

typedef struct GENERATED_ArkUIToggleModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setToggleOptions)(Ark_NativePointer node,
                             const Ark_ToggleOptions* options);
    void (*set_onChangeEvent_isOn)(Ark_NativePointer node,
                                   const Callback_Boolean_Void* callback);
} GENERATED_ArkUIToggleModifier;

typedef struct GENERATED_ArkUIVectorModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setVectorOptions)(Ark_NativePointer node);
    void (*setTestVector1)(Ark_NativePointer node,
                           const Opt_Vector1* value);
    void (*setTestVector2)(Ark_NativePointer node,
                           const Opt_Vector2* value);
    void (*setTestUnionVector1Number)(Ark_NativePointer node,
                                      const Opt_Union_Vector1_Number* value);
    void (*setTestUnionVector2Number)(Ark_NativePointer node,
                                      const Opt_Union_Vector2_Number* value);
} GENERATED_ArkUIVectorModifier;

typedef struct GENERATED_ArkUIWebModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setWebOptions)(Ark_NativePointer node);
    void (*setOnNativeEmbedLifecycleChange)(Ark_NativePointer node,
                                            const Opt_Callback_NativeEmbedDataInfo_Void* callback_);
    void (*setOnRenderExited0)(Ark_NativePointer node,
                               const Opt_Callback_OnRenderExitedEvent_Void* callback_);
    void (*setOnRenderExited1)(Ark_NativePointer node,
                               const Opt_Callback_Opt_Literal_Object_detail_Boolean* callback_);
    void (*setOnHttpErrorReceive)(Ark_NativePointer node,
                                  const Opt_Callback_OnHttpErrorReceiveEvent_Void* callback_);
} GENERATED_ArkUIWebModifier;

// Accessors

typedef struct GENERATED_ArkUIAccessibilityHoverEventAccessor {
    void (*destroyPeer)(Ark_AccessibilityHoverEvent peer);
    Ark_AccessibilityHoverEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_AccessibilityHoverType (*getType)(Ark_AccessibilityHoverEvent peer);
    void (*setType)(Ark_AccessibilityHoverEvent peer,
                    Ark_AccessibilityHoverType type);
    Ark_Number (*getX)(Ark_AccessibilityHoverEvent peer);
    void (*setX)(Ark_AccessibilityHoverEvent peer,
                 const Ark_Number* x);
    Ark_Number (*getY)(Ark_AccessibilityHoverEvent peer);
    void (*setY)(Ark_AccessibilityHoverEvent peer,
                 const Ark_Number* y);
    Ark_Number (*getDisplayX)(Ark_AccessibilityHoverEvent peer);
    void (*setDisplayX)(Ark_AccessibilityHoverEvent peer,
                        const Ark_Number* displayX);
    Ark_Number (*getDisplayY)(Ark_AccessibilityHoverEvent peer);
    void (*setDisplayY)(Ark_AccessibilityHoverEvent peer,
                        const Ark_Number* displayY);
    Ark_Number (*getWindowX)(Ark_AccessibilityHoverEvent peer);
    void (*setWindowX)(Ark_AccessibilityHoverEvent peer,
                       const Ark_Number* windowX);
    Ark_Number (*getWindowY)(Ark_AccessibilityHoverEvent peer);
    void (*setWindowY)(Ark_AccessibilityHoverEvent peer,
                       const Ark_Number* windowY);
} GENERATED_ArkUIAccessibilityHoverEventAccessor;

typedef struct GENERATED_ArkUIAlertDialogAccessor {
    void (*show)(const Ark_Type_AlertDialog_show_value* value);
} GENERATED_ArkUIAlertDialogAccessor;

typedef struct GENERATED_ArkUIAnimationExtenderAccessor {
    void (*SetClipRect)(Ark_NativePointer node,
                        Ark_Float32 x,
                        Ark_Float32 y,
                        Ark_Float32 width,
                        Ark_Float32 height);
    void (*OpenImplicitAnimation)(const Ark_AnimateParam* param);
    void (*CloseImplicitAnimation)();
    void (*StartDoubleAnimation)(Ark_NativePointer node,
                                 const Ark_DoubleAnimationParam* param);
    void (*AnimationTranslate)(Ark_NativePointer node,
                               const Ark_TranslateOptions* options);
} GENERATED_ArkUIAnimationExtenderAccessor;

typedef struct GENERATED_ArkUIAppearSymbolEffectAccessor {
    void (*destroyPeer)(Ark_AppearSymbolEffect peer);
    Ark_AppearSymbolEffect (*ctor)(const Opt_EffectScope* scope);
    Ark_NativePointer (*getFinalizer)();
    Opt_EffectScope (*getScope)(Ark_AppearSymbolEffect peer);
    void (*setScope)(Ark_AppearSymbolEffect peer,
                     Ark_EffectScope scope);
} GENERATED_ArkUIAppearSymbolEffectAccessor;

typedef struct GENERATED_ArkUIBackgroundColorStyleAccessor {
    void (*destroyPeer)(Ark_BackgroundColorStyle peer);
    Ark_BackgroundColorStyle (*ctor)(const Ark_TextBackgroundStyle* textBackgroundStyle);
    Ark_NativePointer (*getFinalizer)();
    Ark_TextBackgroundStyle (*getTextBackgroundStyle)(Ark_BackgroundColorStyle peer);
} GENERATED_ArkUIBackgroundColorStyleAccessor;

typedef struct GENERATED_ArkUIBaseContextAccessor {
    void (*destroyPeer)(Ark_BaseContext peer);
    Ark_BaseContext (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*getStageMode)(Ark_BaseContext peer);
    void (*setStageMode)(Ark_BaseContext peer,
                         Ark_Boolean stageMode);
} GENERATED_ArkUIBaseContextAccessor;

typedef struct GENERATED_ArkUIBaseEventAccessor {
    void (*destroyPeer)(Ark_BaseEvent peer);
    Ark_BaseEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*getModifierKeyState)(Ark_VMContext vmContext,
                                       Ark_BaseEvent peer,
                                       const Array_String* keys);
    Ark_EventTarget (*getTarget)(Ark_BaseEvent peer);
    void (*setTarget)(Ark_BaseEvent peer,
                      const Ark_EventTarget* target);
    Ark_Int64 (*getTimestamp)(Ark_BaseEvent peer);
    void (*setTimestamp)(Ark_BaseEvent peer,
                         Ark_Int64 timestamp);
    Ark_SourceType (*getSource)(Ark_BaseEvent peer);
    void (*setSource)(Ark_BaseEvent peer,
                      Ark_SourceType source);
    Opt_Number (*getAxisHorizontal)(Ark_BaseEvent peer);
    void (*setAxisHorizontal)(Ark_BaseEvent peer,
                              const Ark_Number* axisHorizontal);
    Opt_Number (*getAxisVertical)(Ark_BaseEvent peer);
    void (*setAxisVertical)(Ark_BaseEvent peer,
                            const Ark_Number* axisVertical);
    Ark_Number (*getPressure)(Ark_BaseEvent peer);
    void (*setPressure)(Ark_BaseEvent peer,
                        const Ark_Number* pressure);
    Ark_Number (*getTiltX)(Ark_BaseEvent peer);
    void (*setTiltX)(Ark_BaseEvent peer,
                     const Ark_Number* tiltX);
    Ark_Number (*getTiltY)(Ark_BaseEvent peer);
    void (*setTiltY)(Ark_BaseEvent peer,
                     const Ark_Number* tiltY);
    Ark_SourceTool (*getSourceTool)(Ark_BaseEvent peer);
    void (*setSourceTool)(Ark_BaseEvent peer,
                          Ark_SourceTool sourceTool);
    Opt_Number (*getDeviceId)(Ark_BaseEvent peer);
    void (*setDeviceId)(Ark_BaseEvent peer,
                        const Ark_Number* deviceId);
} GENERATED_ArkUIBaseEventAccessor;

typedef struct GENERATED_ArkUIBaseGestureEventAccessor {
    void (*destroyPeer)(Ark_BaseGestureEvent peer);
    Ark_BaseGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Array_FingerInfo (*getFingerList)(Ark_BaseGestureEvent peer);
    void (*setFingerList)(Ark_BaseGestureEvent peer,
                          const Array_FingerInfo* fingerList);
} GENERATED_ArkUIBaseGestureEventAccessor;

typedef struct GENERATED_ArkUIBaselineOffsetStyleAccessor {
    void (*destroyPeer)(Ark_BaselineOffsetStyle peer);
    Ark_BaselineOffsetStyle (*ctor)(const Ark_CustomObject* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getBaselineOffset)(Ark_BaselineOffsetStyle peer);
} GENERATED_ArkUIBaselineOffsetStyleAccessor;

typedef struct GENERATED_ArkUIBaseShapeAccessor {
    void (*destroyPeer)(Ark_BaseShape peer);
    Ark_BaseShape (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_BaseShape (*width)(Ark_BaseShape peer,
                           const Ark_Length* width);
    Ark_BaseShape (*height)(Ark_BaseShape peer,
                            const Ark_Length* height);
    Ark_BaseShape (*size)(Ark_BaseShape peer,
                          const Ark_SizeOptions* size);
} GENERATED_ArkUIBaseShapeAccessor;

typedef struct GENERATED_ArkUIBounceSymbolEffectAccessor {
    void (*destroyPeer)(Ark_BounceSymbolEffect peer);
    Ark_BounceSymbolEffect (*ctor)(const Opt_EffectScope* scope,
                                   const Opt_EffectDirection* direction);
    Ark_NativePointer (*getFinalizer)();
    Opt_EffectScope (*getScope)(Ark_BounceSymbolEffect peer);
    void (*setScope)(Ark_BounceSymbolEffect peer,
                     Ark_EffectScope scope);
    Opt_EffectDirection (*getDirection)(Ark_BounceSymbolEffect peer);
    void (*setDirection)(Ark_BounceSymbolEffect peer,
                         Ark_EffectDirection direction);
} GENERATED_ArkUIBounceSymbolEffectAccessor;

typedef struct GENERATED_ArkUICanvasGradientAccessor {
    void (*destroyPeer)(Ark_CanvasGradient peer);
    Ark_CanvasGradient (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*addColorStop)(Ark_CanvasGradient peer,
                         const Ark_Number* offset,
                         const Ark_String* color);
} GENERATED_ArkUICanvasGradientAccessor;

typedef struct GENERATED_ArkUICanvasPathAccessor {
    void (*destroyPeer)(Ark_CanvasPath peer);
    Ark_CanvasPath (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*rect)(Ark_CanvasPath peer,
                 const Ark_Number* x,
                 const Ark_Number* y,
                 const Ark_Number* w,
                 const Ark_Number* h);
    void (*arc)(Ark_CanvasPath peer,
                const Ark_Number* x,
                const Ark_Number* y,
                const Ark_Number* radius,
                const Ark_Number* startAngle,
                const Ark_Number* endAngle,
                const Opt_Boolean* counterclockwise);
    void (*closePath)(Ark_CanvasPath peer);
} GENERATED_ArkUICanvasPathAccessor;

typedef struct GENERATED_ArkUICanvasPatternAccessor {
    void (*destroyPeer)(Ark_CanvasPattern peer);
    Ark_CanvasPattern (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*setTransform)(Ark_CanvasPattern peer,
                         const Opt_Matrix2D* transform);
} GENERATED_ArkUICanvasPatternAccessor;

typedef struct GENERATED_ArkUICanvasRendererAccessor {
    void (*destroyPeer)(Ark_CanvasRenderer peer);
    Ark_CanvasRenderer (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*beginPath)(Ark_CanvasRenderer peer);
    void (*clip)(Ark_CanvasRenderer peer,
                 const Opt_String* fillRule);
    void (*reset)(Ark_CanvasRenderer peer);
    void (*putImageData0)(Ark_CanvasRenderer peer,
                          Ark_ImageData imagedata,
                          const Ark_Union_Number_String* dx,
                          const Ark_Union_Number_String* dy);
    void (*putImageData1)(Ark_CanvasRenderer peer,
                          Ark_ImageData imagedata,
                          const Ark_Union_Number_String* dx,
                          const Ark_Union_Number_String* dy,
                          const Ark_Union_Number_String* dirtyX,
                          const Ark_Union_Number_String* dirtyY,
                          const Ark_Union_Number_String* dirtyWidth,
                          const Ark_Union_Number_String* dirtyHeight);
    Ark_Number (*getGlobalAlpha)(Ark_CanvasRenderer peer);
    void (*setGlobalAlpha)(Ark_CanvasRenderer peer,
                           const Ark_Number* globalAlpha);
    Ark_String (*getGlobalCompositeOperation)(Ark_CanvasRenderer peer);
    void (*setGlobalCompositeOperation)(Ark_CanvasRenderer peer,
                                        const Ark_String* globalCompositeOperation);
    Ark_Union_String_Number_CanvasGradient_CanvasPattern (*getFillStyle)(Ark_CanvasRenderer peer);
    void (*setFillStyle)(Ark_CanvasRenderer peer,
                         const Ark_Union_String_Number_CanvasGradient_CanvasPattern* fillStyle);
} GENERATED_ArkUICanvasRendererAccessor;

typedef struct GENERATED_ArkUICanvasRenderingContext2DAccessor {
    void (*destroyPeer)(Ark_CanvasRenderingContext2D peer);
    Ark_CanvasRenderingContext2D (*ctor)(const Opt_RenderingContextSettings* settings);
    Ark_NativePointer (*getFinalizer)();
    void (*stopImageAnalyzer)(Ark_CanvasRenderingContext2D peer);
    Ark_CanvasRenderingContext2D (*of)();
    Ark_Number (*getHeight)(Ark_CanvasRenderingContext2D peer);
    Ark_Number (*getWidth)(Ark_CanvasRenderingContext2D peer);
} GENERATED_ArkUICanvasRenderingContext2DAccessor;

typedef struct GENERATED_ArkUIChildrenMainSizeAccessor {
    void (*destroyPeer)(Ark_ChildrenMainSize peer);
    Ark_ChildrenMainSize (*ctor)(const Ark_Number* childDefaultSize);
    Ark_NativePointer (*getFinalizer)();
    void (*splice)(Ark_VMContext vmContext,
                   Ark_ChildrenMainSize peer,
                   const Ark_Number* start,
                   const Opt_Number* deleteCount,
                   const Opt_Array_Number* childrenSize);
    void (*update)(Ark_VMContext vmContext,
                   Ark_ChildrenMainSize peer,
                   const Ark_Number* index,
                   const Ark_Number* childSize);
    Ark_Number (*getChildDefaultSize)(Ark_ChildrenMainSize peer);
    void (*setChildDefaultSize)(Ark_ChildrenMainSize peer,
                                const Ark_Number* childDefaultSize);
} GENERATED_ArkUIChildrenMainSizeAccessor;

typedef struct GENERATED_ArkUIClassNoConstructorAndStaticMethodsDTSAccessor {
    void (*method)(const Ark_Number* valNumber,
                   const Ark_String* valString);
    void (*method2)(const Ark_Number* valNumber,
                    const Ark_String* valString);
} GENERATED_ArkUIClassNoConstructorAndStaticMethodsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndAllOptionalParamsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndAllOptionalParamsDTS peer);
    Ark_ClassWithConstructorAndAllOptionalParamsDTS (*ctor)(const Opt_Number* valNumber,
                                                            const Opt_String* valString);
    Ark_NativePointer (*getFinalizer)();
    Ark_ClassWithConstructorAndAllOptionalParamsDTS (*of)(const Opt_Number* valNumber,
                                                          const Opt_String* valString);
    void (*method)(Ark_ClassWithConstructorAndAllOptionalParamsDTS peer,
                   const Opt_Boolean* valBoolean,
                   const Opt_String* valString);
} GENERATED_ArkUIClassWithConstructorAndAllOptionalParamsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndFieldsAndMethodsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndFieldsAndMethodsDTS peer);
    Ark_ClassWithConstructorAndFieldsAndMethodsDTS (*ctor)(const Ark_Number* valNumber,
                                                           Ark_Boolean valBoolean);
    Ark_NativePointer (*getFinalizer)();
    void (*method)(Ark_ClassWithConstructorAndFieldsAndMethodsDTS peer,
                   const Ark_Number* valNumber,
                   const Ark_String* valString);
    Ark_Number (*getValNumber)(Ark_ClassWithConstructorAndFieldsAndMethodsDTS peer);
    void (*setValNumber)(Ark_ClassWithConstructorAndFieldsAndMethodsDTS peer,
                         const Ark_Number* valNumber);
    Ark_Boolean (*getValBoolean)(Ark_ClassWithConstructorAndFieldsAndMethodsDTS peer);
    void (*setValBoolean)(Ark_ClassWithConstructorAndFieldsAndMethodsDTS peer,
                          Ark_Boolean valBoolean);
} GENERATED_ArkUIClassWithConstructorAndFieldsAndMethodsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndFieldsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndFieldsDTS peer);
    Ark_ClassWithConstructorAndFieldsDTS (*ctor)(const Ark_Number* valNumber,
                                                 Ark_Boolean valBoolean);
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getValNumber)(Ark_ClassWithConstructorAndFieldsDTS peer);
    void (*setValNumber)(Ark_ClassWithConstructorAndFieldsDTS peer,
                         const Ark_Number* valNumber);
    Ark_Boolean (*getValBoolean)(Ark_ClassWithConstructorAndFieldsDTS peer);
    void (*setValBoolean)(Ark_ClassWithConstructorAndFieldsDTS peer,
                          Ark_Boolean valBoolean);
} GENERATED_ArkUIClassWithConstructorAndFieldsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndMethodsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndMethodsDTS peer);
    Ark_ClassWithConstructorAndMethodsDTS (*ctor)(const Ark_Number* valNumber,
                                                  const Ark_String* valString);
    Ark_NativePointer (*getFinalizer)();
    void (*method)(Ark_ClassWithConstructorAndMethodsDTS peer,
                   const Ark_Number* valNumber,
                   const Ark_String* valString);
} GENERATED_ArkUIClassWithConstructorAndMethodsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndNonOptionalParamsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndNonOptionalParamsDTS peer);
    Ark_ClassWithConstructorAndNonOptionalParamsDTS (*ctor)(const Ark_Number* valNumber,
                                                            const Ark_String* valString);
    Ark_NativePointer (*getFinalizer)();
    Ark_ClassWithConstructorAndNonOptionalParamsDTS (*of)(const Ark_Number* valNumber,
                                                          const Ark_String* valString);
    void (*method)(Ark_ClassWithConstructorAndNonOptionalParamsDTS peer,
                   Ark_Boolean valBoolean,
                   const Ark_String* valString);
} GENERATED_ArkUIClassWithConstructorAndNonOptionalParamsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndSomeOptionalParamsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndSomeOptionalParamsDTS peer);
    Ark_ClassWithConstructorAndSomeOptionalParamsDTS (*ctor)(const Ark_Number* valNumber,
                                                             const Opt_String* valString);
    Ark_NativePointer (*getFinalizer)();
    Ark_ClassWithConstructorAndSomeOptionalParamsDTS (*of)(const Ark_Number* valNumber,
                                                           const Opt_String* valString);
    void (*method)(Ark_ClassWithConstructorAndSomeOptionalParamsDTS peer,
                   Ark_Boolean valBoolean,
                   const Opt_String* valString);
} GENERATED_ArkUIClassWithConstructorAndSomeOptionalParamsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndStaticMethodsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndStaticMethodsDTS peer);
    Ark_ClassWithConstructorAndStaticMethodsDTS (*ctor)(const Ark_Number* valNumber,
                                                        const Ark_String* valString);
    Ark_NativePointer (*getFinalizer)();
    Ark_ClassWithConstructorAndStaticMethodsDTS (*of)(const Ark_Number* valNumber,
                                                      const Ark_String* valString);
} GENERATED_ArkUIClassWithConstructorAndStaticMethodsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorAndWithoutParamsDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorAndWithoutParamsDTS peer);
    Ark_ClassWithConstructorAndWithoutParamsDTS (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_ClassWithConstructorAndWithoutParamsDTS (*of)();
    void (*method)(Ark_ClassWithConstructorAndWithoutParamsDTS peer);
} GENERATED_ArkUIClassWithConstructorAndWithoutParamsDTSAccessor;

typedef struct GENERATED_ArkUIClassWithConstructorDTSAccessor {
    void (*destroyPeer)(Ark_ClassWithConstructorDTS peer);
    Ark_ClassWithConstructorDTS (*ctor)(const Ark_Number* valNumber,
                                        const Ark_String* valString);
    Ark_NativePointer (*getFinalizer)();
} GENERATED_ArkUIClassWithConstructorDTSAccessor;

typedef struct GENERATED_ArkUIClickEventAccessor {
    void (*destroyPeer)(Ark_ClickEvent peer);
    Ark_ClickEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getDisplayX)(Ark_ClickEvent peer);
    void (*setDisplayX)(Ark_ClickEvent peer,
                        const Ark_Number* displayX);
    Ark_Number (*getDisplayY)(Ark_ClickEvent peer);
    void (*setDisplayY)(Ark_ClickEvent peer,
                        const Ark_Number* displayY);
    Ark_Number (*getWindowX)(Ark_ClickEvent peer);
    void (*setWindowX)(Ark_ClickEvent peer,
                       const Ark_Number* windowX);
    Ark_Number (*getWindowY)(Ark_ClickEvent peer);
    void (*setWindowY)(Ark_ClickEvent peer,
                       const Ark_Number* windowY);
    Ark_Number (*getScreenX)(Ark_ClickEvent peer);
    void (*setScreenX)(Ark_ClickEvent peer,
                       const Ark_Number* screenX);
    Ark_Number (*getScreenY)(Ark_ClickEvent peer);
    void (*setScreenY)(Ark_ClickEvent peer,
                       const Ark_Number* screenY);
    Ark_Number (*getX)(Ark_ClickEvent peer);
    void (*setX)(Ark_ClickEvent peer,
                 const Ark_Number* x);
    Ark_Number (*getY)(Ark_ClickEvent peer);
    void (*setY)(Ark_ClickEvent peer,
                 const Ark_Number* y);
    Callback_Void (*getPreventDefault)(Ark_ClickEvent peer);
    void (*setPreventDefault)(Ark_ClickEvent peer,
                              const Callback_Void* preventDefault);
} GENERATED_ArkUIClickEventAccessor;

typedef struct GENERATED_ArkUIColorFilterAccessor {
    void (*destroyPeer)(Ark_ColorFilter peer);
    Ark_ColorFilter (*ctor)(const Array_Number* value);
    Ark_NativePointer (*getFinalizer)();
} GENERATED_ArkUIColorFilterAccessor;

typedef struct GENERATED_ArkUICommonShapeAccessor {
    void (*destroyPeer)(Ark_CommonShape peer);
    Ark_CommonShape (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_CommonShape (*offset)(Ark_CommonShape peer,
                              const Ark_Position* offset);
    Ark_CommonShape (*fill)(Ark_CommonShape peer,
                            const Ark_ResourceColor* color);
    Ark_CommonShape (*position)(Ark_CommonShape peer,
                                const Ark_Position* position);
} GENERATED_ArkUICommonShapeAccessor;

typedef struct GENERATED_ArkUIContextAccessor {
    void (*destroyPeer)(Ark_Context peer);
    Ark_Context (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Context (*createBundleContext)(Ark_Context peer,
                                       const Ark_String* bundleName);
    Ark_Context (*createModuleContext)(Ark_Context peer,
                                       const Ark_String* moduleName);
    void (*getGroupDir)(Ark_VMContext vmContext,
                        Ark_AsyncWorkerPtr asyncWorker,
                        Ark_Context peer,
                        const Ark_String* dataGroupID,
                        const Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    Ark_Context (*createDisplayContext)(Ark_Context peer,
                                        const Ark_Number* displayId);
    Ark_String (*getCacheDir)(Ark_Context peer);
    void (*setCacheDir)(Ark_Context peer,
                        const Ark_String* cacheDir);
    Ark_String (*getTempDir)(Ark_Context peer);
    void (*setTempDir)(Ark_Context peer,
                       const Ark_String* tempDir);
    Ark_String (*getFilesDir)(Ark_Context peer);
    void (*setFilesDir)(Ark_Context peer,
                        const Ark_String* filesDir);
    Ark_String (*getDatabaseDir)(Ark_Context peer);
    void (*setDatabaseDir)(Ark_Context peer,
                           const Ark_String* databaseDir);
    Ark_String (*getPreferencesDir)(Ark_Context peer);
    void (*setPreferencesDir)(Ark_Context peer,
                              const Ark_String* preferencesDir);
    Ark_String (*getBundleCodeDir)(Ark_Context peer);
    void (*setBundleCodeDir)(Ark_Context peer,
                             const Ark_String* bundleCodeDir);
    Ark_String (*getDistributedFilesDir)(Ark_Context peer);
    void (*setDistributedFilesDir)(Ark_Context peer,
                                   const Ark_String* distributedFilesDir);
    Ark_String (*getResourceDir)(Ark_Context peer);
    void (*setResourceDir)(Ark_Context peer,
                           const Ark_String* resourceDir);
    Ark_String (*getCloudFileDir)(Ark_Context peer);
    void (*setCloudFileDir)(Ark_Context peer,
                            const Ark_String* cloudFileDir);
    Ark_String (*getProcessName)(Ark_Context peer);
    void (*setProcessName)(Ark_Context peer,
                           const Ark_String* processName);
} GENERATED_ArkUIContextAccessor;

typedef struct GENERATED_ArkUICustomDialogControllerAccessor {
    void (*destroyPeer)(Ark_CustomDialogController peer);
    Ark_CustomDialogController (*ctor)(const Ark_CustomDialogControllerOptions* value);
    Ark_NativePointer (*getFinalizer)();
    void (*open)(Ark_CustomDialogController peer);
    void (*close)(Ark_CustomDialogController peer);
} GENERATED_ArkUICustomDialogControllerAccessor;

typedef struct GENERATED_ArkUICustomSpanAccessor {
    void (*destroyPeer)(Ark_CustomSpan peer);
    Ark_CustomSpan (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*invalidate)(Ark_CustomSpan peer);
    AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics (*getOnMeasure)(Ark_CustomSpan peer);
    void (*setOnMeasure)(Ark_CustomSpan peer,
                         const AsyncCallback_CustomSpanMeasureInfo_CustomSpanMetrics* onMeasure);
    Callback_DrawContext_CustomSpanDrawInfo_Void (*getOnDraw)(Ark_CustomSpan peer);
    void (*setOnDraw)(Ark_CustomSpan peer,
                      const Callback_DrawContext_CustomSpanDrawInfo_Void* onDraw);
} GENERATED_ArkUICustomSpanAccessor;

typedef struct GENERATED_ArkUIDecorationStyleAccessor {
    void (*destroyPeer)(Ark_DecorationStyle peer);
    Ark_DecorationStyle (*ctor)(const Ark_DecorationStyleInterface* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_TextDecorationType (*getType)(Ark_DecorationStyle peer);
    Opt_ResourceColor (*getColor)(Ark_DecorationStyle peer);
    Opt_TextDecorationStyle (*getStyle)(Ark_DecorationStyle peer);
} GENERATED_ArkUIDecorationStyleAccessor;

typedef struct GENERATED_ArkUIDisappearSymbolEffectAccessor {
    void (*destroyPeer)(Ark_DisappearSymbolEffect peer);
    Ark_DisappearSymbolEffect (*ctor)(const Opt_EffectScope* scope);
    Ark_NativePointer (*getFinalizer)();
    Opt_EffectScope (*getScope)(Ark_DisappearSymbolEffect peer);
    void (*setScope)(Ark_DisappearSymbolEffect peer,
                     Ark_EffectScope scope);
} GENERATED_ArkUIDisappearSymbolEffectAccessor;

typedef struct GENERATED_ArkUIDragEventAccessor {
    void (*destroyPeer)(Ark_DragEvent peer);
    Ark_DragEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getDisplayX)(Ark_DragEvent peer);
    Ark_Number (*getDisplayY)(Ark_DragEvent peer);
    Ark_Number (*getWindowX)(Ark_DragEvent peer);
    Ark_Number (*getWindowY)(Ark_DragEvent peer);
    Ark_Number (*getX)(Ark_DragEvent peer);
    Ark_Number (*getY)(Ark_DragEvent peer);
    void (*setData)(Ark_DragEvent peer,
                    const Ark_CustomObject* unifiedData);
    Ark_CustomObject (*getData)(Ark_VMContext vmContext,
                                Ark_DragEvent peer);
    Ark_CustomObject (*getSummary)(Ark_DragEvent peer);
    void (*setResult)(Ark_DragEvent peer,
                      Ark_DragResult dragResult);
    Ark_DragResult (*getResult)(Ark_DragEvent peer);
    Ark_Rectangle (*getPreviewRect)(Ark_DragEvent peer);
    Ark_Number (*getVelocityX)(Ark_DragEvent peer);
    Ark_Number (*getVelocityY)(Ark_DragEvent peer);
    Ark_Number (*getVelocity)(Ark_DragEvent peer);
    Ark_Boolean (*getModifierKeyState)(Ark_VMContext vmContext,
                                       Ark_DragEvent peer,
                                       const Array_String* keys);
    Ark_DragBehavior (*getDragBehavior)(Ark_DragEvent peer);
    void (*setDragBehavior)(Ark_DragEvent peer,
                            Ark_DragBehavior dragBehavior);
    Ark_Boolean (*getUseCustomDropAnimation)(Ark_DragEvent peer);
    void (*setUseCustomDropAnimation)(Ark_DragEvent peer,
                                      Ark_Boolean useCustomDropAnimation);
} GENERATED_ArkUIDragEventAccessor;

typedef struct GENERATED_ArkUIDrawingColorFilterAccessor {
    void (*destroyPeer)(Ark_DrawingColorFilter peer);
    Ark_DrawingColorFilter (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_DrawingColorFilter (*createBlendModeColorFilter0)(Ark_Color color,
                                                          Ark_BlendMode mode);
    Ark_DrawingColorFilter (*createBlendModeColorFilter1)(const Ark_Number* color,
                                                          Ark_BlendMode mode);
    Ark_DrawingColorFilter (*createComposeColorFilter)(Ark_DrawingColorFilter outer,
                                                       Ark_DrawingColorFilter inner);
    Ark_DrawingColorFilter (*createLinearToSRGBGamma)();
    Ark_DrawingColorFilter (*createSRGBGammaToLinear)();
    Ark_DrawingColorFilter (*createLumaColorFilter)();
    Ark_DrawingColorFilter (*createMatrixColorFilter)(const Array_Number* matrix);
} GENERATED_ArkUIDrawingColorFilterAccessor;

typedef struct GENERATED_ArkUIDrawingLatticeAccessor {
    void (*destroyPeer)(Ark_DrawingLattice peer);
    Ark_DrawingLattice (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_DrawingLattice (*createImageLattice)(const Array_Number* xDivs,
                                             const Array_Number* yDivs,
                                             const Ark_Number* fXCount,
                                             const Ark_Number* fYCount,
                                             const Opt_CustomObject* fBounds,
                                             const Opt_Array_CustomObject* fRectTypes,
                                             const Opt_Array_Union_Color_Number* fColors);
} GENERATED_ArkUIDrawingLatticeAccessor;

typedef struct GENERATED_ArkUIDrawingRenderingContextAccessor {
    void (*destroyPeer)(Ark_DrawingRenderingContext peer);
    Ark_DrawingRenderingContext (*ctor)(const Opt_CustomObject* unit);
    Ark_NativePointer (*getFinalizer)();
    void (*invalidate)(Ark_DrawingRenderingContext peer);
    Ark_Size (*getSize)(Ark_DrawingRenderingContext peer);
    Ark_DrawingCanvas (*getCanvas)(Ark_DrawingRenderingContext peer);
} GENERATED_ArkUIDrawingRenderingContextAccessor;

typedef struct GENERATED_ArkUIDrawModifierAccessor {
    void (*destroyPeer)(Ark_DrawModifier peer);
    Ark_DrawModifier (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*invalidate)(Ark_DrawModifier peer);
    Callback_DrawContext_Void (*getDrawBehind)(Ark_DrawModifier peer);
    void (*setDrawBehind)(Ark_DrawModifier peer,
                          const Callback_DrawContext_Void* drawBehind);
    Callback_DrawContext_Void (*getDrawContent)(Ark_DrawModifier peer);
    void (*setDrawContent)(Ark_DrawModifier peer,
                           const Callback_DrawContext_Void* drawContent);
    Callback_DrawContext_Void (*getDrawFront)(Ark_DrawModifier peer);
    void (*setDrawFront)(Ark_DrawModifier peer,
                         const Callback_DrawContext_Void* drawFront);
} GENERATED_ArkUIDrawModifierAccessor;

typedef struct GENERATED_ArkUIEventEmulatorAccessor {
    void (*emitClickEvent)(Ark_NativePointer node,
                           Ark_ClickEvent event);
    void (*emitTextInputEvent)(Ark_NativePointer node,
                               const Ark_String* text);
} GENERATED_ArkUIEventEmulatorAccessor;

typedef struct GENERATED_ArkUIEventTargetInfoAccessor {
    void (*destroyPeer)(Ark_EventTargetInfo peer);
    Ark_EventTargetInfo (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_String (*getId)(Ark_EventTargetInfo peer);
} GENERATED_ArkUIEventTargetInfoAccessor;

typedef struct GENERATED_ArkUIFocusControllerAccessor {
    void (*requestFocus)(const Ark_String* key);
} GENERATED_ArkUIFocusControllerAccessor;

typedef struct GENERATED_ArkUIGestureEventAccessor {
    void (*destroyPeer)(Ark_GestureEvent peer);
    Ark_GestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*getRepeat)(Ark_GestureEvent peer);
    void (*setRepeat)(Ark_GestureEvent peer,
                      Ark_Boolean repeat);
    Array_FingerInfo (*getFingerList)(Ark_GestureEvent peer);
    void (*setFingerList)(Ark_GestureEvent peer,
                          const Array_FingerInfo* fingerList);
    Ark_Number (*getOffsetX)(Ark_GestureEvent peer);
    void (*setOffsetX)(Ark_GestureEvent peer,
                       const Ark_Number* offsetX);
    Ark_Number (*getOffsetY)(Ark_GestureEvent peer);
    void (*setOffsetY)(Ark_GestureEvent peer,
                       const Ark_Number* offsetY);
    Ark_Number (*getAngle)(Ark_GestureEvent peer);
    void (*setAngle)(Ark_GestureEvent peer,
                     const Ark_Number* angle);
    Ark_Number (*getSpeed)(Ark_GestureEvent peer);
    void (*setSpeed)(Ark_GestureEvent peer,
                     const Ark_Number* speed);
    Ark_Number (*getScale)(Ark_GestureEvent peer);
    void (*setScale)(Ark_GestureEvent peer,
                     const Ark_Number* scale);
    Ark_Number (*getPinchCenterX)(Ark_GestureEvent peer);
    void (*setPinchCenterX)(Ark_GestureEvent peer,
                            const Ark_Number* pinchCenterX);
    Ark_Number (*getPinchCenterY)(Ark_GestureEvent peer);
    void (*setPinchCenterY)(Ark_GestureEvent peer,
                            const Ark_Number* pinchCenterY);
    Ark_Number (*getVelocityX)(Ark_GestureEvent peer);
    void (*setVelocityX)(Ark_GestureEvent peer,
                         const Ark_Number* velocityX);
    Ark_Number (*getVelocityY)(Ark_GestureEvent peer);
    void (*setVelocityY)(Ark_GestureEvent peer,
                         const Ark_Number* velocityY);
    Ark_Number (*getVelocity)(Ark_GestureEvent peer);
    void (*setVelocity)(Ark_GestureEvent peer,
                        const Ark_Number* velocity);
} GENERATED_ArkUIGestureEventAccessor;

typedef struct GENERATED_ArkUIGestureGroupInterfaceAccessor {
    void (*destroyPeer)(Ark_GestureGroupInterface peer);
    Ark_GestureGroupInterface (*ctor)(Ark_GestureMode mode,
                                      const Array_GestureType* gesture);
    Ark_NativePointer (*getFinalizer)();
    Ark_GestureGroupInterface (*onCancel)(Ark_GestureGroupInterface peer,
                                          const Callback_Void* event);
} GENERATED_ArkUIGestureGroupInterfaceAccessor;

typedef struct GENERATED_ArkUIGestureModifierAccessor {
    void (*destroyPeer)(Ark_GestureModifier peer);
    Ark_GestureModifier (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*applyGesture)(Ark_GestureModifier peer,
                         const Ark_UIGestureEvent* event);
} GENERATED_ArkUIGestureModifierAccessor;

typedef struct GENERATED_ArkUIGestureRecognizerAccessor {
    void (*destroyPeer)(Ark_GestureRecognizer peer);
    Ark_GestureRecognizer (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_String (*getTag)(Ark_GestureRecognizer peer);
    Ark_GestureControl_GestureType (*getType)(Ark_GestureRecognizer peer);
    Ark_Boolean (*isBuiltIn)(Ark_GestureRecognizer peer);
    void (*setEnabled)(Ark_GestureRecognizer peer,
                       Ark_Boolean isEnabled);
    Ark_Boolean (*isEnabled)(Ark_GestureRecognizer peer);
    Ark_GestureRecognizerState (*getState)(Ark_GestureRecognizer peer);
    Ark_EventTargetInfo (*getEventTargetInfo)(Ark_GestureRecognizer peer);
    Ark_Boolean (*isValid)(Ark_GestureRecognizer peer);
} GENERATED_ArkUIGestureRecognizerAccessor;

typedef struct GENERATED_ArkUIGestureStyleAccessor {
    void (*destroyPeer)(Ark_GestureStyle peer);
    Ark_GestureStyle (*ctor)(const Opt_GestureStyleInterface* value);
    Ark_NativePointer (*getFinalizer)();
} GENERATED_ArkUIGestureStyleAccessor;

typedef struct GENERATED_ArkUIGlobalScope_ohos_arkui_componentSnapshotAccessor {
    void (*get)(const Ark_String* id,
                const AsyncCallback_image_PixelMap_Void* callback,
                const Opt_SnapshotOptions* options);
} GENERATED_ArkUIGlobalScope_ohos_arkui_componentSnapshotAccessor;

typedef struct GENERATED_ArkUIGlobalScope_ohos_arkui_performanceMonitorAccessor {
    void (*begin)(const Ark_String* scene,
                  Ark_PerfMonitorActionType startInputType,
                  const Opt_String* note);
    void (*end)(const Ark_String* scene);
    void (*recordInputEventTime)(Ark_PerfMonitorActionType actionType,
                                 Ark_PerfMonitorSourceType sourceType,
                                 Ark_Int64 time);
} GENERATED_ArkUIGlobalScope_ohos_arkui_performanceMonitorAccessor;

typedef struct GENERATED_ArkUIGlobalScope_ohos_fontAccessor {
    void (*registerFont)(const Ark_FontOptions* options);
    Array_String (*getSystemFontList)();
    Ark_FontInfo (*getFontByName)(const Ark_String* fontName);
} GENERATED_ArkUIGlobalScope_ohos_fontAccessor;

typedef struct GENERATED_ArkUIGlobalScope_ohos_measure_utilsAccessor {
    Ark_Number (*measureText)(const Ark_MeasureOptions* options);
    Ark_SizeOptions (*measureTextSize)(const Ark_MeasureOptions* options);
} GENERATED_ArkUIGlobalScope_ohos_measure_utilsAccessor;

typedef struct GENERATED_ArkUIHierarchicalSymbolEffectAccessor {
    void (*destroyPeer)(Ark_HierarchicalSymbolEffect peer);
    Ark_HierarchicalSymbolEffect (*ctor)(const Opt_EffectFillStyle* fillStyle);
    Ark_NativePointer (*getFinalizer)();
    Opt_EffectFillStyle (*getFillStyle)(Ark_HierarchicalSymbolEffect peer);
    void (*setFillStyle)(Ark_HierarchicalSymbolEffect peer,
                         Ark_EffectFillStyle fillStyle);
} GENERATED_ArkUIHierarchicalSymbolEffectAccessor;

typedef struct GENERATED_ArkUIHoverEventAccessor {
    void (*destroyPeer)(Ark_HoverEvent peer);
    Ark_HoverEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Callback_Void (*getStopPropagation)(Ark_HoverEvent peer);
    void (*setStopPropagation)(Ark_HoverEvent peer,
                               const Callback_Void* stopPropagation);
} GENERATED_ArkUIHoverEventAccessor;

typedef struct GENERATED_ArkUIICurveAccessor {
    void (*destroyPeer)(Ark_ICurve peer);
    Ark_ICurve (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*interpolate)(Ark_ICurve peer,
                              const Ark_Number* fraction);
} GENERATED_ArkUIICurveAccessor;

typedef struct GENERATED_ArkUIImageAnalyzerControllerAccessor {
    void (*destroyPeer)(Ark_ImageAnalyzerController peer);
    Ark_ImageAnalyzerController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Array_ImageAnalyzerType (*getImageAnalyzerSupportTypes)(Ark_ImageAnalyzerController peer);
} GENERATED_ArkUIImageAnalyzerControllerAccessor;

typedef struct GENERATED_ArkUIImageAttachmentAccessor {
    void (*destroyPeer)(Ark_ImageAttachment peer);
    Ark_ImageAttachment (*ctor)(const Ark_ImageAttachmentInterface* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_PixelMap (*getValue)(Ark_ImageAttachment peer);
    Opt_SizeOptions (*getSize)(Ark_ImageAttachment peer);
    Opt_ImageSpanAlignment (*getVerticalAlign)(Ark_ImageAttachment peer);
    Opt_ImageFit (*getObjectFit)(Ark_ImageAttachment peer);
    Opt_ImageAttachmentLayoutStyle (*getLayoutStyle)(Ark_ImageAttachment peer);
} GENERATED_ArkUIImageAttachmentAccessor;

typedef struct GENERATED_ArkUIImageBitmapAccessor {
    void (*destroyPeer)(Ark_ImageBitmap peer);
    Ark_ImageBitmap (*ctor)(const Ark_String* src);
    Ark_NativePointer (*getFinalizer)();
    void (*close)(Ark_ImageBitmap peer);
} GENERATED_ArkUIImageBitmapAccessor;

typedef struct GENERATED_ArkUIImageDataAccessor {
    void (*destroyPeer)(Ark_ImageData peer);
    Ark_ImageData (*ctor)(const Ark_Number* width,
                          const Ark_Number* height,
                          const Opt_Buffer* data);
    Ark_NativePointer (*getFinalizer)();
    Ark_Buffer (*getData)(Ark_ImageData peer);
    Ark_Number (*getHeight)(Ark_ImageData peer);
    Ark_Number (*getWidth)(Ark_ImageData peer);
} GENERATED_ArkUIImageDataAccessor;

typedef struct GENERATED_ArkUIIndicatorComponentControllerAccessor {
    void (*destroyPeer)(Ark_IndicatorComponentController peer);
    Ark_IndicatorComponentController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*showNext)(Ark_IndicatorComponentController peer);
    void (*showPrevious)(Ark_IndicatorComponentController peer);
    void (*changeIndex)(Ark_IndicatorComponentController peer,
                        const Ark_Number* index,
                        const Opt_Boolean* useAnimation);
} GENERATED_ArkUIIndicatorComponentControllerAccessor;

typedef struct GENERATED_ArkUIIUIContextAccessor {
    void (*freezeUINode0)(const Ark_String* id,
                          Ark_Boolean isFrozen);
    void (*freezeUINode1)(const Ark_Number* id,
                          Ark_Boolean isFrozen);
} GENERATED_ArkUIIUIContextAccessor;

typedef struct GENERATED_ArkUIKeyEventAccessor {
    void (*destroyPeer)(Ark_KeyEvent peer);
    Ark_KeyEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*getModifierKeyState)(Ark_VMContext vmContext,
                                       Ark_KeyEvent peer,
                                       const Array_String* keys);
    Ark_KeyType (*getType)(Ark_KeyEvent peer);
    void (*setType)(Ark_KeyEvent peer,
                    Ark_KeyType type);
    Ark_Number (*getKeyCode)(Ark_KeyEvent peer);
    void (*setKeyCode)(Ark_KeyEvent peer,
                       const Ark_Number* keyCode);
    Ark_String (*getKeyText)(Ark_KeyEvent peer);
    void (*setKeyText)(Ark_KeyEvent peer,
                       const Ark_String* keyText);
    Ark_KeySource (*getKeySource)(Ark_KeyEvent peer);
    void (*setKeySource)(Ark_KeyEvent peer,
                         Ark_KeySource keySource);
    Ark_Number (*getDeviceId)(Ark_KeyEvent peer);
    void (*setDeviceId)(Ark_KeyEvent peer,
                        const Ark_Number* deviceId);
    Ark_Number (*getMetaKey)(Ark_KeyEvent peer);
    void (*setMetaKey)(Ark_KeyEvent peer,
                       const Ark_Number* metaKey);
    Ark_Int64 (*getTimestamp)(Ark_KeyEvent peer);
    void (*setTimestamp)(Ark_KeyEvent peer,
                         Ark_Int64 timestamp);
    Callback_Void (*getStopPropagation)(Ark_KeyEvent peer);
    void (*setStopPropagation)(Ark_KeyEvent peer,
                               const Callback_Void* stopPropagation);
    Ark_CustomObject (*getIntentionCode)(Ark_KeyEvent peer);
    void (*setIntentionCode)(Ark_KeyEvent peer,
                             const Ark_CustomObject* intentionCode);
    Opt_Number (*getUnicode)(Ark_KeyEvent peer);
    void (*setUnicode)(Ark_KeyEvent peer,
                       const Ark_Number* unicode);
} GENERATED_ArkUIKeyEventAccessor;

typedef struct GENERATED_ArkUILayoutableAccessor {
    void (*destroyPeer)(Ark_Layoutable peer);
    Ark_Layoutable (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*layout)(Ark_Layoutable peer,
                   const Ark_Position* position);
    Ark_DirectionalEdgesT (*getMargin)(Ark_Layoutable peer);
    Ark_DirectionalEdgesT (*getPadding)(Ark_Layoutable peer);
    Ark_DirectionalEdgesT (*getBorderWidth)(Ark_Layoutable peer);
    Ark_MeasureResult (*getMeasureResult)(Ark_Layoutable peer);
    void (*setMeasureResult)(Ark_Layoutable peer,
                             const Ark_MeasureResult* measureResult);
} GENERATED_ArkUILayoutableAccessor;

typedef struct GENERATED_ArkUILayoutManagerAccessor {
    void (*destroyPeer)(Ark_LayoutManager peer);
    Ark_LayoutManager (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getLineCount)(Ark_LayoutManager peer);
    Ark_PositionWithAffinity (*getGlyphPositionAtCoordinate)(Ark_LayoutManager peer,
                                                             const Ark_Number* x,
                                                             const Ark_Number* y);
    Ark_CustomObject (*getLineMetrics)(Ark_LayoutManager peer,
                                       const Ark_Number* lineNumber);
    Array_CustomObject (*getRectsForRange)(Ark_LayoutManager peer,
                                           const Ark_TextRange* range,
                                           const Ark_CustomObject* widthStyle,
                                           const Ark_CustomObject* heightStyle);
} GENERATED_ArkUILayoutManagerAccessor;

typedef struct GENERATED_ArkUILazyForEachOpsAccessor {
    void (*Sync)(Ark_NativePointer node,
                 Ark_Int32 totalCount,
                 const Callback_CreateItem* creator,
                 const Callback_RangeUpdate* updater);
} GENERATED_ArkUILazyForEachOpsAccessor;

typedef struct GENERATED_ArkUILetterSpacingStyleAccessor {
    void (*destroyPeer)(Ark_LetterSpacingStyle peer);
    Ark_LetterSpacingStyle (*ctor)(const Ark_CustomObject* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getLetterSpacing)(Ark_LetterSpacingStyle peer);
} GENERATED_ArkUILetterSpacingStyleAccessor;

typedef struct GENERATED_ArkUILinearGradientAccessor {
    void (*destroyPeer)(Ark_LinearGradient peer);
    Ark_LinearGradient (*ctor)(const Array_ColorStop* colorStops);
    Ark_NativePointer (*getFinalizer)();
} GENERATED_ArkUILinearGradientAccessor;

typedef struct GENERATED_ArkUILineHeightStyleAccessor {
    void (*destroyPeer)(Ark_LineHeightStyle peer);
    Ark_LineHeightStyle (*ctor)(const Ark_CustomObject* lineHeight);
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getLineHeight)(Ark_LineHeightStyle peer);
} GENERATED_ArkUILineHeightStyleAccessor;

typedef struct GENERATED_ArkUIListScrollerAccessor {
    void (*destroyPeer)(Ark_ListScroller peer);
    Ark_ListScroller (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_RectResult (*getItemRectInGroup)(Ark_VMContext vmContext,
                                         Ark_ListScroller peer,
                                         const Ark_Number* index,
                                         const Ark_Number* indexInGroup);
    void (*scrollToItemInGroup)(Ark_VMContext vmContext,
                                Ark_ListScroller peer,
                                const Ark_Number* index,
                                const Ark_Number* indexInGroup,
                                const Opt_Boolean* smooth,
                                const Opt_ScrollAlign* align);
    void (*closeAllSwipeActions)(Ark_VMContext vmContext,
                                 Ark_ListScroller peer,
                                 const Opt_CloseSwipeActionOptions* options);
    Ark_VisibleListContentInfo (*getVisibleListContentInfo)(Ark_VMContext vmContext,
                                                            Ark_ListScroller peer,
                                                            const Ark_Number* x,
                                                            const Ark_Number* y);
} GENERATED_ArkUIListScrollerAccessor;

typedef struct GENERATED_ArkUILongPressGestureEventAccessor {
    void (*destroyPeer)(Ark_LongPressGestureEvent peer);
    Ark_LongPressGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*getRepeat)(Ark_LongPressGestureEvent peer);
    void (*setRepeat)(Ark_LongPressGestureEvent peer,
                      Ark_Boolean repeat);
} GENERATED_ArkUILongPressGestureEventAccessor;

typedef struct GENERATED_ArkUILongPressGestureInterfaceAccessor {
    void (*destroyPeer)(Ark_LongPressGestureInterface peer);
    Ark_LongPressGestureInterface (*ctor)(const Opt_Literal_Number_duration_fingers_Boolean_repeat* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_LongPressGestureInterface (*onAction)(Ark_LongPressGestureInterface peer,
                                              const Callback_GestureEvent_Void* event);
    Ark_LongPressGestureInterface (*onActionEnd)(Ark_LongPressGestureInterface peer,
                                                 const Callback_GestureEvent_Void* event);
    Ark_LongPressGestureInterface (*onActionCancel)(Ark_LongPressGestureInterface peer,
                                                    const Callback_Void* event);
} GENERATED_ArkUILongPressGestureInterfaceAccessor;

typedef struct GENERATED_ArkUIMatrix2DAccessor {
    void (*destroyPeer)(Ark_Matrix2D peer);
    Ark_Matrix2D (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Matrix2D (*identity)(Ark_Matrix2D peer);
    Ark_Matrix2D (*invert)(Ark_Matrix2D peer);
    Ark_Matrix2D (*multiply)(Ark_Matrix2D peer,
                             const Opt_Matrix2D* other);
    Ark_Matrix2D (*rotate0)(Ark_Matrix2D peer,
                            const Opt_Number* rx,
                            const Opt_Number* ry);
    Ark_Matrix2D (*rotate1)(Ark_Matrix2D peer,
                            const Ark_Number* degree,
                            const Opt_Number* rx,
                            const Opt_Number* ry);
    Ark_Matrix2D (*translate)(Ark_Matrix2D peer,
                              const Opt_Number* tx,
                              const Opt_Number* ty);
    Ark_Matrix2D (*scale)(Ark_Matrix2D peer,
                          const Opt_Number* sx,
                          const Opt_Number* sy);
    Opt_Number (*getScaleX)(Ark_Matrix2D peer);
    void (*setScaleX)(Ark_Matrix2D peer,
                      const Ark_Number* scaleX);
    Opt_Number (*getRotateY)(Ark_Matrix2D peer);
    void (*setRotateY)(Ark_Matrix2D peer,
                       const Ark_Number* rotateY);
    Opt_Number (*getRotateX)(Ark_Matrix2D peer);
    void (*setRotateX)(Ark_Matrix2D peer,
                       const Ark_Number* rotateX);
    Opt_Number (*getScaleY)(Ark_Matrix2D peer);
    void (*setScaleY)(Ark_Matrix2D peer,
                      const Ark_Number* scaleY);
    Opt_Number (*getTranslateX)(Ark_Matrix2D peer);
    void (*setTranslateX)(Ark_Matrix2D peer,
                          const Ark_Number* translateX);
    Opt_Number (*getTranslateY)(Ark_Matrix2D peer);
    void (*setTranslateY)(Ark_Matrix2D peer,
                          const Ark_Number* translateY);
} GENERATED_ArkUIMatrix2DAccessor;

typedef struct GENERATED_ArkUIMeasurableAccessor {
    void (*destroyPeer)(Ark_Measurable peer);
    Ark_Measurable (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_MeasureResult (*measure)(Ark_Measurable peer,
                                 const Ark_ConstraintSizeOptions* constraint);
    Ark_DirectionalEdgesT (*getMargin)(Ark_Measurable peer);
    Ark_DirectionalEdgesT (*getPadding)(Ark_Measurable peer);
    Ark_DirectionalEdgesT (*getBorderWidth)(Ark_Measurable peer);
} GENERATED_ArkUIMeasurableAccessor;

typedef struct GENERATED_ArkUIMouseEventAccessor {
    void (*destroyPeer)(Ark_MouseEvent peer);
    Ark_MouseEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_MouseButton (*getButton)(Ark_MouseEvent peer);
    void (*setButton)(Ark_MouseEvent peer,
                      Ark_MouseButton button);
    Ark_MouseAction (*getAction)(Ark_MouseEvent peer);
    void (*setAction)(Ark_MouseEvent peer,
                      Ark_MouseAction action);
    Ark_Number (*getDisplayX)(Ark_MouseEvent peer);
    void (*setDisplayX)(Ark_MouseEvent peer,
                        const Ark_Number* displayX);
    Ark_Number (*getDisplayY)(Ark_MouseEvent peer);
    void (*setDisplayY)(Ark_MouseEvent peer,
                        const Ark_Number* displayY);
    Ark_Number (*getWindowX)(Ark_MouseEvent peer);
    void (*setWindowX)(Ark_MouseEvent peer,
                       const Ark_Number* windowX);
    Ark_Number (*getWindowY)(Ark_MouseEvent peer);
    void (*setWindowY)(Ark_MouseEvent peer,
                       const Ark_Number* windowY);
    Ark_Number (*getScreenX)(Ark_MouseEvent peer);
    void (*setScreenX)(Ark_MouseEvent peer,
                       const Ark_Number* screenX);
    Ark_Number (*getScreenY)(Ark_MouseEvent peer);
    void (*setScreenY)(Ark_MouseEvent peer,
                       const Ark_Number* screenY);
    Ark_Number (*getX)(Ark_MouseEvent peer);
    void (*setX)(Ark_MouseEvent peer,
                 const Ark_Number* x);
    Ark_Number (*getY)(Ark_MouseEvent peer);
    void (*setY)(Ark_MouseEvent peer,
                 const Ark_Number* y);
    Callback_Void (*getStopPropagation)(Ark_MouseEvent peer);
    void (*setStopPropagation)(Ark_MouseEvent peer,
                               const Callback_Void* stopPropagation);
} GENERATED_ArkUIMouseEventAccessor;

typedef struct GENERATED_ArkUIMutableStyledStringAccessor {
    void (*destroyPeer)(Ark_MutableStyledString peer);
    Ark_MutableStyledString (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*replaceString)(Ark_VMContext vmContext,
                          Ark_MutableStyledString peer,
                          const Ark_Number* start,
                          const Ark_Number* length,
                          const Ark_String* other);
    void (*insertString)(Ark_VMContext vmContext,
                         Ark_MutableStyledString peer,
                         const Ark_Number* start,
                         const Ark_String* other);
    void (*removeString)(Ark_VMContext vmContext,
                         Ark_MutableStyledString peer,
                         const Ark_Number* start,
                         const Ark_Number* length);
    void (*replaceStyle)(Ark_VMContext vmContext,
                         Ark_MutableStyledString peer,
                         const Ark_SpanStyle* spanStyle);
    void (*setStyle)(Ark_VMContext vmContext,
                     Ark_MutableStyledString peer,
                     const Ark_SpanStyle* spanStyle);
    void (*removeStyle)(Ark_VMContext vmContext,
                        Ark_MutableStyledString peer,
                        const Ark_Number* start,
                        const Ark_Number* length,
                        Ark_StyledStringKey styledKey);
    void (*removeStyles)(Ark_VMContext vmContext,
                         Ark_MutableStyledString peer,
                         const Ark_Number* start,
                         const Ark_Number* length);
    void (*clearStyles)(Ark_MutableStyledString peer);
    void (*replaceStyledString)(Ark_VMContext vmContext,
                                Ark_MutableStyledString peer,
                                const Ark_Number* start,
                                const Ark_Number* length,
                                Ark_StyledString other);
    void (*insertStyledString)(Ark_VMContext vmContext,
                               Ark_MutableStyledString peer,
                               const Ark_Number* start,
                               Ark_StyledString other);
    void (*appendStyledString)(Ark_MutableStyledString peer,
                               Ark_StyledString other);
} GENERATED_ArkUIMutableStyledStringAccessor;

typedef struct GENERATED_ArkUINavDestinationContextAccessor {
    void (*destroyPeer)(Ark_NavDestinationContext peer);
    Ark_NavDestinationContext (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Opt_RouteMapConfig (*getConfigInRouteMap)(Ark_NavDestinationContext peer);
    Ark_NavPathInfo (*getPathInfo)(Ark_NavDestinationContext peer);
    void (*setPathInfo)(Ark_NavDestinationContext peer,
                        Ark_NavPathInfo pathInfo);
    Ark_NavPathStack (*getPathStack)(Ark_NavDestinationContext peer);
    void (*setPathStack)(Ark_NavDestinationContext peer,
                         Ark_NavPathStack pathStack);
    Opt_String (*getNavDestinationId)(Ark_NavDestinationContext peer);
    void (*setNavDestinationId)(Ark_NavDestinationContext peer,
                                const Ark_String* navDestinationId);
} GENERATED_ArkUINavDestinationContextAccessor;

typedef struct GENERATED_ArkUINavExtenderAccessor {
    void (*setNavigationOptions)(Ark_NativePointer ptr,
                                 Ark_NavPathStack pathStack);
    void (*setUpdateStackCallback)(Ark_NavPathStack peer,
                                   const NavExtender_OnUpdateStack* callback);
    void (*syncStack)(Ark_NavPathStack peer);
    Ark_Boolean (*checkNeedCreate)(Ark_NativePointer navigation,
                                   Ark_Int32 index);
    void (*setNavDestinationNode)(Ark_NavPathStack peer,
                                  Ark_Int32 index,
                                  Ark_NativePointer node);
    void (*pushPath)(Ark_NavPathStack pathStack,
                     Ark_NavPathInfo info,
                     const Ark_NavigationOptions* options);
    void (*replacePath)(Ark_NavPathStack pathStack,
                        Ark_NavPathInfo info,
                        const Ark_NavigationOptions* options);
    Ark_String (*pop)(Ark_NavPathStack pathStack,
                      Ark_Boolean animated);
    void (*setOnPopCallback)(Ark_NavPathStack pathStack,
                             const Callback_String_Void* popCallback);
    Ark_String (*getIdByIndex)(Ark_NavPathStack pathStack,
                               Ark_Int32 index);
    Array_String (*getIdByName)(Ark_NavPathStack pathStack,
                                const Ark_String* name);
    void (*popToIndex)(Ark_NavPathStack pathStack,
                       Ark_Int32 index,
                       Ark_Boolean animated);
    Ark_Number (*popToName)(Ark_NavPathStack pathStack,
                            const Ark_String* name,
                            Ark_Boolean animated);
} GENERATED_ArkUINavExtenderAccessor;

typedef struct GENERATED_ArkUINavigationTransitionProxyAccessor {
    void (*destroyPeer)(Ark_NavigationTransitionProxy peer);
    Ark_NavigationTransitionProxy (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*finishTransition)(Ark_NavigationTransitionProxy peer);
    void (*cancelTransition)(Ark_NavigationTransitionProxy peer);
    void (*updateTransition)(Ark_NavigationTransitionProxy peer,
                             const Ark_Number* progress);
    Ark_NavContentInfo (*getFrom)(Ark_NavigationTransitionProxy peer);
    void (*setFrom)(Ark_NavigationTransitionProxy peer,
                    const Ark_NavContentInfo* from);
    Ark_NavContentInfo (*getTo)(Ark_NavigationTransitionProxy peer);
    void (*setTo)(Ark_NavigationTransitionProxy peer,
                  const Ark_NavContentInfo* to);
    Opt_Boolean (*getIsInteractive)(Ark_NavigationTransitionProxy peer);
    void (*setIsInteractive)(Ark_NavigationTransitionProxy peer,
                             Ark_Boolean isInteractive);
} GENERATED_ArkUINavigationTransitionProxyAccessor;

typedef struct GENERATED_ArkUINavPathInfoAccessor {
    void (*destroyPeer)(Ark_NavPathInfo peer);
    Ark_NavPathInfo (*ctor)(const Ark_String* name,
                            const Ark_Object* param,
                            const Opt_Callback_PopInfo_Void* onPop);
    Ark_NativePointer (*getFinalizer)();
    Ark_String (*getName)(Ark_NavPathInfo peer);
    void (*setName)(Ark_NavPathInfo peer,
                    const Ark_String* name);
    Opt_Object (*getParam)(Ark_NavPathInfo peer);
    void (*setParam)(Ark_NavPathInfo peer,
                     const Ark_Object* param);
    Opt_Callback_PopInfo_Void (*getOnPop)(Ark_NavPathInfo peer);
    void (*setOnPop)(Ark_NavPathInfo peer,
                     const Callback_PopInfo_Void* onPop);
} GENERATED_ArkUINavPathInfoAccessor;

typedef struct GENERATED_ArkUINavPathStackAccessor {
    void (*destroyPeer)(Ark_NavPathStack peer);
    Ark_NavPathStack (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*pushPath0)(Ark_NavPathStack peer,
                      Ark_NavPathInfo info,
                      const Opt_Boolean* animated);
    void (*pushPath1)(Ark_NavPathStack peer,
                      Ark_NavPathInfo info,
                      const Opt_NavigationOptions* options);
    void (*pushDestination0)(Ark_VMContext vmContext,
                             Ark_AsyncWorkerPtr asyncWorker,
                             Ark_NavPathStack peer,
                             Ark_NavPathInfo info,
                             const Opt_Boolean* animated,
                             const Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*pushDestination1)(Ark_VMContext vmContext,
                             Ark_AsyncWorkerPtr asyncWorker,
                             Ark_NavPathStack peer,
                             Ark_NavPathInfo info,
                             const Opt_NavigationOptions* options,
                             const Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*pushPathByName0)(Ark_NavPathStack peer,
                            const Ark_String* name,
                            const Ark_Object* param,
                            const Opt_Boolean* animated);
    void (*pushPathByName1)(Ark_NavPathStack peer,
                            const Ark_String* name,
                            const Ark_Object* param,
                            const Callback_PopInfo_Void* onPop,
                            const Opt_Boolean* animated);
    void (*pushDestinationByName0)(Ark_VMContext vmContext,
                                   Ark_AsyncWorkerPtr asyncWorker,
                                   Ark_NavPathStack peer,
                                   const Ark_String* name,
                                   const Ark_Object* param,
                                   const Opt_Boolean* animated,
                                   const Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*pushDestinationByName1)(Ark_VMContext vmContext,
                                   Ark_AsyncWorkerPtr asyncWorker,
                                   Ark_NavPathStack peer,
                                   const Ark_String* name,
                                   const Ark_Object* param,
                                   const Callback_PopInfo_Void* onPop,
                                   const Opt_Boolean* animated,
                                   const Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*replacePath0)(Ark_NavPathStack peer,
                         Ark_NavPathInfo info,
                         const Opt_Boolean* animated);
    void (*replacePath1)(Ark_NavPathStack peer,
                         Ark_NavPathInfo info,
                         const Opt_NavigationOptions* options);
    void (*replacePathByName)(Ark_NavPathStack peer,
                              const Ark_String* name,
                              const Ark_Object* param,
                              const Opt_Boolean* animated);
    Ark_Number (*removeByIndexes)(Ark_NavPathStack peer,
                                  const Array_Number* indexes);
    Ark_Number (*removeByName)(Ark_NavPathStack peer,
                               const Ark_String* name);
    Ark_Boolean (*removeByNavDestinationId)(Ark_NavPathStack peer,
                                            const Ark_String* navDestinationId);
    Opt_NavPathInfo (*pop0)(Ark_NavPathStack peer,
                            const Opt_Boolean* animated);
    Opt_NavPathInfo (*pop1)(Ark_NavPathStack peer,
                            const Ark_Object* result,
                            const Opt_Boolean* animated);
    Ark_Number (*popToName0)(Ark_NavPathStack peer,
                             const Ark_String* name,
                             const Opt_Boolean* animated);
    Ark_Number (*popToName1)(Ark_NavPathStack peer,
                             const Ark_String* name,
                             const Ark_Object* result,
                             const Opt_Boolean* animated);
    void (*popToIndex0)(Ark_NavPathStack peer,
                        const Ark_Number* index,
                        const Opt_Boolean* animated);
    void (*popToIndex1)(Ark_NavPathStack peer,
                        const Ark_Number* index,
                        const Ark_Object* result,
                        const Opt_Boolean* animated);
    Ark_Number (*moveToTop)(Ark_NavPathStack peer,
                            const Ark_String* name,
                            const Opt_Boolean* animated);
    void (*moveIndexToTop)(Ark_NavPathStack peer,
                           const Ark_Number* index,
                           const Opt_Boolean* animated);
    void (*clear)(Ark_NavPathStack peer,
                  const Opt_Boolean* animated);
    Array_String (*getAllPathName)(Ark_NavPathStack peer);
    Opt_Object (*getParamByIndex)(Ark_NavPathStack peer,
                                  const Ark_Number* index);
    Array_Object (*getParamByName)(Ark_NavPathStack peer,
                                   const Ark_String* name);
    Array_Number (*getIndexByName)(Ark_NavPathStack peer,
                                   const Ark_String* name);
    Opt_NavPathStack (*getParent)(Ark_NavPathStack peer);
    Ark_Number (*size)(Ark_NavPathStack peer);
    void (*disableAnimation)(Ark_NavPathStack peer,
                             Ark_Boolean value);
    void (*setInterception)(Ark_NavPathStack peer,
                            const Ark_NavigationInterception* interception);
} GENERATED_ArkUINavPathStackAccessor;

typedef struct GENERATED_ArkUIPanGestureEventAccessor {
    void (*destroyPeer)(Ark_PanGestureEvent peer);
    Ark_PanGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getOffsetX)(Ark_PanGestureEvent peer);
    void (*setOffsetX)(Ark_PanGestureEvent peer,
                       const Ark_Number* offsetX);
    Ark_Number (*getOffsetY)(Ark_PanGestureEvent peer);
    void (*setOffsetY)(Ark_PanGestureEvent peer,
                       const Ark_Number* offsetY);
    Ark_Number (*getVelocityX)(Ark_PanGestureEvent peer);
    void (*setVelocityX)(Ark_PanGestureEvent peer,
                         const Ark_Number* velocityX);
    Ark_Number (*getVelocityY)(Ark_PanGestureEvent peer);
    void (*setVelocityY)(Ark_PanGestureEvent peer,
                         const Ark_Number* velocityY);
    Ark_Number (*getVelocity)(Ark_PanGestureEvent peer);
    void (*setVelocity)(Ark_PanGestureEvent peer,
                        const Ark_Number* velocity);
} GENERATED_ArkUIPanGestureEventAccessor;

typedef struct GENERATED_ArkUIPanGestureInterfaceAccessor {
    void (*destroyPeer)(Ark_PanGestureInterface peer);
    Ark_PanGestureInterface (*ctor)(const Opt_Type_PanGestureInterface_callable0_value* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_PanGestureInterface (*onActionStart)(Ark_PanGestureInterface peer,
                                             const Callback_GestureEvent_Void* event);
    Ark_PanGestureInterface (*onActionUpdate)(Ark_PanGestureInterface peer,
                                              const Callback_GestureEvent_Void* event);
    Ark_PanGestureInterface (*onActionEnd)(Ark_PanGestureInterface peer,
                                           const Callback_GestureEvent_Void* event);
    Ark_PanGestureInterface (*onActionCancel)(Ark_PanGestureInterface peer,
                                              const Callback_Void* event);
} GENERATED_ArkUIPanGestureInterfaceAccessor;

typedef struct GENERATED_ArkUIPanGestureOptionsAccessor {
    void (*destroyPeer)(Ark_PanGestureOptions peer);
    Ark_PanGestureOptions (*ctor)(const Opt_Literal_Number_distance_fingers_PanDirection_direction* value);
    Ark_NativePointer (*getFinalizer)();
    void (*setDirection)(Ark_PanGestureOptions peer,
                         Ark_PanDirection value);
    void (*setDistance)(Ark_PanGestureOptions peer,
                        const Ark_Number* value);
    void (*setFingers)(Ark_PanGestureOptions peer,
                       const Ark_Number* value);
    Ark_PanDirection (*getDirection)(Ark_PanGestureOptions peer);
} GENERATED_ArkUIPanGestureOptionsAccessor;

typedef struct GENERATED_ArkUIPanRecognizerAccessor {
    void (*destroyPeer)(Ark_PanRecognizer peer);
    Ark_PanRecognizer (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_PanGestureOptions (*getPanGestureOptions)(Ark_PanRecognizer peer);
} GENERATED_ArkUIPanRecognizerAccessor;

typedef struct GENERATED_ArkUIParagraphStyleAccessor {
    void (*destroyPeer)(Ark_ParagraphStyle peer);
    Ark_ParagraphStyle (*ctor)(const Opt_ParagraphStyleInterface* value);
    Ark_NativePointer (*getFinalizer)();
    Opt_TextAlign (*getTextAlign)(Ark_ParagraphStyle peer);
    Opt_Number (*getTextIndent)(Ark_ParagraphStyle peer);
    Opt_Number (*getMaxLines)(Ark_ParagraphStyle peer);
    Opt_TextOverflow (*getOverflow)(Ark_ParagraphStyle peer);
    Opt_WordBreak (*getWordBreak)(Ark_ParagraphStyle peer);
    Opt_Union_Number_LeadingMarginPlaceholder (*getLeadingMargin)(Ark_ParagraphStyle peer);
} GENERATED_ArkUIParagraphStyleAccessor;

typedef struct GENERATED_ArkUIPinchGestureEventAccessor {
    void (*destroyPeer)(Ark_PinchGestureEvent peer);
    Ark_PinchGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getScale)(Ark_PinchGestureEvent peer);
    void (*setScale)(Ark_PinchGestureEvent peer,
                     const Ark_Number* scale);
    Ark_Number (*getPinchCenterX)(Ark_PinchGestureEvent peer);
    void (*setPinchCenterX)(Ark_PinchGestureEvent peer,
                            const Ark_Number* pinchCenterX);
    Ark_Number (*getPinchCenterY)(Ark_PinchGestureEvent peer);
    void (*setPinchCenterY)(Ark_PinchGestureEvent peer,
                            const Ark_Number* pinchCenterY);
} GENERATED_ArkUIPinchGestureEventAccessor;

typedef struct GENERATED_ArkUIPinchGestureInterfaceAccessor {
    void (*destroyPeer)(Ark_PinchGestureInterface peer);
    Ark_PinchGestureInterface (*ctor)(const Opt_Literal_Number_distance_fingers* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_PinchGestureInterface (*onActionStart)(Ark_PinchGestureInterface peer,
                                               const Callback_GestureEvent_Void* event);
    Ark_PinchGestureInterface (*onActionUpdate)(Ark_PinchGestureInterface peer,
                                                const Callback_GestureEvent_Void* event);
    Ark_PinchGestureInterface (*onActionEnd)(Ark_PinchGestureInterface peer,
                                             const Callback_GestureEvent_Void* event);
    Ark_PinchGestureInterface (*onActionCancel)(Ark_PinchGestureInterface peer,
                                                const Callback_Void* event);
} GENERATED_ArkUIPinchGestureInterfaceAccessor;

typedef struct GENERATED_ArkUIPixelMapAccessor {
    void (*destroyPeer)(Ark_PixelMap peer);
    Ark_PixelMap (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*readPixelsToBufferSync)(Ark_PixelMap peer,
                                   const Ark_Buffer* dst);
    void (*writeBufferToPixels)(Ark_PixelMap peer,
                                const Ark_Buffer* src);
    Ark_Boolean (*getIsEditable)(Ark_PixelMap peer);
    Ark_Boolean (*getIsStrideAlignment)(Ark_PixelMap peer);
} GENERATED_ArkUIPixelMapAccessor;

typedef struct GENERATED_ArkUIPixelMapMockAccessor {
    void (*destroyPeer)(Ark_PixelMapMock peer);
    Ark_PixelMapMock (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*release)(Ark_PixelMapMock peer);
} GENERATED_ArkUIPixelMapMockAccessor;

typedef struct GENERATED_ArkUIProgressMaskAccessor {
    void (*destroyPeer)(Ark_ProgressMask peer);
    Ark_ProgressMask (*ctor)(const Ark_Number* value,
                             const Ark_Number* total,
                             const Ark_ResourceColor* color);
    Ark_NativePointer (*getFinalizer)();
    void (*updateProgress)(Ark_ProgressMask peer,
                           const Ark_Number* value);
    void (*updateColor)(Ark_ProgressMask peer,
                        const Ark_ResourceColor* value);
    void (*enableBreathingAnimation)(Ark_ProgressMask peer,
                                     Ark_Boolean value);
} GENERATED_ArkUIProgressMaskAccessor;

typedef struct GENERATED_ArkUIRenderingContextSettingsAccessor {
    void (*destroyPeer)(Ark_RenderingContextSettings peer);
    Ark_RenderingContextSettings (*ctor)(const Opt_Boolean* antialias);
    Ark_NativePointer (*getFinalizer)();
    Opt_Boolean (*getAntialias)(Ark_RenderingContextSettings peer);
    void (*setAntialias)(Ark_RenderingContextSettings peer,
                         Ark_Boolean antialias);
} GENERATED_ArkUIRenderingContextSettingsAccessor;

typedef struct GENERATED_ArkUIReplaceSymbolEffectAccessor {
    void (*destroyPeer)(Ark_ReplaceSymbolEffect peer);
    Ark_ReplaceSymbolEffect (*ctor)(const Opt_EffectScope* scope);
    Ark_NativePointer (*getFinalizer)();
    Opt_EffectScope (*getScope)(Ark_ReplaceSymbolEffect peer);
    void (*setScope)(Ark_ReplaceSymbolEffect peer,
                     Ark_EffectScope scope);
} GENERATED_ArkUIReplaceSymbolEffectAccessor;

typedef struct GENERATED_ArkUIRestrictedWorkerAccessor {
    void (*destroyPeer)(Ark_RestrictedWorker peer);
    Ark_RestrictedWorker (*ctor)(const Ark_String* scriptURL,
                                 const Opt_WorkerOptions* options);
    Ark_NativePointer (*getFinalizer)();
    void (*postMessage0)(Ark_VMContext vmContext,
                         Ark_RestrictedWorker peer,
                         const Ark_Object* message,
                         const Array_Buffer* transfer);
    void (*postMessage1)(Ark_VMContext vmContext,
                         Ark_RestrictedWorker peer,
                         const Ark_Object* message,
                         const Opt_PostMessageOptions* options);
    void (*postMessageWithSharedSendable)(Ark_VMContext vmContext,
                                          Ark_RestrictedWorker peer,
                                          const Ark_Object* message,
                                          const Opt_Array_Buffer* transfer);
    void (*on)(Ark_VMContext vmContext,
               Ark_RestrictedWorker peer,
               const Ark_String* Type,
               const Ark_WorkerEventListener* listener);
    void (*once)(Ark_VMContext vmContext,
                 Ark_RestrictedWorker peer,
                 const Ark_String* Type,
                 const Ark_WorkerEventListener* listener);
    void (*off)(Ark_VMContext vmContext,
                Ark_RestrictedWorker peer,
                const Ark_String* Type,
                const Opt_WorkerEventListener* listener);
    void (*terminate)(Ark_VMContext vmContext,
                      Ark_RestrictedWorker peer);
    void (*addEventListener)(Ark_VMContext vmContext,
                             Ark_RestrictedWorker peer,
                             const Ark_String* Type,
                             const Ark_WorkerEventListener* listener);
    Ark_Boolean (*dispatchEvent)(Ark_VMContext vmContext,
                                 Ark_RestrictedWorker peer,
                                 const Ark_Event* event);
    void (*removeEventListener)(Ark_VMContext vmContext,
                                Ark_RestrictedWorker peer,
                                const Ark_String* Type,
                                const Opt_WorkerEventListener* callback_);
    void (*removeAllListener)(Ark_VMContext vmContext,
                              Ark_RestrictedWorker peer);
    void (*registerGlobalCallObject)(Ark_VMContext vmContext,
                                     Ark_RestrictedWorker peer,
                                     const Ark_String* instanceName,
                                     const Ark_Object* globalCallObject);
    void (*unregisterGlobalCallObject)(Ark_VMContext vmContext,
                                       Ark_RestrictedWorker peer,
                                       const Opt_String* instanceName);
    Opt_RestrictedWorker_onexit_Callback (*getOnexit)(Ark_RestrictedWorker peer);
    void (*setOnexit)(Ark_RestrictedWorker peer,
                      const RestrictedWorker_onexit_Callback* onexit);
    Opt_RestrictedWorker_onerror_Callback (*getOnerror)(Ark_RestrictedWorker peer);
    void (*setOnerror)(Ark_RestrictedWorker peer,
                       const RestrictedWorker_onerror_Callback* onerror);
    Opt_RestrictedWorker_onmessage_Callback (*getOnmessage)(Ark_RestrictedWorker peer);
    void (*setOnmessage)(Ark_RestrictedWorker peer,
                         const RestrictedWorker_onmessage_Callback* onmessage);
    Opt_RestrictedWorker_onmessage_Callback (*getOnmessageerror)(Ark_RestrictedWorker peer);
    void (*setOnmessageerror)(Ark_RestrictedWorker peer,
                              const RestrictedWorker_onmessage_Callback* onmessageerror);
} GENERATED_ArkUIRestrictedWorkerAccessor;

typedef struct GENERATED_ArkUIRichEditorBaseControllerAccessor {
    void (*destroyPeer)(Ark_RichEditorBaseController peer);
    Ark_RichEditorBaseController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getCaretOffset)(Ark_RichEditorBaseController peer);
    Ark_Boolean (*setCaretOffset)(Ark_RichEditorBaseController peer,
                                  const Ark_Number* offset);
    void (*closeSelectionMenu)(Ark_RichEditorBaseController peer);
    Ark_RichEditorTextStyle (*getTypingStyle)(Ark_RichEditorBaseController peer);
    void (*setTypingStyle)(Ark_RichEditorBaseController peer,
                           const Ark_RichEditorTextStyle* value);
    void (*setSelection)(Ark_RichEditorBaseController peer,
                         const Ark_Number* selectionStart,
                         const Ark_Number* selectionEnd,
                         const Opt_SelectionOptions* options);
    Ark_Boolean (*isEditing)(Ark_RichEditorBaseController peer);
    void (*stopEditing)(Ark_RichEditorBaseController peer);
    Ark_LayoutManager (*getLayoutManager)(Ark_RichEditorBaseController peer);
    Ark_PreviewText (*getPreviewText)(Ark_RichEditorBaseController peer);
} GENERATED_ArkUIRichEditorBaseControllerAccessor;

typedef struct GENERATED_ArkUIRichEditorControllerAccessor {
    void (*destroyPeer)(Ark_RichEditorController peer);
    Ark_RichEditorController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*addTextSpan)(Ark_RichEditorController peer,
                              const Ark_String* value,
                              const Opt_RichEditorTextSpanOptions* options);
    Ark_Number (*addImageSpan)(Ark_RichEditorController peer,
                               const Ark_Union_PixelMap_ResourceStr* value,
                               const Opt_RichEditorImageSpanOptions* options);
    Ark_Number (*addBuilderSpan)(Ark_RichEditorController peer,
                                 const CustomNodeBuilder* value,
                                 const Opt_RichEditorBuilderSpanOptions* options);
    Ark_Number (*addSymbolSpan)(Ark_RichEditorController peer,
                                const Ark_CustomObject* value,
                                const Opt_RichEditorSymbolSpanOptions* options);
    void (*updateSpanStyle)(Ark_RichEditorController peer,
                            const Ark_Type_RichEditorController_updateSpanStyle_value* value);
    void (*updateParagraphStyle)(Ark_RichEditorController peer,
                                 const Ark_RichEditorParagraphStyleOptions* value);
    void (*deleteSpans)(Ark_RichEditorController peer,
                        const Opt_RichEditorRange* value);
    Array_Union_RichEditorImageSpanResult_RichEditorTextSpanResult (*getSpans)(Ark_RichEditorController peer,
                                                                               const Opt_RichEditorRange* value);
    Array_RichEditorParagraphResult (*getParagraphs)(Ark_RichEditorController peer,
                                                     const Opt_RichEditorRange* value);
    Ark_RichEditorSelection (*getSelection)(Ark_RichEditorController peer);
    Ark_StyledString (*toStyledString)(Ark_VMContext vmContext,
                                       Ark_RichEditorController peer,
                                       const Ark_RichEditorRange* value);
} GENERATED_ArkUIRichEditorControllerAccessor;

typedef struct GENERATED_ArkUIRichEditorStyledStringControllerAccessor {
    void (*destroyPeer)(Ark_RichEditorStyledStringController peer);
    Ark_RichEditorStyledStringController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*setStyledString)(Ark_RichEditorStyledStringController peer,
                            Ark_StyledString styledString);
    Ark_MutableStyledString (*getStyledString)(Ark_RichEditorStyledStringController peer);
    Ark_RichEditorRange (*getSelection)(Ark_RichEditorStyledStringController peer);
    void (*onContentChanged)(Ark_RichEditorStyledStringController peer,
                             const Ark_StyledStringChangedListener* listener);
} GENERATED_ArkUIRichEditorStyledStringControllerAccessor;

typedef struct GENERATED_ArkUIRotationGestureEventAccessor {
    void (*destroyPeer)(Ark_RotationGestureEvent peer);
    Ark_RotationGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getAngle)(Ark_RotationGestureEvent peer);
    void (*setAngle)(Ark_RotationGestureEvent peer,
                     const Ark_Number* angle);
} GENERATED_ArkUIRotationGestureEventAccessor;

typedef struct GENERATED_ArkUIRotationGestureInterfaceAccessor {
    void (*destroyPeer)(Ark_RotationGestureInterface peer);
    Ark_RotationGestureInterface (*ctor)(const Opt_Literal_Number_angle_fingers* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_RotationGestureInterface (*onActionStart)(Ark_RotationGestureInterface peer,
                                                  const Callback_GestureEvent_Void* event);
    Ark_RotationGestureInterface (*onActionUpdate)(Ark_RotationGestureInterface peer,
                                                   const Callback_GestureEvent_Void* event);
    Ark_RotationGestureInterface (*onActionEnd)(Ark_RotationGestureInterface peer,
                                                const Callback_GestureEvent_Void* event);
    Ark_RotationGestureInterface (*onActionCancel)(Ark_RotationGestureInterface peer,
                                                   const Callback_Void* event);
} GENERATED_ArkUIRotationGestureInterfaceAccessor;

typedef struct GENERATED_ArkUIScaleSymbolEffectAccessor {
    void (*destroyPeer)(Ark_ScaleSymbolEffect peer);
    Ark_ScaleSymbolEffect (*ctor)(const Opt_EffectScope* scope,
                                  const Opt_EffectDirection* direction);
    Ark_NativePointer (*getFinalizer)();
    Opt_EffectScope (*getScope)(Ark_ScaleSymbolEffect peer);
    void (*setScope)(Ark_ScaleSymbolEffect peer,
                     Ark_EffectScope scope);
    Opt_EffectDirection (*getDirection)(Ark_ScaleSymbolEffect peer);
    void (*setDirection)(Ark_ScaleSymbolEffect peer,
                         Ark_EffectDirection direction);
} GENERATED_ArkUIScaleSymbolEffectAccessor;

typedef struct GENERATED_ArkUISceneAccessor {
    void (*destroyPeer)(Ark_Scene peer);
    Ark_Scene (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Scene (*load)(const Opt_ResourceStr* uri);
    void (*destroy)(Ark_Scene peer);
} GENERATED_ArkUISceneAccessor;

typedef struct GENERATED_ArkUIScrollableTargetInfoAccessor {
    void (*destroyPeer)(Ark_ScrollableTargetInfo peer);
    Ark_ScrollableTargetInfo (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*isBegin)(Ark_ScrollableTargetInfo peer);
    Ark_Boolean (*isEnd)(Ark_ScrollableTargetInfo peer);
} GENERATED_ArkUIScrollableTargetInfoAccessor;

typedef struct GENERATED_ArkUIScrollerAccessor {
    void (*destroyPeer)(Ark_Scroller peer);
    Ark_Scroller (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*scrollTo)(Ark_Scroller peer,
                     const Ark_ScrollOptions* options);
    void (*scrollEdge)(Ark_Scroller peer,
                       Ark_Edge value,
                       const Opt_ScrollEdgeOptions* options);
    void (*fling)(Ark_VMContext vmContext,
                  Ark_Scroller peer,
                  const Ark_Number* velocity);
    void (*scrollPage0)(Ark_Scroller peer,
                        const Ark_ScrollPageOptions* value);
    void (*scrollPage1)(Ark_Scroller peer,
                        const Ark_Literal_Boolean_next_Axis_direction* value);
    Ark_OffsetResult (*currentOffset)(Ark_Scroller peer);
    void (*scrollToIndex)(Ark_Scroller peer,
                          const Ark_Number* value,
                          const Opt_Boolean* smooth,
                          const Opt_ScrollAlign* align,
                          const Opt_ScrollToIndexOptions* options);
    void (*scrollBy)(Ark_Scroller peer,
                     const Ark_Length* dx,
                     const Ark_Length* dy);
    Ark_Boolean (*isAtEnd)(Ark_Scroller peer);
    Ark_RectResult (*getItemRect)(Ark_VMContext vmContext,
                                  Ark_Scroller peer,
                                  const Ark_Number* index);
    Ark_Number (*getItemIndex)(Ark_VMContext vmContext,
                               Ark_Scroller peer,
                               const Ark_Number* x,
                               const Ark_Number* y);
} GENERATED_ArkUIScrollerAccessor;

typedef struct GENERATED_ArkUISearchControllerAccessor {
    void (*destroyPeer)(Ark_SearchController peer);
    Ark_SearchController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*caretPosition)(Ark_SearchController peer,
                          const Ark_Number* value);
    void (*stopEditing)(Ark_SearchController peer);
    void (*setTextSelection)(Ark_SearchController peer,
                             const Ark_Number* selectionStart,
                             const Ark_Number* selectionEnd,
                             const Opt_SelectionOptions* options);
} GENERATED_ArkUISearchControllerAccessor;

typedef struct GENERATED_ArkUISearchOpsAccessor {
    Ark_NativePointer (*registerSearchValueCallback)(Ark_NativePointer node,
                                                     const Ark_String* value,
                                                     const SearchValueCallback* callback);
} GENERATED_ArkUISearchOpsAccessor;

typedef struct GENERATED_ArkUIStateStylesOpsAccessor {
    void (*onStateStyleChange)(Ark_NativePointer node,
                               const Callback_StateStylesChange* stateStyleChange);
} GENERATED_ArkUIStateStylesOpsAccessor;

typedef struct GENERATED_ArkUIStyledStringAccessor {
    void (*destroyPeer)(Ark_StyledString peer);
    Ark_StyledString (*ctor)(const Ark_Union_String_ImageAttachment_CustomSpan* value,
                             const Opt_Array_StyleOptions* styles);
    Ark_NativePointer (*getFinalizer)();
    Ark_String (*getString)(Ark_StyledString peer);
    Array_SpanStyle (*getStyles)(Ark_VMContext vmContext,
                                 Ark_StyledString peer,
                                 const Ark_Number* start,
                                 const Ark_Number* length,
                                 const Opt_StyledStringKey* styledKey);
    Ark_Boolean (*equals)(Ark_StyledString peer,
                          Ark_StyledString other);
    Ark_StyledString (*subStyledString)(Ark_VMContext vmContext,
                                        Ark_StyledString peer,
                                        const Ark_Number* start,
                                        const Opt_Number* length);
    void (*fromHtml)(Ark_VMContext vmContext,
                     Ark_AsyncWorkerPtr asyncWorker,
                     const Ark_String* html,
                     const Callback_Opt_StyledString_Opt_Array_String_Void* outputArgumentForReturningPromise);
    Ark_String (*toHtml)(Ark_VMContext vmContext,
                         Ark_StyledString styledString);
    Ark_Buffer (*marshalling)(Ark_StyledString styledString);
    void (*unmarshalling)(Ark_VMContext vmContext,
                          Ark_AsyncWorkerPtr asyncWorker,
                          const Ark_Buffer* buffer,
                          const Callback_Opt_StyledString_Opt_Array_String_Void* outputArgumentForReturningPromise);
    Ark_Number (*getLength)(Ark_StyledString peer);
} GENERATED_ArkUIStyledStringAccessor;

typedef struct GENERATED_ArkUIStyledStringControllerAccessor {
    void (*destroyPeer)(Ark_StyledStringController peer);
    Ark_StyledStringController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*setStyledString)(Ark_StyledStringController peer,
                            Ark_StyledString styledString);
    Ark_MutableStyledString (*getStyledString)(Ark_StyledStringController peer);
} GENERATED_ArkUIStyledStringControllerAccessor;

typedef struct GENERATED_ArkUISubmitEventAccessor {
    void (*destroyPeer)(Ark_SubmitEvent peer);
    Ark_SubmitEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*keepEditableState)(Ark_SubmitEvent peer);
    Ark_String (*getText)(Ark_SubmitEvent peer);
    void (*setText)(Ark_SubmitEvent peer,
                    const Ark_String* text);
} GENERATED_ArkUISubmitEventAccessor;

typedef struct GENERATED_ArkUISwipeGestureEventAccessor {
    void (*destroyPeer)(Ark_SwipeGestureEvent peer);
    Ark_SwipeGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Number (*getAngle)(Ark_SwipeGestureEvent peer);
    void (*setAngle)(Ark_SwipeGestureEvent peer,
                     const Ark_Number* angle);
    Ark_Number (*getSpeed)(Ark_SwipeGestureEvent peer);
    void (*setSpeed)(Ark_SwipeGestureEvent peer,
                     const Ark_Number* speed);
} GENERATED_ArkUISwipeGestureEventAccessor;

typedef struct GENERATED_ArkUISwipeGestureInterfaceAccessor {
    void (*destroyPeer)(Ark_SwipeGestureInterface peer);
    Ark_SwipeGestureInterface (*ctor)(const Opt_Literal_Number_fingers_speed_SwipeDirection_direction* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_SwipeGestureInterface (*onAction)(Ark_SwipeGestureInterface peer,
                                          const Callback_GestureEvent_Void* event);
} GENERATED_ArkUISwipeGestureInterfaceAccessor;

typedef struct GENERATED_ArkUISwiperContentTransitionProxyAccessor {
    void (*destroyPeer)(Ark_SwiperContentTransitionProxy peer);
    Ark_SwiperContentTransitionProxy (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*finishTransition)(Ark_SwiperContentTransitionProxy peer);
    Ark_Number (*getSelectedIndex)(Ark_SwiperContentTransitionProxy peer);
    void (*setSelectedIndex)(Ark_SwiperContentTransitionProxy peer,
                             const Ark_Number* selectedIndex);
    Ark_Number (*getIndex)(Ark_SwiperContentTransitionProxy peer);
    void (*setIndex)(Ark_SwiperContentTransitionProxy peer,
                     const Ark_Number* index);
    Ark_Number (*getPosition)(Ark_SwiperContentTransitionProxy peer);
    void (*setPosition)(Ark_SwiperContentTransitionProxy peer,
                        const Ark_Number* position);
    Ark_Number (*getMainAxisLength)(Ark_SwiperContentTransitionProxy peer);
    void (*setMainAxisLength)(Ark_SwiperContentTransitionProxy peer,
                              const Ark_Number* mainAxisLength);
} GENERATED_ArkUISwiperContentTransitionProxyAccessor;

typedef struct GENERATED_ArkUISwiperControllerAccessor {
    void (*destroyPeer)(Ark_SwiperController peer);
    Ark_SwiperController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*showNext)(Ark_SwiperController peer);
    void (*showPrevious)(Ark_SwiperController peer);
    void (*changeIndex)(Ark_SwiperController peer,
                        const Ark_Number* index,
                        const Opt_Boolean* useAnimation);
    void (*finishAnimation)(Ark_SwiperController peer,
                            const Opt_VoidCallback* callback_);
} GENERATED_ArkUISwiperControllerAccessor;

typedef struct GENERATED_ArkUISystemOpsAccessor {
    Ark_NativePointer (*StartFrame)();
    void (*EndFrame)(Ark_NativePointer root);
    void (*syncInstanceId)(Ark_Int32 instanceId);
    void (*restoreInstanceId)();
    Ark_Int32 (*getResourceId)(const Ark_String* bundleName,
                               const Ark_String* moduleName,
                               const Array_String* params);
    void (*resourceManagerReset)();
    void (*setFrameCallback)(const Callback_Number_Void* onFrameCallback,
                             const Callback_Number_Void* onIdleCallback,
                             const Ark_Number* delayTime);
} GENERATED_ArkUISystemOpsAccessor;

typedef struct GENERATED_ArkUITabsControllerAccessor {
    void (*destroyPeer)(Ark_TabsController peer);
    Ark_TabsController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*changeIndex)(Ark_TabsController peer,
                        const Ark_Number* value);
} GENERATED_ArkUITabsControllerAccessor;

typedef struct GENERATED_ArkUITapGestureEventAccessor {
    void (*destroyPeer)(Ark_TapGestureEvent peer);
    Ark_TapGestureEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
} GENERATED_ArkUITapGestureEventAccessor;

typedef struct GENERATED_ArkUITapGestureInterfaceAccessor {
    void (*destroyPeer)(Ark_TapGestureInterface peer);
    Ark_TapGestureInterface (*ctor)(const Opt_TapGestureParameters* value);
    Ark_NativePointer (*getFinalizer)();
    Ark_TapGestureInterface (*onAction)(Ark_TapGestureInterface peer,
                                        const Callback_GestureEvent_Void* event);
} GENERATED_ArkUITapGestureInterfaceAccessor;

typedef struct GENERATED_ArkUITextBaseControllerAccessor {
    void (*destroyPeer)(Ark_TextBaseController peer);
    Ark_TextBaseController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*setSelection)(Ark_TextBaseController peer,
                         const Ark_Number* selectionStart,
                         const Ark_Number* selectionEnd,
                         const Opt_SelectionOptions* options);
    void (*closeSelectionMenu)(Ark_TextBaseController peer);
    Ark_LayoutManager (*getLayoutManager)(Ark_TextBaseController peer);
} GENERATED_ArkUITextBaseControllerAccessor;

typedef struct GENERATED_ArkUITextContentControllerBaseAccessor {
    void (*destroyPeer)(Ark_TextContentControllerBase peer);
    Ark_TextContentControllerBase (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_CaretOffset (*getCaretOffset)(Ark_TextContentControllerBase peer);
    Ark_RectResult (*getTextContentRect)(Ark_TextContentControllerBase peer);
    Ark_Number (*getTextContentLineCount)(Ark_TextContentControllerBase peer);
} GENERATED_ArkUITextContentControllerBaseAccessor;

typedef struct GENERATED_ArkUITextControllerAccessor {
    void (*destroyPeer)(Ark_TextController peer);
    Ark_TextController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*closeSelectionMenu)(Ark_TextController peer);
    void (*setStyledString)(Ark_TextController peer,
                            Ark_StyledString value);
} GENERATED_ArkUITextControllerAccessor;

typedef struct GENERATED_ArkUITextEditControllerExAccessor {
    void (*destroyPeer)(Ark_TextEditControllerEx peer);
    Ark_TextEditControllerEx (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_Boolean (*isEditing)(Ark_TextEditControllerEx peer);
    void (*stopEditing)(Ark_TextEditControllerEx peer);
    Ark_Boolean (*setCaretOffset)(Ark_TextEditControllerEx peer,
                                  const Ark_Number* offset);
    Ark_Number (*getCaretOffset)(Ark_TextEditControllerEx peer);
    Ark_PreviewText (*getPreviewText)(Ark_TextEditControllerEx peer);
} GENERATED_ArkUITextEditControllerExAccessor;

typedef struct GENERATED_ArkUITextFieldOpsAccessor {
    Ark_NativePointer (*registerTextFieldValueCallback)(Ark_NativePointer node,
                                                        const Ark_ResourceStr* value,
                                                        const TextFieldValueCallback* callback);
} GENERATED_ArkUITextFieldOpsAccessor;

typedef struct GENERATED_ArkUITextInputControllerAccessor {
    void (*destroyPeer)(Ark_TextInputController peer);
    Ark_TextInputController (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*caretPosition)(Ark_TextInputController peer,
                          const Ark_Number* value);
    void (*setTextSelection)(Ark_TextInputController peer,
                             const Ark_Number* selectionStart,
                             const Ark_Number* selectionEnd,
                             const Opt_SelectionOptions* options);
    void (*stopEditing)(Ark_TextInputController peer);
} GENERATED_ArkUITextInputControllerAccessor;

typedef struct GENERATED_ArkUITextMenuItemIdAccessor {
    void (*destroyPeer)(Ark_TextMenuItemId peer);
    Ark_TextMenuItemId (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_TextMenuItemId (*of)(const Ark_ResourceStr* id);
    Ark_Boolean (*equals)(Ark_TextMenuItemId peer,
                          Ark_TextMenuItemId id);
    Ark_TextMenuItemId (*getCUT)();
    Ark_TextMenuItemId (*getCOPY)();
    Ark_TextMenuItemId (*getPASTE)();
    Ark_TextMenuItemId (*getSELECT_ALL)();
    Ark_TextMenuItemId (*getCOLLABORATION_SERVICE)();
    Ark_TextMenuItemId (*getCAMERA_INPUT)();
    Ark_TextMenuItemId (*getAI_WRITER)();
} GENERATED_ArkUITextMenuItemIdAccessor;

typedef struct GENERATED_ArkUITextPickerDialogAccessor {
    void (*show)(const Opt_TextPickerDialogOptions* options);
} GENERATED_ArkUITextPickerDialogAccessor;

typedef struct GENERATED_ArkUITextShadowStyleAccessor {
    void (*destroyPeer)(Ark_TextShadowStyle peer);
    Ark_TextShadowStyle (*ctor)(const Ark_Union_ShadowOptions_Array_ShadowOptions* value);
    Ark_NativePointer (*getFinalizer)();
    Array_ShadowOptions (*getTextShadow)(Ark_TextShadowStyle peer);
} GENERATED_ArkUITextShadowStyleAccessor;

typedef struct GENERATED_ArkUITextStyle_styled_stringAccessor {
    void (*destroyPeer)(Ark_TextStyle_styled_string peer);
    Ark_TextStyle_styled_string (*ctor)(const Opt_TextStyleInterface* value);
    Ark_NativePointer (*getFinalizer)();
    Opt_ResourceColor (*getFontColor)(Ark_TextStyle_styled_string peer);
    Opt_String (*getFontFamily)(Ark_TextStyle_styled_string peer);
    Opt_Number (*getFontSize)(Ark_TextStyle_styled_string peer);
    Opt_Number (*getFontWeight)(Ark_TextStyle_styled_string peer);
    Opt_FontStyle (*getFontStyle)(Ark_TextStyle_styled_string peer);
} GENERATED_ArkUITextStyle_styled_stringAccessor;

typedef struct GENERATED_ArkUITouchEventAccessor {
    void (*destroyPeer)(Ark_TouchEvent peer);
    Ark_TouchEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Array_HistoricalPoint (*getHistoricalPoints)(Ark_TouchEvent peer);
    Ark_TouchType (*getType)(Ark_TouchEvent peer);
    void (*setType)(Ark_TouchEvent peer,
                    Ark_TouchType type);
    Array_TouchObject (*getTouches)(Ark_TouchEvent peer);
    void (*setTouches)(Ark_TouchEvent peer,
                       const Array_TouchObject* touches);
    Array_TouchObject (*getChangedTouches)(Ark_TouchEvent peer);
    void (*setChangedTouches)(Ark_TouchEvent peer,
                              const Array_TouchObject* changedTouches);
    Callback_Void (*getStopPropagation)(Ark_TouchEvent peer);
    void (*setStopPropagation)(Ark_TouchEvent peer,
                               const Callback_Void* stopPropagation);
    Callback_Void (*getPreventDefault)(Ark_TouchEvent peer);
    void (*setPreventDefault)(Ark_TouchEvent peer,
                              const Callback_Void* preventDefault);
} GENERATED_ArkUITouchEventAccessor;

typedef struct GENERATED_ArkUITransitionEffectAccessor {
    void (*destroyPeer)(Ark_TransitionEffect peer);
    Ark_TransitionEffect (*ctor)(const Ark_String* type,
                                 const Ark_TransitionEffects* effect);
    Ark_NativePointer (*getFinalizer)();
    Ark_TransitionEffect (*translate)(const Ark_TranslateOptions* options);
    Ark_TransitionEffect (*rotate)(const Ark_RotateOptions* options);
    Ark_TransitionEffect (*scale)(const Ark_ScaleOptions* options);
    Ark_TransitionEffect (*opacity)(const Ark_Number* alpha);
    Ark_TransitionEffect (*move)(Ark_TransitionEdge edge);
    Ark_TransitionEffect (*asymmetric)(Ark_TransitionEffect appear,
                                       Ark_TransitionEffect disappear);
    Ark_TransitionEffect (*animation)(Ark_TransitionEffect peer,
                                      const Ark_AnimateParam* value);
    Ark_TransitionEffect (*combine)(Ark_TransitionEffect peer,
                                    Ark_TransitionEffect transitionEffect);
    Ark_TransitionEffect (*getIDENTITY)();
    Ark_TransitionEffect (*getOPACITY)();
    Ark_TransitionEffect (*getSLIDE)();
    Ark_TransitionEffect (*getSLIDE_SWITCH)();
} GENERATED_ArkUITransitionEffectAccessor;

typedef struct GENERATED_ArkUIUICommonEventAccessor {
    void (*destroyPeer)(Ark_UICommonEvent peer);
    Ark_UICommonEvent (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*setOnClick)(Ark_UICommonEvent peer,
                       const Opt_Callback_ClickEvent_Void* callback_);
    void (*setOnTouch)(Ark_UICommonEvent peer,
                       const Opt_Callback_TouchEvent_Void* callback_);
    void (*setOnAppear)(Ark_UICommonEvent peer,
                        const Opt_Callback_Void* callback_);
    void (*setOnDisappear)(Ark_UICommonEvent peer,
                           const Opt_Callback_Void* callback_);
    void (*setOnKeyEvent)(Ark_UICommonEvent peer,
                          const Opt_Callback_KeyEvent_Void* callback_);
    void (*setOnFocus)(Ark_UICommonEvent peer,
                       const Opt_Callback_Void* callback_);
    void (*setOnBlur)(Ark_UICommonEvent peer,
                      const Opt_Callback_Void* callback_);
    void (*setOnHover)(Ark_UICommonEvent peer,
                       const Opt_HoverCallback* callback_);
    void (*setOnMouse)(Ark_UICommonEvent peer,
                       const Opt_Callback_MouseEvent_Void* callback_);
    void (*setOnSizeChange)(Ark_UICommonEvent peer,
                            const Opt_SizeChangeCallback* callback_);
    void (*setOnVisibleAreaApproximateChange)(Ark_UICommonEvent peer,
                                              const Ark_VisibleAreaEventOptions* options,
                                              const Opt_VisibleAreaChangeCallback* event);
} GENERATED_ArkUIUICommonEventAccessor;

typedef struct GENERATED_ArkUIUIContextAtomicServiceBarAccessor {
    Ark_CustomObject (*getBarRect)();
} GENERATED_ArkUIUIContextAtomicServiceBarAccessor;

typedef struct GENERATED_ArkUIUIExtensionProxyAccessor {
    void (*destroyPeer)(Ark_UIExtensionProxy peer);
    Ark_UIExtensionProxy (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*send)(Ark_UIExtensionProxy peer,
                 const Map_String_Object* data);
    Map_String_Object (*sendSync)(Ark_UIExtensionProxy peer,
                                  const Map_String_Object* data);
    void (*onAsyncReceiverRegister)(Ark_UIExtensionProxy peer,
                                    const Callback_UIExtensionProxy_Void* callback_);
    void (*onSyncReceiverRegister)(Ark_UIExtensionProxy peer,
                                   const Callback_UIExtensionProxy_Void* callback_);
    void (*offAsyncReceiverRegister)(Ark_UIExtensionProxy peer,
                                     const Opt_Callback_UIExtensionProxy_Void* callback_);
    void (*offSyncReceiverRegister)(Ark_UIExtensionProxy peer,
                                    const Opt_Callback_UIExtensionProxy_Void* callback_);
} GENERATED_ArkUIUIExtensionProxyAccessor;

typedef struct GENERATED_ArkUIUrlStyleAccessor {
    void (*destroyPeer)(Ark_UrlStyle peer);
    Ark_UrlStyle (*ctor)(const Ark_String* url);
    Ark_NativePointer (*getFinalizer)();
    Ark_String (*getUrl)(Ark_UrlStyle peer);
} GENERATED_ArkUIUrlStyleAccessor;

typedef struct GENERATED_ArkUIViewAccessor {
    void (*destroyPeer)(Ark_View peer);
    Ark_View (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    Ark_NativePointer (*create)(Ark_View peer,
                                Ark_NativePointer value);
} GENERATED_ArkUIViewAccessor;

typedef struct GENERATED_ArkUIWebResourceResponseAccessor {
    void (*destroyPeer)(Ark_WebResourceResponse peer);
    Ark_WebResourceResponse (*ctor)();
    Ark_NativePointer (*getFinalizer)();
    void (*setResponseData)(Ark_WebResourceResponse peer,
                            const Ark_Union_String_Number_Resource_Buffer* data);
} GENERATED_ArkUIWebResourceResponseAccessor;

typedef struct GENERATED_ArkUIGlobalScopeAccessor {
    void (*animateTo)(const Ark_AnimateParam* value,
                      const Callback_Void* event);
    void (*animateToImmediately)(const Ark_AnimateParam* value,
                                 const Callback_Void* event);
    void (*cursorControl_restoreDefault)();
    void (*cursorControl_setCursor)(const Ark_CustomObject* value);
    Ark_CustomObject (*dollar_r)(const Ark_String* value,
                                 const Array_Object* params);
    Ark_CustomObject (*dollar_rawfile)(const Ark_String* value);
    Ark_Boolean (*focusControl_requestFocus)(const Ark_String* value);
    Ark_Number (*fp2px)(const Ark_Number* value);
    Ark_Context (*getContext)(const Opt_Object* component);
    Ark_ComponentInfo (*getRectangleById)(const Ark_String* id);
    Ark_Number (*lpx2px)(const Ark_Number* value);
    void (*postCardAction)(const Ark_Object* component,
                           const Ark_Object* action);
    Ark_Number (*px2fp)(const Ark_Number* value);
    Ark_Number (*px2lpx)(const Ark_Number* value);
    Ark_Number (*px2vp)(const Ark_Number* value);
    Ark_Number (*vp2px)(const Ark_Number* value);
} GENERATED_ArkUIGlobalScopeAccessor;


/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
typedef struct GENERATED_ArkUINodeModifiers {
    const GENERATED_ArkUIBaseSpanModifier* (*getBaseSpanModifier)();
    const GENERATED_ArkUIBlankModifier* (*getBlankModifier)();
    const GENERATED_ArkUIButtonModifier* (*getButtonModifier)();
    const GENERATED_ArkUICalendarPickerModifier* (*getCalendarPickerModifier)();
    const GENERATED_ArkUICanvasModifier* (*getCanvasModifier)();
    const GENERATED_ArkUICircleModifier* (*getCircleModifier)();
    const GENERATED_ArkUIColumnModifier* (*getColumnModifier)();
    const GENERATED_ArkUICommonModifier* (*getCommonModifier)();
    const GENERATED_ArkUICommonMethodModifier* (*getCommonMethodModifier)();
    const GENERATED_ArkUICommonShapeMethodModifier* (*getCommonShapeMethodModifier)();
    const GENERATED_ArkUIComponentRootModifier* (*getComponentRootModifier)();
    const GENERATED_ArkUICounterModifier* (*getCounterModifier)();
    const GENERATED_ArkUICustomLayoutRootModifier* (*getCustomLayoutRootModifier)();
    const GENERATED_ArkUIDividerModifier* (*getDividerModifier)();
    const GENERATED_ArkUIEllipseModifier* (*getEllipseModifier)();
    const GENERATED_ArkUIEmbeddedComponentModifier* (*getEmbeddedComponentModifier)();
    const GENERATED_ArkUIFlexModifier* (*getFlexModifier)();
    const GENERATED_ArkUIFormComponentModifier* (*getFormComponentModifier)();
    const GENERATED_ArkUIGridModifier* (*getGridModifier)();
    const GENERATED_ArkUIGridContainerModifier* (*getGridContainerModifier)();
    const GENERATED_ArkUIGridItemModifier* (*getGridItemModifier)();
    const GENERATED_ArkUIImageModifier* (*getImageModifier)();
    const GENERATED_ArkUIIndicatorComponentModifier* (*getIndicatorComponentModifier)();
    const GENERATED_ArkUIListModifier* (*getListModifier)();
    const GENERATED_ArkUIListItemModifier* (*getListItemModifier)();
    const GENERATED_ArkUINavDestinationModifier* (*getNavDestinationModifier)();
    const GENERATED_ArkUINavigationModifier* (*getNavigationModifier)();
    const GENERATED_ArkUINavigatorModifier* (*getNavigatorModifier)();
    const GENERATED_ArkUIPathModifier* (*getPathModifier)();
    const GENERATED_ArkUIRectModifier* (*getRectModifier)();
    const GENERATED_ArkUIRichEditorModifier* (*getRichEditorModifier)();
    const GENERATED_ArkUIRootModifier* (*getRootModifier)();
    const GENERATED_ArkUIRowModifier* (*getRowModifier)();
    const GENERATED_ArkUIScrollModifier* (*getScrollModifier)();
    const GENERATED_ArkUIScrollableCommonMethodModifier* (*getScrollableCommonMethodModifier)();
    const GENERATED_ArkUISearchModifier* (*getSearchModifier)();
    const GENERATED_ArkUISecurityComponentMethodModifier* (*getSecurityComponentMethodModifier)();
    const GENERATED_ArkUISelectModifier* (*getSelectModifier)();
    const GENERATED_ArkUIShapeModifier* (*getShapeModifier)();
    const GENERATED_ArkUISideBarContainerModifier* (*getSideBarContainerModifier)();
    const GENERATED_ArkUISliderModifier* (*getSliderModifier)();
    const GENERATED_ArkUISpanModifier* (*getSpanModifier)();
    const GENERATED_ArkUIStackModifier* (*getStackModifier)();
    const GENERATED_ArkUISwiperModifier* (*getSwiperModifier)();
    const GENERATED_ArkUISymbolGlyphModifier* (*getSymbolGlyphModifier)();
    const GENERATED_ArkUITabContentModifier* (*getTabContentModifier)();
    const GENERATED_ArkUITabsModifier* (*getTabsModifier)();
    const GENERATED_ArkUITest1Modifier* (*getTest1Modifier)();
    const GENERATED_ArkUITextModifier* (*getTextModifier)();
    const GENERATED_ArkUITextInputModifier* (*getTextInputModifier)();
    const GENERATED_ArkUITextPickerModifier* (*getTextPickerModifier)();
    const GENERATED_ArkUIToggleModifier* (*getToggleModifier)();
    const GENERATED_ArkUIVectorModifier* (*getVectorModifier)();
    const GENERATED_ArkUIWebModifier* (*getWebModifier)();
} GENERATED_ArkUINodeModifiers;

typedef struct GENERATED_ArkUIAccessors {
    const GENERATED_ArkUIAccessibilityHoverEventAccessor* (*getAccessibilityHoverEventAccessor)();
    const GENERATED_ArkUIAlertDialogAccessor* (*getAlertDialogAccessor)();
    const GENERATED_ArkUIAnimationExtenderAccessor* (*getAnimationExtenderAccessor)();
    const GENERATED_ArkUIAppearSymbolEffectAccessor* (*getAppearSymbolEffectAccessor)();
    const GENERATED_ArkUIBackgroundColorStyleAccessor* (*getBackgroundColorStyleAccessor)();
    const GENERATED_ArkUIBaseContextAccessor* (*getBaseContextAccessor)();
    const GENERATED_ArkUIBaseEventAccessor* (*getBaseEventAccessor)();
    const GENERATED_ArkUIBaseGestureEventAccessor* (*getBaseGestureEventAccessor)();
    const GENERATED_ArkUIBaselineOffsetStyleAccessor* (*getBaselineOffsetStyleAccessor)();
    const GENERATED_ArkUIBaseShapeAccessor* (*getBaseShapeAccessor)();
    const GENERATED_ArkUIBounceSymbolEffectAccessor* (*getBounceSymbolEffectAccessor)();
    const GENERATED_ArkUICanvasGradientAccessor* (*getCanvasGradientAccessor)();
    const GENERATED_ArkUICanvasPathAccessor* (*getCanvasPathAccessor)();
    const GENERATED_ArkUICanvasPatternAccessor* (*getCanvasPatternAccessor)();
    const GENERATED_ArkUICanvasRendererAccessor* (*getCanvasRendererAccessor)();
    const GENERATED_ArkUICanvasRenderingContext2DAccessor* (*getCanvasRenderingContext2DAccessor)();
    const GENERATED_ArkUIChildrenMainSizeAccessor* (*getChildrenMainSizeAccessor)();
    const GENERATED_ArkUIClassNoConstructorAndStaticMethodsDTSAccessor* (*getClassNoConstructorAndStaticMethodsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndAllOptionalParamsDTSAccessor* (*getClassWithConstructorAndAllOptionalParamsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndFieldsAndMethodsDTSAccessor* (*getClassWithConstructorAndFieldsAndMethodsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndFieldsDTSAccessor* (*getClassWithConstructorAndFieldsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndMethodsDTSAccessor* (*getClassWithConstructorAndMethodsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndNonOptionalParamsDTSAccessor* (*getClassWithConstructorAndNonOptionalParamsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndSomeOptionalParamsDTSAccessor* (*getClassWithConstructorAndSomeOptionalParamsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndStaticMethodsDTSAccessor* (*getClassWithConstructorAndStaticMethodsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorAndWithoutParamsDTSAccessor* (*getClassWithConstructorAndWithoutParamsDTSAccessor)();
    const GENERATED_ArkUIClassWithConstructorDTSAccessor* (*getClassWithConstructorDTSAccessor)();
    const GENERATED_ArkUIClickEventAccessor* (*getClickEventAccessor)();
    const GENERATED_ArkUIColorFilterAccessor* (*getColorFilterAccessor)();
    const GENERATED_ArkUICommonShapeAccessor* (*getCommonShapeAccessor)();
    const GENERATED_ArkUIContextAccessor* (*getContextAccessor)();
    const GENERATED_ArkUICustomDialogControllerAccessor* (*getCustomDialogControllerAccessor)();
    const GENERATED_ArkUICustomSpanAccessor* (*getCustomSpanAccessor)();
    const GENERATED_ArkUIDecorationStyleAccessor* (*getDecorationStyleAccessor)();
    const GENERATED_ArkUIDisappearSymbolEffectAccessor* (*getDisappearSymbolEffectAccessor)();
    const GENERATED_ArkUIDragEventAccessor* (*getDragEventAccessor)();
    const GENERATED_ArkUIDrawingColorFilterAccessor* (*getDrawingColorFilterAccessor)();
    const GENERATED_ArkUIDrawingLatticeAccessor* (*getDrawingLatticeAccessor)();
    const GENERATED_ArkUIDrawingRenderingContextAccessor* (*getDrawingRenderingContextAccessor)();
    const GENERATED_ArkUIDrawModifierAccessor* (*getDrawModifierAccessor)();
    const GENERATED_ArkUIEventEmulatorAccessor* (*getEventEmulatorAccessor)();
    const GENERATED_ArkUIEventTargetInfoAccessor* (*getEventTargetInfoAccessor)();
    const GENERATED_ArkUIFocusControllerAccessor* (*getFocusControllerAccessor)();
    const GENERATED_ArkUIGestureEventAccessor* (*getGestureEventAccessor)();
    const GENERATED_ArkUIGestureGroupInterfaceAccessor* (*getGestureGroupInterfaceAccessor)();
    const GENERATED_ArkUIGestureModifierAccessor* (*getGestureModifierAccessor)();
    const GENERATED_ArkUIGestureRecognizerAccessor* (*getGestureRecognizerAccessor)();
    const GENERATED_ArkUIGestureStyleAccessor* (*getGestureStyleAccessor)();
    const GENERATED_ArkUIGlobalScope_ohos_arkui_componentSnapshotAccessor* (*getGlobalScope_ohos_arkui_componentSnapshotAccessor)();
    const GENERATED_ArkUIGlobalScope_ohos_arkui_performanceMonitorAccessor* (*getGlobalScope_ohos_arkui_performanceMonitorAccessor)();
    const GENERATED_ArkUIGlobalScope_ohos_fontAccessor* (*getGlobalScope_ohos_fontAccessor)();
    const GENERATED_ArkUIGlobalScope_ohos_measure_utilsAccessor* (*getGlobalScope_ohos_measure_utilsAccessor)();
    const GENERATED_ArkUIHierarchicalSymbolEffectAccessor* (*getHierarchicalSymbolEffectAccessor)();
    const GENERATED_ArkUIHoverEventAccessor* (*getHoverEventAccessor)();
    const GENERATED_ArkUIICurveAccessor* (*getICurveAccessor)();
    const GENERATED_ArkUIImageAnalyzerControllerAccessor* (*getImageAnalyzerControllerAccessor)();
    const GENERATED_ArkUIImageAttachmentAccessor* (*getImageAttachmentAccessor)();
    const GENERATED_ArkUIImageBitmapAccessor* (*getImageBitmapAccessor)();
    const GENERATED_ArkUIImageDataAccessor* (*getImageDataAccessor)();
    const GENERATED_ArkUIIndicatorComponentControllerAccessor* (*getIndicatorComponentControllerAccessor)();
    const GENERATED_ArkUIIUIContextAccessor* (*getIUIContextAccessor)();
    const GENERATED_ArkUIKeyEventAccessor* (*getKeyEventAccessor)();
    const GENERATED_ArkUILayoutableAccessor* (*getLayoutableAccessor)();
    const GENERATED_ArkUILayoutManagerAccessor* (*getLayoutManagerAccessor)();
    const GENERATED_ArkUILazyForEachOpsAccessor* (*getLazyForEachOpsAccessor)();
    const GENERATED_ArkUILetterSpacingStyleAccessor* (*getLetterSpacingStyleAccessor)();
    const GENERATED_ArkUILinearGradientAccessor* (*getLinearGradientAccessor)();
    const GENERATED_ArkUILineHeightStyleAccessor* (*getLineHeightStyleAccessor)();
    const GENERATED_ArkUIListScrollerAccessor* (*getListScrollerAccessor)();
    const GENERATED_ArkUILongPressGestureEventAccessor* (*getLongPressGestureEventAccessor)();
    const GENERATED_ArkUILongPressGestureInterfaceAccessor* (*getLongPressGestureInterfaceAccessor)();
    const GENERATED_ArkUIMatrix2DAccessor* (*getMatrix2DAccessor)();
    const GENERATED_ArkUIMeasurableAccessor* (*getMeasurableAccessor)();
    const GENERATED_ArkUIMouseEventAccessor* (*getMouseEventAccessor)();
    const GENERATED_ArkUIMutableStyledStringAccessor* (*getMutableStyledStringAccessor)();
    const GENERATED_ArkUINavDestinationContextAccessor* (*getNavDestinationContextAccessor)();
    const GENERATED_ArkUINavExtenderAccessor* (*getNavExtenderAccessor)();
    const GENERATED_ArkUINavigationTransitionProxyAccessor* (*getNavigationTransitionProxyAccessor)();
    const GENERATED_ArkUINavPathInfoAccessor* (*getNavPathInfoAccessor)();
    const GENERATED_ArkUINavPathStackAccessor* (*getNavPathStackAccessor)();
    const GENERATED_ArkUIPanGestureEventAccessor* (*getPanGestureEventAccessor)();
    const GENERATED_ArkUIPanGestureInterfaceAccessor* (*getPanGestureInterfaceAccessor)();
    const GENERATED_ArkUIPanGestureOptionsAccessor* (*getPanGestureOptionsAccessor)();
    const GENERATED_ArkUIPanRecognizerAccessor* (*getPanRecognizerAccessor)();
    const GENERATED_ArkUIParagraphStyleAccessor* (*getParagraphStyleAccessor)();
    const GENERATED_ArkUIPinchGestureEventAccessor* (*getPinchGestureEventAccessor)();
    const GENERATED_ArkUIPinchGestureInterfaceAccessor* (*getPinchGestureInterfaceAccessor)();
    const GENERATED_ArkUIPixelMapAccessor* (*getPixelMapAccessor)();
    const GENERATED_ArkUIPixelMapMockAccessor* (*getPixelMapMockAccessor)();
    const GENERATED_ArkUIProgressMaskAccessor* (*getProgressMaskAccessor)();
    const GENERATED_ArkUIRenderingContextSettingsAccessor* (*getRenderingContextSettingsAccessor)();
    const GENERATED_ArkUIReplaceSymbolEffectAccessor* (*getReplaceSymbolEffectAccessor)();
    const GENERATED_ArkUIRestrictedWorkerAccessor* (*getRestrictedWorkerAccessor)();
    const GENERATED_ArkUIRichEditorBaseControllerAccessor* (*getRichEditorBaseControllerAccessor)();
    const GENERATED_ArkUIRichEditorControllerAccessor* (*getRichEditorControllerAccessor)();
    const GENERATED_ArkUIRichEditorStyledStringControllerAccessor* (*getRichEditorStyledStringControllerAccessor)();
    const GENERATED_ArkUIRotationGestureEventAccessor* (*getRotationGestureEventAccessor)();
    const GENERATED_ArkUIRotationGestureInterfaceAccessor* (*getRotationGestureInterfaceAccessor)();
    const GENERATED_ArkUIScaleSymbolEffectAccessor* (*getScaleSymbolEffectAccessor)();
    const GENERATED_ArkUISceneAccessor* (*getSceneAccessor)();
    const GENERATED_ArkUIScrollableTargetInfoAccessor* (*getScrollableTargetInfoAccessor)();
    const GENERATED_ArkUIScrollerAccessor* (*getScrollerAccessor)();
    const GENERATED_ArkUISearchControllerAccessor* (*getSearchControllerAccessor)();
    const GENERATED_ArkUISearchOpsAccessor* (*getSearchOpsAccessor)();
    const GENERATED_ArkUIStateStylesOpsAccessor* (*getStateStylesOpsAccessor)();
    const GENERATED_ArkUIStyledStringAccessor* (*getStyledStringAccessor)();
    const GENERATED_ArkUIStyledStringControllerAccessor* (*getStyledStringControllerAccessor)();
    const GENERATED_ArkUISubmitEventAccessor* (*getSubmitEventAccessor)();
    const GENERATED_ArkUISwipeGestureEventAccessor* (*getSwipeGestureEventAccessor)();
    const GENERATED_ArkUISwipeGestureInterfaceAccessor* (*getSwipeGestureInterfaceAccessor)();
    const GENERATED_ArkUISwiperContentTransitionProxyAccessor* (*getSwiperContentTransitionProxyAccessor)();
    const GENERATED_ArkUISwiperControllerAccessor* (*getSwiperControllerAccessor)();
    const GENERATED_ArkUISystemOpsAccessor* (*getSystemOpsAccessor)();
    const GENERATED_ArkUITabsControllerAccessor* (*getTabsControllerAccessor)();
    const GENERATED_ArkUITapGestureEventAccessor* (*getTapGestureEventAccessor)();
    const GENERATED_ArkUITapGestureInterfaceAccessor* (*getTapGestureInterfaceAccessor)();
    const GENERATED_ArkUITextBaseControllerAccessor* (*getTextBaseControllerAccessor)();
    const GENERATED_ArkUITextContentControllerBaseAccessor* (*getTextContentControllerBaseAccessor)();
    const GENERATED_ArkUITextControllerAccessor* (*getTextControllerAccessor)();
    const GENERATED_ArkUITextEditControllerExAccessor* (*getTextEditControllerExAccessor)();
    const GENERATED_ArkUITextFieldOpsAccessor* (*getTextFieldOpsAccessor)();
    const GENERATED_ArkUITextInputControllerAccessor* (*getTextInputControllerAccessor)();
    const GENERATED_ArkUITextMenuItemIdAccessor* (*getTextMenuItemIdAccessor)();
    const GENERATED_ArkUITextPickerDialogAccessor* (*getTextPickerDialogAccessor)();
    const GENERATED_ArkUITextShadowStyleAccessor* (*getTextShadowStyleAccessor)();
    const GENERATED_ArkUITextStyle_styled_stringAccessor* (*getTextStyle_styled_stringAccessor)();
    const GENERATED_ArkUITouchEventAccessor* (*getTouchEventAccessor)();
    const GENERATED_ArkUITransitionEffectAccessor* (*getTransitionEffectAccessor)();
    const GENERATED_ArkUIUICommonEventAccessor* (*getUICommonEventAccessor)();
    const GENERATED_ArkUIUIContextAtomicServiceBarAccessor* (*getUIContextAtomicServiceBarAccessor)();
    const GENERATED_ArkUIUIExtensionProxyAccessor* (*getUIExtensionProxyAccessor)();
    const GENERATED_ArkUIUrlStyleAccessor* (*getUrlStyleAccessor)();
    const GENERATED_ArkUIViewAccessor* (*getViewAccessor)();
    const GENERATED_ArkUIWebResourceResponseAccessor* (*getWebResourceResponseAccessor)();
    const GENERATED_ArkUIGlobalScopeAccessor* (*getGlobalScopeAccessor)();
} GENERATED_ArkUIAccessors;

typedef struct GENERATED_ArkUIGraphicsAPI {
    Ark_Int32 version;
} GENERATED_ArkUIGraphicsAPI;

typedef enum GENERATED_Ark_NodeType {
    GENERATED_ARKUI_CUSTOM_NODE,
    GENERATED_ARKUI_BASE_SPAN,
    GENERATED_ARKUI_BLANK,
    GENERATED_ARKUI_BUTTON,
    GENERATED_ARKUI_CALENDAR_PICKER,
    GENERATED_ARKUI_CANVAS,
    GENERATED_ARKUI_CIRCLE,
    GENERATED_ARKUI_COLUMN,
    GENERATED_ARKUI_COMMON,
    GENERATED_ARKUI_COMMON_METHOD,
    GENERATED_ARKUI_COMMON_SHAPE_METHOD,
    GENERATED_ARKUI_COMPONENT_ROOT,
    GENERATED_ARKUI_COUNTER,
    GENERATED_ARKUI_CUSTOM_LAYOUT_ROOT,
    GENERATED_ARKUI_DIVIDER,
    GENERATED_ARKUI_ELLIPSE,
    GENERATED_ARKUI_EMBEDDED_COMPONENT,
    GENERATED_ARKUI_FLEX,
    GENERATED_ARKUI_FORM_COMPONENT,
    GENERATED_ARKUI_GRID,
    GENERATED_ARKUI_GRID_CONTAINER,
    GENERATED_ARKUI_GRID_ITEM,
    GENERATED_ARKUI_IMAGE,
    GENERATED_ARKUI_INDICATOR_COMPONENT,
    GENERATED_ARKUI_LIST,
    GENERATED_ARKUI_LIST_ITEM,
    GENERATED_ARKUI_NAV_DESTINATION,
    GENERATED_ARKUI_NAVIGATION,
    GENERATED_ARKUI_NAVIGATOR,
    GENERATED_ARKUI_PATH,
    GENERATED_ARKUI_RECT,
    GENERATED_ARKUI_RICH_EDITOR,
    GENERATED_ARKUI_ROOT,
    GENERATED_ARKUI_ROW,
    GENERATED_ARKUI_SCROLL,
    GENERATED_ARKUI_SCROLLABLE_COMMON_METHOD,
    GENERATED_ARKUI_SEARCH,
    GENERATED_ARKUI_SECURITY_COMPONENT_METHOD,
    GENERATED_ARKUI_SELECT,
    GENERATED_ARKUI_SHAPE,
    GENERATED_ARKUI_SIDE_BAR_CONTAINER,
    GENERATED_ARKUI_SLIDER,
    GENERATED_ARKUI_SPAN,
    GENERATED_ARKUI_STACK,
    GENERATED_ARKUI_SWIPER,
    GENERATED_ARKUI_SYMBOL_GLYPH,
    GENERATED_ARKUI_TAB_CONTENT,
    GENERATED_ARKUI_TABS,
    GENERATED_ARKUI_TEST_1,
    GENERATED_ARKUI_TEXT,
    GENERATED_ARKUI_TEXT_INPUT,
    GENERATED_ARKUI_TEXT_PICKER,
    GENERATED_ARKUI_TOGGLE,
    GENERATED_ARKUI_VECTOR,
    GENERATED_ARKUI_WEB
} GENERATED_Ark_NodeType;

typedef enum {
    GENERATED_ARKUI_DIRTY_FLAG_MEASURE = 0b1,
    GENERATED_ARKUI_DIRTY_FLAG_LAYOUT = 0b10,
    // mark the node need to do attribute diff to drive update.
    GENERATED_ARKUI_DIRTY_FLAG_ATTRIBUTE_DIFF = 0b100,
    GENERATED_ARKUI_DIRTY_FLAG_MEASURE_SELF = 0b1000,
    GENERATED_ARKUI_DIRTY_FLAG_MEASURE_SELF_AND_PARENT = 0b10000,
    GENERATED_ARKUI_DIRTY_FLAG_MEASURE_BY_CHILD_REQUEST = 0b100000,
    GENERATED_ARKUI_DIRTY_FLAG_RENDER = 0b1000000,
    GENERATED_ARKUI_DIRTY_FLAG_MEASURE_SELF_AND_CHILD = 0b1000000000,
} GENERATED_ArkUIDirtyFlag;

union GENERATED_Ark_EventCallbackArg {
    Ark_Int32 i32;
    Ark_Int32 u32;
    Ark_Int32 f32;
};

typedef union GENERATED_Ark_EventCallbackArg GENERATED_Ark_EventCallbackArg;

typedef struct GENERATED_Ark_APICallbackMethod {
    Ark_Int32 (*CallInt) (Ark_VMContext vmContext, Ark_Int32 methodId, Ark_Int32 numArgs, GENERATED_Ark_EventCallbackArg* args);
} GENERATED_Ark_APICallbackMethod;

typedef struct GENERATED_ArkUIBasicNodeAPI {
    Ark_Int32 version;

    /// Tree operations.
    Ark_NodeHandle (*createNode)(GENERATED_Ark_NodeType type,
                                 Ark_Int32 id, Ark_Int32 flags);

    Ark_NodeHandle (*getNodeByViewStack)();
    void (*disposeNode)(Ark_NodeHandle node);

    void (*dumpTreeNode)(Ark_NodeHandle node);

    Ark_Int32 (*addChild)(Ark_NodeHandle parent,
                          Ark_NodeHandle child);
    void (*removeChild)(Ark_NodeHandle parent,
                        Ark_NodeHandle child);
    Ark_Int32 (*insertChildAfter)(Ark_NodeHandle parent,
                                  Ark_NodeHandle child, Ark_NodeHandle sibling);
    Ark_Int32 (*insertChildBefore)(Ark_NodeHandle parent,
                                   Ark_NodeHandle child,
                                   Ark_NodeHandle sibling);
    Ark_Int32 (*insertChildAt)(Ark_NodeHandle parent,
                               Ark_NodeHandle child,
                               Ark_Int32 position);

    // Commit attributes updates for node.
    void (*applyModifierFinish)(Ark_NodeHandle nodePtr);
    // the flag can combine different flag like Ark_DIRTY_FLAG_MEASURE | Ark_DIRTY_FLAG_RENDER
    void (*markDirty)(Ark_NodeHandle nodePtr,
                      Ark_UInt32 dirtyFlag);
    Ark_Boolean (*isBuilderNode)(Ark_NodeHandle node);

    Ark_Float32 (*convertLengthMetricsUnit)(Ark_Float32 value,
                                            Ark_Int32 originUnit,
                                            Ark_Int32 targetUnit);
} GENERATED_ArkUIBasicNodeAPI;

typedef void (*Ark_VsyncCallback)(Ark_PipelineContext);

typedef struct GENERATED_ArkUIExtendedNodeAPI {
    Ark_Int32 version;

    Ark_Float32 (*getDensity) (Ark_Int32 deviceId);
    Ark_Float32 (*getFontScale) (Ark_Int32 deviceId);
    Ark_Float32 (*getDesignWidthScale) (Ark_Int32 deviceId);

    // TODO: remove!
    void (*setCallbackMethod)(GENERATED_Ark_APICallbackMethod* method);

    // the custom node is not set in create.
    void (*setCustomMethodFlag)(Ark_NodeHandle node,
                                Ark_Int32 flag);
    Ark_Int32 (*getCustomMethodFlag)(Ark_NodeHandle node);

    // setCustomCallback is without the context
    void (*setCustomCallback) (Ark_VMContext  vmContext,
                               Ark_NodeHandle node,
                               Ark_Int32 callbackId);
    void (*setCustomNodeDestroyCallback)(void (*destroy)(Ark_NodeHandle nodeId));
    // make void instead return type Ark_Int32
    Ark_Int32 (*measureLayoutAndDraw) (Ark_VMContext  vmContext,
                                       Ark_NodeHandle node);
    Ark_Int32 (*measureNode) (Ark_VMContext  vmContext,
                              Ark_NodeHandle node,
                              Ark_Float32* data);
    Ark_Int32 (*layoutNode) (Ark_VMContext  vmContext,
                             Ark_NodeHandle node,
                             Ark_Float32 (*data)[2]);
    Ark_Int32 (*drawNode) (Ark_VMContext  vmContext,
                           Ark_NodeHandle node,
                           Ark_Float32* data);
    void (*setAttachNodePtr) (Ark_NodeHandle node,
                              void* value);
    void* (*getAttachNodePtr) (Ark_NodeHandle node);

    // may be better to use int in px unit
    void (*setMeasureWidth)(Ark_NodeHandle node,
                            Ark_Int32 value);
    Ark_Int32 (*getMeasureWidth)(Ark_NodeHandle node);
    void (*setMeasureHeight)(Ark_NodeHandle node,
                             Ark_Int32 value);
    Ark_Int32 (*getMeasureHeight)(Ark_NodeHandle node);
    void (*setX)(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 (*getX)(Ark_NodeHandle node);
    void (*setY)(Ark_NodeHandle node,
                 Ark_Int32 value);
    Ark_Int32 (*getY)(Ark_NodeHandle node);

    void (*getLayoutConstraint)(Ark_NodeHandle node,
                                Ark_Int32* value);
    void (*setAlignment)(Ark_NodeHandle node,
                         Ark_Int32 value);
    Ark_Int32 (*getAlignment)(Ark_NodeHandle node);

    Ark_Int32 (*indexerChecker) (Ark_VMContext  vmContext,
                                 Ark_NodeHandle node);
    void (*setRangeUpdater)(Ark_NodeHandle node,
                            Ark_Int32 updatedId);
    void (*setLazyItemIndexer) (Ark_VMContext  vmContext,
                                Ark_NodeHandle node,
                                Ark_Int32 indexerId);

    /// Vsync support
    Ark_PipelineContext (*getPipelineContext)(Ark_NodeHandle node);
    void (*setVsyncCallback)(Ark_PipelineContext pipelineContext,
                             Ark_VsyncCallback callback);
    void (*setChildTotalCount)(Ark_NodeHandle node,
                               Ark_Int32 totalCount);

    /// Error reporting.
    void (*showCrash)(Ark_CharPtr message);
} GENERATED_ArkUIExtendedNodeAPI;

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_NODE_API_VERSION above for binary
 * layout checks.
 */
typedef struct GENERATED_ArkUIFullNodeAPI {
    Ark_Int32 version;
    const GENERATED_ArkUINodeModifiers* (*getNodeModifiers)();
    const GENERATED_ArkUIAccessors* (*getAccessors)();
    const GENERATED_ArkUIGraphicsAPI* (*getGraphicsAPI)();
} GENERATED_ArkUIFullNodeAPI;

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
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#include <stdint.h>
// todo remove after migration to OH_AnyAPI to be consistant between arkoala and ohos apis
struct Ark_AnyAPI {
    int32_t version;
};
struct OH_AnyAPI {
    int32_t version;
};
#endif

#ifdef __cplusplus
};
#endif

/* clang-format on */

#endif  // GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H

