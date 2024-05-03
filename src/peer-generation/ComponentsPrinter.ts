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
import { InheritanceRole, determineInheritanceRole } from "./inheritance";
import { PeerMethod } from "./PeerMethod";
import { componentToPeerClass } from "./PeersPrinter";

class ComponentFileVisitor {
    readonly printer: IndentedPrinter = new IndentedPrinter()

    constructor(
        private file: PeerFile,
    ) { } 
    
    get targetBasename() {
        return renameDtsToComponent(path.basename(this.file.originalFilename), this.file.declarationTable.language)
    }

    private canGenerateComponent(peer: PeerClass) {
        return !PeerGeneratorConfig.skipComponentGeneration.includes(peer.originalClassName!)
            && determineInheritanceRole(peer.originalClassName!) == InheritanceRole.Heir
    }

    private printImports(): void {
        const imports = new ImportsCollector()
        imports.addFilterByBasename(this.targetBasename)
        this.file.peers.forEach(peer => {
            if (!this.canGenerateComponent(peer)) return
            for (const importType of peer.usedImportTypesStubs)
                imports.addFeatureByBasename(importType, 'ImportsStubs.ts')
            imports.addFeature("NodeAttach", "@koalaui/runtime")
            const structPostfix = (peer.callableMethod?.mappedParamsTypes?.length ?? 0) + 1
            imports.addFeature(`ArkCommonStruct${structPostfix}`, "./ArkStructCommon")
            imports.addFeatureByBasename(componentToPeerClass(peer.componentName),
                renameDtsToPeer(path.basename(peer.originalFilename), peer.declarationTable.language))
            imports.addFeature("ArkUINodeType", "./ArkUINodeType")
            // TBD
            // peer.materializedClasses.forEach(it => {
            //     imports.addFeature(it.className, `./Ark${peer.componentName}Peer`)
            // })
        })
        imports.print(this.printer)
    }

    private printComponentMethod(method: PeerMethod) {
        this.printer.print(`/** @memo */`)
        this.printer.print(`${method.methodName}(${method.mappedParams}): this {`)
        this.printer.pushIndent()
        this.printer.print(`if (this.checkPriority("${method.methodName}")) {`)
        this.printer.pushIndent()
        this.printer.print(`this.peer?.${method.methodName}Attribute(${method.mappedParamValues})`)
        this.printer.popIndent()
        this.printer.print(`}`)
        this.printer.print("return this")
        this.printer.popIndent()
        this.printer.print(`}\n`)
    }

    private printComponent(peer: PeerClass) {
        if (!this.canGenerateComponent(peer)) return
        const method = peer.callableMethod
        const componentClassName = `Ark${peer.componentName}Component`
        const componentFunctionName = `Ark${peer.componentName}`
        const peerClassName = componentToPeerClass(peer.componentName)
        const attributeClassName = `${peer.componentName}Attribute`
        const parentStructClass = {
            name: `ArkCommonStruct${(method?.mappedParamsTypes?.length ?? 0) + 1}`,
            typesLines: [
                `${componentClassName},`,
                `/** @memo */`,
                `() => void${method?.mappedParamsTypes?.length ? "," : ""}`,
                (method?.mappedParamsTypes ?? []).join(", ")
            ]
        }
        this.printer.print(`
export class ${componentClassName} extends ${parentStructClass.name}<
${parentStructClass.typesLines.map(it => indentedBy(it, 1)).join("\n")}
> implements ${attributeClassName} {

  protected peer?: ${peerClassName}
`)
        this.printer.pushIndent()
        for (const method of peer.methods)
            this.printComponentMethod(method)
        this.printer.popIndent()

        this.printer.print(`
  /** @memo */
  _build(
    /** @memo */
    style: ((attributes: ${componentClassName}) => void) | undefined,
    /** @memo */
    content_: (() => void) | undefined,
    ${method?.mappedParams ?? ""}
  ) {
    NodeAttach(() => new ${peerClassName}(ArkUINodeType.${peer.componentName}, this), () => {
      style?.(this)
      ${method ? `this.${method?.methodName}(${method?.mappedParamValues})` : ""}
      content_?.()
      this.applyAttributesFinish()
    })
  }
}`)

    this.printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style: ((attributes: ${componentClassName}) => void) | undefined,
  /** @memo */
  content_: (() => void) | undefined,
  ${method?.mappedParams ?? ""}
) {
  ${componentClassName}._instantiate<
${parentStructClass.typesLines.map(it => indentedBy(it, 2)).join("\n")}
  >(
    style,
    () => new ${componentClassName}(),
    content_,
    ${method?.mappedParamValues ?? ""}
  )
}
`)
    }

    printFile(): void {
        this.printImports()
        this.file.peers.forEach(peer => this.printComponent(peer))
    }
}

class ComponentsVisitor {
    readonly components: Map<string, string[]> = new Map()

    constructor(
        private readonly peerLibrary: PeerLibrary
    ) {}

    printComponents(): void {
        for (const file of this.peerLibrary.files.values()) {
            const visitor = new ComponentFileVisitor(file)
            visitor.printFile()
            this.components.set(visitor.targetBasename, visitor.printer.getOutput())
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
    for (const [key, content] of visitor.components) {
        if (content.length === 0) continue
        result.set(key, content.join('\n'))
    }
    return result
}