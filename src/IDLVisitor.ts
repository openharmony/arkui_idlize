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
import * as path from "path"
import { parse } from 'comment-parser'
import {
    createAnyType, createContainerType, createEnumType, createNumberType, createReferenceType, createStringType, createTypedef,
    createTypeParameterReference, createUndefinedType, createUnionType, getExtAttribute, IDLCallable, IDLCallback, IDLConstructor,
    IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLFunction, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLType, IDLTypedef
} from "./idl"
import {
    asString, capitalize, getComment, getDeclarationsByNode, getExportedDeclarationNameByDecl, getExportedDeclarationNameByNode, identName, isCommonMethodOrSubclass, isNodePublic, isReadonly, isStatic, nameOrNullForIdl as nameOrUndefined, stringOrNone
} from "./util"
import { GenericVisitor } from "./options"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"
import { OptionValues } from "commander"

const typeMapper = new Map<string, string>(
    [
        ["null", "undefined"],
        ["void", "undefined"],
        ["object", "Object"],
        ["Array", "sequence"],
        ["string", "DOMString"],
        ["Map", "record"],
        // TODO: rethink that
        ["\"2d\"", "string"],
        ["\"auto\"", "string"]
    ]
)

export class CompileContext {
    functionCounter = 0
    objectCounter = 0
}

export class IDLVisitor implements GenericVisitor<IDLEntry[]> {
    private output: IDLEntry[] = []
    private currentScope:  IDLEntry[] = []
    scopes: IDLEntry[][] = []
    globalScope: IDLMethod[] = []

    startScope() {
        this.scopes.push(this.currentScope)
        this.currentScope = []
    }

    endScope() {
        const result = this.currentScope
        this.currentScope = this.scopes.pop()!
        return result
    }

    constructor(
        private sourceFile: ts.SourceFile,
        private typeChecker: ts.TypeChecker,
        private compileContext: CompileContext,
        private options: OptionValues) { }

    visitWholeFile(): IDLEntry[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        if (this.globalScope.length > 0) {
            this.output.push({
                kind: IDLKind.Interface,
                name: `GlobalScope_${path.basename(this.sourceFile.fileName).replace(".d.ts", "")}`,
                extendedAttributes: [ {name: "GlobalScope" } ],
                methods: this.globalScope,
                properties: [],
                constructors: [],
                callables: [],
                inheritance: []
            } as IDLInterface)
        }
        return this.output
    }

