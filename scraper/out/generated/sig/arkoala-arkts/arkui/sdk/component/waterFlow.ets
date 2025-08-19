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
import { Dimension, Padding, ConstraintSizeOptions, Length } from "./units"
import { Resource } from "@global.resource"
import { CustomBuilder } from "./builder"
import { ComponentContent } from "./../ComponentContent"
import { Scroller, OnScrollFrameBeginCallback } from "./scroll"
import { ScrollableCommonMethod, OnWillScrollCallback, OnScrollCallback, CommonMethod, ArkScrollableCommonMethodStyle, ArkCommonMethodStyle } from "./common"
import { FlexDirection, ScrollSource } from "./enums"
import { ScrollState } from "./list"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export type GetItemMainSizeByIndex = (index: number) => number;
export declare interface SectionOptions {
    itemsCount: number;
    crossCount?: number | undefined;
    onGetItemMainSizeByIndex?: GetItemMainSizeByIndex | undefined;
    columnsGap?: Dimension | undefined;
    rowsGap?: Dimension | undefined;
    margin?: Padding | Dimension | undefined;
}
export declare class WaterFlowSections {
    constructor()
    splice(start: number, deleteCount?: number, sections?: Array<SectionOptions>): boolean
    push(section: SectionOptions): boolean
    update(sectionIndex: number, section: SectionOptions): boolean
    values(): Array<SectionOptions>
    length(): number
}
export enum WaterFlowLayoutMode {
    ALWAYS_TOP_DOWN = 0,
    SLIDING_WINDOW = 1
}
export declare interface WaterFlowOptions {
    footer?: CustomBuilder;
    footerContent?: ComponentContent;
    scroller?: Scroller;
    sections?: WaterFlowSections;
    layoutMode?: WaterFlowLayoutMode;
}
export interface WaterFlowAttribute extends ScrollableCommonMethod {
    columnsTemplate(value: string | undefined): this {
        throw new Error("Unimplemented method columnsTemplate")
    }
    itemConstraintSize(value: ConstraintSizeOptions | undefined): this {
        throw new Error("Unimplemented method itemConstraintSize")
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
    layoutDirection(value: FlexDirection | undefined): this {
        throw new Error("Unimplemented method layoutDirection")
    }
    cachedCount(value: number | undefined): this {
        throw new Error("Unimplemented method cachedCount")
    }
    onScrollFrameBegin(value: OnScrollFrameBeginCallback | undefined): this {
        throw new Error("Unimplemented method onScrollFrameBegin")
    }
    onScrollIndex(value: ((first: number,last: number) => void) | undefined): this {
        throw new Error("Unimplemented method onScrollIndex")
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
    attributeModifier(value: AttributeModifier<WaterFlowAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkWaterFlowStyle extends ArkScrollableCommonMethodStyle implements WaterFlowAttribute {
    columnsTemplate_value?: string | undefined
    itemConstraintSize_value?: ConstraintSizeOptions | undefined
    rowsTemplate_value?: string | undefined
    columnsGap_value?: Length | undefined
    rowsGap_value?: Length | undefined
    layoutDirection_value?: FlexDirection | undefined
    cachedCount_value?: number | undefined
    onScrollFrameBegin_value?: OnScrollFrameBeginCallback | undefined
    onScrollIndex_value?: ((first: number,last: number) => void) | undefined
    onWillScroll_value?: OnWillScrollCallback | undefined
    onDidScroll_value?: OnScrollCallback | undefined
    attributeModifier_value?: AttributeModifier<WaterFlowAttribute> | AttributeModifier<CommonMethod> | undefined
    columnsTemplate(value: string | undefined): this {
        return this
    }
    itemConstraintSize(value: ConstraintSizeOptions | undefined): this {
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
    layoutDirection(value: FlexDirection | undefined): this {
        return this
    }
    cachedCount(value: number | undefined): this {
        return this
    }
    onScrollFrameBegin(value: OnScrollFrameBeginCallback | undefined): this {
        return this
    }
    onScrollIndex(value: ((first: number,last: number) => void) | undefined): this {
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
    public attributeModifier(value: AttributeModifier<WaterFlowAttribute> | AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function WaterFlow(
    options?: WaterFlowOptions,
    @memo
    content_?: () => void,
): WaterFlowAttribute { throw new Error("")}
