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
    createTypeParameterReference, IDLCallable, IDLCallback, IDLConstant, IDLConstructor,
    IDLEntity, IDLEntry, IDLEnum, IDLEnumMember, IDLExtendedAttribute, IDLFunction, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLTopType, IDLType, IDLTypedef,
    IDLAccessorAttribute, IDLExtendedAttributes, getExtAttribute, IDLPackage, IDLImport,
    isContainerType,
    IDLStringType,
    IDLNumberType,
    IDLUndefinedType,
    IDLVoidType,
    IDLAnyType,
    IDLBooleanType,
    IDLBigintType,
    isPrimitiveType,
} from "./idl"
import {
    asString, capitalize, getComment, getDeclarationsByNode, getExportedDeclarationNameByDecl, getExportedDeclarationNameByNode, identName, isDefined, isExport, isNodePublic, isPrivate, isProtected, isReadonly, isStatic, nameEnumValues, nameOrNull, stringOrNone
} from "./util"
import { GenericVisitor } from "./options"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"
import { OptionValues } from "commander"
import { typeOrUnion } from "./peer-generation/idl/common"
import { IDLKeywords } from "./languageSpecificKeywords"
import { isCommonMethodOrSubclass } from "./peer-generation/inheritance"

const typeMapper = new Map<string, string>(
    [
        ["object", "Object"],
        ["Array", "sequence"],
        ["string",IDLStringType.name],
        ["Map", "record"],
        // TODO: rethink that
        ["\"2d\"", "string"],
        ["\"auto\"", "string"]
    ]
)

function escapeIdl(name: string): string {
    if (IDLKeywords.has(name))
        return `${name}_`
    else
        return name
}

const MaxSyntheticTypeLength = 60

class NameSuggestion {
    protected constructor(
        readonly name: string,
        readonly forced: boolean = false,
    ) {}

    extend(postfix: string, forced: boolean = false): NameSuggestion {
        return new NameSuggestion(
            `${this.name}_${postfix}`,
            forced,
        )
    }

    prependType(): NameSuggestion {
        return new NameSuggestion(`Type_${this.name}`)
    }

    static make(name: string, forced: boolean = false): NameSuggestion {
        return new NameSuggestion(name, forced)
    }
}

function selectName(nameSuggestion: NameSuggestion | undefined, syntheticName: string): string {
    if (nameSuggestion?.forced)
        return nameSuggestion.name
    if (nameSuggestion?.name && syntheticName.length >= MaxSyntheticTypeLength)
        return nameSuggestion.name
    return syntheticName
}

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

class Scope {
    entries: IDLEntry[] = []
    add(entry: IDLEntry) {
        this.entries.push(entry)
    }
}

export class IDLVisitor implements GenericVisitor<IDLEntry[]> {
    private output: IDLEntry[] = []
    private currentScope = new Scope()
    private scopes: Scope[] = []
    private seenNames = new Set<string>()
    imports: IDLImport[] = []
    exports: string[] = []
    namespaces: string[] = []
    globalConstants: IDLConstant[] = []
    globalFunctions: IDLMethod[] = []

    startScope() {
        this.scopes.push(this.currentScope)
        this.currentScope = new Scope()
    }

    endScope(): IDLEntry[] {
        const result = this.currentScope
        this.currentScope = this.scopes.pop()!
        return result.entries
    }

    private defaultPackage: string
    private convertRecordType: boolean

