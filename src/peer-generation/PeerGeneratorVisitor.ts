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

import * as ts from "typescript"
import {
    asString,
    capitalize,
    componentName,
    dropSuffix,
    identName,
    isCommonMethodOrSubclass,
    isDefined,
    mapType,
    nameOrNull,
    renameDtsToPeer,
    serializerBaseMethods,
    stringOrNone,
    throwException
} from "../util"
import { GenericVisitor } from "../options"
import { IndentedPrinter } from "../IndentedPrinter"
import {
    ArgConvertor,
} from "./Convertors"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { DeclarationTable } from "./DeclarationTable"
import {
    determineParentRole,
    InheritanceRole,
    isCommonMethod,
    isHeir,
    isRoot,
    isStandalone,
    parentName
} from "./inheritance"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8
}

/**
 * Theory of operations.
 *
 * We use type definition as "grammar", and perform recursive descent to terminal nodes of such grammar
 * generating serialization code. We use TS typechecker to analyze compound and union types and generate
 * universal finite automata to serialize any value of the given type.
 */


export interface TypeAndName {
    type: ts.TypeNode
    name: string
    optional: boolean
}

type MaybeCollapsedMethod = {
    method: ts.MethodDeclaration | ts.MethodSignature,
    collapsed?: {
        paramsDecl: string,
        paramsUsage: string
    }
}

export type PeerGeneratorVisitorOptions = {
    sourceFile: ts.SourceFile
    typeChecker: ts.TypeChecker
    interfacesToGenerate: Set<string>
    nativeModuleMethods: string[]
    nativeModuleEmptyMethods: string[]
    outputC: string[]
    nodeTypes: string[]
    apiHeaders: string[]
    apiHeadersList: string[]
    dummyImpl: string[]
    dummyImplModifiers: string[]
    dummyImplModifierList: string[]
    dumpSerialized: boolean
    declarationTable: DeclarationTable
}

export class PeerGeneratorVisitor implements GenericVisitor<stringOrNone[]> {
    private typesToGenerate: string[] = []
    private seenAttributes = new Set<string>()
    private readonly sourceFile: ts.SourceFile
    private interfacesToGenerate: Set<string>
    private printerNativeModule: IndentedPrinter
    private printerNativeModuleEmpty: IndentedPrinter
    private printerNodeTypes: IndentedPrinter
    private apiPrinter: IndentedPrinter
    private apiPrinterList: IndentedPrinter
    private dummyImpl: IndentedPrinter
    private dummyImplModifiers: IndentedPrinter
    private dummyImplModifierList: IndentedPrinter
    private dumpSerialized: boolean
    declarationTable: DeclarationTable

    static readonly serializerBaseMethods = serializerBaseMethods()
    readonly typeChecker: ts.TypeChecker

    constructor(options: PeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.typeChecker = options.typeChecker
        this.interfacesToGenerate = options.interfacesToGenerate
        this.printerC = new IndentedPrinter(options.outputC)
        this.printerNativeModule = new IndentedPrinter(options.nativeModuleMethods)
        this.printerNativeModuleEmpty = new IndentedPrinter(options.nativeModuleEmptyMethods)
        this.printerNodeTypes = new IndentedPrinter(options.nodeTypes)
        this.apiPrinter = new IndentedPrinter(options.apiHeaders)
        this.apiPrinterList = new IndentedPrinter(options.apiHeadersList)
        this.dummyImpl = new IndentedPrinter(options.dummyImpl)
        this.dummyImplModifiers = new IndentedPrinter(options.dummyImplModifiers)
        this.dummyImplModifierList = new IndentedPrinter(options.dummyImplModifierList)
        this.dumpSerialized = options.dumpSerialized
        this.declarationTable = options.declarationTable
    }

    assignName(type: ts.TypeNode, name: string, optional: boolean) {
        let current = this.namedTypes.get(type)
        if (!current) {
            current = [optional ? "" : name, optional ? name : `Optional_${name}`]
        } else {
            current[optional ? 1 : 0] = name
        }
        this.namedTypes.set(type, current)
    }

