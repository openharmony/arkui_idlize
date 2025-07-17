enum class CallbackEventKind(var value: Int) {
    Event_CallCallback(0),
    Event_HoldManagedResource(1),
    Event_ReleaseManagedResource(2)
}

val bufferSize: Int = 1024
val buffer = UByteArray(bufferSize) { 0u }
val deserializer = DeserializerBase(buffer)

public fun checkArkoalaCallbacks() {
    while (true) {
        // val result = InteropNativeModule._CheckCallbackEvent(deserializer.asBuffer(), bufferSize)
        val result = 0
        if (result == 0) {
            break
        }
        deserializer.resetCurrentPosition()
        val eventKind = deserializer.readInt32()
        if (eventKind == CallbackEventKind.Event_CallCallback.value) {
            deserializeAndCallCallback(deserializer)
        }
        else if (eventKind == CallbackEventKind.Event_HoldManagedResource.value) {
            val resourceId = deserializer.readInt32()
            ResourceHolder.hold(resourceId)
        }
        else if (eventKind == CallbackEventKind.Event_ReleaseManagedResource.value) {
            val resourceId = deserializer.readInt32()
            ResourceHolder.release(resourceId)
        }
        else { throw Exception("Unknown callback event kind ${eventKind}") }
    }
}
