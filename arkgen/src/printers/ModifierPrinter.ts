/*
 * Copyright (c) 2025-2026 Huawei Device Co., Ltd.
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
    LayoutNodeRole, LayoutTargetDescription, Method, MethodModifier, MethodSignature, NamedMethodSignature, PeerClass,
    PeerLibrary, PeerMethod } from "@idlizer/core";
import { getHookMethod, collectDeclDependencies, collectDeclItself, collectPeers, componentToPeerClass,
    findComponentByDeclaration, findComponentByName, groupOverloads, IdlComponentDeclaration, ImportsCollector,
    peerGeneratorConfiguration, PrinterResult, collectModifiers,
    ModifierInfo, 
    collectComponents} from "@idlizer/libohos";
import { expandComponentWithSupers, generateAttributeModifierSignature } from './ComponentsPrinter.js';
import { getReferenceTo } from '../knownReferences.js';
import { HandwrittenModule } from '../ArkoalaLayout.js'


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
    peer: PeerClass;
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
            return this.generateAuxiliaryClassName(modifier.parent)
        }
    }

    generateAttributeSetBaseName(modifier: ModifierInfo): string {
        return `${this.generateAttributeSetDerivedName(modifier)}Base`
    }

    generateAttributeSetDerivedName(modifier: ModifierInfo): string {
        return modifier.modifier ? modifier.modifier.name : `${modifier.peer.componentName}Modifier`
    }

    generateAttributeSetName(modifier: ModifierInfo): string {
        if (modifier.isTrivial === false) {
            return this.generateAttributeSetBaseName(modifier)
        }
        return this.generateAttributeSetDerivedName(modifier)
    }

    generateAuxiliaryClassName(modifier: ModifierInfo): string {
        return modifier.modifier ?
            `${modifier.modifier.name}Functions` :
            `${modifier.peer.componentName}ModifierFunctions`
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

    generateAddrName(peer: PeerClass) {
        return `_${peer.componentName}_addr`
    }

    generateFilledFlagName(peer: PeerClass) {
        return `_${peer.componentName}_flagArray`
    }

    generateFiledName(attribute: AttributeType, subfix: string = ''): string {
        return `_${attribute.peer.componentName}_${attribute.method.method.name}_${attribute.overloadIndex.toString()}_${subfix}value`
    }

    generateFiledFlag(attribute: AttributeType, index: number, isLocal: boolean = false): string {
        if (isLocal) {
            return `flagArray[${index}]`
        }
        return `this.${this.generateFilledFlagName(attribute.peer)}[${index}]`
    }

    castResetType(writer: LanguageWriter, sig: MethodSignature, index: number): LanguageExpression {
        if (!sig.isArgOptional(index)) {
            return writer.makeCast(writer.makeUndefined(), sig.args[index])
        }
        return writer.makeCast(writer.makeUndefined(), idl.createUnionType([sig.args[index], idl.createPrimitiveType('undefined')]))
    }

    castSetType(attribute: AttributeType, writer: LanguageWriter, sig: MethodSignature, index: number): LanguageExpression {
        const hasUndefinedType = (type: idl.IDLType) => {
            if (idl.isUnionType(type)) {
                return type.types.some(t => idl.isUndefinedType(t))
            }
            return false;
        }
        if (sig.isArgOptional(index) && !hasUndefinedType(sig.args[index])) {
            return writer.makeCast(writer.makeString(`this.${this.generateFiledName(attribute, index.toString())}`), idl.createUnionType([sig.args[index], idl.createPrimitiveType('undefined')]))
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

    private getLayoutTargetDescription(
        modifier: ModifierInfo,
        isInterface: boolean,
        component: idl.IDLInterface): LayoutTargetDescription {
        return {
            node: (modifier.modifier !== undefined && modifier.isTrivial) ? modifier.modifier : component,
            role: isInterface ? LayoutNodeRole.INTERFACE : LayoutNodeRole.MODIFIER_FUNCTIONS,
            hint: 'component.modifier'
        }
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
            const parentComponent = findComponentByName(this.library, parentModifier.peer.componentName)
            if (parentComponent === undefined) {
                continue
            }
            const layoutTarget = this.getLayoutTargetDescription(
                parentModifier, false, parentComponent.attributeDeclaration)
            const location = this.library.layout.resolve(layoutTarget)
            const parentModifierName = this.generateAuxiliaryClassName(parentModifier)
            importsCollector.addFeature(parentModifierName, location)
            parentModifier = parentModifier.parent
        }
        collectDeclItself(this.library, idl.createReferenceType(getReferenceTo('ModifierState')), importsCollector)
        importsCollector.addFeature("AttributeModifier", HandwrittenModule(this.library.language))
        if (modifier.isTrivial === false) {
            importsCollector.addFeature(this.generateAttributeSetDerivedName(modifier),
                HandwrittenModule(this.library.language))
        }
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
        let counter = 0
        if (modifier.parent) {
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
            attributeTypes.push({ peer, method: method, args: args, argTypes: types, isOptional: optional, overloadIndex: v })
        })
    }

    generateHooksCall(hookName: string, params: LanguageExpression[], writer: LanguageWriter): LanguageExpression {
        const hookCall = writer.makeFunctionCall(hookName, [
            writer.makeString('peer'), ...params
        ])
        return hookCall;
    }

    printHookedMethodBody(method: Method, hookName: string, flagIndex: number, writer: LanguageWriter) {
        const args = method.signature.args.map((_, i) => method.signature.argName(i))
        const hookCall = writer.makeFunctionCall(hookName, [
            writer.makeThis(), ...args.map(arg => writer.makeString(arg)), writer.makeString(`${flagIndex}`)
        ])
        writer.writeExpressionStatement(hookCall)
    }

    noNeedPrintModifier(attribute: AttributeType) {
        return !idl.isPrimitiveType(attribute.method.method.signature.returnType, 'this')
    }

    printApplyModifierPatch(
        peer: PeerClass,
        writer: LanguageWriter,
        component: IdlComponentDeclaration,
        attributeTypes: Array<AttributeType>,
        hasParent: boolean,
        collectedHooks: string[],
        changeName: boolean) {
        const totalCount = attributeTypes.length;
        const batchSize = 20;
        const batchCount = Math.ceil(totalCount / batchSize);

        const methodName = changeName ? `applyModifierPatch${peer.componentName}` : `applyModifierPatch`
        writer.writeMethodImplementation(new Method(methodName,
            new NamedMethodSignature(idl.createPrimitiveType('void'), [idl.createReferenceType("arkui.PeerNode.PeerNode")], ['node'], [], [], [])),
            writer => {
                if (hasParent) {
                    writer.print(`super.applyModifierPatch${peer.parentComponentName}(node)`);
                }
                writer.print(`this._state.addRef()`);
                writer.print(`const peer = node as ${componentToPeerClass(component.name)};`)
                writer.print(`const flagArray = this.${this.generateFilledFlagName(peer)};`);
                for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
                    writer.print(`this.${methodName}${batchIndex}(peer, flagArray);`);
                }
            }
        )

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
            writer.print(`${methodName}${batchIndex}(peer: ${componentToPeerClass(component.name)}, flagArray: Uint8Array): void {`)
            writer.pushIndent()
            {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, totalCount);
                const statements: IfStatement[] = []
                for (let index = start; index < end; index++) {
                    const attribute = attributeTypes[index];
                    // Improve: handle overload condition 
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
                    switchPrinter.print(`case ${AttributeUpdaterFlag.UPDATE}: {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`${statement.asString()};`)
                    switchPrinter.print(`${this.generateFiledFlag(attribute, index, true)} = ${AttributeUpdaterFlag.RESET};`)
                    switchPrinter.print(`break;`)
                    switchPrinter.popIndent()
                    switchPrinter.print(`}`)
                    switchPrinter.print(`case ${AttributeUpdaterFlag.SKIP}: {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`${this.generateFiledFlag(attribute, index, true)} = ${AttributeUpdaterFlag.RESET};`)
                    switchPrinter.print(`break;`)
                    switchPrinter.popIndent()
                    switchPrinter.print(`}`)
                    switchPrinter.print(`default: {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`${this.generateFiledFlag(attribute, index, true)} = ${AttributeUpdaterFlag.INITIAL};`)
                    if (attribute.isOptional) {
                        if (hookRecord && hookRecord.replaceImplementation) {
                            switchPrinter.print(`${switchPrinter.makeFunctionCall(hookRecord.hookName, [writer.makeString('peer'), ...resetParams]).asString()};`)
                        } else {
                            switchPrinter.print(`${resetStatement.asString()};`)
                        }
                    }
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
                }
                writer.writeStatements(...statements)
            }
            writer.popIndent()
            writer.print(`}`)
        }
    }

    printMergeModifier(
        peer: PeerClass,
        writer: LanguageWriter,
        modifierName: string,
        attributeTypes: Array<AttributeType>,
        hasParent: boolean,
        changeName: boolean) {
        const totalCount = attributeTypes.length;
        const batchSize = 20;
        const batchCount = Math.ceil(totalCount / batchSize);

        const methodName = changeName ? `mergeModifier${peer.componentName}` : `mergeModifier`
        writer.print(`${methodName}(modifier: ${modifierName}): void {`)
        writer.pushIndent()
        {
            if (hasParent) {
                writer.print(`super.mergeModifier${peer.parentComponentName}(modifier)`);
            }
            writer.print(`this._state = modifier._state;`);
            writer.print(`const flagArray = modifier.${this.generateFilledFlagName(peer)};`);
            for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
                writer.print(`this.${methodName}${batchIndex}(modifier, flagArray);`);
            }
        }
        writer.popIndent()
        writer.print(`}`)

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
            writer.print(`${methodName}${batchIndex}(modifier: ${modifierName}, flagArray: Uint8Array): void {`)
            writer.pushIndent()
            {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, totalCount);
                const statements: IfStatement[] = []
                for (let index = start; index < end; index++) {
                    const attribute = attributeTypes[index];
                    if (this.noNeedPrintModifier(attribute)) {
                        return;
                    }
                    const expr = `${this.generateFiledFlag(attribute, index, true)} != ${AttributeUpdaterFlag.INITIAL}`
                    const params: LanguageExpression[] = attribute.args.map((_, index) => {
                        return writer.makeCast(
                            writer.makeString(`modifier.${this.generateFiledName(attribute, index.toString())}`),
                            idl.maybeOptional(attribute.method.method.signature.args[index], attribute.method.method.signature.isArgOptional(index)),
                        )
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
                    switchPrinter.print(`case ${AttributeUpdaterFlag.SKIP}: {`)
                    switchPrinter.pushIndent()
                    switchPrinter.print(`${statement.asString()};`)
                    switchPrinter.print(`break;`)
                    switchPrinter.popIndent()
                    switchPrinter.print(`}`)
                    switchPrinter.print(`default: {`)
                    if (attribute.isOptional) {
                        switchPrinter.pushIndent()
                        switchPrinter.print(`${resetStatement.asString()};`)
                        switchPrinter.popIndent()
                    }
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
                }
                writer.writeStatements(...statements)
            }
            writer.popIndent()
            writer.print(`}`)
        }
    }

    private hasHeirs(peer: PeerClass) {
        const component = findComponentByName(this.library, peer.componentName)
        if (!component) {
            throw new Error(`Can not find component with name ${peer.componentName}`)
        }
        return collectComponents(this.library).some(it => {
            return getSuper(it.attributeDeclaration, this.library) === component?.attributeDeclaration
        })
    }

    private hasParent(peer: PeerClass) {
        const component = findComponentByName(this.library, peer.componentName)
        if (!component) {
            throw new Error(`Can not find component with name ${peer.componentName}`)
        }
        return getSuper(component.attributeDeclaration, this.library) !== undefined
    }

    printModifiers(modifierInfo: ModifierInfo): PrinterResult[] {
        const peer = modifierInfo.peer
        const component = findComponentByName(this.library, peer.componentName)!
        const isAbstract = !modifierInfo.isParent && !(modifierInfo.isTrivial ?? true)
        const modifierName = this.generateAttributeSetName(modifierInfo)
        const baseModifierMethods = [
            'applyNormalAttribute',
            'applyPressedAttribute',
            'applyFocusedAttribute',
            'applyDisabledAttribute',
            'applySelectedAttribute'
        ]
        const componentAttribute = component.attributeDeclaration;
        let abstractMethods = modifierInfo.modifier?.methods ?? []
        const classWithLogicName = modifierInfo.isParent ?
            this.generateAuxiliaryClassName(modifierInfo) :
            modifierName
        const generateLogic: PrinterResult['generate'] = () => {
            const printer = this.library.createLanguageWriter();
            const nameConvertor = this.library.createTypeNameConvertor(this.library.language)
            const compAttributteConverted = nameConvertor.convert(componentAttribute)
            let extendsInterface: string[] = this.hasHeirs(peer) ?
                [`${compAttributteConverted}`] :
                [`${compAttributteConverted}`, `AttributeModifier<${compAttributteConverted}>`]

            const attributeTypes: Array<AttributeType> = new Array

            const noNeedPrintModifier = (attribute: AttributeType) => {
                return !idl.isPrimitiveType(attribute.method.method.signature.returnType, 'this')
            }

            this.collectAttributes(peer, attributeTypes)

            const collectedHooks: string[] = []

            abstractMethods = abstractMethods.filter(method => {
                return (!baseModifierMethods.includes(method.name) || method.parameters.length != 1)
            })
            const parentSet = this.generateAttributeSetParentName(modifierInfo)

            printer.writeClass(classWithLogicName, (writer) => {
                if (!this.hasParent(peer)) {
                    writer.print("_instanceId: number = -1;")
                    writer.print("_state: ModifierState = new ModifierState;")
                }
                writer.print(`private ${this.generateAddrName(peer)}: ArrayBuffer = new ArrayBuffer(4096);`)
                writer.print(`private ${this.generateFilledFlagName(peer)}: Uint8Array = new Uint8Array(this.${this.generateAddrName(peer)});`)

                if (isAbstract) {
                    writer.writeStaticInitBlock(writer => {
                        writer.print(
                            `const _check: ${
                                this.generateAttributeSetDerivedName(modifierInfo)} | undefined = undefined`)
                    })
                }

                writer.print(`constructor() {`)
                writer.pushIndent()
                if (modifierInfo.parent) writer.print(`super();`)
                writer.print(`this.${this.generateFilledFlagName(peer)}.fill(0);`)
                writer.popIndent()
                writer.print(`}`)

                if (!this.hasParent(peer)) {
                    writer.writeMethodImplementation(new Method(
                        `setInstanceId`,
                        new NamedMethodSignature(idl.createPrimitiveType('void'),
                            [idl.createPrimitiveType('number')], ['instanceId'], [], [], [])),
                        writer => {
                            writer.writeStatement(writer.makeAssign('this._instanceId', undefined, writer.makeString('instanceId'), false))
                        }
                    )
                }

                if (!modifierInfo.isParent) {
                    writer.print(`isUpdater: () => boolean = () => false`)
                    baseModifierMethods.forEach(method => {
                        const methodName = modifierInfo.isParent ? `${method}${peer.componentName}` : method
                        writer.print(`${methodName}(instance: ${compAttributteConverted}): void { }`)
                    })
                }
                attributeTypes.forEach((attribute, index) => {
                    attribute.argTypes.forEach((t, index) => {
                        const onlyNull = idl.isOptionalType(t) && idl.hasExtAttribute(t, idl.IDLExtendedAttributes.UnionOnlyNull)
                        const initExpr = onlyNull ? writer.makeNull(t) : undefined
                        writer.writeFieldDeclaration(this.generateFiledName(attribute, index.toString()), t, [], !onlyNull, initExpr)
                    })
                })

                this.printApplyModifierPatch(peer, writer, component, attributeTypes, modifierInfo.parent !== undefined, collectedHooks, modifierInfo.isParent)
                this.printMergeModifier(peer, writer, classWithLogicName, attributeTypes, modifierInfo.parent !== undefined, modifierInfo.isParent)

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
                            this.printHookedMethodBody(attribute.method.method, hookMethod.hookName, index, writer)
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
                const attributeModifierMethodName = modifierInfo.isParent ? `attributeModifier${peer.componentName}` : `attributeModifier`
                writer.writeMethodImplementation(new Method(attributeModifierMethodName, attributeModifierSignature, [MethodModifier.PUBLIC]), writer => {
                    writer.writeStatement(writer.makeThrowError("Not implemented"))
                })
                if (!modifierInfo.isParent) {
                    abstractMethods.forEach((method => {
                        const signature = new NamedMethodSignature(method.returnType,
                            method.parameters.map(param => param.type),
                            method.parameters.map(param => param.name))
                        writer.writeMethodDeclaration(method.name, signature, [MethodModifier.ABSTRACT])
                    }))
                }
            }, parentSet, modifierInfo.isParent ? [compAttributteConverted] : extendsInterface, undefined, undefined, !modifierInfo.isParent && abstractMethods.length > 0)

            const collector = this.printImports(modifierInfo)
            collector.addFeatures(collectedHooks, HandwrittenModule(this.library.language))

            return {
                content: printer,
                imports: collector,
            }
        }

        const needInterface = modifierInfo.modifier !== undefined && modifierInfo.isTrivial === true
        const logicPrinter: PrinterResult = {
            generate: generateLogic,
            over: this.getLayoutTargetDescription(modifierInfo, needInterface, component.attributeDeclaration)
        }
        let results = [ logicPrinter ]

        // If the corresponding component has heirs requiring modifiers, modifier interface should be generated
        // separately
        if (modifierInfo.modifier && modifierInfo.isParent) {
            const generateInterface: PrinterResult['generate'] = () => {
                const printer = this.library.createLanguageWriter()
                const nameConvertor = this.library.createTypeNameConvertor(this.library.language)
                const compAttributteConverted = nameConvertor.convert(componentAttribute)

                let extendsInterface: string[] = [
                    `${compAttributteConverted}`, `AttributeModifier<${compAttributteConverted}>`
                ]
                printer.writeClass(modifierName, (writer) => {
                    if (!(modifierInfo.isTrivial ?? true)) {
                        writer.writeStaticInitBlock(writer => {
                            writer.print(
                                `const _check: ${
                                    this.generateAttributeSetDerivedName(modifierInfo)} | undefined = undefined`)
                        })
                    }
                    writer.print(`isUpdater: () => boolean = () => false`)
                    for (const method of baseModifierMethods) {
                        writer.print(`${method}(instance: ${compAttributteConverted}): void { }`)
                    }
                    writer.writeMethodImplementation(new Method(`applyModifierPatch`,
                        new NamedMethodSignature(
                            idl.createPrimitiveType('void'),
                            [idl.createReferenceType("arkui.PeerNode.PeerNode")],
                            ['node'], [], [], [])),
                        writer => {
                            writer.print(`super.applyModifierPatch${peer.componentName}(node)`)
                        }
                    )
                    writer.print(
                        `mergeModifier(modifier: ${this.generateAttributeSetDerivedName(modifierInfo)}): void {`)
                    writer.pushIndent()
                    {
                        writer.print(`super.mergeModifier${peer.componentName}(modifier)`)
                    }
                    writer.popIndent()
                    writer.print('}')
                    abstractMethods.forEach((method => {
                        const signature = new NamedMethodSignature(method.returnType,
                            method.parameters.map(param => param.type),
                            method.parameters.map(param => param.name))
                        writer.writeMethodDeclaration(method.name, signature, [MethodModifier.ABSTRACT])
                    }))
                }, classWithLogicName, extendsInterface, undefined, undefined, abstractMethods.length > 0)

                const collector = this.printImports(modifierInfo)

                return {
                    content: printer,
                    imports: collector,
                }
            }

            results.push({
                generate: generateInterface,
                over: this.getLayoutTargetDescription(modifierInfo, true, component.attributeDeclaration)
            })
        }

        return results
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

function isOptionOnlyNull(attribute: AttributeType): boolean {
    const args = attribute.method.method.signature.args
    if (args.length == 0) return false
    const type = args[0]
    return idl.hasExtAttribute(type, idl.IDLExtendedAttributes.UnionOnlyNull)
}
