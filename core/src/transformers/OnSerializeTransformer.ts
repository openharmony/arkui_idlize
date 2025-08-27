import { generatorConfiguration } from "../config"
import * as idl from "../idl"

export function inplaceTransformOnSerializeFromConfig(
    node: idl.IDLNode,
): void {
    inplaceTransformOnSerializeSelf(node)
    idl.updateEachChild(node, child => {
        inplaceTransformOnSerializeSelf(child)
        return child
    })
}

function inplaceTransformOnSerializeSelf(node: idl.IDLNode): void {
    if (!idl.isEntry(node)) {
        return
    }
    const transformation = generatorConfiguration().transformOnSerialize.find(it => it.from === idl.getFQName(node))
    if (transformation !== undefined) {
        idl.updateExtAttribute(node, idl.IDLExtendedAttributes.TransformOnSerialize, transformation.to)
    }
}