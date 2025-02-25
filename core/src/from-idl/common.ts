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
import { IDLFile } from "../idl"
import { toIDLFile } from "./deserialize";
import { zip } from "../util";

function getFilesRecursive(dirPath: string, arrayOfFiles: string[] = []) {
    let files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []
    files.forEach((file: string) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getFilesRecursive(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, file))
        }
    })
    return arrayOfFiles
}

export function fromIDL(
    inputDirs: string | string[],
    inputFiles: string | string[] | undefined,
    outputDir: string,
    extension: string,
    verbose: boolean,
    transform: (name: string, content: string) => string
): void {
    const resolvedInputDirs = Array.isArray(inputDirs) ? inputDirs.map(dir => path.resolve(dir)) : [path.resolve(inputDirs)]
    const resolvedInputFiles: string[] = Array.isArray(inputFiles)
        ? inputFiles.map(file => path.resolve(file))
        : typeof inputFiles === 'string'
        ? [path.resolve(inputFiles)]
        : []

    let files: string[] = []
    if (resolvedInputFiles.length > 0) {
        files = resolvedInputFiles
    } else {
        resolvedInputDirs.forEach(dir => {
            files = files.concat(getFilesRecursive(dir))
        })
    }

    const results: string[] = files.map(file => transform(file, fs.readFileSync(file).toString()))

    zip(files, results).forEach(([fileName, output]: [string, string]) => {
        fs.mkdirSync(outputDir, { recursive: true })
        console.log('producing', path.relative(resolvedInputDirs[0], fileName))
        const outFile = path.join(
            outputDir,
            path.relative(resolvedInputDirs[0], fileName).replace(".idl", extension)
        )
        if (verbose) console.log(output)
        if (!fs.existsSync(path.dirname(outFile))) {
            fs.mkdirSync(path.dirname(outFile), { recursive: true })
        }
        fs.writeFileSync(outFile, licence.concat(output))
        console.log("saved", outFile)
    })
}

export function scanIDL(
    inputDir: string,
    inputFile: string | undefined,
): IDLFile[] {
    inputDir = path.resolve(inputDir)
    const files: string[] =
        inputFile
            ? [path.join(inputDir, inputFile)]
            : fs.readdirSync(inputDir)
                .map((elem: string) => path.join(inputDir, elem))

    return files.map(it => toIDLFile(it))
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
