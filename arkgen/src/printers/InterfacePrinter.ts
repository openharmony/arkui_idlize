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

import * as idl from '@idlizer/core/idl'
import {
    createLanguageWriter, LanguageWriter, PeerFile,
    indentedBy, isBuilderClass, isMaterialized, stringOrNone, throwException, Language, PeerLibrary,
     convertDeclaration, DeclarationConvertor, maybeTransformManagedCallback,
     MethodModifier,
     FieldModifier,
     Method,
     MethodSignature,
     NamedMethodSignature,
     isInIdlize,
     isInIdlizeInternal,
     isInCurrentModule,
     LayoutNodeRole,
     PeerClass,
} from '@idlizer/core'
import { ARK_CUSTOM_OBJECT, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH,
    collectDeclDependencies, collectJavaImports, collectProperties, convertDeclToFeature,
    DependenciesCollector, ImportFeature, ImportsCollector, isComponentDeclaration,
    peerGeneratorConfiguration, printJavaImports, TargetFile, tsCopyrightAndWarning,
    ARK_OBJECTBASE, collectComponents, PrinterResult, PrinterClass, collectInterfaceDependencies,
    collapseSameNamedMethods, groupOverloads,
    PrinterFunction,
    findComponentByDeclaration,
    collapseIdlPeerMethods,
} from '@idlizer/libohos'

interface InterfacesVisitor {
    printInterfaces(): PrinterResult[]
}

export class TSDeclConvertor implements DeclarationConvertor<void> {

    constructor(
        protected readonly writer: LanguageWriter,
        protected readonly seenInterfaceNames: Set<string>,
        readonly peerLibrary: PeerLibrary,
        readonly isDeclared: boolean,
    ) {}

    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        const type = this.writer.getNodeName(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        this.writer.print(`export type ${node.name}${typeParams} = ${type};`)
    }

    convertCallback(node: idl.IDLCallback) {
        this.writer.print(this.printCallback(node, node.parameters, node.returnType))
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
        } else if (isMaterialized(node, this.peerLibrary)) {
            result = this.printMaterialized(node).join("\n")
        } else if (isComponentDeclaration(this.peerLibrary, node)) {
            result = this.printComponent(node).join("\n")
        } else {
            result = this.printInterface(node).join("\n")
        }
        
        if (result) this.writer.writeLines(result)
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

