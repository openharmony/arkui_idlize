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

import { extractors } from "#handwritten"
import { TypeChecker, OHOS_GRAPHICS_DRAWINGNativeModule, common2D_Rect_serializer, drawing_SamplingOptions_serializer, drawing_Brush_serializer, common2D_Color_serializer } from "./ohos.graphics.drawing.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { default as image } from "@ohos.multimedia.image"
import { default as common2D } from "@ohos.graphics.common2D"
export default drawing
export namespace drawing {
    export class BrushInternal {
        public static fromPtr(ptr: KPointer): drawing.Brush {
            return new drawing.Brush(false, ptr)
        }
    }
    export class Brush implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(_0: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Brush.getFinalizer())
        }
        constructor() {
            this(false, Brush.construct0())
        }
        constructor(brush: Brush) {
            this(false, Brush.construct1(brush))
        }
        static construct0(): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Brush_construct0()
            return retval
        }
        static construct1(brush: Brush): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Brush_construct1(extractors.toDrawingBrushPtr(brush))
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Brush_getFinalizer()
        }
        public setBlendMode(mode: BlendMode): void {
            const mode_casted = mode as (BlendMode)
            this.setBlendMode_serialize(mode_casted)
            return
        }
        public reset(): void {
            this.reset_serialize()
            return
        }
        setBlendMode_serialize(mode: BlendMode): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Brush_setBlendMode(this.peer!.ptr, TypeChecker.drawing_BlendMode_ToNumeric(mode))
        }
        reset_serialize(): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Brush_reset(this.peer!.ptr)
        }
    }
    export class CanvasInternal {
        public static fromPtr(ptr: KPointer): drawing.Canvas {
            return new drawing.Canvas(false, ptr)
        }
    }
    export class Canvas implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(_0: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Canvas.getFinalizer())
        }
        constructor(pixelmap: image.PixelMap) {
            this(false, Canvas.construct(pixelmap))
        }
        static construct(pixelmap: image.PixelMap): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_construct(extractors.toImagePixelMapPtr(pixelmap))
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_getFinalizer()
        }
        public drawRect(rect: common2D.Rect): void {
            const rect_casted = rect as (common2D.Rect)
            this.drawRect0_serialize(rect_casted)
            return
        }
        public drawRect(left: double, top: double, right: double, bottom: double): void {
            const left_casted = left as (double)
            const top_casted = top as (double)
            const right_casted = right as (double)
            const bottom_casted = bottom as (double)
            this.drawRect1_serialize(left_casted, top_casted, right_casted, bottom_casted)
            return
        }
        public drawImageRect(pixelmap: image.PixelMap, dstRect: common2D.Rect, samplingOptions?: SamplingOptions): void {
            const pixelmap_casted = pixelmap as (image.PixelMap)
            const dstRect_casted = dstRect as (common2D.Rect)
            const samplingOptions_casted = samplingOptions as (SamplingOptions | undefined)
            this.drawImageRect_serialize(pixelmap_casted, dstRect_casted, samplingOptions_casted)
            return
        }
        public drawPixelMapMesh(pixelmap: image.PixelMap, meshWidth: int32, meshHeight: int32, vertices: Array<double>, vertOffset: int32, colors: KInt32ArrayPtr, colorOffset: int32): void {
            const pixelmap_casted = pixelmap as (image.PixelMap)
            const meshWidth_casted = meshWidth as (int32)
            const meshHeight_casted = meshHeight as (int32)
            const vertices_casted = vertices as (Array<double>)
            const vertOffset_casted = vertOffset as (int32)
            const colors_casted = colors as (KInt32ArrayPtr)
            const colorOffset_casted = colorOffset as (int32)
            this.drawPixelMapMesh_serialize(pixelmap_casted, meshWidth_casted, meshHeight_casted, vertices_casted, vertOffset_casted, colors_casted, colorOffset_casted)
            return
        }
        public attachBrush(brush: Brush): void {
            const brush_casted = brush as (Brush)
            this.attachBrush_serialize(brush_casted)
            return
        }
        public detachBrush(): void {
            this.detachBrush_serialize()
            return
        }
        public saveLayer(rect?: common2D.Rect, brush?: Brush): int64 {
            const rect_casted = rect as (common2D.Rect | undefined)
            const brush_casted = brush as (Brush | undefined)
            return this.saveLayer_serialize(rect_casted, brush_casted)
        }
        public restore(): void {
            this.restore_serialize()
            return
        }
        public rotate(degrees: double, sx: double, sy: double): void {
            const degrees_casted = degrees as (double)
            const sx_casted = sx as (double)
            const sy_casted = sy as (double)
            this.rotate_serialize(degrees_casted, sx_casted, sy_casted)
            return
        }
        drawRect0_serialize(rect: common2D.Rect): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            common2D_Rect_serializer.write(thisSerializer, rect)
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_drawRect0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        drawRect1_serialize(left: double, top: double, right: double, bottom: double): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_drawRect1(this.peer!.ptr, left, top, right, bottom)
        }
        drawImageRect_serialize(pixelmap: image.PixelMap, dstRect: common2D.Rect, samplingOptions?: SamplingOptions): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            common2D_Rect_serializer.write(thisSerializer, dstRect)
            if (samplingOptions !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const samplingOptionsTmpValue  = samplingOptions!
                drawing_SamplingOptions_serializer.write(thisSerializer, samplingOptionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_drawImageRect(this.peer!.ptr, extractors.toImagePixelMapPtr(pixelmap), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        drawPixelMapMesh_serialize(pixelmap: image.PixelMap, meshWidth: int32, meshHeight: int32, vertices: Array<double>, vertOffset: int32, colors: KInt32ArrayPtr, colorOffset: int32): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((vertices.length).toInt())
            for (let verticesCounterI = 0; verticesCounterI < vertices.length; verticesCounterI++) {
                const verticesTmpElement : double = vertices[verticesCounterI]
                thisSerializer.writeFloat64(verticesTmpElement)
            }
            thisSerializer.writeInt32((colors.length).toInt())
            for (let colorsCounterI = 0; colorsCounterI < colors.length; colorsCounterI++) {
                const colorsTmpElement : int32 = colors[colorsCounterI]
                thisSerializer.writeInt32(colorsTmpElement)
            }
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_drawPixelMapMesh(this.peer!.ptr, extractors.toImagePixelMapPtr(pixelmap), meshWidth, meshHeight, thisSerializer.asBuffer(), thisSerializer.length(), vertOffset, colorOffset)
            thisSerializer.release()
        }
        attachBrush_serialize(brush: Brush): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_attachBrush(this.peer!.ptr, extractors.toDrawingBrushPtr(brush))
        }
        detachBrush_serialize(): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_detachBrush(this.peer!.ptr)
        }
        saveLayer_serialize(rect?: common2D.Rect, brush?: Brush): int64 {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (rect !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const rectTmpValue  = rect!
                common2D_Rect_serializer.write(thisSerializer, rectTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (brush !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const brushTmpValue  = brush!
                drawing_Brush_serializer.write(thisSerializer, brushTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_saveLayer(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        restore_serialize(): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_restore(this.peer!.ptr)
        }
        rotate_serialize(degrees: double, sx: double, sy: double): void {
            OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Canvas_rotate(this.peer!.ptr, degrees, sx, sy)
        }
    }
    export class ColorFilterInternal {
        public static fromPtr(ptr: KPointer): drawing.ColorFilter {
            return new drawing.ColorFilter(ptr)
        }
    }
    export class ColorFilter implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, ColorFilter.getFinalizer())
        }
        constructor() {
            this(ColorFilter.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_ColorFilter_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_DRAWINGNativeModule._drawing_ColorFilter_getFinalizer()
        }
        static createBlendModeColorFilter_serialize(color: common2D.Color | int32, mode: BlendMode): ColorFilter {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (color instanceof common2D.Color) {
                thisSerializer.writeInt8((0).toChar())
                const colorForIdx0  = color as common2D.Color
                common2D_Color_serializer.write(thisSerializer, colorForIdx0)
            } else if (color instanceof int32) {
                thisSerializer.writeInt8((1).toChar())
                const colorForIdx1  = color as int32
                thisSerializer.writeInt32(colorForIdx1)
            }
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_ColorFilter_createBlendModeColorFilter(thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.drawing_BlendMode_ToNumeric(mode))
            thisSerializer.release()
            const obj : ColorFilter = extractors.fromDrawingColorFilterPtr(retval)
            return obj
        }
        public static createBlendModeColorFilter(color: common2D.Color | int32, mode: BlendMode): ColorFilter {
            const color_casted = color as (common2D.Color | int32)
            const mode_casted = mode as (BlendMode)
            return ColorFilter.createBlendModeColorFilter_serialize(color_casted, mode_casted)
        }
    }
    export class LatticeInternal {
        public static fromPtr(ptr: KPointer): drawing.Lattice {
            return new drawing.Lattice(ptr)
        }
    }
    export class Lattice implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Lattice.getFinalizer())
        }
        constructor() {
            this(Lattice.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Lattice_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Lattice_getFinalizer()
        }
        static createImageLattice_serialize(xDivs: KInt32ArrayPtr, yDivs: KInt32ArrayPtr, fXCount: int32, fYCount: int32, fBounds?: common2D.Rect, fRectTypes?: Array<RectType>, fColors?: Array<common2D.Color>): Lattice {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((xDivs.length).toInt())
            for (let xDivsCounterI = 0; xDivsCounterI < xDivs.length; xDivsCounterI++) {
                const xDivsTmpElement : int32 = xDivs[xDivsCounterI]
                thisSerializer.writeInt32(xDivsTmpElement)
            }
            thisSerializer.writeInt32((yDivs.length).toInt())
            for (let yDivsCounterI = 0; yDivsCounterI < yDivs.length; yDivsCounterI++) {
                const yDivsTmpElement : int32 = yDivs[yDivsCounterI]
                thisSerializer.writeInt32(yDivsTmpElement)
            }
            if (fBounds !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const fBoundsTmpValue  = fBounds!
                common2D_Rect_serializer.write(thisSerializer, fBoundsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (fRectTypes !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const fRectTypesTmpValue  = fRectTypes!
                thisSerializer.writeInt32((fRectTypesTmpValue.length).toInt())
                for (let fRectTypesTmpValueCounterI = 0; fRectTypesTmpValueCounterI < fRectTypesTmpValue.length; fRectTypesTmpValueCounterI++) {
                    const fRectTypesTmpValueTmpElement : RectType = fRectTypesTmpValue[fRectTypesTmpValueCounterI]
                    thisSerializer.writeInt32(TypeChecker.drawing_RectType_ToNumeric(fRectTypesTmpValueTmpElement))
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (fColors !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const fColorsTmpValue  = fColors!
                thisSerializer.writeInt32((fColorsTmpValue.length).toInt())
                for (let fColorsTmpValueCounterI = 0; fColorsTmpValueCounterI < fColorsTmpValue.length; fColorsTmpValueCounterI++) {
                    const fColorsTmpValueTmpElement : common2D.Color = fColorsTmpValue[fColorsTmpValueCounterI]
                    common2D_Color_serializer.write(thisSerializer, fColorsTmpValueTmpElement)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_Lattice_createImageLattice(thisSerializer.asBuffer(), thisSerializer.length(), fXCount, fYCount)
            thisSerializer.release()
            const obj : Lattice = extractors.fromDrawingLatticePtr(retval)
            return obj
        }
        public static createImageLattice(xDivs: KInt32ArrayPtr, yDivs: KInt32ArrayPtr, fXCount: int32, fYCount: int32, fBounds?: common2D.Rect, fRectTypes?: Array<RectType>, fColors?: Array<common2D.Color>): Lattice {
            const xDivs_casted = xDivs as (KInt32ArrayPtr)
            const yDivs_casted = yDivs as (KInt32ArrayPtr)
            const fXCount_casted = fXCount as (int32)
            const fYCount_casted = fYCount as (int32)
            const fBounds_casted = fBounds as (common2D.Rect | undefined)
            const fRectTypes_casted = fRectTypes as (Array<RectType> | undefined)
            const fColors_casted = fColors as (Array<common2D.Color> | undefined)
            return Lattice.createImageLattice_serialize(xDivs_casted, yDivs_casted, fXCount_casted, fYCount_casted, fBounds_casted, fRectTypes_casted, fColors_casted)
        }
    }
    export class SamplingOptionsInternal {
        public static fromPtr(ptr: KPointer): drawing.SamplingOptions {
            return new drawing.SamplingOptions(false, ptr)
        }
    }
    export class SamplingOptions implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(_0: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, SamplingOptions.getFinalizer())
        }
        constructor() {
            this(false, SamplingOptions.construct0())
        }
        constructor(filterMode: FilterMode) {
            this(false, SamplingOptions.construct1(filterMode))
        }
        static construct0(): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_SamplingOptions_construct0()
            return retval
        }
        static construct1(filterMode: FilterMode): KPointer {
            const retval  = OHOS_GRAPHICS_DRAWINGNativeModule._drawing_SamplingOptions_construct1(TypeChecker.drawing_FilterMode_ToNumeric(filterMode))
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_DRAWINGNativeModule._drawing_SamplingOptions_getFinalizer()
        }
    }
    export enum BlendMode {
        CLEAR = 0,
        SRC = 1,
        DST = 2,
        SRC_OVER = 3,
        DST_OVER = 4,
        SRC_IN = 5,
        DST_IN = 6,
        SRC_OUT = 7,
        DST_OUT = 8,
        SRC_ATOP = 9,
        DST_ATOP = 10,
        XOR = 11,
        PLUS = 12,
        MODULATE = 13,
        SCREEN = 14,
        OVERLAY = 15,
        DARKEN = 16,
        LIGHTEN = 17,
        COLOR_DODGE = 18,
        COLOR_BURN = 19,
        HARD_LIGHT = 20,
        SOFT_LIGHT = 21,
        DIFFERENCE = 22,
        EXCLUSION = 23,
        MULTIPLY = 24,
        HUE = 25,
        SATURATION = 26,
        COLOR = 27,
        LUMINOSITY = 28
    }
    export enum FilterMode {
        FILTER_MODE_NEAREST = 0,
        FILTER_MODE_LINEAR = 1
    }
    export enum RectType {
        DEFAULT = 0,
        TRANSPARENT = 1,
        FIXEDCOLOR = 2
    }
}
