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

import * as ts from "typescript"
import { IndentedPrinter } from "../IndentedPrinter"
import { DeclarationTable, DeclarationTarget, PrimitiveType } from "./DeclarationTable"
import { BlockStatement, CppLanguageWriter, ExpressionStatement, LanguageWriter, Method, NamedMethodSignature, StringExpression, TSLanguageWriter, Type } from "./LanguageWriters"
import { PeerClassBase } from "./PeerClass"
import { PeerLibrary } from "./PeerLibrary"
import { PeerMethod } from "./PeerMethod"
import { makeCEventsImpl, makePeerEvents } from "./FileGenerators"
import { generateEventReceiverName, generateEventSignature } from "./HeaderPrinter"
import { Language, asString, identName } from "../util"
import { mapType } from "./TypeNodeNameConvertor"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"

export const PeerEventsProperties = "PeerEventsProperties"
export const PeerEventKind = "PeerEventKind"

export type CallbackInfo = {
    componentName: string,
    methodName: string,
    args: {name: string, type: ts.TypeNode, nullable: boolean}[],
    returnType: ts.TypeNode,
}

export function generateEventsBridgeSignature(language: Language): Method {
    let signature: NamedMethodSignature
    switch (language) {
        case Language.JAVA:
        case Language.ARKTS:
        case Language.TS:
            signature = new NamedMethodSignature(
                new Type(`KInt`),
                [new Type(`Uint8Array`), new Type(`KInt`)],
                [`result`, `size`],
            )
            break;
        case Language.CPP:
            signature = new NamedMethodSignature(
                new Type(`KInt`),
                [new Type(`KUint*`), new Type(`KInt`)],
                [`result`, `size`],
            )
            break;
        default:
            throw new Error("Not implemented")
    }
    return new Method(`CheckArkoalaEvents`, signature)
}

export function groupCallbacks(callbacks: CallbackInfo[]): Map<string, CallbackInfo[]> {
    const receiverToCallbacks = new Map<string, CallbackInfo[]>()
    for (const callback of callbacks) {
        if (!receiverToCallbacks.has(callback.componentName))
            receiverToCallbacks.set(callback.componentName, [callback])
        else
            receiverToCallbacks.get(callback.componentName)!.push(callback)
    }
    return receiverToCallbacks
}

export function collectCallbacks(library: PeerLibrary): CallbackInfo[] {
    let callbacks: CallbackInfo[] = []
    for (const file of library.files) {
        for (const peer of file.peers.values()) {
            for (const method of peer.methods) {
                for (const target of method.declarationTargets) {
                    const info = convertToCallback(peer, method, target)
                    if (info && canProcessCallback(library.declarationTable, info))
                        callbacks.push(info)
                }
            }
        }
    }
    return callbacks
}

export function canProcessCallback(declarationTable: DeclarationTable, callback: CallbackInfo): boolean {
    if (PeerGeneratorConfig.invalidEvents.includes(callback.methodName))
        return false
    return true
}

export function convertToCallback(peer: PeerClassBase, method: PeerMethod, target: DeclarationTarget): CallbackInfo | undefined {
    if (target instanceof PrimitiveType)
        return undefined
    if (ts.isFunctionTypeNode(target))
        return {
            componentName: peer.getComponentName(),
            methodName: method.method.name,
            args: target.parameters.map(it => {return {
                name: asString(it.name),
                type: it.type!,
                nullable: !!it.questionToken
            }}),
            returnType: target.type,
        }
    if (ts.isTypeReferenceNode(target) && identName(target.typeName) === "Callback") {
        const data = target.typeArguments![0]
        const hasData = data.kind !== ts.SyntaxKind.VoidKeyword
        return {
            componentName: peer.getComponentName(),
            methodName: method.method.name,
            args: hasData ? [{name: 'data', type: data, nullable: false}] : [],
            returnType: target.typeArguments![1] ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
        }
    }
}

export function callbackIdByInfo(info: CallbackInfo): string {
    return `${info.componentName}_${info.methodName}`
}

export function callbackEventNameByInfo(info: CallbackInfo): string {
    return `${callbackIdByInfo(info)}_event`
}

