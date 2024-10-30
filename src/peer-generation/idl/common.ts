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

import * as idl from "../../idl"
import { Language } from "../../Language"
import { PrimitiveType } from "../ArkPrimitiveType"
import { convertDeclaration, convertType, DeclarationConvertor, TypeConvertor } from "../LanguageWriters/typeConvertor"

export function isDeclaration(node: idl.IDLEntry): boolean {
    return idl.isClass(node) || idl.isInterface(node) || idl.isAnonymousInterface(node) || idl.isTupleInterface(node)
        || idl.isEnum(node) || idl.isEnumMember(node) || idl.isCallback(node) || idl.isTypedef(node)
}

export function convert<T>(node: idl.IDLEntry, typeConvertor: TypeConvertor<T>, declConvertor: DeclarationConvertor<T>): T {
    return isDeclaration(node)
        ? convertDeclaration(declConvertor, node)
        : convertType(typeConvertor, node as idl.IDLType)
}

export function isImport(decl: idl.IDLEntry): boolean {
    return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)
}

export function isStringEnum(decl: idl.IDLEnum): boolean {
    return decl.elements.some(e => e.type === idl.IDLStringType)
}

export function qualifiedName(decl: idl.IDLEntry, language: Language): string {
    const namespace = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace)
    const prefix = namespace
        ? namespace + (language === Language.CPP ? '_' : '.')
        : ""
    return prefix + decl.name
}

export function typeOrUnion(types: idl.IDLType[], name?: string): idl.IDLType {
    return types.length === 1 ? types[0] : idl.createUnionType(types, name)
}
