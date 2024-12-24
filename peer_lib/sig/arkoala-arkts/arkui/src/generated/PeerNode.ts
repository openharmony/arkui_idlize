import { int32 } from "@koalaui/common"
import { IncrementalNode } from "@koalaui/runtime"
import { NativePeerNode } from "./NativePeerNode"
import { pointer } from "@koalaui/interop"
import { ArkRootPeer } from "./peers/ArkStaticComponentsPeer"

export const PeerNodeType = 11
const InitialID = 999

export class PeerNode extends IncrementalNode {
    static generateRootPeer() {
        return ArkRootPeer.create()
    }
    peer: NativePeerNode
    protected static currentId: int32 = InitialID
    static nextId(): int32 { return ++PeerNode.currentId }
    private id: int32

    private static peerNodeMap = new Map<number, PeerNode>()

    static findPeerByNativeId(id: number): PeerNode | undefined {
        return PeerNode.peerNodeMap.get(id)
    }
    readonly name: string

    setInsertMark(mark: pointer, upDirection: boolean) {
        // TODO: implement me.
    }

    constructor(peerPtr: pointer, id: int32, name: string, flags: int32) {
        super(PeerNodeType)
        this.id = id
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
