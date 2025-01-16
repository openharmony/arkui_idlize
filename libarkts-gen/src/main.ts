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
import * as fs from "fs"
import * as path from "path"
import * as ts from "typescript"
import { findVersion, generate, GeneratorConfiguration, IDLEntry, Language, setDefaultConfiguration, toIDL } from "@idlize/core"
import { LibarktsGenerator } from "./LibarktsGenerator"
import { IDLFile, Es2PandaTransformer } from "./Es2PandaTransformer"


const options = program
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-file <path>', 'Name of file to convert')
    .option('--suppress-errors <suppress>', 'Error codes to suppress, comma separated, no space')
    .option('--libarkts-transform', 'Invokes Es2PandaTransformer on input .idl')
    .parse()
    .opts()

function generateTarget(idl: IDLFile, outDir: string, language: Language) {
    if (options.libarktsTransform) {
        new Es2PandaTransformer(idl).transform()
    }
    new LibarktsGenerator(outDir, idl).print()
}


function main() {

    const outDir = options.outputDir ?? "./out"
    const language = Language.fromString(options.language ?? "ts")
    const idlFile = options.inputFile ?? "./tests/subset.idl"
    const idl = new IDLFile(toIDL(idlFile))

    generateTarget(idl, outDir, language)
}

main()