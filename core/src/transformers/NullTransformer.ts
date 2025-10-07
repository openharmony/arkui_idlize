import * as idl from "../idl"
import { generateSyntheticUnionName } from "../peer-generation/idl/common"
import { IdlTransformer } from "./IdlTransformer"

export function nullsTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const transformer = new NullsTransformer()
    return files.map(it => transformer.visit(it)).map(idl.linkParentBack)
}

class NullsTransformer extends IdlTransformer {
    visit(node: idl.IDLType): idl.IDLType
    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isOptionalType(node)) {
            if (idl.isUnionType(node.type) && node.type.types.some(isNullReference)) {
                const unionTypes = node.type.types.filter(it => !isNullReference(it)).map(it => this.visit(it))
                const unionName = generateSyntheticUnionName(unionTypes)
                const extendedAttributes = (node.extendedAttributes ?? [])
                    .concat({ name: idl.IDLExtendedAttributes.UnionWithNull })
                return idl.createOptionalType(
                    unionTypes.length === 1
                        ? unionTypes[0]
                        : idl.createUnionType(unionTypes, unionName, idl.cloneNodeInitializer(node.type)),
                    {
                        documentation: node.documentation,
                        extendedAttributes,
                        fileName: node.fileName,
                    }
                )
            }
        } else if (idl.isUnionType(node)) {
            if (node.types.some(isNullReference)) {
                const unionTypes = node.types.filter(it => !isNullReference(it)).map(it => this.visit(it))
                const unionName = generateSyntheticUnionName(unionTypes)
                return idl.createOptionalType(
                    unionTypes.length === 1 ? unionTypes[0] : idl.createUnionType(
                        unionTypes,
                        unionName,
                        idl.cloneNodeInitializer(node),
                    ),
                    { extendedAttributes: [{ name: idl.IDLExtendedAttributes.UnionOnlyNull }] },
                )
            }
        }
        return this.visitEachChild(node)
    }
}

function isNullReference(node: idl.IDLNode): boolean {
    return idl.isReferenceType(node) && node.name === idl.IDLNullTypeName
}