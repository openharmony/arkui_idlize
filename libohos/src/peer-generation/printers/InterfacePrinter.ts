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
    LanguageWriter,
    indentedBy, isMaterialized, stringOrNone, throwException, Language, PeerLibrary,
    convertDeclaration, DeclarationConvertor,
    MethodModifier,
    FieldModifier,
    Method,
    MethodSignature,
    NamedMethodSignature,
    isInCurrentModule,
    LayoutNodeRole,
    removePoints,
    getOrPut,
    zipStrip,
    collapseTypes,
    isInplacedGeneric,
    maybeRestoreGenerics,
    getInitializerDefaultValue,
    getSyntheticTypesFileName,
    flattenUnionType,
} from '@idlizer/core'
import { PrinterFunction, PrinterResult } from '../LayoutManager.js'
import { peerGeneratorConfiguration } from '../../DefaultConfiguration.js'
import { isComponentDeclaration } from '../ComponentsCollector.js'
import { DependenciesCollector, KotlinDependenciesCollector } from '../idl/IdlDependenciesCollector.js'
import { ImportsCollector, ImportFeature } from '../ImportsCollector.js'
import { convertDeclToFeature, collectDeclDependencies } from '../ImportsCollectorUtils.js'
import { isModifier } from '../ModifiersCollector.js'
import { collectAllProperties, getAllSuperProps } from '../propertyCollectors.js'

export interface InterfacesVisitor {
    printInterfaces(): PrinterResult[]
}

export class TSDeclConvertor implements DeclarationConvertor<void> {

    constructor(
        protected readonly writer: LanguageWriter,
        readonly peerLibrary: PeerLibrary,
        readonly isDeclared: boolean,
    ) { }

