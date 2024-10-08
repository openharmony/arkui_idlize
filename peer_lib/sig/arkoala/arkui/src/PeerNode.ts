import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { nativeModule } from "@koalaui/arkoala";
import { IncrementalNode } from "@koalaui/runtime"

export class NativePeerNode extends Finalizable {
}

const PeerNodeType = 11

export class PeerNode extends IncrementalNode {
    peer: NativePeerNode
    // TODO: the second argument is here for signature
    // compatibility with the existring arkoala/arkui
    // To be dropped as soon as we generate common into arkoala, I suppose.
    constructor(type: number, flags: int32, name: string) {
        super(PeerNodeType)
        const id = 0 // TODO: use id
        const ptr = nativeModule()._CreateNode(type, id, flags)
        this.peer = new NativePeerNode(ptr, getNodeFinalizer())
    }
    applyAttributes(attrs: Object) {}
}


function getNodeFinalizer() : pointer {
    return nativeModule()._GetNodeFinalizer()
}
