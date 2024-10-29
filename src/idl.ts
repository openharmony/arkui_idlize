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

import * as webidl2 from "webidl2"
import { indentedBy, isDefined, stringOrNone, throwException } from "./util";
import { NodeArray, TypeNode } from "typescript";

export enum IDLKind {
    Interface,
    Class,
    Package,
    Import,
    AnonymousInterface,
    Callback,
    Const,
    Property,
    Parameter,
    Method,
    Callable,
    Constructor,
    Enum,
    EnumMember,
    Typedef,
    TupleInterface,
    PrimitiveType,
    ContainerType,
    ReferenceType,
    EnumType,
    UnionType,
    TypeParameterType,
    ModuleType,
    OptionalType,
}

export enum IDLEntity {
    Class = "Class",
    Interface = "Interface",
    Package = "Package",
    Import = "Import",
    Intersection = "Intersection",
    Literal = "Literal",
    NamedTuple = "NamedTuple",
    Tuple = "Tuple"
}

export enum IDLExtendedAttributes {
    CallSignature = "CallSignature",
    CommonMethod = "CommonMethod",
    Component = "Component",
    ComponentInterface = "ComponentInterface",
    Documentation = "Documentation",
    DtsName = "DtsName",
    Entity = "Entity",
    Import = "Import",
    IndexSignature = "IndexSignature",
    Optional = "Optional",
    TypeArguments = "TypeArguments",
    TypeParameters = "TypeParameters",
    ParentTypeArguments = "ParentTypeArguments",
    InterfaceTypeArguments = "InterfaceTypeArguments",
    VerbatimDts = "VerbatimDts",
    Export = "Export",
    Accessor = "Accessor",
    Protected = "Protected",
    Synthetic = "Synthetic",
    Interfaces = "Interfaces",
    GlobalScope = "GlobalScope",
    Namespace = "Namespace",
    Deprecated = "Deprecated",
    NativeModule = "NativeModule",
    Async = "Async",
}

export enum IDLAccessorAttribute {
    Getter = "Getter",
    Setter = "Setter",
}

export interface IDLExtendedAttribute {
    name: string
    value?: string
}

export interface IDLEntry {
    name?: string
    kind?: IDLKind
    fileName?: string
    comment?: string
    documentation?: string
    extendedAttributes?: IDLExtendedAttribute[]
    scope?: IDLEntry[]
}

// compile-time garantee that no one can create IDLType outside this file
const idlTypeName = Symbol("idlTypeName")
export interface IDLType {
    kind: IDLKind
    fileName?: string
    extendedAttributes?: IDLExtendedAttribute[]
    documentation?: string
    optional?: boolean

    [idlTypeName]: string
}

export const IDLTopType: IDLType = {
    [idlTypeName]: "__Top__", 
    kind: IDLKind.Interface 
}

export interface IDLTypedef extends IDLEntry {
    kind: IDLKind.Typedef
    name: string
    type: IDLType
}

// compile-time garantee that no one can create IDLPrimitiveType outside this file
const primitiveTypeAnchor = Symbol("primitiveTypeAnchor")
export interface IDLPrimitiveType extends IDLType {
    kind: IDLKind.PrimitiveType
    [primitiveTypeAnchor]: true
}

export interface IDLOptionalType extends IDLType {
    optional: true
    element: IDLType
}

export type IDLContainerKind = 
      'sequence'
    | 'record'
    | 'Promise'

export interface IDLContainerType extends IDLType {
    kind: IDLKind.ContainerType
    elementType: IDLType[]
    [idlTypeName]: IDLContainerKind
}

export interface IDLReferenceType extends IDLType {
    kind: IDLKind.ReferenceType
}

export interface IDLEnumType extends IDLType {
    kind: IDLKind.EnumType
}

export interface IDLUnionType extends IDLType {
    kind: IDLKind.UnionType
    types: IDLType[]
}

