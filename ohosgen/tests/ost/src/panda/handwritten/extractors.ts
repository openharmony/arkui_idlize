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

import { KPointer, MaterializedBaseTag } from "@koalaui/interop"
import { BaseGesture, DerivedGesture1, DerivedGesture2, GestureType, getBaseGestureType } from "#compat"

export namespace extractors {
    export function deserialize_ost_inheritance_BaseGesture(ptr: KPointer): BaseGesture {
        const gestureType = getBaseGestureType(ptr)
        switch (gestureType) {
            case GestureType.First: return new DerivedGesture1(MaterializedBaseTag.NOP, ptr)
            default: return new DerivedGesture2(MaterializedBaseTag.NOP, ptr)
        }
    }
}