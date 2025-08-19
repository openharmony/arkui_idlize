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
#include "ohos_graphics_colorspacemanager.h"

OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpaceManagerHandle colorSpaceManager_ColorSpaceManager_constructImpl();
void colorSpaceManager_ColorSpaceManager_destructImpl(OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpaceManagerHandle thisPtr);
OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpace colorSpaceManager_ColorSpaceManager_getColorSpaceNameImpl(OH_NativePointer thisPtr);
OH_Float64 colorSpaceManager_ColorSpaceManager_getGammaImpl(OH_NativePointer thisPtr);
Array_Float64 colorSpaceManager_ColorSpaceManager_getWhitePointImpl(OH_NativePointer thisPtr);
const OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpaceManagerModifier* OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpaceManagerModifierImpl() {
    const static OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpaceManagerModifier instance = {
        &colorSpaceManager_ColorSpaceManager_constructImpl,
        &colorSpaceManager_ColorSpaceManager_destructImpl,
        &colorSpaceManager_ColorSpaceManager_getColorSpaceNameImpl,
        &colorSpaceManager_ColorSpaceManager_getWhitePointImpl,
        &colorSpaceManager_ColorSpaceManager_getGammaImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_GRAPHICS_COLORSPACEMANAGER_API* GetOHOS_GRAPHICS_COLORSPACEMANAGERAPIImpl(int version) {
    const static OH_OHOS_GRAPHICS_COLORSPACEMANAGER_API api = {
        1, // version
        &OH_OHOS_GRAPHICS_COLORSPACEMANAGER_colorSpaceManager_ColorSpaceManagerModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_GRAPHICS_COLORSPACEMANAGER_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_GRAPHICS_COLORSPACEMANAGERAPIImpl(version));
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
