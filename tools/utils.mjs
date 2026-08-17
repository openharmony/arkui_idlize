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

import fs from "fs"
import path, { join } from "path"
import { fileURLToPath } from 'url'
import { execSync } from "child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const IDLIZE_HOME = path.resolve(path.join(__dirname, ".."))

export class Package {
    constructor(path) {
        this.path = path
    }

    package() {
        return path.join(this.path, "package.json")
    }

    name() {
        return this.read("name")
    }

    version() {
        return this.read("version")
    }

    snapshot() {
        return fs.readFileSync(this.package())
    }
    restore(snapshot) {
        fs.writeFileSync(this.package(), snapshot)
    }

    write(key, value, updater) {
        const json = JSON.parse(fs.readFileSync(this.package(), "utf-8"))
        json[key] = value
        if (updater) updater(json)
        fs.writeFileSync(this.package(), JSON.stringify(json, null, 4), "utf-8")
    }

    read(key) {
        const json = JSON.parse(fs.readFileSync(this.package(), "utf-8"))
        return json[key]
    }

    compile() {
        const cwd = process.cwd()
        process.chdir(this.path)
        try {
            const script = "compile:release" in this.read("scripts")
                ? "compile:release"
                : "compile"
            execSync(`npm run ${script}`, { encoding: 'utf-8', stdio: 'inherit' })
        } catch(e) {
            console.log(`cannot compile package: ${this.name()}`, e)
            throw e
        } finally {
            process.chdir(cwd)
        }
    }

    pack(destination = '.') {
        const cwd = process.cwd()
        process.chdir(this.path)
        try {
            execSync(`npm pack --pack-destination ${destination}`, { encoding: 'utf-8' })
            const tgzName = `${this.name()}-${this.version().toString()}.tgz`.replaceAll('/', '-').replaceAll('@', '')
            return join(this.path, destination, tgzName)
        } finally {
            process.chdir(cwd)
        }
    }

    publish() {
        process.chdir(this.path)
        publish("latest")
    }

    idlizerDependencies = ["@idlizer/ost", "@idlizer/kit", "@idlizer/core", "@idlizer/libohos"]
}

export const all_packages = [
    new Package(path.join(IDLIZE_HOME, "arkgen")),
    new Package(path.join(IDLIZE_HOME, "arktscgen")),
    new Package(path.join(IDLIZE_HOME, "core")),
    new Package(path.join(IDLIZE_HOME, "ost")),
    new Package(path.join(IDLIZE_HOME, "kit")),
    new Package(path.join(IDLIZE_HOME, "libohos")),
    new Package(path.join(IDLIZE_HOME, "linter")),
    new Package(path.join(IDLIZE_HOME, "idlinter")),
    new Package(path.join(IDLIZE_HOME, "dtsgen")),
    new Package(path.join(IDLIZE_HOME, "etsgen")),
    new Package(path.join(IDLIZE_HOME, "ohosgen")),
    new Package(path.join(IDLIZE_HOME, "runner")),
]

export class Version {
    constructor(version) {
        let [major, minor, patch] = version.split(/\./).map(x => +x);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    up() {
        ++this.patch
        return new Version(`${this.major}.${this.minor}.${this.patch}`)
    }

    down() {
        --this.patch
        return new Version(`${this.major}.${this.minor}.${this.patch}`)
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}`
    }
}

export class Git {
    checkout(branch) {
        execSync(`git checkout -b ${branch}`)
    }

    push(branch) {
        execSync(`git push ${branch}`)
    }

    branch() {
        return execSync("git rev-parse --abbrev-ref HEAD", { encoding: 'utf8'}).toString().trim()
    }

    checkBranch(branch) {
        const branches = execSync("git branch", { encoding: 'utf8'}).toString().trim()
        return branches.includes(branch)
    }

    deleteBranch(branch) {
        execSync(`git branch -D ${branch}`)
    }

    hash() {
        return execSync("git rev-parse --short HEAD", { encoding: 'utf8'}).toString().trim()
    }

    commit(message) {
        execSync(`git commit -m '${message}'`)
    }

    add(files) {
        execSync(`git add ${files}`)
    }

    restore(files) {
        execSync(`git restore ${files}`)
    }

    clean() {
        execSync("git clean -fd")
    }

}

export function writeToPackageJson(filePath, key, value, updater) {
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    json[key] = value
    if (updater) updater(json)
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8")

}

export function replaceInJson(filePath, regexp, value) {
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2).replace(regexp, value), "utf-8")

}

export function publish(tag, dryRun = false) {
    if (dryRun) {
        execSync(`npm publish --dry-run --tag ${tag}`)
    } else {
        execSync(`npm publish --tag ${tag} --access public`)
    }
}
