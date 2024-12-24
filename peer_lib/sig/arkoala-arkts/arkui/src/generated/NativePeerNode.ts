import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { ArkUINativeModule } from "#components"
import { PeerNode } from "./PeerNode"

export class NativePeerNode extends Finalizable {
    constructor(peer: PeerNode, ptr: pointer) {
        super(ptr, ArkUINativeModule._GetNodeFinalizer())
    }

    static create(peer: PeerNode, peerPtr: pointer, flags: int32): NativePeerNode {
        return new NativePeerNode(peer, peerPtr)
    }

    dispose() {
        ArkUINativeModule._DisposeNode(this.ptr);
    }

    addChild(node: NativePeerNode) {
        ArkUINativeModule._AddChild(this.ptr, node.ptr);
    }
    removeChild(node: NativePeerNode) {
        ArkUINativeModule._RemoveChild(this.ptr, node.ptr);
    }
    insertChildBefore(node: NativePeerNode, sibling: NativePeerNode | undefined) {
        ArkUINativeModule._InsertChildBefore(this.ptr, node.ptr, sibling == undefined ? 0 : sibling.ptr);
    }
    insertChildAfter(node: NativePeerNode, sibling: NativePeerNode | undefined) {
        ArkUINativeModule._InsertChildAfter(this.ptr, node.ptr, sibling == undefined ? 0 : sibling.ptr);
    }
    insertChildAt(node: NativePeerNode, position: int32) {
        ArkUINativeModule._InsertChildAt(this.ptr, node.ptr, position);
    }

    dumpTree() {
        ArkUINativeModule._DumpTreeNode(this.ptr);
    }
}
