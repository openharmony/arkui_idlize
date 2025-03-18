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

OH_UNIT_HelloHandle Hello_constructImpl()
{
    return {};
}
void Hello_destructImpl(OH_UNIT_HelloHandle thiz)
{
}
void Hello_helloImpl(OH_NativePointer thisPtr, const OH_UNIT_HelloType *value)
{
}

/// InterfaceWithMethods real implementations

OH_UNIT_InterfaceWithMethodsHandle InterfaceWithMethods_constructImpl()
{
    return {};
}
void InterfaceWithMethods_destructImpl(OH_UNIT_InterfaceWithMethodsHandle thiz)
{
}
OH_Boolean InterfaceWithMethods_isUsedImpl(OH_NativePointer thisPtr, const OH_Number *value)
{
    return {};
}
OH_Boolean InterfaceWithMethods_getPropBooleanImpl(OH_NativePointer thisPtr)
{
    return {};
}
void InterfaceWithMethods_setPropBooleanImpl(OH_NativePointer thisPtr, OH_Boolean value)
{
}
OH_Number InterfaceWithMethods_getPropNumberImpl(OH_NativePointer thisPtr)
{
    return {};
}
void InterfaceWithMethods_setPropNumberImpl(OH_NativePointer thisPtr, const OH_Number *value)
{
}

/// PersonInfo real implementations

OH_UNIT_PersonInfoHandle PersonInfo_constructImpl()
{
    return {};
}
void PersonInfo_destructImpl(OH_UNIT_PersonInfoHandle thiz)
{
}
OH_Number PersonInfo_MyfuncImpl(OH_NativePointer thisPtr, const OH_Number *a)
{
    return {};
}
OH_String PersonInfo_getNameImpl(OH_NativePointer thisPtr)
{
    return {};
}
void PersonInfo_setNameImpl(OH_NativePointer thisPtr, const OH_String *value)
{
}
OH_Number PersonInfo_getAgeImpl(OH_NativePointer thisPtr)
{
    return {};
}
void PersonInfo_setAgeImpl(OH_NativePointer thisPtr, const OH_Number *value)
{
}

/// MyPersonHandler real implementations

OH_UNIT_MyPersonHandlerHandle MyPersonHandler_constructImpl()
{
    return {};
}
void MyPersonHandler_destructImpl(OH_UNIT_MyPersonHandlerHandle thiz)
{
}
OH_Number MyPersonHandler_Myfunc10Impl(OH_NativePointer thisPtr, const OH_Number *a, const Opt_PersonInfo *b)
{
    return {};
}
OH_Number MyPersonHandler_Myfunc11Impl(OH_NativePointer thisPtr, const OH_Number *a, const Array_PersonInfo *b)
{
    return {};
}
OH_Number MyPersonHandler_Myfunc12Impl(OH_NativePointer thisPtr, OH_UNIT_PersonInfo a)
{
    return {};
}
void MyPersonHandler_MyFunc20Impl(OH_NativePointer thisPtr, const OH_Number *b, const Opt_Boolean *c)
{
}
void MyPersonHandler_MyFunc21Impl(OH_NativePointer thisPtr, const OH_Number *b, const Opt_String *c)
{
}
void MyPersonHandler_MyFunc22Impl(OH_NativePointer thisPtr, const OH_Number *b, const Opt_Number *c)
{
}

/// BufferGenerator

OH_UNIT_TestBuffer_BufferGeneratorHandle TestBuffer_BufferGenerator_constructImpl()
{
    return {};
}
void TestBuffer_BufferGenerator_destructImpl(OH_UNIT_TestBuffer_BufferGeneratorHandle thiz)
{
}
OH_Buffer TestBuffer_BufferGenerator_giveMeBufferImpl(OH_NativePointer thisPtr)
{
    return {};
}

void stub_hold(OH_Int32 resourceId) {}
void stub_release(OH_Int32 resourceId) {}

// TBD: wait for the interface FQN fix for ArkTS
/*
OH_UNIT_test_buffer_TestValue GlobalScope_test_buffer_getBufferImpl()
{
    std::cout << "Return buffer from getBufferImpl"<< std::endl;
    OH_UNIT_test_buffer_TestValue result{};
    result.errorCode = {.tag = INTEROP_TAG_INT32, .i32 = 123 };
    result.outData.resource.hold = stub_hold;
    result.outData.resource.release = stub_release;
    result.outData.data = strdup("1234");
    result.outData.length = strlen("1234");
    return result;
}
*/
// Force Callback real implementations

