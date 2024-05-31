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
import { makeAPI, makeCSerializers } from "./FileGenerators";
import { PeerClass } from "./PeerClass";
import { PeerLibrary } from "./PeerLibrary";
import { PeerMethod } from "./PeerMethod";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { CallbackInfo, collectCallbacks, groupCallbacks } from "./EventsPrinter";
import { DeclarationTable, PrimitiveType } from "./DeclarationTable";
import { NamedMethodSignature, Type } from "./LanguageWriters";

export function generateEventReceiverName(componentName: string) {
    return `${PeerGeneratorConfig.cppPrefix}ArkUI${componentName}EventsReceiver`
}

export function generateEventSignature(table: DeclarationTable, event: CallbackInfo): NamedMethodSignature {
    const nodeType = new Type(table.computeTargetName(PrimitiveType.Int32, false))
    const argsTypes = event.args.map(it => new Type(
        'const ' + table.typeConvertor(it.name, it.type, it.nullable).nativeType(false),
        it.nullable,
    ))
    return new NamedMethodSignature(
        new Type('void'),
        [nodeType, ...argsTypes],
        ['nodeId', ...event.args.map(it => it.name)]
    )
}

class HeaderVisitor {
    constructor(
        private library: PeerLibrary,
        private api: IndentedPrinter,
        private modifiersList: IndentedPrinter,
        private accessorsList: IndentedPrinter,
        private eventsList: IndentedPrinter,
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
        const apiParameters = method.generateAPIParameters().join(", ")
        this.api.print(`${method.retType} (*${method.fullMethodName})(${apiParameters});`)
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

            let names = new Set<string>();
            [clazz.ctor, clazz.finalizer].concat(clazz.methods)
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

    private printEventsReceiver(componentName: string, callbacks: CallbackInfo[]) {
        const receiver = generateEventReceiverName(componentName)
        this.api.print(`typedef struct ${receiver} {`)
        this.api.pushIndent()
        for (const callback of callbacks) {
            const signature = generateEventSignature(this.library.declarationTable, callback)
            const args = signature.args.map((type, index) => {
                return `${type.name} ${signature.argName(index)}`
            })
            this.api.print(`${signature.returnType.name} (*${callback.methodName})(${args.join(',')});`)
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
    }
}

export function printApiAndSerializers(apiVersion: string|undefined, peerLibrary: PeerLibrary): {api: string, serializers: string} {
    const apiHeader = new IndentedPrinter()
    const modifierList = new IndentedPrinter()
    const accessorList = new IndentedPrinter()
    const eventsList = new IndentedPrinter()

    const visitor = new HeaderVisitor(peerLibrary, apiHeader, modifierList, accessorList, eventsList)
    visitor.printApiAndDeserializer()

    const structs = new IndentedPrinter()
    const typedefs = new IndentedPrinter()

    const serializers = makeCSerializers(peerLibrary.declarationTable, structs, typedefs)
    const api = makeAPI(apiVersion ?? "0", apiHeader.getOutput(), modifierList.getOutput(), accessorList.getOutput(), eventsList.getOutput(), structs, typedefs)

    return {api, serializers}
}