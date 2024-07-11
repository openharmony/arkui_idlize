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
    int32_t args[] = { };
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
