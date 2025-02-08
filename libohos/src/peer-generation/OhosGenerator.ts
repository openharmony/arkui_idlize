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

import * as fs from 'fs'
import * as path from 'path'
import * as idl from '@idlizer/core/idl'
import {
    createConstructor,
    createContainerType,
    createOptionalType,
    createParameter,
    createReferenceType,
    createTypeParameterReference,
    forceAsNamedNode,
    hasExtAttribute,
    IDLBufferType,
    IDLCallback,
    IDLConstructor,
    IDLEnum,
    IDLExtendedAttributes,
    IDLI32Type,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLPointerType,
    IDLType,
    IDLU8Type,
    IDLVoidType,
    isCallback,
    isConstructor,
    isContainerType,
    isEnum,
    isInterface,
    isReferenceType,
    isUnionType
} from '@idlizer/core/idl'
import {
    ArgConvertor,
    capitalize,
    CppInteropConvertor,
    FunctionCallExpression,
    generateCallbackAPIArguments,
    generatorConfiguration,
    generatorTypePrefix,
    IndentedPrinter,
    Language,
    LanguageStatement,
    LanguageWriter,
    PeerMethod,
    qualifiedName,
    setDefaultConfiguration,
    isMaterialized,
    PeerLibrary
} from '@idlizer/core'
import { createOutArgConvertor } from './PromiseConvertors'
import { ArkPrimitiveTypesInstance } from './ArkPrimitiveType'
import { getInteropRootPath, makeDeserializeAndCall, makeSerializerForOhos, readLangTemplate } from './FileGenerators'
import { getUniquePropertiesFromSuperTypes } from './idl/IdlPeerGeneratorVisitor'
import {
    CppLanguageWriter,
    ExpressionStatement,
    LanguageExpression,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature
} from './LanguageWriters'
import { printBridgeCcForOHOS } from './printers/BridgeCcPrinter'
import { printCallbacksKinds, printManagedCaller } from './printers/CallbacksPrinter'
import { writeDeserializer, writeSerializer } from './printers/SerializerPrinter'
import { CppSourceFile } from './printers/SourceFile'
import { StructPrinter } from './printers/StructPrinter'
import { NativeModule } from './NativeModule'
import {
    collapseSameMethodsIDL,
    groupOverloads,
    groupOverloadsIDL,
    OverloadsPrinter
} from './printers/OverloadsPrinter'
import { MaterializedClass, MaterializedMethod } from '@idlizer/core'
import { writePeerMethod } from './printers/PeersPrinter'
import { TargetFile } from "./printers/TargetFile"
import { printInterfaces } from './printers/InterfacePrinter'
import { DefaultConfig } from '../'

class NameType {
    constructor(public name: string, public type: string) {}
}

interface SignatureDescriptor {
    params: NameType[]
    returnType: string
    paramsCString?: string
}

interface DependecyCollector {

    parseImport(imp: idl.IDLImport): void
    collect(decl: idl.IDLNode, fileName?: string, traverse?: boolean): void
    getImportLines(fileName: string): string[]
    dump(): void
}

class OneFileDependecyCollector implements DependecyCollector {

    parseImport(imp: idl.IDLImport): void {
    }
    collect(decl: idl.IDLNode, fileName?: string, traverse?: boolean): void {
    }
    getImportLines(fileName: string): string[] {
        return []
    }
    dump(): void {
    }
}
class ManyFilesDependecyCollector implements DependecyCollector{

    // file -> imports
    fileToImpors: Map<string, Set<idl.IDLImport>> = new Map()
    // already seen declarations
    seen: Set<string> = new Set()
    // declaration -> name
    declToFile: Map<string, string> = new Map()
    // file -> declarations
    fileToDeclSet: Map<string, Set<string>> = new Map()
    // declaration -> dependencies
    dependencies: Map<string, Set<string>> = new Map()

    constructor(private library: PeerLibrary) {
    }

    collect(decl: idl.IDLNode, fileName?: string, traverse: boolean = true) {
        if (!fileName) {
            fileName = getFileNameFromDeclaration(decl)
        }
        let declName: string | undefined = undefined
        if (idl.isInterface(decl)) {
            declName = decl.name
            if (traverse) {
                this.dependencies.set(declName, new Set(this.collectInterface(decl)))
            }
        } else if (idl.isReferenceType(decl)) {
            declName = decl.name
        }
        if (declName) {
            // IDLNode file name is unknown
            if (fileName == "unknown") {
                // try to reuse the existed one
                fileName = this.declToFile.get(declName)
                if (!fileName) {
                    console.log(`Unable find the file for the declaration: ${declName}`)
                    fileName = "unknown"
                }
            }
            this.seen.add(declName)
            this.declToFile.set(declName, fileName)
            if (!this.fileToDeclSet.has(fileName)) {
                this.fileToDeclSet.set(fileName, new Set())
            }
            this.fileToDeclSet.get(fileName)?.add(declName)
        }
    }

    parseImport(imp: idl.IDLImport) {
        if (!imp.importClause) {
            return
        }
        const fileName = getFileNameFromDeclaration(imp)
        // console.log(`File name: "${fileName}", import: ${imp.name}, clause: ${imp.importClause}`)
        let imports = this.fileToImpors.get(fileName)
        if (!imports) {
            imports = new Set()
        }
        imports.add(imp)
        this.fileToImpors.set(fileName, imports)
    }

    getImportLines(fileName: string): string[] {
        const importLines: string[] = []

        // imports from IDLImport
        const imps = this.fileToImpors.get(fileName)
        if (imps) {
            for (const imp of imps) {
                importLines.push(this.getImportLine(imp.name, imp.importClause))
            }
        }

        // import from dependencies
        const declarations = this.fileToDeclSet.get(fileName)
        if (!declarations) {
            return importLines
        }

        for (const decl of declarations) {
            //  file to decl
            const importsMap = new Map<string, string[]>()
            const deps = this.dependencies.get(decl)
            if (!deps) {
                continue
            }
            for (const d of deps) {
                // Add only collected declarations
                if (this.seen.has(d)) {
                    const f = this.declToFile.get(d)
                    if (!f) {
                        continue
                    }
                    let imports = importsMap.get(f)
                    if (!imports) {
                        imports = []
                    }
                    if (!imports.includes(d)) {
                        imports.push(d)
                        importsMap.set(f, imports)
                    }
                }
            }
            for (const [f, imports] of importsMap) {
                if (f == fileName) {
                    continue
                }
                importLines.push(this.getImportLine(`./${f}`, imports))
            }
        }
        return importLines
    }

    private getImportLine(path: string, imports?: string[]) : string {
        return `import { ${imports?.join(", ")} } from "${path}"`
    }

    private collectTypeReference(type?: idl.IDLReferenceType): string {
        if (!type) {
            return this.NONE_TYPE
        }
        const resolvedType = this.library.resolveTypeReference(type)
        if (!resolvedType) return this.NONE_TYPE
        this.collect(resolvedType, undefined, false)
        return idl.isNamedNode(resolvedType) ? type.name : this.NONE_TYPE
    }

