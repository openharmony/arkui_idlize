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
import { asString, getDeclarationsByNode, getLineNumberString, getNameWithoutQualifiersRight, heritageDeclarations, identName, isStatic, throwException, typeEntityName } from "../util"
import { IndentedPrinter } from "../IndentedPrinter"
import { PeerGeneratorConfig } from "./PeerGeneratorConfig"
import {
    AggregateConvertor, ArgConvertor, ArrayConvertor, BooleanConvertor, CustomTypeConvertor,
    EnumConvertor, FunctionConvertor, ImportTypeConvertor, InterfaceConvertor, LengthConvertor,
    NumberConvertor, OptionConvertor, PredefinedConvertor, StringConvertor, TupleConvertor, TypeAliasConvertor,
    UndefinedConvertor, UnionConvertor
} from "./Convertors"
import { DependencySorter } from "./DependencySorter"

export class PrimitiveType {
    constructor(private name: string, public isPointer = false) { }
    getText(table: DeclarationTable): string { return this.name }
    static String = new PrimitiveType("String", true)
    static Number = new PrimitiveType("Number")
    static Int32 = new PrimitiveType("int32_t")
    static Tag = new PrimitiveType("Tags")
    static Boolean = new PrimitiveType("Boolean")
    static Function = new PrimitiveType("Function")
    static Undefined = new PrimitiveType("Undefined")
    static Length = new PrimitiveType("Length", true)
    static CustomObject = new PrimitiveType("CustomObject", true)
    private static pointersMap = new Map<DeclarationTarget, PointerType>()
    static pointerTo(target: DeclarationTarget) {
        if (PrimitiveType.pointersMap.has(target)) return PrimitiveType.pointersMap.get(target)!
        let result = new PointerType(target)
        PrimitiveType.pointersMap.set(target, result)
        return result
    }
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
    | ts.TemplateLiteralTypeNode
    | ts.ArrayTypeNode | ts.ParenthesizedTypeNode | ts.OptionalTypeNode | ts.LiteralTypeNode
    | PrimitiveType

class FieldRecord {
    constructor(public declaration: DeclarationTarget, public type: ts.TypeNode | undefined, public name: string, public optional: boolean = false) { }
}

class StructDescriptor {
    supers: DeclarationTarget[] = []
    private fields: FieldRecord[] = []
    packed: boolean = false
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

class PendingTypeRequest {
    constructor(public name: string, public type: ts.TypeNode | undefined) { }
}

export class DeclarationTable {
    private declarations = new Set<DeclarationTarget>()
    typeMap = new Map<ts.TypeNode, [DeclarationTarget, string]>()
    typeChecker: ts.TypeChecker | undefined = undefined

    getTypeName(type: ts.TypeNode, optional: boolean = false) {
        let declaration = this.typeMap.get(type)
        this.requestType(undefined, type)
        declaration = this.typeMap.get(type)!
        let prefix = optional ? "Optional_" : ""
        return prefix + declaration[1]
    }

    requestType(name: string | undefined, type: ts.TypeNode) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            //if (name && name != declaration[1]) throw new Error(`Mismatch of names${optional ? "[optional]" : ""}: ${name} ${declaration[1]}`)
            return
        }
        name = this.computeTypeName(name, type, false)

        let target = this.toTarget(type)
        if (!target) throw new Error(`Cannot find declaration: ${type.getText()}`)
        this.typeMap.set(type, [target, name])
    }

