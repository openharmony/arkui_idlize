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
import { Length } from "./units"
import { Resource } from "@global.resource"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { ItemAlign } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface GridRowSizeOption {
    xs?: Length;
    sm?: Length;
    md?: Length;
    lg?: Length;
    xl?: Length;
    xxl?: Length;
}
export declare interface GridRowColumnOption {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
}
export declare interface GutterOption {
    x?: Length | GridRowSizeOption;
    y?: Length | GridRowSizeOption;
}
export enum BreakpointsReference {
    WINDOW_SIZE = 0,
    WindowSize = 0,
    COMPONENT_SIZE = 1,
    ComponentSize = 1
}
export enum GridRowDirection {
    ROW = 0,
    Row = 0,
    ROW_REVERSE = 1,
    RowReverse = 1
}
export declare interface BreakPoints {
    value?: Array<string>;
    reference?: BreakpointsReference;
}
export declare interface GridRowOptions {
    gutter?: Length | GutterOption;
    columns?: number | GridRowColumnOption;
    breakpoints?: BreakPoints;
    direction?: GridRowDirection;
}
export interface GridRowAttribute extends CommonMethod {
    onBreakpointChange(value: ((breakpoints: string) => void) | undefined): this {
        throw new Error("Unimplemented method onBreakpointChange")
    }
    alignItems(value: ItemAlign | undefined): this {
        throw new Error("Unimplemented method alignItems")
    }
    attributeModifier(value: AttributeModifier<GridRowAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkGridRowStyle extends ArkCommonMethodStyle implements GridRowAttribute {
    onBreakpointChange_value?: ((breakpoints: string) => void) | undefined
    alignItems_value?: ItemAlign | undefined
    attributeModifier_value?: AttributeModifier<GridRowAttribute> | AttributeModifier<CommonMethod> | undefined
    onBreakpointChange(value: ((breakpoints: string) => void) | undefined): this {
        return this
    }
    alignItems(value: ItemAlign | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<GridRowAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function GridRow(
    option?: GridRowOptions,
    @memo
    content_?: () => void,
): GridRowAttribute { throw new Error("")}
