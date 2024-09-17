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

import { generateEventsBridgeSignature } from "./EventsPrinter";
import { nativeModuleDeclaration, nativeModuleEmptyDeclaration } from "../FileGenerators";
import { FunctionCallExpression, LanguageExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, StringExpression, Type, createLanguageWriter } from "../LanguageWriters";
import { PeerClass, PeerClassBase } from "../PeerClass";
import { PeerLibrary } from "../PeerLibrary";
import { PeerMethod } from "../PeerMethod";
import { IdlPeerClass } from "../idl/IdlPeerClass";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { IdlPeerMethod } from "../idl/IdlPeerMethod";
import { Language } from "../../util";

class NativeModuleVisitor {
    readonly nativeModule: LanguageWriter
    readonly nativeModuleEmpty: LanguageWriter
    nativeFunctions?: LanguageWriter

    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
    ) {
        this.nativeModule = createLanguageWriter(library.language)
        this.nativeModuleEmpty = createLanguageWriter(library.language)
    }

    protected printPeerMethods(peer: PeerClass | IdlPeerClass) {
        peer.methods.forEach(it => this.printPeerMethod(peer, it, this.nativeModule, this.nativeModuleEmpty, undefined, this.nativeFunctions))
    }

    protected printMaterializedMethods(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter) {
        this.library.materializedToGenerate.forEach(clazz => {
            this.printPeerMethod(clazz, clazz.ctor, nativeModule, nativeModuleEmpty, Type.Pointer)
            this.printPeerMethod(clazz, clazz.finalizer, nativeModule, nativeModuleEmpty, Type.Pointer)
            clazz.methods.forEach(method => {
                const returnType = method.tsReturnType()
                this.printPeerMethod(clazz, method, nativeModule, nativeModuleEmpty,
                    returnType?.isPrimitive() ? returnType : Type.Pointer)
            })
        })
    }

    protected printEventMethods(nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter) {
        let method = generateEventsBridgeSignature(nativeModule.language)
        method = new Method(`_${method.name}`, method.signature, method.modifiers)
        nativeModule.writeNativeMethodDeclaration(method.name, method.signature)
        nativeModuleEmpty.writeMethodImplementation(method, writer => {
            writer.writePrintLog(method.name)
            writer.writeStatement(writer.makeReturn(new StringExpression(`0`)))
        })
    }

    printPeerMethod(clazz: PeerClassBase, method: PeerMethod | IdlPeerMethod, nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter,
        returnType?: Type,
        nativeFunctions?: LanguageWriter
    ) {
        const component = clazz.generatedName(method.isCallSignature)
        clazz.setGenerationContext(`${method.isCallSignature ? "" : method.overloadedName}()`)
        let serializerArgCreated = false
        let args: ({name: string, type: string})[] = []
        for (let i = 0; i < method.argConvertors.length; ++i) {
            let it = method.argConvertors[i]
            if (it.useArray) {
                if (!serializerArgCreated) {
                    const array = `thisSerializer`
                    args.push({ name: `thisArray`, type: 'Uint8Array' }, { name: `thisLength`, type: 'int32' })
                    serializerArgCreated = true
                }
            } else {
                // TODO: use language as argument of interop type.
                args.push({ name: `${it.param}`, type: it.interopType(nativeModule.language) })
            }
        }
        let maybeReceiver = method.hasReceiver() ? [{ name: 'ptr', type: 'KPointer' }] : []
        const parameters = NamedMethodSignature.make(returnType?.name ?? 'void', maybeReceiver.concat(args))
        let name = `_${component}_${method.overloadedName}`

        nativeModule.writeNativeMethodDeclaration(name, parameters)
        
        nativeModuleEmpty.writeMethodImplementation(new Method(name, parameters), (printer) => {
            printer.writePrintLog(name)
            if (returnType !== undefined && returnType.name !== Type.Void.name) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(returnType))))
            }
        })
        clazz.setGenerationContext(undefined)
    }

    print(): void {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        this.nativeModule.pushIndent()
        this.nativeModuleEmpty.pushIndent()
        for (const file of this.library.files) {
            for (const peer of file.peersToGenerate.values()) {
                this.printPeerMethods(peer)
            }
        }
        this.printMaterializedMethods(this.nativeModule, this.nativeModuleEmpty)
        if(!(this.nativeModule.language == Language.CJ)) this.printEventMethods(this.nativeModule, this.nativeModuleEmpty)
        this.nativeModule.popIndent()
        this.nativeModuleEmpty.popIndent()
    }
}

