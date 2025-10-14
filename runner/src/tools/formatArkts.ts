/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'node:fs';
import * as path from 'node:path'

function upCurly(inputLines: string[]) {
    let prevLineNeedsCurly = false
    let prevCurlyNeeder = ''
    let outputLines = []
    const patterns = [
        /^\s*if\s*\(/,
        /^\s*else\s*$/,
        /^\s*}\s*else\s*$/
    ]
    for (const line of inputLines) {
        const needsCurly = patterns.some(p => p.test(line))
        let isOpeningCurlyLine = (/^\s*{\s*$/).test(line)
        if (prevLineNeedsCurly) {
            if (isOpeningCurlyLine) {
                outputLines.push(prevCurlyNeeder + ' {')
                prevLineNeedsCurly = false
                continue
            }
            outputLines.push(prevCurlyNeeder)
        }
        prevLineNeedsCurly = needsCurly
        if (needsCurly) {
            prevCurlyNeeder = line
        } else {
            outputLines.push(line)
        }
    }
    if (prevLineNeedsCurly) {
        outputLines.push(prevCurlyNeeder)
    }
    return outputLines
}

function processFile(inputFile: string, outputFile: string) {
    const contents = fs.readFileSync(inputFile).toString()
    const lines = contents.split('\n')
    const outputLines = upCurly(lines)
    
    fs.writeFileSync(outputFile, outputLines.join('\n'))
}

interface ArkTSFormatOptions {
    inputDir: string,
    outputDir: string | undefined,
    inplace: boolean | undefined
};

export function formatArkts(options: ArkTSFormatOptions) {
    const inputDir = path.resolve(process.cwd(), options.inputDir)
    let outputDir = inputDir
    if (options.outputDir) {
        outputDir = path.resolve(process.cwd(), options.outputDir)
    } else if (!options.inplace) {
        console.log(`Output directory is not specified and --inplace parameter is not provided`)
        return -1
    }

    if (!inputDir || !fs.existsSync(inputDir)) {
        console.log(`input-dir ${inputDir} does not exist`)
        return -1
    }

    if (!outputDir || !fs.existsSync(outputDir)) {
        console.log(`output-dir ${outputDir} does not exist`)
        return -1
    }
    const files = fs.readdirSync(inputDir, {
        recursive: true,
        withFileTypes: true
    })
    for (const file of files) {
        const fullPath = path.join(file.parentPath ?? file.path, file.name)
        const relPath = path.relative(inputDir, fullPath)
        const outputFilePath = path.join(outputDir, relPath)
        if (fs.lstatSync(fullPath).isFile()) {
            const dirName = path.dirname(outputFilePath)
            fs.mkdirSync(dirName, { recursive: true })
            processFile(fullPath, outputFilePath)
        }
    }
    return 0
}
