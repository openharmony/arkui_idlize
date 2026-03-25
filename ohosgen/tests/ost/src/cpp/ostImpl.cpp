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

#include "unit_ost.h"

#include <stdio.h>

// Enum

OH_UNIT_OST_OSTIntEnum ost_enums_checkOSTIntEnumImpl(OH_UNIT_OST_OSTIntEnum enumValue, OH_Int32 value)
{
    if (OH_UNIT_OST_OSTINT_ENUM_E1 != 1)
        INTEROP_FATAL("Enum OSTINT_ENUM_E1 %d does not equal to: %d", OH_UNIT_OST_OSTINT_ENUM_E1, -1);

    if (enumValue != OH_UNIT_OST_OSTINT_ENUM_E1)
        INTEROP_FATAL("Enum param value1 %d does not equal OSTINT_ENUM_E1: %d", enumValue, OH_UNIT_OST_OSTINT_ENUM_E1);

    return OH_UNIT_OST_OSTINT_ENUM_E3;
}

// Sequence

OH_Int32 ost_sequences_checkOSTSequenceImpl(const OH_UNIT_OST_Array_Int32* value)
{
    OH_Int32 length = value->length;
    if (length == 0) return 0;

    OH_Int32* array = value->array;
    OH_Int32 firstValue = array[0];
    OH_Int32 lastValue = array[length - 1];
    if (firstValue != 3)
        INTEROP_FATAL("The first sequence value %d does not equal to 3", firstValue);
    if (lastValue != -7)
        INTEROP_FATAL("The last sequence value %d does not equal to -7", firstValue);
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

OH_UNIT_OST_Callback_I32_I32 ost_callbacks_getCallbackIntImpl()
{
    printf("[Native] call ost_callbacks_getCallbackIntImpl()\n");

    OH_UNIT_OST_CallbackResource CALLBACKs_RESOURCE_IMPL = {
        .resourceId=0,
        .hold=[](const OH_Int32 resourceId) -> void {},
        .release=[](const OH_Int32 resourceId) -> void {}
    };

    return {
        .resource=CALLBACKs_RESOURCE_IMPL,
        .call=[](const OH_Int32 resourceId, const OH_Int32 x, const OH_UNIT_OST_Callback_I32_Void continuation) {
            printf("[Native] call native callback\n");
        },
        .callSync=[](OH_UNIT_OST_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 x, const OH_UNIT_OST_Callback_I32_Void continuation) {
            printf("[Native] callSync native callback\n");
            continuation.callSync(vmContext, continuation.resource.resourceId, 3 * x);
        }
    };
}

