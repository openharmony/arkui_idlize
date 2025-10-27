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
#include "test_modules_multilevel_property.h"
#include "oh_common.h"
#include <cmath>
#include <iomanip>
#include <iostream>

// Native implementation of FooInt
struct MyFooInt {
    OH_Number value;
};

struct MyBarInt {
    MyFooInt x;
    MyFooInt y;
};

struct MyBazInt {
    MyFooInt foo;
    MyBarInt bar;
};

OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooIntHandle FooInt_constructImpl(const OH_Number* initialValue) {
    std::cout << "FooInt_constructImpl(initialValue)" << std::endl;
    MyFooInt* result = new MyFooInt();
    result->value = *initialValue;
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooIntHandle>(result);
}

void FooInt_destructImpl(OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooIntHandle thiz) {
    std::cout << "FooInt_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<MyFooInt*>(thiz);
}

OH_Number FooInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    auto* obj = reinterpret_cast<MyFooInt*>(thisPtr);
    std::cout << "FooInt_getIntImpl(thisPtr, offset)"
              << "\n  thisPtr->value = " << DumpOHNumber(obj->value)
              << "\n  offset = " << DumpOHNumber(*offset) << std::endl;
    return addOHNumber(obj->value, *offset);
}

OH_Number FooInt_getValueImpl(OH_NativePointer thisPtr) {
    auto* obj = reinterpret_cast<MyFooInt*>(thisPtr);
    std::cout << "FooInt_getValueImpl(thisPtr)"
              << "\n  thisPtr->value = " << DumpOHNumber(obj->value) << std::endl;
    return obj->value;
}

void FooInt_setValueImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    auto* obj = reinterpret_cast<MyFooInt*>(thisPtr);
    std::cout << "FooInt_setValueImpl(thisPtr, value)"
              << "\n  thisPtr->value = " << DumpOHNumber(obj->value)
              << "\n  offset = " << DumpOHNumber(*value) << std::endl;
    obj->value = *value;
}

OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarIntHandle BarInt_constructImpl(const OH_Number* vx, const OH_Number* vy) {
    std::cout << "BarInt_constructImpl(vx, vy)"
              << "\n  vx = " << DumpOHNumber(*vx)
              << "\n  vy = " << DumpOHNumber(*vy) << std::endl;
    MyBarInt* res = new MyBarInt();
    res->x.value = *vx;
    res->y.value = *vy;
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarIntHandle>(res);
}

void BarInt_destructImpl(OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarIntHandle thiz) {
    std::cout << "BarInt_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<MyBarInt*>(thiz);
}

OH_Number BarInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    std::cout << "BarInt_getIntImpl(thisPtr, offset)"
              << "\n  offset = " << DumpOHNumber(*offset) << std::endl;
    auto* obj = reinterpret_cast<MyBarInt*>(thisPtr);
    return addOHNumber(addOHNumber(obj->x.value, obj->y.value), *offset);
}

OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt BarInt_getXImpl(OH_NativePointer thisPtr) {
    std::cout << "BarInt_getXImpl(thisPtr)" << std::endl;
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt>(
        &reinterpret_cast<MyBarInt*>(thisPtr)->x);
}

void BarInt_setXImpl(OH_NativePointer thisPtr, OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt value) {
    std::cout << "BarInt_setXImpl(thisPtr, value)" << std::endl;
    auto* obj = reinterpret_cast<MyBarInt*>(thisPtr);
    obj->x = *reinterpret_cast<MyFooInt*>(value);
}

OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt BarInt_getYImpl(OH_NativePointer thisPtr) {
    std::cout << "BarInt_getYImpl(thisPtr)" << std::endl;
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt>(
        &reinterpret_cast<MyBarInt*>(thisPtr)->y);
}

void BarInt_setYImpl(OH_NativePointer thisPtr, OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt value) {
    std::cout << "BarInt_setYImpl(thisPtr, value)" << std::endl;
    auto* obj = reinterpret_cast<MyBarInt*>(thisPtr);
    obj->y = *reinterpret_cast<MyFooInt*>(value);
}