    constructor(
        private sourceFile: ts.SourceFile,
        private typeChecker: ts.TypeChecker,
        private options: OptionValues) {
        this.defaultPackage = options.defaultIdlPackage as string ?? "arkui"
        this.convertRecordType = options.convertRecordType as boolean ?? false
    }

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
            type: IDLStringType,
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
        this.imports.forEach(it => header.push(it))
        this.output.splice(0, 0, ... header)
    }

    detectPackageName(sourceFile: ts.SourceFile): string {
        let ns = sourceFile.statements.find(it => ts.isModuleDeclaration(it)) as ts.ModuleDeclaration
        if (ns) {
            let name = ns.name.text
            if (name.startsWith("./")) name = name.substring(2)
            return name
        }
        let sourceFileName = path.basename(sourceFile.fileName)
        if (sourceFileName.startsWith("@ohos")) {
            let result = sourceFileName.split(".")
            return result.splice(0, result.length - 3).join(".")
        }
        if (sourceFile.fileName.indexOf("\@internal/component") != -1) return "@ohos.arkui"
        return this.defaultPackage
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
            this.globalFunctions.push(this.serializeMethod(node, undefined, true))
        } else if (ts.isVariableStatement(node)) {
            this.globalConstants.push(...this.serializeConstants(node)) // TODO: Initializers are not allowed in ambient contexts (d.ts).
        } else if (ts.isImportDeclaration(node)) {
            this.imports.push(this.serializeImport(node))
        } else if (ts.isExportDeclaration(node)) {
            this.exports.push(node.getText())
        }
    }

    serializeImport(node: ts.ImportDeclaration): IDLImport {
        let name = node.moduleSpecifier.getText().replaceAll('"', '').replaceAll("'", "")
        //if (name.startsWith("./")) name = name.substring(2)
        const result: IDLImport = {
            kind: IDLKind.Import,
            name
        }
        return result
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
        const nameSuggestion = NameSuggestion.make(nameOrNull(node.name) ?? "UNDEFINED_TYPE_NAME", true)
        let extendedAttributes = this.computeDeprecatedExtendAttributes(node)
        if (ts.isImportTypeNode(node.type)) {
            const importAttr = { name: IDLExtendedAttributes.Import, value: node.type.getText() }
            extendedAttributes.push(importAttr)
            const type = createReferenceType(nameSuggestion.name)
            if (type.extendedAttributes) {
                type.extendedAttributes.push(importAttr)
            } else {
                type.extendedAttributes = [importAttr]
            }
            return {
                name: nameSuggestion.name, type, extendedAttributes,
                kind: IDLKind.Typedef,
                fileName: node.getSourceFile().fileName,
            }
        }
        this.computeTypeParametersAttribute(node.typeParameters, extendedAttributes)
        if (ts.isFunctionTypeNode(node.type)) {
            return this.serializeFunctionType(node.type, nameSuggestion, extendedAttributes)
        }
        if (ts.isTypeLiteralNode(node.type)) {
            return this.serializeObjectType(node.type, nameSuggestion, node.typeParameters)
        }
        if (ts.isTupleTypeNode(node.type)) {
            return this.serializeTupleType(node.type, nameSuggestion, node.typeParameters)
        }
        if (ts.isTypeOperatorNode(node.type)) {
            if (ts.isTupleTypeNode(node.type.type)) {
                return this.serializeTupleType(node.type.type, nameSuggestion, node.typeParameters, true)
            }
        }
        this.startScope()
        this.computeExportAttribute(node, extendedAttributes)
        return {
            kind: IDLKind.Typedef,
            name: nameSuggestion.name,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
            type: this.serializeType(node.type, nameSuggestion),
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
            return createReferenceType(escapeIdl(name), it.typeArguments)
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
            result.push({name: IDLExtendedAttributes.Component, value: `"${PeerGeneratorConfig.mapComponentName(name)}"`})
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
        const nameSuggestion = NameSuggestion.make(getExportedDeclarationNameByDecl(node) ?? "UNDEFINED")
        const childNameSuggestion = nameSuggestion.prependType()
        return {
            kind: IDLKind.Class,
            extendedAttributes: this.computeComponentExtendedAttributes(node, inheritance),
            name: nameSuggestion.name,
            fileName: node.getSourceFile().fileName,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: inheritance,
            constructors: node.members.filter(ts.isConstructorDeclaration).map(it => this.serializeConstructor(it as ts.ConstructorDeclaration, childNameSuggestion)),
            constants: [],
            properties: this.pickProperties(node.members, childNameSuggestion).concat(this.pickAccessors(node.members, childNameSuggestion)),
            methods: this.pickMethods(node.members, childNameSuggestion),
            callables: [],
            scope: this.endScope()
        }
    }

    pickConstructors(members: ReadonlyArray<ts.TypeElement>, nameSuggestion: NameSuggestion): IDLConstructor[] {
        return members.filter(ts.isConstructSignatureDeclaration)
            .map(it => this.serializeConstructor(it as ts.ConstructSignatureDeclaration, nameSuggestion))
    }
    pickProperties(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion): IDLProperty[] {
        return members
            .filter(it => (ts.isPropertySignature(it) || ts.isPropertyDeclaration(it) || this.isCommonMethodUsedAsProperty(it)) && !isPrivate(it.modifiers))
            .map(it => this.serializeProperty(it, nameSuggestion))
    }
    pickMethods(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion): IDLMethod[] {
        return members
            .filter(it => (ts.isMethodSignature(it) || ts.isMethodDeclaration(it) || ts.isIndexSignatureDeclaration(it)) && !this.isCommonMethodUsedAsProperty(it) && !isPrivate(it.modifiers))
            .map(it => this.serializeMethod(it as ts.MethodDeclaration|ts.MethodSignature, nameSuggestion))
    }
    pickCallables(members: ReadonlyArray<ts.TypeElement>, nameSuggestion: NameSuggestion): IDLCallable[] {
        return members.filter(ts.isCallSignatureDeclaration)
            .map(it => this.serializeCallable(it, nameSuggestion))
    }
    pickAccessors(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion | undefined): IDLProperty[] {
        return members
            .filter(it => (ts.isGetAccessorDeclaration(it) || ts.isSetAccessorDeclaration(it)))
            .map(it => this.serializeAccessor(it as ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, nameSuggestion))
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
        const nameSuggestion = NameSuggestion.make(getExportedDeclarationNameByDecl(node) ?? "UNDEFINED")
        const childNameSuggestion = nameSuggestion.prependType()
        return {
            kind: IDLKind.Interface,
            name: nameSuggestion.name,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeComponentExtendedAttributes(node, inheritance),
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            inheritance: inheritance,
            constructors: this.pickConstructors(node.members, childNameSuggestion),
            constants: [],
            properties: this.pickProperties(allMembers, childNameSuggestion),
            methods: this.pickMethods(allMembers, childNameSuggestion),
            callables: this.pickCallables(node.members, childNameSuggestion),
            scope: this.endScope()
        }
    }

    serializeObjectType(node: ts.TypeLiteralNode, nameSuggestion: NameSuggestion, typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>): IDLInterface {
        const properties = this.pickProperties(node.members, nameSuggestion ?? NameSuggestion.make("UNDEFINED"))
        const typeMap = new Map<string, string[]>()
        for (const prop of properties) {
            const type = this.computeTypeName(prop.type)
            const values = typeMap.has(type) ? typeMap.get(type)! : []
            values.push(prop.name)
            typeMap.set(type, values)
        }
        const syntheticName = `Literal_${Array.from(typeMap.keys()).map(key => `${key}_${typeMap.get(key)!.join('_')}`).join('_')}`
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            properties,
            kind: IDLKind.AnonymousInterface,
            fileName: node.getSourceFile().fileName,
            inheritance: [],
            constructors: this.pickConstructors(node.members, nameSuggestion),
            constants: [],
            methods: this.pickMethods(node.members, nameSuggestion),
            callables: this.pickCallables(node.members, nameSuggestion),
            extendedAttributes: this.computeExtendedAttributes(node, typeParameters),
        }
    }

    serializeTupleType(node: ts.TupleTypeNode, nameSuggestion?: NameSuggestion, typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>, withOperator: boolean = false): IDLInterface {
        const properties = node.elements.map((it, index) => this.serializeTupleProperty(it, index, withOperator))
        const syntheticName = `Tuple_${properties.map(it => this.computeTypeName(it.type)).join("_")}`
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            properties,
            kind: IDLKind.TupleInterface,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node, typeParameters),
            inheritance: [],
            constants: [],
            constructors: [],
            methods: [],
            callables: [],
        }
    }

    serializeIntersectionType(node: ts.IntersectionTypeNode, nameSuggestion?: NameSuggestion) {
        const inheritance = node.types.map((it, index) => this.serializeType(it, nameSuggestion?.extend(`intersection${index}`)))
        const syntheticName = `Intersection_${inheritance.map(it => this.computeTypeName(it)).join("_")}`
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            inheritance,
            kind: IDLKind.AnonymousInterface,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node),
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
        let names = nameEnumValues(node)
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
            .map((it, index) => this.serializeEnumMember(it, result, seenMembers, names[index]))
        return result
    }

    serializeEnumMember(node: ts.EnumMember, parent: IDLEnum, seenMembers: Map<string, [string, boolean]>, name: string): IDLEnumMember {
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
            //throw new Error(`Unpresentable enum initializer: ${initializer} ${node.initializer.kind}`)
            console.log(`WARNING: Unpresentable enum initializer: ${initializer} ${node.initializer.kind}`)
        }
        return {
            kind: IDLKind.EnumMember,
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            name,
            parent,
            fileName: node.getSourceFile().fileName,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            type: isString ? IDLStringType : IDLNumberType,
            initializer: initializer
        }
    }

    serializeFunctionType(signature: ts.SignatureDeclarationBase, nameSuggestion?: NameSuggestion, extendedAttributes?: IDLExtendedAttribute[]): IDLCallback {
        const parameters = signature.parameters.map(it => this.serializeParameter(it, nameSuggestion))
        const returnType = this.serializeType(signature.type, nameSuggestion?.extend('ret'))
        const syntheticName = this.generateSyntheticFunctionName(parameters, returnType)
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            parameters, returnType,
            kind: IDLKind.Callback,
            fileName: signature.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
        };
    }

    serializeSyntheticFunctionType(fileName: string, parameters: ts.ParameterDeclaration[], returnType: ts.TypeNode, nameSuggestion?: NameSuggestion, extendedAttributes?: IDLExtendedAttribute[]): IDLCallback {
        const parametersIdl = parameters.map(it => this.serializeParameter(it, nameSuggestion))
        const returnIdlType = this.serializeType(returnType, nameSuggestion?.extend('ret'))
        const syntheticName = this.generateSyntheticFunctionName(parametersIdl, returnIdlType)
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            kind: IDLKind.Callback,
            name: selectedName,
            fileName: fileName,
            parameters: parametersIdl,
            returnType: returnIdlType,
            extendedAttributes: extendedAttributes,
        };
    }

    private generateSyntheticFunctionName(parameters: IDLParameter[], returnType: IDLType, isAsync: boolean = false): string {
        let prefix = isAsync ? "AsyncCallback" : "Callback"
        const names = parameters.map(it => `${this.computeTypeName(it.type!)}`).concat(this.computeTypeName(returnType))
        return `${prefix}_${names.join("_")}`
    }

    serializeCallback(rawType: string, type: ts.TypeReferenceNode, nameSuggestion: NameSuggestion | undefined): IDLCallback {
        const types = type.typeArguments!.map((it, index) => this.serializeType(it, nameSuggestion?.extend(`T${index}`)))
        const returnType = types[types.length - 1]
        const parameters = types.splice(0, types.length - 1).map((it, index) => {
            let param = {
                kind: IDLKind.Parameter,
                name: `parameter_${index}`,
                type: it,
                isVariadic: false,
                isOptional: false
                } as IDLParameter
            return param
        })
        let isAsync = rawType == "AsyncCallback"
        let extendedAttributes = isAsync ? [{name: IDLExtendedAttributes.Async}] : []
        let name = this.generateSyntheticFunctionName(parameters, returnType, isAsync)
        return {
            name,
            parameters,
            returnType,
            kind: IDLKind.Callback,
            fileName: type.getSourceFile().fileName,
            extendedAttributes,
        };
    }

    serializeAccessor(accessor: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, nameSuggestion: NameSuggestion | undefined): IDLProperty {
        const [accessorType, accessorAttr, readonly] = ts.isGetAccessorDeclaration(accessor)
            ? [accessor.type, IDLAccessorAttribute.Getter, true]
            : [accessor.parameters[0].type, IDLAccessorAttribute.Setter, false]
        const name = asString(accessor.name)
        nameSuggestion = nameSuggestion?.extend(name)
        return {
            kind: IDLKind.Property,
            name: name,
            fileName: accessor.getSourceFile().fileName,
            type: this.serializeType(accessorType, nameSuggestion),
            isOptional: false,
            isStatic: false,
            isReadonly: readonly,
            extendedAttributes: [{name: IDLExtendedAttributes.Accessor, value: accessorAttr}]
        }
    }

    addToScope(entry: IDLEntry) {
        entry.extendedAttributes ??= []
        entry.extendedAttributes.push({ name: IDLExtendedAttributes.Synthetic })
        let name = entry.name
        if (!name || !this.seenNames.has(name)) {
            if (name) this.seenNames.add(name)
            this.currentScope.add(entry)
        }
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

    private computeTypeName(type: IDLType): string {
        if (isPrimitiveType(type)) return capitalize(type.name)
        if (isContainerType(type)) {
            const typeArgs = type.elementType.map(it => this.computeTypeName(it)).join("_")
            switch (type.name) {
                case "sequence": return "Array_" + typeArgs
                case "record": return "Map_" + typeArgs
                case "Promise": return "Promise_" + typeArgs
                default: throw new Error(`Unknown container type ${type.name}`)
            }
        }
        return type.name
    }

    serializeType(type: ts.TypeNode | undefined, nameSuggestion?: NameSuggestion): IDLType {
        if (type == undefined) return IDLUndefinedType // TODO: can we have implicit types in d.ts?

        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return IDLUndefinedType
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return IDLUndefinedType
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
            let types = type.types
                .map((it, index) => this.serializeType(it, nameSuggestion?.extend(`u${index}`)))
                .reduce<IDLType[]>((uniqueTypes, it) => uniqueTypes.concat(uniqueTypes.includes(it) ? []: [it]), [])

            const syntheticUnionName = `Union_${types.map(it => this.computeTypeName(it)).join("_")}`
            const selectedUnionName = selectName(nameSuggestion, syntheticUnionName)
            let aPromise = types.find(it => isContainerType(it) && it.name == "Promise")
            if (aPromise) {
                console.log(`WARNING: ${type.getText()} is a union of Promises. This is not supported by the IDL, use only Promise.`)
                return aPromise
            }
            if (types.find(it => it.name == "any")) {
                console.log(`WARNING: ${type.getText()} is union with 'any', just make it 'any'.`)
                return IDLAnyType
            }

            if (types.find(it => it == IDLVoidType)) {
                console.log(`WARNING: ${type.getText()} is union with 'void', which is not supported, remove 'void' variant`)
                // TODO: remove void from union when original SDK is removed from compilation.
                // types = types.filter(it => it != IDLVoidType)
            }
            return typeOrUnion(types, selectedUnionName)
        }
        if (ts.isIntersectionTypeNode(type)) {
            const intersectionType = this.serializeIntersectionType(type, nameSuggestion)
            this.addToScope(intersectionType)
            return createReferenceType(intersectionType.name)
        }
        if (this.isTypeParameterReference(type)) {
            return createTypeParameterReference(nameOrNull((type as ts.TypeReferenceNode).typeName) ?? "UNEXPECTED_TYPE_PARAMETER")
        }
        if (ts.isTypeReferenceNode(type)) {
            let declaration = getDeclarationsByNode(this.typeChecker, type.typeName)
            // Treat enum member type 'value: EnumName.MemberName`
            // as enum type 'value: EnumName`.
            if (ts.isQualifiedName(type.typeName)) {
                if (declaration && declaration.length > 0) {
                    const decl = declaration[0]
                    if (ts.isEnumMember(decl)) {
                        const enumName = identName(decl.parent.name)!
                        return createEnumType(enumName)
                    }
                }
            }
            if (ts.isQualifiedName(type.typeName)) {
                const result = createReferenceType(type.typeName.right.getText())
                result.extendedAttributes = [{name: IDLExtendedAttributes.Qualifier, value: type.typeName.left.getText()}]
                return result
            }
            if (declaration.length == 0) {
                let name = type.typeName.getText(type.typeName.getSourceFile())
                this.warn(`Do not know type ${name}`)
                return createReferenceType(name, type.typeArguments)
            }
            let isEnum = ts.isEnumDeclaration(declaration[0])
            const rawType = sanitize(getExportedDeclarationNameByNode(this.typeChecker, type.typeName))!
            const transformedType = typeMapper.get(rawType) ?? rawType
            // TODO: support Record here as well.
            if (rawType == "Array" || rawType == "Promise" || rawType == "Map" || (this.convertRecordType && rawType == "Record")) {
                return createContainerType(transformedType, type.typeArguments!.map((it, index) => this.serializeType(it, nameSuggestion?.extend(`p${index}`))))
            }
            if (rawType == "Callback" || rawType == "AsyncCallback") {
                const funcType = this.serializeCallback(rawType, type, NameSuggestion.make("Callback"))
                this.addToScope(funcType)
                return createReferenceType(funcType.name)
            }
            if (isEnum) {
                return createEnumType(transformedType)
            }
            if (rawType == "Callback") {
                const typeArgumentsLength = type.typeArguments?.length ?? 0
                const callback = this.serializeSyntheticFunctionType(
                    type.getSourceFile().fileName,
                    typeArgumentsLength > 0 && type.typeArguments![0].kind != ts.SyntaxKind.VoidKeyword
                        ? [ts.factory.createParameterDeclaration(undefined, undefined, 'value', undefined, type.typeArguments![0])]
                        : [],
                    typeArgumentsLength > 1 ? type.typeArguments![1] : ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
                    nameSuggestion,
                )
                this.addToScope(callback)
                return createReferenceType(callback.name)
            }
            return createReferenceType(transformedType, type.typeArguments);
        }
        if (ts.isThisTypeNode(type)) {
            return createReferenceType("this")
        }
        if (ts.isArrayTypeNode(type)) {
            return createContainerType("sequence", [this.serializeType(type.elementType, nameSuggestion)])
        }
        if (ts.isTupleTypeNode(type)) {
            const tupleType = this.serializeTupleType(type, nameSuggestion)
            this.addToScope(tupleType)
            return createReferenceType(tupleType.name)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.serializeType(type.type, nameSuggestion)
        }
        if (ts.isFunctionTypeNode(type) || ts.isConstructorTypeNode(type)) {
            const funcType = this.serializeFunctionType(type, nameSuggestion)
            this.addToScope(funcType)
            return createReferenceType(funcType.name)
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            // TODO: plain wrong.
            return IDLStringType
        }
        if (ts.isTypeLiteralNode(type)) {
            if (!nameSuggestion)
                throw new Error("Expected to have name suggestion for type literal")
            const objType = this.serializeObjectType(type, nameSuggestion)
            this.addToScope(objType)
            return createReferenceType(objType.name)
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
                return IDLUndefinedType
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
            return this.serializeType(type.type)
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

    serializeProperty(property: ts.TypeElement | ts.ClassElement, nameSuggestion?: NameSuggestion): IDLProperty {
        const [propName, escapedName] = escapeName(this.propertyName(property.name!)!)
        nameSuggestion = nameSuggestion?.extend(escapedName)
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
                type: this.serializeType(property.parameters[0].type, nameSuggestion?.extend(nameOrNull(property.parameters[0].name)!)),
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
                type: this.serializeType(property.type, nameSuggestion),
                isReadonly: isReadonly(property.modifiers),
                isStatic: isStatic(property.modifiers),
                isOptional: !!property.questionToken,
            }
        }
        throw new Error("Unknown")
    }

    serializeTupleProperty(property: ts.NamedTupleMember | ts.TypeNode, index: number, isReadonly: boolean = false): IDLProperty {
        if (ts.isNamedTupleMember(property)) {
            const name = this.propertyName(property.name)!
            return {
                kind: IDLKind.Property,
                name: name,
                documentation: undefined,
                type: this.serializeType(property.type),
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
            type: this.serializeType(isOptional ? property.type : property),
            isReadonly: isReadonly,
            isStatic: false,
            isOptional: isOptional,
            extendedAttributes: isOptional ? [{name: IDLExtendedAttributes.Optional}] : undefined,
        }
    }

    serializeParameter(parameter: ts.ParameterDeclaration, nameSuggestion?: NameSuggestion): IDLParameter {
        const parameterName = nameOrNull(parameter.name)!
        nameSuggestion = nameSuggestion?.extend(parameterName)
        return {
            kind: IDLKind.Parameter,
            name: escapeIdl(parameterName),
            type: this.serializeType(parameter.type, nameSuggestion),
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
        let className = (ts.isClassDeclaration(member.parent)) ? identName(member.parent.name) : undefined
        let returnType = (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) ? identName(member.type) : undefined
        return (this.options.commonToAttributes ?? true) &&
            (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) &&
            this.isCommonAttributeMethod(member) &&
            member.parameters.length == 1 && (returnType == "T" || returnType == className)
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
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.IndexSignatureDeclaration | ts.FunctionDeclaration, nameSuggestion: NameSuggestion | undefined, isGlobal: boolean = false): IDLMethod {
        if (isGlobal) this.startScope()
        let extendedAttributes: IDLExtendedAttribute[] = isGlobal ? this.computeNamespaceAttribute() : []
        this.computeTypeParametersAttribute(method.typeParameters, extendedAttributes)
        this.computeDeprecatedExtendAttributes(method, extendedAttributes)
        this.computeExportAttribute(method, extendedAttributes)
        const [methodName, escapedName] = escapeName(nameOrNull(method.name) ?? "_unknown")
        nameSuggestion = nameSuggestion?.extend(escapedName) ?? NameSuggestion.make(escapedName)
        if (ts.isIndexSignatureDeclaration(method)) {
            extendedAttributes.push({name: IDLExtendedAttributes.IndexSignature })
            return {
                kind: IDLKind.Method,
                name: "indexSignature",
                documentation: getDocumentation(this.sourceFile, method, this.options.docs),
                returnType: this.serializeType(method.type, nameSuggestion),
                extendedAttributes: extendedAttributes,
                isStatic: false,
                isOptional: false,
                parameters: method.parameters.map(it => this.serializeParameter(it))
            }
        }
        this.computeClassMemberExtendedAttributes(method as ts.ClassElement, methodName, escapedName, extendedAttributes)
        const returnType = this.serializeType(method.type, nameSuggestion.extend('ret'))
        this.liftExtendedAttributes(returnType, extendedAttributes)
        return {
            kind: IDLKind.Method,
            name: escapedName,
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType: returnType,
            isStatic: isStatic(method.modifiers),
            isOptional: !!method.questionToken,
            scope: isGlobal ? this.endScope() : undefined
        };
    }

    serializeCallable(method: ts.CallSignatureDeclaration, nameSuggestion: NameSuggestion): IDLCallable {
        const returnType = this.serializeType(method.type)
        let extendedAttributes = this.computeDeprecatedExtendAttributes(method)
        this.liftExtendedAttributes(returnType, extendedAttributes)
        extendedAttributes.push({ name: IDLExtendedAttributes.CallSignature })
        return {
            kind: IDLKind.Callable,
            name: "invoke",
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
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

    serializeConstructor(constr: ts.ConstructorDeclaration|ts.ConstructSignatureDeclaration, nameSuggestion: NameSuggestion): IDLConstructor {
        constr.parameters.forEach(it => {
            if (isNodePublic(it)) console.log("TODO: count public/private/protected constructor args as properties")
        })

        return {
            kind: IDLKind.Constructor,
            // documentation: getDocumentation(this.sourceFile, constr, this.options.docs),
            extendedAttributes: this.computeDeprecatedExtendAttributes(constr),
            parameters: constr.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType: this.serializeType(constr.type),
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
                    type: this.serializeType(decl.type),
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
    return [name, escapeIdl(name)]
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
