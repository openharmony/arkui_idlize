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

OH_OHOS_PRINT_print_PrintDocumentAdapterHandle print_PrintDocumentAdapter_constructImpl() {
    return {};
}
void print_PrintDocumentAdapter_destructImpl(OH_OHOS_PRINT_print_PrintDocumentAdapterHandle thisPtr) {
}
void print_PrintDocumentAdapter_onJobStateChangedImpl(OH_NativePointer thisPtr, const OH_String* jobId, OH_OHOS_PRINT_print_PrintDocumentAdapterState state) {
}
void print_PrintDocumentAdapter_onStartLayoutWriteImpl(OH_NativePointer thisPtr, const OH_String* jobId, const OH_OHOS_PRINT_print_PrintAttributes* oldAttrs, const OH_OHOS_PRINT_print_PrintAttributes* newAttrs, const OH_Number* fd, const OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void* writeResultCallback) {
}