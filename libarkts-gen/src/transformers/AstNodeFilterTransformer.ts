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

import { Config } from "../Config"
import { IDLFile } from "../IdlFile"
import { Typechecker } from "../idl-utils"
import { isInterface } from "@idlizer/core"

export class AstNodeFilterTransformer {
    constructor(
        private file: IDLFile
    ) {}

    private typechecker = new Typechecker(this.file.entries)

    transformed(): IDLFile {
        return new IDLFile(
            this.file.entries
                .filter(it => !isInterface(it) || this.typechecker.isHeir(
                    it.name,
                    Config.astNodeCommonAncestor
                ))
        )
    }
}
