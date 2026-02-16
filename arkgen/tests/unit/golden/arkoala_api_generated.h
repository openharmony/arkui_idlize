
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

#ifdef __cplusplus
#include <cstdint>
#else
#include <stdint.h>
#endif

#ifdef __cplusplus
extern "C" [[noreturn]] void InteropLogFatal(const char* format, ...);
#endif
void InteropLogFatal(const char* format, ...);

#define INTEROP_FATAL(msg, ...)                \
    do {                                       \
        InteropLogFatal((msg), ##__VA_ARGS__); \
    } while (0);

typedef enum InteropTag {
    INTEROP_TAG_UNDEFINED = 101,
    INTEROP_TAG_INT32 = 102,
    INTEROP_TAG_FLOAT32 = 103,
    INTEROP_TAG_STRING = 104,
    INTEROP_TAG_LENGTH = 105,
    INTEROP_TAG_RESOURCE = 106,
    INTEROP_TAG_OBJECT = 107,
} InteropTag;

typedef enum InteropRuntimeType {
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
    InteropAsyncWork (*createWork)(InteropVMContext context, InteropNativePointer handle,
        void (*execute)(InteropNativePointer handle), void (*complete)(InteropNativePointer handle));
} InteropAsyncWorker;
typedef const InteropAsyncWorker* InteropAsyncWorkerPtr;

typedef struct InteropObject {
    InteropCallbackResource resource;
} InteropObject;

typedef enum InteropExceptionKind {
    EXCEPTION_INTERFACE = 0,
    EXCEPTION_OBJECT = 1,
} InteropExceptionKind;

typedef struct InteropExceptionInterface {
    InteropInt32 code;
    InteropString message;
} InteropExceptionInterface;

typedef struct InteropException {
    InteropExceptionKind kind;
    union {
        InteropExceptionInterface interface;
        InteropObject object;
    };
} InteropException;

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
typedef InteropException Ark_Exception;

// Improve: generate!
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
typedef struct AttributeModifierPeer AttributeModifierPeer;
typedef struct AttributeModifierPeer* Ark_AttributeModifier;
typedef struct Opt_AttributeModifier Opt_AttributeModifier;
typedef struct AttributeUpdaterPeer AttributeUpdaterPeer;
typedef struct AttributeUpdaterPeer* Ark_AttributeUpdater;
typedef struct Opt_AttributeUpdater Opt_AttributeUpdater;
typedef struct BaseEventPeer BaseEventPeer;
typedef struct BaseEventPeer* Ark_BaseEvent;
typedef struct Opt_BaseEvent Opt_BaseEvent;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct CheckCustomModifierModifierPeer CheckCustomModifierModifierPeer;
typedef struct CheckCustomModifierModifierPeer* Ark_CheckCustomModifierModifier;
typedef struct Opt_CheckCustomModifierModifier Opt_CheckCustomModifierModifier;
typedef struct ClickEventPeer ClickEventPeer;
typedef struct ClickEventPeer* Ark_ClickEvent;
typedef struct Opt_ClickEvent Opt_ClickEvent;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct DrawContextPeer DrawContextPeer;
typedef struct DrawContextPeer* Ark_DrawContext;
typedef struct Opt_DrawContext Opt_DrawContext;
typedef struct DrawModifierPeer DrawModifierPeer;
typedef struct DrawModifierPeer* Ark_DrawModifier;
typedef struct Opt_DrawModifier Opt_DrawModifier;
typedef struct Ark_DuplicateInteraceChild Ark_DuplicateInteraceChild;
typedef struct Opt_DuplicateInteraceChild Opt_DuplicateInteraceChild;
typedef struct Ark_DuplicateInteraceParent Ark_DuplicateInteraceParent;
typedef struct Opt_DuplicateInteraceParent Opt_DuplicateInteraceParent;
typedef struct Ark_DuplicateInteraceSubChild Ark_DuplicateInteraceSubChild;
typedef struct Opt_DuplicateInteraceSubChild Opt_DuplicateInteraceSubChild;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_NativePointer Opt_NativePointer;
typedef struct Opt_Number Opt_Number;
typedef struct Ark_SampleI Ark_SampleI;
typedef struct Opt_SampleI Opt_SampleI;
typedef struct Ark_SampleTransformDstI Ark_SampleTransformDstI;
typedef struct Opt_SampleTransformDstI Opt_SampleTransformDstI;
typedef struct Opt_String Opt_String;
typedef struct Ark_Union_SampleI_SampleTransformDstI Ark_Union_SampleI_SampleTransformDstI;
typedef struct Opt_Union_SampleI_SampleTransformDstI Opt_Union_SampleI_SampleTransformDstI;
typedef struct Callback_Boolean_Void Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void Opt_Callback_Boolean_Void;
typedef struct Callback_DrawContext_Void Callback_DrawContext_Void;
typedef struct Opt_Callback_DrawContext_Void Opt_Callback_DrawContext_Void;
typedef struct Callback_Void Callback_Void;
typedef struct Opt_Callback_Void Opt_Callback_Void;
typedef struct PageTransitionCallback PageTransitionCallback;
typedef struct Opt_PageTransitionCallback Opt_PageTransitionCallback;
typedef struct TransformDstCallbackI TransformDstCallbackI;
typedef struct Opt_TransformDstCallbackI Opt_TransformDstCallbackI;
typedef struct Ark_DatebookOptions Ark_DatebookOptions;
typedef struct Opt_DatebookOptions Opt_DatebookOptions;
typedef struct Ark_PageTransitionOptions Ark_PageTransitionOptions;
typedef struct Opt_PageTransitionOptions Opt_PageTransitionOptions;
typedef struct Throws_void Throws_void;
typedef struct Opt_Throws_void Opt_Throws_void;
typedef struct Ark_TransitionParam Ark_TransitionParam;
typedef struct Opt_TransitionParam Opt_TransitionParam;
typedef struct Opt_Object Opt_Object;
typedef enum Ark_AttributeUpdaterFlag: InteropUInt8 {
    ARK_ATTRIBUTE_UPDATER_FLAG_INITIAL = 0,
    ARK_ATTRIBUTE_UPDATER_FLAG_UPDATE = 1,
    ARK_ATTRIBUTE_UPDATER_FLAG_SKIP = 2,
    ARK_ATTRIBUTE_UPDATER_FLAG_RESET = 3,
} Ark_AttributeUpdaterFlag;
typedef struct Opt_AttributeUpdaterFlag {
    Ark_Tag tag;
    Ark_AttributeUpdaterFlag value;
} Opt_AttributeUpdaterFlag;
typedef enum Ark_ColorMode: InteropUInt8 {
    ARK_COLOR_MODE_LIGHT = 0,
    ARK_COLOR_MODE_DARK = 1,
} Ark_ColorMode;
typedef struct Opt_ColorMode {
    Ark_Tag tag;
    Ark_ColorMode value;
} Opt_ColorMode;
typedef enum Ark_DatebookType: InteropUInt8 {
    ARK_DATEBOOK_TYPE_EGYPTIAN = 0,
    ARK_DATEBOOK_TYPE_ROMAN = 1,
} Ark_DatebookType;
typedef struct Opt_DatebookType {
    Ark_Tag tag;
    Ark_DatebookType value;
} Opt_DatebookType;
typedef enum Ark_EnumByte: InteropInt8 {
    ARK_ENUM_BYTE_E0 = 0,
    ARK_ENUM_BYTE_EN127 = -127,
    ARK_ENUM_BYTE_E127 = 127,
} Ark_EnumByte;
typedef struct Opt_EnumByte {
    Ark_Tag tag;
    Ark_EnumByte value;
} Opt_EnumByte;
typedef enum Ark_EnumInt {
    ARK_ENUM_INT_E0 = 0,
    ARK_ENUM_INT_E512 = 512,
} Ark_EnumInt;
typedef struct Opt_EnumInt {
    Ark_Tag tag;
    Ark_EnumInt value;
} Opt_EnumInt;
typedef enum Ark_EnumLong {
    ARK_ENUM_LONG_E0 = 0,
    ARK_ENUM_LONG_EFFFFFFFFA = 68719476730,
} Ark_EnumLong;
typedef struct Opt_EnumLong {
    Ark_Tag tag;
    Ark_EnumLong value;
} Opt_EnumLong;
typedef enum Ark_EnumUByte: InteropUInt8 {
    ARK_ENUM_UBYTE_E0 = 0,
    ARK_ENUM_UBYTE_E1 = 1,
    ARK_ENUM_UBYTE_E255 = 255,
} Ark_EnumUByte;
typedef struct Opt_EnumUByte {
    Ark_Tag tag;
    Ark_EnumUByte value;
} Opt_EnumUByte;
typedef enum Ark_LayoutDirection: InteropUInt8 {
    ARK_LAYOUT_DIRECTION_LTR = 0,
    ARK_LAYOUT_DIRECTION_RTL = 1,
    ARK_LAYOUT_DIRECTION_AUTO = 2,
} Ark_LayoutDirection;
typedef struct Opt_LayoutDirection {
    Ark_Tag tag;
    Ark_LayoutDirection value;
} Opt_LayoutDirection;
typedef enum Ark_PageTransitionType: InteropUInt8 {
    ARK_PAGE_TRANSITION_TYPE_ENTER = 0,
    ARK_PAGE_TRANSITION_TYPE_EXIT = 1,
} Ark_PageTransitionType;
typedef struct Opt_PageTransitionType {
    Ark_Tag tag;
    Ark_PageTransitionType value;
} Opt_PageTransitionType;
typedef enum Ark_RouteType: InteropUInt8 {
    ARK_ROUTE_TYPE_NONE = 0,
    ARK_ROUTE_TYPE_PUSH = 1,
    ARK_ROUTE_TYPE_POP = 2,
} Ark_RouteType;
typedef struct Opt_RouteType {
    Ark_Tag tag;
    Ark_RouteType value;
} Opt_RouteType;
typedef struct Opt_Int32 {
    Ark_Tag tag;
    Ark_Int32 value;
} Opt_Int32;
typedef struct Opt_AttributeModifier {
    Ark_Tag tag;
    Ark_AttributeModifier value;
} Opt_AttributeModifier;
typedef struct Opt_AttributeUpdater {
    Ark_Tag tag;
    Ark_AttributeUpdater value;
} Opt_AttributeUpdater;
typedef struct Opt_BaseEvent {
    Ark_Tag tag;
    Ark_BaseEvent value;
} Opt_BaseEvent;
typedef struct Opt_Boolean {
    Ark_Tag tag;
    Ark_Boolean value;
} Opt_Boolean;
typedef struct Opt_CheckCustomModifierModifier {
    Ark_Tag tag;
    Ark_CheckCustomModifierModifier value;
} Opt_CheckCustomModifierModifier;
typedef struct Opt_ClickEvent {
    Ark_Tag tag;
    Ark_ClickEvent value;
} Opt_ClickEvent;
typedef struct Opt_CustomObject {
    Ark_Tag tag;
    Ark_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_DrawContext {
    Ark_Tag tag;
    Ark_DrawContext value;
} Opt_DrawContext;
typedef struct Opt_DrawModifier {
    Ark_Tag tag;
    Ark_DrawModifier value;
} Opt_DrawModifier;
typedef struct Ark_DuplicateInteraceChild {
    /* kind: Interface */
    Ark_Boolean parentEnabled;
    Ark_Boolean commonEnabled;
    Ark_Boolean childEnabled;
} Ark_DuplicateInteraceChild;
typedef struct Opt_DuplicateInteraceChild {
    Ark_Tag tag;
    Ark_DuplicateInteraceChild value;
} Opt_DuplicateInteraceChild;
typedef struct Ark_DuplicateInteraceParent {
    /* kind: Interface */
    Ark_Boolean parentEnabled;
    Ark_Boolean commonEnabled;
} Ark_DuplicateInteraceParent;
typedef struct Opt_DuplicateInteraceParent {
    Ark_Tag tag;
    Ark_DuplicateInteraceParent value;
} Opt_DuplicateInteraceParent;
typedef struct Ark_DuplicateInteraceSubChild {
    /* kind: Interface */
    Ark_Boolean parentEnabled;
    Ark_Boolean commonEnabled;
    Ark_Boolean childEnabled;
    Ark_Boolean subChildEnabled;
} Ark_DuplicateInteraceSubChild;
typedef struct Opt_DuplicateInteraceSubChild {
    Ark_Tag tag;
    Ark_DuplicateInteraceSubChild value;
} Opt_DuplicateInteraceSubChild;
typedef struct Opt_Float64 {
    Ark_Tag tag;
    Ark_Float64 value;
} Opt_Float64;
typedef struct Opt_NativePointer {
    Ark_Tag tag;
    Ark_NativePointer value;
} Opt_NativePointer;
typedef struct Opt_Number {
    Ark_Tag tag;
    Ark_Number value;
} Opt_Number;
typedef struct Ark_SampleI {
    /* kind: Interface */
    Ark_Boolean flag;
} Ark_SampleI;
typedef struct Opt_SampleI {
    Ark_Tag tag;
    Ark_SampleI value;
} Opt_SampleI;
typedef struct Ark_SampleTransformDstI {
    /* kind: Interface */
    Ark_Number length;
} Ark_SampleTransformDstI;
typedef struct Opt_SampleTransformDstI {
    Ark_Tag tag;
    Ark_SampleTransformDstI value;
} Opt_SampleTransformDstI;
typedef struct Opt_String {
    Ark_Tag tag;
    Ark_String value;
} Opt_String;
typedef struct Ark_Union_SampleI_SampleTransformDstI {
    /* kind: UnionType */
    Ark_Int32 selector;
    union {
        Ark_SampleI value0;
        Ark_SampleTransformDstI value1;
    };
} Ark_Union_SampleI_SampleTransformDstI;
typedef struct Opt_Union_SampleI_SampleTransformDstI {
    Ark_Tag tag;
    Ark_Union_SampleI_SampleTransformDstI value;
} Opt_Union_SampleI_SampleTransformDstI;
typedef struct Callback_Boolean_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean value);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean value);
} Callback_Boolean_Void;
typedef struct Opt_Callback_Boolean_Void {
    Ark_Tag tag;
    Callback_Boolean_Void value;
} Opt_Callback_Boolean_Void;
typedef struct Callback_DrawContext_Void {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_DrawContext drawContext);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_DrawContext drawContext);
} Callback_DrawContext_Void;
typedef struct Opt_Callback_DrawContext_Void {
    Ark_Tag tag;
    Callback_DrawContext_Void value;
} Opt_Callback_DrawContext_Void;
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
typedef struct PageTransitionCallback {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, Ark_RouteType type, const Ark_Float64 progress);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, Ark_RouteType type, const Ark_Float64 progress);
} PageTransitionCallback;
typedef struct Opt_PageTransitionCallback {
    Ark_Tag tag;
    PageTransitionCallback value;
} Opt_PageTransitionCallback;
typedef struct TransformDstCallbackI {
    /* kind: Callback */
    Ark_CallbackResource resource;
    void (*call)(const Ark_Int32 resourceId, const Ark_Boolean value, const Callback_Boolean_Void continuation);
    void (*callSync)(Ark_VMContext vmContext, const Ark_Int32 resourceId, const Ark_Boolean value, const Callback_Boolean_Void continuation);
} TransformDstCallbackI;
typedef struct Opt_TransformDstCallbackI {
    Ark_Tag tag;
    TransformDstCallbackI value;
} Opt_TransformDstCallbackI;
typedef struct Ark_DatebookOptions {
    /* kind: Interface */
    Opt_DatebookType type;
    Opt_Boolean effect;
} Ark_DatebookOptions;
typedef struct Opt_DatebookOptions {
    Ark_Tag tag;
    Ark_DatebookOptions value;
} Opt_DatebookOptions;
typedef struct Ark_PageTransitionOptions {
    /* kind: Interface */
    Opt_RouteType type;
    Opt_Int32 duration;
    Opt_Int32 delay;
} Ark_PageTransitionOptions;
typedef struct Opt_PageTransitionOptions {
    Ark_Tag tag;
    Ark_PageTransitionOptions value;
} Opt_PageTransitionOptions;
typedef struct Throws_void {
    /* kind: Interface */
    Ark_Boolean hasException;
    union {
        Ark_Exception exception;
    };
} Throws_void;
typedef struct Opt_Throws_void {
    Ark_Tag tag;
    Throws_void value;
} Opt_Throws_void;
typedef struct Ark_TransitionParam {
    /* kind: Interface */
    Ark_PageTransitionOptions pageTransitionOptions;
    Ark_PageTransitionType pageTransitionType;
    Opt_RouteType routeType;
    Opt_PageTransitionCallback onProgress;
} Ark_TransitionParam;
typedef struct Opt_TransitionParam {
    Ark_Tag tag;
    Ark_TransitionParam value;
} Opt_TransitionParam;
typedef struct Opt_Object {
    Ark_Tag tag;
    Ark_Object value;
} Opt_Object;