export interface IDLTypeParameterType extends IDLType {
    kind: IDLKind.TypeParameterType
}

export interface IDLModuleType extends IDLType {
    kind: IDLKind.ModuleType
}

export interface IDLVariable extends IDLEntry {
    type?: IDLType;
}

export interface IDLTypedEntry extends IDLEntry {
    type?: IDLType;
}

export interface IDLEnum extends IDLEntry {
    kind: IDLKind.Enum
    name: string
    elements: IDLEnumMember[]
}

export interface IDLEnumMember extends IDLEntry {
    kind: IDLKind.EnumMember
    name: string
    parent: IDLEnum
    type: IDLPrimitiveType
    initializer: number | string | undefined
}

export interface IDLConstant extends IDLTypedEntry {
    name: string
    kind: IDLKind.Const
    type: IDLType
    value: string
}

export interface IDLProperty extends IDLTypedEntry {
    name: string
    kind: IDLKind.Property
    type: IDLType
    isReadonly: boolean
    isStatic: boolean
    isOptional: boolean
}

export interface IDLParameter extends IDLTypedEntry {
    kind: IDLKind.Parameter
    name: string
    isVariadic: boolean
    isOptional: boolean
}

export interface IDLSignature extends IDLEntry {
    parameters: IDLParameter[]
    returnType?: IDLType
}

export interface IDLFunction extends IDLSignature {
}

export interface IDLMethod extends IDLFunction {
    kind: IDLKind.Method
    name: string
    returnType: IDLType
    isStatic: boolean
    isOptional: boolean
}

export interface IDLCallable extends IDLFunction {
    kind: IDLKind.Callable
    isStatic: boolean
}

export interface IDLConstructor extends IDLSignature {
    kind: IDLKind.Constructor
}

export interface IDLInterface extends IDLEntry {
    name: string
    kind: IDLKind.Interface | IDLKind.Class | IDLKind.AnonymousInterface | IDLKind.TupleInterface
    inheritance: IDLType[]
    constructors: IDLConstructor[]
    constants: IDLConstant[]
    properties: IDLProperty[]
    methods: IDLMethod[]
    callables: IDLCallable[]
}

export interface IDLPackage extends IDLEntry {
    name: string
}

export interface IDLImport extends IDLEntry {
    name: string
}

export interface IDLCallback extends IDLEntry, IDLSignature {
    kind: IDLKind.Callback
    name: string
    returnType: IDLType
}

export function forEachChild(node: IDLEntry, cb: (entry: IDLEntry) => void): void {
    cb(node)
    switch (node.kind) {
        case IDLKind.Interface:
        case IDLKind.Class:
        case IDLKind.TupleInterface:
        case IDLKind.AnonymousInterface: {
            let iface = node as IDLInterface
            iface.inheritance.forEach((value) => forEachChild(value, cb))
            iface.constructors?.forEach((value) => forEachChild(value, cb))
            iface.properties.forEach((value) => forEachChild(value, cb))
            iface.methods.forEach((value) => forEachChild(value, cb))
            iface.callables.forEach((value) => forEachChild(value, cb))
            iface.scope?.forEach((value) => forEachChild(value, cb))
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            let param = node as IDLSignature
            param.parameters?.forEach((value) => forEachChild(value, cb))
            if (param.returnType) forEachChild(param.returnType, cb)
            break
        }
        case IDLKind.UnionType: {
            let param = node as IDLUnionType
            param.types?.forEach((value) => forEachChild(value, cb))
            break
        }
        case IDLKind.Enum: {
            break
        }
        case IDLKind.Property:
        case IDLKind.Parameter:
        case IDLKind.Typedef:
        case IDLKind.EnumType:
        case IDLKind.PrimitiveType:
        case IDLKind.ContainerType:
        case IDLKind.TypeParameterType:
        case IDLKind.ReferenceType: {
            break
        }
        case IDLKind.ModuleType: {
            break
        }
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }
}

