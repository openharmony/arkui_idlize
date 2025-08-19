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
#include "ohos_multimedia_image.h"

void image_PixelMap_applyColorSpace0Impl(OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager targetColorSpace, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_applyColorSpace1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager targetColorSpace, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandle image_PixelMap_constructImpl();
void image_PixelMap_convertPixelFormatImpl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat targetPixelFormat, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_createAlphaPixelmap0Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_createAlphaPixelmap1Impl(OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap image_PixelMap_createAlphaPixelmapSyncImpl(OH_NativePointer thisPtr);
void image_PixelMap_createScaledPixelMapImpl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const Opt_image_AntiAliasingLevel* level, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap image_PixelMap_createScaledPixelMapSyncImpl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const Opt_image_AntiAliasingLevel* level);
void image_PixelMap_crop0Impl(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* region, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_crop1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* region, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_cropSyncImpl(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* region);
void image_PixelMap_destructImpl(OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapHandle thisPtr);
void image_PixelMap_flip0Impl(OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_flip1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_flipSyncImpl(OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical);
OH_Int32 image_PixelMap_getBytesNumberPerRowImpl(OH_NativePointer thisPtr);
OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager image_PixelMap_getColorSpaceImpl(OH_NativePointer thisPtr);
OH_Int32 image_PixelMap_getDensityImpl(OH_NativePointer thisPtr);
void image_PixelMap_getImageInfo0Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_getImageInfo1Impl(OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo image_PixelMap_getImageInfoSyncImpl(OH_NativePointer thisPtr);
OH_Boolean image_PixelMap_getIsEditableImpl(OH_NativePointer thisPtr);
OH_Boolean image_PixelMap_getIsStrideAlignmentImpl(OH_NativePointer thisPtr);
OH_Int32 image_PixelMap_getPixelBytesNumberImpl(OH_NativePointer thisPtr);
void image_PixelMap_marshallingImpl(OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence sequence_);
void image_PixelMap_opacity0Impl(OH_NativePointer thisPtr, OH_Float64 rate, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_opacity1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 rate, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_opacitySyncImpl(OH_NativePointer thisPtr, OH_Float64 rate);
void image_PixelMap_readPixels0Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_readPixels1Impl(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_readPixelsSyncImpl(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area);
void image_PixelMap_readPixelsToBuffer0Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Buffer* dst, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_readPixelsToBuffer1Impl(OH_NativePointer thisPtr, const OH_Buffer* dst, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_readPixelsToBufferSyncImpl(OH_NativePointer thisPtr, const OH_Buffer* dst);
void image_PixelMap_release0Impl(OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_release1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_rotate0Impl(OH_NativePointer thisPtr, OH_Float64 angle, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_rotate1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 angle, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_rotateSyncImpl(OH_NativePointer thisPtr, OH_Float64 angle);
void image_PixelMap_scale0Impl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_scale1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_scale2Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel level, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_scaleSync0Impl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y);
void image_PixelMap_scaleSync1Impl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel level);
void image_PixelMap_setColorSpaceImpl(OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager colorSpace);
void image_PixelMap_setMemoryNameSyncImpl(OH_NativePointer thisPtr, const OH_String* name);
void image_PixelMap_toSdrImpl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_translate0Impl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_translate1Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_translateSyncImpl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y);
void image_PixelMap_unmarshallingImpl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence sequence_, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_writeBufferToPixels0Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Buffer* src, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_writeBufferToPixels1Impl(OH_NativePointer thisPtr, const OH_Buffer* src, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_writeBufferToPixelsSyncImpl(OH_NativePointer thisPtr, const OH_Buffer* src);
void image_PixelMap_writePixels0Impl(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_OHOS_MULTIMEDIA_IMAGE_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void image_PixelMap_writePixels1Impl(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* callback_);
void image_PixelMap_writePixelsSyncImpl(OH_NativePointer thisPtr, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* area);
const OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifier* OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifierImpl() {
    const static OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifier instance = {
        &image_PixelMap_constructImpl,
        &image_PixelMap_destructImpl,
        &image_PixelMap_readPixelsToBuffer0Impl,
        &image_PixelMap_readPixelsToBuffer1Impl,
        &image_PixelMap_readPixelsToBufferSyncImpl,
        &image_PixelMap_readPixels0Impl,
        &image_PixelMap_readPixels1Impl,
        &image_PixelMap_readPixelsSyncImpl,
        &image_PixelMap_writePixels0Impl,
        &image_PixelMap_writePixels1Impl,
        &image_PixelMap_writePixelsSyncImpl,
        &image_PixelMap_writeBufferToPixels0Impl,
        &image_PixelMap_writeBufferToPixels1Impl,
        &image_PixelMap_writeBufferToPixelsSyncImpl,
        &image_PixelMap_toSdrImpl,
        &image_PixelMap_getImageInfo0Impl,
        &image_PixelMap_getImageInfo1Impl,
        &image_PixelMap_getImageInfoSyncImpl,
        &image_PixelMap_getBytesNumberPerRowImpl,
        &image_PixelMap_getPixelBytesNumberImpl,
        &image_PixelMap_getDensityImpl,
        &image_PixelMap_opacity0Impl,
        &image_PixelMap_opacity1Impl,
        &image_PixelMap_opacitySyncImpl,
        &image_PixelMap_createAlphaPixelmap0Impl,
        &image_PixelMap_createAlphaPixelmap1Impl,
        &image_PixelMap_createAlphaPixelmapSyncImpl,
        &image_PixelMap_scale0Impl,
        &image_PixelMap_scale1Impl,
        &image_PixelMap_scaleSync0Impl,
        &image_PixelMap_scale2Impl,
        &image_PixelMap_scaleSync1Impl,
        &image_PixelMap_createScaledPixelMapImpl,
        &image_PixelMap_createScaledPixelMapSyncImpl,
        &image_PixelMap_translate0Impl,
        &image_PixelMap_translate1Impl,
        &image_PixelMap_translateSyncImpl,
        &image_PixelMap_rotate0Impl,
        &image_PixelMap_rotate1Impl,
        &image_PixelMap_rotateSyncImpl,
        &image_PixelMap_flip0Impl,
        &image_PixelMap_flip1Impl,
        &image_PixelMap_flipSyncImpl,
        &image_PixelMap_crop0Impl,
        &image_PixelMap_crop1Impl,
        &image_PixelMap_cropSyncImpl,
        &image_PixelMap_getColorSpaceImpl,
        &image_PixelMap_marshallingImpl,
        &image_PixelMap_unmarshallingImpl,
        &image_PixelMap_setColorSpaceImpl,
        &image_PixelMap_applyColorSpace0Impl,
        &image_PixelMap_applyColorSpace1Impl,
        &image_PixelMap_convertPixelFormatImpl,
        &image_PixelMap_release0Impl,
        &image_PixelMap_release1Impl,
        &image_PixelMap_setMemoryNameSyncImpl,
        &image_PixelMap_getIsEditableImpl,
        &image_PixelMap_getIsStrideAlignmentImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_MULTIMEDIA_IMAGE_API* GetOHOS_MULTIMEDIA_IMAGEAPIImpl(int version) {
    const static OH_OHOS_MULTIMEDIA_IMAGE_API api = {
        1, // version
        &OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_MULTIMEDIA_IMAGE_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_MULTIMEDIA_IMAGEAPIImpl(version));
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
