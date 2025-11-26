import * as idl from "../idl"
import { ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { maybeRestoreGenerics } from "./GenericTransformer"
import { IdlTransformer } from "./IdlTransformer"

export function throwsTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    assertNoThrowsReferences(files)
    const transformer = new ThrowsTransformer()
    return files.map(it => transformer.visit(it)).map(idl.linkParentBack)
}

export function isThrows(node: idl.IDLNode, resolver: ReferenceResolver): boolean {
    if (idl.isReferenceType(node)) {
        const resolved = resolver.resolveTypeReference(node)
        return resolved ? isThrows(resolved, resolver) : false
    }
    return !!maybeRestoreThrows(node, resolver) ||
        idl.isEntry(node) && idl.getFQName(node) === idl.IDLThrowsTypeName
}

export function maybeRestoreThrows(node: idl.IDLNode, resolver: ReferenceResolver): idl.IDLType | undefined {
    if (idl.isReferenceType(node)) {
        const resolved = resolver.resolveTypeReference(node)
        return resolved ? maybeRestoreThrows(resolved, resolver) : undefined
    }
    if (idl.isEntry(node)) {
        const restored = maybeRestoreGenerics(node, resolver)
        if (restored && restored.name === idl.IDLThrowsTypeName)
            return restored.typeArguments![0]
    }
    return undefined
}

function assertNoThrowsReferences(files: idl.IDLFile[]): void {
    files.forEach(file => {
        idl.forEachChild(file, node => {
            if (idl.isReferenceType(node) && node.name === idl.IDLThrowsTypeName) {
                throw new Error(`${idl.IDLThrowsTypeName} can be referenced only in throwsTransformer. If you want to make method throwable, please add 'Throws' extended attribute to the method.`)
            }
        })
    })
}

class ThrowsTransformer extends IdlTransformer {
    visit(node: idl.IDLType): idl.IDLType
    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isMethod(node)) {
            if (!idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Throws)) {
                return this.visitEachChild(node)
            }
            if (idl.isContainerType(node.returnType) && node.returnType.containerKind === "Promise") {
                // Promises are already includes `throws` by default and do not need to have additional generation
                return this.visitEachChild(node)
            }
            return idl.createMethod(
                node.name,
                node.parameters,
                idl.createReferenceType(idl.IDLThrowsTypeName, [node.returnType]),
                {
                    isAsync: node.isAsync,
                    isFree: node.isFree,
                    isOptional: node.isOptional,
                    isStatic: node.isStatic,
                },
                idl.cloneNodeInitializer(node),
                node.typeParameters,
            )
        }
        return this.visitEachChild(node)
    }
}
