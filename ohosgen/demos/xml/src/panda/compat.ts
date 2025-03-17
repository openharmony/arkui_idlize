import { OHOS_XMLNativeModule, checkArkoalaCallbacks } from "../../generated/arkts"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { xml } from "../../generated/arkts"

export { xml } from "../../generated/arkts"
export type EventType = xml.EventType
export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "XML_NativeBridgeArk")
    registerNativeModuleLibraryName("OHOS_XMLNativeModule", "XML_NativeBridgeArk")
    new OHOS_XMLNativeModule()
}

function makeBuffer(len: int32, init:byte[]): OHBuffer {
    const data = new byte[64];
    OHOS_XMLNativeModule._AllocateNativeBuffer(len, data, init);
    const des = new DeserializerBase(data, 64);
    return des.readBuffer()
}

export function encodeText(text:string): OHBuffer {
    const tmp = new byte[(4 + text.length * 4 + 1) as int32];
    let encodedLength = InteropNativeModule._ManagedStringWrite(text, tmp, 0);
    const buffer = makeBuffer(encodedLength, tmp);
    return buffer;
}

export function eventTypeStr(eventType: xml.EventType) {
    return eventType.getName()
}
