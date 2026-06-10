package idlize

import std.collection.*
import std.time.*

class BooleanHolder {
    public var bool: Bool = false
}

public func encodeText(text: String): Array<UInt8> {
    return text.toArray()
}

public func eventTypeStr(eventType: EventType): String {
    return ""
}

public func pullEvents() {
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