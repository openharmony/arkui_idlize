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
import { Language, asString, getDeclarationsByNode, getLineNumberString, getNameWithoutQualifiersRight, heritageDeclarations,
     identName, isStatic, throwException, typeEntityName, identNameWithNamespace } from "../util"
import { IndentedPrinter } from "../IndentedPrinter"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import {
    AggregateConvertor, ArgConvertor, ArrayConvertor, BooleanConvertor, CustomTypeConvertor,
    EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, LengthConvertor, MapConvertor, MaterializedClassConvertor,
    NumberConvertor, OptionConvertor, PredefinedConvertor, StringConvertor, ToStringConvertor, TupleConvertor, TypeAliasConvertor,
    UndefinedConvertor, UnionConvertor
} from "./Convertors"
import { DependencySorter } from "./DependencySorter"
import { isMaterialized } from "./Materialized"
import {DeclareStatement, LanguageWriter, Method, NamedMethodSignature, Type } from "./LanguageWriters"

export class PrimitiveType {
    constructor(private name: string, public isPointer = false) { }
    getText(table?: DeclarationTable): string { return this.name }
    static String = new PrimitiveType("Ark_String", true)
    static Number = new PrimitiveType("Ark_Number", true)
    static Int32 = new PrimitiveType("Ark_Int32")
    static Tag = new PrimitiveType("Ark_Tag")
    static Boolean = new PrimitiveType("Ark_Boolean")
    static Function = new PrimitiveType("Ark_Function", true)
    static Materialized = new PrimitiveType("Ark_Materialized", true)
    static Undefined = new PrimitiveType("Ark_Undefined")
    static NativePointer = new PrimitiveType("Ark_NativePointer")
    static Length = new PrimitiveType("Ark_Length", true)
    static Resource = new PrimitiveType("Ark_Resource", true)
    static CustomObject = new PrimitiveType("Ark_CustomObject", true)
    private static pointersMap = new Map<DeclarationTarget, PointerType>()
    static pointerTo(target: DeclarationTarget) {
        if (PrimitiveType.pointersMap.has(target)) return PrimitiveType.pointersMap.get(target)!
        let result = new PointerType(target)
        PrimitiveType.pointersMap.set(target, result)
        return result
    }
    static UndefinedTag = "ARK_TAG_UNDEFINED"
    static UndefinedRuntime = "ARK_RUNTIME_UNDEFINED"
    static OptionalPrefix = "Opt_"
}

class PointerType extends PrimitiveType {
    constructor(public pointed: DeclarationTarget) {
        super("", true)
    }
    getText(table: DeclarationTable): string {
        return `${table.computeTargetName(this.pointed, false)}*`
    }
}

export type DeclarationTarget =
    ts.ClassDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration
    | ts.UnionTypeNode | ts.TypeLiteralNode | ts.ImportTypeNode | ts.FunctionTypeNode | ts.TupleTypeNode
    | ts.TemplateLiteralTypeNode | ts.TypeReferenceNode
    | ts.ArrayTypeNode | ts.ParenthesizedTypeNode | ts.OptionalTypeNode | ts.LiteralTypeNode
    | PrimitiveType

export class FieldRecord {
    constructor(public declaration: DeclarationTarget, public type: ts.TypeNode | undefined, public name: string, public optional: boolean = false) { }
}

export interface StructVisitor {
    visitUnionField(field: FieldRecord, selectorValue: number): void
    // visitOptionalField(field?: FieldRecord): void;
    visitInseparable(): void
}

class StructDescriptor {
    supers: DeclarationTarget[] = []
    deps = new Set<DeclarationTarget>()
    isPacked: boolean = false
    isArray: boolean = false
    private fields: FieldRecord[] = []
    private seenFields = new Set<string>()
    addField(field: FieldRecord) {
        if (!this.seenFields.has(field.name)) {
            this.seenFields.add(field.name)
            // TODO: kind of wrong
            if (field.name == `template`) field.name = `template_`
            this.fields.push(field)
        }
    }
    getFields(): readonly FieldRecord[] {
        return this.fields
    }
    isEmpty(): boolean {
        return this.fields.length == 0
    }
}

class PendingTypeRequest {
    constructor(public name: string, public type: ts.TypeNode | undefined) { }
}

export class DeclarationTable {
    private declarations = new Set<DeclarationTarget>()
    private typeMap = new Map<ts.TypeNode, [DeclarationTarget, string[]]>()
    typeChecker: ts.TypeChecker | undefined = undefined
    public language: Language

    constructor(language: string) {
        switch (language) {
            case "arkts": this.language = Language.ARKTS; break
            case "java": this.language = Language.JAVA; break
            case "ts": default: this.language = Language.TS; break
        }
        console.log(`Emit for ${Language[this.language]}`)
    }

    getTypeName(type: ts.TypeNode, optional: boolean = false): string {
        this.requestType(undefined, type)
        let declaration = this.typeMap.get(type)!
        let prefix = optional ? PrimitiveType.OptionalPrefix : ""
        return prefix + declaration[1][0]
    }

