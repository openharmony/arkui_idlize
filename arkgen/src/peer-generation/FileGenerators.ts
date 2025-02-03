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
import { IndentedPrinter, camelCaseToUpperSnakeCase, Language } from "@idlizer/core"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"
import { createLanguageWriter, Method, MethodSignature, NamedMethodSignature, PrinterLike } from "./LanguageWriters"
import { CppLanguageWriter, CppInteropConvertor, LanguageWriter } from "@idlizer/core";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { writeDeserializer, writeDeserializerFile, writeSerializer, writeSerializerFile } from "./printers/SerializerPrinter"
import { SELECTOR_ID_PREFIX, writeConvertors } from "./printers/ConvertorsPrinter"
import { ArkoalaInstall, LibaceInstall } from "../Install"
import { ImportsCollector } from "./ImportsCollector"
import { PeerLibrary } from "./PeerLibrary"
import { writeARKTSTypeCheckers, writeTSTypeCheckers } from "./printers/TypeCheckPrinter"
import { printCallbacksKinds, printCallbacksKindsImports, printDeserializeAndCall } from "./printers/CallbacksPrinter"
import * as idl from "@idlizer/core/idl"
import { createEmptyReferenceResolver, ReferenceResolver } from "@idlizer/core"
import { PrintHint } from "@idlizer/core"
import { SourceFile, TsSourceFile, CJSourceFile } from "./printers/SourceFile"
import { NativeModule } from "./NativeModule"
import { generateStructs } from "./printers/StructPrinter"

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
        createNodeSwitch.print(`case ${name}: return GeneratedViewModel::${createNodeMethod}(id);`)
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
    let printer = createLanguageWriter(library.language, library)
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

export function makeSerializerForOhos(library: PeerLibrary, nativeModule: { name: string, path: string, materializedBasePath: string }, declarationPath?: string): SourceFile {
    const lang = library.language
    // TODO Add Java and migrate arkoala code
    // TODO Complete refactoring to SourceFiles
    if (lang === Language.TS || lang === Language.ARKTS) {
        const destFile = SourceFile.make("Serializer" + lang.extension, lang, library) as TsSourceFile
        writeSerializerFile(library, destFile, "", declarationPath)
        writeDeserializerFile(library, destFile, "", declarationPath)
        // destFile.imports.clear() // TODO fix dependencies
        destFile.imports.addFeatures(["int32", "float32"], "@koalaui/common")
        destFile.imports.addFeatures(["KPointer", "KInt", "KStringPtr", "KUint8ArrayPtr", "nullptr",
            "InteropNativeModule", "SerializerBase", "RuntimeType", "runtimeType", "CallbackResource",
            "DeserializerBase", "wrapSystemCallback", "Finalizable"
        ], "@koalaui/interop")
        destFile.imports.addFeatures([nativeModule.name, "CallbackKind"], nativeModule.path)
        destFile.imports.addFeatures(["MaterializedBase"], nativeModule.materializedBasePath)
        if (lang === Language.TS) {
            destFile.imports.addFeature("unsafeCast", "@koalaui/interop")
        }

        const deserializeCallImpls = SourceFile.makeSameAs(destFile)
        printDeserializeAndCall('ohos', library, deserializeCallImpls)
        deserializeCallImpls.imports.clear() // TODO fix dependencies
        deserializeCallImpls.imports.addFeatures(["ResourceHolder"], "@koalaui/interop")
        destFile.merge(deserializeCallImpls)
        return destFile
    } if (lang === Language.CJ) {
        const destFile = SourceFile.make("Serializer" + lang.extension, lang, library) as CJSourceFile
        // destFile.content.nativeModuleAccessor = nativeModule.name
        writeSerializerFile(library, destFile, "", declarationPath)
        writeDeserializerFile(library, destFile, "", declarationPath)
        const deserializeCallImpls = SourceFile.makeSameAs(destFile)
        printDeserializeAndCall('ohos', library, deserializeCallImpls)
        destFile.merge(deserializeCallImpls)
        return destFile
    } else {
        throw new Error(`unsupported language ${library.language}`)
    }
}

export function makeTypeChecker(library: PeerLibrary, language: Language): string {
    if (language === Language.ARKTS) {
    let arktsPrinter = createLanguageWriter(Language.ARKTS, createEmptyReferenceResolver())
    writeARKTSTypeCheckers(library, arktsPrinter)
        return arktsPrinter.getOutput().join("\n")
    }

    if (language === Language.TS) {
    let tsPrinter = createLanguageWriter(Language.TS, createEmptyReferenceResolver())
    writeTSTypeCheckers(library, tsPrinter)
        return tsPrinter.getOutput().join("\n")
    }

    throw new Error("Only TS/ARKTS are allowed here")
}

