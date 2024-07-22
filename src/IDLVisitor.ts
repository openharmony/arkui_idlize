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
    createBooleanType, createContainerType, createEnumType, createNullType, createNumberType, createReferenceType, createStringType, createTypedef,
    createTypeParameterReference, createUndefinedType, createUnionType, createVoidType, IDLCallable, IDLCallback, IDLConstant, IDLConstructor,
    IDLEntity, IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLFunction, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLTopType, IDLType, IDLTypedef
} from "./idl"
import {
    asString, capitalize, getComment, getDeclarationsByNode, getExportedDeclarationNameByDecl, getExportedDeclarationNameByNode, identName, isCommonMethodOrSubclass, isNodePublic, isReadonly, isStatic, nameOrNull, nameOrNullForIdl as nameOrUndefined, stringOrNone
} from "./util"
import { GenericVisitor } from "./options"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"
import { OptionValues } from "commander"

const typeMapper = new Map<string, string>(
    [
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
    typeNames: Set<string> = new Set()

    uniqualize(typeName: string): string {
        let name = typeName
        for (let i = 0; this.typeNames.has(name); i++) {
            name = `${typeName}${i}`
        }
        this.typeNames.add(name)
        return name
    }
}

export class IDLVisitor implements GenericVisitor<IDLEntry[]> {
    private output: IDLEntry[] = []
    private currentScope:  IDLEntry[] = []
    scopes: IDLEntry[][] = []
    imports: string[] = []
    namespaces: string[] = []
    globalConstants: IDLConstant[] = []
    globalFunctions: IDLMethod[] = []

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
        this.addMeta()
        if (this.globalConstants.length > 0 || this.globalFunctions.length > 0) {
            this.output.push({
                kind: IDLKind.Interface,
                name: `GlobalScope_${path.basename(this.sourceFile.fileName).replace(".d.ts", "")}`,
                extendedAttributes: [ {name: "GlobalScope" } ],
                methods: this.globalFunctions,
                constants: this.globalConstants,
                properties: [],
                constructors: [],
                callables: [],
                inheritance: []
            } as IDLInterface)
        }
        return this.output
    }

    makeEnumMember(name: string, value: string): IDLEnumMember {
        return { name: name, kind: IDLKind.EnumMember, type: { name: "DOMString", kind: IDLKind.PrimitiveType }, initializer: value }
    }

    addMeta() {
        this.output.unshift({
            kind: IDLKind.Enum,
            name: `Metadata`,
            extendedAttributes: [ {name: "Synthetic" } ],
            elements: [
                this.makeEnumMember("package", "org.openharmony.arkui"),
                this.makeEnumMember("imports", this.imports.join("\n")),
            ]
        } as IDLEnum)
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
                if (node.body) {
                    this.namespaces.unshift(node.name.getText())
                    ts.forEachChild(node.body, (node) => this.visit(node));
                    this.namespaces.shift()
                }
            }
        } else if (ts.isEnumDeclaration(node)) {
            this.output.push(this.serializeEnum(node))
        } else if (ts.isTypeAliasDeclaration(node)) {
            this.output.push(this.serializeTypeAlias(node))
        } else if (ts.isFunctionDeclaration(node)) {
            this.globalFunctions.push(this.serializeMethod(node, ""))
        } else if (ts.isVariableStatement(node)) {
            this.globalConstants.push(...this.serializeConstants(node))
        } else if (ts.isImportDeclaration(node)) {
            this.imports.push(node.getText())
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
            return this.serializeObjectType(name, node.type, node.typeParameters)
        }
        if (ts.isTupleTypeNode(node.type)) {
            return this.serializeTupleType(name, node.type, node.typeParameters)
        }
        if (ts.isTypeOperatorNode(node.type)) {
            if (ts.isTupleTypeNode(node.type.type)) {
                return this.serializeTupleType(name, node.type.type, node.typeParameters, true)
            }
        }
        this.startScope()
        return {
            kind: IDLKind.Typedef,
            name: name,
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            type: this.serializeType(node.type, name),
            scope: this.endScope()
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

    computeNamespaceAttribute() {
        const namespace = this.namespaces[0]
        return namespace ? [{name: "Namespace", value: namespace}] : []
    }

    computeExtendedAttributes(
        node: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.TypeLiteralNode | ts.TupleTypeNode,
        typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>
    ): IDLExtendedAttribute[] {
        const result = this.computeNamespaceAttribute()
        let entityValue: string = IDLEntity.Interface
        if (ts.isClassDeclaration(node)) entityValue = IDLEntity.Class
        else if (ts.isTypeLiteralNode(node)) entityValue = IDLEntity.Literal
        else if (ts.isTupleTypeNode(node)) {
            const isNamedTuple = node.elements.some(it => ts.isNamedTupleMember(it))
            entityValue = isNamedTuple ? IDLEntity.NamedTuple : IDLEntity.Tuple
        }
        result.push({name: "Entity", value: entityValue })
        if (typeParameters) {
            result.push({
                name : "TypeParameters",
                value: typeParameters.map(it => it.getText()).join(",")})
        }
        return result
    }

    computeComponentExtendedAttributes(node: ts.ClassDeclaration | ts.InterfaceDeclaration, inheritance: IDLType[]): IDLExtendedAttribute[] | undefined {
        let result: IDLExtendedAttribute[] = this.computeExtendedAttributes(node, node.typeParameters)
        let name = identName(node.name)
        if (name && ts.isClassDeclaration(node) && isCommonMethodOrSubclass(this.typeChecker, node)) {
            result.push({name: "Component", value: PeerGeneratorConfig.mapComponentName(name)})
        }
        if (inheritance.length > 1) {
            result.push({name: "Interfaces", value: inheritance.slice(1).map(it => it.name).join(", ")})
        }
        return this.computeDeprecatedExtendAttributes(node, result)
    }

    computeDeprecatedExtendAttributes(node: ts.Node, attributes: IDLExtendedAttribute[] = []): IDLExtendedAttribute[] | undefined {
        if (isDeprecatedNode(this.sourceFile,node)) {
            attributes.push({ name: "Deprecated" })
        }
        return attributes
    }



    /** Serialize a class information */
    serializeClass(node: ts.ClassDeclaration): IDLInterface {
        this.startScope()
        const inheritance = this.serializeInheritance(node.heritageClauses)
        const hasSuperClass = node.heritageClauses
            ?.filter(it => it.token === ts.SyntaxKind.ExtendsKeyword)
            .flatMap(it => it.types)
            .find(_ => true)
        if (!hasSuperClass) inheritance.unshift(IDLTopType)
        const name = getExportedDeclarationNameByDecl(node) ?? "UNDEFINED"
        return {
            kind: IDLKind.Class,
            extendedAttributes: this.computeComponentExtendedAttributes(node, inheritance),
            name: name,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: inheritance,
            constructors: node.members.filter(ts.isConstructorDeclaration).map(it => this.serializeConstructor(it as ts.ConstructorDeclaration, name)),
            constants: [],
            properties: this.pickProperties(node.members, name),
            methods: this.pickMethods(node.members, name),
            callables: [],
            scope: this.endScope()
        }
    }

    pickConstructors(members: ReadonlyArray<ts.TypeElement>, typePrefix: string): IDLConstructor[] {
        return members.filter(ts.isConstructSignatureDeclaration)
            .map(it => this.serializeConstructor(it as ts.ConstructSignatureDeclaration, typePrefix))
    }
    pickProperties(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, typePrefix: string): IDLProperty[] {
        return members
            .filter(it => ts.isPropertySignature(it) || ts.isPropertyDeclaration(it) || this.isCommonMethodUsedAsProperty(it))
            .map(it => this.serializeProperty(it, typePrefix))
    }
    pickMethods(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, typePrefix: string): IDLMethod[] {
        return members
            .filter(it => (ts.isMethodSignature(it) || ts.isMethodDeclaration(it) || ts.isIndexSignatureDeclaration(it)) && !this.isCommonMethodUsedAsProperty(it))
            .map(it => this.serializeMethod(it as ts.MethodDeclaration|ts.MethodSignature, typePrefix))
    }
    pickCallables(members: ReadonlyArray<ts.TypeElement>, typePrefix: string): IDLFunction[] {
        return members.filter(ts.isCallSignatureDeclaration)
            .map(it => this.serializeCallable(it, typePrefix))
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
        const allMembers = node.members.filter(it => it.name && ts.isIdentifier(it.name))
        const inheritance = this.serializeInheritance(node.heritageClauses)
        const name = getExportedDeclarationNameByDecl(node) ?? "UNDEFINED"
        return {
            kind: IDLKind.Interface,
            name: name,
            extendedAttributes: this.computeComponentExtendedAttributes(node, inheritance),
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: inheritance,
            constructors: this.pickConstructors(node.members, name),
            constants: [],
            properties: this.pickProperties(allMembers, name),
            methods: this.pickMethods(allMembers, name),
            callables: this.pickCallables(node.members, name),
            scope: this.endScope()
        }
    }

    serializeObjectType(name: string, node: ts.TypeLiteralNode, typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>): IDLInterface {
        return {
            kind: IDLKind.AnonymousInterface,
            name: name,
            inheritance: [],
            constructors: this.pickConstructors(node.members, name),
            constants: [],
            properties: this.pickProperties(node.members, name),
            methods: this.pickMethods(node.members, name),
            callables: this.pickCallables(node.members, name),
            extendedAttributes: this.computeExtendedAttributes(node, typeParameters),
        }
    }

    serializeTupleType(name: string, node: ts.TupleTypeNode, typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>, withOperator: boolean = false): IDLInterface {
        return {
            kind: IDLKind.TupleInterface,
            name: name,
            extendedAttributes: this.computeExtendedAttributes(node, typeParameters),
            inheritance: [],
            constants: [],
            constructors: [],
            properties: node.elements.map((it, index) => this.serializeTupleProperty(it, index, name, withOperator)),
            methods: [],
            callables: [],
        }
    }

    serializeEnum(node: ts.EnumDeclaration): IDLEnum {
        return {
            kind: IDLKind.Enum,
            name: ts.idText(node.name),
            extendedAttributes: this.computeDeprecatedExtendAttributes(node, this.computeNamespaceAttribute()),
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
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            type: isString ? createStringType() : createNumberType(),
            initializer: initializer
        }
    }

    serializeFunctionType(name: string, signature: ts.SignatureDeclarationBase): IDLCallback {
        return {
            kind: IDLKind.Callback,
            name: name,
            parameters: signature.parameters.map(it => this.serializeParameter(it, name)),
            returnType: this.serializeType(signature.type, name),
        };
    }

    addToScope(entry: IDLEntry) {
        entry.extendedAttributes ??= []
        entry.extendedAttributes.push({ name: "Synthetic" })
        this.currentScope.push(entry)
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

    serializeType(type: ts.TypeNode | undefined, nameSuggestion: string): IDLType {
        if (type == undefined) return createUndefinedType() // TODO: can we have implicit types in d.ts?

        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return createUndefinedType()
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return createNullType()
        }
        if (type.kind == ts.SyntaxKind.VoidKeyword) {
            return createVoidType()
        }
        if (type.kind == ts.SyntaxKind.UnknownKeyword) {
            return createReferenceType("unknown")
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return createReferenceType("any")
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return createReferenceType("object")
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return createNumberType()
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return createBooleanType()
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return createStringType()
        }
        if (ts.isUnionTypeNode(type)) {
            return createUnionType(
                type.types.map((it, index) => this.serializeType(it, `${nameSuggestion}_${index}`))
            )
        }
        if (this.isTypeParameterReference(type)) {
            return createTypeParameterReference(nameOrUndefined((type as ts.TypeReferenceNode).typeName) ?? "UNEXPECTED_TYPE_PARAMETER")
        }
        if (ts.isTypeReferenceNode(type)) {
            if (ts.isQualifiedName(type.typeName)) {
                const result = createReferenceType(type.typeName.right.getText())
                result.extendedAttributes = [{name: "Qualifier", value: type.typeName.left.getText()}]
                return result
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
            if (rawType == "Array" || rawType == "Promise" || rawType == "Map") {
                return createContainerType(transformedType, type.typeArguments!.map((it, index) => this.serializeType(it, `${nameSuggestion}_Param${index}`)))
            }
            if (isEnum) {
                return createEnumType(transformedType)
            }
            let result = createReferenceType(transformedType)
            if (type.typeArguments) {
                result.extendedAttributes = [{
                    name : "TypeArguments",
                    value: type.typeArguments!
                        .map(it => it.getText())
                        .join(",")
                }]
            }
            return result;
        }
        if (ts.isThisTypeNode(type)) {
            return createReferenceType("this")
        }
        if (ts.isArrayTypeNode(type)) {
            return createContainerType("sequence", [this.serializeType(type.elementType, `${nameSuggestion}_Param0`)])
        }
        if (ts.isTupleTypeNode(type)) {
            //TODO: template tuple not include
            const name = this.compileContext.uniqualize(`${nameSuggestion}_Tuple`)
            const literal = this.serializeTupleType(name, type)
            this.addToScope(literal)
            return createReferenceType(name)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.serializeType(type.type, nameSuggestion)
        }
        if (ts.isFunctionTypeNode(type) || ts.isConstructorTypeNode(type)) {
            const name = this.compileContext.uniqualize(`${nameSuggestion}_Callback`)
            const callback = this.serializeFunctionType(name, type)
            this.addToScope(callback)
            return createReferenceType(name)
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            // TODO: plain wrong.
            return createStringType()
        }
        if (ts.isTypeLiteralNode(type)) {
            const name = this.compileContext.uniqualize(`${nameSuggestion}_Object`)
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
            return this.serializeType(type.type, `${nameSuggestion}_${identName(type.name)}_Type`)
        }
        throw new Error(`Unsupported ${type.getText()} ${type.kind}`)
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

    serializeProperty(property: ts.TypeElement | ts.ClassElement, typePrefix: string): IDLProperty {
        const [propName, escapedName] = escapeName(this.propertyName(property.name!)!)
        const extAttrs: IDLExtendedAttribute[] = propName !== escapedName ? [{ name: "DtsName", value: propName}] : []
        if (ts.isMethodDeclaration(property) || ts.isMethodSignature(property)) {
            if (!this.isCommonMethodUsedAsProperty(property)) throw new Error("Wrong")
            extAttrs.push({ name: "CommonMethod" })
            return {
                kind: IDLKind.Property,
                name: escapedName,
                extendedAttributes: this.computeDeprecatedExtendAttributes(property, extAttrs),
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
                type: this.serializeType(property.parameters[0].type, `${typePrefix}_${escapedName}`),
                isReadonly: false,
                isStatic: false,
                isOptional: false
            }
        }

        if (ts.isPropertyDeclaration(property) || ts.isPropertySignature(property)) {
            const name = this.propertyName(property.name)!
            if (property.questionToken)
                extAttrs.push({name: 'Optional'})
            return {
                kind: IDLKind.Property,
                name: name,
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
                type: this.serializeType(property.type, `${typePrefix}_${name}`),
                isReadonly: isReadonly(property.modifiers),
                isStatic: isStatic(property.modifiers),
                isOptional: !!property.questionToken,
                extendedAttributes: this.computeDeprecatedExtendAttributes(property, extAttrs),
            }
        }
        throw new Error("Unknown")
    }

    serializeTupleProperty(property: ts.NamedTupleMember | ts.TypeNode, index: number, typePrefix: string, isReadonly: boolean = false): IDLProperty {
        if (ts.isNamedTupleMember(property)) {
            const name = this.propertyName(property.name)!
            return {
                kind: IDLKind.Property,
                name: name,
                documentation: undefined,
                type: this.serializeType(property.type, `${typePrefix}_${name}`),
                isReadonly: isReadonly,
                isStatic: false,
                isOptional: !!property.questionToken,
                extendedAttributes: !!property.questionToken ? [{name: 'Optional'}] : undefined,
            }
        }
        const isOptional = ts.isOptionalTypeNode(property)

        return {
            kind: IDLKind.Property,
            name: `value${index}`,
            documentation: undefined,
            type: this.serializeType(isOptional ? property.type : property, `${typePrefix}_${index}`),
            isReadonly: isReadonly,
            isStatic: false,
            isOptional: isOptional,
            extendedAttributes: isOptional ? [{name: 'Optional'}] : undefined,
        }
    }

    serializeParameter(parameter: ts.ParameterDeclaration, namePrefix: string): IDLParameter {
        const name = nameOrUndefined(parameter.name)!
        return {
            kind: IDLKind.Parameter,
            name: name,
            type: this.serializeType(parameter.type, `${namePrefix}_${name}`),
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
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.IndexSignatureDeclaration | ts.FunctionDeclaration, namePrefix: string): IDLMethod {
        const typeParams = method.typeParameters?.map(it => it.getText()).join(",")
        let extendedAttributes: IDLExtendedAttribute[] = typeParams ? [{name: "TypeParameters", value: typeParams}] : []
        if (ts.isIndexSignatureDeclaration(method)) {
            extendedAttributes.push({name: 'IndexSignature' })
            return {
                kind: IDLKind.Method,
                name: "indexSignature",
                documentation: getDocumentation(this.sourceFile, method, this.options.docs),
                returnType: this.serializeType(method.type, `${namePrefix}_indexSignature_Type`),
                extendedAttributes: this.computeDeprecatedExtendAttributes(method, extendedAttributes),
                isStatic: false,
                isOptional: false,
                parameters: method.parameters.map(it => this.serializeParameter(it, `${namePrefix}_indexSignature`))
            }
        }
        const [methodName, escapedName] = escapeName(nameOrUndefined(method.name)!)
        const returnType = this.serializeType(method.type, `${namePrefix}_${escapedName}_Type`)
        extendedAttributes = this.liftExtendedAttributes(extendedAttributes, returnType)
        if (methodName !== escapedName)
            extendedAttributes.push({ name: "DtsName", value: methodName})
        if (!!method.questionToken)
            extendedAttributes.push({name: 'Optional'})
        return {
            kind: IDLKind.Method,
            name: escapedName,
            extendedAttributes: this.computeDeprecatedExtendAttributes(method,extendedAttributes),
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, `${namePrefix}_${escapedName}`)),
            returnType: returnType,
            isStatic: isStatic(method.modifiers),
            isOptional: !!method.questionToken
        };
    }

    serializeCallable(method: ts.CallSignatureDeclaration, namePrefix: string): IDLCallable {
        const returnType = this.serializeType(method.type, `${namePrefix}_invoke_Type`)
        const extendedAttributes = this.liftExtendedAttributes([{name: "CallSignature"}], returnType)
        return {
            kind: IDLKind.Callable,
            name: "invoke",
            extendedAttributes: this.computeDeprecatedExtendAttributes(method, extendedAttributes),
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, `${namePrefix}_invoke`)),
            returnType: returnType,
            isStatic: false
        };
    }

    private liftExtendedAttributes(extendedAttributes: IDLExtendedAttribute[], returnType: IDLType): IDLExtendedAttribute[] {
        if (returnType.extendedAttributes) {
            // Lift return type's attributes to method level
            extendedAttributes.push(...returnType.extendedAttributes)
            returnType.extendedAttributes = undefined
        }
        return extendedAttributes
    }

    serializeConstructor(constr: ts.ConstructorDeclaration|ts.ConstructSignatureDeclaration, namePrefix: string): IDLConstructor {
        constr.parameters.forEach(it => {
            if (isNodePublic(it)) console.log("TODO: count public/private/protected constructor args as properties")
        })

        return {
            kind: IDLKind.Constructor,
            // documentation: getDocumentationComment(constr),
            extendedAttributes: this.computeDeprecatedExtendAttributes(constr),
            parameters: constr.parameters.map(it => this.serializeParameter(it, `${namePrefix}_constructor`)),
            returnType: this.serializeType(constr.type, `${namePrefix}_constructor_Type`),
        };
    }

    serializeConstants(stmt: ts.VariableStatement): IDLConstant[] {
        return stmt.declarationList.declarations
            .filter(decl => decl.initializer)
            .map(decl => {
                const name = nameOrNull(decl.name)!
                return {
                    kind: IDLKind.Const,
                    name: name,
                    type: this.serializeType(decl.type, `${name}_Type`),
                    value: decl.initializer?.getText()!,
                    documentation: getDocumentation(this.sourceFile, decl, this.options.docs),
                }})
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

function escapeName(name: string) : [string, string] {
    if (name.startsWith("$")) return [name, name.replace("$", "dollar_")]
    if (name.startsWith("_")) return [name, name.replace("_", "bottom_")]
    return [name, name]
}

function escapeAmbientModuleContent(sourceFile: ts.SourceFile, node: ts.Node) : string {
    const { pos, end} = node
    const content = sourceFile.text.substring(pos,end)
    return content.replaceAll('"', "'")
}

function getDocumentation(sourceFile: ts.SourceFile, node: ts.Node, docsOption: string|undefined): string | undefined {
    switch (docsOption) {
        case 'all': return getComment(sourceFile, node)
        case 'opt': return dedupDocumentation(getComment(sourceFile, node))
        case 'none': case undefined:  return undefined
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