export function isNullType(type: IDLEntry): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type[idlTypeName] === "null_"
}
export function isUndefinedType(type: IDLEntry): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type[idlTypeName] === "undefined"
}
export function isVoidType(type: IDLEntry): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type[idlTypeName] === IDLVoidType[idlTypeName]
}
export function isPrimitiveType(type: IDLEntry): type is IDLPrimitiveType {
    return type.kind == IDLKind.PrimitiveType
}
export function isContainerType(type: IDLEntry): type is IDLContainerType {
    return type.kind == IDLKind.ContainerType
}
export function isReferenceType(type: IDLEntry): type is IDLReferenceType {
    return type.kind == IDLKind.ReferenceType
}
export function isEnumType(type: IDLEntry): type is IDLEnumType {
    return type.kind == IDLKind.EnumType
}
export function isEnum(type: IDLEntry): type is IDLEnum {
    return type.kind == IDLKind.Enum
}
export function isEnumMember(type: IDLEntry): type is IDLEnumMember {
    return type.kind == IDLKind.EnumMember
}
export function isUnionType(type: IDLEntry): type is IDLUnionType {
    return type.kind == IDLKind.UnionType
}
export function isTypeParameterType(type: IDLEntry): type is IDLTypeParameterType {
    return type.kind == IDLKind.TypeParameterType
}
export function isInterface(node: IDLEntry): node is IDLInterface {
    return node.kind === IDLKind.Interface
}
export function isPackage(type: IDLEntry): type is IDLPackage {
    return type.kind == IDLKind.Package
}
export function isImport(type: IDLEntry): type is IDLImport {
    return type.kind == IDLKind.Import
}
export function isAnonymousInterface(node: IDLEntry): node is IDLInterface {
    return node.kind === IDLKind.AnonymousInterface
}
export function isTupleInterface(node: IDLEntry): node is IDLInterface {
    return node.kind === IDLKind.TupleInterface
}
export function isClass(node: IDLEntry): node is IDLInterface {
    return node.kind === IDLKind.Class
}
export function isCallable(node: IDLEntry): node is IDLCallable {
    return node.kind === IDLKind.Callable
}
export function isMethod(node: IDLEntry): node is IDLMethod {
    return node.kind === IDLKind.Method
}
export function isConstructor(node: IDLEntry): node is IDLConstructor {
    return node.kind === IDLKind.Constructor
}
export function isProperty(node: IDLEntry): node is IDLProperty {
    return node.kind === IDLKind.Property
}
export function isCallback(node: IDLEntry): node is IDLCallback {
    return node.kind === IDLKind.Callback
}
export function isConstant(node: IDLEntry): node is IDLConstant {
    return node.kind === IDLKind.Const
}
export function isTypedef(node: IDLEntry): node is IDLTypedef {
    return node.kind === IDLKind.Typedef
}
export function isType(node: IDLEntry): node is IDLType {
    return idlTypeName in node
}

export function isModuleType(node: IDLEntry): node is IDLModuleType {
    return node.kind === IDLKind.ModuleType
}
export function isSyntheticEntry(node: IDLEntry): boolean {
    return isDefined(node.extendedAttributes?.find(it => it.name === IDLExtendedAttributes.Synthetic))
}

export function isOptionalType(type: IDLType): type is IDLOptionalType {
    return type.optional === true && 'element' in type
}

function createPrimitiveType(name: string): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        [idlTypeName]: name,
        [primitiveTypeAnchor]: true
    }
}

function createOptionalType(element:IDLType): IDLOptionalType {
    if (isOptionalType(element)) {
        return element
    }
    return {
        ...element,
        optional: true,
        element
    }
}

