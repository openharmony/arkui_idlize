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
import { GenerateOptions } from "./options"

function scanDirectory(dir: string, fileFilter: (file: string) => boolean, recursive = false): string[] {
    const dirsToVisit = [path.resolve(dir)]
    const result = []
    while (dirsToVisit.length > 0) {
        let dir = dirsToVisit.pop()!
        let dirents = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of dirents) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isFile()) {
                if (fileFilter(fullPath)) { result.push(fullPath) }
            } else if (recursive && entry.isDirectory()) {
                dirsToVisit.push(fullPath)
            }
        }
    }

    return result
}

export interface GenerateVisitor<T> {
    visitPhase1(): T
    visitPhase2?(siblings: { [key in string]: { tsSourceFile: ts.SourceFile, visitor: GenerateVisitor<T>, result: T }}): T
}

export function generate<T>(
    inputDirs: string[],
    inputFiles: string[],
    outputDir: string,
    visitorFactory: (sourceFile: ts.SourceFile, program: ts.Program, compilerHost: ts.CompilerHost) => GenerateVisitor<T>,
    options: GenerateOptions<T>
): void {
    if (options.enableLog) {
        console.log("Starting generation process...")
    }

    if (inputDirs.length === 0 && inputFiles.length === 0) {
        console.error("Error: No input specified (no directories and no files).")
        process.exit(1)
    }

    const resolvedInputDirs = inputDirs.map(dir => path.resolve(dir))

    if (options.enableLog) {
        console.log("Resolved input directories:", resolvedInputDirs)
    }

    let input: string[] = []

    if (resolvedInputDirs.length > 0) {
        resolvedInputDirs.forEach(dir => {
            if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
                if (options.enableLog) {
                    console.log(`Processing all .d.ts from directory: ${dir}`)
                }
                const fileFilter = (file: string) => file.endsWith(".d.ts")
                const files = scanDirectory(dir, fileFilter, options.recursive)
                input = input.concat(files)
            } else {
                console.warn(`Warning: Directory does not exist or is not a directory: ${dir}`)
            }
        })
    }

    if (inputFiles.length > 0) {
        inputFiles.forEach(file => {
            const fullPath = path.resolve(file)
            if (fs.existsSync(fullPath)) {
                if (options.enableLog) {
                    console.log(`Including input file: ${fullPath}`)
                }
                input.push(fullPath)
            } else {
                console.warn(`Warning: Input file does not exist: ${fullPath}`)
            }
        })
    }

    input = Array.from(new Set(input.map(p => path.resolve(p)))).sort()

    let compilerHost = ts.createCompilerHost(options.compilerOptions)
    let program = ts.createProgram(
        input.concat([path.join(__dirname, "../stdlib.d.ts")]),
        options.compilerOptions,
        compilerHost
    )

    if (options.enableLog) {
        console.log("Initialized TypeScript program with input files:", input)
    }

    if (outputDir && !fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const typeChecker = program.getTypeChecker()
    options.onBegin?.(outputDir, typeChecker)

    type VisitorStaff = {
        tsSourceFile: ts.SourceFile,
        visitor: GenerateVisitor<T>,
        result: T
    }
    const dtsFileName2Visitor: { [key in string]: VisitorStaff } = {}
    for (const sourceFile of program.getSourceFiles()) {
        const resolvedSourceFileName = path.resolve(sourceFile.fileName)
        
        const isInDir = resolvedInputDirs.some(dir => resolvedSourceFileName.startsWith(dir))
        const isExplicitFile = input.some(f => path.resolve(f) === resolvedSourceFileName)

        if (!isInDir && !isExplicitFile) {
            if (options.enableLog) {
                console.log(`Skipping file: ${resolvedSourceFileName}`)
            }
            continue
        }

        if (options.enableLog) {
            console.log(`Processing file: ${resolvedSourceFileName}`)
        }

        // Walk the tree to search for classes
        const visitor = visitorFactory(sourceFile, program, compilerHost)
        const result = visitor.visitPhase1()
        dtsFileName2Visitor[sourceFile.fileName] = {
            tsSourceFile: sourceFile,
            visitor,
            result
        }
    }

    for (const resolvedSourceFileName in dtsFileName2Visitor) {
        const visitorStaff = dtsFileName2Visitor[resolvedSourceFileName]
        if (visitorStaff.visitor.visitPhase2)
            visitorStaff.result = visitorStaff.visitor.visitPhase2(dtsFileName2Visitor)
    }

    for (const resolvedSourceFileName in dtsFileName2Visitor) {
        const visitorStaff: VisitorStaff = dtsFileName2Visitor[resolvedSourceFileName]
        options.onSingleFile?.(visitorStaff.result, outputDir, visitorStaff.tsSourceFile)
    }

    options.onEnd?.(outputDir)

    if (options.enableLog) {
        console.log("Generation completed.")
    }
}
