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
#include "ohos_matrix4.h"

OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_combineImpl(OH_NativePointer thisPtr, OH_OHOS_MATRIX4_matrix4_Matrix4Transit options);
OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandle matrix4_Matrix4Transit_constructImpl();
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_copyImpl(OH_NativePointer thisPtr);
void matrix4_Matrix4Transit_destructImpl(OH_OHOS_MATRIX4_matrix4_Matrix4TransitHandle thisPtr);
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_invertImpl(OH_NativePointer thisPtr);
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_rotateImpl(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_RotateOption* options);
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_scaleImpl(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_ScaleOption* options);
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_setPolyToPolyImpl(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions* options);
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_skewImpl(OH_NativePointer thisPtr, const OH_Number* x, const OH_Number* y);
OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number matrix4_Matrix4Transit_transformPointImpl(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number* options);
OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_translateImpl(OH_NativePointer thisPtr, const OH_OHOS_MATRIX4_matrix4_TranslateOption* options);
const OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifier* OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifierImpl() {
    const static OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifier instance = {
        &matrix4_Matrix4Transit_constructImpl,
        &matrix4_Matrix4Transit_destructImpl,
        &matrix4_Matrix4Transit_copyImpl,
        &matrix4_Matrix4Transit_invertImpl,
        &matrix4_Matrix4Transit_combineImpl,
        &matrix4_Matrix4Transit_translateImpl,
        &matrix4_Matrix4Transit_scaleImpl,
        &matrix4_Matrix4Transit_skewImpl,
        &matrix4_Matrix4Transit_rotateImpl,
        &matrix4_Matrix4Transit_transformPointImpl,
        &matrix4_Matrix4Transit_setPolyToPolyImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_MATRIX4_API* GetOHOS_MATRIX4APIImpl(int version) {
    const static OH_OHOS_MATRIX4_API api = {
        1, // version
        &OH_OHOS_MATRIX4_matrix4_Matrix4TransitModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_MATRIX4_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_MATRIX4APIImpl(version));
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
