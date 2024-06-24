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
import { PeerLibrary } from "../PeerLibrary"
import { LanguageWriter, createLanguageWriter, Type, Method, MethodSignature, MethodModifier, NamedMethodSignature } from '../LanguageWriters'
import { mapType } from '../TypeNodeNameConvertor'
import { Language, renameDtsToInterfaces } from '../../util'
import { ImportsCollector } from '../ImportsCollector'
import { EnumEntity, PeerFile } from '../PeerFile'
import { DeclarationConvertor, convertDeclaration } from '../TypeNodeConvertor'
import { IndentedPrinter } from "../../IndentedPrinter"
import { read } from "node:fs";

export class DeclarationGenerator implements DeclarationConvertor<string> {
    constructor(
        private readonly library: PeerLibrary,
    ) {}

    convertClass(node: ts.ClassDeclaration): string {
        return this.convertDeclaration(node)
    }

    convertInterface(node: ts.InterfaceDeclaration): string {
        return this.convertDeclaration(node)
    }

    convertEnum(node: ts.EnumDeclaration): string {
        throw "Enums are processed separately"
    }

    convertTypeAlias(node: ts.TypeAliasDeclaration): string {
        const maybeTypeArguments = node.typeParameters?.length
            ? `<${node.typeParameters.map(it => it.getText()).join(', ')}>`
            : ''
        let type = mapType(node.type, Language.TS)
        return `export declare type ${node.name.text}${maybeTypeArguments} = ${type};`
    }

    private replaceImportTypeNodes(text: string): string {
        for (const [stub, src] of [...this.library.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(src, stub)
        }
        return text
    }

    private extendsClause(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        if (!node.heritageClauses?.length)
            return ``
        if (node.heritageClauses!.some(it => it.token !== ts.SyntaxKind.ExtendsKeyword))
            throw "Expected to have only extend clauses"
        if (this.library.isComponentDeclaration(node))
            // do not extend parent component interface to provide smooth integration
            return ``

        let parent = node.heritageClauses[0]!.types[0]
        return `extends ${parent.getText()}`
    }

    private declarationName(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        let name = ts.idText(node.name as ts.Identifier)
        let typeParams = node.typeParameters?.map(it => it.getText()).join(', ')
        let typeParamsClause = typeParams ? `<${typeParams}>` : ``
        return `${name}${typeParamsClause}`
    }

    private convertDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        if (!this.library.isComponentDeclaration((node))) {
            return 'export ' + this.replaceImportTypeNodes(node.getText())
        }
        let printer = new IndentedPrinter()
        let className = this.declarationName(node)
        let extendsClause = this.extendsClause(node)

        let classOrInterface = ts.isClassDeclaration(node) ? `class` : `interface`
        if (this.library.isComponentDeclaration(node))
            // because we write `ArkBlank implements BlankAttributes`
            classOrInterface = `interface`
        printer.print(`export declare ${classOrInterface} ${className} ${extendsClause} {`)
        printer.pushIndent()
        this.declarationMembers(node)
            .forEach(it => {
                printer.print(`/** @memo */`)
                printer.print(it.getText())
            })
        printer.popIndent()
        printer.print(`}`)

        return this.replaceImportTypeNodes(printer.getOutput().join('\n'))
    }

    private declarationMembers(
        node: ts.ClassDeclaration | ts.InterfaceDeclaration
    ): readonly (ts.MethodDeclaration)[] {
        if (ts.isClassDeclaration(node)) {
            const members = node.members.filter(it => !ts.isConstructorDeclaration(it))
            if (members.every(ts.isMethodDeclaration))
                return members
        }
        if (ts.isInterfaceDeclaration(node) ) {
            const members = node.members.filter(it => 
                !ts.isConstructSignatureDeclaration(it) &&
                !ts.isCallSignatureDeclaration(it))
            if (members.length === 0)
                return []
        }
        throw new Error(`Encountered component with member that is not method: ${node}`)
    }
}

interface InterfacesVisitor {
    getInterfaces(): Map<string, LanguageWriter>
    printInterfaces(): void
}

class TSInterfacesVisitor implements InterfacesVisitor {
    private readonly interfaces: Map<string, LanguageWriter> = new Map()
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
        imports.addFilterByBasename(this.generateFileBasename(file.originalFilename))
        file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
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