class CEventsVisitor {
    readonly impl: LanguageWriter = new CppLanguageWriter(new IndentedPrinter())
    readonly receiversList: LanguageWriter = new CppLanguageWriter(new IndentedPrinter())

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private printEventsKinds(callbacks: CallbackInfo[]) {
        this.impl.print(`enum ${PeerEventKind} {`)
        this.impl.pushIndent()
        callbacks.forEach((callback, index) => {
            this.impl.print(`Kind${callbackIdByInfo(callback)} = ${index},`)
        })
        this.impl.popIndent()
        this.impl.print('};\n')
    }

    private printEventImpl(event: CallbackInfo) {
        const signature = generateEventSignature(this.library.declarationTable, event)
        const args = signature.args.map((type, index) => {
            return `${type.name} ${signature.argName(index)}`
        })
        this.impl.print(`${signature.returnType.name} ${callbackIdByInfo(event)}Impl(${args.join(',')}) {`)
        this.impl.pushIndent()
        this.impl.print(`EventBuffer _eventBuffer;`)
        this.impl.print(`Serializer _eventBufferSerializer(_eventBuffer.buffer);`)
        this.impl.print(`_eventBufferSerializer.writeInt32(Kind${callbackIdByInfo(event)});`)
        this.impl.print(`_eventBufferSerializer.writeInt32(nodeId);`)
        for (const arg of event.args) {
            const convertor = this.library.declarationTable.typeConvertor(arg.name, arg.type, arg.nullable)
            convertor.convertorSerialize(`_eventBuffer`, arg.name, this.impl)
        }
        this.impl.print(`sendEvent(&_eventBuffer);`)
        this.impl.popIndent()
        this.impl.print('}')
    }

    private printReceiver(componentName: string, callbacks: CallbackInfo[]) {
        const receiver = generateEventReceiverName(componentName)
        this.impl.print(`${receiver} ${receiver}Impl {`)
        this.impl.pushIndent()
        for (const callback of callbacks) {
            this.impl.print(`${callbackIdByInfo(callback)}Impl,`)
        }
        this.impl.popIndent()
        this.impl.print(`};\n`)
        this.impl.print(`const ${receiver}* Get${componentName}EventsReceiver() { return &${receiver}Impl; }`)
    }

    private printReceiversList(callbacks: Map<string, CallbackInfo[]>) {
        this.receiversList.pushIndent()
        for (const componentName of callbacks.keys()) {
            this.receiversList.print(`Get${componentName}EventsReceiver,`)
        }
        this.receiversList.popIndent()
    }

    print() {
        const listedCallbacks = collectCallbacks(this.library)
        const groupedCallbacks = groupCallbacks(listedCallbacks)
        this.printEventsKinds(listedCallbacks)
        for (const [_, callbacks] of groupedCallbacks) {
            for (const callback of callbacks) {
                this.printEventImpl(callback)
            }
        }
        for (const [name, callbacks] of groupedCallbacks) {
            this.printReceiver(name, callbacks)
        }
        this.printReceiversList(groupedCallbacks)
    }
}

class TSEventsVisitor {
    readonly printer: LanguageWriter = new TSLanguageWriter(new IndentedPrinter())

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private printEventsClasses(infos: CallbackInfo[]) {
        for (const info of infos) {
            const eventClassName = callbackEventNameByInfo(info)
            this.printer.writeInterface(eventClassName, (writer) => {
                writer.writeFieldDeclaration(
                    'kind',
                    new Type(`${PeerEventKind}.${callbackIdByInfo(info)}`, false),
                    ["readonly"],
                    false,
                )
                info.args.forEach(arg => {
                    writer.writeFieldDeclaration(
                        arg.name,
                        new Type(mapType(arg.type), arg.nullable),
                        ["readonly"],
                        arg.nullable,
                    )
                })
            }, ['PeerEvent'])
        }
    }

    private printEventsEnum(infos: CallbackInfo[]) {
        this.printer.print(`export enum ${PeerEventKind} {`)
        this.printer.pushIndent()

        infos.forEach((value, index) => {
            this.printer.print(`${callbackIdByInfo(value)} = ${index},`)
        })

        this.printer.popIndent()
        this.printer.print(`}`)
    }

