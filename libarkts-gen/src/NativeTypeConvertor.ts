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

// import { TypeConvertor } from "../../src/peer-generation/LanguageWriters/nameConvertor"
import {
    IDLBooleanType,
    IDLContainerType,
    IDLContainerUtils,
    IDLEntry,
    IDLI32Type,
    IDLOptionalType,
    IDLPrimitiveType,
    IDLPointerType,
    IDLReferenceType,
    IDLStringType,
    IDLTypeParameterType,
    IDLUnionType,
    IDLVoidType,
    isEnum,
    throwException
} from "@idlize/core"

export class NativeTypeConvertor /*implements TypeConvertor<string>*/ {
    constructor(private idl: IDLEntry[]) {}

    private usagesWithoutDeclaration = new Set<string>()

    convertOptional(type: IDLOptionalType): string {
        throw new Error("Method not implemented.")
    }

    convertUnion(type: IDLUnionType): string {
        throw new Error("Method not implemented.")
    }

    convertContainer(type: IDLContainerType): string {
        if (IDLContainerUtils.isSequence(type)) return `KNativePointerArray`
        throwException(`Unexpected container`)
    }

    convertImport(type: IDLReferenceType, importClause: string): string {
        throw new Error("Method not implemented.")
    }

    convertTypeReference(type: IDLReferenceType): string {
        const declaration = this.idl.filter(it => type.name === it.name)[0]
        if (declaration === undefined) this.complain(type.name)
        if (declaration !== undefined && isEnum(declaration)) {
            return `KInt`
        }
        return `KNativePointer`
    }

    convertTypeParameter(type: IDLTypeParameterType): string {
        throw new Error("Method not implemented.")
    }

    convertPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLI32Type: return `KInt`
            case IDLBooleanType: return `KBoolean`
            case IDLStringType: return `KStringPtr&`
            case IDLVoidType: return `KNativePointer`
            case IDLPointerType: return `KNativePointer`
        }
        throwException(`Unsupported primitive type: ${JSON.stringify(type)}`)
    }

    private complain(name: string): void {
        if (this.usagesWithoutDeclaration.has(name)) return
        this.usagesWithoutDeclaration.add(name)
        console.warn(`Warning: type reference with no declaration: ${name}`)
    }
}