    protected printInterface(idlInterface: idl.IDLInterface): stringOrNone[] {
        //TODO: CommonMethod has a method onClick and a property onClick
        const seenFields = new Set<string>()
        const declaredPrefix = this.isDeclared ? "declare " : ""
        const kindPrefix = isBuilderClass(idlInterface) ? "class " : "interface "
        return ([`export ${declaredPrefix}${kindPrefix}${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(idlInterface.constants
                .map(it => this.printIfNotSeen(it, it => this.printConstant(it), seenFields)).flat())
            .concat(idlInterface.properties
                // TODO ArkTS does not support static fields in interfaces
                .filter(it => !it.isStatic)
                .map(it => this.printIfNotSeen(it, it => this.printProperty(it, false), seenFields)).flat())
            // TODO enable when materialized will print methods from parent interface, now do not have time to implement this
            // .concat(idlInterface.methods
            //     .map(it => this.printIfNotSeen(it, it => this.printMethod(it), seenFields)).flat())
            .concat(idlInterface.callables
                .map(it => this.printIfNotSeen(it, it => this.printFunction(it), seenFields)).flat())
            .concat(["}"])
    }

    protected printMaterialized(idlInterface: idl.IDLInterface): stringOrNone[] {
        if (!this.isDeclared && !idl.isInterfaceSubkind(idlInterface))
            // print `export interface` or `export declare class`, but not `export class`
            return []
        const declaredPrefix = this.isDeclared ? "declare " : ""
        return ([`export ${declaredPrefix}${idl.isInterfaceSubkind(idlInterface) ? "interface" : "class"} ${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(idlInterface.constants
                .map(it => this.printConstant(it)).flat())
            .concat(idlInterface.properties
                .map(it => this.printProperty(it, true)).flat())
            .concat(idlInterface.methods
                .map(it => this.printMethod(it)).flat())
            .concat(idlInterface.callables
                .map(it => this.printFunction(it)).flat())
            .concat(["}"])
    }

    protected printComponent(idlInterface: idl.IDLInterface): stringOrNone[]{
        const component = findComponentByDeclaration(this.peerLibrary, idlInterface)
        if (idlInterface !== component?.attributeDeclaration)
            return []
        let peer: PeerClass | undefined
        for (const file of this.peerLibrary.files) {
            if (file.peers.has(component.name))
                peer = file.peers.get(component.name)!
        }
        if (!peer) throw new Error(`Peer for component ${component.name} was not found`)
        const printer = this.peerLibrary.createLanguageWriter()
        const declaredPrefix = this.isDeclared ? "declare " : ""
        const superType = idl.getSuperType(idlInterface)
        const extendsClause = superType ? `extends ${superType.name} ` : ""
        printer.print(`export ${declaredPrefix}interface ${idlInterface.name} ${extendsClause}{`)
        printer.pushIndent()
        const filteredMethods = peer!.methods
            .filter(it => !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, this.peerLibrary.language))
            .filter(it => !it.isCallSignature)
        groupOverloads(filteredMethods).forEach(group => {
            const method = collapseIdlPeerMethods(this.peerLibrary, group)
            printer.print(`/** @memo */`)
            printer.writeMethodDeclaration(method.method.name, method.method.signature)
        })
        printer.popIndent()
        printer.print('}')
        return printer.getOutput()
    }

    protected printInterfaceName(idlInterface: idl.IDLInterface): string {

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

        let superTypes = idl.getSuperTypes(idlInterface)
        const extendsItems: string[] = []
        const implementsItems: string[] = []
        superTypes?.forEach(it => {
            const superDecl = this.peerLibrary.resolveTypeReference(it)
            const parentTypeArgs = this.printTypeParameters(
                (it as idl.IDLReferenceType)?.typeArguments?.map(it => idl.printType(it)))
            const clause = `${idl.forceAsNamedNode(it).name}${parentTypeArgs}`
            if (superDecl && isMaterialized(idlInterface, this.peerLibrary) && idl.isClassSubkind(idlInterface) && idl.isInterface(superDecl) && idl.isInterfaceSubkind(superDecl))
                implementsItems.push(clause)
            else
                extendsItems.push(clause)
        })
        const extendsClause = extendsItems.length ? ` extends ${extendsItems.join(", ")}` : ""
        const implementsClause = implementsItems.length ? ` implements ${implementsItems.join(", ")}` : ""
        return [idlInterface.name,
        `${this.printTypeParameters(typeParameters)}${extendsClause}${implementsClause}`,
        ].join("")
    }

    protected printConstant(constant: idl.IDLConstant): stringOrNone[] {
        return [
            ...this.printExtendedAttributes(constant),
            indentedBy(`const ${idl.nameWithType(constant)} = ${constant.value};`, 1)
        ]
    }

    protected printProperty(prop: idl.IDLProperty, allowReadonly: boolean): stringOrNone[] {
        const staticMod = prop.isStatic ? "static " : ""
        // TODO stub until issue 20764 is fixed
        const readonlyMod = prop.isReadonly && allowReadonly ? "readonly " : ""
        return [
            ...this.printExtendedAttributes(prop),
            indentedBy(`${staticMod}${readonlyMod}${this.printPropNameWithType(prop)};`, 1)
        ]
    }

    protected printMethod(idl: idl.IDLMethod): stringOrNone[] {
        // TODO dirty stub. We are not processing interfaces methods as a
        // callbacks for now, so interfaces with methods can not be
        // deserialized in ArkTS
        return []
        // return [
        //     ...this.printExtendedAttributes(idl),
        //     indentedBy(`${idl.name}${this.printTypeParameters(idl.typeParameters)}(${this.printParameters(idl.parameters)}): ${this.convertType(idl.returnType)}`, 1)
        // ]
    }
    protected printFunction(it: idl.IDLFunction): stringOrNone[] {
        if (it.name?.startsWith("__")) {
            console.log(`Ignore ${it.name}`)
            return []
        }
        return [
            ...this.printExtendedAttributes(it),
            indentedBy(`${it.name}(${this.printParameters(it.parameters)}): ${this.convertType(it.returnType!)};`, 1)
        ]
    }

    protected printExtendedAttributes(idl: idl.IDLEntry): stringOrNone[] {
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

    protected printParameters(parameters: idl.IDLParameter[]): string {
        return parameters
            ?.map(it => this.printNameWithTypeIDLParameter(it, it.isVariadic, it.isOptional))
            ?.join(", ") ?? ""
    }

    private printNameWithTypeIDLParameter(
        variable: idl.IDLVariable,
        isVariadic: boolean = false,
        isOptional: boolean = false): string {
        const type = variable.type ? this.convertType(variable.type) : ""
        const optional = isOptional ? "optional " : ""
        return `${idl.escapeIDLKeyword(variable.name!)}${optional ? "?" : ""}: ${type}`
    }

    protected printTypeParameters(typeParameters: string[] | undefined): string {
        return typeParameters?.length ? `<${typeParameters.join(",").replace("[]", "")}>` : ""
    }

    protected convertType(idlType: idl.IDLType): string {
        return this.writer.getNodeName(idlType)
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
        return `export type ${node.name}${this.printTypeParameters(node.typeParameters)} = ${maybeMemo}(${paramsType}) => ${retType};`
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
        return ([`export type ${this.printInterfaceName(tuple)} = [`] as stringOrNone[])
            .concat(tuple.properties
                .map((it, propIndex) => this.printIfNotSeen(it, it => {
                    //TODO: use ETSConvertor.processTupleType
                    let types: idl.IDLType[] = []
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
                }, seenFields)).flat())
            .concat(["]"])
    }

    convertMethod(node: idl.IDLMethod): void {
        this.writer.writeMethodDeclaration(node.name, this.writer.makeSignature(node.returnType, node.parameters), node.isFree ? [MethodModifier.FREE] : [])
    }
    convertConstant(node: idl.IDLConstant): void {
        this.writer.print(`export declare const ${node.name} = ${node.value};`)
    }
    convertEnum(node: idl.IDLEnum): void {
        this.writer.writeStatement(this.writer.makeEnumEntity(node, { isExport: true, isDeclare: this.isDeclared}))
    }
    protected extendsClause(node: idl.IDLInterface): string {
        return ''
    }

    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }

    convertNamespace(): void {
        throw new Error("Not used!")
    }
}

class TSSyntheticGenerator extends DependenciesCollector {
    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) this.onSyntheticDeclaration(decl)
        return super.convertTypeReferenceAsImport(type, importClause)
    }
}

class TSInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) {}

    protected printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: PeerFile) {
        const enums = idl.linearizeNamespaceMembers(peerFile.entries).filter(idl.isEnum)
        if (enums.length != 0) {
            writer.print(`Object.assign(globalThis, {`)
            writer.pushIndent()
            for (const e of enums) {
                const usageTypeName = this.peerLibrary.mapType(idl.createReferenceType(e))
                writer.print(`${e.name}: ${usageTypeName},`)
            }
            writer.popIndent()
            writer.print(`})`)
        }
    }

    private shouldNotPrint(entry:idl.IDLEntry): boolean {
        return idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry))
            || idl.isMethod(entry)
    }

    printInterfaces(): PrinterResult[] {
        const moduleToEntries = new Map<string, idl.IDLEntry[]>()
        const registerEntry = (entry: idl.IDLEntry) => {
            if (this.shouldNotPrint(entry)) {
                return
            }
            const module = convertDeclToFeature(this.peerLibrary, entry).module
            if (!moduleToEntries.has(module))
                moduleToEntries.set(module, [])
            if (moduleToEntries.get(module)!.some(it => idl.isEqualByQualifedName(it, entry, "namespace.name")))
                return
            moduleToEntries.get(module)!.push(entry)
        }
        const syntheticGenerator = new TSSyntheticGenerator(this.peerLibrary, (entry) => {
            registerEntry(entry)
        })
        for (const file of this.peerLibrary.files) {
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isImport(entry) ||
                    idl.isNamespace(entry) ||
                    isInIdlizeInternal(entry) ||
                    idl.isHandwritten(entry) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language))
                    continue
                syntheticGenerator.convert(entry)
                registerEntry(entry)
            }
        }

        const result: PrinterResult[] = []
        for (const entries of moduleToEntries.values()) {
            const seenNames = new Set<string>()
            for (const entry of entries) {
                const imports = new ImportsCollector()
                const writer = createLanguageWriter(this.peerLibrary.language, this.peerLibrary)

                getCommonImports(writer.language, { isDeclared: false })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports)

                const printVisitor = new TSDeclConvertor(writer, seenNames, this.peerLibrary, false)
                convertDeclaration(printVisitor, entry)

                result.push({
                    collector: imports,
                    content: writer,
                    over: {
                        node: entry,
                        role: LayoutNodeRole.INTERFACE
                    }
                })
            }
        }
        return result
    }
}


class JavaDeclaration {
    public readonly targetFile: TargetFile
    constructor(alias: string, public readonly writer: LanguageWriter) {
        this.targetFile = new TargetFile(alias + writer.language.extension, ARKOALA_PACKAGE_PATH)
    }
}

class JavaSyntheticGenerator extends DependenciesCollector {
    private readonly nameConvertor = this.library.createTypeNameConvertor(Language.JAVA)

    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        const typeName = this.nameConvertor.convert(type)
        this.onSyntheticDeclaration(idl.createTypedef(typeName, type))
        return super.convertUnion(type)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const generatedName = this.nameConvertor.convert(type)
        const clazz = idl.createInterface(
            generatedName,
            idl.IDLInterfaceSubkind.Interface,
            [idl.createReferenceType(ARK_CUSTOM_OBJECT)]
        )
        this.onSyntheticDeclaration(clazz)
        return super.convertTypeReferenceAsImport(type, importClause)
    }

    convertTypedef(decl: idl.IDLTypedef): idl.IDLEntry[] {
        if (peerGeneratorConfiguration().ignoreEntry(decl.name, Language.JAVA))
            return []
        return super.convertTypedef(decl)
    }
}

