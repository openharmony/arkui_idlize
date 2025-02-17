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
import * as idl from "@idlizer/core/idl"
import { Language, IndentedPrinter, PeerLibrary, CppLanguageWriter, createEmptyReferenceResolver, LanguageWriter, ReferenceResolver, Method, MethodSignature, PrintHint, PrinterLike, NamedMethodSignature, printMethodDeclaration, CppConvertor } from '@idlizer/core'
import {
    dummyImplementations, gniFile, libraryCcDeclaration,
    makeArkuiModule, makeCallbacksKinds, makeTSDeserializer, makeArkTSDeserializer,
    makeTSSerializer, makeTypeChecker, mesonBuildFile, tsCopyrightAndWarning,
    makeDeserializeAndCall, readLangTemplate, makeCJDeserializer, makeCJSerializer,
    makeJavaArkComponents, makeJavaSerializer, printRealAndDummyAccessors,
    printRealAndDummyModifiers, printComponents, printPeers, createMaterializedPrinter, printEvents,
    printGniSources, printMesonBuild, printInterfaces as printIdlInterfaces,
    printBuilderClasses, ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH,
    TargetFile, printBridgeCcCustom, printBridgeCcGenerated,
    printDeclarations, printEnumsImpl, printManagedCaller,
    NativeModule, printArkUIGeneratedNativeModule, printArkUILibrariesLoader,
    printCJArkUIGeneratedNativeFunctions, printCJPredefinedNativeFunctions,
    printPredefinedNativeModule, printTSArkUIGeneratedEmptyNativeModule,
    printTSPredefinedEmptyNativeModule, printGlobal, layout, writeFile, writeIntegratedFile, install,
    copyDir,
    ModifierFileOptions,
    MultiFileModifiersVisitor,
    MultiFileModifiersVisitorState,
    modifierStructList,
    accessorStructList,
    cStyleCopyright,
    warning,
    appendModifiersCommonPrologue,
    completeModifiersContent,
    appendViewModelBridge,
    makeAPI,
    makeIncludeGuardDefine,
    SELECTOR_ID_PREFIX,
    writeConvertors,
    HeaderVisitor,
    makeCSerializers,
    readTemplate,
    peerGeneratorConfiguration,
    readInteropTypesHeader,
    CallbackInfo,
    PeerEventKind,
    callbackIdByInfo,
    generateEventReceiverName,
    collectCallbacks,
    groupCallbacks,
} from "@idlizer/libohos"
import { ArkoalaInstall, LibaceInstall } from "./ArkoalaInstall"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"

