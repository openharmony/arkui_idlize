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
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { Resource } from "@global.resource"
import { LengthMetrics, LengthMetricsUnit, ColorMetrics } from "./../Graphics"
import { Color, BorderStyle, FontWeight, FontStyle, DividerMode } from "./enums"
import { OutlineStyle } from "./common"
export { Resource } from "@global.resource"
export type Length = string | number | Resource;
export type PX = string;
export type VP = string | number;
export type FP = string;
export type LPX = string;
export type Percentage = string;
export type Degree = string;
export type Dimension = string | number | Resource;
export type ResourceStr = string | Resource;
export declare interface Padding {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
}
export declare interface LocalizedPadding {
    top?: LengthMetrics;
    end?: LengthMetrics;
    bottom?: LengthMetrics;
    start?: LengthMetrics;
}
export type Margin = Padding;
export type EdgeWidth = EdgeWidths;
export declare interface EdgeWidths {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
}
export declare interface LocalizedEdgeWidths {
    top?: LengthMetrics;
    end?: LengthMetrics;
    bottom?: LengthMetrics;
    start?: LengthMetrics;
}
export declare interface EdgeOutlineWidths {
    top?: Dimension;
    right?: Dimension;
    bottom?: Dimension;
    left?: Dimension;
}
export declare interface BorderRadiuses {
    topLeft?: Length;
    topRight?: Length;
    bottomLeft?: Length;
    bottomRight?: Length;
}
export declare interface LocalizedBorderRadiuses {
    topStart?: LengthMetrics;
    topEnd?: LengthMetrics;
    bottomStart?: LengthMetrics;
    bottomEnd?: LengthMetrics;
}
export declare interface OutlineRadiuses {
    topLeft?: Dimension;
    topRight?: Dimension;
    bottomLeft?: Dimension;
    bottomRight?: Dimension;
}
export declare interface EdgeColors {
    top?: ResourceColor;
    right?: ResourceColor;
    bottom?: ResourceColor;
    left?: ResourceColor;
}
export declare interface LocalizedEdgeColors {
    top?: ResourceColor;
    end?: ResourceColor;
    bottom?: ResourceColor;
    start?: ResourceColor;
}
export type LocalizedMargin = LocalizedPadding;
export declare interface EdgeStyles {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
}
export declare interface EdgeOutlineStyles {
    top?: OutlineStyle;
    right?: OutlineStyle;
    bottom?: OutlineStyle;
    left?: OutlineStyle;
}
export declare interface Offset {
    dx: Length;
    dy: Length;
}
export type ResourceColor = Color | number | string | Resource;
export declare interface LengthConstrain {
    minLength: Length;
    maxLength: Length;
}
export type VoidCallback = () => void;
export { LengthMetricsUnit } from "./../Graphics"
export { LengthMetrics } from "./../Graphics"
export { ColorMetrics } from "./../Graphics"
export declare interface Font {
    size?: Length;
    weight?: FontWeight | number | string;
    family?: string | Resource;
    style?: FontStyle;
}
export declare interface Area {
    width: Length;
    height: Length;
    position: Position;
    globalPosition: Position;
}
export declare interface Position {
    x?: Length;
    y?: Length;
}
export declare interface LocalizedPosition {
    start?: LengthMetrics;
    top?: LengthMetrics;
}
export declare interface Edges {
    top?: Dimension;
    left?: Dimension;
    bottom?: Dimension;
    right?: Dimension;
}
export declare interface LocalizedEdges {
    top?: LengthMetrics;
    start?: LengthMetrics;
    bottom?: LengthMetrics;
    end?: LengthMetrics;
}
export declare interface Bias {
    horizontal?: number;
    vertical?: number;
}
export declare interface ConstraintSizeOptions {
    minWidth?: Length;
    maxWidth?: Length;
    minHeight?: Length;
    maxHeight?: Length;
}
export declare interface SizeOptions {
    width?: Length;
    height?: Length;
}
export declare interface BorderOptions {
    width?: EdgeWidths | Length | LocalizedEdgeWidths;
    color?: EdgeColors | ResourceColor | LocalizedEdgeColors;
    radius?: BorderRadiuses | Length | LocalizedBorderRadiuses;
    style?: EdgeStyles | BorderStyle;
    dashGap?: EdgeWidths | LengthMetrics | LocalizedEdgeWidths;
    dashWidth?: EdgeWidths | LengthMetrics | LocalizedEdgeWidths;
    showInForeground?: boolean;
}
export declare interface OutlineOptions {
    width?: EdgeOutlineWidths | Dimension;
    color?: EdgeColors | ResourceColor | LocalizedEdgeColors;
    radius?: OutlineRadiuses | Dimension;
    style?: EdgeOutlineStyles | OutlineStyle;
}
export declare interface MarkStyle {
    strokeColor?: ResourceColor;
    size?: Length;
    strokeWidth?: Length;
}
export declare class ColorFilter {
    constructor(value: Array<number>)
}
export declare interface TouchPoint {
    x: Dimension;
    y: Dimension;
}
export declare interface DirectionalEdgesT {
    start: number;
    end: number;
    top: number;
    bottom: number;
}
export declare interface DividerStyleOptions {
    strokeWidth?: LengthMetrics;
    color?: ResourceColor;
    startMargin?: LengthMetrics;
    endMargin?: LengthMetrics;
    mode?: DividerMode;
}
export declare interface ScrollBarMargin {
    start?: LengthMetrics;
    end?: LengthMetrics;
}
export declare interface ChainWeightOptions {
    horizontal?: number;
    vertical?: number;
}
export declare interface AccessibilityOptions {
    accessibilityPreferred?: boolean;
}
