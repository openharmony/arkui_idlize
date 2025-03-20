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

import { IDLFile, IDLNode, IDLNamedNode, IDLImport, isReferenceType, hasExtAttribute, IDLExtendedAttributes, getFileFor } from "./idl"
import { isFile, isNamedNode, isNamespace, isEnum, isInterface, isImport } from "./idl"

export function resolveNamedNode(target: string[], pov: IDLNode|undefined, corpus: IDLFile[]): IDLNamedNode | undefined {
    let result: IDLNamedNode | undefined
    let povScope: string[] = []
    while (pov) {
        if (isFile(pov)) {
            if (result = resolveDownFromFile(target, pov))
                return result
            const importUsings = pov.entries.filter(it => isImport(it) && !it.name).map(it => it as IDLImport)
            for (const importUsing of importUsings)
                if (result = resolveDownFromRoot([...importUsing.clause, ...target], corpus))
                    return result
            povScope = pov.packageClause.slice()
            break
        } else {
            if (result = resolveDownFromNode(target, pov, false))
                return result
        }
        pov = pov.parent
    }

    for(;;) {
        if (result = resolveDownFromRoot([...povScope, ...target], corpus))
            return result
        if (povScope.length)
            povScope.pop()
        else
            break;
    }

    return undefined
}

function resolveDownFromNode(target: string[], pov: IDLNode, withSelf: boolean): IDLNamedNode | undefined {
    if (withSelf && isNamedNode(pov)) {
        if (isReferenceType(pov) || !pov.name.length)
            return undefined

        let nameMatched = target[0] === pov.name
        if (!nameMatched)
            nameMatched = target[0] === "default" && hasExtAttribute(pov, IDLExtendedAttributes.DefaultExport)
        if (!nameMatched)
            return undefined

        target = target.slice(1)
        if (!target.length)
            return pov
    }

    let candidates: IDLNamedNode[]
    if (isNamespace(pov))
        candidates = pov.members
    else if (isEnum(pov))
        candidates = pov.elements
    else if (isInterface(pov))
        candidates = pov.constants
    else
        return undefined

    let result: IDLNamedNode | undefined
    for (const candidate of candidates) {
        if (result = resolveDownFromNode(target, candidate, true))
            return result
    }

    return undefined
}

function resolveDownFromFile(target: string[], pov: IDLFile): IDLNamedNode | undefined {
    let result: IDLNamedNode | undefined
    for (const candidate of pov.entries) {
        if (result = resolveDownFromNode(target, candidate, true))
            return result
    }

    return undefined
}

function resolveDownFromRoot(target: string[], corpus: IDLFile[]): IDLNamedNode | undefined {
    let result: IDLNamedNode | undefined
    for (const file of corpus) {
        if (file.packageClause.length >= target.length)
            continue

        let match = true
        for(let index = 0; index < file.packageClause.length; ++index)
            if (file.packageClause[index] !== target[index]) {
                match = false
                break
            }
        if (!match)
            continue

        if (result = resolveDownFromFile(target.slice(file.packageClause.length), file))
            return result
    }

    return undefined
}
