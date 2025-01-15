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

import * as idl from '@idlize/core/idl'
import * as path from 'path'
import { PeerLibrary } from "../PeerLibrary"
import {
    createLanguageWriter,
    createTypeNameConvertor,
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
    throwException,
    IndentedPrinter,
    Language,
    CustomPrintVisitor
} from '@idlize/core'
import { ImportFeature, ImportsCollector } from '../ImportsCollector'
import { PeerFile } from '../PeerFile'
import { TargetFile } from './TargetFile'
import { PrinterContext } from './PrinterContext'
import { convertDeclaration, DeclarationConvertor } from "../LanguageWriters/nameConvertor";
import { ARK_CUSTOM_OBJECT, ARK_OBJECTBASE, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, INT_VALUE_GETTER } from './lang/Java'
import { printJavaImports } from './lang/JavaPrinters'
import { collectJavaImports } from './lang/JavaIdlUtils'
import { ETSLanguageWriter } from '../LanguageWriters/writers/ETSLanguageWriter'
import { collectProperties } from './StructPrinter'
import { escapeKeyword, IDLType } from '@idlize/core/idl'
import { PeerGeneratorConfig } from '../PeerGeneratorConfig'
import { isBuilderClass, isMaterialized, isPredefined } from '../idl/IdlPeerGeneratorVisitor'
import { DependenciesCollector } from '../idl/IdlDependenciesCollector'
import { createInterfaceDeclName } from '../TypeNodeNameConvertor'
import { collectDeclDependencies, convertDeclToFeature } from '../ImportsCollectorUtils'
import { maybeTransformManagedCallback } from '../ArgConvertors'
import { isComponentDeclaration } from '../ComponentsCollector'

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
    private printer: CustomPrintVisitor
    constructor(protected readonly writer: LanguageWriter,
                readonly peerLibrary: PeerLibrary) {
    this.printer = new CustomPrintVisitor(type => peerLibrary.resolveTypeReference(type), writer.language)
    }
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        this.writer.writeStatement(this.writer.makeEnumEntity(node, true))
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.writer.print(`export declare type ${node.name} = ${this.writer.getNodeName(node.type)};`)
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
        if (!isComponentDeclaration(this.peerLibrary, (node))) {
            this.printer.output = []
            this.printer.printInterface(node)
            this.writer.print('export ' + this.printer.output.join("\n"))
            return
        }
        let printer = new IndentedPrinter()
        let extendsClause = this.extendsClause(node)

        let classOrInterface = node.subkind === idl.IDLInterfaceSubkind.Class ? `class` : `interface`
        if (isComponentDeclaration(this.peerLibrary, node))
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

        this.writer.print(printer.getOutput().join('\n'))
    }
}

class TSInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: PeerLibrary) {
        super()
    }

    protected generateFileBasename(originalFilename: string): string {
        return renameDtsToInterfaces(path.basename(originalFilename), this.peerLibrary.language)
    }

    private printImports(writer: LanguageWriter, file: PeerFile) {
        const imports = new ImportsCollector()
        // file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        getCommonImports(writer.language).forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, removeExt(this.generateFileBasename(file.originalFilename)))
    }

    protected printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: PeerFile) {
        const enums = peerFile.entries.filter(idl.isEnum)
        if (enums.length != 0) {
            writer.print(`Object.assign(globalThis, {`)
            writer.pushIndent()
            for (const e of enums) {
                const usageTypeName = this.peerLibrary.mapType(idl.createReferenceType(e.name))
                writer.print(`${e.name}: ${usageTypeName},`)
            }
            writer.popIndent()
            writer.print(`})`)
        }
    }

    printInterfaces() {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(this.peerLibrary.language, this.peerLibrary)
            this.printImports(writer, file)
            const typeConvertor = new TSDeclConvertor(writer, this.peerLibrary)
            for (const entry of file.entries) {
                if (idl.isModuleType(entry) || idl.isPackage(entry))
                    continue
                if (PeerGeneratorConfig.ignoreEntry(entry.name, writer.language))
                    continue
                convertDeclaration(typeConvertor, entry)
            }
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

class JavaSyntheticGenerator extends DependenciesCollector {
    private readonly nameConvertor = createLanguageWriter(Language.JAVA, this.library)

    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        const typeName = this.nameConvertor.getNodeName(type)
        this.onSyntheticDeclaration(idl.createTypedef(typeName, type))
        return super.convertUnion(type)
    }

    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const generatedName = this.nameConvertor.getNodeName(type)
        const clazz = idl.createInterface(
            generatedName,
            idl.IDLInterfaceSubkind.Interface,
            [idl.createReferenceType(ARK_CUSTOM_OBJECT)]
        )
        this.onSyntheticDeclaration(clazz)
        return super.convertImport(type, importClause)
    }

    convertTypedef(decl: idl.IDLTypedef): idl.IDLNode[] {
        if (PeerGeneratorConfig.ignoreEntry(decl.name, Language.JAVA))
            return []
        return super.convertTypedef(decl)
    }
}

