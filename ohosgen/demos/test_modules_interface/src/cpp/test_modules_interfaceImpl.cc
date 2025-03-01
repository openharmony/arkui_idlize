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
#include "test_modules_interface.h"
#include "oh_common.h"

struct IFooIntDummy {
    std::string dummyHintStr = "Well... how do we deal with this dummy IFooInt instantiation?";

    IFooIntDummy() {
        std::cout << "UNEXPECTED: IFooInt is instantiated in C++." << std::endl;
    }
    ~IFooIntDummy() {
        std::cout << "UNEXPECTED: IFooInt is destructed in C++." << std::endl;
    }
};

OH_TEST_MODULES_INTERFACE_IFooIntHandle IFooInt_constructImpl() {
    std::cout << "UNEXPECTED: IFooInt_constructImpl()" << std::endl;
    return reinterpret_cast<OH_TEST_MODULES_INTERFACE_IFooIntHandle>(new IFooIntDummy());
}

void IFooInt_destructImpl(OH_TEST_MODULES_INTERFACE_IFooIntHandle thiz) {
    std::cout << "UNEXPECTED: IFooInt_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<IFooIntDummy*>(thiz);
}

OH_Number IFooInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* x) {
    std::cout << "UNEXPECTED: IFooInt_getIntImpl(thisPtr, x)"
              << "\n  x = " << DumpOHNumber(*x) << std::endl;
    return *x;
}

OH_Number GlobalScope_bar_getIntWithFooImpl(const OH_Number* x, OH_TEST_MODULES_INTERFACE_IFooInt foo) {
    std::cout << "GlobalScope_bar_bar_getIntWithFooImpl(x, foo)"
              << "\n  x = " << DumpOHNumber(*x) << std::endl;
    IFooIntDummy* obj = reinterpret_cast<IFooIntDummy*>(foo);
    std::cout << obj->dummyHintStr << std::endl;
    OH_Number res = {.tag = INTEROP_TAG_FLOAT32, .f32 = NAN};
    return res;
}
