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

import { SingleGenericType, DoubleGenericType } from "../../../generated/arkts"

export namespace typechecks {
    export function isGeneric_Test_unionSingleGenericType_Number<T>(genericType: SingleGenericType<T>) {
        return genericType.value instanceof number
    }
    export function isGeneric_Test_unionSingleGenericType_String<T>(genericType: SingleGenericType<T>) {
        return genericType.value instanceof string
    }
    export function isGeneric_Test_unionDoubleGenericType_Boolean_Number<T, S>(genericType: DoubleGenericType<T, S>) {
        return genericType.valueT instanceof boolean && genericType.valueS instanceof number
    }
    export function isGeneric_Test_unionDoubleGenericType_Number_String<T, S>(genericType: DoubleGenericType<T, S>) {
        return genericType.valueT instanceof number && genericType.valueS instanceof string
    }
}
