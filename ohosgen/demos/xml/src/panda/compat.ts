import { OHOS_XMLNativeModule, checkArkoalaCallbacks } from "../../generated/arkts"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { xml } from "../../generated/arkts"

export { xml } from "../../generated/arkts"
export type EventType = xml.EventType
export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    new OHOS_XMLNativeModule()
}

export function encodeText(text: string): OHBuffer {
    const buffer = new NativeBuffer((text.length * 4 + 1).toLong())
    InteropNativeModule._ManagedStringWrite(text, buffer.data, 0);
    return buffer;
}

export function eventTypeStr(eventType: xml.EventType) {
    return eventType.getName()
}
