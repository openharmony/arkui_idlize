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
