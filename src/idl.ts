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
    Accessor = "Accessor",
    Async = "Async",
    CallSignature = "CallSignature",
    CommonMethod = "CommonMethod",
    Component = "Component",
    ComponentInterface = "ComponentInterface",
    Deprecated = "Deprecated",
    Documentation = "Documentation",
    DtsName = "DtsName",
    DtsTag = "DtsTag",
    Entity = "Entity",
    GlobalScope = "GlobalScope",
    Import = "Import",
    IndexSignature = "IndexSignature",
    Interfaces = "Interfaces",
    Namespace = "Namespace",
    NativeModule = "NativeModule",
    Optional = "Optional",
    ParentTypeArguments = "ParentTypeArguments",
    Protected = "Protected",
    Synthetic = "Synthetic",
    TypeArguments = "TypeArguments",
    TypeParameters = "TypeParameters",
    VerbatimDts = "VerbatimDts",
}

export enum IDLAccessorAttribute {
    Getter = "Getter",
    Setter = "Setter",
}

export interface IDLExtendedAttribute {
    name: string
    value?: string
}

const innerIdlSymbol = Symbol("innerIdlSymbol")
export interface IDLNode {
    _idlNodeBrand: any
    kind: IDLKind
    fileName?: string
    extendedAttributes?: IDLExtendedAttribute[]
    documentation?: string
}

export interface IDLNamedNode extends IDLNode {
    _idlNamedNodeBrand: any
    name: string
}

// TODO IDLNamedNode seems here like overkill - callables and constructors do not have names
export interface IDLEntry extends IDLNode, IDLNamedNode {
    _idlEntryBrand: any
    comment?: string
    scope?: IDLEntry[]
}

export interface IDLType extends IDLNode {
    _idlTypeBrand: any
}

export const IDLTopType: IDLType = createPrimitiveType("__TOP__")

export interface IDLTypedef extends IDLEntry {
    kind: IDLKind.Typedef
    type: IDLType
}

export interface IDLPrimitiveType extends IDLType, IDLNamedNode {
    kind: IDLKind.PrimitiveType
}

export interface IDLOptionalType extends IDLType {
    kind: IDLKind.OptionalType
    type: IDLType
}

export type IDLContainerKind =
      'sequence'
    | 'record'
    | 'Promise'

export interface IDLContainerType extends IDLType {
    kind: IDLKind.ContainerType
    elementType: IDLType[]
    containerKind: IDLContainerKind
}

export interface IDLReferenceType extends IDLType, IDLNamedNode {
    kind: IDLKind.ReferenceType
}

export interface IDLUnionType extends IDLType, IDLNamedNode {
    kind: IDLKind.UnionType
    types: IDLType[]
}

export interface IDLTypeParameterType extends IDLType, IDLNamedNode {
    kind: IDLKind.TypeParameterType
}

export interface IDLModule extends IDLEntry {
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
    elements: IDLEnumMember[]
}

export interface IDLEnumMember extends IDLEntry {
    kind: IDLKind.EnumMember
    parent: IDLEnum
    type: IDLPrimitiveType
    initializer: number | string | undefined
}

export interface IDLConstant extends IDLTypedEntry {
    kind: IDLKind.Const
    type: IDLType
    value: string
}

export interface IDLProperty extends IDLTypedEntry, IDLNamedNode {
    kind: IDLKind.Property
    type: IDLType
    isReadonly: boolean
    isStatic: boolean
    isOptional: boolean
}

export interface IDLParameter extends IDLTypedEntry, IDLNamedNode {
    kind: IDLKind.Parameter
    isVariadic: boolean
    isOptional: boolean
}

export interface IDLSignature extends IDLEntry {
    parameters: IDLParameter[]
    returnType?: IDLType
}

export interface IDLFunction extends IDLSignature {
    isAsync: boolean
}

export interface IDLMethod extends IDLFunction, IDLNamedNode {
    kind: IDLKind.Method
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
    kind: IDLKind.Interface | IDLKind.Class | IDLKind.AnonymousInterface | IDLKind.TupleInterface
    inheritance: IDLType[]
    constructors: IDLConstructor[]
    constants: IDLConstant[]
    properties: IDLProperty[]
    methods: IDLMethod[]
    callables: IDLCallable[]
}

export interface IDLPackage extends IDLEntry {
    kind: IDLKind.Package
}

export interface IDLImport extends IDLEntry {
    kind: IDLKind.Import
    importClause?: string[]
}

export interface IDLCallback extends IDLEntry, IDLSignature {
    kind: IDLKind.Callback
    returnType: IDLType
}

