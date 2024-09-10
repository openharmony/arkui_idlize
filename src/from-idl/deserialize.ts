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
import {
    isAttribute, isCallback, isClass, isConstructor, isDictionary, isEnum, isInterface, isOperation, isOptional,
    isPromiseTypeDescription,
    isRecordTypeDescription,
    isSequenceTypeDescription,
    isSingleTypeDescription, isTypedef, isUnionTypeDescription
} from "./webidl2-utils"
import { toString } from "./toString"
import {
    createAnyType,
    createBooleanType,
    createContainerType, createNullType, createNumberType, createStringType, createUndefinedType, createUnionType, createVoidType, hasExtAttribute, IDLCallable, IDLCallback, IDLConstructor, IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLImport, IDLInterface, IDLKind,
    IDLMethod, IDLModuleType, IDLPackage, IDLParameter, IDLPrimitiveType, IDLProperty, IDLType, IDLTypedef
} from "../idl"
import { isDefined, stringOrNone } from "../util"

const syntheticTypes = new Map<string, IDLType>()

function addSyntheticType(name: string, type: IDLType) {
    if (syntheticTypes.has(name))
        console.log(`WARNING: duplicate synthetic type name "${name}"`) ///throw?
    syntheticTypes.set(name, type)
}

export function resolveSyntheticType(name: string | undefined): IDLType | undefined {
    return name ? syntheticTypes.get(name) : undefined
}

export function toIDLNode(file: string, node: webidl2.IDLRootType): IDLEntry {
    if (isEnum(node)) {
        return toIDLEnum(file, node)
    }
    if (isPackage(node)) {
        return toIDLPackage(node)
    }
    if (isImport(node)) {
        return toIDLImport(node)
    }
    if (isClass(node)) {
        return toIDLInterface(file, node)
    }
    if (isInterface(node)) {
        return toIDLInterface(file, node)
    }
    if (isCallback(node)) {
        return toIDLCallback(file, node)
    }
    if (isTypedef(node)) {
        return toIDLTypedef(file, node)
    }
    if (isDictionary(node)) {
        return toIDLDictionary(file, node)
    }
    if (isNamespace(node)) {
        return toIDLNamespace(file, node)
    }
    throw new Error(`unexpected node type: ${toString(node)}`)
}


function isNamespace(node: webidl2.IDLRootType): node is webidl2.NamespaceType {
    return node.type === 'namespace'
}

function isPackage(node: webidl2.IDLRootType): node is webidl2.PackageType {
    return node.type === 'package'
}

function isImport(node: webidl2.IDLRootType): node is webidl2.ImportType {
    return node.type === 'import'
}

function isCallable(node: webidl2.IDLInterfaceMemberType): boolean {
    return node.extAttrs.some(it => it.name == "Invoke")
}

function toIDLPackage(node: webidl2.PackageType): IDLPackage {
    console.log(Object.keys(node))
    const result: IDLPackage = {
        kind: IDLKind.Package,
        name: node.nameValue
    }
    return result
}

function toIDLImport(node: webidl2.ImportType): IDLImport {
    // console.log(node)
    const result: IDLImport = {
        kind: IDLKind.Import,
        name: node.nameValue
    }
    return result
}

function toIDLInterface(file: string, node: webidl2.InterfaceType): IDLInterface {
    const result: IDLInterface = {
        kind: isClass(node) ? IDLKind.Class : IDLKind.Interface,
        name: node.name,
        fileName: file,
        documentation: makeDocs(node),
        inheritance: [node.inheritance]
            .filter(isDefined)
            .map(it => toIDLType(file, it)),
        constructors: node.members
            .filter(isConstructor)
            .map(it => toIDLConstructor(file, it)),
        constants: [],
        properties: node.members
            .filter(isAttribute)
            .map(it => toIDLProperty(file, it)),
        methods: node.members
            .filter(isOperation)
            .filter(it => !isCallable(it))
            .map(it => toIDLMethod(file, it)),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        callables: node.members
            .filter(isOperation)
            .filter(it => isCallable(it))
            .map(it => toIDLCallable(file, it)),
    }
    if (node.extAttrs.find(it => it.name === "Synthetic"))
        addSyntheticType(node.name, result)
    return result
}

function extractTypeArguments(extAttrs: webidl2.ExtendedAttribute[] | undefined): IDLExtendedAttribute[] | undefined {
    for (let attr of extAttrs ?? []) {
        if (attr.name === "TypeArguments")
            return [{"name": "TypeArguments", value: toExtendedAttributeValue(attr)}]
    }
    return undefined
}

function toIDLType(file: string, type: webidl2.IDLTypeDescription | string, extAttrs?: webidl2.ExtendedAttribute[]): IDLType {
    if (typeof type === "string") {
        return {
            name: type,
            fileName: file,
            kind: IDLKind.ReferenceType,
            extendedAttributes: extractTypeArguments(extAttrs)
        }
    }
    if (isUnionTypeDescription(type)) {
        return createUnionType(type.idlType
            .map(it => toIDLType(file, it))
            .filter(isDefined))
    }
    if (isSingleTypeDescription(type)) {
        switch (type.idlType) {
            case "any": return createAnyType()
            case "boolean": return createBooleanType()
            case "null_": return createNullType()
            case "number": return createNumberType()
            case "DOMString": return createStringType()
            case "undefined": return createUndefinedType()
            case "void_": return createVoidType()
        }
        const combinedExtAttrs = extAttrs
            ? type.extAttrs ? extAttrs.concat(type.extAttrs) : extAttrs
            : type.extAttrs
        return {
            name: type.idlType,
            fileName: file,
            kind: IDLKind.ReferenceType,
            extendedAttributes: toExtendedAttributes(combinedExtAttrs)
        }
    }
    if (isSequenceTypeDescription(type) || isPromiseTypeDescription(type) || isRecordTypeDescription(type)) {
        return createContainerType(
            type.generic,
            type.idlType.map(it => toIDLType(file, it))
        )
    }

    throw new Error(`unexpected type: ${toString(type)}`)
}


