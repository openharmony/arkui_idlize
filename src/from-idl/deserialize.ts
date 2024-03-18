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
    createContainerType, createNumberType, createUnionType, IDLCallback, IDLConstructor, IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLInterface, IDLKind,
    IDLMethod, IDLParameter, IDLPrimitiveType, IDLProperty, IDLType, IDLTypedef
} from "../idl"
import { isDefined, stringOrNone } from "../util"

export function toIDLNode(file: string, node: webidl2.IDLRootType): IDLEntry {
    if (isEnum(node)) {
        return toIDLEnum(file, node)
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
    throw new Error(`unexpected node type: ${toString(node)}`)
}


function isCallable(node: webidl2.IDLInterfaceMemberType): boolean {
    return node.extAttrs.some(it => it.name == "Invoke")
}

function toIDLInterface(file: string, node: webidl2.InterfaceType): IDLInterface {
    return {
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
            .map(it => toIDLMethod(file, it)),
    }
}

function toIDLType(file: string, type: webidl2.IDLTypeDescription | string): IDLType {
    if (typeof type === "string") {
        return {
            name: type,
            fileName: file,
            kind: IDLKind.ReferenceType
        }
    }
    if (isUnionTypeDescription(type)) {
        const unionTypes = type.idlType
        return createUnionType(unionTypes
            .map(it => toIDLType(file, it))
            .filter(isDefined))
    }
    if (isSingleTypeDescription(type)) {
        return {
            name: type.idlType,
            fileName: file,
            kind: IDLKind.ReferenceType,
            extendedAttributes: toExtendedAttributes(type.extAttrs)
        }
    }
    if (isSequenceTypeDescription(type) || isPromiseTypeDescription(type) || isRecordTypeDescription(type)) {
        return createContainerType(
            type.generic,
            toIDLType(file, type.idlType[0])
        )
    }

    throw new Error(`unexpected type: ${toString(type)}`)
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
        returnType: toIDLType(file, node.idlType),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        kind: IDLKind.Method
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
        type: toIDLType(file, node.idlType),
        name: node.name
    }
}

function toIDLCallback(file: string, node: webidl2.CallbackType): IDLCallback {
    return {
        kind: IDLKind.Callback,
        name: node.name,
        fileName: file,
        parameters: node.arguments.map(it => toIDLParameter(file, it)),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        documentation: makeDocs(node),
        returnType: toIDLType(file, node.idlType)
    }
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
    return {
        kind: IDLKind.Enum,
        name: node.name,
        documentation: makeDocs(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        fileName: file,
        elements: node.members.map(it => toIDLEnumMember(file, it))
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

function toIDLEnumMember(file: string, node: webidl2.DictionaryMemberType): IDLEnumMember {
    let initializer = undefined
    if (node.default?.type == "string") {
        initializer = node.default?.value
    } else if (node.default?.type == "number") {
        initializer = +(node.default?.value)
    } else if (node.default == null) {
        initializer = undefined
    } else {
        throw new Error(`Unrepresentable enum initializer: ${node.default}`)
    }
    return {
        kind: IDLKind.EnumMember,
        name: node.name,
        type: toIDLType(file, node.idlType) as IDLPrimitiveType,
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        initializer: initializer
    }
}

function toExtendedAttributes(extAttrs: webidl2.ExtendedAttribute[]): IDLExtendedAttribute[]|undefined {
    // TODO: be smarter about RHS.
    return extAttrs.map(it => {
        return {
            name: it.name,
            value: it.rhs?.value ? it.rhs?.value : undefined
        } as IDLExtendedAttribute
    })
}

function makeDocs(node: webidl2.AbstractBase): stringOrNone {
    let docs = undefined
    node.extAttrs.forEach(it => {
        if (it.name == "Documentation") docs = it.rhs?.value
    })
    return docs
}

function toIDLEnum(file: string, node: webidl2.EnumType): IDLEnum {
    return {
        kind: IDLKind.Enum,
        name: node.name,
        fileName: file,
        documentation: makeDocs(node),
        extendedAttributes: toExtendedAttributes(node.extAttrs),
        elements: node.values.map((it: { value: string }) => {
            return {
                kind: IDLKind.EnumMember,
                name: it.value,
                type: createNumberType(),
                initializer: undefined
            }
        })
    }
}
