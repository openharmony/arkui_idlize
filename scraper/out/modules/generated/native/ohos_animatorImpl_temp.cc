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

void AnimatorResult_cancelImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_ANIMATOR_AnimatorResultHandle AnimatorResult_constructImpl() {
    return {};
}
void AnimatorResult_destructImpl(OH_OHOS_ANIMATOR_AnimatorResultHandle thisPtr) {
}
void AnimatorResult_finishImpl(OH_NativePointer thisPtr) {
}
OHOS_ANIMATOR_Callback_Void AnimatorResult_getOnCancelImpl(OH_NativePointer thisPtr) {
    return {};
}
OHOS_ANIMATOR_Callback_Void AnimatorResult_getOnFinishImpl(OH_NativePointer thisPtr) {
    return {};
}
OHOS_ANIMATOR_Callback_Number_Void AnimatorResult_getOnFrameImpl(OH_NativePointer thisPtr) {
    return {};
}
OHOS_ANIMATOR_Callback_Void AnimatorResult_getOnRepeatImpl(OH_NativePointer thisPtr) {
    return {};
}
void AnimatorResult_pauseImpl(OH_NativePointer thisPtr) {
}
void AnimatorResult_playImpl(OH_NativePointer thisPtr) {
}
void AnimatorResult_resetImpl(OH_NativePointer thisPtr, const OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions* options) {
}
void AnimatorResult_reverseImpl(OH_NativePointer thisPtr) {
}
void AnimatorResult_setExpectedFrameRateRangeImpl(OH_NativePointer thisPtr, const OH_CustomObject* rateRange) {
}
void AnimatorResult_setOnCancelImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value) {
}
void AnimatorResult_setOnFinishImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value) {
}
void AnimatorResult_setOnFrameImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Number_Void* value) {
}
void AnimatorResult_setOnRepeatImpl(OH_NativePointer thisPtr, const OHOS_ANIMATOR_Callback_Void* value) {
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle SimpleAnimatorOptions_constructImpl(const OH_Number* begin, const OH_Number* end) {
    return {};
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_delayImpl(OH_NativePointer thisPtr, const OH_Number* delay) {
    return {};
}
void SimpleAnimatorOptions_destructImpl(OH_OHOS_ANIMATOR_SimpleAnimatorOptionsHandle thisPtr) {
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_directionImpl(OH_NativePointer thisPtr, const OH_CustomObject* direction) {
    return {};
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_durationImpl(OH_NativePointer thisPtr, const OH_Number* duration) {
    return {};
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_easingImpl(OH_NativePointer thisPtr, const OH_String* curve) {
    return {};
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_fillImpl(OH_NativePointer thisPtr, const OH_CustomObject* fillMode) {
    return {};
}
OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_iterationsImpl(OH_NativePointer thisPtr, const OH_Number* iterations) {
    return {};
}