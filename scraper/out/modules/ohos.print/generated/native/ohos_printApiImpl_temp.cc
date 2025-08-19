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
#include "ohos_print.h"

OH_OHOS_PRINT_print_PrintDocumentAdapterHandle print_PrintDocumentAdapter_constructImpl();
void print_PrintDocumentAdapter_destructImpl(OH_OHOS_PRINT_print_PrintDocumentAdapterHandle thisPtr);
void print_PrintDocumentAdapter_onJobStateChangedImpl(OH_NativePointer thisPtr, const OH_String* jobId, OH_OHOS_PRINT_print_PrintDocumentAdapterState state);
void print_PrintDocumentAdapter_onStartLayoutWriteImpl(OH_NativePointer thisPtr, const OH_String* jobId, const OH_OHOS_PRINT_print_PrintAttributes* oldAttrs, const OH_OHOS_PRINT_print_PrintAttributes* newAttrs, const OH_Number* fd, const OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void* writeResultCallback);
const OH_OHOS_PRINT_print_PrintDocumentAdapterModifier* OH_OHOS_PRINT_print_PrintDocumentAdapterModifierImpl() {
    const static OH_OHOS_PRINT_print_PrintDocumentAdapterModifier instance = {
        &print_PrintDocumentAdapter_constructImpl,
        &print_PrintDocumentAdapter_destructImpl,
        &print_PrintDocumentAdapter_onStartLayoutWriteImpl,
        &print_PrintDocumentAdapter_onJobStateChangedImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_PRINT_API* GetOHOS_PRINTAPIImpl(int version) {
    const static OH_OHOS_PRINT_API api = {
        1, // version
        &OH_OHOS_PRINT_print_PrintDocumentAdapterModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_PRINT_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_PRINTAPIImpl(version));
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
