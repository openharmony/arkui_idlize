import { int32 } from "@koalaui/common"
import { Finalizable } from "./Finalizable"

export class NativePeerNode extends Finalizable {
}

export class PeerNode extends Finalizable {
    peer: NativePeerNode
    constructor(type: number, flags: int32) {
        // TODO: rework
        super(BigInt(42), 0)
        this.peer = new NativePeerNode(BigInt(42), 0)
    }
    applyAttributes(attrs: Object) {}
}
