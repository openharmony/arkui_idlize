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

import { execSync } from "child_process"
import { readdirSync, readFileSync, statSync } from "fs"
import { writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

type RecursiveStrings = string | RecursiveStrings[]
export function flat(xs:RecursiveStrings): string[] {
    if (typeof xs === 'string') {
        return [xs]
    }
    return xs.flatMap(x => flat(x))
}
export function over<T>(x:T|undefined, f:(x:T) => string[]): string[] {
    if (x === undefined) {
        return []
    }
    return f(x)
}

export function scan(dir:string): string[] {
    return statSync(dir).isDirectory()
        ? readdirSync(dir).flatMap(file => scan(join(dir, file)))
        : [dir]
}

interface RunContext {
    exec: (command:RecursiveStrings) => void
    cd: (dir:string) => void
}
export function run(runner:(ctx:RunContext) => void) {
    let cwd = process.cwd()
    runner({
        exec: (command) => {
            execSync(flat(command).join(' '), { cwd, stdio: 'inherit' })
        },
        cd: (dir) => {
            cwd = dir
        }
    })
}

const TEMPLATE_DIR = resolve(__dirname, '..', 'template')
export function installTemplate(name:string, installPath:string, replacements:Map<string, string>) {
    let content = readFileSync(join(TEMPLATE_DIR, name + '.template'), 'utf-8')
    replacements.forEach((val, key) => {
        content = content.replaceAll('%' + key + '%', val)
    })
    writeFileSync(installPath, content, 'utf-8')
}
