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
import { Language, IndentedPrinter, PeerLibrary, CppLanguageWriter, createEmptyReferenceResolver, LanguageWriter,
    PrinterLike, CppConvertor, LayoutManager, ETSLanguageWriter, wrapCurrentFileDescription } from '@idlizer/core'
import {
    dummyImplementations, gniFile, libraryDeclaration,
    makeArkuiModule, makeCallbacksKinds,
    mesonBuildFile, tsCopyrightAndWarning,
    readLangTemplate,
    printRealAndDummyAccessors,
    printRealAndDummyModifiers, createMaterializedPrinter,
    printGniSources, printMesonBuild,
    printCustomBridge, printGeneratedBridge,
    printBridgeHeaderCustom, printBridgeHeaderGenerated, printKotlinCInteropDefFile,
    printDeclarations, printEnumsImpl, printManagedCaller,
    NativeModule, printArkUILibrariesLoader,
    printCJPredefinedNativeFunctions,
    printPredefinedNativeModule, printTSArkUIGeneratedEmptyNativeModule,
    printTSPredefinedEmptyNativeModule, printGlobal, writeFile, install,
    ModifierFileOptions,
    MultiFileModifiersVisitor,
    MultiFileModifiersVisitorState,
    modifierStructList,
    accessorStructList,
    cStyleCopyright,
    warning,
    appendModifiersCommonPrologue,
    completeModifiersContent,
    makeIncludeGuardDefine,
    SELECTOR_ID_PREFIX,
    writeConvertors,
    HeaderVisitor,
    readTemplate,
    peerGeneratorConfiguration,
    readInteropTypesHeader,
    createGeneratedNativeModulePrinter,
    createSerializerPrinter,
    makeCSerializers,
    createDeserializeAndCallPrinter,
    copyFile,
    printEnumSupportFunctions
} from "@idlizer/libohos"
import { createPeersPrinter } from "./printers/PeersPrinter.js"
import { ArkoalaInstall, createArkoalaInstall, LibaceInstall } from "./ArkoalaInstall.js"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType.js"
import { createInterfacePrinter } from "./printers/ArkoalaInterfacePrinter.js"
import { createComponentsPrinter, printComponentsDeclarations } from "./printers/ComponentsPrinter.js"
import { printModifiers } from "./printers/ModifierPrinter.js"
import { arkoalaLayout, ArkTSComponentsLayout, ArkTsLayout } from "./ArkoalaLayout.js"
import { printUnitTestsAsMultipleFiles } from "./ut/UnittestPrinter.js"
import { printEndToEndTests } from "./ut/E2EPrinter.js"
import { Target } from "./ut/E2EFixturesPrinter.js"

export function generateLibaceUnitTests(config: {
    libaceDestination: string | undefined,
    outDir: string,
    aceTypes?: string,
}, peerLibrary: PeerLibrary) {
    const libace = config.libaceDestination ?
        new LibaceInstall(config.libaceDestination, false) :
        new LibaceInstall(config.outDir, true)

    printUnitTestsAsMultipleFiles(peerLibrary, libace, config.aceTypes)
}

export function generateLibaceEndToEndTests(config: {
    libaceDestination: string | undefined,
    outDir: string,
    aceTypes?: string,
    static: boolean
}, peerLibrary: PeerLibrary) {
    const libace = config.libaceDestination ?
        new LibaceInstall(config.libaceDestination, false) :
        new LibaceInstall(config.outDir, true)

    printEndToEndTests(peerLibrary, libace, config.static ? Target.ARK_TS_1_2 : Target.ETS, config.aceTypes)
}

export function generateLibaceFromIdl(config: {
    libaceDestination: string | undefined,
    apiVersion: number,
    commentedCode: boolean,
    outDir: string,
}, peerLibrary: PeerLibrary) {
    peerLibrary.name = 'libace'
    const libace = config.libaceDestination ?
        new LibaceInstall(config.libaceDestination, false) :
        new LibaceInstall(config.outDir, true)

    const gniSources = printGniSources(peerLibrary)
    fs.writeFileSync(libace.gniComponents, gniFile(gniSources))

    // printDelegatesAsMultipleFiles(peerLibrary, libace, { namespace: "OHOS::Ace::NG::GeneratedModifier" })
    printRealModifiersAsMultipleFiles(peerLibrary, libace, {
        namespaces: {
            base: "OHOS::Ace::NG",
            generated: "OHOS::Ace::NG::GeneratedModifier"
        },
        basicVersion: 1,
        fullVersion: config.apiVersion,
        extendedVersion: 6,
        commentedCode: config.commentedCode,
    })

    const converterNamespace = "OHOS::Ace::NG::Converter"
    const { api, converterHeader } = printUserConverter(libace.userConverterHeader, converterNamespace, config.apiVersion, peerLibrary)
    fs.writeFileSync(libace.generatedArkoalaApi, api)
    fs.writeFileSync(libace.userConverterHeader, converterHeader)

    if (!config.libaceDestination) {
        const mesonBuild = printMesonBuild(peerLibrary)
        fs.writeFileSync(libace.mesonBuild, mesonBuildFile(mesonBuild))
    }
}

