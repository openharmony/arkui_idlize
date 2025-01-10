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
    IDLOptionalType,
    IDLUnionType,
    IDLContainerType,
    IDLReferenceType,
    IDLTypeParameterType,
    IDLPrimitiveType
} from "../idl";
import { TypeConvertor } from "../peer-generation/LanguageWriters/nameConvertor"
import { PrimitiveType } from "../peer-generation/ArkPrimitiveType"
import * as idl from "../idl"
import { throwException } from "../util"

export class NativeTypeConvertor implements TypeConvertor<string> {
    convertOptional(type: IDLOptionalType): string {
        throw new Error("Method not implemented.");
    }
    convertUnion(type: IDLUnionType): string {
        throw new Error("Method not implemented.");
    }
    convertContainer(type: IDLContainerType): string {
        return `KNativePointer`
    }
    convertImport(type: IDLReferenceType, importClause: string): string {
        throw new Error("Method not implemented.");
    }
    convertTypeReference(type: IDLReferenceType): string {
        return `KNativePointer`
    }
    convertTypeParameter(type: IDLTypeParameterType): string {
        throw new Error("Method not implemented.");
    }
    convertPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLI32Type: return `KInt`
            case idl.IDLBooleanType: return `KBoolean`
            case idl.IDLStringType: return `KStringPtr&`
        }
        throwException(`Unsupported primitive type: ${type}`)
    }
}