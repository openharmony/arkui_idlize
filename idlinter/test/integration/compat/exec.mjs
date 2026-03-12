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

import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checkApiCompat = join(__dirname, '../../../bin/check-api-compat.mjs')
const repo = join(__dirname, '../../../../external/interface_sdk-js')
const etsgenOptionsFile = join(__dirname, './etsgen-options-file.json')
const base = 'c0dddf300'
const commit = 'de2d36a83'

const expectedFailure = 'Missing property: arkui.component.richEditor.RichEditorAttribute.onWillAttachIME'

if (!existsSync(repo)) {
    console.error(`interface_sdk-js must be downloaded! See ${dirname(repo)} scripts`)
    process.exit(1)
}

const cmd = `node ${checkApiCompat} ${repo} ${commit} ${base} --etsgen-options-file ${etsgenOptionsFile}`
console.log(`> ${cmd}`)

try {
    const output = execSync(cmd, {
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe'],
    })
    process.stdout.write(output)
    console.error('TEST FAILED: expected failure was not detected')
    process.exit(1)
} catch (/** @type any */ error) {
    const stdout = error.stdout || ''
    const stderr = error.stderr || ''
    process.stdout.write(stdout)
    process.stderr.write(stderr)

    const output = stdout + stderr
    if (output.includes(expectedFailure)) {
        console.log(`\nEXPECTED FAILURE`)
        process.exit(0)
    }
    console.error('\nTEST FAILED: unexpected error')
    process.exit(1)
}
