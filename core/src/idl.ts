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
import { generateSyntheticIdlNodeName } from "./peer-generation/idl/common";
import { IDLKeywords } from "./languageSpecificKeywords";

export enum IDLKind {
    Interface = "Interface",
    Import = "Import",
    Callback = "Callback",
    Const = "Const",
    Property = "Property",
    Parameter = "Parameter",
    Method = "Method",
    Callable = "Callable",
    Constructor = "Constructor",
    Enum = "Enum",
    EnumMember = "EnumMember",
    Typedef = "Typedef",
    PrimitiveType = "PrimitiveType",
    ContainerType = "ContainerType",
    UnspecifiedGenericType = "UnspecifiedGenericType",
    ReferenceType = "ReferenceType",
    UnionType = "UnionType",
    TypeParameterType = "TypeParameterType",
    OptionalType = "OptionalType",
    Version = "Version",
    Namespace = "Namespace",
    File = "File",
}

export enum IDLEntity {
    Class = "Class",
    Interface = "Interface",
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
    Extends = "Extends",
    Import = "Import",
    DefaultExport = "DefaultExport",
    IndexSignature = "IndexSignature",
    Interfaces = "Interfaces",
    NativeModule = "NativeModule",
    Optional = "Optional",
    OriginalEnumMemberName = "OriginalEnumMemberName",
    Predefined = "Predefined",
    Protected = "Protected",
    Synthetic = "Synthetic",
    Throws = "Throws",
    TypeArguments = "TypeArguments",
    TypeParameters = "TypeParameters",
    VerbatimDts = "VerbatimDts",
    HandWrittenImplementation = "HandWrittenImplementation",
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
    parent?: IDLNode
    fileName?: string
    extendedAttributes?: IDLExtendedAttribute[]
    documentation?: string
}

export interface IDLFile extends IDLNode {
    packageClause: string[],
    entries: IDLEntry[],
    text?: string,
    fileName?: string,
}

export interface IDLNamedNode extends IDLNode {
    _idlNamedNodeBrand: any
    name: string
}

// TODO IDLNamedNode seems here like overkill - callables and constructors do not have names
export interface IDLEntry extends IDLNode, IDLNamedNode {
    _idlEntryBrand: any
    comment?: string
}

export interface IDLType extends IDLNode {
    _idlTypeBrand: any
}

export interface IDLTypedef extends IDLEntry {
    kind: IDLKind.Typedef
    type: IDLType
    typeParameters?: string[]
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
    typeArguments?: IDLType[]
}

export interface IDLUnspecifiedGenericType extends IDLType, IDLNamedNode {
    kind: IDLKind.UnspecifiedGenericType
    typeArguments: IDLType[]
}

export interface IDLUnionType extends IDLType, IDLNamedNode {
    kind: IDLKind.UnionType
    types: IDLType[]
}

export interface IDLTypeParameterType extends IDLType, IDLNamedNode {
    kind: IDLKind.TypeParameterType
}

export interface IDLVersion extends IDLEntry {
    kind: IDLKind.Version
    value: string[]
}

export interface IDLVariable extends IDLEntry {
    type?: IDLType;
}

export interface IDLTypedEntry extends IDLEntry {
    type: IDLType;
}

export interface IDLEnum extends IDLEntry {
    kind: IDLKind.Enum
    elements: IDLEnumMember[]
}

export interface IDLEnumMember extends IDLEntry {
    kind: IDLKind.EnumMember
    parent: IDLEnum
    type: IDLPrimitiveType
    // TODO: remove undefined case
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
    type: IDLType
}

export interface IDLSignature extends IDLEntry {
    typeParameters?: string[]
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
    isFree: boolean
}

export interface IDLCallable extends IDLFunction {
    kind: IDLKind.Callable
    returnType: IDLType
    isStatic: boolean
}

export interface IDLConstructor extends IDLSignature {
    kind: IDLKind.Constructor
}

export enum IDLInterfaceSubkind {
    Interface,
    Class,
    AnonymousInterface,
    Tuple,
}

export interface IDLInterface extends IDLEntry {
    kind: IDLKind.Interface,
    subkind: IDLInterfaceSubkind,
    typeParameters?: string[]
    inheritance: IDLReferenceType[]
    constructors: IDLConstructor[]
    constants: IDLConstant[]
    properties: IDLProperty[]
    methods: IDLMethod[]
    callables: IDLCallable[]
}

export interface IDLImport extends IDLEntry {
    kind: IDLKind.Import
    clause: string[]
}

export interface IDLNamespace extends IDLEntry {
    kind: IDLKind.Namespace
    members: IDLEntry[]
}

export interface IDLCallback extends IDLEntry, IDLSignature {
    kind: IDLKind.Callback
    returnType: IDLType
}

type IDLNodeVisitorVoid = (node:IDLNode) => void
type IDLNodeVisitorValue = (node:IDLNode) => () => void

type IDLNodeVisitor =
      IDLNodeVisitorVoid
    | IDLNodeVisitorValue

