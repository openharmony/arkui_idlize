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
import * as idl from "./idl"
import {
    asString, capitalize, getComment, getDeclarationsByNode, getExportedDeclarationNameByDecl, getExportedDeclarationNameByNode, identName, isDefined, isExport, isNodePublic, isPrivate, isProtected, isReadonly, isStatic, nameEnumValues, nameOrNull, identString, getNameWithoutQualifiersLeft, getNameWithoutQualifiersRight, stringOrNone,
} from "./util"
import { GenericVisitor } from "./options"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"
import { OptionValues } from "commander"
import { typeOrUnion } from "./peer-generation/idl/common"
import { IDLKeywords } from "./languageSpecificKeywords"
import { isCommonMethodOrSubclass } from "./peer-generation/inheritance"
import { ReferenceResolver } from "./peer-generation/ReferenceResolver"

const typeContainerMapper: Record<string, idl.IDLContainerKind> = {
    'Array': 'sequence',
    'Map': 'record',
    'Promise': 'Promise'
}

const typeMapper = new Map<string, string>(
    [
        ["object", "Object"],
        ["Array", "sequence"],
        ["string",idl.getIDLTypeName(idl.IDLStringType)],
        ["Map", "record"],
        ["Record", "record"],
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

export class NameSuggestion {
    protected constructor(
        readonly name: string,
        readonly forced: boolean = false,
    ) { }

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

export function selectName(nameSuggestion: NameSuggestion | undefined, syntheticName: string): string {
    if (nameSuggestion?.forced)
        return nameSuggestion.name
    if (nameSuggestion?.name && syntheticName.length >= MaxSyntheticTypeLength)
        return nameSuggestion.name
    return syntheticName
}

export function generateSyntheticFunctionName(computeTypeName: (type: idl.IDLType) => string, parameters: idl.IDLParameter[], returnType: idl.IDLType, isAsync: boolean = false): string {
    let prefix = isAsync ? "AsyncCallback" : "Callback"
    const names = parameters.map(it => `${computeTypeName(it.type!)}`).concat(computeTypeName(returnType))
    return `${prefix}_${names.join("_").replaceAll(".", "_")}`
}

const TypeParameterMap: Map<string, Map<string, idl.IDLType>> = new Map([
    ["TransitionEffect", new Map<string, idl.IDLType>([
        ["Type", idl.IDLStringType],
        ["Effect", idl.createReferenceType("TransitionEffects")]])],
    ["ProgressOptions", new Map([
        ["Type", idl.createReferenceType("ProgressType")]])],
    ["ProgressInterface", new Map([
        ["Type", idl.createReferenceType("ProgressType")]])],
    ["ProgressAttribute", new Map<string, idl.IDLType>([
        ["Type", idl.createReferenceType("ProgressType")],
        ["Style", idl.createUnionType([
            idl.createReferenceType("LinearStyleOptions"),
            idl.createReferenceType("RingStyleOptions"),
            idl.createReferenceType("CapsuleStyleOptions"),
            idl.createReferenceType("ProgressStyleOptions")],
            "Union_LinearStyleOptions_RingStyleOptions_CapsuleStyleOptions_ProgressStyleOptions")]])],
])

class Context {
    typeParameterMap: Map<string, idl.IDLType | undefined> | undefined

    enter(entityName: string) {
        this.typeParameterMap = TypeParameterMap.get(entityName)
    }
}

export class IDLVisitor implements GenericVisitor<idl.IDLEntry[]> {
    private output: idl.IDLEntry[] = []
    private seenNames = new Set<string>()
    private context = new Context()
    imports: idl.IDLImport[] = []
    exports: string[] = []
    namespaces: string[] = []
    globalConstants: idl.IDLConstant[] = []
    globalFunctions: idl.IDLMethod[] = []
    private defaultPackage: string

    constructor(
        private sourceFile: ts.SourceFile,
        private typeChecker: ts.TypeChecker,
        private options: OptionValues,
        private predefinedTypeResolver?: ReferenceResolver
    ) {
        this.defaultPackage = options.defaultIdlPackage as string ?? "arkui"
    }

    visitWholeFile(): idl.IDLEntry[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        this.addMeta()
        if (this.globalConstants.length > 0 || this.globalFunctions.length > 0) {
            this.output.push({
                kind: idl.IDLKind.Interface,
                name: `GlobalScope_${path.basename(this.sourceFile.fileName).replace(".d.ts", "").replaceAll("@", "").replaceAll(".", "_")}`,
                extendedAttributes: [ {name: idl.IDLExtendedAttributes.GlobalScope } ],
                methods: this.globalFunctions,
                constants: this.globalConstants,
                properties: [],
                constructors: [],
                callables: [],
                inheritance: []
            } as idl.IDLInterface)
        }
        return this.output
    }

    makeEnumMember(parent: idl.IDLEnum, name: string, value: string): idl.IDLEnumMember {
        const result: idl.IDLEnumMember = {
            name,
            kind: idl.IDLKind.EnumMember,
            parent,
            type: idl.IDLStringType,
            initializer: value
        }
        parent.elements.push(result)
        return result
    }

    addMeta(): void {
        let header = []
        const packageInfo: idl.IDLPackage = {
            kind: idl.IDLKind.Package,
            name: this.detectPackageName(this.sourceFile),
        }
        header.push(packageInfo)
        this.imports.forEach(it => header.push(it))
        this.output.splice(0, 0, ...header)
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
            const typedef = this.serializeTypeAlias(node)
            if (typedef)
                this.output.push(typedef)
        } else if (ts.isFunctionDeclaration(node)) {
            this.globalFunctions.push(this.serializeMethod(node, undefined, true))
        } else if (ts.isVariableStatement(node)) {
            this.globalConstants.push(...this.serializeConstants(node)) // TODO: Initializers are not allowed in ambient contexts (d.ts).
        } else if (ts.isImportDeclaration(node)) {
            this.imports.push(this.serializeImport(node))
        } else if (ts.isExportDeclaration(node)) {
            this.exports.push(node.getText())
        } else if (ts.isExportAssignment(node)) {
        } else if (ts.isImportEqualsDeclaration(node)) {
        } else if (ts.isEmptyStatement(node)) {
        } else if (node.kind == ts.SyntaxKind.EndOfFileToken) {
        } else {
            throw new Error(`Unknown node type: ${node.kind}`)
        }
    }

    serializeImport(node: ts.ImportDeclaration): idl.IDLImport {
        let name = node.moduleSpecifier.getText().replaceAll('"', '').replaceAll("'", "")
        //if (name.startsWith("./")) name = name.substring(2)
        const result: idl.IDLImport = {
            kind: idl.IDLKind.Import,
            name
        }
        return result
    }

    serializeAmbientModuleDeclaration(node: ts.ModuleDeclaration): idl.IDLModuleType {
        const name = nameOrNull(node.name) ?? "UNDEFINED_Module"
        return idl.createModuleType(
            name, 
            [{ name: idl.IDLExtendedAttributes.VerbatimDts, value: `"${escapeAmbientModuleContent(this.sourceFile, node)}"` }]
        )
    }

    serializeTypeAlias(node: ts.TypeAliasDeclaration): idl.IDLTypedef | idl.IDLFunction | idl.IDLInterface | undefined {
        const nameSuggestion = NameSuggestion.make(nameOrNull(node.name) ?? "UNDEFINED_TYPE_NAME", true)
        let extendedAttributes = this.computeDeprecatedExtendAttributes(node)
        if (ts.isImportTypeNode(node.type)) {
            const type = idl.createReferenceType(nameSuggestion.name)
            if (this.predefinedTypeResolver?.resolveTypeReference(type)) {
                // A predefined declaration exists for this type, so we need no typedef for it
                return undefined
            }
            // No predefined declaration, create an import type and a typedef
            const importAttr = { name: idl.IDLExtendedAttributes.Import, value: node.type.getText() }
            extendedAttributes.push(importAttr)
            type.extendedAttributes ??= []
            type.extendedAttributes.push(importAttr)
            return {
                kind: idl.IDLKind.Typedef,
                name: nameSuggestion.name,
                type,
                extendedAttributes,
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
        this.computeExportAttribute(node, extendedAttributes)
        return {
            kind: idl.IDLKind.Typedef,
            name: nameSuggestion.name,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
            type: this.serializeType(node.type, nameSuggestion),
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

    serializeHeritage(heritage: ts.HeritageClause): idl.IDLType[] {
        return heritage.types.map(it => {
            let name: string
            if (ts.isIdentifier(it.expression)) {
                name = ts.idText(it.expression)
            } else if (ts.isPropertyAccessExpression(it.expression)) {
                name = `${asString(it.expression.expression)}.${ts.idText(it.expression.name)}`
            } else {
                throw new Error(`Unsupported heritage: ${it.expression.getText()}: ${it.expression.kind}`)
            }
            return idl.createReferenceType(escapeIdl(name), this.mapTypeArgs(it.typeArguments, name))
        })
    }

    serializeInheritance(inheritance: ts.NodeArray<ts.HeritageClause> | undefined): idl.IDLType[] {
        return inheritance?.map(it => this.serializeHeritage(it)).flat() ?? []
    }

    computeNamespaceAttribute(): idl.IDLExtendedAttribute[] {
        const namespace = this.namespaces.join(',')
        return namespace ? [{ name: idl.IDLExtendedAttributes.Namespace, value: namespace }] : []
    }

    computeExtendedAttributes(
        node: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.TypeLiteralNode | ts.TupleTypeNode | ts.IntersectionTypeNode,
        typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>
    ): idl.IDLExtendedAttribute[] {
        const result = this.computeNamespaceAttribute()
        let entity: string = idl.IDLEntity.Interface
        if (ts.isClassDeclaration(node))
            entity = idl.IDLEntity.Class
        else if (ts.isTypeLiteralNode(node))
            entity = idl.IDLEntity.Literal
        else if (ts.isIntersectionTypeNode(node))
            entity = idl.IDLEntity.Intersection
        else if (ts.isTupleTypeNode(node)) {
            const isNamedTuple = node.elements.some(it => ts.isNamedTupleMember(it))
            entity = isNamedTuple ? idl.IDLEntity.NamedTuple : idl.IDLEntity.Tuple
        }
        result.push({ name: idl.IDLExtendedAttributes.Entity, value: entity })
        this.computeTypeParametersAttribute(typeParameters, result)
        this.computeExportAttribute(node, result)
        return result
    }

    computeComponentExtendedAttributes(node: ts.ClassDeclaration | ts.InterfaceDeclaration, inheritance: idl.IDLType[]): idl.IDLExtendedAttribute[] | undefined {
        let result: idl.IDLExtendedAttribute[] = this.computeExtendedAttributes(node, node.typeParameters)
        let name = identName(node.name)
        if (name && ts.isClassDeclaration(node) && isCommonMethodOrSubclass(this.typeChecker, node)) {
            result.push({ name: idl.IDLExtendedAttributes.Component, value: `"${PeerGeneratorConfig.mapComponentName(name)}"` })
        }
        if (inheritance) {
            let intTypeParams = inheritance.map(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.TypeArguments) ?? "").join(",")
            if (intTypeParams != "") result.push({ name: idl.IDLExtendedAttributes.ParentTypeArguments, value: intTypeParams })
        }
        this.computeExportAttribute(node, result)
        return this.computeDeprecatedExtendAttributes(node, result)
    }

    computeDeprecatedExtendAttributes(node: ts.Node, attributes: idl.IDLExtendedAttribute[] = []): idl.IDLExtendedAttribute[] {
        if (isDeprecatedNode(this.sourceFile, node)) {
            attributes.push({ name: idl.IDLExtendedAttributes.Deprecated })
        }
        return attributes
    }

    computeClassMemberExtendedAttributes(
        node: ts.TypeElement | ts.ClassElement,
        nodeName: string,
        escapedName: string,
        extendedAttributes: idl.IDLExtendedAttribute[] = []
    ): idl.IDLExtendedAttribute[] {
        if (nodeName !== escapedName && !extendedAttributes.find(ea => ea.name == idl.IDLExtendedAttributes.DtsName)) {
            extendedAttributes.push({ name: idl.IDLExtendedAttributes.DtsName, value: nodeName })
        }

        if (ts.isFunctionLike(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) { // ??
            if (!!node.questionToken) {
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.Optional })
            }
        } else {
            const isOptional = ts.isOptionalTypeNode(node)
            if (isOptional) {
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.Optional })
            }
        }

        if (ts.canHaveModifiers(node)) {
            if (isProtected(node.modifiers))
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.Protected })
        }

        return extendedAttributes
    }

    computeExportAttribute(node: ts.Node, attributes: idl.IDLExtendedAttribute[] = []): idl.IDLExtendedAttribute[] {
        if (ts.canHaveModifiers(node)) {
            if (!attributes.find(it => it.name == idl.IDLExtendedAttributes.Export)) {
                if (isExport(node.modifiers)) {
                    attributes.push({
                        name: idl.IDLExtendedAttributes.Export
                    })
                }
            }
        }
        return attributes
    }



    /** Serialize a class information */
    serializeClass(node: ts.ClassDeclaration): idl.IDLInterface {
        const inheritance = this.serializeInheritance(node.heritageClauses)
        const hasSuperClass = node.heritageClauses
            ?.filter(it => it.token === ts.SyntaxKind.ExtendsKeyword)
            .flatMap(it => it.types)
            .find(_ => true)
        if (!hasSuperClass) inheritance.unshift(idl.IDLTopType)
        const nameSuggestion = NameSuggestion.make(getExportedDeclarationNameByDecl(node) ?? "UNDEFINED")
        const childNameSuggestion = nameSuggestion.prependType()
        this.context.enter(nameSuggestion.name)
        return {
            kind: idl.IDLKind.Class,
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
        }
    }

    pickConstructors(members: ReadonlyArray<ts.TypeElement>, nameSuggestion: NameSuggestion): idl.IDLConstructor[] {
        return members.filter(ts.isConstructSignatureDeclaration)
            .map(it => this.serializeConstructor(it as ts.ConstructSignatureDeclaration, nameSuggestion))
    }
    pickProperties(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion): idl.IDLProperty[] {
        return members
            .filter(it => (ts.isPropertySignature(it) || ts.isPropertyDeclaration(it) || this.isCommonMethodUsedAsProperty(it)) && !isPrivate(it.modifiers))
            .map(it => this.serializeProperty(it, nameSuggestion))
    }
    pickMethods(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion): idl.IDLMethod[] {
        return members
            .filter(it => (ts.isMethodSignature(it) || ts.isMethodDeclaration(it) || ts.isIndexSignatureDeclaration(it)) && !this.isCommonMethodUsedAsProperty(it) && !isPrivate(it.modifiers))
            .map(it => this.serializeMethod(it as ts.MethodDeclaration | ts.MethodSignature, nameSuggestion))
    }
    pickCallables(members: ReadonlyArray<ts.TypeElement>, nameSuggestion: NameSuggestion): idl.IDLCallable[] {
        return members.filter(ts.isCallSignatureDeclaration)
            .map(it => this.serializeCallable(it, nameSuggestion))
    }
    pickAccessors(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion | undefined): idl.IDLProperty[] {
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
    serializeInterface(node: ts.InterfaceDeclaration): idl.IDLInterface {
        const allMembers = node.members.filter(it => it.name && ts.isIdentifier(it.name))
        const inheritance = this.serializeInheritance(node.heritageClauses)
        const nameSuggestion = NameSuggestion.make(getExportedDeclarationNameByDecl(node) ?? "UNDEFINED")
        const childNameSuggestion = nameSuggestion.prependType()
        this.context.enter(nameSuggestion.name)
        return {
            kind: idl.IDLKind.Interface,
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
        }
    }

    synthesizeTypeLiteralName(properties: idl.IDLProperty[]): string {
        const prefix = `Literal`
        if (properties.length === 0) {
            return `${prefix}_Empty`
        }
        const typeMap = new Map<string, string[]>()
        for (const prop of properties) {
            const type = this.computeTypeName(prop.type)
            typeMap.set(type, [...typeMap.get(type) ?? [], prop.name])
        }
        const literalName = Array.from(typeMap.entries())
            .map(([key, values]) => `${key}_${values.sort().join("_")}`)
            .join("_")
        return `${prefix}_${literalName}`
    }

    serializeObjectType(node: ts.TypeLiteralNode, nameSuggestion: NameSuggestion, typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>): idl.IDLInterface {
        const properties = this.pickProperties(node.members, nameSuggestion ?? NameSuggestion.make("UNDEFINED"))
        const syntheticName = this.synthesizeTypeLiteralName(properties)
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            properties,
            kind: idl.IDLKind.AnonymousInterface,
            fileName: node.getSourceFile().fileName,
            inheritance: [],
            constructors: this.pickConstructors(node.members, nameSuggestion),
            constants: [],
            methods: this.pickMethods(node.members, nameSuggestion),
            callables: this.pickCallables(node.members, nameSuggestion),
            extendedAttributes: this.computeExtendedAttributes(node, typeParameters),
        }
    }

    serializeTupleType(node: ts.TupleTypeNode, nameSuggestion?: NameSuggestion, typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>, withOperator: boolean = false): idl.IDLInterface {
        const properties = node.elements.map((it, index) => this.serializeTupleProperty(it, index, withOperator))
        const syntheticName = `Tuple_${properties.map(it => this.computeTypeName(it.type)).join("_")}`
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            properties,
            kind: idl.IDLKind.TupleInterface,
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
            kind: idl.IDLKind.AnonymousInterface,
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node),
            constants: [],
            constructors: [],
            properties: [],
            methods: [],
            callables: [],
        }
    }

    serializeEnum(node: ts.EnumDeclaration): idl.IDLEnum {
        let extendedAttributes = this.computeNamespaceAttribute()
        this.computeDeprecatedExtendAttributes(node, extendedAttributes)
        this.computeExportAttribute(node, extendedAttributes)
        let names = nameEnumValues(node)
        const result: idl.IDLEnum = {
            kind: idl.IDLKind.Enum,
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

    serializeEnumMember(node: ts.EnumMember, parent: idl.IDLEnum, seenMembers: Map<string, [string, boolean]>, name: string): idl.IDLEnumMember {
        let isString = false
        let initializer: string | number | undefined = undefined
        if (!node.initializer) {
            // Nothing
        } else if (ts.isStringLiteral(node.initializer)) {
            isString = true
            initializer = node.initializer.text
            seenMembers.set(nameOrNull(node.name)!, [initializer, true])
        } else if (ts.isNumericLiteral(node.initializer) ||
            (ts.isPrefixUnaryExpression(node.initializer) &&
                node.initializer.operator == ts.SyntaxKind.MinusToken &&
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
            kind: idl.IDLKind.EnumMember,
            extendedAttributes: this.computeDeprecatedExtendAttributes(node),
            name,
            parent,
            fileName: node.getSourceFile().fileName,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            type: isString ? idl.IDLStringType : idl.IDLNumberType,
            initializer: initializer
        }
    }

    serializeFunctionType(signature: ts.SignatureDeclarationBase, nameSuggestion?: NameSuggestion, extendedAttributes?: idl.IDLExtendedAttribute[]): idl.IDLCallback {
        const parameters = signature.parameters.map(it => this.serializeParameter(it, nameSuggestion))
        const returnType = this.serializeType(signature.type, nameSuggestion?.extend('ret'))
        const syntheticName = this.generateSyntheticFunctionName(parameters, returnType)
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            name: selectedName,
            parameters, returnType,
            kind: idl.IDLKind.Callback,
            fileName: signature.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
        };
    }

    serializeSyntheticFunctionType(fileName: string, parameters: ts.ParameterDeclaration[], returnType: ts.TypeNode, nameSuggestion?: NameSuggestion, extendedAttributes?: idl.IDLExtendedAttribute[]): idl.IDLCallback {
        const parametersIdl = parameters.map(it => this.serializeParameter(it, nameSuggestion))
        const returnIdlType = this.serializeType(returnType, nameSuggestion?.extend('ret'))
        const syntheticName = this.generateSyntheticFunctionName(parametersIdl, returnIdlType)
        const selectedName = selectName(nameSuggestion, syntheticName)
        return {
            kind: idl.IDLKind.Callback,
            name: selectedName,
            fileName: fileName,
            parameters: parametersIdl,
            returnType: returnIdlType,
            extendedAttributes: extendedAttributes,
        };
    }

    private generateSyntheticFunctionName(parameters: idl.IDLParameter[], returnType: idl.IDLType, isAsync: boolean = false): string {
        return generateSyntheticFunctionName(
            (type) => this.computeTypeName(type),
            parameters,
            returnType,
            isAsync,
        )
    }

    serializeCallback(rawType: string, type: ts.TypeReferenceNode, nameSuggestion: NameSuggestion | undefined): idl.IDLCallback {
        const types = type.typeArguments!.map((it, index) => this.serializeType(it, nameSuggestion?.extend(`T${index}`)))
        return this.serializeCallbackImpl(rawType, types, nameSuggestion, type.getSourceFile().fileName)
    }

    private serializeCallbackImpl(rawType: string, types: idl.IDLType[], nameSuggestion: NameSuggestion | undefined, fileName: string): idl.IDLCallback {
        let isAsync = rawType == "AsyncCallback"
        let returnType: idl.IDLType
        let parameters: idl.IDLParameter[]
        if (isAsync) {
            returnType = idl.IDLVoidType
            parameters = types[0] == idl.IDLVoidType ? [] : [{
                kind: idl.IDLKind.Parameter,
                name: `result`,
                type: types[0],
                isVariadic: false,
                isOptional: false
            } as idl.IDLParameter]
        } else {
            returnType = types.length > 1 ? types[1] : idl.IDLVoidType
            parameters = types[0] === idl.IDLVoidType ? [] : [{
                        kind: idl.IDLKind.Parameter,
                        name: `parameter`,
                        type: types[0],
                        isVariadic: false,
                        isOptional: false
                    } as idl.IDLParameter ]
        }
        let extendedAttributes = isAsync ? [{ name: idl.IDLExtendedAttributes.Async }] : []
        let name = this.generateSyntheticFunctionName(parameters, returnType, isAsync)
        return {
            name,
            parameters,
            returnType,
            kind: idl.IDLKind.Callback,
            fileName,
            extendedAttributes,
        };
    }

    serializeAccessor(accessor: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, nameSuggestion: NameSuggestion | undefined): idl.IDLProperty {
        const [accessorType, accessorAttr, readonly] = ts.isGetAccessorDeclaration(accessor)
            ? [accessor.type, idl.IDLAccessorAttribute.Getter, true]
            : [accessor.parameters[0].type, idl.IDLAccessorAttribute.Setter, false]
        const name = asString(accessor.name)
        nameSuggestion = nameSuggestion?.extend(name)
        return {
            kind: idl.IDLKind.Property,
            name: name,
            fileName: accessor.getSourceFile().fileName,
            type: this.serializeType(accessorType, nameSuggestion),
            isOptional: false,
            isStatic: false,
            isReadonly: readonly,
            extendedAttributes: [{ name: idl.IDLExtendedAttributes.Accessor, value: accessorAttr }]
        }
    }

    addSyntheticType(entry: idl.IDLEntry) {
        entry.extendedAttributes ??= []
        entry.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Synthetic })
        let name = entry.name
        if (!name || !this.seenNames.has(name)) {
            if (name) this.seenNames.add(name)
            this.output.push(entry)
        }
    }

    isTypeParameterReference(type: ts.TypeNode): type is ts.TypeReferenceNode {
        if (!ts.isTypeReferenceNode(type))
            return false
        const declaration = getDeclarationsByNode(this.typeChecker, type.typeName)[0]
        return declaration && ts.isTypeParameterDeclaration(declaration)
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
        const ambientModuleNames = this.typeChecker.getAmbientModules().map(it => it.name.replaceAll('\"', ""))
        return name != undefined && ambientModuleNames.includes(name)
    }

    warn(message: string) {
        console.log(`WARNING: ${message}`)
    }

    private computeTypeName(type: idl.IDLType): string {
        if (idl.isPrimitiveType(type)) return capitalize(idl.getIDLTypeName(type))
        if (idl.isContainerType(type)) {
            const typeArgs = type.elementType.map(it => this.computeTypeName(it)).join("_")
            switch (idl.getIDLContainerTypeKind(type)) {
                case "sequence": return "Array_" + typeArgs
                case "record": return "Map_" + typeArgs
                case "Promise": return "Promise_" + typeArgs
                default: throw new Error(`Unknown container type ${idl.DebugUtils.debugPrintType(type)}`)
            }
        }
        return idl.getIDLTypeName(type, idl.DebugUtils.easyGetName)
    }

    /**
     * Here we keep TS type names, but translate type arguments using `Context.typeParameterMap`
     */
    private mapTypeArgs(typeArgs: ts.NodeArray<ts.TypeNode> | undefined, typeName: string): string[] | undefined {
        if (TypeParameterMap.has(typeName))
            // Type parameters were erased for this type
            return undefined
        return typeArgs?.map(arg => {
            if (this.isTypeParameterReference(arg)) {
                const paramName = nameOrNull(arg.typeName)!
                const substName = this.context.typeParameterMap 
                    ? this.context.typeParameterMap.get(paramName)
                        ? idl.getIDLTypeName(this.context.typeParameterMap.get(paramName)!) 
                        : undefined
                    : undefined
                return substName ?? paramName
            }
            return arg.getText()
        })
    }

    private makeQualifiedName(type: ts.TypeReferenceNode): idl.IDLType {
        if (ts.isQualifiedName(type.typeName)) {
            return idl.createReferenceType(`${type.typeName.left.getText()}.${type.typeName.right.getText()}`)
        } else {
            throw new Error(`Unexpected type ${type.getText()}`)
        }
    }

    serializeType(type: ts.TypeNode | undefined, nameSuggestion?: NameSuggestion): idl.IDLType {
        if (type == undefined) return idl.IDLUndefinedType // TODO: can we have implicit types in d.ts?

        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return idl.IDLUndefinedType
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return idl.IDLUndefinedType
        }
        if (type.kind == ts.SyntaxKind.VoidKeyword) {
            return idl.IDLVoidType
            // return idl.IDLUndefinedType
        }
        if (type.kind == ts.SyntaxKind.UnknownKeyword) {
            return idl.IDLUnknownType
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return idl.IDLAnyType
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return idl.IDLObjectType
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return idl.IDLNumberType
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return idl.IDLBooleanType
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return idl.IDLStringType
        }
        if (type.kind == ts.SyntaxKind.BigIntKeyword) {
            return idl.IDLBigintType
        }
        if (ts.isUnionTypeNode(type)) {
            return this.serializeUnion(type.getText(), [...type.types], nameSuggestion)
        }
        if (ts.isIntersectionTypeNode(type)) {
            const intersectionType = this.serializeIntersectionType(type, nameSuggestion)
            this.addSyntheticType(intersectionType)
            return idl.createReferenceType(intersectionType.name)
        }
        if (this.isTypeParameterReference(type)) {
            const typeParamName = nameOrNull(type.typeName)
            const substType = this.context.typeParameterMap?.get(typeParamName!)
            return substType ?? idl.createTypeParameterReference(typeParamName ?? "UNEXPECTED_TYPE_PARAMETER")
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
                        return idl.createReferenceType(enumName)
                    }
                }
                return this.makeQualifiedName(type)
            }
            if (declaration.length == 0) {
                let name = type.typeName.getText(type.typeName.getSourceFile())
                this.warn(`Do not know type ${name}`)
                return idl.createReferenceType(name, this.mapTypeArgs(type.typeArguments, name))
            }
            let isEnum = ts.isEnumDeclaration(declaration[0])
            const rawType = sanitize(getExportedDeclarationNameByNode(this.typeChecker, type.typeName))!
            const transformedType = typeMapper.get(rawType) ?? rawType
            if (rawType == "Array" || rawType == "Promise" || rawType == "Map" || rawType == "Record") {
                // FIXME: bomb (as idl.IDLContainerKind)
                return idl.createContainerType(transformedType as idl.IDLContainerKind, type.typeArguments!.map((it, index) => this.serializeType(it, nameSuggestion?.extend(`p${index}`))))
            }
            if (rawType == "Callback" || rawType == "AsyncCallback") {
                const funcType = this.serializeCallback(rawType, type, NameSuggestion.make("Callback"))
                this.addSyntheticType(funcType)
                return idl.createReferenceType(funcType.name)
            }
            if (rawType == "Optional") {
                const types = [
                    type.typeArguments![0],
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
                ].flatMap(it => ts.isUnionTypeNode(it) ? it.types : it)
                return this.serializeUnion(type.getText(), types, nameSuggestion)
            }
            if (isEnum) {
                return idl.createReferenceType(transformedType)
            }
            return idl.createReferenceType(transformedType, this.mapTypeArgs(type.typeArguments, transformedType));
        }
        if (ts.isThisTypeNode(type)) {
            return idl.createReferenceType("this")
        }
        if (ts.isArrayTypeNode(type)) {
            return idl.createContainerType("sequence", [this.serializeType(type.elementType, nameSuggestion)])
        }
        if (ts.isTupleTypeNode(type)) {
            const tupleType = this.serializeTupleType(type, nameSuggestion)
            this.addSyntheticType(tupleType)
            return idl.createReferenceType(tupleType.name)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.serializeType(type.type, nameSuggestion)
        }
        if (ts.isFunctionTypeNode(type) || ts.isConstructorTypeNode(type)) {
            const funcType = this.serializeFunctionType(type, nameSuggestion)
            this.addSyntheticType(funcType)
            return idl.createReferenceType(funcType.name)
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            // TODO: plain wrong.
            return idl.IDLStringType
        }
        if (ts.isTypeLiteralNode(type)) {
            if (!nameSuggestion)
                throw new Error("Expected to have name suggestion for type literal")
            const objType = this.serializeObjectType(type, nameSuggestion)
            this.addSyntheticType(objType)
            return idl.createReferenceType(objType.name)
        }
        if (ts.isLiteralTypeNode(type)) {
            const literal = type.literal
            if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal) || ts.isRegularExpressionLiteral(literal)) {
                return idl.IDLStringType
            }
            // Unary expressions for negative values.
            if (ts.isNumericLiteral(literal) || ts.isPrefixUnaryExpression(literal)) {
                return idl.IDLNumberType
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return idl.IDLUndefinedType
            }
            if (literal.kind == ts.SyntaxKind.FalseKeyword || literal.kind == ts.SyntaxKind.TrueKeyword) {
                return idl.IDLBooleanType
            }
            throw new Error(`Non-representable type: ${asString(type)}: ${type.getText()} ${type.kind}`)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return idl.IDLStringType
        }
        if (ts.isTypeOperatorNode(type)) {
            console.log("WARNING: typeof is not supported properly, return string")
            return idl.IDLStringType
        }
        if (ts.isTypeQueryNode(type)) {
            console.log(`WARNING: unsupported type query: ${type.getText()}`)
            return idl.IDLAnyType
        }
        if (ts.isImportTypeNode(type)) {
            let where = type.argument.getText(type.getSourceFile()).split("/").map(it => it.replaceAll("'", ""))
            let what = asString(type.qualifier)
            if (what == "Callback" || what == "AsyncCallback") {
                let funcType = this.serializeCallbackImpl(
                    what, [this.serializeType(type.typeArguments![0], nameSuggestion?.extend(`Import`))],
                    NameSuggestion.make(what),
                    type.getSourceFile().fileName
                )
                this.addSyntheticType(funcType)
                return idl.createReferenceType(funcType.name)
            }
            let typeName = sanitize(what == "default" ? where[where.length - 1] : what)!
            let result = idl.createReferenceType(typeName, this.mapTypeArgs(type.typeArguments, typeName))
            if (!this.predefinedTypeResolver?.resolveTypeReference(result)) {
                // No predefined declaration for this type, so add import attributes to both declaration and type reference
                let originalText = `${type.getText(this.sourceFile)}`
                this.warn(`import type: ${originalText}`)
                result.extendedAttributes ??= []
                result.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Import, value: originalText })
            }
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

    serializeUnion(
        sourceText: string, 
        nodes: ts.TypeNode[], 
        nameSuggestion: NameSuggestion | undefined,
    ) {
        let types = nodes
            .map((it, index) => this.serializeType(it, nameSuggestion?.extend(`u${index}`)))
            .reduce<idl.IDLType[]>((uniqueTypes, it) => uniqueTypes.concat(uniqueTypes.includes(it) ? []: [it]), [])
        const syntheticUnionName = `Union_${types.map(it => this.computeTypeName(it)).join("_")}`
        const selectedUnionName = selectName(nameSuggestion, syntheticUnionName)
        let aPromise = types.find(it => idl.isContainerType(it) && idl.IDLContainerUtils.isPromise(it))
        if (aPromise) {
            console.log(`WARNING: ${sourceText} is a union of Promises. This is not supported by the IDL, use only Promise.`)
            return aPromise
        }
        if (types.find(it => idl.isIDLTypeName(it, "any"))) {
            console.log(`WARNING: ${sourceText} is union with 'any', just make it 'any'.`)
            return idl.IDLAnyType
        }

        if (types.find(it => it === idl.IDLVoidType)) {
            console.log(`WARNING: ${sourceText} is union with 'void', which is not supported, remove 'void' variant`)
            types = types.filter(it => it !== idl.IDLVoidType)
        }
        return typeOrUnion(types, selectedUnionName)
    }

    serializeProperty(property: ts.TypeElement | ts.ClassElement, nameSuggestion?: NameSuggestion): idl.IDLProperty {
        const [propName, escapedName] = escapeName(this.propertyName(property.name!)!)
        nameSuggestion = nameSuggestion?.extend(escapedName)
        let extendedAttributes: idl.IDLExtendedAttribute[] = this.computeClassMemberExtendedAttributes(property, propName, escapedName)
        this.computeDeprecatedExtendAttributes(property, extendedAttributes)
        if (ts.isMethodDeclaration(property) || ts.isMethodSignature(property)) {
            if (!this.isCommonMethodUsedAsProperty(property)) throw new Error("Wrong")
            extendedAttributes.push({ name: idl.IDLExtendedAttributes.CommonMethod })
            return {
                kind: idl.IDLKind.Property,
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
                kind: idl.IDLKind.Property,
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

    serializeTupleProperty(property: ts.NamedTupleMember | ts.TypeNode, index: number, isReadonly: boolean = false): idl.IDLProperty {
        if (ts.isNamedTupleMember(property)) {
            const name = this.propertyName(property.name)!
            return {
                kind: idl.IDLKind.Property,
                name: name,
                documentation: undefined,
                type: this.serializeType(property.type),
                isReadonly: isReadonly,
                isStatic: false,
                isOptional: !!property.questionToken,
                extendedAttributes: !!property.questionToken ? [{ name: idl.IDLExtendedAttributes.Optional }] : undefined,
            }
        }
        const isOptional = ts.isOptionalTypeNode(property)

        return {
            kind: idl.IDLKind.Property,
            name: `value${index}`,
            documentation: undefined,
            type: this.serializeType(isOptional ? property.type : property),
            isReadonly: isReadonly,
            isStatic: false,
            isOptional: isOptional,
            extendedAttributes: isOptional ? [{ name: idl.IDLExtendedAttributes.Optional }] : undefined,
        }
    }

    serializeParameter(parameter: ts.ParameterDeclaration, nameSuggestion?: NameSuggestion): idl.IDLParameter {
        if (ts.isObjectBindingPattern(parameter.name)) {
            console.log(`WARNING: Object hack for binding pattern: ${parameter.name.getText()}`)
            return {
                kind: idl.IDLKind.Parameter,
                name: 'bound',
                type: idl.createReferenceType(identName(parameter.name.elements![0].name)!),
                isVariadic: !!parameter.dotDotDotToken,
                isOptional: !!parameter.questionToken
            }
        }
        if (ts.isArrayBindingPattern(parameter.name)) {
            throw new Error("Not supported array binding pattern")
        }
        const parameterName = nameOrNull(parameter.name)!
        nameSuggestion = nameSuggestion?.extend(parameterName)
        return {
            kind: idl.IDLKind.Parameter,
            name: escapeIdl(parameterName),
            type: this.serializeType(parameter.type, nameSuggestion),
            isVariadic: !!parameter.dotDotDotToken,
            isOptional: !!parameter.questionToken
        }
    }

    isCommonAttributeMethod(method: ts.MethodDeclaration | ts.MethodSignature): boolean {
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

    computeTypeParametersAttribute(typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined, attributes: idl.IDLExtendedAttribute[] = []) {
        if (typeParameters && !this.context.typeParameterMap) {
            attributes.push({
                name: idl.IDLExtendedAttributes.TypeParameters,
                value: typeParameters.map(it => it.getText()).join(",")
            })
        }
        return attributes
    }

    /** Serialize a signature (call or construct) */
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.IndexSignatureDeclaration | ts.FunctionDeclaration, nameSuggestion: NameSuggestion | undefined, isGlobal: boolean = false): idl.IDLMethod {
        let extendedAttributes: idl.IDLExtendedAttribute[] = isGlobal ? this.computeNamespaceAttribute() : []
        this.computeTypeParametersAttribute(method.typeParameters, extendedAttributes)
        this.computeDeprecatedExtendAttributes(method, extendedAttributes)
        this.computeExportAttribute(method, extendedAttributes)
        let [methodName, escapedMethodName] = escapeName(nameOrNull(method.name) ?? "_unknown")

        let dtsNameAttributeAccounted: boolean = !!extendedAttributes.find(ea => ea.name == idl.IDLExtendedAttributes.DtsName)
        const methodParameters = method.parameters.filter((param, paramIndex) : boolean => {
            const paramName = nameOrNull(param.name)
            if (!paramName || !param.type)
                return true

            let tag: string | undefined
            const tagType = this.typeChecker.getTypeFromTypeNode(param.type)
            if ((tagType.flags & ts.TypeFlags.Literal) && !(tagType.flags & ~ts.TypeFlags.Literal))
                tag = param.type.getText()
            else if (tagType.symbol && (tagType.symbol.flags & ts.SymbolFlags.EnumMember) && ts.isTypeReferenceNode(param.type)) {
                // note, an enum with the only member is treated as that one member, see https://github.com/microsoft/TypeScript/issues/46755
                // such a one-member-enum is not acceptable for our purposes
                // to determine it, we make an alternative resolving from symbol back to entity-name and compare it with the original one
                const typeNameAlternative = this.typeChecker.symbolToEntityName(tagType.symbol, ts.SymbolFlags.EnumMember, param.type, ts.NodeBuilderFlags.IgnoreErrors)
                if (identString(param.type.typeName) !== identString(typeNameAlternative))
                    return true

                // we have a one-way enum-member-name transform for IDL (see nameEnumValues)
                // so, make the same transformation here
                if (!tagType.symbol.declarations || tagType.symbol.declarations.length != 1)
                    throw new Error('Internal error')
                if (!ts.isEnumDeclaration(tagType.symbol.declarations[0].parent))
                    throw new Error('Internal error')

                const enumDeclaration = tagType.symbol.declarations[0].parent as ts.EnumDeclaration
                const enumDeclarationMembers = enumDeclaration.members
                const tsMemberName = tagType.symbol.name
                for (let idx=0; idx<enumDeclarationMembers.length; ++idx) {
                    if (identString(enumDeclarationMembers[idx].name) === tsMemberName) {
                        const idlMemberNames = nameEnumValues(enumDeclaration)
                        tag = `${getNameWithoutQualifiersLeft(param.type.typeName)}.${idlMemberNames[idx]}`
                        break
                    }
                }

                if (!tag)
                    throw new Error('Internal error')
            }
            else
                return true

            if (!dtsNameAttributeAccounted) {
                dtsNameAttributeAccounted = true
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.DtsName, value: escapedMethodName })
            }

            const dtsTagIndexDefault = 0 // see idl.DtsTag specification
            const dtsTagNameDefault = 'type' // see idl.DtsTag specification
            let extendedAttributeValues: string[] = []
            if (paramIndex != dtsTagIndexDefault || paramName != dtsTagNameDefault) {
                extendedAttributeValues.push(paramIndex.toString())
                extendedAttributeValues.push(paramName)
            }
            extendedAttributeValues.push(tag)

            extendedAttributes.push({
                name: idl.IDLExtendedAttributes.DtsTag, 
                value: extendedAttributeValues.map(value => value.replaceAll('|', '\x7c')).join('|')
            })

            const tagId = tag.replaceAll('.', '_').replaceAll('"', '').replaceAll("'", '')
            const [methodNameNext, escapedMethodNameNext] = escapeName(methodName + capitalize(tagId))
            methodName = methodNameNext
            escapedMethodName = escapedMethodNameNext
            return false
        })

        nameSuggestion = nameSuggestion?.extend(escapedMethodName) ?? NameSuggestion.make(escapedMethodName)
        if (ts.isIndexSignatureDeclaration(method)) {
            extendedAttributes.push({ name: idl.IDLExtendedAttributes.IndexSignature })
            return {
                kind: idl.IDLKind.Method,
                name: "indexSignature",
                documentation: getDocumentation(this.sourceFile, method, this.options.docs),
                returnType: this.serializeType(method.type, nameSuggestion),
                extendedAttributes: extendedAttributes,
                isStatic: false,
                isOptional: false,
                parameters: methodParameters.map(it => this.serializeParameter(it))
            }
        }
        this.computeClassMemberExtendedAttributes(method as ts.ClassElement, methodName, escapedMethodName, extendedAttributes)
        const returnType = this.serializeType(method.type, nameSuggestion?.extend('ret'))
        return {
            kind: idl.IDLKind.Method,
            name: escapedMethodName,
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: methodParameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType: returnType,
            isStatic: isStatic(method.modifiers),
            isOptional: !!method.questionToken,
        };
    }

    serializeCallable(method: ts.CallSignatureDeclaration, nameSuggestion: NameSuggestion): idl.IDLCallable {
        const returnType = this.serializeType(method.type)
        let extendedAttributes = this.computeDeprecatedExtendAttributes(method)
        extendedAttributes.push({ name: idl.IDLExtendedAttributes.CallSignature })
        return {
            kind: idl.IDLKind.Callable,
            name: "invoke",
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
            parameters: method.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType: returnType,
            isStatic: false
        };
    }

    serializeConstructor(constr: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration, nameSuggestion: NameSuggestion): idl.IDLConstructor {
        constr.parameters.forEach(it => {
            if (isNodePublic(it)) console.log("TODO: count public/private/protected constructor args as properties")
        })

        return {
            kind: idl.IDLKind.Constructor,
            // documentation: getDocumentation(this.sourceFile, constr, this.options.docs),
            extendedAttributes: this.computeDeprecatedExtendAttributes(constr),
            parameters: constr.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType: this.serializeType(constr.type),
        };
    }

    // TODO here we only handle initialized constants. Do we care for uninitialized const declarations?
    serializeConstants(stmt: ts.VariableStatement): idl.IDLConstant[] {
        return stmt.declarationList.declarations
            .filter(decl => decl.initializer)
            .map(decl => {
                const name = nameOrNull(decl.name)!
                let [type, value] = this.guessTypeAndValue(decl)
                return {
                    kind: idl.IDLKind.Const,
                    name: name,
                    type,
                    value,
                    documentation: getDocumentation(this.sourceFile, decl, this.options.docs)
                }
            })
    }

    private guessTypeAndValue(declaration: ts.VariableDeclaration):  [idl.IDLType, string] {
        if (declaration.type) return [this.serializeType(declaration.type), declaration.initializer!.getText()]
        if (declaration.initializer) {
            let value = declaration.initializer.getText()
            if (value.startsWith('"') || value.startsWith("'")) {
                return [idl.IDLStringType, value.replaceAll("'", '"')]
            }
            if (value.startsWith("0b")) {
                return [idl.IDLNumberType, parseInt(value.substring(2), 2).toString()]
            }
            if (value.startsWith("0o")) {
                return [idl.IDLNumberType, parseInt(value.substring(2), 8).toString()]
            }
            if (value.startsWith("0x")) {
                return [idl.IDLNumberType, parseInt(value.substring(2), 16).toString()]
            }
            if (parseInt(value) != undefined) {
                return [idl.IDLNumberType, parseInt(value).toString()]
            }
            if (parseFloat(value) != undefined) {
                return [idl.IDLNumberType, parseFloat(value).toString()]
            }
            throw new Error(`Cannot infer type of ${value}`)
        }
        throw new Error(`Cannot infer type of ${declaration.getText()}`)
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

function escapeName(name: string): [string, string] {
    if (name.startsWith("$")) return [name, name.replace("$", "dollar_")]
    if (name.startsWith("_")) return [name, name.replace("_", "bottom_")]
    return [name, escapeIdl(name)]
}

function escapeAmbientModuleContent(sourceFile: ts.SourceFile, node: ts.Node): string {
    const { pos, end } = node
    const content = sourceFile.text.substring(pos, end)
    return content.replaceAll('"', "'")
}

function getDocumentation(sourceFile: ts.SourceFile, node: ts.Node, docsOption: string | undefined): string | undefined {
    switch (docsOption) {
        case 'all': return getComment(sourceFile, node)
        case 'opt': return dedupDocumentation(getComment(sourceFile, node))
        case 'none': case undefined: return undefined
        default: throw new Error(`Unknown option docs=${docsOption}`)
    }
}

function isDeprecatedNode(sourceFile: ts.SourceFile, node: ts.Node): boolean {
    const docs = getComment(sourceFile, node)
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
