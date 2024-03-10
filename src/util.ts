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
import { EnumType } from "webidl2"

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

export function nameOrNull(name: ts.EntityName | ts.DeclarationName | undefined): string | undefined {
    if (name == undefined) return undefined

    if (ts.isIdentifier(name)) {
        let rawName = ts.idText(name)
        return keywords.get(rawName) ?? rawName
    }

    return undefined
}

export function isNamedDeclaration(node: ts.Node): node is ts.NamedDeclaration {
    return ("name" in node )
}

export function asString(node: ts.Node|undefined): string {
    if (node === undefined) return "undefined node"
    if (ts.isIdentifier(node)) return ts.idText(node)
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

export function arrayAt<T>(array: T[] | undefined, index: number): T|undefined {
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

export function getSymbolByNode(typechecker: ts.TypeChecker, node: ts.Node) : ts.Symbol|undefined {
    return typechecker.getSymbolAtLocation(node)
}

export function getDeclarationsByNode(typechecker: ts.TypeChecker, node: ts.Node) : ts.Declaration[] {
    return getSymbolByNode(typechecker, node)?.getDeclarations() ?? []
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

export type stringOrNone = string | undefined

export function isCommonAttribute(name: string): boolean {
    return name == "CommonMethod"
        || name == "CommonShapeMethod"
        || name == "ScrollableCommonMethod"
}

export function toSet(option: string|undefined): Set<string> {
    let set = new Set<string>()
    if (option) {
        option
            .split(",")
            .forEach(it => set.add(it))
    }
    return set
}

/*export function enumElementName<T: EnumType>(element: T): string {
    return Object.keys(T)[Object.values(T).indexOf(element)]
}*/

export function indentedBy(input: string, indentedBy: number): string {
    let space = ""
    for (let i = 0; i < indentedBy; i++) space += "  "
    return `${space}${input}`
}