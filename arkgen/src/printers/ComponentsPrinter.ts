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
    LanguageWriter, PeerClass, PeerLibrary,
    createReferenceType, IDLVoidType, isOptionalType,
    Method,
    MethodSignature,
    MethodModifier,
    NamedMethodSignature,
    LayoutNodeRole,
    FieldModifier
} from '@idlizer/core'
import {
    ARKOALA_PACKAGE,
    ARKOALA_PACKAGE_PATH,
    collapseIdlPeerMethods,
    collapseSameNamedMethods,
    collectComponents,
    collectDeclDependencies,
    collectJavaImports,
    collectPeersForFile,
    COMPONENT_BASE,
    componentToAttributesClass,
    componentToInterface,
    componentToPeerClass,
    componentToStyleClass,
    findComponentByName,
    findComponentByType,
    generateAttributesParentClass,
    generateInterfaceParentInterface,
    generateStyleParentClass,
    groupOverloads,
    IdlComponentDeclaration,
    ImportsCollector,
    OverloadsPrinter,
    peerGeneratorConfiguration,
    PrinterResult,
    printJavaImports,
    readLangTemplate,
    TargetFile,
} from '@idlizer/libohos'
import { ArkoalaPeerLibrary } from '../ArkoalaPeerLibrary'

export function generateArkComponentName(component: string) {
    return `Ark${component}Component`
}

class ComponentPrintResult {
    constructor(public targetFile: TargetFile, public writer: LanguageWriter) { }
}

interface ComponentFileVisitor {
    visit(): PrinterResult[]
}

