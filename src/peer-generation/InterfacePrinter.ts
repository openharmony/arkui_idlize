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

import * as ts from 'typescript'
import * as path from 'path'
import { PeerLibrary } from "./PeerLibrary"
import { LanguageWriter, createLanguageWriter } from './LanguageWriters'
import { mapType } from './TypeNodeNameConvertor'
import { Language, renameDtsToInterfaces } from '../util'
import { ImportsCollector } from './ImportsCollector'
import { EnumEntity, PeerFile } from './PeerFile'
import { DeclarationConvertor, convertDeclaration } from './TypeNodeConvertor'

class DeclarationGenerator implements DeclarationConvertor<string> {
    constructor(
        private readonly library: PeerLibrary,
    ) {}

    convertClass(node: ts.ClassDeclaration): string {
        let text = node.getText()
        for (const [stub, src] of [...this.library.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(src, stub)
        }
        return 'export ' + text
    }
    convertInterface(node: ts.InterfaceDeclaration): string {
        let text = node.getText()
        for (const [stub, src] of [...this.library.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(src, stub)
        }
        return 'export ' + text
    }
    convertEnum(node: ts.EnumDeclaration): string {
        throw "Enums are processed separatedly"
    }
    convertTypeAlias(node: ts.TypeAliasDeclaration): string {
        const maybeTypeArguments = node.typeParameters?.length
            ? `<${node.typeParameters.map(it => it.getText()).join(', ')}>`
            : ''
        let type = mapType(node.type)
        return `export declare type ${node.name.text}${maybeTypeArguments} = ${type};`
    }
}

class InterfacesVisitor {
    readonly interfaces: Map<string, LanguageWriter> = new Map()
    private readonly generator: DeclarationGenerator

    constructor(
        private readonly peerLibrary: PeerLibrary,
    ) {
        this.generator = new DeclarationGenerator(peerLibrary)
    }

    private generateFileBasename(originalFilename: string) {
        return renameDtsToInterfaces(path.basename(originalFilename), this.peerLibrary.declarationTable.language)
    }

    private printImports(writer: LanguageWriter, file: PeerFile) {
        const imports = new ImportsCollector()
        for (const importType of this.peerLibrary.importTypesStubs)
            imports.addFeatureByBasename(importType, 'ImportsStubs.ts')
        imports.addFilterByBasename(this.generateFileBasename(file.originalFilename))
        file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        for (const importType of this.peerLibrary.importTypesStubs)
            imports.addFeatureByBasename(importType, 'ImportsStubs.ts')
        imports.print(writer)
    }

    private printEnum(writer: LanguageWriter, enumEntity: EnumEntity) {
        writer.print(enumEntity.comment)
        writer.print(`export enum ${enumEntity.name} {`)
        writer.pushIndent()
        for (const member of enumEntity.members) {
            writer.print(member.comment)
            if (member.initializerText != undefined) {
                writer.print(`${member.name} = ${member.initializerText},`)
            } else {
                writer.print(`${member.name},`)
            }
        }
        writer.popIndent()
        writer.print(`}`)
    }

    private printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: PeerFile) {
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
            const writer = createLanguageWriter(Language.TS)

            this.printImports(writer, file)
            file.declarations.forEach(it => writer.print(convertDeclaration(this.generator, it)))
            file.enums.forEach(it => this.printEnum(writer, it))
            this.printAssignEnumsToGlobalScope(writer, file)
            this.interfaces.set(this.generateFileBasename(file.originalFilename), writer)
        }
    }
}

export function printInterfaces(peerLibrary: PeerLibrary): Map<string, string> {
    if (peerLibrary.declarationTable.language != Language.TS)
        return new Map()

    const visitor = new InterfacesVisitor(peerLibrary)
    visitor.printInterfaces()
    const result = new Map<string, string>()
    for (const [key, writer] of visitor.interfaces) {
        if (writer.getOutput().length === 0) continue
        result.set(key, writer.getOutput().join('\n'))
    }
    return result
}