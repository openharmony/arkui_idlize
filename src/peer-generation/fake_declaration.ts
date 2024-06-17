import * as ts from 'typescript'

const fakeDeclarations: Map<string, {node: ts.Declaration, filename: string}> = new Map()
export function makeFakeDeclaration(targetFilename: string, declName: string, factory: () => ts.Declaration): ts.Declaration {
    if (!fakeDeclarations.has(declName))
        fakeDeclarations.set(declName, {node: factory(), filename: targetFilename})
    const decl = fakeDeclarations.get(declName)!
    if (decl.filename !== targetFilename)
        throw "Two declarations with same name were declared"
    return decl.node
}

export function makeFakeTypeAliasDeclaration(targetFilename: string, declName: string, type: ts.TypeNode): ts.TypeAliasDeclaration {
    const decl = makeFakeDeclaration(targetFilename, declName, () => {
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

export function isFakeDeclaration(node: ts.Declaration): boolean {
    for (const decl of fakeDeclarations.values())
        if (decl.node === node)
            return true
    return false
}

export function fakeDeclarationFilename(node: ts.Declaration): string {
    for (const decl of fakeDeclarations.values())
        if (decl.node === node)
            return decl.filename
    throw "Declaration is not fake"
}

export function makeFakeDeclarationsFiles(): Map<string, ts.Declaration[]> {
    const files = new Map<string, ts.Declaration[]>()
    for (const decl of fakeDeclarations.values()) {
        if (!files.has(decl.filename))
            files.set(decl.filename, [])
        files.get(decl.filename)!.push(decl.node)
    }
    return files
}