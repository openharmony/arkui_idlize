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

import * as ts from "typescript"
import { PeerGeneratorConfig } from "./peer-generation/PeerGeneratorConfig"

// Several things stolen from our memo plugin
// for easier life

export interface NameWithType {
    name?: ts.DeclarationName
    type?: ts.TypeNode
}

/** True if this is visible outside this file, false otherwise */
export function isNodePublic(node: ts.Node): boolean {
    return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Public) !== 0
}

const keywords = new Map<string, string>(
    [
        ["callback", "callback_"],
        ["object", "object_"],
        ["attribute", "attribute_"],
    ]
)

export function nameOrNullForIdl(name: ts.EntityName | ts.DeclarationName | undefined): string | undefined {
    if (name == undefined) return undefined

    if (ts.isIdentifier(name)) {
        let rawName = ts.idText(name)
        return keywords.get(rawName) ?? rawName
    }

    return undefined
}

export function nameOrNull(name: ts.EntityName | ts.DeclarationName | undefined): string | undefined {
    if (name == undefined) return undefined
    if (ts.isIdentifier(name)) {
        return ts.idText(name)
    }
    return undefined
}


export function isNamedDeclaration(node: ts.Node): node is ts.NamedDeclaration {
    return ("name" in node)
}

export function asString(node: ts.Node | undefined): string {
    if (node === undefined) return "undefined node"
    if (ts.isIdentifier(node)) return ts.idText(node)
    if (ts.isStringLiteral(node)) return node.text
    if (isNamedDeclaration(node)) {
        if (node.name === undefined) {
            return `${ts.SyntaxKind[node.kind]}(undefined name)`
        } else {
            return `${ts.SyntaxKind[node.kind]}(${asString(node.name)})`
        }
    } else {
        return `${ts.SyntaxKind[node.kind]}`
    }
}

export function arrayAt<T>(array: T[] | undefined, index: number): T | undefined {
    return array ? array[index >= 0 ? index : array.length + index] : undefined
}

export function getComment(sourceFile: ts.SourceFile, node: ts.Node): string {
    const commentRanges = ts.getLeadingCommentRanges(
        sourceFile.getFullText(),
        node.getFullStart()
    )

    if (!commentRanges) return ""

    return commentRanges
        .map(range => sourceFile.getFullText().slice(range.pos, range.end))
        .join("\n")
}

export function getSymbolByNode(typechecker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
    return typechecker.getSymbolAtLocation(node)
}

export function getDeclarationsByNode(typechecker: ts.TypeChecker, node: ts.Node): ts.Declaration[] {
    return getSymbolByNode(typechecker, node)?.getDeclarations() ?? []
}

export function getExportedDeclarationNameByDecl(declaration: ts.NamedDeclaration): string | undefined {
    let declName = declaration.name ? ts.idText(declaration.name as ts.Identifier) : undefined
    let current: ts.Node = declaration
    while (current != undefined && !ts.isSourceFile(current)) {
        current = current.parent
    }
    let source = current as ts.SourceFile
    let exportedName = declName
    source.forEachChild(it => {
        if (ts.isExportDeclaration(it)) {
            let clause = it.exportClause!
            if (ts.isNamedExportBindings(clause) && ts.isNamedExports(clause)) {
                clause.elements.forEach(it => {
                    let propName = it.propertyName ? ts.idText(it.propertyName) : undefined
                    let property = ts.idText(it.name)
                    if (propName == declName) {
                        exportedName = property
                    }
                })
            }
        }
    })
    return exportedName
}

export function getExportedDeclarationNameByNode(typechecker: ts.TypeChecker, node: ts.Node): string | undefined {
    let declarations = getDeclarationsByNode(typechecker, node)
    if (declarations.length == 0) return undefined
    return getExportedDeclarationNameByDecl(declarations[0])
}

export function isReadonly(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return modifierLikes?.find(it => it.kind == ts.SyntaxKind.ReadonlyKeyword) != undefined
}

export function isStatic(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return modifierLikes?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) != undefined
}

export function getLineNumberString(sourceFile: ts.SourceFile, position: number): string {
    let pos = ts.getLineAndCharacterOfPosition(sourceFile, position)
    return `${pos.line + 1}:${pos.character}`
}

export function isDefined<T>(value: T | null | undefined): value is T {
    return !!value
}

export function capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function dropLast(text: string, chars: number): string {
    return text.substring(0, text.length - chars)
}

export function dropSuffix(text: string, suffix: string): string {
    if (!text.endsWith(suffix)) return text
    return dropLast(text, suffix.length)
}

export type stringOrNone = string | undefined