typedef struct GENERATED_ArkUICheckChildModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCommonMethodBoolean)(Ark_NativePointer node,
                                   Ark_Boolean flag);
} GENERATED_ArkUICheckChildModifier;

typedef struct GENERATED_ArkUICheckCustomModifierModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setProp)(Ark_NativePointer node,
                    const Ark_Number* value);
} GENERATED_ArkUICheckCustomModifierModifier;

typedef struct GENERATED_ArkUICheckDuplicateChildModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCommonProperty)(Ark_NativePointer node,
                              const Ark_DuplicateInteraceChild* value);
    void (*setCommonMethod)(Ark_NativePointer node,
                            const Opt_DuplicateInteraceParent* param1,
                            const Opt_DuplicateInteraceSubChild* param2);
} GENERATED_ArkUICheckDuplicateChildModifier;

typedef struct GENERATED_ArkUICheckDuplicateParentModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setParentDuplicateInterface)(Ark_NativePointer node,
                                        const Ark_DuplicateInteraceParent* value);
    void (*setCommonProperty)(Ark_NativePointer node,
                              const Ark_DuplicateInteraceChild* value);
    void (*setSubChildDuplicateInterface)(Ark_NativePointer node,
                                          const Ark_DuplicateInteraceSubChild* value);
    void (*setCommonMethod)(Ark_NativePointer node,
                            const Opt_DuplicateInteraceParent* param1,
                            const Opt_DuplicateInteraceSubChild* param2);
} GENERATED_ArkUICheckDuplicateParentModifier;

