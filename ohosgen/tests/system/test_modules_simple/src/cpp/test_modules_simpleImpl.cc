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
#include "test_modules_simple.h"
#include "oh_common.h"
#include <cmath>
#include <iomanip>
#include <iostream>

// Native implementation of FooInt
struct MyFooInt {
    OH_Number value;
};

struct MyFooFloat {};

OH_TEST_MODULES_SIMPLE_FooIntHandle FooInt_constructImpl(const OH_Number* initialValue) {
    std::cout << "FooInt_constructImpl(initialValue)" << std::endl;
    MyFooInt* result = new MyFooInt();
    result->value = *initialValue;
    return reinterpret_cast<OH_TEST_MODULES_SIMPLE_FooIntHandle>(result);
}

void FooInt_destructImpl(OH_TEST_MODULES_SIMPLE_FooIntHandle thiz) {
    std::cout << "FooInt_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<MyFooInt*>(thiz);
}

OH_Number FooInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    auto* obj = reinterpret_cast<MyFooInt*>(thisPtr);
    std::cout << "FooInt_getIntImpl(thisPtr, offset)"
              << "\n  thisPtr->value = " << DumpOHNumber(obj->value)
              << "\n  offset = " << DumpOHNumber(*offset) << std::endl;
    return addOHNumber(obj->value, *offset);
}

OH_Number FooInt_getValueImpl(OH_NativePointer thisPtr) {
    auto* obj = reinterpret_cast<MyFooInt*>(thisPtr);
    std::cout << "FooInt_getValueImpl(thisPtr)"
              << "\n  thisPtr->value = " << DumpOHNumber(obj->value) << std::endl;
    return obj->value;
}

void FooInt_setValueImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    auto* obj = reinterpret_cast<MyFooInt*>(thisPtr);
    std::cout << "FooInt_setValueImpl(thisPtr, value)"
              << "\n  thisPtr->value = " << DumpOHNumber(obj->value)
              << "\n  offset = " << DumpOHNumber(*value) << std::endl;
    obj->value = *value;
}

OH_Number GlobalScope_bar_getIntWithFooImpl(OH_TEST_MODULES_SIMPLE_FooInt foo) {
    std::cout << "GlobalScope_bar_getIntWithFooImpl(foo)" << std::endl;
    MyFooInt* obj = reinterpret_cast<MyFooInt*>(foo);
    std::cout << "foo->value = " << DumpOHNumber(obj->value) << std::endl;
    return obj->value;
}
