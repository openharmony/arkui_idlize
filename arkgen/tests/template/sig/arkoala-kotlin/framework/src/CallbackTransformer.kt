/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import koalaui.arkoala.PeerNode
import koalaui.interop.KPointer

import arkui.component.builder.CustomBuilder
import arkui.component.idlize.ArkComponentRootPeer
import arkui.component.idlize.CustomNodeBuilder

typealias UIDetachedRootCreator = (
    peerFactory: () -> PeerNode,
    /** @memo */
    builder: () -> Unit
) -> PeerNode

fun createUiDetachedRootStub(
    factory: () -> PeerNode,
    /** @memo */
    builder: () -> Unit
): PeerNode {
    error("Not implemented")
}

var createUiDetachedRoot: UIDetachedRootCreator = ::createUiDetachedRootStub
fun setUIDetachedRootCreator(creator: UIDetachedRootCreator): Unit {
    createUiDetachedRoot = creator
}

fun componentRootPeerFactory(): PeerNode {
    return ArkComponentRootPeer.create()
}

class CallbackTransformer {
    companion object {
        fun transformFromCustomBuilder(value: CustomBuilder): CustomNodeBuilder {
            return { parentNode ->
                val peer = createUiDetachedRoot(::componentRootPeerFactory, value)
                peer.peer.ptr
            }
        }
        fun transformToCustomBuilder(value: CustomNodeBuilder): CustomBuilder {
            error("Not implemented")
        }
        fun transformToPeerFromCustomBuilder(value: CustomBuilder): KPointer {
            val peer = createUiDetachedRoot(::componentRootPeerFactory, value)
            return peer.peer.ptr
        }
    }
}
