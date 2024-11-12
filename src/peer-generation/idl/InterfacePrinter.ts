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
import {
    createLanguageWriter,
    FieldModifier,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
} from '../LanguageWriters'
import {
    indentedBy,
    isDefined,
    removeExt,
    renameDtsToInterfaces,
    stringOrNone,
    throwException
} from '../../util'
import { ImportFeature, ImportsCollector } from '../ImportsCollector'
import { IdlPeerFile } from './IdlPeerFile'
import { IndentedPrinter } from "../../IndentedPrinter"
import { TargetFile } from '../printers/TargetFile'
import { PrinterContext } from '../printers/PrinterContext'
import { convertDeclaration, DeclarationConvertor } from "../LanguageWriters/nameConvertor";
import { makeSyntheticDeclarationsFiles } from './IdlSyntheticDeclarations'
import { tsCopyrightAndWarning } from '../FileGenerators'
import { EnumEntity } from '../PeerFile'
import { ARK_OBJECTBASE, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, INT_VALUE_GETTER } from '../printers/lang/Java'
import { printJavaImports } from '../printers/lang/JavaPrinters'
import { collectJavaImports } from '../printers/lang/JavaIdlUtils'
import { Language } from '../../Language'
import { escapeKeyword, IDLExtendedAttributes, IDLKind } from "../../idl";
import { ETSLanguageWriter } from '../LanguageWriters/writers/ETSLanguageWriter'
import { collectProperties } from './StructPrinter'

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
    constructor(protected readonly writer: LanguageWriter,
                readonly peerLibrary: IdlPeerLibrary) {
    }
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        throw "Enums are processed separately"
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.writer.print(`export declare type ${node.name} = ${this.writer.stringifyType(node.type)};`)
    }
    protected replaceImportTypeNodes(text: string): string {///operate on stringOrNone[]
        for (const [stub, src] of [...this.peerLibrary.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(new RegExp(`^${src}$`, 'g'), stub)
        }
        return text
    }

    protected extendsClause(node: idl.IDLInterface): string {
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
        getCommonImports(writer.language).forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, removeExt(this.generateFileBasename(file.originalFilename)))
    }

    protected printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: IdlPeerFile) {
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

    protected toEnumEntity(enumDecl: idl.IDLEnum): EnumEntity {
        const entity = new EnumEntity(enumDecl.name, enumDecl.documentation ?? "")
        for (let elem of enumDecl.elements) {
            entity.pushMember(elem.name, elem.documentation ?? "", elem.initializer?.toString())
        }
        return entity
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(this.peerLibrary.language, this.peerLibrary)
            this.printImports(writer, file)
            const typeConvertor = this.createDeclarationConvertor(writer)
            file.declarations.forEach(it => convertDeclaration(typeConvertor, it))
            file.enums.forEach(it => writer.writeStatement(writer.makeEnumEntity(this.toEnumEntity(it), true)))
            this.printAssignEnumsToGlobalScope(writer, file)
            this.interfaces.set(new TargetFile(this.generateFileBasename(file.originalFilename)), writer)
        }
    }

    protected createDeclarationConvertor(writer: LanguageWriter): DeclarationConvertor<void> {
        return new TSDeclConvertor(writer, this.peerLibrary)
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
    private convertTypedefTarget(name: string, type: idl.IDLNode) {
        if (idl.isUnionType(type)) {
            this.onNewDeclaration(this.makeUnion(name, type))
            return
        }
        if (idl.isEnum(type)) {
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
            const target = this.peerLibrary.resolveTypeReference(type, undefined)
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
        const writer = createLanguageWriter(Language.JAVA, this.peerLibrary)
        this.printPackage(writer)

        const imports = collectJavaImports(type.types)
        printJavaImports(writer, imports)

        writer.writeClass(alias, () => {
            const selector = 'selector'
            writer.writeFieldDeclaration(selector, idl.IDLI32Type, [FieldModifier.PRIVATE], false)
            writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(idl.IDLI32Type, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(selector)
                    )
                )
            })

            const param = 'param'
            for (const [index, memberType] of type.types.entries()) {
                const memberName = `value${index}`
                writer.writeFieldDeclaration(memberName, memberType, [FieldModifier.PRIVATE], false)

                writer.writeConstructorImplementation(
                    alias,
                    new NamedMethodSignature(idl.IDLVoidType, [memberType], [param]),
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
        const writer = createLanguageWriter(Language.JAVA, this.peerLibrary)
        this.printPackage(writer)

        const imports = collectJavaImports(type.properties.map(it => it.type))
        printJavaImports(writer, imports)

        const members = type.properties.map(it => idl.maybeOptional(it.type, it.isOptional))
        const memberNames: string[] = members.map((_, index) => `value${index}`)
        writer.writeClass(alias, () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], members[i], [FieldModifier.PUBLIC], false)
            }

            const signature = new MethodSignature(idl.IDLVoidType, members)
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

    private makeEnum(alias: string, enumDecl: idl.IDLEnum): JavaDeclaration {
        const writer = createLanguageWriter(Language.JAVA, this.peerLibrary)
        this.printPackage(writer)

        const initializers = enumDecl.elements.map(it => {
            return {name: it.name, id: it.initializer}
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
            const enumType = idl.toIDLType(alias)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`new ${alias}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.toIDLType('int')
            writer.writeFieldDeclaration(value, idl.IDLI32Type, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type])
            writer.writeConstructorImplementation(alias, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })

            const getIntValue = new Method('getIntValue', new MethodSignature(idl.IDLI32Type, []), [MethodModifier.PUBLIC])
            writer.writeMethodImplementation(getIntValue, () => {
                writer.writeStatement(
                    writer.makeReturn(writer.makeString(value))
                )
            })
        }, ARK_OBJECTBASE, [INT_VALUE_GETTER])

        return new JavaDeclaration(alias, writer)
    }

    private makeInterface(alias: string, type: idl.IDLInterface): JavaDeclaration {
        const writer = createLanguageWriter(Language.JAVA, this.peerLibrary)
        this.printPackage(writer)

        const imports = collectJavaImports(type.properties.map(it => it.type))
        printJavaImports(writer, imports)
        // TODO: *Attribute classes are empty for now
        const members = this.peerLibrary.isComponentDeclaration(type) ? []
            : type.properties.map(it => {
                return {name: it.name, type: idl.maybeOptional(it.type, it.isOptional), modifiers: [FieldModifier.PUBLIC]}
            })

        let superName = undefined as string | undefined
        const superType = idl.getSuperType(type)
            if (superType) {
            if (idl.isReferenceType(superType)) {
                const superDecl = this.peerLibrary.resolveTypeReference(superType)
                if (superDecl) {
                    superName = superDecl.name
                }
            } else {
                superName = idl.forceAsNamedNode(superType).name
            }
        }
        writer.writeClass(alias, () => {
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, it.type, it.modifiers, false)
            })
        }, superName ?? ARK_OBJECTBASE)

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

export class ArkTSDeclConvertor extends TSDeclConvertor {
    private typeNameConvertor = new ETSLanguageWriter(new IndentedPrinter(), this.peerLibrary)
    private seenInterfaceNames = new Set<string>()

    convertTypedef(node: idl.IDLTypedef) {
        const type = this.peerLibrary.mapType(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        // TODO: needs to be implemented correctly on the idl side
        if (node.name === "Resource") {
            this.convertInterface(idl.createInterface(node.name,
                IDLKind.Interface,
                [], [], [], [
                    idl.createProperty("bundleName", idl.createReferenceType("KStringPtr")),
                    idl.createProperty("moduleName", idl.createReferenceType("KStringPtr")),
                    idl.createProperty("params", idl.createReferenceType("Array<object>"), false, false, true),
                    idl.createProperty("id", idl.createReferenceType("number")),
                    idl.createProperty("type", idl.createReferenceType("number"), false, false, true),
                ], [], []))
        } else {
            this.writer.print(`export declare type ${node.name}${typeParams} = ${type};`)
        }
    }

    convertCallback(node: idl.IDLCallback) {
        this.writer.print('export ' +
            this.printCallback(node, node.parameters, node.returnType))
    }

    convertInterface(node: idl.IDLInterface) {
        if (this.seenInterfaceNames.has(node.name)) {
            console.log(`interface name: '${node.name}' already exists`)
            return;
        }
        this.seenInterfaceNames.add(node.name)
        let result: string
        if (this.isCallback(node)) {
            result = this.printCallback(node,
                node.callables[0].parameters,
                node.callables[0].returnType)
        } else {
            result = this.printInterface(node).join("\n")
        }
        this.writer.print('export ' + this.replaceImportTypeNodes(result))
    }

    private iDLTypedEntryPrinter<T extends idl.IDLTypedEntry>(type: T,
                                                              printer: (_: T) => stringOrNone[],
                                                              seenNames: Set<string>) {
        if (type?.name != undefined && !seenNames.has(type.name)) {
            seenNames.add(type.name!)
            return printer(type)
        }
    }

    private printInterface(idlInterface: idl.IDLInterface): stringOrNone[] {
        idlInterface.methods.map((it: idl.IDLMethod) => {
            let result = it.scope
            it.scope = undefined
            return result
        })
            .filter(isDefined)
            .map(scope => {
                idlInterface.scope ? idlInterface.scope.push(...scope) : idlInterface.scope = scope
            })

        //TODO: CommonMethod has a method onClick and a property onClick
        const seenFields = new Set<string>()
        return ([`interface ${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(idlInterface.constants
                .map(it => this.iDLTypedEntryPrinter(it, it => this.printConstant(it), seenFields)).flat())
            .concat(idlInterface.properties
                .map(it => this.iDLTypedEntryPrinter(it, it => this.printProperty(it), seenFields) ).flat())
            .concat(idlInterface.methods
                .map(it => this.iDLTypedEntryPrinter(it, it => this.printMethod(it), seenFields) ).flat())
            .concat(idlInterface.callables
                .map(it => this.iDLTypedEntryPrinter(it, it => this.printFunction(it), seenFields) ).flat())
            .concat(["}"])
    }

    private printInterfaceName(idlInterface: idl.IDLInterface): string {
        let superType = idl.getSuperType(idlInterface)
        const parentTypeArgs = this.printTypeParameters(
            (superType as idl.IDLReferenceType)?.typeArguments?.map(it => idl.printType(it)))
        return [idlInterface.name,
            this.printTypeParameters(idlInterface.typeParameters),
            superType
                ? ` extends ${idl.forceAsNamedNode(superType).name}${parentTypeArgs}`
                : ""
        ].join("")
    }

    private printConstant(constant: idl.IDLConstant): stringOrNone[] {
        return [
            ...this.printExtendedAttributes(constant),
            indentedBy(`const ${idl.nameWithType(constant)} = ${constant.value};`, 1)
        ]
    }

    private printProperty(prop: idl.IDLProperty): stringOrNone[] {
        const staticMod = prop.isStatic ? "static " : ""
        const readonlyMod = prop.isReadonly ? "readonly " : ""
        return [
            ...this.printExtendedAttributes(prop),
            indentedBy(`${staticMod}${readonlyMod}${this.printPropNameWithType(prop)};`, 1)
        ]
    }

    private printMethod(idl: idl.IDLMethod): stringOrNone[] {
        return [
            ...this.printExtendedAttributes(idl),
            indentedBy(`${idl.name}${this.printTypeParameters(idl.typeParameters)}(${this.printParameters(idl.parameters)}): ${this.convertType(idl.returnType)}`, 1)
        ]
    }
    private printFunction(idl: idl.IDLFunction): stringOrNone[] {
        if (idl.name?.startsWith("__")) {
            console.log(`Ignore ${idl.name}`)
            return []
        }
        return [
            ...this.printExtendedAttributes(idl),
            indentedBy(`${idl.name}(${this.printParameters(idl.parameters)}): ${this.convertType(idl.returnType!)};`, 1)
        ]
    }

    private printExtendedAttributes(idl: idl.IDLEntry): stringOrNone[] {
        return []
    }

    private printPropNameWithType(prop: idl.IDLProperty): string {
        return `${prop.name}${prop.isOptional ? "?" : ""}: ${this.convertType(prop.type)}`
    }

    private printParameters(parameters: idl.IDLParameter[]): string {
        return parameters
            ?.map(it => this.printNameWithTypeIDLParameter(it, it.isVariadic, it.isOptional))
            ?.join(", ") ?? ""
    }

    private printNameWithTypeIDLParameter(
        idl: idl.IDLVariable,
        isVariadic: boolean = false,
        isOptional: boolean = false): string {
        const type = idl.type ? this.convertType(idl.type) : ""
        const optional = isOptional ? "optional " : ""
        return `${escapeKeyword(idl.name!)}${optional ? "?" : ""}: ${type}`
    }

    private printTypeParameters(typeParameters: string[] | undefined): string {
        return typeParameters?.length ? `<${typeParameters.join(",")}>` : ""
    }

    private convertType(idlType: idl.IDLType): string {
        return this.typeNameConvertor.stringifyType(idlType)
    }

    private printCallback(node: idl.IDLCallback | idl.IDLInterface,
                          parameters: idl.IDLParameter[],
                          returnType: idl.IDLType | undefined): string {
        const paramsType = this.printParameters(parameters)
        const retType = this.convertType(returnType !== undefined ? returnType : idl.IDLVoidType)
        return `declare type ${node.name}${this.printTypeParameters(node.typeParameters)} = (${paramsType}) => ${retType};`
    }

    private isCallback(node: idl.IDLInterface) {
        return node.callables.length === 1
        && [node.constants,
            node.properties,
            node.methods]
            .reduce((sum, value) => value.length + sum, 0) === 0
    }
}

class ArkTSInterfacesVisitor extends TSInterfacesVisitor {
    protected printAssignEnumsToGlobalScope(writer_: LanguageWriter, peerFile_: IdlPeerFile) {
        // Not supported
    }

    protected toEnumEntity(enumDecl: idl.IDLEnum): EnumEntity {
        const namespace = idl.getExtAttribute(enumDecl, IDLExtendedAttributes.Namespace) ?? ""
        const entity = new EnumEntity(`${namespace}${enumDecl.name}`, enumDecl.documentation ?? "")
        for (let elem of enumDecl.elements) {
            entity.pushMember(elem.name, elem.documentation ?? "", elem.initializer?.toString())
        }
        return entity
    }

    protected createDeclarationConvertor(writer: LanguageWriter): DeclarationConvertor<void> {
        return new ArkTSDeclConvertor(writer, this.peerLibrary)
    }
}
class CJDeclaration {
    public readonly targetFile: TargetFile
    constructor(alias: string, public readonly writer: LanguageWriter) {
        this.targetFile = new TargetFile(alias + writer.language.extension, '')
    }
}

class CJInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: IdlPeerLibrary) {
       super()
    }

    printInterfaces() {
        const declarationConverter = new CJDeclarationConvertor(this.peerLibrary, (declaration: CJDeclaration) => {
            this.interfaces.set(declaration.targetFile, declaration.writer)
        })
        
        for (const file of this.peerLibrary.files.values()) {
            file.declarations.forEach(it => convertDeclaration(declarationConverter, it))
        }
    }
}

class CJDeclarationConvertor implements DeclarationConvertor<void> {
    constructor(private readonly peerLibrary: IdlPeerLibrary, private readonly onNewDeclaration: (declaration: CJDeclaration) => void) {}
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        throw new Error("Enums are processed separately")
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.convertTypedefTarget(node.name, node.type)
    }
    private convertTypedefTarget(name: string, type: idl.IDLNode) {
        if (idl.isUnionType(type)) {
            this.onNewDeclaration(this.makeUnion(name, type))
            return
        }
        if (idl.isEnum(type)) {
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
            const target = this.peerLibrary.resolveTypeReference(type, undefined)
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
        writer.print(`package idlize\n`)
    }

    private makeUnion(alias: string, type: idl.IDLUnionType): CJDeclaration {
        const writer = createLanguageWriter(Language.CJ, this.peerLibrary)
        this.printPackage(writer)

        writer.print('import std.collection.*\n')

        const members = type.types.map(it => it)
        writer.writeClass(alias, () => {
            const intType = idl.IDLI32Type
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
                writer.writeFieldDeclaration(memberName, memberType, [FieldModifier.PRIVATE], true, writer.makeString(`None<${writer.stringifyType(memberType)}>`))

                writer.writeConstructorImplementation(
                    'init',
                    new NamedMethodSignature(idl.IDLVoidType, [memberType], [param]),
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
                        writer.print(`if (let Some(${memberName}) <- ${memberName}) {`)
                        writer.pushIndent()
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(memberName)
                            )
                        )
                        writer.print(`} else { throw Exception("Wrong selector value inside Union ${alias}") }`)
                        writer.popIndent()
                    }
                )
            }
        }, ARK_OBJECTBASE)

        return new CJDeclaration(alias, writer)
    }

    private makeTuple(alias: string, type: idl.IDLInterface): CJDeclaration {
        const writer = createLanguageWriter(Language.CJ, this.peerLibrary)
        this.printPackage(writer)

        const members = type.properties.map(it => idl.maybeOptional(it.type, it.isOptional))
        const memberNames: string[] = members.map((_, index) => `value${index}`)
        writer.writeClass(alias, () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], members[i], [FieldModifier.PUBLIC], idl.isOptionalType(members[i]) ?? false)
            }

            const signature = new MethodSignature(idl.IDLVoidType, members)
            writer.writeConstructorImplementation(alias, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], members[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        }, ARK_OBJECTBASE)

        return new CJDeclaration(alias, writer)
    }

    private makeEnum(alias: string, enumDecl: idl.IDLEnum): CJDeclaration {
      const writer = createLanguageWriter(Language.CJ, this.peerLibrary)
        this.printPackage(writer)

        writer.print('import std.collection.*\n')

        const initializers = enumDecl.elements.map(it => {
            return {name: it.name, id: it.initializer}
        })

        const isStringEnum = initializers.every(it => typeof it.id == 'string')

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
            const enumType = idl.createReferenceType(alias)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`${alias}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.IDLI32Type
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(idl.IDLVoidType, [intType])
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

        return new CJDeclaration(alias, writer)
    }

    private makeInterface(alias: string, type: idl.IDLInterface): CJDeclaration {
        const writer = createLanguageWriter(Language.CJ, this.peerLibrary)
        this.printPackage(writer)

        writer.print('import std.collection.*\n')

        const members = this.peerLibrary.isComponentDeclaration(type) ? []
            : type.properties.map(it => {
                return {name: writer.escapeKeyword(it.name), type: idl.maybeOptional(it.type, it.isOptional), modifiers: [FieldModifier.PUBLIC]}
            })
        let constructorMembers: idl.IDLProperty[] = collectProperties(type, this.peerLibrary)

        let superName = undefined as string | undefined
        const superType = idl.getSuperType(type)
            if (superType) {
            if (idl.isReferenceType(superType)) {
                const superDecl = this.peerLibrary.resolveTypeReference(superType)
                if (superDecl) {
                    superName = superDecl.name
                }
            } else {
                superName = idl.forceAsNamedNode(superType).name
            }
        }

        writer.writeClass(alias, () => {
            members.forEach(it => {
                writer.writeProperty(it.name, it.type, true)
            })
            writer.writeConstructorImplementation(alias,
                new NamedMethodSignature(idl.IDLVoidType, 
                    constructorMembers.map(it =>
                        idl.maybeOptional(it.type, it.isOptional) 
                    ),
                    constructorMembers.map(it =>
                        writer.escapeKeyword(it.name)
                    )), () => {
                        const superType = idl.getSuperType(type)
                        const superDecl = superType ? this.peerLibrary.resolveTypeReference(superType as idl.IDLReferenceType) : undefined
                        let superProperties = superDecl ? collectProperties(superDecl as idl.IDLInterface, this.peerLibrary) : []
                        writer.print(`super(${superProperties.map(it => writer.escapeKeyword(it.name)).join(', ')})`)

                        for(let i of members) {
                            writer.print(`this.${i.name}_container = ${i.name}`)
                        }
                    })
        }, superName ?? ARK_OBJECTBASE)

        return new CJDeclaration(alias, writer)
    }
}


function getVisitor(peerLibrary: IdlPeerLibrary, context: PrinterContext): InterfacesVisitor | undefined {
    if (context.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
    if (context.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
    }
    if (context.language == Language.ARKTS) {
        return new ArkTSInterfacesVisitor(peerLibrary)
    }
    if (context.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    throwException(`Need to implement InterfacesVisitor for ${context.language} language`)
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
    if (writer.language === Language.ARKTS) {
        return new ArkTSDeclConvertor(writer, peerLibrary)
    }
    if (writer.language === Language.CJ) {
        return new CJDeclarationConvertor(peerLibrary, decl => writer.concat(decl.writer))
    }
    throwException(`Need to implement DeclarationConvertor for ${writer.language} language`)
}

function getTargetFile(filename: string, language: Language): TargetFile {
    const packagePath = language === Language.JAVA ? ARKOALA_PACKAGE_PATH : undefined
    return new TargetFile(`${filename}${language.extension}`, packagePath)
}

export function getCommonImports(language: Language) {
    const imports: ImportFeature[] = []
    if (language === Language.ARKTS || language === Language.TS) {
        imports.push({feature: "int32", module: "@koalaui/common"})
        imports.push({feature: "float32", module: "@koalaui/common"})
        imports.push({feature: "KInt", module: "@koalaui/interop"})
        imports.push({feature: "KBoolean", module: "@koalaui/interop"})
        imports.push({feature: "KStringPtr", module: "@koalaui/interop"})
        imports.push({feature: "wrapCallback", module: "@koalaui/interop"})
        imports.push({feature: "NodeAttach", module: "@koalaui/runtime"})
        imports.push({feature: "remember", module: "@koalaui/runtime"})
    }
    return imports
}

export function printFakeDeclarations(library: IdlPeerLibrary): Map<TargetFile, string> {///copied from FakeDeclarationsPrinter
    const lang = library.language
    const result = new Map<TargetFile, string>()
    for (const [filename, {dependencies, declarations}] of makeSyntheticDeclarationsFiles()) {
        const writer = createLanguageWriter(lang, library)
        const imports = new ImportsCollector()
        getCommonImports(writer.language).concat(dependencies)
            .forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, removeExt(filename))
        const convertor = createDeclarationConvertor(writer, library)
        for (const node of declarations) {
            convertDeclaration(convertor, node)
        }
        result.set(getTargetFile(filename, lang), tsCopyrightAndWarning(writer.getOutput().join('\n')))
    }
    return result
}
