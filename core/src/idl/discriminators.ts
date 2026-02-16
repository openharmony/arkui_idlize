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

import { isDefined, stringOrNone } from "../util"
import { IDLNode, IDLFile, IDLKind, IDLPrimitiveType, IDLContainerType, IDLReferenceType, IDLEnum, IDLEnumMember, IDLUnionType, IDLTypeParameterType, IDLInterface, IDLImport, IDLCallable, IDLMethod, IDLParameter, IDLConstructor, IDLProperty, IDLCallback, IDLInterfaceSubkind, IDLConstant, IDLTypedef, IDLType, IDLEntry, IDLNamespace, IDLExtendedAttributes, IDLOptionalType, IDLVersion, IDLNamedNode, IDLPrimitiveTypeKind } from "./node"

/////////////////////////////////////////////////////////////////
// BASICS

export function isFile(node: IDLNode): node is IDLFile {
    return node.kind === IDLKind.File
}

export function isPrimitiveType(type: IDLNode, name?: IDLPrimitiveTypeKind): type is IDLPrimitiveType {
    return type.kind == IDLKind.PrimitiveType && (name === undefined || (type as IDLPrimitiveType).name === name)
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

export function isNamedNode(type: IDLNode): type is IDLNamedNode {
    return "_idlNamedNodeBrand" in type
}

export const IDLContainerUtils = {
    isRecord: (x: IDLNode) => isContainerType(x) && x.containerKind === 'record',
    isSequence: (x: IDLNode) => isContainerType(x) && x.containerKind === 'sequence',
    isPromise: (x: IDLNode) => isContainerType(x) && x.containerKind === 'Promise'
}

/////////////////////////////////////////////////////////////////
// EXTENDED ATTRIBUTES

export function hasExtAttribute(node: IDLNode, attribute: IDLExtendedAttributes): boolean {
    return node.extendedAttributes?.find((it) => it.name == attribute) != undefined
}

export function getExtAttribute(node: IDLNode, name: IDLExtendedAttributes): stringOrNone {
    return node.extendedAttributes?.find(it => it.name === name)?.value
}

export function removeExtAttribute(node: IDLNode, name: IDLExtendedAttributes): void {
    if (node.extendedAttributes) {
        node.extendedAttributes = node.extendedAttributes.filter(it => it.name !== name)
    }
}

export function getExtAttributeTypesValue(node: IDLNode, name: IDLExtendedAttributes): IDLType[] | undefined {
    return node.extendedAttributes?.find(it => it.name === name)?.typesValue
}

export function updateExtAttribute(node: IDLNode, name: IDLExtendedAttributes, value: string | undefined) {
    removeExtAttribute(node, name)
    node.extendedAttributes ??= []
    node.extendedAttributes.push({ name, value })
}

/////////////////////////////////////////////////////////////////
// ADVANCED

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

const nodesWithoutIDLFiles = new Set<string>()

export function getFileFor(node: IDLNode): IDLFile | undefined {
    let iterator: IDLNode | undefined = node
    while (iterator) {
        if (isFile(iterator))
            return iterator
        iterator = iterator.parent
    }
    const name = getQualifiedName(node, "namespace.name")
    if (!nodesWithoutIDLFiles.has(name)) {
        console.warn(`Node ${name} does not have IDLFile in parents`)
        nodesWithoutIDLFiles.add(name)
    }
    return undefined
}

export function getPackageClause(node: IDLNode): string[] {
    const file = getFileFor(node)
    if (!file)
        throw new Error(`Can not find parent file for node ${node.kind}`)
    return file?.packageClause ?? []
}

export function getPackageName(node: IDLNode): string {
    return getPackageClause(node).join(".")
}

export function getPackageNameSafe(node: IDLNode): string | undefined {
    try {
        return getPackageName(node)
    } catch (_) {
        return undefined
    }
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

export function deriveQualifiedNameFrom(name: string, from: IDLNode): string {
    return [...getPackageClause(from), ...getNamespacesPathFor(from).map(it => it.name), name].join(".")
}

export function getQualifiedName(a: IDLNode, pattern: QNPattern): string {
    const result: string[] = []
    if ("package.namespace.name" === pattern)
        result.push(...getPackageClause(a), ...getNamespacesPathFor(a).map(it => it.name))
    else if ("namespace.name" === pattern)
        result.push(...getNamespacesPathFor(a).map(it => it.name))

    const ownName = (node: IDLNode | undefined): string[] => {
        if (!node || isFile(node))
            return []
        if (isNamespace(node))
            return node === a ? [node.name] : []
        if (isInterface(node) || isTypedef(node) || isCallback(node) || isEnum(node))
            return [node.name]
        if (isProperty(node) || isMethod(node) || isConstant(node))
            return [...ownName(node.parent), node.name]
        if (isCallable(node))
            return [...ownName(node.parent), "invoke"]
        if (isConstructor(node))
            return [...ownName(node.parent), "constructor"]
        throw new Error(`Can not calculate own name for node ${node.kind}`)
    }
    result.push(...ownName(a))

    return result.join(".")
}

export function getFQName(a: IDLNode): string {
    return getQualifiedName(a, "package.namespace.name")
}

export function getFQNameSafe(a: IDLNode): string | undefined {
    try {
        return getFQName(a)
    } catch (_) {
        return undefined
    }
}

export function fetchNamespaceFrom(pointOfView?: IDLNode): IDLNamespace | undefined {
    let node: IDLNode | undefined = pointOfView
    while (node) {
        if (isNamespace(node))
            return node
        node = node.parent
    }
    return undefined
}

