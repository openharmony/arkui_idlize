import { BusinessError } from "@ohos.base"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts";
import { APPLICATIONNativeModule } from "../../generated/arkts"

export { BaseContext, Context, ApplicationContext } from "../../generated/arkts"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    new APPLICATIONNativeModule()
}
