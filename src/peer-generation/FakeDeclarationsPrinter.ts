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

import { DeclarationGenerator } from "./InterfacePrinter";
import { createLanguageWriter } from "./LanguageWriters";
import { PeerLibrary } from "./PeerLibrary";
import { convertDeclaration } from "./TypeNodeConvertor";
import { makeFakeDeclarationsFiles } from "./fake_declaration";

export function printFakeDeclarations(library: PeerLibrary): Map<string, string> {
    const lang = library.declarationTable.language
    const declarationGenerator = new DeclarationGenerator(library)
    const result = new Map<string, string>()
    for (const [filename, nodes] of makeFakeDeclarationsFiles()) {
        const writer = createLanguageWriter(lang)
        for (const node of nodes) {
            writer.print(convertDeclaration(declarationGenerator, node))
        }
        result.set(`${filename}${lang.extension}`, writer.getOutput().join('\n'))
    }
    return result
}