class JavaDeclarationConvertor implements DeclarationConvertor<void> {
    private readonly nameConvertor = this.peerLibrary.createTypeNameConvertor(Language.JAVA)
    constructor(
        private readonly peerLibrary: PeerLibrary,
        private readonly onNewDeclaration: (entry:idl.IDLEntry, declaration: JavaDeclaration) => void
    ) {}
    convertCallback(node: idl.IDLCallback): void {
    }
    convertMethod(node: idl.IDLMethod): void {
        // TODO: namespace-related-to-rework
        throw new Error("not implemented yet")
    }
    convertConstant(node: idl.IDLConstant): void {
        // TODO: namespace-related-to-rework
        throw new Error("not implemented yet")
    }
    convertEnum(node: idl.IDLEnum): void {
        this.onNewDeclaration(node, this.makeEnum(node.name, node))
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.convertTypedefTarget(node, node.name, node.type)
    }
    private convertTypedefTarget(node: idl.IDLTypedef, name: string, type: idl.IDLNode) {
        if (idl.isUnionType(type)) {
            this.onNewDeclaration(node, this.makeUnion(name, type))
            return
        }
        if (idl.isEnum(type)) {
            this.onNewDeclaration(node, this.makeEnum(name, type))
            return
        }
        if (idl.isInterface(type)) {
            switch (type.subkind) {
                case idl.IDLInterfaceSubkind.Interface:
                case idl.IDLInterfaceSubkind.AnonymousInterface:
                    this.onNewDeclaration(node, this.makeInterface(name, type))
                    return
                case idl.IDLInterfaceSubkind.Tuple:
                    this.onNewDeclaration(node, this.makeTuple(name, type))
                    return
            }
            return
        }
        if (idl.isReferenceType(type)) {
            const target = this.peerLibrary.resolveTypeReference(type) // TODO: namespace-related-to-rework
            this.convertTypedefTarget(node, name, target!)
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
    convertNamespace(node: idl.IDLNamespace): void {
        node.members.forEach(member => convertDeclaration(this, member))
    }
    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }
    convertInterface(node: idl.IDLInterface): void {
        const name = this.nameConvertor.convert(node)
        const decl = node.subkind === idl.IDLInterfaceSubkind.Tuple
            ? this.makeTuple(name, node)
            : this.makeInterface(name, node)
        this.onNewDeclaration(node, decl)
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    private makeUnion(alias: string, type: idl.IDLUnionType): JavaDeclaration {
        const writer = this.peerLibrary.createLanguageWriter(Language.JAVA)
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
        const writer = this.peerLibrary.createLanguageWriter(Language.JAVA)
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
        const writer = this.peerLibrary.createLanguageWriter(Language.JAVA)
        this.printPackage(writer)

        const initializers = enumDecl.elements.map(it => {
            return { name: it.name, id: it.initializer }
        })

        const isStringEnum = idl.isStringEnum(enumDecl)

        let memberValue = 0
        let counter = 0
        const members: {
            name: string,
            ordinal: number,
            value: number | string,
        }[] = []
        for (const initializer of initializers) {
            if (typeof initializer.id == 'string') {
                members.push({name: initializer.name, ordinal: counter, value: initializer.id})
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({name: initializer.name, ordinal: counter, value: memberValue})
            }
            else {
                members.push({name: initializer.name, ordinal: counter, value: memberValue})
            }
            memberValue += 1
            counter += 1
        }

        writer.writeClass(alias, () => {
            const enumType = idl.createReferenceType(enumDecl)
            members.forEach(it => {
                const initializer = isStringEnum ?
                    `new ${alias}(${it.ordinal}, "${it.value}")` :
                    `new ${alias}(${it.ordinal}, ${it.value})`
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(initializer)
                )
            })

            // data fields
            const ordinal = 'ordinal'
            const value = 'value'
            const valueType = isStringEnum ? idl.IDLStringType : idl.IDLI32Type
            writer.writeFieldDeclaration(ordinal, idl.IDLI32Type, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)
            writer.writeFieldDeclaration(value, valueType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            // constructor
            const signature = new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type, valueType])
            writer.writeConstructorImplementation(alias, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(ordinal, undefined, writer.makeString(signature.argName(0)), false)
                )
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(1)), false)
                )
            }, undefined, [MethodModifier.PRIVATE])

            // values method
            const valuesReturnType = idl.createContainerType('sequence', [idl.createReferenceType(alias)])
            const valuesMethod = new Method('values', new MethodSignature(valuesReturnType, []), [MethodModifier.PUBLIC, MethodModifier.STATIC])
            writer.writeMethodImplementation(valuesMethod, () => {
                const enumMembers = members.map(it => it.name).join(', ')
                writer.writeFieldDeclaration('result', valuesReturnType, [FieldModifier.FINAL], false, writer.makeString(`{ ${enumMembers} }`))
                writer.writeStatement(writer.makeReturn(writer.makeString('result')))
            })
        }, ARK_OBJECTBASE)

        return new JavaDeclaration(alias, writer)
    }

    private makeInterface(alias: string, type: idl.IDLInterface): JavaDeclaration {
        const writer = this.peerLibrary.createLanguageWriter(Language.JAVA)
        this.printPackage(writer)

        const imports = collectJavaImports(type.properties.map(it => it.type))
        printJavaImports(writer, imports)
        // TODO: *Attribute classes are empty for now
        const members = isComponentDeclaration(this.peerLibrary, type) ? []
            : type.properties.map(it => {
                return { name: it.name, type: idl.maybeOptional(it.type, it.isOptional), modifiers: [FieldModifier.PUBLIC] }
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

class JavaInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) {}

    printInterfaces() {
        const result: PrinterResult[] = []
        const declarationConverter = new JavaDeclarationConvertor(this.peerLibrary, (entry, declaration) => {
            result.push({
                content: declaration.writer,
                collector: new ImportsCollector(),
                over: {
                    node: entry,
                    role: LayoutNodeRole.INTERFACE
                }
            })
        })
        const syntheticsGenerator = new JavaSyntheticGenerator(this.peerLibrary, (entry) => {
            convertDeclaration(declarationConverter, entry)
        })
        for (const file of this.peerLibrary.files.values()) {
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isNamespace(entry) ||isInIdlizeInternal(entry))
                    continue;
                syntheticsGenerator.convert(entry)
                if (peerGeneratorConfiguration().ignoreEntry(entry.name, Language.JAVA))
                    continue
                if (idl.isInterface(entry) && (
                    isBuilderClass(entry) ||
                    isMaterialized(entry, this.peerLibrary)))
                    continue
                convertDeclaration(declarationConverter, entry)
            }
            // file.declarations.forEach(it => convertDeclaration(declarationConverter, it))
        }
        return result
    }
}

