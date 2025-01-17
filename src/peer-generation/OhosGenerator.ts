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
import * as idl from '@idlize/core/idl'

import { createConstructor, createContainerType, createOptionalType, createReferenceType, createTypeParameterReference, createParameter, forceAsNamedNode, hasExtAttribute, IDLBufferType, IDLCallback, IDLConstructor, IDLEntry, IDLEnum, IDLExtendedAttributes, IDLI32Type, IDLI64Type, IDLInterface, IDLInterfaceSubkind, IDLMethod, IDLParameter, IDLPointerType, IDLStringType, IDLType, IDLU8Type, IDLUint8ArrayType, IDLVoidType, isCallback, isConstructor, isContainerType, isEnum, isInterface, isReferenceType, isUnionType } from '@idlize/core/idl'
import { IndentedPrinter, Language, capitalize, qualifiedName } from '@idlize/core'
import { ArgConvertor, generateCallbackAPIArguments } from './ArgConvertors'
import { createOutArgConvertor } from './PromiseConvertors'
import { PrimitiveType } from './ArkPrimitiveType'
import { makeDeserializeAndCall, makeSerializerForOhos, readLangTemplate } from './FileGenerators'
import { isMaterialized } from './idl/IdlPeerGeneratorVisitor'
import { CppLanguageWriter, createLanguageWriter, ExpressionStatement, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature } from './LanguageWriters'
import { PeerLibrary } from './PeerLibrary'
import { printBridgeCcForOHOS } from './printers/BridgeCcPrinter'
import { printCallbacksKinds, printManagedCaller } from './printers/CallbacksPrinter'
import { writeDeserializer, writeSerializer } from './printers/SerializerPrinter'
import { CppSourceFile } from './printers/SourceFile'
import { StructPrinter } from './printers/StructPrinter'
import { NativeModuleType } from './NativeModuleType'
import { collapseSameMethodsIDL, groupOverloads, groupOverloadsIDL, OverloadsPrinter } from './printers/OverloadsPrinter'
import { MaterializedClass, MaterializedMethod } from './Materialized'
import { PeerMethod } from './PeerMethod'
import { writePeerMethod } from './printers/PeersPrinter'

class NameType {
    constructor(public name: string, public type: string) {}
}

interface SignatureDescriptor {
    params: NameType[]
    returnType: string
    paramsCString?: string
}

class OHOSVisitor {
    implementationStubsFile: CppSourceFile

    hWriter = new CppLanguageWriter(new IndentedPrinter(), this.library)
    cppWriter = new CppLanguageWriter(new IndentedPrinter(), this.library)

    peerWriter: LanguageWriter
    nativeWriter: LanguageWriter
    nativeFunctionsWriter: LanguageWriter
    arkUIFunctionsWriter: LanguageWriter

    libraryName: string = ""

    interfaces = new Array<IDLInterface>()
    data = new Array<IDLInterface>()
    enums = new Array<IDLEnum>()
    callbacks = new Array<IDLCallback>()
    callbackInterfaces = new Array<IDLInterface>()

    constructor(protected library: PeerLibrary) {
        if (this.library.files.length == 0)
            throw new Error("No files in library")

        this.libraryName = suggestLibraryName(this.library)
        this.library.name = this.libraryName

        this.peerWriter = createLanguageWriter(library.language, library)
        this.nativeWriter = createLanguageWriter(library.language, library)
        this.nativeFunctionsWriter = createLanguageWriter(library.language, library)
        this.arkUIFunctionsWriter = createLanguageWriter(library.language, library)

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
                    ? `Opt_${this.mapType(type.type)}`
                    : idl.forceAsNamedNode(type).name
        if (OHOSVisitor.knownBasicTypes.has(typeName))
            return `${PrimitiveType.Prefix}${typeName}`

        if (isReferenceType(type) || isEnum(type)) {
            return `${PrimitiveType.Prefix}${this.libraryName}_${qualifiedName(type, Language.CPP)}`
        }
        return this.hWriter.getNodeName(type)
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
        let isGlobalScope = hasExtAttribute(clazz, IDLExtendedAttributes.GlobalScope)
        clazz.methods.forEach(method => {
            const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
            let params = new Array<NameType>()
            if (!method.isStatic && !isGlobalScope) {
                params.push(new NameType("thiz", handleType))
            }
            params = params.concat(adjustedSignature.parameters.map(it => new NameType(_h.escapeKeyword(it.name), this.mapType(it.type!))))
            let returnType = this.mapType(adjustedSignature.returnType)
            const args = generateCParameters(method, adjustedSignature.convertors, _h)
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

    private printManaged() {
        this.printNative()
        this.printPeer()
    }

    private printNative() {
        const className = `${this.libraryName}NativeModule`
        NativeModuleType.Generated.name = className
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

                const overloads = new Map<string, number>()
                for (const method of it.methods) {
                    overloads.set(method.name, (overloads.get(method.name) ?? 0) + 1)
                }

                const overloadCounter = new Map<string, number>()
                for (const [overloadName, count] of overloads) {
                    if (count > 1) {
                        overloadCounter.set(overloadName, 0)
                    }
                }

                it.methods.forEach(method => {
                    const signature = makePeerCallSignature(this.library, method.parameters, method.returnType, method.isStatic ? undefined : "self")
                    let postfix = ''
                    if (overloadCounter.has(method.name)) {
                        const count = overloadCounter.get(method.name)!
                        postfix = count.toString()
                        overloadCounter.set(method.name, count + 1)
                    }
                    const name = `_${it.name}_${method.name}${postfix}`
                    writer.writeNativeMethodDeclaration(name, signature)  // TODO temporarily removed _${this.libraryName} prefix
                })
            })
        })(this.nativeFunctionsWriter)

