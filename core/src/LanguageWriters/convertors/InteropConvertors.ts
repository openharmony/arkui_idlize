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

import * as idl from '../../idl'
import { isMaterialized } from '../../peer-generation/isMaterialized'

import { PeerMethod } from '../../peer-generation/PeerMethod'
import { PrimitiveTypesInstance } from '../../peer-generation/PrimitiveType'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver'
import { convertType, IdlNameConvertor, TypeConvertor } from '../nameConvertor'

const KInteropReturnBuffer = 'KInteropReturnBuffer'
export class InteropReturnTypeConvertor implements TypeConvertor<string> {
    constructor(
        protected readonly resolver: ReferenceResolver
    ) {}

    isVoid(method: PeerMethod): boolean {
        return this.convert(method.returnType) === idl.IDLVoidType.name
    }
    isReturnInteropBuffer(type: idl.IDLType) {
        return this.convert(type) === KInteropReturnBuffer
    }
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isPromise(type)) {
            // TODO return array by some way
            return "void"
        }
        return KInteropReturnBuffer
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import type ${type.name} through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return KInteropReturnBuffer
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI8Type:
            case idl.IDLU8Type:
            case idl.IDLI16Type:
            case idl.IDLU16Type:
            case idl.IDLI32Type:
            case idl.IDLU32Type:
            case idl.IDLI64Type:
            case idl.IDLU64Type:
            case idl.IDLF16Type:
            case idl.IDLF32Type:
            case idl.IDLF64Type: return PrimitiveTypesInstance.Int32.getText()
            case idl.IDLNumberType: return PrimitiveTypesInstance.Number.getText()
            case idl.IDLBooleanType: return PrimitiveTypesInstance.Boolean.getText()
            case idl.IDLBigintType: return PrimitiveTypesInstance.Int64.getText()
            case idl.IDLAnyType:
            case idl.IDLThisType:
            case idl.IDLUndefinedType:
            case idl.IDLUnknownType:
            case idl.IDLVoidType: return idl.IDLVoidType.name
            case idl.IDLBufferType: return KInteropReturnBuffer /* ArkTS can not return buffer as language object yet */
            case idl.IDLStringType: return PrimitiveTypesInstance.String.getText()
            case idl.IDLPointerType: return PrimitiveTypesInstance.NativePointer.getText()
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return idl.IDLVoidType.name
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
       if (type.name.endsWith("Attribute"))
            return idl.IDLVoidType.name
        const decl = this.resolver.resolveTypeReference(type)
        if (decl) {
            // Callbacks and array types return by value
            if (idl.isCallback(this.resolver.toDeclaration(type))) {
                return type.name
            }
            if (idl.isInterface(decl)) {
                if (isMaterialized(decl, this.resolver)) {
                    return PrimitiveTypesInstance.NativePointer.getText()
                }
                return KInteropReturnBuffer
            }
        }
        return "void"
    }
    convertUnion(type: idl.IDLUnionType): string {
        return KInteropReturnBuffer
    }
}

export class InteropArgConvertor implements TypeConvertor<string> {
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        throw new Error(`Cannot pass container types through interop`)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return "KNativePointer"
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI64Type: return "KLong"
            case idl.IDLU64Type: return "KLong"
            case idl.IDLI32Type: return "KInt"
            case idl.IDLF32Type: return "KFloat"
            case idl.IDLNumberType: return 'KInteropNumber'
            case idl.IDLBigintType: return 'KLong'
            case idl.IDLSerializerBuffer: return 'KSerializerBuffer'
            case idl.IDLBooleanType:
            case idl.IDLFunctionType: return 'KInt'
            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLBufferType: return `KInteropBuffer`
            case idl.IDLLengthType: return 'Length'
            case idl.IDLDate: return 'KLong'
            case idl.IDLUndefinedType:
            case idl.IDLVoidType:
            case idl.IDLPointerType: return 'KPointer' // return PrimitiveTypesInstance.NativePointer.getText()
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
