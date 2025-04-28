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
import { IDLFile, IDLInterface, IDLNode, isInterface } from "@idlizer/core"
import { AbstractVisitor } from "./SingleFilePrinter"

export type MultiFileOutput = { fileName: string, output: string }

export abstract class MultiFilePrinter extends AbstractVisitor {
    constructor(protected idl: IDLFile) {
        super()
    }

    protected typechecker = new Typechecker(this.idl.entries)
    protected output: MultiFileOutput[] = []

    protected abstract printInterface(node: IDLInterface): MultiFileOutput
    protected abstract filterInterface(node: IDLInterface): boolean

    visit(node: IDLNode): void {
        if (isInterface(node) && !this.filterInterface(node)) {
            this.output.push(this.printInterface(node))
        }
        this.visitChildren(node)
    }

    print(): MultiFileOutput[] {
        this.visit(this.idl)
        return this.output
    }
}