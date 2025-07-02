import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks, OHOS_SECURITY_HUKSNativeModule } from "../../generated/arkts"

export { huks } from "../../generated/arkts"
export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "HUKS_NativeBridgeArk")
    registerNativeModuleLibraryName("OHOS_SECURITY_HUKSNativeModule", "HUKS_NativeBridgeArk")
    new OHOS_SECURITY_HUKSNativeModule()
}

export function encodeText(text: string): OHBuffer {
    const buffer = new NativeBuffer((text.length * 4 + 1).toLong())
    InteropNativeModule._ManagedStringWrite(text, buffer.data, 0);
    return buffer;
}
