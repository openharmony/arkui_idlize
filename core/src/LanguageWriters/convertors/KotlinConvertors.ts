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
import { generateSyntheticIdlNodeName } from '../../peer-generation/idl/common'
import { isMaterialized } from '../../peer-generation/isMaterialized'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from '../nameConvertor'
import { InteropReturnTypeConvertor } from './InteropConvertors'

export class KotlinTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(protected resolver: ReferenceResolver) { }

    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): string {
        return node.name
    }
    convertInterface(node: idl.IDLInterface): string {
        return node.name
    }
    convertEnum(node: idl.IDLEnum): string {
        return node.name
    }
    convertTypedef(node: idl.IDLTypedef): string {
        return node.name
    }
    convertCallback(node: idl.IDLCallback): string {
        const params = node.parameters.map(it =>
            `${it.name}: ${this.convert(it.type!)}${it.isOptional ? "?" : ""}`)
        return `(${params.join(", ")}) -> ${this.convert(node.returnType)}`
    }
    convertMethod(node: idl.IDLMethod): string {
        return node.name
    }
    convertConstant(node: idl.IDLConstant): string {
        return node.name
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return `${this.convert(type.type)}?`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return "Union_" + type.types.map(it => generateSyntheticIdlNodeName(it)).join("_")
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
                return `ArrayList<${convertType(this, type.elementType[0])}>`
            }
            if (idl.IDLContainerUtils.isRecord(type)) {
                const stringes = type.elementType.slice(0, 2).map(it => convertType(this, it))
                return `MutableMap<${stringes[0]}, ${stringes[1]}>`
            }
            if (idl.IDLContainerUtils.isPromise(type)) {
                return `Any`
            }
            throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertImport(type: idl.IDLImport): string {
        throw new Error("Not implemented")
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error("Not implemented")
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        const decl = this.resolver.resolveTypeReference(type)
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
        }
        if (decl) {
            return decl.name
        }
        return this.convert(idl.IDLCustomObjectType)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLFunctionType: return 'Function'

            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType: return 'Any'
            case idl.IDLThisType: return 'this'
            case idl.IDLObjectType: return 'Object'
            case idl.IDLAnyType: return 'Any'
            case idl.IDLUndefinedType: return 'Nothing?'
            case idl.IDLPointerType: return 'KPointer'
            case idl.IDLSerializerBuffer: return 'KSerializerBuffer'
            case idl.IDLVoidType: return 'Unit'
            case idl.IDLBooleanType: return 'Boolean'

            
            case idl.IDLI8Type: return 'Byte'
            case idl.IDLU8Type: return 'UByte'
            case idl.IDLI16Type: return 'Short'
            case idl.IDLU16Type: return 'UShort'
            case idl.IDLI32Type: return 'Int'
            case idl.IDLU32Type: return  'UInt'
            case idl.IDLI64Type: return 'Long'
            case idl.IDLU64Type: return 'ULong'
            case idl.IDLF32Type: return 'Float'
            case idl.IDLF64Type: return 'Double'
            case idl.IDLNumberType: return 'Double'

            case idl.IDLBigintType:
                return 'BigInteger' // relies on import java.math.BigInteger

            case idl.IDLStringType:
                return 'String'

            case idl.IDLDate:
                return 'Date'

            case idl.IDLBufferType:
                return 'NativeBuffer'

            case idl.IDLInteropReturnBufferType:
                return `KInteropReturnBuffer`
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    private callbackType(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${it.name}: ${this.convert(it.type!)}`)
        return `((${params.join(", ")}) -> ${this.convert(decl.returnType)})`
    }
}

const KBoolean = "KBoolean"
const KInt = "KInt"
const KLong = "KLong"
const KFloat = "KFloat"
const KNativePointer = "KNativePointer"
const KInteropNumber = "KInteropNumber"
const KStringPtr = "KStringPtr"
const KInteropReturnBuffer = "KInteropReturnBuffer"
const KInteropBuffer = "KInteropBuffer"
const KSerializerBuffer = "KSerializerBuffer"


export class KotlinCInteropReturnTypeConvertor extends InteropReturnTypeConvertor {
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
            case idl.IDLF64Type: return KInt
            case idl.IDLNumberType: return KInteropNumber
            case idl.IDLBooleanType: return KBoolean
            case idl.IDLBigintType: return KLong
            case idl.IDLAnyType:
            case idl.IDLThisType:
            case idl.IDLUndefinedType:
            case idl.IDLUnknownType:
            case idl.IDLObjectType:
            case idl.IDLVoidType: return idl.IDLVoidType.name
            case idl.IDLBufferType: return KInteropReturnBuffer
            case idl.IDLStringType: return KStringPtr
            case idl.IDLPointerType: return KNativePointer
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (this.resolver != undefined && idl.isCallback(this.resolver.toDeclaration(type))) {
            return KNativePointer
        }
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
                    return KNativePointer
                }
                return KInteropReturnBuffer
            }
            if (idl.isEnum(decl)) {
                return KInt
            }
        }
        return idl.IDLVoidType.name
    }
}

export class KotlinCInteropArgConvertor implements TypeConvertor<string> {
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
        return KNativePointer
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI64Type: return KLong
            case idl.IDLU64Type: return KLong
            case idl.IDLI32Type: return KInt
            case idl.IDLU32Type: return KInt
            case idl.IDLF32Type: return KFloat
            case idl.IDLNumberType: return KInteropNumber
            case idl.IDLBigintType: return KLong
            case idl.IDLSerializerBuffer: return KSerializerBuffer
            case idl.IDLBooleanType:
            case idl.IDLFunctionType: return KInt
            case idl.IDLStringType: return KStringPtr
            case idl.IDLBufferType: return KInteropBuffer
            case idl.IDLDate: return KLong
            case idl.IDLUndefinedType:
            case idl.IDLVoidType:
            case idl.IDLPointerType: return KNativePointer
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
