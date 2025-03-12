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
import { createFile, IDLFile, IDLInterface, IDLMethod, isInterface } from "@idlizer/core"
import { Config } from "../../Config";
import { Transformer } from "../Transformer";

export class UniversalCreateTransformer implements Transformer {
    constructor(
        private file: IDLFile
    ) {}

    transformed(): IDLFile {
        return createFile(
            this.file.entries
                .map(it => {
                    if (isInterface(it)) {
                        return UniversalCreateTransformer.transformInterface(it)
                    }
                    return it
                })
        )
    }

    private static transformInterface(node: IDLInterface): IDLInterface {
        const universal = UniversalCreateTransformer.universalCreate(node)
        if (universal === undefined) {
            return node
        }
        return createUpdatedInterface(
            node,
            [universal].concat(
                node.methods
                    .filter(it => !Config.isCreate(it.name))
            )
        )
    }

    private static universalCreate(node: IDLInterface): IDLMethod | undefined {
        const creates = node.methods
            .filter(it => Config.isCreate(it.name))
            .filter(it => !UniversalCreateTransformer.isCopyConstructor(it))

        return creates.find(candidate =>
            creates.every(it => UniversalCreateTransformer.isCovered(it, candidate))
        )
    }

    private static isCopyConstructor(node: IDLMethod): boolean {
        return node.parameters.length === 1 && node.parameters[0].name === "other"
    }

    private static isCovered(node: IDLMethod, by: IDLMethod): boolean {
        const byParameters = new Set(by.parameters.map(it => it.name))
        return node.parameters
            .map(it => it.name)
            .every(it => byParameters.has(it))
    }
}

