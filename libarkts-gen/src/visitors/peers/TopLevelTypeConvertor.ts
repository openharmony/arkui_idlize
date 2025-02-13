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

import { BaseConvertor } from "../interop/BaseConvertor"
import {
    IDLBooleanType,
    IDLContainerType,
    IDLF32Type,
    IDLF64Type,
    IDLI16Type,
    IDLI32Type,
    IDLI64Type,
    IDLI8Type,
    IDLPointerType,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLStringType,
    IDLU32Type,
    IDLVoidType, isPrimitiveType, isReferenceType,
    throwException
} from "@idlizer/core"
import { isSequence, isString } from "../../utils/idl"
import { CachedLogger } from "../../CachedLogger"

export class TopLevelTypeConvertor extends BaseConvertor {
    override convertContainer(type: IDLContainerType): string {
        if (isSequence(type)) {
            const inner = type.elementType[0]
            if (isReferenceType(inner)) {
                return `readonly ${this.convertTypeReference(inner)}[]`
            }
            if (isPrimitiveType(inner)) {
                CachedLogger.warn(`sketchy string array`)
                return `readonly ${this.convertPrimitiveType(inner)}[]`
            }
        }
        throwException(`Unexpected conversion: ${JSON.stringify(type)}`)
    }

    override convertTypeReference(type: IDLReferenceType): string {
        return type.name
    }

    override convertPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLI8Type: return `number`
            case IDLI16Type: return `number`
            case IDLI32Type: return `number`
            case IDLU32Type: return `number`
            case IDLI64Type: return `number`
            case IDLF32Type: return `number`
            case IDLF64Type: return `number`
            case IDLBooleanType: return `boolean`
            case IDLStringType: return `string`
            case IDLVoidType: return `void`
            case IDLPointerType: return `KNativePointer`
        }
        throwException(`Unsupported primitive type: ${JSON.stringify(type)}`)
    }
}