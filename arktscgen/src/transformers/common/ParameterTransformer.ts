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

import { createUpdatedInterface, createUpdatedMethod, isSequence } from "../../utils/idl"
import { createFile, IDLFile, IDLInterface, IDLMethod, isInterface } from "@idlizer/core"
import { Transformer } from "../Transformer";

export class ParameterTransformer implements Transformer {
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
            node.methods.map(it => this.transformMethod(it, node))
        )
    }

    private transformMethod(node: IDLMethod, parent: IDLInterface): IDLMethod {
        node = this.withSequenceLengthParameterRemoved(node)
        node = this.withContextDropped(node)
        return node
    }

    private withSequenceLengthParameterRemoved(node: IDLMethod): IDLMethod {
        const newParameters = []
        for (let i = 0; i < node.parameters.length; i++) {
            newParameters.push(node.parameters[i])
            if (isSequence(node.parameters[i].type)) {
                i++
            }
        }
        return createUpdatedMethod(
            node,
            node.name,
            newParameters
        )
    }

    private withContextDropped(node: IDLMethod): IDLMethod {
        return createUpdatedMethod(
            node,
            node.name,
            node.parameters.slice(1)
        )
    }
}
