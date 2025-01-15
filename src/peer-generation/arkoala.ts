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

import { ArkoalaInstall, LibaceInstall } from "../Install"
import {
    copyToArkoala,
    copyToLibace,
    dummyImplementations,
    gniFile,
    libraryCcDeclaration,
    makeArkuiModule,
    makeCallbacksKinds,
    makeTSDeserializer,
    makeArkTSDeserializer,
    makeTSSerializer,
    makeTypeChecker,
    mesonBuildFile,
    tsCopyrightAndWarning,
    makeDeserializeAndCall,
    readLangTemplate,
} from "./FileGenerators"
import { makeCJDeserializer, makeCJNodeTypes, makeCJSerializer } from "./printers/lang/CJPrinters"
import { makeJavaArkComponents, makeJavaNodeTypes, makeJavaSerializer } from "./printers/lang/JavaPrinters"
import {
    printRealAndDummyAccessors,
    printRealAndDummyModifiers,
    printRealModifiersAsMultipleFiles
} from "./printers/ModifierPrinter"

import { printComponents } from "./printers/ComponentsPrinter"
import { printPeers } from "./printers/PeersPrinter"
import { printMaterialized } from "./printers/MaterializedPrinter"
import { printSerializers, printUserConverter } from "./printers/HeaderPrinter"
import { printNodeTypes } from "./printers/NodeTypesPrinter"
import { printEvents, printEventsCArkoalaImpl, printEventsCLibaceImpl } from "./printers/EventsPrinter"
import { printGniSources } from "./printers/GniPrinter"
import { printMesonBuild } from "./printers/MesonPrinter"
import {
    printInterfaces as printIdlInterfaces
} from "./printers/InterfacePrinter"
import { printBuilderClasses } from "./printers/BuilderClassPrinter"
import { ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH } from "./printers/lang/Java"
import { TargetFile } from "./printers/TargetFile"
import { printBridgeCcCustom, printBridgeCcGenerated } from "./printers/BridgeCcPrinter"
import { Language, IndentedPrinter } from '@idlize/core'
import { PeerLibrary } from "./PeerLibrary"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import { printDeclarations, printEnumsImpl } from "./printers/DeclarationPrinter"
import { createLanguageWriter, LanguageWriter } from "./LanguageWriters"
import { printManagedCaller } from "./printers/CallbacksPrinter"
import { NativeModuleType } from "./NativeModuleType"
import { printArkUIGeneratedNativeModule, printArkUILibrariesLoader, printCJArkUIGeneratedNativeFunctions, printCJPredefinedNativeFunctions, printPredefinedNativeModule, printTSArkUIGeneratedEmptyNativeModule, printTSPredefinedEmptyNativeModule } from "./printers/NativeModulePrinter"
import { makeGetFunctionRuntimeType } from "./printers/lang/CJIdlUtils"
import { printGlobal } from "./printers/GlobalScopePrinter"

