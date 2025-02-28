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
#include "unit.h"

#include <iostream>
#include <string.h>

OH_UNIT_TestListenerHandle TestListener_constructImpl() {
    return {};
}
void TestListener_destructImpl(OH_UNIT_TestListenerHandle thiz) {
}
void TestListener_onUpdateImpl(OH_NativePointer thisPtr, const UNIT_Callback_TestResult_Void* callback_) {
}
OH_UNIT_HelloHandle Hello_constructImpl() {
    return {};
}
void Hello_destructImpl(OH_UNIT_HelloHandle thiz) {
}
void Hello_helloImpl(OH_NativePointer thisPtr, const OH_UNIT_HelloType* value) {
}
OH_UNIT_InterfaceWithMethodsHandle InterfaceWithMethods_constructImpl() {
    return {};
}
void InterfaceWithMethods_destructImpl(OH_UNIT_InterfaceWithMethodsHandle thiz) {
}
OH_Boolean InterfaceWithMethods_isUsedImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
OH_Boolean InterfaceWithMethods_getPropBooleanImpl(OH_NativePointer thisPtr) {
    return {};
}
void InterfaceWithMethods_setPropBooleanImpl(OH_NativePointer thisPtr, OH_Boolean value) {
}
OH_Number InterfaceWithMethods_getPropNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
void InterfaceWithMethods_setPropNumberImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
OH_UNIT_PersonInfoHandle PersonInfo_constructImpl() {
    return {};
}
void PersonInfo_destructImpl(OH_UNIT_PersonInfoHandle thiz) {
}
OH_Number PersonInfo_MyfuncImpl(OH_NativePointer thisPtr, const OH_Number* a) {
    return {};
}
OH_String PersonInfo_getNameImpl(OH_NativePointer thisPtr) {
    return {};
}
void PersonInfo_setNameImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_Number PersonInfo_getAgeImpl(OH_NativePointer thisPtr) {
    return {};
}
void PersonInfo_setAgeImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
OH_UNIT_MyPersonHandlerHandle MyPersonHandler_constructImpl() {
    return {};
}
void MyPersonHandler_destructImpl(OH_UNIT_MyPersonHandlerHandle thiz) {
}
OH_Number MyPersonHandler_Myfunc10Impl(OH_NativePointer thisPtr, const OH_Number* a, const Opt_PersonInfo* b) {
    return {};
}
OH_Number MyPersonHandler_Myfunc11Impl(OH_NativePointer thisPtr, const OH_Number* a, const Array_PersonInfo* b) {
    return {};
}
OH_Number MyPersonHandler_Myfunc12Impl(OH_NativePointer thisPtr, OH_UNIT_PersonInfo a) {
    return {};
}
void MyPersonHandler_MyFunc20Impl(OH_NativePointer thisPtr, const OH_Number* b, const Opt_Boolean* c) {
}
void MyPersonHandler_MyFunc21Impl(OH_NativePointer thisPtr, const OH_Number* b, const Opt_String* c) {
}
void MyPersonHandler_MyFunc22Impl(OH_NativePointer thisPtr, const OH_Number* b, const Opt_Number* c) {
}
void MyPersonHandler_MyFunc3Impl(OH_NativePointer thisPtr, OH_UNIT_PersonInfo a) {
}
OH_UNIT_BufferGeneratorHandle BufferGenerator_constructImpl() {
    return {};
}
void BufferGenerator_destructImpl(OH_UNIT_BufferGeneratorHandle thiz) {
}
OH_Buffer BufferGenerator_giveMeBufferImpl(OH_NativePointer thisPtr) {
    return {};
}

void stub_hold(OH_Int32 resourceId) {}
OH_UNIT_TestValue GlobalScope_test_buffer_getBufferImpl() {
    std::cout << "Return buffer from getBufferImpl"<< std::endl;
    OH_UNIT_TestValue result{};
    result.errorCode = {.tag = INTEROP_TAG_INT32, .i32 = 123 };
    result.outData.resource.hold = stub_hold;
    result.outData.resource.release = stub_hold;
    result.outData.data = strdup("1234");
    result.outData.length = strlen("1234");
    return result;
}

OH_Number GlobalScope_test_buffer_sumImpl(const OH_Number* v1, const OH_Number* v2) {
    OH_Number number;
    number.tag = InteropTag::INTEROP_TAG_INT32;
    number.i32 = v1->i32 + v2->i32;
    return number;
}