export const IDLPointerType = createPrimitiveType('pointer')
export const IDLVoidType = createPrimitiveType('void')
export const IDLBooleanType = createPrimitiveType('boolean')
export const IDLI8Type = createPrimitiveType('i8')
export const IDLU8Type = createPrimitiveType('u8')
export const IDLI16Type = createPrimitiveType('i16')
export const IDLU16Type = createPrimitiveType('u16')
export const IDLI32Type = createPrimitiveType('i32')
export const IDLU32Type = createPrimitiveType('u32')
export const IDLI64Type = createPrimitiveType('i64')
export const IDLU64Type = createPrimitiveType('u64')
export const IDLF32Type = createPrimitiveType('f32')
export const IDLF64Type = createPrimitiveType('f64')
export const IDLBigintType = createPrimitiveType("bigint")
export const IDLNumberType = createPrimitiveType('number')
export const IDLStringType = createPrimitiveType('String')
export const IDLAnyType = createPrimitiveType('any')
export const IDLNullType = createPrimitiveType('null')
export const IDLUndefinedType = createPrimitiveType('undefined')
export const IDLUnknownType = createPrimitiveType('unknown')
export const IDLObjectType = createReferenceType('Object')
export const IDLThisType = createPrimitiveType('this')

// Stub for IdlPeerLibrary 
export const IDLFunctionType = createPrimitiveType('Function')
export const IDLLengthType = createPrimitiveType('Length')
export const IDLCustomObjectType = createPrimitiveType('CustomObject')

export function createModuleType(name:string, extendedAttributes?: IDLExtendedAttribute[], fileName?:string): IDLModuleType {
    return {
        kind: IDLKind.ModuleType,
        [idlTypeName]: name,
        extendedAttributes,
        fileName,
    }
}
export function createReferenceType(name: string, typeArguments?: (string | undefined)[]): IDLReferenceType {
    if (typeArguments) {
        return {
            kind: IDLKind.ReferenceType,
            [idlTypeName]: name,
            extendedAttributes: [{
                name: IDLExtendedAttributes.TypeArguments,
                value: typeArguments.join(",")
            }]
        }
    }
    return {
        kind: IDLKind.ReferenceType,
        [idlTypeName]: name
    }
}

export function createEnumType(name: string): IDLEnumType {
    return {
        kind: IDLKind.EnumType,
        [idlTypeName]: name
    }
}

export function entityToType(entity:IDLEntry): IDLType {
    if (isType(entity)) {
        return entity
    }

    return createReferenceType(entity.name ?? throwException("Can not convert!"))
}

export function createContainerType(container: IDLContainerKind, element: IDLType[]): IDLContainerType {
    if (container == "Promise") {
        // A bit ugly, but we cannot do that.
        element.forEach(it => { it.extendedAttributes = []})
    }
    if (element[0][idlTypeName] == "PropertyKey") {
        element[0] = { ...element[0], [idlTypeName]: IDLStringType[idlTypeName] }
    }
    return {
        kind: IDLKind.ContainerType,
        [idlTypeName]: container,
        elementType: element
    }
}

export function createUnionType(types: IDLType[], name?: string): IDLUnionType {
    if (types.length < 2)
        throw new Error("IDLUnionType should contain at least 2 types")
    return {
        kind: IDLKind.UnionType,
        [idlTypeName]: name ?? types.map(it => it[idlTypeName]).join(" or "),
        types: types
    }
}

export function createInterface(
    name: string,
    kind: IDLKind.Interface | IDLKind.Class | IDLKind.AnonymousInterface | IDLKind.TupleInterface,
    inheritance: IDLType[] = [],
    constructors: IDLConstructor[] = [],
    constants: IDLConstant[] = [],
    properties: IDLProperty[] = [],
    methods: IDLMethod[] = [],
    callables: IDLCallable[] = [],
    extendedAttributes: IDLExtendedAttribute[] = [],
): IDLInterface {
    return {
        name,
        kind,
        inheritance,
        constructors,
        constants,
        properties,
        methods,
        callables,
        extendedAttributes,
    }
}

