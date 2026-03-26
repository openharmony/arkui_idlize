/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import * as os from "os"

const RESPONSE_FILE_THRESHOLD = 128 * 1024 // 128KB conservative threshold

/**
 * Check if command line arguments exceed the threshold for response files
 */
export function needsResponseFile(args: string[]): boolean {
  return args.join(' ').length > RESPONSE_FILE_THRESHOLD
}

/**
 * Write file list to a temporary response file.
 * Files with newlines in paths will throw an error (newline is used as delimiter).
 * @param files - list of file paths to write
 * @param outputDir - optional directory to create response file in; defaults to OS temp dir
 * @returns path to the response file
 */
export function createResponseFile(files: string[], outputDir?: string): string {
  // Check for newlines in paths - they would corrupt the response file format
  for (const file of files) {
    if (file.includes('\n')) {
      throw new Error(`File path contains newline character which is not supported: ${file}`)
    }
  }

  const baseDir = outputDir ?? os.tmpdir()
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true })
  }
  const tempDir = fs.mkdtempSync(path.join(baseDir, 'idlize-input-'))
  const responseFile = path.join(tempDir, 'files.txt')
  fs.writeFileSync(responseFile, files.join('\n'), 'utf-8')
  // Return absolute path so it works regardless of subprocess working directory
  return path.resolve(responseFile)
}

/**
 * Read file list from a response file
 */
export function expandResponseFile(filepath: string): string[] {
  const content = fs.readFileSync(filepath, 'utf-8')
  return content.split('\n').filter(Boolean)
}

function processInputOption(option: string | string[] | undefined): string[] {
    if (typeof option === 'undefined') {
        return []
    } else if (typeof option === 'string') {
        return option.split(',')
            .map(item => item.trim())
            .filter(Boolean)
    } else {
        return option.flatMap(processInputOption)
    }
}

// iterate through files in the same order even if input order changes
function sortFiles(files: string[]): string[] {
    return files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
}

export type InputPaths = {
    baseDirs: string[]
    inputDirs: string[]
    auxInputDirs: string[]
    inputFiles: string[]
    auxInputFiles: string[]
    libraryPackages: string[]
}
export function formatInputPaths(options: any): InputPaths {
    if (options.inputFiles) {
        options.inputFiles = processInputOption(options.inputFiles)
    }

    if (options.auxInputFiles) {
        options.auxInputFiles = processInputOption(options.auxInputFiles)
    }

    if (options.inputDir) {
        options.inputDir = processInputOption(options.inputDir)
    }

    if (options.auxInputDir) {
        options.auxInputDir = processInputOption(options.auxInputDir)
    }

    if (options.libraryPackages) {
        options.libraryPackages = processInputOption(options.libraryPackages)
    }

    const inputDirs: string[] = options.inputDir || []
    const auxInputDirs: string[] = options.auxInputDir || []
    const inputFiles: string[] = options.inputFiles || []
    const auxInputFiles: string[] = options.auxInputFiles || []
    const libraryPackages: string[] = options.libraryPackages || []

    let baseDirs = options.baseDir ? processInputOption(options.baseDir) : inputDirs
    if (!baseDirs.length && inputFiles.length) {
        baseDirs = [...(new Set<string>(options.inputFiles.map((it:string) => path.dirname(it))).values())]
    }
    if (!baseDirs.length)
        throw new Error("Check your --base-dir parameter, value is missing")

    return {
        baseDirs,
        inputDirs,
        auxInputDirs,
        inputFiles: sortFiles(inputFiles),
        auxInputFiles: sortFiles(auxInputFiles),
        libraryPackages
    }
}

export function validatePaths(paths: string[], type: 'file' | 'dir'): void {
    paths.forEach(pathItem => {
        if (!fs.existsSync(pathItem)) {
            console.error(`Input ${type} does not exist: ${pathItem}`)
            process.exit(1)
        } else {
            console.log(`Input ${type} exists: ${pathItem}`)
        }
    })
}