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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { Resource_serializer } from "./framework/resource"
import { ResourceColor } from "./component/units"
import { Color, BorderStyle } from "./component/enums"
import { Resource } from "@global.resource"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { extractors } from "#handwritten"
import { default as drawing } from "@ohos.graphics.drawing"
import { common2D_Rect_serializer } from "./framework/ohos.graphics.common2D"
import { default as common2D } from "@ohos.graphics.common2D"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { GlobalScope } from "./framework/GlobalScope"
export class ColorMetricsInternal {
    public static fromPtr(ptr: KPointer): ColorMetrics {
        return new ColorMetrics(ptr)
    }
}
export class ColorMetrics implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get color(): string {
        return this.getColor()
    }
    set color(color: string) {
        this.setColor(color)
    }
    get red(): number {
        return this.getRed()
    }
    set red(red: number) {
        this.setRed(red)
    }
    get green(): number {
        return this.getGreen()
    }
    set green(green: number) {
        this.setGreen(green)
    }
    get blue(): number {
        return this.getBlue()
    }
    set blue(blue: number) {
        this.setBlue(blue)
    }
    get alpha(): number {
        return this.getAlpha()
    }
    set alpha(alpha: number) {
        this.setAlpha(alpha)
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ColorMetrics.getFinalizer())
    }
    constructor() {
        this(ColorMetrics.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ColorMetrics_getFinalizer()
    }
    static numeric_serialize(value: number): ColorMetrics {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_numeric(value)
        const obj : ColorMetrics = ColorMetricsInternal.fromPtr(retval)
        return obj
    }
    static rgba_serialize(red: number, green: number, blue: number, alpha?: number): ColorMetrics {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (alpha !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const alphaTmpValue  = alpha!
            thisSerializer.writeNumber(alphaTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_rgba(red, green, blue, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : ColorMetrics = ColorMetricsInternal.fromPtr(retval)
        return obj
    }
    static resourceColor_serialize(color: ResourceColor): ColorMetrics {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (color instanceof Color) {
            thisSerializer.writeInt8((0).toChar())
            const colorForIdx0  = color as Color
            thisSerializer.writeInt32(colorForIdx0.valueOf())
        } else if (color instanceof number) {
            thisSerializer.writeInt8((1).toChar())
            const colorForIdx1  = color as number
            thisSerializer.writeNumber(colorForIdx1)
        } else if (color instanceof string) {
            thisSerializer.writeInt8((2).toChar())
            const colorForIdx2  = color as string
            thisSerializer.writeString(colorForIdx2)
        } else if (color instanceof Resource) {
            thisSerializer.writeInt8((3).toChar())
            const colorForIdx3  = color as Resource
            Resource_serializer.write(thisSerializer, colorForIdx3)
        }
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_resourceColor(thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : ColorMetrics = ColorMetricsInternal.fromPtr(retval)
        return obj
    }
    public static numeric(value: number): ColorMetrics {
        const value_casted = value as (number)
        return ColorMetrics.numeric_serialize(value_casted)
    }
    public static rgba(red: number, green: number, blue: number, alpha?: number): ColorMetrics {
        const red_casted = red as (number)
        const green_casted = green as (number)
        const blue_casted = blue as (number)
        const alpha_casted = alpha as (number | undefined)
        return ColorMetrics.rgba_serialize(red_casted, green_casted, blue_casted, alpha_casted)
    }
    public static resourceColor(color: ResourceColor): ColorMetrics {
        const color_casted = color as (ResourceColor)
        return ColorMetrics.resourceColor_serialize(color_casted)
    }
    public blendColor(overlayColor: ColorMetrics): ColorMetrics {
        const overlayColor_casted = overlayColor as (ColorMetrics)
        return this.blendColor_serialize(overlayColor_casted)
    }
    private getColor(): string {
        return this.getColor_serialize()
    }
    private setColor(color: string): void {
        const color_casted = color as (string)
        this.setColor_serialize(color_casted)
        return
    }
    private getRed(): number {
        return this.getRed_serialize()
    }
    private setRed(red: number): void {
        const red_casted = red as (number)
        this.setRed_serialize(red_casted)
        return
    }
    private getGreen(): number {
        return this.getGreen_serialize()
    }
    private setGreen(green: number): void {
        const green_casted = green as (number)
        this.setGreen_serialize(green_casted)
        return
    }
    private getBlue(): number {
        return this.getBlue_serialize()
    }
    private setBlue(blue: number): void {
        const blue_casted = blue as (number)
        this.setBlue_serialize(blue_casted)
        return
    }
    private getAlpha(): number {
        return this.getAlpha_serialize()
    }
    private setAlpha(alpha: number): void {
        const alpha_casted = alpha as (number)
        this.setAlpha_serialize(alpha_casted)
        return
    }
    blendColor_serialize(overlayColor: ColorMetrics): ColorMetrics {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_blendColor(this.peer!.ptr, toPeerPtr(overlayColor))
        const obj : ColorMetrics = ColorMetricsInternal.fromPtr(retval)
        return obj
    }
    private getColor_serialize(): string {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_getColor(this.peer!.ptr)
        return retval
    }
    private setColor_serialize(color: string): void {
        ArkUIGeneratedNativeModule._ColorMetrics_setColor(this.peer!.ptr, color)
    }
    private getRed_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_getRed(this.peer!.ptr)
        return retval
    }
    private setRed_serialize(red: number): void {
        ArkUIGeneratedNativeModule._ColorMetrics_setRed(this.peer!.ptr, red)
    }
    private getGreen_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_getGreen(this.peer!.ptr)
        return retval
    }
    private setGreen_serialize(green: number): void {
        ArkUIGeneratedNativeModule._ColorMetrics_setGreen(this.peer!.ptr, green)
    }
    private getBlue_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_getBlue(this.peer!.ptr)
        return retval
    }
    private setBlue_serialize(blue: number): void {
        ArkUIGeneratedNativeModule._ColorMetrics_setBlue(this.peer!.ptr, blue)
    }
    private getAlpha_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ColorMetrics_getAlpha(this.peer!.ptr)
        return retval
    }
    private setAlpha_serialize(alpha: number): void {
        ArkUIGeneratedNativeModule._ColorMetrics_setAlpha(this.peer!.ptr, alpha)
    }
}
export class DrawContextInternal {
    public static fromPtr(ptr: KPointer): DrawContext {
        return new DrawContext(ptr)
    }
}
export class DrawContext implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get size(): Size {
        return this.getSize()
    }
    set size(size: Size) {
        this.setSize(size)
    }
    get sizeInPixel(): Size {
        return this.getSizeInPixel()
    }
    set sizeInPixel(sizeInPixel: Size) {
        this.setSizeInPixel(sizeInPixel)
    }
    get canvas(): drawing.Canvas {
        return this.getCanvas()
    }
    set canvas(canvas: drawing.Canvas) {
        this.setCanvas(canvas)
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, DrawContext.getFinalizer())
    }
    constructor() {
        this(DrawContext.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._DrawContext_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._DrawContext_getFinalizer()
    }
    private getSize(): Size {
        return this.getSize_serialize()
    }
    private setSize(size: Size): void {
        const size_casted = size as (Size)
        this.setSize_serialize(size_casted)
        return
    }
    private getSizeInPixel(): Size {
        return this.getSizeInPixel_serialize()
    }
    private setSizeInPixel(sizeInPixel: Size): void {
        const sizeInPixel_casted = sizeInPixel as (Size)
        this.setSizeInPixel_serialize(sizeInPixel_casted)
        return
    }
    private getCanvas(): drawing.Canvas {
        return this.getCanvas_serialize()
    }
    private setCanvas(canvas: drawing.Canvas): void {
        const canvas_casted = canvas as (drawing.Canvas)
        this.setCanvas_serialize(canvas_casted)
        return
    }
    private getSize_serialize(): Size {
        const retval  = ArkUIGeneratedNativeModule._DrawContext_getSize(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Size = Size_serializer.read(retvalDeserializer)
        return returnResult
    }
    private setSize_serialize(size: Size): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Size_serializer.write(thisSerializer, size)
        ArkUIGeneratedNativeModule._DrawContext_setSize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getSizeInPixel_serialize(): Size {
        const retval  = ArkUIGeneratedNativeModule._DrawContext_getSizeInPixel(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : Size = Size_serializer.read(retvalDeserializer)
        return returnResult
    }
    private setSizeInPixel_serialize(sizeInPixel: Size): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Size_serializer.write(thisSerializer, sizeInPixel)
        ArkUIGeneratedNativeModule._DrawContext_setSizeInPixel(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getCanvas_serialize(): drawing.Canvas {
        const retval  = ArkUIGeneratedNativeModule._DrawContext_getCanvas(this.peer!.ptr)
        const obj : drawing.Canvas = extractors.fromDrawingCanvasPtr(retval)
        return obj
    }
    private setCanvas_serialize(canvas: drawing.Canvas): void {
        ArkUIGeneratedNativeModule._DrawContext_setCanvas(this.peer!.ptr, extractors.toDrawingCanvasPtr(canvas))
    }
}
export class LengthMetricsInternal {
    public static fromPtr(ptr: KPointer): LengthMetrics {
        return new LengthMetrics(false, false, ptr)
    }
}
export class LengthMetrics implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get unit(): LengthUnit {
        return this.getUnit()
    }
    set unit(unit: LengthUnit) {
        this.setUnit(unit)
    }
    get value(): number {
        return this.getValue()
    }
    set value(value: number) {
        this.setValue(value)
    }
    constructor(_0: boolean, _1: boolean, peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, LengthMetrics.getFinalizer())
    }
    constructor(value: number, unit?: LengthUnit) {
        this(false, false, LengthMetrics.construct(value, unit))
    }
    static construct(value: number, unit?: LengthUnit): KPointer {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (unit !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const unitTmpValue  = (unit as LengthUnit)
            thisSerializer.writeInt32(unitTmpValue.valueOf())
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_construct(value, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._LengthMetrics_getFinalizer()
    }
    static px_serialize(value: number): LengthMetrics {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_px(value)
        const obj : LengthMetrics = LengthMetricsInternal.fromPtr(retval)
        return obj
    }
    static vp_serialize(value: number): LengthMetrics {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_vp(value)
        const obj : LengthMetrics = LengthMetricsInternal.fromPtr(retval)
        return obj
    }
    static fp_serialize(value: number): LengthMetrics {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_fp(value)
        const obj : LengthMetrics = LengthMetricsInternal.fromPtr(retval)
        return obj
    }
    static percent_serialize(value: number): LengthMetrics {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_percent(value)
        const obj : LengthMetrics = LengthMetricsInternal.fromPtr(retval)
        return obj
    }
    static lpx_serialize(value: number): LengthMetrics {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_lpx(value)
        const obj : LengthMetrics = LengthMetricsInternal.fromPtr(retval)
        return obj
    }
    static resource_serialize(value: Resource): LengthMetrics {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Resource_serializer.write(thisSerializer, value)
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_resource(thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : LengthMetrics = LengthMetricsInternal.fromPtr(retval)
        return obj
    }
    public static px(value: number): LengthMetrics {
        const value_casted = value as (number)
        return LengthMetrics.px_serialize(value_casted)
    }
    public static vp(value: number): LengthMetrics {
        const value_casted = value as (number)
        return LengthMetrics.vp_serialize(value_casted)
    }
    public static fp(value: number): LengthMetrics {
        const value_casted = value as (number)
        return LengthMetrics.fp_serialize(value_casted)
    }
    public static percent(value: number): LengthMetrics {
        const value_casted = value as (number)
        return LengthMetrics.percent_serialize(value_casted)
    }
    public static lpx(value: number): LengthMetrics {
        const value_casted = value as (number)
        return LengthMetrics.lpx_serialize(value_casted)
    }
    public static resource(value: Resource): LengthMetrics {
        const value_casted = value as (Resource)
        return LengthMetrics.resource_serialize(value_casted)
    }
    private getUnit(): LengthUnit {
        return this.getUnit_serialize()
    }
    private setUnit(unit: LengthUnit): void {
        const unit_casted = unit as (LengthUnit)
        this.setUnit_serialize(unit_casted)
        return
    }
    private getValue(): number {
        return this.getValue_serialize()
    }
    private setValue(value: number): void {
        const value_casted = value as (number)
        this.setValue_serialize(value_casted)
        return
    }
    private getUnit_serialize(): LengthUnit {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_getUnit(this.peer!.ptr)
        return LengthUnit.fromValue(retval)
    }
    private setUnit_serialize(unit: LengthUnit): void {
        ArkUIGeneratedNativeModule._LengthMetrics_setUnit(this.peer!.ptr, unit.valueOf())
    }
    private getValue_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._LengthMetrics_getValue(this.peer!.ptr)
        return retval
    }
    private setValue_serialize(value: number): void {
        ArkUIGeneratedNativeModule._LengthMetrics_setValue(this.peer!.ptr, value)
    }
}
export class ShapeClipInternal {
    public static fromPtr(ptr: KPointer): ShapeClip {
        return new ShapeClip(ptr)
    }
}
export class ShapeClip implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ShapeClip.getFinalizer())
    }
    constructor() {
        this(ShapeClip.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ShapeClip_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ShapeClip_getFinalizer()
    }
    public setRectShape(rect: common2D.Rect): void {
        const rect_casted = rect as (common2D.Rect)
        this.setRectShape_serialize(rect_casted)
        return
    }
    public setRoundRectShape(roundRect: RoundRect): void {
        const roundRect_casted = roundRect as (RoundRect)
        this.setRoundRectShape_serialize(roundRect_casted)
        return
    }
    public setCircleShape(circle: Circle): void {
        const circle_casted = circle as (Circle)
        this.setCircleShape_serialize(circle_casted)
        return
    }
    public setOvalShape(oval: common2D.Rect): void {
        const oval_casted = oval as (common2D.Rect)
        this.setOvalShape_serialize(oval_casted)
        return
    }
    public setCommandPath(path: CommandPath): void {
        const path_casted = path as (CommandPath)
        this.setCommandPath_serialize(path_casted)
        return
    }
    setRectShape_serialize(rect: common2D.Rect): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        common2D_Rect_serializer.write(thisSerializer, rect)
        ArkUIGeneratedNativeModule._ShapeClip_setRectShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setRoundRectShape_serialize(roundRect: RoundRect): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        RoundRect_serializer.write(thisSerializer, roundRect)
        ArkUIGeneratedNativeModule._ShapeClip_setRoundRectShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setCircleShape_serialize(circle: Circle): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Circle_serializer.write(thisSerializer, circle)
        ArkUIGeneratedNativeModule._ShapeClip_setCircleShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setOvalShape_serialize(oval: common2D.Rect): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        common2D_Rect_serializer.write(thisSerializer, oval)
        ArkUIGeneratedNativeModule._ShapeClip_setOvalShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setCommandPath_serialize(path: CommandPath): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        CommandPath_serializer.write(thisSerializer, path)
        ArkUIGeneratedNativeModule._ShapeClip_setCommandPath(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export class ShapeMaskInternal {
    public static fromPtr(ptr: KPointer): ShapeMask {
        return new ShapeMask(ptr)
    }
}
export class ShapeMask implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get fillColor(): number {
        return this.getFillColor()
    }
    set fillColor(fillColor: number) {
        this.setFillColor(fillColor)
    }
    get strokeColor(): number {
        return this.getStrokeColor()
    }
    set strokeColor(strokeColor: number) {
        this.setStrokeColor(strokeColor)
    }
    get strokeWidth(): number {
        return this.getStrokeWidth()
    }
    set strokeWidth(strokeWidth: number) {
        this.setStrokeWidth(strokeWidth)
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ShapeMask.getFinalizer())
    }
    constructor() {
        this(ShapeMask.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ShapeMask_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ShapeMask_getFinalizer()
    }
    public setRectShape(rect: common2D.Rect): void {
        const rect_casted = rect as (common2D.Rect)
        this.setRectShape_serialize(rect_casted)
        return
    }
    public setRoundRectShape(roundRect: RoundRect): void {
        const roundRect_casted = roundRect as (RoundRect)
        this.setRoundRectShape_serialize(roundRect_casted)
        return
    }
    public setCircleShape(circle: Circle): void {
        const circle_casted = circle as (Circle)
        this.setCircleShape_serialize(circle_casted)
        return
    }
    public setOvalShape(oval: common2D.Rect): void {
        const oval_casted = oval as (common2D.Rect)
        this.setOvalShape_serialize(oval_casted)
        return
    }
    public setCommandPath(path: CommandPath): void {
        const path_casted = path as (CommandPath)
        this.setCommandPath_serialize(path_casted)
        return
    }
    private getFillColor(): number {
        return this.getFillColor_serialize()
    }
    private setFillColor(fillColor: number): void {
        const fillColor_casted = fillColor as (number)
        this.setFillColor_serialize(fillColor_casted)
        return
    }
    private getStrokeColor(): number {
        return this.getStrokeColor_serialize()
    }
    private setStrokeColor(strokeColor: number): void {
        const strokeColor_casted = strokeColor as (number)
        this.setStrokeColor_serialize(strokeColor_casted)
        return
    }
    private getStrokeWidth(): number {
        return this.getStrokeWidth_serialize()
    }
    private setStrokeWidth(strokeWidth: number): void {
        const strokeWidth_casted = strokeWidth as (number)
        this.setStrokeWidth_serialize(strokeWidth_casted)
        return
    }
    setRectShape_serialize(rect: common2D.Rect): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        common2D_Rect_serializer.write(thisSerializer, rect)
        ArkUIGeneratedNativeModule._ShapeMask_setRectShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setRoundRectShape_serialize(roundRect: RoundRect): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        RoundRect_serializer.write(thisSerializer, roundRect)
        ArkUIGeneratedNativeModule._ShapeMask_setRoundRectShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setCircleShape_serialize(circle: Circle): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Circle_serializer.write(thisSerializer, circle)
        ArkUIGeneratedNativeModule._ShapeMask_setCircleShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setOvalShape_serialize(oval: common2D.Rect): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        common2D_Rect_serializer.write(thisSerializer, oval)
        ArkUIGeneratedNativeModule._ShapeMask_setOvalShape(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setCommandPath_serialize(path: CommandPath): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        CommandPath_serializer.write(thisSerializer, path)
        ArkUIGeneratedNativeModule._ShapeMask_setCommandPath(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getFillColor_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ShapeMask_getFillColor(this.peer!.ptr)
        return retval
    }
    private setFillColor_serialize(fillColor: number): void {
        ArkUIGeneratedNativeModule._ShapeMask_setFillColor(this.peer!.ptr, fillColor)
    }
    private getStrokeColor_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ShapeMask_getStrokeColor(this.peer!.ptr)
        return retval
    }
    private setStrokeColor_serialize(strokeColor: number): void {
        ArkUIGeneratedNativeModule._ShapeMask_setStrokeColor(this.peer!.ptr, strokeColor)
    }
    private getStrokeWidth_serialize(): number {
        const retval  = ArkUIGeneratedNativeModule._ShapeMask_getStrokeWidth(this.peer!.ptr)
        return retval
    }
    private setStrokeWidth_serialize(strokeWidth: number): void {
        ArkUIGeneratedNativeModule._ShapeMask_setStrokeWidth(this.peer!.ptr, strokeWidth)
    }
}
export interface Size {
    width: number;
    height: number;
}
export interface Vector2 {
    x: number;
    y: number;
}
export interface Vector2T<T = void> {
    x: T;
    y: T;
}
export interface Vector3 {
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
export interface Frame {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface Edges<T = void> {
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
export interface Corners<T = void> {
    topLeft: T;
    topRight: T;
    bottomLeft: T;
    bottomRight: T;
}
export type CornerRadius = Corners<Vector2>;
export type BorderRadiuses = Corners<number>;
export type Rect = common2D.Rect;
export interface RoundRect {
    rect: common2D.Rect;
    corners: Corners<Vector2>;
}
export interface Circle {
    centerX: number;
    centerY: number;
    radius: number;
}
export interface CommandPath {
    commands: string;
}
export function edgeColors(all: number): Edges {
    return GlobalScope.edgeColors(all)
}
export function edgeWidths(all: number): Edges {
    return GlobalScope.edgeWidths(all)
}
export function borderStyles(all: BorderStyle): Edges {
    return GlobalScope.borderStyles(all)
}
export function borderRadiuses(all: number): Corners<number> {
    return GlobalScope.borderRadiuses(all)
}
export class Edges_Arkui_Component_Enums_BorderStyle_serializer {
    public static write(buffer: SerializerBase, value: Edges<BorderStyle>): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForLeft  = value.left
        valueSerializer.writeInt32(valueHolderForLeft.valueOf())
        const valueHolderForRight  = value.right
        valueSerializer.writeInt32(valueHolderForRight.valueOf())
        const valueHolderForTop  = value.top
        valueSerializer.writeInt32(valueHolderForTop.valueOf())
        const valueHolderForBottom  = value.bottom
        valueSerializer.writeInt32(valueHolderForBottom.valueOf())
    }
    public static read(buffer: DeserializerBase): Edges<BorderStyle> {
        let valueDeserializer : DeserializerBase = buffer
        const leftTmpResult : BorderStyle = BorderStyle.fromValue(valueDeserializer.readInt32())
        const rightTmpResult : BorderStyle = BorderStyle.fromValue(valueDeserializer.readInt32())
        const topTmpResult : BorderStyle = BorderStyle.fromValue(valueDeserializer.readInt32())
        const bottomTmpResult : BorderStyle = BorderStyle.fromValue(valueDeserializer.readInt32())
        let value : Edges<BorderStyle> = ({left: leftTmpResult, right: rightTmpResult, top: topTmpResult, bottom: bottomTmpResult} as Edges<BorderStyle>)
        return value
    }
}
export class ShapeClip_serializer {
    public static write(buffer: SerializerBase, value: ShapeClip): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): ShapeClip {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return ShapeClipInternal.fromPtr(ptr)
    }
}
export class ShapeMask_serializer {
    public static write(buffer: SerializerBase, value: ShapeMask): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): ShapeMask {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return ShapeMaskInternal.fromPtr(ptr)
    }
}
export class Size_serializer {
    public static write(buffer: SerializerBase, value: Size): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForWidth  = value.width
        valueSerializer.writeNumber(valueHolderForWidth)
        const valueHolderForHeight  = value.height
        valueSerializer.writeNumber(valueHolderForHeight)
    }
    public static read(buffer: DeserializerBase): Size {
        let valueDeserializer : DeserializerBase = buffer
        const widthTmpResult : number = (valueDeserializer.readNumber() as number)
        const heightTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Size = ({width: widthTmpResult, height: heightTmpResult} as Size)
        return value
    }
}
export class Vector2_serializer {
    public static write(buffer: SerializerBase, value: Vector2): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForX  = value.x
        valueSerializer.writeNumber(valueHolderForX)
        const valueHolderForY  = value.y
        valueSerializer.writeNumber(valueHolderForY)
    }
    public static read(buffer: DeserializerBase): Vector2 {
        let valueDeserializer : DeserializerBase = buffer
        const xTmpResult : number = (valueDeserializer.readNumber() as number)
        const yTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Vector2 = ({x: xTmpResult, y: yTmpResult} as Vector2)
        return value
    }
}
export class Vector3_serializer {
    public static write(buffer: SerializerBase, value: Vector3): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForX  = value.x
        valueSerializer.writeNumber(valueHolderForX)
        const valueHolderForY  = value.y
        valueSerializer.writeNumber(valueHolderForY)
        const valueHolderForZ  = value.z
        valueSerializer.writeNumber(valueHolderForZ)
    }
    public static read(buffer: DeserializerBase): Vector3 {
        let valueDeserializer : DeserializerBase = buffer
        const xTmpResult : number = (valueDeserializer.readNumber() as number)
        const yTmpResult : number = (valueDeserializer.readNumber() as number)
        const zTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Vector3 = ({x: xTmpResult, y: yTmpResult, z: zTmpResult} as Vector3)
        return value
    }
}
export class Circle_serializer {
    public static write(buffer: SerializerBase, value: Circle): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForCenterX  = value.centerX
        valueSerializer.writeNumber(valueHolderForCenterX)
        const valueHolderForCenterY  = value.centerY
        valueSerializer.writeNumber(valueHolderForCenterY)
        const valueHolderForRadius  = value.radius
        valueSerializer.writeNumber(valueHolderForRadius)
    }
    public static read(buffer: DeserializerBase): Circle {
        let valueDeserializer : DeserializerBase = buffer
        const centerXTmpResult : number = (valueDeserializer.readNumber() as number)
        const centerYTmpResult : number = (valueDeserializer.readNumber() as number)
        const radiusTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Circle = ({centerX: centerXTmpResult, centerY: centerYTmpResult, radius: radiusTmpResult} as Circle)
        return value
    }
}
export class ColorMetrics_serializer {
    public static write(buffer: SerializerBase, value: ColorMetrics): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): ColorMetrics {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return ColorMetricsInternal.fromPtr(ptr)
    }
}
export class CommandPath_serializer {
    public static write(buffer: SerializerBase, value: CommandPath): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForCommands  = value.commands
        valueSerializer.writeString(valueHolderForCommands)
    }
    public static read(buffer: DeserializerBase): CommandPath {
        let valueDeserializer : DeserializerBase = buffer
        const commandsTmpResult : string = (valueDeserializer.readString() as string)
        let value : CommandPath = ({commands: commandsTmpResult} as CommandPath)
        return value
    }
}
export class Corners_Arkui_Graphics_Vector2_serializer {
    public static write(buffer: SerializerBase, value: Corners<Vector2>): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForTopLeft  = value.topLeft
        Vector2_serializer.write(valueSerializer, valueHolderForTopLeft)
        const valueHolderForTopRight  = value.topRight
        Vector2_serializer.write(valueSerializer, valueHolderForTopRight)
        const valueHolderForBottomLeft  = value.bottomLeft
        Vector2_serializer.write(valueSerializer, valueHolderForBottomLeft)
        const valueHolderForBottomRight  = value.bottomRight
        Vector2_serializer.write(valueSerializer, valueHolderForBottomRight)
    }
    public static read(buffer: DeserializerBase): Corners<Vector2> {
        let valueDeserializer : DeserializerBase = buffer
        const topLeftTmpResult : Vector2 = Vector2_serializer.read(valueDeserializer)
        const topRightTmpResult : Vector2 = Vector2_serializer.read(valueDeserializer)
        const bottomLeftTmpResult : Vector2 = Vector2_serializer.read(valueDeserializer)
        const bottomRightTmpResult : Vector2 = Vector2_serializer.read(valueDeserializer)
        let value : Corners<Vector2> = ({topLeft: topLeftTmpResult, topRight: topRightTmpResult, bottomLeft: bottomLeftTmpResult, bottomRight: bottomRightTmpResult} as Corners<Vector2>)
        return value
    }
}
export class Corners_Number_serializer {
    public static write(buffer: SerializerBase, value: Corners<number>): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForTopLeft  = value.topLeft
        valueSerializer.writeNumber(valueHolderForTopLeft)
        const valueHolderForTopRight  = value.topRight
        valueSerializer.writeNumber(valueHolderForTopRight)
        const valueHolderForBottomLeft  = value.bottomLeft
        valueSerializer.writeNumber(valueHolderForBottomLeft)
        const valueHolderForBottomRight  = value.bottomRight
        valueSerializer.writeNumber(valueHolderForBottomRight)
    }
    public static read(buffer: DeserializerBase): Corners<number> {
        let valueDeserializer : DeserializerBase = buffer
        const topLeftTmpResult : number = (valueDeserializer.readNumber() as number)
        const topRightTmpResult : number = (valueDeserializer.readNumber() as number)
        const bottomLeftTmpResult : number = (valueDeserializer.readNumber() as number)
        const bottomRightTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Corners<number> = ({topLeft: topLeftTmpResult, topRight: topRightTmpResult, bottomLeft: bottomLeftTmpResult, bottomRight: bottomRightTmpResult} as Corners<number>)
        return value
    }
}
export class DrawContext_serializer {
    public static write(buffer: SerializerBase, value: DrawContext): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): DrawContext {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return DrawContextInternal.fromPtr(ptr)
    }
}
export class Edges_Number_serializer {
    public static write(buffer: SerializerBase, value: Edges<number>): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForLeft  = value.left
        valueSerializer.writeNumber(valueHolderForLeft)
        const valueHolderForRight  = value.right
        valueSerializer.writeNumber(valueHolderForRight)
        const valueHolderForTop  = value.top
        valueSerializer.writeNumber(valueHolderForTop)
        const valueHolderForBottom  = value.bottom
        valueSerializer.writeNumber(valueHolderForBottom)
    }
    public static read(buffer: DeserializerBase): Edges<number> {
        let valueDeserializer : DeserializerBase = buffer
        const leftTmpResult : number = (valueDeserializer.readNumber() as number)
        const rightTmpResult : number = (valueDeserializer.readNumber() as number)
        const topTmpResult : number = (valueDeserializer.readNumber() as number)
        const bottomTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Edges<number> = ({left: leftTmpResult, right: rightTmpResult, top: topTmpResult, bottom: bottomTmpResult} as Edges<number>)
        return value
    }
}
export class Frame_serializer {
    public static write(buffer: SerializerBase, value: Frame): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForX  = value.x
        valueSerializer.writeNumber(valueHolderForX)
        const valueHolderForY  = value.y
        valueSerializer.writeNumber(valueHolderForY)
        const valueHolderForWidth  = value.width
        valueSerializer.writeNumber(valueHolderForWidth)
        const valueHolderForHeight  = value.height
        valueSerializer.writeNumber(valueHolderForHeight)
    }
    public static read(buffer: DeserializerBase): Frame {
        let valueDeserializer : DeserializerBase = buffer
        const xTmpResult : number = (valueDeserializer.readNumber() as number)
        const yTmpResult : number = (valueDeserializer.readNumber() as number)
        const widthTmpResult : number = (valueDeserializer.readNumber() as number)
        const heightTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : Frame = ({x: xTmpResult, y: yTmpResult, width: widthTmpResult, height: heightTmpResult} as Frame)
        return value
    }
}
export class LengthMetrics_serializer {
    public static write(buffer: SerializerBase, value: LengthMetrics): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): LengthMetrics {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return LengthMetricsInternal.fromPtr(ptr)
    }
}
export class RoundRect_serializer {
    public static write(buffer: SerializerBase, value: RoundRect): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForRect  = value.rect
        common2D_Rect_serializer.write(valueSerializer, valueHolderForRect)
        const valueHolderForCorners  = value.corners
        Corners_Arkui_Graphics_Vector2_serializer.write(valueSerializer, valueHolderForCorners)
    }
    public static read(buffer: DeserializerBase): RoundRect {
        let valueDeserializer : DeserializerBase = buffer
        const rectTmpResult : common2D.Rect = common2D_Rect_serializer.read(valueDeserializer)
        const cornersTmpResult : Corners<Vector2> = Corners_Arkui_Graphics_Vector2_serializer.read(valueDeserializer)
        let value : RoundRect = ({rect: rectTmpResult, corners: cornersTmpResult} as RoundRect)
        return value
    }
}
