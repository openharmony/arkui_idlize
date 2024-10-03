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
    createContainerType, createEnumType, createReferenceType,
    createTypeParameterReference, createUnionType, IDLCallable, IDLCallback, IDLConstant, IDLConstructor,
    IDLEntity, IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLFunction, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLTopType, IDLType, IDLTypedef,
    IDLAccessorAttribute, IDLExtendedAttributes, getExtAttribute, IDLPackage, IDLImport,
    IDLStringType, IDLNumberType, IDLUndefinedType, IDLNullType, IDLVoidType, IDLAnyType, IDLBooleanType, IDLBigintType
} from "./idl"
import {
    asString, getComment, getDeclarationsByNode, getExportedDeclarationNameByDecl, getExportedDeclarationNameByNode, identName, isCommonMethodOrSubclass, isDefined, isExport, isNodePublic, isPrivate, isProtected, isReadonly, isStatic, nameOrNull, stringOrNone
} from "./util"
import { GenericVisitor } from "./options"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"
import { OptionValues } from "commander"
import { typeOrUnion } from "./peer-generation/idl/common"

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
    exports: string[] = []
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
                name: `GlobalScope_${path.basename(this.sourceFile.fileName).replace(".d.ts", "").replaceAll("@", "").replaceAll(".", "_")}`,
                extendedAttributes: [ {name: IDLExtendedAttributes.GlobalScope } ],
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

    makeEnumMember(parent: IDLEnum, name: string, value: string): IDLEnumMember {
        const result: IDLEnumMember = {
            name,
            kind: IDLKind.EnumMember,
            parent,
            type: { name: "DOMString", kind: IDLKind.PrimitiveType },
            initializer: value
        }
        parent.elements.push(result)
        return result
    }

    addMeta(): void {
        let header = []
        const packageInfo: IDLPackage = {
            kind: IDLKind.Package,
            name: this.detectPackageName(this.sourceFile),
        }
        header.push(packageInfo)
        this.imports.forEach(it => {
            const importStatement: IDLImport = {
                kind: IDLKind.Import,
                name: it
            }
            header.push(importStatement)
        })
        this.output.splice(0, 0, ... header)
    }

    detectPackageName(sourceFile: ts.SourceFile): string {
        let ns = sourceFile.statements.find(it => ts.isModuleDeclaration(it)) as ts.ModuleDeclaration
        if (ns) {
            return `${ns.name.text}`
        }
        return "arkui"
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
            this.globalFunctions.push(this.serializeMethod(node, "", true))
        } else if (ts.isVariableStatement(node)) {
            this.globalConstants.push(...this.serializeConstants(node)) // TODO: Initializers are not allowed in ambient contexts (d.ts).
        } else if (ts.isImportDeclaration(node)) {
            this.imports.push(node.getText())
        } else if (ts.isExportDeclaration(node)) {
            this.exports.push(node.getText())
        }
    }

    serializeAmbientModuleDeclaration(node: ts.ModuleDeclaration): IDLModuleType {
        const name = nameOrNull(node.name) ?? "UNDEFINED_Module"
        return {
            kind: IDLKind.ModuleType,
            name: name,
            extendedAttributes: [ {name: IDLExtendedAttributes.VerbatimDts, value: `"${escapeAmbientModuleContent(this.sourceFile, node)}"`}]
        }
    }

    serializeTypeAlias(node: ts.TypeAliasDeclaration): IDLTypedef | IDLFunction | IDLInterface {
        const name = nameOrNull(node.name) ?? "UNDEFINED_TYPE_NAME"
        let extendedAttributes = this.computeDeprecatedExtendAttributes(node)
        if (ts.isImportTypeNode(node.type)) {
            const importAttr = { name: IDLExtendedAttributes.Import, value: node.type.getText() }
            extendedAttributes.push(importAttr)
            const type = createReferenceType(name)
            if (type.extendedAttributes) {
                type.extendedAttributes.push(importAttr)
            } else {
                type.extendedAttributes = [importAttr]
            }
            return {
                name, type, extendedAttributes,
                kind: IDLKind.Typedef,
                fileName: node.getSourceFile().fileName,
            }
        }
        this.computeTypeParametersAttribute(node.typeParameters, extendedAttributes)
        if (ts.isFunctionTypeNode(node.type)) {
            return this.serializeFunctionType(name, node.type, extendedAttributes)
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
        this.computeExportAttribute(node, extendedAttributes)
        return {
            kind: IDLKind.Typedef,
            name: name,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
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
            return createReferenceType(name, it.typeArguments)
        })
    }

    serializeInheritance(inheritance: ts.NodeArray<ts.HeritageClause> | undefined): IDLType[] {
        return inheritance?.map(it => this.serializeHeritage(it)).flat() ?? []
    }

    computeNamespaceAttribute(): IDLExtendedAttribute[] {
        const namespace = this.namespaces.join(',')
        return namespace ? [{name: IDLExtendedAttributes.Namespace, value: namespace}] : []
    }

    computeExtendedAttributes(
        node: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.TypeLiteralNode | ts.TupleTypeNode | ts.IntersectionTypeNode,
        typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>
    ): IDLExtendedAttribute[] {
        const result = this.computeNamespaceAttribute()
        let entity: string = IDLEntity.Interface
        if (ts.isClassDeclaration(node))
            entity = IDLEntity.Class
        else if (ts.isTypeLiteralNode(node))
            entity = IDLEntity.Literal
        else if (ts.isIntersectionTypeNode(node))
            entity = IDLEntity.Intersection
        else if (ts.isTupleTypeNode(node)) {
            const isNamedTuple = node.elements.some(it => ts.isNamedTupleMember(it))
            entity = isNamedTuple ? IDLEntity.NamedTuple : IDLEntity.Tuple
        }
        result.push({name: IDLExtendedAttributes.Entity, value: entity })
        this.computeTypeParametersAttribute(typeParameters, result)
        this.computeExportAttribute(node, result)
        return result
    }

    computeComponentExtendedAttributes(node: ts.ClassDeclaration | ts.InterfaceDeclaration, inheritance: IDLType[]): IDLExtendedAttribute[] | undefined {
        let result: IDLExtendedAttribute[] = this.computeExtendedAttributes(node, node.typeParameters)
        let name = identName(node.name)
        if (name && ts.isClassDeclaration(node) && isCommonMethodOrSubclass(this.typeChecker, node)) {
            result.push({name: IDLExtendedAttributes.Component, value: PeerGeneratorConfig.mapComponentName(name)})
        }
        if (inheritance.length) {
            let typeParams = getExtAttribute(inheritance[0], IDLExtendedAttributes.TypeArguments)
            if (typeParams) {
                result.push({ name: IDLExtendedAttributes.ParentTypeArguments, value: `"${typeParams}"` })
                inheritance[0].extendedAttributes = undefined
            }
        }

        if (inheritance.length > 1) {
            result.push({ name: IDLExtendedAttributes.Interfaces, value: inheritance.slice(1).map(it => it.name).join(", ") })
            let intTypeParams = inheritance.slice(1).map(it => {
                let typeParams = getExtAttribute(it, IDLExtendedAttributes.TypeArguments)
                if (typeParams) it.extendedAttributes = undefined
                return typeParams
            }).join(", ")
            if (intTypeParams.length) result.push({ name: IDLExtendedAttributes.InterfaceTypeArguments, value: `"${intTypeParams}"` })
        }
        this.computeExportAttribute(node, result)
        return this.computeDeprecatedExtendAttributes(node, result)
    }

    computeDeprecatedExtendAttributes(node: ts.Node, attributes: IDLExtendedAttribute[] = []): IDLExtendedAttribute[] {
        if (isDeprecatedNode(this.sourceFile,node)) {
            attributes.push({ name: IDLExtendedAttributes.Deprecated })
        }
        return attributes
    }

    computeClassMemberExtendedAttributes(
        node: ts.TypeElement | ts.ClassElement,
        nodeName: string,
        escapedName: string,
        extendedAttributes: IDLExtendedAttribute[] = []
    ): IDLExtendedAttribute[] {
        if (nodeName !== escapedName) {
            extendedAttributes.push({ name: IDLExtendedAttributes.DtsName, value: nodeName })
        }

        if (ts.isFunctionLike(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) { // ??
            if (!!node.questionToken) {
                extendedAttributes.push({ name: IDLExtendedAttributes.Optional })
            }
        } else {
            const isOptional = ts.isOptionalTypeNode(node)
            if (isOptional) {
                extendedAttributes.push({ name: IDLExtendedAttributes.Optional })
            }
        }

        if (ts.canHaveModifiers(node)) {
            if (isProtected(node.modifiers))
                extendedAttributes.push({ name: IDLExtendedAttributes.Protected })
        }

        return extendedAttributes
    }

    computeExportAttribute(node: ts.Node, attributes: IDLExtendedAttribute[] = []): IDLExtendedAttribute[] {
        if (ts.canHaveModifiers(node)) {
            if (!attributes.find(it => it.name == IDLExtendedAttributes.Export)) {
                if (isExport(node.modifiers)) {
                    attributes.push({
                        name: IDLExtendedAttributes.Export
                    })
                }
            }
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
            fileName: node.getSourceFile().fileName,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: inheritance,
            constructors: node.members.filter(ts.isConstructorDeclaration).map(it => this.serializeConstructor(it as ts.ConstructorDeclaration, name)),
            constants: [],
            properties: this.pickProperties(node.members, name).concat(this.pickAccessors(node.members, name)),
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
            .filter(it => (ts.isPropertySignature(it) || ts.isPropertyDeclaration(it) || this.isCommonMethodUsedAsProperty(it)) && !isPrivate(it.modifiers))
            .map(it => this.serializeProperty(it, typePrefix))
    }
    pickMethods(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, typePrefix: string): IDLMethod[] {
        return members
            .filter(it => (ts.isMethodSignature(it) || ts.isMethodDeclaration(it) || ts.isIndexSignatureDeclaration(it)) && !this.isCommonMethodUsedAsProperty(it) && !isPrivate(it.modifiers))
            .map(it => this.serializeMethod(it as ts.MethodDeclaration|ts.MethodSignature, typePrefix))
    }
    pickCallables(members: ReadonlyArray<ts.TypeElement>, typePrefix: string): IDLCallable[] {
        return members.filter(ts.isCallSignatureDeclaration)
            .map(it => this.serializeCallable(it, typePrefix))
    }
    pickAccessors(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, typePrefix: string): IDLProperty[] {
        return members
            .filter(it => (ts.isGetAccessorDeclaration(it) || ts.isSetAccessorDeclaration(it)))
            .map(it => this.serializeAccessor(it as ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, typePrefix))
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
                .map(it => nameOrNull(it.name))
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
            fileName: node.getSourceFile().fileName,
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
            fileName: node.getSourceFile().fileName,
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
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node, typeParameters),
            inheritance: [],
            constants: [],
            constructors: [],
            properties: node.elements.map((it, index) => this.serializeTupleProperty(it, index, name, withOperator)),
            methods: [],
            callables: [],
        }
    }

    serializeIntersectionType(name: string, node: ts.IntersectionTypeNode) {
        return {
            kind: IDLKind.AnonymousInterface,
            name: name,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node),
            inheritance: node.types.map((it, index) => this.serializeType(it, `${name}_${index}`)),
            constants: [],
            constructors: [],
            properties: [],
            methods: [],
            callables: [],
        }
    }

    serializeEnum(node: ts.EnumDeclaration): IDLEnum {
        let extendedAttributes = this.computeNamespaceAttribute()
        this.computeDeprecatedExtendAttributes(node, extendedAttributes)
        this.computeExportAttribute(node, extendedAttributes)
        const result: IDLEnum = {
            kind: IDLKind.Enum,
            name: ts.idText(node.name),
            fileName: node.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            elements: []
        }
        let seenMembers = new Map<string, [string, boolean]>()
        result.elements = node.members
            .filter(ts.isEnumMember)
            .map(it => this.serializeEnumMember(it, result, seenMembers))
        return result
    }

    serializeEnumMember(node: ts.EnumMember, parent: IDLEnum, seenMembers: Map<string, [string, boolean]>): IDLEnumMember {
        let isString = false
        let initializer: string|number|undefined = undefined
        if (!node.initializer) {
            // Nothing
        } else if (ts.isStringLiteral(node.initializer)) {
            isString = true
            initializer = node.initializer.text
            seenMembers.set(nameOrNull(node.name)!, [initializer, true])
        } else if (ts.isNumericLiteral(node.initializer) ||
                (ts.isPrefixUnaryExpression(node.initializer)  &&
                node.initializer.operator == ts.SyntaxKind.MinusToken  &&
                ts.isNumericLiteral(node.initializer.operand))
               ) {
            isString = false
            initializer = ts.isPrefixUnaryExpression(node.initializer) ?
                "-" + node.initializer.operand.getText() :
                node.initializer.text
            seenMembers.set(nameOrNull(node.name)!, [initializer, false])
        } else if (
            ts.isBinaryExpression(node.initializer) &&
            node.initializer.operatorToken.kind == ts.SyntaxKind.LessThanLessThanToken &&
            ts.isNumericLiteral(node.initializer.right) &&
            ts.isNumericLiteral(node.initializer.left)
        ) {
            isString = false
            initializer = (+node.initializer.left.text) << (+node.initializer.right.text)
            // console.log(`Computed ${node.initializer.getText(this.sourceFile)} to `, initializer)
        } else if (
            ts.isBinaryExpression(node.initializer) &&
            node.initializer.operatorToken.kind == ts.SyntaxKind.BarToken &&
            ts.isNumericLiteral(node.initializer.right) &&
            ts.isNumericLiteral(node.initializer.left)
        ) {
            isString = false
            initializer = (+node.initializer.left.text) | (+node.initializer.right.text)
        } else if (ts.isIdentifier(node.initializer)) {
            // For cases where one enum member refers another one by value.
            initializer = node.initializer.text
            let init = seenMembers.get(initializer)
            if (init) {
                isString = init[1]
                initializer = init[0]
            }
        } else {
            isString = false
            initializer = node.initializer.getText(this.sourceFile)
            //throw new Error(`Unrepresentable enum initializer: ${initializer} ${node.initializer.kind}`)
            console.log(`WARNING: Unrepresentable enum initializer: ${initializer} ${node.initializer.kind}`)
        }
        return {
            kind: IDLKind.EnumMember,
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            name: nameOrNull(node.name)!,
            parent,
            fileName: node.getSourceFile().fileName,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            type: isString ? IDLStringType : IDLNumberType,
            initializer: initializer
        }
    }

    serializeFunctionType(name: string, signature: ts.SignatureDeclarationBase, extendedAttributes?: IDLExtendedAttribute[]): IDLCallback {
        return {
            kind: IDLKind.Callback,
            name: name,
            fileName: signature.getSourceFile().fileName,
            parameters: signature.parameters.map(it => this.serializeParameter(it, name)),
            returnType: this.serializeType(signature.type, name),
            extendedAttributes: extendedAttributes,
        };
    }

    serializeAccessor(accessor: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, typePrefix: string): IDLProperty {
        const [accessorType, accessorAttr, readonly] = ts.isGetAccessorDeclaration(accessor)
            ? [accessor.type, IDLAccessorAttribute.Getter, true]
            : [accessor.parameters[0].type, IDLAccessorAttribute.Setter, false]
        return {
            kind: IDLKind.Property,
            name: asString(accessor.name),
            fileName: accessor.getSourceFile().fileName,
            type: this.serializeType(accessorType, typePrefix),
            isOptional: false,
            isStatic: false,
            isReadonly: readonly,
            extendedAttributes: [{name: IDLExtendedAttributes.Accessor, value: accessorAttr}]
        }
    }

    addToScope(entry: IDLEntry) {
        entry.extendedAttributes ??= []
        entry.extendedAttributes.push({ name: IDLExtendedAttributes.Synthetic })
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
        if (type == undefined) return IDLUndefinedType // TODO: can we have implicit types in d.ts?

        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return IDLUndefinedType
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return IDLNullType
        }
        if (type.kind == ts.SyntaxKind.VoidKeyword) {
            return IDLVoidType
            // return IDLUndefinedType
        }
        if (type.kind == ts.SyntaxKind.UnknownKeyword) {
            return createReferenceType("unknown")
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return IDLAnyType
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return createReferenceType("object")
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return IDLNumberType
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return IDLBooleanType
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return IDLStringType
        }
        if (type.kind == ts.SyntaxKind.BigIntKeyword) {
            return IDLBigintType
        }
        if (ts.isUnionTypeNode(type)) {
            const types = type.types
                .map((it, index) => this.serializeType(it, `${nameSuggestion}_${index}`))
                .reduce<IDLType[]>((uniqueTypes, it) => uniqueTypes.concat(uniqueTypes.includes(it) ? []: [it]), [])
            return typeOrUnion(types)
        }
        if (ts.isIntersectionTypeNode(type)) {
            const name = this.compileContext.uniqualize(`${nameSuggestion}_Intersection`)
            const intersection = this.serializeIntersectionType(name, type)
            this.addToScope(intersection)
            return createReferenceType(name)
        }
        if (this.isTypeParameterReference(type)) {
            return createTypeParameterReference(nameOrNull((type as ts.TypeReferenceNode).typeName) ?? "UNEXPECTED_TYPE_PARAMETER")
        }
        if (ts.isTypeReferenceNode(type)) {
            if (ts.isQualifiedName(type.typeName)) {
                const result = createReferenceType(type.typeName.right.getText())
                result.extendedAttributes = [{name: IDLExtendedAttributes.Qualifier, value: type.typeName.left.getText()}]
                return result
            }
            let declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
            if (declaration.length == 0) {
                let name = type.typeName.getText(type.typeName.getSourceFile())
                this.warn(`Do not know type ${name}`)
                return createReferenceType(name, type.typeArguments)
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
            return createReferenceType(transformedType, type.typeArguments);
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
            return IDLStringType
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
                return IDLStringType
            }
            // Unary expressions for negative values.
            if (ts.isNumericLiteral(literal) || ts.isPrefixUnaryExpression(literal)) {
                return IDLNumberType
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return IDLNullType
            }
            if (literal.kind == ts.SyntaxKind.FalseKeyword || literal.kind == ts.SyntaxKind.TrueKeyword) {
                return IDLBooleanType
            }
            throw new Error(`Non-representable type: ${asString(type)}: ${type.getText()} ${type.kind}`)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return IDLStringType
        }
        if (ts.isTypeOperatorNode(type)) {
            console.log("WARNING: typeof is not supported properly, return string")
            return IDLStringType
        }
        if (ts.isTypeQueryNode(type)) {
            console.log(`WARNING: unsupported type query: ${type.getText()}`)
            return IDLAnyType
        }
        if (ts.isImportTypeNode(type)) {
            let originalText = `${type.getText(this.sourceFile)}`
            this.warn(`import type: ${originalText}`)
            let where = type.argument.getText(type.getSourceFile()).split("/").map(it => it.replaceAll("'", ""))
            let what = asString(type.qualifier)
            let typeName = sanitize(what == "default" ? where[where.length - 1] : what)!
            let result = createReferenceType(typeName, type.typeArguments)
            result.extendedAttributes ??= []
            result.extendedAttributes.push({ name: IDLExtendedAttributes.Import, value: originalText})
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
        return this.deduceFromComputedProperty(name) ?? nameOrNull(name)
    }

    serializeProperty(property: ts.TypeElement | ts.ClassElement, typePrefix: string): IDLProperty {
        const [propName, escapedName] = escapeName(this.propertyName(property.name!)!)
        let extendedAttributes: IDLExtendedAttribute[] = this.computeClassMemberExtendedAttributes(property, propName, escapedName)
        this.computeDeprecatedExtendAttributes(property, extendedAttributes)
        if (ts.isMethodDeclaration(property) || ts.isMethodSignature(property)) {
            if (!this.isCommonMethodUsedAsProperty(property)) throw new Error("Wrong")
            extendedAttributes.push({ name: IDLExtendedAttributes.CommonMethod })
            return {
                kind: IDLKind.Property,
                name: escapedName,
                extendedAttributes: extendedAttributes,
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
                type: this.serializeType(property.parameters[0].type, `${typePrefix}_${escapedName}`),
                isReadonly: false,
                isStatic: false,
                isOptional: isDefined(property.parameters[0].questionToken)
            }
        }

        if (ts.isPropertyDeclaration(property) || ts.isPropertySignature(property)) {
            return {
                kind: IDLKind.Property,
                name: escapedName,
                extendedAttributes: extendedAttributes,
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
                type: this.serializeType(property.type, `${typePrefix}_${escapedName}`),
                isReadonly: isReadonly(property.modifiers),
                isStatic: isStatic(property.modifiers),
                isOptional: !!property.questionToken,
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
                extendedAttributes: !!property.questionToken ? [{name: IDLExtendedAttributes.Optional}] : undefined,
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
            extendedAttributes: isOptional ? [{name: IDLExtendedAttributes.Optional}] : undefined,
        }
    }

    serializeParameter(parameter: ts.ParameterDeclaration, namePrefix: string): IDLParameter {
        const name = nameOrNull(parameter.name)!
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

    computeTypeParametersAttribute(typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, attributes: IDLExtendedAttribute[] = []) {
        if (typeParameters) {
            attributes.push({
                name: IDLExtendedAttributes.TypeParameters,
                value: typeParameters.map(it => it.getText()).join(",")
            })
        }
        return attributes
    }

    /** Serialize a signature (call or construct) */
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.IndexSignatureDeclaration | ts.FunctionDeclaration, namePrefix: string, isGlobal: boolean = false): IDLMethod {
        if (isGlobal) this.startScope()
        let extendedAttributes: IDLExtendedAttribute[] = isGlobal ? this.computeNamespaceAttribute() : []
        this.computeTypeParametersAttribute(method.typeParameters, extendedAttributes)
        this.computeDeprecatedExtendAttributes(method, extendedAttributes)
        this.computeExportAttribute(method, extendedAttributes)

        if (ts.isIndexSignatureDeclaration(method)) {
            extendedAttributes.push({name: IDLExtendedAttributes.IndexSignature })
            return {
                kind: IDLKind.Method,
                name: "indexSignature",
                documentation: getDocumentation(this.sourceFile, method, this.options.docs),
                returnType: this.serializeType(method.type, `${namePrefix}_indexSignature_Type`),
                extendedAttributes: extendedAttributes,
                isStatic: false,
                isOptional: false,
                parameters: method.parameters.map(it => this.serializeParameter(it, `${namePrefix}_indexSignature`))
            }
        }
        const [methodName, escapedName] = escapeName(nameOrNull(method.name) ?? "_unknown")
        this.computeClassMemberExtendedAttributes(method as ts.ClassElement, methodName, escapedName, extendedAttributes)
        const returnType = this.serializeType(method.type, `${namePrefix}_${escapedName}_Type`)
        this.liftExtendedAttributes(returnType, extendedAttributes)
        return {
            kind: IDLKind.Method,
            name: escapedName,
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, `${namePrefix}_${escapedName}`)),
            returnType: returnType,
            isStatic: isStatic(method.modifiers),
            isOptional: !!method.questionToken,
            scope: isGlobal ? this.endScope() : undefined
        };
    }

    serializeCallable(method: ts.CallSignatureDeclaration, namePrefix: string): IDLCallable {
        const returnType = this.serializeType(method.type, `${namePrefix}_invoke_Type`)
        let extendedAttributes = this.computeDeprecatedExtendAttributes(method)
        this.liftExtendedAttributes(returnType, extendedAttributes)
        extendedAttributes.push({ name: IDLExtendedAttributes.CallSignature })
        return {
            kind: IDLKind.Callable,
            name: "invoke",
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, `${namePrefix}_invoke`)),
            returnType: returnType,
            isStatic: false
        };
    }

    private liftExtendedAttributes(returnType: IDLType, extendedAttributes: IDLExtendedAttribute[]): IDLExtendedAttribute[] {
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
            // documentation: getDocumentation(this.sourceFile, constr, this.options.docs),
            extendedAttributes: this.computeDeprecatedExtendAttributes(constr),
            parameters: constr.parameters.map(it => this.serializeParameter(it, `${namePrefix}_constructor`)),
            returnType: this.serializeType(constr.type, `${namePrefix}_constructor_Type`),
        };
    }

    // TODO here we only handle initialized constants. Do we care for uninitialized const declarations?
    serializeConstants(stmt: ts.VariableStatement): IDLConstant[] {
        return stmt.declarationList.declarations
            .filter(decl => decl.initializer)
            .map(decl => {
                const name = nameOrNull(decl.name)!
                return {
                    kind: IDLKind.Const,
                    name: name,
                    type: this.serializeType(decl.type, `${name}_Type`),
                    value: decl.initializer!.getText(),
                    documentation: getDocumentation(this.sourceFile, decl, this.options.docs)
                }
            })
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
