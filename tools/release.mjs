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
import { Version, Git, IDLIZE_HOME, EXTERNAL_HOME, all_packages } from "./utils.mjs"

const CURRENT_VERSION = readVersion()
const CURRENT_EXTERNAL_VERSION = readExternalVersion().toString()
const git = new Git

function writeVersion(version) {
    fs.writeFileSync(path.join(IDLIZE_HOME, "VERSION"), version.toString(), "utf-8")
}

function readVersion() {
    const version = fs.readFileSync(path.join(IDLIZE_HOME, "VERSION"), "utf-8")
    return version.trim()
}

function readExternalVersion() {
    const version = fs.readFileSync(path.join(EXTERNAL_HOME, "VERSION"), "utf-8")
    return version.trim()
}

const autoPromote = false

function run() {

    all_packages.forEach(module => module.compile())

    const old = CURRENT_VERSION
    const next = autoPromote ? new Version(old.toString()).up() : old
    const oldString = old.toString()
    const nextString = next.toString()

    if (autoPromote) {
        console.log(`> Updating idlize version from ${old.toString()} to ${next.toString()}`)
        writeVersion(next)
    }

    all_packages.forEach(module => {
        module.write(`version`, `${nextString}`, (json) => {
            module.externalDependencies.forEach(dep => {
                if (json.dependencies && json.dependencies[dep]) {
                    if (dep.startsWith("@koalaui")) {
                        json.dependencies[dep] = CURRENT_EXTERNAL_VERSION
                    } else {
                        json.dependencies[dep] = nextString
                    }
                }
            })
        })
    })

    try {

        all_packages.forEach(module => {
            module.publish()
            module.write(`version`, `${nextString}+devel`, (json) => {
                module.externalDependencies.forEach(dep => {
                    if (json.dependencies && json.dependencies[dep]) {
                        if (dep.startsWith("@koalaui")) {
                            json.dependencies[dep] = `${CURRENT_EXTERNAL_VERSION}`
                        } else {
                            json.dependencies[dep] = `${nextString}+devel`
                        }
                    }
                })
            })
        })

        console.log(`> Your packages was published successfully`)

    } catch(e) {
        writeVersion(old)

        all_packages.forEach(module => {
            module.write(`version`, `${oldString}+devel`, (json) => {
                module.externalDependencies.forEach(dep => {
                    if (json.dependencies && json.dependencies[dep]) {
                        if (dep.startsWith("@koalaui")) {
                            json.dependencies[dep] = `${CURRENT_EXTERNAL_VERSION}`
                        } else {
                            json.dependencies[dep] = `${oldString}+devel`
                        }
                    }
                })
            })
        })
        throw new Error(`Failed to publish idlize package. Error: ${e}`)
    }

    console.log(`> Link: https://nexus.bz-openlab.ru:10443/repository/koala-npm/%40idlize/arkgen/-/arkgen-${next.toString()}.tgz`)
    console.log("$ git push")

}

function main() {
    run()
}

main()
