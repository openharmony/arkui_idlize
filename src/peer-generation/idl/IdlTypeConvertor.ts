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

export interface TypeConvertor<T> {
    convertUnion(type: idl.IDLUnionType): T
    convertContainer(type: idl.IDLContainerType): T
    convertEnum(type: idl.IDLEnumType): T
    // convertTypeLiteral(node: ts.TypeLiteralNode): T
    // convertLiteralType(node: ts.LiteralTypeNode): T
    // convertTuple(node: ts.TupleTypeNode): T
    // convertArray(node: ts.ArrayTypeNode): T
    // convertOptional(node: ts.OptionalTypeNode): T
    // convertFunction(node: ts.FunctionTypeNode): T
    // convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): T
    convertImport(type: idl.IDLReferenceType, importClause: string): T
    convertTypeReference(type: idl.IDLReferenceType): T
    convertTypeParameter(type: idl.IDLTypeParameterType): T
    // convertParenthesized(node: ts.ParenthesizedTypeNode): T
    // convertIndexedAccess(node: ts.IndexedAccessTypeNode): T
    convertPrimitiveType(type: idl.IDLPrimitiveType): T
    // convertStringKeyword(node: ts.TypeNode): T
    // convertNumberKeyword(node: ts.TypeNode): T
    // convertBooleanKeyword(node: ts.TypeNode): T
    // convertUndefinedKeyword(node: ts.TypeNode): T
    // convertVoidKeyword(node: ts.TypeNode): T
    // convertObjectKeyword(node: ts.TypeNode): T
    // convertAnyKeyword(node: ts.TypeNode): T
    // convertUnknownKeyword(node: ts.TypeNode): T
    /// experimental. Do we need these?
    convertCallback(type: idl.IDLCallback): T
}

export function convertType<T>(convertor: TypeConvertor<T>, type: idl.IDLType): T {
    if (idl.isUnionType(type)) return convertor.convertUnion(type)
    if (idl.isContainerType(type)) return convertor.convertContainer(type)
    if (idl.isEnumType(type)) return convertor.convertEnum(type)
    // if (ts.isTypeLiteralNode(type)) return convertor.convertTypeLiteral(type)
    // if (ts.isLiteralTypeNode(type)) return convertor.convertLiteralType(type)
    // if (ts.isTupleTypeNode(type)) return convertor.convertTuple(type)
    // if (ts.isArrayTypeNode(type)) return convertor.convertArray(type)
    // if (ts.isOptionalTypeNode(type)) return convertor.convertOptional(type)
    // if (ts.isFunctionTypeNode(type)) return convertor.convertFunction(type)
    // if (ts.isTemplateLiteralTypeNode(type)) return convertor.convertTemplateLiteral(type)
    if (idl.isReferenceType(type)) {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        return importAttr
            ? convertor.convertImport(type, importAttr)
            : convertor.convertTypeReference(type)
    }
    if (idl.isTypeParameterType(type)) return convertor.convertTypeParameter(type)
    // if (ts.isParenthesizedTypeNode(type)) return convertor.convertParenthesized(type)
    // if (ts.isIndexedAccessTypeNode(type)) return convertor.convertIndexedAccess(type)
    if (idl.isPrimitiveType(type)) return convertor.convertPrimitiveType(type)
    // if (type.kind == ts.SyntaxKind.StringKeyword) return convertor.convertStringKeyword(type)
    // if (type.kind == ts.SyntaxKind.NumberKeyword) return convertor.convertNumberKeyword(type)
    // if (type.kind == ts.SyntaxKind.BooleanKeyword) return convertor.convertBooleanKeyword(type)
    // if (type.kind == ts.SyntaxKind.UndefinedKeyword) return convertor.convertUndefinedKeyword(type)
    // if (type.kind == ts.SyntaxKind.VoidKeyword) return convertor.convertVoidKeyword(type)
    // if (type.kind == ts.SyntaxKind.ObjectKeyword) return convertor.convertObjectKeyword(type)
    // if (type.kind == ts.SyntaxKind.AnyKeyword) return convertor.convertAnyKeyword(type)
    // if (type.kind == ts.SyntaxKind.UnknownKeyword) return convertor.convertUnknownKeyword(type)
    if (idl.isCallback(type)) return convertor.convertCallback(type)
    throw new Error(`Unknown type ${idl.IDLKind[type.kind]}`)
}

export interface DeclarationConvertor<T> {
    convertInterface(node: idl.IDLInterface): T
    convertEnum(node: idl.IDLEnum): T
    convertTypedef(node: idl.IDLTypedef): T
    convertCallback(node: idl.IDLCallback): T
}

export function convertDeclaration<T>(convertor: DeclarationConvertor<T>, decl: idl.IDLEntry): T {
    if (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl))
        return convertor.convertInterface(decl)
    if (idl.isEnum(decl)) return convertor.convertEnum(decl)
    // if (ts.isEnumMember(decl)) return convertor.convertEnum(decl.parent)
    if (idl.isTypedef(decl)) return convertor.convertTypedef(decl)
    if (idl.isCallback(decl)) return convertor.convertCallback(decl)
    throw new Error(`Unknown declaration type ${decl.kind ? idl.IDLKind[decl.kind] : "(undefined kind)"}`)
}