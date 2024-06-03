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
import { Language, indentedBy, renameDtsToComponent, renameDtsToPeer } from "../util";
import { ImportsCollector } from "./ImportsCollector";
import { PeerClass } from "./PeerClass";
import { PeerFile } from "./PeerFile";
import { PeerLibrary } from "./PeerLibrary";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { InheritanceRole, determineInheritanceRole, isCommonMethod } from "./inheritance";
import { PeerMethod } from "./PeerMethod";
import { componentToPeerClass } from "./PeersPrinter";
import { OverloadsPrinter, collapseSameNamedMethods } from "./OverloadsPrinter";
import { LanguageWriter, Type, createLanguageWriter } from "./LanguageWriters";

class ComponentFileVisitor {
    private readonly overloadsPrinter = new OverloadsPrinter(this.printer, this.library)
    private readonly commonOverloadsPrinter = new OverloadsPrinter(this.commonPrinter, this.library)

    constructor(
        private library: PeerLibrary,
        private file: PeerFile,
        readonly printer: LanguageWriter,
        readonly commonPrinter: LanguageWriter,
    ) { }

    get targetBasename() {
        return renameDtsToComponent(path.basename(this.file.originalFilename), this.file.declarationTable.language)
    }

    private canGenerateComponent(peer: PeerClass) {
        if (isCommonMethod(peer.originalClassName!))
            return true;
        return !PeerGeneratorConfig.skipComponentGeneration.includes(peer.originalClassName!)
            && determineInheritanceRole(peer.originalClassName!) == InheritanceRole.Heir
    }

    private printImports(): void {
        const imports = new ImportsCollector()
        imports.addFilterByBasename(this.targetBasename)
        for (const importType of this.library.importTypesStubs)
            imports.addFeatureByBasename(importType, 'ImportsStubs.ts')
        this.file.peers.forEach(peer => {
            if (!this.canGenerateComponent(peer)) return
            imports.addFeature("NodeAttach", "@koalaui/runtime")
            const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
            const callableMethodArgs = callableMethods.length > 0
                ? collapseSameNamedMethods(callableMethods).signature.args.length
                : 0
            imports.addFeature(`ArkCommonStruct${callableMethodArgs + 1}`, "./ArkStructCommon")
            imports.addFeatureByBasename(componentToPeerClass(peer.componentName),
                renameDtsToPeer(path.basename(peer.originalFilename), peer.declarationTable.language))
            imports.addFeature("ArkUINodeType", "./ArkUINodeType")
            imports.addFeature("runtimeType", "./SerializerBase")
            imports.addFeature("RuntimeType", "./SerializerBase")
            imports.addFeature("UseProperties", './use_properties')
            // TBD
            // peer.materializedClasses.forEach(it => {
            //     imports.addFeature(it.className, `./Ark${peer.componentName}Peer`)
            // })
        })
        imports.print(this.printer)
    }

    private groupOverloads(peerMethods: PeerMethod[]): PeerMethod[][] {
        const seenNames = new Set<string>()
        const groups: PeerMethod[][] = []
        for (const method of peerMethods) {
            if (seenNames.has(method.method.name))
                continue
            seenNames.add(method.method.name)
            groups.push(peerMethods.filter(it => it.method.name === method.method.name))
        }
        return groups
    }

    private printCommonComponent(peer: PeerClass) {
        for (const grouped of this.groupOverloads(peer.methods))
            this.commonOverloadsPrinter.printGroupedComponentOverloads(peer, grouped)
    }

