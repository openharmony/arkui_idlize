import { BusinessError } from "@internal/component/ets"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts/peers/CallbacksChecker";
import { CONTEXTNativeModule } from "../../generated/arkts"

export { BaseContext, Context, ApplicationContext } from "../../generated/arkts"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "CONTEXT_NativeBridgeArk")
    registerNativeModuleLibraryName("CONTEXTNativeModule", "CONTEXT_NativeBridgeArk")
    new CONTEXTNativeModule()
}
