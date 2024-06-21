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
import { TypeNodeConvertor, convertTypeNode } from './TypeNodeConvertor'
import { Language } from "../util";

interface BaseConvertor {
    convert(node: ts.Node): string
}
export class TSTypeNodeNameConvertor implements
    TypeNodeConvertor<string>, BaseConvertor
{
    convertUnion(node: ts.UnionTypeNode): string {
        return node.types.map(it => this.convert(it)).join(" | ")
    }
    convertTypeLiteral(node: ts.TypeLiteralNode): string {
        const members = node.members.map(it => {
            if (ts.isPropertySignature(it)) {
                const name = this.convert(it.name)
                const maybeQuestion = it.questionToken ? '?' : ''
                const type = this.convert(it.type!)
                return `${name}${maybeQuestion}: ${type}`
            }
            if (ts.isIndexSignatureDeclaration(it)) {
                if (it.modifiers) throw 'Not implemented'
                if (it.typeParameters) throw 'Not implemented'
                if (it.questionToken) throw 'Not implemented'
                if (it.name) throw 'Not implemented'
                const parameters = it.parameters.map(it => this.convertParameterDeclaration(it))
                return `[${parameters.join(', ')}]: ${this.convert(it.type)}`
            }
            throw `Unknown member type ${ts.SyntaxKind[it.kind]}`
        })
        return `{${members.join(', ')}}`
    }
    private convertParameterDeclaration(node: ts.ParameterDeclaration): string {
        if (node.modifiers) throw 'Not implemented'
        if (!node.type) throw 'Expected ParameterDeclaration to have a type'
        const maybeQuestion = node.questionToken ? '?' : ''
        const name = this.convert(node.name)
        return `${name}${maybeQuestion}: ${this.convert(node.type!)}`
    }
    convertLiteralType(node: ts.LiteralTypeNode): string {
        if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return `true`
        if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return `false`
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) return `null`
        if (node.literal.kind === ts.SyntaxKind.StringLiteral) return `"${node.literal.text}"`
        throw new Error(`Unknown LiteralTypeNode ${ts.SyntaxKind[node.literal.kind]}`)
    }
    convertTuple(node: ts.TupleTypeNode): string {
        const members = node.elements.map(it => this.convertTupleElement(it))
        return `[${members.join(', ')}]`
    }
    protected convertTupleElement(node: ts.TypeNode): string {
        if (ts.isNamedTupleMember(node)) {
            const name = this.convert(node.name)
            const maybeQuestion = node.questionToken ? '?' : ''
            const type = this.convert(node.type!)
            return `${name}${maybeQuestion}: ${type}`
        }
        return this.convert(node)
    }
    convertArray(node: ts.ArrayTypeNode): string {
        return `${this.convert(node.elementType)}[]`
    }
    convertOptional(node: ts.OptionalTypeNode): string {
        return `${this.convert(node.type)}?`
    }
    convertFunction(node: ts.FunctionTypeNode): string {
        if (node.typeParameters?.length)
            throw "Not implemented"
        const parameters = node.parameters.map(it => {
            const name = this.convert(it.name)
            const maybeQuestion = it.questionToken ? '?' : ''
            const type = this.convert(it.type!)
            return `${name}${maybeQuestion}: ${type}`
        })
        return `((${parameters.join(', ')}) => ${this.convert(node.type)})`
    }
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
        return node.templateSpans.map(template => {
            return `\`\${${this.convert(template.type)}}${template.literal.rawText}\``
        }).join()
    }
    convertImport(node: ts.ImportTypeNode): string {
        const from = this.convert(node.argument)
        const qualifier = this.convert(node.qualifier!)
        const maybeTypeArguments = node.typeArguments?.length
            ? '_' + node.typeArguments.map(it => this.convert(it)).join('_')
            : ''
        return `IMPORT_${qualifier}${maybeTypeArguments}_FROM_${from}`
            .match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(node: ts.TypeReferenceNode): string {
        const name = this.convert(node.typeName)
        if (name === 'Style')
            return this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword))
        let types = node.typeArguments?.map(it => this.convert(it))
        if (name === `AttributeModifier`)
            types = [`object`]
        if (name === `ContentModifier`)
            types = [this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
        if (name === `Optional`)
            return `${types} | undefined`
        const maybeTypeArguments = !types?.length ? '' : `<${types.join(', ')}>`
        return `${name}${maybeTypeArguments}`
    }
    convertParenthesized(node: ts.ParenthesizedTypeNode): string {
        return `(${this.convert(node.type)})`
    }
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): string {
        throw new Error('Method not implemented.')
    }
    convertTypeParameterDeclaration(node: ts.TypeParameterDeclaration): string {
        throw new Error('Method not implemented.')
    }
    convertStringKeyword(node: ts.TypeNode): string {
        return 'string'
    }
    convertNumberKeyword(node: ts.TypeNode): string {
        return 'number'
    }
    convertBooleanKeyword(node: ts.TypeNode): string {
        return 'boolean'
    }
    convertUndefinedKeyword(node: ts.TypeNode): string {
        return 'undefined'
    }
    convertVoidKeyword(node: ts.TypeNode): string {
        return 'void'
    }
    convertObjectKeyword(node: ts.TypeNode): string {
        return 'Object'
    }
    convertAnyKeyword(node: ts.TypeNode): string {
        return 'any'
    }
    convertUnknownKeyword(node: ts.TypeNode): string {
        return `unknown`
    }

    // identifier
    convertQualifiedName(node: ts.QualifiedName): string {
        return `${this.convert(node.left)}.${this.convert(node.right)}`
    }
    convertIdentifier(node: ts.Identifier): string {
        return node.text
    }

    convert(node: ts.Node): string {
        if (ts.isQualifiedName(node)) return this.convertQualifiedName(node)
        if (ts.isIdentifier(node)) return this.convertIdentifier(node)
        if (ts.isTypeNode(node)) return convertTypeNode(this, node)

        throw new Error(`Unknown node type ${ts.SyntaxKind[node.kind]}`)
    }
}

