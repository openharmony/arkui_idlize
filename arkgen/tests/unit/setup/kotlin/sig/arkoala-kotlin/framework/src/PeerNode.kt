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
package koalaui.arkoala

import kotlin.collections.ArrayList
import kotlin.collections.HashMap
import koalaui.interop.pointer

import arkui.component.ArkRootPeer

// add inheritance from NativePeerNode
public open class PeerNode(peerPtr: pointer, val id: Int, val name: String, flags: Int) {
    public val peer: NativePeerNode

    init {
        peer = NativePeerNode.create(peerPtr)
        peerNodeRawTail.add(this)
    }

    companion object {
        protected var currentId: Int = 1000
        private val PEER_NODE_TYPE: UInt = 11u

        fun nextId(): Int {
            currentId += 1
            return currentId
        }

        fun generateRootPeer(): PeerNode {
            return ArkRootPeer.create(null)
        }

        private val peerNodeMap = HashMap<Int, PeerNode>()
        private val peerNodeRawTail = ArrayList<PeerNode>()

        private fun updatePeerNodeMap() {
            if (peerNodeRawTail.isEmpty()) {
                return
            }
            peerNodeRawTail.forEach({ peer ->
                peerNodeMap.set(peer.id, peer)
            })
            peerNodeRawTail.clear()
        }

        fun findPeerByNativeId(id: Int): PeerNode? {
            updatePeerNodeMap()
            return peerNodeMap.get(id)
        }
    }

    fun getPeerPtr(): pointer {
        return peer.ptr
    }

    fun applyAttributes(attrs: HashMap<String, Any>) {}
}