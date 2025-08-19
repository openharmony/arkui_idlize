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
import { MultiShadowOptions, CommonConfiguration, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ResourceStr, Dimension, ResourceColor, Length } from "./units"
import { Resource } from "@global.resource"
import { Color } from "./enums"
import { LinearGradient } from "./dataPanel"
import { CustomBuilder } from "./builder"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface GaugeOptions {
    value: number;
    min?: number;
    max?: number;
}
export declare interface GaugeShadowOptions extends MultiShadowOptions {
}
export declare interface GaugeIndicatorOptions {
    icon?: ResourceStr;
    space?: Dimension;
}
export declare interface GaugeConfiguration extends CommonConfiguration<GaugeConfiguration> {
    value: number;
    min: number;
    max: number;
}
export interface GaugeAttribute extends CommonMethod {
    value(value: number | undefined): this {
        throw new Error("Unimplemented method value")
    }
    startAngle(value: number | undefined): this {
        throw new Error("Unimplemented method startAngle")
    }
    endAngle(value: number | undefined): this {
        throw new Error("Unimplemented method endAngle")
    }
    colors(value: ResourceColor | LinearGradient | Array<[ ResourceColor | LinearGradient, number ]> | undefined): this {
        throw new Error("Unimplemented method colors")
    }
    strokeWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method strokeWidth")
    }
    description(value: CustomBuilder | undefined): this {
        throw new Error("Unimplemented method description")
    }
    trackShadow(value: GaugeShadowOptions | undefined): this {
        throw new Error("Unimplemented method trackShadow")
    }
    indicator(value: GaugeIndicatorOptions | undefined): this {
        throw new Error("Unimplemented method indicator")
    }
    privacySensitive(value: boolean | undefined): this {
        throw new Error("Unimplemented method privacySensitive")
    }
    contentModifier(value: ContentModifier<GaugeConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    attributeModifier(value: AttributeModifier<GaugeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkGaugeStyle extends ArkCommonMethodStyle implements GaugeAttribute {
    value_value?: number | undefined
    startAngle_value?: number | undefined
    endAngle_value?: number | undefined
    colors_value?: ResourceColor | LinearGradient | Array<[ ResourceColor | LinearGradient, number ]> | undefined
    strokeWidth_value?: Length | undefined
    description_value?: CustomBuilder | undefined
    trackShadow_value?: GaugeShadowOptions | undefined
    indicator_value?: GaugeIndicatorOptions | undefined
    privacySensitive_value?: boolean | undefined
    contentModifier_value?: ContentModifier<GaugeConfiguration> | undefined
    attributeModifier_value?: AttributeModifier<GaugeAttribute> | AttributeModifier<CommonMethod> | undefined
    value(value: number | undefined): this {
        return this
    }
    startAngle(value: number | undefined): this {
        return this
    }
    endAngle(value: number | undefined): this {
        return this
    }
    colors(value: ResourceColor | LinearGradient | Array<[ ResourceColor | LinearGradient, number ]> | undefined): this {
        return this
    }
    strokeWidth(value: Length | undefined): this {
        return this
    }
    description(value: CustomBuilder | undefined): this {
        return this
    }
    trackShadow(value: GaugeShadowOptions | undefined): this {
        return this
    }
    indicator(value: GaugeIndicatorOptions | undefined): this {
        return this
    }
    privacySensitive(value: boolean | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<GaugeConfiguration> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<GaugeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Gauge(
    options: GaugeOptions,
    @memo
    content_?: () => void,
): GaugeAttribute { throw new Error("")}
