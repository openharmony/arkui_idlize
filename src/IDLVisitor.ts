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
import { parse } from "comment-parser"
import { OptionValues } from "commander"
import * as idl from "@idlize/core/idl"
import {
    asString, capitalize, getComment, getDeclarationsByNode, getExportedDeclarationNameByDecl, identName,
    isDefined, isNodePublic, isPrivate, isProtected, isReadonly, isStatic, isAsync,
    nameEnumValues, nameOrNull, identString, getNameWithoutQualifiersLeft, stringOrNone, warn,
    snakeCaseToCamelCase, IDLKeywords, GenericVisitor,
    generateSyntheticUnionName, generateSyntheticIdlNodeName, typeOrUnion, isCommonMethodOrSubclass
} from "@idlize/core"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"
import { ReferenceResolver } from "./peer-generation/ReferenceResolver"
import { IDLVisitorConfig } from "./IDLVisitorConfig"

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

export function generateSyntheticFunctionName(parameters: idl.IDLParameter[], returnType: idl.IDLType, isAsync: boolean = false): string {
    let prefix = isAsync ? "AsyncCallback" : "Callback"
    const names = parameters.map(it => `${generateSyntheticIdlNodeName(it.type!)}`).concat(generateSyntheticIdlNodeName(returnType))
    return `${prefix}_${names.join("_").replaceAll(".", "_")}`
}

