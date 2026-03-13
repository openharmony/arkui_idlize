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

import { readFileSync, writeFileSync } from "node:fs";
import { scan } from "../utils";

function transformText(text: string, fileName: string): string {
    const lines = text.split('\n')
    const result1: string[] = []

    const options = new Map<string, string>()

    while (lines.length) {
        const line = lines.shift()!
        result1.push(line)
        if (line.includes('@ComponentBuilder')) {
            const funcLine = lines.shift()
            if (funcLine === undefined) {
                continue
            }
            result1.push(funcLine)
            if (funcLine.includes('):')) {
                continue
            }
            let opts = lines.shift()
            if (opts === undefined) {
                console.error("WAS NOT TRANSFORMED PROPERLY:", fileName)
                continue
            }
            result1.push(opts)
            opts = opts.trim()
            if (opts?.trim() === '@memo') {
                opts = ''
            }
            const closingLine = lines.find(line => line.startsWith('):'))
            if (closingLine) {
                let attrName = closingLine.substring(2).trim()
                if (attrName.endsWith(';')) {
                    attrName = attrName.substring(0, attrName.length - 1)
                }
                let optsString = opts
                if (optsString.endsWith(',')) {
                    optsString = optsString.substring(0, optsString.length - 1)
                }
                options.set(attrName, optsString)
            }
        }
    }

    options.forEach((_,name) => {
        const trimmedName = name.endsWith('Attribute') ? name.substring(0, name.length - 'Attribute'.length) : name
        result1.push(
            '',
            '@memo',
            `export declare function ${trimmedName}Impl(`,
            '    @memo',
            `    style: ((attributes: ${name}) => void) | undefined,`,
            '    @memo',
            '    content_?: () => void,',
            '): void',
            ''
        )
    })

    return result1.join('\n')
}

function transformOneFile(fileName: string) {
    const text = readFileSync(fileName, 'utf-8')
    writeFileSync(fileName, transformText(text, fileName), 'utf-8')
}

export function transformBuilderFunctions(rootDir: string) {
    scan(rootDir).forEach(file => {
        transformOneFile(file)
    })
}
