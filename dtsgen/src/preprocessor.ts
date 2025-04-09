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

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, normalize, relative } from "node:path"

function scan(files:string[]): string[] {
    return files.flatMap(file => {
        if (statSync(file).isDirectory()) {
            return readdirSync(file).flatMap(it => {
                return scan([join(file, it)])
            })
        }
        return [file]
    })
}

/////////////////////////////////////////////////////////

interface Tokenizer {
    next(): string | undefined
    save(): void
    restore(): void
    drop(): void
}
type TokenizerMode = 'normal' | 'instruction'

function tokenize(text:string): Tokenizer {
    let ii = 0
    let mode: TokenizerMode = 'normal'

    const memory: [number, TokenizerMode][] = []

    return {
        next: (): string | undefined => {
            if (ii === -1) {
                return undefined
            }
            if (mode === 'normal') {
                const oldII = ii
                ii = text.indexOf('/***', ii)
                mode = 'instruction'
                return text.substring(oldII, ii === -1 ? text.length : ii)
            }
            if (mode === 'instruction') {
                const oldII = ii
                ii = text.indexOf('*/', ii)
                if (ii !== -1) {
                    ii += 2
                }
                mode = 'normal'
                return text.substring(oldII, ii === -1 ? text.length : ii)
            }
        },
        save: () => {
            memory.push([ii, mode])
        },
        restore: () => {
            const [i, m] = memory.pop()!
            ii = i
            mode = m
        },
        drop: () => {
            memory.pop()
        }
    }
}

/////////////////////////////////////////////////////////

interface PreText {
    kind: 'text'
    text: string
}
interface PreCommand {
    kind: 'command'
    command: string
    body: PreProgram
}
interface PreBlock {
    kind: 'block'
    body: (PreText | PreCommand)[]
}
type PreProgram = PreBlock

function parseText(stream:Tokenizer): PreText | undefined {
    const token = stream.next()
    if (token === undefined) {
        return undefined
    }
    if (token.startsWith('/***')) {
        return undefined
    }
    return {
        kind: 'text',
        text: token
    }
}
function parseCommand(stream:Tokenizer): PreCommand | undefined {
    const begin = stream.next()
    if (begin === undefined) {
        return undefined
    }
    if (!begin.startsWith('/***')) {
        return undefined
    }
    const block = parseBlock(stream)
    if (block === undefined) {
        return undefined
    }
    const end = stream.next()
    if (end === undefined) {
        return undefined
    }
    if (!end.startsWith('/***')) {
        return undefined
    }
    return {
        kind: 'command',
        command: begin,
        body: block
    }
}
function parseBlock(stream:Tokenizer): PreBlock | undefined {
    const collected: (PreCommand | PreText)[] = []
    while (true) {
        stream.save()
        const text = parseText(stream)
        if (text !== undefined) {
            stream.drop()
            collected.push(text)
            continue
        }
        stream.restore()
        stream.save()
        const command = parseCommand(stream)
        if (command !== undefined) {
            stream.drop()
            collected.push(command)
            continue
        }
        stream.restore()
        return {
            kind: 'block',
            body: collected
        }
    }
}

function parse(text:string): PreProgram | undefined {
    const tokenizer = tokenize(text)
    return parseBlock(tokenizer)
}

/////////////////////////////////////////////////////////

function preprocess(text:string): string {
    const parsed = parse(text)
    if (!parsed) {
        return text
    }
    return parsed.body
        .filter(it => it.kind === 'text')
        .map(it => it as PreText)
        .map(it => it.text)
        .join('')
}

/////////////////////////////////////////////////////////

export function runPreprocessor(inputFiles:string[], outDirRoot: string) {
    const fileRoots = inputFiles.map(it => [it, scan([it])] as const)
    fileRoots.forEach(([baseDir, files]) => {
        files.forEach(file => {
            const rel = relative(baseDir, file)
            const dst = normalize(join(outDirRoot, rel))
            const dstDir = dirname(dst)
            if (!existsSync(dstDir)) {
                mkdirSync(dstDir, { recursive: true })
            }
            if (!statSync(file).isDirectory() && file.endsWith('.d.ts')) {
                const text = readFileSync(file, 'utf-8')
                const processed = preprocess(text)
                writeFileSync(dst, processed, 'utf-8')
            } else {
                copyFileSync(file, dst)
            }
        })
    })
}
