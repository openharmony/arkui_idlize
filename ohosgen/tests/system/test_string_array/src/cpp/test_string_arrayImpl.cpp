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
#include "test_string_array.h"
#include "oh_common.h"
#include <cstring>
#include <string>

struct FooObject {
    int index;

    FooObject() {
        static int counter = 0;
        index = ++counter;
        std::cout << "FooObject() with index = " << index << std::endl;
    }

    std::string MakeTitle() const {
        static int counter = 0;
        return "'FooObject{.index = " + std::to_string(index)
            + "}' (call counter = " + std::to_string(++counter) + ")";
    }
};

OH_TEST_STRING_ARRAY_FooHandle Foo_constructImpl() {
    std::cout << "Foo_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_STRING_ARRAY_FooHandle>(new FooObject());
}

void Foo_destructImpl(OH_TEST_STRING_ARRAY_FooHandle thiz) {
    std::cout << "Foo_destructImpl(thisPtr)" << std::endl;
    delete reinterpret_cast<FooObject*>(thiz);
}

namespace {
OH_String getOHString(FooObject* obj) {
    std::string resStr = obj->MakeTitle();
    // todo: Potential MEMORY LEAK with dynamically allocated string data
    char* chars = new char[resStr.length() + 1];
    std::memcpy(chars, resStr.data(), resStr.length() + 1);
    OH_String res = {.chars = chars, .length = resStr.length() + 1};
    return res;
}
}

OH_String Foo_getStringImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getStringImpl(thisPtr)" << std::endl;
    FooObject* obj = reinterpret_cast<FooObject*>(thisPtr);
    return getOHString(obj);
}

Array_String Foo_getStringListImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getStringListImpl(thisPtr)" << std::endl;
    // todo: How to deal with dynamically created results?
    static OH_String fixedResult[3] = {
        {.chars = "Apple", .length = 6},
        {.chars = "Pineapple", .length = 10},
        {.chars = "Banana", .length = 7},
    };
    return Array_String{.array = fixedResult, .length = std::size(fixedResult)};
}

OH_TEST_STRING_ARRAY_FooResult Foo_getResultImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getResultImpl(thisPtr)" << std::endl;
    FooObject* obj = reinterpret_cast<FooObject*>(thisPtr);
    OH_TEST_STRING_ARRAY_FooResult result;
    result.index = OH_Number{.tag = INTEROP_TAG_INT32, .i32 = obj->index};
    result.title = getOHString(obj);
    // todo: How to deal with dynamically created results?
    static OH_String fixedResult[4] = {
        {.chars = "Red", .length = 4},
        {.chars = "Green", .length = 6},
        {.chars = "Blue", .length = 5},
        {.chars = "Orange", .length = 7}
    };
    result.list = Array_String{.array = fixedResult, .length = std::size(fixedResult)};
    return result;
}
