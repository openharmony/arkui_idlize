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
    dummyImplementations,
    makeArkuiModule,
    makeTSSerializer,
    makeTSDeserializer,
    gniFile,
    mesonBuildFile,
    copyToLibace,
    libraryCcDeclaration,
    makeCJSerializer,
    makeTypeCheckerFromDTS
} from "./FileGenerators"
import { makeJavaArkComponents, makeJavaNodeTypes, makeJavaSerializer } from "./printers/lang/JavaPrinters"
import { PeerLibrary } from "./PeerLibrary"
import { printRealAndDummyAccessors, printRealModifiersAsMultipleFiles } from "./printers/ModifierPrinter"
import { printRealAndDummyModifiers } from "./printers/ModifierPrinter"

import { printComponents } from "./printers/ComponentsPrinter"
import { printPeers } from "./printers/PeersPrinter"
import { printMaterialized } from "./printers/MaterializedPrinter"
import { printSerializers, printUserConverter } from "./printers/HeaderPrinter"
import { printNodeTypes } from "./printers/NodeTypesPrinter"
import { printNativeModule, printNativeModuleEmpty } from "./printers/NativeModulePrinter"
import { printEvents, printEventsCArkoalaImpl, printEventsCLibaceImpl } from "./printers/EventsPrinter"
import { printGniSources } from "./printers/GniPrinter"
import { printMesonBuild } from "./printers/MesonPrinter"
import { printInterfaces } from "./printers/InterfacePrinter"
import {
    printInterfaces as printIdlInterfaces,
    printFakeDeclarations as printIdlFakeDeclarations
} from "./idl/InterfacePrinter"
import { printConflictedDeclarations } from "./printers/ConflictedDeclarationsPrinter"
import { printFakeDeclarations } from "./printers/FakeDeclarationsPrinter"
import { printBuilderClasses } from "./printers/BuilderClassPrinter"
import { ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH } from "./printers/lang/Java"
import { TargetFile } from "./printers/TargetFile"
import { printBridgeCcCustom, printBridgeCcGenerated } from "./printers/BridgeCcPrinter"
import { createPrinterContext } from "./printers/PrinterContext/PrinterContextImpl"
import { Language } from "../Language"
import { IdlPeerLibrary } from "./idl/IdlPeerLibrary"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import { printDeclarations } from "./printers/DeclarationPrinter"

