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
import { TypeNodeConvertor, convertTypeNode, convertDeclaration } from './TypeNodeConvertor'
import { getDeclarationsByNode, snakeCaseToCamelCase } from "../util";
import { PeerLibrary } from "./PeerLibrary";
import { DeclarationNameConvertor, findNodeSourceFile } from "./dependencies_collector";

export interface TypeNodeNameConvertor extends TypeNodeConvertor<string> {
    convert(node: ts.Node): string
}

export class TSTypeNodeNameConvertor implements
    TypeNodeNameConvertor
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
    convertNamedTupleMember(node: ts.NamedTupleMember): string {
        return `${node.name.text}${this.convert(node.type)}`
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
        // TODO: workaround, remove.
        if (name === `bool`) return `boolean`
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

const nameConvertorInstance = new TSTypeNodeNameConvertor()
export function mapType(type: ts.TypeNode | undefined): string {
    type ??= ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    return nameConvertorInstance.convert(type)
}

export class ArkTSTypeNodeNameConvertor extends TSTypeNodeNameConvertor {
    constructor(private readonly peerLibrary: PeerLibrary) {
        super();
    }
    convertAnyKeyword(node: ts.TypeNode): string {
        return "Object"
    }

    protected convertTupleElement(node: ts.TypeNode): string {
        return super.convertTupleElement(node).replaceAll("?", " | undefined")
    }

    convertVoidKeyword(node: ts.TypeNode): string {
        return "void"
    }

    convertImport(node: ts.ImportTypeNode): string {
        return super.convertImport(node);
    }

    convertTuple(node: ts.TupleTypeNode): string {
        if (node.parent == undefined) {
            return super.convertTuple(node);
        }
        //TODO: need to create an alias for ts.TupleTypeNode to prevent es2panda segmentation fault
        const name = createTupleDeclName(node.elements
            .map(e => this.convert(e))
            .map(e => e.replaceAll("?", "Opt"))
            .map(e => e.replace(/[\W_]+/g, ""))
            .join("_"))
        const genericsTypes = Array.from(
            new Set(searchTypeParameters(node.parent)
                ?.map(it => it.name.text)))
            .join(",")
        return `${name}${genericsTypes.length > 0 ? ''.concat('<', genericsTypes, '>') : ''}`
    }

    convertUnknownKeyword(node: ts.TypeNode): string {
        return "Object"
    }

    convertUnion(node: ts.UnionTypeNode): string {
        const isAliasOrFunction = node.parent && (ts.isTypeAliasDeclaration(node.parent)
            || ts.isFunctionTypeNode(getFirstNotParenthesizedNode(node.parent)))
        const unionTypes = node.types
            .filter(type => !(isAliasOrFunction && type.kind == ts.SyntaxKind.VoidKeyword))
            .map(it => this.convert(it))
        if (node?.parent?.parent !== undefined
            && ts.isTupleTypeNode(node.parent)
            && ts.isTypeReferenceNode(node.parent.parent)) {
            return createUnionDeclName(unionTypes.join('_'))
        }
        return unionTypes.join(" | ");
    }

    convertLiteralType(node: ts.LiteralTypeNode): string {
        if ((ts.isUnionTypeNode(node.parent)
            || ts.isTypeReferenceNode(node.parent)
            || ts.isTypeAliasDeclaration(node.parent)
            || ts.isParameter(node.parent)
        ) && ts.isStringLiteral(node.literal)) {
            return createLiteralDeclName(node.literal.getText().replaceAll(/['"]+/g, ''))
        } else {
            return super.convertLiteralType(node)
        }
    }

    convertTypeLiteral(node: ts.TypeLiteralNode): string {
        return createLiteralDeclName(snakeCaseToCamelCase(node.members.map(it => {
            if (ts.isIndexSignatureDeclaration(it)) {
                return `${it.parameters.map(
                    it => ts.isIdentifier(it.name) ? it.name.text : it.getText()
                )}_${this.convert(it.type)}`
            }
            return it.name?.getText()
        }).join('_')))
    }

    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
        const typeSuffix = ts.isTypeAliasDeclaration(node.parent) ? node.parent.name.text : undefined
        return createTemplateLiteralDeclName(node.templateSpans
            .map(it => `${this.convert(it.type)}_${typeSuffix ?? it.literal.text}`).join('_'))
    }

    convertFunction(node: ts.FunctionTypeNode): string {
        if (node.typeParameters?.length) {
            throw "Not implemented"
        }
        const parameters = node.parameters.map(it => {
            const name = this.convert(it.name)
            const type = this.convert(it.type!)
            return `${name}: ${type}${it.questionToken ? `|undefined` : ``}`
        })
        return `((${parameters.join(', ')}) => ${this.convert(node.type)})`
    }

    convertQualifiedName(node: ts.QualifiedName): string {
        const name = Array.from(this.peerLibrary.conflictedDeclarations)
            .map(it => {
                if ((ts.isInterfaceDeclaration(it) || ts.isClassDeclaration(it) || ts.isEnumDeclaration(it)) &&
                    ts.isModuleBlock(it.parent) && super.convert(node.right) === it.name?.text) {
                    return convertDeclaration(DeclarationNameConvertor.I, it)
                }
            })
            .find(it => it != undefined)
        if (name !== undefined) {
            return name
        }
        // Fixing a method parameter with an enum type like 'barMode (value: BarMode.Fixed)'
        if (ts.isIdentifier(node.left) && ts.isIdentifier(node.right)) {
            const declarations = getDeclarationsByNode(this.peerLibrary.declarationTable.typeChecker!,
                node.left)
            if (declarations.length) {
                const likelyDecl = declarations.find(decl => findNodeSourceFile(decl) == findNodeSourceFile(node))
                if (likelyDecl && ts.isEnumDeclaration(likelyDecl)) {
                    return this.convert(node.left)
                }
            }
        }
        return super.convertQualifiedName(node);
    }
}

// CJ printers does not use this in fact
export class CJTypeNodeNameConvertor extends TSTypeNodeNameConvertor {}

// Java printers does not use this in fact
export class JavaTypeNodeNameConvertor extends TSTypeNodeNameConvertor {}

export function createInterfaceDeclName(name: string): string {
    return `INTERFACE_${name}`
}
export function createTemplateLiteralDeclName(name: string): string {
    return `TEMPLATE_LITERAL_${name}`
}
export function createLiteralDeclName(name: string): string {
    return `LITERAL_${name}`
}
export function createUnionDeclName(name: string): string {
    return `UNION_${name}`
}
export function createTupleDeclName(name: string): string {
    return `TUPLE_${name}`
}

export function searchTypeParameters(node: ts.Node): ts.NodeArray<ts.TypeParameterDeclaration> | undefined {
    if (ts.isTypeAliasDeclaration(node)
        || ts.isClassDeclaration(node)
        || ts.isInterfaceDeclaration(node)
        || ts.isMethodDeclaration(node)) {
        return node.typeParameters
    }
    if (node.parent != null && !ts.isSourceFile(node.parent)) {
        return searchTypeParameters(node.parent)
    }
}

function getFirstNotParenthesizedNode(node: ts.Node): ts.Node {
    if (ts.isParenthesizedTypeNode(node) && node.parent !== undefined) {
        return getFirstNotParenthesizedNode(node.parent)
    }
    return node
}