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

import { Command } from "commander"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { solve } from "./algorithm.js"
import { ADDITIONAL_CONFIG_DIR, AppConfigSchema, CONFIG_PATH, OUT_DIR } from "./shared.js"

function prepare() {
    if (!existsSync(OUT_DIR)) {
        mkdirSync(OUT_DIR, { recursive: true })
    }
    if (!existsSync(ADDITIONAL_CONFIG_DIR)) {
        mkdirSync(ADDITIONAL_CONFIG_DIR, { recursive: true })
    }
}

interface CommandOptions {
    target: string[]
}

function go(root:string, options:CommandOptions) {
    const configText = readFileSync(CONFIG_PATH, 'utf-8')
    const configContent = JSON.parse(configText)
    const config = AppConfigSchema.validate(configContent).unwrap()
    prepare()
    config.target.push(...options.target)
    solve(root, config)
}

export function scraper(args:string[]) {
    new Command("@idlizer/scraper")
        .argument('<input-idl-directory>', 'Input directory')
        .option('--target <target-names...>', 'Packages', [])
        .action(go)
        .parse(args, { from: 'user' })
}
