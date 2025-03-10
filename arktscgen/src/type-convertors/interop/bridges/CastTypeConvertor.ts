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
import { Typechecker } from "../../../general/Typechecker"
import { BaseTypeConvertor } from "../../BaseTypeConvertor"
import { BridgesConstructions } from "../../../constuctions/BridgesConstructions"
import { NativeTypeConvertor } from "./NativeTypeConvertor"
import { Config } from "../../../Config"
import { innerType } from "../../../utils/idl"

export class CastTypeConvertor extends BaseTypeConvertor<string> {
    private castToTypeConvertor = new CastToTypeConvertor(this.typechecker)

    constructor(
        typechecker: Typechecker,
    ) {
        const primitive =
            (type: IDLPrimitiveType) =>
                BridgesConstructions.primitiveTypeCast(
                    this.castToTypeConvertor.convertType(type)
                )
        super(typechecker, {
            sequence: (type: IDLContainerType) => BridgesConstructions.referenceTypeCast(
                this.castToTypeConvertor.convertType(type)
            ),
            enum: (type: IDLReferenceType) => BridgesConstructions.enumCast(
                this.castToTypeConvertor.convertType(type)
            ),
            reference: (type: IDLReferenceType) => BridgesConstructions.referenceTypeCast(
                this.castToTypeConvertor.convertType(type)
            ),
            i8: primitive,
            i16: primitive,
            i32: primitive,
            iu32: primitive,
            i64: primitive,
            iu64: primitive,
            f32: primitive,
            f64: primitive,
            boolean: primitive,
            string: (type: IDLPrimitiveType) => BridgesConstructions.stringCast,
            optional: (type: IDLOptionalType) =>
                throwException(`no optional type allowed at interop level conversion`),
            void: (type: IDLPrimitiveType) =>
                throwException(`no void typed parameters allowed`),
            pointer: (type: IDLPrimitiveType) =>
                throwException(`no pointer typed parameters allowed`)
        })
    }
}

class CastToTypeConvertor extends BaseTypeConvertor<string> {
    private nativeTypeConvertor = new NativeTypeConvertor(this.typechecker)

    constructor(
        typechecker: Typechecker,
    ) {
        const primitive =
            (type: IDLPrimitiveType) =>
                this.nativeTypeConvertor.convertType(type)
        super(typechecker, {
            sequence: (type: IDLContainerType) =>
                BridgesConstructions.arrayOf(
                    this.convertType(innerType(type))
                ),
            enum: (type: IDLReferenceType) => type.name,
            reference: (type: IDLReferenceType) =>
                BridgesConstructions.referenceType(
                    typechecker.isHeir(type.name, Config.astNodeCommonAncestor)
                        ? Config.astNodeCommonAncestor
                        : type.name
                ),
            i8: primitive,
            i16: primitive,
            i32: primitive,
            iu32: primitive,
            i64: primitive,
            iu64: primitive,
            f32: primitive,
            f64: primitive,
            boolean: primitive,
            optional: (type: IDLOptionalType) =>
                throwException(`no optional type allowed at interop level conversion`),
            string: (type: IDLPrimitiveType) =>
                throwException(`string parameters are casted by copying`),
            void: (type: IDLPrimitiveType) =>
                throwException(`no void typed parameters allowed`),
            pointer: (type: IDLPrimitiveType) =>
                throwException(`no pointer typed parameters allowed`)
        })
    }
}
