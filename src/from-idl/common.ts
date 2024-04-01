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

import * as fs from "fs"
import * as path from "path"
import { IDLEntry } from "../idl"
import * as webidl2 from "webidl2"
import { toIDLNode } from "./deserialize";
import { zip } from "../util";

export function fromIDL(
    inputDir: string,
    inputFile: string | undefined,
    outputDir: string,
    extension: string,
    verbose: boolean,
    transform: (name: string, content: string) => string
): void {
    inputDir = path.resolve(inputDir)
    const files: string[] =
        inputFile
            ? [path.join(inputDir, inputFile)]
            : fs.readdirSync(inputDir)
                .map((elem: string) => path.join(inputDir, elem))

    const results: string[] =
        files
            .map((file: string) => transform(file, fs.readFileSync(file).toString()))

    zip(files, results)
        .forEach(([fileName, output]: [string, string]) => {
            fs.mkdirSync(outputDir, { recursive : true })
            const outFile = path.join(
                outputDir,
                path.basename(fileName).replace(".idl", extension)
            )
            if (verbose) console.log(output)
            fs.writeFileSync(outFile, licence.concat(output))
        })
}

export function scanIDL(
    inputDir: string,
    inputFile: string | undefined,
): IDLEntry[][] {
    inputDir = path.resolve(inputDir)
    const files: string[] =
        inputFile
            ? [path.join(inputDir, inputFile)]
            : fs.readdirSync(inputDir)
                .map((elem: string) => path.join(inputDir, elem))

    return files
        .map((file: string) => {
            let content = fs.readFileSync(file).toString()
            let parsed = webidl2.parse(content)
            return parsed.map(it => toIDLNode(file, it))
        })
}

export const licence =
`/*
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

`
