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

import { createUpdatedInterface } from "../../../utils/idl"
import {
    createFile,
    createProperty,
    groupByIndexed,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLType,
    isDefined,
    isInterface,
    isOptionalType
} from "@idlizer/core"
import { Transformer } from "../../Transformer"
import { isCreate, peerMethod } from "../../../general/common"
import { LibraryTypeConvertor } from "../../../type-convertors/top-level/LibraryTypeConvertor"
import { Typechecker } from "../../../general/Typechecker"
import { remove } from "../../../utils/array"

export class AttributeTransformer implements Transformer {
    constructor(
        private file: IDLFile
    ) {}

    private convertor = new LibraryTypeConvertor(new Typechecker(this.file.entries))

    private convertToKey(type: IDLType) {
        if (isOptionalType(type)) {
            return this.convertor.convertType(type.type)
        }
        return this.convertor.convertType(type)
    }

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
        const creates = node.methods.filter(it => isCreate(it.name))
        if (creates.length !== 1) {
            return node
        }
        return this.greedilyMapped(node , creates[0]) ?? node
    }

    private greedilyMapped(node: IDLInterface, create: IDLMethod): IDLInterface | undefined {
        const mapped = this.map(
            node.methods,
            groupByIndexed(
                create.parameters,
                it => this.convertToKey(it.type)
            )
        )
        if (mapped === undefined) {
            return undefined
        }
        return createUpdatedInterface(
            node,
            node.methods.filter(it => !mapped.includes(it)),
            undefined,
            undefined,
            undefined,
            mapped.map(it =>
                createProperty(
                    peerMethod(it.name),
                    it.returnType
                )
            )
        )
    }

    private map(
        methods: IDLMethod[],
        parameters: Map<string, [IDLParameter, number][]>
    ): IDLMethod[] | undefined {
        const methodsToMatchWith = [...methods]
        const parametersToMatch: [string, [IDLParameter, number]][] = Array.from(parameters.entries())
            .flatMap(([key, value]) =>
                value.map(it => [key, it])
            )
        const matched = parametersToMatch
            .map(([key, [parameter, index]]) => {
                let candidates = methodsToMatchWith
                    .filter(it => this.convertToKey(it.returnType) === key)
                if (candidates.length !== 1) {
                    candidates = candidates.filter(it => peerMethod(it.name) === parameter.name)
                }
                if (candidates.length === 1) {
                    remove(methodsToMatchWith, candidates[0])
                    return {
                        method: candidates[0],
                        index: index
                    }
                }
                return undefined
            })
            .filter(isDefined)
        if (matched.length === parametersToMatch.length) {
            return matched
                ?.sort((a, b) => a.index - b.index)
                ?.map(({ method }) => method)
        }
        return undefined
    }
}
