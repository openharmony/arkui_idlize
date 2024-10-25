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
import { identName } from '../../../util'
import { LanguageWriter, createLanguageWriter } from '../../LanguageWriters'
import { SynthesizedTypesRegistry } from '../SynthesizedTypesRegistry'
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, convertJavaOptional } from '../lang/Java'
import { JavaEnum, JavaTuple, JavaUnion } from "../lang/JavaPrinters"
import { TargetFile } from '../TargetFile'
import { DeclarationTable, DeclarationTarget } from '../../DeclarationTable'
import { PrimitiveType } from "../../ArkPrimitiveType"
import { PeerGeneratorConfig } from '../../PeerGeneratorConfig'
import { ImportTable } from '../ImportTable'
import { Language } from '../../../Language'
import { getIDLTypeName, IDLType, maybeOptional, toIDLType } from '../../../idl'
import { createEmptyReferenceResolver } from '../../ReferenceResolver'


function unsupportedType(type: string): Error {
    return new Error(`Unimplemented type in java: ${type}`)
}

class JavaType {
    // Java type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: IDLType

    // synthetic identifier for internal use cases: naming classes/files etc.
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): JavaType {
        return new JavaType(maybeOptional(toIDLType(typeName), optional), optional ? convertJavaOptional(typeName) : typeName)
    }

    constructor(type: IDLType, alias: string) {
        this.type = type
        this.alias = alias
    }
}

export class JavaSynthesizedTypesRegistry implements SynthesizedTypesRegistry {
    // maps type name in Java (e.g. `Union_double_String`) to its definition (LanguageWriter containing `package X; class Union_double_String {...}`)
    private readonly types = new Map<IDLType, LanguageWriter>()

    constructor(private readonly table: DeclarationTable, private readonly imports: ImportTable) {}

    getDefinitions(): Map<TargetFile, string> {
        const result = new Map<TargetFile, string>()
        for (const [type, writer] of this.types) {
            result.set(
                new TargetFile(getIDLTypeName(type), ARKOALA_PACKAGE_PATH),
                writer.getOutput().join('\n')
            )
        }
        return result
    }

