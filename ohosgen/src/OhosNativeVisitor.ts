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
    IDLNode,
    IDLParameter,
    IDLPointerType,
    IDLProperty,
    IDLType,
    IDLVoidType,
    isConstructor,
    isContainerType,
    isEnum,
    isInterface,
    isOptionalType,
    isPrimitiveType,
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
    NamedMethodSignature,
    PrimitiveTypesInstance,
    CppConvertor,
} from '@idlizer/core'
import {
    createOutArgConvertor,
    getInteropRootPath,
    makeDeserializeAndCall,
    readLangTemplate,
    getUniquePropertiesFromSuperTypes,
    printBridgeCcForOHOS,
    printCallbacksKinds,
    printManagedCaller,
    writeDeserializer,
    writeSerializer,
    CppSourceFile,
    StructPrinter,
    TargetFile,
    PeerGeneratorConfigurationImpl,
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

    hWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), PrimitiveTypesInstance)
    cppWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), PrimitiveTypesInstance)

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
        this.implementationStubsFile.addInclude(`${fileNamePrefix}.h`)
    }

    private apiName(clazz: IDLInterface): string {
        if (hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)) return capitalize(this.libraryName)
        return capitalize(clazz.name)
    }

    private static knownBasicTypes = new Set(['ArrayBuffer', 'DataView'])

    mapType(type: IDLType | IDLEnum): string {
        const typeName = isEnum(type)
            ? type.name
            : isContainerType(type) || isUnionType(type)
                ? ''
                : isOptionalType(type)
                    ? `Opt_${this.libraryName}_${this.mapType(type.type)}`
                    : forceAsNamedNode(type).name
        if (OHOSNativeVisitor.knownBasicTypes.has(typeName)) {
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

        let writer = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppConvertor(this.library), PrimitiveTypesInstance)
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
    if(outConvertor) {
        convertors.push(outConvertor)
        parameters = parameters.slice()
        parameters.push(createParameter(outConvertor.param, outConvertor.idlType))
        returnType = IDLVoidType
    }
    return {
        convertors,
        parameters,
        returnType: isPrimitiveType(returnType) || isStructureType(returnType, library) ? returnType : IDLPointerType,
    }
}

function isStructureType(type: IDLType, library: PeerLibrary): boolean {
    const resolved = isReferenceType(type) && library.resolveTypeReference(type)
    return !!resolved && !isMaterialized(resolved as IDLInterface, library)
}

function generateArgConvertor(library: PeerLibrary, param: IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

// TODO drop this method
function generateCParameters(method: IDLMethod | IDLConstructor, argConvertors: ArgConvertor[], writer: LanguageWriter): string {
    let args = isConstructor(method) || method.isStatic ? [] : [`${PrimitiveTypesInstance.NativePointer} thisPtr`]
    for (let i = 0; i < argConvertors.length; ++i) {
        const typeName = writer.getNodeName(argConvertors[i].nativeType())
        const argName = writer.escapeKeyword(argConvertors[i].param)
        if (argConvertors[i].isPointerType()) {
            args.push(`const ${typeName}* ${argName}`)
        } else {
            args.push(`${typeName} ${argName}`)
        }
    }
    return args.join(", ")
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

export class OhosConfiguration extends PeerGeneratorConfigurationImpl {
    constructor(data: Record<string, any> = {}) {
        super({
            DumpSerialized: false,
            ApiVersion: 9999,
            ...data
        })
    }

    get dumpSerialized(): boolean { return this.param<boolean>("DumpSerialized") }
    get ApiVersion(): number { return this.param<number>("ApiVersion") }
}

export function suggestLibraryName(library: PeerLibrary) {
    let libraryName = library.files.filter(f => !f.isPredefined)[0].packageName()
    libraryName = libraryName.replaceAll("@", "").replaceAll(".", "_").toUpperCase()
    return libraryName
}
