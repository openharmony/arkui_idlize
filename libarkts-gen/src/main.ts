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
import { toIDL } from "@idlize/core"
import { FileEmitter } from "./FileEmitter"
import { Config } from "./Config"
import { IDLFile } from "./IdlFile"

const options: {
    outputDir?: string,
    inputFile?: string,
    transform?: boolean,
    interfaces?: string
    methods?: string
    files?: string
} = program
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <path>', 'Path to file to generate from')
    .option('--transform', 'Applies some temporary fixes on input .idl')
    .option('--interfaces <string>', 'Ignore all other nodes, comma separated, no space')
    .option('--methods <string>', 'Ignore all other nodes, comma separated, no space')
    .option('--files <string>', 'Types of files to be emitted [bridges|bindings|enums], comma separated, no space')
    .parse()
    .opts()

function main() {
    const outDir = options.outputDir ?? `./out`
    const idlFile = options.inputFile ?? `./input/full.idl`
    const interfaces = options.interfaces?.split(`,`)
    const methods = options.methods?.split(`,`)
    const files = options.files?.split(`,`)
    const shouldFixInput = options.transform ?? false
    const idl = new IDLFile(toIDL(idlFile))

    const config = new Config(
        shouldFixInput,
        interfaces,
        methods,
        files,
    )

    new FileEmitter(
        outDir,
        idl,
        config,
    ).print()
}

main()
