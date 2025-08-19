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

#ifndef CINTEROP_OHOS_MULTIMEDIA_IMAGE_H
#define CINTEROP_OHOS_MULTIMEDIA_IMAGE_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(image_PixelMap_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(image_PixelMap_getFinalizer, KNativePointer)
KOALA_INTEROP_CTX_V3(image_PixelMap_readPixelsToBuffer0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixelsToBuffer1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixelsToBufferSync, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_readPixels0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixels1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixelsSync, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_writePixels0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writePixels1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writePixelsSync, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_writeBufferToPixels0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writeBufferToPixels1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writeBufferToPixelsSync, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_toSdr, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_getImageInfo0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_getImageInfo1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(image_PixelMap_getImageInfoSync, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_1(image_PixelMap_getBytesNumberPerRow, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_1(image_PixelMap_getPixelBytesNumber, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_1(image_PixelMap_getDensity, KInt, KNativePointer)
KOALA_INTEROP_V4(image_PixelMap_opacity0, KNativePointer, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V4(image_PixelMap_opacity1, KNativePointer, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_V2(image_PixelMap_opacitySync, KNativePointer, KDouble)
KOALA_INTEROP_CTX_V3(image_PixelMap_createAlphaPixelmap0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_createAlphaPixelmap1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(image_PixelMap_createAlphaPixelmapSync, KNativePointer, KNativePointer)
KOALA_INTEROP_V5(image_PixelMap_scale0, KNativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V5(image_PixelMap_scale1, KNativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_V3(image_PixelMap_scaleSync0, KNativePointer, KDouble, KDouble)
KOALA_INTEROP_CTX_V6(image_PixelMap_scale2, KNativePointer, KDouble, KDouble, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_V4(image_PixelMap_scaleSync1, KNativePointer, KDouble, KDouble, KInt)
KOALA_INTEROP_CTX_V5(image_PixelMap_createScaledPixelMap, KNativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_5(image_PixelMap_createScaledPixelMapSync, KNativePointer, KNativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_V5(image_PixelMap_translate0, KNativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V5(image_PixelMap_translate1, KNativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_V3(image_PixelMap_translateSync, KNativePointer, KDouble, KDouble)
KOALA_INTEROP_V4(image_PixelMap_rotate0, KNativePointer, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V4(image_PixelMap_rotate1, KNativePointer, KDouble, KSerializerBuffer, int32_t)
KOALA_INTEROP_V2(image_PixelMap_rotateSync, KNativePointer, KDouble)
KOALA_INTEROP_DIRECT_V5(image_PixelMap_flip0, KNativePointer, KInt, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V5(image_PixelMap_flip1, KNativePointer, KInt, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_flipSync, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_crop0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_crop1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_cropSync, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(image_PixelMap_getColorSpace, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(image_PixelMap_marshalling, KNativePointer, KNativePointer)
KOALA_INTEROP_CTX_V4(image_PixelMap_unmarshalling, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V2(image_PixelMap_setColorSpace, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V4(image_PixelMap_applyColorSpace0, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V4(image_PixelMap_applyColorSpace1, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V4(image_PixelMap_convertPixelFormat, KNativePointer, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(image_PixelMap_release0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(image_PixelMap_release1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_V2(image_PixelMap_setMemoryNameSync, KNativePointer, KStringPtr)
KOALA_INTEROP_DIRECT_1(image_PixelMap_getIsEditable, KBoolean, KNativePointer)
KOALA_INTEROP_DIRECT_1(image_PixelMap_getIsStrideAlignment, KBoolean, KNativePointer)
#endif // CINTEROP_OHOS_MULTIMEDIA_IMAGE_H