export function createProperty(
    name: string,
    type: IDLType,
    isReadonly: boolean = false,
    isStatic: boolean = false,
    isOptional: boolean = false,
): IDLProperty {
    return {
        name,
        kind: IDLKind.Property,
        type,
        isReadonly,
        isStatic,
        isOptional,
    }
}

export function createParameter(name: string, type: IDLType | undefined): IDLParameter {
    return {
        kind: IDLKind.Parameter,
        name: name,
        type: type,
        isOptional: false,
        isVariadic: false,
    }
}

export function createCallback(name: string, parameters: IDLParameter[], returnType: IDLType, extendedAttributes?: IDLExtendedAttribute[]): IDLCallback {
    return {
        kind: IDLKind.Callback,
        name: name,
        parameters: parameters,
        returnType: returnType,
        extendedAttributes: extendedAttributes
    }
}

export function createTypeParameterReference(name: string): IDLTypeParameterType {
    return {
        kind: IDLKind.TypeParameterType,
        [idlTypeName]: name
    }
}

export function createTypedef(name: string, type: IDLType): IDLTypedef {
    return {
        kind: IDLKind.Typedef,
        name: name,
        type: type
    }
}

const IDLKeywords = new Set<string>(["attribute", "callback", "object", "toString"])

export function escapeKeyword(name: string): string {
    return name + (IDLKeywords.has(name) ? "_" : "")
}

export function unescapeKeyword(name: string): string {
    if (name.endsWith("_")) {
        const unwrapped = name.slice(0, -1)
        if (IDLKeywords.has(unwrapped)) return unwrapped
    }
    return name
}

export function printType(type: IDLType | IDLInterface | undefined): string {
    if (!type) throw new Error("Missing type")
    if (isInterface(type)) return type.name
    if (isPrimitiveType(type)) return type[idlTypeName]
    if (isContainerType(type)) return `${type[idlTypeName]}<${type.elementType.map(printType).join(", ")}>`
    if (isReferenceType(type)) {
        const attrs = quoteAttributeValues(type.extendedAttributes)
        const attrSpec = attrs ? `[${attrs}] ` : ""
        return `${attrSpec}${type[idlTypeName]}`
    }
    if (isUnionType(type)) return `(${type.types.map(printType).join(" or ")})`
    if (isEnumType(type)) return type[idlTypeName]
    if (isTypeParameterType(type)) return type[idlTypeName]
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

export function printParameters(parameters: IDLParameter[] | undefined): string {
    return parameters
        ?.map(it =>
            nameWithType(it, it.isVariadic, it.isOptional)
        )
        ?.join(", ") ?? ""
}

export function printConstructor(idl: IDLFunction): stringOrNone[] {
    return [indentedBy(`constructor(${printParameters(idl.parameters)});`, 1)]
}

export function nameWithType(
    idl: IDLVariable,
    isVariadic: boolean = false,
    isOptional: boolean = false
): string {
    const type = printType(idl.type)
    const variadic = isVariadic ? "..." : ""
    const optional = isOptional ? "optional " : ""
    return `${optional}${type}${variadic} ${escapeKeyword(idl.name!)}`
}

export function printConstant(idl: IDLConstant): stringOrNone[] {
    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`const ${nameWithType(idl)} = ${idl.value};`, 1)
    ]
}

