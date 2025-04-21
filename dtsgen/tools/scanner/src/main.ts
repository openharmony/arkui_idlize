#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, normalize, resolve } from 'node:path'
import ts from 'typescript'

function removeQuote(line:string) {
    return line.replace(/(^["'])|(["']$)/g, '')
}

function scanDir(root:string): string[] {
    if (statSync(root).isDirectory()) {
        return readdirSync(root).map(it => join(root, it)).flatMap(scanDir)
    }
    return [root]
}

function action(fileName: string, node:ts.Node, put:(urls:[string, string]) => void) {
    if (ts.isImportDeclaration(node)) {
        put([fileName, removeQuote(node.moduleSpecifier.getText())])
    }
    if (ts.isImportTypeNode(node)) {
        put([fileName, removeQuote(node.argument.getText())])
    }
    if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) {
            put([fileName, removeQuote(node.moduleSpecifier.getText())])
        }
    }
}

function main(argv:string[]) {
    let ii = 0
    const visited = new Set<string>()
    let input = argv.slice(2).map(it => resolve(it)).flatMap(scanDir)
    while (ii < 10 && input.length) {
        console.log("ROUND", ii + 1)
        const candidates: [string, string][] = []
        const program = ts.createProgram(
            input,
            {
                noLib: true,
                skipLibCheck: true,
                skipDefaultLibCheck: true,
                types: []
            },
            ts.createCompilerHost({}, true)
        )
        program.getSourceFiles().forEach(sourceFile => {
            ts.forEachChild(sourceFile, node => {
                action(sourceFile.fileName, node, n => candidates.push(n))
                ts.forEachChild(node, it => action(sourceFile.fileName, it, n => candidates.push(n)))
            })
        })
        input.forEach(it => {
            visited.add(it)
        })
        input = []
        candidates.forEach(it => {
            const dir = dirname(it[0])
            const fileName = basename(it[1])
            let realImport = it[1]

            // hack rules
            if (it[1].startsWith('../api') && dir.endsWith('ets')) {
                realImport = join('..', '..', '..', it[1])
            }
            if (it[1].startsWith('../component') && dir.endsWith('api')) {
                realImport = join('@internal', 'component', 'ets', fileName)
            }
            if (fileName === 'wrappedBuilderObject') {
                return
            }

            const resolved = normalize(join(dir, realImport + '.d.ts'))
            if (!visited.has(resolved)) {
                if (existsSync(resolved)) {
                    input.push(resolved)
                } else {
                    process.exitCode = -1
                    console.log("      -> NOT EXISTS!")
                }
            }
        })
        ++ii
    }

    const visiterResult = Array.from(visited)
    visiterResult.sort()
    visiterResult.forEach(it => {
        console.log(it)
    })
}
main(process.argv)
