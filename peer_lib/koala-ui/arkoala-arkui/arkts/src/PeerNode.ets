import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { ArkUINodeType } from "./peers/ArkUINodeType"

export class NativePeerNode extends Finalizable {
    public constructor(ptr: pointer, finalizerPtr: pointer) {
        super(ptr, finalizerPtr)
    }
}

export class PeerNode {
    peer: NativePeerNode
    constructor(type: ArkUINodeType, flags: int32) {
        // TODO: rework
        this.peer = new NativePeerNode(42, 0)
    }
    applyAttributes(attrs: Object) {}
}
