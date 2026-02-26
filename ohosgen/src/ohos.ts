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
    generatorConfiguration,
    Language,
    setDefaultConfiguration,
    PeerLibrary,
    LayoutNodeRole,
    isInCurrentModule,
    hasExtAttribute,
    IDLExtendedAttributes,
    isNamespace,
} from "@idlizer/core";
import {
    createMaterializedPrinter,
    printGlobal,
    NativeModule,
    PeerGeneratorConfiguration,
    createSerializerPrinter,
    createCallbackKindPrinter,
    createDeserializeAndCallPrinter,
    createGeneratedNativeModulePrinter,
    createInterfacePrinter,
    TargetFile,
    writeFile,
} from '@idlizer/libohos'
import {
    printFiles,
    installFiles,
    OutputFile,
} from '@idlizer/libohos'
import { OhosInstall } from "./OhosInstall.js"
import { generateNativeOhos } from './OhosNativeVisitor.js';
import { ohosLayout } from './OhosLayout.js';
import { printDataClasses } from './OhosDataClassVisitor.js';
import { printOstFiles } from './ohos-ost.js';

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, feature: string | undefined, config: PeerGeneratorConfiguration) {
    const origGenConfig = generatorConfiguration()
    setDefaultConfiguration(config)
    peerLibrary.setFileLayout(ohosLayout(peerLibrary))

    const ohos = new OhosInstall(outDir, peerLibrary.language)

    let managedFiles: Map<string, OutputFile>
    let nativeFiles: Map<TargetFile, string> | undefined

    if (feature) {
        [managedFiles, nativeFiles] = printOstFiles(peerLibrary, feature)
    } else {
        // MANAGED
        /////////////////////////////////////////

        // install managed part
        managedFiles = printFiles(peerLibrary, [
            createCallbackKindPrinter(peerLibrary.language),
            createMaterializedPrinter(false),
            createInterfacePrinter(false, false),
            printDataClasses,
            printGlobal,
            createSerializerPrinter(peerLibrary.language, ""),
            createGeneratedNativeModulePrinter(NativeModule.Generated),
            createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
        ])

        // NATIVE
        /////////////////////////////////////////

        nativeFiles = generateNativeOhos(peerLibrary)
    }

    const installed = installFiles(ohos.managedDir(), peerLibrary, managedFiles)

    // managed-index
    if ([Language.TS, Language.ARKTS].includes(peerLibrary.language)) {
        writeFile(path.join(ohos.managedDir(), 'index.ts'),
            makeOhosModule(peerLibrary, ohos.managedDir(), installed)
        )
    }

    for (const [ file, content ] of nativeFiles) {
        writeFile(ohos.native(file), content)
    }

    setDefaultConfiguration(origGenConfig)
}

function makeOhosModule(library: PeerLibrary, root:string, componentsFiles: string[]): string {
    const filesWithDefault = library.files.filter(file => {
        if (!isInCurrentModule(file))
            return
        return file.entries.some(entry => hasExtAttribute(entry, IDLExtendedAttributes.DefaultExport) && isNamespace(entry))
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
