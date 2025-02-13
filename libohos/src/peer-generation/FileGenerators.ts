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
import { IndentedPrinter, camelCaseToUpperSnakeCase, Language, PeerLibrary, createLanguageWriter, PrimitiveTypesInstance } from "@idlizer/core"
import { PrinterLike } from "./LanguageWriters"
import { LanguageWriter } from "@idlizer/core";
import { peerGeneratorConfiguration } from "./PeerGeneratorConfig";
import { writeDeserializer, writeSerializer } from "./printers/SerializerPrinter"
import { ImportsCollector } from "./ImportsCollector"
import { writeARKTSTypeCheckers, writeTSTypeCheckers } from "./printers/TypeCheckPrinter"
import { printCallbacksKinds, printCallbacksKindsImports, printDeserializeAndCall } from "./printers/CallbacksPrinter"
import { SourceFile } from "./printers/SourceFile"
import { NativeModule } from "./NativeModule"
import { generateStructs } from "./printers/StructPrinter"
import { makeCJDeserializer, makeCJSerializer } from "./printers/lang/CJPrinters"

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

export function libraryCcDeclaration(): string {
    return readTemplate('library_template.cc')
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
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
        for (const peer of file.peers.values()) {
            components.push(peer.componentName)
        }
    }
    return [...peerGeneratorConfiguration().customNodeTypes, ...components.sort()]
}

export function appendViewModelBridge(library: PeerLibrary): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let body = readTemplate('view_model_bridge.cc')

    const createNodeSwitch = new IndentedPrinter()
    const createNodeMethods = new IndentedPrinter()

    createNodeMethods.pushIndent()
    createNodeSwitch.pushIndent(3)
    for (const component of getNodeTypes(library)) {
        const createNodeMethod = `create${component}Node`
        createNodeMethods.print(`Ark_NodeHandle ${createNodeMethod}(Ark_Int32 nodeId);`)
        const name = `${peerGeneratorConfiguration().cppPrefix}ARKUI_${camelCaseToUpperSnakeCase(component)}`
        createNodeSwitch.print(`case ${name}: return GeneratedViewModel::${createNodeMethod}(id);`)
    }
    createNodeSwitch.popIndent(3)
    createNodeMethods.popIndent()

    body = body.replaceAll("%CREATE_NODE_METHODS%", createNodeMethods.getOutput().join("\n"))
    body = body.replaceAll("%CREATE_NODE_SWITCH%", createNodeSwitch.getOutput().join("\n"))
    body = body.replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)

    result.writeLines(body)
    return result
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

export function makeSerializer(library: PeerLibrary): string {
    switch (library.language) {
        case Language.ARKTS: return makeTSSerializer(library).getOutput().join("\n")
        case Language.TS: return makeTSSerializer(library).getOutput().join("\n")
        case Language.CJ: return makeCJSerializer(library).getOutput().join("\n")
    }
    throw new Error(`Unsupported language "${library.language}"`)
}

export function makeTSSerializer(library: PeerLibrary): LanguageWriter {
    let printer = library.createLanguageWriter()
    printer.writeLines(cStyleCopyright)
    const imports = new ImportsCollector()
    imports.addFeatures(["SerializerBase", "Tags", "RuntimeType", "runtimeType", "isResource", "isInstanceOf"], "@koalaui/interop")
    imports.addFeatures(["int32", "float32"], "@koalaui/common")
    if (printer.language == Language.TS) {
        imports.addFeatures(["MaterializedBase"], "../MaterializedBase")
        imports.addFeatures(["unsafeCast"], "../shared/generated-utils")
        imports.addFeatures(["InteropNativeModule"], "@koalaui/interop")
        imports.addFeatures(["CallbackKind"], "CallbackKind")
        imports.addFeatures(["ResourceHolder", "nullptr"], "@koalaui/interop")
        imports.addFeature('KPointer', '@koalaui/interop')
    }
    if (printer.language == Language.ARKTS) {
        imports.addFeatures(["unsafeCast"], "../shared/generated-utils")
        imports.addFeatures(["MaterializedBase"], "../MaterializedBase")
        imports.addFeatures(['nullptr', 'KPointer'], '@koalaui/interop')
        imports.addFeatures(["int64"], "@koalaui/common")
    }
    imports.print(printer, '')
    writeSerializer(library, printer, "")
    return printer
}

export function makeTypeChecker(library: PeerLibrary, language: Language): string {
    if (language === Language.ARKTS) {
    let arktsPrinter = createLanguageWriter(Language.ARKTS)
    writeARKTSTypeCheckers(library, arktsPrinter)
        return arktsPrinter.getOutput().join("\n")
    }

    if (language === Language.TS) {
    let tsPrinter = createLanguageWriter(Language.TS)
    writeTSTypeCheckers(library, tsPrinter)
        return tsPrinter.getOutput().join("\n")
    }

    throw new Error("Only TS/ARKTS are allowed here")
}

