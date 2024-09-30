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

import * as ts from 'typescript'
import { identName, Language } from '../../../util'
import { ExpressionStatement, FieldModifier, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, StringExpression, Type, createLanguageWriter } from '../../LanguageWriters'
import { SynthesizedTypesRegistry } from '../SynthesizedTypesRegistry'
import { ARK_OBJECTBASE, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, INT_VALUE_GETTER } from '../lang/Java'
import { TargetFile } from '../TargetFile'
import { DeclarationTable, DeclarationTarget } from '../../DeclarationTable'
import { ArkPrimitiveType } from "../../ArkPrimitiveType"
import { PeerGeneratorConfig } from '../../PeerGeneratorConfig'
import { ImportTable } from '../ImportTable'


function unsupportedType(type: string): Error {
    return new Error(`Unimplemented type in java: ${type}`)
}

type MemberInfo = {
    name: string,
    type: Type,
}

class CJType {
    // CJ type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: Type

    // synthetic identifier for internal use cases: naming classes/files etc. 
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional?: boolean): CJType {
        return new CJType(new Type(typeName, optional), typeName)
    }

    constructor(type: Type, alias: string) {
        this.type = type
        this.alias = alias
    }
}

export class CJSynthesizedTypesRegistry implements SynthesizedTypesRegistry {
    // maps type name in CJ (e.g. `Union_double_String`) to its definition (LanguageWriter containing `package X; class Union_double_String {...}`)
    private readonly types = new Map<Type, LanguageWriter>()
    
    constructor(private readonly table: DeclarationTable, private readonly imports: ImportTable) {}

    getDefinitions(): Map<TargetFile, string> {
        const result = new Map<TargetFile, string>()
        for (const [type, writer] of this.types) {
            result.set(
                new TargetFile(type.name, ''),
                writer.getOutput().join('\n')
            )
        }
        return result
    }

    getTargetType(target: DeclarationTarget, optional: boolean): Type {
        const CJType = this.computeCJType(target, optional)
        if (this.hasType(CJType.type)) {
            return CJType.type
        }

        if (target instanceof ArkPrimitiveType) {
            return CJType.type
        }

        if (ts.isUnionTypeNode(target)) {
            const writer = createLanguageWriter(Language.CJ)
            this.printPackage(writer)
            this.printUnionImplementation(target, CJType, writer)
            this.addType(CJType.type, writer)
        }
        else if (ts.isTupleTypeNode(target)) {
            const writer = createLanguageWriter(Language.CJ)
            this.printPackage(writer)
            this.printTupleImplementation(target, CJType, writer)
            this.addType(CJType.type, writer)
        }
        else if (ts.isOptionalTypeNode(target)) {
            this.getTargetType(this.toTarget(target.type), false)
        }
        if (ts.isEnumDeclaration(target)) {
            const writer = createLanguageWriter(Language.CJ)
            this.printPackage(writer)
            this.printEnumImplementation(target, CJType, writer)
            this.addType(CJType.type, writer)
        }
        if (ts.isArrayTypeNode(target)) {
            const subTypeTarget = this.toTarget(target.elementType)
            this.getTargetType(subTypeTarget, false)
        }
        if (ts.isTypeReferenceNode(target)) {
            let name = identName(target.typeName)
            if (!target.typeArguments) throw new Error('Only type references with type arguments allowed here: ' + name)
            if (name == 'Optional') {
                this.getTargetType(this.toTarget(target.typeArguments[0]), true)
            }
            else if (name == 'Array') {
                this.getTargetType(this.toTarget(target.typeArguments[0]), false)
            }
            else if (name == 'Map') {
                target.typeArguments.slice(0, 2).forEach(arg => this.getTargetType(this.toTarget(arg), false))
                this.imports.setImportsForType(CJType.type, ['java.util.Map'])
            }
            else {
                throw unsupportedType('TypeReferenceNode<Other>')
            }
        }
        return CJType.type
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print(`package idlize\n`)
    }

    private addType(type: Type, writer: LanguageWriter) {
        this.types.set(type, writer)
    }