export class JavaTypeNodeNameConvertor implements
    TypeNodeConvertor<string>, BaseConvertor
{
    convertUnion(node: ts.UnionTypeNode): string {
        let unionType = 'Union'
        for (const unionSubtype of node.types) {
            unionType = `${unionType}_${this.convert(unionSubtype)}`
        }
        return unionType
    }
    convertTypeLiteral(node: ts.TypeLiteralNode): string {
        const members = node.members.map(it => {
            if (ts.isPropertySignature(it)) {
                const name = this.convert(it.name)
                const isOptional = !!it.questionToken
                const type = this.convert(it.type!)
                if (isOptional) {
                    return `Optional_${type} ${name}`
                }
                return `${type} ${name}`
            }
            if (ts.isIndexSignatureDeclaration(it)) {
                if (it.modifiers) throw new Error('Not implemented')
                if (it.typeParameters) throw new Error('Not implemented')
                if (it.questionToken) throw new Error('Not implemented')
                if (it.name) throw new Error('Not implemented')
                const parameters = it.parameters.map(it => this.convertParameterDeclaration(it))
                return `[${parameters.join(', ')}]: ${this.convert(it.type)}`
            }
            throw new Error(`Unknown member type ${ts.SyntaxKind[it.kind]}`)
        })
        return `{${members.join(', ')}}`
    }
    private convertParameterDeclaration(node: ts.ParameterDeclaration): string {
        if (node.modifiers) throw new Error('Not implemented')
        if (!node.type) throw new Error('Expected ParameterDeclaration to have a type')
        const isOptional = !!node.questionToken
        const name = this.convert(node.name)
        const type = this.convert(node.type!)
        if (isOptional) {
            return `Optional_${type}$ ${name}`
        }
        return `${type} ${name}`
    }
    convertLiteralType(node: ts.LiteralTypeNode): string {
        if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return 'true'
        if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return 'false'
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) return 'null'
        if (node.literal.kind === ts.SyntaxKind.StringLiteral) return `"${node.literal.text}"`
        throw new Error(`Unknown LiteralTypeNode ${ts.SyntaxKind[node.literal.kind]}`)
    }
    convertTuple(node: ts.TupleTypeNode): string {
        const members = node.elements.map(it => this.convertTupleElement(it))
        return `Tuple_${members.join('_')}`
    }
    protected convertTupleElement(node: ts.TypeNode): string {
        if (ts.isNamedTupleMember(node)) {
            const name = this.convert(node.name)
            const maybeQuestion = node.questionToken ? '?' : ''
            const type = this.convert(node.type!)
            return `${name}${maybeQuestion}: ${type}`
        }
        return this.convert(node)
    }
    convertArray(node: ts.ArrayTypeNode): string {
        return `${this.convert(node.elementType)}[]`
    }
    convertOptional(node: ts.OptionalTypeNode): string {
        return `Optional_${this.convert(node.type)}`
    }
    convertFunction(node: ts.FunctionTypeNode): string {
        if (node.typeParameters?.length)
            throw new Error('Not implemented')
        const parameters = node.parameters.map(it => {
            const name = this.convert(it.name)
            const maybeQuestion = it.questionToken ? '?' : ''
            const type = this.convert(it.type!)
            return `${name}${maybeQuestion}: ${type}`
        })
        return `((${parameters.join(', ')}) => ${this.convert(node.type)})`
    }
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
        return node.templateSpans.map(template => {
            return `\`\${${this.convert(template.type)}}${template.literal.rawText}\``
        }).join()
    }
    convertImport(node: ts.ImportTypeNode): string {
        const from = this.convert(node.argument)
        const qualifier = this.convert(node.qualifier!)
        const maybeTypeArguments = node.typeArguments?.length
            ? '_' + node.typeArguments.map(it => this.convert(it)).join('_')
            : ''
        return `IMPORT_${qualifier}${maybeTypeArguments}_FROM_${from}`
            .match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(node: ts.TypeReferenceNode): string {
        const name = this.convert(node.typeName)
        if (name === 'Style')
            return this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword))
        let types = node.typeArguments?.map(it => this.convert(it))
        if (name === `AttributeModifier`)
            types = [`object`]
        if (name === `ContentModifier`)
            types = [this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
        if (name === `Optional`)
            return `${types} | undefined`
        const maybeTypeArguments = !types?.length ? '' : `<${types.join(', ')}>`
        return `${name}${maybeTypeArguments}`
    }
    convertParenthesized(node: ts.ParenthesizedTypeNode): string {
        return `(${this.convert(node.type)})`
    }
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): string {
        throw new Error('Method not implemented.')
    }
    convertTypeParameterDeclaration(node: ts.TypeParameterDeclaration): string {
        throw new Error('Method not implemented.')
    }
    convertStringKeyword(node: ts.TypeNode): string {
        return 'String'
    }
    convertNumberKeyword(node: ts.TypeNode): string {
        return 'Float'
    }
    convertBooleanKeyword(node: ts.TypeNode): string {
        return 'Boolean'
    }
    convertUndefinedKeyword(node: ts.TypeNode): string {
        return 'Undefined'
    }
    convertVoidKeyword(node: ts.TypeNode): string {
        return 'void'
    }
    convertObjectKeyword(node: ts.TypeNode): string {
        return 'Object'
    }
    convertAnyKeyword(node: ts.TypeNode): string {
        return 'any'
    }
    convertUnknownKeyword(node: ts.TypeNode): string {
        return `unknown`
    }

    // identifier
    convertQualifiedName(node: ts.QualifiedName): string {
        return `${this.convert(node.left)}.${this.convert(node.right)}`
    }
    convertIdentifier(node: ts.Identifier): string {
        return node.text
    }

    convert(node: ts.Node): string {
        if (ts.isQualifiedName(node)) return this.convertQualifiedName(node)
        if (ts.isIdentifier(node)) return this.convertIdentifier(node)
        if (ts.isTypeNode(node))
            return convertTypeNode(this, node)
        throw new Error(`Unknown node type ${ts.SyntaxKind[node.kind]}`)
    }
}

const convertors = new Map<Language, BaseConvertor>()
convertors.set(Language.TS, new TSTypeNodeNameConvertor())
convertors.set(Language.JAVA, new JavaTypeNodeNameConvertor())

export function mapType(type: ts.TypeNode | undefined, language: Language): string {
    const convertor = convertors.get(language)
    if (!convertor) {
        throw new Error(`No convertor for language ${language.toString()}`)
    }
    type ??= ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    return convertor.convert(type)
}
