/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import { IfStatement, isHeir, LanguageExpression, LanguageWriter, LayoutNodeRole, Method, MethodModifier, MethodSignature, PeerClass, PeerLibrary, PeerMethod } from "@idlizer/core";
import { collapseIdlPeerMethods, collectComponents, componentToPeerClass, findComponentByDeclaration, findComponentByName, groupOverloads, ImportsCollector, PrinterResult } from "@idlizer/libohos";
import { collectPeersForFile } from "@idlizer/libohos";
import { generateAttributeModifierSignature } from './ComponentsPrinter';

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getAttributeModifierClassName(method: PeerMethod): string {
    return `${capitalizeFirstLetter(method.method.name)}Modifier`
}

class ModifiersFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        private readonly file: idl.IDLFile,
    ) { }

    visit(): PrinterResult[] {
        const result: PrinterResult[] = [];
        collectPeersForFile(this.library, this.file).forEach(peer => {
            result.push(...this.printModifiers(peer))
        })
        return result;
    }

    generateAttributeSetParentName(peer: PeerClass): string | undefined {
        if (!isHeir(peer.originalClassName!)) return undefined;
        return this.generateAttributeSetName(peer.parentComponentName!);
    }

    generateAttributeSetName(name: string): string {
        if (name.endsWith("Attribute"))
            name = name.substring(0, name.length - 9)
        return `Ark${name}Set`
    }

    generateFiledName(name: string, subfix: string = ''): string {
        return `_${name}${subfix}_value`
    }

    generateFiledFlag(name: string, subfix: string = ''): string {
        return `_${name}${subfix}_flag`
    }

    printImports(peer: PeerClass): ImportsCollector {
        const component = findComponentByName(this.library, peer.componentName)!
        const importsCollector = new ImportsCollector
        const parent = this.generateAttributeSetParentName(peer)
        if (parent && peer.originalParentFilename) {
            let [parentRef] = component.attributeDeclaration.inheritance
            let parentDecl = this.library.resolveTypeReference(parentRef)
            while (parentDecl) {
                const parentComponent = findComponentByDeclaration(this.library, parentDecl as idl.IDLInterface)!
                const parentGeneratedPath = this.library.layout.resolve({
                    node: parentDecl,
                    role: LayoutNodeRole.COMPONENT
                })
                importsCollector.addFeature(this.generateAttributeSetName(parentComponent.name), `./${parentGeneratedPath}`)
                if (parentComponent.attributeDeclaration.inheritance.length) {
                    let [parentRef] = parentComponent.attributeDeclaration.inheritance
                    parentDecl = this.library.resolveTypeReference(parentRef)
                } else {
                    parentDecl = undefined
                }
            }
        }
        return importsCollector
    }

    printModifierWithKeyBody(writer: LanguageWriter, peer: PeerClass, method: PeerMethod) {
        const argsNames = method.argConvertors(this.library).map((conv, index) => {
            const argName = conv.param
            const castedType = idl.maybeOptional(method.method.signature.args[index], method.method.signature.isArgOptional(index))
            return `${writer.escapeKeyword(argName)} as ${writer.getNodeName(castedType)}`
        })
        const call = writer.makeFunctionCall('modifierWithKey', [
            writer.makeString(`this._modifiersWithKeys`),
            writer.makeString(`${getAttributeModifierClassName(method)}.identity`),
            writer.makeString(`${getAttributeModifierClassName(method)}.factory`),
            ...argsNames.map((arg) => writer.makeString(`${arg}`))
        ])
        writer.writeExpressionStatement(call)
    }

    printModifierNullWidthKeyBody(writer: LanguageWriter, peer: PeerClass, method: PeerMethod) {
        const call = writer.makeFunctionCall('modifierNullWithKey', [
            writer.makeString(`this._modifiersWithKeys`),
            writer.makeString(`${getAttributeModifierClassName(method)}.identity`)
        ])
        writer.writeExpressionStatement(call)
    }

    printModifiers(peer: PeerClass): PrinterResult[] {
        const printer = this.library.createLanguageWriter();
        const component = findComponentByName(this.library, peer.componentName)!
        const isComponent = collectComponents(this.library).find(it => it.name === component.name)?.interfaceDeclaration
        const componentAttribute = component.attributeDeclaration;
        const parentSet = this.generateAttributeSetParentName(peer)

        type attributeType = [PeerMethod, string[], idl.IDLType[], PeerMethod[]]
        const attributeTypes: Map<string, attributeType> = new Map

        const attributeFilter = (name: string) => {
            return name.startsWith('set') && name.endsWith('Options')
        }

        groupOverloads(peer.methods, this.library.language).forEach(m => {
            const method = collapseIdlPeerMethods(this.library, m)
            if (attributeFilter(method.method.name)) {
                return
            }
            const args: string[] = []
            const types = method.argConvertors(this.library).map((conv, index) => {
                args.push(conv.param)
                return idl.maybeOptional(method.method.signature.args[index], method.method.signature.isArgOptional(index))
            })
            attributeTypes.set(method.method.name, [method, args, types, m])
        })

        printer.writeClass(this.generateAttributeSetName(componentAttribute.name), (writer) => {
            writer.print("_instanceId: number = -1;")

            writer.writeMethodImplementation(new Method(
                `setInstanceId`,
                new MethodSignature(idl.IDLVoidType, [idl.IDLNumberType], [], [], [], ['instanceId'])),
                writer => {
                    writer.writeStatement(writer.makeAssign('this._instanceId', undefined, writer.makeString('instanceId'), false))
                }
            )

            attributeTypes.forEach(attribute => {
                writer.writeFieldDeclaration(this.generateFiledFlag(attribute[0].method.name), idl.IDLBooleanType, [], true)
                attribute[2].forEach((t, index) => {
                    writer.writeFieldDeclaration(this.generateFiledName(attribute[0].method.name, index.toString()), t, [], true)
                })
            })

            writer.writeMethodImplementation(new Method('applyModifierPatch',
                new MethodSignature(idl.IDLVoidType, [idl.createReferenceType(componentAttribute)], [], [], [], ['component'])),
                writer => {
                    const statements: IfStatement[] = []
                    attributeTypes.forEach((attribute, name) => {
                        // TODO: handle overload condition 
                        if (attribute[3].length != 1 || attribute[0].method.signature.returnType !== idl.IDLThisType) {
                            return;
                        }
                        const expr = `this.${this.generateFiledFlag(attribute[0].method.name)}`
                        const params: LanguageExpression[] = attribute[1].map((_, index) => {
                            return writer.makeCast(writer.makeString(`this.${this.generateFiledName(attribute[0].method.name, index.toString())}`), attribute[0].method.signature.args[index])
                        })

                        const statement = writer.makeMethodCall('component', `${attribute[0].method.name}`, params)
                        statements.push(new IfStatement(
                            writer.makeString(expr),
                            writer.makeStatement(statement),
                            undefined,
                            undefined,
                            undefined
                        ))
                    })
                    writer.writeStatements(...statements)
                }
            )

            attributeTypes.forEach(attribute => {
                printer.writeMethodImplementation(attribute[0].method, (writer) => {
                    if (attribute[0].method.signature.returnType !== idl.IDLThisType) {
                        return;
                    }
                    writer.writeStatement(writer.makeAssign(`this.${this.generateFiledFlag(attribute[0].method.name)}`, idl.IDLBooleanType, writer.makeString(`true`), false))
                    attribute[2].forEach((t, index) => {
                        writer.writeStatement(writer.makeAssign(`this.${this.generateFiledName(attribute[0].method.name, index.toString())}`, t, writer.makeString(attribute[1][index]), false))
                    })
                    writer.writeStatement(writer.makeReturn(writer.makeThis()))
                })
            })
            const attributeModifierSignature = generateAttributeModifierSignature(this.library, component)
            writer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                writer.writeStatement(writer.makeThrowError("Not implemented"))
            })
        }, parentSet, [`${componentAttribute.name}`])

        return [{
            collector: this.printImports(peer),
            content: printer,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.implementation'
            }
        }]
    }
}

class ModifiersVisitor {
    constructor(
        private readonly peerLibrary: PeerLibrary
    ) { }

    printModifiers(): PrinterResult[] {
        const result: PrinterResult[] = []
        for (const file of this.peerLibrary.files.values()) {
            if (!collectPeersForFile(this.peerLibrary, file).length)
                continue
            const visitor = new ModifiersFileVisitor(this.peerLibrary, file);
            result.push(...visitor.visit())
        }
        return result;
    }
}

export function printModifiers(peerLibrary: PeerLibrary): PrinterResult[] {
    return new ModifiersVisitor(peerLibrary).printModifiers()
}