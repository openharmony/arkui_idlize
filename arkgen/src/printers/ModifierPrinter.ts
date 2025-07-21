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
import { IfStatement, isHeir, Language, LanguageExpression, LanguageStatement, LanguageWriter, LayoutNodeRole, Method, MethodModifier, MethodSignature, PeerClass, PeerLibrary, PeerMethod } from "@idlizer/core";
import { collapseIdlPeerMethods, collectComponents, componentToPeerClass, findComponentByDeclaration, findComponentByName, groupOverloads, ImportsCollector, peerGeneratorConfiguration, PrinterResult } from "@idlizer/libohos";
import { collectPeersForFile } from "@idlizer/libohos";
import { generateAttributeModifierSignature } from './ComponentsPrinter';

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getAttributeModifierClassName(method: PeerMethod): string {
    return `${capitalizeFirstLetter(method.method.name)}Modifier`
}

function isPrimitiveType(type: idl.IDLType): boolean {
    const visitType = (t: idl.IDLType): boolean => {
        if (idl.isOptionalType(t)) {
            return visitType(t.type);
        }
        if (idl.isUnionType(t)) {
            return t.types.every(visitType);
        }
        if (idl.isContainerType(t)) {
            return t.elementType.every(visitType);
        }
        return idl.isPrimitiveType(t);
    }

    return visitType(type);
}

function isOptionalType(type: idl.IDLType): boolean {
    const visiteType = (t: idl.IDLType): boolean => {
        if (idl.isOptionalType(t)) {
            return true;
        }
        if (idl.isUnionType(t)) {
            return t.types.some(visiteType);
        }
        if (idl.isContainerType(t)) {
            return t.elementType.some(visiteType);
        }
        return idl.isUndefinedType(t);
    }
    return visiteType(type);
}

