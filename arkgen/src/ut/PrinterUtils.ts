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

import * as fs from 'fs'
import * as path from 'path'

import { createLanguageWriter, ETSLanguageWriter, Language, PeerLibrary } from '@idlizer/core'

export function createEtsWriter(peerLibrary: PeerLibrary): ETSLanguageWriter {
    return createLanguageWriter(Language.ARKTS, peerLibrary) as ETSLanguageWriter
}

export function printEtsResource(resPath: string, name: string, obj: object) {
    fs.writeFileSync(path.join(resPath, name), JSON.stringify(obj, null, 2))
}

export function quoted1(value: string) {
    return `'${value.replaceAll("'", "\\'")}'`
}

export function quoted2(value: string) {
    return `"${value.replaceAll('"', '\\"')}"`
}

export function makeTsImports(items: ReadonlySet<string>, from: string, peerLibrary: PeerLibrary): ETSLanguageWriter {
    const imports = createEtsWriter(peerLibrary)
    if (items.size > 0) {
        const itemLines: string[][] = [[]]
        let line = 0
        let pos = 0
        for (const item of [...items].sort()) {
            if (pos + item.length + 2 < 117 || itemLines[line].length === 0) {
                pos += item.length + 2
                itemLines[line].push(item)
            } else {
                ++line
                pos = item.length + 2
                itemLines.push([item])
            }
        }
        const makeMultiLine = () => {
            imports.print("import {")
            imports.pushIndent()
            itemLines.forEach(it => imports.print(`${it.join(", ")},`))
            imports.popIndent()
            imports.print(`} from '${from}'`)
        }
        if (itemLines.length === 1) {
            const singleLine = `import { ${itemLines[0].join(", ")} } from '${from}'`
            if (singleLine.length < 121) {
                imports.print(singleLine)
            } else {
                makeMultiLine()
            }
        } else {
            makeMultiLine()
        }
    }
    return imports
}
