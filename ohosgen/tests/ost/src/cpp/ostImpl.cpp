/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#include <cstdio>
#include <cstring>
#include <stdlib.h>

#include "unit_ost.h"

InteropInt32 string_len(const char* str)
{
    return static_cast<InteropInt32>(strlen(str));
}

OH_String to_string(const char* msg)
{
    return { .chars = msg, .length = string_len(msg) };
}

OH_String int_to_string(OH_Int32 x)
{
    char* result = reinterpret_cast<char*>(calloc(10, sizeof(char)));
    sprintf(result, "%d", x);
    return { .chars = result, .length = string_len(result) };
}

void AssertEqBool(bool golden, OH_Boolean b, const char* comment)
{
    if (b == golden) {
        return;
    }
    INTEROP_FATAL("%s, golden: %d, curr: %d", comment, golden, b);
}

void AssertEqInt(int golden, OH_Int32 i, const char* comment)
{
    if (i == golden) {
        return;
    }
    INTEROP_FATAL("%s, golden: %d, curr: %d", comment, golden, i);
}

void AssertEqNumber(int golden, OH_Number num, const char* comment)
{
    if (num.tag == INTEROP_TAG_INT32 && num.i32 == golden) {
        return;
    }
    INTEROP_FATAL("%s, golden: %d, curr: [tag: %d, i32: %d]", comment, golden, num.tag, num.i32);
}

void AssertEqStr(const char* golden, OH_String str, const char* comment)
{
    if (str.length == string_len(golden) && strcmp(golden, str.chars) == 0) {
        return;
    }
    INTEROP_FATAL("%s, golden: '%s', curr: [length: %d, chars: '%s']", comment, golden, str.length, str.chars);
}

// Primitives

OH_Boolean ost_primitives_negateBooleanImpl(OH_Boolean value)
{
    return !value;
}

OH_Int32 ost_primitives_incrementIntImpl(OH_Int32 value)
{
    return value + 1;
}

OH_Number ost_primitives_doubleNumberImpl(const OH_Number* value)
{
    OH_Number result;
    result.tag = value->tag;
    if (value->tag == INTEROP_TAG_FLOAT32) {
        result.f32 = value->f32 * 2.0f;
    } else {
        result.i32 = value->i32 * 2;
    }
    return result;
}

OH_String ost_primitives_reverseStringImpl(const OH_String* value)
{
    OH_Int32 len = value->length;
    char* reversed = reinterpret_cast<char*>(malloc(len + 1));
    for (OH_Int32 i = 0; i < len; i++) {
        reversed[i] = value->chars[len - 1 - i];
    }
    reversed[len] = '\0';
    return { .chars = reversed, .length = len };
}

OH_Buffer ost_primitives_reverseBufferImpl(const OH_Buffer* value)
{
    OH_Int64 len = value->length;
    uint8_t* src = reinterpret_cast<uint8_t*>(value->data);
    uint8_t* reversed = new uint8_t[len];
    for (OH_Int64 i = 0; i < len; i++) {
        reversed[i] = src[len - 1 - i];
    }
    OH_Buffer result;
    result.resource = {
        .resourceId = 0,
        .hold = [](const OH_Int32 resourceId) -> void {},
        .release = [](const OH_Int32 resourceId) -> void {}
    };
    result.data = reinterpret_cast<InteropNativePointer>(reversed);
    result.length = len;
    return result;
}

OH_Int64 ost_primitives_negateBigIntImpl(OH_Int64 value)
{
    return -value;
}

// Enum

OH_UNIT_OST_PlainEnum ost_enums_checkPlainEnumImpl(OH_UNIT_OST_PlainEnum value, OH_Int32 step)
{
    return (OH_UNIT_OST_PlainEnum) ((value + step) % 3);
}

