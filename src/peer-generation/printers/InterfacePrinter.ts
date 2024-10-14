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
import { FieldModifier, LanguageWriter, createLanguageWriter, Type, MethodModifier, MethodSignature } from '../LanguageWriters'
import { ArkTSTypeNodeNameConvertor, isCallable, mapType } from '../TypeNodeNameConvertor'
import { identName, removeExt, renameDtsToInterfaces } from '../../util'
import { ImportFeature, ImportsCollector } from '../ImportsCollector'
import { PeerFile } from '../PeerFile'
import { IndentedPrinter } from "../../IndentedPrinter"
import { TargetFile } from './TargetFile'
import { PrinterContext } from './PrinterContext'
import { ARK_OBJECTBASE, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from './lang/Java'
import { convertDeclaration, DeclarationConvertor } from "../TypeNodeConvertor";
import { createTypeNodeConvertor, generateMethodModifiers, generateSignature } from "../PeerGeneratorVisitor";
import { isMaterialized } from "../Materialized";
import { ResourceDeclaration } from '../DeclarationTable'
import { JavaDataClass } from './lang/JavaPrinters'
import { Language } from '../../Language'

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
    constructor(private readonly writer: LanguageWriter, readonly peerLibrary: PeerLibrary) {

    }
    convertEnum(node: ts.EnumDeclaration): string {
        throw "Enums are processed separately"
    }
    convertClass(node: ts.ClassDeclaration): void {
        this.writer.print(this.convertDeclaration(node))
    }
    convertInterface(node: ts.InterfaceDeclaration): void {
        this.writer.print(this.convertDeclaration(node))
    }
    convertTypeAlias(node: ts.TypeAliasDeclaration): void {
        const maybeTypeArguments = node.typeParameters?.length
            ? `<${node.typeParameters.map(it => it.getText()).join(', ')}>`
            : ''
        let type = mapType(node.type)
        this.writer.print(`export declare type ${node.name.text}${maybeTypeArguments} = ${type};`)
    }
    private replaceImportTypeNodes(text: string): string {
        for (const [stub, src] of [...this.peerLibrary.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(src, stub)
        }
        return text
    }

    private extendsClause(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        if (!node.heritageClauses?.length)
            return ``
        if (node.heritageClauses!.some(it => it.token !== ts.SyntaxKind.ExtendsKeyword))
            throw "Expected to have only extend clauses"
        if (this.peerLibrary.isComponentDeclaration(node))
            // do not extend parent component interface to provide smooth integration
            return ``

        let parent = node.heritageClauses[0]!.types[0]
        return `extends ${parent.getText()}`
    }

    protected declarationName(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        let name = ts.idText(node.name as ts.Identifier)
        let typeParams = node.typeParameters?.map(it => it.getText()).join(', ')
        let typeParamsClause = typeParams ? `<${typeParams}>` : ``
        return `${name}${typeParamsClause}`
    }

    private convertDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        if (!this.peerLibrary.isComponentDeclaration((node))) {
            return 'export ' + this.replaceImportTypeNodes(node.getText())
        }
        let printer = new IndentedPrinter()
        let className = this.declarationName(node)
        let extendsClause = this.extendsClause(node)

        let classOrInterface = ts.isClassDeclaration(node) ? `class` : `interface`
        if (this.peerLibrary.isComponentDeclaration(node))
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

class TSInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: PeerLibrary) {
        super()
    }

    protected generateFileBasename(originalFilename: string): string {
        return renameDtsToInterfaces(path.basename(originalFilename), this.peerLibrary.declarationTable.language)
    }

    private printImports(writer: LanguageWriter, file: PeerFile) {
        const imports = new ImportsCollector()
        file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        imports.addFeature("KInt", "@koalaui/interop")
        imports.print(writer, removeExt(this.generateFileBasename(file.originalFilename)))
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
            const writer = createLanguageWriter(this.peerLibrary.declarationTable.language)
            const typeConvertor = new TSDeclConvertor(writer, this.peerLibrary)
            this.printImports(writer, file)
            file.declarations.forEach(it => convertDeclaration(typeConvertor, it))
            file.enums.forEach(it => writer.writeStatement(writer.makeEnumEntity(it, true)))
            this.printAssignEnumsToGlobalScope(writer, file)
            this.interfaces.set(new TargetFile(this.generateFileBasename(file.originalFilename)), writer)
        }
    }
}

class JavaInterfacesVisitor {
    private readonly interfaces: Map<string, LanguageWriter> = new Map()

    constructor(
        private readonly peerLibrary: PeerLibrary,
        private readonly context: PrinterContext,
    ) {}

    private addInterface(name: string, writer: LanguageWriter) {
        this.interfaces.set(name, writer)
    }