export class ArkTSDeclConvertor extends TSDeclConvertor {
    protected typeNameConvertor = createLanguageWriter(Language.ARKTS, this.peerLibrary)

    protected printMethod(method: idl.IDLMethod): stringOrNone[] {
        const staticPrefix = method.isStatic ? "static " : ""
        return [
            ...this.printExtendedAttributes(method),
            indentedBy(`${staticPrefix}${method.name}${this.printTypeParameters(method.typeParameters)}(${this.printParameters(method.parameters)}): ${this.convertType(method.returnType)}`, 1)
        ]
    }
}

class ArkTSSyntheticGenerator extends DependenciesCollector {
    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) this.onSyntheticDeclaration(decl)
        return super.convertTypeReferenceAsImport(type, importClause)
    }

    convertCallback(decl: idl.IDLCallback): idl.IDLEntry[] {
        if (decl.returnType !== idl.IDLVoidType) {
            const continuationReference = this.library.createContinuationCallbackReference(decl.returnType)
            const continuation = this.library.resolveTypeReference(continuationReference)!
            this.onSyntheticDeclaration(continuation)
        }

        const transformed = maybeTransformManagedCallback(decl, this.library)
        if (transformed) {
            this.convert(transformed)
            this.onSyntheticDeclaration(transformed)
        }

        const maybeTransformed = maybeTransformManagedCallback(decl, this.library)
        if (maybeTransformed)
            this.onSyntheticDeclaration(maybeTransformed)

        return super.convertCallback(decl)
    }

    convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
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
        return super.convertInterface(decl)
    }
}

class ArkTSInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary,
        protected readonly isDeclared: boolean,
    ) {}

    protected printAssignEnumsToGlobalScope(writer: LanguageWriter, peerFile: PeerFile) {
        const enums = idl.linearizeNamespaceMembers(peerFile.entries).filter(idl.isEnum)
        if (enums.length != 0) {
            writer.print(`Object.assign(globalThis, {`)
            writer.pushIndent()
            for (const e of enums) {
                const usageTypeName = this.peerLibrary.mapType(idl.createReferenceType(e))
                writer.print(`${e.name}: ${usageTypeName},`)
            }
            writer.popIndent()
            writer.print(`})`)
        }
    }

    private shouldNotPrint(entry:idl.IDLEntry): boolean {
        return idl.isInterface(entry) && !this.isDeclared && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry))
             || idl.isMethod(entry)
    }

    printInterfaces(): PrinterResult[] {
        const moduleToEntries = new Map<string, idl.IDLEntry[]>()
        const registerEntry = (entry: idl.IDLEntry) => {
            if (this.shouldNotPrint(entry)) {
                return
            }
            const module = convertDeclToFeature(this.peerLibrary, entry).module
            if (!moduleToEntries.has(module))
                moduleToEntries.set(module, [])
            if (moduleToEntries.get(module)!.some(it => idl.isEqualByQualifedName(it, entry)))
                return
            moduleToEntries.get(module)!.push(entry)
        }
        const syntheticGenerator = new ArkTSSyntheticGenerator(this.peerLibrary, (entry) => {
            registerEntry(entry)
        })
        for (const file of this.peerLibrary.files) {
            if (!isInCurrentModule(file.file))
                continue
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isNamespace(entry) ||
                    isInIdlizeInternal(entry) ||
                    idl.isHandwritten(entry) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language))
                    continue
                syntheticGenerator.convert(entry)
                registerEntry(entry)
            }
        }

        const result: PrinterResult[] = []
        for (const entries of moduleToEntries.values()) {
            const seenNames = new Set<string>()
            for (const entry of entries) {
                const imports = new ImportsCollector()
                const writer = this.peerLibrary.createLanguageWriter()

                getCommonImports(writer.language, { isDeclared: this.isDeclared })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports)

                const typeConvertor = new ArkTSDeclConvertor(writer, seenNames, this.peerLibrary, this.isDeclared)
                convertDeclaration(typeConvertor, entry)

                result.push({
                    collector: imports,
                    content: writer,
                    over: {
                        node: entry,
                        role: LayoutNodeRole.INTERFACE
                    }
                })
            }
        }
        return result
    }
}
class CJDeclaration {
    public readonly targetFile: TargetFile
    constructor(alias: string, public readonly writer: LanguageWriter) {
        this.targetFile = new TargetFile(alias + writer.language.extension, '')
    }
}

class CJInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) {}

    printInterfaces(): PrinterResult[] {
        const result: PrinterResult[] = []
        const declarationConverter = new CJDeclarationConvertor(this.peerLibrary, (entry: idl.IDLEntry, declaration: CJDeclaration) => {
            result.push({
                collector: new ImportsCollector(),
                content: declaration.writer,
                over: {
                    node: entry,
                    role: LayoutNodeRole.INTERFACE
                }
            })
        })
        const onEntry = (entry: idl.IDLEntry) => {
            convertDeclaration(declarationConverter, entry)
        }
        const syntheticGenerator = new CJSyntheticGenerator(this.peerLibrary, (entry) => {
            onEntry(entry)
        })
        for (const file of this.peerLibrary.files) {
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isNamespace(entry) ||
                    isInIdlize(entry))
                    continue
                if (peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language))
                    continue
                syntheticGenerator.convert(entry)
                if (idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry)))
                    continue
                onEntry(entry)
            }
        }
        return result
    }
}

class CJSyntheticGenerator extends DependenciesCollector {
    private readonly nameConvertor = this.library.createTypeNameConvertor(Language.CJ)

    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLEntry) => void,
    ) {
        super(library)
    }

    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        this.onSyntheticDeclaration(idl.createTypedef(this.nameConvertor.convert(type), type))
        return super.convertUnion(type)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) this.onSyntheticDeclaration(decl)
        return super.convertTypeReferenceAsImport(type, importClause)
    }
}

