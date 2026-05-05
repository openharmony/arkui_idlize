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
    printEnumSupportFunctions,
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
            ...spreadIfLang([Language.ARKTS], printEnumSupportFunctions),
        ])

        // NATIVE
        /////////////////////////////////////////

        nativeFiles = generateNativeOhos(peerLibrary)
    }

    const installed = installFiles(ohos.managedDir(), peerLibrary, managedFiles)

    // managed-index
    if ([Language.TS, Language.ARKTS].includes(peerLibrary.language)) {
        writeFile(path.join(ohos.managedDir(), 'index.ts'),
            makeOhosModule(peerLibrary, ohos.managedDir(), installed, managedFiles)
        )
    }

    for (const [ file, content ] of nativeFiles) {
        writeFile(ohos.native(file), content)
    }

    setDefaultConfiguration(origGenConfig)
}

function collectExportedNames(content: string[]): Set<string> {
    const names = new Set<string>()
    for (const line of content) {
        const match = line.match(/^export\s+(?:interface|class|function|const|type|enum|namespace)\s+(\w+)/)
        if (match) {
            names.add(match[1])
        }
    }
    return names
}

function makeOhosModule(library: PeerLibrary, root:string, componentsFiles: string[], managedFiles: Map<string, OutputFile>): string {
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

    // Collect exported names per file and detect collisions
    const fileData = componentsFiles.map(file => {
        const relativePath = path.relative(root, file)
        const fileNameNoExt = relativePath.replaceAll(path.extname(file), "")
        const output = managedFiles.get(fileNameNoExt)
        const names = output ? collectExportedNames(output.content) : new Set<string>()
        return { fileNameNoExt, names }
    })

    const nameToFiles = new Map<string, string[]>()
    for (const { fileNameNoExt, names } of fileData) {
        for (const name of names) {
            const files = nameToFiles.get(name) ?? []
            files.push(fileNameNoExt)
            nameToFiles.set(name, files)
        }
    }

    const exports = fileData.map(({ fileNameNoExt, names }) => {
        const colliding = [...names].filter(name => (nameToFiles.get(name)?.length ?? 0) > 1)
        if (colliding.length === 0) {
            return `export * from "./${fileNameNoExt}"`
        }
        const unique = [...names].filter(name => !colliding.includes(name))
        if (unique.length === 0) {
            return `// all exports from "./${fileNameNoExt}" collide, import directly`
        }
        return `export { ${unique.join(", ")} } from "./${fileNameNoExt}"`
    }).sort()

    return defaultExports.concat(exports).join("\n")
}
