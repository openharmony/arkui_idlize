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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum ItemState {
    NORMAL = 0,
    Normal = 0,
    DISABLED = 1,
    Disabled = 1,
    WAITING = 2,
    Waiting = 2,
    SKIP = 3,
    Skip = 3
}
export interface StepperItemAttribute extends CommonMethod {
    prevLabel(value: string | undefined): this {
        throw new Error("Unimplemented method prevLabel")
    }
    nextLabel(value: string | undefined): this {
        throw new Error("Unimplemented method nextLabel")
    }
    status(value: ItemState | undefined): this {
        throw new Error("Unimplemented method status")
    }
    attributeModifier(value: AttributeModifier<StepperItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkStepperItemStyle extends ArkCommonMethodStyle implements StepperItemAttribute {
    prevLabel_value?: string | undefined
    nextLabel_value?: string | undefined
    status_value?: ItemState | undefined
    prevLabel(value: string | undefined): this {
        return this
    }
    nextLabel(value: string | undefined): this {
        return this
    }
    status(value: ItemState | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<StepperItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function StepperItem(
    
    @memo
    content_?: () => void,
): StepperItemAttribute { throw new Error("")}
