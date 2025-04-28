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

import { createUpdatedInterface, innerTypeIfContainer } from "../../../utils/idl"
import { createFile, createNamespace, IDLEntry, IDLFile, IDLInterface, IDLMethod, isInterface, isNamespace, isReferenceType } from "@idlizer/core"
import { Transformer } from "../../Transformer"
import { Typechecker } from "../../../general/Typechecker"

export abstract class BaseInterfaceFilterTransformer extends Transformer {
    constructor(file: IDLFile, removeNamespaces: boolean = false) {
        super(file, removeNamespaces)
    }

    protected typechecker = new Typechecker(this.file.entries)

    transformInterface(entry: IDLInterface): IDLEntry|undefined {
        if (this.shouldFilterOutInterface(entry.name)) {
            return undefined
        }
        return createUpdatedInterface(
            entry,
            entry.methods
                .filter(it => !this.shouldFilterOutMethod(entry.name, it.name))
                .filter(it => !this.isReferringForbiddenOrMissing(it, (name: string) => this.shouldFilterOutInterface(name))),
            entry.name,
            entry.inheritance,
            entry.extendedAttributes,
            entry.properties
                .filter(it => !this.shouldFilterOutProperty(entry.name, it.name))
        )
    }

    protected abstract shouldFilterOutMethod(node: string, name: string): boolean
    protected abstract shouldFilterOutProperty(node: string, name: string): boolean
    protected abstract shouldFilterOutInterface(name: string): boolean

    protected isReferringForbiddenOrMissing(node: IDLMethod, predicate: (_: string) => boolean): boolean {
        return node.parameters
            .map(it => it.type)
            .concat(node.returnType)
            .map(innerTypeIfContainer)
            .filter(it => {
                if (isReferenceType(it)) {
                    if (this.typechecker.isReferenceTo(it, isInterface) && predicate(it.name)) {
                        return true
                    }
                    if (this.typechecker.findRealDeclaration(it.name) === undefined) {
                        return true
                    }
                }
                return false
            }).length !== 0
    }
}
