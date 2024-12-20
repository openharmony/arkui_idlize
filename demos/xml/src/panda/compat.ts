import { checkArkoalaCallbacks } from "../../generated/arkts/CallbacksChecker";
import { xml_EventType } from "../../generated/arkts/xml";

export { ParseInfo, XmlPullParser } from "../../generated/arkts/xml"
export type EventType = xml_EventType

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function eventTypeStr(eventType: xml_EventType) {
    return eventType.getName()
}
