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

import * as idl from '../../../idl'
import { PrimitiveType } from '../../ArkPrimitiveType';
import { IdlTypeNameConvertor, TypeConvertor } from "../typeConvertor";

export class CppIDLTypeToStringConvertor implements IdlTypeNameConvertor, TypeConvertor<string> {
    /**** IdlTypeNameConvertor *******************************************/

    convert(type: idl.IDLType | idl.IDLCallback): string {
        if (idl.isType(type) && idl.isOptionalType(type)) {
            return this.convertOptional(type)
        }
        if (idl.isCallback(type)) {
            throw new Error("Unimplemented!")
        }
        if (idl.isPrimitiveType(type)) {
            return this.convertPrimitiveType(type)
        }
        if (idl.isContainerType(type)) {
            return this.convertContainer(type)
        }
        if (idl.isUnionType(type)) {
            return this.convertUnion(type)
        }
        if (idl.isEnumType(type)) {
            return this.convertEnum(type)
        }
        if (idl.isReferenceType(type)) {
            return this.convertTypeReference(type)
        }
        throw new Error(`Unmapped type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    /***** TypeConvertor<string> *****************************************/

    convertOptional(type: idl.IDLOptionalType): string {
        return `Opt_${this.convert(type)}`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return `Union_${type.types.map(it => this.convert(it)).join("_")}`
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Promise_${this.convert(type.elementType[0])}`
        }
        if (idl.IDLContainerUtils.isSequence(type)) {
            return `Array_${this.convert(type.elementType[0])}`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertEnum(type: idl.IDLEnumType): string {
        return idl.getIDLTypeName(type)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error("Method not implemented.")
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        const name = idl.getIDLTypeName(type)
        switch (name) {
            case 'KPointer': return 'void*'
            case 'int32':
            case 'KInt': return `${PrimitiveType.Prefix}Int32`
            case 'string':
            case 'KStringPtr': return `${PrimitiveType.Prefix}String`
            case 'number': return `${PrimitiveType.Prefix}Number`
            case 'boolean': return `${PrimitiveType.Prefix}Boolean`
            case 'Function': return `${PrimitiveType.Prefix}Function`
            case 'Length': return `${PrimitiveType.Prefix}Length`
            // TODO: oh no
            case 'Array<string[]>' : return `Array_Array_${PrimitiveType.String.getText()}`
        }
        if (name.startsWith("Array<")) {
            const typeSpec = name.match(/<(.*)>/)!
            const elementType = this.convert(idl.toIDLType(typeSpec[1]))
            return `Array_${elementType}`
        }
        if (!name.includes("std::decay<") && name.includes("<")) {
            return name.replace(/<(.*)>/, "")
        }
        return name
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        throw new Error("Method not implemented.")
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        function arkType(text:TemplateStringsArray): string {
            return `${PrimitiveType.Prefix}${text.join('')}`
        }
        switch (type) {
            case idl.IDLVoidType: return 'void'
            // mb we should map another way
            case idl.IDLI8Type: return arkType`Int8`  // char / int8_t
            case idl.IDLU8Type: return arkType`UInt8`  // unsigned char / uint8_t
            case idl.IDLI16Type: return arkType`Int16` // short / int16_t
            case idl.IDLU16Type: return arkType`UInt16` // unsigned short / uint16_t
            case idl.IDLI32Type: return arkType`Int32` // int / int32_t
            case idl.IDLU32Type: return arkType`UInt32` // unsigned int / uint32_t
            case idl.IDLI64Type: return arkType`Int64` // long long / int64_t
            case idl.IDLU64Type: return arkType`UInt64` // unsigned long long / uint64_t

            case idl.IDLNumberType: return arkType`Number`
            case idl.IDLStringType: return arkType`String`

            case idl.IDLBooleanType: return arkType`Boolean`
            case idl.IDLPointerType: return 'void*'

            case idl.IDLAnyType: return arkType`CustomObject`
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }

    /**********************************************************************/
}
