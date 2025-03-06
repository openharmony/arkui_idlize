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

import { createFile, IDLFile, isInterface } from "@idlizer/core"
import { dropNamespace, nodeNamespace } from "../../utils/idl"
import { Transformer } from "../Transformer"

export class MultipleDeclarationFilterTransformer implements Transformer {
    constructor(
        private file: IDLFile
    ) {}

    transformed(): IDLFile {
        const seen = new Map<string, number>()
        this.file.entries.forEach(it => {
            const oldValue = seen.get(it.name) ?? 0
            seen.set(it.name, oldValue+1)
        })
        return createFile(
            this.file.entries.filter(it => {
                if (!isInterface(it)) {
                    return it
                }
                const occurence = seen.get(it.name) ?? 0
                if (occurence < 2) {
                    dropNamespace(it)
                }
                if (occurence > 1 && nodeNamespace(it) != "ir") return undefined

                return it
            }),
            this.file.fileName
        )
    }
}
