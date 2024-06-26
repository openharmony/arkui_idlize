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
import { IndentedPrinter } from "../IndentedPrinter"
import { PrimitiveType } from "./DeclarationTable"
import { Language } from "../util"
import { createLanguageWriter, LanguageWriter, PrinterLike } from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { PeerEventKind } from "./printers/EventsPrinter"
import { writeDeserializer, writeSerializer } from "./printers/SerializerPrinter"
import { PeerLibrary } from "./PeerLibrary"
import { ArkoalaInstall, LibaceInstall } from "../Install"

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

export function nativeModuleDeclaration(methods: string[], nativeBridgePath: string, useEmpty: boolean, language: Language): string {
    return `
  ${language == Language.TS ? importTsInteropTypes : ""}
  ${readLangTemplate("NativeModule_prologue", language)
    .replace("%NATIVE_BRIDGE_PATH%", nativeBridgePath)
    .replace("%USE_EMPTY%", useEmpty.toString())}
// #region GENERATED API
  ${methods.join("\n  ")}
// #endregion
${readLangTemplate("NativeModule_epilogue", language)}
`
}

export function nativeModuleEmptyDeclaration(methods: string[]): string {
    return `
${importTsInteropTypes}
import { NativeModuleBase } from "./NativeModuleBase"
import { NativeModule, NodePointer, PipelineContext } from "./NativeModule"
import { nullptr } from "@koalaui/interop"

${readTemplate('NativeModuleEmpty_prologue.ts')}

${methods.join("\n")}

${readTemplate('NativeModuleEmpty_epilogue.ts')}
`.trim()
}

export function bridgeCcDeclaration(bridgeCc: string[]): string {
    let prologue = readTemplate('bridge_prologue.cc')
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)
    let epilogue = readTemplate('bridge_epilogue.cc')
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)

    return prologue.concat("\n").concat(bridgeCc.join("\n")).concat(epilogue).concat("\n")
}

export function completeImplementations(modifiers: LanguageWriter, accessors: LanguageWriter, basicVersion: number, fullVersion: number, extendedVersion: number): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let epilogue = readTemplate('dummy_impl_epilogue.cc')

    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)
        .replaceAll(`%ARKUI_BASIC_NODE_API_VERSION_VALUE%`, basicVersion.toString())
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, fullVersion.toString())
        .replaceAll(`%ARKUI_EXTENDED_NODE_API_VERSION_VALUE%`, extendedVersion.toString())
    result.writeLines(`
#include "arkoala-macros.h"
#include "delegates.h"

void SetAppendGroupedLog(void* pFunc) {}
`)
    result.concat(modifiers)
    result.concat(accessors)
    result.writeLines(epilogue)
    return result
}

export function appendModifiersCommonPrologue(): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let body = readTemplate('impl_prologue.cc')

    body = body.replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)

    result.writeLines(body)
    return result
}

export function appendViewModelBridge(): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let body = readTemplate('view_model_bridge.cc')

    body = body.replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)

    result.writeLines(body)
    return result
}

export function completeModifiersContent(content: PrinterLike, basicVersion: number, fullVersion: number, extendedVersion: number): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    let epilogue = readTemplate('dummy_impl_epilogue.cc')

    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)
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

export function completeEventsImplementations(lines: string): string {
    return `
#include "arkoala_api_generated.h"
#include "events.h"
#include "Serializers.h"

${lines}
`
}

export function completeDelegatesImpl(lines: string): string {
    return `
#include "delegates.h"

${lines}
`
}

export function dummyImplementations(modifiers: LanguageWriter, accessors: LanguageWriter, basicVersion: number, fullVersion: number, extendedVersion: number): LanguageWriter {
    let prologue = readTemplate('dummy_impl_prologue.cc')
    let epilogue = readTemplate('dummy_impl_epilogue.cc')

    prologue = prologue
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)
    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)
        .replaceAll(`%ARKUI_BASIC_NODE_API_VERSION_VALUE%`, basicVersion.toString())
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, fullVersion.toString())
        .replaceAll(`%ARKUI_EXTENDED_NODE_API_VERSION_VALUE%`, extendedVersion.toString())

    let result = createLanguageWriter(Language.CPP)
    result.writeLines(prologue)
    result.concat(modifiers).concat(accessors)
    result.writeLines(epilogue)

    return result
}