function toIDLCallable(file: string, node: webidl2.OperationMemberType): IDLCallable {
    if (!node.idlType) {
        throw new Error(`method with no type ${toString(node)}`)
    }
    return {
        name: node.name ?? "",
        isStatic: node.special === "static",
        parameters: node.arguments.map(it => toIDLParameter(file, it)),
        documentation: makeDocs(node),
        returnType: toIDLType(file, node.idlType, node.extAttrs),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        kind: IDLKind.Callable,
    }
}

function toIDLMethod(file: string, node: webidl2.OperationMemberType): IDLMethod {
    if (!node.idlType) {
        throw new Error(`method with no type ${toString(node)}`)
    }
    return {
        name: node.name ?? "",
        isStatic: node.special === "static",
        parameters: node.arguments.map(it => toIDLParameter(file, it)),
        documentation: makeDocs(node),
        returnType: toIDLType(file, node.idlType, node.extAttrs),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        kind: IDLKind.Method,
        isOptional: isOptional(node)
    }
}

function toIDLConstructor(file: string, node: webidl2.ConstructorMemberType): IDLConstructor {
    return {
        parameters: node.arguments.map(it => toIDLParameter(file, it)),
        documentation: makeDocs(node),
        kind: IDLKind.Constructor
    }
}

function toIDLParameter(file: string, node: webidl2.Argument): IDLParameter {
    return {
        kind: IDLKind.Parameter,
        fileName: file,
        isVariadic: node.variadic,
        isOptional: node.optional,
        type: toIDLType(file, node.idlType, node.extAttrs),
        name: node.name
    }
}

function toIDLCallback(file: string, node: webidl2.CallbackType): IDLCallback {
    const result: IDLCallback = {
        kind: IDLKind.Callback,
        name: node.name,
        fileName: file,
        parameters: node.arguments.map(it => toIDLParameter(file, it)),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        documentation: makeDocs(node),
        returnType: toIDLType(file, node.idlType)
    }
    if (node.extAttrs.find(it => it.name === "Synthetic"))
        addSyntheticType(node.name, result)
    return result
}

function toIDLTypedef(file: string, node: webidl2.TypedefType): IDLTypedef {
    return {
        kind: IDLKind.Typedef,
        type: toIDLType(file, node.idlType),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        documentation: makeDocs(node),
        fileName: file,
        name: node.name
    }
}

function toIDLDictionary(file: string, node: webidl2.DictionaryType): IDLEnum {
    const result: IDLEnum = {
        kind: IDLKind.Enum,
        name: node.name,
        documentation: makeDocs(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        fileName: file,
        elements: []
    }
    result.elements = node.members.map(it => toIDLEnumMember(file, it, result))
    return result
}

function toIDLNamespace(file: string, node: webidl2.NamespaceType): IDLModuleType {

    return {
        kind: IDLKind.ModuleType,
        name: node.name,
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        fileName: file
    }
}

function toIDLProperty(file: string, node: webidl2.AttributeMemberType): IDLProperty {
    return {
        kind: IDLKind.Property,
        name: node.name,
        documentation: makeDocs(node),
        fileName: file,
        type: toIDLType(file, node.idlType),
        isReadonly: node.readonly,
        isStatic: node.special === "static",
        isOptional: isOptional(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs)
    }
}

function toIDLEnumMember(file: string, node: webidl2.DictionaryMemberType, parent: IDLEnum): IDLEnumMember {
    let initializer = undefined
    if (node.default?.type == "string") {
        initializer = node.default?.value
    } else if (node.default?.type == "number") {
        initializer = +(node.default?.value)
    } else if (node.default == null) {
        initializer = undefined
    } else {
        throw new Error(`Not representable enum initializer: ${node.default}`)
    }
    return {
        kind: IDLKind.EnumMember,
        name: node.name,
        parent,
        type: toIDLType(file, node.idlType) as IDLPrimitiveType,
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        initializer
    }
}

function toExtendedAttributes(extAttrs: webidl2.ExtendedAttribute[]): IDLExtendedAttribute[]|undefined {
    return extAttrs.map(it => {
        return { name: it.name, value: toExtendedAttributeValue(it) }
    })
}

function toExtendedAttributeValue(attr: webidl2.ExtendedAttribute): stringOrNone {
    // TODO: be smarter about RHS.
    if (attr.rhs?.value instanceof Array)
        return attr.rhs.value.map(v => v.value).join(",")
    const value = attr.rhs?.value
    if (value?.startsWith('"'))
        return value.slice(1, -1)
    return value
}

function makeDocs(node: webidl2.AbstractBase): stringOrNone {
    let docs = undefined
    node.extAttrs.forEach(it => {
        if (it.name == "Documentation") docs = it.rhs?.value
    })
    return docs
}

function toIDLEnum(file: string, node: webidl2.EnumType): IDLEnum {
    const result: IDLEnum = {
        kind: IDLKind.Enum,
        name: node.name,
        fileName: file,
        documentation: makeDocs(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        elements: []
    }
    result.elements = node.values.map((it: { value: string }) => {
        return {
            kind: IDLKind.EnumMember,
            name: it.value,
            parent: result,
            type: createNumberType(),
            initializer: undefined
        }
    })
    return result
}
