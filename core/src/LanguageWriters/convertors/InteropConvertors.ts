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

import * as idl from '../../idl/index.js'
import { isMaterialized } from '../../peer-generation/isMaterialized.js'

import { PeerMethod } from '../../peer-generation/PeerMethod.js'
import { PrimitiveTypesInstance } from '../../peer-generation/PrimitiveType.js'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver.js'
import { maybeRestoreThrows } from '../../transformers/transformUtils.js'
import { convertType, TypeConvertor } from '../nameConvertor.js'

const KInteropReturnBuffer = 'KInteropReturnBuffer'

export class InteropArgConvertor implements TypeConvertor<string> {
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        throw new Error(`Cannot pass container types through interop`)
    }
    convertImport(type: idl.IDLImport): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return "KNativePointer"
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'i8': case 'u8':
            case 'i16': case 'u16':
            case 'i32': case 'u32': return "KInt"
            case 'i64': case 'u64': return "KLong"
            case 'f16': case 'f32': return "KFloat"
            case 'f64': return "KDouble"
            case 'number': return 'KInteropNumber'
            case 'bigint': return 'KLong'
            case 'SerializerBuffer': return 'KSerializerBuffer'
            case 'boolean':
            case 'Function': return 'KInt'
            case 'String': return 'KStringPtr'
            case 'buffer': return `KInteropBuffer`
            case 'date': return 'KLong'
            case 'undefined':
            case 'void':
            case 'pointer': return 'KPointer' // return PrimitiveTypesInstance.NativePointer.getText()
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        throw new Error("Cannot pass type parameters through interop")
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        throw new Error(`Cannot pass type references through interop`)
    }
    convertUnion(type: idl.IDLUnionType): string {
        throw new Error("Cannot pass union types through interop")
    }
}

export class InteropReturnTypeConvertor extends InteropArgConvertor {
    constructor(
        protected readonly resolver: ReferenceResolver
    ) {
        super()
    }

    isVoid(method: PeerMethod): boolean {
        return this.convert(method.returnType) === 'void'
    }
    isReturnInteropBuffer(type: idl.IDLType) {
        return this.convert(type) === KInteropReturnBuffer
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isPromise(type)) {
            // Improve return array by some way
            return "void"
        }
        return KInteropReturnBuffer
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        return this.convertTypeReference(type)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return KInteropReturnBuffer
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'boolean': return PrimitiveTypesInstance.Boolean.getText()
            case 'pointer': return PrimitiveTypesInstance.NativePointer.getText()
            case 'String': return PrimitiveTypesInstance.String.getText()
            case 'buffer': return KInteropReturnBuffer /* ArkTS can not return buffer as language object yet */
            case 'any':
            case 'this':
            case 'undefined':
            case 'unknown':
            case 'Object':
            case 'void': return 'void'
        }
        return super.convertPrimitiveType(type)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return 'void'
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
       if (type.name.endsWith("Attribute"))
            return 'void'
        const decl = this.resolver.resolveTypeReference(type)
        if (decl) {
            // Callbacks and array types return by value
            if (idl.isCallback(this.resolver.toDeclaration(type))) {
                return KInteropReturnBuffer
            }
            if (maybeRestoreThrows(decl, this.resolver)) {
                return KInteropReturnBuffer
            }
            if (idl.isInterface(decl)) {
                if (isMaterialized(decl, this.resolver)) {
                    return PrimitiveTypesInstance.NativePointer.getText()
                }
                return KInteropReturnBuffer
            }
            if (idl.isEnum(decl)) {
                return this.convertPrimitiveType(idl.enumBinaryRepresentation(decl))
            }
        }
        return "void"
    }
    convertUnion(type: idl.IDLUnionType): string {
        return KInteropReturnBuffer
    }
}
