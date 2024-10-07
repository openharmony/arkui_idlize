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
import { Language, asString, getDeclarationsByNode, getNameWithoutQualifiersRight, heritageDeclarations,
     identName, isStatic, throwException, typeEntityName, identNameWithNamespace,
     isCommonMethodOrSubclass,
     camelCaseToUpperSnakeCase,
     nameEnumValues,
    } from "../util"
import { IndentedPrinter } from "../IndentedPrinter"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import {
    AggregateConvertor, ArgConvertor, ArrayConvertor, BooleanConvertor, CallbackFunctionConvertor, CallbackTypeReferenceConvertor, ClassConvertor, CustomTypeConvertor,
    EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, LengthConvertor, MapConvertor,
    MaterializedClassConvertor, NullConvertor, NumberConvertor, OptionConvertor, PredefinedConvertor, StringConvertor,
    ToStringConvertor, TupleConvertor, TypeAliasConvertor, UndefinedConvertor, UnionConvertor
} from "./Convertors"
import { DependencySorter } from "./DependencySorter"
import { checkDeclarationTargetMaterialized, isMaterialized } from "./Materialized"
import { LanguageExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, Type } from "./LanguageWriters"
import { RuntimeType } from "./PeerGeneratorVisitor"
import { TypeNodeConvertor, convertTypeNode } from "./TypeNodeConvertor"
import { PeerLibrary } from "./PeerLibrary"
import { CallbackInfo, collectCallbacks } from "./printers/EventsPrinter"
import { EnumMember, NodeArray } from "typescript";
import { extractBuilderFields } from "./BuilderClass"
import { searchTypeParameters, TypeNodeNameConvertor } from "./TypeNodeNameConvertor";

