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

import * as idl from "@idlizer/core/idl"
import { allowNamedOverloads, collapseIdlPeerMethods, collectPeers, findComponentByDeclaration, findComponentByName, groupOverloads, isComponentDeclaration, KotlinDeclarationConvertor, KotlinInterfacesVisitor, peerGeneratorConfiguration, PrinterFunction } from "@idlizer/libohos"
import { ArkTSInterfacesVisitor, CJInterfacesVisitor, InterfacesVisitor, TSDeclConvertor, TSInterfacesVisitor } from "@idlizer/libohos"
import { DeclarationConvertor, getExtendableClassNames, getSuper, indentedBy, isExtendableComponent, isMethodOverridden, Language, LanguageWriter, LayoutNodeRole, maybeRestoreThrows, Method, MethodModifier, MethodSignature, NamedMethodSignature, PeerClass, PeerLibrary, ReferenceResolver, stringOrNone } from "@idlizer/core"
import { generateAttributeModifierSignature } from "./ComponentsPrinter.js"
import { componentToAttributesInterface, isPropertyBasedMethodOverridden } from "./PeersPrinter.js"

function collectParentsPropertiesNames(int: idl.IDLInterface, resolver: ReferenceResolver): Set<string> {
    const result = new Set<string>()
    function go(int: idl.IDLInterface) {
        int.inheritance.forEach(parent => {
            const found = resolver.resolveTypeReference(parent)
            if (found && idl.isInterface(found)) {
                found.properties.forEach(prop => {
                    result.add(prop.name)
                })
                go(found)
            }
        })
    }

    go(int)
    return result
}

function collectInheritedMethodNames(int: idl.IDLInterface, resolver: ReferenceResolver): Set<string> {
    const result = new Set<string>()
    function go(int: idl.IDLInterface) {
        int.inheritance.forEach(parent => {
            const found = resolver.resolveTypeReference(parent)
            if (found && idl.isInterface(found)) {
                found.methods.forEach(method => {
                    result.add(method.name)
                })
                go(found)
            }
        })
    }

    go(int)
    return result
}

