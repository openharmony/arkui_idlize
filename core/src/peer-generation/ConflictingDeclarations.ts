import { generatorConfiguration } from "../config.js";
import * as idl from "../idl/index.js"
import { Language } from "../Language.js";
import { LibraryInterface } from "../LibraryInterface.js";

const findTopLevelConflicts_cache = new Map<LibraryInterface, Map<Language, string[]>>()
function findTopLevelConflicts(library: LibraryInterface, language: Language): string[] {
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