OH_UNIT_OST_IntEnum ost_enums_checkIntEnumImpl(OH_UNIT_OST_IntEnum enumValue, OH_Int32 value)
{
    if (OH_UNIT_OST_INT_ENUM_E1 != 1) {
        INTEROP_FATAL("Enum OSTINT_ENUM_E1 %d does not equal to: %d", OH_UNIT_OST_INT_ENUM_E1, -1);
    }

    if (enumValue != OH_UNIT_OST_INT_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equal OSTINT_ENUM_E1: %d", enumValue, OH_UNIT_OST_INT_ENUM_E1);
    }

    return OH_UNIT_OST_INT_ENUM_E3;
}

OH_UNIT_OST_LongEnum ost_enums_checkLongEnumImpl(OH_UNIT_OST_LongEnum enumValue)
{
    if (enumValue != OH_UNIT_OST_LONG_ENUM_POS) {
        INTEROP_FATAL("LongEnum param %d does not equal LONG_ENUM_POS: %d", enumValue, OH_UNIT_OST_LONG_ENUM_POS);
    }
    return OH_UNIT_OST_LONG_ENUM_NEG;
}

OH_UNIT_OST_LegacyEnum ost_enums_checkLegacyEnumImpl(OH_UNIT_OST_LegacyEnum enumValue, OH_Int32 value)
{
    if (enumValue != (OH_UNIT_OST_LegacyEnum)value) {
        INTEROP_FATAL("LegacyEnum param %d does not equal value: %d", enumValue, value);
    }
    if (OH_UNIT_OST_LEGACY_ENUM_FIRST != OH_UNIT_OST_LEGACY_ENUM_LEGACY_FIRST) {
        INTEROP_FATAL("FIRST %d does not equal LEGACY_FIRST: %d", OH_UNIT_OST_LEGACY_ENUM_FIRST, OH_UNIT_OST_LEGACY_ENUM_LEGACY_FIRST);
    }
    if (OH_UNIT_OST_LEGACY_ENUM_SECOND != OH_UNIT_OST_LEGACY_ENUM_LEGACY_SECOND) {
        INTEROP_FATAL("SECOND %d does not equal LEGACY_SECOND: %d", OH_UNIT_OST_LEGACY_ENUM_SECOND, OH_UNIT_OST_LEGACY_ENUM_LEGACY_SECOND);
    }
    if (OH_UNIT_OST_LEGACY_ENUM_THIRD != OH_UNIT_OST_LEGACY_ENUM_LEGACY_THIRD) {
        INTEROP_FATAL("THIRD %d does not equal LEGACY_THIRD: %d", OH_UNIT_OST_LEGACY_ENUM_THIRD, OH_UNIT_OST_LEGACY_ENUM_LEGACY_THIRD);
    }
    return OH_UNIT_OST_LEGACY_ENUM_SECOND;
}

OH_UNIT_OST_StringEnum ost_enums_checkStringEnumImpl(OH_UNIT_OST_StringEnum enumValue, const OH_String* value)
{
    if (enumValue != OH_UNIT_OST_STRING_ENUM_S1) {
        INTEROP_FATAL("StringEnum param %d does not equal STRING_ENUM_S1: %d", enumValue, OH_UNIT_OST_STRING_ENUM_S1);
    }
    AssertEqStr("one", *value, "StringEnum value does not equal 'one'");
    return OH_UNIT_OST_STRING_ENUM_S2;
}

// Sequence

OH_Int32 ost_sequences_checkOSTSequenceImpl(const OH_UNIT_OST_Array_Int32* value)
{
    OH_Int32 length = value->length;
    if (length == 0) {
        return 0;
    }

    OH_Int32* array = value->array;
    OH_Int32 firstValue = array[0];
    OH_Int32 lastValue = array[length - 1];
    if (firstValue != 3) {
        INTEROP_FATAL("The first sequence value %d does not equal to 3", firstValue);
    }
    if (lastValue != -7) {
        INTEROP_FATAL("The last sequence value %d does not equal to -7", firstValue);
    }
    return length;
}

OH_UNIT_OST_Array_Boolean ost_sequences_getOSTSequenceBooleanImpl()
{
    OH_UNIT_OST_Array_Boolean sequence;
    sequence.length = 2;
    sequence.array = new OH_Boolean[2] { false, true };
    return sequence;
}