class ArkoalaTSDeclConvertor extends TSDeclConvertor {
    protected printComponent(idlInterface: idl.IDLInterface): stringOrNone[] {
        const component = findComponentByDeclaration(this.peerLibrary, idlInterface)
        if (idlInterface !== component?.attributeDeclaration)
            return []
        const peer = collectPeers(this.peerLibrary).find(it => it.componentName === component.name)
        if (!peer) throw new Error(`Peer for component ${component.name} was not found`)
        const printer = this.peerLibrary.createLanguageWriter()
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        const declaredPrefix = this.isDeclared && this.peerLibrary.language !== Language.ARKTS ? "declare " : ""
        const superType = getSuper(idlInterface, this.peerLibrary)
        const extendsClause = superType ? `extends ${nameConvertor.convert(superType)} ` : ""
        printer.print(`export ${declaredPrefix}interface ${componentToAttributesInterface(idlInterface.name)} ${extendsClause}{`)
        printer.pushIndent()
        const collapsedMethods = groupOverloads(peer!.methods, this.peerLibrary.language)
            .map(group => collapseIdlPeerMethods(this.peerLibrary, group))
        const parentMembers = collectParentsPropertiesNames(idlInterface, this.peerLibrary)
        const isCommon = idlInterface.name === 'CommonMethod'
        const isExtendable = isExtendableComponent(component.name)
        const parentMethods = collectParentsPropertiesNames(idlInterface, this.peerLibrary)
        if (peerGeneratorConfiguration().GenerateCommonMethodHack && isCommon) {
            printer.writeLines(`
__get__commonStyles__Internal(): Array<(instance: CommonMethod) => void> | undefined {
    return undefined;
}
__is_CustomComponent__Internal(): boolean {
    return false;
    }
`)
        }
        collapsedMethods.forEach(method => {
            if (this.peerLibrary.language === Language.ARKTS && !parentMembers.has(method.method.name)) {
                const nonPublic = new Method(
                    method.uniqueOverloadName,
                    method.method.signature,
                    method.method.modifiers?.filter(it => it !== MethodModifier.PUBLIC)
                )
                if (peerGeneratorConfiguration().GenerateCommonMethodHack && (isCommon || isExtendable)) {
                    printer.writeMethodImplementation(nonPublic, w => {
                        w.print('const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();');
                        w.print('if (commonStyle) {');
                        w.pushIndent();
                        const paramNames = method.sig.args.map(arg => arg.name).join(', ');
                        if (isCommon) {
                            w.print(`(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => instance.${nonPublic.name}(${paramNames}));`);
                        } else {
                            w.print(`(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => (instance as ${idlInterface.name}).${nonPublic.name}(${paramNames}));`);
                        }
                        w.print('return this;');
                        w.popIndent();
                        w.print('} else {');
                        w.pushIndent();
                        w.print('if (this.__is_CustomComponent__Internal()) {');
                        w.pushIndent();
                        if (isCommon) {
                            w.writeStatement(w.makeThrowError(`Common method ${nonPublic.name} can only be set when creating a custom component.`))
                        } else {
                            w.writeStatement(w.makeThrowError(`${component.name} attribute ${nonPublic.name} can only be set when creating an extendable component.`))
                        }
                        w.popIndent();
                        w.print('}');
                        w.popIndent();
                        w.print('}');
                        w.writeStatement(w.makeThrowError(`Unimplemented method ${nonPublic.name}`))
                    })
                } else {
                    printer.writeMethodImplementation(nonPublic, w => {
                        w.writeStatement(w.makeThrowError(`Unimplemented method ${method.method.name}`))
                    })
                }
            } else {
                printer.writeMethodDeclaration(method.method.name, method.method.signature)
            }
        })
        if (allowNamedOverloads(this.peerLibrary.language)) {
            this.printNamedOverloadGroup(peer, printer)
        }
        const attributeModifierSignature = generateAttributeModifierSignature(this.peerLibrary, component)
        if (this.peerLibrary.language === Language.ARKTS && !parentMethods.has('attributeModifier')) {
            if (peerGeneratorConfiguration().GenerateCommonMethodHack && isCommon) {
                // CommonMethod: skip, handled in main loop
            } else if (peerGeneratorConfiguration().GenerateCommonMethodHack && isExtendable) {
                printer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature), w => {
                    w.print('const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();');
                    w.print('if (commonStyle) {');
                    w.pushIndent();
                    w.print('(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => (instance as ' + idlInterface.name + ').attributeModifier(value));');
                    w.print('return this;');
                    w.popIndent();
                    w.print('} else {');
                    w.pushIndent();
                    w.print('if (this.__is_CustomComponent__Internal()) {');
                    w.pushIndent();
                    w.writeStatement(w.makeThrowError(`${component.name} attribute attributeModifier can only be set when creating an extendable component.`))
                    w.popIndent();
                    w.print('}');
                    w.popIndent();
                    w.print('}');
                    w.writeStatement(w.makeThrowError(`Unimplemented method attributeModifier`))
                })
            } else {
                printer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature), w => {
                    w.writeStatement(w.makeThrowError(`Unimplemented method attributeModifier`))
                })
            }
        } else {
            printer.writeMethodDeclaration('attributeModifier', attributeModifierSignature)
        }
        const applyAttributesFinishSignature = new MethodSignature(idl.createPrimitiveType('void'), [])
        if (this.peerLibrary.language === Language.ARKTS) {
            if (isCommon) {
                printer.writeMethodImplementation(new Method('applyAttributesFinish', applyAttributesFinishSignature), () => {})
            }
        }
        else {
            printer.writeMethodDeclaration('applyAttributesFinish', applyAttributesFinishSignature)
        }
        printer.popIndent()
        printer.print('}')

        // Task 4: Generate ExtendableCommonMethod base class for CommonMethod
        if (peerGeneratorConfiguration().GenerateCommonMethodHack && isCommon) {
            printer.writeLines(`
export abstract class ExtendableCommonMethod implements CommonMethod {
    private __styles_Internal = new Array<(instance: CommonMethod) => void>();

    public __get__commonStyles__Internal(): Array<(instance: CommonMethod) => void> | undefined {
        return this.__styles_Internal;
    }
    
    public __set__commonStyles__Internal(styles: Array<(instance: CommonMethod) => void>): void {
        this.__styles_Internal = styles;
    }

    public __is_CustomComponent__Internal(): boolean {
        return true;
    }
}`)
        }

        // Task 5: Generate ExtendableXXX class for extendable components
        if (peerGeneratorConfiguration().GenerateCommonMethodHack && isExtendable) {
            const commonMethodDecl = this.peerLibrary.files
                .flatMap(f => f.entries)
                .find(e => idl.isInterface(e) && e.name === 'CommonMethod')
            if (commonMethodDecl) {
                const commonModule = this.peerLibrary.layout.resolve({
                    node: commonMethodDecl,
                    role: LayoutNodeRole.INTERFACE
                })
                this.writer.addFeature('ExtendableCommonMethod', `${commonModule}`)
            }
            printer.print('')
            this.printExtendableClass(printer, component, peer, idlInterface)
        }

        return printer.getOutput()
    }
    private printExtendableClass(
        printer: LanguageWriter,
        component: { name: string; attributeDeclaration: idl.IDLInterface; interfaceDeclaration?: idl.IDLInterface },
        peer: PeerClass,
        idlInterface: idl.IDLInterface
    ): void {
        const className = `Extendable${component.name}`
        const attrInterfaceName = component.attributeDeclaration.name

        printer.print(`export abstract class ${className} extends ExtendableCommonMethod implements ${attrInterfaceName} {`)
        printer.pushIndent()

        const hasContent = this.componentHasContentParam(component)
        this.printInstantiateImpl(printer, component, className, hasContent)
        this.printInstantiateOverloads(printer, component, className)

        // Find setXXXOptions methods from the ExtendableXXX IDL class declaration
        const extendableClassDecl = this.findExtendableClassDeclaration(className)
        if (extendableClassDecl) {
            this.printSetOptionsMethodsFromIDL(printer, component, attrInterfaceName, extendableClassDecl)
        }

        printer.popIndent()
        printer.print('}')
    }

    private findExtendableClassDeclaration(className: string): idl.IDLInterface | undefined {
        for (const file of this.peerLibrary.files) {
            for (const entry of file.entries) {
                if (idl.isInterface(entry) && entry.name === className) {
                    return entry
                }
            }
        }
        return undefined
    }

    private componentHasContentParam(
        component: { name: string; interfaceDeclaration?: idl.IDLInterface }
    ): boolean {
        if (!component.interfaceDeclaration) return false
        const callables = component.interfaceDeclaration.callables ?? []
        return callables.some(c =>
            c.parameters.some(p => p.name === 'content_')
        )
    }

    private printInstantiateImpl(
        printer: LanguageWriter,
        component: { name: string },
        className: string,
        hasContent: boolean
    ): void {
        const implName = `${component.name}Impl`
        printer.print('@memo')
        printer.print(`static _instantiateImpl<T extends ${className}>(`)
        printer.pushIndent()
        printer.print('@memo @memo_skip')
        printer.print('styles: (instance: T) => void,')
        if (hasContent) {
            printer.print('factory: () => T,')
            printer.print('@memo @memo_skip')
            printer.print('_content: CustomBuilder): void')
        } else {
            printer.print('factory: () => T): void')
        }
        printer.popIndent()
        printer.print('{')
        printer.pushIndent()
        printer.print('const instanceExtendable = remember(factory);')
        printer.print('@memo @memo_skip')
        printer.print(`const cb = (instance: ${component.name}Attribute): void => {`)
        printer.pushIndent()
        printer.print('styles(instanceExtendable);')
        printer.print('let commonStyles = instanceExtendable.__get__commonStyles__Internal()')
        printer.print('if (commonStyles) {')
        printer.pushIndent()
        printer.print('commonStyles.forEach((func) => {')
        printer.pushIndent()
        printer.print('func(instance);')
        printer.popIndent()
        printer.print('})')
        printer.popIndent()
        printer.print('}')
        printer.print('instanceExtendable.__set__commonStyles__Internal(new Array<(instance: CommonMethod) => void>);')
        printer.popIndent()
        printer.print('}')
        if (hasContent) {
            printer.print(`${implName}(`)
            printer.pushIndent()
            printer.print('cb,')
            printer.print('_content')
            printer.popIndent()
            printer.print(');')
        } else {
            printer.print(`${implName}(cb);`)
        }
        printer.popIndent()
        printer.print('}')
    }

    private printInstantiateOverloads(
        printer: LanguageWriter,
        component: { name: string; interfaceDeclaration?: idl.IDLInterface },
        className: string
    ): void {
        if (!component.interfaceDeclaration) return

        // Get call signatures from the interface declaration
        const callables = component.interfaceDeclaration.callables ?? []
        for (const callable of callables) {
            printer.print('')
            printer.print('@ComponentBuilder')
            const params = callable.parameters
                .map(p => {
                    const optional = p.isOptional ? '?' : ''
                    const typeStr = this.convertType(p.type)
                    return `${p.name}${optional}: ${typeStr}`
                })
                .join(', ')
            printer.print(`static $_instantiate<T extends ${className}>(factory: () => T${params ? ', ' + params : ''}): T {`)
            printer.pushIndent()
            printer.print('throw Error("Illegal call of $_instantiate")')
            printer.popIndent()
            printer.print('}')
        }
    }

    private printSetOptionsMethodsFromIDL(
        printer: LanguageWriter,
        component: { name: string },
        attrInterfaceName: string,
        extendableClassDecl: idl.IDLInterface
    ): void {
        const setOptionsName = `set${component.name}Options`
        const setOptionsMethods = extendableClassDecl.methods
            .filter(m => m.name === setOptionsName)

        for (const method of setOptionsMethods) {
            printer.print('')
            const params = method.parameters
                .map(p => {
                    const optional = p.isOptional ? '?' : ''
                    const typeStr = this.convertType(p.type)
                    return `${p.name}${optional}: ${typeStr}`
                })
                .join(', ')
            printer.print(`${setOptionsName}(${params}): this {`)
            printer.pushIndent()
            printer.print('const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();')
            printer.print('if (commonStyle) {')
            printer.pushIndent()
            printer.print('(commonStyle as Array<(instance: CommonMethod) => void>).push(')
            const argNames = method.parameters.map(p => p.name).join(', ')
            printer.pushIndent()
            printer.print(`(instance: CommonMethod): void => (instance as ${attrInterfaceName}).${setOptionsName}(${argNames})`)
            printer.popIndent()
            printer.print(');')
            printer.print('return this;')
            printer.popIndent()
            printer.print('} else {')
            printer.pushIndent()
            printer.print('if (this.__is_CustomComponent__Internal()) {')
            printer.pushIndent()
            printer.print(`throw new Error("${component.name} attribute '${setOptionsName}' can only be set when creating an extendable component.")`)
            printer.popIndent()
            printer.print('}')
            printer.popIndent()
            printer.print('}')
            printer.print(`throw new Error('Unimplemented method ${setOptionsName}')`)
            printer.popIndent()
            printer.print('}')
        }
    }

    private printNamedOverloadGroup(peer: PeerClass, printer: LanguageWriter): void {
        const overloads = new Map<string, string[]>()
        for (const method of peer.methods) {
            if (method.uniqueOverloadName != method.method.name) {
                if (!overloads.has(method.method.name))
                    overloads.set(method.method.name, [])
                overloads.get(method.method.name)!.push(method.uniqueOverloadName)
            }
        }
        for (const [name, mangledNames] of overloads.entries()) {
            printer.print(`overload ${name} { ${mangledNames.join(", ")} }`)
        }
    }
    convertInterface(node: idl.IDLInterface) {
        if (isComponentDeclaration(this.peerLibrary, node)) {
            this.writer.writeLines(this.printComponent(node).join("\n"))
            return
        }
        if (getExtendableClassNames().has(node.name)) {
            return
        }
        if (node.name === 'ExtendableCommonMethod') {
            return
        }
        return super.convertInterface(node)
    }
}

