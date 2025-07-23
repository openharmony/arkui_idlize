enum class CallbackEventKind(var value: Int) {
    Event_CallCallback(0),
    Event_HoldManagedResource(1),
    Event_ReleaseManagedResource(2)
}

private fun createDeserializer(bufferSize: Int): DeserializerBase {
    val buffer = InteropNativeModule._Malloc(bufferSize.toLong())
    return DeserializerBase(buffer, bufferSize)
}

val bufferSize: Int = 8 * 1024
val deserializer = createDeserializer(bufferSize)

public fun checkArkoalaCallbacks() {
    while (true) {
        val result = InteropNativeModule._CheckCallbackEvent(deserializer.asBuffer(), bufferSize)
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