OH_UNIT_OST_Array_Int32 ost_sequences_getOSTSequenceIntImpl()
{
    OH_UNIT_OST_Array_Int32 sequence;
    sequence.length = 3;
    sequence.array = new OH_Int32[3] { 3, 5, 7 };
    return sequence;
}

// Map

OH_UNIT_OST_Map_Int32_String ost_maps_getOSTMapIntStringImpl()
{
    int size = 2;
    OH_UNIT_OST_Map_Int32_String map = {};
    map.size = size;
    map.keys = reinterpret_cast<OH_Int32*>(malloc(size * sizeof(OH_Int32)));
    map.values = reinterpret_cast<OH_String*>(malloc(size * sizeof(OH_String)));
    map.keys[0] = 1;
    map.keys[1] = 5;
    map.values[0] = int_to_string(11);
    map.values[1] = int_to_string(55);
    return map;
}

void ost_maps_checkOSTMapIntIntImpl(const OH_UNIT_OST_Map_Int32_Int32* map)
{
    AssertEqInt(2, map->size, "map size does not equal to 2");
    AssertEqInt(3, map->keys[0], "map key[0] does not equal to 3");
    AssertEqInt(7, map->keys[1], "map key[1] does not equal to 7");
    AssertEqInt(33, map->values[0], "map value[0] does not equal to 33");
    AssertEqInt(77, map->values[1], "map value[1] does not equal to 77");
}

void ost_maps_checkOSTMapBooleanStringImpl(const OH_UNIT_OST_Map_Boolean_String* map)
{
    AssertEqInt(2, map->size, "map size does not equal to 2");
    AssertEqBool(true, map->keys[0], "map key[0] does not equal to true");
    AssertEqBool(false, map->keys[1], "map key[1] does not equal to false");
    AssertEqStr("true", map->values[0], "map value[0] does not equal to 'true'");
    AssertEqStr("false", map->values[1], "map value[1] does not equal to 'false'");
}

// Function

OH_String ost_functions_getOSTFunctionBooleanIntStringImpl(OH_Boolean flag, OH_Int32 v)
{
    return int_to_string(flag ? v * 5 : v + 5);
}

// Callback

static OH_UNIT_OST_CallbackResource CALLBACK_RESOURCE = {
    .resourceId = 0,
    .hold = [](const OH_Int32 resourceId) -> void {},
    .release = [](const OH_Int32 resourceId) -> void {}
};

void ost_callbacks_checkCallbackIntVoidImpl(const OH_UNIT_OST_Callback_I32_Void* callback) {
    callback->call(callback->resource.resourceId, 9);
}

OH_UNIT_OST_Callback_I32_Void ost_callbacks_getCallbackIntVoidImpl()
{
    return {
        .resource=CALLBACK_RESOURCE,
        .call=[](const OH_Int32 resourceId, const OH_Int32 x)
        {
            printf("Call from getCallbackIntVoid callback x: %d\n", x);
            if (x != 2)
                INTEROP_FATAL("x %d does not equal : %d", x, 2);

        },
        .callSync=[](OH_UNIT_OST_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 x)
        {
            if (x != 2)
                INTEROP_FATAL("x %d does not equal : %d", x, 2);
        }
    };
}

OH_UNIT_OST_Callback_I32_I32 ost_callbacks_getCallbackIntIntImpl()
{
    return {
        .resource=CALLBACK_RESOURCE,
        .call=[](const OH_Int32 resourceId, const OH_Int32 x, const OH_UNIT_OST_Callback_I32_Void continuation)
        {
            continuation.call(continuation.resource.resourceId, 3 * x);
        },
        .callSync=[](OH_UNIT_OST_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 x, const OH_UNIT_OST_Callback_I32_Void continuation)
        {
            continuation.callSync(vmContext, continuation.resource.resourceId, 3 * x);
        }
    };
}