class CJDeclarationConvertor implements DeclarationConvertor<void> {
    constructor(private readonly peerLibrary: PeerLibrary, private readonly onNewDeclaration: (entry:idl.IDLEntry, declaration: CJDeclaration) => void) {}
    convertCallback(node: idl.IDLCallback): void {
    }
    convertMethod(node: idl.IDLMethod): void {
        // TODO: namespace-related-to-rework
        throw new Error("not implemented yet")
    }
    convertConstant(node: idl.IDLConstant): void {
        // TODO: namespace-related-to-rework
        throw new Error("not implemented yet")
    }
    convertEnum(node: idl.IDLEnum): void {
        this.onNewDeclaration(node, this.makeEnum(node.name, node))
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.convertTypedefTarget(node, node.name, node.type)
    }
    private convertTypedefTarget(node: idl.IDLEntry, name: string, type: idl.IDLNode) {
        if (idl.isUnionType(type)) {
            this.onNewDeclaration(node, this.makeUnion(name, type))
            return
        }
        if (idl.isEnum(type)) {
            this.onNewDeclaration(node, this.makeEnum(name, type))
            return
        }
        if (idl.isInterface(type)) {
            switch (type.subkind) {
                case idl.IDLInterfaceSubkind.Interface:
                case idl.IDLInterfaceSubkind.AnonymousInterface:
                    this.onNewDeclaration(node, this.makeInterface(name, type))
                    return
                case idl.IDLInterfaceSubkind.Tuple:
                    this.onNewDeclaration(node, this.makeTuple(name, type))
                    return
            }
        }
        if (idl.isReferenceType(type)) {
            const target = this.peerLibrary.resolveTypeReference(type) // TODO: namespace-related-to-rework
            this.convertTypedefTarget(node, name, target!)
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
    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }
    convertNamespace(node: idl.IDLNamespace): void {
        throw new Error("Internal error: namespaces are not allowed on the CJ layer")
    }
    convertInterface(node: idl.IDLInterface): void {
        const decl = node.subkind == idl.IDLInterfaceSubkind.Tuple
            ? this.makeTuple(node.name, node)
            : this.makeInterface(node.name, node)
        this.onNewDeclaration(node, decl)
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print(`package idlize\n`)
    }

    private makeUnion(alias: string, type: idl.IDLUnionType): CJDeclaration {
        const writer = this.peerLibrary.createLanguageWriter(Language.CJ)
        this.printPackage(writer)

        writer.print('import std.collection.*\n')
        writer.print('import Interop.*\n')

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
                        writer.popIndent()
                        writer.print(`} else { throw Exception("Wrong selector value inside Union ${alias}") }`)
                    }
                )
            }
        })

        return new CJDeclaration(alias, writer)
    }

    private makeTuple(alias: string, type: idl.IDLInterface): CJDeclaration {
        const writer = this.peerLibrary.createLanguageWriter(Language.CJ)
        this.printPackage(writer)

        writer.print('import Interop.*\n')

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
        })

        return new CJDeclaration(alias, writer)
    }

    private makeEnum(alias: string, enumDecl: idl.IDLEnum): CJDeclaration {
        const writer = this.peerLibrary.createLanguageWriter(Language.CJ)
        this.printPackage(writer)

        writer.print('import Interop.*\n')
        writer.print('import std.collection.*\n')

        const initializers = enumDecl.elements.map(it => {
            return { name: it.name, id: it.initializer }
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
                members.push({ name: initializer.name, stringId: initializer.id, numberId: memberValue })
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({ name: initializer.name, stringId: undefined, numberId: memberValue })
            }
            else {
                members.push({ name: initializer.name, stringId: undefined, numberId: memberValue })
            }
            memberValue += 1
        }
        writer.writeClass(alias, () => {
            const enumType = idl.createReferenceType(enumDecl)
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
        })

        return new CJDeclaration(alias, writer)
    }

    private makeInterface(alias: string, type: idl.IDLInterface): CJDeclaration {
        const writer = this.peerLibrary.createLanguageWriter(Language.CJ)
        this.printPackage(writer)

        writer.print('import Interop.*\n')
        writer.print('import std.collection.*\n')

        let allProperties: idl.IDLProperty[] = isComponentDeclaration(this.peerLibrary, type) ? [] : collectProperties(type, this.peerLibrary)
        let ownProperties: idl.IDLProperty[] = isComponentDeclaration(this.peerLibrary, type) ? [] : type.properties

        const superNames = idl.getSuperTypes(type)

        writer.writeInterface(`${type.name}${isMaterialized(type, this.peerLibrary) ? '' : 'Interface'}`, (writer) => {
            for (const p of ownProperties) {
                const modifiers: FieldModifier[] = []
                if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (p.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(p.name, idl.maybeOptional(p.type, p.isOptional), modifiers)
            }
        }, superNames ? superNames.map(it => `${writer.getNodeName(it)}Interface`) : undefined) // make proper inheritance
        writer.writeClass(alias, () => {
            allProperties.forEach(it => {
                let modifiers: FieldModifier[] = []
                if (it.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (it.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(it.name, idl.maybeOptional(it.type, it.isOptional), modifiers, { method: new Method(it.name, new NamedMethodSignature(it.type, [it.type], [it.name])) })
            })
            writer.writeConstructorImplementation(alias,
                new NamedMethodSignature(idl.IDLVoidType,
                    allProperties.map(it => idl.maybeOptional(it.type, it.isOptional)),
                    allProperties.map(it => writer.escapeKeyword(it.name))), () => {
                        for(let i of allProperties) {
                            writer.print(`this.${i.name}_container = ${writer.escapeKeyword(i.name)}`)
                        }
                    })
        }, undefined, [`${type.name}Interface`])

        return new CJDeclaration(alias, writer)
    }
}


function getVisitor(peerLibrary: PeerLibrary, isDeclarations: boolean): InterfacesVisitor {
    if (peerLibrary.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.ARKTS) {
        return new ArkTSInterfacesVisitor(peerLibrary, isDeclarations)
    }
    if (peerLibrary.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    throw new Error(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function createInterfacePrinter(isDeclarations: boolean): PrinterFunction {
    return (library: PeerLibrary) => getVisitor(library, isDeclarations).printInterfaces()
}

// interface PredefinedPath {
//     key: string,
//     module: string,
//     mode: string,
//     name?: string
// }

// class ArkTSPrinterClass implements PrinterClass {
//     constructor(private isDeclaration: GenerationMode) {
//     }

//     printImpl(library: PeerLibrary): PrinterResult[] {
//         const moduleToEntries = new Map<string, idl.IDLEntry[]>()
//         const registerEntry = (entry: idl.IDLEntry) => {
//             const module = entry.fileName ? entry.fileName : "default"
//             if (!moduleToEntries.has(module))
//                 moduleToEntries.set(module, [])
//             if (moduleToEntries.get(module)!.some(it => idl.isEqualByQualifedName(it, entry)))
//                 return
//             moduleToEntries.get(module)!.push(entry)
//         }
//         const syntheticGenerator = new ArkTSSyntheticGenerator(library, (entry) => {
//             registerEntry(entry)
//         })
//         for (const file of library.files) {
//             if (!isInCurrentModule(file.file))
//                 continue
//             for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
//                 if (isInIdlizeInternal(entry) ||
//                     idl.isHandwritten(entry) ||
//                     peerGeneratorConfiguration().ignoreEntry(entry.name, library.language))
//                     continue
//                 syntheticGenerator.convert(entry)
//                 if (idl.isInterface(entry) && (isMaterialized(entry, library) || isBuilderClass(entry)))
//                     continue
//                 registerEntry(entry)
//             }
//         }

//         const result: PrinterResult[] = []
//         for (const [module, entries] of moduleToEntries) {
//             for (const entry of entries) {
//                 const writer = library.createLanguageWriter(Language.ARKTS)
//                 const imports = new ImportsCollector()
//                 getCommonImports(writer.language).forEach(it => imports.addFeature(it.feature, it.module))
//                 collectDeclDependencies(library, entry, imports)
//                 addComponentImports(library, entry, imports)
//                 const typeConvertor = new ArkTSDeclConvertor(writer, library)
//                 convertDeclaration(typeConvertor, entry)
//                 result.push({
//                     over: {
//                         node: entry,
//                         role: LayoutNodeRole.INTERFACE
//                     },
//                     content: writer,
//                     collector: imports
//                 })
//             }
//         }
//         return result
//     }

//     printDeclarationCommenImports(imports: ImportsCollector) {
//         imports.addFeatures(['memo', 'ComponentBuilder'], 'stateManagement/runtime');
//     }

//     printDeclaration(library: PeerLibrary): PrinterResult[] {
//         const result: PrinterResult[] = []
//         for (const file of library.files) {
//             if (!file.originalFilename?.includes("/ets")) {
//                 continue
//             }
//             for (const entry of file.entries) {
//                 let isUnits = false;
//                 if (entry.fileName?.endsWith("units.d.ts")) {
//                     isUnits = true
//                 }
//                 const writer = library.createLanguageWriter(Language.ARKTS)
//                 const imports = new ImportsCollector()
//                 collectDeclDependencies(library, entry, imports)

//                 const purifiedImports = new ImportsCollector()
//                 imports.getFeatures().forEach((value, module) => {
//                     value.forEach(it => {
//                         if (predefiedMap.has(it)) {
//                             if (predefiedMap.get(it)!.mode == "es") {
//                                 purifiedImports.addFeature(it, predefiedMap.get(it)!.module)
//                             } else if (!isUnits) {
//                                 purifiedImports.addFeature(it, 'component/units')
//                             }
//                         } else {
//                             purifiedImports.addFeature(it, module)
//                         }
//                     })
//                 })
//                 this.printDeclarationCommenImports(purifiedImports)
//                 const typeConvertor = new ArkTSDeclConvertor(writer, library)
//                 convertDeclaration(typeConvertor, entry)
//                 result.push({
//                     over: {
//                         node: entry,
//                         role: LayoutNodeRole.INTERFACE
//                     },
//                     content: writer,
//                     collector: purifiedImports
//                 })
//             }
//         }
//         return result
//     }

//     print(library: PeerLibrary): PrinterResult[] {
//         if (this.isDeclaration === GenerationMode.IMPLEMENTATION) {
//             return this.printImpl(library)
//         }
//         if (this.isDeclaration === GenerationMode.DECORATION) {
//             return this.printDeclaration(library)
//         }
//         return []
//     }
// }

// export enum GenerationMode {
//     IMPLEMENTATION = 0,
//     DECORATION = 1
// }

// export function createInterfacePrinter(mode: GenerationMode = GenerationMode.IMPLEMENTATION): PrinterClass {
//     readPredefinedPath()
//     return new ArkTSPrinterClass(mode);
// }

// export class InterfaceLayoutStrategy implements LayoutManagerStrategy {
//     resolve(target: LayoutTargetDescription): string {
//         return path.join('component', snakeToLowCamelNode(target.node));
//     }
// }


// export function createETSDeclaration(): PrinterClass {
//     return new ETSDeclarationClass();
// }


export function getCommonImports(language: Language, options: { isDeclared: boolean }) {
    const imports: ImportFeature[] = []
    if (language === Language.ARKTS || language === Language.TS) {
        imports.push({feature: "int32", module: "@koalaui/common"})
        imports.push({feature: "int64", module: "@koalaui/common"})
        imports.push({feature: "float32", module: "@koalaui/common"})
        imports.push({feature: "KInt", module: "@koalaui/interop"})
        imports.push({feature: "KPointer", module: "@koalaui/interop"})
        imports.push({feature: "KBoolean", module: "@koalaui/interop"})
        imports.push({feature: "NativeBuffer", module: "@koalaui/interop"})
        if (!options.isDeclared) {
            imports.push({feature: "KStringPtr", module: "@koalaui/interop"})
            imports.push({feature: "wrapCallback", module: "@koalaui/interop"})
            imports.push({feature: "NodeAttach", module: "@koalaui/runtime"})
            imports.push({feature: "remember", module: "@koalaui/runtime"})
            imports.push({feature: "NativeBuffer", module: "@koalaui/interop"})
        }
    }
    return imports
}