typedef struct GENERATED_ArkUICheckEnumModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setEnumUByte)(Ark_NativePointer node,
                         Ark_EnumUByte value);
    void (*setEnumByte)(Ark_NativePointer node,
                        Ark_EnumByte value);
    void (*setEnumInt)(Ark_NativePointer node,
                       Ark_EnumInt value);
    void (*setEnumLong)(Ark_NativePointer node,
                        Ark_EnumLong value);
} GENERATED_ArkUICheckEnumModifier;

typedef struct GENERATED_ArkUICheckExceptionModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    Throws_void (*setMethodThrowException)(Ark_NativePointer node,
                                           const Ark_Number* count);
} GENERATED_ArkUICheckExceptionModifier;

typedef struct GENERATED_ArkUICheckHooksModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCheckHookResult)(Ark_NativePointer node,
                               const Opt_String* value);
} GENERATED_ArkUICheckHooksModifier;

typedef struct GENERATED_ArkUICheckNoModifiersModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setProp)(Ark_NativePointer node,
                    const Ark_Number* value);
} GENERATED_ArkUICheckNoModifiersModifier;

typedef struct GENERATED_ArkUICheckOptionalModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setPropBoolean)(Ark_NativePointer node,
                           Ark_Boolean value);
    void (*setPropNumber)(Ark_NativePointer node,
                          const Ark_Number* value);
    void (*setPropString)(Ark_NativePointer node,
                          const Ark_String* value);
    void (*setPropBooleanOptional)(Ark_NativePointer node,
                                   const Opt_Boolean* value);
    void (*setPropNumberOptional)(Ark_NativePointer node,
                                  const Opt_Number* value);
    void (*setPropStringOptional)(Ark_NativePointer node,
                                  const Opt_String* value);
    void (*setMethod)(Ark_NativePointer node,
                      Ark_Boolean paramBoolean,
                      const Ark_Number* paramNumber,
                      const Ark_String* paramString);
    void (*setMethodOptional)(Ark_NativePointer node,
                              const Opt_Boolean* paramBoolean,
                              const Opt_Number* paramNumber,
                              const Opt_String* paramString);
} GENERATED_ArkUICheckOptionalModifier;

