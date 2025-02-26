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

import { MaterializedClass, MaterializedMethod, Method, MethodModifier, NamedMethodSignature, PeerLibrary, PeerMethod } from "@idlizer/core";
import { createInterface, createMethod, getNamespacesPathFor, IDLInterface, IDLInterfaceSubkind, IDLMethod } from "@idlizer/core/idl";
import { groupOverloadsIDL } from "./printers/OverloadsPrinter";
import { createOutArgConvertor } from "./PromiseConvertors";

export const GlobalScopePeerName = 'GlobalScope'

export function mangledGlobalScopeName(method:IDLMethod) {
    const nsPath = getNamespacesPathFor(method)
    const nsPrefix = nsPath.length ? nsPath.map(it => it.name).join('_') + '_' : ''
    return nsPrefix + method.name
}

export function idlFreeMethodsGroupToLegacy(library: PeerLibrary, methods: IDLMethod[]): PeerMethod[] {
    const groupedMethods = groupOverloadsIDL(methods)
    return groupedMethods.filter(it => it.length).flatMap(methods => idlFreeMethodToLegacy(library, methods))
}

export function idlMethodToMaterializedMethod(library: PeerLibrary, method:IDLMethod): MaterializedMethod {
    const argConvertors = method.parameters.map(it => library.typeConvertor(it.name, it.type))
    return new MaterializedMethod(
        GlobalScopePeerName,
        GlobalScopePeerName,
        argConvertors,
        method.returnType,
        true,
        new Method(
            mangledGlobalScopeName(method),
            NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: it.type }))),
            [MethodModifier.STATIC]
        ),
        createOutArgConvertor(library, method.returnType, argConvertors.map(it => it.param)),
    )
}

export function idlFreeMethodToLegacy(library: PeerLibrary, methods: IDLMethod[]): MaterializedMethod[] {
    const peerMethods = methods.map(it => idlMethodToMaterializedMethod(library, it))
    PeerMethod.markAndGroupOverloads(peerMethods)
    return peerMethods
}

const _gbCache = new Map<PeerLibrary, IDLInterface>()
export function createSyntheticGlobalScope(library:PeerLibrary): IDLInterface {
    if (_gbCache.has(library)) {
        return _gbCache.get(library)!
    }
    const methods: IDLMethod[] = []
    library.globals.forEach(entry => {
        entry.methods.forEach(method => {
            methods.push(
                createMethod(
                    mangledGlobalScopeName(method),
                    method.parameters,
                    method.returnType,
                    {
                        isAsync: method.isAsync,
                        isFree: false,
                        isStatic: true,
                        isOptional: false
                    }
                )
            )
        })
    })

    const int = createInterface(
        GlobalScopePeerName,
        IDLInterfaceSubkind.Class,
        [],
        [],
        [],
        [],
        methods,
        [],
        []
    )
    _gbCache.set(library, int)
    return int
}

export function createGlobalScopeLegacy(library:PeerLibrary): MaterializedClass {
    const clazz = new MaterializedClass(
        createSyntheticGlobalScope(library),
        GlobalScopePeerName,
        false,
        undefined,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        library.globals.flatMap(it => idlFreeMethodToLegacy(library, it.methods)),
    )
    clazz.setGlobalScope()
    return clazz
}

export function isGlobalScope(int:IDLInterface) {
    return  int.name === GlobalScopePeerName
}