    private getName(node: ts.NamedDeclaration): string {
        if (!node.name) {
            throw new Error(`Empty name for node\n${node}`)
        }
        return identName(node.name)!
    }

    private getSuperClass(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
        if (!node.heritageClauses) {
            return
        }

        for (const clause of node.heritageClauses) {
            if (clause.token == ts.SyntaxKind.ExtendsKeyword) {
                return clause.types[0].expression.getText()
            }
        }
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    private printClassOrInterface(node: ts.ClassDeclaration | ts.InterfaceDeclaration, writer: LanguageWriter) {
        type MemberInfo = {name: string, type: Type, modifiers: FieldModifier[]}
        const members: MemberInfo[] = node.members.map(property => {
            if (!ts.isPropertyDeclaration(property) && !ts.isPropertySignature(property)) return
            if (!property.type) throw new Error(`Unexpected member type: ${property.type}`)

            const propertyDeclarationTarget = this.peerLibrary.declarationTable.toTarget(property.type)
            const propertyType = this.context.synthesizedTypes!.getTargetType(propertyDeclarationTarget, false)
            return {name: this.getName(property), type: new Type(propertyType.name, !!property.questionToken), modifiers: [FieldModifier.PUBLIC]}
        }).filter((it): it is MemberInfo => !!it)
        const imports: ImportFeature[] = this.context.imports?.getImportsForTypes(members.map(it => it.type)).map(it => { return {feature: it, module: ''} }) ?? []
        const javaDataClass = new JavaDataClass(node, this.getName(node), this.getSuperClass(node), members, imports)
        javaDataClass.print(writer)
    }

    getInterfaces(): Map<TargetFile, LanguageWriter> {
        const result =  new Map<TargetFile, LanguageWriter>()
        for (const [name, writer] of this.interfaces) {
            result.set(new TargetFile(name, ARKOALA_PACKAGE_PATH), writer)
        }
        return result
    }

    private addInterfaceDeclaration(it: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const writer = createLanguageWriter(Language.JAVA)
        this.printPackage(writer);
        this.printClassOrInterface(it, writer)
        this.addInterface(this.getName(it), writer)
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            file.declarations.forEach(it => {
                if (!ts.isClassDeclaration(it) && !ts.isInterfaceDeclaration(it)) {
                    return
                }
                this.addInterfaceDeclaration(it)
            })
        }
        this.addInterfaceDeclaration(ResourceDeclaration)
    }
}

class CJInterfacesVisitor {
    private readonly interfaces: Map<string, LanguageWriter> = new Map()

    constructor(
        private readonly peerLibrary: PeerLibrary,
        private readonly context: PrinterContext,
    ) {}

    private addInterface(name: string, writer: LanguageWriter) {
        this.interfaces.set(name, writer)
    }

    private getName(node: ts.NamedDeclaration): string {
        if (!node.name) {
            throw new Error(`Empty name for node\n${node}`)
        }
        return identName(node.name)!
    }

    private getSuperClass(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
        if (!node.heritageClauses) {
            return
        }

        for (const clause of node.heritageClauses) {
            if (clause.token == ts.SyntaxKind.ExtendsKeyword) {
                return clause.types[0].expression.getText()
            }
        }
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print('package idlize\n')
    }

    private printLangImports(writer: LanguageWriter): void {
        writer.print('import std.collection.*\n')
    }

    private readonly initialValue = new Map([
        ['String', "\"\""],
        ['Int32', "0"],
        ['Int64', "0"],
        ['Float32', "0.0"],
        ['Float64', "0.0"],
        ['Bool', "false"],
        ['ArrayList<String>', "ArrayList()"]
    ])

    private printClassOrInterface(node: ts.ClassDeclaration | ts.InterfaceDeclaration, writer: LanguageWriter) {
        type MemberInfo = {name: string, type: Type, optional: boolean}
        const membersInfo: MemberInfo[] = node.members.map(property => {
            if (!ts.isPropertyDeclaration(property) && !ts.isPropertySignature(property)) {
                return
            }
            if (!property.type) {
                throw new Error(`Unexpected member type: ${property.type}`);
            }

            const propertyName = this.getName(property)
            const propertyDeclarationTarget = this.peerLibrary.declarationTable.toTarget(property.type)
            const optional = !!property.questionToken
            const propertyType = this.context.synthesizedTypes!.getTargetType(propertyDeclarationTarget, optional)
            return {
                name: propertyName,
                type: propertyType,
                optional: optional
            }
        }).filter((it): it is MemberInfo => !!it)

        this.context.imports?.printImportsForTypes(membersInfo.map(it => it.type), writer)

        const superClass = this.getSuperClass(node) ?? ARK_OBJECTBASE
        writer.writeClass(this.getName(node), () => {
            for (const member of membersInfo) {
                writer.writeFieldDeclaration(member.name, member.type, [FieldModifier.PUBLIC], member.optional, this.initialValue.get(member.type.name) ? writer.makeString(this.initialValue.get(member.type.name)!): undefined)
            }
            writer.writeConstructorImplementation(this.getName(node), new MethodSignature(Type.Void, membersInfo.map(property => property.type)), (printer) => {
                for (let i in membersInfo) {
                    printer.writeStatement(printer.makeAssign(`this.${membersInfo[i].name}`, undefined, writer.makeString(`arg${i}`), false))
                }
            })
        }, superClass)
    }

