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
    createLanguageWriter, LanguageWriter,
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
    isExternalType,
    LayoutNodeRole,
    PeerClass,
    InterfaceConvertor,
    CJLanguageWriter,
    PeerMethod,
    isInIdlizeStdlib,
    removePoints,
    getOrPut,
    zipStrip,
    zipMany,
    collapseTypes,
    getSuper
} from '@idlizer/core'
import { PrinterFunction, PrinterResult } from '../LayoutManager'
import { peerGeneratorConfiguration } from '../../DefaultConfiguration'
import { isComponentDeclaration } from '../ComponentsCollector'
import { DependenciesCollector } from '../idl/IdlDependenciesCollector'
import { ImportsCollector, ImportFeature } from '../ImportsCollector'
import { convertDeclToFeature, collectDeclDependencies } from '../ImportsCollectorUtils'
import { ARKOALA_PACKAGE_PATH, ARK_CUSTOM_OBJECT, ARKOALA_PACKAGE, ARK_OBJECTBASE } from './lang/Java'
import { collectJavaImports } from './lang/JavaIdlUtils'
import { printJavaImports } from './lang/JavaPrinters'
import { collectAllProperties } from './StructPrinter'
import { TargetFile } from './TargetFile'
import { collapseSameMethodsIDL } from './OverloadsPrinter'
export interface InterfacesVisitor {
    printInterfaces(): PrinterResult[]
}

export class TSDeclConvertor implements DeclarationConvertor<void> {

    constructor(
        protected readonly writer: LanguageWriter,
        protected readonly seenInterfaceNames: Set<string>,
        readonly peerLibrary: PeerLibrary,
        readonly isDeclared: boolean,
    ) { }

    private needDeclaredPrefix(decl: idl.IDLEntry): boolean {
        return this.isDeclared && idl.getNamespacesPathFor(decl).length === 0
    }