    private printNameByKindRetriever(infos: CallbackInfo[]) {
        this.printer.print(`export function getEventNameByKind(kind: ${PeerEventKind}): string {`)
        this.printer.pushIndent()
        this.printer.print(`switch (kind) {`)
        this.printer.pushIndent()
        for (const info of infos) {
            this.printer.print(`case ${PeerEventKind}.${callbackIdByInfo(info)}: return "${callbackIdByInfo(info)}"`)
        }
        this.printer.popIndent()
        this.printer.print('}')
        this.printer.popIndent()
        this.printer.print('}')
    }

    private printParseFunction(infos: CallbackInfo[]) {
        this.printer.print(`export function deserializePeerEvent(eventDeserializer: Deserializer): PeerEvent {`)
        this.printer.pushIndent()
        this.printer.writeStatement(this.printer.makeAssign(
            'kind',
            new Type(PeerEventKind),
            new StringExpression(`eventDeserializer.readInt32()`),
            true,
        ))
        this.printer.writeStatement(this.printer.makeAssign(
            'nodeId',
            Type.Number,
            new StringExpression(`eventDeserializer.readInt32()`),
            true,
        ))

        this.printer.writeStatement(this.printer.makeMultiBranchCondition(infos.map(info => {
            // TODO wait until TS deserializer is uncomplited
            const constructorTypeArgs = [
                `kind?: number`,
                `nodeId?: ${PeerEventKind}`,
                ...info.args.map(arg => {
                    return `${arg.name}?: any`
                }),
            ]
            const constructorType = new Type(`{ ${constructorTypeArgs.join(', ')} }`)
            
            return {
                expr: this.printer.makeNaryOp('===', [
                    new StringExpression('kind'), 
                    new StringExpression(`${PeerEventKind}.${callbackIdByInfo(info)}`),
                ]),
                stmt: new BlockStatement([
                    this.printer.makeAssign(
                        `event`,
                        constructorType,
                        new StringExpression(`{}`),
                        true,
                    ),
                    this.printer.makeAssign(`event.kind`, undefined, new StringExpression(`kind`), false),
                    this.printer.makeAssign(`event.nodeId`, undefined, new StringExpression(`nodeId`), false),
                    ...info.args.map(arg => {
                        const convertor = this.library.declarationTable.typeConvertor(arg.name, arg.type, arg.nullable)
                        return convertor.convertorDeserialize('event', `event.${arg.name}`, this.printer)
                    }),
                    this.printer.makeReturn(this.printer.makeCast(
                        new StringExpression(`event`),
                        new Type(callbackEventNameByInfo(info)),
                    ))
                ], false),
            }
        }), 
            new BlockStatement([
                new ExpressionStatement(new StringExpression(`throw \`Unknown kind \${kind}\``))
            ], false)
        ))

        this.printer.popIndent()
        this.printer.print('}')
    }

    private printProperties(infos: CallbackInfo[]) {
        this.printer.writeInterface(PeerEventsProperties, writer => {
            for (const info of infos) {
                const signature = new NamedMethodSignature(
                    new Type('void'),
                    info.args.map(it => new Type(mapType(it.type))),
                    info.args.map(it => it.name),
                )
                writer.writeMethodDeclaration(callbackIdByInfo(info), signature)
            }
        })
    }

    print(): void {
        const callbacks = collectCallbacks(this.library)
        this.printEventsClasses(callbacks)
        this.printEventsEnum(callbacks)
        this.printNameByKindRetriever(callbacks)
        this.printParseFunction(callbacks)
        this.printProperties(callbacks)
    }
}

export function printEvents(library: PeerLibrary): string {
    const visitor = new TSEventsVisitor(library)
    visitor.print()
    return makePeerEvents(visitor.printer.getOutput().join("\n"))
}

export function printEventsCImpl(library: PeerLibrary): string {
    const visitor = new CEventsVisitor(library)
    visitor.print()
    return makeCEventsImpl(
        visitor.impl.getOutput().join('\n'),
        visitor.receiversList.getOutput().join('\n')
    )
}