import { checkArkoalaCallbacks } from "../../generated/ts/CallbacksChecker";
import { xml } from "../../generated/ts/xml"
export { xml } from "../../generated/ts/xml"

export type EventType = xml.EventType
export type OHBuffer = ArrayBuffer
export const EventType = xml.EventType

export function encodeText(text:string): OHBuffer {
    const enc = new TextEncoder()
    return enc.encode(text).buffer as OHBuffer
}

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
