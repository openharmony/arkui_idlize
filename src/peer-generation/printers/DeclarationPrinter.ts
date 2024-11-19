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

import * as idl from "../../idl"
import { CustomPrintVisitor as DtsPrintVisitor} from "../../from-idl/DtsPrinter"
import { isMaterialized } from "../idl/IdlPeerGeneratorVisitor"
import { PeerLibrary } from "../PeerLibrary"
import { LanguageWriter } from "../LanguageWriters"

export function printDeclarations(peerLibrary: PeerLibrary): Array<string> {
    const result = []
    const seenEnums = new Set<string>()
    for (const decl of peerLibrary.declarations) {
        if (idl.isEnum(decl)) {
            // One more hack to avoid double definition of ContentType enum.
            if (seenEnums.has(decl.name)) continue
            seenEnums.add(decl.name)
        }
        const visitor = new DtsPrintVisitor(type => peerLibrary.resolveTypeReference(type), peerLibrary.language)
        if ((idl.isInterface(decl) || idl.isClass(decl)) && isMaterialized(decl)) continue
        visitor.visit(decl)
        const text = visitor.output.join("\n")
        if (text)
            result.push(text)
    }
    for (const decl of peerLibrary.componentsDeclarations) {
        const iface = decl.interfaceDeclaration
        if (iface) {
            result.push(`declare const ${decl.name}: ${iface.name}`)
        }
    }
    return result
}

export function printEnumsImpl(peerLibrary: PeerLibrary, writer: LanguageWriter) {
    const seenNames = new Set()
    for (const decl of peerLibrary.declarations) {
        if (idl.isEnum(decl)) {
            // An ugly hack to avoid double definition of ContentType enum.
            if (seenNames.has(decl.name) && decl.name == "ContentType") continue
            seenNames.add(decl.name)
            writer.writeStatement(writer.makeEnumEntity(decl, true))
        }
    }
}
