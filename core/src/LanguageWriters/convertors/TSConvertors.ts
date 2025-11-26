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
import { Language } from '../../Language'
import { LibraryInterface } from '../../LibraryInterface'
import { isTopLevelConflicted } from '../../peer-generation/ConflictingDeclarations'
import { isDeclaredInCurrentFile, LayoutNodeRole } from '../../peer-generation/LayoutManager'
import { maybeRestoreGenerics } from '../../transformers/GenericTransformer'
import { maybeRestoreThrows } from '../../transformers/ThrowsTransformer'
import { convertNode, convertType, IdlNameConvertor, isInsideInstanceof, NodeConvertor, TypeConvertor, withInsideInstanceof } from '../nameConvertor'

export class TSTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(protected library: LibraryInterface) { }

    protected mangleTopLevel(decl: idl.IDLEntry): string | undefined {
        if (!isDeclaredInCurrentFile(this.library.layout, { node: decl, role: LayoutNodeRole.INTERFACE }) && isTopLevelConflicted(this.library, Language.TS, decl)) {
            const namespaces = idl.getNamespacesPathFor(decl)
            if (namespaces.length === 0) {
                return idl.getQualifiedName(decl, "package.namespace.name").replaceAll('.', '_')
            }
            const [rootNamespace, ...otherNamespaces] = idl.getNamespacesPathFor(decl)
            const mangledRoot = idl.getQualifiedName(rootNamespace, "package.namespace.name").replaceAll('.', '_')
            return [mangledRoot, ...otherNamespaces, decl.name].join(".")
        }
        return undefined
    }
    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): string {
        return node.name
    }
    convertInterface(node: idl.IDLInterface): string {
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, "namespace.name")
    }
    convertEnum(node: idl.IDLEnum): string {
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, "namespace.name")
    }
    convertTypedef(node: idl.IDLTypedef): string {
        if (idl.isSyntheticEntry(node))
            return this.convert(node.type)
        return this.mangleTopLevel(node) ?? idl.getQualifiedName(node, "namespace.name")
    }
    convertCallback(node: idl.IDLCallback): string {
        return idl.isSyntheticEntry(node)
            ? this.mapCallback(node)
            : this.mangleTopLevel(node) ?? node.name
    }
    convertMethod(node: idl.IDLMethod): string {
        return node.name
    }
    convertConstant(node: idl.IDLConstant): string {
        return node.name
    }
    convertOptional(type: idl.IDLOptionalType): string {
        if (idl.hasExtAttribute(type, idl.IDLExtendedAttributes.UnionOnlyNull)) {
            return `${this.convert(type.type)} | null`
        } else if (idl.hasExtAttribute(type, idl.IDLExtendedAttributes.UnionWithNull)) {
            return `${this.convert(type.type)} | null | undefined`
        } else {
            return `${this.convert(type.type)} | undefined`
        }
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
            return isInsideInstanceof() ? `Array` : `Array<${this.convert(type.elementType[0])}>`
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return isInsideInstanceof() ? `Map` : `Map<${this.convert(type.elementType[0])}, ${this.convert(type.elementType[1])}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return isInsideInstanceof() ? `Promise` : `Promise<${this.convert(type.elementType[0])}>`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    convertImport(type: idl.IDLImport): string {
        console.warn("Imports are not implemented yet")
        return type.name
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        const maybeTypeArguments = type.typeArguments?.length && !isInsideInstanceof() ? `<${type.typeArguments.join(', ')}>` : ""
        let decl = this.library.resolveTypeReference(type)
        if (decl)
            return `${decl.name}${maybeTypeArguments}`
        return `${type.name}${maybeTypeArguments}`
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        let decl = this.library.resolveTypeReference(type)
        if (decl) {
            if (idl.isSyntheticEntry(decl)) {
                if (idl.isCallback(decl)) {
                    return this.mapCallback(decl, type.typeArguments)
                }
                if (idl.isTypedef(decl)) {
                    return this.convert(decl.type)
                }
                const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
                if (entity) {
                    const isTuple = entity === idl.IDLEntity.Tuple
                    return this.productType(decl as idl.IDLInterface, type.typeArguments, isTuple, !isTuple)
                }
            }

            let restoredThrow: idl.IDLType | undefined
            if (restoredThrow = maybeRestoreThrows(decl, this.library)) {
                return this.convert(restoredThrow)
            }

            // FIXME: isEnumMember is not TYPE!
            if (decl && idl.isEnumMember(decl) && decl.parent) {
                // when `interface A { field?: MyEnum.Value1 }` is generated, it is not possible
                // to deserialize A, because there is no such type information in declaration target
                // (can not cast MyEnum to exact MyEnum.Value1)
                decl = decl.parent
            }

            let maybeRestoredGeneric = maybeRestoreGenerics(type, this.library)
            if (maybeRestoredGeneric) {
                type = maybeRestoredGeneric
                decl = this.library.resolveTypeReference(maybeRestoredGeneric)
            }
            let typeSpec = type.name
            let typeArgs = !isInsideInstanceof() || decl && idl.isCallback(decl)
                // there is a bug with panda - if we're inside callback generics, we need to expand other generics too. So withInsideInstanceof is used
                ? type.typeArguments?.map(it => withInsideInstanceof(false, () => this.convert(it))) ?? []
                : []
            if (typeSpec === `Optional`)
                return `${typeArgs} | undefined`
            if (typeSpec === `Function`)
                return this.mapFunctionType(typeArgs)
            const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
            if (decl) {
                const path = idl.getNamespacesPathFor(decl).map(it => it.name)
                path.push(decl.name)
                return `${this.mangleTopLevel(decl) ?? path.join(".")}${maybeTypeArguments}`
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
            case idl.IDLObjectType: return 'Object'
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
                return 'ArrayBuffer'

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
    protected mapCallback(decl: idl.IDLCallback, args?:idl.IDLType[]): string {
        const subst = this.createTypeSubstitution(decl.typeParameters, args)
        const parameters = decl.parameters.map(it => {
            if (subst.size == 0) return it
            const param = idl.clone(it)
            param.parent = it.parent
            const type = applySubstitution(subst, param.type)
            updateParent(param, type)
            param.type = type
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
                    if (subst.size == 0) return it
                    const prop = idl.clone(it)
                    prop.parent = it.parent
                    const type = applySubstitution(subst, prop.type)
                    updateParent(prop, type)
                    prop.type = type
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
        return isInsideInstanceof() ? `Function` : `Function${typeArgs.length ? `<${typeArgs.join(",")}>` : ''}`
    }
}

export class TSInteropArgConvertor implements TypeConvertor<string> {
    convert(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        switch (type.elementType[0]) {
            case idl.IDLU8Type: return 'KUint8ArrayPtr'
            case idl.IDLI32Type: return 'KInt32ArrayPtr'
            case idl.IDLF32Type: return 'KFloat32ArrayPtr'
        }
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
            case idl.IDLU8Type: return "KInt"
            case idl.IDLI32Type: return "KInt"
            case idl.IDLU32Type: return "KInt"
            case idl.IDLF32Type: return "KFloat"
            case idl.IDLF64Type: return "KDouble"
            case idl.IDLNumberType: return 'number'
            case idl.IDLBigintType: return 'bigint'
            case idl.IDLBooleanType: return 'boolean'
            case idl.IDLFunctionType: return 'KInt'
            case idl.IDLStringType: return 'KStringPtr'
            case idl.IDLBufferType: return 'ArrayBuffer'
            case idl.IDLSerializerBuffer: return 'KSerializerBuffer'
            case idl.IDLInteropReturnBufferType: return `KInteropReturnBuffer`
            case idl.IDLObjectType: return 'Object'
            case idl.IDLAnyType: return "Object"
            case idl.IDLDate: return 'number'
            case idl.IDLVoidType: return 'void'
            case idl.IDLUndefinedType:
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

function applySubstitution(subst: Map<string, idl.IDLType>, type: idl.IDLType): idl.IDLType {
    if (idl.isContainerType(type)) {
        return idl.createContainerType(type.containerKind, type.elementType.map(it => applySubstitution(subst, it)))
    }
    if (idl.isReferenceType(type)) {
        return idl.createReferenceType(type.name, type.typeArguments?.map(it => applySubstitution(subst, it)))
    }
    if (idl.isTypeParameterType(type)) {
        const record = subst.get(type.name)
        if (record) {
            return record
        }
    }
    return type
}

// Update parents to properly find a file for conflicted types
function updateParent(parent: idl.IDLNode | undefined, type: idl.IDLType) {
    type.parent = parent
    if (idl.isOptionalType(type)) updateParent(type, type.type)
    if (idl.isUnionType(type)) updateParents(type, type.types)
    if (idl.isContainerType(type)) updateParents(type, type.elementType)
}

function updateParents(parent: idl.IDLType, types: idl.IDLType[]) {
    for (const type of types) updateParent(parent, type)
}