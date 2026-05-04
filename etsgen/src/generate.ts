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

import {
    camelCaseToUpperSnakeCase,
    capitalize,
    collapseTypes,
    generateSyntheticFunctionName,
    generateSyntheticIdlNodeName,
    IDLFile,
    InteropModuleType,
    Language,
    nameEnumValues,
    PeerLibrary,
    throwException,
    zip
} from "@idlizer/core"
import * as arkts from "@koalaui/libarkts"
import * as idl from "@idlizer/core/idl"
import * as path from "node:path"
import * as fs from "node:fs"
import { ETSVisitorConfig } from "./config"

const MaxSyntheticTypeLength = 60

class StatusRecord {
    constructor(
        public fullPackage: string,
        public pkg: string,
        public parent: string,
        public name: string,
        public override: number,
        public type: string,
        public status: string,
        public src: string,
    ) {}

    ToString(): string {
        let statusStr = this.status ?? ''
        return `| ${this.fullPackage} | ${this.pkg} | ${this.parent} | ${this.name} | ${this.override} | ${this.type} | ${statusStr} | \`${this.src}\` |`
    }

    static Header(): string {
        return '| Full package | Package | Parent | Name | Override | Type | Status | Source |'
    }
}

class StatusTracker {
    status: StatusRecord[] = []
    od: Map<string, number> = new Map()
    enabled: boolean

    constructor(enabled: boolean) {
        this.enabled = enabled
    }

    Concat(src: StatusTracker) {
        this.status.push(...src.status)
    }

    Print(): string {
        return [StatusRecord.Header(), ...this.status.map(it => it.ToString())].join("\n")
    }
}

function processFile(program: arkts.Program, outDir: string, baseDir: string, configPath:string, config: ETSVisitorConfig, status: StatusTracker): IDLSuperFile {
    const file = program.absoluteName
    arkts.arktsGlobal.filePath = file

    const configText = fs.readFileSync(configPath, 'utf-8')
    const configContent = JSON.parse(configText)
    const paths = configContent.compilerOptions.paths ?? {};
    const pathMap = new Map()
    for (const key in paths) {
        pathMap.set(key, path.normalize(path.resolve(path.dirname(configPath), paths[key][0])))
    }
    let localStatus = new StatusTracker(status.enabled)
    let idlVisitor = new IDLVisitor(baseDir, file, pathMap, config, localStatus)
    if (config.DeletedPackages.some(deleted => idl.qualifiedNameStartsWith(idlVisitor.packageClause, deleted.split(".")))) {
        return {
            originalFileName: file,
            generatedFileName: idlVisitor.fileName,
            writeFilePath: idlVisitor.fileName,
            skipped: true,
            file: idl.createFile([]),
            exports: new Map,
            exportsAll: new Set
        }
    }
    idlVisitor.visitor(program.ast)
    const idlFile = idlVisitor.toIDLSuperFile()
    const fileRelativePath = path.relative(baseDir, file)
    const outFile = path.join(outDir, fileRelativePath.replace(".d.ets", ".idl"))
    const outFileDir = path.dirname(outFile)
    if (!fs.existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, { recursive: true })
    }
    if (!idlFile.file.entries.length) {
        idlFile.skipped = true
    }
    if (!idlFile.skipped) {
        fs.writeFileSync(outFile, idl.toIDLString(idlFile.file, {}), 'utf8')
    }
    idlFile.writeFilePath = outFile
    status.Concat(localStatus)
    return idlFile
}

export interface GenerateFromSTSContext {
    inputFiles: string[]
    baseDir: string
    outDir: string
    etsConfigPath: string
    config: ETSVisitorConfig
    traceStatus: string
}

export function generateFromSts({ inputFiles, baseDir, outDir, etsConfigPath, config, traceStatus }: GenerateFromSTSContext): PeerLibrary {
    if (!process.env.PANDA_SDK_PATH) {
        process.env.PANDA_SDK_PATH = path.resolve(__dirname, "../../external/incremental/tools/panda/node_modules/@panda/sdk")
    }
    arkts.checkSDK()
    if (!fs.existsSync(process.env.PANDA_SDK_PATH)) {
        throw new Error("PANDA_SDK_PATH points to unexisting directory")
    }
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }
    console.log(`Use Panda from ${process.env.PANDA_SDK_PATH}`)
    const doJob = processLogger(inputFiles.length)
    const library: IDLSuperFile[] = []
    let status = new StatusTracker(!!traceStatus)
    const failed: {
        error: unknown
        fileName: string
    }[] = []

    arkts.initVisitsTable()
    arkts.arktsGlobal.config = arkts.Config.create([
        '_',
        '--arktsconfig',
        etsConfigPath,
        inputFiles[0],
        '--extension',
        'ets',
        '--stdlib',
        path.join(process.env.PANDA_SDK_PATH as string, 'ets', 'stdlib'),
        '--output',
        'a.abc',
        '--simultaneous'
    ]).peer
    if (!arkts.global.configIsInitialized()) throw new Error(`Wrong config: path=${etsConfigPath}`);
    arkts.arktsGlobal.compilerContext = arkts.Context.createContextGenerateAbcForExternalSourceFiles(inputFiles)
    // arkts.global.isContextGenerateAbcForExternalSourceFiles = true;
    const options = arkts.Options.createOptions(new arkts.Config(arkts.global.config));
    arkts.global.arktsconfig = options.getArkTsConfig();

    arkts.proceedToState(arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
    const pluginContext = new arkts.PluginContextImpl()
    const program = arkts.arktsGlobal.compilerContext!.program
    arkts.runTransformer(program, arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED, (program, pluginContext, context) => {
        if (!inputFiles.includes(program.absoluteName))
            return
        try {
            doJob(program.absoluteName, () =>  {
                const idlFile = processFile(program, outDir, baseDir, etsConfigPath, config, status)
                if (config.DeletedPackages.includes(idlFile.file.packageClause.join("."))) {
                    console.log(`WARNING: Package ${idlFile.file.packageClause.join(".")} was deleted`)
                } else {
                    library.push(idlFile)
                }
                return idlFile
            })
        } catch (e: any) {
            console.log(e)
            if (e.trace)
                console.log(e.trace)
            // But current es2panda just forcefully exits.
            // throw e
            failed.push({
                error: e,
                fileName: program.absoluteName
            })
        }
    }, pluginContext, undefined)

    if (traceStatus) {
        fs.writeFileSync(traceStatus, status.Print())
    }
    console.log('Adjusting exports...')
    adjustExports(library, config)
    console.log('Adjusting imports...')
    const adjusted = adjustImports(library)
    const doAdjustJob = processLogger(adjusted.length)
    adjusted.forEach(file => {
        const fileName = file.writeFilePath
        doAdjustJob(fileName, () => {
            const outFileDir = path.dirname(fileName)
            if (!fs.existsSync(outFileDir)) {
                fs.mkdirSync(outFileDir, { recursive: true })
            }
            fs.writeFileSync(fileName, idl.toIDLString(file.file, {}), 'utf8')
            return file
        })
    })
    return new PeerLibrary(Language.ARKTS, InteropModuleType)
}

function adjustExports(library: IDLSuperFile[], config: ETSVisitorConfig): void {
    const adjustedFiles = new Set<IDLSuperFile>()
    const adjustInProgressFiles = new Set<IDLSuperFile>()
    const adjustFileExports = (file: IDLSuperFile) => {
        if (adjustedFiles.has(file))
            return
        if (adjustInProgressFiles.has(file)) {
            const stack = [...adjustInProgressFiles].map(it => it.file.packageClause.join("."))
            throw new Error(`Recursive reexports detected. Stack: ${stack}`)
        }
        adjustInProgressFiles.add(file)
        for (const reexportPackage of file.exportsAll) {
            const reexportedFile = library.find(it => it.file.packageClause.join(".") === reexportPackage)
            if (!reexportedFile) {
                if (config.DeletedPackages.includes(reexportPackage)) {
                    console.log(`WARNING: reexport from deleted package ${reexportPackage} found. Mistakes possible if those reexports were used.`)
                    continue
                } else {
                    throw new Error(`Failed to adjust reexport for package ${reexportPackage}: file not found`)
                }
            }
            adjustFileExports(reexportedFile)
            for (const entry of reexportedFile.file.entries) {
                if (idl.isTypedef(entry) || idl.isInterface(entry) || idl.isNamespace(entry)) {
                    file.exports.set(entry.name, reexportedFile.file.packageClause.concat(entry.name).join("."))
                }
            }
            for (const otherExport of reexportedFile.exports.entries()) {
                file.exports.set(otherExport[0], otherExport[1])
            }
        }
        adjustInProgressFiles.delete(file)
        adjustedFiles.add(file)
    }
    library.forEach(adjustFileExports)
}

