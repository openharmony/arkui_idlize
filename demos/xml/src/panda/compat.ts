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
    if (eventType.ordinal == (xml_EventType.START_DOCUMENT.ordinal))
        return "START_DOCUMENT"
    if (eventType.ordinal == (xml_EventType.END_DOCUMENT.ordinal))
        return "END_DOCUMENT"
    if (eventType.ordinal == (xml_EventType.START_TAG.ordinal))
        return "START_TAG"
    if (eventType.ordinal == (xml_EventType.END_TAG.ordinal))
        return "END_TAG"
    if (eventType.ordinal == (xml_EventType.TEXT.ordinal))
        return "TEXT"
    if (eventType.ordinal == (xml_EventType.CDSECT.ordinal))
        return "CDSECT"
    if (eventType.ordinal == (xml_EventType.COMMENT.ordinal))
        return "COMMENT"
    if (eventType.ordinal == (xml_EventType.DOCDECL.ordinal))
        return "DOCDECL"
    if (eventType.ordinal == (xml_EventType.INSTRUCTION.ordinal))
        return "INSTRUCTION"
    if (eventType.ordinal == (xml_EventType.ENTITY_REFERENCE.ordinal))
        return "ENTITY_REFERENCE"
    if (eventType.ordinal == (xml_EventType.WHITESPACE.ordinal))
        return "WHITESPACE"
    return `UNKNOWN(${eventType.ordinal})`
}
