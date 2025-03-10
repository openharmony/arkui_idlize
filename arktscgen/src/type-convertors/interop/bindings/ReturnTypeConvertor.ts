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
    IDLContainerType,
    IDLOptionalType,
    IDLPointerType,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLType
} from "@idlizer/core"
import { Typechecker } from "../../../general/Typechecker"
import { BaseTypeConvertor } from "../../BaseTypeConvertor"

export class ReturnTypeConvertor extends BaseTypeConvertor<IDLType> {
    constructor(
        typechecker: Typechecker,
    ) {
        super(typechecker, {
            sequence: (type: IDLContainerType) => IDLPointerType,
            enum: (type: IDLReferenceType) => type,
            reference: (type: IDLReferenceType) => type,
            optional: (type: IDLOptionalType) => type,
            i8: (type: IDLPrimitiveType) => type,
            i16: (type: IDLPrimitiveType) => type,
            i32: (type: IDLPrimitiveType) => type,
            iu32: (type: IDLPrimitiveType) => type,
            i64: (type: IDLPrimitiveType) => type,
            iu64: (type: IDLPrimitiveType) => type,
            f32: (type: IDLPrimitiveType) => type,
            f64: (type: IDLPrimitiveType) => type,
            boolean: (type: IDLPrimitiveType) => type,
            string: (type: IDLPrimitiveType) => type,
            void: (type: IDLPrimitiveType) => type,
            pointer: (type: IDLPrimitiveType) => type
        })
    }
}
