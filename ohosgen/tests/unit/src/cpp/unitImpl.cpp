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
#include <sstream>
#include <unordered_map>
#include <string.h>

#define CALLBACK_HOLD(instance, callback) instance.callback.resource.hold(instance.callback.resource.resourceId);
#define CALLBACK_RELEASE(instance, callback) instance.callback.resource.release(instance.callback.resource.resourceId);

OH_String copy_string(OH_String str)
{
    if (str.length == 0) {
        return { .chars="", .length=0 };
    }
    char* chars = reinterpret_cast<char*>(calloc(str.length, sizeof(char)));
    memcpy(chars, str.chars, str.length);
    return OH_String { .chars = chars, .length = str.length };
}

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
    return 0;
}
void InterfaceWithMethods_setPropBooleanImpl(OH_NativePointer thisPtr, OH_Boolean value)
{
}
OH_Number InterfaceWithMethods_getPropNumberImpl(OH_NativePointer thisPtr)
{
    return { .tag=INTEROP_TAG_INT32, .i32=0 };
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

OH_UNIT_NS_ForceContextNSHandle NS_ForceContextNS_constructImpl() {
    return {};
}
void NS_ForceContextNS_destructImpl(OH_UNIT_NS_ForceContextNSHandle thisPtr) {
}
OH_String NS_ForceContextNS_getProp_Impl(OH_NativePointer thisPtr) {
    return {};
}
void NS_ForceContextNS_method_Impl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr) {
}
void NS_ForceContextNS_setProp_Impl(OH_NativePointer thisPtr, const OH_String* value) {
}
void NS_ForceContextNS_static_methodImpl(OH_UNIT_VMContext vmContext) {
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

/**
 * Create a buffer with the given size and fill it with values from 0 to size-1.
 */
static OH_Buffer createBufferImpl(OH_UInt32 size) {
    OH_Buffer result;
    result.resource.hold = stub_hold;
    result.resource.release = stub_release;
    result.length = size;
    result.data = malloc(size);
    for (uint32_t i = 0; i < size; i++) {
        ((char*)result.data)[i] = i;
    }
    return result;
}
static OH_Buffer reverseBufferImpl(const OH_Buffer* buf) {
    OH_Buffer result = createBufferImpl(buf->length);
    char *src = (char*)buf->data + buf->length - 1;
    for (char *dst = (char*)result.data; src >= buf->data; src--, dst++)
        *dst = *src;
    return result;
}
OH_Buffer GlobalScope_test_buffer_createImpl(OH_UInt32 size) {
    return createBufferImpl(size);
}
OH_Buffer GlobalScope_test_buffer_reverseImpl(const OH_Buffer* buffer) {
    return reverseBufferImpl(buffer);
}
OH_Buffer GlobalScope_test_buffer_idl_createImpl(OH_UInt32 size) {
    return createBufferImpl(size);
}
OH_Buffer GlobalScope_test_buffer_idl_reverseImpl(const OH_Buffer* buffer) {
    return reverseBufferImpl(buffer);
}

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

OH_UNIT_ForceContextHandle ForceContext_constructImpl() {
    return {};
}
void ForceContext_destructImpl(OH_UNIT_ForceContextHandle thisPtr) {
}
OH_String ForceContext_getProp_Impl(OH_NativePointer thisPtr) {
    return {};
}
void ForceContext_method_Impl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr) {
}
void ForceContext_setProp_Impl(OH_NativePointer thisPtr, const OH_String* value) {
}
void ForceContext_static_methodImpl(OH_UNIT_VMContext vmContext) {
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

// Enums
OH_UNIT_OrdinaryEnum GlobalScope_checkOrdinaryEnumsImpl(OH_UNIT_OrdinaryEnum value1, OH_UNIT_OrdinaryEnum value2) {
    // printf("value1: %d, expected: %d\n", value1, OH_UNIT_ORDINARY_ENUM_E1);
    if (value1 != OH_UNIT_ORDINARY_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equal OH_UNIT_ORDINARY_ENUM_E1: %d", value1, OH_UNIT_ORDINARY_ENUM_E1);
    }
    if (value2 != OH_UNIT_ORDINARY_ENUM_E2) {
        INTEROP_FATAL("Enum param value2 %d does not equal OH_UNIT_ORDINARY_ENUM_E2: %d", value2, OH_UNIT_ORDINARY_ENUM_E2);
    }
    return OH_UNIT_ORDINARY_ENUM_E3;
}

OH_UNIT_IntEnum GlobalScope_checkIntEnumsImpl(OH_UNIT_IntEnum value1, OH_UNIT_IntEnum value2) {
    // printf("value2: %d, expected: %d\n", value2, OH_UNIT_INT_ENUM_E3);
    if (value2 != OH_UNIT_INT_ENUM_E3) {
        INTEROP_FATAL("Enum param value2 %d does not equal OH_UNIT_INT_ENUM_E3: %d", value1, OH_UNIT_INT_ENUM_E3);
    }
    return OH_UNIT_INT_ENUM_E5;
}

OH_UNIT_DuplicateIntEnum GlobalScope_checkDuplicateIntEnumsImpl(OH_UNIT_DuplicateIntEnum value1, OH_UNIT_DuplicateIntEnum value2) {
    if (value2 != OH_UNIT_DUPLICATE_INT_ENUM_SECOND) {
        INTEROP_FATAL("Enum param value2 %d does not equal OH_UNIT_DUPLICATE_INT_ENUM_SECOND: %d", value1, OH_UNIT_DUPLICATE_INT_ENUM_SECOND);
    }
    if (value2 != OH_UNIT_DUPLICATE_INT_ENUM_LEGACY_SECOND) {
        INTEROP_FATAL("Enum param value2 %d does not equal OH_UNIT_DUPLICATE_INT_ENUM_LEGACY_SECOND: %d", value1, OH_UNIT_DUPLICATE_INT_ENUM_LEGACY_SECOND);
    }
    if (OH_UNIT_DUPLICATE_INT_ENUM_THIRD != OH_UNIT_DUPLICATE_INT_ENUM_LEGACY_THIRD) {
        INTEROP_FATAL("Enum OH_UNIT_DUPLICATE_INT_ENUM_THIRD %d does not equal OH_UNIT_DUPLICATE_INT_ENUM_LEGACY_THIRD: %d",
            OH_UNIT_DUPLICATE_INT_ENUM_THIRD, OH_UNIT_DUPLICATE_INT_ENUM_LEGACY_THIRD);
    }
    return OH_UNIT_DUPLICATE_INT_ENUM_THIRD;
}

OH_UNIT_StringEnum GlobalScope_checkStringEnumOrdinalImpl(OH_UNIT_StringEnum value, OH_Int32 expectedOrdinal) {
    if (value != expectedOrdinal) {
        INTEROP_FATAL("Enum param value %d does not equal to expected ordinal value: %d", value, expectedOrdinal);
    }
    return value;
}

OH_UNIT_StringEnum GlobalScope_checkStringEnumsImpl(OH_UNIT_StringEnum value1, OH_UNIT_StringEnum value2) {
    if (value1 != OH_UNIT_STRING_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equal OH_UNIT_STRING_ENUM_E1: %d", value1, OH_UNIT_STRING_ENUM_E1);
    }
    if (value2 != OH_UNIT_STRING_ENUM_E2) {
        INTEROP_FATAL("Enum param value2 %d does not equal OH_UNIT_STRING_ENUM_E2: %d", value2, OH_UNIT_STRING_ENUM_E2);
    }
    return OH_UNIT_STRING_ENUM_E3;
}

// Constructors
class IDLCheckConstructorPeer
{
public:
    OH_Number count;
    OH_Boolean flag;
    IDLCheckConstructorPeer(const OH_Number c, const OH_Boolean f) : count(c), flag(f) {}
};

OH_UNIT_IDLCheckConstructorHandle IDLCheckConstructor_construct0Impl(const OH_Number* count) {
    return (OH_UNIT_IDLCheckConstructorHandle) new IDLCheckConstructorPeer(*count, false);
}
OH_UNIT_IDLCheckConstructorHandle IDLCheckConstructor_construct1Impl(OH_Boolean flag) {
    const OH_Number zero =  {.tag = INTEROP_TAG_INT32, .i32 = 0};
    return (OH_UNIT_IDLCheckConstructorHandle) new IDLCheckConstructorPeer(zero, flag);
}
OH_UNIT_IDLCheckConstructorHandle IDLCheckConstructor_construct2Impl(const OH_Number* count, OH_Boolean flag) {
    return (OH_UNIT_IDLCheckConstructorHandle) new IDLCheckConstructorPeer(*count, flag);
}

void IDLCheckConstructor_destructImpl(OH_UNIT_IDLCheckConstructorHandle thisPtr) {
}
OH_Boolean IDLCheckConstructor_getFlagImpl(OH_NativePointer thisPtr)
{
    return reinterpret_cast<const IDLCheckConstructorPeer *>(thisPtr)->flag;
}
OH_Number IDLCheckConstructor_getCountImpl(OH_NativePointer thisPtr)
{
    return reinterpret_cast<const IDLCheckConstructorPeer *>(thisPtr)->count;
}
void IDLCheckConstructor_setCountImpl(OH_NativePointer thisPtr, const OH_Number *value)
{
}
void IDLCheckConstructor_setFlagImpl(OH_NativePointer thisPtr, OH_Boolean value) {
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
    result.propString = copy_string(arg->propString); \
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


// TBD: Unify with the DATA_OBJECT_TEST
#define DATA_CLASS_OBJECT_TEST(entityName, returnName) \
    entityName* arg = reinterpret_cast<entityName*>(value); \
    entityName* result = new entityName(); \
    result->propBoolean = !arg->propBoolean; \
    result->propNumber = arg->propNumber; \
    if (arg->propNumber.tag == InteropTag::INTEROP_TAG_INT32) \
        result->propNumber.i32 += 1; \
    else \
        result->propNumber.f32 += 1; \
    result->propString = copy_string(arg->propString); \
    result->propString.chars++; \
    result->propString.length--; \
    result->propObject = arg->propObject; \
    result->propObject.value0 = !arg->propObject.value0; \
    if (arg->propObject.value1.tag == InteropTag::INTEROP_TAG_INT32) \
        result->propObject.value1.i32 = -arg->propObject.value1.i32; \
    else \
        result->propObject.value1.f32 = -arg->propObject.value1.f32; \
    result->propObject.value2.chars = arg->propObject.value2.chars + 6; \
    result->propObject.value2.length = arg->propObject.value2.length - 6; \
    return reinterpret_cast<OH_UNIT_##returnName>(result);

class DataClassPeer
{
  public:
  OH_Boolean propBoolean = 0;
  OH_Number propNumber = { .tag=INTEROP_TAG_INT32, .i32=0  };
  OH_String propString = { .chars="", .length=0 };
  OH_UNIT_Tuple_Boolean_Number_String propObject = {
    .value0=0,
    .value1={ .tag=INTEROP_TAG_INT32, .i32=0 },
    .value2={ .chars="", .length=0 }
  };
};

OH_UNIT_MaterializedDataClassHandle MaterializedDataClass_constructImpl() {
    return reinterpret_cast<OH_UNIT_MaterializedDataClassHandle>(new DataClassPeer());
}
void MaterializedDataClass_destructImpl(OH_UNIT_MaterializedDataClassHandle thisPtr) {
}
// TBD: Provide DataClass type instead of OH_NativePointer
OH_Boolean MaterializedDataClass_getPropBooleanImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<DataClassPeer*>(thisPtr)->propBoolean;
}
OH_Number MaterializedDataClass_getPropNumberImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<DataClassPeer*>(thisPtr)->propNumber;
}
OH_UNIT_Tuple_Boolean_Number_String MaterializedDataClass_getPropObjectImpl(OH_NativePointer thisPtr) {
    return reinterpret_cast<DataClassPeer*>(thisPtr)->propObject;
}
OH_String MaterializedDataClass_getPropStringImpl(OH_NativePointer thisPtr) {
    return copy_string(reinterpret_cast<DataClassPeer*>(thisPtr)->propString);
}
void MaterializedDataClass_setPropBooleanImpl(OH_NativePointer thisPtr, OH_Boolean value) {
    reinterpret_cast<DataClassPeer*>(thisPtr)->propBoolean = value;
}
void MaterializedDataClass_setPropNumberImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    reinterpret_cast<DataClassPeer*>(thisPtr)->propNumber = *value;
}
void MaterializedDataClass_setPropObjectImpl(OH_NativePointer thisPtr, const OH_UNIT_Tuple_Boolean_Number_String* value) {
    reinterpret_cast<DataClassPeer*>(thisPtr)->propObject = *value;
}
void MaterializedDataClass_setPropStringImpl(OH_NativePointer thisPtr, const OH_String* value) {
    reinterpret_cast<DataClassPeer*>(thisPtr)->propString = copy_string(*value);
}

