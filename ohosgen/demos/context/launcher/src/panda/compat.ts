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
import { BusinessError } from "@ohos.base"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop";
import { APPLICATIONNativeModule, registerApplicationApiHandler } from "@application.application.INTERNAL";
import { registerBundleManagerApiHandler } from "@bundleManager.bundleManager.INTERNAL"

export { Context } from "@application.Context"
export { BaseContext } from "@application.BaseContext"
export { ApplicationContext } from "@application.ApplicationContext"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkEvents()
}

export function init() {
    wrapSystemApiHandlerCallback()
    registerApplicationApiHandler()
    registerBundleManagerApiHandler()
    new APPLICATIONNativeModule()
}