class ForceCallbackClassPeer
{
};
static OH_UNIT_ForceCallbackListener forceCallbackListener = {};

OH_UNIT_ForceCallbackClassHandle ForceCallbackClass_constructImpl()
{
    return (OH_UNIT_ForceCallbackClassHandle) new ForceCallbackClassPeer();
}

void ForceCallbackClass_destructImpl(OH_UNIT_ForceCallbackClassHandle thiz)
{
}
void ForceCallbackClass_registerListenerImpl(OH_NativePointer thisPtr, const OH_UNIT_ForceCallbackListener *listener)
{
    forceCallbackListener = *listener;
    CALLBACK_HOLD(forceCallbackListener, onStatus)
    CALLBACK_HOLD(forceCallbackListener, onChange)
}

void forceCallbackOnChangeCallContinuation(const OH_Int32 resourceId, const OH_String value)
{
    printf("forceCallbackOnChangeContinuation is called!\n");
}

void forceCallbackOnChangeCallSyncContinuation(OH_UNIT_VMContext context, const OH_Int32 resourceId, const OH_String value)
{
    printf("forceCallbackOnChangeCallSyncContinuation is called!\n");
}

OH_Number ForceCallbackClass_callListenerImpl(OH_NativePointer thisPtr)
{
    OH_Number number = {.tag = INTEROP_TAG_INT32, .i32 = 123456};
    // onStatus call
    forceCallbackListener.onStatus.call(forceCallbackListener.onStatus.resource.resourceId, number);

    // onChange call
    OH_UNIT_CallbackResource resource = {.resourceId = 12, .hold = stub_hold, .release = stub_release};

    UNIT_Callback_String_Void continuation = {
        .resource = resource,
        .call = forceCallbackOnChangeCallContinuation,
        .callSync = forceCallbackOnChangeCallSyncContinuation,
    };

    forceCallbackListener.onChange.call(
        forceCallbackListener.onChange.resource.resourceId,
        true,
        {.tag = INTEROP_TAG_INT32, .i32 = 78910},
        continuation);

    // release callbacks
    CALLBACK_RELEASE(forceCallbackListener, onStatus)
    CALLBACK_RELEASE(forceCallbackListener, onChange)
    return {.tag = INTEROP_TAG_INT32, .i32 = 101};
}

/// GenericInterface

OH_UNIT_GenericInterfaceHandle GenericInterface_constructImpl()
{
    return {};
}
void GenericInterface_destructImpl(OH_UNIT_GenericInterfaceHandle thisPtr)
{
}
void GenericInterface_setDataImpl(OH_NativePointer thisPtr, const OH_CustomObject *data)
{
}
void GenericInterface_callHandlerImpl(OH_NativePointer thisPtr)
{
}

void GlobalScope_registerForceCallbackListenerImpl(const OH_UNIT_ForceCallbackListener *listener)
{
}
OH_Number GlobalScope_callForceCallbackListenerImpl()
{
    return {.tag = INTEROP_TAG_INT32, .i32 = 102};
}

// OH_Boolean
OH_Boolean GlobalScope_and_valuesImpl(OH_Boolean v1, OH_Boolean v2)
{
    return v1 && v2;
}

// OH_Number

