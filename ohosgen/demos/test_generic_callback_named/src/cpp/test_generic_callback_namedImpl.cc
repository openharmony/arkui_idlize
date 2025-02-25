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
#include "test_generic_callback_named.h"
#include "oh_common.h"
#include <cstring>

struct FooObject {
    OH_Number value;

    FooObject() {
        static int counter = 0;
        this->value.tag = INTEROP_TAG_INT32;
        this->value.i32 = ++counter;
    }
};

OH_TEST_GENERIC_CALLBACK_NAMED_FooHandle Foo_constructImpl() {
    std::cout << "Foo_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_GENERIC_CALLBACK_NAMED_FooHandle>(new FooObject());
}

void Foo_destructImpl(OH_TEST_GENERIC_CALLBACK_NAMED_FooHandle thiz) {
    std::cout << "Foo_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<FooObject*>(thiz);
}

OH_Number Foo_getValueImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getValueImpl(thisPtr)" << std::endl;
    return reinterpret_cast<FooObject*>(thisPtr)->value;
}

void Foo_callImpl(OH_NativePointer thisPtr, const TEST_GENERIC_CALLBACK_NAMED_Callback_String_Void* cb) {
    std::cout << "Foo_callImpl(thisPtr, cb)" << std::endl;
    constexpr auto message = "Well... How will this deformed C++ function behave?";
    cb->call(cb->resource.resourceId, 
             OH_String{.chars = message, .length = static_cast<InteropInt32>(std::strlen(message))});
}
