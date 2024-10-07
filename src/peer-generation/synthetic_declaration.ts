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
import { convertDeclToFeature, ImportFeature } from './ImportsCollector'
import { TypeNodeNameConvertor } from "./TypeNodeNameConvertor";
import { PeerLibrary } from "./PeerLibrary";
import { DeclarationDependenciesCollector } from "./dependencies_collector";
import { PeerGeneratorConfig } from "./PeerGeneratorConfig";
import { ArkTSTypeDepsCollector, isSourceDecl } from "./PeerGeneratorVisitor";
import { convertTypeNode } from "./TypeNodeConvertor";
import { lazy } from "./lazy";

const syntheticDeclarations: Map<string, {node: ts.Declaration, filename: string, dependencies: ImportFeature[]}> = new Map()
export function makeSyntheticDeclaration(targetFilename: string, declName: string, factory: () => ts.Declaration): ts.Declaration {
    if (!syntheticDeclarations.has(declName))
        syntheticDeclarations.set(declName, {node: factory(), filename: targetFilename, dependencies: []})
    const decl = syntheticDeclarations.get(declName)!
    if (decl.filename !== targetFilename)
        throw "Two declarations with same name were declared"
    return decl.node
}

export function addSyntheticDeclarationDependency(node: ts.Declaration, dependency: ImportFeature) {
    for (const decl of syntheticDeclarations.values())
        if (decl.node === node) {
            decl.dependencies.push(dependency)
            return
        }
    throw "Declaration is not synthetic"
}

export function makeSyntheticTypeAliasDeclaration(targetFilename: string,
                                                  declName: string,
                                                  type: ts.TypeNode,
                                                  typeParameters?: readonly ts.TypeParameterDeclaration[]
                                                  ): ts.TypeAliasDeclaration {
    declName = declName.replace(/<.*>/g, '')
    const decl = makeSyntheticDeclaration(targetFilename, declName, () => {
        return ts.factory.createTypeAliasDeclaration(
            undefined,
            declName,
            typeParameters,
            type
        )
    })
    if (!ts.isTypeAliasDeclaration(decl))
        throw "Expected declaration to be a TypeAlias"
    return decl
}

export function isSyntheticDeclaration(node: ts.Declaration): boolean {
    for (const decl of syntheticDeclarations.values())
        if (decl.node === node)
            return true
    return false
}

export function syntheticDeclarationFilename(node: ts.Declaration): string {
    for (const decl of syntheticDeclarations.values())
        if (decl.node === node)
            return decl.filename
    throw "Declaration is not synthetic"
}

export function getSyntheticDeclarationList(): ts.Declaration[] {
    return Array.from(syntheticDeclarations.values()).map(it => it.node)
}

export function makeSyntheticDeclarationsFiles(): Map<string, {dependencies: ImportFeature[], declarations: ts.Declaration[]}> {
    const files = new Map<string, {dependencies: ImportFeature[], declarations: ts.Declaration[]}>()
    for (const decl of syntheticDeclarations.values()) {
        if (!files.has(decl.filename))
            files.set(decl.filename, {dependencies: [], declarations: []})
        files.get(decl.filename)!.declarations.push(decl.node)
        files.get(decl.filename)!.dependencies.push(...decl.dependencies)
    }
    return files
}

export function makeSyntheticInterfaceDeclaration(targetFileName: string,
                                                  interfaceName: string,
                                                  typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined,
                                                  members: ts.NodeArray<ts.TypeElement>,
                                                  declDependenciesCollector: DeclarationDependenciesCollector,
                                                  peerLibrary: PeerLibrary): ts.Declaration {
    const decl = makeSyntheticDeclaration(targetFileName,
        interfaceName,
        () => ts.factory.createInterfaceDeclaration([], interfaceName, typeParameters, [], members.map(
            it => {
                // Replacing the Function type with Function<void>
                if (ts.isPropertySignature(it)
                    && it.type
                    && ts.isTypeReferenceNode(it.type)
                    && it.type.typeName.getText() == "Function") {
                    return ts.factory.createPropertySignature(
                        it.modifiers,
                        it.name,
                        it.questionToken,
                        ts.factory.createTypeReferenceNode(it.type.typeName, ts.factory.createNodeArray([
                            ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
                        ]))
                    )
                }
                return it
            }
        ))
    )
    declDependenciesCollector.convert(decl).forEach(it => {
        if (isSourceDecl(it) && (PeerGeneratorConfig.needInterfaces || isSyntheticDeclaration(it))) {
            addSyntheticDeclarationDependency(decl, convertDeclToFeature(peerLibrary, it))
        }
    })
    return decl
}

