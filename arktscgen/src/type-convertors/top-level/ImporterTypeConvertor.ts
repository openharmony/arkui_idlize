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

import { IDLContainerType, IDLOptionalType, IDLPrimitiveType, IDLReferenceType, IDLType } from "@idlizer/core"
import { TopLevelTypeConvertor } from "./TopLevelTypeConvertor"
import { Importer } from "../../printers/library/Importer"
import { Typechecker } from "../../general/Typechecker"
import { baseName } from "../../utils/idl"

export class ImporterTypeConvertor extends TopLevelTypeConvertor<IDLType> {
    constructor(
        private importer: Importer,
        typechecker: Typechecker,
    ) {
        super(typechecker, {
            optional: (type: IDLOptionalType) => {
                this.convertType(type.type)
                return type
            },
            sequence: (type: IDLContainerType) => {
                this.convertType(type.elementType[0])
                return type
            },
            enum: (type: IDLReferenceType) => {
                this.importer.withEnumImport(type.name)
                return type
            },
            reference: (type: IDLReferenceType) => {
                this.importer.withPeerImport(baseName(type))
                return type
            },
            string: (type: IDLPrimitiveType) => type,
            number: (type: IDLPrimitiveType) => type,
            boolean: (type: IDLPrimitiveType) => type,
            void: (type: IDLPrimitiveType) => type,
            pointer: (type: IDLPrimitiveType) => type,
            undefined: (type: IDLPrimitiveType) => type
        })
    }
}
