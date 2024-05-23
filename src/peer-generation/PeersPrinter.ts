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
import { PeerClass } from "./PeerClass";
import { InheritanceRole, determineParentRole, isHeir, isRoot } from "./inheritance";
import { PeerMethod } from "./PeerMethod";
import {
    LanguageWriter,
    Method,
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
    readonly printer: LanguageWriter = createLanguageWriter(new IndentedPrinter(), this.file.declarationTable.language)

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
        for (const importType of this.library.importTypesStubs)
            imports.addFeatureByBasename(importType, 'ImportsStubs.ts')
        this.file.peers.forEach(peer => {
            if (!peer.originalParentFilename) return
            const parentBasename = renameDtsToPeer(path.basename(peer.originalParentFilename), this.file.declarationTable.language)
            imports.addFeatureByBasename(this.generatePeerParentName(peer), parentBasename)
            const parentAttributesClass = this.generateAttributesParentClass(peer)
            if (parentAttributesClass)
                imports.addFeatureByBasename(parentAttributesClass, parentBasename)
        })
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
            [new Type(this.isArkTs ? 'int' : 'ArkUINodeType', !isNode), new Type('ArkCommon', true), new Type('int32')],
            ['type', 'component', 'flags'],
            [undefined, undefined, '0'])

        printer.writeConstructorImplementation(componentToPeerClass(peer.componentName), signature, (writer) => {
            if (parentRole === InheritanceRole.Finalizable) {
                writer.writeSuperCall(['BigInt(42)']) // for now
            } else if (parentRole === InheritanceRole.PeerNode) {
                writer.writeSuperCall([`type`, 'flags'])
                writer.writeMethodCall('component', 'setPeer', ['this.peer'], true)
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
            this.printer.print(`applyAttributes(attributes: ${typeParam}): void {`)
            this.printer.pushIndent()
            this.printer.print(`super.constructor(42)`)
            this.printer.popIndent()
            this.printer.print(`}`)
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

    private printEnum(enumEntity: EnumEntity) {
        this.printer.print(enumEntity.comment)
        this.printer.print(`enum Ark${enumEntity.name} {`)
        this.printer.pushIndent()
        for (const member of enumEntity.members) {
            this.printer.print(member.comment)
            if (member.initializerText != undefined) {
                this.printer.print(`${member.name} = ${member.initializerText},`)
            } else {
                this.printer.print(`${member.name},`)
            }
        }
        this.printer.popIndent()
        this.printer.print(`}`)
    }

    private printEnums(peerFile: PeerFile) {
        if (!(this.isTs||this.isArkTs)) return
        peerFile.enums.forEach(it => this.printEnum(it))
    }

    private printAssignEnumsToGlobalScope(peerFile: PeerFile) {
        if (!(this.isTs||this.isArkTs)) return
        if (peerFile.enums.length != 0) {
            this.printer.print(`Object.assign(globalThis, {`)
            this.printer.pushIndent()
            for (const enumEntity of peerFile.enums) {
                this.printer.print(`${enumEntity.name}: Ark${enumEntity.name},`)
            }
            this.printer.popIndent()
            this.printer.print(`})`)
        }
    }

    printFile(): void {
        this.printImports()
        this.printEnums(this.file)
        this.printAssignEnumsToGlobalScope(this.file)
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
                    `import { PeerNode } from "@koalaui/arkoala"`,
                    `import { nullptr, KPointer } from "@koalaui/interop"`,
                    `import { runtimeType, RuntimeType } from "./SerializerBase"`,
                    `import { Serializer } from "./Serializer"`,
                    `import { nativeModule } from "./NativeModule"`,
                    `import { ArkUINodeType } from "./ArkUINodeType"`,
                    `import { ArkCommon } from "./ArkCommon"`,
                ]
            }
            case Language.ARKTS: {
                return [
                    `import { int32 } from "@koalaui/common"`,
                    `import { PeerNode } from "@koalaui/arkoala"`,
                    `import { nullptr, KPointer } from "@koalaui/interop"`,
                    `import { runtimeType, RuntimeType } from "./SerializerBase"`,
                    `import { Serializer } from "./Serializer"`,
                    `import { ArkUINodeType } from "./ArkUINodeType"`,
                    `import { ArkCommon } from "./ArkCommon"`,
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

export function writePeerMethod(printer: LanguageWriter, method: PeerMethod, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnType: Type = Type.Void) {
    if (printer.language != Language.TS) return
    const signature = method.method.signature as NamedMethodSignature
    let peerMethod = new Method(
        method.hasReceiver() ? `${method.overloadedName}${methodPostfix}` : method.overloadedName,
        new NamedMethodSignature(returnType, signature.args, signature.argsNames),
        method.method.modifiers)
    printer.writeMethodImplementation(peerMethod, (writer) => {
    let scopes = method.argConvertors.filter(it => it.isScoped)
    scopes.forEach(it => {
        writer.pushIndent()
        writer.print(it.scopeStart?.(it.param, printer.language))
    })
    method.argConvertors.forEach(it => {
        if (it.useArray) {
            let size = it.estimateSize()
            writer.print(`const ${it.param}Serializer = new Serializer(${size})`)
            // TODO: pass writer to convertors!
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
    //let maybeThis = method.hasReceiver() ? `this.peer.ptr${method.argConvertors.length > 0 ? ", " : ""}` : ``
    let maybeThis = method.hasReceiver() ? `${ptr}${method.argConvertors.length > 0 ? ", " : ""}` : ``
    const result = returnType == Type.Void ? "" : `const ${returnValName} = `
    writer.print(`${result}nativeModule()._${method.originalParentName}_${method.overloadedName}(${maybeThis}`)
    writer.pushIndent()
    method.argConvertors.forEach((it, index) => {
        let maybeComma = index == method.argConvertors.length - 1 ? "" : ","
        if (it.useArray)
            writer.print(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
        else
            writer.print(it.convertorArg(it.param, writer))
        writer.print(maybeComma)
    })
    writer.popIndent()
    writer.print(`)`)
    scopes.reverse().forEach(it => {
        writer.popIndent()
        writer.print(it.scopeEnd!(it.param, writer.language))
    })
    method.argConvertors.forEach(it => {
        if (it.useArray) writer.print(`${it.param}Serializer.close()`)
    })

    if (returnType != Type.Void) {
        let result = returnValName
        if (method.hasReceiver() && returnType === Type.This) {
            result = `this`
        } else if (method instanceof MaterializedMethod && method.peerMethodName !== "ctor"){
            const obj = `new ${method.originalParentName}(${signature.argsNames.map(it => "undefined").join(",")})`
            const objType = new Type(method.originalParentName)
            writer.writeStatement(writer.makeAssign("obj", objType, writer.makeString(obj), true))
            writer.writeStatement(writer.makeAssign("obj.peer", new Type("Finalizable"), writer.makeString(`new Finalizable(${returnValName})`), false))
            result = "obj"
        }
        writer.writeStatement(writer.makeReturn(writer.makeString(result)))
    }
})
}