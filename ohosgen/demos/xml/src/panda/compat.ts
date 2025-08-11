import { OHOS_XMLNativeModule, registerOhosXmlApiHandler } from "../../generated/arkts"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents, registerApiEventHandler, wrapSystemApiHandlerCallback } from "@koalaui/interop";
import { xml } from "../../generated/arkts"

export { xml } from "../../generated/arkts"
export type EventType = xml.EventType
export type OHBuffer = ArrayBuffer

export function pullEvents() {
    checkEvents()
}

export function init() {
    wrapSystemApiHandlerCallback()
    registerOhosXmlApiHandler()
    new OHOS_XMLNativeModule()
}

export function encodeText(text: string): OHBuffer {
    const buffer = new ArrayBuffer((text.length * 4 + 1).toLong())
    InteropNativeModule._ManagedStringWrite(text, InteropNativeModule._GetNativeBufferPointer(buffer), buffer.byteLength.toInt(), 0);
    return buffer;
}

export function eventTypeStr(eventType: xml.EventType) {
    return eventType.getName()
}
