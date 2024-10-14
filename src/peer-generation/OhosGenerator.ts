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
import { CppLanguageWriter, createLanguageWriter, FieldModifier, LanguageWriter, Method, MethodSignature, NamedMethodSignature, Type } from './LanguageWriters'
import { hasExtAttribute, IDLCallback, IDLEntry, IDLEnum, IDLExtendedAttributes, IDLInterface, IDLKind, IDLNumberType, IDLParameter, IDLType, IDLVoidType, isCallback, isClass, isConstructor, isEnum, isEnumType, isInterface, isMethod, isPrimitiveType, isReferenceType, isUnionType } from '../idl'
import { readLangTemplate } from './FileGenerators'
import { capitalize } from '../util'
import { isMaterialized } from './idl/IdlPeerGeneratorVisitor'
import { PrimitiveType } from './ArkPrimitiveType'
import { Language } from '../Language'

class NameType {
    constructor(public name: string, public type: string) {}
}

interface SignatureDescriptor {
    params: NameType[]
    returnType: string
}

class OHOSVisitor {


    hWriter = new CppLanguageWriter(new IndentedPrinter())
    cppWriter = new CppLanguageWriter(new IndentedPrinter())

    peerWriter: LanguageWriter
    nativeWriter: LanguageWriter

    libraryName: string = ""

    interfaces = new Array<IDLInterface>()
    data = new Array<IDLInterface>()
    enums = new Array<IDLEnum>()
    callbacks = new Array<IDLCallback>()
    callbackInterfaces = new Array<IDLInterface>()

    constructor(protected library: IdlPeerLibrary) {
        this.peerWriter = createLanguageWriter(this.library.language)
        this.nativeWriter = createLanguageWriter(this.library.language)
    }

    private static knownBasicTypes = new Set(['ArrayBuffer', 'DataView'])

    mapType(type: IDLType): string {
        this.library.requestType(type, true)

        if (OHOSVisitor.knownBasicTypes.has(type.name))
            return `${PrimitiveType.Prefix}${type.name}`

        if (isReferenceType(type) || isEnum(type) || isEnumType(type)) {
            return `${PrimitiveType.Prefix}${this.libraryName}_${type.name!}`
        }
        return this.hWriter.mapIDLType(type)
    }

    makeSignature(returnType: IDLType, parameters: IDLParameter[]): MethodSignature {
        return new MethodSignature(Type.fromName(this.mapType(returnType)),
            parameters.map(it => Type.fromName(this.mapType(it.type!))))
    }

    private writeData(clazz: IDLInterface) {
        let name = `${PrimitiveType.Prefix}${this.libraryName}_${clazz.name}`
        let _ = this.hWriter
        _.print(`typedef struct ${name} {`)
        _.pushIndent()
        clazz.properties.forEach(it => {
            _.print(`${this.mapType(it.type)} ${it.name};`)
        })
        _.popIndent()
        _.print(`} ${name};`)
    }