export function generateLibace(config: {
    libaceDestination: string | undefined,
    outDir: string,
    apiVersion: number
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

export function generateLibaceFromIdl(config: {
    libaceDestination: string|undefined,
    apiVersion: number,
    outDir: string
}, peerLibrary: IdlPeerLibrary) {
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

function writeFile(filename: string, content: string, config: {
        onlyIntegrated: boolean,
        integrated?: boolean,
        message?: string
    }): boolean {
    if (config.integrated || !config.onlyIntegrated) {
        if (config.message)
            console.log(config.message, filename)
        fs.mkdirSync(path.dirname(filename), { recursive: true })
        fs.writeFileSync(filename, content)
        return true
    }
    return false
}

export function generateArkoala(config: {
        arkoalaDestination: string|undefined,
        dumpSerialized: boolean,
        nativeBridgeFile: string|undefined,
        verbose: boolean,
        onlyIntegrated: boolean,
        callLog: boolean,
        apiVersion: number,
        outDir: string,
        lang: Language
    }, peerLibrary: PeerLibrary) {
    const arkoala = config.arkoalaDestination ?
        new ArkoalaInstall(config.arkoalaDestination, config.lang, false) :
        new ArkoalaInstall(config.outDir, config.lang, true)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))
    arkoala.createDirs(['', ''].map(dir => path.join(arkoala.cjDir, dir)))

    const arkuiComponentsFiles: string[] = []
    const context = createPrinterContext(peerLibrary.declarationTable)

    const peers = printPeers(peerLibrary, context, config.dumpSerialized ?? false)
    for (const [targetFile, peer] of peers) {
        const outPeerFile = arkoala.peer(targetFile)
        writeFile(outPeerFile, peer, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing"
        })
    }

    const components = printComponents(peerLibrary, context)
    for (const [targetFile, component] of components) {
        const outComponentFile = arkoala.component(targetFile)
        writeFile(outComponentFile, component,  {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
            message: "producing"
        })
        if (config.verbose) console.log(component)
        arkuiComponentsFiles.push(outComponentFile)
    }

    const builderClasses = printBuilderClasses(peerLibrary, context, config.dumpSerialized ?? false)
    for (const [targetFile, builderClass] of builderClasses) {
        const outBuilderFile = arkoala.builderClass(targetFile)
        fs.writeFileSync(outBuilderFile, builderClass)
        arkuiComponentsFiles.push(outBuilderFile)
    }

    const materialized = printMaterialized(peerLibrary, context, config.dumpSerialized ?? false)
    for (const [targetFile, materializedClass] of materialized) {
        const outMaterializedFile = arkoala.materialized(targetFile)
        if (writeFile(outMaterializedFile, materializedClass,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: peerLibrary.declarationTable.language === Language.ARKTS
            })) {
            arkuiComponentsFiles.push(outMaterializedFile)
        }
    }

    // NativeModule
    if (config.lang === Language.TS) {
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModuleEmpty')),
            printNativeModuleEmpty(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            })
        writeFile(
            arkoala.tsArkoalaLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    }
    else if (config.lang === Language.JAVA) {
        writeFile(
            arkoala.javaLib(new TargetFile('NativeModule', ARKOALA_PACKAGE_PATH)),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
            {
                onlyIntegrated: config.onlyIntegrated
            }
        )
    } else if (config.lang === Language.CJ) {
        writeFile(
            arkoala.cjLib(new TargetFile('NativeModule', '')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
            {
                onlyIntegrated: config.onlyIntegrated,
            }
        )
    }
    else if (config.lang === Language.ARKTS) {
        writeFile(
            arkoala.arktsLib(new TargetFile('NativeModule', 'arkts')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }        )
    } else {
        writeFile(
            arkoala.langLib(new TargetFile('NativeModule')),
            printNativeModule(peerLibrary, config.nativeBridgeFile ?? "../../../../../../../native/NativeBridgeNapi"),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    }

    if (config.lang == Language.TS) {
        // todo I think we want to generate them for ARKTS too
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetFile)
            writeFile(outComponentFile, data,
                {
                    onlyIntegrated: config.onlyIntegrated,
                    integrated: false,
                    message: "producing"
                })
            arkuiComponentsFiles.push(outComponentFile)
        }

        const fakeDeclarations = printFakeDeclarations(peerLibrary)
        for (const [filename, data] of fakeDeclarations) {
            const outComponentFile = arkoala.interface(new TargetFile(filename))
            writeFile(outComponentFile, data,
                {
                    onlyIntegrated: config.onlyIntegrated,
                    integrated: true,
                    message: "producing"
                })
            if (config.verbose) console.log(data)
            arkuiComponentsFiles.push(outComponentFile)
        }

        writeFile(
            arkoala.tsLib(new TargetFile('ConflictedDeclarations')),
            printConflictedDeclarations(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
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
                integrated: true
            }
        )
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.peer(new TargetFile('Deserializer')),
            makeTSDeserializer(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    }
    if (config.lang == Language.ARKTS) {
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetBasename, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetBasename)
            console.log("producing", outComponentFile)
            if (config.verbose) console.log(data)
            writeFile(outComponentFile, data,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            })
            arkuiComponentsFiles.push(outComponentFile)
        }
        const fakeDeclarations = printFakeDeclarations(peerLibrary)
        for (const [filename, data] of fakeDeclarations) {
            const outComponentFile = arkoala.interface(new TargetFile(filename))
            console.log("producing", outComponentFile)
            if (config.verbose) console.log(data)
            writeFile(outComponentFile, data,             {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            })
            arkuiComponentsFiles.push(outComponentFile)
        }
        writeFile(
            arkoala.arktsLib(new TargetFile('ConflictedDeclarations')),
            printConflictedDeclarations(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
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
            arkoala.arktsLib(new TargetFile("peer_events")),
            printEvents(peerLibrary),
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
        writeFile(arkoala.peer(new TargetFile('Serializer')),
            makeTSSerializer(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'arkts')),
            makeTypeCheckerFromDTS(peerLibrary).arkts,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(arkoala.arktsLib(new TargetFile('type_check', 'ts')),
            makeTypeCheckerFromDTS(peerLibrary).ts,
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    }
    if (config.lang == Language.JAVA) {
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.javaLib(targetFile)
            console.log("producing", outComponentFile)
            if (config.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const synthesizedTypes = context.synthesizedTypes!.getDefinitions()
        for (const [targetFile, data] of synthesizedTypes) {
            const outComponentFile = arkoala.javaLib(targetFile)
            console.log("producing", outComponentFile)
            if (config.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const serializer = makeJavaSerializer(peerLibrary)
        serializer.writer.printTo(arkoala.javaLib(serializer.targetFile))

        const nodeTypes = makeJavaNodeTypes(peerLibrary)
        nodeTypes.writer.printTo(arkoala.javaLib(nodeTypes.targetFile))

        const arkComponents = makeJavaArkComponents(peerLibrary, context)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))
    }
    if (config.lang == Language.CJ) {
        const interfaces = printInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.cjLib(targetFile)
            console.log("producing", outComponentFile)
            if (config.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const synthesizedTypes = context.synthesizedTypes!.getDefinitions()
        for (const [targetFile, data] of synthesizedTypes) {
            const outComponentFile = arkoala.cjLib(targetFile)
            console.log("producing", outComponentFile)
            if (config.verbose) console.log(data)
            fs.writeFileSync(outComponentFile, data)
        }

        const writer = makeCJSerializer(peerLibrary)
        writer.printTo(arkoala.cjLib(new TargetFile('Serializer', '')))


        writeFile(
            arkoala.peer(new TargetFile('ArkUINodeType')),
            printNodeTypes(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    }

    writeFile(arkoala.native(new TargetFile('bridge_generated.cc')), printBridgeCcGenerated(peerLibrary, config.callLog ?? false), {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true
    })
    writeFile(arkoala.native(new TargetFile('bridge_custom.cc')), printBridgeCcCustom(peerLibrary, config.callLog ?? false), {
        onlyIntegrated: config.onlyIntegrated
    })

    const { api, serializers } = printSerializers(config.apiVersion, peerLibrary)
    writeFile(arkoala.native(new TargetFile('Serializers.h')), serializers, {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true
    })
    writeFile(arkoala.native(new TargetFile('arkoala_api_generated.h')), api, {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true
    })

    const modifiers = printRealAndDummyModifiers(peerLibrary)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.apiVersion, 6).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
        }
)
    writeFile(
        arkoala.native(new TargetFile('real_impl.cc')),
        dummyImplementations(modifiers.real, accessors.real, 1, config.apiVersion, 6).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    writeFile(arkoala.native(new TargetFile('all_events.cc'),), printEventsCArkoalaImpl(peerLibrary),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    writeFile(arkoala.native(new TargetFile('library.cc')), libraryCcDeclaration(), {
        onlyIntegrated: config.onlyIntegrated,
    })

    copyArkoalaFiles({onlyIntegrated: config.onlyIntegrated}, arkoala)
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
        'sig/arkoala-arkts/arkui/src/generated/PeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/NativePeerNode.ts',
        'sig/arkoala-arkts/arkui/src/generated/arkts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/index.ts',
        'sig/arkoala-arkts/arkui/src/generated/ts/NativeModule.ts',
        'sig/arkoala-arkts/arkui/src/generated/peers/SerializerBase.ts',
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
        peerLibrary: IdlPeerLibrary) {
    const arkoala = config.arkoalaDestination ?
        new ArkoalaInstall(config.arkoalaDestination, config.lang, false) :
        new ArkoalaInstall(config.outDir, config.lang, true)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))

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
    }
    if (PeerGeneratorConfig.needInterfaces) {
        const interfaces = printIdlInterfaces(peerLibrary, context)
        for (const [targetFile, data] of interfaces) {
            const outComponentFile = arkoala.interface(targetFile)
            writeFile(outComponentFile, data, {
                onlyIntegrated: config.onlyIntegrated,
                integrated: false,
                message: "producing [idl]"
            })
            arkuiComponentsFiles.push(outComponentFile)
        }
    }
    const declarations = printDeclarations(peerLibrary)
    for (const [targetFile, data] of declarations) {
        const outComponentFile = arkoala.interface(targetFile)
        writeFile(outComponentFile, data, {
            onlyIntegrated: config.onlyIntegrated,
            integrated: false
        })
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
    }

    if (peerLibrary.language == Language.JAVA) {
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

    // native code
    writeFile(
        arkoala.native(new TargetFile('bridge_generated.cc')),
        printBridgeCcGenerated(peerLibrary, config.callLog ?? false),
        {
            onlyIntegrated: config.onlyIntegrated,
        })
    writeFile(
        arkoala.native(new TargetFile('bridge_custom.cc')),
        printBridgeCcCustom(peerLibrary, config.callLog ?? false), {
            onlyIntegrated: config.onlyIntegrated,
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

    const modifiers = printRealAndDummyModifiers(peerLibrary)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    writeFile(
        arkoala.native(new TargetFile('dummy_impl.cc')),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.apiVersion , 6).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
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
        })

    copyArkoalaFiles({onlyIntegrated: config.onlyIntegrated}, arkoala)
}
