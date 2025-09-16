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
    createReferenceType, IDLVoidType,
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
    componentToStyleClass,
    allowNamedOverloads,
    peerGeneratorConfiguration,
} from '@idlizer/libohos'
import { getReferenceTo } from '../knownReferences'
import { componentToAttributesInterface } from './PeersPrinter'
import { HandwrittenModule } from '../ArkoalaLayout'

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

export function generateAttributeModifierSignature(library: PeerLibrary, component: IdlComponentDeclaration): MethodSignature {
    const modifiers = expandComponentWithSupers(library, component.attributeDeclaration).map(it =>
        idl.createReferenceType(getReferenceTo('AttributeModifier'),
            [idl.createReferenceType(component.attributeDeclaration)],
        )
    )
    return new NamedMethodSignature(
        idl.IDLThisType,
        [idl.createUnionType([...modifiers, idl.IDLUndefinedType])],
        // [idl.createOptionalType(modifiers.length > 1 ? idl.createUnionType(modifiers) : modifiers[0])],
        ['value']
    )
}

class ComponentPrintResult {
    constructor(public targetFile: TargetFile, public writer: LanguageWriter) { }
}

interface ComponentFileVisitor {
    visit(): PrinterResult[]
}

class TSLikeComponentFileVisitor implements ComponentFileVisitor {

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
            result.push(...this.printComponentFunctions(peer))
        })
        return result
    }

    private printImports(peer: PeerClass, component:IdlComponentDeclaration): ImportsCollector {
        const imports = new ImportsCollector()
        imports.addFeatures(['int32', 'float32'], '@koalaui/common')
        imports.addFeatures(["KStringPtr", "KBoolean"], "@koalaui/interop")
        collectDeclItself(this.library, idl.createReferenceType(getReferenceTo('AttributeModifier')), imports)
        collectDeclItself(this.library, idl.createReferenceType(getReferenceTo('AttributeUpdater')), imports)
        if (!this.options.isDeclared) {
            imports.addFeature("RuntimeType", "@koalaui/interop")
            if (this.library.language === Language.ARKTS) {
                imports.addFeatures(["NodeAttach"], "^arkui.stateManagement.memo.node")
                imports.addFeatures(["remember"], "^arkui.stateManagement.memo.remember")
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

                imports.addFeatures([
                    componentToStyleClass(parentComponent.attributeDeclaration.name),
                    componentToAttributesInterface(parentComponent.attributeDeclaration.name),
                ], `./${parentGeneratedPath}`)
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
                    this.overloadsPrinter(printer).printGroupedComponentOverloads(peer.originalClassName!, grouped)
                // todo stub until we can process AttributeModifier
                writer.writeMethodImplementation(new Method('attributeModifier', generateAttributeModifierSignature(this.library, component), [MethodModifier.PUBLIC]), writer => {
                    writer.writeStatement(writer.makeReturn(writer.makeThis()))
                })

                const attributesFinishSignature = new MethodSignature(IDLVoidType, [])
                const applyAttributesFinish = 'applyAttributesFinish'
                writer.writeMethodImplementation(new Method(applyAttributesFinish, attributesFinishSignature, [MethodModifier.PUBLIC]), (writer) => {
                    writer.print('// we call this function outside of class, so need to make it public')
                    writer.writeMethodCall('super', applyAttributesFinish, [])
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
            const collapsedCallables = allowsOverloads(this.library.language)
                ? callableMethods.map(it => it.method)
                : callableMethods.length > 0
                    ? [collapseSameNamedMethods(callableMethods.map(it => it.method))]
                    : []
            collapsedCallables.forEach((callableMethod, callableIndex) => {
                const mappedCallableParams = callableMethod?.signature.args.map((it, index) => `${callableMethod.signature.argName(index)}${callableMethod.signature.isArgOptional(index) ? "?" : ""}: ${printer.getNodeName(it)}`)
                const mappedCallableParamsValues = callableMethod?.signature.args.map((_, index) => callableMethod.signature.argName(index))
                const callableName = allowNamedOverloads(this.library.language) ? callableMethods[callableIndex].uniqueOverloadName : callableMethod.name
                const callableInvocation = callableMethod?.name ? `receiver.${callableName}(${mappedCallableParamsValues})` : ""
                const peerClassName = componentToPeerClass(peer.componentName)
                if (!collectComponents(this.library).find(it => it.name === component.name)?.interfaceDeclaration)
                    return [{
                        collector: this.printImports(peer, component),
                        content: printer,
                        over: {
                            node: component.attributeDeclaration,
                            role: LayoutNodeRole.COMPONENT,
                            hint: 'component.function'
                        }
                    }]
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
                    .replaceAll("%PEER_CALLABLE_INVOKE%", callableInvocation))
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
        if (!this.options.isDeclared)
            imports.addFeature('TypeChecker', '#components')
        if (this.library.useMemoM3) {
            imports.addFeatures(['memo', 'memo_stable'], '@koalaui/runtime/annotations')
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
                    this.overloadsPrinter(printer).printGroupedComponentOverloads(peer.originalClassName!, [grouped])
                // todo stub until we can process AttributeModifier
                if (isCommonMethod(peer.originalClassName!) || peer.originalClassName == "ContainerSpanAttribute")
                    writer.print(`public func attributeModifier(modifier: AttributeModifier<Object>) { throw Exception("not implemented") }`)

                const attributesFinishSignature = new MethodSignature(IDLVoidType, [])
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

    private overloadsPrinter(printer:LanguageWriter) {
        return new OverloadsPrinter(this.library, printer, this.library.language, true, this.library.useMemoM3)
    }

    visit(): PrinterResult[] {
        const result: PrinterResult[] = []
        collectPeersForFile(this.library, this.file).forEach(peer => {
            // if (!this.options.isDeclared)
            //     result.push(...this.printComponent(peer))
            // result.push(...this.printComponentFunction(peer))
        })
        return result
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
            else if (this.language == Language.CJ) {
                visitor = new CJComponentFileVisitor(this.peerLibrary, file, this.options)
            }
            else if (this.language == Language.KOTLIN) {
                visitor = new KotlinComponentFileVisitor(this.peerLibrary, file, this.options)
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
    return new ComponentsVisitor(peerLibrary, { isDeclared: false }).printComponents()
}

export function printComponentsDeclarations(peerLibrary: PeerLibrary): PrinterResult[] {
    // TODO: support other output languages
    if (![Language.TS, Language.ARKTS].includes(peerLibrary.language))
        return []

    return new ComponentsVisitor(peerLibrary, { isDeclared: true }).printComponents()
}
