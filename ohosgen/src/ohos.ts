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
import { OhosInstall } from "./OhosInstall"
import { generateNativeOhos } from './OhosNativeVisitor';
import { ohosLayout } from './OhosLayout';
import { printDataClasses } from './OhosDataClassVisitor';
import { printOstFiles } from './ohos-ost';

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, useOst: boolean, config: PeerGeneratorConfiguration) {
    const origGenConfig = generatorConfiguration()
    setDefaultConfiguration(config)
    peerLibrary.setFileLayout(ohosLayout(peerLibrary))

    const ohos = new OhosInstall(outDir, peerLibrary.language)

    // MANAGED
    /////////////////////////////////////////

    // install managed part
    const spread = <T>(cond: boolean, ...data: T[]): T[] => {
        return cond ? data : []
    }
    let printedFiles = printFiles(
        peerLibrary,
        [
            createCallbackKindPrinter(peerLibrary.language),
            ...spread(!useOst,
                createMaterializedPrinter(false),
                createInterfacePrinter(false, false),
                printDataClasses,
                printGlobal,
                createSerializerPrinter(peerLibrary.language, ""),
                createGeneratedNativeModulePrinter(NativeModule.Generated)),
            createDeserializeAndCallPrinter(peerLibrary.name, peerLibrary.language),
        ]
    )
    let nativeFiles: Map<TargetFile, string> | undefined
    if (useOst) {
        const [tsFiles, cFiles] = printOstFiles(peerLibrary)
        printedFiles = mergeOutputFiles(printedFiles, tsFiles)
        nativeFiles = cFiles
    }
    const installed = installFiles(ohos.managedDir(), peerLibrary, printedFiles)

    // managed-index

    if ([Language.TS, Language.ARKTS].includes(peerLibrary.language)) {
        writeFile(path.join(ohos.managedDir(), 'index.ts'),
            makeOhosModule(peerLibrary, ohos.managedDir(), installed)
        )
    }

    // NATIVE
    /////////////////////////////////////////

    nativeFiles ??= generateNativeOhos(peerLibrary)
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

function mergeOutputFiles(files0: Map<string, OutputFile>, files1: Map<string, OutputFile>): Map<string, OutputFile> {
    for (const [file, output] of files1) {
        /// probably need to take useFoldersLayout and moduleName into account somewhere else
        const output0 = files0.get(file)
        if (output0) { // ignore unknown files
            console.log('[ merged ]', file)
            output0.imports.merge(output.imports)
            output0.content.push(...output.content)
        } else {
            console.log('[ ostgen ]', file)
            files0.set(file, output)
        }
    }
    return files0
}
