import * as idl from "@idlizer/core/idl"
import { generatorConfiguration, Language, LibraryInterface, isMaterialized, cleanPrefix } from "@idlizer/core";
import { isComponentDeclaration } from "./ComponentsCollector";
import { DependencySorter } from "./idl/DependencySorter";
import { isPredefined } from "./idl/IdlPeerGeneratorVisitor";
import { IdlNameConvertor } from "@idlizer/core";
import { peerGeneratorConfiguration } from "./PeerGeneratorConfig";
import { collectUniqueCallbacks } from "./printers/CallbacksPrinter";

const collectDeclarationTargets_cache = new Map<LibraryInterface, idl.IDLNode[]>()
export function collectDeclarationTargets(library: LibraryInterface): idl.IDLNode[] {

    const generateUnused = peerGeneratorConfiguration().GenerateUnused

    if (collectDeclarationTargets_cache.has(library))
        return collectDeclarationTargets_cache.get(library)!

    const callbacks = collectUniqueCallbacks(library, { transformCallbacks: true })

    let orderer = new DependencySorter(library)
    for (const file of library.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (peerGeneratorConfiguration().ignoreEntry(entry.name, library.language) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.TSType) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.CPPType ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.HandWrittenImplementation)
                ))
                continue
            if (idl.isInterface(entry)) {
                if (isComponentDeclaration(library, entry) ||
                    isMaterialized(entry, library)) {
                    if (isMaterialized(entry, library))
                        orderer.addDep(entry)
                    for (const property of entry.properties) {
                        if (peerGeneratorConfiguration().ignorePeerMethod.includes(property.name))
                            continue
                        orderer.addDep(library.toDeclaration(property.type))
                    }
                    for (const method of entry.methods) {
                        if (peerGeneratorConfiguration().ignorePeerMethod.includes(method.name))
                            continue
                        for (const parameter of method.parameters)
                            orderer.addDep(parameter.type!)
                    }
                    for (const constructor of entry.constructors) {
                        for (const parameter of constructor.parameters)
                            orderer.addDep(library.toDeclaration(parameter.type!))
                    }
                    for (const callable of entry.callables) {
                        for (const parameter of callable.parameters)
                            orderer.addDep(library.toDeclaration(parameter.type!))
                    }
                } else if (generateUnused && !isPredefined(entry)) {
                    orderer.addDep(library.toDeclaration(entry))
                    for (const property of entry.properties) {
                        if (peerGeneratorConfiguration().ignorePeerMethod.includes(property.name))
                            continue
                        orderer.addDep(library.toDeclaration(property.type))
                    }
                }
            }
            else if (idl.isEnum(entry)) {
                orderer.addDep(library.toDeclaration(entry))
            }
        }
    }
    for (const callback of callbacks) orderer.addDep(callback)
    const orderedDependencies = orderer.getToposorted()
    orderedDependencies.unshift(idl.IDLI32Type)
    collectDeclarationTargets_cache.set(library, orderedDependencies)
    return orderedDependencies
}

export namespace DeclarationTargets {
    function allTypes<T extends idl.IDLType>(library: LibraryInterface, predicate: (e: idl.IDLNode) => e is T): T[] {
        return collectDeclarationTargets(library).filter(predicate)
    }

    function allEntries<T extends idl.IDLEntry>(library: LibraryInterface, predicate: (e: idl.IDLNode) => e is T): T[] {
        return collectDeclarationTargets(library).filter(predicate)
    }

    export function allUnionTypes(library: LibraryInterface): Map<string, {id: number, name: string}[]> {
        const nativeNameConvertorInstance: IdlNameConvertor = library.createTypeNameConvertor(Language.CPP)
        const data: Array<[string, {id: number, name: string}[]]> =
            allTypes(library, idl.isUnionType)
                .map(it => [
                    nativeNameConvertorInstance.convert(it),
                    it.types.map((e, index) => { return {id: index, name: "value" + index }})])
        return new Map(data)
    }

    export function allLiteralTypes(library: LibraryInterface): Map<string, string[]> {
        const nativeNameConvertorInstance: IdlNameConvertor = library.createTypeNameConvertor(Language.CPP)
        const data: Array<[string, string[]]> =
            allEntries(library, (it): it is idl.IDLInterface => idl.isInterface(it) && it.subkind === idl.IDLInterfaceSubkind.AnonymousInterface)
                .map(it => [
                    nativeNameConvertorInstance.convert(it),
                    it.properties.map(p => p.name)])
        return new Map(data)
    }

    export function allOptionalTypes(library: LibraryInterface): Set<string> {
        const nativeNameConvertorInstance: IdlNameConvertor = library.createTypeNameConvertor(Language.CPP)
        const data = collectDeclarationTargets(library)
            .filter(it => it !== idl.IDLVoidType)
            .map(it => idl.isType(it)
                ? nativeNameConvertorInstance.convert(idl.createOptionalType(it))
                : generatorConfiguration().OptionalPrefix + cleanPrefix(nativeNameConvertorInstance.convert(it), generatorConfiguration().TypePrefix)
            )
        return new Set(data)
    }
}