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
import { execSync } from 'node:child_process'
import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const CORE_DIR = './core'
const LIBOHOS_DIR = './libohos'
const INTERFACES_DIR = './interfaces'
const LIBARKTS_DIR = './external/ui2abc/libarkts'
const INTEROP_DIR = './external/interop'
const COMMON_DIR = './external/incremental/common'
const COMPAT_DIR = './external/incremental/compat'
const ARKGEN_DIR = './arkgen'
const ETSGEN_DIR = './etsgen'
const RUNNER_DIR = './runner'

const BUNDLED_VERSION_NAME = '0.0.0'

const directories = [
    ['idlizer-core', CORE_DIR],
    ['idlizer-libohos', LIBOHOS_DIR],
    ['idlizer-interfaces',INTERFACES_DIR],
    ['koalaui-libarkts',LIBARKTS_DIR],
    ['koalaui-interop',INTEROP_DIR],
    ['koalaui-common',COMMON_DIR],
    ['koalaui-compat',COMPAT_DIR],
    ['idlizer-arkgen',ARKGEN_DIR],
    ['idlizer-etsgen',ETSGEN_DIR],
    ['idlizer-runner',RUNNER_DIR],
]

const shouldBeMangled = new Set([
    '@idlizer/core',
    '@idlizer/libohos',
    '@idlizer/interfaces',
    '@koalaui/libarkts',
    '@koalaui/interop',
    '@koalaui/common',
    '@koalaui/compat',
    '@idlizer/etsgen',
    '@idlizer/arkgen',
    '@idlizer/runner',
])

function findPack(src, prefix) {
    const files = readdirSync(src)
    for (const file of files) {
        if (file.startsWith(prefix) && file.endsWith('.tgz') && file.includes(BUNDLED_VERSION_NAME)) {
            return join(src, file)
        }
    }
    return undefined
}

export function main([bundleDir]) {
    directories.forEach(([bundlePrefix, dir]) => {
        const configPath = join(dir, 'package.json')
        const originalContent = readFileSync(configPath, 'utf-8')
        const json = JSON.parse(originalContent)
        if (json.dependencies) {
            const deps = {}
            for (const key in json.dependencies) {
                let val = json.dependencies[key]
                if (shouldBeMangled.has(key)) {
                    val = BUNDLED_VERSION_NAME
                }
                deps[key] = val
            }
            json.dependencies = deps
        }
        json.version = BUNDLED_VERSION_NAME
        writeFileSync(configPath, JSON.stringify(json, null, 2), 'utf-8')
        try {
            console.log('>>', configPath)
            execSync('npm pack', { stdio: 'ignore', cwd: dir })
            const bundleFile = findPack(dir, bundlePrefix)
            if (bundleFile !== undefined) {
                cpSync(bundleFile, join(bundleDir, basename(bundleFile)))
            }
        } catch (ex) {
            console.error("BROKEN", ex)
        } finally {
            writeFileSync(configPath, originalContent, 'utf-8')
        }
    })

    console.log('>> install.js')
const JS_TEXT = `
const { mkdirSync } = require("node:fs")
const { resolve } = require("node:path")
const { execSync } = require("node:child_process")

const WORK_DIR = resolve(__dirname, process.argv[2])

if (!process.argv[2]) {
    throw new Error("Install directory was not provided!");
}

mkdirSync(WORK_DIR, { recursive: true })
execSync("npm init -y", { stdio: "ignore", cwd: WORK_DIR })
execSync("npm i ../*.tgz", { stdio: "ignore", cwd: WORK_DIR })

console.log("Done!")
console.log("Installed to", WORK_DIR)
console.log()
console.log("Please check that")
console.log()
console.log("* Panda SDK installed with correct version")
console.log("* SDK is downloaded")
console.log()
console.log("The tool can be used as follows:")
console.log()
console.log("cd", WORK_DIR)
console.log("npx @idlizer/runner m3 <path-to-arkts12-sdk> <path-to-peers>")
console.log()

`.trim()

    writeFileSync(join(bundleDir, 'install.js'), JS_TEXT, 'utf-8')
    console.log("DONE!")
}
main(process.argv.slice(2))
