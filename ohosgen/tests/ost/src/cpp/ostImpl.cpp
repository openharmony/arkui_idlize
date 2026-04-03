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
#include "unit_ost.h"

InteropInt32 string_len(const char* str)
{
    return static_cast<InteropInt32>(strlen(str));
}

OH_String int_to_string(OH_Int32 x)
{
    char result[10];
    sprintf(result, "%d", x);
    return { .chars = result, .length = string_len(result) };
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
            char value[11];
            sprintf(value,"%d", b ? v * 5 : v + 5);
            OH_String result = {.chars = value, .length = string_len(value)};
            continuation.call(continuation.resource.resourceId, result);
        },
        .callSync=[](OH_UNIT_OST_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean b, const OH_Int32 v, const OH_UNIT_OST_Callback_String_Void continuation)
        {
            char value[11];
            sprintf(value,"%d", b ? v * 5 : v + 5);
            OH_String result = {.chars = value, .length = string_len(value)};
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
