/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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