export function isCommonMethodOrSubclass(typeChecker: ts.TypeChecker, decl: ts.ClassDeclaration): boolean {
    let name = asString(decl.name)
    let isRoot = PeerGeneratorConfig.rootComponents.includes(name)
    decl.heritageClauses?.forEach(it => {
        heritageDeclarations(typeChecker, it).forEach(it => {
            let name = asString(it.name)
            isRoot = isRoot || PeerGeneratorConfig.rootComponents.includes(name)
            if (!ts.isClassDeclaration(it)) return
            isRoot = isRoot || isCommonMethodOrSubclass(typeChecker, it)
        })
    })
    return isRoot
}

export function toSet(option: string | undefined): Set<string> {
    let set = new Set<string>()
    if (option) {
        option
            .split(",")
            .forEach(it => set.add(it))
    }
    return set
}

export function indentedBy(input: string, indentedBy: number): string {
    let space = ""
    for (let i = 0; i < indentedBy; i++) space += "  "
    return `${space}${input}`
}

export function typeOrUndefined(type: ts.TypeNode): ts.TypeNode {
    let needUndefined = true
    if (ts.isUnionTypeNode(type)) {
        type.types?.forEach(it => {
            if (it.kind == ts.SyntaxKind.UndefinedKeyword) needUndefined = false
        })
    }
    if (!needUndefined) return type
    return ts.factory.createUnionTypeNode([
        type,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
    ])
}

export function forEachExpanding<T>(array: T[], action: (element: T) => void): void {
    let i = 0
    while (true) {
        if (i === array.length) break
        action(array[i])
        i += 1
    }
}

export function isTypeParamSuitableType(type: ts.TypeNode): boolean {
    if (ts.isTypeReferenceNode(type)) {
        return !['boolean', 'number', 'string', 'undefined', 'any'].includes(type.typeName.getText())
    }
    return false
}

export function heritageTypes(typechecker: ts.TypeChecker, clause: ts.HeritageClause): ts.TypeReferenceNode[] {
    return clause
        .types
        .map(it => {
            let type = typechecker.getTypeAtLocation(it.expression)
            let typeNode = typechecker.typeToTypeNode(type, undefined, ts.NodeBuilderFlags.NoTruncation)
            if (typeNode && ts.isTypeReferenceNode(typeNode)) return typeNode
            return undefined
        })
        .filter(it => it != undefined) as ts.TypeReferenceNode[]
}

export function heritageDeclarations(typechecker: ts.TypeChecker, clause: ts.HeritageClause): ts.NamedDeclaration[] {
    return clause
        .types
        .map(it => {
            let decls = getDeclarationsByNode(typechecker, it.expression)
            return decls[0] ?? undefined
        })
        .filter(isDefined)
}

export function typeName(type: ts.TypeReferenceNode|ts.TypeQueryNode): string {
    if (ts.isTypeReferenceNode(type)) return ts.idText(type.typeName as ts.Identifier)
    if (ts.isTypeQueryNode(type)) return ts.idText(type.exprName as ts.Identifier)
    throw new Error("unsupported")
}

export function identName(node: ts.Node | undefined): string | undefined {
    if (!node) return undefined
    if (node.kind == ts.SyntaxKind.AnyKeyword) return `any`
    if (node.kind == ts.SyntaxKind.ObjectKeyword) return `object`
    if (ts.isTypeReferenceNode(node)) {
        return identString(node.typeName)
    }
    if (ts.isModuleDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isFunctionDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isPropertyDeclaration(node)) {
        // TODO: mention parent's name
        return identString(node.name)
    }
    if (ts.isInterfaceDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isClassDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isEnumMember(node)) {
        return identString(node.name)
    }
    if (ts.isComputedPropertyName(node)) {
        return identString(node)
    }
    if (ts.isIdentifier(node)) return identString(node)
    if (ts.isImportTypeNode(node)) return `imported ${identString(node.qualifier)}`
    if (ts.isTypeLiteralNode(node)) return `TypeLiteral`
    if (ts.isTupleTypeNode(node)) return `TupleType`
    if (ts.isIndexSignatureDeclaration(node)) return `IndexSignature`
    if (ts.isIndexedAccessTypeNode(node)) return `IndexedAccess`
    if (ts.isTemplateLiteralTypeNode(node)) return `TemplateLiteral`
    throw new Error(`Unknown: ${asString(node)} ${node.kind}`)
}

function identString(node: ts.Identifier | ts.PrivateIdentifier | ts.StringLiteral | ts.QualifiedName |  ts.NumericLiteral | ts.ComputedPropertyName  | undefined): string | undefined {
    if (!node) return undefined
    if (ts.isStringLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return node.text
    if (ts.isIdentifier(node)) return ts.idText(node)
    if (ts.isQualifiedName(node)) return `${identString(node.left)}.${identName(node.right)}`
    if (ts.isComputedPropertyName(node)) return "<computed property>"

    throw new Error("Unknown")
}
