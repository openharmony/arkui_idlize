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
import { execSync } from "node:child_process"
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IDLIZE_PATH = resolve(__dirname, '..')
const EXTERNAL_PATH = resolve(__dirname, '..', '..', 'external')
const INTEROP_PATH = join(EXTERNAL_PATH, 'interop')

const PACKAGES = [
    '@koalaui/interop'
]

function $(...input) {
    const command = input.join(' && ')
    console.log(`> ${command}`)
    execSync(command, { stdio: 'inherit' })
}

function enableDevEnv() {
    $(`cd ${INTEROP_PATH}`, `npm link`)
    $(`cd ${IDLIZE_PATH}`, `npm link ${PACKAGES.join(' ')}`)
}

function disableDevEnv() {
   $(`cd ${IDLIZE_PATH}`, 'npm i')
}

function main(argv) {
    const flag = argv[2]
    if (!flag || flag === 'on') {
        enableDevEnv()
        return
    }
    if (flag && flag === 'off') {
        disableDevEnv()
        return
    }
}
main(process.argv)