export function generateArkoalaFromIdl(config: {
    outDir: string,
    arkoalaDestination: string | undefined,
    nativeBridgeFile: string | undefined,
    lang: Language,
    apiVersion: number,
    dumpSerialized: boolean,
    callLog: boolean,
    verbose: boolean,
    attributeModifierHooks: boolean,
},
    peerLibrary: PeerLibrary) {
    const arkoala = config.arkoalaDestination ?
        createArkoalaInstall({ outDir: config.arkoalaDestination, lang: config.lang, test: false, useMemoM3: peerLibrary.useMemoM3 }) :
        createArkoalaInstall({ outDir: config.outDir, lang: config.lang, test: true, useMemoM3: peerLibrary.useMemoM3 })

    peerLibrary.name = 'arkoala'
    peerLibrary.setFileLayout(arkoalaLayout(peerLibrary, 'Ark'))

    const arkuiComponentsFiles: string[] = []

    // const peers = printPeers(peerLibrary, config.dumpSerialized ?? false)
    // for (const [targetFile, peer] of peers) {
    //     const outPeerFile = arkoala.peer(targetFile)
    //     writeFile(outPeerFile, peer, {
    //         onlyIntegrated: config.onlyIntegrated,
    //         integrated: true,
    //         message: "producing"
    //     })
    // }

    const spreadIfLang = <T>(langs: Language[], ...data: T[]): T[] => {
        if (langs.includes(peerLibrary.language))
            return data
        return []
    }
    const spreadIfNotLang = <T>(langs: Language[], ...data: T[]): T[] => {
        if (!langs.includes(peerLibrary.language))
            return data
        return []
    }
    const installedFiles = install(
        arkoala.managedDir,
        peerLibrary,
        [
            createMaterializedPrinter(config.dumpSerialized),
            createPeersPrinter(config.dumpSerialized),
            createInterfacePrinter(false),
            createComponentsPrinter({attributeModifierHooks: config.attributeModifierHooks}),
            ...spreadIfNotLang([Language.KOTLIN],
                printModifiers,
            ),
            printGlobal,
            createSerializerPrinter(peerLibrary.language, ""),
            createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
            ...spreadIfNotLang([Language.ARKTS],
                createGeneratedNativeModulePrinter(NativeModule.Generated),
            ),
            ...spreadIfLang([Language.ARKTS], printEnumSupportFunctions),
        ]
    )

    if (peerLibrary.language === Language.ARKTS) {
        install(
            arkoala.managedDir,
            peerLibrary,
            [
                createGeneratedNativeModulePrinter(NativeModule.Generated),
            ],
            { customLayout: new LayoutManager(new ArkTSComponentsLayout(peerLibrary)) }
        )
        if (peerLibrary.useMemoM3) {
            peerLibrary.withFileLayout(new ArkTsLayout(peerLibrary, 'Ark', true), () => {
                const installed = install(
                    arkoala.managedSdkDir,
                    peerLibrary,
                    [
                        createInterfacePrinter(true),
                        printComponentsDeclarations,
                    ],
                    {
                        isDeclared: true,
                    }
                )
                writeFile(
                    path.join(arkoala.managedSdkDir, 'framework', 'index' + peerLibrary.language.extension),
                    makeArkuiModule(installed, path.join(arkoala.managedSdkDir, 'framework'))
                )
            })
        }
    }


    if (peerLibrary.language == Language.TS) {
        let enumImpls = peerLibrary.createLanguageWriter()
        printEnumsImpl(peerLibrary, enumImpls)
        enumImpls.printTo(path.join(arkoala.managedDir, 'framework', 'EnumsImpl' + peerLibrary.language.extension))
    }

    if (peerLibrary.language == Language.TS) {
        const declarations = printDeclarations(peerLibrary)
        const index = new IndentedPrinter()
        // index-full.d.ts for ArkTS is a temporary solution for ets pre-processing.
        // So reuse the TS version for now.
        index.print(tsCopyrightAndWarning(readLangTemplate("index-full.d.ts", peerLibrary.language)))
        index.print(readLangTemplate("platform.d.ts", peerLibrary.language))
        for (const data of declarations) {
            index.print(data)
        }
        index.printTo(path.join(arkoala.tsTypesDir, "index-full.d.ts"))
    }
    if (peerLibrary.language == Language.TS) {
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeFile(
            path.join(arkoala.tsArkoalaDir, NativeModule.ArkUI.name + peerLibrary.language.extension),
            arkuiNativeModuleFile.printToString(),
        )
        writeFile(
            path.join(arkoala.tsArkoalaDir, `${NativeModule.ArkUI.name}Empty${peerLibrary.language.extension}`),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModule.ArkUI).printToString(),
        )
        writeFile(
            path.join(arkoala.tsArkoalaDir, NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeFile(
            path.join(arkoala.tsArkoalaDir, `${NativeModule.Test.name}Empty${peerLibrary.language.extension}`),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeFile(
            path.join(arkoala.managedDir, 'framework', `${NativeModule.Generated.name}Empty${peerLibrary.language.extension}`),
            printTSArkUIGeneratedEmptyNativeModule(peerLibrary, NativeModule.Generated).printToString()
        )
        // Improve: restore me
        // writeFile(
        //     arkoala.tsLib(new TargetFile('NativeModuleRecorder')),
        //     printNativeModuleRecorder(peerLibrary),
        //     {
        //         onlyIntegrated: config.onlyIntegrated,
        //         integrated: true,
        //         message: "producing"
        //     }
        // )
        // index not printed
        writeFile(
            path.join(arkoala.managedDir, 'framework', 'index' + peerLibrary.language.extension),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles), path.join(arkoala.managedDir, 'framework')),
        )
        writeFile(path.join(arkoala.managedDir, 'framework', "peers", 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
        )
    } else if (peerLibrary.language === Language.ARKTS) {
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeFile(
            path.join(arkoala.managedDir, 'framework', 'arkts', NativeModule.ArkUI.name + peerLibrary.language.extension),
            arkuiNativeModuleFile.printToString(),
        )
        writeFile(
            path.join(arkoala.managedDir, 'framework', 'arkts', NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        // writeFile(
        //     arkoala.arktsLib(new TargetFile(NativeModuleType.Interop.name, 'arkts')),
        //     printPredefinedNativeModule(peerLibrary, NativeModuleType.Interop).printToString(),
        // )
        writeFile(
            path.join(arkoala.managedDir, 'framework', 'index' + peerLibrary.language.extension),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles), path.join(arkoala.managedDir, 'framework')),
        )
        writeFile(path.join(arkoala.managedDir, 'framework', 'peers', 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
        )
    }

    if (peerLibrary.language == Language.CJ) {
        writeFile(
            path.join(arkoala.managedDir, NativeModule.ArkUI.name + peerLibrary.language.extension),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.ArkUI).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).content.getOutput().join('\n')
            )
        )
        writeFile(
            path.join(arkoala.managedDir, NativeModule.Test.name + peerLibrary.language.extension),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Test).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.Test).content.getOutput().join('\n')
            )
        )
        // writeFile(
        //     arkoala.cjLib(new TargetFile(NativeModule.Interop.name)),
        //     printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Interop).printToString().concat(
        //         printPredefinedNativeModule(peerLibrary, NativeModule.Interop).content.getOutput().join('\n')
        //     )
        // )
        writeFile(path.join(arkoala.managedDir, 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
        )
    }

    if (peerLibrary.language == Language.KOTLIN) {
        writeFile(
            path.join(arkoala.managedDir, NativeModule.ArkUI.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).printToString()
        )
        writeFile(
            path.join(arkoala.managedDir, NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString()
        )
        writeFile(path.join(arkoala.managedDir, 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
        )
    }

    // native code
    writeFile(
        path.join(arkoala.nativeDir, 'bridge_generated.cpp'),
        printGeneratedBridge(peerLibrary, config.callLog ?? false))
    writeFile(
        path.join(arkoala.nativeDir, 'bridge_custom.cpp'),
        printCustomBridge(peerLibrary, config.callLog ?? false))
    if (peerLibrary.language == Language.KOTLIN) {
        const bridgeHeaderGenerated = 'bridge_generated.h'
        const bridgeHeaderCustom = 'bridge_custom.h'
        writeFile(
            path.join(arkoala.nativeDir, bridgeHeaderGenerated),
            printBridgeHeaderGenerated(peerLibrary))
        writeFile(
            path.join(arkoala.nativeDir, bridgeHeaderCustom),
            printBridgeHeaderCustom(peerLibrary))
        writeFile(
            path.join(arkoala.nativeDir, 'interop.def'),
            printKotlinCInteropDefFile([bridgeHeaderGenerated, bridgeHeaderCustom]))
    }

    const { api, serializers } = printSerializers(config.apiVersion, peerLibrary)
    writeFile(path.join(arkoala.nativeDir, 'Serializers.h'), serializers)
    writeFile(path.join(arkoala.nativeDir, 'arkoala_api_generated.h'), api)

    const modifiers = printRealAndDummyModifiers(peerLibrary, true)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    const apiGenFile = "arkoala_api_generated"
    writeFile(
        path.join(arkoala.nativeDir, 'dummy_impl.cpp'),
        dummyImplementations(peerLibrary, modifiers.dummy, accessors.dummy, 1, config.apiVersion, 6, apiGenFile).getOutput().join('\n'),
    )
    writeFile(
        path.join(arkoala.nativeDir, 'real_impl.cpp'),
        dummyImplementations(peerLibrary, modifiers.real, accessors.real, 1, config.apiVersion, 6, apiGenFile).getOutput().join('\n'),
    )
    writeFile(path.join(arkoala.nativeDir, 'library.cpp'), libraryDeclaration())

    writeFile(path.join(arkoala.nativeDir, 'callback_kind.h'), makeCallbacksKinds(peerLibrary, Language.CPP))
    const deserializeAndCallCPPContent = peerLibrary.createLanguageWriter(Language.CPP)
    deserializeAndCallCPPContent.writeLines(cStyleCopyright)
    deserializeAndCallCPPContent.print('#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule')
    createDeserializeAndCallPrinter(peerLibrary.name, Language.CPP)(peerLibrary).forEach(it => {
        const generated = wrapCurrentFileDescription(it.over, it.generate)
        const content = generated instanceof LanguageWriter ? generated : generated.content
        deserializeAndCallCPPContent.concat(content)
    })
    writeFile(path.join(arkoala.nativeDir, 'callback_deserialize_call.cpp'), deserializeAndCallCPPContent.printer.getOutput().join("\n"))
    writeFile(path.join(arkoala.nativeDir, 'callback_managed_caller.cpp'), printManagedCaller('arkoala', peerLibrary).printToString())
}

class ArkoalaMultiFileModifiersVisitor extends MultiFileModifiersVisitor {
    emitRealSync(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions): void {
        const getterDeclarations = library.createLanguageWriter(Language.CPP)

        for (const [slug, state] of this.modifierStateByFile) {
            printModifiersImplFile(this.library, libace.modifierCpp(slug), state, options)
            getterDeclarations.concat(state.getterDeclarations)
        }
        for (const [slug, state] of this.accessorStateByFile) {
            printModifiersImplFile(this.library, libace.accessorCpp(slug), state, options)
            getterDeclarations.concat(state.getterDeclarations)
        }

        const commonFilePath = libace.allModifiers
        const commonFileContent = getterDeclarations
            .concat(modifierStructList(library, this.modifierList))
            .concat(accessorStructList(library, this.accessorList))

        printModifiersCommonImplFile(this.library, commonFilePath, commonFileContent, options)
    }
}

function printModifiersImplFile(library: PeerLibrary, filePath: string, state: MultiFileModifiersVisitorState, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)

    writer.writeInclude(`core/components_ng/base/frame_node.h`)
    writer.writeInclude(`core/interfaces/native/utility/converter.h`)
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, { indent: false })
    }

    writer.concat(state.real)
    writer.concat(state.modifiers)
    writer.concat(state.accessors)

    if (options.namespaces) {
        writer.popNamespace({ indent: false })
    }

    writer.print("")
    writer.printTo(filePath)
}

