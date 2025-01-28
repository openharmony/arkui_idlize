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

import {
    IDLContainerType,
    IDLEntry,
    IDLOptionalType,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLTypeParameterType,
    IDLUnionType,
    TypeConvertor
} from "@idlizer/core"

export abstract class BaseConvertor implements TypeConvertor<string> {
    protected constructor(private idl: IDLEntry[]) {}

    private incorrectDeclarations = new Set<string>()

    abstract convertTypeReference(type: IDLReferenceType): string

    abstract convertPrimitiveType(type: IDLPrimitiveType): string

    abstract convertContainer(type: IDLContainerType): string

    convertOptional(type: IDLOptionalType): string {
        throw new Error("Method not implemented.")
    }

    convertUnion(type: IDLUnionType): string {
        throw new Error("Method not implemented.")
    }

    convertImport(type: IDLReferenceType, importClause: string): string {
        throw new Error("Method not implemented.")
    }

    convertTypeParameter(type: IDLTypeParameterType): string {
        throw new Error("Method not implemented.")
    }

    protected findRealDeclaration(name: string): IDLEntry | undefined {
        const declarations = this.idl.filter(it => name === it.name)
        if (declarations.length === 1) {
            return declarations[0]
        }
        if (this.incorrectDeclarations.has(name)) {
            return undefined
        }
        this.incorrectDeclarations.add(name)
        console.warn(`Expected reference type "${name}" to have exactly one declaration, got: ${declarations.length}`)
        return undefined
    }
}
