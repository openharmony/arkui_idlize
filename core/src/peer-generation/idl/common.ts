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

import * as idl from "../../idl/index.js"
import { Language } from "../../Language.js"
import { IdlNameConvertor } from "../../LanguageWriters/index.js"

export function qualifiedName(decl: idl.IDLNode, languageOrDelimiter: Language|string, pattern: idl.QNPattern): string {
    if (!idl.isNamedNode(decl))
        throw new Error("internal error, name required for no-named node")
    const delimiter = typeof languageOrDelimiter === "string"
        ? languageOrDelimiter
        : ([Language.CPP, Language.CJ].includes(languageOrDelimiter) ? '_' : '.')
    if (!idl.isEntry(decl))
        throw new Error(`Expected to have an IDLEntry, got ${idl.IDLKind[decl.kind]}`)
    return idl.getQualifiedName(decl, pattern).split(".").join(delimiter)
}

export function collapseTypes(types: idl.IDLType[], name?: string): idl.IDLType {
    const seenNames = new Set<string>()
    const uniqueTypes = types.filter(it => {
        const typeName = idl.printType(it)
        if (seenNames.has(typeName)) return false
        seenNames.add(typeName)
        return true
    })
    return uniqueTypes.length === 1 ? uniqueTypes[0] : idl.createUnionType(uniqueTypes, name)
}

export function generifiedTypeName(refType: idl.IDLReferenceType, nameConvertor: IdlNameConvertor, refName?: string): string {
    const typeArgs = refType.typeArguments?.map(it => nameConvertor.convert(it)).join(",")
    return `${refName ? refName : refType.name}${typeArgs ? `<${typeArgs}>` : ``}`
}

export function sanitizeGenerics(genericDeclarationString:string): string {
    const eqIdx = genericDeclarationString.indexOf('=')
    if (eqIdx !== -1) {
        genericDeclarationString = genericDeclarationString.substring(0, eqIdx)
    }
    const extendsIdx = genericDeclarationString.indexOf('extends')
    if (extendsIdx !== -1) {
        genericDeclarationString = genericDeclarationString.substring(0, extendsIdx)
    }
    return genericDeclarationString.trim()
}

export function generateSyntheticFunctionParameterName(parameter:idl.IDLParameter): string {
    if (parameter.isOptional) {
        return idl.generateSyntheticIdlNodeName(idl.createOptionalType(parameter.type))
    }
    return idl.generateSyntheticIdlNodeName(parameter.type)
}

export function generateSyntheticFunctionName(parameters: idl.IDLParameter[], returnType: idl.IDLType, options?: { isAsync?: boolean, nameConvertor?: IdlNameConvertor }): string {
    let prefix = options?.isAsync ? "AsyncCallback" : "Callback"
    const names = options?.nameConvertor !== undefined
        ? parameters.map(it => options.nameConvertor!.convert(it.type)).concat(options.nameConvertor!.convert(returnType))
        : parameters.map(generateSyntheticFunctionParameterName).concat(idl.generateSyntheticIdlNodeName(returnType))
    return `${prefix}_${names.join("_").replaceAll(".", "_")}`
}

export function isImportAttr(decl: idl.IDLNode): boolean {
    return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)
}