export function forEachChild(node: IDLNode, cb: (entry: IDLNode) => void): void {
    cb(node)
    switch (node.kind) {
        case IDLKind.Interface:
            if (isType(node)) return // TODO remove this check after IDLType stops mimic IDLInterface
            // passthrough
        case IDLKind.Class:
        case IDLKind.TupleInterface:
        case IDLKind.AnonymousInterface: {
            let iface = node as IDLInterface
            iface.inheritance.forEach((value) => forEachChild(value, cb))
            iface.constructors.forEach((value) => forEachChild(value, cb))
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

export function isNamedNode(type: IDLNode): type is IDLNamedNode {
    return "_idlNamedNodeBrand" in type
}

export function forceAsNamedNode(type: IDLNode): IDLNamedNode {
    if (!isNamedNode(type)) {
        throw new Error("Expected to be an IDLNamedNode")
    }
    return type
}

export function isNullType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLNullType.name
}
export function isUndefinedType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLUndefinedType.name
}
export function isVoidType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLVoidType.name
}
export function isPrimitiveType(type: IDLNode): type is IDLPrimitiveType {
    return type.kind == IDLKind.PrimitiveType
}
export function isContainerType(type: IDLNode): type is IDLContainerType {
    return type.kind == IDLKind.ContainerType
}
export function isReferenceType(type: IDLNode): type is IDLReferenceType {
    return type.kind == IDLKind.ReferenceType
}
export function isEnum(type: IDLNode): type is IDLEnum {
    return type.kind == IDLKind.Enum
}
export function isEnumMember(type: IDLNode): type is IDLEnumMember {
    return type.kind == IDLKind.EnumMember
}
export function isUnionType(type: IDLNode): type is IDLUnionType {
    return type.kind == IDLKind.UnionType
}
export function isTypeParameterType(type: IDLNode): type is IDLTypeParameterType {
    return type.kind == IDLKind.TypeParameterType
}
export function isInterface(node: IDLNode): node is IDLInterface {
    return node.kind === IDLKind.Interface
}
export function isPackage(type: IDLNode): type is IDLPackage {
    return type.kind == IDLKind.Package
}
export function isImport(type: IDLNode): type is IDLImport {
    return type.kind == IDLKind.Import
}
export function isAnonymousInterface(node: IDLNode): node is IDLInterface {
    return node.kind === IDLKind.AnonymousInterface
}
export function isTupleInterface(node: IDLNode): node is IDLInterface {
    return node.kind === IDLKind.TupleInterface
}
export function isClass(node: IDLNode): node is IDLInterface {
    return node.kind === IDLKind.Class
}
export function isCallable(node: IDLNode): node is IDLCallable {
    return node.kind === IDLKind.Callable
}
export function isMethod(node: IDLNode): node is IDLMethod {
    return node.kind === IDLKind.Method
}
export function isConstructor(node: IDLNode): node is IDLConstructor {
    return node.kind === IDLKind.Constructor
}
export function isProperty(node: IDLNode): node is IDLProperty {
    return node.kind === IDLKind.Property
}
export function isCallback(node: IDLNode): node is IDLCallback {
    return node.kind === IDLKind.Callback
}
export function isConstant(node: IDLNode): node is IDLConstant {
    return node.kind === IDLKind.Const
}
export function isTypedef(node: IDLNode): node is IDLTypedef {
    return node.kind === IDLKind.Typedef
}
export function isType(node: IDLNode): node is IDLType {
    return "_idlTypeBrand" in node
}

export function isEntry(node: IDLNode): node is IDLEntry {
    return "_idlEntryBrand" in node
}

export function isModuleType(node: IDLNode): node is IDLModule {
    return node.kind === IDLKind.ModuleType
}
export function isSyntheticEntry(node: IDLNode): boolean {
    return isDefined(node.extendedAttributes?.find(it => it.name === IDLExtendedAttributes.Synthetic))
}

export function isOptionalType(type: IDLType): type is IDLOptionalType {
    return type.kind === IDLKind.OptionalType
}

function createPrimitiveType(name: string): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        name: name,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

