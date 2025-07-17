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
import { peerGeneratorConfiguration } from "../DefaultConfiguration"

export interface PrinterResult {
    over: LayoutTargetDescription
    collector: ImportsCollector
    content: LanguageWriter
    private?: boolean
    weight?: number
    ignoreNamespace?: boolean
}

export interface PrinterClass {
    print(library: PeerLibrary): PrinterResult[]
}
export interface PrinterFunction {
    (library: PeerLibrary): PrinterResult[]
}
export type Printer = PrinterClass | PrinterFunction

function isEntryExported(entry: idl.IDLEntry): boolean {
    if (!peerGeneratorConfiguration().currentModuleExportedPackages)
        return true
    const entryPackage = idl.getPackageClause(entry)
    return peerGeneratorConfiguration().currentModuleExportedPackages!.some(it => {
        const packageClause = it.split('.')
        return packageClause.every((part, index) => part === entryPackage.at(index))
    })
}

export function install(
    outDir: string,
    library: PeerLibrary,
    printers: Printer[],
    options?: {
        fileExtension?: string,
        customLayout?: LayoutManager,
        isDeclared?: boolean,
    }): string[] {
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
        if (!results.every(it => !!it.private || !isEntryExported(it.over.node))) {
            installedToExport.push(installPath)
        }
        results.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
        results.sort(sortByNamespaces)

        const imports = new ImportsCollector()
        let content: string[] = []

        results.forEach(it => {
            it.content.features.forEach(([feature, module]) => {
                imports.addFeature({ feature, module })
            })
            imports.merge(it.collector)
        })
        content = content.concat(printWithNamespaces(library, results, { isDeclared: !!options?.isDeclared }))
        if (library.language === Language.KOTLIN) {
            imports.clear()
            content = ['@file:OptIn(ExperimentalForeignApi::class)', 'package idlize', 'import kotlinx.cinterop.*', 'import interop.*'].concat(content)
        }
        if (library.language === Language.CJ) {
            imports.clear()
            content = ['package idlize', 'import std.collection.*', 'import Interop.*', 'import KoalaRuntime.*', 'import KoalaRuntime.memoize.*', 'import std.time.DateTime'].concat(content)
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

function printWithNamespaces(library: PeerLibrary, results: PrinterResult[], options: { isDeclared: boolean }): string[] {
    const resultsContent = library.createLanguageWriter()
    const resultsContentCache: string[] = []
    for (const record of results) {
        wrapNamespaces(record, resultsContentCache, resultsContent, options)
        resultsContent.concat(record.content)
    }
    wrapNamespaces(undefined, resultsContentCache, resultsContent, options)
    return resultsContent.getOutput()
}

function wrapNamespaces(item: PrinterResult | undefined, alreadyWrapped: string[], writer: LanguageWriter, options: { isDeclared: boolean }): void {
    const node = item?.over.node
    const ns = node ? getNamespacePathFromResult(item) : []
    let bestMatch = 0
    while (bestMatch < ns.length && bestMatch < alreadyWrapped.length) {
        if (ns[bestMatch].name != alreadyWrapped[bestMatch])
            break
        bestMatch++
    }
    for (let i = bestMatch, end = alreadyWrapped.length; i < end; i++) {
        writer.popNamespace({ ident: true })
        alreadyWrapped.pop()
    }
    for (let i = bestMatch; i < ns.length; i++) {
        writer.pushNamespace(ns[i].name, { ident: true, isDeclared: options.isDeclared })
        alreadyWrapped.push(ns[i].name)
    }
}

function sortByNamespaces(a: PrinterResult, b: PrinterResult): number {
    return getNamespaceNameFromResult(a).localeCompare(getNamespaceNameFromResult(b))
}

function getNamespaceNameFromResult(a:PrinterResult): string {
    return a.ignoreNamespace ? '' : getNamespaceName(a.over.node)
}

function getNamespacePathFromResult(a:PrinterResult): idl.IDLNamespace[] {
    return a.ignoreNamespace ? [] : getNamespacesPathFor(a.over.node)
}
