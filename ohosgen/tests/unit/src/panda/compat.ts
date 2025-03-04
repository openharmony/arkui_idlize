import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts/peers/CallbacksChecker";
import { UNITNativeModule } from "../../generated/arkts"

export { and_values } from "../../generated/arkts"
export { sum_numbers } from "../../generated/arkts"
export { test_buffer } from "../../generated/arkts"
export {
    ForceCallbackListener,
    ForceCallbackClass,
    registerForceCallbackListener,
    callForceCallbackListener
} from "../../generated/arkts"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "UNIT_NativeBridgeArk")
    registerNativeModuleLibraryName("UNITNativeModule", "UNIT_NativeBridgeArk")
    new UNITNativeModule()
}
