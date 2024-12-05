package idlize

import std.collection.*

enum CallbackEventKind {
    |Event_CallCallback
    |Event_HoldManagedResource
    |Event_ReleaseManagedResource
    prop ordinal: Int32 {
        get() {
            match (this) {
                case Event_CallCallback => 0
                case Event_HoldManagedResource => 1
                case Event_ReleaseManagedResource => 2
            }
        }
    }
}

let bufferSize: Int32 = 1024
let buffer = ArrayList<UInt8>(Int64(bufferSize))
// let deserializer = Deserializer(buffer, bufferSize)

public func checkArkoalaCallbacks() {
    while (true) {
        let result = NativeModule._CheckArkoalaCallbackEvent(buffer, bufferSize)
        if (result == 0) {
            break
        }

        // deserializer.resetCurrentPosition()
        // let eventKind = deserializer.readInt32()
        // match (eventKind) {
        //     case CallbackEventKind.Event_CallCallback.ordinal => {
        //         // deserializeAndCallCallback(deserializer)
        //         break
        //     } 
        //     case CallbackEventKind.Event_HoldManagedResource.ordinal => {
        //         let resourceId = deserializer.readInt32()
        //         ResourceHolder.instance().hold(resourceId)
        //         break
        //     } 
        //     case CallbackEventKind.Event_ReleaseManagedResource.ordinal => {
        //         let resourceId = deserializer.readInt32()
        //         ResourceHolder.instance().release(resourceId)
        //         break
        //     }
        //     _ => throw Exception("Unknown callback event kind ${eventKind}")
        // }
    }
}