void ost_callbacks_checkCallbackBooleanIntStringImpl(const OH_UNIT_OST_Callback_Boolean_I32_String* callback) {
     OH_UNIT_OST_Callback_String_Void continuation = {
        .resource=CALLBACK_RESOURCE,
        .call=[](const OH_Int32 resourceId, const OH_String value)
        {
            if (strcmp("abc", value.chars) != 0)
                INTEROP_FATAL("String %s does not equal : %s", value.chars, "abc");
        },
        .callSync=[](OH_UNIT_OST_VMContext vmContext, const OH_Int32 resourceId, const OH_String value)
        {
            if (strcmp("abc", value.chars) != 0)
                INTEROP_FATAL("String %s does not equal : %s", value.chars, "abc");
        }
    };
    callback->call(callback->resource.resourceId, true, 12, continuation);
}

OH_UNIT_OST_Callback_Boolean_I32_String ost_callbacks_getCallbackBooleanIntStringImpl()
{
    return {
        .resource=CALLBACK_RESOURCE,
        .call=[](const OH_Int32 resourceId, const OH_Boolean b, const OH_Int32 v, const OH_UNIT_OST_Callback_String_Void continuation)
        {
            OH_String result = int_to_string(b ? v * 5 : v + 5);
            continuation.call(continuation.resource.resourceId, result);
        },
        .callSync=[](OH_UNIT_OST_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean b, const OH_Int32 v, const OH_UNIT_OST_Callback_String_Void continuation)
        {
            OH_String result = int_to_string(b ? v * 5 : v + 5);
            continuation.callSync(vmContext, continuation.resource.resourceId, result);
        }
    };
}

// Promise

class AbstractHandler {
public:
    virtual void Execute() = 0;
    virtual void Complete() = 0;
    virtual ~AbstractHandler() = default;
};

template<typename CallbackType>
class AbstractPromiseHandler: AbstractHandler {
protected:
    CallbackType callback;
public:
    AbstractPromiseHandler(CallbackType callback): callback(callback) {
        callback.resource.hold(callback.resource.resourceId);
    }
};
class GetPromiseVoidHandler: AbstractPromiseHandler<OH_UNIT_OST_Callback_Opt_Array_String_Void> {
public:
    GetPromiseVoidHandler(OH_UNIT_OST_Callback_Opt_Array_String_Void callback): AbstractPromiseHandler(callback) {
    }
    void Execute() {
        printf("[Native App] GetPromiseVoidHandler execute()\n");
    }
    void Complete() {
        printf("[Native App] GetPromiseVoidHandler complete()\n");
        callback.call(callback.resource.resourceId,
            { .tag = INTEROP_TAG_UNDEFINED }
        );
        callback.resource.release(callback.resource.resourceId);
        delete this;
    }
};

void ost_promises_getOSTPromiseVoidImpl(
    OH_UNIT_OST_VMContext vmContext,
    OH_UNIT_OST_AsyncWorkerPtr asyncWorker,
    const OH_UNIT_OST_Callback_Opt_Array_String_Void* out) {
    auto work = asyncWorker->createWork(
        vmContext,
        new GetPromiseVoidHandler(*out),
        [](void* handler) { ((AbstractHandler*)handler)->Execute(); },
        [](void* handler) { ((AbstractHandler*)handler)->Complete(); });
    work.queue(work.workId);
}

class GetPromiseIntHandler: AbstractPromiseHandler<OH_UNIT_OST_Callback_Opt_I32_Opt_Array_String_Void> {
private:
    int result = 0;
public:
    GetPromiseIntHandler(OH_UNIT_OST_Callback_Opt_I32_Opt_Array_String_Void callback): AbstractPromiseHandler(callback) {
    }
    void Execute() {
        result = 7;
    }
    void Complete() {
        callback.call(callback.resource.resourceId,
            { .tag = INTEROP_TAG_INT32, .value = result },
            { .tag = INTEROP_TAG_UNDEFINED }
        );
        callback.resource.release(callback.resource.resourceId);
        delete this;
    }
};


