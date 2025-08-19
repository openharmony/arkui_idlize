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

#ifndef CINTEROP_OHOS_APP_ABILITY_ABILITY_H
#define CINTEROP_OHOS_APP_ABILITY_ABILITY_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(Ability_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(Ability_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(Ability_onConfigurationUpdate, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V2(Ability_onMemoryLevel, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_0(AbilityLifecycleCallback_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(AbilityLifecycleCallback_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(AbilityLifecycleCallback_onAbilityCreate, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AbilityLifecycleCallback_onWindowStageCreate, KNativePointer, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(AbilityLifecycleCallback_onWindowStageDestroy, KNativePointer, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(AbilityLifecycleCallback_onAbilityDestroy, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(AbilityLifecycleCallback_onAbilityForeground, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(AbilityLifecycleCallback_onAbilityBackground, KNativePointer, KNativePointer)
#endif // CINTEROP_OHOS_APP_ABILITY_ABILITY_H
