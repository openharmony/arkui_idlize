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
    Method,
    createReferenceType,
    IDLEntry,
    LayoutNodeRole,
    IDLPointerType,
} from "@idlizer/core";
import {
    writeIntegratedFile,
    createMaterializedPrinter,
    printGlobal,
    readLangTemplate,
    NativeModule,
    TargetFile,
    install,
    printInterfaceData,
    printCJArkUIGeneratedNativeFunctions,
    PeerGeneratorConfiguration,
    createSerializerPrinter,
    createDeserializerPrinter,
    createCallbackKindPrinter,
    PrinterResult,
    ImportsCollector,
    collectDeclItself,
    createDeserializeAndCallPrinter,
    createGeneratedNativeModulePrinter,
    printArkTSTypeChecker,
} from '@idlizer/libohos';
import { OhosInstall } from "./OhosInstall"
import { generateNativeOhos, suggestLibraryName } from './OhosNativeVisitor';
import { ohosLayout } from './OhosLayout';

function printCallbackChecker(peerLibrary: PeerLibrary): PrinterResult[] {
    const content = peerLibrary.createLanguageWriter(peerLibrary.language)
    content.writeLines(readLangTemplate('CallbacksChecker', peerLibrary.language))
    const imports = new ImportsCollector()
    imports.addFeatures(["InteropNativeModule", "ResourceHolder", "KBuffer"], "@koalaui/interop")
    collectDeclItself(peerLibrary, createReferenceType("Deserializer"), imports)
    collectDeclItself(peerLibrary, createReferenceType("deserializeAndCallCallback"), imports)
    return [{
        over: {
            node: peerLibrary.resolveTypeReference(createReferenceType("checkArkoalaCallbacks")) as IDLEntry,
            role: LayoutNodeRole.PEER
        },
        collector: imports,
        content: content,
    }]
}

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, config: PeerGeneratorConfiguration) {
    const origGenConfig = generatorConfiguration()
    setDefaultConfiguration(config)
    peerLibrary.setFileLayout(ohosLayout(peerLibrary))

    const ohos = new OhosInstall(outDir, peerLibrary.language)

    const ohosManagedFiles: string[] = []

    // MANAGED
    /////////////////////////////////////////

    // install managed part
    const spreadIfLang = <T>(langs: Language[], ...data: T[]): T[] => {
        if (langs.includes(peerLibrary.language))
            return data
        return []
    }
    const installed = install(
        ohos.managedDir(),
        peerLibrary,
        [
            createCallbackKindPrinter(peerLibrary.language),
            createMaterializedPrinter(false),
            printInterfaceData,
            printGlobal,
            createSerializerPrinter(peerLibrary.language, ""),
            createDeserializerPrinter(peerLibrary.language, ""),
            printCallbackChecker,
            createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
            createGeneratedNativeModulePrinter(NativeModule.Generated, w => {
                w.writeNativeMethodDeclaration(new Method(
                    '_AllocateNativeBuffer',
                    NamedMethodSignature.make(
                        IDLBufferType,
                        [
                            { name: 'len', type: IDLI32Type },
                            { name: 'source', type: IDLPointerType },
                            { name: 'returnBuffer', type: IDLUint8ArrayType },
                        ]
                    )
                ))
            }),
            ...spreadIfLang([Language.ARKTS], printArkTSTypeChecker),
        ]
    )

    // managed-index

    if ([Language.TS, Language.ARKTS].includes(peerLibrary.language)) {
        const generatedFiles = [...installed]
        ohosManagedFiles.forEach(it => {
            generatedFiles.push('./' + path.relative(ohos.managedDir(), it))
        })
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
