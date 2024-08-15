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
package peers

from std import collection.*

public open class PeerNode {
    public var peer: NativePeerNode
    
    private var id: Int32 = currentId++

    private static var currentId: Int32 = 1000

    public PeerNode(nodeType: ArkUINodeType, component: ?ComponentBase, flags: Int32) {
        this.peer = NativePeerNode.create(nodeType, this.id, flags)
    }
    func applyAttributes(attrs: HashMap<String, Object>): Unit {}
}
