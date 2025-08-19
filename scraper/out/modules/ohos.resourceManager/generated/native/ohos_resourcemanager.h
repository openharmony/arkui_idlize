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

#ifndef OH_OHOS_RESOURCEMANAGER_H
#define OH_OHOS_RESOURCEMANAGER_H

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


#define OHOS_RESOURCEMANAGER_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_RESOURCEMANAGER_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_RESOURCEMANAGER_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_RESOURCEMANAGER_VMContext;
typedef InteropAsyncWorker OH_OHOS_RESOURCEMANAGER_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_RESOURCEMANAGER_APIKind {
    OH_OHOS_RESOURCEMANAGER_API_KIND = 10
} OH_OHOS_RESOURCEMANAGER_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Array_Union_String_F64 Array_Union_String_F64;
typedef struct Opt_Array_Union_String_F64 Opt_Array_Union_String_F64;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_Int64 Opt_Int64;
typedef struct OHOS_RESOURCEMANAGER_DrawableDescriptorPeer OHOS_RESOURCEMANAGER_DrawableDescriptorPeer;
typedef struct OHOS_RESOURCEMANAGER_DrawableDescriptorPeer* OH_OHOS_RESOURCEMANAGER_DrawableDescriptor;
typedef struct Opt_DrawableDescriptor Opt_DrawableDescriptor;
typedef struct OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerPeer OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerPeer;
typedef struct OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerPeer* OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager;
typedef struct Opt_resourceManager_ResourceManager Opt_resourceManager_ResourceManager;
typedef struct Opt_String Opt_String;
typedef struct OHOS_RESOURCEMANAGER_AsyncCallback OHOS_RESOURCEMANAGER_AsyncCallback;
typedef struct Opt_OHOS_RESOURCEMANAGER_AsyncCallback Opt_OHOS_RESOURCEMANAGER_AsyncCallback;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void Opt_OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Void OHOS_RESOURCEMANAGER_Callback_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Void Opt_OHOS_RESOURCEMANAGER_Callback_Void;
typedef struct OHOS_RESOURCEMANAGER_BusinessErrorPeer OHOS_RESOURCEMANAGER_BusinessErrorPeer;
typedef struct OHOS_RESOURCEMANAGER_BusinessErrorPeer* OH_OHOS_RESOURCEMANAGER_BusinessError;
typedef struct Opt_BusinessError Opt_BusinessError;
typedef struct OH_OHOS_RESOURCEMANAGER_Configuration OH_OHOS_RESOURCEMANAGER_Configuration;
typedef struct Opt_Configuration Opt_Configuration;
typedef struct OHOS_RESOURCEMANAGER_resourceManager_ConfigurationPeer OHOS_RESOURCEMANAGER_resourceManager_ConfigurationPeer;
typedef struct OHOS_RESOURCEMANAGER_resourceManager_ConfigurationPeer* OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration;
typedef struct Opt_resourceManager_Configuration Opt_resourceManager_Configuration;
typedef struct OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityPeer OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityPeer;
typedef struct OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityPeer* OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability;
typedef struct Opt_resourceManager_DeviceCapability Opt_resourceManager_DeviceCapability;
typedef struct OH_OHOS_RESOURCEMANAGER_Union_String_F64 OH_OHOS_RESOURCEMANAGER_Union_String_F64;
typedef struct Opt_Union_String_F64 Opt_Union_String_F64;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_RESOURCEMANAGER_Object;
typedef enum OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode {
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_NOT_SET = -1,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_DARK = 0,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_COLOR_MODE_COLOR_MODE_LIGHT = 1,
} OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode;
typedef struct Opt_ConfigurationConstant_ColorMode {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode value;
} Opt_ConfigurationConstant_ColorMode;
typedef enum OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction {
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_DIRECTION_DIRECTION_NOT_SET = -1,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_DIRECTION_DIRECTION_VERTICAL = 0,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_DIRECTION_DIRECTION_HORIZONTAL = 1,
} OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction;
typedef struct Opt_ConfigurationConstant_Direction {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction value;
} Opt_ConfigurationConstant_Direction;
typedef enum OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity {
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_NOT_SET = 0,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_SDPI = 120,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_MDPI = 160,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_LDPI = 240,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_XLDPI = 320,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_XXLDPI = 480,
    OH_OHOS_RESOURCEMANAGER_CONFIGURATION_CONSTANT_SCREEN_DENSITY_SCREEN_DENSITY_XXXLDPI = 640,
} OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity;
typedef struct Opt_ConfigurationConstant_ScreenDensity {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity value;
} Opt_ConfigurationConstant_ScreenDensity;
typedef enum OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode {
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_COLOR_MODE_DARK = 0,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_COLOR_MODE_LIGHT = 1,
} OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode;
typedef struct Opt_resourceManager_ColorMode {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode value;
} Opt_resourceManager_ColorMode;
typedef enum OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType {
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_PHONE = 0,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_TABLET = 1,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_CAR = 2,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_PC = 3,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_TV = 4,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_WEARABLE = 6,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DEVICE_TYPE_DEVICE_TYPE_2IN1 = 7,
} OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType;
typedef struct Opt_resourceManager_DeviceType {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType value;
} Opt_resourceManager_DeviceType;
typedef enum OH_OHOS_RESOURCEMANAGER_resourceManager_Direction {
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DIRECTION_DIRECTION_VERTICAL = 0,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_DIRECTION_DIRECTION_HORIZONTAL = 1,
} OH_OHOS_RESOURCEMANAGER_resourceManager_Direction;
typedef struct Opt_resourceManager_Direction {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_Direction value;
} Opt_resourceManager_Direction;
typedef enum OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity {
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_SCREEN_DENSITY_SCREEN_SDPI = 120,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_SCREEN_DENSITY_SCREEN_MDPI = 160,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_SCREEN_DENSITY_SCREEN_LDPI = 240,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_SCREEN_DENSITY_SCREEN_XLDPI = 320,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_SCREEN_DENSITY_SCREEN_XXLDPI = 480,
    OH_OHOS_RESOURCEMANAGER_RESOURCE_MANAGER_SCREEN_DENSITY_SCREEN_XXXLDPI = 640,
} OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity;
typedef struct Opt_resourceManager_ScreenDensity {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity value;
} Opt_resourceManager_ScreenDensity;
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
typedef struct Array_Union_String_F64 {
    /* kind: ContainerType */
    OH_OHOS_RESOURCEMANAGER_Union_String_F64* array;
    OH_Int32 length;
} Array_Union_String_F64;
typedef struct Opt_Array_Union_String_F64 {
    OH_Tag tag;
    Array_Union_String_F64 value;
} Opt_Array_Union_String_F64;
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
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct Opt_DrawableDescriptor {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_DrawableDescriptor value;
} Opt_DrawableDescriptor;
typedef struct Opt_resourceManager_ResourceManager {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager value;
} Opt_resourceManager_ResourceManager;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_RESOURCEMANAGER_AsyncCallback {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
} OHOS_RESOURCEMANAGER_AsyncCallback;
typedef struct Opt_OHOS_RESOURCEMANAGER_AsyncCallback {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_AsyncCallback value;
} Opt_OHOS_RESOURCEMANAGER_AsyncCallback;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Configuration value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Configuration value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error);
} OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void;
typedef struct OHOS_RESOURCEMANAGER_Callback_Void {
    /* kind: Callback */
    OH_OHOS_RESOURCEMANAGER_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_RESOURCEMANAGER_Callback_Void;
typedef struct Opt_OHOS_RESOURCEMANAGER_Callback_Void {
    OH_Tag tag;
    OHOS_RESOURCEMANAGER_Callback_Void value;
} Opt_OHOS_RESOURCEMANAGER_Callback_Void;
typedef struct Opt_BusinessError {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_BusinessError value;
} Opt_BusinessError;
typedef struct OH_OHOS_RESOURCEMANAGER_Configuration {
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
} OH_OHOS_RESOURCEMANAGER_Configuration;
typedef struct Opt_Configuration {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_Configuration value;
} Opt_Configuration;
typedef struct Opt_resourceManager_Configuration {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration value;
} Opt_resourceManager_Configuration;
typedef struct Opt_resourceManager_DeviceCapability {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability value;
} Opt_resourceManager_DeviceCapability;
typedef struct OH_OHOS_RESOURCEMANAGER_Union_String_F64 {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_Float64 value1;
    };
} OH_OHOS_RESOURCEMANAGER_Union_String_F64;
typedef struct Opt_Union_String_F64 {
    OH_Tag tag;
    OH_OHOS_RESOURCEMANAGER_Union_String_F64 value;
} Opt_Union_String_F64;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandleOpaque;
typedef struct OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandleOpaque* OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandle;
typedef struct OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationModifier {
    OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandle (*construct)();
    void (*destruct)(OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandle thisPtr);
    OH_OHOS_RESOURCEMANAGER_resourceManager_Direction (*getDirection)(OH_NativePointer thisPtr);
    void (*setDirection)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_Direction value);
    OH_String (*getLocale)(OH_NativePointer thisPtr);
    void (*setLocale)(OH_NativePointer thisPtr, const OH_String* value);
    OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType (*getDeviceType)(OH_NativePointer thisPtr);
    void (*setDeviceType)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType value);
    OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity (*getScreenDensity)(OH_NativePointer thisPtr);
    void (*setScreenDensity)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity value);
    OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode (*getColorMode)(OH_NativePointer thisPtr);
    void (*setColorMode)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode value);
    OH_Int32 (*getMcc)(OH_NativePointer thisPtr);
    void (*setMcc)(OH_NativePointer thisPtr, OH_Int32 value);
    OH_Int32 (*getMnc)(OH_NativePointer thisPtr);
    void (*setMnc)(OH_NativePointer thisPtr, OH_Int32 value);
} OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationModifier;
struct OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandleOpaque;
typedef struct OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandleOpaque* OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandle;
typedef struct OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityModifier {
    OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandle (*construct)();
    void (*destruct)(OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandle thisPtr);
    OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity (*getScreenDensity)(OH_NativePointer thisPtr);
    void (*setScreenDensity)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity value);
    OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType (*getDeviceType)(OH_NativePointer thisPtr);
    void (*setDeviceType)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType value);
} OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityModifier;
struct OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandleOpaque;
typedef struct OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandleOpaque* OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandle;
typedef struct OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerModifier {
    OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandle (*construct)();
    void (*destruct)(OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandle thisPtr);
    void (*getDeviceCapability0)(OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getDeviceCapability1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getConfiguration0)(OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getConfiguration1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getStringByName0)(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getStringByName1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getStringArrayByName0)(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getStringArrayByName1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaByName0)(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaByName1)(OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaByName2)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaByName3)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaBase64ByName0)(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaBase64ByName1)(OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaBase64ByName2)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaBase64ByName3)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_String (*getStringSync0)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_String (*getStringSync1)(OH_NativePointer thisPtr, OH_Int64 resId, const Array_Union_String_F64* args);
    OH_String (*getStringByNameSync0)(OH_NativePointer thisPtr, const OH_String* resName);
    OH_String (*getStringByNameSync1)(OH_NativePointer thisPtr, const OH_String* resName, const Array_Union_String_F64* args);
    OH_Boolean (*getBoolean)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_Boolean (*getBooleanByName)(OH_NativePointer thisPtr, const OH_String* resName);
    OH_Int32 (*getInt)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_Float64 (*getDouble)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_Int32 (*getIntByName)(OH_NativePointer thisPtr, const OH_String* resName);
    OH_Float64 (*getDoubleByName)(OH_NativePointer thisPtr, const OH_String* resName);
    void (*getStringValue0)(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getStringValue1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getStringArrayValue0)(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getStringArrayValue1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_String (*getIntPluralStringValueSync)(OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 num, const Array_Union_String_F64* args);
    OH_String (*getIntPluralStringByNameSync)(OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 num, const Array_Union_String_F64* args);
    OH_String (*getDoublePluralStringValueSync)(OH_NativePointer thisPtr, OH_Int64 resId, OH_Float64 num, const Array_Union_String_F64* args);
    OH_String (*getDoublePluralStringByNameSync)(OH_NativePointer thisPtr, const OH_String* resName, OH_Float64 num, const Array_Union_String_F64* args);
    void (*getMediaContent0)(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaContent1)(OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaContent2)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaContent3)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaContentBase640)(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaContentBase641)(OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getMediaContentBase642)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getMediaContentBase643)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getRawFileContent0)(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getRawFileContent1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getRawFd0)(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getRawFd1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*closeRawFd0)(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*closeRawFd1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_OHOS_RESOURCEMANAGER_DrawableDescriptor (*getDrawableDescriptor)(OH_NativePointer thisPtr, OH_Int64 resId, const Opt_Int32* density, const Opt_Int32* type);
    OH_OHOS_RESOURCEMANAGER_DrawableDescriptor (*getDrawableDescriptorByName)(OH_NativePointer thisPtr, const OH_String* resName, const Opt_Int32* density, const Opt_Int32* type);
    void (*getRawFileList0)(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getRawFileList1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getColor0)(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getColor1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getColorByName0)(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_);
    void (*getColorByName1)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_Int64 (*getColorSync)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_Int64 (*getColorByNameSync)(OH_NativePointer thisPtr, const OH_String* resName);
    void (*addResource)(OH_NativePointer thisPtr, const OH_String* path);
    void (*removeResource)(OH_NativePointer thisPtr, const OH_String* path);
    OH_CustomObject (*getRawFdSync)(OH_NativePointer thisPtr, const OH_String* path);
    void (*closeRawFdSync)(OH_NativePointer thisPtr, const OH_String* path);
    Array_String (*getRawFileListSync)(OH_NativePointer thisPtr, const OH_String* path);
    OH_Buffer (*getRawFileContentSync)(OH_NativePointer thisPtr, const OH_String* path);
    OH_Buffer (*getMediaContentSync)(OH_NativePointer thisPtr, OH_Int64 resId, const Opt_Int32* density);
    OH_String (*getMediaContentBase64Sync)(OH_NativePointer thisPtr, OH_Int64 resId, const Opt_Int32* density);
    Array_String (*getStringArrayValueSync)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_Buffer (*getMediaByNameSync)(OH_NativePointer thisPtr, const OH_String* resName, const Opt_Int32* density);
    OH_String (*getMediaBase64ByNameSync)(OH_NativePointer thisPtr, const OH_String* resName, const Opt_Int32* density);
    Array_String (*getStringArrayByNameSync)(OH_NativePointer thisPtr, const OH_String* resName);
    OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration (*getConfigurationSync)(OH_NativePointer thisPtr);
    OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability (*getDeviceCapabilitySync)(OH_NativePointer thisPtr);
    Array_String (*getLocales)(OH_NativePointer thisPtr, const Opt_Boolean* includeSystem);
    OH_Int64 (*getSymbol)(OH_NativePointer thisPtr, OH_Int64 resId);
    OH_Int64 (*getSymbolByName)(OH_NativePointer thisPtr, const OH_String* resName);
    OH_Boolean (*isRawDir)(OH_NativePointer thisPtr, const OH_String* path);
    OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager (*getOverrideResourceManager)(OH_NativePointer thisPtr, const Opt_resourceManager_Configuration* configuration);
    OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration (*getOverrideConfiguration)(OH_NativePointer thisPtr);
    void (*updateOverrideConfiguration)(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration configuration);
} OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerModifier;
typedef struct OH_OHOS_RESOURCEMANAGER_API {
    OH_Int32 version;
    const OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationModifier* (*ResourceManager_Configuration)();
    const OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityModifier* (*ResourceManager_DeviceCapability)();
    const OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerModifier* (*ResourceManager_ResourceManager)();
} OH_OHOS_RESOURCEMANAGER_API;
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

#endif // OH_OHOS_RESOURCEMANAGER_H
/* clang-format on */