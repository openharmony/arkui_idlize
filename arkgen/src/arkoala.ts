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
import { Language, IndentedPrinter, PeerLibrary, CppLanguageWriter, createEmptyReferenceResolver, LanguageWriter, ReferenceResolver, Method, MethodSignature, PrintHint, PrinterLike, NamedMethodSignature, printMethodDeclaration, CppConvertor, PeerMethod, MethodModifier, NativeModuleType, LayoutManager, ETSLanguageWriter } from '@idlizer/core'
import {
    dummyImplementations, gniFile, libraryCcDeclaration,
    makeArkuiModule, makeCallbacksKinds,
    mesonBuildFile, tsCopyrightAndWarning,
    readLangTemplate,
    printRealAndDummyAccessors,
    printRealAndDummyModifiers, createMaterializedPrinter,
    printGniSources, printMesonBuild,
    printBuilderClasses, ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH,
    TargetFile, printBridgeCcCustom, printBridgeCcGenerated,
    printBridgeHeaderCustom, printBridgeHeaderGenerated, printKotlinCInteropDefFile,
    printDeclarations, printEnumsImpl, printManagedCaller,
    NativeModule, printArkUILibrariesLoader,
    printCJArkUIGeneratedNativeFunctions, printCJPredefinedNativeFunctions,
    printPredefinedNativeModule, printTSArkUIGeneratedEmptyNativeModule,
    printTSPredefinedEmptyNativeModule, printGlobal, writeFile, writeIntegratedFile, install,
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
    Printer,
    printTSTypeChecker,
    printArkTSTypeChecker,
    ScopeLibrarayLayout,
    copyFile
} from "@idlizer/libohos"
import { createPeersPrinter } from "./printers/PeersPrinter"
import { ArkoalaInstall, createArkoalaInstall, LibaceInstall } from "./ArkoalaInstall"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"
import { createInterfacePrinter } from "./printers/ArkoalaInterfacePrinter"
import { printComponents, printComponentsDeclarations } from "./printers/ComponentsPrinter"
import { makeJavaArkComponents } from "./printers/JavaPrinter"
import { printModifiers } from "./printers/ModifierPrinter"
import { arkoalaLayout, ArkTSComponentsLayout } from "./ArkoalaLayout"
import { printETSDeclaration } from "./printers/StsComponentsPrinter"
import { platform } from "node:os";

const External = path.join(__dirname, "../../external")
const ExternalStubs = path.join(External, "subset")
const Subset = path.join(__dirname, "../external-subset")

