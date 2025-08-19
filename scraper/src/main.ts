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

import { toIDLFile } from "@idlizer/core"
import { Command } from "commander"
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { solve } from "./alporithm"

const OUT_DIR = resolve(process.cwd(), 'out')

function scan(root:string):string[] {
    return statSync(root).isDirectory()
        ? readdirSync(root).flatMap(p => scan(join(root, p)))
        : [root]
}

function prepare() {
    if (!existsSync(OUT_DIR)) {
        mkdirSync(OUT_DIR, { recursive: true })
    }
}

interface AppOptions {
    target: string[]
}

function go(sources:string[], options:AppOptions) {
    if (options.target.length === 0) {
        console.log('No targets was provided')
        process.exitCode = -1
        return
    }
    prepare()

    const input = sources.flatMap(source => scan(resolve(source)))
    const library = input.flatMap(source => {
        try {
            return [toIDLFile(source)[0]]
        } catch (e) {
            console.error('skipped', source)
            return []
        }
    })

    solve(library, options.target)
}

function main(args:string[]) {
    new Command("@idlizer/scraper")
        .argument('<input-files...>', 'Input files')
        .option('--target <target-names...>', 'Packages', [])
        .action(go)
        .parse(args, { from: 'user' })
}
main(process.argv.slice(2))
