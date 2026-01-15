/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Location } from "../diagnostictypes"

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
    Annotations = "Annotations",
    Async = "Async",
    AsRecord = "AsRecord",
    CallSignature = "CallSignature",
    CommonMethod = "CommonMethod",
    Component = "Component",
    ComponentInterface = "ComponentInterface",
    ComponentModifier = "ComponentModifier",
    DataClass = "DataClass",
    Deprecated = "Deprecated",
    Documentation = "Documentation",
    DtsName = "DtsName",
    DtsTag = "DtsTag",
    Entity = "Entity",
    Extends = "Extends",
    ExtensionMethod = "ExtensionMethod",
    Import = "Import",
    DefaultExport = "DefaultExport",
    IndexSignature = "IndexSignature",
    Interfaces = "Interfaces",
    NativeModule = "NativeModule",
    Optional = "Optional",
    UnionOnlyNull = "OptionalOnlyNull",
    UnionWithNull = "OptionalWithNull",
    OriginalEnumMemberName = "OriginalEnumMemberName",
    OriginalGenericName = "OriginalGenericName",
    Predefined = "Predefined",
    Protected = "Protected",
    Abstract = "Abstract",
    Synthetic = "Synthetic",
    Throws = "Throws",
    TraceKey = "TraceKey",
    TypeAnnotations = "TypeAnnotations",
    TypeParametersDefaults = "TypeParametersDefaults",
    VerbatimDts = "VerbatimDts",
    HandWrittenImplementation = "HandWrittenImplementation",
    ExtraMethod = "ExtraMethod",
    OverloadAlias = "OverloadAlias",
    OverloadPriority = "OverloadPriority",
    TransformOnSerialize = "TransformOnSerialize",
}

export enum IDLAccessorAttribute {
    Getter = "Getter",
    Setter = "Setter",
}

export interface IDLExtendedAttribute {
    name: string
    value?: string
    typesValue?: IDLType[]
    nameLocation?: Location
    valueLocation?: Location
}

export interface IDLNode {
    _idlNodeBrand: any
    kind: IDLKind
    parent?: IDLNode
    fileName?: string
    extendedAttributes?: IDLExtendedAttribute[]
    documentation?: string
    nodeLocation?: Location
    nameLocation?: Location
    valueLocation?: Location
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
    value?: string
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
