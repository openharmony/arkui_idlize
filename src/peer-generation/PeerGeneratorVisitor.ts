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
    getNameWithoutQualifiersRight,
    identName,
    isCommonMethodOrSubclass,
    isDefined,
    nameOrNull,
    serializerBaseMethods,
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
    OptionConvertor,
    StringConvertor,
    TypedConvertor,
    TupleConvertor,
    UndefinedConvertor,
    UnionConvertor
} from "./Convertors"
import { SortingEmitter } from "./SortingEmitter"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { TypeChecker } from "../typecheck"

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
    private printerTypedefsC: IndentedPrinter
    private printerSerializerTS: IndentedPrinter
    private serializerRequests: TypeAndName[] = []
    private apiPrinter: IndentedPrinter
    private apiPrinterList: IndentedPrinter
    private dummyImpl: IndentedPrinter
    private dummyImplModifiers: IndentedPrinter
    private dummyImplModifierList: IndentedPrinter

    private static readonly serializerBaseMethods = serializerBaseMethods()

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
        apiHeadersList: string[],
        dummyImpl: string[],
        dummyImplModifiers: string[],
        dummyImplModifierList: string[]
    ) {
        this.printerC = new IndentedPrinter(outputC)
        this.printerNativeModule = new IndentedPrinter(nativeModuleMethods)
        this.printerSerializerC = new IndentedPrinter(outputSerializersC)
        this.printerStructsC = outputStructsC
        this.printerTypedefsC = new IndentedPrinter(outputStructsForwardC)
        this.printerSerializerTS = new IndentedPrinter(outputSerializersTS)
        this.apiPrinter = new IndentedPrinter(apiHeaders)
        this.apiPrinterList = new IndentedPrinter(apiHeadersList)
        this.dummyImpl = new IndentedPrinter(dummyImpl)
        this.dummyImplModifiers = new IndentedPrinter(dummyImplModifiers)
        this.dummyImplModifierList = new IndentedPrinter(dummyImplModifierList)
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
                const entities = it.components.map(it => [`Ark${it}Peer`, `Ark${it}Attributes`]).join(", ")
                return `import { ${entities} } from "./${it.file}"`
            })
    }

    visitWholeFile(): stringOrNone[] {
        this.importStatements(this.sourceFile.fileName)
            .concat([
                `import { runtimeType, functionToInt32, withLength, withLengthArray, RuntimeType } from "../../utils/ts/SerializerBase"`,
                `import { Serializer } from "./Serializer"`,
                `import { int32, KPointer } from "../../utils/ts/types"`,
                `import { nativeModule } from "./NativeModule"`,
                `import { PeerNode, Finalizable, nullptr } from "../../utils/ts/Interop"`,
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
        this.epilogue(node)

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
        this.epilogue(node)
        this.generateAttributesValuesInterfaces()
    }

    processConstructor(ctor: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration) {
    }

    mapType(type: ts.TypeNode | undefined): string {
        if (type && ts.isTypeReferenceNode(type)) {

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
            if (typeName != "Array") return typeName
        }
        if (type && ts.isImportTypeNode(type)) {
            return `/* imported */ ${asString(type.qualifier)}`
        }
        let text = type?.getText(this.sourceFile)
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

    seenMethods = new Set<string>()

    processMethod(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, method: ts.MethodDeclaration | ts.MethodSignature) {
        let isComponent = false
        let methodName = method.name.getText(this.sourceFile)
        if (PeerGeneratorConfig.ignorePeerMethod.includes(methodName)) return
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
        const apiParameters = this.generateAPIParameters(argConvertors).join(", ")
        const implName = `Set${capitalizedMethodName}Impl`
        this.printAPI(`void (*set${capitalizedMethodName})(${apiParameters});`)
        this.printDummyModifier(`${implName},`)
        this.printDummy(`void ${implName}(${apiParameters}) { printf("Set${capitalizedMethodName}Impl\\n"); }`)
        this.seenMethods.add(methodName)
        this.printTS(`${methodName}${isComponent ? "Attribute" : ""}(${this.generateParams(method.parameters)}) {`)
        let cName = `${componentName}_${methodName}`
        this.printC(`${this.generateCReturnType(retConvertor)} impl_${cName}(${this.generateCParameters(argConvertors).join(", ")}) {`)
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
                return it.interopType(false)
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
            return `${it.nativeType()} ${it.param}`
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
        // TODO: restore call
        // this.printC(`${api}->${modifier}->${method}(${args});`)
        this.printC(`printf("would call %s\\n", \"${api}->${modifier}->${method}(${args})\");`)
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
        this.printTS(`nativeModule()._${clazzName}_${methodName}(this.ptr${argConvertors.length > 0 ? ", " : ""}`)
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
            if (getNameWithoutQualifiersRight(type.typeName) == "Length") {
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
        if (ts.isImportTypeNode(type)) {
            console.log(`Emit ${type.getText()} as ${getNameWithoutQualifiersRight(type.qualifier)!}`)
            return new TypedConvertor(`${getNameWithoutQualifiersRight(type.qualifier)!}`, type, param, this)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return new StringConvertor(param)
        }
        if (ts.isNamedTupleMember(type)) {
            return this.typeConvertor(param, type.type)
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
            || /* HACK, fix */ identName(typeNode)?.endsWith("Attribute") == true
            || /* ANOTHER HACK, fix */  identName(typeNode) == "T"

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

    epilogue(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
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

    private collectMethod(node: ts.MethodDeclaration, parent: ts.ClassDeclaration): void {
        // TODO: use alternative in-time emitter, like printC.
        if (parent.name === undefined) throw new Error(`Encountered nameless method ${node}`)
        const component = ts.idText(parent.name)
        const method = node.name.getText()
        const parameters =
            ["node: KNativePointer"].concat(
            node.parameters
            .map(it => this.argConvertor(it))
            .map(it => {
                if (it.useArray) {
                    const array = `${it.param}Serializer`
                    return `${it.param}Array: Uint8Array, ${array}Length: int32`
                } else {
                    return `${it.param}: ${it.interopType(true)}`
                }
            }))
            .join(", ")
        this.printerNativeModule.print(`_${component}_${method}(${parameters}): void`)
    }

    private generateSerializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (PeerGeneratorConfig.ignoreSerialization.includes(name)) return
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        if (declarations.length > 0) {
            let declaration = declarations[0]
            // No need for enum serialization methods, we do that in-place.
            if (ts.isEnumDeclaration(declaration)) return

            this.printerSerializerTS.pushIndent()
            this.printerSerializerTS.print(`write${name}(value: ${name}|undefined) {`)
            this.printerSerializerTS.pushIndent()

            this.printerSerializerTS.print(`const valueSerializer = this`)
            this.printerSerializerTS.print(`if (undefined === value) { valueSerializer.writeInt8(Tags.UNDEFINED); return }`)
            this.printerSerializerTS.print(`valueSerializer.writeInt8(Tags.OBJECT)`)
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
            this.printerSerializerTS.popIndent()
            this.printerSerializerTS.print(`}`)
            this.printerSerializerTS.popIndent()
        } else {
            throw new Error(`No idea how to serialize ${asString(type)}`)
        }
    }

    private generateDeserializer(name: string, type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined) {
        if (PeerGeneratorConfig.ignoreSerialization.indexOf(name) != -1) return
        let typeName = (type && ts.isTypeReferenceNode(type)) ? type.typeName : type?.qualifier
        let declarations = typeName ? getDeclarationsByNode(this.typeChecker, typeName) : []
        let isEnum = declarations.length > 0 && ts.isEnumDeclaration(declarations[0])
        let isAlias = declarations.length > 0 && ts.isTypeAliasDeclaration(declarations[0])
        let isStruct = !isEnum && !isAlias

        if (isEnum) {
            this.printerTypedefsC.print(`typedef int32_t ${name};`)
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
                this.printerTypedefsC.print(`typedef ${typeConvertor.nativeType()} ${name};`)
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
        let structFields: [ts.PropertyName, ts.TypeNode | undefined, ts.NodeArray<ts.ModifierLike> | undefined][] = []
        if (declarations.length > 0) {
            this.printerSerializerC.print(`Deserializer& valueDeserializer = *this;`)
            this.printerSerializerC.print(`int32_t tag = valueDeserializer.readInt8();`)
            this.printerSerializerC.print(`if (tag == Tags::TAG_UNDEFINED) throw new Error("Undefined");`)
            this.printerSerializerC.print(`${name} value;`)
            let declaration = declarations[0]
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => structFields.push([it.name, it.type, it.modifiers]))
            }
            if (ts.isClassDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertyDeclaration)
                    .forEach(it => structFields.push([it.name, it.type, it.modifiers]))
            }
            structFields.forEach(it => this.processSingleField(it[0], it[1], it[2]))
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
            structFields.forEach(it => this.printerStructsC.print(`WriteToString(result, value.${identName(it[0])});`))
            this.printerStructsC.print(`result->append("}");`)
            this.printerStructsC.popIndent()
            this.printerStructsC.print(`}`)
        }
        this.printerSerializerC.popIndent()
        this.printerSerializerC.print(`}`)
    }

    private processSingleField(fieldNameTS: ts.PropertyName, fieldType: ts.TypeNode | undefined,
        modifiers: ts.NodeArray<ts.ModifierLike> | undefined) {
        if (!fieldType) throw new Error("Untyped field")
        if (ts.isTypeReferenceNode(fieldType)) {
            this.requestType(ts.idText(fieldType.typeName as ts.Identifier), fieldType)
        }
        let typeConvertor = this.typeConvertor("value", fieldType)
        let fieldName = identName(fieldNameTS)
        let nativeType = typeConvertor.nativeType()
        this.printerStructsC.print(`${modifiers?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) ? "static " : ""}${nativeType} ${fieldName};`)

        let fieldValue = `value_${fieldName}`
        this.printerSerializerC.print(`${nativeType} ${fieldValue};`)
        typeConvertor.convertorToCDeserial(`value`, fieldValue, this.printerSerializerC)
        this.printerSerializerC.print(`value.${fieldName} = ${fieldValue};`);
    }

    private typeParamsClause(type: ts.TypeReferenceNode | ts.ImportTypeNode | undefined): string {
        const typeParams = type?.typeArguments
            ?.map((it, index) => `T` + index)
            .join(", ")
        return typeParams
            ? `<${typeParams}>`
            : ""
    }
}

function mapCInteropType(type: ts.TypeNode): string {
    if (ts.isTypeReferenceNode(type)) {
        let name = identName(type.typeName)
        switch (name) {
            case "number": return "KInt"
        }
        return `KNativePointer`
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
import { int32, KInt, Int32ArrayPtr, KNativePointer } from "../../utils/ts/types"

let theModule: NativeModule | undefined = undefined

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    theModule = require("../../../../native/build-node-host/NativeBridge") as NativeModule
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
#include "arkoala_api.h"

static ArkUIAnyAPI* impls[ArkUIAPIVariantKind::COUNT] = { 0 };

const ArkUIAnyAPI* GetAnyImpl(ArkUIAPIVariantKind kind, int version, std::string* result) {
    return impls[kind];
}

const ArkUIFullNodeAPI* GetFullImpl(std::string* result = nullptr) {
    return reinterpret_cast<const ArkUIFullNodeAPI*>(GetAnyImpl(ArkUIAPIVariantKind::FULL, ARKUI_FULL_API_VERSION, result));
}

const ArkUINodeModifiers* GetNodeModifiers() {
    return GetFullImpl()->getNodeModifiers();
}

${bridgeCc.join("\n")}
`
}

export function dummyImplementations(lines: string[]): string {
    return `
#include "arkoala_api.h"


${lines.join("\n")}


`
}

export function dummyModifiers(lines: string[]): string {
    return lines.join("\n")
}

export function dummyModifierList(lines: string[]): string {
    return `
const ArkUINodeModifiers impl = {
${lines.join("\n")}
};

const ArkUINodeModifiers* GetArkUINodeModifiers()
{
    return &impl;
}

`
}


export function makeTSSerializer(lines: string[]): string {
    return `
import { SerializerBase, runtimeType, Tags, RuntimeType } from "../../utils/ts/SerializerBase"
import { int32 } from "../../utils/ts/types"

type Callback = Function
type ErrorCallback = Function

type Function = object

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
};

/**
 * An API to control an implementation. When making changes modifying binary
 * layout, i.e. adding new events - increase ARKUI_NODE_API_VERSION above for binary
 * layout checks.
 */
struct ArkUIFullNodeAPI {
    const ArkUINodeModifiers* (*getNodeModifiers)();
};

struct ArkUIAnyAPI {
    ArkUI_Int32 version;
};
`
}

export function makeApiHeaders(lines: string[]): string {
    return `enum ArkUIAPIVariantKind {
    BASIC = 1,
    FULL = 2,
    GRAPHICS = 3,
    EXTENDED = 4,
    COUNT = EXTENDED + 1,
};

${lines.join("\n")}
`
}
