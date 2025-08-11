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
