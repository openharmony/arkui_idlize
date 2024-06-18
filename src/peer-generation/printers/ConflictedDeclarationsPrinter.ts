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

import * as ts from 'typescript'
import { IndentedPrinter } from "../../IndentedPrinter";
import { createLanguageWriter } from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary";
import { DeclarationNameConvertor } from "../dependencies_collector";
import { convertDeclaration } from '../TypeNodeConvertor';

class ConflictedDeclarationsVisitor {
    readonly writer = createLanguageWriter(this.library.declarationTable.language)

    constructor(
        private readonly library: PeerLibrary
    ) {}

    print() {
        const printedNames = new Set<string>()
        for (const decl of this.library.conflictedDeclarations) {
            const name = convertDeclaration(DeclarationNameConvertor.I, decl)
            if (printedNames.has(name)) continue
            printedNames.add(name)

            const parent = decl.parent
            if (ts.isModuleBlock(parent)) {
                this.writer.print(`export namespace ${parent.parent.name.text} {`)
                this.writer.pushIndent()
            }

            let maybeGenerics = ''
            if (ts.isClassDeclaration(decl) || ts.isInterfaceDeclaration(decl))
                if (decl.typeParameters?.length)
                    maybeGenerics = `<${decl.typeParameters.map((_, i) => `T${i}=undefined`).join(',')}>`
            this.writer.print(`export type ${name}${maybeGenerics} = object;`)

            if (ts.isModuleBlock(parent)) {
                this.writer.popIndent()
                this.writer.print('}')
            }
        }
    }
}

export function printConflictedDeclarations(library: PeerLibrary): string {
    const visitor = new ConflictedDeclarationsVisitor(library)
    visitor.print()
    return visitor.writer.getOutput().join('\n')
}