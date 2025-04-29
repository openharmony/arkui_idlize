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

import { capitalize, generateSyntheticFunctionName, generateSyntheticIdlNodeName, IDLFile, IDLLibrary, IDLMethod, Language, PeerLibrary, throwException } from "@idlizer/core"
import * as arkts from "@koalaui/libarkts"
import * as idl from "@idlizer/core/idl"
import * as path from "node:path"
import * as fs from "node:fs"

function processFile(outDir: string, baseDir: string, file: string) {
    let input = fs.readFileSync(file).toString()
    //let module = arkts.createETSModuleFromSource(input, arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
    const configPath = path.resolve(__dirname, "..", "config.json")
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
    let idlVisitor = new IDLVisitor(baseDir, file, pathMap)
    idlVisitor.visitor(script)
    const idlFile = idlVisitor.toIDLFile()
    const fileRelativePath = path.relative(baseDir, file)
    const outFile = path.join(outDir, fileRelativePath.replace(".d.ets", ".idl"))
    const outFileDir = path.dirname(outFile)
    if (!fs.existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, { recursive: true })
    }
    fs.writeFileSync(outFile, idl.toIDLString(idlFile, {}), "utf-8")
    return outFile
}

export function generateFromSts(inputFiles: string[], baseDir: string, outDir: string): PeerLibrary {
    if (!process.env.PANDA_SDK_PATH) {
        process.env.PANDA_SDK_PATH = path.resolve(__dirname, "../../node_modules/@panda/sdk")
    }
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }
    console.log(`Use Panda from ${process.env.PANDA_SDK_PATH}`)
    let result = new PeerLibrary(Language.ARKTS)
    const doJob = processLogger(inputFiles.length)
    inputFiles.forEach(file => {
        try {
            doJob(file, () => {
                return processFile(outDir, baseDir, file)
            })
        } catch (e: any) {
            console.log(e)
            if (e.trace)
                console.log(e.trace)
            // But current es2panda just forcefully exits.
            // throw e
        }
    })
    return result
}

function processLogger(amount: number) {
    let done = 1
    return (fileName: string, op: () => string) => {
        console.log(`[ ${done.toString()}/${amount.toString()} ] Processing ${fileName}`)
        try {
            const outFile = op()
            console.log(`  ... saved to ${outFile}`)
        } catch (ex: unknown) {
            console.log(`  ... failed`)
            throw ex
        } finally {
            ++done
        }
    }
}

interface ExtractTypeParameterInfo {
    set: Set<string>
    parameters: string[] | undefined,
    attrs: idl.IDLExtendedAttribute[]
}

class IDLVisitor extends arkts.AbstractVisitor {
    //writer = new IDLLanguageWriter()
    entries: idl.IDLEntry[] = []
    fileName: string
    packageClause: string[] = []

    private defaultExportName?: string
    private typeParamsStack: Set<string>[] = []

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

