import { checkArkoalaCallbacks } from "../../generated/arkts/CallbacksChecker";
import { xml_EventType } from "../../generated/arkts/xml";

export { ParseInfo, XmlPullParser } from "../../generated/arkts/xml"
export type EventType = xml_EventType

export function pullEvents() {
    checkArkoalaCallbacks()
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
