import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks, OHOS_SECURITY_HUKSNativeModule } from "../../generated/arkts"

export { huks } from "../../generated/arkts"
export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "XML_NativeBridgeArk")
    registerNativeModuleLibraryName("OHOS_SECURITY_HUKSNativeModule", "XML_NativeBridgeArk")
    new OHOS_SECURITY_HUKSNativeModule()
}

function makeBuffer(len: int32, source: KPointer): OHBuffer {
    const result = new byte[64];
    OHOS_SECURITY_HUKSNativeModule._AllocateNativeBuffer(len, source, result);
    const deserializer = new DeserializerBase(result, 64);
    return deserializer.readBuffer()
}

export function encodeText(text: string): OHBuffer {
    const ptr = InteropNativeModule._Malloc((text.length * 4 + 1) as int32);
    let encodedLength = InteropNativeModule._ManagedStringWrite(text, ptr, 0);
    const buffer = makeBuffer(encodedLength, ptr);
    InteropNativeModule._Free(ptr);
    return buffer;
}
