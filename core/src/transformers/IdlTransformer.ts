
import * as idl from "../idl"

export abstract class IdlTransformer {
    abstract visit(node: idl.IDLNode): idl.IDLNode

    visitEachChild(node: idl.IDLNode): idl.IDLNode {
        return idl.visitChildren(node, this.visit.bind(this))
    }
}