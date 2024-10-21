import * as idl from "../../idl"
import { generateSyntheticFunctionName, NameSuggestion, selectName } from "../../IDLVisitor";
import { PrimitiveType } from "../ArkPrimitiveType";
import { cleanPrefix, IdlPeerLibrary } from "../idl/IdlPeerLibrary";


function collectEntryCallbacks(library: IdlPeerLibrary, entry: idl.IDLEntry): idl.IDLCallback[] {
    let res: idl.IDLCallback[] = []
    if (idl.isCallback(entry)) {
        res.push(entry)
    }
    if ([idl.IDLKind.Interface, idl.IDLKind.AnonymousInterface].includes(entry.kind!)) {
        const decl = entry as idl.IDLInterface
        decl.methods.forEach(method => {
            const syntheticName = generateSyntheticFunctionName(
                (type) => cleanPrefix(library.getTypeName(type), PrimitiveType.Prefix), 
                method.parameters, method.returnType)
            const selectedName = decl.kind === idl.IDLKind.AnonymousInterface
                ? syntheticName
                : selectName(NameSuggestion.make(`Type_${decl.name}_${method.name}`), syntheticName)
            res.push(idl.createCallback(
                selectedName,
                method.parameters,
                method.returnType,
            ))
        })
    }
    if (entry.scope)
        res.push(...entry.scope.flatMap(it => collectEntryCallbacks(library, it)))
    return res
}

export function collectUniqueCallbacks(library: IdlPeerLibrary) {
    const foundCallbacksNames = new Set<string>()
    const foundCallbacks: idl.IDLCallback[] = []
    for (const file of library.files) {
        for (const decl of file.entries) {
            for (const callback of collectEntryCallbacks(library, decl)) {
                if (foundCallbacksNames.has(callback.name))
                    continue
                foundCallbacksNames.add(callback.name)
                foundCallbacks.push(callback)
            }
        }
    }
    foundCallbacks.push(...library.continuationCallbacks)
    return foundCallbacks.sort((a, b) => a.name.localeCompare(b.name))
}