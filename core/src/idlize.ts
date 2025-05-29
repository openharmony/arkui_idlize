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
import * as idl from "./idl"
import { GenerateOptions } from "./options"
import { isDefined } from "./util"

export function scanDirectory(dir: string, fileFilter: (file: string) => boolean, recursive = false): string[] {
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

export function scanInputDirs(inputDirs: string[]): string[]
export function scanInputDirs(inputDirs: string[], fileExtension: string): string[]
export function scanInputDirs(inputDirs: string[], fileFilter: (file: string) => boolean, recursive: boolean): string[]
export function scanInputDirs(
    inputDirs: string[],
    fileFilter: undefined | string | ((file: string) => boolean) = undefined,
    recursive = false,
): string[] {
    if (typeof fileFilter === 'undefined')
        return scanInputDirs(inputDirs, (_) => true, recursive)
    if (typeof fileFilter === 'string')
        return scanInputDirs(inputDirs, (file: string) => file.endsWith(fileFilter), recursive)
    const resolvedInputDirs = inputDirs.map(dir => path.resolve(dir))
    console.log("Resolved input directories:", resolvedInputDirs)
    return resolvedInputDirs.flatMap(dir => {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
            console.log(`Processing all definitions from directory: ${dir}`)
            return scanDirectory(dir, fileFilter, recursive)
        } else {
            console.warn(`Warning: Directory does not exist or is not a directory: ${dir}`)
            return []
        }
    }).sort((a, b) => {
        return path.basename(a).localeCompare(path.basename(b))
    })
}

export interface GenerateVisitor<T> {
    visitPhase1(): T
    visitPhase2?(siblings: { [key in string]: { tsSourceFile: ts.SourceFile, visitor: GenerateVisitor<T>, result: T, isAux: boolean }}): T
}

function fileExists(fileName: string): boolean {
    return ts.sys.fileExists(fileName);
}

