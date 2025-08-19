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
import { Axis, Color, CrownSensitivity } from "./enums"
import { ResourceStr, ResourceColor, Length, Dimension, SizeOptions } from "./units"
import { Resource } from "@global.resource"
import { LinearGradient } from "./dataPanel"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum SliderStyle {
    OUT_SET = 0,
    OutSet = 0,
    IN_SET = 1,
    InSet = 1,
    NONE = 2
}
export enum SliderChangeMode {
    BEGIN = 0,
    Begin = 0,
    MOVING = 1,
    Moving = 1,
    END = 2,
    End = 2,
    CLICK = 3,
    Click = 3
}
export enum SliderInteraction {
    SLIDE_AND_CLICK = 0,
    SLIDE_ONLY = 1,
    SLIDE_AND_CLICK_UP = 2
}
export declare interface SlideRange {
    from?: number;
    to?: number;
}
export declare interface SliderOptions {
    value?: number | Bindable<number> | undefined;
    min?: number;
    max?: number;
    step?: number;
    style?: SliderStyle;
    direction?: Axis;
    reverse?: boolean;
}
export enum SliderBlockType {
    DEFAULT = 0,
    IMAGE = 1,
    SHAPE = 2
}
export declare interface SliderBlockStyle {
    type: SliderBlockType;
    image?: ResourceStr;
}
export type SliderTriggerChangeCallback = (value: number, mode: SliderChangeMode) => void;
export declare interface SliderConfiguration extends CommonConfiguration<SliderConfiguration> {
    value: number;
    min: number;
    max: number;
    step: number;
    triggerChange: SliderTriggerChangeCallback;
}
export interface SliderAttribute extends CommonMethod {
    blockColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method blockColor")
    }
    trackColor(value: ResourceColor | LinearGradient | undefined): this {
        throw new Error("Unimplemented method trackColor")
    }
    selectedColor(value: ResourceColor | LinearGradient | undefined): this {
        throw new Error("Unimplemented method selectedColor")
    }
    showSteps(value: boolean | undefined): this {
        throw new Error("Unimplemented method showSteps")
    }
    trackThickness(value: Length | undefined): this {
        throw new Error("Unimplemented method trackThickness")
    }
    onChange(value: ((value: number,mode: SliderChangeMode) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    blockBorderColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method blockBorderColor")
    }
    blockBorderWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method blockBorderWidth")
    }
    stepColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method stepColor")
    }
    trackBorderRadius(value: Length | undefined): this {
        throw new Error("Unimplemented method trackBorderRadius")
    }
    selectedBorderRadius(value: Dimension | undefined): this {
        throw new Error("Unimplemented method selectedBorderRadius")
    }
    blockSize(value: SizeOptions | undefined): this {
        throw new Error("Unimplemented method blockSize")
    }
    blockStyle(value: SliderBlockStyle | undefined): this {
        throw new Error("Unimplemented method blockStyle")
    }
    stepSize(value: Length | undefined): this {
        throw new Error("Unimplemented method stepSize")
    }
    sliderInteractionMode(value: SliderInteraction | undefined): this {
        throw new Error("Unimplemented method sliderInteractionMode")
    }
    minResponsiveDistance(value: number | undefined): this {
        throw new Error("Unimplemented method minResponsiveDistance")
    }
    contentModifier(value: ContentModifier<SliderConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    slideRange(value: SlideRange | undefined): this {
        throw new Error("Unimplemented method slideRange")
    }
    digitalCrownSensitivity(value: CrownSensitivity | undefined): this {
        throw new Error("Unimplemented method digitalCrownSensitivity")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    showTips(value: boolean | undefined, content?: ResourceStr): this {
        throw new Error("Unimplemented method showTips")
    }
    attributeModifier(value: AttributeModifier<SliderAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSliderStyle extends ArkCommonMethodStyle implements SliderAttribute {
    blockColor_value?: ResourceColor | undefined
    trackColor_value?: ResourceColor | LinearGradient | undefined
    selectedColor_value?: ResourceColor | LinearGradient | undefined
    showSteps_value?: boolean | undefined
    trackThickness_value?: Length | undefined
    onChange_value?: ((value: number,mode: SliderChangeMode) => void) | undefined
    blockBorderColor_value?: ResourceColor | undefined
    blockBorderWidth_value?: Length | undefined
    stepColor_value?: ResourceColor | undefined
    trackBorderRadius_value?: Length | undefined
    selectedBorderRadius_value?: Dimension | undefined
    blockSize_value?: SizeOptions | undefined
    blockStyle_value?: SliderBlockStyle | undefined
    stepSize_value?: Length | undefined
    sliderInteractionMode_value?: SliderInteraction | undefined
    minResponsiveDistance_value?: number | undefined
    contentModifier_value?: ContentModifier<SliderConfiguration> | undefined
    slideRange_value?: SlideRange | undefined
    digitalCrownSensitivity_value?: CrownSensitivity | undefined
    enableHapticFeedback_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<SliderAttribute> | AttributeModifier<CommonMethod> | undefined
    blockColor(value: ResourceColor | undefined): this {
        return this
    }
    trackColor(value: ResourceColor | LinearGradient | undefined): this {
        return this
    }
    selectedColor(value: ResourceColor | LinearGradient | undefined): this {
        return this
    }
    showSteps(value: boolean | undefined): this {
        return this
    }
    trackThickness(value: Length | undefined): this {
        return this
    }
    onChange(value: ((value: number,mode: SliderChangeMode) => void) | undefined): this {
        return this
    }
    blockBorderColor(value: ResourceColor | undefined): this {
        return this
    }
    blockBorderWidth(value: Length | undefined): this {
        return this
    }
    stepColor(value: ResourceColor | undefined): this {
        return this
    }
    trackBorderRadius(value: Length | undefined): this {
        return this
    }
    selectedBorderRadius(value: Dimension | undefined): this {
        return this
    }
    blockSize(value: SizeOptions | undefined): this {
        return this
    }
    blockStyle(value: SliderBlockStyle | undefined): this {
        return this
    }
    stepSize(value: Length | undefined): this {
        return this
    }
    sliderInteractionMode(value: SliderInteraction | undefined): this {
        return this
    }
    minResponsiveDistance(value: number | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<SliderConfiguration> | undefined): this {
        return this
    }
    slideRange(value: SlideRange | undefined): this {
        return this
    }
    digitalCrownSensitivity(value: CrownSensitivity | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    showTips(value: boolean | undefined, content?: ResourceStr): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SliderAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Slider(
    options?: SliderOptions,
    @memo
    content_?: () => void,
): SliderAttribute { throw new Error("")}
