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

import * as path from "path"
import { IndentedPrinter } from "../IndentedPrinter";
import { EnumEntity, PeerFile } from "./PeerFile";
import { PeerLibrary } from "./PeerLibrary";
import { Language, isStatic, renameDtsToPeer, throwException } from "../util";
import { ImportsCollector } from "./ImportsCollector";
import { PeerClass, PeerClassBase } from "./PeerClass";
import { InheritanceRole, determineParentRole, isHeir, isRoot, isStandalone } from "./inheritance";
import { PeerMethod } from "./PeerMethod";
import {
    LanguageExpression,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    Type,
    createLanguageWriter
} from "./LanguageWriters";
import { MaterializedMethod } from "./Materialized";
import { collectDtsImports } from "./DtsImportsGenerator";

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

function componentToAttributesClass(component: string) {
    return `Ark${component}Attributes`
}

class PeerFileVisitor {
    readonly printer: LanguageWriter = createLanguageWriter(this.file.declarationTable.language)

    // Temporary, until other languages supported.
    private isTs = this.file.declarationTable.language == Language.TS
    private isArkTs = this.file.declarationTable.language == Language.ARKTS

    constructor(
        private readonly library: PeerLibrary,
        private readonly file: PeerFile,
        private readonly dumpSerialized: boolean,
    ) { }

    get targetBasename() {
        return renameDtsToPeer(path.basename(this.file.originalFilename), this.file.declarationTable.language)
    }

    private generatePeerParentName(peer: PeerClass): string {
        if (!peer.originalClassName)
            throw new Error(`${peer.componentName} is not supported, use 'uselessConstructorInterfaces' for now`)
        const parentRole = determineParentRole(peer.originalClassName, peer.parentComponentName)
        if ([InheritanceRole.Finalizable, InheritanceRole.PeerNode].includes(parentRole)) {
            return InheritanceRole[parentRole]
        }
        const parent = peer.parentComponentName ?? throwException(`Expected component to have parent`)
        return componentToPeerClass(parent)
    }

    private generateAttributesParentClass(peer: PeerClass): string | undefined {
        if (!isHeir(peer.originalClassName!)) return undefined
        return componentToAttributesClass(peer.parentComponentName!)
    }

    private printImports(): void {
        this.getDefaultPeerImports(this.file.declarationTable.language)!.forEach(it => this.printer.print(it))
        if (this.file.declarationTable.language == Language.JAVA) {
            return
        }

        const imports = new ImportsCollector()
        imports.addFilterByBasename(this.targetBasename)
        this.file.peers.forEach(peer => {
            if (!peer.originalParentFilename) return
            const parentBasename = renameDtsToPeer(path.basename(peer.originalParentFilename), this.file.declarationTable.language)
            imports.addFeatureByBasename(this.generatePeerParentName(peer), parentBasename)
            const parentAttributesClass = this.generateAttributesParentClass(peer)
            if (parentAttributesClass)
                imports.addFeatureByBasename(parentAttributesClass, parentBasename)
        })
        if (this.file.declarationTable.language === Language.TS) {
            this.file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
            this.file.serializeImportFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        }
        imports.addFeature("unsafeCast", "./generated-utils")
        imports.print(this.printer)
    }

    private printAttributes(peer: PeerClass) {
        if (!(this.isTs||this.isArkTs)) return
        for (const attributeType of peer.attributesTypes)
            this.printer.print(attributeType)

        const parent = this.generateAttributesParentClass(peer)
        this.printer.writeInterface(componentToAttributesClass(peer.componentName), (writer) => {
            for (const field of peer.attributesFields)
                writer.print(field)
        }, parent ? [parent] : undefined)
    }