    private printComponent(peer: PeerClass) {
        if (!this.canGenerateComponent(peer))
            return
        if (isCommonMethod(peer.originalClassName!))
            return this.printCommonComponent(peer)
        const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
        const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
        const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${it.nullable ? "?" : ""}: ${it.name}`)
        const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
        const componentClassName = `Ark${peer.componentName}Component`
        const componentFunctionName = `Ark${peer.componentName}`
        const peerClassName = componentToPeerClass(peer.componentName)
        const attributeClassName = `${peer.componentName}Attribute`
        let types = callableMethod?.signature.args.map(it => `${it.name}`)
        const parentStructClass = {
            name: `ArkCommonStruct${(types?.length ?? 0) + 1}`,
            typesLines: [
                `${componentClassName},`,
                `/** @memo */`,
                `() => void${types?.length ? "," : ""}`,
                (types ?? []).join(", ")
            ]
        }

        this.printer.writeClass(componentClassName, (writer) => {
            writer.writeFieldDeclaration('peer', new Type(peerClassName), ['protected'], true)
            for (const grouped of this.groupOverloads(peer.methods))
                this.overloadsPrinter.printGroupedComponentOverloads(peer, grouped)
            if (peer.originalParentName && !isCommonMethod(peer.originalParentName!)) {
                const parentPeer = this.library.findPeerByComponentName(peer.parentComponentName!)!
                const parentMethods = parentPeer.methods.filter(parentMethod => {
                    // excluding overridden methods
                    return !peer.methods.some(method => parentMethod.method.name == method.method.name)
                })
                for (const grouped of this.groupOverloads(parentMethods))
                    this.overloadsPrinter.printGroupedComponentOverloads(parentPeer, grouped)
            }
            writer.print(`
  /** @memo */
  _build(
    /** @memo */
    style: ((attributes: ${componentClassName}) => void) | undefined,
    /** @memo */
    content_: (() => void) | undefined,
    ${mappedCallableParams?.join(", ") ?? ""}
  ) {
        NodeAttach(() => new ${peerClassName}(ArkUINodeType.${peer.componentName}, this), () => {
            style?.(this)
            ${callableMethod ? `this.${callableMethod.name}(${mappedCallableParamsValues})` : ""}
            content_?.()
                this.applyAttributesFinish()
              })
  }`)
    }, `${parentStructClass.name}<${parentStructClass.typesLines.map(it => indentedBy(it, 1)).join("\n")}>`,
            [attributeClassName])


        this.printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style: ((attributes: ${componentClassName}) => void) | undefined,
  /** @memo */
  content_: (() => void) | undefined,
  ${mappedCallableParams?.join(", ") ?? ""}
) {
  ${componentClassName}._instantiate<
${parentStructClass.typesLines.map(it => indentedBy(it, 2)).join("\n")}
  >(
    style,
    () => new ${componentClassName}(),
    content_,
    ${mappedCallableParamsValues?.join(', ') ?? ""}
  )
}
`)
    }
    printFile(): void {
        this.printImports()
        this.file.peers.forEach(peer => {
            if (peer.hasTransitiveGenericType)
                return
            this.printComponent(peer)
        })
    }
}

class ComponentsVisitor {
    readonly components: Map<string, LanguageWriter> = new Map()
    readonly commonComponentWriter: LanguageWriter

    constructor(
        private readonly peerLibrary: PeerLibrary,
        commonComponentWriter?: LanguageWriter,
    ) { 
        this.commonComponentWriter = commonComponentWriter ?? createLanguageWriter(new IndentedPrinter(), Language.TS)
    }

    printComponents(): void {
        for (const file of this.peerLibrary.files.values()) {
            const writer = createLanguageWriter(new IndentedPrinter(), Language.TS)
            const visitor = new ComponentFileVisitor(this.peerLibrary, file, writer, this.commonComponentWriter)
            visitor.printFile()
            this.components.set(visitor.targetBasename, writer)
        }
    }
}

export function printComponents(peerLibrary: PeerLibrary): Map<string, string> {
    // TODO: support other output languages
    if (peerLibrary.declarationTable.language != Language.TS)
        return new Map()

    const visitor = new ComponentsVisitor(peerLibrary)
    visitor.printComponents()
    const result = new Map<string, string>()
    for (const [key, writer] of visitor.components) {
        if (writer.getOutput().length === 0) continue
        result.set(key, writer.getOutput().join('\n'))
    }
    return result
}

export function writeCommonComponent(peerLibrary: PeerLibrary, writer: LanguageWriter): void {
    // TODO: support other output languages
    if (peerLibrary.declarationTable.language === Language.TS) {
        const visitor = new ComponentsVisitor(peerLibrary, writer)
        visitor.printComponents()
    }
}