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

import * as fs from 'fs'
import * as path from 'path'
import * as idl from "@idlizer/core/idl"
import { Language, linearizeNamespaceMembers, PeerLibrary } from "@idlizer/core"
import {
    LWDeclaration,
    MANAGED_PREFIX,
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
    readInteropTypesHeader
    managedName,
    OhosSeed,
    producers,
    MakeSelector,
    moduleLike,
    lowLevelLike,
    OhosEffect,
    createOhosEffect
} from "@idlizer/libohos"
import { continueWith, onlyFor } from '@idlizer/kit'

export function printOstFiles(library: PeerLibrary): [Map<string, OutputFile>, Map<TargetFile, string>] {
    const selector = new MakeSelector()
    for (const p of [...Object.values(producers.managed), ...Object.values(producers.native)])
        selector.register(p as any)

    // ignore predefined / synthetic files
    const files = library.files.filter(file =>
        file.packageClause.length &&
        !['idlize', 'synthetic'].includes(file.packageClause[0]))
    const seeds = linearizeNamespaceMembers(files.flatMap(f => f.entries))
        .filter(e =>
            !idl.isImport(e) &&
            !idl.isNamespace(e) &&
            !idl.isCallback(e))
        .map(e => new OhosSeed(e, 'managed'))
    const {effect, declarations } = continueWith<OhosSeed, PeerLibrary, OhosEffect>({
        createEffect: createOhosEffect,
        library,
        roots: { seeds }},
        onlyFor(OhosSeed, (seed, ctx) => selector.select(seed)(seed.node, ctx, seed.role)))
    const SPECIAL_PACKAGES = [MANAGED_PREFIX + '.engine']
    const knownPackages = files
        .map(file => file.packageClause.length ? file.packageClause : [library.name.toLowerCase()])
        .map(clause => [MANAGED_PREFIX, ...clause].join('.'))
        .concat(SPECIAL_PACKAGES)
    const [managed, native] = declarations.reduce<[LWDeclaration[], LWDeclaration[]]>(([m, n], decl) => {
        (isManaged(decl.name) ? m : n).push(decl)
        return [m, n]
    }, [[], []])
    declarations
        .filter(decl => !decl.name.startsWith('managed'))
        .sort((a, b) => a.name.localeCompare(b.name)).forEach(decl => console.log(decl.name))///
    console.log(`/// ${managed.length} managed, ${native.length} native`)
    return [
        dumpTsLike(managed, effect, library.language, new Set(knownPackages)),
        dumpCLike(native, effect, library.name)
    ]
}

function dumpTsLike(decls: LWDeclaration[], effect: OhosEffect, language: Language, packages: Set<string>): Map<string, OutputFile> {
    decls = moduleLike.postprocess(decls, effect.nativeModuleName, effect.callbacks)
    const files = moduleLike.formFiles(packages, decls)
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
        [new TargetFile(`${moduleName.toLowerCase()}Impl_temp.cpp`), ''],
        [new TargetFile(`${moduleName.toLowerCase()}ApiImpl_temp.cpp`), apiImpl],
    ])
}
