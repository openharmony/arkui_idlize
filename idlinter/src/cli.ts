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

import * as fs from "fs"
import * as path from "path"
import { Command } from "commander"
import { DiagnosticMessageGroup, outputDiagnosticResultsFormatted } from "@idlizer/core"
import { idlManager } from "./idlprocessing"
import "./validator"
import { checkCompat } from "./compat"

function processIdl(checkFiles: Set<string>, loadFiles: Set<string>) {

    performance.mark("procStart")
    idlManager.setFiles(Array.from(checkFiles), Array.from(loadFiles))
    idlManager.runPasses()

    performance.mark("procEnd")
    performance.measure("proc", "procStart", "procEnd")
    const measure = performance.getEntriesByName("proc")[0];
    //console.log(`Processing duration: ${measure.duration} milliseconds`);

    outputDiagnosticResultsFormatted(DiagnosticMessageGroup.collectedResults)
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
            let files = fs.readdirSync(listPath, { recursive: true, withFileTypes: true }).map((n) => path.join((n as any/* support node<18 */).parentPath ?? n.path, n.name)).filter((n) => n.endsWith(".idl")).map(path.normalize).filter((n) => !excluding || !excluding.has(n))
            return new Set(files)
        }
    } catch (e) {
    }
    console.error(`Invalid path ${listPath} in ${what}`)
    process.exit(1)
}

function validateIdl(paths: string[], options: { load: string[], features: string[] }) {
    try {
        idlManager.loadFeatures(options.features)
    } catch (e: any) {
        console.error(e.message)
        process.exit(1)
    }

    let checkFiles = listIdl(paths, "check")
    let loadFiles = options.load == null
        ? new Set<string>()
        : listIdl(options.load, "--load", checkFiles)
    processIdl(checkFiles, loadFiles)
    if (DiagnosticMessageGroup.collectedResults.hasErrors) {
        process.exit(2)
    }
}

function checkCompatDirs(baseDir: string, commitDir: string, options: { load?: string[] }) {
    const loadFiles = options.load ? listIdl(options.load!, "--load") : new Set<string>()
    checkCompat(listIdl(baseDir, "base"), listIdl(commitDir, "commit"), loadFiles)
    outputDiagnosticResultsFormatted(DiagnosticMessageGroup.collectedResults)
    if (DiagnosticMessageGroup.collectedResults.hasErrors) {
        process.exit(2)
    }
}

export function idlinterMain() {
    const program = new Command()
        .name("@idlizer/idlinter")
        .version("0.0.8")
        .addHelpText("after", "\nExit codes are (1) for invalid arguments and (2) in case of errors/fatals found in .idl files.")

    program.command('compat <dir0> <dir1>')
        .description('check if dir1 is API-wise compatible with dir0')
        .option("--load <paths...>", "Paths to individual .idl files (or directories recursively containing them) for loading and symbol search\n(these files will not be checked)")
        .action(checkCompatDirs)

    program.command('check <paths...>')
        .description("Validate individual .idl files (or directories recursively containing them)")
        .option("--load <paths...>", "Paths to individual .idl files (or directories recursively containing them) for loading and symbol search\n(these files will not be checked)")
        .option("--features <features...>", "Enable additional validation features,\nincluding:\n" + idlManager.featuresHelp)
        .action(validateIdl)

    program.parse(process.argv.slice(2), { from: 'user' })
}

if (require.main === module) {
    idlinterMain()
}
