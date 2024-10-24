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

import { CustomPrintVisitor as DtsPrintVisitor} from "../../from-idl/DtsPrinter"
import * as idl from "../../idl"
import { tsCopyrightAndWarning } from "../FileGenerators"
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary"
import { TargetFile } from "./TargetFile"

export function printDeclarations(peerLibrary: IdlPeerLibrary): Map<TargetFile, string> {
    const seen = new Set<string>()
    const result = new Map<TargetFile, string>()
    const extension = peerLibrary.language.extension
    for (const decl of peerLibrary.declarations) {
        const filename = targetFile(decl, extension)
        if (seen.has(filename)) continue
        seen.add(filename)

        const visitor = new DtsPrintVisitor(ref => resolveSyntheticType(ref, peerLibrary))
        visitor.visit(decl)
        const text = visitor.output.join("\n")
        if (text)
            result.set(new TargetFile(filename), text)
    }
    return result
}

function resolveSyntheticType(typeRef: idl.IDLReferenceType, peerLibrary: IdlPeerLibrary) {
    const decl = peerLibrary.resolveTypeReference(typeRef)
    return decl && idl.isSyntheticEntry(decl) ? decl : undefined
}

function targetFile(decl: idl.IDLEntry, extension: string): string {
    const namespace = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Namespace)
    return (namespace ? `${namespace}.` : "") + decl.name + extension
}