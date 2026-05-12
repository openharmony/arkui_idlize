/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import util from "node:util"
import { exit } from "node:process";
import { exec } from "child_process";
import path from "path"
import { all_packages, Package, IDLIZE_HOME } from "./utils.mjs";

const execAsync = util.promisify(exec)

const packagesToCompile = all_packages.concat(
    new Package(path.join(IDLIZE_HOME, "external/ui2abc/libarkts"))
)
const preCompileScripts = {
    "@koalaui/libarkts": "npm run reinstall:regenerate"
}

function computePackagesDependencies(packages) {
    const dependencies = new Map
    for (const pack of packages) {
        const packDependencies = pack.read("dependencies") ?? {}
        dependencies.set(pack, packages.filter(it => {
            return (it.read("name") ?? "") in packDependencies
        }))
    }
    return dependencies
}

function compileCommand(pack) {
    const name = pack.read("name")
    const scripts = pack.read("scripts") ?? {}
    const preCompileScript = name in preCompileScripts ? preCompileScripts[name] + " && " : ""
    const compileScript = "compile:self" in scripts ? "compile:self" : "compile"
    return `${preCompileScript}npm run ${compileScript} -C ${pack.path}`
}

function compileParallel(dependenciesMap, launched = [], finished = []) {
    let runningPromises = []
    for (const pack of dependenciesMap.keys()) {
        if (launched.includes(pack) || !dependenciesMap.get(pack).every(it => finished.includes(it))) {
            continue
        }
        launched.push(pack)
        runningPromises.push(execAsync(compileCommand(pack), { cwd: pack.path }).then(({error, stdout, stderr}) => {
            console.log(stdout)
            console.error(stderr)
            finished.push(pack)
            if (error) {
                throw error
            }
            return compileParallel(dependenciesMap, launched, finished)
        }))
    }
    return Promise.all(runningPromises)
}

compileParallel(computePackagesDependencies(packagesToCompile)).then(() => {
    console.log("All packages compiled")
}, (error) => {
    console.error(error.toString())
    if (error.stdout)
        console.error(error.stdout)
    console.error("Failed to compile packages")
    exit(1)
})