    private needDeclaredPrefix(decl: idl.IDLEntry): boolean {
        return this.isDeclared && idl.getNamespacesPathFor(decl).length === 0
    }

    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic)) {
            return
        }
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import))
            return
        const annotations: string[] = []
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeAnnotations)) {
            const declaredAnnotations = idl.getExtAttribute(node, idl.IDLExtendedAttributes.TypeAnnotations)?.split(';') ?? []
            annotations.push(
                ...declaredAnnotations
            )
        }
        const annotationsString = this.peerLibrary.language === Language.ARKTS
            ? annotations.map(a => peerGeneratorConfiguration().transformAnnotations.get(a) ?? a).map(a => { throw new Error("AAA")/*`@${a} `*/ }).join('')
            : ''
        const type = this.writer.getNodeName(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters, idl.getExtAttributeTypesValue(node, idl.IDLExtendedAttributes.TypeParametersDefaults))
        this.writer.print(`export type ${node.name}${typeParams} = ${annotationsString}${type};`)
    }

    convertCallback(node: idl.IDLCallback) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic)) {
            return
        }
        this.writer.writeLines(this.printCallback(node, node.parameters, node.returnType))
    }

    convertInterface(node: idl.IDLInterface) {
        let result: stringOrNone[] | undefined
        if (this.isCallback(node)) {
            result = this.printCallback(node,
                node.callables[0].parameters,
                node.callables[0].returnType)
        } else if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            if (!idl.isSyntheticEntry(node))
                result = this.printTuple(node)
        } else if (isMaterialized(node, this.peerLibrary)) {
            result = this.printMaterialized(node)
        } else {
            result = this.printInterface(node)
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
        const kindPrefix = idl.isClassSubkind(idlInterface) ? "class " : "interface "
        const isDefault = idl.hasExtAttribute(idlInterface, idl.IDLExtendedAttributes.DefaultExport)
        return ([`export ${declaredPrefix}${kindPrefix}${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(idlInterface.constants
                .map(it => this.printIfNotSeen(it, it => this.printConstant(it), seenFields)).flat())
            .concat(idlInterface.properties
                // TODO ArkTS does not support static fields in interfaces
                .filter(it => !it.isStatic)
                .map(it => this.printIfNotSeen(it, it => this.printProperty(idlInterface, it), seenFields)).flat())
            // TODO enable when materialized will print methods from parent interface, now do not have time to implement this
            // .concat(idlInterface.methods
            //     .map(it => this.printIfNotSeen(it, it => this.printMethod(it), seenFields)).flat())
            .concat(idlInterface.callables
                .map(it => this.printIfNotSeen(it, it => this.printFunction(it), seenFields)).flat())
            .concat(["}"])
            .concat([isDefault ? `export default ${idlInterface.name}` : undefined])
    }

    protected printMaterialized(idlInterface: idl.IDLInterface): stringOrNone[] {
        if (!this.isDeclared && !idl.isInterfaceSubkind(idlInterface))
            // print `export interface` or `export declare class`, but not `export class`
            return []
        const declaredPrefix = this.needDeclaredPrefix(idlInterface) ? "declare " : ""
        const abstractPrefix = idl.hasExtAttribute(idlInterface, idl.IDLExtendedAttributes.Abstract) ? "abstract " : ""
        const isInterface = idl.isInterfaceSubkind(idlInterface)
        const isDefault = idl.hasExtAttribute(idlInterface, idl.IDLExtendedAttributes.DefaultExport)
        return ([`export ${declaredPrefix}${isInterface ? "interface" : `${abstractPrefix}class`} ${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(isInterface ? [] : idlInterface.constructors
                .map(it => this.printConstructor(it)).flat())
            .concat(idlInterface.constants
                .map(it => this.printConstant(it)).flat())
            .concat(idlInterface.properties
                .map(it => this.printProperty(idlInterface, it, true)).flat())
            .concat(this.collapseAmbiguousMethods(idlInterface.methods)
                .filter(it => !idl.isInterfaceSubkind(idlInterface) || !it.isStatic)
                .map(it => this.printMethod(it)).flat())
            .concat(idlInterface.callables
                .map(it => this.printFunction(it)).flat())
            .concat(["}"])
            .concat([isDefault ? `export default ${idlInterface.name}` : undefined])
    }

    protected hasIntersection(a: idl.IDLType, b: idl.IDLType): boolean {
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

    protected collapseMethods(methodsName: string, methods: idl.IDLMethod[]): idl.IDLMethod {
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
                } else {
                    isOptional = true
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
        let returnType: idl.IDLType
        if (methods.every(m => idl.isVoidType(m.returnType))) {
            returnType = idl.createPrimitiveType('void')
        } else {
            returnType = collapseTypes(methods.map(m =>
                idl.isVoidType(m.returnType) ? idl.createPrimitiveType('undefined') : m.returnType
            ))
        }
        return idl.createMethod(
            methodsName,
            parameters,
            returnType,
            {
                isStatic,
                isAsync,
                isFree,
                isOptional
            }
        )
    }

    protected collapseAmbiguousMethods(methods: idl.IDLMethod[]) {
        const groups = new Map<string, idl.IDLMethod[]>()
        methods.forEach(method => {
            const record = getOrPut(groups, method.name, () => [])
            record.push(method)
        })
        const result: idl.IDLMethod[] = []
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
        const typeParametersDefaults = idl.getExtAttributeTypesValue(idlInterface, idl.IDLExtendedAttributes.TypeParametersDefaults)

        let superTypes = idlInterface.inheritance
        const extendsItems: string[] = []
        const implementsItems: string[] = []
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        superTypes?.forEach(it => {
            it = maybeRestoreGenerics(it, this.peerLibrary) ?? it
            const superDecl = this.peerLibrary.resolveTypeReference(it)
            const parentTypeArgs = this.printTypeArguments(
                (it as idl.IDLReferenceType)?.typeArguments?.map(it => this.toFQN(it)))
            const clause = nameConvertor.convert(it)

            const shouldPrintAsImplements = superDecl
                && idl.isClassSubkind(idlInterface)
                && idl.isInterface(superDecl)
                && idl.isInterfaceSubkind(superDecl)

            if (shouldPrintAsImplements) {
                implementsItems.push(clause)
            } else {
                extendsItems.push(clause)
            }
        })
        const extendsClause = extendsItems.length ? ` extends ${extendsItems.join(", ")}` : ""
        const implementsClause = implementsItems.length ? ` implements ${implementsItems.join(", ")}` : ""
        return [idlInterface.name,
        `${this.printTypeParameters(typeParameters, typeParametersDefaults)}${extendsClause}${implementsClause}`,
        ].join("")
    }

    protected printConstant(constant: idl.IDLConstant): stringOrNone[] {
        return [
            ...this.printExtendedAttributes(constant),
            indentedBy(`const ${idl.nameWithType(constant)} = ${constant.value};`, 1)
        ]
    }

    protected printProperty(decl: idl.IDLInterface, prop: idl.IDLProperty, allowAccessor = false): stringOrNone[] {
        const staticMod = prop.isStatic ? "static " : ""
        const readonlyMod = prop.isReadonly ? "readonly " : ""
        const extraMethod = idl.getExtAttribute(prop, idl.IDLExtendedAttributes.ExtraMethod)
        let result = [
            ...this.printExtendedAttributes(prop),
        ]
        const accessor = idl.getExtAttribute(prop, idl.IDLExtendedAttributes.Accessor)
        if (allowAccessor && accessor && accessor === idl.IDLAccessorAttribute.Getter) {
            result.push(indentedBy(`get ${prop.name}():${this.convertType(prop.type)};`, 1))
        } else if (allowAccessor && accessor && accessor === idl.IDLAccessorAttribute.Setter) {
            result.push(indentedBy(`set ${prop.name}(val:${this.convertType(prop.type)});`, 1))
        } else {
            const defaultValue = getDefaultValue(decl, prop, this.peerLibrary.language)
            const initExpr = defaultValue ? ` = ${defaultValue}` : ""
            result.push(indentedBy(`${staticMod}${readonlyMod}${this.printPropNameWithType(prop)}${initExpr};`, 1))
        }
        if (extraMethod && extraMethod.length > 0) {
            if (idl.isReferenceType(prop.type)) {
                const decl = this.peerLibrary.resolveTypeReference(prop.type) ?? throwException("Extra method can only be in")
                if (idl.isCallback(decl)) {
                    const args = decl.parameters.map(param => `${param.name}: ${this.convertType(param.type)}`).join(', ')
                    const method = indentedBy(`${extraMethod}(${args}): ${this.convertType(decl.returnType)}`, 1)
                    result = result.concat(method)
                }
            }
        }
        return result
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

    protected printTypeParameters(typeParameters: string[] | undefined, defaults: idl.IDLType[] | undefined): string {
        if (!typeParameters?.length)
            return ""
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        const defaultsPrinted = defaults?.map(it => nameConvertor.convert(it)) ?? []
        const addDefaultIfNeeded = (typeParameter: string, index: number): string => {
            const defaultValueIndex = index - (typeParameters.length - defaultsPrinted.length)
            const defaultValue = defaultValueIndex >= 0 ? defaultsPrinted[defaultValueIndex] : undefined
            if (defaultValue)
                return `${typeParameter} = ${defaultValue}`
            return typeParameter
        }
        return `<${typeParameters.map(addDefaultIfNeeded).join(",").replace("[]", "")}>`
    }

    protected printTypeArguments(typeArguments: string[] | undefined): string {
        return typeArguments?.length ? `<${typeArguments.join(",").replace("[]", "")}>` : ""
    }

    protected convertType(idlType: idl.IDLType): string {
        return this.writer.getNodeName(idlType)
    }

    private isMemo(node: idl.IDLEntry): boolean {
        if (idl.isCallback(node) && node.name == "CustomBuilder" && this.peerLibrary.language == Language.TS)
            return true
        return false
    }

    protected printAnnotations(node: idl.IDLNode): string {
        const annotations: string[] = []
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeAnnotations)) {
            const declaredAnnotations = idl.getExtAttribute(node, idl.IDLExtendedAttributes.TypeAnnotations)?.split(';') ?? []
            annotations.push(
                ...declaredAnnotations
            )
        }
        return this.peerLibrary.language === Language.ARKTS
            ? annotations.map(a => peerGeneratorConfiguration().transformAnnotations.get(a) ?? a).map(a => `@${a} `).join('')
            : ''
    }

    private printCallback(node: idl.IDLCallback | idl.IDLInterface,
        parameters: idl.IDLParameter[],
        returnType: idl.IDLType | undefined): stringOrNone[] {
        const maybeMemo = this.isMemo(node)
            ? this.peerLibrary.useMemoM3 ? `\n@memo\n` : `\n/** @memo */\n`
            : ``
        const paramsType = this.printParameters(parameters)
        const retType = this.convertType(returnType !== undefined ? returnType : idl.createPrimitiveType('void'))
        const typeParametersDefaults = idl.getExtAttributeTypesValue(node, idl.IDLExtendedAttributes.TypeParametersDefaults)
        return [`export type ${node.name}${this.printTypeParameters(node.typeParameters, typeParametersDefaults)} = ${this.printAnnotations(node)}${maybeMemo}(${paramsType}) => ${retType};`]
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
                        it.isOptional ? idl.createUnionType([...types, idl.createPrimitiveType('undefined')]) : it.type,
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
    convertConstant(node: idl.IDLConstant): void { }
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
        return idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary))
            || idl.isMethod(entry)
            || isInplacedGeneric(entry)
            || (idl.isTypedef(entry) || idl.isCallback(entry) || idl.isInterface(entry) && [idl.IDLInterfaceSubkind.Interface, idl.IDLInterfaceSubkind.Tuple].includes(entry.subkind)) && idl.isSyntheticEntry(entry)
    }

    protected getDeclConvertor(writer: LanguageWriter, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new TSDeclConvertor(writer, library, isDeclared)
    }

    printInterfaces(): PrinterResult[] {
        const entriesToPrint = new Map<string, idl.IDLEntry>()
        const registerEntry = (entry: idl.IDLEntry) => {
            if (this.shouldNotPrint(entry)) {
                return
            }
            const key = idl.getFQName(entry)
            if (!entriesToPrint.has(key)) {
                entriesToPrint.set(key, entry)
            }
        }
        const syntheticGenerator = new TSSyntheticGenerator(this.peerLibrary, (entry) => {
            registerEntry(entry)
        })
        for (const file of this.peerLibrary.files) {
            if (!isInCurrentModule(file))
                continue
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isImport(entry) ||
                    idl.isNamespace(entry) ||
                    idl.isInIdlize(entry) ||
                    this.peerLibrary.isHandwritten(entry) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language) ||
                    idl.isInterface(entry) && entry.subkind === idl.IDLInterfaceSubkind.Class && !this.printClasses
                )
                    continue
                syntheticGenerator.convert(entry)
                registerEntry(entry)
            }
        }

        const result: PrinterResult[] = []
        for (const entry of entriesToPrint.values()) {
            const generate = () => {
                const imports = new ImportsCollector()
                const writer = this.peerLibrary.createLanguageWriter(this.peerLibrary.language)

                getCommonImports(writer.language, { isDeclared: false, useMemoM3: this.peerLibrary.useMemoM3, libraryName: this.peerLibrary.name })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports)

                const printVisitor = this.getDeclConvertor(writer, this.peerLibrary, false)
                convertDeclaration(printVisitor, entry)
                return { content: writer, imports}
            }

            result.push({
                generate,
                over: {
                    node: entry,
                    role: LayoutNodeRole.INTERFACE
                }
            })
        }
        return result
    }
}

