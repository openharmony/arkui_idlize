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

import { IDLFile } from "../IdlFile"
import { CachedLogger } from "../CachedLogger"
import { isInterface, isReferenceType } from "@idlizer/core"

export class VerifyVisitor {
    constructor(
        private idl: IDLFile
    ) {}

    private incorrectDeclarations = new Set<string>()

    complain(): void {
        this.idl.entries.forEach(it => this.verifyDeclaration(it.name))
        this.idl.entries
            .filter(isInterface)
            .flatMap(it => it.methods)
            .flatMap(it => it.parameters)
            .map(it => it.type)
            .filter(isReferenceType)
            .forEach(it => this.verifyDeclaration(it.name))
    }

    private verifyDeclaration(name: string): void {
        const declarations = this.idl.entries.filter(it => name === it.name)
        if (declarations.length === 1) {
            return
        }
        if (this.incorrectDeclarations.has(name)) {
            return
        }
        this.incorrectDeclarations.add(name)
        CachedLogger.warn(
            `Expected reference type "${name}" to have exactly one declaration, got: ${declarations.length}`
        )
    }
}