    getInterfaces(): Map<TargetFile, LanguageWriter> {
        const result =  new Map<TargetFile, LanguageWriter>()
        for (const [name, writer] of this.interfaces) {
            result.set(new TargetFile(name, ''), writer)
        }
        return result
    }

    private addInterfaceDeclaration(it: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const writer = createLanguageWriter(Language.CJ)
        this.printPackage(writer);
        this.printLangImports(writer)
        this.printClassOrInterface(it, writer)
        this.addInterface(this.getName(it), writer)
    }

    CJResourceDeclaration = ts.factory.createInterfaceDeclaration(undefined, "Resource", undefined, undefined, [
        ts.factory.createPropertySignature(undefined, "id", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
        ts.factory.createPropertySignature(undefined, "type_", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
        ts.factory.createPropertySignature(undefined, "moduleName", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
        ts.factory.createPropertySignature(undefined, "bundleName", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
        ts.factory.createPropertySignature(undefined, "params", ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))),
    ])

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            file.declarations.forEach(it => {
                if (!ts.isClassDeclaration(it) && !ts.isInterfaceDeclaration(it)) {
                    return
                }
                this.addInterfaceDeclaration(it)
            })
        }
        this.addInterfaceDeclaration(this.CJResourceDeclaration)
    }
}

export class ArkTSDeclConvertor implements DeclarationConvertor<void> {
    private readonly declToStringConvertor = new ArkTSTypeNodeNameConvertor(this.peerLibrary)
    constructor(private readonly writer: LanguageWriter,
                private readonly peerLibrary: PeerLibrary) {
    }

    convertEnum(node: ts.EnumDeclaration): void {
        throw `Wrong enum type conversion: ${node.name.text}`
    }

    convertClass(node: ts.ClassDeclaration): void {
        const seenMethods = new Set<string>()
        const writer = (writer: LanguageWriter) => {
            this.declarationMembers(node)
                .forEach(member => {
                    if (ts.isPropertyDeclaration(member)) {
                        const propName = member.name.getText()
                        const propType = this.declToStringConvertor.convert(member.type!)
                        const isOptional = member.questionToken
                        writer.print(`${propName}${isOptional ? "?" : ""}: ${propType};`)
                    } else {
                        const methodName = member.name.getText()
                        if (seenMethods.has(methodName)) {
                            console.log(`Method '${methodName}' already declared in ${node.name?.text}`)
                            return
                        }
                        seenMethods.add(methodName)
                        const returnType = this.declToStringConvertor.convert(member.type!)
                        const parameters = member.parameters.map((param) => {
                            if (param.type != undefined) {
                                return `${param.name.getText()}: ${this.declToStringConvertor.convert(param.type)}`
                            }
                            return param.getText()
                        }).join(',')
                        writer.print(`${methodName}(${parameters}): ${returnType};`)
                    }
            })
        };
        if (this.peerLibrary.isComponentDeclaration(node)) {
            // because we write `ArkBlank implements BlankAttributes`
            this.writer.writeInterface(this.declarationName(node), writer, this.extendsClause(node), false)
        } else {
            this.writer.writeClass(this.declarationName(node), writer, undefined, this.extendsClause(node), undefined, true)
        }
    }