OH_Number GlobalScope_sum_numbersImpl(const OH_Number *v1, const OH_Number *v2)
{

    switch (v1->tag)
    {
    case InteropTag::INTEROP_TAG_INT32:
    {
        switch (v2->tag)
        {
        case InteropTag::INTEROP_TAG_INT32:
            return {.tag = InteropTag::INTEROP_TAG_INT32, .i32 = v1->i32 + v2->i32};
        case InteropTag::INTEROP_TAG_FLOAT32:
            return {.tag = InteropTag::INTEROP_TAG_FLOAT32, .f32 = v1->i32 + v2->f32};
        }
    case InteropTag::INTEROP_TAG_FLOAT32:
    {
        switch (v2->tag)
        {
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

/// ClassWithPrimitivePropertyType real implementations

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

// Enums
OH_UNIT_OrdinaryEnum GlobalScope_checkOrdinaryEnumsImpl(OH_UNIT_OrdinaryEnum value1, OH_UNIT_OrdinaryEnum value2) {
    // printf("value1: %d, expected: %d\n", value1, OH_UNIT_ORDINARY_ENUM_E1);
    if (value1 != OH_UNIT_ORDINARY_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equeal OH_UNIT_ORDINARY_ENUM_E1: %d", value1, OH_UNIT_ORDINARY_ENUM_E1);
    }
    return OH_UNIT_ORDINARY_ENUM_E2;
}

OH_UNIT_IntEnum GlobalScope_checkIntEnumsImpl(OH_UNIT_IntEnum value1, OH_UNIT_IntEnum value2) {
    // printf("value2: %d, expected: %d\n", value2, OH_UNIT_INT_ENUM_E3);
    if (value2 != OH_UNIT_INT_ENUM_E3) {
        INTEROP_FATAL("Enum param value2 %d does not equeal OH_UNIT_INT_ENUM_E3: %d", value1, OH_UNIT_INT_ENUM_E3);
    }
    return OH_UNIT_INT_ENUM_E5;
}

OH_UNIT_StringEnum GlobalScope_checkStringEnumsImpl(OH_UNIT_StringEnum value1, OH_UNIT_StringEnum value2) {
    if (value1 != OH_UNIT_STRING_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equeal OH_UNIT_STRING_ENUM_E1: %d", value1, OH_UNIT_STRING_ENUM_E1);
    }
    // printf("Return enum OH_UNIT_STRING_ENUM_E2: %d\n", OH_UNIT_STRING_ENUM_E2);
    return OH_UNIT_STRING_ENUM_E2;
}

OH_UNIT_IDLOrdinaryEnum GlobalScope_idlCheckOrdinaryEnumsImpl(OH_UNIT_IDLOrdinaryEnum value1, OH_UNIT_IDLOrdinaryEnum value2) {
    // printf("value1: %d, expected: %d\n", value1, OH_UNIT_IDLORDINARY_ENUM_E1);
    if (value1 != OH_UNIT_IDLORDINARY_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equeal OH_UNIT_ORDINARY_ENUM_E1: %d", value1, OH_UNIT_IDLORDINARY_ENUM_E1);
    }
    return OH_UNIT_IDLORDINARY_ENUM_E2;
}

OH_UNIT_IDLIntEnum GlobalScope_idlCheckIntEnumsImpl(OH_UNIT_IDLIntEnum value1, OH_UNIT_IDLIntEnum value2) {
    // printf("value2: %d, expected: %d\n", value2, OH_UNIT_IDLINT_ENUM_E3);
    if (value2 != OH_UNIT_IDLINT_ENUM_E3) {
        INTEROP_FATAL("Enum param value2 %d does not equeal OH_UNIT_INT_ENUM_E3: %d", value1, OH_UNIT_IDLINT_ENUM_E3);
    }
    return OH_UNIT_IDLINT_ENUM_E5;
}

OH_UNIT_IDLStringEnum GlobalScope_idlCheckStringEnumsImpl(OH_UNIT_IDLStringEnum value1, OH_UNIT_IDLStringEnum value2) {
    if (value1 != OH_UNIT_IDLSTRING_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equeal OH_UNIT_STRING_ENUM_E1: %d", value1, OH_UNIT_IDLSTRING_ENUM_E1);
    }
    // printf("Return enum OH_UNIT_STRING_ENUM_E2: %d\n", OH_UNIT_IDLSTRING_ENUM_E2);
    return OH_UNIT_IDLSTRING_ENUM_E2;
}


// Data object tests

#define DATA_OBJECT_TEST(entityName) \
    OH_UNIT_##entityName result; \
    result.propBoolean = !arg->propBoolean; \
    result.propNumber = arg->propNumber; \
    if (arg->propNumber.tag == InteropTag::INTEROP_TAG_INT32) \
        result.propNumber.i32 += 1; \
    else \
        result.propNumber.f32 += 1; \
    result.propString = arg->propString; \
    result.propString.chars++; \
    result.propString.length--; \
    result.propObject = arg->propObject; \
    result.propObject.value0 = !arg->propObject.value0; \
    if (arg->propObject.value1.tag == InteropTag::INTEROP_TAG_INT32) \
        result.propObject.value1.i32 = -arg->propObject.value1.i32; \
    else \
        result.propObject.value1.f32 = -arg->propObject.value1.f32; \
    result.propObject.value2.chars = arg->propObject.value2.chars + 6; \
    result.propObject.value2.length = arg->propObject.value2.length - 6; \
    return result;

OH_UNIT_DataInterface GlobalScope_testDataInterfaceImpl(const OH_UNIT_DataInterface* arg) {
    DATA_OBJECT_TEST(DataInterface)
}
OH_UNIT_DataClass GlobalScope_testDataClassImpl(const OH_UNIT_DataClass* arg) {
    DATA_OBJECT_TEST(DataClass)
}
OH_UNIT_IDLDataInterface GlobalScope_testIDLDataInterfaceImpl(const OH_UNIT_IDLDataInterface* arg) {
    DATA_OBJECT_TEST(IDLDataInterface)
}
OH_UNIT_IDLDataClass GlobalScope_testIDLDataClassImpl(const OH_UNIT_IDLDataClass* arg) {
    DATA_OBJECT_TEST(IDLDataClass)
}

// "StaticMaterialized" class implementation
void test_materialized_classes_StaticMaterialized_methodImpl(const OH_Number *valNumber, const OH_String *valString) {
    printf("static method of static materialized class usage!! Got: %d, %s\n", valNumber->i32, valString->chars);
}

// "Materialized" class implementation with overloaded methods
struct UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer {
    void method1(OH_Boolean valBoolean = true, OH_String valString = {.chars = "hi", .length = 2}) {
        printf("method1. Got boolean - %i, string - %s.\n", valBoolean, valString.chars);
    };
};
OH_UNIT_test_materialized_classes_MaterializedOverloadedMethodsHandle test_materialized_classes_MaterializedOverloadedMethods_constructImpl() {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedOverloadedMethodsHandle>(
        new UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer({})
    );
}
void test_materialized_classes_MaterializedOverloadedMethods_destructImpl(OH_UNIT_test_materialized_classes_MaterializedOverloadedMethodsHandle thisPtr) {
    delete reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedOverloadedMethodsHandle*>(thisPtr);
}
void test_materialized_classes_MaterializedOverloadedMethods_method10Impl(OH_NativePointer thisPtr, OH_Boolean valBoolean, const OH_String* valString) {
    reinterpret_cast<UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer*>(thisPtr)->method1(valBoolean, *valString);
}

void test_materialized_classes_MaterializedOverloadedMethods_method11Impl(OH_NativePointer thisPtr, const Opt_Boolean* valBoolean, const Opt_String* valString) {
    if (valString->tag == INTEROP_TAG_UNDEFINED) {
        if (valBoolean->tag == INTEROP_TAG_UNDEFINED) {
            reinterpret_cast<UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer*>(thisPtr)->method1();
        } else {
            reinterpret_cast<UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer*>(thisPtr)->method1(valBoolean->value);
        }
    } else {
        reinterpret_cast<UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer*>(thisPtr)->method1(valBoolean->value, valString->value);
    }
}
void test_materialized_classes_MaterializedOverloadedMethods_method12Impl(OH_NativePointer thisPtr) {
    reinterpret_cast<UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer*>(thisPtr)->method1();
}

//"Materialized" class implementation with MORE overloaded methods

struct OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsPeer : UNIT_test_materialized_classes_MaterializedOverloadedMethodsPeer {
    void method2(OH_Number valNumber = {.tag = INTEROP_TAG_INT32, .i32 = 132}, OH_String valString = {.chars = "hi", .length = 2}) {
        printf("method2. Got number - %d, string - %s.\n", valNumber.i32, valString.chars);
    };
};

OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsHandle test_materialized_classes_MaterializedMoreOverloadedMethods_constructImpl() {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsHandle>(
        new OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsPeer({})
    );
}
void test_materialized_classes_MaterializedMoreOverloadedMethods_destructImpl(OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsHandle thisPtr) {
    delete reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsHandle*>(thisPtr);
}
void test_materialized_classes_MaterializedMoreOverloadedMethods_method20Impl(OH_NativePointer thisPtr) {
    reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsPeer*>(thisPtr)->method2();
}
void test_materialized_classes_MaterializedMoreOverloadedMethods_method21Impl(OH_NativePointer thisPtr, const OH_Number* valNumber) {
    reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsPeer*>(thisPtr)->method2(*valNumber);
}
void test_materialized_classes_MaterializedMoreOverloadedMethods_method22Impl(OH_NativePointer thisPtr, const OH_Number* valNumber, const OH_String* valString) {
    reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsPeer*>(thisPtr)->method2(*valNumber, *valString);
}

// "MaterializedWithConstructorAndFields"
struct OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer : OH_UNIT_test_materialized_classes_MaterializedMoreOverloadedMethodsPeer {
    OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer(OH_Number num, OH_Boolean bol) : valNumber(num), valBoolean(bol) {}
    OH_Number valNumber;
    OH_Boolean valBoolean;
};

OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsHandle test_materialized_classes_MaterializedWithConstructorAndFields_constructImpl(const OH_Number* initValNumber, OH_Boolean initValBoolean) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsHandle>(
        new OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer(*initValNumber, initValBoolean)
    );
}
void test_materialized_classes_MaterializedWithConstructorAndFields_destructImpl(OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsHandle thisPtr) {
    delete reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsHandle*>(thisPtr);
}
OH_Number test_materialized_classes_MaterializedWithConstructorAndFields_getValNumberImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<const OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer *>(thisPtr)->valNumber;
}
void test_materialized_classes_MaterializedWithConstructorAndFields_setValNumberImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer *>(thisPtr)->valNumber = *value;
}
OH_Boolean test_materialized_classes_MaterializedWithConstructorAndFields_getValBooleanImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<const OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer *>(thisPtr)->valBoolean;
}
void test_materialized_classes_MaterializedWithConstructorAndFields_setValBooleanImpl(OH_NativePointer thisPtr, OH_Boolean value) {
    reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer *>(thisPtr)->valBoolean = value;
}

// "MaterializedWithCreateMethod"
OH_UNIT_test_materialized_classes_MaterializedWithCreateMethodHandle test_materialized_classes_MaterializedWithCreateMethod_constructImpl(/** todo: where is constructor params? */) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithCreateMethodHandle>(
        new OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer({.tag = INTEROP_TAG_INT32, .i32 = 123456789}, true)
    );
}
void test_materialized_classes_MaterializedWithCreateMethod_destructImpl(OH_UNIT_test_materialized_classes_MaterializedWithCreateMethodHandle thisPtr) {
    delete reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithCreateMethodHandle*>(thisPtr);
}
OH_UNIT_test_materialized_classes_MaterializedWithCreateMethod test_materialized_classes_MaterializedWithCreateMethod_createImpl(const OH_Number* valNumber, OH_Boolean valBoolean) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedWithCreateMethod>(test_materialized_classes_MaterializedWithCreateMethod_constructImpl());
}

