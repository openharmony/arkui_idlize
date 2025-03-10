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

import { createFile, createParameter, createReferenceType, IDLFile, IDLMethod } from "@idlizer/core"
import { IDLInterface, isInterface } from "@idlizer/core/idl"
import { InteropConstructions } from "../../constuctions/InteropConstructions"
import { createUpdatedInterface, createUpdatedMethod, isSequence, nodeNamespace } from "../../utils/idl"
import { Config } from "../../Config"
import { mangleIfKeyword } from "../../general/common";
import { Transformer } from "../Transformer";

export class InteropTransformer implements Transformer {
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
                }),
            this.file.fileName
        )
    }

    private transformInterface(node: IDLInterface): IDLInterface {
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
        node = this.withInsertedContext(node)
        node = this.withQualifiedName(node, parent)
        node = this.withKeywordsReplaced(node)
        node = this.withSequenceParameterSplit(node)
        return node
    }

    private withInsertedContext(node: IDLMethod): IDLMethod {
        return createUpdatedMethod(
            node,
            node.name,
            [
                createParameter(
                    InteropConstructions.context.name,
                    InteropConstructions.context.type
                ),
                ...node.parameters
            ]
        )
    }

    private withInsertedReceiver(node: IDLMethod, parent: IDLInterface): IDLMethod {
        if (Config.isCreateOrUpdate(node.name)) {
            return node
        }
        return createUpdatedMethod(
            node,
            node.name,
            [
                createParameter(
                    InteropConstructions.receiver,
                    createReferenceType(parent.name)
                ),
                ...node.parameters
            ]
        )
    }

    private withQualifiedName(node: IDLMethod, parent: IDLInterface): IDLMethod {
        return createUpdatedMethod(
            node,
            InteropConstructions.method(parent.name, node.name, nodeNamespace(parent)),
            node.parameters,
            node.returnType
        )
    }

    private withKeywordsReplaced(node: IDLMethod): IDLMethod {
        return createUpdatedMethod(
            node,
            mangleIfKeyword(node.name),
            node.parameters.map(it => createParameter(
                mangleIfKeyword(it.name),
                it.type
            )),
            node.returnType
        )
    }

    private withSequenceParameterSplit(node: IDLMethod): IDLMethod {
        return createUpdatedMethod(
            node,
            undefined,
            node.parameters
                .flatMap(it => {
                    if (isSequence(it.type)) {
                        return [
                            it,
                            createParameter(
                                InteropConstructions.sequenceParameterLength(it.name),
                                InteropConstructions.sequenceLengthType
                            )
                        ]
                    }
                    return it
                })
        )
    }
}
