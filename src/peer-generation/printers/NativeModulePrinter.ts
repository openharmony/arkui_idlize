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
import * as idl from '../../idl'

class NativeModuleVisitor { 
    readonly nativeModulePredefined: Map<string, LanguageWriter>
    readonly nativeModule: LanguageWriter
    readonly nativeModuleEmpty: LanguageWriter
    nativeFunctions?: LanguageWriter

    protected readonly excludes = new Map<Language, Set<string>>([
        [Language.CJ, new Set([
            "StringData"
        ])],
        [Language.JAVA, new Set()],
        [Language.CPP, new Set()],
        [Language.TS, new Set()],
        [Language.ARKTS, new Set()],
    ])

    constructor(
        protected readonly library: PeerLibrary | IdlPeerLibrary,
    ) {
        this.nativeModule = createLanguageWriter(library.language)
        this.nativeModuleEmpty = createLanguageWriter(library.language)
        this.nativeModulePredefined = new Map()
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

    shouldPrintPredefineMethod(inputMethod:idl.IDLMethod): boolean {
        const langExcludes = this.excludes.get(this.library.language)
        if (langExcludes) {
            return !langExcludes.has(inputMethod.name)
        }
        return true
    }
    
    makeMethodFromIdl(inputMethod:idl.IDLMethod, printer: LanguageWriter): Method {
        const signature = printer.makeNamedSignature(
            inputMethod.returnType, 
            inputMethod.parameters
        )
        return new Method('_' + inputMethod.name, signature)
    }

    printPredefinedMethod(inputMethod:idl.IDLMethod, printer:LanguageWriter) {
        if (!this.shouldPrintPredefineMethod(inputMethod)) {
            return
        }
        
        const method = this.makeMethodFromIdl(inputMethod, printer)
        printer.writeNativeMethodDeclaration(method.name, method.signature)
        this.nativeModuleEmpty.writeMethodImplementation(method, (printer) => {
            printer.writePrintLog(method.name)
            if (method.signature.returnType !== undefined && method.signature.returnType.name !== 'void') {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(inputMethod.returnType))))
            }
        })
    }

    printPredefined() {
        this.nativeModuleEmpty.pushIndent()
        this.nativeFunctions?.pushIndent()
        for (const declaration of this.library.predefinedDeclarations) {
            const writer = createLanguageWriter(this.library.language)
            this.nativeModulePredefined.set(
                declaration.name, 
                writer               
            )
            writer.pushIndent()
            for (const method of declaration.methods) {
                this.printPredefinedMethod(method, writer)
            }
            writer.popIndent()
        }
        this.nativeFunctions?.popIndent()
        this.nativeModuleEmpty.popIndent()
    }

    print(): void {
        console.log(`Materialized classes: ${this.library.materializedClasses.size}`)
        this.printPredefined()
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
    private arrayLikeTypes = new Set([
        'Uint8Array', 'KUint8ArrayPtr', 'KInt32ArrayPtr', 'KFloat32ArrayPtr', 'Vec_u8', 'Vec_i32', 'Vec_f32'])
    private stringLikeTypes = new Set(['String', 'KString', 'KStringPtr', 'string', 'str'])

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
            if (returnType !== undefined 
                && returnType.name !== Type.Void.name
                && returnType.name !== idl.IDLTypes.void.name
                && returnType.name !== 'Void'
            ) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(returnType))))
            }
        })
        clazz.setGenerationContext(undefined)
    }

    override printPredefinedMethod(inputMethod:idl.IDLMethod, printer:LanguageWriter) {
        if (!this.shouldPrintPredefineMethod(inputMethod)) {
            return
        }
        const method = this.makeMethodFromIdl(inputMethod, printer)
        method.modifiers = [MethodModifier.PUBLIC, MethodModifier.STATIC]
        
        const foreightMethodName = method.name.substring(1)
        const func = printer.makeNativeMethodNamedSignature(inputMethod.returnType, inputMethod.parameters)

        this.nativeFunctions!.writeNativeMethodDeclaration(foreightMethodName, func)
        printer.writeMethodImplementation(method, printer => {
            printer.print('unsafe {')
            printer.pushIndent()
            const callParameters: string[] = []
            const cleanUpStmnts: string[] = []
            method.signature.args.forEach((arg, ordinal) => {
                const paramName = method.signature.argName(ordinal)
                if (this.arrayLikeTypes.has(arg.name) || arg.name.startsWith('ArrayList<')) {
                    const varName = `handle_${ordinal}`
                    callParameters.push(`${varName}.pointer`)
                    printer.writeStatement(printer.makeAssign(
                        varName, 
                        undefined, 
                        printer.makeString(`acquireArrayRawData(${paramName}.toArray())`), 
                        true
                    ))
                    cleanUpStmnts.push(`releaseArrayRawData(${varName})`)
                } else if (this.stringLikeTypes.has(arg.name)) {
                    const varName = `cstr_${ordinal}`
                    callParameters.push(varName)
                    printer.writeStatement(printer.makeAssign(
                        varName,
                        undefined,
                        printer.makeString(`LibC.mallocCString(${paramName})`),
                        true
                    ))
                    cleanUpStmnts.push(`LibC.free(${varName})`)
                } else {
                    callParameters.push(paramName)
                }
            })

            const resultVarName = 'result'
            let shouldReturn = false
            const callExpr = printer.makeFunctionCall(foreightMethodName, callParameters.map((x) => printer.makeString(x)))
            if (method.signature.returnType.name === 'void') {
                printer.writeStatement(printer.makeStatement(callExpr))
            } else {
                printer.writeStatement(
                    printer.makeAssign(
                        resultVarName,
                        undefined,
                        callExpr,
                        true
                    )
                )
                shouldReturn = true
            }
            cleanUpStmnts.forEach((str) => {
                printer.writeStatement(printer.makeStatement(printer.makeString(str)))
            })

            if (shouldReturn) {
                printer.writeStatement(printer.makeReturn(printer.makeString(resultVarName)))
            }
            printer.popIndent()
            printer.print('}')
        })

        this.nativeModuleEmpty.writeMethodImplementation(method, (printer) => {
            printer.writePrintLog(method.name)
            if (inputMethod.returnType !== undefined 
                && inputMethod.returnType.name !== Type.Void.name 
                && inputMethod.returnType.name !== idl.IDLTypes.void.name
                && inputMethod.returnType.name !== 'Void'
            ) {
                printer.writeStatement(printer.makeReturn(printer.makeString(getReturnValue(inputMethod.returnType))))
            }
        })
    }
}