    private hasType(type: Type): boolean {
        return this.types.has(type)
    }

    private toTarget(node: ts.TypeNode): DeclarationTarget {
        return this.table.toTarget(node)
    }

    private isExplicitOptional(target: DeclarationTarget) {
        if (!(target instanceof ArkPrimitiveType)) {
            return false
        }
        return target == ArkPrimitiveType.Boolean
        // || target == PrimitiveType.Number
    }

    private enumName(name: ts.PropertyName): string {
        return this.table.enumName(name)
    }

    private mapImportType(type: ts.ImportTypeNode): CJType {
        let name = identName(type.qualifier)!
        let CJTypeName: string
        if (name == 'Callback') {
            throw unsupportedType('Import:Callback') //return PrimitiveType.Function
        }
        else {
            throw unsupportedType('Import:Other') //return PrimitiveType.CustomObject
        }
        return CJType.fromTypeName(CJTypeName)
    }

    private readonly primitiveToCJMap = new Map([
        [ArkPrimitiveType.String, 'String'],
        [ArkPrimitiveType.Number, 'Float64'],
        [ArkPrimitiveType.Int32, 'Int32'],
        [ArkPrimitiveType.Tag, 'Tag'],
        [ArkPrimitiveType.RuntimeType, 'RuntimeType'],
        [ArkPrimitiveType.Boolean, 'Bool'],
        [ArkPrimitiveType.Undefined, `${ArkPrimitiveType.Prefix}Undefined`],
        [ArkPrimitiveType.Length, `${ArkPrimitiveType.Prefix}Length`],
        [ArkPrimitiveType.CustomObject, 'Ark_CustomObject'],
        // TODO: add other primitive types
    ])

    private readonly primitiveToReferenceTypeMap = new Map([
        ['byte', 'Byte'],
        ['short', 'Short'],
        ['int', 'Integer'],
        ['float', 'Float'],
        ['double', 'Double'],
        ['boolean', 'Boolean'],
        ['char', 'Character'],
    ])

    private primitiveToCJType(primitiveType: ArkPrimitiveType, needReferenceType?: boolean, optional?: boolean): CJType {
        if (this.primitiveToCJMap.has(primitiveType)) {
            let CJTypeName = this.primitiveToCJMap.get(primitiveType)!
            if (needReferenceType && this.primitiveToReferenceTypeMap.has(CJTypeName)) {
                CJTypeName = this.primitiveToReferenceTypeMap.get(CJTypeName)!
            }
            return CJType.fromTypeName(CJTypeName, optional)
        }
        throw unsupportedType(`primitive type ${primitiveType.getText()}`)
    }

    private optionalPrimitiveToCJType(primitiveType: ArkPrimitiveType): CJType {
        if (primitiveType == ArkPrimitiveType.Boolean) {
            const CJTypeName = `${ArkPrimitiveType.OptionalPrefix}Boolean`
            return CJType.fromTypeName(CJTypeName, false)
        }
        // if (primitiveType == PrimitiveType.Number) {
        //     const CJTypeName = `${PrimitiveType.OptionalPrefix}Number`
        //     return CJType.fromTypeName(CJTypeName, false)
        // }
        throw new Error(`Primitive type ${primitiveType.getText()} cannot be optional`)
    }