    constructor(
        protected basePath: string,
        protected originalFileName: string,
        protected importPathMap: Map<string, string>
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
                const [ spec ] = node.specifiers
                this.defaultExportName = spec.local!.name
            }
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
        let result = idl.createEnum(node.key!.name, [], {})
        result.elements =
            node.members.map(it => {
                let element = (it as arkts.TSEnumMember)
                let [type, value] = this.convertEnumInitializer(element.init)
                return idl.createEnumMember(element.name, result, type, value)
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
        const { set:paramsSet, parameters } = this.extractTypeParameters(func.typeParams)
        this.withTypeParamContext(paramsSet, () => {
            this.entries.push(idl.createMethod(
                func.id!.name,
                func.params.map(it => {
                    const param = it as arkts.ETSParameterExpression
                    return idl.createParameter(param.name, this.serializeType(param.typeAnnotation))
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
            ))
        })
        return node
    }

    visitTSTypeAliasDeclaration(declaration: arkts.TSTypeAliasDeclaration): arkts.TSTypeAliasDeclaration {
        const { set:paramsSet, parameters } = this.extractTypeParameters(declaration.typeParams)
        this.withTypeParamContext(paramsSet, () => {
            this.entries.push(idl.createTypedef(
                declaration.id!.name,
                this.serializeType(declaration.typeAnnotation),
                parameters,
                {
                    fileName: this.fileName,
                })
            )
        })
        return declaration
    }

    visitScriptFunction(node: arkts.ScriptFunction): arkts.ScriptFunction {
        return this.visitEachChild(node) as arkts.ScriptFunction
    }

    private printNode(node: arkts.AstNode) {
        let name = arkts.isIdentifier(node) ? `'${node.name}'` : ""
        return `${" ".repeat(4 * this.indentation) + node.constructor.name} ${name}`
    }

    visitClassDeclaration(declaration: arkts.ClassDeclaration): arkts.ClassDeclaration {
        const name = declaration.definition!.ident!.name
        const definition = declaration.definition!
        const { set:paramsSet, parameters } = this.extractTypeParameters(definition.typeParams)
        this.withTypeParamContext(paramsSet, () => {
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
            const properties: idl.IDLProperty[] = []
            const method: idl.IDLMethod[] = []
            declaration.definition?.body.forEach(member => {
                if (arkts.isClassProperty(member)) {
                    properties.push(this.serializeClassProperty(member))
                    return
                }
                if (arkts.isMethodDefinition(member)) {
                    method.push(this.serializeMethod(member))
                    return
                }
                console.error(member)
                throw new Error("Unhandled member!")
            })
            this.entries.push(idl.createInterface(
                name,
                idl.IDLInterfaceSubkind.Class,
                inheritance,
                [], // ctors
                undefined, // constants
                properties,
                method,
                [], // callables
                parameters,
                {
                    fileName: this.fileName,
                    extendedAttributes: [{ name: idl.IDLExtendedAttributes.Entity, value: idl.IDLEntity.Class }]
                }
            ))
        })
        return declaration
    }

    visitInterfaceDeclaration(declaration: arkts.InterfaceDecl | arkts.TSInterfaceDeclaration): arkts.InterfaceDecl | arkts.TSInterfaceDeclaration {
        const name = declaration.id!.name
        const { set:paramsSet, parameters } = this.extractTypeParameters(declaration.typeParams)
        this.withTypeParamContext(paramsSet, () => {
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
            this.entries.push(idl.createInterface(
                name,
                idl.IDLInterfaceSubkind.Interface,
                inheritance,
                [], // ctors
                undefined, // constants
                declaration.body!.getChildren().filter(arkts.isClassProperty).map(it => this.serializeClassProperty(it)),
                declaration.body!.getChildren().filter(arkts.isMethodDefinition).map(it => this.serializeMethod(it)),
                [], // callables
                parameters,
                {
                    fileName: this.fileName,
                }
            ))
        })
        return declaration
    }

    serializeMethod(method: arkts.MethodDefinition): IDLMethod {
        const { set:paramsSet, parameters } = this.extractTypeParameters((method.value as arkts.FunctionExpression).function?.typeParams)
        return this.withTypeParamContext(paramsSet, () => {
            return idl.createMethod(method.id!.name,
                method.function!.params.map(it => {
                    let param = it as arkts.ETSParameterExpression
                    return idl.createParameter(param.name, this.serializeType(param.typeAnnotation))
                }),
                this.serializeType(method.function!.returnTypeAnnotation!),
                undefined /* todo: methodInitilizer */,
                undefined /* todo: nodeInitilizer */,
                parameters
            )
        })
    }

    serializeClassProperty(property: arkts.ClassProperty): idl.IDLProperty {
        const prop = idl.createProperty((property.key as arkts.Identifier).name, this.serializeType(property.typeAnnotation!))
        if (arkts.hasModifierFlag(property, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_OPTIONAL)) {
            prop.extendedAttributes ??= []
            prop.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Optional })
        }
        return prop
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
            return idl.createUnionType((type as arkts.ETSUnionType).types.map((it) => this.serializeType(it)))
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
                this.typeParameterFound(name)
                return idl.createTypeParameterReference(name)
            }
            const typeArgs = type.part?.typeParams?.params.map(it => this.serializeType(it))
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
                case 'Uint8ClampedArray': return idl.IDLBufferType
                case 'Boolean': return idl.IDLBooleanType
                case 'Int32Array': return idl.createContainerType('sequence', [idl.IDLI32Type])
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
            generateSyntheticFunctionName(parameters, returnType, arkts.hasModifierFlag(type, arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_ASYNC)),
            parameters,
            returnType,
            { fileName: this.fileName },
            orderedTypeParameters.length ? orderedTypeParameters : undefined
        )
        result.extendedAttributes ??= []
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
        const result = idl.createInterface(
            'Tuple_' + properties.map(it => generateSyntheticIdlNodeName(it)).join('_'),
            idl.IDLInterfaceSubkind.Tuple,
            [], [], [],
            properties.map((it, idx) => {
                return idl.createProperty(`value${idx}`, it)
            })
            , [], [],
            orderedTypeParameters.length ? orderedTypeParameters : undefined,
            {
                fileName: this.fileName,
                extendedAttributes: [
                    { name: idl.IDLExtendedAttributes.Synthetic },
                    { name: idl.IDLExtendedAttributes.Entity, value: idl.IDLEntity.Tuple }
                ]
            }
        )
        return [result, orderedTypeParameters]
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

    toIDLFile(): IDLFile {
        this.markDefaultExport()
        return idl.linkParentBack(idl.createFile(this.entries, this.fileName, this.packageClause))
    }
}

