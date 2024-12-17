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

export interface IdlNameConvertor {
    convert(node: idl.IDLNode): string
}

export interface TypeConvertor<T> {
    convertOptional(type: idl.IDLOptionalType): T
    convertUnion(type: idl.IDLUnionType): T
    convertContainer(type: idl.IDLContainerType): T
    convertImport(type: idl.IDLReferenceType, importClause: string): T
    convertTypeReference(type: idl.IDLReferenceType): T
    convertTypeParameter(type: idl.IDLTypeParameterType): T
    convertPrimitiveType(type: idl.IDLPrimitiveType): T
}

export function convertType<T>(convertor: TypeConvertor<T>, type: idl.IDLType): T {
    if (idl.isOptionalType(type)) return convertor.convertOptional(type)
    if (idl.isUnionType(type)) return convertor.convertUnion(type)
    if (idl.isContainerType(type)) return convertor.convertContainer(type)
    if (idl.isReferenceType(type)) {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        return importAttr
            ? convertor.convertImport(type, importAttr)
            : convertor.convertTypeReference(type)
    }
    if (idl.isTypeParameterType(type)) return convertor.convertTypeParameter(type)
    if (idl.isPrimitiveType(type)) return convertor.convertPrimitiveType(type)
    throw new Error(`Unknown type ${idl.IDLKind[type.kind]}`)
}

export interface DeclarationConvertor<T> {
    convertInterface(node: idl.IDLInterface): T
    convertEnum(node: idl.IDLEnum): T
    convertTypedef(node: idl.IDLTypedef): T
    convertCallback(node: idl.IDLCallback): T
}

export function convertDeclaration<T>(convertor: DeclarationConvertor<T>, decl: idl.IDLEntry): T {
    if (idl.isInterface(decl))
        return convertor.convertInterface(decl)
    if (idl.isEnum(decl)) return convertor.convertEnum(decl)
    if (idl.isEnumMember(decl)) return convertor.convertEnum(decl.parent)
    if (idl.isTypedef(decl)) return convertor.convertTypedef(decl)
    if (idl.isCallback(decl)) return convertor.convertCallback(decl)
    throw new Error(`Unknown declaration type ${decl.kind ? idl.IDLKind[decl.kind] : "(undefined kind)"}`)
}

export interface NodeConvertor<T> extends TypeConvertor<T>, DeclarationConvertor<T> {}

export function convertNode<T>(convertor: NodeConvertor<T>, node: idl.IDLNode): T {
    if (idl.isEntry(node))
        return convertDeclaration(convertor, node)
    if (idl.isType(node))
        return convertType(convertor, node)
    throw new Error(`Unknown node type ${idl.IDLKind[node.kind]}`)
}