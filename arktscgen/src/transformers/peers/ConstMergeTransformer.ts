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

import { createUpdatedInterface } from "../../utils/idl"
import { IDLEntry, IDLFile, IDLInterface } from "@idlizer/core"
import { Config } from "../../general/Config";
import { Transformer } from "../Transformer";

export class ConstMergeTransformer extends Transformer {
    constructor(file: IDLFile) {
        super(file)
    }

    transformInterface(node: IDLInterface): IDLEntry {
        return createUpdatedInterface(
            node,
            node.methods
                .filter(it => {
                    if (!it.name.endsWith(Config.constPostfix)) return true
                    const nonConstVersion = it.name.substring(0, it.name.length - Config.constPostfix.length)
                    return !node.methods.some(it => it.name === nonConstVersion)
                })
        )
    }
}
