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

import { program } from "commander"
import { toIDL } from "@idlizer/core"
import { FileEmitter } from "./FileEmitter"
import { Config } from "./Config"
import { IDLFile } from "./idl-utils"
import { Options } from "./Options"
import { VerifyVisitor } from "./visitors/VerifyVisitor"
import * as path from "node:path"

const cliOptions: {
    inputFile?: string,
    outputDir?: string,
    transform?: boolean,
    files?: string
    optionsFile?: string
} = program
    .option('--input-file <path>', 'Path to file to generate from')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--transform', 'Applies some temporary fixes on input .idl')
    .option('--files <string>', 'Types of files to be emitted [bridges|bindings|enums], comma separated, no space')
    .option('--options-file <path>', 'Path to file which determines what to generate')
    .parse()
    .opts()

function main() {
    const outDir = cliOptions.outputDir ?? `./out`
    const idlFile = cliOptions.inputFile ?? `./input/full.idl`
    const files = cliOptions.files?.split(`,`)
    const optionsFile = cliOptions.optionsFile ?? path.join(__dirname, `../input/ignore.json5`)
    const shouldFixInput = cliOptions.transform ?? false

    const idl = new IDLFile(toIDL(idlFile))
    new VerifyVisitor(idl).complain()

    new FileEmitter(
        outDir,
        idl,
        new Config(
            new Options(optionsFile),
            shouldFixInput,
            files
        ),
    ).print()
}

main()
