/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from "fs"
import path from "path"
import { Version, Git, writeToPackageJson, IDLIZE_HOME, publishToOpenlab } from "./utils.mjs"

const CURRENT_VERSION = readVersion()
const git = new Git

function writeVersion(version) {
    fs.writeFileSync(path.join(IDLIZE_HOME, "VERSION"), version.toString(), "utf-8")
}

function readVersion() {
    const version = fs.readFileSync(path.join(IDLIZE_HOME, "VERSION"), "utf-8")
    return new Version(version)
}

function run() {
    const currentBranch = git.branch()

    console.log(`> Current branch: ${currentBranch}`)
    if (currentBranch !== 'master') {
        throw new Error("You must be on master branch!")
    }

    const old = CURRENT_VERSION
    const next = new Version(old.toString()).up()
    const newBranch = `release-${next.toString()}`

    console.log(`> Updating idlize version from ${old.toString()} to ${next.toString()}`)
    writeVersion(next)
    writeToPackageJson("version", next.toString())
    writeToPackageJson("description", `idlize hash of head: ${git.hash()}`)

    if (git.checkBranch(newBranch)) git.deleteBranch(newBranch)

    try {
        publishToOpenlab("next")

        console.log(`> Checkout to ${newBranch}`)
        git.checkout(`release-${next.toString()}`)
        git.add('.')
        git.commit(`Release version ${next.toString()}`)
        console.log(`> Create commit`)
    
    } catch(e) {
        writeVersion(old)
        writeToPackageJson("version", `${old.toString()}+devel`)
        writeToPackageJson("description", "")
        throw new Error("Failed to publish idlize package")
    }

    writeToPackageJson("version", `${next.toString()}+devel`)
    writeToPackageJson("description", "")

    console.log("$ git push")

}

function main() {
    run()
}

main()