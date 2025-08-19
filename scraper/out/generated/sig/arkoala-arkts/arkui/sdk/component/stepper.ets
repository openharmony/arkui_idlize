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
import { Bindable, CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface StepperOptions {
    index?: number | Bindable<number>;
}
export interface StepperAttribute extends CommonMethod {
    onFinish(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onFinish")
    }
    onSkip(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onSkip")
    }
    onChange(value: ((prevIndex: number,index: number) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    onNext(value: ((prevIndex: number,index: number) => void) | undefined): this {
        throw new Error("Unimplemented method onNext")
    }
    onPrevious(value: ((prevIndex: number,index: number) => void) | undefined): this {
        throw new Error("Unimplemented method onPrevious")
    }
    attributeModifier(value: AttributeModifier<StepperAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkStepperStyle extends ArkCommonMethodStyle implements StepperAttribute {
    onFinish_value?: (() => void) | undefined
    onSkip_value?: (() => void) | undefined
    onChange_value?: ((prevIndex: number,index: number) => void) | undefined
    onNext_value?: ((prevIndex: number,index: number) => void) | undefined
    onPrevious_value?: ((prevIndex: number,index: number) => void) | undefined
    onFinish(value: (() => void) | undefined): this {
        return this
    }
    onSkip(value: (() => void) | undefined): this {
        return this
    }
    onChange(value: ((prevIndex: number,index: number) => void) | undefined): this {
        return this
    }
    onNext(value: ((prevIndex: number,index: number) => void) | undefined): this {
        return this
    }
    onPrevious(value: ((prevIndex: number,index: number) => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<StepperAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Stepper(
    value?: StepperOptions,
    @memo
    content_?: () => void,
): StepperAttribute { throw new Error("")}
