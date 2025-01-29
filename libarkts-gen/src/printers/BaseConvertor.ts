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
    IDLType,
    IDLTypeParameterType,
    IDLUnionType,
    isEnum,
    isInterface,
    isReferenceType,
    TypeConvertor
} from "@idlizer/core"

export abstract class BaseConvertor implements TypeConvertor<string> {
    protected constructor(private idl: IDLEntry[]) {}

    private static incorrectDeclarations = new Set<string>()

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
        if (BaseConvertor.incorrectDeclarations.has(name)) {
            return undefined
        }
        BaseConvertor.incorrectDeclarations.add(name)
        console.warn(`Expected reference type "${name}" to have exactly one declaration, got: ${declarations.length}`)
        return undefined
    }

    isHeir(node: IDLReferenceType, ancestor: string): boolean {
        const declaration = this.findRealDeclaration(node.name)
        if (declaration === undefined || !isInterface(declaration)) {
            return false
        }
        const parent = declaration.inheritance[0]
        if (parent === undefined) {
            return declaration.name === ancestor
        }
        return this.isHeir(parent, ancestor)
    }

    isEnumReference(type: IDLType): type is IDLReferenceType {
        if (!isReferenceType(type)) {
            return false
        }
        const declaration = this.findRealDeclaration(type.name)
        return declaration !== undefined && isEnum(declaration)
    }
}
