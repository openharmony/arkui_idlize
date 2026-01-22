/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { LWDeclaration, processNPrintArkTS } from "@idlizer/ost"
import { moduleLike, legacy, IdlizerAppInstallFile } from "@idlizer/kit"
import { join } from "node:path"
import { Language } from "@idlizer/core"
import { makeKnownImports, makeKnownReferences } from "./shared"

const EXT = '.ets'

export function print(outDir: string, declarations: LWDeclaration[], packages: Set<string>): IdlizerAppInstallFile[] {
    const managedDeclarations = moduleLike.postprocess(declarations)
    const managedModules = moduleLike.formFiles(packages, managedDeclarations,
        {
            knownReference: makeKnownReferences(),
            knownImports: makeKnownImports(),
            onUnknownImport: (name) => {
                for (const pkg of packages) {
                    const prefix = pkg + '.'
                    if (name.startsWith(prefix)) {
                        name = name.substring(prefix.length)
                        break
                    }
                }
                return {
                    source: '#handwritten',
                    name: name
                }
            }
        }
    )
    const printedFiles: IdlizerAppInstallFile[] = []
    const indexedFiles: string[] = []
    managedModules.forEach((module, moduleName) => {
        let ext = EXT
        const fileName = moduleName + ext
        const importPrinter = legacy.createLanguageWriter(Language.TS)
        module.moduleLikeImports.print(importPrinter, moduleName);
        let text = ''
        text += importPrinter.getOutput().join('\n')
        text += '\n\n'
        module.body.forEach(declaration => {
            text += processNPrintArkTS(declaration, moduleName, new Set()) + '\n'
        })
        printedFiles.push({
            filePath: join(outDir, fileName),
            content: text
        })
        indexedFiles.push(moduleName)
    })
    const indexName = 'index' + EXT
    return printedFiles
        .concat([{ filePath: join(outDir, indexName), content: indexedFiles.map(f => `export * from './${f}'`).join('\n') }])
}
