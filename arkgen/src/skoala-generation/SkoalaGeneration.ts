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

import * as path from "path"
import * as fs from "fs"
import { OptionValues } from "commander"
import { SkoalaInstall } from "./SkoalaInstall"
import { TSInterfacesVisitor } from "./printers/InterfacePrinter"
import { TSWrappersVisitor } from "./printers/WrappersPrinter"
import { TargetFile } from "@idlizer/libohos"
import { LanguageWriter, createLanguageWriter } from "@idlizer/core"
import { makeTSSerializerFromIdl } from "./printers/SerializerPrinter"
import { Language } from "@idlizer/core"
import { IdlSkoalaLibrary } from "./idl/idlSkoalaLibrary"

export function generateIdlSkoala(outDir: string, skoalaLibrary: IdlSkoalaLibrary, options: OptionValues) {
    const skoala = new SkoalaInstall(outDir, true)

    const skoalaFiles: string[] = []
    const result = printSkoala(skoalaLibrary)
    for (const [targetFile, data] of result) {
        const outComponentFile = skoala.interface(targetFile)
        writeFile(outComponentFile, data.getOutput().join('\n'), !options.onlyIntegrated)
        skoalaFiles.push(outComponentFile)
    }

    writeFile(skoala.interface(new TargetFile('Serializer.ts')),
        makeTSSerializerFromIdl(skoalaLibrary),
        true,
    )

    copyToSkoala(path.join(__dirname, '..', 'skoala_lib'), skoala)
}

function writeFile(filename: string, content: string, integrated: boolean = true) {
    if (integrated)
        fs.writeFileSync(filename, content)
}

export function printSkoala(library: IdlSkoalaLibrary): Map<TargetFile, LanguageWriter> {
    let result: Map<TargetFile, LanguageWriter> = new Map()

    let wrVis = new TSWrappersVisitor()
    for (let file of library.files) {
        const writer = createLanguageWriter(Language.TS, library)
        wrVis.printImports(file, writer)
        wrVis.printWrappers(file, writer)
        result.set(
            new TargetFile(file.baseName.replace(".d.ts", ".ts")),
            writer
        )
    }

    const writer = createLanguageWriter(Language.TS, library)
    let intVis = new TSInterfacesVisitor(library)
    for (let file of library.files) {
        intVis.printInterfaces(file, writer)
    }
    result.set(
        new TargetFile('index-full.d.ts'),
        writer
    )

    return result
}

export function copyToSkoala(from: string, skoala: SkoalaInstall, filters?: string[]) {
    filters = filters?.map(it => path.join(from, it))
    copyDir(from, skoala.outDir, true, filters)
}

function copyDir(from: string, to: string, recursive: boolean, filters?: string[]) {
    fs.readdirSync(from).forEach(it => {
        const sourcePath = path.join(from, it)
        const targetPath = path.join(to, it)
        const statInfo = fs.statSync(sourcePath)
        if (statInfo.isFile()) {
            copyFile(sourcePath, targetPath, filters)
        }
        else if (recursive && statInfo.isDirectory()) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath)
            }
            copyDir(sourcePath, targetPath, recursive, filters)
        }
    })
}
function copyFile(from: string, to: string, filters?: string[]) {
    if (filters && !filters.includes(from))
        return
    fs.copyFileSync(from, to)
}
