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
import { TypeNodeConvertor, convertTypeNode } from '../TypeNodeConvertor'
import { IndentedPrinter } from "../../IndentedPrinter"
import { read } from "node:fs";
import { RuntimeType } from '../PeerGeneratorVisitor'
import { TargetFile } from './TargetFile'
import { ARKOALA_PACKAGE_PATH } from '../../lang/java'

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
        let type = mapType(node.type)
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
    getInterfaces(): Map<TargetFile, LanguageWriter>
    printInterfaces(): void
}

class TSInterfacesVisitor implements InterfacesVisitor {
    private readonly interfaces: Map<TargetFile, LanguageWriter> = new Map()
    private readonly generator: DeclarationGenerator

    constructor(
        private readonly peerLibrary: PeerLibrary,
    ) {
        this.generator = new DeclarationGenerator(peerLibrary)
    }

    private generateFileBasename(originalFilename: string): string {
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

    getInterfaces(): Map<TargetFile, LanguageWriter> {
        return this.interfaces
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(Language.TS)

            this.printImports(writer, file)
            file.declarations.forEach(it => writer.print(convertDeclaration(this.generator, it)))
            file.enums.forEach(it => this.printEnum(writer, it))
            this.printAssignEnumsToGlobalScope(writer, file)
            this.interfaces.set(new TargetFile(this.generateFileBasename(file.originalFilename)), writer)
        }
    }
}

export class JavaTypeNodeNameConvertor implements
    TypeNodeConvertor<string>
{
    convertUnion(node: ts.UnionTypeNode): string {
        let unionType = 'Union'
        for (const unionSubtype of node.types) {
            unionType = `${unionType}_${this.convert(unionSubtype)}`
        }
        return unionType
    }
    convertTypeLiteral(node: ts.TypeLiteralNode): string {
        const members = node.members.map(it => {
            if (ts.isPropertySignature(it)) {
                const name = this.convert(it.name)
                const isOptional = !!it.questionToken
                const type = this.convert(it.type!)
                if (isOptional) {
                    return `Opt_${type} ${name}`
                }
                return `${type} ${name}`
            }
            if (ts.isIndexSignatureDeclaration(it)) {
                if (it.modifiers) throw new Error('Not implemented')
                if (it.typeParameters) throw new Error('Not implemented')
                if (it.questionToken) throw new Error('Not implemented')
                if (it.name) throw new Error('Not implemented')
                const parameters = it.parameters.map(it => this.convertParameterDeclaration(it))
                return `[${parameters.join(', ')}]: ${this.convert(it.type)}`
            }
            throw new Error(`Unknown member type ${ts.SyntaxKind[it.kind]}`)
        })
        return `{${members.join(', ')}}`
    }
    private convertParameterDeclaration(node: ts.ParameterDeclaration): string {
        if (node.modifiers) throw new Error('Not implemented')
        if (!node.type) throw new Error('Expected ParameterDeclaration to have a type')
        const isOptional = !!node.questionToken
        const name = this.convert(node.name)
        const type = this.convert(node.type!)
        if (isOptional) {
            return `Opt_${type}$ ${name}`
        }
        return `${type} ${name}`
    }
    convertLiteralType(node: ts.LiteralTypeNode): string {
        if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return 'true'
        if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return 'false'
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) return 'null'
        if (node.literal.kind === ts.SyntaxKind.StringLiteral) return `"${node.literal.text}"`
        throw new Error(`Unknown LiteralTypeNode ${ts.SyntaxKind[node.literal.kind]}`)
    }
    convertTuple(node: ts.TupleTypeNode): string {
        const members = node.elements.map(it => this.convertTupleElement(it))
        return `Tuple_${members.join('_')}`
    }
    protected convertTupleElement(node: ts.TypeNode): string {
        if (ts.isNamedTupleMember(node)) {
            const name = this.convert(node.name)
            const maybeQuestion = node.questionToken ? '?' : ''
            const type = this.convert(node.type!)
            return `${name}${maybeQuestion}: ${type}`
        }
        return this.convert(node)
    }
    convertArray(node: ts.ArrayTypeNode): string {
        return `${this.convert(node.elementType)}[]`
    }
    convertOptional(node: ts.OptionalTypeNode): string {
        return `Opt_${this.convert(node.type)}`
    }
    convertFunction(node: ts.FunctionTypeNode): string {
        if (node.typeParameters?.length)
            throw new Error('Not implemented')
        const parameters = node.parameters.map(it => {
            const name = this.convert(it.name)
            const maybeQuestion = it.questionToken ? '?' : ''
            const type = this.convert(it.type!)
            return `${name}${maybeQuestion}: ${type}`
        })
        return `((${parameters.join(', ')}) => ${this.convert(node.type)})`
    }
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
        return node.templateSpans.map(template => {
            return `\`\${${this.convert(template.type)}}${template.literal.rawText}\``
        }).join()
    }
    convertImport(node: ts.ImportTypeNode): string {
        const from = this.convert(node.argument)
        const qualifier = this.convert(node.qualifier!)
        const maybeTypeArguments = node.typeArguments?.length
            ? '_' + node.typeArguments.map(it => this.convert(it)).join('_')
            : ''
        return `IMPORT_${qualifier}${maybeTypeArguments}_FROM_${from}`
            .match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(node: ts.TypeReferenceNode): string {
        const name = this.convert(node.typeName)
        if (name === 'Style')
            return this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword))
        let types = node.typeArguments?.map(it => this.convert(it))
        if (name === `AttributeModifier`)
            types = [`object`]
        if (name === `ContentModifier`)
            types = [this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
        if (name === `Optional`)
            return `${types} | undefined`
        const maybeTypeArguments = !types?.length ? '' : `<${types.join(', ')}>`
        return `${name}${maybeTypeArguments}`
    }
    convertParenthesized(node: ts.ParenthesizedTypeNode): string {
        return `(${this.convert(node.type)})`
    }
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): string {
        throw new Error('Method not implemented.')
    }
    convertTypeParameterDeclaration(node: ts.TypeParameterDeclaration): string {
        throw new Error('Method not implemented.')
    }
    convertStringKeyword(node: ts.TypeNode): string {
        return 'String'
    }
    convertNumberKeyword(node: ts.TypeNode): string {
        return 'Float'
    }
    convertBooleanKeyword(node: ts.TypeNode): string {
        return 'Boolean'
    }
    convertUndefinedKeyword(node: ts.TypeNode): string {
        return 'Undefined'
    }
    convertVoidKeyword(node: ts.TypeNode): string {
        return 'void'
    }
    convertObjectKeyword(node: ts.TypeNode): string {
        return 'Object'
    }
    convertAnyKeyword(node: ts.TypeNode): string {
        return 'any'
    }
    convertUnknownKeyword(node: ts.TypeNode): string {
        return `unknown`
    }

    // identifier
    convertQualifiedName(node: ts.QualifiedName): string {
        return `${this.convert(node.left)}.${this.convert(node.right)}`
    }
    convertIdentifier(node: ts.Identifier): string {
        return node.text
    }

    convert(node: ts.Node): string {
        if (ts.isQualifiedName(node)) return this.convertQualifiedName(node)
        if (ts.isIdentifier(node)) return this.convertIdentifier(node)
        if (ts.isTypeNode(node))
            return convertTypeNode(this, node)
        throw new Error(`Unknown node type ${ts.SyntaxKind[node.kind]}`)
    }
}

