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
import { VoidCallback, Length, ResourceColor, VP, Font } from "./units"
import { Resource } from "@global.resource"
import { LengthMetrics } from "./../Graphics"
import { Color, EdgeEffect, PageFlipMode } from "./enums"
import { CommonMethod, Bindable, ArkCommonMethodStyle } from "./common"
import { IndicatorComponentController } from "./indicatorcomponent"
import { default as curves } from "@ohos.curves"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare class SwiperController {
    constructor()
    showNext(): void
    showPrevious(): void
    changeIndex(index: number, animationMode?: SwiperAnimationMode | boolean): void
    finishAnimation(callback_?: VoidCallback): void
    preloadItems(indices: Array<number> | undefined): Promise<void>
}
export declare class Indicator<T = void> {
}
export declare class DotIndicator extends Indicator<DotIndicator> {
}
export declare interface SwiperAutoFill {
    minSize: VP;
}
export declare class DigitIndicator extends Indicator<DigitIndicator> {
}
export declare interface ArrowStyle {
    showBackground?: boolean;
    isSidebarMiddle?: boolean;
    backgroundSize?: Length;
    backgroundColor?: ResourceColor;
    arrowSize?: Length;
    arrowColor?: ResourceColor;
}
export enum SwiperDisplayMode {
    STRETCH = 0
}
export declare interface SwiperAnimationEvent {
    currentOffset: number;
    targetOffset: number;
    velocity: number;
}
export declare interface AutoPlayOptions {
    stopWhenTouched: boolean;
}
export enum SwiperNestedScrollMode {
    SELF_ONLY = 0,
    SELF_FIRST = 1
}
export enum SwiperAnimationMode {
    NO_ANIMATION = 0,
    DEFAULT_ANIMATION = 1,
    FAST_ANIMATION = 2
}
export type OnSwiperAnimationStartCallback = (index: number, targetIndex: number, extraInfo: SwiperAnimationEvent) => void;
export type OnSwiperAnimationEndCallback = (index: number, extraInfo: SwiperAnimationEvent) => void;
export type OnSwiperGestureSwipeCallback = (index: number, extraInfo: SwiperAnimationEvent) => void;
export interface SwiperAttribute extends CommonMethod {
    index(value: number | Bindable<number> | undefined): this {
        throw new Error("Unimplemented method index")
    }
    interval(value: number | undefined): this {
        throw new Error("Unimplemented method interval")
    }
    indicator(value: IndicatorComponentController | DotIndicator | DigitIndicator | boolean | undefined): this {
        throw new Error("Unimplemented method indicator")
    }
    loop(value: boolean | undefined): this {
        throw new Error("Unimplemented method loop")
    }
    duration(value: number | undefined): this {
        throw new Error("Unimplemented method duration")
    }
    vertical(value: boolean | undefined): this {
        throw new Error("Unimplemented method vertical")
    }
    itemSpace(value: number | string | undefined): this {
        throw new Error("Unimplemented method itemSpace")
    }
    displayMode(value: SwiperDisplayMode | undefined): this {
        throw new Error("Unimplemented method displayMode")
    }
    cachedCount(value: number | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    effectMode(value: EdgeEffect | undefined): this {
        throw new Error("Unimplemented method effectMode")
    }
    disableSwipe(value: boolean | undefined): this {
        throw new Error("Unimplemented method disableSwipe")
    }
    curve(value: curves.Curve | string | curves.ICurve | undefined): this {
        throw new Error("Unimplemented method curve")
    }
    onChange(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    onSelected(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onSelected")
    }
    onUnselected(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onUnselected")
    }
    onAnimationStart(value: OnSwiperAnimationStartCallback | undefined): this {
        throw new Error("Unimplemented method onAnimationStart")
    }
    onAnimationEnd(value: OnSwiperAnimationEndCallback | undefined): this {
        throw new Error("Unimplemented method onAnimationEnd")
    }
    onGestureSwipe(value: OnSwiperGestureSwipeCallback | undefined): this {
        throw new Error("Unimplemented method onGestureSwipe")
    }
    nestedScroll(value: SwiperNestedScrollMode | undefined): this {
        throw new Error("Unimplemented method nestedScroll")
    }
    customContentTransition(value: SwiperContentAnimatedTransition | undefined): this {
        throw new Error("Unimplemented method customContentTransition")
    }
    onContentDidScroll(value: ContentDidScrollCallback | undefined): this {
        throw new Error("Unimplemented method onContentDidScroll")
    }
    indicatorInteractive(value: boolean | undefined): this {
        throw new Error("Unimplemented method indicatorInteractive")
    }
    pageFlipMode(value: PageFlipMode | undefined): this {
        throw new Error("Unimplemented method pageFlipMode")
    }
    onContentWillScroll(value: ContentWillScrollCallback | undefined): this {
        throw new Error("Unimplemented method onContentWillScroll")
    }
    autoPlay(autoPlay: boolean | undefined, options: AutoPlayOptions | undefined): this {
        throw new Error("Unimplemented method autoPlay")
    }
    displayArrow(value: ArrowStyle | boolean | undefined, isHoverShow?: boolean): this {
        throw new Error("Unimplemented method displayArrow")
    }
    cachedCount(count: number | undefined, isShown: boolean | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    displayCount(value: number | string | SwiperAutoFill | undefined, swipeByGroup?: boolean): this {
        throw new Error("Unimplemented method displayCount")
    }
    prevMargin(value: Length | undefined, ignoreBlank?: boolean): this {
        throw new Error("Unimplemented method prevMargin")
    }
    nextMargin(value: Length | undefined, ignoreBlank?: boolean): this {
        throw new Error("Unimplemented method nextMargin")
    }
    attributeModifier(value: AttributeModifier<SwiperAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSwiperStyle extends ArkCommonMethodStyle implements SwiperAttribute {
    index_value?: number | Bindable<number> | undefined
    interval_value?: number | undefined
    indicator_value?: IndicatorComponentController | DotIndicator | DigitIndicator | boolean | undefined
    loop_value?: boolean | undefined
    duration_value?: number | undefined
    vertical_value?: boolean | undefined
    itemSpace_value?: number | string | undefined
    displayMode_value?: SwiperDisplayMode | undefined
    cachedCount_value?: number | undefined
    effectMode_value?: EdgeEffect | undefined
    disableSwipe_value?: boolean | undefined
    curve_value?: curves.Curve | string | curves.ICurve | undefined
    onChange_value?: ((value0: number) => void) | undefined
    onSelected_value?: ((value0: number) => void) | undefined
    onUnselected_value?: ((value0: number) => void) | undefined
    onAnimationStart_value?: OnSwiperAnimationStartCallback | undefined
    onAnimationEnd_value?: OnSwiperAnimationEndCallback | undefined
    onGestureSwipe_value?: OnSwiperGestureSwipeCallback | undefined
    nestedScroll_value?: SwiperNestedScrollMode | undefined
    customContentTransition_value?: SwiperContentAnimatedTransition | undefined
    onContentDidScroll_value?: ContentDidScrollCallback | undefined
    indicatorInteractive_value?: boolean | undefined
    pageFlipMode_value?: PageFlipMode | undefined
    onContentWillScroll_value?: ContentWillScrollCallback | undefined
    index(value: number | Bindable<number> | undefined): this {
        return this
    }
    interval(value: number | undefined): this {
        return this
    }
    indicator(value: IndicatorComponentController | DotIndicator | DigitIndicator | boolean | undefined): this {
        return this
    }
    loop(value: boolean | undefined): this {
        return this
    }
    duration(value: number | undefined): this {
        return this
    }
    vertical(value: boolean | undefined): this {
        return this
    }
    itemSpace(value: number | string | undefined): this {
        return this
    }
    displayMode(value: SwiperDisplayMode | undefined): this {
        return this
    }
    cachedCount(value: number | undefined): this {
        return this
    }
    effectMode(value: EdgeEffect | undefined): this {
        return this
    }
    disableSwipe(value: boolean | undefined): this {
        return this
    }
    curve(value: curves.Curve | string | curves.ICurve | undefined): this {
        return this
    }
    onChange(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onSelected(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onUnselected(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onAnimationStart(value: OnSwiperAnimationStartCallback | undefined): this {
        return this
    }
    onAnimationEnd(value: OnSwiperAnimationEndCallback | undefined): this {
        return this
    }
    onGestureSwipe(value: OnSwiperGestureSwipeCallback | undefined): this {
        return this
    }
    nestedScroll(value: SwiperNestedScrollMode | undefined): this {
        return this
    }
    customContentTransition(value: SwiperContentAnimatedTransition | undefined): this {
        return this
    }
    onContentDidScroll(value: ContentDidScrollCallback | undefined): this {
        return this
    }
    indicatorInteractive(value: boolean | undefined): this {
        return this
    }
    pageFlipMode(value: PageFlipMode | undefined): this {
        return this
    }
    onContentWillScroll(value: ContentWillScrollCallback | undefined): this {
        return this
    }
    autoPlay(autoPlay: boolean | undefined, options: AutoPlayOptions | undefined): this {
        return this
    }
    displayArrow(value: ArrowStyle | boolean | undefined, isHoverShow?: boolean): this {
        return this
    }
    cachedCount(count: number | undefined, isShown: boolean | undefined): this {
        return this
    }
    displayCount(value: number | string | SwiperAutoFill | undefined, swipeByGroup?: boolean): this {
        return this
    }
    prevMargin(value: Length | undefined, ignoreBlank?: boolean): this {
        return this
    }
    nextMargin(value: Length | undefined, ignoreBlank?: boolean): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SwiperAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface SwiperContentAnimatedTransition {
    timeout?: number;
    transition: ((value0: SwiperContentTransitionProxy) => void);
}
export declare interface SwiperContentTransitionProxy {
    selectedIndex: number;
    index: number;
    position: number;
    mainAxisLength: number;
    finishTransition(): void
}
export declare interface SwiperContentWillScrollResult {
    currentIndex: number;
    comingIndex: number;
    offset: number;
}
export type ContentDidScrollCallback = (selectedIndex: number, index: number, position: number, mainAxisLength: number) => void;
export type ContentWillScrollCallback = (result: SwiperContentWillScrollResult) => boolean;

@memo
@ComponentBuilder
export function Swiper(
    controller?: SwiperController,
    @memo
    content_?: () => void,
): SwiperAttribute { throw new Error("")}