function mangleConflictingName(name: string, sourceFile: ts.SourceFile | undefined): string {
    if (IDLVisitorConfig.ConflictingDeclarationNames.includes(name) && sourceFile) {
        const fileName = path.basename(sourceFile.fileName).replaceAll(".d.ts", "").replaceAll(".", "")
        return `${name}_${fileName.replaceAll("@", "")}`
    }
    return name
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

function mergeSetGetProperties(properties: idl.IDLProperty[]): idl.IDLProperty[] {
    return properties.reduce((members, it) => {
        const maybeMemberIndex = members.findIndex(member => it.name === member.name &&
            idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Accessor) &&
            idl.hasExtAttribute(member, idl.IDLExtendedAttributes.Accessor)
        )
        if (maybeMemberIndex >= 0) {
            const member = members[maybeMemberIndex]
            members[maybeMemberIndex] = idl.createProperty(
                member.name,
                member.type,
                false,
                member.isStatic,
                member.isOptional,
                {
                    ...member,
                    extendedAttributes: member.extendedAttributes?.filter(it => it.name != idl.IDLExtendedAttributes.Accessor),
                }
            )
        } else {
            members.push(it)
        }
        return members
    }, new Array<idl.IDLProperty>)
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
        private predefinedTypeResolver?: ReferenceResolver,
    ) {
        this.defaultPackage = options.defaultIdlPackage as string ?? "arkui"
    }

    visitWholeFile(): idl.IDLEntry[] {
        ts.forEachChild(this.sourceFile, (node) => this.visit(node))
        this.addMeta()
        if (this.globalConstants.length > 0 || this.globalFunctions.length > 0) {
            this.output.push(idl.createInterface(
                `GlobalScope_${path.basename(this.sourceFile.fileName).replace(".d.ts", "").replaceAll("@", "").replaceAll(".", "_")}`,
                idl.IDLInterfaceSubkind.Interface,
                [],
                [],
                this.globalConstants,
                [],
                this.globalFunctions,
                [], [], {
                extendedAttributes: [ {name: idl.IDLExtendedAttributes.GlobalScope } ],
                fileName: this.sourceFile.fileName
            }))
        }
        return this.output
    }

    private makeContainerType(kind: idl.IDLContainerKind, type: ts.TypeReferenceNode, nameSuggestion?: NameSuggestion): idl.IDLContainerType {
        return idl.createContainerType(kind,
            type.typeArguments!.map((it, index) => this.serializeType(it, nameSuggestion?.extend(`p${index}`))))
    }

    private makeCallbackType(name: string, type: ts.TypeReferenceNode, _?: NameSuggestion): idl.IDLReferenceType {
        const funcType = this.serializeCallback(name, type, NameSuggestion.make("Callback"))
        this.addSyntheticType(funcType)
        return idl.createReferenceType(funcType.name)
    }

    private makeOptionalType(type: ts.TypeReferenceNode, nameSuggestion?: NameSuggestion): idl.IDLType {
        const types = [
            type.typeArguments![0],
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
        ].flatMap(it => ts.isUnionTypeNode(it) ? it.types : it)
        return this.serializeUnion(type.getText(), types, nameSuggestion)
    }

    private readonly TypeMapper =
        new Map<string, (type: ts.TypeReferenceNode, nameSuggestion?: NameSuggestion) => idl.IDLType>([
            ["object", () => idl.IDLObjectType],
            ["string", () => idl.IDLStringType],
            ["Boolean", () => idl.IDLBooleanType], // nasty typo in SDK
            ["ArrayBuffer", () => idl.IDLBufferType],
            ["DataView", () => idl.IDLBufferType],
            ["Int8Array", () => idl.IDLBufferType], // ["Int8Array", () => idl.createContainerType('sequence', [idl.IDLI8Type])],
            ["Uint8Array", () => idl.IDLBufferType], // ["Uint8Array", () => idl.createContainerType('sequence', [idl.IDLU8Type])],
            ["Uint8ClampedArray", () => idl.IDLBufferType], // ["Uint8ClampedArray", () => idl.createContainerType('sequence', [idl.IDLU8Type])],
            ["Int16Array", () => idl.IDLBufferType], // ["Int16Array", () => idl.createContainerType('sequence', [idl.IDLI16Type])],
            ["Uint16Array", () => idl.IDLBufferType], // ["Uint16Array", () => idl.createContainerType('sequence', [idl.IDLU16Type])],
            ["Int32Array", () => idl.IDLBufferType], // ["Int32Array", () => idl.createContainerType('sequence', [idl.IDLI32Type])],
            ["Uint32Array", () => idl.IDLBufferType], // ["Uint32Array", () => idl.createContainerType('sequence', [idl.IDLU32Type])],
            ["Float16Array", () => idl.IDLBufferType], // ["Float16Array", () => idl.createContainerType('sequence', [idl.IDLF16Type])],
            ["Float32Array", () => idl.IDLBufferType], // ["Float32Array", () => idl.createContainerType('sequence', [idl.IDLF32Type])],
            ["Float64Array", () => idl.IDLBufferType], // ["Float64Array", () => idl.createContainerType('sequence', [idl.IDLF64Type])],
            ["BigInt64Array", () => idl.IDLBufferType], // ["BigInt64Array", () => idl.createContainerType('sequence', [idl.IDLI64Type])],
            ["BigUint64Array", () => idl.IDLBufferType], // ["BigUint64Array", () => idl.createContainerType('sequence', [idl.IDLU64Type])],
            ["Array", (type, name) => this.makeContainerType("sequence", type, name)],
            ["Map", (type, name) => this.makeContainerType("record", type, name)],
            ["Promise", (type, name) => this.makeContainerType("Promise", type, name)],
            ["Record", (type, name) => this.makeContainerType("record", type, name)],
            ["Callback", (type, name) => this.makeCallbackType("Callback", type, name)],
            ["AsyncCallback", (type, name) => this.makeCallbackType("AsyncCallback", type, name)],
            ["Optional", (type, name) => this.makeOptionalType(type, name)],
            // TODO: rethink that
            ["\"2d\"", () => idl.IDLStringType],
            ["\"auto\"", () => idl.IDLStringType],
        ])

    makeEnumMember(parent: idl.IDLEnum, name: string, value: string): idl.IDLEnumMember {
        const result = idl.createEnumMember(name, parent, idl.IDLStringType, value)
        parent.elements.push(result)
        return result
    }

    addMeta(): void {
        let header = []
        const packageInfo = idl.createPackage(this.detectPackageName(this.sourceFile))
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
        if (ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isFunctionDeclaration(node)) {
            const name = identName(node.name)
            if (name && IDLVisitorConfig.DeletedDeclarations.includes(name)) {
                return
            }
            if (name && IDLVisitorConfig.StubbedDeclarations.includes(name)) {
                const decl = idl.createInterface(
                    name,
                    idl.IDLInterfaceSubkind.Interface,
                    [],
                    undefined,
                    undefined,
                    [idl.createProperty(`stub`, idl.IDLStringType)],
                    undefined,
                    undefined,
                    this.collectTypeParameters(node.typeParameters),
                    {
                        fileName: node.getSourceFile().fileName,
                        // extendedAttributes: this.computeComponentExtendedAttributes(node),
                        documentation: getDocumentation(this.sourceFile, node, this.options.docs)
                    }
                )
                this.output.push(decl)
                return
            }
            if (name && IDLVisitorConfig.ReplacedDeclarations.has(name)) {
                this.output.push({
                    fileName: node.getSourceFile().fileName,
                    ...IDLVisitorConfig.ReplacedDeclarations.get(name)!,
                })
                return
            }
        }
        if (ts.isClassDeclaration(node)) {
            const entry = this.serializeClass(node)
            if (!PeerGeneratorConfig.ignoreComponents.includes(idl.getExtAttribute(entry, idl.IDLExtendedAttributes.Component) ?? ""))
                this.output.push(entry)
        } else if (ts.isInterfaceDeclaration(node)) {
            const entry = this.serializeInterface(node)
            if (!PeerGeneratorConfig.ignoreComponents.includes(idl.getExtAttribute(entry, idl.IDLExtendedAttributes.Component) ?? ""))
                this.output.push(entry)
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

        this.output.forEach(idl.transformMethodsReturnPromise2Async)
        this.globalFunctions.forEach(idl.transformMethodsReturnPromise2Async)
    }

    serializeImport(node: ts.ImportDeclaration): idl.IDLImport {
        let name = node.moduleSpecifier.getText().replaceAll('"', '').replaceAll("'", "")
        //if (name.startsWith("./")) name = name.substring(2)
        let importClause: string[] | undefined
        if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
            importClause = node.importClause.namedBindings.elements.map(it => it.getText())
        }
        const result = idl.createImport(name, importClause)
        return result
    }

    serializeAmbientModuleDeclaration(node: ts.ModuleDeclaration): idl.IDLModule {
        const name = nameOrNull(node.name) ?? "UNDEFINED_Module"
        return idl.createModuleType(
            name,
            [{ name: idl.IDLExtendedAttributes.VerbatimDts, value: `"${escapeAmbientModuleContent(this.sourceFile, node)}"` }]
        )
    }

    serializeTypeAlias(node: ts.TypeAliasDeclaration): idl.IDLTypedef | idl.IDLCallback | idl.IDLInterface | undefined {
        // Monitor decorator differs from the rest of the decorators as it is a type not a const.
        if (ts.idText(node.name) == "MonitorDecorator") return undefined
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
            return idl.createTypedef(
                nameSuggestion.name,
                type, undefined, {
                extendedAttributes: extendedAttributes,
                fileName: node.getSourceFile().fileName
            })
        }
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
        return idl.createTypedef(
            nameSuggestion.name,
            this.serializeType(node.type, nameSuggestion),
            this.collectTypeParameters(node.typeParameters), {
            extendedAttributes: extendedAttributes,
            fileName: node.getSourceFile().fileName,
            })
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

    serializeHeritage(heritage: ts.HeritageClause): idl.IDLReferenceType[] {
        return heritage.types.map(it => {
            let name: string
            if (ts.isIdentifier(it.expression)) {
                name = ts.idText(it.expression)
            } else if (ts.isPropertyAccessExpression(it.expression)) {
                name = `${asString(it.expression.expression)}.${ts.idText(it.expression.name)}`
            } else {
                throw new Error(`Unsupported heritage: ${it.expression.getText()}: ${it.expression.kind}`)
            }
            name = mangleConflictingName(name, heritage.getSourceFile())
            return idl.createReferenceType(escapeIdl(name), this.mapTypeArgs(it.typeArguments, name))
        })
    }

    serializeInheritance(inheritance: ts.NodeArray<ts.HeritageClause> | undefined): idl.IDLReferenceType[] {
        return inheritance?.map(it => this.serializeHeritage(it)).flat() ?? []
    }

    computeNamespaceAttribute(): idl.IDLExtendedAttribute[] {
        const namespace = this.namespaces.join(',')
        return namespace ? [{ name: idl.IDLExtendedAttributes.Namespace, value: namespace }] : []
    }

    computeExtendedAttributes(
        node: ts.ClassDeclaration | ts.InterfaceDeclaration | ts.TypeLiteralNode | ts.TupleTypeNode | ts.IntersectionTypeNode
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
        this.computeExportAttribute(node, result)
        return result
    }

    computeComponentExtendedAttributes(node: ts.ClassDeclaration | ts.InterfaceDeclaration): idl.IDLExtendedAttribute[] | undefined {
        let result: idl.IDLExtendedAttribute[] = this.computeExtendedAttributes(node)
        let name = identName(node.name)
        if (name && PeerGeneratorConfig.handWritten.includes(PeerGeneratorConfig.mapComponentName(name))) {
            result.push({ name: idl.IDLExtendedAttributes.HandWrittenImplementation })
        }
        if (name && ts.isClassDeclaration(node) && isCommonMethodOrSubclass(this.typeChecker, node)) {
            result.push({ name: idl.IDLExtendedAttributes.Component, value: `"${PeerGeneratorConfig.mapComponentName(name)}"` })
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
        return idl.createInterface(
            mangleConflictingName(nameSuggestion.name, node.getSourceFile()),
            idl.IDLInterfaceSubkind.Class,
            inheritance,
            node.members.filter(ts.isConstructorDeclaration).map(it => this.serializeConstructor(it as ts.ConstructorDeclaration, childNameSuggestion)),
            [],
            this.pickProperties(node.members, childNameSuggestion).concat(this.pickAccessors(node.members, childNameSuggestion)),
            this.pickMethods(node.members, childNameSuggestion),
            [],
            this.collectTypeParameters(node.typeParameters), {
            extendedAttributes: this.computeComponentExtendedAttributes(node),
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            fileName: node.getSourceFile().fileName,
        })
    }

    pickConstructors(members: ReadonlyArray<ts.TypeElement>, nameSuggestion: NameSuggestion): idl.IDLConstructor[] {
        return members.filter(ts.isConstructSignatureDeclaration)
            .map(it => this.serializeConstructor(it as ts.ConstructSignatureDeclaration, nameSuggestion))
    }
    pickProperties(members: ReadonlyArray<ts.TypeElement | ts.ClassElement>, nameSuggestion: NameSuggestion): idl.IDLProperty[] {
        const properties = members
            .filter(it => (ts.isPropertySignature(it) || ts.isPropertyDeclaration(it) || this.isCommonMethodUsedAsProperty(it)) && !isPrivate(it.modifiers))
            .map(it => this.serializeProperty(it, nameSuggestion))
        return mergeSetGetProperties(properties)
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
        const properties = members
            .filter(it => (ts.isGetAccessorDeclaration(it) || ts.isSetAccessorDeclaration(it)))
            .map(it => this.serializeAccessor(it as ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, nameSuggestion))
        return mergeSetGetProperties(properties)
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
        return idl.createInterface(
            mangleConflictingName(nameSuggestion.name, node.getSourceFile()),
            idl.IDLInterfaceSubkind.Interface,
            inheritance,
            this.pickConstructors(node.members, childNameSuggestion),
            [],
            this.pickProperties(allMembers, childNameSuggestion),
            this.pickMethods(allMembers, childNameSuggestion),
            this.pickCallables(node.members, childNameSuggestion),
            this.collectTypeParameters(node.typeParameters), {
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeComponentExtendedAttributes(node),
            documentation: getDocumentation(this.sourceFile, node, this.options.docs)
            })
    }

    synthesizeTypeLiteralName(properties: idl.IDLProperty[]): string {
        const prefix = `Literal`
        if (properties.length === 0) {
            return `${prefix}_Empty`
        }
        const typeMap = new Map<string, string[]>()
        for (const prop of properties) {
            const type = generateSyntheticIdlNodeName(prop.type)
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
        return idl.createInterface(
            selectedName,
            idl.IDLInterfaceSubkind.AnonymousInterface,
            [],
            this.pickConstructors(node.members, nameSuggestion),
            [],
            properties,
            this.pickMethods(node.members, nameSuggestion),
            this.pickCallables(node.members, nameSuggestion),
            this.collectTypeParameters(typeParameters), {
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node),
        })
    }

    serializeTupleType(node: ts.TupleTypeNode, nameSuggestion?: NameSuggestion, typeParameters?: ts.NodeArray<ts.Node>, withOperator: boolean = false): idl.IDLInterface {
        const properties = node.elements.map((it, index) => this.serializeTupleProperty(it, index, withOperator))
        const syntheticName = `Tuple_${properties.map(it => generateSyntheticIdlNodeName(it.type)).join("_")}`
        const selectedName = selectName(nameSuggestion, syntheticName)
        return idl.createInterface(
            selectedName,
            idl.IDLInterfaceSubkind.Tuple,
            [], [], [], properties, [], [],
            this.collectTypeParameters(typeParameters), {
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node),
        })
    }

    serializeIntersectionType(node: ts.IntersectionTypeNode, nameSuggestion?: NameSuggestion): idl.IDLInterface {
        const toIDLReferenceType = (type: ts.TypeNode, index: number) => {
            const result = this.serializeType(type, nameSuggestion?.extend(`intersection${index}`))
            if (!idl.isReferenceType(result))
                throw new Error(`Can only intersect type references`)
            return result
        }
        const inheritance = node.types.map((it, index) => toIDLReferenceType(it, index))
        const syntheticName = `Intersection_${inheritance.map(it => generateSyntheticIdlNodeName(it)).join("_")}`
        const selectedName = selectName(nameSuggestion, syntheticName)
        return idl.createInterface(
            selectedName,
            idl.IDLInterfaceSubkind.AnonymousInterface,
            inheritance,
            [], [], [], [], [], [], {
            fileName: node.getSourceFile().fileName,
            extendedAttributes: this.computeExtendedAttributes(node),
        })
    }

    serializeEnum(node: ts.EnumDeclaration): idl.IDLEnum {
        let extendedAttributes = this.computeNamespaceAttribute()
        this.computeDeprecatedExtendAttributes(node, extendedAttributes)
        this.computeExportAttribute(node, extendedAttributes)
        let names = nameEnumValues(node)
        const result = idl.createEnum(
            ts.idText(node.name),
            [], {
            fileName: node.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
        })
        result.elements = node.members
            .filter(ts.isEnumMember)
            .map((it, index) => this.serializeEnumMember(node, it, result, names[index], identName(it.name)!))
        return result
    }

    private computeEnumValue(parent: ts.EnumDeclaration, node: ts.EnumMember): number {
        let index = 0
        for (let it of parent.members) {
            let value = this.typeChecker.getConstantValue(it)
            if (value != undefined && typeof value == 'number')
                index = value
            if (it == node) break
            index++
        }
        return index
    }

    serializeEnumMember(parentNode: ts.EnumDeclaration, node: ts.EnumMember, parent: idl.IDLEnum, name: string, originalName: string): idl.IDLEnumMember {
        let initializer = this.typeChecker.getConstantValue(node)
        if (initializer == undefined) {
            initializer = this.computeEnumValue(parentNode, node)
        }
        let extendedAttributes = this.computeDeprecatedExtendAttributes(node)
        if (originalName != name) {
            extendedAttributes.push({ name: idl.IDLExtendedAttributes.OriginalEnumMemberName, value: originalName })
        }
        return idl.createEnumMember(
            name,
            parent,
            typeof initializer == 'string' ? idl.IDLStringType : idl.IDLNumberType,
            initializer, {
            fileName: node.getSourceFile().fileName,
            documentation: getDocumentation(this.sourceFile, node, this.options.docs),
            extendedAttributes: extendedAttributes
        })
    }

    serializeFunctionType(signature: ts.SignatureDeclarationBase, nameSuggestion?: NameSuggestion, extendedAttributes?: idl.IDLExtendedAttribute[]): idl.IDLCallback {
        const parameters = signature.parameters.map(it => this.serializeParameter(it, nameSuggestion))
        const returnType = this.serializeType(signature.type, nameSuggestion?.extend('ret'))
        const syntheticName = generateSyntheticFunctionName(parameters, returnType)
        const selectedName = selectName(nameSuggestion, syntheticName)
        const typeParameters = signature.typeParameters ??
            (ts.isTypeAliasDeclaration(signature.parent) ? signature.parent.typeParameters : undefined)
        return idl.createCallback(
            selectedName,
            parameters,
            returnType, {
            fileName: signature.getSourceFile().fileName,
            extendedAttributes: extendedAttributes,
        }, this.collectTypeParameters(typeParameters))
    }

    serializeSyntheticFunctionType(fileName: string, parameters: ts.ParameterDeclaration[], returnType: ts.TypeNode, nameSuggestion?: NameSuggestion, extendedAttributes?: idl.IDLExtendedAttribute[]): idl.IDLCallback {
        const parametersIdl = parameters.map(it => this.serializeParameter(it, nameSuggestion))
        const returnIdlType = this.serializeType(returnType, nameSuggestion?.extend('ret'))
        const syntheticName = generateSyntheticFunctionName(parametersIdl, returnIdlType)
        const selectedName = selectName(nameSuggestion, syntheticName)
        return idl.createCallback(
            selectedName,
            parametersIdl,
            returnIdlType, {
            fileName: fileName,
            extendedAttributes: extendedAttributes,
        })
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
        let name = generateSyntheticFunctionName(parameters, returnType, isAsync)
        return idl.createCallback(name, parameters, returnType, { fileName, extendedAttributes})
    }

    serializeAccessor(accessor: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, nameSuggestion: NameSuggestion | undefined): idl.IDLProperty {
        const [accessorType, accessorAttr, readonly] = ts.isGetAccessorDeclaration(accessor)
            ? [accessor.type, idl.IDLAccessorAttribute.Getter, true]
            : [accessor.parameters[0].type, idl.IDLAccessorAttribute.Setter, false]
        const name = asString(accessor.name)
        nameSuggestion = nameSuggestion?.extend(name)
        return idl.createProperty(
            name,
            this.serializeType(accessorType, nameSuggestion),
            readonly,
            false,
            false, {
            fileName: accessor.getSourceFile().fileName,
            extendedAttributes: [{ name: idl.IDLExtendedAttributes.Accessor, value: accessorAttr }]
        })
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

    /**
     * Here we keep TS type names, but translate type arguments using `Context.typeParameterMap`
     */
    private mapTypeArgs(typeArgs: ts.NodeArray<ts.TypeNode> | undefined, typeName: string): idl.IDLType[] | undefined {
        if (TypeParameterMap.has(typeName))
            // Type parameters were erased for this type
            return undefined
        return typeArgs?.map(arg => {
            if (this.isTypeParameterReference(arg)) {
                const paramName = nameOrNull(arg.typeName)!
                const substType = this.context.typeParameterMap?.get(paramName)
                if (substType) {
                    if (!idl.isNamedNode(substType))
                        throw `Type name of node ${idl.IDLKind[substType.kind]} is unknown`
                    return substType
                }
                return idl.createTypeParameterReference(paramName)
            }
            return this.serializeType(arg, undefined, typeArgs)
        })
    }

    private makeQualifiedName(type: ts.TypeReferenceNode): idl.IDLType {
        if (ts.isQualifiedName(type.typeName)) {
            return idl.createReferenceType(`${type.typeName.left.getText()}.${type.typeName.right.getText()}`)
        } else {
            throw new Error(`Unexpected type ${type.getText()}`)
        }
    }

    serializeType(type: ts.TypeNode | undefined, nameSuggestion?: NameSuggestion, typeArgs?: ts.NodeArray<ts.TypeNode>): idl.IDLType {
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
            const declarations = getDeclarationsByNode(this.typeChecker, type.typeName)
            let sourceFile: ts.SourceFile|undefined = undefined
            if (declarations.length == 0)
                warn(`Do not know type ${type.typeName.getText()}`)
            else if (declarations.length > 1)
                // If there are multiple declaration select one from the same file, if possible.
                sourceFile = declarations.find(it => it.getSourceFile() == type.getSourceFile())?.getSourceFile() ?? declarations[0].getSourceFile()
            else
                sourceFile = declarations[0].getSourceFile()
            const typeName = mangleConflictingName(type.typeName.getText(), sourceFile)

            // Treat enum member type 'value: EnumName.MemberName`
            // as enum type 'value: EnumName`.
            if (ts.isQualifiedName(type.typeName)) {
                if (declarations && declarations.length > 0) {
                    const decl = declarations[0]
                    if (ts.isEnumMember(decl)) {
                        const enumName = identName(decl.parent.name)!
                        return idl.createReferenceType(enumName)
                    }
                }
                return this.makeQualifiedName(type)
            }
            const typeMapper = this.TypeMapper.get(typeName)
            return typeMapper
                ? typeMapper(type, nameSuggestion)
                : idl.createReferenceType(typeName, this.mapTypeArgs(type.typeArguments, typeName));
        }
        if (ts.isThisTypeNode(type)) {
            return idl.createReferenceType("this")
        }
        if (ts.isArrayTypeNode(type)) {
            return idl.createContainerType("sequence", [this.serializeType(type.elementType, nameSuggestion)])
        }
        if (ts.isTupleTypeNode(type)) {
            const tupleType = this.serializeTupleType(type, nameSuggestion, typeArgs)
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
            warn("typeof is not supported properly, return string")
            return idl.IDLStringType
        }
        if (ts.isTypeQueryNode(type)) {
            if (ts.isIdentifier(type.exprName)) {
                const name = type.exprName.escapedText.toString()
                return idl.createReferenceType(name, this.mapTypeArgs(type.typeArguments, name))
            }
            warn(`unsupported type query: ${type.getText()}`)
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
                warn(`import type: ${originalText}`)
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
        const syntheticUnionName = generateSyntheticUnionName(types)
        const selectedUnionName = selectName(nameSuggestion, syntheticUnionName)
        let aPromise = types.find(it => idl.isContainerType(it) && idl.IDLContainerUtils.isPromise(it))
        if (aPromise) {
            warn(`${sourceText} is a union of Promises. This is not supported by the IDL, use only Promise.`)
            return aPromise
        }
        if (types.find(it => it == idl.IDLAnyType)) {
            warn(`${sourceText} is union with 'any', just make it 'any'.`)
            return idl.IDLAnyType
        }

        if (types.find(it => it === idl.IDLVoidType)) {
            warn(`${sourceText} is union with 'void', which is not supported, remove 'void' variant`)
            types = types.filter(it => it !== idl.IDLVoidType)
        }
        if (types.find(it => it === idl.IDLUndefinedType)) {
            return idl.createOptionalType(
                typeOrUnion(types.filter(it => it !== idl.IDLUndefinedType))
            )
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
            let type = IDLVisitorConfig.customSerializePropertyType(property, escapedName)
            if (!isDefined(type)) {
                type = this.serializeType(property.parameters[0].type, nameSuggestion?.extend(nameOrNull(property.parameters[0].name)!))
            }

            extendedAttributes.push({ name: idl.IDLExtendedAttributes.CommonMethod })
            return idl.createProperty(
                escapedName,
                type,
                false,
                false,
                isDefined(property.parameters[0].questionToken), {
                extendedAttributes: extendedAttributes,
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
            })
        }

        if (ts.isPropertyDeclaration(property) || ts.isPropertySignature(property)) {
            let type = this.serializeType(property.type, nameSuggestion)
            if (escapedName == "params" && this.maybeClassName(property.parent) == "Resource" &&
                idl.isContainerType(type) && type.elementType[0] == idl.IDLAnyType) {
                // Ugly hack: Resource.params is any[] in the SDK, but it should be string[].
                // TODO: remove, once SDK is fixed.
                warn(`applying Resource.params workaround, type was ${generateSyntheticIdlNodeName(type)}`)
                type = idl.createContainerType('sequence', [idl.IDLStringType])
            }
            return idl.createProperty(
                escapedName,
                type,
                isReadonly(property.modifiers),
                isStatic(property.modifiers),
                !!property.questionToken, {
                extendedAttributes: extendedAttributes,
                documentation: getDocumentation(this.sourceFile, property, this.options.docs),
            })
        }
        throw new Error("Unknown")
    }

    private maybeClassName(node: ts.Node|ts.ClassLikeDeclaration): string | undefined {
        if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node))
            return identName(node.name)
        else
            return undefined
    }

    serializeTupleProperty(property: ts.NamedTupleMember | ts.TypeNode, index: number, isReadonly: boolean = false): idl.IDLProperty {
        if (ts.isNamedTupleMember(property)) {
            const name = this.propertyName(property.name)!
            return idl.createProperty(
                name,
                this.serializeType(property.type),
                isReadonly,
                false,
                !!property.questionToken, {
                extendedAttributes: !!property.questionToken ? [{ name: idl.IDLExtendedAttributes.Optional }] : undefined,
            })
        }
        const isOptional = ts.isOptionalTypeNode(property)

        return idl.createProperty(
            `value${index}`,
            this.serializeType(isOptional ? property.type : property),
            isReadonly,
            false,
            isOptional, {
            extendedAttributes: isOptional ? [{ name: idl.IDLExtendedAttributes.Optional }] : undefined,
        })
    }

    private ownerName(method: ts.MethodDeclaration | ts.MethodSignature | ts.FunctionDeclaration | ts.CallSignatureDeclaration | ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration | ts.IndexSignatureDeclaration): string | undefined {
        let parent = method.parent
        if (ts.isClassDeclaration(parent) || ts.isInterfaceDeclaration(parent))
            return identName(parent.name)

        return undefined
    }

    serializeParameter(parameter: ts.ParameterDeclaration, nameSuggestion?: NameSuggestion): idl.IDLParameter {
        if (ts.isObjectBindingPattern(parameter.name)) {
            warn(`Object hack for binding pattern: ${parameter.name.getText()}`)
            return idl.createParameter(
                'bound',
                idl.createReferenceType(identName(parameter.name.elements![0].name)!),
                !!parameter.questionToken,
                !!parameter.dotDotDotToken,
            )
        }
        if (ts.isArrayBindingPattern(parameter.name)) {
            throw new Error("Not supported array binding pattern")
        }
        const parameterName = nameOrNull(parameter.name)!
        nameSuggestion = nameSuggestion?.extend(parameterName)
        return idl.createParameter(
            escapeIdl(parameterName),
            this.serializeType(parameter.type, nameSuggestion),
            !!parameter.questionToken,
            !!parameter.dotDotDotToken,
        )
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

    /** Serialize a signature (call or construct) */
    serializeMethod(method: ts.MethodDeclaration | ts.MethodSignature | ts.IndexSignatureDeclaration | ts.FunctionDeclaration, nameSuggestion: NameSuggestion | undefined, isGlobal: boolean = false): idl.IDLMethod {
        let extendedAttributes: idl.IDLExtendedAttribute[] = isGlobal ? this.computeNamespaceAttribute() : []
        this.computeDeprecatedExtendAttributes(method, extendedAttributes)
        this.computeExportAttribute(method, extendedAttributes)
        let [methodName, escapedMethodName] = escapeName(nameOrNull(method.name) ?? "_unknown")
        let dtsNameAttributeAccounted: boolean = !!extendedAttributes.find(ea => ea.name == idl.IDLExtendedAttributes.DtsName)
        const methodParameters = method.parameters.filter((param, paramIndex) : boolean => {
            const paramName = nameOrNull(param.name)
            if (!paramName || !param.type)
                return true

            let tag: string | undefined
            let tagEnumValue: string | undefined
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
                        tagEnumValue = nameEnumValues(enumDeclaration)[idx]
                        tag = `${getNameWithoutQualifiersLeft(param.type.typeName)}.${tagEnumValue}`
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
                value: extendedAttributeValues.map(value => value.replaceAll('|', '\\x7c')).join('|')
            })

            const [methodNameNext, escapedMethodNameNext] = escapeName(methodName + tagPostfix(tag, tagEnumValue))
            methodName = methodNameNext
            escapedMethodName = escapedMethodNameNext
            return false
        })

        nameSuggestion = nameSuggestion?.extend(escapedMethodName) ?? NameSuggestion.make(escapedMethodName)
        if (ts.isIndexSignatureDeclaration(method)) {
            extendedAttributes.push({ name: idl.IDLExtendedAttributes.IndexSignature })
            return idl.createMethod(
                "indexSignature",
                methodParameters.map(it => this.serializeParameter(it)), // check nameSuggestion
                this.serializeType(method.type, nameSuggestion), {
                    isStatic: false,
                    isOptional: false,
                    isAsync: false,
                }, {
                    extendedAttributes: extendedAttributes,
                    documentation: getDocumentation(this.sourceFile, method, this.options.docs),
                })
        }
        this.computeClassMemberExtendedAttributes(method as ts.ClassElement, methodName, escapedMethodName, extendedAttributes)
        const returnType = this.serializeType(method.type, nameSuggestion?.extend('ret'))
        return idl.createMethod(
            escapedMethodName,
            methodParameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType, {
            isStatic: isStatic(method.modifiers),
            isOptional: !!method.questionToken,
            isAsync: isAsync(method.modifiers),
        }, {
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
        }, this.collectTypeParameters(method.typeParameters))
    }

    serializeCallable(method: ts.CallSignatureDeclaration, nameSuggestion: NameSuggestion): idl.IDLCallable {
        let returnType = this.serializeType(method.type, nameSuggestion?.extend('ret'))
        let extendedAttributes = this.computeDeprecatedExtendAttributes(method)
        extendedAttributes.push({ name: idl.IDLExtendedAttributes.CallSignature })
        return idl.createCallable(
            "invoke",
            method.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
            returnType, {
            isStatic: false,
            isAsync: (ts.canHaveModifiers(method) && isAsync(ts.getModifiers(method))),
        }, {
            extendedAttributes: extendedAttributes,
            documentation: getDocumentation(this.sourceFile, method, this.options.docs),
        })
    }

    serializeConstructor(constr: ts.ConstructorDeclaration | ts.ConstructSignatureDeclaration, nameSuggestion: NameSuggestion): idl.IDLConstructor {
        constr.parameters.forEach(it => {
            if (isNodePublic(it)) console.log("TODO: count public/private/protected constructor args as properties")
        })

        return idl.createConstructor(
            constr.parameters.map(it => this.serializeParameter(it, nameSuggestion)),
            this.serializeType(constr.type), {
            extendedAttributes: this.computeDeprecatedExtendAttributes(constr),
        }) // check
    }

    // TODO here we only handle initialized constants. Do we care for uninitialized const declarations?
    serializeConstants(stmt: ts.VariableStatement): idl.IDLConstant[] {
        return stmt.declarationList.declarations
            .filter(decl => decl.initializer) // todo: handle uninitialized declarations (d.ts).
            .map(decl => {
                const name = nameOrNull(decl.name)!
                let [type, value] = this.guessTypeAndValue(decl)
                return idl.createConstant(name, type, value, {
                    documentation: getDocumentation(this.sourceFile, decl, this.options.docs)
                })
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

    private collectTypeParameters(typeParameters: ts.NodeArray<ts.Node> | undefined): string[] | undefined {
        return this.context.typeParameterMap ? undefined : typeParameters?.flatMap(it => {
            if (ts.isTupleTypeNode(it)) {
                return it.elements.map(it => it.getText())
            }
            return it.getText()
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

function tagPostfix(tag: string, tagEnumValue?: string) {
    return tagEnumValue === undefined
        ? capitalize(tag.replaceAll('"', '').replaceAll("'", ''))
        : snakeCaseToCamelCase(tagEnumValue, true)
}
