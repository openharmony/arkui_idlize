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

#define CALLBACK_HOLD(instance, callback) instance.callback.resource.hold(instance.callback.resource.resourceId);
#define CALLBACK_RELEASE(instance, callback) instance.callback.resource.release(instance.callback.resource.resourceId);

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
OH_UNIT_BufferGeneratorHandle BufferGenerator_constructImpl() {
    return {};
}
void BufferGenerator_destructImpl(OH_UNIT_BufferGeneratorHandle thiz) {
}
OH_Buffer BufferGenerator_giveMeBufferImpl(OH_NativePointer thisPtr) {
    return {};
}

void stub_hold(OH_Int32 resourceId) {}
void stub_release(OH_Int32 resourceId) {}

OH_UNIT_TestValue GlobalScope_test_buffer_getBufferImpl() {
    std::cout << "Return buffer from getBufferImpl"<< std::endl;
    OH_UNIT_TestValue result{};
    result.errorCode = {.tag = INTEROP_TAG_INT32, .i32 = 123 };
    result.outData.resource.hold = stub_hold;
    result.outData.resource.release = stub_release;
    result.outData.data = strdup("1234");
    result.outData.length = strlen("1234");
    return result;
}

// Force Callback

class ForceCallbackClassPeer {};
static OH_UNIT_ForceCallbackListener forceCallbackListener = {};

OH_UNIT_ForceCallbackClassHandle ForceCallbackClass_constructImpl() {
        return (OH_UNIT_ForceCallbackClassHandle) new ForceCallbackClassPeer();
}

void ForceCallbackClass_destructImpl(OH_UNIT_ForceCallbackClassHandle thiz) {
}
void ForceCallbackClass_registerListenerImpl(OH_NativePointer thisPtr, const OH_UNIT_ForceCallbackListener* listener) {
    forceCallbackListener = *listener;
    CALLBACK_HOLD(forceCallbackListener, onStatus)
    CALLBACK_HOLD(forceCallbackListener, onChange)
}

void forceCallbackOnChangeCallContinuation(const OH_Int32 resourceId, const OH_String value) {
    printf("forceCallbackOnChangeContinuation is called!\n");
}

void forceCallbackOnChangeCallSyncContinuation(OH_UNIT_VMContext context, const OH_Int32 resourceId, const OH_String value) {
    printf("forceCallbackOnChangeCallSyncContinuation is called!\n");
}

OH_Number ForceCallbackClass_callListenerImpl(OH_NativePointer thisPtr) {
    OH_Number number = {.tag = INTEROP_TAG_INT32, .i32 = 123456};
    // onStatus call
    forceCallbackListener.onStatus.call(forceCallbackListener.onStatus.resource.resourceId, number);

    // onChange call
    OH_UNIT_CallbackResource resource = { .resourceId = 12, .hold = stub_hold, .release = stub_release};

    UNIT_Callback_String_Void continuation = {
        .resource = resource,
        .call = forceCallbackOnChangeCallContinuation,
        .callSync = forceCallbackOnChangeCallSyncContinuation,
    };

    forceCallbackListener.onChange.call(
        forceCallbackListener.onChange.resource.resourceId,
        true,
        {.tag = INTEROP_TAG_INT32, .i32 = 78910},
        continuation
    );

    // release callbacks
    CALLBACK_RELEASE(forceCallbackListener, onStatus)
    CALLBACK_RELEASE(forceCallbackListener, onChange)
    return {.tag = INTEROP_TAG_INT32, .i32 = 101};
}

OH_UNIT_GenericInterfaceHandle GenericInterface_constructImpl() {
    return {};
}
void GenericInterface_destructImpl(OH_UNIT_GenericInterfaceHandle thisPtr) {
}
void GenericInterface_setDataImpl(OH_NativePointer thisPtr, const OH_CustomObject* data) {
}
void GenericInterface_callHandlerImpl(OH_NativePointer thisPtr) {
}

void GlobalScope_registerForceCallbackListenerImpl(const OH_UNIT_ForceCallbackListener* listener) {
}
OH_Number GlobalScope_callForceCallbackListenerImpl() {
    return {.tag = INTEROP_TAG_INT32, .i32 = 102};
}

// OH_Boolean
OH_Boolean GlobalScope_and_valuesImpl(OH_Boolean v1, OH_Boolean v2) {
    return v1 && v2;
}

// OH_Number