OH_UNIT_DataInterface GlobalScope_testDataInterfaceImpl(const OH_UNIT_DataInterface* arg) {
    DATA_OBJECT_TEST(DataInterface)
}
OH_UNIT_DataClass GlobalScope_testDataClassImpl(const OH_UNIT_DataClass* arg) {
    DATA_OBJECT_TEST(DataClass)
}
OH_UNIT_MaterializedDataClass GlobalScope_testMaterializedDataClassImpl(OH_UNIT_MaterializedDataClass value) {
    DATA_CLASS_OBJECT_TEST(DataClassPeer, MaterializedDataClass)
}

// "StaticMaterialized" class implementation
// TBD: do not generate construct and destruct methods for static materialized
OH_UNIT_test_materialized_classes_StaticMaterializedHandle test_materialized_classes_StaticMaterialized_constructImpl() {
    return {};
}
void test_materialized_classes_StaticMaterialized_destructImpl(OH_UNIT_test_materialized_classes_StaticMaterializedHandle thisPtr) {
}

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

void test_materialized_classes_MaterializedOverloadedMethods_method1Impl(OH_NativePointer thisPtr, const Opt_Boolean* valBoolean, const Opt_String* valString) {
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
        for (int32_t i = 0; i < arrayLength; i++) {
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
        for (int32_t i = 0; i < array.length; i++) {
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
        for (int32_t i = 0; i < arrayUtils.length; i++) {
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
void GlobalScope_test_any_testImpl(const OH_UNIT_test_any_WithAny* x, const UNIT_Callback_Any_Void* f) {
    f->call(f->resource.resourceId, x->field);
}
// BigInt
OH_UInt64 GlobalScope_test_bigint_testImpl(OH_Int64 num) {
    if (num != 123) INTEROP_FATAL("Input bigint: %d does not equal to: %d\n", num, 123);
    return 1ll << 54;
}
OH_UInt64 GlobalScope_test_bigint_test_negativeImpl(OH_Int64 num) {
    if (num != -123) INTEROP_FATAL("Input bigint: %d does not equal to: %d\n", num, -123);
    return -(1ll << 54);
}
OH_UNIT_test_bigint_BigIntParams GlobalScope_test_bigint_test_paramsImpl(const OH_UNIT_test_bigint_BigIntParams* params) {
    if (params->prime != 456) INTEROP_FATAL("Input bigint param,: %ld does not equal to: %d\n", params->prime, 456);
    return { .prime = 1ll << 52};
}
OH_UNIT_test_bigint_BigIntParams GlobalScope_test_bigint_test_params_negativeImpl(const OH_UNIT_test_bigint_BigIntParams* params) {
    if (params->prime != -789) INTEROP_FATAL("Input bigint param,: %ld does not equal to: %d\n", params->prime, 789);
    return { .prime = -(1ll << 42)};
}

OH_UNIT_test_enums_TestHandle test_enums_Test_constructImpl() {
    return (OH_UNIT_test_enums_TestHandle)42;
}
void test_enums_Test_destructImpl(OH_UNIT_test_enums_TestHandle thisPtr) {
}
OH_Number test_enums_Test_getAImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number GlobalScope_test_enums_MyFuncImpl(const OH_Number* a) {
    return {};
}
OH_Number GlobalScope_test_enums_MyFunc2Impl(OH_UNIT_test_enums_MyEnum a) {
    return {};
}
void test_enums_Test_setAImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
void GlobalScope_hilog_debugImpl(const OH_Number* domain, const OH_String* tag, const OH_String* format, const Array_ArgType* args) {
}
void GlobalScope_hilog_infoImpl(const OH_Number* domain, const OH_String* tag, const OH_String* format, const Array_ArgType* args) {
}
void GlobalScope_hilog_warnImpl(const OH_Number* domain, const OH_String* tag, const OH_String* format, const Array_ArgType* args) {
}
void GlobalScope_hilog_errorImpl(const OH_Number* domain, const OH_String* tag, const OH_String* format, const Array_ArgType* args) {
}
void GlobalScope_hilog_fatalImpl(const OH_Number* domain, const OH_String* tag, const OH_String* format, const Array_ArgType* args) {
}
OH_Boolean GlobalScope_hilog_isLoggableImpl(const OH_Number* domain, const OH_String* tag, OH_UNIT_hilog_LogLevel level) {
    return {};
}
void GlobalScope_hilog_setMinLogLevelImpl(OH_UNIT_hilog_LogLevel level) {
}
OH_UNIT_ExampleHandle Example_constructImpl() {
    return (OH_UNIT_ExampleHandle)42;
}
void Example_destructImpl(OH_UNIT_ExampleHandle thisPtr) {
}
OH_UNIT_Example Example_createExampleImpl() {
    return (OH_UNIT_Example)42;
}

/////////////////////////////////////////////
// return entities tests

OH_UNIT_test_ret_BHandle test_ret_B_constructImpl() {
    return (OH_UNIT_test_ret_BHandle)42;
}
void test_ret_B_destructImpl(OH_UNIT_test_ret_BHandle thisPtr) {
}
OH_Number test_ret_B_actionImpl(OH_NativePointer thisPtr) {
    OH_Number n;
    n.i32 = reinterpret_cast<uintptr_t>(thisPtr);
    n.tag = INTEROP_TAG_INT32;
    return n;
}

////

void GlobalScope_test_return_types_returnNothingImpl() {
}
OH_Number GlobalScope_test_return_types_returnNumberImpl() {
    OH_Number n;
    n.i32 = 42;
    n.tag = INTEROP_TAG_INT32;
    return n;
}
OH_Boolean GlobalScope_test_return_types_returnBooleanImpl() {
    return 1;
}
UNIT_test_ret_Callback GlobalScope_test_return_types_returnCallbackImpl() {
    return {};
}
OH_UInt64 GlobalScope_test_return_types_returnBitIntImpl() {
    return 100;
}
OH_String GlobalScope_test_return_types_returnStringImpl() {
    const char* text = "text from native";
    OH_String str;
    str.chars = text;
    str.length = strlen(text);
    return str;
}
OH_UNIT_test_ret_A GlobalScope_test_return_types_returnInterfaceImpl() {
    OH_UNIT_test_ret_A entity;
    entity.field.i32 = 42;
    entity.field.tag = INTEROP_TAG_INT32;
    return entity;
}
OH_UNIT_test_ret_B GlobalScope_test_return_types_returnMaterializedImpl() {
    return (OH_UNIT_test_ret_B)42;
}
Array_Number GlobalScope_test_return_types_returnNumberArrayImpl() {
    Array_Number arr;
    arr.length = 10;
    arr.array = new OH_Number[arr.length];
    for (int i = 0; i < 10; ++i) {
        arr.array[i].i32 = i;
        arr.array[i].tag = INTEROP_TAG_INT32;
    }
    return arr;
}
Array_String GlobalScope_test_return_types_returnStringArrayImpl() {
    Array_String arr;
    arr.length = 10;
    arr.array = new OH_String[arr.length];
    for (int i = 0; i < 10; ++i) {
        const char* test = "123";
        arr.array[i].chars = test;
        arr.array[i].length = 3;
    }
    return arr;
}
Array_test_ret_A GlobalScope_test_return_types_returnInterfaceArrayImpl() {
    Array_test_ret_A arr;
    arr.length = 10;
    arr.array = new OH_UNIT_test_ret_A[arr.length];
    for (int i = 0; i < 10; ++i) {
        arr.array[i].field.i32 = i;
        arr.array[i].field.tag = INTEROP_TAG_INT32;
    }
    return arr;
}
Array_test_ret_B GlobalScope_test_return_types_returnMaterializedArrayImpl() {
    Array_test_ret_B arr;
    arr.length = 10;
    arr.array = new OH_UNIT_test_ret_B[arr.length];
    for (int i = 0; i < 10; ++i) {
        arr.array[i] = (OH_UNIT_test_ret_B)(42ll + i);
    }
    return arr;
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

// throw exception

class OH_UNIT_CheckExceptionInterfacePeer
{
};

class OH_UNIT_CheckExceptionClassPeer
{
};

class BaseGesture {
public:
    virtual OH_UNIT_GestureType getType() = 0;
    virtual ~BaseGesture() = default;
};

class DerivedGesture1 : public BaseGesture {
public:
    OH_UNIT_GestureType getType() override {
        return OH_UNIT_GestureType::OH_UNIT_GESTURE_TYPE_First;
    }
};

class DerivedGesture2 : public BaseGesture {
public:
    OH_UNIT_GestureType getType() override {
        return OH_UNIT_GestureType::OH_UNIT_GESTURE_TYPE_Second;
    }
};
OH_UNIT_BaseGestureHandle BaseGesture_constructImpl() {
    BaseGesture* ptr = new DerivedGesture2();
    return reinterpret_cast<OH_UNIT_BaseGestureHandle>(ptr);
}
void BaseGesture_destructImpl(OH_UNIT_BaseGestureHandle thisPtr) {
    BaseGesture* gesturePtr = reinterpret_cast<BaseGesture*>(thisPtr);
    delete gesturePtr;
}
OH_UNIT_GestureType BaseGesture_getTypeImpl(OH_NativePointer thisPtr) {
    BaseGesture* gesturePtr = reinterpret_cast<BaseGesture*>(thisPtr);
    return gesturePtr->getType();
}
OH_UNIT_BaseGesture BaseGesture_createGesture2Impl() {
    BaseGesture* ptr = new DerivedGesture2();
    return reinterpret_cast<OH_UNIT_BaseGesture>(ptr);
}

class CheckCallbackExceptionsPeer {
public:
    static OH_UNIT_CallbackResource resource;
};
OH_UNIT_CallbackResource CheckCallbackExceptionsPeer::resource = {
    .resourceId=0,
    .hold=[](const OH_Int32 resourceId) -> void {},
    .release=[](const OH_Int32 resourceId) -> void {}
};
void CheckCallbackExceptions_callHolderImpl(OH_NativePointer thisPtr) {
}
Throws_void CheckCallbackExceptions_checkRethrowImpl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr, const UNIT_ThrowableCallbackVoid* value) {
    static Throws_void result;
    result = {
        .hasException = false
    };
    value->callSync(vmContext, value->resource.resourceId, {
        .resource=CheckCallbackExceptionsPeer::resource,
        .call=[](const OH_Int32 resourceId, const Throws_void value) -> void {},
        .callSync = [](OH_UNIT_VMContext vmContext, const OH_Int32 resourceId, const Throws_void value) -> void {
            result = value;
        },
    });
    return result;
}
OH_Boolean CheckCallbackExceptions_checkThrowableCallbackI32_withParameterImpl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr, const UNIT_ThrowableCallbackI32_withParameter* value) {
    static bool gotException;
    gotException = false;
    value->callSync(vmContext, value->resource.resourceId, 1, {
        .resource=CheckCallbackExceptionsPeer::resource,
        .call=[](const OH_Int32 resourceId, const Throws_Int32 value) -> void {},
        .callSync = [](OH_UNIT_VMContext vmContext, const OH_Int32 resourceId, const Throws_Int32 value) -> void {
            gotException = value.hasException;
        },
    });
    return gotException;
}
OH_Boolean CheckCallbackExceptions_checkThrowableCallbackI32Impl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr, const UNIT_ThrowableCallbackI32* value) {
    static bool gotException;
    gotException = false;
    value->callSync(vmContext, value->resource.resourceId, {
        .resource=CheckCallbackExceptionsPeer::resource,
        .call=[](const OH_Int32 resourceId, const Throws_Int32 value) -> void {},
        .callSync = [](OH_UNIT_VMContext vmContext, const OH_Int32 resourceId, const Throws_Int32 value) -> void {
            gotException = value.hasException;
        },
    });
    return gotException;
}
OH_Boolean CheckCallbackExceptions_checkThrowableCallbackVoidImpl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr, const UNIT_ThrowableCallbackVoid* value) {
    static bool gotException;
    gotException = false;
    value->callSync(vmContext, value->resource.resourceId, {
        .resource=CheckCallbackExceptionsPeer::resource,
        .call=[](const OH_Int32 resourceId, const Throws_void value) -> void {},
        .callSync = [](OH_UNIT_VMContext vmContext, const OH_Int32 resourceId, const Throws_void value) -> void {
            gotException = value.hasException;
        },
    });
    return gotException;
}
UNIT_ThrowableCallbackVoid CheckCallbackExceptions_checkThrowFromNativeImpl(OH_NativePointer thisPtr) {
    return {
        .resource=CheckCallbackExceptionsPeer::resource,
        .call=[](const OH_Int32 resourceId, const UNIT_Callback_Throws_Void_Void continuation) {},
        .callSync=[](OH_UNIT_VMContext vmContext, const OH_Int32 resourceId, const UNIT_Callback_Throws_Void_Void continuation) {
            auto message = "Exception thrown from callback created in native CheckCallbackExceptions_checkThrowFromNative";
            continuation.callSync(vmContext, continuation.resource.resourceId, {
                .hasException=true,
                .exception={
                    .kind=EXCEPTION_INTERFACE,
                    .interface={
                        .code=1,
                        .message={
                            .chars=message,
                            .length=static_cast<int>(strlen(message)),
                        }
                    }
                }
            });
        }
    };
}
OH_UNIT_CheckCallbackExceptionsHandle CheckCallbackExceptions_constructImpl() {
    const CheckCallbackExceptionsPeer* peer = new CheckCallbackExceptionsPeer();
    return (OH_UNIT_CheckCallbackExceptionsHandle) peer;
}
void CheckCallbackExceptions_destructImpl(OH_UNIT_CheckCallbackExceptionsHandle thisPtr) {
}
OH_Boolean CheckCallbackExceptions_ThrowableCallbackSequenceImpl(OH_UNIT_VMContext vmContext, OH_NativePointer thisPtr, const UNIT_ThrowableCallbackSequence* value) {
    return {};
}

OH_UNIT_DerivedGesture1Handle DerivedGesture1_constructImpl() {
    return {};
}
void DerivedGesture1_destructImpl(OH_UNIT_DerivedGesture1Handle thisPtr) {
}

OH_UNIT_DerivedGesture2Handle DerivedGesture2_constructImpl() {
    return {};
}
void DerivedGesture2_destructImpl(OH_UNIT_DerivedGesture2Handle thisPtr) {
}

void BaseGesture_callHolderImpl(OH_NativePointer thisPtr) {}
void DerivedGesture1_callHolderImpl(OH_NativePointer thisPtr) {}
void DerivedGesture2_callHolderImpl(OH_NativePointer thisPtr) {}
void CheckExceptionClass_callHolderImpl(OH_NativePointer thisPtr) {}
void CheckExceptionInterface_callHolderImpl(OH_NativePointer thisPtr) {}
void DTSCheckExternalLib_callHolderImpl(OH_NativePointer thisPtr) {}
void DTSCheckInternalLib_callHolderImpl(OH_NativePointer thisPtr) {}
void Example_callHolderImpl(OH_NativePointer thisPtr) {}
void ForceCallbackClass_callHolderImpl(OH_NativePointer thisPtr) {}
void ForceContext_callHolderImpl(OH_NativePointer thisPtr) {}
void GenericInterface_callHolderImpl(OH_NativePointer thisPtr) {}
void generics_X_callHolderImpl(OH_NativePointer thisPtr) {}
void generics_Y_callHolderImpl(OH_NativePointer thisPtr) {}
void Hello_callHolderImpl(OH_NativePointer thisPtr) {}
void HookClass_callHolderImpl(OH_NativePointer thisPtr) {}
void HookInterface_callHolderImpl(OH_NativePointer thisPtr) {}
void IDLCheckConstructor_callHolderImpl(OH_NativePointer thisPtr) {}
void IDLCheckProps_callHolderImpl(OH_NativePointer thisPtr) {}
void InterfaceWithMethods_callHolderImpl(OH_NativePointer thisPtr) {}
void MaterializedDataClass_callHolderImpl(OH_NativePointer thisPtr) {}
void MyPersonHandler_callHolderImpl(OH_NativePointer thisPtr) {}
void NS_ForceContextNS_callHolderImpl(OH_NativePointer thisPtr) {}
void PersonInfo_callHolderImpl(OH_NativePointer thisPtr) {}
void test_enums_Test_callHolderImpl(OH_NativePointer thisPtr) {}
void test_materialized_classes_MaterializedComplexArguments_callHolderImpl(OH_NativePointer thisPtr) {}
void test_materialized_classes_MaterializedMoreOverloadedMethods_callHolderImpl(OH_NativePointer thisPtr) {}
void test_materialized_classes_MaterializedOverloadedMethods_callHolderImpl(OH_NativePointer thisPtr) {}
void test_materialized_classes_MaterializedWithConstructorAndFields_callHolderImpl(OH_NativePointer thisPtr) {}
void test_materialized_classes_MaterializedWithCreateMethod_callHolderImpl(OH_NativePointer thisPtr) {}
void test_materialized_classes_StaticMaterialized_callHolderImpl(OH_NativePointer thisPtr) {}
void test_ret_B_callHolderImpl(OH_NativePointer thisPtr) {}
void TestBuffer_BufferGenerator_callHolderImpl(OH_NativePointer thisPtr) {}

class RefCounter {
public:
    RefCounter() {}
    void hold(const void* const ptr) {
        ++counters_[ptr];
    }
    size_t release(const void* const ptr) {
        auto it = counters_.find(ptr);
        if (it == counters_.end()) {
            std::stringstream msg;
            msg << "Pointer " << ptr << " is not found in reference counter";
            return 0;
        }
        std::size_t& cnt = it->second;
        if (cnt < 2) {
            counters_.erase(it);
            return 0;
        }
        --cnt;
        return cnt;
    }
private:
    std::unordered_map<const void*, std::size_t> counters_;
};

RefCounter& GetRefCounter() {
    static RefCounter counter;
    return counter;
}

class SomeClass {
public:
    OH_Number getValue() {
        OH_Number n;
        n.i32 = 5;
        n.tag = INTEROP_TAG_INT32;
        return n;
    }
};

OH_UNIT_SomeClass GlobalScope_getSomeClassInstanceImpl() {
    static SomeClass* obj = new SomeClass();
    return reinterpret_cast<OH_UNIT_SomeClass>(obj);
}

OH_UNIT_SomeClassHandle SomeClass_constructImpl() {
    SomeClass* obj = new SomeClass();
    return reinterpret_cast<OH_UNIT_SomeClassHandle>(obj);
}
OH_Number SomeClass_getValueImpl(OH_NativePointer thisPtr) {
    SomeClass* someClassPtr = reinterpret_cast<SomeClass*>(thisPtr);
    return someClassPtr->getValue();
}

void SomeClass_callHolderImpl(OH_NativePointer thisPtr) {
    SomeClass* someClassPtr = reinterpret_cast<SomeClass*>(thisPtr);
    if (someClassPtr) {
        GetRefCounter().hold(someClassPtr);
    }
}

void SomeClass_destructImpl(OH_UNIT_SomeClassHandle thisPtr) {
    SomeClass* someClassPtr = reinterpret_cast<SomeClass*>(thisPtr);
    if (someClassPtr) {
        if (GetRefCounter().release(someClassPtr) == 0) {
            delete someClassPtr;
        }
    }
}

OH_UNIT_CheckExceptionInterfaceHandle CheckExceptionInterface_constructImpl() {
    OH_UNIT_CheckExceptionInterfacePeer* peer = new OH_UNIT_CheckExceptionInterfacePeer();
    printf("CheckExceptionInterface construct peer: %p\n", peer);
    return (OH_UNIT_CheckExceptionInterfaceHandle) peer;
}
void CheckExceptionInterface_destructImpl(OH_UNIT_CheckExceptionInterfaceHandle thisPtr) {
}
Throws_Array_I32 CheckExceptionClass_getArrayImpl(OH_NativePointer thisPtr) {
    return {};
}
Throws_void CheckExceptionInterface_checkExceptionImpl(OH_NativePointer thisPtr) {
    const char *message = "Exception from CheckExceptionInterface";
    return {
        .hasException=true,
        .exception={
            .kind=EXCEPTION_INTERFACE,
            .interface= {
                .code=1,
                .message={
                    .chars=message,
                    .length=static_cast<InteropInt32>(strlen(message)),
                }
            }
        }
    };
}

OH_UNIT_CheckExceptionClassHandle CheckExceptionClass_constructImpl() {
    OH_UNIT_CheckExceptionClassPeer* peer = new OH_UNIT_CheckExceptionClassPeer();
    printf("CheckExceptionClass construct peer: %p\n", peer);
    return (OH_UNIT_CheckExceptionClassHandle) peer;
}
void CheckExceptionClass_destructImpl(OH_UNIT_CheckExceptionClassHandle thisPtr) {
}
Throws_void CheckExceptionClass_checkExceptionImpl(OH_NativePointer thisPtr) {
    const char *message = "Exception from CheckExceptionClass";
    return {
        .hasException=true,
        .exception={
            .kind=EXCEPTION_INTERFACE,
            .interface= {
                .code=1,
                .message={
                    .chars=message,
                    .length=static_cast<InteropInt32>(strlen(message)),
                }
            }
        }
    };
}

Throws_CheckExceptionInterface CheckExceptionClass_getInterfaceImpl(OH_NativePointer thisPtr) {
    printf("OH_UNIT_CheckExceptionClass getInterface thisPtr: %p\n", thisPtr);
    return {
        .hasException=false,
        .value=(OH_UNIT_CheckExceptionInterface)(new OH_UNIT_CheckExceptionInterfacePeer()),
    };
}

void CheckExceptionClass_getPromiseInterfaceImpl(OH_UNIT_VMContext vmContext, OH_UNIT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const UNIT_Callback_Opt_CheckExceptionInterface_Opt_Array_String_Void* outputArgumentForReturningPromise) {
    auto const resource = outputArgumentForReturningPromise->resource;
    const char *message = "(Test passed) Promise for @throw annotated method was rejected";
    OH_String* errors = new OH_String[2];
    errors[0].length = strlen("1");
    errors[0].chars = "1";
    errors[1].length = strlen(message);
    errors[1].chars = message;
    outputArgumentForReturningPromise->callSync(vmContext, resource.resourceId, { .tag=INTEROP_TAG_UNDEFINED }, {
        .tag=INTEROP_TAG_OBJECT,
        .value={
            .array=errors,
            .length=2,
        }
    });
}
Throws_void CheckExceptionClass_getThisImpl(OH_NativePointer thisPtr) {
    const char *message = "(Test passed) Promise for @throw annotated method with `this` return type was rejected";
    return {
        .hasException=true,
        .exception={
            .kind=EXCEPTION_INTERFACE,
            .interface= {
                .code=1,
                .message={
                    .chars=message,
                    .length=static_cast<InteropInt32>(strlen(message)),
                }
            }
        }
    };
}

OH_UNIT_generics_XHandle generics_X_constructImpl() {
    return (OH_UNIT_generics_XHandle)42;
}
void generics_X_destructImpl(OH_UNIT_generics_XHandle thisPtr) {
}
OH_CustomObject generics_X_fooImpl(OH_NativePointer thisPtr, const OH_CustomObject* x, const OH_CustomObject* y) {
    return {};
}
OH_CustomObject generics_Y_barImpl(OH_NativePointer thisPtr, const OH_CustomObject* y) {
    return {};
}
OH_UNIT_generics_YHandle generics_Y_constructImpl() {
    return (OH_UNIT_generics_YHandle)42;
}
void generics_Y_destructImpl(OH_UNIT_generics_YHandle thisPtr) {
}

// Check Length
OH_Boolean GlobalScope_testLengthImpl(const OH_Number* step, const OH_UNIT_Length* value) {
    int s = step->i32;
    OH_UNIT_Length u = *value;
    OH_Boolean OH_FALSE = (OH_Boolean) 0;
    OH_Boolean OH_TRUE = (OH_Boolean) 1;

    if (s == 1) {
        switch(u.selector) {
            case 0: return (u.value0.length == strlen("length") && strcmp("length", u.value0.chars) == 0);
            case 1: return (u.value1.tag == INTEROP_TAG_INT32 && u.value1.i32 == 123);
            case 2: return OH_TRUE; // TBD: Resource
            default: INTEROP_FATAL("Not correct GlobalScope_testLengthImpl argument value");
        }
    } else if (s == 2) {
        switch(u.selector) {
            case 0: return (u.value0.length == strlen("") && strcmp("", u.value0.chars) == 0);
            case 1: return (u.value1.tag == INTEROP_TAG_FLOAT32 && fabs(u.value1.f32 - 456.789) < 0.1);
            case 2: return OH_TRUE; // TBD Resource
            default: INTEROP_FATAL("Not correct GlobalScope_testLengthImpl argument value");
        }
    }

    // return Length
    // return {.selector = 1, .value1 = {.tag = INTEROP_TAG_INT32, .i32 = 456} };
    INTEROP_FATAL("Unknown step: %d or selector: %d", s, u.selector);
}

// Hooks
// TBD: Do not generate native methods for hooks with the replaceImplementation set to true
class HookInterfacePeer
{
};

OH_UNIT_HookInterface GlobalScope_getHookInterfaceImpl() {
    return (OH_UNIT_HookInterface) new HookInterfacePeer();
}

OH_UNIT_HookInterfaceHandle HookInterface_constructImpl() {
    return {};
}
void HookInterface_destructImpl(OH_UNIT_HookInterfaceHandle thisPtr) {
}
void HookInterface_methodArgImpl(OH_NativePointer thisPtr, const OH_UNIT_HookValue* value) {
}
void HookInterface_methodImpl(OH_NativePointer thisPtr) {
}
void HookInterface_methodImportedArgImpl(OH_NativePointer thisPtr, const OH_UNIT_ImportedHookValue* hookedValue) {
}
OH_UNIT_ImportedHookValue HookInterface_methodImportedReturnImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_UNIT_HookValue HookInterface_methodReturnImpl(OH_NativePointer thisPtr) {
    return {};
}

class HookClassPeer
{
};
OH_UNIT_HookClassHandle HookClass_constructImpl() {
    return (OH_UNIT_HookClassHandle) new HookClassPeer();
}
void HookClass_destructImpl(OH_UNIT_HookClassHandle thisPtr) {
}
void HookClass_methodImpl(OH_NativePointer thisPtr) {
    printf("[native] [0] call HookClass_methodImpl\n");
}
// TBD: remove implementation for the hooked method
void HookClass_methodArgImpl(OH_NativePointer thisPtr, const OH_UNIT_HookValue* value) {
}
OH_UNIT_HookValue HookClass_methodReturnImpl(OH_NativePointer thisPtr) {
    return {};
}
void HookClass_methodImportedArgImpl(OH_NativePointer thisPtr, const OH_UNIT_ImportedHookValue* hookedValue) {
}

// TBD: update
void HookClass_methodImportedArgImpl(OH_NativePointer thisPtr, OH_UNIT_ImportedHookValue hookedValue) {
}
OH_UNIT_ImportedHookValue HookClass_methodImportedReturnImpl(OH_NativePointer thisPtr) {
    return {};
}

// Internal library
class DTSCheckInternalLibPeer
{
};

OH_Number DTSCheckInternalLib_checkInternalDataInterfaceImpl(OH_NativePointer thisPtr, const OH_UNIT_InternalModuleDataInterface *internalType)
{
    printf("checkInternalDataInterface count: %d\n", internalType->count.i32);
    return internalType->count;
}
OH_UNIT_DTSCheckInternalLibHandle DTSCheckInternalLib_constructImpl()
{
    return (OH_UNIT_DTSCheckInternalLibHandle) new DTSCheckInternalLibPeer();
}
void DTSCheckInternalLib_destructImpl(OH_UNIT_DTSCheckInternalLibHandle thisPtr)
{
}
// Internal renamed library
OH_Number DTSCheckInternalLib_checkRenamedModuleDataInterfaceImpl(OH_NativePointer thisPtr, const OH_UNIT_RenamedModuleDataInterface* renamedModuleType) {
    return renamedModuleType->count;
}

// ExternalType
class DTSCheckExternalLibPeer
{
};

OH_UNIT_DTSCheckExternalLibHandle DTSCheckExternalLib_constructImpl() {
    return (OH_UNIT_DTSCheckExternalLibHandle) new DTSCheckExternalLibPeer();
}
void DTSCheckExternalLib_destructImpl(OH_UNIT_DTSCheckExternalLibHandle thisPtr) {
}

OH_Number DTSCheckExternalLib_checkExternalDataInterfaceImpl(OH_NativePointer thisPtr, const OH_UNIT_ExternalModuleDataInterface* externalType) {
    return externalType->count;
}

void DTSCheckExternalLib_checkExternalTypeImpl(OH_NativePointer thisPtr, OH_UNIT_ExternalType externalType) {
    printf("[native] checkExternalType: %p\n", externalType);
}

void DTSCheckExternalLib_checkExternalClassImpl(OH_NativePointer thisPtr, OH_UNIT_ExternalClass externalClass) {
}

void DTSCheckExternalLib_checkNSExternalTypeImpl(OH_NativePointer thisPtr, OH_UNIT_hookns_NSExternalType externalType) {
    printf("[native] checkNSExternalType: %p\n", externalType);
}

void DTSCheckExternalLib_checkSubNSExternalTypeImpl(OH_NativePointer thisPtr, OH_UNIT_hookns_subhookns_SubNSExternalType externalType) {
    printf("[native] checkSubNSExternalTypeImpl: %p\n", externalType);
}

// void DTSCheckExternalLib_checkInternalTypeWithExternalTypeImpl(OH_NativePointer thisPtr, const OH_UNIT_InternalType* internalType) {
//     //printf("[native] checkInternalTypeWithExternalType: %p\n", internalType->external);
//     // TBD:
//     printf("[native] checkInternalTypeWithExternalType\n");
// }

// void DTSCheckExternalLib_checkSDKExternalTypeImpl(OH_NativePointer thisPtr, OH_UNIT_SDKExternalType externalType) {
//     printf("[native] checkSDKExternalTypeImpl: %p\n", externalType);
// }


static const char* ERROR_MSG = "(Test passed) Promise was rejected";
void PromiseTester_waitImpl(OH_UNIT_VMContext vmContext, OH_UNIT_AsyncWorkerPtr asyncWorker, const OH_Number* ms, const UNIT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
    OH_String* errors = new OH_String[2];
    errors[0].length = strlen("1");
    errors[0].chars = "1";
    errors[1].length = strlen(ERROR_MSG);
    errors[1].chars = ERROR_MSG;
    outputArgumentForReturningPromise->callSync(
        vmContext,
        outputArgumentForReturningPromise->resource.resourceId,
        { INTEROP_TAG_OBJECT, { errors, 2 } }
    );
}

OH_UNIT_IDLCheckPropsHandle IDLCheckProps_constructImpl() {
    return {};
}
void IDLCheckProps_destructImpl(OH_UNIT_IDLCheckPropsHandle thisPtr) {
}
OH_Number IDLCheckProps_getPropImpl(OH_NativePointer thisPtr) {
    return { .tag=INTEROP_TAG_INT32, .i32=0 };
}
OH_Number IDLCheckProps_getPropReadonlyImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number IDLCheckProps_getPropWithGetterAndSetterImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number IDLCheckProps_getPropWithGetterImpl(OH_NativePointer thisPtr) {
    return {};
}
void IDLCheckProps_setPropImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
void IDLCheckProps_setPropWithGetterAndSetterImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
void IDLCheckProps_setPropWithSetterImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
void IDLCheckProps_checkImpl(OH_NativePointer thisPtr) {
}
OH_UNIT_IDLCheckProps GlobalScope_testIDLCheckPropsImpl(OH_UNIT_IDLCheckProps arg) {
    return {};
}

// Unions
OH_UNIT_UnionSampleEnumInterface GlobalScope_checkUnionEnumSampleImpl(const OH_UNIT_UnionSampleEnumInterface* value) {
    return *value;
}
OH_UNIT_UnionSampleArrayInterface GlobalScope_checkUnionArraySampleImpl(const OH_UNIT_UnionSampleArrayInterface* value) {
    return *value;
}
OH_UNIT_UnionSampleNumberArrayInterface GlobalScope_checkUnionNumberArraySampleImpl(const OH_UNIT_UnionSampleNumberArrayInterface* value) {
    return *value;
}
OH_UNIT_UnionSampleTupleArrayInterface GlobalScope_checkUnionTupleArraySampleImpl(const OH_UNIT_UnionSampleTupleArrayInterface* value) {
    return *value;
}
OH_UNIT_UnionSampleGenericTypeInterface GlobalScope_checkUnionGenericTypeSampleImpl(const OH_UNIT_UnionSampleGenericTypeInterface* value) {
    return *value;

}
void GlobalScope_generics_callWithDefaultsBImpl(const OH_UNIT_generics_WithDefaultsB_generics_WithDefaultsA_Number* value) {
}

OH_UNIT_GestureType GlobalScope_getBaseGestureTypeImpl(OH_NativePointer ptr) {
    BaseGesture* gesturePtr = reinterpret_cast<BaseGesture*>(ptr);
    return gesturePtr->getType();
}

void checkTransformFlagToState(OH_Boolean flag, InteropNumber state) {
    if (state.tag != INTEROP_TAG_INT32) {
        INTEROP_FATAL("Check transform value state %d does not equal to %d\n", state.tag, INTEROP_TAG_INT32)
    }
    if (!flag && state.i32 != 0) {
        INTEROP_FATAL("Check transform value %d does not equal to %d\n", state.i32, 0)
    }
    if (flag && state.i32 != 1) {
        INTEROP_FATAL("Check transform value %d does not equal to %d\n", state.i32, 1)
    }
}

// Transform on serialize
OH_UNIT_TransformDstC GlobalScope_checkTransformDstCImpl(const OH_UNIT_TransformDstC* value, OH_Boolean flag) {
    checkTransformFlagToState(flag, value->state);
    return *value;
}

OH_UNIT_TransformDstI GlobalScope_checkTransformDstIImpl(const OH_UNIT_TransformDstI* value, OH_Boolean flag) {
    checkTransformFlagToState(flag, value->state);
    return *value;
}

UNIT_TransformDstCallbackI GlobalScope_checkTransformSrcIToCallbackImpl(const UNIT_TransformDstCallbackI* value, OH_Boolean flag) {
    value->resource.hold(value->resource.resourceId);
    return *value;
}

UNIT_TransformDstCallbackC GlobalScope_checkTransformSrcCToCallbackImpl(const UNIT_TransformDstCallbackC* value, OH_Boolean flag) {
    value->resource.hold(value->resource.resourceId);
    return *value;
}

OH_UNIT_SomeClassHandle GlobalScope_getSomeClassInstance() {
    static SomeClass obj;
    return reinterpret_cast<OH_UNIT_SomeClassHandle>(&obj);
}
