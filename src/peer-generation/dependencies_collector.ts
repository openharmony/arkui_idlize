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
import { DeclarationConvertor, TypeNodeConvertor, convertDeclaration, convertTypeNode } from "./TypeNodeConvertor";
import {getDeclarationsByNode, Language} from '../util';
import { mapType } from './TypeNodeNameConvertor';

export class TypeDependenciesCollector implements TypeNodeConvertor<ts.Declaration[]> {
    constructor(protected readonly typeChecker: ts.TypeChecker, private readonly language: Language) {}

    convertUnion(node: ts.UnionTypeNode): ts.Declaration[] {
        return node.types.flatMap(type => convertTypeNode(this, type))
    }
    convertTypeLiteral(node: ts.TypeLiteralNode): ts.Declaration[] {
        return node.members.flatMap(it => {
            if (ts.isPropertySignature(it)) {
                return convertTypeNode(this, it.type!)
            }
            if (ts.isIndexSignatureDeclaration(it))
                return [
                    ...it.parameters.flatMap(it => this.convert(it.type)),
                    ...this.convert(it.type),
                ]
            throw new Error(`Not implemented ${ts.SyntaxKind[it.kind]}`)
        })
    }
    convertLiteralType(node: ts.LiteralTypeNode): ts.Declaration[] {
        return []
    }
    convertTuple(node: ts.TupleTypeNode): ts.Declaration[] {
        return node.elements.flatMap(it => {
            if (ts.isNamedTupleMember(it))
                return convertTypeNode(this, it.type)
            return convertTypeNode(this, it)
        })
    }
    convertNamedTupleMember(node: ts.NamedTupleMember): ts.Declaration[] {
        return convertTypeNode(this, node)
    }
    convertArray(node: ts.ArrayTypeNode): ts.Declaration[] {
        return convertTypeNode(this, node.elementType)
    }
    convertOptional(node: ts.OptionalTypeNode): ts.Declaration[] {
        return convertTypeNode(this, node.type)
    }
    convertFunction(node: ts.FunctionTypeNode): ts.Declaration[] {
        return [
            ...node.parameters.flatMap(it => convertTypeNode(this, it.type!)),
            ...convertTypeNode(this, node.type),
        ]
    }
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): ts.Declaration[] {
        return []
    }
    convertImport(node: ts.ImportTypeNode): ts.Declaration[] {
        return []
    }
    convertTypeReference(node: ts.TypeReferenceNode): ts.Declaration[] {
        let declarations = getDeclarationsByNode(this.typeChecker, node.typeName)
        if (declarations.length > 1) {
            console.log(`WARNING: Duplicate declarations temporary unsupported: ${mapType(node)}`)
            declarations = [declarations[0]]
        }
        return [
            ...(node.typeArguments?.flatMap(it => convertTypeNode(this, it)) ?? []),
            ...declarations.map(it => {
                return ts.isEnumMember(it) ? it.parent : it
            }),
        ]
    }
    convertParenthesized(node: ts.ParenthesizedTypeNode): ts.Declaration[] {
        return convertTypeNode(this, node.type)
    }
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): ts.Declaration[] {
        throw new Error('Method not implemented.');
    }
    convertStringKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertNumberKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertBooleanKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertUndefinedKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertVoidKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertObjectKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertAnyKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }
    convertUnknownKeyword(node: ts.TypeNode): ts.Declaration[] {
        return []
    }

    convert(node: ts.TypeNode | undefined): ts.Declaration[] {
        if (node === undefined)
            return []
        return convertTypeNode(this, node)
    }
}

export class DeclarationDependenciesCollector implements DeclarationConvertor<ts.Declaration[]> {
    constructor(
        private readonly typeChecker: ts.TypeChecker,
        private readonly typeDepsCollector: TypeDependenciesCollector,
    ) {
    }

    convertClass(node: ts.ClassDeclaration): ts.Declaration[] {
        return [
            ...(node.heritageClauses?.flatMap(heritage => this.convertHeritageClause(heritage)) ?? []),
            ...node.members.flatMap(member => this.convertMember(member)),
        ]
    }
    convertInterface(node: ts.InterfaceDeclaration): ts.Declaration[] {
        return [
            ...(node.heritageClauses?.flatMap(heritage => this.convertHeritageClause(heritage)) ?? []),
            ...node.members.flatMap(member => this.convertMember(member)),
        ]
    }
    protected convertHeritageClause(clause: ts.HeritageClause): ts.Declaration[] {
        return clause.types.flatMap(expression => this.convertExpression(expression))       
    }
    private convertMember(member: ts.TypeElement | ts.ClassElement): ts.Declaration[] {
        if (ts.isPropertyDeclaration(member) ||
            ts.isPropertySignature(member))
            return this.typeDepsCollector.convert(member.type)
        if (ts.isMethodDeclaration(member) ||
            ts.isMethodSignature(member) ||
            ts.isCallSignatureDeclaration(member) ||
            ts.isGetAccessorDeclaration(member) ||
            ts.isSetAccessorDeclaration(member))
            return [
                ...member.parameters.flatMap(param => this.typeDepsCollector.convert(param.type)),
                ...this.typeDepsCollector.convert(member.type)
            ]
        if (ts.isConstructorDeclaration(member) || ts.isConstructSignatureDeclaration(member))
            return member.parameters.flatMap(param => this.typeDepsCollector.convert(param.type))
        if (ts.isIndexSignatureDeclaration(member)) {
            return []
        }
        throw new Error(`Not implemented ${ts.SyntaxKind[member.kind]}`)
    }
    private convertExpression(expression: ts.ExpressionWithTypeArguments) {
        const declsByNode = getDeclarationsByNode(this.typeChecker, expression.expression)
        return [
            ...declsByNode,
            ...declsByNode.flatMap(it => this.convert(it)),
            ...expression.typeArguments?.flatMap(type => this.typeDepsCollector.convert(type)) ?? []
        ]
    }
    convertEnum(node: ts.EnumDeclaration): ts.Declaration[] {
        return []
    }
    convertTypeAlias(node: ts.TypeAliasDeclaration): ts.Declaration[] {
        return convertTypeNode(this.typeDepsCollector, node.type)
    }

    convert(node: ts.Declaration | undefined): ts.Declaration[] {
        if (node === undefined)
            return []
        return convertDeclaration(this, node)
    }
}

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    convertClass(node: ts.ClassDeclaration): string {
        return node.name!.text
    }
    convertInterface(node: ts.InterfaceDeclaration): string {
        return node.name!.text
    }
    convertEnum(node: ts.EnumDeclaration): string {
        if (ts.isModuleBlock(node.parent)) {
            return `${node.parent.parent.name.text}_${node.name!.text}`
        }
        return node.name!.text
    }
    convertTypeAlias(node: ts.TypeAliasDeclaration): string {
        return node.name!.text
    }

    static readonly I = new DeclarationNameConvertor()
}

export function findNodeSourceFile(node: ts.Node): ts.SourceFile | undefined {
    let sourceFile: ts.SourceFile | undefined = undefined
    do {
        if (ts.isSourceFile(node.parent)) {
            sourceFile = node.parent
        } else {
            node = node.parent
        }
    } while (node != undefined && sourceFile == undefined)
    return sourceFile
}