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
    appendViewModelBridge,
    makeIncludeGuardDefine,
    SELECTOR_ID_PREFIX,
    writeConvertors,
    HeaderVisitor,
    readTemplate,
    peerGeneratorConfiguration,
    readInteropTypesHeader,
    createGeneratedNativeModulePrinter,
    createSerializerPrinter,
    createDeserializerPrinter,
    makeCSerializers,
    createDeserializeAndCallPrinter,
    Printer,
    printTSTypeChecker,
    printArkTSTypeChecker,
    ScopeLibrarayLayout,
    createPeersPrinter,
    copyFile
} from "@idlizer/libohos"
import { ArkoalaInstall, LibaceInstall } from "./ArkoalaInstall"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"
import { createInterfacePrinter } from "./printers/ArkoalaInterfacePrinter"
import { printComponents, printComponentsDeclarations } from "./printers/ComponentsPrinter"
import { makeJavaArkComponents } from "./printers/JavaPrinter"
import { arkoalaLayout, ArkTSComponentsLayout } from "./ArkoalaLayout"
import { printETSDeclaration } from "./printers/StsComponentsPrinter"
import {platform} from "node:os";

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
                    copyFile(fromPath, path.join(arkoala.sig, file))
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
        new ArkoalaInstall(config.arkoalaDestination, config.lang, false, peerLibrary.useMemoM3) :
        new ArkoalaInstall(config.outDir, config.lang, true, peerLibrary.useMemoM3)
    arkoala.createDirs([ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH].map(dir => path.join(arkoala.javaDir, dir)))

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
        selectOutDir(arkoala, peerLibrary.language),
        peerLibrary,
        [
            createMaterializedPrinter(config.dumpSerialized),
            createPeersPrinter(config.dumpSerialized),
            createInterfacePrinter(false),
            printComponents,
            printGlobal,
            printBuilderClasses,
            createSerializerPrinter(peerLibrary.language, ""),
            ...spreadIfNotLang([Language.JAVA],
                createDeserializerPrinter(peerLibrary.language, ""),
                createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
            ),
            ...spreadIfNotLang([Language.ARKTS],
                createGeneratedNativeModulePrinter(NativeModule.Generated),
            )
        ]
    ))

    if (peerLibrary.language === Language.ARKTS) {
        install(
            selectOutDir(arkoala, peerLibrary.language),
            peerLibrary,
            [
                createGeneratedNativeModulePrinter(NativeModule.Generated),
                printTSTypeChecker,
                printArkTSTypeChecker,
            ],
            { customLayout: new LayoutManager(new ArkTSComponentsLayout(peerLibrary)) }
        )
        if (peerLibrary.useMemoM3) {
            install(
                arkoala.arktsSdkDir,
                peerLibrary,
                [
                    createInterfacePrinter(true),
                    printComponentsDeclarations,
                ],
                {
                    isDeclared: true,
                }
            )
        }
    }


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
        //         message: "producing"
        //     }
        // )
        // index not printed
        writeFile(
            arkoala.tsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles), arkoala.tsDir),
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
        writeFile(
            arkoala.arktsLib(new TargetFile('index')),
            makeArkuiModule(arkuiComponentsFiles.concat(installedFiles), arkoala.arktsDir),
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
            arkoala.javaLib(new TargetFile(NativeModule.ArkUI.name, ARKOALA_PACKAGE_PATH)),
            printPredefinedNativeModule(peerLibrary, NativeModule.ArkUI).printToString(),
        )
        writeIntegratedFile(
            arkoala.javaLib(new TargetFile(NativeModule.Test.name, ARKOALA_PACKAGE_PATH)),
            printPredefinedNativeModule(peerLibrary, NativeModule.Test).printToString(),
        )

        const arkComponents = makeJavaArkComponents(peerLibrary)
        arkComponents.writer.printTo(arkoala.javaLib(arkComponents.targetFile))
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
        // writeIntegratedFile(
        //     arkoala.cjLib(new TargetFile(NativeModule.Interop.name)),
        //     printCJPredefinedNativeFunctions(peerLibrary, NativeModule.Interop).printToString().concat(
        //         printPredefinedNativeModule(peerLibrary, NativeModule.Interop).content.getOutput().join('\n')
        //     )
        // )
        writeFile(arkoala.peer(new TargetFile('CallbackKind', '')),
            makeCallbacksKinds(peerLibrary, peerLibrary.language),
            {
                onlyIntegrated: config.onlyIntegrated,
                integrated: true
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
        dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.apiVersion, 6, apiGenFile).getOutput().join('\n'),
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
    const deserializeAndCallCPPContent = peerLibrary.createLanguageWriter(Language.CPP)
    deserializeAndCallCPPContent.writeLines(cStyleCopyright)
    deserializeAndCallCPPContent.print('#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule')
    createDeserializeAndCallPrinter(peerLibrary.name, Language.CPP)(peerLibrary).forEach(it => deserializeAndCallCPPContent.concat(it.content))
    writeFile(arkoala.native(new TargetFile('callback_deserialize_call.cc')), deserializeAndCallCPPContent.printer.getOutput().join("\n"),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })
    writeFile(arkoala.native(new TargetFile('callback_managed_caller.cc')), printManagedCaller('arkoala', peerLibrary).printToString(),
        {
            onlyIntegrated: config.onlyIntegrated,
            integrated: true
        })

    copyArkoalaFiles({ onlyIntegrated: config.onlyIntegrated }, arkoala)
}

function selectOutDir(arkoala: ArkoalaInstall, lang: Language) {
    switch (lang) {
        case Language.TS: return arkoala.tsDir
        case Language.ARKTS: return arkoala.arktsDir
        case Language.JAVA: return arkoala.javaDir
        case Language.CJ: return arkoala.cjDir
    }
    return ''
}

function copyToLibace(from: string, libace: LibaceInstall) {
    const macros = path.join(from, 'arkoala-arkts/framework/native/src/arkoala-macros.h')
    fs.copyFileSync(macros, libace.arkoalaMacros)
}

class ArkoalaMultiFileModifiersVisitor extends MultiFileModifiersVisitor {
    emitRealSync(library: PeerLibrary, libace: LibaceInstall, options: ModifierFileOptions): void {
        const modifierList = library.createLanguageWriter(Language.CPP)
        const getterDeclarations = library.createLanguageWriter(Language.CPP)

        for (const [slug, state] of this.stateByFile) {
            if (state.hasModifiers)
                printModifiersImplFile(libace.modifierCpp(slug), state, options)
            if (state.hasAccessors)
                printModifiersImplFile(libace.accessorCpp(slug), state, options)
            modifierList.concat(state.modifierList)
            getterDeclarations.concat(state.getterDeclarations)
        }

        const commonFilePath = libace.allModifiers
        const commonFileContent = getterDeclarations
            .concat(modifierStructList(modifierList))
            .concat(accessorStructList(this.accessorList))

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
        writer.pushNamespace(options.namespaces.base, { ident: false })
    }
    writer.concat(appendViewModelBridge(library))

    if (options.namespaces) {
        writer.popNamespace({ ident: false })
    }

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
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include "callbacks.h"
#include "arkoala_api_generated.h"
#include <string>

${makeCSerializers(library, structs, typedefs)}
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