interface AttributeType {
    method: PeerMethod;
    args: string[];
    argTypes: idl.IDLType[];
    isOptional: boolean;
    overloadIndex: number; // For overloads, we can track which overload this is
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
        return `${name}Modifier`
    }

    generateOptimizerParentName(peer: PeerClass): string | undefined {
        if (!isHeir(peer.originalClassName!)) return undefined;
        return this.generateOptimizerName(peer.parentComponentName!);
    }


    generateOptimizerName(name: string): string {
        if (name.endsWith("Attribute"))
            name = name.substring(0, name.length - 9)
        return `${name}Optimizer`
    }

    generateFiledName(attribute: AttributeType, subfix: string = ''): string {
        return `_${attribute.method.method.name}_${attribute.overloadIndex.toString()}_${subfix}value`
    }

    generateFiledFlag(attribute: AttributeType, subfix: string = ''): string {
        return `_${attribute.method.method.name}_${attribute.overloadIndex.toString()}_${subfix}flag`
    }

    castResetType(writer: LanguageWriter, sig: MethodSignature, index: number): LanguageExpression {
        if (!sig.isArgOptional(index)) {
            return writer.makeCast(writer.makeString(`undefined`), sig.args[index])
        }
        return writer.makeCast(writer.makeString(`undefined`), idl.createUnionType([sig.args[index], idl.IDLUndefinedType]))
    }

    printImports(peer: PeerClass): ImportsCollector {
        const component = findComponentByName(this.library, peer.componentName)!
        const importsCollector = new ImportsCollector
        const parent = this.generateAttributeSetParentName(peer)
        if (parent) {
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
        importsCollector.addFeature("AttributeUpdaterFlag", "./generated/AttributeUpdater")
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
        const componentAttribute = component.attributeDeclaration;
        const parentSet = this.generateAttributeSetParentName(peer)

        const attributeTypes: Array<AttributeType> = new Array
        const overloadCounter: Map<string, number> = new Map()

        const attributeFilter = (name: string) => {
            const hookRecord = peerGeneratorConfiguration().hooks.get(peer.originalClassName ?? '')?.get(name)
            return name.startsWith('set') && name.endsWith('Options')
                || (hookRecord && hookRecord.replaceImplementation)
        }

        const noNeedPrintModifier = (attribute: AttributeType) => {
            return attribute.method.method.signature.returnType !== idl.IDLThisType || !attribute.isOptional
        }

        groupOverloads(peer.methods, this.library.language).forEach(m => {
            const method = m[0]
            if (attributeFilter(method.method.name)) {
                return
            }
            const args: string[] = []
            let optional: boolean = true;
            const types = method.argConvertors(this.library).map((conv, index) => {
                args.push(conv.param)
                const type = idl.maybeOptional(method.method.signature.args[index], method.method.signature.isArgOptional(index))
                if (!isOptionalType(type)) optional = false;
                return type
            })
            const functionName = method.method.name
            let v = 0
            if (overloadCounter.has(functionName)) v++
            overloadCounter.set(functionName, v)
            attributeTypes.push({ method: method, args: args, argTypes: types, isOptional: optional, overloadIndex: v })
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
                writer.writeFieldDeclaration(this.generateFiledFlag(attribute), idl.createReferenceType("AttributeUpdaterFlag"), [], false, writer.makeString('AttributeUpdaterFlag.INITIAL'))
                attribute.argTypes.forEach((t, index) => {
                    writer.writeFieldDeclaration(this.generateFiledName(attribute, index.toString()), t, [], true)
                })
            })

            writer.writeMethodImplementation(new Method('applyModifierPatch',
                new MethodSignature(idl.IDLVoidType, [idl.createReferenceType(componentToPeerClass(peer.componentName))], [], [], [], ['peer'])),
                writer => {
                    if (parentSet) writer.print('super.applyModifierPatch(peer)');
                    const statements: IfStatement[] = []
                    attributeTypes.forEach((attribute) => {
                        // TODO: handle overload condition 
                        if (noNeedPrintModifier(attribute)) {
                            return;
                        }
                        const expr = `this.${this.generateFiledFlag(attribute)} != AttributeUpdaterFlag.INITIAL`
                        const params: LanguageExpression[] = attribute.args.map((_, index) => {
                            return writer.makeCast(writer.makeString(`this.${this.generateFiledName(attribute, index.toString())}`), attribute.method.method.signature.args[index])
                        })
                        const resetParams: LanguageExpression[] = attribute.args.map((_, index) => {
                            return this.castResetType(writer, attribute.method.method.signature, index)
                        })

                        const methodName = `${attribute.method.sig.name}Attribute`
                        const statement = writer.makeMethodCall('peer', methodName, params)
                        const resetStatement = writer.makeMethodCall('peer', methodName, resetParams)
                        const switchPrinter = this.library.createLanguageWriter();
                        switchPrinter.print(`switch (this.${this.generateFiledFlag(attribute)}) {`)
                        switchPrinter.pushIndent()
                        switchPrinter.print(`case AttributeUpdaterFlag.UPDATE: {`)
                        switchPrinter.pushIndent()
                        switchPrinter.print(`${statement.asString()};`)
                        switchPrinter.print(`this.${this.generateFiledFlag(attribute)} = AttributeUpdaterFlag.RESET;`)
                        switchPrinter.print(`break;`)
                        switchPrinter.popIndent()
                        switchPrinter.print(`}`)
                        switchPrinter.print(`case AttributeUpdaterFlag.SKIP: {`)
                        switchPrinter.pushIndent()
                        switchPrinter.print(`this.${this.generateFiledFlag(attribute)} = AttributeUpdaterFlag.RESET;`)
                        switchPrinter.print(`break;`)
                        switchPrinter.popIndent()
                        switchPrinter.print(`}`)
                        switchPrinter.print(`default: {`)
                        switchPrinter.pushIndent()
                        switchPrinter.print(`this.${this.generateFiledFlag(attribute)} = AttributeUpdaterFlag.INITIAL;`)
                        switchPrinter.print(`${resetStatement.asString()};`)
                        switchPrinter.popIndent()
                        switchPrinter.print(`}`)
                        switchPrinter.popIndent()
                        switchPrinter.print(`}`)
                        statements.push(new IfStatement(
                            writer.makeString(expr),
                            writer.makeBlock(switchPrinter.getOutput().map(s => writer.makeStatement(writer.makeString(s)))),
                            undefined,
                            undefined,
                            undefined
                        ))
                    })
                    writer.writeStatements(...statements)
                }
            )

            writer.print(`mergeModifier(modifier: ${this.generateAttributeSetName(componentAttribute.name)}): void {`)
            writer.pushIndent()
            {
                if (parentSet) writer.print('super.mergeModifier(modifier)');
                const statements: IfStatement[] = []
                attributeTypes.forEach(attribute => {
                    if (noNeedPrintModifier(attribute)) {
                        return;
                    }
                    const expr = `modifier.${this.generateFiledFlag(attribute)} != AttributeUpdaterFlag.INITIAL`
                    const params: LanguageExpression[] = attribute.args.map((_, index) => {
                        return writer.makeString(`modifier.${this.generateFiledName(attribute, index.toString())}`)
                    })
                    const resetParams: LanguageExpression[] = attribute.args.map((_, index) => {
                        return this.castResetType(writer, attribute.method.method.signature, index)
                    })
                    const statement = writer.makeMethodCall('this', attribute.method.method.name, params)
                    const resetStatement = writer.makeMethodCall('this', attribute.method.method.name, resetParams)
                    const switchPrinter = this.library.createLanguageWriter();
                    switchPrinter.print(`switch (modifier.${this.generateFiledFlag(attribute)}) {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`case AttributeUpdaterFlag.UPDATE:`)
                    switchPrinter.print(`case AttributeUpdaterFlag.SKIP: {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`${statement.asString()};`)
                    switchPrinter.print(`break;`)
                    switchPrinter.popIndent()
                    switchPrinter.print(`}`)
                    switchPrinter.print(`default: {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`${resetStatement.asString()};`)
                    switchPrinter.popIndent()
                    switchPrinter.print(`}`)
                    switchPrinter.popIndent()
                    switchPrinter.print(`}`)
                    statements.push(new IfStatement(
                        writer.makeString(expr),
                        writer.makeBlock(switchPrinter.getOutput().map(s => writer.makeStatement(writer.makeString(s)))),
                        undefined,
                        undefined,
                        undefined
                    ))
                })
                writer.writeStatements(...statements)
            }
            writer.popIndent()
            writer.print(`}`)

            attributeTypes.forEach(attribute => {
                printer.writeMethodImplementation(attribute.method.method, (writer) => {
                    if (noNeedPrintModifier(attribute)) {
                        writer.writeStatement(writer.makeThrowError("Not implemented"))
                        return;
                    }
                    const equalStatements: LanguageExpression[] = []
                    equalStatements.push(writer.makeEquals([writer.makeString(`this.${this.generateFiledFlag(attribute)}`), writer.makeString(`AttributeUpdaterFlag.INITIAL`)]))
                    attribute.argTypes.forEach((t, index) => {
                        if (isPrimitiveType(t)) {
                            console.log("isPrimitiveType", `this.${this.generateFiledName(attribute, index.toString())}`)
                            equalStatements.push(writer.makeNaryOp("!==", [writer.makeString(`this.${this.generateFiledName(attribute, index.toString())}`), writer.makeString(attribute.args[index])]))
                        } else {
                            equalStatements.push(writer.makeString('true'))
                        }

                    })
                    const equalNary = writer.makeNaryOp('||', equalStatements)

                    const thenStatements: LanguageStatement[] = []
                    thenStatements.push(writer.makeAssign(`this.${this.generateFiledFlag(attribute)}`, undefined, writer.makeString(`AttributeUpdaterFlag.UPDATE`), false))
                    attribute.argTypes.forEach((t, index) => {
                        thenStatements.push(writer.makeAssign(`this.${this.generateFiledName(attribute, index.toString())}`, t, writer.makeString(attribute.args[index]), false))
                    })
                    const thenStatementBlock = writer.makeBlock(thenStatements)
                    const elseStatementBlock = writer.makeBlock([writer.makeAssign(`this.${this.generateFiledFlag(attribute)}`, undefined, writer.makeString(`AttributeUpdaterFlag.SKIP`), false)])
                    const condition = writer.makeCondition(equalNary, thenStatementBlock, elseStatementBlock)
                    writer.writeStatement(condition)
                    writer.writeStatement(writer.makeReturn(writer.makeThis()))
                })
            })
            const attributeModifierSignature = generateAttributeModifierSignature(this.library, component)
            writer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                writer.writeStatement(writer.makeThrowError("Not implemented"))
            })
        }, parentSet, [`${componentAttribute.name}`])

        // const optimizerParent = this.generateOptimizerParentName(peer)
        // printer.writeClass(this.generateOptimizerName(componentAttribute.name), (writer) => {
        //     writer.print(`_update: boolean = false;`);
        //     writer.print(`_disable: boolean = false;`);
        //     writer.print(`_peer?: ${componentToPeerClass(peer.componentName)};`);
        //     writer.print(`_attribute: ${this.generateAttributeSetName(componentAttribute.name)};`);
        //     writer.print(`constructor(attribute: ${this.generateAttributeSetName(componentAttribute.name)}) {`);
        //     writer.pushIndent();
        //     writer.print(`super(attribute);`);
        //     writer.print(`this._attribute = attribute;`);
        //     writer.popIndent();
        //     writer.print(`}`);

        // }, optimizerParent)

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
    if (peerLibrary.language !== Language.ARKTS) {
        return []
    }
    return new ModifiersVisitor(peerLibrary).printModifiers()
}