    protected maybeConvertReexportTypedef(node: idl.IDLTypedef): string | undefined {
        if (!idl.isReferenceType(node.type)) return undefined
        const target = this.peerLibrary.resolveTypeReference(node.type)
        if (target?.name != node.name || idl.getNamespaceName(target)) return undefined
        const currentModule = this.peerLibrary.layout.resolve({node: node, role: LayoutNodeRole.INTERFACE})
        const targetModule = this.peerLibrary.layout.resolve({node: target, role: LayoutNodeRole.INTERFACE})
        const relative = ImportsCollector.resolveRelative(currentModule, targetModule)!
        return `export { ${node.name} } from "${relative}"`
    }

    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic)) {
            return
        }
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        let reexportTypedef: string | undefined
        if (reexportTypedef = this.maybeConvertReexportTypedef(node)) {
            this.writer.print(reexportTypedef)
            return
        }
        const type = this.writer.getNodeName(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        this.writer.print(`export type ${node.name}${typeParams} = ${type};`)
    }

    convertCallback(node: idl.IDLCallback) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic)) {
            return
        }
        this.writer.print(this.printCallback(node, node.parameters, node.returnType))
    }

    convertInterface(node: idl.IDLInterface) {
        // FQ_BUG: use fq names instead
        if (this.seenInterfaceNames.has(node.name)) {
            console.log(`interface name: '${node.name}' already exists`)
            return;
        }
        this.seenInterfaceNames.add(node.name)
        let result: string | undefined
        if (this.isCallback(node)) {
            result = this.printCallback(node,
                node.callables[0].parameters,
                node.callables[0].returnType)
        } else if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            if (!idl.isSyntheticEntry(node))
                result = this.printTuple(node).join("\n")
        } else if (isMaterialized(node, this.peerLibrary)) {
            result = this.printMaterialized(node).join("\n")
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
        const declaredPrefix = this.needDeclaredPrefix(idlInterface) ? "declare " : ""
        const kindPrefix = isBuilderClass(idlInterface) ? "class " : "interface "
        return ([`export ${declaredPrefix}${kindPrefix}${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(idlInterface.constants
                .map(it => this.printIfNotSeen(it, it => this.printConstant(it), seenFields)).flat())
            .concat(idlInterface.properties
                // TODO ArkTS does not support static fields in interfaces
                .filter(it => !it.isStatic)
                .map(it => this.printIfNotSeen(it, it => this.printProperty(it), seenFields)).flat())
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
        const declaredPrefix = this.needDeclaredPrefix(idlInterface) ? "declare " : ""
        const isInterface = idl.isInterfaceSubkind(idlInterface)
        return ([`export ${declaredPrefix}${isInterface ? "interface" : "class"} ${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(isInterface ? [] : idlInterface.constructors
                .map(it => this.printConstructor(it)).flat())
            .concat(idlInterface.constants
                .map(it => this.printConstant(it)).flat())
            .concat(idlInterface.properties
                .map(it => this.printProperty(it)).flat())
            .concat(this.collapseAmbiguousMethods(idlInterface.methods)
                .filter(it => !idl.isInterfaceSubkind(idlInterface) || !it.isStatic)
                .map(it => this.printMethod(it)).flat())
            .concat(idlInterface.callables
                .map(it => this.printFunction(it)).flat())
            .concat(["}"])
    }

    protected hasIntersection(a:idl.IDLType, b:idl.IDLType): boolean {
        if (idl.printType(a) === idl.printType(b)) {
            return true
        }
        if (idl.isOptionalType(a) && idl.isOptionalType(b)) {
            return true
        }
        if (idl.isUnionType(a)) {
            return this.hasIntersection(b, a)
        }
        if (idl.isUnionType(b)) {
            return b.types.some(it => this.hasIntersection(a, it))
        }
        return false
    }

    protected collapseMethods(methodsName:string, methods:idl.IDLMethod[]): idl.IDLMethod {
        const parameters: idl.IDLParameter[] = []
        const maxParams = methods.map(m => m.parameters.length).reduce((a, b) => Math.max(a, b), -1)

        // todo: better code and better logic here
        const isStatic = methods.every(it => it.isStatic)
        const isAsync = methods.every(it => it.isAsync)
        const isFree = methods.every(it => it.isFree)
        const isOptional = methods.some(it => it.isOptional)

        for (let i = 0; i < maxParams; ++i) {
            const names = new Set<string>()
            const types: idl.IDLType[] = []
            let isOptional = false
            for (const method of methods) {
                if (i < method.parameters.length) {
                    const param = method.parameters[i]
                    names.add(param.name)
                    isOptional = isOptional || param.isOptional
                    types.push(param.type)
                }
            }
            if (types.length === 0) {
                throw new Error("BUG")
            }
            parameters.push(
                idl.createParameter(
                    Array.from(names).join('_'),
                    collapseTypes(types),
                    isOptional
                )
            )
        }
        return idl.createMethod(
            methodsName,
            parameters,
            collapseTypes(methods.map(m => m.returnType)),
            {
                isStatic,
                isAsync,
                isFree,
                isOptional
            }
        )
    }

    protected collapseAmbiguousMethods(methods:idl.IDLMethod[]) {
        const groups = new Map<string, idl.IDLMethod[]>()
        methods.forEach(method => {
            const record = getOrPut(groups, method.name, () => [])
            record.push(method)
        })
        const result:idl.IDLMethod[] = []
        groups.forEach((group, name) => {
            if (group.length === 1) {
                result.push(group[0])
                return
            }
            const graph = new Map<idl.IDLMethod, idl.IDLMethod[]>()
            for (let i = 0; i < group.length; ++i) {
                for (let j = i + 1; j < group.length; ++j) {
                    const item1 = group[i]
                    const item2 = group[j]

                    const isIntersects = zipStrip(item1.parameters, item2.parameters)
                        .every(([a, b]) => a.isOptional && b.isOptional || this.hasIntersection(a.type, b.type))
                    const children1 = getOrPut(graph, item1, () => [])
                    const children2 = getOrPut(graph, item2, () => [])
                    if (isIntersects) {
                        children1.push(item2)
                        children2.push(item1)
                    }
                }
            }

            const components: idl.IDLMethod[][] = []
            const stack: idl.IDLMethod[] = []
            const seenNodes = new Set<idl.IDLMethod>()
            Array.from(graph.keys()).forEach(method => {
                if (seenNodes.has(method)) {
                    return
                }
                const component: idl.IDLMethod[] = []
                stack.push(method)
                while (stack.length) {
                    const current = stack.pop()!
                    if (seenNodes.has(current)) {
                        continue
                    }
                    seenNodes.add(current)
                    component.push(current)
                    stack.push(...graph.get(current)!)
                }
                components.push(component)
            })

            for (const component of components) {
                if (component.length === 1) {
                    result.push(component[0])
                } else {
                    result.push(
                        this.collapseMethods(name, component)
                    )
                }
            }
        })

        return result
    }

    // TBD: Properly handle FQN in type parameters
    private toFQN(target: idl.IDLType): string {
        if (idl.isTypeParameterType(target)) return target.name
        if (!idl.isReferenceType(target)) throw Error(`Not a reference type: ${target}`)
        const type = this.peerLibrary.resolveTypeReference(target)
        if (!type) throw Error(`Unable to resolve the type: ${target.name}`)
        return [...idl.getNamespacesPathFor(type), type.name].join(".")
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

        let superTypes = idlInterface.inheritance
        const extendsItems: string[] = []
        const implementsItems: string[] = []
        superTypes?.forEach(it => {
            const superDecl = this.peerLibrary.resolveTypeReference(it)
            const parentTypeArgs = this.printTypeArguments(
                (it as idl.IDLReferenceType)?.typeArguments?.map(it => this.toFQN(it)))
            const clause = `${it.name}${parentTypeArgs}`

            const shouldPrintAsImplements = superDecl
                && isMaterialized(idlInterface, this.peerLibrary)
                && idl.isClassSubkind(idlInterface)
                && idl.isInterface(superDecl)
                && (idl.isInterfaceSubkind(superDecl) || idl.isClassSubkind(superDecl) && !isMaterialized(superDecl, this.peerLibrary))

            if (shouldPrintAsImplements) {
                implementsItems.push(clause)
            } else {
                extendsItems.push(clause)
            }
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

    protected printProperty(prop: idl.IDLProperty): stringOrNone[] {
        const staticMod = prop.isStatic ? "static " : ""
        const readonlyMod = prop.isReadonly ? "readonly " : ""
        return [
            ...this.printExtendedAttributes(prop),
            indentedBy(`${staticMod}${readonlyMod}${this.printPropNameWithType(prop)};`, 1)
        ]
    }

    protected printConstructor(method: idl.IDLConstructor): stringOrNone[] {
        return [
            ...this.printExtendedAttributes(method),
            indentedBy(`constructor(${this.printConstructorParametersWithOptionalFix(method.parameters)})`, 1)
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

    protected printConstructorParametersWithOptionalFix(parameters: idl.IDLParameter[]): string {
        // Using constructor overloads, which differ only by the presense or absence of optional parameter
        // confuses the ui2abc, considering replacing all optional parameters with explicit "| undefined" type
        return parameters
            ?.map(it => this.printNameWithTypeIDLParameter(it, it.isVariadic, it.isOptional, true))
            ?.join(", ") ?? ""
    }

    private printNameWithTypeIDLParameter(
        variable: idl.IDLVariable,
        isVariadic: boolean = false,
        isOptional: boolean = false,
        optAsUndefined = false
    ): string {
        const type = variable.type ? this.convertType(idl.maybeOptional(variable.type, isOptional && optAsUndefined)) : ""
        const optional = isOptional && !optAsUndefined ? "?" : ""
        const dots = isVariadic ? "..." : ""
        const brackets = isVariadic ? "[]" : ""
        return `${dots}${idl.escapeIDLKeyword(variable.name!)}${optional}: ${type}${brackets}`
    }

    protected printTypeParameters(typeParameters: string[] | undefined): string {
        function addDefaultIfNeeded(typeParameter: string): string {
            if (!typeParameter.includes('='))
                return `${typeParameter} = void`
            return typeParameter
        }
        return typeParameters?.length ? `<${typeParameters.map(addDefaultIfNeeded).join(",").replace("[]", "")}>` : ""
    }

    protected printTypeArguments(typeArguments: string[] | undefined): string {
        return typeArguments?.length ? `<${typeArguments.join(",").replace("[]", "")}>` : ""
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
        const maybeMemo = this.isMemo(node)
            ? this.peerLibrary.useMemoM3 ? `\n@memo\n` : `\n/** @memo */\n`
            : ``
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

    protected printTuple(tuple: idl.IDLInterface) {
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
                        } else if (idl.isReferenceType(it.type)) {
                            types = [it.type]
                        } else {
                            throwException(`Unprocessed type: ${idl.forceAsNamedNode(it.type).name}`)
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
    convertConstant(node: idl.IDLConstant): void {}
    convertEnum(node: idl.IDLEnum): void {
        this.writer.writeStatement(this.writer.makeEnumEntity(node, { isExport: true, isDeclare: false }))
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

export class TSInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary,
        protected readonly printClasses: boolean,
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
        return idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry) || isExternalType(entry, this.peerLibrary))
            || idl.isMethod(entry)
    }

    protected getDeclConvertor(writer:LanguageWriter, seenNames:Set<string>, library:PeerLibrary, isDeclared:boolean): DeclarationConvertor<void> {
        return new TSDeclConvertor(writer, seenNames, library, isDeclared)
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
                    idl.isHandwritten(entry) || peerGeneratorConfiguration().isHandWritten(entry.name) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language) ||
                    isInIdlizeStdlib(entry) ||
                    idl.isInterface(entry) && entry.subkind === idl.IDLInterfaceSubkind.Class && !this.printClasses)
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

                getCommonImports(writer.language, { isDeclared: false, useMemoM3: this.peerLibrary.useMemoM3, libraryName: this.peerLibrary.name })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports)

                const printVisitor = this.getDeclConvertor(writer, seenNames, this.peerLibrary, false)
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
        private readonly onNewDeclaration: (entry: idl.IDLEntry, declaration: JavaDeclaration) => void
    ) { }
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
                members.push({ name: initializer.name, ordinal: counter, value: initializer.id })
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({ name: initializer.name, ordinal: counter, value: memberValue })
            }
            else {
                members.push({ name: initializer.name, ordinal: counter, value: memberValue })
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
        const superDecl = getSuper(type, this.peerLibrary)
        if (superDecl) {
            superName = superDecl.name
        }
        writer.writeClass(alias, () => {
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, it.type, it.modifiers, false)
            })
        }, superName ?? ARK_OBJECTBASE)

        return new JavaDeclaration(alias, writer)
    }
}

