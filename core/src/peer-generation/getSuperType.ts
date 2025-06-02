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

import * as idl from '../idl'
import { ReferenceResolver } from './ReferenceResolver'

function getSuperCandidates(declaration:idl.IDLInterface, resolver: ReferenceResolver): [idl.IDLInterface, idl.IDLReferenceType][] {
    return declaration.inheritance
        .map(it => [resolver.resolveTypeReference(it), it] as const)
        .filter(([it,]) => it && idl.isInterface(it) && idl.isClassSubkind(it))
        .map(it => it as [idl.IDLInterface, idl.IDLReferenceType])
}

function getSuperTuple(declaration:idl.IDLInterface, resolver: ReferenceResolver): [idl.IDLInterface, idl.IDLReferenceType] | undefined {
    if (idl.isClassSubkind(declaration)) {
        const found = declaration.inheritance.find(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Extends))
        if (found) {
            const resolved = resolver.resolveTypeReference(found)
            if (resolved && idl.isInterface(resolved)) {
                return [resolved, found]
            }
        }
        const candidates = getSuperCandidates(declaration, resolver)
        if (candidates.length > 0) {
            return candidates[0]
        }
        return undefined
    }
    const fst = declaration.inheritance[0]
    if (!fst) {
        return undefined
    }
    const resolved = resolver.resolveTypeReference(fst)
    if (!resolved || !idl.isInterface(resolved)) {
        return undefined
    }
    return [resolved, fst]
}

export function getSuper(declaration:idl.IDLInterface, resolver: ReferenceResolver): idl.IDLInterface | undefined {
    return getSuperTuple(declaration, resolver)?.[0]
}

export function getSuperType(declaration:idl.IDLInterface, resolver: ReferenceResolver): idl.IDLReferenceType | undefined {
    return getSuperTuple(declaration, resolver)?.[1]
}