export function generate<T>(
    baseDirs: string[],
    lookupDirs: string[],
    inputFiles: string[],
    auxInputFiles: string[],
    outputDir: string,
    stdlibFile: string,
    visitorFactory: (sourceFile: ts.SourceFile, program: ts.Program, compilerHost: ts.CompilerHost) => GenerateVisitor<T>,
    options: GenerateOptions<T>
): void {
    if (options.enableLog) {
        console.log("Starting generation process...")
    }

    if (inputFiles.length === 0) {
        console.error("Error: No input files specified.")
        process.exit(1)
    }

    let input: Set<string> = new Set<string>
    let auxInput: Set<string> = new Set<string>

    {
        const resolveOne = (file: string, tag: string) => {
            const fullPath = path.resolve(file)
            if (fs.existsSync(fullPath)) {
                if (options.enableLog)
                    console.log(`Including ${tag} file: ${fullPath}`)
                return fullPath
            } else
                console.warn(`Warning: ${tag} file does not exist: ${fullPath}`)
        }
        inputFiles.map(file => resolveOne(file, "file")).filter(isDefined).sort().map(file => input.add(file))
        auxInputFiles.map(file => resolveOne(file, "aux file")).filter(isDefined).sort().map(file => auxInput.add(file))
    }

    const compilerHostBase = ts.createCompilerHost(options.compilerOptions)
    const compilerHost: ts.CompilerHost = {
        ...compilerHostBase,
        resolveModuleNames: (moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions, containingSourceFile?: ts.SourceFile): (ts.ResolvedModule | undefined)[] => {
            const resolvedModules: (ts.ResolvedModule|undefined)[] = []
            for (let moduleName of moduleNames) {

                // TODO: move this replacement table to some external config...
                {
                    const replacement:{[key:string]:string} = {
                        "../component/navigation": "@internal/component/ets/navigation",
                        "wrappedBuilderObject": "@internal/component/ets/common",
                    }
                    moduleName = replacement[moduleName] || moduleName;
                }

                let result:ts.ResolvedModuleFull|undefined = ts.resolveModuleName(moduleName, containingFile, options, compilerHostBase).resolvedModule
                if (result)
                    resolvedModules.push(result)
                else {
                    // as a some fallback - try to resolve from parents of containingFile, lookupDirs
                    for(let pov of [path.dirname(containingFile), ...lookupDirs]) {
                        while (!result) {
                            for(const extension of ["", ".d.ts", ".d.ets"]) {
                                const candidate = `${moduleName}${extension}`;
                                if (path.isAbsolute(candidate) && fileExists(candidate)) {
                                    result = {resolvedFileName: candidate, extension: ts.Extension.Dts, isExternalLibraryImport: false}
                                    break
                                }
                                const povCandidate = path.join(pov, candidate)
                                if (fileExists(povCandidate)) {
                                    result = {resolvedFileName: povCandidate, extension: ts.Extension.Dts, isExternalLibraryImport: false}
                                    break
                                }
                            }
                            if (result)
                                break
                            result = ts.resolveModuleName(
                                path.join(pov, moduleName),
                                containingFile,
                                options,
                                compilerHostBase).resolvedModule
                            if (result)
                                break
                            result = ts.resolveModuleName(
                                moduleName,
                                pov,
                                options,
                                compilerHostBase).resolvedModule
                            if (result)
                                break
                            const nextPov = path.resolve(pov, "..")
                            if (nextPov == pov)
                                break
                            if (baseDirs.every(baseDir => path.relative(baseDir, nextPov).startsWith("..")))
                                break
                            pov = nextPov
                        }
                        if (result)
                            break
                    }
                    if (!result)
                        console.warn(`Dts import at '${containingFile}', module '${moduleName}': unable to resolve source file path`)
                    resolvedModules.push(result);
                }
            }
            return resolvedModules;
        }
    }

    if (!fs.existsSync(stdlibFile))
        throw new Error("Unable to find stdlib.d.ts")

    const program = ts.createProgram(
        [...input.values(), ...auxInput.values(), stdlibFile],
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
        result: T,
        isAux: boolean
    }
    const dtsFileName2Visitor: { [key in string]: VisitorStaff } = {}
    for (const sourceFile of program.getSourceFiles()) {
        const resolvedSourceFileName = path.resolve(sourceFile.fileName)

        const isAux = !input.has(resolvedSourceFileName)
        if (options.enableLog) {
            console.log(`Processing ${isAux?"aux ":""}file: ${resolvedSourceFileName}`)
        }

        // Walk the tree to search for classes
        const visitor = visitorFactory(sourceFile, program, compilerHost)
        const result = visitor.visitPhase1()
        dtsFileName2Visitor[sourceFile.fileName] = {
            tsSourceFile: sourceFile,
            visitor,
            result,
            isAux: isAux
        }
    }

    for (const resolvedSourceFileName in dtsFileName2Visitor) {
        const visitorStaff = dtsFileName2Visitor[resolvedSourceFileName]
        if (visitorStaff.visitor.visitPhase2)
            visitorStaff.result = visitorStaff.visitor.visitPhase2(dtsFileName2Visitor)
    }

    for (const resolvedSourceFileName in dtsFileName2Visitor) {
        const visitorStaff = dtsFileName2Visitor[resolvedSourceFileName]
        options.onSingleFile?.(visitorStaff.result, outputDir, visitorStaff.tsSourceFile, visitorStaff.isAux)
    }

    options.onEnd?.(outputDir)

    if (options.enableLog) {
        console.log("Generation completed.")
    }
}

export const PACKAGE_IDLIZE_INTERNAL = "idlize.internal"

export function isInIdlize(entry: idl.IDLEntry | idl.IDLFile): boolean {
    return idl.isInPackage(entry, "idlize")
}

export function isInIdlizeInterop(entry: idl.IDLEntry | idl.IDLFile): boolean {
    return idl.isInPackage(entry, `${PACKAGE_IDLIZE_INTERNAL}.interop`)
}

export function isInIdlizeInternal(entry: idl.IDLEntry | idl.IDLFile): boolean {
    return idl.isInPackage(entry, PACKAGE_IDLIZE_INTERNAL)
}

export function isInIdlizeStdlib(entry: idl.IDLEntry | idl.IDLFile): boolean {
    return idl.isInPackage(entry, "idlize.stdlib")
}