    requestType(name: string | undefined, type: ts.TypeNode) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            if (name && !declaration[1].includes(name)) {
                declaration[1].push(name)
            }
            return
        }
        name = this.computeTypeName(name, type, false)
        let target = this.toTarget(type)
        if (!target) throw new Error(`Cannot find declaration: ${type.getText()}`)
        this.typeMap.set(type, [target, [name]])
    }

    private isDeclarationTarget(type: ts.TypeNode): boolean {
        if (ts.isUnionTypeNode(type)) return true
        if (ts.isTypeLiteralNode(type)) return true
        if (ts.isLiteralTypeNode(type)) return true
        if (ts.isTupleTypeNode(type)) return true
        if (ts.isArrayTypeNode(type)) return true
        if (ts.isOptionalTypeNode(type)) return true
        if (ts.isFunctionTypeNode(type)) return true
        // TODO: shall we map it to string type here or later?
        if (ts.isTemplateLiteralTypeNode(type)) return true
        return false
    }

    private pendingRequests = new Array<PendingTypeRequest>()

    computeTypeName(suggestedName: string | undefined, type: ts.TypeNode, optional: boolean = false): string {
        let name = this.computeTypeNameImpl(suggestedName, type, optional)
        this.pendingRequests.push(new PendingTypeRequest(name, type))
        return name
    }

    processPendingRequests() {
        while (this.pendingRequests.length > 0) {
            let value = this.pendingRequests.splice(this.pendingRequests.length - 1, 1)[0]
            this.requestType(value.name, value.type!)
        }
    }

    addDeclaration(target: DeclarationTarget) {
        if (this.declarations.has(target)) return
        this.declarations.add(target)
    }

    numDeclarations(): number {
        return this.declarations.size
    }

    toTarget(node: ts.TypeNode): DeclarationTarget {
        let result = this.toTargetImpl(node)
        this.addDeclaration(result)
        return result
    }

    private toTargetImpl(node: ts.TypeNode): DeclarationTarget {
        if (this.isDeclarationTarget(node)) return node as DeclarationTarget
        if (ts.isImportTypeNode(node)) {
            return this.mapImportType(node)
        }
        if (ts.isTypeReferenceNode(node)) {
            let result = this.customToTarget(node)
            if (result) return result
            // Types with type arguments are declarations!
            if (node.typeArguments) {
                return node
            }
            const original = node
            let declarations = getDeclarationsByNode(this.typeChecker!, node.typeName)
            while (declarations.length > 0 && ts.isTypeAliasDeclaration(declarations[0])) {
                node = declarations[0].type
                this.requestType(identName(declarations[0].name), node)
                if (this.isDeclarationTarget(node)) return node as DeclarationTarget
                if (ts.isTypeReferenceNode(node)) return this.toTarget(node)
                if (ts.isFunctionTypeNode(node)) return this.toTarget(node)
                if (ts.isImportTypeNode(node)) return this.toTarget(node)
                declarations = getDeclarationsByNode(this.typeChecker!, node)
            }
            if (declarations.length == 0) {
                throw new Error(`No declaration for ${node.getText()} ${asString(original)}`)
            }
            let declaration = declarations[0]
            if (ts.isEnumMember(declaration)) {
                return declaration.parent
            }
            return declaration as DeclarationTarget
        }
        if (ts.isParenthesizedTypeNode(node)) {
            return this.toTargetImpl(node.type)
        }
        if (ts.isIndexedAccessTypeNode(node)) {
            return PrimitiveType.CustomObject
        }
        if (ts.isTypeParameterDeclaration(node)) {
            // Not really correct
            return PrimitiveType.CustomObject
        }
        if (node.kind == ts.SyntaxKind.StringKeyword) {
            return PrimitiveType.String
        }
        if (node.kind == ts.SyntaxKind.NumberKeyword) {
            return PrimitiveType.Number
        }
        if (node.kind == ts.SyntaxKind.BooleanKeyword) {
            return PrimitiveType.Boolean
        }
        if (node.kind == ts.SyntaxKind.UndefinedKeyword) {
            return PrimitiveType.Undefined
        }
        if (node.kind == ts.SyntaxKind.VoidKeyword) {
            // TODO: shall it be distinct type.
            return PrimitiveType.Undefined
        }
        if (node.kind == ts.SyntaxKind.ObjectKeyword) {
            return PrimitiveType.CustomObject
        }
        if (node.kind == ts.SyntaxKind.AnyKeyword) {
            return PrimitiveType.CustomObject
        }
        if (node.kind == ts.SyntaxKind.UnknownKeyword) {
            return PrimitiveType.CustomObject
        }
        throw new Error(`Unknown target ${node.getText()}: ${ts.SyntaxKind[node.kind]} in ${asString(node.parent)}`)
    }

    computeTargetName(target: DeclarationTarget, optional: boolean): string {
        let name = this.computeTargetNameImpl(target, optional)
        this.addDeclaration(target)
        if (!(target instanceof PrimitiveType) && (
            !ts.isInterfaceDeclaration(target) && !ts.isClassDeclaration(target) && !ts.isEnumDeclaration(target))
        ) {
            // TODO: get rid of this queue.
            this.pendingRequests.push(new PendingTypeRequest(name, target))
        }
        return name
    }

    computeTargetNameImpl(target: DeclarationTarget, optional: boolean): string {
        const prefix = optional ? PrimitiveType.OptionalPrefix : ""
        if (target instanceof PrimitiveType) {
            return prefix + target.getText(this)
        }
        if (ts.isTypeLiteralNode(target)) {
            if (target.members.some(ts.isIndexSignatureDeclaration)) {
                // For indexed access we just replace the whole type to a custom accessor.
                return prefix + `CustomMap`
            }
            return prefix + `Literal_${target.members.map(member => {
                if (ts.isPropertySignature(member)) {
                    let target = this.toTarget(member.type!)
                    let field = identName(member.name)
                    return `${field}_${this.computeTargetName(target, member.questionToken != undefined)}`
                } else {
                    return undefined
                }
            })
                .filter(it => it != undefined)
                .join("_")}`
        }
        if (ts.isLiteralTypeNode(target)) {
            const literal = target.literal
            if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal) || ts.isRegularExpressionLiteral(literal)) {
                return prefix + PrimitiveType.String.getText()
            }
            if (ts.isNumericLiteral(literal)) {
                return prefix + PrimitiveType.Number.getText()
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return PrimitiveType.Undefined.getText()
            }
        }
        if (ts.isTemplateLiteralTypeNode(target)) {
            // TODO: likeley incorrect
            return prefix + PrimitiveType.String.getText()
        }
        if (ts.isTypeParameterDeclaration(target)) {
            // TODO: likeley incorrect
            return prefix + PrimitiveType.CustomObject.getText()
        }
        if (ts.isEnumDeclaration(target)) {
            // TODO: support namespaces in other declarations.
            let name = identNameWithNamespace(target.name)
            return prefix + name
        }
        if (ts.isUnionTypeNode(target)) {
            return prefix + `Union_${target.types.map(it => this.computeTargetName(this.toTarget(it), false)).join("_")}`
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let name = identName(target.name)
            if (name == "Function")
                return prefix + PrimitiveType.Function.getText()
            return prefix + name
        }
        if (ts.isFunctionTypeNode(target)) {
            return prefix + PrimitiveType.Function.getText()
        }
        if (ts.isTupleTypeNode(target)) {
            return prefix + `Tuple_${target.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeTargetName(this.toTarget(it.type), it.questionToken != undefined)
                } else {
                    return this.computeTargetName(this.toTarget(it), false)
                }
            }).join("_")}`
        }
        if (ts.isArrayTypeNode(target)) {
            return prefix + `Array_` + this.computeTargetName(this.toTarget(target.elementType), false)
        }
        if (ts.isImportTypeNode(target)) {
            return prefix + this.mapImportType(target).getText()
        }
        if (ts.isOptionalTypeNode(target)) {
            let name = this.computeTargetName(this.toTarget(target.type), false)
            return `${PrimitiveType.OptionalPrefix}${name}`
        }
        if (ts.isParenthesizedTypeNode(target)) {
            return this.computeTargetName(this.toTarget(target.type), optional)
        }
        if (ts.isEnumMember(target)) {
            return this.computeTargetName((target as any).parent as DeclarationTarget, optional)
        }
        if (ts.isTypeReferenceNode(target)) {
            let name = identName(target.typeName)
            if (!target.typeArguments) throw new Error("Only type references with type arguments allowed here: " + name)
            if (name == "Optional")
                return this.computeTargetName(this.toTarget(target.typeArguments[0]), true)
            if (name == "Array")
                return prefix + `Array_` + this.computeTargetName(this.toTarget(target.typeArguments[0]), optional)
            if (name == "Map")
                return prefix + `Map_` + this.computeTargetName(this.toTarget(target.typeArguments[0]), false) + '_' + this.computeTargetName(this.toTarget(target.typeArguments[1]), false)
            if (name == "Callback")
                return prefix + PrimitiveType.Function.getText()
            if (PeerGeneratorConfig.isKnownParametrized(name))
                return prefix + PrimitiveType.CustomObject.getText()
        }
        throw new Error(`Cannot compute target name: ${(target as any).getText()} ${(target as any).kind}`)
    }

    private mapImportType(type: ts.ImportTypeNode): DeclarationTarget {
        let name = identName(type.qualifier)!
        switch (name) {
            case "Resource": return PrimitiveType.Resource
            case "Callback": return PrimitiveType.Function
            default: return PrimitiveType.CustomObject
        }
    }

    private computeTypeNameImpl(suggestedName: string | undefined, type: ts.TypeNode, optional: boolean): string {
        const prefix = optional ? PrimitiveType.OptionalPrefix : ""
        if (ts.isImportTypeNode(type)) {
            return prefix + this.mapImportType(type).getText()
        }
        if (ts.isTypeReferenceNode(type)) {
            const typeName = identName(type.typeName)
            if (typeName === "Array") {
                const elementTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![0], false)
                return `${prefix}Array_${elementTypeName}`
            } else if (typeName === "Map") {
                const keyTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![0], false)
                const valueTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![1], false)
                return `${prefix}Map_${keyTypeName}_${valueTypeName}`
            } else if (typeName === "Resource") {
                return `${prefix}${PrimitiveType.Resource.getText()}`
            }
            return prefix + typeName
        }
        if (ts.isUnionTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Union_${type.types.map(it => this.computeTypeNameImpl(undefined, it, optional)).join("_")}`
        }
        if (ts.isOptionalTypeNode(type)) {
            if (suggestedName) return suggestedName
            return PrimitiveType.OptionalPrefix + this.computeTypeNameImpl(undefined, type.type, false)
        }
        if (ts.isTupleTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Tuple_${type.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeTypeNameImpl(undefined, it.type, optional)
                } else {
                    return this.computeTypeNameImpl(undefined, it, optional)
                }

            }).join("_")}`
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.computeTypeNameImpl(suggestedName, type.type!, optional)
        }
        if (ts.isTypeLiteralNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Literal_${type.members.map(member => {
                if (ts.isPropertySignature(member)) {
                    return this.computeTypeNameImpl(undefined, member.type!, member.questionToken != undefined)
                } else {
                    return undefined
                }
            })
                .filter(it => it != undefined)
                .join("_")}`
        }
        if (ts.isLiteralTypeNode(type)) {
            const literal = type.literal
            if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal) || ts.isRegularExpressionLiteral(literal)) {
                return PrimitiveType.String.getText()
            }
            if (ts.isNumericLiteral(literal)) {
                return PrimitiveType.Number.getText()
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                return PrimitiveType.Undefined.getText()
            }
            throw new Error(`Unknown literal type: ${type.getText()}`)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return prefix + PrimitiveType.String.getText()
        }
        if (ts.isFunctionTypeNode(type)) {
            return prefix + PrimitiveType.Function.getText()
        }
        if (ts.isArrayTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Array_` + this.computeTypeNameImpl(undefined, type.elementType, false)
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return prefix + PrimitiveType.Number.getText()
        }
        if (
            type.kind == ts.SyntaxKind.UndefinedKeyword ||
            type.kind == ts.SyntaxKind.NullKeyword ||
            type.kind == ts.SyntaxKind.VoidKeyword
        ) {
            return PrimitiveType.Undefined.getText()
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return prefix + PrimitiveType.String.getText()
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return prefix + PrimitiveType.Boolean.getText()
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword ||
            type.kind == ts.SyntaxKind.UnknownKeyword) {
            return prefix + PrimitiveType.CustomObject.getText()
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return prefix + PrimitiveType.CustomObject.getText()
        }
        if (ts.isTypeParameterDeclaration(type)) {
            return prefix + PrimitiveType.CustomObject.getText()
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            return prefix + PrimitiveType.CustomObject.getText()
        }
        if (ts.isEnumMember(type)) {
            return prefix + identName(type.name)
        }
        throw new Error(`Cannot compute type name: ${type.getText()} ${type.kind}`)
    }

    serializerName(name: string, type: ts.TypeNode): string {
        this.requestType(name, type)
        return `write${name}`
    }

    deserializerName(name: string, type: ts.TypeNode): string {
        this.requestType(name, type)
        return `read${name}`
    }

    declTargetConvertor(param: string, target: DeclarationTarget, isOptionalParam = false): ArgConvertor {
        if (target instanceof PrimitiveType) {
            if (target == PrimitiveType.Number || target == PrimitiveType.Int32) {
                return new NumberConvertor(param)
            }
            if (target == PrimitiveType.Boolean) {
                return new BooleanConvertor(param)
            }
            throw new Error("Unsupported primitive type: " + target.getText())
        }
        throw new Error("Unsupported type: " + target.getText())
    }

    typeConvertor(param: string, type: ts.TypeNode, isOptionalParam = false): ArgConvertor {
        if (!type) throw new Error("Impossible")
        if (isOptionalParam) {
            return new OptionConvertor(param, this, type)
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return new CustomTypeConvertor(param, "Object")
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
            if (identName(type.qualifier) === "Callback") {
                return new FunctionConvertor(param, this)
            }
            return new ImportTypeConvertor(param, this, type)
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker!, type.typeName)[0]
            return this.declarationConvertor(param, type, declaration)
        }
        if (ts.isEnumMember(type)) {
            return new EnumConvertor(param, this, type.parent)
        }
        if (ts.isUnionTypeNode(type)) {
            return new UnionConvertor(param, this, type)
        }
        if (ts.isTypeLiteralNode(type)) {
            return new AggregateConvertor(param, this, type)
        }
        if (ts.isArrayTypeNode(type)) {
            return new ArrayConvertor(param, this, type, type.elementType)
        }
        if (ts.isLiteralTypeNode(type)) {
            if (type.literal.kind == ts.SyntaxKind.NullKeyword) {
                return new UndefinedConvertor(param)
            }
            if (type.literal.kind == ts.SyntaxKind.StringLiteral) {
                return new StringConvertor(param)
            }
            throw new Error(`Unsupported literal type: ${type.literal.kind}` + type.getText())
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
        if (type.kind == ts.SyntaxKind.AnyKeyword ||
            type.kind == ts.SyntaxKind.UnknownKeyword ||
            ts.isIndexedAccessTypeNode(type)
        ) {
            return new CustomTypeConvertor(param, "Any")
        }
        if (ts.isTypeParameterDeclaration(type)) {
            // TODO: unlikely correct.
            return new CustomTypeConvertor(param, identName(type.name)!)
        }
        console.log(type)
        throw new Error(`Cannot convert: ${asString(type)} ${type.getText()} ${type.kind}`)
    }

    private _currentContext: string | undefined = undefined
    getCurrentContext(): string | undefined {
        return this._currentContext
    }
    setCurrentContext(context: string | undefined) {
        this._currentContext = context
    }

    private customToTarget(type: ts.TypeReferenceNode): DeclarationTarget | undefined {
        let name = identName(type)
        switch (name) {
            case `Length`: return PrimitiveType.Length
            case `AnimationRange`: return PrimitiveType.CustomObject
            case `ContentModifier`: return PrimitiveType.CustomObject
            case `Date`: return PrimitiveType.String
            default: return undefined
        }
    }

    private customConvertor(typeName: ts.EntityName | undefined, param: string, type: ts.TypeReferenceNode | ts.ImportTypeNode): ArgConvertor | undefined {
        let name = getNameWithoutQualifiersRight(typeName)
        switch (name) {
            case `Length`:
                return new LengthConvertor(param)
            case `Date`:
                return new ToStringConvertor(param)
            case `AttributeModifier`:
                return new PredefinedConvertor(param, "AttributeModifier<any>", "AttributeModifier", "CustomObject")
            case `AnimationRange`:
                return new CustomTypeConvertor(param, "AnimationRange", "AnimationRange<number>")
            case `ContentModifier`:
                return new CustomTypeConvertor(param, "ContentModifier", "ContentModifier<any>")
            case `Array`:
                return new ArrayConvertor(param, this, type, type.typeArguments![0])
            case `Map`:
                return new MapConvertor(param, this, type, type.typeArguments![0], type.typeArguments![1])
            case `Callback`:
                return new FunctionConvertor(param, this)
            case `Optional`:
                if (type.typeArguments && type.typeArguments.length == 1)
                    return new OptionConvertor(param, this, type.typeArguments![0])
        }
        return undefined
    }

    isPointerDeclaration(target: DeclarationTarget, isOptional: boolean = false): boolean {
        if (isOptional) return true
        if (target instanceof PrimitiveType) return target.isPointer
        if (ts.isEnumDeclaration(target)) return false
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) return true
        return true
    }

    declarationConvertor(param: string, type: ts.TypeReferenceNode, declaration: ts.NamedDeclaration | undefined): ArgConvertor {
        const entityName = typeEntityName(type)
        if (!declaration) {
            return this.customConvertor(entityName, param, type) ?? throwException(`Declaration not found for: ${type.getText()}`)
        }
        const declarationName = identName(declaration.name)!
        let customConvertor = this.customConvertor(entityName, param, type)
        if (customConvertor) {
            return customConvertor
        }
        if (ts.isTypeReferenceNode(type) && entityName && ts.isQualifiedName(entityName)) {
            const typeOuter = ts.factory.createTypeReferenceNode(entityName.left)
            return this.declarationConvertor(param, typeOuter, declaration)
        }
        if (ts.isEnumDeclaration(declaration)) {
            return new EnumConvertor(param, this, declaration)
        }
        if (ts.isEnumMember(declaration)) {
            return new EnumConvertor(param, this, declaration.parent)
        }
        if (ts.isTypeAliasDeclaration(declaration)) {
            this.requestType(declarationName, type)
            return new TypeAliasConvertor(param, this, declaration, type.typeArguments)
        }
        if (ts.isInterfaceDeclaration(declaration)) {
            return new InterfaceConvertor(declarationName, param, this, type)
        }
        if (ts.isClassDeclaration(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(declarationName, param, this, type)
            }
            return new InterfaceConvertor(declarationName, param, this, type)
        }
        if (ts.isTypeParameterDeclaration(declaration)) {
            // TODO: incorrect, we must use actual, not formal type parameter.
            return new CustomTypeConvertor(param, identName(declaration.name)!)
        }
        console.log(`${declaration.getText()}`)
        throw new Error(`Unknown kind: ${declaration.kind}`)
    }

    private noUniqueNamedFields(declaration: DeclarationTarget): boolean {
        let struct = this.targetStruct(declaration)
        if (declaration instanceof PrimitiveType) return true
        if (!ts.isInterfaceDeclaration(declaration)
            && !ts.isClassDeclaration(declaration)) return true
        return struct.isEmpty()
    }

    private uniqueNames = new Map<DeclarationTarget, string>()

    private dumpFileLineLocation(node: DeclarationTarget, tag: string) {
        if (node instanceof PrimitiveType) return
        let sourceFile = node.getSourceFile()
        let lineNumber = getLineNumberString(sourceFile, node.getStart(sourceFile, false))
        console.log(`${tag} ${sourceFile.fileName}:${lineNumber}`)
    }

    private assignUniqueNames() {
        //this.addDeclaration(PrimitiveType.Int32)
        let before = 0
        do {
            before = this.declarations.size
            for (let declaration of this.declarations) {
                if (this.uniqueNames.has(declaration)) continue
                let name = this.computeTargetName(declaration, false)
                if (!name) throw new Error(`Cannot compute name for ${declaration}`)
                this.uniqueNames.set(declaration, name)
            }
        } while (before != this.declarations.size)
        let seenNames = new Map<string, Array<DeclarationTarget>>()
        for (let pair of this.uniqueNames) {
            if (seenNames.has(pair[1])) {
                seenNames.get(pair[1])!.push(pair[0])
            } else {
                seenNames.set(pair[1], [pair[0]])
            }
        }
        for (let name of seenNames.keys()) {
            if (seenNames.get(name)!.length > 1) {
                let declarations = seenNames.get(name)!
                // If we have no named fields - no need to make unique.
                if (declarations.every(it => this.noUniqueNamedFields(it))) continue
                declarations.forEach((declaration, index) => {
                    this.uniqueNames.set(declaration, `${name}_${index}`)
                })
            }
        }
    }

    uniqueName(target: DeclarationTarget): string {
        if (target instanceof PrimitiveType) return target.getText(this)
        return this.uniqueNames.get(target)!
    }

    private printStructsCHead(name: string, descriptor: StructDescriptor, structs: IndentedPrinter) {
        if (descriptor.isArray) {
            // Forward declaration of element type.
            let elementTypePointer = descriptor.getFields()[0].declaration
            if (!(elementTypePointer instanceof PointerType))
                throw new Error(`Unexpected ${this.computeTargetName(elementTypePointer, false)}`)
            let elementType = elementTypePointer.pointed
            if (!(elementType instanceof PrimitiveType)) {
                let name = this.computeTargetName(elementType, false)
                if (ts.isEnumDeclaration(elementType)) {
                    structs.print(`typedef int32_t ${name};`)
                }
            }
        }
        if (descriptor.isPacked) {
            structs.print(`#ifdef _MSC_VER`)
            structs.print(`#pragma pack(push, 1)`)
            structs.print(`#endif`)
        }
        structs.print(`typedef struct ${name} {`)
        structs.pushIndent()
    }


    private printStructsCTail(name: string, needPacked: boolean, structs: IndentedPrinter) {
        structs.popIndent()
        if (needPacked) {
            structs.print(`#ifdef _MSC_VER`)
            structs.print(`}`)
            structs.print(`#pragma pack(pop)`)
            structs.print(`#else`)
            structs.print(`} __attribute__((packed))`)
            structs.print(`#endif`)
            structs.print(`${name};`)
        } else {
            structs.print(`} ${name};`)
        }
    }

    generateDeserializers(printer: LanguageWriter, structs: IndentedPrinter, typedefs: IndentedPrinter, writeToString: IndentedPrinter) {
        this.processPendingRequests()
        let orderer = new DependencySorter(this)
        for (let declaration of this.declarations) {
            orderer.addDep(declaration)
        }
        let order = orderer.getToposorted()
        this.assignUniqueNames()

        const className = "Deserializer"
        const superName = `${className}Base`
        let ctorSignature = printer.language == Language.CPP
            ? new NamedMethodSignature(Type.Void, [new Type("uint8_t*"), Type.Int32], ["data", "length"])
            : undefined
        printer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            const seenNames = new Set<string>()
            for (let declaration of order) {
                let name = this.uniqueNames.get(declaration)!
                if (seenNames.has(name)) continue
                seenNames.add(name)
                this.generateDeserializer(name, declaration, printer)
            }
        }, superName)

        const seenNames = new Set<string>()
        seenNames.clear()
        let noDeclaration = [PrimitiveType.Int32, PrimitiveType.Tag, PrimitiveType.Number, PrimitiveType.Boolean, PrimitiveType.String]
        for (let target of order) {
            let nameAssigned = this.uniqueNames.get(target)
            if (nameAssigned === PrimitiveType.Tag.getText(this)) {
                continue
            }
            if (!nameAssigned) {
                throw new Error(`No assigned name for ${(target as ts.TypeNode).getText()} shall be ${this.computeTargetName(target, false)}`)
            }
            if (seenNames.has(nameAssigned)) continue
            seenNames.add(nameAssigned)
            let isPointer = this.isPointerDeclaration(target)
            let isEnum = !(target instanceof PrimitiveType) && ts.isEnumDeclaration(target)
            let isAccessor = !(target instanceof PrimitiveType) && ts.isClassDeclaration(target) && isMaterialized(target)
            let noBasicDecl = isAccessor || (target instanceof PrimitiveType && noDeclaration.includes(target))
            let nameOptional = PrimitiveType.OptionalPrefix + nameAssigned
            if (isEnum) {
                structs.print(`typedef ${PrimitiveType.Int32.getText()} ${nameAssigned};`)
                if (!seenNames.has(nameOptional)) {
                    seenNames.add(nameOptional)
                    structs.print(`typedef struct ${nameOptional}{ enum ${PrimitiveType.Tag.getText()} tag; ${nameAssigned} value; } ${nameOptional};`)
                    this.writeOptional(nameOptional, writeToString, isPointer)
                }
                continue
            }
            const structDescriptor = this.targetStruct(target)
            if (!noBasicDecl && !this.ignoreTarget(target, nameAssigned)) {
                this.printStructsCHead(nameAssigned, structDescriptor, structs)
                structDescriptor.getFields().forEach(it => structs.print(`${this.cFieldKind(it.declaration)}${it.optional ? PrimitiveType.OptionalPrefix : ""}${this.uniqueName(it.declaration)} ${it.name};`))
                this.printStructsCTail(nameAssigned, structDescriptor.isPacked, structs)
            }
            if (isAccessor) {
                structs.print(`typedef Ark_Materialized ${nameAssigned};`)
            }
            let skipWriteToString = (target instanceof PrimitiveType) || ts.isEnumDeclaration(target) || ts.isFunctionTypeNode(target)
            if (!noBasicDecl && !skipWriteToString) {
                this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
            }
            if (seenNames.has(nameOptional)) continue
            seenNames.add(nameOptional)
            if (!(target instanceof PointerType) && nameAssigned != "Optional" && nameAssigned != "RelativeIndexable") {
                this.printStructsCHead(nameOptional, structDescriptor, structs)
                structs.print(`enum ${PrimitiveType.Tag.getText()} tag;`)
                structs.print(`${nameAssigned} value;`)
                this.printStructsCTail(nameOptional, structDescriptor.isPacked, structs)
                this.writeOptional(nameOptional, writeToString, isPointer)
            }
        }
        for (let declarationTarget of this.typeMap.values()) {
            let target = declarationTarget[0]
            let aliasNames = declarationTarget[1]
            let declarationName = this.uniqueNames.get(target)!
            aliasNames.forEach(aliasName => this.addNameAlias(target, declarationName, aliasName, seenNames, typedefs))
        }
        // TODO: hack, remove me!
        typedefs.print(`typedef ${PrimitiveType.OptionalPrefix}Ark_Length ${PrimitiveType.OptionalPrefix}Length;`)
    }

    generateTSDeserializers(printer: LanguageWriter) {
        printer.writeClass("Deserializer", (writer)=> {
            let seenNames = new Set<string>()
            for (const declaration of this.declarations) {
                if (declaration instanceof PrimitiveType) continue
                const name = this.computeTargetName(declaration, false)
                if (seenNames.has(name)) continue
                seenNames.add(name)
                if (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration)) {
                    writer.pushIndent()
                    this.generateTSDeserializer(name, declaration, writer)
                    writer.popIndent()
                }
            }
        }, "DeserializerBase");
    }

    private addNameAlias(target: DeclarationTarget, declarationName: string, aliasName: string,
        seenNames: Set<string>, typedefs: IndentedPrinter): void {
        if (seenNames.has(aliasName)) return
        if (this.ignoreTarget(target, declarationName) && target != PrimitiveType.CustomObject) return
        seenNames.add(aliasName)
        typedefs.print(`typedef ${declarationName} ${aliasName};`)
        // TODO: hacky
        let optAliasName = `${PrimitiveType.OptionalPrefix}${aliasName}`
        if (!declarationName.startsWith(PrimitiveType.OptionalPrefix) && !seenNames.has(optAliasName)) {
            seenNames.add(optAliasName)
            typedefs.print(`typedef ${PrimitiveType.OptionalPrefix}${declarationName} ${optAliasName};`)
        }
    }

    cFieldKind(declaration: DeclarationTarget): string {
        if (declaration instanceof PointerType) return this.cFieldKind(declaration.pointed)
        if (declaration instanceof PrimitiveType) return ""
        if (ts.isEnumDeclaration(declaration)) return ""
        if (ts.isImportTypeNode(declaration)) return ""
        if (ts.isClassDeclaration(declaration) && isMaterialized(declaration)) return ""
        return `struct `
    }

    writeOptional(nameOptional: string, printer: IndentedPrinter, isPointer: boolean) {
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${nameOptional}* value) {`)
        printer.pushIndent()
        printer.print(`if (value->tag != ${PrimitiveType.UndefinedTag}) {`)
        printer.pushIndent()
        printer.print(`WriteToString(result, ${isPointer ? "&" : ""}value->value);`)
        printer.popIndent()
        printer.print(`} else {`)
        printer.pushIndent()
        printer.print(`${PrimitiveType.Undefined.getText()} undefined = { 0 };`)
        printer.print(`WriteToString(result, undefined);`)
        printer.popIndent()
        printer.print(`}`)
        if (false) {
            printer.print(`result->append(" /* ${nameOptional} { tag=");`)
            printer.print(`result->append(tagName((${PrimitiveType.Tag.getText()})(value->tag)));`)
            printer.print(`result->append(" } */");`)
        }
        printer.popIndent()
        printer.print(`}`)
    }

    generateSerializers(printer: LanguageWriter) {
        const className = "Serializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        switch (printer.language) {
            case Language.ARKTS:
                ctorSignature = new NamedMethodSignature(Type.Void, [Type.Int32], ["expectedSize"])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(Type.Void, [new Type("uint8_t*")], ["data"])
                break;
        }
        let seenNames = new Set<string>()
        printer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            for (let declaration of this.declarations) {
                let name = this.computeTargetName(declaration, false)
                if (seenNames.has(name)) continue
                seenNames.add(name)
                if (declaration instanceof PrimitiveType) continue
                if (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration))
                    this.generateSerializer(name, declaration, writer)
            }
        }, superName)
    }

    visitDeclaration(
        target: DeclarationTarget,
        visitor: StructVisitor,
    ): void {
        if (this.isMaybeWrapped(target, ts.isUnionTypeNode)) {
            this.targetStruct(target).getFields().forEach((field, index) => {
                if (index === 0) return
                visitor.visitUnionField(field, index - 1)
            })
        } else {
            visitor.visitInseparable()
        }
    }

    private isMaybeWrapped(target: DeclarationTarget, predicate: (type: ts.Node) => boolean): boolean {
        if (target instanceof PrimitiveType) return false
        return predicate(target) ||
            ts.isParenthesizedTypeNode(target) &&
            this.isDeclarationTarget(target.type) &&
            predicate(target.type)
    }

    private generateArrayWriteToString(name: string, target: DeclarationTarget, printer: IndentedPrinter) {
        if (target instanceof PrimitiveType) throw new Error("Impossible")
        let elementType = ts.isArrayTypeNode(target)
            ? target.elementType
            : ts.isTypeReferenceNode(target) && target.typeArguments
                ? target.typeArguments[0]
                : undefined

        if (!elementType) throw new Error("Impossible")
        let convertor = this.typeConvertor("param", elementType)
        let isPointerField = convertor.isPointerType()
        let elementNativeType = convertor.nativeType(false)
        let constCast = isPointerField ? `(const ${elementNativeType}*)` : ``

        // Provide prototype of element printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${elementNativeType}${isPointerField ? "*" : ""} value);`)

        // Printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${name}* value) {`)
        printer.pushIndent()
        printer.print(`result->append("[");`)
        printer.print(`int32_t count = value->length > 7 ? 7 : value->length;`)
        printer.print(`for (int i = 0; i < count; i++) {`)
        printer.pushIndent()
        printer.print(`if (i > 0) result->append(", ");`)
        printer.print(`WriteToString(result, ${constCast}${isPointerField ? "&" : ""}value->array[i]);`)
        printer.popIndent()
        printer.print(`}`)
        printer.print(`result->append("]");`)
        printer.popIndent()
        printer.print(`}`)
    }

    private generateMapWriteToString(name: string, target: DeclarationTarget, printer: IndentedPrinter) {
        if (target instanceof PrimitiveType)
            throw new Error("Impossible")
        const [keyType, valueType] = ts.isTypeReferenceNode(target) && target.typeArguments
            ? target.typeArguments
            : [undefined, undefined]
        if (!keyType || !valueType)
            throw new Error("Impossible")
        const keyConvertor = this.typeConvertor("_", keyType)
        const valueConvertor = this.typeConvertor("_", valueType)
        let isPointerKeyField = keyConvertor.isPointerType()
        let isPointerValueField = valueConvertor.isPointerType()
        let keyNativeType = keyConvertor.nativeType(false)
        let valueNativeType = valueConvertor.nativeType(false)
        let keyConstCast = isPointerKeyField ? `(const ${keyNativeType}*)` : ``
        let valueConstCast = isPointerValueField ? `(const ${valueNativeType}*)` : ``

        // Provide prototype of keys printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${keyNativeType}${isPointerKeyField ? "*" : ""} value);`)
        // Provide prototype of values printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${valueNativeType}${isPointerValueField ? "*" : ""} value);`)

        // Printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${name}* value) {`)
        printer.pushIndent()
        printer.print(`result->append("[");`)
        printer.print(`int32_t count = value->size > 7 ? 7 : value->size;`)
        printer.print(`for (int i = 0; i < count; i++) {`)
        printer.pushIndent()
        printer.print(`if (i > 0) result->append(", ");`)
        printer.print(`WriteToString(result, ${keyConstCast}${isPointerKeyField ? "&" : ""}value->keys[i]);`)
        printer.print(`result->append(": ");`)
        printer.print(`WriteToString(result, ${valueConstCast}${isPointerValueField ? "&" : ""}value->values[i]);`)
        printer.popIndent()
        printer.print(`}`)
        printer.print(`result->append("]");`)
        printer.popIndent()
        printer.print(`}`)
    }

    private generateWriteToString(name: string, target: DeclarationTarget, printer: IndentedPrinter, isPointer: boolean) {
        if (target instanceof PrimitiveType) throw new Error("Impossible")

        this.setCurrentContext(`writeToString(${name})`)
        let isUnion = this.isMaybeWrapped(target, ts.isUnionTypeNode)
        let isArray = this.isMaybeWrapped(target, ts.isArrayTypeNode)
        let isMap = ts.isTypeReferenceNode(target) && identName(target.typeName) === "Map"
        let isOptional = this.isMaybeWrapped(target, ts.isOptionalTypeNode)
        let isTuple = this.isMaybeWrapped(target, ts.isTupleTypeNode)
        let access = isPointer ? "->" : "."

        // treat Array<T> as array
        if (!isArray && ts.isTypeReferenceNode(target)) {
            isArray = identName(target.typeName) === "Array"
        }
        if (isArray) {
            this.generateArrayWriteToString(name, target, printer)
        } else if (isMap) {
            this.generateMapWriteToString(name, target, printer)
        } else {
            printer.print(`template <>`)
            printer.print(`inline void WriteToString(string* result, const ${name}${isPointer ? "*" : ""} value) {`)
            printer.pushIndent()

            if (isUnion) {
                this.targetStruct(target).getFields().forEach((field, index) => {
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    if (index != 0) printer.print(`// ${this.uniqueNames.get(field.declaration) ?? ""}`)
                    printer.print(`if (value${access}selector == ${index - 1}) {`)
                    printer.pushIndent()
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                    printer.popIndent()
                    printer.print(`}`)
                })
                if (false) {
                    printer.print(`result->append(" /* ${name} [variant ");`)
                    printer.print(`result->append(std::to_string(value${access}selector));`)
                    printer.print(`result->append("]*/");`)
                }
            } else if (isTuple) {
                printer.print(`result->append("[");`)
                const fields = this.targetStruct(target).getFields()
                fields.forEach((field, index) => {
                    printer.print(`// ${this.uniqueNames.get(field.declaration) ?? ""}`)
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    if (index > 0) {
                        printer.print(`result->append(", ");`)
                    }
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                })
                printer.print(`result->append("]");`)
            } else if (isOptional) {
                printer.print(`result->append("{");`)
                const fields = this.targetStruct(target).getFields()
                fields.forEach((field, index) => {
                    printer.print(`// ${this.uniqueNames.get(field.declaration) ?? ""}`)
                    if (index > 0) printer.print(`result->append(", ");`)
                    printer.print(`result->append("${field.name}: ");`)
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                    if (index == 0) {
                        printer.print(`if (value${access}${field.name} != ${PrimitiveType.UndefinedTag}) {`)
                        printer.pushIndent()
                    }
                    if (index == fields.length - 1) {
                        printer.popIndent()
                        printer.print("}")
                    }
                })
                printer.print(`result->append("}");`)
            } else {
                printer.print(`result->append("{");`)
                this.targetStruct(target).getFields().forEach((field, index) => {
                    printer.print(`// ${this.uniqueNames.get(field.declaration) ?? ""}`)
                    if (index > 0) printer.print(`result->append(", ");`)
                    printer.print(`result->append("${field.name}: ");`)
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                })
                printer.print(`result->append("}");`)
            }
            printer.popIndent()
            printer.print(`}`)
        }
        this.setCurrentContext(undefined)
    }

    private fieldsForClass(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, result: StructDescriptor) {
        clazz.heritageClauses?.forEach(it => {
            heritageDeclarations(this.typeChecker!, it).forEach(it => {
                if (ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it)) {
                    result.supers.push(it)
                    result.isPacked = false
                    this.fieldsForClass(it, result)
                }
            })
        })
        if (ts.isClassDeclaration(clazz)) {
            clazz
                .members
                .filter(ts.isPropertyDeclaration)
                .filter(it => !isStatic(it.modifiers))
                .forEach(it => {
                    result.addField(new FieldRecord(this.toTarget(it.type!), it.type!, identName(it.name)!, it.questionToken != undefined))
                })
        } else {
            clazz
                .members
                .filter(ts.isPropertySignature)
                .filter(it => !isStatic(it.modifiers))
                .forEach(it => {
                    result.addField(new FieldRecord(this.toTarget(it.type!), it.type!, identName(it.name)!, it.questionToken != undefined))
                })
        }
    }

    targetStruct(target: DeclarationTarget): StructDescriptor {
        let result = new StructDescriptor()
        if (target instanceof PointerType) {
            // Break the dependency cycle.
            // result.deps.add(target.pointed)
            return result
        }

        if (target instanceof PrimitiveType) {
            return result
        }
        else if (ts.isArrayTypeNode(target)) {
            result.isArray = true
            let element = this.toTarget(target.elementType)
            result.addField(new FieldRecord(PrimitiveType.pointerTo(element), target, "array"))
            result.addField(new FieldRecord(PrimitiveType.Int32, undefined, "length"))
        }
        else if (ts.isInterfaceDeclaration(target)) {
            this.fieldsForClass(target, result)
        }
        else if (ts.isClassDeclaration(target)) {
            this.fieldsForClass(target, result)
        }
        else if (ts.isUnionTypeNode(target)) {
            result.addField(new FieldRecord(PrimitiveType.Int32, undefined, `selector`, false))
            target
                .types
                .forEach((it, index) => {
                    result.addField(new FieldRecord(this.toTarget(it), it, `value${index}`, false))
                })
        }
        else if (ts.isTypeLiteralNode(target)) {
            if (target.members.some(ts.isIndexSignatureDeclaration)) {
                // For indexed access we just replace the whole type to a custom accessor.
                result.addField(new FieldRecord(PrimitiveType.CustomObject, undefined, "keyAccessor", false))
            } else {
                target
                    .members
                    .forEach(it => {
                        if (ts.isPropertySignature(it))
                            result.addField(new FieldRecord(this.toTarget(it.type!), it.type, identName(it.name)!, it.questionToken != undefined))
                    })
            }
        }
        else if (ts.isTupleTypeNode(target)) {
            target
                .elements
                .forEach((it, index) => {
                    if (ts.isNamedTupleMember(it)) {
                        result.addField(new FieldRecord(this.toTarget(it.type!), it.type!, identName(it.name)!, it.questionToken != undefined))
                    } else {
                        result.addField(new FieldRecord(this.toTarget(it), it, `value${index}`, false))
                    }
                })
        }
        else if (ts.isOptionalTypeNode(target)) {
            result.addField(new FieldRecord(PrimitiveType.Tag, undefined, "tag"))
            result.addField(new FieldRecord(this.toTarget(target.type), target.type, "value"))
        }
        else if (ts.isParenthesizedTypeNode(target)) {
            // TODO: is it correct?
            return this.targetStruct(this.toTarget(target.type))
        }
        else if (ts.isEnumDeclaration(target) || ts.isEnumMember(target)) {
            result.addField(new FieldRecord(PrimitiveType.Int32, undefined, "value"))
        }
        else if (ts.isFunctionTypeNode(target)) {
        }
        else if (ts.isImportTypeNode(target)) {
        }
        else if (ts.isTemplateLiteralTypeNode(target)) {
        }
        else if (ts.isLiteralTypeNode(target)) {
        }
        else if (ts.isTypeParameterDeclaration(target)) {
            // TODO: is it really correct
        }
        else if (ts.isTypeReferenceNode(target)) {
            if (!target.typeArguments) throw new Error("Only type references with type arguments allowed")
            let name = identName(target.typeName)
            if (name == "Optional") {
                let type = target.typeArguments[0]
                result.addField(new FieldRecord(PrimitiveType.Tag, undefined, "tag"))
                result.addField(new FieldRecord(this.toTarget(type), type, "value"))
            } else if (name == "Array") {
                let type = target.typeArguments[0]
                result.isArray = true
                result.addField(new FieldRecord(PrimitiveType.pointerTo(this.toTarget(type)), undefined, "array"))
                result.addField(new FieldRecord(PrimitiveType.Int32, undefined, "length"))
            } else if (name == "Map") {
                let keyType = target.typeArguments[0]
                let valueType = target.typeArguments[1]
                result.addField(new FieldRecord(PrimitiveType.Int32, undefined, "size"))
                result.addField(new FieldRecord(PrimitiveType.pointerTo(this.toTarget(keyType)), undefined, "keys"))
                result.addField(new FieldRecord(PrimitiveType.pointerTo(this.toTarget(valueType)), undefined, "values"))
            } else if (name == "ContentModifier") {
                let type = target.typeArguments[0]
                result.addField(new FieldRecord(PrimitiveType.pointerTo(this.toTarget(type)), undefined, "config"))
            } else if (name == "Callback") {
                result.addField(new FieldRecord(PrimitiveType.Int32, undefined, "id"))
            } else if (PeerGeneratorConfig.isKnownParametrized(name)) {
                // TODO: not this way yet!
                // let type = target.typeArguments[0]
                // result.addField(new FieldRecord(this.toTarget(type), type, "value0"))
                // result.addField(new FieldRecord(this.toTarget(type), type, "value1"))
            } else {
                throw new Error(`Parametrized type unknown: ${name} ${(target as any).getText()}`)
            }
        }
        else {
            throw new Error(`Unsupported field getter: ${asString(target)} ${(target as any).getText()}`)
        }
        return result
    }

    private translateSerializerType(name: string, target: DeclarationTarget): string {
        if (target instanceof PrimitiveType) throw new Error("Unexpected")
        if (ts.isInterfaceDeclaration(target) && target.typeParameters != undefined) {
            if (target.typeParameters.length != 1) throw new Error("Unexpected")
            return `${name}<any>`
        } else {
            return name
        }
    }

    private generateSerializer(name: string, target: DeclarationTarget, printer: LanguageWriter) {
        if (this.ignoreTarget(target, name)) return

        this.setCurrentContext(`write${name}()`)

        printer.pushIndent()
        printer.writeMethodImplementation(
            new Method(`write${name}`,
                new NamedMethodSignature(Type.Void, [new Type(this.translateSerializerType(name, target))], ["value"])),
            writer => {
                writer.writeStatement(writer.makeAssign("valueSerializer", undefined, writer.makeThis(), true))
                if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
                    let struct = this.targetStruct(target)
                    struct.getFields().forEach(it => {
                        let field = `value_${it.name}`
                        writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${it.name}`), true))
                        let typeConvertor = this.typeConvertor(`value`, it.type!, it.optional)
                        typeConvertor.convertorSerialize(`value`, field, writer)
                    })
                } else {
                    let typeConvertor = this.typeConvertor("value", target, false)
                    typeConvertor.convertorSerialize(`value`, `value`, writer)
                }
            })
        printer.popIndent()
        this.setCurrentContext(undefined)
    }

    private ignoreTarget(target: DeclarationTarget, name: string): target is PrimitiveType | ts.EnumDeclaration {
        if (PeerGeneratorConfig.ignoreSerialization.includes(name)) return true
        if (target instanceof PrimitiveType) return true
        if (ts.isEnumDeclaration(target)) return true
        if (ts.isFunctionTypeNode(target)) return true
        if (ts.isImportTypeNode(target)) return true
        if (ts.isTemplateLiteralTypeNode(target)) return true
        return false
    }

    private generateDeserializer(name: string, target: DeclarationTarget, printer: LanguageWriter) {
        if (this.ignoreTarget(target, name)) return
        this.setCurrentContext(`read${name}()`)
        const type = new Type(name)
        printer.writeMethodImplementation(new Method(`read${name}`, new NamedMethodSignature(type, [], [])), writer => {
            writer.writeStatement(
                writer.makeAssign("valueDeserializer", new Type(writer.makeRef("Deserializer")), writer.makeThis(), true))
            // using list initialization to prevent uninitialized value errors
            writer.writeStatement(writer.makeAssign("value", type, writer.makeString("{}"), true))
            if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
                let struct = this.targetStruct(target)
                struct.getFields().forEach(it => {
                    let typeConvertor = this.typeConvertor(`value`, it.type!, it.optional)
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value.${it.name}`, writer))
                })
            } else {
                let typeConvertor = this.typeConvertor("value", target, false)
                writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value`, writer))
            }
            writer.writeStatement(writer.makeReturn(writer.makeString("value")))
        })
        this.setCurrentContext(undefined)
    }

    private createValueFieldName(fieldName: string): string {
        return `value_${fieldName}`
    }

    private generateTSDeserializer(name: string, target: DeclarationTarget, writer: LanguageWriter) {
        if (this.ignoreTarget(target, name)) return
        this.setCurrentContext(`read${name}()`)
        const body = (writer: LanguageWriter) => {
            const resultVarName = "value"
            if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
                let struct = this.targetStruct(target)
                writer.writeStatement(
                    writer.makeAssign("valueDeserializer",
                        new Type("Deserializer"),
                        writer.makeString("this"), true)
                )
                let resultObjArgs: string[] = []
                struct.getFields().forEach((it) => {
                    resultObjArgs.push(`${it.name}: undefined`)
                })
                writer.writeStatement(writer.makeAssign(resultVarName,
                    Type.Any,
                    writer.makeString(`{${resultObjArgs.join(",")}}`),
                    true))
                struct.getFields().forEach(it => {
                    let typeConvertor = this.typeConvertor(resultVarName, it.type!, it.optional)
                    writer.writeStatement(typeConvertor.convertorDeserialize(resultVarName, `${it.name}`, writer))
                })
            } else {
                let typeConvertor = this.typeConvertor(resultVarName, target, false)
                writer.writeStatement(typeConvertor.convertorDeserialize(resultVarName, resultVarName, writer))
            }
            writer.print(`return ${resultVarName}`)
        }
        writer.writeMethodImplementation(new Method(
            `read${name}`,
            new NamedMethodSignature(new Type(name))),
            body)
        this.setCurrentContext(undefined)
    }
}
