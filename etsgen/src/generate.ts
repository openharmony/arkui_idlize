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

import { capitalize, collapseTypes, filterRedundantAttributesOverloads, filterRedundantMethodsOverloads, flattenUnionType, generateSyntheticFunctionName, generateSyntheticIdlNodeName, IDLFile, Language, nameEnumValues, PeerLibrary, throwException, zip } from "@idlizer/core"
import * as arkts from "@koalaui/libarkts"
import * as idl from "@idlizer/core/idl"
import * as path from "node:path"
import * as fs from "node:fs"
import { ETSVisitorConfig } from "./config"

const MaxSyntheticTypeLength = 60
// must be moved to config!
const TypeParameterMap: Map<string, Map<string, idl.IDLType>> = new Map([
    ["DirectionalEdgesT", new Map([
        ["T", idl.IDLNumberType]])],
])

function processFile(outDir: string, baseDir: string, file: string, configPath:string, config: ETSVisitorConfig): IDLSuperFile {
    let input = fs.readFileSync(file).toString()
    //let module = arkts.createETSModuleFromSource(input, arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
    const configText = fs.readFileSync(configPath, 'utf-8')
    const configContent = JSON.parse(configText)
    const paths = configContent.compilerOptions.paths ?? {};
    const pathMap = new Map()
    for (const key in paths) {
        pathMap.set(key, path.normalize(path.join(path.dirname(configPath), paths[key][0])))
    }
    arkts.arktsGlobal.filePath = file
    arkts.arktsGlobal.config = arkts.Config.create([
        '_',
        '--arktsconfig',
        configPath,
        file,
        '--extension',
        'ets',
        '--stdlib',
        path.join(process.env.PANDA_SDK_PATH as string, 'ets', 'stdlib'),
        '--output',
        'a.abc'
    ]).peer
    arkts.arktsGlobal.compilerContext = arkts.Context.createFromString(input)
    arkts.proceedToState(arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
    const script = arkts.createETSModuleFromContext()
    let idlVisitor = new IDLVisitor(baseDir, file, pathMap, config)
    idlVisitor.visitor(script)
    const idlFile = idlVisitor.toIDLSuperFile()
    const fileRelativePath = path.relative(baseDir, file)
    const outFile = path.join(outDir, fileRelativePath.replace(".d.ets", ".idl"))
    const outFileDir = path.dirname(outFile)
    if (!fs.existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, { recursive: true })
    }
    if (!idlFile.file.entries.length) {
        idlFile.skipped = true
    } else if (config.DeletedPackages.includes(idlFile.file.packageClause.join("."))) {
        console.log(`WARNING: Package ${idlFile.file.packageClause.join(".")} was deleted`)
        idlFile.skipped = true
    }
    if (!idlFile.skipped) {
        fs.writeFileSync(outFile, idl.toIDLString(idlFile.file, {}), 'utf8')
    }
    idlFile.writeFilePath = outFile
    return idlFile
}

export interface GenerateFromSTSContext {
    inputFiles: string[]
    baseDir: string
    outDir: string
    etsConfigPath: string
    config: ETSVisitorConfig
}