function adjustImports(library: IDLSuperFile[]): IDLSuperFile[] {
    const map = new Map<string, IDLSuperFile[]>()
    library.forEach(file => {
        const pkg = file.file.packageClause.join('.')
        if (!map.has(pkg)) {
            map.set(pkg, [])
        }
        map.get(pkg)!.push(file)
    })

    const updatedFiles: IDLSuperFile[] = []
    library.forEach((file) => {
        let adjusted = false
        file.file.entries.forEach(entry => {
            if (!idl.isImport(entry)) {
                return
            }
            if (entry.name === "" || entry.clause.length < 2) {
                return
            }

            const fileClause = entry.clause.slice(0, entry.clause.length - 1)
            let fileClauseString = fileClause.join('.')
            let fileExportName = entry.clause.at(-1)!

            let oldFileClauseString = ''
            while (oldFileClauseString !== fileClauseString) {
                const referencedFiles = map.get(fileClauseString)
                if (!referencedFiles) {
                    break
                }
                oldFileClauseString = fileClauseString
                for (const refFile of referencedFiles) {
                    if (refFile.exports.has(fileExportName)) {
                        const clause = refFile.exports.get(fileExportName)!.split('.')
                        if (clause.length < 2) {
                            return
                        }
                        fileClauseString = clause.slice(0, clause.length - 1).join('.')
                        fileExportName = clause.at(-1)!
                        adjusted = true
                        break
                    }
                }
            }
            entry.clause = [...fileClauseString.split('.'), fileExportName]
        })
        if (adjusted) {
            updatedFiles.push(file)
        }
    })
    return updatedFiles
}

function processLogger(amount: number) {
    let done = 1
    return (fileName: string, op: () => IDLSuperFile) => {
        console.log(`[ ${done.toString()}/${amount.toString()} ] Processing ${fileName}`)
        try {
            const outFile = op()
            if (outFile.skipped) {
                console.log(`  ... skipped (file is empty)`)
            } else {
                console.log(`  ... saved to ${outFile.writeFilePath}`)
            }
        } catch (ex: unknown) {
            console.log(`  ... failed`)
            throw ex
        } finally {
            ++done
        }
    }
}

interface IDLSuperFile {
    originalFileName: string
    generatedFileName: string
    writeFilePath: string
    file: IDLFile
    skipped: boolean
    exports: Map<string, string>
    exportsAll: Set<string>
}

interface ExtractTypeParameterInfo {
    set: Set<string>
    parameters: string[] | undefined,
    defaults: idl.IDLType[] | undefined,
    attrs: idl.IDLExtendedAttribute[]
}

export class NameSuggestion {
    private suggestions: { name: string, forced: boolean }[] = []
    get name(): string {
        if (!this.hasSuggestion) throw new Error("Has not suggestions")
        return this.suggestions.at(-1)!.name
    }
    get forced(): boolean {
        if (!this.hasSuggestion) throw new Error("Has not suggestions")
        return this.suggestions.at(-1)!.forced
    }
    get hasSuggestion(): boolean {
        return this.suggestions.length > 0
    }

    suggest<T>(name: string, forced: boolean, op: () => T): T {
        this.suggestions.push({ name, forced })
        const result = op()
        this.suggestions.pop()
        return result
    }

    suggestWithTypePrefix<T>(name: string, op: () => T): T
    suggestWithTypePrefix<T>(name: string, forced: boolean, op: () => T): T
    suggestWithTypePrefix<T>(name: string, forcedOrOp: boolean | (() => T), op?: () => T): T {
        if (typeof forcedOrOp === 'function')
            return this.suggestWithTypePrefix(name, false, forcedOrOp)
        return this.suggest(`Type_${name}`, forcedOrOp, op!)
    }

    extend<T>(postfix: string, op: () => T): T
    extend<T>(postfix: string, forced: boolean, op: () => T): T
    extend<T>(postfix: string, forcedOrOp: boolean | (() => T), op?: () => T): T {
        if (typeof forcedOrOp === 'function')
            return this.extend(postfix, false, forcedOrOp)
        const prefix = this.hasSuggestion ? this.name! + "_" : ""
        return this.suggest(prefix + postfix, forcedOrOp, op!)
    }
}


class OverloadScopeVisitor extends arkts.AbstractVisitor{
    overloads: arkts.OverloadDeclaration[] = []

    visitor(node: arkts.AstNode): arkts.AstNode {
        if (arkts.isOverloadDeclaration(node)) {
            this.overloads.push(node)
        }
        if (arkts.isTSInterfaceBody(node) || arkts.isClassDefinition(node)) {
            this.visitEachChild(node)
        }
        return node
    }
}

export class OverloadScope {
    private overloads: { name: string, mangledNames: string[] }[] = []

    withVisit<T>(scope: arkts.AstNode, op: () => T): T {
        const visitor = new OverloadScopeVisitor
        visitor.visitEachChild(scope)
        return this.withArktsDeclarations(visitor.overloads, op)
    }

    withArktsDeclarations<T>(overloads: arkts.OverloadDeclaration[], op: () => T): T {
        if (!overloads.length)
            return op()
        for (const overload of overloads) {
            const mangledNames = overload.overloadedList.map(it => {
                if (!arkts.isIdentifier(it))
                    throw new Error("Expected element of overload to be an Identifier")
                return it.name
            })
            this.overloads.push({ name: overload.id!.name, mangledNames})
        }
        const result = op()
        for (const _ of overloads) {
            this.overloads.pop()
        }
        return result
    }

    find(mangledName: string): { name: string, mangledNames: string[] } | undefined {
        for (let i = this.overloads.length - 1; i >=0; i--) {
            const overload = this.overloads[i]
            if (overload.mangledNames.includes(mangledName))
                return overload
        }
        return undefined
    }
}

class IDLVisitor extends arkts.AbstractVisitor {
    //writer = new IDLLanguageWriter()
    entries: idl.IDLEntry[] = []
    fileName: string
    packageClause: string[] = []
    contextual: NameSuggestion = new NameSuggestion
    overloads: OverloadScope = new OverloadScope
    private contextualSelectName(synthetic: string): string {
        if (!this.contextual.hasSuggestion)
            return synthetic
        if (this.contextual.forced || synthetic.length > MaxSyntheticTypeLength)
            return this.contextual.name
        return synthetic
    }

    private processNodeStack: arkts.AstNode[] = []
    private processNode<T extends (...args: any[]) => any>(op: T, ...args: Parameters<T>): ReturnType<T> {
        this.processNodeStack.unshift(args[0])
        let result = op.call(this, ...args)
        this.processNodeStack.shift()
        return result
    }

    private defaultExportName?: string
    private typeParamsStack: Set<string>[] = []

    private fileReExports: Map<string, string> = new Map()
    private fileReExportsAll: Set<string> = new Set()

    private typeReplacements: Map<string, idl.IDLType>[] = []

    private detectPackageNameByPath(fileName: string): string[] {
        if (this.importPathMap.has(fileName)) {
            return this.detectPackageNameByPath(this.importPathMap.get(fileName)!)
        }
        if (!path.isAbsolute(fileName) && !fileName.startsWith(".")) {
            // assume that is absolute import
            return fileName
                .split(path.sep)
                .map(it => it.replaceAll('@', ''))
                .map(it => it.split('-').map((it, i) => i === 0 ? it : capitalize(it)).join('')) // kebab-case to camelCase
                .flatMap(it => it.split("."))
                .filter(it => it.length && it !== '.' && it !== '..')
        }
        return path.relative(this.basePath, fileName)
            .replaceAll('.d.ets', '')
            .replaceAll('.idl', '')
            .split(path.sep)
            .map(it => it.replaceAll('@', ''))
            .map(it => it.split('-').map((it, i) => i === 0 ? it : capitalize(it)).join('')) // kebab-case to camelCase
            .flatMap(it => it.split("."))
            .filter(it => it.length && it !== '.' && it !== '..')
    }

    private mode: 'regular' | 'arkoala' = 'arkoala'

    // Temporary fix
    private sanitizePromise(type:idl.IDLType): idl.IDLType {
        if (!idl.isUnionType(type)) {
            return type
        }
        let promiseType: idl.IDLType | undefined = undefined
        idl.forEachChild(type, (node) => {
            if (idl.isContainerType(node) && idl.IDLContainerUtils.isPromise(node)) {
                promiseType = node
            }
        })
        if (promiseType) {
            return promiseType
        }
        return type
    }

