import * as idl from "@idlize/core/idl"
import { generatorConfiguration, Language } from "@idlize/core"
import { LibraryInterface } from "@idlize/core";
import { ArkPrimitiveType } from "./ArkPrimitiveType";
import { isComponentDeclaration } from "./ComponentsCollector";
import { DependencySorter } from "./idl/DependencySorter";
import { isMaterialized } from "./idl/IdlPeerGeneratorVisitor";
import { createTypeNameConvertor } from "./LanguageWriters";
import { IdlNameConvertor } from "@idlize/core";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { cleanPrefix } from "./PeerLibrary";
import { collectUniqueCallbacks } from "./printers/CallbacksPrinter";

const collectDeclarationTargets_cache = new Map<LibraryInterface, idl.IDLNode[]>()
export function collectDeclarationTargets(library: LibraryInterface): idl.IDLNode[] {
    if (collectDeclarationTargets_cache.has(library))
        return collectDeclarationTargets_cache.get(library)!

    const callbacks = collectUniqueCallbacks(library, { transformCallbacks: true })

    let orderer = new DependencySorter(library)
    for (const file of library.files) {
        for (const entry of file.entries) {
            if (PeerGeneratorConfig.ignoreEntry(entry.name, library.language) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.TSType) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.CPPType ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.HandWrittenImplementation)
                ))
                continue
            if (idl.isInterface(entry)) {
                if (isComponentDeclaration(library, entry) ||
                    isMaterialized(entry, library)) {
                    for (const property of entry.properties) {
                        if (PeerGeneratorConfig.ignorePeerMethod.includes(property.name))
                            continue
                        orderer.addDep(library.toDeclaration(property.type))
                    }
                    for (const method of entry.methods) {
                        if (PeerGeneratorConfig.ignorePeerMethod.includes(method.name))
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
        const nativeNameConvertorInstance: IdlNameConvertor = createTypeNameConvertor(Language.CPP, library)
        const data: Array<[string, {id: number, name: string}[]]> =
            allTypes(library, idl.isUnionType)
                .map(it => [
                    nativeNameConvertorInstance.convert(it),
                    it.types.map((e, index) => { return {id: index, name: "value" + index }})])
        return new Map(data)
    }

    export function allLiteralTypes(library: LibraryInterface): Map<string, string[]> {
        const nativeNameConvertorInstance: IdlNameConvertor = createTypeNameConvertor(Language.CPP, library)
        const data: Array<[string, string[]]> =
            allEntries(library, (it): it is idl.IDLInterface => idl.isInterface(it) && it.subkind === idl.IDLInterfaceSubkind.AnonymousInterface)
                .map(it => [
                    nativeNameConvertorInstance.convert(it),
                    it.properties.map(p => p.name)])
        return new Map(data)
    }

    export function allOptionalTypes(library: LibraryInterface): Set<string> {
        const nativeNameConvertorInstance: IdlNameConvertor = createTypeNameConvertor(Language.CPP, library)
        const data = collectDeclarationTargets(library)
            .filter(it => it !== idl.IDLVoidType)
            .map(it => idl.isType(it)
                ? nativeNameConvertorInstance.convert(idl.createOptionalType(it))
                : generatorConfiguration().param("OptionalPrefix") + cleanPrefix(nativeNameConvertorInstance.convert(it), generatorConfiguration().param("TypePrefix"))
            )
        return new Set(data)
    }
}