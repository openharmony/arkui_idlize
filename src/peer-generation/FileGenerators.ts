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
import { PrimitiveType } from "./ArkPrimitiveType"
import { camelCaseToUpperSnakeCase } from "../util"
import { CppLanguageWriter, createLanguageWriter, LanguageWriter, Method, MethodSignature, NamedMethodSignature, PrinterLike } from "./LanguageWriters"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { writeDeserializer, writeDeserializerFile, writeSerializer, writeSerializerFile } from "./printers/SerializerPrinter"
import { SELECTOR_ID_PREFIX, writeConvertors } from "./printers/ConvertorsPrinter"
import { ArkoalaInstall, LibaceInstall } from "../Install"
import { ImportsCollector } from "./ImportsCollector"
import { PeerLibrary } from "./PeerLibrary"
import { writeARKTSTypeCheckers, writeTSTypeCheckers } from "./printers/TypeCheckPrinter"
import { Language } from "../Language"
import { printCallbacksKinds, printCallbacksKindsImports, printDeserializeAndCall } from "./printers/CallbacksPrinter"
import { createReferenceType, IDLVoidType, toIDLType } from "../idl"
import { createEmptyReferenceResolver, getReferenceResolver, ReferenceResolver } from "./ReferenceResolver"
import { MethodArgPrintHint } from "./LanguageWriters/LanguageWriter"
import { SourceFile, TsSourceFile } from "./printers/SourceFile"

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

export function nativeModuleDeclaration(methods: LanguageWriter, predefinedMethods: Map<string, LanguageWriter>, nativeBridgePath: string, useEmpty: boolean, language: Language, nativeMethods?: LanguageWriter): string {

    let text = readLangTemplate("NativeModule_template" + language.extension, language)
        .replace("%NATIVE_BRIDGE_PATH%", nativeBridgePath)
        .replace("%USE_EMPTY%", useEmpty.toString())
        .replaceAll("%GENERATED_METHODS%", methods.getOutput().join('\n'))
        .replaceAll("%GENERATED_NATIVE_FUNCTIONS%", nativeMethods ? nativeMethods.getOutput().join('\n') : "")
    for (const [title, printer] of predefinedMethods) {
        text = text.replaceAll(`%GENERATED_PREDEFINED_${title}%`, printer.getOutput().join('\n'))
    }

    return `
  ${language == Language.TS ? importTsInteropTypes : ""}

${text}
`
}

export function nativeModuleEmptyDeclaration(methods: string[]): string {
    return `
${importTsInteropTypes}
import { NativeModule, NativeModuleIntegrated, NodePointer, PipelineContext } from "./NativeModule"
import { nullptr } from "@koalaui/interop"

${readTemplate('NativeModuleEmpty_template.ts')
    .replaceAll("%GENERATED_EMPTY_METHODS%", methods.join('\n'))}
`
}

export function libraryCcDeclaration(): string {
    return readTemplate('library_template.cc')
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)
}

export function bridgeCcGeneratedDeclaration(generatedApi: string[]): string {
    let prologue = readTemplate('bridge_generated_prologue.cc')
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)

    return prologue.concat("\n")
        .concat(generatedApi.join("\n"))
}

export function bridgeCcCustomDeclaration(customApi: string[]): string {
    let prologue = readTemplate('bridge_custom_prologue.cc')
        .replaceAll(`%CPP_PREFIX%`, PeerGeneratorConfig.cppPrefix)

    return prologue.concat("\n")
        .concat(customApi.join("\n"))
}

export function appendModifiersCommonPrologue(): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, createEmptyReferenceResolver())
    let body = readTemplate('impl_prologue.cc')

    body = body.replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)

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
    return [...PeerGeneratorConfig.customNodeTypes, ...components.sort()]
}

export function appendViewModelBridge(library: PeerLibrary): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, createEmptyReferenceResolver())
    let body = readTemplate('view_model_bridge.cc')

    const createNodeSwitch = new IndentedPrinter()
    const createNodeMethods = new IndentedPrinter()

    createNodeMethods.pushIndent()
    createNodeSwitch.pushIndent(3)
    for (const component of getNodeTypes(library)) {
        const createNodeMethod = `create${component}Node`
        createNodeMethods.print(`Ark_NodeHandle ${createNodeMethod}(Ark_Int32 nodeId);`)
        const name = `${PeerGeneratorConfig.cppPrefix}ARKUI_${camelCaseToUpperSnakeCase(component)}`
        createNodeSwitch.print(`case ${name}: return ViewModel::${createNodeMethod}(id);`)
    }
    createNodeSwitch.popIndent(3)
    createNodeMethods.popIndent()

    body = body.replaceAll("%CREATE_NODE_METHODS%", createNodeMethods.getOutput().join("\n"))
    body = body.replaceAll("%CREATE_NODE_SWITCH%", createNodeSwitch.getOutput().join("\n"))
    body = body.replaceAll("%CPP_PREFIX%", PeerGeneratorConfig.cppPrefix)

    result.writeLines(body)
    return result
}

