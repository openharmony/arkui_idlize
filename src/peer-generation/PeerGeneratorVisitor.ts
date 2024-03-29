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
    forEachExpanding,
    getDeclarationsByNode,
    heritageDeclarations,
    isCommonMethodOrSubclass,
    isDefined,
    nameOrNull,
    stringOrNone,
    typeOrUndefined
} from "../util"
import { GenericVisitor } from "../options"
import { IndentedPrinter } from "../IndentedPrinter"
import {
    AggregateConvertor,
    AnyConvertor,
    ArgConvertor,
    ArrayConvertor,
    BooleanConvertor,
    EmptyConvertor,
    EnumConvertor,
    FunctionConvertor,
    InterfaceConvertor,
    LengthConvertor,
    NumberConvertor,
    StringConvertor,
    TypedConvertor,
    UndefinedConvertor,
    UnionConvertor
} from "./Convertors"
import { SortingEmitter } from "./SortingEmitter"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER,
    STRING,
    OBJECT,
    BOOLEAN,
    UNDEFINED
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

export class PeerGeneratorVisitor implements GenericVisitor<stringOrNone[]> {
    private typesToGenerate: string[] = []
    private seenAttributes = new Set<string>()
    private printerNativeModule: IndentedPrinter
    private printerSerializerC: IndentedPrinter
    private printerStructsC: SortingEmitter
    private printerStructsForwardC: IndentedPrinter
    private printerSerializerTS: IndentedPrinter
    private serializerRequests: TypeAndName[] = []
    private apiPrinter: IndentedPrinter
    private apiPrinterList: IndentedPrinter

    private static imports = [
        { file: "common", components: ["Common", "ScrollableCommon", "CommonShape"]},
        { file: "shape", components: ["Shape"] },
        { file: "security_component", components: ["SecurityComponent"] },
        { file: "column", components: ["Column"] },
        { file: "image", components: ["Image"] },
        { file: "span", components: ["BaseSpan"] },
    ]

    constructor(
        private sourceFile: ts.SourceFile,
        private typeChecker: ts.TypeChecker,
        private interfacesToGenerate: Set<string>,
        nativeModuleMethods: string[],
        outputC: string[],
        outputSerializersTS: string[],
        outputSerializersC: string[],
        outputStructsForwardC: string[],
        outputStructsC: SortingEmitter,
        apiHeaders: string[],
        apiHeadersList: string[]
    ) {
        this.printerC = new IndentedPrinter(outputC)
        this.printerNativeModule = new IndentedPrinter(nativeModuleMethods)
        this.printerSerializerC = new IndentedPrinter(outputSerializersC)
        this.printerStructsC = outputStructsC
        this.printerStructsForwardC = new IndentedPrinter(outputStructsForwardC)
        this.printerSerializerTS = new IndentedPrinter(outputSerializersTS)
        this.apiPrinter = new IndentedPrinter(apiHeaders)
        this.apiPrinterList = new IndentedPrinter(apiHeadersList)
    }

    requestType(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
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
        return PeerGeneratorVisitor.imports
            .filter(it => !currentFileName.endsWith(`/${it.file}.d.ts`))
            .map(it => {
                const entities = it.components.map(it => [`Ark${it}Peer`, `Ark${it}Attributes`]).join(", ")
                return `import { ${entities} } from "./${it.file}"`
            })
    }

