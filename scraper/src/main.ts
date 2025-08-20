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
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { solve } from "./alporithm"
import { ADDITIONAL_CONFIG_DIR, AppConfigSchema, AppOptions, CONFIG_PATH, OUT_DIR } from "./shared"

function scan(root:string):string[] {
    return statSync(root).isDirectory()
        ? readdirSync(root).flatMap(p => scan(join(root, p)))
        : [root]
}

function prepare() {
    if (!existsSync(OUT_DIR)) {
        mkdirSync(OUT_DIR, { recursive: true })
    }
    if (!existsSync(ADDITIONAL_CONFIG_DIR)) {
        mkdirSync(ADDITIONAL_CONFIG_DIR, { recursive: true })
    }
}

function go(root:string, options:AppOptions) {
    const configText = readFileSync(CONFIG_PATH, 'utf-8')
    const configContent = JSON.parse(configText)
    const config = AppConfigSchema.validate(configContent).unwrap()
    prepare()

    const input = scan(resolve(root))
    const library = input.flatMap(source => {
        try {
            return [toIDLFile(source)[0]]
        } catch (e) {
            console.error('skipped', source)
            return []
        }
    })

    config.target.push(...options.target)
    solve(root, library, config.target, config)
}

function main(args:string[]) {
    new Command("@idlizer/scraper")
        .argument('<input-directory>', 'Input directory')
        .option('--target <target-names...>', 'Packages', [])
        .action(go)
        .parse(args, { from: 'user' })
}
main(process.argv.slice(2))