class ArkoalaTSInterfacesVisitor extends TSInterfacesVisitor {
    protected override getDeclConvertor(writer: LanguageWriter, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new ArkoalaTSDeclConvertor(writer, library, isDeclared)
    }
}

class ArkoalaArkTSDeclConvertor extends ArkoalaTSDeclConvertor {
    protected printMethod(method: idl.IDLMethod): stringOrNone[] {
        const staticPrefix = method.isStatic ? "static " : ""
        const annotations = this.printAnnotations(method)
        const typeParametersDefaults = idl.getExtAttributeTypesValue(method, idl.IDLExtendedAttributes.TypeParametersDefaults)
        return [
            ...this.printExtendedAttributes(method),
            annotations ? indentedBy(annotations, 1) : undefined,
            indentedBy(`${staticPrefix}${method.name}${this.printTypeParameters(method.typeParameters, typeParametersDefaults)}(${this.printParameters(method.parameters)}): ${this.convertType(method.returnType)}`, 1)
        ]
    }
}

class ArkoalaArkTSInterfacesVisitor extends ArkTSInterfacesVisitor {
    protected override getDeclConvertor(writer: LanguageWriter, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new ArkoalaArkTSDeclConvertor(writer, library, isDeclared)
    }
}

class ArkoalaKotlinDeclarationConvertor extends KotlinDeclarationConvertor {
    protected printComponent(idlInterface: idl.IDLInterface): stringOrNone[] {
        const component = findComponentByDeclaration(this.peerLibrary, idlInterface)
        if (idlInterface !== component?.attributeDeclaration)
            return []
        const peer = collectPeers(this.peerLibrary).find(it => it.componentName === component.name)
        if (!peer) throw new Error(`Peer for component ${component.name} was not found`)

        const printer = this.peerLibrary.createLanguageWriter()
        const componentInterface = peer.originalClassName!
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        const superType = getSuper(idlInterface, this.peerLibrary)
        printer.writeInterface(componentInterface, writer => {
            for (const peerMethod of peer.methods) {
                const peerSig = peerMethod.method.signature as NamedMethodSignature
                const restoredReturnType = maybeRestoreThrows(peerSig.returnType, this.peerLibrary)
                const returnType = idl.isPrimitiveType(peerSig.returnType, 'this') || (restoredReturnType && idl.isPrimitiveType(restoredReturnType, 'this'))
                    ? idl.createReferenceType(peer.decl)
                    : peerSig.returnType
                const componentMethodSignature = new NamedMethodSignature(returnType, peerSig.args, peerSig.argsNames,
                    peerSig.defaults, peerSig.argsModifiers, peerSig.printHints)
                const modifiers = (isMethodOverridden(idlInterface, peerMethod.method, this.peerLibrary)
                    || isPropertyBasedMethodOverridden(idlInterface, peerMethod.method.name, this.peerLibrary))
                    ? [MethodModifier.OVERRIDE] : []
                writer.writeMethodDeclaration(peerMethod.method.name, componentMethodSignature, modifiers)
            }
        }, superType ? [nameConvertor.convert(superType)] : undefined)
        return printer.getOutput()
    }
    convertInterface(node: idl.IDLInterface) {
        if (isComponentDeclaration(this.peerLibrary, node)) {
            this.writer.writeLines(this.printComponent(node).join("\n"))
            return
        }
        return super.convertInterface(node)
    }
}

class ArkoalaKotlinInterfacesVisitor extends KotlinInterfacesVisitor {
    protected override getDeclConvertor(writer: LanguageWriter, library: PeerLibrary): KotlinDeclarationConvertor {
        return new ArkoalaKotlinDeclarationConvertor(writer, library)
    }
}

function getVisitor(peerLibrary: PeerLibrary, isDeclarations: boolean): InterfacesVisitor {
    if (peerLibrary.language == Language.TS) {
        return new ArkoalaTSInterfacesVisitor(peerLibrary, true)
    }
    if (peerLibrary.language == Language.ARKTS) {
        return new ArkoalaArkTSInterfacesVisitor(peerLibrary, isDeclarations, true)
    }
    if (peerLibrary.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.KOTLIN) {
        return new ArkoalaKotlinInterfacesVisitor(peerLibrary, true)
    }
    throw new Error(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function createInterfacePrinter(isDeclarations: boolean): PrinterFunction {
    return (library: PeerLibrary) => getVisitor(library, isDeclarations).printInterfaces()
}
