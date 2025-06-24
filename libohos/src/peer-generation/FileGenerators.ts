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
import * as fs from "fs"
import * as path from "path"
import { IndentedPrinter, camelCaseToUpperSnakeCase, Language, PeerLibrary, createLanguageWriter, CppConvertor, PrimitiveTypesInstance } from "@idlizer/core"
import { Method, MethodSignature, NamedMethodSignature, PrinterLike } from "./LanguageWriters"
import { CppLanguageWriter, LanguageWriter } from "@idlizer/core";
import { peerGeneratorConfiguration } from "../DefaultConfiguration";
import { ImportsCollector } from "./ImportsCollector"
import { printCallbacksKinds, printCallbacksKindsImports } from "./printers/CallbacksPrinter"
import { SourceFile } from "./printers/SourceFile"
import { NativeModule } from "./NativeModule"
import { generateStructs } from "./printers/StructPrinter"
import { createCSerializerPrinter, createSerializerPrinter } from "./printers/SerializerPrinter";
import { collectPeersForFile } from "./PeersCollector";

export const warning = "WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!"

function dateChunk(): string {
    const currentYear = (new Date()).getFullYear()
    if (currentYear > 2024) return `2024-${currentYear}`
    return `${currentYear}`
}

export const cStyleCopyright =
`/*
 * Copyright (c) ${dateChunk()} Huawei Device Co., Ltd.
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
`

export const sharpCopyright =
`# Copyright (c) ${dateChunk()} Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
`

const importTsInteropTypes = `
import {
    int32,
    float32
} from "@koalaui/common"
import {
    KInt,
    KBoolean,
    KFloat,
    KUInt,
    KStringPtr,
    KPointer,
    KNativePointer,
    KInt32ArrayPtr,
    KUint8ArrayPtr,
    KFloat32ArrayPtr,
    pointer
} from "@koalaui/interop"
`.trim()

export function libraryCcDeclaration(options?: { removeCopyright?: boolean}): string {
    let content = readTemplate('library_template.cc')
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%ANY_API%`, readTemplate('any_api.h'))
        .replaceAll(`%GENERIC_SERVICE_API%`, readTemplate('generic_service_api.h'))
    if (!options?.removeCopyright)
        content = cStyleCopyright + content
    return content
}

export function bridgeCcGeneratedDeclaration(generatedApi: string[]): string {
    let prologue = readTemplate('bridge_generated_prologue.cc')
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)

    return prologue.concat("\n")
        .concat(generatedApi.join("\n"))
}

export function bridgeCcCustomDeclaration(customApi: string[]): string {
    let prologue = readTemplate('bridge_custom_prologue.cc')
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)

    return prologue.concat("\n")
        .concat(customApi.join("\n"))
}

export function appendModifiersCommonPrologue(): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let body = readTemplate('impl_prologue.cc')

    body = body.replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)

    result.writeLines(body)
    return result
}

export function getNodeTypes(library: PeerLibrary): string[] {
    const components: string[] = []
    for (const file of library.files) {
        for (const peer of collectPeersForFile(library, file)) {
            components.push(peer.componentName)
        }
    }
    return [...peerGeneratorConfiguration().components.customNodeTypes, ...components.sort()]
}

export function completeModifiersContent(content: PrinterLike, basicVersion: number, fullVersion: number, extendedVersion: number): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let epilogue = readTemplate('dummy_impl_epilogue.cc')

    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%ARKUI_BASIC_NODE_API_VERSION_VALUE%`, basicVersion.toString())
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, fullVersion.toString())
        .replaceAll(`%ARKUI_EXTENDED_NODE_API_VERSION_VALUE%`, extendedVersion.toString())
    result.writeLines(`
void SetAppendGroupedLog(void* pFunc) {}
`)
    result.concat(content)
    result.writeLines(epilogue)
    return result
}

export function completeDelegatesImpl(lines: string): string {
    return `
#include "delegates.h"

${lines}
`
}

export function dummyImplementations(modifiers: LanguageWriter, accessors: LanguageWriter, basicVersion: number, fullVersion: number, extendedVersion: number, apiGeneratedFile: string): LanguageWriter {
    let prologue = readTemplate('dummy_impl_prologue.cc')
    let epilogue = readTemplate('dummy_impl_epilogue.cc')

    prologue = prologue
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%API_GENERATED%`, apiGeneratedFile)
    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%ARKUI_BASIC_NODE_API_VERSION_VALUE%`, basicVersion.toString())
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, fullVersion.toString())
        .replaceAll(`%ARKUI_EXTENDED_NODE_API_VERSION_VALUE%`, extendedVersion.toString())

    let result = createLanguageWriter(Language.CPP)
    result.writeLines(prologue)
    result.print("namespace OHOS::Ace::NG::GeneratedModifier {")
    result.pushIndent()
    result.concat(modifiers).concat(accessors)
    result.writeLines(epilogue)
    result.popIndent()
    result.print("}")

    return result
}

export function modifierStructList(lines: LanguageWriter): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    result.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUINodeModifiers* ${peerGeneratorConfiguration().cppPrefix}GetArkUINodeModifiers()`)
    result.print("{")
    result.pushIndent()

    result.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUINodeModifiers modifiersImpl = {`)
    result.pushIndent()
    result.concat(lines)
    result.popIndent()
    result.print(`};`)

    result.print(`return &modifiersImpl;`)
    result.popIndent()
    result.print(`}`)
    return result
}

