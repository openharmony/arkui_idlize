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

import { TopLevelTypeConvertor } from "../TopLevelTypeConvertor"
import { Typechecker } from "../../../general/Typechecker"
import { IDLContainerType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType } from "@idlizer/core"
import { PeersConstructions } from "../../../constuctions/PeersConstructions"
import { Config } from "../../../general/Config"

export class BindingParameterTypeConvertor extends TopLevelTypeConvertor<
    (parameter: string) => string | string[]
> {
    constructor(
        typechecker: Typechecker
    ) {
        super(typechecker, {
            sequence: (type: IDLContainerType) => (parameter: string) => [
                PeersConstructions.passNodeArray(parameter),
                PeersConstructions.arrayLength(parameter)
            ],
            string: (type: IDLPrimitiveType) => (parameter: string) => parameter,
            enum: (type: IDLReferenceType) => (parameter: string) => parameter,
            reference: (type: IDLReferenceType) => (parameter: string) => {
                if (type.name === Config.context) {
                    return PeersConstructions.context
                }
                return PeersConstructions.passNode(parameter)
            },
            optional: (type: IDLOptionalType) => this.convertType(type.type),
            number: (type: IDLPrimitiveType) => (parameter: string) => parameter,
            void: (type: IDLPrimitiveType) => (parameter: string) => parameter,
            pointer: (type: IDLPrimitiveType) => (parameter: string) => parameter,
            boolean: (type: IDLPrimitiveType) => (parameter: string) => parameter,
        })
    }
}