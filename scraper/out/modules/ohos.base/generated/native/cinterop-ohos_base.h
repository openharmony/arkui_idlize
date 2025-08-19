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

#ifndef CINTEROP_OHOS_BASE_H
#define CINTEROP_OHOS_BASE_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(BusinessError_construct0, KNativePointer)
KOALA_INTEROP_DIRECT_3(BusinessError_construct1, KNativePointer, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_3(BusinessError_construct2, KNativePointer, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_0(BusinessError_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_1(BusinessError_getCode, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_V2(BusinessError_setCode, KNativePointer, KInt)
KOALA_INTEROP_1(BusinessError_getData, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(BusinessError_setData, KNativePointer, KSerializerBuffer, int32_t)
#endif // CINTEROP_OHOS_BASE_H
