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

import { IndentedPrinter } from "../../IndentedPrinter";
import { getNodeTypes, makeAPI, makeConverterHeader, makeCSerializers } from "../FileGenerators";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { collectCallbacks, groupCallbacks, IdlCallbackInfo } from "./EventsPrinter";
import { CppLanguageWriter, createTypeNameConvertor, printMethodDeclaration } from "../LanguageWriters";
import { camelCaseToUpperSnakeCase } from "../../util";
import { maybeOptional } from "../../idl";
import { PeerLibrary } from "../PeerLibrary";
import { PeerClass } from "../PeerClass";
import { PeerMethod } from "../PeerMethod";
import { getReferenceResolver } from "../ReferenceResolver";
import { Language } from "../../Language";
import { createDestroyPeerMethod } from "../Materialized";

export function generateEventReceiverName(componentName: string) {
    return `${PeerGeneratorConfig.cppPrefix}ArkUI${componentName}EventsReceiver`
}

class HeaderVisitor {
    constructor(
        private library: PeerLibrary,
        private api: IndentedPrinter,
        private modifiersList: IndentedPrinter,
        private accessorsList: IndentedPrinter,
        private eventsList: IndentedPrinter,
        private nodeTypesList: IndentedPrinter,
    ) {}

    private apiModifierHeader(clazz: PeerClass) {
        return `typedef struct ${PeerGeneratorConfig.cppPrefix}ArkUI${clazz.componentName}Modifier {`
    }

    private printClassProlog(clazz: PeerClass) {
        this.api.print(this.apiModifierHeader(clazz))
        this.api.pushIndent()
        this.modifiersList.pushIndent()
        this.modifiersList.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${clazz.componentName}Modifier* (*get${clazz.componentName}Modifier)();`)
    }

    private printMethod(method: PeerMethod) {
        const apiParameters = method.generateAPIParameters(createTypeNameConvertor(Language.CPP, getReferenceResolver(this.library)))
        printMethodDeclaration(this.api, method.retType, `(*${method.fullMethodName})`, apiParameters, `;`)
    }

    private printClassEpilog(clazz: PeerClass) {
        if (clazz.methods.length == 0) {
            this.api.print("int dummy;")
        }
        this.api.popIndent()
        this.api.print(`} ${PeerGeneratorConfig.cppPrefix}ArkUI${clazz.componentName}Modifier;\n`)
        this.modifiersList.popIndent()
    }

    private printAccessors() {
        this.api.print("// Accessors\n")
        this.accessorsList.pushIndent()
        this.library.materializedClasses.forEach(c => {
            this.printAccessor(c.className)
            this.accessorsList.print(`const ${PeerGeneratorConfig.cppPrefix}ArkUI${c.className}Accessor* (*get${c.className}Accessor)();`)
        })
        this.accessorsList.popIndent()
    }

    private printAccessor(name: string) {
        const clazz = this.library.materializedClasses.get(name)
        if (clazz) {
            let peerName = `${name}Peer`
            let accessorName = `${PeerGeneratorConfig.cppPrefix}ArkUI${name}Accessor`
            this.api.print(`typedef struct ${peerName} ${peerName};`)
            this.api.print(`typedef struct ${accessorName} {`)
            this.api.pushIndent()
            const mDestroyPeer = createDestroyPeerMethod(clazz)
            const methods = [clazz.ctor, clazz.finalizer, mDestroyPeer].concat(clazz.methods)
            methods.forEach(method => this.printMethod(method))
            this.api.popIndent()
            this.api.print(`} ${accessorName};\n`)
        }
    }

    private printEventsReceiver(componentName: string, callbacks: IdlCallbackInfo[]) {
        return this.printEventsReceiverIdl(componentName, callbacks as IdlCallbackInfo[], this.library)
    }

    private printEventsReceiverIdl(componentName: string, callbacks: IdlCallbackInfo[], library: PeerLibrary) {
        const receiver = generateEventReceiverName(componentName)
        this.api.print(`typedef struct ${receiver} {`)
        this.api.pushIndent()

        const nameConvertor = createTypeNameConvertor(Language.CPP, getReferenceResolver(this.library))

        for (const callback of callbacks) {
            const args = ["Ark_Int32 nodeId",///same code in EventsPrinter
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
            const name = `${PeerGeneratorConfig.cppPrefix}ARKUI_${camelCaseToUpperSnakeCase(nodeType)}`
            this.nodeTypesList.print(name)
        }
        this.nodeTypesList.popIndent()
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
        this.printEvents()
        this.printNodeTypes()
    }
}

export function printUserConverter(headerPath: string, namespace: string, apiVersion: number, peerLibrary: PeerLibrary) :
        {api: string, converterHeader: string}
{
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()
    const nodeTypesList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList, nodeTypesList)
    visitor.printApiAndDeserializer()

    const structs = new CppLanguageWriter(new IndentedPrinter(), getReferenceResolver(peerLibrary))
    const typedefs = new IndentedPrinter()

    const converterHeader = makeConverterHeader(headerPath, namespace, peerLibrary).getOutput().join("\n")
    makeCSerializers(peerLibrary, structs, typedefs)
    const api = makeAPI(apiVersion.toString(), apiHeader.getOutput(), modifierList.getOutput(), accessorList.getOutput(), eventsList.getOutput(), nodeTypesList.getOutput(), structs, typedefs)
    return {api, converterHeader}
}

export function printSerializers(apiVersion: number, peerLibrary: PeerLibrary): {api: string, serializers: string} {
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()
    const nodeTypesList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList, nodeTypesList)
    visitor.printApiAndDeserializer()

    const structs = new CppLanguageWriter(new IndentedPrinter(), getReferenceResolver(peerLibrary))
    const typedefs = new IndentedPrinter()

    const serializers = makeCSerializers(peerLibrary, structs, typedefs)
    const api = makeAPI(apiVersion.toString(), apiHeader.getOutput(), modifierList.getOutput(), accessorList.getOutput(), eventsList.getOutput(), nodeTypesList.getOutput(), structs, typedefs)

    return {api, serializers}
}