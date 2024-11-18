import { float32, int32, pointer, Finalizable } from "./types"
import { ResourceHolder } from "./ResourceManager"
import { Deserializer, deserializeAndCallCallback } from "%SERIALIZER_PATH%"
import { %NATIVE_MODULE_ACCESSOR% } from "%NATIVE_MODULE_PATH%"

enum CallbackEventKind {
    Event_CallCallback = 0,
    Event_HoldManagedResource = 1,
    Event_ReleaseManagedResource = 2,
}

const bufferSize = 1024
const buffer = new Uint8Array(bufferSize)
const deserializer = new Deserializer(buffer.buffer, bufferSize)
export function checkArkoalaCallbacks() {
    while (true) {
        let result = %NATIVE_MODULE_ACCESSOR%()._CheckArkoalaCallbackEvent(buffer, bufferSize)
        if (result == 0) break

        deserializer.resetCurrentPosition()
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
