import * as ts from 'typescript'
import { ImportFeature, ImportsCollector } from './ImportsCollector'

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

export function makeSyntheticTypeAliasDeclaration(targetFilename: string, declName: string, type: ts.TypeNode): ts.TypeAliasDeclaration {
    const decl = makeSyntheticDeclaration(targetFilename, declName, () => {
        return ts.factory.createTypeAliasDeclaration(
            undefined,
            declName,
            undefined,
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