export class ArkTSTypeNodeNameConvertorWithDepsCollector implements TypeNodeNameConvertor {
    private readonly depsCollector = new ArkTSTypeDepsCollector(this.peerLibrary, true,
        lazy(() => this.declDependenciesCollector))

    constructor(private readonly convertor: TypeNodeNameConvertor,
                private readonly peerLibrary: PeerLibrary,
                private readonly declDependenciesCollector: DeclarationDependenciesCollector,
                private readonly importFeatures: ImportFeature[]) {
    }
    convertUnion(node: ts.UnionTypeNode): string {
        return this.convertor.convertUnion(node)
    }
    convertTypeLiteral(node: ts.TypeLiteralNode): string {
        this.depsCollector.convertTypeLiteral(node).forEach(it => this.addDeclToImports(it))
        return this.convertor.convertTypeLiteral(node)
    }
    convertLiteralType(node: ts.LiteralTypeNode): string {
        this.depsCollector.convertLiteralType(node).forEach(it => this.addDeclToImports(it))
        return this.convertor.convertLiteralType(node)
    }
    convertTuple(node: ts.TupleTypeNode): string {
        return this.convertor.convertTuple(node)
    }
    convertNamedTupleMember(node: ts.NamedTupleMember): string {
        return this.convertor.convertNamedTupleMember(node)
    }
    convertArray(node: ts.ArrayTypeNode): string {
        return this.convertor.convertArray(node)
    }
    convertOptional(node: ts.OptionalTypeNode): string {
        return this.convertor.convertOptional(node)
    }
    convertFunction(node: ts.FunctionTypeNode): string {
        return this.convertor.convertFunction(node)
    }
    convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): string {
        return this.convertor.convertTemplateLiteral(node)
    }
    convertImport(node: ts.ImportTypeNode): string {
        return this.convertor.convertImport(node)
    }
    convertTypeReference(node: ts.TypeReferenceNode): string {
        return this.convertor.convertTypeReference(node)
    }
    convertParenthesized(node: ts.ParenthesizedTypeNode): string {
        return this.convertor.convertParenthesized(node)
    }
    convertIndexedAccess(node: ts.IndexedAccessTypeNode): string {
        return this.convertor.convertIndexedAccess(node)
    }
    convertStringKeyword(node: ts.TypeNode): string {
        return this.convertor.convertStringKeyword(node)
    }
    convertNumberKeyword(node: ts.TypeNode): string {
        return this.convertor.convertNumberKeyword(node)
    }
    convertBooleanKeyword(node: ts.TypeNode): string {
        return this.convertor.convertBooleanKeyword(node)
    }
    convertUndefinedKeyword(node: ts.TypeNode): string {
        return this.convertor.convertUndefinedKeyword(node)
    }
    convertVoidKeyword(node: ts.TypeNode): string {
        return this.convertor.convertVoidKeyword(node)
    }
    convertObjectKeyword(node: ts.TypeNode): string {
        return this.convertor.convertObjectKeyword(node)
    }
    convertAnyKeyword(node: ts.TypeNode): string {
        return this.convertor.convertAnyKeyword(node)
    }
    convertUnknownKeyword(node: ts.TypeNode): string {
        return this.convertor.convertUnknownKeyword(node)
    }
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
    private addDeclToImports(decl: ts.Declaration) {
        if (isSourceDecl(decl)) {
            this.importFeatures.push(convertDeclToFeature(this.peerLibrary, decl))
        }
    }
}