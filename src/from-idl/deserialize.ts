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
import * as idl from "../idl"
import { isDefined, stringOrNone, typeName } from "../util"
import { createInterface } from "readline"

const syntheticTypes = new Map<string, idl.IDLEntry>()

export function addSyntheticType(name: string, type: idl.IDLEntry) {
    if (syntheticTypes.has(name))
        console.log(`WARNING: duplicate synthetic type name "${name}"`) ///throw?
    syntheticTypes.set(name, type)
} // check

export function resolveSyntheticType(type: idl.IDLReferenceType): idl.IDLEntry | undefined {
    return syntheticTypes.get(type.name)
}

export function toIDLNode(file: string, node: webidl2.IDLRootType): idl.IDLEntry {
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

function toIDLPackage(node: webidl2.PackageType): idl.IDLPackage {
    return idl.createPackage(node.nameValue)
}

function toIDLImport(node: webidl2.ImportType): idl.IDLImport {
    // console.log(node)
    return idl.createImport(node.nameValue)
}

function toIDLInterface(file: string, node: webidl2.InterfaceType): idl.IDLInterface {
    const result = idl.createInterface(
        node.name,
        isClass(node) ? idl.IDLKind.Class : idl.IDLKind.Interface,
        (()=>{
            if (!node.inheritance)
                return []
            const parentTypeArgs = extractTypeArguments(file, node.inheritanceExtAttrs ?? [], idl.IDLExtendedAttributes.TypeArguments)
            const parentType = idl.createReferenceType(node.inheritance, parentTypeArgs)
            parentType.fileName = file
            if (node.inheritanceExtAttrs)
                parentType.extendedAttributes = toExtendedAttributes(node.inheritanceExtAttrs)?.filter(it => it.name !== idl.IDLExtendedAttributes.TypeArguments)
            return [parentType]
        })(),
        node.members
            .filter(isConstructor)
            .map(it => toIDLConstructor(file, it)),
        [],
        node.members
            .filter(isAttribute)
            .map(it => toIDLProperty(file, it)),
        node.members
            .filter(isOperation)
            .filter(it => !isCallable(it))
            .map(it => toIDLMethod(file, it)),
        node.members
            .filter(isOperation)
            .filter(it => isCallable(it))
            .map(it => toIDLCallable(file, it)),
        findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","),
        {
            fileName: file,
            documentation: makeDocs(node),
            extendedAttributes: toExtendedAttributes(node.extAttrs),
        }
    )
    if (result.inheritance.length && idl.isReferenceType(result.inheritance[0]))
        result.inheritance[0].typeArguments = extractTypeArguments(file, node.extAttrs, idl.IDLExtendedAttributes.TypeArguments)
    if (node.extAttrs.find(it => it.name === "Synthetic"))
        addSyntheticType(node.name, result)
    return result
}

function extractTypeArguments(file: string,
    extAttrs: webidl2.ExtendedAttribute[] | undefined,
    attribute: idl.IDLExtendedAttributes
): idl.IDLType[] | undefined {
    const attr = extAttrs?.find(it => it.name === attribute)
    if (!attr)
        return undefined
    let value = toExtendedAttributeValue(attr)!
    return value
        ?.split(",")  // TODO need real parsing here. What about "<T, Map<K, Callback<K,R>>, U>"
        ?.map(it => toIDLType(file, it))
}

function toIDLType(file: string, type: webidl2.IDLTypeDescription | string, extAttrs?: webidl2.ExtendedAttribute[]): idl.IDLType {
    if (typeof type === "string") {
        // is it IDLStringType?
        const refType = idl.createReferenceType(type)
        refType.fileName = file
        refType.typeArguments = extractTypeArguments(file, extAttrs, idl.IDLExtendedAttributes.TypeArguments)
        return refType
    }
    if (type.nullable) {
        return idl.createOptionalType(
            toIDLType(file, { ...type, nullable: false }, extAttrs)            
        )
    }
    if (isUnionTypeDescription(type)) {
        return idl.createUnionType(type.idlType
            .map(it => toIDLType(file, it))
            .filter(isDefined))
    }
    if (isSingleTypeDescription(type)) {
        switch (type.idlType) {
            case idl.IDLUnknownType.name: return idl.IDLUnknownType
            case idl.IDLObjectType.name: return idl.IDLObjectType
            case idl.IDLAnyType.name: return idl.IDLAnyType
            case idl.IDLBooleanType.name: return idl.IDLBooleanType
            case idl.IDLNullType.name: return idl.IDLNullType
            case idl.IDLNumberType.name: return idl.IDLNumberType
            case idl.IDLStringType.name: return idl.IDLStringType
            case idl.IDLUndefinedType.name: return idl.IDLUndefinedType
            case idl.IDLVoidType.name: return idl.IDLVoidType
            case idl.IDLI8Type.name: return idl.IDLI8Type
            case idl.IDLU8Type.name: return idl.IDLU8Type
            case idl.IDLI16Type.name: return idl.IDLI16Type
            case idl.IDLU16Type.name: return idl.IDLU16Type
            case idl.IDLI32Type.name: return idl.IDLI32Type
            case idl.IDLU32Type.name: return idl.IDLU32Type
            case idl.IDLI64Type.name: return idl.IDLI64Type
            case idl.IDLU64Type.name: return idl.IDLU64Type
            case idl.IDLF32Type.name: return idl.IDLF32Type
            case idl.IDLF64Type.name: return idl.IDLF64Type
            case idl.IDLPointerType.name: return idl.IDLPointerType

        }
        const combinedExtAttrs = (type.extAttrs ?? []).concat(extAttrs ?? [])
        const idlRefType = idl.createReferenceType(type.idlType)
        idlRefType.fileName = file
        idlRefType.typeArguments = extractTypeArguments(file, combinedExtAttrs, idl.IDLExtendedAttributes.TypeArguments)
        idlRefType.extendedAttributes = toExtendedAttributes(combinedExtAttrs)
        return idlRefType
    }
    if (isSequenceTypeDescription(type) || isPromiseTypeDescription(type) || isRecordTypeDescription(type)) {
        return idl.createContainerType(
            type.generic,
            type.idlType.map(it => toIDLType(file, it))
        )
    }

    throw new Error(`unexpected type: ${toString(type)}`)
}


