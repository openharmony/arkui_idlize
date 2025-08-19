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
import { LengthMetricsUnit, LengthMetrics, Size } from "./../Graphics"
import { Matrix2D } from "./matrix2d"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
import { FrameNode } from "./../FrameNode"
import { ImageAnalyzerConfig, ImageAIOptions } from "./imageCommon"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { VoidCallback } from "./units"
export type CanvasFillRule = string;
export type CanvasLineCap = string;
export type CanvasLineJoin = string;
export type CanvasDirection = string;
export type CanvasTextAlign = string;
export type CanvasTextBaseline = string;
export type ImageSmoothingQuality = string;
export declare class CanvasGradient {
    constructor()
    addColorStop(offset: number, color: string): void
}
export declare class CanvasPath {
    constructor()
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
    closePath(): void
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void
    lineTo(x: number, y: number): void
    moveTo(x: number, y: number): void
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
    rect(x: number, y: number, w: number, h: number): void
}
export declare class Path2D extends CanvasPath {
    constructor()
    constructor(unit: LengthMetricsUnit)
    constructor(path: Path2D)
    constructor(path: Path2D, unit: LengthMetricsUnit)
    constructor(d: string)
    constructor(description: string, unit: LengthMetricsUnit)
    addPath(path: Path2D, transform?: Matrix2D): void
}
export declare interface CanvasPattern {
    setTransform(transform?: Matrix2D): void
}
export declare interface TextMetrics {
    readonly actualBoundingBoxAscent: number;
    readonly actualBoundingBoxDescent: number;
    readonly actualBoundingBoxLeft: number;
    readonly actualBoundingBoxRight: number;
    readonly alphabeticBaseline: number;
    readonly emHeightAscent: number;
    readonly emHeightDescent: number;
    readonly fontBoundingBoxAscent: number;
    readonly fontBoundingBoxDescent: number;
    readonly hangingBaseline: number;
    readonly ideographicBaseline: number;
    readonly width: number;
    readonly height: number;
}
export declare class ImageBitmap {
    constructor(src: image.PixelMap | string, unit: LengthMetricsUnit | undefined)
    get height():number;
    get width():number;
    close(): void
}
export declare class ImageData {
    constructor(width: number, height: number, data: ArrayBuffer | undefined, unit: LengthMetricsUnit | undefined)
    get data():ArrayBuffer;
    get height():int32;
    get width():int32;
}
export declare class RenderingContextSettings {
    constructor(antialias: boolean | undefined)
    get antialias():boolean | undefined;
    set antialias(val:boolean | undefined);
}
export declare class CanvasRenderer extends CanvasPath {
    constructor()
    get letterSpacing():LengthMetrics | string;
    set letterSpacing(val:LengthMetrics | string);
    get globalAlpha():number;
    set globalAlpha(val:number);
    get globalCompositeOperation():string;
    set globalCompositeOperation(val:string);
    get fillStyle():string | int32 | CanvasGradient | CanvasPattern;
    set fillStyle(val:string | int32 | CanvasGradient | CanvasPattern);
    get strokeStyle():string | int32 | CanvasGradient | CanvasPattern;
    set strokeStyle(val:string | int32 | CanvasGradient | CanvasPattern);
    get filter():string;
    set filter(val:string);
    get imageSmoothingEnabled():boolean;
    set imageSmoothingEnabled(val:boolean);
    get imageSmoothingQuality():ImageSmoothingQuality;
    set imageSmoothingQuality(val:ImageSmoothingQuality);
    get lineCap():CanvasLineCap;
    set lineCap(val:CanvasLineCap);
    get lineDashOffset():number;
    set lineDashOffset(val:number);
    get lineJoin():CanvasLineJoin;
    set lineJoin(val:CanvasLineJoin);
    get lineWidth():number;
    set lineWidth(val:number);
    get miterLimit():number;
    set miterLimit(val:number);
    get shadowBlur():number;
    set shadowBlur(val:number);
    get shadowColor():string;
    set shadowColor(val:string);
    get shadowOffsetX():number;
    set shadowOffsetX(val:number);
    get shadowOffsetY():number;
    set shadowOffsetY(val:number);
    get direction():CanvasDirection;
    set direction(val:CanvasDirection);
    get font():string;
    set font(val:string);
    get textAlign():CanvasTextAlign;
    set textAlign(val:CanvasTextAlign);
    get textBaseline():CanvasTextBaseline;
    set textBaseline(val:CanvasTextBaseline);
    drawImage(image: ImageBitmap | image.PixelMap, dx_sx: number, dy_sy: number, sw_dw?: number, sh_dh?: number, dx?: number, dy?: number, dw?: number, dh?: number): void
    beginPath(): void
    clip(fillRule?: CanvasFillRule): void
    clip(path: Path2D, fillRule?: CanvasFillRule): void
    fill(fillRule?: CanvasFillRule): void
    fill(path: Path2D, fillRule?: CanvasFillRule): void
    stroke(path?: Path2D): void
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient
    createPattern(image: ImageBitmap, repetition: string | undefined): CanvasPattern | undefined
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient
    createConicGradient(startAngle: number, x: number, y: number): CanvasGradient
    createImageData(sw: number, sh: number): ImageData
    createImageData(imagedata: ImageData): ImageData
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData
    getPixelMap(sx: number, sy: number, sw: number, sh: number): image.PixelMap
    putImageData(imagedata: ImageData, dx: number | string, dy: number | string, dirtyX?: number | string, dirtyY?: number | string, dirtyWidth?: number | string, dirtyHeight?: number | string): void
    getLineDash(): Array<number>
    setLineDash(segments: Array<number>): void
    clearRect(x: number, y: number, w: number, h: number): void
    fillRect(x: number, y: number, w: number, h: number): void
    strokeRect(x: number, y: number, w: number, h: number): void
    restore(): void
    save(): void
    fillText(text: string, x: number, y: number, maxWidth?: number): void
    measureText(text: string): TextMetrics
    strokeText(text: string, x: number, y: number, maxWidth?: number): void
    getTransform(): Matrix2D
    resetTransform(): void
    rotate(angle: number): void
    scale(x: number, y: number): void
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
    setTransform(transform?: Matrix2D): void
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void
    translate(x: number, y: number): void
    setPixelMap(value?: image.PixelMap): void
    transferFromImageBitmap(bitmap: ImageBitmap): void
    saveLayer(): void
    restoreLayer(): void
    reset(): void
}
export declare class CanvasRenderingContext2D extends CanvasRenderer {
    constructor(settings: RenderingContextSettings | undefined, unit: LengthMetricsUnit | undefined)
    get height():number;
    get width():number;
    get canvas():FrameNode;
    toDataURL(type?: string, quality?: number): string
    startImageAnalyzer(config: ImageAnalyzerConfig): Promise<void>
    stopImageAnalyzer(): void
    onOnAttach(callback_: (() => void)): void
    offOnAttach(callback_?: (() => void)): void
    onOnDetach(callback_: (() => void)): void
    offOnDetach(callback_?: (() => void)): void
}
export declare class OffscreenCanvasRenderingContext2D extends CanvasRenderer {
    constructor(width: number, height: number, settings: RenderingContextSettings | undefined, unit: LengthMetricsUnit | undefined)
    toDataURL(type?: string, quality?: number): string
    transferToImageBitmap(): ImageBitmap
}
export declare class OffscreenCanvas {
    constructor(width: number, height: number, unit: LengthMetricsUnit | undefined)
    get height():number;
    set height(val:number);
    get width():number;
    set width(val:number);
    transferToImageBitmap(): ImageBitmap
    getContext2d(options?: RenderingContextSettings): OffscreenCanvasRenderingContext2D
}
export declare class DrawingRenderingContext {
    constructor(unit: LengthMetricsUnit | undefined)
    get size():Size;
    invalidate(): void
}
export interface CanvasAttribute extends CommonMethod {
    onReady(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onReady")
    }
    enableAnalyzer(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAnalyzer")
    }
    attributeModifier(value: AttributeModifier<CanvasAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCanvasStyle extends ArkCommonMethodStyle implements CanvasAttribute {
    onReady_value?: VoidCallback | undefined
    enableAnalyzer_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<CanvasAttribute> | AttributeModifier<CommonMethod> | undefined
    onReady(value: VoidCallback | undefined): this {
        return this
    }
    enableAnalyzer(value: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CanvasAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Canvas(
    context?: CanvasRenderingContext2D | DrawingRenderingContext, imageAIOptions?: ImageAIOptions,
    @memo
    content_?: () => void,
): CanvasAttribute { throw new Error("")}
