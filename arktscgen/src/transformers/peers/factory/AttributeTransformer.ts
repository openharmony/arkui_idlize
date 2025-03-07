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
    convertType,
    createFile,
    createProperty,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    isInterface
} from "@idlizer/core"
import { Transformer } from "../../Transformer"
import { Config } from "../../../Config"
import { peerMethod } from "../../../general/common"
import { TopLevelTypeConvertor } from "../../../type-convertors/top-level/TopLevelTypeConvertor"
import { remove } from "../../../utils/array"
import { LibraryTypeConvertor } from "../../../type-convertors/top-level/LibraryTypeConvertor"
import { Typechecker } from "../../../general/Typechecker"

export class AttributeTransformer implements Transformer {
    constructor(
        private file: IDLFile
    ) {}

    private convertor = new LibraryTypeConvertor(new Typechecker(this.file.entries))

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
        const creates = node.methods.filter(it => Config.isCreate(it.name))
        if (creates.length !== 1) {
            return node
        }
        return this.greedilyMapped(node , creates[0]) ?? node
    }

    private greedilyMapped(node: IDLInterface, create: IDLMethod): IDLInterface | undefined {
        const methods = [...node.methods]
        const map = new Map<string, IDLParameter[]>()
        create.parameters
            .forEach((it) => {
                const representation = convertType(this.convertor, it.type)
                const oldValue = map.get(representation) ?? []
                map.set(representation, oldValue.concat(it))
            })

        const attributes: IDLMethod[] = []
        Array.from(map.entries())
            .forEach(([key, parameters]) => {
                if (parameters.length !== 1) {
                    return
                }
                const candidates = methods
                    .filter(it => convertType(this.convertor, it.returnType) === key)
                if (candidates.length === 1) {
                    attributes.push(candidates[0])
                    remove(methods, candidates[0])
                }
            })
        if (attributes.length !== map.size) {
            return undefined
        }
        return createUpdatedInterface(
            node,
            methods,
            undefined,
            undefined,
            undefined,
            attributes.map(it => createProperty(
                peerMethod(it.name),
                it.returnType
            ))
        )
    }
}
