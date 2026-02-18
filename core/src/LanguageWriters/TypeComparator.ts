/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import * as idl from '../idl/index.js'
import { ReferenceResolver } from '../peer-generation/ReferenceResolver.js'

export class KotlinTypeComparator {
    constructor(protected readonly resolver: ReferenceResolver) {}

    isCompatibleType(type1?: idl.IDLType, type2?: idl.IDLType): boolean {
        if (!type1 || !type2)
            return false
        else if (idl.isPrimitiveType(type1) && idl.isPrimitiveType(type2))
            return type1.name === type2.name
        else if (idl.isContainerType(type1) && idl.isContainerType(type2))
            return type1.containerKind === type2.containerKind &&
                type1.elementType.length === type2.elementType.length &&
                type1.elementType.every((it, index) => this.isCompatibleType(it, type2.elementType[index]))
        else if (idl.isOptionalType(type1) && idl.isOptionalType(type2))
            return this.isCompatibleType(type1.type, type2.type)
        else if (idl.isUnionType(type1) && idl.isUnionType(type2))
            return type1.name === type2.name
        else if (idl.isTypeParameterType(type1) && idl.isTypeParameterType(type2))
            return true
        else if (idl.isReferenceType(type1) && idl.isReferenceType(type2)) {
            if (type1.name === type2.name)
                return true
            const decl1 = this.resolver.resolveTypeReference(type1)
            const decl2 = this.resolver.resolveTypeReference(type2)
            if (decl1 && decl2 && idl.isCallback(decl1) && idl.isCallback(decl2))
                return this.isCompatibleCallback(decl1, decl2)
        }
        return idl.isReferenceType(type2) && this.isCompatibleType(type1, this.tryUnwrapTypedef(type2)) ||
                idl.isReferenceType(type1) && this.isCompatibleType(this.tryUnwrapTypedef(type1), type2)
    }

    isCompatibleCallback(base: idl.IDLCallback, commit: idl.IDLCallback): boolean {
        return this.isCompatibleType(base.returnType, commit.returnType) &&
            base.parameters.length === commit.parameters.length &&
            base.parameters.every((p, i) => this.isCompatibleType(p.type, commit.parameters[i].type))
    }

    protected tryUnwrapTypedef(typeRef: idl.IDLReferenceType): idl.IDLType | undefined {
        const resolved = this.resolver.resolveTypeReference(typeRef)
        if (resolved && idl.isTypedef(resolved)) {
            return resolved.type
        }
        return undefined
    }
}
