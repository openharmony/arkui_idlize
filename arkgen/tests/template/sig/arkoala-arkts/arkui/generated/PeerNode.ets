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

import { IncrementalNode } from "arkui.incremental.runtime.tree.IncrementalNode"
import { NativePeerNode } from "./NativePeerNode"
import { pointer } from "@koalaui/interop"
import { int32 } from "@koalaui/common"

export const PeerNodeType: int = 11
export const RootPeerType: int = 33
export const LazyForEachType: int = 13
const INITIAL_ID = 1000

export class PeerNode extends IncrementalNode {
    private static currentId: int = 0
    static nextId(): int {
        return PeerNode.currentId++
    }
    peer: NativePeerNode
    constructor(peerPtr: pointer, id: int32, name: string, flags: int32, derivedNodeType?: int32) {
        super((derivedNodeType ?? PeerNodeType) as int)
        this.peer = NativePeerNode.create(this, peerPtr, flags)
    }
    applyAttributes(attrs: Object): void { }
}
