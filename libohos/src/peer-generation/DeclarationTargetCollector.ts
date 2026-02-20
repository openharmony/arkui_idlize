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
import * as idl from "@idlizer/core/idl"
import { generatorConfiguration, Language, LibraryInterface, isMaterialized, cleanPrefix, isInIdlize, isStaticMaterialized, isInCurrentModule, maybeTransformManagedCallback, getSuper, maybeRestoreGenerics } from "@idlizer/core";
import { isComponentDeclaration } from "./ComponentsCollector.js";
import { UnionFlatteningMode, DependencySorter } from "./idl/DependencySorter.js";
import { IdlNameConvertor } from "@idlizer/core";
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js";

const collectDeclarationTargets_cache = new Map<LibraryInterface, idl.IDLNode[]>()
const collectDeclarationTargets_cache_flatten = new Map<LibraryInterface, idl.IDLNode[]>()
const collectDeclarationTargets_cache_both = new Map<LibraryInterface, idl.IDLNode[]>()
export function collectDeclarationTargets(library: LibraryInterface, unionFlatteningMode: UnionFlatteningMode = false): idl.IDLNode[] {
    const cache = (unionFlatteningMode==="both" ? collectDeclarationTargets_cache_both : (unionFlatteningMode ? collectDeclarationTargets_cache_flatten : collectDeclarationTargets_cache))
    if (!cache.has(library))
        cache.set(library, collectDeclarationTargetsUncached(library, { synthesizeCallbacks: true, unionFlatteningMode}))
    return cache.get(library)!
}

export function collectDeclarationTargetsUncached(library: LibraryInterface, options: { synthesizeCallbacks: boolean, unionFlatteningMode: UnionFlatteningMode }): idl.IDLNode[] {
    const generateUnused = peerGeneratorConfiguration().GenerateUnused

    let orderer = new DependencySorter(library, options.unionFlatteningMode)
    for (const file of library.files) {
        if (!file.entries.length || !isInCurrentModule(file.entries[0]/*TODO just IDLFile*/))
            continue
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (peerGeneratorConfiguration().ignoreEntry(entry.name, library.language) ||
                isInIdlize(entry) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.HandWrittenImplementation) ||
                idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.TransformOnSerialize)
                )
                continue
            if (idl.isInterface(entry)) {
                if (isComponentDeclaration(library, entry) || isMaterialized(entry, library)) {
                    if (isMaterialized(entry, library) && !isStaticMaterialized(entry, library))
                        orderer.addDep(entry)
                    for (const property of entry.properties) {
                        if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(property.name))
                            continue
                        orderer.addDep(library.toDeclaration(idl.maybeOptional(property.type, property.isOptional)))
                    }
                    for (const method of entry.methods) {
                        if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(method.name))
                            continue
                        for (const parameter of method.parameters)
                            orderer.addDep(library.toDeclaration(idl.maybeOptional(parameter.type!, parameter.isOptional)))
                        orderer.addDep(library.toDeclaration(method.returnType))
                    }
                    for (const constructor of entry.constructors) {
                        for (const parameter of constructor.parameters)
                            orderer.addDep(library.toDeclaration(idl.maybeOptional(parameter.type!, parameter.isOptional)))
                    }
                    for (const callable of entry.callables) {
                        for (const parameter of callable.parameters)
                            orderer.addDep(library.toDeclaration(idl.maybeOptional(parameter.type!, parameter.isOptional)))
                    }
                } else if (generateUnused && !isInIdlize(entry) && !idl.hasTypeParameters(entry)) {
                    // TODO seems like we do not need this in CAPI, just useful for managed side
                    orderer.addDep(library.toDeclaration(entry))
                    for (const property of entry.properties) {
                        if (peerGeneratorConfiguration().components.ignorePeerMethod.includes(property.name))
                            continue
                        orderer.addDep(library.toDeclaration(idl.maybeOptional(property.type, property.isOptional)))
                    }
                }
            }
            else if (idl.isEnum(entry)) {
                orderer.addDep(library.toDeclaration(entry))
            } else if (idl.isMethod(entry) && !idl.hasTypeParameters(entry)) {
                for (const parameter of entry.parameters)
                    orderer.addDep(library.toDeclaration(idl.maybeOptional(parameter.type!, parameter.isOptional)))
                orderer.addDep(library.toDeclaration(entry.returnType))
            } else if (idl.isConstant(entry)) {
                orderer.addDep(library.toDeclaration(entry.type))
            }
        }
    }
    if (options.synthesizeCallbacks) {
        synthesizeCallbacks(library, orderer)
    }
    let orderedDependencies = orderer.getToposorted()
    orderedDependencies.unshift(idl.createPrimitiveType('i32'))
    return orderedDependencies
}