    /** visit nodes finding exported classes */
    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node)) {
            this.output.push(this.serializeClass(node))
        } else if (ts.isInterfaceDeclaration(node)) {
            this.output.push(this.serializeInterface(node))
        } else if (ts.isModuleDeclaration(node)) {
            if (this.isKnownAmbientModuleDeclaration(node)) {
                this.output.push(this.serializeAmbientModuleDeclaration(node))
            } else {
                // This is a namespace, visit its children
                ts.forEachChild(node, (node) => this.visit(node));
            }

        } else if (ts.isEnumDeclaration(node)) {
            this.output.push(this.serializeEnum(node))
        } else if (ts.isTypeAliasDeclaration(node)) {
            this.output.push(this.serializeTypeAlias(node))
        } else if (ts.isFunctionDeclaration(node)) {
            this.globalScope.push(this.serializeMethod(node))
        }
    }

    serializeAmbientModuleDeclaration(node: ts.ModuleDeclaration): IDLModuleType {
        const name = nameOrUndefined(node.name) ?? "UNDEFINED_Module"
        return {
            kind: IDLKind.ModuleType,
            name: name,
            extendedAttributes: [ {name: "VerbatimDts", value: `"${escapeAmbientModuleContent(this.sourceFile, node)}"`}]
        }
    }

    serializeTypeAlias(node: ts.TypeAliasDeclaration): IDLTypedef | IDLFunction | IDLInterface {
        const name = nameOrUndefined(node.name) ?? "UNDEFINED_TYPE_NAME"
        if (ts.isImportTypeNode(node.type)) {
            let original = node.type.getText()
            return {
                kind: IDLKind.Typedef,
                name: name,
                extendedAttributes: this.computeDeprecatedExtendAttributes(node, [ { name: "VerbatimDts", value: `"${original}"` }]),
                type: createReferenceType(`Imported${name}`)
            }
        }
        if (ts.isFunctionTypeNode(node.type)) {
            return this.serializeFunctionType(name, node.type)
        }
        if (ts.isTypeLiteralNode(node.type)) {
            return this.serializeObjectType(name, node.type)
        }
        return {
            kind: IDLKind.Typedef,
            name: name,
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            type: this.serializeType(node.type)
        }
    }

    heritageIdentifiers(heritage: ts.HeritageClause): ts.Identifier[] {
        return heritage.types.map(it => {
            return ts.isIdentifier(it.expression) ? it.expression : undefined
        }).filter(it => !!it) as ts.Identifier[]
    }

    baseDeclarations(heritage: ts.HeritageClause): ts.Declaration[] {
        return this.heritageIdentifiers(heritage)
            .map(it => getDeclarationsByNode(this.typeChecker, it)[0])
            .filter(it => !!it)
    }

    serializeHeritage(heritage: ts.HeritageClause): IDLType[] {
        return heritage.types.map(it => {
            const name =
            (ts.isIdentifier(it.expression)) ?
                ts.idText(it.expression) :
                    `NON_IDENTIFIER_HERITAGE ${asString(it)}`
            return createReferenceType(name)
        })
    }

    serializeInheritance(inheritance: ts.NodeArray<ts.HeritageClause> | undefined): IDLType[] {
        return inheritance?.map(it => this.serializeHeritage(it)).flat() ?? []
    }

    computeExtendedAttributes(isClass: boolean, node: ts.ClassDeclaration | ts.InterfaceDeclaration): IDLExtendedAttribute[] | undefined {
        let result: IDLExtendedAttribute[] = []
        if (isClass) result.push({name: "Class"})
        let name = identName(node.name)
        if (name && ts.isClassDeclaration(node) && isCommonMethodOrSubclass(this.typeChecker, node)) {
            result.push({name: "Component", value: PeerGeneratorConfig.mapComponentName(name)})
        }
        if (PeerGeneratorConfig.isKnownParametrized(name)) {
            result.push({name: "Parametrized", value: "T"})
        }
        this.computeDeprecatedExtendAttributes(node, result)
        
        return result.length > 0 ? result : undefined
    }

    computeDeprecatedExtendAttributes(node: ts.Node, attributes: IDLExtendedAttribute[] | undefined = undefined): IDLExtendedAttribute[] | undefined {
        if (isDeprecatedNode(this.sourceFile,node)) {
            let deprecated : IDLExtendedAttribute = {
                name: "Deprecated"
            }
            if (attributes) {
                attributes.push(deprecated)
            } else {
                attributes = [deprecated]
            }
        }
        return attributes
    }

    

    /** Serialize a class information */
    serializeClass(node: ts.ClassDeclaration): IDLInterface {
        this.startScope()
        const result: IDLInterface = {
            kind: IDLKind.Class,
            extendedAttributes: this.computeExtendedAttributes(true, node),
            name: getExportedDeclarationNameByDecl(node) ?? "UNDEFINED",
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: this.serializeInheritance(node.heritageClauses),
            constructors: node.members.filter(ts.isConstructorDeclaration).map(it => this.serializeConstructor(it as ts.ConstructorDeclaration)),
            properties: this.pickProperties(node.members),
            methods: this.pickMethods(node.members),
            callables: []
        }
        result.scope = this.endScope()
        return result
    }

    pickConstructors(members: ReadonlyArray<ts.TypeElement>): IDLConstructor[] {
        return members.filter(ts.isConstructSignatureDeclaration)
            .map(it => this.serializeConstructor(it as ts.ConstructSignatureDeclaration))
    }
    pickProperties(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>): IDLProperty[] {
        return members
            .filter(it => ts.isPropertySignature(it) || ts.isPropertyDeclaration(it) || this.isCommonMethodUsedAsProperty(it))
            .map(it => this.serializeProperty(it))
    }
    pickMethods(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>): IDLMethod[] {
        return members
            .filter(it => (ts.isMethodSignature(it) || ts.isMethodDeclaration(it) || ts.isIndexSignatureDeclaration(it)) && !this.isCommonMethodUsedAsProperty(it))
            .map(it => this.serializeMethod(it as ts.MethodDeclaration|ts.MethodSignature))
    }
    pickCallables(members: ReadonlyArray<ts.TypeElement>): IDLFunction[] {
        return members.filter(ts.isCallSignatureDeclaration)
            .map(it => this.serializeCallable(it))
    }

    fakeOverrides(node: ts.InterfaceDeclaration): ts.TypeElement[] {
        return node.heritageClauses
            ?.flatMap(it => this.baseDeclarations(it))
            ?.flatMap(it => ts.isInterfaceDeclaration(it) ? it.members : [])
            ?.filter(it => !!it) ?? []
    }

    filterNotOverridden(overridden: Set<string>, node: ts.InterfaceDeclaration): ts.TypeElement[] {
        return node.members.filter(it =>
            it.name && ts.isIdentifier(it.name) && !overridden.has(ts.idText(it.name))
        )
    }

    membersWithFakeOverrides(node: ts.InterfaceDeclaration): ts.TypeElement[] {
        const result: ts.TypeElement[] = []
        const worklist: ts.InterfaceDeclaration[] = [node]
        const overridden = new Set<string>()
        while (worklist.length != 0) {
            const next = worklist.shift()!
            const fakeOverrides = this.filterNotOverridden(overridden, next)
            fakeOverrides
                .map(it => nameOrUndefined(it.name))
                .forEach(it => it ? overridden.add(it) : undefined)
            result.push(...fakeOverrides)
            const bases = next.heritageClauses
                ?.flatMap(it => this.baseDeclarations(it))
                ?.filter(it => ts.isInterfaceDeclaration(it)) as ts.InterfaceDeclaration[]
                ?? []
            worklist.push(...bases)
        }
        return result
    }

    // TODO: class and interface look identical, but their elements' types are different
    serializeInterface(node: ts.InterfaceDeclaration): IDLInterface {
        this.startScope()
        const allMembers = this.membersWithFakeOverrides(node)
        const result: IDLInterface = {
            kind: IDLKind.Interface,
            name: getExportedDeclarationNameByDecl(node) ?? "UNDEFINED",
            extendedAttributes: this.computeExtendedAttributes(false, node),
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: this.serializeInheritance(node.heritageClauses),
            constructors: this.pickConstructors(node.members),
            properties: this.pickProperties(allMembers),
            methods: this.pickMethods(allMembers),
            callables: this.pickCallables(node.members)
        }
        result.scope = this.endScope()
        return result
    }

    serializeObjectType(name: string, node: ts.TypeLiteralNode): IDLInterface {
        return {
            kind: IDLKind.AnonymousInterface,
            name: name,
            inheritance: [],
            constructors: this.pickConstructors(node.members),
            properties: this.pickProperties(node.members),
            methods: this.pickMethods(node.members),
            callables: this.pickCallables(node.members)
        }
    }

    serializeEnum(node: ts.EnumDeclaration): IDLEnum {

        return {
            kind: IDLKind.Enum,
            name: ts.idText(node.name),
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            elements: node.members.filter(ts.isEnumMember)
                .map(it => this.serializeEnumMember(it))
        }
    }

    serializeEnumMember(node: ts.EnumMember): IDLEnumMember {
        let isString = false
        let initializer: string|number|undefined = undefined
        if (!node.initializer) {
            // Nothing
        } else if (ts.isStringLiteral(node.initializer)) {
            isString = true
            initializer = node.initializer.text
        } else if (ts.isNumericLiteral(node.initializer)) {
            isString = false
            initializer = node.initializer.text
        } else if (
            ts.isBinaryExpression(node.initializer) &&
            node.initializer.operatorToken.kind == ts.SyntaxKind.LessThanLessThanToken &&
            ts.isNumericLiteral(node.initializer.right) &&
            ts.isNumericLiteral(node.initializer.left)
        ) {
            isString = false
            initializer = (+node.initializer.left.text) << (+node.initializer.right.text)
            // console.log(`Computed ${node.initializer.getText(this.sourceFile)} to `, initializer)
        } else {
            isString = false
            initializer = node.initializer.getText(this.sourceFile)
            console.log("Unrepresentable enum initializer: ", initializer)
        }
        return {
            kind: IDLKind.EnumMember,
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            name: nameOrUndefined(node.name)!,
            type: isString ? createStringType() : createNumberType(),
            initializer: initializer
        }
    }

    serializeFunctionType(name: string, signature: ts.SignatureDeclarationBase): IDLCallback {
        return {
            kind: IDLKind.Callback,
            name: name,
            parameters: signature.parameters.map(it => this.serializeParameter(it)),
            returnType: this.serializeType(signature.type),
        };
    }

    addToScope(callback: IDLEntry) {
        this.currentScope.push(callback)
    }

    isTypeParameterReference(type: ts.TypeNode): boolean {
        if (!ts.isTypeReferenceNode(type)) return false
        const name = type.typeName

        const declaration = getDeclarationsByNode(this.typeChecker, name)[0]
        if (!declaration) return false
        if (ts.isTypeParameterDeclaration(declaration)) return true
        return false
    }

    isKnownParametrizedType(type: ts.TypeNode): boolean {
        if (!ts.isTypeReferenceNode(type)) return false
        let parent = type.parent
        while (parent && !ts.isClassDeclaration(parent) && !ts.isInterfaceDeclaration(parent)) {
            parent = parent.parent
        }
        if (!parent) return false
        const name = identName(parent.name)
        return PeerGeneratorConfig.isKnownParametrized(name)
    }

    isKnownAmbientModuleDeclaration(type: ts.Node): boolean {
        if (!ts.isModuleDeclaration(type)) return false
        const name = identName(type)
        const ambientModuleNames = this.typeChecker.getAmbientModules().map(it=>it.name.replaceAll('\"',""))
        return name != undefined && ambientModuleNames.includes(name)
    }

    warn(message: string) {
        console.log(`WARNING: ${message}`)
    }

    serializeType(type: ts.TypeNode | undefined, nameSuggestion: string|undefined = undefined): IDLType {
        if (type == undefined) return createUndefinedType() // TODO: can we have implicit types in d.ts?

        if (type.kind == ts.SyntaxKind.UndefinedKeyword ||
            type.kind == ts.SyntaxKind.NullKeyword ||
            type.kind == ts.SyntaxKind.VoidKeyword) {
            return createUndefinedType()
        }
        if (type.kind == ts.SyntaxKind.Unknown) {
            return createReferenceType("unknown")
        }

        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return createNumberType()
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return createStringType()
        }
        if (ts.isUnionTypeNode(type)) {
            return createUnionType(
                type.types.map(it => this.serializeType(it))
            )
        }
        if (this.isTypeParameterReference(type)) {
            if (this.isTypeParameterReferenceOfCommonMethod(type) || this.isKnownParametrizedType(type)) {
                return createReferenceType("this")
            }
            return createTypeParameterReference(nameOrUndefined((type as ts.TypeReferenceNode).typeName) ?? "UNEXPECTED_TYPE_PARAMETER")
        }
        if (ts.isTypeReferenceNode(type)) {
            if (ts.isQualifiedName(type.typeName)) {
                let left = type.typeName.left
                let declaration = getDeclarationsByNode(this.typeChecker, left)
                if (declaration.length > 0) {
                    if (ts.isEnumDeclaration(declaration[0])) {
                        return createEnumType(left.getText(left.getSourceFile()))
                    }
                    if (ts.isModuleDeclaration(declaration[0])) {
                        let rightName = type.typeName.right.getText(left.getSourceFile())
                        // TODO: is it right?
                        return createEnumType(`${rightName}`)
                    }
                    throw new Error(`Not supported for now: ${type.getText(this.sourceFile)}`)
                }
            }
            let declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
            if (declaration.length == 0) {
                let name = type.typeName.getText(type.typeName.getSourceFile())
                this.warn(`Do not know type ${name}`)
                return createReferenceType(name)
            }
            let isEnum = ts.isEnumDeclaration(declaration[0])
            const rawType = sanitize(getExportedDeclarationNameByNode(this.typeChecker, type.typeName))!
            const transformedType = typeMapper.get(rawType) ?? rawType
            if (rawType == "AnimationRange") {
                let typeArg = type.typeArguments![0]
                return createReferenceType(`AnimationRange${capitalize(typeArg.getText(this.sourceFile))}`)
            }
            if (rawType == "Array" || rawType == "Promise" || rawType == "Map") {
                return createContainerType(transformedType, type.typeArguments!.map(it => this.serializeType(it)))
            }
            return isEnum ? createEnumType(transformedType) : createReferenceType(transformedType)
        }
        if (ts.isArrayTypeNode(type)) {
            return createContainerType("sequence", [this.serializeType(type.elementType)])
        }
        if (ts.isTupleTypeNode(type)) {
            // TODO: handle heterogeneous types.
            return createContainerType("sequence", [this.serializeType(type.elements[0])])
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.serializeType(type.type)
        }
        if (ts.isFunctionTypeNode(type)) {
            const counter = this.compileContext.functionCounter++
            const name = `${nameSuggestion??"callback"}__${counter}`
            const callback = this.serializeFunctionType(name, type)
            this.addToScope(callback)
            return createReferenceType(name)
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            // TODO: plain wrong.
            return createStringType()
        }
        if (ts.isTypeLiteralNode(type)) {
            const counter = this.compileContext.objectCounter++
            const name = `${nameSuggestion ?? "anonymous_interface"}__${counter}`
            const literal = this.serializeObjectType(name, type)
            this.addToScope(literal)
            return createReferenceType(name)
        }
        if (ts.isLiteralTypeNode(type)) {
            const literal = type.literal
            if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal) || ts.isRegularExpressionLiteral(literal)) {
                return createStringType()
            }
            if (ts.isNumericLiteral(literal)) {
                return createNumberType()
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return createUndefinedType()
            }
            throw new Error(`Non-representable type: ${asString(type)}`)
            return createAnyType("/* Non-representable literal type */ ")
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return createStringType()
        }
        if (ts.isImportTypeNode(type)) {
            let originalText = `${type.getText(this.sourceFile)}`
            this.warn(`import type: ${originalText}`)
            let where = type.argument.getText(type.getSourceFile()).split("/").map(it => it.replaceAll("'", ""))
            let what = asString(type.qualifier)
            let typeName = `/* ${type.getText(this.sourceFile)} */ ` + sanitize(what == "default" ? "Imported" + where[where.length - 1] : "Imported" +  what)
            let result = createReferenceType(typeName)
            result.extendedAttributes = [{ name: "Import", value: originalText}]
            return result
        }
        if (ts.isNamedTupleMember(type)) {
            return this.serializeType(type.type)
        }
        // Falling back to original TS text
        // TODO: this doesn't work when the node is in another source file.
        // Such types can come from fake overrides.
        let rawType = type.getText(this.sourceFile)
        const transformedType = typeMapper.get(rawType) ?? rawType
        return createReferenceType(transformedType)
    }

    isTypeParameterReferenceOfCommonMethod(type: ts.TypeNode): boolean {
        if (!ts.isTypeReferenceNode(type)) return false
        const name = type.typeName
        const declaration = getDeclarationsByNode(this.typeChecker, name)[0]
        if (!declaration) return false
        if (ts.isTypeParameterDeclaration(declaration)) {
            let parent = declaration.parent
            if (ts.isClassDeclaration(parent)) {
                return isCommonMethodOrSubclass(this.typeChecker, parent)
            }
        }
        return false
    }


    deduceFromComputedProperty(name: ts.PropertyName): string | undefined {
        if (!ts.isComputedPropertyName(name)) return undefined
        const expression = name.expression
        if (!ts.isPropertyAccessExpression(expression)) return undefined
        const receiver = expression.expression
        if (!ts.isIdentifier(receiver)) return undefined
        const field = expression.name
        if (!ts.isIdentifier(field)) return undefined

        const enumDeclaration = getDeclarationsByNode(this.typeChecker, receiver)[0]
        if (!enumDeclaration || !ts.isEnumDeclaration(enumDeclaration)) return undefined
        const enumMember = getDeclarationsByNode(this.typeChecker, field)[0]
        if (!enumMember || !ts.isEnumMember(enumMember)) return undefined
        const initializer = enumMember.initializer
        if (!initializer || !ts.isStringLiteral(initializer)) return undefined

        return initializer.text
    }

    propertyName(name: ts.PropertyName): string | undefined {
        return this.deduceFromComputedProperty(name) ?? nameOrUndefined(name)
    }

    serializeProperty(property: ts.TypeElement | ts.ClassElement): IDLProperty {
        if (ts.isMethodDeclaration(property) || ts.isMethodSignature(property)) {
            const name = asString(property.name)
            if (!this.isCommonMethodUsedAsProperty(property)) throw new Error("Wrong")
            return {
                kind: IDLKind.Property,
                name: name,
                extendedAttributes: this.computeDeprecatedExtendAttributes(property,[{ name: "CommonMethod" } ]),
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
                type: this.serializeType(property.parameters[0].type),
                isReadonly: false,
                isStatic: false,
                isOptional: false
            }
        }

        if (ts.isPropertyDeclaration(property) || ts.isPropertySignature(property)) {
            const name = this.propertyName(property.name)
            let extendedAttributes = !!property.questionToken ? [{name: 'Optional'}] : undefined
            return {
                kind: IDLKind.Property,
                name: name!,
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
                type: this.serializeType(property.type, name),
                isReadonly: isReadonly(property.modifiers),
                isStatic: isStatic(property.modifiers),
                isOptional: !!property.questionToken,
                extendedAttributes: this.computeDeprecatedExtendAttributes(property,extendedAttributes),
            }
        }
        throw new Error("Unknown")
    }

    serializeParameter(parameter: ts.ParameterDeclaration): IDLParameter {
        const name = nameOrUndefined(parameter.name)
        return {
            kind: IDLKind.Parameter,
            name: name ?? "Unexpected property name",
            type: this.serializeType(parameter.type, name),
            isVariadic: !!parameter.dotDotDotToken,
            isOptional: !!parameter.questionToken
        }
    }

    isCommonAttributeMethod(method: ts.MethodDeclaration|ts.MethodSignature): boolean {
        let parent = method.parent
        if (ts.isClassDeclaration(parent)) {
            return isCommonMethodOrSubclass(this.typeChecker, parent)
        }
        return false
    }

    isCommonMethodUsedAsProperty(member: ts.ClassElement | ts.TypeElement): member is (ts.MethodDeclaration | ts.MethodSignature) {
        return (this.options.commonToAttributes ?? true) &&
            (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) &&
            this.isCommonAttributeMethod(member) &&
            member.parameters.length == 1
    }

    /** Serialize a signature (call or construct) */
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.IndexSignatureDeclaration | ts.FunctionDeclaration): IDLMethod {
        if (ts.isIndexSignatureDeclaration(method)) {
            return {
                kind: IDLKind.Method,
                name: "indexSignature",
                documentation: getDocumentation(this.sourceFile, method, this.options.docs),
                returnType: this.serializeType(method.type),
                extendedAttributes: this.computeDeprecatedExtendAttributes(method,[{name: 'IndexSignature' }]),
                isStatic: false,
                parameters: method.parameters.map(it => this.serializeParameter(it))
            }
        }
        let [methodName, escapedName] = escapeMethodName(method.name!.getText(this.sourceFile))
        let extendedAttributes : IDLExtendedAttribute[] | undefined = (methodName != escapedName) ? [ { name: "DtsName", value: `"${methodName}"`} ] : undefined
       
        return {
            kind: IDLKind.Method,
            name: escapedName,
            extendedAttributes: this.computeDeprecatedExtendAttributes(method,extendedAttributes),
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it)),
            returnType: this.serializeType(method.type),
            isStatic: isStatic(method.modifiers)
        };
    }

    serializeCallable(method: ts.CallSignatureDeclaration): IDLCallable {
        return {
            kind: IDLKind.Callable,
            name: "invoke",
            extendedAttributes: this.computeDeprecatedExtendAttributes(method,[{name: "CallSignature"}]),
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it)),
            returnType: this.serializeType(method.type),
            isStatic: false
        };
    }

    serializeConstructor(constr: ts.ConstructorDeclaration|ts.ConstructSignatureDeclaration): IDLConstructor {
        constr.parameters.forEach(it => {
            if (isNodePublic(it)) console.log("TODO: count public/private/protected constructor args as properties")
        })

        return {
            kind: IDLKind.Constructor,
            // documentation: getDocumentationComment(constr),
            extendedAttributes: this.computeDeprecatedExtendAttributes(constr),
            parameters: constr.parameters.map(it => this.serializeParameter(it)),
            returnType: this.serializeType(constr.type),
        };
    }
}