        this.arkUIFunctionsWriter.printer.pushIndent(this.nativeWriter.indentDepth() + 1)
        ;((writer: LanguageWriter) => {
            writer.writeNativeMethodDeclaration("_CheckArkoalaCallbackEvent",
                NamedMethodSignature.make(IDLI32Type, [
                    { name: "buffer", type: IDLUint8ArrayType },
                    { name: "bufferLength", type: IDLI32Type },
                ])
            )
            writer.writeNativeMethodDeclaration("_HoldArkoalaResource",
                NamedMethodSignature.make(IDLVoidType, [
                    { name: "resourceId", type: IDLI32Type }
                ])
            )
            writer.writeNativeMethodDeclaration("_ReleaseArkoalaResource",
                NamedMethodSignature.make(IDLVoidType, [
                    { name: "resourceId", type: IDLI32Type }
                ])
            )
            writer.writeNativeMethodDeclaration("_Utf8ToString",
                NamedMethodSignature.make(IDLStringType, [
                    { name: "buffer", type: IDLUint8ArrayType },
                    { name: "position", type: IDLI32Type },
                    { name: "length", type: IDLI32Type },
                ])
            )
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
            if (writer.language === Language.ARKTS) {
                writer.writeNativeMethodDeclaration("_ManagedStringWrite",
                    NamedMethodSignature.make(IDLI32Type, [
                        { name: "str", type: IDLStringType },
                        { name: "arr", type: IDLUint8ArrayType },
                        { name: "len", type: IDLI32Type },
                    ])
                )
            }
        })(this.arkUIFunctionsWriter)
    }

    private printPeer() {
        const nativeModuleVar = `${this.libraryName}NativeModule`
        if (this.library.language === Language.TS) {
            this.peerWriter.print('import {')
            this.peerWriter.pushIndent()
            this.peerWriter.print(`${nativeModuleVar},`)
            this.peerWriter.popIndent()
            this.peerWriter.print(`} from './${this.libraryName.toLocaleLowerCase()}Native'`)
        } else if (this.library.language === Language.ARKTS) {
            this.peerWriter.print('import {')
            this.peerWriter.pushIndent()
            this.peerWriter.print(`${nativeModuleVar},`)
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
        this.enums.forEach(e => {
            const writer = this.peerWriter
            writer.writeStatement(writer.makeEnumEntity(e, true))
        })
        this.interfaces.forEach(int => {
            if (hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)) {
                return
            }
            const superTypes = int.inheritance.filter(it => it !== idl.IDLTopType).map(superClass => `${superClass.name}Interface`)
            this.peerWriter.writeInterface(`${int.name}Interface`, writer => {
                int.methods.forEach(method => {
                    if (method.isStatic) {
                        return
                    }
                    const adjustedSignature = adjustSignature(this.library, method.parameters, method.returnType)
                    const signature = writer.makeNamedSignature(adjustedSignature.returnType, adjustedSignature.parameters)
                    writer.writeMethodDeclaration(method.name, signature)
                })
            }, superTypes.length > 0 ? superTypes : undefined)
        })
        this.interfaces.forEach(int => {
            const isGlobalScope = hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)
            this.peerWriter.writeClass(`${int.name}`, writer => {
                let peerInitExpr: LanguageExpression | undefined = undefined
                if (this.library.language === Language.ARKTS && int.constructors.length === 0) {
                    peerInitExpr = writer.makeString("Finalizable.Empty")
                }
                // TODO Make peer private again
                writer.writeFieldDeclaration('peer', createReferenceType("Finalizable"), [/* FieldModifier.PRIVATE */], false, peerInitExpr)
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

                        const createPeerExpression = writer.makeNewObject("Finalizable", [
                            writer.makeNativeCall(NativeModuleType.Generated, `_${int.name}_ctor`, params),
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
                                writer.print(it.scopeEnd!(it.param, writer.language))
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
                        NativeModuleType.Generated,
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
                    const clazzRefType = createReferenceType(int.name, typeArguments?.map(createTypeParameterReference))
                    const constructSig = new NamedMethodSignature(clazzRefType, [IDLPointerType], ["ptr"])
                    writer.writeMethodImplementation(new Method("construct", constructSig, [MethodModifier.STATIC], typeArguments), writer => {
                        const objVar = `obj${int.name}`
                        writer.writeStatement(writer.makeAssign(objVar, clazzRefType, writer.makeNewObject(int.name), true))
                        writer.writeStatement(
                            writer.makeAssign(`${objVar}.peer`, createReferenceType("Finalizable"),
                                writer.makeString(`new Finalizable(ptr, ${int.name}.getFinalizer())`), false),
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
                    )
                ))

                PeerMethod.markAndGroupOverloads(materializedMethods)

                const groupedMethods = groupOverloads(
                    materializedMethods
                )

                groupedMethods.forEach(methods => {
                    PeerMethod.markAndGroupOverloads(methods)
                })

                const overloadsPrinter = new OverloadsPrinter(this.library, writer, this.library.language, false)
                const clazz = new MaterializedClass(
                    int,
                    int.name,
                    true,
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
                        'this.peer!.ptr',
                        method.returnType
                    )
                })

            }, idl.getSuperType(int)?.name, isGlobalScope ? undefined : [`${int.name}Interface`])

            // TODO Migrate to MaterializedPrinter
            if (int.constructors.length === 0) {
                // Write MaterializedClass static
                if (!hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)) {
                    this.peerWriter.writeClass(`${int.name}Internal`, writer => {
                        // write fromPtr(ptr: number):MaterializedClass method
                        const clazzRefType = createReferenceType(int.name, int.typeParameters?.map(createTypeParameterReference))
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
                                    writer.makeString(`new Finalizable(ptr, ${int.name}.getFinalizer())`), false),
                            )
                            writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
                        })
                    })
                }
            }
        })

        this.library.globalScopeInterfaces.forEach(entry => {
            const groupedMethods = groupOverloadsIDL(entry.methods)
            groupedMethods.forEach(methods => {
                const method = collapseSameMethodsIDL(methods)
                const signature = NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: it.type })))
                this.peerWriter.writeFunctionImplementation(method.name, signature, w => {
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

    private printC() {
        let callbackKindsPrinter = createLanguageWriter(Language.CPP, this.library);
        printCallbacksKinds(this.library, callbackKindsPrinter)

        this.cppWriter.writeLines(
            readLangTemplate('api_impl_prologue.cc', Language.CPP)
                .replaceAll("%INTEROP_MODULE_NAME%", `${this.libraryName.toUpperCase()}NativeModule`)
                .replaceAll("%API_HEADER_PATH%", `${this.libraryName.toLowerCase()}.h`)
                .replaceAll("%CALLBACK_KINDS%", callbackKindsPrinter.getOutput().join("\n"))
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )
        const interopTypesPath = path.resolve(__dirname, '..', 'node_modules', '@koalaui', 'interop', 'src', 'cpp', 'interop-types.h')
        const interopTypesContent = fs.readFileSync(interopTypesPath, 'utf-8')
        this.hWriter.writeLines(
            readLangTemplate('ohos_api_prologue.h', Language.CPP)
                .replaceAll("%INTEROP_TYPES_HEADER", interopTypesContent)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )

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
        this.cppWriter.concat(printBridgeCcForOHOS(this.library).generated)
        this.cppWriter.concat(makeDeserializeAndCall(this.library, Language.CPP, 'serializer.cc').content)
        this.cppWriter.concat(printManagedCaller(this.library).content)

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

    execute(outDir: string, managedOutDir: string) {
        console.log(`GENERATE OHOS API for ${this.libraryName}`)

        this.library.files.forEach(file => {
            if (file.isPredefined) return
            file.entries.forEach(entry => {
                if (isInterface(entry)) {
                    if (isMaterialized(entry, this.library)) {
                        this.interfaces.push(entry)
                    } else {
                        this.data.push(entry)
                    }
                } else if (isEnum(entry)) {
                    this.enums.push(entry)
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

        this.printManaged()
        this.printC()

        const fileNamePrefix = this.libraryName.toLowerCase()
        const ext = this.library.language.extension

        const managedCodeModuleInfo = {
            name: `${this.libraryName}NativeModule`,
            path: `./${fileNamePrefix}Native`,
            serializerPath: `./${fileNamePrefix}Serializer`,
            finalizablePath: `./${fileNamePrefix}Finalizable`,
        }

        if (this.library.language === Language.ARKTS) {
            managedCodeModuleInfo.name = `${this.libraryName}NativeModule`
        }

        const nativeModuleTemplate = readLangTemplate(`OHOSNativeModule_template${ext}`, this.library.language)
        const nativeModuleText = nativeModuleTemplate
            .replaceAll('%NATIVE_MODULE_NAME%', this.libraryName)
            .replaceAll('%NATIVE_MODULE_CONTENT%', this.nativeWriter.getOutput().join('\n'))
            .replaceAll('%NATIVE_FUNCTIONS%', this.nativeFunctionsWriter.getOutput().join('\n'))
            .replaceAll('%ARKUI_FUNCTIONS%', this.arkUIFunctionsWriter.getOutput().join('\n'))
            .replaceAll('%OUTPUT_FILE%', managedCodeModuleInfo.path.replace('./', ''))
        fs.writeFileSync(path.join(managedOutDir, `${managedCodeModuleInfo.path}${ext}`), nativeModuleText, 'utf-8')

        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}Finalizable${ext}`),
            readLangTemplate(`OHOSFinalizable_template${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
        )

        const peerTemplate = readLangTemplate(`OHOSPeer_template${ext}`, this.library.language)
        const peerText = peerTemplate
            .replaceAll('%PEER_CONTENT%', this.peerWriter.getOutput().join('\n'))
            .replaceAll('%SERIALIZER_PATH%', managedCodeModuleInfo.serializerPath)
            .replaceAll('%FINALIZABLE_PATH%', managedCodeModuleInfo.finalizablePath)
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')

        this.hWriter.printTo(path.join(outDir, `${fileNamePrefix}.h`))
        this.cppWriter.printTo(path.join(outDir, `${fileNamePrefix}.cc`))

        fs.writeFileSync(path.join(outDir, this.implementationStubsFile.name),
            this.implementationStubsFile.printToString()
        )
        
        const serializerText = makeSerializerForOhos(this.library, managedCodeModuleInfo, fileNamePrefix).printToString()
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')
        fs.writeFileSync(path.join(managedOutDir, `${fileNamePrefix}Serializer${ext}`), serializerText, 'utf-8')
        fs.writeFileSync(path.join(managedOutDir, `SerializerBase${ext}`),
            readLangTemplate(`SerializerBase${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
        )
        fs.writeFileSync(path.join(managedOutDir, `DeserializerBase${ext}`),
            readLangTemplate(`DeserializerBase${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
        )
        fs.writeFileSync(path.join(managedOutDir, `CallbacksChecker${ext}`),
            readLangTemplate(`CallbacksChecker${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
                .replaceAll("%SERIALIZER_PATH%", managedCodeModuleInfo.serializerPath)
        )
    }
}

export function generateOhos(outDir: string, peerLibrary: PeerLibrary): void {
    const generatedSubDir = path.join(outDir, 'generated')
    const managedOutDir = path.join(generatedSubDir, peerLibrary.language.name.toLocaleLowerCase())
    if (!fs.existsSync(generatedSubDir)) fs.mkdirSync(outDir, { recursive: true })
    if (!fs.existsSync(managedOutDir)) fs.mkdirSync(managedOutDir, { recursive: true })

    const visitor = new OHOSVisitor(peerLibrary)
    visitor.execute(generatedSubDir, managedOutDir)
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
        returnType,
    }
}

function generateArgConvertor(library: PeerLibrary, param: IDLParameter): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return library.typeConvertor(param.name, param.type, param.isOptional)
}

// TODO drop this method
function generateCParameters(method: IDLMethod | IDLConstructor, argConvertors: ArgConvertor[], writer: LanguageWriter): string {
    let args = isConstructor(method) ? [] : [`${PrimitiveType.NativePointer} thisPtr`]
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

function suggestLibraryName(library: PeerLibrary) {
    let libraryName = library.files.filter(f => !f.isPredefined)[0].packageName()
    libraryName = libraryName.replaceAll("@", "").replaceAll(".", "_").toUpperCase()
    return libraryName
}