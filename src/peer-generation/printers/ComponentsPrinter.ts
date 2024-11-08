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
import { removeExt, renameDtsToComponent } from "../../util";
import { convertPeerFilenameToModule, ImportsCollector } from "../ImportsCollector";
import { isCommonMethod } from "../inheritance";
import { componentToPeerClass } from "./PeersPrinter";
import { collapseSameNamedMethods, groupOverloads, OverloadsPrinter } from "./OverloadsPrinter";
import {
    createLanguageWriter,
    FieldModifier,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from "../LanguageWriters";
import { tsCopyrightAndWarning } from "../FileGenerators";
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { TargetFile } from "./TargetFile";
import { PrinterContext } from "./PrinterContext";
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, COMPONENT_BASE } from "./lang/Java";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { IdlPeerFile } from "../idl/IdlPeerFile";
import { IdlPeerClass } from "../idl/IdlPeerClass";
import { collectJavaImports } from "./lang/JavaIdlUtils";
import { printJavaImports } from "./lang/JavaPrinters";
import { Language } from "../../Language";
import { IDLVoidType, isOptionalType, toIDLType } from "../../idl";
import { createEmptyReferenceResolver, getReferenceResolver } from "../ReferenceResolver";
import { convertIdlToCallback } from "./EventsPrinter";

export function generateArkComponentName(component: string) {
    return `Ark${component}Component`
}

class ComponentPrintResult {
    constructor(public targetFile: TargetFile, public writer: LanguageWriter) {}
}

interface ComponentFileVisitor {
    visit(): void
    getResults(): ComponentPrintResult[]
}

class TSComponentFileVisitor implements ComponentFileVisitor {
    private readonly language = this.library.language
    private readonly printer = createLanguageWriter(this.language, this.library instanceof IdlPeerLibrary ? this.library : createEmptyReferenceResolver())
    private readonly overloadsPrinter = new OverloadsPrinter(getReferenceResolver(this.library), this.printer, this.library.language)

    constructor(
        private readonly library: IdlPeerLibrary,
        private readonly file: IdlPeerFile,
    ) { }

    visit(): void {
        this.printImports()
        this.file.peersToGenerate.forEach(peer => {
            this.printComponent(peer)
        })
    }

    getResults(): ComponentPrintResult[] {
        return [new ComponentPrintResult(new TargetFile(this.targetBasename), this.printer)]
    }

    private get targetBasename() {
        return renameDtsToComponent(path.basename(this.file.originalFilename), this.language)
    }

    private printImports(): void {
        const imports = new ImportsCollector()
        this.file.peersToGenerate.forEach(peer => {
            imports.addFeature('int32', '@koalaui/common')
            imports.addFeature("KStringPtr", "@koalaui/interop")
            imports.addFeature("KBoolean", "@koalaui/interop")
            imports.addFeature("NodeAttach", "@koalaui/runtime")
            imports.addFeature("remember", "@koalaui/runtime")
            imports.addFeature("ArkUINodeType", "./peers/ArkUINodeType")
            imports.addFeature("runtimeType", "./peers/SerializerBase")
            imports.addFeature("RuntimeType", "./peers/SerializerBase")
            imports.addFeature("isResource", "./peers/SerializerBase")
            imports.addFeature("isInstanceOf", "./peers/SerializerBase")
            imports.addFeature('ComponentBase', './ComponentBase')
            this.populateImports(imports)

            if (peer.originalParentFilename) {
                const parentBasename = renameDtsToComponent(path.basename(peer.originalParentFilename), this.language, false)
                imports.addFeature(generateArkComponentName(peer.parentComponentName!), `./${parentBasename}`)
            }
            const peerModule = convertPeerFilenameToModule(peer.originalFilename)
            imports.addFeature(componentToPeerClass(peer.componentName), peerModule)
            peer.attributesTypes.forEach((attrType) =>
                imports.addFeature(attrType.typeName, peerModule)
            )

            for (const method of peer.methods) {
                for (const argType of method.method.signature.args)
                    if (convertIdlToCallback(getReferenceResolver(this.library), peer, method, argType))
                        imports.addFeature("UseEventsProperties", './use_properties')
            }
            // TBD
            // peer.materializedClasses.forEach(it => {
            //     imports.addFeature(it.className, `./Ark${peer.componentName}Peer`)
            // })
        })
        this.file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
        imports.print(this.printer, removeExt(this.targetBasename))
    }

