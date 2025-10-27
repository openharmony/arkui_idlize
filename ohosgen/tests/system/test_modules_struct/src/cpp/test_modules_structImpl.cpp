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
#include "test_modules_struct.h"
#include "oh_common.h"

namespace {
int counter = 0;
}

struct FooInt {
    OH_Number value;

    FooInt(OH_Number initialValue) {
        std::cout << "FooInt()" << std::endl;
        value = addOHNumber(OH_Number{.tag = INTEROP_TAG_INT32, .i32 = (++counter)}, initialValue);
    }
};

OH_TEST_MODULES_STRUCT_FooIntHandle FooInt_constructImpl(const OH_Number* initialValue) {
    std::cout << "FooInt_constructImpl(initialValue)"
              << "\n  initialValue = " << DumpOHNumber(*initialValue) << std::endl;
    return reinterpret_cast<OH_TEST_MODULES_STRUCT_FooIntHandle>(new FooInt(*initialValue));
}

void FooInt_destructImpl(OH_TEST_MODULES_STRUCT_FooIntHandle thiz) {
    std::cout << "FooInt_destructImpl(thisPtr)" << std::endl;
    delete reinterpret_cast<FooInt*>(thiz);
}

OH_Number FooInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    std::cout << "FooInt_getIntImpl(thisPtr, offset)"
              << "\n  offset = " << DumpOHNumber(*offset) << std::endl;
    return addOHNumber(reinterpret_cast<FooInt*>(thisPtr)->value, *offset);
}

OH_Number FooInt_getValueImpl(OH_NativePointer thisPtr) {
    std::cout << "FooInt_getValueImpl(thisPtr)" << std::endl;
    return reinterpret_cast<FooInt*>(thisPtr)->value;
}

void FooInt_setValueImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    std::cout << "FooInt_setValueImpl(thisPtr, value)"
              << "\n  value = " << DumpOHNumber(*value) << std::endl;
    reinterpret_cast<FooInt*>(thisPtr)->value = *value;
}

OH_Number GlobalScope_baz_getIntWithFooImpl(OH_TEST_MODULES_STRUCT_FooInt foo) {
    std::cout << "GlobalScope_baz_getIntWithFooImpl(foo)" << std::endl;
    return addOHNumber(reinterpret_cast<FooInt*>(foo)->value, OH_Number{.tag = INTEROP_TAG_FLOAT32, .f32 = 42.125});
}

OH_Number GlobalScope_baz_getIntWithBarImpl(const OH_TEST_MODULES_STRUCT_BarInt* bar) {
    std::cout << "GlobalScope_baz_getIntWithBarImpl(bar)" << std::endl;
    auto valueA = reinterpret_cast<FooInt*>(bar->fooA)->value;
    std::cout << "  bar->fooA->value = " << DumpOHNumber(valueA) << std::endl;
    auto valueB = reinterpret_cast<FooInt*>(bar->fooB)->value;
    std::cout << "  bar->fooB->value = " << DumpOHNumber(valueB) << std::endl;
    return addOHNumber(valueA, valueB);
}
