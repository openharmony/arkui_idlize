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

import { generatorConfiguration } from '../config'
import * as idl from '../idl'
import { isBuilderClass } from './BuilderClass'
import { isExternalType } from './isExternalType'
import { ReferenceResolver } from './ReferenceResolver'

export function isMaterialized(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    if (!idl.isInterfaceSubkind(declaration) && !idl.isClassSubkind(declaration)) return false
    if (idl.isHandwritten(declaration) || isBuilderClass(declaration)) return false
    if (generatorConfiguration().forceResource.includes(declaration.name)) {
        return false
    }

    if (generatorConfiguration().forceMaterialized.includes(declaration.name)) {
        return true
    }

    // TODO: rework this
    // TODO: CustomComponent from components.custom config file
    if (["BaseSpan", "CustomComponent"].includes(declaration.name)) {
        return false
    }

    for (const ignore of ["Attribute", "Method", "Interface"]) {
        if (declaration.name.endsWith(ignore)) {
            return false
        }
    }

    if (generatorConfiguration().forceCallback.get(declaration.name)?.length === 0) {
        return false
    }

    if (generatorConfiguration().ignoreMaterialized.includes(declaration.name)) {
        return false
    }

    if (isExternalType(declaration, resolver)) {
        return false
    }

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    if (declaration.methods.length > 0 || declaration.constructors.length > 0) return true

    // Or a class or an interface derived from materialized class
    if (idl.hasSuperType(declaration)) {
        const superType = resolver.resolveTypeReference(idl.getSuperType(declaration)!)
        if (!superType || !idl.isInterface(superType)) {
            console.log(`Unable to resolve ${idl.getSuperType(declaration)!.name} type, consider ${declaration.name} to be not materialized`)
            return false
        }
        return isMaterialized(superType, resolver)
    }
    return false
}

function isSelfReturnMethod(method:idl.IDLMethod, entry:idl.IDLEntry, resolver: ReferenceResolver): boolean {
    if (!idl.isReferenceType(method.returnType)) {
        return false
    }
    const found = resolver.resolveTypeReference(method.returnType)
    if (!found) {
        return false
    }
    return idl.getFQName(found) === idl.getFQName(entry)
}

export function isStaticMaterialized(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    if (isMaterialized(declaration, resolver)) {
        if (declaration.properties.length || declaration.constructors.length) return false
        if (!declaration.methods.every(it => it.isStatic && !isSelfReturnMethod(it, declaration, resolver))) return false
        if (idl.hasSuperType(declaration)) {
            const superType = resolver.resolveTypeReference(idl.getSuperType(declaration)!)
            if (!superType || !idl.isInterface(superType)) {
                console.log(`Unable to resolve ${idl.getSuperType(declaration)!.name} type, consider ${declaration.name} to be not materialized`)
                return false
            }
            return isStaticMaterialized(superType, resolver)
        }
        return true
    }
    return false
}

export function isMaterializedType(type: idl.IDLType, resolver: ReferenceResolver): boolean {
    if (!idl.isReferenceType(type)) return false
    const decl = resolver.resolveTypeReference(type)
    if (!decl) return false
    return (idl.isInterface(decl) && isMaterialized(decl, resolver))
}