    NONE_TYPE: string = "NONE_TYPE"
    private collectInterface(decl: idl.IDLInterface): string[] {
        const superType = idl.getSuperType(decl)
        return [
            this.collectTypeReference(superType),
            ...decl.properties
                .map(prop => this.collectType(prop.type))
                .filter(it => it != this.NONE_TYPE),
            ...decl.methods
                .flatMap(meth => [
                    this.collectType(meth.returnType),
                    ...meth.parameters.map(param => this.collectType(param.type)),
                ])
                .filter(it => it != this.NONE_TYPE),
        ]
    }

    private collectType(type: idl.IDLType): string {
        if (idl.isNamedNode(type)) {
            if (type.name == "ApplicationContext") {
                console.log(`Type: ApplicationContext`)
            }
        }
        if (idl.isReferenceType(type)) {
            return this.collectTypeReference(type)
        }
        return idl.isNamedNode(type) ? type.name : this.NONE_TYPE
    }

    dump() {
        console.log(`Dump dependency collector`)
        console.log(`Seen:`)
        console.log(`  ${Array.from(this.seen)}`)
        console.log(`Decl to files`)
        for (const [decl, file] of this.declToFile) {
            console.log(`  decl: ${decl} -> file: ${file}`)
        }
        console.log(`File to decls`)
        for (const [file, declSet] of this.fileToDeclSet) {
            console.log(`  file: ${file} -> decl: ${Array.from(declSet)}`)
        }
        console.log(`Decl to imports`)
        for (const [decl, imports] of this.dependencies) {
            console.log(`  decl: ${decl} -> imports: ${Array.from(imports)}`)
        }
    }
}

function writeCJMethod(writer: LanguageWriter, method: {name: string, method: NamedMethodSignature}) {
    let arrayLikeTypes = new Set(['Uint8Array', 'KUint8ArrayPtr', 'KInt32ArrayPtr', 'KFloat32ArrayPtr', 'ArrayBuffer'])
    let stringLikeTypes = new Set(['String', 'KString', 'KStringPtr', 'string'])

    writer.writeMethodImplementation(new Method((method.name.startsWith('_') ? '' : '_').concat(method.name), method.method, [MethodModifier.STATIC]), () => {
        let parameters = method.method
        let functionCallArgs: Array<string> = []
        writer.print('unsafe {')
        writer.pushIndent()
        let ordinal = 0
        for(let param of parameters.args) {
            if (idl.isContainerType(param) || arrayLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                functionCallArgs.push(`handle_${ordinal}.pointer`)
                writer.print(`let handle_${ordinal} = acquireArrayRawData(${parameters.argsNames[ordinal]}.toArray())`)
            } else if (stringLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                writer.print(`let ${parameters.argsNames[ordinal]} =  LibC.mallocCString(${parameters.argsNames[ordinal]})`)
                functionCallArgs.push(parameters.argsNames[ordinal])
            } else {
                functionCallArgs.push(parameters.argsNames[ordinal])
            }
            ordinal += 1
        }
        const resultVarName = 'result'
        let shouldReturn = false
        let returnType = method.method.returnType 
        let nativeName = method.name 
        if (returnType === idl.IDLVoidType) {
            writer.print(`${new FunctionCallExpression(nativeName.startsWith('_') ? nativeName.substring(1) : nativeName, functionCallArgs.map(it => writer.makeString(it))).asString()}`)
        } else if (returnType === idl.IDLStringType) {
            let expr = new FunctionCallExpression(nativeName.startsWith('_') ? nativeName.substring(1) : nativeName, functionCallArgs.map(it => writer.makeString(it)))
            let final_expr = writer.makeMethodCall(expr.asString(), 'toString', [])
            writer.writeStatement(
                writer.makeAssign(
                    resultVarName,
                    undefined,
                    final_expr,
                    true
                )
            )
            shouldReturn = true
        } else {
            writer.writeStatement(
                writer.makeAssign(
                    resultVarName,
                    undefined,
                    new FunctionCallExpression(nativeName.startsWith('_') ? nativeName.substring(1) : nativeName, functionCallArgs.map(it => writer.makeString(it))),
                    true
                )
            )
            shouldReturn = true
        }
        for(let param of parameters.args) {
            let ordinal = parameters.args.indexOf(param)
            if (idl.isContainerType(param) || arrayLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                writer.print(`releaseArrayRawData(handle_${ordinal})`)
            } else if (stringLikeTypes.has(idl.forceAsNamedNode(param).name)) {
                writer.print(`LibC.free(${parameters.argsNames[ordinal]})`)
            }
        }

        if (shouldReturn) {
            writer.writeStatement(writer.makeReturn(writer.makeString(resultVarName)))
        }
        writer.popIndent()
        writer.print('}')
    })    
}

abstract class OHOSVisitor {
    implementationStubsFile: CppSourceFile

    hWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)
    cppWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)

    dependecyCollector: DependecyCollector

    nativeWriter: LanguageWriter
    nativeFunctionsWriter: LanguageWriter
    arkUIFunctionsWriter: LanguageWriter
    nativeFunctionsWriterCJ: LanguageWriter

    libraryName: string = ""

    interfaces = new Array<IDLInterface>()
    data = new Array<IDLInterface>()
    enums = new Array<IDLEnum>()
    callbacks = new Array<IDLCallback>()
    callbackInterfaces = new Array<IDLInterface>()
    cjInterfaces = new Map<TargetFile, string>()

    constructor(protected library: PeerLibrary, libraryName: string, dependencyCollector: DependecyCollector) {
        if (this.library.files.length == 0)
            throw new Error("No files in library")

        this.libraryName = libraryName
        this.library.name = libraryName
        this.dependecyCollector = dependencyCollector

        this.nativeWriter = library.createLanguageWriter()
        this.nativeFunctionsWriter = library.createLanguageWriter()
        this.arkUIFunctionsWriter = library.createLanguageWriter()
        this.nativeFunctionsWriterCJ = library.createLanguageWriter()

        const fileNamePrefix = this.libraryName.toLowerCase()
        this.implementationStubsFile = new CppSourceFile(`${fileNamePrefix}Impl_template${Language.CPP.extension}`, library)
        this.implementationStubsFile.addInclude(`${fileNamePrefix}.h`)
    }

    private static knownBasicTypes = new Set(['ArrayBuffer', 'DataView'])

    mapType(type: IDLType | IDLEnum): string {
        const typeName = isEnum(type)
            ? type.name
            : isContainerType(type) || isUnionType(type)
                ? ''
                : idl.isOptionalType(type)
                    ? `Opt_${this.libraryName}_${this.mapType(type.type)}`
                    : idl.forceAsNamedNode(type).name
        if (OHOSVisitor.knownBasicTypes.has(typeName)) {
            return this.mangleTypeName(typeName)
        }
        if (isReferenceType(type) || isEnum(type)) {
            return this.mangleTypeName(qualifiedName(type, Language.CPP)).replaceAll(".", "_")
        }
        return this.hWriter.getNodeName(type)
    }

    makeSignature(returnType: IDLType, parameters: IDLParameter[]): MethodSignature {
        return new MethodSignature(returnType, parameters.map(it => it.type!))
    }

    private writeCallback(callback: IDLCallback) {
        // TODO commonize with StructPrinter.ts
        const callbackTypeName = this.mangleTypeName(callback.name);
        const args = generateCallbackAPIArguments(this.library, callback)
        let _ = this.hWriter
        _.print(`typedef struct ${callbackTypeName} {`)
        _.pushIndent()
        _.print(`${this.mangleTypeName("CallbackResource")} resource;`)
        _.print(`void (*call)(${args.join(', ')});`)
        _.popIndent()
        _.print(`} ${callbackTypeName};`)
    }

    private impls = new Map<string, SignatureDescriptor>()

    private getPropertiesFromInterfaces(decl: idl.IDLInterface) {
        const superType = idl.getSuperType(decl)
        const propertiesFromInterface: idl.IDLProperty[] = []
        if (superType) {
            const resolvedType = this.library.resolveTypeReference(superType) as (idl.IDLInterface | undefined)
            if (!resolvedType || !isMaterialized(resolvedType, this.library)) {
                propertiesFromInterface.push(...getUniquePropertiesFromSuperTypes(decl, this.library))
            }
        }
        return propertiesFromInterface
    }

    private writeModifier(clazz: IDLInterface, writer: CppLanguageWriter) {
        let name = this.modifierName(clazz)
        let handleType = this.handleType(clazz.name)
        let _h = this.hWriter
        let _c = writer
        _h.print(`struct ${handleType}Opaque;`)
        _h.print(`typedef struct ${handleType}Opaque* ${handleType};`)
        _h.print(`typedef struct ${name} {`)
        _c.print(`const ${name}* ${name}Impl() {`)
        _c.pushIndent()
        _c.print(`const static ${name} instance = {`)
        _c.pushIndent()
        _h.pushIndent()
        let isGlobalScope = hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)
        if (!isGlobalScope) {
            let ctors = [...clazz.constructors]
            if (ctors.length == 0) {
                ctors.push(createConstructor([], undefined)) // Add empty fake constructor
            }
            ctors.forEach((ctor, index) => {
                let name = `construct${(index > 0) ? index.toString() : ""}`
                let params = ctor.parameters.map(it => new NameType(_h.escapeKeyword(it.name), this.mapType(it.type!)))
                let argConvertors = ctor.parameters.map(param => generateArgConvertor(this.library, param))
                let cppArgs = generateCParameters(ctor, argConvertors, _h)
                _h.print(`${handleType} (*${name})(${cppArgs});`) // TODO check
                let implName = `${clazz.name}_${name}Impl`
                _c.print(`&${implName},`)
                this.impls.set(implName, { params, returnType: handleType, paramsCString: cppArgs})
            })
            {
                let destructName = `${clazz.name}_destructImpl`
                let params = [new NameType("thiz", handleType)]
                _h.print(`void (*destruct)(${params.map(it => `${it.type} ${it.name}`).join(", ")});`)
                _c.print(`&${destructName},`)
                this.impls.set(destructName, { params, returnType: 'void'})
            }
        }
        generatePostfixForOverloads(clazz.methods).forEach(({method, overloadPostfix}) => {
            const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
            let params = new Array<NameType>()
            if (!method.isStatic && !isGlobalScope) {
                params.push(new NameType("thiz", handleType))
            }
            params = params.concat(adjustedSignature.parameters.map(it => new NameType(_h.escapeKeyword(it.name), this.mapType(it.type!))))
            let returnType = this.mapType(adjustedSignature.returnType)
            const args = generateCParameters(method, adjustedSignature.convertors, _h)
            _h.print(`${returnType} (*${method.name}${overloadPostfix})(${args});`)
            let implName = `${clazz.name}_${method.name}${overloadPostfix}Impl`
            _c.print(`&${implName},`)
            this.impls.set(implName, { params, returnType, paramsCString: args })
        })

        const propertiesFromInterface: idl.IDLProperty[] = this.getPropertiesFromInterfaces(clazz)
        propertiesFromInterface.concat(clazz.properties).forEach(property => {
            let accessorMethods = []
            let getterMethod = idl.createMethod(`get${capitalize(property.name)}`, [], property.type)
            accessorMethods.push(getterMethod)
            if (!property.isReadonly) {
                let setterMethod = idl.createMethod(`set${capitalize(property.name)}`, [
                    idl.createParameter("value", property.type)
                ], idl.IDLVoidType)
                accessorMethods.push(setterMethod)
            }

            for (const method of accessorMethods) {
                const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
                let params = new Array<NameType>()
                if (!isGlobalScope) {
                    params.push(new NameType("thiz", handleType))
                }
                params = params.concat(adjustedSignature.parameters.map(it => new NameType(_h.escapeKeyword(it.name), this.mapType(it.type!))))
                let returnType = this.mapType(adjustedSignature.returnType)
                const args = generateCParameters(method, adjustedSignature.convertors, _h)
                _h.print(`${returnType} (*${method.name})(${args});`)
                let implName = `${clazz.name}_${method.name}Impl`
                _c.print(`&${implName},`)
                this.impls.set(implName, { params, returnType, paramsCString: args })
            }
        })
        _h.popIndent()
        _h.print(`} ${name};`)

        _c.popIndent()
        _c.print(`};`)
        _c.writeStatement(_c.makeReturn(_c.makeString("&instance")))
        _c.popIndent()
        _c.print(`}`)
    }

    private modifierName(clazz: IDLInterface): string {
        if (hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)) {
            return this.mangleTypeName("Modifier")
        }
        return this.mangleTypeName(`${clazz.name}Modifier`)
    }
    private handleType(name: string): string {
        return this.mangleTypeName(`${name}Handle`)
    }

    private writeImpls() {
        let _ = this.cppWriter
        let _stubs = this.implementationStubsFile.content
        this.impls.forEach((signature, name) => {
            const declaration = `${signature.returnType} ${name}(${signature.paramsCString ?? signature.params.map(it => `${it.type} ${it.name}`).join(", ")})`
            _.print(`${declaration};`)
            _stubs.print(`${declaration} {`)
            _stubs.pushIndent()
            if (signature.returnType != "void") {
                _stubs.print('return {};')
            }
            _stubs.popIndent()
            _stubs.print(`}`)
        })
    }

    private writeModifiers(writer: CppLanguageWriter) {
        this.callbacks.forEach(it => {
            this.writeCallback(it)
        })
        this.interfaces.forEach(it => {
            this.writeModifier(it, writer)
        })
        // Create API.
        let api = this.libraryName
        let _c = writer
        _c.print(`const ${generatorConfiguration().param("TypePrefix")}${api}_API* Get${api}APIImpl(int version) {`)
        _c.pushIndent()
        _c.print(`const static ${generatorConfiguration().param("TypePrefix")}${api}_API api = {`)
        _c.pushIndent()
        _c.print(`1, // version`)
        this.interfaces.forEach(it => {
            _c.print(`&${this.modifierName(it)}Impl,`)
        })
        _c.popIndent()
        _c.print(`};`)
        _c.print(`if (version != api.version) return nullptr;`)
        _c.print(`return &api;`)
        _c.popIndent()
        _c.print(`}`)
        let name = `${generatorConfiguration().param("TypePrefix")}${api}_API`
        let _h = this.hWriter
        _h.print(`typedef struct ${name} {`)
        _h.pushIndent()
        _h.print(`${generatorConfiguration().param("TypePrefix")}Int32 version;`)
        this.interfaces.forEach(it => {
            _h.print(`const ${this.modifierName(it)}* (*${this.apiName(it)})();`)
        })
        _h.popIndent()
        _h.print(`} ${name};`)
    }

    private apiName(clazz: IDLInterface): string {
        if (hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)) return capitalize(this.libraryName)
        return capitalize(clazz.name)
    }

    private printManaged() {
        this.printNative()
        this.printPeers()
        if (this.library.language == Language.CJ) {
            this.printCJNative()
            this.printInterfaces()
        }
    }

    private printInterfaces() {
        this.cjInterfaces = printInterfaces(this.library, {
            language: this.library.language,
            synthesizedTypes: undefined,
            imports: undefined
        })
    }

    private printNative() {
        NativeModule.Generated.name = `${this.libraryName}NativeModule`
        this.callbacks.forEach(callback => {
            if (this.library.language === Language.TS) {
                const params = callback.parameters.map(it => `${it.name}:${this.nativeWriter.getNodeName(it.type!)}`).join(', ')
                const returnTypeName = this.nativeWriter.getNodeName(callback.returnType)
                this.nativeWriter.print(`export type ${callback.name} = (${params}) => ${returnTypeName}`)
            }
        })
        this.callbackInterfaces.forEach(int => {
            this.nativeWriter.writeInterface(int.name, writer => {
                int.methods.forEach(method => {
                    const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
                    writer.writeMethodDeclaration(
                        method.name,
                        writer.makeNamedSignature(adjustedSignature.returnType, adjustedSignature.parameters)
                    )
                })
            })
        })
        printCallbacksKinds(this.library, this.nativeWriter)

        this.nativeFunctionsWriter.printer.pushIndent(this.nativeWriter.indentDepth() + 1)
        ;((writer: LanguageWriter) => {
            this.interfaces.forEach(it => {
                // TODO TBD do we need to provide declaration for "fake" constructor for interfaces?
                const ctors = it.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0)
                    ctors.push({parameters: [], returnType: undefined})
                ctors.forEach(ctor => {
                    const signature = makePeerCallSignature(this.library, ctor.parameters, IDLPointerType)
                    writer.writeNativeMethodDeclaration(`_${it.name}_ctor`, signature)
                })

                const getFinalizerSig = makePeerCallSignature(this.library, [], IDLPointerType)
                writer.writeNativeMethodDeclaration(`_${it.name}_getFinalizer`, getFinalizerSig)

                const methodsWithPostfix = generatePostfixForOverloads(it.methods)

                methodsWithPostfix.forEach(({ method, overloadPostfix }) => {
                    const signature = makePeerCallSignature(this.library, method.parameters, method.returnType, method.isStatic ? undefined : "self")
                    const name = `_${it.name}_${method.name}${overloadPostfix}`
                    writer.writeNativeMethodDeclaration(name, signature)  // TODO temporarily removed _${this.libraryName} prefix
                })

                this.getPropertiesFromInterfaces(it).concat(it.properties).forEach(property => {
                    const getterSignature = makePeerCallSignature(this.library, [], property.type, "self")
                    const getterName = `_${it.name}_get${capitalize(property.name)}`
                    writer.writeNativeMethodDeclaration(getterName, getterSignature)

                    const setterSignature = makePeerCallSignature(this.library, [idl.createParameter("value", property.type)], idl.IDLVoidType, "self")
                    const setterName = `_${it.name}_set${capitalize(property.name)}`
                    writer.writeNativeMethodDeclaration(setterName, setterSignature)
                })
            })
        })(this.nativeFunctionsWriter)

        this.arkUIFunctionsWriter.printer.pushIndent(this.nativeWriter.indentDepth() + 1);
        ((writer: LanguageWriter) => {
            if (writer.language === Language.TS) {
                writer.writeNativeMethodDeclaration("_MaterializeBuffer",
                    NamedMethodSignature.make(IDLBufferType, [
                        { name: "data", type: IDLPointerType },
                        { name: "length", type: IDLI32Type },
                        { name: "resourceId", type: IDLI32Type },
                        { name: "holdPtr", type: IDLPointerType },
                        { name: "releasePtr", type: IDLPointerType },
                    ])
                )
            }
        })(this.arkUIFunctionsWriter)
    }

    private printCJNative() {
        this.nativeFunctionsWriterCJ.printer.pushIndent(this.nativeWriter.indentDepth() + 1)
        ;((writer: LanguageWriter) => {
            this.interfaces.forEach(it => {
                // TODO TBD do we need to provide declaration for "fake" constructor for interfaces?
                const ctors = it.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0)
                    ctors.push({parameters: [], returnType: undefined})
                ctors.forEach(ctor => {
                    const signature = makePeerCallSignature(this.library, ctor.parameters, IDLPointerType)
                    writeCJMethod(writer, { name:`${it.name}_ctor`, method: signature })
                })

                const getFinalizerSig = makePeerCallSignature(this.library, [], IDLPointerType)
                writeCJMethod(writer, { name: `${it.name}_getFinalizer`, method: getFinalizerSig })

                const methodsWithPostfix = generatePostfixForOverloads(it.methods)

                methodsWithPostfix.forEach(({ method, overloadPostfix }) => {
                    const signature = makePeerCallSignature(this.library, method.parameters, method.returnType, method.isStatic ? undefined : "self")
                    const name = `_${it.name}_${method.name}${overloadPostfix}`
                    writeCJMethod(writer, { name: name, method: signature})  // TODO temporarily removed _${this.libraryName} prefix
                })

                this.getPropertiesFromInterfaces(it).concat(it.properties).forEach(property => {
                    const getterSignature = makePeerCallSignature(this.library, [], property.type, "self")
                    const getterName = `_${it.name}_get${capitalize(property.name)}`
                    writeCJMethod(writer, { name: getterName, method: getterSignature})

                    const setterSignature = makePeerCallSignature(this.library, [idl.createParameter("value", property.type)], idl.IDLVoidType, "self")
                    const setterName = `_${it.name}_set${capitalize(property.name)}`
                    writeCJMethod(writer, { name: setterName, method: setterSignature})
                })
            })
        })(this.nativeFunctionsWriterCJ)
    }

    private printStructsDeclarations(data: idl.IDLInterface[]) {
        data.forEach(clazz => {
            const namespaces = idl.getNamespacesPathFor(clazz);
            const peerWriter = this.getPeerWriter(clazz)
            if (peerWriter.language != Language.CJ) namespaces.forEach(ns => peerWriter.pushNamespace(ns.name, true));
            if (idl.isInterfaceSubkind(clazz)) {
                peerWriter.writeInterface(clazz.name, writer => {
                    clazz.properties.forEach(prop => {
                        writer.writeFieldDeclaration(prop.name, prop.type, [], prop.isOptional)
                    })
                })
            } else if (idl.isClassSubkind(clazz)) {
                peerWriter.writeClass(clazz.name, writer => {
                    clazz.properties.forEach(prop => {
                        writer.writeFieldDeclaration(prop.name, prop.type, [], prop.isOptional)
                    })
                })
            }
            if (peerWriter.language != Language.CJ) namespaces.forEach(() => peerWriter.popNamespace(true));
        })
    }

    private printInterfacesDeclarations(data: idl.IDLInterface[]) {
        data.forEach(int => {
            if (hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)) {
                return
            }
            const superTypes = int.inheritance.filter(it => it !== idl.IDLTopType).map(superClass => `${superClass.name}Interface`)
            const peerWriter = this.getPeerWriter(int)
            peerWriter.writeInterface(`${int.name}Interface`, writer => {
                int.properties.forEach(prop => {
                    writer.writeFieldDeclaration(prop.name, prop.type, [], idl.isOptionalType(prop.type))
                })
                int.methods.forEach(method => {
                    if (method.isStatic) {
                        return
                    }
                    const signature = writer.makeNamedSignature(method.returnType, method.parameters)
                    writer.writeMethodDeclaration(method.name, signature)
                })
            }, superTypes.length > 0 ? superTypes : undefined)
        })
    }

    private printInterfacesImplementations(data: Array<idl.IDLInterface>) {
        data.forEach(int => {
            const namespaces = idl.getNamespacesPathFor(int);
            const peerWriter = this.getPeerWriter(int)
            if (peerWriter.language != Language.CJ) namespaces.forEach(ns => peerWriter.pushNamespace(ns.name, true));
            const isGlobalScope = hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)

            const superType = idl.getSuperType(int)

            peerWriter.writeClass(`${int.name}`, writer => {
                let peerInitExpr: LanguageExpression | undefined = undefined
                if (this.library.language === Language.ARKTS && int.constructors.length === 0) {
                    peerInitExpr = writer.makeString("new Finalizable(nullptr, nullptr)")
                }
                // TODO Make peer private again
                writer.writeFieldDeclaration('peer', createReferenceType("Finalizable"), [/* FieldModifier.PRIVATE */], false, peerInitExpr)
                const peerPtr = writer.language == Language.CJ ? "this.peer.ptr" : "this.peer!.ptr"
                const fields = this.getPropertiesFromInterfaces(int).concat(int.properties.concat())
                fields.forEach(f => {
                    const typeName = idl.isNamedNode(f.type) ? f.type.name : "UnknownType"
                    // TBD: use deserializer to get complex type from native
                    writer.writeMethodImplementation(new Method(`get${capitalize(f.name)}`,
                        new MethodSignature(f.type, [])), writer => {
                            writer.writeStatement(
                                writer.makeReturn(
                                    writer.makeNativeCall(NativeModule.Generated, `_${int.name}_get${capitalize(f.name)}`, [writer.makeString(peerPtr)])
                                ))
                        });
                    writer.writeMethodImplementation(new Method(`set${capitalize(f.name)}`,
                        new NamedMethodSignature(idl.IDLVoidType, [f.type], [f.name])), writer => {
                            writer.writeExpressionStatement(
                                writer.makeNativeCall(NativeModule.Generated, `_${int.name}_set${capitalize(f.name)}`,
                                    [writer.makeString(peerPtr), writer.makeString(f.name)])
                            )
                        });

                })

                const ctors = int.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0)
                    // create empty constructor anyway
                    ctors.push({parameters: [], returnType: undefined})
                ctors.forEach(ctor => {
                    const signature = writer.makeNamedSignature(ctor.returnType ?? IDLVoidType, ctor.parameters)
                    // TODO remove duplicated code from writePeerMethod (PeersPrinter.ts)
                    const argConvertors = ctor.parameters.map(param => generateArgConvertor(this.library, param))
                    let scopes = argConvertors.filter(it => it.isScoped)
                    scopes.forEach(it => {
                        writer.pushIndent()
                    })

                    let serializerPushed = false
                    let params: LanguageExpression[] = []
                    argConvertors.forEach(it => {
                        if (it.useArray) {
                            if (!serializerPushed) {
                                params.push(writer.makeMethodCall(`thisSerializer`, 'asArray', []))
                                params.push(writer.makeMethodCall(`thisSerializer`, 'length', []))
                                serializerPushed = true
                            }
                        } else {
                            params.push(writer.makeString(it.convertorArg(it.param, writer)))
                        }
                    })

                    writer.writeConstructorImplementation(int.name, signature, writer => {
                        if (superType) {
                            writer.writeSuperCall([])
                        }
                        if (serializerPushed) {
                            writer.writeStatement(
                                writer.makeAssign(`thisSerializer`, createReferenceType('Serializer'),
                                    writer.makeMethodCall('Serializer', 'hold', []), true)
                            )
                        }
                        argConvertors.forEach((it) => {
                            if (it.useArray) {
                                it.convertorSerialize(`this`, it.param, writer)
                            }
                        })

                        const createPeerExpression = writer.makeNewObject("Finalizable", [
                            writer.makeNativeCall(NativeModule.Generated, `_${int.name}_ctor`, params),
                            writer.makeString(`${int.name}.getFinalizer()`)
                        ])
                        writer.writeStatement(
                            writer.makeAssign('this.peer', undefined, createPeerExpression, false)
                        )

                        if (serializerPushed) {
                            writer.writeStatement(new ExpressionStatement(
                                writer.makeMethodCall('thisSerializer', 'release', [])))
                            scopes.reverse().forEach(it => {
                                writer.popIndent()
                            })
                        }
                    })
                })

                // extra memebers from MaterializerPrinter.ts
                // TODO refactor MaterializedPrinter to generate OHOS peers

                // write getFinalizer() method
                const getFinalizerSig = new MethodSignature(IDLPointerType, [])
                writer.writeMethodImplementation(new Method("getFinalizer", getFinalizerSig, [MethodModifier.STATIC]), writer => {
                    const callExpression = writer.makeNativeCall(
                        NativeModule.Generated,
                        `_${int.name}_getFinalizer`, // TODO temporarily removed _${this.libraryName} prefix
                        []
                    );
                    writer.writeStatement(writer.makeReturn(callExpression))
                })

                // write getPeer() method
                const getPeerSig = new MethodSignature(createOptionalType(createReferenceType("Finalizable")),[])
                writer.writeMethodImplementation(new Method("getPeer", getPeerSig), writer => {
                    // TODO add better (platform-agnostic) way to return Finalizable
                    writer.writeStatement(writer.makeReturn(writer.makeString("this.peer")))
                })

                // write construct(ptr: number) method
                if (ctors.length === 0) {
                    const typeArguments = int.typeParameters
                    const clazzRefType = createReferenceType(int.name, typeArguments?.map(createTypeParameterReference), int)
                    const constructSig = new NamedMethodSignature(clazzRefType, [IDLPointerType], ["ptr"])
                    writer.writeMethodImplementation(new Method("construct", constructSig, [MethodModifier.STATIC], typeArguments), writer => {
                        const objVar = `obj${int.name}`
                        writer.writeStatement(writer.makeAssign(objVar, clazzRefType, writer.makeNewObject(int.name), true))
                        writer.writeStatement(
                            writer.makeAssign(`${objVar}.peer`, createReferenceType("Finalizable"),
                                writer.makeNewObject('Finalizable', [writer.makeString(`${int.name}.getFinalizer()`)]), false)
                        )
                        writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
                    })
                }

                const materializedMethods = int.methods.map(it => new MaterializedMethod(
                    int.name,
                    int.name,
                    it.parameters.map(p => this.library.typeConvertor(writer.escapeKeyword(p.name), p.type, p.isOptional)),
                    it.returnType,
                    true,
                    new Method(
                        it.name,
                        NamedMethodSignature.make(
                            it.returnType,
                            it.parameters.map(p => ({ name: writer.escapeKeyword(p.name), type: p.type }))
                        ),
                        it.isStatic ? [MethodModifier.STATIC] : []
                    ),
                    createOutArgConvertor(this.library, it.returnType, it.parameters.map(p => p.name))
                ))

                PeerMethod.markAndGroupOverloads(materializedMethods)

                const groupedMethods = groupOverloads(materializedMethods)
                groupedMethods.forEach(methods => PeerMethod.markAndGroupOverloads(methods))

                const overloadsPrinter = new OverloadsPrinter(this.library, writer, this.library.language, false)
                const clazz = new MaterializedClass(
                    int,
                    int.name,
                    true,
                    undefined,
                    undefined,
                    [],
                    [],
                    new MaterializedMethod(int.name, int.name, [], IDLVoidType, false, new Method('', NamedMethodSignature.make(IDLVoidType, []))),
                    new MaterializedMethod(int.name, int.name, [], IDLVoidType, false, new Method('', NamedMethodSignature.make(IDLVoidType, []))),
                    [],
                    true,
                    []
                )

                for (const group of groupedMethods) {
                    overloadsPrinter.printGroupedComponentOverloads(clazz, group)
                }

                materializedMethods.forEach(method => {
                    writePeerMethod(
                        writer,
                        method.getPrivateMethod(),
                        true,
                        { language: this.library.language, imports: undefined, synthesizedTypes: undefined  },
                        false,
                        '_serialize',
                        writer.language == Language.CJ ? "this.peer.ptr" : "this.peer!.ptr",
                        method.returnType
                    )
                    })

            }, superType?.name, isGlobalScope ? this.library.language != Language.CJ ? [`${int.name}Interface`] : undefined : undefined)

            // TODO Migrate to MaterializedPrinter
            if (int.constructors.length === 0) {
                // Write MaterializedClass static
                if (!hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)) {
                    peerWriter.writeClass(`${int.name}Internal`, writer => {
                        // write fromPtr(ptr: number):MaterializedClass method
                        const clazzRefType = createReferenceType(int.name, int.typeParameters?.map(createTypeParameterReference), int)
                        const fromPtrSig = new NamedMethodSignature(clazzRefType, [IDLPointerType], ["ptr"])
                        writer.writeMethodImplementation(new Method("fromPtr", fromPtrSig, [MethodModifier.PUBLIC, MethodModifier.STATIC], int.typeParameters), writer => {
                            const objVar = `obj`
                            writer.writeStatement(writer.makeAssign(objVar,
                                clazzRefType,
                                //TODO: Need to pass IDLType instead of string to makeNewObject
                                writer.makeNewObject(writer.getNodeName(clazzRefType)),
                                true)
                            )
                            writer.writeStatement(
                                writer.makeAssign(`${objVar}.peer`, createReferenceType("Finalizable"),
                                    writer.makeNewObject('Finalizable', [writer.makeString('ptr'), writer.makeString(`${int.name}.getFinalizer()`)]), false),
                            )
                            writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
                        })
                    })
                }
            }
            if (peerWriter.language != Language.CJ) namespaces.forEach(() => peerWriter.popNamespace(true));
        })
    }

    private printPeers() {
        const nativeModuleVar = `${this.libraryName}NativeModule`
        for (const [fileName, peerWriter] of this.getPeerWriters()) {
            if (this.library.language != Language.CJ) peerWriter.print('import { TypeChecker } from "./type_check"')
            if (this.library.language === Language.TS) {
                peerWriter.print('import {')
                peerWriter.pushIndent()
                peerWriter.print(`${nativeModuleVar},`)
                peerWriter.popIndent()
                peerWriter.print(`} from './${this.libraryName.toLocaleLowerCase()}Native'`)
            } else if (this.library.language === Language.ARKTS) {
                peerWriter.print('import {')
                peerWriter.pushIndent()
                peerWriter.print(`${nativeModuleVar},`)
                peerWriter.popIndent()
                peerWriter.print(`} from './${this.libraryName.toLocaleLowerCase()}Native'`)
            }
        }

        if (this.library.language != Language.CJ) {
            this.printStructsDeclarations(this.data)
            this.printInterfacesDeclarations([...this.interfaces, ...this.data])
        }

        this.enums.forEach(e => {
            const writer = this.getPeerWriter(e)
            writer.writeStatement(writer.makeEnumEntity(e, true))
        })

        this.printInterfacesImplementations(this.interfaces)

        this.library.globalScopeInterfaces.forEach(entry => {
            const groupedMethods = groupOverloadsIDL(entry.methods)
            const peerWriter = this.getPeerWriter(entry)
            groupedMethods.forEach(methods => {
                const method = collapseSameMethodsIDL(methods)
                const signature = NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: it.type })))
                peerWriter.writeFunctionImplementation(method.name, signature, w => {
                    const call = w.makeMethodCall(entry.name, method.name, method.parameters.map(it => w.makeString(it.name)))
                    let statement: LanguageStatement
                    if (method.returnType !== IDLVoidType) {
                        statement = w.makeReturn(call)
                    } else {
                        statement = w.makeStatement(call)
                    }
                    w.writeStatement(
                        statement
                    )
                })
            })
        })
    }

    printC() {
        let callbackKindsPrinter = this.library.createLanguageWriter(Language.CPP);
        printCallbacksKinds(this.library, callbackKindsPrinter)

        this.cppWriter.writeLines(
            readLangTemplate('api_impl_prologue.cc', Language.CPP)
                .replaceAll("%INTEROP_MODULE_NAME%", `${this.libraryName.toUpperCase()}NativeModule`)
                .replaceAll("%API_HEADER_PATH%", `${this.libraryName.toLowerCase()}.h`)
                .replaceAll("%CALLBACK_KINDS%", callbackKindsPrinter.getOutput().join("\n"))
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )
        const interopRootPath = getInteropRootPath()
        const interopTypesPath = path.resolve(interopRootPath, 'src', 'cpp', 'interop-types.h')
        const interopTypesContent = fs.readFileSync(interopTypesPath, 'utf-8')
        this.hWriter.writeLines(
            readLangTemplate('ohos_api_prologue.h', Language.CPP)
                .replaceAll("%INTEROP_TYPES_HEADER", interopTypesContent)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )

        let toStringsPrinter = this.library.createLanguageWriter(Language.CPP)
        new StructPrinter(this.library).generateStructs(this.hWriter, this.hWriter.printer, toStringsPrinter)
        this.cppWriter.concat(toStringsPrinter)
        const prefix = generatorTypePrefix()
        writeSerializer(this.library, this.cppWriter, prefix)
        writeDeserializer(this.library, this.cppWriter, prefix)

        let writer = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)
        this.writeModifiers(writer)
        this.writeImpls()
        this.cppWriter.concat(writer)
        this.cppWriter.concat(printBridgeCcForOHOS(this.library).generated)
        this.cppWriter.concat(makeDeserializeAndCall(this.library, Language.CPP, 'serializer.cc').content)
        this.cppWriter.concat(printManagedCaller('', this.library).content)

        this.hWriter.writeLines(
            readLangTemplate('ohos_api_epilogue.h', Language.CPP)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )
        this.cppWriter.writeLines(
            readLangTemplate('api_impl_epilogue.cc', Language.CPP)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )
    }

    prepare() {
        this.library.files.forEach(file => {
            if (file.isPredefined) return
            idl.linearizeNamespaceMembers(file.entries).forEach(entry => {
                if (isInterface(entry)) {
                    if (isMaterialized(entry, this.library)) {
                        this.interfaces.push(entry)
                    } else {
                        this.data.push(entry)
                    }
                } else if (isEnum(entry)) {
                    this.enums.push(entry)
                } else if(idl.isImport(entry)) {
                    this.dependecyCollector.parseImport(entry)
                }
                entry.scope?.forEach(it => {
                    if (isCallback(it))
                        this.callbacks.push(it)
                })
            })
        })

        const callbackInterfaceNames = new Set<string>()
        this.callbacks.forEach(it => {
            it.parameters.forEach(param => {
                if (this.interfaces.find(x => x.name === forceAsNamedNode(param.type!).name)) {
                    callbackInterfaceNames.add(forceAsNamedNode(param.type!).name)
                }
            })
        })

        const interfaces: IDLInterface[] = []
        this.interfaces.forEach(int => {
            if (callbackInterfaceNames.has(int.name)) {
                this.callbackInterfaces.push(int)
            } else {
                interfaces.push(int)
            }
        })

        this.interfaces = interfaces
    }

    execute(rootPath: string, apiVersion: number, outDir: string, managedOutDir: string) {
        const origGenConfig = generatorConfiguration()
        setDefaultConfiguration(new DefaultConfig(
            apiVersion, {
            TypePrefix: "OH_",
            LibraryPrefix: `${this.libraryName}_`,
            OptionalPrefix: "Opt_",
        }))

        this.prepare()

        this.printManaged()
        this.printC()

        const fileNamePrefix = this.libraryName.toLowerCase()
        const ext = this.library.language.extension

        const managedCodeModuleInfo = {
            name: `${this.libraryName}NativeModule`,
            path: `./${fileNamePrefix}Native`,
            serializerPath: `./${fileNamePrefix}Serializer`,
            finalizablePath: `@koalaui/interop`,
            materializedBasePath: "./xmlFinalizable"
        }

        const nativeModuleTemplate = readLangTemplate(`OHOSNativeModule_template${ext}`, this.library.language)
        const nativeModuleText = nativeModuleTemplate
            .replaceAll('%NATIVE_MODULE_NAME%', this.libraryName)
            .replaceAll('%NATIVE_MODULE_CONTENT%', this.nativeWriter.getOutput().join('\n'))
            .replaceAll('%NATIVE_FUNCTIONS%', this.nativeFunctionsWriter.getOutput().join('\n'))
            .replaceAll('%CJ_NATIVE_FUNCTIONS%', this.nativeFunctionsWriterCJ ? this.nativeFunctionsWriterCJ.getOutput().join('\n') : "")
            .replaceAll('%ARKUI_FUNCTIONS%', this.arkUIFunctionsWriter.getOutput().join('\n'))
        fs.writeFileSync(path.join(rootPath, managedOutDir, `${managedCodeModuleInfo.path}${ext}`), nativeModuleText, 'utf-8')

        fs.writeFileSync(path.join(rootPath, managedOutDir, `${fileNamePrefix}Finalizable${ext}`),
            readLangTemplate(`OHOSFinalizable_template${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
        )

        this.dependecyCollector.dump()

        for (const [file, peerWriter] of this.getPeerWriters()) {
            const peerTemplate = readLangTemplate(`OHOSPeer_template${ext}`, this.library.language)

            const imports = this.dependecyCollector.getImportLines(file)
            // console.log(`File: ${file}, imports: ${imports}`)

            const peerText = peerTemplate
                .replaceAll('%PEER_IMPORTS%', imports.join('\n'))
                .replaceAll('%PEER_CONTENT%', peerWriter.getOutput().join('\n'))
                .replaceAll('%SERIALIZER_PATH%', managedCodeModuleInfo.serializerPath)
                .replaceAll('%FINALIZABLE_PATH%', managedCodeModuleInfo.finalizablePath)
            fs.writeFileSync(path.join(rootPath, managedOutDir, `${file}${ext}`), peerText, 'utf-8')
        }
        for (const [file, data] of this.cjInterfaces) {
            fs.writeFileSync(path.join(rootPath, managedOutDir, file.name), data, 'utf-8')
        }

        this.hWriter.printTo(path.join(rootPath, outDir, `${fileNamePrefix}.h`))
        this.cppWriter.printTo(path.join(rootPath, outDir, `${fileNamePrefix}.cc`))

        fs.writeFileSync(path.join(rootPath, outDir, this.implementationStubsFile.name),
            this.implementationStubsFile.printToString()
        )

        const serializerText = makeSerializerForOhos(this.library, managedCodeModuleInfo, fileNamePrefix).printToString()
        // fs.writeFileSync(path.join(rootPath, managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')
        fs.writeFileSync(path.join(rootPath, managedOutDir, `${fileNamePrefix}Serializer${ext}`), serializerText, 'utf-8')
        fs.writeFileSync(path.join(rootPath, managedOutDir, `CallbacksChecker${ext}`),
            readLangTemplate(`CallbacksChecker${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
                .replaceAll("%DESERIALIZER_PATH%", managedCodeModuleInfo.serializerPath)
                .replaceAll("%CALLBACKS_PATH%", managedCodeModuleInfo.serializerPath)
        )

        generateTypeCheckFile(path.join(rootPath, managedOutDir), this.library.language)
        // Restore initial config
        setDefaultConfiguration(origGenConfig)
    }

    private mangleTypeName(typeName: string): string {
        return `${generatorTypePrefix()}${typeName}`
    }

    abstract getPeerWriter(decl: idl.IDLNode): LanguageWriter
    abstract getPeerWriters(): Map<string, LanguageWriter>
}

class OneFileOHOSVisitor extends OHOSVisitor {

    peerWriter: LanguageWriter
    peerWriters: Map<string, LanguageWriter> = new Map()
    constructor(protected library: PeerLibrary, libraryName: string) {
        super(library, libraryName, new OneFileDependecyCollector())
        console.log(`Use OneFileOHOSVisitor`)
        this.peerWriter = library.createLanguageWriter()
        this.peerWriters.set(this.libraryName.toLowerCase(), this.peerWriter)
    }

    getPeerWriter(decl: idl.IDLNode): LanguageWriter {
        return this.peerWriter
    }

    getPeerWriters(): Map<string, LanguageWriter> {
        return this.peerWriters
    }
}

class ManyFilesOHOSVisitor extends OHOSVisitor {

    peerWriters: Map<string, LanguageWriter> = new Map<string, LanguageWriter>()

    constructor(protected library: PeerLibrary, libraryName: string) {
        super(library, libraryName, new ManyFilesDependecyCollector(library))
        console.log(`Use ManyFilesOHOSVisitor`)
    }

    getPeerWriter(decl: idl.IDLNode): LanguageWriter {
        const fileName = getFileNameFromDeclaration(decl)
        this.dependecyCollector.collect(decl, fileName)
        let writer = this.peerWriters.get(fileName)
        if (!writer) {
            writer = this.library.createLanguageWriter()
            this.peerWriters.set(fileName, writer)
        }
        return writer
    }

    getPeerWriters(): Map<string, LanguageWriter> {
        return this.peerWriters
    }
}

function generateTypeCheckFile(dir: string, lang: Language): void {
    let code: string = ""
    if (lang == Language.TS) {
        code = `
        export class TypeChecker {
            static typeInstanceOf<T>(value: Object, prop: string): boolean {
                return value.hasOwnProperty(prop)
            }
            static typeCast<T>(value: Object): T {
                return value as unknown as T
            }
        }
    `
    }
    if (lang == Language.ARKTS) {
        code = `
        export class TypeChecker {
            static typeInstanceOf<T>(value: Object, prop: string): boolean {
                return value instanceof T
            }
            static typeCast<T>(value: Object): T {
                return value as T
            }
        }
    `
    }
    fs.writeFileSync(path.join(dir, `type_check.ts`), code)
}

function getOhosGenerator(peerLibrary: PeerLibrary, libraryName: string, splitFiles?: boolean) {
    console.log(`Use split file option: ${splitFiles}`)
    return splitFiles ? new ManyFilesOHOSVisitor(peerLibrary, libraryName) : new OneFileOHOSVisitor(peerLibrary, libraryName)
}

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, apiVersion: number, defaultIdlPackage?: string, splitFiles?: boolean): void {
    const rootPath = outDir
    const generatedSubDir = 'generated'
    const managedOutDir = path.join(generatedSubDir, peerLibrary.language.name.toLocaleLowerCase())
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true })
    }
    const manageOutPath = path.join(rootPath, managedOutDir)
    if (!fs.existsSync(manageOutPath)) {
        fs.mkdirSync(manageOutPath, { recursive: true })
    }
    const libraryName = defaultIdlPackage ?? suggestLibraryName(peerLibrary)
    const visitor = getOhosGenerator(peerLibrary, libraryName, splitFiles)
    visitor.execute(rootPath, apiVersion, generatedSubDir, managedOutDir)
}

