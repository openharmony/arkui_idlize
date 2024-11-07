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

import { convertType, IdlNameConvertorBase, TypeConvertor } from '../nameConvertor'
import * as idl from '../../../idl'
import { ReferenceResolver } from '../../ReferenceResolver'
import { throwException } from '../../../util'

export class TsIDLNodeToStringConverter extends IdlNameConvertorBase implements TypeConvertor<string> {

    constructor(
        protected resolver: ReferenceResolver
    ) { super() }

     /**** IdlTypeNameConvertor *******************************************/

    convertType(type: idl.IDLType): string {
        return convertType(this, type)
    }

    convertEntry(entry: idl.IDLEntry): string {
        if (idl.isCallback(entry)) {
            return this.mapCallback(entry)
        }
        return entry.name ?? throwException('unnamed entry!')
    }

    /***** TypeConvertor<string> *****************************************/
    
    convertOptional(type: idl.IDLOptionalType): string {
        return `${this.convertType(type.type)} | undefined` 
    }
    convertUnion(type: idl.IDLUnionType): string {
        return type.types.
            map(it => {
                if (false /* add check if it is function */) {
                    return `(${this.convertType(it)})`
                }
                return this.convertType(it)
            })
            .join(' | ')
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            switch (type.elementType[0]) {
                case idl.IDLU8Type: return 'Uint8Array'
                case idl.IDLI32Type: return 'Int32Array'
                case idl.IDLF32Type: return 'Float32Array'
                default: return `Array<${this.convertType(type.elementType[0])}>`
            }
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return `Map<${this.convertType(type.elementType[0])}, ${this.convertType(type.elementType[1])}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Promise<${this.convertType(type.elementType[0])}>`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(_: idl.IDLReferenceType, importClause: string): string {
        const match = importClause.match(/import *\((['"`])(.+)\1\)\.(.+)/)
        if (!match)
            throw new Error(`Cannot parse import clause ${importClause}`)
        const [where, what] = match.slice(2)
        return `IMPORT_${what}_FROM_${where}`.match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        const decl = this.resolver.resolveTypeReference(type)!
        let namespacePrefix = ''
        if (decl) {
            if (idl.isSyntheticEntry(decl)) {
                if (idl.isCallback(decl)) {
                    return namespacePrefix + this.mapCallback(decl)
                }
                const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
                if (entity) {
                    const isTuple = entity === idl.IDLEntity.Tuple
                    return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
                }
            }
            if (idl.isEnum(decl)) {
                const namespaceAttr = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace)
                if (namespaceAttr) {
                    namespacePrefix = namespaceAttr + '.'
                }
            }
        }

        // FIXME: isEnumMember is not TYPE!
        if (decl && idl.isEnumMember(decl) && decl.parent) {
            // when `interface A { field?: MyEnum.Value1 }` is generated, it is not possible
            // to deserialize A, because there is no such type information in declaration target
            // (can not cast MyEnum to exact MyEnum.Value1)
            return decl.parent?.name
        }

        let typeSpec = type.name
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `AttributeModifier`)
            typeArgs = [`object`]
        if (typeSpec === `ContentModifier`)
            typeArgs = [this.convertType(idl.IDLAnyType)] //this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
        if (typeSpec === `Optional`) {
            return `${typeArgs} | undefined`
        }
        const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
        // FIXME:
        if (namespacePrefix !== '' && typeSpec.startsWith(namespacePrefix)) {
            return `${typeSpec}${maybeTypeArguments}`
        }
        return `${namespacePrefix}${typeSpec}${maybeTypeArguments}`
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType: return 'unknown'
            case idl.IDLThisType: return 'this'
            case idl.IDLAnyType: return 'any'
            case idl.IDLUndefinedType: return 'undefined'
            case idl.IDLNullType: return 'null'
            case idl.IDLPointerType: return 'KPointer'
            case idl.IDLVoidType: return 'void'
            case idl.IDLBooleanType: return 'boolean'

            case idl.IDLI32Type:
                return 'int32'

            case idl.IDLI8Type:
            case idl.IDLU8Type:
            case idl.IDLI16Type:
            case idl.IDLU16Type:
            case idl.IDLU32Type:
            case idl.IDLI64Type:
            case idl.IDLU64Type:
            case idl.IDLF32Type:
            case idl.IDLF64Type:
            case idl.IDLNumberType:
                return 'number'

            case idl.IDLStringType:
                return 'string'

            case idl.IDLDate:
                return 'Date'
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    protected processTupleType(idlProperty: idl.IDLProperty): idl.IDLProperty {
        return idlProperty
    }
    protected mapCallback(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${this.convertType(it.type!)}`)
        return `((${params.join(", ")}) => ${this.convertType(decl.returnType)})`
    }

    protected productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        const name = `${
                isTuple ? "[" : "{"
            } ${
                decl.properties
                    .map(it => isTuple ? this.processTupleType(it) : it)
                    .map(it => {
                        const type = this.convertType(it.type)
                        return it.isOptional
                            ? includeFieldNames ? `${it.name}?: ${type}` : `(${type})?`
                            : includeFieldNames ? `${it.name}: ${type}` : `${type}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`
        
        return name
    }

    /**********************************************************************/
}
