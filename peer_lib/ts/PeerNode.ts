import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { nativeModule } from "./NativeModule";

export class NativePeerNode extends Finalizable {
}

export class PeerNode {
    peer: NativePeerNode
    constructor(type: number, flags: int32) {
        // TODO: type and flags
        this.peer = new NativePeerNode(BigInt(42), getNodeFinalizer())
    }
    applyAttributes(attrs: Object) {}
}


function getNodeFinalizer() : pointer {
    return nativeModule()._GetNodeFinalizer()
}
