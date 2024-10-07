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
import { FieldModifier, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, Type, createLanguageWriter } from '../LanguageWriters'
import { Language, removeExt, renameDtsToInterfaces, throwException } from '../../util'
import { ImportsCollector } from '../ImportsCollector'
import { IdlPeerFile } from './IdlPeerFile'
import { IndentedPrinter } from "../../IndentedPrinter"
import { TargetFile } from '../printers/TargetFile'
import { PrinterContext } from '../printers/PrinterContext'
import { convertDeclaration, DeclarationConvertor } from "./IdlTypeConvertor";
import { makeSyntheticDeclarationsFiles } from './IdlSyntheticDeclarations'
import { tsCopyrightAndWarning } from '../FileGenerators'
import { EnumEntity } from '../PeerFile'
import { ARK_OBJECTBASE, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, INT_VALUE_GETTER } from '../printers/lang/Java'
import { printJavaImports } from '../printers/lang/JavaPrinters'
import { collectJavaImports } from '../printers/lang/JavaIdlUtils'

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
            for (const e of peerFile.enums) {
                writer.print(`${e.name}: ${e.name},`)
            }
            writer.popIndent()
            writer.print(`})`)
        }
    }

    private toEnumEntity(enumDecl: idl.IDLEnum): EnumEntity {
        const entity = new EnumEntity(enumDecl.name, enumDecl.documentation ?? "")
        for (let elem of enumDecl.elements) {
            entity.pushMember(elem.name, elem.documentation ?? "", elem.initializer?.toString())
        }
        return entity
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(this.peerLibrary.language)
            const typeConvertor = new TSDeclConvertor(writer, this.peerLibrary)
            this.printImports(writer, file)
            file.declarations.forEach(it => convertDeclaration(typeConvertor, it))
            file.enums.forEach(it => writer.writeStatement(writer.makeEnumEntity(this.toEnumEntity(it), true)))
            this.printAssignEnumsToGlobalScope(writer, file)
            this.interfaces.set(new TargetFile(this.generateFileBasename(file.originalFilename)), writer)
        }
    }
}


class JavaDeclaration {
    public readonly targetFile: TargetFile
    constructor(alias: string, public readonly writer: LanguageWriter) {
        this.targetFile = new TargetFile(alias + writer.language.extension, ARKOALA_PACKAGE_PATH)
    }
}

