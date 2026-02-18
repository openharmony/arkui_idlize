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
import { CJKeywords } from '../../languageSpecificKeywords.js'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver.js'
import { maybeRestoreThrows } from '../../transformers/transformUtils.js'
import { removePoints } from '../../util.js'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor } from '../nameConvertor.js'
import { InteropArgConvertor } from './InteropConvertors.js'

export class CJTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(
        protected resolver: ReferenceResolver
    ) { }

    convert(node: idl.IDLNode): string {
        if (idl.isType(node) && idl.isReferenceType(node)) {
            if (node.name.startsWith('%TEXT%:')) {
                return node.name.substring(7)
            }
        }
        return convertNode(this, node)
    }

    /***** TypeConvertor<string> **********************************/
    convertOptional(type: idl.IDLOptionalType): string {
        return `Option<${this.convert(type.type)}>`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return "Union_" + type.types.map(it => idl.generateSyntheticIdlNodeName(it)).join("_")
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            return `ArrayList<${convertType(this, type.elementType[0])}>`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const stringes = type.elementType.slice(0, 2).map(it => convertType(this, it))
            if (idl.isReferenceType(type.elementType[0])) {
                const keyValueType = this.resolver.resolveTypeReference(type.elementType[0])!
                if (idl.isInterface(keyValueType) || idl.isEnum(keyValueType)) {
                    return `HashMap<Int64, ${stringes[1]}>`
                }
            }
            return `HashMap<${stringes[0]}, ${stringes[1]}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Any`
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertNamespace(node: idl.IDLNamespace): string {
        return node.name
    }
    convertInterface(node: idl.IDLInterface): string {
        return removePoints(idl.getNamespaceName(node).concat(node.name))
    }
    convertEnum(node: idl.IDLEnum): string {
        return removePoints(idl.getNamespaceName(node).concat(node.name))
    }
    convertTypedef(node: idl.IDLTypedef): string {
        return node.name
    }
    convertCallback(type: idl.IDLCallback): string {
        const params = type.parameters.map(it =>
            `${CJKeywords.has(it.name) ? it.name.concat("_") : it.name}: ${it.isOptional ? "?" : ""}${this.convert(it.type!)}`)
        return `(${params.join(", ")}) -> ${this.convert(type.returnType)}`
    }
    convertMethod(node: idl.IDLMethod): string {
        throw new Error('Method not implemented.')
    }
    convertConstant(node: idl.IDLConstant): string {
        throw new Error('Method not implemented.')
    }
    convertImport(type: idl.IDLImport): string {
        console.warn("Imports are not implemented yet")
        return type.name
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        const maybeTypeArguments = type.typeArguments?.length ? `<${type.typeArguments.join(', ')}>` : ""
        let decl = this.resolver.resolveTypeReference(type)
        if (decl)
            return `${decl.name}${maybeTypeArguments}`
        return this.convert(idl.createPrimitiveType('CustomObject'))
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (type.name === 'Object')
            return "KPointer"
        // resolve synthetic types
        const decl = this.resolver.resolveTypeReference(type)!
        let restoredThrow: idl.IDLType | undefined
        if (restoredThrow = maybeRestoreThrows(decl, this.resolver)) {
            return this.convert(restoredThrow)
        }
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
        let name = type.name.split('.')
        let typeArgs = type.typeArguments?.map(it => this.convert(it)) ?? []
        const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
        if (decl) {
            return idl.getNamespacesPathFor(decl).map(ns => ns.name).join().concat(name[name.length - 1].concat(maybeTypeArguments))
        }
        return this.convert(idl.createPrimitiveType('CustomObject'))
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'this': return 'this'
            case 'String': return 'String'
            case 'boolean': return 'Bool'
            case 'number': return 'Float64'
            case 'undefined': return 'Unit' // might be wrong
            case 'i8': return 'Int8'
            case 'u8': return 'UInt8'
            case 'i16': return 'Int16'
            case 'u16': return 'UInt16'
            case 'i32': return 'Int32'
            case 'u32': return 'UInt32'
            case 'i64': return 'Int64'
            case 'u64': return 'UInt64'
            case 'f32': return 'Float32'
            case 'f64': return 'Float64'
            case 'pointer': return 'UInt64'
            case 'void': return 'Unit'
            case 'buffer': return 'Array<UInt8>'
            case 'InteropReturnBuffer': return 'Array<UInt8>'
            case 'bigint': return 'Int64'
            case 'SerializerBuffer': return 'KSerializerBuffer'
            case 'any': return 'Any'
            case 'date': return 'DateTime'
            case 'Object': return 'Any'

            case 'unknown':
            case 'Function':
            case 'CustomObject': return 'Any'
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }

    private callbackType(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${CJKeywords.has(it.name) ? it.name.concat("_") : it.name}: ${it.isOptional ? "?" : ""}${this.convert(it.type!)}`)
        return `((${params.join(", ")}) -> ${this.convert(decl.returnType)})`
    }

    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        return decl.name
    }
}

export class CJIDLTypeToForeignStringConvertor extends CJTypeNameConvertor {
    convert(type: idl.IDLNode): string {
        if (idl.isPrimitiveType(type)) {
            switch (type.name) {
                case 'String': return 'CString'
                case 'InteropReturnBuffer': return 'KInteropReturnBuffer'
                case 'SerializerBuffer': return 'KSerializerBuffer'
                case 'Object': return 'Unit'
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
        switch (type.name) {
            case 'buffer': return 'CPointer<UInt8>'
        }
        return super.convertPrimitiveType(type)
    }
}

export class CJInteropArgConvertor extends InteropArgConvertor {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'number': return "Float64"
        }
        return super.convertPrimitiveType(type)
    }
}
