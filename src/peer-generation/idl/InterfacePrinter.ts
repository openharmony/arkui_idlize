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

import * as idl from '../../idl'
import * as path from 'path'
import { IdlPeerLibrary } from "./IdlPeerLibrary"
import { LanguageWriter, createLanguageWriter } from '../LanguageWriters'
import { Language, removeExt, renameDtsToInterfaces, throwException } from '../../util'
import { ImportsCollector } from '../ImportsCollector'
import { IdlPeerFile } from './IdlPeerFile'
import { IndentedPrinter } from "../../IndentedPrinter"
import { TargetFile } from '../printers/TargetFile'
import { PrinterContext } from '../printers/PrinterContext'
import { convertDeclaration, DeclarationConvertor } from "./IdlTypeConvertor";
import { makeSyntheticDeclarationsFiles } from './IdlSyntheticDeclarations'
import { cStyleCopyright } from '../FileGenerators'

interface InterfacesVisitor {
    getInterfaces(): Map<TargetFile, LanguageWriter>
    printInterfaces(): void
}

abstract class DefaultInterfacesVisitor implements InterfacesVisitor {
    protected readonly interfaces: Map<TargetFile, LanguageWriter> = new Map()
    getInterfaces(): Map<TargetFile, LanguageWriter> {
        return this.interfaces
    }
    abstract printInterfaces(): void
}

export class TSDeclConvertor implements DeclarationConvertor<void> {
    constructor(private readonly writer: LanguageWriter, readonly peerLibrary: IdlPeerLibrary) {
    }
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        throw "Enums are processed separately"
    }
    convertTypedef(node: idl.IDLTypedef): void {
        let type = this.peerLibrary.mapType(node.type)
        this.writer.print(`export declare type ${node.name} = ${type};`)
    }
    private replaceImportTypeNodes(text: string): string {///operate on stringOrNone[]
        for (const [stub, src] of [...this.peerLibrary.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(src, stub)
        }
        return text
    }

    private extendsClause(node: idl.IDLInterface): string {
        return ''
    //     if (!node.heritageClauses?.length)
    //         return ``
    //     if (node.heritageClauses!.some(it => it.token !== ts.SyntaxKind.ExtendsKeyword))
    //         throw "Expected to have only extend clauses"
    //     if (this.peerLibrary.isComponentDeclaration(node))
    //         // do not extend parent component interface to provide smooth integration
    //         return ``

    //     let parent = node.heritageClauses[0]!.types[0]
    //     return `extends ${parent.getText()}`
    }

    convertInterface(node: idl.IDLInterface): void {
        if (!this.peerLibrary.isComponentDeclaration((node))) {
            this.writer.print('export ' + this.replaceImportTypeNodes(idl.printInterface(node).join("\n")))
            return
        }
        let printer = new IndentedPrinter()
        let extendsClause = this.extendsClause(node)

        let classOrInterface = idl.isClass(node) ? `class` : `interface`
        if (this.peerLibrary.isComponentDeclaration(node))
            // because we write `ArkBlank implements BlankAttributes`
            classOrInterface = `interface`
        printer.print(`export declare ${classOrInterface} ${node.name} ${extendsClause} {`)
        printer.pushIndent()
        node.methods
            .forEach(it => {
                printer.print(`/** @memo */`)
                printer.print(`// ${it.name}`)
            })
        printer.popIndent()
        printer.print(`}`)

        this.writer.print(this.replaceImportTypeNodes(printer.getOutput().join('\n')))
    }
}

class TSInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: IdlPeerLibrary) {
        super()
    }

    protected generateFileBasename(originalFilename: string): string {
        return renameDtsToInterfaces(path.basename(originalFilename), this.peerLibrary.language)
    }

    private printImports(writer: LanguageWriter, file: IdlPeerFile) {
        const imports = new ImportsCollector()
        file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        imports.addFeature("KInt", "@koalaui/interop")
        imports.print(writer, removeExt(this.generateFileBasename(file.originalFilename)))
    }

    private printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: IdlPeerFile) {
        if (![Language.TS, Language.ARKTS].includes(writer.language)) return
        if (peerFile.enums.length != 0) {
            writer.print(`Object.assign(globalThis, {`)
            writer.pushIndent()
            for (const enumEntity of peerFile.enums) {
                writer.print(`${enumEntity.name}: ${enumEntity.name},`)
            }
            writer.popIndent()
            writer.print(`})`)
        }
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(this.peerLibrary.language)
            const typeConvertor = new TSDeclConvertor(writer, this.peerLibrary)
            this.printImports(writer, file)
            file.declarations.forEach(it => convertDeclaration(typeConvertor, it))
            file.enums.forEach(it => writer.writeStatement(writer.makeEnumEntity(it, true)))
            this.printAssignEnumsToGlobalScope(writer, file)
            this.interfaces.set(new TargetFile(this.generateFileBasename(file.originalFilename)), writer)
        }
    }
}

function getVisitor(peerLibrary: IdlPeerLibrary, context: PrinterContext): InterfacesVisitor | undefined {
    if (context.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
}

export function printInterfaces(peerLibrary: IdlPeerLibrary, context: PrinterContext): Map<TargetFile, string> {
    const visitor = getVisitor(peerLibrary, context)
    if (!visitor) {
        return new Map()
    }

    visitor.printInterfaces()
    const result = new Map<TargetFile, string>()
    for (const [key, writer] of visitor.getInterfaces()) {
        if (writer.getOutput().length === 0) continue
        result.set(key, writer.getOutput().join('\n'))
    }
    return result
}

export function createDeclarationConvertor(writer: LanguageWriter, peerLibrary: IdlPeerLibrary) {
    return writer.language === Language.TS
        ? new TSDeclConvertor(writer, peerLibrary)
        : throwException("new ArkTSDeclConvertor(writer, peerLibrary)")
}

export function printFakeDeclarations(library: IdlPeerLibrary): Map<string, string> {///copied from FakeDeclarationsPrinter
    const lang = library.language
    const result = new Map<string, string>()
    for (const [filename, {dependencies, declarations}] of makeSyntheticDeclarationsFiles()) {
        const writer = createLanguageWriter(lang)
        writer.print(cStyleCopyright)
        const imports = new ImportsCollector()
        dependencies.forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, removeExt(filename))
        const convertor = createDeclarationConvertor(writer, library)
        for (const node of declarations) {
            convertDeclaration(convertor, node)
        }
        result.set(`${filename}${lang.extension}`, writer.getOutput().join('\n'))
    }
    return result
}
