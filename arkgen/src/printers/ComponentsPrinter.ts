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
import {
    Language, isCommonMethod,
    LanguageWriter, PeerClass, PeerLibrary,
    createReferenceType,
    Method,
    MethodSignature,
    MethodModifier,
    NamedMethodSignature,
    LayoutNodeRole,
    getSuper
} from '@idlizer/core'
import {
    allowsOverloads,
    collapseSameNamedMethods,
    collectComponents,
    collectDeclDependencies,
    collectPeersForFile,
    componentToPeerClass,
    findComponentByName,
    findComponentByType,
    groupOverloads,
    IdlComponentDeclaration,
    ImportsCollector,
    OverloadsPrinter,
    PrinterResult,
    readLangTemplate,
    TargetFile,
    collectDeclItself,
    findComponentByDeclaration,
    allowNamedOverloads,
    peerGeneratorConfiguration,
    PrinterFunction,
    extractContentParameter,
} from '@idlizer/libohos'
import { getReferenceTo } from '../knownReferences.js'
import { componentToAttributesInterface } from './PeersPrinter.js'
import { HandwrittenModule } from '../ArkoalaLayout.js'

export function shiftIfIsNotEmpty(line:string): string {
    if (line.length > 0) {
        return '    ' + line
    }
    return ""
}

export function generateArkComponentName(component: string) {
    return `Ark${component}Component`
}

export function expandComponentWithSupers(library: PeerLibrary, decl: idl.IDLInterface): idl.IDLInterface[] {
    const result: idl.IDLInterface[] = []
    while (decl) {
        const superResolved = getSuper(decl, library)
        result.push(decl)
        decl = superResolved as idl.IDLInterface
    }
    return result
}

export function generateAttributeModifierSignature(library: PeerLibrary, component: IdlComponentDeclaration): NamedMethodSignature {
    const modifiers = expandComponentWithSupers(library, component.attributeDeclaration).map(it =>
        idl.createReferenceType(getReferenceTo('AttributeModifier'),
            [idl.createReferenceType(it)],
        )
    )
    return new NamedMethodSignature(
        idl.createPrimitiveType('this'),
        [idl.createUnionType([...modifiers, idl.createPrimitiveType('undefined')])],
        // [idl.createOptionalType(modifiers.length > 1 ? idl.createUnionType(modifiers) : modifiers[0])],
        ['value']
    )
}

interface ComponentFileVisitor {
    visit(): PrinterResult[]
}

interface GlobalComponentVisitor {
    addFile(file: idl.IDLFile): void
    visit(): PrinterResult[]
}

