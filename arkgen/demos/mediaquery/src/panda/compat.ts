import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts/peers/CallbacksChecker";
// import { MEDIAQUERYNativeModule } from "../../generated/arkts/mediaqueryNative"
// export { mediaquery } from "../../generated/arkts/mediaquery"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "MEDIAQUERY_NativeBridgeArk")
    registerNativeModuleLibraryName("MEDIAQUERYNativeModule", "MEDIAQUERY_NativeBridgeArk")
    // new MEDIAQUERYNativeModule()
}
