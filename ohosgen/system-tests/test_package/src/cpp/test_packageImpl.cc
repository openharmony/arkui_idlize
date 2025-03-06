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
#include "test_package.h"
#include "oh_common.h"

struct FooObject {
    OH_Number value;

    FooObject() {
        static int counter = 0;
        this->value.tag = INTEROP_TAG_INT32;
        this->value.i32 = ++counter;
    }
};

struct BarObject {
    FooObject foo;
};

OH_TEST_PACKAGE_BarObjectHandle BarObject_constructImpl() {
    std::cout << "BarObject_constructImpl()" << std::endl;
    BarObject* bar = new BarObject();
    return reinterpret_cast<OH_TEST_PACKAGE_BarObjectHandle>(bar);
}

void BarObject_destructImpl(OH_TEST_PACKAGE_BarObjectHandle thiz) {
    std::cout << "BarObject_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<BarObject*>(thiz);
}

void BarObject_echoImpl(OH_NativePointer thisPtr, const OH_String* str) {
    std::cout << "BarObject_echoImpl(thisPtr, str)"
              << "\n  str = " << DumpOHString(*str) << std::endl;
}

OH_Int32 BarObject_toInt32Impl(OH_NativePointer thisPtr) {
    std::cout << "BarObject_toInt32Impl(thisPtr)" << std::endl;
    return reinterpret_cast<BarObject*>(thisPtr)->foo.value.i32;
}

OH_TEST_PACKAGE_FooObject BarObject_getFooObjImpl(OH_NativePointer thisPtr) {
    std::cout << "BarObject_getFooObjImpl(thisPtr)" << std::endl;
    return reinterpret_cast<OH_TEST_PACKAGE_FooObject>(
        &reinterpret_cast<BarObject*>(thisPtr)->foo);
}

void BarObject_setFooObjImpl(OH_NativePointer thisPtr, OH_TEST_PACKAGE_FooObject value) {
    std::cout << "BarObject_setFooObjImpl(thisPtr, value)" << std::endl;
    reinterpret_cast<BarObject*>(thisPtr)->foo = *reinterpret_cast<FooObject*>(value);
}

OH_TEST_PACKAGE_FooObjectHandle FooObject_constructImpl() {
    std::cout << "FooObject_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_PACKAGE_FooObjectHandle>(new FooObject());
}

void FooObject_destructImpl(OH_TEST_PACKAGE_FooObjectHandle thiz) {
    std::cout << "FooObject_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<FooObject*>(thiz);
}

void FooObject_echoImpl(OH_NativePointer thisPtr, const OH_String* str) {
    std::cout << "FooObject_echoImpl(thisPtr, str)"
              << "\n  str = " << DumpOHString(*str) << std::endl;
}

OH_Int32 FooObject_toInt32Impl(OH_NativePointer thisPtr) {
    std::cout << "FooObject_toInt32Impl(thisPtr)" << std::endl;
    return reinterpret_cast<FooObject*>(thisPtr)->value.i32;
}
