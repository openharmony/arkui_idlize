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
import { execSync } from 'node:child_process'
import { copyFileSync, cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { createCommand } from "commander"
import { Package, IDLIZE_HOME, all_packages as idlize_packages } from './utils.mjs'
import { all_packages as external_packages } from '../external/tools/utils.mjs'

const all_packages = [
    ...idlize_packages,
    ...external_packages.map(it => new Package(it.path)),
]
const all_dependencies = [
    "@koalaui/compat",
    "@koalaui/common",
    "@koalaui/interop",
    "@koalaui/libarkts",
    "@idlizer/core",
    "@idlizer/interfaces",
    "@idlizer/libohos",
    "@idlizer/etsgen",
    "@idlizer/arkgen",
    "@idlizer/runner"
]

const INSTALL_JS_TEXT = `
const { mkdirSync } = require("node:fs")
const { resolve } = require("node:path")
const { execSync } = require("node:child_process")

if (!process.argv[2]) {
    throw new Error("Install directory was not provided!");
}

const TGZ_DIR = __dirname
const WORK_DIR = resolve(process.argv[2])

mkdirSync(WORK_DIR, { recursive: true })
execSync("npm init -y", { stdio: "ignore", cwd: WORK_DIR })
execSync(\`npm i \${TGZ_DIR}/*.tgz\`, { stdio: "ignore", cwd: WORK_DIR })

console.log("Done!")
console.log("Installed to", WORK_DIR)
console.log()
console.log("Please check that")
console.log()
console.log("* Panda SDK installed with correct version")
console.log("* SDK is downloaded")
console.log()
console.log("The tool can be used as follows:")
console.log()
console.log("cd", WORK_DIR)
console.log("npx @idlizer/runner m3 <path-to-arkts12-sdk> <path-to-peers>")
console.log()

`.trim()

function findPackage(name) {
    return all_packages.find(it => it.name() === name)
}

function mangleVersion(version, manglePanda) {
    if (manglePanda) {
        const pandaSdk = new Package(process.env.PANDA_SDK_PATH ?? join(IDLIZE_HOME, './external/incremental/tools/panda/node_modules/@panda/sdk'))
        const pandaVersion = pandaSdk.version()
        return `${version}-panda-${pandaVersion}`
    }
    return version
}

function applyVersions(dependencies, versions) {
    for (const dependency of dependencies) {
        if (!(dependency in versions))
            continue
        const pkg = findPackage(dependency)
        pkg.write('version', versions[pkg.name()])
        const subDependencies = pkg.read('dependencies')
        if (subDependencies) {
            for (const subDependency in subDependencies) {
                if (!(subDependency in versions))
                    continue
                subDependencies[subDependency] = versions[subDependency]
            }
            pkg.write('dependencies', subDependencies)
        }
    }
}

function bundle(bundleVersion, bundleOut, options) {
    bundleOut = bundleOut ? resolve(bundleOut) : join(IDLIZE_HOME, "bundle")
    const newVersion = mangleVersion(bundleVersion, options.pandaVersion)
    const oldVersions = all_dependencies.reduce((versions, dep) => {
        const pkg = findPackage(dep)
        versions[pkg.name()] = pkg.version().toString()
        return versions
    }, {})
    const newVersions = all_dependencies.reduce((versions, dep) => {
        const pkg = findPackage(dep)
        versions[pkg.name()] = newVersion
        return versions
    }, {})
    try {
        applyVersions(all_dependencies, newVersions)
        console.log("Compiling dependencies..")
        all_dependencies.forEach(dep => {
            const pkg = findPackage(dep)
            console.log(`compiling ${pkg.name()}..`)
            pkg.compile()
        })

        console.log("Packing..")
        mkdirSync(bundleOut, { recursive: true })
        all_dependencies.forEach(dep => {
            const pkg = findPackage(dep)
            console.log(`packing ${pkg.name()}..`)
            const packPath = pkg.pack()
            const packName = basename(packPath)
            copyFileSync(packPath, join(bundleOut, packName))
        })
        console.log(`Creating install.js..`)
        writeFileSync(join(bundleOut, 'install.js'), INSTALL_JS_TEXT)

        console.log(`All done! Bundle saved to ${bundleOut}`)
    } finally {
        applyVersions(all_dependencies, oldVersions)
    }
}

function main() {
    createCommand()
        .arguments('<bundle-version> [bundle-out]')
        .option('--no-panda-version', 'Mangle bundle version with Panda version')
        .action(bundle)
        .parse()
}


main()