class JavaDeclarationConvertor implements DeclarationConvertor<void> {
    private readonly nameConvertor = createTypeNameConvertor(Language.JAVA, this.peerLibrary)
    constructor(private readonly peerLibrary: PeerLibrary, private readonly onNewDeclaration: (declaration: JavaDeclaration) => void) {}
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        this.onNewDeclaration(this.makeEnum(node.name, node))
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
        if (idl.isInterface(type)) {
            switch (type.subkind) {
                case idl.IDLInterfaceSubkind.Interface:
                case idl.IDLInterfaceSubkind.AnonymousInterface:
                    this.onNewDeclaration(this.makeInterface(name, type))
                    return
                case idl.IDLInterfaceSubkind.Tuple:
                    this.onNewDeclaration(this.makeTuple(name, type))
                    return
            }
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
        const name = this.nameConvertor.convert(node)
        const decl = node.subkind === idl.IDLInterfaceSubkind.Tuple
            ? this.makeTuple(name, node)
            : this.makeInterface(name, node)
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
            const enumType = idl.createReferenceType(alias)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`new ${alias}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.createReferenceType('int')
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
        const members = isComponentDeclaration(this.peerLibrary, type) ? []
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
    constructor(protected readonly peerLibrary: PeerLibrary) {
        super()
    }

    printInterfaces() {
        const declarationConverter = new JavaDeclarationConvertor(this.peerLibrary, (declaration: JavaDeclaration) => {
            this.interfaces.set(declaration.targetFile, declaration.writer)
        })
        const syntheticsGenerator = new JavaSyntheticGenerator(this.peerLibrary, (entry) => {
            convertDeclaration(declarationConverter, entry)
        })
        for (const file of this.peerLibrary.files.values()) {
            for (const entry of file.entries) {
                if (idl.isPackage(entry) || idl.isModuleType(entry))
                    continue
                if (isPredefined(entry))
                    continue;
                syntheticsGenerator.convert(entry)
                if (PeerGeneratorConfig.ignoreEntry(entry.name, Language.JAVA))
                    continue
                if (idl.isInterface(entry) && (
                    isBuilderClass(entry) ||
                    isMaterialized(entry, this.peerLibrary)))
                    continue
                convertDeclaration(declarationConverter, entry)
            }
            // file.declarations.forEach(it => convertDeclaration(declarationConverter, it))
        }
    }
}

export class ArkTSDeclConvertor extends TSDeclConvertor {
    private typeNameConvertor = new ETSLanguageWriter(new IndentedPrinter(), this.peerLibrary)
    private seenInterfaceNames = new Set<string>()

    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        const type = this.typeNameConvertor.getNodeName(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        this.writer.print(`export type ${node.name}${typeParams} = ${type};`)
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
        } else if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            result = this.printTuple(node).join("\n")
        } else {
            result = this.printInterface(node).join("\n")
        }
        this.writer.print('export ' + result)
    }

    private printIfNotSeen<T extends idl.IDLNamedNode>(
        type: T,
        print: (_: T) => stringOrNone[],
        seenNames: Set<string>
    ): stringOrNone[] | undefined {
        if (!seenNames.has(type.name)) {
            seenNames.add(type.name)
            return print(type)
        }
        return undefined
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
                .map(it => this.printIfNotSeen(it, it => this.printConstant(it), seenFields)).flat())
            .concat(idlInterface.properties
                .map(it => this.printIfNotSeen(it, it => this.printProperty(it, isMaterialized(idlInterface, this.peerLibrary)), seenFields) ).flat())
            .concat(idlInterface.methods
                .map(it => this.printIfNotSeen(it, it => this.printMethod(it), seenFields) ).flat())
            .concat(idlInterface.callables
                .map(it => this.printIfNotSeen(it, it => this.printFunction(it), seenFields) ).flat())
            .concat(["}"])
    }

    private printInterfaceName(idlInterface: idl.IDLInterface): string {
        let superType = idl.getSuperType(idlInterface)

        // Built-in enums cannot be used as constrained type parameters
        const typeParameters = idlInterface.typeParameters?.map(it => {
            const types = it.split("extends").map(it => it.trim())
            const typeParameter = types[0]
            const extendable = types[1]
            if (extendable != undefined) {
                const type = this.peerLibrary.resolveTypeReference(idl.createReferenceType(extendable))
                if (type !== undefined && idl.isEnum(type)) {
                    return typeParameter
                }
            }
            return it
        })
        const parentTypeArgs = this.printTypeParameters(
            (superType as idl.IDLReferenceType)?.typeArguments?.map(it => idl.printType(it)))
        return [idlInterface.name,
            `${this.printTypeParameters(typeParameters)}`,
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

    private printProperty(prop: idl.IDLProperty, allowReadonly: boolean): stringOrNone[] {
        const staticMod = prop.isStatic ? "static " : ""
        // TODO stub until issue 20764 is fixed
        const readonlyMod = prop.isReadonly && allowReadonly ? "readonly " : ""
        return [
            ...this.printExtendedAttributes(prop),
            indentedBy(`${staticMod}${readonlyMod}${this.printPropNameWithType(prop)};`, 1)
        ]
    }

    private printMethod(idl: idl.IDLMethod): stringOrNone[] {
        // TODO dirty stub. We are not processing interfaces methods as a
        // callbacks for now, so interfaces with methods can not be
        // deserialized in ArkTS
        return []
        // return [
        //     ...this.printExtendedAttributes(idl),
        //     indentedBy(`${idl.name}${this.printTypeParameters(idl.typeParameters)}(${this.printParameters(idl.parameters)}): ${this.convertType(idl.returnType)}`, 1)
        // ]
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
        const isOptional = prop.isOptional
        const type = this.convertType(prop.type)
        if (prop.name === "") {
            return `${type}${isOptional ? "?" : ""}`
        }
        return `${prop.name}${isOptional ? "?" : ""}: ${type}`
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
        return typeParameters?.length ? `<${typeParameters.join(",").replace("[]", "")}>` : ""
    }

    private convertType(idlType: idl.IDLType): string {
        return this.typeNameConvertor.getNodeName(idlType)
    }

    private isMemo(node: idl.IDLEntry): boolean {
        if (idl.isCallback(node) && node.name == "CustomBuilder")
            return true
        return false
    }

    private printCallback(node: idl.IDLCallback | idl.IDLInterface,
                          parameters: idl.IDLParameter[],
                          returnType: idl.IDLType | undefined): string {
        const maybeMemo = this.isMemo(node) ? `\n/** @memo */\n` : ``
        const paramsType = this.printParameters(parameters)
        const retType = this.convertType(returnType !== undefined ? returnType : idl.IDLVoidType)
        return `type ${node.name}${this.printTypeParameters(node.typeParameters)} = ${maybeMemo}(${paramsType}) => ${retType};`
    }

    private isCallback(node: idl.IDLInterface) {
        return node.callables.length === 1
        && [node.constants,
            node.properties,
            node.methods]
            .reduce((sum, value) => value.length + sum, 0) === 0
    }

    private printTuple(tuple: idl.IDLInterface) {
        const seenFields = new Set<string>()
        return ([`type ${this.printInterfaceName(tuple)} = [`] as stringOrNone[])
            .concat(tuple.properties
                .map((it, propIndex) => this.printIfNotSeen(it, it => {
                    //TODO: use ETSConvertor.processTupleType
                    let types: IDLType[] = []
                    if (it.isOptional) {
                        if (idl.isUnionType(it.type)) {
                            types = it.type.types
                        } else if (idl.isPrimitiveType(it.type)) {
                            types = [it.type]
                        } else {
                            throwException(`Unprocessed type: ${idl.forceAsNamedNode(it.type)}`)
                        }
                    }
                    let property = idl.createProperty("",
                        it.isOptional ? idl.createUnionType([...types, idl.IDLUndefinedType]) : it.type,
                        it.isReadonly,
                        it.isStatic,
                        false)
                    const maybeComma = propIndex < tuple.properties.length - 1 ? ',' : ''
                    return [indentedBy(`${this.printPropNameWithType(property)}${maybeComma}`, 1)]
                }, seenFields) ).flat())
            .concat(["]"])
    }
}

class ArkTSSyntheticGenerator extends DependenciesCollector {
    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) this.onSyntheticDeclaration(decl)
        return super.convertImport(type, importClause)
    }

    convertCallback(decl: idl.IDLCallback): idl.IDLNode[] {
        if (decl.returnType !== idl.IDLVoidType) {
            const continuationReference = this.library.createContinuationCallbackReference(decl.returnType)
            const continuation = this.library.resolveTypeReference(continuationReference)!
            this.onSyntheticDeclaration(continuation)
        }

        const transformed = maybeTransformManagedCallback(decl)
        if (transformed) {
            this.convert(transformed)
            this.onSyntheticDeclaration(transformed)
        }

        const maybeTransformed = maybeTransformManagedCallback(decl)
        if (maybeTransformed)
            this.onSyntheticDeclaration(maybeTransformed)

        return super.convertCallback(decl)
    }

    convertInterface(decl: idl.IDLInterface): idl.IDLNode[] {
        if (idl.isHandwritten(decl))
            return super.convertInterface(decl)
        idl.forEachFunction(decl, function_ => {
            const promise = idl.asPromise(function_.returnType)
            if (promise) {
                const reference = this.library.createContinuationCallbackReference(promise)
                const continuation = this.library.resolveTypeReference(reference)!
                this.onSyntheticDeclaration(continuation)
            }
        })
        if (isMaterialized(decl, this.library) && !isBuilderClass(decl)) {
            this.onSyntheticDeclaration(idl.createInterface(
                createInterfaceDeclName(decl.name),
                idl.IDLInterfaceSubkind.Interface,
                [], // todo decl.inheritance
                decl.constructors,
                decl.constants,
                decl.properties.filter(it => !it.isStatic),
                decl.methods,
                decl.callables,
                decl.typeParameters,
                {
                    documentation: decl.documentation,
                    fileName: decl.fileName,
                    extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }],
                }
            ))
        }
        return super.convertInterface(decl)
    }
}

class ArkTSInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: PeerLibrary) {
        super()
    }

    private generateModuleBasename(moduleName: string): string {
        return moduleName.concat(Language.ARKTS.extension)
    }

    private printImports(writer: LanguageWriter, module: string) {
        const imports = new ImportsCollector()
        // file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        getCommonImports(writer.language).forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, module)
    }

    protected printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: PeerFile) {
        const enums = peerFile.entries.filter(idl.isEnum)
        if (enums.length != 0) {
            writer.print(`Object.assign(globalThis, {`)
            writer.pushIndent()
            for (const e of enums) {
                const usageTypeName = this.peerLibrary.mapType(idl.createReferenceType(e.name))
                writer.print(`${e.name}: ${usageTypeName},`)
            }
            writer.popIndent()
            writer.print(`})`)
        }
    }

    printInterfaces() {
        const moduleToEntries = new Map<string, idl.IDLEntry[]>()
        const registerEntry = (entry: idl.IDLEntry) => {
            const module = convertDeclToFeature(this.peerLibrary, entry).module
            if (!moduleToEntries.has(module))
                moduleToEntries.set(module, [])
            if (moduleToEntries.get(module)!.some(it => it.name === entry.name))
                return
            moduleToEntries.get(module)!.push(entry)
        }
        const syntheticGenerator = new ArkTSSyntheticGenerator(this.peerLibrary, (entry) => {
            registerEntry(entry)
        })
        for (const file of this.peerLibrary.files) {
            for (const entry of file.entries) {
                if (idl.isModuleType(entry) ||
                    idl.isPackage(entry) ||
                    isPredefined(entry) ||
                    idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.GlobalScope) ||
                    idl.isHandwritten(entry) ||
                    PeerGeneratorConfig.ignoreEntry(entry.name, this.peerLibrary.language))
                    continue
                syntheticGenerator.convert(entry)
                if (idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry)))
                    continue
                registerEntry(entry)
            }
        }

        for (const [module, entries] of moduleToEntries) {
            const writer = createLanguageWriter(this.peerLibrary.language, this.peerLibrary)
            const imports = new ImportsCollector()
            for (const entry of entries) {
                collectDeclDependencies(this.peerLibrary, entry, imports)
            }
            this.printImports(writer, module)
            imports.print(writer, module)

            const typeConvertor = new ArkTSDeclConvertor(writer, this.peerLibrary)
            for (const entry of entries) {
                convertDeclaration(typeConvertor, entry)
            }
            this.interfaces.set(new TargetFile(this.generateModuleBasename(module)), writer)
        }
    }
}
class CJDeclaration {
    public readonly targetFile: TargetFile
    constructor(alias: string, public readonly writer: LanguageWriter) {
        this.targetFile = new TargetFile(alias + writer.language.extension, '')
    }
}

class CJInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: PeerLibrary) {
       super()
    }

    printInterfaces() {
        const declarationConverter = new CJDeclarationConvertor(this.peerLibrary, (declaration: CJDeclaration) => {
            this.interfaces.set(declaration.targetFile, declaration.writer)
        })
        const onEntry = (entry: idl.IDLEntry) => {
            convertDeclaration(declarationConverter, entry)
        }
        const syntheticGenerator = new CJSyntheticGenerator(this.peerLibrary, (entry) => {
            onEntry(entry)
        })
        for (const file of this.peerLibrary.files) {
            for (const entry of file.entries) {
                if (idl.isModuleType(entry) ||
                    idl.isPackage(entry) ||
                    idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.GlobalScope) ||
                    idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.TSType) ||
                    isPredefined(entry))
                    continue
                if (PeerGeneratorConfig.ignoreEntry(entry.name, this.peerLibrary.language))
                    continue
                syntheticGenerator.convert(entry)
                if (idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry)))
                    continue
                onEntry(entry)
            }
        }
    }
}

class CJSyntheticGenerator extends DependenciesCollector {
    private readonly nameConvertor = createTypeNameConvertor(Language.CJ, this.library)

    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        this.onSyntheticDeclaration(idl.createTypedef(this.nameConvertor.convert(type), type))
        return super.convertUnion(type)
    }

    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) this.onSyntheticDeclaration(decl)
        return super.convertImport(type, importClause)
    }
}

class CJDeclarationConvertor implements DeclarationConvertor<void> {
    constructor(private readonly peerLibrary: PeerLibrary, private readonly onNewDeclaration: (declaration: CJDeclaration) => void) {}
    convertCallback(node: idl.IDLCallback): void {
    }
    convertEnum(node: idl.IDLEnum): void {
        this.onNewDeclaration(this.makeEnum(node.name, node))
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
        if (idl.isInterface(type)) {
            switch (type.subkind) {
                case idl.IDLInterfaceSubkind.Interface:
                case idl.IDLInterfaceSubkind.AnonymousInterface:
                    this.onNewDeclaration(this.makeInterface(name, type))
                    return
                case idl.IDLInterfaceSubkind.Tuple:
                    this.onNewDeclaration(this.makeTuple(name, type))
                    return
            }
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
        const decl = node.subkind == idl.IDLInterfaceSubkind.Tuple
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
                writer.writeFieldDeclaration(memberName, idl.maybeOptional(memberType, true), [FieldModifier.PRIVATE], true, writer.makeString(`None<${writer.getNodeName(memberType)}>`))

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
        }, ARK_OBJECTBASE)

        return new CJDeclaration(alias, writer)
    }

    private makeInterface(alias: string, type: idl.IDLInterface): CJDeclaration {
        const writer = createLanguageWriter(Language.CJ, this.peerLibrary)
        this.printPackage(writer)

        writer.print('import std.collection.*\n')

        const members = isComponentDeclaration(this.peerLibrary, type) ? []
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


function getVisitor(peerLibrary: PeerLibrary, context: PrinterContext): InterfacesVisitor | undefined {
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
        imports.push({feature: "int64", module: "@koalaui/common"})
        imports.push({feature: "float32", module: "@koalaui/common"})
        imports.push({feature: "KInt", module: "@koalaui/interop"})
        imports.push({feature: "KPointer", module: "@koalaui/interop"})
        imports.push({feature: "KBoolean", module: "@koalaui/interop"})
        imports.push({feature: "KStringPtr", module: "@koalaui/interop"})
        imports.push({feature: "wrapCallback", module: "@koalaui/interop"})
        imports.push({feature: "NodeAttach", module: "@koalaui/runtime"})
        imports.push({feature: "remember", module: "@koalaui/runtime"})
    }
    if (language === Language.ARKTS) {
        imports.push({feature: "NativeBuffer", module: "@koalaui/interop"})
    }
    return imports
}
