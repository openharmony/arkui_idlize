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
import { createLanguageWriter, LanguageWriter, PeerFile,
    indentedBy, isBuilderClass, isMaterialized, stringOrNone, throwException, Language, PeerLibrary,
     convertDeclaration, DeclarationConvertor, maybeTransformManagedCallback,
     MethodModifier,
     FieldModifier,
     Method,
     MethodSignature,
     NamedMethodSignature,
     isInIdlize,
     isInIdlizeInternal,
     isInCurrentModule
} from '@idlizer/core'
import { ARK_CUSTOM_OBJECT, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH,
    collectAllProperties,
    collectDeclDependencies, collectJavaImports, collectProperties, convertDeclToFeature,
    DependenciesCollector, ImportFeature, ImportsCollector, isComponentDeclaration,
    peerGeneratorConfiguration, printJavaImports, TargetFile, tsCopyrightAndWarning,
    ARK_OBJECTBASE
} from '@idlizer/libohos'

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
    protected typeNameConvertor = createLanguageWriter(Language.TS, this.peerLibrary)
    protected seenInterfaceNames = new Set<string>()

    constructor(protected readonly writer: LanguageWriter,
                readonly peerLibrary: PeerLibrary) {}

    private wrapWithNamespaces(node: idl.IDLEntry, cb: () => void) {
        const parentNamespace = idl.fetchNamespaceFrom(node.parent)
        if (!parentNamespace) {
            cb()
        } else {
            this.wrapWithNamespaces(parentNamespace, () => {
                this.writer.print(`export namespace ${parentNamespace.name} {`)
                this.writer.pushIndent()
                cb()
                this.writer.popIndent()
                this.writer.print('}')
            })
        }
    }
    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        const type = this.typeNameConvertor.getNodeName(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        this.writer.print(`export type ${node.name}${typeParams} = ${type};`)
    }

    convertCallback(node: idl.IDLCallback) {
        this.wrapWithNamespaces(node, () => {
            this.writer.print('export ' +
                this.printCallback(node, node.parameters, node.returnType))
        })
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
        //TODO: CommonMethod has a method onClick and a property onClick
        const seenFields = new Set<string>()
        return ([`interface ${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(idlInterface.constants
                .map(it => this.printIfNotSeen(it, it => this.printConstant(it), seenFields)).flat())
            .concat(idlInterface.properties
                // TODO ArkTS does not support static fields in interfaces
                .filter(it => !it.isStatic)
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
        variable: idl.IDLVariable,
        isVariadic: boolean = false,
        isOptional: boolean = false): string {
        const type = variable.type ? this.convertType(variable.type) : ""
        const optional = isOptional ? "optional " : ""
        return `${idl.escapeIDLKeyword(variable.name!)}${optional ? "?" : ""}: ${type}`
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
                }, seenFields) ).flat())
            .concat(["]"])
    }

    convertMethod(node: idl.IDLMethod): void {
        this.writer.writeMethodDeclaration(node.name, this.writer.makeSignature(node.returnType, node.parameters), node.isFree ? [MethodModifier.FREE] : [])
    }
    convertConstant(node: idl.IDLConstant): void {
        this.writer.print(`export declare const ${node.name} = ${node.value};`)
    }
    convertEnum(node: idl.IDLEnum): void {
        this.writer.writeStatement(this.writer.makeEnumEntity(node, true))
    }
    protected extendsClause(node: idl.IDLInterface): string {
        return ''
    }

    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }

    convertNamespace(node: idl.IDLNamespace): void {
        this.writer.pushNamespace(node.name);
        node.members.forEach(it => convertDeclaration(this, it))
        this.writer.popNamespace();
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

class TSInterfacesVisitor extends DefaultInterfacesVisitor {
    constructor(protected readonly peerLibrary: PeerLibrary) {
        super()
    }

    private generateModuleBasename(moduleName: string): string {
        return moduleName.concat(Language.TS.extension)
    }

    private printImports(writer: LanguageWriter, module: string) {
        const imports = new ImportsCollector()
        // file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        getCommonImports(writer.language).forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(writer, module)
    }

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

    printInterfaces() {
        const moduleToEntries = new Map<string, idl.IDLEntry[]>()
        const registerEntry = (entry: idl.IDLEntry) => {
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
                if (idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) && entry.subkind == idl.IDLInterfaceSubkind.Class || isBuilderClass(entry)))
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

            const typeConvertor = new TSDeclConvertor(writer, this.peerLibrary)
            for (const entry of entries) {
                convertDeclaration(typeConvertor, entry)
            }
            this.interfaces.set(new TargetFile(this.generateModuleBasename(module)), writer)
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
    constructor(private readonly peerLibrary: PeerLibrary, private readonly onNewDeclaration: (declaration: JavaDeclaration) => void) {}
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
            return
        }
        if (idl.isReferenceType(type)) {
            const target = this.peerLibrary.resolveTypeReference(type) // TODO: namespace-related-to-rework
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
        this.onNewDeclaration(decl)
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
            const enumType = idl.createReferenceType(enumDecl)
            members.forEach(it => {
                const initializer = isStringEnum ?
                    `new ${alias}(${it.numberId}, "${it.stringId}")` :
                    `new ${alias}(${it.numberId})`
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(initializer)
                )
            })

            // data fields
            const value = 'value'
            const stringValue = 'stringValue'
            writer.writeFieldDeclaration(value, idl.IDLI32Type, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)
            if (isStringEnum) {
                writer.writeFieldDeclaration(stringValue, idl.IDLStringType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)
            }

            // constructor
            const signature = isStringEnum ?
                new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type, idl.IDLStringType]) :
                new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type])
            writer.writeConstructorImplementation(alias, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
                if (isStringEnum)
                    writer.writeStatement(
                        writer.makeAssign(stringValue, undefined, writer.makeString(signature.argName(1)), false)
                    )
            }, undefined, [MethodModifier.PRIVATE])
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
    }
}

export class ArkTSDeclConvertor extends TSDeclConvertor {
    protected typeNameConvertor = createLanguageWriter(Language.ARKTS, this.peerLibrary)
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

    printInterfaces() {
        const moduleToEntries = new Map<string, idl.IDLEntry[]>()
        const registerEntry = (entry: idl.IDLEntry) => {
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
                if (idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry)))
                    continue
                registerEntry(entry)
            }
        }

        for (const [module, entries] of moduleToEntries) {
            const writer = this.peerLibrary.createLanguageWriter()
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
    constructor(private readonly peerLibrary: PeerLibrary, private readonly onNewDeclaration: (declaration: CJDeclaration) => void) {}
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
            const target = this.peerLibrary.resolveTypeReference(type) // TODO: namespace-related-to-rework
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
        this.onNewDeclaration(decl)
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

        let allProperties: idl.IDLProperty[] = isComponentDeclaration(this.peerLibrary, type) ? [] : collectAllProperties(type, this.peerLibrary)
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


function getVisitor(peerLibrary: PeerLibrary): InterfacesVisitor | undefined {
    if (peerLibrary.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.ARKTS) {
        return new ArkTSInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    throwException(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function printInterfaces(peerLibrary: PeerLibrary): Map<TargetFile, string> {
    const visitor = getVisitor(peerLibrary)
    if (!visitor) {
        return new Map()
    }

    visitor.printInterfaces()
    const result = new Map<TargetFile, string>()
    for (const [key, writer] of visitor.getInterfaces()) {
        if (writer.getOutput().length === 0) continue
        result.set(key, tsCopyrightAndWarning(writer.getOutput().join('\n')))
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
        imports.push({feature: "NativeBuffer", module: "@koalaui/interop"})
    }
    return imports
}
