import { int32 } from "@koalaui/common"
import { pointer } from "@koalaui/interop"
import { Finalizable } from "./Finalizable"
import { ArkUINodeType } from "./peers/ArkUINodeType"
import { NativeModule } from "./NativeModule"

export class NativePeerNode extends Finalizable {
    public constructor(ptr: pointer, finalizerPtr: pointer) {
        super(ptr, finalizerPtr)
    }
}

export class PeerNode {
    peer: NativePeerNode
    constructor(type: ArkUINodeType, component: Object|undefined, flags: int32) {
        const id = 0 // TODO: use id
        const ptr = NativeModule._CreateNode(type as int32, id, flags)
        this.peer = new NativePeerNode(ptr, NativeModule._GetNodeFinalizer())
    }
    applyAttributes(attrs: Object) {}
}
