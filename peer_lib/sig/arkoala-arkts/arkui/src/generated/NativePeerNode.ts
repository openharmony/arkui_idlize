import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { ArkUINodeType } from "./peers/ArkUINodeType"
import { NativeModule } from "#components"

export class NativePeerNode extends Finalizable {
    constructor(ptr: pointer, finalizerPtr: pointer) {
        super(ptr, finalizerPtr)
    }

    static create(type: ArkUINodeType, id: int32, flags: int32): NativePeerNode {
        const ptr = NativeModule._CreateNode(type as int32, id, flags)
        return new NativePeerNode(ptr, NativeModule._GetNodeFinalizer())
    }

    dispose() {
        NativeModule._DisposeNode(this.ptr);
    }

    addChild(node: NativePeerNode) {
        NativeModule._AddChild(this.ptr, node.ptr);
    }
    removeChild(node: NativePeerNode) {
        NativeModule._RemoveChild(this.ptr, node.ptr);
    }
    insertChildBefore(node: NativePeerNode, sibling: NativePeerNode | undefined) {
        NativeModule._InsertChildBefore(this.ptr, node.ptr, sibling == undefined ? 0 : sibling.ptr);
    }
    insertChildAfter(node: NativePeerNode, sibling: NativePeerNode | undefined) {
        NativeModule._InsertChildAfter(this.ptr, node.ptr, sibling == undefined ? 0 : sibling.ptr);
    }
    insertChildAt(node: NativePeerNode, position: int32) {
        NativeModule._InsertChildAt(this.ptr, node.ptr, position);
    }

    dumpTree() {
        NativeModule._DumpTreeNode(this.ptr);
    }
}
