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


import { IndentedPrinter } from "../IndentedPrinter";
import { makeAPI, makeCDeserializer } from "./FileGenerators";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";

class HeaderVisitor {
    constructor(
        private library: PeerLibrary,
        private api: IndentedPrinter,
        private apiList: IndentedPrinter

    ) { }

    private apiModifierHeader(clazz: PeerClass) {
        return `typedef struct ArkUI${clazz.componentName}Modifier {`
    }

    private printClassProlog(clazz: PeerClass) {
        this.api.print(this.apiModifierHeader(clazz))
        this.api.pushIndent()
        this.apiList.pushIndent()
        this.apiList.print(`const ArkUI${clazz.componentName}Modifier* (*get${clazz.componentName}Modifier)();`)
    }

    private printMethod(method: PeerMethod) {
        const apiParameters = method.generateAPIParameters(method.argConvertors).join(", ")
        this.api.print(`${method.retType} (*${method.fullMethodName})(${apiParameters});`)
    }

    private printClassEpilog(clazz: PeerClass) {
        if (clazz.methods.length == 0) {
            this.api.print("int dummy;")
        }
        this.api.popIndent()
        this.api.print(`} ArkUI${clazz.componentName}Modifier;\n`)
        this.apiList.popIndent()
    }

    // TODO: have a proper Peer module visitor
    printApiAndDeserializer() {
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => {
                this.printClassProlog(clazz)
                clazz.methods.forEach(method => {
                    this.printMethod(method)
                })
                this.printClassEpilog(clazz)
            })
        })
    }
}

export function printApiAndDeserializer(apiVersion: string|undefined, peerLibrary: PeerLibrary): {api: string, deserializer: string} {
    const apiHeader = new IndentedPrinter()
    const apiList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, apiList)
    visitor.printApiAndDeserializer()

    const structs = new IndentedPrinter()
    const typedefs = new IndentedPrinter()

    const deserializer = makeCDeserializer(peerLibrary.declarationTable, structs, typedefs)
    const api = makeAPI(apiVersion ?? "0", apiHeader.getOutput(), apiList.getOutput(), structs, typedefs)

    return {api, deserializer}
}