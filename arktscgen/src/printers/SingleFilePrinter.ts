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

import { Typechecker } from "../general/Typechecker"
import { IDLEntry, IDLEnum, IDLFile, IDLInterface, IDLNode, isEnum, isFile, isInterface, isNamespace } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core"
import { Importer } from "./library/Importer";

export abstract class AbstractVisitor {
    protected abstract visit(entry: IDLNode): void

    visitChildren(entry: IDLNode) {
        if (isFile(entry)) {
            entry.entries.forEach(it => this.visit(it))
        }
        if (isNamespace(entry)) {
            entry.members.forEach(it => this.visit(it))
        }
    }
}

export abstract class SingleFilePrinter extends AbstractVisitor {
    constructor(protected idl: IDLFile) {
        super()
    }

    protected abstract printInterface(node: IDLInterface): void
    protected abstract filterInterface(node: IDLInterface): boolean
    protected printEnum(node: IDLEnum): void {}

    visit(node: IDLNode): void {
        if (isInterface(node) && !this.filterInterface(node)) {
            this.printInterface(node)
        }
        if (isEnum(node)) {
            this.printEnum(node)
        }
        this.visitChildren(node)
    }
    prologue() {}
    epilogue() {}

    protected typechecker = new Typechecker(this.idl.entries)
    protected importer?: Importer
    protected abstract writer: LanguageWriter

    print(): string {
        this.prologue()
        this.visit(this.idl)
        this.epilogue()

        return [
            this.importer?.getOutput() ?? [],
            this.writer.getOutput()
        ]
            .flat()
            .join(`\n`)
    }
}