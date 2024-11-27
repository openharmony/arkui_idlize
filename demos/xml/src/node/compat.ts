import { checkArkoalaCallbacks } from "../../generated/ts/CallbacksChecker";
import { ParseInfo, XmlPullParser, xml } from "../../generated/ts/xml"

export type EventType = xml.EventType
export const EventType = xml.EventType

export { ParseInfo, XmlPullParser }

export function runEventLoop() {
    let finished = false
    let pull = () => {
        //
        checkArkoalaCallbacks()
        if (!finished)
            setTimeout(pull, 0)
    };
    setTimeout(pull, 0);
    setTimeout(() => {
        finished = true
    }, 2000);
}

export function eventTypeStr(eventType: EventType): string {
    return EventType[eventType] ?? `UNKNOWN(${eventType})`
}
