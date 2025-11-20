import { IncrementalNode } from "arkui.stateManagement.tree.IncrementalNode"

export function NodeAttach<Node extends IncrementalNode>(
    create: () => Node,
    update: (node: Node) => void,
): void {
    throw new Error("Not implemented. Stub for generator tests")
}