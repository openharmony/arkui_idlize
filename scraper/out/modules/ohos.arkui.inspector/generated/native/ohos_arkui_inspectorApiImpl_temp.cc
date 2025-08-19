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
#include "ohos_arkui_inspector.h"

OH_OHOS_ARKUI_INSPECTOR_inspector_ComponentObserverHandle inspector_ComponentObserver_constructImpl();
void inspector_ComponentObserver_destructImpl(OH_OHOS_ARKUI_INSPECTOR_inspector_ComponentObserverHandle thisPtr);
void inspector_ComponentObserver_offDrawChildrenDrawChildrenImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_INSPECTOR_inspector_Callback_Void* callback_);
void inspector_ComponentObserver_offDrawDrawImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_INSPECTOR_inspector_Callback_Void* callback_);
void inspector_ComponentObserver_offLayoutLayoutImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_INSPECTOR_inspector_Callback_Void* callback_);
void inspector_ComponentObserver_onDrawChildrenDrawChildrenImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_INSPECTOR_inspector_Callback_Void* callback_);
void inspector_ComponentObserver_onDrawDrawImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_INSPECTOR_inspector_Callback_Void* callback_);
void inspector_ComponentObserver_onLayoutLayoutImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_INSPECTOR_inspector_Callback_Void* callback_);
const OH_OHOS_ARKUI_INSPECTOR_inspector_ComponentObserverModifier* OH_OHOS_ARKUI_INSPECTOR_inspector_ComponentObserverModifierImpl() {
    const static OH_OHOS_ARKUI_INSPECTOR_inspector_ComponentObserverModifier instance = {
        &inspector_ComponentObserver_constructImpl,
        &inspector_ComponentObserver_destructImpl,
        &inspector_ComponentObserver_onLayoutLayoutImpl,
        &inspector_ComponentObserver_offLayoutLayoutImpl,
        &inspector_ComponentObserver_onDrawDrawImpl,
        &inspector_ComponentObserver_offDrawDrawImpl,
        &inspector_ComponentObserver_onDrawChildrenDrawChildrenImpl,
        &inspector_ComponentObserver_offDrawChildrenDrawChildrenImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_ARKUI_INSPECTOR_API* GetOHOS_ARKUI_INSPECTORAPIImpl(int version) {
    const static OH_OHOS_ARKUI_INSPECTOR_API api = {
        1, // version
        &OH_OHOS_ARKUI_INSPECTOR_inspector_ComponentObserverModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_ARKUI_INSPECTOR_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_ARKUI_INSPECTORAPIImpl(version));
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