    constructor(
        protected basePath: string,
        protected originalFileName: string,
        protected importPathMap: Map<string, string>,
        protected config: ETSVisitorConfig,
        protected status: StatusTracker,
    ) {
        super()
        this.fileName = this.originalFileName.replace(".d.ets", ".idl")
        this.packageClause = this.detectPackageNameByPath(this.originalFileName)
    }
    visitor(node: arkts.AstNode): arkts.AstNode {
        return this.overloads.withVisit(node, () => {
            if (arkts.hasModifierFlag(node, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_DEFAULT_EXPORT)) {
                if (arkts.isTSInterfaceDeclaration(node)) {
                    this.defaultExportName = node.id!.name
                }
                if (arkts.isClassDeclaration(node)) {
                    this.defaultExportName = node.definition!.ident!.name
                }
                if (arkts.isTSModuleDeclaration(node)) {
                    this.defaultExportName = (node.name as arkts.Identifier).name // not sure about this
                }
                if (arkts.isETSModule(node)) {
                    this.defaultExportName = node.ident?.name
                }
            }

            if (arkts.isExportNamedDeclaration(node)) {
                if (arkts.hasModifierFlag(node, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_DEFAULT_EXPORT) && node.specifiers.length === 1) {
                    const [spec] = node.specifiers
                    this.defaultExportName = spec.local!.name
                }
            }
            if (arkts.isETSReExportDeclaration(node)) {
                let importString = node.eTSImportDeclarations!.source!.str
                if (importString.startsWith('.')) {
                    const currentFileBaseDir = path.dirname(this.originalFileName)
                    const importFilePath = path.normalize(path.join(currentFileBaseDir, importString))
                    importString = importFilePath
                }
                const importedPackageClause = this.detectPackageNameByPath(importString)
                node.eTSImportDeclarations!.specifiers.forEach(spec => {
                    if (arkts.isImportSpecifier(spec)) {
                        this.fileReExports.set(spec.local!.name, [...importedPackageClause, spec.imported!.name].join('.'))
                    }
                    if (arkts.isImportNamespaceSpecifier(spec)) {
                        if (spec.local?.name) {
                            throw new Error("`import * as smth` is not supported")
                        }
                        this.fileReExportsAll.add(importedPackageClause.join("."))
                    }
                })
            }
            if (arkts.isExportDefaultDeclaration(node)) {
                if (arkts.isIdentifier(node.decl)) {
                    this.defaultExportName = node.decl.name
                }
            }

            //////////////////

            if (arkts.isScriptFunction(node)) {
                return this.processNode(this.visitScriptFunction, node)
            }
            if (arkts.isClassDeclaration(node)) {
                return this.processNode(this.visitClassDeclaration, node)
            }
            if (arkts.isTSInterfaceDeclaration(node)) {
                return this.processNode(this.visitInterfaceDeclaration, node)
            }
            if (arkts.isImportDeclaration(node)) {
                return this.processNode(this.visitImportDeclaration, node)
            }
            if (arkts.isTSEnumDeclaration(node)) {
                return this.processNode(this.visitEnumDeclaration, node)
            }
            if (arkts.isTSTypeAliasDeclaration(node)) {
                return this.processNode(this.visitTSTypeAliasDeclaration, node)
            }
            if (arkts.isFunctionDeclaration(node)) {
                return this.processNode(this.visitFunctionDeclaration, node)
            }
            if (arkts.isETSModule(node) && node.isNamespace) {
                return this.processNode(this.visitETSModule, node)
            }
            if (arkts.isVariableDeclaration(node)) {
                return this.processNode(this.visitVariableDeclaration, node)
            }
            if (arkts.isAnnotationDeclaration(node)) {
                return this.processNode((node: arkts.AstNode) => {
                    this.traceDeleted('')
                    return node
                }, node)
            }

            //////////////////

            return this.visitEachChild(node)
        })
    }

    visitETSModule(node: arkts.ETSModule): arkts.ETSModule {
        const old = this.entries
        this.entries = []
        let extendedAttributes = this.traceAttrs()
        this.visitEachChild(node)
        const members = this.entries
        this.entries = old
        this.entries.push(idl.createNamespace(
            node.ident!.name,
            members,
            {
                extendedAttributes,
                fileName: this.fileName,
            }
        ))
        return node
    }

