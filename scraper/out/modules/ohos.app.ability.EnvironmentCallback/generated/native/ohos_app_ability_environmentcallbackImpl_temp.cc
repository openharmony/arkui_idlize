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
#include "ohos_app_ability_environmentcallback.h"

OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallbackHandle EnvironmentCallback_constructImpl() {
    return {};
}
void EnvironmentCallback_destructImpl(OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallbackHandle thisPtr) {
}
void EnvironmentCallback_onConfigurationUpdatedImpl(OH_NativePointer thisPtr, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration* config) {
}
void EnvironmentCallback_onMemoryLevelImpl(OH_NativePointer thisPtr, OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_AbilityConstant_MemoryLevel level) {
}