export function generateNativeOhos(peerLibrary: PeerLibrary): Map<TargetFile, string> {
    const libraryName = suggestLibraryName(peerLibrary)
    const visitor = new OneFileOHOSVisitor(peerLibrary, libraryName)
    visitor.prepare()
    visitor.printC()
    return new Map([
        [new TargetFile(`${peerLibrary.name.toLowerCase()}.h`), visitor.hWriter.getOutput().join('\n')],
        [new TargetFile(`${peerLibrary.name.toLowerCase()}.cc`), visitor.cppWriter.getOutput().join('\n')],
        [new TargetFile(`${peerLibrary.name.toLowerCase()}Impl_temp.cc`), visitor.implementationStubsFile.printToString()]
    ])
}


type AdjustedSignature = {
    convertors: ArgConvertor[]
    parameters: IDLParameter[]
    returnType: IDLType,
};
function adjustSignature(library: PeerLibrary, parameters: IDLParameter[], returnType: IDLType): AdjustedSignature {
    const convertors = parameters.map(parameter => generateArgConvertor(library, parameter))
    const outConvertor = createOutArgConvertor(library, returnType, parameters.map(parameter => parameter.name))
    if(outConvertor) {
        convertors.push(outConvertor)
        parameters = parameters.slice()
        parameters.push(createParameter(outConvertor.param, outConvertor.idlType))
        returnType = IDLVoidType
    }
    return {
        convertors,
        parameters,
        returnType: idl.isPrimitiveType(returnType) ? returnType : idl.IDLPointerType,
    }
}

