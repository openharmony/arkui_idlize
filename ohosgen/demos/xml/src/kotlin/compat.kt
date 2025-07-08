package idlize

public typealias EventType = xml_EventType
public typealias OHBuffer = ByteArray

public fun encodeText(text: String): ByteArray {
    return text.encodeToByteArray()
}

public fun eventTypeStr(eventType: EventType): String {
    return ""
}

public fun pullEvents() {
    checkArkoalaCallbacks()
}

// public func runEventLoop() {
//     let finished = BooleanHolder()
//     spawn {
//         sleep(2000 * Duration.millisecond)
//         finished.bool = true
//     }
//     while (!finished.bool) {
//         spawn {
//             checkArkoalaCallbacks()
//         }
//     }
// }