void ost_promises_getOSTAsyncIntImpl(
    OH_UNIT_OST_VMContext vmContext,
    OH_UNIT_OST_AsyncWorkerPtr asyncWorker,
    const OH_UNIT_OST_Callback_Opt_I32_Opt_Array_String_Void* out) {
    auto work = asyncWorker->createWork(
        vmContext,
        new GetPromiseIntHandler(*out),
        [](void* handler) { ((AbstractHandler*)handler)->Execute(); },
        [](void* handler) { ((AbstractHandler*)handler)->Complete(); });
    work.queue(work.workId);
}

void ost_promises_getOSTPromiseIntImpl(
    OH_UNIT_OST_VMContext vmContext,
    OH_UNIT_OST_AsyncWorkerPtr asyncWorker,
    const OH_UNIT_OST_Callback_Opt_I32_Opt_Array_String_Void* out) {
    ost_promises_getOSTAsyncIntImpl(vmContext, asyncWorker, out);
}

class GetPromiseBooleanIntStringHandler: AbstractPromiseHandler<OH_UNIT_OST_Callback_Opt_String_Opt_Array_String_Void> {
public:
    GetPromiseBooleanIntStringHandler(OH_UNIT_OST_Callback_Opt_String_Opt_Array_String_Void callback): AbstractPromiseHandler(callback) {
    }
    void Execute() {
    }
    void Complete() {
        callback.call(callback.resource.resourceId,
            { .tag = INTEROP_TAG_STRING, .value = { .chars = "hello", .length = string_len("hello") } },
            { .tag = INTEROP_TAG_UNDEFINED });
        callback.resource.release(callback.resource.resourceId);
        delete this;
    }
};

void ost_promises_getOSTPromiseBooleanIntStringImpl(
    OH_UNIT_OST_VMContext vmContext,
    OH_UNIT_OST_AsyncWorkerPtr asyncWorker,
    OH_Boolean flag,
    OH_Int32 value,
    const OH_UNIT_OST_Callback_Opt_String_Opt_Array_String_Void* out)
{
    auto work = asyncWorker->createWork(
        vmContext,
        new GetPromiseBooleanIntStringHandler(*out),
        [](void* handler) { ((AbstractHandler*)handler)->Execute(); },
        [](void* handler) { ((AbstractHandler*)handler)->Complete(); });

    work.queue(work.workId);
}

// Generics

OH_Boolean ost_generics_unboxBooleanImpl(const OH_UNIT_OST_GenericBox_Boolean* box) {
    return box->value;
}

OH_String ost_generics_unboxStringImpl(const OH_UNIT_OST_GenericBox_String* box)
{
    return box->value;
}

OH_UNIT_OST_GenericBox_Number ost_generics_unboxBoxImpl(const OH_UNIT_OST_GenericBox_GenericBox_Number* box)
{
    return box->value;
}

OH_UNIT_OST_Unbox ost_generics_unboxStringNumberImpl(const OH_UNIT_OST_GenericBox2_String_Number* box)
{
    return { .numberValue = box->value2, .stringValue = box->value1 };
}

OH_UNIT_OST_Unbox ost_generics_unboxBoxStringBoxNumberImpl(const OH_UNIT_OST_GenericBox2_GenericBox_String_GenericBox_Number* box)
{
    return { .numberValue = box->value2.value, .stringValue = box->value1.value };
}

// Namespace

OH_Number ost_namespaces_outer_inner_getValueImpl(const OH_UNIT_OST_OuterData* data)
{
    return data->value;
}

// Optional

OH_Int32 ost_optionals_sumOptionalAttributesImpl(const OH_UNIT_OST_TestOptional* arg)
{
    return arg->value + (arg->optValue.tag == INTEROP_TAG_UNDEFINED ? 0 : arg->optValue.value);
}

OH_Int32 ost_optionals_idOrZeroImpl(const OH_UNIT_OST_Opt_Int32* arg)
{
    return arg->tag == INTEROP_TAG_UNDEFINED ? 0 : arg->value;
}

