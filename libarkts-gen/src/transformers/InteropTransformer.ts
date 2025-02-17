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

import { createMethod, createParameter, createReferenceType, IDLMethod } from "@idlizer/core"
import { IDLInterface, isInterface, } from "@idlizer/core/idl"
import { InteropConstructions } from "../visitors/interop/InteropConstructions"
import { createUpdatedInterface, IDLFile, nodeNamespace } from "../utils/idl"
import { Config } from "../Config"

export class InteropTransformer {
    constructor(
        private file: IDLFile
    ) {}

    transformed(): IDLFile {
        return new IDLFile(
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
        node = this.withOverloadsRenamed(node)
        node = this.withTransformedMethods(node)
        return node
    }

    private withTransformedMethods(node: IDLInterface): IDLInterface {
        return createUpdatedInterface(
            node,
            node.methods.map(it => this.transformMethod(it, node))
        )
    }

    private transformMethod(node: IDLMethod, parent: IDLInterface): IDLMethod {
        node = this.withInsertedReceiver(node, parent)
        node = this.withQualifiedName(node, parent)
        node = this.withKeywordsReplaced(node)
        return node
    }

    private withInsertedReceiver(node: IDLMethod, parent: IDLInterface): IDLMethod {
        if (Config.isCreateOrUpdate(node.name)) {
            return node
        }
        const copy = createMethod(
            node.name,
            [...node.parameters],
            node.returnType
        )
        copy.parameters.splice(
            1,
            0,
            createParameter(
                InteropConstructions.receiver,
                createReferenceType(parent.name)
            )
        )
        return copy
    }

    private withQualifiedName(node: IDLMethod, parent: IDLInterface): IDLMethod {
        return createMethod(
            `${InteropConstructions.method(parent.name, node.name, nodeNamespace(parent))}`,
            node.parameters,
            node.returnType
        )
    }

    private withKeywordsReplaced(node: IDLMethod): IDLMethod {
        const rename = (name: string) => {
            if (InteropConstructions.keywords.includes(name)) {
                return `_${name}`
            }
            return name
        }
        return createMethod(
            rename(node.name),
            node.parameters.map(it => createParameter(
                rename(it.name),
                it.type
            )),
            node.returnType
        )
    }

    private withOverloadsRenamed(node: IDLInterface): IDLInterface {
        // TODO
        return node
    }
}
