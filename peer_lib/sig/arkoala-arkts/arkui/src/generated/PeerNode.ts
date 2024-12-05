import { int32 } from "@koalaui/common"
import { IncrementalNode } from "@koalaui/runtime"
import { ArkUINodeType } from "./peers/ArkUINodeType"
import { NativePeerNode } from "./NativePeerNode"
import { pointer } from "@koalaui/interop"

export const PeerNodeType = 11

export class PeerNode extends IncrementalNode {
    peer: NativePeerNode
    private id: int32 = PeerNode.currentId++
    static nextId(): int32 { return PeerNode.currentId + 1 }

    private static peerNodeMap = new Map<number, PeerNode>()

    static findPeerByNativeId(id: number): PeerNode | undefined {
        return PeerNode.peerNodeMap.get(id)
    }
    readonly name: string

    protected static currentId: int32 = 1000

    constructor(peerPtr: pointer, name: string, flags: int32) {
        super(PeerNodeType)
        this.peer = NativePeerNode.create(this, peerPtr, flags)
        PeerNode.peerNodeMap.set(this.id, this)
        this.onChildInserted = (child: IncrementalNode) => {
            // TODO: rework to avoid search
            let peer = findPeerNode(child)
            if (peer) {
                // Find the closest peer node backward.
                let sibling: PeerNode | undefined = undefined
                for (let node = child.previousSibling; node; node = node!.previousSibling) {
                    if (node!.isKind(PeerNodeType)) {
                        sibling = node as PeerNode
                        break
                }
            }
            this.peer.insertChildAfter(peer.peer, sibling?.peer)
            }
        }
        this.onChildRemoved = (child: IncrementalNode) => {
            let peer = findPeerNode(child)
            if (peer) {
                this.peer.removeChild(peer.peer)
            }
        }

        this.name = name
    }
    applyAttributes(attrs: Object) {}
}


function findPeerNode(node: IncrementalNode): PeerNode | undefined {
    if (node.isKind(PeerNodeType)) return node as PeerNode
    for (let child = node.firstChild; child; child = child!.nextSibling) {
        let peer = findPeerNode(child!)
        if (peer) return peer
    }
    return undefined
}
