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
#include "ohos_security_cryptoframework.h"

OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle cryptoFramework_Key_constructImpl();
void cryptoFramework_Key_destructImpl(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle thisPtr);
OH_String cryptoFramework_Key_getAlgNameImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob cryptoFramework_Key_getEncodedImpl(OH_NativePointer thisPtr);
OH_String cryptoFramework_Key_getFormatImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle cryptoFramework_PubKey_constructImpl();
void cryptoFramework_PubKey_destructImpl(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle thisPtr);
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32 cryptoFramework_PubKey_getAsyKeySpecImpl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem itemType);
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob cryptoFramework_PubKey_getEncodedDerImpl(OH_NativePointer thisPtr, const OH_String* format);
OH_String cryptoFramework_PubKey_getEncodedPemImpl(OH_NativePointer thisPtr, const OH_String* format);
const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifier* OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifierImpl() {
    const static OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifier instance = {
        &cryptoFramework_Key_constructImpl,
        &cryptoFramework_Key_destructImpl,
        &cryptoFramework_Key_getEncodedImpl,
        &cryptoFramework_Key_getFormatImpl,
        &cryptoFramework_Key_getAlgNameImpl,
    };
    return &instance;
}
const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifier* OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifierImpl() {
    const static OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifier instance = {
        &cryptoFramework_PubKey_constructImpl,
        &cryptoFramework_PubKey_destructImpl,
        &cryptoFramework_PubKey_getAsyKeySpecImpl,
        &cryptoFramework_PubKey_getEncodedDerImpl,
        &cryptoFramework_PubKey_getEncodedPemImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API* GetOHOS_SECURITY_CRYPTOFRAMEWORKAPIImpl(int version) {
    const static OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API api = {
        1, // version
        &OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifierImpl,
        &OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_SECURITY_CRYPTOFRAMEWORKAPIImpl(version));
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