    private printPeerConstructor(peer: PeerClass): void {
        // TODO: fully switch to writer!
        const printer = this.printer
        const parentRole = determineParentRole(peer.originalClassName, peer.originalParentName)
        const isNode = parentRole !== InheritanceRole.Finalizable
        const signature = new NamedMethodSignature(
            Type.Void,
            [new Type('ArkUINodeType', !isNode), new Type('ComponentBase', true), new Type('int32')],
            ['type', 'component', 'flags'],
            [undefined, undefined, '0'])

        printer.writeConstructorImplementation(componentToPeerClass(peer.componentName), signature, (writer) => {
            if (parentRole === InheritanceRole.PeerNode) {
                writer.writeSuperCall([`type`, 'flags'])
                writer.writeMethodCall('component', 'setPeer', ['this'], true)
            } else if (parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
                writer.writeSuperCall([`type`, 'component', 'flags'])
            } else {
                throwException(`Unexpected parent inheritance role: ${parentRole}`)
            }
        })
    }

    private printPeerMethod(method: PeerMethod) {
        writePeerMethod(this.printer, method, this.dumpSerialized, "Attribute", "this.peer.ptr")
    }

    private printApplyMethod(peer: PeerClass) {
        if (!(this.isTs||this.isArkTs)) return
        const name = peer.originalClassName!
        const typeParam = componentToAttributesClass(peer.componentName)
        if (isRoot(name)) {
            this.printer.print(`applyAttributes(attributes: ${typeParam}): void {}`)
            return
        }

        this.printer.print(`applyAttributes<T extends ${typeParam}>(attributes: T): void {`)
        this.printer.pushIndent()
        this.printer.print(`super.applyAttributes(attributes)`)
        this.printer.popIndent()
        this.printer.print(`}`)
    }

    private printPeer(peer: PeerClass) {
        this.printer.writeClass(componentToPeerClass(peer.componentName), (writer) => {
            this.printPeerConstructor(peer)
            for (const method of peer.methods)
                this.printPeerMethod(method)
            this.printApplyMethod(peer)
        }, this.generatePeerParentName(peer))
    }

    printFile(): void {
        this.printImports()
        this.file.peers.forEach(peer => {
            this.printPeer(peer)
            this.printAttributes(peer)
        })
    }

    private getDefaultPeerImports(lang: Language) {
        switch(lang) {
            case Language.TS: {
                return [
                    `import { int32 } from "@koalaui/common"`,
                    `import { PeerNode } from "./PeerNode"`,
                    `import { nullptr, KPointer } from "@koalaui/interop"`,
                    `import { isPixelMap, isResource, runtimeType, RuntimeType, SerializerBase } from "./SerializerBase"`,
                    `import { createSerializer, Serializer } from "./Serializer"`,
                    `import { nativeModule } from "./NativeModule"`,
                    `import { ArkUINodeType } from "./ArkUINodeType"`,
                    `import { ComponentBase } from "./ComponentBase"`,
                ]
            }
            case Language.ARKTS: {
                return [
                    `import { int32 } from "@koalaui/common"`,
                    `import { PeerNode } from "./PeerNode"`,
                    `import { nullptr, KPointer } from "@koalaui/interop"`,
                    `import { isPixelMap, isResource, runtimeType, RuntimeType, SerializerBase  } from "./SerializerBase"`,
                    `import { createSerializer, Serializer } from "./Serializer"`,
                    `import { ArkUINodeType } from "./ArkUINodeType"`,
                    `import { ComponentBase } from "./ComponentBase"`,
                    `import { NativeModule } from "./NativeModule"`,
                    `${collectDtsImports().trim()}`
                ]
            }
            case Language.JAVA: {
                return [
                    "import org.koalaui.arkoala.*;"
                ]
            }
        }
    }
}

class PeersVisitor {
    readonly peers: Map<string, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) { }

    printPeers(): void {
        for (const file of this.library.files.values()) {
            const visitor = new PeerFileVisitor(this.library, file, this.dumpSerialized)
            visitor.printFile()
            this.peers.set(visitor.targetBasename, visitor.printer.getOutput())
        }
    }
}

const returnValName = "retval"  // make sure this doesn't collide with parameter names!

export function printPeers(peerLibrary: PeerLibrary, dumpSerialized: boolean): Map<string, string> {
    const visitor = new PeersVisitor(peerLibrary, dumpSerialized)
    visitor.printPeers()
    const result = new Map<string, string>()
    for (const [key, content] of visitor.peers) {
        if (content.length === 0) continue
        result.set(key, content.join('\n'))
    }
    return result
}