export function generateLibaceFromIdl(config: {
    libaceDestination: string | undefined,
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

    if (!config.libaceDestination) {
        const mesonBuild = printMesonBuild(peerLibrary)
        fs.writeFileSync(libace.mesonBuild, mesonBuildFile(mesonBuild))
    }

    copyToLibace(fs.existsSync(Subset) ? Subset : External, libace)
}

function copyArkoalaFiles(config: {
    onlyIntegrated: boolean | undefined
}, arkoala: ArkoalaInstall) {
    const subsetJson = path.join(fs.existsSync(Subset) ? Subset : ExternalStubs, 'subset.json')
    const subsetData = JSON.parse(fs.readFileSync(subsetJson).toString())
    if (!subsetData) throw new Error(`Cannot parse ${subsetJson}`)
    const copyFiles = (files: string, ...fromFallbacks: string[]) => {
        for (const file of files) {
            let found = false
            for (const from of fromFallbacks) {
                const fromPath = path.join(from, file)
                if (fs.existsSync(fromPath)) {
                    found = true
                    copyFile(fromPath, path.join(arkoala.root, file))
                    break
                }
            }
            if (!found) {
                throw new Error(`Template for file ${file} was not found in paths ${fromFallbacks.join(':')}`)
            }
        }
        return
    }

    if (config.onlyIntegrated) {
        copyFiles(subsetData.generatedSubset, fs.existsSync(Subset) ? Subset : ExternalStubs)
        return
    }

    if (fs.existsSync(Subset)) {
        copyFiles(subsetData.subset, Subset)
    } else {
        copyFiles(subsetData.subset, ExternalStubs, External)
    }
}

function removeSuffix(path: string, suffix: string): string {
    return path.endsWith(suffix) ? path.slice(0, -suffix.length) : path;
}

export function generateArkoalaFromIdl(config: {
    outDir: string,
    arkoalaDestination: string | undefined,
    nativeBridgeFile: string | undefined,
    lang: Language,
    apiVersion: number,
    onlyIntegrated: boolean,
    dumpSerialized: boolean,
    callLog: boolean,
    verbose: boolean,
    useTypeChecker: boolean,
},
    peerLibrary: PeerLibrary) {
    const arkoala = config.arkoalaDestination ?
        createArkoalaInstall({ outDir: config.arkoalaDestination, lang: config.lang, test: false, useMemoM3: peerLibrary.useMemoM3 }) :
        createArkoalaInstall({ outDir: config.outDir, lang: config.lang, test: true, useMemoM3: peerLibrary.useMemoM3 })
    // arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))

    peerLibrary.name = 'arkoala'
    peerLibrary.setFileLayout(arkoalaLayout(peerLibrary, 'Ark', ARKOALA_PACKAGE_PATH))

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
    const installedFiles = ETSLanguageWriter.useTypeChecker(config.useTypeChecker, () => install(
        arkoala.managedDir,
        peerLibrary,
        [
            createMaterializedPrinter(config.dumpSerialized),
            createPeersPrinter(config.dumpSerialized),
            createInterfacePrinter(false),
            printComponents,
            ...spreadIfNotLang([Language.KOTLIN],
                printModifiers,
            ),
            printGlobal,
            printBuilderClasses,
            createSerializerPrinter(peerLibrary.language, ""),
            ...spreadIfNotLang([Language.JAVA],
                createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
            ),
            ...spreadIfNotLang([Language.ARKTS],
                createGeneratedNativeModulePrinter(NativeModule.Generated),
            )
        ]
    ))

    if (peerLibrary.language === Language.ARKTS) {
        install(
            arkoala.managedDir,
            peerLibrary,
            [
                createGeneratedNativeModulePrinter(NativeModule.Generated),
                printArkTSTypeChecker,
            ],
            { customLayout: new LayoutManager(new ArkTSComponentsLayout(peerLibrary)) }
        )
        if (peerLibrary.useMemoM3) {
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
                path.join(arkoala.managedSdkDir, 'generated', 'index' + peerLibrary.language.extension),
                makeArkuiModule(installed, path.join(arkoala.managedSdkDir, 'generated')),
                {
                    onlyIntegrated: config.onlyIntegrated,
                    integrated: true
                }
            )
        }
    }


    if (peerLibrary.language == Language.TS || peerLibrary.language == Language.ARKTS) {
        let enumImpls = peerLibrary.createLanguageWriter()
        printEnumsImpl(peerLibrary, enumImpls)
        enumImpls.printTo(path.join(arkoala.managedDir, 'generated', 'EnumsImpl' + peerLibrary.language.extension))
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
        writeIntegratedFile(
            path.join(arkoala.tsArkoalaDir, NativeModule.ArkUI.name + peerLibrary.language.extension),
            arkuiNativeModuleFile.printToString(),
        )
        writeIntegratedFile(
            path.join(arkoala.tsArkoalaDir, `${NativeModule.ArkUI.name}Empty${peerLibrary.language.extension}`),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModule.ArkUI).printToString(),
        )
        writeIntegratedFile(
            path.join(arkoala.tsArkoalaDir, NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeIntegratedFile(
            path.join(arkoala.tsArkoalaDir, `${NativeModule.Test.name}Empty${peerLibrary.language.extension}`),
            printTSPredefinedEmptyNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        writeIntegratedFile(
            path.join(arkoala.managedDir, 'generated', `${NativeModule.Generated.name}Empty${peerLibrary.language.extension}`),
            printTSArkUIGeneratedEmptyNativeModule(peerLibrary, NativeModule.Generated).printToString()
        )
        // TODO restore me
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
            path.join(arkoala.managedDir, 'generated', 'index' + peerLibrary.language.extension),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles), path.join(arkoala.managedDir, 'generated')),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(path.join(arkoala.managedDir, 'generated', "peers", 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    } else if (peerLibrary.language === Language.ARKTS) {
        const arkuiNativeModuleFile = printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI)
        printArkUILibrariesLoader(arkuiNativeModuleFile)
        writeIntegratedFile(
            path.join(arkoala.managedDir, 'generated', 'arkts', NativeModule.ArkUI.name + peerLibrary.language.extension),
            arkuiNativeModuleFile.printToString(),
        )
        writeIntegratedFile(
            path.join(arkoala.managedDir, 'generated', 'arkts', NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )
        // writeIntegratedFile(
        //     arkoala.arktsLib(new TargetFile(NativeModuleType.Interop.name, 'arkts')),
        //     printPredefinedNativeModule(peerLibrary, NativeModuleType.Interop).printToString(),
        // )
        writeFile(
            path.join(arkoala.managedDir, 'generated', 'index' + peerLibrary.language.extension),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles), path.join(arkoala.managedDir, 'generated')),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
        writeFile(path.join(arkoala.managedDir, 'generated', 'peers', 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    } else if (peerLibrary.language == Language.JAVA) {
        writeIntegratedFile(
            path.join(arkoala.managedDir, ARKOALA_PACKAGE_PATH, NativeModule.ArkUI.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).printToString(),
        )
        writeIntegratedFile(
            path.join(arkoala.managedDir, ARKOALA_PACKAGE_PATH, NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )

        const arkComponents = makeJavaArkComponents(peerLibrary)
        arkComponents.writer.printTo(path.join(arkoala.managedDir,
            arkComponents.targetFile.path ?? "",
            arkComponents.targetFile.name + peerLibrary.language.extension))
    }

    if (peerLibrary.language == Language.CJ) {
        writeIntegratedFile(
            path.join(arkoala.managedDir, NativeModule.ArkUI.name + peerLibrary.language.extension),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.ArkUI).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).content.getOutput().join('\n')
            )
        )
        writeIntegratedFile(
            path.join(arkoala.managedDir, NativeModule.Test.name + peerLibrary.language.extension),
            printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Test).printToString().concat(
                printPredefinedNativeModule(peerLibrary, NativeModule.Test).content.getOutput().join('\n')
            )
        )
        // writeIntegratedFile(
        //     arkoala.cjLib(new TargetFile(NativeModule.Interop.name)),
        //     printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Interop).printToString().concat(
        //         printPredefinedNativeModule(peerLibrary, NativeModule.Interop).content.getOutput().join('\n')
        //     )
        // )
        writeFile(path.join(arkoala.managedDir, 'peers', 'CallbackKind' + peerLibrary.language.extension),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
            }
        )
    }

    if (peerLibrary.language == Language.KOTLIN) {
        writeIntegratedFile(
            path.join(arkoala.managedDir, NativeModule.ArkUI.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).printToString()
        )
        writeIntegratedFile(
            path.join(arkoala.managedDir, NativeModule.Test.name + peerLibrary.language.extension),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString()
        )
    }

    // native code
    writeFile(
        path.join(arkoala.nativeDir, 'bridge_generated.cc'),
        printBridgeCcGenerated(peerLibrary, config.callLog ?? false),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
        })
    writeFile(
        path.join(arkoala.nativeDir, 'bridge_custom.cc'),
        printBridgeCcCustom(peerLibrary, config.callLog ?? false),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
        })
    if (peerLibrary.language == Language.KOTLIN) {
        const bridgeHeaderGenerated = 'bridge_generated.h'
        const bridgeHeaderCustom = 'bridge_custom.h'
        writeFile(
            path.join(arkoala.nativeDir, bridgeHeaderGenerated),
            printBridgeHeaderGenerated(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            })
        writeFile(
            path.join(arkoala.nativeDir, bridgeHeaderCustom),
            printBridgeHeaderCustom(peerLibrary),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            })
        writeFile(
            path.join(arkoala.nativeDir, 'interop.def'),
            printKotlinCInteropDefFile([bridgeHeaderGenerated, bridgeHeaderCustom]),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true,
            })
    }

    const { api, serializers } = printSerializers(config.apiVersion, peerLibrary)
    writeFile(path.join(arkoala.nativeDir, 'Serializers.h'), serializers, {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true,
    })
    writeFile(path.join(arkoala.nativeDir, 'arkoala_api_generated.h'), api, {
        onlyIntegrated: config.onlyIntegrated,
        integrated: true,
    })

    const modifiers = printRealAndDummyModifiers(peerLibrary, true)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    const apiGenFile = "arkoala_api_generated"
    writeFile(
        path.join(arkoala.nativeDir, 'dummy_impl.cc'),
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.apiVersion, 6, apiGenFile).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        }
    )
    writeFile(
        path.join(arkoala.nativeDir, 'real_impl.cc'),
        dummyImplementations(modifiers.real, accessors.real, 1, config.apiVersion, 6, apiGenFile).getOutput().join('\n'),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true,
        }
    )
    writeFile(path.join(arkoala.nativeDir, 'library.cc'), libraryCcDeclaration(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    writeFile(path.join(arkoala.nativeDir, 'callback_kind.h'), makeCallbacksKinds(peerLibrary, Language.CPP),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    const deserializeAndCallCPPContent = peerLibrary.createLanguageWriter(Language.CPP)
    deserializeAndCallCPPContent.writeLines(cStyleCopyright)
    deserializeAndCallCPPContent.print('#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule')
    createDeserializeAndCallPrinter(peerLibrary.name, Language.CPP)(peerLibrary).forEach(it => deserializeAndCallCPPContent.concat(it.content))
    writeFile(path.join(arkoala.nativeDir, 'callback_deserialize_call.cc'), deserializeAndCallCPPContent.printer.getOutput().join("\n"),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    writeFile(path.join(arkoala.nativeDir, 'callback_managed_caller.cc'), printManagedCaller('arkoala', peerLibrary).printToString(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    copyArkoalaFiles({ onlyIntegrated: config.onlyIntegrated }, arkoala)
}

function copyToLibace(from: string, libace: LibaceInstall) {
    const macros = path.join(from, 'arkoala-arkts/framework/native/src/arkoala-macros.h')
    fs.copyFileSync(macros, libace.arkoalaMacros)
}

class ArkoalaMultiFileModifiersVisitor extends MultiFileModifiersVisitor {
    emitRealSync(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions): void {
        const getterDeclarations = library.createLanguageWriter(Language.CPP)

        for (const [slug, state] of this.stateByFile) {
            if (state.hasModifiers)
                printModifiersImplFile(libace.modifierCpp(slug), state, options)
            if (state.hasAccessors)
                printModifiersImplFile(libace.accessorCpp(slug), state, options)
            getterDeclarations.concat(state.getterDeclarations)
        }

        const commonFilePath = libace.allModifiers
        const commonFileContent = getterDeclarations
            .concat(modifierStructList(this.modifierList))
            .concat(accessorStructList(this.accessorList))

        printModifiersCommonImplFile(commonFilePath, commonFileContent, options)
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
        writer.pushNamespace(options.namespaces.generated, { ident: false })
    }

    writer.concat(state.real)
    writer.concat(state.modifiers)
    writer.concat(state.accessors)

    if (options.namespaces) {
        writer.popNamespace({ ident: false })
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
        writer.pushNamespace(options.namespaces.base, { ident: false })
    }
    writer.concat(appendModifiersCommonPrologue())

    if (options.namespaces) {
        writer.popNamespace({ ident: false })
    }

    writer.print("")

    if (options.namespaces) {
        writer.pushNamespace(options.namespaces.generated, { ident: false })
    }

    writer.concat(completeModifiersContent(content, options.basicVersion, options.fullVersion, options.extendedVersion))

    if (options.namespaces) {
        writer.popNamespace({ ident: false })
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

    const structs = new CppLanguageWriter(new IndentedPrinter(), peerLibrary, new CppConvertor(peerLibrary), ArkPrimitiveTypesInstance)
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

    const structs = new CppLanguageWriter(new IndentedPrinter(), peerLibrary, new CppConvertor(peerLibrary), ArkPrimitiveTypesInstance)
    const typedefs = new IndentedPrinter()

    const serializers = makeCSerializer(peerLibrary, structs, typedefs)
    const api = makeAPI(apiVersion, apiHeader, modifierList, accessorList, eventsList, nodeTypesList, structs, typedefs)
    return { api, serializers }
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
    for (let i = 0; i < MAX_SELECTORS_IDS; i++) {
        converter.print(`#define ${SELECTOR_ID_PREFIX}${i} ${i}`)
    }
    converter.print("")

    converter.pushNamespace(namespace, { ident: false })
    converter.print("")
    writeConvertors(library, converter)
    converter.popNamespace({ ident: false })
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
