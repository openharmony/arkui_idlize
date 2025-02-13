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

import { IDLInterface, isInterface } from "@idlizer/core"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { createDefaultTypescriptWriter, IDLFile, nodeType } from "../../utils/idl"

export class NodeMapPrinter extends SingleFilePrinter {
    constructor(idl: IDLFile) {
        super(idl)
        this.writer.pushIndent()
    }

    protected writer = createDefaultTypescriptWriter()

    visit(): void {
        this.idl.entries
            .filter(isInterface)
            .filter(it => this.typechecker.isPeer(it.name))
            .forEach(this.printInterface, this)
    }

    private printInterface(node: IDLInterface): void {
        const type = nodeType(node)
        if (type === undefined) {
            return
        }
        this.writer.writeExpressionStatement(
            this.writer.makeString(`[${type}, peers.${node.name}],`)
        )
    }
}