// "MaterializedComplexArguments"
struct OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer : OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer {
    OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer(OH_Number valNumber, OH_Boolean valBoolean) : OH_UNIT_test_materialized_classes_MaterializedWithConstructorAndFieldsPeer(valNumber, valBoolean) {}
    ~OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer() {
        for (auto data : toClean) {
            free(data);
        }
    }
    std::vector<void *> toClean;
    OH_UNIT_UtilityInterface method3(OH_UNIT_UtilityInterface utils) {
        InteropInt32 newLength = utils.fieldString.length + 9;
        char* newChars = reinterpret_cast<char*>(calloc(newLength, sizeof(char)));
        toClean.push_back(newChars);
        memcpy(newChars, utils.fieldString.chars, utils.fieldString.length);
        memcpy(newChars + utils.fieldString.length, "_modified", 9);

        int32_t arrayLength = utils.fieldArrayNumber.length;
        OH_Number * newArrayNumber = reinterpret_cast<OH_Number*>(calloc(arrayLength, sizeof(OH_Number)));
        toClean.push_back(newArrayNumber);
        for (size_t i = 0; i < arrayLength; i++) {
            if (utils.fieldArrayNumber.array[i].tag == INTEROP_TAG_INT32) {
                newArrayNumber[i] = OH_Number{
                    .tag = utils.fieldArrayNumber.array[i].tag,
                    .i32 = - utils.fieldArrayNumber.array[i].i32,
                };
            } else {
                newArrayNumber[i] = OH_Number{
                    .tag = utils.fieldArrayNumber.array[i].tag,
                    .f32 = - utils.fieldArrayNumber.array[i].f32,
                };
            }
        }

        return OH_UNIT_UtilityInterface {
            .fieldString = OH_String{.chars = newChars, .length = newLength},
            .fieldBoolean = OH_Boolean(!utils.fieldBoolean), 
            .fieldArrayNumber = Array_Number{.array = newArrayNumber, .length = arrayLength},
        };
    };

