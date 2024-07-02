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
import { IndentedPrinter } from "../../IndentedPrinter";
import { Language, renameDtsToComponent, renameDtsToPeer } from "../../util";
import { ImportsCollector } from "../ImportsCollector";
import { PeerClass } from "../PeerClass";
import { PeerFile } from "../PeerFile";
import { PeerLibrary } from "../PeerLibrary";
import { isCommonMethod } from "../inheritance";
import { PeerMethod } from "../PeerMethod";
import { componentToPeerClass } from "./PeersPrinter";
import { OverloadsPrinter, collapseSameNamedMethods } from "./OverloadsPrinter";
import { LanguageWriter, Method, MethodModifier, MethodSignature, Type, createLanguageWriter } from "../LanguageWriters";
import { convertToCallback } from "./EventsPrinter";
import { tsCopyrightAndWarning } from "../FileGenerators";

function generateArkComponentName(component: string) {
    return `Ark${component}Component`
}

class ComponentFileVisitor {
    private readonly overloadsPrinter = new OverloadsPrinter(this.printer, this.library)

    constructor(
        private library: PeerLibrary,
        private file: PeerFile,
        readonly printer: LanguageWriter,
    ) { }

    get targetBasename() {
        return renameDtsToComponent(path.basename(this.file.originalFilename), this.file.declarationTable.language)
    }

    private printImports(): void {
        const imports = new ImportsCollector()
        imports.addFilterByBasename(this.targetBasename)
        this.file.peersToGenerate.forEach(peer => {
            imports.addFeature("NodeAttach", "@koalaui/runtime")
            imports.addFeature("remember", "@koalaui/runtime")
            if (peer.originalParentFilename) {
                const parentBasename = renameDtsToComponent(path.basename(peer.originalParentFilename), this.file.declarationTable.language, false)
                imports.addFeature(generateArkComponentName(peer.parentComponentName!), `./${parentBasename}`)
            }
            imports.addFeatureByBasename(componentToPeerClass(peer.componentName),
                renameDtsToPeer(path.basename(peer.originalFilename), peer.declarationTable.language))
            peer.attributesTypes.forEach((attrType) =>
                imports.addFeatureByBasename(attrType.typeName,
                    renameDtsToPeer(path.basename(peer.originalFilename), peer.declarationTable.language))
            )
            imports.addFeature("ArkUINodeType", "./ArkUINodeType")
            imports.addFeature("runtimeType", "./SerializerBase")
            imports.addFeature("RuntimeType", "./SerializerBase")
            imports.addFeature("isPixelMap", "./SerializerBase")
            imports.addFeature("isResource", "./SerializerBase")
            imports.addFeature("isInstanceOf", "./SerializerBase")
            imports.addFeature('ComponentBase', './ComponentBase')
            imports.addFeature('unsafeCast', './generated-utils')
            for (const method of peer.methods) {
                for (const target of method.declarationTargets)
                    if (convertToCallback(peer, method, target))
                        imports.addFeature("UseEventsProperties", './use_properties')
            }
            // TBD
            // peer.materializedClasses.forEach(it => {
            //     imports.addFeature(it.className, `./Ark${peer.componentName}Peer`)
            // })
        })
        if (this.file.declarationTable.language === Language.TS)
            this.file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
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

    private printComponent(peer: PeerClass) {
        const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
        const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
        const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${it.nullable ? "?" : ""}: ${it.name}`)
        const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
        const componentClassName = generateArkComponentName(peer.componentName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
        const componentFunctionName = `Ark${peer.componentName}`
        const peerClassName = componentToPeerClass(peer.componentName)

        this.printer.writeClass(componentClassName, (writer) => {
            writer.writeFieldDeclaration('peer', new Type(peerClassName), ['protected'], true)
            for (const grouped of this.groupOverloads(peer.methods))
                this.overloadsPrinter.printGroupedComponentOverloads(peer, grouped)
            // todo stub until we can process AttributeModifier
            if (isCommonMethod(peer.originalClassName!) || peer.originalClassName == "ContainerSpanAttribute")
                writer.print(`attributeModifier(modifier: AttributeModifier<object>): this { throw new Error("not implemented") }`)
            const attributesSignature = new MethodSignature(Type.Void, [])
            writer.writeMethodImplementation(new Method('applyAttributesFinish', attributesSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.print('// we calls this function outside of class, so need to make it public')
                writer.writeMethodCall('super', 'applyAttributesFinish', [])
            })
        }, parentComponentClassName)


        this.printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style: ((attributes: ${componentClassName}) => void) | undefined,
  /** @memo */
  content_: (() => void) | undefined,
  ${mappedCallableParams?.join(", ") ?? ""}
) {
    const receiver = remember(() => {
        return new ${componentClassName}()
    })
    NodeAttach(() => new ${peerClassName}(ArkUINodeType.${peer.componentName}, receiver), () => {
        ${callableMethod ? `receiver.${callableMethod.name}(${mappedCallableParamsValues})` : ""}
        style?.(receiver)
        content_?.()
        receiver.applyAttributesFinish()
    })
}
`)
    }

    printFile(): void {
        this.printImports()
        this.file.peersToGenerate.forEach(peer => {
            this.printComponent(peer)
        })
    }
}

class ComponentsVisitor {
    readonly components: Map<string, LanguageWriter> = new Map()

    constructor(
        private readonly peerLibrary: PeerLibrary,
    ) { }

    printComponents(): void {
        for (const file of this.peerLibrary.files.values()) {
            if (!file.peersToGenerate.length)
                continue
            const writer = createLanguageWriter(Language.TS)
            const visitor = new ComponentFileVisitor(this.peerLibrary, file, writer)
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
        const text = tsCopyrightAndWarning(writer.getOutput().join('\n'))
        result.set(key, text)
    }
    return result
}