    requestType(name: string|undefined, type: ts.TypeNode) {
        this.declarationTable.requestType(name, type)
    }

    private importStatements(currentFileName: string): string[] {
        return PeerGeneratorConfig.exports
            .filter(it => !currentFileName.endsWith(`/${it.file}.d.ts`))
            .map(it => {
                const entities = it.components
                    .flatMap(it => [`Ark${it}Peer`, `Ark${it}Attributes`])
                    .map(it => `  ${it}`)
                    .join(",\n")
                return `import {\n${entities}\n} from "./${renameDtsToPeer(it.file, false)}"`
            })
    }

    visitWholeFile(): stringOrNone[] {
        this.importStatements(this.sourceFile.fileName)
            .concat([
                `import { runtimeType, withLength, withLengthArray, RuntimeType } from "./SerializerBase"`,
                `import { Serializer } from "./Serializer"`,
                `import { int32, KPointer } from "./types"`,
                `import { nativeModule } from "./NativeModule"`,
                `import { PeerNode, Finalizable, nullptr } from "./Interop"`,
                `import { ArkUINodeType } from "./ArkUINodeType"`,
                `import { ArkComponent } from "@arkoala/arkui/ArkComponent"`
            ])
            .forEach(it => this.printTS(it))
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.printerTS.getOutput()
    }

    resultC(): string[] {
        return this.printerC.getOutput()
    }

    private isRootMethodInheritor(decl: ts.ClassDeclaration | ts.InterfaceDeclaration): boolean {
        if (ts.isClassDeclaration(decl)) {
            return isCommonMethodOrSubclass(this.typeChecker, decl)
        }
        return false
    }