export function completeModifiersContent(content: PrinterLike, basicVersion: number, fullVersion: number, extendedVersion: number): LanguageWriter {
    let result = createLanguageWriter(Language.CPP, createEmptyReferenceResolver())
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

    let result = createLanguageWriter(Language.CPP, createEmptyReferenceResolver())
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
    let result = createLanguageWriter(Language.CPP, createEmptyReferenceResolver())
    result.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers* ${PeerGeneratorConfig.cppPrefix}GetArkUINodeModifiers()`)
    result.print("{")
    result.pushIndent()

    result.print(`static const ${PeerGeneratorConfig.cppPrefix}ArkUINodeModifiers modifiersImpl = {`)
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
    let result = createLanguageWriter(Language.CPP, createEmptyReferenceResolver())
    result.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors* ${PeerGeneratorConfig.cppPrefix}GetArkUIAccessors()`)
    result.print("{")
    result.pushIndent()

    result.print(`static const ${PeerGeneratorConfig.cppPrefix}ArkUIAccessors accessorsImpl = {`)
    result.pushIndent()
    result.concat(lines)
    result.popIndent()
    result.print(`};`)

    result.print(`return &accessorsImpl;`)
    result.popIndent()
    result.print('}')

    return result
}

export function makeTSSerializer(library: PeerLibrary): LanguageWriter {
    let printer = createLanguageWriter(library.language, getReferenceResolver(library))
    printer.writeLines(cStyleCopyright)
    const imports = new ImportsCollector()
    imports.addFeatures(["SerializerBase", "Tags", "RuntimeType", "runtimeType", "isResource", "isInstanceOf"], "./SerializerBase")
    imports.addFeatures(["int32"], "@koalaui/common")
    if (printer.language == Language.TS) {
        imports.addFeatures(["MaterializedBase"], "../MaterializedBase")
        imports.addFeatures(["unsafeCast"], "../shared/generated-utils")
        imports.addFeatures(["nativeModule"], "@koalaui/arkoala")
        imports.addFeatures(["CallbackKind"], "CallbackKind")
        imports.addFeatures(["ResourceHolder", "nullptr"], "@koalaui/interop")
        imports.addFeature('KPointer', '@koalaui/interop')
    }
    if (printer.language == Language.ARKTS) {
        imports.addFeatures(["NativeModule"], "#components")
        imports.addFeatures(["CallbackKind"], "CallbackKind")
        imports.addFeatures(['KStringPtr', 'nullptr', 'KInt', 'KPointer'], '@koalaui/interop')
    }
    imports.print(printer, '')
    writeSerializer(library, printer, "")
    return printer
}

export function makeSerializerForOhos(library: PeerLibrary, nativeModule: { name: string, path: string }, declarationPath?: string): SourceFile {
    // TODO Add Java and migrate arkoala code
    if (library.language == Language.TS || library.language == Language.ARKTS) {
        const destFile = new TsSourceFile("Serializer" + library.language.extension, getReferenceResolver(library))
        destFile.content.nativeModuleAccessor = nativeModule.name
        destFile.imports.addFeatures(["SerializerBase", "RuntimeType", "runtimeType", "CallbackResource"], "./SerializerBase")
        destFile.imports.addFeatures(["DeserializerBase" ], "./DeserializerBase")
        destFile.imports.addFeatures(["int32"], "@koalaui/common")
        destFile.imports.addFeatures(["KPointer", "nullptr"], "@koalaui/interop")
        destFile.imports.addFeatures([nativeModule.name, "CallbackKind"], nativeModule.path)
        writeSerializerFile(library, destFile, "", declarationPath)
        writeDeserializerFile(library, destFile, "", declarationPath)
        const deserializeCallImpls = makeDeserializeAndCall(library, Language.TS, nativeModule.path) as TsSourceFile
        deserializeCallImpls.imports.clear() // TODO fix dependencies
        deserializeCallImpls.imports.addFeatures(["ResourceHolder"], "@koalaui/interop")
        destFile.merge(deserializeCallImpls)
        return destFile
    } else {
        throw new Error(`unsupported language ${library.language}`)
    }
}