// Override

struct MultiCtorData {
    char* name;
    int32_t age;
};

OH_NativePointer ost_overrides_MultiCtors_construct0Impl(const OH_String* name)
{
    auto* data = new MultiCtorData();
    data->name = new char[name->length + 1];
    memcpy(data->name, name->chars, name->length);
    data->name[name->length] = '\0';
    data->age = 0;
    return data;
}

OH_NativePointer ost_overrides_MultiCtors_construct1Impl(OH_Int32 age)
{
    auto* data = new MultiCtorData();
    data->name = new char[1];
    data->name[0] = '\0';
    data->age = age;
    return data;
}

OH_NativePointer ost_overrides_MultiCtors_construct2Impl(const OH_String* name, OH_Int32 age)
{
    auto* data = new MultiCtorData();
    data->name = new char[name->length + 1];
    memcpy(data->name, name->chars, name->length);
    data->name[name->length] = '\0';
    data->age = age;
    return data;
}

OH_String ost_overrides_MultiCtors_getNameImpl(OH_NativePointer thisPtr)
{
    auto* data = reinterpret_cast<MultiCtorData*>(thisPtr);
    return { .chars = data->name, .length = string_len(data->name) };
}

void ost_overrides_MultiCtors_setNameImpl(OH_NativePointer thisPtr, const OH_String* name)
{
    auto* data = reinterpret_cast<MultiCtorData*>(thisPtr);
    delete[] data->name;
    data->name = new char[name->length + 1];
    memcpy(data->name, name->chars, name->length);
    data->name[name->length] = '\0';
}

OH_Int32 ost_overrides_MultiCtors_getAgeImpl(OH_NativePointer thisPtr)
{
    auto* data = reinterpret_cast<MultiCtorData*>(thisPtr);
    return data->age;
}

void ost_overrides_MultiCtors_setAgeImpl(OH_NativePointer thisPtr, OH_Int32 age)
{
    auto* data = reinterpret_cast<MultiCtorData*>(thisPtr);
    data->age = age;
}

void ost_overrides_MultiCtors_destructImpl(OH_NativePointer thisPtr)
{
    auto* data = reinterpret_cast<MultiCtorData*>(thisPtr);
    delete[] data->name;
    delete data;
}

OH_NativePointer ost_overrides_MultiMethods_constructImpl()
{
    return new MultiCtorData();
}
void ost_overrides_MultiMethods_destructImpl(OH_NativePointer thisPtr)
{
    delete reinterpret_cast<MultiCtorData*>(thisPtr);
}
OH_Int32 ost_overrides_MultiMethods_valueOf0Impl(OH_NativePointer thisPtr, OH_Int32 n) {
    return n;
}
OH_Int32 ost_overrides_MultiMethods_valueOf1Impl(OH_NativePointer thisPtr, const OH_String* s)
{
    return s->length;
}
OH_Int32 ost_overrides_MultiMethods_valueOf2Impl(OH_NativePointer thisPtr, OH_Int32 n, const OH_String* s)
{
    return n + s->length;
}

// Union

OH_Int32 ost_unions_checkUnionInterfaceImpl(const OH_UNIT_OST_UnionInterface* arg)
{
    return arg->prop.selector;
}

OH_Int32 ost_unions_checkUnionArgImpl(const OH_UNIT_OST_Union_String_PlainEnum_Array_Boolean_Array_PlainEnum* arg)
{
    return arg->selector;
}

OH_Int32 ost_unions_checkGenericUnionImpl(const OH_UNIT_OST_Union_String_GenericBox_String_GenericBox_UnionInterface* arg)
{
    return arg->selector;
}

// Error

OH_UNIT_OST_ThrowsWrapper_I32 ost_errors_getOSTErrorBooleanIntImpl(OH_Boolean flag) {

    if (!flag)
        return {
            .hasException = false,
            .value = 17,
         };

    return {
        .hasException=true,
        .exception={
            .kind=EXCEPTION_INTERFACE,
            .interface= {
                .code=1,
                .message=to_string("Error from getOSTErrorBooleanInt")
            }
        }
    };
}


