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
import { Length, ResourceColor, LengthConstrain, Dimension } from "./units"
import { Resource } from "@global.resource"
import { Scroller, ScrollAlign, OnScrollFrameBeginCallback } from "./scroll"
import { RectResult, ItemDragInfo, ScrollableCommonMethod, ChildrenMainSize, OnItemDragStartCallback, OnWillScrollCallback, OnScrollCallback, CommonMethod, ArkScrollableCommonMethodStyle, ArkCommonMethodStyle } from "./common"
import { Color, Axis, ScrollSource } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum ScrollState {
    IDLE = 0,
    Idle = 0,
    SCROLL = 1,
    Scroll = 1,
    FLING = 2,
    Fling = 2
}
export enum ListItemAlign {
    START = 0,
    Start = 0,
    CENTER = 1,
    Center = 1,
    END = 2,
    End = 2
}
export enum ListItemGroupArea {
    NONE = 0,
    IN_LIST_ITEM_AREA = 1,
    IN_HEADER_AREA = 2,
    IN_FOOTER_AREA = 3
}
export enum StickyStyle {
    NONE = 0,
    None = 0,
    HEADER = 1,
    Header = 1,
    FOOTER = 2,
    Footer = 2
}
export enum ChainEdgeEffect {
    DEFAULT = 0,
    STRETCH = 1
}
export enum ScrollSnapAlign {
    NONE = 0,
    START = 1,
    CENTER = 2,
    END = 3
}
export declare interface ChainAnimationOptions {
    minSpace: Length;
    maxSpace: Length;
    conductivity?: number;
    intensity?: number;
    edgeEffect?: ChainEdgeEffect;
    stiffness?: number;
    damping?: number;
}
export declare interface CloseSwipeActionOptions {
    onFinish?: (() => void);
}
export declare interface VisibleListContentInfo {
    index: number;
    itemGroupArea?: ListItemGroupArea;
    itemIndexInGroup?: number;
}
export type OnScrollVisibleContentChangeCallback = (start: VisibleListContentInfo, end: VisibleListContentInfo) => void;
export declare class ListScroller extends Scroller {
    constructor()
    getItemRectInGroup(index: number, indexInGroup: number): RectResult
    scrollToItemInGroup(index: number, indexInGroup: number, smooth?: boolean, align?: ScrollAlign): void
    closeAllSwipeActions(options?: CloseSwipeActionOptions): void
    getVisibleListContentInfo(x: number, y: number): VisibleListContentInfo
}
export declare interface ListOptions {
    initialIndex?: number;
    space?: number | string;
    scroller?: Scroller;
}
export declare interface ListDividerOptions {
    strokeWidth: Length;
    color?: ResourceColor;
    startMargin?: Length;
    endMargin?: Length;
}
export interface ListAttribute extends ScrollableCommonMethod {
    alignListItem(value: ListItemAlign | undefined): this {
        throw new Error("Unimplemented method alignListItem")
    }
    listDirection(value: Axis | undefined): this {
        throw new Error("Unimplemented method listDirection")
    }
    contentStartOffset(value: number | undefined): this {
        throw new Error("Unimplemented method contentStartOffset")
    }
    contentEndOffset(value: number | undefined): this {
        throw new Error("Unimplemented method contentEndOffset")
    }
    divider(value: ListDividerOptions | undefined): this {
        throw new Error("Unimplemented method divider")
    }
    multiSelectable(value: boolean | undefined): this {
        throw new Error("Unimplemented method multiSelectable")
    }
    cachedCount(value: number | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    chainAnimation(value: boolean | undefined): this {
        throw new Error("Unimplemented method chainAnimation")
    }
    chainAnimationOptions(value: ChainAnimationOptions | undefined): this {
        throw new Error("Unimplemented method chainAnimationOptions")
    }
    sticky(value: StickyStyle | undefined): this {
        throw new Error("Unimplemented method sticky")
    }
    scrollSnapAlign(value: ScrollSnapAlign | undefined): this {
        throw new Error("Unimplemented method scrollSnapAlign")
    }
    childrenMainSize(value: ChildrenMainSize | undefined): this {
        throw new Error("Unimplemented method childrenMainSize")
    }
    maintainVisibleContentPosition(value: boolean | undefined): this {
        throw new Error("Unimplemented method maintainVisibleContentPosition")
    }
    stackFromEnd(value: boolean | undefined): this {
        throw new Error("Unimplemented method stackFromEnd")
    }
    onScrollIndex(value: ((start: number,end: number,center: number) => void) | undefined): this {
        throw new Error("Unimplemented method onScrollIndex")
    }
    onScrollVisibleContentChange(value: OnScrollVisibleContentChangeCallback | undefined): this {
        throw new Error("Unimplemented method onScrollVisibleContentChange")
    }
    onItemMove(value: ((from: number,to: number) => boolean) | undefined): this {
        throw new Error("Unimplemented method onItemMove")
    }
    onItemDragStart(value: OnItemDragStartCallback | undefined): this {
        throw new Error("Unimplemented method onItemDragStart")
    }
    onItemDragEnter(value: ((event: ItemDragInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onItemDragEnter")
    }
    onItemDragMove(value: ((event: ItemDragInfo,itemIndex: number,insertIndex: number) => void) | undefined): this {
        throw new Error("Unimplemented method onItemDragMove")
    }
    onItemDragLeave(value: ((event: ItemDragInfo,itemIndex: number) => void) | undefined): this {
        throw new Error("Unimplemented method onItemDragLeave")
    }
    onItemDrop(value: ((event: ItemDragInfo,itemIndex: number,insertIndex: number,isSuccess: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onItemDrop")
    }
    onScrollFrameBegin(value: OnScrollFrameBeginCallback | undefined): this {
        throw new Error("Unimplemented method onScrollFrameBegin")
    }
    onWillScroll(value: OnWillScrollCallback | undefined): this {
        throw new Error("Unimplemented method onWillScroll")
    }
    onDidScroll(value: OnScrollCallback | undefined): this {
        throw new Error("Unimplemented method onDidScroll")
    }
    lanes(value: number | LengthConstrain | undefined, gutter?: Dimension): this {
        throw new Error("Unimplemented method lanes")
    }
    cachedCount(count: number | undefined, show: boolean | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    attributeModifier(value: AttributeModifier<ListAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkListStyle extends ArkScrollableCommonMethodStyle implements ListAttribute {
    alignListItem_value?: ListItemAlign | undefined
    listDirection_value?: Axis | undefined
    contentStartOffset_value?: number | undefined
    contentEndOffset_value?: number | undefined
    divider_value?: ListDividerOptions | undefined
    multiSelectable_value?: boolean | undefined
    cachedCount_value?: number | undefined
    chainAnimation_value?: boolean | undefined
    chainAnimationOptions_value?: ChainAnimationOptions | undefined
    sticky_value?: StickyStyle | undefined
    scrollSnapAlign_value?: ScrollSnapAlign | undefined
    childrenMainSize_value?: ChildrenMainSize | undefined
    maintainVisibleContentPosition_value?: boolean | undefined
    stackFromEnd_value?: boolean | undefined
    onScrollIndex_value?: ((start: number,end: number,center: number) => void) | undefined
    onScrollVisibleContentChange_value?: OnScrollVisibleContentChangeCallback | undefined
    onItemMove_value?: ((from: number,to: number) => boolean) | undefined
    onItemDragStart_value?: OnItemDragStartCallback | undefined
    onItemDragEnter_value?: ((event: ItemDragInfo) => void) | undefined
    onItemDragMove_value?: ((event: ItemDragInfo,itemIndex: number,insertIndex: number) => void) | undefined
    onItemDragLeave_value?: ((event: ItemDragInfo,itemIndex: number) => void) | undefined
    onItemDrop_value?: ((event: ItemDragInfo,itemIndex: number,insertIndex: number,isSuccess: boolean) => void) | undefined
    onScrollFrameBegin_value?: OnScrollFrameBeginCallback | undefined
    onWillScroll_value?: OnWillScrollCallback | undefined
    onDidScroll_value?: OnScrollCallback | undefined
    attributeModifier_value?: AttributeModifier<ListAttribute> | AttributeModifier<CommonMethod> | undefined
    alignListItem(value: ListItemAlign | undefined): this {
        return this
    }
    listDirection(value: Axis | undefined): this {
        return this
    }
    contentStartOffset(value: number | undefined): this {
        return this
    }
    contentEndOffset(value: number | undefined): this {
        return this
    }
    divider(value: ListDividerOptions | undefined): this {
        return this
    }
    multiSelectable(value: boolean | undefined): this {
        return this
    }
    cachedCount(value: number | undefined): this {
        return this
    }
    chainAnimation(value: boolean | undefined): this {
        return this
    }
    chainAnimationOptions(value: ChainAnimationOptions | undefined): this {
        return this
    }
    sticky(value: StickyStyle | undefined): this {
        return this
    }
    scrollSnapAlign(value: ScrollSnapAlign | undefined): this {
        return this
    }
    childrenMainSize(value: ChildrenMainSize | undefined): this {
        return this
    }
    maintainVisibleContentPosition(value: boolean | undefined): this {
        return this
    }
    stackFromEnd(value: boolean | undefined): this {
        return this
    }
    onScrollIndex(value: ((start: number,end: number,center: number) => void) | undefined): this {
        return this
    }
    onScrollVisibleContentChange(value: OnScrollVisibleContentChangeCallback | undefined): this {
        return this
    }
    onItemMove(value: ((from: number,to: number) => boolean) | undefined): this {
        return this
    }
    onItemDragStart(value: OnItemDragStartCallback | undefined): this {
        return this
    }
    onItemDragEnter(value: ((event: ItemDragInfo) => void) | undefined): this {
        return this
    }
    onItemDragMove(value: ((event: ItemDragInfo,itemIndex: number,insertIndex: number) => void) | undefined): this {
        return this
    }
    onItemDragLeave(value: ((event: ItemDragInfo,itemIndex: number) => void) | undefined): this {
        return this
    }
    onItemDrop(value: ((event: ItemDragInfo,itemIndex: number,insertIndex: number,isSuccess: boolean) => void) | undefined): this {
        return this
    }
    onScrollFrameBegin(value: OnScrollFrameBeginCallback | undefined): this {
        return this
    }
    onWillScroll(value: OnWillScrollCallback | undefined): this {
        return this
    }
    onDidScroll(value: OnScrollCallback | undefined): this {
        return this
    }
    lanes(value: number | LengthConstrain | undefined, gutter?: Dimension): this {
        return this
    }
    cachedCount(count: number | undefined, show: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ListAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function List(
    options?: ListOptions,
    @memo
    content_?: () => void,
): ListAttribute { throw new Error("")}
