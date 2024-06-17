import { PeerNode } from './PeerNode'

export class ComponentBase {
    protected peer?: PeerNode
    setPeer(peer: PeerNode) {
        this.peer = peer
    }

    /** @memo:intrinsic */
    protected checkPriority(
        name: string
    ): boolean { throw new Error("not implemented") }
    protected applyAttributesFinish(): void { throw new Error("not implemented") }
}