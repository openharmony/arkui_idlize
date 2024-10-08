import { int32 } from "@koalaui/common"
import { IncrementalNode } from "@koalaui/runtime"
import { ArkUINodeType } from "./peers/ArkUINodeType"
import { NativePeerNode } from "./NativePeerNode"

export class PeerNode extends IncrementalNode {
    peer: NativePeerNode
    private id: int32 = PeerNode.currentId++

    private static currentId: int32 = 1000

    constructor(type: ArkUINodeType, flags: int32, name: string) {
        super()
        this.peer = NativePeerNode.create(type, this.id, flags)
    }
    applyAttributes(attrs: Object) {}
}
