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
#include <cstdint>
#include "common-interop.h"

void CallVoid(KVMContext vmContext, KInt methodId, KInt length, void* args) {
#ifdef KOALA_USE_NODE_VM
    KOALA_INTEROP_CALL_VOID(vmContext, methodId, length, args)
#endif
}

KInt CallInt(KVMContext vmContext, KInt methodId, KInt length, void* args) {
#ifdef KOALA_USE_NODE_VM
    KOALA_INTEROP_CALL_INT(vmContext, methodId, length, args)
#else
    return -1;
#endif
}

void CallVoidInts32(KVMContext vmContext, KInt methodId, KInt numArgs, KInt* args) {
#ifdef KOALA_USE_NODE_VM
    KOALA_INTEROP_CALL_VOID_INTS32(vmContext, methodId, numArgs, args)
#endif
}

KInt CallIntInts32(KVMContext vmContext, KInt methodId, KInt numArgs, KInt* args) {
#ifdef KOALA_USE_NODE_VM
    KOALA_INTEROP_CALL_INT_INTS32(vmContext, methodId, numArgs, args)
#else
    return -1;
#endif
}

KInt impl_TestCallIntNoArgs(KVMContext vmContext, KInt methodId) {
    int32_t args[] = { 0 };
    return CallInt(
        vmContext,
        methodId,
        0,
        reinterpret_cast<void*>(args)
    );
}
KOALA_INTEROP_CTX_1(TestCallIntNoArgs, KInt, KInt)

KInt impl_TestCallIntInt32ArraySum(KVMContext vmContext, KInt methodId, int32_t* arr, KInt length) {
    return CallIntInts32(
        vmContext,
        methodId,
        length,
        reinterpret_cast<KInt*>(arr)
    );
}
KOALA_INTEROP_CTX_3(TestCallIntInt32ArraySum, KInt, KInt, int32_t*, KInt)

void impl_TestCallVoidInt32ArrayPrefixSum(KVMContext vmContext, KInt methodId, int32_t* arr, KInt length) {
    return CallVoidInts32(
        vmContext,
        methodId,
        length,
        reinterpret_cast<KInt*>(arr)
    );
}
KOALA_INTEROP_CTX_V3(TestCallVoidInt32ArrayPrefixSum, KInt, int32_t*, KInt)