export const ResourceDeclaration = ts.factory.createInterfaceDeclaration(undefined, "Resource", undefined, undefined, [
    ts.factory.createPropertySignature(undefined, "id", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
    ts.factory.createPropertySignature(undefined, "type", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
    ts.factory.createPropertySignature(undefined, "moduleName", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
    ts.factory.createPropertySignature(undefined, "bundleName", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
    ts.factory.createPropertySignature(undefined, "params", ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))),
])

function cleanPrefix(name: string, prefix: string): string {
    return name.replace(prefix, "")
}

export class PrimitiveType {
    constructor(private name: string, public isPointer = false) { }
    getText(table?: DeclarationTable): string { return this.name }
    static Prefix = "Ark_"
    static String = new PrimitiveType(`${PrimitiveType.Prefix}String`, true)
    static Number = new PrimitiveType(`${PrimitiveType.Prefix}Number`, true)
    static Int32 = new PrimitiveType(`${PrimitiveType.Prefix}Int32`)
    static Tag = new PrimitiveType(`${PrimitiveType.Prefix}Tag`)
    static RuntimeType = new PrimitiveType(`${PrimitiveType.Prefix}RuntimeType`)
    static Boolean = new PrimitiveType(`${PrimitiveType.Prefix}Boolean`)
    static Function = new PrimitiveType(`${PrimitiveType.Prefix}Function`, false)
    static Materialized = new PrimitiveType(`${PrimitiveType.Prefix}Materialized`, true)
    static Undefined = new PrimitiveType(`${PrimitiveType.Prefix}Undefined`)
    static NativePointer = new PrimitiveType(`${PrimitiveType.Prefix}NativePointer`)
    static ObjectHandle = new PrimitiveType(`${PrimitiveType.Prefix}ObjectHandle`)
    static Length = new PrimitiveType(`${PrimitiveType.Prefix}Length`, true)
    static CustomObject = new PrimitiveType(`${PrimitiveType.Prefix}CustomObject`, true)
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

export class PointerType extends PrimitiveType {
    constructor(public pointed: DeclarationTarget) {
        super("", true)
    }
    getText(table: DeclarationTable): string {
        return `${table.computeTargetName(this.pointed, false)}*`
    }
}

export type DeclarationTarget =
    ts.ClassDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration
    | ts.UnionTypeNode | ts.TypeLiteralNode | ts.ImportTypeNode | ts.FunctionTypeNode | ts.TupleTypeNode | ts.NamedTupleMember
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

export class StructDescriptor {
    supers: DeclarationTarget[] = []
    deps = new Set<DeclarationTarget>()
    isPacked: boolean = false
    isArray: boolean = false
    private fields: FieldRecord[] = []
    private seenFields = new Set<string>()
    addField(field: FieldRecord) {
        if (!this.seenFields.has(field.name)) {
            this.seenFields.add(field.name)
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

export class DeclarationTable {
    private typeMap = new Map<ts.TypeNode, [DeclarationTarget, string[], boolean]>()
    private toTargetConvertor: ToDeclarationTargetConvertor
    typeChecker: ts.TypeChecker | undefined = undefined
    public language: Language

    constructor(language: string) {
        this.language = Language.fromString(language)
        console.log(`Emit for ${this.language.toString()}`)
        this.toTargetConvertor = new ToDeclarationTargetConvertor(this)
    }

    getTypeName(type: ts.TypeNode, optional: boolean = false): string {
        let declaration = this.typeMap.get(type)
        let prefix = optional ? PrimitiveType.OptionalPrefix : ""
        if (declaration !== undefined) {
            let name = declaration[1][0]
            if (optional) {
                name = cleanPrefix(name, PrimitiveType.Prefix)
            }
            return prefix + name
        }
        return this.computeTargetName(this.toTarget(type), optional)
    }

    requestType(name: string | undefined, type: ts.TypeNode, useToGenerate: boolean) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            declaration[2] ||= useToGenerate
            if (name && !declaration[1].includes(name)) {
                declaration[1].push(name)
            }
            return
        }
        name = this.computeTypeName(name, type, false)
        let target = this.toTarget(type)
        if (!target) throw new Error(`Cannot find declaration: ${type.getText()}`)
        this.typeMap.set(type, [target, [name], useToGenerate])
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

    computeTypeName(suggestedName: string | undefined, type: ts.TypeNode, optional: boolean = false, idlPrefix: string = PrimitiveType.Prefix): string {
        return this.computeTypeNameImpl(suggestedName, type, optional, idlPrefix)
    }

    toTarget(node: ts.TypeNode): DeclarationTarget {
        return convertTypeNode(this.toTargetConvertor, node)
    }

    computeTargetName(target: DeclarationTarget, optional: boolean, idlPrefix: string = PrimitiveType.Prefix): string {
        return this.computeTargetNameImpl(target, optional, idlPrefix)
    }

    computeTargetTypeLiteralName(type: ts.TypeLiteralNode, prefix: string): string {
        const props = type.members.filter(ts.isPropertySignature)
        const map = new Map<string, string[]>()
        for (const prop of props) {
            const target = this.toTarget(prop.type!)
            const type = this.computeTargetName(target, prop.questionToken != undefined, "")
            const field = identName(prop.name)!
            const values = map.has(type) ? map.get(type)! : []
            values.push(field)
            map.set(type, values)
        }
        const names = Array.from(map.keys()).map(key => `${key}_${map.get(key)!.join('_')}`)
        return prefix + `Literal_${names.join('_')}`
    }

    computeTargetNameImpl(target: DeclarationTarget, optional: boolean, idlPrefix: string): string {
        const prefix = optional ? PrimitiveType.OptionalPrefix : ""
        if (target instanceof PrimitiveType) {
            const name = target.getText(this)
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isTypeLiteralNode(target)) {
            if (target.members.some(ts.isIndexSignatureDeclaration)) {
                // For indexed access we just replace the whole type to a custom accessor.
                return prefix + `CustomMap`
            }

            const parent = target.parent
            if (ts.isTypeAliasDeclaration(parent)) {
                return `${PrimitiveType.Prefix}${identName(parent.name)}`
            }

            return this.computeTargetTypeLiteralName(target, prefix)
        }
        if (ts.isLiteralTypeNode(target)) {
            const literal = target.literal
            if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal) || ts.isRegularExpressionLiteral(literal)) {
                let name = PrimitiveType.String.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
            }
            if (ts.isNumericLiteral(literal)) {
                let name = PrimitiveType.Number.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return PrimitiveType.Undefined.getText()
            }
        }
        if (ts.isTemplateLiteralTypeNode(target)) {
            // TODO: likely incorrect
            let name = PrimitiveType.String.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isTypeParameterDeclaration(target)) {
            // TODO: likely incorrect
            let name = PrimitiveType.CustomObject.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isEnumDeclaration(target)) {
            const name = this.enumName(target.name)
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isUnionTypeNode(target)) {
            const parent = target.parent
            if (ts.isTypeAliasDeclaration(parent)) {
                return `${PrimitiveType.Prefix}${identName(parent.name)}`
            }
            return prefix + `Union_${target.types.map(it => this.computeTargetName(this.toTarget(it), false, "")).join("_")}`
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let name = identName(target.name)
            if (name == "Function") {
                const name = PrimitiveType.Function.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
            }
            return prefix + (optional ? "" : idlPrefix) + name
        }
        if (ts.isFunctionTypeNode(target)) {
            let name = PrimitiveType.Function.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isTupleTypeNode(target)) {
            return prefix + `Tuple_${target.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeTargetName(this.toTarget(it.type), it.questionToken != undefined, "")
                } else {
                    return this.computeTargetName(this.toTarget(it), false, "")
                }
            }).join("_")}`
        }
        if (ts.isArrayTypeNode(target)) {
            return prefix + `Array_` + this.computeTargetName(this.toTarget(target.elementType), false, "")
        }
        if (ts.isImportTypeNode(target)) {
            return prefix + this.mapImportTypeName(target)
        }
        if (ts.isOptionalTypeNode(target)) {
            let name = this.computeTargetName(this.toTarget(target.type), false, "")
            return `${PrimitiveType.OptionalPrefix}${cleanPrefix(name, PrimitiveType.Prefix)}`
        }
        if (ts.isParenthesizedTypeNode(target)) {
            return this.computeTargetName(this.toTarget(target.type), optional, idlPrefix)
        }
        if (ts.isEnumMember(target)) {
            return this.computeTargetName((target as any).parent as DeclarationTarget, optional, idlPrefix)
        }
        if (ts.isTypeReferenceNode(target)) {
            let name = identName(target.typeName)
            if (!target.typeArguments) throw new Error("Only type references with type arguments allowed here: " + name)
            if (name == "Optional")
                return this.computeTargetName(this.toTarget(target.typeArguments[0]), true, idlPrefix)
            if (name == "Array")
                return prefix + `Array_` + this.computeTargetName(this.toTarget(target.typeArguments[0]), false, "")
            if (name == "Map")
                return prefix + `Map_` + this.computeTargetName(this.toTarget(target.typeArguments[0]), false, "")
                    + '_' + this.computeTargetName(this.toTarget(target.typeArguments[1]), false, "")
            if (name == "Callback") {
                return prefix + PrimitiveType.Function.getText()
            }
            if (PeerGeneratorConfig.isKnownParametrized(name)) {
                let name = PrimitiveType.CustomObject.getText()
                return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
            }
        }
        throw new Error(`Cannot compute target name: ${(target as any).getText()} ${(target as any).kind}`)
    }

    private mapImportTypeName(type: ts.ImportTypeNode): string {
        let name = identName(type.qualifier)!
        switch (name) {
            case "Resource": return "Resource"
            case "Callback": return PrimitiveType.Function.getText()
            default: return PrimitiveType.CustomObject.getText()
        }
    }

    private computeTypeNameImpl(suggestedName: string | undefined, type: ts.TypeNode, optional: boolean, idlPrefix: string): string {
        const prefix = optional ? PrimitiveType.OptionalPrefix : ""
        if (ts.isImportTypeNode(type)) {
            return prefix + this.mapImportTypeName(type)
        }
        if (ts.isTypeReferenceNode(type)) {
            const typeName = identName(type.typeName)
            let declaration = this.toTarget(type)
            if (!(declaration instanceof PrimitiveType) && ts.isEnumDeclaration(declaration)) {
                const name = this.enumName(declaration.name)
                return (optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name
            }
            if (typeName === "Array") {
                const elementTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![0], false, "")
                return `${prefix}Array_${elementTypeName}`
            } else if (typeName === "Map") {
                const keyTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![0], false, "")
                const valueTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![1], false, "")
                return `${prefix}Map_${keyTypeName}_${valueTypeName}`
            } else if (typeName === "Callback") {
                return prefix + typeName
            }
            if (!(declaration instanceof PrimitiveType)) {
                if (ts.isUnionTypeNode(declaration) && typeName === "GestureType" ||
                    ts.isInterfaceDeclaration(declaration) ||
                    ts.isClassDeclaration(declaration)
                ) {
                    return prefix + (optional ? "" : idlPrefix) + typeName;
                }
            }
            return prefix + typeName
        }
        if (ts.isUnionTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Union_${type.types.map(it => this.computeTypeNameImpl(undefined, it, optional, "")).join("_")}`
        }
        if (ts.isOptionalTypeNode(type)) {
            if (suggestedName) return suggestedName
            const name = this.computeTypeNameImpl(undefined, type.type, false, "")
            return PrimitiveType.OptionalPrefix + cleanPrefix(name, PrimitiveType.Prefix)
        }
        if (ts.isTupleTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Tuple_${type.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeTypeNameImpl(undefined, it.type, optional, "")
                } else {
                    return this.computeTypeNameImpl(undefined, it, optional, "")
                }

            }).join("_")}`
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.computeTypeNameImpl(suggestedName, type.type!, optional, idlPrefix)
        }
        if (ts.isTypeLiteralNode(type)) {
            if (suggestedName) return suggestedName
            return this.computeTargetTypeLiteralName(type, prefix)
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
            const name = PrimitiveType.String.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isFunctionTypeNode(type)) {
            const name = PrimitiveType.Function.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isArrayTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Array_` + this.computeTypeNameImpl(undefined, type.elementType, false, "")
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            const name = PrimitiveType.Number.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (
            type.kind == ts.SyntaxKind.UndefinedKeyword ||
            type.kind == ts.SyntaxKind.NullKeyword ||
            type.kind == ts.SyntaxKind.VoidKeyword
        ) {
            return PrimitiveType.Undefined.getText()
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            const name = PrimitiveType.String.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            const name = PrimitiveType.Boolean.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword ||
            type.kind == ts.SyntaxKind.UnknownKeyword) {
            const name = PrimitiveType.CustomObject.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            const name = PrimitiveType.CustomObject.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isTypeParameterDeclaration(type)) {
            const name = PrimitiveType.CustomObject.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            const name = PrimitiveType.CustomObject.getText()
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        if (ts.isEnumMember(type)) {
            const name = this.enumName(type.name)
            return prefix + ((optional || idlPrefix == "") ? cleanPrefix(name, PrimitiveType.Prefix) : name)
        }
        throw new Error(`Cannot compute type name: ${type.getText()} ${type.kind}`)
    }

    public enumName(name: ts.PropertyName): string {
        // TODO: support namespaces in other declarations.
        return `${PrimitiveType.Prefix}${identNameWithNamespace(name, Language.CPP)}`
    }

    public get orderedDependencies(): DeclarationTarget[] {
        return this._orderedDependencies
    }
    private _orderedDependencies: DeclarationTarget[] = []

    public get orderedDependenciesToGenerate(): DeclarationTarget[] {
        return this._orderedDependenciesToGenerate
    }
    private _orderedDependenciesToGenerate: DeclarationTarget[] = []
    analyze(library: PeerLibrary) {
        const callbacks = collectCallbacks(library) as CallbackInfo[]
        for (const callback of callbacks) {
            callback.args.forEach(arg => {
                const useToGenerate = library.shouldGenerateComponent(callback.componentName)
                this.requestType(undefined, arg.type, useToGenerate)
            })
        }

        let orderer = new DependencySorter(this)
        for (let declaration of this.typeMap.values()) {
            orderer.addDep(declaration[0])
        }
        this._orderedDependencies = orderer.getToposorted()

        let toGenerateOrderer = new DependencySorter(this)
        for (let declaration of this.typeMap.values()) {
            if (declaration[2])
                toGenerateOrderer.addDep(declaration[0])
        }
        this._orderedDependenciesToGenerate = toGenerateOrderer.getToposorted()
    }

    serializerName(name: string): string {
        return `write${name}`
    }

    deserializerName(name: string): string {
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

    typeConvertor(param: string,
                  type: ts.TypeNode,
                  isOptionalParam: boolean = false,
                  typeNodeNameConvertor: TypeNodeNameConvertor | undefined = undefined): ArgConvertor {
        if (!type) throw new Error("Impossible")
        if (isOptionalParam) {
            return new OptionConvertor(param, this, type, typeNodeNameConvertor)
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return new CustomTypeConvertor(param, "Object", false)
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
            return new StringConvertor(param, type, typeNodeNameConvertor)
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return new BooleanConvertor(param)
        }
        if (ts.isImportTypeNode(type)) {
            if (identName(type.qualifier) === "Callback") {
                return new FunctionConvertor(param, this, type)
            }
            if (identName(type.qualifier) === "Resource") {
                return new InterfaceConvertor("Resource", param, ResourceDeclaration, this)
            }
            return new ImportTypeConvertor(param, this, type)
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker!, type.typeName)[0]
            return this.declarationConvertor(param, type, declaration, typeNodeNameConvertor)
        }
        if (ts.isEnumMember(type)) {
            return new EnumConvertor(param, type.parent, this.isStringEnum(type.parent.members), this.language)
        }
        if (ts.isUnionTypeNode(type)) {
            return new UnionConvertor(param, this, type, typeNodeNameConvertor)
        }
        if (ts.isTypeLiteralNode(type)) {
            return new AggregateConvertor(param, this, type, typeNodeNameConvertor)
        }
        if (ts.isArrayTypeNode(type)) {
            return new ArrayConvertor(param, this, type, type.elementType, typeNodeNameConvertor)
        }
        if (ts.isLiteralTypeNode(type)) {
            if (type.literal.kind == ts.SyntaxKind.NullKeyword) {
                return new NullConvertor(param)
            }
            if (type.literal.kind == ts.SyntaxKind.StringLiteral) {
                return new StringConvertor(param, type, typeNodeNameConvertor)
            }
            throw new Error(`Unsupported literal type: ${type.literal.kind}` + type.getText())
        }
        if (ts.isTupleTypeNode(type)) {
            return new TupleConvertor(param, this, type)
        }
        if (ts.isFunctionTypeNode(type)) {
            if (isCallback(type, this)) {
                return new CallbackFunctionConvertor(param, this, type)
            }
            return new FunctionConvertor(param, this, type)
        }
        if (ts.isParenthesizedTypeNode(type)) {
            return this.typeConvertor(param, type.type)
        }
        if (ts.isOptionalTypeNode(type)) {
            return new OptionConvertor(param, this, type.type)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return new StringConvertor(param, type, typeNodeNameConvertor)
        }
        if (ts.isNamedTupleMember(type)) {
            return this.typeConvertor(param, type.type)
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword ||
            type.kind == ts.SyntaxKind.UnknownKeyword ||
            ts.isIndexedAccessTypeNode(type)
        ) {
            return new CustomTypeConvertor(param, "Any", false)
        }
        if (ts.isTypeParameterDeclaration(type)) {
            // TODO: unlikely correct.
            return new CustomTypeConvertor(param, identName(type.name)!, false)
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

    private customConvertor(typeName: ts.EntityName | undefined, param: string, type: ts.TypeReferenceNode | ts.ImportTypeNode,
                            typeNodeNameConvertor: TypeNodeNameConvertor | undefined): ArgConvertor | undefined {
        let name = getNameWithoutQualifiersRight(typeName)
        switch (name) {
            case `Dimension`:
            case `Length`:
                return new LengthConvertor(name, param, this.language)
            case `Date`:
                return new CustomTypeConvertor(param, name, false, name)
            case `AttributeModifier`:
                return new PredefinedConvertor(param, "AttributeModifier<any>", "AttributeModifier", "CustomObject")
            case `AnimationRange`:
                return new CustomTypeConvertor(param, "AnimationRange", false, "AnimationRange<number>")
            case `ContentModifier`:
                return new CustomTypeConvertor(param, "ContentModifier", false, "ContentModifier<any>")
            case `Record`:
                return new CustomTypeConvertor(param, "Record", false, "Record<string, string>")
            case `Array`:
                return new ArrayConvertor(param, this, type, type.typeArguments![0], typeNodeNameConvertor)
            case `Map`:
                return new MapConvertor(param, this, type, type.typeArguments![0], type.typeArguments![1])
            case `Callback`:
                if (ts.isTypeReferenceNode(type) && isCallback(type, this)) {
                    return new CallbackTypeReferenceConvertor(param, this, type)
                }
                return new FunctionConvertor(param, this, type)
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

    declarationConvertor(param: string, type: ts.TypeReferenceNode, declaration: ts.NamedDeclaration | undefined,
                         typeNodeNameConvertor: TypeNodeNameConvertor | undefined): ArgConvertor {
        const entityName = typeEntityName(type)
        if (!declaration) {
            return this.customConvertor(entityName, param, type, typeNodeNameConvertor) ?? throwException(`Declaration not found for: ${type.getText()}`)
        }
        if (PeerGeneratorConfig.isConflictedDeclaration(declaration))
            return new CustomTypeConvertor(param, identName(declaration.name)!, false)
        const declarationName = identName(declaration.name)!
        let customConvertor = this.customConvertor(entityName, param, type, typeNodeNameConvertor)
        if (customConvertor) {
            return customConvertor
        }
        if (ts.isEnumDeclaration(declaration)) {
            return new EnumConvertor(param, declaration, this.isStringEnum(declaration.members), this.language)
        }
        if (ts.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent, this.isStringEnum(declaration.parent.members), this.language)
        }
        if (ts.isTypeAliasDeclaration(declaration)) {
            return new TypeAliasConvertor(param, this, declaration, typeNodeNameConvertor)
        }
        if (ts.isInterfaceDeclaration(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(declarationName, param, this, declaration)
            }
            return new InterfaceConvertor(declarationName, param, declaration, this)
        }
        if (ts.isClassDeclaration(declaration)) {
            if (isMaterialized(declaration)) {
                return new MaterializedClassConvertor(declarationName, param, this, declaration)
            }
            return new ClassConvertor(declarationName, param, declaration, this)
        }
        if (ts.isTypeParameterDeclaration(declaration)) {
            // TODO: incorrect, we must use actual, not formal type parameter.
            const isGenericType = searchTypeParameters(declaration)
                ?.find(it => ts.isIdentifier(it.name) && it.name.text == identName(declaration.name)!) !== undefined
            return new CustomTypeConvertor(param, identName(declaration.name)!, isGenericType)
        }
        console.log(`${declaration.getText()}`)
        throw new Error(`Unknown kind: ${declaration.kind}`)
    }

    private printStructsCHead(name: string, descriptor: StructDescriptor, structs: LanguageWriter, writeToString: LanguageWriter, seenNames: Set<string>) {
        if (descriptor.isArray) {
            // Forward declaration of element type.
            let elementTypePointer = descriptor.getFields()[0].declaration
            if (!(elementTypePointer instanceof PointerType))
                throw new Error(`Unexpected ${this.computeTargetName(elementTypePointer, false)}`)
            let elementType = elementTypePointer.pointed
            if (!(elementType instanceof PrimitiveType) && ts.isEnumDeclaration(elementType)) {
                const enumName = this.enumName(elementType.name)
                if (!seenNames.has(enumName)) {
                    seenNames.add(enumName)
                    this.generateEnum(structs, writeToString, elementType)
                    this.generateOptional(structs, writeToString, elementType, enumName, seenNames)
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


    private printStructsCTail(name: string, needPacked: boolean, structs: LanguageWriter) {
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

    private printStructField(structs: LanguageWriter, field: FieldRecord) {
        const prefix = field.optional ? PrimitiveType.OptionalPrefix : ""
        let name = this.computeTargetName(field.declaration, false)
        if (field.optional) {
            name = cleanPrefix(name, PrimitiveType.Prefix)
        }
        const cKind = field.optional ? "" : this.cFieldKind(field.declaration)
        structs.print(`${cKind}${prefix}${name} ${structs.escapeKeyword(field.name)};`)
    }

    allOptionalTypes(): Set<string> {
        const seenNames = new Set<string>()
        seenNames.clear()
        for (let target of this.orderedDependencies) {
            if (target instanceof PointerType) continue
            let nameAssigned = this.computeTargetName(target, false)
            if (nameAssigned === PrimitiveType.Tag.getText(this)) {
                continue
            }
            if (!nameAssigned) {
                throw new Error(`No assigned name for ${(target as ts.TypeNode).getText()} shall be ${this.computeTargetName(target, false)}`)
            }
            if (seenNames.has(nameAssigned)) continue
            const nameOptional = PrimitiveType.OptionalPrefix + cleanPrefix(nameAssigned, PrimitiveType.Prefix)
            seenNames.add(nameOptional)
        }
        return seenNames
    }

    allLiteralTypes(): Map<string, string[]> {
        const literals = new Map<string, string[]>()
        for (let target of this.orderedDependencies) {

            let nameAssigned = this.computeTargetName(target, false)
            if (nameAssigned === PrimitiveType.Tag.getText(this)) {
                continue
            }
            if (!nameAssigned) {
                throw new Error(`No assigned name for ${(target as ts.TypeNode).getText()} shall be ${this.computeTargetName(target, false)}`)
            }
            if (literals.has(nameAssigned)) continue
            if (nameAssigned.startsWith("Literal_")) {
                const fields = this.targetStruct(target).getFields()
                literals.set(nameAssigned, fields.map(it => it.name))
            }

        }
        return literals
    }

    allUnionTypes() {

        type Selector = {
            id: number;
            name: string;
        }

        const unions = new Map<string, Selector[]>()
        for (let target of this.orderedDependencies) {
            let nameAssigned = this.computeTargetName(target, false)
            if (nameAssigned === PrimitiveType.Tag.getText(this)) {
                continue
            }
            if (!nameAssigned) {
                throw new Error(`No assigned name for ${(target as ts.TypeNode).getText()} shall be ${this.computeTargetName(target, false)}`)
            }

            if (this.isMaybeWrapped(target, ts.isUnionTypeNode)) {
                unions.set(nameAssigned,
                    this.targetStruct(target).getFields().slice(1).map((field, index) => {
                        return { id: index, name: field.name }
                    }))
            }
        }
        return unions
    }

    private generateOptional(structs: LanguageWriter, writeToString: LanguageWriter, target: DeclarationTarget, elemName: string, seenNames: Set<string>) {
        const nameOptional = PrimitiveType.OptionalPrefix + cleanPrefix(elemName, PrimitiveType.Prefix)
        if (!seenNames.has(nameOptional)) {
            seenNames.add(nameOptional)
            structs.print(`typedef struct ${nameOptional} {`)
            structs.pushIndent()
            structs.print(`enum ${PrimitiveType.Tag.getText()} tag;`)
            structs.print(`${this.cFieldKind(target)} ${elemName} value;`)
            structs.popIndent()
            structs.print(`} ${nameOptional};`)
            this.writeOptional(nameOptional, writeToString, this.isPointerDeclaration(target))
            this.writeRuntimeType(target, nameOptional, true, writeToString)
        }
    }

    private generateEnum(structs: LanguageWriter, writeToString: LanguageWriter, target: ts.EnumDeclaration) {
        const enumName = this.enumName(target.name)
        structs.print(`enum ${enumName}`)
        structs.print(`{`)
        structs.pushIndent()
        const enumValues = nameEnumValues(target)
        const enumPrefix = camelCaseToUpperSnakeCase(enumName)
        target.members.forEach((it, index) => {
            let initializer = ""
            if (it.initializer && ts.isNumericLiteral(it.initializer)) {
                initializer = ` = ${it.initializer.getText()}`
            }
            structs.print(`${enumPrefix}_${enumValues[index]}${initializer},`)
        })
        structs.popIndent()
        structs.print(`};`)

        writeToString.print(`inline void WriteToString(string* result, enum ${enumName} value) {`)
        writeToString.pushIndent()
        writeToString.print(`result->append("${enumName}(");`)
        writeToString.print(`WriteToString(result, (${PrimitiveType.Int32.getText()}) value);`)
        writeToString.print(`result->append(")");`)
        writeToString.popIndent()
        writeToString.print(`}`)

        writeToString.print(`template <>`)
        writeToString.print(`inline Ark_RuntimeType runtimeType(const enum ${enumName}& value) {`)
        writeToString.pushIndent()
        writeToString.print(`return ARK_RUNTIME_NUMBER;`)
        writeToString.popIndent()
        writeToString.print(`}`)
    }

    generateStructs(structs: LanguageWriter, typedefs: IndentedPrinter, writeToString: LanguageWriter) {
        const seenNames = new Set<string>()
        seenNames.clear()
        let noDeclaration = [PrimitiveType.Int32, PrimitiveType.Tag, PrimitiveType.Number, PrimitiveType.Boolean, PrimitiveType.String]
        for (let target of this.orderedDependencies) {
            let nameAssigned = this.computeTargetName(target, false)
            if (nameAssigned === PrimitiveType.Tag.getText(this)) {
                continue
            }
            if (!nameAssigned) {
                throw new Error(`No assigned name for ${(target as ts.TypeNode).getText()} shall be ${this.computeTargetName(target, false)}`)
            }
            if (seenNames.has(nameAssigned)) continue
            seenNames.add(nameAssigned)
            let isPointer = this.isPointerDeclaration(target)
            let isAccessor = checkDeclarationTargetMaterialized(target)
            let noBasicDecl = isAccessor || (target instanceof PrimitiveType && noDeclaration.includes(target))
            const nameOptional = PrimitiveType.OptionalPrefix + cleanPrefix(nameAssigned, PrimitiveType.Prefix)
            let isUnion = this.isMaybeWrapped(target, ts.isUnionTypeNode)
            if (!(target instanceof PrimitiveType) && ts.isEnumDeclaration(target)) {
                this.generateEnum(structs, writeToString, target)
                this.generateOptional(structs, writeToString, target, this.enumName(target.name), seenNames)
                continue
            }
            const structDescriptor = this.targetStruct(target)
            if (!noBasicDecl && !this.ignoreTarget(target)) {

                // TODO: fix it to define array type after its elements types
                if (nameAssigned === `Array_GestureRecognizer`) {
                    structs.print(`typedef Ark_Materialized ${PrimitiveType.Prefix}GestureRecognizer;`)
                }

                this.printStructsCHead(nameAssigned, structDescriptor, structs, writeToString, seenNames)
                if (isUnion) {
                    const selector = structDescriptor.getFields().find(value => {return value.name === "selector"})
                    if (selector) {
                        this.printStructField(structs, selector)
                    }
                    structs.print("union {")
                    structs.pushIndent()
                    structDescriptor.getFields().filter(value => value.name !== "selector")
                        .forEach(it => this.printStructField(structs, it))
                    structs.popIndent()
                    structs.print("};")
                } else {
                    if (structDescriptor.getFields().length === 0) {
                        structs.print(`void *handle;`)
                    }
                    structDescriptor.getFields().forEach(it => this.printStructField(structs, it))
                }
                this.printStructsCTail(nameAssigned, structDescriptor.isPacked, structs)
            }
            if (isAccessor) {
                structs.print(`typedef Ark_Materialized ${nameAssigned};`)
            }
            let skipWriteToString = (target instanceof PrimitiveType) || ts.isEnumDeclaration(target) || ts.isFunctionTypeNode(target)
            if (!noBasicDecl && !skipWriteToString) {
                this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
            }
            this.writeRuntimeType(target, nameAssigned, false, writeToString)
            if (seenNames.has(nameOptional)) continue
            seenNames.add(nameOptional)
            if (!(target instanceof PointerType) && nameAssigned != "Optional" && nameAssigned != "RelativeIndexable") {
                this.printStructsCHead(nameOptional, structDescriptor, structs, writeToString, seenNames)
                structs.print(`enum ${PrimitiveType.Tag.getText()} tag;`)
                structs.print(`${nameAssigned} value;`)
                this.printStructsCTail(nameOptional, structDescriptor.isPacked, structs)
                this.writeOptional(nameOptional, writeToString, isPointer)
                this.writeRuntimeType(target, nameOptional, true, writeToString)
            }
        }
        for (let declarationTarget of this.typeMap.values()) {
            let target = declarationTarget[0]
            let aliasNames = declarationTarget[1]
            let declarationName = this.computeTargetName(target, false)
            aliasNames.forEach(aliasName => this.addNameAlias(target, declarationName, aliasName, seenNames, typedefs))
        }
        // TODO: hack, remove me!
        typedefs.print(`typedef ${PrimitiveType.OptionalPrefix}Length ${PrimitiveType.OptionalPrefix}Dimension;`)
    }

    private writeRuntimeType(target: DeclarationTarget, targetTypeName: string, isOptional: boolean, writer: LanguageWriter) {
        const resultType = new Type("Ark_RuntimeType")
        const op = this.writeRuntimeTypeOp(target, targetTypeName, resultType, isOptional, writer)
        if (op) {
            writer.print("template <>")
            writer.writeMethodImplementation(
                new Method("runtimeType",
                    new NamedMethodSignature(resultType, [new Type(`const ${targetTypeName}&`)], ["value"]),
                    [MethodModifier.INLINE]),
                op)
        }
    }

    private writeRuntimeTypeOp(
        target: DeclarationTarget, targetTypeName: string, resultType: Type, isOptional: boolean, writer: LanguageWriter
    ) : ((writer: LanguageWriter) => void) | undefined
    {
        let result: LanguageExpression
        if (isOptional) {
            result = writer.makeTernary(writer.makeDefinedCheck("value.tag"),
                writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeRuntimeType(RuntimeType.UNDEFINED))
        } else if (target instanceof PointerType) {
            return
        } else if (target instanceof PrimitiveType) {
            switch (target) {
                case PrimitiveType.Boolean:
                    result = writer.makeRuntimeType(RuntimeType.BOOLEAN)
                    break
                case PrimitiveType.CustomObject:
                case PrimitiveType.Materialized:
                case PrimitiveType.NativePointer:
                case PrimitiveType.Tag:
                    return undefined
                case PrimitiveType.Function:
                    result = writer.makeRuntimeType(RuntimeType.FUNCTION)
                    break
                case PrimitiveType.Int32:
                case PrimitiveType.Number:
                    result = writer.makeRuntimeType(RuntimeType.NUMBER)
                    break
                case PrimitiveType.Length:
                    result = writer.makeCast(writer.makeString("value.type"), resultType)
                    break
                case PrimitiveType.String:
                    result = writer.makeRuntimeType(RuntimeType.STRING)
                    break
                case PrimitiveType.Undefined:
                    result = writer.makeRuntimeType(RuntimeType.UNDEFINED)
                    break
                default:
                    throw new Error(`Unexpected PrimitiveType ${target.getText()}`)
            }
        } else if (ts.isEnumDeclaration(target)) {
            result = writer.makeRuntimeType(RuntimeType.NUMBER)
        } else if (checkDeclarationTargetMaterialized(target)) {
            return undefined
        } else if (ts.isOptionalTypeNode(target)) {
            result = writer.makeTernary(writer.makeDefinedCheck("value.tag"),
                writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeRuntimeType(RuntimeType.UNDEFINED))
        } else if (ts.isUnionTypeNode(target)) {
            return writer => {
                writer.print("switch (value.selector) {")
                writer.pushIndent()
                for (let i = 0; i < target.types.length; i++) {
                    writer.print(`case ${i}: return runtimeType(value.value${i});`)
                }
                writer.print(`default: throw "Bad selector in ${targetTypeName}: " + std::to_string(value.selector);`)
                writer.popIndent()
                writer.print("}")
            }
        } else {
            result = writer.makeRuntimeType(RuntimeType.OBJECT)
        }
        return writer => writer.writeStatement(writer.makeReturn(result))
    }

    private addNameAlias(target: DeclarationTarget, declarationName: string, aliasName: string,
        seenNames: Set<string>, typedefs: IndentedPrinter
    ): void {
        if (seenNames.has(aliasName)) return
        if (this.ignoreTarget(target) && target != PrimitiveType.CustomObject) return
        seenNames.add(aliasName)
        typedefs.print(`typedef ${declarationName} ${aliasName};`)
        // TODO: hacky
        aliasName = cleanPrefix(aliasName, PrimitiveType.Prefix)
        let optAliasName = `${PrimitiveType.OptionalPrefix}${aliasName}`
        if (!declarationName.startsWith(PrimitiveType.OptionalPrefix) && !seenNames.has(optAliasName)) {
            seenNames.add(optAliasName)
            declarationName = cleanPrefix(declarationName, PrimitiveType.Prefix)
            typedefs.print(`typedef ${PrimitiveType.OptionalPrefix}${declarationName} ${optAliasName};`)
        }
    }

    cFieldKind(declaration: DeclarationTarget): string {
        if (declaration instanceof PointerType) return this.cFieldKind(declaration.pointed)
        if (declaration instanceof PrimitiveType) return ""
        if (ts.isEnumDeclaration(declaration)) return "enum "
        if (ts.isImportTypeNode(declaration)) return ""
        if (checkDeclarationTargetMaterialized(declaration)) return ""
        return `struct `
    }

    writeOptional(nameOptional: string, printer: LanguageWriter, isPointer: boolean) {
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${nameOptional}* value) {`)
        printer.print(`result->append("{.tag=");`)
        printer.print(`result->append(tagNameExact((${PrimitiveType.Tag.getText()})(value->tag)));`)
        printer.print(`result->append(", .value=");`)
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
        printer.popIndent()
        printer.print(`result->append("}");`)
        printer.print(`}`)
    }

    writeOptionalConvertor(nameOptional: string, printer: LanguageWriter, isPointer: boolean) {
        printer.print(`template <>`)
        printer.print(`inline void convertor(const ${nameOptional}* value) {`)
        printer.pushIndent()
        printer.print(`if (value->tag != ${PrimitiveType.UndefinedTag}) {`)
        printer.pushIndent()
        printer.print(`convertor(${isPointer ? "&" : ""}value->value);`)
        printer.popIndent()
        printer.print(`} else {`)
        printer.pushIndent()
        printer.print(`${PrimitiveType.Undefined.getText()} undefined = { 0 };`)
        printer.print(`convertor(undefined);`)
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`}`)
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

    private generateArrayWriteToString(name: string, target: DeclarationTarget, printer: LanguageWriter) {
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

        printer.print(
`
template <>
inline void WriteToString(string* result, const ${elementNativeType}${isPointerField ? "*" : ""} value);

inline void WriteToString(string* result, const ${name}* value) {
    int32_t count = value->length;

    result->append("{.array=allocArray<${elementNativeType}, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, ${constCast}${isPointerField ? "&" : ""}value->array[i]);
    }
    result->append("}})");

    result->append(", .length=");
    result->append(std::to_string(value->length));

    result->append("}");
}
`)
    }

    private generateMapWriteToString(name: string, target: DeclarationTarget, printer: LanguageWriter) {
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
        printer.print(`result->append("{");`)
        printer.print(`int32_t count = value->size;`)
        printer.print(`for (int i = 0; i < count; i++) {`)
        printer.pushIndent()
        printer.print(`if (i > 0) result->append(", ");`)
        printer.print(`WriteToString(result, ${keyConstCast}${isPointerKeyField ? "&" : ""}value->keys[i]);`)
        printer.print(`result->append(": ");`)
        printer.print(`WriteToString(result, ${valueConstCast}${isPointerValueField ? "&" : ""}value->values[i]);`)
        printer.popIndent()
        printer.print(`}`)
        printer.print(`result->append("}");`)
        printer.popIndent()
        printer.print(`}`)
    }

    private generateWriteToString(name: string, target: DeclarationTarget, printer: LanguageWriter, isPointer: boolean) {
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
                printer.print(`result->append("{");`);
                printer.print(`result->append(".selector=");`)
                printer.print(`result->append(std::to_string(value->selector));`);
                printer.print(`result->append(", ");`);
                this.targetStruct(target).getFields().forEach((field, index) => {
                    const fieldName = printer.escapeKeyword(field.name)
                    const isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    if (index != 0) printer.print(`// ${this.computeTargetName(field.declaration, false)}`)
                    printer.print(`if (value${access}selector == ${index - 1}) {`)
                    printer.pushIndent()
                    printer.print(`result->append(".${fieldName}=");`);
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${fieldName});`)
                    printer.popIndent()
                    printer.print(`}`)
                })
                if (false) {
                    printer.print(`result->append(" /* ${name} [variant ");`)
                    printer.print(`result->append(std::to_string(value${access}selector));`)
                    printer.print(`result->append("]*/");`)
                }
                printer.print(`result->append("}");`);
            } else if (isTuple) {
                printer.print(`result->append("{");`)
                const fields = this.targetStruct(target).getFields()
                fields.forEach((field, index) => {
                    const fieldName = printer.escapeKeyword(field.name)
                    printer.print(`// ${this.computeTargetName(field.declaration, false)}`)
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    if (index > 0) printer.print(`result->append(", ");`)
                    printer.print(`result->append(".${fieldName}=");`)
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${fieldName});`)
                })
                printer.print(`result->append("}");`)
            } else if (isOptional) {
                printer.print(`result->append("{");`)
                const fields = this.targetStruct(target).getFields()
                fields.forEach((field, index) => {
                    const fieldName = printer.escapeKeyword(field.name)
                    printer.print(`// ${this.computeTargetName(field.declaration, false)}`)
                    if (index > 0) printer.print(`result->append(", ");`)
                    printer.print(`result->append("${fieldName}: ");`)
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${fieldName});`)
                    if (index == 0) {
                        printer.print(`if (value${access}${fieldName} != ${PrimitiveType.UndefinedTag}) {`)
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
                    const fieldName = printer.escapeKeyword(field.name)
                    printer.print(`// ${this.computeTargetName(field.declaration, false)}`)
                    if (index > 0) printer.print(`result->append(", ");`)
                    printer.print(`result->append(".${fieldName}=");`)
                    let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${fieldName});`)
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
                extractBuilderFields(clazz, this).forEach(field => {
                    result.addField(field)
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

    private ignoreTarget(target: DeclarationTarget): target is PrimitiveType | ts.EnumDeclaration {
        const name = this.computeTargetName(target, false)
        if (PeerGeneratorConfig.ignoreSerialization.includes(name)) return true
        if (target instanceof PrimitiveType) return true
        if (ts.isEnumDeclaration(target)) return true
        if (ts.isFunctionTypeNode(target)) return true
        if (ts.isImportTypeNode(target)) return true
        if (ts.isTemplateLiteralTypeNode(target)) return true
        return false
    }

    private isStringEnum(members: NodeArray<EnumMember>): boolean {
        return members.find((value) => {
            return value.initializer && ts.isStringLiteral(value.initializer)
        }) != undefined
    }
}

class ToDeclarationTargetConvertor implements TypeNodeConvertor<DeclarationTarget> {
    constructor(
        private readonly table: DeclarationTable,
    ) {}

    convertUnion(node: ts.UnionTypeNode): DeclarationTarget {
        return node
    }
    convertTypeLiteral(node: ts.TypeLiteralNode): DeclarationTarget {
        return node
    }
    convertLiteralType(node: ts.LiteralTypeNode): DeclarationTarget {
        return node
    }
    convertTuple(node: ts.TupleTypeNode): DeclarationTarget {
        return node
    }
    convertNamedTupleMember(node: ts.NamedTupleMember): DeclarationTarget {
        return node
    }
    convertArray(node: ts.ArrayTypeNode): DeclarationTarget {
        return node
    }
    convertOptional(node: ts.OptionalTypeNode): DeclarationTarget {
        return node
    }
    convertFunction(node: ts.FunctionTypeNode): DeclarationTarget {
        return node
    }
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): DeclarationTarget {
        return node
    }
    convertImport(node: ts.ImportTypeNode): DeclarationTarget {
        let name = identName(node.qualifier)!
        switch (name) {
            case "Resource": return ResourceDeclaration
            case "Callback": return PrimitiveType.Function
            default: return PrimitiveType.CustomObject
        }
    }
    convertTypeReference(node: ts.TypeReferenceNode): DeclarationTarget {
        let name = identName(node)
        switch (name) {
            case `Dimension`: case `Length`: return PrimitiveType.Length
            case `AnimationRange`: return PrimitiveType.CustomObject
            case `ContentModifier`: return PrimitiveType.CustomObject
            case `Date`: return PrimitiveType.CustomObject
            // stub required to compile arkoala patched sdk
            case `Function`: return PrimitiveType.Function
        }
        // Types with type arguments are declarations!
        if (node.typeArguments) {
            return node
        }

        let declarations = getDeclarationsByNode(this.table.typeChecker!, node.typeName)
        if (declarations.length == 0) {
            throw new Error(`No declaration for ${node.getText()} ${asString(node)}`)
        }
        let declaration = declarations[0]
        if (PeerGeneratorConfig.isConflictedDeclaration(declaration))
            return PrimitiveType.CustomObject
        if (ts.isTypeAliasDeclaration(declaration)) {
            const node = declaration.type
            let name = identName(declaration.name)
            if (name === "GestureType")
                name = PrimitiveType.Prefix + name
            this.table.requestType(name, node, false)
            return convertTypeNode(this, node)
        }
        if (ts.isEnumMember(declaration)) {
            return declaration.parent
        }
        if (ts.isTypeParameterDeclaration(declaration)) {
            return PrimitiveType.CustomObject
        }
        if (ts.isClassDeclaration(declaration) ||
            ts.isInterfaceDeclaration(declaration) ||
            ts.isEnumDeclaration(declaration))
            return declaration
        throw new Error(`Unknown declaration type ${ts.SyntaxKind[declaration.kind]}`)
    }
    convertParenthesized(node: ts.ParenthesizedTypeNode): DeclarationTarget {
        return convertTypeNode(this, node.type)
    }
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): DeclarationTarget {
        return PrimitiveType.CustomObject
    }
    convertStringKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.String
    }
    convertNumberKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.Number
    }
    convertBooleanKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.Boolean
    }
    convertUndefinedKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.Undefined
    }
    convertVoidKeyword(node: ts.TypeNode): DeclarationTarget {
        // TODO: shall it be distinct type.
        return PrimitiveType.Undefined
    }
    convertObjectKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.CustomObject
    }
    convertAnyKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.CustomObject
    }
    convertUnknownKeyword(node: ts.TypeNode): DeclarationTarget {
        return PrimitiveType.CustomObject
    }
}

function isCallback(type: ts.TypeNode, table: DeclarationTable): boolean {
    /*
        const m = type.parent.parent
        if (ts.isMethodDeclaration(m)) {
            const c = m.parent
            if (ts.isClassDeclaration(c) && !isCommonMethodOrSubclass(table.typeChecker!, c)) {
                return true
            }
        }
    */
    return false
}
