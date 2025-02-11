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

import * as idl from '@idlizer/core/idl'
import { IndentedPrinter, Language, isImportAttr, PeerClassBase, PeerClass, PeerMethod, PeerLibrary, TSTypeNameConvertor } from '@idlizer/core'
import {
    BlockStatement,
    CppLanguageWriter,
    ExpressionStatement,
    FieldModifier,
    printMethodDeclaration,
    StringExpression,
    TSLanguageWriter
} from "../LanguageWriters"
import { LanguageWriter } from "@idlizer/core"
import { makeCEventsArkoalaImpl, makeCEventsLibaceImpl } from "../FileGenerators"
import { generateEventReceiverName } from "./HeaderPrinter"
import { peerGeneratorConfiguration} from "../PeerGeneratorConfig"
import { collapseIdlPeerMethods, groupOverloads } from "./OverloadsPrinter"
import { ImportsCollector } from "../ImportsCollector"
import { ReferenceResolver, CppInteropConvertor } from "@idlizer/core"
import { collectDeclItself, collectDeclDependencies } from "../ImportsCollectorUtils"
import { ArkPrimitiveTypesInstance } from "../ArkPrimitiveType";

export const PeerEventsProperties = "PeerEventsProperties"
export const PeerEventKind = "PeerEventKind"

export interface CallbackInfo {
    componentName: string,
    methodName: string,
    args: { name: string, type: idl.IDLType, nullable: boolean }[],
    returnType: idl.IDLType,
    originTarget: idl.IDLCallback | idl.IDLReferenceType
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
    const callbacks = []
    for (const file of library.files) {
        for (const peer of file.peers.values()) {
            for (const method of peer.methods) {
                let callbackFound = false
                for (const target of method.method.signature.args) {
                    const info = convertIdlToCallback(library, peer, method, target)
                    if (info) {
                        if (callbackFound)
                            throw new Error("Only one callback per method is acceptable")
                        callbackFound = true
                        callbacks.push(info)
                    }
                }
            }
        }
    }
    return callbacks
}

export function convertIdlToCallback(resolver: ReferenceResolver, peer: PeerClassBase, method: PeerMethod, argType: idl.IDLType): CallbackInfo | undefined {
    if (idl.isReferenceType(argType)) {
        if (isImportAttr(argType)) {
            return undefined
        }

        const argDecl = resolver.resolveTypeReference(argType)
        if (argDecl && idl.isCallback(argDecl)) {
            return {
                componentName: peer.getComponentName(),
                methodName: method.overloadedName,
                args: argDecl.parameters.map(it => ({
                    name: it.name,
                    type: it.type!,
                    nullable: it.isOptional
                })),
                returnType: argDecl.returnType,
                originTarget: argDecl,
            }
        }

        if (argType.name === 'Callback' && argType.typeArguments) {
            const typeArgs = argType.typeArguments!
            const inputType = typeArgs[0]
            const hasData = !idl.isVoidType(inputType)
            return {
                componentName: peer.getComponentName(),
                methodName: method.overloadedName,
                args: hasData ? [{name: 'data', type: inputType, nullable: false}] : [],
                returnType: typeArgs[1] ? typeArgs[1] : idl.IDLVoidType,
                originTarget: argType,
            }
        }
    }
    return undefined
}

export function callbackIdByInfo(info: CallbackInfo): string {
    return `${info.componentName}_${info.methodName}`
}

export function callbackEventNameByInfo(info: CallbackInfo): string {
    return `${callbackIdByInfo(info)}_event`
}

function idlTypesEquals(a: idl.IDLType, b: idl.IDLType): boolean {
    if (a.kind !== b.kind ||
        idl.isNamedNode(a) && idl.isNamedNode(b) && a.name === b.name)
        return false
    if (idl.isUnionType(a) && idl.isUnionType(b)) {
        return a.types.every(it => b.types.some(other => idlTypesEquals(it, other))) &&
            idlTypesEquals(b, a)
    }
    return true
}

function idlCallbacksEquals(a: CallbackInfo | undefined, b: CallbackInfo | undefined): boolean {
    if (!a || !b)
        return a === b

    if (a.args.length != b.args.length)
        return false
    for (let i = 0; i < a.args.length; i++) {
        if (!idlTypesEquals(a.args[i].type, b.args[i].type))
            return false
        if (a.args[i].nullable !== b.args[i].nullable)
            return false
    }
    if (!idlTypesEquals(a.returnType, b.returnType))
        return false
    return true
}

