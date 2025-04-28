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

import { BaseTypeConvertor } from "../BaseTypeConvertor"
import { IDLContainerType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType, throwException } from "@idlizer/core"
import { Typechecker } from "../../general/Typechecker"

export abstract class TopLevelTypeConvertor<T> extends BaseTypeConvertor<T> {
    protected constructor(
        typechecker: Typechecker,
        heirConversions: {
            sequence: (type: IDLContainerType) => T,
            string: (type: IDLPrimitiveType) => T,
            enum: (type: IDLReferenceType) => T,
            reference: (type: IDLReferenceType) => T,
            optional: (type: IDLOptionalType) => T,
            number: (type: IDLPrimitiveType) => T,
            void: (type: IDLPrimitiveType) => T,
            pointer: (type: IDLPrimitiveType) => T,
            boolean: (type: IDLPrimitiveType) => T,
        }
    ) {
        super(typechecker, {
            ...heirConversions,
            ...{
                i8: heirConversions.number,
                iu8: heirConversions.number,
                i16: heirConversions.number,
                i32: heirConversions.number,
                iu32: heirConversions.number,
                i64: heirConversions.number,
                iu64: heirConversions.number,
                f32: heirConversions.number,
                f64: heirConversions.number,
                void: heirConversions.void,
                boolean: heirConversions.boolean,
                pointer: heirConversions.pointer
            }
        })
    }
}