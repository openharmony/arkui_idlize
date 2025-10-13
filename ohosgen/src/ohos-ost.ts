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
import { Language, PeerLibrary } from "@idlizer/core"
import {
    LWDeclaration,
    MakeSelector,
    MANAGED_PREFIX,
    OutputFile,
    producers,
    T,
    GeneratorContext,
    isManaged,
    moduleLike,
    processNPrintArkTS,
    lowLevelLike,
    processNPrintCXX,
    roles,
    processNPrintTS,
    createProducer,
    mapFileName,
    TargetFile,
    readLangTemplate,
    getInteropRootPath,
    peerGeneratorConfiguration,
    readTemplate,
    libraryCcDeclaration,
    C_API_PREFIX,
    BRIDGE_PREFIX,
    IMPL_PREFIX
} from "@idlizer/libohos"

export function printOstFiles(peerLibrary: PeerLibrary): [Map<string, OutputFile>, Map<TargetFile, string>] {
    const selector = new MakeSelector()
    for (const p of [...Object.values(producers.managed), ...Object.values(producers.native)])
        selector.register(p as any)

    /// fallback producers
    selector.register(createProducer(
        { is: idl.isConstant, role: roles.managed },
        (constant, ctx) => {
            return { artifact: { reference: T.c("///managed.constant.fallback")}}
        }))

    const ctx = new GeneratorContext(peerLibrary, selector)
    // don't process predefined files
    const files = peerLibrary.files.filter(file => file.packageClause[0] !== 'idlize')
    const declarations = ctx.generate(files)

    const SPECIAL_PACKAGES = [MANAGED_PREFIX + '.engine']
    const knownPackages = files
        .map(file => file.packageClause.length ? file.packageClause : [peerLibrary.name.toLowerCase()])
        .map(clause => [MANAGED_PREFIX, ...clause].join('.'))
        .concat(SPECIAL_PACKAGES)
    const [managed, native] = declarations.reduce<[LWDeclaration[], LWDeclaration[]]>(([m, n], decl) => {
        (isManaged(decl.name) ? m : n).push(decl)
        return [m, n]
    }, [[], []])
    return [
        dumpTsLike(managed, peerLibrary.language, new Set(knownPackages)),
        dumpCLike(native, peerLibrary.name)
    ]
}

function dumpTsLike(decls: LWDeclaration[], language: Language, packages: Set<string>): Map<string, OutputFile> {
    decls = moduleLike.postprocess(decls)
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

function dumpCLike(decls: LWDeclaration[], moduleName: string): Map<TargetFile, string> {
    const files: Map<string, LWDeclaration[]> = lowLevelLike.postprocess(decls)
    ///copied from OhosNativeVisitor
    const interopRootPath = getInteropRootPath()
    const interopTypesPath = path.resolve(interopRootPath, 'src', 'cpp', 'interop-types.h')
    const interopTypesContent = fs.readFileSync(interopTypesPath, 'utf-8')
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
    const cc = [
        readLangTemplate('api_impl_prologue.cc', Language.CPP),
        libraryCcDeclaration({removeCopyright: true}),
        readTemplate("api_getter.cc"),
        processNPrintCXX(files.get(BRIDGE_PREFIX)!),
        ].join('\n')
        .replaceAll("%INTEROP_MODULE_NAME%", `${moduleName.toUpperCase()}NativeModule`)
        .replaceAll("%API_HEADER_PATH%", `${moduleName.toLowerCase()}.h`)
        .replaceAll("%API_KIND%", `OH_${moduleName}_APIKind::OH_${moduleName}_API_KIND`)
        .replaceAll("%API_NAME%", `OH_${moduleName}_API`)
        .replaceAll("%CALLBACK_KINDS%", 'typedef enum CallbackKind {\n} CallbackKind;') ///
        .replaceAll("%LIBRARY_NAME%", moduleName.toUpperCase())
    const apiImpl = [
        `#include "common-interop.h"`,
        `#include "${moduleName.toLowerCase()}.h"`,
        processNPrintCXX(files.get(IMPL_PREFIX)!),
        readLangTemplate('api_impl_epilogue.cc', Language.CPP)
        ].join('\n')
        .replaceAll("%LIBRARY_NAME%", moduleName.toUpperCase())
    return new Map([
        [new TargetFile(`${moduleName.toLowerCase()}.h`), h],
        [new TargetFile(`${moduleName.toLowerCase()}.cc`), cc],
        [new TargetFile(`${moduleName.toLowerCase()}Impl_temp.cc`), ''],
        [new TargetFile(`${moduleName.toLowerCase()}ApiImpl_temp.cc`), apiImpl],
    ])
}
