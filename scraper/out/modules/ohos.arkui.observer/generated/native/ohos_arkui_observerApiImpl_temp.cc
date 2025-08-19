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
#include "ohos_arkui_observer.h"

OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfoHandle uiObserver_DensityInfo_constructImpl();
void uiObserver_DensityInfo_destructImpl(OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfoHandle thisPtr);
OH_OHOS_ARKUI_OBSERVER_UIContext uiObserver_DensityInfo_getContextImpl(OH_NativePointer thisPtr);
OH_Number uiObserver_DensityInfo_getDensityImpl(OH_NativePointer thisPtr);
void uiObserver_DensityInfo_setContextImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_OBSERVER_UIContext value);
void uiObserver_DensityInfo_setDensityImpl(OH_NativePointer thisPtr, const OH_Number* value);
OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfoHandle uiObserver_RouterPageInfo_constructImpl();
void uiObserver_RouterPageInfo_destructImpl(OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfoHandle thisPtr);
OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext uiObserver_RouterPageInfo_getContextImpl(OH_NativePointer thisPtr);
OH_Number uiObserver_RouterPageInfo_getIndexImpl(OH_NativePointer thisPtr);
OH_String uiObserver_RouterPageInfo_getNameImpl(OH_NativePointer thisPtr);
OH_String uiObserver_RouterPageInfo_getPageIdImpl(OH_NativePointer thisPtr);
OH_String uiObserver_RouterPageInfo_getPathImpl(OH_NativePointer thisPtr);
OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageState uiObserver_RouterPageInfo_getStateImpl(OH_NativePointer thisPtr);
void uiObserver_RouterPageInfo_setContextImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext* value);
void uiObserver_RouterPageInfo_setIndexImpl(OH_NativePointer thisPtr, const OH_Number* value);
void uiObserver_RouterPageInfo_setNameImpl(OH_NativePointer thisPtr, const OH_String* value);
void uiObserver_RouterPageInfo_setPageIdImpl(OH_NativePointer thisPtr, const OH_String* value);
void uiObserver_RouterPageInfo_setPathImpl(OH_NativePointer thisPtr, const OH_String* value);
void uiObserver_RouterPageInfo_setStateImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageState value);
const OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfoModifier* OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfoModifierImpl() {
    const static OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfoModifier instance = {
        &uiObserver_DensityInfo_constructImpl,
        &uiObserver_DensityInfo_destructImpl,
        &uiObserver_DensityInfo_getContextImpl,
        &uiObserver_DensityInfo_setContextImpl,
        &uiObserver_DensityInfo_getDensityImpl,
        &uiObserver_DensityInfo_setDensityImpl,
    };
    return &instance;
}
const OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfoModifier* OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfoModifierImpl() {
    const static OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfoModifier instance = {
        &uiObserver_RouterPageInfo_constructImpl,
        &uiObserver_RouterPageInfo_destructImpl,
        &uiObserver_RouterPageInfo_getContextImpl,
        &uiObserver_RouterPageInfo_setContextImpl,
        &uiObserver_RouterPageInfo_getIndexImpl,
        &uiObserver_RouterPageInfo_setIndexImpl,
        &uiObserver_RouterPageInfo_getNameImpl,
        &uiObserver_RouterPageInfo_setNameImpl,
        &uiObserver_RouterPageInfo_getPathImpl,
        &uiObserver_RouterPageInfo_setPathImpl,
        &uiObserver_RouterPageInfo_getStateImpl,
        &uiObserver_RouterPageInfo_setStateImpl,
        &uiObserver_RouterPageInfo_getPageIdImpl,
        &uiObserver_RouterPageInfo_setPageIdImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_ARKUI_OBSERVER_API* GetOHOS_ARKUI_OBSERVERAPIImpl(int version) {
    const static OH_OHOS_ARKUI_OBSERVER_API api = {
        1, // version
        &OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfoModifierImpl,
        &OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfoModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_ARKUI_OBSERVER_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_ARKUI_OBSERVERAPIImpl(version));
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