OH_TEST_MODULES_MULTILEVEL_PROPERTY_BazIntHandle BazInt_constructImpl(
        const OH_Number* f, const OH_Number* bx, const OH_Number* by) {
    std::cout << "BazInt_constructImpl(f, bx, by)"
              << "\n  f = " << DumpOHNumber(*f)
              << "\n  bx = " << DumpOHNumber(*bx)
              << "\n  by = " << DumpOHNumber(*by) << std::endl;
    MyBazInt* res = new MyBazInt();
    res->foo.value = *f;
    res->bar.x.value = *bx;
    res->bar.y.value = *by;
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_BazIntHandle>(res);
}

void BazInt_destructImpl(OH_TEST_MODULES_MULTILEVEL_PROPERTY_BazIntHandle thiz) {
    std::cout << "BazInt_destructImpl(thiz)" << std::endl;
    delete reinterpret_cast<MyBazInt*>(thiz);
}

OH_Number BazInt_getIntImpl(OH_NativePointer thisPtr, const OH_Number* offset) {
    std::cout << "BazInt_getIntImpl(thisPtr, offset)"
              << "\n  offset = " << DumpOHNumber(*offset) << std::endl;
    auto* obj = reinterpret_cast<MyBazInt*>(thisPtr);
    auto v1 = addOHNumber(obj->foo.value, obj->bar.x.value);
    auto v2 = addOHNumber(v1, obj->bar.y.value);
    auto v3 = addOHNumber(v2, *offset);
    return v3;
}

OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt BazInt_getFooImpl(OH_NativePointer thisPtr) {
    std::cout << "BazInt_getFooImpl(thisPtr)" << std::endl;
    auto* obj = reinterpret_cast<MyBazInt*>(thisPtr);
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt>(&obj->foo);
}

void BazInt_setFooImpl(OH_NativePointer thisPtr, OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt value) {
    std::cout << "BazInt_setFooImpl(thisPtr, value)" << std::endl;
    auto* obj = reinterpret_cast<MyBazInt*>(thisPtr);
    obj->foo = *reinterpret_cast<MyFooInt*>(value);
}

OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarInt BazInt_getBarImpl(OH_NativePointer thisPtr) {
    std::cout << "BazInt_getBarImpl(thisPtr)" << std::endl;
    auto* obj = reinterpret_cast<MyBazInt*>(thisPtr);
    return reinterpret_cast<OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarInt>(&obj->bar);
}

void BazInt_setBarImpl(OH_NativePointer thisPtr, OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarInt value) {
    std::cout << "BazInt_setBarImpl(thisPtr, value)" << std::endl;
    auto* obj = reinterpret_cast<MyBazInt*>(thisPtr);
    obj->bar = *reinterpret_cast<MyBarInt*>(value);
}

OH_Number GlobalScope_qux_getIntWithFooImpl(OH_TEST_MODULES_MULTILEVEL_PROPERTY_FooInt foo) {
    std::cout << "GlobalScope_qux_getIntWithFooImpl(foo)" << std::endl;
    MyFooInt* obj = reinterpret_cast<MyFooInt*>(foo);
    std::cout << "foo->value = " << DumpOHNumber(obj->value) << std::endl;
    return obj->value;
}
OH_Number GlobalScope_qux_getIntWithBarImpl(OH_TEST_MODULES_MULTILEVEL_PROPERTY_BarInt bar, const OH_Number* offset) {
    std::cout << "GlobalScope_qux_getIntWithBarImpl(bar, offset)"
              << "\n  offset = " << DumpOHNumber(*offset) << std::endl;
    MyBarInt* obj = reinterpret_cast<MyBarInt*>(bar);
    return addOHNumber(addOHNumber(obj->x.value, obj->y.value), *offset);
}
OH_Number GlobalScope_qux_getIntWithBazImpl(
        OH_TEST_MODULES_MULTILEVEL_PROPERTY_BazInt baz, const OH_Number* offset, const OH_String* message) {
    std::cout << "GlobalScope_qux_getIntWithBazImpl(baz, offset, message)"
              << "\n  offset = " << DumpOHNumber(*offset)
              << "\n  message = " << DumpOHString(*message) << std::endl;
    auto* obj = reinterpret_cast<MyBazInt*>(baz);
    auto v1 = addOHNumber(obj->foo.value, obj->bar.x.value);
    auto v2 = addOHNumber(v1, obj->bar.y.value);
    auto v3 = addOHNumber(v2, *offset);
    return v3;
}
