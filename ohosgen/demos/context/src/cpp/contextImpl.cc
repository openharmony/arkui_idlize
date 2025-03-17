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
#include "application.h"
//#include <stdio.h>

class BaseContextPeer {};
class ContextPeer {};
class ApplicationContextPeer {};

// BaseContext
OH_APPLICATION_BaseContextHandle BaseContext_constructImpl() {
    BaseContextPeer* peer = new BaseContextPeer();
    return (OH_APPLICATION_BaseContextHandle)peer;
}
void BaseContext_destructImpl(OH_APPLICATION_BaseContextHandle thiz) {
}
OH_Boolean BaseContext_getStageModeImpl(OH_NativePointer thisPtr) {
    return {};
}
void BaseContext_setStageModeImpl(OH_NativePointer thisPtr, OH_Boolean value) {
}
// Context
OH_APPLICATION_ContextHandle Context_constructImpl() {
    ContextPeer* peer = new ContextPeer();
    return (OH_APPLICATION_ContextHandle)peer;
}
void Context_destructImpl(OH_APPLICATION_ContextHandle thiz) {
}
OH_NativePointer Context_createBundleContextImpl(OH_NativePointer thisPtr, const OH_String* bundleName) {
    return {};
}
OH_NativePointer Context_createModuleContext0Impl(OH_NativePointer thisPtr, const OH_String* moduleName) {
    return {};
}
OH_NativePointer Context_createModuleContext1Impl(OH_NativePointer thisPtr, const OH_String* bundleName, const OH_String* moduleName) {
    return {};
}
OH_NativePointer Context_getApplicationContextImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_getGroupDirImpl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* dataGroupID, const APPLICATION_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_NativePointer Context_createDisplayContextImpl(OH_NativePointer thisPtr, const OH_Number* displayId) {
    return {};
}
OH_String Context_getCacheDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setCacheDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getTempDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setTempDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getFilesDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setFilesDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getDatabaseDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setDatabaseDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getPreferencesDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setPreferencesDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getBundleCodeDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setBundleCodeDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getDistributedFilesDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setDistributedFilesDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getResourceDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setResourceDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getCloudFileDirImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setCloudFileDirImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_String Context_getProcessNameImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setProcessNameImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
OH_APPLICATION_ApplicationInfo Context_getApplicationInfoImpl(OH_NativePointer thisPtr) {
    return {};
}
void Context_setApplicationInfoImpl(OH_NativePointer thisPtr, const OH_APPLICATION_ApplicationInfo* value) {
}

// ApplicationContext
OH_APPLICATION_ApplicationContextHandle ApplicationContext_constructImpl() {
    ApplicationContextPeer* peer = new ApplicationContextPeer();
    return (OH_APPLICATION_ApplicationContextHandle)peer;
}
void ApplicationContext_destructImpl(OH_APPLICATION_ApplicationContextHandle thiz) {
}
void ApplicationContext_offAbilityLifecycleImpl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Number* callbackId, const APPLICATION_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ApplicationContext_offEnvironmentImpl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Number* callbackId, const APPLICATION_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ApplicationContext_killAllProcesses0Impl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const APPLICATION_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ApplicationContext_killAllProcesses1Impl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean clearPageStack, const APPLICATION_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ApplicationContext_killAllProcesses2Impl(OH_NativePointer thisPtr, const APPLICATION_AsyncCallback_Void* callback_) {
}
void ApplicationContext_setLanguageImpl(OH_NativePointer thisPtr, const OH_String* language) {
}
void ApplicationContext_clearUpApplicationDataImpl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const APPLICATION_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ApplicationContext_setSupportedProcessCacheImpl(OH_NativePointer thisPtr, OH_Boolean isSupported) {
}
void ApplicationContext_setFontImpl(OH_NativePointer thisPtr, const OH_String* font) {
}
OH_Number ApplicationContext_getCurrentAppCloneIndexImpl(OH_NativePointer thisPtr) {
    OH_Number number;
    number.tag = InteropTag::INTEROP_TAG_INT32;
    number.i32 = 789;
    return number;
}
void ApplicationContext_setFontSizeScaleImpl(OH_NativePointer thisPtr, const OH_Number* fontSizeScale) {
}
OH_String ApplicationContext_getCurrentInstanceKeyImpl(OH_NativePointer thisPtr) {
    return {};
}
void ApplicationContext_getAllRunningInstanceKeysImpl(OH_APPLICATION_VMContext vmContext, OH_APPLICATION_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const APPLICATION_Callback_Opt_Array_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
