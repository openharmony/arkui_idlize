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
import { Language, indentedBy, isDefined, renameDtsToComponent, renameDtsToPeer } from "../util";
import { ImportsCollector } from "./ImportsCollector";
import { PeerClass } from "./PeerClass";
import { PeerFile } from "./PeerFile";
import { PeerLibrary } from "./PeerLibrary";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { InheritanceRole, determineInheritanceRole, isCommonMethod } from "./inheritance";
import { PeerMethod } from "./PeerMethod";
import { componentToPeerClass } from "./PeersPrinter";
import { Method, MethodSignature, Type, createLanguageWriter } from "./LanguageWriters";
import { RuntimeType } from "./PeerGeneratorVisitor";

export function collapseSameNamedMethods(methods: Method[]): Method {
    if (methods.some(it => it.signature.defaults?.length))
        throw "Can not process defaults in collapsed method"
    const maxArgLength = Math.max(...methods.map(it => it.signature.args.length))
    const collapsedArgs: Type[] = Array.from({length: maxArgLength}, (_, argIndex) => {
        const name = methods.map(it => it.signature.args[argIndex]?.name).filter(isDefined).join(' | ')
        const optional = methods.some(it => it.signature.args[argIndex]?.nullable ?? true)
        return new Type(name, optional)
    })
    return new Method(
        methods[0].name,
        new MethodSignature(
            methods[0].signature.returnType,
            collapsedArgs,
        ),
        methods[0].modifiers
    )
}

class ComponentFileVisitor {
    readonly printer = createLanguageWriter(new IndentedPrinter(), this.file.declarationTable.language)

    constructor(
        private library: PeerLibrary,
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

    private printGroupedComponentOverloads(peerMethods: PeerMethod[]) {
        const orderedMethods = Array.from(peerMethods)
            .sort((a, b) => b.argConvertors.length - a.argConvertors.length)
        const collapsedMethod = collapseSameNamedMethods(orderedMethods.map(it => it.method))
        this.printer.print(`/** @memo */`)
        this.printer.writeMethodImplementation(collapsedMethod, (writer) => {
            writer.print(`if (this.checkPriority("${collapsedMethod.name}")) {`)
            this.printer.pushIndent()
            const argsNames = collapsedMethod.signature.args.map((_, index) => collapsedMethod.signature.argName(index))
            for (let i = 0; i < collapsedMethod.signature.args.length; i++) {
                this.printer.print(`const ${argsNames[i]}_type = runtimeType(${argsNames[i]})`)
            }
            if (orderedMethods.length > 1) {
                for (const peerMethod of orderedMethods)
                    this.printComponentOverloadSelector(collapsedMethod, peerMethod)
                writer.print(`throw "Can not select appropriate overload"`)
            } else {
                this.printPeerCall(collapsedMethod, orderedMethods[0])
            }
            this.printer.popIndent()
            this.printer.print(`}`)
            this.printer.print("return this")
        })
    }

    private printComponentOverloadSelector(collapsedMethod: Method, peerMethod: PeerMethod) {
        const argsConditions = collapsedMethod.signature.args.map((_, argIndex) => {
            const runtimeTypes = peerMethod.argConvertors[argIndex]?.runtimeTypes ?? [RuntimeType.UNDEFINED]
            const value = collapsedMethod.signature.argName(argIndex)
            let maybeComma1 = (runtimeTypes.length > 1) ? "(" : ""
            let maybeComma2 = (runtimeTypes.length > 1) ? ")" : ""
            return `(${runtimeTypes.map(it => `${maybeComma1}RuntimeType.${RuntimeType[it]} == ${value}_type${maybeComma2}`).join(" || ")})`
        })
        this.printer.print(`if (${argsConditions.join(" && ")}) {`)
        this.printer.pushIndent()
        this.printPeerCall(collapsedMethod, peerMethod)
        this.printer.print(`return this`)
        this.printer.popIndent()
        this.printer.print('}')
    }

    private printPeerCall(collapsedMethod: Method, peerMethod: PeerMethod) {
        const argsNames = peerMethod.argConvertors.map((conv, index) => {
            const argName = collapsedMethod.signature.argName(index)
            const castedArgName = `${argName}_casted`
            const castedType = peerMethod.method.signature.args[index].name
            this.printer.print(`const ${castedArgName} = ${argName} as (${castedType})`)
            return castedArgName
        })
        this.printer.writeMethodCall(`this.peer`, `${peerMethod.overloadedName}Attribute`, argsNames, true)
    }


    private printComponent(peer: PeerClass) {
        if (!this.canGenerateComponent(peer))
            return
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
                this.printGroupedComponentOverloads(grouped)
            if (peer.originalParentName && !isCommonMethod(peer.originalParentName!)) {
                const parentPeer = this.library.findPeerByComponentName(peer.parentComponentName!)!
                const parentMethods = parentPeer.methods.filter(parentMethod => {
                    // excluding overridden methods
                    return !peer.methods.some(method => parentMethod.method.name == method.method.name)
                })
                for (const grouped of this.groupOverloads(parentMethods))
                    this.printGroupedComponentOverloads(grouped)
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
    readonly components: Map<string, string[]> = new Map()

    constructor(
        private readonly peerLibrary: PeerLibrary
    ) { }

    printComponents(): void {
        for (const file of this.peerLibrary.files.values()) {
            const visitor = new ComponentFileVisitor(this.peerLibrary, file)
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