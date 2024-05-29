import { Deserializer } from "./Deserializer";
import { nativeModule } from "./NativeModule";
import { deserializePeerEvent } from "./peer_events"

const BufferSize = 60 * 4;
const buffer = new Uint8Array(BufferSize)
const deserializer = new Deserializer(buffer.buffer, BufferSize)

export function checkEvents() {
    while (nativeModule()._CheckArkoalaEvents(buffer, BufferSize)) {
        deserializer.resetCurrentPosition()
        const event = deserializePeerEvent(deserializer)
        console.log(`Received event with kind ${event.kind} and nodeId ${event.nodeId}`)
    }
}