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

import * as idl from '@idlize/core/idl'
import { ArkPrimitiveTypesInstance } from '../../ArkPrimitiveType'
import { PeerMethod } from '../../PeerMethod'
import { convertType, TypeConvertor } from '@idlize/core'

export class InteropReturnTypeConvertor implements TypeConvertor<string> {
    isVoid(method: PeerMethod): boolean {
        return this.convert(method.returnType) === idl.IDLVoidType.name
    }
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type) || idl.IDLContainerUtils.isPromise(type)) {
            // TODO return array by some way
            return "void"
        } else
            return ArkPrimitiveTypesInstance.NativePointer.getText()
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import type ${type.name} through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return this.convert(type.type)
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
            case idl.IDLF64Type:
            case idl.IDLNumberType: return ArkPrimitiveTypesInstance.Int32.getText()
            case idl.IDLBooleanType: return ArkPrimitiveTypesInstance.Boolean.getText()
            case idl.IDLAnyType:
            case idl.IDLBufferType:
            case idl.IDLStringType:
            case idl.IDLThisType:
            case idl.IDLUndefinedType:
            case idl.IDLUnknownType:
            case idl.IDLVoidType: return idl.IDLVoidType.name
            case idl.IDLPointerType: return ArkPrimitiveTypesInstance.NativePointer.getText()
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return idl.IDLVoidType.name
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (type.name.endsWith("Attribute"))
            return idl.IDLVoidType.name
        return ArkPrimitiveTypesInstance.NativePointer.getText()
    }
    convertUnion(type: idl.IDLUnionType): string {
        return ArkPrimitiveTypesInstance.NativePointer.getText()
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
            case idl.IDLI32Type: return "KInt"
            case idl.IDLNumberType: return 'number'
            case idl.IDLBigintType: return 'bigint'
            case idl.IDLBooleanType:
            case idl.IDLFunctionType: return 'KInt'
            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLBufferType: return `ArrayBuffer`
            case idl.IDLLengthType: return 'Length'
            case idl.IDLDate: return 'KLong'
            case idl.IDLUndefinedType:
            case idl.IDLVoidType: return ArkPrimitiveTypesInstance.NativePointer.getText()
            case idl.IDLPointerType: return "KPointer"//PrimitiveType.NativePointer.getText()
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