class CJNativeModuleVisitor extends NativeModuleVisitor {
    private arrayLikeTypes = new Set(['Uint8Array'])
    private stringLikeTypes = new Set(['String'])

    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
    ) {
        super(library)
        this.nativeFunctions = createLanguageWriter(library.language)
    }

    override printPeerMethod(clazz: PeerClassBase, method: PeerMethod | IdlPeerMethod, nativeModule: LanguageWriter, nativeModuleEmpty: LanguageWriter,
        returnType?: Type,
        nativeFunctions?: LanguageWriter
    ) {
        const component = clazz.generatedName(method.isCallSignature)
        clazz.setGenerationContext(`${method.isCallSignature ? "" : method.overloadedName}()`)
        let serializerArgCreated = false
        let args: ({name: string, type: string})[] = []
        for (let i = 0; i < method.argConvertors.length; ++i) {
            let it = method.argConvertors[i]
            if (it.useArray) {
                if (!serializerArgCreated) {
                    const array = `thisSerializer`
                    args.push({ name: `thisArray`, type: 'Uint8Array' }, { name: `thisLength`, type: 'int32' })
                    serializerArgCreated = true
                }
            } else {
                // TODO: use language as argument of interop type.
                args.push({ name: `${it.param}`, type: it.interopType(nativeModule.language) })
            }
        }
        let maybeReceiver = method.hasReceiver() ? [{ name: 'ptr', type: 'KPointer' }] : []
        const parameters = NamedMethodSignature.make(returnType?.name ?? 'void', maybeReceiver.concat(args))
        let name = `_${component}_${method.overloadedName}`
        let nativeName = name.substring(1)
        nativeModule.writeMethodImplementation(new Method(name, parameters, [MethodModifier.PUBLIC, MethodModifier.STATIC]), (printer) => {
            let functionCallArgs: Array<string> = []
            printer.print('unsafe {')
            printer.pushIndent()
            for(let param of parameters.args) {
                let ordinal = parameters.args.indexOf(param)
                if (this.arrayLikeTypes.has(param.name)) {
                    functionCallArgs.push(`handle_${ordinal}.pointer`)
                    printer.print(`let handle_${ordinal} = acquireArrayRawData(${parameters.argsNames[ordinal]}.toArray())`)
                } else if (this.stringLikeTypes.has(param.name)) {
                    printer.print(`let ${parameters.argsNames[ordinal]} =  LibC.mallocCString(${parameters.argsNames[ordinal]})`)
                    functionCallArgs.push(parameters.argsNames[ordinal])
                } else {
                    functionCallArgs.push(parameters.argsNames[ordinal])
                }
            }
            printer.print(`${new FunctionCallExpression(nativeName, functionCallArgs.map(it => printer.makeString(it))).asString()}`)
            for(let param of parameters.args) {
                let ordinal = parameters.args.indexOf(param)
                if (this.arrayLikeTypes.has(param.name)) {
                    printer.print(`releaseArrayRawData(handle_${ordinal})`)
                } else if (this.stringLikeTypes.has(param.name)) {
                    printer.print(`LibC.free(${parameters.argsNames[ordinal]})`)
                }
            }
            printer.popIndent()
            printer.print('}')
        })
        nativeFunctions!.pushIndent()
        nativeFunctions!.writeNativeMethodDeclaration(nativeName, parameters)
        nativeFunctions!.popIndent()

        nativeModuleEmpty.writeMethodImplementation(new Method(name, parameters), (printer) => {
            printer.writePrintLog(name)
            if (returnType !== undefined && returnType.name !== Type.Void.name) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(returnType))))
            }
        })
        clazz.setGenerationContext(undefined)
    }
}


export function printNativeModule(peerLibrary: PeerLibrary | IdlPeerLibrary, nativeBridgePath: string): string {
    const lang = peerLibrary.language
    const visitor = (lang == Language.CJ) ? new CJNativeModuleVisitor(peerLibrary) : new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleDeclaration(visitor.nativeModule, nativeBridgePath, false, lang, visitor.nativeFunctions)
}

export function printNativeModuleEmpty(peerLibrary: PeerLibrary | IdlPeerLibrary): string {
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleEmptyDeclaration(visitor.nativeModuleEmpty.getOutput())
}

function getReturnValue(type: Type): string {
    switch(type.name) {
        case Type.Boolean.name : return "false"
        case Type.Number.name: return "1"
        case Type.Pointer.name: return "-1"
        case "string": return `"some string"`
    }
    throw new Error(`Unknown return type: ${type.name}`)
}
