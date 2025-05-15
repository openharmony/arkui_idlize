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

export class TSTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(protected resolver: ReferenceResolver) { }

    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): string {
        return node.name
    }
    convertInterface(node: idl.IDLInterface): string {
        return idl.getQualifiedName(node, "namespace.name")
    }
    convertEnum(node: idl.IDLEnum): string {
        return idl.getQualifiedName(node, "namespace.name")
    }
    convertTypedef(node: idl.IDLTypedef): string {
        return node.name
    }
    convertCallback(node: idl.IDLCallback): string {
        return idl.isSyntheticEntry(node)
            ? this.mapCallback(node)
            : node.name
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
    convertImport(type: idl.IDLImport): string {
        console.warn("Imports are not implemented yet")
        return type.name
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        const maybeTypeArguments = type.typeArguments?.length ? `<${type.typeArguments.join(', ')}>` : ""
        let decl = this.resolver.resolveTypeReference(type)
        if (decl)
            return `${decl.name}${maybeTypeArguments}`
        return `${type.name}${maybeTypeArguments}`
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        if (type.name === idl.IDLObjectType.name) {
            return type.name
        }
        let decl = this.resolver.resolveTypeReference(type)
        if (decl) {
            if (idl.isSyntheticEntry(decl)) {
                if (idl.isCallback(decl)) {
                    return this.mapCallback(decl, type.typeArguments)
                }
                const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
                if (entity) {
                    const isTuple = entity === idl.IDLEntity.Tuple
                    return this.productType(decl as idl.IDLInterface, type.typeArguments, isTuple, !isTuple)
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
            let typeArgs = type.typeArguments?.map(it => this.convert(it)) ?? []
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
        return this.convert(idl.IDLCustomObjectType)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLFunctionType: return 'Function'

            case idl.IDLUnknownType:
            case idl.IDLCustomObjectType: return 'any'
            case idl.IDLThisType: return 'this'
            case idl.IDLAnyType: return 'any'
            case idl.IDLUndefinedType: return 'undefined'
            case idl.IDLPointerType: return 'KPointer'
            case idl.IDLSerializerBuffer: return 'KSerializerBuffer'
            case idl.IDLVoidType: return 'void'
            case idl.IDLBooleanType: return 'boolean'

            case idl.IDLI32Type:
                return 'int32'
            case idl.IDLF32Type:
                return 'float32'

            case idl.IDLI8Type:
            case idl.IDLU8Type:
            case idl.IDLI16Type:
            case idl.IDLU16Type:
            case idl.IDLU32Type:
            case idl.IDLI64Type:
            case idl.IDLU64Type:
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
                return 'NativeBuffer'

            case idl.IDLInteropReturnBufferType:
                return `KInteropReturnBuffer`
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    protected processTupleType(idlProperty: idl.IDLProperty): idl.IDLProperty {
        return idlProperty
    }
    protected createTypeSubstitution(parameters:string[] | undefined, args:idl.IDLType[] | undefined): Map<string, idl.IDLType> {
        const subst = new Map()
        if (args && parameters) {
            for (let i = 0; i < args.length && i < parameters.length; ++i) {
                subst.set(parameters[i], args[i])
            }
        }
        return subst
    }
    protected applySubstitution(subst:Map<string, idl.IDLType>, type:idl.IDLType): idl.IDLType {
        if (idl.isContainerType(type)) {
            return idl.createContainerType(type.containerKind, type.elementType.map(it => this.applySubstitution(subst, it)))
        }
        if (idl.isReferenceType(type)) {
            return idl.createReferenceType(type.name, type.typeArguments?.map(it => this.applySubstitution(subst, it)))
        }
        if (idl.isTypeParameterType(type)) {
            const record = subst.get(type.name)
            if (record) {
                return record
            }
        }
        return type
    }
    protected mapCallback(decl: idl.IDLCallback, args?:idl.IDLType[]): string {
        const subst = this.createTypeSubstitution(decl.typeParameters, args)
        const parameters = decl.parameters.map(it => {
            const param = idl.clone(it)
            param.type = this.applySubstitution(subst, param.type)
            return param
        })
        const params = parameters.map(it =>
            `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${this.convert(it.type!)}${it.isVariadic ? "[]" : ""}`)
        return `((${params.join(", ")}) => ${this.convert(decl.returnType)})`
    }
    protected productType(decl: idl.IDLInterface, args:idl.IDLType[] | undefined, isTuple: boolean, includeFieldNames: boolean): string {
        const subst = this.createTypeSubstitution(decl.typeParameters, args)
        const name = `${isTuple ? "[" : "{"
            } ${decl.properties
                .map(it => isTuple ? this.processTupleType(it) : it)
                .map(it => {
                    const prop = idl.clone(it)
                    prop.type = this.applySubstitution(subst, prop.type)
                    return prop
                })
                .map(it => {
                    const type = this.convert(it.type)
                    return it.isOptional
                        ? includeFieldNames ? `${it.name}?: ${type}` : `(${type})?`
                        : includeFieldNames ? `${it.name}: ${type}` : `${type}`
                }).join(", ")
            } ${isTuple ? "]" : "}"
            }`

        return name
    }
    protected mapFunctionType(typeArgs: string[]): string {
        return `Function${typeArgs.length ? `<${typeArgs.join(",")}>` : ''}`
    }
}

export class TSInteropArgConvertor implements TypeConvertor<string> {
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        throw new Error(`Cannot pass container types through interop`)
    }
    convertImport(type: idl.IDLImport): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return "KNativePointer"
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI64Type: return "KLong"
            case idl.IDLU64Type: return "KLong"
            case idl.IDLI32Type: return "KInt"
            case idl.IDLU32Type: return "KInt"
            case idl.IDLF32Type: return "KFloat"
            case idl.IDLNumberType: return 'number'
            case idl.IDLBigintType: return 'bigint'
            case idl.IDLBooleanType:
            case idl.IDLFunctionType: return 'KInt'
            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLBufferType: return 'ArrayBuffer'
            case idl.IDLDate: return 'number'
            case idl.IDLUndefinedType:
            case idl.IDLVoidType:
            case idl.IDLPointerType: return 'KPointer'
        }
        throw new Error(`Cannot pass primitive type ${type.name} through interop`)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        throw new Error("Cannot pass type parameters through interop")
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error(`Cannot pass import types through interop`)
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        throw new Error(`Cannot pass type references through interop`)
    }
    convertUnion(type: idl.IDLUnionType): string {
        throw new Error("Cannot pass union types through interop")
    }
}
