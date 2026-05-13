/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import { LanguageWriter, PeerLibrary, LayoutManagerStrategy } from "@idlizer/core"
import * as fs from "fs"
import * as path from "path"

export function writeFile(filename: string, content: string, config: { // TODO make content a string or a writer only
    onlyIntegrated: boolean,
    integrated?: boolean,
    message?: string
}): boolean {
    if (config.integrated || !config.onlyIntegrated) {
        if (config.message)
            console.log(config.message, filename)
        fs.mkdirSync(path.dirname(filename), { recursive: true })
        fs.writeFileSync(filename, content)
        return true
    }
    return false
}

export function writeIntegratedFile(filename: string, content: string, message?: string) {
    writeFile(filename, content, {
        onlyIntegrated: false,
        integrated: true,
        message
    })
}

///////

export function injectPatch(writer: LanguageWriter, key: string, patches: Map<string, Map<string, string>>) {
    if (patches.has(key)) {
        const record = patches.get(key)!
        if (record.has(writer.language.name)) {
            const text = record.get(writer.language.name)!
            text.split('\n').forEach(line => {
                writer.print(line)
            })
        }
    }
}

export function ScopeLibrarayLayout(library: PeerLibrary, layout: LayoutManagerStrategy, task: () => void): void {
    const temp = library.layout
    library.setFileLayout(layout)
    task()
    library.setFileLayout(temp)
}
