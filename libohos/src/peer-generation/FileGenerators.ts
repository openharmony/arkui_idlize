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
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { IndentedPrinter, Language, PeerLibrary, createLanguageWriter, LibraryInterface } from "@idlizer/core"
import { PrinterLike } from "./LanguageWriters/index.js"
import { LanguageWriter } from "@idlizer/core";
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js";
import { printCallbacksKinds, printCallbacksKindsImports } from "./printers/CallbacksPrinter.js"
import { generateStructs } from "./printers/StructPrinter.js"
import { createCSerializerPrinter } from "./printers/SerializerPrinter.js";
import { collectPeersForFile } from "./PeersCollector.js";
import { cStyleCopyright, sharpCopyright } from "./FileGeneratorsUtils.js";

export const warning = "WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!"

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

const DIR_NAME = path.resolve(fileURLToPath(import.meta.url), "../../../..")

export function libraryDeclaration(options?: { removeCopyright?: boolean}): string {
    let content = readTemplate('library_template.cpp')
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%ANY_API%`, readTemplate('any_api.h'))
        .replaceAll(`%GENERIC_SERVICE_API%`, readTemplate('generic_service_api.h'))
    if (!options?.removeCopyright)
        content = cStyleCopyright + content
    return content
}

function applyBridgeTemplate(api: string[], template: string): string {
    let prologue = readTemplate(template)
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)

    return prologue.concat("\n")
        .concat(api.join("\n"))
}

export function generatedBridgeDeclaration(generatedApi: string[]): string {
    return applyBridgeTemplate(generatedApi, "bridge_generated_prologue.cpp")
}

export function customBridgeDeclaration(customApi: string[]): string {
    return applyBridgeTemplate(customApi, "bridge_custom_prologue.cpp")
}

export function bridgeHeaderGeneratedDeclaration(generatedApi: string[]): string {
    const template = readTemplate("bridge_generated.h")
    return template.replaceAll("%GENERATED_API%", generatedApi.join("\n"))
}

export function bridgeHeaderCustomDeclaration(customApi: string[]): string {
    const template = readTemplate("bridge_custom.h")
    return template.replaceAll("%CUSTOM_API%", customApi.join("\n"))
}

export function appendModifiersCommonPrologue(library: LibraryInterface): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, library)
    let body = readTemplate('impl_prologue.cpp')

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

export function completeModifiersContent(library: LibraryInterface, content: PrinterLike, basicVersion: number, fullVersion: number, extendedVersion: number): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, library)
    let epilogue = readTemplate('dummy_impl_epilogue.cpp')

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

export function dummyImplementations(library: LibraryInterface, modifiers: LanguageWriter, accessors: LanguageWriter, basicVersion: number, fullVersion: number, extendedVersion: number, apiGeneratedFile: string): LanguageWriter {
    let prologue = readTemplate('dummy_impl_prologue.cpp')
    // TBD: Properly move handwritten code from the dummy_impl_prologue
    const withHandwrittenCode = !peerGeneratorConfiguration().modules.has("unit")
    let handwrittenPrologue = withHandwrittenCode ? readTemplate('dummy_impl_prologue_hw.cpp') : ""
    let epilogue = readTemplate('dummy_impl_epilogue.cpp')

    prologue = prologue
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%API_GENERATED%`, apiGeneratedFile)
    handwrittenPrologue = handwrittenPrologue
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%API_GENERATED%`, apiGeneratedFile)
    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%ARKUI_BASIC_NODE_API_VERSION_VALUE%`, basicVersion.toString())
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, fullVersion.toString())
        .replaceAll(`%ARKUI_EXTENDED_NODE_API_VERSION_VALUE%`, extendedVersion.toString())

    let result = createLanguageWriter(Language.CPP, library)
    result.writeLines(prologue)
    if(withHandwrittenCode) {
        result.writeLines(handwrittenPrologue)
    }
    result.print("namespace OHOS::Ace::NG::GeneratedModifier {")
    result.pushIndent()
    result.concat(modifiers).concat(accessors)
    result.writeLines(epilogue)
    result.popIndent()
    result.print("}")

    return result
}

export function modifierStructList(library: LibraryInterface, lines: LanguageWriter): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, library)
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

export function accessorStructList(library: LibraryInterface, lines: LanguageWriter): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, library)
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
${writeToString.getOutput().join("\n")}

${serializers.getOutput().join("\n")}
`
}

const TEMPLATES_CACHE = new Map<string, string>()

export function readTemplate(name: string): string {
    let template = TEMPLATES_CACHE.get(name);
    if (template == undefined) {
        template = fs.readFileSync(path.join(DIR_NAME, `../../libohos/templates/${name}`), 'utf8')
        TEMPLATES_CACHE.set(name, template)
    }
    return template
}


function getInteropRootPath() {
    const require = createRequire(import.meta.url)
    const interopPackagePath = require.resolve('@koalaui/interop')
    return path.resolve(interopPackagePath, '..', '..', '..', '..', '..')
}

let interopTypesPath: string | undefined
export function setInteropTypesHeaderPath(path: string) {
    interopTypesPath = path
}
export function readInteropTypesHeader() {
    if (interopTypesPath) {
        return fs.readFileSync(interopTypesPath, 'utf-8')
    }
    return fs.readFileSync(
        path.resolve(getInteropRootPath(), 'src', 'cpp', 'interop-types.h'),
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
    return fs.readFileSync(path.join(DIR_NAME, `../../libohos/templates/${lang.directory}/${name}`), 'utf8')
}

export function maybeReadLangTemplate(name: string, lang: Language): string | undefined {
    name = useLangExtIfNeeded(name, lang)
    const file = path.join(DIR_NAME, `../../libohos/templates/${lang.directory}/${name}`)
    if (!fs.existsSync(file))
        return undefined
    return fs.readFileSync(file, 'utf8')
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
            return `export * from './${basenameNoExt}'`
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

export function makeFileNameFromClassName(className: string) {
    // transforms camel-case name to snake-case
    return className.split(/(?=[A-Z][a-z])/g).join("_").toLowerCase()
}
