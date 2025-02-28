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
import * as path from "path"
import { removeExt, renameDtsToComponent, Language, isCommonMethod,
    LanguageWriter, PeerFile, PeerClass, PeerLibrary,
    createReferenceType, IDLVoidType, isOptionalType,
    Method,
    MethodSignature,
    MethodModifier,
    NamedMethodSignature
} from '@idlizer/core'
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, collapseSameNamedMethods, collectComponents, collectDeclDependencies, collectJavaImports, COMPONENT_BASE, componentToPeerClass, convertPeerFilenameToModule, findComponentByType, groupOverloads, ImportsCollector, OverloadsPrinter, peerGeneratorConfiguration, printJavaImports, TargetFile, tsCopyrightAndWarning } from '@idlizer/libohos'

export function generateArkComponentName(component: string) {
    return `Ark${component}Component`
}

class ComponentPrintResult {
    constructor(public targetFile: TargetFile, public writer: LanguageWriter) { }
}

interface ComponentFileVisitor {
    visit(): void
    getResults(): ComponentPrintResult[]
}

class TSComponentFileVisitor implements ComponentFileVisitor {
    private readonly language = this.library.language
    private readonly printer = this.library.createLanguageWriter(this.language)
    private readonly overloadsPrinter = new OverloadsPrinter(this.library, this.printer, this.library.language)

    constructor(
        private readonly library: PeerLibrary,
        private readonly file: PeerFile,
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
            imports.addFeatures(['int32', 'float32'], '@koalaui/common')
            imports.addFeatures(["KStringPtr", "KBoolean", "RuntimeType", "runtimeType"], "@koalaui/interop")
            imports.addFeatures(["NodeAttach", "remember"], "@koalaui/runtime")
            imports.addFeature('ComponentBase', '../ComponentBase')
            if (this.language === Language.TS) {
                imports.addFeature("isInstanceOf", "@koalaui/interop")
                imports.addFeatures(["isResource", "isPadding"], "../utils")
            }
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

            const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
            collectDeclDependencies(this.library, component.attributeDeclaration, imports)
            if (component.interfaceDeclaration)
                collectDeclDependencies(this.library, component.interfaceDeclaration, imports)
        })

        imports.print(this.printer, removeExt(this.targetBasename))
    }

    protected populateImports(imports: ImportsCollector) {
        imports.addFeature('unsafeCast', '@koalaui/common')
    }

    private printComponent(peer: PeerClass) {
        const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
        const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
        const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${isOptionalType(it) ? "?" : ""}: ${this.printer.getNodeName(it)}`)
        const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
        const componentClassName = generateArkComponentName(peer.componentName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
        const componentFunctionName = `Ark${peer.componentName}`
        const peerClassName = componentToPeerClass(peer.componentName)

        this.printer.print(`/** @memo:stable */`)
        this.printer.writeClass(componentClassName, (writer) => {
            writer.writeMethodImplementation(
                new Method('getPeer',
                    new MethodSignature(createReferenceType(peerClassName), []
                ), [MethodModifier.PROTECTED], []),
                writer => writer.writeStatement(
                    writer.makeReturn(
                        writer.makeCast(
                            writer.makeFieldAccess("this", "peer"),
                            createReferenceType(peerClassName),
                            {optional: true}
                        )
                    )
                )
            )
            const filteredMethods = (peer.methods as any[]).filter(it =>
                !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, this.language))
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
        if (!collectComponents(this.library).find(it => it.name === peerComponentName)?.interfaceDeclaration)
            return
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
    NodeAttach<${peerClassName}>((): ${peerClassName} => ${peerClassName}.create(receiver), (_: ${peerClassName}) => {
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
        private readonly library: PeerLibrary,
        private readonly file: PeerFile,
    ) { }

    visit(): void {
        this.file.peersToGenerate.forEach(peer => this.printComponent(peer))
    }

    getResults(): ComponentPrintResult[] {
        return this.results
    }

    private printComponent(peer: PeerClass) {
        const componentClassName = generateArkComponentName(peer.componentName)
        const componentType = createReferenceType(componentClassName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : COMPONENT_BASE
        const peerClassName = componentToPeerClass(peer.componentName)

        const result = this.library.createLanguageWriter(Language.JAVA)
        result.print(`package ${ARKOALA_PACKAGE};\n`)
        const imports = collectJavaImports(peer.methods.flatMap(method => method.method.signature.args))
        printJavaImports(result, imports)

        result.writeClass(componentClassName, (writer) => {
            peer.methods.forEach(peerMethod => {
                const originalSignature = peerMethod.method.signature as NamedMethodSignature
                const signature = new NamedMethodSignature(componentType, originalSignature.args, originalSignature.argsNames, originalSignature.defaults)
                const method = new Method(peerMethod.method.name, signature, [MethodModifier.PUBLIC])
                writer.writeMethodImplementation(method, writer => {
                    const thiz = writer.makeThis()
                    writer.writeStatement(writer.makeCondition(
                        writer.makeString(`checkPriority("${method.name}")`),
                        writer.makeBlock([
                            writer.makeStatement(writer.makeMethodCall(`((${peerClassName})peer)`, `${peerMethod.overloadedName}Attribute`, signature.argsNames.map(it => writer.makeString(it)))),
                            writer.makeReturn(thiz),
                        ])))
                    writer.writeStatement(writer.makeReturn(thiz))
                }
                )
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
    private readonly language = this.peerLibrary.language

    constructor(
        private readonly peerLibrary: PeerLibrary,
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
                visitor = new JavaComponentFileVisitor(this.peerLibrary, file)
            }
            else {
                throw new Error(`ComponentsVisitor not implemented for ${this.language.toString()}`)
            }
            visitor.visit()
            visitor.getResults().forEach(it => this.components.set(it.targetFile, it.writer))
        }
    }
}

export function printComponents(peerLibrary: PeerLibrary): Map<TargetFile, string> {
    // TODO: support other output languages
    if (![Language.TS, Language.ARKTS, Language.JAVA].includes(peerLibrary.language))
        return new Map()

    const visitor = new ComponentsVisitor(peerLibrary)
    visitor.printComponents()
    const result = new Map<TargetFile, string>()
    for (const [key, writer] of visitor.components) {
        if (writer.getOutput().length === 0) continue
        const text = tsCopyrightAndWarning(writer.getOutput().join('\n'))
        result.set(key, text)
    }
    return result
}
