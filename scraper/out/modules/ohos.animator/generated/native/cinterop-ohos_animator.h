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

#ifndef CINTEROP_OHOS_ANIMATOR_H
#define CINTEROP_OHOS_ANIMATOR_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(AnimatorResult_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(AnimatorResult_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AnimatorResult_reset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V1(AnimatorResult_play, KNativePointer)
KOALA_INTEROP_DIRECT_V1(AnimatorResult_finish, KNativePointer)
KOALA_INTEROP_DIRECT_V1(AnimatorResult_pause, KNativePointer)
KOALA_INTEROP_DIRECT_V1(AnimatorResult_cancel, KNativePointer)
KOALA_INTEROP_DIRECT_V1(AnimatorResult_reverse, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setExpectedFrameRateRange, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnFrame, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnFrame, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnFinish, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnFinish, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnCancel, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnCancel, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnRepeat, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnRepeat, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_construct, KNativePointer, KInteropNumber, KInteropNumber)
KOALA_INTEROP_DIRECT_0(SimpleAnimatorOptions_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_duration, KNativePointer, KNativePointer, KInteropNumber)
KOALA_INTEROP_2(SimpleAnimatorOptions_easing, KNativePointer, KNativePointer, KStringPtr)
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_delay, KNativePointer, KNativePointer, KInteropNumber)
KOALA_INTEROP_DIRECT_3(SimpleAnimatorOptions_fill, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_3(SimpleAnimatorOptions_direction, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_iterations, KNativePointer, KNativePointer, KInteropNumber)
#endif // CINTEROP_OHOS_ANIMATOR_H
