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
import { Materialized } from "./Materialized";

class HeaderVisitor {
    constructor(
        private library: PeerLibrary,
        private api: IndentedPrinter,
        private modifiersList: IndentedPrinter,
        private accessorsList: IndentedPrinter
    ) { }

    private apiModifierHeader(clazz: PeerClass) {
        return `typedef struct ArkUI${clazz.componentName}Modifier {`
    }

    private printClassProlog(clazz: PeerClass) {
        this.api.print(this.apiModifierHeader(clazz))
        this.api.pushIndent()
        this.modifiersList.pushIndent()
        this.modifiersList.print(`const ArkUI${clazz.componentName}Modifier* (*get${clazz.componentName}Modifier)();`)
    }

    private printMethod(method: PeerMethod) {
        const apiParameters = method.generateAPIParameters().join(", ")
        this.api.print(`${method.retType} (*${method.fullMethodName})(${apiParameters});`)
    }

    private printClassEpilog(clazz: PeerClass) {
        if (clazz.methods.length == 0) {
            this.api.print("int dummy;")
        }
        this.api.popIndent()
        this.api.print(`} ArkUI${clazz.componentName}Modifier;\n`)
        this.modifiersList.popIndent()
    }

    private printAccessors() {
        this.api.print("// Accessors\n")
        this.accessorsList.pushIndent()
        Materialized.Instance.materializedClasses.forEach(c => {
            this.printAccessor(c.className)
            this.accessorsList.print(`const ArkUI${c.className}Accessor* (*get${c.className}Accessor)();`)
        })
        this.accessorsList.popIndent()
    }

    private printAccessor(name: string) {
        const clazz = Materialized.Instance.materializedClasses.get(name)
        if (clazz) {
            let peerName = `${name}Peer`
            let accessorName = `ArkUI${name}Accessor`
            this.api.print(`typedef struct ${peerName} ${peerName};`)
            this.api.print(`typedef struct ${accessorName} {`)
            this.api.pushIndent()

            let names = new Set<string>();
            [clazz.ctor, clazz.dtor].concat(clazz.methods)
                .forEach(method => {
                    // TBD: handle methods with the same name like SubTabBarStyle
                    // of(content: ResourceStr) and
                    // of(content: ResourceStr | ComponentContent)
                    if (names.has(method.overloadedName)) {
                        return
                    }
                    names.add(method.overloadedName)
                    this.api.print(`${method.retType} (*${method.overloadedName})(${method.generateAPIParameters().join(", ")});`)
                })
            this.api.popIndent()
            this.api.print(`} ${accessorName};\n`)
        }
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
        this.printAccessors()
    }
}

export function printApiAndDeserializer(apiVersion: string|undefined, peerLibrary: PeerLibrary): {api: string, deserializer: string} {
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList)
    visitor.printApiAndDeserializer()

    const structs = new IndentedPrinter()
    const typedefs = new IndentedPrinter()

    const deserializer = makeCDeserializer(peerLibrary.declarationTable, structs, typedefs)
    const api = makeAPI(apiVersion ?? "0", apiHeader.getOutput(), modifierList.getOutput(), accessorList.getOutput(), structs, typedefs)

    return {api, deserializer}
}