function generateArgConvertor(library: PeerLibrary, param: IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

// TODO drop this method
function generateCParameters(method: IDLMethod | IDLConstructor, argConvertors: ArgConvertor[], writer: LanguageWriter): string {
    let args = isConstructor(method) || method.isStatic ? [] : [`${ArkPrimitiveTypesInstance.NativePointer} thisPtr`]
    for (let i = 0; i < argConvertors.length; ++i) {
        const typeName = writer.getNodeName(argConvertors[i].nativeType())
        const argName = writer.escapeKeyword(argConvertors[i].param)
        args.push(`const ${typeName}* ${argName}`)
    }
    return args.join(", ")
}

function makePeerCallSignature(library: PeerLibrary, parameters: IDLParameter[], returnType: IDLType, thisArg?: string) {
    // TODO remove duplicated code from NativeModuleVisitor::printPeerMethod (NativeModulePrinter.ts)
    const adjustedSignature = adjustSignature(library, parameters, returnType)
    const args: ({name: string, type: IDLType})[] = thisArg ? [{ name: thisArg, type: IDLPointerType }] : []
    let serializerArgCreated = false
    for (let i = 0; i < adjustedSignature.convertors.length; ++i) {
        let it = adjustedSignature.convertors[i]
        if (it.useArray) {
            if (!serializerArgCreated) {
                args.push(
                    { name: 'thisArray', type: createContainerType(/* 'buffer' */ 'sequence', [IDLU8Type]) },
                    { name: 'thisLength', type: IDLI32Type },
                )
                serializerArgCreated = true
            }
        } else {
            args.push({ name: `${it.param}`, type: adjustedSignature.parameters[i].type! })
        }
    }
    return NamedMethodSignature.make(adjustedSignature.returnType, args)
}

export function suggestLibraryName(library: PeerLibrary) {
    let libraryName = library.files.filter(f => !f.isPredefined)[0].packageName()
    libraryName = libraryName.replaceAll("@", "").replaceAll(".", "_").toUpperCase()
    return libraryName
}
interface MethodWithPostfix {
    method: IDLMethod,
    overloadPostfix: string
}

function generatePostfixForOverloads(methods:IDLMethod[]): MethodWithPostfix[]  {
    const overloads = new Map<string, number>()
    for (const method of methods) {
        overloads.set(method.name, (overloads.get(method.name) ?? 0) + 1)
    }

    const overloadCounter = new Map<string, number>()
    for (const [overloadName, count] of overloads) {
        if (count > 1) {
            overloadCounter.set(overloadName, 0)
        }
    }

    return methods.map(method => {
        let overloadPostfix = ''
        if (overloadCounter.has(method.name)) {
            const postfix = overloadCounter.get(method.name)!
            overloadPostfix = postfix.toString()
            overloadCounter.set(method.name, postfix + 1)
        }
        return {
            method,
            overloadPostfix
        }
    })
}

function getFileNameFromDeclaration(decl: idl.IDLNode): string {
    let filePath = decl.fileName
    if (!filePath) {
        const declName = idl.isNamedNode(decl) ? decl.name : `$kind ${decl.kind}`
        console.log(`File name is unknown for declaration: ${decl}, use unknown.d.ts`)
        filePath = `unknown.d.ts`
    }
    const fileName = path.basename(filePath)
    if (fileName.endsWith("d.ts")) {
        return fileName.substring(0, fileName.length - ".d.ts".length)
    }
    console.log(`Non d.ts file: "${fileName}"`)
    return "non_dts_file"
}

