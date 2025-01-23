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
import { ExtendedAttribute } from "webidl2"
import { IDLEntity } from "../idl"

export function isEnum(node: webidl2.IDLRootType): node is webidl2.EnumType {
    return node.type === "enum"
}

export function isInterface(node: webidl2.IDLRootType): node is webidl2.InterfaceType {
    return node.type === "interface"
}

export function isImport(node: webidl2.IDLRootType): node is webidl2.ImportType {
    return node.type === "import"
}

export function isPackage(node: webidl2.IDLRootType): node is webidl2.PackageType {
    return node.type === "package"
}

export function isClass(node: webidl2.IDLRootType): node is webidl2.InterfaceType {
    return isInterface(node)
        && node.extAttrs.find(it => it.name === "Entity")?.rhs?.value === IDLEntity.Class
}

export function isCallback(node: webidl2.IDLRootType): node is webidl2.CallbackType {
    return node.type === "callback"
}

export function isTypedef(node: webidl2.IDLRootType): node is webidl2.TypedefType {
    return node.type === "typedef"
}

export function isDictionary(node: webidl2.IDLRootType): node is webidl2.DictionaryType {
    return node.type === "dictionary"
}

export function isAttribute(node: webidl2.IDLInterfaceMemberType | webidl2.IDLNamespaceMemberType): node is webidl2.AttributeMemberType {
    return node.type === "attribute"
}

export function isOperation(node: webidl2.IDLInterfaceMemberType | webidl2.IDLNamespaceMemberType): node is webidl2.OperationMemberType {
    return node.type === "operation"
}

export function isConstructor(node: webidl2.IDLInterfaceMemberType): node is webidl2.ConstructorMemberType {
    return node.type === "constructor"
}

export function isUnionTypeDescription(node: webidl2.IDLTypeDescription): node is webidl2.UnionTypeDescription {
    return node.union
}

export function isSingleTypeDescription(node: webidl2.IDLTypeDescription): node is webidl2.SingleTypeDescription {
    return (typeof node.idlType === "string")
}

export function isSequenceTypeDescription(node: webidl2.IDLTypeDescription): node is webidl2.SequenceTypeDescription {
    return node.generic === "sequence"
}

export function isPromiseTypeDescription(node: webidl2.IDLTypeDescription): node is webidl2.PromiseTypeDescription {
    return node.generic === "Promise"
}

export function isRecordTypeDescription(node: webidl2.IDLTypeDescription): node is webidl2.RecordTypeDescription {
    return node.generic === "record"
}

export function isUnspecifiedGenericTypeDescription(node: webidl2.IDLTypeDescription): node is webidl2.UnspecifiedGenericTypeDescription {
    switch (node.generic) {
        case "FrozenArray":
        case "ObservableArray":
        case "Promise":
        case "record":
        case "sequence":
        case "":
            return false
    }
    return true
}

export function isOptional(node: webidl2.AttributeMemberType | webidl2.OperationMemberType): boolean {
    return node.extAttrs
        .map((it: ExtendedAttribute) => it.name)
        .map((it) => it.toLowerCase())
        .includes("optional")
}
