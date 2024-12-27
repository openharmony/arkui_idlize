import { checkArkoalaCallbacks } from "../../generated/arkts/CallbacksChecker";
import { xml_EventType } from "../../generated/arkts/xml";
import { NativeBuffer } from "../../generated/arkts/SerializerBase"
import { DeserializerBase } from "../../generated/arkts/DeserializerBase"
import { XMLNativeModule } from "../../generated/arkts/xmlNative"
import { int32 } from "@koalaui/common"
import { InteropNativeModule } from "@koalaui/interop";

export { ParseInfo, XmlPullParser } from "../../generated/arkts/xml"
export type EventType = xml_EventType
export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

function makeBuffer(len: int32, init:byte[]): OHBuffer {
    const data = new byte[64];
    XMLNativeModule._AllocateNativeBuffer(len, data, init);
    const des = new DeserializerBase(data, 64);
    return des.readBuffer()
}

export function encodeText(text:string): OHBuffer {
    const tmp = new byte[(4 + text.length * 4 + 1) as int32];
    let encodedLength = InteropNativeModule._ManagedStringWrite(text, tmp, 0);
    const buffer = makeBuffer(encodedLength, tmp);
    return buffer;
}

export function eventTypeStr(eventType: xml_EventType) {
    return eventType.getName()
}
