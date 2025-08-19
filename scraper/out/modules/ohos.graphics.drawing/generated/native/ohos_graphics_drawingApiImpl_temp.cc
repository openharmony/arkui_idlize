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

OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle drawing_Brush_construct0Impl();
OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle drawing_Brush_construct1Impl(OH_OHOS_GRAPHICS_DRAWING_drawing_Brush brush);
void drawing_Brush_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_BrushHandle thisPtr);
void drawing_Brush_resetImpl(OH_NativePointer thisPtr);
void drawing_Brush_setBlendModeImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode mode);
void drawing_Canvas_attachBrushImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_drawing_Brush brush);
OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle drawing_Canvas_constructImpl(OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap);
void drawing_Canvas_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasHandle thisPtr);
void drawing_Canvas_detachBrushImpl(OH_NativePointer thisPtr);
void drawing_Canvas_drawImageRectImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* dstRect, const Opt_drawing_SamplingOptions* samplingOptions);
void drawing_Canvas_drawPixelMapMeshImpl(OH_NativePointer thisPtr, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap pixelmap, OH_Int32 meshWidth, OH_Int32 meshHeight, const Array_Float64* vertices, OH_Int32 vertOffset, const Array_Int32* colors, OH_Int32 colorOffset);
void drawing_Canvas_drawRect0Impl(OH_NativePointer thisPtr, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* rect);
void drawing_Canvas_drawRect1Impl(OH_NativePointer thisPtr, OH_Float64 left, OH_Float64 top, OH_Float64 right, OH_Float64 bottom);
void drawing_Canvas_restoreImpl(OH_NativePointer thisPtr);
void drawing_Canvas_rotateImpl(OH_NativePointer thisPtr, OH_Float64 degrees, OH_Float64 sx, OH_Float64 sy);
OH_Int64 drawing_Canvas_saveLayerImpl(OH_NativePointer thisPtr, const Opt_common2D_Rect* rect, const Opt_drawing_Brush* brush);
OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle drawing_ColorFilter_constructImpl();
OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter drawing_ColorFilter_createBlendModeColorFilterImpl(const OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32* color, OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode mode);
void drawing_ColorFilter_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterHandle thisPtr);
OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle drawing_Lattice_constructImpl();
OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice drawing_Lattice_createImageLatticeImpl(const Array_Int32* xDivs, const Array_Int32* yDivs, OH_Int32 fXCount, OH_Int32 fYCount, const Opt_common2D_Rect* fBounds, const Opt_Array_drawing_RectType* fRectTypes, const Opt_Array_common2D_Color* fColors);
void drawing_Lattice_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeHandle thisPtr);
OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle drawing_SamplingOptions_construct0Impl();
OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle drawing_SamplingOptions_construct1Impl(OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode filterMode);
void drawing_SamplingOptions_destructImpl(OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsHandle thisPtr);
const OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifier* OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifierImpl() {
    const static OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifier instance = {
        &drawing_Brush_construct0Impl,
        &drawing_Brush_construct1Impl,
        &drawing_Brush_destructImpl,
        &drawing_Brush_setBlendModeImpl,
        &drawing_Brush_resetImpl,
    };
    return &instance;
}
const OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifier* OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifierImpl() {
    const static OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifier instance = {
        &drawing_Canvas_constructImpl,
        &drawing_Canvas_destructImpl,
        &drawing_Canvas_drawRect0Impl,
        &drawing_Canvas_drawRect1Impl,
        &drawing_Canvas_drawImageRectImpl,
        &drawing_Canvas_drawPixelMapMeshImpl,
        &drawing_Canvas_attachBrushImpl,
        &drawing_Canvas_detachBrushImpl,
        &drawing_Canvas_saveLayerImpl,
        &drawing_Canvas_restoreImpl,
        &drawing_Canvas_rotateImpl,
    };
    return &instance;
}
const OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifier* OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifierImpl() {
    const static OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifier instance = {
        &drawing_ColorFilter_constructImpl,
        &drawing_ColorFilter_destructImpl,
        &drawing_ColorFilter_createBlendModeColorFilterImpl,
    };
    return &instance;
}
const OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifier* OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifierImpl() {
    const static OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifier instance = {
        &drawing_Lattice_constructImpl,
        &drawing_Lattice_destructImpl,
        &drawing_Lattice_createImageLatticeImpl,
    };
    return &instance;
}
const OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifier* OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifierImpl() {
    const static OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifier instance = {
        &drawing_SamplingOptions_construct0Impl,
        &drawing_SamplingOptions_construct1Impl,
        &drawing_SamplingOptions_destructImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_GRAPHICS_DRAWING_API* GetOHOS_GRAPHICS_DRAWINGAPIImpl(int version) {
    const static OH_OHOS_GRAPHICS_DRAWING_API api = {
        1, // version
        &OH_OHOS_GRAPHICS_DRAWING_drawing_BrushModifierImpl,
        &OH_OHOS_GRAPHICS_DRAWING_drawing_CanvasModifierImpl,
        &OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilterModifierImpl,
        &OH_OHOS_GRAPHICS_DRAWING_drawing_LatticeModifierImpl,
        &OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptionsModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_GRAPHICS_DRAWING_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_GRAPHICS_DRAWINGAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}
