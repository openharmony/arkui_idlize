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
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver'
import { zip } from '../../util'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from '../nameConvertor'

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
        return type.name
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
                return `Array<${convertType(this, type.elementType[0])}>`
            }
            if (idl.IDLContainerUtils.isRecord(type)) {
                const stringes = type.elementType.slice(0, 2).map(it => convertType(this, it))
                return `Map<${stringes[0]}, ${stringes[1]}>`
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