    getTargetType(target: DeclarationTarget, optional: boolean): IDLType {
        const javaType = this.computeJavaType(target, optional)
        if (this.hasType(javaType.type)) {
            return javaType.type
        }

        if (target instanceof PrimitiveType) {
            return javaType.type
        }

        if (ts.isUnionTypeNode(target)) {
            const writer = createLanguageWriter(Language.JAVA, createEmptyReferenceResolver())
            this.printPackage(writer)
            this.printUnionImplementation(target, javaType, writer)
            this.addType(javaType.type, writer)
        }
        else if (ts.isTupleTypeNode(target)) {
            const writer = createLanguageWriter(Language.JAVA, createEmptyReferenceResolver())
            this.printPackage(writer)
            this.printTupleImplementation(target, javaType, writer)
            this.addType(javaType.type, writer)
        }
        else if (ts.isOptionalTypeNode(target)) {
            this.getTargetType(this.toTarget(target.type), true)
        }
        if (ts.isEnumDeclaration(target)) {
            const writer = createLanguageWriter(Language.JAVA, createEmptyReferenceResolver())
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

    private addType(type: IDLType, writer: LanguageWriter) {
        this.types.set(type, writer)
    }

    private hasType(type: IDLType): boolean {
        return this.types.has(type)
    }

    private toTarget(node: ts.TypeNode): DeclarationTarget {
        return this.table.toTarget(node)
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
        return JavaType.fromTypeName(javaTypeName, false)
    }

    private readonly primitiveToJavaMap = new Map([
        [PrimitiveType.String, 'String'],
        [PrimitiveType.Number, 'double'],
        [PrimitiveType.Int32, 'int'],
        [PrimitiveType.Tag, 'Tag'],
        [PrimitiveType.RuntimeType, 'RuntimeType'],
        [PrimitiveType.Boolean, 'boolean'],
        [PrimitiveType.Undefined, `${PrimitiveType.Prefix}Undefined`],
        [PrimitiveType.Length, `${PrimitiveType.Prefix}Length`],
        [PrimitiveType.CustomObject, 'Ark_CustomObject'],
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

    private primitiveToJavaType(primitiveType: PrimitiveType, optional: boolean, needReferenceType?: boolean): JavaType {
        if (this.primitiveToJavaMap.has(primitiveType)) {
            let javaTypeName = this.primitiveToJavaMap.get(primitiveType)!
            if (needReferenceType && this.primitiveToReferenceTypeMap.has(javaTypeName)) {
                javaTypeName = this.primitiveToReferenceTypeMap.get(javaTypeName)!
            }
            return JavaType.fromTypeName(javaTypeName, optional)
        }
        throw unsupportedType(`primitive type ${primitiveType.getText()}`)
    }

    private computeJavaType(target: DeclarationTarget, optional: boolean, needReferenceType?: boolean): JavaType {
        if (target instanceof PrimitiveType) {
            return this.primitiveToJavaType(target, optional, needReferenceType)
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
            return JavaType.fromTypeName(enumName, false)
        }
        if (ts.isUnionTypeNode(target)) {
            const memberTypes = target.types.map(it => this.computeJavaType(this.toTarget(it), false))
            const unionName = `Union_${memberTypes.map(it => it.alias, false).join('_')}`
            return JavaType.fromTypeName(unionName, optional)
        }
        if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
            let name = identName(target.name)
            if (name == 'Function')
                throw unsupportedType(`InterfaceDeclaration/ClassDeclaration:Function`)
            return JavaType.fromTypeName(name ?? '', optional)
        }
        if (ts.isFunctionTypeNode(target)) {
            throw unsupportedType(`FunctionTypeNode`)
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
            return JavaType.fromTypeName(tupleName, optional)
        }
        if (ts.isArrayTypeNode(target)) {
            const arrayElementType = this.computeJavaType(this.toTarget(target.elementType), false)
            return new JavaType(toIDLType(`${getIDLTypeName(arrayElementType.type)}[]`), `Array_${arrayElementType.alias}`)
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
        }
        if (ts.isEnumMember(target)) {
            throw unsupportedType(`EnumMember`)
        }
        if (ts.isTypeReferenceNode(target)) {
            let name = identName(target.typeName)
            if (!target.typeArguments) throw new Error('Only type references with type arguments allowed here: ' + name)
            if (name == 'Optional')
                return this.computeJavaType(this.toTarget(target.typeArguments[0]), true)
            if (name == 'Array') {
                const arrayElementType = this.computeJavaType(this.toTarget(target.typeArguments[0]), false)
                return new JavaType(toIDLType(`${getIDLTypeName(arrayElementType.type)}[]`), `Array_${arrayElementType.alias}`)
            }
            if (name == 'Map') {
                const javaTypes = target.typeArguments.slice(0, 2).map(it => this.computeJavaType(this.toTarget(it), false, true))
                return new JavaType(toIDLType(`Map<${getIDLTypeName(javaTypes[0].type)}, ${getIDLTypeName(javaTypes[1].type)}>`), `Map_${javaTypes[0].alias}_${javaTypes[1].alias}`)
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
        const memberTypes = sourceType.types.map(subType => this.getTargetType(this.toTarget(subType), false))
        const imports = this.imports.getImportsForTypes(memberTypes).map(it => { return {feature: it, module: ''} })
        const javaUnion = new JavaUnion(sourceType, javaType.alias, memberTypes, imports)
        javaUnion.print(writer)
    }

    private printTupleImplementation(sourceType: ts.TupleTypeNode, javaType: JavaType, writer: LanguageWriter) {
        const memberTypes = sourceType.elements.map(subType => {
            return this.getTargetType(this.toTarget(subType), ts.isNamedTupleMember(subType) ? subType.questionToken != undefined : false)
        })
        const imports = this.imports.getImportsForTypes(memberTypes).map(it => { return {feature: it, module: ''} })
        const javaTuple = new JavaTuple(sourceType, javaType.alias, memberTypes, imports)
        javaTuple.print(writer)
    }

    private printEnumImplementation(sourceType: ts.EnumDeclaration, javaType: JavaType, writer: LanguageWriter) {
        const members: {name: string, id: string | number | undefined}[] = []
        for (const member of sourceType.members) {
            let id: string | number | undefined
            if (member.initializer) {
                if (ts.isNumericLiteral(member.initializer)) {
                    id = parseInt(member.initializer.getText())
                }
                else {
                    id = member.initializer.getText()
                }
            }
            members.push({name: member.name.getText(), id: id})
        }
        const javaEnum = new JavaEnum(sourceType, javaType.alias, members)
        javaEnum.print(writer)
    }
}
