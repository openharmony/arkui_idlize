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

export function isImport(decl: idl.IDLNode): boolean {
    return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)
}

export function isStringEnum(decl: idl.IDLEnum): boolean {
    return decl.elements.some(e => e.type === idl.IDLStringType)
}

export function qualifiedName(decl: idl.IDLNode, language: Language): string {
    const namespace = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace)
    const prefix = namespace
        ? namespace + (language === Language.CPP ? '_' : '.')
        : ""
    return prefix + idl.forceAsNamedNode(decl).name
}

export function typeOrUnion(types: idl.IDLType[], name?: string): idl.IDLType {
    const seenNames = new Set<string>()
    const uniqueTypes = types.filter(it => {
        const typeName = idl.printType(it)
        if (seenNames.has(typeName)) return false
        seenNames.add(typeName)
        return true
    })
    return uniqueTypes.length === 1 ? uniqueTypes[0] : idl.createUnionType(uniqueTypes, name)
}

export function generifiedTypeName(refType: idl.IDLReferenceType | undefined): string | undefined {
    if (!refType) return undefined
    const typeArgs = refType.typeArguments?.map(it => idl.printType(it)).join(",")
    return `${refType.name}${typeArgs ? `<${typeArgs}>` : ``}`
}