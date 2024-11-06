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
import { ARK_CUSTOM_OBJECT, cjCustomTypeMapping, convertCJOptional } from '../../printers/lang/Cangjie'
import { ReferenceResolver } from '../../ReferenceResolver'
import { convertType, IdlTypeNameConvertor, TypeConvertor } from "../typeConvertor"

class CJTypeAlias {
    // CJ type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: {
        text: string,
        optional: boolean
    }

    // synthetic identifier for internal use cases: naming classes/files etc.
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): CJTypeAlias {
        return new CJTypeAlias({ text: typeName, optional }, optional ? convertCJOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: CJTypeAlias, optional: boolean): CJTypeAlias {
        return new CJTypeAlias({ text: typeAlias.type.text, optional: typeAlias.type.optional }, optional ? convertCJOptional(typeAlias.alias) : typeAlias.alias)
    }

    constructor(type: { text: string, optional: boolean } | string, alias: string) {
        if (typeof type === 'string') {
            this.type = {
                text: type,
                optional: false
            }
        } else {
            this.type = type
        }
        this.alias = alias
    }
}

export class CJIDLTypeToStringConvertor implements IdlTypeNameConvertor, TypeConvertor<CJTypeAlias> {

    constructor(
        protected resolver: ReferenceResolver
    ) {}

     /**** IdlTypeNameConvertor *******************************************/

    convert(type: idl.IDLType | idl.IDLCallback): string {
        const typeAlias = idl.isCallback(type) 
            ? this.convertCallback(type) 
            : convertType(this, type)
        const rawType = typeAlias.type.optional ? convertCJOptional(typeAlias.type.text) : typeAlias.type.text 
        return this.mapTypeName(rawType)
    }

    /***** TypeConvertor<CJTypeAlias> **********************************/
    convertOptional(type: idl.IDLOptionalType): CJTypeAlias {
        return CJTypeAlias.fromTypeName(convertCJOptional(this.convert(type.type)), true)
    }
    convertUnion(type: idl.IDLUnionType): CJTypeAlias {
        const aliases = type.types.map(it => convertType(this, it))
        return CJTypeAlias.fromTypeName(`Union_${aliases.map(it => it.alias).join('_')}`, false)
    }
    convertContainer(type: idl.IDLContainerType): CJTypeAlias {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const cjTypeAlias = convertType(this, type.elementType[0])
            return new CJTypeAlias(`ArrayList<${cjTypeAlias.type.text}>`, `Array_${cjTypeAlias.alias}`)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const CJTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return new CJTypeAlias(`Map<${CJTypeAliases[0].type.text}, ${CJTypeAliases[1].type.text}>`, `Map_${CJTypeAliases[0].alias}_${CJTypeAliases[1].alias}`)
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertCallback(type: idl.IDLCallback): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName(`Callback`, false)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): CJTypeAlias {
        return CJTypeAlias.fromTypeName(type.name, false)
    }
    convertTypeReference(type: idl.IDLReferenceType): CJTypeAlias {
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
        // const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier)
        // if (qualifier) {
        //     typeSpec = `${qualifier}.${typeSpec}`
        // }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `Optional`) {
            return CJTypeAlias.fromTypeName(typeArgs![0], true)
        }
        return CJTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName(type.name, false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): CJTypeAlias {
        switch (type) {
            case idl.IDLAnyType: return CJTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
            case idl.IDLStringType: return CJTypeAlias.fromTypeName('String', false)
            case idl.IDLBooleanType: return CJTypeAlias.fromTypeName('Bool', false)
            case idl.IDLNumberType: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLUndefinedType: return CJTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLI8Type: return CJTypeAlias.fromTypeName('Int8', false)
            case idl.IDLU8Type: return CJTypeAlias.fromTypeName('UInt8', false)
            case idl.IDLI16Type: return CJTypeAlias.fromTypeName('Int16', false)
            case idl.IDLU16Type: return CJTypeAlias.fromTypeName('UInt16', false)
            case idl.IDLI32Type: return CJTypeAlias.fromTypeName('Int32', false)
            case idl.IDLU32Type: return CJTypeAlias.fromTypeName('UInt32', false)
            case idl.IDLI64Type: return CJTypeAlias.fromTypeName('Int64', false)
            case idl.IDLU64Type: return CJTypeAlias.fromTypeName('UInt64', false)
            case idl.IDLF32Type: return CJTypeAlias.fromTypeName('Float32', false)
            case idl.IDLF64Type: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLPointerType: return CJTypeAlias.fromTypeName('Int64', false)
            case idl.IDLVoidType: return CJTypeAlias.fromTypeName('Unit', false)
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly CJPrimitiveToReferenceTypeMap = new Map([
        ['byte', CJTypeAlias.fromTypeName('Byte', false)],
        ['short', CJTypeAlias.fromTypeName('Short', false)],
        ['int', CJTypeAlias.fromTypeName('Integer', false)],
        ['float', CJTypeAlias.fromTypeName('Float', false)],
        ['double', CJTypeAlias.fromTypeName('Double', false)],
        ['boolean', CJTypeAlias.fromTypeName('Boolean', false)],
        ['char', CJTypeAlias.fromTypeName('Character', false)],
    ])
    private maybeConvertPrimitiveType(CJType: CJTypeAlias): CJTypeAlias {
        if (this.CJPrimitiveToReferenceTypeMap.has(CJType.type.text)) {
            return this.CJPrimitiveToReferenceTypeMap.get(CJType.type.text)!
        }
        return CJType
    }

    private callbackType(decl: idl.IDLCallback): CJTypeAlias {
        // TODO
        //const params = decl.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${this.library.mapType(it.type)}`)
        //`((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
        return CJTypeAlias.fromTypeName('Callback', false)
    }

    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): CJTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const CJTypeAliases = decl.properties.map(it => CJTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return CJTypeAlias.fromTypeName(`Tuple_${CJTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }

    private mapTypeName(name: string): string {
        // stub, should be fixed soon
        switch (name) {
            case 'Length': return 'String'
            case 'KPointer': return 'Int64'
            case 'KBoolean': return 'Bool'
            case 'KUInt': return 'UInt32'
            case 'int32': case 'KInt': return 'Int32'
            case 'int64': case 'KLong': return 'Int64'
            case 'float32': case 'KFloat': return 'Float32'
            case 'Uint8Array': return 'ArrayList<UInt8>'
            case 'KUint8ArrayPtr': return 'Int64'
            case 'KInt32ArrayPtr': return 'Int64'
            case 'KFloat32ArrayPtr': return 'Int64'
            case 'KStringPtr': return 'Int64'
            case 'string': return 'String'
        }
        return name
    }
    /**********************************************************************/
}

export class CJIDLTypeToForeignStringConvertor extends CJIDLTypeToStringConvertor {
    convert(type: idl.IDLType | idl.IDLCallback): string {
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
        if (idl.isReferenceType(type) && super.convert(type).startsWith('Array')) {
            // Fix, actual mapping has to be due to IDLType
            return `CPointer<UInt8>`
        }
        return super.convert(type)
    }
}