    private computeCJType(target: DeclarationTarget, optional: boolean, needReferenceType?: boolean): CJType {
        if (target instanceof ArkPrimitiveType) {
            if (optional && this.isExplicitOptional(target)) {
                // for now, the only explicit optionals in CJ are Opt_Boolean and Opt_Number
                return this.optionalPrimitiveToCJType(target)
            }
            return this.primitiveToCJType(target, needReferenceType, optional)
        }
        if (ts.isTypeLiteralNode(target)) {
            throw unsupportedType(`TypeLiteralNode`)
        }
        if (ts.isLiteralTypeNode(target)) {
            throw unsupportedType(`LiteralTypeNode`)
        }
        if (ts.isTemplateLiteralTypeNode(target)) {
            throw unsupportedType(`TemplateLiteralTypeNode`)
        }
        if (ts.isTypeParameterDeclaration(target)) {
            throw unsupportedType(`TypeParameterDeclaration`)
        }
        if (ts.isEnumDeclaration(target)) {
            const enumName = this.enumName(target.name)
            return CJType.fromTypeName(enumName, optional)
        }
        if (ts.isUnionTypeNode(target)) {
            const memberTypes = target.types.map(it => this.computeCJType(this.toTarget(it), false))
            const unionName = `Union_${memberTypes.map(it => it.alias, false).join('_')}`
            return CJType.fromTypeName(unionName, optional)
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let name = identName(target.name)
            if (name == 'Function')
                throw unsupportedType(`InterfaceDeclaration/ClassDeclaration:Function`)
                //return PrimitiveType.Function.getText()
            return CJType.fromTypeName(name ?? '', optional)
        }
        if (ts.isFunctionTypeNode(target)) {
            throw unsupportedType(`FunctionTypeNode`)
            // return PrimitiveType.Function.getText()
        }
        if (ts.isTupleTypeNode(target)) {
            const elementTypes = target.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeCJType(this.toTarget(it.type), it.questionToken != undefined)
                } else {
                    return this.computeCJType(this.toTarget(it), false)
                }
            })
            const tupleName = `Tuple_${elementTypes.map(it => it.alias, false).join('_')}`
            return CJType.fromTypeName(tupleName, optional)
        }
        if (ts.isArrayTypeNode(target)) {
            const arrayElementType = this.computeCJType(this.toTarget(target.elementType), false)
            return new CJType(new Type(`ArrayList<${arrayElementType.type.name}>`), `Array_${arrayElementType.alias}`)
        }
        if (ts.isImportTypeNode(target)) {
            return this.mapImportType(target)
        }
        if (ts.isOptionalTypeNode(target)) {
            const subTypeTarget = this.toTarget(target.type)
            return this.computeCJType(subTypeTarget, true)
        }
        if (ts.isParenthesizedTypeNode(target)) {
            throw unsupportedType(`ParenthesizedTypeNode`)
            // return this.computeTargetName(this.toTarget(target.type), optional)
        }
        if (ts.isEnumMember(target)) {
            throw unsupportedType(`EnumMember`)
            // return this.computeTargetName((target as any).parent as DeclarationTarget, optional)
        }
        if (ts.isTypeReferenceNode(target)) {
            let name = identName(target.typeName)
            if (!target.typeArguments) throw new Error('Only type references with type arguments allowed here: ' + name)
            if (name == 'Optional')
                return this.computeCJType(this.toTarget(target.typeArguments[0]), false)
            if (name == 'Array') {
                const arrayElementType = this.computeCJType(this.toTarget(target.typeArguments[0]), false)
                return new CJType(new Type(`${arrayElementType.type.name}[]`), `Array_${arrayElementType.alias}`)
            }
            if (name == 'Map') {
                const CJTypes = target.typeArguments.slice(0, 2).map(it => this.computeCJType(this.toTarget(it), false, true))
                return new CJType(new Type(`Map<${CJTypes[0].type.name}, ${CJTypes[1].type.name}>`), `Map_${CJTypes[0].alias}_${CJTypes[1].alias}`)
            }
            if (name == 'Callback')
                throw unsupportedType(`TypeReferenceNode:Callback`)
                // return optionalPrefix + PrimitiveType.Function.getText()
            if (PeerGeneratorConfig.isKnownParametrized(name))
                throw unsupportedType(`TypeReferenceNode:KnownParametrized`)
                // return optionalPrefix + PrimitiveType.CustomObject.getText()
        }
        throw new Error(`Cannot compute target name: ${(target as any).getText()} ${(target as any).kind}`)
    }

    private printUnionImplementation(sourceType: ts.UnionTypeNode, CJType: CJType, writer: LanguageWriter) {
        const membersInfo: MemberInfo[] = sourceType.types.map((subType, index) => {
            return {name: `value${index}`, type: this.getTargetType(this.toTarget(subType), false)}
        })

        writer.print('import std.collection.*')

        this.imports.printImportsForTypes(membersInfo.map(it => it.type), writer)

        writer.writeClass(CJType.alias, () => {
            const intType = new Type('int32')
            const selector = 'selector'
            writer.writeFieldDeclaration(selector, intType, [FieldModifier.PRIVATE], false)
            writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(intType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(selector)
                    )
                )
            })

            const param = 'param'
            for (const [index, memberInfo] of membersInfo.entries()) {
                let optionalType = new Type(memberInfo.type.name, true)
                writer.writeFieldDeclaration(memberInfo.name, optionalType, [FieldModifier.PRIVATE], true, new StringExpression(`None<${memberInfo.type}>`) )

                writer.writeConstructorImplementation(
                    "init",
                    new NamedMethodSignature(Type.Void, [memberInfo.type], [param]),
                    () => {
                        writer.writeStatement(
                            writer.makeAssign(memberInfo.name, undefined, writer.makeString(param), false, false)
                        )
                        writer.writeStatement(
                            writer.makeAssign(selector, undefined, writer.makeString(index.toString()), false)
                        )
                    }
                )

                writer.writeMethodImplementation(
                    new Method(`getValue${index}`, new MethodSignature(memberInfo.type, []), [MethodModifier.PUBLIC]),
                    () => {
                        writer.print(`if (let Some(${writer.languageKeywordProtection(memberInfo.name)}) <- ${writer.languageKeywordProtection(memberInfo.name)}) {`)
                        writer.pushIndent()
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(memberInfo.name)
                            )
                        )
                        writer.popIndent()
                        writer.print('}')
                        writer.print('throw Exception()')
                    }
                )
            }
        }, ARK_OBJECTBASE)
    }

    private printTupleImplementation(sourceType: ts.TupleTypeNode, CJType: CJType, writer: LanguageWriter) {
        const membersInfo: MemberInfo[] = sourceType.elements.map((subType, index) => {
            return {name: `value${index}`, type: this.getTargetType(this.toTarget(subType), false)}
        })

        const argTypes: Type[] = membersInfo.map(it => it.type)
        const memberNames: string[] = membersInfo.map(it => it.name)
        this.imports.printImportsForTypes(argTypes, writer)

        writer.writeClass(CJType.alias, () => {
            for (const memberInfo of membersInfo) {
                writer.writeFieldDeclaration(memberInfo.name, memberInfo.type, [FieldModifier.PUBLIC], false)
            }

            const signature = new MethodSignature(Type.Void, argTypes)
            writer.writeConstructorImplementation(CJType.alias, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], argTypes[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        }, ARK_OBJECTBASE)
    }

    private printEnumImplementation(sourceType: ts.EnumDeclaration, CJType: CJType, writer: LanguageWriter) {
        writer.writeClass(CJType.alias, () => {
            let memberValue = 0
            for (const member of sourceType.members) {
                if (member.initializer) {
                    if (ts.isNumericLiteral(member.initializer)) {
                        memberValue = parseInt(member.initializer.getText())
                    }
                    else {
                        throw new Error(`This type of enum member inititalizer is not supported yet in Java: ${member.initializer.getFullText()}`)
                    }
                }

                writer.writeFieldDeclaration(member.name.getText(), CJType.type, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    new StringExpression(`${CJType.alias}(${memberValue})`)
                )

                memberValue += 1
            }

            const value = 'value'
            const intType = Type.Int32
            writer.print("public var value: Int32")

            const signature = new MethodSignature(Type.Void, [intType])
            writer.writeConstructorImplementation(CJType.alias, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })

            const getIntValue = new Method('getIntValue', new MethodSignature(intType, []), [MethodModifier.PUBLIC])
            writer.writeMethodImplementation(getIntValue, () => {
                writer.writeStatement(
                    writer.makeReturn(writer.makeString(value))
                )
            })
        }, undefined, [ARK_OBJECTBASE, INT_VALUE_GETTER])
    }
}
