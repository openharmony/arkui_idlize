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
import { getIO, logger, moduleLike } from "@idlizer/kit"
import { join } from "node:path"
import { createLanguageWriter } from "./legacy"
import { Language } from "@idlizer/core"
import { makeKnownImports, makeKnownReferences } from "./shared"
import { getClaim } from "./text"

const io = getIO()

const EXT = '.ets'

type FilePrinter = (filename: string, text: string) => Promise<void>

async function doInstall(outDir: string, declarations: LWDeclaration[], packages: Set<string>, printer: FilePrinter) {
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
    const indexedFiles: string[] = []
    const awaitWriteFiles: Promise<unknown>[] = []
    await io.mkdir(outDir, { recursive: true })
    managedModules.forEach((module, moduleName) => {
        let ext = EXT
        const fileName = moduleName + ext
        const importPrinter = createLanguageWriter(Language.TS)
        module.moduleLikeImports.print(importPrinter, moduleName);
        let text = getClaim()
        text += '\n'
        text += importPrinter.getOutput().join('\n')
        text += '\n\n'
        module.body.forEach(declaration => {
            text += processNPrintArkTS(declaration, moduleName, new Set()) + '\n'
        })
        awaitWriteFiles.push(printer(join(outDir, fileName), text))
        indexedFiles.push(moduleName)
    })
    await Promise.all(awaitWriteFiles)
    const indexName = 'index' + EXT
    await printer(join(outDir, indexName), [getClaim(), '\n'].concat(indexedFiles.map(f => `export * from './${f}'`)).join('\n'))
}

export async function install(outDir: string, declarations: LWDeclaration[], packages: Set<string>) {
    await doInstall(outDir, declarations, packages, (filename, text) => io.writeFile(filename, text))
}

export async function dump(outDir: string, declarations: LWDeclaration[], packages: Set<string>) {
    await doInstall(outDir, declarations, packages, async (filename, text) => {
        logger.debug('------------------------------------------------')
        logger.debug('>>>>>> ' + filename)
        logger.debug('---')
        logger.debug(text)
        logger.debug('------------------------------------------------')
    })
}
