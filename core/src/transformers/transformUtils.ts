/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as idl from "../idl/index.js"
import { ReferenceResolver } from "../peer-generation/ReferenceResolver.js"

export function maybeRestoreGenerics(
    maybeTransformedGeneric: idl.IDLReferenceType | idl.IDLEntry,
    resolver: ReferenceResolver,
): idl.IDLReferenceType | undefined {
    if (idl.isReferenceType(maybeTransformedGeneric)) {
        const resolved = resolver.resolveTypeReference(maybeTransformedGeneric)
        return resolved ? maybeRestoreGenerics(resolved, resolver) : undefined
    }
    if (maybeTransformedGeneric && idl.hasExtAttribute(maybeTransformedGeneric, idl.IDLExtendedAttributes.OriginalGenericName)) {
        const originalName = idl.getExtAttribute(maybeTransformedGeneric, idl.IDLExtendedAttributes.OriginalGenericName)!
        const typeArguments = idl.getExtAttributeTypesValue(maybeTransformedGeneric, idl.IDLExtendedAttributes.OriginalGenericName)
        if (!typeArguments)
            throw new Error(`Can not restore original generic type arguments for ${originalName}: no type arguments`)
        return idl.createReferenceType(
            originalName,
            typeArguments,
        )
    }
    return undefined
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

export function maybeTransformManagedCallback(callback: idl.IDLCallback, library: ReferenceResolver): idl.IDLCallback | undefined {
    if (callback.name === "CustomBuilder")
        return library.resolveTypeReference(idl.createReferenceType("arkui.component.idlize.CustomNodeBuilder")) as idl.IDLCallback
    return undefined
}

