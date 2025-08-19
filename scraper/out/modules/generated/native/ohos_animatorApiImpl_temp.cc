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
#include "ohos_animator.h"

void AnimatorResult_cancelImpl(OH_NativePointer thisPtr);
OH_OHOS_ANIMATOR_AnimatorResultHandle AnimatorResult_constructImpl();
void AnimatorResult_destructImpl(OH_OHOS_ANIMATOR_AnimatorResultHandle thisPtr);
void AnimatorResult_finishImpl(OH_NativePointer thisPtr);
OHOS_ANIMATOR_Callback_Void AnimatorResult_getOnCancelImpl(OH_NativePointer thisPtr);
OHOS_ANIMATOR_Callback_Void AnimatorResult_getOnFinishImpl(OH_NativePointer thisPtr);
OHOS_ANIMATOR_Callback_Number_Void AnimatorResult_getOnFrameImpl(OH_NativePointer thisPtr);
OHOS_ANIMATOR_Callback_Void AnimatorResult_getOnRepeatImpl(OH_NativePointer thisPtr);
void AnimatorResult_pauseImpl(OH_NativePointer thisPtr);
void AnimatorResult_playImpl(OH_NativePointer thisPtr);
void AnimatorResult_resetImpl(OH_NativePointer thisPtr, const OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions* options);
void AnimatorResult_reverseImpl(OH_NativePointer thisPtr);
void AnimatorResult_setExpectedFrameRateRangeImpl(OH_NativePointer thisPtr, const OH_CustomObject* rateRange);
void AnimatorResult_setOnCancelImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value);
void AnimatorResult_setOnFinishImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value);
void AnimatorResult_setOnFrameImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Number_Void* value);
void AnimatorResult_setOnRepeatImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value);
OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle SimpleAnimatorOptions_constructImpl(const OH_Number* begin, const OH_Number* end);
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_delayImpl(OH_NativePointer thisPtr, const OH_Number* delay);
void SimpleAnimatorOptions_destructImpl(OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle thisPtr);
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_directionImpl(OH_NativePointer thisPtr, const OH_CustomObject* direction);
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_durationImpl(OH_NativePointer thisPtr, const OH_Number* duration);
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_easingImpl(OH_NativePointer thisPtr, const OH_String* curve);
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_fillImpl(OH_NativePointer thisPtr, const OH_CustomObject* fillMode);
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_iterationsImpl(OH_NativePointer thisPtr, const OH_Number* iterations);
const OH_OHOS_ANIMATOR_AnimatorResultModifier* OH_OHOS_ANIMATOR_AnimatorResultModifierImpl() {
    const static OH_OHOS_ANIMATOR_AnimatorResultModifier instance = {
        &AnimatorResult_constructImpl,
        &AnimatorResult_destructImpl,
        &AnimatorResult_resetImpl,
        &AnimatorResult_playImpl,
        &AnimatorResult_finishImpl,
        &AnimatorResult_pauseImpl,
        &AnimatorResult_cancelImpl,
        &AnimatorResult_reverseImpl,
        &AnimatorResult_setExpectedFrameRateRangeImpl,
        &AnimatorResult_getOnFrameImpl,
        &AnimatorResult_setOnFrameImpl,
        &AnimatorResult_getOnFinishImpl,
        &AnimatorResult_setOnFinishImpl,
        &AnimatorResult_getOnCancelImpl,
        &AnimatorResult_setOnCancelImpl,
        &AnimatorResult_getOnRepeatImpl,
        &AnimatorResult_setOnRepeatImpl,
    };
    return &instance;
}
const OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifier* OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifierImpl() {
    const static OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifier instance = {
        &SimpleAnimatorOptions_constructImpl,
        &SimpleAnimatorOptions_destructImpl,
        &SimpleAnimatorOptions_durationImpl,
        &SimpleAnimatorOptions_easingImpl,
        &SimpleAnimatorOptions_delayImpl,
        &SimpleAnimatorOptions_fillImpl,
        &SimpleAnimatorOptions_directionImpl,
        &SimpleAnimatorOptions_iterationsImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_ANIMATOR_API* GetOHOS_ANIMATORAPIImpl(int version) {
    const static OH_OHOS_ANIMATOR_API api = {
        1, // version
        &OH_OHOS_ANIMATOR_AnimatorResultModifierImpl,
        &OH_OHOS_ANIMATOR_SimpleAnimatorOptionsModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_ANIMATOR_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_ANIMATORAPIImpl(version));
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