export function generateLibaceFromIdl(config: {
    libaceDestination: string|undefined,
    apiVersion: number,
    commentedCode: boolean,
    outDir: string
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
    const events = printEventsCLibaceImpl(peerLibrary, {namespace: "OHOS::Ace::NG::GeneratedEvents"})
    fs.writeFileSync(libace.allEvents, events)

    if (!config.libaceDestination) {
        const mesonBuild = printMesonBuild(peerLibrary)
        fs.writeFileSync(libace.mesonBuild, mesonBuildFile(mesonBuild))
    }

    copyToLibace(path.join(__dirname, '..', 'peer_lib'), libace)
}

function copyArkoalaFiles(config: {
        onlyIntegrated: boolean| undefined
    }, arkoala: ArkoalaInstall) {
    copyToArkoala(path.join(__dirname, '..', 'peer_lib'), arkoala, !config.onlyIntegrated ? undefined : [
        'sig/arkoala/framework/native/src/generated/arkoala-macros.h',
        'sig/arkoala/arkui/src/peers/CallbackTransformer.ts',
        'sig/arkoala/arkui/src/shared/generated-utils.ts',
        'sig/arkoala-arkts/arkui/src/generated/use_properties.ts',
        'sig/arkoala-arkts/arkui/src/generated/CallbackRegistry.ts',
        'sig/arkoala-arkts/arkui/src/generated/ComponentBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/PeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/NativePeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/Events.ts',
        'sig/arkoala-arkts/arkui/src/generated/arkts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/arkts-stdlib.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/ArkUINativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/ArkUIGeneratedNativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/TestNativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/CallbacksChecker.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/CallbackTransformer.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/ArkResource.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/dts-exports.ts',
    ])
}

export function generateArkoalaFromIdl(config: {
            outDir: string,
            arkoalaDestination: string|undefined,
            nativeBridgeFile: string|undefined,
            lang: Language,
            apiVersion: number,
            onlyIntegrated: boolean,
            dumpSerialized: boolean,
            callLog: boolean,
            verbose: boolean
        },
        peerLibrary: PeerLibrary) {
    const arkoala = config.arkoalaDestination ?
        new ArkoalaInstall(config.arkoalaDestination, config.lang, false) :
        new ArkoalaInstall(config.outDir, config.lang, true)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))
    arkoala.createDirs(['', ''].map(dir => path.join(arkoala.cjDir, dir)))

    peerLibrary.name = 'arkoala'
    peerLibrary.setFileLayout(layout(peerLibrary, 'Ark', ARKOALA_PACKAGE_PATH))

    const arkuiComponentsFiles: string[] = []

    const peers = printPeers(peerLibrary, config.dumpSerialized ?? false)
    for (const [targetFile, peer] of peers) {
        const outPeerFile = arkoala.peer(targetFile)
        writeFile(outPeerFile, peer, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
    }
    const components = printComponents(peerLibrary)
    for (const [targetFile, component] of components) {
        const outComponentFile = arkoala.component(targetFile)
        if (config.verbose) console.log(component)
        writeFile(outComponentFile, component,{
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
        arkuiComponentsFiles.push(outComponentFile)
    }
    const builderClasses = printBuilderClasses(peerLibrary, config.dumpSerialized)
    for (const [targetFile, builderClass] of builderClasses) {
        const outBuilderFile = arkoala.builderClass(targetFile)
        writeFile(outBuilderFile, builderClass, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
    }

    const interfaces = printIdlInterfaces(peerLibrary)
    for (const [targetFile, data] of interfaces) {
        const outComponentFile = arkoala.interface(targetFile)
        writeFile(outComponentFile, data, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
        arkuiComponentsFiles.push(outComponentFile)
    }

    const installedFiles = install(
        selectOutDir(arkoala, peerLibrary.language),
        peerLibrary,
        [
            createMaterializedPrinter(config.dumpSerialized),
            printGlobal
        ]
    )

    if (peerLibrary.language == Language.TS || peerLibrary.language == Language.ARKTS) {
        let enumImpls = peerLibrary.createLanguageWriter()
        printEnumsImpl(peerLibrary, enumImpls)
        enumImpls.printTo(arkoala.interface(new TargetFile('EnumsImpl' + peerLibrary.language.extension)),)
    }

    if (peerLibrary.language == Language.TS || peerLibrary.language == Language.ARKTS) {
        const declarations = printDeclarations(peerLibrary)
        const index = new IndentedPrinter()
        // index-full.d.ts for ArkTS is a temporary solution for ets pre-processing.
        // So reuse the TS version for now.
        index.print(tsCopyrightAndWarning(readLangTemplate("index-full.d.ts", peerLibrary.language)))
        index.print(readLangTemplate("platform.d.ts", peerLibrary.language))
        for (const data of declarations) {
            index.print(data)
        }
        index.printTo(path.join(arkoala.indexDir(), "index-full.d.ts"))
    }
    if (peerLibrary.language == Language.TS) {
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(NativeModule.ArkUI.name)),
            arkuiNativeModuleFile.printToString(),
        )
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(`${NativeModule.ArkUI.name}Empty`)),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModule.ArkUI).printToString(),
        )
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(NativeModule.Test.name)),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(`${NativeModule.Test.name}Empty`)),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeIntegratedFile(
            arkoala.tsLib(new TargetFile(NativeModule.Generated.name)),
            printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated).printToString()
        )
        writeIntegratedFile(
            arkoala.tsLib(new TargetFile(`${NativeModule.Generated.name}Empty`)),
            printTSArkUIGeneratedEmptyNativeModule(peerLibrary, NativeModule.Generated).printToString()
        )
        // TODO restore me
        // writeFile(
        //     arkoala.tsLib(new TargetFile('NativeModuleRecorder')),
        //     printNativeModuleRecorder(peerLibrary),
        //     {
        //         onlyIntegrated: config.onlyIntegrated,
        //         integrated: true,
        //         message: "producing [idl]"
        //     }
        // )
        writeFile(
            arkoala.tsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles)),
            {
                onlyIntegrated: config.onlyIntegrated
            }
        )
        writeFile(
            arkoala.tsLib(new TargetFile("peer_events")),
            printEvents(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            }
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary).getOutput().join('\n'),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            }
        )
        writeFile(arkoala.peer(new TargetFile('Deserializer')),
            makeTSDeserializer(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )
        writeFile(arkoala.peer(new TargetFile('CallbackKind')),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.peer(new TargetFile('CallbackDeserializeCall')), makeDeserializeAndCall(peerLibrary, Language.TS, "./peers/CallbackDeserializeCall.ts").printToString(),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    } else if (peerLibrary.language === Language.ARKTS) {
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeIntegratedFile(
            arkoala.arktsLib(new TargetFile(NativeModule.ArkUI.name, 'arkts')),
            arkuiNativeModuleFile.printToString(),
        )
        writeIntegratedFile(
            arkoala.arktsLib(new TargetFile(NativeModule.Test.name, 'arkts')),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        // writeIntegratedFile(
        //     arkoala.arktsLib(new TargetFile(NativeModuleType.Interop.name, 'arkts')),
        //     printPredefinedNativeModule(peerLibrary, NativeModuleType.Interop).printToString(),
        // )
        writeIntegratedFile(
            arkoala.arktsLib(new TargetFile(NativeModule.Generated.name, 'arkts')),
            printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated).printToString()
        )
        writeFile(
            arkoala.arktsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles)),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(
            arkoala.arktsLib(new TargetFile("peer_events")),
            printEvents(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            }
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary).getOutput().join('\n'),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            }
        )
        // waiting for es2panda to fix 20642 issue
        writeFile(arkoala.peer(new TargetFile('Deserializer')),
            makeArkTSDeserializer(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )
        writeFile(arkoala.peer(new TargetFile('CallbackKind')),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.peer(new TargetFile('CallbackDeserializeCall')), makeDeserializeAndCall(peerLibrary, Language.ARKTS, "./peers/CallbackDeserializeCall.ts").printToString(),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'arkts')),
            makeTypeChecker(peerLibrary, Language.ARKTS),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'ts')),
            makeTypeChecker(peerLibrary, Language.TS),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    } else if (peerLibrary.language == Language.JAVA) {
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModule.ArkUI.name, ARKOALA_PACKAGE_PATH)),
            printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).printToString(),
        )
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModule.Test.name, ARKOALA_PACKAGE_PATH)),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModule.Generated.name, ARKOALA_PACKAGE_PATH)),
            printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated).printToString()
        )

        const arkComponents = makeJavaArkComponents(peerLibrary)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        const serializer = makeJavaSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.javaLib(serializer.targetFile))
    }

    if (peerLibrary.language == Language.CJ) {
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModule.ArkUI.name)),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.ArkUI).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModule.Test.name)),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Test).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.Test).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModule.Generated.name)),
            printCJArkUIGeneratedNativeFunctions(peerLibrary, NativeModule.Generated).printToString().concat(
                printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModule.Interop.name)),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Interop).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.Interop).content.getOutput().join('\n')
            )
        )
        writeFile(arkoala.peer(new TargetFile('CallbackKind', '')),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.peer(new TargetFile('CallbackDeserializeCall', '')),
            makeDeserializeAndCall(peerLibrary, Language.CJ, "./CallbackDeserializeCall.cj").printToString(),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        // const arkComponents = makeJavaArkComponents(peerLibrary, context)
        // arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        writeFile(arkoala.cjLib(new TargetFile('Serializer')),
            makeCJSerializer(peerLibrary).getOutput().join('\n'),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )
        writeFile(arkoala.cjLib(new TargetFile('Deserializer')),
            makeCJDeserializer(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )
    }

    // native code
    writeFile(
        arkoala.native(new TargetFile('bridge_generated.cc')),
        printBridgeCcGenerated(peerLibrary, config.callLog ?? false),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
        })
    writeFile(
        arkoala.native(new TargetFile('bridge_custom.cc')),
        printBridgeCcCustom(peerLibrary, config.callLog ?? false), {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    const { api, serializers } = printSerializers(config.apiVersion, peerLibrary)
    writeFile(arkoala.native(new TargetFile('Serializers.h')), serializers, {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true,
    })
    writeFile(arkoala.native(new TargetFile('arkoala_api_generated.h')), api, {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true,
    })

    const modifiers = printRealAndDummyModifiers(peerLibrary, true)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    const apiGenFile = "arkoala_api_generated"
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.apiVersion , 6, apiGenFile).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        }
    )
    writeFile(
        arkoala.native(new TargetFile('real_impl.cc')),
        dummyImplementations(modifiers.real, accessors.real, 1, config.apiVersion, 6, apiGenFile).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
        }
    )
    writeFile(arkoala.native(new TargetFile('all_events.cc'),), printEventsCArkoalaImpl(peerLibrary),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
        })
    writeFile(arkoala.native(new TargetFile('library.cc')), libraryCcDeclaration(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    writeFile(arkoala.native(new TargetFile('callback_kind.h')), makeCallbacksKinds(peerLibrary, Language.CPP),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    writeFile(arkoala.native(new TargetFile('callback_deserialize_call.cc')), makeDeserializeAndCall(peerLibrary, Language.CPP, 'callback_deserialize_call.cc').printToString(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    writeFile(arkoala.native(new TargetFile('callback_managed_caller.cc')), printManagedCaller('arkoala', peerLibrary).printToString(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    copyArkoalaFiles({onlyIntegrated: config.onlyIntegrated}, arkoala)
}

function selectOutDir(arkoala:ArkoalaInstall, lang:Language) {
    switch (lang) {
        case Language.TS: return arkoala.tsDir
        case Language.ARKTS: return arkoala.arktsDir
        case Language.JAVA: return arkoala.javaDir
        case Language.CJ: return arkoala.cjDir
    }
    return ''
}

function copyToArkoala(from: string, arkoala: ArkoalaInstall, filters?: string[]) {
    filters = filters?.map(it => path.join(from, it))
    copyDir(path.join(from, 'sig'), arkoala.sig, true, filters)
}

function copyToLibace(from: string, libace: LibaceInstall) {
    const macros = path.join(from, 'shared', 'arkoala-macros.h')
    fs.copyFileSync(macros, libace.arkoalaMacros)
}

class ArkoalaMultiFileModifiersVisitor extends MultiFileModifiersVisitor {
    emitRealSync(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions): void {
        const modifierList = library.createLanguageWriter(Language.CPP)
        const accessorList = library.createLanguageWriter(Language.CPP)
        const getterDeclarations = library.createLanguageWriter(Language.CPP)

        for (const [slug, state] of this.stateByFile) {
            if (state.hasModifiers)
                printModifiersImplFile(libace.modifierCpp(slug), state, options)
            if (state.hasAccessors)
                printModifiersImplFile(libace.accessorCpp(slug), state, options)
            modifierList.concat(state.modifierList)
            accessorList.concat(state.accessorList)
            getterDeclarations.concat(state.getterDeclarations)
        }

        const commonFilePath = libace.allModifiers
        const commonFileContent = getterDeclarations
            .concat(modifierStructList(modifierList))
            .concat(accessorStructList(accessorList))

        printModifiersCommonImplFile(commonFilePath, commonFileContent, options)
        printApiImplFile(library, libace.viewModelBridge, options)
    }
}

function printModifiersImplFile(filePath: string, state: MultiFileModifiersVisitorState, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new CppConvertor(createEmptyReferenceResolver()), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)

    writer.writeInclude(`core/components_ng/base/frame_node.h`)
    writer.writeInclude(`core/interfaces/native/utility/converter.h`)
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, false)
    }

    writer.concat(state.real)
    writer.concat(state.modifiers)
    writer.concat(state.accessors)

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.print("")
    writer.printTo(filePath)
}

function printModifiersCommonImplFile(filePath: string, content: LanguageWriter, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new CppConvertor(createEmptyReferenceResolver()), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude('arkoala-macros.h')
    writer.writeInclude('arkoala_api_generated.h')
    writer.writeInclude('node_api.h')
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.base, false)
    }
    writer.concat(appendModifiersCommonPrologue())

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, false)
    }

    writer.concat(completeModifiersContent(content, options.basicVersion, options.fullVersion, options.extendedVersion))

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.print("")
    writer.printTo(filePath)
}

