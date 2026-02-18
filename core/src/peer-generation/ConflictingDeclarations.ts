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
import { generatorConfiguration } from "../config";
import * as idl from "../idl"
import { Language } from "../Language";
import { LibraryInterface } from "../LibraryInterface";

const findTopLevelConflicts_cache = new Map<LibraryInterface, Map<Language, string[]>>()
export function findTopLevelConflicts(library: LibraryInterface, language: Language): string[] {
    if (!findTopLevelConflicts_cache.has(library))
        findTopLevelConflicts_cache.set(library, new Map)
    const libraryCache = findTopLevelConflicts_cache.get(library)!
    if (!libraryCache.has(language))
        libraryCache.set(language, findTopLevelConflictsUncached(library, language))
    return libraryCache.get(language)!
}

function findTopLevelConflictsUncached(library: LibraryInterface, language: Language): string[] {
    const foundNames = new Set<string>()
    const conflictingNames = new Set<string>()
    const ignoreTypedefs = language === Language.CPP
    for (const file of library.files) {
        for (const entry of file.entries) {
            if (idl.isSyntheticEntry(entry))
                continue
            if (ignoreTypedefs && idl.isTypedef(entry))
                // for redefinitions like `typedef _Resource Resource;` - in CPP than anyway will be expanded to Resource declaration
                continue
            if (idl.isCallback(entry) || idl.isInterface(entry) || idl.isTypedef(entry) || idl.isEnum(entry)) {
                if (foundNames.has(entry.name)) {
                    conflictingNames.add(entry.name)
                } else {
                    foundNames.add(entry.name)
                }
            }
        }
    }
    return Array.from(conflictingNames)
}

export function isTopLevelConflicted(library: LibraryInterface, language: Language, node: idl.IDLEntry): boolean {
    const topLevelConflicts = findTopLevelConflicts(library, language)
    while (node.parent && idl.isNamespace(node.parent)) {
        node = node.parent
    }
    return node.parent !== undefined
        && idl.isFile(node.parent) && idl.isEntry(node) && topLevelConflicts.includes(node.name)
}
