/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Language, NativeModuleType, PeerLibrary } from "@idlizer/core";
import { forEachChild, getFileFor, getFQName, IDLEntry, IDLFile, isNamespace, isReferenceType, linearizeNamespaceMembers } from "@idlizer/core/idl";

export function solve(library:IDLFile[], targets:string[]) {
    const resolver = new PeerLibrary(Language.ARKTS, new NativeModuleType("___"), false)
    resolver.files.push(...library)

    const roots = findRootFiles(library, targets)
    const marked = new Set<string>()
    const fileNames = new Set<string>()

    const queue: IDLEntry[] = [...roots.flatMap(file => file.entries)]
    while (queue.length) {
        const entry = queue.shift()!
        const entryFQ = getFQName(entry)
        if (marked.has(entryFQ)) {
            continue
        }
        marked.add(entryFQ)
        fileNames.add(getFileFor(entry)?.fileName ?? '<...>')
        forEachChild(entry, (node) => {
            if (isReferenceType(node)) {
                const resolved = resolver.resolveTypeReference(node)
                if (resolved) {
                    queue.push(resolved)
                } else {
                    console.error('DEAD REFERENCE', getFQName(node))
                }
            }
        })
    }

    const index = new Map<string, IDLFile>()
    library.forEach(file => {
        index.set(file.fileName ?? '<WHAT?>', file)
    })

    const result: any = {}
    result.module = []
    result.external = []

    for (const fileName of fileNames) {
        const packageName = index.get(fileName)?.packageClause.join('.')
        const record = {
            fileName,
            packageName,
        }
        if (targets.some(t => packageName?.startsWith(t))) {
            result.module.push(record)
        } else {
            result.external.push(record)
        }
    }
    console.log(JSON.stringify(result, null, 4))
}

function findRootFiles(library:IDLFile[], targets:string[]) {
    return library.filter(file => targets.some(target => file.packageClause.join('.').startsWith(target)))
}