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
import { PeerLibrary } from "../PeerLibrary"
import { convertDeclaration } from "../LanguageWriters/nameConvertor";
import * as idl from "../../idl";
import { Language } from "../../Language";
import { ArkTSDeclConvertor, getCommonImports } from "./InterfacePrinter";
import {
    convertDeclToFeature,
    createDeclDependenciesCollector,
    createTypeDependenciesCollector,
} from "../idl/IdlPeerGeneratorVisitor";
import { ImportsCollector } from "../ImportsCollector";
import { DeclarationNameConvertor } from "../idl/IdlNameConvertor";

class ConflictedDeclarationsVisitor {
    readonly writer = createLanguageWriter(this.library.language, this.library)

    constructor(
        protected readonly library: PeerLibrary
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
            const typeParameters = decl.typeParameters ?? []
            if (typeParameters.length) {
                maybeGenerics = `<${typeParameters.map((_, i) => `T${i}=undefined`).join(',')}>`
            }
        }
        writer.print(`export type ${name}${maybeGenerics} = object;`)
    }
}

class ArkTSConflictedDeclarationsVisitor extends ConflictedDeclarationsVisitor {
    protected convertDeclaration(name: string, decl: idl.IDLEntry, writer: LanguageWriter) {
        const declConvertor = new ArkTSDeclConvertor(writer, this.library)
        convertDeclaration(declConvertor, decl)
    }

    print() {
        const typeDependenciesCollector = createTypeDependenciesCollector(this.library)
        const declDependenciesCollector = createDeclDependenciesCollector(this.library, typeDependenciesCollector)
        const importsCollector = new ImportsCollector()
        getCommonImports(this.library.language).forEach(it => importsCollector.addFeature(it.feature, it.module))
        this.library.conflictedDeclarations.forEach(it => {
            declDependenciesCollector.convert(it).forEach(it => {
                const dep = convertDeclToFeature(this.library, it)
                importsCollector.addFeature(dep.feature, dep.module)
            })
        })
        importsCollector.print(this.writer, '')
        this.writer.print('')

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

export function printConflictedDeclarations(library: PeerLibrary): string {
    let visitor
    visitor = library.language == Language.ARKTS
        ? new ArkTSConflictedDeclarationsVisitor(library)
        : new ConflictedDeclarationsVisitor(library)
    visitor.print()
    return visitor.writer.getOutput().join('\n')
}