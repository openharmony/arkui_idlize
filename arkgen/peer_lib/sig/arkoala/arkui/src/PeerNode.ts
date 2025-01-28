import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "@koalaui/interop"
import { IncrementalNode } from "@koalaui/runtime"
import { ArkUINativeModule } from "@koalaui/arkoala"

export class NativePeerNode extends Finalizable {
}

const PeerNodeType = 11
const InitialID = 999

export class PeerNode extends IncrementalNode {
    peer: NativePeerNode
    static nextId(): int32 { return ++PeerNode.currentId }
    protected static currentId: int32 = InitialID
    private id: int32

    constructor(peerPtr: pointer, id: int32, name: string, flags: int32) {
        super(PeerNodeType)
        this.id = id
        this.peer = new NativePeerNode(peerPtr, getNodeFinalizer())
    }
    applyAttributes(attrs: Object) {}
}


function getNodeFinalizer() : pointer {
    return ArkUINativeModule._GetNodeFinalizer()
}