function printModifiersCommonImplFile(library: PeerLibrary, filePath: string, content: LanguageWriter, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude('arkoala-macros.h')
    writer.writeInclude('arkoala_api_generated.h')
    writer.writeInclude('node_api.h')
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.base, { indent: false })
    }
    writer.concat(appendModifiersCommonPrologue(library))

    if (options.namespaces) {
        writer.popNamespace({ indent: false })
    }

    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, { indent: false })
    }

    writer.concat(completeModifiersContent(library, content, options.basicVersion, options.fullVersion, options.extendedVersion))

    if (options.namespaces) {
        writer.popNamespace({ indent: false })
    }

    writer.print("")
    writer.printTo(filePath)
}

function printRealModifiersAsMultipleFiles(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions) {
    const visitor = new ArkoalaMultiFileModifiersVisitor(library)
    visitor.commentedCode = options.commentedCode
    visitor.printRealAndDummyModifiers()
    visitor.emitRealSync(library, libace, options)
}

function printUserConverter(headerPath: string, namespace: string, apiVersion: number, peerLibrary: PeerLibrary): { api: string, converterHeader: string } {
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()
    const nodeTypesList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList, nodeTypesList)
    visitor.printApiAndDeserializer()

    const structs = new CppLanguageWriter(new IndentedPrinter(), peerLibrary, peerLibrary.createTypeNameConvertor(Language.CPP), ArkPrimitiveTypesInstance)
    const typedefs = new IndentedPrinter()

    const converterHeader = makeConverterHeader(headerPath, namespace, peerLibrary).getOutput().join("\n")
    makeCSerializer(peerLibrary, structs, typedefs)
    const api = makeAPI(apiVersion, apiHeader, modifierList, accessorList, eventsList, nodeTypesList, structs, typedefs)
    return { api, converterHeader }
}

