import * as ts from 'typescript'
import { TypeNodeConvertor, convertTypeNode } from './TypeNodeConvertor'

export class TSTypeNodeNameConvertor implements
    TypeNodeConvertor<string>
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
            throw `Unknown member type ${it}`
        })
        return `{${members.join(', ')}}`
    }
    convertLiteralType(node: ts.LiteralTypeNode): string {
        if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return `true`
        if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return `false`
        if (node.literal.kind === ts.SyntaxKind.NullKeyword) return `null`
        if (node.literal.kind === ts.SyntaxKind.StringLiteral) return `"${node.literal.text}"`
        throw new Error(`Unknown LiteralTypeNode ${ts.SyntaxKind[node.literal.kind]}`)
    }
    convertTuple(node: ts.TupleTypeNode): string {
        const members = node.elements.map(it => {
            if (ts.isNamedTupleMember(it)) {
                const name = this.convert(it.name)
                const maybeQuestion = it.questionToken ? '?' : ''
                const type = this.convert(it.type!)
                return `${name}${maybeQuestion}: ${type}`
            }
            return this.convert(it)
        })
        return `[${members.join(', ')}]`
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
        throw new Error('Method not implemented.')
    }
    convertImport(node: ts.ImportTypeNode): string {
        const from = this.convert(node.argument).match(/[a-zA-Z]+/g)!.join('_')
        const qualifier = this.convert(node.qualifier!).match(/[a-zA-Z]+/g)!.join('_')
        return `IMPORT_${qualifier}_FROM_${from}`
    }
    convertTypeReference(node: ts.TypeReferenceNode): string {
        const name = this.convert(node.typeName)
        if (name === 'Style')
            return this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword))
        let types = node.typeArguments?.map(it => this.convert(it))
        if (name === `AttributeModifier`)
            types = [`this`]
        if (name === `ContentModifier`)
            types = [this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
        if (name === `Optional`)
            return `${types} | undefined`
        const maybeTypeArguments = !types?.length ? '' : `<${types.join(', ')}>`
        return `${name}${maybeTypeArguments}`
    }
    convertTypeAlias(node: ts.TypeAliasDeclaration): string {
        const types = node.typeParameters?.map(it => this.convert(it.name))
        const maybeTypeArguments = !types?.length ? '' : `<${types.join(', ')}>`
        return `${this.convert(node.name)}${maybeTypeArguments}`
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
        if (ts.isTypeNode(node))
            return convertTypeNode(this, node)
        throw new Error(`Unknown node type ${ts.SyntaxKind[node.kind]}`)
    }
}

const nameConvertorInstance = new TSTypeNodeNameConvertor()
export function mapType(type: ts.TypeNode | undefined): string {
    type ??= ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    return nameConvertorInstance.convert(type)
}
