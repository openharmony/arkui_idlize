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
import { getSuper, IfStatement, isHeir, Language, LanguageExpression, LanguageStatement, LanguageWriter,
    LayoutNodeRole, Method, MethodModifier, MethodSignature, PeerClass, PeerLibrary, PeerMethod } from "@idlizer/core";
import { getHookMethod, collectDeclDependencies, collectDeclItself, collectPeers, componentToPeerClass,
    findComponentByDeclaration, findComponentByName, groupOverloads, IdlComponentDeclaration, ImportsCollector,
    peerGeneratorConfiguration, PrinterResult, collectComponents, collectModifiers,
    ModifierInfo } from "@idlizer/libohos";
import { expandComponentWithSupers, generateAttributeModifierSignature } from './ComponentsPrinter';
import { getReferenceTo } from '../knownReferences';
import { HandwrittenModule } from '../ArkoalaLayout'


function findPeerByComponentDeclaration(library: PeerLibrary, component: IdlComponentDeclaration): PeerClass | undefined {
    return collectPeers(library).find(it => it.componentName === component.name)
}

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

enum AttributeUpdaterFlag {
    INITIAL = 0,
    UPDATE = 1,
    RESET = 2,
    SKIP = 3
}

class ModifiersFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        private readonly modifiers: ModifierInfo[],
    ) { }

    visit(): PrinterResult[] {
        const result: PrinterResult[] = [];
        this.modifiers.forEach(modifierInfo => {
            result.push(...this.printModifiers(modifierInfo))
        })
        return result;
    }

    generateAttributeSetParentName(modifier: ModifierInfo): string | undefined {
        if (modifier.parent) {
            return this.generateAttributeSetName(modifier.parent)
        }
    }

    generateAttributeSetName(modifier: ModifierInfo): string {
        let modifierName = `${modifier.peer.componentName}Modifier`
        if (modifier.isTrivial === false) {
            return `${modifierName}Base`
        }
        return modifierName
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

    generateFiledFlag(attribute: AttributeType, index: number, isLocal: boolean = false): string {
        if (isLocal) {
            return `flagArray[${index}]`
        }
        return `this._flagArray[${index}]`
    }

    castResetType(writer: LanguageWriter, sig: MethodSignature, index: number): LanguageExpression {
        if (!sig.isArgOptional(index)) {
            return writer.makeCast(writer.makeString(`undefined`), sig.args[index])
        }
        return writer.makeCast(writer.makeString(`undefined`), idl.createUnionType([sig.args[index], idl.IDLUndefinedType]))
    }

    castSetType(attribute: AttributeType, writer: LanguageWriter, sig: MethodSignature, index: number): LanguageExpression {
        const hasUndefinedType = (type: idl.IDLType) => {
            if (idl.isUnionType(type)) {
                return type.types.includes(idl.IDLUndefinedType)
            }
            return false;
        }
        if (sig.isArgOptional(index) && !hasUndefinedType(sig.args[index])) {
            return writer.makeCast(writer.makeString(`this.${this.generateFiledName(attribute, index.toString())}`), idl.createUnionType([sig.args[index], idl.IDLUndefinedType]))
        }
        return writer.makeCast(writer.makeString(`this.${this.generateFiledName(attribute, index.toString())}`), sig.args[index])
    }

    recursiveCollect(component: IdlComponentDeclaration, importsCollector: ImportsCollector) {
        let [parentRef] = component.attributeDeclaration.inheritance
        let parentDecl = this.library.resolveTypeReference(parentRef)
        const parentComponent = findComponentByDeclaration(this.library, parentDecl as idl.IDLInterface)!
        console.log("recursiveCollect", parentComponent.attributeDeclaration.name, parentComponent.name)
        collectDeclDependencies(this.library, parentComponent.attributeDeclaration, importsCollector)
        expandComponentWithSupers(this.library, parentComponent.attributeDeclaration).forEach(decl => {
            collectDeclItself(this.library, decl, importsCollector)
        })
        collectDeclItself(this.library, parentComponent.attributeDeclaration, importsCollector)
    }

    printImports(modifier: ModifierInfo): ImportsCollector {
        const peer = modifier.peer
        const component = findComponentByName(this.library, peer.componentName)!
        const importsCollector = new ImportsCollector
        if (this.needCollectParentMethods(modifier)) {
            this.recursiveCollect(component, importsCollector)
        }
        let parentModifier = modifier.parent
        while (parentModifier) {
            const parentModifierName = this.generateAttributeSetName(parentModifier)
            importsCollector.addFeature(parentModifierName, `./${parentModifierName}`)
            parentModifier = parentModifier.parent
        }
        collectDeclItself(this.library, idl.createReferenceType(getReferenceTo('ModifierState')), importsCollector)
        importsCollector.addFeature("AttributeModifier", HandwrittenModule(this.library.language))
        importsCollector.addFeature("PeerNode", "./PeerNode")
        const peerLocation = this.library.layout.resolve({
            node: component.attributeDeclaration,
            role: LayoutNodeRole.COMPONENT,
        })
        importsCollector.addFeature(componentToPeerClass(component.name), `./${peerLocation}`)
        importsCollector.addFeatures(["int32", "int64"], "@koalaui/common")
        collectDeclDependencies(this.library, component.attributeDeclaration, importsCollector)
        expandComponentWithSupers(this.library, component.attributeDeclaration).forEach(decl => {
            collectDeclItself(this.library, decl, importsCollector)
        })
        collectDeclItself(this.library, component.attributeDeclaration, importsCollector)
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

    needCollectParentMethods(modifier: ModifierInfo): boolean {
        const peer = modifier.peer
        const component = findComponentByName(this.library, peer.componentName)!
        const parent = this.generateAttributeSetParentName(modifier)
        let counter = 0
        if (parent) {
            let [parentRef] = component.attributeDeclaration.inheritance
            let parentDecl = this.library.resolveTypeReference(parentRef)
            while (parentDecl) {
                counter++;
                const parentComponent = findComponentByDeclaration(this.library, parentDecl as idl.IDLInterface)!
                if (parentComponent.attributeDeclaration.inheritance.length) {
                    let [parentRef] = parentComponent.attributeDeclaration.inheritance
                    parentDecl = this.library.resolveTypeReference(parentRef)
                } else {
                    parentDecl = undefined
                }
            }
        }
        return counter > 1;
    }


    collectAttributes(peer: PeerClass, attributeTypes: Array<AttributeType>) {
        const parentTypesNames = new Array<string>()
        const component = findComponentByName(this.library, peer.componentName)!
        let parentRef = component.attributeDeclaration.inheritance.at(0)
        while (parentRef) {
            const parentDecl = this.library.resolveTypeReference(parentRef) as idl.IDLInterface
            const parentPeer = findPeerByComponentDeclaration(this.library, findComponentByDeclaration(this.library, parentDecl)!)!
            groupOverloads(parentPeer.methods, this.library.language).forEach(m => {
                if (!m[0].isCallSignature) {
                    parentTypesNames.push(m[0].method.name)
                }
            })
            parentRef = parentDecl.inheritance.at(0)
        }
        const overloadCounter = new Map<string, number>()
        for (const parentTypeName of parentTypesNames) {
            if (!overloadCounter.has(parentTypeName))
                overloadCounter.set(parentTypeName, 0)
            overloadCounter.set(parentTypeName, overloadCounter.get(parentTypeName)! + 1)
        }
        const attributeFilter = (name: string) => {
            return name.startsWith('set') && name.endsWith('Options')
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
            if (overloadCounter.has(functionName)) v = overloadCounter.get(functionName)! + 1
            overloadCounter.set(functionName, v)
            attributeTypes.push({ method: method, args: args, argTypes: types, isOptional: optional, overloadIndex: v })
        })
    }

    generateHooksCall(hookName: string, params: LanguageExpression[], writer: LanguageWriter): LanguageExpression {
        const hookCall = writer.makeFunctionCall(hookName, [
            writer.makeString('peer'), ...params
        ])
        return hookCall;
    }

    printHookedMethodBody(method: Method, hookName: string, writer: LanguageWriter) {
        const args = method.signature.args.map((_, i) => method.signature.argName(i))
        const hookCall = writer.makeFunctionCall(hookName, [
            writer.makeThis(), ...args.map(arg => writer.makeString(arg))
        ])
        writer.writeExpressionStatement(hookCall)
    }

    noNeedPrintModifier(attribute: AttributeType) {
        return attribute.method.method.signature.returnType !== idl.IDLThisType
    }

    printApplyModifierPatch(peer: PeerClass, writer: LanguageWriter, component: IdlComponentDeclaration, attributeTypes: Array<AttributeType>, parentSet: string | undefined, collectedHooks: string[]) {
        writer.print(`applyModifierPatch(node: PeerNode): void {`)
        writer.pushIndent()
        {
            if (parentSet) writer.print('super.applyModifierPatch(node)')
            writer.print(`this._state.addRef()`)
            writer.print(`const peer = node as ${componentToPeerClass(component.name)}`)
            writer.print(`const flagArray = this._flagArray`)
            const statements: IfStatement[] = []
            attributeTypes.forEach((attribute, index) => {
                // TODO: handle overload condition
                if (this.noNeedPrintModifier(attribute)) {
                    return;
                }
                const expr = `${this.generateFiledFlag(attribute, index, true)} != ${AttributeUpdaterFlag.INITIAL}`
                const params: LanguageExpression[] = attribute.args.map((_, index) => {
                    return this.castSetType(attribute, writer, attribute.method.method.signature, index)
                    // return writer.makeCast(writer.makeString(`this.${this.generateFiledName(attribute, index.toString())}`), this.castResetType(attribute.method.method.signature.args[index]))
                })
                const resetParams: LanguageExpression[] = attribute.args.map((_, index) => {
                    return this.castResetType(writer, attribute.method.method.signature, index)
                })

                const methodName = `${attribute.method.sig.name}Attribute`
                const hookRecord = peerGeneratorConfiguration().hooks.get(peer!.originalClassName ?? '')?.get(attribute.method.method.name)
                if (hookRecord && hookRecord.replaceImplementation) {
                    collectedHooks.push(hookRecord.hookName)
                }
                // hookCall in applyModifierPatch
                const statement = (hookRecord && hookRecord.replaceImplementation) ? this.generateHooksCall(hookRecord.hookName, params, writer) : writer.makeMethodCall('peer', methodName, params)
                const resetStatement = writer.makeMethodCall('peer', methodName, resetParams)
                const switchPrinter = this.library.createLanguageWriter();
                switchPrinter.print(`switch (${this.generateFiledFlag(attribute, index, true)}) {`)
                switchPrinter.pushIndent()
                switchPrinter.print(`case ${AttributeUpdaterFlag.UPDATE}:`)
                switchPrinter.pushIndent()
                switchPrinter.print(`${statement.asString()};`)
                switchPrinter.print(`${this.generateFiledFlag(attribute, index, true)} = ${AttributeUpdaterFlag.RESET}`)
                switchPrinter.print(`break`)
                switchPrinter.popIndent()
                switchPrinter.print(`case ${AttributeUpdaterFlag.SKIP}:`)
                switchPrinter.pushIndent()
                switchPrinter.print(`${this.generateFiledFlag(attribute, index, true)} = ${AttributeUpdaterFlag.RESET}`)
                switchPrinter.print(`break`)
                switchPrinter.popIndent()
                switchPrinter.print(`default:`)
                switchPrinter.pushIndent()
                switchPrinter.print(`${this.generateFiledFlag(attribute, index, true)} = ${AttributeUpdaterFlag.INITIAL}`)
                if (attribute.isOptional) {
                    if (hookRecord && hookRecord.replaceImplementation) {
                        switchPrinter.print(`${switchPrinter.makeFunctionCall(hookRecord.hookName, [writer.makeString('peer'), ...resetParams]).asString()};`)
                    } else {
                        switchPrinter.print(`${resetStatement.asString()};`)
                    }
                }
                switchPrinter.popIndent()
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
        writer.print("}")
    }

    printMergeModifier(writer: LanguageWriter, modifierName: string, attributeTypes: Array<AttributeType>, parentSet: string | undefined) {
        writer.print(`mergeModifier(modifier: ${modifierName}): void {`)
        writer.pushIndent()
        {
            if (parentSet) writer.print('super.mergeModifier(modifier)')
            writer.print(`this._state = modifier._state`)
            writer.print(`const flagArray = modifier._flagArray`)
            const statements: IfStatement[] = []
            attributeTypes.forEach((attribute, index) => {
                if (this.noNeedPrintModifier(attribute)) {
                    return
                }
                const expr = `${this.generateFiledFlag(attribute, index, true)} != ${AttributeUpdaterFlag.INITIAL}`
                const params: LanguageExpression[] = attribute.args.map((_, index) => {
                    return writer.makeString(`modifier.${this.generateFiledName(attribute, index.toString())}`)
                })
                const resetParams: LanguageExpression[] = attribute.args.map((_, index) => {
                    return this.castResetType(writer, attribute.method.method.signature, index)
                })
                const statement = writer.makeMethodCall('this', attribute.method.method.name, params)
                const resetStatement = writer.makeMethodCall('this', attribute.method.method.name, resetParams)
                const switchPrinter = this.library.createLanguageWriter();
                switchPrinter.print(`switch (${this.generateFiledFlag(attribute, index, true)}) {`)
                switchPrinter.pushIndent()
                switchPrinter.print(`case ${AttributeUpdaterFlag.UPDATE}:`)
                switchPrinter.print(`case ${AttributeUpdaterFlag.SKIP}:`)
                switchPrinter.pushIndent()
                if (attribute.isOptional) switchPrinter.print(`${statement.asString()};`)
                switchPrinter.print(`break;`)
                switchPrinter.popIndent()
                switchPrinter.print(`default:`)
                switchPrinter.pushIndent()
                if (attribute.isOptional) switchPrinter.print(`${resetStatement.asString()};`)
                switchPrinter.popIndent()
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
    }

    printModifiers(modifierInfo: ModifierInfo): PrinterResult[] {
        const peer = modifierInfo.peer
        const component = findComponentByName(this.library, peer.componentName)!
        const generate: PrinterResult['generate'] = () => {
            const printer = this.library.createLanguageWriter();
            const componentAttribute = component.attributeDeclaration;
            const parentSet = this.generateAttributeSetParentName(modifierInfo)

            const attributeTypes: Array<AttributeType> = new Array

            const noNeedPrintModifier = (attribute: AttributeType) => {
                // return attribute.method.method.signature.returnType !== idl.IDLThisType || !attribute.isOptional
                return attribute.method.method.signature.returnType !== idl.IDLThisType
            }

            this.collectAttributes(peer, attributeTypes)

            let extendsInterface: string[] = []
            const collectedHooks: string[] = []

            if (componentAttribute.name !== 'CommonMethod') {
                extendsInterface = [`${componentAttribute.name}`, `AttributeModifier<${componentAttribute.name}>`]
            } else {
                extendsInterface = [`${componentAttribute.name}`]
            }
            let abstractMethods = modifierInfo.modifier?.methods ?? []
            const baseModifierMethods = [
                'applyNormalAttribute',
                'applyPressedAttribute',
                'applyFocusedAttribute',
                'applyDisabledAttribute',
                'applySelectedAttribute'
            ]
            abstractMethods = abstractMethods.filter(method => {
                return (!baseModifierMethods.includes(method.name) || method.parameters.length != 1)
            })
            const modifierName = this.generateAttributeSetName(modifierInfo)

            printer.writeClass(modifierName, (writer) => {
                writer.print("_instanceId: number = -1")
                writer.print("_state: ModifierState = new ModifierState")
                writer.print(`_addr: ArrayBuffer = new ArrayBuffer(4096)`)
                writer.print(`_flagArray: Uint8Array = new Uint8Array(this._addr)`)

                writer.print(`constructor() {`)
                writer.pushIndent()
                if (parentSet) writer.print(`super()`)
                writer.print(`this._flagArray.fill(0)`)
                writer.popIndent()
                writer.print(`}`)

                writer.writeMethodImplementation(new Method(
                    `setInstanceId`,
                    new MethodSignature(idl.IDLVoidType, [idl.IDLNumberType], [], [], [], ['instanceId'])),
                    writer => {
                        writer.writeStatement(writer.makeAssign('this._instanceId', undefined, writer.makeString('instanceId'), false))
                    }
                )

                writer.print(`isUpdater: () => boolean = () => false`)
                if (componentAttribute.name !== 'CommonMethod') {
                    baseModifierMethods.forEach(method => {
                        writer.print(`${method}(instance: ${componentAttribute.name}): void { }`)
                    })
                }
                attributeTypes.forEach((attribute, index) => {
                    attribute.argTypes.forEach((t, index) => {
                        writer.writeFieldDeclaration(this.generateFiledName(attribute, index.toString()), t, [], true)
                    })
                })

                this.printApplyModifierPatch(peer, writer, component, attributeTypes, parentSet, collectedHooks)
                this.printMergeModifier(writer, modifierName, attributeTypes, parentSet)

                attributeTypes.forEach((attribute, index) => {
                    printer.writeMethodImplementation(attribute.method.method, (writer) => {
                        if (noNeedPrintModifier(attribute)) {
                            writer.writeStatement(writer.makeThrowError("Not implemented"))
                            return;
                        }
                        let nameWoBase = modifierName
                        if (modifierName.endsWith('Base')) {
                            nameWoBase = modifierName.substring(0, modifierName.length - 'Base'.length)
                        }
                        const hookMethod = getHookMethod(nameWoBase, attribute.method.method.name)
                        if (hookMethod) {
                            // hook call for Modifier member function
                            this.printHookedMethodBody(attribute.method.method, hookMethod.hookName, writer)
                            collectedHooks.push(hookMethod.hookName)
                            writer.writeStatement(writer.makeReturn(writer.makeThis()))
                            return;
                        }
                        const equalStatements: LanguageExpression[] = []
                        equalStatements.push(writer.makeEquals([writer.makeString(`${this.generateFiledFlag(attribute, index)}`), writer.makeString(`${AttributeUpdaterFlag.INITIAL}`)]))
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
                        thenStatements.push(writer.makeAssign(`${this.generateFiledFlag(attribute, index)}`, undefined, writer.makeString(`${AttributeUpdaterFlag.UPDATE}`), false))
                        attribute.argTypes.forEach((t, index) => {
                            thenStatements.push(writer.makeAssign(`this.${this.generateFiledName(attribute, index.toString())}`, t, writer.makeString(attribute.args[index]), false))
                        })
                        thenStatements.push(writer.makeStatement(writer.makeString(`this._state.fireChange()`)))
                        const thenStatementBlock = writer.makeBlock(thenStatements)
                        const elseStatementBlock = writer.makeBlock([writer.makeAssign(`${this.generateFiledFlag(attribute, index)}`, undefined, writer.makeString(`${AttributeUpdaterFlag.SKIP}`), false)])
                        const condition = writer.makeCondition(equalNary, thenStatementBlock, elseStatementBlock)
                        writer.writeStatement(condition)
                        writer.writeStatement(writer.makeReturn(writer.makeThis()))
                    })
                })
                const attributeModifierSignature = generateAttributeModifierSignature(this.library, component)
                writer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                    writer.writeStatement(writer.makeThrowError("Not implemented"))
                })
                abstractMethods.forEach((method => {
                    const signature = new MethodSignature(method.returnType,
                        method.parameters.map(param => param.type),
                        undefined, undefined, undefined,
                        method.parameters.map(param => param.name))
                    writer.writeMethodDeclaration(method.name, signature, [MethodModifier.ABSTRACT])
                }))
            }, parentSet, extendsInterface, undefined, undefined, abstractMethods.length > 0)
            const collector = this.printImports(modifierInfo)
            collector.addFeatures(collectedHooks, HandwrittenModule(this.library.language))

            return {
                content: printer,
                imports: collector,
            }
        }

        return [{
            generate,
            over: {
                node: component.attributeDeclaration,
                role: LayoutNodeRole.COMPONENT,
                hint: 'component.modifier'
            }
        }]
    }
}

export function printModifiers(peerLibrary: PeerLibrary): PrinterResult[] {
    if (peerLibrary.language !== Language.ARKTS) {
        return []
    }
    let result: PrinterResult[] = []
    collectModifiers(peerLibrary).forEach((modifiers, _file) => {
        const visitor = new ModifiersFileVisitor(peerLibrary, modifiers)
        result.push(...visitor.visit())
    })
    return result
}
