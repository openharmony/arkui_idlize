import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"

export class Finalizable {
    public ptr: pointer
    constructor(ptr: pointer) {
        this.ptr = ptr
    }
}

export class NativePeerNode extends Finalizable {
    constructor(ptr: pointer) {
        super(ptr)
    }
}

export class PeerNode extends Finalizable {
    peer: NativePeerNode
    constructor(type: number, flags: int32) {
        super(42)
        this.peer = new NativePeerNode(42)
    }
    applyAttributes(attrs: Object) {}
}