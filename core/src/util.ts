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

import * as path from 'path'
import * as fs from "fs"
import * as ts from "typescript"
import * as idl from "./idl"
import { Language } from './Language'
import { generatorConfiguration } from './config'

export interface NameWithType {
    name?: ts.DeclarationName
    type?: ts.TypeNode
}

/** True if this is visible outside this file, false otherwise */
export function isNodePublic(node: ts.Node): boolean {
    return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Public) !== 0
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
    if (ts.isQualifiedName(node)) return `${identName(node.left)}.${identName(node.right)}`
    if (ts.isStringLiteral(node)) return node.text
    if (ts.isTypeReferenceNode(node)) return `${ts.SyntaxKind[node.kind]}(${asString(node.typeName)})`
    if (ts.isImportTypeNode(node)) return `${ts.SyntaxKind[node.kind]}(${asString(node.qualifier)})`
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

export function findRealDeclarations(typechecker: ts.TypeChecker, node: ts.Node): ts.Declaration[] {
    const declarations = getDeclarationsByNode(typechecker, node)
    const first = declarations[0]
    if (first && ts.isExportAssignment(first)) {
        return findRealDeclarations(typechecker, first.expression)
    } else {
        return declarations
    }
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
            if (clause && ts.isNamedExportBindings(clause) && ts.isNamedExports(clause)) {
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

function hasModifier(modifierLikes: ts.NodeArray<ts.ModifierLike> | readonly ts.Modifier[] | undefined, modifier: ts.SyntaxKind): boolean {
    return modifierLikes?.find(it => it.kind === modifier) != undefined
}

export function isReadonly(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.ReadonlyKeyword)
}

export function isExport(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.ExportKeyword)
}

export function isAbstract(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.AbstractKeyword)
}

export function isStatic(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.StaticKeyword)
}

export function isAsync(modifierLikes: ts.NodeArray<ts.ModifierLike> | readonly ts.Modifier[] | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.AsyncKeyword)
}

export function isPrivate(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined) {
    return hasModifier(modifierLikes, ts.SyntaxKind.PrivateKeyword)
}