typedef struct GENERATED_ArkUICheckParentModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setCommonMethodBoolean)(Ark_NativePointer node,
                                   Ark_Boolean flag);
} GENERATED_ArkUICheckParentModifier;

typedef struct GENERATED_ArkUICheckTransformModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setSample)(Ark_NativePointer node,
                      const Ark_SampleI* value);
    void (*setSampleTransformI)(Ark_NativePointer node,
                                const Ark_SampleTransformDstI* value);
    void (*setSampleTransformCallback)(Ark_NativePointer node,
                                       const TransformDstCallbackI* value);
    void (*setSampleTransformUnion)(Ark_NativePointer node,
                                    const Ark_Union_SampleI_SampleTransformDstI* value);
} GENERATED_ArkUICheckTransformModifier;

typedef struct GENERATED_ArkUICheckTrivialModifierModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setProp)(Ark_NativePointer node,
                    const Ark_Number* value);
} GENERATED_ArkUICheckTrivialModifierModifier;

typedef struct GENERATED_ArkUIDatebookModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
    void (*setDatebookOptions)(Ark_NativePointer node,
                               const Ark_DatebookOptions* label);
    void (*setType)(Ark_NativePointer node,
                    const Opt_DatebookType* value);
    void (*setText)(Ark_NativePointer node,
                    const Opt_String* value);
    void (*setForceOptCustomObject)(Ark_NativePointer node,
                                    const Opt_Object* value);
} GENERATED_ArkUIDatebookModifier;