export function makeTypeChecker(library: PeerLibrary): { arkts: string, ts: string } {
    let arktsPrinter = createLanguageWriter(Language.ARKTS, createEmptyReferenceResolver())
    writeARKTSTypeCheckers(library, arktsPrinter)
    let tsPrinter = createLanguageWriter(Language.TS, createEmptyReferenceResolver())
    writeTSTypeCheckers(library, tsPrinter)
    return {
        arkts: arktsPrinter.getOutput().join("\n"),
        ts: tsPrinter.getOutput().join("\n"),
    }
}

export function makeConverterHeader(path: string, namespace: string, library: PeerLibrary): LanguageWriter {
    const converter = new CppLanguageWriter(new IndentedPrinter(), library)
    converter.writeLines(cStyleCopyright)
    converter.writeLines(`/*
 * ${warning}
 */
`)
    const includeGuardDefine = makeIncludeGuardDefine(path)
    converter.print(`#ifndef ${includeGuardDefine}`)
    converter.print(`#define ${includeGuardDefine}`)
    converter.print("")

    converter.writeGlobalInclude('optional')
    converter.writeGlobalInclude('cstdlib')
    converter.writeInclude('arkoala_api_generated.h')
    converter.writeInclude('base/log/log_wrapper.h')
    converter.print("")

    const MAX_SELECTORS_IDS = 16
    for(let i = 0; i < MAX_SELECTORS_IDS; i++) {
        converter.print(`#define ${SELECTOR_ID_PREFIX}${i} ${i}`)
    }
    converter.print("")

    converter.pushNamespace(namespace, false)
    converter.print("")
    writeConvertors(library, converter)
    converter.popNamespace(false)
    converter.print(`\n#endif // ${includeGuardDefine}`)
    converter.print("")
    return converter
}

