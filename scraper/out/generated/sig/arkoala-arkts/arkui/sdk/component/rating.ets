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
import { Bindable, CommonConfiguration, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ResourceStr } from "./units"
import { Resource } from "@global.resource"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface RatingOptions {
    rating: number | Bindable<number> | undefined;
    indicator?: boolean;
}
export declare interface StarStyleOptions {
    backgroundUri: ResourceStr;
    foregroundUri: ResourceStr;
    secondaryUri?: ResourceStr;
}
export declare interface RatingConfiguration extends CommonConfiguration<RatingConfiguration> {
    rating: number;
    indicator: boolean;
    stars: number;
    stepSize: number;
    triggerChange: ((value0: number) => void);
}
export type OnRatingChangeCallback = (rating: number) => void;
export interface RatingAttribute extends CommonMethod {
    stars(value: number | undefined): this {
        throw new Error("Unimplemented method stars")
    }
    stepSize(value: number | undefined): this {
        throw new Error("Unimplemented method stepSize")
    }
    starStyle(value: StarStyleOptions | undefined): this {
        throw new Error("Unimplemented method starStyle")
    }
    onChange(value: OnRatingChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    contentModifier(value: ContentModifier<RatingConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    attributeModifier(value: AttributeModifier<RatingAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRatingStyle extends ArkCommonMethodStyle implements RatingAttribute {
    stars_value?: number | undefined
    stepSize_value?: number | undefined
    starStyle_value?: StarStyleOptions | undefined
    onChange_value?: OnRatingChangeCallback | undefined
    contentModifier_value?: ContentModifier<RatingConfiguration> | undefined
    attributeModifier_value?: AttributeModifier<RatingAttribute> | AttributeModifier<CommonMethod> | undefined
    stars(value: number | undefined): this {
        return this
    }
    stepSize(value: number | undefined): this {
        return this
    }
    starStyle(value: StarStyleOptions | undefined): this {
        return this
    }
    onChange(value: OnRatingChangeCallback | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<RatingConfiguration> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<RatingAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Rating(
    options?: RatingOptions,
    @memo
    content_?: () => void,
): RatingAttribute { throw new Error("")}