export class JavaInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) { }

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
                if (idl.isNamespace(entry) || isInIdlizeInternal(entry))
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
    protected printMethod(method: idl.IDLMethod): stringOrNone[] {
        const staticPrefix = method.isStatic ? "static " : ""
        return [
            ...this.printExtendedAttributes(method),
            indentedBy(`${staticPrefix}${method.name}${this.printTypeParameters(method.typeParameters)}(${this.printParameters(method.parameters)}): ${this.convertType(method.returnType)}`, 1)
        ]
    }
    override convertConstant(node: idl.IDLConstant): void {
        if (this.isDeclared) {
            this.writer.print(`export declare const ${node.name} = ${node.value};`)
        }
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
        // if (decl.returnType !== idl.IDLVoidType) {
        //     const continuationReference = this.library.createContinuationCallbackReference(decl.returnType)
        //     const continuation = this.library.resolveTypeReference(continuationReference)!
        //     this.onSyntheticDeclaration(continuation)
        // }

        // const transformed = maybeTransformManagedCallback(decl, this.library)
        // if (transformed) {
        //     this.convert(transformed)
        //     this.onSyntheticDeclaration(transformed)
        // }

        // const maybeTransformed = maybeTransformManagedCallback(decl, this.library)
        // if (maybeTransformed)
        //     this.onSyntheticDeclaration(maybeTransformed)

        return super.convertCallback(decl)
    }

    convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
        if (idl.isHandwritten(decl))
            return super.convertInterface(decl)
        // idl.forEachFunction(decl, function_ => {
        //     const promise = idl.asPromise(function_.returnType)
        //     if (promise) {
        //         const reference = this.library.createContinuationCallbackReference(promise)
        //         const continuation = this.library.resolveTypeReference(reference)!
        //         this.onSyntheticDeclaration(continuation)
        //     }
        // })
        return super.convertInterface(decl)
    }
}

