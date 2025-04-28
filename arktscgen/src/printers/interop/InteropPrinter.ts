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

import { IDLKind, IDLMethod, isTypedef, LanguageWriter, throwException } from "@idlizer/core"
import { IDLEntry, IDLInterface, IDLNode, isEnum, isInterface, isNamespace, } from "@idlizer/core/idl"
import { IDLFile } from "@idlizer/core"
import { Typechecker } from "../../general/Typechecker"
import { AbstractVisitor } from "../SingleFilePrinter"

export abstract class InteropPrinter extends AbstractVisitor {
    constructor(protected file: IDLFile) {
        super()
    }

    protected abstract writer: LanguageWriter

    protected typechecker = new Typechecker(this.file.entries)

    print(): string {
        this.file.entries.forEach(it => this.visit(it))
        return this.writer.getOutput().join('\n')
    }

    visit(node: IDLNode): void {
        if (isInterface(node)) {
            this.visitInterface(node)
        }
        this.visitChildren(node)
    }

    visitInterface(node: IDLInterface): void {
        node.methods.forEach(it => this.visitMethod(node, it))
    }

    visitMethod(iface: IDLInterface, node: IDLMethod): void {
        this.printMethod(iface, node)
    }

    protected printMethod(iface: IDLInterface, node: IDLMethod): void {}
}