function printApiImplFile(library: PeerLibrary, filePath: string, options: ModifierFileOptions) {
    const writer = new CppLanguageWriter(new IndentedPrinter(), library, new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.writeMultilineCommentBlock(warning)
    writer.print("")

    writer.writeInclude('arkoala_api_generated.h')
    writer.writeInclude('base/utils/utils.h')
    writer.writeInclude('core/pipeline/base/element_register.h')
    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.base, false)
    }
    writer.concat(appendViewModelBridge(library))

    if (options.namespaces) {
        writer.popNamespace(false)
    }

    writer.printTo(filePath)
}

function printRealModifiersAsMultipleFiles(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions) {
    const visitor = new ArkoalaMultiFileModifiersVisitor(library)
    visitor.commentedCode = options.commentedCode
    visitor.printRealAndDummyModifiers()
    visitor.emitRealSync(library, libace, options)
}

function printUserConverter(headerPath: string, namespace: string, apiVersion: number, peerLibrary: PeerLibrary) :
        {api: string, converterHeader: string}
{
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()
    const nodeTypesList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList, nodeTypesList)
    visitor.printApiAndDeserializer()

    const structs = new CppLanguageWriter(new IndentedPrinter(), peerLibrary, new CppConvertor(peerLibrary), ArkPrimitiveTypesInstance)
    const typedefs = new IndentedPrinter()

    const converterHeader = makeConverterHeader(headerPath, namespace, peerLibrary).getOutput().join("\n")
    makeCSerializer(peerLibrary, structs, typedefs)
    const apiText = makeAPI(apiHeader.getOutput(), modifierList.getOutput(), accessorList.getOutput(), eventsList.getOutput(), nodeTypesList.getOutput(), structs, typedefs)
    const api = makeApi(apiVersion.toString(), apiText)
    return {api, converterHeader}
}