    private writeCallback(callback: IDLCallback) {
        let _ = this.hWriter
        // Stub for now, fix.
        _.print(`typedef void* ${PrimitiveType.Prefix}${this.libraryName}_${callback.name};`)
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
            _h.print(`${handleType} (*${name})(${params.map(it => `${it.type} ${it.name}`).join(", ")});`)
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
            _h.print(`${returnType} (*${method.name})(${params.map(it => `${it.type} ${it.name}`).join(", ")});`)
            let implName = `${clazz.name}_${method.name}Impl`
            _c.print(`&${implName},`)
            this.impls.set(implName, { params, returnType })
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
            _.print(`${signature.returnType} ${name}(${signature.params.map(it => `${it.type} ${it.name}`).join(", ")}) {`)
            _.pushIndent()
            if (signature.returnType != "void")
                _.print('return 0;')
            _.popIndent()
            _.print(`}`)
        })
    }

    private writeModifiers(writer: CppLanguageWriter) {
        this.callbacks.forEach(it => {
            this.writeCallback(it)
        })
        this.data.forEach(it => {
            this.writeData(it)
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

    private writeClass(clazz: IDLInterface) {
        this.cppWriter.writeClass(clazz.name, (writer) => {
            clazz.constructors.forEach(it => {
                writer.writeConstructorImplementation(clazz.name,
                    this.makeSignature(IDLVoidType, it.parameters), (writer) => {
                })
            })
            clazz.methods.forEach(it => {
                writer.writeMethodImplementation(new Method(it.name,
                    this.makeSignature(it.returnType, it.parameters)), (writer) => {
                })
            })
        })
    }

    visitDeclaration(entry: IDLEntry): void {
        // if (isClass(entry)) this.writeClass(entry)
    }

    private requestType(type: IDLType) {
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
            this.requestType(entry)
        }
        entry.scope?.forEach(it => this.requestTypes(it))
    }

    private writeTypes(types: IDLEntry[]) {
        let _ = this.hWriter
        let seen = new Set<string>()
        types.forEach(type => {
            if (seen.has(type.name!)) return
            seen.add(type.name!)
            if (isPrimitiveType(type)) {
            }
            if (isUnionType(type)) {
                _.print(`struct ${this.mapType(type)} {`)
                _.pushIndent()
                _.print(`int selector;`)
                _.print(`union {`)
                _.pushIndent()
                type.types.forEach((type, index) => {
                    _.print(`${this.mapType(type)} value${index};`)
                })
                _.popIndent()
                _.print(`};`)
                _.popIndent()
                _.print(`};`)
            }
            if (isEnum(type)) {
                let declaration = this.library.toDeclaration(type) as IDLEnum
                _.print(`typedef enum {`)
                _.pushIndent()
                declaration.elements.forEach(it => {
                    _.print(`${PrimitiveType.Prefix}${this.libraryName}_${it.name},`)
                })
                _.popIndent()
                _.print(`} ${this.mapType(type)};`)
            }
        })
    }

    private printManaged() {
        this.printNative()
        this.printPeer()
    }

    private printNative() {
        const className = `${this.libraryName}NativeModule`
        this.callbacks.forEach(callback => {
            if (this.library.language === Language.TS) {
                const params = callback.parameters.map(it => `${it.name}:${this.nativeWriter.mapIDLType(it.type!)}`).join(', ')
                const returnTypeName = this.nativeWriter.mapIDLType(callback.returnType)
                this.nativeWriter.print(`type ${callback.name} = (${params}) => ${returnTypeName}`)
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
        this.data.forEach(data => {
            this.nativeWriter.writeClass(data.name, writer => {
                data.properties.forEach(prop => {
                    writer.writeFieldDeclaration(prop.name, Type.fromName(prop.type.name), [], false)
                })
            })
        })
        this.nativeWriter.writeInterface(className, writer => {
            this.interfaces.flatMap(it => it.methods).forEach(method => {
                const signature = writer.makeNamedSignature(method.returnType, method.parameters)
                signature.args.unshift(Type.fromName('pointer'))
                signature.argsNames.unshift('self')
                writer.writeNativeMethodDeclaration(`_${this.libraryName}_${method.name}`, signature)
            })
            this.interfaces.forEach(it => {
                const ctors = it.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0) {
                    ctors.push({
                        returnType: IDLNumberType,
                        parameters: []
                    })
                }
                ctors.forEach(ctor => {
                    const signature = writer.makeNamedSignature(IDLNumberType, ctor.parameters)
                    writer.writeNativeMethodDeclaration(`_${it.name}_ctor`, signature)
                })
            })
        })
    }

    private printPeer() {
        const nativeModuleVar = `${this.libraryName}NativeModule`
        const nativeModuleGetter = `get${nativeModuleVar}`
        if (this.library.language === Language.TS) {
            this.peerWriter.print('import {')
            this.peerWriter.pushIndent()
            this.data.forEach(data => {
                this.peerWriter.print(`${data.name},`)
            })
            this.peerWriter.print(`${nativeModuleVar},`)
            this.peerWriter.print(`${nativeModuleGetter},`)
            this.peerWriter.popIndent()
            this.peerWriter.print(`} from './${this.libraryName.toLocaleLowerCase()}Native${this.library.language.extension}'`)
        }
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
                writer.writeFieldDeclaration('peer', Type.fromName('pointer'), [FieldModifier.PRIVATE], false)
                const ctors = int.constructors.map(it => ({ parameters: it.parameters, returnType: it.returnType }))
                if (ctors.length === 0) {
                    ctors.push({
                        parameters: [],
                        returnType: IDLVoidType
                    })
                }
                ctors.forEach(ctor => {
                    const signature = writer.makeNamedSignature(ctor.returnType ?? IDLVoidType, ctor.parameters)

                    writer.writeConstructorImplementation(int.name, signature, writer => {
                        writer.writeStatement(
                            writer.makeAssign(
                                'this.peer', undefined,
                                writer.makeMethodCall(`${nativeModuleGetter}()`, `_${int.name}_ctor`, signature.argsNames.map(it => writer.makeString(it))),
                                false
                            )
                        )
                    })
                })
                int.methods.forEach(method => {
                    const signature = writer.makeNamedSignature(method.returnType, method.parameters)
                    writer.writeMethodImplementation(new Method(method.name, signature), writer => {
                        const callExpression = writer.makeMethodCall(
                            `${nativeModuleGetter}()`,
                            `_${this.libraryName}_${method.name}`,
                            [ writer.makeString('this.peer')].concat(
                                method.parameters.map(it => writer.makeString(it.name))
                            )
                        )
                        if (method.returnType === IDLVoidType) {
                            writer.writeStatement(writer.makeStatement(callExpression))
                        } else {
                            writer.writeStatement(writer.makeReturn(callExpression))
                        }
                    })
                })
            }, undefined, [`${int.name}Interface`])
        })
    }

    private printC() {
        this.cppWriter.writeLines(readLangTemplate('api_impl_prologue.cc', Language.CPP))
        this.hWriter.writeLines(readLangTemplate('ohos_api_prologue.h', Language.CPP))

        this.writeTypes(this.library.orderedDependenciesToGenerate)

        let writer = new CppLanguageWriter(new IndentedPrinter())
        this.writeModifiers(writer)
        this.writeImpls()
        this.cppWriter.concat(writer)

        this.hWriter.writeLines(readLangTemplate('ohos_api_epilogue.h', Language.CPP))
        this.cppWriter.writeLines(readLangTemplate('api_impl_epilogue.cc', Language.CPP))
    }

    execute(outDir: string, managedOutDir: string) {
        PrimitiveType.Prefix = "OH_"

        if (this.library.files.length == 0)
            throw new Error("No files in library")

        this.libraryName = this.library.files[0].packageName().toUpperCase()

        console.log(`GENERATE OHOS API for ${this.libraryName}`)

        this.library.files.forEach(file => {
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
                if (this.interfaces.find(x => x.name === param.type!.name)) {
                    callbackInterfaceNames.add(param.type!.name)
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

        const nativeModuleTemaplte = readLangTemplate(`OHOSNativeModule_template${this.library.language.extension}`, this.library.language)
        const nativeModuleText = nativeModuleTemaplte
            .replaceAll('%NATIVE_MODULE_NAME%', this.libraryName)
            .replaceAll('%NATIVE_MODULE_CONTENT%', this.nativeWriter.getOutput().join('\n'))
        fs.writeFileSync(path.join(managedOutDir, `${this.libraryName.toLowerCase()}Native${this.library.language.extension}`), nativeModuleText, 'utf-8')

        const peerTemplate = readLangTemplate(`OHOSPeer_template${this.library.language.extension}`, this.library.language)
        const peerText = peerTemplate
            .replaceAll('%PEER_CONTENT%', this.peerWriter.getOutput().join('\n'))
        fs.writeFileSync(path.join(managedOutDir, `${this.libraryName.toLowerCase()}${this.library.language.extension}`), peerText, 'utf-8')

        this.hWriter.printTo(path.join(outDir, "xml.h"))
        this.cppWriter.printTo(path.join(outDir, "xml.cc"))

        fs.writeFileSync(path.join(managedOutDir, `${this.libraryName.toLowerCase()}${this.library.language.extension}`), peerText, 'utf-8')
        fs.writeFileSync(path.join(managedOutDir, `types.ts`), readLangTemplate(`types${this.library.language.extension}`, this.library.language))
    }
}

export function generateOhos(outDir: string, peerLibrary: IdlPeerLibrary): void {
    const managedOutDir = path.join(outDir, peerLibrary.language.name.toLocaleLowerCase())
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
    if (!fs.existsSync(managedOutDir)) fs.mkdirSync(managedOutDir)

    const visitor = new OHOSVisitor(peerLibrary)
    visitor.execute(outDir, managedOutDir)
}

