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

#ifndef CINTEROP_OHOS_APP_ABILITY_STARTOPTIONS_H
#define CINTEROP_OHOS_APP_ABILITY_STARTOPTIONS_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(StartOptions_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(StartOptions_getFinalizer, KNativePointer)
KOALA_INTEROP_1(StartOptions_getWindowMode, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowMode, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getDisplayId, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setDisplayId, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getWithAnimation, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWithAnimation, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getWindowLeft, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowLeft, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getWindowTop, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowTop, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getWindowWidth, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowWidth, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getWindowHeight, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowHeight, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getWindowFocused, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowFocused, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getProcessMode, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setProcessMode, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getStartupVisibility, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setStartupVisibility, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getStartWindowIcon, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setStartWindowIcon, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getStartWindowBackgroundColor, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setStartWindowBackgroundColor, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getSupportWindowModes, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setSupportWindowModes, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getMinWindowWidth, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setMinWindowWidth, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getMinWindowHeight, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setMinWindowHeight, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getMaxWindowWidth, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setMaxWindowWidth, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(StartOptions_getMaxWindowHeight, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(StartOptions_setMaxWindowHeight, KNativePointer, KSerializerBuffer, int32_t)
#endif // CINTEROP_OHOS_APP_ABILITY_STARTOPTIONS_H
