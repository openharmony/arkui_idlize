/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#include <algorithm>
#include <iostream>

#include "oh_common.h"
#include "test_ost.h"

struct Counted {
    OH_Number index;

    Counted()
    {
        static int counter = 0;
        index = { .tag = INTEROP_TAG_INT32, .i32 = ++counter };
        std::cout << "  new Counted(" << index.i32 << ")" << std::endl;
    }
    ~Counted()
    {
        std::cout << "  delete Counted(" << index.i32 << ")" << std::endl;
    }
};

InteropCallbackResource MakeInteropCallbackResource(size_t sizeBytes, InteropNativePointer* data)
{
    static std::unordered_map<InteropInt32, int32_t> resources {};
    InteropCallbackResource res {};
    auto [allocated, index] = AllocationManager::Allocate(sizeBytes);
    InteropInt32 castedIndex = static_cast<InteropInt32>(index);
    resources[castedIndex] = 1;
    if (data != nullptr) {
        *data = allocated;
    }
    res.resourceId = index;
    res.hold = [](InteropInt32 resourceId) {
        std::cout << "InteropCallbackResource.hold called with resourceId = " << resourceId << std::endl;
        resources[resourceId] += 1;
    };

    res.release = [](InteropInt32 resourceId) {
        std::cout << "InteropCallbackResource.release called with resourceId = " << resourceId << std::endl;
        resources[resourceId] -= 1;
        if (resources[resourceId] <= 0) {
            AllocationManager::Deallocate(resourceId);
        }
    };
    return res;
}

OH_Number addOHNumber(OH_Number x, OH_Number y)
{
    OH_Number res;
    res.tag = x.tag;
    if (res.tag == INTEROP_TAG_INT32) {
        if (y.tag == INTEROP_TAG_INT32) {
            res.i32 = x.i32 + y.i32;
        } else if (y.tag == INTEROP_TAG_FLOAT32) {
            res.tag = INTEROP_TAG_FLOAT32;
            res.f32 = static_cast<float>(x.i32) + y.f32;
        } else {
            std::cout << "OH_Number addOHNumber(OH_Number x, OH_Number y): y is not number." << std::endl;
            res.tag = INTEROP_TAG_FLOAT32;
            res.f32 = NAN;
        }
    } else if (res.tag == INTEROP_TAG_FLOAT32) {
        if (y.tag == INTEROP_TAG_INT32) {
            res.f32 = x.f32 + static_cast<float>(y.i32);
        } else if (y.tag == INTEROP_TAG_FLOAT32) {
            res.f32 = x.f32 + y.f32;
        } else {
            res.f32 = NAN;
        }
    } else {
        std::cout << "OH_Number addOHNumber(OH_Number x, OH_Number y): x is not number." << std::endl;
        res.tag = INTEROP_TAG_FLOAT32;
        res.f32 = NAN;
    }
    return res;
}

// Buffers
OH_NativePointer buffers_Buffers_constructImpl()
{
    std::cout << "Buffers_ConstructImpl()" << std::endl;
    return new Counted();
}

void buffers_Buffers_destructImpl(OH_NativePointer thisPtr)
{
    std::cout << "Buffers_destructImpl()" << std::endl;
    delete reinterpret_cast<Counted*>(thisPtr);
}

OH_Buffer buffers_Buffers_getDataImpl(OH_NativePointer thisPtr)
{
    std::cout << "Buffers_getDataImpl()" << std::endl;
    uint64_t data[4];
    std::fill_n(data, std::size(data), 0x0123'4567'89AB'CDEF);
    OH_Buffer res = MakeOHBuffer(sizeof(data));
    std::copy_n(reinterpret_cast<char*>(data), sizeof(data), reinterpret_cast<char*>(res.data));
    return res;
}

OH_TEST_OST_Result buffers_Buffers_getResultImpl(OH_NativePointer thisPtr)
{
    static int counter = 0;
    constexpr int bufferSize = 100;
    counter += bufferSize;
    std::cout << "Buffers_getResultImpl()" << std::endl;
    OH_TEST_OST_Result res;
    res.index = { .tag = INTEROP_TAG_INT32, .i32 = counter };
    uint32_t data[16];
    std::fill_n(data, std::size(data), 0x1234'5678);
    res.data = MakeOHBuffer(sizeof(data));
    std::copy_n(reinterpret_cast<char*>(data), sizeof(data), reinterpret_cast<char*>(res.data.data));
    return res;
}

// Callbacks
OH_NativePointer callbacks_Callbacks_constructImpl()
{
    std::cout << "Callbacks_ConstructImpl()" << std::endl;
    return new Counted();
}

void callbacks_Callbacks_destructImpl(OH_NativePointer thisPtr)
{
    std::cout << "Callbacks_destructImpl()" << std::endl;
    delete reinterpret_cast<Counted*>(thisPtr);
}

OH_Number callbacks_Callbacks_getXImpl(OH_NativePointer thisPtr)
{
    std::cout << "Callbacks_getXImpl()" << std::endl;
    return reinterpret_cast<Counted*>(thisPtr)->index;
}

void callbacks_Callbacks_callNumberImpl(
    OH_NativePointer thisPtr, const OH_Number* y, const OH_TEST_OST_Callback_Number* cb)
{
    std::cout << "Callbacks_callNumberImpl(thisPtr, y, cb)" << "\n  y = " << DumpOHNumber(*y) << std::endl;
    OH_Number sum = addOHNumber(reinterpret_cast<Counted*>(thisPtr)->index, *y);
    cb->call(cb->resource.resourceId, sum);
}

void callbacks_Callbacks_callVoidImpl(OH_NativePointer thisPtr, const OH_TEST_OST_Callback_Void* cb)
{
    std::cout << "Callbacks_callVoidImpl(thisPtr, cb)" << std::endl;
    cb->call(cb->resource.resourceId);
}

// FQN
void fqnDeps_resizeImpl(const OH_TEST_OST_fqnDeps_Size* arg)
{
    std::cout << "resize(intSize=" << arg->intWidth << "x" << arg->intHeight << ")" << std::endl;
}

void fqnDeps_fp_resizeImpl(const OH_TEST_OST_fqnDeps_fp_Size* arg)
{
    std::cout << "resize(floatSize=" << arg->floatWidth << "x" << arg->floatHeight << ")" << std::endl;
}

void fqnMain_resizeImpl(const OH_TEST_OST_fqnMain_Size* arg)
{
    std::cout << "resize(numSize=" << DumpOHNumber(arg->numWidth) << "x" << DumpOHNumber(arg->numHeight) << ")"
              << std::endl;
}

void fqnMain_resizeAllImpl(const OH_TEST_OST_Sizes* arg)
{
    fqnMain_resizeImpl(&arg->numSize);
    fqnDeps_resizeImpl(&arg->intSize);
    fqnDeps_fp_resizeImpl(&arg->floatSize);
}

void fqnMain_resize3Impl(const OH_TEST_OST_fqnMain_Size* numSize, const OH_TEST_OST_fqnDeps_Size* intSize,
    const OH_TEST_OST_fqnDeps_fp_Size* floatSize)
{
    fqnMain_resizeImpl(numSize);
    fqnDeps_resizeImpl(intSize);
    fqnDeps_fp_resizeImpl(floatSize);
}
