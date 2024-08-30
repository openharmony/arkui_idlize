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

import * as idl from '../../idl'
import { DeclarationConvertor, TypeConvertor, convertDeclaration, convertType } from "./IdlTypeConvertor";
import { IdlPeerLibrary } from './IdlPeerLibrary';

export class TypeDependenciesCollector implements TypeConvertor<idl.IDLEntry[]> {
    constructor(private readonly library: IdlPeerLibrary) {}

    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        return type.types.flatMap(ty => convertType(this, ty))
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLEntry[] {
        return type.elementType.flatMap(ty => convertType(this, ty))
    }
    convertEnum(type: idl.IDLEnumType): idl.IDLEntry[] {
        return []
    }
    // convertTypeLiteral(node: ts.TypeLiteralNode): ts.Declaration[] {
    //     return node.members.flatMap(it => {
    //         if (ts.isPropertySignature(it)) {
    //             return convertTypeNode(this, it.type!)
    //         }
    //         if (ts.isIndexSignatureDeclaration(it))
    //             return [
    //                 ...it.parameters.flatMap(it => this.convert(it.type)),
    //                 ...this.convert(it.type),
    //             ]
    //         throw new Error(`Not implemented ${ts.SyntaxKind[it.kind]}`)
    //     })
    // }
    // convertLiteralType(node: ts.LiteralTypeNode): ts.Declaration[] {
    //     return []
    // }
    // convertTuple(node: ts.TupleTypeNode): ts.Declaration[] {
    //     return node.elements.flatMap(it => {
    //         if (ts.isNamedTupleMember(it))
    //             return convertTypeNode(this, it.type)
    //         return convertTypeNode(this, it)
    //     })
    // }
    // convertArray(node: ts.ArrayTypeNode): ts.Declaration[] {
    //     return convertTypeNode(this, node.elementType)
    // }
    // convertOptional(node: ts.OptionalTypeNode): ts.Declaration[] {
    //     return convertTypeNode(this, node.type)
    // }
    // convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): ts.Declaration[] {
    //     return []
    // }
    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        return []
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        const result = !decl ? []
            : idl.isEnumMember(decl) ? [decl.parent] : [decl]
        const typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)
        if (typeArgs) {
            result.push(...typeArgs.split(",").flatMap(it => convertType(this, idl.toIDLType(it))))
        }
        return result
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLEntry[] {
        return []
    }
    // convertParenthesized(node: ts.ParenthesizedTypeNode): ts.Declaration[] {
    //     return convertTypeNode(this, node.type)
    // }
    // convertIndexedAccess(node: ts.IndexedAccessTypeNode): ts.Declaration[] {
    //     throw new Error('Method not implemented.');
    // }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLEntry[] {
        return []
    }
    convertCallback(decl: idl.IDLCallback): idl.IDLEntry[] {///same as in DeclarationDependenciesCollector
        return [
            ...decl.parameters.flatMap(it => convertType(this, it.type!)),
            ...convertType(this, decl.returnType),
        ]
    }
    convert(node: idl.IDLType | undefined): idl.IDLEntry[] {
        return node ? convertType(this, node) : []
    }
}

export class DeclarationDependenciesCollector implements DeclarationConvertor<idl.IDLEntry[]> {
    constructor(
        private readonly typeDepsCollector: TypeDependenciesCollector,
    ) {}

    // convertClass(decl: idl.IDLInterface): idl.IDLEntry[] {
    //     return [
            // ...(node.heritageClauses?.flatMap(heritage => this.convertHeritageClause(heritage)) ?? []),
            // ...node.members.flatMap(member => this.convertMember(member)),
    //     ]
    // }

    convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
        return [
            ...decl.inheritance
                .filter(it => it !== idl.IDLTopType)
                .flatMap(it => this.convertSupertype(it)),
            ...decl.properties.flatMap(it => this.typeDepsCollector.convert(it.type)),
            ...[...decl.callables, ...decl.methods].flatMap(it => [
                ...it.parameters.flatMap(param => this.typeDepsCollector.convert(param.type)),
                ...this.typeDepsCollector.convert(it.returnType)])
        ]
    }
    protected convertSupertype(type: idl.IDLType): idl.IDLEntry[] {
        return this.typeDepsCollector.convert(type)
    }
    // private convertMember(member: ts.TypeElement | ts.ClassElement): ts.Declaration[] {
    //     if (ts.isPropertyDeclaration(member) ||
    //         ts.isPropertySignature(member))
    //         return this.typeDepsCollector.convert(member.type)
    //     if (ts.isMethodDeclaration(member) ||
    //         ts.isMethodSignature(member) ||
    //         ts.isCallSignatureDeclaration(member) ||
    //         ts.isGetAccessorDeclaration(member) ||
    //         ts.isSetAccessorDeclaration(member))
    //         return [
    //             ...member.parameters.flatMap(param => this.typeDepsCollector.convert(param.type)),
    //             ...this.typeDepsCollector.convert(member.type)
    //         ]
    //     if (ts.isConstructorDeclaration(member) || ts.isConstructSignatureDeclaration(member))
    //         return member.parameters.flatMap(param => this.typeDepsCollector.convert(param.type))

    //     throw new Error(`Not implemented ${ts.SyntaxKind[member.kind]}`)
    // }
    // private convertExpression(expression: ts.ExpressionWithTypeArguments) {
    //     return [
    //         ...getDeclarationsByNode(this.typeChecker, expression.expression),
    //         ...expression.typeArguments?.flatMap(type => this.typeDepsCollector.convert(type)) ?? []
    //     ]
    // }
    convertEnum(decl: idl.IDLEnum): idl.IDLEntry[] {
        return []
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLEntry[] {
        return convertType(this.typeDepsCollector, decl.type)
    }
    convertCallback(decl: idl.IDLCallback): idl.IDLEntry[] {
        return [
            ...decl.parameters.flatMap(it => convertType(this.typeDepsCollector, it.type!)),
            ...convertType(this.typeDepsCollector, decl.returnType),
        ]
    }
    convert(node: idl.IDLEntry | undefined): idl.IDLEntry[] {
        if (node === undefined)
            return []
        return convertDeclaration(this, node)
    }
}

export class DeclarationNameConvertor implements DeclarationConvertor<string> {
    // convertClass(node: ts.ClassDeclaration): string {
    //     return node.name!.text
    // }
    convertInterface(decl: idl.IDLInterface): string {
        return decl.name
    }
    convertEnum(decl: idl.IDLEnum): string {
        return decl.name
    }
    convertTypedef(decl: idl.IDLTypedef): string {
        return decl.name
    }
    convertCallback(decl: idl.IDLCallback): string {
        return decl.name ?? "MISSING CALLBACK NAME"
    }

    static readonly I = new DeclarationNameConvertor()
}
