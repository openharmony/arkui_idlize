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

#ifndef OH_OHOS_RPC_H
#define OH_OHOS_RPC_H

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


#define OHOS_RPC_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_RPC_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_RPC_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_RPC_VMContext;
typedef InteropAsyncWorker OH_OHOS_RPC_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_RPC_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_RPC_APIKind {
    OH_OHOS_RPC_API_KIND = 10
} OH_OHOS_RPC_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_Boolean Array_Boolean;
typedef struct Opt_Array_Boolean Opt_Array_Boolean;
typedef struct Array_Float64 Array_Float64;
typedef struct Opt_Array_Float64 Opt_Array_Float64;
typedef struct Array_Int32 Array_Int32;
typedef struct Opt_Array_Int32 Opt_Array_Int32;
typedef struct Array_rpc_Parcelable Array_rpc_Parcelable;
typedef struct Opt_Array_rpc_Parcelable Opt_Array_rpc_Parcelable;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_Int64 Opt_Int64;
typedef struct OHOS_RPC_rpc_AshmemPeer OHOS_RPC_rpc_AshmemPeer;
typedef struct OHOS_RPC_rpc_AshmemPeer* OH_OHOS_RPC_rpc_Ashmem;
typedef struct Opt_rpc_Ashmem Opt_rpc_Ashmem;
typedef struct OHOS_RPC_rpc_DeathRecipientPeer OHOS_RPC_rpc_DeathRecipientPeer;
typedef struct OHOS_RPC_rpc_DeathRecipientPeer* OH_OHOS_RPC_rpc_DeathRecipient;
typedef struct Opt_rpc_DeathRecipient Opt_rpc_DeathRecipient;
typedef struct OHOS_RPC_rpc_IRemoteObjectPeer OHOS_RPC_rpc_IRemoteObjectPeer;
typedef struct OHOS_RPC_rpc_IRemoteObjectPeer* OH_OHOS_RPC_rpc_IRemoteObject;
typedef struct Opt_rpc_IRemoteObject Opt_rpc_IRemoteObject;
typedef struct OHOS_RPC_rpc_MessageOptionPeer OHOS_RPC_rpc_MessageOptionPeer;
typedef struct OHOS_RPC_rpc_MessageOptionPeer* OH_OHOS_RPC_rpc_MessageOption;
typedef struct Opt_rpc_MessageOption Opt_rpc_MessageOption;
typedef struct OHOS_RPC_rpc_MessageSequencePeer OHOS_RPC_rpc_MessageSequencePeer;
typedef struct OHOS_RPC_rpc_MessageSequencePeer* OH_OHOS_RPC_rpc_MessageSequence;
typedef struct Opt_rpc_MessageSequence Opt_rpc_MessageSequence;
typedef struct OHOS_RPC_rpc_ParcelablePeer OHOS_RPC_rpc_ParcelablePeer;
typedef struct OHOS_RPC_rpc_ParcelablePeer* OH_OHOS_RPC_rpc_Parcelable;
typedef struct Opt_rpc_Parcelable Opt_rpc_Parcelable;
typedef struct OH_OHOS_RPC_rpc_RequestResult OH_OHOS_RPC_rpc_RequestResult;
typedef struct Opt_rpc_RequestResult Opt_rpc_RequestResult;
typedef struct Opt_String Opt_String;
typedef struct OHOS_RPC_AsyncCallback OHOS_RPC_AsyncCallback;
typedef struct Opt_OHOS_RPC_AsyncCallback Opt_OHOS_RPC_AsyncCallback;
typedef struct OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void;
typedef struct Opt_OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void Opt_OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void;
typedef struct OHOS_RPC_Callback_Void OHOS_RPC_Callback_Void;
typedef struct Opt_OHOS_RPC_Callback_Void Opt_OHOS_RPC_Callback_Void;
typedef struct OHOS_RPC_BusinessErrorPeer OHOS_RPC_BusinessErrorPeer;
typedef struct OHOS_RPC_BusinessErrorPeer* OH_OHOS_RPC_BusinessError;
typedef struct Opt_BusinessError Opt_BusinessError;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_RPC_Object;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_Boolean {
    /* kind: ContainerType */
    OH_Boolean* array;
    OH_Int32 length;
} Array_Boolean;
typedef struct Opt_Array_Boolean {
    OH_Tag tag;
    Array_Boolean value;
} Opt_Array_Boolean;
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
typedef struct Array_rpc_Parcelable {
    /* kind: ContainerType */
    OH_OHOS_RPC_rpc_Parcelable* array;
    OH_Int32 length;
} Array_rpc_Parcelable;
typedef struct Opt_Array_rpc_Parcelable {
    OH_Tag tag;
    Array_rpc_Parcelable value;
} Opt_Array_rpc_Parcelable;
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
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct Opt_rpc_Ashmem {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_Ashmem value;
} Opt_rpc_Ashmem;
typedef struct Opt_rpc_DeathRecipient {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_DeathRecipient value;
} Opt_rpc_DeathRecipient;
typedef struct Opt_rpc_IRemoteObject {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_IRemoteObject value;
} Opt_rpc_IRemoteObject;
typedef struct Opt_rpc_MessageOption {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_MessageOption value;
} Opt_rpc_MessageOption;
typedef struct Opt_rpc_MessageSequence {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_MessageSequence value;
} Opt_rpc_MessageSequence;
typedef struct Opt_rpc_Parcelable {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_Parcelable value;
} Opt_rpc_Parcelable;
typedef struct OH_OHOS_RPC_rpc_RequestResult {
    /* kind: Interface */
    OH_Int32 errCode;
    OH_Int32 code;
    OH_OHOS_RPC_rpc_MessageSequence data;
    OH_OHOS_RPC_rpc_MessageSequence reply;
} OH_OHOS_RPC_rpc_RequestResult;
typedef struct Opt_rpc_RequestResult {
    OH_Tag tag;
    OH_OHOS_RPC_rpc_RequestResult value;
} Opt_rpc_RequestResult;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_RPC_AsyncCallback {
    /* kind: Callback */
    OH_OHOS_RPC_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
    void (*callSync)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
} OHOS_RPC_AsyncCallback;
typedef struct Opt_OHOS_RPC_AsyncCallback {
    OH_Tag tag;
    OHOS_RPC_AsyncCallback value;
} Opt_OHOS_RPC_AsyncCallback;
typedef struct OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_RPC_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void;
typedef struct Opt_OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void value;
} Opt_OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void;
typedef struct OHOS_RPC_Callback_Void {
    /* kind: Callback */
    OH_OHOS_RPC_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_RPC_Callback_Void;
typedef struct Opt_OHOS_RPC_Callback_Void {
    OH_Tag tag;
    OHOS_RPC_Callback_Void value;
} Opt_OHOS_RPC_Callback_Void;
typedef struct Opt_BusinessError {
    OH_Tag tag;
    OH_OHOS_RPC_BusinessError value;
} Opt_BusinessError;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_RPC_rpc_AshmemHandleOpaque;
typedef struct OH_OHOS_RPC_rpc_AshmemHandleOpaque* OH_OHOS_RPC_rpc_AshmemHandle;
typedef struct OH_OHOS_RPC_rpc_AshmemModifier {
    OH_OHOS_RPC_rpc_AshmemHandle (*construct)();
    void (*destruct)(OH_OHOS_RPC_rpc_AshmemHandle thisPtr);
    OH_OHOS_RPC_rpc_Ashmem (*create0)(const OH_String* name, OH_Int32 size);
    OH_OHOS_RPC_rpc_Ashmem (*create1)(OH_OHOS_RPC_rpc_Ashmem ashmem);
    OH_Int32 (*getAshmemSize)(OH_NativePointer thisPtr);
    void (*mapReadWriteAshmem)(OH_NativePointer thisPtr);
} OH_OHOS_RPC_rpc_AshmemModifier;
struct OH_OHOS_RPC_rpc_DeathRecipientHandleOpaque;
typedef struct OH_OHOS_RPC_rpc_DeathRecipientHandleOpaque* OH_OHOS_RPC_rpc_DeathRecipientHandle;
typedef struct OH_OHOS_RPC_rpc_DeathRecipientModifier {
    OH_OHOS_RPC_rpc_DeathRecipientHandle (*construct)();
    void (*destruct)(OH_OHOS_RPC_rpc_DeathRecipientHandle thisPtr);
    void (*onRemoteDied)(OH_NativePointer thisPtr);
} OH_OHOS_RPC_rpc_DeathRecipientModifier;
struct OH_OHOS_RPC_rpc_IRemoteObjectHandleOpaque;
typedef struct OH_OHOS_RPC_rpc_IRemoteObjectHandleOpaque* OH_OHOS_RPC_rpc_IRemoteObjectHandle;
typedef struct OH_OHOS_RPC_rpc_IRemoteObjectModifier {
    OH_OHOS_RPC_rpc_IRemoteObjectHandle (*construct)();
    void (*destruct)(OH_OHOS_RPC_rpc_IRemoteObjectHandle thisPtr);
    void (*sendMessageRequest0)(OH_OHOS_RPC_VMContext vmContext, OH_OHOS_RPC_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 code, OH_OHOS_RPC_rpc_MessageSequence data, OH_OHOS_RPC_rpc_MessageSequence reply, OH_OHOS_RPC_rpc_MessageOption options, const OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*sendMessageRequest1)(OH_NativePointer thisPtr, OH_Int32 code, OH_OHOS_RPC_rpc_MessageSequence data, OH_OHOS_RPC_rpc_MessageSequence reply, OH_OHOS_RPC_rpc_MessageOption options, const OHOS_RPC_AsyncCallback* callback_);
    void (*registerDeathRecipient)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_DeathRecipient recipient, OH_Int32 flags);
    void (*unregisterDeathRecipient)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_DeathRecipient recipient, OH_Int32 flags);
    OH_String (*getDescriptor)(OH_NativePointer thisPtr);
    OH_Boolean (*isObjectDead)(OH_NativePointer thisPtr);
} OH_OHOS_RPC_rpc_IRemoteObjectModifier;
struct OH_OHOS_RPC_rpc_MessageOptionHandleOpaque;
typedef struct OH_OHOS_RPC_rpc_MessageOptionHandleOpaque* OH_OHOS_RPC_rpc_MessageOptionHandle;
typedef struct OH_OHOS_RPC_rpc_MessageOptionModifier {
    OH_OHOS_RPC_rpc_MessageOptionHandle (*construct0)(const Opt_Int32* syncFlags, const Opt_Int32* waitTime);
    OH_OHOS_RPC_rpc_MessageOptionHandle (*construct1)(OH_Boolean isAsync);
    void (*destruct)(OH_OHOS_RPC_rpc_MessageOptionHandle thisPtr);
    OH_Boolean (*isAsync)(OH_NativePointer thisPtr);
    void (*setAsync)(OH_NativePointer thisPtr, OH_Boolean isAsync);
    OH_Int32 (*getTF_SYNC)();
    void (*setTF_SYNC)(OH_Int32 value);
    OH_Int32 (*getTF_ASYNC)();
    void (*setTF_ASYNC)(OH_Int32 value);
    OH_Int32 (*getTF_WAIT_TIME)();
    void (*setTF_WAIT_TIME)(OH_Int32 value);
} OH_OHOS_RPC_rpc_MessageOptionModifier;
struct OH_OHOS_RPC_rpc_MessageSequenceHandleOpaque;
typedef struct OH_OHOS_RPC_rpc_MessageSequenceHandleOpaque* OH_OHOS_RPC_rpc_MessageSequenceHandle;
typedef struct OH_OHOS_RPC_rpc_MessageSequenceModifier {
    OH_OHOS_RPC_rpc_MessageSequenceHandle (*construct)();
    void (*destruct)(OH_OHOS_RPC_rpc_MessageSequenceHandle thisPtr);
    OH_OHOS_RPC_rpc_MessageSequence (*create)();
    void (*reclaim)(OH_NativePointer thisPtr);
    void (*writeRemoteObject)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_IRemoteObject obj);
    OH_OHOS_RPC_rpc_IRemoteObject (*readRemoteObject)(OH_NativePointer thisPtr);
    void (*writeInterfaceToken)(OH_NativePointer thisPtr, const OH_String* token);
    OH_String (*readInterfaceToken)(OH_NativePointer thisPtr);
    OH_Int32 (*getCapacity)(OH_NativePointer thisPtr);
    void (*setCapacity)(OH_NativePointer thisPtr, OH_Int32 size);
    void (*writeNoException)(OH_NativePointer thisPtr);
    void (*readException)(OH_NativePointer thisPtr);
    void (*writeInt)(OH_NativePointer thisPtr, OH_Int32 val);
    void (*writeLong)(OH_NativePointer thisPtr, OH_Int64 val);
    void (*writeBoolean)(OH_NativePointer thisPtr, OH_Boolean val);
    void (*writeString)(OH_NativePointer thisPtr, const OH_String* val);
    void (*writeParcelable)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Parcelable val);
    void (*writeByteArray)(OH_NativePointer thisPtr, const Array_Int32* byteArray);
    void (*writeIntArray)(OH_NativePointer thisPtr, const Array_Int32* intArray);
    void (*writeDoubleArray)(OH_NativePointer thisPtr, const Array_Float64* doubleArray);
    void (*writeBooleanArray)(OH_NativePointer thisPtr, const Array_Boolean* booleanArray);
    void (*writeStringArray)(OH_NativePointer thisPtr, const Array_String* stringArray);
    void (*writeParcelableArray)(OH_NativePointer thisPtr, const Array_rpc_Parcelable* parcelableArray);
    OH_Int32 (*readInt)(OH_NativePointer thisPtr);
    OH_Int64 (*readLong)(OH_NativePointer thisPtr);
    OH_Boolean (*readBoolean)(OH_NativePointer thisPtr);
    OH_String (*readString)(OH_NativePointer thisPtr);
    void (*readParcelable)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Parcelable dataIn);
    void (*readIntArray0)(OH_NativePointer thisPtr, const Array_Int32* dataIn);
    Array_Int32 (*readIntArray1)(OH_NativePointer thisPtr);
    void (*readDoubleArray0)(OH_NativePointer thisPtr, const Array_Float64* dataIn);
    Array_Float64 (*readDoubleArray1)(OH_NativePointer thisPtr);
    void (*readBooleanArray0)(OH_NativePointer thisPtr, const Array_Boolean* dataIn);
    Array_Boolean (*readBooleanArray1)(OH_NativePointer thisPtr);
    void (*readStringArray0)(OH_NativePointer thisPtr, const Array_String* dataIn);
    Array_String (*readStringArray1)(OH_NativePointer thisPtr);
    void (*readParcelableArray)(OH_NativePointer thisPtr, const Array_rpc_Parcelable* parcelableArray);
    void (*closeFileDescriptor)(OH_Int32 fd);
    void (*writeFileDescriptor)(OH_NativePointer thisPtr, OH_Int32 fd);
    OH_Int32 (*readFileDescriptor)(OH_NativePointer thisPtr);
    void (*writeAshmem)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Ashmem ashmem);
    OH_OHOS_RPC_rpc_Ashmem (*readAshmem)(OH_NativePointer thisPtr);
    void (*writeRawDataBuffer)(OH_NativePointer thisPtr, const OH_Buffer* rawData, OH_Int32 size);
    OH_Buffer (*readRawDataBuffer)(OH_NativePointer thisPtr, OH_Int32 size);
} OH_OHOS_RPC_rpc_MessageSequenceModifier;
struct OH_OHOS_RPC_rpc_ParcelableHandleOpaque;
typedef struct OH_OHOS_RPC_rpc_ParcelableHandleOpaque* OH_OHOS_RPC_rpc_ParcelableHandle;
typedef struct OH_OHOS_RPC_rpc_ParcelableModifier {
    OH_OHOS_RPC_rpc_ParcelableHandle (*construct)();
    void (*destruct)(OH_OHOS_RPC_rpc_ParcelableHandle thisPtr);
    OH_Boolean (*marshalling)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_MessageSequence dataOut);
    OH_Boolean (*unmarshalling)(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_MessageSequence dataIn);
} OH_OHOS_RPC_rpc_ParcelableModifier;
typedef struct OH_OHOS_RPC_API {
    OH_Int32 version;
    const OH_OHOS_RPC_rpc_AshmemModifier* (*Rpc_Ashmem)();
    const OH_OHOS_RPC_rpc_DeathRecipientModifier* (*Rpc_DeathRecipient)();
    const OH_OHOS_RPC_rpc_IRemoteObjectModifier* (*Rpc_IRemoteObject)();
    const OH_OHOS_RPC_rpc_MessageOptionModifier* (*Rpc_MessageOption)();
    const OH_OHOS_RPC_rpc_MessageSequenceModifier* (*Rpc_MessageSequence)();
    const OH_OHOS_RPC_rpc_ParcelableModifier* (*Rpc_Parcelable)();
} OH_OHOS_RPC_API;
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

#endif // OH_OHOS_RPC_H
/* clang-format on */