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
#include "test_manually_decomposed_promise.h"
#include "oh_common.h"
#include <thread>

struct FooWork {
    OH_Number index;
    OH_String name;
};

OH_TEST_MANUALLY_DECOMPOSED_PROMISE_FooWorkHandle FooWork_constructImpl() {
    std::cout << "FooWork_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_MANUALLY_DECOMPOSED_PROMISE_FooWorkHandle>(new FooWork());
}

void FooWork_destructImpl(OH_TEST_MANUALLY_DECOMPOSED_PROMISE_FooWorkHandle thiz) {
    std::cout << "FooWork_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<FooWork*>(thiz);
}

void FooWork_CreateImpl(OH_NativePointer thisPtr) {
    std::cout << "FooWork_CreateImpl(thisPtr)" << std::endl;
    // Nothing to do
}

void FooWork_ExecuteImpl(OH_NativePointer thisPtr, const OH_Number* index, const OH_String* name) {
    std::cout << "FooWork_ExecuteImpl(thisPtr, index, name)"
              << "\n  index = " << DumpOHNumber(*index)
              << "\n  name = " << DumpOHString(*name) << std::endl;
    // Simulates time-consuming operations
    std::this_thread::sleep_for(std::chrono::seconds{3});
    auto* obj = reinterpret_cast<FooWork*>(thisPtr);
    obj->index = *index;
    obj->name = *name;
}

OH_TEST_MANUALLY_DECOMPOSED_PROMISE_FooResult FooWork_CompleteImpl(OH_NativePointer thisPtr) {
    static unsigned callCounter = 0;
    callCounter += 1;
    std::cout << "FooWork_CompleteImpl(OH_NativePointer thisPtr)"
              << "\n  callCounter = " << callCounter << std::endl;
    auto* obj = reinterpret_cast<FooWork*>(thisPtr);
    if (callCounter % 2 == 1) {
        return { .returnValue = addOHNumber(obj->index, { .tag = INTEROP_TAG_INT32, .i32 = 1 }), .state = true };
    } else {
        return { .returnValue = { .tag = INTEROP_TAG_INT32, .i32 = 0 }, .state = false };
    }
}