export function accessorStructList(lines: LanguageWriter): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    result.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUIAccessors* ${peerGeneratorConfiguration().cppPrefix}GetArkUIAccessors()`)
    result.print("{")
    result.pushIndent()

    result.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUIAccessors accessorsImpl = {`)
    result.pushIndent()
    result.concat(lines)
    result.popIndent()
    result.print(`};`)

    result.print(`return &accessorsImpl;`)
    result.popIndent()
    result.print('}')

    return result
}

export function makeCSerializers(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {

    const writeToString = library.createLanguageWriter(Language.CPP)
    const serializers = createCSerializerPrinter(library, Language.CPP, "")
    generateStructs(library, structs, typedefs, writeToString)

    return `
${cStyleCopyright}

${writeToString.getOutput().join("\n")}

${serializers.getOutput().join("\n")}
`
}

const TEMPLATES_CACHE = new Map<string, string>()

export function readTemplate(name: string): string {
    let template = TEMPLATES_CACHE.get(name);
    if (template == undefined) {
        template = fs.readFileSync(path.join(__dirname, `../../libohos/templates/${name}`), 'utf8')
        TEMPLATES_CACHE.set(name, template)
    }
    return template
}

export function readInteropTypesHeader() {
    const interopRootPath = getInteropRootPath()
    return fs.readFileSync(
        path.resolve(interopRootPath, 'src', 'cpp', 'interop-types.h'),
        'utf-8'
    )
}

function useLangExtIfNeeded(file: string, lang: Language): string {
    if (path.extname(file))
        return file
    if (lang == Language.ARKTS) return `${file}${Language.TS.extension}` // todo: Dirty. Please refactor.
    return `${file}${lang.extension}`
}

export function readLangTemplate(name: string, lang: Language): string {
    name = useLangExtIfNeeded(name, lang)
    return fs.readFileSync(path.join(__dirname, `../../libohos/templates/${lang.directory}/${name}`), 'utf8')
}

export function maybeReadLangTemplate(name: string, lang: Language): string | undefined {
    name = useLangExtIfNeeded(name, lang)
    const file = path.join(__dirname, `../../libohos/templates/${lang.directory}/${name}`)
    if (!fs.existsSync(file))
        return undefined
    return fs.readFileSync(file, 'utf8')
}

export function getInteropRootPath() {
    const interopPackagePath = require.resolve('@koalaui/interop')
    return path.resolve(interopPackagePath, '..', '..', '..', '..', '..')
}

export function copyDir(from: string, to: string, recursive: boolean) {
    fs.readdirSync(from).forEach(it => {
        const sourcePath = path.join(from, it)
        const targetPath = path.join(to, it)
        const statInfo = fs.statSync(sourcePath)
        if (statInfo.isFile()) {
            copyFile(sourcePath, targetPath)
        }
        else if (recursive && statInfo.isDirectory()) {
            copyDir(sourcePath, targetPath, recursive)
        }
    })
}
export function copyFile(from: string, to: string) {
    if (!fs.existsSync(path.dirname(to))) {
        fs.mkdirSync(path.dirname(to), { recursive: true })
    }
    fs.copyFileSync(from, to)
}

export function makeArkuiModule(componentsFiles: string[], root:string): string {
    return tsCopyrightAndWarning(
        componentsFiles.map(file => {
            const relativePath = path.relative(root, file)
            const basenameNoExt = relativePath.replaceAll(path.extname(relativePath), "")
            return `export * from "./${basenameNoExt}"`
        }).sort().join("\n")
    )
}

export function makeMaterializedPrologue(lang: Language): string {
    let prologue = readLangTemplate('materialized_class_prologue' + lang.extension, lang)
    return `
${prologue}

${lang == Language.TS || lang == Language.ARKTS ? importTsInteropTypes : ''}

`
}

export function tsCopyrightAndWarning(content: string): string {
    return `${cStyleCopyright}

// ${warning}

${content}
`
}

export function makeCallbacksKinds(library: PeerLibrary, language: Language): string {
    const writer = library.createLanguageWriter(language)
    printCallbacksKindsImports(language, writer)
    printCallbacksKinds(library, writer)
    const enumContent = writer.getOutput().join("\n")
    if (language === Language.CPP)
        return `
${cStyleCopyright}

#ifndef _CALLBACK_KIND_H
#define _CALLBACK_KIND_H

${enumContent}

#endif
`
    return enumContent
}

export function gniFile(gniSources: string): string {
return `${sharpCopyright}

# ${warning}

${gniSources}
`
}

export function mesonBuildFile(content: string): string {
return `${sharpCopyright}

# ${warning}

${content}
`
}

export function makeIncludeGuardDefine(filePath: string) {
    let basename = path.basename(filePath);
    return basename.replace(/[.\- ]/g, "_").toUpperCase()
}

export function makeFileNameFromClassName(className: string) {
    // transforms camel-case name to snake-case
    return className.split(/(?=[A-Z][a-z])/g).join("_").toLowerCase()
}
