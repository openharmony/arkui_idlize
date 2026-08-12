/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
import { collectDeclDependencies, collectExtendableComponents, ExtendableComponentInfo, findComponentByName,
    getSuperComponent, IdlComponentDeclaration, PrinterResult, readLangTemplate } from "@idlizer/libohos"
import { ImportsCollector, Language, LayoutNodeRole, Method, MethodModifier, MethodSignature, PeerLibrary,
    LanguageWriter, LayoutTargetDescription} from "@idlizer/core"
import { generateAttributeModifierSignature } from "./ComponentsPrinter.js"

class ExtendableComponentPrinter {
    className: string
    parentComponent: IdlComponentDeclaration | undefined
    parentClassName: string
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly extComponent: ExtendableComponentInfo,
        protected readonly component: IdlComponentDeclaration,
        protected readonly parentExtendable: ExtendableComponentInfo | undefined,
        protected readonly baseComponent: IdlComponentDeclaration
    ) {
        this.className = this.getClassName(this.extComponent)
        if (parentExtendable !== undefined)
            this.parentComponent = findComponentByName(library, parentExtendable.componentName)
        this.parentClassName = (parentExtendable === undefined) ? 'ExtendableComponentBase' :
            this.getClassName(parentExtendable)
    }

    private getClassName(componentInfo: ExtendableComponentInfo): string {
        return componentInfo.extendableComponent?.name ?? `Extendable${componentInfo.componentName}`
    }

    private printImports(): ImportsCollector {
        let imports = new ImportsCollector()
        if (this.extComponent.extendableComponent) {
            collectDeclDependencies(this.library, this.extComponent.extendableComponent, imports)
        }
        collectDeclDependencies(this.library, this.component.attributeDeclaration, imports)
        let parentLayoutNode = this.parentExtendable ?
            (this.parentExtendable.extendableComponent ??
                this.parentComponent?.attributeDeclaration ??
                this.baseComponent.attributeDeclaration) :
            this.baseComponent.attributeDeclaration
        const parentExtLayoutTarget: LayoutTargetDescription = {
            node: parentLayoutNode,
            role: LayoutNodeRole.COMPONENT,
            hint: 'component.extendable'
        }
        const compAttributeLayoutTarget: LayoutTargetDescription = {
            node: this.component.attributeDeclaration,
            role: LayoutNodeRole.COMPONENT
        }
        
        imports.addFeature(this.parentClassName, this.library.layout.resolve(parentExtLayoutTarget))
        imports.addFeature(this.component.attributeDeclaration.name,
            this.library.layout.resolve(compAttributeLayoutTarget))
        const attributeModifierSignature = generateAttributeModifierSignature(this.library, this.component)
            attributeModifierSignature.args.forEach(it => {
                collectDeclDependencies(this.library, it, imports)
        })
        return imports
    }

    public print(): PrinterResult | undefined {
        const generate = () => {
            const printer = this.library.createLanguageWriter()
            const isAbstract = (this.extComponent.extendableComponent === undefined) ||
                this.extComponent.extendableComponent.extendedAttributes?.find(
                    attr => attr.name == idl.IDLExtendedAttributes.Abstract) !== undefined
            printer.writeClass(this.className, writer => {
                if (this.parentExtendable === undefined) {
                    writer.print(`private __styles_Internal = new Array<(instance: ${this.baseComponent.attributeDeclaration.name}) => void>();`)

                    writer.print(
                        `public __get__commonStyles__Internal(): Array<(instance: ${this.baseComponent.attributeDeclaration.name}) => void> | undefined {`)
                    writer.pushIndent()
                    writer.print(`return this.__styles_Internal;`)
                    writer.popIndent()
                    writer.print(`}`)

                    writer.print(
                        `public __set__commonStyles__Internal(styles: Array<(instance: ${this.baseComponent.attributeDeclaration.name}) => void>): void {`)
                    writer.pushIndent()
                    writer.print(`this.__styles_Internal = styles;`)
                    writer.popIndent()
                    writer.print(`}`)
                }

                // Generate $_instantiate methods for each callable in the base component
                this.printInstantiateMethods(writer)
                this.printInstantiateImplMethod(writer)

                let componentMethods = this.extComponent.extendableComponent?.methods
                componentMethods?.push(...this.component.attributeDeclaration.methods)
                componentMethods?.filter(method => !method.isStatic).forEach(
                    method => this.printComponentMethod(writer, method)
                )
                const attributeModifierSignature = generateAttributeModifierSignature(this.library, this.component)
                writer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                    const argNames = attributeModifierSignature.argsNames?.join(', ') ?? ''
                    this.printComponentMethodImplementation(writer, 'attributeModifier', argNames)
                })
            }, this.parentClassName, [ this.component.attributeDeclaration.name ], undefined, undefined, isAbstract)

            return {
                imports: this.printImports(),
                content: printer
            }
        }
        return {
            over: {
                node: this.extComponent.extendableComponent ?? this.component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.extendable'
            },
            generate: generate
        }
    }

    private printComponentMethodImplementation(writer: LanguageWriter, methodName: string, argNames: string) {
        // Get the component name for error messages (e.g., "ButtonAttribute" -> "Button")
        const componentName = this.extComponent.componentName.replace(/Attribute$/, '')
        writer.pushIndent()
        writer.print(`const commonStyle: Array<(instance: ${this.baseComponent.attributeDeclaration.name}) => void> | undefined = this.__get__commonStyles__Internal();`)
        writer.print(`if (commonStyle) {`)
        writer.pushIndent()
        writer.print(`(commonStyle as Array<(instance: ${this.baseComponent.attributeDeclaration.name}) => void>).push(`)
        writer.pushIndent()
        writer.print(`(instance: ${this.baseComponent.attributeDeclaration.name}): void => (instance as ${this.component.attributeDeclaration.name}).${methodName}(${argNames})`)
        writer.popIndent()
        writer.print(`);`)
        writer.print(`return this;`)
        writer.popIndent()
        writer.print(`} else {`)
        writer.pushIndent()
        writer.print(`if (this.__is_CustomComponent__Internal()) {`)
        writer.pushIndent()
        writer.print(`throw new Error("${componentName} attribute '${methodName}' can only be set when creating an extendable component.")`)
        writer.popIndent()
        writer.print(`}`)
        writer.popIndent()
        writer.print(`}`)
        writer.print(`throw new Error('Unimplemented method ${methodName}')`)
        writer.popIndent()
    }

    private printComponentMethod(writer: LanguageWriter, method: idl.IDLMethod): void {
        const methodName = method.name
        const parameters = method.parameters.map(p => {
            const optional = p.isOptional ? '?' : ''
            const type = writer.getNodeName(p.type)
            return `${p.name}${optional}: ${type}`
        }).join(', ')

        // Build the argument list for the method call
        const argNames = method.parameters.map(p => p.name).join(', ')

        writer.print(`${methodName}(${parameters}): this {`)
        this.printComponentMethodImplementation(writer, methodName, argNames)
        writer.print(`}`)
    }

    private printInstantiateMethods(
        writer: LanguageWriter): void {
        if (!this.extComponent.extendableComponent?.methods.length) {
            return
        }
        const instMethods = this.extComponent.extendableComponent.methods.filter(
            method => method.name == '$_instantiate' && method.isStatic
        )

        for (const method of instMethods) {
            const paramStrings = method.parameters.map(
                p => `${p.name}${p.isOptional ? '?' : ''}: ${writer.getNodeName(p.type)}`
            )

            // Write the method signature directly as a string
            writer.writeLines(['@ComponentBuilder'])
            writer.print(`static $_instantiate<T extends ${this.className}>(${paramStrings.join(', ')}): T {`)
            writer.pushIndent()
            writer.writeStatement(writer.makeThrowError('Illegal call of $_instantiate'))
            writer.popIndent()
            writer.print('}')
        }
    }

    private printInstantiateImplMethod(
        writer: LanguageWriter
    ): void {
        if (!this.extComponent.extendableComponent?.methods.length) {
            return
        }
        const instImplMethod = this.extComponent.extendableComponent.methods.find(
            method => method.name == '_instantiateImpl' && method.isStatic
        )
        if (instImplMethod !== undefined) {
            const templateName = instImplMethod.parameters.at(-1)?.name === 'content_'
                ? 'extendable_component_instantiate_with_content'
                : 'extendable_component_instantiate'
            writer.writeLines(readLangTemplate(templateName, this.library.language)
                .replaceAll("%INTERFACE_NAME%", this.extComponent.extendableComponent.name)
                .replaceAll("%COMPONENT_ATTRIBUTE_NAME%", this.component.attributeDeclaration.name)
                .replaceAll("%BASE_COMPONENT_NAME%", this.baseComponent.attributeDeclaration.name)
                .replaceAll("%COMPONENT_NAME%", this.extComponent.componentName))
        }
    }
}

class ExtendableComponentVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly components: ExtendableComponentInfo[]
    ) { }

    visit(): PrinterResult[] {
        const result: PrinterResult[] = []
        const baseComponent = this.getBaseComponent()
        if (baseComponent === undefined)
            return []
        result.push(this.printBaseExtendableComponent(baseComponent))
        for (const extComponent of this.components) {
            const component = findComponentByName(this.library, extComponent.componentName)
            if (component === undefined) {
                continue
            }
            const parentComponent = getSuperComponent(this.library, extComponent.componentName)
            let parentExtendable: ExtendableComponentInfo | undefined = undefined
            if (parentComponent) {
                parentExtendable = this.components.find(comp => comp.componentName == parentComponent.name)
            }
            const printer = new ExtendableComponentPrinter(this.library, extComponent, component, parentExtendable, baseComponent)
            const extendableComponentContent = printer.print()
            if (extendableComponentContent)
                result.push(extendableComponentContent)
        }
        return result
    }

    private getBaseComponent(): IdlComponentDeclaration | undefined {
        if (this.components.length == 0) {
            return undefined
        }
        let firstComp = findComponentByName(this.library, this.components[0].componentName)
        while (firstComp) {
            const superComp = getSuperComponent(this.library, firstComp.name)
            if (superComp === undefined) {
                return firstComp
            }
            firstComp = superComp
        }
        return undefined
    }

    private printBaseExtendableComponent(baseComponent: IdlComponentDeclaration): PrinterResult {
        const generate = () => {
            const printer = this.library.createLanguageWriter()
            printer.writeClass('ExtendableComponentBase', writer => {
                writer.writeMethodImplementation(
                    new Method(
                        '__is_CustomComponent__Internal',
                        new MethodSignature(idl.createPrimitiveType('boolean'), []),
                        [ MethodModifier.PUBLIC ]),
                    writer => {
                        writer.writeStatement(writer.makeReturn(writer.makeString('true')))
                })
            })
            return {
                imports: new ImportsCollector(),
                content: printer
            }
        }
        return {
            over: {
                node: baseComponent.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.extendable'
            },
            generate: generate
        }
    }
}

export function printExtendableComponents(peerLibrary: PeerLibrary) {
    if (peerLibrary.language !== Language.ARKTS) {
            return []
        }
    const visitor = new ExtendableComponentVisitor(peerLibrary, collectExtendableComponents(peerLibrary))
    return visitor.visit()
}