export function isProtected(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined) {
    return hasModifier(modifierLikes, ts.SyntaxKind.ProtectedKeyword)
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

export function capitalizeConstantName(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

export function dropLast(text: string, chars: number): string {
    return text.substring(0, text.length - chars)
}

export function dropSuffix(text: string, suffix: string): string {
    if (!text.endsWith(suffix)) return text
    return dropLast(text, suffix.length)
}

export type stringOrNone = string | undefined

export function toSet(option: string | undefined): Set<string> {
    let set = new Set<string>()
    if (option) {
        option
            .split(",")
            .forEach(it => set.add(it))
    }
    return set
}

export function getOrPut<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V {
    const gotten = map.get(key)
    if (gotten) {
        return gotten
    }
    const created = create(key)
    map.set(key, created)
    return created
}

export function indentedBy(input: string, indentedBy: number): string {
    if (input.length > 0 || input.endsWith('\n')) {
        let space = ""
        for (let i = 0; i < indentedBy; i++) space += "    "
        return `${space}${input}`
    } else {
        return ""
    }
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

export function typeName(type: ts.TypeReferenceNode | ts.TypeQueryNode | ts.ImportTypeNode): string | undefined {
    const entityName = typeEntityName(type)
    if (!entityName) return undefined
    if (ts.isIdentifier(entityName)) return ts.idText(entityName as ts.Identifier)
    if (ts.isQualifiedName(entityName)) {
        // a.b.c is QualifiedName((QualifiedName a, b), c) so the right one is always an Identifier?
        if (!ts.isIdentifier(entityName.right)) throw new Error(`Unexpected right of QualifiedName ${asString(entityName.right)}`)
        return ts.idText(entityName.right)
    }
}

export function typeEntityName(type: ts.TypeReferenceNode | ts.TypeQueryNode | ts.ImportTypeNode): ts.EntityName | undefined {
    if (ts.isTypeReferenceNode(type)) return type.typeName
    if (ts.isTypeQueryNode(type)) return type.exprName
    if (ts.isImportTypeNode(type)) return type.qualifier
    throw new Error("unsupported")
}

export function zip<A, B>(left: readonly A[], right: readonly B[]): [A, B][] {
    if (left.length != right.length) throw new Error("Arrays of different length")
    return left.map((_, i) => [left[i], right[i]])
}

export function zipStrip<A, B>(left: readonly A[], right: readonly B[]): [A, B][] {
    const result: [A, B][] = []
    for (let i = 0; i < left.length && i < right.length; ++i) {
        result.push([left[i], right[i]])
    }
    return result
}

export function identNameWithNamespace(node: ts.Node, language: Language): string {
    let parent = node.parent
    while (parent && !ts.isModuleDeclaration(parent)) parent = parent.parent
    if (parent) {
        const separator = language === Language.CPP ? '_' : '.'
        return `${identName(parent.name)}${separator}${identName(node)}`
    } else {
        return identName(node)!
    }
}

export function identName(node: ts.Node | undefined): string | undefined {
    if (!node) return undefined
    if (node.kind == ts.SyntaxKind.AnyKeyword) return `any`
    if (node.kind == ts.SyntaxKind.ObjectKeyword) return `object`
    if (node.kind == ts.SyntaxKind.StringKeyword) return `string`
    if (node.kind == ts.SyntaxKind.BooleanKeyword) return `boolean`
    if (node.kind == ts.SyntaxKind.BigIntKeyword) return `bigint`
    if (node.kind == ts.SyntaxKind.NumberKeyword) return `number`
    if (node.kind == ts.SyntaxKind.VoidKeyword) return `void`
    if (node.kind == ts.SyntaxKind.UndefinedKeyword) return `undefined`

    if (ts.isThisTypeNode(node)) {
        return 'this'
    }
    if (ts.isVariableDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isTypeReferenceNode(node)) {
        return identString(node.typeName)
    }
    if (ts.isArrayTypeNode(node)) {
        return `Array`
    }
    if (ts.isQualifiedName(node)) {
        return identName(node.right)
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
    if (ts.isMethodDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isEnumDeclaration(node)) {
        return identString(node.name)
    }
    if (ts.isEnumMember(node)) {
        return identString(node.name)
    }
    if (ts.isComputedPropertyName(node)) {
        return identString(node)
    }
    if (ts.isExportAssignment(node)) {
        return node.expression.getText()
    }
    if (ts.isUnionTypeNode(node)) {
        return `UnionType`
    }
    if (ts.isFunctionTypeNode(node)) {
        return `FunctionType`
    }
    if (ts.isIdentifier(node)) return identString(node)
    if (ts.isImportTypeNode(node)) return `imported ${identString(node.qualifier)}`
    if (ts.isTypeLiteralNode(node)) return `TypeLiteral`
    if (ts.isTupleTypeNode(node)) return `TupleType`
    if (ts.isIndexSignatureDeclaration(node)) return `IndexSignature`
    if (ts.isIndexedAccessTypeNode(node)) return `IndexedAccess`
    if (ts.isTemplateLiteralTypeNode(node)) return `TemplateLiteral`
    if (ts.isParameter(node)) return `Parameter`
    if (ts.isParenthesizedTypeNode(node)) return identName(node.type)
    if (ts.isIntersectionTypeNode(node)) return node.types.map(it => identName(it)).join("&")
    if (node.kind === ts.SyntaxKind.UnknownKeyword) return `UnknownKeyword`
    throw new Error(`Unknown: ${ts.SyntaxKind[node.kind]}`)
}

export function identString(node: ts.Identifier | ts.PrivateIdentifier | ts.StringLiteral | ts.QualifiedName | ts.NumericLiteral | ts.ComputedPropertyName | ts.BindingName | undefined): string | undefined {
    if (!node) return undefined
    if (ts.isStringLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return node.text
    if (ts.isIdentifier(node)) return ts.idText(node)
    if (ts.isQualifiedName(node)) return `${identString(node.left)}.${identName(node.right)}`
    if (ts.isComputedPropertyName(node)) return "<computed property>"

    throw new Error("Unknown")
}

export const defaultCompilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    noLib: true,
    types: []
}

export function serializerBaseMethods(): string[] {
    const program = ts.createProgram([
        "./utils/ts/SerializerBase.ts",
        "./utils/ts/types.ts",
    ], defaultCompilerOptions)

    const serializerDecl = program.getSourceFiles()
        .find(it => it.fileName.includes("SerializerBase"))
    // TODO: pack classes with npm package
    if (serializerDecl === undefined) return []

    const methods: string[] = []
    visit(serializerDecl)
    return methods

    function visit(node: ts.Node) {
        if (ts.isSourceFile(node)) node.statements.forEach(visit)
        if (ts.isClassDeclaration(node)) node.members.filter(ts.isMethodDeclaration).forEach(visit)
        if (ts.isMethodDeclaration(node)) methods.push(node.name.getText(serializerDecl))
    }
}

export function getNameWithoutQualifiersRight(node: ts.EntityName | undefined): string | undefined {
    if (!node) return undefined
    if (ts.isQualifiedName(node)) {
        return identName(node.right)
    }
    if (ts.isIdentifier(node)) {
        return identName(node)
    }
    throw new Error("Impossible")
}

export function getNameWithoutQualifiersLeft(node: ts.EntityName | undefined): string | undefined {
    if (!node) return undefined
    if (ts.isQualifiedName(node)) {
        return identName(node.left)
    }
    if (ts.isIdentifier(node)) {
        return identName(node)
    }
    throw new Error("Impossible")
}

export function snakeCaseToCamelCase(input: string, tailToLowerCase: boolean = false): string {
    return input
        .split("_")
        .map(it => capitalize(tailToLowerCase ? it.toLowerCase() : it))
        .join("")
}

export function toCamelCase(input: string): string {
    return input
        .replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))
        .replace(/^[A-Z]/, match => match.toLowerCase());
}

export function isUpperCase(s: string): boolean {
    return s === s.toUpperCase()
}

function isLowerCase(s: string): boolean {
    return s === s.toLowerCase()
}

function isDigit(s: string): boolean {
    return s >= '0' && s <= '9'
}

export function camelCaseToUpperSnakeCase(input: string) {

    function boundaryFromLowerToUpperCase(s1: string, s2: string): string {
        return s2 !== undefined && (isLowerCase(s1) && !isDigit(s1)) && (isUpperCase(s2)) ? '_' : ''
    }

    function toUpperSnakeCase(s: string): string {
        return Array.from(s)
            .map((c, i) => `${c.toUpperCase()}${boundaryFromLowerToUpperCase(c, s[i + 1])}`)
            .join('')
    }

    return input.split('_')
        .filter(s => s !== "")
        .map(s => toUpperSnakeCase(s))
        .join('_')
}

export function snakeToLowCamelNode(node: idl.IDLEntry): string {
    if (!node.fileName) {
        throw new Error("Invalid Convert")
    }
    const classname = path.basename(node.fileName).replace(".idl", "").replace(".d.ts", "")
    return classname
        .split('_')
        .filter(word => word !== '')
        .map((word, index) => {
            if (index === 0) {
                return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

export function renameDtsToPeer(fileName: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(fileName))
        .replace(".d.ts", "")
        .replace(".idl", "")
        .concat("Peer")
    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameDtsToComponent(fileName: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(fileName))
        .replace(".d.ts", "")
        .replace(".idl", "")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameDtsToInterfaces(fileName: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(fileName), "Interfaces")
        .replace(".d.ts", "")
        .replace(".idl", "")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameClassToBuilderClass(className: string, language: Language, withFileExtension: boolean = true) {
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(className))
        .concat("Builder")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function renameClassToMaterialized(className: string, language: Language, withFileExtension: boolean = true) {

    const name = className.endsWith("Internal") ? className.substring(0, className.length - "Internal".length) : className
    const renamed = "Ark"
        .concat(snakeCaseToCamelCase(name))
        .concat("Materialized")

    if (withFileExtension) {
        return renamed.concat(language.extension)
    }
    return renamed
}

export function importTypeName(type: ts.ImportTypeNode, asType = false): string {
    return asType ? "object" : identName(type.qualifier)!
}

export function throwException(message: string): never {
    throw new Error(message)
}

export function className(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
    return nameOrNull(node.name) ?? throwException(`Nameless component ${asString(node)}`)
}

/**
 * Add a prefix to an enum value which camel case name coincidence
 * with the the same upper case name for an another enum value
 */
export function nameEnumValues(enumTarget: string[]): string[] {
    const prefix = "LEGACY"
    const nameToIndex = new Map<string, number>()
    enumTarget.forEach((name, index) => {
            let upperCaseName: string
            if (isUpperCase(name)) {
                upperCaseName = name
                const i = nameToIndex.get(upperCaseName)
                if (i !== undefined) {
                    nameToIndex.set(`${prefix}_${upperCaseName}`, i)
                }
            } else {
                upperCaseName = camelCaseToUpperSnakeCase(name)
                if (nameToIndex.has(upperCaseName)) {
                    upperCaseName = `${prefix}_${upperCaseName}`
                }
            }
            nameToIndex.set(upperCaseName, index)
        })
    const enumValues = new Array<string>(nameToIndex.size)
    for (const [name, index] of nameToIndex.entries()) {
        enumValues[index] = name
    }
    return enumValues
}

export function groupBy<K, V>(values: V[], selector: (value: V) => K): Map<K, V[]> {
    const map = new Map<K, V[]>()
    values.forEach(value => {
        const key = selector(value)
        getOrPut(map, key, it => []).push(value)
    })
    return map
}

export function groupByIndexed<K, V>(values: V[], selector: (value: V) => K): Map<K, [V, number][]> {
    const map = new Map<K, [V, number][]>()
    values.forEach((it, index) =>
        getOrPut(map, selector(it), () => [])
            .push([it, index])
    )
    return map
}

export function removeExt(filename: string) {
    return filename.replaceAll(path.extname(filename), '')
}

export function warn(message: string) {
    console.log(`WARNING: ${message}`)
}

export function hashCodeFromString(value: string): number {
    let hash = 5381
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 33) ^ value.charCodeAt(i)
        hash |= 0
    }
    return hash
}

export function forceWriteFile(filePath: string, content: string): void {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, content)
}

export function findVersion() {
    if (process.env.npm_package_version) return process.env.npm_package_version
    let packageJson = path.join(__dirname, '..', 'package.json')
    try {
        let json = fs.readFileSync(packageJson).toString()
        return json ? JSON.parse(json).version : undefined
    } catch (e) {
        return undefined
    }
}

export function zipMany<T>(...xs: T[][]): Array<Array<T | undefined>> {
    const max = xs.reduce((max, it) => it.length > max ? it.length : max, 0)
    const result: Array<Array<T | undefined>> = []
    for (let i = 0; i < max; ++i) {
        const row: Array<undefined | T> = []
        for (const x of xs) {
            const element = i < x.length
                ? x[i]
                : undefined
            row.push(element)
        }
        result.push(row)
    }
    return result
}

export class Lazy<T> {
    private readonly factory: () => T
    constructor(factory: () => T) {
        this.factory = factory
    }

    private instantiated: boolean = false
    private instance: T | undefined
    get value(): T {
        if (!this.instantiated) {
            this.instance = this.factory()
            this.instantiated = true
        }
        return this.instance as T
    }
}

export function lazy<T>(factory: () => T): Lazy<T> {
    return new Lazy(factory)
}

export function isInNamespace(node: idl.IDLEntry): boolean {
    return idl.getNamespacesPathFor(node).length > 0
}

export function rightmostIndexOf<T>(array: T[], predicate: (value: T) => boolean): number {
    let result = -1
    array.forEach((it, index) => {
        if (predicate(it)) {
            result = index
        }
    })
    return result
}

type StringProperties<T> = {
    [Property in keyof T as (T[Property] extends string ? Property : never)]: T[Property]
}

// sort array using external key function or internal string property
export function sorted<T, N extends keyof StringProperties<T>>(array: T[], key: ((value: T) => string) | N): T[] {
    const comparator = new Intl.Collator()
    if (typeof key === "function") {
        return array.map(it => { return { sortKey: key(it), value: it } })
            .sort((a, b) => comparator.compare(a.sortKey, b.sortKey))
            .map(it => it.value)
    }
    return array.map(it => it)
        .sort((a, b) => comparator.compare(a[key] as string, b[key] as string))
}

export function getExtractorName(target: idl.IDLInterface, language: Language, toPtr: boolean = true): string {
    // TODO: Update for CJ
    return toPtr ? `to${target.name}Ptr` : `from${target.name}Ptr`
}

export function getExternalTypePackage(node: idl.IDLEntry): string | undefined {
    if (!idl.isInterface(node)) return undefined
    const pack = idl.getPackageName(node)
    if (generatorConfiguration().externalPackages.includes(pack)) return `@${pack}`
    return generatorConfiguration().externalTypes.get(node.name)
}
