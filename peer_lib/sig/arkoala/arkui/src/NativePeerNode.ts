import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { PeerNode } from "./PeerNode"
import { ArkUINodeType } from "./peers/ArkUINodeType"
import { nativeModule } from "@koalaui/arkoala";

export class NativePeerNode extends Finalizable {
    constructor(ptr: pointer, finalizerPtr: pointer) {
        super(ptr, finalizerPtr)
    }

    static create(peer: PeerNode, peerPtr: pointer, flags: int32): NativePeerNode {
        return new NativePeerNode(peerPtr, nativeModule()._GetNodeFinalizer())
    }

    dispose() {
        nativeModule()._DisposeNode(this.ptr);
    }

    addChild(node: NativePeerNode) {
        nativeModule()._AddChild(this.ptr, node.ptr);
    }
    removeChild(node: NativePeerNode) {
        nativeModule()._RemoveChild(this.ptr, node.ptr);
    }
    insertChildBefore(node: NativePeerNode, sibling: NativePeerNode | undefined) {
        nativeModule()._InsertChildBefore(this.ptr, node.ptr, sibling == undefined ? 0 : sibling.ptr);
    }
    insertChildAfter(node: NativePeerNode, sibling: NativePeerNode | undefined) {
        nativeModule()._InsertChildAfter(this.ptr, node.ptr, sibling == undefined ? 0 : sibling.ptr);
    }
    insertChildAt(node: NativePeerNode, position: int32) {
        nativeModule()._InsertChildAt(this.ptr, node.ptr, position);
    }

    dumpTree() {
        nativeModule()._DumpTreeNode(this.ptr);
    }
}