    Array_String method4(Array_Number array) {
        OH_String * newArrayString = reinterpret_cast<OH_String*>(calloc(array.length, sizeof(OH_String)));
        toClean.push_back(newArrayString);
        for (size_t i = 0; i < array.length; i++) {
            std::string stringifyNum = std::to_string(array.array[i].i32);
            char* newChars = reinterpret_cast<char*>(calloc(stringifyNum.size(), sizeof(char)));
            toClean.push_back(newChars);
            memcpy(newChars, stringifyNum.c_str(), stringifyNum.size());
            newArrayString[i] = OH_String{.chars = newChars, .length = (InteropInt32)stringifyNum.size()};
        }

        return Array_String{.array = newArrayString, .length = array.length};
    };

    Array_UtilityInterface method5(Array_UtilityInterface arrayUtils) {
        OH_UNIT_UtilityInterface * modifiedUtils = reinterpret_cast<OH_UNIT_UtilityInterface*>(calloc(arrayUtils.length, sizeof(OH_UNIT_UtilityInterface)));
        toClean.push_back(modifiedUtils);
        for (size_t i = 0; i < arrayUtils.length; i++) {
            modifiedUtils[i] = method3(arrayUtils.array[i]);
        }

        return Array_UtilityInterface{.array = modifiedUtils, .length = arrayUtils.length};
    };
};

OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsHandle test_materialized_classes_MaterializedComplexArguments_constructImpl(/** todo: where is constructor params? */) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsHandle>(
        new OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer({.tag = INTEROP_TAG_INT32, .i32 = 123456789}, true )
    );
}
void test_materialized_classes_MaterializedComplexArguments_destructImpl(OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsHandle thisPtr) {
    delete reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsHandle*>(thisPtr);
}
OH_UNIT_UtilityInterface test_materialized_classes_MaterializedComplexArguments_method3Impl(OH_NativePointer thisPtr, const OH_UNIT_UtilityInterface* interface_) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer*>(thisPtr)->method3(*interface_);
}
Array_String test_materialized_classes_MaterializedComplexArguments_method4Impl(OH_NativePointer thisPtr, const Array_Number* array) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer*>(thisPtr)->method4(*array);
}
Array_UtilityInterface test_materialized_classes_MaterializedComplexArguments_method5Impl(OH_NativePointer thisPtr, const Array_UtilityInterface* arrayInterfaces) {
    return reinterpret_cast<OH_UNIT_test_materialized_classes_MaterializedComplexArgumentsPeer*>(thisPtr)->method5(*arrayInterfaces);
}

// TBD: wait for the interface FQN fix for ArkTS
/*
// namespaces
OH_Boolean GlobalScope_hello_MyFuncImpl(OH_UNIT_hello_MyNamespace_FooXXX a) {
    return {};
}
OH_Boolean GlobalScope_MyFunc1Impl(const OH_UNIT_Union_MyNamespace_MyEnum1_MyNamespace_MyEnum2* a) {
    return {};
}
OH_Boolean GlobalScope_MyFunc2Impl(const Map_String_MyNamespace_MyInterface* a) {
    return {};
}
OH_UNIT_hello_MyNamespace_FooXXXHandle hello_MyNamespace_FooXXX_constructImpl() {
    return {};
}
void hello_MyNamespace_FooXXX_destructImpl(OH_UNIT_hello_MyNamespace_FooXXXHandle thisPtr) {
}
OH_Number hello_MyNamespace_FooXXX_getXImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_UNIT_hello_FooXXXHandle hello_FooXXX_constructImpl() {
    return {};
}
void hello_FooXXX_destructImpl(OH_UNIT_hello_FooXXXHandle thisPtr) {
}
OH_Number hello_FooXXX_getYImpl(OH_NativePointer thisPtr) {
    return {};
}
*/