export class ArkTSInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary,
        protected readonly isDeclared: boolean,
        protected readonly printClasses: boolean,
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
        return idl.isInterface(entry) && !this.isDeclared && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry))
            || idl.isMethod(entry)
    }

    protected getDeclConvertor(writer:LanguageWriter, seenNames:Set<string>, library:PeerLibrary, isDeclared:boolean): DeclarationConvertor<void> {
        return new ArkTSDeclConvertor(writer, seenNames, library, isDeclared)
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
            if (!isInCurrentModule(file))
                continue
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isNamespace(entry) ||
                    idl.isImport(entry) ||
                    isInIdlizeInternal(entry) ||
                    idl.isHandwritten(entry) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language) ||
                    isInIdlizeStdlib(entry) ||
                    idl.isInterface(entry) && entry.subkind === idl.IDLInterfaceSubkind.Class && !this.printClasses)
                    continue
                syntheticGenerator.convert(entry)
                registerEntry(entry)
            }
        }

        const result: PrinterResult[] = []
        for (const entries of moduleToEntries.values()) {
            const seenNames = new Set<string>()
            for (const entry of entries) {
                if (idl.isImport(entry)) {
                    continue
                }
                const imports = new ImportsCollector()
                const writer = this.peerLibrary.createLanguageWriter()

                getCommonImports(writer.language, { isDeclared: this.isDeclared, useMemoM3: this.peerLibrary.useMemoM3, libraryName: this.peerLibrary.name })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports)

                const typeConvertor = this.getDeclConvertor(writer, seenNames, this.peerLibrary, this.isDeclared)
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

export class CJInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
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

        const syntheticGenerator = new CJSyntheticGenerator(this.peerLibrary, (entry) => {
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

                collectDeclDependencies(this.peerLibrary, entry, imports)

                const printVisitor = new CJDeclarationConvertor(writer, seenNames, this.peerLibrary)
                convertDeclaration(printVisitor, entry)

                result.push({
                    collector: new ImportsCollector(),
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
    constructor(
        protected readonly writer: LanguageWriter,
        protected readonly seenInterfaceNames: Set<string>,
        readonly peerLibrary: PeerLibrary
    ) { }

    convertCallback(node: idl.IDLCallback): void {
        if (!idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic))
            this.writer.print(this.printCallback(node, node.parameters, node.returnType))
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
        this.writer.writeStatement(this.writer.makeEnumEntity(node, { isExport: true }))
    }
    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        const type = this.writer.getNodeName(node.type)
        if (node.name == type) {
            if (idl.isUnionType(node.type)) {
                this.makeUnion(this.writer, node.type)
                return
            }
            if (idl.isEnum(node.type)) {
                this.makeEnum(this.writer, node.type)
                return
            }
            if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
                return
        }
        else {
            const typeParams = this.printTypeParameters(node.typeParameters)
            this.writer.print(`public type ${node.name}${typeParams} = ${type}`)
        }
    }
    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }
    convertNamespace(node: idl.IDLNamespace): void {
        throw new Error("Internal error: namespaces are not allowed on the CJ layer")
    }
    convertInterface(node: idl.IDLInterface): void {
        if (['RuntimeType', 'CallbackResource', 'Materialized'].includes(node.name))
            return
        if (this.seenInterfaceNames.has(node.name)) {
            console.log(`interface name: '${node.name}' already exists`)
            return;
        }
        this.seenInterfaceNames.add(node.name)
        if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            this.makeTuple(this.writer, node)
        } else {
            this.makeInterface(this.writer, node)
        }
    }

    private printCallback(node: idl.IDLCallback | idl.IDLInterface,
        parameters: idl.IDLParameter[],
        returnType: idl.IDLType | undefined): string {
        const paramsType = this.printParameters(parameters)
        const retType = this.convertType(returnType !== undefined ? returnType : idl.IDLVoidType)
        return `public type ${node.name} = (${paramsType}) -> ${retType}`
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
        return `${this.writer.escapeKeyword(idl.escapeIDLKeyword(variable.name!))}: ${isOptional ? "?" : ""}${type}`
    }
    protected printTypeParameters(typeParameters: string[] | undefined): string {
        return typeParameters?.length ? `<${typeParameters.join(",").replace("[]", "")}>` : ""
    }
    protected convertType(idlType: idl.IDLType): string {
        return this.writer.getNodeName(idlType)
    }
    private makeUnion(writer: LanguageWriter, type: idl.IDLUnionType): void {
        const members = type.types.map(it => it)
        writer.writeClass(type.name, () => {
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
                        writer.print(`} else { throw Exception("Wrong selector value inside Union ${type.name}") }`)
                    }
                )
            }
        })
    }

    private makeTuple(writer: LanguageWriter, type: idl.IDLInterface): void {
        if (['AnimationRange'].includes(type.name))
            return
        const members = type.properties.map(it => idl.maybeOptional(it.type, it.isOptional))
        const memberNames: string[] = members.map((_, index) => `value${index}`)
        const typeParams = type.typeParameters && type.typeParameters?.length != 0 ? `<${type.typeParameters.map(it => it.split('extends')[0].split('=')[0]).join(', ')}>` : ''
        writer.writeClass(type.name.concat(typeParams), () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], members[i], [FieldModifier.PUBLIC], idl.isOptionalType(members[i]) ?? false)
            }

            const signature = new MethodSignature(idl.IDLVoidType, members)
            writer.writeConstructorImplementation(type.name, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], members[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        })
    }

    private makeEnum(writer: LanguageWriter, enumDecl: idl.IDLEnum): void {
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
        let mangledName = removePoints(`${idl.getNamespaceName(enumDecl)}${enumDecl.name}`)
        writer.writeClass(mangledName, () => {
            const enumType = idl.createReferenceType(enumDecl)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`${enumDecl.name}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.IDLI32Type
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(idl.IDLVoidType, [intType])
            writer.writeConstructorImplementation(mangledName, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })
        })
    }

    private makeInterface(writer: LanguageWriter, type: idl.IDLInterface): void {
        const superNames = type.inheritance
        let parentProperties: idl.IDLProperty[] = []
        if (superNames) {
            const superDecls = superNames ? superNames.map(t => this.peerLibrary.resolveTypeReference(t as idl.IDLReferenceType)) : undefined
            parentProperties = superDecls!.map(decl => collectAllProperties(decl as idl.IDLInterface, this.peerLibrary)).flat()
        }
        let ownProperties: idl.IDLProperty[] = isComponentDeclaration(this.peerLibrary, type) ? [] : type.properties.filter(it => !parentProperties.map(prop => prop.name).includes(it.name))

        let FQInterfaceName = removePoints(idl.getNamespaceName(type)).concat(type.name)
        let typeParams = type.typeParameters && type.typeParameters?.length != 0 ? `<${type.typeParameters.map(it => it.split('extends')[0].split('=')[0]).join(', ')}>` : ''
        if (['CommonMethod', 'CommonShapeMethod', 'BaseSpan',
            'ScrollableCommonMethod', 'LazyGridLayoutAttribute',
            'LazyVGridLayoutAttributeInterfaces', 'SecurityComponentMethod',
            'GestureHandler', 'GestureInterface'].includes(type.name) || (superNames ? writer.getNodeName(superNames[0]) == "CommonMethod" : false)) {
            typeParams = ''
        }

        writer.writeInterface(`${FQInterfaceName}${isMaterialized(type, this.peerLibrary) ? '' : 'Interfaces'}${typeParams}`, (writer) => {
            for (const p of ownProperties) {
                const modifiers: FieldModifier[] = []
                if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (p.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(p.name, idl.maybeOptional(p.type, p.isOptional), modifiers)
            }
        }, superNames ? superNames.map(it => `${removePoints(idl.getNamespaceName(it as unknown as idl.IDLEntry))}${it.name}Interfaces${typeParams}`) : undefined) // make proper inheritance

        writer.writeClass(`${FQInterfaceName}${typeParams}`, () => {
            ownProperties.concat(parentProperties).forEach(it => {
                let modifiers: FieldModifier[] = []
                if (it.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (it.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(it.name, idl.maybeOptional(it.type, it.isOptional), modifiers, { method: new Method(it.name, new NamedMethodSignature(it.type, [it.type], [it.name])) })
            })
            writer.writeConstructorImplementation(`${FQInterfaceName}`,
                new NamedMethodSignature(idl.IDLVoidType,
                    ownProperties.concat(parentProperties).map(it => idl.maybeOptional(it.type, it.isOptional)),
                    ownProperties.concat(parentProperties).map(it => writer.escapeKeyword(it.name))), () => {
                        for (let i of ownProperties.concat(parentProperties)) {
                            writer.print(`this.${i.name}_container = ${writer.escapeKeyword(i.name)}`)
                        }
                    })
        }, undefined, [`${FQInterfaceName}Interfaces${typeParams}`])
    }
}

export class KotlinInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
        return idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary) || isBuilderClass(entry))
            || idl.isMethod(entry)
    }

    printInterfaces(): PrinterResult[] {const moduleToEntries = new Map<string, idl.IDLEntry[]>()

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

        const syntheticGenerator = new KotlinSyntheticGenerator(this.peerLibrary, (entry) => {
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

                collectDeclDependencies(this.peerLibrary, entry, imports)

                const printVisitor = new KotlinDeclarationConvertor(writer, seenNames, this.peerLibrary)
                convertDeclaration(printVisitor, entry)

                result.push({
                    collector: new ImportsCollector(),
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

class KotlinSyntheticGenerator extends DependenciesCollector {
    private readonly nameConvertor = this.library.createTypeNameConvertor(Language.KOTLIN)

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

class KotlinDeclarationConvertor implements DeclarationConvertor<void> {
    constructor(
        protected readonly writer: LanguageWriter,
        protected readonly seenInterfaceNames: Set<string>,
        readonly peerLibrary: PeerLibrary
    ) { }

    convertCallback(node: idl.IDLCallback): void {
        if (!idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic))
            this.writer.print(this.printCallback(node, node.parameters, node.returnType))
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
        this.writer.writeStatement(this.writer.makeEnumEntity(node, { isExport: true, isDeclare: false }))
    }
    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        const type = this.writer.getNodeName(node.type)
        if (node.name == type) {
            if (idl.isUnionType(node.type)) {
                this.makeUnion(this.writer, node.type)
                return
            }
            if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
                return
        }
        else {
            this.writer.print(`public typealias ${node.name} = ${type}`)
        }
    }
    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }
    convertNamespace(node: idl.IDLNamespace): void {
        throw new Error("Internal error: namespaces are not allowed on the Kotlin layer")
    }
    convertInterface(node: idl.IDLInterface): void {
        if (this.seenInterfaceNames.has(node.name)) {
            console.log(`interface name: '${node.name}' already exists`)
            return;
        }
        this.seenInterfaceNames.add(node.name)
        if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            this.makeTuple(this.writer, node)
        } else {
            this.makeInterface(this.writer, node)
        }
    }

    private printCallback(node: idl.IDLCallback | idl.IDLInterface,
        parameters: idl.IDLParameter[],
        returnType: idl.IDLType | undefined): string {
        return ''
    }
    protected convertType(idlType: idl.IDLType): string {
        return this.writer.getNodeName(idlType)
    }
    private makeUnion(writer: LanguageWriter, type: idl.IDLUnionType): void {
        const members = type.types.map(it => it)
        writer.writeClass(type.name, () => {
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
                writer.writeFieldDeclaration(memberName, idl.maybeOptional(memberType, true), [FieldModifier.PRIVATE], true, writer.makeNull())

                writer.writeConstructorImplementation(
                    'constructor',
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
                        writer.print(`return requireNotNull(${memberName})`)
                    }
                )
            }
        })
    }

    private makeTuple(writer: LanguageWriter, type: idl.IDLInterface): void {
        const members = type.properties.map(it => idl.maybeOptional(it.type, it.isOptional))
        const memberNames: string[] = members.map((_, index) => `value${index}`)
        const typeParams = type.typeParameters && type.typeParameters?.length != 0 ? `<${type.typeParameters.map(it => it.split('extends')[0].split('=')[0]).join(', ')}>` : ''
        writer.writeClass(type.name.concat(typeParams), () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], members[i], [FieldModifier.PUBLIC], idl.isOptionalType(members[i]) ?? false)
            }

            const signature = new MethodSignature(idl.IDLVoidType, members)
            writer.writeConstructorImplementation(type.name, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], members[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        })
    }

    private makeEnum(writer: LanguageWriter, enumDecl: idl.IDLEnum): void {
        throw new Error("Try to avoid makeEnum")
    }

    private makeInterface(writer: LanguageWriter, type: idl.IDLInterface): void {
        writer.writeInterface(`${type.name}`, (writer) => {
            for (const p of type.properties) {
                const modifiers: FieldModifier[] = []
                if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (p.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(p.name, idl.maybeOptional(p.type, p.isOptional), modifiers)
            }
        }, undefined) 
    }
}


function getVisitor(peerLibrary: PeerLibrary, isDeclarations:boolean, printClasses:boolean): InterfacesVisitor {
    if (peerLibrary.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary, printClasses)
    }
    if (peerLibrary.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.ARKTS) {
        return new ArkTSInterfacesVisitor(peerLibrary, isDeclarations, printClasses)
    }
    if (peerLibrary.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.KOTLIN) {
        return new KotlinInterfacesVisitor(peerLibrary)
    }
    throw new Error(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function createInterfacePrinter(isDeclarations:boolean, printClasses:boolean): PrinterFunction {
    return (library: PeerLibrary) => getVisitor(library, isDeclarations, printClasses).printInterfaces()
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


export function getCommonImports(language: Language, options: { isDeclared: boolean, useMemoM3: boolean, libraryName: string }) {
    const imports: ImportFeature[] = []
    if (language === Language.ARKTS || language === Language.TS) {
        imports.push({ feature: "int32", module: "@koalaui/common" })
        imports.push({ feature: "int64", module: "@koalaui/common" })
        imports.push({ feature: "float32", module: "@koalaui/common" })
        imports.push({ feature: "KInt", module: "@koalaui/interop" })
        imports.push({ feature: "KPointer", module: "@koalaui/interop" })
        imports.push({ feature: "KBoolean", module: "@koalaui/interop" })
        imports.push({ feature: "NativeBuffer", module: "@koalaui/interop" })
        if (!options.isDeclared) {
            imports.push({ feature: "KStringPtr", module: "@koalaui/interop" })
            imports.push({ feature: "wrapCallback", module: "@koalaui/interop" })
            imports.push({ feature: "NativeBuffer", module: "@koalaui/interop" })
        }
        if (options.useMemoM3 && language === Language.ARKTS) {
            imports.push(
                { feature: "memo", module: "@koalaui/runtime/annotations" },
                { feature: "memo_stable", module: "@koalaui/runtime/annotations" },
                { feature: "BuilderLambda", module: "@koalaui/builderLambda" },
            )
        }
    }
    return imports
}