    visitEnumDeclaration(node: arkts.TSEnumDeclaration): arkts.TSEnumDeclaration {
        const name = node.key!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            this.traceDeleted('DeletedDeclarations')
            return node
        }
        let extendedAttributes = this.traceAttrs()
        let result = idl.createEnum(name, [], { extendedAttributes })
        let currentValue = 0
        let enumNames = nameEnumValues(node.members.map(it => (it as arkts.TSEnumMember).name))
        result.elements =
            node.members.map((it, index) => this.processNode((it, index) => {
                let element = (it as arkts.TSEnumMember)
                let [type, value] = this.convertEnumInitializer(element.init)
                if (typeof value === 'number')
                    currentValue = value + 1
                if (typeof value === 'undefined') {
                    value = currentValue
                    currentValue++
                }
                let extendedAttributes: idl.IDLExtendedAttribute[] = this.traceAttrs()
                if (enumNames[index] != element.name) {
                    extendedAttributes.push({ name: idl.IDLExtendedAttributes.OriginalEnumMemberName, value: element.name })
                }
                return idl.createEnumMember(enumNames[index], result, type, value, { extendedAttributes })
            }, it, index))
        this.entries.push(result)
        return node
    }

    visitVariableDeclaration(node: arkts.VariableDeclaration): arkts.VariableDeclaration {
        for (const decl of node.declarators) {
            const id = decl.id
            if (arkts.isIdentifier(id)) {
                const name = id.name
                id.typeAnnotation
                if (node.kind == arkts.Es2pandaVariableDeclarationKind.VARIABLE_DECLARATION_KIND_CONST) {
                    const [type, value] = this.guessTypeAndValue(name, id.typeAnnotation, decl.init)
                    let extendedAttributes = this.traceAttrs()
                    const result = idl.createConstant(name, type, value, {extendedAttributes})
                    this.entries.push(result)
                    continue
                }
            }
            this.traceDeleted('variable')
        }
        return node
    }

    convertEnumInitializer(expression: arkts.Expression | undefined): [idl.IDLPrimitiveType, string | number | undefined] {
        let initializer: string | number | undefined
        let type = idl.IDLNumberType
        if (!expression) {
            return [type, initializer]
        }
        if (arkts.isNumberLiteral(expression) && expression.str !== "") {
            initializer = parseInt(expression.str)
            if (Number.isNaN(initializer)) {
                throw new Error("Initializator is not number!")
            }
        }
        if (arkts.isStringLiteral(expression)) {
            initializer = expression.str
            type = idl.IDLStringType
        }
        if (arkts.isBinaryExpression(expression)) {
            const result = this.evaluateConstExpression(expression)
            if (result !== undefined) {
                initializer = result
            }
        }
        return [type, initializer]
    }

    evaluateConstExpression(expression: arkts.Expression): number | undefined {
        if (arkts.isNumberLiteral(expression) && expression.str !== "") {
            const value = parseInt(expression.str)
            return Number.isNaN(value) ? undefined : value
        }
        if (arkts.isBinaryExpression(expression)) {
            const left = this.evaluateConstExpression(expression.left!)
            const right = this.evaluateConstExpression(expression.right!)
            if (left === undefined || right === undefined) return undefined
            const op = expression.operatorType
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_LEFT_SHIFT) return left << right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_RIGHT_SHIFT) return left >> right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_UNSIGNED_RIGHT_SHIFT) return left >>> right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_BITWISE_AND) return left & right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_BITWISE_OR) return left | right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_BITWISE_XOR) return left ^ right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_PLUS) return left + right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_MINUS) return left - right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_MULTIPLY) return left * right
            if (op === arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_DIVIDE) return Math.trunc(left / right)
        }
        return undefined
    }

    visitImportDeclaration(node: arkts.ImportDeclaration): arkts.ImportDeclaration {
        let importString = node.source!.str
        if (importString.startsWith('.')) {
            const currentFileBaseDir = path.dirname(this.originalFileName)
            const importFilePath = path.normalize(path.join(currentFileBaseDir, node.source!.str))
            importString = importFilePath
        }
        const importedPackageClause = this.detectPackageNameByPath(importString)
        if (importedPackageClause.join('.') === this.packageClause.join('.')) {
            return node
        }
        node.specifiers.forEach(spec => {
            if (arkts.isImportSpecifier(spec)) {
                const imported = spec.imported!
                const local = spec.local ?? imported
                this.entries.push(idl.createImport([...importedPackageClause, imported.name], local.name))
            }
            if (arkts.isImportDefaultSpecifier(spec)) {
                this.entries.push(idl.createImport([...importedPackageClause, 'default'], spec.local!.name))
            }
            if (arkts.isImportNamespaceSpecifier(spec)) {
                throw new Error("`import * from` or `import * as <name> from` constructions are not supported")
            }
        })
        return node
    }

    private isBuilderFuncImpl(decl:arkts.FunctionDeclaration): boolean {
        if (this.mode !== 'arkoala') {
            return false
        }
        const func = decl.function!
        if (func.id?.name.endsWith('Impl')
            && decl.annotations.some(a => arkts.isIdentifier(a.expr) && a.expr.name === 'memo')) {
            const params = func.params as arkts.ETSParameterExpression[]
            const styleOk = params.length >= 1 && params[0].name === "style"
            const contentOk = params.length === 1 || params.length === 2 && params[1].name === "content_"
            return styleOk && contentOk
        }
        return false
    }

    visitFunctionDeclaration(node: arkts.FunctionDeclaration): arkts.FunctionDeclaration {
        const func = node.function!
        if (func.id?.name && this.config.DeletedDeclarations.includes(func.id.name)) {
            this.traceDeleted('DeletedDeclarations')
            return node
        }
        if (this.isBuilderFuncImpl(node)) {
            return node
        }
        const { set: paramsSet, attrs: typeParametersAttrs, parameters } = this.extractTypeParameters(func.typeParams)
        this.withTypeParamContext(paramsSet, () => this.contextual.suggestWithTypePrefix(func.id!.name, false, () => {
            let extendedAttributes = this.traceAttrs().concat(typeParametersAttrs)
            const annotations = this.extractAnnotations(node.annotations)
            if (annotations !== "") {
                extendedAttributes.push({name: idl.IDLExtendedAttributes.Annotations, value: annotations})
            }
            if (func.isExtensionMethod) {
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.ExtensionMethod })
            }
            let functionName = func.id!.name
            if (this.overloads.find(functionName)) {
                let overload = this.overloads.find(functionName)!
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.OverloadAlias, value: functionName})
                extendedAttributes.push({ name: idl.IDLExtendedAttributes.OverloadPriority, value: overload.mangledNames.indexOf(functionName).toString()})
                functionName = overload.name
            }
            const method = idl.createMethod(
                functionName,
                func.params.map(it => {
                    const param = it as arkts.ETSParameterExpression
                    let name = param.name
                    if (func.isExtensionMethod && name == '=t') {
                        name = 'this'
                    }
                    return idl.createParameter(name, this.serializeType(param.typeAnnotation), param.isOptional)
                }),
                this.serializeType(func.returnTypeAnnotation),
                {
                    isAsync: func.isAsyncFunc,
                    isFree: true,
                    isOptional: false,
                    isStatic: func.isStaticBlock
                },
                {
                    extendedAttributes: extendedAttributes,
                    fileName: this.fileName,
                },
                parameters
            )
            /* arkgen specialization */
            if (node.annotations.find(it => arkts.isIdentifier(it.expr) && it.expr.name === "ComponentBuilder")) {
                const callable = idl.createCallable(
                    "invoke",
                    method.parameters,
                    method.returnType,
                    {
                        isAsync: method.isAsync,
                        isStatic: method.isStatic
                    },
                    {
                        extendedAttributes: [
                            ...extendedAttributes,
                            { name: idl.IDLExtendedAttributes.CallSignature },
                        ]
                    }
                )
                const ifaceName = method.name + 'Interface'
                let iface: idl.IDLInterface | undefined
                if (iface = this.entries.filter(idl.isInterface).find(it => it.name === ifaceName)) {
                    iface.callables.push(callable)
                } else if (!this.config.DeletedDeclarations.includes(ifaceName)) {
                    this.entries.push(idl.createInterface(
                        ifaceName,
                        idl.IDLInterfaceSubkind.Interface,
                        [],
                        [],
                        [],
                        [],
                        [],
                        [callable],
                        method.typeParameters,
                        {
                            fileName: this.fileName,
                            extendedAttributes: [
                                { name: idl.IDLExtendedAttributes.ComponentInterface },
                            ]
                        }
                    ))
                }
            } else {
                this.entries.push(method)
            }
        }))
        return node
    }

    visitTSTypeAliasDeclaration(declaration: arkts.TSTypeAliasDeclaration): arkts.TSTypeAliasDeclaration {
        const name = declaration.id!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            this.traceDeleted('DeletedDeclarations')
            return declaration
        }
        if (this.mode === 'arkoala') {
            if (['Dimension'].includes(name)) {
                this.entries.push(idl.createTypedef(
                    name,
                    idl.createUnionType([
                        idl.IDLStringType,
                        idl.IDLNumberType,
                        idl.createReferenceType('_Resource')
                    ]),
                    [],
                    {
                        extendedAttributes: [],
                        fileName: this.fileName
                    }
                ))
                return declaration
            }
        }
        if (arkts.isETSFunctionType(declaration.typeAnnotation)) {
            const typeParams = this.extractTypeParameters(declaration.typeParams)
            this.contextual.suggest(name, true, () => {
                let result = this.serializeFunctionType(declaration.typeAnnotation as arkts.ETSFunctionType, typeParams)[0]
                const annotations = this.extractAnnotations(declaration.typeAnnotation.annotations)
                if (annotations !== "") {
                    result.extendedAttributes ??= []
                    result.extendedAttributes?.push({name:idl.IDLExtendedAttributes.TypeAnnotations, value:annotations})
                }
                this.entries.push(result)
            })
        } else if (arkts.isETSTuple(declaration.typeAnnotation)) {
            this.contextual.suggest(name, true, () => {
                this.entries.push(this.serializeTupleType(declaration.typeAnnotation as arkts.ETSTuple)[0])
            })
        } else {
            const { set: paramsSet, parameters, attrs } = this.extractTypeParameters(declaration.typeParams)
            this.withTypeParamContext(paramsSet, () => {
                let extendedAttributes = this.traceAttrs().concat(attrs)
                this.entries.push(idl.createTypedef(
                    name,
                    this.serializeType(declaration.typeAnnotation),
                    parameters,
                    {
                        extendedAttributes,
                        fileName: this.fileName,
                    })
                )
            })
        }
        return declaration
    }

    visitScriptFunction(node: arkts.ScriptFunction): arkts.ScriptFunction {
        return this.visitEachChild(node) as arkts.ScriptFunction
    }

    private printNode(node: arkts.AstNode) {
        let name = arkts.isIdentifier(node) ? `'${node.name}'` : ""
        return `${" ".repeat(4 * this.indentation) + node.constructor.name} ${name}`
    }

    private processBody(scopeName: string, members: readonly arkts.AstNode[] | undefined): {
        properties: idl.IDLProperty[],
        methods: idl.IDLMethod[],
        constructors: idl.IDLConstructor[],
        hasMemoAnnotation: boolean,
    } {
        let hasMemoAnnotation = false
        const properties: idl.IDLProperty[] = []
        const methods: idl.IDLMethod[] = []
        const constructors: idl.IDLConstructor[] = []

        members?.forEach(member => this.processNode((member:arkts.AstNode) => {
            if (arkts.isClassProperty(member)) {
                 if (this.shouldNotProcessMember(scopeName, member.id!.name)) {
                    this.traceDeleted('DeletedMembers')
                    return
                }
                properties.push(this.serializeClassProperty(member))
                const found = member.annotations.find(ann => arkts.isIdentifier(ann.expr) && ann.expr.name === 'memo')
                if (found) {
                    hasMemoAnnotation = true
                }
                return
            }
            if (arkts.isMethodDefinition(member)) {
                if (this.shouldNotProcessMember(scopeName, member.id!.name)) {
                    this.traceDeleted('DeletedMembers')
                    return
                }
                if (member.isGetter) {
                    const propType = member.function!.returnTypeAnnotation!
                    const propName = (member.key as arkts.Identifier).name
                    const prop = this.contextual.extend(propName, () => {
                        return idl.createProperty(propName, this.serializeType(propType))
                    })
                    prop.extendedAttributes ??= []
                    if (arkts.hasModifierFlag(member, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC)) {
                        prop.isStatic = true
                    }
                    prop.extendedAttributes?.push({name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Getter})
                    prop.extendedAttributes.push(...this.traceAttrs())
                    properties.push(prop)
                    return
                }
                if (member.isSetter) {
                    const firstParameter = member.function!.params[0]
                    const propType = arkts.isETSParameterExpression(firstParameter) ? firstParameter.typeAnnotation! : throwException("Expected parameter")
                    const propName = (member.key as arkts.Identifier).name
                    const prop = this.contextual.extend(propName, () => idl.createProperty(propName, this.serializeType(propType)))
                    prop.extendedAttributes ??= []
                    if (arkts.hasModifierFlag(member, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC)) {
                        prop.isStatic = true
                    }
                    prop.extendedAttributes.push({name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Setter})
                    prop.extendedAttributes.push(...this.traceAttrs())
                    properties.push(prop)
                    return
                }
                const serializedMethod = this.serializeMethod(member, scopeName)
                const key = scopeName + '.' + serializedMethod.name
                if (this.config.ForceCallback.has(key) && idl.isMethod(serializedMethod)) {
                    const syntheticName = generateSyntheticFunctionName(
                        serializedMethod.parameters,
                        serializedMethod.returnType,
                        { isAsync: serializedMethod.isAsync }
                    )
                    const syntheticCallback = idl.createCallback(
                        syntheticName,
                        serializedMethod.parameters,
                        serializedMethod.returnType,
                        {
                            extendedAttributes: (serializedMethod.extendedAttributes ?? []).concat({ name: idl.IDLExtendedAttributes.Synthetic })
                        }
                    )
                    if (!this.seenTypes.has(syntheticCallback.name)) {
                        this.seenTypes.add(syntheticCallback.name)
                        this.addSyntheticType(syntheticCallback)
                    }
                    let propertyPostfix = ""
                    let extendedAttributes = (serializedMethod.extendedAttributes ?? [])
                    const extraCallback = this.config.ForceCallback.get(key) === idl.IDLExtendedAttributes.ExtraMethod
                    if (extraCallback) {
                        propertyPostfix = "_callback"
                        extendedAttributes = extendedAttributes.concat([{ name: idl.IDLExtendedAttributes.ExtraMethod, value: serializedMethod.name }])
                    }
                    properties.push(idl.createProperty(
                        serializedMethod.name + propertyPostfix,
                        idl.createReferenceType(syntheticName),
                        false,
                        serializedMethod.isStatic,
                        serializedMethod.isOptional,
                        {
                            extendedAttributes: extendedAttributes.concat({
                                name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Getter })
                        }
                    ))
                    properties.push(idl.createProperty(
                        serializedMethod.name + propertyPostfix,
                        idl.createReferenceType(syntheticName),
                        false,
                        serializedMethod.isStatic,
                        serializedMethod.isOptional,
                        {
                            extendedAttributes: extendedAttributes.concat({
                                name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Setter })
                        }
                    ))
                } else if (idl.isConstructor(serializedMethod)) {
                    constructors.push(serializedMethod)
                } else {
                    methods.push(serializedMethod)
                }
                const found = member.function!.annotations.find(ann => arkts.isIdentifier(ann.expr) && ann.expr.name === 'memo')
                if (found) {
                    hasMemoAnnotation = true
                }
                return
            }
            if (arkts.isOverloadDeclaration(member)) {
                this.traceDeleted('overload')
                return
            }
            console.error(member)
            throw new Error("Unhandled member!")
        }, member))

        return {
            properties,
            constructors,
            methods,
            hasMemoAnnotation,
        }
    }

    private extractAnnotations(annotations: readonly arkts.AnnotationUsage[]) : string {
        return annotations.map(it => {
            if (!arkts.isIdentifier(it.expr)) return ""
            const name = it.expr.name
            if (name === "ComponentBuilder") {
                return ""
            } else {
                return name
            }
        }).filter(it => it !== "").join(";")
    }

    visitClassDeclaration(declaration: arkts.ClassDeclaration): arkts.ClassDeclaration {
        const name = declaration.definition!.ident!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            this.traceDeleted('DeletedDeclarations')
            return declaration
        }
        const definition = declaration.definition!
        const { set: paramsSet, parameters, attrs: typeParametersAttrs } = this.extractTypeParameters(definition.typeParams)
        this.withTypeParamContext(paramsSet, () => this.contextual.suggestWithTypePrefix(name, false, () => {
            const inheritance: idl.IDLReferenceType[] = []
            if (definition.super) {
                const sup = this.serializeType(definition.super)
                if (!idl.isReferenceType(sup)) {
                    throw new Error(`Expected reference type in class ${name} extends`)
                }
                sup.extendedAttributes ??= []
                sup.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Extends })
                inheritance.push(sup)
            }
            if (definition.implements.length) {
                definition.implements.forEach(int => {
                    const type = this.serializeType(int.expr)
                    if (!idl.isReferenceType(type)) {
                        throw new Error(`Expected reference in class ${name} implements`)
                    }
                    inheritance.push(type)
                })
            }

            const attrs: idl.IDLExtendedAttribute[] = [
                ...this.traceAttrs(),
                { name: idl.IDLExtendedAttributes.Entity, value: idl.IDLEntity.Class },
                ...typeParametersAttrs,
            ]
            if (declaration.definition.modifierFlags & arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_ABSTRACT) {
                attrs.push({ name: idl.IDLExtendedAttributes.Abstract })
            }
            const { properties, methods, constructors } = this.processBody(name, declaration.definition?.body)
            this.entries.push(idl.createInterface(
                name,
                idl.IDLInterfaceSubkind.Class,
                inheritance,
                constructors, // ctors
                undefined, // constants
                properties,
                methods,
                [], // callables
                parameters,
                {
                    fileName: this.fileName,
                    extendedAttributes: attrs.length === 0 ? undefined : attrs
                }
            ))
        }))
        return declaration
    }

    visitInterfaceDeclaration(declaration: arkts.TSInterfaceDeclaration): arkts.TSInterfaceDeclaration {
        const name = declaration.id!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            this.traceDeleted('DeletedDeclarations')
            return declaration
        }
        if (this.config.StubbedDeclarations.includes(name)) {
            this.traceDeleted('StubbedDeclarations')
            this.entries.push(idl.createInterface(
                name,
                idl.IDLInterfaceSubkind.Interface,
                [],
                [],
                [],
                [idl.createProperty('_stub', idl.IDLI32Type)],
                [],
                [],
                [],
                {
                    fileName: this.fileName
                }
            ))
            return declaration
        }
        const { set: paramsSet, parameters, attrs: typeParametersAttrs } = this.extractTypeParameters(declaration.typeParams)
        this.withTypeParamContext(paramsSet, () => this.contextual.suggestWithTypePrefix(name, () => {
            const inheritance: idl.IDLReferenceType[] = []
            if (declaration.extends.length) {
                declaration.extends.forEach(int => {
                    const type = this.serializeType(int.expr)
                    if (!idl.isReferenceType(type)) {
                        throw new Error(`Expected reference type in interface ${name} extends`)
                    }
                    inheritance.push(type)
                })
            }
            const attrs: idl.IDLExtendedAttribute[] = this.traceAttrs().concat(typeParametersAttrs)
            const { properties, methods, constructors } = this.processBody(name, declaration.body?.getChildren())
            this.entries.push(idl.createInterface(
                name,
                idl.IDLInterfaceSubkind.Interface,
                inheritance,
                constructors, // ctors
                undefined, // constants
                properties,
                methods,
                [], // callables
                parameters,
                {
                    fileName: this.fileName,
                    extendedAttributes: attrs.length === 0 ? undefined : attrs
                }
            ))
        }))
        return declaration
    }

    private processMethodLiteralParameters(method: arkts.MethodDefinition): {
        methodName: string,
        parameters: arkts.ETSParameterExpression[],
        extendedAttributes: idl.IDLExtendedAttribute[],
    } {
        let methodName = method.id!.name
        const extendedAttributes: idl.IDLExtendedAttribute[] = []
        const filteredParameters = method.function!.params.map(it => it as arkts.ETSParameterExpression)
        .filter((param, paramIndex) => {
            const paramName = param.name
            let tag: string | undefined
            if (arkts.isETSStringLiteralType(param.typeAnnotation)) {
                tag = param.typeAnnotation.dumpSrc()
            }
            if (!tag) return true
            const dtsTagIndexDefault = 0 // see idl.DtsTag specification
            const dtsTagNameDefault = 'type' // see idl.DtsTag specification
            let extendedAttributeValues: string[] = []
            if (paramIndex != dtsTagIndexDefault || paramName != dtsTagNameDefault) {
                extendedAttributeValues.push(paramIndex.toString())
                extendedAttributeValues.push(paramName)
            }
            extendedAttributeValues.push(tag)
            extendedAttributes.push({
                name: idl.IDLExtendedAttributes.DtsTag,
                value: extendedAttributeValues.map(value => value.replaceAll('|', '\\x7c')).join('|')
            })
            if (!extendedAttributes.some(it => it.name === idl.IDLExtendedAttributes.DtsName)) {
                extendedAttributes.push({
                    name: idl.IDLExtendedAttributes.DtsName,
                    value: methodName,
                })
            }
            methodName = methodName + capitalize(tag.replaceAll('"', '').replaceAll("'", ''))
            return false
        })
        return {
            methodName: methodName,
            parameters: filteredParameters,
            extendedAttributes,
        }
    }

    serializeMethod(method: arkts.MethodDefinition, parentName:string): idl.IDLMethod | idl.IDLConstructor {
        const { set: paramsSet, parameters: typeParameters, attrs: typeParametersAttrs } = this.extractTypeParameters((method.value as arkts.FunctionExpression).function?.typeParams)
        return this.withTypeParamContext(paramsSet, () => {
            let { methodName, parameters: arktsParameters, extendedAttributes } = this.processMethodLiteralParameters(method)
            let traceAttrs = this.traceAttrs()
            extendedAttributes.push(...traceAttrs)
            extendedAttributes.push(...typeParametersAttrs)
            return this.contextual.extend(methodName, () => {
                const key = parentName + '.' + methodName
                if (this.config.Throws.includes(key)) {
                    extendedAttributes.push({
                        name: idl.IDLExtendedAttributes.Throws
                    })
                }
                const parameters = arktsParameters.map(param => {
                    return idl.createParameter(param.name, this.serializeType(param.typeAnnotation), param.isOptional)
                })
                let ii = parameters.length - 1
                while (ii >= 0) {
                    const last = parameters.at(-1)!
                    if (last.type === idl.IDLUndefinedType || idl.isReferenceType(last.type) && last.type.name === idl.IDLNullTypeName) {
                        parameters.pop()
                    } else {
                        break
                    }
                    --ii
                }
                const returnType = this.serializeType(method.function!.returnTypeAnnotation!)
                if (method.id!.name === 'constructor') {
                    return idl.createConstructor(
                        parameters,
                        returnType,
                        {
                            extendedAttributes: traceAttrs,
                        },
                    )
                }
                const annotations = this.extractAnnotations(method.function?.annotations ?? [])
                if (annotations !== "") {
                    extendedAttributes ??= []
                    extendedAttributes?.push({name:idl.IDLExtendedAttributes.TypeAnnotations, value:annotations})
                }
                if (this.overloads.find(methodName)) {
                    let overload = this.overloads.find(methodName)!
                    extendedAttributes.push({ name: idl.IDLExtendedAttributes.OverloadAlias, value: methodName})
                    extendedAttributes.push({ name: idl.IDLExtendedAttributes.OverloadPriority, value: overload.mangledNames.indexOf(methodName).toString()})
                    methodName = overload.name
                }
                return idl.createMethod(methodName,
                    parameters,
                    returnType,
                    {
                        isStatic: !!(method.modifierFlags & arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC),
                        isAsync: false,
                        isFree: false,
                        isOptional: false,
                    },
                    {
                        extendedAttributes: extendedAttributes,
                    },
                    typeParameters
                )
            })
        })
    }

    serializeClassProperty(property: arkts.ClassProperty): idl.IDLProperty {
        const name = (property.key as arkts.Identifier).name
        return this.contextual.extend(name, false, () => {
            const prop = idl.createProperty(name, this.serializeType(property.typeAnnotation!))
            prop.extendedAttributes ??= []
            prop.extendedAttributes.push(...this.traceAttrs())
            if (arkts.hasModifierFlag(property, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_OPTIONAL)) {
                prop.isOptional = true
                prop.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Optional })
            }
            if (arkts.hasModifierFlag(property, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC)) {
                prop.isStatic = true
            }
            if (arkts.hasModifierFlag(property, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_READONLY)) {
                prop.isReadonly = true
            }
            return prop
        })
    }

    private static etsFunctionTypeReferencePattern = new RegExp(/^Function[0-9]*$/g)
    private static isFunctionTypeReference(name: string) {
        return IDLVisitor.etsFunctionTypeReferencePattern.test(name)
    }

    maybeSerializeETSFunctionReference(type: arkts.ETSTypeReference): [idl.IDLCallback, string[]] | undefined {
        let name = type.baseName!.name
        if (!IDLVisitor.isFunctionTypeReference(name)) return undefined
        const [typeArgs, trappedParams] = this.useTypeParametersTrap(() => {
            const typeArgs = type.part?.typeParams?.params.map(it => this.serializeType(it))
            return typeArgs
        })
        const orderedTrappedParams = Array.from(trappedParams)
        const returnType = typeArgs?.at(0) ?? idl.IDLVoidType
        let paramsTypes = typeArgs?.slice(0, -1)
        if (paramsTypes?.length === 1 && paramsTypes[0] === idl.IDLVoidType) {
            paramsTypes = []
        }
        const parameters = paramsTypes?.map((it, index) => idl.createParameter(`value${index}`, it)) ?? []
        const callback = idl.createCallback(
            this.contextualSelectName(generateSyntheticFunctionName(parameters, returnType, { isAsync: arkts.hasModifierFlag(type, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_ASYNC) })),
            parameters,
            returnType,
            { fileName: this.fileName, extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }] },
            orderedTrappedParams.length === 0 ? undefined : orderedTrappedParams,
        )
        return [callback, orderedTrappedParams]
    }

    serializeType(type: arkts.AstNode | undefined): idl.IDLType {
        if (!type) return idl.IDLVoidType
        if (arkts.isTSAnyKeyword(type))
            return idl.IDLAnyType
        if (arkts.isTSThisType(type))
            return idl.IDLThisType
        if (arkts.isTSObjectKeyword(type))
            return idl.IDLObjectType
        if (arkts.isETSUndefinedType(type))
            return idl.IDLUndefinedType
        if (arkts.isETSStringLiteralType(type))
            return idl.IDLStringType
        if (arkts.isTSStringKeyword(type))
            return idl.IDLStringType
        if (arkts.isETSNullType(type))
            return idl.createReferenceType(idl.IDLNullTypeName)
        if (arkts.isTSArrayType(type))
            return idl.createContainerType('sequence', [this.serializeType((type as arkts.TSArrayType).elementType)])
        if (arkts.isETSUnionType(type))
            return this.sanitizePromise(collapseTypes((type as arkts.ETSUnionType).types.map((it) => this.serializeType(it))))
        if (arkts.isETSPrimitiveType(type))
            return this.serializePrimitive((type as arkts.ETSPrimitiveType).primitiveType)
        if (arkts.isETSTypeReference(type)) {
            let name = type.baseName!.name
            if (type.part && arkts.isTSQualifiedName(type.part.name)) {
                const names: string[] = []
                let current: arkts.Expression = type.part.name
                while (current && arkts.isTSQualifiedName(current)) {
                    names.unshift(current.right!.name)
                    current = current.left ?? throwException("!!!")
                }
                names.unshift(name)
                name = names.join('.')
            }
            if (this.isTypeParameter(name)) {
                const replacementMapping = this.typeReplacements.find(it => it.has(name))
                if (replacementMapping) {
                    return replacementMapping.get(name)!
                }
                this.typeParameterFound(name)
                return idl.createTypeParameterReference(name)
            }
            const mbEtsCallback = this.maybeSerializeETSFunctionReference(type)
            if (mbEtsCallback) {
                const [etsCallback, args] = mbEtsCallback
                if (!this.seenTypes.has(etsCallback.name)) {
                    this.seenTypes.add(etsCallback.name)
                    this.addSyntheticType(etsCallback)
                }
                return idl.createReferenceType(
                    etsCallback.name,
                    args.length === 0 ? undefined : args.map(it => {
                        this.typeParameterFound(it)
                        return idl.createTypeParameterReference(it)
                    })
                )
            }

            const typeArgs = type.part?.typeParams?.params.map(it => this.serializeType(it))
            // special cases //
            switch (name) {
                case 'Any': return idl.IDLAnyType
                case 'string': return idl.IDLStringType
                case 'Promise': return idl.createContainerType('Promise', typeArgs ?? [] /* better check here? */)
                case 'Record': return idl.createContainerType('record', typeArgs ?? [] /* better check here? */, { extendedAttributes: [{ name: idl.IDLExtendedAttributes.AsRecord }] })
                case 'Map': return idl.createContainerType('record', typeArgs ?? [] /* better check here? */)
                case 'Set': return idl.createReferenceType('idlize.stdlib.Set', typeArgs!)
                case 'Array': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'Date': return idl.IDLDate
                case 'date': return idl.IDLDate
                case 'Partial': return idl.createReferenceType('idlize.stdlib.Partial', typeArgs)
                case 'Object': return idl.IDLObjectType
                case 'object': return idl.IDLObjectType
                case 'ArrayBuffer': return idl.IDLBufferType
                case 'Uint8Array': return idl.IDLBufferType
                case 'Uint8ClampedArray': return idl.IDLBufferType
                case 'Boolean': return idl.IDLBooleanType
                case 'Int32Array': return idl.createContainerType('sequence', [idl.IDLI32Type])
                case 'IterableIterator': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'ReadonlyArray': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'FixedArray': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'number': return idl.IDLNumberType
                case 'Required':
                case 'Readonly': return typeArgs![0]
                case 'Optional': return idl.createOptionalType(typeArgs![0])
                case 'ESValue': return idl.IDLObjectType
                case 'Intl.Locale': return idl.createReferenceType('idlize.stdlib.Intl.Locale')
                case 'Error': return idl.createReferenceType('idlize.stdlib.Error')
                case 'Type': return idl.createReferenceType('idlize.stdlib.Type')
                case 'ParticleTuple': {
                    const typeParameters = new Set<string>()
                    typeArgs?.forEach(arg => {
                        idl.forEachChild(arg, node => {
                            if (idl.isTypeParameterType(node)) {
                                typeParameters.add(node.name)
                            }
                        })
                    })
                    const typeParametersOrdered = typeParameters.size === 0 ? undefined : Array.from(typeParameters)
                    const tuple = this.createTuple(typeArgs!, typeParametersOrdered)
                    if (!this.seenTypes.has(tuple.name)) {
                        this.seenTypes.add(tuple.name)
                        this.addSyntheticType(tuple)
                    }
                    return idl.createReferenceType(tuple.name, typeParametersOrdered?.map(it => idl.createTypeParameterReference(it)))
                }
            }
            return idl.createReferenceType(name, typeArgs)
        }
        if (arkts.isETSFunctionType(type)) {
            const [funcType, typeArguments] = this.serializeFunctionType(type as arkts.ETSFunctionType)
            if (!this.seenTypes.has(funcType.name)) {
                this.seenTypes.add(funcType.name)
                this.addSyntheticType(funcType)
            }
            return idl.createReferenceType(
                funcType.name,
                typeArguments.length === 0 ? undefined : typeArguments.map(arg => {
                    this.typeParameterFound(arg)
                    return idl.createTypeParameterReference(arg)
                })
            )
        }
        if (arkts.isETSTuple(type)) {
            const [tupleType, typeArguments] = this.serializeTupleType(type)
            if (!this.seenTypes.has(tupleType.name)) {
                this.seenTypes.add(tupleType.name)
                this.addSyntheticType(tupleType)
            }
            return idl.createReferenceType(
                tupleType.name,
                typeArguments.length === 0 ? undefined : typeArguments.map(arg => {
                    this.typeParameterFound(arg)
                    return idl.createTypeParameterReference(arg)
                })
            )
        }
        if (arkts.isETSKeyofType(type)) {
            return idl.IDLStringType
        }
        throw new Error(`Failed type conversion for ${type ? this.printNode(type) : "undefined"}`)
    }

    // possible bug: entires collected here using .name, not FQName
    private seenTypes = new Set<string>()

    serializePrimitive(type: arkts.Es2pandaPrimitiveType): idl.IDLType {
        switch (type) {
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_BYTE: return idl.IDLI8Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_INT: return idl.IDLI32Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_LONG: return idl.IDLI64Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_SHORT: return idl.IDLI16Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_FLOAT: return idl.IDLF32Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_DOUBLE: return idl.IDLF64Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_BOOLEAN: return idl.IDLBooleanType
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_CHAR: return idl.IDLU16Type
            case arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_VOID: return idl.IDLVoidType
            default: throw new Error(`Unknown primitive type ${type}`)
        }
    }

    serializeFunctionType(type: arkts.ETSFunctionType, parentTypeParams?: ExtractTypeParameterInfo): [idl.IDLCallback, string[]] {
        const [[parameters, returnType], typeParams] = this.useTypeParametersTrap(() => {
            const parameters = type.params.map(it => {
                let param = it as arkts.ETSParameterExpression
                let paramName = param.name
                if (paramName === '=t') {
                    paramName = 'this'
                }
                return idl.createParameter(paramName, this.serializeType(param.typeAnnotation!), param.isOptional, param.isRestParameter)
            })
            const returnType = this.serializeType(type.returnType)
            return [parameters, returnType] as const
        })
        const orderedTypeParameters = (parentTypeParams?.parameters ?? []).concat(Array.from(typeParams))
        const result = idl.createCallback(
            this.contextualSelectName(generateSyntheticFunctionName(parameters, returnType, { isAsync: arkts.hasModifierFlag(type, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_ASYNC) })),
            parameters,
            returnType,
            { fileName: this.fileName },
            orderedTypeParameters.length ? orderedTypeParameters : undefined
        )
        result.extendedAttributes ??= []
        if (!this.contextual.hasSuggestion || !this.contextual.forced)
            result.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Synthetic })
        else
            result.extendedAttributes.push(...this.traceAttrs())
        if (parentTypeParams !== undefined)
            result.extendedAttributes.push(...parentTypeParams.attrs)

        return [result, orderedTypeParameters]
    }

    serializeTupleType(type: arkts.ETSTuple): [idl.IDLInterface, string[]] {
        const [properties, typeParameters] = this.useTypeParametersTrap(() => {
            return type.tupleTypeAnnotationsList.map(it => {
                return this.serializeType(it)
            })
        })
        const orderedTypeParameters = Array.from(typeParameters)
        const result = this.createTuple(properties, orderedTypeParameters.length ? orderedTypeParameters : undefined)
        return [result, orderedTypeParameters]
    }

    private createTuple(properties: idl.IDLType[], typeParameters?: string[]): idl.IDLInterface {
        const extendedAttributes: idl.IDLExtendedAttribute[] = [
            { name: idl.IDLExtendedAttributes.Entity, value: idl.IDLEntity.Tuple }
        ]
        if (!this.contextual.hasSuggestion || !this.contextual.forced)
            extendedAttributes.push({ name: idl.IDLExtendedAttributes.Synthetic })
        else
            extendedAttributes.push(...this.traceAttrs())

        return idl.createInterface(
            this.contextualSelectName('Tuple_' + properties.map(it => generateSyntheticIdlNodeName(it)).join('_')),
            idl.IDLInterfaceSubkind.Tuple,
            [], [], [],
            properties.map((it, idx) => {
                return idl.createProperty(`value${idx}`, it)
            })
            , [], [],
            typeParameters,
            {
                fileName: this.fileName,
                extendedAttributes
            }
        )
    }

    private shouldNotProcessMember(scopeName: string, entryName: string): boolean {
        return this.config.DeletedMembers.get(scopeName)?.includes(entryName) ?? false
    }

    addSyntheticType(entry: idl.IDLEntry) {
        this.entries.push(entry)
    }

    extractTypeParameters(node: arkts.TSTypeParameterDeclaration | undefined): ExtractTypeParameterInfo {
        const result: string[] = []
        const defaults: idl.IDLType[] = []
        node?.params.forEach(param => {
            if (param.name) {
                // constraint and default value lost here
                result.push(param.name?.name)
            }
            if (param.defaultType) {
                defaults.push(this.serializeType(param.defaultType))
            }
        })
        if (result.length === 0) {
            return {
                parameters: undefined,
                set: new Set(),
                attrs: [],
                defaults: undefined
            }
        }
        const attrs: idl.IDLExtendedAttribute[] = []
        if (defaults.length > 0) {
            attrs.push({
                name: idl.IDLExtendedAttributes.TypeParametersDefaults,
                value: defaults.map(it => idl.printType(it)).join(",")
            })
        }
        return {
            set: new Set(result),
            attrs,
            parameters: result,
            defaults
        }
    }

    withTypeParamContext<T>(params: Set<string>, op: () => T): T {
        this.typeParamsStack.push(params)
        const r = op()
        this.typeParamsStack.pop()
        return r
    }
    isTypeParameter(name: string) {
        return this.typeParamsStack.find(bucket => bucket.has(name)) !== undefined
    }

    private typeParamsTraps: Set<string>[] = [new Set()]
    useTypeParametersTrap<R>(op: () => R): [R, Set<string>] {
        this.typeParamsTraps.push(new Set())
        const r = op()
        const record = this.typeParamsTraps.pop()!
        return [r, record]
    }
    typeParameterFound(name: string) {
        this.typeParamsTraps.at(-1)?.add(name)
    }

    markDefaultExport() {
        if (this.defaultExportName) {
            this.entries.forEach(entry => {
                if (entry.name === this.defaultExportName) {
                    entry.extendedAttributes ??= []
                    entry.extendedAttributes.push({
                        name: idl.IDLExtendedAttributes.DefaultExport
                    })
                }
            })
        }
    }

    postprocessComponent(iface:idl.IDLInterface) {
        iface.extendedAttributes ??= []
        iface.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Component })
    }

    private isNewShapeBuilderMethod(decl: idl.IDLMethod, parentName:string) {
        if (!parentName.endsWith('Attribute')) {
            return false
        }
        parentName = parentName.substring(0, parentName.length - 'Attribute'.length)
        return this.mode === 'arkoala' && decl.name === `set${parentName}Options`
    }

    postprocessEntires() {
        if (this.mode === 'arkoala') {
            /* arkgen specialization */
            const componentInterfaces = this.entries.filter(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.ComponentInterface))
            const components: {
                attributeDeclaration: idl.IDLInterface,
                interfaceDeclaration: idl.IDLInterface | undefined,
            }[] = []
            for (const componentInterface of componentInterfaces) {
                if (componentInterface) {
                    if (!idl.isInterface(componentInterface)) {
                        throw new Error("ComponentInterface must be interface!")
                    }
                    const componentAttributeNameRef = componentInterface.callables.at(0)!.returnType
                    if (!idl.isReferenceType(componentAttributeNameRef)) {
                        throw new Error("Expected @ComponentBuilder function return type to be a reference")
                    }
                    const componentAttributeName = componentAttributeNameRef.name
                    const processedEntries: idl.IDLEntry[] = []
                    this.entries.forEach(entry => {
                        if (entry.name === componentInterface.name && entry !== componentInterface) {
                            return
                        }
                        if (entry.name === componentAttributeName && idl.isInterface(entry)) {
                            this.postprocessComponent(entry)
                            components.push({
                                attributeDeclaration: entry,
                                interfaceDeclaration: componentInterface,
                            })
                        }
                        if (idl.isCallback((entry))) {
                            let hasComponentInReferences = false
                            idl.forEachChild(entry, (node) => {
                                if (idl.isNamedNode(node) && [componentAttributeName].includes(node.name))
                                    hasComponentInReferences = true
                            })
                            if (hasComponentInReferences) {
                                return
                            }
                        }
                        processedEntries.push(entry)
                    })
                    this.entries = processedEntries
                }
            }

            this.entries.forEach(entry => {
                const entryFQName = this.packageClause.concat(entry.name).join(".")
                if (idl.isInterface(entry) && (this.config.Components.includes(entry.name) || this.config.Components.includes(entryFQName))) {
                    this.postprocessComponent(entry)
                    if (!components.some(it => it.attributeDeclaration.name === entry.name)) {
                        components.push({
                            attributeDeclaration: entry,
                            interfaceDeclaration: undefined
                        })
                    }
                }
            })

            // convert components methods to attributes
            for (const component of components) {
                const newShapeBuilderMethods: idl.IDLMethod[] = []
                component.attributeDeclaration.methods = component.attributeDeclaration.methods.map(method => {
                    if (method.typeParameters?.length ?? 0 > 0) {
                        method = idl.clone(method)
                        idl.updateEachChild(method, node => {
                            if (idl.isTypeParameterType(node)) {
                                return idl.createPrimitiveType('Object')
                            }
                            return node
                        })
                        method.typeParameters = undefined
                    }
                    return method
                })
                component.attributeDeclaration.methods = component.attributeDeclaration.methods.filter(method => {
                    if (this.isNewShapeBuilderMethod(method, component.attributeDeclaration.name)) {
                        newShapeBuilderMethods.push(method)
                        return false
                    }
                    if (method.parameters.length === 1) {
                        component.attributeDeclaration.properties.push(idl.createProperty(
                            method.name,
                            method.parameters[0].type,
                            false,
                            false,
                            method.parameters[0].isOptional,
                            {
                                extendedAttributes: (method.extendedAttributes ?? []).concat([{ name: idl.IDLExtendedAttributes.CommonMethod }])
                            }
                        ))
                        return false
                    }
                    method.extendedAttributes ??= []
                    method.extendedAttributes.push({ name: idl.IDLExtendedAttributes.CommonMethod })
                    return true
                })
                // if there is setComponentOptions functions in attributes declaration,
                // replace collected interfaces callables with setComponentOptions arguments.
                // For most of components they must be equals, but there is NavDestination component:
                // plugin appends some arguments while rewrite directly to setNavDestinationOptions invocation.
                if (newShapeBuilderMethods.length > 0) {
                    if (component.interfaceDeclaration === undefined) {
                        throw new Error(`${component.attributeDeclaration} does not have builder functions declared ` +
                            `but have ${newShapeBuilderMethods[0].name} methods`)
                    }
                    if (newShapeBuilderMethods.length !== component.interfaceDeclaration.callables.length) {
                        const attributesName = component.attributeDeclaration.name
                        const componentName = attributesName.substring(0, attributesName.length - 'Attribute'.length)
                        throw new Error(`Amount of set${componentName}Options in ${attributesName} is not equal to builder functions amount for ${componentName} component`)
                    }
                    for (let i = 0; i < newShapeBuilderMethods.length; i++) {
                        const callable = component.interfaceDeclaration.callables[i]
                        const method = newShapeBuilderMethods[i]
                        const maybeContentParameter = callable.parameters.at(-1)?.name === "content_"
                            ? callable.parameters.at(-1)
                            : undefined
                        callable.parameters = method.parameters.map(idl.clone)
                        if (maybeContentParameter) {
                            callable.parameters.push(maybeContentParameter)
                        }
                    }
                }
            }
        }

        /* remove synthetic duplicates */
        function removeDuplicatedByScope(entries: idl.IDLEntry[]): idl.IDLEntry[] {
            const seen = new Set<string>()
            const result: idl.IDLEntry[] = []
            entries.forEach(entry => {
                if (idl.isNamespace(entry)) {
                    entry.members = removeDuplicatedByScope(entry.members)
                }
                if (seen.has(entry.name)) {
                    return
                }
                seen.add(entry.name)
                result.push(entry)
            })
            return result
        }

        const mappers = [
            (node: idl.IDLNode) => {
                if (idl.isInterface(node)) this.escapeSameNamedMethods(node)
            }
        ]
        for (const entry of this.entries) {
            idl.forEachChild(entry, () => {}, (node) => mappers.forEach(it => it(node)))
            mappers.forEach(it => it(entry))
        }

        this.entries = removeDuplicatedByScope(this.entries)
    }

    /**
     * Just syntax equality
     */
    private isTypesEq(a:idl.IDLType, b:idl.IDLType): boolean {
        return idl.printType(a) === idl.printType(b)
    }

    private isParametersEq(a:idl.IDLParameter, b:idl.IDLParameter): boolean {
        return a.name === b.name
            && a.isOptional === b.isOptional
            && a.isVariadic === b.isVariadic
            && this.isTypesEq(a.type, b.type)
    }

    private isMethodPerfectlyTheSame(a:idl.IDLMethod, b:idl.IDLMethod): boolean {
        return a.name === b.name
            && a.parameters.length === b.parameters.length
            && zip(a.parameters, b.parameters).every(([x, y]) => this.isParametersEq(x, y))
    }

    private escapeSameNamedMethods(decl: idl.IDLInterface): void {
        const checkedNames: Set<string> = new Set(["attributeModifier"])
        for (const method of decl.methods) {
            if (checkedNames.has(method.name))
                continue
            const sameNamedMethods = decl.methods.filter(it => this.isMethodPerfectlyTheSame(it, method))
            if (sameNamedMethods.length > 1) {
                console.log(`WARNING: escaping ${decl.name}.${method.name}. Same named methods currently are not supported in etsgen`)
                sameNamedMethods.forEach((it, index) => it.name = it.name + index)
            }
            checkedNames.add(method.name)
        }
    }

    toIDLFile(): IDLFile {
        this.markDefaultExport()
        this.postprocessEntires()
        return idl.linkParentBack(idl.createFile(this.entries, this.fileName, this.packageClause))
    }

    toIDLSuperFile(): IDLSuperFile {
        return {
            originalFileName: this.originalFileName,
            generatedFileName: this.fileName,
            writeFilePath: this.fileName,
            skipped: false,
            file: this.toIDLFile(),
            exports: this.fileReExports,
            exportsAll: this.fileReExportsAll,
        }
    }

    private getNodeType(node: arkts.AstNode): string {
        if (arkts.isClassDeclaration(node)) return 'class'
        if (arkts.isTSInterfaceDeclaration(node)) return 'interface'
        if (arkts.isTSEnumDeclaration(node)) return 'enum_class'
        if (arkts.isTSEnumMember(node)) return 'enum_instance'
        if (arkts.isFunctionDeclaration(node)) return 'method'
        if (arkts.isETSModule(node)) return 'namespace'
        if (arkts.isClassProperty(node)) return 'field'
        if (arkts.isMethodDefinition(node)) return 'method'
        if (arkts.isOverloadDeclaration(node)) return 'method'
        if (arkts.isTSTypeAliasDeclaration(node)) return 'field' // !!!
        if (arkts.isAnnotationDeclaration(node)) return 'annotation'
        if (arkts.isVariableDeclaration(node)) return 'field'
        throw new Error("Unknown node type!")
    }

    private getNodeName(node: arkts.AstNode): string {
        if (arkts.isClassDeclaration(node)) return node.definition!.ident!.name
        if (arkts.isTSInterfaceDeclaration(node)) return node.id!.name
        if (arkts.isTSEnumDeclaration(node)) return node.key!.name
        if (arkts.isTSEnumMember(node)) return node.name
        if (arkts.isFunctionDeclaration(node)) return node.function!.id!.name
        if (arkts.isETSModule(node)) return node.ident!.name
        if (arkts.isClassProperty(node)) return node.id!.name
        if (arkts.isMethodDefinition(node)) return node.id!.name
        if (arkts.isTSTypeAliasDeclaration(node)) return node.id!.name
        if (arkts.isOverloadDeclaration(node)) return node.id!.name
        if (arkts.isAnnotationDeclaration(node)) return node.baseName!.name
        if (arkts.isVariableDeclaration(node)) return node.declarators[0]!.id!.toString
        throw new Error("Unknown node type!")
    }

    private saveStatus(status?: string): string {
        let pkg = camelCaseToUpperSnakeCase(this.packageClause.at(-1) ?? '').toLowerCase()
        let fpkg = this.packageClause.join('.')

        const [node, ...tail] = this.processNodeStack
        let name = this.getNodeName(node)
        let parent = tail.map(it => this.getNodeName(it)).reverse().join('.')
        if (parent == '') parent = 'unnamed'
        let type = this.getNodeType(node)

        let ok = `${parent}:${name}`
        let override = (this.status.od.get(ok) ?? -1) + 1
        this.status.od.set(ok, override)
        this.status.status.push(new StatusRecord(fpkg, pkg, parent, name, override, type, status ?? '', node.dumpSrc().split("\n")[0]));
        return `${fpkg}:${parent}:${name}:${override}`
    }

    private traceAttrs(): idl.IDLExtendedAttribute[] {
        let traceKey = this.saveStatus()
        return this.status.enabled ? [{ name: idl.IDLExtendedAttributes.TraceKey, value: traceKey }] : []
    }

    private traceDeleted(reason: string) {
        this.saveStatus(reason)
    }

    private guessTypeAndValue(name: string, type?: arkts.TypeNode, initExpr?: arkts.Expression): [idl.IDLType, string | undefined] {
        if (type) return [this.serializeType(type), arkts.isStringLiteral(initExpr) ? `"${initExpr.toString}"` : initExpr?.toString]
        if (!initExpr) throw new Error(`Constant ${name} neither has type nor the initializer`)
        const value = initExpr.toString
        if (arkts.isBooleanLiteral(initExpr)) return [idl.IDLBooleanType, value]
        if (arkts.isNumberLiteral(initExpr)) return [idl.IDLNumberType, value]
        if (arkts.isStringLiteral(initExpr)) return [idl.IDLStringType, `"${value}"`]
        if (arkts.isBigIntLiteral(initExpr)) return [idl.IDLNumberType, value]
        console.error(`Unknown initExpr type for constant: ${name} with value: ${value}`)
        return [idl.IDLAnyType, undefined]
    }
}