typedef struct GENERATED_ArkUIRootModifier {
    Ark_NativePointer (*construct)(Ark_Int32 id,
                                   Ark_Int32 flags);
} GENERATED_ArkUIRootModifier;

// Accessors

typedef struct GENERATED_ArkUIBaseEventAccessor {
    void (*destroyPeer)(Ark_BaseEvent peer);
    Ark_BaseEvent (*construct)();
    Ark_NativePointer (*getFinalizer)();
    void (*callHolder)(Ark_BaseEvent peer);
    Ark_Number (*getTimestamp)(Ark_BaseEvent peer);
    void (*setTimestamp)(Ark_BaseEvent peer,
                         const Ark_Number* timestamp);
} GENERATED_ArkUIBaseEventAccessor;

typedef struct GENERATED_ArkUIClickEventAccessor {
    void (*destroyPeer)(Ark_ClickEvent peer);
    Ark_ClickEvent (*construct)();
    Ark_NativePointer (*getFinalizer)();
    void (*callHolder)(Ark_ClickEvent peer);
    Ark_Number (*getX)(Ark_ClickEvent peer);
    void (*setX)(Ark_ClickEvent peer,
                 const Ark_Number* x);
    Ark_Number (*getY)(Ark_ClickEvent peer);
    void (*setY)(Ark_ClickEvent peer,
                 const Ark_Number* y);
} GENERATED_ArkUIClickEventAccessor;

