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

import { createUpdatedInterface, createUpdatedMethod } from "../../utils/idl"
import {
    createFile,
    createOptionalType,
    createParameter,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLType,
    isInterface,
    isReferenceType
} from "@idlizer/core"
import { Config } from "../../general/Config"
import { Transformer } from "../Transformer"
import { Typechecker } from "../../general/Typechecker"
import { isCreateOrUpdate } from "../../general/common"

export class NullabilityTransformer implements Transformer {
    constructor(
        private file: IDLFile,
        private config: Config,
    ) {}

    private typechecker = new Typechecker(this.file.entries)

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
                .map(it => createUpdatedMethod(
                    it,
                    undefined,
                    this.transformedParameters(it, node),
                    this.transformedReturnType(it, node)
                ))
        )
    }

    private transformedParameters(node: IDLMethod, parent: IDLInterface): IDLParameter[] {
        return node.parameters.map(it => createParameter(
            it.name,
            this.config.nonNullable.isNonNullableParameter(parent.name, node.name, it.name)
                ? it.type
                : this.transformType(it.type)
        ))
    }

    private transformedReturnType(node: IDLMethod, parent: IDLInterface): IDLType {
        if (isCreateOrUpdate(node.name)) {
            return node.returnType
        }
        if (this.config.nonNullable.isNonNullableReturnType(parent.name, node.name)) {
            return node.returnType
        }
        return this.transformType(node.returnType)
    }

    private transformType(type: IDLType): IDLType {
        // TODO: maybe heirs of defaultAncestors aren't nullable
        // TODO: handwritten
        if (isReferenceType(type)) {
            if (this.typechecker.isPeer(type.name) || type.name === Config.astNodeCommonAncestor) {
                return createOptionalType(type)
            }
        }
        return type
    }
}
