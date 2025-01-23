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

import { convertNode, IdlNameConvertor, NodeConvertor } from '@idlize/core'
import * as idl from '@idlize/core/idl'
import { ReferenceResolver } from "@idlize/core"
import { stringOrNone } from '@idlize/core'

export class TsIDLNodeToStringConverter implements NodeConvertor<string>, IdlNameConvertor {

    constructor(
        protected resolver: ReferenceResolver
    ) { }

    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    /***** TypeConvertor<string> *****************************************/

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
        return node.name
    }
    convertMethod(node: idl.IDLMethod): string {
        return node.name
    }
    convertConstant(node: idl.IDLConstant): string {
        return node.name
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return `${this.convert(type.type)} | undefined`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return type.types.
            map(it => {
                if (false /* add check if it is function */) {
                    return `(${this.convert(it)})`
                }
                return this.convert(it)
            })
            .join(' | ')
    }
    convertContainer(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            switch (type.elementType[0]) {
                case idl.IDLU8Type: return 'Uint8Array' // should be changed to Array
                case idl.IDLI32Type: return 'Int32Array' // should be changed to Array
                case idl.IDLF32Type: return 'KFloat32ArrayPtr' // should be changed to Array
                default: return `Array<${this.convert(type.elementType[0])}>`
            }
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return `Map<${this.convert(type.elementType[0])}, ${this.convert(type.elementType[1])}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Promise<${this.convert(type.elementType[0])}>`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        return type.name
    }

    convertTypeReference(type: idl.IDLReferenceType): string {
        let decl = this.resolver.resolveTypeReference(type)
        if (decl) {
            if (idl.isSyntheticEntry(decl)) {
                if (idl.isCallback(decl)) {
                    return this.mapCallback(decl)
                }
                const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
                if (entity) {
                    const isTuple = entity === idl.IDLEntity.Tuple
                    return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
                }
            }
        }

        // FIXME: isEnumMember is not TYPE!
        if (decl && idl.isEnumMember(decl) && decl.parent) {
            // when `interface A { field?: MyEnum.Value1 }` is generated, it is not possible
            // to deserialize A, because there is no such type information in declaration target
            // (can not cast MyEnum to exact MyEnum.Value1)
            decl = decl.parent
        }

        let typeSpec = type.name
        let typeArgs = type.typeArguments?.map(it => idl.printType(it)) ?? []
        if (typeSpec === `AttributeModifier`)
            typeArgs = [`object`]
        if (typeSpec === `ContentModifier` || typeSpec === `WrappedBuilder`)
            typeArgs = [this.convert(idl.IDLAnyType)]
        if (typeSpec === `Optional`)
            return `${typeArgs} | undefined`
        if (typeSpec === `Function`)
            return this.mapFunctionType(typeArgs)
        const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
        if (decl) {
            const path = idl.getNamespacesPathFor(decl).map(it => it.name)
            path.push(decl.name)
            return `${path.join(".")}${maybeTypeArguments}`
        }
        return `${type.name}${maybeTypeArguments}`
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

            case idl.IDLBigintType:
                return 'bigint'

            case idl.IDLStringType:
                return 'string'

            case idl.IDLDate:
                return 'Date'

            case idl.IDLBufferType:
                return `ArrayBuffer`

            case idl.IDLLengthType:
                return 'Length'
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    protected processTupleType(idlProperty: idl.IDLProperty): idl.IDLProperty {
        return idlProperty
    }
    protected mapCallback(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${this.convert(it.type!)}`)
        return `((${params.join(", ")}) => ${this.convert(decl.returnType)})`
    }

    protected productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        const name = `${
                isTuple ? "[" : "{"
            } ${
                decl.properties
                    .map(it => isTuple ? this.processTupleType(it) : it)
                    .map(it => {
                        const type = this.convert(it.type)
                        return it.isOptional
                            ? includeFieldNames ? `${it.name}?: ${type}` : `(${type})?`
                            : includeFieldNames ? `${it.name}: ${type}` : `${type}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`

        return name
    }
    protected mapFunctionType(typeArgs: string[]): string {
        return `Function${typeArgs.length ? `<${typeArgs.join(",")}>` : ''}`
    }

    /**********************************************************************/
}
