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

OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle cryptoFramework_Key_constructImpl() {
    return {};
}
void cryptoFramework_Key_destructImpl(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle thisPtr) {
}
OH_String cryptoFramework_Key_getAlgNameImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob cryptoFramework_Key_getEncodedImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String cryptoFramework_Key_getFormatImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle cryptoFramework_PubKey_constructImpl() {
    return {};
}
void cryptoFramework_PubKey_destructImpl(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle thisPtr) {
}
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32 cryptoFramework_PubKey_getAsyKeySpecImpl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem itemType) {
    return {};
}
OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob cryptoFramework_PubKey_getEncodedDerImpl(OH_NativePointer thisPtr, const OH_String* format) {
    return {};
}
OH_String cryptoFramework_PubKey_getEncodedPemImpl(OH_NativePointer thisPtr, const OH_String* format) {
    return {};
}