function printSerializers(apiVersion: number, peerLibrary: PeerLibrary): { api: string, serializers: string } {
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()
    const nodeTypesList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList, nodeTypesList)
    visitor.printApiAndDeserializer()

    const structs = new CppLanguageWriter(new IndentedPrinter(), peerLibrary, peerLibrary.createTypeNameConvertor(Language.CPP), ArkPrimitiveTypesInstance)
    const typedefs = new IndentedPrinter()

    const serializers = makeCSerializer(peerLibrary, structs, typedefs)
    const api = makeAPI(apiVersion, apiHeader, modifierList, accessorList, eventsList, nodeTypesList, structs, typedefs)
    return { api, serializers }
}

function makeConverterHeader(path: string, namespace: string, library: PeerLibrary): LanguageWriter {
    const converter = new CppLanguageWriter(new IndentedPrinter(), library,
        library.createTypeNameConvertor(Language.CPP), ArkPrimitiveTypesInstance)
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
    for (let i = 0; i < MAX_SELECTORS_IDS; i++) {
        converter.print(`#define ${SELECTOR_ID_PREFIX}${i} ${i}`)
    }
    converter.print("")

    converter.pushNamespace(namespace, { indent: false })
    converter.print("")
    writeConvertors(library, converter)
    converter.popNamespace({ indent: false })
    converter.print(`\n#endif // ${includeGuardDefine}`)
    converter.print("")
    return converter
}