export function collapseIdlEventsOverloads(library: PeerLibrary, peer: PeerClass): void {
    const replacements: [PeerMethod[], PeerMethod][] = []

    for (const overloads of groupOverloads(peer.methods)) {
        if (overloads.length <= 1) continue
        const callbacks = overloads[0].method.signature.args.map(it => convertIdlToCallback(library, peer, overloads[0], it))
        const callbackIndex = callbacks.findIndex(it => it)
        if (callbackIndex === -1) continue

        const sampleCallback = callbacks[callbackIndex]
        let canCollapseCallbacks = true
        for (const overload of overloads) {
            const overloadCallback = convertIdlToCallback(library, peer, overload, overload.method.signature.args[callbackIndex])
            if (!idlCallbacksEquals(sampleCallback, overloadCallback))
                canCollapseCallbacks = false
        }
        if (!canCollapseCallbacks) continue

        replacements.push([overloads, collapseIdlPeerMethods(library, overloads, [callbackIndex])])
    }

    for (const replacement of replacements) {
        peer.methods[peer.methods.indexOf(replacement[0][0])] = replacement[1]
        peer.methods = peer.methods.filter(it => !replacement[0].includes(it))
    }
}

class CEventsVisitor {
    readonly impl: CppLanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)
    readonly receiversList: LanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)

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

class TSEventsVisitor {
    readonly printer: LanguageWriter = new TSLanguageWriter(new IndentedPrinter(),
        this.library,
        new TSTypeNameConvertor(this.library))

    constructor(protected readonly library: PeerLibrary) {}

    private printImports() {
        const imports = new ImportsCollector()
        imports.addFeatures(["int32", "float32"], "@koalaui/common")
        imports.addFeatures(["KStringPtr", "KPointer", "RuntimeType"], "@koalaui/interop")
        if ([Language.TS].includes(this.library.language))
            imports.addFeature("Deserializer", "./peers/Deserializer")

        for (const callback of collectCallbacks(this.library)) {
            collectDeclItself(this.library, callback.originTarget, imports)
            collectDeclDependencies(this.library, callback.originTarget, imports)
        }
        imports.print(this.printer, '')
    }

