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

OH_OHOS_BASE_BusinessErrorHandle BusinessError_construct0Impl() {
    return {};
}
OH_OHOS_BASE_BusinessErrorHandle BusinessError_construct1Impl(OH_Int32 code, const OH_CustomObject* error) {
    return {};
}
OH_OHOS_BASE_BusinessErrorHandle BusinessError_construct2Impl(OH_Int32 code, const OH_CustomObject* data, const OH_CustomObject* error) {
    return {};
}
void BusinessError_destructImpl(OH_OHOS_BASE_BusinessErrorHandle thisPtr) {
}
OH_Int32 BusinessError_getCodeImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_CustomObject BusinessError_getDataImpl(OH_NativePointer thisPtr) {
    return {};
}
void BusinessError_setCodeImpl(OH_NativePointer thisPtr, OH_Int32 value) {
}
void BusinessError_setDataImpl(OH_NativePointer thisPtr, const Opt_CustomObject* value) {
}