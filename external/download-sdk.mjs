/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import * as fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from 'url'
import { downloadFromGit } from './download-from-git.mjs'

const __thisScript = fileURLToPath(import.meta.url)
const __thisDir = path.dirname(__thisScript)
const __setupFile = path.format({ ...path.parse(__thisScript), base: '', ext: '.json' })
const setup = JSON.parse(fs.readFileSync(__setupFile))
console.log("use setup:", setup)
const idlizeDir = path.join(__thisDir, '..')
const repoDir = path.join(__thisDir, `interface_sdk-js`)

downloadFromGit(setup.url, setup.ref, repoDir)
// repo ready

// link to project
let sdk = `${idlizeDir}/arkgen/sdk`
let components = `${repoDir}/api/\@internal/component/ets`
if (!fs.existsSync(sdk)) {
    fs.mkdirSync(sdk)
    try {
      fs.symlinkSync("../." + components, sdk + "/component")
    } catch (e) {
      console.log("Symlink failed, try to copy")
      fs.cpSync(components, sdk + "/component", { recursive: true })
    }
}

// all done
console.log("sdk ready")
process.exit(0)