class TSComponentFileVisitor implements ComponentFileVisitor {

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
        protected readonly options: {
            isDeclared: boolean,
        }
    ) { }

    private overloadsPrinter(printer:LanguageWriter) {
        return new OverloadsPrinter(this.library, printer, this.library.language, true, this.library.useMemoM3)
    }

    visit(): PrinterResult[] {
        const result: PrinterResult[] = []
        collectPeersForFile(this.library, this.file).forEach(peer => {
            if (!this.options.isDeclared)
                result.push(...this.printComponent(peer))
            result.push(...this.printComponentFunction(peer))
        })
        return result
    }

    private printImports(peer: PeerClass, component:IdlComponentDeclaration): ImportsCollector {
        const imports = new ImportsCollector()
        imports.addFeatures(['int32', 'float32'], '@koalaui/common')
        imports.addFeatures(["KStringPtr", "KBoolean"], "@koalaui/interop")
        if (!this.options.isDeclared) {
            imports.addFeatures(["RuntimeType", "runtimeType"], "@koalaui/interop")
            imports.addFeatures(["NodeAttach", "remember"], "@koalaui/runtime")
            imports.addFeature('ComponentBase', '../ComponentBase')
            if (this.library.language === Language.TS) {
                imports.addFeature("isInstanceOf", "@koalaui/interop")
                imports.addFeatures(["isResource", "isPadding"], "../utils")
            }

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
                    const parentStyleClass = generateStyleParentClass(peer)
                    if (parentStyleClass)
                        imports.addFeature(parentStyleClass, `./${parentGeneratedPath}`)
                    const parentInterface = generateInterfaceParentInterface(peer)
                    if (parentInterface)
                        imports.addFeature(parentInterface, `./${parentGeneratedPath}`)
                }
            }
            imports.addFeature(componentToPeerClass(peer.componentName), this.library.layout.resolve({node: component.attributeDeclaration, role: LayoutNodeRole.PEER}))
        }
        this.populateImports(imports)

        collectDeclDependencies(this.library, component.attributeDeclaration, imports)
        if (component.interfaceDeclaration)
            collectDeclDependencies(this.library, component.interfaceDeclaration, imports)
        return imports
    }

    protected populateImports(imports: ImportsCollector) {
        if (!this.options.isDeclared)
            imports.addFeature('unsafeCast', '@koalaui/common')
    }

    protected printAttributes(peer: PeerClass, printer: LanguageWriter) {
        const parentAttributes = generateAttributesParentClass(peer)
        const parentStyle = generateStyleParentClass(peer)
        printer.writeInterface(componentToStyleClass(peer.componentName), (writer) => {
            for (const field of peer.attributesFields) {
                writer.writeMethodDeclaration(
                    field.name, new MethodSignature(idl.IDLVoidType, [field.type]))
            }

        }, parentStyle ? [parentStyle] : undefined)
        printer.writeClass(componentToAttributesClass(peer.componentName), (writer) => {
            for (const field of peer.attributesFields) {
                writer.writeFieldDeclaration(
                    field.name + "_value",
                    field.type,
                    [],
                    true
                )
            }
            for (const field of peer.attributesFields) {
                writer.writeMethodImplementation(
                    new Method(field.name, new MethodSignature(idl.IDLVoidType, [field.type])), (writer) => {
                        writer.writeStatement(writer.makeAssign(`this.${field.name}_value`, undefined,
                            writer.makeString(`arg0`), false))
                    })
            }
        }, parentAttributes, [componentToStyleClass(peer.componentName)])
    }

    memoStable(): string {
        return this.library.useMemoM3 ? `@memo_stable` : `/** @memo:stable */`
    }

    memo(): string {
        return this.library.useMemoM3 ? `@memo` : `/** @memo */`
    }

    private printComponent(peer: PeerClass): PrinterResult[] {

        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!

        const imports = this.printImports(peer, component)
        const printer = this.library.createLanguageWriter()

        const componentClassName = generateArkComponentName(peer.componentName)
        const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
        const peerClassName = componentToPeerClass(peer.componentName)

        this.printAttributes(peer, printer)

        printer.print(this.memoStable())
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
            const filteredMethods = peer.methods.filter(it =>
                !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, this.library.language))
            for (const grouped of groupOverloads(filteredMethods))
                this.overloadsPrinter(printer).printGroupedComponentOverloads(peer, grouped)
            // todo stub until we can process AttributeModifier
            if (isCommonMethod(peer.originalClassName!) || peer.originalClassName == "ContainerSpanAttribute")
                writer.print(`attributeModifier(modifier: AttributeModifier<object>): this { throw new Error("not implemented") }`)

            const attributesFinishSignature = new MethodSignature(IDLVoidType, [])
            const applyAttributesFinish = 'applyAttributesFinish'
            writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                writer.print('// we call this function outside of class, so need to make it public')
                writer.writeMethodCall('super', applyAttributesFinish, [])
            })

            const peerAttrbiutesType = idl.createReferenceType(componentToAttributesClass(peer.componentName))
            const applyAttributesSignature = new MethodSignature(IDLVoidType, [peerAttrbiutesType], undefined, undefined, ["attrs"])
            const applyAttributes = 'applyAttributes'
            writer.print(this.memo())
            writer.writeMethodImplementation(new Method(applyAttributes, applyAttributesSignature, [MethodModifier.PUBLIC]), (writer) => {
                for (const field of peer.attributesFields) {
                    if (peerGeneratorConfiguration().ignoreMethod(field.name, this.library.language)) {
                        continue
                    }
                    writer.writeStatement(
                        writer.makeCondition(
                            writer.makeDefinedCheck(`attrs.${field.name}_value`),
                            writer.makeStatement(
                                writer.makeMethodCall('this', field.name, [
                                    writer.makeString(`attrs.${field.name}_value!`)
                                ])
                            )
                        )
                    )
                }
                writer.writeMethodCall('super', applyAttributes, ['attrs'])
            })
        }, parentComponentClassName, [peer.originalClassName!])

        return [{
            collector: imports,
            content: printer,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.implementation'
            }
        }]
    }

    protected printComponentFunction(peer: PeerClass): PrinterResult[] {
        const printer = this.library.createLanguageWriter()
        const component = findComponentByName(this.library, peer.componentName)!
        const componentInterfaceName = peer.originalClassName!
        const componentClassImplName = generateArkComponentName(peer.componentName)
        const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
        const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
        const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${isOptionalType(it) ? "?" : ""}: ${printer.getNodeName(it)}`)
        const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
        const callableInvocation = callableMethod?.name ? `receiver.${callableMethod?.name}(${mappedCallableParamsValues})` : ""
        const peerClassName = componentToPeerClass(peer.componentName)
        if (!collectComponents(this.library).find(it => it.name === component.name)?.interfaceDeclaration)
            return []
        const declaredPostrix = this.options.isDeclared ? "decl_" : ""
        const stagePostfix = this.library.useMemoM3 ? "m3" : "m1"
        printer.writeLines(readLangTemplate(`component_builder_${declaredPostrix}${stagePostfix}`, this.library.language)
            .replaceAll("%COMPONENT_NAME%", component.name)
            .replaceAll("%COMPONENT_ATTRIBUTE_NAME%", componentInterfaceName)
            .replaceAll("%FUNCTION_PARAMETERS%", mappedCallableParams?.map(it => it + ", ")?.join("") ?? "")
            .replaceAll("%COMPONENT_CLASS_NAME%", componentClassImplName)
            .replaceAll("%PEER_CLASS_NAME%", peerClassName)
            .replaceAll("%PEER_CALLABLE_INVOKE%", callableInvocation))
        return [{
            collector: this.printImports(peer, component),
            content: printer,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.function'
            }
        }]
    }
}

class ArkTsComponentFileVisitor extends TSComponentFileVisitor {
    protected populateImports(imports: ImportsCollector) {
        if (!this.options.isDeclared)
            imports.addFeature('TypeChecker', '#components')
        if (this.library.useMemoM3) {
            imports.addFeatures(['memo', 'memo_stable'], '@koalaui/runtime/annotations')
            imports.addFeatures(['BuilderLambda'], '@koalaui/builderLambda')
        }
    }
}

class JavaComponentFileVisitor implements ComponentFileVisitor {
    private readonly results: ComponentPrintResult[] = []

    constructor(
        private readonly library: PeerLibrary,
        private readonly file: idl.IDLFile,
    ) { }

    visit(): PrinterResult[] {
        collectPeersForFile(this.library, this.file).forEach(peer => this.printComponent(peer))
        return []
    }
    getComponentResults(): ComponentPrintResult[] {
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
        private options: {
            isDeclared: boolean
        }
    ) { }

    printComponents(): PrinterResult[] {
        const result: PrinterResult[] = []
        for (const file of this.peerLibrary.files.values()) {
            if (!collectPeersForFile(this.peerLibrary, file).length)
                continue
            let visitor: ComponentFileVisitor
            if (this.language == Language.TS) {
                visitor = new TSComponentFileVisitor(this.peerLibrary, file, this.options)
            }
            else if (this.language == Language.ARKTS) {
                visitor = new ArkTsComponentFileVisitor(this.peerLibrary, file, this.options)
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

    return new ComponentsVisitor(peerLibrary, { isDeclared: false }).printComponents()
}

export function printComponentsDeclarations(peerLibrary: PeerLibrary): PrinterResult[] {
    // TODO: support other output languages
    if (![Language.TS, Language.ARKTS, Language.JAVA].includes(peerLibrary.language))
        return []

    return new ComponentsVisitor(peerLibrary, { isDeclared: true }).printComponents()
}
