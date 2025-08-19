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

OH_OHOS_RPC_rpc_AshmemHandle rpc_Ashmem_constructImpl();
OH_OHOS_RPC_rpc_Ashmem rpc_Ashmem_create0Impl(const OH_String* name, OH_Int32 size);
OH_OHOS_RPC_rpc_Ashmem rpc_Ashmem_create1Impl(OH_OHOS_RPC_rpc_Ashmem ashmem);
void rpc_Ashmem_destructImpl(OH_OHOS_RPC_rpc_AshmemHandle thisPtr);
OH_Int32 rpc_Ashmem_getAshmemSizeImpl(OH_NativePointer thisPtr);
void rpc_Ashmem_mapReadWriteAshmemImpl(OH_NativePointer thisPtr);
OH_OHOS_RPC_rpc_DeathRecipientHandle rpc_DeathRecipient_constructImpl();
void rpc_DeathRecipient_destructImpl(OH_OHOS_RPC_rpc_DeathRecipientHandle thisPtr);
void rpc_DeathRecipient_onRemoteDiedImpl(OH_NativePointer thisPtr);
OH_OHOS_RPC_rpc_IRemoteObjectHandle rpc_IRemoteObject_constructImpl();
void rpc_IRemoteObject_destructImpl(OH_OHOS_RPC_rpc_IRemoteObjectHandle thisPtr);
OH_String rpc_IRemoteObject_getDescriptorImpl(OH_NativePointer thisPtr);
OH_Boolean rpc_IRemoteObject_isObjectDeadImpl(OH_NativePointer thisPtr);
void rpc_IRemoteObject_registerDeathRecipientImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_DeathRecipient recipient, OH_Int32 flags);
void rpc_IRemoteObject_sendMessageRequest0Impl(OH_OHOS_RPC_VMContext vmContext, OH_OHOS_RPC_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 code, OH_OHOS_RPC_rpc_MessageSequence data, OH_OHOS_RPC_rpc_MessageSequence reply, OH_OHOS_RPC_rpc_MessageOption options, const OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void* outputArgumentForReturningPromise);
void rpc_IRemoteObject_sendMessageRequest1Impl(OH_NativePointer thisPtr, OH_Int32 code, OH_OHOS_RPC_rpc_MessageSequence data, OH_OHOS_RPC_rpc_MessageSequence reply, OH_OHOS_RPC_rpc_MessageOption options, const OHOS_RPC_AsyncCallback* callback_);
void rpc_IRemoteObject_unregisterDeathRecipientImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_DeathRecipient recipient, OH_Int32 flags);
OH_OHOS_RPC_rpc_MessageOptionHandle rpc_MessageOption_construct0Impl(const Opt_Int32* syncFlags, const Opt_Int32* waitTime);
OH_OHOS_RPC_rpc_MessageOptionHandle rpc_MessageOption_construct1Impl(OH_Boolean isAsync);
void rpc_MessageOption_destructImpl(OH_OHOS_RPC_rpc_MessageOptionHandle thisPtr);
OH_Int32 rpc_MessageOption_getTF_ASYNCImpl();
OH_Int32 rpc_MessageOption_getTF_SYNCImpl();
OH_Int32 rpc_MessageOption_getTF_WAIT_TIMEImpl();
OH_Boolean rpc_MessageOption_isAsyncImpl(OH_NativePointer thisPtr);
void rpc_MessageOption_setAsyncImpl(OH_NativePointer thisPtr, OH_Boolean isAsync);
void rpc_MessageOption_setTF_ASYNCImpl(OH_Int32 value);
void rpc_MessageOption_setTF_SYNCImpl(OH_Int32 value);
void rpc_MessageOption_setTF_WAIT_TIMEImpl(OH_Int32 value);
void rpc_MessageSequence_closeFileDescriptorImpl(OH_Int32 fd);
OH_OHOS_RPC_rpc_MessageSequenceHandle rpc_MessageSequence_constructImpl();
OH_OHOS_RPC_rpc_MessageSequence rpc_MessageSequence_createImpl();
void rpc_MessageSequence_destructImpl(OH_OHOS_RPC_rpc_MessageSequenceHandle thisPtr);
OH_Int32 rpc_MessageSequence_getCapacityImpl(OH_NativePointer thisPtr);
OH_OHOS_RPC_rpc_Ashmem rpc_MessageSequence_readAshmemImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_readBooleanArray0Impl(OH_NativePointer thisPtr, const Array_Boolean* dataIn);
Array_Boolean rpc_MessageSequence_readBooleanArray1Impl(OH_NativePointer thisPtr);
OH_Boolean rpc_MessageSequence_readBooleanImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_readDoubleArray0Impl(OH_NativePointer thisPtr, const Array_Float64* dataIn);
Array_Float64 rpc_MessageSequence_readDoubleArray1Impl(OH_NativePointer thisPtr);
void rpc_MessageSequence_readExceptionImpl(OH_NativePointer thisPtr);
OH_Int32 rpc_MessageSequence_readFileDescriptorImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_readIntArray0Impl(OH_NativePointer thisPtr, const Array_Int32* dataIn);
Array_Int32 rpc_MessageSequence_readIntArray1Impl(OH_NativePointer thisPtr);
OH_String rpc_MessageSequence_readInterfaceTokenImpl(OH_NativePointer thisPtr);
OH_Int32 rpc_MessageSequence_readIntImpl(OH_NativePointer thisPtr);
OH_Int64 rpc_MessageSequence_readLongImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_readParcelableArrayImpl(OH_NativePointer thisPtr, const Array_rpc_Parcelable* parcelableArray);
void rpc_MessageSequence_readParcelableImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Parcelable dataIn);
OH_Buffer rpc_MessageSequence_readRawDataBufferImpl(OH_NativePointer thisPtr, OH_Int32 size);
OH_OHOS_RPC_rpc_IRemoteObject rpc_MessageSequence_readRemoteObjectImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_readStringArray0Impl(OH_NativePointer thisPtr, const Array_String* dataIn);
Array_String rpc_MessageSequence_readStringArray1Impl(OH_NativePointer thisPtr);
OH_String rpc_MessageSequence_readStringImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_reclaimImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_setCapacityImpl(OH_NativePointer thisPtr, OH_Int32 size);
void rpc_MessageSequence_writeAshmemImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Ashmem ashmem);
void rpc_MessageSequence_writeBooleanArrayImpl(OH_NativePointer thisPtr, const Array_Boolean* booleanArray);
void rpc_MessageSequence_writeBooleanImpl(OH_NativePointer thisPtr, OH_Boolean val);
void rpc_MessageSequence_writeByteArrayImpl(OH_NativePointer thisPtr, const Array_Int32* byteArray);
void rpc_MessageSequence_writeDoubleArrayImpl(OH_NativePointer thisPtr, const Array_Float64* doubleArray);
void rpc_MessageSequence_writeFileDescriptorImpl(OH_NativePointer thisPtr, OH_Int32 fd);
void rpc_MessageSequence_writeIntArrayImpl(OH_NativePointer thisPtr, const Array_Int32* intArray);
void rpc_MessageSequence_writeInterfaceTokenImpl(OH_NativePointer thisPtr, const OH_String* token);
void rpc_MessageSequence_writeIntImpl(OH_NativePointer thisPtr, OH_Int32 val);
void rpc_MessageSequence_writeLongImpl(OH_NativePointer thisPtr, OH_Int64 val);
void rpc_MessageSequence_writeNoExceptionImpl(OH_NativePointer thisPtr);
void rpc_MessageSequence_writeParcelableArrayImpl(OH_NativePointer thisPtr, const Array_rpc_Parcelable* parcelableArray);
void rpc_MessageSequence_writeParcelableImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_Parcelable val);
void rpc_MessageSequence_writeRawDataBufferImpl(OH_NativePointer thisPtr, const OH_Buffer* rawData, OH_Int32 size);
void rpc_MessageSequence_writeRemoteObjectImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_IRemoteObject obj);
void rpc_MessageSequence_writeStringArrayImpl(OH_NativePointer thisPtr, const Array_String* stringArray);
void rpc_MessageSequence_writeStringImpl(OH_NativePointer thisPtr, const OH_String* val);
OH_OHOS_RPC_rpc_ParcelableHandle rpc_Parcelable_constructImpl();
void rpc_Parcelable_destructImpl(OH_OHOS_RPC_rpc_ParcelableHandle thisPtr);
OH_Boolean rpc_Parcelable_marshallingImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_MessageSequence dataOut);
OH_Boolean rpc_Parcelable_unmarshallingImpl(OH_NativePointer thisPtr, OH_OHOS_RPC_rpc_MessageSequence dataIn);
const OH_OHOS_RPC_rpc_AshmemModifier* OH_OHOS_RPC_rpc_AshmemModifierImpl() {
    const static OH_OHOS_RPC_rpc_AshmemModifier instance = {
        &rpc_Ashmem_constructImpl,
        &rpc_Ashmem_destructImpl,
        &rpc_Ashmem_create0Impl,
        &rpc_Ashmem_create1Impl,
        &rpc_Ashmem_getAshmemSizeImpl,
        &rpc_Ashmem_mapReadWriteAshmemImpl,
    };
    return &instance;
}
const OH_OHOS_RPC_rpc_DeathRecipientModifier* OH_OHOS_RPC_rpc_DeathRecipientModifierImpl() {
    const static OH_OHOS_RPC_rpc_DeathRecipientModifier instance = {
        &rpc_DeathRecipient_constructImpl,
        &rpc_DeathRecipient_destructImpl,
        &rpc_DeathRecipient_onRemoteDiedImpl,
    };
    return &instance;
}
const OH_OHOS_RPC_rpc_IRemoteObjectModifier* OH_OHOS_RPC_rpc_IRemoteObjectModifierImpl() {
    const static OH_OHOS_RPC_rpc_IRemoteObjectModifier instance = {
        &rpc_IRemoteObject_constructImpl,
        &rpc_IRemoteObject_destructImpl,
        &rpc_IRemoteObject_sendMessageRequest0Impl,
        &rpc_IRemoteObject_sendMessageRequest1Impl,
        &rpc_IRemoteObject_registerDeathRecipientImpl,
        &rpc_IRemoteObject_unregisterDeathRecipientImpl,
        &rpc_IRemoteObject_getDescriptorImpl,
        &rpc_IRemoteObject_isObjectDeadImpl,
    };
    return &instance;
}
const OH_OHOS_RPC_rpc_MessageOptionModifier* OH_OHOS_RPC_rpc_MessageOptionModifierImpl() {
    const static OH_OHOS_RPC_rpc_MessageOptionModifier instance = {
        &rpc_MessageOption_construct0Impl,
        &rpc_MessageOption_construct1Impl,
        &rpc_MessageOption_destructImpl,
        &rpc_MessageOption_isAsyncImpl,
        &rpc_MessageOption_setAsyncImpl,
        &rpc_MessageOption_getTF_SYNCImpl,
        &rpc_MessageOption_setTF_SYNCImpl,
        &rpc_MessageOption_getTF_ASYNCImpl,
        &rpc_MessageOption_setTF_ASYNCImpl,
        &rpc_MessageOption_getTF_WAIT_TIMEImpl,
        &rpc_MessageOption_setTF_WAIT_TIMEImpl,
    };
    return &instance;
}
const OH_OHOS_RPC_rpc_MessageSequenceModifier* OH_OHOS_RPC_rpc_MessageSequenceModifierImpl() {
    const static OH_OHOS_RPC_rpc_MessageSequenceModifier instance = {
        &rpc_MessageSequence_constructImpl,
        &rpc_MessageSequence_destructImpl,
        &rpc_MessageSequence_createImpl,
        &rpc_MessageSequence_reclaimImpl,
        &rpc_MessageSequence_writeRemoteObjectImpl,
        &rpc_MessageSequence_readRemoteObjectImpl,
        &rpc_MessageSequence_writeInterfaceTokenImpl,
        &rpc_MessageSequence_readInterfaceTokenImpl,
        &rpc_MessageSequence_getCapacityImpl,
        &rpc_MessageSequence_setCapacityImpl,
        &rpc_MessageSequence_writeNoExceptionImpl,
        &rpc_MessageSequence_readExceptionImpl,
        &rpc_MessageSequence_writeIntImpl,
        &rpc_MessageSequence_writeLongImpl,
        &rpc_MessageSequence_writeBooleanImpl,
        &rpc_MessageSequence_writeStringImpl,
        &rpc_MessageSequence_writeParcelableImpl,
        &rpc_MessageSequence_writeByteArrayImpl,
        &rpc_MessageSequence_writeIntArrayImpl,
        &rpc_MessageSequence_writeDoubleArrayImpl,
        &rpc_MessageSequence_writeBooleanArrayImpl,
        &rpc_MessageSequence_writeStringArrayImpl,
        &rpc_MessageSequence_writeParcelableArrayImpl,
        &rpc_MessageSequence_readIntImpl,
        &rpc_MessageSequence_readLongImpl,
        &rpc_MessageSequence_readBooleanImpl,
        &rpc_MessageSequence_readStringImpl,
        &rpc_MessageSequence_readParcelableImpl,
        &rpc_MessageSequence_readIntArray0Impl,
        &rpc_MessageSequence_readIntArray1Impl,
        &rpc_MessageSequence_readDoubleArray0Impl,
        &rpc_MessageSequence_readDoubleArray1Impl,
        &rpc_MessageSequence_readBooleanArray0Impl,
        &rpc_MessageSequence_readBooleanArray1Impl,
        &rpc_MessageSequence_readStringArray0Impl,
        &rpc_MessageSequence_readStringArray1Impl,
        &rpc_MessageSequence_readParcelableArrayImpl,
        &rpc_MessageSequence_closeFileDescriptorImpl,
        &rpc_MessageSequence_writeFileDescriptorImpl,
        &rpc_MessageSequence_readFileDescriptorImpl,
        &rpc_MessageSequence_writeAshmemImpl,
        &rpc_MessageSequence_readAshmemImpl,
        &rpc_MessageSequence_writeRawDataBufferImpl,
        &rpc_MessageSequence_readRawDataBufferImpl,
    };
    return &instance;
}
const OH_OHOS_RPC_rpc_ParcelableModifier* OH_OHOS_RPC_rpc_ParcelableModifierImpl() {
    const static OH_OHOS_RPC_rpc_ParcelableModifier instance = {
        &rpc_Parcelable_constructImpl,
        &rpc_Parcelable_destructImpl,
        &rpc_Parcelable_marshallingImpl,
        &rpc_Parcelable_unmarshallingImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_RPC_API* GetOHOS_RPCAPIImpl(int version) {
    const static OH_OHOS_RPC_API api = {
        1, // version
        &OH_OHOS_RPC_rpc_AshmemModifierImpl,
        &OH_OHOS_RPC_rpc_DeathRecipientModifierImpl,
        &OH_OHOS_RPC_rpc_IRemoteObjectModifierImpl,
        &OH_OHOS_RPC_rpc_MessageOptionModifierImpl,
        &OH_OHOS_RPC_rpc_MessageSequenceModifierImpl,
        &OH_OHOS_RPC_rpc_ParcelableModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_RPC_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_RPCAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}
