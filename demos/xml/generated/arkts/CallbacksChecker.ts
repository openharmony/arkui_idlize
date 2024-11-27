import { ResourceHolder, KBuffer } from "@koalaui/interop"
import { Deserializer, deserializeAndCallCallback } from "./xmlSerializer"
import { XMLNativeModule } from "./xmlNative"

enum CallbackEventKind {
    Event_CallCallback = 0,
    Event_HoldManagedResource = 1,
    Event_ReleaseManagedResource = 2,
}

const bufferSize = 1024
const buffer = new KBuffer(bufferSize)
const deserializer = new Deserializer(buffer.buffer, bufferSize)
export function checkArkoalaCallbacks() {
    while (true) {
        deserializer.resetCurrentPosition()
        let result = XMLNativeModule._CheckArkoalaCallbackEvent(buffer.buffer, bufferSize)
        if (result == 0) break

        const eventKind = deserializer.readInt32() as CallbackEventKind
        switch (eventKind) {
            case CallbackEventKind.Event_CallCallback: {
                deserializeAndCallCallback(deserializer)
                break;
            } 
            case CallbackEventKind.Event_HoldManagedResource: {
                const resourceId = deserializer.readInt32()
                ResourceHolder.instance().hold(resourceId)
                break;
            } 
            case CallbackEventKind.Event_ReleaseManagedResource: {
                const resourceId = deserializer.readInt32()
                ResourceHolder.instance().release(resourceId)
                break;
            }
            default: throw new Error(`Unknown callback event kind ${eventKind}`)
        }
    }
}
