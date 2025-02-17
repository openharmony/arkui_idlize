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

import { tsCopyrightAndWarning } from "../FileGenerators"
import { ImportsCollector } from "../ImportsCollector"
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils"
import { LanguageWriter, NamedMethodSignature, getMaterializedFileName, PeerLibrary } from "@idlizer/core"
import { TargetFile } from "./TargetFile"
import * as idl from '@idlizer/core'
import { collapseSameMethodsIDL, groupOverloadsIDL } from "./OverloadsPrinter"

const MODULE_NAME = 'GlobalScope'
class GlobalScopePrinter {

    private writer: LanguageWriter
    constructor(
        private library: PeerLibrary
    ) {
        this.writer = library.createLanguageWriter()
    }

    static create(library: PeerLibrary) {
        return new GlobalScopePrinter(library)
    }

    ///////////////////////////////////////////////

    private collectImports(entries:idl.IDLInterface[], imports:ImportsCollector) {
        entries.forEach(entry => {
            collectDeclItself(this.library, entry, imports)
            entry.methods.forEach(it => {
                if (it.isStatic) {
                    collectDeclDependencies(this.library, it, decl => {
                        if (this.library.language !== idl.Language.TS
                         || idl.isInterface(decl) && idl.isMaterialized(decl, this.library)
                        ) {
                            collectDeclItself(this.library, decl, imports)
                        }
                    })
                }
            })
        })
    }

    private printImports(entries:idl.IDLInterface[]) {
        const imports = new ImportsCollector()
        this.collectImports(entries, imports)
        for (const entry of entries) {
            imports.addFeatures([ entry.name ], `./${getMaterializedFileName(entry.name)}`)
        }
        imports.print(this.writer, MODULE_NAME)
    }

    visit(): string {
        if ([idl.Language.TS, idl.Language.ARKTS].includes(this.library.language)) {
            this.printImports(this.library.globalScopeInterfaces)
        }
        this.library.globalScopeInterfaces.forEach(entry => {
            const groupedMethods = groupOverloadsIDL(entry.methods)
            groupedMethods.forEach(methods => {
                const method = collapseSameMethodsIDL(methods)
                const signature = NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: it.type })))
                this.writer.writeFunctionImplementation(method.name, signature, w => {
                    const call = w.makeMethodCall(entry.name, method.name, method.parameters.map(it => w.makeString(it.name)))
                    const statement = method.returnType !== idl.IDLVoidType
                        ? w.makeReturn(call)
                        : w.makeStatement(call)
                    w.writeStatement(statement)
                })
            })
        })

        return this.writer.getOutput().join('\n')
    }
}

export function printGlobal(peerLibrary: PeerLibrary): Map<TargetFile, string> {

    if (peerLibrary.globalScopeInterfaces.flatMap(x => x.methods).length === 0) {
        return new Map([])
    }

    const content = GlobalScopePrinter
        .create(peerLibrary)
        .visit()

    return new Map([
        [new TargetFile(MODULE_NAME + peerLibrary.language.extension), tsCopyrightAndWarning(content)]
    ])
}
