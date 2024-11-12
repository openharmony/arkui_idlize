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
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary"
import { IndentedPrinter } from "../../IndentedPrinter"

export function printDeclarations(peerLibrary: IdlPeerLibrary): Array<string> {
    const result = []
    for (const decl of peerLibrary.declarations) {
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
