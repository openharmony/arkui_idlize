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

function makeBuffer(len: int32, source: KPointer): OHBuffer {
    const result = new byte[64];
    OHOS_XMLNativeModule._AllocateNativeBuffer(len, source, result);
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

export function eventTypeStr(eventType: xml.EventType) {
    return eventType.getName()
}