class JavaDeclarationConvertor implements DeclarationConvertor<void> {
    constructor(private readonly peerLibrary: IdlPeerLibrary, private readonly onNewDeclaration: (declaration: JavaDeclaration) => void) {}
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        throw new Error("Enums are processed separately")
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.convertTypedefTarget(node.name, node.type)
    }
    private convertTypedefTarget(name: string, type: idl.IDLEntry) {
        if (idl.isUnionType(type)) {
            this.onNewDeclaration(this.makeUnion(name, type))
            return
        }
        if (idl.isEnumType(type)) {
            this.onNewDeclaration(this.makeEnum(name, type))
            return
        }
        if (idl.isInterface(type) || idl.isAnonymousInterface(type)) {
            this.onNewDeclaration(this.makeInterface(name, type))
            return
        }
        if (idl.isTupleInterface(type)) {
            this.onNewDeclaration(this.makeTuple(name, type))
            return
        }
        if (idl.isReferenceType(type)) {
            const target = this.peerLibrary.resolveTypeReference(type)
            this.convertTypedefTarget(name, target!)
            return
        }
        if (idl.isPrimitiveType(type)) {
            return
        }
        // ignore imports since they are replaced with synthetic declarations
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return
        }
        throw new Error(`Unsupported typedef: ${name}, kind=${type.kind}`)
    }
    convertInterface(node: idl.IDLInterface): void {
        const decl = node.kind == idl.IDLKind.TupleInterface
            ? this.makeTuple(node.name, node)
            : this.makeInterface(node.name, node)
        this.onNewDeclaration(decl)
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    private makeUnion(alias: string, type: idl.IDLUnionType): JavaDeclaration {
        const writer = createLanguageWriter(Language.JAVA)
        this.printPackage(writer)

        const imports = collectJavaImports(type.types)
        printJavaImports(writer, imports)

        const members = type.types.map(it => new Type(this.peerLibrary.mapType(it), false) )
        writer.writeClass(alias, () => {
            const intType = new Type('int')
            const selector = 'selector'
            writer.writeFieldDeclaration(selector, intType, [FieldModifier.PRIVATE], false)
            writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(intType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(selector)
                    )
                )
            })

            const param = 'param'
            for (const [index, memberType] of members.entries()) {
                const memberName = `value${index}`
                writer.writeFieldDeclaration(memberName, memberType, [FieldModifier.PRIVATE], false)

                writer.writeConstructorImplementation(
                    alias,
                    new NamedMethodSignature(Type.Void, [memberType], [param]),
                    () => {
                        writer.writeStatement(
                            writer.makeAssign(memberName, undefined, writer.makeString(param), false)
                        )
                        writer.writeStatement(
                            writer.makeAssign(selector, undefined, writer.makeString(index.toString()), false)
                        )
                    }
                )

                writer.writeMethodImplementation(
                    new Method(`getValue${index}`, new MethodSignature(memberType, []), [MethodModifier.PUBLIC]),
                    () => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(memberName)
                            )
                        )
                    }
                )
            }
        }, ARK_OBJECTBASE)

        return new JavaDeclaration(alias, writer)
    }

    private makeTuple(alias: string, type: idl.IDLInterface): JavaDeclaration {
        const writer = createLanguageWriter(Language.JAVA)
        this.printPackage(writer)

        const imports = collectJavaImports(type.properties.map(it => it.type))
        printJavaImports(writer, imports)

        const members = type.properties.map(it => new Type(this.peerLibrary.mapType(it.type), it.isOptional))
        const memberNames: string[] = members.map((_, index) => `value${index}`)
        writer.writeClass(alias, () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], members[i], [FieldModifier.PUBLIC], false)
            }

            const signature = new MethodSignature(Type.Void, members)
            writer.writeConstructorImplementation(alias, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], members[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        }, ARK_OBJECTBASE)

        return new JavaDeclaration(alias, writer)
    }

    private makeEnum(alias: string, type: idl.IDLEnumType): JavaDeclaration {
        const writer = createLanguageWriter(Language.JAVA)
        this.printPackage(writer)

        const enumDecl = this.peerLibrary.resolveTypeReference(type) as idl.IDLEnum
        const initializers = enumDecl.elements.map(it => {
            return {name: it.name, id: isNaN(parseInt(it.initializer as string, 10)) ? it.initializer : parseInt(it.initializer as string, 10)}
        })

        const isStringEnum = initializers.every(it => typeof it.id == 'string')
        // TODO: string enums
        if (isStringEnum) {
            throw new Error(`String enums (${alias}) not supported yet in Java`)
        }

        let memberValue = 0
        const members: {
            name: string,
            stringId: string | undefined,
            numberId: number,
        }[] = []
        for (const initializer of initializers) {
            if (typeof initializer.id == 'string') {
                members.push({name: initializer.name, stringId: initializer.id, numberId: memberValue})
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            else {
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            memberValue += 1
        }

        writer.writeClass(alias, () => {
            const enumType = new Type(alias)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`new ${alias}(${it.numberId})`)
                )
            })
    
            const value = 'value'
            const intType = new Type('int')
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)
    
            const signature = new MethodSignature(Type.Void, [intType])
            writer.writeConstructorImplementation(alias, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })
    
            const getIntValue = new Method('getIntValue', new MethodSignature(intType, []), [MethodModifier.PUBLIC])
            writer.writeMethodImplementation(getIntValue, () => {
                writer.writeStatement(
                    writer.makeReturn(writer.makeString(value))
                )
            })
        }, ARK_OBJECTBASE, [INT_VALUE_GETTER])

        return new JavaDeclaration(alias, writer)
    }

    private makeInterface(alias: string, type: idl.IDLInterface): JavaDeclaration {
        const writer = createLanguageWriter(Language.JAVA)
        this.printPackage(writer)

        const imports = collectJavaImports(type.properties.map(it => it.type))
        printJavaImports(writer, imports)

        // TODO: *Attribute classes are empty for now
        const members = this.peerLibrary.isComponentDeclaration(type) ? []
            : type.properties.map(it => {
                return {name: it.name, type: new Type(this.peerLibrary.mapType(it.type), it.isOptional), modifiers: [FieldModifier.PUBLIC]}
            })
        writer.writeClass(alias, () => {
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, it.type, it.modifiers, false)
            })
        }, idl.getSuperType(type)?.name ?? ARK_OBJECTBASE)

        return new JavaDeclaration(alias, writer)
    }
}

class JavaInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: IdlPeerLibrary) {
        super()
    }

    printInterfaces() {
        const declarationConverter = new JavaDeclarationConvertor(this.peerLibrary, (declaration: JavaDeclaration) => {
            this.interfaces.set(declaration.targetFile, declaration.writer)
        })
        for (const file of this.peerLibrary.files.values()) {
            file.declarations.forEach(it => convertDeclaration(declarationConverter, it))
        }
    }
}

function getVisitor(peerLibrary: IdlPeerLibrary, context: PrinterContext): InterfacesVisitor | undefined {
    if (context.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
    if (context.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
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
    if (writer.language === Language.TS) {
        return new TSDeclConvertor(writer, peerLibrary)
    }
    if (writer.language === Language.JAVA) {
        return new JavaDeclarationConvertor(peerLibrary, decl => writer.concat(decl.writer))
    }
    throwException("new ArkTSDeclConvertor(writer, peerLibrary)")
}

function getTargetFile(filename: string, language: Language): TargetFile {
    if (language == Language.TS) return new TargetFile(`${filename}${language.extension}`)
    if (language == Language.JAVA) return new TargetFile(`${filename}${language.extension}`, ARKOALA_PACKAGE_PATH)
    throw new Error(`FakeDeclarations: need to add support for ${language}`)
}

export function printFakeDeclarations(library: IdlPeerLibrary): Map<TargetFile, string> {///copied from FakeDeclarationsPrinter
    const lang = library.language
    const result = new Map<TargetFile, string>()
    if (![Language.TS, Language.JAVA].includes(lang)) {
        return result
    }
    for (const [filename, {dependencies, declarations}] of makeSyntheticDeclarationsFiles()) {
        const writer = createLanguageWriter(lang)
        const imports = new ImportsCollector()
        dependencies.forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, removeExt(filename))
        const convertor = createDeclarationConvertor(writer, library)
        for (const node of declarations) {
            convertDeclaration(convertor, node)
        }
        result.set(getTargetFile(filename, lang), tsCopyrightAndWarning(writer.getOutput().join('\n')))
    }
    return result
}
