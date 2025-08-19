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

OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle Ability_constructImpl() {
    return {};
}
void Ability_destructImpl(OH_OHOS_APP_ABILITY_ABILITY_AbilityHandle thisPtr) {
}
void Ability_onConfigurationUpdateImpl(OH_NativePointer thisPtr, const OH_OHOS_APP_ABILITY_ABILITY_Configuration* newConfig) {
}
void Ability_onMemoryLevelImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_AbilityConstant_MemoryLevel level) {
}
OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle AbilityLifecycleCallback_constructImpl() {
    return {};
}
void AbilityLifecycleCallback_destructImpl(OH_OHOS_APP_ABILITY_ABILITY_AbilityLifecycleCallbackHandle thisPtr) {
}
void AbilityLifecycleCallback_onAbilityBackgroundImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability) {
}
void AbilityLifecycleCallback_onAbilityCreateImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability) {
}
void AbilityLifecycleCallback_onAbilityDestroyImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability) {
}
void AbilityLifecycleCallback_onAbilityForegroundImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability) {
}
void AbilityLifecycleCallback_onWindowStageCreateImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability, OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage windowStage) {
}
void AbilityLifecycleCallback_onWindowStageDestroyImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ABILITY_UIAbility ability, OH_OHOS_APP_ABILITY_ABILITY_window_WindowStage windowStage) {
}