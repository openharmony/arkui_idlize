import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"


export class NativePeerNode extends Finalizable {
    public constructor(ptr: pointer) {
        super(ptr)
    }
}

export class PeerNode extends Finalizable {
    peer: NativePeerNode
    constructor(type: number, flags: int32) {
        // TODO: rework
        super(42)
        this.peer = new NativePeerNode(42)
    }
    applyAttributes(attrs: Object) {}
}