export function generateFromSts({ inputFiles, baseDir, outDir, etsConfigPath, config }: GenerateFromSTSContext): PeerLibrary {
    if (!process.env.PANDA_SDK_PATH) {
        process.env.PANDA_SDK_PATH = path.resolve(__dirname, "../../external/incremental/tools/panda/node_modules/@panda/sdk")
    }
    if (!fs.existsSync(process.env.PANDA_SDK_PATH)) {
        throw new Error("PANDA_SDK_PATH points to unexisting directory")
    }
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }
    console.log(`Use Panda from ${process.env.PANDA_SDK_PATH}`)
    const doJob = processLogger(inputFiles.length)
    const library: IDLSuperFile[] = []
    inputFiles.forEach(file => {
        try {
            doJob(file, () => {
                const idlFile = processFile(outDir, baseDir, file, etsConfigPath, config)
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
        }
    })
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
    return new PeerLibrary(Language.ARKTS)
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
}

interface ExtractTypeParameterInfo {
    set: Set<string>
    parameters: string[] | undefined,
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

class IDLVisitor extends arkts.AbstractVisitor {
    //writer = new IDLLanguageWriter()
    entries: idl.IDLEntry[] = []
    fileName: string
    packageClause: string[] = []
    contextual: NameSuggestion = new NameSuggestion
    private contextualSelectName(synthetic: string): string {
        if (!this.contextual.hasSuggestion)
            return synthetic
        if (this.contextual.forced || synthetic.length > MaxSyntheticTypeLength)
            return this.contextual.name
        return synthetic
    }

    private defaultExportName?: string
    private typeParamsStack: Set<string>[] = []

    private fileReExports: Map<string, string> = new Map()

    private typeReplacements: Map<string, idl.IDLType>[] = []

    private detectPackageNameByPath(fileName: string): string[] {
        if (this.importPathMap.has(fileName)) {
            return this.detectPackageNameByPath(this.importPathMap.get(fileName)!)
        }
        return path.relative(this.basePath, fileName)
            .replaceAll('.d.ets', '')
            .replaceAll('.idl', '')
            .split(path.sep)
            .map(it => it.replaceAll('@', ''))
            .map(it => it.split('-').map((it, i) => i === 0 ? it : capitalize(it)).join('')) // kebab-case to camelCase
            .filter(it => it.length && it !== '.' && it !== '..')
    }

    private mode: 'regular' | 'arkoala' = 'arkoala'

    constructor(
        protected basePath: string,
        protected originalFileName: string,
        protected importPathMap: Map<string, string>,
        protected config: ETSVisitorConfig,
    ) {
        super()
        this.fileName = this.originalFileName.replace(".d.ets", ".idl")
        this.packageClause = this.detectPackageNameByPath(this.originalFileName)
    }
    visitor(node: arkts.AstNode): arkts.AstNode {

        if (arkts.hasModifierFlag(node, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_DEFAULT_EXPORT)) {
            if (arkts.isInterfaceDecl(node)) {
                this.defaultExportName = node.id!.name
            }
            if (arkts.isTSInterfaceDeclaration(node)) {
                this.defaultExportName = node.id!.name
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
            })
        }
        if (arkts.isExportDefaultDeclaration(node)) {
            if (arkts.isIdentifier(node.decl)) {
                this.defaultExportName = node.decl.name
            }
        }

        //////////////////

        if (arkts.isScriptFunction(node)) {
            return this.visitScriptFunction(node)
        }
        if (arkts.isClassDeclaration(node)) {
            return this.visitClassDeclaration(node)
        }
        if (arkts.isInterfaceDecl(node) || arkts.isTSInterfaceDeclaration(node)) {
            return this.visitInterfaceDeclaration(node)
        }
        if (arkts.isImportDeclaration(node)) {
            return this.visitImportDeclaration(node)
        }
        if (arkts.isTSEnumDeclaration(node)) {
            return this.visitEnumDeclaration(node)
        }
        if (arkts.isTSTypeAliasDeclaration(node)) {
            return this.visitTSTypeAliasDeclaration(node)
        }
        if (arkts.isFunctionDeclaration(node)) {
            return this.visitFunctionDeclaration(node)
        }
        if (arkts.isETSModule(node) && node.ident?.name !== 'ETSGLOBAL') {
            return this.visitETSModule(node)
        }

        //////////////////

        return this.visitEachChild(node)
    }

    visitETSModule(node: arkts.ETSModule): arkts.ETSModule {
        const old = this.entries
        this.entries = []
        this.visitEachChild(node)
        const members = this.entries
        this.entries = old
        this.entries.push(idl.createNamespace(
            node.ident!.name,
            members,
            { fileName: this.fileName }
        ))
        return node
    }

    visitEnumDeclaration(node: arkts.TSEnumDeclaration): arkts.TSEnumDeclaration {
        const name = node.key!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            return node
        }
        let result = idl.createEnum(name, [], {})
        let currentValue = 0
        let enumNames = nameEnumValues(node.members.map(it => (it as arkts.TSEnumMember).name))
        result.elements =
            node.members.map((it, index) => {
                let element = (it as arkts.TSEnumMember)
                let [type, value] = this.convertEnumInitializer(element.init)
                if (typeof value === 'number')
                    currentValue = value + 1
                if (typeof value === 'undefined') {
                    value = currentValue
                    currentValue++
                }
                let extendedAttributes: idl.IDLExtendedAttribute[] = []
                if (enumNames[index] != element.name) {
                    extendedAttributes.push({ name: idl.IDLExtendedAttributes.OriginalEnumMemberName, value: element.name })
                }
                return idl.createEnumMember(enumNames[index], result, type, value, { extendedAttributes })
            })
        this.entries.push(result)
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
            initializer = '"' + expression.str + '"'
            type = idl.IDLStringType
        }
        return [type, initializer]
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
                this.entries.push(idl.createImport([...importedPackageClause, 'default'], spec.local!.name))
            }
        })
        return node
    }

    visitFunctionDeclaration(node: arkts.FunctionDeclaration): arkts.FunctionDeclaration {
        const func = node.function!
        if (func.id?.name && this.config.DeletedDeclarations.includes(func.id.name)) {
            return node
        }
        const { set: paramsSet, parameters } = this.extractTypeParameters(func.typeParams)
        this.withTypeParamContext(paramsSet, () => this.contextual.suggestWithTypePrefix(func.id!.name, false, () => {
            const method = idl.createMethod(
                func.id!.name,
                func.params.map(it => {
                    const param = it as arkts.ETSParameterExpression
                    return idl.createParameter(param.name, this.serializeType(param.typeAnnotation), param.isOptional)
                }),
                this.serializeType(func.returnTypeAnnotation),
                {
                    isAsync: func.isAsyncFunc,
                    isFree: true,
                    isOptional: false,
                    isStatic: func.isStaticBlock
                },
                {
                    fileName: this.fileName,
                },
                parameters
            )
            /* arkgen specialization */
            if (node.annotations.find(it => arkts.isIdentifier(it.expr) && it.expr.name === "ComponentBuilder")) {
                const callable = idl.createCallable(
                    "invoke",
                    method.parameters.slice(0, method.parameters.length - 1),
                    method.returnType,
                    {
                        isAsync: method.isAsync,
                        isStatic: method.isStatic
                    },
                    {
                        extendedAttributes: [
                            { name: idl.IDLExtendedAttributes.CallSignature },
                        ]
                    }
                )
                const ifaceName = method.name + 'Interface'
                let iface: idl.IDLInterface | undefined
                if (iface = this.entries.filter(idl.isInterface).find(it => it.name === ifaceName)) {
                    iface.callables.push(callable)
                } else {
                    this.entries.push(idl.createInterface(
                        method.name + 'Interface',
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
            this.contextual.suggest(name, true, () => {
                this.entries.push(this.serializeFunctionType(declaration.typeAnnotation as arkts.ETSFunctionType)[0])
            })
        } else if (arkts.isETSTuple(declaration.typeAnnotation)) {
            this.contextual.suggest(name, true, () => {
                this.entries.push(this.serializeTupleType(declaration.typeAnnotation as arkts.ETSTuple)[0])
            })
        } else {
            const { set: paramsSet, parameters } = this.extractTypeParameters(declaration.typeParams)
            this.withTypeParamContext(paramsSet, () => {
                this.entries.push(idl.createTypedef(
                    name,
                    this.serializeType(declaration.typeAnnotation),
                    parameters,
                    {
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

        members?.forEach(member => {
            if (arkts.isClassProperty(member)) {
                 if (this.shouldNotProcessMember(scopeName, member.id!.name)) {
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
                    return
                }
                if (member.isGetter) {
                    const propType = member.function!.returnTypeAnnotation!
                    const propName = (member.key as arkts.Identifier).name
                    const prop = this.contextual.extend(propName, () => {
                        return idl.createProperty(propName, this.serializeType(propType))
                    })
                    prop.extendedAttributes ??= []
                    if (arkts.hasModifierFlag(propType, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC)) {
                        prop.isStatic = true
                    }
                    prop.extendedAttributes?.push({name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Getter})
                    properties.push(prop)
                    return
                }
                if (member.isSetter) {
                    const firstParameter = member.function!.params[0]
                    const propType = arkts.isETSParameterExpression(firstParameter) ? firstParameter.typeAnnotation! : throwException("Expected parameter")
                    const propName = (member.key as arkts.Identifier).name
                    const prop = this.contextual.extend(propName, () => idl.createProperty(propName, this.serializeType(propType)))
                    prop.extendedAttributes ??= []
                    if (arkts.hasModifierFlag(propType, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC)) {
                        prop.isStatic = true
                    }
                    prop.extendedAttributes?.push({name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Setter})
                    properties.push(prop)
                    return
                }
                const serializedMethod = this.serializeMethod(member, scopeName)
                const key = scopeName + '.' + serializedMethod.name
                if (this.config.ForceCallback.includes(key) && idl.isMethod(serializedMethod)) {
                    const syntheticName = generateSyntheticFunctionName(
                        serializedMethod.parameters,
                        serializedMethod.returnType,
                        serializedMethod.isAsync
                    )
                    this.addSyntheticType(
                        idl.createCallback(
                            syntheticName,
                            serializedMethod.parameters,
                            serializedMethod.returnType,
                            {
                                extendedAttributes: (serializedMethod.extendedAttributes ?? []).concat({ name: idl.IDLExtendedAttributes.Synthetic })
                            }
                        )
                    )
                    properties.push(idl.createProperty(
                        serializedMethod.name,
                        idl.createReferenceType(syntheticName),
                        false,
                        serializedMethod.isStatic,
                        serializedMethod.isOptional,
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
            console.error(member)
            throw new Error("Unhandled member!")
        })

        return {
            properties,
            constructors,
            methods,
            hasMemoAnnotation,
        }
    }

    visitClassDeclaration(declaration: arkts.ClassDeclaration): arkts.ClassDeclaration {
        const name = declaration.definition!.ident!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            return declaration
        }
        const definition = declaration.definition!
        const { set: paramsSet, parameters } = this.extractTypeParameters(definition.typeParams)
        this.withReplacementContext(name, (replacementUsed) => {
            this.withTypeParamContext(paramsSet, () => this.contextual.suggestWithTypePrefix(name, false, () => {
                const inheritance: idl.IDLReferenceType[] = []
                if (definition.super) {
                    const sup = this.serializeType(definition.super)
                    if (!idl.isReferenceType(sup)) {
                        throw new Error("Expected reference type")
                    }
                    inheritance.push(sup)
                }
                if (definition.implements.length) {
                    if (inheritance.length === 0) {
                        inheritance.push(idl.IDLTopType)
                    }
                    definition.implements.forEach(int => {
                        const type = this.serializeType(int.expr)
                        if (!idl.isReferenceType(type)) {
                            throw new Error("Expected reference type")
                        }
                        inheritance.push(type)
                    })
                }

                const { properties, methods, constructors } = this.processBody(name, declaration.definition?.body)
                const attrs: idl.IDLExtendedAttribute[] = [
                    { name: idl.IDLExtendedAttributes.Entity, value: idl.IDLEntity.Class }
                ]
                this.entries.push(idl.createInterface(
                    name,
                    idl.IDLInterfaceSubkind.Class,
                    inheritance,
                    constructors, // ctors
                    undefined, // constants
                    properties,
                    methods,
                    [], // callables
                    replacementUsed ? undefined : parameters,
                    {
                        fileName: this.fileName,
                        extendedAttributes: attrs.length === 0 ? undefined : attrs
                    }
                ))
            }))
        })
        return declaration
    }

    visitInterfaceDeclaration(declaration: arkts.InterfaceDecl | arkts.TSInterfaceDeclaration): arkts.InterfaceDecl | arkts.TSInterfaceDeclaration {
        const name = declaration.id!.name
        if (this.config.DeletedDeclarations.includes(name)) {
            return declaration
        }
        if (this.config.StubbedDeclarations.includes(name)) {
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
        const { set: paramsSet, parameters } = this.extractTypeParameters(declaration.typeParams)
        this.withReplacementContext(name, (replacementUsed) => {
            this.withTypeParamContext(paramsSet, () => this.contextual.suggestWithTypePrefix(name, () => {
                const inheritance: idl.IDLReferenceType[] = []
                if (declaration.extends.length) {
                    declaration.extends.forEach(int => {
                        const type = this.serializeType(int.expr)
                        if (!idl.isReferenceType(type)) {
                            throw new Error("Expected reference type")
                        }
                        inheritance.push(type)
                    })
                }
                const { properties, methods, constructors } = this.processBody(name, declaration.body?.getChildren())
                const attrs: idl.IDLExtendedAttribute[] = []
                this.entries.push(idl.createInterface(
                    name,
                    idl.IDLInterfaceSubkind.Interface,
                    inheritance,
                    constructors, // ctors
                    undefined, // constants
                    properties,
                    methods,
                    [], // callables
                    replacementUsed ? undefined : parameters,
                    {
                        fileName: this.fileName,
                        extendedAttributes: attrs.length === 0 ? undefined : attrs
                    }
                ))
            }))
        })
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
        const { set: paramsSet, parameters: typeParameters } = this.extractTypeParameters((method.value as arkts.FunctionExpression).function?.typeParams)
        return this.withTypeParamContext(paramsSet, () => {
            const { methodName, parameters: arktsParameters, extendedAttributes } = this.processMethodLiteralParameters(method)
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
                    if (last.type === idl.IDLUndefinedType) {
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
                    )
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
            if (arkts.hasModifierFlag(property, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_OPTIONAL)) {
                prop.extendedAttributes ??= []
                prop.isOptional = true
                prop.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Optional })
            }
            if (arkts.hasModifierFlag(property, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC)) {
                prop.isStatic = true
            }
            return prop
        })
    }

    private static etsFunctionTypeReferencePattern = new RegExp(/^Function[0-9]+$/g)
    private static isFunctionTypeReference(name: string) {
        return IDLVisitor.etsFunctionTypeReferencePattern.test(name)
            || name === 'Callback'
    }

    maybeSerializeETSFunctionReference(type: arkts.ETSTypeReference): [idl.IDLCallback, string[]] | undefined {
        let name = type.baseName!.name
        if (!IDLVisitor.isFunctionTypeReference(name)) return undefined
        const [typeArgs, trappedParams] = this.useTypeParametersTrap(() => {
            const typeArgs = type.part?.typeParams?.params.map(it => this.serializeType(it))
            return typeArgs
        })
        const orderedTrappedParams = Array.from(trappedParams)
        const returnType = name === 'Callback' ? typeArgs?.at(1) ?? idl.IDLVoidType : typeArgs?.at(0) ?? idl.IDLVoidType
        let paramsTypes = name === 'Callback' ? [typeArgs!.at(0)!] : typeArgs?.slice(0, -1)
        if (paramsTypes?.length === 1 && paramsTypes[0] === idl.IDLVoidType) {
            paramsTypes = []
        }
        const parameters = paramsTypes?.map((it, index) => idl.createParameter(`value${index}`, it)) ?? []
        const callback = idl.createCallback(
            this.contextualSelectName(generateSyntheticFunctionName(parameters, returnType, arkts.hasModifierFlag(type, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_ASYNC))),
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
            return idl.IDLUndefinedType
        if (arkts.isTSArrayType(type))
            return idl.createContainerType('sequence', [this.serializeType((type as arkts.TSArrayType).elementType)])
        if (arkts.isETSUnionType(type))
            return collapseTypes((type as arkts.ETSUnionType).types.map((it) => this.serializeType(it)))
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

            const typeWillBeReplaced = TypeParameterMap.has(name)
            const typeArgs = typeWillBeReplaced ? undefined : type.part?.typeParams?.params.map(it => this.serializeType(it))
            // special cases //
            switch (name) {
                case 'string': return idl.IDLStringType
                case 'Promise': return idl.createContainerType('Promise', typeArgs ?? [] /* better check here? */)
                case 'Record': return idl.createContainerType('record', typeArgs ?? [] /* better check here? */)
                case 'Map': return idl.createContainerType('record', typeArgs ?? [] /* better check here? */)
                case 'Array': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'Date': return idl.IDLDate
                case 'date': return idl.IDLDate
                case 'Object': return idl.IDLObjectType
                case 'object': return idl.IDLObjectType
                case 'ArrayBuffer': return idl.IDLBufferType
                case 'Uint8Array': return idl.IDLBufferType
                case 'Uint8ClampedArray': return idl.IDLBufferType
                case 'Boolean': return idl.IDLBooleanType
                case 'Int32Array': return idl.createContainerType('sequence', [idl.IDLI32Type])
                case 'IterableIterator': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'ReadonlyArray': return idl.createContainerType('sequence', typeArgs ?? [] /* better check here? */)
                case 'number': return idl.IDLNumberType
                case 'ErrorCallback': return idl.createReferenceType(name)
                case 'BusinessError': return idl.createReferenceType(name)
                case 'Required':
                case 'Readonly': return typeArgs![0]
                case 'Optional': return idl.createOptionalType(typeArgs![0])
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
                case 'Bindable': return typeArgs![0]
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

    serializeFunctionType(type: arkts.ETSFunctionType): [idl.IDLCallback, string[]] {
        const [[parameters, returnType], typeParams] = this.useTypeParametersTrap(() => {
            const parameters = type.params.map(it => {
                let param = it as arkts.ETSParameterExpression
                return idl.createParameter(param.name, this.serializeType(param.typeAnnotation!), param.isOptional, param.isRestParameter)
            })
            const returnType = this.serializeType(type.returnType)
            return [parameters, returnType] as const
        })
        const orderedTypeParameters = Array.from(typeParams)
        const result = idl.createCallback(
            this.contextualSelectName(generateSyntheticFunctionName(parameters, returnType, arkts.hasModifierFlag(type, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_ASYNC))),
            parameters,
            returnType,
            { fileName: this.fileName },
            orderedTypeParameters.length ? orderedTypeParameters : undefined
        )
        result.extendedAttributes ??= []
        if (!this.contextual.hasSuggestion || !this.contextual.forced)
            result.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Synthetic })

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
        node?.params.forEach(param => {
            if (param.name) {
                // constraint and default value lost here
                result.push(param.name?.name)
            }
        })
        if (result.length === 0) {
            return {
                parameters: undefined,
                set: new Set(),
                attrs: []
            }
        }
        return {
            set: new Set(result),
            attrs: [{ name: idl.IDLExtendedAttributes.TypeParameters, value: result.join(',') }],
            parameters: result
        }
    }

    withTypeParamContext<T>(params: Set<string>, op: () => T): T {
        this.typeParamsStack.push(params)
        const r = op()
        this.typeParamsStack.pop()
        return r
    }
    withReplacementContext<T>(name: string, op: (found:boolean) => T): T {
        if (TypeParameterMap.has(name)) {
            const mapping = TypeParameterMap.get(name)!
            this.typeReplacements.push(mapping)
            const r = op(true)
            this.typeReplacements.pop()
            return r
        }
        return op(false)
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

    postprocessEntires() {
        if (this.mode === 'arkoala') {
            /* arkgen specialization */
            const componentInterface = this.entries.find(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.ComponentInterface))
            if (componentInterface) {
                if (!idl.isInterface(componentInterface)) {
                    throw new Error("ComponentInterface must be interface!")
                }
                const componentUIAttributeRef = componentInterface.callables.at(0)?.returnType
                if (!componentUIAttributeRef || !idl.isReferenceType(componentUIAttributeRef)) {
                    throw new Error("No component attribute found!")
                }
                if (!componentUIAttributeRef.name.startsWith("UI")) {
                    throw new Error("Expecting component attribute to be started with UI like UICommonMethod. If it is not match this criteria, please ensure SDK is correct")
                }
                const componentUIAttributeName = componentUIAttributeRef.name
                const componentAttributeName = componentUIAttributeRef.name.slice(2)
                if (componentUIAttributeRef.name.startsWith("UI")) {
                    componentInterface.callables.forEach(it => it.returnType = idl.createReferenceType(
                        componentAttributeName,
                        componentUIAttributeRef.typeArguments,
                        {
                            documentation: componentUIAttributeRef.documentation,
                            extendedAttributes: componentUIAttributeRef.extendedAttributes,
                            fileName: componentUIAttributeRef.fileName
                        }
                    ))
                }
                const processedEntries: idl.IDLEntry[] = []
                this.entries.forEach(entry => {
                    if (entry.name === componentInterface.name && entry !== componentInterface) {
                        return
                    }
                    if (entry.name === componentUIAttributeName) {
                        return
                    }
                    if (entry.name === componentAttributeName && idl.isInterface(entry)) {
                         this.postprocessComponent(entry)
                    }
                    if (idl.isCallback((entry))) {
                        let hasComponentInReferences = false
                        idl.forEachChild(entry, (node) => {
                            if (idl.isNamedNode(node) && [componentUIAttributeName, componentAttributeName].includes(node.name))
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

            this.entries.forEach(entry => {
                if (idl.isInterface(entry) && this.config.Components.includes(entry.name)) {
                    this.postprocessComponent(entry)
                }
            })

            // convert components methods to attributes
            for (const entry of this.entries) {
                if (idl.isInterface(entry) && idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Component)) {
                    entry.methods = entry.methods.filter(method => {
                        if (method.parameters.length === 1) {
                            entry.properties.push(idl.createProperty(
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
                }
            }
        }

        /* remove synthetic duplicates */
        function removeDuplicatedByScope(entries: idl.IDLEntry[]): idl.IDLEntry[] {
            const namesCount = new Map<string, number>()
            const result: idl.IDLEntry[] = []
            entries.forEach(entry => {
                namesCount.set(entry.name, (namesCount.get(entry.name) ?? 0) + 1)
            })
            entries.forEach(entry => {
                if (idl.isNamespace(entry)) {
                    entry.members = removeDuplicatedByScope(entry.members)
                }
                const count = namesCount.get(entry.name)!
                if (count > 1) {
                    if (idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Synthetic)) {
                        result.push(entry)
                    }
                } else {
                    result.push(entry)
                }
            })
            return result
        }

        const mappers = [
            (node: idl.IDLNode) => {
                if (idl.isInterface(node)) this.escapeSameNamedMethods(node)
            },
            (node: idl.IDLNode) => {
                if (idl.isInterface(node)) {
                    node.properties = filterRedundantAttributesOverloads(node.properties)
                    node.methods = filterRedundantMethodsOverloads(node.methods)
                }
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
        }
    }
}

