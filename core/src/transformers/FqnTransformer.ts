import * as idl from "../idl"
import { ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { IdlTransformer } from "./IdlTransformer"

export function fqnTransformer(corpus: idl.IDLFile[], resolver: ReferenceResolver): idl.IDLFile[] {
    const transformer = new FqnTransformer(resolver)
    return corpus.map(file => transformer.visit(file)).map(idl.linkParentBack)
}

class FqnTransformer extends IdlTransformer {
    constructor(protected resolver: ReferenceResolver) {
        super()
    }

    visit<T extends idl.IDLNode>(node: T): T
    visit(node: idl.IDLNode): idl.IDLNode {
        const defaultGenericReferenceAttribute = node.extendedAttributes?.find(a => a.name === idl.IDLExtendedAttributes.TypeParametersDefaults)
        if (defaultGenericReferenceAttribute && defaultGenericReferenceAttribute.typesValue) {
            const fqVisited = defaultGenericReferenceAttribute.typesValue.map(type => {
                const tmpType = idl.clone(type)
                tmpType.parent = node
                return this.visit(tmpType)
            })
            defaultGenericReferenceAttribute.typesValue = fqVisited
            return this.visitEachChild(node)
        }
        if (idl.isReferenceType(node)) {
            const resolved = this.resolver.resolveTypeReference(node)
            if (resolved === undefined) {
                this.resolver.resolveTypeReference(node)
                throw new Error("Can not expand FQN for " + idl.DebugUtils.debugPrintType(node))
            }
            return idl.createReferenceType(
                idl.getFQName(resolved),
                node.typeArguments?.map(it => this.visit(it) as idl.IDLType),
                idl.cloneNodeInitializer(node),
            )
        }
        return this.visitEachChild(node)
    }
}
