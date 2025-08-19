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
#include "ohos_app_ability_atomicserviceoptions.h"

OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptionsHandle AtomicServiceOptions_constructImpl();
void AtomicServiceOptions_destructImpl(OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptionsHandle thisPtr);
Opt_Int32 AtomicServiceOptions_getFlagsImpl(OH_NativePointer thisPtr);
Opt_Map_String_Object AtomicServiceOptions_getParametersImpl(OH_NativePointer thisPtr);
void AtomicServiceOptions_setFlagsImpl(OH_NativePointer thisPtr, const Opt_Int32* value);
void AtomicServiceOptions_setParametersImpl(OH_NativePointer thisPtr, const Opt_Map_String_Object* value);
const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptionsModifier* OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptionsModifierImpl() {
    const static OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptionsModifier instance = {
        &AtomicServiceOptions_constructImpl,
        &AtomicServiceOptions_destructImpl,
        &AtomicServiceOptions_getFlagsImpl,
        &AtomicServiceOptions_setFlagsImpl,
        &AtomicServiceOptions_getParametersImpl,
        &AtomicServiceOptions_setParametersImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API* GetOHOS_APP_ABILITY_ATOMICSERVICEOPTIONSAPIImpl(int version) {
    const static OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API api = {
        1, // version
        &OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptionsModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_APP_ABILITY_ATOMICSERVICEOPTIONSAPIImpl(version));
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
