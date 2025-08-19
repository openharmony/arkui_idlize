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
import { ItemDragInfo, ScrollableCommonMethod, OnItemDragStartCallback, NestedScrollOptions, OnWillScrollCallback, OnScrollCallback, CommonMethod, EdgeEffectOptions, ArkScrollableCommonMethodStyle, ArkCommonMethodStyle } from "./common"
import { Length } from "./units"
import { Resource } from "@global.resource"
import { Color, BarState, ScrollSource, EdgeEffect } from "./enums"
import { OnScrollFrameBeginCallback, Scroller } from "./scroll"
import { ScrollState } from "./list"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface GridLayoutOptions {
    regularSize: [ number, number ];
    irregularIndexes?: Array<number>;
    onGetIrregularSizeByIndex?: ((index: number) => [ number, number ]);
    onGetRectByIndex?: ((index: number) => [ number, number, number, number ]);
}
export enum GridDirection {
    ROW = 0,
    Row = 0,
    COLUMN = 1,
    Column = 1,
    ROW_REVERSE = 2,
    RowReverse = 2,
    COLUMN_REVERSE = 3,
    ColumnReverse = 3
}
export enum GridItemAlignment {
    DEFAULT = 0,
    STRETCH = 1
}
export declare interface ComputedBarAttribute {
    totalOffset: number;
    totalLength: number;
}
export interface GridAttribute extends ScrollableCommonMethod {
    columnsTemplate(value: string | undefined): this {
        throw new Error("Unimplemented method columnsTemplate")
    }
    rowsTemplate(value: string | undefined): this {
        throw new Error("Unimplemented method rowsTemplate")
    }
    columnsGap(value: Length | undefined): this {
        throw new Error("Unimplemented method columnsGap")
    }
    rowsGap(value: Length | undefined): this {
        throw new Error("Unimplemented method rowsGap")
    }
    scrollBarWidth(value: number | string | undefined): this
    scrollBarColor(value: Color | number | string | undefined): this
    scrollBar(value: BarState | undefined): this
    onScrollBarUpdate(value: ((index: number,offset: number) => ComputedBarAttribute) | undefined): this {
        throw new Error("Unimplemented method onScrollBarUpdate")
    }
    onScrollIndex(value: ((first: number,last: number) => void) | undefined): this {
        throw new Error("Unimplemented method onScrollIndex")
    }
    cachedCount(value: number | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    editMode(value: boolean | undefined): this {
        throw new Error("Unimplemented method editMode")
    }
    multiSelectable(value: boolean | undefined): this {
        throw new Error("Unimplemented method multiSelectable")
    }
    maxCount(value: number | undefined): this {
        throw new Error("Unimplemented method maxCount")
    }
    minCount(value: number | undefined): this {
        throw new Error("Unimplemented method minCount")
    }
    cellLength(value: number | undefined): this {
        throw new Error("Unimplemented method cellLength")
    }
    layoutDirection(value: GridDirection | undefined): this {
        throw new Error("Unimplemented method layoutDirection")
    }
    supportAnimation(value: boolean | undefined): this {
        throw new Error("Unimplemented method supportAnimation")
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
    nestedScroll(value: NestedScrollOptions | undefined): this
    enableScrollInteraction(value: boolean | undefined): this
    friction(value: number | Resource | undefined): this
    alignItems(value: GridItemAlignment | undefined): this {
        throw new Error("Unimplemented method alignItems")
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
    cachedCount(count: number | undefined, show: boolean | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    edgeEffect(value: EdgeEffect | undefined, options?: EdgeEffectOptions): this {
        throw new Error("Unimplemented method edgeEffect")
    }
    attributeModifier(value: AttributeModifier<GridAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkGridStyle extends ArkScrollableCommonMethodStyle implements GridAttribute {
    columnsTemplate_value?: string | undefined
    rowsTemplate_value?: string | undefined
    columnsGap_value?: Length | undefined
    rowsGap_value?: Length | undefined
    scrollBarWidth_value?: number | string | undefined
    scrollBarColor_value?: Color | number | string | undefined
    scrollBar_value?: BarState | undefined
    onScrollBarUpdate_value?: ((index: number,offset: number) => ComputedBarAttribute) | undefined
    onScrollIndex_value?: ((first: number,last: number) => void) | undefined
    cachedCount_value?: number | undefined
    editMode_value?: boolean | undefined
    multiSelectable_value?: boolean | undefined
    maxCount_value?: number | undefined
    minCount_value?: number | undefined
    cellLength_value?: number | undefined
    layoutDirection_value?: GridDirection | undefined
    supportAnimation_value?: boolean | undefined
    onItemDragStart_value?: OnItemDragStartCallback | undefined
    onItemDragEnter_value?: ((event: ItemDragInfo) => void) | undefined
    onItemDragMove_value?: ((event: ItemDragInfo,itemIndex: number,insertIndex: number) => void) | undefined
    onItemDragLeave_value?: ((event: ItemDragInfo,itemIndex: number) => void) | undefined
    onItemDrop_value?: ((event: ItemDragInfo,itemIndex: number,insertIndex: number,isSuccess: boolean) => void) | undefined
    nestedScroll_value?: NestedScrollOptions | undefined
    enableScrollInteraction_value?: boolean | undefined
    friction_value?: number | Resource | undefined
    alignItems_value?: GridItemAlignment | undefined
    onScrollFrameBegin_value?: OnScrollFrameBeginCallback | undefined
    onWillScroll_value?: OnWillScrollCallback | undefined
    onDidScroll_value?: OnScrollCallback | undefined
    attributeModifier_value?: AttributeModifier<GridAttribute> | AttributeModifier<CommonMethod> | undefined
    columnsTemplate(value: string | undefined): this {
        return this
    }
    rowsTemplate(value: string | undefined): this {
        return this
    }
    columnsGap(value: Length | undefined): this {
        return this
    }
    rowsGap(value: Length | undefined): this {
        return this
    }
    scrollBarWidth(value: number | string | undefined): this {
        return this
    }
    scrollBarColor(value: Color | number | string | undefined): this {
        return this
    }
    scrollBar(value: BarState | undefined): this {
        return this
    }
    onScrollBarUpdate(value: ((index: number,offset: number) => ComputedBarAttribute) | undefined): this {
        return this
    }
    onScrollIndex(value: ((first: number,last: number) => void) | undefined): this {
        return this
    }
    cachedCount(value: number | undefined): this {
        return this
    }
    editMode(value: boolean | undefined): this {
        return this
    }
    multiSelectable(value: boolean | undefined): this {
        return this
    }
    maxCount(value: number | undefined): this {
        return this
    }
    minCount(value: number | undefined): this {
        return this
    }
    cellLength(value: number | undefined): this {
        return this
    }
    layoutDirection(value: GridDirection | undefined): this {
        return this
    }
    supportAnimation(value: boolean | undefined): this {
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
    nestedScroll(value: NestedScrollOptions | undefined): this {
        return this
    }
    enableScrollInteraction(value: boolean | undefined): this {
        return this
    }
    friction(value: number | Resource | undefined): this {
        return this
    }
    alignItems(value: GridItemAlignment | undefined): this {
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
    cachedCount(count: number | undefined, show: boolean | undefined): this {
        return this
    }
    edgeEffect(value: EdgeEffect | undefined, options?: EdgeEffectOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<GridAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Grid(
    scroller?: Scroller, layoutOptions?: GridLayoutOptions,
    @memo
    content_?: () => void,
): GridAttribute { throw new Error("")}
