import { generatorConfiguration } from "../config"
import * as idl from "../idl"

export function inplaceTransformOnSerialize(
    node: idl.IDLNode,
    destinationGetter: (node: idl.IDLNode) => string | undefined
): void {
    inplaceTransformOnSerializeSelf(node, destinationGetter)
    idl.updateEachChild(node, child => {
        inplaceTransformOnSerializeSelf(child, destinationGetter)
        return child
    })
}

function inplaceTransformOnSerializeSelf(
    node: idl.IDLNode,
    destinationGetter: (node: idl.IDLNode) => string | undefined): void {
    if (!(idl.isInterface(node) || idl.isEnum(node) || idl.isTypedef(node) || idl.isCallback(node))) {
        return
    }
    const destination = destinationGetter(node)
    if (destination !== undefined) {
        idl.updateExtAttribute(node, idl.IDLExtendedAttributes.TransformOnSerialize, destination)
    }
}