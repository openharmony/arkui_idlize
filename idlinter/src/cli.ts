/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { program } from "commander"
import * as fs from "fs"
import * as path from "path"
import { idlManager } from "./idlprocessing"
import "./validator"
import { outputReadableResult } from "./formatter"

const options = program
    .version("0.0.3")
    .option("--check <path...>", "Paths to individual .idl files (or directories recursively containing them) for validation")
    .option("--load <path...>", "Paths to individual .idl files (or directories recursively containing them) for loading and symbol search (only those also mentioned in --check will be checked)")
    .option("--mode <mode>", "Enable custom validation mode (currently under construction).")
    .addHelpText("after", "\nExit codes are (1) for invalid paths and (2) in case of errors/fatals found in .idl files.")
    .parse()
    .opts()

function processIdl(checkFiles: Set<string>, loadFiles: Set<string>) {
    for (let ent of checkFiles) {
        idlManager.addFile(ent)
    }
    for (let ent of loadFiles) {
        idlManager.addFile(ent, true)
    }
    idlManager.runPasses()
    outputReadableResult(idlManager.results)
}

function listIdl(listPath: string | string[], what: string, excluding?: Set<string>): Set<string> {
    try {
        if (Array.isArray(listPath)) {
            const files = new Set<string>()
            for (const path of listPath) {
                const pathFiles = listIdl(path, what, excluding)
                for (const file of pathFiles) {
                    files.add(file)
                }
            }
            return files
        }
        let stat = fs.lstatSync(listPath)
        if (stat.isFile() && listPath.endsWith(".idl")) {
            return new Set([path.normalize(listPath)].filter((n) => !excluding || !excluding.has(n)))
        }
        if (stat.isDirectory()) {
            let files = fs.readdirSync(listPath, { recursive: true, withFileTypes: true }).map((n) => path.join(n.parentPath, n.name)).filter((n) => n.endsWith(".idl")).map(path.normalize).filter((n) => !excluding || !excluding.has(n))
            return new Set(files)
        }
    } catch (e) {
    }
    console.error(`Invalid path ${listPath} in ${what}`)
    process.exit(1)
}

function main() {
    let checkFiles = new Set<string>()
    let loadFiles = new Set<string>()
    if (options.check == null && options.load == null) {
        program.help()
    }
    if (options.check != null) {
        checkFiles = listIdl(options.check, "--check")
    }
    if (options.load != null) {
        loadFiles = listIdl(options.load, "--load", checkFiles)
    }
    idlManager.mode = options.mode ?? ""
    processIdl(checkFiles, loadFiles)
    if (idlManager.results.hasErrors) {
        process.exit(2)
    }
}

if (require.main === module) {
    main()
}
