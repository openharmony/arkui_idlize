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

import {
    createMethod,
    createParameter,
    createReferenceType,
    IDLContainerUtils,
    IDLKind,
    IDLMethod,
    isTypedef,
    throwException
} from "@idlizer/core"
import { IDLEntry, IDLInterface, isEnum, isInterface, } from "@idlizer/core/idl"
import { Config } from "../Config"
import { InteropConstructions } from "../printers/InteropConstructions"
import { IDLFile } from "../IdlFile"
import { withUpdatedMethods } from "../idl-utils"

export class MainTransformer {
    constructor(
        private config: Config
    ) {}

    transform(file: IDLFile): IDLFile {
        file = this.withFilteredOutInterfaces(file)
        file = this.withEntriesTransformed(file)
        return file
    }

    private transformEntry(node: IDLEntry): IDLEntry {
        if (isInterface(node)) {
            return this.transformInterface(node)
        }
        if (isEnum(node)) {
            return node
        }
        if (isTypedef(node)) {
            return node
        }

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private transformInterface(node: IDLInterface): IDLInterface {
        node = this.withOverloadsRenamed(node)
        node = this.withFilteredOutMethods(node)
        node = this.withTransformedMethods(node)
        return node
    }

    private withFilteredOutMethods(node: IDLInterface): IDLInterface {
        return withUpdatedMethods(
            node,
            node.methods.filter(it => this.config.shouldEmitMethod(node.name, it.name))
        )
    }

    private withTransformedMethods(node: IDLInterface): IDLInterface {
        return withUpdatedMethods(
            node,
            node.methods.map(it => this.transformMethod(it, node))
        )
    }

    private transformMethod(node: IDLMethod, parent: IDLInterface): IDLMethod {
        node = this.withInsertedReceiver(node, parent)
        node = this.withSplitSequenceParameter(node)
        node = this.withQualifiedName(node, parent)
        node = this.withKeywordsReplaced(node)
        return node
    }

    private withInsertedReceiver(node: IDLMethod, parent: IDLInterface): IDLMethod {
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

    private withSplitSequenceParameter(node: IDLMethod): IDLMethod {
        const parameters = node.parameters
            .flatMap(it =>
                IDLContainerUtils.isSequence(it)
                    ? [
                        createParameter(
                            InteropConstructions.sequenceParameterPointer(it.name),
                            this.config.sequencePointerType
                        ),
                        createParameter(
                            InteropConstructions.sequenceParameterLength(it.name),
                            this.config.sequenceLengthType
                        )
                    ]
                    : it
            )
        return createMethod(
            node.name,
            parameters,
            node.returnType
        )
    }

    private withQualifiedName(node: IDLMethod, parent: IDLInterface): IDLMethod {
        return createMethod(
            `${InteropConstructions.method(parent.name, node.name)}`,
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
        const findOverloaded = (): Set<string> => {
            const seen = new Set<string>()
            const result = new Set<string>()
            node.methods.forEach(it => {
                if (seen.has(it.name)) {
                    result.add(it.name)
                }
                seen.add(it.name)
            })
            return result
        }
        const overloaded = findOverloaded()

        return withUpdatedMethods(
            node, node.methods.map(it => {
                if (overloaded.has(it.name)) {
                    return createMethod(
                        `${it.name}${it.parameters.length}`,
                        it.parameters,
                        it.returnType
                    )
                }
                overloaded.add(it.name)
                return it
            })
        )
    }

    private withFilteredOutInterfaces(node: IDLFile): IDLFile {
        return new IDLFile(
            node.entries.filter(it => {
                if (!isInterface(it)) return true
                return this.config.shouldEmitInterface(it.name)
            })
        )
    }

    private withEntriesTransformed(node: IDLFile): IDLFile {
        return new IDLFile(
            node.entries.map(it => this.transformEntry(it))
        )
    }
}
