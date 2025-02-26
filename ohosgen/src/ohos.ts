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
    makeCallbacksKinds,
    makeDeserializeAndCall,
    makeDeserializer,
    makeSerializer,
    makeTypeChecker,
    readLangTemplate,
    printArkUIGeneratedNativeModule,
    NativeModule,
    TargetFile,
    install,
    printInterfaceData,
    printCJArkUIGeneratedNativeFunctions,
    PeerGeneratorConfiguration,
} from '@idlizer/libohos';
import { OhosInstall } from "./OhosInstall"
import { generateNativeOhos, suggestLibraryName } from './OhosNativeVisitor';

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, config: PeerGeneratorConfiguration) {
    const origGenConfig = generatorConfiguration()
    setDefaultConfiguration(config)
    peerLibrary.setFileLayout(layout(peerLibrary, "OH", `org/openharmony/${config.LibraryPrefix}`))

    const ohos = new OhosInstall(outDir, peerLibrary.language)

    NativeModule.Generated = new NativeModuleType(peerLibrary.name + 'NativeModule')

    const ohosManagedFiles: string[] = []

    // MANAGED
    /////////////////////////////////////////

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
            createMaterializedPrinter(false),
            printInterfaceData,
            printGlobal,
        ]
    )

    // managed-index

    if ([Language.TS, Language.ARKTS].includes(peerLibrary.language)) {
        const generatedFiles = [...installed]
        ohosManagedFiles.forEach(it => {
            generatedFiles.push('./' + path.relative(ohos.managedDir(), it))
        })
        if (peerLibrary.language === Language.ARKTS) {
            generatedFiles.push(path.join(ohos.managedDir(), 'peers/type_check.ts'))
            generatedFiles.push(path.join(ohos.managedDir(), path.basename(nativeModuleFileName, path.extname(nativeModuleFileName))))
        }
        writeIntegratedFile(path.join(ohos.managedDir(), 'index.ts'),
            makeOhosModule(ohos.managedDir(), generatedFiles)
        )
    }

    // NATIVE
    /////////////////////////////////////////

    const native = generateNativeOhos(peerLibrary)
    for (const [ file, content ] of native) {
        writeIntegratedFile(ohos.native(file), content)
    }

    setDefaultConfiguration(origGenConfig)
}

function makeOhosModule(root:string, componentsFiles: string[]): string {
    return componentsFiles.map(file => {
        const relativePath = path.relative(root, file)
        const fileNameNoExt = relativePath.replaceAll(path.extname(file), "")
        return `export * from "./${fileNameNoExt}"`
    }).join("\n")
}
