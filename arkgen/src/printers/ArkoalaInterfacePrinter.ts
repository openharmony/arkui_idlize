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
import { allowNamedOverloads, collapseIdlPeerMethods, collectPeers, componentToStyleClass, findComponentByDeclaration, findComponentByName, groupOverloads, isComponentDeclaration, KotlinInterfacesVisitor, PrinterFunction } from "@idlizer/libohos"
import { ArkTSInterfacesVisitor, CJInterfacesVisitor, InterfacesVisitor, JavaInterfacesVisitor, TSDeclConvertor, TSInterfacesVisitor } from "@idlizer/libohos"
import { capitalize, DeclarationConvertor, getSuper, indentedBy, Language, LanguageWriter, Method, MethodModifier, NamedMethodSignature, PeerClass, PeerLibrary, PeerMethodSignature, ReferenceResolver, stringOrNone } from "@idlizer/core"
import { generateAttributeModifierSignature } from "./ComponentsPrinter"
import { componentToAttributesInterface, generateStyleParentClass } from "./PeersPrinter"

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

class ArkoalaTSDeclConvertor extends TSDeclConvertor {
    protected printComponent(idlInterface: idl.IDLInterface): stringOrNone[] {
        const component = findComponentByDeclaration(this.peerLibrary, idlInterface)
        if (idlInterface !== component?.attributeDeclaration)
            return []
        const peer = collectPeers(this.peerLibrary).find(it => it.componentName === component.name)
        if (!peer) throw new Error(`Peer for component ${component.name} was not found`)
        const printer = this.peerLibrary.createLanguageWriter()
        const declaredPrefix = this.isDeclared && this.peerLibrary.language !== Language.ARKTS ? "declare " : ""
        const superType = getSuper(idlInterface, this.peerLibrary)
        const extendsClause = superType ? `extends ${componentToAttributesInterface(superType.name)} ` : ""
        printer.print(`export ${declaredPrefix}interface ${componentToAttributesInterface(idlInterface.name)} ${extendsClause}{`)
        printer.pushIndent()
        // const filteredMethods = peer!.methods
        //     .filter(it => !it.isCallSignature)
        const filteredMethods = peer!.methods
        const collapsedMethods = groupOverloads(filteredMethods, this.peerLibrary.language)
            .map(group => collapseIdlPeerMethods(this.peerLibrary, group))
        const parentMethods = collectParentsPropertiesNames(idlInterface, this.peerLibrary)
        // generate __get__commonStyles__Internal

        if (idlInterface.name === 'CommonMethod') {
            const getCommonStyleMethod = new Method(
                '__get__commonStyles__Internal',
                new NamedMethodSignature(idl.IDLArrayFuncORUndefined, [], []),
                []
            )
            printer.writeMethodImplementation(getCommonStyleMethod, w => {
                w.print('return undefined;');
            })
            const isCustomComponentMethod = new Method(
                '__is_CustomComponent__Internal',
                new NamedMethodSignature(idl.IDLBooleanType, [], []),
                []
            )
            printer.writeMethodImplementation(isCustomComponentMethod, w => {
                w.print('return false;');
            })
        }

        collapsedMethods.forEach(method => {
            if (this.peerLibrary.language === Language.ARKTS && !parentMethods.has(method.method.name)) {
                const nonPublic = new Method(
                    method.uniqueOverloadName,
                    method.method.signature,
                    method.method.modifiers?.filter(it => it !== MethodModifier.PUBLIC)
                )
                if (idlInterface.name === 'CommonMethod') {
                    printer.writeMethodImplementation(nonPublic, w => {
                        w.print('const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();');
                        w.print('if (commonStyle) {');
                        w.pushIndent();
                        const paramNames = method.sig.args.map(arg => arg.name).join(', ');
                        //const paramNames = nonPublic.signature.argNames.length > 0 ? nonPublic.signature.argNames.join(', ') : '';
                        w.print(`(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => instance.${nonPublic.name}(${paramNames}));`);
                        w.print('return this;');
                        w.popIndent();
                        w.print('} else {');
                        w.pushIndent();
                        w.print('if (this.__is_CustomComponent__Internal()) {');
                        w.pushIndent();
                        w.writeStatement(w.makeThrowError(`Common method '${nonPublic.name}' can only be set when creating a custom component.`))
                        w.popIndent();
                        w.print('}');
                        w.popIndent();
                        w.print('}');
                        w.writeStatement(w.makeThrowError(`Unimplemented method ${nonPublic.name}`))
                    })
                } else {
                    printer.writeMethodImplementation(nonPublic, w => w.writeStatement(w.makeThrowError(`Unimplemented method ${nonPublic.name}`)))
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
            printer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature), w => {
                w.writeStatement(w.makeThrowError(`Unimplemented method attributeModifier`))
            })
        } else {
            printer.writeMethodDeclaration('attributeModifier', attributeModifierSignature)
        }
        // {
        //     const callableMethods = peer.methods.filter(it => it.isCallSignature)[0]
        //     const methodName = `set${capitalize(peer.componentName)}Options`
        //     printer.writeMethod
        // }
        
        printer.popIndent()
        printer.print('}')
        const stylePrinter = this.peerLibrary.createLanguageWriter()
        const parentStyle = generateStyleParentClass(peer)
        stylePrinter.writeClass(componentToStyleClass(idlInterface.name), (writer) => {
            for (const field of peer.attributesFields) {
                writer.writeFieldDeclaration(
                    field.name + "_value",
                    field.type,
                    [],
                    true
                )
            }
            collapsedMethods.forEach(method => {
                // TODO: temporary hack
                stylePrinter.writeMethodImplementation(method.method, (writer) => {
                    if (method.method.signature.returnType == idl.IDLThisType) {
                        writer.writeStatement(writer.makeReturn(writer.makeThis()))
                    }
                })
            })
            stylePrinter.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                writer.writeStatement(writer.makeThrowError("Not implemented"))
            })
        }, parentStyle, [componentToAttributesInterface(idlInterface.name)])
        return printer.getOutput().concat(stylePrinter.getOutput())
    }
    private printNamedOverloadGroup(peer: PeerClass, printer: LanguageWriter): void {
        const overloads = new Map<string, string[]>()
        for (const method of peer.methods) {
            // if (method.isCallSignature) continue
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
        return [
            ...this.printExtendedAttributes(method),
            annotations ? indentedBy(annotations, 1) : undefined,
            indentedBy(`${staticPrefix}${method.name}${this.printTypeParameters(method.typeParameters)}(${this.printParameters(method.parameters)}): ${this.convertType(method.returnType)}`, 1)
        ]
    }
}

class ArkoalaArkTSInterfacesVisitor extends ArkTSInterfacesVisitor {
    protected override getDeclConvertor(writer: LanguageWriter, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new ArkoalaArkTSDeclConvertor(writer, library, isDeclared)
    }
}

function getVisitor(peerLibrary: PeerLibrary, isDeclarations: boolean): InterfacesVisitor {
    if (peerLibrary.language == Language.TS) {
        return new ArkoalaTSInterfacesVisitor(peerLibrary, true)
    }
    if (peerLibrary.language == Language.JAVA) {
        return new JavaInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.ARKTS) {
        return new ArkoalaArkTSInterfacesVisitor(peerLibrary, isDeclarations, true)
    }
    if (peerLibrary.language == Language.CJ) {
        return new CJInterfacesVisitor(peerLibrary)
    }
    if (peerLibrary.language == Language.KOTLIN) {
        return new KotlinInterfacesVisitor(peerLibrary)
    }
    throw new Error(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function createInterfacePrinter(isDeclarations: boolean): PrinterFunction {
    return (library: PeerLibrary) => getVisitor(library, isDeclarations).printInterfaces()
}
