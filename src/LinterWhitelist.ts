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

import { LinterError, LinterMessage } from "./linter";

import * as fs from "fs"
import * as ts from "typescript"
import { asString } from "./util";

export class LinterWhitelist {
    suppressErrors = new Set<LinterError>()
    suppressIdentifiers = new Map<string, LinterError[]>()

    constructor(filename: string) {
        let content = fs.readFileSync(filename)?.toString()
        if (!content) throw new Error(`Cannot read whitelist file ${filename}`)
        let json = JSON.parse(content)
        if (!json) throw new Error(`Cannot parse whitelist file ${filename}`)
        if (json.suppressErrors) {
            (json.suppressErrors as string[]).forEach(it => {
                let error = this.linterError(it)
                if (error) this.suppressErrors.add(error)
            })
        }
        if (json.suppressIdentifiers) {
            let suppress = (json.suppressIdentifiers as Record<string, string[]>)
            Object.keys(suppress)
                .forEach(key => {
                    this.suppressIdentifiers.set(key,
                        suppress[key]
                            .map(it => this.linterError(it)!)
                            .filter(it => it != undefined)
                    )
                })
        }
        console.log(Array.from(this.suppressIdentifiers))
    }

    linterError(str: string | undefined): LinterError | undefined {
        if (!str) return undefined
        type Keys = keyof typeof LinterError;
        return LinterError[str as Keys]
    }

    shallSuppress(error: LinterMessage): boolean {
        if (this.suppressErrors.has(error.error)) return true
        let ident = identName(error.node)
        if (ident) {
            let suppressIdents = this.suppressIdentifiers.get(ident)
            if (suppressIdents && (suppressIdents.indexOf(error.error) >= 0)) {
                return true
            }
        }
        return false
    }
}

function identName(node: ts.Node): string | undefined {
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
