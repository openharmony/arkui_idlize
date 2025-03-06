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

import { BaseConvertor } from "./BaseConvertor"
import { convertType, IDLContainerType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType } from "@idlizer/core"
import { innerType } from "../utils/idl"

export class TopLevelTypeConvertor extends BaseConvertor {
    override conversions = {
        sequence: (type: IDLContainerType) => `readonly ${convertType(this, innerType(type))}[]`,
        enum: (type: IDLReferenceType) => type.name,
        reference: (type: IDLReferenceType) => type.name,
        optional: (type: IDLOptionalType) => `${convertType(this, type.type)} | undefined`,
        i8: (type: IDLPrimitiveType) => `number`,
        i16: (type: IDLPrimitiveType) => `number`,
        i32: (type: IDLPrimitiveType) => `number`,
        iu32: (type: IDLPrimitiveType) => `number`,
        i64: (type: IDLPrimitiveType) => `number`,
        iu64: (type: IDLPrimitiveType) => `number`,
        f32: (type: IDLPrimitiveType) => `number`,
        f64: (type: IDLPrimitiveType) => `number`,
        boolean: (type: IDLPrimitiveType) => `boolean`,
        string: (type: IDLPrimitiveType) => `string`,
        void: (type: IDLPrimitiveType) => `void`,
        pointer: (type: IDLPrimitiveType) => `KNativePointer`,
    }
}