class TSLikeComponentFileVisitor implements ComponentFileVisitor {

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
        protected readonly options: {
            isDeclared: boolean,
            attributeModifierHooks: boolean,
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
            result.push(...this.printComponentFunctions(peer))
        })
        return result
    }

    private printImports(peer: PeerClass, component: IdlComponentDeclaration): ImportsCollector {
        const imports = new ImportsCollector()
        imports.addFeatures(['int32', 'float32'], '@koalaui/common')
        imports.addFeatures(["KStringPtr", "KBoolean"], "@koalaui/interop")
        if (this.options.attributeModifierHooks)
            imports.addFeature(`hook${component.name}AttributeModifier`, HandwrittenModule(this.library.language))
        collectDeclItself(this.library, idl.createReferenceType(getReferenceTo('AttributeModifier')), imports)
        collectDeclItself(this.library, idl.createReferenceType(getReferenceTo('AttributeUpdater')), imports)
        if (!this.options.isDeclared) {
            imports.addFeature("RuntimeType", "@koalaui/interop")
            if (this.library.language === Language.ARKTS) {
                imports.addFeatures(["NodeAttach"], "^arkui.incremental.runtime.memo.node")
                imports.addFeatures(["remember"], "^arkui.incremental.runtime.memo.remember")
            } else {
                imports.addFeatures(["NodeAttach", "remember"], "@koalaui/runtime")
            }
            imports.addFeature('ComponentBase', './ComponentBase')
            if (this.library.language === Language.TS) {
                imports.addFeature("isInstanceOf", "@koalaui/interop")
            }
            imports.addFeature(componentToPeerClass(peer.componentName), this.library.layout.resolve({node: component.attributeDeclaration, role: LayoutNodeRole.PEER}))
        }
        if (peer.originalParentFilename) {
            let [parentRef] = component.attributeDeclaration.inheritance
            let parentDecl = this.library.resolveTypeReference(parentRef)
            while (parentDecl) {
                const parentComponent = findComponentByDeclaration(this.library, parentDecl as idl.IDLInterface)!
                const parentGeneratedPath = this.library.layout.resolve({
                    node: parentDecl,
                    role: LayoutNodeRole.COMPONENT
                })
                if (!this.options.isDeclared)
                    imports.addFeature(generateArkComponentName(parentComponent.name), `./${parentGeneratedPath}`)

                if (parentComponent.attributeDeclaration.inheritance.length) {
                    let [parentRef] = parentComponent.attributeDeclaration.inheritance
                    parentDecl = this.library.resolveTypeReference(parentRef)
                } else {
                    parentDecl = undefined
                }
            }
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

    private printComponent(peer: PeerClass): PrinterResult[] {
        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
        const generate = () => {
            const imports = this.printImports(peer, component)
            const printer = this.library.createLanguageWriter()

            const componentClassName = generateArkComponentName(peer.componentName)
            const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
            const peerClassName = componentToPeerClass(peer.componentName)

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
                for (const grouped of groupOverloads(peer.methods, this.library.language))
                    this.overloadsPrinter(printer).printGroupedComponentOverloads(peer.originalClassName!, grouped, peer.decl)
                // todo stub until we can process AttributeModifier
                const attributeModifierSignature = generateAttributeModifierSignature(this.library, component)
                attributeModifierSignature.args.forEach(it => {
                    collectDeclDependencies(this.library, it, imports)
                })
                if (this.options.attributeModifierHooks) {
                    writer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                        imports.addFeature(`ModifierStateManager`, HandwrittenModule(this.library.language))
                        writer.print('ModifierStateManager.INSTANCE.scope(() => {')
                        writer.pushIndent()
                        writer.print(`hook${component.name}AttributeModifier(this, value);`)
                        writer.popIndent()
                        writer.print('})')
                        writer.writeStatement(writer.makeReturn(writer.makeThis()))
                    })
                }

                const attributesFinishSignature = new MethodSignature(idl.createPrimitiveType('void'), [])
                const applyAttributesFinish = 'applyAttributesFinish'
                writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                    writer.print('// we call this function outside of class, so need to make it public')
                    writer.writeMethodCall('super', applyAttributesFinish, [])
                })
                const optionsFinishSignature = new MethodSignature(
                    idl.createPrimitiveType('void'),
                    [idl.createPrimitiveType('String')],
                    undefined,
                    undefined,
                    undefined,
                    ['traceName']
                )
                const applyOptionsFinish = 'applyOptionsFinish'
                writer.writeMethodImplementation(new Method(applyOptionsFinish, optionsFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                    writer.writeMethodCall('super', applyOptionsFinish, ['traceName'])
                })
            }, parentComponentClassName, [componentToAttributesInterface(peer.originalClassName!)])
            return {
                content: printer,
                imports
            }
        }

        return [{
            generate,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.implementation'
            }
        }]
    }

    protected printComponentFunctions(peer: PeerClass): PrinterResult[] {
        if (peerGeneratorConfiguration().isHandWritten(peer.componentName))
            return []
        const component = findComponentByName(this.library, peer.componentName)!
        const generate = () => {
            const printer = this.library.createLanguageWriter()
            const componentInterfaceName = componentToAttributesInterface(peer.originalClassName!)
            const componentClassImplName = generateArkComponentName(peer.componentName)
            const callableMethods = peer.methods.filter(it => it.isCallSignature)
            let collapsedCallables = allowsOverloads(this.library.language)
                ? callableMethods.map(it => it.method)
                : callableMethods.length > 0
                    ? [collapseSameNamedMethods(callableMethods.map(it => it.method))]
                    : []
            if (collapsedCallables.length > 1 && [Language.TS, Language.ARKTS].includes(this.library.language))
                collapsedCallables = [collapsedCallables[0]]
            // for ArkTS we must control: every builder function must be printed once, because it is only includes `style` and `content_` arguments
            const printedBuildersTags = new Set<string>()
            const testPrintedBuilderTag = (tag: string) => {
                if (printedBuildersTags.has(tag))
                    return false
                printedBuildersTags.add(tag)
                return true
            }
            collapsedCallables.forEach((callableMethod, callableIndex) => {
                const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${callableMethod.signature.isArgOptional(index) ? "?" : ""}: ${printer.getNodeName(it)}`)
                const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
                const callableName = allowNamedOverloads(this.library.language) ? callableMethods[callableIndex].uniqueOverloadName : callableMethod.name
                const { hasContentParameter } = extractContentParameter(callableMethods[callableIndex].decl as idl.IDLCallable)
                const contentParameter = hasContentParameter
                    ? `\n    @memo @memo_skip\n    content_?: () => void,`
                    : ""
                const contentParameterInvocation = hasContentParameter
                    ? `\n        content_?.()`
                    : ""
                const callableInvocation = callableMethod?.name ? `receiver.${callableName}(${mappedCallableParamsValues})` : ""
                const peerClassName = componentToPeerClass(peer.componentName)
                let printedBuilderTag = `${callableIndex}`
                if (this.library.language === Language.ARKTS) {
                    printedBuilderTag = `hasContentParameter=${hasContentParameter}`
                }
                if (!collectComponents(this.library).find(it => it.name === component.name)?.interfaceDeclaration || !testPrintedBuilderTag(printedBuilderTag))
                    return
                const declaredPostrix = this.options.isDeclared ? "decl_" : ""
                const stagePostfix = this.library.useMemoM3 ? "m3" : "m1"
                let paramsList = mappedCallableParams?.join(", ")
                if (paramsList) paramsList += ","
                const builderFunctionName = allowNamedOverloads(this.library.language)
                    ? peer.componentBuilderInfos.find(it => it.peerMethodName === callableMethods[callableIndex].sig.name)!.uniqueOverloadName
                    : component.name
                printer.writeLines(readLangTemplate(`component_builder_${declaredPostrix}${stagePostfix}`, this.library.language)
                    .replaceAll("%COMPONENT_NAME%", builderFunctionName)
                    .replaceAll("%COMPONENT_ATTRIBUTE_NAME%", componentInterfaceName)
                    .replaceAll("%FUNCTION_PARAMETERS%", shiftIfIsNotEmpty(paramsList ?? ""))
                    .replaceAll("%COMPONENT_CLASS_NAME%", componentClassImplName)
                    .replaceAll("%PEER_CLASS_NAME%", peerClassName)
                    .replaceAll("%PEER_CALLABLE_INVOKE%", callableInvocation)
                    .replaceAll("%CONTENT_PARAMETER%", contentParameter)
                    .replaceAll("%CONTENT_PARAMETER_INVOCATION%", contentParameterInvocation))
            })
            if (allowNamedOverloads(this.library.language) && collapsedCallables.length > 1) {
                const overloads = peer.componentBuilderInfos.map(it => it.uniqueOverloadName).filter(it => it !== component.name)
                if (overloads.length > 0)
                    printer.print(`overload ${component.name} { ${overloads.join(", ")} }`)
            }
            return { content: printer, imports: this.printImports(peer, component) }
        }
        return [{
            generate,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.function'
            }
        }]
    }
}

class TSComponentFileVisitor extends TSLikeComponentFileVisitor {
    protected populateImports(imports: ImportsCollector): void {
        if (this.options.isDeclared) {
            imports.addFeature("runtimeType", "@koalaui/interop")
        }
    }
}

class ArkTsComponentFileVisitor extends TSLikeComponentFileVisitor {
    protected populateImports(imports: ImportsCollector) {
        if (this.library.useMemoM3) {
            imports.addFeatures(['memo', 'memo_stable', 'memo_skip'], '^arkui.incremental.annotation')
            imports.addFeatures(['ComponentBuilder'], '@koalaui/builderLambda')
        }
    }
}

class CJComponentFileVisitor implements ComponentFileVisitor {

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
        return imports
    }

    private printComponent(peer: PeerClass): PrinterResult[] {
        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
        const generate = () => {
            const imports = this.printImports(peer, component)
            const printer = this.library.createLanguageWriter()

            const componentClassName = generateArkComponentName(peer.componentName)
            const parentComponentClassName = peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`
            const peerClassName = componentToPeerClass(peer.componentName)


            printer.writeClass(componentClassName, (writer) => {
                writer.writeMethodImplementation(
                    new Method('getPeer',
                        new MethodSignature(createReferenceType(peerClassName), []
                        ), [MethodModifier.PROTECTED], []),
                    writer => {
                        writer.print('if (let Some(peer) <- this.peer) {')
                        writer.pushIndent()
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeCast(
                                    writer.makeString("peer"),
                                    createReferenceType(peerClassName),
                                    { optional: true }
                                )
                            )
                        )
                        writer.popIndent()
                        writer.print('} else { throw Exception()}')
                    }
                )
                // for (const grouped of groupOverloads(filteredMethods))
                for (const grouped of peer.methods)
                    this.overloadsPrinter(printer).printGroupedComponentOverloads(peer.originalClassName!, [grouped], peer.decl)
                // todo stub until we can process AttributeModifier
                if (isCommonMethod(peer.originalClassName!) || peer.originalClassName == "ContainerSpanAttribute")
                    writer.print(`public func attributeModifier(modifier: AttributeModifier<Object>) { throw Exception("not implemented") }`)

                const attributesFinishSignature = new MethodSignature(idl.createPrimitiveType('void'), [])
                const applyAttributesFinish = 'applyAttributesFinish'
                writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                    writer.print('// we call this function outside of class, so need to make it public')
                    writer.writeMethodCall('super', applyAttributesFinish, [])
                })
            }, parentComponentClassName, [`${peer.originalClassName!}Interfaces`])
            return { content: printer, imports}
        }
        return [{
            generate,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.implementation'
            }
        }]
    }

    protected printComponentFunction(peer: PeerClass): PrinterResult[] {
        const component = findComponentByName(this.library, peer.componentName)!
        if (!collectComponents(this.library).find(it => it.name === component.name)?.interfaceDeclaration)
            return []
        const generate = () => {
            const printer = this.library.createLanguageWriter()
            const componentInterfaceName = componentToAttributesInterface(peer.originalClassName!)
            const componentClassImplName = generateArkComponentName(peer.componentName)
            const callableMethods = peer.methods.filter(it => it.isCallSignature).map(it => it.method)
            const callableMethod = callableMethods.length ? collapseSameNamedMethods(callableMethods) : undefined
            const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}: ${printer.getNodeName(it)}`)
            const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
            const callableInvocation = callableMethod?.name ? `receiver.${callableMethod?.name}(${mappedCallableParamsValues})` : ""
            const peerClassName = componentToPeerClass(peer.componentName)
            const declaredPostrix = this.options.isDeclared ? "decl_" : ""
            const stagePostfix = this.library.useMemoM3 ? "m3" : "m1"
            let paramsList = mappedCallableParams?.join(", ")
            printer.writeLines(readLangTemplate(`component_builder_${declaredPostrix}${stagePostfix}`, this.library.language)
                .replaceAll("%COMPONENT_NAME%", component.name)
                .replaceAll("%COMPONENT_ATTRIBUTE_NAME%", componentInterfaceName)
                .replaceAll("%FUNCTION_PARAMETERS%", shiftIfIsNotEmpty(paramsList ? `,\n${paramsList}`: ""))
                .replaceAll("%COMPONENT_CLASS_NAME%", componentClassImplName)
                .replaceAll("%PEER_CLASS_NAME%", peerClassName)
                .replaceAll("%PEER_CALLABLE_INVOKE%", callableInvocation))
            return { content: printer, imports: this.printImports(peer, component)}
        }
        return [{
            generate,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.function'
            }
        }]
    }
}

class KotlinComponentFileVisitor implements ComponentFileVisitor {

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
        protected readonly options: {
            isDeclared: boolean,
        }
    ) { }

    visit(): PrinterResult[] {
        const result: PrinterResult[] = []
        collectPeersForFile(this.library, this.file).forEach(peer => {
            result.push(...this.printComponent(peer))
        })
        return result
    }

    private overloadsPrinter(printer: LanguageWriter) {
        return new OverloadsPrinter(this.library, printer, this.library.language, true, false)
    }

    private printImports(peer: PeerClass, component: IdlComponentDeclaration): ImportsCollector {
        const imports = new ImportsCollector()
        imports.addFeature("ComponentBase", "koalaui.arkoala")
        imports.addFeature(componentToPeerClass(peer.componentName), this.library.layout.resolve({node: component.attributeDeclaration, role: LayoutNodeRole.PEER}))
        if (peer.originalParentFilename) {
            let [parentRef] = component.attributeDeclaration.inheritance
            let parentDecl = this.library.resolveTypeReference(parentRef)
            while (parentDecl) {
                const parentComponent = findComponentByDeclaration(this.library, parentDecl as idl.IDLInterface)!
                const parentPackage = this.library.layout.resolve({
                    node: parentDecl,
                    role: LayoutNodeRole.COMPONENT
                })
                if (!this.options.isDeclared)
                    imports.addFeature(generateArkComponentName(parentComponent.name), parentPackage)

                if (parentComponent.attributeDeclaration.inheritance.length) {
                    let [parentRef] = parentComponent.attributeDeclaration.inheritance
                    parentDecl = this.library.resolveTypeReference(parentRef)
                } else {
                    parentDecl = undefined
                }
            }
        }

        return imports
    }

    private printComponent(peer: PeerClass): PrinterResult[] {
        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
        const generate = () => {
            const imports = this.printImports(peer, component)
            const printer = this.library.createLanguageWriter()

            const componentClassName = generateArkComponentName(peer.componentName)
            const componentInterface = peer.originalClassName!
            const parentComponentClassName = (peer.parentComponentName ? generateArkComponentName(peer.parentComponentName!) : `ComponentBase`) + "()"
            const peerClassName = componentToPeerClass(peer.componentName)
            const modifiers = [MethodModifier.PUBLIC, MethodModifier.OVERRIDE, MethodModifier.OPEN]

            printer.writeClass(componentClassName, (writer) => {
                writer.writePrefixedBlock("init", writer => writer.writeStatement(
                    writer.makeAssign("peer", undefined, writer.makeMethodCall(peerClassName, "create", [writer.makeThis()]), false)
                ))

                writer.writeMethodImplementation(
                    new Method("getPeer",
                        new MethodSignature(createReferenceType(peerClassName), []
                        ), modifiers, []),
                    writer => writer.writeStatement(
                        writer.makeReturn(
                            writer.makeCast(
                                writer.makeFieldAccess("this", "peer"),
                                createReferenceType(peerClassName),
                            )
                        )
                    )
                )

                for (const peerMethod of peer.methods) {
                    this.overloadsPrinter(printer).printGroupedComponentOverloads(peer.originalClassName!, [peerMethod], peer.decl)
                }

                const attributesFinishSignature = new MethodSignature(idl.createPrimitiveType('void'), [])
                const applyAttributesFinish = "applyAttributesFinish"
                writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, modifiers), (writer) => {
                    writer.writeMethodCall("super", applyAttributesFinish, [])
                })

                const applyOptionsFinishSignature = new NamedMethodSignature(idl.createPrimitiveType('void'), [idl.createPrimitiveType('String')], ["traceName"])
                const applyOptionsFinish = "applyOptionsFinish"
                writer.writeMethodImplementation(new Method(applyOptionsFinish, applyOptionsFinishSignature, modifiers), (writer) => {
                    writer.writeMethodCall("super", applyOptionsFinish, [applyOptionsFinishSignature.argName(0)])
                })
            }, parentComponentClassName, [componentInterface])
            return { content: printer, imports }
        }
        return [{
            generate,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.implementation'
            }
        }]
    }
}

class EmptyGlobalComponentVisitor implements GlobalComponentVisitor {
    addFile(file: idl.IDLFile): void {}
    visit(): PrinterResult[] {
        return []
    }
}

class KotlinGlobalComponentVisitor implements GlobalComponentVisitor {
    private readonly peers: PeerClass[] = []

    constructor(private readonly library: PeerLibrary) {}

    addFile(file: idl.IDLFile): void {
        this.peers.push(...collectPeersForFile(this.library, file))
    }

    visit(): PrinterResult[] {
        if (this.peers.length === 0) {
            return []
        }

        const generateFunctions = () => {
            const printer = this.library.createLanguageWriter()
            const imports = this.printImports()
            this.peers.forEach(peer => {
                printer.writeLines(readLangTemplate(`component_builder_function`, this.library.language)
                    .replaceAll("%COMPONENT_NAME%", peer.componentName)
                    .replaceAll("%COMPONENT_INTERFACE%", peer.originalClassName!))
            })
            printer.writeLines(readLangTemplate(`component_builder_class_prologue`, this.library.language))
            printer.pushIndent()
            this.peers.forEach(peer => {
                printer.writeLines(readLangTemplate(`component_builder_class_method`, this.library.language)
                    .replaceAll("%COMPONENT_NAME%", peer.componentName)
                    .replaceAll("%COMPONENT_INTERFACE%", peer.originalClassName!))
            })
            printer.popIndent()
            printer.writeLines(readLangTemplate(`component_builder_class_epilogue`, this.library.language))
            return { content: printer, imports }
        }

        const firstComponent = findComponentByName(this.library, this.peers[0].componentName)!
        return [{
            generate: generateFunctions,
            over: {
                node: firstComponent.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.function'
            }
        }]
    }

    private printImports(): ImportsCollector {
        const imports = new ImportsCollector()
        imports.addFeature("ComponentBase", "koalaui.arkoala")
        this.peers.forEach(peer => {
            const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
            const module = this.library.layout.resolve({node: component.attributeDeclaration, role: LayoutNodeRole.PEER})
            imports.addFeature(component.attributeDeclaration.name, module)
            imports.addFeature(generateArkComponentName(peer.componentName), module)
        })
        return imports
    }
}

class ComponentsVisitor {
    readonly components: Map<TargetFile, LanguageWriter> = new Map()
    private readonly language = this.peerLibrary.language

    constructor(
        private readonly peerLibrary: PeerLibrary,
        private options: {
            isDeclared: boolean,
            attributeModifierHooks: boolean,
        }
    ) { }

    printComponents(): PrinterResult[] {
        const result: PrinterResult[] = []
        const globalVisitor = this.getGlobalVisitor()
        for (const file of this.peerLibrary.files.values()) {
            if (!collectPeersForFile(this.peerLibrary, file).length)
                continue
            globalVisitor.addFile(file)
            const visitor = this.getFileVisitor(file)
            result.push(...visitor.visit())
        }
        result.push(...globalVisitor.visit())
        return result
    }

    private getGlobalVisitor(): GlobalComponentVisitor {
        if (this.language == Language.KOTLIN) {
            return new KotlinGlobalComponentVisitor(this.peerLibrary)
        }
        return new EmptyGlobalComponentVisitor()

    }

    private getFileVisitor(file: idl.IDLFile): ComponentFileVisitor {
        if (this.language == Language.TS) {
            return new TSComponentFileVisitor(this.peerLibrary, file, this.options)
        }
        else if (this.language == Language.ARKTS) {
            return new ArkTsComponentFileVisitor(this.peerLibrary, file, this.options)
        }
        else if (this.language == Language.CJ) {
            return new CJComponentFileVisitor(this.peerLibrary, file, this.options)
        }
        else if (this.language == Language.KOTLIN) {
            return new KotlinComponentFileVisitor(this.peerLibrary, file, this.options)
        }
        throw new Error(`ComponentsVisitor not implemented for ${this.language.toString()}`)
    }
}

export function createComponentsPrinter(options: { attributeModifierHooks: boolean }): PrinterFunction {
    return (peerLibrary) => {
        const visitor = new ComponentsVisitor(peerLibrary, { isDeclared: false, attributeModifierHooks: options.attributeModifierHooks })
        return visitor.printComponents()
    }
}

export function printComponentsDeclarations(peerLibrary: PeerLibrary): PrinterResult[] {
    // Improve: support other output languages
    if (![Language.TS, Language.ARKTS].includes(peerLibrary.language))
        return []

    return new ComponentsVisitor(peerLibrary, { isDeclared: true, attributeModifierHooks: false }).printComponents()
}
