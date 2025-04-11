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
import { join } from "node:path"
import * as idl from "@idlizer/core"
import { writeIntegratedFile } from "./common"
import { getNamespaceName, getNamespacesPathFor, IDLEntry, Language, LanguageWriter, LayoutManager, LayoutTargetDescription, PeerLibrary } from "@idlizer/core"
import { ImportsCollector } from "./ImportsCollector"
import { ARKOALA_PACKAGE } from "./printers/lang/Java";
import { tsCopyrightAndWarning } from "./FileGenerators"

export interface PrinterResult {
    over: LayoutTargetDescription
    collector: ImportsCollector
    content: LanguageWriter
    private?: boolean
    weight?: number
}

export interface PrinterClass {
    print(library: PeerLibrary): PrinterResult[]
}
export interface PrinterFunction {
    (library: PeerLibrary): PrinterResult[]
}
export type Printer = PrinterClass | PrinterFunction

export function install(outDir: string, library: PeerLibrary, printers: Printer[], options?: { fileExtension?: string, customLayout?: LayoutManager }): string[] {
    const storage = new Map<string, PrinterResult[]>()

    // groupBy
    const layout = options?.customLayout ?? library.layout
    printers.flatMap(it => typeof it === 'function' ? it(library) : it.print(library)).forEach(it => {
        const resolved = layout.resolve(it.over)
        if (resolved == '') {
            throw new Error(`Cannot resolve location for ${idl.getFQName(it.over.node)}`)
        }
        const filePath = path.normalize(resolved)
        if (!storage.has(filePath)) {
            storage.set(filePath, [])
        }
        storage.get(filePath)?.push(it)
    })

    // print
    const installedToExport: string[] = []
    Array.from(storage.entries()).forEach(([filePath, results]) => {
        const installPath = join(outDir, filePath) + (options?.fileExtension ?? library.language.extension)
        if (!results.every(it => !!it.private)) {
            installedToExport.push(installPath)
        }
        results.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
        results.sort(sortByNamespaces)

        const imports = new ImportsCollector()
        let content: string[] = []

        results.forEach(it => imports.merge(it.collector))
        content = content.concat(printWithNamespaces(library, results))
        if (library.language === Language.CJ) {
            imports.clear()
            content = ['package idlize', 'import std.collection.*', 'import Interop.*'].concat(content)
        }
        if (library.language === Language.JAVA) {
            content = [`package ${ARKOALA_PACKAGE};`].concat(content)
        }

        const text = tsCopyrightAndWarning(
            imports.printToLines(filePath, outDir)
                .concat(content)
                .join('\n')
        )

        writeIntegratedFile(installPath, text, 'producing')
    })

    return installedToExport
}

function printWithNamespaces(library: PeerLibrary, results: PrinterResult[]): string[] {
    const resultsContent = library.createLanguageWriter()
    const resultsContentCache: string[] = []
    for (const record of results) {
        wrapNamespaces(record.over.node, resultsContentCache, resultsContent)
        resultsContent.concat(record.content)
    }
    wrapNamespaces(undefined, resultsContentCache, resultsContent)
    return resultsContent.getOutput()
}

function wrapNamespaces(node: IDLEntry | undefined, alreadyWrapped: string[], writer: LanguageWriter): void {
    const ns = node ? getNamespacesPathFor(node) : []
    let bestMatch = 0
    while (bestMatch < ns.length && bestMatch < alreadyWrapped.length) {
        if (ns[bestMatch].name != alreadyWrapped[bestMatch])
            break
        bestMatch++
    }
    for (let i = bestMatch, end = alreadyWrapped.length; i < end; i++) {
        writer.popNamespace(true)
        alreadyWrapped.pop()
    }
    for (let i = bestMatch; i < ns.length; i++) {
        writer.pushNamespace(ns[i].name, true)
        alreadyWrapped.push(ns[i].name)
    }
}

function sortByNamespaces(a: PrinterResult, b: PrinterResult): number {
    return getNamespaceName(a.over.node).localeCompare(getNamespaceName(b.over.node))
}