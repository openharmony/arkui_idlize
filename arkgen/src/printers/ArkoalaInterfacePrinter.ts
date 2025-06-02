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
import { collapseIdlPeerMethods, collectPeers, componentToAttributesInterface, componentToStyleClass, componentToUIAttributesInterface, findComponentByDeclaration, generateStyleParentClass, groupOverloads, isComponentDeclaration, peerGeneratorConfiguration, PrinterFunction } from "@idlizer/libohos"
import { ArkTSInterfacesVisitor, CJInterfacesVisitor, InterfacesVisitor, JavaInterfacesVisitor, TSDeclConvertor, TSInterfacesVisitor } from "@idlizer/libohos"
import { DeclarationConvertor, getSuper, indentedBy, isCommonMethod, Language, LanguageWriter, Method, MethodModifier, NamedMethodSignature, PeerLibrary, stringOrNone } from "@idlizer/core"
import { generateAttributeModifierSignature } from "./ComponentsPrinter"

class ArkoalaTSDeclConvertor extends TSDeclConvertor {
    protected printComponent(idlInterface: idl.IDLInterface): stringOrNone[] {
        const component = findComponentByDeclaration(this.peerLibrary, idlInterface)
        if (idlInterface !== component?.attributeDeclaration)
            return []
        const peer = collectPeers(this.peerLibrary).find(it => it.componentName === component.name)
        if (!peer) throw new Error(`Peer for component ${component.name} was not found`)
        const printer = this.peerLibrary.createLanguageWriter()
        const uiPrinter = this.peerLibrary.createLanguageWriter()
        const declaredPrefix = this.isDeclared ? "declare " : ""
        const superType = getSuper(idlInterface, this.peerLibrary)
        const extendsClause = superType ? `extends ${componentToAttributesInterface(superType.name)} ` : ""
        let UIExtendsClause = superType ? `extends ${componentToUIAttributesInterface(superType.name)} ` : ""
        if (isCommonMethod(idlInterface.name)) UIExtendsClause = `extends UICommonBase `
        printer.print(`export ${declaredPrefix}interface ${componentToAttributesInterface(idlInterface.name)} ${extendsClause}{`)
        uiPrinter.print(`export ${declaredPrefix}interface ${componentToUIAttributesInterface(idlInterface.name)} ${UIExtendsClause}{`)
        printer.pushIndent()
        uiPrinter.pushIndent()
        const filteredMethods = peer!.methods
            .filter(it => !peerGeneratorConfiguration().ignoreMethod(it.overloadedName, this.peerLibrary.language))
            .filter(it => !it.isCallSignature)
        groupOverloads(filteredMethods).forEach(group => {
            const method = collapseIdlPeerMethods(this.peerLibrary, group)
            printer.writeMethodDeclaration(method.method.name, method.method.signature)
            uiPrinter.print(this.peerLibrary.useMemoM3 ? `@memo` : `/** @memo */`)
            uiPrinter.writeMethodDeclaration(method.method.name, method.method.signature)
        })
        const attributeModifierSignature = generateAttributeModifierSignature(this.peerLibrary, component)
        printer.writeMethodDeclaration('attributeModifier', attributeModifierSignature)
        uiPrinter.print(this.peerLibrary.useMemoM3 ? `@memo` : `/** @memo */`)
        uiPrinter.writeMethodDeclaration('attributeModifier', attributeModifierSignature)
        printer.popIndent()
        uiPrinter.popIndent()
        printer.print('}')
        uiPrinter.print('}')
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
            groupOverloads(filteredMethods).forEach(group => {
                const method = collapseIdlPeerMethods(this.peerLibrary, group)
                const existInAttributes: boolean = peer.attributesFields.find(element => {
                    element.name == method.method.name
                }) !== undefined

                // TODO: temporary hack
                stylePrinter.writeMethodImplementation(method.method, (writer) => {
                    if (method.method.signature.returnType == idl.IDLThisType) {
                        if (existInAttributes) {
                            writer.writeStatement(
                                writer.makeAssign(
                                    `this.${method.method.name}_value`, undefined, writer.makeString('value'), false))
                        }
                        writer.writeStatement(writer.makeReturn(writer.makeThis()))
                    } else
                        writer.writeStatement(writer.makeThrowError("Unimplemented"))
                })
            })
            stylePrinter.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                writer.writeStatement(writer.makeThrowError("Not implemented"))
            })
            const target = 'target'
            const applySignature = new NamedMethodSignature(
                idl.IDLVoidType,
                [idl.createReferenceType(componentToUIAttributesInterface(component.attributeDeclaration.name))],
                [target]
            )
            writer.writeLines(this.peerLibrary.useMemoM3 ? `@memo` : `/** @memo */`)
            stylePrinter.writeMethodImplementation(new Method('apply', applySignature, [MethodModifier.PUBLIC]), writer => {
                const superDecl = getSuper(component.attributeDeclaration, this.peerLibrary)
                if (superDecl) {
                    writer.writeMethodCall('super','apply', [target])
                }
                for (const field of peer.attributesFields) {
                    if (field.name == 'attributeModifier') continue
                    writer.writeStatement(writer.makeCondition(
                        writer.makeString(`this.${field.name}_value !== undefined`),
                        writer.makeStatement(writer.makeMethodCall(target, field.name, [writer.makeString(`this.${field.name}_value!`)]))
                    ))
                }
            })
        }, parentStyle, [componentToAttributesInterface(idlInterface.name)])
        return printer.getOutput().concat(uiPrinter.getOutput()).concat(stylePrinter.getOutput())
    }
    convertInterface(node: idl.IDLInterface) {
        if (this.seenInterfaceNames.has(node.name)) {
            console.log(`interface name: '${node.name}' already exists`)
            return
        }
        if (isComponentDeclaration(this.peerLibrary, node)) {
            this.seenInterfaceNames.add(node.name)
            this.writer.writeLines(this.printComponent(node).join("\n"))
            return
        }
        return super.convertInterface(node)
    }
}

class ArkoalaTSInterfacesVisitor extends TSInterfacesVisitor {
    protected override getDeclConvertor(writer: LanguageWriter, seenNames: Set<string>, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new ArkoalaTSDeclConvertor(writer, seenNames, library, isDeclared)
    }
}

class ArkoalaArkTSDeclConvertor extends ArkoalaTSDeclConvertor {
    protected printMethod(method: idl.IDLMethod): stringOrNone[] {
        const staticPrefix = method.isStatic ? "static " : ""
        return [
            ...this.printExtendedAttributes(method),
            indentedBy(`${staticPrefix}${method.name}${this.printTypeParameters(method.typeParameters)}(${this.printParameters(method.parameters)}): ${this.convertType(method.returnType)}`, 1)
        ]
    }
}

class ArkoalaArkTSInterfacesVisitor extends ArkTSInterfacesVisitor {
    protected override getDeclConvertor(writer: LanguageWriter, seenNames: Set<string>, library: PeerLibrary, isDeclared: boolean): DeclarationConvertor<void> {
        return new ArkoalaArkTSDeclConvertor(writer, seenNames, library, isDeclared)
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
    throw new Error(`Need to implement InterfacesVisitor for ${peerLibrary.language} language`)
}

export function createInterfacePrinter(isDeclarations: boolean): PrinterFunction {
    return (library: PeerLibrary) => getVisitor(library, isDeclarations).printInterfaces()
}
