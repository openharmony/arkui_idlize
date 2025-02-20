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
    createConstructor,
    createMethod,
    createParameter,
    forceAsNamedNode,
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
} from '@idlizer/core'
import {
    createOutArgConvertor,
    getInteropRootPath,
    makeDeserializeAndCall,
    readLangTemplate,
    getUniquePropertiesFromSuperTypes,
    printCallbacksKinds,
    printManagedCaller,
    writeDeserializer,
    writeSerializer,
    CppSourceFile,
    StructPrinter,
    TargetFile,
    isGlobalScope,
    BridgeCcApi,
    BridgeCcVisitor,
} from '@idlizer/libohos'

class NameType {
    constructor(public name: string, public type: string) {}
}

interface SignatureDescriptor {
    params: NameType[]
    returnType: string
    paramsCString?: string
}

class OHOSNativeVisitor {
    implementationStubsFile: CppSourceFile

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
    }

    private apiName(clazz: IDLInterface): string {
        if (hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)) return capitalize(this.libraryName)
        return capitalize(clazz.name)
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
                let params = ctor.parameters.map(it =>
                    new NameType(_h.escapeKeyword(it.name), this.argTypeConvertor.convert(it.type!)))
                let argConvertors = ctor.parameters.map(param => generateArgConvertor(this.library, param))
                let cppArgs = this.generateCParameters(ctor, argConvertors, _h)
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
            params = params.concat(adjustedSignature.parameters.map(it =>
                new NameType(_h.escapeKeyword(it.name), this.argTypeConvertor.convert(it.type!))))
            let returnType = this.returnTypeConvertor.convert(adjustedSignature.returnType)
            const args = this.generateCParameters(method, adjustedSignature.convertors, _h)
            _h.print(`${returnType} (*${method.name}${overloadPostfix})(${args});`)
            let implName = `${clazz.name}_${method.name}${overloadPostfix}Impl`
            _c.print(`&${implName},`)
            this.impls.set(implName, { params, returnType, paramsCString: args })
        })

        const propertiesFromInterface: IDLProperty[] = this.getPropertiesFromInterfaces(clazz)
        propertiesFromInterface.concat(clazz.properties).forEach(property => {
            let accessorMethods = []
            let getterMethod = createMethod(`get${capitalize(property.name)}`, [], property.type)
            accessorMethods.push(getterMethod)
            if (!property.isReadonly) {
                let setterMethod = createMethod(`set${capitalize(property.name)}`, [
                    createParameter("value", property.type)
                ], IDLVoidType)
                accessorMethods.push(setterMethod)
            }

            for (const method of accessorMethods) {
                const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
                let params = new Array<NameType>()
                if (!isGlobalScope) {
                    params.push(new NameType("thiz", handleType))
                }
                params = params.concat(adjustedSignature.parameters.map(it =>
                    new NameType(_h.escapeKeyword(it.name), this.argTypeConvertor.convert(it.type!))))
                let returnType = this.returnTypeConvertor.convert(adjustedSignature.returnType)
                const args = this.generateCParameters(method, adjustedSignature.convertors, _h)
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
        if (hasExtAttribute(method, IDLExtendedAttributes.Throws))
            args.unshift(`${generatorConfiguration().TypePrefix}${this.libraryName}_VMContext vmContext`)
        return args.join(", ")
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
        _c.print(`const ${generatorConfiguration().TypePrefix}${api}_API* Get${api}APIImpl(int version) {`)
        _c.pushIndent()
        _c.print(`const static ${generatorConfiguration().TypePrefix}${api}_API api = {`)
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
        let name = `${generatorConfiguration().TypePrefix}${api}_API`
        let _h = this.hWriter
        _h.print(`typedef struct ${name} {`)
        _h.pushIndent()
        _h.print(`${generatorConfiguration().TypePrefix}Int32 version;`)
        this.interfaces.forEach(it => {
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

        let writer = new CppLanguageWriter(new IndentedPrinter(), this.library, this.argTypeConvertor, PrimitiveTypesInstance)
        this.writeModifiers(writer)
        this.writeImpls()
        this.cppWriter.concat(writer)
        this.cppWriter.concat(printBridgeCc(this.library).generated)
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
            if (file.isPredefined ||
                this.library.libraryPackages?.length && !this.library.libraryPackages.includes(file.packageName()))
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
        let clazz = modifierName ?? dropSuffix(dropSuffix(dropSuffix(method.originalParentName, "Method"), "Attribute"), "Interface")
        return capitalize(clazz) + "()"
    }

    protected getApiCall(method: PeerMethod): string {
        const libName = this.library.name;
        return `Get${libName}APIImpl(${libName}_API_VERSION)`
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

    protected getApiCallResultField(method: PeerMethod): string {
        // TODO Remove this workaround for case when number is replaced with int32
        if (method.method.signature.returnType === IDLNumberType) {
            return ".i32"
        } else {
            return super.getApiCallResultField(method)
        }

    }

    protected printMaterializedClass(clazz: MaterializedClass) {
        const isGlobal = isGlobalScope(clazz.decl);
        const modifierName = isGlobal ? capitalize(this.library.name) : "";
        for (const method of [clazz.ctor, clazz.finalizer].concat(clazz.methods)) {
            if (!method) continue
            if (isGlobal) {
                this.printMethod(method, modifierName);
            } else {
                this.printMethod(method);
            }
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

export function suggestLibraryName(library: PeerLibrary) {
    if (library.name !== '') {
        return library.name
    }
    let libraryName = library.files.filter(f => !f.isPredefined)[0].packageName()
    libraryName = libraryName.replaceAll("@", "").replaceAll(".", "_").toUpperCase()
    return libraryName
}
