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

import { ImportsCollector } from "../ImportsCollector"
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils"
import { NamedMethodSignature, getMaterializedFileName, PeerLibrary } from "@idlizer/core"
import * as idl from '@idlizer/core'
import { collapseSameMethodsIDL, groupOverloadsIDL } from "./OverloadsPrinter"
import { PrinterResult } from "../LayoutManager"

export function printGlobal(library: PeerLibrary): PrinterResult[] {
    return library.globalScopeInterfaces.map(entry => {
        // collect
        const imports = new ImportsCollector()
        collectDeclItself(library, entry, imports)
        entry.methods.forEach(it => {
            if (it.isStatic) {
                collectDeclDependencies(library, it, decl => {
                    if (library.language !== idl.Language.TS
                        || idl.isInterface(decl) && idl.isMaterialized(decl, library)
                    ) {
                        collectDeclItself(library, decl, imports)
                    }
                })
            }
        })
        imports.addFeatures([entry.name], `./${getMaterializedFileName(entry.name)}`)

        // write
        const writer = library.createLanguageWriter()
        const groupedMethods = groupOverloadsIDL(entry.methods)
        groupedMethods.forEach(methods => {
            const method = collapseSameMethodsIDL(methods)
            const signature = NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: it.type })))
            writer.writeFunctionImplementation(method.name, signature, w => {
                const call = w.makeMethodCall(entry.name, method.name, method.parameters.map(it => w.makeString(it.name)))
                const statement = method.returnType !== idl.IDLVoidType
                    ? w.makeReturn(call)
                    : w.makeStatement(call)
                w.writeStatement(statement)
            })
        })

        return {
            collector: imports,
            content: writer,
            over: {
                node: entry,
                role: idl.LayoutNodeRole.GLOBAL
            }
        }
    })
}
