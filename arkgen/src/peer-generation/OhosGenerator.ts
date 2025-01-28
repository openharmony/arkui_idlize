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
import { IndentedPrinter, Language, capitalize, qualifiedName, generatorConfiguration, GeneratorConfiguration, setDefaultConfiguration, generatorTypePrefix } from '@idlize/core'
import { ArgConvertor, generateCallbackAPIArguments } from '@idlize/core'
import { createOutArgConvertor } from './PromiseConvertors'
import { ArkPrimitiveTypesInstance } from './ArkPrimitiveType'
import { getInteropRootPath, makeDeserializeAndCall, makeSerializerForOhos, readLangTemplate } from './FileGenerators'
import { getUniquePropertiesFromSuperTypes, isMaterialized } from './idl/IdlPeerGeneratorVisitor'
import { CppLanguageWriter, createLanguageWriter, ExpressionStatement, LanguageExpression, Method, MethodModifier, MethodSignature, NamedMethodSignature } from './LanguageWriters'
import { LanguageWriter, LanguageStatement, CppInteropConvertor } from '@idlize/core'
import { PeerLibrary } from './PeerLibrary'
import { printBridgeCcForOHOS } from './printers/BridgeCcPrinter'
import { printCallbacksKinds, printManagedCaller } from './printers/CallbacksPrinter'
import { writeDeserializer, writeSerializer } from './printers/SerializerPrinter'
import { CppSourceFile } from './printers/SourceFile'
import { StructPrinter } from './printers/StructPrinter'
import { NativeModule } from './NativeModule'
import { collapseSameMethodsIDL, groupOverloads, groupOverloadsIDL, OverloadsPrinter } from './printers/OverloadsPrinter'
import { MaterializedClass, MaterializedMethod } from './Materialized'
import { PeerMethod } from './PeerMethod'
import { writePeerMethod } from './printers/PeersPrinter'
import { PeerGeneratorConfig } from './PeerGeneratorConfig'

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

    hWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)
    cppWriter = new CppLanguageWriter(new IndentedPrinter(), this.library, new CppInteropConvertor(this.library), ArkPrimitiveTypesInstance)

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

    constructor(protected library: PeerLibrary, libraryName: string) {
        if (this.library.files.length == 0)
            throw new Error("No files in library")

        this.libraryName = libraryName
        this.library.name = libraryName

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
        const libName = this.libraryName
        const typeName = isEnum(type)
            ? type.name
            : isContainerType(type) || isUnionType(type)
                ? ''
                : idl.isOptionalType(type)
                    ? `Opt_${libName}_${this.mapType(type.type)}`
                    : idl.forceAsNamedNode(type).name
        if (OHOSVisitor.knownBasicTypes.has(typeName))
            return `${generatorConfiguration().param("TypePrefix")}${typeName}`

        if (isReferenceType(type) || isEnum(type)) {
            let name = `${generatorConfiguration().param("TypePrefix")}${this.libraryName}_${qualifiedName(type, Language.CPP)}`
            name = name.replaceAll(".","_")
            return name
        }
        return this.hWriter.getNodeName(type)
    }

    makeSignature(returnType: IDLType, parameters: IDLParameter[]): MethodSignature {
        return new MethodSignature(returnType, parameters.map(it => it.type!))
    }

    private writeCallback(callback: IDLCallback) {
        // TODO commonize with StructPrinter.ts
        const callbackTypeName = `${generatorConfiguration().param("TypePrefix")}${this.libraryName}_${callback.name}`;
        const args = generateCallbackAPIArguments(this.library, callback)
        let _ = this.hWriter
        _.print(`typedef struct ${callbackTypeName} {`)
        _.pushIndent()
        _.print(`${generatorTypePrefix()}CallbackResource resource;`)
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
            return `${generatorConfiguration().param("TypePrefix")}${this.libraryName}_Modifier`
        }
        return `${generatorConfiguration().param("TypePrefix")}${this.libraryName}_${clazz.name}Modifier`
    }
    private handleType(name: string): string {
        return `${generatorConfiguration().param("TypePrefix")}${this.libraryName}_${name}Handle`
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
        this.printPeer()
    }

    private printNative() {
        const className = `${this.libraryName}NativeModule`
        NativeModule.Generated.name = className
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

    private printPeer() {
        const nativeModuleVar = `${this.libraryName}NativeModule`
        if (this.library.language != Language.CJ) this.peerWriter.print('import { TypeChecker } from "./type_check"')
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
            const namespaces = idl.getNamespacesPathFor(data);
            if (this.peerWriter.language != Language.CJ) namespaces.forEach(ns => this.peerWriter.pushNamespace(ns.name, true));
            if (idl.isInterfaceSubkind(data)) {
                this.peerWriter.writeInterface(data.name, writer => {
                    data.properties.forEach(prop => {
                        writer.writeFieldDeclaration(prop.name, prop.type, [], prop.isOptional)
                    })
                })
            } else if (idl.isClassSubkind(data)) {
                this.peerWriter.writeClass(data.name, writer => {
                    data.properties.forEach(prop => {
                        writer.writeFieldDeclaration(prop.name, prop.type, [], prop.isOptional)
                    })
                })
            }
            if (this.peerWriter.language != Language.CJ) namespaces.forEach(() => this.peerWriter.popNamespace(true));
        })
        this.enums.forEach(e => {
            const writer = this.peerWriter
            writer.writeStatement(writer.makeEnumEntity(e, true))
        })

        const ifaces: Array<idl.IDLInterface> = this.interfaces.concat(this.data);
        ifaces.forEach(int => {
            if (hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)) {
                return
            }
            const superTypes = int.inheritance.filter(it => it !== idl.IDLTopType).map(superClass => `${superClass.name}Interface`)
            this.peerWriter.writeInterface(`${int.name}Interface`, writer => {
                int.properties.forEach(prop => {
                    writer.writeFieldDeclaration(prop.name, prop.type, [], idl.isOptionalType(prop.type))
                })
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
            const namespaces = idl.getNamespacesPathFor(int);
            if (this.peerWriter.language != Language.CJ) namespaces.forEach(ns => this.peerWriter.pushNamespace(ns.name, true));
            const isGlobalScope = hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)

            const superType = idl.getSuperType(int)

            this.peerWriter.writeClass(`${int.name}`, writer => {
                let peerInitExpr: LanguageExpression | undefined = undefined
                if (this.library.language === Language.ARKTS && int.constructors.length === 0) {
                    peerInitExpr = writer.makeString("Finalizable.Empty")
                }
                // TODO Make peer private again
                writer.writeFieldDeclaration('peer', createReferenceType("Finalizable"), [/* FieldModifier.PRIVATE */], false, peerInitExpr)
                const peerPtr = "this.peer!.ptr"
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

            }, superType?.name, isGlobalScope ? undefined : [`${int.name}Interface`])

            // TODO Migrate to MaterializedPrinter
            if (int.constructors.length === 0) {
                // Write MaterializedClass static
                if (!hasExtAttribute(int, IDLExtendedAttributes.GlobalScope)) {
                    this.peerWriter.writeClass(`${int.name}Internal`, writer => {
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
                                    writer.makeString(`new Finalizable(ptr, ${int.name}.getFinalizer())`), false),
                            )
                            writer.writeStatement(writer.makeReturn(writer.makeString(objVar)))
                        })
                    })
                }
            }
            if (this.peerWriter.language != Language.CJ) namespaces.forEach(() => this.peerWriter.popNamespace(true));
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
        const interopRootPath = getInteropRootPath()
        const interopTypesPath = path.resolve(interopRootPath, 'src', 'cpp', 'interop-types.h')
        const interopTypesContent = fs.readFileSync(interopTypesPath, 'utf-8')
        this.hWriter.writeLines(
            readLangTemplate('ohos_api_prologue.h', Language.CPP)
                .replaceAll("%INTEROP_TYPES_HEADER", interopTypesContent)
                .replaceAll("%INCLUDE_GUARD_DEFINE%", `OH_${this.libraryName.toUpperCase()}_H`)
                .replaceAll("%LIBRARY_NAME%", this.libraryName.toUpperCase())
        )

        let toStringsPrinter = createLanguageWriter(Language.CPP, this.library)
        new StructPrinter(this.library).generateStructs(this.hWriter, this.hWriter.printer, toStringsPrinter, true)
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

    execute(rootProject: string, outDir: string, managedOutDir: string) {

        const params: Record<string, any> = {
            TypePrefix: "OH_",
            LibraryPrefix: `${this.libraryName}_`,
            OptionalPrefix: "Opt_"
        }
        setDefaultConfiguration(new OhosConfiguration(params))

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
            finalizablePath: `@koalaui/interop`,
        }

        let nativeModuleName = managedCodeModuleInfo.path.replace('./', '')

        if (this.library.language === Language.ARKTS) {
            nativeModuleName = path.join(`@${this.libraryName.toLowerCase()}/${managedOutDir}`, nativeModuleName)
        }

        const nativeModuleTemplate = readLangTemplate(`OHOSNativeModule_template${ext}`, this.library.language)
        const nativeModuleText = nativeModuleTemplate
            .replaceAll('%NATIVE_MODULE_NAME%', this.libraryName)
            .replaceAll('%NATIVE_MODULE_CONTENT%', this.nativeWriter.getOutput().join('\n'))
            .replaceAll('%NATIVE_FUNCTIONS%', this.nativeFunctionsWriter.getOutput().join('\n'))
            .replaceAll('%ARKUI_FUNCTIONS%', this.arkUIFunctionsWriter.getOutput().join('\n'))
            .replaceAll('%OUTPUT_FILE%', nativeModuleName)
        fs.writeFileSync(path.join(rootProject, managedOutDir, `${managedCodeModuleInfo.path}${ext}`), nativeModuleText, 'utf-8')

        fs.writeFileSync(path.join(rootProject, managedOutDir, `${fileNamePrefix}Finalizable${ext}`),
            readLangTemplate(`OHOSFinalizable_template${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
        )

        const peerTemplate = readLangTemplate(`OHOSPeer_template${ext}`, this.library.language)
        const peerText = peerTemplate
            .replaceAll('%PEER_CONTENT%', this.peerWriter.getOutput().join('\n'))
            .replaceAll('%SERIALIZER_PATH%', managedCodeModuleInfo.serializerPath)
            .replaceAll('%FINALIZABLE_PATH%', managedCodeModuleInfo.finalizablePath)
        fs.writeFileSync(path.join(rootProject, managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')

        this.hWriter.printTo(path.join(rootProject, outDir, `${fileNamePrefix}.h`))
        this.cppWriter.printTo(path.join(rootProject, outDir, `${fileNamePrefix}.cc`))

        fs.writeFileSync(path.join(rootProject, outDir, this.implementationStubsFile.name),
            this.implementationStubsFile.printToString()
        )
        
        const serializerText = makeSerializerForOhos(this.library, managedCodeModuleInfo, fileNamePrefix).printToString()
        fs.writeFileSync(path.join(rootProject, managedOutDir, `${fileNamePrefix}${ext}`), peerText, 'utf-8')
        fs.writeFileSync(path.join(rootProject, managedOutDir, `${fileNamePrefix}Serializer${ext}`), serializerText, 'utf-8')
        fs.writeFileSync(path.join(rootProject, managedOutDir, `CallbacksChecker${ext}`),
            readLangTemplate(`CallbacksChecker${ext}`, this.library.language)
                .replaceAll("%NATIVE_MODULE_ACCESSOR%", managedCodeModuleInfo.name)
                .replaceAll("%NATIVE_MODULE_PATH%", managedCodeModuleInfo.path)
                .replaceAll("%SERIALIZER_PATH%", managedCodeModuleInfo.serializerPath)
        )

        generateTypeCheckFile(path.join(rootProject, managedOutDir), this.library.language)
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

export function generateOhos(outDir: string, peerLibrary: PeerLibrary, defaultIdlPackage?: string): void {
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
    const visitor = new OHOSVisitor(peerLibrary, libraryName)
    visitor.execute(rootPath, generatedSubDir, managedOutDir)
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

function suggestLibraryName(library: PeerLibrary) {
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

export class OhosConfiguration implements GeneratorConfiguration {

    constructor(private params: Record<string, any>) {
    }

    param<T>(name: string): T {
        if (name in this.params) {
            return this.params[name] as T;
        }
        throw new Error(`${name} is unknown`)
    }
    paramArray<T>(name: string): T[] {
        switch (name) {
            case 'rootComponents': return PeerGeneratorConfig.rootComponents as T[]
            case 'standaloneComponents': return PeerGeneratorConfig.standaloneComponents as T[]
            case 'knownParameterized': return PeerGeneratorConfig.knownParametrized as T[]
        }
        throw new Error(`array ${name} is unknown`)
    }
}