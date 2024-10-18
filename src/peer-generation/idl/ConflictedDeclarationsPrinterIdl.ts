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

import { createLanguageWriter, LanguageWriter } from "../LanguageWriters";
import { IdlPeerLibrary } from "./IdlPeerLibrary";
import { DeclarationNameConvertor } from "./IdlNameConvertor";
import { convertDeclaration } from "./IdlTypeConvertor";
import * as idl from "../../idl";
import { Language } from "../../Language";

class ConflictedDeclarationsVisitorIdl {
    readonly writer = createLanguageWriter(this.library.language)

    constructor(
        protected readonly library: IdlPeerLibrary
    ) {}

    print() {
        const printedNames = new Set<string>()
        for (const decl of this.library.conflictedDeclarations) {
            const name = convertDeclaration(DeclarationNameConvertor.I, decl)
            if (printedNames.has(name)) continue
            printedNames.add(name)

            throw Error("Not implemented")
        }
    }

    protected convertDeclaration(name: string, decl: idl.IDLEntry, writer: LanguageWriter) {
        let maybeGenerics = ''
        if (idl.isClass(decl) || idl.isInterface(decl)) {
            const typeParameters = decl.extendedAttributes
                ?.filter(it => it.name === idl.IDLExtendedAttributes.TypeParameters)
                .map(it => it.value) ?? []

            if (typeParameters.length) {
                maybeGenerics = `<${typeParameters.map((_, i) => `T${i}=undefined`).join(',')}>`
            }
        }
        writer.print(`export type ${name}${maybeGenerics} = object;`)
    }
}

class ArkTSConflictedDeclarationsVisitorIdl extends ConflictedDeclarationsVisitorIdl {
    protected convertDeclaration(name: string, decl: idl.IDLEntry, writer: LanguageWriter) {
        const typeParameters = decl.extendedAttributes
            ?.filter(it => it.name === idl.IDLExtendedAttributes.TypeParameters)
            .map((_, i) => `T${i}=Object`)
        writer.writeClass(name, _ => {}, undefined, undefined, typeParameters)
    }

    print() {
        const printedNames = new Set<string>()
        for (const decl of this.library.conflictedDeclarations) {
            const name = convertDeclaration(DeclarationNameConvertor.I, decl)
            if (printedNames.has(name)) {
                continue
            }
            printedNames.add(name)
            this.convertDeclaration(name, decl, this.writer)
        }
    }
}

export function printConflictedDeclarationsIdl(library: IdlPeerLibrary): string {
    let visitor
    visitor = library.language == Language.ARKTS
        ? new ArkTSConflictedDeclarationsVisitorIdl(library)
        : new ArkTSConflictedDeclarationsVisitorIdl(library)
    visitor.print()
    return visitor.writer.getOutput().join('\n')
}