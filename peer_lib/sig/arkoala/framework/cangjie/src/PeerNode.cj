/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

public open class PeerNode {
    private static var PEER_NODE_TYPE = 11
    public var peer: NativePeerNode
    
    static func nextId() {
        currentId += 1
        return currentId
    }

    protected static var currentId: Int32 = 1000

    PeerNode(peerPtr: pointer, name: String, flags: Int32) {
        this.peer = NativePeerNode.create(peerPtr)
    }
    func applyAttributes(attrs: HashMap<String, Object>): Unit {}
}
