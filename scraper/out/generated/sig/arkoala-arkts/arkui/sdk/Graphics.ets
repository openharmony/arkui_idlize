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
import { extractors } from "./handwritten"
import { default as drawing } from "@ohos.graphics.drawing"
import { Resource } from "@global.resource"
import { ResourceColor } from "./component/units"
import { Color } from "./component/enums"
import { default as common2D } from "@ohos.graphics.common2D"
export declare interface Size {
    width: number;
    height: number;
}
export declare class DrawContext {
    constructor()
    get size():Size;
    get sizeInPixel():Size;
    get canvas():drawing.Canvas;
}
export declare interface Vector2 {
    x: number;
    y: number;
}
export declare interface Vector2T<T = void> {
    x: T;
    y: T;
}
export declare interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export type Matrix4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
]
export type Offset = Vector2;
export type Position = Vector2;
export type Pivot = Vector2;
export type Scale = Vector2;
export type Translation = Vector2;
export type Rotation = Vector3;
export declare interface Frame {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare interface Edges<T = void> {
    left: T;
    right: T;
    top: T;
    bottom: T;
}
export enum LengthUnit {
    PX = 0,
    VP = 1,
    FP = 2,
    PERCENT = 3,
    LPX = 4
}
export enum LengthMetricsUnit {
    DEFAULT = 0,
    PX = 1
}
export declare class LengthMetrics {
    constructor(value: number, unit: LengthUnit | undefined)
    unit: LengthUnit;
    value: number;
    static px(value: number): LengthMetrics
    static vp(value: number): LengthMetrics
    static fp(value: number): LengthMetrics
    static percent(value: number): LengthMetrics
    static lpx(value: number): LengthMetrics
    static resource(value: Resource): LengthMetrics
}
export declare class ColorMetrics {
    constructor()
    get color():string;
    get red():number;
    get green():number;
    get blue():number;
    get alpha():number;
    static numeric(value: number): ColorMetrics
    static rgba(red: number, green: number, blue: number, alpha?: number): ColorMetrics
    static resourceColor(color: ResourceColor): ColorMetrics
    blendColor(overlayColor: ColorMetrics): ColorMetrics
}
export declare interface Corners<T = void> {
    topLeft: T;
    topRight: T;
    bottomLeft: T;
    bottomRight: T;
}
export type CornerRadius = Corners<Vector2>;
export type BorderRadiuses = Corners<number>;
export type Rect = common2D.Rect;
export declare interface RoundRect {
    rect: common2D.Rect;
    corners: Corners<Vector2>;
}
export declare interface Circle {
    centerX: number;
    centerY: number;
    radius: number;
}
export declare interface CommandPath {
    commands: string;
}
export declare class ShapeMask {
    constructor()
    fillColor: number;
    strokeColor: number;
    strokeWidth: number;
    setRectShape(rect: common2D.Rect): void
    setRoundRectShape(roundRect: RoundRect): void
    setCircleShape(circle: Circle): void
    setOvalShape(oval: common2D.Rect): void
    setCommandPath(path: CommandPath): void
}
export declare class ShapeClip {
    constructor()
    setRectShape(rect: common2D.Rect): void
    setRoundRectShape(roundRect: RoundRect): void
    setCircleShape(circle: Circle): void
    setOvalShape(oval: common2D.Rect): void
    setCommandPath(path: CommandPath): void
}
