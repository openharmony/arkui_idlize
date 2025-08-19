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
#include "ohos_app_ability_ability.h"

OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle Ability_constructImpl();
void Ability_destructImpl(OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle thisPtr);
void Ability_onConfigurationUpdateImpl(OH_NativePointer thisPtr, const OH_OHOS_APP_ABILITY_ABILITY_Configuration* newConfig);
void Ability_onMemoryLevelImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_MemoryLevel level);
OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle AbilityLifecycleCallback_constructImpl();
void AbilityLifecycleCallback_destructImpl(OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle thisPtr);
void AbilityLifecycleCallback_onAbilityBackgroundImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
void AbilityLifecycleCallback_onAbilityCreateImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
void AbilityLifecycleCallback_onAbilityDestroyImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
void AbilityLifecycleCallback_onAbilityForegroundImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability);
void AbilityLifecycleCallback_onWindowStageCreateImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability, OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage windowStage);
void AbilityLifecycleCallback_onWindowStageDestroyImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability, OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage windowStage);
const OH_OHOS_APP_ABILITY_ABILITY_AbilityModifier* OH_OHOS_APP_ABILITY_ABILITY_AbilityModifierImpl() {
    const static OH_OHOS_APP_ABILITY_ABILITY_AbilityModifier instance = {
        &Ability_constructImpl,
        &Ability_destructImpl,
        &Ability_onConfigurationUpdateImpl,
        &Ability_onMemoryLevelImpl,
    };
    return &instance;
}
const OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifier* OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifierImpl() {
    const static OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifier instance = {
        &AbilityLifecycleCallback_constructImpl,
        &AbilityLifecycleCallback_destructImpl,
        &AbilityLifecycleCallback_onAbilityCreateImpl,
        &AbilityLifecycleCallback_onWindowStageCreateImpl,
        &AbilityLifecycleCallback_onWindowStageDestroyImpl,
        &AbilityLifecycleCallback_onAbilityDestroyImpl,
        &AbilityLifecycleCallback_onAbilityForegroundImpl,
        &AbilityLifecycleCallback_onAbilityBackgroundImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_APP_ABILITY_ABILITY_API* GetOHOS_APP_ABILITY_ABILITYAPIImpl(int version) {
    const static OH_OHOS_APP_ABILITY_ABILITY_API api = {
        1, // version
        &OH_OHOS_APP_ABILITY_ABILITY_AbilityModifierImpl,
        &OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_APP_ABILITY_ABILITY_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_APP_ABILITY_ABILITYAPIImpl(version));
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
