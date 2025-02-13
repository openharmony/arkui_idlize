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

import {
    IndentedPrinter,
    camelCaseToUpperSnakeCase,
    maybeOptional,
    Language,
    createConstructPeerMethod,
    createDestroyPeerMethod,
    PeerClass,
    PeerMethod,
    PeerLibrary,
    CppReturnTypeConvertor,
} from '@idlizer/core'
import { getNodeTypes } from "../FileGenerators";
import { peerGeneratorConfiguration} from "../PeerGeneratorConfig";
import { collectCallbacks, groupCallbacks, CallbackInfo } from "./EventsPrinter";
import { printMethodDeclaration } from "../LanguageWriters";

export function generateEventReceiverName(componentName: string) {
    return `${peerGeneratorConfiguration().cppPrefix}ArkUI${componentName}EventsReceiver`
}

export class HeaderVisitor {
    private readonly returnTypeConvertor = new CppReturnTypeConvertor(this.library)
    constructor(
        private library: PeerLibrary,
        private api: IndentedPrinter,
        private modifiersList: IndentedPrinter,
        private accessorsList: IndentedPrinter,
        private eventsList: IndentedPrinter,
        private nodeTypesList: IndentedPrinter,
    ) {}

    private apiModifierHeader(clazz: PeerClass) {
        return `typedef struct ${peerGeneratorConfiguration().cppPrefix}ArkUI${clazz.componentName}Modifier {`
    }

    private printClassProlog(clazz: PeerClass) {
        this.api.print(this.apiModifierHeader(clazz))
        this.api.pushIndent()
        this.modifiersList.pushIndent()
        this.modifiersList.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${clazz.componentName}Modifier* (*get${clazz.componentName}Modifier)();`)
    }

    private printMethod(method: PeerMethod) {
        const apiParameters = method.generateAPIParameters(this.library.createTypeNameConvertor(Language.CPP))
        printMethodDeclaration(this.api, this.returnTypeConvertor.convert(method.returnType), `(*${method.fullMethodName})`, apiParameters, `;`)
    }

    private printClassEpilog(clazz: PeerClass) {
        this.api.popIndent()
        this.api.print(`} ${peerGeneratorConfiguration().cppPrefix}ArkUI${clazz.componentName}Modifier;\n`)
        this.modifiersList.popIndent()
    }

    private printAccessors() {
        this.api.print("// Accessors\n")
        this.accessorsList.pushIndent()
        this.library.materializedClasses.forEach(c => {
            this.printAccessor(c.className)
            this.accessorsList.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUI${c.className}Accessor* (*get${c.className}Accessor)();`)
        })
        this.accessorsList.popIndent()
    }

    private printAccessor(name: string) {
        const clazz = this.library.materializedClasses.get(name)
        if (clazz) {
            let peerName = `${name}Peer`
            let accessorName = `${peerGeneratorConfiguration().cppPrefix}ArkUI${name}Accessor`
            this.api.print(`typedef struct ${accessorName} {`)
            this.api.pushIndent()
            const mDestroyPeer = createDestroyPeerMethod(clazz)
            const methods = [mDestroyPeer, clazz.ctor, clazz.finalizer].concat(clazz.methods)
            methods.forEach(method => { if (method) this.printMethod(method) })
            this.api.popIndent()
            this.api.print(`} ${accessorName};\n`)
        }
    }

    private printEventsReceiver(componentName: string, callbacks: CallbackInfo[]) {
        return this.printEventsReceiverIdl(componentName, callbacks as CallbackInfo[], this.library)
    }

    private printEventsReceiverIdl(componentName: string, callbacks: CallbackInfo[], library: PeerLibrary) {
        const receiver = generateEventReceiverName(componentName)
        this.api.print(`typedef struct ${receiver} {`)
        this.api.pushIndent()

        const nameConvertor = this.library.createTypeNameConvertor(Language.CPP)

        for (const callback of callbacks) {
            const args = ["Ark_Int32 nodeId",
                ...callback.args.map(it =>
                    `const ${nameConvertor.convert(maybeOptional(library.typeConvertor(it.name, it.type, it.nullable).nativeType(), it.nullable))} ${it.name}`)]
            printMethodDeclaration(this.api, "void", `(*${callback.methodName})`, args, `;`)
        }
        this.api.popIndent()
        this.api.print(`} ${receiver};\n`)
    }

    private printEvents() {
        const callbacks = groupCallbacks(collectCallbacks(this.library))
        for (const [receiver, events] of callbacks) {
            this.printEventsReceiver(receiver, events)
        }

        this.eventsList.pushIndent()
        for (const [receiver, _] of callbacks) {
            this.eventsList.print(`const ${generateEventReceiverName(receiver)}* (*get${receiver}EventsReceiver)();`)
        }
        this.eventsList.popIndent()
    }

    private printNodeTypes() {
        this.nodeTypesList.pushIndent()
        for (const nodeType of getNodeTypes(this.library)) {
            const name = `${peerGeneratorConfiguration().cppPrefix}ARKUI_${camelCaseToUpperSnakeCase(nodeType)}`
            this.nodeTypesList.print(name)
        }
        this.nodeTypesList.popIndent()
    }

    // TODO: have a proper Peer module visitor
    printApiAndDeserializer() {
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => {
                this.printClassProlog(clazz)
                this.printMethod(createConstructPeerMethod(clazz))
                clazz.methods.forEach(method => {
                    this.printMethod(method)
                })
                this.printClassEpilog(clazz)
            })
        })
        this.printAccessors()
        this.printEvents()
        this.printNodeTypes()
    }
}
