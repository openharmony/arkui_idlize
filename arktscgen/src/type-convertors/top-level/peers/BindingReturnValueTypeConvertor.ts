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
    IDLInterface,
    IDLNamedNode,
    IDLType,
    isContainerType,
    isInterface,
    isOptionalType,
    isReferenceType,
    throwException
} from "@idlizer/core"
import { Config } from "../../../general/Config"
import { Importer } from "../../../printers/library/Importer"
import { PeersConstructions } from "../../../constuctions/PeersConstructions"
import { isString } from "../../../utils/idl"
import { Typechecker } from "../../../general/Typechecker"

export function unpackWrapper(type: IDLType, typechecker: Typechecker): string | undefined {
    const isAstNode = (ref: IDLNamedNode): ref is IDLInterface =>
        (isReferenceType(ref) || isInterface(ref)) && typechecker.isHeir(ref, Config.astNodeCommonAncestor)

    if (isContainerType(type)) {
        if (IDLContainerUtils.isSequence(type)) {
            return PeersConstructions.arrayOfPointersToArrayOfPeers
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
            return isAstNode(innerType) ? PeersConstructions.unpackNullable : undefined // PeersConstructions.newOf
        }
        throwException(`unexpected optional of non-reference type`)
    }

    return undefined
}

export function hasTypeHintArgument(wrapper: string): boolean {
    return [
        PeersConstructions.arrayOfPointersToArrayOfPeers,
        PeersConstructions.unpackNonNullable,
        PeersConstructions.unpackNullable,
    ].includes(wrapper)
}

export function typeHintArgument(type: IDLType, typechecker: Typechecker, importer: Importer): string | undefined {
    const isAstNode = (ref: IDLNamedNode): ref is IDLInterface =>
        isInterface(ref) && typechecker.isHeir(ref, Config.astNodeCommonAncestor)

    const iface = isReferenceType(type) ?
        typechecker.resolveReference(type) : undefined

    if (iface && isAstNode(iface) && !typechecker.hasDescendants(iface)) {
        const astNodeTypeName = typechecker.nodeTypeName(iface)
        if (astNodeTypeName) {
            importer.withEnumImport(Config.nodeTypeAttribute)
            return astNodeTypeName
        }
    }

    return undefined
}