typedef struct GENERATED_ArkUIDrawContextAccessor {
    void (*destroyPeer)(Ark_DrawContext peer);
    Ark_DrawContext (*construct)();
    Ark_NativePointer (*getFinalizer)();
    void (*callHolder)(Ark_DrawContext peer);
} GENERATED_ArkUIDrawContextAccessor;

typedef struct GENERATED_ArkUIDrawModifierAccessor {
    void (*destroyPeer)(Ark_DrawModifier peer);
    Ark_DrawModifier (*construct)();
    Ark_NativePointer (*getFinalizer)();
    void (*callHolder)(Ark_DrawModifier peer);
    Callback_DrawContext_Void (*getDrawBehind_callback)(Ark_DrawModifier peer);
    void (*setDrawBehind_callback)(Ark_DrawModifier peer,
                                   const Callback_DrawContext_Void* drawBehind_callback);
} GENERATED_ArkUIDrawModifierAccessor;

typedef struct GENERATED_ArkUIStageExtenderAccessor {
    void (*SetSrcPage)(Ark_NativePointer node);
    void (*PushPage)(Ark_NativePointer node);
    void (*PopPageAndSwitchTo)(Ark_NativePointer node);
    void (*ResetTransitions)(Ark_NativePointer node);
    void (*SetPageTransition)(Ark_NativePointer node,
                              const Ark_TransitionParam* param);
} GENERATED_ArkUIStageExtenderAccessor;


