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

import { createUpdatedInterface } from "../utils/idl"
import { createFile, IDLFile, IDLInterface, isInterface } from "@idlizer/core"
import { Config } from "../Config";
import { Transformer } from "./Transformer";

export class ConstMergeTransformer implements Transformer {
    constructor(
        private file: IDLFile
    ) {}

    transformed(): IDLFile {
        return createFile(
            this.file.entries
                .map(it => {
                    if (isInterface(it)) {
                        return this.transformInterface(it)
                    }
                    return it
                })
        )
    }

    private transformInterface(node: IDLInterface): IDLInterface {
        return createUpdatedInterface(
            node,
            node.methods
                .filter(it => {
                    const constVersion = it.name + Config.constPostfix
                    const hasConstVersion = node.methods.some(it => it.name === constVersion)
                    return !hasConstVersion
                })
        )
    }
}
