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
import { Language, renameDtsToPeer, throwException } from "../util";
import { ImportsCollector } from "./ImportsCollector";
import { PeerClass } from "./PeerClass";
import { InheritanceRole, determineParentRole, isHeir, isRoot } from "./inheritance";
import { PeerMethod } from "./PeerMethod";
// import { MaterializedClass, printMaterializedClasses } from "./MaterializedClass"

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

function componentToAttributesClass(component: string) {
    return `Ark${component}Attributes`
}

class PeerFileVisitor {
    readonly printer: IndentedPrinter = new IndentedPrinter()

    constructor(
        private readonly file: PeerFile,
        private readonly dumpSerialized: boolean,
    ) {}

    get targetBasename() {
        return renameDtsToPeer(path.basename(this.file.originalFilename), this.file.declarationTable.language)
    }

    private generatePeerParentName(peer: PeerClass): string {
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
        imports.print(this.printer)
        PeerFileVisitor._defaultPeerImports.forEach(it => this.printer.print(it))
    }

    private printAttributes(peer: PeerClass) {
        for (const attributeType of peer.attributesTypes)
            this.printer.print(attributeType)

        const parent = this.generateAttributesParentClass(peer)
        const extendsClause =
            parent
                ? ` extends ${parent} `
                : ""
        this.printer.print(`export interface ${componentToAttributesClass(peer.componentName)} ${extendsClause} {`)

        if (peer.attributesFields.length === 0) {
            this.printer.print('}')
            return
        }
        this.printer.pushIndent()
        for (const field of peer.attributesFields)
            this.printer.print(field)
        this.printer.popIndent()
        this.printer.print('}')
    }

    private printPeerClassHeader(peer: PeerClass) {
        const peerParentName = this.generatePeerParentName(peer)
        const extendsClause =
            peerParentName
                ? `extends ${peerParentName} `
                : ""
        this.printer.print(`export class ${componentToPeerClass(peer.componentName)} ${extendsClause} {`)
    }

    private printPeerConstructor(peer: PeerClass): void {
        const printer = this.printer
        const parentRole = determineParentRole(peer.originalClassName, peer.originalParentName)

        if (parentRole === InheritanceRole.Finalizable) {
            printer.print(`constructor(type?: ArkUINodeType, component?: ArkCommon, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(BigInt(42)) // for now`)
            printer.popIndent()
            printer.print(`}`)
            return
        }
        if (parentRole === InheritanceRole.PeerNode) {
            printer.print(`constructor(type: ArkUINodeType, component?: ArkCommon, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(type, flags)`)
            printer.print(`component?.setPeer(this.peer)`)
            printer.popIndent()
            printer.print(`}`)
            return
        }

        if (parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
            printer.print(`constructor(type: ArkUINodeType, component?: ArkCommon, flags: int32 = 0) {`)
            printer.pushIndent()
            printer.print(`super(type, component, flags)`)
            printer.popIndent()
            printer.print(`}`)
            return
        }

        throwException(`Unexpected parent inheritance role: ${parentRole}`)
    }

    private printPeerMethod(method: PeerMethod) {
        const printer = this.printer
        let maybeStatic = method.hasReceiver ? "" : `static `
        let genMethodName = method.hasReceiver ? `${method.methodName}Attribute` : method.methodName
        printer.print(`${maybeStatic}${genMethodName}(${method.mappedParams}) {`)

        printer.pushIndent()
        let scopes = method.argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            printer.pushIndent()
            printer.print(it.scopeStart?.(it.param))
        })
        method.argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                printer.print(`const ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToTSSerial(it.param, it.param, printer)
            }
        })
        // Enable to see serialized data.
        if (this.dumpSerialized) {
            method.argConvertors.forEach((it, index) => {
                if (it.useArray) {
                    printer.print(`console.log("${it.param}:", ${it.param}Serializer.asArray(), ${it.param}Serializer.length())`)
                }
            })
        }
        let maybeThis = method.hasReceiver ? `this.peer.ptr${method.argConvertors.length > 0 ? ", " : ""}` : ``
        printer.print(`nativeModule()._${method.originalParentName}_${method.methodName}(${maybeThis}`)
        printer.pushIndent()
        method.argConvertors.forEach((it, index) => {
            let maybeComma = index == method.argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                printer.print(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
            printer.print(it.convertorTSArg(it.param))
            printer.print(maybeComma)
        })
        printer.popIndent()
        printer.print(`)`)
        scopes.reverse().forEach(it => {
            printer.popIndent()
            printer.print(it.scopeEnd!(it.param))
        })
        printer.popIndent()

        printer.print(`}`)
    }

    private printApplyMethod(peer: PeerClass) {
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
        this.printPeerClassHeader(peer)
        this.printer.pushIndent()
        this.printPeerConstructor(peer)
        for (const method of peer.methods)
            this.printPeerMethod(method)
        this.printApplyMethod(peer)
        this.printer.popIndent()
        this.printer.print(`}`)
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
        peerFile.enums.forEach(it => this.printEnum(it))
    }

    private printAssignEnumsToGlobalScope(peerFile: PeerFile) {
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

    private static readonly _defaultPeerImports = [
        `import { int32 } from "@koalaui/common"`,
        `import { PeerNode } from "@koalaui/arkoala"`,
        `import { nullptr, KPointer } from "@koalaui/interop"`,
        `import { runtimeType, withLength, withLengthArray, RuntimeType } from "./SerializerBase"`,
        `import { Serializer } from "./Serializer"`,
        `import { nativeModule } from "./NativeModule"`,
        `import { ArkUINodeType } from "./ArkUINodeType"`,
        `import { ArkCommon } from "./ArkCommon"`,
    ]
}

class PeersVisitor {
    readonly peers: Map<string, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) {}

    printPeers(): void {
        for (const file of this.library.files.values()) {
            const visitor = new PeerFileVisitor(file, this.dumpSerialized)
            visitor.printFile()
            this.peers.set(visitor.targetBasename, visitor.printer.getOutput())
        }
    }
}

export function printPeers(peerLibrary: PeerLibrary, dumpSerialized: boolean): Map<string, string> {
    // TODO: support other output languages
    if (peerLibrary.declarationTable.language != Language.TS)
        return new Map()

    const visitor = new PeersVisitor(peerLibrary, dumpSerialized)
    visitor.printPeers()
    const result = new Map<string, string>()
    for (const [key, content] of visitor.peers) {
        if (content.length === 0) continue
        result.set(key, content.join('\n'))
    }
    return result
}