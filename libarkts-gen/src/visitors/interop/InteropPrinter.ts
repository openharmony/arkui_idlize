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
import { IDLEntry, IDLEnum, IDLInterface, isEnum, isInterface, } from "@idlizer/core/idl"
import { Config } from "../../Config"
import { IDLFile } from "../../IdlFile"

export abstract class InteropPrinter {
    protected constructor(
        protected idl: IDLFile,
        protected config: Config
    ) { }

    protected abstract writer: LanguageWriter

    print(): string {
        this.idl.entries.forEach(it => this.visit(it))
        return this.writer.getOutput().join('\n')
    }

    private visit(node: IDLEntry): void {
        if (isInterface(node)) {
            return this.visitInterface(node)
        }
        if (isEnum(node)) {
            return this.visitEnum(node)
        }
        if (isTypedef(node)) {
            return
        }

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private visitInterface(node: IDLInterface): void {
        node.methods.forEach(it => this.visitMethod(it))
    }

    private visitEnum(node: IDLEnum): void {
        if (!this.config.shouldEmitEnum(node.name)) return
        this.printEnum(node)
    }

    private visitMethod(node: IDLMethod): void {
        this.printMethod(node)
    }

    protected printMethod(node: IDLMethod): void {}

    protected printEnum(node: IDLEnum): void {}
}