export function modifierStructList(lines: LanguageWriter): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    result.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers modifiersImpl = {`)
    result.pushIndent()
    result.concat(lines)
    result.popIndent()
    result.print(`};`)
    result.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* ${PeerGeneratorConfig.cppPrefix}GetArkUINodeModifiers() { return &modifiersImpl; }`)
    return result
}

export function accessorStructList(lines: LanguageWriter): LanguageWriter {
    let result = createLanguageWriter(Language.CPP)
    result.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors accessorsImpl = {`)
    result.pushIndent()
    result.concat(lines)
    result.popIndent()
    result.print(`};`)

    result.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* ${PeerGeneratorConfig.cppPrefix}GetArkUIAccessors() { return &accessorsImpl; }`)
    return result
}

export function makeTSSerializer(library: PeerLibrary): string {
    let printer = createLanguageWriter(library.declarationTable.language)
    writeSerializer(library, printer)
    return `
import { SerializerBase, Tags, RuntimeType, runtimeType, isPixelMap, isResource, isInstanceOf } from "./SerializerBase"
import { int32 } from "@koalaui/common"
import { unsafeCast } from "./generated-utils"

${printer.getOutput().join("\n")}

export function createSerializer(): Serializer { return new Serializer() }
`
}

export function makeJavaSerializerWriter(library: PeerLibrary): LanguageWriter {
    let result = createLanguageWriter(library.declarationTable.language)
    result.print(`package org.koalaui.arkoala;\n`)
    writeSerializer(library, result)
    return result
}

export function makeCSerializers(library: PeerLibrary, structs: IndentedPrinter, typedefs: IndentedPrinter): string {
    const serializers = createLanguageWriter(Language.CPP)
    const writeToString = createLanguageWriter(Language.CPP)
    serializers.print("\n// Serializers\n")
    writeSerializer(library, serializers)
    serializers.print("\n// Deserializers\n")
    writeDeserializer(library, serializers)
    library.declarationTable.generateStructs(structs, typedefs, writeToString)

    return `
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "arkoala_api_generated.h"
#include <string>

${writeToString.getOutput().join("\n")}

${serializers.getOutput().join("\n")}
`
}

export function makeTSDeserializer(library: PeerLibrary): string {
    const deserializer = createLanguageWriter(Language.TS)
    writeDeserializer(library, deserializer)
    return `
import { runtimeType, Tags, RuntimeType } from "./SerializerBase"
import { DeserializerBase } from "./DeserializerBase"
import { int32 } from "@koalaui/common"
import { unsafeCast } from "./generated-utils"

${deserializer.getOutput().join("\n")}
`
}

export function makeApiModifiers(modifiers: string[], accessors: string[], events: string[]): string {

    let node_api = readTemplate('arkoala_node_api.h')
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)


    return `
/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers {
${modifiers.join("\n")}
} ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors {
${accessors.join("\n")}
} ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIAnimation {
} ${PeerGeneratorConfig.cppPrefix}ArkUIAnimation;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUINavigation {
} ${PeerGeneratorConfig.cppPrefix}ArkUINavigation;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI {
${events.join("\n")}
} ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI;

${node_api}

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_NODE_API_VERSION above for binary
 * layout checks.
 */
typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIFullNodeAPI {
    ${PrimitiveType.Int32.getText()} version;
    const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* (*getNodeModifiers)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* (*getAccessors)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIAnimation* (*getAnimation)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUINavigation* (*getNavigation)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI* (*getGraphicsAPI)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI* (*getEventsAPI)();
    const ${PeerGeneratorConfig.cppPrefix}ArkUIExtendedNodeAPI* (*getExtendedAPI)();
} ${PeerGeneratorConfig.cppPrefix}ArkUIFullNodeAPI;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIAnyAPI {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIAnyAPI;
`
}