export class ArkTSDeclConvertor extends TSDeclConvertor {
    protected printMethod(method: idl.IDLMethod): stringOrNone[] {
        const staticPrefix = method.isStatic ? "static " : ""
        const annotations = this.printAnnotations(method)
        const typeParametersDefaults = idl.getExtAttributeTypesValue(method, idl.IDLExtendedAttributes.TypeParametersDefaults)
        return [
            ...this.printExtendedAttributes(method),
            annotations ? indentedBy(annotations, 1) : undefined,
            indentedBy(`${this.printAnnotations(method)}${staticPrefix}${method.name}${this.printTypeParameters(method.typeParameters, typeParametersDefaults)}(${this.printParameters(method.parameters)}): ${this.convertType(method.returnType)}`, 1)
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
        protected readonly isDeclarationFile: boolean,
        protected readonly printClasses: boolean,
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
        return idl.isInterface(entry) && !this.isDeclarationFile && (isMaterialized(entry, this.peerLibrary))
            || idl.isMethod(entry)
            || isInplacedGeneric(entry)
            || isModifier(entry, this.peerLibrary)
            || ((idl.isTypedef(entry)
                || idl.isCallback(entry)
                || idl.isInterface(entry)
                    && [idl.IDLInterfaceSubkind.Interface, idl.IDLInterfaceSubkind.Tuple].includes(entry.subkind))
                && idl.isSyntheticEntry(entry))
    }

    protected getDeclConvertor(writer: LanguageWriter, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new ArkTSDeclConvertor(writer, library, isDeclared)
    }

    printInterfaces(): PrinterResult[] {
        const entriesToPrint = new Map<string, idl.IDLEntry>()
        const registerEntry = (entry: idl.IDLEntry) => {
            if (this.shouldNotPrint(entry)) {
                return
            }
            const key = idl.getFQName(entry)
            if (!entriesToPrint.has(key)) {
                entriesToPrint.set(key, entry)
            }
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
                    idl.isInIdlize(entry) ||
                    this.peerLibrary.isHandwritten(entry) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language) ||
                    idl.isInterface(entry) && entry.subkind === idl.IDLInterfaceSubkind.Class && !this.printClasses ||
                    idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ComponentModifier) && !this.isDeclarationFile
                )
                    continue
                syntheticGenerator.convert(entry)
                registerEntry(entry)
            }
        }

        const result: PrinterResult[] = []
        for (const entry of entriesToPrint.values()) {
            if (idl.isImport(entry)) {
                continue
            }
            const generate = () => {
                const imports = new ImportsCollector()
                const writer = this.peerLibrary.createLanguageWriter()

                getCommonImports(writer.language, { isDeclared: this.isDeclarationFile, useMemoM3: this.peerLibrary.useMemoM3, libraryName: this.peerLibrary.name })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports)

                const typeConvertor = this.getDeclConvertor(writer, this.peerLibrary, this.isDeclarationFile)
                convertDeclaration(typeConvertor, entry)
                return { content: writer, imports }
            }

            result.push({
                generate,
                over: {
                    node: entry,
                    role: LayoutNodeRole.INTERFACE,
                    hint: idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ComponentModifier)
                        ? 'component.modifier'
                        : undefined
                }
            })
        }
        return result
    }
}