    private isDeclarationTarget(type: ts.TypeNode): boolean {
        if (ts.isUnionTypeNode(type)) return true
        if (ts.isTypeLiteralNode(type)) return true
        if (ts.isLiteralTypeNode(type)) return true
        if (ts.isImportTypeNode(type)) return true
        if (ts.isTupleTypeNode(type)) return true
        if (ts.isArrayTypeNode(type)) return true
        if (ts.isOptionalTypeNode(type)) return true
        if (ts.isParenthesizedTypeNode(type)) return true
        if (ts.isTemplateLiteralTypeNode(type)) return true
        if (ts.isFunctionTypeNode(type)) return true
        if (ts.isTypeParameterDeclaration(type)) return true
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
        if (ts.isTypeReferenceNode(node)) {
            if (identName(node) == "Length") return PrimitiveType.Length
            if (identName(node) == "ParticleConfigs") return PrimitiveType.CustomObject
            let orig = node
            let declarations = getDeclarationsByNode(this.typeChecker!, node.typeName)
            while (declarations.length > 0 && ts.isTypeAliasDeclaration(declarations[0])) {
                node = declarations[0].type
                if (this.isDeclarationTarget(node)) return node as DeclarationTarget
                if (ts.isTypeReferenceNode(node)) return this.toTarget(node)
                declarations = getDeclarationsByNode(this.typeChecker!, node)
            }
            if (declarations.length == 0) {
                throw new Error(`No declaration for ${node.getText()} ${asString(orig)}`)
            }
            let declaration = declarations[0]
            if (ts.isEnumMember(declaration)) {
                return declaration.parent
            }
            return declaration as DeclarationTarget
        }
        if (ts.isIndexedAccessTypeNode(node)) {
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
        throw new Error(`Unknown ${node.getText()}: ${ts.SyntaxKind[node.kind]} in ${asString(node.parent)}`)
    }

    computeTargetName(target: DeclarationTarget, optional: boolean): string {
        let name = this.computeTargetNameImpl(target, optional)
        this.addDeclaration(target)
        if (!(target instanceof PrimitiveType) && (
            !ts.isInterfaceDeclaration(target) && !ts.isClassDeclaration(target) && !ts.isEnumDeclaration(target))
        ) {
            this.pendingRequests.push(new PendingTypeRequest(name, target))
        }
        return name
    }

    computeTargetNameImpl(target: DeclarationTarget, optional: boolean): string {
        const prefix = optional ? "Optional_" : ""
        if (target instanceof PrimitiveType) {
            return prefix + target.getText(this)
        }
        if (ts.isTypeLiteralNode(target)) {
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
                return prefix + `String`
            }
            if (ts.isNumericLiteral(literal)) {
                return prefix + `Number`
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return `Undefined`
            }
        }
        if (ts.isTemplateLiteralTypeNode(target)) {
            // TODO: likley incorrect
            return prefix + `String`
        }
        if (ts.isTypeParameterDeclaration(target)) {
            // TODO: likley incorrect
            return prefix + `CustomObject`
        }
        if (ts.isEnumDeclaration(target)) {
            return prefix + identName(target.name)
        }
        if (ts.isUnionTypeNode(target)) {
            return prefix + `Union_${target.types.map(it => this.computeTargetName(this.toTarget(it), false)).join("_")}`
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            return prefix + identName(target.name)
        }
        if (ts.isFunctionTypeNode(target)) {
            return prefix + "Function"
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
            // return prefix + identName(target.qualifier)!
            return PrimitiveType.CustomObject.getText(this)
        }
        if (ts.isOptionalTypeNode(target)) {
            let name = this.computeTargetName(this.toTarget(target.type), false)
            return `Optional_${name}`
        }
        if (ts.isParenthesizedTypeNode(target)) {
            return this.computeTargetName(this.toTarget(target.type), optional)
        }
        if (ts.isEnumMember(target)) {
            return this.computeTargetName((target as any).parent as DeclarationTarget, optional)
        }
        throw new Error(`Cannot compute target name: ${(target as any).getText()} ${(target as any).kind}`)
    }

