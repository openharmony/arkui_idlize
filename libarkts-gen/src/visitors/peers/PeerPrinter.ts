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
    createEmptyReferenceResolver,
    IDLInterface,
    IDLType,
    IDLVoidType,
    IndentedPrinter,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { Config } from "../../Config"

export class PeerPrinter {
    constructor(
        private node: IDLInterface,
    ) { }

    // private typechecker = new Typechecker(this.idl.entries)

    private writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => { throwException(`Unexpected call to covert type`) } },
    )

    print(): string {
        this.write()
        return this.writer.getOutput().join(`\n`)
    }

    private write(): void {
        let parent = this.node.inheritance[0]?.name
        if (parent === undefined) {
            return
        }
        this.writer.writeClass(
            this.node.name,
            () => this.printBody(),
            Config.astNodeCommonAncestor
        )
    }

    private printBody(): void {
        // this.printConstructor()
    }

    private printConstructor(): void {
        this.writer.writeConstructorImplementation(
            this.node.name,
            new MethodSignature(
                IDLVoidType,
                []
            ),
            () => {}
        )
    }
}