export function printPeerFinalizer(peerClassBase: PeerClassBase, writer: LanguageWriter): void {
    const className = peerClassBase.getComponentName()
    const finalizer = new Method(
        "getFinalizer",
        new MethodSignature(Type.Pointer, []),
        [MethodModifier.PRIVATE, MethodModifier.STATIC])
    writer.writeMethodImplementation(finalizer, writer => {
        writer.writeStatement(
            writer.makeReturn(
                writer.makeMethodCall("nativeModule()", `_${className}_getFinalizer`, [])))
    })
}

export function writePeerMethod(printer: LanguageWriter, method: PeerMethod, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnType: Type = Type.Void) {
    // Not yet!
    if (printer.language != Language.TS/* && printer.language != Language.ARKTS */) return
    const signature = method.method.signature as NamedMethodSignature
    let peerMethod = new Method(
        `${method.overloadedName}${methodPostfix}`,
        new NamedMethodSignature(returnType, signature.args, signature.argsNames),
        method.method.modifiers)
    printer.writeMethodImplementation(peerMethod, (writer) => {
    let scopes = method.argConvertors.filter(it => it.isScoped)
    scopes.forEach(it => {
        writer.pushIndent()
        writer.print(it.scopeStart?.(it.param, printer.language))
    })
    method.argConvertors.forEach((it, index) => {
        if (it.useArray) {
            writer.writeStatement(
                writer.makeAssign(`${it.param}Serializer`, new Type('Serializer'),
                    writer.makeMethodCall('SerializerBase', 'get', [
                        writer.makeString('createSerializer'), writer.makeString(index.toString())
                    ]), true)
                )
            it.convertorSerialize(it.param, it.param, writer)
        }
    })
    // Enable to see serialized data.
    if (dumpSerialized) {
        method.argConvertors.forEach((it, index) => {
            if (it.useArray) {
                writer.writePrintLog(`"${it.param}:", ${it.param}Serializer.asArray(), ${it.param}Serializer.length())`)
            }
        })
    }
    let params: LanguageExpression[] = []
    if (method.hasReceiver()) {
        params.push(writer.makeString(ptr))
    }
    method.argConvertors.forEach(it => {
        if (it.useArray) {
            params.push(writer.makeMethodCall(`${it.param}Serializer`, `asArray`, []))
            params.push(writer.makeMethodCall(`${it.param}Serializer`, `length`, []))
        } else {
            params.push(writer.makeString(it.convertorArg(it.param, writer)))
        }
    })
    let call = writer.makeNativeCall(
        `_${method.originalParentName}_${method.overloadedName}`,
        params)
    if (returnType != Type.Void) {
        writer.writeStatement(writer.makeAssign(returnValName, undefined, call, true))
    } else {
        writer.writeStatement(writer.makeStatement(call))
    }
    scopes.reverse().forEach(it => {
        writer.popIndent()
        writer.print(it.scopeEnd!(it.param, writer.language))
    })
    // TODO: refactor
    if (returnType != Type.Void) {
        let result = returnValName
        if (method.hasReceiver() && returnType === Type.This) {
            result = `this`
        } else if (method instanceof MaterializedMethod && method.peerMethodName !== "ctor"){
            const isStatic = method.method.modifiers?.includes(MethodModifier.STATIC)
            if (!method.hasReceiver()) {
                const obj = `new ${method.originalParentName}(${signature.argsNames.map(it => "undefined").join(", ")})`
                const objType = new Type(method.originalParentName)
                writer.writeStatement(writer.makeAssign("obj", objType, writer.makeString(obj), true))
                writer.writeStatement(
                    writer.makeAssign("obj.peer", new Type("Finalizable"),
                        writer.makeString(`new Finalizable(${returnValName}, ${method.originalParentName}.getFinalizer())`), false))
                result = "obj"
            }
        }
        writer.writeStatement(writer.makeReturn(writer.makeString(result)))
    }
})
}