export function printProperty(idl: IDLProperty): stringOrNone[] {
    const staticMod = idl.isStatic ? "static " : ""
    const readonlyMod = idl.isReadonly ? "readonly " : ""

    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${staticMod}${readonlyMod}attribute ${nameWithType(idl)};`, 1)
    ]
}

function printExtendedAttributes(idl: IDLEntry, indentLevel: number): stringOrNone[] {
    let attributes = idl.extendedAttributes
    if (idl.documentation) {
        let docs: IDLExtendedAttribute = {
            name: IDLExtendedAttributes.Documentation,
            value: idl.documentation
        }
        if (attributes)
            attributes.push(docs)
        else
            attributes = [docs]
    }
    const attrSpec = quoteAttributeValues(attributes)
    return attrSpec ? [indentedBy(`[${attrSpec}]`, indentLevel)] : []
}

export const attributesToQuote = new Set([
    IDLExtendedAttributes.Documentation,
    IDLExtendedAttributes.DtsName,
    IDLExtendedAttributes.Import,
    IDLExtendedAttributes.Interfaces,
    IDLExtendedAttributes.ParentTypeArguments,
    IDLExtendedAttributes.TypeArguments,
    IDLExtendedAttributes.TypeParameters,
])

function quoteAttributeValues(attributes?: IDLExtendedAttribute[]): stringOrNone {
    return attributes
        ?.map(it => {
            let attr = it.name
            if (it.value) {
                const value = it.value.replaceAll('"', "'")
                attr += `=${attributesToQuote.has(it.name as IDLExtendedAttributes) ? `"${value}"` : it.value}`
            }
            return attr})
        .join(", ")
}

export function printFunction(idl: IDLFunction): stringOrNone[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${printType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`, 1)
    ]
}

