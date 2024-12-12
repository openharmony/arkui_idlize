import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { nativeModule } from "@koalaui/arkoala";
import { IncrementalNode } from "@koalaui/runtime"

export class NativePeerNode extends Finalizable {
}

const PeerNodeType = 11
const InitialID = 999

export class PeerNode extends IncrementalNode {
    peer: NativePeerNode
    static nextId(): int32 { return ++PeerNode.currentId }
    protected static currentId: int32 = InitialID

    constructor(peerPtr: pointer, name: string, flags: int32) {
        super(PeerNodeType)
        this.peer = new NativePeerNode(peerPtr, getNodeFinalizer())
    }
    applyAttributes(attrs: Object) {}
}


function getNodeFinalizer() : pointer {
    return nativeModule()._GetNodeFinalizer()
}
