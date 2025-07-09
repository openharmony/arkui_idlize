import * as idl from "../idl"
import { ReferenceResolver } from "../peer-generation/ReferenceResolver"

export function inplaceFQN(
    node: idl.IDLNode,
    resolver: ReferenceResolver,
): void {
    if (idl.isReferenceType(node))
        inplaceReferenceFQN(node, resolver)
    idl.forEachChild(node, (child) => {
        if (idl.isReferenceType(child))
            inplaceReferenceFQN(child, resolver)
    })
}

function inplaceReferenceFQN(
    ref: idl.IDLReferenceType,
    resolver: ReferenceResolver,
): void {
    const resolved = resolver.resolveTypeReference(ref)
    if (resolved === undefined) {
        throw new Error("Can not expand FQN for " + ref.name)
    }
    ref.name = idl.getFQName(resolved)
}