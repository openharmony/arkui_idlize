/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { ImportsCollector } from "../ImportsCollector.js"
import { collectDeclItself } from "../ImportsCollectorUtils.js"
import { NamedMethodSignature, PeerLibrary } from "@idlizer/core"
import * as idl from '@idlizer/core'
import { PrinterResult } from "../LayoutManager.js"
import { collectDeclarationTargets } from "../DeclarationTargetCollector.js"

export function printEnumSupportFunctions(library: PeerLibrary): PrinterResult[] {
    return collectDeclarationTargets(library)
        .filter(it => idl.isEnum(it) && idl.isStringEnum(it))
        .filter(it => idl.isInCurrentModule(it) || idl.isInExternalModule(it))
        .map(it => {
            const enumDecl = it as idl.IDLEnum
            return {
                generate: () => {
                    const content = library.createLanguageWriter()

                    const imports = new ImportsCollector()
                    collectDeclItself(library, enumDecl, imports)
                    imports.addFeature("int32", "@koalaui/common")

                    writeToOrdinalFunction(enumDecl, content)

                    return { content, imports }
                },
                over: {
                    node: enumDecl,
                    role: idl.LayoutNodeRole.SERIALIZER
                },
                ignoreNamespace: true,
            }
        })
}

function writeToOrdinalFunction(enumDecl: idl.IDLEnum, writer: idl.LanguageWriter) {
    const signature = new NamedMethodSignature(
        idl.createPrimitiveType("i32"),
        [idl.createReferenceType(enumDecl)],
        ["value"],
    )
    writer.writeFunctionImplementation(
        idl.getEnumToOrdinalName(writer.language, enumDecl),
        signature,
        writer => {
            const enumName = writer.getNodeName(enumDecl)
            writer.print(`switch (${signature.argName(0)}) {`)
            writer.pushIndent()
            enumDecl.elements.forEach((it, index) => {
                const elementName = idl.getExtAttribute(it, idl.IDLExtendedAttributes.OriginalEnumMemberName) ?? it.name
                writer.print(`case ${enumName}.${elementName}: return ${index}`)
            })
            writer.popIndent()
            writer.print(`}`)
            const errorMessage = writer.makeString(`new Error(\`Unexpected value \$\{${signature.argName(0)}\} for enum ${enumName}\`)`)
            writer.writeStatement(writer.makeThrowError(errorMessage))
        },
    )
}