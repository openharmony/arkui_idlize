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
    createAnyType, createContainerType, createNumberType, createReferenceType, createStringType, createTypedef,
    createTypeParameterReference, createUndefinedType, createUnionType, IDLCallable, IDLCallback, IDLConstructor,
    IDLEntry, IDLEnum, IDLEnumMember, IDLFunction, IDLInterface, IDLKind, IDLMethod, IDLParameter, IDLProperty, IDLType
} from "./idl"
import {
    asString, capitalize, getComment, getDeclarationsByNode, isCommonAttribute, isNodePublic, isReadonly, isStatic, nameOrNullForIdl as nameOrUndefined
} from "./util"
import { GenericVisitor } from "./options"

const typeMapper = new Map<string, string>(
    [
        ["null", "undefined"],
        ["void", "undefined"],
        ["Array", "sequence"],
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
    scopes:  IDLEntry[][] = []
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
        private commonToAttributes: boolean) { }

    visitWholeFile(): IDLEntry[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        return this.output
    }

    /** visit nodes finding exported classes */
    visit(node: ts.Node) {
        if (ts.isClassDeclaration(node)) {
            this.output.push(this.serializeClass(node))
        } else if (ts.isInterfaceDeclaration(node)) {
            this.output.push(this.serializeInterface(node))
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, (node) => this.visit(node));
        } else if (ts.isEnumDeclaration(node)) {
            this.output.push(this.serializeEnum(node))
        } else if (ts.isTypeAliasDeclaration(node)) {
            this.output.push(this.serializeTypeAlias(node))
        }
    }

    serializeTypeAlias(node: ts.TypeAliasDeclaration): IDLEntry {
        const name = nameOrUndefined(node.name) ?? "UNDEFINED_TYPE_NAME"
        if (ts.isFunctionTypeNode(node.type)) {
            return this.serializeFunctionType(name, node.type)
        }
        if (ts.isTypeLiteralNode(node.type)) {
            return this.serializeObjectType(name, node.type)
        }
        return createTypedef(name, this.serializeType(node.type))
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

    computeExtendedAttributes(isClass: boolean, node: ts.ClassDeclaration | ts.InterfaceDeclaration): string[] | undefined {
        let result: string[] = []
        if (isClass) result.push("Class")
        let name = asString(node.name)
        if (name == "CommonMethod" || name == "CommonShapeMethod" || name.endsWith("Attribute")) {
            result.push("Component")
        }
        return result.length > 0 ? result : undefined
    }

    /** Serialize a class information */
    serializeClass(node: ts.ClassDeclaration): IDLInterface {
        this.startScope()
        const result: IDLInterface = {
            kind: IDLKind.Class,
            extendedAttributes: this.computeExtendedAttributes(true, node),
            name: ts.idText(node.name!),
            documentation: getComment(this.sourceFile, node),
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
            .filter(it => (ts.isMethodSignature(it) || ts.isMethodDeclaration(it)) && !this.isCommonMethodUsedAsProperty(it))
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
            name: ts.idText(node.name),
            extendedAttributes: this.computeExtendedAttributes(false, node),
            documentation: getComment(this.sourceFile, node),
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
            callables: []
        }
    }

    serializeEnum(node: ts.EnumDeclaration): IDLEnum {
        return {
            kind: IDLKind.Enum,
            name: ts.idText(node.name),
            documentation: getComment(this.sourceFile, node),
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
        const name = asString((type.parent.parent as ts.NamedDeclaration).name)
        return name == "Indicator"
    }

    serializeType(type: ts.TypeNode | undefined, nameSuggestion: string|undefined = undefined): IDLType {
        if (type == undefined) return createUndefinedType() // TODO: can we have implicit types in d.ts?
        if (type.kind == ts.SyntaxKind.UndefinedKeyword ||
            type.kind == ts.SyntaxKind.NullKeyword) {
            return createUndefinedType()
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
            const rawType = nameOrUndefined(type.typeName) ?? "undefined"
            const transformedType = typeMapper.get(rawType) ?? rawType
            if (rawType == "AnimationRange") {
                let typeArg = type.typeArguments![0]
                return createReferenceType(`AnimationRange${capitalize(typeArg.getText(this.sourceFile))}`)
            }
            if (rawType == "Array" || rawType == "Map" || rawType == "Promise") {
                return createContainerType(transformedType, type.typeArguments?.map(it => this.serializeType(it))?.[0]!)
            }

            return createReferenceType(transformedType)
        }
        if (ts.isArrayTypeNode(type)) {
            return createContainerType("sequence", this.serializeType(type.elementType))
        }
        if (ts.isTupleTypeNode(type)) {
            // TODO: handle heterogeneous types.
            return createContainerType("sequence", this.serializeType(type.elements[0]))
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
            console.log(`Warning: import type: ${type.getText(this.sourceFile)}`)
            let where = type.argument.getText(type.getSourceFile()).split("/").map(it => it.replaceAll("'", ""))
            let what = asString(type.qualifier)
            let typeName = `/* ${type.getText(this.sourceFile)} */ ` + (what == "default" ? "Imported" + where[where.length - 1] : "Imported" +  what)
            let result = createReferenceType(typeName)
            result.extendedAttributes = ["Import"]
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
                let declName = asString(parent.name)
                return isCommonAttribute(declName)
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
                extendedAttributes: [`CommonMethod`],
                documentation: getComment(this.sourceFile, property),
                type: this.serializeType(property.parameters[0].type),
                isReadonly: false,
                isStatic: false,
                isOptional: false
            }
        }

        if (ts.isPropertyDeclaration(property) || ts.isPropertySignature(property)) {
            const name = this.propertyName(property.name)
            return {
                kind: IDLKind.Property,
                name: name!,
                documentation: getComment(this.sourceFile, property),
                type: this.serializeType(property.type, name),
                isReadonly: isReadonly(property.modifiers),
                isStatic: isStatic(property.modifiers),
                isOptional: !!property.questionToken,
                extendedAttributes: !!property.questionToken ? ['Optional'] : undefined,
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
        if (ts.isClassDeclaration(parent) || ts.isInterfaceDeclaration(parent)) {
            let parentName = asString(parent.name)
            return isCommonAttribute(parentName) || parentName.endsWith("Attribute")
        }
        return false
    }

    isCommonMethodUsedAsProperty(member: ts.ClassElement | ts.TypeElement): member is (ts.MethodDeclaration | ts.MethodSignature) {
        return this.commonToAttributes &&
            (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) &&
            this.isCommonAttributeMethod(member) &&
            member.parameters.length == 1
    }

    /** Serialize a signature (call or construct) */
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature): IDLMethod {
        if (!ts.isIdentifier(method.name)) {
            throw new Error(`Method name is not ts.Identifier: ${method}`)
        }
        return {
            kind: IDLKind.Method,
            name: ts.idText(method.name),
            documentation: getComment(this.sourceFile, method),
            parameters: method.parameters.map(it => this.serializeParameter(it)),
            returnType: this.serializeType(method.type),
            isStatic: isStatic(method.modifiers)
        };
    }

    serializeCallable(method: ts.CallSignatureDeclaration): IDLCallable {
        return {
            kind: IDLKind.Callable,
            name: "invoke",
            extendedAttributes: ["CallSignature"],
            documentation: getComment(this.sourceFile, method),
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
            parameters: constr.parameters.map(it => this.serializeParameter(it)),
            returnType: this.serializeType(constr.type),
        };
    }
}