OH_Number GlobalScope_sum_numbersImpl(const OH_Number* v1, const OH_Number* v2) {

    switch(v1->tag) {
        case InteropTag::INTEROP_TAG_INT32: {
            switch(v2 -> tag) {
                case InteropTag::INTEROP_TAG_INT32:
                    return {.tag = InteropTag::INTEROP_TAG_INT32, .i32 = v1->i32 + v2->i32};
                case InteropTag::INTEROP_TAG_FLOAT32:
                    return {.tag = InteropTag::INTEROP_TAG_FLOAT32, .f32 = v1->i32 + v2->f32};
                }
        case InteropTag::INTEROP_TAG_FLOAT32: {
            switch(v2 -> tag) {
                case InteropTag::INTEROP_TAG_INT32:
                    return {.tag = InteropTag::INTEROP_TAG_FLOAT32, .f32 = v1->f32 + v2->i32};
                case InteropTag::INTEROP_TAG_FLOAT32:
                    return {.tag = InteropTag::INTEROP_TAG_FLOAT32, .f32 = v1->f32 + v2->f32};
                }
            }
        }
    }
    INTEROP_FATAL("Unknown args tags v1: %d, v2: %d\n", v1->tag, v2->tag);
}

struct UNIT_ClassWithPrimitivePropertyTypePeer {
    OH_Boolean f;
    OH_Number c;
};

OH_UNIT_ClassWithPrimitivePropertyTypeHandle ClassWithPrimitivePropertyType_constructImpl(OH_Boolean f, const OH_Number* c) {
    return reinterpret_cast<OH_UNIT_ClassWithPrimitivePropertyTypeHandle>(
        new UNIT_ClassWithPrimitivePropertyTypePeer({f, *c})
    );
}

void ClassWithPrimitivePropertyType_destructImpl(OH_UNIT_ClassWithPrimitivePropertyTypeHandle thisPtr) {
    delete reinterpret_cast<UNIT_ClassWithPrimitivePropertyTypePeer *>(thisPtr);
}

OH_Boolean ClassWithPrimitivePropertyType_getFlagImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<const UNIT_ClassWithPrimitivePropertyTypePeer *>(thisPtr)->f;
}

void ClassWithPrimitivePropertyType_setFlagImpl(OH_NativePointer thisPtr, OH_Boolean value) {
    reinterpret_cast<UNIT_ClassWithPrimitivePropertyTypePeer *>(thisPtr)->f = value;
}

OH_Number ClassWithPrimitivePropertyType_getCounterImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<const UNIT_ClassWithPrimitivePropertyTypePeer *>(thisPtr)->c;
}

void ClassWithPrimitivePropertyType_setCounterImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    reinterpret_cast<UNIT_ClassWithPrimitivePropertyTypePeer *>(thisPtr)->c = *value;
}

OH_Boolean GlobalScope_MyFunc1Impl(const OH_UNIT_Union_MyNamespace_MyEnum1_MyNamespace_MyEnum2* a) {
    return {};
}
OH_Boolean GlobalScope_MyFunc2Impl(const Map_String_MyInterface* a) {
    return {};
}

// Enums
OH_UNIT_OrdinaryEnum GlobalScope_checkOrdinaryEnumsImpl(OH_UNIT_OrdinaryEnum value1, OH_UNIT_OrdinaryEnum value2) {
    printf("value1: %d, expected: %d\n", value1, OH_UNIT_ORDINARY_ENUM_E1);
    if (value1 != OH_UNIT_ORDINARY_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equeal OH_UNIT_ORDINARY_ENUM_E1: %d", value1, OH_UNIT_ORDINARY_ENUM_E1);
    }
    return OH_UNIT_ORDINARY_ENUM_E2;
}

OH_UNIT_IDLOrdinaryEnum GlobalScope_idlCheckOrdinaryEnumsImpl(OH_UNIT_IDLOrdinaryEnum value1, OH_UNIT_IDLOrdinaryEnum value2) {
    printf("value1: %d, expected: %d\n", value1, OH_UNIT_IDLORDINARY_ENUM_E1);
    if (value1 != OH_UNIT_IDLORDINARY_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equeal OH_UNIT_ORDINARY_ENUM_E1: %d", value1, OH_UNIT_IDLORDINARY_ENUM_E1);
    }
    return OH_UNIT_IDLORDINARY_ENUM_E2;
}
