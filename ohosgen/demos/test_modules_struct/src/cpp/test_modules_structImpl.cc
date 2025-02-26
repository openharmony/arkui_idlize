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

OH_TEST_MODULES_STRUCT_FooIntHandle FooInt_constructImpl(const OH_Number* initialValue) {
    return {};
}
void FooInt_destructImpl(OH_TEST_MODULES_STRUCT_FooIntHandle thiz) {
}
OH_Number FooInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    return {};
}
OH_Number FooInt_getValueImpl(OH_NativePointer thisPtr) {
    return {};
}
void FooInt_setValueImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
OH_Number GlobalScope_baz_baz_getIntWithFooImpl(OH_TEST_MODULES_STRUCT_FooInt foo) {
    return {};
}
OH_Number GlobalScope_baz_baz_getIntWithBarImpl(const OH_TEST_MODULES_STRUCT_BarInt* bar) {
    return {};
}