export function makeApiHeaders(lines: string[]): string {
    return `

${lines.join("\n")}
`
}

const TEMPLATES_CACHE = new Map<string, string>()

function readTemplate(name: string): string {
    let template = TEMPLATES_CACHE.get(name);
    if (template == undefined) {
        template = fs.readFileSync(path.join(__dirname, `../templates/${name}`), 'utf8')
        TEMPLATES_CACHE.set(name, template)
    }
    return template
}

function readLangTemplate(name: string, lang: Language): string {
    return fs.readFileSync(path.join(__dirname, `../templates/${name + lang.extension}`), 'utf8')
}


export function makeAPI(
    apiVersion: string,
    headers: string[], modifiers: string[], accessors: string[], events: string[],
    structs: IndentedPrinter, typedefs: IndentedPrinter
): string {

    let prologue = readTemplate('arkoala_api_prologue.h')
    let epilogue = readTemplate('arkoala_api_epilogue.h')

    prologue = prologue
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, apiVersion)
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)
    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)

    return `
${prologue}

${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${makeApiHeaders(headers)}

${makeApiModifiers(modifiers, accessors, events)}

${epilogue}
`
}

export function copyPeerLib(from: string, arkoala: ArkoalaInstall) {
    const tsBase = path.join(from, 'ts')
    copyDir(tsBase, arkoala.tsDir)
    const cppBase = path.join(from, 'cpp')
    copyDir(cppBase, arkoala.nativeDir)
    let subdirs = ['node', 'arkts', 'jni', 'legacy']
    subdirs.forEach(subdir => {
        const cppBase = path.join(from, 'cpp', subdir)
        const destDir = arkoala.native(subdir)
        copyDir(cppBase, arkoala.mkdir(destDir))
    })
    copyDir(path.join(from, 'arkts'), arkoala.arktsDir)
    copyDir(path.join(from, 'java'), arkoala.javaDir)
}

export function copyToLibace(from: string, libace: LibaceInstall) {
    const macros = path.join(from, 'cpp', 'arkoala-macros.h')
    fs.copyFileSync(macros, libace.arkoalaMacros)
}

function copyDir(from: string, to: string) {
    fs.readdirSync(from).forEach(it => {
        let file = path.join(from, it)
        if (fs.statSync(file).isFile()) {
            fs.copyFileSync(file, path.join(to, it))
        }
        // TODO: copy dir
    })
}
export function makeNodeTypes(types: string[]): string {
    const enumValues = types.map(it => `  ${it},`).join("\n")
    return `
export enum ArkUINodeType {
${enumValues}
}
`.trim()
}

export function makeArkuiModule(componentsFiles: string[]): string {
    return componentsFiles.map(file => {
        const basename = path.basename(file)
        const basenameNoExt = basename.replaceAll(path.extname(basename), "")
        return `export * from "./${basenameNoExt}"`
    }).join("\n")
}

export function makeMaterializedPrologue(lang: Language): string {
    let prologue = readLangTemplate('materialized_class_prologue', lang)
    return `
${prologue}

${importTsInteropTypes}

`
}

export function makePeerEvents(data: string): string {
    return `
import { Deserializer } from './Deserializer'
import { RuntimeType } from "./SerializerBase"
import { int32 } from "@koalaui/common"

interface PeerEvent {
    readonly kind: ${PeerEventKind}
    readonly nodeId: number
}

${data}
`
}

export function makeCEventsImpl(implData: string, receiversList: string): string {
    return `
${implData}

const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI eventsImpl = {
${receiversList}
};

const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI* GetArkUiEventsAPI()
{
    return &eventsImpl;
}
`
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
    // transfroms camel-case name to snake-case
    return className.split(/(?=[A-Z][a-z])/g).join("_").toLowerCase()
}