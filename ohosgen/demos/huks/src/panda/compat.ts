import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents } from "@koalaui/interop";
import { OHOS_SECURITY_HUKSNativeModule, registerOhosSecurityHuksApiHandler } from "../../generated/arkts"

export { huks } from "../../generated/arkts"
export type OHBuffer = NativeBuffer

export function pullEvents(): void {
    checkEvents()
}

export function init(): void {
    registerNativeModuleLibraryName("InteropNativeModule", "HUKS_NativeBridgeArk")
    registerNativeModuleLibraryName("OHOS_SECURITY_HUKSNativeModule", "HUKS_NativeBridgeArk")
    new OHOS_SECURITY_HUKSNativeModule()
    registerOhosSecurityHuksApiHandler()
}

export function encodeText(text: string): OHBuffer {
    const buffer = new NativeBuffer((text.length * 4 + 1).toLong())
    InteropNativeModule._ManagedStringWrite(text, buffer.data, buffer.length.toInt(), 0);
    return buffer;
}