function sanitize(type: stringOrNone): stringOrNone {
    if (!type) return undefined
    let dotIndex = type.lastIndexOf(".")
    if (dotIndex >= 0) {
        return type.substring(dotIndex + 1)
    } else {
        return type
    }
}

function escapeMethodName(name: string) : [string, string] {
    if (name.startsWith("$")) return [name, name.replace("$", "dollar_")]
    return [name, name]
}

function escapeAmbientModuleContent(sourceFile: ts.SourceFile, node: ts.Node) : string {
    const { pos, end} = node
    const content = sourceFile.text.substring(pos,end)
    return content.replaceAll('"', "'")
}

function getDocumentation(sourceFile: ts.SourceFile, node: ts.Node, docsOption: string): string | undefined {
    switch (docsOption) {
        case 'all': return getComment(sourceFile, node)
        case 'opt': return dedupDocumentation(getComment(sourceFile, node))
        case 'none': return undefined
        default: throw new Error(`Unknown option docs=${docsOption}`)
    }
}

function isDeprecatedNode(sourceFile: ts.SourceFile, node: ts.Node): boolean {
    const docs = getComment(sourceFile,node)
    const comments = parse(docs)
    return comments.map(it => it.tags).flatMap(it => it.map(i => i.tag)).some(it => it == 'deprecated')

}
function dedupDocumentation(documentation: string): string {
    let seen: Set<string> = new Set()
    let firstLine = false
    return documentation
        .split('\n')
        .filter(it => {
            let t = it.trim()
            if (t.startsWith('/*')) {
                firstLine = true
                return true
            }
            if (t == '' || t === '*') {
                // skip empty line at start of a comment
                return !firstLine
            }
            if (t.startsWith('*/')) return true
            if (!seen.has(it)) {
                seen.add(it)
                firstLine = false
                return true
            }
            return false
        })
        .join('\n')
}
