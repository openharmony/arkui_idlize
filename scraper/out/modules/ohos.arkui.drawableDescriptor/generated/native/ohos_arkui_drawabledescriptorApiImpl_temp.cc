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
#include "ohos_arkui_drawabledescriptor.h"

OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_DrawableDescriptorHandle DrawableDescriptor_constructImpl();
void DrawableDescriptor_destructImpl(OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_DrawableDescriptorHandle thisPtr);
Opt_image_PixelMap DrawableDescriptor_getPixelMapImpl(OH_NativePointer thisPtr);
const OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_DrawableDescriptorModifier* OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_DrawableDescriptorModifierImpl() {
    const static OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_DrawableDescriptorModifier instance = {
        &DrawableDescriptor_constructImpl,
        &DrawableDescriptor_destructImpl,
        &DrawableDescriptor_getPixelMapImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_API* GetOHOS_ARKUI_DRAWABLEDESCRIPTORAPIImpl(int version) {
    const static OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_API api = {
        1, // version
        &OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_DrawableDescriptorModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_ARKUI_DRAWABLEDESCRIPTOR_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_ARKUI_DRAWABLEDESCRIPTORAPIImpl(version));
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