const nameConvertorInstance = new JavaTypeNodeNameConvertor()

// will be refactored after migration to IDL IR
function mapTypeJava(type: ts.TypeNode | undefined): string {
    type ??= ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    return nameConvertorInstance.convert(type)
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

    getMemberTargetType(node: ts.PropertyDeclaration | ts.PropertySignature): Type {
        const nullable = !!node.questionToken
        const type = mapTypeJava(node.type)
        if (nullable) {
            return new Type(`Opt_${type}`, true)
        }
        return new Type(type, false)
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
        if (targetType.nullable) {
            throw new Error('Types for optional class/interface members must be implemented using implementOptionalMemberType');
        }

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
        if (ts.isOptionalTypeNode(sourceType)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printOptionalTypeImplementation(sourceType, targetType, writer)
            this.addInterface(targetType.name, writer)
            return
        }
    }

    implementOptionalMemberType(sourceType: ts.TypeNode | undefined, targetType: Type) {
        if (!sourceType) {
            return
        }
        if (this.hasInterface(targetType.name)) {
            return
        }

        const writer = createLanguageWriter(Language.JAVA)
        this.printPackage(writer)
        this.printOptionalImplementation(sourceType, targetType, writer)
        this.addInterface(targetType.name, writer)
    }

    printOptionalTypeImplementation(sourceType: ts.OptionalTypeNode, targetType: Type, writer: LanguageWriter) {
        this.printOptionalImplementation(sourceType.type, targetType, writer)
    }

    private printOptionalImplementation(sourceType: ts.TypeNode, targetType: Type, writer: LanguageWriter) {
        writer.writeClass(targetType.name, () => {
            const tag = 'tag'
            const value = 'value'
            const rtType = new Type('RuntimeType')
            writer.writeMethodImplementation(new Method('getRuntimeType', new MethodSignature(rtType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeTernary(
                            writer.makeString(`${tag} == ${writer.makeTag('UNDEFINED')}`),
                            writer.makeString('RuntimeType.UNDEFINED'),
                            writer.makeString('RuntimeType.OBJECT')
                        )
                    )
                )
            })

            writer.writeFieldDeclaration('tag', new Type('Tag'), ['public'], false)

            const targetType = new Type(mapTypeJava(sourceType))
            this.implementType(sourceType, targetType)
            writer.writeFieldDeclaration(value, targetType, ['public'], false)
        })
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
                const subTypeTargetType = new Type(mapTypeJava(subType))
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
                const subTypeTargetType = new Type(mapTypeJava(subType))
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
                const propertyType = this.getMemberTargetType(member)
                writer.writeFieldDeclaration(propertyName, propertyType, ['public'], false)

                if (propertyType.nullable) {
                    this.implementOptionalMemberType(member.type, propertyType)
                    continue
                }
                this.implementType(member.type, propertyType)
            }
        }, superClass)
    }

    getInterfaces(): Map<TargetFile, LanguageWriter> {
        const result =  new Map<TargetFile, LanguageWriter>()
        for (const [name, writer] of this.interfaces) {
            result.set(new TargetFile(name, ARKOALA_PACKAGE_PATH), writer)
        }
        return result
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

export function printInterfaces(peerLibrary: PeerLibrary, lang: Language): Map<TargetFile, string> {
    const visitor = getVisitor(peerLibrary, lang)
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
