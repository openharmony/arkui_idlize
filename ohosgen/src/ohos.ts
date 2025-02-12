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

import * as path from 'node:path'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import {
    IDLBufferType,
    IDLI32Type,
    IDLUint8ArrayType,
    NamedMethodSignature,
    generatorConfiguration,
    Language,
    NativeModuleType,
    setDefaultConfiguration,
    PeerLibrary,
} from "@idlizer/core";
import {
    layout,
    writeIntegratedFile,
    createMaterializedPrinter,
    printGlobal,
    dummyImplementations,
    makeCallbacksKinds,
    makeDeserializeAndCall,
    makeDeserializer,
    makeOhosModule,
    makeSerializer,
    makeTypeChecker,
    readLangTemplate,
    printArkUIGeneratedNativeModule,
    NativeModule,
    TargetFile,
    printRealAndDummyAccessors,
    printRealAndDummyModifiers,
    printSerializersOhos,
    install,
    printInterfaceData,
    printCJArkUIGeneratedNativeFunctions,
} from '@idlizer/libohos';
import { OhosInstall } from "./OhosInstall"
import { generateNativeOhos, OhosConfiguration, suggestLibraryName } from './OhosGenerator';

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, config: OhosConfiguration) {
    peerLibrary.name = suggestLibraryName(peerLibrary).toLowerCase()
    const origGenConfig = generatorConfiguration()
    setDefaultConfiguration(config)
    peerLibrary.setFileLayout(layout(peerLibrary))

    peerLibrary.setFileLayout(layout(peerLibrary, "OH"))

    const ohos = new OhosInstall(outDir, peerLibrary.language)

    NativeModule.Generated = new NativeModuleType(suggestLibraryName(peerLibrary) + 'NativeModule')

    const context = {
        language: peerLibrary.language,
        synthesizedTypes: undefined,
        imports: undefined
    }

    const ohosManagedFiles: string[] = []

    // MANAGED
    /////////////////////////////////////////

    const globals = printGlobal(peerLibrary)
    for (const [targetFile, content] of globals) {
        const outGlobalFile = ohos.globalFile(targetFile)
        writeIntegratedFile(outGlobalFile, content, "producing")
        ohosManagedFiles.push(outGlobalFile)
    }

    // managed-interop-serializers

    writeIntegratedFile(ohos.peer(new TargetFile('Serializer')),
        makeSerializer(peerLibrary)
    )
    const deserializerFilePath = ohos.peer(new TargetFile('Deserializer'))
    writeIntegratedFile(deserializerFilePath,
        makeDeserializer(peerLibrary)
    )

    // managed-callbacks

    writeIntegratedFile(ohos.peer(new TargetFile('CallbackKind')),
        makeCallbacksKinds(peerLibrary, peerLibrary.language)
    )
    const callbackAndCallFilePath = ohos.peer(new TargetFile('CallbackDeserializeCall'))
    writeIntegratedFile(callbackAndCallFilePath,
        makeDeserializeAndCall(peerLibrary, peerLibrary.language, "./peers/CallbackDeserializeCall.ts").printToString()
    )

    // managed-native-module

    const nativeModuleFileName = NativeModule.Generated.name + peerLibrary.language.extension
    writeIntegratedFile(
        ohos.materialized(new TargetFile(nativeModuleFileName)),
        peerLibrary.language == Language.CJ ?
        printCJArkUIGeneratedNativeFunctions(peerLibrary, NativeModule.Generated).printToString().concat(
            printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated).content.getOutput().join('\n')
        ) :
        printArkUIGeneratedNativeModule(peerLibrary, NativeModule.Generated, w => {
            // add method for arkts buffer stubs
            if (peerLibrary.language === Language.ARKTS) {
                w.writeNativeMethodDeclaration('_AllocateNativeBuffer',
                    NamedMethodSignature.make(
                        IDLBufferType,
                        [
                            { name: 'len', type: IDLI32Type },
                            { name: 'data', type: IDLUint8ArrayType },
                            { name: 'init', type: IDLUint8ArrayType },
                        ]
                    )
                )
            }
        }).printToString()
    )

    // managed-copies

    copyPeerLib(peerLibrary.language, ohos.managedDir())

    // managed-utils

    if (peerLibrary.language === Language.ARKTS) {
        writeIntegratedFile(ohos.peer(new TargetFile('type_check')),
            makeTypeChecker(peerLibrary, peerLibrary.language)
        )
    }

    // managed-stubs

    const callbackCheckerFilePath = ohos.peer(new TargetFile('CallbacksChecker'))
    writeIntegratedFile(
        callbackCheckerFilePath,
        readLangTemplate('CallbacksChecker', peerLibrary.language)
            .replaceAll(
                '%DESERIALIZER_PATH%',
                './' + path.relative(path.dirname(callbackCheckerFilePath), deserializerFilePath)
                    .replaceAll(peerLibrary.language.extension, '')
            )
            .replaceAll(
                "%CALLBACKS_PATH%",
                './' + path.relative(path.dirname(callbackCheckerFilePath), callbackAndCallFilePath)
                    .replaceAll(peerLibrary.language.extension, '')
            )
    )

    // install managed part

    const installed = install(
        ohos.managedDir(),
        peerLibrary,
        [
            createMaterializedPrinter(context, false),
            printInterfaceData
        ]
    )

    // managed-index

    if ([Language.TS, Language.ARKTS].includes(peerLibrary.language)) {
        const generatedFiles = [...installed]
        ohosManagedFiles.forEach(it => {
            generatedFiles.push('./' + path.relative(ohos.managedDir(), it))
        })
        if (peerLibrary.language === Language.ARKTS) {
            generatedFiles.push('./peers/type_check.ts')
            generatedFiles.push('./' + path.basename(nativeModuleFileName, path.extname(nativeModuleFileName)))
        }
        writeIntegratedFile(path.join(ohos.managedDir(), 'index.ts'),
            makeOhosModule(generatedFiles)
        )
    }

    // NATIVE
    /////////////////////////////////////////

    /*
    const API_VERSION = 0
    const { api, serializers } = printSerializersOhos(API_VERSION, peerLibrary)

    // native-api-generated

    writeIntegratedFile(ohos.native(new TargetFile(`ohos_api_generated.h`)), api)

    // native-bridge

    writeIntegratedFile(
        ohos.native(new TargetFile('bridge_generated.cc')),
        printBridgeCcGenerated(peerLibrary, config?.callLog ?? false)
    )

    writeIntegratedFile(ohos.native(new TargetFile('Serializers.h')), serializers)

    // native-callbacks

    writeIntegratedFile(ohos.native(new TargetFile('callback_kind.h')), makeCallbacksKinds(peerLibrary, Language.CPP))
    writeIntegratedFile(
        ohos.native(new TargetFile('callback_deserialize_call.cc')),
        makeDeserializeAndCall('ohos', peerLibrary, Language.CPP, 'callback_deserialize_call.cc').printToString()
    )
    writeIntegratedFile(
        ohos.native(new TargetFile('callback_managed_caller.cc')),
        printManagedCaller('ohos', peerLibrary).printToString()
    )
    */

    const native = generateNativeOhos(peerLibrary)
    for (const [ file, content ] of native) {
        writeIntegratedFile(ohos.native(file), content)
    }

    const { api, serializers } = printSerializersOhos(config.ApiVersion, peerLibrary)
    writeIntegratedFile(ohos.native(new TargetFile(`Serializers.h`)), serializers)

    // writeIntegratedFile(ohos.native(new TargetFile(`all_events.cc`)), printEventsCArkoalaImpl(peerLibrary))

    const modifiers = printRealAndDummyModifiers(peerLibrary, true)
    const accessors = printRealAndDummyAccessors(peerLibrary)
    const apiGenFile = peerLibrary.name.toLowerCase()
    const modifiersDummy = dummyImplementations(modifiers.dummy, accessors.dummy, 1, config.ApiVersion , 6, apiGenFile).getOutput().join('\n')
    const modifiersReal = dummyImplementations(modifiers.real, accessors.real, 1, config.ApiVersion, 6, apiGenFile).getOutput().join('\n')
    writeIntegratedFile(ohos.native(new TargetFile(`dummy_impl.cc`)), modifiersDummy)
    writeIntegratedFile(ohos.native(new TargetFile(`real_impl.cc`)), modifiersReal)

    setDefaultConfiguration(origGenConfig)
}

const PEER_LIB_CONFIG = new Map<Language, string[]>([
    [Language.TS, ['MaterializedBase.ts', 'shared/generated-utils.ts']],
    [Language.ARKTS, ['MaterializedBase.ts', 'shared/generated-utils.ts']]
])
PEER_LIB_CONFIG.set(Language.ARKTS, [
        path.join('sig', 'arkoala-arkts', 'arkui', 'src', 'generated', 'MaterializedBase.ts'),
        'MaterializedBase.cj'
])

function copyPeerLib(lang: Language, rootDir: string) {
    const list = PEER_LIB_CONFIG.get(lang)
    if (list) {
        const peerLibDir = path.resolve(__dirname, '../..', 'libohos', 'templates', lang.toString().toLowerCase())
        for (const file of list) {
            const resolvedSrc = path.join(peerLibDir, file)
            const resolvedDst = path.join(rootDir, file)
            const resolvedDstDir = path.dirname(resolvedDst)
            if (!existsSync(resolvedDstDir)) {
                mkdirSync(resolvedDstDir, { recursive: true })
            }
            copyFileSync(resolvedSrc, resolvedDst)
        }
    }
}
