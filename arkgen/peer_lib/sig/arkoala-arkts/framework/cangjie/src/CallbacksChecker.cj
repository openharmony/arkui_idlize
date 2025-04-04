package idlize

import std.collection.*
import Interop.*

class CallbackEventKind {
    public static var Event_CallCallback: CallbackEventKind = CallbackEventKind(0)
    public static var Event_HoldManagedResource: CallbackEventKind = CallbackEventKind(1)
    public static var Event_ReleaseManagedResource: CallbackEventKind = CallbackEventKind(2)
    public var value: Int32
    CallbackEventKind(arg0: Int32) {
        value = arg0
    }
}


let bufferSize: Int64 = 1024
let buffer = Array<UInt8>(bufferSize, repeat: 0)
let deserializer = Deserializer(buffer, bufferSize)

public func checkArkoalaCallbacks() {
    while (true) {
        let result = InteropNativeModule._CheckCallbackEvent(buffer, Int32(bufferSize))
        if (result == 0) {
            break
        }
        deserializer.resetCurrentPosition()
        let eventKind = deserializer.readInt32()
        if (eventKind == CallbackEventKind.Event_CallCallback.value) {
            deserializeAndCallCallback(deserializer)
        }
        else if (eventKind == CallbackEventKind.Event_HoldManagedResource.value) {
            let resourceId = deserializer.readInt32()
            ResourceHolder.instance().hold(resourceId)
        }
        else if (eventKind == CallbackEventKind.Event_ReleaseManagedResource.value) {
            let resourceId = deserializer.readInt32()
            ResourceHolder.instance().release(resourceId)
        }
        else { throw Exception("Unknown callback event kind ${eventKind}") }
    }
}
