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
    IDLContainerType,
    IDLImport,
    IDLOptionalType,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLType,
    IDLTypeParameterType,
    IDLUnionType,
    isEnum,
    isTypedef,
    throwException,
    TypeConvertor
} from "@idlizer/core"
import { isSequence } from "../utils/idl"
import { Typechecker } from "../general/Typechecker"

export abstract class BaseTypeConvertor<T> implements TypeConvertor<T> {
    protected constructor(
        public typechecker: Typechecker,
        private conversions: {
            sequence: (type: IDLContainerType) => T
            enum: (type: IDLReferenceType) => T
            reference: (type: IDLReferenceType) => T
            optional: (type: IDLOptionalType) => T
            i8: (type: IDLPrimitiveType) => T
            iu8: (type: IDLPrimitiveType) => T
            i16: (type: IDLPrimitiveType) => T
            i32: (type: IDLPrimitiveType) => T
            iu32: (type: IDLPrimitiveType) => T
            i64: (type: IDLPrimitiveType) => T
            iu64: (type: IDLPrimitiveType) => T
            f32: (type: IDLPrimitiveType) => T
            f64: (type: IDLPrimitiveType) => T
            boolean: (type: IDLPrimitiveType) => T
            string: (type: IDLPrimitiveType) => T
            void: (type: IDLPrimitiveType) => T
            pointer: (type: IDLPrimitiveType) => T
            undefined: (type: IDLPrimitiveType) => T
        }
    ) {}

    convertContainer(type: IDLContainerType): T {
        if (isSequence(type)) {
            return this.conversions.sequence(type)
        }
        throwException(`only sequence container type is supported`)
    }

    convertPrimitiveType(type: IDLPrimitiveType): T {
        switch (type.name) {
            case 'i8': return this.conversions.i8(type)
            case 'u8': return this.conversions.iu8(type)
            case 'i16': return this.conversions.i16(type)
            case 'i32': return this.conversions.i32(type)
            case 'u32': return this.conversions.iu32(type)
            case 'u64': return this.conversions.iu64(type)
            case 'i64': return this.conversions.i64(type)
            case 'f32': return this.conversions.f32(type)
            case 'f64': return this.conversions.f64(type)
            case 'boolean': return this.conversions.boolean(type)
            case 'String': return this.conversions.string(type)
            case 'void': return this.conversions.void(type)
            case 'pointer': return this.conversions.pointer(type)
            case 'undefined': return this.conversions.undefined(type)
        }
        throwException(`unsupported primitive type: ${JSON.stringify(type)}`)
    }

    convertTypeReferenceAsImport(type: IDLReferenceType, importClause: string): T {
        return this.convertTypeReference(type)
    }

    convertTypeReference(type: IDLReferenceType): T {
        const declaration = this.typechecker.resolveReference(type)
        if (declaration && isEnum(declaration)) {
            return this.conversions.enum(type)

        } else if (declaration && isTypedef(declaration)) {
            return this.convertType(declaration.type)
        }

        return this.conversions.reference(type)
    }

    convertOptional(type: IDLOptionalType): T {
        return this.conversions.optional(type)
    }

    convertUnion(type: IDLUnionType): T {
        throwException("union type is not supported")
    }

    convertImport(type: IDLImport): T {
        throw new Error("Import is not supported")
    }

    convertTypeParameter(type: IDLTypeParameterType): T {
        throw new Error("type parameters are not supported")
    }

    convertType(type: IDLType): T {
        return convertType(this, type)
    }
}
