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

import { isSequence } from "../../../utils/idl"
import { Typechecker } from "../../../general/Typechecker"
import { IDLFile, convertType, IDLPointerType, IDLType } from "@idlizer/core"
import { BindingsTypeConvertor } from "../../../type-convertors/interop/BindingsTypeConvertor"

export class BindingsTypeMapper {
    constructor(
        private file: IDLFile
    ) {}

    typechecker = new Typechecker(this.file.entries)
    private convertor = new BindingsTypeConvertor(this.typechecker)

    toString(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    toReturn(node: IDLType): IDLType {
        if (isSequence(node)) {
            node = IDLPointerType
        }
        return node
    }
}
