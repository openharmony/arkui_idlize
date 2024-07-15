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
import { FieldModifier, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, StringExpression, Type, createLanguageWriter } from '../../LanguageWriters'
import { SynthesizedTypesRegistry } from '../SynthesizedTypesRegistry'
import { ARK_OBJECTBASE, ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, INT_VALUE_GETTER } from '../lang/Java'
import { TargetFile } from '../TargetFile'
import { DeclarationTable, DeclarationTarget, PrimitiveType } from '../../DeclarationTable'
import { PeerGeneratorConfig } from '../../PeerGeneratorConfig'


function unsupportedType(type: string): Error {
    return new Error(`Unimplemented type in java: ${type}`)
}

export class JavaSynthesizedTypesRegistry implements SynthesizedTypesRegistry {
    // maps type name in Java (e.g. `Union_double_String`) to its definition (LanguageWriter containing `package X; class Union_double_String {...}`)
    private readonly types = new Map<Type, LanguageWriter>()
    
    constructor(private readonly table: DeclarationTable) {}

    getDefinitions(): Map<TargetFile, string> {
        const result = new Map<TargetFile, string>()
        for (const [type, writer] of this.types) {
            result.set(
                new TargetFile(type.name, ARKOALA_PACKAGE_PATH),
                writer.getOutput().join('\n')
            )
        }
        return result
    }

    getTargetType(target: DeclarationTarget, optional: boolean): Type {
        const targetType = new Type(this.computeTargetName(target, optional))
        if (this.hasType(targetType)) {
            return targetType
        }

        if (target instanceof PrimitiveType) {
            return targetType
        }

        if (ts.isUnionTypeNode(target)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printUnionImplementation(target, targetType, writer)
            this.addType(targetType, writer)
        }
        else if (ts.isTupleTypeNode(target)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printTupleImplementation(target, targetType, writer)
            this.addType(targetType, writer)
        }
        else if (ts.isOptionalTypeNode(target)) {
            const subTypeTarget = this.toTarget(target.type)
            this.getTargetType(subTypeTarget, this.isExplicitOptional(subTypeTarget))
        }
        if (ts.isEnumDeclaration(target)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printEnumImplementation(target, targetType, writer)
            this.addType(targetType, writer)
        }
        return targetType
    }

    private printPackage(writer: LanguageWriter): void {
        writer.print(`package ${ARKOALA_PACKAGE};\n`)
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
        if (!(target instanceof PrimitiveType)) {
            return false
        }
        return target == PrimitiveType.Boolean || target == PrimitiveType.Number
    }

    private enumName(name: ts.PropertyName): string {
        return this.table.enumName(name)
    }

    /*private mapImportType(type: ts.ImportTypeNode): DeclarationTarget {
        let name = identName(type.qualifier)!
        switch (name) {
            case 'Resource': return PrimitiveType.Resource
            case 'Callback': return PrimitiveType.Function
            default: return PrimitiveType.CustomObject
        }
    }*/

    private readonly primitiveToJavaMap = new Map([
        [PrimitiveType.String, 'String'],
        [PrimitiveType.Number, 'double'],
        [PrimitiveType.Int32, 'int'],
        [PrimitiveType.Tag, 'Tag'],
        [PrimitiveType.RuntimeType, 'RuntimeType'],
        [PrimitiveType.Boolean, 'boolean'],
        [PrimitiveType.Undefined, `${PrimitiveType.ArkPrefix}Undefined`],
        [PrimitiveType.Length, `${PrimitiveType.ArkPrefix}Length`],
        // TODO: add other primitive types
    ])

    private primitiveToJavaType(primitiveType: PrimitiveType): string {
        if (this.primitiveToJavaMap.has(primitiveType)) {
            return this.primitiveToJavaMap.get(primitiveType)!
        }
        throw unsupportedType(`primitive type ${primitiveType.getText()}`)
    }

