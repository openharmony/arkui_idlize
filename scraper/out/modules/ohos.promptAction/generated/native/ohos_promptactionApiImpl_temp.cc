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
#include "ohos_promptaction.h"

OH_OHOS_PROMPTACTION_LevelOrder LevelOrder_clampImpl(const OH_Number* order);
OH_OHOS_PROMPTACTION_LevelOrderHandle LevelOrder_constructImpl();
void LevelOrder_destructImpl(OH_OHOS_PROMPTACTION_LevelOrderHandle thisPtr);
OH_Number LevelOrder_getOrderImpl(OH_NativePointer thisPtr);
void promptAction_CommonController_closeImpl(OH_NativePointer thisPtr);
OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandle promptAction_CommonController_constructImpl();
void promptAction_CommonController_destructImpl(OH_OHOS_PROMPTACTION_promptAction_CommonControllerHandle thisPtr);
OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandle promptAction_DialogController_constructImpl();
void promptAction_DialogController_destructImpl(OH_OHOS_PROMPTACTION_promptAction_DialogControllerHandle thisPtr);
const OH_OHOS_PROMPTACTION_LevelOrderModifier* OH_OHOS_PROMPTACTION_LevelOrderModifierImpl() {
    const static OH_OHOS_PROMPTACTION_LevelOrderModifier instance = {
        &LevelOrder_constructImpl,
        &LevelOrder_destructImpl,
        &LevelOrder_clampImpl,
        &LevelOrder_getOrderImpl,
    };
    return &instance;
}
const OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifier* OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifierImpl() {
    const static OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifier instance = {
        &promptAction_CommonController_constructImpl,
        &promptAction_CommonController_destructImpl,
        &promptAction_CommonController_closeImpl,
    };
    return &instance;
}
const OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifier* OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifierImpl() {
    const static OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifier instance = {
        &promptAction_DialogController_constructImpl,
        &promptAction_DialogController_destructImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_PROMPTACTION_API* GetOHOS_PROMPTACTIONAPIImpl(int version) {
    const static OH_OHOS_PROMPTACTION_API api = {
        1, // version
        &OH_OHOS_PROMPTACTION_LevelOrderModifierImpl,
        &OH_OHOS_PROMPTACTION_promptAction_CommonControllerModifierImpl,
        &OH_OHOS_PROMPTACTION_promptAction_DialogControllerModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_PROMPTACTION_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_PROMPTACTIONAPIImpl(version));
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