    protected populateImports(imports: ImportsCollector) {
        imports.addFeature('unsafeCast', './shared/generated-utils')
    }

    private printComponent(peer: IdlPeerClass) {
        const callableMethods = (peer.methods as any[]).filter(it => it.isCallSignature).map(it => it.method)
        const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
        const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${isOptionalType(it) ? "?" : ""}: ${this.printer.stringifyType(it)}`)
        const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
        const componentClassName = generateArkComponentName(peer.componentName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
        const componentFunctionName = `Ark${peer.componentName}`
        const peerClassName = componentToPeerClass(peer.componentName)

        this.printer.print(`/** @memo:stable */`)
        this.printer.writeClass(componentClassName, (writer) => {
            writer.writeFieldDeclaration('peer', toIDLType(peerClassName), [FieldModifier.PROTECTED], true)
            const filteredMethods = (peer.methods as any[]).filter(it =>
                this.language !== Language.ARKTS || !PeerGeneratorConfig.ArkTsIgnoredMethods.includes(it.overloadedName))
            for (const grouped of groupOverloads(filteredMethods))
                this.overloadsPrinter.printGroupedComponentOverloads(peer, grouped)
            // todo stub until we can process AttributeModifier
            if (isCommonMethod(peer.originalClassName!) || peer.originalClassName == "ContainerSpanAttribute")
                writer.print(`attributeModifier(modifier: AttributeModifier<object>): this { throw new Error("not implemented") }`)
            const attributesSignature = new MethodSignature(IDLVoidType, [])
            writer.writeMethodImplementation(new Method('applyAttributesFinish', attributesSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.print('// we calls this function outside of class, so need to make it public')
                writer.writeMethodCall('super', 'applyAttributesFinish', [])
            })
        }, parentComponentClassName)

        this.printComponentFunction(
            componentClassName,
            componentFunctionName,
            mappedCallableParams?.join(", ") ?? "",
            peerClassName,
            callableMethod?.name ? `receiver.${callableMethod?.name}(${mappedCallableParamsValues})` : "",
            peer.componentName)
    }

    protected printComponentFunction(
        componentClassName: string,
        componentFunctionName: string,
        mappedCallableParams: string,
        peerClassName: string,
        callableMethodName: string | undefined,
        peerComponentName: string) {
        this.printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style: ((attributes: ${componentClassName}) => void) | undefined,
  /** @memo */
  content_: (() => void) | undefined,
  ${mappedCallableParams}
) {
    const receiver = remember(() => {
        return new ${componentClassName}()
    })
    NodeAttach<${peerClassName}>((): ${peerClassName} => ${peerClassName}.create(ArkUINodeType.${peerComponentName}, receiver), (_: ${peerClassName}) => {
        ${callableMethodName}
        style?.(receiver)
        content_?.()
        receiver.applyAttributesFinish()
    })
}`)
    }
}

class ArkTsComponentFileVisitor extends TSComponentFileVisitor {
    protected populateImports(imports: ImportsCollector) {
        imports.addFeature('TypeChecker', '#components')
    }

    protected printComponentFunction(componentClassName: string,
                                     componentFunctionName: string,
                                     mappedCallableParams: string,
                                     peerClassName: string,
                                     callableMethodName: string | undefined,
                                     peerComponentName: string) {
        // Error fix: Class 'ArkTest' is already defined with different type
        // "ArkTest" - already used in ArkTS
        if (componentFunctionName !== "ArkTest") {
            super.printComponentFunction(componentClassName,
                componentFunctionName,
                mappedCallableParams,
                peerClassName,
                callableMethodName,
                peerComponentName);
        }
    }
}

