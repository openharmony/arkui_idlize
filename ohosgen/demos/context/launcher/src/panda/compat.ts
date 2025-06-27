import { BusinessError } from "@ohos.base"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks, APPLICATIONNativeModule } from "@application.application.INTERNAL";

export { Context } from "@application.Context"
export { BaseContext } from "@application.BaseContext"
export { ApplicationContext } from "@application.ApplicationContext"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    new APPLICATIONNativeModule()
}
