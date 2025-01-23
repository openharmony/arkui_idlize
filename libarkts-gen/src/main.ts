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
import { Transformer } from "./transformers/transformer"

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
    .option('--transform', 'Invokes Es2PandaTransformer on input .idl')
    .option('--interfaces <string>', 'Ignore all other nodes, comma separated, no space')
    .option('--methods <string>', 'Ignore all other nodes, comma separated, no space')
    .option('--files <string>', 'Types of files to be emitted [bridges|bindings|enums], comma separated, no space')
    .parse()
    .opts()

function main() {
    const outDir = options.outputDir ?? `./out`
    const idlFile = options.inputFile ?? `./input/full.idl`
    const idl = new IDLFile(toIDL(idlFile))

    const config = new Config(
        options.interfaces?.split(`,`),
        options.methods?.split(`,`),
        options.files?.split(`,`)
    )

    if (options.transform) {
        // todo: fixer
    }
    new FileEmitter(
        outDir,
        new Transformer(config).transform(idl),
        config,
    ).print()
}

main()
