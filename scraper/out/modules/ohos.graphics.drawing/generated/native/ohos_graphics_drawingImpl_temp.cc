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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_graphics_drawing.h"

OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle drawing_Brush_construct0Impl() {
    return {};
}
OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle drawing_Brush_construct1Impl(OH_OHOS_GRAPHICS_DRAWING_drawing_Brush brush) {
    return {};
}
void drawing_Brush_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle thisPtr) {
}
void drawing_Brush_resetImpl(OH_NativePointer thisPtr) {
}
void drawing_Brush_setBlendModeImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode mode) {
}
void drawing_Canvas_attachBrushImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_drawing_Brush brush) {
}
OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle drawing_Canvas_constructImpl(OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap) {
    return {};
}
void drawing_Canvas_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle thisPtr) {
}
void drawing_Canvas_detachBrushImpl(OH_NativePointer thisPtr) {
}
void drawing_Canvas_drawImageRectImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* dstRect, const Opt_drawing_SamplingOptions* samplingOptions) {
}
void drawing_Canvas_drawPixelMapMeshImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap, OH_Int32 meshWidth, OH_Int32 meshHeight, const Array_Float64* vertices, OH_Int32 vertOffset, const Array_Int32* colors, OH_Int32 colorOffset) {
}
void drawing_Canvas_drawRect0Impl(OH_NativePointer thisPtr, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* rect) {
}
void drawing_Canvas_drawRect1Impl(OH_NativePointer thisPtr, OH_Float64 left, OH_Float64 top, OH_Float64 right, OH_Float64 bottom) {
}
void drawing_Canvas_restoreImpl(OH_NativePointer thisPtr) {
}
void drawing_Canvas_rotateImpl(OH_NativePointer thisPtr, OH_Float64 degrees, OH_Float64 sx, OH_Float64 sy) {
}
OH_Int64 drawing_Canvas_saveLayerImpl(OH_NativePointer thisPtr, const Opt_common2D_Rect* rect, const Opt_drawing_Brush* brush) {
    return {};
}
OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle drawing_ColorFilter_constructImpl() {
    return {};
}
OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter drawing_ColorFilter_createBlendModeColorFilterImpl(const OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32* color, OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode mode) {
    return {};
}
void drawing_ColorFilter_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle thisPtr) {
}
OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle drawing_Lattice_constructImpl() {
    return {};
}
OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice drawing_Lattice_createImageLatticeImpl(const Array_Int32* xDivs, const Array_Int32* yDivs, OH_Int32 fXCount, OH_Int32 fYCount, const Opt_common2D_Rect* fBounds, const Opt_Array_drawing_RectType* fRectTypes, const Opt_Array_common2D_Color* fColors) {
    return {};
}
void drawing_Lattice_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle thisPtr) {
}
OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle drawing_SamplingOptions_construct0Impl() {
    return {};
}
OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle drawing_SamplingOptions_construct1Impl(OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode filterMode) {
    return {};
}
void drawing_SamplingOptions_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle thisPtr) {
}