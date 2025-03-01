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
#include "test_promise.h"
#include "oh_common.h"
#include <iostream>
#include <thread>

struct MyFoo {
    OH_Number value;
};

OH_TEST_PROMISE_FooHandle Foo_constructImpl(const OH_Number* value) {
    std::cout << "Foo_constructImpl(value)" << std::endl;
    MyFoo* res = new MyFoo();
    res->value = *value;
    return reinterpret_cast<OH_TEST_PROMISE_FooHandle>(res);
}

void Foo_destructImpl(OH_TEST_PROMISE_FooHandle thiz) {
    std::cout << "Foo_destructImpl(thiz)" << std::endl;
    MyFoo* obj = reinterpret_cast<MyFoo*>(thiz);
    delete obj;
}

void Foo_getNumberDelayedImpl(OH_TEST_PROMISE_VMContext vmContext, OH_TEST_PROMISE_AsyncWorkerPtr asyncWorker,
    OH_NativePointer thisPtr, const OH_Number* seconds, const TEST_PROMISE_Callback_Opt_Number_Opt_Array_String_Void* outputArgumentForReturningPromise) {
    std::cout << "Foo_getNumberDelayedImpl(thisPtr, seconds, outputArgumentForReturningPromise)"
              << "\n  seconds = " << DumpOHNumber(*seconds) << std::endl;
    MyFoo* obj = reinterpret_cast<MyFoo*>(thisPtr);
    // Simulates time-consuming operation
    std::this_thread::sleep_for(std::chrono::seconds(seconds->i32));
    return outputArgumentForReturningPromise->call(
        outputArgumentForReturningPromise->resource.resourceId,
        { .tag = INTEROP_TAG_INT32, .value = obj->value },
        { .tag = INTEROP_TAG_UNDEFINED, .value = {} }
    );
}

OH_Number Foo_getValueImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getValueImpl(thisPtr)" << std::endl;
    MyFoo* obj = reinterpret_cast<MyFoo*>(thisPtr);
    return obj->value;
}

void Foo_setValueImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    std::cout << "Foo_setValueImpl(thisPtr, value)"
              << "\n  value = " << DumpOHNumber(*value) << std::endl;
    MyFoo* obj = reinterpret_cast<MyFoo*>(thisPtr);
    obj->value = *value;
}