export function makeConverterHeader(path: string, namespace: string, library: PeerLibrary): LanguageWriter {
    const converter = new CppLanguageWriter(new IndentedPrinter(), library,
        new CppInteropConvertor(library), ArkPrimitiveTypesInstance)
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

export function makeCSerializersArk(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {
    return `
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "callbacks.h"
#include "arkoala_api_generated.h"
#include <string>

${makeCSerializers(library, structs, typedefs)}
`
}

export function makeCSerializersOhos(libraryName:string, library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {
    return `
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "callbacks.h"
#include "${libraryName}_api_generated.h"
#include <string>

${makeCSerializers(library, structs, typedefs)}
`
}

function makeCSerializers(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {

    const serializers = createLanguageWriter(Language.CPP, library)
    const writeToString = createLanguageWriter(Language.CPP, library)
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
    const deserializer = createLanguageWriter(Language.TS, library)
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
    }
    throw new Error(`Unsupported language "${library.language}"`)
}

export function makeArkTSDeserializer(library: PeerLibrary): string {
    const printer = createLanguageWriter(Language.ARKTS, library)
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
    ${ArkPrimitiveTypesInstance.Int32.getText()} version;
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

export function readTemplate(name: string): string {
    let template = TEMPLATES_CACHE.get(name);
    if (template == undefined) {
        template = fs.readFileSync(path.join(__dirname, `../templates/${name}`), 'utf8')
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
    return fs.readFileSync(path.join(__dirname, `../templates/${lang.directory}/${name}`), 'utf8')
}

export function maybeReadLangTemplate(name: string, lang: Language): string | undefined {
    name = useLangExtIfNeeded(name, lang)
    const file = path.join(__dirname, `../templates/${lang.directory}/${name}`)
    if (!fs.existsSync(file))
        return undefined
    return fs.readFileSync(file, 'utf8')
}

export function getInteropRootPath() {
    return path.resolve(__dirname, "../../external/interop")
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

export function makeApiOhos(
    headers: string[], structs: LanguageWriter, typedefs: IndentedPrinter,
): string {
    return `
${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${headers.join("\n")}
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

export function makeArkuiModule(componentsFiles: string[]): string {
    return componentsFiles.map(file => {
        const basename = path.basename(file)
        const basenameNoExt = basename.replaceAll(path.extname(basename), "")
        return `export * from "./${basenameNoExt}"`
    }).join("\n")
}

export function makeOhosModule(componentsFiles: string[]): string {
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

export function makeCEventsArkoalaImpl(resolver: ReferenceResolver, implData: LanguageWriter, receiversList: LanguageWriter): string {
    const writer = new CppLanguageWriter(new IndentedPrinter(), resolver, new CppInteropConvertor(resolver), ArkPrimitiveTypesInstance)
    writer.print(cStyleCopyright)
    writer.writeInclude("arkoala_api_generated.h")
    writer.writeInclude("events.h")
    writer.writeInclude("Serializers.h")
    writer.print("")

    writer.pushNamespace("Generated")
    writer.concat(implData)
    writer.writeMethodImplementation(new Method(
        `GetArkUiEventsAPI`,
        new MethodSignature(idl.createReferenceType(`${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI`), [], undefined, [PrintHint.AsConstPointer]),
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
    const writer = new CppLanguageWriter(new IndentedPrinter(), resolver, new CppInteropConvertor(resolver), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.print("")
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")
    writer.pushNamespace(namespace, false)

    writer.concat(implData)

    writer.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI* g_OverriddenEventsImpl = nullptr;`)
    writer.writeMethodImplementation(new Method(
        `${PeerGeneratorConfig.cppPrefix}SetArkUiEventsAPI`,
        new NamedMethodSignature(idl.IDLVoidType, [
            idl.createReferenceType(`${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI`)],
            [`api`], undefined,
            [undefined, PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.writeStatement(writer.makeAssign(`g_OverriddenEventsImpl`, undefined, writer.makeString(`api`), false))
    })

    writer.writeMethodImplementation(new Method(
        `${PeerGeneratorConfig.cppPrefix}GetArkUiEventsAPI`,
        new MethodSignature(idl.createReferenceType(`${PeerGeneratorConfig.cppPrefix}ArkUIEventsAPI`), [], undefined, [PrintHint.AsConstPointer]),
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