    private printEventsClasses(infos: CallbackInfo[]) {
        this.printer.print(`
interface PeerEvent {
    readonly kind: ${PeerEventKind}
    readonly nodeId: number
}
`)
        for (const info of infos) {
            const eventClassName = callbackEventNameByInfo(info)
            this.printer.writeInterface(eventClassName, (writer) => {
                let kindType = this.library.language === Language.TS
                    ? `${PeerEventKind}.${callbackIdByInfo(info)}`
                    : `${PeerEventKind}`
                writer.writeFieldDeclaration(
                    'kind',
                    idl.createReferenceType(kindType),
                    [FieldModifier.READONLY],
                    false,
                )
                info.args.forEach(arg =>
                    writer.writeFieldDeclaration(
                        arg.name,
                        idl.maybeOptional(arg.type, arg.nullable),
                        [FieldModifier.READONLY],
                        arg.nullable))
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
        this.printer.print(`default: throw new Error(\`Unknown kind \${kind}\`)`)
        this.printer.popIndent()
        this.printer.print('}')
        this.printer.popIndent()
        this.printer.print('}')
    }

    protected printParseFunction(infos: CallbackInfo[]) {
        this.printer.print(`export function deserializePeerEvent(eventDeserializer: Deserializer): PeerEvent {`)
        this.printer.pushIndent()
        this.printer.writeStatement(this.printer.makeAssign(
            'kind',
            idl.createReferenceType(PeerEventKind),
            new StringExpression(`eventDeserializer.readInt32()`),
            true,
        ))
        this.printer.writeStatement(this.printer.makeAssign(
            'nodeId',
            idl.IDLNumberType,
            new StringExpression(`eventDeserializer.readInt32()`),
            true,
        ))

        // TODO: maybe we shall use a switch statement here!
        this.printer.writeStatement(this.printer.makeMultiBranchCondition(infos.map(info => {
                // TODO wait until TS deserializer is complete
                const constructorTypeArgs = [
                    `kind?: number`,
                    `nodeId?: ${PeerEventKind}`,
                    ...info.args.map(arg => {
                        return `${arg.name}?: any`
                    }),
                ]
                const constructorType = idl.createReferenceType(`{ ${constructorTypeArgs.join(', ')} }`)

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
                            const convertor = this.library.typeConvertor(arg.name, arg.type, arg.nullable)
                            return convertor.convertorDeserialize(`${arg.name}_buf`, `eventDeserializer`, (expr) => {
                                return this.printer.makeAssign(`event.${arg.name}`, undefined, expr, false)
                            }, this.printer)
                        }),
                        this.printer.makeReturn(this.printer.makeCast(
                            new StringExpression(`event`),
                            idl.createReferenceType(callbackEventNameByInfo(info)),
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
        const contentOp = (writer: LanguageWriter) => {
            for (const info of infos) {
                const mapped = info.originTarget
                const ref = idl.isType(mapped)
                    ? mapped
                    : idl.createReferenceType(mapped.name)
                writer.writeFieldDeclaration(callbackIdByInfo(info),
                    ref,
                    undefined,
                    true
                )
            }
        }
        if (this.library.language == Language.ARKTS)
            this.printer.writeClass(PeerEventsProperties, contentOp)
        else
            this.printer.writeInterface(PeerEventsProperties, contentOp)
    }

    protected printCallbackInfo(callbackInfo: CallbackInfo) {
        const infoFields = callbackInfo.args.map(it => `(event as ${callbackEventNameByInfo(callbackInfo)}).${it.name}`).join(', ')
        this.printer.print(`case ${PeerEventKind}.${callbackIdByInfo(callbackInfo)}: properties.${callbackIdByInfo(callbackInfo)}?.(${infoFields}); break`)
    }

    protected printEventsDeliverer(infos: CallbackInfo[]) {
        this.printer.print(`export function deliverGeneratedPeerEvent(event: PeerEvent, properties: ${PeerEventsProperties}): void {`)
        this.printer.pushIndent()
        this.printer.print(`switch (event.kind) {`)
        this.printer.pushIndent()
        infos.forEach(it => this.printCallbackInfo(it))
        this.printer.print(`default: throw new Error(\`Unknown kind \${event.kind}\`)`)
        this.printer.popIndent()
        this.printer.print('}')
        this.printer.popIndent()
        this.printer.print('}')
    }

    print(): void {
        const callbacks = collectCallbacks(this.library)
        this.printImports()
        this.printEventsEnum(callbacks)
        this.printEventsClasses(callbacks)
        this.printNameByKindRetriever(callbacks)
        this.printParseFunction(callbacks)
        this.printProperties(callbacks)
        this.printEventsDeliverer(callbacks)
    }
}

class ArkTSEventVisitor extends TSEventsVisitor {
    readonly printer: LanguageWriter = this.library.createLanguageWriter(Language.ARKTS)

    protected printParseFunction(infos: CallbackInfo[]) {
        // Disable event functions printing until deserializer is ready
        // super.printParseFunction(infos);
    }
    protected printEventsDeliverer(infos: CallbackInfo[]) {
        // Disable event functions printing until deserializer is ready
        // super.printEventsDeliverer(infos);
    }
}

export function printEvents(library: PeerLibrary): string {
    let visitor
    switch (library.language) {
        case Language.ARKTS:
            visitor = new ArkTSEventVisitor(library)
            break
        case Language.TS:
            visitor = new TSEventsVisitor(library)
            break
        default:
            throw new Error("Not implemented yet")
    }
    visitor.print()
    return visitor.printer.getOutput().join("\n")
}

export function printEventsCArkoalaImpl(library: PeerLibrary): string {
    const visitor = new CEventsVisitor(library, false)
    visitor.print()
    return makeCEventsArkoalaImpl(
        library,
        visitor.impl,
        visitor.receiversList,
    )
}

export function printEventsCLibaceImpl(library: PeerLibrary, options: { namespace: string }): string {
    const visitor = new CEventsVisitor(library, true)
    visitor.print()
    return makeCEventsLibaceImpl(
        visitor.impl,
        visitor.receiversList,
        options.namespace,
        library
    )
}