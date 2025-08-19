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
#include "ohos_base.h"

OH_OHOS_BASE_BusinessErrorHandle BusinessError_construct0Impl();
OH_OHOS_BASE_BusinessErrorHandle BusinessError_construct1Impl(OH_Int32 code, const OH_CustomObject* error);
OH_OHOS_BASE_BusinessErrorHandle BusinessError_construct2Impl(OH_Int32 code, const OH_CustomObject* data, const OH_CustomObject* error);
void BusinessError_destructImpl(OH_OHOS_BASE_BusinessErrorHandle thisPtr);
OH_Int32 BusinessError_getCodeImpl(OH_NativePointer thisPtr);
Opt_CustomObject BusinessError_getDataImpl(OH_NativePointer thisPtr);
void BusinessError_setCodeImpl(OH_NativePointer thisPtr, OH_Int32 value);
void BusinessError_setDataImpl(OH_NativePointer thisPtr, const Opt_CustomObject* value);
const OH_OHOS_BASE_BusinessErrorModifier* OH_OHOS_BASE_BusinessErrorModifierImpl() {
    const static OH_OHOS_BASE_BusinessErrorModifier instance = {
        &BusinessError_construct0Impl,
        &BusinessError_construct1Impl,
        &BusinessError_construct2Impl,
        &BusinessError_destructImpl,
        &BusinessError_getCodeImpl,
        &BusinessError_setCodeImpl,
        &BusinessError_getDataImpl,
        &BusinessError_setDataImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_BASE_API* GetOHOS_BASEAPIImpl(int version) {
    const static OH_OHOS_BASE_API api = {
        1, // version
        &OH_OHOS_BASE_BusinessErrorModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_BASE_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_BASEAPIImpl(version));
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
