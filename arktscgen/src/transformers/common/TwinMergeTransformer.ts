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
    createSequence,
    createUpdatedInterface,
    createUpdatedMethod,
    innerType,
    isIrNamespace,
    isSequence
} from "../../utils/idl"
import {
    createFile,
    createParameter,
    createReferenceType,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLType,
    isContainerType,
    isDefined,
    isInterface,
    isReferenceType
} from "@idlizer/core"
import { Config } from "../../general/Config";
import { Transformer } from "../Transformer";

export class TwinMergeTransformer implements Transformer {
    constructor(
        private file: IDLFile
    ) {
        const all = file.entries.filter(isInterface)
        this.twins = new Set()
        all
            .filter(it => this.hasPrefix(it.name))
            .forEach(it => {
                const twin = all.find(candidate => this.withPrefix(candidate.name) === it.name)
                if (twin === undefined) return
                if (!isIrNamespace(twin)) return
                this.twins.add(twin.name)
            })
    }

    private twins: Set<string>

    private hasTwin(name: string): boolean {
        if (this.hasPrefix(name)) {
            return this.twins.has(this.withoutPrefix(name))
        }
        return this.twins.has(name)
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
                .filter(isDefined)
        )
    }

    private transformInterface(node: IDLInterface): IDLInterface | undefined {
        if (node.name === Config.astNodeCommonAncestor) { // TODO: is handwritten
            return createUpdatedInterface(
                node,
                node.methods.map(it => this.transformMethod(it)),
            )
        }
        if (this.hasTwin(node.name) && this.hasPrefix(node.name)) {
            return undefined
        }
        if (this.hasTwin(node.name) || this.hasPrefix(node.name)) {
            return createUpdatedInterface(
                node,
                node.methods.map(it => this.transformMethod(it)),
                this.withoutPrefix(node.name),
                [createReferenceType(Config.defaultAncestor)]
            )
        }
        return createUpdatedInterface(
            node,
            node.methods.map(it => this.transformMethod(it)),
        )
    }

    private transformMethod(node: IDLMethod): IDLMethod {
        return createUpdatedMethod(
            node,
            this.withoutPrefix(node.name),
            node.parameters.map(it => this.transformParameter(it)),
            this.transformType(node.returnType)
        )
    }

    private transformParameter(node: IDLParameter): IDLParameter {
        return createParameter(
            this.withoutPrefix(node.name),
            this.transformType(node.type),
            node.isOptional,
            node.isVariadic
        )
    }

    private transformType(node: IDLType): IDLType {
        if (isContainerType(node)) {
            if (isSequence(node)) {
                return createSequence(
                    this.transformType(innerType(node))
                )
            }
        }
        if (isReferenceType(node)) {
            return createReferenceType(
                this.withoutPrefix(node.name),
                node.typeArguments
            )
        }
        return node
    }

    private withoutPrefix(name: string): string {
        if (name.startsWith(Config.dataClassPrefix)) {
            return name.slice(Config.dataClassPrefix.length)
        }
        return name
    }

    private withPrefix(name: string): string {
        return `${Config.dataClassPrefix}${name}`
    }

    private hasPrefix(name: string): boolean {
        return name.startsWith(Config.dataClassPrefix)
    }
}
