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
import chalk from "chalk"
import path from "path"
import process from "process"
import { execSync } from "child_process"

var args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

const CWD = process.cwd()
const prebuiltPath = path.join(CWD, ".packages")

const keyIdlizeRegistry = "@azanat:registry"
const keyKoalaRegistry = "@koalaui:registry"
const koalaRegistry = "https://rnd-gitlab-msc.huawei.com/api/v4/projects/3921/packages/npm/"
const idlizeRegistry = "https://nexus.bz-openlab.ru:10443/repository/koala-npm/"

function setRegistry(key, value) {
    execSync(`npm config --location project set ${key} ${value}`)
}

function getRegistry(key) {
    execSync(`npm config --location project get ${key}`)
}

function pack() {
    if (fs.existsSync(prebuiltPath))
        fs.rmSync(prebuiltPath, { recursive: true })
    fs.mkdirSync(prebuiltPath)
    execSync(`npm pack --pack-destination ${prebuiltPath}`)
}

function publishToOpenlab() {

    pack()
    setRegistry(keyIdlizeRegistry, idlizeRegistry)
    setRegistry("strict-ssl", false)

    let packageName = fs.readdirSync(prebuiltPath)[0]
    console.log(chalk.green(`> Publishing ${packageName}...`))
    if (dryRun) {
        execSync(`npm publish ${path.join(prebuiltPath, packageName)} --dry-run`)
    } else {
        execSync(`npm publish ${path.join(prebuiltPath, packageName)}`)
    }

}

function publishToGitlab() {

    pack()
    setRegistry(keyIdlizeRegistry, koalaRegistry)
    setRegistry("strict-ssl", false)

    let packageName = fs.readdirSync(prebuiltPath)[0]
    console.log(chalk.green(`> Publishing ${packageName}...`))
    if (dryRun) {
        execSync(`npm publish ${path.join(prebuiltPath, packageName)} --dry-run`)
    } else {
        execSync(`npm publish ${path.join(prebuiltPath, packageName)}`)
    }

    setRegistry(keyIdlizeRegistry, idlizeRegistry)
}

function publish() {
    process.env.KOALA_BZ == true ? publishToOpenlab() : publishToGitlab()
}

publish()
