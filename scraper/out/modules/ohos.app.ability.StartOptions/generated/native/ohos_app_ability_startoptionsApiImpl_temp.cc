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
#include "ohos_app_ability_startoptions.h"

OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandle StartOptions_constructImpl();
void StartOptions_destructImpl(OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsHandle thisPtr);
Opt_Int64 StartOptions_getDisplayIdImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getMaxWindowHeightImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getMaxWindowWidthImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getMinWindowHeightImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getMinWindowWidthImpl(OH_NativePointer thisPtr);
Opt_contextConstant_ProcessMode StartOptions_getProcessModeImpl(OH_NativePointer thisPtr);
Opt_contextConstant_StartupVisibility StartOptions_getStartupVisibilityImpl(OH_NativePointer thisPtr);
Opt_String StartOptions_getStartWindowBackgroundColorImpl(OH_NativePointer thisPtr);
Opt_image_PixelMap StartOptions_getStartWindowIconImpl(OH_NativePointer thisPtr);
Opt_Array_bundleManager_SupportWindowMode StartOptions_getSupportWindowModesImpl(OH_NativePointer thisPtr);
Opt_Boolean StartOptions_getWindowFocusedImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getWindowHeightImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getWindowLeftImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getWindowModeImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getWindowTopImpl(OH_NativePointer thisPtr);
Opt_Int32 StartOptions_getWindowWidthImpl(OH_NativePointer thisPtr);
Opt_Boolean StartOptions_getWithAnimationImpl(OH_NativePointer thisPtr);
void StartOptions_setDisplayIdImpl(OH_NativePointer thisPtr, const Opt_Int64* value);
void StartOptions_setMaxWindowHeightImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setMaxWindowWidthImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setMinWindowHeightImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setMinWindowWidthImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setProcessModeImpl(OH_NativePointer thisPtr, const Opt_contextConstant_ProcessMode* value);
void StartOptions_setStartupVisibilityImpl(OH_NativePointer thisPtr, const Opt_contextConstant_StartupVisibility* value);
void StartOptions_setStartWindowBackgroundColorImpl(OH_NativePointer thisPtr, const Opt_String* value);
void StartOptions_setStartWindowIconImpl(OH_NativePointer thisPtr, const Opt_image_PixelMap* value);
void StartOptions_setSupportWindowModesImpl(OH_NativePointer thisPtr, const Opt_Array_bundleManager_SupportWindowMode* value);
void StartOptions_setWindowFocusedImpl(OH_NativePointer thisPtr, const Opt_Boolean* value);
void StartOptions_setWindowHeightImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setWindowLeftImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setWindowModeImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setWindowTopImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setWindowWidthImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void StartOptions_setWithAnimationImpl(OH_NativePointer thisPtr, const Opt_Boolean* value);
const OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifier* OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifierImpl() {
    const static OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifier instance = {
        &StartOptions_constructImpl,
        &StartOptions_destructImpl,
        &StartOptions_getWindowModeImpl,
        &StartOptions_setWindowModeImpl,
        &StartOptions_getDisplayIdImpl,
        &StartOptions_setDisplayIdImpl,
        &StartOptions_getWithAnimationImpl,
        &StartOptions_setWithAnimationImpl,
        &StartOptions_getWindowLeftImpl,
        &StartOptions_setWindowLeftImpl,
        &StartOptions_getWindowTopImpl,
        &StartOptions_setWindowTopImpl,
        &StartOptions_getWindowWidthImpl,
        &StartOptions_setWindowWidthImpl,
        &StartOptions_getWindowHeightImpl,
        &StartOptions_setWindowHeightImpl,
        &StartOptions_getWindowFocusedImpl,
        &StartOptions_setWindowFocusedImpl,
        &StartOptions_getProcessModeImpl,
        &StartOptions_setProcessModeImpl,
        &StartOptions_getStartupVisibilityImpl,
        &StartOptions_setStartupVisibilityImpl,
        &StartOptions_getStartWindowIconImpl,
        &StartOptions_setStartWindowIconImpl,
        &StartOptions_getStartWindowBackgroundColorImpl,
        &StartOptions_setStartWindowBackgroundColorImpl,
        &StartOptions_getSupportWindowModesImpl,
        &StartOptions_setSupportWindowModesImpl,
        &StartOptions_getMinWindowWidthImpl,
        &StartOptions_setMinWindowWidthImpl,
        &StartOptions_getMinWindowHeightImpl,
        &StartOptions_setMinWindowHeightImpl,
        &StartOptions_getMaxWindowWidthImpl,
        &StartOptions_setMaxWindowWidthImpl,
        &StartOptions_getMaxWindowHeightImpl,
        &StartOptions_setMaxWindowHeightImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_APP_ABILITY_STARTOPTIONS_API* GetOHOS_APP_ABILITY_STARTOPTIONSAPIImpl(int version) {
    const static OH_OHOS_APP_ABILITY_STARTOPTIONS_API api = {
        1, // version
        &OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptionsModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_APP_ABILITY_STARTOPTIONS_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_APP_ABILITY_STARTOPTIONSAPIImpl(version));
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