export class CJInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
        return idl.isInterface(entry) && (isMaterialized(entry, this.peerLibrary))
            || idl.isMethod(entry)
    }

    printInterfaces(): PrinterResult[] {
        const moduleToEntries = new Map<string, idl.IDLEntry[]>()
        const moduleToTypes = new Map<string, idl.IDLUnionType[]>()

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

        const registerUnion = (entry: idl.IDLUnionType) => {
            const module = './SyntheticModule'
            if (!moduleToTypes.has(module))
                moduleToTypes.set(module, [])
            if (moduleToTypes.get(module)!.some(it => it.name == entry.name))
                return
            moduleToTypes.get(module)!.push(entry)
        }

        const syntheticGenerator = new CJSyntheticGenerator(this.peerLibrary, (entry) => {
            registerEntry(entry)
        }, (union) => { registerUnion(union) })
        for (const file of this.peerLibrary.files) {
            for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
                if (idl.isImport(entry) ||
                    idl.isNamespace(entry) ||
                    idl.isInIdlize(entry) ||
                    this.peerLibrary.isHandwritten(entry) ||
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
                const generate = () => {
                    const imports = new ImportsCollector()
                    const writer = this.peerLibrary.createLanguageWriter(this.peerLibrary.language)

                    collectDeclDependencies(this.peerLibrary, entry, imports)

                    const printVisitor = new CJDeclarationConvertor(writer, seenNames, this.peerLibrary)
                    convertDeclaration(printVisitor, entry)
                    return { content: writer, imports }
                }

                result.push({
                    generate,
                    over: {
                        node: entry,
                        role: LayoutNodeRole.INTERFACE
                    }
                })
            }
        }
        for (const entries of moduleToTypes.values()) {
            const nameConvertor = this.peerLibrary.createTypeNameConvertor(Language.CJ)
            const seenNames = new Set<string>()
            for (const entry of entries) {
                const generate = () => {
                    const imports = new ImportsCollector()
                    const writer = this.peerLibrary.createLanguageWriter(this.peerLibrary.language)

                    collectDeclDependencies(this.peerLibrary, entry, imports)

                    const printVisitor = new CJDeclarationConvertor(writer, seenNames, this.peerLibrary)
                    printVisitor.makeUnion(writer, entry)
                    return { content: writer, imports}
                }

                result.push({
                    generate,
                    over: {
                        node: idl.createTypedef(nameConvertor.convert(entry), entry),
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
        private readonly onSyntheticUnionDeclaration: (entry: idl.IDLUnionType) => void
    ) {
        super(library)
    }

    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        this.onSyntheticUnionDeclaration(type)
        return super.convertUnion(type)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) this.onSyntheticDeclaration(decl)
        return super.convertTypeReferenceAsImport(type, importClause)
    }
}

class CJDeclarationConvertor implements DeclarationConvertor<void> {
    static seenSynteticUnions: Set<String> = new Set<String>()

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
        // reexport
        if (idl.isReferenceType(node.type) && this.peerLibrary.resolveTypeReference(node.type)?.name == node.name) {
            return
        }
        const type = this.writer.getNodeName(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        this.writer.print(`public type ${node.name}${typeParams} = ${type}`)
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
        const retType = this.convertType(returnType !== undefined ? returnType : idl.createPrimitiveType('void'))
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
    protected convertType(idlType: idl.IDLType): string {
        return this.writer.getNodeName(idlType)
    }
    makeUnion(writer: LanguageWriter, type: idl.IDLUnionType): void {
        const name = this.writer.getNodeName(type)
        if (CJDeclarationConvertor.seenSynteticUnions.has(name)) {
            console.log(`union name: '${type.name}' already exists`)
            return;
        }
        CJDeclarationConvertor.seenSynteticUnions.add(name)
        
        const members = type.types.map(it => it)
        writer.writeClass(name, () => {
            const intType = idl.createPrimitiveType('i32')
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
                    new NamedMethodSignature(idl.createPrimitiveType('void'), [memberType], [param]),
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
        const members = type.properties.map(it => idl.maybeOptional(it.type, it.isOptional))
        const memberNames: string[] = members.map((_, index) => `value${index}`)
        const typeParams = type.typeParameters && type.typeParameters?.length != 0 ? `<${type.typeParameters.map(it => it.split('extends')[0].split('=')[0]).join(', ')}>` : ''
        writer.writeClass(type.name.concat(typeParams), () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], members[i], [FieldModifier.PUBLIC], idl.isOptionalType(members[i]) ?? false)
            }

            const signature = new MethodSignature(idl.createPrimitiveType('void'), members)
            writer.writeConstructorImplementation(type.name, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], members[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        })
    }

    extractTypeParameters(type: idl.IDLInterface): string[] | undefined {
        if (isComponentDeclaration(this.peerLibrary, type))
            return undefined

        return type.typeParameters?.map(it => {
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
    }
    printTypeParameters(typeParameters: string[] | undefined): string {
        return typeParameters?.length ? `<${typeParameters.join(",").replace("[]", "")}>` : ""
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

        const typeParameters = this.extractTypeParameters(type)
        let typeParams = this.printTypeParameters(typeParameters)

        let inheritancePart: string[] | undefined
        if (superNames && superNames.length > 0) {
            inheritancePart = []
            for (let iface of superNames) {
                let resolvedIface = this.peerLibrary.resolveTypeReference(iface)
                if (resolvedIface!! && idl.isInterface(resolvedIface)) {
                    inheritancePart.push(`${removePoints(idl.getNamespaceName(resolvedIface))}${resolvedIface.name}Interfaces${this.printTypeParameters(this.extractTypeParameters(resolvedIface))}`)
                }
            }
        }

        writer.writeInterface(`${FQInterfaceName}${isMaterialized(type, this.peerLibrary) ? '' : 'Interfaces'}${typeParams}`, (writer) => {
            for (const p of ownProperties) {
                const modifiers: FieldModifier[] = []
                if (p.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (p.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(p.name, idl.maybeOptional(p.type, p.isOptional), modifiers)
            }
        }, inheritancePart)

        writer.writeClass(`${FQInterfaceName}${typeParams}`, () => {
            ownProperties.concat(parentProperties).forEach(it => {
                let modifiers: FieldModifier[] = []
                if (it.isReadonly) modifiers.push(FieldModifier.READONLY)
                if (it.isStatic) modifiers.push(FieldModifier.STATIC)
                writer.writeProperty(it.name, idl.maybeOptional(it.type, it.isOptional), modifiers, { method: new Method(it.name, new NamedMethodSignature(it.type, [it.type], [it.name])) })
            })
            writer.writeConstructorImplementation(`${FQInterfaceName}`,
                new NamedMethodSignature(idl.createPrimitiveType('void'),
                    ownProperties.concat(parentProperties).map(it => idl.maybeOptional(it.type, it.isOptional)),
                    ownProperties.concat(parentProperties).map(it => writer.escapeKeyword(it.name))), () => {
                        for (let i of ownProperties.concat(parentProperties)) {
                            writer.print(`this.${i.name}_container = ${writer.escapeKeyword(i.name)}`)
                        }
                    })
        }, undefined, [`${FQInterfaceName}Interfaces${typeParams}`])
    }
}

const defaultWeight = 10
const entryMapping = new Map<idl.IDLKind, number>([
    [idl.IDLKind.Namespace, 0],
    [idl.IDLKind.Const, 20],
    [idl.IDLKind.Method, 30],
])

function compareIDLEntries(a: idl.IDLEntry, b: idl.IDLEntry): number {
    const aWeight = entryMapping.get(a.kind) ?? defaultWeight
    const bWeight = entryMapping.get(b.kind) ?? defaultWeight
    return aWeight - bWeight
}

function linearizeAndSortNamespaceMembers(entries: idl.IDLEntry[], sortTopLevel: boolean = false) {
    const linearized: idl.IDLEntry[] = []
    let sortedEntries = entries
    if (sortTopLevel) {
        sortedEntries = [...entries].sort(compareIDLEntries)
    }
    for (const entry of sortedEntries) {
        linearized.push(entry)
        if (idl.isNamespace(entry))
            linearized.push(...linearizeAndSortNamespaceMembers(entry.members, true))
    }
    return linearized
}

export class KotlinInterfacesVisitor implements InterfacesVisitor {
    constructor(
        protected readonly peerLibrary: PeerLibrary,
        protected readonly printClasses: boolean,
    ) { }

    private shouldNotPrint(entry: idl.IDLEntry): boolean {
        return idl.isInterface(entry) && isMaterialized(entry, this.peerLibrary)
            || idl.isMethod(entry)
            || isInplacedGeneric(entry)
            || isModifier(entry, this.peerLibrary)
            || (idl.isTypedef(entry)|| idl.isCallback(entry) || idl.isInterface(entry) && [idl.IDLInterfaceSubkind.Interface, idl.IDLInterfaceSubkind.Tuple].includes(entry.subkind)) && idl.isSyntheticEntry(entry)
            || idl.isInterface(entry) && entry.subkind === idl.IDLInterfaceSubkind.Class && !this.printClasses
    }

    protected getDeclConvertor(writer: LanguageWriter, library: PeerLibrary): KotlinDeclarationConvertor {
        return new KotlinDeclarationConvertor(writer, library)
    }

    printInterfaces(): PrinterResult[] {
        const entriesToPrint = new Map<string, idl.IDLEntry>()
        const syntheticEntriesToPrint = new Map<string, idl.IDLUnionType | idl.IDLInterface>()

        const registerEntry = (entry: idl.IDLEntry) => {
            if (this.shouldNotPrint(entry)) {
                return
            }
            const key = idl.getFQName(entry)
            if (!entriesToPrint.has(key)) {
                entriesToPrint.set(key, entry)
            }
        }
        const registerSyntheticEntry = (entry: idl.IDLUnionType | idl.IDLInterface) => {
            const key = entry.name
            if (!syntheticEntriesToPrint.has(key)) {
                syntheticEntriesToPrint.set(key, entry)
            }
            if (idl.isUnionType(entry)) {
                const flattened = flattenUnionType(this.peerLibrary, entry)
                if (idl.isUnionType(flattened) && !syntheticEntriesToPrint.has(flattened.name)) {
                   syntheticEntriesToPrint.set(flattened.name, flattened)
                }
            }
        }

        const syntheticGenerator = new KotlinSyntheticGenerator(this.peerLibrary, registerEntry, registerSyntheticEntry)
        for (const file of this.peerLibrary.files) {
            if (!isInCurrentModule(file))
                continue
            for (const entry of linearizeAndSortNamespaceMembers(file.entries)) {
                if (idl.isNamespace(entry) ||
                    idl.isImport(entry) ||
                    idl.isInIdlize(entry) ||
                    this.peerLibrary.isHandwritten(entry) ||
                    peerGeneratorConfiguration().ignoreEntry(entry.name, this.peerLibrary.language)
                ) {
                    continue
                }
                syntheticGenerator.convert(entry)
                registerEntry(entry)
            }
        }

        const result: PrinterResult[] = []
        for (const entry of entriesToPrint.values()) {
            const generate = () => {
                const imports = new ImportsCollector()
                const writer = this.peerLibrary.createLanguageWriter(this.peerLibrary.language)

                collectDeclDependencies(this.peerLibrary, entry, imports)

                const printVisitor = this.getDeclConvertor(writer, this.peerLibrary)
                convertDeclaration(printVisitor, entry)
                return { content: writer, imports }
            }

            result.push({
                generate,
                over: {
                    node: entry,
                    role: LayoutNodeRole.INTERFACE,
                    hint: idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.ComponentModifier)
                        ? 'component.modifier'
                        : undefined
                }
            })
        }

        const collector = new KotlinDependenciesCollector(this.peerLibrary)
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(Language.KOTLIN)
        const printedSynthetics = new Set<string>()
        for (const entry of syntheticEntriesToPrint.values()) {
            let file: idl.IDLFile
            let resultEntry: idl.IDLEntry
            const packageName = getSyntheticTypesFileName()
            if (idl.isUnionType(entry)) {
                const unionTypedef = idl.createTypedef(nameConvertor.convert(entry), entry)
                file = idl.createFile([unionTypedef], packageName, [packageName])
                resultEntry = unionTypedef
            }
            else {
                file = idl.createFile([entry], packageName, [packageName])
                resultEntry = entry
            }
            idl.linkParentBack(file)

            const generate = () => {
                const imports = new ImportsCollector()
                const writer = this.peerLibrary.createLanguageWriter(this.peerLibrary.language)

                const declName = writer.getNodeName(entry)
                if (printedSynthetics.has(declName)) {
                    return { content: writer, imports }
                }
                printedSynthetics.add(declName)

                getCommonImports(writer.language, { isDeclared: false, useMemoM3: false, libraryName: this.peerLibrary.name })
                    .forEach(it => imports.addFeature(it.feature, it.module))
                collectDeclDependencies(this.peerLibrary, entry, imports, {}, collector)

                const printVisitor = this.getDeclConvertor(writer, this.peerLibrary)
                if (idl.isUnionType(entry)) {
                    printVisitor.makeUnion(writer, entry)
                }
                else {
                    convertDeclaration(printVisitor, entry)
                }

                return { content: writer, imports }
            }

            result.push({
                generate,
                over: {
                    node: resultEntry,
                    role: LayoutNodeRole.INTERFACE
                }
            })
        }
        return result
    }
}

class KotlinSyntheticGenerator extends DependenciesCollector {
    constructor(
        library: PeerLibrary,
        private readonly onImport: (entry: idl.IDLEntry) => void,
        private readonly onSyntheticEntry: (entry: idl.IDLUnionType | idl.IDLInterface) => void,
    ) {
        super(library)
    }

    convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
        if (decl.subkind === idl.IDLInterfaceSubkind.Tuple && idl.isSyntheticEntry(decl)) {
            this.onSyntheticEntry(decl)
        }
        return super.convertInterface(decl)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        this.onSyntheticEntry(type)
        return super.convertUnion(type)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl) {
            this.onImport(decl)
        }
        return super.convertTypeReferenceAsImport(type, importClause)
    }
}

export class KotlinDeclarationConvertor implements DeclarationConvertor<void> {
    constructor(
        protected readonly writer: LanguageWriter,
        readonly peerLibrary: PeerLibrary
    ) { }

    convertTypedef(node: idl.IDLTypedef) {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic)) {
            return
        }
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Import)) {
            return
        }
        const type = this.convertType(node.type)
        const typeParams = this.printTypeParameters(node.typeParameters)
        this.writer.print(`public typealias ${node.name}${typeParams} = ${type}`)
    }

    convertCallback(node: idl.IDLCallback): void {
        if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic)) {
            return
        }
        this.writer.writeLines(this.printCallback(node, node.parameters, node.returnType))
    }

    convertInterface(node: idl.IDLInterface): void {
        if (['RuntimeType', 'CallbackResource', 'Materialized', 'VMContext'].includes(node.name)) {
            return
        }
        if (this.isCallback(node)) {
            const callable = node.callables[0]
            const result = this.printCallback(node, callable.parameters, callable.returnType)
            this.writer.writeLines(result)
        }
        else if (node.subkind === idl.IDLInterfaceSubkind.Tuple) {
            this.makeTuple(this.writer, node)
        }
        else if (isMaterialized(node, this.peerLibrary)) {
            // no need to print separate declarations for materialized classes
            return
        }
        else {
            const result = this.printInterface(node)
            this.writer.writeLines(result)
        }
    }

    makeUnion(writer: LanguageWriter, type: idl.IDLUnionType): void {
        const name = this.convertType(type)
        const members = type.types.map(it => it)
        const selector = 'selector'
        const intType = idl.createPrimitiveType('i32')

        writer.writeLines(`class ${name} private constructor(private val ${selector}: ${writer.getNodeName(intType)}) {`)
        writer.pushIndent()

        writer.writeStaticEntitiesBlock(() => {
            for (const [index, memberType] of members.entries()) {
                const memberName = `value${index}`
                const param = "param"

                writer.writeLines(`fun create${index}(${param}: ${writer.getNodeName(memberType)}): ${name} {`)
                writer.pushIndent()

                const obj = "unionObject"
                writer.writeStatement(
                    writer.makeAssign(obj, undefined, writer.makeNewObject(name, [writer.makeString(`${index}`)]), true)
                )
                writer.writeStatement(
                    writer.makeAssign(`${obj}.${memberName}`, undefined, writer.makeString(param), false)
                )
                writer.writeStatement(
                    writer.makeReturn(writer.makeString(obj))
                )

                writer.popIndent()
                writer.writeLines(`}`)
            }
        })

        writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(intType, []), [MethodModifier.PUBLIC]), () => {
            writer.writeStatement(
                writer.makeReturn(
                    writer.makeString(selector)
                )
            )
        })

        for (const [index, memberType] of members.entries()) {
            const memberName = `value${index}`
            writer.writeFieldDeclaration(memberName, idl.maybeOptional(memberType, true), [FieldModifier.PRIVATE], true, writer.makeNull())

            writer.writeMethodImplementation(
                new Method(`getValue${index}`, new MethodSignature(memberType, []), [MethodModifier.PUBLIC]),
                () => {
                    writer.print(`return requireNotNull(${memberName})`)
                }
            )
        }

        writer.popIndent()
        writer.writeLines("}")
    }

    private convertInheritance(type: idl.IDLReferenceType): string {
        return ""
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
        const seenFields = new Set<string>()
        const kindPrefix = idl.isClassSubkind(idlInterface) ? "open class " : "interface "

        const superPropNames = new Set(getAllSuperProps(idlInterface, this.peerLibrary).filter(it => !it.isStatic).map(it => it.name))
        const nonStaticProps = idlInterface.properties
            .filter(it => !it.isStatic)
            .map(it => this.printIfNotSeen(it, it => this.printProperty(idlInterface, it, superPropNames), seenFields)).flat()
        const staticProps = idlInterface.properties
            .filter(it => it.isStatic)
            .map(it => this.printIfNotSeen(it, it => this.printProperty(idlInterface, it), seenFields)).flat()

        // also need to print methods where there is TS/ArkTS implementation
        return ([`${kindPrefix}${this.printInterfaceName(idlInterface)} {`] as stringOrNone[])
            .concat(nonStaticProps)
            .concat(staticProps.length > 0 ? [
                "companion object {",
                ...staticProps,
                "}",
            ].map(it => it ? indentedBy(it, 1) : it) : [])
            .concat(["}"])
    }

    protected printInterfaceName(idlInterface: idl.IDLInterface): string {
        const extendsItems: string[] = []
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        idlInterface.inheritance?.forEach(it => {
            const superDecl = this.peerLibrary.resolveTypeReference(it)
            if (!superDecl || !idl.isInterface(superDecl)) {
                throw new Error(`Unexpected ancestor '${superDecl?.name}' in declaration '${idlInterface.name}'`)
            }
            const clause = nameConvertor.convert(it)
            if (idl.isClassSubkind(superDecl)) {
                extendsItems.push(`${clause}()`)
            }
            else {
                extendsItems.push(clause)
            }
        })
        const extendsClause = extendsItems.length ? `: ${extendsItems.join(", ")}` : ``
        return [
            idlInterface.name,
            this.printTypeParameters(idlInterface.typeParameters),
            extendsClause,
        ].join("")
    }

    private printExtendedAttributes(idl: idl.IDLEntry): stringOrNone[] {
        return []
    }

    private printProperty(decl: idl.IDLInterface, prop: idl.IDLProperty, superProps?: Set<string>): stringOrNone[] {
        const open = idl.isClassSubkind(decl) && !prop.isStatic ? "open " : ""
        const override = superProps?.has(prop.name) ? "override " : ""
        const kind = prop.isReadonly ? "val " : "var "
        let result = [
            ...this.printExtendedAttributes(prop),
        ]
        const defaultValue = getDefaultValue(decl, prop, this.peerLibrary.language)
        const initExpr = defaultValue ? ` = ${defaultValue}` : ""
        result.push(indentedBy(`${open}${override}${kind}${prop.name}: ${this.printPropertyType(prop)}${initExpr}`, 1))
        return result
    }

    private printPropertyType(prop: idl.IDLProperty): string {
        const flattenUnions = true
        const type = this.convertType(prop.type, flattenUnions)
        const optionalMark = prop.isOptional && !type.endsWith("?") ? "?" : ""
        return `${type}${optionalMark}`
    }

    private printParameters(parameters: idl.IDLParameter[]): string {
        return parameters
            ?.map(it => this.printNameWithTypeIDLParameter(it, it.isVariadic, it.isOptional))
            ?.join(", ") ?? ""
    }

    private printNameWithTypeIDLParameter(
        variable: idl.IDLVariable,
        isVariadic: boolean = false,
        isOptional: boolean = false
    ): string {
        const type = variable.type ? this.convertType(variable.type) : ""
        return `${this.writer.escapeKeyword(idl.escapeIDLKeyword(variable.name!))}: ${type}${isOptional ? "?" : ""}`
    }

    private printTypeParameters(typeParameters: string[] | undefined): string {
        return typeParameters?.length ? `<${typeParameters.join(",").replace("[]", "")}>` : ""
    }

    private convertType(idlType: idl.IDLType, flattenUnions?: boolean): string {
        if (flattenUnions && idl.isUnionType(idlType)) {
            idlType = flattenUnionType(this.peerLibrary, idlType)
        }
        return this.writer.getNodeName(idlType)
    }

    private printCallback(node: idl.IDLCallback | idl.IDLInterface,
        parameters: idl.IDLParameter[],
        returnType: idl.IDLType | undefined
    ): stringOrNone[] {
        const paramsType = this.printParameters(parameters)
        const retType = this.convertType(returnType !== undefined ? returnType : idl.createPrimitiveType('void'))
        return [`public typealias ${node.name}${this.printTypeParameters(node.typeParameters)} = (${paramsType}) -> ${retType}`]
    }

    private isCallback(node: idl.IDLInterface) {
        return node.callables.length === 1
            && [node.constants,
            node.properties,
            node.methods]
                .reduce((sum, value) => value.length + sum, 0) === 0
    }

    private makeTuple(writer: LanguageWriter, type: idl.IDLInterface): void {
        const members = type.properties.map(it => idl.maybeOptional(it.type, it.isOptional))
        const params = members.map((arg, index) => `var value${index}: ${this.convertType(arg)}`).join(', ')
        writer.print(`data class ${type.name}(${params})`)
    }

    convertMethod(node: idl.IDLMethod): void {
        this.writer.writeMethodDeclaration(node.name, this.writer.makeSignature(node.returnType, node.parameters), node.isFree ? [MethodModifier.FREE] : [])
    }

    convertConstant(node: idl.IDLConstant): void {}

    convertEnum(node: idl.IDLEnum): void {
        this.writer.writeStatement(this.writer.makeEnumEntity(node, { isExport: true, isDeclare: false }))
    }

    convertImport(node: idl.IDLImport): void {
        console.warn("Imports are not implemented yet")
    }

    convertNamespace(node: idl.IDLNamespace): void {
        throw new Error("Not used!")
    }
}