    needsPeer(decl: ts.ClassDeclaration | ts.InterfaceDeclaration): boolean {
        let name = decl.name?.text
        if (!name) return false
        if (PeerGeneratorConfig.skipPeerGeneration.includes(name)) return false

        if (this.interfacesToGenerate.size > 0) {
            return this.interfacesToGenerate.has(name)
        }

        if (isStandalone(name)) return true
        if (isRoot(name)) return true
        if (this.isRootMethodInheritor(decl)) return true
        return false
    }

    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node)) {
            this.processClass(node)
        } else if (ts.isInterfaceDeclaration(node)) {
            this.processInterface(node)
        } else if (ts.isModuleDeclaration(node)) {
            if (node.body && ts.isModuleBlock(node.body)) {
                node.body.statements.forEach(it => this.visit(it))
            }
        } else if (ts.isVariableStatement(node) ||
            ts.isExportDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            node.kind == ts.SyntaxKind.EndOfFileToken) {
            // Do nothing.
        } else {
            throw new Error(`Unknown node: ${node.kind}`)
        }
    }

    private processClass(node: ts.ClassDeclaration): void {
        if (!this.needsPeer(node)) return
        const collapsedMethods = this.collapseOverloads(node)

        this.prologue(node)
        this.generateConstructor(node)
        collapsedMethods.forEach(it => this.processMethod(node, it))
        this.generateApplyMethod(node)
        this.epilogue(node)

        this.createComponentAttributesDeclaration(node)
        this.generateAttributesValuesInterfaces()
        this.nativeModulePrint(node, collapsedMethods)

        this.printNodeType(node)
    }

    processInterface(node: ts.InterfaceDeclaration) {
        if (!this.needsPeer(node)) return
        this.prologue(node)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.processConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.processMethod(node, { method: child })
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.popIndentTS()
        this.epilogue(node)
        this.generateAttributesValuesInterfaces()
    }

    processConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
    }

    generateParams(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param =>
            `${nameOrNull(param.name)}${param.questionToken ? "?" : ""}: ${mapType(this.typeChecker, param.type)}`
        ).join(", ")
    }

    generateValues(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param => `${nameOrNull(param.name)}`).join(", ")
    }

    printTS(value: stringOrNone) {
        this.printerTS.print(value)
    }

    printC(value: stringOrNone) {
        this.printerC.print(value)
    }

    printAPI(value: stringOrNone) {
        this.apiPrinter.print(value)
    }

    printDummy(value: stringOrNone) {
        this.dummyImpl.print(value)
    }

    printDummyModifier(value: stringOrNone) {
        this.dummyImplModifiers.print(value)
    }

    printDummyModifierList(value: stringOrNone) {
        this.dummyImplModifierList.print(value)
    }

    printNodeModifier(value: stringOrNone) {
        this.apiPrinterList.print(`const ArkUI${value}Modifier* (*get${value}Modifier)();`)
        const modifierStructImpl = `ArkUI${value}ModifierImpl`
        this.dummyImplModifiers.print(`ArkUI${value}Modifier ${modifierStructImpl} {`)
        this.dummyImplModifierList.pushIndent()
        this.dummyImplModifierList.print(`Get${value}Modifier,`)
        this.dummyImplModifierList.popIndent()
    }

    private seenMethods = new Set<string>()

    processMethod(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, { method, collapsed }: MaybeCollapsedMethod): void {
        const clazzName = identName(clazz.name)!
        const methodName = identName(method.name)!
        const fullMethodName = this.peerMethodName(methodName)

        let isComponent = false
        if (PeerGeneratorConfig.ignorePeerMethod.includes(methodName)) return

        method.parameters.map((param, index) => {
            if (param.type)
                this.requestType(`Type_${clazzName}_${methodName}_Arg${index}`, param.type)
        })
        const hasReceiver = true // TODO: make it false for non-method calls.
        const componentName = ts.idText(clazz.name as ts.Identifier)
        const argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        const retConvertor = this.retConvertor(method.type)
        const suffix = this.generateCMacroSuffix(argConvertors, retConvertor, hasReceiver)

        console.log(`processing ${componentName}.${methodName}`)

        const apiParameters = this.generateAPIParameters(argConvertors).join(", ")
        const implName = `${capitalize(clazzName)}_${capitalize(fullMethodName)}Impl`
        const retType = this.maybeCRetType(retConvertor) ?? "void"
        this.printAPI(`${retType} (*${fullMethodName})(${apiParameters});`)
        this.printDummyModifier(`${implName},`)

        this.printDummy(`${retType} ${implName}(${apiParameters}) {`)
        this.dummyImpl.pushIndent()
        this.printDummy(`string out("${methodName}(");`)
        method.parameters.forEach((param, index) => {
            if (index > 0) this.printDummy(`out.append(", ");`)
            this.printDummy(`WriteToString(&out, ${identName(param.name)});`)
        })
        this.printDummy(`out.append(")");`)
        this.printDummy(`appendGroupedLog(1, out);`)
        if (retType != "void") this.printDummy(`return 0;`)
        this.dummyImpl.popIndent()
        this.printDummy(`}`)

        this.seenMethods.add(methodName)
        const paramsDecl = collapsed?.paramsDecl ?? this.generateParams(method.parameters)
        this.printTS(`${methodName}Attribute(${paramsDecl}) {`)
        let cName = `${componentName}_${methodName}`
        this.printC(`${retConvertor.nativeType()} impl_${cName}(${this.generateCParameters(argConvertors).join(", ")}) {`)
        this.pushIndentBoth()
        if (isComponent) {
            this.printTS(`if (this.checkPriority("${methodName}")) {`)
            this.pushIndentTS()
            const paramsUsage = collapsed?.paramsUsage ?? this.generateValues(method.parameters)
            this.printTS(`this.peer?.${methodName}Attribute(${paramsUsage}`)
            this.popIndentTS()
            this.printTS(`}`)
        } else {
            let isStub = false
            if (isStub) {
                this.printTS(`throw new Error("${methodName}Attribute() is not implemented")`)
            } else {
                let name = `${methodName}`
                this.generateNativeBody(componentName, methodName, name, argConvertors, hasReceiver, retConvertor.isVoid)
            }
        }
        this.popIndentBoth()
        this.printC(`}`)
        let macroArgs = [cName, this.maybeCRetType(retConvertor)].concat(this.generateCParameterTypes(argConvertors, hasReceiver))
            .filter(isDefined)
            .join(", ")
        this.printC(`KOALA_INTEROP_${suffix}(${macroArgs})`)
        this.printC(` `)

        this.printTS(`}`)
    }

    generateCParameters(argConvertors: ArgConvertor[]): string[] {
        return (["KNativePointer nodePtr"].concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t* ${it.param}Array, int32_t ${it.param}Length`
            } else {
                let type = it.interopType(false)
                return `${type == "KStringPtr" ? "const KStringPtr&" : type} ${it.param}`
            }
        })))
    }

    generateCParameterTypes(argConvertors: ArgConvertor[], hasReceiver: boolean): string[] {
        const receiver = hasReceiver ? ['KNativePointer'] : []
        return receiver.concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t*, int32_t`
            } else {
                return it.interopType(false)
            }
        }))
    }

    maybeCRetType(retConvertor: RetConvertor): string | undefined {
        if (retConvertor.isVoid) return undefined
        return retConvertor.nativeType()
    }

    generateCMacroSuffix(argConvertors: ArgConvertor[], retConvertor: RetConvertor, hasReceiver: boolean) {
        let counter = hasReceiver ? 1 : 0
        argConvertors.forEach(it => {
            if (it.useArray) {
                counter += 2
            } else {
                counter += 1
            }
        })
        return `${retConvertor.macroSuffixPart()}${counter}`
    }

    modifierSection(clazzName: string) {
        // TODO: may be need some translation tables?
        let clazz = dropSuffix(dropSuffix(clazzName, "Method"), "Attribute")
        return `get${capitalize(clazz)}Modifier()`
    }

    peerMethodName(methodName: string) {
        if (methodName.startsWith("set") || methodName.startsWith("get")) return methodName
        return `set${capitalize(methodName)}`
    }

    generateAPIParameters(argConvertors: ArgConvertor[]): string[] {
        return (["ArkUINodeHandle node"].concat(argConvertors.map(it => {
            let isPointer = it.isPointerType()
            return `${isPointer ? "const ": ""}${it.nativeType(false)}${isPointer ? "*": ""} ${it.param}`
        })))
    }

    // TODO: may be this is another method of ArgConvertor?
    apiArgument(argConvertor: ArgConvertor): string {
        const prefix = argConvertor.isPointerType() ? "&": "    "
        if (argConvertor.useArray) return `${prefix}${argConvertor.param}Value`
        return `${argConvertor.convertorCArg(argConvertor.param)}`
    }

    generateAPICall(clazzName: string, methodName: string, hasReceiver: boolean, argConvertors: ArgConvertor[], isVoid: boolean) {
        const api = "GetNodeModifiers()"
        const modifier = this.modifierSection(clazzName)
        const method = this.peerMethodName(methodName)
        const receiver = hasReceiver ? ['node'] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.apiArgument(it))).join(", ")
        this.printC(`${isVoid ? "" : "return "}${api}->${modifier}->${method}(${args});`)
    }

    generateNativeBody(clazzName: string, originalMethodName: string, methodName: string, argConvertors: ArgConvertor[], hasReceiver: boolean, isVoid: boolean) {
        this.pushIndentBoth()
        if (hasReceiver) {
            this.printC("ArkUINodeHandle node = reinterpret_cast<ArkUINodeHandle>(nodePtr);")
        }
        let scopes = argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            this.pushIndentTS()
            this.printTS(it.scopeStart?.(it.param))
        })
        argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                this.printTS(`const ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToTSSerial(it.param, it.param, this.printerTS)
                this.printC(`Deserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                this.printC(`${it.nativeType(false)} ${it.param}Value;`)
                it.convertorToCDeserial(it.param, `${it.param}Value`, this.printerC)
            }
        })
        // Enable to see serialized data.
        if (this.dumpSerialized) {
            argConvertors.forEach((it, index) => {
                if (it.useArray) {
                    this.printTS(`console.log("${it.param}:", ${it.param}Serializer.asArray(), ${it.param}Serializer.length())`)
                }
            })
        }
        this.printTS(`nativeModule()._${clazzName}_${methodName}(this.ptr${argConvertors.length > 0 ? ", " : ""}`)
        this.pushIndentTS()
        argConvertors.forEach((it, index) => {
            let maybeComma = index == argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.printTS(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
                this.printTS(it.convertorTSArg(it.param))
            this.printTS(maybeComma)
        })
        this.popIndentTS()
        this.printTS(`)`)
        scopes.reverse().forEach(it => {
            this.popIndentTS()
            this.printTS(it.scopeEnd!(it.param))
        })
        this.generateAPICall(clazzName, originalMethodName, hasReceiver, argConvertors, isVoid)
        this.popIndentBoth()
    }

    private printerTS = new IndentedPrinter()
    private printerC = new IndentedPrinter()

    pushIndentBoth() {
        this.printerTS.pushIndent()
        this.printerC.pushIndent()
    }
    popIndentBoth() {
        this.printerTS.popIndent()
        this.printerC.popIndent()
    }
    pushIndentTS() {
        this.printerTS.pushIndent()
    }
    popIndentTS() {
        this.printerTS.popIndent()
    }
    pushIndentC() {
        this.printerC.pushIndent()
    }
    popIndentC() {
        this.printerC.popIndent()
    }
    pushIndentAPI() {
        this.apiPrinter.pushIndent()
    }
    popIndentAPI() {
        this.apiPrinter.popIndent()
    }
    pushIndentAPIList() {
        this.apiPrinterList.pushIndent()
    }
    popIndentAPIList() {
        this.apiPrinterList.popIndent()
    }
    pushIndentDummyImpl() {
        this.dummyImpl.pushIndent()
    }
    popIndentDummyImpl() {
        this.dummyImpl.popIndent()
    }
    pushIndentDummyModifiers() {
        this.dummyImplModifiers.pushIndent()
    }
    popIndentDummyModifiers() {
        this.dummyImplModifiers.popIndent()
    }

    argConvertor(param: ts.ParameterDeclaration): ArgConvertor {
        if (!param.type) throw new Error("Type is needed")
        let paramName = asString(param.name)
        let optional = param.questionToken !== undefined
        //if (optional) this.generateTypedef(param.type, undefined, true)
        return this.declarationTable.typeConvertor(paramName, param.type, optional)
    }

    retConvertor(typeNode?: ts.TypeNode): RetConvertor {
        let nativeType = typeNode ? mapCInteropRetType(typeNode) : "void"
        let isVoid = nativeType == "void"
        return {
            isVoid: isVoid,
            nativeType: () => nativeType,
            macroSuffixPart: () => isVoid ? "V" : ""
        }
    }

    processProperty(property: ts.PropertyDeclaration | ts.PropertySignature) {
        throw new Error(`unexpected property ${property.name.getText(this.sourceFile)}`)
    }

    prologue(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const koalaComponentName = this.renameToKoalaComponent(nameOrNull(node.name)!)
        const componentName = this.renameToComponent(nameOrNull(node.name)!)
        const peerParentName = this.peerParentName(node)

        const extendsClause =
            peerParentName
                ? `extends ${peerParentName} `
                : ""
        this.printTS(`export class ${koalaComponentName}Peer ${extendsClause} {`)
        this.pushIndentTS()
        this.printAPI(`struct ArkUI${componentName}Modifier {`)
        this.pushIndentAPI()
        this.pushIndentAPIList()
        this.printNodeModifier(componentName)
        this.pushIndentDummyModifiers()
    }

    private peerParentName(component: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        const name = componentName(component)
        if (isCommonMethod(name)) return "PeerNode"
        if (isStandalone(name)) return "PeerNode"
        if (isRoot(name)) return "Finalizable"

        const parent = parentName(component)
            ?? throwException(`Expected component to have parent: ${name}`)
        return `${this.renameToKoalaComponent(parent)}Peer`
    }

    private attributesParentName(component: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
        if (!isHeir(componentName(component))) return undefined

        const parent = parentName(component) ?? throwException(`Heir component must have parent: ${componentName}`)
        return `${this.renameToKoalaComponent(parent)}Attributes`
    }

    private renameToComponent(name: string): string {
        return name
            .replace("Attribute", "")
            .replace("Method", "")
    }

    private renameToKoalaComponent(name: string): string {
        return "Ark" + this.renameToComponent(name)
    }

    private epilogue(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        this.popIndentTS()
        this.printTS(`}`)
        this.popIndentAPI()
        this.printAPI(`};\n`)
        this.popIndentAPIList()
        this.popIndentDummyModifiers()
        this.printDummyModifier(`};\n`)
        const name = this.renameToComponent(nameOrNull(node.name)!)
        this.printDummyModifier(`const ArkUI${name}Modifier* Get${name}Modifier() { return &ArkUI${name}ModifierImpl; }\n\n`)
    }

    private generateApplyMethod(node: ts.ClassDeclaration): void {
        const name = componentName(node).replace("Attribute", "")

        const typeParam = this.renameToKoalaComponent(name) + "Attributes"
        if (isRoot(name)) {
            this.printTS(`applyAttributes(attributes: ${typeParam}): void {`)
            this.pushIndentTS()
            this.printTS(`super.constructor(42)`)
            this.popIndentTS()
            this.printTS(`}`)
            return
        }

        this.printTS(`applyAttributes<T extends ${typeParam}>(attributes: T): void {`)
        this.pushIndentTS()
        this.printTS(`super.applyAttributes(attributes)`)
        this.popIndentTS()
        this.printTS(`}`)
    }

    private generateConstructor(node: ts.ClassDeclaration): void {
        const parentRole = determineParentRole(node)

        if (parentRole === InheritanceRole.Finalizable) {
            this.printTS(`constructor(type?: ArkUINodeType, component?: ArkComponent, flags: int32 = 0) {`)
            this.pushIndentTS()
            this.printTS(`super(BigInt(42)) // for now`)
            this.popIndentTS()
            this.printTS(`}`)
            return
        }
        if (parentRole === InheritanceRole.PeerNode) {
            this.printTS(`constructor(type: ArkUINodeType, component?: ArkComponent, flags: int32 = 0) {`)
            this.pushIndentTS()
            this.printTS(`super(type, flags)`)
            this.printTS(`component?.setPeer(this)`)
            this.popIndentTS()
            this.printTS(`}`)
            return
        }

        if (parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
            this.printTS(`constructor(type: ArkUINodeType, component?: ArkComponent, flags: int32 = 0) {`)
            this.pushIndentTS()
            this.printTS(`super(type, component, flags)`)
            this.popIndentTS()
            this.printTS(`}`)
            return
        }

        throwException(`Unexpected parent inheritance role: ${parentRole}`)
    }

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration): void {
        const component = nameOrNull(node.name)!.replace("Attribute", "")
        const koalaComponent = this.renameToKoalaComponent(component)
        if (PeerGeneratorConfig.invalidAttributes.includes(koalaComponent)) {
            this.printTS(`export interface ${koalaComponent}Attributes {}`)
            return
        }
        const parent = this.attributesParentName(node)
        const extendsClause =
            parent
                ? ` extends ${parent} `
                : ""
        this.printTS(`export interface ${this.renameToKoalaComponent(component)}Attributes ${extendsClause} {`)
        this.pushIndentTS()
        node.members.forEach(child => {
            if (ts.isMethodDeclaration(child)) {
                this.processOptionAttribute(child)
            }
        })
        this.popIndentTS()
        this.printTS("}")
    }

    private processOptionAttribute(method: ts.MethodDeclaration | ts.MethodSignature): void {
        const methodName = method.name.getText(this.sourceFile)
        if (this.seenAttributes.has(methodName)) {
            console.log(`WARNING: ignore seen method: ${methodName}`)
            return
        }
        if (method.parameters.length != 1) {
            // We only convert one argument methods to attributes.
            return
        }
        this.seenAttributes.add(methodName)
        const type = this.argumentType(methodName, method.parameters)
        this.printTS(`${methodName}?: ${type}`)
    }

    private argumentType(methodName: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        const argumentTypeName = capitalize(methodName) + "ValuesType"
        if (parameters.length === 1 && ts.isTypeLiteralNode(parameters[0].type!)) {
            const typeLiteralStatements = parameters[0].type!.members
                .map(it => {
                    // TODO: properly support IndexSignature
                    if (ts.isIndexSignatureDeclaration(it)) {
                        return {
                            name: "indexed",
                            type: it.type,
                            questionToken: !!it.questionToken
                        }
                    }
                    if (!ts.isPropertySignature(it)) {
                        throw new Error(`Expected type literal property to be ts.PropertySignature, not ${asString(it)} got "${it.getText()}"`)
                    }
                    return {
                        name: asString(it.name),
                        type: it.type!,
                        questionToken: !!it.questionToken
                    }
                })

            this.typesToGenerate.push(
                this.createParameterType(argumentTypeName, typeLiteralStatements)
            )
            return argumentTypeName
        }
        if (parameters.length > 2) {
            const attributeInterfaceStatements = parameters.map(it => ({
                name: asString(it.name),
                type: it.type!,
                questionToken: !!it.questionToken
            }))
            this.typesToGenerate.push(
                this.createParameterType(argumentTypeName, attributeInterfaceStatements)
            )
            return argumentTypeName
        }

        return parameters.map(it => mapType(this.typeChecker, it.type)).join(', ')
    }

    private createParameterType(
        name: string,
        attributes: { name: string, type: ts.TypeNode, questionToken: boolean }[]
    ): string {
        const attributeDeclarations = attributes
            .map(it => `\n  ${it.name}${it.questionToken ? "?" : ""}: ${mapType(this.typeChecker, it.type)}`)
            .join('')
        return `export interface ${name} {${attributeDeclarations}\n}`
    }

    private generateAttributesValuesInterfaces() {
        this.typesToGenerate.forEach((value: string) => {
            this.printTS(value)
        })
    }

    private collapseOverloads(node: ts.ClassDeclaration): MaybeCollapsedMethod[] {
        const methods = node.members.filter(ts.isMethodDeclaration)
        const groupedByName = new Map<string, ts.MethodDeclaration[]>(
            methods.map(it => [it.name.getText(), []])
        )
        methods.forEach(it => {
            groupedByName.get(it.name.getText())?.push(it)
        })

        return [...groupedByName.keys()].map(name => {
            const overloads = groupedByName.get(name)!
            if (overloads.length == 1) {
                return {
                    method: overloads[0]
                }
            }

            const maxParamsLength = Math.max(...overloads.map(it => it.parameters.length))

            const paramsCollapsed: { types: ts.TypeNode[], name: string, optional?: ts.QuestionToken }[] =
                Array.from({ length: maxParamsLength }, (_, i) => {
                    const typesToUnion = overloads.map(overload =>
                        overload.parameters[i]?.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
                    )
                    return {
                        types: typesToUnion,
                        name: `arg${i}`,
                        optional: overloads.some(overload => overload.parameters[i]?.questionToken)
                            ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                            : undefined
                    }
                })

            const params = paramsCollapsed
                .map(({ types, name, optional }) =>
                    ts.factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        name,
                        optional,
                        ts.factory.createUnionTypeNode(types)
                    )
                )

            const paramsDecl = paramsCollapsed
                .map(it => {
                    const questionToken = it.optional ? "?" : ""
                    const collapsedType = it.types.map(it => {
                        if (it.kind == ts.SyntaxKind.UndefinedKeyword) {
                            return "undefined"
                        }
                        if (ts.isFunctionTypeNode(it)) {
                            return `(${it.getText()})`
                        }
                        return it.getText()
                    }).join(" | ")

                    return `${it.name}${questionToken}: ${collapsedType}`
                })
                .join(", ")

            const paramsUsage = paramsCollapsed
                .map(it =>
                    it.name
                )
                .join(", ")

            return {
                method: ts.factory.createMethodDeclaration(
                    undefined,
                    undefined,
                    name,
                    undefined,
                    undefined,
                    params,
                    undefined,
                    undefined
                ),
                collapsed: {
                    paramsDecl: paramsDecl,
                    paramsUsage: paramsUsage
                }
            }
        })
    }

    namedTypes = new Map<ts.TypeNode, [string, string]>()
    getTypeName(type: ts.TypeNode, optional: boolean = false): string {
        let result = this.namedTypes.get(type)
        let index = optional ? 1 : 0
        if (!result || result[index] == "") {
            let name = this.computeTypeName(type, optional)
            this.requestType(name, type)
            return name
        }
        return result[index]
    }

    computeTypeName(type: ts.TypeNode, optional: boolean = false): string {
        return this.declarationTable.getTypeName(type, optional)
    }

    private nativeModulePrint(parent: ts.ClassDeclaration, methods: MaybeCollapsedMethod[]): void {
        if (parent.name === undefined) throw new Error(`Encountered nameless method ${parent}`)
        const component = ts.idText(parent.name)

        methods.forEach(maybeCollapsedMethod => {
            const basicParameters = maybeCollapsedMethod.method.parameters
                .map(it => this.argConvertor(it))
                .map(it => {
                    if (it.useArray) {
                        const array = `${it.param}Serializer`
                        return `${it.param}Array: Uint8Array, ${array}Length: int32`
                    } else {
                        return `${it.param}: ${it.interopType(true)}`
                    }
                })
            const parameters = ["ptr: NodePointer"]
                .concat(basicParameters)
                .join(", ")

            const originalName = ts.idText(maybeCollapsedMethod.method.name as ts.Identifier)
            const implDecl = `_${component}_${originalName}(${parameters}): void`

            this.printerNativeModule.print(implDecl)
            this.printerNativeModuleEmpty.print(`${implDecl} { console.log("${originalName}") }`)
        })
    }

    private printNodeType(node: ts.ClassDeclaration): void {
        this.printerNodeTypes.print(
            this.renameToComponent(nameOrNull(node.name)!)
        )
    }
}

function mapCInteropRetType(type: ts.TypeNode): string {
    if (type.kind == ts.SyntaxKind.VoidKeyword) {
        return `void`
    }
    if (type.kind == ts.SyntaxKind.NumberKeyword) {
        return `KInt`
    }
    if (ts.isTypeReferenceNode(type)) {
        let name = identName(type.typeName)!
        /* HACK, fix */
        if (name.endsWith("Attribute")) return "void"
        switch (name) {
            /* ANOTHER HACK, fix */
            case "T": return "void"
            case "UIContext": return "KNativePointer"
        }
        console.log(`WARNING: unhandled return type ${type.getText()}`)
        return `void`
    }
    if (type.kind == ts.SyntaxKind.StringKeyword) {
        /* HACK, fix */
        // return `KStringPtr`
        return "void"
    }
    if (ts.isUnionTypeNode(type)) {
        console.log(`WARNING: unhandled union type: ${type.getText()}`)
        // TODO: not really properly supported.
        if (type.types[0].kind == ts.SyntaxKind.VoidKeyword) return "void"
        if (type.types.length == 2 && type.types[1].kind == ts.SyntaxKind.UndefinedKeyword) return `void`
    }
    throw new Error(type.getText())
}

interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}
