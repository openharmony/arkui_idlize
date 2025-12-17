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
import { Language } from '../Language'
import { capitalize } from '../util'
import { getSuper, isMethodOverridden } from './getSuperType'
import { qualifiedName } from './idl/common'
import { ReferenceResolver } from './ReferenceResolver'

export function isMaterialized(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    if (!idl.isInterfaceSubkind(declaration) && !idl.isClassSubkind(declaration)) return false
    if (idl.isHandwritten(declaration)) return false
    if (generatorConfiguration().forceResource.includes(declaration.name)) {
        return false
    }

    if (generatorConfiguration().forceMaterialized.some(r => r === idl.getFQNameSafe(declaration))) {
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

    // A materialized class is a class or an interface with methods
    // excluding components and related classes
    if (declaration.methods.length > 0 || declaration.constructors.length > 0) return true

    // Or a class or an interface derived from materialized class
    const superClass = getSuper(declaration, resolver)
    if (superClass) {
        const superType = superClass
        if (!superType || !idl.isInterface(superType)) {
            console.log(`Unable to resolve ${superClass.name} type, consider ${declaration.name} to be not materialized`)
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
        const superClass = getSuper(declaration, resolver)
        if (superClass) {
            const superType = superClass
            if (!superType || !idl.isInterface(superType)) {
                console.log(`Unable to resolve ${superClass!.name} type, consider ${declaration.name} to be not materialized`)
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

export function getInternalClassName(name: string): string {
    return `${name}Internal`
}

export function getInternalClassQualifiedName(target: idl.IDLEntry, pattern: idl.QNPattern = "package.namespace.name", language?: Language): string {
    return getInternalClassName(qualifiedName(target, language ?? ".", pattern))
}

export function getMaterializedFileName(name:string): string {
    const pascalCase = name.split('_').map(x => capitalize(x)).join('')
    return `Ark${pascalCase}Materialized`
}

export function isMaterializedMethodOverridden(decl: idl.IDLInterface, methodName: string, resolver: ReferenceResolver, synthesized: boolean = false): boolean {

    // Use callHolder name instead of PeerMethodSignature.CALL_HOLDER
    // to break the circular dependencies
    if (methodName == "callHolder") {
        return getSuper(decl, resolver) != undefined
    }

    if (idl.isInterfaceSubkind(decl) && !isStaticMaterialized(decl, resolver)) return !synthesized

    return isMethodOverridden(decl, methodName, resolver)
}
