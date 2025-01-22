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
import { Version, Git, writeToPackageJson, IDLIZE_ARKGEN, IDLIZE_CORE, IDLIZE_LINTER, publishToOpenlab, replaceInJson } from "./utils.mjs"

const files = [
    path.join(IDLIZE_ARKGEN, "package.json"),
    path.join(IDLIZE_CORE, "package.json"),
    path.join(IDLIZE_LINTER, "package.json")
]

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
    if (currentBranch !== 'master' && false) {
        throw new Error("You must be on master branch!")
    }

    const old = CURRENT_VERSION
    const next = new Version(old.toString()).up()
    const newBranch = `release-${next.toString()}`

    console.log(`> Updating idlize version from ${old.toString()} to ${next.toString()}`)
    writeVersion(next)

    files.forEach(file => {
        replaceInJson(file, new RegExp(`${old.toString()}\\+devel`, 'g'), next.toString())
        writeToPackageJson(file, "description", `idlize hash of head: ${git.hash()}`)
    })

    if (git.checkBranch(newBranch)) git.deleteBranch(newBranch)

    try {
        console.log("Publish idlize")
        publishToOpenlab("next")
        process.chdir("./core")
        console.log("Publish idlize-core")
        publishToOpenlab("next")
        process.chdir("../linter")
        console.log("Publish idlize-linter")
        publishToOpenlab("next")
        process.chdir("..")

        files.forEach(file => {
            replaceInJson(file, new RegExp(`${next.toString()}`, 'g'), `${next.toString()}+devel`)
            writeToPackageJson(file, "description", "")
        })

        console.log(`> Checkout to ${newBranch}`)
        git.checkout(`release-${next.toString()}`)
        git.add('.')
        git.commit(`Release version ${next.toString()}`)
        console.log(`> Create commit`)

    } catch(e) {
        writeVersion(old)
        files.forEach(file => {
            replaceInJson(file, new RegExp(`${next.toString()}`, 'g'), `${old.toString()}+devel`)
            writeToPackageJson(file, "description", "")
        })
        throw new Error("Failed to publish idlize package")
    }

    console.log(`> Link: https://nexus.bz-openlab.ru:10443/repository/koala-npm/%40idlize/arkgen/-/arkgen-${next.toString()}.tgz`)
    console.log("$ git push")

}

function main() {
    run()
}

main()