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

import * as idl from "@idlizer/core/idl"
import { ImportsCollector, isInExternalModule, Language, linearizeNamespaceMembers, PeerLibrary } from "@idlizer/core"
import {
    LWDeclaration,
    OutputFile,
    isManaged,
    processNPrintArkTS,
    processNPrintCXX,
    processNPrintTS,
    mapFileName,
    TargetFile,
    readLangTemplate,
    peerGeneratorConfiguration,
    readTemplate,
    libraryDeclaration,
    C_API_PREFIX,
    BRIDGE_PREFIX,
    IMPL_PREFIX,
    readInteropTypesHeader,
    OhosSeed,
    registerDefaultProducers,
    MakeSelector,
    moduleLike as libohosModuleLike,
    lowLevelLike,
    OhosEffect,
    createOhosEffect,
    managedName,
    MANAGED_PREFIX,
} from "@idlizer/libohos"
import { continueWith, moduleLike, onlyFor } from '@idlizer/kit'
import { ArkUIRole, registerArkUIProducers } from "./arkui/index.js"

type Feature = {
    name: string
    init: () => MakeSelector
    seeds: (files: idl.IDLFile[]) => OhosSeed<idl.IDLNode>[]
    importHook?: moduleLike.OnUnknownImport
}

const OSTFeature: Feature = {
    name: 'ost',
    init: () => {
        const selector = new MakeSelector()
        registerDefaultProducers(selector)
        return selector
    },
    seeds: (files: idl.IDLFile[]) => linearizeNamespaceMembers(files.flatMap(f => f.entries))
        .filter(e =>
            !isInExternalModule(e) &&
            !idl.isImport(e) &&
            !idl.isCallback(e))
        .map(e => new OhosSeed(e, 'managed')),
    importHook: name => {
        const parts = name.split('.')
        if (parts.length > 2 && parts[0] === 'managed') {
            if (parts[1].startsWith('#')) {
                return {
                    result: parts.slice(2).join('.'),
                    name: parts[2],
                    source: parts[1]
                }
            } else {
                const trimmedName = parts.slice(1).join('.')
                for (const [module, moduleData] of peerGeneratorConfiguration().modules) {
                    if (moduleData.external && trimmedName.startsWith(module)) {
                        const moduleParts = module.split('.')
                        return {
                            result: parts.slice(moduleParts.length + 1).join('.'),
                            name: parts[moduleParts.length + 1],
                            source: '@' + module
                        }
                    }
                }
            }
        }
    }
}

const ArkUIFeature: Feature = {
    name: 'arkui',
    init: () => {
        const selector = new MakeSelector()
        registerArkUIProducers(selector)
        registerDefaultProducers(selector)
        return selector
    },
    seeds: (files: idl.IDLFile[]) => linearizeNamespaceMembers(files.flatMap(f => f.entries))
        .filter(e =>
            idl.hasExtAttribute(e, idl.IDLExtendedAttributes.Component) ||
            idl.hasExtAttribute(e, idl.IDLExtendedAttributes.ComponentInterface))
        .map(e => new OhosSeed(e, 'managed')),
    importHook: (name: string) => {
        if (name.startsWith(MANAGED_PREFIX + '.#')) {
            const parts = name.split('.')
            const baseName = parts.pop()!
            return {result: baseName, name: baseName, source: parts[1]}
        }
        switch (name) {
            case 'managed.arkui.component.common.AttributeModifier':
                return {result: 'AttributeModifier', name: 'AttributeModifier', source: '#handwritten'}
            case 'PeerNode':
            case 'ComponentBase': return {result: name, name, source: '@arkui.base'}
            case 'memo':
            case 'memo_stable':
            case 'memo_skip': return {result: name, name, source: 'arkui.incremental.annotation'}
            case 'remember': return {result: name, name, source: 'arkui.incremental.runtime.memo.remember'}
            case 'NodeAttach': return {result: name, name, source: 'arkui.incremental.runtime.memo.node'}
        }
        return undefined
    }
}

const Features = new Map([
    ['ost', OSTFeature],
    ['arkui', ArkUIFeature]]
)

function defaultImports(): ImportsCollector {
    const imports = new ImportsCollector()
    imports.addFeatures([
        'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64', 'float32', 'float64'
    ], '@koalaui/compat')
    imports.addFeatures([
        'KInt', 'KPointer', 'KInteropReturnBuffer', 'KSerializerBuffer',
        'SerializerBase', 'DeserializerBase', 'MaterializedBase', 'MaterializedBaseTag',
        'Finalizable', 'toPeerPtr',
        'RuntimeType', 'ResourceHolder',
        'loadNativeModuleLibrary', 'registerApiEventHandler',
        'InteropNativeModule', 'resourceFinalizerRegister',
    ], '@koalaui/interop')
    return imports
}

