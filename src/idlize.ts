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

import * as ts from "typescript"
import * as fs from "fs"
import * as path from "path"
import { GenerateOptions, GenericVisitor } from "./options"

export function generate<T>(
    inputDir: string,
    inputFile: string | undefined,
    outputDir: string,
    visitorFactory: (sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker) => GenericVisitor<T>,
    options: GenerateOptions<T>
): void {
    inputDir = path.resolve(inputDir)
    // Build a program using the set of root file names in fileNames
    let program = ts.createProgram(inputFile ? [
        path.join(inputDir, inputFile)
    ] : fs.readdirSync(inputDir)
        .map(elem => path.join(inputDir, elem)).concat([path.join(__dirname, "../stdlib.d.ts")]), options.compilerOptions)

    // Get the checker, we will use it to find more about classes
    if (outputDir && !fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const typeChecker = program.getTypeChecker()
    options.onBegin?.(outputDir,typeChecker)

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        if (path.resolve(sourceFile.fileName).indexOf(inputDir) == -1) {
            // console.log("Ignore ", path.resolve(sourceFile.fileName) , "wrt", inputDir)
            continue
        }
        if (inputFile && path.basename(sourceFile.fileName) != inputFile) {
            continue
        }

        // Walk the tree to search for classes
        const visitor = visitorFactory(sourceFile, typeChecker)
        const output = visitor.visitWholeFile()

        options.onSingleFile?.(output, outputDir, sourceFile)
    }

    options.onEnd?.(outputDir)

    return
}
