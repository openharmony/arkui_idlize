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
import { PeerFile, toIDLFile, PeerLibrary, scanInputDirs, IDLFile, linearizeNamespaceMembers, isInterface } from "@idlizer/core"

function processInputOption(option: string | undefined): string[] {
    if (!option) return []
    if (typeof option === 'string') {
        return option.split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    return []
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
    if (options.inputFiles && typeof options.inputFiles === 'string') {
        options.inputFiles = processInputOption(options.inputFiles)
    }

    if (options.auxInputFiles && typeof options.auxInputFiles === 'string') {
        options.auxInputFiles = processInputOption(options.auxInputFiles)
    }

    if (options.inputDir && typeof options.inputDir === 'string') {
        options.inputDir = processInputOption(options.inputDir)
    }

    if (options.auxInputDir && typeof options.auxInputDir === 'string') {
        options.auxInputDir = processInputOption(options.auxInputDir)
    }

    if (options.libraryPackages && typeof options.libraryPackages === 'string') {
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
        inputFiles,
        auxInputFiles,
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

export interface PredefinedFiles {
    interop: PeerFile[]
    root: PeerFile[]
}

const PREDEFINED_PATH = path.resolve(require.resolve('@idlizer/libohos'), '..', '..', '..', '..', 'predefined')
export function libohosPredefinedFiles(): string[] {
    return scanInputDirs([PREDEFINED_PATH, path.join(PREDEFINED_PATH, 'interop')])
}
