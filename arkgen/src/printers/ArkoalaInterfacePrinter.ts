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
import { allowNamedOverloads, collapseIdlPeerMethods, collectPeers, findComponentByDeclaration, findComponentByName, groupOverloads, isComponentDeclaration, KotlinDeclarationConvertor, KotlinInterfacesVisitor, PrinterFunction } from "@idlizer/libohos"
import { ArkTSInterfacesVisitor, CJInterfacesVisitor, InterfacesVisitor, TSDeclConvertor, TSInterfacesVisitor } from "@idlizer/libohos"
import { DeclarationConvertor, getSuper, indentedBy, isMethodOverridden, Language, LanguageWriter, maybeRestoreThrows, Method, MethodModifier, MethodSignature, NamedMethodSignature, PeerClass, PeerLibrary, ReferenceResolver, stringOrNone } from "@idlizer/core"
import { generateAttributeModifierSignature } from "./ComponentsPrinter"
import { componentToAttributesInterface, isPropertyBasedMethodOverridden } from "./PeersPrinter"

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
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        const declaredPrefix = this.isDeclared && this.peerLibrary.language !== Language.ARKTS ? "declare " : ""
        const superType = getSuper(idlInterface, this.peerLibrary)
        const extendsClause = superType ? `extends ${nameConvertor.convert(superType)} ` : ""
        printer.print(`export ${declaredPrefix}interface ${componentToAttributesInterface(idlInterface.name)} ${extendsClause}{`)
        printer.pushIndent()
        const collapsedMethods = groupOverloads(peer!.methods, this.peerLibrary.language)
            .map(group => collapseIdlPeerMethods(this.peerLibrary, group))
        const parentMethods = collectParentsPropertiesNames(idlInterface, this.peerLibrary)
        collapsedMethods.forEach(method => {
            if (this.peerLibrary.language === Language.ARKTS && !parentMethods.has(method.method.name)) {
                const nonPublic = new Method(
                    method.uniqueOverloadName,
                    method.method.signature,
                    method.method.modifiers?.filter(it => it !== MethodModifier.PUBLIC)
                )
                printer.writeMethodImplementation(nonPublic, w => {
                    w.writeStatement(w.makeThrowError(`Unimplemented method ${method.method.name}`))
                })
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
        const applyAttributesFinishSignature = new MethodSignature(idl.createPrimitiveType('void'), [])
        if (this.peerLibrary.language === Language.ARKTS) {
            if (idlInterface.name === 'CommonMethod') {
                printer.writeMethodImplementation(new Method('applyAttributesFinish', applyAttributesFinishSignature), () => {})
            }
        }
        else {
            printer.writeMethodDeclaration('applyAttributesFinish', applyAttributesFinishSignature)
        }
        printer.popIndent()
        printer.print('}')
        return printer.getOutput()
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
