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
import { TranslateOptions, Bindable, CommonMethod, DividerStyle, BlurStyle, BackgroundEffectOptions, BackgroundBlurStyleOptions, ArkCommonMethodStyle } from "./common"
import { Dimension, Length, ResourceColor } from "./units"
import { Resource } from "@global.resource"
import { EdgeEffect, Color, PageFlipMode } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum BarMode {
    SCROLLABLE = 0,
    Scrollable = 0,
    FIXED = 1,
    Fixed = 1
}
export enum AnimationMode {
    CONTENT_FIRST = 0,
    ACTION_FIRST = 1,
    NO_ANIMATION = 2,
    CONTENT_FIRST_WITH_JUMP = 3,
    ACTION_FIRST_WITH_JUMP = 4
}
export enum BarPosition {
    START = 0,
    Start = 0,
    END = 1,
    End = 1
}
export enum LayoutStyle {
    ALWAYS_CENTER = 0,
    ALWAYS_AVERAGE_SPLIT = 1,
    SPACE_BETWEEN_OR_CENTER = 2
}
export enum TabsCacheMode {
    CACHE_BOTH_SIDE = 0,
    CACHE_LATEST_SWITCHED = 1
}
export declare class TabsController {
    constructor()
    changeIndex(value: number): void
    preloadItems(indices: Array<number> | undefined): Promise<void>
    setTabBarTranslate(translate: TranslateOptions): void
    setTabBarOpacity(opacity: number): void
}
export declare interface TabsOptions {
    barPosition?: BarPosition;
    index?: number | Bindable<number>;
    controller?: TabsController;
}
export declare interface TabsAnimationEvent {
    currentOffset: number;
    targetOffset: number;
    velocity: number;
}
export declare interface BarGridColumnOptions {
    sm?: number;
    md?: number;
    lg?: number;
    margin?: Dimension;
    gutter?: Dimension;
}
export declare interface ScrollableBarModeOptions {
    margin?: Dimension;
    nonScrollableLayoutStyle?: LayoutStyle;
}
export type OnTabsAnimationStartCallback = (index: number, targetIndex: number, extraInfo: TabsAnimationEvent) => void;
export type OnTabsAnimationEndCallback = (index: number, extraInfo: TabsAnimationEvent) => void;
export type OnTabsGestureSwipeCallback = (index: number, extraInfo: TabsAnimationEvent) => void;
export type TabsCustomContentTransitionCallback = (from: number, to: number) => TabContentAnimatedTransition | undefined;
export type OnTabsContentWillChangeCallback = (currentIndex: number, comingIndex: number) => boolean;
export interface TabsAttribute extends CommonMethod {
    vertical(value: boolean | undefined): this {
        throw new Error("Unimplemented method vertical")
    }
    barPosition(value: BarPosition | undefined): this {
        throw new Error("Unimplemented method barPosition")
    }
    scrollable(value: boolean | undefined): this {
        throw new Error("Unimplemented method scrollable")
    }
    barWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method barWidth")
    }
    barHeight(value: Length | undefined): this {
        throw new Error("Unimplemented method barHeight")
    }
    animationDuration(value: number | undefined): this {
        throw new Error("Unimplemented method animationDuration")
    }
    animationMode(value: AnimationMode | undefined): this {
        throw new Error("Unimplemented method animationMode")
    }
    edgeEffect(value: EdgeEffect | undefined): this {
        throw new Error("Unimplemented method edgeEffect")
    }
    onChange(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    onSelected(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onSelected")
    }
    onTabBarClick(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onTabBarClick")
    }
    onUnselected(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onUnselected")
    }
    onAnimationStart(value: OnTabsAnimationStartCallback | undefined): this {
        throw new Error("Unimplemented method onAnimationStart")
    }
    onAnimationEnd(value: OnTabsAnimationEndCallback | undefined): this {
        throw new Error("Unimplemented method onAnimationEnd")
    }
    onGestureSwipe(value: OnTabsGestureSwipeCallback | undefined): this {
        throw new Error("Unimplemented method onGestureSwipe")
    }
    fadingEdge(value: boolean | undefined): this {
        throw new Error("Unimplemented method fadingEdge")
    }
    divider(value: DividerStyle | undefined): this {
        throw new Error("Unimplemented method divider")
    }
    barOverlap(value: boolean | undefined): this {
        throw new Error("Unimplemented method barOverlap")
    }
    barBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method barBackgroundColor")
    }
    barGridAlign(value: BarGridColumnOptions | undefined): this {
        throw new Error("Unimplemented method barGridAlign")
    }
    customContentTransition(value: TabsCustomContentTransitionCallback | undefined): this {
        throw new Error("Unimplemented method customContentTransition")
    }
    barBackgroundBlurStyle(value: BlurStyle | undefined): this {
        throw new Error("Unimplemented method barBackgroundBlurStyle")
    }
    pageFlipMode(value: PageFlipMode | undefined): this {
        throw new Error("Unimplemented method pageFlipMode")
    }
    barBackgroundEffect(value: BackgroundEffectOptions | undefined): this {
        throw new Error("Unimplemented method barBackgroundEffect")
    }
    onContentWillChange(value: OnTabsContentWillChangeCallback | undefined): this {
        throw new Error("Unimplemented method onContentWillChange")
    }
    barMode(value: BarMode | undefined, options?: ScrollableBarModeOptions): this {
        throw new Error("Unimplemented method barMode")
    }
    barBackgroundBlurStyle(style: BlurStyle | undefined, options: BackgroundBlurStyleOptions | undefined): this {
        throw new Error("Unimplemented method barBackgroundBlurStyle")
    }
    cachedMaxCount(count: number | undefined, mode: TabsCacheMode | undefined): this {
        throw new Error("Unimplemented method cachedMaxCount")
    }
    attributeModifier(value: AttributeModifier<TabsAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTabsStyle extends ArkCommonMethodStyle implements TabsAttribute {
    vertical_value?: boolean | undefined
    barPosition_value?: BarPosition | undefined
    scrollable_value?: boolean | undefined
    barWidth_value?: Length | undefined
    barHeight_value?: Length | undefined
    animationDuration_value?: number | undefined
    animationMode_value?: AnimationMode | undefined
    edgeEffect_value?: EdgeEffect | undefined
    onChange_value?: ((value0: number) => void) | undefined
    onSelected_value?: ((value0: number) => void) | undefined
    onTabBarClick_value?: ((value0: number) => void) | undefined
    onUnselected_value?: ((value0: number) => void) | undefined
    onAnimationStart_value?: OnTabsAnimationStartCallback | undefined
    onAnimationEnd_value?: OnTabsAnimationEndCallback | undefined
    onGestureSwipe_value?: OnTabsGestureSwipeCallback | undefined
    fadingEdge_value?: boolean | undefined
    divider_value?: DividerStyle | undefined
    barOverlap_value?: boolean | undefined
    barBackgroundColor_value?: ResourceColor | undefined
    barGridAlign_value?: BarGridColumnOptions | undefined
    customContentTransition_value?: TabsCustomContentTransitionCallback | undefined
    barBackgroundBlurStyle_value?: BlurStyle | undefined
    pageFlipMode_value?: PageFlipMode | undefined
    barBackgroundEffect_value?: BackgroundEffectOptions | undefined
    onContentWillChange_value?: OnTabsContentWillChangeCallback | undefined
    attributeModifier_value?: AttributeModifier<TabsAttribute> | AttributeModifier<CommonMethod> | undefined
    vertical(value: boolean | undefined): this {
        return this
    }
    barPosition(value: BarPosition | undefined): this {
        return this
    }
    scrollable(value: boolean | undefined): this {
        return this
    }
    barWidth(value: Length | undefined): this {
        return this
    }
    barHeight(value: Length | undefined): this {
        return this
    }
    animationDuration(value: number | undefined): this {
        return this
    }
    animationMode(value: AnimationMode | undefined): this {
        return this
    }
    edgeEffect(value: EdgeEffect | undefined): this {
        return this
    }
    onChange(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onSelected(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onTabBarClick(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onUnselected(value: ((value0: number) => void) | undefined): this {
        return this
    }
    onAnimationStart(value: OnTabsAnimationStartCallback | undefined): this {
        return this
    }
    onAnimationEnd(value: OnTabsAnimationEndCallback | undefined): this {
        return this
    }
    onGestureSwipe(value: OnTabsGestureSwipeCallback | undefined): this {
        return this
    }
    fadingEdge(value: boolean | undefined): this {
        return this
    }
    divider(value: DividerStyle | undefined): this {
        return this
    }
    barOverlap(value: boolean | undefined): this {
        return this
    }
    barBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    barGridAlign(value: BarGridColumnOptions | undefined): this {
        return this
    }
    customContentTransition(value: TabsCustomContentTransitionCallback | undefined): this {
        return this
    }
    barBackgroundBlurStyle(value: BlurStyle | undefined): this {
        return this
    }
    pageFlipMode(value: PageFlipMode | undefined): this {
        return this
    }
    barBackgroundEffect(value: BackgroundEffectOptions | undefined): this {
        return this
    }
    onContentWillChange(value: OnTabsContentWillChangeCallback | undefined): this {
        return this
    }
    barMode(value: BarMode | undefined, options?: ScrollableBarModeOptions): this {
        return this
    }
    barBackgroundBlurStyle(style: BlurStyle | undefined, options: BackgroundBlurStyleOptions | undefined): this {
        return this
    }
    cachedMaxCount(count: number | undefined, mode: TabsCacheMode | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TabsAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface TabContentAnimatedTransition {
    timeout?: number;
    transition: ((value0: TabContentTransitionProxy) => void);
}
export declare interface TabContentTransitionProxy {
    from: number;
    to: number;
    finishTransition(): void
}

@memo
@ComponentBuilder
export function Tabs(
    options?: TabsOptions,
    @memo
    content_?: () => void,
): TabsAttribute { throw new Error("")}