    private computeTypeNameImpl(suggestedName: string | undefined, type: ts.TypeNode, optional: boolean): string {
        const prefix = optional ? "Optional_" : ""
        if (ts.isImportTypeNode(type)) {
            return prefix + identName(type.qualifier)!
        }
        if (ts.isTypeReferenceNode(type)) {
            const typeName = identName(type.typeName)
            if (typeName === "Array") {
                const elementTypeName = this.computeTypeNameImpl(undefined, type.typeArguments![0], false)
                return `${prefix}Array_${elementTypeName}`
            }
            return prefix + identName(type.typeName)!
        }
        if (ts.isUnionTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Union_${type.types.map(it => this.computeTypeNameImpl(undefined, it, optional)).join("_")}`
        }
        if (ts.isOptionalTypeNode(type)) {
            if (suggestedName) return suggestedName
            return "Optional_" + this.computeTypeNameImpl(undefined, type.type, false)
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
                return `String`
            }
            if (ts.isNumericLiteral(literal)) {
                return `Number`
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                return `Undefined`
            }
            throw new Error(`Unknown literal type: ${type.getText()}`)
        }
        if (ts.isTemplateLiteralTypeNode(type)) {
            return prefix + `String`
        }
        if (ts.isFunctionTypeNode(type)) {
            return prefix + "Function"
        }
        if (ts.isArrayTypeNode(type)) {
            if (suggestedName) return suggestedName
            return prefix + `Array_` + this.computeTypeNameImpl(undefined, type.elementType, false)
        }
        if (type.kind == ts.SyntaxKind.NumberKeyword) {
            return prefix + `Number`
        }
        if (type.kind == ts.SyntaxKind.UndefinedKeyword) {
            return `Undefined`
        }
        if (type.kind == ts.SyntaxKind.NullKeyword) {
            return `Undefined`
        }
        if (type.kind == ts.SyntaxKind.VoidKeyword) {
            return `Undefined`
        }
        if (type.kind == ts.SyntaxKind.StringKeyword) {
            return prefix + `String`
        }
        if (type.kind == ts.SyntaxKind.BooleanKeyword) {
            return prefix + `Boolean`
        }
        if (type.kind == ts.SyntaxKind.ObjectKeyword) {
            return prefix + `CustomObject`
        }
        if (type.kind == ts.SyntaxKind.AnyKeyword) {
            return prefix + `CustomObject`
        }
        if (ts.isTypeParameterDeclaration(type)) {
            return prefix + `CustomObject`
        }
        if (ts.isIndexedAccessTypeNode(type)) {
            return prefix + `CustomObject`
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

    typeConvertor(param: string, type: ts.TypeNode, isOptionalParam = false): ArgConvertor {
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
            return new ImportTypeConvertor(param, this, type)
        }
        if (ts.isTypeReferenceNode(type)) {
            const declaration = getDeclarationsByNode(this.typeChecker!, type.typeName)[0]
            return this.declarationConvertor(param, type, declaration)
        }
        if (ts.isEnumMember(type)) {
            return new EnumConvertor(param, this)
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

    customConvertor(typeName: ts.EntityName | undefined, param: string, type: ts.TypeReferenceNode | ts.ImportTypeNode): ArgConvertor | undefined {
        let name = getNameWithoutQualifiersRight(typeName)
        if (name === "Length") return new LengthConvertor(param)
        if (name === "AnimationRange")
            return new PredefinedConvertor(param, "AnimationRange<number>", "AnimationRange", "Compound<Number, Number>")
        if (name === "AttributeModifier")
            return new PredefinedConvertor(param, "AttributeModifier<any>", "AttributeModifier", "CustomObject")
        if (name === "ContentModifier")
            return new PredefinedConvertor(param, "ContentModifier<any>", "ContentModifier", "CustomObject")
        if (name === "Array")
            return new ArrayConvertor(param, this, type, type.typeArguments![0])
        if (name === "Callback")
            return new CustomTypeConvertor(param, "Callback")
        if (name === "Optional" && type.typeArguments && type.typeArguments.length == 1) {
            return new OptionConvertor(param, this, type.typeArguments![0])
            //throwException(asString(type.typeArguments![0]))
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
        const declarationName = ts.idText(declaration.name as ts.Identifier)

        let customConvertor = this.customConvertor(entityName, param, type)
        if (customConvertor) {
            return customConvertor
        }
        if (ts.isTypeReferenceNode(type) && entityName && ts.isQualifiedName(entityName)) {
            const typeOuter = ts.factory.createTypeReferenceNode(entityName.left)
            return this.declarationConvertor(param, typeOuter, declaration)
        }
        if (ts.isEnumDeclaration(declaration)) {
            return new EnumConvertor(param, this)
        }
        if (ts.isEnumMember(declaration)) {
            return new EnumConvertor(param, this)
        }
        if (ts.isTypeAliasDeclaration(declaration)) {
            this.requestType(declarationName, type)
            return new TypeAliasConvertor(param, this, declaration)
        }
        if (ts.isInterfaceDeclaration(declaration)) {
            return new InterfaceConvertor(declarationName, param, this, type)
        }
        if (ts.isClassDeclaration(declaration)) {
            return new InterfaceConvertor(declarationName, param, this, type)
        }
        if (ts.isTypeParameterDeclaration(declaration)) {
            return new CustomTypeConvertor(param, identName(declaration.name)!)
        }
        console.log(`${declaration.getText()}`)
        throw new Error(`Unknown kind: ${declaration.kind}`)
    }

    private noUniqueNamedFields(declaration: DeclarationTarget): boolean {
        let struct = this.targetStruct(declaration)
        if (declaration instanceof PrimitiveType) return true
        if (!ts.isInterfaceDeclaration(declaration)
            && !ts.isClassDeclaration(declaration)
            && !ts.isTypeLiteralNode(declaration)) return true
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

    private uniqueName(target: DeclarationTarget): string {
        if (target instanceof PrimitiveType) return target.getText(this)
        return this.uniqueNames.get(target)!
    }

    generateDeserializers(printer: IndentedPrinter, structs: IndentedPrinter, typedefs: IndentedPrinter, writeToString: IndentedPrinter) {
        this.processPendingRequests()
        let orderer = new DependencySorter(this)
        for (let declaration of this.declarations) {
            orderer.addDep(declaration)
        }
        let order = orderer.getToposorted()
        this.assignUniqueNames()
        let seenNames = new Set<string>()
        printer.print(`class Deserializer : public ArgDeserializerBase {`)
        printer.print(` public:`)
        printer.pushIndent()
        printer.print(`Deserializer(uint8_t *data, int32_t length) : ArgDeserializerBase(data, length) {}`)

        for (let declaration of order) {
            let name = this.uniqueNames.get(declaration)!
            if (seenNames.has(name)) continue
            seenNames.add(name)
            this.generateDeserializer(name, declaration, printer)
        }
        printer.popIndent()
        printer.print(`};`)
        seenNames.clear()
        let noDeclaration = [PrimitiveType.Int32, PrimitiveType.Tag, PrimitiveType.Number, PrimitiveType.Boolean]
        for (let target of order) {
            let noBasicDecl = (target instanceof PrimitiveType && noDeclaration.includes(target))
            let nameAssigned = this.uniqueNames.get(target)
            if (!nameAssigned) {
                throw new Error(`No assigned name for ${(target as ts.TypeNode).getText()} shall be ${this.computeTargetName(target, false)}`)
            }
            if (seenNames.has(nameAssigned)) continue
            seenNames.add(nameAssigned)
            let isPointer = this.isPointerDeclaration(target)
            let isEnum = !(target instanceof PrimitiveType) && ts.isEnumDeclaration(target)
            let nameOptional = "Optional_" + nameAssigned
            if (isEnum) {
                structs.print(`typedef int32_t ${nameAssigned};`)
                if (!seenNames.has(nameOptional)) {
                    seenNames.add(nameOptional)
                    structs.print(`typedef struct { int32_t tag; int32_t value; } ${nameOptional};`)
                    this.writeOptional(nameOptional, writeToString, isPointer)
                }
                continue
            }
            if (!noBasicDecl && !this.ignoreTarget(target, nameAssigned)) {
                structs.print(`typedef struct ${nameAssigned} {`)
                structs.pushIndent()
                this.targetStruct(target).getFields().forEach(it => structs.print(`${it.optional ? "Optional_" : ""}${this.uniqueName(it.declaration)} ${it.name};`))
                structs.popIndent()
                structs.print(`} ${nameAssigned};`)
            }
            if (!noBasicDecl && nameAssigned != "Length" && nameAssigned != "Function"  && nameAssigned != "Resource"
                && nameAssigned != "Array" && nameAssigned != "Optional" && nameAssigned != "RelativeIndexable"
                && nameAssigned != "CustomObject") {
                writeToString.print(`template <>`)
                writeToString.print(`inline void WriteToString(string* result, const ${nameAssigned}${isPointer ? "*" : ""} value) {`)
                writeToString.pushIndent()
                this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
                writeToString.popIndent()
                writeToString.print(`}`)
            }
            if (seenNames.has(nameOptional)) continue
            seenNames.add(nameOptional)
            if (!(target instanceof PointerType) && nameAssigned != "Optional" && nameAssigned != "RelativeIndexable") {
                structs.print(`typedef struct ${nameOptional} {`)
                structs.pushIndent()
                structs.print(`int32_t tag;`)
                structs.print(`${nameAssigned} value;`)
                structs.popIndent()
                structs.print(`} ${nameOptional};`)
                this.writeOptional(nameOptional, writeToString, isPointer)
            }
        }
        for (let declarationTarget of this.typeMap.values()) {
            let name = this.uniqueNames.get(declarationTarget[0])!
            if (seenNames.has(declarationTarget[1])) continue
            if (PeerGeneratorConfig.ignoreSerialization.includes(declarationTarget[1])) continue
            if (name.startsWith("Optional_")) continue
            if (name === PrimitiveType.CustomObject.getText(this)) continue
            seenNames.add(declarationTarget[1])
            typedefs.print(`typedef ${name} ${declarationTarget[1]};`)
            if (seenNames.has(`Optional_${name}`)) {
                typedefs.print(`typedef Optional_${name} Optional_${declarationTarget[1]};`)
            }
        }
    }

    writeOptional(nameOptional: string, printer: IndentedPrinter, isPointer: boolean) {
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${nameOptional}* value) {`)
        printer.pushIndent()
        printer.print(`result->append("${nameOptional} {");`)
        printer.print(`result->append("tag=");`)
        printer.print(`result->append(tagName((Tags)(value->tag)));`)
        printer.print(`if (value->tag != TAG_UNDEFINED) {`)
        printer.pushIndent()
        printer.print(`result->append(", value=");`)
        printer.print(`WriteToString(result, ${isPointer ? "&" : ""}value->value);`)
        printer.popIndent()
        printer.print(`}`)
        printer.print(`result->append("}");`)
        printer.popIndent()
        printer.print(`}`)
    }