class JavaComponentFileVisitor implements ComponentFileVisitor {
    private readonly results: ComponentPrintResult[] = []

    constructor(
        private readonly library: IdlPeerLibrary,
        private readonly file: IdlPeerFile,
        private readonly printerContext: PrinterContext,
    ) { }

    visit(): void {
        this.file.peersToGenerate.forEach(peer => this.printComponent(peer))
    }

    getResults(): ComponentPrintResult[] {
        return this.results
    }

    private printComponent(peer: IdlPeerClass) {
        const componentClassName = generateArkComponentName(peer.componentName)
        const componentType = toIDLType(componentClassName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : COMPONENT_BASE
        const peerClassName = componentToPeerClass(peer.componentName)

        const result = createLanguageWriter(Language.JAVA, this.library)
        result.print(`package ${ARKOALA_PACKAGE};\n`)
        const imports = collectJavaImports(peer.methods.flatMap(method => method.method.signature.args))
        printJavaImports(result, imports)

        result.writeClass(componentClassName, (writer) => {
            peer.methods.forEach(peerMethod => {
                const originalSignature = peerMethod.method.signature as NamedMethodSignature
                const signature = new NamedMethodSignature(componentType, originalSignature.args, originalSignature.argsNames, originalSignature.defaults)
                const method = new Method(peerMethod.method.name, signature, [MethodModifier.PUBLIC])
                writer.writeMethodImplementation(method, writer => {
                    const thiz = writer.makeString('this')
                    writer.writeStatement(writer.makeCondition(
                        writer.makeString(`checkPriority("${method.name}")`),
                        writer.makeBlock([
                            writer.makeStatement(writer.makeMethodCall(`((${peerClassName})peer)`, `${peerMethod.overloadedName}Attribute`, signature.argsNames.map(it => writer.makeString(it)))),
                            writer.makeReturn(thiz),
                        ])))
                    writer.writeStatement(writer.makeReturn(thiz))
                })
            })

            const attributesSignature = new MethodSignature(IDLVoidType, [])
            const applyAttributesFinish = 'applyAttributesFinish'
            writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.writeMethodCall('super', applyAttributesFinish, [])
            })
        }, parentComponentClassName)

        this.results.push(new ComponentPrintResult(new TargetFile(componentClassName + Language.JAVA.extension, ARKOALA_PACKAGE_PATH), result))
    }
}

class ComponentsVisitor {
    readonly components: Map<TargetFile, LanguageWriter> = new Map()
    private readonly language = this.printerContext.language

    constructor(
        private readonly peerLibrary: IdlPeerLibrary,
        private readonly printerContext: PrinterContext,
    ) { }

    printComponents(): void {
        for (const file of this.peerLibrary.files.values()) {
            if (!file.peersToGenerate.length)
                continue
            let visitor: ComponentFileVisitor
            if (this.language == Language.TS) {
                visitor = new TSComponentFileVisitor(this.peerLibrary, file)
            }
            else if (this.language == Language.ARKTS) {
                visitor = new ArkTsComponentFileVisitor(this.peerLibrary, file)
            }
            else if (this.language == Language.JAVA) {
                visitor = new JavaComponentFileVisitor(this.peerLibrary, file, this.printerContext)
            }
            else {
                throw new Error(`ComponentsVisitor not implemented for ${this.language.toString()}`)
            }
            visitor.visit()
            visitor.getResults().forEach(it => this.components.set(it.targetFile, it.writer))
        }
    }
}

export function printComponents(peerLibrary: IdlPeerLibrary, printerContext: PrinterContext): Map<TargetFile, string> {
    // TODO: support other output languages
    if (![Language.TS, Language.ARKTS, Language.JAVA].includes(peerLibrary.language))
        return new Map()

    const visitor = new ComponentsVisitor(peerLibrary, printerContext)
    visitor.printComponents()
    const result = new Map<TargetFile, string>()
    for (const [key, writer] of visitor.components) {
        if (writer.getOutput().length === 0) continue
        const text = tsCopyrightAndWarning(writer.getOutput().join('\n'))
        result.set(key, text)
    }
    return result
}