export function makeCSerializers(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {

    const serializers = createLanguageWriter(Language.CPP, library)
    const writeToString = createLanguageWriter(Language.CPP, library)
    serializers.print("\n// Serializers\n")
    writeSerializer(library, serializers, "")
    serializers.print("\n// Deserializers\n")
    writeDeserializer(library, serializers, "")
    library.generateStructs(structs, typedefs, writeToString)

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
    const deserializer = createLanguageWriter(Language.TS, library)
    writeDeserializer(library, deserializer, "")
    return `${cStyleCopyright}
import { runtimeType, Tags, RuntimeType, SerializerBase, CallbackResource } from "./SerializerBase"
import { MaterializedBase } from "./../MaterializedBase"
import { DeserializerBase } from "./DeserializerBase"
import { int32 } from "@koalaui/common"
import { unsafeCast } from "../shared/generated-utils"
import { CallbackKind } from "./CallbackKind"
import { Serializer } from "./Serializer"
import { nativeModule } from "@koalaui/arkoala"
import { KPointer } from "@koalaui/interop"

${deserializer.getOutput().join("\n")}

export function createDeserializer(args: Uint8Array, length: int32): Deserializer { return new Deserializer(args, length) }
`
}

export function makeArkTSDeserializer(library: PeerLibrary): string {
    const printer = createLanguageWriter(Language.ARKTS, library)
    printer.writeLines(cStyleCopyright)

    const imports = new ImportsCollector()
    imports.addFeatures(["runtimeType", "Tags", "RuntimeType", "CallbackResource"], "./SerializerBase")
    imports.addFeature("DeserializerBase", "./DeserializerBase")
    imports.addFeature("int32", "@koalaui/common")

    imports.addFeature("Serializer", "./Serializer")
    imports.addFeatures(["SerializerBase", "Tags", "RuntimeType", "runtimeType", "isResource", "isInstanceOf"], "./SerializerBase")
    imports.addFeatures(["NativeModule"], "#components")
    imports.addFeatures(["CallbackKind"], "CallbackKind")
    imports.addFeatures(['KStringPtr', 'KInt', 'KPointer'], '@koalaui/interop')

    imports.print(printer, '')

    writeDeserializer(library, printer, "")
    return `
${printer.getOutput().join("\n")}
`
}

export function makeApiModifiers(modifiers: string[], accessors: string[], events: string[], nodeTypes: string[]): string {
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

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI {
    ${PrimitiveType.Int32.getText()} version;
} ${PeerGeneratorConfig.cppPrefix}ArkUIGraphicsAPI;

typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI {
${events.join("\n")}
} ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI;

typedef enum ${PeerGeneratorConfig.cppPrefix}Ark_NodeType {
${nodeTypes.join(",\n")}
} ${PeerGeneratorConfig.cppPrefix}Ark_NodeType;

${node_api}
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

export function readLangTemplate(name: string, lang: Language): string {
    return fs.readFileSync(path.join(__dirname, `../templates/${lang.directory}/${name}`), 'utf8')
}

export function makeAPI(
    apiVersion: string,
    headers: string[], modifiers: string[], accessors: string[], events: string[], nodeTypes: string[],
    structs: LanguageWriter, typedefs: IndentedPrinter
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

${headers.join("\n")}

${makeApiModifiers(modifiers, accessors, events, nodeTypes)}

${epilogue}
`
}

export function copyToArkoala(from: string, arkoala: ArkoalaInstall, filters?: string[]) {
    filters = filters?.map(it => path.join(from, it))
    copyDir(path.join(from, 'sig'), arkoala.sig, true, filters)
}

export function copyToLibace(from: string, libace: LibaceInstall) {
    const macros = path.join(from, 'shared', 'arkoala-macros.h')
    fs.copyFileSync(macros, libace.arkoalaMacros)
}

function copyDir(from: string, to: string, recursive: boolean, filters?: string[]) {
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
    let prologue = readLangTemplate('materialized_class_prologue' + lang.extension, lang)
    return `
${prologue}

${importTsInteropTypes}

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
    printDeserializeAndCall(library, writer)
    return writer
}

export function makeCEventsArkoalaImpl(resolver: ReferenceResolver, implData: LanguageWriter, receiversList: LanguageWriter): string {
    const writer = new CppLanguageWriter(new IndentedPrinter(), resolver)
    writer.print(cStyleCopyright)
    writer.writeInclude("arkoala_api_generated.h")
    writer.writeInclude("events.h")
    writer.writeInclude("Serializers.h")
    writer.print("")

    writer.pushNamespace("Generated")
    writer.concat(implData)
    writer.writeMethodImplementation(new Method(
        `GetArkUiEventsAPI`,
        new MethodSignature(createReferenceType(`${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI`), [], undefined, [MethodArgPrintHint.AsConstPointer]),
    ), (writer) => {
        writer.print(`static const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI eventsImpl = {`)
        writer.pushIndent()
        writer.concat(receiversList)
        writer.popIndent()
        writer.print(`};`)
        writer.writeStatement(writer.makeReturn(writer.makeString(`&eventsImpl`)))
    })
    writer.popNamespace()
    return writer.getOutput().join('\n')
}

export function makeCEventsLibaceImpl(implData: PrinterLike, receiversList: PrinterLike, namespace: string, resolver: ReferenceResolver): string {
    const writer = new CppLanguageWriter(new IndentedPrinter(), resolver)
    writer.writeLines(cStyleCopyright)
    writer.print("")
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")
    writer.pushNamespace(namespace, false)

    writer.concat(implData)

    writer.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI* g_OverriddenEventsImpl = nullptr;`)
    writer.writeMethodImplementation(new Method(
        `${PeerGeneratorConfig.cppPrefix}SetArkUiEventsAPI`,
        new NamedMethodSignature(IDLVoidType, [
            createReferenceType(`${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI`)], 
            [`api`], undefined, 
            [undefined, MethodArgPrintHint.AsConstPointer]),
    ), (writer) => {
        writer.writeStatement(writer.makeAssign(`g_OverriddenEventsImpl`, undefined, writer.makeString(`api`), false))
    })

    writer.writeMethodImplementation(new Method(
        `${PeerGeneratorConfig.cppPrefix}GetArkUiEventsAPI`,
        new MethodSignature(createReferenceType(`${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI`), [], undefined, [MethodArgPrintHint.AsConstPointer]),
    ), (writer) => {
        writer.print(`static const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI eventsImpl = {`)
        writer.pushIndent()
        writer.concat(receiversList)
        writer.popIndent()
        writer.print(`};`)
        writer.writeStatement(writer.makeCondition(
            writer.makeNaryOp("!=", [writer.makeString(`g_OverriddenEventsImpl`), writer.makeString(`nullptr`)]),
            writer.makeReturn(writer.makeString(`g_OverriddenEventsImpl`)),
        ))
        writer.writeStatement(writer.makeReturn(writer.makeString(`&eventsImpl`)))
    })

    writer.popNamespace(false)
    return writer.getOutput().join('\n')
}

export function makeCallbacksKinds(library: PeerLibrary, language: Language): string {
    const writer = createLanguageWriter(language, library)
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