OH_UNIT_OST_ThrowsWrapper_Void ost_errors_checkOSTErrorIntBooleanImpl(OH_Int32 value, OH_Boolean flag) {

    if (!flag)
        return { .hasException = false };

    return {
        .hasException=true,
        .exception={
            .kind=EXCEPTION_INTERFACE,
            .interface= {
                .code=1,
                .message=to_string("Error from checkOSTErrorIntBoolean")
            }
        }
    };
}

// Materialized

struct MaterializedData {
    OH_String readOnlyValue;
};

OH_NativePointer ost_materialized_Materialized_constructImpl(const OH_String* readOnlyValue)
{
    auto* data = new MaterializedData();
    data->readOnlyValue = *readOnlyValue;
    return data;
}

OH_String ost_materialized_Materialized_getReadOnlyImpl(OH_NativePointer thisPtr)
{
    auto* data = reinterpret_cast<MaterializedData*>(thisPtr);
    return data->readOnlyValue;
}

OH_Int32 ost_materialized_Materialized_getReadWriteImpl(OH_NativePointer thisPtr)
{
    return 14;
}

void ost_materialized_Materialized_setReadWriteImpl(OH_NativePointer thisPtr, OH_Int32 readWrite)
{
    // no-op: always 14 no matter what
}

void ost_materialized_Materialized_destructImpl(OH_NativePointer thisPtr)
{
    auto* data = reinterpret_cast<MaterializedData*>(thisPtr);
    delete data;
}

// StaticMaterialized

OH_String ost_materialized_StaticMaterialized_reverseImpl(const OH_String* s)
{
    return ost_primitives_reverseStringImpl(s);
}

// Inheritance

class BaseGesture {
public:
    virtual OH_UNIT_OST_GestureType getType() = 0;
    virtual ~BaseGesture() = default;
};

class DerivedGesture1 : public BaseGesture {
public:
    OH_UNIT_OST_GestureType getType() override
    {
        return OH_UNIT_OST_GestureType::OH_UNIT_OST_GESTURE_TYPE_First;
    }
};

class DerivedGesture2 : public BaseGesture {
public:
    OH_UNIT_OST_GestureType getType() override
    {
        return OH_UNIT_OST_GestureType::OH_UNIT_OST_GESTURE_TYPE_Second;
    }
};

OH_NativePointer ost_inheritance_BaseGesture_constructImpl()
{
    return new DerivedGesture2();
}
void ost_inheritance_BaseGesture_destructImpl(OH_NativePointer thisPtr)
{
    delete reinterpret_cast<BaseGesture*>(thisPtr);
}
OH_UNIT_OST_GestureType ost_inheritance_BaseGesture_getTypeImpl(OH_NativePointer thisPtr)
{
    BaseGesture* gesturePtr = reinterpret_cast<BaseGesture*>(thisPtr);
    return gesturePtr->getType();
}
OH_UNIT_OST_BaseGesture ost_inheritance_BaseGesture_createGesture2Impl()
{
    BaseGesture* ptr = new DerivedGesture2();
    return reinterpret_cast<OH_UNIT_OST_BaseGesture>(ptr);
}
OH_NativePointer ost_inheritance_DerivedGesture1_constructImpl()
{
    return {};
}
void ost_inheritance_DerivedGesture1_destructImpl(OH_NativePointer thisPtr) {
}
OH_NativePointer ost_inheritance_DerivedGesture2_constructImpl()
{
    return {};
}
void ost_inheritance_DerivedGesture2_destructImpl(OH_NativePointer thisPtr) {
}
OH_UNIT_OST_GestureType ost_inheritance_getBaseGestureTypeImpl(OH_NativePointer ptr)
{
    BaseGesture* gesturePtr = reinterpret_cast<BaseGesture*>(ptr);
    return gesturePtr->getType();
}
