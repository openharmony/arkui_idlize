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
import { collectDeclDependencies } from "../ImportsCollectorUtils"
import { createLanguageWriter, LanguageStatement, LanguageWriter, Method, NamedMethodSignature } from "../LanguageWriters"
import { getInternalClassName, getMaterializedFileName } from "../Materialized"
import { NativeModuleType } from "../NativeModuleType"
import { PeerLibrary } from "../PeerLibrary"
import { PeerMethod } from "../PeerMethod"
import { writePeerMethod } from "./PeersPrinter"
import { TargetFile } from "./TargetFile"
import * as idl from '@idlize/core'

const MODULE_NAME = 'GlobalScope'
class GlobalScopePrinter {

    private writer: LanguageWriter
    constructor(
        private library: PeerLibrary
    ) {
        this.writer = createLanguageWriter(library.language, this.library)
    }

    static create(library: PeerLibrary) {
        return new GlobalScopePrinter(library)
    }

    ///////////////////////////////////////////////

    private collectImports(entries:idl.IDLInterface[], imports:ImportsCollector) {
        entries.forEach(entry => {
            collectDeclDependencies(this.library, entry, imports)
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
        const globals = this.library.files
            .flatMap(f => f.entries)
            .filter(e => idl.isInterface(e))
            .filter(e => idl.hasExtAttribute(e, idl.IDLExtendedAttributes.GlobalScope)) as idl.IDLInterface[]

        this.printImports(globals)
        
        for (const entry of globals) {
            if (idl.isInterface(entry)) {
                entry.methods.forEach(method => {
                    const lwMethod = new Method(
                        method.name,
                        new NamedMethodSignature(
                            method.returnType,
                            method.parameters.map(p => p.type!),
                            method.parameters.map(p => p.name)
                        ),
                    )
                    this.writer.writeFunctionImplementation(lwMethod.name, lwMethod.signature, w => {
                        const call = w.makeMethodCall(entry.name, method.name, method.parameters.map(it => w.makeString(it.name)))
                        let statement: LanguageStatement
                        if (method.returnType !== idl.IDLVoidType) {
                            statement = w.makeReturn(call)
                        } else {
                            statement = w.makeStatement(call)
                        }
                        w.writeStatement(
                            statement
                        )
                    })
                })
            }
        }

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
