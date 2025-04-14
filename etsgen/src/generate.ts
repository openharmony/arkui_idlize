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

import { IDLFile, IDLLibrary, IDLMethod, Language, PeerLibrary } from "@idlizer/core"
import * as arkts from "@koalaui/libarkts"
import * as idl from "@idlizer/core/idl"
import * as path from "path"
import * as fs from "fs"

function processFile(outDir: string, file: string) {
    console.log(`Processing ${file}`)
        let input = fs.readFileSync(file).toString()
        //let module = arkts.createETSModuleFromSource(input, arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
        arkts.arktsGlobal.filePath = file
        arkts.arktsGlobal.config = arkts.Config.create([
            '_',
            '--arktsconfig',
            path.resolve(__dirname, "..", "config.json"),
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
        let idlVisitor = new IDLVisitor(file)
        idlVisitor.visitor(script)
        let idlFile = idlVisitor.toIDLFile()
        let outFile = path.join(outDir, path.basename(file).replace(".d.ets", ".idl"))
        fs.writeFileSync(outFile, idl.toIDLString(idlFile, {}), "utf-8")
}

export function generateFromSts(inputFiles: string[], outDir: string): PeerLibrary {
    if (!process.env.PANDA_SDK_PATH) {
        process.env.PANDA_SDK_PATH = path.resolve(__dirname, "../../node_modules/@panda/sdk")
    }
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }
    console.log(`Use Panda from ${process.env.PANDA_SDK_PATH}`)
    let result = new PeerLibrary(Language.ARKTS)
    inputFiles.forEach(file => {
        try {
            processFile(outDir, file)
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

class IDLVisitor extends arkts.AbstractVisitor {
    //writer = new IDLLanguageWriter()
    entries: idl.IDLEntry[] = []
    fileName: string

    constructor(fileName: string) {
        super()
        this.fileName = fileName.replace(".d.ets", ".idl")
    }
    visitor(node: arkts.AstNode): arkts.AstNode {
        if (arkts.isScriptFunction(node)) {
            return this.visitScriptFunction(node)
        }
        if (arkts.isClassDeclaration(node)) {
            return this.visitClassDeclaration(node)
        }
        if (arkts.isInterfaceDecl(node)) {
            return this.visitInterfaceDeclaration(node)
        }
        if (arkts.isImportDeclaration(node)) {
            return this.visitImportDeclaration(node)
        }
        if (arkts.isTSEnumDeclaration(node)) {
            return this.visitEnumDeclaration(node)
        }
        return this.visitEachChild(node)
    }

    visitEnumDeclaration(node: arkts.TSEnumDeclaration): arkts.TSEnumDeclaration {
        let result = idl.createEnum(node.key!.name, [], {})
        result.elements =
            node.members.map(it => {
                let element = (it as arkts.TSEnumMember)
                let [type, value] = this.convertEnumInitializer(element.init)
                return idl.createEnumMember(element.name, result, type, value)
            })
        return node
    }

    convertEnumInitializer(expression: arkts.Expression|undefined): [idl.IDLPrimitiveType, string|number|undefined] {
        return [idl.IDLNumberType, undefined]
    }

    visitImportDeclaration(node: arkts.ImportDeclaration): arkts.ImportDeclaration {
        this.entries.push(idl.createImport([`"${node.source!.str}"`]))
        return node
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
        this.entries.push(idl.createInterface(
            name,
            idl.IDLInterfaceSubkind.Class,
            [], // inneritance
            [], // ctors
            undefined, // constants
            declaration.definition!.body.filter(arkts.isClassProperty).map(it => this.serializeClassProperty(it)),
            declaration.definition!.body.filter(arkts.isMethodDefinition).map(it => this.serializeMethod(it)),
            [], // callables
            [], // type parameters
            {
                fileName:this.fileName,
            }
        ))
        return declaration
    }

    visitInterfaceDeclaration(declaration: arkts.InterfaceDecl): arkts.InterfaceDecl {
        const name = declaration.id!.name
        this.entries.push(idl.createInterface(
            name,
            idl.IDLInterfaceSubkind.Interface,
            [], // inneritance
            [], // ctors
            undefined, // constants
            declaration.body!.getChildren().filter(arkts.isClassProperty).map(it => this.serializeClassProperty(it)),
            declaration.body!.getChildren().filter(arkts.isMethodDefinition).map(it => this.serializeMethod(it)),
            [], // callables
            [], // type parameters
            {
                fileName:this.fileName,
            }
        ))
        return declaration
    }

    serializeMethod(method: arkts.MethodDefinition): IDLMethod {
        return idl.createMethod(method.id!.name,
            method.function.params.map(it => {
                let param = it as arkts.ETSParameterExpression
                return idl.createParameter(param.name, this.serializeType(param.typeAnnotation))
            }),
            this.serializeType(method.function.returnTypeAnnotation!))
    }

    serializeClassProperty(property: arkts.ClassProperty): idl.IDLProperty {
        return idl.createProperty((property.key as arkts.Identifier).name,
            this.serializeType(property.typeAnnotation!))
    }

    serializeType(type: arkts.TypeNode|undefined): idl.IDLType {
        if (!type) return idl.IDLVoidType
        if (arkts.isTSAnyKeyword(type))
            return idl.IDLAnyType
        if (arkts.isETSUndefinedType(type))
            return idl.IDLUndefinedType
        if (arkts.isETSNullType(type))
            return idl.IDLUndefinedType
        if (arkts.isTSArrayType(type))
            return idl.createContainerType('sequence', [this.serializeType((type as arkts.TSArrayType).elementType)])
        if (arkts.isETSUnionType(type))
            return idl.createUnionType((type as arkts.ETSUnionType).types.map((it) => this.serializeType(it)))
        if (arkts.isETSTypeReference(type))
            return idl.createReferenceType((type as arkts.ETSTypeReference).baseName!.name)
        if (arkts.isETSTypeReference(type))
            return idl.createReferenceType((type as arkts.ETSTypeReference).baseName!.name)
        if (arkts.isETSPrimitiveType(type))
            return this.serializePrimitive((type as arkts.ETSPrimitiveType).primitiveType)
        if (arkts.isETSFunctionType(type)) {
            const funcType = this.serializeFunctionType(type as arkts.ETSFunctionType)
            if (!this.seenTypes.has(funcType.name)) {
                this.seenTypes.add(funcType.name)
                this.addSyntheticType(funcType)
            }
            return idl.createReferenceType(funcType.name)
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

    serializeFunctionType(type: arkts.ETSFunctionType): idl.IDLCallback {
        let result = idl.createCallback(
            this.makeFunctionTypeName(type),
            type.params.map(it => {
                let param = it as arkts.ETSParameterExpression
                return idl.createParameter(param.name, this.serializeType(param.typeAnnotation!))
            }),
            this.serializeType(type.returnType))
        result.extendedAttributes ??= []
        result.extendedAttributes.push({ name: idl.IDLExtendedAttributes.Synthetic })
        return result
    }

    makeFunctionTypeName(type: arkts.ETSFunctionType): string {
        return `Callback_${type.params.map(it => {
            let param = it as arkts.ETSParameterExpression
            return idl.createParameter(param.name, this.serializeType(param.typeAnnotation!))
        }).map(it => idl.printType(it.type)).join("_")}`
    }

    addSyntheticType(entry: idl.IDLCallback) {
        this.entries.push(entry)
    }

    toIDLFile(): IDLFile {
        return idl.createFile(this.entries)
    }
}

