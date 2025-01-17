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
import { Language, toIDL } from "@idlize/core"
import { LibarktsGenerator } from "./LibarktsGenerator"
import { IDLFile, Es2PandaTransformer } from "./Es2PandaTransformer"
import { Config } from "./Config"

const options: {
    outputDir?: string,
    inputFile?: string,
    libarktsTransform?: boolean,
    generateFor?: string
} = program
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <path>', 'Path to file to generate from')
    .option('--libarkts-transform', 'Invokes Es2PandaTransformer on input .idl')
    .option('--generate-for <string>', 'Ignore all other nodes, comma separated, no space')
    .parse()
    .opts()

function generateTarget(idl: IDLFile, outDir: string, language: Language) {
    if (options.libarktsTransform) {
        new Es2PandaTransformer(idl).transform()
    }
    new LibarktsGenerator(
        outDir,
        idl,
        new Config(options.generateFor?.split(`,`))
    ).print()
}

function main() {

    const outDir = options.outputDir ?? `./out`
    const language = Language.fromString(`ts`)
    const idlFile = options.inputFile ?? `./tests/subset.idl`
    const idl = new IDLFile(toIDL(idlFile))

    generateTarget(idl, outDir, language)
}

main()