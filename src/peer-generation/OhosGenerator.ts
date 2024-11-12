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
import { IndentedPrinter } from "../IndentedPrinter"
import { IdlPeerLibrary } from './idl/IdlPeerLibrary'
import { CppLanguageWriter, createLanguageWriter, ExpressionStatement, FieldModifier, LanguageExpression, LanguageWriter, Method, MethodSignature, NamedMethodSignature } from './LanguageWriters'
import { createContainerType, createReferenceType, forceAsNamedNode, hasExtAttribute, IDLCallback, IDLEntry, IDLEnum, IDLExtendedAttributes, IDLI32Type, IDLInterface, IDLMethod, IDLNumberType, IDLParameter, IDLPointerType, IDLType, IDLU8Type, IDLVoidType, isCallback, isClass, isConstructor, isContainerType, isEnum, isInterface, isMethod, isReferenceType, isType, isUnionType, maybeOptional } from '../idl'
import { makeDeserializeAndCall, makeSerializerForOhos, readLangTemplate } from './FileGenerators'
import { capitalize } from '../util'
import { isMaterialized } from './idl/IdlPeerGeneratorVisitor'
import { PrimitiveType } from './ArkPrimitiveType'
import { Language } from '../Language'
import { ArgConvertor } from './ArgConvertors'
import { writeDeserializer, writeSerializer } from './printers/SerializerPrinter'
import { qualifiedName } from './idl/common'
import { printCallbacksKinds, printManagedCaller } from './printers/CallbacksPrinter'
import { StructPrinter } from './idl/StructPrinter'
import { generateCallbackAPIArguments } from './ArgConvertors'
import { printBridgeCc } from './printers/BridgeCcPrinter'

class NameType {
    constructor(public name: string, public type: string) {}
}

interface SignatureDescriptor {
    params: NameType[]
    returnType: string
    paramsCString?: string
}

class OHOSVisitor {


    hWriter = new CppLanguageWriter(new IndentedPrinter(), this.library)
    cppWriter = new CppLanguageWriter(new IndentedPrinter(), this.library)

    peerWriter: LanguageWriter
    nativeWriter: LanguageWriter

    libraryName: string = ""

    interfaces = new Array<IDLInterface>()
    data = new Array<IDLInterface>()
    enums = new Array<IDLEnum>()
    callbacks = new Array<IDLCallback>()
    callbackInterfaces = new Array<IDLInterface>()

    constructor(protected library: IdlPeerLibrary) {
        this.peerWriter = createLanguageWriter(this.library.language, this.library)
        this.nativeWriter = createLanguageWriter(this.library.language, this.library)
    }

    private static knownBasicTypes = new Set(['ArrayBuffer', 'DataView'])

    mapType(type: IDLType | IDLEnum): string {
        if (isType(type)) {
            this.library.requestType(type, true)
        }

        const typeName = isEnum(type)
            ? type.name
            : isContainerType(type) || isUnionType(type)
                ? ''
                : forceAsNamedNode(type).name
        if (OHOSVisitor.knownBasicTypes.has(typeName))
            return `${PrimitiveType.Prefix}${typeName}`

        if (isReferenceType(type) || isEnum(type)) {
            return `${PrimitiveType.Prefix}${this.libraryName}_${qualifiedName(type, Language.CPP)}`
        }
        return this.hWriter.stringifyType(type)
    }

    makeSignature(returnType: IDLType, parameters: IDLParameter[]): MethodSignature {
        return new MethodSignature(returnType, parameters.map(it => it.type!))
    }


    private writeCallback(callback: IDLCallback) {
        // TODO commonize with StructPrinter.ts
        const callbackTypeName = `${PrimitiveType.Prefix}${this.libraryName}_${callback.name}`;
        const args = generateCallbackAPIArguments(this.library, callback)
        let _ = this.hWriter
        _.print(`typedef struct ${callbackTypeName} {`)
        _.pushIndent()
        _.print(`${PrimitiveType.Prefix}CallbackResource resource;`)
        _.print(`void (*call)(${args.join(', ')});`)
        _.popIndent()
        _.print(`} ${callbackTypeName};`)
    }

