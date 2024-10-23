import * as idl from "../../idl"
import { generateSyntheticFunctionName, NameSuggestion, selectName } from "../../IDLVisitor";
import { PrimitiveType } from "../ArkPrimitiveType";
import { cleanPrefix, IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { LanguageWriter } from "../LanguageWriters";
import { EnumEntity, EnumMember } from "../PeerFile";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";

export const CallbackKind = "CallbackKind"

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
    for (const callback of library.continuationCallbacks) {
        if (foundCallbacksNames.has(callback.name))
            continue
        foundCallbacksNames.add(callback.name)
        foundCallbacks.push(callback)
    }
    return foundCallbacks
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(it => !PeerGeneratorConfig.ignoredCallbacks.has(it.name))
}

export function printCallbacksKinds(library: IdlPeerLibrary, writer: LanguageWriter): void {
    writer.print("import { KInt } from '@koalaui/interop'")
    writer.print("\n")

    writer.writeStatement(writer.makeEnumEntity(new EnumEntity(
        CallbackKind,
        "",
        collectUniqueCallbacks(library).map((it, index) => {
            return new EnumMember(it.name, "", index.toString())
        })
    ), true))
}