    private optionalPrimitiveToJavaType(primitiveType: PrimitiveType): string {
        if (primitiveType == PrimitiveType.Boolean) {
            return `${PrimitiveType.OptionalPrefix}Boolean`
        }
        if (primitiveType == PrimitiveType.Number) {
            return `${PrimitiveType.OptionalPrefix}Number`
        }
        throw new Error(`Primitive type ${primitiveType.getText()} cannot be optional`)
    }


    private computeTargetName(target: DeclarationTarget, optional: boolean): string {
        let optionalPrefix = ''
        if (target instanceof PrimitiveType) {
            if (optional && this.isExplicitOptional(target)) {
                // for now, the only explicit optionals in Java are Opt_Boolean and Opt_Number
                return this.optionalPrimitiveToJavaType(target)
            }
            return optionalPrefix + this.primitiveToJavaType(target)
        }
        if (ts.isTypeLiteralNode(target)) {
            throw unsupportedType(`TypeLiteralNode`)
            /*if (target.members.some(ts.isIndexSignatureDeclaration)) {
                // For indexed access we just replace the whole type to a custom accessor.
                return optionalPrefix + `CustomMap`
            }
            return optionalPrefix + `Literal_${target.members.map(member => {
                if (ts.isPropertySignature(member)) {
                    let target = this.table.toTarget(member.type!)
                    let field = identName(member.name)
                    return `${field}_${this.computeTargetName(target, member.questionToken != undefined)}`
                } else {
                    return undefined
                }
            })
                .filter(it => it != undefined)
                .join('_')}`*/
        }
        if (ts.isLiteralTypeNode(target)) {
            throw unsupportedType(`LiteralTypeNode`)
            /*const literal = target.literal
            if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal) || ts.isRegularExpressionLiteral(literal)) {
                return optionalPrefix + PrimitiveType.String.getText()
            }
            if (ts.isNumericLiteral(literal)) {
                return optionalPrefix + PrimitiveType.Number.getText()
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return PrimitiveType.Undefined.getText()
            }*/
        }
        if (ts.isTemplateLiteralTypeNode(target)) {
            throw unsupportedType(`TemplateLiteralTypeNode`)
            // TODO: likely incorrect
            // return prefix + PrimitiveType.String.getText()
        }
        if (ts.isTypeParameterDeclaration(target)) {
            throw unsupportedType(`TypeParameterDeclaration`)
            // TODO: likely incorrect
            // return prefix + PrimitiveType.CustomObject.getText()
        }
        if (ts.isEnumDeclaration(target)) {
            return optionalPrefix + this.enumName(target.name)
        }
        if (ts.isUnionTypeNode(target)) {
            return optionalPrefix + `Union_${target.types.map(it => this.computeTargetName(this.table.toTarget(it), false)).join('_')}`
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let name = identName(target.name)
            if (name == 'Function')
                throw unsupportedType(`InterfaceDeclaration/ClassDeclaration:Function`)
                //return optionalPrefix + PrimitiveType.Function.getText()
            return optionalPrefix + name
        }
        if (ts.isFunctionTypeNode(target)) {
            throw unsupportedType(`FunctionTypeNode`)
            // return optionalPrefix + PrimitiveType.Function.getText()
        }
        if (ts.isTupleTypeNode(target)) {
            return optionalPrefix + `Tuple_${target.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeTargetName(this.toTarget(it.type), it.questionToken != undefined)
                } else {
                    return this.computeTargetName(this.toTarget(it), false)
                }
            }).join('_')}`
        }
        if (ts.isArrayTypeNode(target)) {
            throw unsupportedType(`ArrayTypeNode`)
            // return optionalPrefix + `Array_` + this.computeTargetName(this.toTarget(target.elementType), false)
        }
        if (ts.isImportTypeNode(target)) {
            throw unsupportedType(`ImportTypeNode`)
            //return optionalPrefix + this.mapImportType(target).getText()
        }
        if (ts.isOptionalTypeNode(target)) {
            const subTypeTarget = this.toTarget(target.type)
            return this.computeTargetName(subTypeTarget, this.isExplicitOptional(subTypeTarget))
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
                return this.computeTargetName(this.toTarget(target.typeArguments[0]), true)
            if (name == 'Array')
                throw unsupportedType(`TypeReferenceNode:Array`)
                // return optionalPrefix + `Array_` + this.computeTargetName(this.toTarget(target.typeArguments[0]), false)
            if (name == 'Map')
                throw unsupportedType(`TypeReferenceNode:Map`)
                // return optionalPrefix + `Map_` + this.computeTargetName(this.toTarget(target.typeArguments[0]), false) + '_' + this.computeTargetName(this.toTarget(target.typeArguments[1]), false)
            if (name == 'Callback')
                throw unsupportedType(`TypeReferenceNode:Callback`)
                // return optionalPrefix + PrimitiveType.Function.getText()
            if (PeerGeneratorConfig.isKnownParametrized(name))
                throw unsupportedType(`TypeReferenceNode:KnownParametrized`)
                // return optionalPrefix + PrimitiveType.CustomObject.getText()
        }
        throw new Error(`Cannot compute target name: ${(target as any).getText()} ${(target as any).kind}`)
    }