    private impls = new Map<string, SignatureDescriptor>()

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
        clazz.constructors.forEach((ctor, index) => {
            let name = `construct${(index > 0) ? index.toString() : ""}`
            let params = ctor.parameters.map(it => new NameType(_h.escapeKeyword(it.name), this.mapType(it.type!)))
            _h.print(`${handleType} (*${name})(${params.map(it => `const ${it.type}* ${it.name}`).join(", ")});`) // TODO check
            let implName = `${clazz.name}_${name}Impl`
            _c.print(`&${implName},`)
            this.impls.set(implName, { params, returnType: handleType})
        })
        if (clazz.constructors.length > 0) {
            let destructName = `${clazz.name}_destructImpl`
            let params = [new NameType("thiz", handleType)]
            _h.print(`void (*destruct)(${params.map(it => `${it.type} ${it.name}`).join(", ")});`)
            _c.print(`&${destructName},`)
            this.impls.set(destructName, { params, returnType: 'void'})
        }
        let isGlobalScope = hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)
        clazz.methods.forEach(method => {
            let params = new Array<NameType>()
            if (!method.isStatic && !isGlobalScope) {
                params.push(new NameType("thiz", handleType))
            }
            params = params.concat(method.parameters.map(it => new NameType(_h.escapeKeyword(it.name), this.mapType(it.type!))))
            let returnType = this.mapType(method.returnType)
            const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
            const args = generateCParameters(method, argConvertors, _h)
            _h.print(`${returnType} (*${method.name})(${args});`)
            let implName = `${clazz.name}_${method.name}Impl`
            _c.print(`&${implName},`)
            this.impls.set(implName, { params, returnType, paramsCString: args })
        })
        clazz.properties.forEach(property => {
            let returnType = `${this.mapType(property.type)}`
            _h.print(`${returnType} (*get${capitalize(property.name)})(${handleType} thiz);`)
            let getImplName = `${clazz.name}get${capitalize(property.name)}Impl`
            _c.print(`&${getImplName},`)
            this.impls.set(getImplName, { params: [new NameType(`thiz`, returnType)], returnType })
            if (!property.isReadonly) {
                let setImplName = `${clazz.name}set${capitalize(property.name)}Impl`
                _h.print(`void (*set${capitalize(property.name)})(${handleType} thiz, ${returnType} value);`)
                _c.print(`&${setImplName},`)
                this.impls.set(setImplName, { params: [new NameType("thiz", handleType), new NameType("value", returnType)], returnType: "void" })
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
            return `${PrimitiveType.Prefix}${this.libraryName}_Modifier`
        }
        return `${PrimitiveType.Prefix}${this.libraryName}_${clazz.name}Modifier`
    }
    private handleType(name: string): string {
        return `${PrimitiveType.Prefix}${this.libraryName}_${name}Handle`
    }

    private writeImpls() {
        let _ = this.cppWriter
        this.impls.forEach((signature, name) => {
            _.print(`${signature.returnType} ${name}(${signature.paramsCString ?? signature.params.map(it => `${it.type} ${it.name}`).join(", ")}) {`)
            _.pushIndent()
            if (signature.returnType != "void")
                _.print('return {};')
            _.popIndent()
            _.print(`}`)
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
        _c.print(`const ${PrimitiveType.Prefix}${api}_API* Get${api}APIImpl(int version) {`)
        _c.pushIndent()
        _c.print(`const static ${PrimitiveType.Prefix}${api}_API api = {`)
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
        let name = `${PrimitiveType.Prefix}${api}_API`
        let _h = this.hWriter
        _h.print(`typedef struct ${name} {`)
        _h.pushIndent()
        _h.print(`${PrimitiveType.Prefix}Int32 version;`)
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

    private requestType(type: IDLType | IDLEnum) {
        this.library.requestType(type, true)
    }

    private requestTypes(entry: IDLEntry) {
        if (isClass(entry)) {
            entry.constructors.forEach(it => this.requestTypes(it))
            entry.methods.forEach(it => this.requestTypes(it))
            entry.properties.forEach(it => this.requestType(it.type))
        } else if (isConstructor(entry)) {
            entry.parameters.forEach(it => this.requestType(it.type!))
        } else if (isMethod(entry) || isCallback(entry)) {
            entry.parameters.forEach(it => this.requestType(it.type!))
            this.requestType(entry.returnType)
        } else if (isEnum(entry)) {
            entry.elements.forEach(it => this.requestType(it.type))
        }
        entry.scope?.forEach(it => this.requestTypes(it))
    }

    private printManaged() {
        this.printNative()
        this.printPeer()
    }

    private printNative() {
        const className = `${this.libraryName}NativeModule`
        this.callbacks.forEach(callback => {
            if (this.library.language === Language.TS) {
                const params = callback.parameters.map(it => `${it.name}:${this.nativeWriter.stringifyType(it.type!)}`).join(', ')
                const returnTypeName = this.nativeWriter.stringifyType(callback.returnType)
                this.nativeWriter.print(`export type ${callback.name} = (${params}) => ${returnTypeName}`)
            }
        })
        this.callbackInterfaces.forEach(int => {
            this.nativeWriter.writeInterface(int.name, writer => {
                int.methods.forEach(method => {
                    writer.writeMethodDeclaration(
                        method.name,
                        writer.makeNamedSignature(method.returnType, method.parameters)
                    )
                })
            })
        })
        printCallbacksKinds(this.library, this.nativeWriter)
        this.nativeWriter.writeInterface(className, writer => {
            this.interfaces.forEach(it => {
                it.methods.forEach(method => {
                    const signature = makePeerCallSignature(this.library, method.parameters, method.returnType, "self")
                    writer.writeNativeMethodDeclaration(`_${it.name}_${method.name}`, signature)  // TODO temporarily removed _${this.libraryName} prefix
                })
            })
            this.interfaces.forEach(it => {
                const ctors = it.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0) {
                    ctors.push({
                        returnType: IDLNumberType /* unused? */,
                        parameters: []
                    })
                }
                ctors.forEach(ctor => {
                    const signature = makePeerCallSignature(this.library, ctor.parameters, IDLPointerType)
                    writer.writeNativeMethodDeclaration(`_${it.name}_ctor`, signature)
                })
            })
            writer.writeNativeMethodDeclaration("_GetManagerCallbackCaller",
                NamedMethodSignature.make(
                    IDLPointerType,
                    [{ name: "kind", type: createReferenceType("CallbackKind") }]
                )
            )
        })
    }

    private printPeer() {
        const nativeModuleVar = `${this.libraryName}NativeModule`
        const nativeModuleGetter = `get${nativeModuleVar}`
        if (this.library.language === Language.TS) {
            this.peerWriter.print('import {')
            this.peerWriter.pushIndent()
            this.peerWriter.print(`${nativeModuleVar},`)
            this.peerWriter.print(`${nativeModuleGetter},`)
            this.peerWriter.popIndent()
            this.peerWriter.print(`} from './${this.libraryName.toLocaleLowerCase()}Native'`)
        }
        this.data.forEach(data => {
            this.peerWriter.writeInterface(data.name, writer => {
                data.properties.forEach(prop => {
                    writer.writeFieldDeclaration(prop.name, prop.type, [], prop.isOptional)
                })
            })
        })
        this.interfaces.forEach(int => {
            this.peerWriter.writeInterface(`${int.name}Interface`, writer => {
                int.methods.forEach(method => {
                    const signature = writer.makeNamedSignature(method.returnType, method.parameters)
                    writer.writeMethodDeclaration(method.name, signature)
                })
            })
        })
        this.interfaces.forEach(int => {
            this.peerWriter.writeClass(`${int.name}`, writer => {
                writer.writeFieldDeclaration('peer', IDLPointerType, [FieldModifier.PRIVATE], false)
                const ctors = int.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0) {
                    ctors.push({
                        parameters: [],
                        returnType: IDLVoidType
                    })
                }
                ctors.forEach(ctor => {
                    const signature = writer.makeNamedSignature(ctor.returnType ?? IDLVoidType, ctor.parameters)
                    // TODO remove duplicated code from writePeerMethod (PeersPrinter.ts)
                    const argConvertors = ctor.parameters.map(param => generateArgConvertor(this.library, param))
                    let scopes = argConvertors.filter(it => it.isScoped)
                    scopes.forEach(it => {
                        writer.pushIndent()
                        writer.print(it.scopeStart?.(it.param, writer.language))
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
                        
                        const callExpression = writer.makeMethodCall(`${nativeModuleGetter}()`, `_${int.name}_ctor`, params)
                        writer.writeStatement(
                            writer.makeAssign('this.peer', undefined, callExpression, false)
                        )

                        if (serializerPushed) {
                            writer.writeStatement(new ExpressionStatement(
                                writer.makeMethodCall('thisSerializer', 'release', [])))
                            scopes.reverse().forEach(it => {
                                writer.popIndent()
                                writer.print(it.scopeEnd!(it.param, writer.language))
                            })
                        }
                    })
                })

                // write getPeer() method
                const getPeerSig = new MethodSignature(maybeOptional(createReferenceType("Finalizable"), true),[])
                writer.writeMethodImplementation(new Method("getPeer", getPeerSig), writer => {
                    // TODO add better (platform-agnostic) way to return Finalizable
                    writer.writeStatement(writer.makeReturn(writer.makeString("{ ptr: this.peer }")))
                })

                int.methods.forEach(method => {
                    const signature = writer.makeNamedSignature(method.returnType, method.parameters)
                    writer.writeMethodImplementation(new Method(method.name, signature), writer => {
                        // TODO remove duplicated code from writePeerMethod (PeersPrinter.ts)
                        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param))
                        let scopes = argConvertors.filter(it => it.isScoped)
                        scopes.forEach(it => {
                            writer.pushIndent()
                            writer.print(it.scopeStart?.(it.param, writer.language))
                        })
                        let serializerCreated = false
                        argConvertors.forEach((it) => {
                            if (it.useArray) {
                                if (!serializerCreated) {
                                    writer.writeStatement(
                                        writer.makeAssign(`thisSerializer`, createReferenceType('Serializer'),
                                            writer.makeMethodCall('Serializer', 'hold', []), true)
                                    )
                                    serializerCreated = true
                                }
                                it.convertorSerialize(`this`, it.param, writer)
                            }
                        })
                        let serializerPushed = false
                        let params = [ writer.makeString('this.peer')]
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
                        const callExpression = writer.makeMethodCall(
                            `${nativeModuleGetter}()`,
                            `_${int.name}_${method.name}`, // TODO temporarily removed _${this.libraryName} prefix
                            params
                        )
                        if (method.returnType === IDLVoidType) {
                            writer.writeStatement(writer.makeStatement(callExpression))
                        } else {
                            writer.writeStatement(writer.makeAssign("result", undefined, callExpression, true, true))
                        }
                        if (serializerPushed) {
                            writer.writeStatement(new ExpressionStatement(
                                writer.makeMethodCall('thisSerializer', 'release', [])))
                            scopes.reverse().forEach(it => {
                                writer.popIndent()
                                writer.print(it.scopeEnd!(it.param, writer.language))
                            })
                        }
                        if (method.returnType !== IDLVoidType) {
                            writer.writeStatement(writer.makeReturn(writer.makeString("result")))
                        }
                    })
                })
            }, undefined, [`${int.name}Interface`])
        })
    }

    private printC() {
        this.cppWriter.writeLines(
            readLangTemplate('api_impl_prologue.cc', Language.CPP)
                .replaceAll("%API_HEADER_PATH%", `${this.libraryName.toLowerCase()}.h`)
        )
        this.hWriter.writeLines(
            readLangTemplate('ohos_api_prologue.h', Language.CPP)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
        )


        printCallbacksKinds(this.library, this.cppWriter)
        let toStringsPrinter = createLanguageWriter(Language.CPP, this.library)
        new StructPrinter(this.library).generateStructs(this.hWriter, this.hWriter.printer, toStringsPrinter)
        this.cppWriter.concat(toStringsPrinter)
        const prefix = PrimitiveType.Prefix + this.library.libraryPrefix
        writeSerializer(this.library, this.cppWriter, prefix)
        writeDeserializer(this.library, this.cppWriter, prefix)

        let writer = new CppLanguageWriter(new IndentedPrinter(), this.library)
        this.writeModifiers(writer)
        this.writeImpls()
        this.cppWriter.concat(writer)
        this.cppWriter.print("// ------------------------------------------------------------------------------")
        const bridgeCc = printBridgeCc(this.library, false)
        this.cppWriter.concat(bridgeCc.generated)

        this.cppWriter.writeLines(makeDeserializeAndCall(this.library, Language.CPP))
        this.cppWriter.writeLines(printManagedCaller(this.library))

        this.hWriter.writeLines(
            readLangTemplate('ohos_api_epilogue.h', Language.CPP)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
        )
        this.cppWriter.writeLines(readLangTemplate('api_impl_epilogue.cc', Language.CPP))
    }

    execute(outDir: string, managedOutDir: string) {
        if (this.library.files.length == 0)
            throw new Error("No files in library")

        this.libraryName = this.library.files.filter(f => !f.isPredefined)[0].packageName().toUpperCase()
        this.library.name = this.libraryName

        console.log(`GENERATE OHOS API for ${this.libraryName}`)

        this.library.files.forEach(file => {
            if (file.isPredefined) return
            file.entries.forEach(entry => {
                this.requestTypes(entry)
                if (isInterface(entry) || isClass(entry)) {
                    if (isMaterialized(entry)) {
                        this.interfaces.push(entry)
                    } else if (isEnum(entry)) {
                        this.enums.push(entry)
                    } else {
                        this.data.push(entry)
                    }
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

        this.library.analyze()

        this.printManaged()
        this.printC()

        const fileNamePrefix = this.libraryName.toLowerCase()
        const ext = this.library.language.extension
        const nativeModuleTemaplte = readLangTemplate(`OHOSNativeModule_template${ext}`, this.library.language)
        const nativeModuleText = nativeModuleTemaplte
            .replaceAll('%NATIVE_MODULE_NAME%', this.libraryName)
            .replaceAll('%NATIVE_MODULE_CONTENT%', this.nativeWriter.getOutput().join('\n'))
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}Native${ext}`), nativeModuleText, 'utf-8')

        const peerTemplate = readLangTemplate(`OHOSPeer_template${ext}`, this.library.language)
        const peerText = peerTemplate
            .replaceAll('%PEER_CONTENT%', this.peerWriter.getOutput().join('\n'))
            .replaceAll('%SERIALIZER_PATH%', `./${fileNamePrefix}Serializer`)
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')

        this.hWriter.printTo(path.join(outDir, `${fileNamePrefix}.h`))
        this.cppWriter.printTo(path.join(outDir, `${fileNamePrefix}.cc`))

        fs.writeFileSync(path.join(outDir, `SerializerBase.h`),
            readLangTemplate(`ohos_SerializerBase.h`, Language.CPP)
                .replaceAll("%NATIVE_API_HEADER_PATH%", `${fileNamePrefix}.h`)
        )
        fs.writeFileSync(path.join(outDir, `DeserializerBase.h`),
            readLangTemplate(`ohos_DeserializerBase.h`, Language.CPP)
                .replaceAll("%NATIVE_API_HEADER_PATH%", `${fileNamePrefix}.h`)
        )

        const nativeModuleInfo = {
            name: `get${this.libraryName}NativeModule`,
            path: `./${fileNamePrefix}Native`,
        }
        const serializerText = makeSerializerForOhos(this.library, nativeModuleInfo, fileNamePrefix).getOutput().join("\n")
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}Serializer${ext}`), serializerText, 'utf-8')
        fs.writeFileSync(path.join(managedOutDir, `types${ext}`), readLangTemplate(`types${ext}`, this.library.language))
        fs.writeFileSync(path.join(managedOutDir, `SerializerBase${ext}`),
            readLangTemplate(`SerializerBase${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", nativeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", nativeModuleInfo.path)
        )
    }
}

export function generateOhos(outDir: string, peerLibrary: IdlPeerLibrary): void {
    const managedOutDir = path.join(outDir, peerLibrary.language.name.toLocaleLowerCase())
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
    if (!fs.existsSync(managedOutDir)) fs.mkdirSync(managedOutDir)

    const visitor = new OHOSVisitor(peerLibrary)
    visitor.execute(outDir, managedOutDir)
}

function generateArgConvertor(library: IdlPeerLibrary, param: IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

// TODO drop this method
function generateCParameters(method: IDLMethod, argConvertors: ArgConvertor[], writer: LanguageWriter): string {
    let args = [`${PrimitiveType.NativePointer.getText()} thisPtr`]
    for (let i = 0; i < argConvertors.length; ++i) {
        args.push(`const ${writer.stringifyType(method.parameters[i].type!)}* ${writer.escapeKeyword(method.parameters[i].name)}`)
    }
    return args.join(", ")
}

function makePeerCallSignature(library: IdlPeerLibrary, parameters: IDLParameter[], returnType: IDLType, thisArg?: string) {
    // TODO remove duplicated code from NativeModuleVisitor::printPeerMethod (NativeModulePrinter.ts)
    const argConvertors = parameters.map(param => generateArgConvertor(library, param))
    const args: ({name: string, type: IDLType})[] = thisArg ? [{ name: thisArg, type: IDLPointerType }] : []
    let serializerArgCreated = false
    for (let i = 0; i < argConvertors.length; ++i) {
        let it = argConvertors[i]
        if (it.useArray) {
            if (!serializerArgCreated) {
                args.push(
                    { name: 'thisArray', type: createContainerType(/* 'buffer' */ 'sequence', [IDLU8Type]) },
                    { name: 'thisLength', type: IDLI32Type },
                )
                serializerArgCreated = true
            }
        } else {
            args.push({ name: `${it.param}`, type: parameters[i].type! })
        }
    }
    return NamedMethodSignature.make(returnType, args)
}