export function printOstFiles(library: PeerLibrary, featureName: string): [Map<string, OutputFile>, Map<TargetFile, string>] {
    const feature = Features.get(featureName)
    if (!feature)
        throw new Error(`Unknown feature: ${featureName}`)
    const selector = feature.init()
    // ignore predefined / synthetic files
    const files = library.files.filter(file =>
        file.packageClause.length &&
        !['idlize', 'synthetic'].includes(file.packageClause[0]))
    const {effect, declarations } = continueWith<PeerLibrary, OhosEffect>({
        createEffect: createOhosEffect,
        library,
        roots: { seeds: feature.seeds(files) }},
        onlyFor(OhosSeed<idl.IDLNode, ArkUIRole<idl.IDLNode>>, (seed, ctx) => selector.select(seed)(seed.node, ctx, seed.role, seed.data)))
    const knownPackages = [
        ...files.map(file => file.packageClause.length ? file.packageClause.join('.') : library.name.toLowerCase()),
        'engine',
        'synthetic',
    ].map(managedName)
    const [managed, native] = declarations.reduce<[LWDeclaration[], LWDeclaration[]]>(([m, n], decl) => {
        (isManaged(decl.name) ? m : n).push(decl)
        return [m, n]
    }, [[], []])
    return [
        dumpTsLike(managed, effect, library.language, new Set(knownPackages), feature.importHook),
        dumpCLike(native, effect, library.name)
    ]
}

function dumpTsLike(decls: LWDeclaration[], effect: OhosEffect, language: Language,
    packages: Set<string>, onUnknownImport?: moduleLike.OnUnknownImport
): Map<string, OutputFile> {
    decls = libohosModuleLike.postprocess(decls, effect.nativeModuleName, effect.callbacks, language)
    const files = moduleLike.formFiles(packages, decls, {knownReference: new Map(), defaultNamespaces: effect.defaultNamespaces, knownImports: new Map(), defaultImports, onUnknownImport})
    const result: Map<string, OutputFile> = new Map()
    const printer = language === Language.ARKTS ? processNPrintArkTS : processNPrintTS
    files.forEach((content, fileName) => {
        const mappedName = mapFileName(fileName)
        if (!mappedName)
            return
        const printed = content.body.map(it => printer(it, fileName, packages))
        result.set(mappedName, {
            imports: content.moduleLikeImports,
            content: printed,
            extension: ".ts",
            exported: true,
        })
    })
    return result
}

function dumpCLike(decls: LWDeclaration[], effect: OhosEffect, moduleName: string): Map<TargetFile, string> {
    const files: Map<string, LWDeclaration[]> = lowLevelLike.postprocess(decls, effect.modifiers, effect.callbacks)
    ///copied from OhosNativeVisitor
    const interopTypesContent = readInteropTypesHeader()
    const h = [
        readLangTemplate('ohos_api_prologue.h', Language.CPP),
        readTemplate('any_api.h'),
        readTemplate('generic_service_api.h'),
        processNPrintCXX(files.get(C_API_PREFIX)!),
        readLangTemplate('ohos_api_epilogue.h', Language.CPP)
        ].join('\n')
        .replaceAll("%INTEROP_TYPES_HEADER", interopTypesContent)
        .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${moduleName.toUpperCase()}_H`)
        .replaceAll("%LIBRARY_NAME%", moduleName.toUpperCase())
        .replaceAll("%API_KIND%", peerGeneratorConfiguration().ApiKind.toString())

    const bridgeDecls = files.get(BRIDGE_PREFIX)!
    const callbackKindEnum = bridgeDecls.find(it => it.name === 'CallbackKind')
    const cpp = [
        readLangTemplate('api_impl_prologue.cpp', Language.CPP),
        libraryDeclaration({removeCopyright: true}),
        readTemplate("api_getter.cpp"),
        processNPrintCXX(bridgeDecls.filter(it => it !== callbackKindEnum)),
        ].join('\n')
        .replaceAll("%INTEROP_MODULE_NAME%", `${moduleName.toUpperCase()}NativeModule`)
        .replaceAll("%API_HEADER_PATH%", `${moduleName.toLowerCase()}.h`)
        .replaceAll("%API_KIND%", `OH_${moduleName}_APIKind::OH_${moduleName}_API_KIND`)
        .replaceAll("%API_NAME%", `OH_${moduleName}_API`)
        .replaceAll("%CALLBACK_KINDS%", callbackKindEnum ? processNPrintCXX([callbackKindEnum]) : 'enum CallbackKind {};')
        .replaceAll("%LIBRARY_NAME%", moduleName.toUpperCase())
    const apiImpl = [
        `#include "common-interop.h"`,
        `#include "${moduleName.toLowerCase()}.h"`,
        processNPrintCXX(files.get(IMPL_PREFIX)!),
        readLangTemplate('api_impl_epilogue.cpp', Language.CPP)
        ].join('\n')
        .replaceAll("%LIBRARY_NAME%", moduleName.toUpperCase())
    return new Map([
        [new TargetFile(`${moduleName.toLowerCase()}.h`), h],
        [new TargetFile(`${moduleName.toLowerCase()}.cpp`), cpp],
        [new TargetFile(`${moduleName.toLowerCase()}ApiImpl_temp.cpp`), apiImpl],
    ])
}