    generateSerializers(printer: IndentedPrinter) {
        let seenNames = new Set<string>()
        printer.print(`export class Serializer extends SerializerBase {`)
        printer.pushIndent()
        for (let declaration of this.declarations) {
            let name = this.computeTargetName(declaration, false)
            if (seenNames.has(name)) continue
            seenNames.add(name)
            if (declaration instanceof PrimitiveType) continue
            if (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration))
                this.generateSerializer(name, declaration, printer)
        }
        printer.popIndent()
        printer.print(`}`)
    }

    private isMaybeWrapped(target: DeclarationTarget, predicate: (type: ts.Node) => boolean): boolean {
        if (target instanceof PrimitiveType) return false
        return predicate(target) ||
            ts.isParenthesizedTypeNode(target) &&
            this.isDeclarationTarget(target.type) &&
            predicate(target.type)
    }

    private generateWriteToString(name: string, target: DeclarationTarget, printer: IndentedPrinter, isPointer: boolean) {
        if (target instanceof PrimitiveType) return
        let isUnion = this.isMaybeWrapped(target, ts.isUnionTypeNode)
        let isArray = this.isMaybeWrapped(target, ts.isArrayTypeNode)
        let isOptional = this.isMaybeWrapped(target, ts.isOptionalTypeNode)
        let access = isPointer ? "->" : "."
        if (isUnion) {
            printer.print(`result->append("${name} [variant ");`)
            printer.print(`result->append(std::to_string(value${access}selector));`)
            printer.print(`result->append("] ");`)
            this.targetStruct(target).getFields().forEach((field, index) => {
                let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                printer.print(`if (value${access}selector == ${index - 1}) {`)
                printer.pushIndent()
                printer.print(`result->append("${field.name}=");`)
                printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                printer.popIndent()
                printer.print(`}`)
            })
        } else if (isArray) {
            let isPointerField = ts.isArrayTypeNode(target) ? this.typeConvertor("param", target.elementType).isPointerType() : false
            printer.print(`result->append("${name} {array_length=");`)
            printer.print(`WriteToString(result, value${access}array_length);`)
            printer.print(`result->append(", array=[");`)
            printer.print(`int32_t count = value${access}array_length > 5 ? 5 : value${access}array_length;`)
            printer.print(`for (int i = 0; i < count; i++) {`)
            printer.pushIndent()
            printer.print(`if (i > 0) result->append(", ");`)
            printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}array[i]);`)
            printer.popIndent()
            printer.print(`}`)
            printer.print(`if (count < value${access}array_length) result->append(", ...");`)
            printer.print(`result->append("]}");`)
        } else if (isOptional) {
            printer.print(`result->append("${name} {");`)
            const fields = this.targetStruct(target).getFields()
            fields.forEach((field, index) => {
                if (index > 0) printer.print(`result->append(", ");`)
                printer.print(`result->append("${field.name}=");`)
                let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                if (index == 0) {
                    printer.print(`if (value${access}${field.name} != TAG_UNDEFINED) {`)
                    printer.pushIndent()
                }
                if (index == fields.length - 1) {
                    printer.popIndent()
                    printer.print("}")
                }
            })
            printer.print(`result->append("}");`)
        } else {
            printer.print(`result->append("${name} {");`)
            this.targetStruct(target).getFields().forEach((field, index) => {
                if (index > 0) printer.print(`result->append(", ");`)
                printer.print(`result->append("${field.name}=");`)
                let isPointerField = this.isPointerDeclaration(field.declaration, field.optional)
                printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
            })
            printer.print(`result->append("}");`)
        }
    }

    private fieldsForClass(clazz: ts.ClassDeclaration | ts.InterfaceDeclaration, result: StructDescriptor) {
        clazz.heritageClauses?.forEach(it => {
            heritageDeclarations(this.typeChecker!, it).forEach(it => {
                if (ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it)) {
                    result.supers.push(it)
                    result.packed = true
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
        if (target instanceof PrimitiveType) {
            return result
        }
        else if (ts.isArrayTypeNode(target)) {
            // TODO: delay this computation.
            let element = this.toTarget(target.elementType)
            result.addField(new FieldRecord(PrimitiveType.pointerTo(element), target, "array"))
            result.addField(new FieldRecord(PrimitiveType.Int32, undefined, "array_length"))
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
            target
                .members
                .filter(ts.isPropertySignature)
                .forEach(it => {
                    result.addField(new FieldRecord(this.toTarget(it.type!), it.type, identName(it.name)!, it.questionToken != undefined))
                })
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

    private generateSerializer(name: string, target: DeclarationTarget, printer: IndentedPrinter) {
        if (this.ignoreTarget(target, name)) return
        printer.pushIndent()
        printer.print(`write${name}(value: ${this.translateSerializerType(name, target)}) {`)
        printer.pushIndent()
        printer.print(`const valueSerializer = this`)
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let struct = this.targetStruct(target)
            struct.getFields().forEach(it => {
                let field = `value_${it.name}`
                printer.print(`let ${field} = value.${it.name}`)
                let typeConvertor = this.typeConvertor(`value`, it.type!, it.optional)
                typeConvertor.convertorToTSSerial(`value`, field, printer)
            })
        } else {
            let typeConvertor = this.typeConvertor("value", target, false)
            typeConvertor.convertorToTSSerial(`value`, `value`, printer)
        }
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
    }

    private ignoreTarget(target: DeclarationTarget, name: string): target is PrimitiveType | ts.EnumDeclaration {
        if (PeerGeneratorConfig.ignoreSerialization.includes(name)) return true
        if (target instanceof PrimitiveType) return true
        if (ts.isEnumDeclaration(target)) return true
        return false
    }

    private generateDeserializer(name: string, target: DeclarationTarget, printer: IndentedPrinter) {
        if (this.ignoreTarget(target, name)) return
        printer.print(`${name} read${name}() {`)
        printer.pushIndent()
        printer.print(`Deserializer& valueDeserializer = *this;`)
        printer.print(`${name} value;`)
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let struct = this.targetStruct(target)
            struct.getFields().forEach(it => {
                let typeConvertor = this.typeConvertor(`value`, it.type!, it.optional)
                typeConvertor.convertorToCDeserial(`value`, `value.${it.name}`, printer)
            })
        } else {
            let typeConvertor = this.typeConvertor("value", target, false)
            typeConvertor.convertorToCDeserial(`value`, `value`, printer)
        }
        printer.print(`return value;`)
        printer.popIndent()
        printer.print(`}`)
    }
}
