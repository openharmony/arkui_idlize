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

import { Config } from "../Config"
import { IDLFile } from "../IdlFile"
import { Typechecker, createInterfaceWithUpdatedMethods } from "../idl-utils"
import { IDLMethod, IDLType, isInterface, isReferenceType } from "@idlizer/core"

export class OptionsFilterTransformer {
    constructor(
        private config: Config,
        private file: IDLFile
    ) {}

    private typechecker = new Typechecker(this.file.entries)

    transformed(): IDLFile {
        return new IDLFile(
            this.file.entries
                .flatMap(entry => {
                    if (!isInterface(entry)) {
                        return entry
                    }
                    if (!this.config.shouldEmitInterface(entry.name)) {
                        return []
                    }
                    return createInterfaceWithUpdatedMethods(
                        entry,
                        entry.methods
                            .filter(it => this.config.shouldEmitMethod(entry.name, it.name))
                            .filter(it => this.isNotRefersIgnored(it))
                    )
                })
        )
    }

    private isNotRefersIgnored(node: IDLMethod): boolean {
        return node.parameters
            .map(it => it.type)
            .concat(node.returnType)
            .filter(it => this.isReferenceToIgnored(it))
            .length === 0
    }

    private isReferenceToIgnored(node: IDLType): boolean {
        return isReferenceType(node)
            && this.typechecker.isReferenceTo(node, isInterface)
            && !this.config.shouldEmitInterface(node.name)
    }
}