    getInterfaces(): Map<string, LanguageWriter> {
        return this.interfaces
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


class JavaInterfacesVisitor {
    private readonly interfaces: Map<string, LanguageWriter> = new Map()

    constructor(
        private readonly peerLibrary: PeerLibrary,
    ) {}

    addInterface(name: string, writer: LanguageWriter) {
        this.interfaces.set(name, writer)
    }

    hasInterface(name: string): boolean {
        return this.interfaces.has(name)
    }

    getName(node: ts.NamedDeclaration): string {
        if (!node.name) {
            throw new Error(`Empty name for node\n${node}`)
        }
        return node.name.getText()
    }

    getSuperClass(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
        if (!node.heritageClauses) {
            return
        }

        for (const clause of node.heritageClauses) {
            if (clause.token == ts.SyntaxKind.ExtendsKeyword) {
                return clause.types[0].expression.getText()
            }
        }
    }

    printPackage(writer: LanguageWriter): void {
        writer.print("package org.koalaui.arkoala;\n")
    }

    implementType(sourceType: ts.TypeNode | undefined, targetType: Type) {
        if (!sourceType) {
            return
        }
        if (this.hasInterface(targetType.name)) {
            return
        }

        if (ts.isUnionTypeNode(sourceType)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printUnionImplementation(sourceType, targetType, writer)
            this.addInterface(targetType.name, writer)
            return
        }
        if (ts.isTupleTypeNode(sourceType)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printTupleImplementation(sourceType, targetType, writer)
            this.addInterface(targetType.name, writer)
            return
        }
    }

    printUnionImplementation(sourceType: ts.UnionTypeNode, targetType: Type, writer: LanguageWriter) {
        writer.writeClass(targetType.name, () => {
            const intType = new Type('int')
            const selector = 'selector'
            writer.writeFieldDeclaration(selector, intType, ['private'], false)
            writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(intType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(selector)
                    )
                )
            })

            for (const [index, subType] of sourceType.types.entries()) {
                const subTypeTargetType = new Type(mapType(subType, Language.JAVA))
                this.implementType(subType, subTypeTargetType)
                const value = `value${index}`
                const param = 'param'

                writer.writeFieldDeclaration(value, subTypeTargetType, ['private'], false)

                writer.writeConstructorImplementation(
                    targetType.name,
                    new NamedMethodSignature(Type.Void, [subTypeTargetType], [param]),
                    () => {
                        writer.writeStatement(
                            writer.makeAssign(value, undefined, writer.makeString(param), false, false)
                        )
                        writer.writeStatement(
                            writer.makeAssign(selector, undefined, writer.makeString(index.toString()), false, false)
                        )
                    }
                )

                writer.writeMethodImplementation(
                    new Method(`getValue${index}`, new MethodSignature(subTypeTargetType, []), [MethodModifier.PUBLIC]),
                    () => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(value)
                            )
                        )
                    }
                )
            }
        })
    }

    printTupleImplementation(sourceType: ts.TupleTypeNode, targetType: Type, writer: LanguageWriter) {
        writer.writeClass(targetType.name, () => {
            const rtType = new Type('RuntimeType')
            writer.writeMethodImplementation(new Method('getRuntimeType', new MethodSignature(rtType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString('RuntimeType.OBJECT')
                    )
                )
            })

            for (const [index, subType] of sourceType.elements.entries()) {
                const subTypeTargetType = new Type(mapType(subType, Language.JAVA))
                this.implementType(subType, subTypeTargetType)
                const value = `value${index}`

                writer.writeFieldDeclaration(value, subTypeTargetType, ['public'], false)
            }
        })
    }
    
    printClassOrInterface(node: ts.ClassDeclaration | ts.InterfaceDeclaration, writer: LanguageWriter) {
        const superClass = this.getSuperClass(node)
        writer.writeClass(this.getName(node), () => {
            for (const member of node.members) {
                if (!ts.isPropertyDeclaration(member) && !ts.isPropertySignature(member)) {
                    continue
                }
                const propertyName = this.getName(member)
                const propertyType = new Type(mapType(member.type, Language.JAVA))
                writer.writeFieldDeclaration(propertyName, propertyType, ['public'], false)
                this.implementType(member.type, propertyType)
            }
        }, superClass)
    }

    getInterfaces(): Map<string, LanguageWriter> {
        return this.interfaces
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            file.declarations.forEach(it => {
                if (!ts.isClassDeclaration(it) && !ts.isInterfaceDeclaration(it)) {
                    return
                }
                const writer = createLanguageWriter(Language.JAVA)
                this.printPackage(writer);
                this.printClassOrInterface(it, writer)
                this.addInterface(this.getName(it), writer)
            })
        }
    }
}

function getVisitor(peerLibrary: PeerLibrary, lang: Language): InterfacesVisitor | undefined {
    if (lang == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
    if (lang == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
    }
}

export function printInterfaces(peerLibrary: PeerLibrary, lang: Language): Map<string, string> {
    const visitor = getVisitor(peerLibrary, lang)
    if (!visitor) {
        return new Map()
    }

    visitor.printInterfaces()
    const result = new Map<string, string>()
    for (const [key, writer] of visitor.getInterfaces()) {
        if (writer.getOutput().length === 0) continue
        result.set(key, writer.getOutput().join('\n'))
    }
    return result
}
