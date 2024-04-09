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
    dropSuffix,
    findRealDeclarations,
    forEachExpanding,
    getDeclarationsByNode,
    getNameWithoutQualifiersRight,
    identName,
    importTypeName,
    isCommonMethodOrSubclass,
    isDefined,
    nameOrNull,
    renameDtsToPeer,
    serializerBaseMethods,
    stringOrNone,
    throwException,
    typeEntityName
} from "../util"
import { GenericVisitor } from "../options"
import { IndentedPrinter } from "../IndentedPrinter"
import {
    AggregateConvertor,
    ArgConvertor,
    ArrayConvertor,
    BooleanConvertor,
    EnumConvertor,
    FunctionConvertor,
    InterfaceConvertor,
    LengthConvertor,
    NumberConvertor,
    OptionConvertor,
    StringConvertor,
    TupleConvertor,
    UndefinedConvertor,
    UnionConvertor,
    AnimationRangeConvertor,
    ImportTypeConvertor,
    CustomTypeConvertor
} from "./Convertors"
import { SortingEmitter } from "./SortingEmitter"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";

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

let serializerSeen = new Set<string>()

export interface TypeAndName {
    type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined
    name: string
}

type MaybeCollapsedMethod = {
    method: ts.MethodDeclaration | ts.MethodSignature,
    collapsed?: {
        paramsDecl: string,
        paramsUsage: string
    }
}

export type PeerGeneratorVisitorOptions = {
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    interfacesToGenerate: Set<string>,
    nativeModuleMethods: string[],
    nativeModuleEmptyMethods: string[],
    outputC: string[],
    outputSerializersTS: string[],
    outputSerializersC: string[],
    outputStructsForwardC: string[],
    outputStructsC: SortingEmitter,
    apiHeaders: string[],
    apiHeadersList: string[],
    dummyImpl: string[],
    dummyImplModifiers: string[],
    dummyImplModifierList: string[],
    dumpSerialized: boolean
}

export class PeerGeneratorVisitor implements GenericVisitor<stringOrNone[]> {
    private typesToGenerate: string[] = []
    private seenAttributes = new Set<string>()
    private readonly sourceFile: ts.SourceFile
    private readonly typeChecker: ts.TypeChecker
    private interfacesToGenerate: Set<string>
    private printerNativeModule: IndentedPrinter
    private printerNativeModuleEmpty: IndentedPrinter
    private printerSerializerC: IndentedPrinter
    private printerStructsC: SortingEmitter
    private printerTypedefsC: IndentedPrinter
    private printerSerializerTS: IndentedPrinter
    private serializerRequests: TypeAndName[] = []
    private apiPrinter: IndentedPrinter
    private apiPrinterList: IndentedPrinter
    private dummyImpl: IndentedPrinter
    private dummyImplModifiers: IndentedPrinter
    private dummyImplModifierList: IndentedPrinter
    private dumpSerialized: boolean

    private static readonly serializerBaseMethods = serializerBaseMethods()

    constructor(options: PeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.typeChecker = options.typeChecker
        this.interfacesToGenerate = options.interfacesToGenerate
        this.printerC = new IndentedPrinter(options.outputC)
        this.printerNativeModule = new IndentedPrinter(options.nativeModuleMethods)
        this.printerNativeModuleEmpty = new IndentedPrinter(options.nativeModuleEmptyMethods)
        this.printerSerializerC = new IndentedPrinter(options.outputSerializersC)
        this.printerStructsC = options.outputStructsC
        this.printerTypedefsC = new IndentedPrinter(options.outputStructsForwardC)
        this.printerSerializerTS = new IndentedPrinter(options.outputSerializersTS)
        this.apiPrinter = new IndentedPrinter(options.apiHeaders)
        this.apiPrinterList = new IndentedPrinter(options.apiHeadersList)
        this.dummyImpl = new IndentedPrinter(options.dummyImpl)
        this.dummyImplModifiers = new IndentedPrinter(options.dummyImplModifiers)
        this.dummyImplModifierList = new IndentedPrinter(options.dummyImplModifierList)
        this.dumpSerialized = options.dumpSerialized
    }