export function makeCSerializers(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {

    const serializers = library.createLanguageWriter(Language.CPP)
    const writeToString = library.createLanguageWriter(Language.CPP)
    serializers.print("\n// Serializers\n")
    writeSerializer(library, serializers, "")
    serializers.print("\n// Deserializers\n")
    writeDeserializer(library, serializers, "")
    generateStructs(library, structs, typedefs, writeToString)

    return `
${writeToString.getOutput().join("\n")}

${serializers.getOutput().join("\n")}
`
}

export function makeTSDeserializer(library: PeerLibrary): string {
    const deserializer = library.createLanguageWriter(Language.TS)
    writeDeserializer(library, deserializer, "")
    return `${cStyleCopyright}
import { runtimeType, Tags, RuntimeType, SerializerBase, DeserializerBase, CallbackResource } from "@koalaui/interop"
import { KPointer, ${NativeModule.Interop.name} } from "@koalaui/interop"
import { MaterializedBase } from "./../MaterializedBase"
import { int32, float32 } from "@koalaui/common"
import { unsafeCast } from "../shared/generated-utils"
import { CallbackKind } from "./CallbackKind"
import { Serializer } from "./Serializer"

${deserializer.getOutput().join("\n")}

export function createDeserializer(args: Uint8Array, length: int32): Deserializer { return new Deserializer(args, length) }
`
}

export function makeDeserializer(library: PeerLibrary): string {
    switch (library.language) {
        case Language.ARKTS: return makeArkTSDeserializer(library)
        case Language.TS: return makeTSDeserializer(library)
        case Language.CJ: return makeCJDeserializer(library)
    }
    throw new Error(`Unsupported language "${library.language}"`)
}

export function makeArkTSDeserializer(library: PeerLibrary): string {
    const printer = library.createLanguageWriter(Language.ARKTS)
    printer.writeLines(cStyleCopyright)

    const imports = new ImportsCollector()
    imports.addFeatures(["KPointer", "runtimeType", "RuntimeType", "CallbackResource", "DeserializerBase"], "@koalaui/interop")
    imports.addFeatures(["int32", "float32", "int64"], "@koalaui/common")
    imports.addFeature("Serializer", "./Serializer")
    imports.addFeatures([NativeModule.Generated.name], "#components")
    imports.addFeatures(["CallbackKind"], "CallbackKind")
    imports.print(printer, '')

    writeDeserializer(library, printer, "")
    return `
${printer.getOutput().join("\n")}
`
}

function makeApiModifiers(modifiers: string[], accessors: string[], events: string[], nodeTypes: string[]): string {
    let node_api = readTemplate('arkoala_node_api.h')
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)

    return `
/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUINodeModifiers {
${modifiers.join("\n")}
} ${peerGeneratorConfiguration().cppPrefix}ArkUINodeModifiers;

typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUIAccessors {
${accessors.join("\n")}
} ${peerGeneratorConfiguration().cppPrefix}ArkUIAccessors;

typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUIGraphicsAPI {
    ${PrimitiveTypesInstance.Int32.getText()} version;
} ${peerGeneratorConfiguration().cppPrefix}ArkUIGraphicsAPI;

typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI {
${events.join("\n")}
} ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI;

typedef enum ${peerGeneratorConfiguration().cppPrefix}Ark_NodeType {
${nodeTypes.join(",\n")}
} ${peerGeneratorConfiguration().cppPrefix}Ark_NodeType;

${node_api}
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

export function makeAPI(
    headers: string[], modifiers: string[], accessors: string[], events: string[], nodeTypes: string[],
    structs: LanguageWriter, typedefs: IndentedPrinter,
): string {

    return `
${makeApiOhos(headers, structs, typedefs)}

${makeApiModifiers(modifiers, accessors, events, nodeTypes)}
`
}

function makeApiOhos(
    headers: string[], structs: LanguageWriter, typedefs: IndentedPrinter,
): string {
    return `
${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${headers.join("\n")}
`
}

export function copyDir(from: string, to: string, recursive: boolean, filters?: string[]) {
    fs.readdirSync(from).forEach(it => {
        const sourcePath = path.join(from, it)
        const targetPath = path.join(to, it)
        const statInfo = fs.statSync(sourcePath)
        if (statInfo.isFile()) {
            copyFile(sourcePath, targetPath, filters)
        }
        else if (recursive && statInfo.isDirectory()) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath)
            }
            copyDir(sourcePath, targetPath, recursive, filters)
        }
    })
}
function copyFile(from: string, to: string, filters?: string[]) {
    if (filters && !filters.includes(from))
        return
    fs.copyFileSync(from, to)
}

export function makeArkuiModule(componentsFiles: string[]): string {
    return tsCopyrightAndWarning(
        componentsFiles.map(file => {
            const basename = path.basename(file)
            const basenameNoExt = basename.replaceAll(path.extname(basename), "")
            return `export * from "./${basenameNoExt}"`
        }).join("\n")
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

export function makeDeserializeAndCall(library: PeerLibrary, language: Language, fileName: string): SourceFile {
    const writer = SourceFile.make(fileName, language, library)
    printDeserializeAndCall(library.name, library, writer)
    return writer
}

export function makeCallbacksKinds(library: PeerLibrary, language: Language): string {
    const writer = library.createLanguageWriter(language)
    printCallbacksKindsImports(language, writer)
    printCallbacksKinds(library, writer)
    const enumContent = writer.getOutput().join("\n")
    if (language === Language.CPP)
        return `
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
