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
    isInCurrentModule,
    hasExtAttribute,
    IDLExtendedAttributes,
} from "@idlizer/core";
import {
    writeIntegratedFile,
    createMaterializedPrinter,
    printGlobal,
    readLangTemplate,
    NativeModule,
    TargetFile,
    install,
    printCJArkUIGeneratedNativeFunctions,
    PeerGeneratorConfiguration,
    createSerializerPrinter,
    createCallbackKindPrinter,
    PrinterResult,
    ImportsCollector,
    collectDeclItself,
    createDeserializeAndCallPrinter,
    createGeneratedNativeModulePrinter,
    printArkTSTypeChecker,
    createInterfacePrinter,
} from '@idlizer/libohos';
import { OhosInstall } from "./OhosInstall"
import { generateNativeOhos, suggestLibraryName } from './OhosNativeVisitor';
import { ohosLayout } from './OhosLayout';
import { printDataClasses } from './OhosDataClassVisitor';

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
            createInterfacePrinter(false, false),
            printGlobal,
            printDataClasses,
            createSerializerPrinter(peerLibrary.language, ""),
            createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
            createGeneratedNativeModulePrinter(NativeModule.Generated),
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
            makeOhosModule(peerLibrary, ohos.managedDir(), generatedFiles)
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

function makeOhosModule(library: PeerLibrary, root:string, componentsFiles: string[]): string {
    const filesWithDefault = library.files.filter(file => {
        if (!isInCurrentModule(file))
            return
        return file.entries.some(entry => hasExtAttribute(entry, IDLExtendedAttributes.DefaultExport))
    })
    let defaultExports: string[] = []
    if (filesWithDefault.length > 0) {
        const entry = filesWithDefault[0].entries.find(entry => hasExtAttribute(entry, IDLExtendedAttributes.DefaultExport))!
        const filePath = library.layout.resolve({ node: entry, role: LayoutNodeRole.INTERFACE })
        defaultExports.push(
            `import { default as ${entry.name} } from "./${filePath}"`,
            `export default ${entry.name}`
        )
    }
    const exports = componentsFiles.map(file => {
        const relativePath = path.relative(root, file)
        const fileNameNoExt = relativePath.replaceAll(path.extname(file), "")
        return `export * from "./${fileNameNoExt}"`
    }).sort()
    return defaultExports.concat(exports).join("\n")
}
