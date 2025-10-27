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
#include "test_buffer.h"
#include "oh_common.h"
#include <cstring>

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

OH_TEST_BUFFER_FooHandle Foo_constructImpl() {
    std::cout << "Foo_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_BUFFER_FooHandle>(new FooObject());
}

void Foo_destructImpl(OH_TEST_BUFFER_FooHandle thiz) {
    std::cout << "Foo_destructImpl(thisPtr)" << std::endl;
    delete reinterpret_cast<FooObject*>(thiz);
}

OH_Buffer Foo_getInDataImpl(OH_NativePointer thisPtr) {
    std::cout << "Foo_getInDataImpl(thisPtr)" << std::endl;
    uint64_t data[4];
    std::fill_n(data, std::size(data), 0x0123'4567'89AB'CDEF);
    OH_Buffer res = MakeOHBuffer(sizeof(data));
    std::memcpy(res.data, data, sizeof(data));
    return res;
}

OH_TEST_BUFFER_FooResult Foo_getResultImpl(OH_NativePointer thisPtr) {
    static int counter = 0;
    counter += 100;
    std::cout << "Foo_getResultImpl(thisPtr)" << std::endl;
    OH_TEST_BUFFER_FooResult res;
    res.index = {.tag = INTEROP_TAG_INT32, .i32 = counter};
    uint32_t data[16];
    std::fill_n(data, std::size(data), 0x1234'5678);
    res.inData = MakeOHBuffer(sizeof(data));
    std::memcpy(res.inData.data, data, sizeof(data));
    return res;
}