    visitWholeFile(): stringOrNone[] {
        this.importStatements(this.sourceFile.fileName)
            .concat([
                `import { runtimeType, functionToInt32, withLength, withLengthArray } from "../../utils/ts/SerializerBase"`,
                `import { Serializer } from "./Serializer"`,
                `import { int32 } from "../../utils/ts/types"`,
                `import { nativeModule } from "./NativeModule"`,
                `import { PeerNode, Finalizable, KPointer, nullptr } from "../../utils/ts/Interop"`,
                `type Callback = Function`,
                `type ErrorCallback = Function`,
                `type Style = any` // Style extends ProgressStyleMap from progress.d.ts
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
        if (ts.isClassDeclaration(node) && this.needsPeer(node)) {
            this.processClass(node)
        } else if (ts.isInterfaceDeclaration(node) && this.needsPeer(node)) {
            this.processInterface(node)
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, (node) => this.visit(node));
        }
    }

    processClass(node: ts.ClassDeclaration) {
        this.prologue(node)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.processConstructor(child)
            } else if (ts.isMethodDeclaration(child)) {
                this.processMethod(node, child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.processApplyMethod(node)
        this.epilogue()

        this.createComponentAttributesDeclaration(node)
        this.generateAttributesValuesInterfaces()

        this.printerNativeModule.pushIndent()
        node.members.forEach(it => {
            if (ts.isMethodDeclaration(it)) {
                this.collectMethod(it, node)
            }
        })
        this.printerNativeModule.popIndent()
    }

    processInterface(node: ts.InterfaceDeclaration) {
        this.prologue(node)
        node.members.forEach(child => {
            if (ts.isConstructorDeclaration(child)) {
                this.processConstructor(child)
            } else if (ts.isMethodSignature(child)) {
                this.processMethod(node, child)
            } else if (ts.isPropertyDeclaration(child)) {
                this.processProperty(child)
            }
        })
        this.processApplyMethod(node)
        this.popIndentTS()
        if (false) {
            this.createComponentAttributesDeclaration(node)
            this.pushIndentTS()
            node.members.forEach(child => {
                if (ts.isMethodSignature(child)) {
                    this.processOptionAttribute(child)
                }
            })
        }
        this.epilogue()
        this.generateAttributesValuesInterfaces()
    }

    processConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
    }

    mapType(type: ts.TypeNode | undefined): string {
        if (type && ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
            // TODO: plain wrong!
            if (declaration.length == 0) return "any"
            let typeName = asString(type.typeName)
            if (typeName == "AttributeModifier") return "AttributeModifier<this>"
            if (typeName != "Array") return typeName
        }
        if (type && ts.isImportTypeNode(type)) {
            return `/* imported */ ${asString(type.qualifier)}`
        }
        let text = type?.getText(this.sourceFile)
        if (text == "unknown") text = "any"
        return  text ?? "any"
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

    printNodeModifier(value: stringOrNone) {
        this.apiPrinterList.print(`const ArkUI${value}Modifier* (*get${value}Modifier)();`)
    }

    seenMethods = new Set<string>()

    processMethod(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, method: ts.MethodDeclaration | ts.MethodSignature) {
        let isComponent = false
        let methodName = method.name.getText(this.sourceFile)
        const hasReceiver = true // TODO: make it false for non-method calls.
        const componentName = ts.idText(clazz.name as ts.Identifier)
        const argConvertors = method.parameters
            .map((param) => this.argConvertor(param))
        const retConvertor = this.retConvertor(method.type)
        const suffix = this.generateCMacroSuffix(argConvertors, retConvertor, hasReceiver)

        console.log(`processing ${componentName}.${methodName}`)
        if (this.seenMethods.has(methodName)) {
            console.log(`WARNING: ignore duplicate method ${methodName}`)
            return
        }
        let capitalizedMethodName = methodName[0].toUpperCase() + methodName.substring(1)
        this.printAPI(`void (*set${capitalizedMethodName})(${this.generateAPIParameters(argConvertors).join(", ")});`)
        this.seenMethods.add(methodName)
        this.printTS(`${methodName}${isComponent ? "Attribute" : ""}(${this.generateParams(method.parameters)}) {`)
        let cName = `_${componentName}_${methodName}Impl`
        this.printC(`${this.generateCReturnType(retConvertor)} ${cName}(${this.generateCParameters(argConvertors).join(",")}) {`)
        this.pushIndentBoth()
        if (isComponent) {
            this.printTS(`if (this.checkPriority("${methodName}")) {`)
            this.pushIndentTS()
            this.printTS(`this.peer?.${methodName}Attribute(${this.generateValues(method.parameters)})`)
            this.popIndentTS()
            this.printTS(`}`)
        } else {
            let isStub = false
            if (isStub) {
                this.printTS(`throw new Error("${methodName}Attribute() is not implemented")`)
            } else {
                let name = `${methodName}Impl`
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
                return `${it.interopType(false)} ${it.param}`
            }
        })))
    }

    generateCParameterTypes(argConvertors: ArgConvertor[], hasReceiver: boolean): string[] {
        const receiver = hasReceiver ? ['KNativePointer'] : []
        return receiver.concat(argConvertors.map(it => {
            if (it.useArray) {
                return `uint8_t*, int32_t`
            } else {
                return it.nativeType()
            }
        }))
    }

    generateCReturnType(retConvertor: RetConvertor): string {
        return retConvertor.nativeType()
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

    apiSection(clazzName: string) {
        return "GetNodeModifiers()"
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
            return `${it.nativeType()}* ${it.param}`
        }))) 
    }

    // TODO: may be this is another method of ArgConvertor?
    apiArgument(argConvertor: ArgConvertor): string {
        if (argConvertor.useArray) return `${argConvertor.param}Value`
        return argConvertor.param
    }

    generateAPICall(clazzName: string, methodName: string, hasReceiver: boolean, argConvertors: ArgConvertor[]) {
        const api = this.apiSection(clazzName)
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
        let scopes = new Array<ArgConvertor>()
        argConvertors
            .filter(it => it.isScoped)
            .map(it => scopes.push(it))
        scopes.forEach(it => {
            this.pushIndentTS()
            this.printTS(it.scopeStart?.(it.param))
        })
        argConvertors.forEach(it => {
            if (it.useArray) {
                let size = it.estimateSize()
                this.printTS(`let ${it.param}Serializer = new Serializer(${size})`)
                it.convertorToTSSerial(it.param, it.param, this.printerTS)
                this.printC(`Deserializer ${it.param}Deserializer(${it.param}Array, ${it.param}Length);`)
                this.printC(`${it.nativeType()} ${it.param}Value;`)
                it.convertorToCDeserial(it.param, `${it.param}Value`, this.printerC)
            }
        })
        this.printTS(`nativeModule()._${clazzName}_${methodName}(`)
        this.pushIndentTS()
        argConvertors.forEach((it, index) => {
            let maybeComma = index == argConvertors.length - 1 ? "" : ","
            if (it.useArray)
                this.printTS(`${it.param}Serializer.asArray(), ${it.param}Serializer.length()`)
            else
                it.convertorTSArg(it.param, it.param, this.printerTS)
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

    typeConvertor(param: string, type: ts.TypeNode): ArgConvertor {
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return new AnyConvertor(param)
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
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)[0]
            if (!declaration) {
                // throw new Error(`Declaration not found: ${asString(type.typeName)}`)
                console.log(`WARNING: declaration not found: ${asString(type.typeName)}`)
                return new AnyConvertor(param)
            }
            if (asString(type.typeName) == "Length") {
                // Important common case.
                return new LengthConvertor(param)
            }
            if (ts.isQualifiedName(type.typeName)) {
                let typeOuter = ts.factory.createTypeReferenceNode(type.typeName.left)
                return new EnumConvertor(param, typeOuter as ts.TypeReferenceNode, this)
            }
            if (ts.isEnumDeclaration(declaration)) {
                return new EnumConvertor(param, type, this)
            }
            if (ts.isTypeAliasDeclaration(declaration)) {
                this.requestType(ts.idText(declaration.name), type)
                return this.typeConvertor(param, declaration.type)
            }
            if (ts.isInterfaceDeclaration(declaration)) {
                let ifaceName = ts.idText(declaration.name)
                if (ifaceName == "Array") {
                    if (ts.isTypeReferenceNode(type))
                        return new ArrayConvertor(param, this, type.typeArguments![0])
                    else {
                        return new EmptyConvertor(param)
                    }
                }
                return new InterfaceConvertor(param, this, type)
            }
            if (ts.isClassDeclaration(declaration)) {
                return new InterfaceConvertor(param, this, type)
            }
            if (ts.isTypeParameterDeclaration(declaration)) {
                console.log(declaration)
                return new AnyConvertor(param)
            }
            console.log(`${declaration.getText()}`)
            throw new Error(`Unknown kind: ${declaration.kind}`)
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
                return new EmptyConvertor(param)
            }
            if (type.literal.kind == ts.SyntaxKind.StringLiteral) {
                return new StringConvertor(param)
            }
            throw new Error(`Unsupported literal type: ${type.literal.kind}` + type.getText(this.sourceFile))
        }
        if (ts.isTupleTypeNode(type)) {
            return new EmptyConvertor(param)
        }
        if (ts.isFunctionTypeNode(type)) {
            return new FunctionConvertor(param, this)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.typeConvertor(param, type.type)
        }
        if (ts.isImportTypeNode(type)) {
            return new TypedConvertor(asString(type.qualifier), type, param, this)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return new StringConvertor(param)
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return new AnyConvertor(param)
        }
        console.log(type)
        throw new Error(`Cannot convert: ${asString(type)} ${type.getText(this.sourceFile)}`)
    }

    argConvertor(param: ts.ParameterDeclaration): ArgConvertor {
        if (!param.type) throw new Error("Type is needed")
        let paramName = asString(param.name)
        return this.typeConvertor(paramName, param.questionToken ? typeOrUndefined(param.type) : param.type)
    }

    retConvertor(typeNode?: ts.TypeNode): RetConvertor {
        const isVoid = (typeNode === undefined) ||
            (typeNode.kind == ts.SyntaxKind.VoidKeyword)

        return {
            isVoid: isVoid,
            nativeType: () => isVoid ? "void" : mapCInteropType(typeNode),
            macroSuffixPart: () => isVoid ? "V" : ""
        }
    }

    processProperty(property: ts.PropertyDeclaration | ts.PropertySignature) {
        throw new Error(`unexpected property ${property.name.getText(this.sourceFile)}`)
    }

    prologue(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const componentName = this.renameToKoalaComponent(nameOrNull(node.name)!)
        const peerParentName = this.peerParentName(node)

        const extendsClause =
            peerParentName
                ? `extends ${peerParentName} `
                : ""
        this.printTS(`export class ${componentName}Peer ${extendsClause} {`)
        this.pushIndentTS()
        this.printAPI(`struct ArkUI${componentName.substring(3)}Modifier {`)
        this.pushIndentAPI()
        this.pushIndentAPIList()
        this.printNodeModifier(componentName.substring(3))
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

    private renameToKoalaComponent(name: string): string {
        return "Ark"
            .concat(name)
            .replace("Attribute", "")
            .replace("Method", "")
    }

    epilogue() {
        this.popIndentTS()
        this.printTS(`}`)
        this.popIndentAPI()
        this.printAPI(`};\n`)
        this.popIndentAPIList()
    }

    processApplyMethod(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
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

    private createComponentAttributesDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const component = nameOrNull(node.name)!.replace("Attribute", "")
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

    private collectMethod(node: ts.MethodDeclaration, parent: ts.ClassDeclaration): void {
        // TODO: use alternative in-time emitter, like printC.
        if (parent.name === undefined) throw new Error(`Encountered nameless method ${node}`)
        const component = ts.idText(parent.name)
        const method = node.name.getText()
        const parameters = node.parameters
            .map(it => this.argConvertor(it))
            .map(it => {
                if (it.useArray) {
                    const array = `${it.param}Serializer`
                    return `${it.param}Array: Uint8Array, ${array}Length: int32`
                } else {
                    return `${it.param}: ${it.interopType(true)}`
                }
            })
            .join(", ")
        this.printerNativeModule.print(`_${component}_${method}Impl(${parameters}): void`)
    }

    private generateSerializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (PeerGeneratorConfig.ignoreSerialization.indexOf(name) != -1) return
        this.printerSerializerTS.pushIndent()
        this.printerSerializerTS.print(`write${name}(value: ${name}|undefined) {`)
        this.printerSerializerTS.pushIndent()
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        if (declarations.length > 0) {
            let declaration = declarations[0]
            this.printerSerializerTS.print(`const valueSerializer = this`)
            this.printerSerializerTS.print(`if (!value) { valueSerializer.writeInt8(Tags.UNDEFINED); return }`)
            let tag = ts.isEnumDeclaration(declaration) ? "Tags.INT32" : "Tags.OBJECT";
            this.printerSerializerTS.print(`valueSerializer.writeInt8(${tag})`)
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => {
                        const type = it.questionToken ? typeOrUndefined(it.type!) : it.type!
                        let typeConvertor = this.typeConvertor("value", type)
                        let fieldName = asString(it.name)
                        this.printerSerializerTS.print(`let value_${fieldName} = value.${fieldName}`)
                        typeConvertor.convertorToTSSerial(`value`, `value_${fieldName}`, this.printerSerializerTS)
                    })
            } else {
                let typeConvertor = this.typeConvertor("value", type!)
                typeConvertor.convertorToTSSerial(`value`, `value`, this.printerSerializerTS)
            }
        } else {
            this.printerSerializerTS.print(`throw new Error("Implement ${name} manually")`)
        }
        this.printerSerializerTS.popIndent()
        this.printerSerializerTS.print(`}`)
        this.printerSerializerTS.popIndent()
    }
    private generateDeserializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (PeerGeneratorConfig.ignoreSerialization.indexOf(name) != -1) return
        this.printerSerializerC.print(`${name} read${name}() {`)
        this.printerSerializerC.pushIndent()
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        let isEnum = declarations.length > 0 && ts.isEnumDeclaration(declarations[0])
        let isAlias = declarations.length > 0 && ts.isTypeAliasDeclaration(declarations[0])
        let isStruct = !isEnum && !isAlias
        if (isEnum) {
            this.printerStructsForwardC.print(`typedef int32_t ${name};`)
        }
        if (isAlias) {
            let decl = declarations[0] as ts.TypeAliasDeclaration
            let typeConvertor = this.typeConvertor("XXX", decl.type)
            this.printerStructsForwardC.print(`typedef ${typeConvertor.nativeType()} ${name};`)
        }
        if (isStruct) {
            // TODO: support subclasses.
            this.printerStructsForwardC.print(`struct ${name};`)
            this.printerStructsC.startEmit(this.typeChecker, type!)
            this.printerStructsC.print(`struct ${name} {`)
            this.printerStructsC.pushIndent()
            this.printerStructsC.print(`${name}() {}`)
            this.printerStructsC.print(`~${name}() {}`)
        }
        if (declarations.length > 0) {
            this.printerSerializerC.print(`Deserializer& valueDeserializer = *this;`)
            this.printerSerializerC.print(`int32_t tag = valueDeserializer.readInt8();`)
            this.printerSerializerC.print(`if (tag == Tags::TAG_UNDEFINED) throw new Error("Undefined");`)
            this.printerSerializerC.print(`${name} value;`)
            let declaration = declarations[0]
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => this.processSingleField(it))
            }
            if (ts.isClassDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertyDeclaration)
                    .forEach(it => this.processSingleField(it))
            }
            if (ts.isEnumDeclaration(declaration)) {
                this.printerSerializerC.print(`value = valueDeserializer.readInt32();`)
            }
            this.printerSerializerC.print(`return value;`)
        } else {
            this.printerSerializerC.print(`throw new Error("Implement ${name} manually");`)
        }
        if (isStruct) {
            this.printerStructsC.popIndent()
            this.printerStructsC.print(`};`)
        }
        this.printerSerializerC.popIndent()
        this.printerSerializerC.print(`}`)
    }

    private processSingleField(field: ts.PropertyDeclaration | ts.PropertySignature) {
        if (ts.isTypeReferenceNode(field.type!)) {
            this.requestType(ts.idText(field.type!.typeName as ts.Identifier), field.type)
        }
        let typeConvertor = this.typeConvertor("value", field.type!)
        let fieldName = asString(field.name)
        let nativeType = typeConvertor.nativeType()
        this.printerStructsC.print(`${field.modifiers?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) ? "static " : ""}${nativeType} ${fieldName};`)

        let fieldValue = `value_${fieldName}`
        this.printerSerializerC.print(`${nativeType} ${fieldValue};`)
        typeConvertor.convertorToCDeserial(`value`, fieldValue, this.printerSerializerC)
        this.printerSerializerC.print(`value.${fieldName} = ${fieldValue};`);
    }

    private typeParamsClause(type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined): string {
        const typeParams = type?.typeArguments
            ?.map((it, index )=> `T` + index)
            .join(", ")
        return typeParams
            ? `<${typeParams}>`
            : ""
    }
}

