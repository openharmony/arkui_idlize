/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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
import * as path from "node:path"
import {execSync} from "child_process"
import child from "child_process"

const plusDevel = `+devel`

export class Version {
    constructor(version) {
        let [major, minor, patch] = version.split(/\./);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    incrementPatch() {
        this.patch = (parseInt(this.patch) + 1).toString()
        return this
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}`
    }

    truncatePlusDevel() {
        if (this.patch.endsWith(plusDevel)) {
            this.patch = this.patch.slice(0, this.patch.length - plusDevel.length)
        }
        return this
    }

    addPlusDevel() {
        this.patch = this.patch + plusDevel
        return this
    }
}

export function readPackageJson(dir) {
    return JSON.parse(fs.readFileSync(path.join(dir, `package.json`), "utf-8"))
}

export function writePackageJson(dir, value) {
    return fs.writeFileSync(path.join(dir, `package.json`), JSON.stringify(value, null, 2), "utf-8")
}

export function assertNoUncommitedChanges(dir) {
    if (execSync(`cd ${dir} && git diff -- . ':(exclude)./external'`).toString().length > 0) {
        throw new Error(`Uncommited changes at ${dir}`)
    }
}

export function run(where, ...commands) {
    commands.forEach(it =>
        child.execSync(`cd ${where} && ${it}`, { stdio: 'inherit' })
    )
}