function toIDLCallable(file: string, node: webidl2.OperationMemberType): idl.IDLCallable {
    if (!node.idlType) {
        throw new Error(`method with no type ${toString(node)}`)
    }
    const returnType = toIDLType(file, node.idlType, node.extAttrs)
    if (idl.isReferenceType(returnType)) {
        const returnTypeArgs = extractTypeArguments(file, node.extAttrs, idl.IDLExtendedAttributes.TypeArguments)
        returnType.typeArguments = returnTypeArgs
    }
    return idl.createCallable(
        node.name ?? "",
        node.arguments.map(it => toIDLParameter(file, it)),
        returnType,
        {
            isStatic: node.special === "static",
            isAsync: node.async,
        }, {
            documentation: makeDocs(node),
            extendedAttributes: toExtendedAttributes(node.extAttrs),
        }, findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","),
    )
}

function toIDLMethod(file: string, node: webidl2.OperationMemberType): idl.IDLMethod {
    if (!node.idlType) {
        throw new Error(`method with no type ${toString(node)}`)
    }
    const returnType = toIDLType(file, node.idlType, node.extAttrs)
    if (idl.isReferenceType(returnType))
        returnType.typeArguments = extractTypeArguments(file, node.extAttrs, idl.IDLExtendedAttributes.TypeArguments)
    return idl.createMethod(
        node.name ?? "",
        node.arguments.map(it => toIDLParameter(file, it)),
        returnType,
        {
            isStatic: node.special === "static",
            isAsync: node.async,
            isOptional: isOptional(node),
        }, {
            documentation: makeDocs(node),
            extendedAttributes: toExtendedAttributes(node.extAttrs),
        }, findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","),
    )
}

function toIDLConstructor(file: string, node: webidl2.ConstructorMemberType): idl.IDLConstructor {
    return idl.createConstructor(
        node.arguments.map(it => toIDLParameter(file, it)),
        undefined, {
        documentation: makeDocs(node),
    })
}

function toIDLParameter(file: string, node: webidl2.Argument): idl.IDLParameter {
    return idl.createParameter(
        node.name,
        toIDLType(file, node.idlType, node.extAttrs),
        node.optional,
        node.variadic, {
        fileName: file,
    })
}

function toIDLCallback(file: string, node: webidl2.CallbackType): idl.IDLCallback {
    const result = idl.createCallback(
        node.name,
        node.arguments.map(it => toIDLParameter(file, it)),
        toIDLType(file, node.idlType), {
        fileName: file,
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        documentation: makeDocs(node),
    })
    if (node.extAttrs.find(it => it.name === "Synthetic"))
        addSyntheticType(node.name, result)
    return result
}

function toIDLTypedef(file: string, node: webidl2.TypedefType): idl.IDLTypedef {
    return idl.createTypedef(
        node.name,
        toIDLType(file, node.idlType),
        findExtendedAttribute(node.extAttrs, idl.IDLExtendedAttributes.TypeParameters)?.split(","), {
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        documentation: makeDocs(node),
        fileName: file,
    })
}

function toIDLDictionary(file: string, node: webidl2.DictionaryType): idl.IDLEnum {
    const result = idl.createEnum(
        node.name,
        [], {
        documentation: makeDocs(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        fileName: file,
    })
    result.elements = node.members.map(it => toIDLEnumMember(file, it, result))
    return result
}

function toIDLNamespace(file: string, node: webidl2.NamespaceType): idl.IDLModule {
    return idl.createModuleType(
        node.name,
        toExtendedAttributes(node.extAttrs),
        file
    )
}

function toIDLProperty(file: string, node: webidl2.AttributeMemberType): idl.IDLProperty {
    return idl.createProperty(
        node.name,
        toIDLType(file, node.idlType),
        node.readonly,
        node.special === "static",
        isOptional(node), {
        documentation: makeDocs(node),
        fileName: file,
        extendedAttributes: toExtendedAttributes(node.extAttrs)
    })
}

function toIDLEnumMember(file: string, node: webidl2.DictionaryMemberType, parent: idl.IDLEnum): idl.IDLEnumMember {
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
    return idl.createEnumMember(
        node.name,
        parent,
        toIDLType(file, node.idlType) as idl.IDLPrimitiveType,
        initializer, {
        extendedAttributes: toExtendedAttributes(node.extAttrs),
    })
}

function toExtendedAttributes(extAttrs: webidl2.ExtendedAttribute[]): idl.IDLExtendedAttribute[] | undefined {
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

function toIDLEnum(file: string, node: webidl2.EnumType): idl.IDLEnum {
    const result = idl.createEnum(
        node.name,
        [], {
        fileName: file,
        documentation: makeDocs(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
    })
    result.elements = node.values.map((it: { value: string }) => idl.createEnumMember(
        it.value,
        result,
        idl.IDLNumberType,
        undefined
    ))
    return result
}

function findExtendedAttribute(extAttrs: webidl2.ExtendedAttribute[], name: idl.IDLExtendedAttributes): stringOrNone {
    const attr = extAttrs.find(it => it.name === name)
    return attr ? toExtendedAttributeValue(attr) : undefined
}