    requestType(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (PeerGeneratorVisitor.serializerBaseMethods.includes(`write${name}`)) return
        if (type) {
            this.serializerRequests.push({ type, name })
        }
    }

    serializerName(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined): string {
        this.requestType(name, type)
        return `write${name}`
    }

    deserializerName(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined): string {
        this.requestType(name, type)
        return `read${name}`
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
                `import { runtimeType, withLength, withLengthArray, RuntimeType } from "@arkoala/arkui/utils/ts/SerializerBase"`,
                `import { Serializer } from "./Serializer"`,
                `import { int32, KPointer } from "@arkoala/arkui/utils/ts/types"`,
                `import { nativeModule } from "./NativeModule"`,
                `import { PeerNode, Finalizable, nullptr } from "@arkoala/arkui/utils/ts/Interop"`
            ])
            .forEach(it => this.printTS(it))
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))

        forEachExpanding(this.serializerRequests, (it) => {
            if (serializerSeen.has(it.name)) {
                return
            }
            this.generateSerializer(it.name, it.type)
            this.generateDeserializer(it.name, it.type)
            serializerSeen.add(it.name)
        })

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

        if (PeerGeneratorConfig.standaloneComponents.includes(name)) return true
        if (PeerGeneratorConfig.rootComponents.includes(name)) return true
        if (this.isRootMethodInheritor(decl)) return true
        return false
    }

    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node)) {
            this.processClass(node)
        } else if (ts.isInterfaceDeclaration(node))  {
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
        collapsedMethods.forEach(it => this.processMethod(node, it))
        this.processApplyMethod(node)
        this.epilogue(node)

        this.createComponentAttributesDeclaration(node)
        this.generateAttributesValuesInterfaces()
        this.nativeModulePrint(node, collapsedMethods)
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
        this.processApplyMethod(node)
        this.popIndentTS()
        this.epilogue(node)
        this.generateAttributesValuesInterfaces()
    }

    processConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
    }

    mapType(type: ts.TypeNode | undefined): string {
        if (!type) throw new Error("Cannot map empty type")
        if (ts.isTypeReferenceNode(type)) {
            if (ts.isQualifiedName(type.typeName)) {
                // get the left identifier for the enum qualified name type ref
                let identifierType = asString(type.typeName.left);
                return `${identifierType} /* actual type ${type.getText()} */`
            }
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
            // TODO: plain wrong!
            if (declaration.length == 0) return "any"
            let typeName = asString(type.typeName)
            if (typeName == "AttributeModifier") return "AttributeModifier<this>"
            // TODO: HACK, FIX ME!
            if (typeName == "Style") return "Object"
            if (typeName == "Callback") return "Callback<any>"
            if (typeName != "Array") return typeName
        }
        if (ts.isImportTypeNode(type)) {
            return importTypeName(type, true)
        }
        if (ts.isFunctionTypeNode(type)) {
            return "object"
        }
        let text = type?.getText(this.sourceFile)
        // throw new Error(text)
        if (text == "unknown") text = "any"
        return text ?? "any"
    }

    generateParams(params: ts.NodeArray<ts.ParameterDeclaration>): stringOrNone {
        return params?.map(param =>
            `${nameOrNull(param.name)}${param.questionToken ? "?" : ""}: ${this.mapType(param.type)}`
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
        const capitalizedMethodName = capitalize(methodName)

        let isComponent = false
        if (PeerGeneratorConfig.ignorePeerMethod.includes(methodName)) return
        const hasReceiver = true // TODO: make it false for non-method calls.
        const componentName = ts.idText(clazz.name as ts.Identifier)
        const argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        const retConvertor = this.retConvertor(method.type)
        const suffix = this.generateCMacroSuffix(argConvertors, retConvertor, hasReceiver)

        console.log(`processing ${componentName}.${methodName}`)

        const apiParameters = this.generateAPIParameters(argConvertors).join(", ")
        const implName = `${capitalize(clazzName)}_Set${capitalizedMethodName}Impl`
        this.printAPI(`void (*set${capitalizedMethodName})(${apiParameters});`)
        this.printDummyModifier(`${implName},`)

        this.printDummy(`void ${implName}(${apiParameters}) {`)
        this.dummyImpl.pushIndent()
        this.printDummy(`string out = string("${methodName}(");`)
        method.parameters.forEach((param, index) => {
            if (index > 0) this.printDummy(`out.append(", ");`)
            this.printDummy(`WriteToString(&out, ${identName(param.name)});`)
        })
        this.printDummy(`out.append(")\\n");`)
        this.printDummy(`printf("%s", out.c_str());`)
        this.dummyImpl.popIndent()
        this.printDummy(`}`)

        this.seenMethods.add(methodName)
        const paramsDecl = collapsed?.paramsDecl ?? this.generateParams(method.parameters)
        this.printTS(`${methodName}${isComponent ? "Attribute" : ""}(${paramsDecl}) {`)
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
                this.generateNativeBody(componentName, methodName, name, argConvertors, hasReceiver)
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

    methodSection(methodName: string) {
        return `set${capitalize(methodName)}`
    }

    generateAPIParameters(argConvertors: ArgConvertor[]): string[] {
        return (["ArkUINodeHandle node"].concat(argConvertors.map(it => {
            return `${it.nativeType()} ${it.param}`
        })))
    }

    // TODO: may be this is another method of ArgConvertor?
    apiArgument(argConvertor: ArgConvertor): string {
        if (argConvertor.useArray) return `${argConvertor.param}Value`
        return argConvertor.param
    }

    generateAPICall(clazzName: string, methodName: string, hasReceiver: boolean, argConvertors: ArgConvertor[]) {
        const api = "GetNodeModifiers()"
        const modifier = this.modifierSection(clazzName)
        const method = this.methodSection(methodName)
        const receiver = hasReceiver ? ['node'] : []
        // TODO: how do we know the real amount of arguments of the API functions?
        // Do they always match in TS and in C one to one?
        const args = receiver.concat(argConvertors.map(it => this.apiArgument(it))).join(", ")
        this.printC(`${api}->${modifier}->${method}(${args});`)
    }

    generateNativeBody(clazzName: string, originalMethodName: string, methodName: string, argConvertors: ArgConvertor[], hasReceiver: boolean) {
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
                this.printC(`${it.nativeType()} ${it.param}Value;`)
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
        this.generateAPICall(clazzName, originalMethodName, hasReceiver, argConvertors)
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

    declarationConvertor(param: string, type: ts.TypeReferenceNode, declaration: ts.NamedDeclaration | undefined): ArgConvertor {
        const entityName = typeEntityName(type)
        if (!declaration) {
            return this.customConvertor(entityName, param, type) ?? throwException(`Declaration not found for: ${type.getText()}`)
        }
        const declarationName = ts.idText(declaration.name as ts.Identifier)

        let customConvertor = this.customConvertor(entityName, param, type)
        if (customConvertor) {
            return customConvertor
        }
        if (ts.isTypeReferenceNode(type) && entityName && ts.isQualifiedName(entityName)) {
            const typeOuter = ts.factory.createTypeReferenceNode(entityName.left)
            return new EnumConvertor(param, typeOuter, this)
        }
        if (ts.isEnumDeclaration(declaration)) {
            return new EnumConvertor(param, type, this)
        }
        if (ts.isTypeAliasDeclaration(declaration)) {
            this.requestType(declarationName, type)
            return this.typeConvertor(param, declaration.type)
        }
        if (ts.isInterfaceDeclaration(declaration)) {
            return new InterfaceConvertor(declarationName, param, this, type)
        }
        if (ts.isClassDeclaration(declaration)) {
            return new InterfaceConvertor(declarationName, param, this, type)
        }
        if (ts.isTypeParameterDeclaration(declaration)) {
            console.log(declaration.getText())
            return new CustomTypeConvertor(param, this, identName(declaration.name)!)
        }
        console.log(`${declaration.getText()}`)
        throw new Error(`Unknown kind: ${declaration.kind}`)
    }

    typeConvertor(param: string, type: ts.TypeNode, isOptionalParam = false): ArgConvertor {
        if (isOptionalParam) {
            return new OptionConvertor(param, this, type)
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return new CustomTypeConvertor(param, this, "Object")
        }
        if (type.kind == ts.SyntaxKind.UndefinedKeyword || type.kind == ts.SyntaxKind.VoidKeyword) {
            return new UndefinedConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            throw new Error("Unsupported null")
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return new NumberConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return new StringConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return new BooleanConvertor(param)
        }
        if (ts.isImportTypeNode(type)) {
            return new ImportTypeConvertor(param, this, type)
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)[0]
            return this.declarationConvertor(param, type, declaration)
        }
        if (ts.isUnionTypeNode(type)) {
            return new UnionConvertor(param, this, type)
        }
        if (ts.isTypeLiteralNode(type)) {
            return new AggregateConvertor(param, this, type)
        }
        if (ts.isArrayTypeNode(type)) {
            return new ArrayConvertor(param, this, type.elementType)
        }
        if (ts.isLiteralTypeNode(type)) {
            if (type.literal.kind == ts.SyntaxKind.NullKeyword) {
                return new UndefinedConvertor(param)
            }
            if (type.literal.kind == ts.SyntaxKind.StringLiteral) {
                return new StringConvertor(param)
            }
            throw new Error(`Unsupported literal type: ${type.literal.kind}` + type.getText(this.sourceFile))
        }
        if (ts.isTupleTypeNode(type)) {
            return new TupleConvertor(param, this, type)
        }
        if (ts.isFunctionTypeNode(type)) {
            return new FunctionConvertor(param, this)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.typeConvertor(param, type.type)
        }
        if (ts.isOptionalTypeNode(type)) {
            return new OptionConvertor(param, this, type.type)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return new StringConvertor(param)
        }
        if (ts.isNamedTupleMember(type)) {
            return this.typeConvertor(param, type.type)
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return new CustomTypeConvertor(param, this, "Any")
        }
        console.log(type)
        throw new Error(`Cannot convert: ${asString(type)} ${type.getText(this.sourceFile)}`)
    }

    argConvertor(param: ts.ParameterDeclaration): ArgConvertor {
        if (!param.type) throw new Error("Type is needed")
        let paramName = asString(param.name)
        return this.typeConvertor(paramName, param.type, param.questionToken != undefined)
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

    customConvertor(typeName: ts.EntityName | undefined, param: string, type: ts.TypeReferenceNode | ts.ImportTypeNode): ArgConvertor | undefined {
        let name = getNameWithoutQualifiersRight(typeName)
        if (name === "Length") return new LengthConvertor(param)
        if (name === "AnimationRange") return new AnimationRangeConvertor(param)
        if (name === "Array") return new ArrayConvertor(param, this, type.typeArguments![0])
        if (name === "Callback") return new CustomTypeConvertor(param, this, "Callback")
        if (name === "Optional") return new CustomTypeConvertor(param, this, "Optional")
        if (name === "ContentModifier") return new CustomTypeConvertor(param, this, "ContentModifier")
        return undefined
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

    private parentName(component: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
        const heritage = component.heritageClauses
            ?.filter(it => it.token == ts.SyntaxKind.ExtendsKeyword)

        return heritage?.[0].types[0].expression.getText()
    }

    private peerParentName(component: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
        const componentName = nameOrNull(component.name)!
        const parentName = this.parentName(component)

        if (PeerGeneratorConfig.commonMethod.includes(componentName)) return "PeerNode"
        if (PeerGeneratorConfig.standaloneComponents.includes(componentName)) return "PeerNode" // for now
        if (PeerGeneratorConfig.rootComponents.includes(componentName)) return "Finalizable"

        return parentName
            ? this.renameToKoalaComponent(parentName) + "Peer"
            : "ArkCommonPeer"
    }

    private attributesParentName(component: ts.ClassDeclaration | ts.InterfaceDeclaration): string | undefined {
        const componentName = nameOrNull(component.name)!
        const parentName = this.parentName(component)

        if (PeerGeneratorConfig.commonMethod.includes(componentName)) return undefined
        if (PeerGeneratorConfig.rootComponents.includes(componentName)) return undefined

        return parentName
            ? (this.renameToKoalaComponent(parentName) + "Attributes")
            : undefined
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

    private processApplyMethod(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const component = nameOrNull(node.name)!.replace("Attribute", "")

        const typeParam = this.renameToKoalaComponent(component) + "Attributes"
        if (PeerGeneratorConfig.rootComponents.includes(component)) {
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

        return parameters.map(it => this.mapType(it.type)).join(', ')
    }

    private createParameterType(
        name: string,
        attributes: { name: string, type: ts.TypeNode, questionToken: boolean }[]
    ): string {
        const attributeDeclarations = attributes
            .map(it => `\n  ${it.name}${it.questionToken ? "?" : ""}: ${this.mapType(it.type)}`)
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
                .map(({types, name, optional}) =>
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
            const parameters = ["node: KNativePointer"]
                .concat(basicParameters)
                .join(", ")

            const originalName = ts.idText(maybeCollapsedMethod.method.name as ts.Identifier)
            const implDecl = `_${component}_${originalName}(${parameters}): void`

            this.printerNativeModule.print(implDecl)
            this.printerNativeModuleEmpty.print(`${implDecl} { console.log("${originalName}") }`)
        })
    }

    private generateSerializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (!type || PeerGeneratorConfig.ignoreSerialization.includes(name)) return
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? findRealDeclarations(this.typeChecker, typeName) : []
        if (declarations.length > 0) {
            let declaration = declarations[0]
            // No need for enum serialization methods, we do that in-place.
            if (ts.isEnumDeclaration(declaration)) return

            this.printerSerializerTS.pushIndent()
            this.printerSerializerTS.print(`write${name}(value: ${this.mapType(type)}|undefined) {`)
            this.printerSerializerTS.pushIndent()

            this.printerSerializerTS.print(`const valueSerializer = this`)
            this.printerSerializerTS.print(`if (undefined === value) { valueSerializer.writeInt8(Tags.UNDEFINED); return }`)
            this.printerSerializerTS.print(`valueSerializer.writeInt8(Tags.OBJECT)`)
            if (ts.isImportTypeNode(type)) {
                let typeConvertor = this.typeConvertor("value", type, false)
                typeConvertor.convertorToTSSerial(`value`, `value`, this.printerSerializerTS)
            } else if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => {
                        let typeConvertor = this.typeConvertor("value", it.type!, it.questionToken != undefined)
                        let fieldName = asString(it.name)
                        //console.log(`for ${fieldName} ${typeConvertor instanceof OptionConvertor}`)
                        this.printerSerializerTS.print(`const value_${fieldName} = value.${fieldName}`)
                        typeConvertor.convertorToTSSerial(`value`, `value_${fieldName}`, this.printerSerializerTS)
                    })
            } else {
                let typeConvertor = this.typeConvertor("value", type!)
                typeConvertor.convertorToTSSerial(`value`, `value`, this.printerSerializerTS)
            }
            this.printerSerializerTS.popIndent()
            this.printerSerializerTS.print(`}`)
            this.printerSerializerTS.popIndent()
        } else {
            throw new Error(`No idea how to serialize ${asString(type)}`)
        }
    }

    private generateDeserializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (!type || PeerGeneratorConfig.ignoreSerialization.includes(name)) return
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        let isEnum = declarations.length > 0 && ts.isEnumDeclaration(declarations[0])
        let isAlias = declarations.length > 0 && ts.isTypeAliasDeclaration(declarations[0])
        let isStruct = !isEnum && !isAlias

        if (isEnum) {
            this.printerTypedefsC.print(`typedef int32_t ${name};`)
            return
        }
        if (ts.isImportTypeNode(type)) {
            this.printerTypedefsC.print(`typedef CustomObject ${importTypeName(type)};`)
            return
        }
        this.printerSerializerC.print(`${name} read${name}() {`)
        this.printerSerializerC.pushIndent()
        if (isAlias) {
            let decl = declarations[0] as ts.TypeAliasDeclaration
            let typeConvertor = this.typeConvertor("XXX", decl.type)
            // TODO: what's this?
            if (ts.isUnionTypeNode(decl.type)) { // TODO: tuples? functions?
                this.printerStructsC.startEmit(this.typeChecker, decl.type, name)
                this.printerStructsC.print(`typedef ${typeConvertor.nativeType()} ${name};`)
            } else {
                if (ts.isImportTypeNode(decl.type)) {
                    this.printerTypedefsC.print(`typedef CustomObject ${name};`)
                } else {
                    this.printerTypedefsC.print(`typedef ${typeConvertor.nativeType()} ${name};`)
                }
            }
        }
        if (isStruct) {
            // TODO: support subclasses.
            this.printerStructsC.startEmit(this.typeChecker, type!)
            this.printerStructsC.print(`struct ${name} {`)
            this.printerStructsC.pushIndent()
            this.printerStructsC.print(`${name}() {}`)
            this.printerStructsC.print(`~${name}() {}`)
        }
        let structFields: [ts.PropertyName, ts.TypeNode | undefined, ts.NodeArray<ts.ModifierLike> | undefined, boolean][] = []
        if (declarations.length > 0) {
            this.printerSerializerC.print(`Deserializer& valueDeserializer = *this;`)
            this.printerSerializerC.print(`int32_t tag = valueDeserializer.readInt8();`)
            this.printerSerializerC.print(`if (tag == Tags::TAG_UNDEFINED) throw new Error("Undefined");`)
            this.printerSerializerC.print(`${name} value;`)
            let declaration = declarations[0]
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => structFields.push([it.name, it.type, it.modifiers, it.questionToken != undefined]))
            }
            if (ts.isClassDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertyDeclaration)
                    .forEach(it => structFields.push([it.name, it.type, it.modifiers, it.questionToken != undefined]))
            }
            structFields.forEach(it => this.processSingleField(it[0], it[1], it[2], it[3]))
            if (ts.isEnumDeclaration(declaration)) {
                this.printerSerializerC.print(`value = valueDeserializer.readInt32();`)
            }
            this.printerSerializerC.print(`return value;`)
        } else {
            throw new Error(`Implement ${name} manually`)
        }
        if (isStruct) {
            this.printerStructsC.popIndent()
            this.printerStructsC.print(`};`)
            this.printerStructsC.print(`template <>`)
            this.printerStructsC.print(`inline void WriteToString(string* result, const ${name}& value) {`)
            this.printerStructsC.pushIndent()
            this.printerStructsC.print(`result->append("${name} {");`)
            structFields.forEach((field, index) => {
                const fieldName = identName(field[0])
                if (index > 0) this.printerStructsC.print(`result->append(", ");`)
                let isStatic = field[2]?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) != undefined
                if (isStatic) {
                    this.printerStructsC.print(`/* Ignore static ${fieldName} */`)
                } else {
                    this.printerStructsC.print(`result->append("${fieldName}=");`)
                    this.printerStructsC.print(`WriteToString(result, value.${fieldName});`)
                }
            })
            this.printerStructsC.print(`result->append("}");`)
            this.printerStructsC.popIndent()
            this.printerStructsC.print(`}`)
        }
        this.printerSerializerC.popIndent()
        this.printerSerializerC.print(`}`)
    }

    private processSingleField(fieldNameTS: ts.PropertyName, fieldType: ts.TypeNode | undefined,
        modifiers: ts.NodeArray<ts.ModifierLike> | undefined, isOptional: boolean) {
        if (!fieldType) throw new Error("Untyped field")
        let isStatic = modifiers?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) != undefined
        if (isStatic) return
        if (ts.isTypeReferenceNode(fieldType)) {
            this.requestType(identName(fieldType.typeName)!, fieldType)
        }
        let typeConvertor = this.typeConvertor("value", fieldType, isOptional)
        let fieldName = identName(fieldNameTS)
        let nativeType = typeConvertor.nativeType()
        this.printerStructsC.print(`${nativeType} ${fieldName};`)

        let fieldValue = `value_${fieldName}`
        this.printerSerializerC.print(`${nativeType} ${fieldValue};`)
        typeConvertor.convertorToCDeserial(`value`, fieldValue, this.printerSerializerC)
        this.printerSerializerC.print(`value.${fieldName} = ${fieldValue};`);
    }
}

function mapCInteropRetType(type: ts.TypeNode): string {
    if (type.kind == ts.SyntaxKind.VoidKeyword) {
        return `void`
    }
    if (ts.isTypeReferenceNode(type)) {
        let name = identName(type.typeName)!
        /* HACK, fix */
        if (name.endsWith("Attribute")) return "void"
        switch (name) {
            case "number": return "KInt"
            /* ANOTHER HACK, fix */
            case "T": return "void"
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

