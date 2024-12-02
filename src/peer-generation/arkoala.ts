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
import { makeCJNodeTypes, makeCJSerializer } from "./printers/lang/CJPrinters"
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
import { printNativeModule, printNativeModuleEmpty } from "./printers/NativeModulePrinter"
import { printEvents, printEventsCArkoalaImpl, printEventsCLibaceImpl } from "./printers/EventsPrinter"
import { printGniSources } from "./printers/GniPrinter"
import { printMesonBuild } from "./printers/MesonPrinter"
import {
    printFakeDeclarations as printIdlFakeDeclarations,
    printInterfaces as printIdlInterfaces
} from "./printers/InterfacePrinter"
import { printBuilderClasses } from "./printers/BuilderClassPrinter"
import { ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH } from "./printers/lang/Java"
import { TargetFile } from "./printers/TargetFile"
import { printBridgeCcCustom, printBridgeCcGenerated } from "./printers/BridgeCcPrinter"
import { Language } from "../Language"
import { PeerLibrary } from "./PeerLibrary"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import { printDeclarations, printEnumsImpl } from "./printers/DeclarationPrinter"
import { printConflictedDeclarations } from "./printers/ConflictedDeclarationsPrinter";
import { printNativeModuleRecorder } from "./printers/NativeModuleRecorderPrinter"
import { IndentedPrinter } from "../IndentedPrinter"
import { createLanguageWriter, LanguageWriter } from "./LanguageWriters"
import { printManagedCaller } from "./printers/CallbacksPrinter"

export function generateLibaceFromIdl(config: {
    libaceDestination: string|undefined,
    apiVersion: number,
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
        'sig/arkoala-arkts/arkui/src/generated/use_properties.ts',
        'sig/arkoala-arkts/arkui/src/generated/Finalizable.ts',
        'sig/arkoala-arkts/arkui/src/generated/CallbackRegistry.ts',
        'sig/arkoala-arkts/arkui/src/generated/ComponentBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/MaterializedBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/PeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/NativePeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/arkts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/arkts-stdlib.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/NativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/SerializerBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/DeserializerBase.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/CallbacksChecker.ts',
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
    const fakeDeclarations = printIdlFakeDeclarations(peerLibrary)
    for (const [targetFile, data] of fakeDeclarations) {
        const outComponentFile = arkoala.interface(targetFile)
        writeFile(outComponentFile, data,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl, fake]"
            })
        if (config.verbose) console.log(data)
        arkuiComponentsFiles.push(outComponentFile)
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
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModuleEmpty')),
            printNativeModuleEmpty(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )
        writeFile(
            arkoala.tsLib(new TargetFile('NativeModuleRecorder')),
            printNativeModuleRecorder(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
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
            arkoala.tsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles),
            {
                onlyIntegrated: config.onlyIntegrated,
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
        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(
            arkoala.arktsLib(new TargetFile('ConflictedDeclarations')),
            printConflictedDeclarations(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(
            arkoala.arktsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles),
            {
                onlyIntegrated: config.onlyIntegrated,
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
        writeFile(
            arkoala.arktsLib(new TargetFile('NativeModule', 'arkts')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
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
    } else if (peerLibrary.language == Language.JAVA) {
        writeFile(
            arkoala.javaLib(new TargetFile('NativeModule', ARKOALA_PACKAGE_PATH)),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "NativeBridge"),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )

        const nodeTypes = makeJavaNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.javaLib(nodeTypes.targetFile))

        const arkComponents = makeJavaArkComponents(peerLibrary, context)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        const serializer = makeJavaSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.javaLib(serializer.targetFile))
    }

    if (peerLibrary.language == Language.CJ) {
        writeFile(
            arkoala.cjLib(new TargetFile('NativeModule', '')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "NativeBridge"),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
                message: "producing [idl]"
            }
        )

        const nodeTypes = makeCJNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.cjLib(nodeTypes.targetFile))

        // const arkComponents = makeJavaArkComponents(peerLibrary, context)
        // arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))

        const serializer = makeCJSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.cjLib(serializer.targetFile))
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
