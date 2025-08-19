/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_rpc.h"

OH_OHOS_RPC_rpc_AshmemHandle rpc_Ashmem_constructImpl() {
    return {};
}
OH_OHOS_RPC_rpc_Ashmem rpc_Ashmem_create0Impl(const OH_String* name, OH_Int32 size) {
    return {};
}
OH_OHOS_RPC_rpc_Ashmem rpc_Ashmem_create1Impl(OH_OHOS_RPC_rpc_Ashmem ashmem) {
    return {};
}
void rpc_Ashmem_destructImpl(OH_OHOS_RPC_rpc_AshmemHandle thisPtr) {
}
OH_Int32 rpc_Ashmem_getAshmemSizeImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_Ashmem_mapReadWriteAshmemImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_RPC_rpc_DeathRecipientHandle rpc_DeathRecipient_constructImpl() {
    return {};
}
void rpc_DeathRecipient_destructImpl(OH_OHOS_RPC_rpc_DeathRecipientHandle thisPtr) {
}
void rpc_DeathRecipient_onRemoteDiedImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_RPC_rpc_IRemoteObjectHandle rpc_IRemoteObject_constructImpl() {
    return {};
}
void rpc_IRemoteObject_destructImpl(OH_OHOS_RPC_rpc_IRemoteObjectHandle thisPtr) {
}
OH_String rpc_IRemoteObject_getDescriptorImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean rpc_IRemoteObject_isObjectDeadImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_IRemoteObject_registerDeathRecipientImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_DeathRecipient recipient, OH_Int32 flags) {
}
void rpc_IRemoteObject_sendMessageRequest0Impl(OH_OHOS_RPC_VMContext vmContext, OH_OHOS_RPC_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 code, OH_OHOS_RPC_rpc_MessageSequence data, OH_OHOS_RPC_rpc_MessageSequence reply, OH_OHOS_RPC_rpc_MessageOption options, const OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void rpc_IRemoteObject_sendMessageRequest1Impl(OH_NativePointer thisPtr, OH_Int32 code, OH_OHOS_RPC_rpc_MessageSequence data, OH_OHOS_RPC_rpc_MessageSequence reply, OH_OHOS_RPC_rpc_MessageOption options, const OHOS_RPC_AsyncCallback* callback_) {
}
void rpc_IRemoteObject_unregisterDeathRecipientImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_DeathRecipient recipient, OH_Int32 flags) {
}
OH_OHOS_RPC_rpc_MessageOptionHandle rpc_MessageOption_construct0Impl(const Opt_Int32* syncFlags, const Opt_Int32* waitTime) {
    return {};
}
OH_OHOS_RPC_rpc_MessageOptionHandle rpc_MessageOption_construct1Impl(OH_Boolean isAsync) {
    return {};
}
void rpc_MessageOption_destructImpl(OH_OHOS_RPC_rpc_MessageOptionHandle thisPtr) {
}
OH_Int32 rpc_MessageOption_getTF_ASYNCImpl() {
    return {};
}
OH_Int32 rpc_MessageOption_getTF_SYNCImpl() {
    return {};
}
OH_Int32 rpc_MessageOption_getTF_WAIT_TIMEImpl() {
    return {};
}
OH_Boolean rpc_MessageOption_isAsyncImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageOption_setAsyncImpl(OH_NativePointer thisPtr, OH_Boolean isAsync) {
}
void rpc_MessageOption_setTF_ASYNCImpl(OH_Int32 value) {
}
void rpc_MessageOption_setTF_SYNCImpl(OH_Int32 value) {
}
void rpc_MessageOption_setTF_WAIT_TIMEImpl(OH_Int32 value) {
}
void rpc_MessageSequence_closeFileDescriptorImpl(OH_Int32 fd) {
}
OH_OHOS_RPC_rpc_MessageSequenceHandle rpc_MessageSequence_constructImpl() {
    return {};
}
OH_OHOS_RPC_rpc_MessageSequence rpc_MessageSequence_createImpl() {
    return {};
}
void rpc_MessageSequence_destructImpl(OH_OHOS_RPC_rpc_MessageSequenceHandle thisPtr) {
}
OH_Int32 rpc_MessageSequence_getCapacityImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_RPC_rpc_Ashmem rpc_MessageSequence_readAshmemImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_readBooleanArray0Impl(OH_NativePointer thisPtr, const Array_Boolean* dataIn) {
}
Array_Boolean rpc_MessageSequence_readBooleanArray1Impl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean rpc_MessageSequence_readBooleanImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_readDoubleArray0Impl(OH_NativePointer thisPtr, const Array_Float64* dataIn) {
}
Array_Float64 rpc_MessageSequence_readDoubleArray1Impl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_readExceptionImpl(OH_NativePointer thisPtr) {
}
OH_Int32 rpc_MessageSequence_readFileDescriptorImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_readIntArray0Impl(OH_NativePointer thisPtr, const Array_Int32* dataIn) {
}
Array_Int32 rpc_MessageSequence_readIntArray1Impl(OH_NativePointer thisPtr) {
    return {};
}
OH_String rpc_MessageSequence_readInterfaceTokenImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Int32 rpc_MessageSequence_readIntImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Int64 rpc_MessageSequence_readLongImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_readParcelableArrayImpl(OH_NativePointer thisPtr, const Array_rpc_Parcelable* parcelableArray) {
}
void rpc_MessageSequence_readParcelableImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Parcelable dataIn) {
}
OH_Buffer rpc_MessageSequence_readRawDataBufferImpl(OH_NativePointer thisPtr, OH_Int32 size) {
    return {};
}
OH_OHOS_RPC_rpc_IRemoteObject rpc_MessageSequence_readRemoteObjectImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_readStringArray0Impl(OH_NativePointer thisPtr, const Array_String* dataIn) {
}
Array_String rpc_MessageSequence_readStringArray1Impl(OH_NativePointer thisPtr) {
    return {};
}
OH_String rpc_MessageSequence_readStringImpl(OH_NativePointer thisPtr) {
    return {};
}
void rpc_MessageSequence_reclaimImpl(OH_NativePointer thisPtr) {
}
void rpc_MessageSequence_setCapacityImpl(OH_NativePointer thisPtr, OH_Int32 size) {
}
void rpc_MessageSequence_writeAshmemImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Ashmem ashmem) {
}
void rpc_MessageSequence_writeBooleanArrayImpl(OH_NativePointer thisPtr, const Array_Boolean* booleanArray) {
}
void rpc_MessageSequence_writeBooleanImpl(OH_NativePointer thisPtr, OH_Boolean val) {
}
void rpc_MessageSequence_writeByteArrayImpl(OH_NativePointer thisPtr, const Array_Int32* byteArray) {
}
void rpc_MessageSequence_writeDoubleArrayImpl(OH_NativePointer thisPtr, const Array_Float64* doubleArray) {
}
void rpc_MessageSequence_writeFileDescriptorImpl(OH_NativePointer thisPtr, OH_Int32 fd) {
}
void rpc_MessageSequence_writeIntArrayImpl(OH_NativePointer thisPtr, const Array_Int32* intArray) {
}
void rpc_MessageSequence_writeInterfaceTokenImpl(OH_NativePointer thisPtr, const OH_String* token) {
}
void rpc_MessageSequence_writeIntImpl(OH_NativePointer thisPtr, OH_Int32 val) {
}
void rpc_MessageSequence_writeLongImpl(OH_NativePointer thisPtr, OH_Int64 val) {
}
void rpc_MessageSequence_writeNoExceptionImpl(OH_NativePointer thisPtr) {
}
void rpc_MessageSequence_writeParcelableArrayImpl(OH_NativePointer thisPtr, const Array_rpc_Parcelable* parcelableArray) {
}
void rpc_MessageSequence_writeParcelableImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Parcelable val) {
}
void rpc_MessageSequence_writeRawDataBufferImpl(OH_NativePointer thisPtr, const OH_Buffer* rawData, OH_Int32 size) {
}
void rpc_MessageSequence_writeRemoteObjectImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_IRemoteObject obj) {
}
void rpc_MessageSequence_writeStringArrayImpl(OH_NativePointer thisPtr, const Array_String* stringArray) {
}
void rpc_MessageSequence_writeStringImpl(OH_NativePointer thisPtr, const OH_String* val) {
}
OH_OHOS_RPC_rpc_ParcelableHandle rpc_Parcelable_constructImpl() {
    return {};
}
void rpc_Parcelable_destructImpl(OH_OHOS_RPC_rpc_ParcelableHandle thisPtr) {
}
OH_Boolean rpc_Parcelable_marshallingImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_MessageSequence dataOut) {
    return {};
}
OH_Boolean rpc_Parcelable_unmarshallingImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_MessageSequence dataIn) {
    return {};
}