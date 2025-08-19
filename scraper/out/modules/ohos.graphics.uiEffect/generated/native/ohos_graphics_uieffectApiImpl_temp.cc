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
#include "ohos_graphics_uieffect.h"

OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter uiEffect_Filter_blurImpl(OH_NativePointer thisPtr, OH_Float64 blurRadius);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FilterHandle uiEffect_Filter_constructImpl();
void uiEffect_Filter_destructImpl(OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FilterHandle thisPtr);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter uiEffect_Filter_distortImpl(OH_NativePointer thisPtr, OH_Float64 distortionK);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter uiEffect_Filter_flyInFlyOutEffectImpl(OH_NativePointer thisPtr, OH_Float64 degree, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FlyMode flyMode);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter uiEffect_Filter_pixelStretchImpl(OH_NativePointer thisPtr, const Array_Float64* stretchSizes, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_TileMode tileMode);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter uiEffect_Filter_waterRippleImpl(OH_NativePointer thisPtr, OH_Float64 progress, OH_Int32 waveCount, OH_Float64 x, OH_Float64 y, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_WaterRippleMode rippleMode);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect uiEffect_VisualEffect_backgroundColorBlenderImpl(OH_NativePointer thisPtr, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender* blender);
OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffectHandle uiEffect_VisualEffect_constructImpl();
void uiEffect_VisualEffect_destructImpl(OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffectHandle thisPtr);
const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FilterModifier* OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FilterModifierImpl() {
    const static OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FilterModifier instance = {
        &uiEffect_Filter_constructImpl,
        &uiEffect_Filter_destructImpl,
        &uiEffect_Filter_pixelStretchImpl,
        &uiEffect_Filter_blurImpl,
        &uiEffect_Filter_waterRippleImpl,
        &uiEffect_Filter_flyInFlyOutEffectImpl,
        &uiEffect_Filter_distortImpl,
    };
    return &instance;
}
const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffectModifier* OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffectModifierImpl() {
    const static OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffectModifier instance = {
        &uiEffect_VisualEffect_constructImpl,
        &uiEffect_VisualEffect_destructImpl,
        &uiEffect_VisualEffect_backgroundColorBlenderImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_GRAPHICS_UIEFFECT_API* GetOHOS_GRAPHICS_UIEFFECTAPIImpl(int version) {
    const static OH_OHOS_GRAPHICS_UIEFFECT_API api = {
        1, // version
        &OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FilterModifierImpl,
        &OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffectModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_GRAPHICS_UIEFFECT_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_GRAPHICS_UIEFFECTAPIImpl(version));
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
