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
import {
    removeExt, renameDtsToComponent, Language, isCommonMethod,
    LanguageWriter, PeerFile, PeerClass, PeerLibrary,
    createReferenceType, IDLVoidType, isOptionalType,
    Method,
    MethodSignature,
    MethodModifier,
    NamedMethodSignature,
    LayoutNodeRole
} from '@idlizer/core'
import {
    ARKOALA_PACKAGE,
    ARKOALA_PACKAGE_PATH,
    collapseIdlPeerMethods,
    collapseSameNamedMethods,
    collectComponents,
    collectDeclDependencies,
    collectJavaImports,
    COMPONENT_BASE,
    componentToAttributesClass,
    componentToInterface,
    componentToPeerClass,
    convertPeerFilenameToModule,
    findComponentByType,
    generateAttributesParentClass,
    generateInterfaceParentInterface,
    groupOverloads,
    IdlComponentDeclaration,
    ImportsCollector,
    OverloadsPrinter,
    peerGeneratorConfiguration,
    PrinterResult,
    printJavaImports,
    TargetFile,
    tsCopyrightAndWarning,
} from '@idlizer/libohos'

export function generateArkComponentName(component: string) {
    return `Ark${component}ComponentImplementation`
}

class ComponentPrintResult {
    constructor(public targetFile: TargetFile, public writer: LanguageWriter) { }
}

interface ComponentFileVisitor {
    visit(): PrinterResult[]
}

class TSComponentFileVisitor implements ComponentFileVisitor {

    constructor(
        private readonly library: PeerLibrary,
        private readonly file: PeerFile,
    ) { }

    private overloadsPrinter(printer:LanguageWriter) {
        return new OverloadsPrinter(this.library, printer, this.library.language)
    }

    visit(): PrinterResult[] {
        return this.file.peersToGenerate.flatMap(peer => {
            return this.printComponent(peer)
        })
    }

    private printImports(peer: PeerClass, component:IdlComponentDeclaration): ImportsCollector {
        const imports = new ImportsCollector()
        imports.addFeatures(['int32', 'float32'], '@koalaui/common')
        imports.addFeatures(["KStringPtr", "KBoolean", "RuntimeType", "runtimeType"], "@koalaui/interop")
        imports.addFeatures(["NodeAttach", "remember"], "@koalaui/runtime")
        imports.addFeature('ComponentBase', '../ComponentBase')
        if (this.library.language === Language.TS) {
            imports.addFeature("isInstanceOf", "@koalaui/interop")
            imports.addFeatures(["isResource", "isPadding"], "../utils")
        }
        this.populateImports(imports)

        if (peer.originalParentFilename) {
            const [parentRef] = component.attributeDeclaration.inheritance
            const parentDecl = this.library.resolveTypeReference(parentRef)
            if (parentDecl) {
                const parentGeneratedPath = this.library.layout.resolve({
                    node: parentDecl,
                    role: LayoutNodeRole.COMPONENT
                })
                imports.addFeature(generateArkComponentName(peer.parentComponentName!), `./${parentGeneratedPath}`)

                const parentAttributesClass = generateAttributesParentClass(peer)
                if (parentAttributesClass)
                    imports.addFeature(parentAttributesClass, `./${parentGeneratedPath}`)
                const parentInterface = generateInterfaceParentInterface(peer)
                if (parentInterface)
                    imports.addFeature(parentInterface, `./${parentGeneratedPath}`)
            }
        }
        const peerModule = convertPeerFilenameToModule(peer.originalFilename)
        imports.addFeature(componentToPeerClass(peer.componentName), peerModule)

        collectDeclDependencies(this.library, component.attributeDeclaration, imports)
        if (component.interfaceDeclaration)
            collectDeclDependencies(this.library, component.interfaceDeclaration, imports)
        return imports
    }

    protected populateImports(imports: ImportsCollector) {
        imports.addFeature('unsafeCast', '@koalaui/common')
    }

    protected printAttributes(peer: PeerClass, printer:LanguageWriter) {
        const parent = generateAttributesParentClass(peer)
        printer.writeInterface(componentToAttributesClass(peer.componentName), (writer) => {
            for (const field of peer.attributesFields) {
                writer.writeFieldDeclaration(
                    field.name,
                    field.type,
                    [],
                    true
                )
            }
        }, parent ? [parent] : undefined)
    }

