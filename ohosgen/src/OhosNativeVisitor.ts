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
import {
    asPromise,
    createConstructor,
    createMethod,
    createParameter,
    forceAsNamedNode,
    getFQName,
    getSuperType,
    hasExtAttribute,
    IDLCallback,
    IDLConstructor,
    IDLEnum,
    IDLExtendedAttributes,
    IDLInterface,
    IDLMethod,
    IDLNumberType,
    IDLParameter,
    IDLPrimitiveType,
    IDLProperty,
    IDLType,
    IDLVoidType,
    isConstructor,
    isContainerType,
    isEnum,
    isInterface,
    isOptionalType,
    isReferenceType,
    isUnionType,
    linearizeNamespaceMembers
} from '@idlizer/core/idl'
import {
    ArgConvertor,
    capitalize,
    generateCallbackAPIArguments,
    generatorConfiguration,
    generatorTypePrefix,
    IndentedPrinter,
    Language,
    LanguageWriter,
    qualifiedName,
    isMaterialized,
    PeerLibrary,
    CppLanguageWriter,
    MethodSignature,
    PrimitiveTypesInstance,
    CppConvertor,
    CppReturnTypeConvertor,
    isStructureType,
    PeerMethod,
    dropSuffix,
    MaterializedClass,
    isInIdlize,
    isStaticMaterialized,
    isInCurrentModule,
    currentModule,
    sorted,
} from '@idlizer/core'
import {
    createOutArgConvertor,
    getInteropRootPath,
    readLangTemplate,
    getUniquePropertiesFromSuperTypes,
    printCallbacksKinds,
    printManagedCaller,
    // writeDeserializer,
    // writeSerializer,
    CppSourceFile,
    StructPrinter,
    TargetFile,
    BridgeCcApi,
    BridgeCcVisitor,
    createSyntheticGlobalScope,
    isGlobalScope,
    createSerializerPrinter,
    createDeserializerPrinter,
    createDeserializeAndCallPrinter,
    readTemplate,
    peerGeneratorConfiguration,
    libraryCcDeclaration,
} from '@idlizer/libohos'
import { OhosInstall } from './OhosInstall'

class NameType {
    constructor(public name: string, public type: string) { }
}

interface SignatureDescriptor {
    params: NameType[]
    returnType: string
    paramsCString?: string
}

class OHOSNativeVisitor {
    implementationStubsFile: CppSourceFile
    implementationApiFile: CppSourceFile

    private readonly argTypeConvertor = new CppConvertor(this.library)
    private readonly returnTypeConvertor = new ReturnTypeConvertor(this.library)

    hWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, this.argTypeConvertor, PrimitiveTypesInstance)
    cppWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, this.argTypeConvertor, PrimitiveTypesInstance)
    libraryName: string = ""

    interfaces = new Array<IDLInterface>()
    data = new Array<IDLInterface>()
    enums = new Array<IDLEnum>()
    callbacks = new Array<IDLCallback>()
    callbackInterfaces = new Array<IDLInterface>()
    cjInterfaces = new Map<TargetFile, string>()

    constructor(protected library: PeerLibrary, libraryName: string) {
        if (this.library.files.length == 0)
            throw new Error("No files in library")

        this.libraryName = libraryName
        this.library.name = libraryName

        const fileNamePrefix = this.libraryName.toLowerCase()
        this.implementationStubsFile = new CppSourceFile(`${fileNamePrefix}Impl_template${Language.CPP.extension}`, library)
        this.implementationStubsFile.addInclude("common-interop.h")
        this.implementationStubsFile.addInclude(`${fileNamePrefix}.h`)
        this.implementationApiFile = new CppSourceFile(`${fileNamePrefix}Impl_template${Language.CPP.extension}`, library)
        this.implementationApiFile.addInclude("common-interop.h")
        this.implementationApiFile.addInclude(`${fileNamePrefix}.h`)
    }

    private apiName(clazz: IDLInterface): string {
        return capitalize(qualifiedName(clazz, "_", "namespace.name"))
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

    private impls = new Array<{ name: string, signature: SignatureDescriptor }>()

    private getPropertiesFromInterfaces(decl: IDLInterface) {
        const superType = getSuperType(decl)
        const propertiesFromInterface: IDLProperty[] = []
        if (superType) {
            const resolvedType = this.library.resolveTypeReference(superType) as (IDLInterface | undefined)
            if (!resolvedType || !isMaterialized(resolvedType, this.library)) {
                propertiesFromInterface.push(...getUniquePropertiesFromSuperTypes(decl, this.library))
            }
        }
        return propertiesFromInterface
    }

    private writeModifier(clazz: IDLInterface, writer: CppLanguageWriter) {
        if (isResource(clazz.name)) return
        let name = this.modifierName(clazz)
        let handleType = this.handleType(clazz)
        let className = qualifiedName(clazz, "_", "namespace.name")
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
        if (!isGlobalScope(clazz) && !isStaticMaterialized(clazz, this.library)) {
            let ctors = [...clazz.constructors]
            if (ctors.length == 0) {
                ctors.push(createConstructor([], undefined)) // Add empty fake constructor
            }
            ctors.forEach((ctor, index) => {
                let name = `construct${(index > 0) ? index.toString() : ""}`
                let params = ctor.parameters.map(it =>
                    new NameType(_h.escapeKeyword(it.name), this.argTypeConvertor.convert(it.type!)))
                let argConvertors = ctor.parameters.map(param => generateArgConvertor(this.library, param))
                let cppArgs = this.generateCParameters(ctor, argConvertors, _h)
                _h.print(`${handleType} (*${name})(${cppArgs});`) // TODO check
                let implName = `${className}_${name}Impl`
                _c.print(`&${implName},`)
                this.impls.push({ name: implName, signature: { params, returnType: handleType, paramsCString: cppArgs } })
            })
            {
                let destructName = `${className}_destructImpl`
                let params = [new NameType("thisPtr", handleType)]
                _h.print(`void (*destruct)(${params.map(it => `${it.type} ${it.name}`).join(", ")});`)
                _c.print(`&${destructName},`)
                this.impls.push({ name: destructName, signature: { params, returnType: 'void' } })
            }
        }
        generatePostfixForOverloads(clazz.methods).forEach(({ method, overloadPostfix }) => {
            const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
            let params = new Array<NameType>()
            if (!method.isStatic && !method.isFree) {
                params.push(new NameType("thisPtr", handleType))
            }
            params = params.concat(adjustedSignature.parameters.map(it =>
                new NameType(_h.escapeKeyword(it.name), this.argTypeConvertor.convert(it.type!))))
            let returnType = this.returnTypeConvertor.convert(adjustedSignature.returnType)
            const args = this.generateCParameters(method, adjustedSignature.convertors, _h)
            _h.print(`${returnType} (*${method.name}${overloadPostfix})(${args});`)
            let implName = `${className}_${method.name}${overloadPostfix}Impl`
            _c.print(`&${implName},`)
            this.impls.push({ name: implName, signature: { params, returnType, paramsCString: args } })
        })

        const propertiesFromInterface: IDLProperty[] = this.getPropertiesFromInterfaces(clazz)
        propertiesFromInterface.concat(clazz.properties).forEach(property => {
            let accessorMethods = []
            let getterMethod = createMethod(
                `get${capitalize(property.name)}`, [], property.type, {
                isStatic: property.isStatic,
                isAsync: false, isOptional: false, isFree: false})
            accessorMethods.push(getterMethod)
            if (!property.isReadonly) {
                let setterMethod = createMethod(
                    `set${capitalize(property.name)}`,
                    [createParameter("value", property.type)],
                    IDLVoidType, {
                    isStatic: property.isStatic,
                    isAsync: false, isOptional: false, isFree: false})
                accessorMethods.push(setterMethod)
            }

            for (const method of accessorMethods) {
                const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
                let params = new Array<NameType>()
                if (!isGlobalScope(clazz)) {
                    params.push(new NameType("thisPtr", handleType))
                }
                params = params.concat(adjustedSignature.parameters.map(it =>
                    new NameType(_h.escapeKeyword(it.name), this.argTypeConvertor.convert(it.type!))))
                let returnType = this.returnTypeConvertor.convert(adjustedSignature.returnType)
                const args = this.generateCParameters(method, adjustedSignature.convertors, _h)
                _h.print(`${returnType} (*${method.name})(${args});`)
                let implName = `${className}_${method.name}Impl`
                _c.print(`&${implName},`)
                this.impls.push({ name: implName, signature: { params, returnType, paramsCString: args } })
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

    // TODO drop this method
    private generateCParameters(method: IDLMethod | IDLConstructor, argConvertors: ArgConvertor[], writer: LanguageWriter): string {
        const args = argConvertors.map(it => {
            const typeName = writer.getNodeName(it.nativeType())
            const argName = writer.escapeKeyword(it.param)
            return it.isPointerType()
                ? `const ${typeName}* ${argName}`
                : `${typeName} ${argName}`
        })
        if (!isConstructor(method) && !method.isStatic)
            args.unshift(`${PrimitiveTypesInstance.NativePointer} thisPtr`)
        if (!!asPromise(method.returnType))
            args.unshift(`${generatorConfiguration().TypePrefix}${this.libraryName}_AsyncWorkerPtr asyncWorker`)
        if (hasExtAttribute(method, IDLExtendedAttributes.Throws) || !!asPromise(method.returnType))
            args.unshift(`${generatorConfiguration().TypePrefix}${this.libraryName}_VMContext vmContext`)
        return args.join(", ")
    }

    private modifierName(clazz: IDLInterface): string {
        return this.mangleTypeName(`${qualifiedName(clazz, "_", "namespace.name")}Modifier`)
    }
    private handleType(clazz: IDLInterface): string {
        return this.mangleTypeName(`${qualifiedName(clazz, "_", "namespace.name")}Handle`)
    }

    private writeImpls() {
        let _ = this.implementationApiFile.content
        let _stubs = this.implementationStubsFile.content
        const impls = sorted(this.impls, "name")
        impls.forEach(({name, signature}) => {
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

    private writeApiGetter(writer: CppLanguageWriter): void {
        writer.writeLines(readTemplate("api_getter.cc")
            .replaceAll("%API_KIND%", `OH_${this.libraryName}_APIKind::OH_${this.libraryName}_API_KIND`)
            .replaceAll("%API_NAME%", `${generatorConfiguration().TypePrefix}${this.libraryName}_API`))
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
        _c.print(`extern "C" const ${generatorConfiguration().TypePrefix}${api}_API* Get${api}APIImpl(int version) {`)
        _c.pushIndent()
        _c.print(`const static ${generatorConfiguration().TypePrefix}${api}_API api = {`)
        _c.pushIndent()
        _c.print(`1, // version`)
        this.interfaces.forEach(it => {
            if (!isResource(it.name))
                _c.print(`&${this.modifierName(it)}Impl,`)
        })
        _c.popIndent()
        _c.print(`};`)
        _c.print(`if (version != api.version) return nullptr;`)
        _c.print(`return &api;`)
        _c.popIndent()
        _c.print(`}`)
        let name = `${generatorConfiguration().TypePrefix}${api}_API`
        let _h = this.hWriter
        _h.print(`typedef struct ${name} {`)
        _h.pushIndent()
        _h.print(`${generatorConfiguration().TypePrefix}Int32 version;`)
        this.interfaces.forEach(it => {
            if (!isResource(it.name))
                _h.print(`const ${this.modifierName(it)}* (*${this.apiName(it)})();`)
        })
        _h.popIndent()
        _h.print(`} ${name};`)
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
        this.cppWriter.writeLines(libraryCcDeclaration({removeCopyright: true}))
        const interopRootPath = getInteropRootPath()
        const interopTypesPath = path.resolve(interopRootPath, 'src', 'cpp', 'interop-types.h')
        const interopTypesContent = fs.readFileSync(interopTypesPath, 'utf-8')
        this.hWriter.writeLines(
            readLangTemplate('ohos_api_prologue.h', Language.CPP)
                .replaceAll("%INTEROP_TYPES_HEADER", interopTypesContent)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
                .replaceAll("%API_KIND%", peerGeneratorConfiguration().ApiKind.toString())
        )

        let toStringsPrinter = this.library.createLanguageWriter(Language.CPP)
        new StructPrinter(this.library).generateStructs(this.hWriter, this.hWriter.printer, toStringsPrinter)
        this.cppWriter.concat(toStringsPrinter)
        const prefix = generatorTypePrefix()
        createSerializerPrinter(Language.CPP, prefix)(this.library).forEach(result => {
            this.cppWriter.concat(result.content)
        })
        createDeserializerPrinter(Language.CPP, prefix)(this.library).forEach(result => {
            this.cppWriter.concat(result.content)
        })

        let writer = new CppLanguageWriter(new IndentedPrinter(), this.library, this.argTypeConvertor, PrimitiveTypesInstance)
        this.writeModifiers(writer)
        this.writeImpls()
        this.implementationApiFile.content.concat(writer)
        this.writeApiGetter(this.cppWriter)
        this.cppWriter.concat(printBridgeCc(this.library).generated)
        createDeserializeAndCallPrinter(this.library.name, Language.CPP)(this.library).forEach(result => {
            this.cppWriter.concat(result.content)
        })
        // this.cppWriter.concat(makeDeserializeAndCall(this.library, Language.CPP, 'serializer.cc').content)
        this.cppWriter.concat(printManagedCaller('', this.library).content)
        this.hWriter.writeLines(readTemplate('any_api.h'))
        this.hWriter.writeLines(readTemplate('generic_service_api.h'))
        this.hWriter.writeLines(
            readLangTemplate('ohos_api_epilogue.h', Language.CPP)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )
        this.implementationApiFile.content.writeLines(
            readLangTemplate('api_impl_epilogue.cc', Language.CPP)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )
    }

    prepare() {
        this.library.files.forEach(file => {
            if (isInIdlize(file) || !isInCurrentModule(file))
                return
            linearizeNamespaceMembers(file.entries).forEach(entry => {
                if (isInterface(entry)) {
                    if (isMaterialized(entry, this.library)) {
                        this.interfaces.push(entry)
                    } else {
                        this.data.push(entry)
                    }
                } else if (isEnum(entry)) {
                    this.enums.push(entry)
                }
            })
        })

        this.data = sorted(this.data, it => getFQName(it))
        this.enums = sorted(this.enums, it => getFQName(it))
        this.interfaces = sorted(this.interfaces, it => getFQName(it))

        const global = createSyntheticGlobalScope(this.library)
        if (global.methods.length) {
            this.interfaces.push(global)
        }
    }

    private mangleTypeName(typeName: string): string {
        return `${generatorTypePrefix()}${typeName}`
    }
}

class ReturnTypeConvertor extends CppReturnTypeConvertor {
    override convertPrimitiveType(type: IDLPrimitiveType): string {
        if (type === IDLNumberType)
            return `${generatorConfiguration().TypePrefix}Number`
        return super.convertPrimitiveType(type)
    }
}

// TODO commonize this piece of code
class OhosBridgeCcVisitor extends BridgeCcVisitor {
    protected generateApiCall(method: PeerMethod, modifierName?: string): string {
        // TODO: may be need some translation tables?
        let clazz = modifierName ?? method.originalParentName
        return capitalize(clazz) + "()"
    }

    protected getApiCall(method: PeerMethod): string {
        const libName = this.library.name;
        return `Get${generatorConfiguration().TypePrefix}${this.library.name}_API(${libName}_API_VERSION)`
    }


    protected getReceiverArgName(): string {
        return "thisPtr"
    }

    protected printReceiverCastCall(method: PeerMethod) {
        // OHOS API does not need to cast native pointer at this moment
    }

    protected getPeerMethodName(method: PeerMethod): string {
        switch (method.peerMethodName) {
            case "ctor": return "construct"
            case "getFinalizer": return "destruct"
            default: return method.peerMethodName
        }
    }

    protected printAPICall(method: PeerMethod, modifierName?: string) {
        if (method.peerMethodName == "getFinalizer") {
            const modifier = this.generateApiCall(method, modifierName)
            const peerMethod = this.getPeerMethodName(method)
            const apiCall = this.getApiCall(method)
            const call = `return (${PrimitiveTypesInstance.NativePointer}) ${apiCall}->${modifier}->${peerMethod};`
            this.generatedApi.print(call)
        } else {
            super.printAPICall(method, modifierName)
        }
    }

    protected printMaterializedClass(clazz: MaterializedClass) {
        if (isResource(clazz.className)) return
        const modifierName = "";
        for (const method of [clazz.ctor, clazz.finalizer].concat(clazz.methods)) {
            if (!method) continue
            this.printMethod(method);
        }
    }
}

export function printBridgeCc(peerLibrary: PeerLibrary): BridgeCcApi {
    const visitor = new OhosBridgeCcVisitor(peerLibrary, false)
    visitor.print()
    return { generated: visitor.generatedApi, custom: visitor.customApi }
}

export function generateNativeOhos(peerLibrary: PeerLibrary): Map<TargetFile, string> {
    const libraryName = suggestLibraryName(peerLibrary)
    const visitor = new OHOSNativeVisitor(peerLibrary, libraryName)
    visitor.prepare()
    visitor.printC()
    return new Map([
        [new TargetFile(`${peerLibrary.name.toLowerCase()}.h`), visitor.hWriter.getOutput().join('\n')],
        [new TargetFile(`${peerLibrary.name.toLowerCase()}.cc`), visitor.cppWriter.getOutput().join('\n')],
        [new TargetFile(`${peerLibrary.name.toLowerCase()}Impl_temp.cc`), visitor.implementationStubsFile.printToString()],
        [new TargetFile(`${peerLibrary.name.toLowerCase()}ApiImpl_temp.cc`), visitor.implementationApiFile.printToString()],
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
    if (outConvertor)
        return {
            convertors: [...convertors, outConvertor],
            parameters: [...parameters, createParameter(outConvertor.param, outConvertor.idlType)],
            returnType: IDLVoidType
        }
    else
        return { convertors, parameters, returnType }
}

function generateArgConvertor(library: PeerLibrary, param: IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

interface MethodWithPostfix {
    method: IDLMethod,
    overloadPostfix: string
}

function generatePostfixForOverloads(methods: IDLMethod[]): MethodWithPostfix[] {
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

export function suggestLibraryName(library: PeerLibrary) {
    return currentModule().name.replaceAll(".", "_").toUpperCase()
}

function isResource(name: string): boolean {
    return generatorConfiguration().forceResource.includes(name)
}