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
import { IdlPeerLibrary } from './IdlPeerLibrary'
import { convertType, DeclarationConvertor, IdlTypeNameConvertor, TypeConvertor } from '../LanguageWriters/typeConvertor'
import { ARK_CUSTOM_OBJECT, convertJavaOptional } from '../printers/lang/Java'
import { cjCustomTypeMapping } from '../printers/lang/Cangjie'
import { IDLExtendedAttributes } from "../../idl";

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    convertEnum(decl: idl.IDLEnum): string {
        return `${idl.getExtAttribute(decl, IDLExtendedAttributes.Namespace) ?? ""}${decl.name}`
    }
    convertTypedef(decl: idl.IDLTypedef): string {
        return decl.name
    }
    convertCallback(decl: idl.IDLCallback): string {
        return decl.name ?? "MISSING CALLBACK NAME"
    }

    static readonly I = new DeclarationNameConvertor()
}

export class CJTypeNameConvertor implements IdlTypeNameConvertor {
    private readonly typeAliasConvertor = new CJTypeAliasConvertor(this.library)
    constructor(private readonly library: IdlPeerLibrary) {}
    convert(type: idl.IDLType): string {
        const typeAlias = convertType(this.typeAliasConvertor, type)
        return typeAlias.type.optional ? convertJavaOptional(typeAlias.type.text) : typeAlias.type.text
    }
}

export class CJTypeAliasConvertor implements TypeConvertor<CJTypeAlias> {
    constructor(private readonly library: IdlPeerLibrary) {}
    convertOptional(type: idl.IDLOptionalType): CJTypeAlias {
        throw new Error("unimplemented")
    }
    convertUnion(type: idl.IDLUnionType): CJTypeAlias {
        const CJTypeAliases = type.types.map(it => convertType(this, it))
        const result = CJTypeAlias.fromTypeName(`Union_${CJTypeAliases.map(it => it.alias).join("_")}`, false)
        return result
    }
    convertContainer(type: idl.IDLContainerType): CJTypeAlias {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const cjTypeAlias = convertType(this, type.elementType[0])
            return new CJTypeAlias(`ArrayList<${cjTypeAlias.type.text}>`, `Array_${cjTypeAlias.alias}`)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const cjTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            const result = new CJTypeAlias(`Map<${cjTypeAliases[0].type.text}, ${cjTypeAliases[1].type.text}>`, `Map_${cjTypeAliases[0].alias}_${cjTypeAliases[1].alias}`)
            return result
        }
        throw new Error(`IDL type '${idl.DebugUtils.debugPrintType(type)}' not supported`)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): CJTypeAlias {
        return CJTypeAlias.fromTypeName(idl.getIDLTypeName(type), false)
    }
    convertTypeReference(type: idl.IDLReferenceType): CJTypeAlias {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }

        // resolve synthetic types
        const decl = this.library.resolveTypeReference(type)!
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

        let typeSpec = ''
        if (idl.isIDLTypeNameIn(type, cjCustomTypeMapping)) {
            typeSpec = cjCustomTypeMapping.get(typeSpec)!
        }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `Optional`) {
            return CJTypeAlias.fromTypeName(typeArgs![0], true)
        }
        return CJTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName(idl.getIDLTypeName(type), false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): CJTypeAlias {
        switch (type) {
            case idl.IDLStringType: return CJTypeAlias.fromTypeName('String', false)
            case idl.IDLNumberType: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLBooleanType: return CJTypeAlias.fromTypeName('Bool', false)
            case idl.IDLUndefinedType: return CJTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLAnyType: return CJTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
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
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly cjPrimitiveToReferenceTypeMap = new Map([
        ['byte', CJTypeAlias.fromTypeName('Byte', false)],
        ['short', CJTypeAlias.fromTypeName('Short', false)],
        ['int', CJTypeAlias.fromTypeName('Integer', false)],
        ['float', CJTypeAlias.fromTypeName('Float', false)],
        ['double', CJTypeAlias.fromTypeName('Double', false)],
        ['boolean', CJTypeAlias.fromTypeName('Boolean', false)],
        ['char', CJTypeAlias.fromTypeName('Character', false)],
    ])
    private callbackType(decl: idl.IDLCallback): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName('Callback', false)
    }
    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): CJTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const cjTypeAliases = decl.properties.map(it => CJTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return CJTypeAlias.fromTypeName(`Tuple_${cjTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }
    private maybeConvertPrimitiveType(cjType: CJTypeAlias): CJTypeAlias {
        if (this.cjPrimitiveToReferenceTypeMap.has(cjType.type.text)) {
            return this.cjPrimitiveToReferenceTypeMap.get(cjType.type.text)!
        }
        return cjType
    }
}

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
        return new CJTypeAlias({ text: typeName, optional }, optional ? convertJavaOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: CJTypeAlias, optional: boolean): CJTypeAlias {
        return new CJTypeAlias({ text: typeAlias.type.text, optional: typeAlias.type.optional }, optional ? convertJavaOptional(typeAlias.alias) : typeAlias.alias)
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
