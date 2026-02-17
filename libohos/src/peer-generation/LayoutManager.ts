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
import { getNamespaceName, getNamespacesPathFor, Language, LanguageWriter, LayoutManager, LayoutTargetDescription, PeerLibrary, wrapCurrentFileDescription } from "@idlizer/core"
import { ImportsCollector } from "./ImportsCollector.js"
import { tsCopyrightAndWarning } from "./FileGenerators.js"
import { peerGeneratorConfiguration } from "../DefaultConfiguration.js"
import { collectDeclItself } from "./ImportsCollectorUtils.js"
import { writeFile } from "./common.js"

export interface PrinterResult {
    over: LayoutTargetDescription
    generate: () => LanguageWriter | {
        imports: ImportsCollector
        content: LanguageWriter
    }
    private?: boolean
    weight?: number
    ignoreNamespace?: boolean
}

interface ExecutedPrinterResult {
    over: LayoutTargetDescription
    content: LanguageWriter
    imports: ImportsCollector
    private?: boolean
    weight?: number
    ignoreNamespace?: boolean

}

export type OutputFile = { content: string[], imports: ImportsCollector, extension: string, exported: boolean }

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
    return installFiles(outDir, library, printFiles(library, printers, options))
}

export function printFiles(library: PeerLibrary, printers: Printer[], options?: {
    fileExtension?: string,
    customLayout?: LayoutManager,
    isDeclared?: boolean,
}): Map<string, OutputFile> {
    const storage = new Map<string, ExecutedPrinterResult[]>()

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
        const executionResult = wrapCurrentFileDescription(it.over, it.generate)
        storage.get(filePath)?.push({
            over: it.over,
            ignoreNamespace: it.ignoreNamespace,
            private: it.private,
            weight: it.weight,
            content: executionResult instanceof LanguageWriter ? executionResult : executionResult.content,
            imports: executionResult instanceof LanguageWriter ? new ImportsCollector : executionResult.imports,
        })
    })

    // print
    const result: Map<string, OutputFile> = new Map()
    Array.from(storage.entries()).forEach(([filePath, results]) => {
        results.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
        results.sort(sortByNamespaces)

        const imports = new ImportsCollector()
        results.forEach(it => {
            wrapCurrentFileDescription(it.over, () => {
                it.content.features.forEach(feature => {
                    if (feature.type === "raw")
                        imports.addFeature(feature)
                    else
                        collectDeclItself(library, feature.node, imports)
                })
                imports.merge(it.imports)
            })
        })
        result.set(filePath, {
            content: printWithNamespaces(library, results, { isDeclared: !!options?.isDeclared }),
            imports,
            extension: options?.fileExtension ?? library.language.extension,
            exported: !results.every(it => !!it.private || !isEntryExported(it.over.node))
        })
    })
    return result
}

export function installFiles(outDir: string, library: PeerLibrary, files: Map<string, OutputFile>): string[] {
    const installedToExport: string[] = []
    files.forEach(({ content, imports, extension, exported }, filePath) => {
        const codePrefix: string[] = []
        if (library.language === Language.KOTLIN) {
            codePrefix.push(`package ${filePath}\n`)
        }
        if (library.language === Language.CJ) {
            imports.clear()
            codePrefix.push('package idlize', 'import std.collection.*', 'import Interop.*', 'import KoalaRuntime.*', 'import KoalaRuntime.memoize.*', 'import std.time.DateTime')
        }

        const importsWriter = library.createLanguageWriter()
        imports.print(importsWriter, filePath, outDir)
        const completeCode = codePrefix.concat(importsWriter.getOutput()).concat(content).join('\n')
        const text = tsCopyrightAndWarning(completeCode)

        const installPath = join(outDir, filePath) + extension
        if (exported) {
            installedToExport.push(installPath)
        }
        writeFile(installPath, text, { message: 'producing' })
    })

    return installedToExport
}

function printWithNamespaces(library: PeerLibrary, results: ExecutedPrinterResult[], options: { isDeclared: boolean }): string[] {
    const resultsContent = library.createLanguageWriter()
    const printer = createNamespacePrinter(resultsContent)
    printer.print(results, options)
    return resultsContent.getOutput()
}

interface NamespacePrinter {
    print(results: ExecutedPrinterResult[], options: { isDeclared: boolean }): void
}

function createNamespacePrinter(writer: LanguageWriter): NamespacePrinter {
    if (writer.language === Language.KOTLIN) {
        return new KotlinNamespacePrinter(writer)
    }
    return new DefaultNamespacePrinter(writer)
}

class DefaultNamespacePrinter implements NamespacePrinter {
    constructor(protected writer: LanguageWriter) {}
    protected alreadyWrapped: string[] = []
    print(results: ExecutedPrinterResult[], options: { isDeclared: boolean }): void {
        for (const record of results) {
            this.wrapNamespaces(record, options)
            this.writer.concat(record.content)
        }
        this.wrapNamespaces(undefined, options)
    }
    protected wrapNamespaces(item: ExecutedPrinterResult | undefined, options: { isDeclared: boolean }): void {
        const node = item?.over.node
        const ns = node ? getNamespacePathFromResult(item) : []
        let bestMatch = 0
        while (bestMatch < ns.length && bestMatch < this.alreadyWrapped.length) {
            if (ns[bestMatch].name != this.alreadyWrapped[bestMatch])
                break
            bestMatch++
        }
        this.onBeforePop(node)
        for (let i = bestMatch, end = this.alreadyWrapped.length; i < end; i++) {
            this.writer.popNamespace({ indent: true })
            this.alreadyWrapped.pop()
        }
        for (let i = bestMatch; i < ns.length; i++) {
            const defaultNamespace = idl.hasExtAttribute(ns[i], idl.IDLExtendedAttributes.DefaultExport)
            this.writer.pushNamespace(ns[i].name, { indent: true, isDefault: defaultNamespace, isDeclared: options.isDeclared })
            this.alreadyWrapped.push(ns[i].name)
        }
        this.onAfterPush(node, ns)
    }
    protected onBeforePop(entry: idl.IDLEntry | undefined): void {}
    protected onAfterPush(entry: idl.IDLEntry | undefined, ns: idl.IDLNamespace[]): void {}
}

class KotlinNamespacePrinter extends DefaultNamespacePrinter {
    private inCompanion = false
    private readonly companionEntryKinds = [idl.IDLKind.Const, idl.IDLKind.Method]
    protected onBeforePop(item: idl.IDLEntry | undefined): void {
        if (!this.inCompanion) {
            return
        }
        if (!item || !this.companionEntryKinds.includes(item.kind)) {
            this.writer.popIndent()
            this.writer.print(`}`)
            this.inCompanion = false
        }
    }
    protected onAfterPush(item: idl.IDLEntry | undefined, ns: idl.IDLNamespace[]): void {
        if (this.inCompanion) {
            return
        }
        if (item && this.companionEntryKinds.includes(item.kind) && ns.length > 0) {
            this.writer.print(`companion object {`)
            this.writer.pushIndent()
            this.inCompanion = true
        }
    }
}

function sortByNamespaces(a: ExecutedPrinterResult, b: ExecutedPrinterResult): number {
    return getNamespaceNameFromResult(a).localeCompare(getNamespaceNameFromResult(b))
}

function getNamespaceNameFromResult(a: ExecutedPrinterResult): string {
    return a.ignoreNamespace ? '' : getNamespaceName(a.over.node)
}

function getNamespacePathFromResult(a: ExecutedPrinterResult): idl.IDLNamespace[] {
    return a.ignoreNamespace ? [] : getNamespacesPathFor(a.over.node)
}
