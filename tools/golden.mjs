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
import fs from 'fs';
import path from 'path'
import { program } from 'commander';
import { execSync } from 'child_process';
import { exit } from 'process';

function errorAndExit(error) {
    console.error(error)
    exit(1)
}

function main() {
    const options = program
        .option(`--input-dir <path>`, 'directory with produced output, that must be compared with golden')
        .option(`--golden-dir <path>`, 'directory describing expected output')
        .option(`--gen`, 'replace goldens with input', false)
        .parse()
        .opts()

    const inputDir = path.resolve(process.cwd(), options.inputDir)
    const goldenDir = path.resolve(process.cwd(), options.goldenDir)
    if (!inputDir || !fs.existsSync(inputDir))
        errorAndExit(`input-dir ${inputDir} does not exists`)
    if (!goldenDir || !fs.existsSync(goldenDir))
        errorAndExit(`golden-dir ${goldenDir} does not exists`)
    try {
        execSync(`diff --recursive ${goldenDir} ${inputDir}`)
    } catch (e) {
        if (options.gen) {
            fs.rmSync(goldenDir, { recursive: true })
            fs.mkdirSync(goldenDir, { recursive: true })
            fs.cpSync(inputDir, goldenDir, { recursive: true })
            console.log(e.stdout.toString())
        } else {
            errorAndExit(e.stdout.toString())
        }
    }
}

main()