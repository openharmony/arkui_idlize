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
import { throwException } from '../../../util';
import { ARK_CUSTOM_OBJECT, convertJavaOptional, javaCustomTypeMapping } from '../../printers/lang/Java';
import { ReferenceResolver } from '../../ReferenceResolver';
import { convertType, IdlNameConvertor, IdlNameConvertorBase, TypeConvertor } from "../nameConvertor";


class JavaTypeAlias {
    // Java type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: {
        text: string,
        optional: boolean
    }

    // synthetic identifier for internal use cases: naming classes/files etc.
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): JavaTypeAlias {
        return new JavaTypeAlias({ text: typeName, optional }, optional ? convertJavaOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: JavaTypeAlias, optional: boolean): JavaTypeAlias {
        return new JavaTypeAlias({ text: typeAlias.type.text, optional: typeAlias.type.optional || optional }, optional ? convertJavaOptional(typeAlias.alias) : typeAlias.alias)
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

export class JavaIDLNodeToStringConvertor extends IdlNameConvertorBase implements TypeConvertor<JavaTypeAlias> {

    constructor(
        private resolver: ReferenceResolver
    ) { super() }

    /**** IdlTypeNameConvertor *******************************************/

    convertType(type: idl.IDLType | idl.IDLCallback): string {
        const typeAlias = idl.isCallback(type)
            ? this.convertCallback(type)
            : convertType(this, type)
        const rowType = typeAlias.type.optional ? convertJavaOptional(typeAlias.type.text) : typeAlias.type.text
        return this.mapTypeName(rowType)
    }

    convertEntry(entry: idl.IDLEntry): string {
        return entry.name ?? throwException("Unnamed entry!")
    }

    /***** TypeConvertor<JavaTypeAlias> **********************************/

    convertOptional(type: idl.IDLOptionalType): JavaTypeAlias {
        return JavaTypeAlias.fromTypeName(convertJavaOptional(this.convertType(type.type)), true)
    }
    convertUnion(type: idl.IDLUnionType): JavaTypeAlias {
        const aliases = type.types.map(it => convertType(this, it))
        return JavaTypeAlias.fromTypeName(`Union_${aliases.map(it => it.alias).join('_')}`, false)
    }
    convertContainer(type: idl.IDLContainerType): JavaTypeAlias {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const javaTypeAlias = convertType(this, type.elementType[0])
            return new JavaTypeAlias(`${javaTypeAlias.type.text}[]`, `Array_${javaTypeAlias.alias}`)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const javaTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return new JavaTypeAlias(`Map<${javaTypeAliases[0].type.text}, ${javaTypeAliases[1].type.text}>`, `Map_${javaTypeAliases[0].alias}_${javaTypeAliases[1].alias}`)
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertCallback(type: idl.IDLCallback): JavaTypeAlias {
        // TODO
        return JavaTypeAlias.fromTypeName(`Callback`, false)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): JavaTypeAlias {
        return JavaTypeAlias.fromTypeName(type.name, false)
    }
    convertTypeReference(type: idl.IDLReferenceType): JavaTypeAlias {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }

        let typeSpec = type.name
        if (javaCustomTypeMapping.has(typeSpec)) {
            return JavaTypeAlias.fromTypeName(javaCustomTypeMapping.get(typeSpec)!, false)
        }

        const decl = this.resolver.resolveTypeReference(type)!
        if (decl) {
            // resolve synthetic types
            if (idl.isSyntheticEntry(decl)) {
                if (idl.isCallback(decl)) {
                    return this.callbackType(decl)
                }
                const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
                if (entity) {
                    const isTuple = entity === idl.IDLEntity.Tuple
                    return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
                }
            }

            if (decl.name) {
                if (javaCustomTypeMapping.has(decl.name)) {
                    return JavaTypeAlias.fromTypeName(javaCustomTypeMapping.get(decl.name)!, false)
                }
                return JavaTypeAlias.fromTypeName(decl.name, false)
            }
        }

        if (typeSpec === `Optional`) {
            return JavaTypeAlias.fromTypeName(idl.printType(type.typeArguments![0]), true)
        }
        return JavaTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): JavaTypeAlias {
        // TODO
        return JavaTypeAlias.fromTypeName(type.name, false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): JavaTypeAlias {
        switch (type) {
            case idl.IDLAnyType: return JavaTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
            case idl.IDLStringType: return JavaTypeAlias.fromTypeName('String', false)
            case idl.IDLNumberType: return JavaTypeAlias.fromTypeName('double', false)
            case idl.IDLBooleanType: return JavaTypeAlias.fromTypeName('boolean', false)
            case idl.IDLUndefinedType: return JavaTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLI8Type: return JavaTypeAlias.fromTypeName('byte', false)
            case idl.IDLU8Type: return JavaTypeAlias.fromTypeName('byte', false)
            case idl.IDLI16Type: return JavaTypeAlias.fromTypeName('short', false)
            case idl.IDLU16Type: return JavaTypeAlias.fromTypeName('short', false)
            case idl.IDLI32Type: return JavaTypeAlias.fromTypeName('int', false)
            case idl.IDLU32Type: return JavaTypeAlias.fromTypeName('int', false)
            case idl.IDLI64Type: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLU64Type: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLF32Type: return JavaTypeAlias.fromTypeName('float', false)
            case idl.IDLF64Type: return JavaTypeAlias.fromTypeName('double', false)
            case idl.IDLPointerType: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLVoidType: return JavaTypeAlias.fromTypeName('void', false)
            case idl.IDLDate: return JavaTypeAlias.fromTypeName('Date', false)
            case idl.IDLBufferType: return JavaTypeAlias.fromTypeName('byte[]', false)
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly javaPrimitiveToReferenceTypeMap = new Map([
        ['byte', JavaTypeAlias.fromTypeName('Byte', false)],
        ['short', JavaTypeAlias.fromTypeName('Short', false)],
        ['int', JavaTypeAlias.fromTypeName('Integer', false)],
        ['float', JavaTypeAlias.fromTypeName('Float', false)],
        ['double', JavaTypeAlias.fromTypeName('Double', false)],
        ['boolean', JavaTypeAlias.fromTypeName('Boolean', false)],
        ['char', JavaTypeAlias.fromTypeName('Character', false)],
    ])
    private maybeConvertPrimitiveType(javaType: JavaTypeAlias): JavaTypeAlias {
        if (this.javaPrimitiveToReferenceTypeMap.has(javaType.type.text)) {
            return this.javaPrimitiveToReferenceTypeMap.get(javaType.type.text)!
        }
        return javaType
    }

    private callbackType(decl: idl.IDLCallback): JavaTypeAlias {
        // TODO
        //const params = decl.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${this.library.mapType(it.type)}`)
        //`((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
        return JavaTypeAlias.fromTypeName('Callback', false)
    }

    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): JavaTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const javaTypeAliases = decl.properties.map(it => JavaTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return JavaTypeAlias.fromTypeName(`Tuple_${javaTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }

    private mapTypeName(name: string): string {
        switch (name) {
            case 'Length': return 'String'
            case 'KPointer': return 'long'
            case 'KBoolean': return 'boolean'
            case 'KUInt': return 'int'
            case 'int32': case 'KInt': return 'int'
            case 'int64': case 'KLong': return 'long'
            case 'float32': case 'KFloat': return 'float'
            case 'KUint8ArrayPtr': return 'byte[]'
            case 'KInt32ArrayPtr': return 'int[]'
            case 'KFloat32ArrayPtr': return 'float[]'
            // case 'ArrayBuffer': return 'byte[]'
            case 'KStringPtr': return 'String'
            case 'string': return 'String'
        }

        return name
    }

    /**********************************************************************/
}
