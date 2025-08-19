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

#ifndef CINTEROP_OHOS_GRAPHICS_DRAWING_H
#define CINTEROP_OHOS_GRAPHICS_DRAWING_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(drawing_Brush_construct0, KNativePointer)
KOALA_INTEROP_DIRECT_1(drawing_Brush_construct1, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_0(drawing_Brush_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(drawing_Brush_setBlendMode, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_V1(drawing_Brush_reset, KNativePointer)
KOALA_INTEROP_DIRECT_1(drawing_Canvas_construct, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_0(drawing_Canvas_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(drawing_Canvas_drawRect0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_V5(drawing_Canvas_drawRect1, KNativePointer, KDouble, KDouble, KDouble, KDouble)
KOALA_INTEROP_DIRECT_V4(drawing_Canvas_drawImageRect, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V8(drawing_Canvas_drawPixelMapMesh, KNativePointer, KNativePointer, KInt, KInt, KSerializerBuffer, int32_t, KInt, KInt)
KOALA_INTEROP_DIRECT_V2(drawing_Canvas_attachBrush, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V1(drawing_Canvas_detachBrush, KNativePointer)
KOALA_INTEROP_DIRECT_3(drawing_Canvas_saveLayer, KInt, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V1(drawing_Canvas_restore, KNativePointer)
KOALA_INTEROP_V4(drawing_Canvas_rotate, KNativePointer, KDouble, KDouble, KDouble)
KOALA_INTEROP_DIRECT_0(drawing_ColorFilter_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(drawing_ColorFilter_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_3(drawing_ColorFilter_createBlendModeColorFilter, KNativePointer, KSerializerBuffer, int32_t, KInt)
KOALA_INTEROP_DIRECT_0(drawing_Lattice_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(drawing_Lattice_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_4(drawing_Lattice_createImageLattice, KNativePointer, KSerializerBuffer, int32_t, KInt, KInt)
KOALA_INTEROP_DIRECT_0(drawing_SamplingOptions_construct0, KNativePointer)
KOALA_INTEROP_DIRECT_1(drawing_SamplingOptions_construct1, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_0(drawing_SamplingOptions_getFinalizer, KNativePointer)
#endif // CINTEROP_OHOS_GRAPHICS_DRAWING_H