    protected printInterface(peer: PeerClass, printer:LanguageWriter): string {
        const componentInterfaceName = componentToInterface(peer.componentName)
        const parent = generateInterfaceParentInterface(peer)
        printer.writeInterface(componentInterfaceName, (writer) => {
            const filteredMethods = peer.methods.filter(it =>
                !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, this.library.language))
            groupOverloads(filteredMethods).forEach(group => {
                const method = collapseIdlPeerMethods(this.library, group)
                writer.print(`/** @memo */`)
                writer.writeMethodDeclaration(method.method.name, method.method.signature)
            })
        }, parent ? [parent] : undefined)
        return componentInterfaceName
    }

    private printComponent(peer: PeerClass): PrinterResult[] {

        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!

        const imports = this.printImports(peer, component)
        const printer = this.library.createLanguageWriter()

        const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
        const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
        const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${isOptionalType(it) ? "?" : ""}: ${printer.getNodeName(it)}`)
        const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
        const componentClassName = generateArkComponentName(peer.componentName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
        const componentFunctionName = `Ark${peer.componentName}`
        const peerClassName = componentToPeerClass(peer.componentName)

        this.printAttributes(peer, printer)
        const componentInterfaceName = this.printInterface(peer, printer)

        printer.print(`/** @memo:stable */`)
        printer.writeClass(componentClassName, (writer) => {
            writer.writeMethodImplementation(
                new Method('getPeer',
                    new MethodSignature(createReferenceType(peerClassName), []
                    ), [MethodModifier.PROTECTED], []),
                writer => writer.writeStatement(
                    writer.makeReturn(
                        writer.makeCast(
                            writer.makeFieldAccess("this", "peer"),
                            createReferenceType(peerClassName),
                            { optional: true }
                        )
                    )
                )
            )
            const filteredMethods = (peer.methods as any[]).filter(it =>
                !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, this.library.language))
            for (const grouped of groupOverloads(filteredMethods))
                this.overloadsPrinter(printer).printGroupedComponentOverloads(peer, grouped)
            // todo stub until we can process AttributeModifier
            if (isCommonMethod(peer.originalClassName!) || peer.originalClassName == "ContainerSpanAttribute")
                writer.print(`attributeModifier(modifier: AttributeModifier<object>): this { throw new Error("not implemented") }`)

            const attributesFinishSignature = new MethodSignature(IDLVoidType, [])
            const applyAttributesFinish = 'applyAttributesFinish'
            writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.print('// we calls this function outside of class, so need to make it public')
                writer.writeMethodCall('super', applyAttributesFinish, [])
            })

            const peerAttrbiutesType = idl.createReferenceType(componentToAttributesClass(peer.componentName))
            const applyAttributesSignature = new MethodSignature(IDLVoidType, [peerAttrbiutesType], undefined, undefined, ["attrs"])
            const applyAttributes = 'applyAttributes'
            writer.print(`/** @memo */`)
            writer.writeMethodImplementation(new Method(applyAttributes, applyAttributesSignature, [MethodModifier.PUBLIC]), (writer) => {
                for (const field of peer.attributesFields) {
                    if (peerGeneratorConfiguration().ignoreMethod(field.name, this.library.language)) {
                        continue
                    }
                    writer.writeStatement(
                        writer.makeCondition(
                            writer.makeDefinedCheck(`attrs.${field.name}`),
                            writer.makeStatement(
                                writer.makeMethodCall('this', field.name, [
                                    writer.makeString(`attrs.${field.name}!`)
                                ])
                            )
                        )
                    )
                }
                writer.writeMethodCall('super', applyAttributes, ['attrs'])
            })
        }, parentComponentClassName, [componentInterfaceName])

        const componentFunction = this.library.createLanguageWriter()
        this.printComponentFunction(
            componentFunction,
            componentInterfaceName,
            componentClassName,
            componentFunctionName,
            mappedCallableParams?.join(", ") ?? "",
            peerClassName,
            callableMethod?.name ? `receiver.${callableMethod?.name}(${mappedCallableParamsValues})` : "",
            peer.componentName)

        return [{
            collector: imports,
            content: printer,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.implementation'
            }
        }, {
            collector: imports,
            content: componentFunction,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.function'
            }
        }]
    }

    protected printComponentFunction(
        printer: LanguageWriter,
        componentInterfaceName: string,
        componentClassImplName: string,
        componentFunctionName: string,
        mappedCallableParams: string,
        peerClassName: string,
        callableMethodName: string | undefined,
        peerComponentName: string) {
        if (!collectComponents(this.library).find(it => it.name === peerComponentName)?.interfaceDeclaration)
            return
        printer.print(`
/** @memo */
export function ${componentFunctionName}(
  /** @memo */
  style: ((attributes: ${componentInterfaceName}) => void) | undefined,
  /** @memo */
  content_: (() => void) | undefined,
  ${mappedCallableParams}
) {
    const receiver = remember(() => {
        return new ${componentClassImplName}()
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
}

class JavaComponentFileVisitor implements ComponentFileVisitor {
    private readonly results: ComponentPrintResult[] = []

    constructor(
        private readonly library: PeerLibrary,
        private readonly file: PeerFile,
    ) { }

    visit(): PrinterResult[] {
        // this.file.peersToGenerate.forEach(peer => this.printComponent(peer))
        return []
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

            const attributesFinishSignature = new MethodSignature(IDLVoidType, [])
            const applyAttributesFinish = 'applyAttributesFinish'
            writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.writeMethodCall('super', applyAttributesFinish, [])
            })

            const applyAttributesSignature = new MethodSignature(IDLVoidType, [])
            const applyAttributes = 'applyAttributes'
            writer.writeMethodImplementation(new Method(applyAttributes, applyAttributesSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.writeMethodCall('super', applyAttributes, [])
                writer.writeStatement(writer.makeStatement(writer.makeString(`throw new RuntimeException("not implemented")`)))
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

    printComponents(): PrinterResult[] {
        const result: PrinterResult[] = []
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
            result.push(...visitor.visit())
        }
        return result
    }
}

export function printComponents(peerLibrary: PeerLibrary): PrinterResult[] {
    // TODO: support other output languages
    if (![Language.TS, Language.ARKTS, Language.JAVA].includes(peerLibrary.language))
        return []

    return new ComponentsVisitor(peerLibrary).printComponents()
}
