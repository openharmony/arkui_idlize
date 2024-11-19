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
import * as idl from "../../idl"
import { IndentedPrinter } from "../../IndentedPrinter"
import {
    BlockStatement,
    CppLanguageWriter,
    ExpressionStatement,
    FieldModifier,
    LanguageWriter,
    printMethodDeclaration,
    StringExpression,
    TSLanguageWriter
} from "../LanguageWriters"
import { PeerClassBase } from "../PeerClass"
import { makeCEventsArkoalaImpl, makeCEventsLibaceImpl } from "../FileGenerators"
import { generateEventReceiverName } from "./HeaderPrinter"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig"
import { PeerMethod } from "../PeerMethod"
import { PeerLibrary } from "../PeerLibrary"
import { ArgConvertor } from "../ArgConvertors"
import { PeerClass } from "../PeerClass"
import { collapseIdlPeerMethods, groupOverloads } from "./OverloadsPrinter"
import { Language } from "../../Language"
import { ImportsCollector } from "../ImportsCollector";
import { getReferenceResolver, ReferenceResolver } from "../ReferenceResolver"
import { isImport } from "../idl/common"
import { ETSLanguageWriter } from "../LanguageWriters/writers/ETSLanguageWriter";
import { collectMaterializedImports } from "../Materialized"

export const PeerEventsProperties = "PeerEventsProperties"
export const PeerEventKind = "PeerEventKind"

export interface CallbackInfoBase {
    componentName: string,
    methodName: string,
}

export interface CallbackInfo extends CallbackInfoBase {
    args: { name: string, type: ts.TypeNode, nullable: boolean }[],
    returnType: ts.TypeNode,
    originTarget: ts.TypeNode
}

export interface IdlCallbackInfo extends CallbackInfoBase {
    args: { name: string, type: idl.IDLType, nullable: boolean }[],
    returnType: idl.IDLType,
    originTarget: idl.IDLCallback | idl.IDLReferenceType
}

export function groupCallbacks(callbacks: IdlCallbackInfo[]): Map<string, IdlCallbackInfo[]> {
    const receiverToCallbacks = new Map<string, IdlCallbackInfo[]>()
    for (const callback of callbacks) {
        if (!receiverToCallbacks.has(callback.componentName))
            receiverToCallbacks.set(callback.componentName, [callback])
        else
            receiverToCallbacks.get(callback.componentName)!.push(callback)
    }
    return receiverToCallbacks
}

