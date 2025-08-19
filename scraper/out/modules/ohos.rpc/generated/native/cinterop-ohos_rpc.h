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

#ifndef CINTEROP_OHOS_RPC_H
#define CINTEROP_OHOS_RPC_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(rpc_Ashmem_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_Ashmem_getFinalizer, KNativePointer)
KOALA_INTEROP_2(rpc_Ashmem_create0, KNativePointer, KStringPtr, KInt)
KOALA_INTEROP_DIRECT_1(rpc_Ashmem_create1, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_Ashmem_getAshmemSize, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_V1(rpc_Ashmem_mapReadWriteAshmem, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_DeathRecipient_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_DeathRecipient_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V1(rpc_DeathRecipient_onRemoteDied, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_IRemoteObject_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_IRemoteObject_getFinalizer, KNativePointer)
KOALA_INTEROP_CTX_V7(rpc_IRemoteObject_sendMessageRequest0, KNativePointer, KInt, KNativePointer, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V7(rpc_IRemoteObject_sendMessageRequest1, KNativePointer, KInt, KNativePointer, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(rpc_IRemoteObject_registerDeathRecipient, KNativePointer, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_V3(rpc_IRemoteObject_unregisterDeathRecipient, KNativePointer, KNativePointer, KInt)
KOALA_INTEROP_1(rpc_IRemoteObject_getDescriptor, KStringPtr, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_IRemoteObject_isObjectDead, KBoolean, KNativePointer)
KOALA_INTEROP_DIRECT_2(rpc_MessageOption_construct0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(rpc_MessageOption_construct1, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_MessageOption_isAsync, KBoolean, KNativePointer)
KOALA_INTEROP_DIRECT_V2(rpc_MessageOption_setAsync, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getTF_SYNC, KInt)
KOALA_INTEROP_DIRECT_V1(rpc_MessageOption_setTF_SYNC, KInt)
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getTF_ASYNC, KInt)
KOALA_INTEROP_DIRECT_V1(rpc_MessageOption_setTF_ASYNC, KInt)
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getTF_WAIT_TIME, KInt)
KOALA_INTEROP_DIRECT_V1(rpc_MessageOption_setTF_WAIT_TIME, KInt)
KOALA_INTEROP_DIRECT_0(rpc_MessageSequence_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_MessageSequence_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_MessageSequence_create, KNativePointer)
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_reclaim, KNativePointer)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeRemoteObject, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readRemoteObject, KNativePointer, KNativePointer)
KOALA_INTEROP_V2(rpc_MessageSequence_writeInterfaceToken, KNativePointer, KStringPtr)
KOALA_INTEROP_1(rpc_MessageSequence_readInterfaceToken, KStringPtr, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_getCapacity, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_setCapacity, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_writeNoException, KNativePointer)
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_readException, KNativePointer)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeInt, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeLong, KNativePointer, KLong)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeBoolean, KNativePointer, KInt)
KOALA_INTEROP_V2(rpc_MessageSequence_writeString, KNativePointer, KStringPtr)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeParcelable, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeByteArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeIntArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeDoubleArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeBooleanArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeStringArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeParcelableArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readInt, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readLong, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readBoolean, KBoolean, KNativePointer)
KOALA_INTEROP_1(rpc_MessageSequence_readString, KStringPtr, KNativePointer)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_readParcelable, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readIntArray0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(rpc_MessageSequence_readIntArray1, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readDoubleArray0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(rpc_MessageSequence_readDoubleArray1, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readBooleanArray0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(rpc_MessageSequence_readBooleanArray1, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readStringArray0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(rpc_MessageSequence_readStringArray1, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readParcelableArray, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_closeFileDescriptor, KInt)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeFileDescriptor, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readFileDescriptor, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeAshmem, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readAshmem, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V4(rpc_MessageSequence_writeRawDataBuffer, KNativePointer, KSerializerBuffer, int32_t, KInt)
KOALA_INTEROP_2(rpc_MessageSequence_readRawDataBuffer, KInteropReturnBuffer, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_0(rpc_Parcelable_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(rpc_Parcelable_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_2(rpc_Parcelable_marshalling, KBoolean, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_2(rpc_Parcelable_unmarshalling, KBoolean, KNativePointer, KNativePointer)
#endif // CINTEROP_OHOS_RPC_H