export function printNativeModule(peerLibrary: PeerLibrary | IdlPeerLibrary, nativeBridgePath: string): string {
    const lang = peerLibrary.language
    const visitor = (lang == Language.CJ) ? new CJNativeModuleVisitor(peerLibrary) : new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleDeclaration(visitor.nativeModule, visitor.nativeModulePredefined, nativeBridgePath, false, lang, visitor.nativeFunctions)
}

export function printNativeModuleEmpty(peerLibrary: PeerLibrary | IdlPeerLibrary): string {
    const visitor = new NativeModuleVisitor(peerLibrary)
    visitor.print()
    return nativeModuleEmptyDeclaration(visitor.nativeModuleEmpty.getOutput())
}

function getReturnValue(type: idl.IDLType | Type): string {

    const pointers = new Set(['ptr'])
    const integrals = new Set([
        'bool',
        'i8',  'u8',
        'i16', 'u16',
        'i32', 'u32',
        'i64', 'u64'
    ])
    const numeric = new Set([
        ...integrals, 'f32', 'f64'
    ])
    const strings = new Set([
        'str'
    ])

    if (pointers.has(type.name)) {
        return '-1'
    }
    if (numeric.has(type.name)) {
        return '0'
    }
    if (strings.has(type.name)) {
        return `""`
    }

    switch(type.name) {
        case Type.Boolean.name : return "false"
        case Type.Number.name: case "int": case "KInt": case "KLong": return "1"
        case Type.Pointer.name: case "KPointer": case "pointer": return "-1"
        case "KString": case "String": case "string": return `"some string"`
        case "KBoolean": return "false"
        case "KFloat": return "0"
    }
    throw new Error(`Unknown return type: ${type.name}`)
}
