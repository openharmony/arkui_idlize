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
import { Language } from '../../Language.js'
import { LibraryInterface } from '../../LibraryInterface.js'
import { isTopLevelConflicted } from '../../peer-generation/ConflictingDeclarations.js'
import { isDeclaredInCurrentFile, LayoutNodeRole } from '../../peer-generation/LayoutManager.js'
import { maybeRestoreGenerics, maybeRestoreThrows } from '../../transformers/transformUtils.js'
import { LanguageWriter } from '../LanguageWriter.js'
import { convertNode, convertType, IdlNameConvertor, isInsideInstanceof, NodeConvertor, TypeConvertor, withInsideInstanceof } from '../nameConvertor.js'

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
                if (LanguageWriter.isManagedThrowsTypeUnwrapped)
                    return this.convert(restoredThrow)
                if (idl.isPrimitiveType(restoredThrow, 'this'))
                    return this.convert(idl.createReferenceType(idl.IDLThrowsTypeName, [idl.createPrimitiveType('void')]))
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
        return this.convert(idl.createPrimitiveType('CustomObject'))
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type.name) {
            case 'Function': return 'Function'

            case 'unknown':
            case 'CustomObject': return 'any'
            case 'this': return 'this'
            case 'Object': return 'Object'
            case 'any': return 'any'
            case 'undefined': return 'undefined'
            case 'pointer': return 'KPointer'
            case 'SerializerBuffer': return 'KSerializerBuffer'
            case 'void': return 'void'
            case 'boolean': return 'boolean'

            case 'i32':
                return 'int32'
            case 'f32':
                return 'float32'

            case 'i8':
            case 'u8':
            case 'i16':
            case 'u16':
            case 'u32':
            case 'i64':
            case 'u64':
            case 'f64':
            case 'number':
                return 'number'

            case 'bigint':
                return 'bigint'

            case 'String':
                return 'string'

            case 'date':
                return 'Date'

            case 'buffer':
                return 'ArrayBuffer'

            case 'InteropReturnBuffer':
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
        const params = parameters.map(it => {
            // HACK: callbacks can have ThrowsWrapper<T> in argument but not in return type. Maybe there is more beautiful solution?
            const paramType = LanguageWriter.managedThrowsTypeUnwrapped(false, () => this.convert(it.type!))
            return `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${paramType}${it.isVariadic ? "[]" : ""}`
        })
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
        if (idl.isPrimitiveType(type.elementType[0])) {
            switch (type.elementType[0].name) {
                case 'u8': return 'KUint8ArrayPtr'
                case 'i32': return 'KInt32ArrayPtr'
                case 'f32': return 'KFloat32ArrayPtr'
            }
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
        switch (type.name) {
            case 'i64':
            case 'u64':
                return "KLong"
            case 'i8':
            case 'u8':
            case 'i32':
            case 'u32':
                return "KInt"
            case 'f32':
                return "KFloat"
            case 'f64':
                return "KDouble"
            case 'number':
                return 'number'
            case 'bigint':
                return 'bigint'
            case 'boolean':
                return 'boolean'
            case 'Function':
                return 'KInt'
            case 'String':
                return 'KStringPtr'
            case 'buffer':
                return 'ArrayBuffer'
            case 'SerializerBuffer':
                return 'KSerializerBuffer'
            case 'InteropReturnBuffer':
                return `KInteropReturnBuffer`
            case 'Object':
                return 'Object'
            case 'any':
                return "Object"
            case 'date':
                return 'number'
            case 'void':
                return 'void'
            case 'undefined':
            case 'pointer':
                return 'KPointer'
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