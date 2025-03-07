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
    convertType,
    IDLBooleanType,
    IDLContainerType,
    IDLF32Type,
    IDLF64Type,
    IDLI16Type,
    IDLI32Type,
    IDLI64Type,
    IDLI8Type,
    IDLOptionalType,
    IDLPointerType,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLStringType,
    IDLType,
    IDLTypeParameterType,
    IDLU32Type,
    IDLUnionType,
    IDLVoidType,
    isEnum,
    throwException,
    TypeConvertor
} from "@idlizer/core"
import { isSequence } from "../utils/idl"
import { Typechecker } from "../general/Typechecker"

export abstract class BaseTypeConvertor<T> implements TypeConvertor<T> {
    protected constructor(
        private typechecker: Typechecker,
        private conversions: {
            sequence: (type: IDLContainerType) => T
            enum: (type: IDLReferenceType) => T,
            reference: (type: IDLReferenceType) => T,
            optional: (type: IDLOptionalType) => T,
            i8: (type: IDLPrimitiveType) => T,
            i16: (type: IDLPrimitiveType) => T,
            i32: (type: IDLPrimitiveType) => T,
            iu32: (type: IDLPrimitiveType) => T,
            i64: (type: IDLPrimitiveType) => T,
            iu64: (type: IDLPrimitiveType) => T,
            f32: (type: IDLPrimitiveType) => T,
            f64: (type: IDLPrimitiveType) => T,
            boolean: (type: IDLPrimitiveType) => T,
            string: (type: IDLPrimitiveType) => T,
            void: (type: IDLPrimitiveType) => T,
            pointer: (type: IDLPrimitiveType) => T,
        }
    ) {}

    convertContainer(type: IDLContainerType): T {
        if (isSequence(type)) {
            return this.conversions.sequence(type)
        }
        throwException(`Only sequence container type is supported`)
    }

    convertPrimitiveType(type: IDLPrimitiveType): T {
        switch (type) {
            case IDLI8Type: return this.conversions.i8(type)
            case IDLI16Type: return this.conversions.i16(type)
            case IDLI32Type: return this.conversions.i32(type)
            case IDLU32Type: return this.conversions.iu32(type)
            case IDLI64Type: return this.conversions.i64(type)
            case IDLF32Type: return this.conversions.f32(type)
            case IDLF64Type: return this.conversions.f64(type)
            case IDLBooleanType: return this.conversions.boolean(type)
            case IDLStringType: return this.conversions.string(type)
            case IDLVoidType: return this.conversions.void(type)
            case IDLPointerType: return this.conversions.pointer(type)
        }
        throwException(`Unsupported primitive type: ${JSON.stringify(type)}`)
    }

    convertTypeReference(type: IDLReferenceType): T {
        if (this.typechecker.isReferenceTo(type, isEnum)) {
            return this.conversions.enum(type)
        }
        return this.conversions.reference(type)
    }

    convertOptional(type: IDLOptionalType): T {
        return this.conversions.optional(type)
    }

    convertUnion(type: IDLUnionType): T {
        throwException("Union type is not supported")
    }

    convertImport(type: IDLReferenceType, importClause: string): T {
        throw new Error("Import is not supported")
    }

    convertTypeParameter(type: IDLTypeParameterType): T {
        throw new Error("Type parameters are not supported")
    }

    convertType(type: IDLType): T {
        return convertType(this, type)
    }
}
