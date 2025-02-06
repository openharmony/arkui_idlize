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
    IDLBooleanType,
    IDLContainerType,
    IDLContainerUtils,
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
    IDLVoidType,
    isEnum,
    throwException
} from "@idlizer/core"
import { BaseConvertor } from "../BaseConvertor"

export class BindingsTypeConvertor extends BaseConvertor {
    override convertContainer(type: IDLContainerType): string {
        if (IDLContainerUtils.isSequence(type)) {
            return `BigUint64Array`
        }
        throwException(`Unexpected container`)
    }

    override convertTypeReference(type: IDLReferenceType): string {
        if (this.typechecker.isReferenceTo(type, isEnum)) {
            return `KInt`
        }
        return `KNativePointer`
    }

    override convertPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLI8Type: return `KBoolean`
            case IDLI16Type: return `KInt`
            case IDLI32Type: return `KInt`
            case IDLU32Type: return `KUInt`
            case IDLI64Type: return `KLong`
            case IDLF32Type: return `KFloat`
            case IDLF64Type: return `KDouble`
            case IDLBooleanType: return `KBoolean`
            case IDLStringType: return `KStringPtr`
            case IDLVoidType: return `KNativePointer`
            case IDLPointerType: return `KNativePointer`
        }
        throwException(`Unsupported primitive type: ${JSON.stringify(type)}`)
    }
}
