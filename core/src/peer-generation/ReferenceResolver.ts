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

import * as idl from '../idl'
import { getPov, resolveNamedNode } from '../resolveNamedNode'
import { consoleWarn } from '../util'

export interface ReferenceResolver {
    resolveTypeReference(type: idl.IDLReferenceType, options?: { terminalImports?: boolean, unresolvedOk?: boolean }): idl.IDLEntry | undefined
    toDeclaration(type: idl.IDLNode): idl.IDLNode
}

export function createEmptyReferenceResolver(): ReferenceResolver {
    return {
        resolveTypeReference() {
            return undefined
        },
        toDeclaration(type) {
            return type
        }
    }
}

/** Please do not store any global instances */
export function createAlternativeReferenceResolver(mainResolver: ReferenceResolver, alternatives: Map<string, idl.IDLEntry>): ReferenceResolver {
    return {
        resolveTypeReference(type, options?: { terminalImports?: boolean, unresolvedOk?: boolean }) {
            return mainResolver.resolveTypeReference(type, options) ?? alternatives.get(type.name)
        },
        toDeclaration(type) {
            return mainResolver.toDeclaration(type)
        },
    }
}

export function createAlgotithmicReferenceResolver(files: idl.IDLFile[], useFallback: boolean = false): ReferenceResolver {
    const resolveFallback = (type: idl.IDLReferenceType): idl.IDLNode | undefined => {
        const target = type.name.split('.')
        const resolveds = new Set<idl.IDLNode>()
        for (let file of files) {
            const result = resolveNamedNode([...file.packageClause, ...target], undefined, files)
            if (result && idl.isEntry(result)) {
                // too much spam
                // console.warn(`WARNING: Type reference '${qualifiedName}' is not resolved from ${povAsReadableString} but resolved from some package '${file.packageClause().join(".")}'`)
                resolveds.add(result)
            }
        }

        // and from each namespace
        const traverseNamespaces = (entry: idl.IDLEntry) => {
            if (entry && idl.isNamespace(entry) && entry.members.length) {
                const resolved = resolveNamedNode([...idl.getNamespacesPathFor(entry).map(it => it.name), ...target], undefined, files)
                if (resolved) {
                    console.warn(`WARNING: Name '${type.name}' resolved by fallback from some namespace: '${idl.getNamespacesPathFor(resolved).map(obj => obj.name).join(".")}'`)
                    resolveds.add(resolved)
                }
                entry.members.forEach(traverseNamespaces)
            }
        }
        files.forEach(file => file.entries.forEach(traverseNamespaces))
        if (resolveds.size > 1)
            console.error(`Resolved multiple possible declarations by ${idl.DebugUtils.debugPrintType(type)}`)
        return resolveds.size ? resolveds.values().next().value : undefined
    }
    return {
        resolveTypeReference(type, options?: { terminalImports?: boolean, unresolvedOk?: boolean }) {
            let result: idl.IDLNode | undefined = resolveNamedNode(type.name.split("."), getPov(type), files) ?? (useFallback ? resolveFallback(type) : undefined)
            if (!options?.terminalImports) {
                const seen = new Set<idl.IDLNode>
                while (result) {
                    let nextResult: idl.IDLNode | undefined = undefined
                    if (idl.isImport(result))
                        nextResult = resolveNamedNode(result.clause, undefined, files)
    
                    if (!nextResult)
                        break;
    
                    if (seen.has(nextResult)) {
                        console.warn(`Cyclic referenceType: ${type.name}, seen: [${[...seen.values()].map(idl.getFQName).join(", ")}]`)
                        break;
                    }
                    seen.add(nextResult)
                    result = nextResult
                }
            }
            if (result) {
                if (!idl.isEntry(result)) {
                    throw new Error(`Resolved reference ${idl.DebugUtils.debugPrintType(type)} to not entry type`)
                }
                if (idl.isNamespace(result)) {
                    throw new Error(`Resolved reference ${idl.DebugUtils.debugPrintType(type)} to namespace`)
                }
                return result
            }
            return undefined
        },
        toDeclaration(type) {
            throw new Error("To declaration is not available for default references resolver")
        }
    }
}

export function createCachedReferenceResolver(files: idl.IDLFile[]): ReferenceResolver {
    const cache: Map<string, idl.IDLEntry> = new Map()
    for (const file of files) {
        idl.forEachChild(file, node => {
            if (idl.isEnum(node) || idl.isCallback(node) || idl.isInterface(node) || idl.isTypedef(node)) {
                const fqn = idl.getFQName(node)
                if (cache.has(fqn))
                    consoleWarn(`WARNING: multiple entries with FQN=${fqn} found`)
                else
                    cache.set(fqn, node)
            }
        })
    }
    return {
        resolveTypeReference(type, options?: { terminalImports?: boolean, unresolvedOk?: boolean }) {
            if (!options?.unresolvedOk && !cache.has(type.name))
                consoleWarn(`WARNING: reference ${idl.DebugUtils.debugPrintType(type)} was not found`)
            return cache.get(type.name)
        },
        toDeclaration(type) {
            throw new Error("Not implemented")
        },
    }
}