export function printMethod(idl: IDLMethod): stringOrNone[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${idl.isStatic ? "static " : ""}${printType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`, 1)
    ]
}

export function printModule(idl: IDLModuleType): stringOrNone[] {
    // May changes later to deal with namespace. currently just VerbatimDts
    return [
        ...printExtendedAttributes(idl,0),
        `namespace ${idl[idlTypeName]} {};`
    ]
}

export function printPackage(idl: IDLPackage): stringOrNone[] {
    return [
        `package "${idl.name}";`
    ]
}

export function printImport(idl: IDLImport): stringOrNone[] {
    return [
        `import "${idl.name}";`
    ]
}

export function printCallback(idl: IDLCallback): stringOrNone[] {
    return [
        ...printExtendedAttributes(idl, 0),
        `callback ${idl.name} = ${printType(idl.returnType)} (${printParameters(idl.parameters)});`
    ]
}

export function printScoped(idl: IDLEntry): stringOrNone[] {
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind == IDLKind.AnonymousInterface) return printInterface(idl as IDLInterface)
    if (idl.kind == IDLKind.TupleInterface) return printInterface(idl as IDLInterface)
    throw new Error(`Unexpected scoped: ${idl.kind} ${idl.name}`)
}

export function printInterface(idl: IDLInterface): stringOrNone[] {
    idl.methods.map((it: IDLMethod) => {
        let result = it.scope
        it.scope = undefined
        return result
    })
        .filter(isDefined)
        .map(scope => {
            idl.scope ? idl.scope.push(...scope) : idl.scope = scope
        })
    return [
        ...printExtendedAttributes(idl, 0),
        `interface ${idl.name}${hasSuperType(idl) ? ": " + printType(idl.inheritance[0]) : ""} {`,
        // TODO: type system hack!
    ]
        .concat(idl.constructors.map(printConstructor).flat())
        .concat(idl.constants.map(printConstant).flat())
        .concat(idl.properties.map(printProperty).flat())
        .concat(idl.methods.map(printMethod).flat())
        .concat(idl.callables.map(printFunction).flat())
        .concat(["};"])
}

export function getSuperType(idl: IDLInterface) {
    const parent = idl.inheritance[0]
    return parent && parent !== IDLTopType ? parent : undefined
}

export function hasSuperType(idl: IDLInterface) {
    return isDefined(getSuperType(idl))
}

export function printEnumMember(idl: IDLEnumMember): stringOrNone[] {
    const type = printType(idl.type)
    const initializer = type === IDLStringType[idlTypeName]
        ? `"${(idl.initializer as string).replaceAll('"', "'")}"`
        : idl.initializer
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `${type} ${idl.name}${initializer ? ` = ${initializer}` : ``};`
    ].map(it => it ? indentedBy(it, 1) : undefined)
}

export function printEnum(idl: IDLEnum, skipInitializers: boolean): stringOrNone[] {
    if (skipInitializers) {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `enum ${idl.name!} {`,
            ...idl.elements.map(it => indentedBy(`${it.name} ${(it.initializer ? " /* " + it.initializer + " */" : "")}`, 1)),
            "};"
        ]
    } else {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `dictionary ${idl.name!} {`,
            ...idl.elements.map(printEnumMember) as any,
            "};"
        ].flat()
    }
}

export function printTypedef(idl: IDLTypedef): stringOrNone[] {
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `typedef ${printType(idl.type)} ${idl.name!};`
    ]
}

export function printIDL(idl: IDLEntry, options?: Partial<IDLPrintOptions>): stringOrNone[] {
    if (idl.kind == IDLKind.Class
        || idl.kind == IDLKind.Interface
        || idl.kind == IDLKind.AnonymousInterface
        || idl.kind == IDLKind.TupleInterface
    ) return printInterface(idl as IDLInterface)
    if (idl.kind == IDLKind.Enum) return printEnum(idl as IDLEnum, options?.disableEnumInitializers ?? false)
    if (idl.kind == IDLKind.Typedef) return printTypedef(idl as IDLTypedef)
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind == IDLKind.ModuleType) return printModule(idl as IDLModuleType)
    if (idl.kind == IDLKind.Package) return printPackage(idl as IDLPackage)
    if (idl.kind == IDLKind.Import) return printImport(idl as IDLImport)
    throw new Error(`unexpected kind: ${idl.kind}`)
}

export interface IDLPrintOptions {
    verifyIdl: boolean
    disableEnumInitializers: boolean
}

export function toIDLString(entries: IDLEntry[], options: Partial<IDLPrintOptions>): string {
    const generatedIdl = entries
        .map(it => printIDL(it, options))
        .concat(printScopes(entries))
        .flat()
        .filter(isDefined)
        .filter(it => it.length > 0)
        .join("\n")
    if (options.verifyIdl) webidl2.validate(webidl2.parse(generatedIdl))
    return generatedIdl
}

function printScopes(entries: IDLEntry[]) {
    return entries
        .map((it: IDLEntry) => it.scope)
        .filter(isDefined)
        .flatMap((it: IDLEntry[]) => it.map(printScoped))
}

export function hasExtAttribute(node: IDLEntry, attribute: IDLExtendedAttributes): boolean {
    return node.extendedAttributes?.find((it) => it.name == attribute) != undefined
}

export function getExtAttribute(node: IDLEntry, name: IDLExtendedAttributes): stringOrNone {
    return node.extendedAttributes?.find(it => it.name === name)?.value
}

export function getVerbatimDts(node: IDLEntry): stringOrNone {
    let value = getExtAttribute(node, IDLExtendedAttributes.VerbatimDts)
    return value ? value.substring(1, value.length - 1) : undefined
}
export function updateIDLType<T extends IDLType>(type:T, newName:string): T {
    if (type[idlTypeName] === newName) {
        return type
    }
    if (!isReferenceType(type)) {
        // warning!!!
        console.warn("WARNING: update not reference type!")
    }
    return { ...type, [idlTypeName]: newName }
}
export function isIDLTypeNameIn(type: IDLType, collection:string[] | Map<string, unknown> | Set<string>): boolean {
    const isValidType = isTypeParameterType(type) || isReferenceType(type) || isEnumType(type) || isPrimitiveType(type)
    if (!isValidType) {
        return false
    }
    if (Array.isArray(collection)) {
        return collection.includes(type[idlTypeName])
    }
    return collection.has(type[idlTypeName])
} 
export function isIDLTypeName(type: IDLType , name:string | undefined): boolean {
    const isValidType = !isContainerType(type)
    if (!isValidType) {
        return false
    }
    if (!name) {
        return false
    }
    return type[idlTypeName] === name
}

export const IDLContainerUtils = {
    isRecord: (x:IDLContainerType) => x[idlTypeName] === 'record',
    isSequence: (x:IDLContainerType) => x[idlTypeName] === 'sequence',
    isPromise: (x:IDLContainerType) => x[idlTypeName] === 'Promise'
}
export function getIDLContainerTypeKind(type:IDLContainerType): IDLContainerKind {
    return type[idlTypeName]
} 
type IDLTypePrinter<T> = (x: T, name: string) => string
export function getIDLTypeName<T extends IDLType>(type:T, print: IDLTypePrinter<T> = (x: T, name: string) => {return name}): string {
    if (isPrimitiveType(type) || isReferenceType(type) || isEnumType(type) || isTypeParameterType(type)) {
        return print(type, type[idlTypeName])
    }
    if (!print) {
        throw new Error(`Possible type data loss! ${DebugUtils.debugPrintType(type)}`)
    }
    return print(type, type[idlTypeName])
}
export function isIDLTypeNameWith(type:IDLType, predicate:(name:string) => boolean): boolean {
    return predicate(type[idlTypeName])
}
export function updateIDLTypeWith<T extends IDLType>(type:T, action: (t:IDLType) => string): T {
    return updateIDLType(type, action(type))
}
export function isIDLTypeSameName(a:IDLType, b:IDLType): boolean {
    return a[idlTypeName] === b[idlTypeName]
}
///don't like this. But type args are stored as strings, not as IDLType as they should
export function toIDLType(typeName: string): IDLType {
    if (typeName.includes('import')) {
        throw new Error(`FAIL ${typeName}`)
    } 
    if (typeName === 'sequence') {
        throw new Error('FAIL')
    }
    const arrayMatch = typeName.match(/^Array<(.*)$>/)
    if (arrayMatch) {
        return createContainerType("sequence", [toIDLType(arrayMatch[1])])
    }
    // TODO: mb match /Map<(.*), (.*)>/ and /(.*)\[\]]/

    switch (typeName) {
        case "boolean": return IDLBooleanType
        case "null": return IDLNullType
        case "number": return IDLNumberType
        case "string": return IDLStringType
        case "String": return IDLStringType
        case "undefined": return IDLUndefinedType
        case "unknown": return IDLUnknownType
        case "void": return IDLVoidType
        case "Object": return IDLObjectType
        case "any": return IDLAnyType
        case "i8": return IDLI8Type
        case "u8": return IDLU8Type
        case "i16": return IDLI16Type
        case "u16": return IDLU16Type
        case "i32": return IDLI32Type
        case "u32": return IDLU32Type
        case "i64": return IDLI64Type
        case "u64": return IDLU64Type
        case "pointer": return IDLPointerType
        case "this": return IDLThisType
        default: return createReferenceType(typeName)
    }
}

export function maybeOptional(type: IDLType, optional?: boolean): IDLType {
    if (optional === undefined) {
        return type
    }
    if (optional) {
        if (isOptionalType(type)) {
            return type
        }
        return createOptionalType(type)
    }

    if (isOptionalType(type)) {
        return type.element
    }
    return type
}

export const DebugUtils = {
    debugPrintType: (type:IDLType): string => {
        if (isContainerType(type)) {
            return `[IDLType, name: '${type[idlTypeName]}', kind: '${IDLKind[type.kind]}', elements: [${type.elementType.map(DebugUtils.debugPrintType).join(', ')}]]`
        }
        return `[IDLType, name: '${type[idlTypeName]}', kind: '${IDLKind[type.kind]}]'`
    },
    easyGetName: (type:IDLType, name:string): string => {
        if (isContainerType(type)) {
            console.warn("Try to loose type info", name, type)
            throw new Error("Try to loose type info")
        }
        return name
    }
}
