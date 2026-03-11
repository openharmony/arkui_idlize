/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

// @ts-check

import fs from "node:fs"
import { dirname, resolve, join } from "node:path"
import { execSync, spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __tmpdir = join(tmpdir(), `api-compat-${process.pid}`)

const __idlinter = resolve(__dirname, '..')
const __runner = resolve(__dirname, '../../runner')
const __etsgen = resolve(__dirname, '../../etsgen')

const { positional: positionalArgs, flags } = parseArgs(process.argv.slice(2));
let [repo_dir, commit, base] = positionalArgs;
let etsgenOptionsFile = flags['etsgen-options-file']
let argsOk = true
if (!repo_dir) {
    console.log('<repo> arg is not defined')
    argsOk = false
}
if (!commit) {
    console.log('<commit> arg is not defined')
    argsOk = false
}
if (!etsgenOptionsFile) {
    console.log('--etsgen-options-file is not defined')
    argsOk = false
}
if (!argsOk) {
    console.log('Usage:')
    console.log('        $(basename $0) <repo> <commit> [<base>] --etsgen-options-file <file>')
    console.log('Check <commit> for compatibility against <base>.')
    console.log('If <base> is missing, check against previous commit (<base> is <commit>~).')
    process.exit(-1)
}

repo_dir = resolve(repo_dir)
etsgenOptionsFile = resolve(etsgenOptionsFile)

if (!base)
    base = execSync(`git -C ${repo_dir} rev-parse ${commit}~`, {stdio: 'pipe'}).toString().slice(0, 8)

console.log(`Constraints:
    tmpdir:     ${__tmpdir}
    idlinter:   ${__idlinter}
    etsgen:     ${__etsgen}
    etsgen options: ${etsgenOptionsFile}
    runner:     ${__runner}
    repo:       ${repo_dir}
    base..commit: ${base}..${commit}
`)

// runner compiles etsgen too
await exec(`npm run compile -C ${__runner}`)
await exec(`npm run compile -C ${__idlinter}`)

await commit2idl(base)
await commit2idl(commit)

console.clear()
try {
    await exec(`node ${__idlinter} compat ${__tmpdir}.${base}.idl ${__tmpdir}.${commit}.idl`)
} catch (error) {
    // errors are output to the console, so just exit with a non-zero code
    process.exit(1)
}

/**
 * @param {string} cmd
 * @returns {Promise<void>}
 */
function exec(cmd) {
    return new Promise((resolve, reject) => {
        const spinnerFrames = ['.', 'o', 'O', '0', 'O', 'o']
        let spinnerIndex = 0

        // Print command with initial spinner frame
        process.stdout.write(`> ${cmd} ${spinnerFrames[spinnerIndex]}`)
        spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length

        const spinnerInterval = setInterval(() => {
            // Use backspace to overwrite just the spinner character
            process.stdout.write(`\b${spinnerFrames[spinnerIndex]}`)
            spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length
        }, 150)

        const child = spawn(cmd, [], { shell: true, stdio: 'pipe' })
        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (data) => { stdout += data })
        child.stderr?.on('data', (data) => { stderr += data })

        // @ts-expect-error ChildProcess inherits from EventEmitter but type defs don't include 'on'
        child.on('close', (/** @type {number|null} */ code) => {
            clearInterval(spinnerInterval)
            // Clear the spinner character and move to next line
            process.stdout.write('\b \n')

            if (code !== 0) {
                if (stdout) process.stdout.write(stdout)
                if (stderr) process.stderr.write(stderr)
                reject(new Error(`Command failed with exit code ${code}`))
            } else {
                resolve()
            }
        })

        // @ts-expect-error ChildProcess inherits from EventEmitter but type defs don't include 'on'
        child.on('error', (/** @type {Error} */ err) => {
            clearInterval(spinnerInterval)
            process.stdout.write('\b \n')
            reject(err)
        })
    })
}

/**
 * @param {string} commit
 */
async function commit2idl(commit) {
    /**
     * @param {string[]} suffixes
     */
    function rmTempDirs(...suffixes) {
        suffixes.forEach(suf => fs.rmSync(`${__tmpdir}.${commit}${suf}`, { recursive: true, force: true }))
    }
    rmTempDirs('', '.patched', '.patched1', '.idl')
    await exec(`git -C ${repo_dir} worktree add -f ${__tmpdir}.${commit} ${commit}`)
    await exec(`node ${__runner} sdk ${__tmpdir}.${commit} ${__tmpdir}.${commit}.patched ${__tmpdir}.${commit}.patched1`)
    await exec(`node ${__etsgen} --ets2idl --docs none ` +
         `--base-dir ${__tmpdir}.${commit}.patched/api --input-dir ${__tmpdir}.${commit}.patched/api ` +
         `--output-dir ${__tmpdir}.${commit}.idl ` +
         `--options-file ${etsgenOptionsFile}`)
}
/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const positional = []
  const flags = Object.create(null)

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]

      // Check if next arg is a value (not a flag and exists)
      if (next && !next.startsWith('--')) {
        flags[key] = next
        i++ // Skip the value in next iteration
      } else {
        flags[key] = true
      }
    } else {
      positional.push(arg)
    }
  }

  return { positional, flags }
}