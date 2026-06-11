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

import { pointer, Finalizable } from "@koalaui/interop"
import { ArkUINativeModule } from "#components"
import { PeerNode } from "./PeerNode"
import { int32 } from "@koalaui/common"

export class NativePeerNode extends Finalizable {
    constructor(peer: PeerNode, ptr: pointer) {
        super(ptr, ArkUINativeModule._GetNodeFinalizer())
    }

    static create(peer: PeerNode, peerPtr: pointer, flags: int32): NativePeerNode {
        return new NativePeerNode(peer, peerPtr)
    }

    addChild(node: pointer): void {
        ArkUINativeModule._AddChild(this.ptr, node)
    }
    removeChild(node: pointer): void {
        ArkUINativeModule._RemoveChild(this.ptr, node)
    }
    insertChildBefore(node: pointer, sibling: pointer): void {
        ArkUINativeModule._InsertChildBefore(this.ptr, node, sibling)
    }
    insertChildAfter(node: pointer, sibling: pointer): void {
        ArkUINativeModule._InsertChildAfter(this.ptr, node, sibling)
    }
    insertChildAt(node: pointer, position: int32): void {
        ArkUINativeModule._InsertChildAt(this.ptr, node, position)
    }
    dumpTree(): void {
        ArkUINativeModule._DumpTreeNode(this.ptr)
    }
}
