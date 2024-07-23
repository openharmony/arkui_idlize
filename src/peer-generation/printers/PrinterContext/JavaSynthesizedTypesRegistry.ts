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
import { ImportTable } from '../ImportTable'


function unsupportedType(type: string): Error {
    return new Error(`Unimplemented type in java: ${type}`)
}

type MemberInfo = {
    name: string,
    type: Type,
}

class JavaType {
    // Java type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: Type

    // synthetic identifier for internal use cases: naming classes/files etc. 
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string): JavaType {
        return new JavaType(new Type(typeName), typeName)
    }

    constructor(type: Type, alias: string) {
        this.type = type
        this.alias = alias
    }
}

export class JavaSynthesizedTypesRegistry implements SynthesizedTypesRegistry {
    // maps type name in Java (e.g. `Union_double_String`) to its definition (LanguageWriter containing `package X; class Union_double_String {...}`)
    private readonly types = new Map<Type, LanguageWriter>()
    
    constructor(private readonly table: DeclarationTable, private readonly imports: ImportTable) {}

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
        const javaType = this.computeJavaType(target, optional)
        if (this.hasType(javaType.type)) {
            return javaType.type
        }

        if (target instanceof PrimitiveType) {
            return javaType.type
        }

        if (ts.isUnionTypeNode(target)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printUnionImplementation(target, javaType, writer)
            this.addType(javaType.type, writer)
        }
        else if (ts.isTupleTypeNode(target)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printTupleImplementation(target, javaType, writer)
            this.addType(javaType.type, writer)
        }
        else if (ts.isOptionalTypeNode(target)) {
            this.getTargetType(this.toTarget(target.type), true)
        }
        if (ts.isEnumDeclaration(target)) {
            const writer = createLanguageWriter(Language.JAVA)
            this.printPackage(writer)
            this.printEnumImplementation(target, javaType, writer)
            this.addType(javaType.type, writer)
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
                this.imports.setImportsForType(javaType.type, ['java.util.Map'])
            }
            else {
                throw unsupportedType('TypeReferenceNode<Other>')
            }
        }
        return javaType.type
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

    private mapImportType(type: ts.ImportTypeNode): JavaType {
        let name = identName(type.qualifier)!
        let javaTypeName: string
        if (name == 'Callback') {
            throw unsupportedType('Import:Callback') //return PrimitiveType.Function
        }
        else {
            throw unsupportedType('Import:Other') //return PrimitiveType.CustomObject
        }
        return JavaType.fromTypeName(javaTypeName)
    }

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

    private readonly primitiveToReferenceTypeMap = new Map([
        ['byte', 'Byte'],
        ['short', 'Short'],
        ['int', 'Integer'],
        ['float', 'Float'],
        ['double', 'Double'],
        ['boolean', 'Boolean'],
        ['char', 'Character'],
    ])

    private primitiveToJavaType(primitiveType: PrimitiveType, needReferenceType?: boolean): JavaType {
        if (this.primitiveToJavaMap.has(primitiveType)) {
            let javaTypeName = this.primitiveToJavaMap.get(primitiveType)!
            if (needReferenceType && this.primitiveToReferenceTypeMap.has(javaTypeName)) {
                javaTypeName = this.primitiveToReferenceTypeMap.get(javaTypeName)!
            }
            return JavaType.fromTypeName(javaTypeName)
        }
        throw unsupportedType(`primitive type ${primitiveType.getText()}`)
    }

    private optionalPrimitiveToJavaType(primitiveType: PrimitiveType): JavaType {
        if (primitiveType == PrimitiveType.Boolean) {
            const javaTypeName = `${PrimitiveType.OptionalPrefix}Boolean`
            return JavaType.fromTypeName(javaTypeName)
        }
        if (primitiveType == PrimitiveType.Number) {
            const javaTypeName = `${PrimitiveType.OptionalPrefix}Number`
            return JavaType.fromTypeName(javaTypeName)
        }
        throw new Error(`Primitive type ${primitiveType.getText()} cannot be optional`)
    }


    private computeJavaType(target: DeclarationTarget, optional: boolean, needReferenceType?: boolean): JavaType {
        if (target instanceof PrimitiveType) {
            if (optional && this.isExplicitOptional(target)) {
                // for now, the only explicit optionals in Java are Opt_Boolean and Opt_Number
                return this.optionalPrimitiveToJavaType(target)
            }
            return this.primitiveToJavaType(target, needReferenceType)
        }
        if (ts.isTypeLiteralNode(target)) {
            throw unsupportedType(`TypeLiteralNode`)
            /*if (target.members.some(ts.isIndexSignatureDeclaration)) {
                // For indexed access we just replace the whole type to a custom accessor.
                return `CustomMap`
            }
            return `Literal_${target.members.map(member => {
                if (ts.isPropertySignature(member)) {
                    let target = this.table.toTarget(member.type!)
                    let field = identName(member.name)
                    return `${field}_${this.computeJavaType(target, member.questionToken != undefined)}`
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
                return PrimitiveType.String.getText()
            }
            if (ts.isNumericLiteral(literal)) {
                return PrimitiveType.Number.getText()
            }
            if (literal.kind == ts.SyntaxKind.NullKeyword) {
                // TODO: Is it correct to have undefined for null?
                return PrimitiveType.Undefined.getText()
            }*/
        }
        if (ts.isTemplateLiteralTypeNode(target)) {
            throw unsupportedType(`TemplateLiteralTypeNode`)
            // TODO: likely incorrect
            // return PrimitiveType.String.getText()
        }
        if (ts.isTypeParameterDeclaration(target)) {
            throw unsupportedType(`TypeParameterDeclaration`)
            // TODO: likely incorrect
            // return PrimitiveType.CustomObject.getText()
        }
        if (ts.isEnumDeclaration(target)) {
            const enumName = this.enumName(target.name)
            return JavaType.fromTypeName(enumName)
        }
        if (ts.isUnionTypeNode(target)) {
            const memberTypes = target.types.map(it => this.computeJavaType(this.toTarget(it), false))
            const unionName = `Union_${memberTypes.map(it => it.alias, false).join('_')}`
            return JavaType.fromTypeName(unionName)
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let name = identName(target.name)
            if (name == 'Function')
                throw unsupportedType(`InterfaceDeclaration/ClassDeclaration:Function`)
                //return PrimitiveType.Function.getText()
            return JavaType.fromTypeName(name ?? '')
        }
        if (ts.isFunctionTypeNode(target)) {
            throw unsupportedType(`FunctionTypeNode`)
            // return PrimitiveType.Function.getText()
        }
        if (ts.isTupleTypeNode(target)) {
            const elementTypes = target.elements.map(it => {
                if (ts.isNamedTupleMember(it)) {
                    return this.computeJavaType(this.toTarget(it.type), it.questionToken != undefined)
                } else {
                    return this.computeJavaType(this.toTarget(it), false)
                }
            })
            const tupleName = `Tuple_${elementTypes.map(it => it.alias, false).join('_')}`
            return JavaType.fromTypeName(tupleName)
        }
        if (ts.isArrayTypeNode(target)) {
            const arrayElementType = this.computeJavaType(this.toTarget(target.elementType), false)
            return new JavaType(new Type(`${arrayElementType.type.name}[]`), `Array_${arrayElementType.alias}`)
        }
        if (ts.isImportTypeNode(target)) {
            return this.mapImportType(target)
        }
        if (ts.isOptionalTypeNode(target)) {
            const subTypeTarget = this.toTarget(target.type)
            return this.computeJavaType(subTypeTarget, true)
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
                return this.computeJavaType(this.toTarget(target.typeArguments[0]), true)
            if (name == 'Array') {
                const arrayElementType = this.computeJavaType(this.toTarget(target.typeArguments[0]), false)
                return new JavaType(new Type(`${arrayElementType.type.name}[]`), `Array_${arrayElementType.alias}`)
            }
            if (name == 'Map') {
                const javaTypes = target.typeArguments.slice(0, 2).map(it => this.computeJavaType(this.toTarget(it), false, true))
                return new JavaType(new Type(`Map<${javaTypes[0].type.name}, ${javaTypes[1].type.name}>`), `Map_${javaTypes[0].alias}_${javaTypes[1].alias}`)
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

    private printUnionImplementation(sourceType: ts.UnionTypeNode, javaType: JavaType, writer: LanguageWriter) {
        const membersInfo: MemberInfo[] = sourceType.types.map((subType, index) => {
            return {name: `value${index}`, type: this.getTargetType(this.toTarget(subType), false)}
        })

        this.imports.printImportsForTypes(membersInfo.map(it => it.type), writer)

        writer.writeClass(javaType.alias, () => {
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

            const param = 'param'
            for (const [index, memberInfo] of membersInfo.entries()) {
                writer.writeFieldDeclaration(memberInfo.name, memberInfo.type, [FieldModifier.PRIVATE], false)

                writer.writeConstructorImplementation(
                    javaType.alias,
                    new NamedMethodSignature(Type.Void, [memberInfo.type], [param]),
                    () => {
                        writer.writeStatement(
                            writer.makeAssign(memberInfo.name, undefined, writer.makeString(param), false)
                        )
                        writer.writeStatement(
                            writer.makeAssign(selector, undefined, writer.makeString(index.toString()), false)
                        )
                    }
                )

                writer.writeMethodImplementation(
                    new Method(`getValue${index}`, new MethodSignature(memberInfo.type, []), [MethodModifier.PUBLIC]),
                    () => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(memberInfo.name)
                            )
                        )
                    }
                )
            }
        }, ARK_OBJECTBASE)
    }

    private printTupleImplementation(sourceType: ts.TupleTypeNode, javaType: JavaType, writer: LanguageWriter) {
        const membersInfo: MemberInfo[] = sourceType.elements.map((subType, index) => {
            return {name: `value${index}`, type: this.getTargetType(this.toTarget(subType), false)}
        })

        const argTypes: Type[] = membersInfo.map(it => it.type)
        const memberNames: string[] = membersInfo.map(it => it.name)
        this.imports.printImportsForTypes(argTypes, writer)

        writer.writeClass(javaType.alias, () => {
            for (const memberInfo of membersInfo) {
                writer.writeFieldDeclaration(memberInfo.name, memberInfo.type, [FieldModifier.PUBLIC], false)
            }

            const signature = new MethodSignature(Type.Void, argTypes)
            writer.writeConstructorImplementation(javaType.alias, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], argTypes[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        }, ARK_OBJECTBASE)
    }

    private printEnumImplementation(sourceType: ts.EnumDeclaration, javaType: JavaType, writer: LanguageWriter) {
        writer.writeClass(javaType.alias, () => {
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

                writer.writeFieldDeclaration(member.name.getText(), javaType.type, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    new StringExpression(`new ${javaType.alias}(${memberValue})`)
                )

                memberValue += 1
            }

            const value = 'value'
            const intType = new Type('int')
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(Type.Void, [intType])
            writer.writeConstructorImplementation(javaType.alias, signature, () => {
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