function getVisitor(peerLibrary: PeerLibrary, isDeclarations: boolean, printClasses: boolean): InterfacesVisitor {
    if (peerLibrary.language == Language.TS) {
        return new TSInterfacesVisitor(peerLibrary, printClasses)
    }
    if (peerLibrary.language == Language.ARKTS) {
        return new ArkTSInterfacesVisitor(peerLibrary, isDeclarations, printClasses)
    }
    if (peerLibrary.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.KOTLIN) {
        return new KotlinInterfacesVisitor(peerLibrary, printClasses)
    }
    throw new Error(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function createInterfacePrinter(isDeclarations: boolean, printClasses: boolean): PrinterFunction {
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
//                 if (idl.isInterface(entry) && (isMaterialized(entry, library)))
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
        }
        if (options.useMemoM3 && language === Language.ARKTS) {
            imports.push(
                { feature: "memo", module: "^arkui.incremental.annotation" },
                { feature: "memo_stable", module: "^arkui.incremental.annotation" },
                { feature: "ComponentBuilder", module: "@koalaui/builderLambda" },
                { feature: "Builder", module: "@koalaui/builderLambda" },
            )
        }
    }
    if (language === Language.KOTLIN) {
        imports.push({ feature: "KInt", module: "koalaui.interop" })
        imports.push({ feature: "KPointer", module: "koalaui.interop" })
        imports.push({ feature: "KBoolean", module: "koalaui.interop" })
        imports.push({ feature: "NativeBuffer", module: "koalaui.interop" })
        imports.push({ feature: "KStringPtr", module: "koalaui.interop" })
        imports.push({ feature: "Promise", module: "koalaui.interop" })
        imports.push({ feature: "Instant", module: "kotlin.time" })
    }
    return imports
}

function getDefaultValue(decl: idl.IDLInterface, prop: idl.IDLProperty, lang: Language): string | undefined {
    if (!idl.isClassSubkind(decl)) return undefined
    if (prop.isOptional || idl.isOptionalType(prop.type)) {
        if (lang === Language.KOTLIN) {
            return "null"
        }
        return undefined
    }
    return getInitializerDefaultValue(prop, lang);
}
