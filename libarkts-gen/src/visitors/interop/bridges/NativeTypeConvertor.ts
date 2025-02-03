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
    IDLEntry,
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
    IDLU64Type,
    IDLVoidType,
    isEnum,
    throwException
} from "@idlizer/core"
import { BaseConvertor } from "../BaseConvertor"
import { isSequence } from "../../../idl-utils"

export class NativeTypeConvertor extends BaseConvertor {
    constructor(idl: IDLEntry[]) {
        super(idl)
    }

    override convertContainer(type: IDLContainerType): string {
        if (isSequence(type)) {
            return `KNativePointerArray`
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
            case IDLI16Type: return `KShort`
            case IDLI32Type: return `KInt`
            case IDLU32Type: return `KUInt`
            case IDLI64Type: return `KLong`
            case IDLU64Type: return `KULong`
            case IDLF32Type: return `KFloat`
            case IDLF64Type: return `KDouble`
            case IDLBooleanType: return `KBoolean`
            case IDLStringType: return `KStringPtr&`
            case IDLVoidType: return `void`
            case IDLPointerType: return `KNativePointer`
        }
        throwException(`Unsupported primitive type: ${JSON.stringify(type)}`)
    }
}
