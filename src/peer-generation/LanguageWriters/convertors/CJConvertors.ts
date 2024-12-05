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
import { throwException } from '../../../util'
import { ARK_CUSTOM_OBJECT, cjCustomTypeMapping, convertCJOptional } from '../../printers/lang/Cangjie'
import { ReferenceResolver } from '../../ReferenceResolver'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor } from "../nameConvertor"

export class CJIDLNodeToStringConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(
        protected resolver: ReferenceResolver
    ) { }

    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    /***** TypeConvertor<string> **********************************/
    convertOptional(type: idl.IDLOptionalType): string {
        return `Option<${this.convert(type.type)}>`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return type.name
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            return `ArrayList<${convertType(this, type.elementType[0])}>`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const stringes = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return `Map<${stringes[0]}, ${stringes[1]}>`
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertInterface(node: idl.IDLInterface): string {
        throw new Error('Method not implemented.')
    }
    convertEnum(node: idl.IDLEnum): string {
        return node.name
    }
    convertTypedef(node: idl.IDLTypedef): string {
        throw new Error('Method not implemented.')
    }
    convertCallback(type: idl.IDLCallback): string {
        return `\{ => ${this.convert(type)}\}`
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        return type.name
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }
        // resolve synthetic types
        const decl = this.resolver.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }
        let typeSpec = type.name
        if (cjCustomTypeMapping.has(typeSpec)) {
            typeSpec = cjCustomTypeMapping.get(typeSpec)!
        }
        return typeSpec
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        // TODO
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLAnyType: return ARK_CUSTOM_OBJECT
            case idl.IDLStringType: return 'String'
            case idl.IDLBooleanType: return 'Bool'
            case idl.IDLNumberType: return 'Float64'
            case idl.IDLUndefinedType: return 'Ark_Undefined'
            case idl.IDLI8Type: return 'Int8'
            case idl.IDLU8Type: return 'UInt8'
            case idl.IDLI16Type: return 'Int16'
            case idl.IDLU16Type: return 'UInt16'
            case idl.IDLI32Type: return 'Int32'
            case idl.IDLU32Type: return 'UInt32'
            case idl.IDLI64Type: return 'Int64'
            case idl.IDLU64Type: return 'UInt64'
            case idl.IDLF32Type: return 'Float32'
            case idl.IDLF64Type: return 'Float64'
            case idl.IDLPointerType: return 'Int64'
            case idl.IDLVoidType: return 'Unit'
            case idl.IDLBufferType: return 'ArrayList<UInt8>'
            case idl.IDLLengthType: return 'Ark_Length'
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly CJPrimitiveToReferenceTypeMap = new Map([
        ['byte', 'Byte'],
        ['short', 'Short'],
        ['int', 'Integer'],
        ['float', 'Float'],
        ['double', 'Double'],
        ['boolean', 'Boolean'],
        ['char', 'Character'],
    ])
    private maybeConvertPrimitiveType(CJType: string): string {
        // if (this.CJPrimitiveToReferenceTypeMap.has(CJType.type.text)) {
        //     return this.CJPrimitiveToReferenceTypeMap.get(CJType.type.text)!
        // }
        return CJType
    }

    private callbackType(decl: idl.IDLCallback): string {
        return `() -> ${this.convert(decl.returnType)}`
    }

    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        return `Tuple_${decl.properties.map(it => convertType(this, it.type)).join('_')}`
    }
    /**********************************************************************/
}

export class CJIDLTypeToForeignStringConvertor extends CJIDLNodeToStringConvertor {
    convert(type: idl.IDLNode): string {
        if (idl.isPrimitiveType(type)) {
            switch (type) {
                case idl.IDLStringType: return 'CString'
            }
        }
        if (idl.isContainerType(type)) {
            if (idl.IDLContainerUtils.isSequence(type)) {
                return `CPointer<${this.convert(type.elementType[0])}>`
            }
        }
        if (idl.isReferenceType(type)) {
            // Fix, actual mapping has to be due to IDLType
            if (super.convert(type).startsWith('Array'))
                return `CPointer<UInt8>`
            if (super.convert(type) == 'String' || super.convert(type) == 'KStringPtr' ) {
                return `CString`
            }
            if (super.convert(type) == 'Object') {
                return `KPointer`
            }
        }
        return super.convert(type)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLBufferType: return 'CPointer<UInt8>'
        }
        return super.convertPrimitiveType(type)
    }
}