function printSerializers(apiVersion: number, peerLibrary: PeerLibrary): {api: string, serializers: string} {
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()
    const nodeTypesList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList, nodeTypesList)
    visitor.printApiAndDeserializer()

    const structs = new CppLanguageWriter(new IndentedPrinter(), peerLibrary, new CppConvertor(peerLibrary), ArkPrimitiveTypesInstance)
    const typedefs = new IndentedPrinter()

    const serializers = makeCSerializer(peerLibrary, structs, typedefs)
    const apiText = makeAPI(apiHeader.getOutput(), modifierList.getOutput(), accessorList.getOutput(), eventsList.getOutput(), nodeTypesList.getOutput(), structs, typedefs)
    const api = makeApi(apiVersion.toString(), apiText)
    return {api, serializers}
}

function makeConverterHeader(path: string, namespace: string, library: PeerLibrary): LanguageWriter {
    const converter = new CppLanguageWriter(new IndentedPrinter(), library,
        new CppConvertor(library), ArkPrimitiveTypesInstance)
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

function makeCSerializer(library: PeerLibrary, structs: LanguageWriter, typedefs: IndentedPrinter): string {
    return `
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "callbacks.h"
#include "arkoala_api_generated.h"
#include <string>

${makeCSerializers(library, structs, typedefs)}
`
}

function makeApi(apiVersion: string, text: string) {
    let prologue = readTemplate('arkoala_api_prologue.h')
    let epilogue = readTemplate('arkoala_api_epilogue.h')

    prologue = prologue
        .replaceAll(`%ARKUI_FULL_API_VERSION_VALUE%`, apiVersion)
        .replaceAll(`%CPP_PREFIX%`, peerGeneratorConfiguration().cppPrefix)
        .replaceAll(`%INTEROP_TYPES_HEADER`,
           readInteropTypesHeader()
        )
    epilogue = epilogue
        .replaceAll("%CPP_PREFIX%", peerGeneratorConfiguration().cppPrefix)

    return `
${prologue}

${text}

${epilogue}
`
}

function printEventsCArkoalaImpl(library: PeerLibrary): string {
    const visitor = new CEventsVisitor(library, false)
    visitor.print()

    const writer = new CppLanguageWriter(new IndentedPrinter(), library, new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.print(cStyleCopyright)
    writer.writeInclude("arkoala_api_generated.h")
    writer.writeInclude("events.h")
    writer.writeInclude("Serializers.h")
    writer.print("")

    writer.pushNamespace("Generated")
    writer.concat(visitor.impl)
    writer.writeMethodImplementation(new Method(
        `GetArkUiEventsAPI`,
        new MethodSignature(idl.createReferenceType(`${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI`), [], undefined, [PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI eventsImpl = {`)
        writer.pushIndent()
        writer.concat(visitor.receiversList)
        writer.popIndent()
        writer.print(`};`)
        writer.writeStatement(writer.makeReturn(writer.makeString(`&eventsImpl`)))
    })
    writer.popNamespace()
    return writer.getOutput().join('\n')
}

function printEventsCLibaceImpl(library: PeerLibrary, options: { namespace: string }): string {
    const visitor = new CEventsVisitor(library, true)
    visitor.print()

    const writer = new CppLanguageWriter(new IndentedPrinter(), library, new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.print("")
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")
    writer.pushNamespace(options.namespace, false)

    writer.concat(visitor.impl)

    writer.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI* g_OverriddenEventsImpl = nullptr;`)
    writer.writeMethodImplementation(new Method(
        `${peerGeneratorConfiguration().cppPrefix}SetArkUiEventsAPI`,
        new NamedMethodSignature(idl.IDLVoidType, [
            idl.createReferenceType(`${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI`)],
            [`api`], undefined,
            [undefined, PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.writeStatement(writer.makeAssign(`g_OverriddenEventsImpl`, undefined, writer.makeString(`api`), false))
    })

    writer.writeMethodImplementation(new Method(
        `${peerGeneratorConfiguration().cppPrefix}GetArkUiEventsAPI`,
        new MethodSignature(idl.createReferenceType(`${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI`), [], undefined, [PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI eventsImpl = {`)
        writer.pushIndent()
        writer.concat(visitor.receiversList)
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

export class CEventsVisitor {
    readonly impl: CppLanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), ArkPrimitiveTypesInstance)
    readonly receiversList: LanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), ArkPrimitiveTypesInstance)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly isEmptyImplementation: boolean,
    ) {
    }

    private printEventsKinds(callbacks: CallbackInfo[]) {
        if (this.isEmptyImplementation)
            return
        this.impl.print(`enum ${PeerEventKind} {`)
        this.impl.pushIndent()
        callbacks.forEach((callback, index) => {
            this.impl.print(`Kind${callbackIdByInfo(callback)} = ${index},`)
        })
        this.impl.popIndent()
        this.impl.print('};\n')
    }

    private printEventImpl(namespace: string, event: CallbackInfo) {
        this.library.setCurrentContext(`${namespace}.${event.methodName}Impl`)
        this.printEventMethodDeclaration(event)
        this.impl.print("{")
        this.impl.pushIndent()
        if (this.isEmptyImplementation) {
            this.impl.print("// GENERATED EMPTY IMPLEMENTATION")
        } else {
            this.impl.print(`EventBuffer _eventBuffer;`)
            this.impl.print(`Serializer _eventBufferSerializer(_eventBuffer.buffer, sizeof(_eventBuffer.buffer));`)
            this.impl.print(`_eventBufferSerializer.writeInt32(Kind${callbackIdByInfo(event)});`)
            this.impl.print(`_eventBufferSerializer.writeInt32(nodeId);`)
            this.printSerializers(event)
            this.impl.print(`sendEvent(&_eventBuffer);`)
        }
        this.impl.popIndent()
        this.impl.print('}')
        this.library.setCurrentContext(undefined)
    }

    private printReceiver(componentName: string, callbacks: CallbackInfo[]) {
        const receiver = generateEventReceiverName(componentName)
        this.impl.print(`const ${receiver}* Get${componentName}EventsReceiver()`)
        this.impl.print("{")
        this.impl.pushIndent()
        this.impl.print(`static const ${receiver} ${receiver}Impl {`)
        this.impl.pushIndent()
        for (const callback of callbacks) {
            this.impl.print(`${callback.componentName}::${callback.methodName}Impl,`)
        }
        this.impl.popIndent()
        this.impl.print(`};\n`)

        this.impl.print(`return &${receiver}Impl;`)
        this.impl.popIndent()
        this.impl.print(`}`)
    }

    private printReceiversList(callbacks: Map<string, CallbackInfo[]>) {
        for (const componentName of callbacks.keys()) {
            this.receiversList.print(`Get${componentName}EventsReceiver,`)
        }
    }

    print() {
        const listedCallbacks = collectCallbacks(this.library)
        const groupedCallbacks = groupCallbacks(listedCallbacks)
        this.printEventsKinds(listedCallbacks)
        for (const [name, callbacks] of groupedCallbacks) {
            this.impl.pushNamespace(name, false)
            for (const callback of callbacks) {
                this.printEventImpl(name, callback)
            }
            this.impl.popNamespace(false)
        }
        for (const [name, callbacks] of groupedCallbacks) {
            this.printReceiver(name, callbacks)
        }
        this.printReceiversList(groupedCallbacks)
    }

    protected printEventMethodDeclaration(event: CallbackInfo) {
        const args = ["Ark_Int32 nodeId",
            ...event.args.map(it =>
                `const ${this.impl.getNodeName(idl.maybeOptional(this.library.typeConvertor(it.name, it.type, it.nullable).nativeType(), it.nullable))} ${it.name}`)]
        printMethodDeclaration(this.impl.printer, "void", `${event.methodName}Impl`, args)
    }

    protected printSerializers(event: CallbackInfo): void {
        for (const arg of event.args) {
            const convertor = this.library.typeConvertor(arg.name, arg.type, arg.nullable)
            convertor.convertorSerialize(`_eventBuffer`, arg.name, this.impl)
        }
    }
}