export function forEachChild(node: IDLNode, cbEnter: IDLNodeVisitor, cbLeave?: (entry: IDLNode) => void): void {
    const cleanup = cbEnter(node)
    switch (node.kind) {
        case IDLKind.File:
            (node as IDLFile).entries.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        case IDLKind.Namespace:
            (node as IDLNamespace).members.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break

        case IDLKind.Interface: {
            let concrete = node as IDLInterface
            concrete.inheritance.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.constructors.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.properties.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.methods.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.callables.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            let concrete = node as IDLSignature
            concrete.parameters?.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            if (concrete.returnType) forEachChild(concrete.returnType, cbEnter, cbLeave)
            break
        }
        case IDLKind.UnionType: {
            let concrete = node as IDLUnionType
            concrete.types?.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.OptionalType: {
            let concrete = node as IDLOptionalType
            forEachChild(concrete.type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Const: {
            forEachChild((node as IDLConstant).type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Enum: {
            (node as IDLEnum).elements.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.Property: {
            forEachChild((node as IDLProperty).type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Parameter: {
            const concrete = node as IDLParameter
            if (concrete.type)
                forEachChild(concrete.type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Typedef: {
            forEachChild((node as IDLTypedef).type, cbEnter, cbLeave)
            break
        }
        case IDLKind.ContainerType: {
            (node as IDLContainerType).elementType.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.UnspecifiedGenericType: {
            (node as IDLUnspecifiedGenericType).typeArguments.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.ReferenceType:
        case IDLKind.TypeParameterType:
        case IDLKind.EnumMember:
        case IDLKind.Import:
        case IDLKind.PrimitiveType:
        case IDLKind.Version:
            break
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }

    cbLeave?.(node)
    cleanup?.()
}

/** Updates tree in place! */
function updateEachChild(node: IDLNode, op: (node:IDLNode) => IDLNode, cbLeave?: (entry: IDLNode) => void): IDLNode {
    const old = node
    node = op(old)
    if (node.kind !== old.kind) {
        throw new Error("Kinds must be the same!")
    }
    switch (node.kind) {
        case IDLKind.File: {
            const concrete = node as IDLFile
            concrete.entries = concrete.entries.map(it => updateEachChild(it, op, cbLeave) as IDLEntry)
            break
        }
        case IDLKind.Namespace: {
            const concrete = node as IDLNamespace
            concrete.members = concrete.members.map((it) => updateEachChild(it, op, cbLeave) as IDLEntry)
            break
        }
        case IDLKind.Interface: {
            const concrete = node as IDLInterface
            concrete.inheritance = concrete.inheritance.map((it) => updateEachChild(it, op, cbLeave) as IDLReferenceType)
            concrete.constructors = concrete.constructors.map((it) => updateEachChild(it, op, cbLeave) as IDLConstructor)
            concrete.properties = concrete.properties.map((it) => updateEachChild(it, op, cbLeave) as IDLProperty)
            concrete.methods = concrete.methods.map((it) => updateEachChild(it, op, cbLeave) as IDLMethod)
            concrete.callables = concrete.callables.map((it) => updateEachChild(it, op, cbLeave) as IDLCallable)
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            const concrete = node as IDLSignature
            concrete.parameters = concrete.parameters.map((it) => updateEachChild(it, op, cbLeave) as IDLParameter)
            if (concrete.returnType) {
                concrete.returnType = updateEachChild(concrete.returnType, op, cbLeave) as IDLType
            }
            break
        }
        case IDLKind.UnionType: {
            const concrete = node as IDLUnionType
            concrete.types = concrete.types.map((it) => updateEachChild(it, op, cbLeave) as IDLType)
            break
        }
        case IDLKind.OptionalType: {
            const concrete = node as IDLOptionalType
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Const: {
            const concrete = node as IDLConstant
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Enum: {
            const concrete = node as IDLEnum
            concrete.elements = concrete.elements.map((it) => updateEachChild(it, op, cbLeave) as IDLEnumMember)
            break
        }
        case IDLKind.Property: {
            const concrete = node as IDLProperty
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Parameter: {
            const concrete = node as IDLParameter
            if (concrete.type)
                concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Typedef: {
            const concrete = node as IDLTypedef
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.ContainerType: {
            const concrete = node as IDLContainerType
            concrete.elementType = concrete.elementType.map(it => updateEachChild(it, op, cbLeave) as IDLType)
            break
        }
        case IDLKind.UnspecifiedGenericType: {
            const concrete = node as IDLUnspecifiedGenericType
            concrete.typeArguments = concrete.typeArguments.map(it => updateEachChild(it, op, cbLeave) as IDLType)
            break
        }
        case IDLKind.ReferenceType:
        case IDLKind.TypeParameterType:
        case IDLKind.EnumMember:
        case IDLKind.Import:
        case IDLKind.PrimitiveType:
        case IDLKind.Version:
            break
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }
    if (cbLeave) {
        cbLeave?.(node)
    }
    return node
}

export function isNamedNode(type: IDLNode): type is IDLNamedNode {
    return "_idlNamedNodeBrand" in type
}

export function forceAsNamedNode(type: IDLNode): IDLNamedNode {
    if (!isNamedNode(type)) {
        throw new Error(`Expected to be an IDLNamedNode, but got '${IDLKind[type.kind]}'`)
    }
    return type
}

export function isFile(node: IDLNode): node is IDLFile {
    return node.kind === IDLKind.File
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
export function isUnspecifiedGenericType(type: IDLNode): type is IDLUnspecifiedGenericType {
    return type.kind == IDLKind.UnspecifiedGenericType
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
export function isImport(type: IDLNode): type is IDLImport {
    return type.kind == IDLKind.Import
}
export function isCallable(node: IDLNode): node is IDLCallable {
    return node.kind === IDLKind.Callable
}
export function isMethod(node: IDLNode): node is IDLMethod {
    return node.kind === IDLKind.Method
}
export function isParameter(node: IDLNode): node is IDLParameter {
    return node.kind === IDLKind.Parameter
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
export function isInterfaceSubkind(idl: IDLInterface): boolean {
    return idl.subkind === IDLInterfaceSubkind.Interface
}
export function isClassSubkind(idl: IDLInterface): boolean {
    return idl.subkind === IDLInterfaceSubkind.Class
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

export function isNamespace(node: IDLNode): node is IDLNamespace {
    return node.kind === IDLKind.Namespace
}

export function isSyntheticEntry(node: IDLNode): boolean {
    return isDefined(node.extendedAttributes?.find(it => it.name === IDLExtendedAttributes.Synthetic))
}

export function isOptionalType(type: IDLNode): type is IDLOptionalType {
    return type.kind === IDLKind.OptionalType
}

export function isVersion(node: IDLNode): node is IDLVersion {
    return node.kind === IDLKind.Version
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

export function createOptionalType(element:IDLType, nodeInitializer?: IDLNodeInitializer): IDLOptionalType {
    if (isOptionalType(element) && !nodeInitializer) {
        return element
    }
    if (isOptionalType(element)) {
        return {
            kind: IDLKind.OptionalType,
            type: element.type,
            ...nodeInitializer,
            _idlNodeBrand: innerIdlSymbol,
            _idlTypeBrand: innerIdlSymbol,
        }
    }
    return {
        kind: IDLKind.OptionalType,
        type: element,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
    }
}

// must match with toIDLType in deserialize.ts
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
export const IDLF16Type = createPrimitiveType('f16')
export const IDLF32Type = createPrimitiveType('f32')
export const IDLF64Type = createPrimitiveType('f64')
export const IDLBigintType = createPrimitiveType("bigint")
export const IDLNumberType = createPrimitiveType('number')
export const IDLStringType = createPrimitiveType('String')
export const IDLAnyType = createPrimitiveType('any')
export const IDLUndefinedType = createPrimitiveType('undefined')
export const IDLUnknownType = createPrimitiveType('unknown')
export const IDLObjectType = createPrimitiveType('Object')
export const IDLThisType = createPrimitiveType('this')
export const IDLDate = createPrimitiveType('date')
export const IDLBufferType = createPrimitiveType('buffer')

export const IDLUint8ArrayType = createContainerType('sequence', [IDLU8Type])
export const IDLSerializerBuffer = createPrimitiveType('SerializerBuffer')

// Stub for IdlPeerLibrary
export const IDLFunctionType = createPrimitiveType('Function')
export const IDLCustomObjectType = createPrimitiveType('CustomObject')
export const IDLInteropReturnBufferType = createPrimitiveType('InteropReturnBuffer')

export type IDLNodeInitializer = {
    extendedAttributes?: IDLExtendedAttribute[]
    fileName?: string
    documentation?: string
}

export function createNamespace(name:string, members?: IDLEntry[], nodeInitializer?:IDLNodeInitializer): IDLNamespace {
    return {
        kind: IDLKind.Namespace,
        members: members ?? [],
        name: name,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function linkParentBack<T extends IDLNode>(node: T): T {
    const parentStack: IDLNode[] = []
    updateEachChild(node, (node) => {
        if (isPrimitiveType(node)) {
            return node
        }
        if (parentStack.length) {
            const top = parentStack[parentStack.length - 1]
            if (node.parent !== undefined && node.parent !== top) {
                node = clone(node)
            }
            node.parent = top
        }
        parentStack.push(node)
        return node
    }, (node) => {
        if (isPrimitiveType(node)) {
            return
        }
        parentStack.pop()
    })
    return node
}

export function getNamespacesPathFor(node: IDLNode): IDLNamespace[] {
    let iterator: IDLNode | undefined = node.parent
    const result: IDLNamespace[] = []
    while (iterator) {
        if (isNamespace(iterator))
            result.unshift(iterator);
        iterator = iterator.parent
    }
    return result
}

export function getFileFor(node: IDLNode): IDLFile | undefined {
    let iterator: IDLNode | undefined = node
    while (iterator) {
        if (isFile(iterator))
            return iterator
        iterator = iterator.parent
    }
    console.warn(`Node ${getQualifiedName(node, "namespace.name")} does not have IDLFile in parents`)
    return undefined
}

export function isEqualByQualifedName(a?: IDLNamedNode, b?: IDLNamedNode, pattern: QNPattern = "package.namespace.name"): boolean {
    if (a === b)
        return true
    if (!a || !b)
        return false
    if (a.kind !== b.kind || a.name !== b.name)
        return false
    return getQualifiedName(a, pattern) === getQualifiedName(b, pattern)
}

export function getPackageClause(node: IDLNode): string[] {
    const file = getFileFor(node)
    return file?.packageClause ?? []
}

export function getPackageName(node: IDLNode): string {
    return getPackageClause(node).join(".")
}


export function isInPackage(entry: IDLEntry | IDLFile, packageName: string, exactMatch = false) {
    const entryPackageName = getPackageName(entry)
    return exactMatch
        ? entryPackageName === packageName
        : entryPackageName.startsWith(packageName)
}

export function getNamespaceName(a: IDLEntry): string {
    return getNamespacesPathFor(a).map(it => it.name).join('.')
}

export type QNPattern =
    "package.namespace.name" |
    "namespace.name" |
    "name";

export function getQualifiedName(a:IDLNode, pattern: QNPattern): string {
    const result: string[] = []
    if ("package.namespace.name" === pattern)
        result.push(...getPackageClause(a), ...getNamespacesPathFor(a).map(it => it.name))
    else if ("namespace.name" === pattern)
        result.push(...getNamespacesPathFor(a).map(it => it.name))

    if (isNamedNode(a) && a.name)
        result.push(a.name)

    return result.join(".")
}

export function getFQName(a:IDLNode): string {
    return getQualifiedName(a, "package.namespace.name")
}

export function createVersion(value: string[], nodeInitializer?:IDLNodeInitializer): IDLVersion {
    return {
        kind: IDLKind.Version,
        value,
        name: "version",
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function fetchNamespaceFrom(pointOfView?: IDLNode): IDLNamespace|undefined {
    let node: IDLNode | undefined = pointOfView
    while (node) {
        if (isNamespace(node))
            return node
        node = node.parent
    }
    return undefined
}

export function createReferenceType(name: string, typeArguments?: IDLType[], nodeInitializer?:IDLNodeInitializer): IDLReferenceType
export function createReferenceType(source: IDLEntry, typeArguments?: IDLType[], nodeInitializer?:IDLNodeInitializer): IDLReferenceType
export function createReferenceType(
    nameOrSource: string | IDLEntry,
    typeArguments?: IDLType[],
    nodeInitializer?:IDLNodeInitializer
): IDLReferenceType {
    let name: string
    if (typeof nameOrSource === 'string') {
        name = nameOrSource
    } else {
        name = getFQName(nameOrSource)
    }
    return {
        kind: IDLKind.ReferenceType,
        name,
        typeArguments,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createUnspecifiedGenericType(name: string, typeArguments: IDLType[], nodeInitializer?:IDLNodeInitializer): IDLUnspecifiedGenericType {
    return {
        kind: IDLKind.UnspecifiedGenericType,
        name,
        typeArguments,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function entityToType(entity:IDLNode): IDLType {
    if (isType(entity)) {
        return entity
    } else if (isEntry(entity)) {
        return createReferenceType(entity)
    } else {
        throw new Error(`Expected to have IDLType or IDLEntry, got ${entity}`)
    }
}

export function createContainerType(container: IDLContainerKind, element: IDLType[], nodeInitializer?: IDLNodeInitializer): IDLContainerType {
    return {
        kind: IDLKind.ContainerType,
        containerKind: container,
        elementType: element,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
    }
}

export function createUnionType(types: IDLType[], name?: string, nodeInitializer?: IDLNodeInitializer): IDLUnionType {
    if (types.length < 2)
        throw new Error("IDLUnionType should contain at least 2 types")
    return {
        kind: IDLKind.UnionType,
        name: name ?? "Union_" + types.map(it => generateSyntheticIdlNodeName(it)).join("_"),
        types: types,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createFile(entries: IDLEntry[], fileName?: string, packageClause: string[] = [], nodeInitializer?:IDLNodeInitializer): IDLFile {
    return {
        kind: IDLKind.File,
        packageClause,
        entries: entries,
        fileName,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
    }
}

export function createImport(clause: string[], name?: string, nodeInitializer?: IDLNodeInitializer): IDLImport {
    return {
        kind: IDLKind.Import,
        name: name ?? "",
        clause,
        ...nodeInitializer,
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
    subkind: IDLInterfaceSubkind,
    inheritance: IDLReferenceType[] = [],
    constructors: IDLConstructor[] = [],
    constants: IDLConstant[] = [],
    properties: IDLProperty[] = [],
    methods: IDLMethod[] = [],
    callables: IDLCallable[] = [],
    typeParameters: string[] = [],
    nodeInitializer: IDLNodeInitializer = {},
): IDLInterface {
    return {
        kind: IDLKind.Interface,
        name,
        subkind,
        typeParameters,
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
    type: IDLType,
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
    isFree: boolean // not a member of interface/class
}
export function createMethod(
    name: string,
    parameters: IDLParameter[],
    returnType: IDLType,
    methodInitializer: IDLMethodInitializer = {
        isAsync: false,
        isStatic: false,
        isOptional: false,
        isFree: false,
    },
    nodeInitializer: IDLNodeInitializer = {},
    typeParameters: string[] = []
): IDLMethod {
    return {
        kind: IDLKind.Method,
        name,
        parameters,
        returnType,
        typeParameters,
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
    nodeInitializer?: IDLNodeInitializer,
    typeParameters: string[] = []
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

export function createCallback(name: string, parameters: IDLParameter[], returnType: IDLType,
        nodeInitializer: IDLNodeInitializer = {}, typeParameters: string[] = []): IDLCallback
{
    return {
        kind: IDLKind.Callback,
        name, parameters, returnType, typeParameters,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlEntryBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createTypeParameterReference(name: string, nodeInitializer?: IDLNodeInitializer): IDLTypeParameterType {
    return {
        kind: IDLKind.TypeParameterType,
        name: name,
        ...nodeInitializer,
        _idlNodeBrand: innerIdlSymbol,
        _idlTypeBrand: innerIdlSymbol,
        _idlNamedNodeBrand: innerIdlSymbol,
    }
}

export function createTypedef(name: string, type: IDLType, typeParameters: string[] = [], nodeInitializer: IDLNodeInitializer = {}): IDLTypedef {
    return {
        name, type, typeParameters,
        kind: IDLKind.Typedef,
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

export function clone<T extends IDLNode>(node:T): T {
    const make = (node:IDLNode): T => node as T
    const get = <K>(node:T): K => node as IDLNode as K

    switch (node.kind) {
        case IDLKind.Interface: {
            const entry = get<IDLInterface>(node)
            return make(
                createInterface(
                    entry.name,
                    entry.subkind,
                    entry.inheritance?.map(clone),
                    entry.constructors?.map(clone),
                    entry.constants.map(clone),
                    entry.properties.map(clone),
                    entry.methods.map(clone),
                    entry.callables.map(clone),
                    entry.typeParameters?.map(it => it),
                    {
                        documentation: node.documentation,
                        extendedAttributes: node.extendedAttributes?.slice(),
                        fileName: node.fileName
                    }
                )
            )
        }
        case IDLKind.Import: {
            const entry = get<IDLImport>(node)
            return make(
                createImport(
                    entry.clause,
                    entry.name,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Callback: {
            const entry = get<IDLCallback>(node)
            return make(
                createCallback(
                    entry.name,
                    entry.parameters.map(clone),
                    clone(entry.returnType),
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    },
                    entry.typeParameters
                )
            )
        }
        case IDLKind.Const: {
            const entry = get<IDLConstant>(node)
            return make(
                createConstant(
                    entry.name,
                    clone(entry.type),
                    entry.value,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Property: {
            const entry = get<IDLProperty>(node)
            return make(
                createProperty(
                    entry.name,
                    clone(entry.type),
                    entry.isReadonly,
                    entry.isStatic,
                    entry.isOptional,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Parameter: {
            const entry = get<IDLParameter>(node)
            return make(
                createParameter(
                    entry.name,
                    clone(entry.type),
                    entry.isOptional,
                    entry.isVariadic,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Method: {
            const entry = get<IDLMethod>(node)
            return make(
                createMethod(
                    entry.name,
                    entry.parameters.map(clone),
                    clone(entry.returnType),
                    {
                        isAsync: entry.isAsync,
                        isFree: entry.isFree,
                        isOptional: entry.isOptional,
                        isStatic: entry.isStatic
                    },
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    },
                    entry.typeParameters
                )
            )
        }
        case IDLKind.Callable: {
            const entry = get<IDLCallable>(node)
            return make(
                createCallable(
                    entry.name,
                    entry.parameters.map(clone),
                    clone(entry.returnType),
                    {
                        isAsync: entry.isAsync,
                        isStatic: entry.isStatic
                    },
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.documentation
                    },
                    entry.typeParameters
                )
            )
        }
        case IDLKind.Constructor: {
            const entry = get<IDLConstructor>(node)
            return make(
                createConstructor(
                    entry.parameters.map(clone),
                    entry.returnType ? clone(entry.returnType) : undefined,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Enum: {
            const entry = get<IDLEnum>(node)
            const cloned = createEnum(
                entry.name,
                entry.elements.map(clone),
                {
                    documentation: entry.documentation,
                    extendedAttributes: entry.extendedAttributes?.slice(),
                    fileName: entry.fileName
                }
            )
            cloned.elements.forEach(it => {
                it.parent = cloned
            })
            return make(cloned)
        }
        case IDLKind.EnumMember: {
            const entry = get<IDLEnumMember>(node)
            return make(
                createEnumMember(
                    entry.name,
                    entry.parent,
                    clone(entry.type),
                    entry.initializer,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Typedef: {
            const entry = get<IDLTypedef>(node)
            return make(
                createTypedef(
                    entry.name,
                    clone(entry.type),
                    entry.typeParameters,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.PrimitiveType: {
            return node
        }
        case IDLKind.ContainerType: {
            const type = get<IDLContainerType>(node)
            return make(
                createContainerType(
                    type.containerKind,
                    type.elementType.map(clone),
                    {
                        documentation: type.documentation,
                        extendedAttributes: type.extendedAttributes?.slice(),
                        fileName: type.fileName
                    }
                )
            )
        }
        case IDLKind.UnspecifiedGenericType: {
            const type = get<IDLUnspecifiedGenericType>(node)
            return make(
                createUnspecifiedGenericType(
                    type.name,
                    type.typeArguments.map(clone),
                    {
                        documentation: type.documentation,
                        extendedAttributes: type.extendedAttributes?.slice(),
                        fileName: type.fileName
                    }
                )
            )
        }
        case IDLKind.ReferenceType: {
            const type = get<IDLReferenceType>(node)
            return make(
                createReferenceType(
                    type.name,
                    type.typeArguments?.map(clone),
                    {
                        documentation: type.documentation,
                        extendedAttributes: type.extendedAttributes?.slice(),
                        fileName: type.fileName
                    }
                )
            )
        }
        case IDLKind.UnionType: {
            const type = get<IDLUnionType>(node)
            return make(
                createUnionType(
                    type.types.map(clone),
                    type.name,
                    {
                        documentation: type.documentation,
                        extendedAttributes: type.extendedAttributes?.slice(),
                        fileName: type.fileName
                    }
                )
            )
        }
        case IDLKind.TypeParameterType: {
            const type = get<IDLTypeParameterType>(node)
            return make(
                createTypeParameterReference(
                    type.name,
                    {
                        documentation: type.documentation,
                        extendedAttributes: type.extendedAttributes?.slice(),
                        fileName: type.fileName
                    }
                )
            )
        }
        case IDLKind.OptionalType: {
            const type = get<IDLOptionalType>(node)
            return make(
                createOptionalType(
                    clone(type.type),
                    {
                        documentation: type.documentation,
                        extendedAttributes: type.extendedAttributes?.slice(),
                        fileName: type.fileName
                    }
                )
            )
        }
        case IDLKind.Version: {
            const entry = get<IDLVersion>(node)
            return make(
                createVersion(
                    entry.value,
                    {
                        documentation: entry.documentation,
                        extendedAttributes: entry.extendedAttributes?.slice(),
                        fileName: entry.fileName
                    }
                )
            )
        }
        case IDLKind.Namespace: {
            const ns = get<IDLNamespace>(node)
            return make(
                createNamespace(
                    ns.name,
                    ns.members.map(clone),
                    {
                        documentation: ns.documentation,
                        extendedAttributes: ns.extendedAttributes?.slice(),
                        fileName: ns.fileName
                    }
                )
            )
        }
        case IDLKind.File: {
            const file = get<IDLFile>(node)
            return make(
                createFile(
                    file.entries.map(clone),
                    file.fileName,
                    file.packageClause,
                    {
                        documentation: file.documentation,
                        extendedAttributes: file.extendedAttributes?.slice(),
                        fileName: file.fileName
                    }
                )
            )
        }
    }
}

export function hasTypeParameters(entry:IDLEntry): boolean {
    let foundTypeParameter = false
    forEachChild(entry, n => {
        if (isTypeParameterType(n)) {
            foundTypeParameter = true
        }
    })
    return foundTypeParameter
}

export function escapeIDLKeyword(name: string): string {
    return name + (IDLKeywords.has(name) ? "_" : "")
}

export function unescapeKeyword(name: string): string {
    if (name.endsWith("_")) {
        const unwrapped = name.slice(0, -1)
        if (IDLKeywords.has(unwrapped)) return unwrapped
    }
    return name
}

type PrintedIndentInc = "[[indent-inc]]"
type PrintedIndentDec = "[[indent-dec]]"
type PrintedLine = undefined | string | PrintedIndentInc | PrintedIndentDec

const printedIndentInc: PrintedIndentInc = "[[indent-inc]]"
const printedIndentDec: PrintedIndentDec = "[[indent-dec]]"

type PrintTypeOptions = {
    [key: string]: any
}
export function printType(type: IDLType | IDLInterface | undefined, options?:PrintTypeOptions): string {
    if (!type) throw new Error("Missing type")
    if (isInterface(type)) return type.name
    if (isOptionalType(type)) return `(${printType(type.type)} or ${IDLUndefinedType.name})`
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type)) return `${type.containerKind}<${type.elementType.map(it => printType(it)).join(", ")}>`
    if (isReferenceType(type)) {
        const extAttrs = type.extendedAttributes ? Array.from(type.extendedAttributes) : []
        if (type.typeArguments)
            extAttrs.push({ name: IDLExtendedAttributes.TypeArguments, value: type.typeArguments.map(it=>printType(it)).join(",") })
        if (!extAttrs.length)
            return type.name;
        let res = `[${quoteAttributeValues(extAttrs)}] ${type.name}`;
        if (options?.bracketsAroundReferenceTypeWithExtAttrs)
            return `(${res})`;
        return res;
    }
    if (isUnspecifiedGenericType(type)) return `${type.name}<${type.typeArguments.map(it => printType(it)).join(", ")}>`
    if (isUnionType(type)) return `(${type.types.map(it => printType(it)).join(" or ")})`
    if (isTypeParameterType(type)) return type.name
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

export function printReturnType(type: IDLType | IDLInterface | undefined): string {
    return printType(type, {bracketsAroundReferenceTypeWithExtAttrs: true});
}

export function printParameters(parameters: IDLParameter[] | undefined): string {
    return parameters
        ?.map(it =>
            nameWithType(it, it.isVariadic, it.isOptional)
        )
        ?.join(", ") ?? ""
}

export function printConstructor(idl: IDLConstructor): PrintedLine[] {
    return [`constructor(${printParameters(idl.parameters)});`]
}

export function nameWithType(
    idl: IDLVariable,
    isVariadic: boolean = false,
    isOptional: boolean = false
): string {
    const type = printType(idl.type)
    const variadic = isVariadic ? "..." : ""
    const optional = isOptional ? "optional " : ""
    return `${optional}${type}${variadic} ${escapeIDLKeyword(idl.name!)}`
}

export function printConstant(idl: IDLConstant): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 1),
        `const ${nameWithType(idl)} = ${idl.value};`
    ]
}

export function printProperty(idl: IDLProperty): PrintedLine[] {
    const staticMod = idl.isStatic ? "static " : ""
    const readonlyMod = idl.isReadonly ? "readonly " : ""

    return [
        ...printExtendedAttributes(idl, 1),
        `${staticMod}${readonlyMod}attribute ${nameWithType(idl)};`
    ]
}

export function printExtendedAttributes(idl: IDLNode, indentLevel: number): PrintedLine[] {
    let typeParameters: string[]|undefined
    let typeArguments: IDLType[]|undefined
    switch(idl.kind) {
    case IDLKind.Interface:
        typeParameters = (idl as IDLInterface).typeParameters
        break
    case IDLKind.Callback:
    case IDLKind.Method:
    case IDLKind.Callable:
    case IDLKind.Constructor:
        typeParameters = (idl as IDLSignature).typeParameters
        break
    case IDLKind.Typedef:
        typeParameters = (idl as IDLTypedef).typeParameters
        break
    case IDLKind.ReferenceType:
        typeArguments = (idl as IDLReferenceType).typeArguments
        break
    case IDLKind.UnspecifiedGenericType:
        typeArguments = (idl as IDLUnspecifiedGenericType).typeArguments
        break
    }
    const attributes: IDLExtendedAttribute[] = Array.from(idl.extendedAttributes || [])
    if (typeParameters?.length)
        attributes.push({ name: IDLExtendedAttributes.TypeParameters, value: typeParameters.join(",") })
    if (typeArguments?.length)
        attributes.push({ name: IDLExtendedAttributes.TypeArguments, value: typeArguments.map(it=>printType(it)).join(",") })

    if (idl.documentation) {
        let docs: IDLExtendedAttribute = {
            name: IDLExtendedAttributes.Documentation,
            value: idl.documentation
        }
        attributes.push(docs)
    }
    const attrSpec = quoteAttributeValues(attributes)
    return attrSpec ? [`[${attrSpec}]`] : []
}

export const attributesToQuote = new Set([
    IDLExtendedAttributes.Documentation,
    IDLExtendedAttributes.DtsName,
    IDLExtendedAttributes.DtsTag,
    IDLExtendedAttributes.Import,
    IDLExtendedAttributes.Interfaces,
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

export function printFunction(idl: IDLFunction): PrintedLine[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        `${idl.isAsync ? "async " : ""}${printReturnType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`
    ]
}

export function printMethod(idl: IDLMethod): PrintedLine[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        `${idl.isStatic ? "static " : ""}${idl.isAsync ? "async " : ""}${printReturnType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`
    ]
}

export function printPackage(idl: IDLFile): PrintedLine[] {
    const effectiveClause = idl.packageClause.filter(it => !!it)
    if (!effectiveClause.length)
        return []
    return [
        `package ${effectiveClause.join(".")};`
    ]
}

export function printImport(idl: IDLImport): PrintedLine[] {
    const effectiveClause = idl.clause.filter(it => !!it)
    return [
        `import ${effectiveClause.join(".")||"NULL_IMPORT"}${idl.name ? " as " : ""}${idl.name};`
    ]
}

export function printNamespace(idl: IDLNamespace): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl,0),
        `namespace ${idl.name} {`,
        printedIndentInc,
        ...idl.members.map(member => printIDL(member)).flat(),
        printedIndentDec,
        "};"
    ]
}

export function printCallback(idl: IDLCallback): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 0),
        `callback ${idl.name} = ${printReturnType(idl.returnType)} (${printParameters(idl.parameters)});`
    ]
}

export function printScoped(idl: IDLEntry): PrintedLine[] {
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind === IDLKind.Interface) return printInterface(idl as IDLInterface)
    throw new Error(`Unexpected scoped: ${idl.kind} ${idl.name}`)
}

function printInterfaceInherit(idl: IDLInterface): string {
    if (idl.inheritance.length === 0) {
        return ""
    }
    const types = idl.inheritance.map(type => printType(type))
    return ": " + types.join(', ')
}

export function printInterface(idl: IDLInterface): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 0),
        `interface ${idl.name}${printInterfaceInherit(idl)} {`,
        // TODO: type system hack!
    ]
        .concat(printedIndentInc)
        .concat(idl.constructors.map(printConstructor).flat())
        .concat(idl.constants.map(printConstant).flat())
        .concat(idl.properties.map(printProperty).flat())
        .concat(idl.methods.map(printMethod).flat())
        .concat(idl.callables.map(printFunction).flat())
        .concat(printedIndentDec)
        .concat(["};"])
}

export function printEnumMember(idl: IDLEnumMember): PrintedLine[] {
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
    ]
}

export function printEnum(idl: IDLEnum, skipInitializers: boolean): PrintedLine[] {
    if (skipInitializers) {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `enum ${idl.name!} {`,
            printedIndentInc,
            ...idl.elements.map(it => `${it.name} ${(it.initializer !== undefined ? " /* " + it.initializer + " */" : "")}`),
            printedIndentDec,
            "};"
        ]
    } else {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `dictionary ${idl.name!} {`,
            printedIndentInc,
            ...idl.elements.map(printEnumMember) as any,
            printedIndentDec,
            "};"
        ].flat()
    }
}

export function printTypedef(idl: IDLTypedef): PrintedLine[] {
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `typedef ${printType(idl.type)} ${idl.name!};`
    ]
}

// TODO: use IndentedPrinter instead!
export function printIDL(idl: IDLNode, options?: Partial<IDLPrintOptions>): PrintedLine[] {
    if (idl.kind == IDLKind.Interface) return printInterface(idl as IDLInterface)
    if (idl.kind == IDLKind.Enum) return printEnum(idl as IDLEnum, options?.disableEnumInitializers ?? false)
    if (idl.kind == IDLKind.Typedef) return printTypedef(idl as IDLTypedef)
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind == IDLKind.Import) return printImport(idl as IDLImport)
    if (idl.kind == IDLKind.Namespace) return printNamespace(idl as IDLNamespace)
    if (idl.kind == IDLKind.Method) return printMethod(idl as IDLMethod)
    if (idl.kind == IDLKind.Const) return printConstant(idl as IDLConstant)

    if (options?.allowUnknownKinds) {
        return [`${IDLKind[idl.kind]} ${"name" in idl ? (idl as any).name : ""}`]
    } else {
        throw new Error(`unexpected kind: ${idl.kind}`)
    }
}

export interface IDLPrintOptions {
    verifyIdl: boolean
    disableEnumInitializers: boolean
    allowUnknownKinds: boolean
}

export function toIDLString(file: IDLFile, options: Partial<IDLPrintOptions>): string {
    let indent = 0

    const generated = printPackage(file)
    return generated.concat(file.entries
        .map(it => printIDL(it, options))
        .flat()
        .filter(isDefined)
        .filter(it => it.length > 0)
        .map(it => {
            if (it === printedIndentInc) {
                ++indent
                return undefined
            } else if (it === printedIndentDec) {
                --indent
                return undefined
            } else
                return indentedBy(it as string, indent)
        })
        .filter(isDefined)
    ).join("\n")
}

// throws validation error
export function verifyIDLString(source: string): true {
    webidl2.validate(webidl2.parse(source))
    return true
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

export function maybeUnwrapOptionalType(type: IDLType): IDLType {
    if (isOptionalType(type)) {
        return type.type
    }
    return type
}

export function maybeOptional(type: IDLType, optional = false): IDLType {
    if (optional) {
        return createOptionalType(type)
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

export function forEachFunction(node: IDLNode, cb: (node: IDLFunction) => void): void {
    forEachChild(node, child => {
        if (child.kind === IDLKind.Method || child.kind === IDLKind.Callable)
            cb(child as IDLFunction)
    })
}

export function asPromise(type?: IDLType): IDLContainerType | undefined {
    if (!type) return undefined
    if (!isContainerType(type)) return undefined
    const container = type as IDLContainerType
    if (!IDLContainerUtils.isPromise(container)) return undefined
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

export interface SignatureTag {index: number, name: string, value: string}

export function fetchSignatureTags(node: IDLSignature): SignatureTag[] {
    if (!node.extendedAttributes)
        return []
    return node.extendedAttributes
        .filter((ea) => ea.name === IDLExtendedAttributes.DtsTag)
        .map((ea):SignatureTag => {
            if (!ea.value)
                throw new Error('Empty DtsTag is not allowed')
            let indexNameValue = ea.value.split('|')
            if (indexNameValue.length === 1) {
                return {
                    index: 0, // zero is from the idl.DtsTag specification
                    name: 'type', // 'type' is from the idl.DtsTag specification
                    value: indexNameValue[0],
                }
            }
            if (indexNameValue.length !== 3)
                throw new Error(`Malformed DtsTag: "${ea.value}"`)
            return {
                index: Number(indexNameValue[0]),
                name: indexNameValue[1],
                value: indexNameValue[2],
            }
        })
        .sort((a, b) => a.index - b.index)
}

export function mixMethodParametersAndTags(node: IDLSignature) : (IDLParameter | SignatureTag)[] {
    let mix: (IDLParameter | SignatureTag)[] = node.parameters.slice(0)
    for (const tag of fetchSignatureTags(node))
        mix.splice(tag.index, 0, tag)
    return mix
}

export function isHandwritten(decl: IDLEntry): boolean {
    return hasExtAttribute(decl, IDLExtendedAttributes.HandWrittenImplementation)
}

export function isStringEnum(decl: IDLEnum): boolean {
    return decl.elements.some(e => e.type === IDLStringType)
}

export function linearizeNamespaceMembers(entries: IDLEntry[]) {
    const linearized: IDLEntry[] = []
    for (const entry of entries) {
        linearized.push(entry)
        if (isNamespace(entry))
            linearized.push(...linearizeNamespaceMembers(entry.members))
    }
    return linearized
}

export function extremumOfOrdinals(enumEntry: IDLEnum): {low: number, high: number} {
    let low: number = 0
    let high: number = 0
    enumEntry.elements.forEach((member, index) => {
        let value = index
        if ((typeof member.initializer === 'number') && !isStringEnum(enumEntry)) {
            value = member.initializer
        }
        if (low > value) low = value
        if (high < value) high = value
    })
    return {low, high}
}