export function collectCallbacks(library: PeerLibrary): IdlCallbackInfo[] {
    const callbacks = []
    for (const file of library.files) {
        for (const peer of file.peers.values()) {
            for (const method of peer.methods) {
                let callbackFound = false
                for (const target of method.method.signature.args) {
                    const info = convertIdlToCallback(getReferenceResolver(library), peer, method, target)
                    if (info && canProcessCallback(info)) {
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

export function canProcessCallback(callback: CallbackInfoBase): boolean {
    if (PeerGeneratorConfig.invalidEvents.includes(callback.methodName))
        return false
    return true
}

export function convertIdlToCallback(resolver: ReferenceResolver, peer: PeerClassBase, method: PeerMethod, argType: idl.IDLNode): IdlCallbackInfo | undefined {
    if (idl.isReferenceType(argType)) {
        if (isImport(argType)) {
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

export function callbackIdByInfo(info: CallbackInfoBase): string {
    return `${info.componentName}_${info.methodName}`
}

export function callbackEventNameByInfo(info: CallbackInfoBase): string {
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

function idlCallbacksEquals(a: IdlCallbackInfo | undefined, b: IdlCallbackInfo | undefined): boolean {
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

abstract class CEventsVisitorBase {
    readonly impl: CppLanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library)
    readonly receiversList: LanguageWriter = new CppLanguageWriter(new IndentedPrinter(), this.library)

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly isEmptyImplementation: boolean,
    ) {
    }

    protected abstract printEventMethodDeclaration(event: CallbackInfo | IdlCallbackInfo): void

    protected abstract printSerializers(event: CallbackInfo | IdlCallbackInfo): void

    private printEventsKinds(callbacks: CallbackInfoBase[]) {
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

    private printEventImpl(namespace: string, event: CallbackInfo | IdlCallbackInfo) {
        this.library.setCurrentContext(`${namespace}.${event.methodName}Impl`)
        this.printEventMethodDeclaration(event)
        this.impl.print("{")
        this.impl.pushIndent()
        if (this.isEmptyImplementation) {
            this.impl.print("// GENERATED EMPTY IMPLEMENTATION")
        } else {
            this.impl.print(`EventBuffer _eventBuffer;`)
            this.impl.print(`Serializer _eventBufferSerializer(_eventBuffer.buffer);`)
            this.impl.print(`_eventBufferSerializer.writeInt32(Kind${callbackIdByInfo(event)});`)
            this.impl.print(`_eventBufferSerializer.writeInt32(nodeId);`)
            this.printSerializers(event)
            this.impl.print(`sendEvent(&_eventBuffer);`)
        }
        this.impl.popIndent()
        this.impl.print('}')
        this.library.setCurrentContext(undefined)
    }

    private printReceiver(componentName: string, callbacks: CallbackInfoBase[]) {
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

    private printReceiversList(callbacks: Map<string, CallbackInfoBase[]>) {
        for (const componentName of callbacks.keys()) {
            if (this.library.shouldGenerateComponent(componentName))
                this.receiversList.print(`Get${componentName}EventsReceiver,`)
            else
                this.receiversList.print(`nullptr,`)
        }
    }

    print() {
        const listedCallbacks = collectCallbacks(this.library)
        const groupedCallbacks = groupCallbacks(listedCallbacks)
        this.printEventsKinds(listedCallbacks)
        for (const [name, callbacks] of groupedCallbacks) {
            if (!this.library.shouldGenerateComponent(name))
                continue
            this.impl.pushNamespace(name, false)
            for (const callback of callbacks) {
                this.printEventImpl(name, callback)
            }
            this.impl.popNamespace(false)
        }
        for (const [name, callbacks] of groupedCallbacks) {
            if (!this.library.shouldGenerateComponent(name))
                continue
            this.printReceiver(name, callbacks)
        }
        this.printReceiversList(groupedCallbacks)
    }
}

class IdlCEventsVisitor extends CEventsVisitorBase {
    constructor(
        protected readonly library: PeerLibrary,
        isEmptyImplementation: boolean
    ) {
        super(library, isEmptyImplementation)
    }

    protected override printEventMethodDeclaration(event: IdlCallbackInfo) {
        const args = ["Ark_Int32 nodeId",
            ...event.args.map(it =>
                `const ${this.impl.getNodeName(idl.maybeOptional(this.library.typeConvertor(it.name, it.type, it.nullable).nativeType(), it.nullable))} ${it.name}`)]
        printMethodDeclaration(this.impl.printer, "void", `${event.methodName}Impl`, args)
    }

    protected override printSerializers(event: IdlCallbackInfo): void {
        for (const arg of event.args) {
            const convertor = this.library.typeConvertor(arg.name, arg.type, arg.nullable)
            convertor.convertorSerialize(`_eventBuffer`, arg.name, this.impl)
        }
    }
}

abstract class TSEventsVisitorBase {
    readonly printer: LanguageWriter = new TSLanguageWriter(new IndentedPrinter(), getReferenceResolver(this.library))

    constructor(
        protected readonly library: PeerLibrary,
    ) {
    }

    protected abstract typeConvertor(param: string, type: ts.TypeNode | idl.IDLType, isOptional: boolean): ArgConvertor
    protected abstract mapType(type: ts.TypeNode | idl.IDLType | idl.IDLCallback): idl.IDLType | idl.IDLCallback

    private printImports() {
        const imports = new ImportsCollector()
        imports.addFeature("RuntimeType", "./peers/SerializerBase")
        imports.addFeature("int32", "@koalaui/common")
        imports.addFeature("KStringPtr", "@koalaui/interop")
        imports.addFeature("KPointer", "@koalaui/interop")
        if ([Language.TS].includes(this.library.language))
            imports.addFeature("Deserializer", "./peers/Deserializer")

        // Hack: fixes duplicate features from different modules
        // TODO: Need to collect the only required types
        const seenFeatures = new Set<string>()
        for (const file of this.library.files) {
            file.importFeatures.forEach(it => {
                if (!seenFeatures.has(it.feature)) {
                    imports.addFeature(it.feature, it.module)
                    seenFeatures.add(it.feature)
                }
            })
        }
        collectMaterializedImports(imports, this.library)
        imports.print(this.printer, '')
    }

    private printEventsClasses(infos: IdlCallbackInfo[]) {
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
                    idl.maybeOptional(idl.toIDLType(kindType), false),
                    [FieldModifier.READONLY],
                    false,
                )
                info.args.forEach(arg => {
                    const mapped = this.mapType(arg.type)
                    const ref = idl.isType(mapped)
                        ? mapped
                        : idl.createReferenceType(mapped.name)
                    writer.writeFieldDeclaration(
                        arg.name,
                        idl.maybeOptional(ref, arg.nullable),
                        [FieldModifier.READONLY],
                        arg.nullable,
                    )
                })
            }, ['PeerEvent'])
        }
    }

    private printEventsEnum(infos: CallbackInfoBase[]) {
        this.printer.print(`export enum ${PeerEventKind} {`)
        this.printer.pushIndent()

        infos.forEach((value, index) => {
            this.printer.print(`${callbackIdByInfo(value)} = ${index},`)
        })

        this.printer.popIndent()
        this.printer.print(`}`)
    }

    private printNameByKindRetriever(infos: CallbackInfoBase[]) {
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

    protected printParseFunction(infos: IdlCallbackInfo[]) {
        this.printer.print(`export function deserializePeerEvent(eventDeserializer: Deserializer): PeerEvent {`)
        this.printer.pushIndent()
        this.printer.writeStatement(this.printer.makeAssign(
            'kind',
            idl.toIDLType(PeerEventKind),
            new StringExpression(`eventDeserializer.readInt32()`),
            true,
        ))
        this.printer.writeStatement(this.printer.makeAssign(
            'nodeId',
            idl.IDLNumberType,
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
                const constructorType = idl.toIDLType(`{ ${constructorTypeArgs.join(', ')} }`)

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
                            const convertor = this.typeConvertor(arg.name, arg.type, arg.nullable)
                            return convertor.convertorDeserialize(`${arg.name}_buf`, `eventDeserializer`, (expr) => {
                                return this.printer.makeAssign(`event.${arg.name}`, undefined, expr, false)
                            }, this.printer)
                        }),
                        this.printer.makeReturn(this.printer.makeCast(
                            new StringExpression(`event`),
                            idl.toIDLType(callbackEventNameByInfo(info)),
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

    private printProperties(infos: IdlCallbackInfo[]) {
        const contentOp = (writer: LanguageWriter) => {
            for (const info of infos) {
                const mapped = this.mapType( info.originTarget)
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

    protected printCallbackInfo(callbackInfo: CallbackInfo | IdlCallbackInfo) {
        const infoFields = callbackInfo.args.map(it => `(event as ${callbackEventNameByInfo(callbackInfo)}).${it.name}`).join(', ')
        this.printer.print(`case ${PeerEventKind}.${callbackIdByInfo(callbackInfo)}: properties.${callbackIdByInfo(callbackInfo)}?.(${infoFields}); break`)
    }

    private printEventsDeliverer(infos: IdlCallbackInfo[]) {
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
        const filteredCallbacks = callbacks.filter(it => this.library.shouldGenerateComponent(it.componentName))
        this.printImports()
        this.printEventsEnum(callbacks)
        this.printEventsClasses(filteredCallbacks)
        this.printNameByKindRetriever(filteredCallbacks)
        this.printParseFunction(filteredCallbacks)
        this.printProperties(filteredCallbacks)
        this.printEventsDeliverer(filteredCallbacks)
    }
}


class IdlTSEventsVisitor extends TSEventsVisitorBase {
    constructor(protected readonly library: PeerLibrary) {
        super(library)
    }

    protected typeConvertor(param: string, type: idl.IDLType, isOptional: boolean): ArgConvertor {
        return this.library.typeConvertor(param, type, isOptional)
    }

    protected mapType(type: idl.IDLType): idl.IDLType {
        return type
    }
}

class IdlArkTSEventVisitor extends IdlTSEventsVisitor {
    readonly printer: LanguageWriter = new ETSLanguageWriter(new IndentedPrinter(), getReferenceResolver(this.library))

    protected printParseFunction(infos: IdlCallbackInfo[]) {
        // Disable event functions printing until deserializer is ready
        // super.printParseFunction(infos);
    }
}

export function printEvents(library: PeerLibrary): string {
    let visitor
    switch (library.language) {
        case Language.ARKTS:
            visitor = new IdlArkTSEventVisitor(library)
            break
        case Language.TS:
            visitor = new IdlTSEventsVisitor(library)
            break
        default:
            throw new Error("Not implemented yet")
    }
    visitor.print()
    return visitor.printer.getOutput().join("\n")
}

export function printEventsCArkoalaImpl(library: PeerLibrary): string {
    const visitor = new IdlCEventsVisitor(library, false)
    visitor.print()
    return makeCEventsArkoalaImpl(
        getReferenceResolver(library),
        visitor.impl,
        visitor.receiversList,
    )
}

export function printEventsCLibaceImpl(library: PeerLibrary, options: { namespace: string }): string {
    const visitor = new IdlCEventsVisitor(library, true)
    visitor.print()
    return makeCEventsLibaceImpl(
        visitor.impl,
        visitor.receiversList,
        options.namespace,
        getReferenceResolver(library)
    )
}