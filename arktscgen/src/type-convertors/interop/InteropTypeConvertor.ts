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

import { IDLContainerType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType, throwException } from "@idlizer/core"
import { BaseTypeConvertor } from "../BaseTypeConvertor"
import { Typechecker } from "../../general/Typechecker"

export abstract class InteropTypeConvertor extends BaseTypeConvertor<string> {
    protected constructor(
        typechecker: Typechecker,
        heirConversions: {
            sequence: (type: IDLContainerType) => string,
            string: (type: IDLPrimitiveType) => string
        }
    ) {
        super(typechecker, {
            enum: (type: IDLReferenceType) => `KInt`,
            reference: (type: IDLReferenceType) => `KNativePointer`,
            optional: (type: IDLOptionalType) => throwException(`no nullable allowed at interop level`),
            i8: (type: IDLPrimitiveType) => `KBoolean`,
            i16: (type: IDLPrimitiveType) => `KInt`,
            i32: (type: IDLPrimitiveType) => `KInt`,
            iu32: (type: IDLPrimitiveType) => `KUInt`,
            i64: (type: IDLPrimitiveType) => `KLong`,
            iu64: (type: IDLPrimitiveType) => `KULong`,
            f32: (type: IDLPrimitiveType) => `KFloat`,
            f64: (type: IDLPrimitiveType) => `KDouble`,
            boolean: (type: IDLPrimitiveType) => `KBoolean`,
            void: (type: IDLPrimitiveType) => `void`,
            pointer: (type: IDLPrimitiveType) => `KNativePointer`,
            ...heirConversions
        })
    }
}
