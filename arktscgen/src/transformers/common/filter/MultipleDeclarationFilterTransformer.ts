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

import { IDLEntry, IDLFile, IDLInterface, linearizeNamespaceMembers } from "@idlizer/core"
import { baseNameString, isIrNamespace, nodeNamespace } from "../../../utils/idl"
import { Transformer } from "../../Transformer"
import { id } from "../../../utils/types"
import { Config } from "../../../general/Config"

export class MultipleDeclarationFilterTransformer extends Transformer {
    constructor(file: IDLFile) {
        super(file)
        // TODO: namespaces
        linearizeNamespaceMembers(this.file.entries).forEach(it => {
            let name = baseNameString(it.name)
            const oldValue = this.seen.get(name) ?? 0
            this.seen.set(name, oldValue + 1)
        })
    }

    seen = new Map<string, number>()

    transformInterface(entry: IDLInterface): IDLEntry | undefined {
        const occurence = this.seen.get(baseNameString(entry.name)) ?? 0
        if (occurence > 1 && !isIrNamespace(entry)) {
            console.log(`FILTERED (MULTIPLE) ${entry.name}`)
            this.seen.set(baseNameString(entry.name), occurence - 1)
            return undefined
        }
        return entry
    }
}
