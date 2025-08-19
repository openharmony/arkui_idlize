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

#ifndef CINTEROP_OHOS_MATRIX4_H
#define CINTEROP_OHOS_MATRIX4_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(matrix4_Matrix4Transit_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(matrix4_Matrix4Transit_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_1(matrix4_Matrix4Transit_copy, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_1(matrix4_Matrix4Transit_invert, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_2(matrix4_Matrix4Transit_combine, KNativePointer, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_translate, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_scale, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_skew, KNativePointer, KNativePointer, KInteropNumber, KInteropNumber)
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_rotate, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_3(matrix4_Matrix4Transit_transformPoint, KInteropReturnBuffer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_setPolyToPoly, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
#endif // CINTEROP_OHOS_MATRIX4_H
