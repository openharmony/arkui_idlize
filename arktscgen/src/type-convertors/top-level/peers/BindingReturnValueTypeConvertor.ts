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

import {
    IDLContainerUtils,
    IDLEnum,
    IDLInterface,
    IDLNamedNode,
    IDLReferenceType,
    IDLType,
    isContainerType,
    isInterface,
    isNamedNode,
    isOptionalType,
    isReferenceType,
    throwException
} from "@idlizer/core"
import { Config } from "../../../general/Config.js"
import { Importer } from "../../../printers/library/Importer.js"
import { PeersConstructions } from "../../../constuctions/PeersConstructions.js"
import { isString, makeEnoughQualifiedName } from "../../../utils/idl.js"
import { Typechecker } from "../../../general/Typechecker.js"

export function unpackWrapper(type: IDLType, typechecker: Typechecker): string | undefined {
    const isAstNode = (ref: IDLNamedNode): ref is IDLInterface =>
        (isReferenceType(ref) || isInterface(ref)) && typechecker.isHeir(ref, Config.astNodeCommonAncestor)
    const isAstType = (ref: IDLNamedNode): boolean =>
        (isReferenceType(ref) || isInterface(ref)) && typechecker.isHeir(ref, Config.astTypeAncestor)

    if (isContainerType(type)) {
        if (IDLContainerUtils.isSequence(type) && isReferenceType(type.elementType[0])) {
            return isAstNode(type.elementType[0])
                ? PeersConstructions.arrayOfPointersToArrayOfPeers
                : PeersConstructions.arrayOfPointersToArrayOfObjects
        }
        throwException(`unexpected container of non-sequence type`)

    } else if (isString(type)) {
        return PeersConstructions.receiveString

    } else if (isReferenceType(type)) {
        if (isAstNode(type)) {
            return PeersConstructions.unpackNonNullable
        }

    } else if (isOptionalType(type)) {
        const innerType = type.type
        if (isReferenceType(innerType)) {
            if (isAstNode(innerType)) {
                return PeersConstructions.unpackNullableNode
            }
            if (isAstType(innerType)) {
                return PeersConstructions.unpackNullableConstructable
            }
            return undefined // PeersConstructions.newOf
        }

        throwException(`unexpected optional of non-reference type`)
    }

    return undefined
}

export function hasTypeHintArgument(wrapper: string): boolean {
    return [
        PeersConstructions.arrayOfPointersToArrayOfPeers,
        PeersConstructions.unpackNonNullable,
        PeersConstructions.unpackNullableNode,
        PeersConstructions.unpackNullableConstructable,
    ].includes(wrapper)
}

export function typeHintArgument(type: IDLType, typechecker: Typechecker, importer: Importer): string | undefined {
    const isAstNode = (ref: IDLNamedNode): ref is IDLInterface =>
        isInterface(ref) && typechecker.isHeir(ref, Config.astNodeCommonAncestor)
    const isAstType = (ref: IDLNamedNode): ref is IDLInterface =>
        isInterface(ref) && typechecker.isHeir(ref, Config.astTypeAncestor)

    const iface = isReferenceType(type) ?
        typechecker.resolveReference(type) : undefined

    if (iface && isAstNode(iface) && !typechecker.hasDescendants(iface)) {
        const astNodeTypeName = typechecker.nodeTypeName(iface)
        if (astNodeTypeName) {
            importer.withEnumImport(Config.nodeTypeAttribute)
            return astNodeTypeName
        }
    }

    if (iface && isAstType(iface)) {
        // unpackConstructable second argument
        return makeEnoughQualifiedName(type as IDLReferenceType, typechecker.resolveReference.bind(typechecker))
    }

    return undefined
}

export function hasFactoryArgument(wrapper: string): boolean {
    return [
        PeersConstructions.arrayOfPointersToArrayOfObjects,
    ].includes(wrapper)
}