    private printUnionImplementation(sourceType: ts.UnionTypeNode, targetType: Type, writer: LanguageWriter) {
        writer.writeClass(targetType.name, () => {
            const intType = new Type('int')
            const selector = 'selector'
            writer.writeFieldDeclaration(selector, intType, [FieldModifier.PRIVATE], false)
            writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(intType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(selector)
                    )
                )
            })

            for (const [index, subType] of sourceType.types.entries()) {
                const subTypeTargetType = this.getTargetType(this.toTarget(subType), false)
                const value = `value${index}`
                const param = 'param'

                writer.writeFieldDeclaration(value, subTypeTargetType, [FieldModifier.PRIVATE], false)

                writer.writeConstructorImplementation(
                    targetType.name,
                    new NamedMethodSignature(Type.Void, [subTypeTargetType], [param]),
                    () => {
                        writer.writeStatement(
                            writer.makeAssign(value, undefined, writer.makeString(param), false)
                        )
                        writer.writeStatement(
                            writer.makeAssign(selector, undefined, writer.makeString(index.toString()), false)
                        )
                    }
                )

                writer.writeMethodImplementation(
                    new Method(`getValue${index}`, new MethodSignature(subTypeTargetType, []), [MethodModifier.PUBLIC]),
                    () => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(value)
                            )
                        )
                    }
                )
            }
        }, ARK_OBJECTBASE)
    }

    private printTupleImplementation(sourceType: ts.TupleTypeNode, targetType: Type, writer: LanguageWriter) {
        writer.writeClass(targetType.name, () => {
            const argTypes: Type[] = []
            const memberNames: string[] = []
            for (const [index, subType] of sourceType.elements.entries()) {
                const subTypeTargetType = this.getTargetType(this.toTarget(subType), false)
                argTypes.push(subTypeTargetType)
                const value = `value${index}`
                memberNames.push(value)

                writer.writeFieldDeclaration(value, subTypeTargetType, [FieldModifier.PUBLIC], false)
            }

            const signature = new MethodSignature(Type.Void, argTypes)
            writer.writeConstructorImplementation(targetType.name, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], argTypes[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        }, ARK_OBJECTBASE)
    }

    private printEnumImplementation(sourceType: ts.EnumDeclaration, targetType: Type, writer: LanguageWriter) {
        writer.writeClass(targetType.name, () => {
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

                writer.writeFieldDeclaration(member.name.getText(), targetType, ['public', 'static', 'final'], false,
                    new StringExpression(`new ${targetType.name}(${memberValue})`)
                )

                memberValue += 1
            }

            const value = 'value'
            const intType = new Type('int')
            writer.writeFieldDeclaration(value, intType, ['public', 'final'], false)

            const signature = new MethodSignature(Type.Void, [intType])
            writer.writeConstructorImplementation(targetType.name, signature, () => {
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
        }, ARK_OBJECTBASE, [INT_VALUE_GETTER])
    }
}