function makeCSerializer(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {
    return `
${cStyleCopyright}
#ifndef _ARKOALA_SERIALIZERS_H
#define _ARKOALA_SERIALIZERS_H

#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "callbacks.h"
#include "arkoala_api_generated.h"
#include <string>

${makeCSerializers(library, structs, typedefs)}
#endif
`
}

function makeAPI(apiVersion: number,
    headers: PrinterLike, modifiers: PrinterLike, accessors: PrinterLike, events: PrinterLike,
    nodeTypes: PrinterLike, structs: PrinterLike, typedefs: PrinterLike): string {
    return `
${readTemplate('arkoala_api_prologue.h')
            .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, apiVersion.toString())
            .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
            .replaceAll(`%INTEROP_TYPES_HEADER`, readInteropTypesHeader())}

${structs.getOutput().join("\n")}

${typedefs.getOutput().join("\n")}

${headers.getOutput().join("\n")}

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUINodeModifiers {
${modifiers.getOutput().join("\n")}
} ${peerGeneratorConfiguration().cppPrefix}ArkUINodeModifiers;

typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUIAccessors {
${accessors.getOutput().join("\n")}
} ${peerGeneratorConfiguration().cppPrefix}ArkUIAccessors;

typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUIGraphicsAPI {
    ${ArkPrimitiveTypesInstance.Int32.getText()} version;
} ${peerGeneratorConfiguration().cppPrefix}ArkUIGraphicsAPI;

typedef enum ${peerGeneratorConfiguration().cppPrefix}Ark_NodeType {
${nodeTypes.getOutput().join(",\n")}
} ${peerGeneratorConfiguration().cppPrefix}Ark_NodeType;

${readTemplate('arkoala_node_api.h')
            .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)}

${readTemplate("generic_service_api.h")}
${readTemplate('any_api.h')}

${readTemplate('arkoala_api_epilogue.h')
            .replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)}
`
}
