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
#include "ohos_mediaquery.h"

OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle mediaquery_MediaQueryListener_constructImpl();
void mediaquery_MediaQueryListener_destructImpl(OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle thisPtr);
OH_Boolean mediaquery_MediaQueryListener_getMatchesImpl(OH_NativePointer thisPtr);
OH_String mediaquery_MediaQueryListener_getMediaImpl(OH_NativePointer thisPtr);
void mediaquery_MediaQueryListener_offChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_MEDIAQUERY_mediaquery_Callback_MediaQueryResult_Void* callback_);
void mediaquery_MediaQueryListener_onChangeImpl(OH_NativePointer thisPtr, const OHOS_MEDIAQUERY_mediaquery_Callback_MediaQueryResult_Void* callback_);
const OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerModifier* OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerModifierImpl() {
    const static OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerModifier instance = {
        &mediaquery_MediaQueryListener_constructImpl,
        &mediaquery_MediaQueryListener_destructImpl,
        &mediaquery_MediaQueryListener_onChangeImpl,
        &mediaquery_MediaQueryListener_offChangeImpl,
        &mediaquery_MediaQueryListener_getMatchesImpl,
        &mediaquery_MediaQueryListener_getMediaImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_MEDIAQUERY_API* GetOHOS_MEDIAQUERYAPIImpl(int version) {
    const static OH_OHOS_MEDIAQUERY_API api = {
        1, // version
        &OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_MEDIAQUERY_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_MEDIAQUERYAPIImpl(version));
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
