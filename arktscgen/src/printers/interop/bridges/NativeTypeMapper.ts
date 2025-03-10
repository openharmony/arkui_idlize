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

import { innerType, isSequence, isString } from "../../../utils/idl"
import { NativeTypeConvertor } from "../../../type-convertors/interop/NativeTypeConvertor"
import {
    convertType,
    IDLFile, IDLContainerType, IDLKind, IDLParameter, IDLPointerType, IDLReferenceType, IDLType,
    isContainerType,
    isEnum,
    isPrimitiveType,
    isReferenceType,
    throwException
} from "@idlizer/core"
import { BridgesConstructions } from "./BridgesConstructions"
import { Config } from "../../../Config"
import { Typechecker } from "../../../general/Typechecker"

export class NativeTypeMapper {
    constructor(
        private idl: IDLFile
    ) {}

    typechecker = new Typechecker(this.idl.entries)
    private convertor = new NativeTypeConvertor(this.typechecker)

    cast(node: IDLParameter): string {
        if (isPrimitiveType(node.type)) {
            if (isString(node.type)) {
                return BridgesConstructions.stringCast
            }
            return BridgesConstructions.primitiveTypeCast(this.toString(node.type))
        }
        if (isReferenceType(node.type)) {
            if (this.typechecker.isReferenceTo(node.type, isEnum)) {
                return BridgesConstructions.enumCast(node.type.name)
            }
            return BridgesConstructions.referenceTypeCast(this.castToReference(node.type))
        }
        if (isContainerType(node.type)) {
            return BridgesConstructions.referenceTypeCast(this.castToContainer(node.type))
        }
        throwException(`Unsupported type: ${node.type}`)
    }

    private castToContainer(node: IDLContainerType): string {
        if (!isSequence(node)) {
            throwException(`Unsupported container type: ${IDLKind[node.kind]}`)
        }
        const inner = innerType(node)
        if (isReferenceType(inner)) {
            return BridgesConstructions.arrayOf(
                this.castToReference(inner)
            )
        }
        throwException(`Unsupported container inner type: ${IDLKind[inner.kind]}`)
    }

    private castToReference(node: IDLReferenceType): string {
        if (this.typechecker.isHeir(node.name, Config.astNodeCommonAncestor)) {
            return BridgesConstructions.referenceType(Config.astNodeCommonAncestor)
        }
        return BridgesConstructions.referenceType(node.name)
    }

    toString(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    toInteropMacro(node: IDLType): string {
        if (isString(node)) {
            return BridgesConstructions.stringType
        }
        return this.toString(node)
    }

    toReturn(node: IDLType): IDLType {
        if (isString(node)) {
            node = IDLPointerType
        }
        if (isSequence(node)) {
            node = IDLPointerType
        }
        return node
    }
}