function mapCInteropType(type: ts.TypeNode): string {
    if (ts.isTypeReferenceNode(type)) {
        let name = ts.idText(type.typeName as ts.Identifier)
        switch (name) {
            case "number": return "KInt"
        }
        return "KPointer"
    }
    return "Any"
}

interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}

export function nativeModuleDeclaration(methods: string[]): string {
    return `
import { int32 } from "../../utils/types"

let theModule: NativeModule | undefined = undefined

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    theModule = require("nativeModule") as NativeModule
    return theModule
}

export interface NativeModule {
${methods.join("\n")}
}
`
}


export function bridgeCcDeclaration(bridgeCc: string[]): string {
    return `
#include "Interop.h"
#include "Deserializer.h"

${bridgeCc.join("\n")}
`
}

export function makeTSSerializer(lines: string[]): string {
    return `
import { SerializerBase, runtimeType, Tags } from "../../utils/ts/SerializerBase"
import { int32 } from "../../utils/ts/types"

type Callback = Function
type ErrorCallback = Function

type Function = object
type FirstNode = any

export class Serializer extends SerializerBase {
${lines.join("\n")}
}
`
}

export function makeCDeserializer(structsForward: string[], structs: string[], serializers: string[]): string {
    return `
#include "Interop.h"
#include "ArgDeserializerBase.h"
#include <string>

${structsForward.join("\n")}

${structs.join("\n")}

class Deserializer : public ArgDeserializerBase
{
  public:
    Deserializer(uint8_t *data, int32_t length)
          : ArgDeserializerBase(data, length) {}

${serializers.join("\n  ")}
};
`
}

export function makeApiModifiers(lines: string[]): string {
    return `
/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_API_VERSION above for binary
 * layout checks.
 */
struct ArkUINodeModifiers {
${lines.join("\n")}
}
`
}

export function makeApiHeaders(lines: string[]): string {
    return `${lines.join("\n")}
`
}
