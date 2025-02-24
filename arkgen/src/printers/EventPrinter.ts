/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as idl from "@idlizer/core/idl"
import { PeerLibrary, CppConvertor, CppLanguageWriter, IndentedPrinter, LanguageWriter,
    Method, MethodSignature, NamedMethodSignature, PrintHint, printMethodDeclaration
} from "@idlizer/core"
import { callbackIdByInfo, CallbackInfo, collectCallbacks, cStyleCopyright,
    generateEventReceiverName, groupCallbacks, PeerEventKind, peerGeneratorConfiguration
} from "@idlizer/libohos"
import { ArkPrimitiveTypesInstance } from "../ArkPrimitiveType"

export function printEventsCArkoalaImpl(library: PeerLibrary): string {
    const visitor = new CEventsVisitor(library, false)
    visitor.print()

    const writer = new CppLanguageWriter(new IndentedPrinter(), library, new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.print(cStyleCopyright)
    writer.writeInclude("arkoala_api_generated.h")
    writer.writeInclude("events.h")
    writer.writeInclude("Serializers.h")
    writer.print("")

    writer.pushNamespace("Generated")
    writer.concat(visitor.impl)
    writer.writeMethodImplementation(new Method(
        `GetArkUiEventsAPI`,
        new MethodSignature(idl.createReferenceType(`${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI`), [], undefined, [PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI eventsImpl = {`)
        writer.pushIndent()
        writer.concat(visitor.receiversList)
        writer.popIndent()
        writer.print(`};`)
        writer.writeStatement(writer.makeReturn(writer.makeString(`&eventsImpl`)))
    })
    writer.popNamespace()
    return writer.getOutput().join('\n')
}

export function printEventsCLibaceImpl(library: PeerLibrary, options: { namespace: string }): string {
    const visitor = new CEventsVisitor(library, true)
    visitor.print()

    const writer = new CppLanguageWriter(new IndentedPrinter(), library, new CppConvertor(library), ArkPrimitiveTypesInstance)
    writer.writeLines(cStyleCopyright)
    writer.print("")
    writer.writeInclude(`arkoala_api_generated.h`)
    writer.print("")
    writer.pushNamespace(options.namespace, false)

    writer.concat(visitor.impl)

    writer.print(`const ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI* g_OverriddenEventsImpl = nullptr;`)
    writer.writeMethodImplementation(new Method(
        `${peerGeneratorConfiguration().cppPrefix}SetArkUiEventsAPI`,
        new NamedMethodSignature(idl.IDLVoidType, [
            idl.createReferenceType(`${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI`)],
            [`api`], undefined,
            [undefined, PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.writeStatement(writer.makeAssign(`g_OverriddenEventsImpl`, undefined, writer.makeString(`api`), false))
    })

    writer.writeMethodImplementation(new Method(
        `${peerGeneratorConfiguration().cppPrefix}GetArkUiEventsAPI`,
        new MethodSignature(idl.createReferenceType(`${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI`), [], undefined, [PrintHint.AsConstPointer]),
    ), (writer) => {
        writer.print(`static const ${peerGeneratorConfiguration().cppPrefix}ArkUIEventsAPI eventsImpl = {`)
        writer.pushIndent()
        writer.concat(visitor.receiversList)
        writer.popIndent()
        writer.print(`};`)
        writer.writeStatement(writer.makeCondition(
            writer.makeNaryOp("!=", [writer.makeString(`g_OverriddenEventsImpl`), writer.makeString(`nullptr`)]),
            writer.makeReturn(writer.makeString(`g_OverriddenEventsImpl`)),
        ))
        writer.writeStatement(writer.makeReturn(writer.makeString(`&eventsImpl`)))
    })

    writer.popNamespace(false)
    return writer.getOutput().join('\n')
}

class CEventsVisitor {
    readonly impl: CppLanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), ArkPrimitiveTypesInstance)
    readonly receiversList: LanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), ArkPrimitiveTypesInstance)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly isEmptyImplementation: boolean,
    ) {
    }

    private printEventsKinds(callbacks: CallbackInfo[]) {
        if (this.isEmptyImplementation)
            return
        this.impl.print(`enum ${PeerEventKind} {`)
        this.impl.pushIndent()
        callbacks.forEach((callback, index) => {
            this.impl.print(`Kind${callbackIdByInfo(callback)} = ${index},`)
        })
        this.impl.popIndent()
        this.impl.print('};\n')
    }

    private printEventImpl(namespace: string, event: CallbackInfo) {
        this.library.setCurrentContext(`${namespace}.${event.methodName}Impl`)
        this.printEventMethodDeclaration(event)
        this.impl.print("{")
        this.impl.pushIndent()
        if (this.isEmptyImplementation) {
            this.impl.print("// GENERATED EMPTY IMPLEMENTATION")
        } else {
            this.impl.print(`EventBuffer _eventBuffer;`)
            this.impl.print(`Serializer _eventBufferSerializer(_eventBuffer.buffer, sizeof(_eventBuffer.buffer));`)
            this.impl.print(`_eventBufferSerializer.writeInt32(Kind${callbackIdByInfo(event)});`)
            this.impl.print(`_eventBufferSerializer.writeInt32(nodeId);`)
            this.printSerializers(event)
            this.impl.print(`sendEvent(&_eventBuffer);`)
        }
        this.impl.popIndent()
        this.impl.print('}')
        this.library.setCurrentContext(undefined)
    }

    private printReceiver(componentName: string, callbacks: CallbackInfo[]) {
        const receiver = generateEventReceiverName(componentName)
        this.impl.print(`const ${receiver}* Get${componentName}EventsReceiver()`)
        this.impl.print("{")
        this.impl.pushIndent()
        this.impl.print(`static const ${receiver} ${receiver}Impl {`)
        this.impl.pushIndent()
        for (const callback of callbacks) {
            this.impl.print(`${callback.componentName}::${callback.methodName}Impl,`)
        }
        this.impl.popIndent()
        this.impl.print(`};\n`)

        this.impl.print(`return &${receiver}Impl;`)
        this.impl.popIndent()
        this.impl.print(`}`)
    }

    private printReceiversList(callbacks: Map<string, CallbackInfo[]>) {
        for (const componentName of callbacks.keys()) {
            this.receiversList.print(`Get${componentName}EventsReceiver,`)
        }
    }

    print() {
        const listedCallbacks = collectCallbacks(this.library)
        const groupedCallbacks = groupCallbacks(listedCallbacks)
        this.printEventsKinds(listedCallbacks)
        for (const [name, callbacks] of groupedCallbacks) {
            this.impl.pushNamespace(name, false)
            for (const callback of callbacks) {
                this.printEventImpl(name, callback)
            }
            this.impl.popNamespace(false)
        }
        for (const [name, callbacks] of groupedCallbacks) {
            this.printReceiver(name, callbacks)
        }
        this.printReceiversList(groupedCallbacks)
    }

    protected printEventMethodDeclaration(event: CallbackInfo) {
        const args = ["Ark_Int32 nodeId",
            ...event.args.map(it =>
                `const ${this.impl.getNodeName(idl.maybeOptional(this.library.typeConvertor(it.name, it.type, it.nullable).nativeType(), it.nullable))} ${it.name}`)]
        printMethodDeclaration(this.impl.printer, "void", `${event.methodName}Impl`, args)
    }

    protected printSerializers(event: CallbackInfo): void {
        for (const arg of event.args) {
            const convertor = this.library.typeConvertor(arg.name, arg.type, arg.nullable)
            convertor.convertorSerialize(`_eventBuffer`, arg.name, this.impl)
        }
    }
}