    private extendsClause(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string[] | undefined {
        if (!node.heritageClauses?.length) {
            return undefined
        }
        if (this.peerLibrary.isComponentDeclaration(node)) {
            // do not extend parent component interface to provide smooth integration
            return undefined
        }
        const parent = node.heritageClauses[0]?.types[0]
        if (node.heritageClauses!.some(it => it.token === ts.SyntaxKind.ImplementsKeyword)) {
            return [parent.getText()]
        }
        return [parent.getText()]
    }

    private declarationMembers(node: ts.ClassDeclaration): ts.MethodDeclaration[] | ts.PropertyDeclaration[] {
        const members = node.members.filter(it => !ts.isConstructorDeclaration(it))
        if (members.every(ts.isMethodDeclaration))
            return members
        if (members.every(ts.isPropertyDeclaration)) {
            return members
        }
        return []
    }

    convertInterface(node: ts.InterfaceDeclaration): void {
        if (isCallable(node)) {
            const callSignature = node.members[0] as ts.CallSignatureDeclaration
            const parameters = callSignature.parameters
            const returnTypeNode = callSignature.type!
            this.convertTypeAlias(ts.factory.createTypeAliasDeclaration(
                undefined,
                node.name.text,
                node.typeParameters,
                ts.factory.createFunctionTypeNode(undefined,
                    parameters,
                    returnTypeNode
                )
            ))
        } else {
            this.writer.writeInterface(this.declarationName(node), writer => {
                const fields = this.peerLibrary.declarationTable.targetStruct(node).getFields()
                if (fields.length > 0) {
                    fields.map(it => {
                        writer.writeFieldDeclaration(it.name, new Type(this.mapType(it.type), it.optional), undefined, it.optional)
                    })
                } else if (isMaterialized(node)) {
                    node.members.forEach(method => {
                        if (ts.isMethodSignature(method)) {
                            writer.writeMethodDeclaration(generateMethodName(method),
                                generateSignature(method, createTypeNodeConvertor(this.peerLibrary), false),
                                generateMethodModifiers(method))
                        }
                    })
                }
            })
        }
    }

    convertTypeAlias(node: ts.TypeAliasDeclaration): void {
        if (ts.isTypeLiteralNode(node.type)) {
            const members = node.type.members
            this.writer.writeInterface(node.name.text, writer => {
                members.map(it => {
                    if (ts.isPropertySignature(it)) {
                        writer.writeFieldDeclaration(it.name?.getText(),
                            new Type(this.mapType(it.type), it?.questionToken != undefined), undefined, it?.questionToken != undefined)
                    }
                })
            })
        } else {
            const typeName = this.mapType(node.name)
            const maybeTypeArguments = node.typeParameters?.length && typeName !== "ComponentContent"
                ? `<${node.typeParameters.map(it => it.name.text).join(', ')}>` : ''
            this.writer.print(`export declare type ${typeName}${maybeTypeArguments} = ${this.mapType(node.type)}`)
        }
    }

    private declarationName(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        let name = ts.idText(node.name as ts.Identifier)
        let typeParams = node.typeParameters?.map(it => {
            const defaultValue = it.default !== undefined ? this.mapType(it.default) : undefined
            return `${it.name.text}${defaultValue != undefined ? `=${defaultValue}` : ``}`
        }).join(', ')
        let typeParamsClause = typeParams ? `<${typeParams}>` : ``
        return `${name}${typeParamsClause}`
    }

    private mapType(type: ts.TypeNode | ts.Identifier | undefined): string {
        if (type !== undefined) {
            return this.declToStringConvertor.convert(type)
        }
        throw new Error(`Unexpected type: ${type}`)
    }
}

class ArkTSInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(private readonly peerLibrary: PeerLibrary) {
        super()
    }

    private generateFileBasename(originalFilename: string): string {
        return renameDtsToInterfaces(path.basename(originalFilename), this.peerLibrary.declarationTable.language)
    }

    private printImports(writer: LanguageWriter, file: PeerFile) {
        const imports = new ImportsCollector()
        file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        imports.addFeature("KInt", "@koalaui/interop")
        imports.print(writer, removeExt(this.generateFileBasename(file.originalFilename)))
    }

    override printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(this.peerLibrary.declarationTable.language)
            this.printImports(writer, file)
            file.enums.forEach(it => writer.writeStatement(writer.makeEnumEntity(it, true)))
            file.declarations.forEach(it => convertDeclaration(createDeclarationConvertor(writer, this.peerLibrary), it))
            this.interfaces.set(new TargetFile(this.generateFileBasename(file.originalFilename)), writer)
        }
    }
}

function getVisitor(peerLibrary: PeerLibrary, context: PrinterContext): InterfacesVisitor | undefined {
    if (context.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
    if (context.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary, context)
    }
    if (context.language == Language.ARKTS) {
        return new ArkTSInterfacesVisitor(peerLibrary)
    }
    if (context.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary, context)
    }
}

export function printInterfaces(peerLibrary: PeerLibrary, context: PrinterContext): Map<TargetFile, string> {
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

export function createDeclarationConvertor(writer: LanguageWriter, peerLibrary: PeerLibrary) {
    return writer.language == Language.TS
        ? new TSDeclConvertor(writer, peerLibrary)
        : new ArkTSDeclConvertor(writer, peerLibrary)
}

function generateMethodName(method: ts.MethodSignature): string {
    const typeParams = method.typeParameters?.map(it => it.name.text).join(', ')
    return `${method.name.getText()}${typeParams ? `<${typeParams}>` : ``}`
}