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
    IDLKind,
    throwException,
    createEmptyReferenceResolver,
    TSLanguageWriter,
} from "@idlize/core"
import {
    IDLEntry,
    IDLType,
    isInterface,
    isEnum,
    isTypedef,
    IDLEnum,
    IDLEnumMember,
    isPrimitiveType,
} from "@idlize/core/idl"
import { Config } from "../Config"
import { IndentedPrinter } from "@idlize/core"
import { IDLFile } from "../Es2PandaTransformer"

export class EnumsPrinter {
    constructor(
        private idl: IDLFile,
        private config: Config
    ) { }

    private writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => { throw new Error(`There is no type conversions in enums`) } },
    )
    print(): string {
        this.idl.entries.forEach(it => this.visit(it))
        return this.writer.getOutput().join('\n')
    }

    printInterfaceContents() {
        this.idl.entries.forEach(it => this.visit(it))
    }

    private visit(node: IDLEntry): void {
        if (isInterface(node)) return
        if (isEnum(node)) return this.visitEnum(node)
        if (isTypedef(node)) return

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private visitEnum(node: IDLEnum): void {
        if (!this.config.shouldEmitEnum(node.name)) return
        this.printEnum(node.name, node.elements)
    }

    private printEnum(name: string, elements: IDLEnumMember[]): void {
        this.writer.writeEnum(
            name,
            elements.map(
                element => {
                    if (!isPrimitiveType(element.type)) {
                        throw new Error(`Unexpected kind of enum element type: ${element.type}`)
                    }
                    if (typeof element.initializer !== 'number') {
                        throw new Error(`Unexpected type of initializer: ${typeof element.initializer}`)
                    }
                    return {
                        name: element.name,
                        stringId: undefined,
                        numberId: element.initializer,
                    }
                }
            )
        )
    }
}
