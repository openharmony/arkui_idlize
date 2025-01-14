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

import * as fs from "node:fs"
import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from 'url'

const __thisScript = fileURLToPath(import.meta.url)
const __setupFile = path.format({ ...path.parse(__thisScript), base: '', ext: '.json' })
const setup = JSON.parse(fs.readFileSync(__setupFile))
console.log("use setup:", setup)
const repoUrl = setup.url
const repoRef = setup.ref
const repoDir = `${path.dirname(__thisScript)}/interface_sdk-js`
const gitDir = `${repoDir}/.git`

// utilities
const git = `git --git-dir=${gitDir} --work-tree=${repoDir}`
let repoRefKind
if (repoRef.match(/^[0-9a-zA-Z]{40}$/)) repoRefKind = 'hash'
else if (repoRef.startsWith("origin/")) repoRefKind = 'remote'
else repoRefKind = 'local'

// initial clone
if (!fs.existsSync(repoDir) || !fs.existsSync(gitDir)) {
  console.log("no git directories exists, try to clone repo")
  exec(`git --git-dir=${gitDir} clone ${repoUrl} ${repoDir}`)
}

// unshallow
if (exec(`${git} rev-parse --is-shallow-repository`).stdout.trim() == "true") {
  console.log("git shallow state found, try to fetch full history")
  exec(`${git} fetch --prune --unshallow`)
}

// cleanup
let res = exec(`${git} status --short`)
if (res.stdout) {
  console.log(res.stdout)
  console.log("git status reports changes, try to clean")
  exec(`${git} checkout -f`)
  exec(`${git} clean -xfd`)
}

// fetch
let needFetch = false
if (repoRefKind === 'hash') {
  const exists = exec(`${git} cat-file -e ${repoRef}`, false).code == 0
  needFetch = !exists
} else
  needFetch = true

if (needFetch) {
  exec(`${git} fetch --prune`)
}

// checkout
const currentRefs = exec(`${git} log -n1 --pretty="format:%H, %D" --decorate=short`).stdout
  .split(/,\s*/)
  .filter(e => !e.includes("HEAD"))
  .filter(e => !!e)

if (repoRefKind === 'local') {
  const currentBranch = exec(`${git} branch --show-current`).stdout.trim()
  if (currentBranch)
    currentRefs.push(currentBranch)
}

if (!currentRefs.includes(repoRef)) {
  console.log("current references:", currentRefs)
  console.log(`try to checkout ref: ${repoRef}`)
  exec(`${git} checkout ${repoRef}`)
}

// follow remote
if (repoRefKind === 'local') {
  console.log(`try to forward local branch: ${repoRef}`)
  exec(`${git} merge --ff-only`)
}
// repo ready

// link to project
let sdk = "./sdk"
let components = "./interface_sdk-js/api/\@internal/component/ets"
if (!fs.existsSync(sdk)) {
    fs.mkdirSync(sdk)
    try {
      fs.symlinkSync("." + components, sdk + "/component")
    } catch (e) {
      console.log("Symlink failed, try to copy")
      fs.cpSync(components, sdk + "/component", { recursive: true })
    }
}

// all done
console.log("sdk ready")
process.exit(0)

// utilities
function exec(cmd, dieIfFailed=true) {
  const result = {
    code: 0,
    stdout: "",
    stderr: ""
  }
  try {
    console.log(`exec [${cmd}]`)
    result.stdout = execSync(cmd, {stdio: 'pipe'}).toString()
  } catch (e) {
    result.code = e.status
    result.stdout = e.stdout.toString()
    result.stderr = e.stderr.toString()
    if (dieIfFailed) {
      console.log("fail:", result)
      process.exit(result.code || 1)
    }
  }
  return result
}