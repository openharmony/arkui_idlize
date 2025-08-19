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
import { DotIndicator, DigitIndicator } from "./swiper"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare class IndicatorComponentController {
    constructor()
    showNext(): void
    showPrevious(): void
    changeIndex(index: number, useAnimation?: boolean): void
}
export interface IndicatorComponentAttribute extends CommonMethod {
    initialIndex(value: number | undefined): this {
        throw new Error("Unimplemented method initialIndex")
    }
    count(value: number | undefined): this {
        throw new Error("Unimplemented method count")
    }
    style(value: DotIndicator | DigitIndicator | undefined): this {
        throw new Error("Unimplemented method style")
    }
    loop(value: boolean | undefined): this {
        throw new Error("Unimplemented method loop")
    }
    vertical(value: boolean | undefined): this {
        throw new Error("Unimplemented method vertical")
    }
    onChange(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    attributeModifier(value: AttributeModifier<IndicatorComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkIndicatorComponentStyle extends ArkCommonMethodStyle implements IndicatorComponentAttribute {
    initialIndex_value?: number | undefined
    count_value?: number | undefined
    style_value?: DotIndicator | DigitIndicator | undefined
    loop_value?: boolean | undefined
    vertical_value?: boolean | undefined
    onChange_value?: ((value0: number) => void) | undefined
    initialIndex(value: number | undefined): this {
        return this
    }
    count(value: number | undefined): this {
        return this
    }
    style(value: DotIndicator | DigitIndicator | undefined): this {
        return this
    }
    loop(value: boolean | undefined): this {
        return this
    }
    vertical(value: boolean | undefined): this {
        return this
    }
    onChange(value: ((value0: number) => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<IndicatorComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function IndicatorComponent(
    controller?: IndicatorComponentController,
    @memo
    content_?: () => void,
): IndicatorComponentAttribute { throw new Error("")}
