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
#include "oh_common.h"

class FooInt {
public:
    OH_Number _num;
    FooInt(OH_Number num): _num(num) {}
};

OH_TEST_MODULES_STRUCT_FooIntHandle FooInt_constructImpl(const OH_Number* initialValue) {
    // can not return nullptr as instance!
    FooInt* instance = new FooInt(*initialValue);
    return reinterpret_cast<OH_TEST_MODULES_STRUCT_FooIntHandle>(instance);
}
void FooInt_destructImpl(OH_TEST_MODULES_STRUCT_FooIntHandle thiz) {
    FooInt* self = reinterpret_cast<FooInt*>(thiz);
    delete self;
}
OH_Number FooInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    FooInt* self = reinterpret_cast<FooInt*>(thisPtr);
    return addOHNumber(self->_num, *offset);
}
OH_Number FooInt_getValueImpl(OH_NativePointer thisPtr) {
    FooInt* self = reinterpret_cast<FooInt*>(thisPtr);
    return self->_num;
}
void FooInt_setValueImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    FooInt* self = reinterpret_cast<FooInt*>(thisPtr);
    self->_num = *value;
}
OH_Number GlobalScope_baz_getIntWithFooImpl(OH_TEST_MODULES_STRUCT_FooInt foo) {
    FooInt* fooInt = reinterpret_cast<FooInt*>(foo);
    return fooInt->_num;
}
OH_Number GlobalScope_baz_getIntWithBarImpl(const OH_TEST_MODULES_STRUCT_BarInt* bar) {
    FooInt* fooA = reinterpret_cast<FooInt*>(bar->fooA);
    FooInt* fooB = reinterpret_cast<FooInt*>(bar->fooB);
    return addOHNumber(fooA->_num, fooB->_num);
}