export function generateLibaceFromIdl(config: {
    libaceDestination: string|undefined,
    apiVersion: number,
    commentedCode: boolean,
    outDir: string
}, peerLibrary: PeerLibrary) {
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

function writeFile(filename: string, content: string | LanguageWriter, config: { // TODO make content a string or a writer only
        onlyIntegrated: boolean,
        integrated?: boolean,
        message?: string
    }): boolean {
    if (config.integrated || !config.onlyIntegrated) {
        if (config.message)
            console.log(config.message, filename)
        fs.mkdirSync(path.dirname(filename), { recursive: true })
        if (typeof content !== "string") {
            content = content.getOutput().join("\n")
        }
        fs.writeFileSync(filename, content)
        return true
    }
    return false
}

function writeIntegratedFile(filename: string, content: string | LanguageWriter) {
    writeFile(filename, content, {
        onlyIntegrated: false,
        integrated: true
    })
}

function copyArkoalaFiles(config: {
        onlyIntegrated: boolean| undefined
    }, arkoala: ArkoalaInstall) {
    copyToArkoala(path.join(__dirname, '..', 'peer_lib'), arkoala, !config.onlyIntegrated ? undefined : [
        'sig/arkoala/framework/native/src/generated/SerializerBase.h',
        'sig/arkoala/framework/native/src/generated/DeserializerBase.h',
        'sig/arkoala/framework/native/src/generated/Interop.h',
        'sig/arkoala/framework/native/src/generated/arkoala-macros.h',
        'sig/arkoala/arkui/src/peers/SerializerBase.ts',
        'sig/arkoala/arkui/src/peers/DeserializerBase.ts',
        'sig/arkoala/arkui/src/peers/CallbackTransformer.ts',
        'sig/arkoala-arkts/arkui/src/generated/use_properties.ts',
        'sig/arkoala-arkts/arkui/src/generated/Finalizable.ts',
        'sig/arkoala-arkts/arkui/src/generated/CallbackRegistry.ts',
        'sig/arkoala-arkts/arkui/src/generated/ComponentBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/MaterializedBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/PeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/NativePeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/Events.ts',
        'sig/arkoala-arkts/arkui/src/generated/arkts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/arkts/NativeModuleLoader.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/arkts-stdlib.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/ArkUINativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/ArkUIGeneratedNativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/TestNativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/SerializerBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/DeserializerBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/CallbacksChecker.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/CallbackTransformer.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/ArkResource.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/dts-exports.ts',
        'sig/arkoala-arkts/arkui/src/generated/shared/generated-utils.ts',
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

    const context = {
        language: config.lang,
        synthesizedTypes: undefined,
        imports: undefined
    }
    const arkuiComponentsFiles: string[] = []
    const globalScopeFiles: string[] = []

    const peers = printPeers(peerLibrary, context, config.dumpSerialized ?? false)
    for (const [targetFile, peer] of peers) {
        const outPeerFile = arkoala.peer(targetFile)
        writeFile(outPeerFile, peer, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
    }
    const components = printComponents(peerLibrary, context)
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
    const globals = printGlobal(peerLibrary)
    for (const [targetFile, content] of globals) {
        const outGlobalFile = arkoala.globalFile(targetFile)
        writeFile(outGlobalFile, content, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
        globalScopeFiles.push(outGlobalFile)
    }
    const builderClasses = printBuilderClasses(peerLibrary, context, config.dumpSerialized)
    for (const [targetFile, builderClass] of builderClasses) {
        const outBuilderFile = arkoala.builderClass(targetFile)
        writeFile(outBuilderFile, builderClass, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
    }
    const materialized = printMaterialized(peerLibrary, context, config.dumpSerialized)
    for (const [targetFile, materializedClass] of materialized) {
        const outMaterializedFile = arkoala.materialized(targetFile)
        writeFile(outMaterializedFile, materializedClass, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing [idl]"
        })
        arkuiComponentsFiles.push(outMaterializedFile)
    }
    if (PeerGeneratorConfig.needInterfaces) {
        const interfaces = printIdlInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetFile)
            writeFile(outComponentFile, data, {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            })
            arkuiComponentsFiles.push(outComponentFile)
        }
    }

    if (peerLibrary.language == Language.TS || peerLibrary.language == Language.ARKTS) {
        let enumImpls = createLanguageWriter(peerLibrary.language, peerLibrary)
        printEnumsImpl(peerLibrary, enumImpls)
        enumImpls.printTo(arkoala.tsArkoalaLib(new TargetFile('EnumsImpl')),)
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
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModuleType.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(NativeModuleType.ArkUI.name)),
            arkuiNativeModuleFile.printToString(),
        )
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(`${NativeModuleType.ArkUI.name}Empty`)),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModuleType.ArkUI).printToString(),
        )
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(NativeModuleType.Test.name)),
            printPredefinedNativeModule(peerLibrary, NativeModuleType.Test).printToString(),
        )
        writeIntegratedFile(
            arkoala.tsArkoalaLib(new TargetFile(`${NativeModuleType.Test.name}Empty`)),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModuleType.Test).printToString(),
        )
        writeIntegratedFile(
            arkoala.tsLib(new TargetFile(NativeModuleType.Generated.name)),
            printArkUIGeneratedNativeModule(peerLibrary, NativeModuleType.Generated).printToString()
        )
        writeIntegratedFile(
            arkoala.tsLib(new TargetFile(`${NativeModuleType.Generated.name}Empty`)),
            printTSArkUIGeneratedEmptyNativeModule(peerLibrary, NativeModuleType.Generated).printToString()
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
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(
            arkoala.tsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles.concat(globalScopeFiles)),
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
            makeTSSerializer(peerLibrary),
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
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModuleType.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeIntegratedFile(
            arkoala.arktsLib(new TargetFile(NativeModuleType.ArkUI.name, 'arkts')),
            arkuiNativeModuleFile.printToString(),
        )
        writeIntegratedFile(
            arkoala.arktsLib(new TargetFile(NativeModuleType.Test.name, 'arkts')),
            printPredefinedNativeModule(peerLibrary, NativeModuleType.Test).printToString(),
        )
        // writeIntegratedFile(
        //     arkoala.arktsLib(new TargetFile(NativeModuleType.Interop.name, 'arkts')),
        //     printPredefinedNativeModule(peerLibrary, NativeModuleType.Interop).printToString(),
        // )
        writeIntegratedFile(
            arkoala.arktsLib(new TargetFile(NativeModuleType.Generated.name, 'arkts')),
            printArkUIGeneratedNativeModule(peerLibrary, NativeModuleType.Generated).printToString()
        )
        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(
            arkoala.arktsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles.concat(globalScopeFiles)),
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
            makeTSSerializer(peerLibrary),
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
            makeTypeChecker(peerLibrary).arkts,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'ts')),
            makeTypeChecker(peerLibrary).ts,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.peer(new TargetFile('CallbackKind')),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    } else if (peerLibrary.language == Language.JAVA) {
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModuleType.ArkUI.name, ARKOALA_PACKAGE_PATH)),
            printPredefinedNativeModule(peerLibrary, NativeModuleType.ArkUI).printToString(),
        )
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModuleType.Test.name, ARKOALA_PACKAGE_PATH)),
            printPredefinedNativeModule(peerLibrary, NativeModuleType.Test).printToString(),
        )
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModuleType.Generated.name, ARKOALA_PACKAGE_PATH)),
            printArkUIGeneratedNativeModule(peerLibrary, NativeModuleType.Generated).printToString()
        )

        const nodeTypes = makeJavaNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.javaLib(nodeTypes.targetFile))

        const arkComponents = makeJavaArkComponents(peerLibrary, context)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        const serializer = makeJavaSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.javaLib(serializer.targetFile))
    }

    if (peerLibrary.language == Language.CJ) {
        writeIntegratedFile( 
            arkoala.cjLib(new TargetFile(NativeModuleType.ArkUI.name)),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModuleType.ArkUI).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModuleType.ArkUI).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModuleType.Test.name)),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModuleType.Test).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModuleType.Test).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModuleType.Generated.name)),
            printCJArkUIGeneratedNativeFunctions(peerLibrary, NativeModuleType.Generated).printToString().concat(
                printArkUIGeneratedNativeModule(peerLibrary, NativeModuleType.Generated).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            arkoala.cjLib(new TargetFile(NativeModuleType.Interop.name)),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModuleType.Interop).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModuleType.Interop).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile( 
            arkoala.cjLib(new TargetFile('Ark_Object')), makeGetFunctionRuntimeType(peerLibrary)
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
        const nodeTypes = makeCJNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.cjLib(nodeTypes.targetFile))

        // const arkComponents = makeJavaArkComponents(peerLibrary, context)
        // arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        const serializer = makeCJSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.cjLib(serializer.targetFile))
        const deserializer = makeCJDeserializer(peerLibrary)
        deserializer.writer.printTo(arkoala.cjLib(deserializer.targetFile))
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
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.apiVersion , 6).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        }
    )
    writeFile(
        arkoala.native(new TargetFile('real_impl.cc')),
        dummyImplementations(modifiers.real, accessors.real, 1, config.apiVersion, 6).getOutput().join('\n'),
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
    writeFile(arkoala.native(new TargetFile('callback_managed_caller.cc')), printManagedCaller(peerLibrary).printToString(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    copyArkoalaFiles({onlyIntegrated: config.onlyIntegrated}, arkoala)
}
