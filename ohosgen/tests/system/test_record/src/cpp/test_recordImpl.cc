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
#include "test_record.h"
#include "oh_common.h"

struct FooObject {
    int index;

    FooObject() {
        static int counter = 0;
        index = ++counter;
        std::cout << "FooObject() with index = " << index << std::endl;
    }
    ~FooObject() {
        std::cout << "~FooObject() with index = " << index << std::endl;
    }
};

OH_TEST_RECORD_FooHandle Foo_constructImpl() {
    std::cout << "Foo_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_RECORD_FooHandle>(new FooObject());
}

void Foo_destructImpl(OH_TEST_RECORD_FooHandle thiz) {
    std::cout << "Foo_destructImpl(thisPtr)" << std::endl;
    delete reinterpret_cast<FooObject*>(thiz);
}

Map_String_Number Foo_getPropsImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getPropsImpl(thisPtr)" << std::endl;
    constexpr size_t SIZE = 4;
    // TODO: How to handle dynamic-allocated maps?
    static OH_String keys[SIZE] = {
        {.chars = "one", .length = 4},
        {.chars = "two", .length = 4},
        {.chars = "three", .length = 6},
        {.chars = "four", .length = 5},
    };
    static OH_Number values[SIZE] = {
        {.tag = INTEROP_TAG_INT32, .i32 = 1},
        {.tag = INTEROP_TAG_FLOAT32, .f32 = 2.25},
        {.tag = INTEROP_TAG_INT32, .i32 = 3},
        {.tag = INTEROP_TAG_FLOAT32, .f32 = 4.125}
    };
    return Map_String_Number{.size = SIZE, .keys = keys, .values = values};
}

OH_TEST_RECORD_FooResult Foo_getResultImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getResultImpl(thisPtr)" << std::endl;
    static int counter = 0;
    constexpr size_t SIZE = 3;
    // TODO: How to handle dynamic-allocated maps?
    static OH_String keys[SIZE] = {
        {.chars = "ten", .length = 4},
        {.chars = "hundred", .length = 8},
        {.chars = "thousand", .length = 9},
    };
    static OH_Number values[SIZE] = {
        {.tag = INTEROP_TAG_INT32, .i32 = 10},
        {.tag = INTEROP_TAG_FLOAT32, .f32 = 99.875},
        {.tag = INTEROP_TAG_INT32, .i32 = 1000},
    };
    return OH_TEST_RECORD_FooResult{
        .index = {.tag = INTEROP_TAG_INT32, .i32 =  (counter += 42)},
        .props = {.size = SIZE, .keys = keys, .values = values}
    };
}
