/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as fs from "node:fs"
import * as path from "node:path"
import * as ts from "typescript"
import { isDefined, isRoot } from "@idlizer/core"

// WARNING! Code in this file is copied from dtsgen to aware adding dependency to it

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

export function getSymbolByNode(typechecker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
    return typechecker.getSymbolAtLocation(node)
}

export function getDeclarationsByNode(typechecker: ts.TypeChecker, node: ts.Node): ts.Declaration[] {
    return getSymbolByNode(typechecker, node)?.getDeclarations() ?? []
}

function hasModifier(modifierLikes: ts.NodeArray<ts.ModifierLike> | readonly ts.Modifier[] | undefined, modifier: ts.SyntaxKind): boolean {
    return modifierLikes?.find(it => it.kind === modifier) != undefined
}

export function isAbstract(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.AbstractKeyword)
}

export function isStatic(modifierLikes: ts.NodeArray<ts.ModifierLike> | undefined): boolean {
    return hasModifier(modifierLikes, ts.SyntaxKind.StaticKeyword)
}

export function getLineNumberString(sourceFile: ts.SourceFile, position: number): string {
    let pos = ts.getLineAndCharacterOfPosition(sourceFile, position)
    return `${pos.line + 1}:${pos.character}`
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

export function isCommonMethodOrSubclass(typeChecker: ts.TypeChecker, decl: ts.ClassDeclaration): boolean {
    let name = identName(decl.name)!
    let isSubclass = isRoot(name) 
    decl.heritageClauses?.forEach(it => {
        heritageDeclarations(typeChecker, it).forEach(it => {
            let name = asString(it.name)
            isSubclass = isSubclass || isRoot(name)
            if (!ts.isClassDeclaration(it)) return isSubclass
            isSubclass = isSubclass || isCommonMethodOrSubclass(typeChecker, it)
        })
    })
    return isSubclass
}

export interface GenerateVisitor<T> {
    visitPhase1(): T
    visitPhase2?(siblings: { [key in string]: { tsSourceFile: ts.SourceFile, visitor: GenerateVisitor<T>, result: T, isAux: boolean }}): T
}

function fileExists(fileName: string): boolean {
    return ts.sys.fileExists(fileName);
}

export interface GenerateOptions<T> {
    compilerOptions: ts.CompilerOptions
    onBegin?: (outDir: string, typeChecker: ts.TypeChecker) => void
    onSingleFile?: (entries: T, outDir: string, inputFile: ts.SourceFile, isAux: boolean) => void
    onEnd?: (outDir: string) => void
    enableLog?: boolean
    recursive?: boolean
}

export function generate<T>(
    baseDirs: string[],
    lookupDirs: string[],
    inputFiles: string[],
    auxInputFiles: string[],
    outputDir: string,
    stdlibFile: string,
    visitorFactory: (sourceFile: ts.SourceFile, program: ts.Program, compilerHost: ts.CompilerHost) => GenerateVisitor<T>,
    options: GenerateOptions<T>
): void {
    if (options.enableLog) {
        console.log("Starting generation process...")
    }

    if (inputFiles.length === 0) {
        console.error("Error: No input files specified.")
        process.exit(1)
    }

    let input: Set<string> = new Set<string>
    let auxInput: Set<string> = new Set<string>

    {
        const resolveOne = (file: string, tag: string) => {
            const fullPath = path.resolve(file)
            if (fs.existsSync(fullPath)) {
                if (options.enableLog)
                    console.log(`Including ${tag} file: ${fullPath}`)
                return fullPath
            } else
                console.warn(`Warning: ${tag} file does not exist: ${fullPath}`)
        }
        inputFiles.map(file => resolveOne(file, "file")).filter(isDefined).sort().map(file => input.add(file))
        auxInputFiles.map(file => resolveOne(file, "aux file")).filter(isDefined).sort().map(file => auxInput.add(file))
    }

    const compilerHostBase = ts.createCompilerHost(options.compilerOptions)
    const compilerHost: ts.CompilerHost = {
        ...compilerHostBase,
        resolveModuleNames: (moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions, containingSourceFile?: ts.SourceFile): (ts.ResolvedModule | undefined)[] => {
            const resolvedModules: (ts.ResolvedModule|undefined)[] = []
            for (let moduleName of moduleNames) {

                // TODO: move this replacement table to some external config...
                {
                    const replacement:{[key:string]:string} = {
                        "../component/navigation": "@internal/component/ets/navigation",
                        "wrappedBuilderObject": "@internal/component/ets/common",
                    }
                    moduleName = replacement[moduleName] || moduleName;
                }

                let result:ts.ResolvedModuleFull|undefined = ts.resolveModuleName(moduleName, containingFile, options, compilerHostBase).resolvedModule
                if (result)
                    resolvedModules.push(result)
                else {
                    // as a some fallback - try to resolve from parents of containingFile, lookupDirs
                    for(let pov of [path.dirname(containingFile), ...lookupDirs]) {
                        while (!result) {
                            for(const extension of ["", ".d.ts", ".d.ets"]) {
                                const candidate = `${moduleName}${extension}`;
                                if (path.isAbsolute(candidate) && fileExists(candidate)) {
                                    result = {resolvedFileName: candidate, extension: ts.Extension.Dts, isExternalLibraryImport: false}
                                    break
                                }
                                const povCandidate = path.join(pov, candidate)
                                if (fileExists(povCandidate)) {
                                    result = {resolvedFileName: povCandidate, extension: ts.Extension.Dts, isExternalLibraryImport: false}
                                    break
                                }
                            }
                            if (result)
                                break
                            result = ts.resolveModuleName(
                                path.join(pov, moduleName),
                                containingFile,
                                options,
                                compilerHostBase).resolvedModule
                            if (result)
                                break
                            result = ts.resolveModuleName(
                                moduleName,
                                pov,
                                options,
                                compilerHostBase).resolvedModule
                            if (result)
                                break
                            const nextPov = path.resolve(pov, "..")
                            if (nextPov == pov)
                                break
                            if (baseDirs.every(baseDir => path.relative(baseDir, nextPov).startsWith("..")))
                                break
                            pov = nextPov
                        }
                        if (result)
                            break
                    }
                    if (!result)
                        console.warn(`Dts import at '${containingFile}', module '${moduleName}': unable to resolve source file path`)
                    resolvedModules.push(result);
                }
            }
            return resolvedModules;
        }
    }

    if (!fs.existsSync(stdlibFile))
        throw new Error("Unable to find stdlib.d.ts")

    const program = ts.createProgram(
        [...input.values(), ...auxInput.values(), stdlibFile],
        options.compilerOptions,
        compilerHost
    )

    if (options.enableLog) {
        console.log("Initialized TypeScript program with input files:", input)
    }

    if (outputDir && !fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const typeChecker = program.getTypeChecker()
    options.onBegin?.(outputDir, typeChecker)

    type VisitorStaff = {
        tsSourceFile: ts.SourceFile,
        visitor: GenerateVisitor<T>,
        result: T,
        isAux: boolean
    }
    const dtsFileName2Visitor: { [key in string]: VisitorStaff } = {}
    for (const sourceFile of program.getSourceFiles()) {
        const resolvedSourceFileName = path.resolve(sourceFile.fileName)

        const isAux = !input.has(resolvedSourceFileName)
        if (options.enableLog) {
            console.log(`Processing ${isAux?"aux ":""}file: ${resolvedSourceFileName}`)
        }

        // Walk the tree to search for classes
        const visitor = visitorFactory(sourceFile, program, compilerHost)
        const result = visitor.visitPhase1()
        dtsFileName2Visitor[sourceFile.fileName] = {
            tsSourceFile: sourceFile,
            visitor,
            result,
            isAux: isAux
        }
    }

    for (const resolvedSourceFileName in dtsFileName2Visitor) {
        const visitorStaff = dtsFileName2Visitor[resolvedSourceFileName]
        if (visitorStaff.visitor.visitPhase2)
            visitorStaff.result = visitorStaff.visitor.visitPhase2(dtsFileName2Visitor)
    }

    for (const resolvedSourceFileName in dtsFileName2Visitor) {
        const visitorStaff = dtsFileName2Visitor[resolvedSourceFileName]
        options.onSingleFile?.(visitorStaff.result, outputDir, visitorStaff.tsSourceFile, visitorStaff.isAux)
    }

    options.onEnd?.(outputDir)

    if (options.enableLog) {
        console.log("Generation completed.")
    }
}
