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
#include "ohos_resourcemanager.h"

OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandle resourceManager_Configuration_constructImpl() {
    return {};
}
void resourceManager_Configuration_destructImpl(OH_OHOS_RESOURCEMANAGER_resourceManager_ConfigurationHandle thisPtr) {
}
OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode resourceManager_Configuration_getColorModeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType resourceManager_Configuration_getDeviceTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_resourceManager_Direction resourceManager_Configuration_getDirectionImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String resourceManager_Configuration_getLocaleImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Int32 resourceManager_Configuration_getMccImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Int32 resourceManager_Configuration_getMncImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity resourceManager_Configuration_getScreenDensityImpl(OH_NativePointer thisPtr) {
    return {};
}
void resourceManager_Configuration_setColorModeImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode value) {
}
void resourceManager_Configuration_setDeviceTypeImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType value) {
}
void resourceManager_Configuration_setDirectionImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_Direction value) {
}
void resourceManager_Configuration_setLocaleImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
void resourceManager_Configuration_setMccImpl(OH_NativePointer thisPtr, OH_Int32 value) {
}
void resourceManager_Configuration_setMncImpl(OH_NativePointer thisPtr, OH_Int32 value) {
}
void resourceManager_Configuration_setScreenDensityImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity value) {
}
OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandle resourceManager_DeviceCapability_constructImpl() {
    return {};
}
void resourceManager_DeviceCapability_destructImpl(OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapabilityHandle thisPtr) {
}
OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType resourceManager_DeviceCapability_getDeviceTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity resourceManager_DeviceCapability_getScreenDensityImpl(OH_NativePointer thisPtr) {
    return {};
}
void resourceManager_DeviceCapability_setDeviceTypeImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType value) {
}
void resourceManager_DeviceCapability_setScreenDensityImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity value) {
}
void resourceManager_ResourceManager_addResourceImpl(OH_NativePointer thisPtr, const OH_String* path) {
}
void resourceManager_ResourceManager_closeRawFd0Impl(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_closeRawFd1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_closeRawFdSyncImpl(OH_NativePointer thisPtr, const OH_String* path) {
}
OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandle resourceManager_ResourceManager_constructImpl() {
    return {};
}
void resourceManager_ResourceManager_destructImpl(OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManagerHandle thisPtr) {
}
OH_Boolean resourceManager_ResourceManager_getBooleanByNameImpl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
OH_Boolean resourceManager_ResourceManager_getBooleanImpl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
void resourceManager_ResourceManager_getColor0Impl(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getColor1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_getColorByName0Impl(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getColorByName1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_Int64 resourceManager_ResourceManager_getColorByNameSyncImpl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
OH_Int64 resourceManager_ResourceManager_getColorSyncImpl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
void resourceManager_ResourceManager_getConfiguration0Impl(OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getConfiguration1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration resourceManager_ResourceManager_getConfigurationSyncImpl(OH_NativePointer thisPtr) {
    return {};
}
void resourceManager_ResourceManager_getDeviceCapability0Impl(OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getDeviceCapability1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability resourceManager_ResourceManager_getDeviceCapabilitySyncImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Float64 resourceManager_ResourceManager_getDoubleByNameImpl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
OH_Float64 resourceManager_ResourceManager_getDoubleImpl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
OH_String resourceManager_ResourceManager_getDoublePluralStringByNameSyncImpl(OH_NativePointer thisPtr, const OH_String* resName, OH_Float64 num, const Array_Union_String_F64* args) {
    return {};
}
OH_String resourceManager_ResourceManager_getDoublePluralStringValueSyncImpl(OH_NativePointer thisPtr, OH_Int64 resId, OH_Float64 num, const Array_Union_String_F64* args) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_DrawableDescriptor resourceManager_ResourceManager_getDrawableDescriptorByNameImpl(OH_NativePointer thisPtr, const OH_String* resName, const Opt_Int32* density, const Opt_Int32* type) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_DrawableDescriptor resourceManager_ResourceManager_getDrawableDescriptorImpl(OH_NativePointer thisPtr, OH_Int64 resId, const Opt_Int32* density, const Opt_Int32* type) {
    return {};
}
OH_Int32 resourceManager_ResourceManager_getIntByNameImpl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
OH_Int32 resourceManager_ResourceManager_getIntImpl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
OH_String resourceManager_ResourceManager_getIntPluralStringByNameSyncImpl(OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 num, const Array_Union_String_F64* args) {
    return {};
}
OH_String resourceManager_ResourceManager_getIntPluralStringValueSyncImpl(OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 num, const Array_Union_String_F64* args) {
    return {};
}
Array_String resourceManager_ResourceManager_getLocalesImpl(OH_NativePointer thisPtr, const Opt_Boolean* includeSystem) {
    return {};
}
void resourceManager_ResourceManager_getMediaBase64ByName0Impl(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaBase64ByName1Impl(OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaBase64ByName2Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_getMediaBase64ByName3Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_String resourceManager_ResourceManager_getMediaBase64ByNameSyncImpl(OH_NativePointer thisPtr, const OH_String* resName, const Opt_Int32* density) {
    return {};
}
void resourceManager_ResourceManager_getMediaByName0Impl(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaByName1Impl(OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaByName2Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_getMediaByName3Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_Buffer resourceManager_ResourceManager_getMediaByNameSyncImpl(OH_NativePointer thisPtr, const OH_String* resName, const Opt_Int32* density) {
    return {};
}
void resourceManager_ResourceManager_getMediaContent0Impl(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaContent1Impl(OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaContent2Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_getMediaContent3Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_getMediaContentBase640Impl(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaContentBase641Impl(OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getMediaContentBase642Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void resourceManager_ResourceManager_getMediaContentBase643Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, OH_Int32 density, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_String resourceManager_ResourceManager_getMediaContentBase64SyncImpl(OH_NativePointer thisPtr, OH_Int64 resId, const Opt_Int32* density) {
    return {};
}
OH_Buffer resourceManager_ResourceManager_getMediaContentSyncImpl(OH_NativePointer thisPtr, OH_Int64 resId, const Opt_Int32* density) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration resourceManager_ResourceManager_getOverrideConfigurationImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager resourceManager_ResourceManager_getOverrideResourceManagerImpl(OH_NativePointer thisPtr, const Opt_resourceManager_Configuration* configuration) {
    return {};
}
void resourceManager_ResourceManager_getRawFd0Impl(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getRawFd1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_CustomObject resourceManager_ResourceManager_getRawFdSyncImpl(OH_NativePointer thisPtr, const OH_String* path) {
    return {};
}
void resourceManager_ResourceManager_getRawFileContent0Impl(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getRawFileContent1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_Buffer resourceManager_ResourceManager_getRawFileContentSyncImpl(OH_NativePointer thisPtr, const OH_String* path) {
    return {};
}
void resourceManager_ResourceManager_getRawFileList0Impl(OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getRawFileList1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
Array_String resourceManager_ResourceManager_getRawFileListSyncImpl(OH_NativePointer thisPtr, const OH_String* path) {
    return {};
}
void resourceManager_ResourceManager_getStringArrayByName0Impl(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getStringArrayByName1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
Array_String resourceManager_ResourceManager_getStringArrayByNameSyncImpl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
void resourceManager_ResourceManager_getStringArrayValue0Impl(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getStringArrayValue1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
Array_String resourceManager_ResourceManager_getStringArrayValueSyncImpl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
void resourceManager_ResourceManager_getStringByName0Impl(OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getStringByName1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* resName, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_String resourceManager_ResourceManager_getStringByNameSync0Impl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
OH_String resourceManager_ResourceManager_getStringByNameSync1Impl(OH_NativePointer thisPtr, const OH_String* resName, const Array_Union_String_F64* args) {
    return {};
}
OH_String resourceManager_ResourceManager_getStringSync0Impl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
OH_String resourceManager_ResourceManager_getStringSync1Impl(OH_NativePointer thisPtr, OH_Int64 resId, const Array_Union_String_F64* args) {
    return {};
}
void resourceManager_ResourceManager_getStringValue0Impl(OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_AsyncCallback* callback_) {
}
void resourceManager_ResourceManager_getStringValue1Impl(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_OHOS_RESOURCEMANAGER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int64 resId, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_Int64 resourceManager_ResourceManager_getSymbolByNameImpl(OH_NativePointer thisPtr, const OH_String* resName) {
    return {};
}
OH_Int64 resourceManager_ResourceManager_getSymbolImpl(OH_NativePointer thisPtr, OH_Int64 resId) {
    return {};
}
OH_Boolean resourceManager_ResourceManager_isRawDirImpl(OH_NativePointer thisPtr, const OH_String* path) {
    return {};
}
void resourceManager_ResourceManager_removeResourceImpl(OH_NativePointer thisPtr, const OH_String* path) {
}
void resourceManager_ResourceManager_updateOverrideConfigurationImpl(OH_NativePointer thisPtr, OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration configuration) {
}