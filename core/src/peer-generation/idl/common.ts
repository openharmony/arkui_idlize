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
import { capitalize } from "../../util"

export function generateSyntheticIdlNodeName(type: idl.IDLType): string {
    if (idl.isPrimitiveType(type)) return capitalize(type.name)
    if (idl.isContainerType(type)) {
        const typeArgs = type.elementType.map(it => generateSyntheticIdlNodeName(it)).join("_").replaceAll(".", "_")
        switch (type.containerKind) {
            case "sequence": return "Array_" + typeArgs
            case "record": return "Map_" + typeArgs
            case "Promise": return "Promise_" + typeArgs
            default: throw new Error(`Unknown container type ${idl.DebugUtils.debugPrintType(type)}`)
        }
    }
    if (idl.isNamedNode(type))
        return type.name.split('.').map(capitalize).join('_')
    if (idl.isOptionalType(type))
        return `Opt_${generateSyntheticIdlNodeName(type.type)}`
    throw `Can not compute type name of ${idl.IDLKind[type.kind]}`
}

export function qualifiedName(decl: idl.IDLNode, languageOrDelimiter: Language|string, pattern: idl.QNPattern): string {
    if (!idl.isNamedNode(decl))
        throw new Error("internal error, name required for no-named node")
    const delimiter = typeof languageOrDelimiter === "string"
        ? languageOrDelimiter
        : ([Language.CPP, Language.CJ, Language.KOTLIN].includes(languageOrDelimiter) ? '_' : '.')
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

export function generifiedTypeName(refType: idl.IDLReferenceType | undefined, refName?: string): string | undefined {
    if (!refType) return undefined
    const typeArgs = refType.typeArguments?.map(it => idl.printType(it) /* FIXME: BUG! */).join(",")
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

export function generateSyntheticUnionName(types: idl.IDLType[]) {
    return `Union_${types.map(it => generateSyntheticIdlNodeName(it)).join("_").replaceAll(".", "_")}`
}

export function generateSyntheticFunctionParameterName(parameter:idl.IDLParameter): string {
    if (parameter.isOptional) {
        return generateSyntheticIdlNodeName(idl.createOptionalType(parameter.type))
    }
    return generateSyntheticIdlNodeName(parameter.type)
}

export function generateSyntheticFunctionName(parameters: idl.IDLParameter[], returnType: idl.IDLType, isAsync: boolean = false): string {
    let prefix = isAsync ? "AsyncCallback" : "Callback"
    const names = parameters.map(generateSyntheticFunctionParameterName).concat(generateSyntheticIdlNodeName(returnType))
    return `${prefix}_${names.join("_").replaceAll(".", "_")}`
}

export function isImportAttr(decl: idl.IDLNode): boolean {
    return idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)
}
