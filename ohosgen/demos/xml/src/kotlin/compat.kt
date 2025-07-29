package idlize

import koalaui.interop.*

public typealias EventType = xml_EventType

public fun encodeText(text: String): NativeBuffer {
    val encodedString = text.encodeToByteArray().toUByteArray()
    val buffer = NativeBuffer((encodedString.size + 1).toLong())
    InteropNativeModule._CopyArray(buffer.data, (encodedString.size + 1).toLong(), encodedString)
    return buffer;
}

public fun eventTypeStr(eventType: EventType): String {
    return ""
}

public fun pullEvents() {
    checkArkoalaCallbacks()
}
