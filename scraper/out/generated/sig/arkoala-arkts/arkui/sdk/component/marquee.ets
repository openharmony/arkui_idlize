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
import { ResourceColor, Length } from "./units"
import { Color, FontWeight, MarqueeUpdateStrategy } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface MarqueeOptions {
    start: boolean;
    step?: number;
    loop?: number;
    fromStart?: boolean;
    src: string;
}
export interface MarqueeAttribute extends CommonMethod {
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontSize(value: Length | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    allowScale(value: boolean | undefined): this {
        throw new Error("Unimplemented method allowScale")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    fontFamily(value: string | Resource | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    marqueeUpdateStrategy(value: MarqueeUpdateStrategy | undefined): this {
        throw new Error("Unimplemented method marqueeUpdateStrategy")
    }
    onStart(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onStart")
    }
    onBounce(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onBounce")
    }
    onFinish(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onFinish")
    }
    attributeModifier(value: AttributeModifier<MarqueeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkMarqueeStyle extends ArkCommonMethodStyle implements MarqueeAttribute {
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: Length | undefined
    allowScale_value?: boolean | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    fontFamily_value?: string | Resource | undefined
    marqueeUpdateStrategy_value?: MarqueeUpdateStrategy | undefined
    onStart_value?: (() => void) | undefined
    onBounce_value?: (() => void) | undefined
    onFinish_value?: (() => void) | undefined
    attributeModifier_value?: AttributeModifier<MarqueeAttribute> | AttributeModifier<CommonMethod> | undefined
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    fontSize(value: Length | undefined): this {
        return this
    }
    allowScale(value: boolean | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    fontFamily(value: string | Resource | undefined): this {
        return this
    }
    marqueeUpdateStrategy(value: MarqueeUpdateStrategy | undefined): this {
        return this
    }
    onStart(value: (() => void) | undefined): this {
        return this
    }
    onBounce(value: (() => void) | undefined): this {
        return this
    }
    onFinish(value: (() => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<MarqueeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Marquee(
    options: MarqueeOptions,
    @memo
    content_?: () => void,
): MarqueeAttribute { throw new Error("")}
