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
import { LengthMetrics } from "./../Graphics"
import { default as curves } from "@ohos.curves"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { Dimension, Length, VoidCallback } from "./units"
import { Resource } from "@global.resource"
import { Edge, ScrollSource, BarState, Color, EdgeEffect } from "./enums"
import { RectResult, ScrollableCommonMethod, NestedScrollOptions, CommonMethod, EdgeEffectOptions, ArkScrollableCommonMethodStyle, ArkCommonMethodStyle } from "./common"
import { ScrollSnapAlign, ScrollState } from "./list"
export enum ScrollDirection {
    VERTICAL = 0,
    Vertical = 0,
    HORIZONTAL = 1,
    Horizontal = 1,
    NONE = 2,
    None = 2
}
export enum ScrollAlign {
    START = 0,
    CENTER = 1,
    END = 2,
    AUTO = 3
}
export declare interface OffsetResult {
    xOffset: number;
    yOffset: number;
}
export declare interface ScrollEdgeOptions {
    velocity?: number;
}
export declare interface ScrollToIndexOptions {
    extraOffset?: LengthMetrics;
}
export declare interface ScrollAnimationOptions {
    duration?: number;
    curve?: curves.Curve | curves.ICurve;
    canOverScroll?: boolean;
}
export declare interface OffsetOptions {
    xOffset?: Dimension;
    yOffset?: Dimension;
}
export declare class Scroller {
    constructor()
    scrollTo(options: ScrollOptions): void
    scrollEdge(value: Edge, options?: ScrollEdgeOptions): void
    fling(velocity: number): void
    scrollPage(value: ScrollPageOptions): void
    currentOffset(): OffsetResult
    scrollToIndex(value: number, smooth?: boolean, align?: ScrollAlign, options?: ScrollToIndexOptions): void
    scrollBy(dx: Length, dy: Length): void
    isAtEnd(): boolean
    getItemRect(index: number): RectResult
    getItemIndex(x: number, y: number): number
}
export declare interface ScrollOptions {
    xOffset: number | string;
    yOffset: number | string;
    animation?: ScrollAnimationOptions | boolean;
}
export declare interface ScrollPageOptions {
    next: boolean;
    animation?: boolean;
}
export declare interface ScrollSnapOptions {
    snapAlign: ScrollSnapAlign;
    snapPagination?: Dimension | Array<Dimension>;
    enableSnapToStart?: boolean;
    enableSnapToEnd?: boolean;
}
export type OnScrollEdgeCallback = (side: Edge) => void;
export declare interface OnScrollFrameBeginHandlerResult {
    offsetRemain: number;
}
export type OnScrollFrameBeginCallback = (offset: number, state: ScrollState) => OnScrollFrameBeginHandlerResult;
export interface ScrollAttribute extends ScrollableCommonMethod {
    scrollable(value: ScrollDirection | undefined): this {
        throw new Error("Unimplemented method scrollable")
    }
    onWillScroll(value: ScrollOnWillScrollCallback | undefined): this {
        throw new Error("Unimplemented method onWillScroll")
    }
    onDidScroll(value: ScrollOnScrollCallback | undefined): this {
        throw new Error("Unimplemented method onDidScroll")
    }
    onScrollEdge(value: OnScrollEdgeCallback | undefined): this {
        throw new Error("Unimplemented method onScrollEdge")
    }
    onScrollStart(value: VoidCallback | undefined): this
    onScrollStop(value: VoidCallback | undefined): this
    scrollBar(value: BarState | undefined): this
    scrollBarColor(value: Color | number | string | undefined): this
    scrollBarWidth(value: number | string | undefined): this
    onScrollFrameBegin(value: OnScrollFrameBeginCallback | undefined): this {
        throw new Error("Unimplemented method onScrollFrameBegin")
    }
    nestedScroll(value: NestedScrollOptions | undefined): this
    enableScrollInteraction(value: boolean | undefined): this
    friction(value: number | Resource | undefined): this
    scrollSnap(value: ScrollSnapOptions | undefined): this {
        throw new Error("Unimplemented method scrollSnap")
    }
    enablePaging(value: boolean | undefined): this {
        throw new Error("Unimplemented method enablePaging")
    }
    initialOffset(value: OffsetOptions | undefined): this {
        throw new Error("Unimplemented method initialOffset")
    }
    edgeEffect(edgeEffect: EdgeEffect | undefined, options?: EdgeEffectOptions): this {
        throw new Error("Unimplemented method edgeEffect")
    }
    attributeModifier(value: AttributeModifier<ScrollAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkScrollStyle extends ArkScrollableCommonMethodStyle implements ScrollAttribute {
    scrollable_value?: ScrollDirection | undefined
    onWillScroll_value?: ScrollOnWillScrollCallback | undefined
    onDidScroll_value?: ScrollOnScrollCallback | undefined
    onScrollEdge_value?: OnScrollEdgeCallback | undefined
    onScrollStart_value?: VoidCallback | undefined
    onScrollStop_value?: VoidCallback | undefined
    scrollBar_value?: BarState | undefined
    scrollBarColor_value?: Color | number | string | undefined
    scrollBarWidth_value?: number | string | undefined
    onScrollFrameBegin_value?: OnScrollFrameBeginCallback | undefined
    nestedScroll_value?: NestedScrollOptions | undefined
    enableScrollInteraction_value?: boolean | undefined
    friction_value?: number | Resource | undefined
    scrollSnap_value?: ScrollSnapOptions | undefined
    enablePaging_value?: boolean | undefined
    initialOffset_value?: OffsetOptions | undefined
    attributeModifier_value?: AttributeModifier<ScrollAttribute> | AttributeModifier<CommonMethod> | undefined
    scrollable(value: ScrollDirection | undefined): this {
        return this
    }
    onWillScroll(value: ScrollOnWillScrollCallback | undefined): this {
        return this
    }
    onDidScroll(value: ScrollOnScrollCallback | undefined): this {
        return this
    }
    onScrollEdge(value: OnScrollEdgeCallback | undefined): this {
        return this
    }
    onScrollStart(value: VoidCallback | undefined): this {
        return this
    }
    onScrollStop(value: VoidCallback | undefined): this {
        return this
    }
    scrollBar(value: BarState | undefined): this {
        return this
    }
    scrollBarColor(value: Color | number | string | undefined): this {
        return this
    }
    scrollBarWidth(value: number | string | undefined): this {
        return this
    }
    onScrollFrameBegin(value: OnScrollFrameBeginCallback | undefined): this {
        return this
    }
    nestedScroll(value: NestedScrollOptions | undefined): this {
        return this
    }
    enableScrollInteraction(value: boolean | undefined): this {
        return this
    }
    friction(value: number | Resource | undefined): this {
        return this
    }
    scrollSnap(value: ScrollSnapOptions | undefined): this {
        return this
    }
    enablePaging(value: boolean | undefined): this {
        return this
    }
    initialOffset(value: OffsetOptions | undefined): this {
        return this
    }
    edgeEffect(edgeEffect: EdgeEffect | undefined, options?: EdgeEffectOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ScrollAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type ScrollOnScrollCallback = (xOffset: number, yOffset: number, scrollState: ScrollState) => void;
export type ScrollOnWillScrollCallback = (xOffset: number, yOffset: number, scrollState: ScrollState, scrollSource: ScrollSource) => OffsetResult | undefined;

@memo
@ComponentBuilder
export function Scroll(
    scroller?: Scroller,
    @memo
    content_?: () => void,
): ScrollAttribute { throw new Error("")}