function synthesizeCallbacks(library: LibraryInterface, orderer: DependencySorter): void {
    const nameConvertor = library.createTypeNameConvertor(Language.CPP)
    const foundCallbacksNames = new Set<string>()
    const foundCallbacks: idl.IDLCallback[] = []
    const addCallback = (callback: idl.IDLCallback) => {
        callback = maybeTransformManagedCallback(callback, library) ?? callback
        const name = nameConvertor.convert(callback)
        if (foundCallbacksNames.has(name))
            return
        foundCallbacksNames.add(name)
        foundCallbacks.push(callback)
    }
    for (const decl of orderer.getToposorted()) {
        if (idl.isCallback(decl)) {
            addCallback(decl)
        }
    }
    for (const file of library.files) {
        for (const entry of file.entries) {
            if (isInCurrentModule(entry))
                idl.forEachFunction(entry, function_ => {
                    const promise = idl.asPromise(function_.returnType)
                    if (promise) {
                        const reference = library.createContinuationCallbackReference(promise)
                        const callback = library.resolveTypeReference(reference)
                        if (callback)
                            addCallback(callback as idl.IDLCallback)
                    }
                })
        }
    }
    for (const foundCallback of [...foundCallbacks]) {
        const continuationRef = library.createContinuationCallbackReference(foundCallback.returnType)
        const continuation = library.resolveTypeReference(continuationRef)
        if (continuation && idl.isCallback(continuation))
            addCallback(continuation)
    }
    foundCallbacks
        .sort((a, b) => nameConvertor.convert(a).localeCompare(nameConvertor.convert(b)))
        .filter(callback => {
            const subtypes = callback.parameters.map(it => it.type!).concat(callback.returnType)
                .flatMap(it => {
                    if (idl.isContainerType(it))
                        return it.elementType
                    if (idl.isUnionType(it))
                        return it.types
                    if (idl.isOptionalType(it))
                        return it.type
                    return it
                })
            // handwritten types are not serializable
            if (subtypes.some(it => idl.isNamedNode(it) && peerGeneratorConfiguration().isHandWritten(it.name)))
                return false
            // can not process callbacks with type arguments used inside
            // (value: SomeInterface<T>) => void
            if (subtypes.some(it => idl.isReferenceType(it) && it.typeArguments))
                return false
            // (value: IgnoredInterface) => void
            if (subtypes.some(it => idl.isNamedNode(it) && peerGeneratorConfiguration().ignoreEntry(it.name, library.language)))
                return false
            if (subtypes.some(it => idl.isNamedNode(it) && it.name === "this"))
                return false
            return true
        })
        .forEach(it => orderer.addDep(it))
}

export namespace DeclarationTargets {
    function allTypes<T extends idl.IDLType>(library: LibraryInterface, predicate: (e: idl.IDLNode) => e is T, unionFlatteningMode: UnionFlatteningMode = false): T[] {
        return collectDeclarationTargets(library, unionFlatteningMode).filter(predicate)
    }

    function allEntries<T extends idl.IDLEntry>(library: LibraryInterface, predicate: (e: idl.IDLNode) => e is T, unionFlatteningMode: UnionFlatteningMode = false): T[] {
        return collectDeclarationTargets(library, unionFlatteningMode).filter(predicate)
    }

    export function allUnionTypes(library: LibraryInterface, unionFlatteningMode: UnionFlatteningMode = false): Map<string, {id: number, name: string}[]> {
        const nativeNameConvertorInstance: IdlNameConvertor = library.createTypeNameConvertor(Language.CPP)
        const data: Array<[string, {id: number, name: string}[]]> =
            allTypes(library, idl.isUnionType, unionFlatteningMode)
                .map(it => [
                    nativeNameConvertorInstance.convert(it),
                    it.types.map((e, index) => { return {id: index, name: "value" + index }})])
        return new Map(data)
    }

    export function allLiteralTypes(library: LibraryInterface, unionFlatteningMode: UnionFlatteningMode = false): Map<string, string[]> {
        const nativeNameConvertorInstance: IdlNameConvertor = library.createTypeNameConvertor(Language.CPP)
        const data: Array<[string, string[]]> =
            allEntries(library, (it): it is idl.IDLInterface => idl.isInterface(it) && it.subkind === idl.IDLInterfaceSubkind.AnonymousInterface, unionFlatteningMode)
                .map(it => [
                    nativeNameConvertorInstance.convert(it),
                    it.properties.map(p => p.name)])
        return new Map(data)
    }

    export function allOptionalTypes(library: LibraryInterface, unionFlatteningMode: UnionFlatteningMode = false): Set<string> {
        const nativeNameConvertorInstance: IdlNameConvertor = library.createTypeNameConvertor(Language.CPP)
        const data = collectDeclarationTargets(library, unionFlatteningMode)
            .filter(it => !idl.isPrimitiveType(it, 'void'))
            .filter(it => {
                if (idl.isOptionalType(it)) it = it.type
                if (idl.isReferenceType(it)) {
                    it = library.resolveTypeReference(it)!
                }
                if (idl.isNamedNode(it) && peerGeneratorConfiguration().isResource(it.name)) return false
                if (idl.isInterface(it) && peerGeneratorConfiguration().serializer.ignore.includes(it.name)) return false
                return true
            })
            .map(it => idl.isType(it)
                ? nativeNameConvertorInstance.convert(idl.createOptionalType(it))
                : generatorConfiguration().OptionalPrefix + cleanPrefix(nativeNameConvertorInstance.convert(it), generatorConfiguration().TypePrefix)
            )
        return new Set(data)
    }
}
