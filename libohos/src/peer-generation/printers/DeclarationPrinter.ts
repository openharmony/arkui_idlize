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

import * as idl from '@idlizer/core/idl'
import { CustomPrintVisitor as DtsPrintVisitor, isInIdlize, Language, PeerLibrary } from '@idlizer/core'
import { LanguageWriter } from "@idlizer/core"
import { DependenciesCollector } from "../idl/IdlDependenciesCollector"
import { ImportsCollector } from "../ImportsCollector"
import { collectComponents } from "../ComponentsCollector"
import { qualifiedName } from '@idlizer/core'

class GeneratorSyntheticPrinter extends DependenciesCollector {
    constructor(
        library: PeerLibrary,
        private readonly onGeneratorSyntheticDependency: (entry: idl.IDLEntry) => void
    ) {
        super(library)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl && !idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import))
            this.onGeneratorSyntheticDependency(decl)
        return super.convertTypeReferenceAsImport(type, importClause)
    }
}

function printDeclarationIfNeeded(library: PeerLibrary, entry: idl.IDLEntry, seenNames: Set<String>): string {
    const scopedName = qualifiedName(entry, ".", "namespace.name")
    if (seenNames.has(scopedName))
        return ""
    const visitor = new DtsPrintVisitor(type => library.resolveTypeReference(type), library.language)
    visitor.visit(entry, true)
    const text = visitor.output.join("\n")
    if (text)
        seenNames.add(scopedName)
    return text
}

export function printDeclarations(peerLibrary: PeerLibrary): Array<string> {
    const result = []
    const seenEntries = new Set<string>()
    const syntheticsGenerator = new GeneratorSyntheticPrinter(peerLibrary, (entry) => {
        const text = printDeclarationIfNeeded(peerLibrary, entry, seenEntries)
        if (text)
            result.push(text)
    })
    for (const file of peerLibrary.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            if (idl.isImport(entry) || isInIdlize(entry) || idl.isNamespace(entry))
                continue
            syntheticsGenerator.convert(entry)
            const text = printDeclarationIfNeeded(peerLibrary, entry, seenEntries)
            if (text)
                result.push(text)
        }
    }
    for (const decl of collectComponents(peerLibrary)) {
        const iface = decl.interfaceDeclaration
        if (iface) {
            result.push(`declare const ${decl.name}: ${iface.name}`)
            result.push(`declare const ${decl.name}Instance: ${decl.attributeDeclaration.name}`)
        }
    }
    return result
}

function printEnumsGlobalAssign(enums: idl.IDLEnum[], writer: LanguageWriter) {
    if (writer.language !== Language.TS)
        return
    writer.print("Object.assign(globalThis, {")
    writer.pushIndent()
    for (const decl of enums) {
        const namespaces = idl.getNamespacesPathFor(decl)
        if (namespaces.length > 0)
            writer.print(`${namespaces[0].name}: ${namespaces[0].name},`)
        else
            writer.print(`${decl.name}: ${decl.name},`)
    }
    writer.popIndent()
    writer.print("})")
}

export function printEnumsImpl(peerLibrary: PeerLibrary, writer: LanguageWriter) {
    const seenNames = new Set<string>()
    const enums = new Array<idl.IDLEnum>()
    const imports = new ImportsCollector()
    imports.addFeatures(['int32', 'float32'], "@koalaui/common")
    imports.print(writer, "")
    for (const file of peerLibrary.files)
        for (const decl of idl.linearizeNamespaceMembers(file.entries)) {
            if (idl.isEnum(decl)) {
                // An ugly hack to avoid double definition of ContentType enum.
                if (seenNames.has(decl.name) && decl.name == "ContentType") continue
                seenNames.add(decl.name)
                enums.push(decl)
                writer.writeStatement(writer.makeEnumEntity(decl, true))
            }
        }
    printEnumsGlobalAssign(enums, writer)
}
