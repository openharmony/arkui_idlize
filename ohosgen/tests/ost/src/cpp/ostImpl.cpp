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

// Enum

OH_UNIT_OST_OSTIntEnum ost_enums_checkOSTIntEnumImpl(OH_UNIT_OST_OSTIntEnum enumValue, OH_Int32 value)
{
    if (OH_UNIT_OST_OSTINT_ENUM_E1 != 1) {
        INTEROP_FATAL("Enum OSTINT_ENUM_E1 %d does not equal to: %d", OH_UNIT_OST_OSTINT_ENUM_E1, -1);
    }

    if (enumValue != OH_UNIT_OST_OSTINT_ENUM_E1) {
        INTEROP_FATAL("Enum param value1 %d does not equal OSTINT_ENUM_E1: %d", enumValue, OH_UNIT_OST_OSTINT_ENUM_E1);
    }

    return OH_UNIT_OST_OSTINT_ENUM_E3;
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