/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
typedef struct GENERATED_ArkUINodeModifiers {
    const GENERATED_ArkUICheckChildModifier* (*getCheckChildModifier)();
    const GENERATED_ArkUICheckCustomModifierModifier* (*getCheckCustomModifierModifier)();
    const GENERATED_ArkUICheckDuplicateChildModifier* (*getCheckDuplicateChildModifier)();
    const GENERATED_ArkUICheckDuplicateParentModifier* (*getCheckDuplicateParentModifier)();
    const GENERATED_ArkUICheckEnumModifier* (*getCheckEnumModifier)();
    const GENERATED_ArkUICheckExceptionModifier* (*getCheckExceptionModifier)();
    const GENERATED_ArkUICheckHooksModifier* (*getCheckHooksModifier)();
    const GENERATED_ArkUICheckNoModifiersModifier* (*getCheckNoModifiersModifier)();
    const GENERATED_ArkUICheckOptionalModifier* (*getCheckOptionalModifier)();
    const GENERATED_ArkUICheckParentModifier* (*getCheckParentModifier)();
    const GENERATED_ArkUICheckTransformModifier* (*getCheckTransformModifier)();
    const GENERATED_ArkUICheckTrivialModifierModifier* (*getCheckTrivialModifierModifier)();
    const GENERATED_ArkUIDatebookModifier* (*getDatebookModifier)();
    const GENERATED_ArkUIRootModifier* (*getRootModifier)();
} GENERATED_ArkUINodeModifiers;

typedef struct GENERATED_ArkUIAccessors {
    const GENERATED_ArkUIBaseEventAccessor* (*getBaseEventAccessor)();
    const GENERATED_ArkUIClickEventAccessor* (*getClickEventAccessor)();
    const GENERATED_ArkUIDrawContextAccessor* (*getDrawContextAccessor)();
    const GENERATED_ArkUIDrawModifierAccessor* (*getDrawModifierAccessor)();
    const GENERATED_ArkUIStageExtenderAccessor* (*getStageExtenderAccessor)();
} GENERATED_ArkUIAccessors;

typedef struct GENERATED_ArkUIGraphicsAPI {
    Ark_Int32 version;
} GENERATED_ArkUIGraphicsAPI;

typedef enum GENERATED_Ark_NodeType {
    GENERATED_ARKUI_CHECK_CHILD,
    GENERATED_ARKUI_CHECK_CUSTOM_MODIFIER,
    GENERATED_ARKUI_CHECK_DUPLICATE_CHILD,
    GENERATED_ARKUI_CHECK_DUPLICATE_PARENT,
    GENERATED_ARKUI_CHECK_ENUM,
    GENERATED_ARKUI_CHECK_EXCEPTION,
    GENERATED_ARKUI_CHECK_HOOKS,
    GENERATED_ARKUI_CHECK_NO_MODIFIERS,
    GENERATED_ARKUI_CHECK_OPTIONAL,
    GENERATED_ARKUI_CHECK_PARENT,
    GENERATED_ARKUI_CHECK_TRANSFORM,
    GENERATED_ARKUI_CHECK_TRIVIAL_MODIFIER,
    GENERATED_ARKUI_DATEBOOK,
    GENERATED_ARKUI_ROOT
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

    // Improve: remove!
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
// Improve: remove after migration to OH_AnyAPI to be consistant between arkoala and ohos apis
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

