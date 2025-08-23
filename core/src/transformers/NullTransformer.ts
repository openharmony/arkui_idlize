import * as idl from "../idl"
import { generateSyntheticUnionName } from "../peer-generation/idl/common"

export const NULL_REFERENCE = "idlize.stdlib.Null"
export function inplaceNullsAsUndefined(
    node: idl.IDLNode,
): void {
    idl.updateEachChild(node, (child) => {
        if (idl.isOptionalType(child)) {
            if (idl.isUnionType(child.type) && child.type.types.some(isNullReference)) {
                child.type.types = child.type.types.filter(it => !isNullReference(it))
                child.type.name = generateSyntheticUnionName(child.type.types)
                if (child.type.types.length === 1) {
                    child.type = child.type.types[0]
                }
                child.extendedAttributes ??= []
                child.extendedAttributes.push({ name: idl.IDLExtendedAttributes.UnionWithNull })
                return child
            }
        } else if (idl.isUnionType(child)) {
            if (child.types.some(isNullReference)) {
                child.types = child.types.filter(it => !isNullReference(it))
                child.name = generateSyntheticUnionName(child.types)
                return idl.createOptionalType(child.types.length > 1 ? child : child.types[0], { extendedAttributes: [{
                    name: idl.IDLExtendedAttributes.UnionOnlyNull
                }]})
            }
        }
        return child
    })
}

function isNullReference(node: idl.IDLNode): boolean {
    return idl.isReferenceType(node) && node.name === NULL_REFERENCE
}