function createOptionalType(element:IDLType): IDLOptionalType {
    if (isOptionalType(element)) {
        return element
    }
    return {
        kind: IDLKind.OptionalType,
        type: element,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
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
export const IDLDate = createPrimitiveType('date')

// Stub for IdlPeerLibrary
export const IDLFunctionType = createPrimitiveType('Function')
export const IDLLengthType = createPrimitiveType('Length')
export const IDLCustomObjectType = createPrimitiveType('CustomObject')

export type IDLNodeInitializer = {
    extendedAttributes?: IDLExtendedAttribute[]
    fileName?: string
    documentation?: string
}

export function createModuleType(name:string, extendedAttributes?: IDLExtendedAttribute[], fileName?:string): IDLModule {
    return {
        kind: IDLKind.ModuleType,
        name: name,
        extendedAttributes,
        fileName,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}
export function createReferenceType(name: string, typeArguments?: (string | undefined)[]): IDLReferenceType {
    if (typeArguments) {
        return {
            kind: IDLKind.ReferenceType,
            name: name,
            extendedAttributes: [{
                name: IDLExtendedAttributes.TypeArguments,
                value: typeArguments.join(",")
            }],
            _idlNodeBrand: innerIdlSymbol,
            _idlTypeBrand: innerIdlSymbol,
            _idlNamedNodeBrand: innerIdlSymbol,
        }
    }
    return {
        kind: IDLKind.ReferenceType,
        name: name,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function entityToType(entity:IDLNode): IDLType {
    if (isType(entity)) {
        return entity
    }

    return createReferenceType(forceAsNamedNode(entity).name)
}

export function createContainerType(container: IDLContainerKind, element: IDLType[]): IDLContainerType {
    if (container == "Promise") {
        // A bit ugly, but we cannot do that.
        element.forEach(it => { it.extendedAttributes = []})
    }
    // TODO not used?
    // if (element[0][idlTypeName] == "PropertyKey") {
    //     element[0] = { ...element[0], [idlTypeName]: IDLStringType[idlTypeName] }
    // }
    return {
        kind: IDLKind.ContainerType,
        containerKind: container,
        elementType: element,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
    }
}

export function createUnionType(types: IDLType[], name?: string): IDLUnionType {
    if (types.length < 2)
        throw new Error("IDLUnionType should contain at least 2 types")
    return {
        kind: IDLKind.UnionType,
        name: name ?? "Union_" + types.map(it => forceAsNamedNode(it).name).join("_"),
        types: types,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createPackage(name: string): IDLPackage {
    return {
        kind: IDLKind.Package,
        name,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createImport(name: string, importClause?: string[]): IDLImport {
    return {
        kind: IDLKind.Import,
        name,
        importClause: importClause,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createEnum(
    name: string,
    elements: IDLEnumMember[],
    nodeInitializer: IDLNodeInitializer,
): IDLEnum {
    return {
        kind: IDLKind.Enum,
        name: name,
        elements: elements,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createEnumMember(
    name: string,
    parent: IDLEnum,
    type: IDLPrimitiveType,
    initializer: number | string | undefined,
    nodeInitializer: IDLNodeInitializer = {},
): IDLEnumMember {
    return {
        kind: IDLKind.EnumMember,
        name: name,
        parent,
        type,
        initializer,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
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
    nodeInitializer: IDLNodeInitializer = {},
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
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createProperty(
    name: string,
    type: IDLType,
    isReadonly: boolean = false,
    isStatic: boolean = false,
    isOptional: boolean = false,
    nodeInitializer: IDLNodeInitializer = {},
): IDLProperty {
    return {
        name,
        kind: IDLKind.Property,
        type,
        isReadonly,
        isStatic,
        isOptional,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createParameter(
    name: string, 
    type: IDLType | undefined, 
    isOptional: boolean = false, 
    isVariadic: boolean = false,
    nodeInitializer: IDLNodeInitializer = {},
): IDLParameter {
    return {
        kind: IDLKind.Parameter,
        name: name,
        type: type,
        isOptional,
        isVariadic,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export type IDLMethodInitializer = {
    isAsync: boolean
    isStatic: boolean
    isOptional: boolean
}
export function createMethod(
    name: string,
    parameters: IDLParameter[],
    returnType: IDLType,
    methodInitializer: IDLMethodInitializer,
    nodeInitializer: IDLNodeInitializer,
): IDLMethod {
    return {
        kind: IDLKind.Method,
        name,
        parameters,
        returnType,
        ...methodInitializer,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export type IDLCallableInitializer = {
    isAsync: boolean,
    isStatic: boolean,
}
export function createCallable(
    // TODO name here seems useless
    name: string,
    parameters: IDLParameter[],
    returnType: IDLType,
    callableInitializer: IDLCallableInitializer,
    nodeInitializer: IDLNodeInitializer,
): IDLCallable {
    return {
        kind: IDLKind.Callable,
        name,
        parameters,
        returnType,
        ...callableInitializer,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createConstructor(
    parameters: IDLParameter[],
    returnType: IDLType | undefined,
    nodeInitializer: IDLNodeInitializer = {},
): IDLConstructor {
    return {
        kind: IDLKind.Constructor,
        name: "$CONSTRUCTOR%",
        parameters,
        returnType,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createCallback(name: string, parameters: IDLParameter[], returnType: IDLType, nodeInitializer: IDLNodeInitializer = {}): IDLCallback {
    return {
        kind: IDLKind.Callback,
        name: name,
        parameters: parameters,
        returnType: returnType,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createTypeParameterReference(name: string): IDLTypeParameterType {
    return {
        kind: IDLKind.TypeParameterType,
        name: name,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createTypedef(name: string, type: IDLType, nodeInitializer: IDLNodeInitializer = {}): IDLTypedef {
    return {
        kind: IDLKind.Typedef,
        name: name,
        type: type,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createConstant(name: string, type: IDLType, value: string, nodeInitializer: IDLNodeInitializer = {}): IDLConstant {
    return {
        kind: IDLKind.Const,
        name,
        type,
        value,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
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
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type)) return `${type.containerKind}<${type.elementType.map(printType).join(", ")}>`
    if (isReferenceType(type)) {
        const attrs = quoteAttributeValues(type.extendedAttributes)
        const attrSpec = attrs ? `[${attrs}] ` : ""
        return `${attrSpec}${type.name}`
    }
    if (isUnionType(type)) return `(${type.types.map(printType).join(" or ")})`
    if (isTypeParameterType(type)) return type.name
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

export function printParameters(parameters: IDLParameter[] | undefined): string {
    return parameters
        ?.map(it =>
            nameWithType(it, it.isVariadic, it.isOptional)
        )
        ?.join(", ") ?? ""
}

export function printConstructor(idl: IDLConstructor): stringOrNone[] {
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

function printExtendedAttributes(idl: IDLNode, indentLevel: number): stringOrNone[] {
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
    IDLExtendedAttributes.DtsTag,
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
                let value = it.value
                if (value.includes('"') && !value.includes("'"))
                    value = value.replaceAll('"', "'")
                value = value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
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
        indentedBy(`${idl.isAsync ? "async " : ""}${printType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`, 1)
    ]
}

export function printMethod(idl: IDLMethod): stringOrNone[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${idl.isStatic ? "static " : ""}${idl.isAsync ? "async " : ""}${printType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`, 1)
    ]
}

export function printModule(idl: IDLModule): stringOrNone[] {
    // May changes later to deal with namespace. currently just VerbatimDts
    return [
        ...printExtendedAttributes(idl,0),
        `namespace ${idl.name} {};`
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

export function getSuperType(idl: IDLInterface): IDLType | undefined {
    const parent = idl.inheritance[0]
    return parent && parent !== IDLTopType ? parent : undefined
}

export function hasSuperType(idl: IDLInterface) {
    return isDefined(getSuperType(idl))
}

export function printEnumMember(idl: IDLEnumMember): stringOrNone[] {
    const type = printType(idl.type)
    const initializer = idl.initializer === undefined
        ? ''
        : ' = ' + (type === IDLStringType.name
            ? `"${String(idl.initializer).replaceAll('"', "'")}"`
            : idl.initializer)
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `${type} ${idl.name}${initializer};`
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

export function printIDL(idl: IDLNode, options?: Partial<IDLPrintOptions>): stringOrNone[] {
    if (idl.kind == IDLKind.Class
        || idl.kind == IDLKind.Interface
        || idl.kind == IDLKind.AnonymousInterface
        || idl.kind == IDLKind.TupleInterface
    ) return printInterface(idl as IDLInterface)
    if (idl.kind == IDLKind.Enum) return printEnum(idl as IDLEnum, options?.disableEnumInitializers ?? false)
    if (idl.kind == IDLKind.Typedef) return printTypedef(idl as IDLTypedef)
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind == IDLKind.ModuleType) return printModule(idl as IDLModule)
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

export function hasExtAttribute(node: IDLNode, attribute: IDLExtendedAttributes): boolean {
    return node.extendedAttributes?.find((it) => it.name == attribute) != undefined
}

export function getExtAttribute(node: IDLNode, name: IDLExtendedAttributes): stringOrNone {
    return node.extendedAttributes?.find(it => it.name === name)?.value
}

export function getVerbatimDts(node: IDLEntry): stringOrNone {
    let value = getExtAttribute(node, IDLExtendedAttributes.VerbatimDts)
    return value ? value.substring(1, value.length - 1) : undefined
}

export const IDLContainerUtils = {
    isRecord: (x:IDLNode) => isContainerType(x) && x.containerKind === 'record',
    isSequence: (x:IDLNode) => isContainerType(x) && x.containerKind === 'sequence',
    isPromise: (x:IDLNode) => isContainerType(x) && x.containerKind === 'Promise'
}

/** 
 * @returns tuple of qualifier name and real type name
 */
export function decomposeQualifiedName(type: IDLReferenceType): [string | undefined, string] {
    const typeName = type.name
    const lastDot = typeName.lastIndexOf(".")
    if (lastDot >= 0) {
        const qualifier = typeName.slice(0, lastDot)
        const realTypeName = typeName.slice(lastDot + 1)
        return [qualifier, realTypeName]
    }
    return [undefined, typeName]
}

///don't like this. But type args are stored as strings, not as IDLType as they should
export function toIDLType(typeName: string): IDLType {
    if (typeName.includes('import')) {
        throw new Error(`FAIL ${typeName}`)
    }
    if (typeName === 'sequence') {
        throw new Error('FAIL')
    }
    const arrayMatch = typeName.match(/^Array<(.*)>$/)
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
        return type.type
    }
    return type
}

export const DebugUtils = {
    debugPrintType: (type:IDLType): string => {
        if (isContainerType(type)) {
            return `[IDLType, name: '${printType(type)}', kind: '${IDLKind[type.kind]}', elements: [${type.elementType.map(DebugUtils.debugPrintType).join(', ')}]]`
        }
        return `[IDLType, name: '${printType(type)}', kind: '${IDLKind[type.kind]}']`
    },
}

function forEachFunction(node: IDLNode, cb: (node: IDLFunction) => void): void {
    switch (node.kind) {
        case IDLKind.Interface:
            if (isType(node)) return // TODO remove this check after IDLType stops mimic IDLInterface
            // passthrough
        case IDLKind.Class:
        case IDLKind.TupleInterface:
        case IDLKind.AnonymousInterface: {
            const concrete = node as IDLInterface
            concrete.inheritance.forEach((value) => forEachFunction(value, cb))
            concrete.constructors.forEach((value) => forEachFunction(value, cb))
            concrete.properties.forEach((value) => forEachFunction(value, cb))
            concrete.methods.forEach((value) => forEachFunction(value, cb))
            concrete.callables.forEach((value) => forEachFunction(value, cb))
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable: {
            const concrete = node as IDLFunction
            cb(concrete)
            concrete.parameters.forEach((value) => forEachFunction(value, cb))
            if (concrete.returnType) forEachFunction(concrete.returnType, cb)
            break
        }
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            const concrete = node as IDLSignature
            concrete.parameters.forEach((value) => forEachFunction(value, cb))
            if (concrete.returnType) forEachFunction(concrete.returnType, cb)
            break
        }
        case IDLKind.Parameter: {
            const concrete = node as IDLParameter
            if (concrete.type) forEachFunction(concrete.type, cb)
            break
        }
        case IDLKind.Property: {
            const concrete = node as IDLProperty
            if (concrete.type) forEachFunction(concrete.type, cb)
            break
        }
        case IDLKind.UnionType: {
            const concrete = node as IDLUnionType
            concrete.types.forEach((value) => forEachFunction(value, cb))
            break
        }
        case IDLKind.ContainerType: {
            const concrete = node as IDLContainerType
            concrete.elementType.forEach((value) => forEachFunction(value, cb))
            break
        }
        case IDLKind.TypeParameterType:
        case IDLKind.Enum:
        case IDLKind.Typedef:
        case IDLKind.EnumType:
        case IDLKind.PrimitiveType:
        case IDLKind.ReferenceType:
        case IDLKind.ModuleType:
        case IDLKind.Package:
        case IDLKind.Import:
            break
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }
}

function asPromise(type?: IDLType): IDLContainerType | undefined {
    if (!type) return
    if (!isContainerType(type)) return
    const container = type as IDLContainerType
    if (!IDLContainerUtils.isPromise(container)) return
    return container
}

export function transformMethodsAsync2ReturnPromise(entry : IDLEntry) {
    forEachFunction(entry, function_ => {
        if (function_.isAsync) {
            function_.isAsync = false
            if (!asPromise(function_.returnType))
                function_.returnType = createContainerType("Promise", [function_.returnType ?? IDLVoidType])
        }
    })
}

export function transformMethodsReturnPromise2Async(entry : IDLEntry) {
    forEachFunction(entry, function_ => {
        const promise = asPromise(function_.returnType)
        if (promise) {
            function_.returnType = promise.elementType[0]
            function_.isAsync = true
        }
    })
}
